import { walletRepository } from "@/database/repositories/wallet-repository";
import { goalRepository } from "@/database/repositories/goal-repository";
import { transactionRepository } from "@/database/repositories/transaction-repository";
import { budgetRepository } from "@/database/repositories/budget-repository";
import { distributionRepository } from "@/database/repositories/distribution-repository";
import type { WalletType } from "@/types";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export interface AIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

interface GeminiContent {
  role: "user" | "model" | "function";
  parts: GeminiPart[];
}

const WELCOME_MESSAGE = `¡Hola! Soy tu asistente financiero de RideControl 🤖

Puedo ayudarte a:
- Analizar tus ingresos, gastos y hábitos de trabajo
- Recomendarte cómo mejorar tus finanzas
- Ajustar la distribución de tus carteras de ahorro
- Crear y dar seguimiento a tus metas financieras

¿Qué deseas hacer hoy?`;

export function getWelcomeMessage(): AIMessage {
  return { role: "assistant", content: WELCOME_MESSAGE };
}

let activeProfileId: string | null = null;

export function setActiveProfile(id: string) {
  activeProfileId = id;
}

const toolHandlers: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
  getAppOverview: async () => {
    if (!activeProfileId) return "Error: no hay perfil activo";
    return getAppOverview(activeProfileId);
  },
  getRecentTransactions: async (args) => {
    if (!activeProfileId) return "Error: no hay perfil activo";
    const limit = (args.limit as number) ?? 20;
    const transactions = await transactionRepository.getByProfile(activeProfileId);
    const sliced = transactions.slice(0, limit);
    if (sliced.length === 0) return "No hay transacciones registradas.";
    return sliced
      .map(
        (t) =>
          `- ${t.type === "income" ? "Ingreso" : "Gasto"} | ${t.category} | $${t.amount.toLocaleString("es-CO")} | ${t.date ? new Date(t.date).toLocaleDateString("es-CO") : "N/A"}${t.description ? ` | "${t.description}"` : ""}`,
      )
      .join("\n");
  },
  getGoals: async () => {
    if (!activeProfileId) return "Error: no hay perfil activo";
    const goals = await goalRepository.getByProfile(activeProfileId);
    if (goals.length === 0) return "No hay metas registradas.";
    return goals
      .map(
        (g) =>
          `- "${g.title}" | Estado: ${g.isCompleted ? "Completada ✅" : "Activa"} | $${g.currentAmount.toLocaleString("es-CO")} / $${g.targetAmount.toLocaleString("es-CO")} (${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}%)${g.deadline ? ` | Vence: ${new Date(g.deadline).toLocaleDateString("es-CO")}` : ""}`,
      )
      .join("\n");
  },
  getWallets: async () => {
    if (!activeProfileId) return "Error: no hay perfil activo";
    const wallets = await walletRepository.getByProfile(activeProfileId);
    if (wallets.length === 0) return "No hay carteras configuradas.";
    return wallets
      .map((w) => `- ${w.name}: ${w.percentage}% | Saldo: $${(w.balance ?? 0).toLocaleString("es-CO")}`)
      .join("\n");
  },
  getDistributionHistory: async (args) => {
    if (!activeProfileId) return "Error: no hay perfil activo";
    const limit = (args.limit as number) ?? 10;
    const distributions = await distributionRepository.getByProfile(activeProfileId);
    const sliced = distributions.slice(-limit).reverse();
    if (sliced.length === 0) return "No hay distribuciones registradas.";
    return sliced
      .map(
        (d) =>
          `- ${d.date ? new Date(d.date).toLocaleDateString("es-CO") : "N/A"}: ingresos $${(d.earnings ?? 0).toLocaleString("es-CO")}, combustible $${(d.fuelCost ?? 0).toLocaleString("es-CO")}, gastos $${(d.expenses ?? 0).toLocaleString("es-CO")}, neto $${(d.netIncome ?? 0).toLocaleString("es-CO")}`,
      )
      .join("\n");
  },
  updateWalletPercentages: async (args) => {
    if (!activeProfileId) return "Error: no hay perfil activo";
    const pct = args as Record<string, number>;
    const total = Object.values(pct).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 100) > 0.01) {
      return `Error: los porcentajes deben sumar 100. La suma actual es ${total.toFixed(1)}.`;
    }
    const wallets = await walletRepository.getByProfile(activeProfileId);
    for (const wallet of wallets) {
      const newPct = pct[wallet.type as WalletType];
      if (newPct !== undefined) {
        await walletRepository.update(wallet.id, { percentage: newPct });
      }
    }
    return `Porcentajes actualizados: Moto ${pct.moto}%, Ahorro ${pct.ahorro}%, Inversiones ${pct.inversiones}%, Personales ${pct.personales}%`;
  },
  createGoal: async (args) => {
    if (!activeProfileId) return "Error: no hay perfil activo";
    const title = args.title as string;
    const targetAmount = args.targetAmount as number;
    const currentAmount = (args.currentAmount as number) ?? 0;
    const deadline = args.deadline ? new Date(args.deadline as string) : undefined;
    await goalRepository.create({
      profileId: activeProfileId,
      title,
      targetAmount: Math.round(targetAmount),
      currentAmount: Math.round(currentAmount),
      deadline,
      isCompleted: false,
    });
    return `Meta "${title}" creada con objetivo de $${targetAmount.toLocaleString("es-CO")}.${deadline ? ` Fecha límite: ${deadline.toLocaleDateString("es-CO")}.` : ""}`;
  },
  updateGoalProgress: async (args) => {
    if (!activeProfileId) return "Error: no hay perfil activo";
    const goalId = args.goalId as string;
    const amount = args.amount as number;
    await goalRepository.addToGoal(goalId, Math.round(amount));
    return `Se agregaron $${Math.round(amount).toLocaleString("es-CO")} a la meta.`;
  },
};

async function getAppOverview(profileId: string): Promise<string> {
  const wallets = await walletRepository.getByProfile(profileId);
  const goals = await goalRepository.getByProfile(profileId);
  const transactions = await transactionRepository.getByProfile(profileId);
  const budgets = await budgetRepository.getByProfile(profileId);
  const distributions = await distributionRepository.getByProfile(profileId);

  const walletSummary = wallets
    .map((w) => `${w.name}: ${w.percentage}% (${w.balance ? "$" + w.balance.toLocaleString("es-CO") : "$0"})`)
    .join("\n");
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);
  const goalSummary = activeGoals
    .map((g) => `- "${g.title}": $${g.currentAmount.toLocaleString("es-CO")} / $${g.targetAmount.toLocaleString("es-CO")} (${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}%)${g.deadline ? `, vence: ${new Date(g.deadline).toLocaleDateString("es-CO")}` : ""}`)
    .join("\n");
  const transactionSummary = transactions
    .slice(0, 30)
    .map((t) => `- ${t.type === "income" ? "Ingreso" : "Gasto"} | ${t.category} | $${t.amount.toLocaleString("es-CO")} | ${t.date ? new Date(t.date).toLocaleDateString("es-CO") : "N/A"}${t.description ? ` | "${t.description}"` : ""}`)
    .join("\n");
  const budgetSummary = budgets
    .map((b) => `- ${b.category}: $${b.monthlyLimit.toLocaleString("es-CO")}/mes`)
    .join("\n");
  const distSummary = distributions
    .slice(-10)
    .reverse()
    .map((d) => `- ${d.date ? new Date(d.date).toLocaleDateString("es-CO") : "N/A"}: ingresos $${(d.earnings ?? 0).toLocaleString("es-CO")}, neto $${(d.netIncome ?? 0).toLocaleString("es-CO")}`)
    .join("\n");

  return `RESUMEN DEL USUARIO:\n\nCarteras:\n${walletSummary || "Sin carteras"}\n\nMetas activas:\n${goalSummary || "Sin metas activas"}${completedGoals.length > 0 ? `\nCompletadas: ${completedGoals.length}` : ""}\n\nTransacciones recientes:\n${transactionSummary || "Sin transacciones"}\n\nPresupuestos:\n${budgetSummary || "Sin presupuestos"}\n\nDistribuciones:\n${distSummary || "Sin distribuciones"}`;
}

const functionDeclarations = [
  { name: "getAppOverview", description: "Obtiene resumen completo de datos del usuario: carteras, metas, transacciones, presupuestos y distribución", parameters: { type: "object", properties: {} } },
  { name: "getRecentTransactions", description: "Obtiene las transacciones más recientes", parameters: { type: "object", properties: { limit: { type: "number", description: "Cantidad (default 20)" } } } },
  { name: "getGoals", description: "Obtiene todas las metas financieras", parameters: { type: "object", properties: {} } },
  { name: "getWallets", description: "Obtiene carteras y saldos", parameters: { type: "object", properties: {} } },
  { name: "getDistributionHistory", description: "Obtiene historial de distribuciones", parameters: { type: "object", properties: { limit: { type: "number", description: "Cantidad (default 10)" } } } },
  { name: "updateWalletPercentages", description: "Actualiza porcentajes de distribución. Deben sumar 100.", parameters: { type: "object", properties: { moto: { type: "number" }, ahorro: { type: "number" }, inversiones: { type: "number" }, personales: { type: "number" } }, required: ["moto", "ahorro", "inversiones", "personales"] } },
  { name: "createGoal", description: "Crea una nueva meta financiera", parameters: { type: "object", properties: { title: { type: "string" }, targetAmount: { type: "number" }, currentAmount: { type: "number" }, deadline: { type: "string" } }, required: ["title", "targetAmount"] } },
  { name: "updateGoalProgress", description: "Agrega dinero a una meta", parameters: { type: "object", properties: { goalId: { type: "string" }, amount: { type: "number" } }, required: ["goalId", "amount"] } },
];

function convertToGemini(messages: AIMessage[]): GeminiContent[] {
  const result: GeminiContent[] = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    if (m.role === "user") {
      result.push({ role: "user", parts: [{ text: m.content }] });
    } else if (m.role === "assistant") {
      const parts: GeminiPart[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.tool_calls) {
        for (const tc of m.tool_calls) {
          parts.push({ functionCall: { name: tc.function.name, args: JSON.parse(tc.function.arguments) } });
        }
      }
      result.push({ role: "model", parts });
    } else if (m.role === "tool") {
      result.push({
        role: "function",
        parts: [{
          functionResponse: {
            name: findFunctionName(messages, m.tool_call_id || ""),
            response: { response: m.content },
          },
        }],
      });
    }
  }
  return result;
}

function findFunctionName(messages: AIMessage[], callId: string): string {
  for (const m of messages) {
    if (m.tool_calls) {
      for (const tc of m.tool_calls) {
        if (tc.id === callId) return tc.function.name;
      }
    }
  }
  return "unknown";
}

function convertFromGemini(text: string, functionCalls?: Array<{ name: string; args: Record<string, unknown> }>): { content: string; tool_calls?: ToolCall[] } {
  const toolCalls = functionCalls?.map((fc, i) => ({
    id: `call_${i}`,
    type: "function" as const,
    function: {
      name: fc.name,
      arguments: JSON.stringify(fc.args),
    },
  }));
  return { content: text || "", tool_calls: toolCalls?.length ? toolCalls : undefined };
}

export async function* chatStream(
  messages: AIMessage[],
  maxToolRounds = 5,
): AsyncGenerator<string> {
  let currentMessages: AIMessage[] = [...messages];

  for (let round = 0; round < maxToolRounds; round++) {
    const geminiContents = convertToGemini(currentMessages);

    const body: Record<string, unknown> = {
      contents: geminiContents,
      tools: [{ functionDeclarations }],
      systemInstruction: {
        role: "user",
        parts: [{ text: "Eres un asistente financiero inteligente integrado en RideControl, una app para trabajadores independientes (delivery, transporte, reparto).\n\nTu rol es ayudar al usuario a analizar sus finanzas, dar recomendaciones personalizadas y ajustar la configuración de la app.\n\nSiempre responde en español de forma amigable y conversacional. Usa emojis ocasionales.\n\nCuando el usuario pida cambiar algo, primero confirma con un resumen antes de ejecutar." }],
      },
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`Error de API (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error("No se recibió respuesta de la IA");

    const content = candidate.content;
    const parts: GeminiPart[] = content?.parts || [];

    let text = "";
    const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

    for (const part of parts) {
      if (part.text) text += part.text;
      if (part.functionCall) functionCalls.push(part.functionCall);
    }

    const converted = convertFromGemini(text, functionCalls.length ? functionCalls : undefined);
    const responseMsg: AIMessage = {
      role: "assistant",
      content: converted.content,
      tool_calls: converted.tool_calls,
    };

    currentMessages.push(responseMsg);

    if (converted.content) {
      yield converted.content;
    }

    if (!converted.tool_calls || converted.tool_calls.length === 0) {
      return;
    }

    for (const toolCall of converted.tool_calls) {
      const name = toolCall.function.name;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = {};
      }

      const handler = toolHandlers[name];
      let result: string;
      if (handler) {
        try {
          result = await handler(args);
        } catch (err) {
          result = `Error al ejecutar ${name}: ${err instanceof Error ? err.message : String(err)}`;
        }
      } else {
        result = `Error: la herramienta "${name}" no está disponible`;
      }

      currentMessages.push({
        role: "tool",
        content: result,
        tool_call_id: toolCall.id,
      });
    }
  }
}

import { useState, useMemo } from "react";
import { Plus, X, TrendingUp, TrendingDown, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTransactions } from "@/hooks/use-transactions";
import { transactionRepository } from "@/database/repositories/transaction-repository";
import { useAppStore } from "@/store/use-app-store";
import {
  CATEGORY_LABELS, INCOME_CATEGORIES, EXPENSE_CATEGORIES,
  type TransactionCategory, type Transaction,
} from "@/types";
import { formatCurrency } from "@/lib/utils";
import { transactionSchema } from "@/lib/schemas";

export function TransactionsTab() {
  const profile = useAppStore((s) => s.profile);
  const { transactions } = useTransactions();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ type: "expense" as "income" | "expense", category: "comida" as TransactionCategory, amount: "", date: new Date().toISOString().slice(0, 10), description: "" });
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => {
    let items = transactions;
    if (filterType !== "all") items = items.filter((t) => t.type === filterType);
    if (search) items = items.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [transactions, filterType, search]);

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function resetForm() {
    setForm({ type: "expense", category: "comida", amount: "", date: new Date().toISOString().slice(0, 10), description: "" });
    setFormError("");
    setEditing(null);
  }

  async function handleSubmit() {
    if (!profile) return;
    const parsed = transactionSchema.safeParse({
      type: form.type,
      category: form.category,
      amount: parseFloat(form.amount),
      date: new Date(form.date),
      description: form.description,
    });
    if (!parsed.success) { setFormError(parsed.error.issues[0].message); return; }
    setFormError("");
    if (editing) {
      await transactionRepository.update(editing.id, parsed.data);
    } else {
      await transactionRepository.create({ ...parsed.data, profileId: profile.id });
    }
    resetForm();
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    await transactionRepository.delete(id);
  }

  const incomeTotal = useMemo(() => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const expenseTotal = useMemo(() => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setForm({ type: tx.type, category: tx.category, amount: String(tx.amount), date: new Date(tx.date).toISOString().slice(0, 10), description: tx.description });
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card p-3 border border-theme-subtle">
          <p className="text-[10px] text-secondary-color uppercase tracking-wider">Ingresos</p>
          <p className="mt-0.5 text-lg font-semibold text-success-500">{formatCurrency(incomeTotal)}</p>
        </div>
        <div className="rounded-xl bg-card p-3 border border-theme-subtle">
          <p className="text-[10px] text-secondary-color uppercase tracking-wider">Gastos</p>
          <p className="mt-0.5 text-lg font-semibold text-danger-500">{formatCurrency(expenseTotal)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-color" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="h-9 w-full rounded-xl border border-theme-subtle bg-input pl-9 pr-3 text-sm text-primary-color placeholder:text-muted-color outline-none"
          />
        </div>
        <div className="flex rounded-xl border border-theme-subtle overflow-hidden">
          {(["all", "income", "expense"] as const).map((f) => (
            <button key={f} onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterType === f ? "bg-primary-500 text-on-primary" : "bg-card text-secondary-color hover:text-primary-color"}`}
            >
              {f === "all" ? "Todas" : f === "income" ? "Ingresos" : "Gastos"}
            </button>
          ))}
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-on-primary shrink-0"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl bg-card p-4 border border-theme-subtle space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-color">{editing ? "Editar" : "Nueva"} transacción</span>
              <button onClick={() => { resetForm(); setShowForm(false); }} className="text-muted-color hover:text-primary-color">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setForm({ ...form, type: "expense", category: "comida" })}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${form.type === "expense" ? "bg-danger-500/10 text-danger-500" : "bg-hover text-secondary-color"}`}
              >Gasto</button>
              <button onClick={() => setForm({ ...form, type: "income", category: "trabajo" })}
                className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${form.type === "income" ? "bg-success-500/10 text-success-500" : "bg-hover text-secondary-color"}`}
              >Ingreso</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setForm({ ...form, category: cat })}
                  className={`rounded-lg px-3 py-2 text-xs font-medium text-left transition-colors ${form.category === cat ? "bg-primary-500/10 text-primary-500 border border-primary-500/30" : "bg-hover text-secondary-color border border-transparent"}`}
                >{CATEGORY_LABELS[cat]}</button>
              ))}
            </div>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción" className="h-9 w-full rounded-xl border border-theme-subtle bg-input px-3 text-sm text-primary-color placeholder:text-muted-color outline-none"
            />
            <div className="flex gap-2">
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Monto" className="h-9 flex-1 rounded-xl border border-theme-subtle bg-input px-3 text-sm text-primary-color placeholder:text-muted-color outline-none"
              />
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-9 w-40 rounded-xl border border-theme-subtle bg-input px-3 text-sm text-primary-color outline-none"
              />
            </div>
            {formError && <p className="text-xs text-danger-500">{formError}</p>}
            <button onClick={handleSubmit}
              className="w-full rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-on-primary"
            >{editing ? "Guardar cambios" : "Agregar transacción"}</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Filter className="mb-2 h-8 w-8 text-muted-color" />
            <p className="text-sm text-muted-color">No hay transacciones</p>
          </div>
        )}
        {filtered.map((tx) => {
          return (
            <motion.div key={tx.id} layout
              className="flex items-center justify-between rounded-xl bg-card px-3 py-2.5 border border-theme-subtle cursor-pointer hover:bg-hover transition-colors"
              onClick={() => openEdit(tx)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tx.type === "income" ? "bg-success-500/10" : "bg-danger-500/10"}`}>
                  {tx.type === "income" ? (
                    <TrendingUp className="h-4 w-4 text-success-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-danger-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary-color truncate">{tx.description}</p>
                  <p className="text-[10px] text-muted-color">{CATEGORY_LABELS[tx.category]} · {new Date(tx.date).toLocaleDateString("es")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className={`text-sm font-semibold ${tx.type === "income" ? "text-success-500" : "text-danger-500"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                  className="text-muted-color hover:text-danger-500 transition-colors"
                ><X className="h-3.5 w-3.5" /></button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

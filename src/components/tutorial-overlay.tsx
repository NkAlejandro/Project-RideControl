import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  CalendarCheck,
  Fuel,
  PieChart,
  BarChart3,
  Sparkles,
  Bike,
} from "lucide-react";

const STEPS = [
  {
    icon: Sparkles,
    title: "Bienvenido a RideControl",
    desc: "Controla tus ingresos, gastos, vehículos y más, todo en un solo lugar. Funciona incluso sin internet.",
    color: "from-primary-400 to-primary-600",
  },
  {
    icon: TrendingUp,
    title: "Dashboard",
    desc: "Ve tus ganancias del día, meta diaria, salud del vehículo y últimos registros de un vistazo.",
    color: "from-green-400 to-emerald-600",
  },
  {
    icon: CalendarCheck,
    title: "Cierre del día",
    desc: "Registra tus ingresos, kilómetros, gastos y combustible de cada jornada. Edita o elimina cuando quieras.",
    color: "from-blue-400 to-indigo-600",
  },
  {
    icon: Fuel,
    title: "Combustible",
    desc: "Lleva el control de cada carga de combustible y calcula el consumo promedio de tu vehículo.",
    color: "from-amber-400 to-orange-600",
  },
  {
    icon: Bike,
    title: "Vehículos",
    desc: "Gestiona varios vehículos, programa mantenimientos y recibe alertas cuando se acerquen.",
    color: "from-rose-400 to-pink-600",
  },
  {
    icon: PieChart,
    title: "Finanzas",
    desc: "Controla tus ingresos y gastos, fija presupuestos mensuales y distribuye tus ganancias en billeteras de ahorro.",
    color: "from-violet-400 to-purple-600",
  },
  {
    icon: BarChart3,
    title: "Reportes e IA",
    desc: "Analiza tus datos con gráficos, estadísticas y recomendaciones inteligentes para mejorar tus ingresos.",
    color: "from-cyan-400 to-teal-600",
  },
];

const TUTORIAL_KEY = "rc-tutorial-done";

export function isTutorialDone(): boolean {
  return localStorage.getItem(TUTORIAL_KEY) === "true";
}

function markTutorialDone() {
  localStorage.setItem(TUTORIAL_KEY, "true");
}

export function TutorialOverlay() {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  if (exiting) return null;
  if (isTutorialDone()) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  const next = () => {
    if (isLast) {
      markTutorialDone();
      setExiting(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 p-6"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.92 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full max-w-sm flex-col items-center text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 24 }}
            className={`mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br ${current.color} shadow-lg`}
          >
            <Icon className="h-10 w-10 text-white" />
          </motion.div>

          <h2 className="mb-2 text-2xl font-bold text-white">
            {current.title}
          </h2>
          <p className="mb-8 max-w-xs text-sm leading-relaxed text-white/70">
            {current.desc}
          </p>

          <div className="mb-8 flex gap-2">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 24 : 8,
                  opacity: i === step ? 1 : 0.35,
                }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`h-2 rounded-full ${i === step ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>

          <div className="flex w-full flex-col gap-3">
            <button
              onClick={next}
              className="w-full rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition-transform active:scale-95"
            >
              {isLast ? "¡Comenzar!" : "Siguiente"}
            </button>
            {!isLast && (
              <button
                onClick={() => { markTutorialDone(); setExiting(true); }}
                className="text-sm text-white/50 transition-colors hover:text-white/80"
              >
                Saltar
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

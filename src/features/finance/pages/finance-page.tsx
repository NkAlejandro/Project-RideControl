import { useState } from "react";
import { motion } from "framer-motion";
import { PieChart, List, PiggyBank, Wallet, Settings2 } from "lucide-react";
import { ResumenTab } from "../components/resumen-tab";
import { TransactionsTab } from "../components/transactions-tab";
import { BudgetsTab } from "../components/budgets-tab";
import { WalletsTab } from "../components/wallets-tab";
import { FinanceConfigModal } from "../components/finance-config-modal";
import { usePlatform } from "@/hooks/use-platform";

const TABS = [
  { id: "resumen", label: "Resumen", icon: PieChart },
  { id: "transacciones", label: "Transacciones", icon: List },
  { id: "presupuestos", label: "Presupuestos", icon: PiggyBank },
  { id: "billeteras", label: "Billeteras", icon: Wallet },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function FinancePage() {
  const { isAndroid } = usePlatform();
  const [tab, setTab] = useState<TabId>("resumen");
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-primary-color">Finanzas</h1>
        <p className="text-sm text-secondary-color">Controla tus ingresos, gastos y ahorros</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-card p-1 border border-theme-subtle overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap ${active ? (isAndroid ? "bg-primary-500 text-on-primary" : "text-on-primary") : "text-secondary-color"}`}
            >
              {active && !isAndroid && (
                <motion.div layoutId="finance-tab" className="absolute inset-0 rounded-lg bg-primary-500" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
        <button onClick={() => setConfigOpen(true)}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-secondary-color hover:text-primary-color hover:bg-hover transition-colors"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <FinanceConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === "resumen" && <ResumenTab />}
        {tab === "transacciones" && <TransactionsTab />}
        {tab === "presupuestos" && <BudgetsTab />}
        {tab === "billeteras" && <WalletsTab />}
      </motion.div>
    </div>
  );
}

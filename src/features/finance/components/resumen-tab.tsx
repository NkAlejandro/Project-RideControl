import { useMemo } from "react";
import { TrendingUp, TrendingDown, PiggyBank, Coins } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useMonthlyTotals } from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";
import { useDistributions } from "@/hooks/use-distributions";
import { useBudgetSpending } from "@/hooks/use-budgets";
import { WALLET_TYPES, WALLET_COLORS, WALLET_LABELS } from "@/lib/finance-engine";
import { formatCurrency } from "@/lib/utils";

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

export function ResumenTab() {
  const { income, expenses } = useMonthlyTotals(currentMonth, currentYear);
  const { wallets } = useWallets();
  const { transactions } = useTransactions();
  const {} = useBudgetSpending(currentMonth, currentYear);
  const { distributions } = useDistributions();

  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const recentTx = useMemo(() => transactions.slice(0, 5), [transactions]);

  const monthDistributions = useMemo(() =>
    distributions?.filter((d) => {
      const date = new Date(d.date);
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
    }) ?? [],
    [distributions],
  );

  const monthlyWalletTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const d of monthDistributions) {
      for (const type of WALLET_TYPES) {
        totals[type] = (totals[type] ?? 0) + (d.distribution[type] ?? 0);
      }
    }
    return totals;
  }, [monthDistributions]);

  const statCards = [
    { label: "Ingresos", value: income, icon: TrendingUp, color: "text-success-500 bg-success-500/10" },
    { label: "Gastos", value: expenses, icon: TrendingDown, color: "text-danger-500 bg-danger-500/10" },
    { label: "Ahorro", value: savings > 0 ? savings : 0, icon: PiggyBank, color: "text-primary-500 bg-primary-500/10" },
    { label: "Patrimonio", value: totalBalance, icon: Coins, color: "text-warning-500 bg-warning-500/10" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl bg-card p-4 border border-theme-subtle">
              <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs text-secondary-color">{s.label}</p>
              <p className="mt-0.5 text-lg font-semibold text-primary-color">{formatCurrency(s.value)}</p>
            </div>
          );
        })}
      </div>

      {income > 0 && (
        <div className="rounded-xl bg-card p-4 border border-theme-subtle">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-primary-color">Tasa de ahorro</span>
            <span className="text-sm font-semibold text-success-500">{savingsRate.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-hover overflow-hidden">
            <div
              className="h-full rounded-full bg-success-500 transition-all duration-500"
              style={{ width: `${Math.min(savingsRate, 100)}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-color">
            <span>Gastaste {formatCurrency(expenses)}</span>
            <span>Ahorraste {formatCurrency(savings)}</span>
          </div>
        </div>
      )}

      {totalBalance > 0 && (
        <div className="rounded-xl bg-card p-4 border border-theme-subtle">
          <p className="text-xs text-secondary-color">Total en billeteras</p>
          <p className="mt-0.5 text-lg font-semibold text-primary-color">{formatCurrency(totalBalance)}</p>
          <div className="mt-2 flex gap-1.5">
            {wallets.filter((w) => w.balance > 0).map((w) => (
              <div key={w.id} className="flex items-center gap-1 rounded-full bg-hover px-2 py-0.5 text-[10px] text-secondary-color">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: w.color }} />
                {w.name}: {formatCurrency(w.balance)}
              </div>
            ))}
          </div>
        </div>
      )}

      {monthDistributions.length > 0 && (
        <div className="rounded-xl bg-card p-4 border border-theme-subtle">
          <p className="mb-2 text-xs font-medium text-secondary-color uppercase tracking-wider">Distribuido este mes</p>
          <div className="space-y-2">
            {WALLET_TYPES.map((type) => {
              const total = monthlyWalletTotals[type] ?? 0;
              const wallet = wallets.find((w) => w.type === type);
              const pct = wallet?.percentage ?? 0;
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: WALLET_COLORS[type] }} />
                    <span className="text-xs text-secondary-color">{WALLET_LABELS[type]}</span>
                  </div>
                  <span className="text-xs font-medium text-primary-color">
                    {formatCurrency(total)} <span className="text-muted-color">({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recentTx.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-secondary-color uppercase tracking-wider">Últimas transacciones</p>
          <div className="space-y-1">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl bg-card px-3 py-2.5 border border-theme-subtle">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tx.type === "income" ? "bg-success-500/10" : "bg-danger-500/10"}`}>
                    {tx.type === "income" ? (
                      <TrendingUp className={`h-4 w-4 ${tx.type === "income" ? "text-success-500" : "text-danger-500"}`} />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-danger-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary-color truncate">{tx.description}</p>
                    <p className="text-xs text-muted-color">{new Date(tx.date).toLocaleDateString("es")}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold shrink-0 ml-3 ${tx.type === "income" ? "text-success-500" : "text-danger-500"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentTx.length === 0 && income === 0 && expenses === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <PiggyBank className="mb-3 h-12 w-12 text-muted-color" />
          <p className="text-sm font-medium text-primary-color">Sin datos este mes</p>
          <p className="mt-1 text-xs text-muted-color">Registra cierres del día para ver tu resumen financiero</p>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Wallet, PiggyBank, TrendingUp, ShoppingBag, Coins, Settings2, History } from "lucide-react";
import { useWallets } from "@/hooks/use-wallets";
import { useDistributions } from "@/hooks/use-distributions";
import { FinanceEngine, WALLET_TYPES, WALLET_LABELS, WALLET_COLORS } from "@/lib/finance-engine";
import { formatCurrency } from "@/lib/utils";
import { FinanceConfigModal } from "./finance-config-modal";

const ICON_MAP: Record<string, React.ElementType> = {
  bike: Wallet,
  "piggy-bank": PiggyBank,
  "trending-up": TrendingUp,
  smile: ShoppingBag,
  wallet: Coins,
};

export function WalletsTab() {
  const { wallets, loading } = useWallets();
  const { distributions } = useDistributions();
  const [configOpen, setConfigOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  void FinanceEngine.calculateWalletAverages(
    Object.fromEntries(wallets.map((w) => [w.type, w.balance])) as Record<string, number>,
  );
  void distributions;

  const sortedWallets = WALLET_TYPES.map((type) => wallets.find((w) => w.type === type)).filter(Boolean);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-hover" />
        ))}
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Wallet className="mb-3 h-12 w-12 text-muted-color" />
        <p className="text-sm font-medium text-primary-color">Sin billeteras configuradas</p>
        <p className="mt-1 text-xs text-muted-color">Las billeteras se crean durante la onboarding y distribuyen tus ganancias automáticamente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-card p-4 border border-theme-subtle">
        <p className="text-xs text-secondary-color">Saldo total distribuido</p>
        <p className="mt-0.5 text-2xl font-bold text-primary-color">{formatCurrency(totalBalance)}</p>
        <div className="mt-3 flex h-2.5 gap-0.5 rounded-full overflow-hidden">
          {sortedWallets.map((w) => w && (
            <div key={w.id} style={{ width: `${w.percentage}%`, backgroundColor: w.color }} title={`${w.name}: ${w.percentage}%`} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-color">
          {sortedWallets.map((w) => w && (
            <span key={w.id} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: w.color }} />
              {w.name} {w.percentage}%
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {WALLET_TYPES.map((type) => {
          const wallet = wallets.find((w) => w.type === type);
          if (!wallet) return null;
          const Icon = ICON_MAP[wallet.icon] || Coins;
          const pctOfTotal = totalBalance > 0 ? ((wallet.balance / totalBalance) * 100).toFixed(0) : "0";
          return (
            <div key={wallet.id} className="rounded-xl bg-card p-3 border border-theme-subtle">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${wallet.color}20` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: wallet.color }} />
                </div>
                <span className="text-xs font-medium text-primary-color flex-1 truncate">{WALLET_LABELS[type]}</span>
                <span className="text-[10px] text-muted-color">{wallet.percentage}%</span>
              </div>
              <p className="text-sm font-semibold text-primary-color">{formatCurrency(wallet.balance)}</p>
              <div className="mt-1 h-1 rounded-full bg-hover overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pctOfTotal}%`, backgroundColor: wallet.color }} />
              </div>
              <p className="mt-0.5 text-[10px] text-muted-color">{pctOfTotal}% del total</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setConfigOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-theme-subtle bg-card py-2.5 text-sm font-medium text-secondary-color hover:bg-hover hover:text-primary-color transition-colors"
        >
          <Settings2 className="h-4 w-4" />
          Configurar
        </button>
        <button onClick={() => setShowHistory(!showHistory)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-theme-subtle bg-card py-2.5 text-sm font-medium text-secondary-color hover:bg-hover hover:text-primary-color transition-colors"
        >
          <History className="h-4 w-4" />
          {showHistory ? "Ocultar historial" : "Historial"}
        </button>
      </div>

      {showHistory && distributions && distributions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-secondary-color uppercase tracking-wider px-1">Últimas distribuciones</p>
          {distributions.slice(0, 20).map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl bg-card px-3 py-2.5 border border-theme-subtle">
              <div className="min-w-0">
                <p className="text-xs text-primary-color">{formatCurrency(d.earnings)}</p>
                <p className="text-[10px] text-muted-color">
                  {new Date(d.date).toLocaleDateString("es-CO")} · neto {formatCurrency(d.netIncome)}
                </p>
              </div>
              <div className="flex gap-2 text-[10px] text-muted-color">
                {WALLET_TYPES.map((type) => (
                  <span key={type} className="flex items-center gap-0.5">
                    <span className="h-1 w-1 rounded-full" style={{ backgroundColor: WALLET_COLORS[type] }} />
                    {formatCurrency(d.distribution[type])}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <FinanceConfigModal open={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
}

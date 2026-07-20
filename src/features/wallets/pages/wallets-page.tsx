import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { toast } from "sonner";
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  ShoppingBag,
  Settings,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useWallets } from "@/hooks/use-wallets";
import { cn, formatCurrency } from "@/lib/utils";
import { walletRepository } from "@/database/repositories/wallet-repository";

const WALLET_ICONS: Record<string, React.ReactNode> = {
  vehicle: <Wallet className="h-5 w-5" />,
  savings: <PiggyBank className="h-5 w-5" />,
  investment: <TrendingUp className="h-5 w-5" />,
  personal: <ShoppingBag className="h-5 w-5" />,
  other: <Coins className="h-5 w-5" />,
};

const WALLET_COLORS: Record<string, string> = {
  vehicle: "bg-blue-500",
  savings: "bg-emerald-500",
  investment: "bg-amber-500",
  personal: "bg-slate-400",
  other: "bg-purple-500",
};

const WALLET_BG_COLORS: Record<string, string> = {
  vehicle: "border-blue-500/20 bg-blue-500/10",
  savings: "border-emerald-500/20 bg-emerald-500/10",
  investment: "border-amber-500/20 bg-amber-500/10",
  personal: "border-slate-400/20 bg-slate-400/10",
  other: "border-purple-500/20 bg-purple-500/10",
};

const WALLET_TEXT_COLORS: Record<string, string> = {
  vehicle: "text-blue-400",
  savings: "text-emerald-400",
  investment: "text-amber-400",
  personal: "text-slate-300",
  other: "text-purple-400",
};

function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const from = 0;
    const to = value;
    const start = (ts: number) => {
      startRef.current = ts;
      const tick = (now: number) => {
        const elapsed = now - (startRef.current ?? now);
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(from + (to - from) * eased);
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(start);
    return () => cancelAnimationFrame(raf);
  }, [value, inView, duration]);

  return <span ref={ref}>{formatCurrency(display)}</span>;
}

export default function WalletsPage() {
  const { wallets, loading, reload } = useWallets();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPercentages, setEditingPercentages] = useState<
    Record<string, number>
  >({});
  const [saving, setSaving] = useState(false);

  const totalBalance = useMemo(
    () => wallets.reduce((acc, w) => acc + w.balance, 0),
    [wallets],
  );

  const totalPercentage = useMemo(
    () => Object.values(editingPercentages).reduce((a, b) => a + b, 0),
    [editingPercentages],
  );

  const handleOpenModal = () => {
    const initial: Record<string, number> = {};
    for (const w of wallets) {
      initial[w.id] = w.percentage;
    }
    setEditingPercentages(initial);
    setModalOpen(true);
  };

  const handleSavePercentages = async () => {
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast.error("Los porcentajes deben sumar 100%");
      return;
    }
    setSaving(true);
    try {
      for (const [walletId, pct] of Object.entries(editingPercentages)) {
        await walletRepository.update(walletId, {
          percentage: pct,
        });
      }
      await reload();
      toast.success("Distribución actualizada");
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handlePercentageChange = (walletId: string, value: string) => {
    const num = parseFloat(value) || 0;
    setEditingPercentages((prev) => ({ ...prev, [walletId]: num }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-color">Billeteras</h1>
          <p className="text-sm text-secondary-color">
            Distribución automática de ingresos
          </p>
        </div>
        <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
          <Button size="sm" onClick={handleOpenModal} className="btn-ripple press-effect">
            <Settings className="h-4 w-4" />
            Configurar
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
      >
        <Card className="hover-lift">
          <p className="text-[10px] font-medium uppercase tracking-wider text-secondary-color">
            Balance total
          </p>
          <motion.p
            className="mt-1 text-3xl font-bold text-primary-color"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring" as const, stiffness: 120, damping: 10, delay: 0.2 }}
          >
            <AnimatedNumber value={totalBalance} duration={1.4} />
          </motion.p>
          <p className="mt-1 text-xs text-secondary-color">
            {wallets.length} {wallets.length === 1 ? "billetera" : "billeteras"} activas
          </p>
        </Card>
      </motion.div>

      {wallets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring" as const, stiffness: 200, damping: 20 }}
        >
          <Card padding="sm" className="hover-lift">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-wider text-secondary-color">
                Distribución
              </p>
              <p className="text-[10px] text-secondary-color">
                {wallets.length} billeteras
              </p>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-hover">
              {wallets.map((wallet, idx) => (
                <motion.div
                  key={wallet.id}
                  initial={{ width: 0 }}
                  animate={{ width: `${wallet.percentage}%` }}
                  transition={{
                    delay: 0.3 + idx * 0.1,
                    duration: 0.7,
                    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                  }}
                  className={cn(
                    "h-full progress-animated first:rounded-l-full last:rounded-r-full",
                    WALLET_COLORS[wallet.type] || "bg-surface-500",
                  )}
                  style={{ opacity: wallet.percentage > 0 ? 1 : 0 }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      WALLET_COLORS[wallet.type] || "bg-surface-500",
                    )}
                  />
                  <span className="text-[10px] text-secondary-color">
                    {wallet.name} ({wallet.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-3xl bg-hover"
            />
          ))}
        </div>
      ) : wallets.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <AnimatePresence>
            {wallets.map((wallet, idx) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  delay: idx * 0.08,
                  type: "spring" as const,
                  stiffness: 200,
                  damping: 18,
                }}
              >
                <Card
                  padding="lg"
                  className={cn(
                    "card-interactive hover-lift border",
                    WALLET_BG_COLORS[wallet.type] || "border-theme-subtle bg-card",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ type: "spring" as const, stiffness: 400, damping: 10 }}
                      className={cn(
                        "icon-bounce flex h-10 w-10 items-center justify-center rounded-2xl",
                        WALLET_COLORS[wallet.type] || "bg-surface-500",
                        "bg-opacity-10",
                      )}
                    >
                      <span
                        className={cn(
                          WALLET_TEXT_COLORS[wallet.type] || "text-secondary-color",
                        )}
                      >
                        {WALLET_ICONS[wallet.type] || (
                          <Coins className="h-5 w-5" />
                        )}
                      </span>
                    </motion.div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        WALLET_TEXT_COLORS[wallet.type] || "text-secondary-color",
                        "bg-hover",
                      )}
                    >
                      {wallet.percentage}%
                    </span>
                  </div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-secondary-color">
                    {wallet.name}
                  </p>
                  <p className="mt-1 text-xl font-bold text-primary-color">
                    <AnimatedNumber value={wallet.balance} duration={1 + idx * 0.15} />
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-hover">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${totalBalance > 0 ? (wallet.balance / totalBalance) * 100 : 0}%`,
                      }}
                      transition={{
                        delay: 0.2 + idx * 0.12,
                        duration: 0.7,
                        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                      }}
                      className={cn(
                        "h-full rounded-full progress-animated",
                        WALLET_COLORS[wallet.type] || "bg-surface-500",
                      )}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-secondary-color">
                    {totalBalance > 0
                      ? `${((wallet.balance / totalBalance) * 100).toFixed(1)}% del total`
                      : "Sin datos"}
                  </p>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" as const, stiffness: 200, damping: 15 }}
        >
          <Card className="py-12 text-center">
            <Wallet className="mx-auto mb-3 h-12 w-12 text-muted-color" />
            <p className="text-sm text-secondary-color">
              No tienes billeteras configuradas
            </p>
            <p className="mb-4 text-xs text-secondary-color">
              Configura la distribución de tus ingresos en ajustes
            </p>
            <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
              <Button size="sm" onClick={handleOpenModal} className="btn-ripple press-effect">
                <Settings className="h-4 w-4" />
                Configurar distribución
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Configurar distribución"
      >
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.p
            className="text-sm text-secondary-color"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 20, delay: 0.05 }}
          >
            Define el porcentaje de ingresos que se destinará a cada billetera.
          </motion.p>

          {wallets.map((wallet, idx) => (
            <motion.div
              key={wallet.id}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring" as const,
                stiffness: 300,
                damping: 22,
                delay: 0.1 + idx * 0.06,
              }}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                  WALLET_COLORS[wallet.type] || "bg-surface-500",
                )}
              >
                <span className="text-primary-color">
                  {WALLET_ICONS[wallet.type] || <Coins className="h-4 w-4" />}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-color">
                  {wallet.name}
                </p>
              </div>
              <div className="w-24">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={editingPercentages[wallet.id] ?? 0}
                    onChange={(e) =>
                      handlePercentageChange(wallet.id, e.target.value)
                    }
                    className="flex h-10 w-full rounded-2xl border border-theme-subtle bg-card px-3 pr-7 text-center text-sm text-primary-color transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-color">
                    %
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            className="flex items-center justify-between rounded-2xl bg-hover px-4 py-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 22, delay: 0.1 + wallets.length * 0.06 }}
          >
            <span className="text-sm text-secondary-color">Total</span>
            <span
              className={cn(
                "text-sm font-bold",
                Math.abs(totalPercentage - 100) < 0.01
                  ? "text-success-400"
                  : "text-danger-400",
              )}
            >
              {totalPercentage.toFixed(0)}%
            </span>
          </motion.div>

          {Math.abs(totalPercentage - 100) > 0.01 && (
            <motion.p
              className="text-xs text-danger-400"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
            >
              Los porcentajes deben sumar exactamente 100%
            </motion.p>
          )}

          <div className="flex gap-3">
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
              <Button
                variant="secondary"
                className="w-full btn-ripple"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </Button>
            </motion.div>
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
              <Button
                className="w-full btn-ripple press-effect"
                loading={saving}
                disabled={Math.abs(totalPercentage - 100) > 0.01}
                onClick={handleSavePercentages}
              >
                Guardar
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </Modal>
    </div>
  );
}

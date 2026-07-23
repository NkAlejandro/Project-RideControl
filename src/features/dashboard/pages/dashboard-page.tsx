import { useNavigate } from "react-router-dom";
import { motion, useSpring, useTransform, useMotionValue } from "framer-motion";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVehicles } from "@/hooks/use-vehicles";
import { useDailyEntries } from "@/hooks/use-daily-entries";
import { useWallets } from "@/hooks/use-wallets";
import { useSettings } from "@/hooks/use-settings";
import { useDistributions } from "@/hooks/use-distributions";
import { maintenanceRepository } from "@/database/repositories/maintenance-repository";
import { settingsRepository } from "@/database/repositories/settings-repository";
import { useAppStore } from "@/store/use-app-store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { FinanceEngine } from "@/lib/finance-engine";
import { toast } from "sonner";
import {
  TrendingUp,
  Bike,
  Wrench,
  List,
  ArrowRight,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Coins,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { MaintenanceItem, DailyEntry } from "@/types";



function AnimatedNumber({ value, format = true }: { value: number; format?: boolean }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) =>
    format ? formatCurrency(Math.round(v)) : String(Math.round(v))
  );

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span>{display}</motion.span>;
}

function AnimatedPercent({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => `${Math.round(v)}%`);

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span>{display}</motion.span>;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const cardGlow = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const listItem = {
  hidden: { opacity: 0, x: -16 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const chartSection = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};



export default function DashboardPage() {
  const navigate = useNavigate();
  const { activeVehicle, loading: vehicleLoading } = useVehicles();
  const { todayEntry, entries, loading: entriesLoading, remove } = useDailyEntries(activeVehicle?.id);
  const { wallets, loading: walletsLoading } = useWallets();
  const { settings } = useSettings();
  const { distributions } = useDistributions();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [dailyGoalOverride, setDailyGoalOverride] = useState<number | null>(
    () => { const s = localStorage.getItem("rc-daily-goal"); return s ? Number(s) : null; }
  );
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<
    (MaintenanceItem & { kmRemaining: number; daysRemaining: number }) | null
  >(null);

  useEffect(() => {
    if (!activeVehicle) return;
    maintenanceRepository.getUpcoming(activeVehicle.id, activeVehicle.mileage).then((items) => {
      setUpcomingMaintenance(items[0] || null);
    });
  }, [activeVehicle]);

  const loading = vehicleLoading || entriesLoading || walletsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 shimmer-bg rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border border-theme-subtle bg-card p-5">
              <div className="mb-3 h-3 w-20 shimmer-bg rounded" />
              <div className="h-7 w-24 shimmer-bg rounded mb-2" />
              <div className="h-3 w-16 shimmer-bg rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-3xl border border-theme-subtle bg-card p-5">
              <div className="mb-3 h-3 w-28 shimmer-bg rounded" />
              <div className="h-4 w-40 shimmer-bg rounded mb-2" />
              <div className="h-3 w-32 shimmer-bg rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-theme-subtle bg-card p-5">
          <div className="mb-3 h-3 w-28 shimmer-bg rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 shimmer-bg rounded" />
                <div className="h-4 w-16 shimmer-bg rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!activeVehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring" as const, stiffness: 260, damping: 20, delay: 0.1 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-hover"
        >
          <Bike className="h-10 w-10 text-muted-color" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-2 text-xl font-bold text-primary-color"
        >
          No hay vehículos
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6 max-w-xs text-sm text-secondary-color"
        >
          Registra tu primer vehículo para empezar a controlar tus ingresos
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Button onClick={() => navigate("/vehicles")}>
            <Plus className="h-4 w-4" />
            Registrar vehículo
          </Button>
        </motion.div>
      </div>
    );
  }

  const todayEarnings = todayEntry?.earnings || 0;
  const dailyGoal = dailyGoalOverride ?? settings?.dailyGoal ?? 100000;
  const goalProgress = dailyGoal > 0 ? Math.min((todayEarnings / dailyGoal) * 100, 100) : 0;

  const vehicleHealth = upcomingMaintenance && upcomingMaintenance.kmRemaining <= 500
    ? { label: "Atención", color: "text-warning-400" as const }
    : { label: "Bien", color: "text-success-400" as const };

  const savingsWallets = wallets.filter((w) => w.type === "ahorro" || w.type === "inversiones");
  const totalSavings = savingsWallets.reduce((acc, w) => acc + w.balance, 0);
  const financialHealth =
    todayEarnings > 0
      ? Math.round((totalSavings / (todayEarnings + (todayEntry?.expenses || 0) || 1)) * 100)
      : 0;

  const totalPatrimonio = wallets.reduce((s, w) => s + w.balance, 0);
  void distributions;
  const netToday = todayEntry
    ? FinanceEngine.calculateNetIncome(todayEntry.earnings, todayEntry.fuelCost, todayEntry.expenses)
    : 0;

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleEditEntry = (entry: DailyEntry) => {
    navigate("/daily-close", { state: { editEntryId: entry.id } });
  };

  const handleDeleteEntry = async (entry: DailyEntry) => {
    const d = new Date(entry.date as unknown as string | number);
    const label = isNaN(d.getTime()) ? "desconocido" : new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(d);
    if (!window.confirm(`¿Eliminar cierre del ${label}?`)) return;
    try {
      await remove(entry.id);
      toast.success("Cierre eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-primary-color">Dashboard</h1>
        <p className="mt-1 text-sm text-secondary-color">
          {activeVehicle.brand} {activeVehicle.model}
        </p>
      </motion.div>

      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={cardGlow} whileHover={{ y: -3, boxShadow: "0 0 24px rgba(34,197,94,0.15)" }} className="rounded-3xl border border-theme-subtle bg-card p-5 hover-lift">
          <CardHeader>
            <CardTitle>Ganancia del día</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-hover icon-bounce">
              <TrendingUp className="h-4 w-4 text-success-400" />
            </div>
          </CardHeader>
          <CardValue>
            <AnimatedNumber value={todayEarnings} />
          </CardValue>
          {todayEntry && (
            <p className="mt-1 text-xs text-secondary-color">
              {todayEntry.kilometers} km recorridos
              {netToday > 0 && ` · neto ${formatCurrency(netToday)}`}
            </p>
          )}
        </motion.div>

        <motion.div variants={cardGlow} whileHover={{ y: -3, boxShadow: "0 0 24px rgba(79,110,255,0.15)" }} className="rounded-3xl border border-theme-subtle bg-card p-5 hover-lift">
          <CardHeader>
            <CardTitle>Meta diaria</CardTitle>
            <button
              type="button"
              onClick={() => { setGoalInput(String(dailyGoal)); setEditingGoal(true); }}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-hover icon-bounce transition-colors hover:bg-primary-500/10"
              title="Editar meta"
            >
              <Pencil className="h-4 w-4 text-primary-400" />
            </button>
          </CardHeader>
          {editingGoal ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="text-lg font-bold"
                  autoFocus
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={async () => {
                    const val = Number(goalInput);
                    if (isNaN(val) || val <= 0) return toast.error("Valor inválido");
                    localStorage.setItem("rc-daily-goal", String(val));
                    setDailyGoalOverride(val);
                    setEditingGoal(false);
                    const profile = useAppStore.getState().profile;
                    if (profile) {
                      const s = await settingsRepository.get(profile.id);
                      if (s) {
                        try { await settingsRepository.update(s.id, { dailyGoal: val }); } catch {}
                      }
                    }
                  }}
                  className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-primary-500/10 text-xs font-medium text-primary-400 transition-colors hover:bg-primary-500/20"
                >
                  <Check className="h-3.5 w-3.5" />
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingGoal(false)}
                  className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-hover text-xs font-medium text-secondary-color transition-colors hover:bg-danger-500/10 hover:text-danger-400"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <CardValue>
                <AnimatedNumber value={dailyGoal} />
              </CardValue>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-hover">
                <motion.div
                  className="h-full rounded-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${goalProgress}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.3 }}
                />
              </div>
              <p className="mt-2 text-xs text-secondary-color">
                <AnimatedPercent value={goalProgress} /> de la meta
              </p>
            </>
          )}
        </motion.div>

        <motion.div variants={cardGlow} whileHover={{ y: -3, boxShadow: "0 0 24px rgba(245,158,11,0.15)" }} className="rounded-3xl border border-theme-subtle bg-card p-5 hover-lift">
          <CardHeader>
            <CardTitle>Salud del vehículo</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-hover icon-bounce">
              <Bike className="h-4 w-4 text-secondary-color" />
            </div>
          </CardHeader>
          <CardValue className={vehicleHealth.color}>
            {vehicleHealth.label}
          </CardValue>
          {upcomingMaintenance && upcomingMaintenance.kmRemaining <= 500 && (
            <p className="mt-1 text-xs text-secondary-color">
              {upcomingMaintenance.name} en {upcomingMaintenance.kmRemaining} km
            </p>
          )}
        </motion.div>

        <motion.div variants={cardGlow} whileHover={{ y: -3, boxShadow: "0 0 24px rgba(79,110,255,0.15)" }} className="rounded-3xl border border-theme-subtle bg-card p-5 hover-lift">
          <CardHeader>
            <CardTitle>Patrimonio</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-hover icon-bounce">
              <Coins className="h-4 w-4 text-primary-400" />
            </div>
          </CardHeader>
          <CardValue className="text-primary-400">
            <AnimatedNumber value={totalPatrimonio} />
          </CardValue>
          {totalSavings > 0 && (
            <p className="mt-1 text-xs text-secondary-color">
              {formatCurrency(totalSavings)} ahorrados · {financialHealth}% tasa
            </p>
          )}
          {totalSavings === 0 && (
            <p className="mt-1 text-xs text-secondary-color">Sin ahorros aún</p>
          )}
        </motion.div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {upcomingMaintenance && (
          <motion.div
            variants={chartSection}
            whileHover={{ scale: 1.01 }}
            className="rounded-3xl border border-theme-subtle bg-card p-5"
          >
            <CardHeader>
              <CardTitle>Próximo mantenimiento</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-hover icon-bounce">
                <Wrench className="h-4 w-4 text-warning-400" />
              </div>
            </CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-primary-color">{upcomingMaintenance.name}</p>
                <p className="mt-1 text-sm text-secondary-color">
                  En {upcomingMaintenance.kmRemaining} km
                  {upcomingMaintenance.daysRemaining > 0 &&
                    ` · ${upcomingMaintenance.daysRemaining} días`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/maintenance")}
              >
                Ver
              </Button>
            </div>
          </motion.div>
        )}

        {!upcomingMaintenance && (
          <Card className="py-8 text-center">
            <p className="text-sm text-secondary-color">
              Registra tu primer cierre del día para ver más datos aquí
            </p>
          </Card>
        )}
      </motion.div>

      <motion.div variants={item}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-color">Últimos registros</h2>
          {entries.length > 0 && (
            <button
              onClick={() => navigate("/reports")}
              className="flex items-center gap-1 text-xs text-primary-400 transition-colors hover:text-primary-300"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {recentEntries.length > 0 ? (
          <div className="divide-y divide-theme-subtle overflow-hidden rounded-3xl border border-theme-subtle bg-card">
            {recentEntries.map((entry, i) => (
              <motion.div
                key={entry.id}
                custom={i}
                variants={listItem}
                initial="hidden"
                animate="show"
                className="flex items-center justify-between gap-2 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary-color">
                    {formatCurrency(entry.earnings)}
                  </p>
                  <p className="mt-0.5 text-xs text-secondary-color">
                    {entry.kilometers} km · {entry.fuelAmount}L · {formatNumber(entry.expenses)} gastos
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-secondary-color">
                      -{formatCurrency(entry.expenses)}
                    </p>
                    <p className="mt-0.5 text-xs text-secondary-color">
                      {(() => {
                        try {
                          const d = new Date(entry.date as unknown as string | number);
                          return isNaN(d.getTime())
                            ? ""
                            : new Intl.DateTimeFormat("es-CO", {
                                day: "numeric",
                                month: "short",
                              }).format(d);
                        } catch { return ""; }
                      })()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleEditEntry(entry)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-secondary-color transition-colors hover:bg-hover hover:text-primary-color"
                      title="Editar"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-secondary-color transition-colors hover:bg-danger-500/10 hover:text-danger-400"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="py-10 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring" as const, stiffness: 260, damping: 20, delay: 0.2 }}
              className="mb-4 flex justify-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-hover">
                <List className="h-7 w-7 text-muted-color" />
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-1 text-sm font-medium text-primary-color"
            >
              No hay registros aún
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mb-5 text-xs text-secondary-color"
            >
              Registra tu primer cierre del día para empezar
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Button
                size="sm"
                onClick={() => navigate("/daily-close")}
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo cierre
              </Button>
            </motion.div>
          </Card>
        )}
      </motion.div>

      {todayEntry && (
        <motion.div variants={item}>
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate("/daily-close")}
          >
            <TrendingUp className="h-4 w-4" />
            Abrir cierre del día
          </Button>
        </motion.div>
      )}

      {!todayEntry && recentEntries.length === 0 && (
        <motion.div variants={item}>
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate("/daily-close")}
          >
            <Sparkles className="h-4 w-4" />
            Registrar primer cierre del día
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

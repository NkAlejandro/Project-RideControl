import { useMemo, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import {
  Sparkles,
  Fuel,
  TrendingUp,
  TrendingDown,
  Wrench,
  Target,
  Calendar,
  Smartphone,
  BarChart3,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Zap,
  Shield,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { useDailyEntries } from "@/hooks/use-daily-entries";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useGoals } from "@/hooks/use-goals";
import { useVehicles } from "@/hooks/use-vehicles";
import { useFuel } from "@/hooks/use-fuel";
import { useAppStore } from "@/store/use-app-store";
import { cn, formatCurrency } from "@/lib/utils";

interface Recommendation {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "finance" | "maintenance" | "efficiency";
}

const priorityConfig = {
  high: {
    dot: "bg-danger-500",
    label: "Alta",
  },
  medium: {
    dot: "bg-warning-500",
    label: "Media",
  },
  low: {
    dot: "bg-success-500",
    label: "Baja",
  },
};

const categoryConfig = {
  finance: { icon: <TrendingUp className="h-3 w-3" />, label: "Finanzas" },
  maintenance: { icon: <Wrench className="h-3 w-3" />, label: "Mantenimiento" },
  efficiency: { icon: <Gauge className="h-3 w-3" />, label: "Eficiencia" },
};

const categoryHoverColors = {
  finance: "hover:bg-success-500/20 hover:text-success-500",
  maintenance: "hover:bg-warning-500/20 hover:text-warning-500",
  efficiency: "hover:bg-primary-500/20 hover:text-primary-500",
};

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function AnimatedNumber({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useMemo(() => {
    const controls = animate(motionVal, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);

  return <>{display}</>;
}

export default function AiPage() {
  const activeVehicleId = useAppStore((s) => s.activeVehicleId);
  const [now] = useState(() => Date.now());
  const { entries, loading: entriesLoading } = useDailyEntries(activeVehicleId ?? undefined);
  const { items: maintenanceItems, loading: maintenanceLoading } = useMaintenance(activeVehicleId ?? undefined);
  const { goals, loading: goalsLoading } = useGoals();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { records: fuelRecords, loading: fuelLoading } = useFuel(activeVehicleId ?? undefined);

  const loading = entriesLoading || maintenanceLoading || goalsLoading || vehiclesLoading || fuelLoading;

  const analysis = useMemo(() => {
    if (!entries.length) return null;

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const totalEarnings = entries.reduce((sum, e) => sum + e.earnings, 0);
    const totalFuelCost = entries.reduce((sum, e) => sum + e.fuelCost, 0);
    const avgEarnings = totalEarnings / entries.length;
    const fuelPercentage = totalEarnings > 0 ? (totalFuelCost / totalEarnings) * 100 : 0;

    const earningsByDay: Record<number, { total: number; count: number }> = {};
    for (let i = 0; i < 7; i++) earningsByDay[i] = { total: 0, count: 0 };
    entries.forEach((e) => {
      const day = new Date(e.date).getDay();
      earningsByDay[day].total += e.earnings;
      earningsByDay[day].count += 1;
    });
    const avgByDay = dayNames.map((name, i) => ({
      name,
      avg: earningsByDay[i].count > 0 ? earningsByDay[i].total / earningsByDay[i].count : 0,
    }));
    const bestDay = [...avgByDay].sort((a, b) => b.avg - a.avg)[0];

    const earningsByApp: Record<string, { total: number; count: number }> = {};
    entries.forEach((e) => {
      e.appsUsed.forEach((app) => {
        if (!earningsByApp[app]) earningsByApp[app] = { total: 0, count: 0 };
        earningsByApp[app].total += e.earnings / e.appsUsed.length;
        earningsByApp[app].count += 1;
      });
    });
    const appList = Object.entries(earningsByApp)
      .map(([name, data]) => ({
        name,
        total: data.total,
        avg: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => b.total - a.total);
    const bestApp = appList[0];

    const recent7 = sortedEntries.slice(-7);
    const previous7 = sortedEntries.slice(-14, -7);
    const recentAvg7 = recent7.length > 0 ? recent7.reduce((s, e) => s + e.earnings, 0) / recent7.length : 0;
    const previousAvg7 = previous7.length > 0 ? previous7.reduce((s, e) => s + e.earnings, 0) / previous7.length : 0;
    const weeklyTrend: "up" | "down" | "stable" =
      recentAvg7 > previousAvg7 * 1.05 ? "up" : recentAvg7 < previousAvg7 * 0.95 ? "down" : "stable";

    let fuelEfficiencyTrend: "improving" | "worsening" | "stable" = "stable";
    if (fuelRecords.length >= 2) {
      const mid = Math.floor(fuelRecords.length / 2);
      const recentFuel = fuelRecords.slice(0, mid);
      const olderFuel = fuelRecords.slice(mid);
      const recentKmPerL =
        recentFuel.length > 0
          ? recentFuel.reduce((s, r) => s + r.kilometers, 0) /
            Math.max(recentFuel.reduce((s, r) => s + r.amount, 0), 0.1)
          : 0;
      const olderKmPerL =
        olderFuel.length > 0
          ? olderFuel.reduce((s, r) => s + r.kilometers, 0) /
            Math.max(olderFuel.reduce((s, r) => s + r.amount, 0), 0.1)
          : 0;
      if (recentKmPerL > olderKmPerL * 1.05) fuelEfficiencyTrend = "improving";
      else if (recentKmPerL < olderKmPerL * 0.95) fuelEfficiencyTrend = "worsening";
    }

    return {
      totalEarnings,
      totalFuelCost,
      avgEarnings,
      fuelPercentage,
      bestDay,
      bestApp,
      appList,
      avgByDay,
      weeklyTrend,
      recentAvg7,
      previousAvg7,
      fuelEfficiencyTrend,
      entryCount: entries.length,
    };
  }, [entries, fuelRecords]);

  const recommendations: Recommendation[] = useMemo(() => {
    const recs: Recommendation[] = [];
    if (!analysis) return recs;

    if (analysis.fuelPercentage > 30) {
      recs.push({
        id: "fuel-costs",
        icon: <Fuel className="h-5 w-5" />,
        title: "Reducir costos de combustible",
        description: `El ${analysis.fuelPercentage.toFixed(0)}% de tus ingresos se va en combustible. Considera optimizar rutas o buscar estaciones más económicas.`,
        priority: "high",
        category: "finance",
      });
    }

    if (analysis.weeklyTrend === "down") {
      recs.push({
        id: "increase-earnings",
        icon: <TrendingDown className="h-5 w-5" />,
        title: "Aumentar ingresos",
        description: `Tus ingresos han bajado un ${(((analysis.previousAvg7 - analysis.recentAvg7) / Math.max(analysis.previousAvg7, 1)) * 100).toFixed(0)}% esta semana. Intenta trabajar en tus mejores horarios.`,
        priority: "high",
        category: "finance",
      });
    }

    const activeVehicle = vehicles.find((v) => v.id === activeVehicleId);
    const currentKm = activeVehicle?.mileage ?? 0;
    const overdueMaintenance = maintenanceItems.filter((item) => {
      const kmRemaining = Math.max(0, item.lastKm + item.intervalKm - currentKm);
      const daysRemaining = Math.max(
        0,
        Math.ceil((item.lastDate.getTime() + item.intervalDays * 86400000 - now) / 86400000)
      );
      return kmRemaining === 0 || daysRemaining === 0;
    });

    if (overdueMaintenance.length > 0) {
      recs.push({
        id: "maintenance-due",
        icon: <Wrench className="h-5 w-5" />,
        title: "Mantenimiento vencido",
        description: `Tienes ${overdueMaintenance.length} mantenimiento${overdueMaintenance.length > 1 ? "s" : ""} vencido${overdueMaintenance.length > 1 ? "s" : ""}: ${overdueMaintenance.map((m) => m.name).join(", ")}.`,
        priority: "high",
        category: "maintenance",
      });
    }

    const activeGoals = goals.filter((g) => !g.isCompleted);
    activeGoals.forEach((goal) => {
      if (goal.deadline) {
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const totalDays = Math.max(
          1,
          Math.ceil((deadline.getTime() - new Date(goal.createdAt).getTime()) / 86400000)
        );
        const daysPassed = Math.max(
          1,
          Math.ceil((now.getTime() - new Date(goal.createdAt).getTime()) / 86400000)
        );
        const expectedProgress = (daysPassed / totalDays) * 100;
        const actualProgress = (goal.currentAmount / goal.targetAmount) * 100;

        if (actualProgress >= expectedProgress) {
          recs.push({
            id: `goal-ontrack-${goal.id}`,
            icon: <Target className="h-5 w-5" />,
            title: `Meta "${goal.title}" en camino`,
            description: `Vas al ${actualProgress.toFixed(0)}% y deberías ir al ${expectedProgress.toFixed(0)}%. ¡Sigue así!`,
            priority: "low",
            category: "finance",
          });
        } else {
          recs.push({
            id: `goal-behind-${goal.id}`,
            icon: <AlertTriangle className="h-5 w-5" />,
            title: `Meta "${goal.title}" retrasada`,
            description: `Vas al ${actualProgress.toFixed(0)}% pero deberías ir al ${expectedProgress.toFixed(0)}%. Necesitas incrementar tus ahorros.`,
            priority: "medium",
            category: "finance",
          });
        }
      }
    });

    if (analysis.bestDay) {
      recs.push({
        id: "best-day",
        icon: <Calendar className="h-5 w-5" />,
        title: "Mejor día para ganar",
        description: `${analysis.bestDay.name} es tu mejor día con un promedio de ${formatCurrency(analysis.bestDay.avg)}. Aprovecha ese día al máximo.`,
        priority: "low",
        category: "finance",
      });
    }

    if (analysis.bestApp) {
      recs.push({
        id: "best-app",
        icon: <Smartphone className="h-5 w-5" />,
        title: "App más rentable",
        description: `${analysis.bestApp.name} genera más ingresos con un total de ${formatCurrency(analysis.bestApp.total)}.`,
        priority: "low",
        category: "finance",
      });
    }

    if (analysis.weeklyTrend === "up") {
      recs.push({
        id: "weekly-up",
        icon: <TrendingUp className="h-5 w-5" />,
        title: "Tendencia semanal positiva",
        description: `Tus ingresos subieron un ${(((analysis.recentAvg7 - analysis.previousAvg7) / Math.max(analysis.previousAvg7, 1)) * 100).toFixed(0)}% esta semana. ¡Excelente progreso!`,
        priority: "low",
        category: "finance",
      });
    }

    if (analysis.fuelEfficiencyTrend === "worsening") {
      recs.push({
        id: "fuel-efficiency",
        icon: <Gauge className="h-5 w-5" />,
        title: "Alerta de eficiencia de combustible",
        description: "Tu consumo de combustible está empeorando. Revisa el estado del vehículo y tu estilo de conducción.",
        priority: "medium",
        category: "efficiency",
      });
    } else if (analysis.fuelEfficiencyTrend === "improving") {
      recs.push({
        id: "fuel-efficiency-good",
        icon: <Gauge className="h-5 w-5" />,
        title: "Eficiencia mejorando",
        description: "Tu consumo de combustible está mejorando. ¡Sigue manteniendo buenos hábitos de conducción!",
        priority: "low",
        category: "efficiency",
      });
    }

    return recs;
  }, [analysis, maintenanceItems, goals, activeVehicleId, vehicles, now]);

  const score = useMemo(() => {
    if (!analysis) return 0;
    let s = 50;

    if (analysis.fuelPercentage <= 20) s += 15;
    else if (analysis.fuelPercentage <= 30) s += 5;
    else s -= 15;

    if (analysis.weeklyTrend === "up") s += 15;
    else if (analysis.weeklyTrend === "down") s -= 10;

    if (analysis.fuelEfficiencyTrend === "improving") s += 10;
    else if (analysis.fuelEfficiencyTrend === "worsening") s -= 10;

    const activeVehicle = vehicles.find((v) => v.id === activeVehicleId);
    const currentKm = activeVehicle?.mileage ?? 0;
    const overdueCount = maintenanceItems.filter((item) => {
      const kmRem = Math.max(0, item.lastKm + item.intervalKm - currentKm);
      const daysRem = Math.max(
        0,
        Math.ceil((item.lastDate.getTime() + item.intervalDays * 86400000 - now) / 86400000)
      );
      return kmRem === 0 || daysRem === 0;
    }).length;
    s -= overdueCount * 10;

    const activeGoals = goals.filter((g) => !g.isCompleted && g.deadline);
    activeGoals.forEach((goal) => {
      const deadline = new Date(goal.deadline!);
      const totalDays = Math.max(
        1,
        Math.ceil((deadline.getTime() - new Date(goal.createdAt).getTime()) / 86400000)
      );
      const daysPassed = Math.max(
        1,
        Math.ceil((now - new Date(goal.createdAt).getTime()) / 86400000)
      );
      const expected = (daysPassed / totalDays) * 100;
      const actual = (goal.currentAmount / goal.targetAmount) * 100;
      if (actual >= expected) s += 5;
      else s -= 5;
    });

    return Math.max(0, Math.min(100, s));
  }, [analysis, maintenanceItems, goals, activeVehicleId, vehicles, now]);

  const scoreColor =
    score >= 70 ? "text-success-500" : score >= 40 ? "text-warning-500" : "text-danger-500";
  const scoreLabel =
    score >= 70 ? "Excelente" : score >= 40 ? "Regular" : "Necesita atención";
  const circleStroke =
    score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - score / 100);

  const scoreBreakdown = useMemo(() => {
    if (!analysis) return [];
    const items: { label: string; value: number; color: string }[] = [];
    items.push({
      label: "Combustible",
      value: analysis.fuelPercentage <= 20 ? 100 : analysis.fuelPercentage <= 30 ? 60 : 20,
      color: analysis.fuelPercentage <= 20 ? "#22c55e" : analysis.fuelPercentage <= 30 ? "#f59e0b" : "#ef4444",
    });
    items.push({
      label: "Tendencia",
      value: analysis.weeklyTrend === "up" ? 100 : analysis.weeklyTrend === "stable" ? 60 : 20,
      color: analysis.weeklyTrend === "up" ? "#22c55e" : analysis.weeklyTrend === "stable" ? "#f59e0b" : "#ef4444",
    });
    items.push({
      label: "Eficiencia",
      value: analysis.fuelEfficiencyTrend === "improving" ? 100 : analysis.fuelEfficiencyTrend === "stable" ? 60 : 20,
      color: analysis.fuelEfficiencyTrend === "improving" ? "#22c55e" : analysis.fuelEfficiencyTrend === "stable" ? "#f59e0b" : "#ef4444",
    });
    return items;
  }, [analysis]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-color">Asistente IA</h1>
          <p className="mt-1 text-sm text-secondary-color">Analizando datos...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <Brain className="h-12 w-12 text-primary-500" />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary-500/20"
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            <div className="shimmer-bg rounded-full px-6 py-2">
              <p className="text-sm font-medium text-secondary-color">Procesando información...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-color">Asistente IA</h1>
          <p className="mt-1 text-sm text-secondary-color">Recomendaciones inteligentes</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="gradient-border">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary-500" />
              <div>
                <p className="text-sm font-medium text-primary-color">Análisis automático</p>
                <p className="mt-1 text-xs text-secondary-color">
                  La IA analizará tus hábitos, detectará problemas y generará recomendaciones
                  personalizadas para optimizar tu negocio.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" as const, stiffness: 120, damping: 12 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-hover"
            >
              <Brain className="h-10 w-10 text-primary-500" />
            </motion.div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary-color">Sin datos aún</h3>
              <p className="max-w-sm text-sm text-secondary-color">
                Comienza a registrar tus entradas diarias, gastos de combustible y mantenimiento
                para que la IA pueda analizar tus hábitos y brindarte recomendaciones personalizadas.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-2 grid grid-cols-2 gap-3 text-left text-xs text-secondary-color"
            >
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2"
              >
                <Zap className="h-3.5 w-3.5 text-warning-500" />
                <span>Analizar hábitos</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2"
              >
                <Shield className="h-3.5 w-3.5 text-primary-500" />
                <span>Detectar anomalías</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-3.5 w-3.5 text-success-500" />
                <span>Tendencias de ingresos</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-2"
              >
                <Target className="h-3.5 w-3.5 text-danger-500" />
                <span>Progreso de metas</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-color">Asistente IA</h1>
        <p className="mt-1 text-sm text-secondary-color">Análisis inteligente de tu negocio</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring" as const, stiffness: 100, damping: 15 }}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-6">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-surface-300"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                  stroke={circleStroke}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring" as const, stiffness: 200, delay: 0.3 }}
                  className={cn("text-3xl font-bold", scoreColor)}
                >
                  <AnimatedNumber value={score} />
                </motion.span>
                <span className={cn("text-[10px] font-medium uppercase tracking-wider", scoreColor)}>
                  {scoreLabel}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-light rounded-2xl px-4 py-3"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-secondary-color">Resumen</p>
                <p className="mt-1 text-sm text-primary-color">
                  {analysis!.entryCount} registros analizados
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-light rounded-2xl px-4 py-3"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-secondary-color">Tendencia semanal</p>
                <div className="flex items-center gap-2 mt-1">
                  {analysis!.weeklyTrend === "up" && <TrendingUp className="h-4 w-4 text-success-500" />}
                  {analysis!.weeklyTrend === "down" && <TrendingDown className="h-4 w-4 text-danger-500" />}
                  {analysis!.weeklyTrend === "stable" && <BarChart3 className="h-4 w-4 text-secondary-color" />}
                  <span className="text-sm text-primary-color font-medium">
                    {analysis!.weeklyTrend === "up" ? "Al alza" : analysis!.weeklyTrend === "down" ? "A la baja" : "Estable"}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { title: "Ingresos totales", value: formatCurrency(analysis!.totalEarnings), delay: 0.1 },
          { title: "Promedio diario", value: formatCurrency(analysis!.avgEarnings), delay: 0.15 },
          { title: "Combustible", value: `${analysis!.fuelPercentage.toFixed(0)}%`, delay: 0.2, danger: analysis!.fuelPercentage > 30 },
          { title: "Registros", value: String(analysis!.entryCount), delay: 0.25 },
        ].map((item) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: item.delay, type: "spring" as const, stiffness: 120, damping: 14 }}
          >
            <Card padding="sm">
              <CardTitle>{item.title}</CardTitle>
              <CardValue className={cn("text-lg", item.danger ? "text-danger-500" : "")}>{item.value}</CardValue>
            </Card>
          </motion.div>
        ))}
      </div>

      {scoreBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Desglose del puntaje</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {scoreBreakdown.map((item, i) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary-color">{item.label}</span>
                    <span className="font-medium text-primary-color">{item.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-hover">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.15, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-secondary-color">
            Recomendaciones ({recommendations.length})
          </h2>
          {recommendations.map((rec, i) => {
            const pConfig = priorityConfig[rec.priority];
            const cConfig = categoryConfig[rec.category];
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07, type: "spring" as const, stiffness: 120, damping: 14 }}
              >
                <Card padding="sm" className="relative overflow-hidden card-interactive">
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1", pConfig.dot)} />
                  <div className="flex items-start gap-3 pl-2">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{ type: "spring" as const, stiffness: 300 }}
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-hover"
                    >
                      <span className="text-secondary-color">{rec.icon}</span>
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-primary-color">{rec.title}</p>
                        <span className="flex items-center gap-1.5 text-[10px] font-medium text-secondary-color">
                          <span className={cn("h-1.5 w-1.5 rounded-full", pConfig.dot)} />
                          {pConfig.label}
                        </span>
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full bg-hover px-2 py-0.5 text-[10px] font-medium text-secondary-color transition-colors duration-300 cursor-default",
                            categoryHoverColors[rec.category]
                          )}
                        >
                          {cConfig.icon}
                          {cConfig.label}
                        </motion.span>
                      </div>
                      <p className="mt-1 text-xs text-secondary-color">{rec.description}</p>
                    </div>
                    {rec.priority === "high" ? (
                      <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                        <AlertTriangle className="h-4 w-4 shrink-0 text-danger-500" />
                      </motion.div>
                    ) : rec.priority === "medium" ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-warning-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success-500" />
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {analysis!.appList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="card-interactive">
            <CardHeader>
              <CardTitle>Rendimiento por App</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {analysis!.appList.map((app, i) => {
                const maxTotal = analysis!.appList[0]?.total || 1;
                const width = (app.total / maxTotal) * 100;
                return (
                  <div key={app.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-primary-color">{app.name}</span>
                      <span className="text-secondary-color">{formatCurrency(app.total)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-hover">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ duration: 0.8, delay: 0.6 + i * 0.1, ease: "easeOut" }}
                        className="h-full rounded-full bg-primary-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {analysis!.avgByDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="card-interactive">
            <CardHeader>
              <CardTitle>Promedio por día de semana</CardTitle>
            </CardHeader>
            <div className="flex items-end gap-1.5" style={{ height: 100 }}>
              {analysis!.avgByDay.map((d, i) => {
                const maxAvg = Math.max(...analysis!.avgByDay.map((x) => x.avg), 1);
                const height = (d.avg / maxAvg) * 100;
                const isBest = d.name === analysis!.bestDay?.name;
                return (
                  <div key={d.name} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full justify-center" style={{ height: 80 }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 4)}%` }}
                        transition={{ duration: 0.6, delay: 0.7 + i * 0.06, type: "spring" as const, stiffness: 80 }}
                        className={cn(
                          "w-full max-w-[24px] rounded-t-md",
                          isBest ? "bg-primary-500" : "bg-surface-400"
                        )}
                      />
                    </div>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 + i * 0.05 }}
                      className={cn(
                        "text-[10px]",
                        isBest ? "font-bold text-primary-500" : "text-secondary-color"
                      )}
                    >
                      {d.name}
                    </motion.span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

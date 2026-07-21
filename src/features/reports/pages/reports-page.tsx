import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Fuel,
  Wallet,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useDailyEntries } from "@/hooks/use-daily-entries";
import { useVehicles } from "@/hooks/use-vehicles";
import { cn, formatCurrency } from "@/lib/utils";
import type { DailyEntry } from "@/types";

type TimePeriod = "day" | "week" | "month" | "year";

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: "day", label: "Hoy" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Año" },
];

const COLORS = ["#4f6eff", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

function getDateRange(period: TimePeriod) {
  const now = new Date();
  switch (period) {
    case "day":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
  }
}

function filterEntries(entries: DailyEntry[], start: Date, end: Date) {
  return entries.filter((e) => isWithinInterval(new Date(e.date), { start, end }));
}

function buildDailyData(entries: DailyEntry[]) {
  if (!entries.length) return [];
  return entries.map((e) => ({
    date: format(new Date(e.date), "dd MMM", { locale: es }),
    ingresos: e.earnings,
    gastos: e.expenses + e.fuelCost,
  }));
}

function buildAppBreakdown(entries: DailyEntry[]) {
  const map = new Map<string, number>();
  for (const e of entries) {
    for (const app of e.appsUsed) {
      map.set(app, (map.get(app) || 0) + e.earnings);
    }
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildExpenseBreakdown(entries: DailyEntry[]) {
  const fuel = entries.reduce((s, e) => s + e.fuelCost, 0);
  const expenses = entries.reduce((s, e) => s + e.expenses, 0);
  const items = [];
  if (fuel > 0) items.push({ name: "Gasolina", value: fuel });
  if (expenses > 0) items.push({ name: "Otros gastos", value: expenses });
  return items;
}

function buildTrendData(entries: DailyEntry[]) {
  if (!entries.length) return [];
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let cumulative = 0;
  return sorted.map((e) => {
    cumulative += e.earnings - e.expenses - e.fuelCost;
    return {
      date: format(new Date(e.date), "dd MMM", { locale: es }),
      tendencia: cumulative,
    };
  });
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-theme-subtle bg-hover px-4 py-3 shadow-xl shadow-black/40">
      <p className="mb-1 text-xs font-medium text-secondary-color">{label}</p>
      {payload.map((item: TooltipPayloadItem, idx: number) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: item.color }}>
          {item.name}: {formatCurrency(item.value ?? 0)}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-theme-subtle bg-hover px-4 py-3 shadow-xl shadow-black/40">
      <p className="text-sm font-semibold text-primary-color">{payload[0].name}</p>
      <p className="text-sm text-primary-500">{formatCurrency(payload[0].value ?? 0)}</p>
    </div>
  );
};

function ShimmerSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-hover" style={{ height }}>
      <motion.div
        className="absolute inset-0"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
        }}
      />
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <motion.div
      className="flex h-64 items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring" as const, stiffness: 200, damping: 15 }}
    >
      <p className="text-sm text-secondary-color">{message}</p>
    </motion.div>
  );
}

function AnimatedNumber({ value, duration = 1 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = () => {
      let startTs: number | null = null;
      const tick = (now: number) => {
        if (startTs === null) startTs = now;
        const elapsed = now - startTs;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(value * eased);
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(start);
    return () => cancelAnimationFrame(raf);
  }, [value, inView, duration]);

  return <span ref={ref}>{formatCurrency(display)}</span>;
}

function SummaryCard({ icon, title, value, color, trend, index }: { icon: React.ReactNode; title: string; value: React.ReactNode; color: string; trend?: number; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: (index ?? 0) * 0.08,
        type: "spring" as const,
        stiffness: 200,
        damping: 18,
      }}
      whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 20 } }}
    >
      <Card className="card-interactive hover-lift">
        <div className="flex items-start justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", color)}>
            {icon}
          </div>
          {trend !== undefined && trend !== 0 && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", trend > 0 ? "text-success-500" : "text-danger-500")}>
              {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardValue className="mt-1">{value}</CardValue>
      </Card>
    </motion.div>
  );
}

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
};

function AnimatedChartCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      variants={chartVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 20 } }}
    >
      {children}
    </motion.div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<TimePeriod>("month");
  const { entries, loading } = useDailyEntries();
  const { activeVehicle } = useVehicles();
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setChartReady(false);
    const timer = setTimeout(() => setChartReady(true), 400);
    return () => clearTimeout(timer);
  }, [period]);

  const { start, end } = getDateRange(period);

  const filteredEntries = useMemo(() => {
    let scoped = entries;
    if (activeVehicle) {
      scoped = entries.filter((e) => e.vehicleId === activeVehicle.id);
    }
    return filterEntries(scoped, start, end);
  }, [entries, activeVehicle, start, end]);

  const allEntries = useMemo(() => {
    if (activeVehicle) return entries.filter((e) => e.vehicleId === activeVehicle.id);
    return entries;
  }, [entries, activeVehicle]);

  const stats = useMemo(() => {
    const totalEarnings = filteredEntries.reduce((s, e) => s + e.earnings, 0);
    const totalExpenses = filteredEntries.reduce((s, e) => s + e.expenses, 0);
    const totalFuelCost = filteredEntries.reduce((s, e) => s + e.fuelCost, 0);
    const totalHours = filteredEntries.reduce((s, e) => s + (e.hoursWorked || 0), 0);
    return {
      totalEarnings,
      totalExpenses,
      totalFuelCost,
      netProfit: totalEarnings - totalExpenses - totalFuelCost,
      totalHours,
    };
  }, [filteredEntries]);

  const prevRange = useMemo(() => {
    const diff = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - diff),
      end: new Date(end.getTime() - diff),
    };
  }, [start, end]);

  const prevStats = useMemo(() => {
    const prev = filterEntries(allEntries, prevRange.start, prevRange.end);
    return {
      totalEarnings: prev.reduce((s, e) => s + e.earnings, 0),
      totalExpenses: prev.reduce((s, e) => s + e.expenses + e.fuelCost, 0),
    };
  }, [allEntries, prevRange]);

  const earningsTrend = prevStats.totalEarnings > 0
    ? ((stats.totalEarnings - prevStats.totalEarnings) / prevStats.totalEarnings) * 100
    : 0;

  const expenseTrend = prevStats.totalExpenses > 0
    ? ((stats.totalExpenses + stats.totalFuelCost - prevStats.totalExpenses) / prevStats.totalExpenses) * 100
    : 0;

  const dailyData = useMemo(() => buildDailyData(filteredEntries), [filteredEntries]);
  const appBreakdown = useMemo(() => buildAppBreakdown(filteredEntries), [filteredEntries]);
  const expenseBreakdown = useMemo(() => buildExpenseBreakdown(filteredEntries), [filteredEntries]);
  const trendData = useMemo(() => buildTrendData(allEntries), [allEntries]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-hover" />
        <div className="flex gap-1 rounded-full bg-hover p-1 w-fit">
          {PERIODS.map((p) => (
            <div key={p.key} className="h-7 w-16 animate-pulse rounded-full bg-surface-500" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-hover" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ShimmerSkeleton />
          <ShimmerSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ShimmerSkeleton />
          <ShimmerSkeleton />
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      icon: <DollarSign className="h-5 w-5 text-primary-color" />,
      title: "Total ingresos",
      rawValue: stats.totalEarnings,
      color: "bg-success-500/20",
      trend: earningsTrend,
    },
    {
      icon: <Wallet className="h-5 w-5 text-primary-color" />,
      title: "Total gastos",
      rawValue: stats.totalExpenses + stats.totalFuelCost,
      color: "bg-danger-500/20",
      trend: expenseTrend,
    },
    {
      icon: <Fuel className="h-5 w-5 text-primary-color" />,
      title: "Gasto en gasolina",
      rawValue: stats.totalFuelCost,
      color: "bg-warning-500/20",
      trend: undefined,
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-primary-color" />,
      title: "Ganancia neta",
      rawValue: stats.netProfit,
      color: cn(stats.netProfit >= 0 ? "bg-primary-500/20" : "bg-danger-500/20"),
      trend: undefined,
    },
    {
      icon: <Clock className="h-5 w-5 text-primary-color" />,
      title: "Horas trabajadas",
      value: stats.totalHours.toFixed(1),
      color: "bg-surface-500/20",
      trend: undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-color">Reportes</h1>
          <p className="mt-1 text-sm text-secondary-color">Análisis detallado de tu negocio</p>
        </div>
        <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
          <Button size="sm" className="btn-ripple press-effect">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </motion.div>
      </div>

      <div className="inline-flex gap-1 rounded-full bg-hover p-1 relative">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className="relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-200 z-10"
            style={{ color: period === p.key ? undefined : undefined }}
          >
            {period === p.key && (
              <motion.div
                className="absolute inset-0 rounded-full bg-white"
                layoutId="activePeriod"
                transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              />
            )}
            <span className={cn(
              "relative z-10",
              period === p.key ? "text-black" : "text-secondary-color hover:text-primary-color",
            )}>
              {p.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {summaryCards.map((card, idx) => (
              <SummaryCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                value={
                  "value" in card && card.value !== undefined
                    ? card.value
                    : (() => {
                        const rawVal = "rawValue" in card ? card.rawValue as number : 0;
                        return <AnimatedNumber value={rawVal} duration={0.8 + idx * 0.1} />;
                      })()
                }
                color={card.color}
                trend={"trend" in card ? card.trend : undefined}
                index={idx}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AnimatedChartCard delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos vs Gastos</CardTitle>
                  <BarChart3 className="h-4 w-4 text-secondary-color" />
                </CardHeader>
                {chartReady && dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="gradientIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradientGastos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#22c55e" fill="url(#gradientIngresos)" strokeWidth={2} />
                      <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" fill="url(#gradientGastos)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : !chartReady ? (
                  <ShimmerSkeleton />
                ) : (
                  <EmptyChart message="No hay datos para mostrar" />
                )}
              </Card>
            </AnimatedChartCard>

            <AnimatedChartCard delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos por app</CardTitle>
                  <BarChart3 className="h-4 w-4 text-secondary-color" />
                </CardHeader>
                {chartReady && appBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={appBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Ingresos" radius={[6, 6, 0, 0]}>
                        {appBreakdown.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : !chartReady ? (
                  <ShimmerSkeleton />
                ) : (
                  <EmptyChart message="No hay datos de apps disponibles" />
                )}
              </Card>
            </AnimatedChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AnimatedChartCard delay={0.3}>
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de gastos</CardTitle>
                  <BarChart3 className="h-4 w-4 text-secondary-color" />
                </CardHeader>
                {chartReady && expenseBreakdown.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="name"
                        >
                          {expenseBreakdown.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : !chartReady ? (
                  <ShimmerSkeleton />
                ) : (
                  <EmptyChart message="No hay gastos registrados" />
                )}
              </Card>
            </AnimatedChartCard>

            <AnimatedChartCard delay={0.4}>
              <Card>
                <CardHeader>
                  <CardTitle>Tendencia de ganancias</CardTitle>
                  <TrendingUp className="h-4 w-4 text-secondary-color" />
                </CardHeader>
                {chartReady && trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="tendencia" name="Tendencia" stroke="#4f6eff" strokeWidth={2} dot={{ fill: "#4f6eff", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : !chartReady ? (
                  <ShimmerSkeleton />
                ) : (
                  <EmptyChart message="No hay datos suficientes para la tendencia" />
                )}
              </Card>
            </AnimatedChartCard>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

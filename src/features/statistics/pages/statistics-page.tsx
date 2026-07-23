import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Percent,
  Gauge,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
  subWeeks,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { useDailyEntries } from "@/hooks/use-daily-entries";
import { useVehicles } from "@/hooks/use-vehicles";
import { cn, formatCurrency } from "@/lib/utils";
import type { DailyEntry } from "@/types";

type StatPeriod = "weekly" | "monthly" | "yearly";

const PERIODS: { key: StatPeriod; label: string }[] = [
  { key: "weekly", label: "Semanal" },
  { key: "monthly", label: "Mensual" },
  { key: "yearly", label: "Anual" },
];

const COLORS = ["#4f6eff", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

function getDateRange(period: StatPeriod) {
  const now = new Date();
  switch (period) {
    case "weekly":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "monthly":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "yearly":
      return { start: startOfYear(now), end: endOfYear(now) };
  }
}

function filterEntries(entries: DailyEntry[], start: Date, end: Date) {
  return entries.filter((e) => isWithinInterval(new Date(e.date), { start, end }));
}

function buildWeeklyComparison(entries: DailyEntry[]) {
  const now = new Date();
  const weeks = eachWeekOfInterval({ start: subWeeks(now, 7), end: now }, { weekStartsOn: 1 });
  return weeks.map((weekStart, i) => {
    const weekEnd = i < weeks.length - 1 ? new Date(weeks[i + 1].getTime() - 1) : endOfWeek(now, { weekStartsOn: 1 });
    const weekEntries = entries.filter((e) => isWithinInterval(new Date(e.date), { start: weekStart, end: weekEnd }));
    const ingresos = weekEntries.reduce((s, e) => s + e.earnings, 0);
    const gastos = weekEntries.reduce((s, e) => s + e.expenses + e.fuelCost, 0);
    return {
      name: format(weekStart, "dd MMM", { locale: es }),
      ingresos,
      gastos,
    };
  });
}

function buildMonthlyComparison(entries: DailyEntry[]) {
  const now = new Date();
  const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
  return months.map((monthStart, i) => {
    const monthEnd = i < months.length - 1 ? new Date(months[i + 1].getTime() - 1) : endOfMonth(now);
    const monthEntries = entries.filter((e) => isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd }));
    const ingresos = monthEntries.reduce((s, e) => s + e.earnings, 0);
    const gastos = monthEntries.reduce((s, e) => s + e.expenses + e.fuelCost, 0);
    return {
      name: format(monthStart, "MMM yyyy", { locale: es }),
      ingresos,
      gastos,
    };
  });
}

function buildYearlyComparison(entries: DailyEntry[]) {
  const now = new Date();
  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear(); y++) {
    years.push(new Date(y, 0, 1));
  }
  return years.map((yearStart) => {
    const yearEnd = new Date(yearStart.getFullYear(), 11, 31, 23, 59, 59);
    const yearEntries = entries.filter((e) => isWithinInterval(new Date(e.date), { start: yearStart, end: yearEnd }));
    const ingresos = yearEntries.reduce((s, e) => s + e.earnings, 0);
    const gastos = yearEntries.reduce((s, e) => s + e.expenses + e.fuelCost, 0);
    return {
      name: format(yearStart, "yyyy"),
      ingresos,
      gastos,
    };
  });
}

function buildEarningsTrend(entries: DailyEntry[]) {
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let cumulative = 0;
  return sorted.map((e) => {
    cumulative += e.earnings;
    return {
      date: format(new Date(e.date), "dd MMM", { locale: es }),
      acumulado: cumulative,
    };
  });
}

function buildKmOverTime(entries: DailyEntry[]) {
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let cumulative = 0;
  return sorted.map((e) => {
    cumulative += e.kilometers;
    return {
      date: format(new Date(e.date), "dd MMM", { locale: es }),
      km: cumulative,
    };
  });
}

function buildExpenseBreakdown(entries: DailyEntry[]) {
  const fuel = entries.reduce((s, e) => s + e.fuelCost, 0);
  const other = entries.reduce((s, e) => s + e.expenses, 0);
  const items = [];
  if (fuel > 0) items.push({ name: "Gasolina", value: fuel });
  if (other > 0) items.push({ name: "Otros gastos", value: other });
  return items;
}

function buildTopDays(entries: DailyEntry[]) {
  const dayMap = new Map<string, { ingresos: number; count: number }>();
  for (const e of entries) {
    const day = format(new Date(e.date), "EEEE", { locale: es });
    const existing = dayMap.get(day) || { ingresos: 0, count: 0 };
    dayMap.set(day, {
      ingresos: existing.ingresos + e.earnings,
      count: existing.count + 1,
    });
  }
  return Array.from(dayMap.entries())
    .map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      ingresos: data.ingresos,
      promedio: data.count > 0 ? data.ingresos / data.count : 0,
    }))
    .sort((a, b) => b.ingresos - a.ingresos);
}

function buildVehicleComparison(entries: DailyEntry[], vehicles: { id: string; brand: string; model: string }[]) {
  return vehicles.map((v) => {
    const vEntries = entries.filter((e) => e.vehicleId === v.id);
    return {
      name: `${v.brand} ${v.model}`,
      ingresos: vEntries.reduce((s, e) => s + e.earnings, 0),
      gastos: vEntries.reduce((s, e) => s + e.expenses + e.fuelCost, 0),
      km: vEntries.reduce((s, e) => s + e.kilometers, 0),
      dias: vEntries.length,
    };
  }).filter((v) => v.dias > 0);
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

const KmTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-theme-subtle bg-hover px-4 py-3 shadow-xl shadow-black/40">
      <p className="mb-1 text-xs font-medium text-secondary-color">{label}</p>
      {payload.map((item: TooltipPayloadItem, idx: number) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: item.color }}>
          {item.name}: {(item.value ?? 0).toLocaleString("es-CO")} km
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

function EmptyChart({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring" as const, stiffness: 280, damping: 24 }}
      className="flex h-64 items-center justify-center"
    >
      <motion.p
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-sm text-secondary-color"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

function StatCard({
  icon,
  title,
  value,
  color,
  delay = 0,
  isBest = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
  delay?: number;
  isBest?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring" as const, stiffness: 280, damping: 24 }}
      whileHover={{ y: -2 }}
    >
      <Card className={cn(isBest && "shadow-lg shadow-primary-500/20")}>
        {isBest && (
          <motion.div
            className="absolute inset-0 rounded-3xl bg-primary-500/5"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", color)}>
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardValue className="mt-1">{value}</CardValue>
      </Card>
    </motion.div>
  );
}

export default function StatisticsPage() {
  const [period, setPeriod] = useState<StatPeriod>("monthly");
  const { entries, loading } = useDailyEntries();
  const { vehicles, activeVehicle } = useVehicles();

  const scopedEntries = useMemo(() => {
    if (activeVehicle) return entries.filter((e) => e.vehicleId === activeVehicle.id);
    return entries;
  }, [entries, activeVehicle]);

  const { start, end } = getDateRange(period);

  const filteredEntries = useMemo(
    () => filterEntries(scopedEntries, start, end),
    [scopedEntries, start, end]
  );

  const allEntries = scopedEntries;

  const stats = useMemo(() => {
    const totalEarnings = filteredEntries.reduce((s, e) => s + e.earnings, 0);
    const totalExpenses = filteredEntries.reduce((s, e) => s + e.expenses + e.fuelCost, 0);
    const totalKm = filteredEntries.reduce((s, e) => s + e.kilometers, 0);
    const avgConsumption = totalKm > 0 ? filteredEntries.reduce((s, e) => s + e.fuelAmount, 0) / totalKm * 100 : 0;
    const profitability = totalEarnings > 0 ? ((totalEarnings - totalExpenses) / totalEarnings) * 100 : 0;
    return {
      totalEarnings,
      totalExpenses,
      totalKm,
      profitability,
      avgConsumption,
    };
  }, [filteredEntries]);

  const weeklyComp = useMemo(() => buildWeeklyComparison(allEntries), [allEntries]);
  const monthlyComp = useMemo(() => buildMonthlyComparison(allEntries), [allEntries]);
  const yearlyComp = useMemo(() => buildYearlyComparison(allEntries), [allEntries]);
  const earningsTrend = useMemo(() => buildEarningsTrend(allEntries), [allEntries]);
  const kmOverTime = useMemo(() => buildKmOverTime(allEntries), [allEntries]);
  const expenseBreakdown = useMemo(() => buildExpenseBreakdown(filteredEntries), [filteredEntries]);
  const topDays = useMemo(() => buildTopDays(allEntries), [allEntries]);
  const vehicleComparison = useMemo(() => buildVehicleComparison(allEntries, vehicles), [allEntries, vehicles]);

  const comparisonData = useMemo(() => {
    switch (period) {
      case "weekly": return weeklyComp;
      case "monthly": return monthlyComp;
      case "yearly": return yearlyComp;
    }
  }, [period, weeklyComp, monthlyComp, yearlyComp]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-color">Estadísticas</h1>
          <p className="mt-1 text-sm text-secondary-color">Tendencias y patrones de tu negocio</p>
        </div>
      </div>

      <div className="inline-flex gap-1 rounded-full bg-hover p-1 relative">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-200",
              period === p.key
                ? "text-on-primary"
                : "text-secondary-color hover:text-primary-color"
            )}
          >
            {period === p.key && (
              <motion.div
                layoutId="period-tab"
                className="absolute inset-0 rounded-full bg-primary-500"
                transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative z-10">{p.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-primary-color" />}
              title="Ingresos totales"
              value={formatCurrency(stats.totalEarnings)}
              color="bg-success-500/20"
              delay={0}
            />
            <StatCard
              icon={<TrendingDown className="h-5 w-5 text-primary-color" />}
              title="Gastos totales"
              value={formatCurrency(stats.totalExpenses)}
              color="bg-danger-500/20"
              delay={0.05}
            />
            <StatCard
              icon={<MapPin className="h-5 w-5 text-primary-color" />}
              title="Kilómetros"
              value={`${stats.totalKm.toLocaleString("es-CO")} km`}
              color="bg-primary-500/20"
              delay={0.1}
            />
            <StatCard
              icon={<Percent className="h-5 w-5 text-primary-color" />}
              title="Rentabilidad"
              value={`${stats.profitability.toFixed(1)}%`}
              color={cn(stats.profitability >= 0 ? "bg-success-500/20" : "bg-danger-500/20")}
              delay={0.15}
            />
            <StatCard
              icon={<Gauge className="h-5 w-5 text-primary-color" />}
              title="Consumo promedio"
              value={stats.avgConsumption > 0 ? `${stats.avgConsumption.toFixed(1)} L/100km` : "N/A"}
              color="bg-warning-500/20"
              delay={0.2}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Card className="card-interactive overflow-hidden">
                <CardHeader>
                  <CardTitle>Ingresos vs Gastos</CardTitle>
                  <BarChart3 className="h-4 w-4 text-secondary-color" />
                </CardHeader>
                {comparisonData.some((d) => d.ingresos > 0 || d.gastos > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No hay datos para este período" />
                )}
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <Card className="card-interactive overflow-hidden">
                <CardHeader>
                  <CardTitle>Tendencia de ingresos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-secondary-color" />
                </CardHeader>
                {earningsTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={earningsTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke="#4f6eff" strokeWidth={2} dot={{ fill: "#4f6eff", r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No hay datos suficientes para la tendencia" />
                )}
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Card className="card-interactive overflow-hidden">
                <CardHeader>
                  <CardTitle>Kilómetros recorridos</CardTitle>
                  <MapPin className="h-4 w-4 text-secondary-color" />
                </CardHeader>
                {kmOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={kmOverTime}>
                      <defs>
                        <linearGradient id="gradientKm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                      <Tooltip content={<KmTooltip />} />
                      <Area type="monotone" dataKey="km" name="Kilómetros" stroke="#06b6d4" fill="url(#gradientKm)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No hay datos de kilómetros" />
                )}
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <Card className="card-interactive overflow-hidden">
                <CardHeader>
                  <CardTitle>Distribución de gastos</CardTitle>
                  <BarChart3 className="h-4 w-4 text-secondary-color" />
                </CardHeader>
                {expenseBreakdown.length > 0 ? (
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
                ) : (
                  <EmptyChart message="No hay gastos registrados" />
                )}
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Card className="card-interactive overflow-hidden">
                <CardHeader>
                  <CardTitle>Mejores días de ingresos</CardTitle>
                  <Calendar className="h-4 w-4 text-secondary-color" />
                </CardHeader>
                {topDays.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topDays} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#4f6eff" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart message="No hay datos de días disponibles" />
                )}
              </Card>
            </motion.div>

            {vehicleComparison.length > 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.3 }}
              >
                <Card className="card-interactive overflow-hidden">
                  <CardHeader>
                    <CardTitle>Comparación de vehículos</CardTitle>
                    <BarChart3 className="h-4 w-4 text-secondary-color" />
                  </CardHeader>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={vehicleComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" axisLine={{ stroke: "#404040" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

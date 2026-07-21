import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  DollarSign,
  MapPin,
  Fuel,
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { dailyEntrySchema, type DailyEntryFormData } from "@/lib/schemas";
import { useVehicles } from "@/hooks/use-vehicles";
import { useDailyEntries } from "@/hooks/use-daily-entries";
import { useAppStore } from "@/store/use-app-store";
import { vehicleRepository } from "@/database/repositories/vehicle-repository";
import { walletRepository } from "@/database/repositories/wallet-repository";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { playCoin } from "@/lib/sounds";
import { useEffect } from "react";

const APPS = ["Uber", "DiDi", "InDrive", "Rappi", "Otro"];

interface SavedSummary {
  earnings: number;
  kilometers: number;
  fuelCost: number;
  expenses: number;
  netProfit: number;
}

function AnimatedCurrency({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => formatCurrency(Math.round(v)));

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span>{display}</motion.span>;
}

const sectionStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const sectionSlideUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const vehicleSlide = {
  hidden: { opacity: 0, x: -30 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const summaryStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const summaryItem = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function DailyClosePage() {
  const { activeVehicle } = useVehicles();
  const { todayEntry, create } = useDailyEntries(activeVehicle?.id);
  const profile = useAppStore((s) => s.profile);
  const [saving, setSaving] = useState(false);
  const [savedSummary, setSavedSummary] = useState<SavedSummary | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<DailyEntryFormData>({
    resolver: zodResolver(dailyEntrySchema) as never,
    defaultValues: {
      vehicleId: activeVehicle?.id ?? "",
      date: new Date(),
      earnings: todayEntry?.earnings ?? 0,
      kilometers: todayEntry?.kilometers ?? 0,
      fuelAmount: todayEntry?.fuelAmount ?? 0,
      fuelCost: todayEntry?.fuelCost ?? 0,
      expenses: todayEntry?.expenses ?? 0,
      hoursWorked: todayEntry?.hoursWorked ?? undefined,
      appsUsed: todayEntry?.appsUsed ?? [],
      notes: todayEntry?.notes ?? "",
    },
  });

  const watchedEarnings = watch("earnings") || 0;
  const watchedExpenses = watch("expenses") || 0;
  const watchedFuelCost = watch("fuelCost") || 0;

  const handleAppToggle = (app: string, currentApps: string[], onChange: (v: string[]) => void) => {
    if (currentApps.includes(app)) {
      onChange(currentApps.filter((a) => a !== app));
    } else {
      onChange([...currentApps, app]);
    }
  };

  const onSubmit = async (data: DailyEntryFormData) => {
    if (!activeVehicle || !profile) return;
    setSaving(true);

    try {
      await create({
        vehicleId: activeVehicle.id,
        date: new Date(),
        earnings: data.earnings,
        kilometers: data.kilometers,
        fuelAmount: data.fuelAmount,
        fuelCost: data.fuelCost,
        expenses: data.expenses,
        hoursWorked: data.hoursWorked,
        appsUsed: data.appsUsed,
        notes: data.notes,
      });

      await vehicleRepository.update(activeVehicle.id, {
        mileage: activeVehicle.mileage + data.kilometers,
      });

      if (data.earnings > 0) {
        await walletRepository.distribute(profile.id, data.earnings);
      }

      const net = data.earnings - data.expenses - data.fuelCost;
      setSavedSummary({
        earnings: data.earnings,
        kilometers: data.kilometers,
        fuelCost: data.fuelCost,
        expenses: data.expenses,
        netProfit: net,
      });

      try { playCoin(); } catch {}
      toast.success("Cierre del día guardado", {
        description: `Ganancia neta: ${formatCurrency(net)}`,
      });
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSavedSummary(null);
    reset({
      vehicleId: activeVehicle?.id ?? "",
      date: new Date(),
      earnings: 0,
      kilometers: 0,
      fuelAmount: 0,
      fuelCost: 0,
      expenses: 0,
      hoursWorked: undefined,
      appsUsed: [],
      notes: "",
    });
  };

  if (!activeVehicle) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-primary-color">Cierre del día</h1>
          <p className="text-sm text-secondary-color">Registra tu día en segundos</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Card className="py-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" as const, stiffness: 260, damping: 20, delay: 0.3 }}
            >
              <Fuel className="mx-auto mb-3 h-12 w-12 text-muted-color" />
            </motion.div>
            <p className="text-sm text-secondary-color">No tienes un vehículo activo</p>
            <p className="mt-1 text-xs text-secondary-color">
              Selecciona o crea un vehículo para comenzar
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-primary-color">Cierre del día</h1>
        <p className="text-sm text-secondary-color">
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </motion.div>

      <motion.div
        variants={vehicleSlide}
        initial="hidden"
        animate="show"
        whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <Card padding="sm">
          <p className="px-1 text-xs text-secondary-color">
            Vehículo activo:{" "}
            <span className="font-medium text-primary-color">
              {activeVehicle.brand} {activeVehicle.model}
            </span>
          </p>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        {savedSummary ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <motion.div
              variants={summaryStagger}
              initial="hidden"
              animate="show"
              whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            >
              <Card className="border-primary-500/20">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring" as const, stiffness: 300, damping: 24 }}
                  className="mb-6 flex items-center gap-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <CheckCircle2 className="h-5 w-5 text-primary-color" />
                  </div>
                  <h2 className="text-lg font-semibold text-primary-color">
                    Resumen del día
                  </h2>
                </motion.div>

                <div className="space-y-4">
                  <motion.div variants={summaryItem} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="h-4 w-4 text-success-400" />
                      <span className="text-sm text-primary-color">Ingresos</span>
                    </div>
                    <span className="font-semibold text-success-400">
                      <AnimatedCurrency value={savedSummary.earnings} />
                    </span>
                  </motion.div>

                  <motion.div variants={summaryItem} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 text-secondary-color" />
                      <span className="text-sm text-primary-color">Kilómetros</span>
                    </div>
                    <span className="text-sm font-medium text-primary-color">
                      {formatNumber(savedSummary.kilometers)} km
                    </span>
                  </motion.div>

                  {savedSummary.fuelCost > 0 && (
                    <motion.div variants={summaryItem} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Fuel className="h-4 w-4 text-secondary-color" />
                        <span className="text-sm text-primary-color">Tanqueo</span>
                      </div>
                      <span className="text-sm font-medium text-primary-color">
                        <AnimatedCurrency value={savedSummary.fuelCost} />
                      </span>
                    </motion.div>
                  )}

                  {savedSummary.expenses > 0 && (
                    <motion.div variants={summaryItem} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="h-4 w-4 text-secondary-color" />
                        <span className="text-sm text-primary-color">Gastos</span>
                      </div>
                      <span className="text-sm font-medium text-primary-color">
                        <AnimatedCurrency value={savedSummary.expenses} />
                      </span>
                    </motion.div>
                  )}

                  <motion.div variants={summaryItem} className="border-t border-theme-subtle pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <DollarSign className="h-4 w-4 text-primary-color" />
                        <span className="text-sm font-medium text-primary-color">
                          Ganancia neta
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-lg font-bold",
                          savedSummary.netProfit >= 0
                            ? "text-success-400"
                            : "text-danger-400",
                        )}
                      >
                        <AnimatedCurrency value={savedSummary.netProfit} />
                      </span>
                    </div>
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.03 }}>
                <Button
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  Nuevo cierre
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit(onSubmit)}
          >
            {saving ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-5"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-24 shimmer-bg rounded" />
                    <div className="h-12 w-full shimmer-bg rounded-2xl" />
                  </div>
                ))}
                <div className="h-12 w-full shimmer-bg rounded-full" />
              </motion.div>
            ) : (
              <motion.div
                variants={sectionStagger}
                initial="hidden"
                animate="show"
                className="space-y-5"
              >
                <motion.div variants={sectionSlideUp}>
                  <Input
                    label="Ingresos del día"
                    type="number"
                    step="100"
                    placeholder="0"
                    icon={<DollarSign className="h-4 w-4" />}
                    error={errors.earnings?.message}
                    className="focus-ring"
                    {...register("earnings", { valueAsNumber: true })}
                  />
                </motion.div>

                <motion.div variants={sectionSlideUp}>
                  <Input
                    label="Kilómetros recorridos"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    icon={<MapPin className="h-4 w-4" />}
                    className="focus-ring"
                    error={errors.kilometers?.message}
                    {...register("kilometers", { valueAsNumber: true })}
                  />
                </motion.div>

                <motion.div variants={sectionSlideUp} className="grid grid-cols-2 gap-3">
                  <Input
                    label="Litros de gasolina"
                    type="number"
                    step="0.1"
                    placeholder="0"
                    icon={<Fuel className="h-4 w-4" />}
                    className="focus-ring"
                    {...register("fuelAmount", { valueAsNumber: true })}
                  />
                  <Input
                    label="Costo del tanqueo"
                    type="number"
                    step="100"
                    placeholder="0"
                    icon={<DollarSign className="h-4 w-4" />}
                    className="focus-ring"
                    {...register("fuelCost", { valueAsNumber: true })}
                  />
                </motion.div>

                <motion.div variants={sectionSlideUp}>
                  <Input
                    label="Gastos del día"
                    type="number"
                    step="100"
                    placeholder="0"
                    icon={<ShoppingBag className="h-4 w-4" />}
                    className="focus-ring"
                    error={errors.expenses?.message}
                    {...register("expenses", { valueAsNumber: true })}
                  />
                </motion.div>

                <motion.div variants={sectionSlideUp}>
                  <Input
                    label="Horas trabajadas"
                    type="number"
                    step="0.5"
                    placeholder="Opcional"
                    icon={<Clock className="h-4 w-4" />}
                    className="focus-ring"
                    {...register("hoursWorked", { valueAsNumber: true })}
                  />
                </motion.div>

                <motion.div variants={sectionSlideUp} className="border-t border-theme-subtle pt-5">
                  <Controller
                    control={control}
                    name="appsUsed"
                    render={({ field }) => (
                      <div className="space-y-3">
                        <label className="block text-xs font-medium uppercase tracking-wider text-secondary-color">
                          Aplicaciones utilizadas
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {APPS.map((app, i) => (
                            <motion.button
                              key={app}
                              type="button"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4 + i * 0.05, type: "spring" as const, stiffness: 300, damping: 24 }}
                              whileTap={{ scale: 0.92 }}
                              whileHover={{ scale: 1.03 }}
                              onClick={() =>
                                handleAppToggle(app, field.value, field.onChange)
                              }
                              className={cn(
                                "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                                field.value.includes(app)
                                  ? "border-white/30 bg-white/10 text-primary-color"
                                  : "border-theme-subtle bg-hover text-secondary-color hover:border-theme-medium hover:text-secondary-color",
                              )}
                            >
                              {app}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                  />
                </motion.div>

                <motion.div variants={sectionSlideUp} className="space-y-3">
                  <label className="block text-xs font-medium uppercase tracking-wider text-secondary-color">
                    Notas
                  </label>
                  <textarea
                    {...register("notes")}
                    placeholder="Opcional..."
                    rows={3}
                    className={cn(
                      "flex w-full rounded-2xl border border-theme-subtle bg-card px-4 py-3 text-sm text-primary-color placeholder-surface-600 transition-all duration-300 resize-none focus-ring",
                      "focus:border-primary-500/50 focus:outline-none focus:bg-hover focus:ring-1 focus:ring-primary-500/20",
                    )}
                  />
                </motion.div>

                <motion.div variants={sectionSlideUp}>
                  <Card padding="sm" className="!bg-surface-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-secondary-color">Ganancia estimada</span>
                      <motion.span
                        key={`${watchedEarnings}-${watchedExpenses}-${watchedFuelCost}`}
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "text-lg font-bold",
                          watchedEarnings - watchedExpenses - watchedFuelCost >= 0
                            ? "text-success-400"
                            : "text-danger-400",
                        )}
                      >
                        {formatCurrency(
                          watchedEarnings - watchedExpenses - watchedFuelCost,
                        )}
                      </motion.span>
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={sectionSlideUp}>
                  <Button
                    type="submit"
                    className="w-full btn-ripple press-effect"
                    size="lg"
                    loading={saving}
                  >
                    Guardar cierre del día
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

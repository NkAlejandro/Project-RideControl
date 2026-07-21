import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  Plus,
  Fuel,
  TrendingDown,
  Droplets,
  DollarSign,
  MapPin,
  Calendar,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { fuelRecordSchema, type FuelRecordFormData } from "@/lib/schemas";
import { useFuel } from "@/hooks/use-fuel";
import { useVehicles } from "@/hooks/use-vehicles";
import { fuelRepository } from "@/database/repositories/fuel-repository";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { playCoin, playDelete } from "@/lib/sounds";
import type { FuelRecord } from "@/types";

function CountUp({
  target,
  duration = 1.2,
  formatter,
}: {
  target: number;
  duration?: number;
  formatter?: (v: number) => string;
}) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    if (target === 0) {
      setDisplay(formatter ? formatter(0) : "0.0");
      return;
    }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      setDisplay(formatter ? formatter(current) : current.toFixed(1));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, inView, formatter]);

  return <span ref={ref}>{display}</span>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
      delay: i * 0.05,
    },
  }),
  exit: { opacity: 0, x: -80, transition: { duration: 0.2 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25, delay: i * 0.08 },
  }),
};

export default function FuelPage() {
  const { activeVehicle } = useVehicles();
  const { records, loading, create, getConsumption, reload } = useFuel(
    activeVehicle?.id,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [consumption, setConsumption] = useState(0);
  const [monthlyCost, setMonthlyCost] = useState(0);
  const [deletingRecord, setDeletingRecord] = useState<FuelRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "full" | "partial">("all");

  useEffect(() => {
    const loadStats = async () => {
      if (!activeVehicle) return;
      const c = await getConsumption();
      setConsumption(c);
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const cost = await fuelRepository.getMonthlyCost(
        activeVehicle.id,
        start,
        now,
      );
      setMonthlyCost(cost);
    };
    loadStats();
  }, [activeVehicle, records, getConsumption]);

  const filteredRecords =
    activeTab === "full"
      ? records.filter((r) => r.isFull)
      : activeTab === "partial"
        ? records.filter((r) => !r.isFull)
        : records;

  if (!activeVehicle) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-primary-color">Combustible</h1>
          <p className="text-sm text-secondary-color">Historial y consumo</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
        >
          <Card className="py-16 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 12, delay: 0.1 }}
            >
              <Fuel className="mx-auto mb-3 h-12 w-12 text-muted-color" />
            </motion.div>
            <p className="text-sm text-secondary-color">
              No tienes un vehículo activo
            </p>
            <p className="mt-1 text-xs text-secondary-color">
              Selecciona o crea un vehículo para comenzar
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-primary-color">Combustible</h1>
          <p className="text-sm text-secondary-color">Historial y consumo</p>
        </div>
        <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
          <Button size="sm" className="btn-ripple press-effect" onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4" />
            Registrar
          </Button>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={0}
          whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        >
          <Card className="card-interactive hover-lift">
            <CardHeader>
              <CardTitle>Consumo promedio</CardTitle>
              <Fuel className="h-4 w-4 text-primary-color" />
            </CardHeader>
            <CardValue>
              {consumption > 0 ? (
                <>
                  <CountUp target={consumption} /> km/l
                </>
              ) : (
                "-- km/l"
              )}
            </CardValue>
          </Card>
        </motion.div>

        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={1}
          whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 20 } }}
        >
          <Card className="card-interactive hover-lift">
            <CardHeader>
              <CardTitle>Gasto mensual</CardTitle>
              <TrendingDown className="h-4 w-4 text-danger-500" />
            </CardHeader>
            <CardValue>
              <CountUp target={monthlyCost} duration={1.5} formatter={formatCurrency} />
            </CardValue>
          </Card>
        </motion.div>
      </div>

      {records.length === 0 && !loading ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
        >
          <Card className="py-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" as const, stiffness: 500, damping: 12, delay: 0.15 }}
            >
              <Droplets className="mx-auto mb-3 h-10 w-10 text-muted-color" />
            </motion.div>
            <p className="text-sm text-secondary-color">
              Registra tu primer tanqueo
            </p>
            <p className="mt-1 text-xs text-secondary-color">
              para ver estadísticas de consumo
            </p>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-secondary-color">
            Historial ({records.length})
          </h2>
          <div className="flex gap-2">
            {(["all", "full", "partial"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeTab === tab
                    ? "text-primary-color"
                    : "text-secondary-color hover:text-primary-color",
                )}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="fuel-tab-indicator"
                    className="absolute inset-0 rounded-full bg-white/10"
                    transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {tab === "all" ? "Todos" : tab === "full" ? "Llenos" : "Parciales"}
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {filteredRecords.map((record, idx) => (
                <motion.div
                  key={record.id}
                  layout
                  custom={idx}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                >
                  <Card className="card-interactive hover-lift">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="icon-bounce flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                          <Fuel className="h-5 w-5 text-primary-color" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary-color">
                            {formatCurrency(record.cost)}
                          </p>
                          <p className="text-xs text-secondary-color">
                            {record.amount.toFixed(1)}L ·{" "}
                            {formatCurrency(record.pricePerLiter)}/L
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.isFull && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="rounded-full bg-success-500/10 px-2 py-0.5 text-xs text-success-400"
                          >
                            Lleno
                          </motion.span>
                        )}
                        <button
                          onClick={() => setDeletingRecord(record)}
                          className="icon-bounce rounded-lg p-1.5 text-secondary-color transition-colors hover:bg-danger-500/10 hover:text-danger-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-theme-subtle pt-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-secondary-color" />
                        <span className="text-xs text-secondary-color">
                          {formatNumber(record.kilometers)} km
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-secondary-color" />
                        <span className="text-xs text-secondary-color">
                          {format(new Date(record.date), "d MMM, yyyy", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      <FuelFormSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        vehicleId={activeVehicle.id}
        onSave={async (data) => {
          await create({
            vehicleId: activeVehicle.id,
            date: data.date,
            amount: data.amount,
            cost: data.cost,
            pricePerLiter: data.pricePerLiter,
            kilometers: data.kilometers,
            isFull: data.isFull,
          });
          await reload();
          setSheetOpen(false);
          try { playCoin(); } catch {}
          toast.success("Tanqueo registrado");
        }}
      />

      <AnimatePresence>
        {deletingRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Modal
              isOpen={!!deletingRecord}
              onClose={() => setDeletingRecord(null)}
              title="Eliminar registro"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
              >
                <p className="text-sm text-secondary-color">
                  ¿Eliminar el registro de{" "}
                  <span className="font-medium text-primary-color">
                    {deletingRecord ? formatCurrency(deletingRecord.cost) : ""}
                  </span>
                  ?
                </p>
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setDeletingRecord(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={async () => {
                      if (deletingRecord) {
                        await fuelRepository.delete(deletingRecord.id);
                        await reload();
                        try { playDelete(); } catch {}
                        toast.success("Registro eliminado");
                      }
                      setDeletingRecord(null);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </motion.div>
            </Modal>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FuelFormSheet({
  isOpen,
  onClose,
  vehicleId,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  onSave: (data: FuelRecordFormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    reset,
  } = useForm<FuelRecordFormData>({
    resolver: zodResolver(fuelRecordSchema) as never,
    defaultValues: {
      vehicleId,
      date: new Date(),
      amount: 0,
      cost: 0,
      pricePerLiter: 0,
      kilometers: 0,
      isFull: true,
    },
  });

  const watchedAmount = watch("amount") || 0;
  const watchedCost = watch("cost") || 0;

  useEffect(() => {
    if (watchedAmount > 0 && watchedCost > 0) {
      const autoPrice = watchedCost / watchedAmount;
      const rounded = Math.round(autoPrice * 100) / 100;
      if (Math.abs(rounded - (watch("pricePerLiter") || 0)) > 0.01) {
        reset((prev) => ({ ...prev, pricePerLiter: rounded }), {
          keepDirty: true,
          keepDefaultValues: true,
        });
      }
    }
  }, [watchedAmount, watchedCost, reset, watch]);

  const handleFormSubmit = async (data: FuelRecordFormData) => {
    await onSave(data);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar tanqueo"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-2">
        <Input
          label="Fecha"
          type="date"
          error={errors.date?.message}
          {...register("date", { valueAsDate: true })}
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Litros"
            type="number"
            step="0.1"
            placeholder="0"
            icon={<Droplets className="h-4 w-4" />}
            error={errors.amount?.message}
            {...register("amount", { valueAsNumber: true })}
          />
          <Input
            label="Costo total"
            type="number"
            step="100"
            placeholder="0"
            icon={<DollarSign className="h-4 w-4" />}
            error={errors.cost?.message}
            {...register("cost", { valueAsNumber: true })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Precio/litro"
            type="number"
            step="10"
            placeholder="Auto"
            icon={<DollarSign className="h-4 w-4" />}
            error={errors.pricePerLiter?.message}
            {...register("pricePerLiter", { valueAsNumber: true })}
          />
          <Input
            label="Km desde último"
            type="number"
            step="0.1"
            placeholder="0"
            icon={<MapPin className="h-4 w-4" />}
            error={errors.kilometers?.message}
            {...register("kilometers", { valueAsNumber: true })}
          />
        </div>

        <Controller
          control={control}
          name="isFull"
          render={({ field }) => {
            const val = watch("isFull");
            return (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-secondary-color">
                  ¿Tanque lleno?
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition-all duration-200",
                      val
                        ? "border-success-500/30 bg-success-500/10 text-success-400"
                        : "border-theme-subtle bg-hover text-secondary-color",
                    )}
                  >
                    <Check className="h-4 w-4" />
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition-all duration-200",
                      !val
                        ? "border-warning-500/30 bg-warning-500/10 text-warning-400"
                        : "border-theme-subtle bg-hover text-secondary-color",
                    )}
                  >
                    <X className="h-4 w-4" />
                    No
                  </button>
                </div>
              </div>
            );
          }}
        />

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            Registrar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Calendar,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { maintenanceSchema, type MaintenanceFormData } from "@/lib/schemas";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useVehicles } from "@/hooks/use-vehicles";
import { cn, formatCurrency } from "@/lib/utils";
import type { MaintenanceType } from "@/types";

const MAINTENANCE_TYPES: Record<
  MaintenanceType,
  { icon: string; name: string; defaultKm: number; defaultDays: number }
> = {
  oil: { icon: "🛢️", name: "Aceite", defaultKm: 3000, defaultDays: 90 },
  filter: { icon: "🔧", name: "Filtro", defaultKm: 6000, defaultDays: 180 },
  chain: { icon: "⛓️", name: "Cadena", defaultKm: 10000, defaultDays: 365 },
  tires: { icon: "🛞", name: "Llantas", defaultKm: 15000, defaultDays: 365 },
  brakes: {
    icon: "🛑",
    name: "Pastillas",
    defaultKm: 20000,
    defaultDays: 365,
  },
  kit: {
    icon: "⚙️",
    name: "Kit de arrastre",
    defaultKm: 25000,
    defaultDays: 730,
  },
  suspension: {
    icon: "🔩",
    name: "Suspensión",
    defaultKm: 30000,
    defaultDays: 730,
  },
  battery: {
    icon: "🔋",
    name: "Batería",
    defaultKm: 50000,
    defaultDays: 730,
  },
  soat: { icon: "📋", name: "SOAT", defaultKm: 0, defaultDays: 365 },
  techmechanical: {
    icon: "🔍",
    name: "Tecnomecánica",
    defaultKm: 0,
    defaultDays: 365,
  },
  insurance: {
    icon: "🛡️",
    name: "Seguro",
    defaultKm: 0,
    defaultDays: 365,
  },
  other: { icon: "🔩", name: "Otro", defaultKm: 5000, defaultDays: 180 },
};

function getStatus(kmRemaining: number, daysRemaining: number) {
  if (kmRemaining <= 0 || daysRemaining <= 0) return "red";
  if (kmRemaining <= 500 || daysRemaining <= 7) return "yellow";
  return "green";
}

function statusBg(status: string) {
  if (status === "red") return "bg-danger-500/10";
  if (status === "yellow") return "bg-warning-500/10";
  return "bg-hover";
}

function statusDot(status: string) {
  if (status === "red") return "bg-danger-500";
  if (status === "yellow") return "bg-warning-500";
  return "bg-success-500";
}

function statusTextColor(status: string) {
  if (status === "red") return "text-danger-400";
  if (status === "yellow") return "text-warning-400";
  return "text-secondary-color";
}

function statusLabel(status: string) {
  if (status === "red") return "Vencido";
  if (status === "yellow") return "Atención";
  return "OK";
}

interface ComputedItem {
  id: string;
  type: MaintenanceType;
  name: string;
  lastKm: number;
  lastDate: Date;
  intervalKm: number;
  intervalDays: number;
  cost?: number;
  notes?: string;
  kmRemaining: number;
  daysRemaining: number;
  status: string;
  info: { icon: string; name: string; defaultKm: number; defaultDays: number };
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
      delay: i * 0.04,
    },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 350, damping: 25, delay: i * 0.05 },
  }),
};

export default function MaintenancePage() {
  const { activeVehicle } = useVehicles();
  const vehicleId = activeVehicle?.id ?? "";
  const { items, loading, create, update, remove } = useMaintenance(
    vehicleId || undefined,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicleId,
      type: "oil",
      name: "Aceite",
      lastKm: 0,
      lastDate: new Date(),
      intervalKm: 3000,
      intervalDays: 90,
      cost: undefined,
      notes: "",
    },
  });

  const [now] = useState(() => Date.now());

  const computedItems = useMemo<ComputedItem[]>(() => {
    if (!activeVehicle) return [];
    const currentKm = activeVehicle.mileage;
    return items.map((item) => {
      const kmRemaining = Math.max(
        0,
        item.lastKm + item.intervalKm - currentKm,
      );
      const daysRemaining = Math.max(
        0,
        Math.ceil(
          (new Date(item.lastDate).getTime() +
            item.intervalDays * 86400000 -
            now) /
            86400000,
        ),
      );
      const status = getStatus(kmRemaining, daysRemaining);
      const info = MAINTENANCE_TYPES[item.type] || MAINTENANCE_TYPES.other;
      return { ...item, kmRemaining, daysRemaining, status, info };
    });
  }, [items, activeVehicle, now]);

  const attentionCount = computedItems.filter(
    (i) => i.status === "yellow" || i.status === "red",
  ).length;

  const handleOpenModal = (type?: MaintenanceType) => {
    const t = type || "oil";
    const info = MAINTENANCE_TYPES[t];
    reset({
      vehicleId,
      type: t,
      name: info.name,
      lastKm: activeVehicle?.mileage ?? 0,
      lastDate: new Date(),
      intervalKm: info.defaultKm,
      intervalDays: info.defaultDays,
      cost: undefined,
      notes: "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    setSaving(true);
    try {
      await create({
        vehicleId: data.vehicleId,
        type: data.type,
        name: data.name,
        lastKm: data.lastKm,
        lastDate: data.lastDate,
        intervalKm: data.intervalKm,
        intervalDays: data.intervalDays,
        cost: data.cost,
        notes: data.notes,
      });
      toast.success("Mantenimiento registrado");
      setModalOpen(false);
      reset();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDone = async (item: ComputedItem) => {
    try {
      await update(item.id, {
        lastKm: activeVehicle?.mileage ?? 0,
        lastDate: new Date(),
      });
      toast.success(`${item.info.name} marcado como realizado`);
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async (item: ComputedItem) => {
    try {
      await remove(item.id);
      toast.success(`${item.info.name} eliminado`);
    } catch {
      toast.error("Error al eliminar");
    }
  };

  if (!activeVehicle) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-primary-color">Mantenimientos</h1>
          <p className="text-sm text-secondary-color">Salud de tu vehículo</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
        >
          <Card className="border-warning-500/20 bg-warning-500/10">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" as const, stiffness: 500, damping: 12, delay: 0.1 }}
              >
                <AlertTriangle className="h-5 w-5 text-warning-400" />
              </motion.div>
              <div>
                <p className="text-sm font-medium text-primary-color">
                  Sin vehículos registrados
                </p>
                <p className="text-xs text-secondary-color">
                  Registra un vehículo para empezar a controlar mantenimientos
                </p>
              </div>
            </div>
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
          <h1 className="text-2xl font-bold text-primary-color">Mantenimientos</h1>
          <p className="text-sm text-secondary-color">
            {activeVehicle.brand} {activeVehicle.model} —{" "}
            {formatNumber(activeVehicle.mileage)} km
          </p>
        </div>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button size="sm" className="btn-ripple press-effect" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" />
            Registrar
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-secondary-color">
                Resumen
              </p>
              <p className="mt-1 text-2xl font-semibold text-primary-color">
                {computedItems.length} registros
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-secondary-color">
                  OK
                </p>
                <p className="text-sm font-medium text-success-400">
                  {computedItems.filter((i) => i.status === "green").length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-secondary-color">
                  Atención
                </p>
                <p className="text-sm font-medium text-warning-400">
                  {computedItems.filter((i) => i.status === "yellow").length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-secondary-color">
                  Vencido
                </p>
                <p className="text-sm font-medium text-danger-400">
                  {computedItems.filter((i) => i.status === "red").length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {attentionCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card
            className={cn(
              computedItems.some((i) => i.status === "red")
                ? "border-danger-500/20 bg-danger-500/10"
                : "border-warning-500/20 bg-warning-500/10",
            )}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <AlertTriangle
                  className={cn(
                    "h-5 w-5",
                    computedItems.some((i) => i.status === "red")
                      ? "text-danger-400"
                      : "text-warning-400",
                  )}
                />
              </motion.div>
              <div>
                <p className="text-sm font-medium text-primary-color">
                  {attentionCount} {attentionCount === 1 ? "ítem necesita" : "ítens necesitan"} atención
                </p>
                <p className="text-xs text-secondary-color">
                  Revisa los mantenimientos próximos a vencer
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="h-32 animate-pulse rounded-3xl bg-hover" />
            </motion.div>
          ))}
        </div>
      ) : computedItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {computedItems.map((item, idx) => (
              <motion.div
                key={item.id}
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Card
                  padding="sm"
                  className={cn(
                    "card-interactive hover-lift relative overflow-hidden",
                    statusBg(item.status),
                    item.status === "red" && "shadow-[0_0_12px_rgba(239,68,68,0.15)]",
                  )}
                >
                  {item.status === "red" && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-3xl border border-danger-500/20"
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    />
                  )}
                  <div className="mb-2 flex items-center justify-between">
                    <motion.span
                      className="icon-bounce text-2xl"
                      whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
                    >
                      {item.info.icon}
                    </motion.span>
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        className={cn("h-1.5 w-1.5 rounded-full", statusDot(item.status))}
                        animate={
                          item.status === "red" || item.status === "yellow"
                            ? { scale: [1, 1.5, 1], opacity: [1, 0.7, 1] }
                            : {}
                        }
                        transition={{
                          repeat: Infinity,
                          duration: item.status === "red" ? 1.5 : 2,
                          ease: "easeInOut",
                        }}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-medium uppercase tracking-wider",
                          statusTextColor(item.status),
                        )}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-primary-color">
                    {item.name}
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-secondary-color">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(item.lastDate), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-secondary-color">
                      <Gauge className="h-3 w-3" />
                      <span>
                        {item.kmRemaining.toLocaleString("es-CO")} km
                        restantes
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-secondary-color">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {item.daysRemaining} días restantes
                      </span>
                    </div>
                  </div>
                  {item.cost ? (
                    <p className="mt-1 text-[10px] text-secondary-color">
                      {formatCurrency(item.cost)}
                    </p>
                  ) : null}
                  <div className="mt-2 flex gap-1">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleMarkDone(item)}
                      className="flex-1 rounded-xl bg-success-500/10 px-2 py-1.5 text-[10px] font-medium text-success-400 transition-colors hover:bg-success-500/20"
                    >
                      <CheckCircle2 className="mx-auto h-3.5 w-3.5" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(item)}
                      className="rounded-xl bg-danger-500/10 px-2 py-1.5 text-[10px] font-medium text-danger-400 transition-colors hover:bg-danger-500/20"
                    >
                      ✕
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
        >
          <Card className="py-12 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 12, delay: 0.1 }}
            >
              <Wrench className="mx-auto mb-3 h-12 w-12 text-muted-color" />
            </motion.div>
            <p className="text-sm text-secondary-color">
              No hay mantenimientos registrados
            </p>
            <p className="mb-4 text-xs text-secondary-color">
              Registra el primer mantenimiento de tu vehículo
            </p>
            <Button size="sm" onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4" />
              Registrar mantenimiento
            </Button>
          </Card>
        </motion.div>
      )}

      <div className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-secondary-color">
          Tipos de mantenimiento
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(
            Object.entries(MAINTENANCE_TYPES) as [
              MaintenanceType,
              (typeof MAINTENANCE_TYPES)[MaintenanceType],
            ][]
          ).map(([type, info], idx) => {
            const existing = computedItems.find((i) => i.type === type);
            return (
              <motion.button
                key={type}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.025 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOpenModal(type)}
                className={cn(
                  "icon-bounce flex flex-col items-center rounded-3xl border border-theme-subtle bg-card p-4 transition-all duration-200",
                  existing
                    ? statusBg(existing.status)
                    : "hover:border-theme-medium hover:bg-hover",
                )}
              >
                <span className="mb-2 text-2xl">{info.icon}</span>
                <p className="text-xs font-medium text-primary-color">
                  {info.name}
                </p>
                <p className="text-[10px] text-secondary-color">
                  {info.defaultKm > 0
                    ? `Cada ${info.defaultKm.toLocaleString("es-CO")} km`
                    : `Cada ${info.defaultDays} días`}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Registrar mantenimiento"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <input type="hidden" {...register("vehicleId")} />

                  <motion.div
                    className="space-y-2"
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                  >
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-secondary-color">
                      Tipo de mantenimiento
                    </label>
                    <select
                      {...register("type", {
                        onChange: (e) => {
                          const t = e.target.value as MaintenanceType;
                          const info = MAINTENANCE_TYPES[t];
                          if (info) {
                            document.querySelector<HTMLInputElement>(
                              'input[name="name"]',
                            )!.value = info.name;
                            document.querySelector<HTMLInputElement>(
                              'input[name="intervalKm"]',
                            )!.value = String(info.defaultKm);
                            document.querySelector<HTMLInputElement>(
                              'input[name="intervalDays"]',
                            )!.value = String(info.defaultDays);
                          }
                        },
                      })}
                      className="flex h-12 w-full rounded-2xl border border-theme-subtle bg-card px-4 text-sm text-primary-color transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                    >
                      {(
                        Object.entries(MAINTENANCE_TYPES) as [
                          MaintenanceType,
                          (typeof MAINTENANCE_TYPES)[MaintenanceType],
                        ][]
                      ).map(([type, info]) => (
                        <option key={type} value={type}>
                          {info.icon} {info.name}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                  >
                    <Input
                      label="Nombre"
                      placeholder="Nombre del mantenimiento"
                      error={errors.name?.message}
                      {...register("name")}
                    />
                  </motion.div>

                  <motion.div
                    className="grid grid-cols-2 gap-3"
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                  >
                    <Input
                      label="Último kilometraje"
                      type="number"
                      step="1"
                      placeholder="0"
                      icon={<Gauge className="h-4 w-4" />}
                      error={errors.lastKm?.message}
                      {...register("lastKm", { valueAsNumber: true })}
                    />
                    <Input
                      label="Última fecha"
                      type="date"
                      error={errors.lastDate?.message}
                      {...register("lastDate", { valueAsNumber: true })}
                    />
                  </motion.div>

                  <motion.div
                    className="grid grid-cols-2 gap-3"
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                  >
                    <Input
                      label="Intervalo km"
                      type="number"
                      step="100"
                      placeholder="3000"
                      error={errors.intervalKm?.message}
                      {...register("intervalKm", { valueAsNumber: true })}
                    />
                    <Input
                      label="Intervalo días"
                      type="number"
                      step="1"
                      placeholder="90"
                      error={errors.intervalDays?.message}
                      {...register("intervalDays", { valueAsNumber: true })}
                    />
                  </motion.div>

                  <motion.div
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={4}
                  >
                    <Input
                      label="Costo (opcional)"
                      type="number"
                      step="100"
                      placeholder="0"
                      error={errors.cost?.message}
                      {...register("cost", { valueAsNumber: true })}
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={5}
                  >
                    <label className="block text-[10px] font-medium uppercase tracking-wider text-secondary-color">
                      Notas (opcional)
                    </label>
                    <textarea
                      {...register("notes")}
                      placeholder="Detalles adicionales..."
                      rows={2}
                      className="flex w-full resize-none rounded-2xl border border-theme-subtle bg-card px-4 py-3 text-sm text-primary-color placeholder-surface-600 transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
                    />
                  </motion.div>

                  <motion.div
                    className="flex gap-3"
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={6}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" className="flex-1" loading={saving}>
                      Guardar
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            </Modal>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value);
}

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  Plus, Bike, Car, Truck, Trash2, Pencil, Gauge, Calendar, Fuel, Sparkles, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { vehicleSchema, type VehicleFormData } from "@/lib/schemas";
import { useVehicles } from "@/hooks/use-vehicles";
import { cn, formatNumber } from "@/lib/utils";
import { playSuccess, playDelete } from "@/lib/sounds";
import type { Vehicle } from "@/types";

const VEHICLE_TYPES = [
  { value: "motorcycle" as const, label: "Motocicleta", icon: Bike },
  { value: "car" as const, label: "Automóvil", icon: Car },
  { value: "truck" as const, label: "Camión", icon: Truck },
];

const AMBIENT_PARTICLES = Array.from({ length: 10 }, () => ({
  id: crypto.randomUUID(),
  size: 60 + Math.random() * 140,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: 8 + Math.random() * 12,
  delay: Math.random() * 6,
}));

const CELEBRATION_MESSAGES = [
  "¡Listo para rodar! 🏍️",
  "Nuevo miembro en la flota 🚀",
  "Vehículo registrado con éxito ✨",
  "¡A rodar se dijo! 🏁",
  "Flota actualizada 🔥",
];

function AmbientParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <div className="ambient-grid absolute inset-0" />
      {AMBIENT_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            background: `radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)`,
            filter: "blur(40px)",
          }}
          animate={{
            y: [0, -30, 10, -15, 0],
            x: [0, 15, -10, 20, 0],
            scale: [1, 1.08, 0.95, 1.04, 1],
          }}
          transition={{
            duration: p.duration, repeat: Infinity,
            ease: "easeInOut", delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const displayValue = useMemo(() => formatNumber(Math.round(value)) + suffix, [value, suffix]);

  useEffect(() => {
    mv.set(0);
    const controls = animate(mv, value, {
      type: "spring", stiffness: 50, damping: 18, restDelta: 0.5,
    });
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = formatNumber(Math.round(v)) + suffix;
    });
    return () => { controls.stop(); unsub(); };
  }, [value, mv, suffix]);

  return <span ref={ref}>{displayValue}</span>;
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const smoothX = useSpring(rawX, { stiffness: 200, damping: 18 });
  const smoothY = useSpring(rawY, { stiffness: 200, damping: 18 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const el = e.currentTarget;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    (el as HTMLElement).style.setProperty("--shine-x", `${px}%`);
    (el as HTMLElement).style.setProperty("--shine-y", `${py}%`);
    rawX.set(((e.clientY - rect.top) / rect.height - 0.5) * -6);
    rawY.set(((e.clientX - rect.left) / rect.width - 0.5) * 6);
  }, [rawX, rawY]);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    rawX.set(0); rawY.set(0);
    (e.currentTarget as HTMLElement).style.setProperty("--shine-x", "50%");
    (e.currentTarget as HTMLElement).style.setProperty("--shine-y", "0%");
  }, [rawX, rawY]);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 800 } as React.CSSProperties}
      className={className}
    >
      <motion.div
        style={{ rotateX: smoothX, rotateY: smoothY } as React.CSSProperties}
      >
        {children}
      </motion.div>
    </div>
  );
}

function CelebrationToast({ show, message }: { show: boolean; message: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
          initial={{ opacity: 0, y: -20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 280, damping: 24 }}
        >
          <motion.div
            className="glass-liquid-strong rounded-full px-5 py-2.5 flex items-center gap-2.5"
            animate={{ boxShadow: [
              "0 0 20px rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.2)",
              "0 0 40px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.2)",
              "0 0 20px rgba(255,255,255,0.05), 0 4px 12px rgba(0,0,0,0.2)",
            ] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Sparkles className="h-4 w-4 text-white/80" />
            </motion.div>
            <span className="text-sm font-medium text-white/90">{message}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VehicleCard({
  vehicle, isActive, onSetActive, onEdit, onDelete, index,
}: {
  vehicle: Vehicle; isActive: boolean; onSetActive: () => void; onEdit: () => void; onDelete: () => void; index: number;
}) {
  const typeInfo = VEHICLE_TYPES.find((t) => t.value === vehicle.type);
  const TypeIcon = typeInfo?.icon ?? Bike;
  const [shaking, setShaking] = useState(false);
  const [justCreated] = useState(() => {
    const created = new Date(vehicle.createdAt).getTime();
    return Date.now() - created < 10000;
  });

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    onDelete();
  }, [onDelete]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{
        opacity: 1, y: 0, scale: 1,
        boxShadow: justCreated ? [
          "0 0 0px rgba(255,255,255,0)",
          "0 0 24px rgba(255,255,255,0.05)",
          "0 0 0px rgba(255,255,255,0)",
        ] : undefined,
      }}
      exit={{ opacity: 0, scale: 0.85, y: -20 }}
      transition={{
        type: "spring", stiffness: 240, damping: 24, mass: 0.8,
        delay: index * 0.05,
      }}
    >
      <TiltCard>
        <motion.div
          onClick={onSetActive}
          whileHover={{ scale: 1.004 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 card-shimmer",
            isActive
              ? "glass-liquid-strong border-white/[0.18] animate-border-glow"
              : "glass-liquid border-white/[0.06] hover:border-white/[0.1]",
          )}
          style={{
            transformStyle: "preserve-3d" as const,
            boxShadow: isActive
              ? "0 0 40px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.25)"
              : "0 4px 24px rgba(0,0,0,0.12)",
          }}
        >
          {isActive && (
            <>
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-2 h-[calc(100%-16px)] w-[2px] rounded-full z-[3]"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2))",
                  boxShadow: "0 0 8px rgba(255,255,255,0.15)",
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              />
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-2xl z-[1]"
                animate={{
                  boxShadow: [
                    "inset 0 0 20px rgba(255,255,255,0.015)",
                    "inset 0 0 40px rgba(255,255,255,0.03)",
                    "inset 0 0 20px rgba(255,255,255,0.015)",
                  ],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}

          <div className="relative z-[3] p-4" style={{ transformStyle: "preserve-3d" as const }}>
            <motion.div
              className="flex items-start justify-between"
              style={{ transform: "translateZ(24px)" } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl backdrop-blur-[8px] transition-colors duration-300",
                    isActive ? "bg-white/[0.1]" : "bg-white/[0.04]",
                  )}
                  whileHover={{ rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.5 } }}
                >
                  <motion.div
                    animate={isActive ? { scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] } : {}}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <TypeIcon
                      className={cn(
                        "h-5 w-5 transition-colors duration-300",
                        isActive ? "text-white" : "text-white/50",
                      )}
                    />
                  </motion.div>
                </motion.div>
                <div>
                  <h3
                    className={cn(
                      "text-sm font-semibold transition-colors duration-300",
                      isActive ? "text-white" : "text-white/80",
                    )}
                  >
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    {vehicle.year}
                    {vehicle.plate && <>{` · ${vehicle.plate.toUpperCase()}`}</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isActive ? (
                  <motion.div
                    className=                    "flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-1 backdrop-blur-[6px]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  >
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full bg-white"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ boxShadow: "0 0 8px rgba(255,255,255,0.5)" }}
                    />
                    <span className="text-[9px] font-medium text-white/60 uppercase tracking-wider">Activo</span>
                  </motion.div>
                ) : (
                  <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/35 backdrop-blur-[8px]">
                    Inactivo
                  </span>
                )}
              </div>
            </motion.div>

            <motion.div
              className="h-[1px] my-3"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                transform: "translateZ(12px)",
              } as React.CSSProperties}
            />

            <motion.div
              className="grid grid-cols-3 gap-2"
              style={{ transform: "translateZ(16px)" } as React.CSSProperties}
            >
              <div className="stat-card rounded-xl p-2.5 text-center">
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                >
                  <Gauge className="mx-auto mb-1 h-3.5 w-3.5 text-white/40" />
                </motion.div>
                <p className="text-[11px] font-medium text-white/70">
                  <AnimatedCounter value={vehicle.mileage} suffix=" km" />
                </p>
              </div>
              <div className="stat-card rounded-xl p-2.5 text-center">
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                >
                  <Fuel className="mx-auto mb-1 h-3.5 w-3.5 text-white/40" />
                </motion.div>
                <p className="text-[11px] font-medium text-white/70">
                  <AnimatedCounter value={vehicle.fuelCapacity} suffix="L" />
                </p>
              </div>
              <div className="stat-card rounded-xl p-2.5 text-center">
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                >
                  <Calendar className="mx-auto mb-1 h-3.5 w-3.5 text-white/40" />
                </motion.div>
                <p className="text-[11px] font-medium text-white/70">
                  {vehicle.createdAt
                    ? format(new Date(vehicle.createdAt), "MMM yyyy", { locale: es })
                    : "—"}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="h-[1px] mt-3"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                transform: "translateZ(12px)",
              } as React.CSSProperties}
            />

            <motion.div
              className="mt-3 flex items-center justify-between"
              style={{ transform: "translateZ(28px)" } as React.CSSProperties}
            >
              <motion.span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-[8px] transition-colors duration-200",
                  isActive
                    ? "bg-white/[0.12] text-white/80"
                    : "bg-white/[0.04] text-white/40",
                )}
                animate={isActive ? { scale: [1, 1.03, 1], opacity: [0.85, 1, 0.85] } : {}}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {isActive ? "● Activo" : "Inactivo"}
              </motion.span>
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.15, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:text-white/70"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.15, backgroundColor: "rgba(248,113,113,0.12)" }}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  onClick={handleDelete}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-red-400/60 transition-colors hover:text-red-400",
                    shaking && "animate-shake",
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </TiltCard>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-liquid rounded-2xl p-4 animate-skeleton-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/[0.06]" />
          <div>
            <div className="h-4 w-28 rounded-md bg-white/[0.06]" />
            <div className="mt-1.5 h-3 w-20 rounded-md bg-white/[0.04]" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-white/[0.05]" />
      </div>
      <div className="mt-3 h-[1px] bg-white/[0.04]" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-white/[0.04] p-2.5">
            <div className="mx-auto mb-1 h-3.5 w-3.5 rounded-full bg-white/[0.04]" />
            <div className="mx-auto h-3 w-14 rounded-md bg-white/[0.04]" />
          </div>
        ))}
      </div>
      <div className="mt-3 h-[1px] bg-white/[0.04]" />
      <div className="mt-3 flex items-center justify-between">
        <div className="h-4 w-14 rounded-full bg-white/[0.05]" />
        <div className="flex gap-1">
          <div className="h-8 w-8 rounded-lg bg-white/[0.04]" />
          <div className="h-8 w-8 rounded-lg bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

function typeIndicatorVariants(i: number) {
  return {
    hidden: { opacity: 0, y: 12, scale: 0.9 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring" as const, stiffness: 350, damping: 20, delay: i * 0.05 },
    },
  };
}

function VehicleFormSheet({
  isOpen, onClose, editingVehicle, onSave,
}: {
  isOpen: boolean; onClose: () => void; editingVehicle: Vehicle | null;
  onSave: (data: VehicleFormData) => Promise<{ id?: string } | void>;
}) {
  const {
    register, handleSubmit, formState: { errors, isSubmitting }, reset, watch,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as never,
    values: editingVehicle
      ? {
          type: editingVehicle.type, brand: editingVehicle.brand,
          model: editingVehicle.model, year: editingVehicle.year,
          plate: editingVehicle.plate ?? "", color: editingVehicle.color ?? "",
          mileage: editingVehicle.mileage, fuelCapacity: editingVehicle.fuelCapacity,
          isActive: editingVehicle.isActive,
        }
      : undefined,
    defaultValues: {
      type: "motorcycle", brand: "", model: "",
      year: new Date().getFullYear(), plate: "", color: "",
      mileage: 0, fuelCapacity: 10, isActive: true,
    },
  });

  const watchedType = watch("type");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState("");
  const celebTimeout = useRef<number | null>(null);

  const handleFormSubmit = async (data: VehicleFormData) => {
    const result = await onSave(data) as { id?: string } | void;
    if (result?.id && !editingVehicle) {
      const msg = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCelebrationMsg(msg);
      setShowCelebration(true);
      if (celebTimeout.current !== null) clearTimeout(celebTimeout.current);
      celebTimeout.current = setTimeout(() => setShowCelebration(false), 3000);
    }
    reset(undefined as unknown as VehicleFormData);
  };

  useEffect(() => {
    return () => { if (celebTimeout.current !== null) clearTimeout(celebTimeout.current); };
  }, []);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={editingVehicle ? "Editar vehículo" : "Nuevo vehículo"}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-1.5">
              <motion.div
                className="flex gap-1.5"
                variants={{ hidden: {}, visible: {} }}
                initial="hidden"
                animate="visible"
              >
                {VEHICLE_TYPES.map(({ value, label, icon: Icon }, idx) => {
                  const isSelected = watchedType === value;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      variants={typeIndicatorVariants(idx)}
                      whileHover={{ scale: 1.03, transition: { type: "spring" as const, stiffness: 280, damping: 20 } }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => reset({ ...watch(), type: value })}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-1 rounded-xl border px-1.5 py-2 transition-all duration-200",
                        isSelected
                          ? "glass-crystal-btn-active border-white/[0.25]"
                          : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]",
                      )}
                    >
                      <motion.div
                        animate={isSelected ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.4 }}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors duration-200",
                            isSelected ? "text-white" : "text-white/40",
                          )}
                        />
                      </motion.div>
                      <span
                        className={cn(
                          "text-[10px] font-medium transition-colors duration-200",
                          isSelected ? "text-white/80" : "text-white/40",
                        )}
                      >
                        {label}
                      </span>
                      {isSelected && (
                        <motion.div
                          className="mt-0.5 h-[2px] w-6 rounded-full bg-white/60"
                          layoutId="typeIndicator"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>

              <motion.div
                className="grid grid-cols-2 gap-1.5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.1 }}
              >
                <Input label="Marca" placeholder="Yamaha" error={errors.brand?.message} {...register("brand")} />
                <Input label="Modelo" placeholder="NMax" error={errors.model?.message} {...register("model")} />
              </motion.div>

              <motion.div
                className="grid grid-cols-2 gap-1.5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.15 }}
              >
                <Input label="Año" type="number" error={errors.year?.message} {...register("year", { valueAsNumber: true })} />
                <Input label="Placa" placeholder="ABC 123" error={errors.plate?.message} {...register("plate")} />
              </motion.div>

              <motion.div
                className="grid grid-cols-2 gap-1.5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.2 }}
              >
                <Input label="Color" placeholder="Negro" error={errors.color?.message} {...register("color")} />
                <Input label="Kilometraje" type="number" error={errors.mileage?.message} {...register("mileage", { valueAsNumber: true })} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.25 }}
              >
                <Input label="Capacidad tanque (L)" type="number" step="0.1" error={errors.fuelCapacity?.message} {...register("fuelCapacity", { valueAsNumber: true })} />
              </motion.div>

              <motion.div
                className="flex gap-2 pt-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.3 }}
              >
                <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button" variant="secondary" size="sm"
                    className="w-full bg-white/[0.04] text-white/50 backdrop-blur-[8px] border-white/[0.06] hover:bg-white/[0.08]"
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                </motion.div>
                <motion.div className="flex-1" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit" size="sm" loading={isSubmitting}
                    className="w-full bg-primary-500 text-[15px] font-semibold text-on-primary shadow-lg hover:bg-primary-600"
                  >
                    {editingVehicle ? (
                      <motion.span
                        key="edit"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        Actualizar
                      </motion.span>
                    ) : (
                      <motion.span
                        key="create"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        Crear
                      </motion.span>
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              <AnimatePresence>
                {isSubmitting && (
                  <motion.div
                    className="flex items-center justify-center gap-2 pt-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <motion.div
                      className="h-1 w-full max-w-[200px] rounded-full bg-white/[0.06] overflow-hidden"
                    >
                      <motion.div
                        className="h-full rounded-full bg-white/40"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </motion.div>
                    <span className="text-[10px] text-white/40">Guardando...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Modal>
      <CelebrationToast show={showCelebration} message={celebrationMsg} />
    </>
  );
}

function profileId(): string {
  try {
    const store = JSON.parse(localStorage.getItem("ridecontrol-storage") || "{}");
    return store?.state?.profile?.id ?? "";
  } catch {
    return "";
  }
}

export default function VehiclesPage() {
  const { vehicles, activeVehicle, create, update, remove, setActive, loading } = useVehicles();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [deleteShake, setDeleteShake] = useState(false);

  const totalMileage = useMemo(
    () => vehicles.reduce((acc, v) => acc + v.mileage, 0),
    [vehicles],
  );

  return (
    <div className="relative min-h-full">
      <AmbientParticles />

      <motion.div
        className="relative z-[1] space-y-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.05 }}
        >
          <div>
            <motion.h1
              className="text-[22px] font-bold text-gradient-primary-animated"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.1 }}
            >
              Vehículos
            </motion.h1>
            <motion.p
              className="mt-0.5 text-[13px] text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {vehicles.length > 0
                ? `${vehicles.length} vehículo${vehicles.length !== 1 ? "s" : ""} · ${formatNumber(totalMileage)} km totales`
                : "Gestiona tu flota"}
            </motion.p>
          </div>
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 14, delay: 0.2 }}
          >
            <Button
              size="sm"
              className="bg-white/[0.08] text-white/80 backdrop-blur-[8px] hover:bg-white/[0.12] border border-white/[0.1] gap-2"
              onClick={() => { setEditingVehicle(null); setSheetOpen(true); }}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          </motion.div>
        </motion.div>

        {loading ? (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <SkeletonCard />
              </motion.div>
            ))}
          </motion.div>
        ) : vehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="glass-liquid relative overflow-hidden rounded-2xl py-16 text-center">
              <motion.div
                className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.1 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
                  }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0], y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Bike className="h-12 w-12 text-white/20" />
                </motion.div>
              </motion.div>
              <motion.p
                className="text-sm text-white/50 font-medium"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                No tienes vehículos registrados
              </motion.p>
              <motion.p
                className="mt-1 text-xs text-white/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Tu flota está vacía — agrega tu primer vehículo
              </motion.p>
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
                  <Button
                    size="sm"
                    className="bg-white/[0.08] text-white/70 backdrop-blur-[8px] hover:bg-white/[0.12] border border-white/[0.1] gap-2"
                    onClick={() => setSheetOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar vehículo
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.04, delayChildren: 0.08 },
              },
            }}
            initial="hidden"
            animate="visible"
          >
            {vehicles.length > 1 && (
              <motion.div
                className="flex items-center gap-2 text-[11px] text-white/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className="h-1 w-1 rounded-full bg-white/20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {vehicles.length} vehículos registrados
                <span className="text-white/20">·</span>
                {formatNumber(totalMileage)} km combinados
              </motion.div>
            )}
            <AnimatePresence mode="popLayout">
              {vehicles.map((v, i) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  isActive={v.id === activeVehicle?.id}
                  index={i}
                  onSetActive={() => setActive(v.id)}
                  onEdit={() => { setEditingVehicle(v); setSheetOpen(true); }}
                  onDelete={() => setDeletingVehicle(v)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <VehicleFormSheet
          isOpen={sheetOpen}
          onClose={() => { setSheetOpen(false); setEditingVehicle(null); }}
          editingVehicle={editingVehicle}
          onSave={async (data) => {
            if (editingVehicle) {
              await update(editingVehicle.id, { ...data, isActive: editingVehicle.isActive });
              toast.success("Vehículo actualizado", {
                icon: <CheckCircle2 className="h-4 w-4 text-white" />,
              });
              setSheetOpen(false);
              setEditingVehicle(null);
              return;
            }
            const created = await create({
              ...data,
              profileId: profileId(),
              isActive: vehicles.length === 0,
            });
            try { playSuccess(); } catch {}
            toast.success("Vehículo creado", {
              icon: <Sparkles className="h-4 w-4 text-white" />,
            });
            if (vehicles.length === 0) {
              await setActive(created.id);
            }
            setSheetOpen(false);
            setEditingVehicle(null);
            return { id: created.id };
          }}
        />

          <Modal isOpen={!!deletingVehicle} onClose={() => setDeletingVehicle(null)} title="Eliminar vehículo">
              <motion.div
                animate={deleteShake ? { x: [0, -4, 4, -2, 2, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <p className="text-sm text-white/60">
                  ¿Estás seguro de eliminar{" "}
                  <span className="font-medium text-white/80">
                    {deletingVehicle?.brand} {deletingVehicle?.model}
                  </span>
                  ? Esta acción no se puede deshacer.
                </p>
              </motion.div>
              <div className="mt-6 flex gap-3">
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="secondary" size="sm"
                    className="w-full bg-white/[0.05] text-white/60 backdrop-blur-[8px] border-white/[0.08]"
                    onClick={() => setDeletingVehicle(null)}
                  >
                    Cancelar
                  </Button>
                </motion.div>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="danger" size="sm"
                    className="w-full"
                    onClick={async () => {
                      setDeleteShake(true);
                      setTimeout(() => setDeleteShake(false), 400);
                      if (deletingVehicle) {
                        await remove(deletingVehicle.id);
                        try { playDelete(); } catch {}
                        toast.success("Vehículo eliminado");
                      }
                      setDeletingVehicle(null);
                    }}
                  >
                    Eliminar
                  </Button>
                </motion.div>
              </div>
            </Modal>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profileRepository } from "@/database/repositories/profile-repository";
import { vehicleRepository } from "@/database/repositories/vehicle-repository";
import { walletRepository } from "@/database/repositories/wallet-repository";
import { settingsRepository } from "@/database/repositories/settings-repository";
import { goalRepository } from "@/database/repositories/goal-repository";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";
import { pushSync } from "@/lib/firebase-sync";
import {
  User,
  Bike,
  Wallet,
  Target,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PiggyBank,
  TrendingUp,
  Smile,
  Calendar,
  Coins,
} from "lucide-react";
import type { WalletType, VehicleType } from "@/types";

const step1Schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

const step2Schema = z.object({
  type: z.enum(["motorcycle", "car", "bicycle", "truck", "other"]),
  brand: z.string().min(1, "La marca es requerida"),
  model: z.string().min(1, "El modelo es requerido"),
  year: z.number().min(1900, "Año inválido").max(2030, "Año inválido"),
  mileage: z.number().min(0, "Kilometraje inválido"),
  fuelCapacity: z.number().min(1, "Capacidad inválida"),
});

const step4Schema = z.object({
  title: z.string().min(1, "El título es requerido"),
  targetAmount: z.number().min(1, "El monto debe ser mayor a 0"),
  deadline: z.string().optional(),
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;
type Step4Form = z.infer<typeof step4Schema>;

interface WalletConfig {
  name: string;
  type: WalletType;
  percentage: number;
  color: string;
  icon: string;
}

const defaultWallets: WalletConfig[] = [
  { name: "Moto", type: "moto", percentage: 30, color: "#3b82f6", icon: "bike" },
  { name: "Ahorro", type: "ahorro", percentage: 40, color: "#22c55e", icon: "piggy-bank" },
  { name: "Inversiones", type: "inversiones", percentage: 20, color: "#f59e0b", icon: "trending-up" },
  { name: "Personales", type: "personales", percentage: 10, color: "#ef4444", icon: "smile" },
];

const steps = [
  { title: "Tu perfil", description: "Cuéntanos quién eres", icon: User },
  { title: "Tu vehículo", description: "Registra tu primer vehículo", icon: Bike },
  { title: "Tus finanzas", description: "Distribuye tus ingresos", icon: Wallet },
  { title: "Tu meta", description: "Define un objetivo (opcional)", icon: Target },
];

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: "motorcycle", label: "Moto" },
  { value: "car", label: "Carro" },
  { value: "bicycle", label: "Bicicleta" },
  { value: "truck", label: "Camión" },
  { value: "other", label: "Otro" },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const setProfile = useAppStore((s) => s.setProfile);
  const addVehicle = useAppStore((s) => s.addVehicle);
  const setSettings = useAppStore((s) => s.setSettings);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const setActiveVehicle = useAppStore((s) => s.setActiveVehicle);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const step1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: { name: "", email: "" },
  });

  const step2 = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      type: "motorcycle",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      mileage: 0,
      fuelCapacity: 0,
    },
  });

  const [wallets, setWallets] = useState<WalletConfig[]>(defaultWallets);

  const step4 = useForm<Step4Form>({
    resolver: zodResolver(step4Schema),
    defaultValues: { title: "", targetAmount: 0, deadline: "" },
  });

  const updateWalletPercentage = (index: number, value: number) => {
    setWallets((prev) => prev.map((w, i) => (i === index ? { ...w, percentage: value } : w)));
  };

  const walletSum = wallets.reduce((acc, w) => acc + w.percentage, 0);
  const walletError = walletSum !== 100;

  function goToStep(step: number) {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  }

  async function handleStep1() {
    const valid = await step1.trigger();
    if (!valid) return;
    setLoading(true);
    const data = step1.getValues();
    const profile = await profileRepository.create({
      name: data.name,
      email: data.email || undefined,
    });
    pushSync();
    setProfile(profile);
    setProfileId(profile.id);
    setLoading(false);
    goToStep(1);
  }

  async function handleStep2() {
    const valid = await step2.trigger();
    if (!valid) return;
    setLoading(true);
    const data = step2.getValues();
    const vehicle = await vehicleRepository.create({
      profileId: profileId!,
      type: data.type,
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      fuelCapacity: data.fuelCapacity,
      isActive: true,
    });
    pushSync();
    addVehicle(vehicle);
    setActiveVehicle(vehicle.id);
    setLoading(false);
    goToStep(2);
  }

  async function handleStep3() {
    if (walletError) return;
    setLoading(true);
    const walletIds: string[] = [];
    for (const w of wallets) {
      const wallet = await walletRepository.create({
        profileId: profileId!,
        name: w.name,
        type: w.type,
        percentage: w.percentage,
        balance: 0,
        color: w.color,
        icon: w.icon,
        isActive: true,
      });
      walletIds.push(wallet.id);
      pushSync();
    }
    const walletDistribution = wallets.map((w, i) => ({
      walletId: walletIds[i],
      percentage: w.percentage,
    }));
    const settings = await settingsRepository.create({
      profileId: profileId!,
      currency: "COP",
      language: "es",
      theme: "dark",
      walletDistribution,
      onboardingCompleted: false,
      dailyGoal: 100000,
    });
    pushSync();
    setSettings(settings);
    setLoading(false);
    goToStep(3);
  }

  async function handleStep4() {
    const valid = await step4.trigger();
    if (!valid) return;
    const data = step4.getValues();
    if (data.title && data.targetAmount > 0) {
      setLoading(true);
      await goalRepository.create({
        profileId: profileId!,
        title: data.title,
        targetAmount: data.targetAmount,
        currentAmount: 0,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        isCompleted: false,
      });
      pushSync();
      setLoading(false);
    }
    await finishOnboarding();
  }

  async function skipStep4() {
    await finishOnboarding();
  }

  async function finishOnboarding() {
    setLoading(true);
    if (profileId) {
      const existing = await settingsRepository.get(profileId);
      if (existing) {
        await settingsRepository.update(existing.id, { onboardingCompleted: true });
        pushSync();
      }
    }
    setOnboarded(true);
    setCompleted(true);
    setLoading(false);
    setTimeout(() => {
      navigate("/");
    }, 2000);
  }

  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="w-full max-w-sm text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 15 }}
            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary-500"
          >
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Check className="h-10 w-10 text-on-primary" strokeWidth={3} />
            </motion.div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-3 text-2xl font-bold text-primary-color"
          >
            ¡Todo listo!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-secondary-color"
          >
            Tu cuenta está configurada. Te redirigiremos al dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-surface px-4 py-6 sm:py-10">
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%)",
            "radial-gradient(ellipse at 80% 30%, rgba(99,102,241,0.12) 0%, transparent 60%)",
            "radial-gradient(ellipse at 40% 80%, rgba(99,102,241,0.12) 0%, transparent 60%)",
            "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <div className="mb-2 h-0.5 w-full overflow-hidden rounded-full bg-hover">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={false}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          />
        </div>

        <div className="mb-10 flex items-center justify-between pt-6">
          {currentStep > 0 ? (
            <button
              onClick={() => goToStep(currentStep - 1)}
              className="btn-ripple press-effect flex items-center gap-1.5 text-sm text-secondary-color transition-colors hover:text-primary-color"
            >
              <ChevronLeft className="h-4 w-4" />
              Atrás
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <motion.div
                  className={cn(
                    "flex items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-300",
                    i < currentStep
                      ? "h-1.5 w-1.5 bg-white"
                      : i === currentStep
                        ? "h-6 w-6 bg-primary-500 text-on-primary"
                        : "h-1.5 w-1.5 bg-surface-400"
                  )}
                  animate={
                    i === currentStep
                      ? { scale: [1, 1.15, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    i === currentStep
                      ? { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] }
                      : { duration: 0.3 }
                  }
                >
                  {i < currentStep ? null : i === currentStep ? (
                    <span>{i + 1}</span>
                  ) : null}
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[420px] flex-1">
          <AnimatePresence mode="wait" custom={direction}>
            {currentStep === 0 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="absolute inset-0"
              >
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="flex h-full flex-col"
                >
                  <motion.div variants={staggerItem} className="mb-6 flex items-center gap-3 rounded-2xl border border-primary-500/10 bg-primary-500/5 p-4">
                    <motion.div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10"
                      animate={{ rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Sparkles className="h-5 w-5 text-primary-400" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-primary-300">
                        Bienvenido a RideControl
                      </p>
                      <p className="text-xs text-secondary-color">
                        Controla tu dinero, tu vehículo y tu futuro
                      </p>
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem} className="mb-8">
                    <h2 className="text-xl font-bold text-primary-color">Crea tu perfil</h2>
                    <p className="mt-2 text-sm text-secondary-color">
                      Tus datos para empezar a usar la app
                    </p>
                  </motion.div>

                  <form
                    onSubmit={step1.handleSubmit(handleStep1)}
                    className="space-y-4"
                  >
                    <motion.div variants={staggerItem}>
                      <Input
                        label="Nombre"
                        placeholder="Tu nombre"
                        icon={<User className="h-4 w-4" />}
                        error={step1.formState.errors.name?.message}
                        {...step1.register("name")}
                      />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                      <Input
                        label="Email (opcional)"
                        placeholder="tu@email.com"
                        type="email"
                        icon={<Target className="h-4 w-4" />}
                        error={step1.formState.errors.email?.message}
                        {...step1.register("email")}
                      />
                    </motion.div>
                    <motion.div variants={staggerItem} className="pt-4">
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        loading={loading}
                      >
                        Continuar
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="absolute inset-0"
              >
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="flex h-full flex-col"
                >
                  <motion.div variants={staggerItem} className="mb-8">
                    <h2 className="text-xl font-bold text-primary-color">Registra tu vehículo</h2>
                    <p className="mt-2 text-sm text-secondary-color">
                      Los datos principales de tu vehículo
                    </p>
                  </motion.div>

                  <form
                    onSubmit={step2.handleSubmit(handleStep2)}
                    className="space-y-4"
                  >
                    <motion.div variants={staggerItem} className="space-y-2">
                      <label className="block text-xs font-medium uppercase tracking-wider text-secondary-color">
                        Tipo
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {vehicleTypes.map((t) => {
                          const isSelected = step2.watch("type") === t.value;
                          return (
                            <motion.button
                              key={t.value}
                              type="button"
                              onClick={() => step2.setValue("type", t.value)}
                              whileTap={{ scale: 0.92 }}
                              animate={
                                isSelected
                                  ? { scale: [1, 1.08, 1], boxShadow: "0 0 20px rgba(255,255,255,0.15)" }
                                  : { scale: 1, boxShadow: "0 0 0px rgba(255,255,255,0)" }
                              }
                              transition={{ duration: 0.3 }}
                              className={cn(
                                "rounded-2xl border px-2 py-2.5 text-xs font-medium transition-colors duration-300",
                                isSelected
                                  ? "border-primary-500 bg-primary-500 text-on-primary"
                                  : "border-theme-subtle bg-card text-secondary-color hover:border-theme-medium hover:text-primary-color"
                              )}
                            >
                              {t.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>

                    <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
                      <Input
                        label="Marca"
                        placeholder="Yamaha"
                        error={step2.formState.errors.brand?.message}
                        {...step2.register("brand")}
                      />
                      <Input
                        label="Modelo"
                        placeholder="MT-07"
                        error={step2.formState.errors.model?.message}
                        {...step2.register("model")}
                      />
                    </motion.div>

                    <motion.div variants={staggerItem} className="grid grid-cols-3 gap-4">
                      <Input
                        label="Año"
                        type="number"
                        placeholder="2024"
                        error={step2.formState.errors.year?.message}
                        {...step2.register("year", { valueAsNumber: true })}
                      />
                      <Input
                        label="Kilometraje"
                        type="number"
                        placeholder="0"
                        error={step2.formState.errors.mileage?.message}
                        {...step2.register("mileage", { valueAsNumber: true })}
                      />
                      <Input
                        label="Tanque (L)"
                        type="number"
                        placeholder="14"
                        error={step2.formState.errors.fuelCapacity?.message}
                        {...step2.register("fuelCapacity", { valueAsNumber: true })}
                      />
                    </motion.div>

                    <motion.div variants={staggerItem} className="pt-4">
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        loading={loading}
                      >
                        Continuar
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="absolute inset-0"
              >
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="flex h-full flex-col"
                >
                  <motion.div variants={staggerItem} className="mb-8">
                    <h2 className="text-xl font-bold text-primary-color">Distribuye tus ingresos</h2>
                    <p className="mt-2 text-sm text-secondary-color">
                      Define cómo se repartirá tu dinero automáticamente
                    </p>
                  </motion.div>

                  <div className="mb-6 space-y-3">
                    {wallets.map((wallet, i) => (
                      <motion.div
                        key={i}
                        variants={staggerItem}
                        className="rounded-2xl border border-theme-subtle bg-card p-4"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hover"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                          >
                            {wallet.icon === "bike" && <Bike className="h-5 w-5" style={{ color: wallet.color }} />}
                            {wallet.icon === "piggy-bank" && <PiggyBank className="h-5 w-5" style={{ color: wallet.color }} />}
                            {wallet.icon === "trending-up" && <TrendingUp className="h-5 w-5" style={{ color: wallet.color }} />}
                            {wallet.icon === "smile" && <Smile className="h-5 w-5" style={{ color: wallet.color }} />}
                          </motion.div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-primary-color">{wallet.name}</p>
                              <motion.span
                                key={wallet.percentage}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className="text-sm font-bold text-primary-color"
                              >
                                {wallet.percentage}%
                              </motion.span>
                            </div>
                            <div className="mt-2">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={wallet.percentage}
                                onChange={(e) => updateWalletPercentage(i, Number(e.target.value))}
                                className="h-1.5 w-full appearance-none rounded-full bg-hover accent-white"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div variants={staggerItem} className="mb-8">
                    <div className="flex h-2 overflow-hidden rounded-full bg-hover">
                      {wallets.map((wallet, i) => (
                        <motion.div
                          key={i}
                          style={{ backgroundColor: wallet.color }}
                          initial={false}
                          animate={{ width: `${wallet.percentage}%` }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span className="text-xs text-secondary-color">
                        Total: {walletSum}%
                      </span>
                      {walletError && (
                        <span className="text-xs text-danger-400">
                          Debe sumar 100%
                        </span>
                      )}
                      {!walletError && walletSum === 100 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-xs text-success-400"
                        >
                          Correcto
                        </motion.span>
                      )}
                    </div>
                  </motion.div>

                  <motion.div variants={staggerItem}>
                    <Button
                      onClick={handleStep3}
                      className="w-full"
                      size="lg"
                      disabled={walletError}
                      loading={loading}
                    >
                      Continuar
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                className="absolute inset-0"
              >
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="flex h-full flex-col"
                >
                  <motion.div variants={staggerItem} className="mb-8">
                    <h2 className="text-xl font-bold text-primary-color">Crea una meta</h2>
                    <p className="mt-2 text-sm text-secondary-color">
                      Opcional — Define un objetivo financiero
                    </p>
                  </motion.div>

                  <form
                    onSubmit={step4.handleSubmit(handleStep4)}
                    className="space-y-4"
                  >
                    <motion.div variants={staggerItem}>
                      <Input
                        label="Título de la meta"
                        placeholder="Ej: Viaje a la costa"
                        icon={<Target className="h-4 w-4" />}
                        error={step4.formState.errors.title?.message}
                        {...step4.register("title")}
                      />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                      <Input
                        label="Monto objetivo"
                        type="number"
                        placeholder="2.000.000"
                        icon={<Coins className="h-4 w-4" />}
                        error={step4.formState.errors.targetAmount?.message}
                        {...step4.register("targetAmount", { valueAsNumber: true })}
                      />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                      <Input
                        label="Fecha límite (opcional)"
                        type="date"
                        icon={<Calendar className="h-4 w-4" />}
                        error={step4.formState.errors.deadline?.message}
                        {...step4.register("deadline")}
                      />
                    </motion.div>
                    <motion.div variants={staggerItem} className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        size="lg"
                        onClick={skipStep4}
                      >
                        Omitir
                      </Button>
                      <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Button
                          type="submit"
                          className="w-full"
                          size="lg"
                          loading={loading}
                        >
                          Finalizar
                        </Button>
                      </motion.div>
                    </motion.div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

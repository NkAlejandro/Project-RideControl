import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Moon,
  Sun,
  Monitor,
  Download,
  Upload,
  Trash2,
  Car,
  Info,
  ChevronRight,
  Save,
  Check,
  LogOut,
  Cloud,
  CloudOff,
  Bell,
  BellOff,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useAppStore } from "@/store/use-app-store";
import { useSettings } from "@/hooks/use-settings";
import { useVehicles } from "@/hooks/use-vehicles";
import { useAuth } from "@/components/auth-provider";
import { profileRepository } from "@/database/repositories/profile-repository";
import { db } from "@/database/db";
import { cn } from "@/lib/utils";
import { pushSync } from "@/lib/firebase-sync";

const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

const themes = [
  { value: "dark" as const, label: "Oscuro", icon: Moon },
  { value: "light" as const, label: "Claro", icon: Sun },
  { value: "system" as const, label: "Sistema", icon: Monitor },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, type: "spring" as const, stiffness: 100, damping: 14 },
  }),
};

export default function SettingsPage() {
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const appSettings = useAppStore((s) => s.settings);
  const setAppSettings = useAppStore((s) => s.setSettings);
  const activeVehicleId = useAppStore((s) => s.activeVehicleId);
  const setActiveVehicle = useAppStore((s) => s.setActiveVehicle);
  const { settings, update: updateSettings } = useSettings();
  const { vehicles: allVehicles, setActive: setActiveV } = useVehicles();
  const { user, logout } = useAuth();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [clearDataModalOpen, setClearDataModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">(
    () => settings?.theme ?? appSettings?.theme ?? "dark",
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("rc_notifications_enabled") === "true",
  );
  const [soundsEnabled, setSoundsEnabled] = useState(
    () => localStorage.getItem("rc_sounds_enabled") !== "false",
  );

  const handleSoundToggle = () => {
    const newValue = !soundsEnabled;
    setSoundsEnabled(newValue);
    localStorage.setItem("rc_sounds_enabled", newValue ? "true" : "false");
    toast.success(newValue ? "Sonidos activados" : "Sonidos desactivados");
  };

  const handleNotificationToggle = async () => {
    const newValue = !notificationsEnabled;
    if (newValue) {
      if (!("Notification" in window)) {
        toast.error("Tu navegador no soporta notificaciones");
        return;
      }
      if (Notification.permission === "denied") {
        toast.error("Bloqueaste las notificaciones. Cambialo desde la configuración del navegador");
        return;
      }
      if (Notification.permission === "default") {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          toast.error("Permiso denegado");
          return;
        }
      }
      setNotificationsEnabled(true);
      localStorage.setItem("rc_notifications_enabled", "true");
      window.dispatchEvent(new CustomEvent("rc:notifications-toggle", { detail: { enabled: true } }));
      toast.success("Notificaciones activadas");
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem("rc_notifications_enabled", "false");
      window.dispatchEvent(new CustomEvent("rc:notifications-toggle", { detail: { enabled: false } }));
      toast.success("Notificaciones desactivadas");
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? "",
      email: profile?.email ?? "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({ name: profile.name, email: profile.email ?? "" });
    }
  }, [profile, reset]);

  useEffect(() => {
    if (settings?.theme) {
      setSelectedTheme(settings.theme);
    }
  }, [settings?.theme]);

  const applyTheme = (theme: "light" | "dark" | "system") => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  };

  const handleThemeChange = async (theme: "light" | "dark" | "system") => {
    setSelectedTheme(theme);
    applyTheme(theme);
    if (settings) {
      await updateSettings({ theme });
    }
    if (appSettings) {
      setAppSettings({ ...appSettings, theme });
    }
    toast.success("Tema actualizado");
  };

  const handleProfileSubmit = async (data: ProfileForm) => {
    try {
      if (profile) {
        await profileRepository.update(profile.id, {
          name: data.name,
          email: data.email || undefined,
        });
        setProfile({
          ...profile,
          name: data.name,
          email: data.email || undefined,
          updatedAt: new Date(),
        });
      } else {
        const created = await profileRepository.create({
          name: data.name,
          email: data.email || undefined,
        });
        setProfile(created);
      }
      setProfileModalOpen(false);
      toast.success("Perfil actualizado");
    } catch {
      toast.error("Error al actualizar perfil");
    }
  };

  const handleExportData = async () => {
    try {
      const data = {
        profiles: await db.profiles.toArray(),
        vehicles: await db.vehicles.toArray(),
        dailyEntries: await db.dailyEntries.toArray(),
        fuelRecords: await db.fuelRecords.toArray(),
        maintenanceItems: await db.maintenanceItems.toArray(),
        wallets: await db.wallets.toArray(),
        goals: await db.goals.toArray(),
        settings: await db.settings.toArray(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ridecontrol-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Datos exportados correctamente");
    } catch {
      toast.error("Error al exportar datos");
    }
  };

  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.profiles) await db.profiles.bulkPut(data.profiles);
        if (data.vehicles) await db.vehicles.bulkPut(data.vehicles);
        if (data.dailyEntries) await db.dailyEntries.bulkPut(data.dailyEntries);
        if (data.fuelRecords) await db.fuelRecords.bulkPut(data.fuelRecords);
        if (data.maintenanceItems) await db.maintenanceItems.bulkPut(data.maintenanceItems);
        if (data.wallets) await db.wallets.bulkPut(data.wallets);
        if (data.goals) await db.goals.bulkPut(data.goals);
        if (data.settings) await db.settings.bulkPut(data.settings);
        pushSync();
        toast.success("Datos importados correctamente. Recarga la página.");
      } catch {
        toast.error("Error al importar datos. Verifica el archivo.");
      }
    };
    input.click();
  };

  const handleClearData = async () => {
    setClearing(true);
    try {
      await db.profiles.clear();
      await db.vehicles.clear();
      await db.dailyEntries.clear();
      await db.fuelRecords.clear();
      await db.maintenanceItems.clear();
      await db.wallets.clear();
      await db.goals.clear();
      await db.settings.clear();
      pushSync();
      localStorage.removeItem("ridecontrol-storage");
      toast.success("Todos los datos han sido eliminados. Recarga la página.");
      setClearDataModalOpen(false);
    } catch {
      toast.error("Error al eliminar datos");
    } finally {
      setClearing(false);
    }
  };

  const handleVehicleSwitch = async (vehicleId: string) => {
    await setActiveV(vehicleId);
    setActiveVehicle(vehicleId);
    toast.success("Vehículo activo cambiado");
  };

  const currentTheme = selectedTheme;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-color">Configuración</h1>
        <p className="mt-1 text-sm text-secondary-color">Personaliza tu experiencia</p>
      </div>

      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setProfileModalOpen(true)}
            className="flex w-full items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-hover"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" as const, stiffness: 200, delay: 0.2 }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10"
            >
              <User className="h-5 w-5 text-primary-500" />
            </motion.div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-primary-color">
                {profile?.name ?? "Sin nombre"}
              </p>
              <p className="text-xs text-secondary-color">
                {user?.email ?? profile?.email ?? "Sin email"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-color" />
          </motion.button>
          <div className="mt-2 border-t border-theme-subtle pt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-medium text-danger-500 transition-colors hover:bg-danger-500/5"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </motion.button>
          </div>
        </Card>
      </motion.div>

      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Apariencia</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = currentTheme === t.value;
              return (
                <motion.button
                  key={t.value}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleThemeChange(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
                    isActive
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-theme-subtle hover:border-theme-medium hover:bg-hover"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary-500" : "text-secondary-color"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive ? "text-primary-500" : "text-secondary-color"
                    )}
                  >
                    {t.label}
                  </span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-1.5 w-1.5 rounded-full bg-primary-500"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {user && (
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Sincronización</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-4 rounded-2xl border border-theme-subtle p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-500/10">
                <Cloud className="h-5 w-5 text-success-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-color">Activa</p>
                <p className="text-xs text-secondary-color">
                  Tus datos se sincronizan automáticamente con tu cuenta
                </p>
              </div>
              <Check className="h-5 w-5 text-success-500" />
            </div>
            <p className="mt-3 text-xs text-secondary-color">
              Inicia sesión con tu misma cuenta en otro dispositivo y todos tus datos aparecerán automáticamente.
            </p>
          </Card>
        </motion.div>
      )}

      {!user && (
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Sincronización</CardTitle>
            </CardHeader>
            <div className="flex items-center gap-4 rounded-2xl border border-theme-subtle p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-hover">
                <CloudOff className="h-5 w-5 text-secondary-color" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-color">Inactiva</p>
                <p className="text-xs text-secondary-color">
                  Inicia sesión para sincronizar tus datos entre dispositivos
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
              notificationsEnabled ? "bg-primary-500/10" : "bg-hover",
            )}>
              {notificationsEnabled
                ? <Bell className="h-5 w-5 text-primary-500" />
                : <BellOff className="h-5 w-5 text-secondary-color" />
              }
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-color">
                {notificationsEnabled ? "Activadas" : "Desactivadas"}
              </p>
              <p className="text-xs text-secondary-color">
                {notificationsEnabled
                  ? "Recibirás alertas de mantenimiento, metas y cierre diario"
                  : "Actívalas para recibir recordatorios importantes"
                }
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNotificationToggle}
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors",
                notificationsEnabled
                  ? "bg-primary-500"
                  : "bg-white/[0.1]",
              )}
            >
              <motion.div
                animate={{ x: notificationsEnabled ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md"
              />
            </motion.button>
          </div>
          <p className="mt-3 text-xs text-secondary-color">
            Las notificaciones aparecerán incluso cuando la aplicación esté cerrada.
            {notificationsEnabled && " Gestiona tus preferencias desde la configuración de tu navegador."}
          </p>
        </Card>
      </motion.div>

      <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Sonidos</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
              soundsEnabled ? "bg-primary-500/10" : "bg-hover",
            )}>
              <span className="text-lg">{soundsEnabled ? "🔊" : "🔇"}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-color">
                {soundsEnabled ? "Activados" : "Desactivados"}
              </p>
              <p className="text-xs text-secondary-color">
                {soundsEnabled
                  ? "Escucharás sonidos al registrar gasolina, completar metas y más"
                  : "Actívalos para una experiencia más inmersiva"
                }
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSoundToggle}
              className={cn(
                "relative h-7 w-12 rounded-full transition-colors",
                soundsEnabled
                  ? "bg-primary-500"
                  : "bg-white/[0.1]",
              )}
            >
              <motion.div
                animate={{ x: soundsEnabled ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md"
              />
            </motion.button>
          </div>
          <p className="mt-3 text-xs text-secondary-color">
            Sonidos breves al realizar acciones importantes como registrar gastos o completar objetivos.
          </p>
        </Card>
      </motion.div>



      {allVehicles.length > 0 && (
        <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Vehículo activo</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {allVehicles.map((vehicle) => {
                const isActive = vehicle.id === activeVehicleId;
                return (
                  <motion.button
                    key={vehicle.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleVehicleSwitch(vehicle.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 transition-all",
                      isActive
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-theme-subtle hover:border-theme-medium hover:bg-hover"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        isActive ? "bg-primary-500/20" : "bg-hover"
                      )}
                    >
                      <Car
                        className={cn(
                          "h-5 w-5",
                          isActive ? "text-primary-500" : "text-secondary-color"
                        )}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-primary-color">
                        {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-xs text-secondary-color">{vehicle.year}</p>
                    </div>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring" as const, stiffness: 300 }}
                        >
                          <Check className="h-4 w-4 text-primary-500" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div custom={6} variants={sectionVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Datos</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportData}
              className="btn-ripple press-effect flex w-full items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-hover"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
                <Download className="h-5 w-5 text-primary-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-primary-color">Exportar datos</p>
                <p className="text-xs text-secondary-color">Descargar backup en JSON</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-color" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleImportData}
              className="btn-ripple press-effect flex w-full items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-hover"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/10">
                <Upload className="h-5 w-5 text-success-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-primary-color">Importar datos</p>
                <p className="text-xs text-secondary-color">Restaurar desde archivo JSON</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-color" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setClearDataModalOpen(true)}
              className="btn-ripple press-effect flex w-full items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-danger-500/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-500/10">
                <Trash2 className="h-5 w-5 text-danger-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-danger-500">Borrar todos los datos</p>
                <p className="text-xs text-secondary-color">Eliminar permanentemente</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-color" />
            </motion.button>
          </div>
        </Card>
      </motion.div>

      <motion.div custom={7} variants={sectionVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Acerca de</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
                <Info className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-color">RideControl</p>
                <p className="text-xs text-secondary-color">Versión 1.0.0</p>
              </div>
            </div>
            <div className="rounded-2xl bg-hover p-3">
              <p className="text-xs text-secondary-color">
                Gestiona tus ingresos, gastos y mantenimiento de tu vehículo de forma inteligente.
                Diseñado para conductores profesionales en Colombia.
              </p>
            </div>
            <div className="text-xs text-secondary-color">
              <p>Desarrollado con React + TypeScript + Dexie</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {profileModalOpen && (
          <Modal
            isOpen={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            title="Editar perfil"
          >
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring" as const, stiffness: 150, damping: 15 }}
              onSubmit={handleSubmit(handleProfileSubmit)}
              className="space-y-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Input
                  label="Nombre"
                  placeholder="Tu nombre"
                  error={errors.name?.message}
                  autoFocus
                  inputMode="text"
                  autoComplete="name"
                  {...register("name")}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Input
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </motion.div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setProfileModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  <Save className="h-4 w-4" />
                  Guardar
                </Button>
              </div>
            </motion.form>
          </Modal>
      )}

      {clearDataModalOpen && (
          <Modal
            isOpen={clearDataModalOpen}
            onClose={() => setClearDataModalOpen(false)}
            title="Borrar todos los datos"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring" as const, stiffness: 150, damping: 15 }}
              className="space-y-4"
            >
              <p className="text-sm text-secondary-color">
                Esta acción eliminará permanentemente todos tus datos: perfil, vehículos, registros
                diarios, combustible, mantenimiento, billeteras, metas y configuración.
              </p>
              <p className="text-sm font-medium text-danger-500">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setClearDataModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  loading={clearing}
                  onClick={handleClearData}
                >
                  <Trash2 className="h-4 w-4" />
                  Borrar todo
                </Button>
              </div>
            </motion.div>
          </Modal>
      )}
    </div>
  );
}

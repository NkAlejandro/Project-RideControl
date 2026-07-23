import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, LogOut, Bell, Wrench, Target, CalendarCheck, Settings, ChevronDown, Moon, Sun, Monitor, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { useNotifications } from "@/hooks/use-notifications";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";
import { useHoverSound } from "@/lib/use-sounds";
import { useAppStore, currencies } from "@/store/use-app-store";
import { usePlatform } from "@/hooks/use-platform";

const iconMap = {
  maintenance: Wrench,
  goal: Target,
  "daily-close": CalendarCheck,
};

const severityColor = {
  warning: "text-warning-500 bg-warning-500/10",
  info: "text-primary-500 bg-primary-500/10",
  success: "text-success-500 bg-success-500/10",
};

const themeOrder: ("dark" | "light" | "system")[] = ["dark", "light", "system"];
const themeLabels = { dark: "Oscuro", light: "Claro", system: "Sistema" };
const themeIcons = { dark: Moon, light: Sun, system: Monitor };

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { isAndroid } = usePlatform();
  const { hover } = useHoverSound();
  const { user, logout } = useAuth();
  const selectedCurrency = useAppStore((s) => s.selectedCurrency);
  const setSelectedCurrency = useAppStore((s) => s.setSelectedCurrency);
  const { notifications, count } = useNotifications();
  const { settings, update: updateSettings } = useSettings();
  const appSettings = useAppStore((s) => s.settings);
  const setAppSettings = useAppStore((s) => s.setSettings);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const profile = useAppStore((s) => s.profile);
  const displayName = profile?.name || user?.email || "Usuario";
  const initials = profile?.name ? profile.name.slice(0, 2).toUpperCase() : (user?.email?.slice(0, 2).toUpperCase() || "RC");
  const [localTheme, setLocalTheme] = useState<"dark" | "light" | "system">(
    () => settings?.theme ?? appSettings?.theme ?? "dark"
  );

  const resolvedTheme = settings?.theme ?? appSettings?.theme ?? "dark";

  useEffect(() => {
    setLocalTheme(resolvedTheme as "dark" | "light" | "system");
  }, [resolvedTheme]);

  const closeAll = useCallback(() => {
    setOpen(false);
    setCurrencyOpen(false);
    setUserMenuOpen(false);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setCurrencyOpen(false); }
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleThemeToggle = async () => {
    const idx = themeOrder.indexOf(localTheme);
    const next = themeOrder[(idx + 1) % themeOrder.length];
    setLocalTheme(next);
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (next === "system") {
      root.classList.add(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } else {
      root.classList.add(next);
    }
    if (settings) await updateSettings({ theme: next });
    if (appSettings) setAppSettings({ ...appSettings, theme: next });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-theme-subtle px-3 safe-area-top lg:h-16 lg:gap-4 lg:px-6 ${isAndroid ? "bg-surface" : "bg-surface/80 backdrop-blur-lg"}`}
    >
      <button
        data-menu-toggle
        onClick={onMenuToggle}
        onMouseEnter={() => hover("tap")}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-secondary-color transition-all duration-200 hover:bg-hover hover:text-primary-color active:scale-95 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center gap-4">
        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-color" />
          <input
            type="text"
            placeholder="Buscar..."
            className="focus-ring h-10 w-full rounded-xl border border-theme-subtle bg-input pl-11 pr-4 text-sm text-primary-color placeholder:text-muted-color transition-all duration-300 focus:border-theme-medium focus:outline-none focus:bg-hover focus:shadow-[0_0_0_3px_rgba(79,110,255,0.12)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-1" ref={ref}>
        {/* Currency Selector */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onMouseEnter={() => hover("tap")}
            onClick={() => { setOpen(false); setCurrencyOpen(!currencyOpen); }}
            className={cn(
              "min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 rounded-xl transition-colors px-2",
              currencyOpen ? "bg-hover text-primary-color" : "text-secondary-color hover:bg-hover hover:text-primary-color"
            )}
          >
            <span className="text-base leading-none">{currencies.find(c => c.code === selectedCurrency)?.flag || "💵"}</span>
            <span className="text-sm font-medium">{selectedCurrency}</span>
          </motion.button>

          <AnimatePresence>
            {currencyOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-2xl border border-theme-subtle bg-card shadow-2xl"
              >
                <div className="max-h-48 overflow-y-auto overscroll-contain p-1.5">
                  {currencies.map((c) => {
                    const active = selectedCurrency === c.code;
                    return (
                      <button
                        key={c.code}
                        onMouseEnter={() => hover("tap")}
                        onClick={() => { setSelectedCurrency(c.code); setCurrencyOpen(false); }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          active ? "bg-primary-500/10 text-primary-500" : "text-secondary-color hover:bg-hover hover:text-primary-color",
                        )}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span className="flex-1">
                          <span className={cn("font-medium", active && "text-primary-500")}>{c.code}</span>
                          <span className="ml-1.5 text-xs text-muted-color">{c.label}</span>
                        </span>
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onMouseEnter={() => hover("tap")}
            onClick={() => { setOpen(!open); setUserMenuOpen(false); setCurrencyOpen(false); }}
            className={cn(
              "min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors",
              open ? "bg-hover text-primary-color" : "text-secondary-color hover:bg-hover hover:text-primary-color"
            )}
          >
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-inverse-color"
              >
                {count}
              </motion.span>
            )}
          </motion.button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-theme-subtle bg-card shadow-2xl"
              >
                <div className="border-b border-theme-subtle px-4 py-3">
                  <p className="text-sm font-semibold text-primary-color">Notificaciones</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="mx-auto mb-2 h-8 w-8 text-muted-color" />
                      <p className="text-sm text-secondary-color">Sin notificaciones</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const Icon = iconMap[n.type];
                      return (
                        <div
                          key={n.id}
                          className="flex items-start gap-3 border-b border-theme-subtle px-4 py-3 last:border-0"
                        >
                          <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", severityColor[n.severity])}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-primary-color">{n.title}</p>
                            <p className="text-xs text-secondary-color">{n.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => hover("tap")}
            onClick={() => { setUserMenuOpen(!userMenuOpen); setOpen(false); setCurrencyOpen(false); }}
            className={cn(
              "flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2 transition-colors",
              userMenuOpen ? "bg-hover" : "hover:bg-hover"
            )}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-inverse-color">
              {initials}
            </div>
            <span className="hidden text-sm font-medium text-primary-color lg:block max-w-[120px] truncate">
              {displayName}
            </span>
            <ChevronDown className={cn("hidden h-4 w-4 text-muted-color transition-transform duration-200 lg:block", userMenuOpen && "rotate-180")} />
          </motion.button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="absolute right-0 top-full mt-2 w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-theme-subtle bg-card shadow-2xl"
              >
                {/* User Info */}
                <div className="border-b border-theme-subtle px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-bold text-inverse-color">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-primary-color truncate">{displayName}</p>
                      <p className="text-xs text-muted-color">Cuenta activa</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1.5">
                  <button
                    onMouseEnter={() => hover("tap")}
                    onClick={() => { navigate("/settings"); closeAll(); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-secondary-color transition-colors hover:bg-hover hover:text-primary-color"
                  >
                    <Settings className="h-4 w-4" />
                    Configuración
                  </button>
                  <button
                    onMouseEnter={() => hover("tap")}
                    onClick={handleThemeToggle}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-secondary-color transition-colors hover:bg-hover hover:text-primary-color"
                  >
                    {(() => {
                      const Icon = themeIcons[localTheme];
                      return <Icon className="h-4 w-4" />;
                    })()}
                    <span className="flex-1 text-left">Tema: {themeLabels[localTheme]}</span>
                    <RefreshCw className="h-3 w-3 text-muted-color" />
                  </button>
                </div>

                {/* Account */}
                <div className="border-t border-theme-subtle py-1.5">
                  <button
                    onMouseEnter={() => hover("tap")}
                    onClick={() => { logout(); closeAll(); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-secondary-color transition-colors hover:bg-hover hover:text-primary-color"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Cambiar de cuenta
                  </button>
                  <button
                    onMouseEnter={() => hover("tap")}
                    onClick={() => { logout(); closeAll(); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger-500 transition-colors hover:bg-danger-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}

import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  LayoutDashboard,
  CalendarCheck,
  Bike,
  Fuel,
  Wrench,
  Wallet,
  Target,
  BarChart3,
  PieChart,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHoverSound } from "@/lib/use-sounds";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/daily-close", icon: CalendarCheck, label: "Cerrar día" },
  { to: "/vehicles", icon: Bike, label: "Vehículos" },
  { to: "/fuel", icon: Fuel, label: "Combustible" },
  { to: "/maintenance", icon: Wrench, label: "Mantenimiento" },
  { to: "/wallets", icon: Wallet, label: "Billeteras" },
  { to: "/goals", icon: Target, label: "Objetivos" },
  { to: "/reports", icon: PieChart, label: "Reportes" },
  { to: "/statistics", icon: BarChart3, label: "Estadísticas" },
  { to: "/ai", icon: Sparkles, label: "IA" },
  { to: "/settings", icon: Settings, label: "Configuración" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { hover } = useHoverSound();
  return (
    <div className="flex h-full flex-col border-r border-theme-subtle bg-surface">
      <div className="flex h-14 items-center justify-between px-4 lg:h-16 lg:px-5">
        <div className="flex items-center gap-3">
          <div className="icon-bounce flex h-8 w-8 items-center justify-center rounded-xl bg-white cursor-pointer">
            <span className="text-xs font-bold text-black">RC</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-primary-color">RideControl</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-secondary-color hover:bg-hover hover:text-primary-color lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <motion.nav
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2"
      >
        {navItems.map((item) => (
          <motion.div key={item.to} variants={itemVariants}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              onClick={onClose}
              onMouseEnter={() => hover("nav")}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-500/15 text-primary-600 dark:text-primary-400 nav-item-active hover-scale"
                    : "text-secondary-color hover:bg-hover hover:text-primary-color hover:scale-[1.02]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-all duration-200",
                      isActive
                        ? "text-primary-500 icon-bounce"
                        : "text-muted-color group-hover:text-secondary-color group-hover:scale-110",
                    )}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>

      <div className="p-3 border-t border-theme-subtle">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-medium text-secondary-color transition-all duration-200 hover:bg-danger-500/10 hover:text-danger-500"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </motion.button>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-[min(288px,85vw)] lg:hidden"
          >
            <SidebarContent onClose={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

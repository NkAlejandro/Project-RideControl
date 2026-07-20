import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarCheck,
  Bike,
  Wallet,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Inicio" },
  { to: "/daily-close", icon: CalendarCheck, label: "Cerrar" },
  { to: "/vehicles", icon: Bike, label: "Moto" },
  { to: "/wallets", icon: Wallet, label: "Billetera" },
  { to: "/settings", icon: Settings, label: "Ajustes" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export function BottomNav() {
  return (
    <motion.nav
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-theme-subtle bg-surface/90 backdrop-blur-xl lg:hidden safe-area-bottom"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-around px-1 pt-2 pb-2"
      >
        {navItems.map((item) => (
          <motion.div key={item.to} variants={itemVariants}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "press-effect flex flex-col items-center gap-1 rounded-xl px-3 py-2 min-h-[44px] text-[11px] font-medium transition-all duration-200",
                  isActive
                    ? "text-primary-color"
                    : "text-muted-color hover:text-secondary-color",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isActive ? "scale-110" : "scale-100",
                      )}
                    />
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-indicator"
                        className="absolute -bottom-2.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary-500 animate-bounce-in"
                        transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "transition-all duration-200",
                      isActive && "font-semibold",
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </motion.div>
    </motion.nav>
  );
}

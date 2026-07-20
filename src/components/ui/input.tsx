import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        {label && (
          <motion.label
            className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider"
            animate={{
              color: focused ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)",
              x: focused ? 2 : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <div className="group relative">
          {icon && (
            <motion.div
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 z-[1]"
              animate={{ color: focused ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)" }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>
          )}
          <input
            ref={ref}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
            className={cn(
              "glass-input relative flex h-10 w-full rounded-xl px-3.5 text-[15px] text-white/90 transition-all duration-300",
              "placeholder:text-white/25 placeholder:transition-all placeholder:duration-300",
              "focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-30",
              "selection:bg-white/20 selection:text-white",
              icon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-400/30 focus:border-red-400/50 focus:shadow-[0_0_20px_rgba(248,113,113,0.06)]",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors duration-300 group-focus-within:text-white/60 z-[1]">
              {rightIcon}
            </div>
          )}
        </div>
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key={error}
              initial={{ opacity: 0, y: -4, x: -4 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="mt-1 text-[10px] font-medium text-red-400/80"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

Input.displayName = "Input";

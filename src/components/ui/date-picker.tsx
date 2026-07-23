import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

export function DatePicker({ value, onChange, error }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(startOfMonth(value));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const startPad = getDay(startOfMonth(viewMonth));

  const prevMonth = () => setViewMonth((m) => subMonths(m, 1));
  const nextMonth = () => setViewMonth((m) => addMonths(m, 1));

  const select = (d: Date) => {
    onChange(d);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "glass-input relative flex h-10 w-full items-center gap-2 rounded-xl px-3.5 text-[15px] text-primary-color transition-all duration-300",
          "focus:outline-none focus:shadow-[0_0_0_2px_rgba(255,255,255,0.08)]",
          error && "border-red-400/30",
        )}
      >
        <Calendar className="h-4 w-4 text-muted-color" />
        <span className="flex-1 text-left">{format(value, "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
        <ChevronRight className={cn("h-3.5 w-3.5 text-muted-color transition-transform duration-200", open && "rotate-90")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full z-50 mt-1.5 w-[280px] overflow-hidden rounded-2xl border border-theme-subtle bg-card shadow-2xl"
          >
            <div className="px-3 pt-3 pb-2">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-color transition-colors hover:bg-hover hover:text-secondary-color"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-primary-color">
                  {format(viewMonth, "MMMM yyyy", { locale: es })}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-color transition-colors hover:bg-hover hover:text-secondary-color"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-0.5">
                {DAYS.map((d) => (
                  <div key={d} className="flex h-7 items-center justify-center text-[11px] font-medium text-muted-color">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {days.map((d) => {
                  const selected = isSameDay(d, value);
                  const today = isToday(d);
                  const sameMonth = isSameMonth(d, viewMonth);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => select(d)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl text-sm transition-all duration-150",
                        selected
                          ? "bg-primary-500 text-on-primary font-semibold shadow-sm"
                          : today
                            ? "text-primary-color font-medium"
                            : sameMonth
                              ? "text-secondary-color hover:bg-hover hover:text-primary-color"
                              : "text-muted-color",
                      )}
                    >
                      {format(d, "d")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-theme-subtle px-3 py-2">
              <button
                type="button"
                onClick={() => select(new Date())}
                className="w-full rounded-lg py-1.5 text-xs font-medium text-primary-500 transition-colors hover:bg-hover"
              >
                Hoy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            className="mt-1 text-[10px] font-medium text-red-400/80"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

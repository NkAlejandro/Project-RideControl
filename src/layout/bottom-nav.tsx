import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  LayoutDashboard,
  CalendarCheck,
  Bike,
  PieChart,
  Settings,
} from "lucide-react";
import { usePlatform } from "../hooks/use-platform";

interface TabItem {
  id: string;
  icon: React.ElementType;
  path: string;
  label?: string;
}

const DEFAULT_TABS: TabItem[] = [
  { id: "dashboard", icon: LayoutDashboard, path: "/", label: "Inicio" },
  { id: "daily-close", icon: CalendarCheck, path: "/daily-close", label: "Cerrar" },
  { id: "vehicles", icon: Bike, path: "/vehicles", label: "Moto" },
  { id: "finance", icon: PieChart, path: "/finance", label: "Finanzas" },
  { id: "settings", icon: Settings, path: "/settings", label: "Ajustes" },
];

const BTN_SIZE = 46;
const GAP = 6;
const STEP = BTN_SIZE + GAP;
const PAD = 20;

interface BottomNavProps {
  tabs?: TabItem[];
}

function findTabIdx(pathname: string, tabs: TabItem[]): number {
  return tabs.findIndex(
    (t) =>
      t.path === "/"
        ? pathname === "/"
        : pathname.startsWith(t.path),
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function BottomNav({ tabs = DEFAULT_TABS }: BottomNavProps) {
  const { isAndroid } = usePlatform();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIdx, setActiveIdx] = useState(() => {
    const idx = findTabIdx(location.pathname, tabs);
    return idx >= 0 ? idx : 0;
  });
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const touchStartX = useRef(0);
  const [swiping, setSwiping] = useState(false);
  const indicatorX = useMotionValue(0);
  const menuScale = useMotionValue(1);
  const lastIdx = tabs.length - 1;
  const barWidth = tabs.length * BTN_SIZE + (tabs.length - 1) * GAP + 40;
  const minX = PAD;
  const maxX = PAD + lastIdx * STEP;

  const edgeFactor = useTransform(indicatorX, [minX, maxX], [0, 1]);
  const leftStrength = useTransform(edgeFactor, [0, 0.5], [1, 0]);
  const rightStrength = useTransform(edgeFactor, [0.5, 1], [0, 1]);
  const leftEdgeScale = useTransform(leftStrength, [0, 1], [1, 1.15]);
  const rightEdgeScale = useTransform(rightStrength, [0, 1], [1, 1.15]);

  const b0s = useTransform(indicatorX, [PAD - 24, PAD, PAD + 24], [1, 1.12, 1]);
  const b1s = useTransform(indicatorX, [PAD + STEP - 24, PAD + STEP, PAD + STEP + 24], [1, 1.12, 1]);
  const b2s = useTransform(indicatorX, [PAD + 2*STEP - 24, PAD + 2*STEP, PAD + 2*STEP + 24], [1, 1.12, 1]);
  const b3s = useTransform(indicatorX, [PAD + 3*STEP - 24, PAD + 3*STEP, PAD + 3*STEP + 24], [1, 1.12, 1]);
  const b4s = useTransform(indicatorX, [PAD + 4*STEP - 24, PAD + 4*STEP, PAD + 4*STEP + 24], [1, 1.12, 1]);
  const btnScales = [b0s, b1s, b2s, b3s, b4s];

  const barGlow = useMotionValue("");
  useEffect(() => {
    if (isAndroid) return;
    const unsub = indicatorX.on("change", (v) => {
      barGlow.set(
        `radial-gradient(ellipse 140px 64px at ${v + BTN_SIZE / 2}px 50%, rgba(255,255,255,0.045) 0%, transparent 100%)`
      );
    });
    return unsub;
  }, [indicatorX, barGlow, isAndroid]);

  useLayoutEffect(() => {
    const idx = findTabIdx(location.pathname, tabs);
    if (idx >= 0) {
      setActiveIdx(idx);
      indicatorX.set(idx * STEP + PAD);
    }
  }, []);

  useEffect(() => {
    const idx = findTabIdx(location.pathname, tabs);
    if (idx >= 0 && idx !== activeIdx) {
      setActiveIdx(idx);
    }
  }, [location.pathname]);

  const springConfig = isAndroid
    ? { type: "spring" as const, stiffness: 800, damping: 40, mass: 0.4 }
    : { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };

  const tapConfig = isAndroid
    ? { type: "spring" as const, stiffness: 500, damping: 25, mass: 0.3 }
    : { type: "spring" as const, stiffness: 300, damping: 20 };

  useEffect(() => {
    animate(indicatorX, activeIdx * STEP + PAD, springConfig);
  }, [activeIdx]);

  const getNearest = useCallback((): number => {
    return clamp(Math.round((indicatorX.get() - PAD) / STEP), 0, lastIdx);
  }, [indicatorX, lastIdx]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = e.touches[0].clientX;
    if (x < rect.left || x > rect.right) return;
    touchStartX.current = x;
    hasMoved.current = false;
    isDragging.current = false;
    const ratio = (x - rect.left) / rect.width;
    const raw = ratio * barWidth - BTN_SIZE / 2;
    indicatorX.set(clamp(raw, minX, maxX));
    if (!isAndroid) {
      animate(menuScale, 1.03, tapConfig);
    }
  }, [indicatorX, menuScale, barWidth, minX, maxX, isAndroid, tapConfig]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = e.touches[0].clientX;
    if (x < rect.left || x > rect.right) return;
    const diff = Math.abs(x - touchStartX.current);
    if (diff > 5) {
      if (!hasMoved.current) {
        hasMoved.current = true;
        isDragging.current = true;
        setSwiping(true);
      }
      e.preventDefault();
      const ratio = (x - rect.left) / rect.width;
      const raw = ratio * barWidth - BTN_SIZE / 2;
      indicatorX.set(clamp(raw, minX, maxX));
    }
  }, [indicatorX, barWidth, minX, maxX]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!hasMoved.current) return;
      e.preventDefault();
      const nearestIdx = getNearest();
      hasMoved.current = false;
      isDragging.current = false;
      setSwiping(false);
      if (!isAndroid) {
        animate(menuScale, 1, tapConfig);
      }
      if (nearestIdx !== activeIdx) {
        navigate(tabs[nearestIdx].path);
        setActiveIdx(nearestIdx);
      } else {
        animate(indicatorX, nearestIdx * STEP + PAD, springConfig);
      }
    },
    [activeIdx, getNearest, indicatorX, menuScale, navigate, tabs, isAndroid, springConfig, tapConfig],
  );

  const handleClick = useCallback(
    (i: number) => {
      if (isDragging.current) return;
      if (i !== activeIdx) {
        navigate(tabs[i].path);
        setActiveIdx(i);
      }
    },
    [activeIdx, navigate, tabs],
  );

  return (
    <motion.nav
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: isAndroid ? 0.25 : 0.5, delay: isAndroid ? 0.1 : 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[14px] lg:hidden"
    >
      <motion.div
        ref={barRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative mx-auto grid items-center rounded-full bg-elevated px-5 py-3 shadow-md shadow-black/20 dark:shadow-black/40 select-none touch-none overflow-hidden"
        style={{
          height: BTN_SIZE + 24,
          width: barWidth,
          gridTemplateColumns: `repeat(${tabs.length}, ${BTN_SIZE}px)`,
          gap: GAP,
          ...(isAndroid ? {} : { backdropFilter: "blur(12px)" }), 
          scale: menuScale,
        }}
      >
        {!isAndroid && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: barGlow }}
          />
        )}
        {swiping && !isAndroid && (
          <>
            <motion.div
              className="absolute left-0 top-0 bottom-0 pointer-events-none rounded-l-full"
              style={{
                width: 44,
                background: "linear-gradient(90deg, rgba(255,255,255,0.12) 0%, transparent 100%)",
                opacity: leftStrength,
                scaleX: leftEdgeScale,
                transformOrigin: "left center",
              }}
            />
            <motion.div
              className="absolute right-0 top-0 bottom-0 pointer-events-none rounded-r-full"
              style={{
                width: 44,
                background: "linear-gradient(270deg, rgba(255,255,255,0.12) 0%, transparent 100%)",
                opacity: rightStrength,
                scaleX: rightEdgeScale,
                transformOrigin: "right center",
              }}
            />
          </>
        )}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: BTN_SIZE,
            height: BTN_SIZE,
            top: 0,
            bottom: 0,
            marginTop: "auto",
            marginBottom: "auto",
            left: 0,
            x: indicatorX,
            borderRadius: "50%",
            ...(isAndroid
              ? {
                  background: "rgba(255,255,255,0.15)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
                }
              : {
                  background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 100%)",
                  border: "0.5px solid rgba(255,255,255,0.20)",
                  boxShadow: "0 4px 32px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.30)",
                }),
          }}
        />
        {tabs.map((tab, i) => {
          const isActive = i === activeIdx;
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => handleClick(i)}
              className="relative flex items-center justify-center rounded-full z-10 cursor-pointer"
              style={{
                width: BTN_SIZE,
                height: BTN_SIZE,
                ...(swiping && !isAndroid ? { scale: btnScales[i] } : isActive && !isAndroid ? { scale: 1.12 } : {}),
              }}
            >
              <Icon
                size={28}
                strokeWidth={isActive ? 2.5 : 1.8}
                className="relative z-10 text-primary-color"
              />
            </motion.button>
          );
        })}
      </motion.div>
    </motion.nav>
  );
}

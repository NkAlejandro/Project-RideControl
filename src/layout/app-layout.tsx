import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { usePlatform } from "../hooks/use-platform";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const pageVariantsAndroid = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export function AppLayout() {
  const { isAndroid } = usePlatform();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    function handleClick(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (sidebarRef.current?.contains(target)) return;
      if ((target as HTMLElement)?.closest?.("[data-menu-toggle]")) return;
      setSidebarOpen(false);
    }
    document.addEventListener("mousedown", handleClick, { capture: true });
    document.addEventListener("touchstart", handleClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick, { capture: true });
      document.removeEventListener("touchstart", handleClick, { capture: true });
    };
  }, [sidebarOpen]);

  const variants = isAndroid ? pageVariantsAndroid : pageVariants;

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface">
      <div ref={sidebarRef}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isAndroid ? 0.2 : 0.35 }}
            className="fixed inset-0 z-40 bg-overlay lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="lg:pl-60">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="px-4 py-6 pb-24 lg:px-6 lg:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { SyncProvider } from "@/components/sync-provider";
import { tryRegisterFCM, tryUnregisterFCM } from "@/lib/firebase-messaging";
import { AppLayout } from "@/layout/app-layout";
import { TutorialOverlay } from "@/components/tutorial-overlay";
import LoginPage from "@/features/auth/pages/login-page";
import DashboardPage from "@/features/dashboard/pages/dashboard-page";
import OnboardingPage from "@/features/onboarding/pages/onboarding-page";
import DailyClosePage from "@/features/daily-close/pages/daily-close-page";
import VehiclesPage from "@/features/vehicles/pages/vehicles-page";
import FuelPage from "@/features/fuel/pages/fuel-page";
import MaintenancePage from "@/features/maintenance/pages/maintenance-page";
import FinancePage from "@/features/finance/pages/finance-page";
import GoalsPage from "@/features/goals/pages/goals-page";
import ReportsPage from "@/features/reports/pages/reports-page";
import StatisticsPage from "@/features/statistics/pages/statistics-page";
import AiPage from "@/features/ai/pages/ai-page";
import SettingsPage from "@/features/settings/pages/settings-page";

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/onboarding" element={
          <motion.div {...pageTransition}>
            <OnboardingPage />
          </motion.div>
        } />
        <Route element={<AppLayout />}>
          <Route path="/" element={
            <motion.div {...pageTransition}>
              <DashboardPage />
            </motion.div>
          } />
          <Route path="/daily-close" element={
            <motion.div {...pageTransition}>
              <DailyClosePage />
            </motion.div>
          } />
          <Route path="/vehicles" element={
            <motion.div {...pageTransition}>
              <VehiclesPage />
            </motion.div>
          } />
          <Route path="/fuel" element={
            <motion.div {...pageTransition}>
              <FuelPage />
            </motion.div>
          } />
          <Route path="/maintenance" element={
            <motion.div {...pageTransition}>
              <MaintenancePage />
            </motion.div>
          } />
          <Route path="/finance" element={
            <motion.div {...pageTransition}>
              <FinancePage />
            </motion.div>
          } />
          <Route path="/goals" element={
            <motion.div {...pageTransition}>
              <GoalsPage />
            </motion.div>
          } />
          <Route path="/reports" element={
            <motion.div {...pageTransition}>
              <ReportsPage />
            </motion.div>
          } />
          <Route path="/statistics" element={
            <motion.div {...pageTransition}>
              <StatisticsPage />
            </motion.div>
          } />
          <Route path="/ai" element={
            <motion.div {...pageTransition}>
              <AiPage />
            </motion.div>
          } />
          <Route path="/settings" element={
            <motion.div {...pageTransition}>
              <SettingsPage />
            </motion.div>
          } />
        </Route>
        <Route path="*" element={
          <motion.div {...pageTransition}>
            <Navigate to="/" />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const handleFCM = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.enabled) {
        tryRegisterFCM(user.uid);
      } else {
        tryUnregisterFCM(user.uid);
      }
    };
    const handleMessage = (e: Event) => {
      const payload = (e as CustomEvent).detail;
      const n = payload?.notification;
      if (n?.title) {
        toast(n.title, { description: n.body, duration: 4000 });
      }
    };
    window.addEventListener("rc:notifications-toggle", handleFCM);
    window.addEventListener("rc:fcm-message", handleMessage);
    return () => {
      window.removeEventListener("rc:notifications-toggle", handleFCM);
      window.removeEventListener("rc:fcm-message", handleMessage);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <SyncProvider>
      <BrowserRouter>
        <TutorialOverlay />
        <AnimatedRoutes />
      </BrowserRouter>
    </SyncProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

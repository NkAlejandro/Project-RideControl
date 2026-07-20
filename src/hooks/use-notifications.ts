import { useMemo } from "react";
import { useVehicles } from "@/hooks/use-vehicles";
import { useMaintenance } from "@/hooks/use-maintenance";
import { useGoals } from "@/hooks/use-goals";
import { useDailyEntries } from "@/hooks/use-daily-entries";

export interface Notification {
  id: string;
  type: "maintenance" | "goal" | "daily-close";
  severity: "warning" | "info" | "success";
  title: string;
  message: string;
}

export function useNotifications() {
  const { activeVehicle } = useVehicles();
  const { items: maintenanceItems } = useMaintenance(activeVehicle?.id);
  const { goals } = useGoals();
  const { todayEntry } = useDailyEntries(activeVehicle?.id);

  const notifications = useMemo<Notification[]>(() => {
    const result: Notification[] = [];
    const now = new Date();

    if (activeVehicle) {
      for (const item of maintenanceItems) {
        const nextDate = new Date(item.lastDate);
        nextDate.setDate(nextDate.getDate() + item.intervalDays);
        const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 0) {
          result.push({
            id: `maint-date-${item.id}`,
            type: "maintenance",
            severity: "warning",
            title: `${item.name} vencido`,
            message: `Venció hace ${Math.abs(daysUntil)} días`,
          });
        } else if (daysUntil <= 7) {
          result.push({
            id: `maint-date-${item.id}`,
            type: "maintenance",
            severity: "info",
            title: `${item.name} próximo`,
            message: `Vence en ${daysUntil} días`,
          });
        }

        const nextKm = item.lastKm + item.intervalKm;
        const kmUntil = nextKm - activeVehicle.mileage;

        if (kmUntil <= 0) {
          result.push({
            id: `maint-km-${item.id}`,
            type: "maintenance",
            severity: "warning",
            title: `${item.name} por kilometraje`,
            message: `Excedido por ${Math.abs(kmUntil).toLocaleString()} km`,
          });
        } else if (kmUntil <= 200) {
          result.push({
            id: `maint-km-${item.id}`,
            type: "maintenance",
            severity: "info",
            title: `${item.name} pronto por km`,
            message: `Faltan ${kmUntil.toLocaleString()} km`,
          });
        }
      }
    }

    for (const goal of goals) {
      if (goal.isCompleted) continue;
      const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
      if (pct >= 100) {
        result.push({
          id: `goal-done-${goal.id}`,
          type: "goal",
          severity: "success",
          title: `Meta alcanzada`,
          message: `"${goal.title}" completada al 100%`,
        });
        continue;
      }
      if (goal.deadline) {
        const daysLeft = Math.ceil(
          (new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysLeft <= 0) {
          result.push({
            id: `goal-exp-${goal.id}`,
            type: "goal",
            severity: "warning",
            title: `Meta vencida`,
            message: `"${goal.title}" pasó su fecha límite`,
          });
        } else if (daysLeft <= 7) {
          result.push({
            id: `goal-warn-${goal.id}`,
            type: "goal",
            severity: "info",
            title: `Meta próxima a vencer`,
            message: `"${goal.title}" — ${daysLeft} días restantes (${pct}%)`,
          });
        }
      }
    }

    if (!todayEntry && activeVehicle) {
      const hour = now.getHours();
      if (hour >= 12) {
        result.push({
          id: "daily-close",
          type: "daily-close",
          severity: "info",
          title: "Cierra tu día",
          message: "Aún no has registrado el cierre de hoy",
        });
      }
    }

    return result;
  }, [maintenanceItems, goals, todayEntry, activeVehicle]);

  return { notifications, count: notifications.length };
}

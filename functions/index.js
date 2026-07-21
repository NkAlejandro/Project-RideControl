import { onSchedule } from "firebase-functions/v2/scheduler";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";
import { initializeApp } from "firebase-admin/app";

initializeApp();

const DAY_MS = 86400000;

async function getPushTokens(uid) {
  const snapshot = await getDatabase().ref(`pushTokens/${uid}`).once("value");
  const data = snapshot.val();
  if (!data) return [];
  return Object.values(data).map((entry) => entry.token).filter(Boolean);
}

function daysUntil(target) {
  const now = new Date();
  const t = new Date(target);
  return Math.floor((t.getTime() - now.getTime()) / DAY_MS);
}

function formatList(items) {
  if (items.length <= 2) return items.join(" y ");
  return items.slice(0, -1).join(", ") + " y " + items[items.length - 1];
}

export const checkNotifications = onSchedule("every 1 hours", async () => {
  const db = getDatabase();
  const pushTokensSnapshot = await db.ref("pushTokens").once("value");
  const allPushTokens = pushTokensSnapshot.val();
  if (!allPushTokens) return;

  const userIds = Object.keys(allPushTokens);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (const uid of userIds) {
    const tokens = await getPushTokens(uid);
    if (tokens.length === 0) continue;

    const syncSnapshot = await db.ref(`sync/${uid}`).once("value");
    const syncData = syncSnapshot.val();
    if (!syncData) continue;

    const messages = [];

    const vehicles = syncData.vehicles || [];
    const maintenanceItems = syncData.maintenanceItems || [];
    const goals = syncData.goals || [];
    const dailyEntries = syncData.dailyEntries || [];

    if (vehicles.length > 0) {
      const activeVehicle = vehicles.find((v) => v.isActive) || vehicles[0];
      const vehicleMaintenance = maintenanceItems.filter((m) => m.vehicleId === activeVehicle.id);

      const overdueNames = [];
      const dueSoonNames = [];
      for (const item of vehicleMaintenance) {
        const lastDate = new Date(item.lastDate).getTime();
        const daysSince = Math.floor((now.getTime() - lastDate) / DAY_MS);
        const daysLeft = item.intervalDays - daysSince;
        if (daysLeft <= 0) {
          overdueNames.push(item.name);
        } else if (daysLeft <= 3) {
          dueSoonNames.push(item.name);
        }
        if (item.intervalKm > 0 && item.lastKm > 0) {
          const kmSince = activeVehicle.mileage - item.lastKm;
          const kmLeft = item.intervalKm - kmSince;
          if (kmLeft <= 0 && !overdueNames.includes(item.name)) {
            overdueNames.push(item.name);
          } else if (kmLeft <= 200 && !dueSoonNames.includes(item.name)) {
            dueSoonNames.push(item.name);
          }
        }
      }
      if (overdueNames.length > 0) {
        messages.push({
          title: "Mantenimiento vencido",
          body: `${formatList(overdueNames)} necesita atención urgente`,
          tag: "maintenance-overdue",
        });
      }
      if (dueSoonNames.length > 0) {
        messages.push({
          title: "Mantenimiento próximo",
          body: `${formatList(dueSoonNames)} vence pronto`,
          tag: "maintenance-soon",
        });
      }
    }

    for (const goal of goals) {
      if (goal.isCompleted) continue;
      if (goal.currentAmount >= goal.targetAmount) {
        messages.push({
          title: "Meta completada",
          body: `¡Felicidades! Has alcanzado "${goal.title}"`,
          tag: `goal-completed-${goal.id}`,
        });
      }
      if (goal.deadline) {
        const left = daysUntil(goal.deadline);
        if (left <= 0) {
          messages.push({
            title: "Meta vencida",
            body: `"${goal.title}" debería estar completada`,
            tag: `goal-overdue-${goal.id}`,
          });
        } else if (left <= 3) {
          messages.push({
            title: "Meta por vencer",
            body: `"${goal.title}" vence en ${left} día${left !== 1 ? "s" : ""}`,
            tag: `goal-soon-${goal.id}`,
          });
        }
      }
    }

    if (now.getHours() >= 14) {
      const hasTodayEntry = dailyEntries.some((entry) => {
        const entryDate = new Date(entry.date).getTime();
        return entryDate >= todayStart && entryDate < todayStart + DAY_MS;
      });
      if (!hasTodayEntry) {
        messages.push({
          title: "Cierre del día pendiente",
          body: "Aún no has registrado el cierre de hoy",
          tag: "daily-close",
          data: { route: "/daily-close" },
        });
      }
    }

    if (messages.length === 0) continue;

    const fcmMessages = messages.flatMap((msg) =>
      tokens.map((token) => ({
        token,
        notification: { title: msg.title, body: msg.body },
        data: { tag: msg.tag, route: msg.data?.route || "/" },
        webpush: {
          fcmOptions: { link: msg.data?.route || "/" },
        },
      })),
    );

    for (const fcmMsg of fcmMessages) {
      try {
        await getMessaging().send(fcmMsg);
      } catch {
        if (fcmMsg.token) {
          const entries = Object.entries(allPushTokens[uid] || {});
          for (const [key, entry] of entries) {
            if (entry.token === fcmMsg.token) {
              await db.ref(`pushTokens/${uid}/${key}`).remove();
            }
          }
        }
      }
    }
  }
});

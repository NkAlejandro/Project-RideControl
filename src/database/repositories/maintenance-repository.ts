import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { MaintenanceItem } from "@/types";

export const maintenanceRepository = {
  async getAll(): Promise<MaintenanceItem[]> {
    return db.maintenanceItems.toArray();
  },

  async getByVehicle(vehicleId: string): Promise<MaintenanceItem[]> {
    return db.maintenanceItems
      .where("vehicleId")
      .equals(vehicleId)
      .toArray();
  },

  async create(data: Omit<MaintenanceItem, "id" | "createdAt" | "updatedAt">): Promise<MaintenanceItem> {
    const now = new Date();
    const item: MaintenanceItem = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.maintenanceItems.add(item);
    pushSync();
    return item;
  },

  async update(id: string, data: Partial<MaintenanceItem>): Promise<void> {
    await db.maintenanceItems.update(id, { ...data, updatedAt: new Date() });
    pushSync();
  },

  async delete(id: string): Promise<void> {
    await db.maintenanceItems.delete(id);
    pushSync();
  },

  async getUpcoming(vehicleId: string, currentKm: number): Promise<(MaintenanceItem & { kmRemaining: number; daysRemaining: number })[]> {
    const items = await this.getByVehicle(vehicleId);
    return items
      .map((item) => ({
        ...item,
        kmRemaining: Math.max(0, item.lastKm + item.intervalKm - currentKm),
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (item.lastDate.getTime() + item.intervalDays * 86400000 - Date.now()) / 86400000
          )
        ),
      }))
      .sort((a, b) => a.kmRemaining - b.kmRemaining);
  },

  async getNeedsAttention(vehicleId: string, currentKm: number): Promise<(MaintenanceItem & { overdue: boolean })[]> {
    const upcoming = await this.getUpcoming(vehicleId, currentKm);
    const threshold = 500;
    return upcoming
      .filter((item) => item.kmRemaining <= threshold || item.daysRemaining <= 7)
      .map((item) => ({
        ...item,
        overdue: item.kmRemaining === 0 || item.daysRemaining === 0,
      }));
  },
};

import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { DailyEntry } from "@/types";

export const dailyEntryRepository = {
  async getAll(): Promise<DailyEntry[]> {
    return db.dailyEntries.orderBy("date").reverse().toArray();
  },

  async getByDateRange(start: Date, end: Date): Promise<DailyEntry[]> {
    return db.dailyEntries
      .where("date")
      .between(start, end, true, true)
      .toArray();
  },

  async getByVehicle(vehicleId: string): Promise<DailyEntry[]> {
    return db.dailyEntries
      .where("vehicleId")
      .equals(vehicleId)
      .reverse()
      .sortBy("date");
  },

  async getToday(): Promise<DailyEntry | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return db.dailyEntries
      .where("date")
      .between(today, tomorrow, true, false)
      .first();
  },

  async create(data: Omit<DailyEntry, "id" | "createdAt" | "updatedAt">): Promise<DailyEntry> {
    const now = new Date();
    const entry: DailyEntry = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.dailyEntries.add(entry);
    pushSync();
    return entry;
  },

  async update(id: string, data: Partial<DailyEntry>): Promise<void> {
    await db.dailyEntries.update(id, { ...data, updatedAt: new Date() });
    pushSync();
  },

  async delete(id: string): Promise<void> {
    await db.dailyEntries.delete(id);
    pushSync();
  },

  async getStats(vehicleId: string, start: Date, end: Date) {
    const entries = await this.getByDateRange(start, end);
    const filtered = entries.filter((e) => e.vehicleId === vehicleId);
    
    return {
      totalEarnings: filtered.reduce((sum, e) => sum + e.earnings, 0),
      totalExpenses: filtered.reduce((sum, e) => sum + e.expenses + e.fuelCost, 0),
      totalKm: filtered.reduce((sum, e) => sum + e.kilometers, 0),
      totalFuelCost: filtered.reduce((sum, e) => sum + e.fuelCost, 0),
      totalHours: filtered.reduce((sum, e) => sum + (e.hoursWorked || 0), 0),
      count: filtered.length,
      avgEarnings: filtered.length ? filtered.reduce((s, e) => s + e.earnings, 0) / filtered.length : 0,
      avgKm: filtered.length ? filtered.reduce((s, e) => s + e.kilometers, 0) / filtered.length : 0,
    };
  },
};

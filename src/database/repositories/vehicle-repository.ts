import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { Vehicle } from "@/types";

export const vehicleRepository = {
  async getAll(): Promise<Vehicle[]> {
    return db.vehicles.toArray();
  },

  async getById(id: string): Promise<Vehicle | undefined> {
    return db.vehicles.get(id);
  },

  async getActive(): Promise<Vehicle | undefined> {
    return db.vehicles.where("isActive").equals(1).first();
  },

  async create(data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">): Promise<Vehicle> {
    const now = new Date();
    const vehicle: Vehicle = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.vehicles.add(vehicle);
    pushSync();
    return vehicle;
  },

  async update(id: string, data: Partial<Vehicle>): Promise<void> {
    await db.vehicles.update(id, { ...data, updatedAt: new Date() });
    pushSync();
  },

  async delete(id: string): Promise<void> {
    await db.vehicles.delete(id);
    pushSync();
  },

  async setActive(id: string): Promise<void> {
    const vehicles = await db.vehicles.toArray();
    for (const v of vehicles) {
      await db.vehicles.update(v.id, { isActive: v.id === id });
      pushSync();
    }
  },
};

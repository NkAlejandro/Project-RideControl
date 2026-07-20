import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { FuelRecord } from "@/types";

export const fuelRepository = {
  async getAll(): Promise<FuelRecord[]> {
    return db.fuelRecords.orderBy("date").reverse().toArray();
  },

  async getByVehicle(vehicleId: string): Promise<FuelRecord[]> {
    return db.fuelRecords
      .where("vehicleId")
      .equals(vehicleId)
      .reverse()
      .sortBy("date");
  },

  async create(data: Omit<FuelRecord, "id" | "createdAt">): Promise<FuelRecord> {
    const record: FuelRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    await db.fuelRecords.add(record);
    pushSync();
    return record;
  },

  async delete(id: string): Promise<void> {
    await db.fuelRecords.delete(id);
    pushSync();
  },

  async getConsumption(vehicleId: string): Promise<number> {
    const records = await this.getByVehicle(vehicleId);
    if (records.length < 2) return 0;
    
    let totalKm = 0;
    let totalLiters = 0;
    
    for (let i = 0; i < records.length - 1; i++) {
      totalKm += records[i].kilometers;
      totalLiters += records[i].amount;
    }
    
    return totalLiters > 0 ? totalKm / totalLiters : 0;
  },

  async getMonthlyCost(vehicleId: string, start: Date, end: Date): Promise<number> {
    const records = await this.getByVehicle(vehicleId);
    return records
      .filter((r) => r.date >= start && r.date <= end)
      .reduce((sum, r) => sum + r.cost, 0);
  },
};

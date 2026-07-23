import Dexie, { type EntityTable } from "dexie";
import type {
  Profile,
  Vehicle,
  DailyEntry,
  FuelRecord,
  MaintenanceItem,
  Wallet,
  Goal,
  AppSettings,
  Transaction,
  Budget,
  DistributionHistory,
} from "@/types";

const db = new Dexie("RideControlDB") as Dexie & {
  profiles: EntityTable<Profile, "id">;
  vehicles: EntityTable<Vehicle, "id">;
  dailyEntries: EntityTable<DailyEntry, "id">;
  fuelRecords: EntityTable<FuelRecord, "id">;
  maintenanceItems: EntityTable<MaintenanceItem, "id">;
  wallets: EntityTable<Wallet, "id">;
  goals: EntityTable<Goal, "id">;
  settings: EntityTable<AppSettings, "id">;
  transactions: EntityTable<Transaction, "id">;
  budgets: EntityTable<Budget, "id">;
  distributionHistory: EntityTable<DistributionHistory, "id">;
};

db.version(2).stores({
  profiles: "id, createdAt",
  vehicles: "id, profileId, isActive, createdAt",
  dailyEntries: "id, vehicleId, date, createdAt",
  fuelRecords: "id, vehicleId, date, createdAt",
  maintenanceItems: "id, vehicleId, type, createdAt",
  wallets: "id, profileId, type, isActive, createdAt",
  goals: "id, profileId, isCompleted, createdAt",
  settings: "id, profileId",
  transactions: "id, profileId, type, category, date, createdAt",
  budgets: "id, profileId, category, month, year",
  distributionHistory: "id, profileId, date, createdAt",
});

export { db };

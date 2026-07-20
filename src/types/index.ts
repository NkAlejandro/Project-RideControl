export interface Profile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  profileId: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  plate?: string;
  color?: string;
  mileage: number;
  fuelCapacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type VehicleType = "motorcycle" | "car" | "bicycle" | "truck" | "other";

export interface DailyEntry {
  id: string;
  vehicleId: string;
  date: Date;
  earnings: number;
  kilometers: number;
  fuelAmount: number;
  fuelCost: number;
  expenses: number;
  hoursWorked?: number;
  appsUsed: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: Date;
  amount: number;
  cost: number;
  pricePerLiter: number;
  kilometers: number;
  isFull: boolean;
  createdAt: Date;
}

export interface MaintenanceItem {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  name: string;
  lastKm: number;
  lastDate: Date;
  intervalKm: number;
  intervalDays: number;
  cost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MaintenanceType =
  | "oil"
  | "filter"
  | "chain"
  | "tires"
  | "brakes"
  | "kit"
  | "suspension"
  | "battery"
  | "soat"
  | "techmechanical"
  | "insurance"
  | "other";

export interface Wallet {
  id: string;
  profileId: string;
  name: string;
  type: WalletType;
  percentage: number;
  balance: number;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type WalletType = "vehicle" | "savings" | "investment" | "personal" | "other";

export interface Goal {
  id: string;
  profileId: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletDistribution {
  walletId: string;
  percentage: number;
}

export interface AppSettings {
  id: string;
  profileId: string;
  currency: string;
  language: string;
  theme: "light" | "dark" | "system";
  walletDistribution: WalletDistribution[];
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

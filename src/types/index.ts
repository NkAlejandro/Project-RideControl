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
  earningsByApp?: Record<string, number>;
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

export type WalletType = "moto" | "ahorro" | "inversiones" | "personales";

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

export interface Transaction {
  id: string;
  profileId: string;
  type: "income" | "expense";
  category: TransactionCategory;
  amount: number;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionCategory =
  | "trabajo"
  | "inversiones"
  | "comida"
  | "transporte"
  | "vivienda"
  | "servicios"
  | "entretenimiento"
  | "salud"
  | "educacion"
  | "compras"
  | "suscripciones"
  | "otros_ingresos"
  | "otros_gastos";

export const INCOME_CATEGORIES: TransactionCategory[] = ["trabajo", "inversiones", "otros_ingresos"];
export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  "comida", "transporte", "vivienda", "servicios",
  "entretenimiento", "salud", "educacion", "compras",
  "suscripciones", "otros_gastos",
];

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  trabajo: "Trabajo",
  inversiones: "Inversiones",
  otros_ingresos: "Otros ingresos",
  comida: "Comida y bebida",
  transporte: "Transporte",
  vivienda: "Vivienda",
  servicios: "Servicios",
  entretenimiento: "Entretenimiento",
  salud: "Salud",
  educacion: "Educación",
  compras: "Compras",
  suscripciones: "Suscripciones",
  otros_gastos: "Otros gastos",
};

export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  trabajo: "Briefcase",
  inversiones: "TrendingUp",
  otros_ingresos: "PlusCircle",
  comida: "UtensilsCrossed",
  transporte: "Car",
  vivienda: "Home",
  servicios: "Zap",
  entretenimiento: "Gamepad2",
  salud: "HeartPulse",
  educacion: "BookOpen",
  compras: "ShoppingBag",
  suscripciones: "Repeat",
  otros_gastos: "MoreHorizontal",
};

export interface Budget {
  id: string;
  profileId: string;
  category: TransactionCategory;
  monthlyLimit: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletDistribution {
  walletId: string;
  percentage: number;
}

export interface DistributionHistory {
  id: string;
  profileId: string;
  date: Date;
  earnings: number;
  fuelCost: number;
  expenses: number;
  netIncome: number;
  distribution: Record<WalletType, number>;
  createdAt: Date;
}

export interface AppSettings {
  id: string;
  profileId: string;
  currency: string;
  language: string;
  theme: "light" | "dark" | "system";
  walletDistribution: WalletDistribution[];
  onboardingCompleted: boolean;
  dailyGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

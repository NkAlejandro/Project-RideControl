import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional(),
});

export const vehicleSchema = z.object({
  type: z.enum(["motorcycle", "car", "bicycle", "truck", "other"]),
  brand: z.string().min(1, "La marca es requerida"),
  model: z.string().min(1, "El modelo es requerido"),
  year: z.number().min(1900, "Año inválido").max(2030, "Año inválido"),
  plate: z.string().optional(),
  color: z.string().optional(),
  mileage: z.number().min(0, "Kilometraje inválido"),
  fuelCapacity: z.number().min(1, "Capacidad inválida"),
  isActive: z.boolean().default(true),
});

const numOrZero = () => z.number().catch(0).pipe(z.number().min(0));

export const dailyEntrySchema = z.object({
  vehicleId: z.string().min(1),
  date: z.date(),
  earnings: numOrZero(),
  kilometers: numOrZero(),
  fuelAmount: numOrZero(),
  fuelCost: numOrZero(),
  expenses: numOrZero(),
  hoursWorked: z.preprocess((v) => (typeof v === "number" && isNaN(v) ? undefined : v), z.number().min(0).optional()),
  appsUsed: z.array(z.string()).default([]),
  earningsByApp: z.record(z.string(), z.number()).optional(),
  notes: z.string().optional(),
});

export const fuelRecordSchema = z.object({
  vehicleId: z.string().min(1),
  date: z.date(),
  amount: z.number().min(0.1, "Cantidad inválida"),
  cost: z.number().min(0, "Costo inválido"),
  pricePerLiter: z.number().min(0, "Precio inválido"),
  kilometers: z.number().min(0),
  isFull: z.boolean().default(true),
});

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  type: z.enum([
    "oil", "filter", "chain", "tires", "brakes",
    "kit", "suspension", "battery", "soat",
    "techmechanical", "insurance", "other",
  ]),
  name: z.string().min(1, "El nombre es requerido"),
  lastKm: z.number().min(0),
  lastDate: z.date(),
  intervalKm: z.number().min(1, "Intervalo de km inválido"),
  intervalDays: z.number().min(1, "Intervalo de días inválido"),
  cost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const walletSchema = z.object({
  profileId: z.string(),
  name: z.string().min(1, "El nombre es requerido"),
  type: z.enum(["vehicle", "savings", "investment", "personal", "other"]),
  percentage: z.number().min(0).max(100),
  balance: z.number().default(0),
  color: z.string().default("#3b82f6"),
  icon: z.string().default("wallet"),
  isActive: z.boolean().default(true),
});

export const goalSchema = z.object({
  profileId: z.string(),
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  targetAmount: z.number().min(1, "El monto debe ser mayor a 0"),
  currentAmount: z.number().default(0),
  deadline: z.date().optional(),
  isCompleted: z.boolean().default(false),
});

export const settingsSchema = z.object({
  profileId: z.string(),
  currency: z.string().default("COP"),
  language: z.string().default("es"),
  theme: z.enum(["light", "dark", "system"]).default("dark"),
  walletDistribution: z.array(
    z.object({
      walletId: z.string(),
      percentage: z.number().min(0).max(100),
    })
  ).default([]),
  onboardingCompleted: z.boolean().default(false),
});

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.enum([
    "trabajo", "inversiones", "otros_ingresos",
    "comida", "transporte", "vivienda", "servicios",
    "entretenimiento", "salud", "educacion", "compras",
    "suscripciones", "otros_gastos",
  ]),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  date: z.date(),
  description: z.string().min(1, "La descripción es requerida"),
});

export const budgetSchema = z.object({
  category: z.enum([
    "comida", "transporte", "vivienda", "servicios",
    "entretenimiento", "salud", "educacion", "compras",
    "suscripciones", "otros_gastos",
  ]),
  monthlyLimit: z.number().min(1, "El límite debe ser mayor a 0"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
export type VehicleFormData = z.infer<typeof vehicleSchema>;
export type DailyEntryFormData = z.infer<typeof dailyEntrySchema>;
export type FuelRecordFormData = z.infer<typeof fuelRecordSchema>;
export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;
export type WalletFormData = z.infer<typeof walletSchema>;
export type GoalFormData = z.infer<typeof goalSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;

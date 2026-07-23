export const WALLET_TYPES = ["moto", "ahorro", "inversiones", "personales"] as const;
export type WalletType = (typeof WALLET_TYPES)[number];

export const WALLET_LABELS: Record<WalletType, string> = {
  moto: "Moto",
  ahorro: "Ahorro",
  inversiones: "Inversiones",
  personales: "Personales",
};

export const WALLET_DESCRIPTIONS: Record<WalletType, string> = {
  moto: "Mantenimiento, SOAT, llantas, repuestos",
  ahorro: "Metas, emergencias, ahorro general",
  inversiones: "ETFs, acciones, negocios",
  personales: "Comida, ropa, entretenimiento",
};

export const WALLET_COLORS: Record<WalletType, string> = {
  moto: "#3b82f6",
  ahorro: "#22c55e",
  inversiones: "#f59e0b",
  personales: "#ef4444",
};

export const WALLET_ICONS: Record<WalletType, string> = {
  moto: "bike",
  ahorro: "piggy-bank",
  inversiones: "trending-up",
  personales: "smile",
};

export const DEFAULT_PERCENTAGES: Record<WalletType, number> = {
  moto: 30,
  ahorro: 40,
  inversiones: 20,
  personales: 10,
};

export interface DistributionResult {
  moto: number;
  ahorro: number;
  inversiones: number;
  personales: number;
}

export interface ProjectionResult {
  monthsRemaining: number;
  estimatedDate: Date;
  monthlyNeeded: number;
}

export interface ProfitabilityResult {
  netIncome: number;
  profitabilityPercent: number;
  costPerKm: number;
  earningsPerKm: number;
  earningsPerHour: number;
}

export interface PercentagesInput {
  moto: number;
  ahorro: number;
  inversiones: number;
  personales: number;
}

export class FinanceEngine {
  static distribute(earnings: number, pct: PercentagesInput): DistributionResult {
    return {
      moto: round(earnings * pct.moto / 100),
      ahorro: round(earnings * pct.ahorro / 100),
      inversiones: round(earnings * pct.inversiones / 100),
      personales: round(earnings * pct.personales / 100),
    };
  }

  static validatePercentages(pct: PercentagesInput): { valid: boolean; error?: string } {
    const values = [pct.moto, pct.ahorro, pct.inversiones, pct.personales];
    for (const v of values) {
      if (v < 0) return { valid: false, error: "Los porcentajes no pueden ser negativos" };
      if (v > 100) return { valid: false, error: "Ningún porcentaje puede superar 100%" };
    }
    const total = values.reduce((s, v) => s + v, 0);
    if (total !== 100) return { valid: false, error: `La suma debe ser exactamente 100% (actual: ${total}%)` };
    return { valid: true };
  }

  static toPercentagesInput(pct: Partial<PercentagesInput>): PercentagesInput {
    return {
      moto: pct.moto ?? DEFAULT_PERCENTAGES.moto,
      ahorro: pct.ahorro ?? DEFAULT_PERCENTAGES.ahorro,
      inversiones: pct.inversiones ?? DEFAULT_PERCENTAGES.inversiones,
      personales: pct.personales ?? DEFAULT_PERCENTAGES.personales,
    };
  }

  static calculateNetIncome(earnings: number, fuelCost: number, expenses: number): number {
    return earnings - fuelCost - expenses;
  }

  static calculateProfitability(earnings: number, fuelCost: number, expenses: number): ProfitabilityResult {
    const netIncome = this.calculateNetIncome(earnings, fuelCost, expenses);
    return {
      netIncome,
      profitabilityPercent: earnings > 0 ? round((netIncome / earnings) * 100) : 0,
      costPerKm: 0,
      earningsPerKm: 0,
      earningsPerHour: 0,
    };
  }

  static calculatePerKm(earnings: number, km: number): number {
    return km > 0 ? round(earnings / km) : 0;
  }

  static calculatePerHour(earnings: number, hours: number): number {
    return hours > 0 ? round(earnings / hours) : 0;
  }

  static calculateProjection(
    currentAmount: number,
    targetAmount: number,
    dailyAverage: number,
  ): ProjectionResult {
    const remaining = targetAmount - currentAmount;
    if (remaining <= 0) return { monthsRemaining: 0, estimatedDate: new Date(), monthlyNeeded: 0 };
    const monthlyAverage = dailyAverage * 30;
    const monthsRemaining = monthlyAverage > 0 ? Math.ceil(remaining / monthlyAverage) : Infinity;
    const estimatedDate = new Date();
    estimatedDate.setMonth(estimatedDate.getMonth() + monthsRemaining);
    return {
      monthsRemaining,
      estimatedDate,
      monthlyNeeded: round(remaining / (monthsRemaining || 1)),
    };
  }

  static calculateWalletAverages(walletBalances: Record<WalletType, number>): {
    total: number;
    distribution: Record<WalletType, number>;
  } {
    const total = Object.values(walletBalances).reduce((s, v) => s + v, 0);
    const distribution = {} as Record<WalletType, number>;
    for (const type of WALLET_TYPES) {
      distribution[type] = total > 0 ? round((walletBalances[type] / total) * 100) : 0;
    }
    return { total, distribution };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

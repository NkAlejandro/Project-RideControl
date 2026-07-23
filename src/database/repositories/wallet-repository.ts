import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import { FinanceEngine, type PercentagesInput, type DistributionResult } from "@/lib/finance-engine";
import type { Wallet } from "@/types";

function mapType(type: string): string {
  if (type === "vehicle") return "moto";
  if (type === "savings") return "ahorro";
  if (type === "investment") return "inversiones";
  if (type === "personal") return "personales";
  return type;
}

const LEGACY_MAP: Record<string, string> = {
  vehicle: "moto",
  savings: "ahorro",
  investment: "inversiones",
  personal: "personales",
};

export const walletRepository = {
  async getAll(): Promise<Wallet[]> {
    return db.wallets.toArray();
  },

  async getByProfile(profileId: string): Promise<Wallet[]> {
    const wallets = await db.wallets
      .where("profileId")
      .equals(profileId)
      .toArray();
    await this.migrateLegacyTypes(wallets);
    return db.wallets.where("profileId").equals(profileId).toArray();
  },

  async migrateLegacyTypes(wallets: Wallet[]): Promise<void> {
    for (const w of wallets) {
      const newType = LEGACY_MAP[w.type];
      if (newType && newType !== w.type) {
        await db.wallets.update(w.id, { type: newType as Wallet["type"], updatedAt: new Date() });
        pushSync();
      }
    }
  },

  async create(data: Omit<Wallet, "id" | "createdAt" | "updatedAt">): Promise<Wallet> {
    const now = new Date();
    const wallet: Wallet = {
      id: crypto.randomUUID(),
      ...data,
      type: mapType(data.type) as Wallet["type"],
      createdAt: now,
      updatedAt: now,
    };
    await db.wallets.add(wallet);
    pushSync();
    return wallet;
  },

  async update(id: string, data: Partial<Wallet>): Promise<void> {
    await db.wallets.update(id, { ...data, updatedAt: new Date() });
    pushSync();
  },

  async delete(id: string): Promise<void> {
    await db.wallets.delete(id);
    pushSync();
  },

  async ensureDefaults(profileId: string): Promise<Wallet[]> {
    let existing = await this.getByProfile(profileId);
    await this.migrateLegacyTypes(existing);
    existing = await db.wallets.where("profileId").equals(profileId).toArray();
    if (existing.length === 4) return existing;

    const defaults: Omit<Wallet, "id" | "createdAt" | "updatedAt">[] = [
      { profileId, name: "Moto", type: "moto", percentage: 30, balance: 0, color: "#3b82f6", icon: "bike", isActive: true },
      { profileId, name: "Ahorro", type: "ahorro", percentage: 40, balance: 0, color: "#22c55e", icon: "piggy-bank", isActive: true },
      { profileId, name: "Inversiones", type: "inversiones", percentage: 20, balance: 0, color: "#f59e0b", icon: "trending-up", isActive: true },
      { profileId, name: "Personales", type: "personales", percentage: 10, balance: 0, color: "#ef4444", icon: "smile", isActive: true },
    ];

    for (const w of defaults) {
      await this.create(w);
    }
    return this.getByProfile(profileId);
  },

  async distribute(
    profileId: string,
    amount: number,
    percentages?: PercentagesInput,
    fuelCost = 0,
    expenses = 0,
  ): Promise<{ wallets: Wallet[]; distribution: DistributionResult }> {
    let wallets = await this.getByProfile(profileId);
    if (wallets.length === 0) {
      wallets = await this.ensureDefaults(profileId);
    }

    const pct = percentages ?? this.extractPercentages(wallets);
    const result = FinanceEngine.distribute(amount, pct);

    for (const wallet of wallets) {
      const share = result[wallet.type as keyof typeof result] ?? 0;
      await db.wallets.update(wallet.id, {
        balance: wallet.balance + share,
        updatedAt: new Date(),
      });
    }

    await db.distributionHistory.add({
      id: crypto.randomUUID(),
      profileId,
      date: new Date(),
      earnings: amount,
      fuelCost,
      expenses,
      netIncome: FinanceEngine.calculateNetIncome(amount, fuelCost, expenses),
      distribution: { ...result },
      createdAt: new Date(),
    });

    pushSync();
    wallets = await this.getByProfile(profileId);
    return { wallets, distribution: result };
  },

  extractPercentages(wallets: Wallet[]): PercentagesInput {
    const pct: Partial<PercentagesInput> = {};
    for (const w of wallets) {
      (pct as Record<string, number>)[w.type] = w.percentage;
    }
    return FinanceEngine.toPercentagesInput(pct);
  },
};

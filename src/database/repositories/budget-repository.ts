import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { Budget } from "@/types";

export const budgetRepository = {
  async getAll(): Promise<Budget[]> {
    return db.budgets.toArray();
  },

  async getByProfile(profileId: string): Promise<Budget[]> {
    return db.budgets.where("profileId").equals(profileId).toArray();
  },

  async getByMonth(profileId: string, month: number, year: number): Promise<Budget[]> {
    return db.budgets
      .where("profileId").equals(profileId)
      .filter((b) => b.month === month && b.year === year)
      .toArray();
  },

  async upsert(data: Omit<Budget, "id" | "createdAt" | "updatedAt">): Promise<Budget> {
    const existing = await db.budgets
      .where("profileId").equals(data.profileId)
      .filter((b) => b.category === data.category && b.month === data.month && b.year === data.year)
      .first();
    const now = new Date();
    if (existing) {
      await db.budgets.update(existing.id, { monthlyLimit: data.monthlyLimit, updatedAt: now });
      pushSync();
      return { ...existing, monthlyLimit: data.monthlyLimit, updatedAt: now };
    }
    const budget: Budget = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    await db.budgets.add(budget);
    pushSync();
    return budget;
  },

  async delete(id: string): Promise<void> {
    await db.budgets.delete(id);
    pushSync();
  },
};

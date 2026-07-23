import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { Transaction } from "@/types";

export const transactionRepository = {
  async getAll(): Promise<Transaction[]> {
    return db.transactions.orderBy("date").reverse().toArray();
  },

  async getByProfile(profileId: string): Promise<Transaction[]> {
    return db.transactions
      .where("profileId").equals(profileId)
      .reverse()
      .sortBy("date");
  },

  async getByDateRange(profileId: string, start: Date, end: Date): Promise<Transaction[]> {
    return db.transactions
      .where("profileId").equals(profileId)
      .filter((t) => t.date >= start && t.date <= end)
      .reverse()
      .sortBy("date");
  },

  async create(data: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
    const now = new Date();
    const tx: Transaction = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    await db.transactions.add(tx);
    pushSync();
    return tx;
  },

  async update(id: string, data: Partial<Transaction>): Promise<void> {
    await db.transactions.update(id, { ...data, updatedAt: new Date() });
    pushSync();
  },

  async delete(id: string): Promise<void> {
    await db.transactions.delete(id);
    pushSync();
  },

  async getMonthlyTotals(profileId: string, month: number, year: number): Promise<{ income: number; expenses: number }> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const items = await this.getByDateRange(profileId, start, end);
    return {
      income: items.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expenses: items.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  },
};

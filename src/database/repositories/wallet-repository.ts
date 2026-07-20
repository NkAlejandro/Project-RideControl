import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { Wallet } from "@/types";

export const walletRepository = {
  async getAll(): Promise<Wallet[]> {
    return db.wallets.toArray();
  },

  async getByProfile(profileId: string): Promise<Wallet[]> {
    return db.wallets
      .where("profileId")
      .equals(profileId)
      .toArray();
  },

  async create(data: Omit<Wallet, "id" | "createdAt" | "updatedAt">): Promise<Wallet> {
    const now = new Date();
    const wallet: Wallet = {
      id: crypto.randomUUID(),
      ...data,
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

  async distribute(profileId: string, amount: number): Promise<Wallet[]> {
    const wallets = await this.getByProfile(profileId);
    for (const wallet of wallets) {
      const share = (amount * wallet.percentage) / 100;
      await db.wallets.update(wallet.id, {
        balance: wallet.balance + share,
        updatedAt: new Date(),
      });
      pushSync();
    }
    return this.getByProfile(profileId);
  },
};

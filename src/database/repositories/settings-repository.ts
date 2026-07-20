import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { AppSettings, WalletDistribution } from "@/types";

export const settingsRepository = {
  async get(profileId: string): Promise<AppSettings | undefined> {
    return db.settings.where("profileId").equals(profileId).first();
  },

  async create(data: Omit<AppSettings, "id" | "createdAt" | "updatedAt">): Promise<AppSettings> {
    const now = new Date();
    const settings: AppSettings = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.settings.add(settings);
    pushSync();
    return settings;
  },

  async update(id: string, data: Partial<AppSettings>): Promise<void> {
    await db.settings.update(id, { ...data, updatedAt: new Date() });
    pushSync();
  },

  async updateDistribution(profileId: string, distribution: WalletDistribution[]): Promise<void> {
    const settings = await this.get(profileId);
    if (settings) {
      await db.settings.update(settings.id, {
        walletDistribution: distribution,
        updatedAt: new Date(),
      });
      pushSync();
    }
  },
};

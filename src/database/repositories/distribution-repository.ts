import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { DistributionHistory } from "@/types";

export const distributionRepository = {
  async getByProfile(profileId: string): Promise<DistributionHistory[]> {
    return db.distributionHistory
      .where("profileId")
      .equals(profileId)
      .reverse()
      .sortBy("date");
  },

  async getByDateRange(profileId: string, from: Date, to: Date): Promise<DistributionHistory[]> {
    return db.distributionHistory
      .where(["profileId", "date"])
      .between([profileId, from], [profileId, to])
      .toArray();
  },

  async getLast(profileId: string): Promise<DistributionHistory | undefined> {
    const results = await db.distributionHistory
      .where("profileId")
      .equals(profileId)
      .reverse()
      .limit(1)
      .toArray();
    return results[0];
  },

  async create(data: Omit<DistributionHistory, "id" | "createdAt">): Promise<DistributionHistory> {
    const entry: DistributionHistory = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    await db.distributionHistory.add(entry);
    pushSync();
    return entry;
  },
};

import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { Profile } from "@/types";

export const profileRepository = {
  async get(): Promise<Profile | undefined> {
    return db.profiles.toCollection().first();
  },

  async create(data: Omit<Profile, "id" | "createdAt" | "updatedAt">): Promise<Profile> {
    const now = new Date();
    const profile: Profile = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.profiles.add(profile);
    pushSync();
    return profile;
  },

  async update(id: string, data: Partial<Profile>): Promise<void> {
    await db.profiles.update(id, { ...data, updatedAt: new Date() });
    pushSync();
  },
};

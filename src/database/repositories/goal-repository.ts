import { db } from "@/database/db";
import { pushSync } from "@/lib/firebase-sync";
import type { Goal } from "@/types";

export const goalRepository = {
  async getAll(): Promise<Goal[]> {
    return db.goals.toArray();
  },

  async getByProfile(profileId: string): Promise<Goal[]> {
    return db.goals
      .where("profileId")
      .equals(profileId)
      .toArray();
  },

  async getActive(profileId: string): Promise<Goal[]> {
    return db.goals
      .where("profileId")
      .equals(profileId)
      .filter((g) => !g.isCompleted)
      .toArray();
  },

  async create(data: Omit<Goal, "id" | "createdAt" | "updatedAt">): Promise<Goal> {
    const now = new Date();
    const goal: Goal = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.goals.add(goal);
    pushSync();
    return goal;
  },

  async update(id: string, data: Partial<Goal>): Promise<void> {
    await db.goals.update(id, { ...data, updatedAt: new Date() });
    pushSync();
  },

  async delete(id: string): Promise<void> {
    await db.goals.delete(id);
    pushSync();
  },

  async addToGoal(id: string, amount: number): Promise<Goal | undefined> {
    const goal = await db.goals.get(id);
    if (!goal) return undefined;
    const newAmount = goal.currentAmount + amount;
    const isCompleted = newAmount >= goal.targetAmount;
    await db.goals.update(id, {
      currentAmount: newAmount,
      isCompleted,
      updatedAt: new Date(),
    });
    pushSync();
    return db.goals.get(id);
  },
};

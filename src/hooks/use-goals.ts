import { useState, useEffect, useCallback } from "react";
import { goalRepository } from "@/database/repositories/goal-repository";
import { useAppStore } from "@/store/use-app-store";
import type { Goal } from "@/types";

export function useGoals() {
  const profile = useAppStore((s) => s.profile);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const all = await goalRepository.getByProfile(profile.id);
    setGoals(all);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (cancelled) return;
      await load();
    }
    void init();
    return () => { cancelled = true; };
  }, [load]);

  const create = useCallback(async (data: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
    const goal = await goalRepository.create(data);
    await load();
    return goal;
  }, [load]);

  const addToGoal = useCallback(async (id: string, amount: number) => {
    await goalRepository.addToGoal(id, amount);
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await goalRepository.delete(id);
    await load();
  }, [load]);

  return { goals, loading, create, addToGoal, remove, reload: load };
}

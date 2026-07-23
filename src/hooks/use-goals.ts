import { useEffect, useState } from "react";
import { goalRepository } from "@/database/repositories/goal-repository";
import { profileRepository } from "@/database/repositories/profile-repository";
import { useAppStore } from "@/store/use-app-store";
import type { Goal } from "@/types";

function getLocalProfileId(): string {
  try {
    return JSON.parse(localStorage.getItem("ridecontrol-storage") || "{}")?.state?.profile?.id ?? "";
  } catch {
    return "";
  }
}

export function useGoals() {
  const storeProfile = useAppStore((s) => s.profile);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => setLoading(false), 4000);

    (async () => {
      try {
        const profileId =
          storeProfile?.id ??
          (await profileRepository.get())?.id ??
          getLocalProfileId();

        if (!profileId) {
          clearTimeout(timer);
          setLoading(false);
          return;
        }
        const data = await goalRepository.getByProfile(profileId);
        clearTimeout(timer);
        setGoals(data);
        setLoading(false);
      } catch (err) {
        console.error("useGoals:", err);
        clearTimeout(timer);
        setLoading(false);
      }
    })();

    return () => clearTimeout(timer);
  }, [storeProfile]);

  const create = async (data: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
    const result = await goalRepository.create(data);
    setGoals((prev) => [...prev, result]);
    return result;
  };

  const addToGoal = async (id: string, amount: number) => {
    const updated = await goalRepository.addToGoal(id, amount);
    if (updated) {
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    }
  };

  const remove = async (id: string) => {
    await goalRepository.delete(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return { goals, loading, create, addToGoal, remove };
}

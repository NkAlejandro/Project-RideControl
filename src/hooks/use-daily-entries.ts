import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { dailyEntryRepository } from "@/database/repositories/daily-entry-repository";
import type { DailyEntry } from "@/types";

export function useDailyEntries(vehicleId?: string) {
  const result = useLiveQuery(
    async () => {
      const all = vehicleId
        ? await dailyEntryRepository.getByVehicle(vehicleId)
        : await dailyEntryRepository.getAll();
      const today = await dailyEntryRepository.getToday();
      return { entries: all, todayEntry: today ?? null };
    },
    [vehicleId]
  );

  const loading = !result;
  const entries = result?.entries ?? [];
  const todayEntry: DailyEntry | undefined = result?.todayEntry ?? undefined;

  const create = useCallback(async (data: Omit<DailyEntry, "id" | "createdAt" | "updatedAt">) => {
    return dailyEntryRepository.create(data);
  }, []);

  const updateEntry = useCallback(async (id: string, data: Partial<DailyEntry>) => {
    await dailyEntryRepository.update(id, data);
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    await dailyEntryRepository.delete(id);
  }, []);

  const getStats = useCallback(async (start: Date, end: Date) => {
    if (!vehicleId) return null;
    return dailyEntryRepository.getStats(vehicleId, start, end);
  }, [vehicleId]);

  return { entries, todayEntry, loading, create, update: updateEntry, remove: removeEntry, reload: () => {}, getStats };
}

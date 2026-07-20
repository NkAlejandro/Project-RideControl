import { useState, useEffect, useCallback } from "react";
import { dailyEntryRepository } from "@/database/repositories/daily-entry-repository";
import type { DailyEntry } from "@/types";

export function useDailyEntries(vehicleId?: string) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | undefined>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = vehicleId
      ? await dailyEntryRepository.getByVehicle(vehicleId)
      : await dailyEntryRepository.getAll();
    setEntries(all);
    const today = await dailyEntryRepository.getToday();
    setTodayEntry(today);
    setLoading(false);
  }, [vehicleId]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (cancelled) return;
      await load();
    }
    void init();
    return () => { cancelled = true; };
  }, [load]);

  const create = useCallback(async (data: Omit<DailyEntry, "id" | "createdAt" | "updatedAt">) => {
    const entry = await dailyEntryRepository.create(data);
    await load();
    return entry;
  }, [load]);

  const getStats = useCallback(async (start: Date, end: Date) => {
    if (!vehicleId) return null;
    return dailyEntryRepository.getStats(vehicleId, start, end);
  }, [vehicleId]);

  return { entries, todayEntry, loading, create, reload: load, getStats };
}

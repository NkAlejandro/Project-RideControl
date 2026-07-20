import { useState, useEffect, useCallback } from "react";
import { fuelRepository } from "@/database/repositories/fuel-repository";
import type { FuelRecord } from "@/types";

export function useFuel(vehicleId?: string) {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = vehicleId
      ? await fuelRepository.getByVehicle(vehicleId)
      : await fuelRepository.getAll();
    setRecords(all);
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

  const create = useCallback(async (data: Omit<FuelRecord, "id" | "createdAt">) => {
    const record = await fuelRepository.create(data);
    await load();
    return record;
  }, [load]);

  const getConsumption = useCallback(async () => {
    if (!vehicleId) return 0;
    return fuelRepository.getConsumption(vehicleId);
  }, [vehicleId]);

  return { records, loading, create, getConsumption, reload: load };
}

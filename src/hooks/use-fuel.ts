import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { fuelRepository } from "@/database/repositories/fuel-repository";
import type { FuelRecord } from "@/types";

export function useFuel(vehicleId?: string) {
  const records = useLiveQuery(
    () => vehicleId
      ? fuelRepository.getByVehicle(vehicleId)
      : fuelRepository.getAll(),
    [vehicleId],
    []
  );

  const create = useCallback(async (data: Omit<FuelRecord, "id" | "createdAt">) => {
    return fuelRepository.create(data);
  }, []);

  const getConsumption = useCallback(async () => {
    if (!vehicleId) return 0;
    return fuelRepository.getConsumption(vehicleId);
  }, [vehicleId]);

  const loading = records === undefined;

  return { records, loading, create, getConsumption, reload: () => {} };
}

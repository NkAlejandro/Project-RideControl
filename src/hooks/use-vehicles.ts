import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { vehicleRepository } from "@/database/repositories/vehicle-repository";
import type { Vehicle } from "@/types";

export function useVehicles() {
  const vehicles = useLiveQuery(() => vehicleRepository.getAll(), [], []);

  const activeVehicle = useMemo(
    () => vehicles?.find((v) => v.isActive) ?? null,
    [vehicles]
  );

  const create = useCallback(async (data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">) => {
    const vehicle = await vehicleRepository.create(data);
    if (vehicle.isActive) {
      await vehicleRepository.setActive(vehicle.id);
    }
    return vehicle;
  }, []);

  const update = useCallback(async (id: string, data: Partial<Vehicle>) => {
    await vehicleRepository.update(id, data);
  }, []);

  const remove = useCallback(async (id: string) => {
    await vehicleRepository.delete(id);
  }, []);

  const setActive = useCallback(async (id: string) => {
    await vehicleRepository.setActive(id);
  }, []);

  const loading = vehicles === undefined;

  return { vehicles, activeVehicle, loading, create, update, remove, setActive, reload: () => {} };
}

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { maintenanceRepository } from "@/database/repositories/maintenance-repository";
import type { MaintenanceItem } from "@/types";

export function useMaintenance(vehicleId?: string) {
  const items = useLiveQuery(
    () => vehicleId
      ? maintenanceRepository.getByVehicle(vehicleId)
      : maintenanceRepository.getAll(),
    [vehicleId],
    []
  );

  const create = useCallback(async (data: Omit<MaintenanceItem, "id" | "createdAt" | "updatedAt">) => {
    return maintenanceRepository.create(data);
  }, []);

  const update = useCallback(async (id: string, data: Partial<MaintenanceItem>) => {
    await maintenanceRepository.update(id, data);
  }, []);

  const remove = useCallback(async (id: string) => {
    await maintenanceRepository.delete(id);
  }, []);

  const loading = items === undefined;

  return { items, loading, create, update, remove, reload: () => {} };
}

import { useState, useEffect, useCallback } from "react";
import { maintenanceRepository } from "@/database/repositories/maintenance-repository";
import type { MaintenanceItem } from "@/types";

export function useMaintenance(vehicleId?: string) {
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = vehicleId
      ? await maintenanceRepository.getByVehicle(vehicleId)
      : await maintenanceRepository.getAll();
    setItems(all);
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

  const create = useCallback(async (data: Omit<MaintenanceItem, "id" | "createdAt" | "updatedAt">) => {
    const item = await maintenanceRepository.create(data);
    await load();
    return item;
  }, [load]);

  const update = useCallback(async (id: string, data: Partial<MaintenanceItem>) => {
    await maintenanceRepository.update(id, data);
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await maintenanceRepository.delete(id);
    await load();
  }, [load]);

  return { items, loading, create, update, remove, reload: load };
}

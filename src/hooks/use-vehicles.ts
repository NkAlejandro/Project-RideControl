import { useState, useEffect, useCallback } from "react";
import { vehicleRepository } from "@/database/repositories/vehicle-repository";
import type { Vehicle } from "@/types";

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await vehicleRepository.getAll();
    setVehicles(all);
    const active = all.find((v) => v.isActive) || null;
    setActiveVehicle(active);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (cancelled) return;
      await load();
    }
    void init();
    return () => { cancelled = true; };
  }, [load]);

  const create = useCallback(async (data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">) => {
    const vehicle = await vehicleRepository.create(data);
    if (vehicle.isActive) {
      await vehicleRepository.setActive(vehicle.id);
    }
    await load();
    return vehicle;
  }, [load]);

  const update = useCallback(async (id: string, data: Partial<Vehicle>) => {
    await vehicleRepository.update(id, data);
    await load();
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await vehicleRepository.delete(id);
    await load();
  }, [load]);

  const setActive = useCallback(async (id: string) => {
    await vehicleRepository.setActive(id);
    await load();
  }, [load]);

  return { vehicles, activeVehicle, loading, create, update, remove, setActive, reload: load };
}

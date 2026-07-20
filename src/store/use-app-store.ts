import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Vehicle, Profile, AppSettings } from "@/types";

interface AppState {
  profile: Profile | null;
  vehicles: Vehicle[];
  activeVehicleId: string | null;
  settings: AppSettings | null;
  isOnboarded: boolean;

  setProfile: (profile: Profile) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  addVehicle: (vehicle: Vehicle) => void;
  setActiveVehicle: (id: string) => void;
  setSettings: (settings: AppSettings) => void;
  setOnboarded: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  profile: null,
  vehicles: [],
  activeVehicleId: null,
  settings: null,
  isOnboarded: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setProfile: (profile) => set({ profile }),

      setVehicles: (vehicles) => set({ vehicles }),

      addVehicle: (vehicle) =>
        set((state) => ({ vehicles: [...state.vehicles, vehicle] })),

      setActiveVehicle: (id) => set({ activeVehicleId: id }),

      setSettings: (settings) => set({ settings }),

      setOnboarded: (value) => set({ isOnboarded: value }),

      reset: () => set(initialState),
    }),
    {
      name: "ridecontrol-storage",
      partialize: (state) => ({
        profile: state.profile,
        vehicles: state.vehicles,
        activeVehicleId: state.activeVehicleId,
        settings: state.settings,
        isOnboarded: state.isOnboarded,
      }),
    },
  ),
);

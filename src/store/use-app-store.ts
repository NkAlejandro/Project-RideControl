import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Vehicle, Profile, AppSettings } from "@/types";

export type CurrencyCode =
  | "COP" | "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD"
  | "MXN" | "BRL" | "ARS" | "CLP" | "PEN" | "CNY";

export const currencies: { code: CurrencyCode; label: string; symbol: string; flag: string }[] = [
  { code: "COP", label: "Peso Colombiano", symbol: "$", flag: "🇨🇴" },
  { code: "USD", label: "Dólar Estadounidense", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", label: "Libra Esterlina", symbol: "£", flag: "🇬🇧" },
  { code: "MXN", label: "Peso Mexicano", symbol: "$", flag: "🇲🇽" },
  { code: "BRL", label: "Real Brasileño", symbol: "R$", flag: "🇧🇷" },
  { code: "ARS", label: "Peso Argentino", symbol: "$", flag: "🇦🇷" },
  { code: "CLP", label: "Peso Chileno", symbol: "$", flag: "🇨🇱" },
  { code: "PEN", label: "Sol Peruano", symbol: "S/", flag: "🇵🇪" },
  { code: "JPY", label: "Yen Japonés", symbol: "¥", flag: "🇯🇵" },
  { code: "CNY", label: "Yuan Chino", symbol: "¥", flag: "🇨🇳" },
  { code: "CAD", label: "Dólar Canadiense", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", label: "Dólar Australiano", symbol: "A$", flag: "🇦🇺" },
];

interface AppState {
  profile: Profile | null;
  vehicles: Vehicle[];
  activeVehicleId: string | null;
  settings: AppSettings | null;
  isOnboarded: boolean;
  selectedCurrency: CurrencyCode;

  setProfile: (profile: Profile) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  addVehicle: (vehicle: Vehicle) => void;
  setActiveVehicle: (id: string) => void;
  setSettings: (settings: AppSettings) => void;
  setOnboarded: (value: boolean) => void;
  setSelectedCurrency: (currency: CurrencyCode) => void;
  reset: () => void;
}

const initialState = {
  profile: null,
  vehicles: [],
  activeVehicleId: null,
  settings: null,
  isOnboarded: false,
  selectedCurrency: "COP" as const,
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

      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),

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
        selectedCurrency: state.selectedCurrency,
      }),
    },
  ),
);

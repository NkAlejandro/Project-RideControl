import { useCallback, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { walletRepository } from "@/database/repositories/wallet-repository";
import { useAppStore } from "@/store/use-app-store";
import type { Wallet } from "@/types";

export function useWallets() {
  const profile = useAppStore((s) => s.profile);

  const wallets = useLiveQuery(
    () => profile ? walletRepository.getByProfile(profile.id) : Promise.resolve([]),
    [profile],
    []
  );

  useEffect(() => {
    if (profile && wallets && wallets.length === 0) {
      walletRepository.ensureDefaults(profile.id);
    }
  }, [profile, wallets]);

  const create = useCallback(async (data: Omit<Wallet, "id" | "createdAt" | "updatedAt">) => {
    return walletRepository.create(data);
  }, []);

  const update = useCallback(async (id: string, data: Partial<Wallet>) => {
    await walletRepository.update(id, data);
  }, []);

  const distribute = useCallback(async (amount: number, fuelCost = 0, expenses = 0) => {
    if (!profile) return;
    await walletRepository.distribute(profile.id, amount, undefined, fuelCost, expenses);
  }, [profile]);

  const loading = wallets === undefined;

  return { wallets, loading, create, update, distribute, reload: () => {} };
}

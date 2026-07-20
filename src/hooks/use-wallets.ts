import { useState, useEffect, useCallback } from "react";
import { walletRepository } from "@/database/repositories/wallet-repository";
import { useAppStore } from "@/store/use-app-store";
import type { Wallet } from "@/types";

export function useWallets() {
  const profile = useAppStore((s) => s.profile);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const all = await walletRepository.getByProfile(profile.id);
    setWallets(all);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (cancelled) return;
      await load();
    }
    void init();
    return () => { cancelled = true; };
  }, [load]);

  const create = useCallback(async (data: Omit<Wallet, "id" | "createdAt" | "updatedAt">) => {
    const wallet = await walletRepository.create(data);
    await load();
    return wallet;
  }, [load]);

  const update = useCallback(async (id: string, data: Partial<Wallet>) => {
    await walletRepository.update(id, data);
    await load();
  }, [load]);

  const distribute = useCallback(async (amount: number) => {
    if (!profile) return;
    const updated = await walletRepository.distribute(profile.id, amount);
    setWallets(updated);
  }, [profile]);

  return { wallets, loading, create, update, distribute, reload: load };
}

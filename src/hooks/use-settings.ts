import { useState, useEffect, useCallback } from "react";
import { settingsRepository } from "@/database/repositories/settings-repository";
import { useAppStore } from "@/store/use-app-store";
import type { AppSettings } from "@/types";

export function useSettings() {
  const profile = useAppStore((s) => s.profile);
  const [settings, setSettings] = useState<AppSettings | undefined>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) {
      setSettings(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    const s = await settingsRepository.get(profile.id);
    setSettings(s);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => { cancelled = true; };
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("db-synced", handler);
    return () => window.removeEventListener("db-synced", handler);
  }, [load]);

  const update = useCallback(async (data: Partial<AppSettings>) => {
    const profile = useAppStore.getState().profile;
    if (!profile) return;
    const s = await settingsRepository.get(profile.id);
    if (!s) return;
    await settingsRepository.update(s.id, data);
    setSettings({ ...s, ...data, updatedAt: new Date() });
  }, []);

  return { settings, loading, update, reload: load };
}

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
    async function init() {
      if (cancelled) return;
      await load();
    }
    void init();
    return () => { cancelled = true; };
  }, [load]);

  const update = useCallback(async (data: Partial<AppSettings>) => {
    if (!settings) return;
    await settingsRepository.update(settings.id, data);
    await load();
  }, [settings, load]);

  return { settings, loading, update, reload: load };
}

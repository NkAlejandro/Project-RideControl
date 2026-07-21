import { useCallback } from "react";
import * as sounds from "./sounds";

function areSoundsEnabled(): boolean {
  return localStorage.getItem("rc_sounds_enabled") !== "false";
}

export function useSounds() {
  const play = useCallback(<T extends keyof typeof sounds>(name: T) => {
    if (!areSoundsEnabled()) return;
    const fn = sounds[name] as () => void;
    fn();
  }, []);

  return { play, enabled: areSoundsEnabled() };
}

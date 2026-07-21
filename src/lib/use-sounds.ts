import { useCallback, useRef } from "react";
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

export function useHoverSound() {
  const timers = useRef<Record<string, number>>({});

  const hover = useCallback((type: "tap" | "nav" | "card") => {
    if (!areSoundsEnabled()) return;
    const now = Date.now();
    const key = `hover_${type}`;
    if (now - (timers.current[key] ?? 0) < 80) return;
    timers.current[key] = now;
    if (type === "tap") sounds.playHoverTap();
    else if (type === "nav") sounds.playHoverNav();
    else sounds.playHoverCard();
  }, []);

  return { hover };
}

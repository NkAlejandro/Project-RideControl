import { useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";

function applyTheme(theme: "light" | "dark" | "system") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
  } else {
    root.classList.add(theme);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useAppStore((s) => s.settings);

  useEffect(() => {
    applyTheme(settings?.theme ?? "dark");
  }, [settings?.theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (settings?.theme === "system") {
        applyTheme("system");
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [settings?.theme]);

  return <>{children}</>;
}

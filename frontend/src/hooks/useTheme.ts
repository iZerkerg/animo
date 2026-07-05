import { useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "animo_theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  }

  return mode;
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => resolveTheme("system"));

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);

    function updateSystemTheme(event: MediaQueryListEvent | MediaQueryList) {
      setSystemTheme(event.matches ? "dark" : "light");
    }

    updateSystemTheme(media);
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  const resolvedTheme = useMemo<ResolvedTheme>(() => (mode === "system" ? systemTheme : mode), [mode, systemTheme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [mode, resolvedTheme]);

  return { mode, resolvedTheme, setMode };
}

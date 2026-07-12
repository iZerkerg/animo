import { useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type ColorTheme = "rose" | "red" | "blue" | "green" | "sun";

const APPEARANCE_STORAGE_KEY = "animo_theme";
const COLOR_THEME_STORAGE_KEY = "animo_color_theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function getStoredColorTheme(): ColorTheme {
  const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
  return stored === "red" || stored === "blue" || stored === "green" || stored === "sun" || stored === "rose" ? stored : "blue";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  }

  return mode;
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme());
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => getStoredColorTheme());
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
    localStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.appearance = mode;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [mode, resolvedTheme]);

  useEffect(() => {
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
    document.documentElement.dataset.colorTheme = colorTheme;
  }, [colorTheme]);

  return { colorTheme, mode, resolvedTheme, setColorTheme, setMode };
}

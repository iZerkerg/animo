import { Monitor, Moon, Sun } from "lucide-react";
import type { ThemeMode } from "../hooks/useTheme";

type Props = {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  compact?: boolean;
};

const options: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor }
];

export function ThemeToggle({ mode, onChange, compact = false }: Props) {
  return (
    <div className={compact ? "theme-toggle compact-toggle" : "theme-toggle"} aria-label="Selector de modo oscuro">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            aria-pressed={mode === option.value}
            className={mode === option.value ? "theme-option active" : "theme-option"}
            key={option.value}
            onClick={() => onChange(option.value)}
            title={`Modo ${option.label.toLowerCase()}`}
            type="button"
          >
            <Icon size={16} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

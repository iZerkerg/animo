import { ArrowLeft, Check, Palette } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";
import { uiText } from "../constants/text";
import type { ColorTheme, ThemeMode } from "../hooks/useTheme";

type Props = {
  colorTheme: ColorTheme;
  themeMode: ThemeMode;
  onBackToProfile: () => void;
  onColorThemeChange: (theme: ColorTheme) => void;
  onThemeChange: (mode: ThemeMode) => void;
};

const colorThemeOptions: Array<{ value: ColorTheme; colors: [string, string, string] }> = [
  { value: "rose", colors: ["#e66f9e", "#f8e8ef", "#8ed2bd"] },
  { value: "red", colors: ["#df6b6f", "#ffe9e8", "#efb0a3"] },
  { value: "blue", colors: ["#5f92d6", "#e8f2ff", "#8fc9d1"] },
  { value: "green", colors: ["#5aa982", "#e8f7ef", "#a9d88f"] },
  { value: "sun", colors: ["#e49a3a", "#fff4c7", "#f4c95d"] }
];

export function SettingsPage({ colorTheme, onBackToProfile, onColorThemeChange, onThemeChange, themeMode }: Props) {
  return (
    <div className="settings-layout">
      <aside className="panel settings-nav" aria-label="Categorías de configuración">
        <button className="text-action settings-back" type="button" onClick={onBackToProfile}>
          <ArrowLeft size={17} />
          {uiText.settings.backToProfile}
        </button>
        <button className="settings-category active" type="button" aria-current="page">
          <Palette size={18} />
          {uiText.settings.visual}
        </button>
      </aside>

      <section className="settings-content">
        <div className="panel settings-section">
          <div>
            <div className="section-title settings-section-title">
              <span>{uiText.settings.themes}</span>
            </div>
            <p className="status-text">{uiText.settings.themesDescription}</p>
          </div>
          <div className="color-theme-grid" role="radiogroup" aria-label={uiText.settings.themes}>
            {colorThemeOptions.map((option) => {
              const selected = option.value === colorTheme;
              return (
                <button
                  aria-checked={selected}
                  className={selected ? "color-theme-card selected" : "color-theme-card"}
                  key={option.value}
                  role="radio"
                  type="button"
                  onClick={() => onColorThemeChange(option.value)}
                >
                  <span className="theme-swatch" aria-hidden="true">
                    {option.colors.map((color) => (
                      <span key={color} style={{ background: color }} />
                    ))}
                  </span>
                  <span>{uiText.settings.colorThemes[option.value]}</span>
                  {selected && <Check size={17} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel settings-section">
          <div>
            <div className="section-title settings-section-title">
              <span>{uiText.settings.appearance}</span>
            </div>
            <p className="status-text">{uiText.settings.appearanceDescription}</p>
          </div>
          <ThemeToggle mode={themeMode} onChange={onThemeChange} />
        </div>
      </section>
    </div>
  );
}

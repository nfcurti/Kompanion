"use client";

import * as React from "react";

import {
  applyAppearance,
  DEFAULT_APPEARANCE,
  parseAppearance,
  shuffleAppearance,
  THEME_STORAGE_KEY,
  type AppearanceConfig,
} from "@/lib/shadcn-themes";
import {
  isRadiusLocked,
  resolveAppearanceMode,
  type BackgroundName,
  type BaseColorName,
  type FontHeadingName,
  type FontName,
  type PaletteName,
  type RadiusName,
  type StyleName,
  type ThemeTokenName,
} from "@/lib/shadcn-presets";

type ThemeConfigContextValue = AppearanceConfig & {
  mode: "light" | "dark";
  setStyle: (style: StyleName) => void;
  setBase: (base: BaseColorName) => void;
  setPalette: (palette: PaletteName) => void;
  setBackground: (background: BackgroundName) => void;
  setFont: (font: FontName) => void;
  setFontHeading: (fontHeading: FontHeadingName) => void;
  setRadius: (radius: RadiusName) => void;
  setChartColor: (chartColor: ThemeTokenName) => void;
  shuffle: () => void;
  reset: () => void;
};

const ThemeConfigContext = React.createContext<ThemeConfigContextValue | null>(
  null,
);

function persist(next: AppearanceConfig) {
  const mode = resolveAppearanceMode(next.background);
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
  localStorage.setItem("theme", mode);
  applyAppearance(next);
}

export function ThemeConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = React.useState<AppearanceConfig>(DEFAULT_APPEARANCE);

  React.useEffect(() => {
    const next = parseAppearance(localStorage.getItem(THEME_STORAGE_KEY));
    setConfig(next);
    persist(next);
  }, []);

  React.useEffect(() => {
    if (config.background !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => persist(config);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [config]);

  const update = React.useCallback((patch: Partial<AppearanceConfig>) => {
    setConfig((current) => {
      const next = { ...current, ...patch };
      if (isRadiusLocked(next.style)) {
        next.radius = "none";
      }
      persist(next);
      return next;
    });
  }, []);

  const value = React.useMemo<ThemeConfigContextValue>(
    () => ({
      ...config,
      mode: resolveAppearanceMode(config.background),
      setStyle: (style) => update({ style }),
      setBase: (base) => update({ base }),
      setPalette: (palette) => update({ palette }),
      setBackground: (background) => update({ background }),
      setFont: (font) => update({ font }),
      setFontHeading: (fontHeading) => update({ fontHeading }),
      setRadius: (radius) => update({ radius }),
      setChartColor: (chartColor) => update({ chartColor }),
      shuffle: () => {
        setConfig((current) => {
          const next = shuffleAppearance(current);
          persist(next);
          return next;
        });
      },
      reset: () => {
        persist(DEFAULT_APPEARANCE);
        setConfig(DEFAULT_APPEARANCE);
      },
    }),
    [config, update],
  );

  return (
    <ThemeConfigContext.Provider value={value}>
      {children}
    </ThemeConfigContext.Provider>
  );
}

export function useThemeConfig() {
  const context = React.useContext(ThemeConfigContext);
  if (!context) {
    throw new Error("useThemeConfig must be used within ThemeConfigProvider");
  }
  return context;
}

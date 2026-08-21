import { THEME_TOKENS } from "@/lib/shadcn-theme-tokens";
import {
  DEFAULT_BACKGROUND_NAME,
  DEFAULT_BASE_NAME,
  DEFAULT_CHART_COLOR_NAME,
  DEFAULT_FONT_HEADING_NAME,
  DEFAULT_FONT_NAME,
  DEFAULT_PALETTE_NAME,
  DEFAULT_RADIUS_NAME,
  DEFAULT_STYLE_NAME,
  BACKGROUND_OPTIONS,
  FONT_OPTIONS,
  fontFamilyValue,
  fontFromStyle,
  getFontOption,
  getPalettePreset,
  getStylePreset,
  GRAYSCALE_THEMES,
  headingFromStyle,
  isBackgroundColorName,
  isBackgroundName,
  getContrastSurfaces,
  resolveSurfaceTint,
  isBaseColorName,
  isFontHeadingName,
  isFontName,
  isPaletteName,
  isRadiusLocked,
  isRadiusName,
  isStyleName,
  isThemeTokenName,
  pickRandom,
  PRESET_FONT_STACK,
  PRESET_MONO_STACK,
  RADIUS_OPTIONS,
  resolveAppearanceMode,
  STYLE_PRESETS,
  BASE_COLOR_PRESETS,
  THEME_OPTIONS,
  type BackgroundName,
  type BaseColorName,
  type FontHeadingName,
  type FontName,
  type PaletteName,
  type RadiusName,
  type StyleName,
  type ThemeTokenName,
} from "@/lib/shadcn-presets";

export const THEME_STORAGE_KEY = "kompanion.appearance";

export const BASE_THEME_NAMES = [
  "neutral",
  "stone",
  "zinc",
  "mauve",
  "olive",
  "mist",
  "taupe",
] as const;

export const COLOR_THEME_NAMES = [
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "green",
  "indigo",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "teal",
  "violet",
  "yellow",
] as const;

export type BaseThemeName = (typeof BASE_THEME_NAMES)[number];
export type ColorThemeName = (typeof COLOR_THEME_NAMES)[number];
export type ThemeName = BaseThemeName | ColorThemeName;

export const RADII = RADIUS_OPTIONS;
export const DEFAULT_THEME: ThemeName = "neutral";
export const DEFAULT_RADIUS: RadiusName = DEFAULT_RADIUS_NAME;

export type ShadcnTheme = {
  name: ThemeName;
  title: string;
  group: "base" | "color";
  swatch: string;
};

export const SHADCN_THEMES: ShadcnTheme[] = [
  {
    "name": "neutral",
    "title": "Neutral",
    "group": "base",
    "swatch": "oklch(0.205 0 0)"
  },
  {
    "name": "stone",
    "title": "Stone",
    "group": "base",
    "swatch": "oklch(0.216 0.006 56.043)"
  },
  {
    "name": "zinc",
    "title": "Zinc",
    "group": "base",
    "swatch": "oklch(0.21 0.006 285.885)"
  },
  {
    "name": "mauve",
    "title": "Mauve",
    "group": "base",
    "swatch": "oklch(0.212 0.019 322.12)"
  },
  {
    "name": "olive",
    "title": "Olive",
    "group": "base",
    "swatch": "oklch(0.228 0.013 107.4)"
  },
  {
    "name": "mist",
    "title": "Mist",
    "group": "base",
    "swatch": "oklch(0.218 0.008 223.9)"
  },
  {
    "name": "taupe",
    "title": "Taupe",
    "group": "base",
    "swatch": "oklch(0.214 0.009 43.1)"
  },
  {
    "name": "amber",
    "title": "Amber",
    "group": "color",
    "swatch": "oklch(0.555 0.163 48.998)"
  },
  {
    "name": "blue",
    "title": "Blue",
    "group": "color",
    "swatch": "oklch(0.488 0.243 264.376)"
  },
  {
    "name": "cyan",
    "title": "Cyan",
    "group": "color",
    "swatch": "oklch(0.52 0.105 223.128)"
  },
  {
    "name": "emerald",
    "title": "Emerald",
    "group": "color",
    "swatch": "oklch(0.508 0.118 165.612)"
  },
  {
    "name": "fuchsia",
    "title": "Fuchsia",
    "group": "color",
    "swatch": "oklch(0.518 0.253 323.949)"
  },
  {
    "name": "green",
    "title": "Green",
    "group": "color",
    "swatch": "oklch(0.527 0.154 150.069)"
  },
  {
    "name": "indigo",
    "title": "Indigo",
    "group": "color",
    "swatch": "oklch(0.457 0.24 277.023)"
  },
  {
    "name": "lime",
    "title": "Lime",
    "group": "color",
    "swatch": "oklch(0.841 0.238 128.85)"
  },
  {
    "name": "orange",
    "title": "Orange",
    "group": "color",
    "swatch": "oklch(0.553 0.195 38.402)"
  },
  {
    "name": "pink",
    "title": "Pink",
    "group": "color",
    "swatch": "oklch(0.525 0.223 3.958)"
  },
  {
    "name": "purple",
    "title": "Purple",
    "group": "color",
    "swatch": "oklch(0.496 0.265 301.924)"
  },
  {
    "name": "red",
    "title": "Red",
    "group": "color",
    "swatch": "oklch(0.505 0.213 27.518)"
  },
  {
    "name": "rose",
    "title": "Rose",
    "group": "color",
    "swatch": "oklch(0.514 0.222 16.935)"
  },
  {
    "name": "sky",
    "title": "Sky",
    "group": "color",
    "swatch": "oklch(0.5 0.134 242.749)"
  },
  {
    "name": "teal",
    "title": "Teal",
    "group": "color",
    "swatch": "oklch(0.511 0.096 186.391)"
  },
  {
    "name": "violet",
    "title": "Violet",
    "group": "color",
    "swatch": "oklch(0.491 0.27 292.581)"
  },
  {
    "name": "yellow",
    "title": "Yellow",
    "group": "color",
    "swatch": "oklch(0.852 0.199 91.936)"
  }
] as const;

export type AppearanceConfig = {
  style: StyleName;
  base: BaseColorName;
  palette: PaletteName;
  background: BackgroundName;
  font: FontName;
  fontHeading: FontHeadingName;
  radius: RadiusName;
  chartColor: ThemeTokenName;
};

export const DEFAULT_APPEARANCE: AppearanceConfig = {
  style: DEFAULT_STYLE_NAME,
  base: DEFAULT_BASE_NAME,
  palette: DEFAULT_PALETTE_NAME,
  background: DEFAULT_BACKGROUND_NAME,
  font: DEFAULT_FONT_NAME,
  fontHeading: DEFAULT_FONT_HEADING_NAME,
  radius: DEFAULT_RADIUS_NAME,
  chartColor: DEFAULT_CHART_COLOR_NAME,
};

export function isThemeName(value: string): value is ThemeName {
  return SHADCN_THEMES.some((theme) => theme.name === value);
}

export function isBaseThemeName(value: string): value is BaseThemeName {
  return (BASE_THEME_NAMES as readonly string[]).includes(value);
}

export function isColorThemeName(value: string): value is ColorThemeName {
  return (COLOR_THEME_NAMES as readonly string[]).includes(value);
}

export function getRadiusValue(name: RadiusName) {
  return (
    RADIUS_OPTIONS.find((radius) => radius.name === name)?.value ?? "0.625rem"
  );
}

const LEGACY_PRESET_TO_APPEARANCE: Record<
  string,
  Partial<AppearanceConfig>
> = {
  nova: { style: "nova", palette: "neutral" },
  vega: { style: "vega" },
  maia: { style: "maia" },
  lyra: { style: "lyra" },
  mira: { style: "mira" },
  luma: { style: "luma" },
  sera: { style: "sera", palette: "taupe", base: "taupe" },
  rhea: { style: "rhea" },
  olive: { palette: "olive" },
  mauve: { palette: "mauve" },
  mist: { palette: "mist" },
  stone: { palette: "stone" },
  zinc: { palette: "zinc" },
  blue: { palette: "blue" },
  green: { palette: "green" },
  rose: { palette: "rose" },
  violet: { palette: "violet" },
  orange: { palette: "orange" },
};

export function parseAppearance(raw: string | null): AppearanceConfig {
  if (!raw) {
    return DEFAULT_APPEARANCE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppearanceConfig> & {
      preset?: string;
    };

    const next: AppearanceConfig = { ...DEFAULT_APPEARANCE };

    if (parsed.preset && LEGACY_PRESET_TO_APPEARANCE[parsed.preset]) {
      Object.assign(next, LEGACY_PRESET_TO_APPEARANCE[parsed.preset]);
    }

    if (parsed.style && isStyleName(parsed.style)) {
      next.style = parsed.style;
    }

    const stylePreset =
      getStylePreset(next.style) ?? getStylePreset(DEFAULT_STYLE_NAME);

    if (stylePreset && parsed.font === undefined) {
      next.font = fontFromStyle(stylePreset);
      next.fontHeading = headingFromStyle(stylePreset);
      next.radius = isRadiusLocked(next.style) ? "none" : stylePreset.radius;
    }

    if (parsed.base && isBaseColorName(parsed.base)) {
      next.base = parsed.base;
    }

    if (parsed.palette && isPaletteName(parsed.palette)) {
      if (parsed.palette.endsWith("-dark")) {
        const lightName = parsed.palette.slice(0, -5);
        next.palette = isPaletteName(lightName) ? lightName : parsed.palette;
        if (parsed.background === undefined) {
          next.background = "dark";
        }
      } else {
        next.palette = parsed.palette;
      }
    }

    if (parsed.background && isBackgroundName(parsed.background)) {
      next.background = parsed.background;
    }

    if (parsed.font && isFontName(parsed.font)) {
      next.font = parsed.font;
    }

    if (parsed.fontHeading && isFontHeadingName(parsed.fontHeading)) {
      next.fontHeading = parsed.fontHeading;
    }

    if (parsed.radius && isRadiusName(parsed.radius)) {
      next.radius = parsed.radius;
    }

    if (parsed.chartColor && isThemeTokenName(parsed.chartColor)) {
      next.chartColor = parsed.chartColor;
    } else {
      const palette =
        getPalettePreset(next.palette) ?? getPalettePreset(DEFAULT_PALETTE_NAME);
      next.chartColor = palette?.token ?? DEFAULT_CHART_COLOR_NAME;
    }

    if (isRadiusLocked(next.style)) {
      next.radius = "none";
    }

    return next;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function chartTokenEntries(token: ThemeTokenName, mode: "light" | "dark") {
  const tokens = THEME_TOKENS[token]?.[mode] ?? {};
  return Object.entries(tokens).filter(([key]) => key.startsWith("chart-"));
}

export function applyAppearance(config: AppearanceConfig) {
  if (typeof document === "undefined") {
    return;
  }

  const style =
    getStylePreset(config.style) ?? getStylePreset(DEFAULT_STYLE_NAME);
  const mode = resolveAppearanceMode(config.background);
  const palette =
    getPalettePreset(config.palette) ?? getPalettePreset(DEFAULT_PALETTE_NAME);
  const font = getFontOption(config.font) ?? getFontOption(DEFAULT_FONT_NAME);
  const headingFont =
    config.fontHeading === "inherit"
      ? font
      : (getFontOption(config.fontHeading) ?? font);
  const radiusName = isRadiusLocked(config.style) ? "none" : config.radius;

  if (!style || !palette || !font || !headingFont) {
    return;
  }

  const root = document.documentElement;
  root.setAttribute("data-style", style.name);
  root.setAttribute("data-palette", palette.token);
  root.setAttribute("data-background", config.background);
  root.setAttribute("data-font", font.name);
  root.setAttribute("data-radius", radiusName);
  root.classList.toggle("dark", mode === "dark");

  const isGrayscaleTheme = (GRAYSCALE_THEMES as readonly string[]).includes(
    palette.token,
  );
  const surface = isBackgroundColorName(config.background)
    ? config.background
    : isGrayscaleTheme
      ? palette.token
      : config.base;

  root.setAttribute("data-base-theme", surface);
  if (isGrayscaleTheme) {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", palette.token);
  }

  const baseTokens = THEME_TOKENS[surface]?.[mode] ?? {};
  const colorTokens = isGrayscaleTheme
    ? {}
    : (THEME_TOKENS[palette.token]?.[mode] ?? {});

  for (const [key, value] of Object.entries({ ...baseTokens, ...colorTokens })) {
    root.style.setProperty(`--${key}`, value);
  }

  const tint = resolveSurfaceTint({
    background: config.background,
    theme: palette.token,
  });
  if (tint) {
    for (const [key, value] of Object.entries(getContrastSurfaces(tint, mode))) {
      root.style.setProperty(`--${key}`, value);
    }
  }

  for (const [key, value] of chartTokenEntries(config.chartColor, mode)) {
    root.style.setProperty(`--${key}`, value);
  }

  const mono =
    font.type === "mono" ? font.variable : "--font-geist-mono";

  root.style.setProperty("--radius", getRadiusValue(radiusName));
  root.style.setProperty(
    "--app-font-sans",
    fontFamilyValue(font.variable, PRESET_FONT_STACK),
  );
  root.style.setProperty(
    "--app-font-heading",
    fontFamilyValue(headingFont.variable, PRESET_FONT_STACK),
  );
  root.style.setProperty(
    "--app-font-mono",
    fontFamilyValue(mono, PRESET_MONO_STACK),
  );
}

export function shuffleAppearance(current: AppearanceConfig): AppearanceConfig {
  for (let attempt = 0; attempt < 8; attempt++) {
    const style = pickRandom(STYLE_PRESETS).name;
    const palette = pickRandom(THEME_OPTIONS).name;
    const palettePreset = getPalettePreset(palette);
    const font = pickRandom(FONT_OPTIONS).name;
    let fontHeading: FontHeadingName =
      Math.random() < 0.45 ? "inherit" : pickRandom(FONT_OPTIONS).name;

    if (fontHeading === font) {
      fontHeading = "inherit";
    }

    const next: AppearanceConfig = {
      style,
      base: pickRandom(BASE_COLOR_PRESETS).name,
      palette,
      background: pickRandom(BACKGROUND_OPTIONS).name,
      font,
      fontHeading,
      radius: isRadiusLocked(style) ? "none" : pickRandom(RADIUS_OPTIONS).name,
      chartColor: pickRandom(THEME_OPTIONS).name,
    };

    if (
      palettePreset &&
      (GRAYSCALE_THEMES as readonly string[]).includes(palettePreset.token)
    ) {
      next.base = palettePreset.token as BaseColorName;
    }

    if (next.style !== current.style || next.palette !== current.palette) {
      return next;
    }
  }

  return current;
}

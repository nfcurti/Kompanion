export const PRESET_FONT_STACK = "ui-sans-serif, system-ui, sans-serif";
export const PRESET_MONO_STACK = "ui-monospace, monospace";

export type StyleName =
  | "nova"
  | "vega"
  | "maia"
  | "lyra"
  | "mira"
  | "luma"
  | "rhea"
  | "sera";

export type StylePreset = {
  name: StyleName;
  title: string;
  description: string;
  radius: "none" | "sm" | "md" | "lg" | "xl";
  fontSans: string;
  fontHeading: string;
  fontMono: string;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    name: "nova",
    title: "Nova",
    description: "Geist",
    radius: "md",
    fontSans: "--font-geist-sans",
    fontHeading: "--font-geist-sans",
    fontMono: "--font-geist-mono",
  },
  {
    name: "vega",
    title: "Vega",
    description: "Inter",
    radius: "md",
    fontSans: "--font-inter",
    fontHeading: "--font-inter",
    fontMono: "--font-geist-mono",
  },
  {
    name: "maia",
    title: "Maia",
    description: "Figtree",
    radius: "md",
    fontSans: "--font-figtree",
    fontHeading: "--font-figtree",
    fontMono: "--font-geist-mono",
  },
  {
    name: "lyra",
    title: "Lyra",
    description: "JetBrains Mono",
    radius: "none",
    fontSans: "--font-jetbrains-mono",
    fontHeading: "--font-jetbrains-mono",
    fontMono: "--font-jetbrains-mono",
  },
  {
    name: "mira",
    title: "Mira",
    description: "Inter",
    radius: "md",
    fontSans: "--font-inter",
    fontHeading: "--font-inter",
    fontMono: "--font-geist-mono",
  },
  {
    name: "luma",
    title: "Luma",
    description: "Inter",
    radius: "md",
    fontSans: "--font-inter",
    fontHeading: "--font-inter",
    fontMono: "--font-geist-mono",
  },
  {
    name: "rhea",
    title: "Rhea",
    description: "Inter",
    radius: "md",
    fontSans: "--font-inter",
    fontHeading: "--font-inter",
    fontMono: "--font-geist-mono",
  },
  {
    name: "sera",
    title: "Sera",
    description: "Noto Sans + Playfair",
    radius: "none",
    fontSans: "--font-noto-sans",
    fontHeading: "--font-playfair-display",
    fontMono: "--font-geist-mono",
  },
];

export type BaseColorName =
  | "neutral"
  | "stone"
  | "zinc"
  | "mauve"
  | "olive"
  | "mist"
  | "taupe";

export const BASE_COLOR_PRESETS: { name: BaseColorName; title: string }[] = [
  { name: "neutral", title: "Neutral" },
  { name: "stone", title: "Stone" },
  { name: "zinc", title: "Zinc" },
  { name: "mauve", title: "Mauve" },
  { name: "olive", title: "Olive" },
  { name: "mist", title: "Mist" },
  { name: "taupe", title: "Taupe" },
];

export const GRAYSCALE_THEMES = [
  "neutral",
  "stone",
  "zinc",
  "mauve",
  "olive",
  "mist",
  "taupe",
] as const;

export const CHROMATIC_THEMES = [
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

export type ThemeTokenName =
  | (typeof GRAYSCALE_THEMES)[number]
  | (typeof CHROMATIC_THEMES)[number];

export const THEME_OPTIONS: { name: ThemeTokenName; title: string; group: "base" | "color" }[] = [
  { name: "neutral", title: "Neutral", group: "base" },
  { name: "stone", title: "Stone", group: "base" },
  { name: "zinc", title: "Zinc", group: "base" },
  { name: "mauve", title: "Mauve", group: "base" },
  { name: "olive", title: "Olive", group: "base" },
  { name: "mist", title: "Mist", group: "base" },
  { name: "taupe", title: "Taupe", group: "base" },
  { name: "amber", title: "Amber", group: "color" },
  { name: "blue", title: "Blue", group: "color" },
  { name: "cyan", title: "Cyan", group: "color" },
  { name: "emerald", title: "Emerald", group: "color" },
  { name: "fuchsia", title: "Fuchsia", group: "color" },
  { name: "green", title: "Green", group: "color" },
  { name: "indigo", title: "Indigo", group: "color" },
  { name: "lime", title: "Lime", group: "color" },
  { name: "orange", title: "Orange", group: "color" },
  { name: "pink", title: "Pink", group: "color" },
  { name: "purple", title: "Purple", group: "color" },
  { name: "red", title: "Red", group: "color" },
  { name: "rose", title: "Rose", group: "color" },
  { name: "sky", title: "Sky", group: "color" },
  { name: "teal", title: "Teal", group: "color" },
  { name: "violet", title: "Violet", group: "color" },
  { name: "yellow", title: "Yellow", group: "color" },
];

export type PalettePreset = {
  name: string;
  title: string;
  token: ThemeTokenName;
  mode: "light" | "dark";
};

export const PALETTE_PRESETS: PalettePreset[] = THEME_OPTIONS.flatMap((theme) => [
  {
    name: theme.name,
    title: theme.title,
    token: theme.name,
    mode: "light" as const,
  },
  {
    name: `${theme.name}-dark`,
    title: `${theme.title} Dark`,
    token: theme.name,
    mode: "dark" as const,
  },
]);

export type PaletteName = (typeof PALETTE_PRESETS)[number]["name"];

export const BACKGROUND_SCHEME_OPTIONS = [
  { name: "light", title: "Light", group: "scheme", swatch: "oklch(1 0 0)" },
  { name: "dark", title: "Dark", group: "scheme", swatch: "oklch(0.22 0 0)" },
  { name: "system", title: "System", group: "scheme", swatch: "oklch(0.55 0 0)" },
] as const;

export const BACKGROUND_COLOR_OPTIONS = [
  { name: "neutral", title: "Neutral", group: "color", swatch: "oklch(0.62 0 0)" },
  { name: "stone", title: "Stone", group: "color", swatch: "oklch(0.68 0.045 56)" },
  { name: "zinc", title: "Zinc", group: "color", swatch: "oklch(0.62 0.05 286)" },
  { name: "olive", title: "Olive", group: "color", swatch: "oklch(0.64 0.08 107)" },
  { name: "mauve", title: "Mauve", group: "color", swatch: "oklch(0.64 0.09 322)" },
] as const;

export const BACKGROUND_OPTIONS = [
  ...BACKGROUND_SCHEME_OPTIONS,
  ...BACKGROUND_COLOR_OPTIONS,
] as const;

export type BackgroundName = (typeof BACKGROUND_OPTIONS)[number]["name"];
export type BackgroundColorName = (typeof BACKGROUND_COLOR_OPTIONS)[number]["name"];

export const BACKGROUND_SURFACE_KEYS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "border",
  "input",
  "ring",
  "sidebar",
  "sidebar-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export function getBackgroundOption(name: string) {
  return BACKGROUND_OPTIONS.find((item) => item.name === name);
}

export function isBackgroundName(value: string): value is BackgroundName {
  return BACKGROUND_OPTIONS.some((item) => item.name === value);
}

export function isBackgroundColorName(value: string): value is BackgroundColorName {
  return BACKGROUND_COLOR_OPTIONS.some((item) => item.name === value);
}

const SURFACE_TINTS: Record<string, { hue: number; chroma: number }> = {
  neutral: { hue: 0, chroma: 0.012 },
  stone: { hue: 56, chroma: 0.05 },
  zinc: { hue: 286, chroma: 0.05 },
  olive: { hue: 107, chroma: 0.08 },
  mauve: { hue: 322, chroma: 0.09 },
  amber: { hue: 49, chroma: 0.06 },
  blue: { hue: 264.376, chroma: 0.06 },
  cyan: { hue: 223.128, chroma: 0.055 },
  emerald: { hue: 165.612, chroma: 0.055 },
  fuchsia: { hue: 323.949, chroma: 0.06 },
  green: { hue: 150.069, chroma: 0.06 },
  indigo: { hue: 277.023, chroma: 0.06 },
  lime: { hue: 128.85, chroma: 0.065 },
  orange: { hue: 38.402, chroma: 0.06 },
  pink: { hue: 3.958, chroma: 0.06 },
  purple: { hue: 301.924, chroma: 0.06 },
  red: { hue: 27.518, chroma: 0.06 },
  rose: { hue: 16.935, chroma: 0.06 },
  sky: { hue: 242.749, chroma: 0.055 },
  teal: { hue: 186.391, chroma: 0.055 },
  violet: { hue: 292.581, chroma: 0.06 },
  yellow: { hue: 91.936, chroma: 0.065 },
};

function oklchValue(l: number, c: number, h: number, alpha?: number) {
  const chroma = Math.max(0, c);
  if (alpha != null) {
    return `oklch(${l} ${chroma} ${h} / ${alpha})`;
  }
  return `oklch(${l} ${chroma} ${h})`;
}

export function contrastSurfaces(
  hue: number,
  chroma: number,
  mode: "light" | "dark",
): Record<string, string> {
  if (mode === "dark") {
    const c = Math.min(chroma, 0.055);
    return {
      background: oklchValue(0.16, c * 0.9, hue),
      foreground: oklchValue(0.97, c * 0.12, hue),
      card: oklchValue(0.24, c, hue),
      "card-foreground": oklchValue(0.97, c * 0.12, hue),
      popover: oklchValue(0.24, c, hue),
      "popover-foreground": oklchValue(0.97, c * 0.12, hue),
      secondary: oklchValue(0.3, c * 0.85, hue),
      "secondary-foreground": oklchValue(0.96, c * 0.12, hue),
      muted: oklchValue(0.3, c * 0.85, hue),
      "muted-foreground": oklchValue(0.74, c * 0.28, hue),
      accent: oklchValue(0.3, c * 0.9, hue),
      "accent-foreground": oklchValue(0.96, c * 0.12, hue),
      border: oklchValue(1, 0, 0, 0.12),
      input: oklchValue(1, 0, 0, 0.16),
      ring: oklchValue(0.64, Math.min(c * 1.7, 0.12), hue),
      sidebar: oklchValue(0.12, c, hue),
      "sidebar-foreground": oklchValue(0.96, c * 0.14, hue),
      "sidebar-accent": oklchValue(0.22, c * 1.05, hue),
      "sidebar-accent-foreground": oklchValue(0.97, c * 0.12, hue),
      "sidebar-border": oklchValue(1, 0, 0, 0.1),
    };
  }

  const c = Math.min(chroma, 0.08);
  return {
    background: oklchValue(0.93, c, hue),
    foreground: oklchValue(0.18, c * 0.45, hue),
    card: oklchValue(0.99, c * 0.22, hue),
    "card-foreground": oklchValue(0.18, c * 0.45, hue),
    popover: oklchValue(0.995, c * 0.18, hue),
    "popover-foreground": oklchValue(0.18, c * 0.45, hue),
    secondary: oklchValue(0.88, c * 0.95, hue),
    "secondary-foreground": oklchValue(0.2, c * 0.5, hue),
    muted: oklchValue(0.88, c * 0.95, hue),
    "muted-foreground": oklchValue(0.4, c * 0.4, hue),
    accent: oklchValue(0.88, c, hue),
    "accent-foreground": oklchValue(0.2, c * 0.5, hue),
    border: oklchValue(0.78, c * 0.75, hue),
    input: oklchValue(0.78, c * 0.75, hue),
    ring: oklchValue(0.52, Math.min(c * 1.6, 0.12), hue),
    sidebar: oklchValue(0.86, c * 1.15, hue),
    "sidebar-foreground": oklchValue(0.2, c * 0.5, hue),
    "sidebar-accent": oklchValue(0.81, c * 1.2, hue),
    "sidebar-accent-foreground": oklchValue(0.18, c * 0.5, hue),
    "sidebar-border": oklchValue(0.74, c * 0.8, hue),
  };
}

export function getContrastSurfaces(tint: string, mode: "light" | "dark") {
  const spec = SURFACE_TINTS[tint];
  if (!spec) {
    return {};
  }
  return contrastSurfaces(spec.hue, spec.chroma, mode);
}

export function getBackgroundColorSurfaces(
  name: BackgroundColorName,
  mode: "light" | "dark" = "light",
) {
  return getContrastSurfaces(name, mode);
}

export function resolveSurfaceTint(options: {
  background: BackgroundName;
  theme: string;
}) {
  if (isBackgroundColorName(options.background)) {
    return options.background;
  }
  if ((CHROMATIC_THEMES as readonly string[]).includes(options.theme)) {
    return options.theme;
  }
  return null;
}

export function prefersDarkScheme() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveAppearanceMode(
  background: BackgroundName,
): "light" | "dark" {
  if (background === "dark") {
    return "dark";
  }
  if (background === "system") {
    return prefersDarkScheme() ? "dark" : "light";
  }
  return "light";
}

export const FONT_OPTIONS = [
  { name: "geist", title: "Geist", variable: "--font-geist-sans", type: "sans" },
  { name: "inter", title: "Inter", variable: "--font-inter", type: "sans" },
  { name: "figtree", title: "Figtree", variable: "--font-figtree", type: "sans" },
  { name: "noto-sans", title: "Noto Sans", variable: "--font-noto-sans", type: "sans" },
  {
    name: "geist-mono",
    title: "Geist Mono",
    variable: "--font-geist-mono",
    type: "mono",
  },
  {
    name: "jetbrains-mono",
    title: "JetBrains Mono",
    variable: "--font-jetbrains-mono",
    type: "mono",
  },
  {
    name: "playfair-display",
    title: "Playfair Display",
    variable: "--font-playfair-display",
    type: "serif",
  },
] as const;

export type FontName = (typeof FONT_OPTIONS)[number]["name"];
export type FontHeadingName = FontName | "inherit";
export type FontType = (typeof FONT_OPTIONS)[number]["type"];

export type RadiusName = "none" | "sm" | "md" | "lg" | "xl";

export const DEFAULT_STYLE_NAME: StyleName = "nova";
export const DEFAULT_BASE_NAME: BaseColorName = "neutral";
export const DEFAULT_PALETTE_NAME: PaletteName = "neutral";
export const DEFAULT_BACKGROUND_NAME: BackgroundName = "light";
export const DEFAULT_FONT_NAME: FontName = "geist";
export const DEFAULT_FONT_HEADING_NAME: FontHeadingName = "inherit";
export const DEFAULT_RADIUS_NAME: RadiusName = "md";
export const DEFAULT_CHART_COLOR_NAME: ThemeTokenName = "neutral";

export const RADIUS_OPTIONS: { name: RadiusName; title: string; value: string }[] =
  [
    { name: "none", title: "None", value: "0" },
    { name: "sm", title: "Small", value: "0.45rem" },
    { name: "md", title: "Default", value: "0.625rem" },
    { name: "lg", title: "Large", value: "0.875rem" },
    { name: "xl", title: "XL", value: "1.15rem" },
  ];

export const RADIUS_LOCKED_STYLES: StyleName[] = ["lyra", "sera"];

export function isRadiusLocked(style: StyleName) {
  return RADIUS_LOCKED_STYLES.includes(style);
}

export function getFontOption(name: string) {
  return FONT_OPTIONS.find((font) => font.name === name);
}

export function isFontName(value: string): value is FontName {
  return FONT_OPTIONS.some((font) => font.name === value);
}

export function isFontHeadingName(value: string): value is FontHeadingName {
  return value === "inherit" || isFontName(value);
}

export function isRadiusName(value: string): value is RadiusName {
  return RADIUS_OPTIONS.some((radius) => radius.name === value);
}

export function isThemeTokenName(value: string): value is ThemeTokenName {
  return THEME_OPTIONS.some((theme) => theme.name === value);
}

export function fontFromStyle(style: StylePreset): FontName {
  const match = FONT_OPTIONS.find((font) => font.variable === style.fontSans);
  return match?.name ?? DEFAULT_FONT_NAME;
}

export function headingFromStyle(style: StylePreset): FontHeadingName {
  if (style.fontHeading === style.fontSans) {
    return "inherit";
  }
  const match = FONT_OPTIONS.find((font) => font.variable === style.fontHeading);
  return match?.name ?? "inherit";
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function getStylePreset(name: string) {
  return STYLE_PRESETS.find((preset) => preset.name === name);
}

export function getPalettePreset(name: string) {
  return PALETTE_PRESETS.find((preset) => preset.name === name);
}

export function isStyleName(value: string): value is StyleName {
  return STYLE_PRESETS.some((preset) => preset.name === value);
}

export function isBaseColorName(value: string): value is BaseColorName {
  return BASE_COLOR_PRESETS.some((preset) => preset.name === value);
}

export function isPaletteName(value: string): value is PaletteName {
  return PALETTE_PRESETS.some((preset) => preset.name === value);
}

export function getAppearanceBootstrap() {
  return {
    styles: Object.fromEntries(
      STYLE_PRESETS.map((preset) => [
        preset.name,
        {
          r: RADIUS_OPTIONS.find((item) => item.name === preset.radius)?.value,
          s: preset.fontSans,
          h: preset.fontHeading,
          m: preset.fontMono,
          f: fontFromStyle(preset),
          fh: headingFromStyle(preset),
        },
      ]),
    ),
    palettes: Object.fromEntries(
      PALETTE_PRESETS.map((preset) => [
        preset.name,
        {
          t: preset.token,
          mode: preset.mode,
        },
      ]),
    ),
    tints: Object.fromEntries(
      Object.keys(SURFACE_TINTS).map((name) => [
        name,
        {
          light: getContrastSurfaces(name, "light"),
          dark: getContrastSurfaces(name, "dark"),
        },
      ]),
    ),
    fonts: Object.fromEntries(
      FONT_OPTIONS.map((font) => [font.name, font.variable]),
    ),
    radii: Object.fromEntries(
      RADIUS_OPTIONS.map((radius) => [radius.name, radius.value]),
    ),
  };
}

export function fontFamilyValue(variable: string, fallback: string) {
  return `var(${variable}), ${fallback}`;
}

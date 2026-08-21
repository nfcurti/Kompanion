"use client";

import { ChevronRightIcon, PaletteIcon, ShuffleIcon } from "lucide-react";

import { useThemeConfig } from "@/components/theme-config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { THEME_TOKENS } from "@/lib/shadcn-theme-tokens";
import {
  BACKGROUND_COLOR_OPTIONS,
  BACKGROUND_SCHEME_OPTIONS,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  THEME_OPTIONS,
  getBackgroundOption,
  getFontOption,
  getPalettePreset,
  isRadiusLocked,
  type BackgroundName,
  type FontHeadingName,
  type FontName,
  type PaletteName,
  type RadiusName,
  type ThemeTokenName,
} from "@/lib/shadcn-presets";

function ColorChip({ color }: { color: string }) {
  return (
    <span
      className="size-3.5 shrink-0 rounded-full ring-1 ring-foreground/10"
      style={{ backgroundColor: color }}
    />
  );
}

function tokenSwatch(token: ThemeTokenName, mode: "light" | "dark") {
  return THEME_TOKENS[token]?.[mode].primary ?? "var(--primary)";
}

function backgroundSwatch(name: BackgroundName) {
  return getBackgroundOption(name)?.swatch ?? "oklch(1 0 0)";
}

const COLOR_THEME_OPTIONS = THEME_OPTIONS.filter((item) => item.group === "color");

function ThemeOptionGroup({ mode }: { mode: "light" | "dark" }) {
  return (
    <DropdownMenuGroup>
      {COLOR_THEME_OPTIONS.map((item) => (
        <DropdownMenuRadioItem key={item.name} value={item.name}>
          <ColorChip color={tokenSwatch(item.name, mode)} />
          {item.title}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuGroup>
  );
}

function ListRow({
  label,
  value,
  chip,
  disabled,
}: {
  label: string;
  value: string;
  chip?: string;
  disabled?: boolean;
}) {
  return (
    <DropdownMenuTrigger
      disabled={disabled}
      className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:cursor-pointer hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-open:bg-muted data-popup-open:bg-muted"
    >
      <span className="min-w-0 flex-1 text-muted-foreground">{label}</span>
      {chip ? <ColorChip color={chip} /> : null}
      <span className="max-w-[9rem] truncate text-foreground">{value}</span>
      <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
    </DropdownMenuTrigger>
  );
}

function FontRadioItems({ prefix }: { prefix?: string }) {
  const groups = [
    { label: "Sans", items: FONT_OPTIONS.filter((item) => item.type === "sans") },
    { label: "Mono", items: FONT_OPTIONS.filter((item) => item.type === "mono") },
    {
      label: "Serif",
      items: FONT_OPTIONS.filter((item) => item.type === "serif"),
    },
  ];

  return groups.map((group, index) => (
    <div key={group.label}>
      {index > 0 ? <DropdownMenuSeparator /> : null}
      <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
      <DropdownMenuGroup>
        {group.items.map((item) => (
          <DropdownMenuRadioItem
            key={`${prefix ?? ""}${item.name}`}
            value={item.name}
            style={{ fontFamily: `var(${item.variable})` }}
          >
            {item.title}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuGroup>
    </div>
  ));
}

export function ThemeCustomizerPanel({
  className,
  modal = true,
}: {
  className?: string;
  modal?: boolean;
}) {
  const {
    style,
    palette,
    background,
    font,
    fontHeading,
    radius,
    chartColor,
    mode,
    setPalette,
    setBackground,
    setFont,
    setFontHeading,
    setRadius,
    setChartColor,
    shuffle,
    reset,
  } = useThemeConfig();

  const currentPalette = getPalettePreset(palette);
  const currentFont = getFontOption(font);
  const currentHeading =
    fontHeading === "inherit" ? currentFont : getFontOption(fontHeading);
  const currentBackground = getBackgroundOption(background);
  const radiusLocked = isRadiusLocked(style);
  const currentRadius = RADIUS_OPTIONS.find(
    (item) => item.name === (radiusLocked ? "none" : radius),
  );
  const currentChart = COLOR_THEME_OPTIONS.find((item) => item.name === chartColor);
  const textValue =
    fontHeading === "inherit" || currentHeading?.title === currentFont?.title
      ? (currentFont?.title ?? font)
      : `${currentFont?.title ?? font} · ${currentHeading?.title ?? fontHeading}`;

  return (
    <div className={cn("flex flex-col", className)}>
      <DropdownMenu modal={modal}>
        <ListRow label="Text" value={textValue} />
        <DropdownMenuContent align="start" className="z-[100] w-52">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="hover:cursor-pointer">
              Font
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              <DropdownMenuRadioGroup
                value={font}
                onValueChange={(value) => setFont(value as FontName)}
              >
                <FontRadioItems />
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="hover:cursor-pointer">
              Heading
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              <DropdownMenuRadioGroup
                value={fontHeading}
                onValueChange={(value) =>
                  setFontHeading(value as FontHeadingName)
                }
              >
                <DropdownMenuGroup>
                  <DropdownMenuRadioItem value="inherit">
                    {currentFont?.title ?? "Body font"}
                  </DropdownMenuRadioItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <FontRadioItems prefix="heading-" />
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu modal={modal}>
        <ListRow
          label="Background"
          value={currentBackground?.title ?? background}
          chip={backgroundSwatch(background)}
        />
        <DropdownMenuContent align="start" className="z-[100] w-52">
          <DropdownMenuRadioGroup
            value={background}
            onValueChange={(value) => setBackground(value as BackgroundName)}
          >
            <DropdownMenuGroup>
              {BACKGROUND_SCHEME_OPTIONS.map((item) => (
                <DropdownMenuRadioItem key={item.name} value={item.name}>
                  <ColorChip color={backgroundSwatch(item.name)} />
                  {item.title}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Colors</DropdownMenuLabel>
            <DropdownMenuGroup>
              {BACKGROUND_COLOR_OPTIONS.map((item) => (
                <DropdownMenuRadioItem key={item.name} value={item.name}>
                  <ColorChip color={backgroundSwatch(item.name)} />
                  {item.title}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu modal={modal}>
        <ListRow
          label="Theme"
          value={currentPalette?.title ?? palette}
          chip={
            currentPalette
              ? tokenSwatch(currentPalette.token, mode)
              : undefined
          }
        />
        <DropdownMenuContent align="start" className="z-[100] w-52">
          <DropdownMenuRadioGroup
            value={palette}
            onValueChange={(value) => setPalette(value as PaletteName)}
          >
            <ThemeOptionGroup mode={mode} />
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu modal={modal}>
        <ListRow
          label="Chart Color"
          value={currentChart?.title ?? chartColor}
          chip={tokenSwatch(chartColor, mode)}
        />
        <DropdownMenuContent align="start" className="z-[100] w-52">
          <DropdownMenuRadioGroup
            value={chartColor}
            onValueChange={(value) => setChartColor(value as ThemeTokenName)}
          >
            <ThemeOptionGroup mode={mode} />
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu modal={modal}>
        <ListRow
          label="Radius"
          value={currentRadius?.title ?? radius}
          disabled={radiusLocked}
        />
        <DropdownMenuContent align="start" className="z-[100] w-52">
          <DropdownMenuRadioGroup
            value={radiusLocked ? "none" : radius}
            onValueChange={(value) => setRadius(value as RadiusName)}
          >
            <DropdownMenuGroup>
              {RADIUS_OPTIONS.map((item) => (
                <DropdownMenuRadioItem key={item.name} value={item.name}>
                  {item.title}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={shuffle}
          className="hover:cursor-pointer"
        >
          <ShuffleIcon />
          Shuffle
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
}

export function ThemeCustomizer() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Customize appearance">
          <PaletteIcon />
          <span className="sr-only">Customize appearance</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className="w-64 max-h-[min(36rem,80vh)] overflow-y-auto p-1.5"
      >
        <PopoverHeader className="px-2 py-1">
          <PopoverTitle>Appearance</PopoverTitle>
        </PopoverHeader>
        <Separator />
        <ThemeCustomizerPanel modal={false} />
      </PopoverContent>
    </Popover>
  );
}

export { ThemeCustomizer as ThemeToggle };

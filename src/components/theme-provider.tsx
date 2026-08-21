"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { ThemeConfigProvider } from "@/components/theme-config";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeConfigProvider>{children}</ThemeConfigProvider>
    </NextThemesProvider>
  );
}

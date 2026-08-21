import type { Metadata } from "next";
import {
  Figtree,
  Geist,
  Geist_Mono,
  Inter,
  JetBrains_Mono,
  Noto_Sans,
  Playfair_Display,
} from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAppearanceBootstrap } from "@/lib/shadcn-presets";
import { THEME_STORAGE_KEY } from "@/lib/shadcn-themes";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kompanion",
  description: "AI chat orchestrator for multi-agent workflows",
};

const appearanceScript = `(function(){try{var B=${JSON.stringify(getAppearanceBootstrap())};var G=["neutral","stone","zinc","mauve","olive","mist","taupe"];var C=["neutral","stone","zinc","olive","mauve"];var CH=["amber","blue","cyan","emerald","fuchsia","green","indigo","lime","orange","pink","purple","red","rose","sky","teal","violet","yellow"];var s=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"{}");var st=B.styles[s.style]||B.styles.nova;var palName=s.palette||"neutral";var bg=s.background||"light";if(!s.background&&String(palName).slice(-5)==="-dark")bg="dark";var pal=B.palettes[palName]||B.palettes[String(palName).replace(/-dark$/,"")]||B.palettes.neutral;var mode=bg==="dark"||(bg==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";var fv=B.fonts[s.font]||st.s;var hv=s.fontHeading==="inherit"||!B.fonts[s.fontHeading]?fv:B.fonts[s.fontHeading];if(!s.font){fv=st.s;hv=st.h}var rv=B.radii[s.radius]||st.r;if(s.style==="lyra"||s.style==="sera")rv="0";var mono=(fv==="--font-jetbrains-mono"||fv==="--font-geist-mono")?fv:"--font-geist-mono";var el=document.documentElement;el.classList.toggle("dark",mode==="dark");localStorage.setItem("theme",mode);el.setAttribute("data-style",s.style||"nova");el.setAttribute("data-palette",pal.t);el.setAttribute("data-background",bg);var surface=C.indexOf(bg)>=0?bg:(G.indexOf(pal.t)>=0?pal.t:(s.base||"neutral"));el.setAttribute("data-base-theme",surface);if(G.indexOf(pal.t)>=0)el.removeAttribute("data-theme");else el.setAttribute("data-theme",pal.t);el.style.setProperty("--radius",rv);el.style.setProperty("--app-font-sans","var("+fv+"), ui-sans-serif, system-ui, sans-serif");el.style.setProperty("--app-font-heading","var("+hv+"), ui-sans-serif, system-ui, sans-serif");el.style.setProperty("--app-font-mono","var("+mono+"), ui-monospace, monospace");var tint=C.indexOf(bg)>=0?bg:(CH.indexOf(pal.t)>=0?pal.t:null);if(tint&&B.tints[tint]){var S=B.tints[tint][mode]||{};for(var k in S)el.style.setProperty("--"+k,S[k]);}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-style="nova"
      data-palette="neutral"
      data-background="light"
      data-base-theme="neutral"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${figtree.variable} ${jetbrainsMono.variable} ${notoSans.variable} ${playfairDisplay.variable} h-full`}
    >
      <head>
        <script
          id="kompanion-appearance"
          dangerouslySetInnerHTML={{ __html: appearanceScript }}
        />
      </head>
      <body className="min-h-full antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

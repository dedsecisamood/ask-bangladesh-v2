"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

export function ThemeToggle({ locale }: { locale: Locale }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="theme-toggle"
      aria-label={locale === "bn" ? "থিম পরিবর্তন করুন" : "Toggle color theme"}
      onClick={() => {
        const root = document.documentElement;
        const dark = root.dataset.theme
          ? root.dataset.theme === "dark"
          : window.matchMedia("(prefers-color-scheme: dark)").matches;
        const theme = dark ? "light" : "dark";
        root.dataset.theme = theme;
        try {
          localStorage.setItem("askbd-theme", theme);
        } catch {
          // Storage may be unavailable; the current page still changes theme.
        }
      }}
    >
      <Moon className="theme-moon" aria-hidden="true" />
      <Sun className="theme-sun" aria-hidden="true" />
    </Button>
  );
}

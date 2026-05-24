"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
  const Icon = theme === "light" ? Sun : theme === "system" ? Monitor : Moon;
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label="Toggle theme">
      <Icon />
    </Button>
  );
}

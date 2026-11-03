"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "zz_theme";

/** Toggles light/dark. The initial theme is resolved by an inline script before first paint (no flash). */
export function ThemeToggle({ className = "rounded-full p-2 text-ink transition hover:bg-sand sm:p-2.5" }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);

  const toggle = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setDark(next === "dark");
    try {
      localStorage.setItem(KEY, next);
    } catch {}
  };

  return (
    <button type="button" onClick={toggle} className={className} aria-label="Dark mode" aria-pressed={dark ?? undefined} title="Toggle light / dark mode">
      {/* Icons switch with CSS, so server and client markup always match */}
      <Moon className="h-5 w-5 dark:hidden" aria-hidden />
      <Sun className="hidden h-5 w-5 dark:block" aria-hidden />
    </button>
  );
}

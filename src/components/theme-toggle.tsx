"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* gizli modda localStorage olmayabilir */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Açık/koyu tema değiştir"
      title="Açık/koyu tema"
      className={`flex items-center justify-center rounded-md transition-colors ${className}`}
    >
      <Moon className="size-[18px] dark:hidden" strokeWidth={1.8} aria-hidden />
      <Sun className="hidden size-[18px] dark:block" strokeWidth={1.8} aria-hidden />
    </button>
  );
}

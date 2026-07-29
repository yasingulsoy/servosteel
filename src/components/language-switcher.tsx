"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import TR from "country-flag-icons/react/3x2/TR";
import GB from "country-flag-icons/react/3x2/GB";
import DE from "country-flag-icons/react/3x2/DE";
import ES from "country-flag-icons/react/3x2/ES";
import IT from "country-flag-icons/react/3x2/IT";
import HU from "country-flag-icons/react/3x2/HU";
import PL from "country-flag-icons/react/3x2/PL";
import RU from "country-flag-icons/react/3x2/RU";
import SA from "country-flag-icons/react/3x2/SA";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeNames, type AppLocale } from "@/i18n/routing";

const flags: Record<AppLocale, React.ComponentType<{ className?: string }>> = {
  tr: TR,
  en: GB,
  de: DE,
  es: ES,
  it: IT,
  hu: HU,
  pl: PL,
  ru: RU,
  ar: SA,
};

export function LanguageSwitcher({
  buttonClassName = "",
  align = "right",
}: {
  buttonClassName?: string;
  align?: "left" | "right";
}) {
  const t = useTranslations("nav");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const ActiveFlag = flags[locale];

  const switchTo = (next: AppLocale) => {
    if (next === locale) {
      setOpen(false);
      return;
    }
    setPendingLocale(next);
    startTransition(() => {
      router.replace(pathname, { locale: next });
      setOpen(false);
      setPendingLocale(null);
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("langAria")}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isPending}
        className={`flex items-center gap-1.5 font-medium transition-colors disabled:opacity-60 ${buttonClassName}`}
      >
        <ActiveFlag className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover" />
        <span className="uppercase">{locale}</span>
        <ChevronDown
          className={`size-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.8}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-card py-1.5 shadow-xl shadow-black/10 ${
            align === "right" ? "end-0" : "start-0"
          }`}
        >
          {routing.locales.map((l) => {
            const Flag = flags[l];
            const active = l === locale;
            const loading = isPending && pendingLocale === l;
            return (
              <li key={l} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => switchTo(l)}
                  disabled={isPending}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:opacity-60 ${
                    active ? "bg-surface-alt font-semibold text-ink" : "text-ink hover:bg-surface-alt"
                  }`}
                >
                  <Flag className="h-4 w-6 shrink-0 rounded-[2px] object-cover shadow-sm" />
                  <span className="flex-1">{localeNames[l]}</span>
                  {loading ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-accent-ink" aria-hidden />
                  ) : active ? (
                    <Check className="size-4 shrink-0 text-accent-ink" strokeWidth={2.5} aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

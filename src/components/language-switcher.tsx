"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Globe, Loader2 } from "lucide-react";
import TR from "country-flag-icons/react/3x2/TR";
import GB from "country-flag-icons/react/3x2/GB";
import DE from "country-flag-icons/react/3x2/DE";
import ES from "country-flag-icons/react/3x2/ES";
import IT from "country-flag-icons/react/3x2/IT";
import HU from "country-flag-icons/react/3x2/HU";
import PL from "country-flag-icons/react/3x2/PL";
import RU from "country-flag-icons/react/3x2/RU";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeNames, type AppLocale } from "@/i18n/routing";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const flags: Record<AppLocale, React.ComponentType<{ className?: string; title?: string }>> = {
  tr: TR,
  en: GB,
  de: DE,
  es: ES,
  it: IT,
  hu: HU,
  pl: PL,
  ru: RU,
};

/** Her dilin İngilizce/uluslararası karşılığı — alt satırda ipucu olarak */
const localeSubtitles: Record<AppLocale, string> = {
  tr: "Turkish",
  en: "English",
  de: "German",
  es: "Spanish",
  it: "Italian",
  hu: "Hungarian",
  pl: "Polish",
  ru: "Russian",
};

export function LanguageSwitcher({
  buttonClassName = "",
}: {
  buttonClassName?: string;
}) {
  const t = useTranslations("nav");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);
  const [isPending, startTransition] = useTransition();

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label={t("langAria")}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-medium transition-colors ${buttonClassName}`}
      >
        <ActiveFlag className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover" />
        <span className="uppercase">{locale}</span>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Globe className="size-5 text-accent" strokeWidth={1.8} aria-hidden />
            {t("langTitle")}
          </DialogTitle>
          <DialogDescription>{t("langDesc")}</DialogDescription>
        </DialogHeader>

        <ul className="grid max-h-[60vh] gap-2 overflow-y-auto sm:grid-cols-2">
          {routing.locales.map((l) => {
            const Flag = flags[l];
            const active = l === locale;
            const loading = isPending && pendingLocale === l;
            return (
              <li key={l}>
                <button
                  type="button"
                  onClick={() => switchTo(l)}
                  disabled={isPending}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all disabled:opacity-60 ${
                    active
                      ? "border-accent bg-accent/10"
                      : "border-line bg-surface hover:border-accent/50 hover:bg-surface-alt"
                  }`}
                >
                  <Flag className="h-6 w-8 shrink-0 rounded-[3px] object-cover shadow-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {localeNames[l]}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {localeSubtitles[l]}
                    </span>
                  </span>
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
      </DialogContent>
    </Dialog>
  );
}

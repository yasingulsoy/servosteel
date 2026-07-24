"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Mail, Menu, Phone, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SocialIcons } from "@/components/social-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { rollFormItems, machineItems } from "@/lib/catalog";
import { CONTACT } from "@/lib/site";

type NavItem = { label: string; href: string };

function DesktopDropdown({
  label,
  hubHref,
  items,
  seeAll,
}: {
  label: string;
  hubHref: string;
  items: NavItem[];
  seeAll: string;
}) {
  return (
    <div className="group relative">
      <Link
        href={hubHref}
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:text-accent-ink"
      >
        {label}
        <ChevronDown
          className="size-3.5 shrink-0 transition-transform duration-200 group-hover:rotate-180"
          strokeWidth={1.8}
          aria-hidden
        />
      </Link>
      <div className="invisible absolute left-0 top-full z-50 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="w-72 overflow-hidden rounded-xl border border-line bg-card shadow-xl shadow-black/10">
          <Link
            href={hubHref}
            className="block border-b border-line px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt"
          >
            {seeAll}
          </Link>
          <ul className="py-1.5">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 text-sm text-ink transition-colors hover:bg-surface-alt hover:text-accent-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const tTop = useTranslations("topbar");
  const tRoll = useTranslations("products.rollform");
  const tMach = useTranslations("products.machines");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const rollFormLines: NavItem[] = rollFormItems.map((i) => ({
    label: tRoll(`${i.slug}.name`),
    href: `/roll-form-hatlari/${i.slug}`,
  }));
  const machines: NavItem[] = machineItems.map((i) => ({
    label: tMach(`${i.slug}.name`),
    href: `/makineler/${i.slug}`,
  }));

  return (
    <header className="sticky top-0 z-50">
      {/* Üst bilgi çubuğu — her iki temada da koyu */}
      <div className="hidden bg-shell lg:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs text-white">
          <div className="flex items-center gap-5">
            <a href={CONTACT.phoneHref} className="flex items-center gap-1.5 transition-colors hover:text-accent">
              <Phone className="size-3.5" strokeWidth={1.8} aria-hidden />
              {CONTACT.phoneDisplay}
            </a>
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-1.5 transition-colors hover:text-accent">
              <Mail className="size-3.5" strokeWidth={1.8} aria-hidden />
              {CONTACT.email}
            </a>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              {tTop("export")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SocialIcons
              className="gap-0.5"
              linkClassName="size-7 rounded-md text-white hover:bg-white/10 hover:text-accent"
              iconClassName="size-4"
            />
            <span className="mx-1.5 h-4 w-px bg-white/15" aria-hidden />
            <LanguageSwitcher buttonClassName="text-white hover:bg-white/10 hover:text-accent" />
            <ThemeToggle className="size-7 text-white hover:bg-white/10 hover:text-accent" />
          </div>
        </div>
      </div>

      {/* Ana menü — temaya uyumlu */}
      <div
        className={`border-b border-line bg-surface/95 backdrop-blur transition-shadow ${
          scrolled ? "shadow-md shadow-black/5" : ""
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label={t("homeAria")} className="shrink-0">
            <Image
              src="/logo-full.png"
              alt="Servosteel"
              width={256}
              height={113}
              priority
              loading="eager"
              className="h-11 w-auto dark:invert dark:hue-rotate-180"
            />
          </Link>

          <nav className="hidden items-center lg:flex" aria-label={t("mainAria")}>
            <DesktopDropdown label={t("rollform")} hubHref="/roll-form-hatlari" items={rollFormLines} seeAll={t("seeAll")} />
            <Link
              href="/dilme-hatlari"
              className="rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:text-accent-ink"
            >
              {t("slitting")}
            </Link>
            <Link
              href="/boy-kesme-hatlari"
              className="rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:text-accent-ink"
            >
              {t("ctl")}
            </Link>
            <DesktopDropdown label={t("machines")} hubHref="/makineler" items={machines} seeAll={t("seeAll")} />
            <Link
              href="/hakkimizda"
              className="rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:text-accent-ink"
            >
              {t("about")}
            </Link>
            <Link
              href="/iletisim"
              className="rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:text-accent-ink"
            >
              {t("contact")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="size-10 text-ink hover:bg-surface-alt lg:hidden" />
            <Link
              href="/teklif-al"
              className="hidden rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-accent/25 transition-all hover:bg-accent-strong hover:shadow-accent/40 sm:block"
            >
              {t("quote")}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
              className="flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface-alt lg:hidden"
            >
              {mobileOpen ? (
                <X className="size-5" strokeWidth={2} aria-hidden />
              ) : (
                <Menu className="size-5" strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
        </div>

        {/* Mobil menü */}
        {mobileOpen && (
          <div className="border-t border-line bg-surface lg:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4" aria-label={t("mobileAria")}>
              <details className="group/d">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt [&::-webkit-details-marker]:hidden">
                  {t("rollform")}
                  <ChevronDown className="size-3.5 transition-transform duration-200 group-open/d:rotate-180" strokeWidth={1.8} aria-hidden />
                </summary>
                <ul className="mb-2 ml-3 border-l border-line pl-3">
                  <li>
                    <Link href="/roll-form-hatlari" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface-alt">
                      {t("seeAll")}
                    </Link>
                  </li>
                  {rollFormLines.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-surface-alt">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
              <Link href="/dilme-hatlari" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt">
                {t("slitting")}
              </Link>
              <Link href="/boy-kesme-hatlari" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt">
                {t("ctl")}
              </Link>
              <details className="group/d">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt [&::-webkit-details-marker]:hidden">
                  {t("machines")}
                  <ChevronDown className="size-3.5 transition-transform duration-200 group-open/d:rotate-180" strokeWidth={1.8} aria-hidden />
                </summary>
                <ul className="mb-2 ml-3 border-l border-line pl-3">
                  {machines.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-surface-alt">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
              <Link href="/hakkimizda" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt">
                {t("about")}
              </Link>
              <Link href="/iletisim" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt">
                {t("contact")}
              </Link>

              <div className="mt-2 border-t border-line pt-3">
                <LanguageSwitcher buttonClassName="w-full justify-center border border-line py-2.5 text-ink hover:bg-surface-alt" />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3">
                <Link
                  href="/teklif-al"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-accent px-4 py-3 text-center text-sm font-bold text-zinc-950 hover:bg-accent-strong"
                >
                  {t("quote")}
                </Link>
                <SocialIcons
                  className="gap-1"
                  linkClassName="size-9 rounded-md text-ink hover:bg-surface-alt"
                  iconClassName="size-[18px]"
                />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

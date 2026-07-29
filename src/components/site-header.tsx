"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, Cog, Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { SocialIcons } from "@/components/social-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SpecularButton } from "@/components/specular-button";
import { ProfileIcon } from "@/components/profile-icon";
import { rollFormItems, machineItems } from "@/lib/catalog";
import { getAkademiUi } from "@/lib/akademi-ui";

type MegaItem = { label: string; href: string; desc: string; icon?: string };

/* Aktif sayfa tespiti (locale önekleri usePathname tarafından kırpılır) */
function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

/* Animasyonlu alt-çizgili düz menü bağlantısı */
function NavLink({
  href,
  label,
  active,
  overHero,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  overHero: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group/nl relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        overHero ? "text-white/85 hover:text-white" : "text-ink hover:text-accent-ink"
      }`}
    >
      {label}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-accent transition-transform duration-300 ${
          active ? "scale-x-100" : "scale-x-0 group-hover/nl:scale-x-100"
        }`}
      />
    </Link>
  );
}

type Featured = { title: string; text: string; cta: string; href: string };

/* Tek mega menü öğesi — ikon kutusu + başlık + açıklama, hover'da ok */
function MegaItemCard({ item }: { item: MegaItem }) {
  return (
    <Link
      href={item.href}
      className="group/i flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-alt"
    >
      <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface transition-colors group-hover/i:border-accent/40 group-hover/i:bg-accent/10">
        {item.icon !== undefined ? (
          <ProfileIcon k={item.icon} className="size-6 text-muted transition-colors group-hover/i:text-accent" />
        ) : (
          <Cog className="size-5 text-muted transition-colors group-hover/i:text-accent" strokeWidth={1.6} aria-hidden />
        )}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-semibold text-ink">
          {item.label}
          <ArrowRight
            className="size-3.5 shrink-0 -translate-x-1 text-accent opacity-0 transition-all duration-200 group-hover/i:translate-x-0 group-hover/i:opacity-100"
            strokeWidth={2}
            aria-hidden
          />
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">{item.desc}</span>
      </span>
    </Link>
  );
}

/* Mega menü paneli — kart ızgarası + opsiyonel altın CTA paneli */
function MegaMenu({
  label,
  hubHref,
  items,
  seeAll,
  active,
  overHero,
  cols,
  width,
  featured,
}: {
  label: string;
  hubHref: string;
  items: MegaItem[];
  seeAll: string;
  active: boolean;
  overHero: boolean;
  cols: string;
  width: string;
  featured?: Featured;
}) {
  return (
    <div className="group/mm relative">
      <Link
        href={hubHref}
        aria-current={active ? "page" : undefined}
        className={`relative flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          overHero ? "text-white/85 hover:text-white" : "text-ink hover:text-accent-ink"
        }`}
      >
        {label}
        <ChevronDown className="size-3.5 shrink-0 transition-transform duration-200 group-hover/mm:rotate-180" strokeWidth={1.8} aria-hidden />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-accent transition-transform duration-300 ${
            active ? "scale-x-100" : "scale-x-0 group-hover/mm:scale-x-100"
          }`}
        />
      </Link>

      <div className="invisible absolute start-0 top-full z-50 translate-y-3 pt-3 opacity-0 transition-all duration-200 group-hover/mm:visible group-hover/mm:translate-y-0 group-hover/mm:opacity-100 group-focus-within/mm:visible group-focus-within/mm:translate-y-0 group-focus-within/mm:opacity-100">
        <div className={`flex overflow-hidden rounded-2xl border border-line bg-card shadow-2xl shadow-black/20 ring-1 ring-black/5 ${width}`}>
          {/* Sol: kartlar + tümünü gör */}
          <div className="flex-1 p-2.5">
            <div className={`grid gap-0.5 ${cols}`}>
              {items.map((item) => (
                <MegaItemCard key={item.href} item={item} />
              ))}
            </div>
            <Link
              href={hubHref}
              className="group/all mt-1 flex items-center gap-1.5 rounded-xl px-2.5 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-surface-alt"
            >
              {seeAll}
              <ArrowRight className="size-4 transition-transform group-hover/all:translate-x-0.5" strokeWidth={2} aria-hidden />
            </Link>
          </div>

          {/* Sağ: altın öne çıkan panel */}
          {featured && (
            <div className="relative m-2.5 flex w-[230px] shrink-0 flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent-strong p-5 text-zinc-950">
              <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/15 blur-2xl" />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-15 [background:repeating-linear-gradient(125deg,transparent_0_18px,rgba(0,0,0,0.4)_18px_19px)]"
              />
              <div className="relative">
                <h3 className="font-display text-lg font-extrabold uppercase leading-[1.1]">{featured.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm font-medium text-zinc-950/80">{featured.text}</p>
              </div>
              <SpecularButton href={featured.href} variant="dark" size="md" className="relative mt-4 self-start">
                {featured.cta}
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </SpecularButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const tRoll = useTranslations("products.rollform");
  const tMach = useTranslations("products.machines");
  const tHub = useTranslations("hub");
  const ak = getAkademiUi(useLocale());
  const pathname = usePathname();
  const isActive = useIsActive();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ana sayfada koyu hero var → tepede şeffaf. Diğer sayfalarda hep solid.
  const isHome = pathname === "/";
  const overHero = isHome && !scrolled && !mobileOpen;

  const rollFormMega: MegaItem[] = rollFormItems.map((i) => ({
    label: tRoll(`${i.slug}.name`),
    href: `/roll-form-hatlari/${i.slug}`,
    desc: tRoll(`${i.slug}.short`),
    icon: i.icon,
  }));
  const machineMega: MegaItem[] = machineItems.map((i) => ({
    label: tMach(`${i.slug}.name`),
    href: `/makineler/${i.slug}`,
    desc: tMach(`${i.slug}.short`),
  }));

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
        overHero
          ? "border-b border-transparent bg-transparent"
          : "border-b border-line bg-surface/80 shadow-sm shadow-black/5 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label={t("homeAria")} className="shrink-0">
          <Image
            src="/logo-full.png"
            alt="Servosteel"
            width={256}
            height={113}
            priority
            loading="eager"
            className={`h-14 w-auto transition-[filter] duration-300 ${
              overHero ? "brightness-0 invert" : "dark:invert dark:hue-rotate-180"
            }`}
          />
        </Link>

        <nav className="hidden items-center xl:flex" aria-label={t("mainAria")}>
          <MegaMenu
            label={t("rollform")}
            hubHref="/roll-form-hatlari"
            items={rollFormMega}
            seeAll={t("seeAll")}
            active={isActive("/roll-form-hatlari")}
            overHero={overHero}
            cols="grid-cols-2"
            width="w-[780px]"
            featured={{
              title: tHub("customTitle"),
              text: tHub("customText"),
              cta: tHub("customCta"),
              href: "/teklif-al",
            }}
          />
          <NavLink href="/dilme-hatlari" label={t("slitting")} active={isActive("/dilme-hatlari")} overHero={overHero} />
          <NavLink href="/boy-kesme-hatlari" label={t("ctl")} active={isActive("/boy-kesme-hatlari")} overHero={overHero} />
          <MegaMenu
            label={t("machines")}
            hubHref="/makineler"
            items={machineMega}
            seeAll={t("seeAll")}
            active={isActive("/makineler")}
            overHero={overHero}
            cols="grid-cols-1"
            width="w-[400px]"
          />
          <NavLink href="/hakkimizda" label={t("about")} active={isActive("/hakkimizda")} overHero={overHero} />
          <NavLink href="/akademi" label={ak.nav} active={isActive("/akademi")} overHero={overHero} />
          <NavLink href="/iletisim" label={t("contact")} active={isActive("/iletisim")} overHero={overHero} />
        </nav>

        {/* Sağ araç kümesi */}
        <div className="flex items-center gap-2">
          {overHero ? (
            <SocialIcons
              variant="mono"
              className="hidden gap-1 xl:flex"
              linkClassName="size-8 rounded-md text-white/75 hover:bg-white/10 hover:text-white"
              iconClassName="size-[18px]"
            />
          ) : (
            <SocialIcons
              variant="brand"
              className="hidden gap-1 xl:flex"
              linkClassName="size-8 rounded-md hover:bg-surface-alt"
              iconClassName="size-[18px]"
            />
          )}
          <span className={`mx-1 hidden h-5 w-px xl:block ${overHero ? "bg-white/20" : "bg-line"}`} aria-hidden />
          <div className="hidden xl:block">
            <LanguageSwitcher
              buttonClassName={`rounded-lg border px-3 py-2 transition-colors ${
                overHero
                  ? "border-white/25 text-white hover:bg-white/10"
                  : "border-line text-ink hover:bg-surface-alt"
              }`}
            />
          </div>
          <ThemeToggle
            className={`size-10 transition-colors ${
              overHero ? "text-white hover:bg-white/10" : "text-ink hover:bg-surface-alt"
            }`}
          />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
            className={`flex size-10 items-center justify-center rounded-md transition-colors xl:hidden ${
              overHero ? "text-white hover:bg-white/10" : "text-ink hover:bg-surface-alt"
            }`}
          >
            {mobileOpen ? <X className="size-5" strokeWidth={2} aria-hidden /> : <Menu className="size-5" strokeWidth={2} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobil / tablet menü */}
      {mobileOpen && (
        <div className="border-t border-line bg-surface xl:hidden">
          <nav className="mx-auto max-h-[calc(100svh-5rem)] max-w-7xl space-y-1 overflow-y-auto px-4 py-4" aria-label={t("mobileAria")}>
            <details className="group/d">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt [&::-webkit-details-marker]:hidden">
                {t("rollform")}
                <ChevronDown className="size-3.5 transition-transform duration-200 group-open/d:rotate-180" strokeWidth={1.8} aria-hidden />
              </summary>
              <ul className="mb-2 ms-3 border-s border-line ps-3">
                <li>
                  <Link href="/roll-form-hatlari" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface-alt">
                    {t("seeAll")}
                  </Link>
                </li>
                {rollFormMega.map((item) => (
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
              <ul className="mb-2 ms-3 border-s border-line ps-3">
                {machineMega.map((item) => (
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
            <Link href="/akademi" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt">
              {ak.nav}
            </Link>
            <Link href="/iletisim" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt">
              {t("contact")}
            </Link>

            <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-4">
              <LanguageSwitcher align="left" buttonClassName="rounded-lg border border-line px-3 py-2.5 text-ink hover:bg-surface-alt" />
              <SocialIcons
                variant="brand"
                className="gap-1.5"
                linkClassName="size-9 rounded-md hover:bg-surface-alt"
                iconClassName="size-5"
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

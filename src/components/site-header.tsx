"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, Cog, Menu, Phone, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { SocialIcons } from "@/components/social-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SpecularButton } from "@/components/specular-button";
import { ProfileIcon } from "@/components/profile-icon";
import { SolutionIcon } from "@/components/solution-icon";
import { rollFormItems, machineItems, pageImageOf } from "@/lib/catalog";
import { sectors } from "@/lib/sectors";
import { getAkademiUi } from "@/lib/akademi-ui";
import { CONTACT } from "@/lib/site";

type MegaItem = { label: string; href: string; desc?: string; icon?: string; node?: React.ReactNode; img?: string };

/**
 * Çubuğun alt kenarında ince altın okuma çizgisi — sayfanın ne kadarının
 * kaydırıldığını gösterir. rAF ile kısılır; state değil doğrudan transform
 * yazılır, yani kaydırma sırasında React yeniden çizim yapmaz.
 */
function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute inset-x-5 bottom-0 h-0.5 origin-left rounded-full bg-gradient-to-r from-accent to-accent-strong rtl:origin-right"
      style={{ transform: "scaleX(0)" }}
    />
  );
}

/* Aktif sayfa tespiti (locale önekleri usePathname tarafından kırpılır) */
function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

/* Menü öğesinin yazı/zemin sınıfı — çubuk her yerde beyaz, yazı koyu */
const OGE =
  "relative flex h-10 items-center gap-1 whitespace-nowrap rounded-lg px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-alt";

/* Etkin sayfanın altın alt çizgisi */
function AltCizgi({ active, grup }: { active: boolean; grup: "nl" | "mm" }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-left rounded-full bg-accent transition-transform duration-300 ${
        active ? "scale-x-100" : grup === "nl" ? "scale-x-0 group-hover/nl:scale-x-100" : "scale-x-0 group-hover/mm:scale-x-100"
      }`}
    />
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`group/nl ${OGE}`}>
      {label}
      <AltCizgi active={active} grup="nl" />
    </Link>
  );
}

/* Tek mega menü öğesi — ikon kutusu + başlık + açıklama, hover'da ok */
function MegaItemCard({ item }: { item: MegaItem }) {
  return (
    <Link
      href={item.href}
      className="group/i flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-alt"
    >
      <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface transition-colors group-hover/i:border-accent/40 group-hover/i:bg-accent/10">
        {item.node ??
          (item.icon !== undefined ? (
            <ProfileIcon k={item.icon} className="size-6 text-muted transition-colors group-hover/i:text-accent" />
          ) : (
            <Cog className="size-5 text-muted transition-colors group-hover/i:text-accent" strokeWidth={1.6} aria-hidden />
          ))}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-semibold text-ink">
          {item.label}
          <ArrowRight
            className="size-3.5 shrink-0 -translate-x-1 text-accent opacity-0 transition-all duration-200 group-hover/i:translate-x-0 group-hover/i:opacity-100 rtl:rotate-180"
            strokeWidth={2}
            aria-hidden
          />
        </span>
        {item.desc ? (
          <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">{item.desc}</span>
        ) : null}
      </span>
    </Link>
  );
}

/* Açılır panelin görünürlük sınıfları — üzerine gelince ya da klavyeyle içine girince */
const PANEL_GIZLI = "invisible z-50 translate-y-2 opacity-0 transition-all duration-200";
const PANEL = `${PANEL_GIZLI} group-hover/mm:visible group-hover/mm:translate-y-0 group-hover/mm:opacity-100 group-focus-within/mm:visible group-focus-within/mm:translate-y-0 group-focus-within/mm:opacity-100`;

/**
 * Paneldeki bir bağlantıya basılınca panel kapanır. Panel yalnız CSS ile
 * açılıyor (hover, focus-within); sayfa geçişinde header yerinde kaldığı
 * için fare hâlâ panelin üstünde, tıklanan bağlantı da odakta kalıyordu —
 * panel açık duruyor, sayfa değişmemiş gibi görünüyordu (2026-10-27).
 * Fare gruptan çıkınca, yeniden girince ya da klavye odağı içeri gelince
 * panel eski davranışına döner.
 */
function usePanelKapat() {
  const [kapali, setKapali] = useState(false);
  const ac = () => setKapali(false);
  return {
    kapali,
    grupProps: {
      onClickCapture: (e: React.MouseEvent) => {
        if (!(e.target as HTMLElement).closest("a")) return;
        setKapali(true);
        (document.activeElement as HTMLElement | null)?.blur();
      },
      onMouseLeave: ac,
      onMouseEnter: ac,
      onFocus: ac,
    },
  };
}

function Tetik({ label, active, kapali }: { label: string; active: boolean; kapali: boolean }) {
  return (
    <button type="button" aria-haspopup="true" className={OGE}>
      {label}
      <ChevronDown
        className={`size-3.5 shrink-0 transition-transform duration-200 ${kapali ? "" : "group-hover/mm:rotate-180"}`}
        strokeWidth={1.8}
        aria-hidden
      />
      <AltCizgi active={active} grup="mm" />
    </button>
  );
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group/all mt-1 flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-surface-alt"
    >
      {/* Çeviride ok zaten var ("Tümünü Gör →"); ikon da eklendiği için
          iki ok görünüyordu. Metindeki ok atılır, ikon kalır. */}
      {label.replace(/\s*[→←]\s*$/, "")}
      <ArrowRight className="size-4 transition-transform group-hover/all:translate-x-0.5 rtl:rotate-180" strokeWidth={2} aria-hidden />
    </Link>
  );
}

function PanelBaslik({ children }: { children: React.ReactNode }) {
  return <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{children}</p>;
}

type Featured = { title: string; text: string; cta: string; href: string };

/**
 * "Makineler" — kendi menüsünde, çubuğun en başında (2026-10-28).
 *
 * AGM Line pazardan çekilince yönetim pres besleme makinelerini öne çıkarmak
 * istedi: eski "Ürünler" panelinde roll form listesinin altında kalıyorlardı
 * ("makineler kısmı çok altta"). Kartlar fotoğraflı. Fotoğraflar panel İLK
 * açıldığında yüklenir — panel her sayfada HTML'de gizli duruyor, baştan
 * basılsaydı altı fotoğraf her sayfa açılışında inerdi.
 */
function MakinePaneli({
  label,
  active,
  items,
  seeAll,
}: {
  label: string;
  active: boolean;
  items: MegaItem[];
  seeAll: string;
}) {
  const { kapali, grupProps } = usePanelKapat();
  const [gorsel, setGorsel] = useState(false);
  return (
    <div
      className="group/mm flex h-full items-center"
      {...grupProps}
      onMouseEnter={() => {
        grupProps.onMouseEnter();
        setGorsel(true);
      }}
      onFocus={() => {
        grupProps.onFocus();
        setGorsel(true);
      }}
    >
      <Tetik label={label} active={active} kapali={kapali} />
      <div className={`absolute inset-x-0 top-full pt-2 ${kapali ? PANEL_GIZLI : PANEL}`}>
        <div className="rounded-2xl border border-line bg-card p-2.5 shadow-2xl shadow-black/20 ring-1 ring-black/5">
          <div className="grid grid-cols-3 gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group/i flex items-center gap-3.5 rounded-xl p-2.5 transition-colors hover:bg-surface-alt"
              >
                <span className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-alt">
                  {gorsel && item.img ? (
                    <Image
                      src={item.img}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-300 group-hover/i:scale-105"
                    />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-semibold text-ink">
                    {item.label}
                    <ArrowRight
                      className="size-3.5 shrink-0 -translate-x-1 text-accent opacity-0 transition-all duration-200 group-hover/i:translate-x-0 group-hover/i:opacity-100 rtl:rotate-180"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </span>
                  {item.desc ? (
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">{item.desc}</span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
          <SeeAll href="/makineler" label={seeAll} />
        </div>
      </div>
    </div>
  );
}

/**
 * "Üretim Hatları" — roll form hatları, rulo işleme (dilme, boy kesme) ve
 * özel profil kartı. Panel çubuğun tamamı genişliğinde açılır.
 *
 * 2026-09-17'de dört ayrı menü öğesi tek "Ürünler" panelinde toplanmıştı:
 * menü sekiz öğeye çıkınca yazı 12 px'e inmiş, teklif tuşuna yer kalmamıştı.
 * 2026-10-28'de makineler kendi menüsüne çıktı ve "Ürünler" bu paneli oldu;
 * menü yedi öğe. Bağlantıların hepsi HTML'de — panel CSS ile gizleniyor —
 * arama motorunun gördüğü site içi bağlantılar azalmadı.
 */
function HatPaneli({
  label,
  active,
  roll,
  hatlar,
  rollBaslik,
  seeAll,
  featured,
}: {
  label: string;
  active: boolean;
  roll: MegaItem[];
  hatlar: MegaItem[];
  rollBaslik: string;
  seeAll: string;
  featured: Featured;
}) {
  const { kapali, grupProps } = usePanelKapat();
  return (
    /* static: panel en yakın konumlu ata olan ÇUBUĞA göre açılır.
       h-full: tetikten panele inerken fare çubuğun alt boşluğunda grubun
       dışına çıkmasın, panel kapanmasın. */
    <div className="group/mm flex h-full items-center" {...grupProps}>
      <Tetik label={label} active={active} kapali={kapali} />
      <div className={`absolute inset-x-0 top-full pt-2 ${kapali ? PANEL_GIZLI : PANEL}`}>
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_240px] gap-2 rounded-2xl border border-line bg-card p-2.5 shadow-2xl shadow-black/20 ring-1 ring-black/5">
          <div>
            <PanelBaslik>{rollBaslik}</PanelBaslik>
            <div className="grid grid-cols-2 gap-0.5">
              {roll.map((item) => (
                <MegaItemCard key={item.href} item={item} />
              ))}
            </div>
            <SeeAll href="/roll-form-hatlari" label={seeAll} />
          </div>

          <div className="border-s border-line ps-2">
            {hatlar.map((item) => (
              <MegaItemCard key={item.href} item={item} />
            ))}
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent-strong p-5 text-zinc-950">
            <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/15 blur-2xl" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-15 [background:repeating-linear-gradient(125deg,transparent_0_18px,rgba(0,0,0,0.4)_18px_19px)]"
            />
            <div className="relative">
              {/* Bilerek <h3> DEĞİL: header sayfanın H1'inden önce çizilir,
                  buradaki bir başlık başlık dizilimini bozardı. Menü etiketi. */}
              <p className="font-display text-lg font-extrabold uppercase leading-[1.1]">{featured.title}</p>
              <p className="mt-2 line-clamp-4 text-sm font-medium text-zinc-950/80">{featured.text}</p>
            </div>
            <SpecularButton href={featured.href} variant="dark" size="md" className="relative mt-4 self-start">
              {featured.cta}
              <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2} aria-hidden />
            </SpecularButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Tek sütunlu açılır panel (Sektörler) — tetiğin altında açılır */
function KucukPanel({
  label,
  hubHref,
  items,
  seeAll,
  active,
}: {
  label: string;
  hubHref: string;
  items: MegaItem[];
  seeAll: string;
  active: boolean;
}) {
  const { kapali, grupProps } = usePanelKapat();
  return (
    <div className="group/mm relative flex h-full items-center" {...grupProps}>
      <Tetik label={label} active={active} kapali={kapali} />
      <div className={`absolute start-0 top-full pt-2 ${kapali ? PANEL_GIZLI : PANEL}`}>
        <div className="w-[420px] rounded-2xl border border-line bg-card p-2.5 shadow-2xl shadow-black/20 ring-1 ring-black/5">
          {items.map((item) => (
            <MegaItemCard key={item.href} item={item} />
          ))}
          <SeeAll href={hubHref} label={seeAll} />
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
  const tSec = useTranslations("sectors");
  const tHome = useTranslations("home");
  const tRulo = useTranslations("ruloIsleme");
  const tFair = useTranslations("fairs");
  const ak = getAkademiUi(useLocale());
  const isActive = useIsActive();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuInnerRef = useRef<HTMLDivElement>(null);

  /**
   * Menü yüksekliğini --menu-h değişkenine yazar (CSS oradan animasyonlar).
   * ResizeObserver kullanılıyor ki içerideki alt menü (<details>) açıldığında
   * da yükseklik anında güncellensin; sabit ölçüm bayatlardı.
   */
  useEffect(() => {
    const el = menuRef.current;
    const inner = menuInnerRef.current;
    if (!el || !inner) return;
    const sync = () => el.style.setProperty("--menu-h", `${inner.scrollHeight}px`);

    /* İlk ölçüm doğrudan yapılır: ResizeObserver'ın ilk çağrısı render
       döngüsüne bağlıdır ve sekme arka plandayken hiç gelmeyebilir. */
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(inner);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  const kapat = () => setMobileOpen(false);

  const rollFormMega: MegaItem[] = rollFormItems.map((i) => ({
    label: tRoll(`${i.slug}.name`),
    href: `/roll-form-hatlari/${i.slug}`,
    desc: tRoll(`${i.slug}.short`),
    icon: i.icon,
  }));
  const hatMega: MegaItem[] = [
    /* Üst sayfa başta: "coil processing line" arayan alıcı önce üçünün farkını
       öğrenmek istiyor (bkz. rulo-isleme-hatlari/page.tsx) */
    {
      label: tRulo("nav"),
      href: "/rulo-isleme-hatlari",
      desc: tRulo("short"),
    },
    {
      label: t("slitting"),
      href: "/dilme-hatlari",
      desc: tHome("solutions.slitting.desc"),
      node: <SolutionIcon name="slitting" className="size-6 text-muted transition-colors group-hover/i:text-accent" />,
    },
    {
      label: t("ctl"),
      href: "/boy-kesme-hatlari",
      desc: tHome("solutions.ctl.desc"),
      node: <SolutionIcon name="ctl" className="size-6 text-muted transition-colors group-hover/i:text-accent" />,
    },
  ];
  const machineMega: MegaItem[] = machineItems.map((i) => ({
    label: tMach(`${i.slug}.name`),
    href: `/makineler/${i.slug}`,
    desc: tMach(`${i.slug}.short`),
    img: pageImageOf(i.slug),
  }));
  /* Uygulama sektörleri — alıcı makineyi değil kendi sektörünü arıyor,
     o yüzden menüde ürünlerle aynı seviyede duruyor (bkz. lib/sectors.ts). */
  const sectorMega: MegaItem[] = sectors.map((s) => ({
    label: tSec(`items.${s.slug}.name`),
    href: `/uygulamalar/${s.slug}`,
    desc: tSec(`items.${s.slug}.short`),
  }));

  const hatlarAktif =
    isActive("/roll-form-hatlari") ||
    isActive("/rulo-isleme-hatlari") ||
    isActive("/dilme-hatlari") ||
    isActive("/boy-kesme-hatlari");

  const mobilSatir = "block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt";
  const mobilAlt = "block rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface-alt";
  const ozet =
    "flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-alt [&::-webkit-details-marker]:hidden";

  return (
    <header
      /* viewTransitionName: sayfa geçişinde header kıpırdamaz — kullanıcının
         mekânsal çapası (globals.css ::view-transition-group(site-header)) */
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-50 px-2 py-2 sm:px-4"
    >
      {/*
        ÇUBUK — kenarlardan ayrık, yuvarlak köşeli, HER YERDE BEYAZ ZEMİN SİYAH
        YAZI (2026-09-17, Yasin: "beyaz üstü siyah olsun"). Önceden video
        üstünde şeffaftı ve beyaz yazı ışıklı karede okunmuyordu.

        Zemin DÜZ RENK, bulanıklık (backdrop-blur) yok: çubuk videonun
        üstünde duruyor ve bulanıklık oynayan videoda her karede yeniden
        hesaplanırdı — zayıf cihazda takılmaya katkı yapar.
      */}
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-3 shadow-lg shadow-black/10 sm:px-4 2xl:gap-4">
        <Link href="/" aria-label={t("homeAria")} className="relative shrink-0">
          {/* Açık zeminde: orijinal logo (altın + koyu yazı). `priority` yok —
              ürettiği preload farklı genişlik istediği için kullanılmıyordu. */}
          <Image
            src="/logo-full.png"
            alt="Servosteel"
            width={256}
            height={113}
            fetchPriority="high"
            className="h-11 w-auto min-[360px]:h-12 xl:h-11 dark:opacity-0"
          />
          {/* Koyu temada: altın korunur, yazı beyaz */}
          <Image
            src="/logo-full-light.png"
            alt=""
            aria-hidden
            width={256}
            height={113}
            className="absolute inset-0 h-11 w-auto opacity-0 min-[360px]:h-12 xl:h-11 dark:opacity-100"
          />
        </Link>

        <nav className="hidden h-full items-center xl:flex" aria-label={t("mainAria")}>
          <MakinePaneli
            label={t("machines")}
            active={isActive("/makineler")}
            items={machineMega}
            seeAll={t("seeAll")}
          />
          <HatPaneli
            label={t("lines")}
            active={hatlarAktif}
            roll={rollFormMega}
            hatlar={hatMega}
            rollBaslik={t("rollform")}
            seeAll={t("seeAll")}
            featured={{
              title: tHub("customTitle"),
              text: tHub("customText"),
              cta: tHub("customCta"),
              href: "/teklif-al",
            }}
          />
          <KucukPanel
            label={t("sectors")}
            hubHref="/uygulamalar"
            items={sectorMega}
            seeAll={t("seeAll")}
            active={isActive("/uygulamalar")}
          />
          <NavLink href="/akademi" label={ak.nav} active={isActive("/akademi")} />
          <NavLink href="/fuarlar" label={tFair("title")} active={isActive("/fuarlar")} />
          <NavLink href="/hakkimizda" label={t("about")} active={isActive("/hakkimizda")} />
          <NavLink href="/iletisim" label={t("contact")} active={isActive("/iletisim")} />
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher
            buttonClassName="rounded-lg border border-line px-2 py-1.5 text-sm text-ink transition-colors hover:bg-surface-alt xl:px-3 xl:py-2"
          />
          <ThemeToggle
            className="size-10 text-ink transition-colors hover:bg-surface-alt"
          />
          {/* Teklif tuşu her sayfada görünür. Önceden menüde yoktu: sekiz
              öğe 1280 px'i doldurduğu için sığmıyordu. */}
          {/* Telefonda gizli: logo + dil + tema + menü düğmesiyle çubuk doluyor,
              teklif tuşu menüyü ekran dışına itiyordu. Telefonda teklif tuşu
              açılan menünün en üstünde. Sarmalayıcı şart — tuşun kendi
              `inline-flex` sınıfı `hidden`'ı eziyordu. */}
          <div className="hidden sm:block">
            <SpecularButton href="/teklif-al" variant="gold" size="md">
              {t("quote")}
            </SpecularButton>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
            className="flex size-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-surface-alt xl:hidden"
          >
            {/* İki ikon üst üste durur; açık/kapalı duruma göre dönerek yer değiştirir */}
            <span className="relative block size-5">
              <Menu className={`menu-icon absolute inset-0 size-5 ${mobileOpen ? "menu-icon-hidden" : ""}`} strokeWidth={2} aria-hidden />
              <X className={`menu-icon absolute inset-0 size-5 ${mobileOpen ? "" : "menu-icon-hidden"}`} strokeWidth={2} aria-hidden />
            </span>
          </button>
        </div>

        {/* Okuma ilerlemesi */}
        <ScrollProgress />
      </div>

      {/*
        Mobil / tablet menü — çubuğun altında ayrı bir kart. İçerik DOM'da
        kalır, yükseklik animasyonlanır. Kapalıyken inert: bağlantılar Tab
        sırasına ve ekran okuyucuya girmez, görünmez menü tuzağı oluşmaz.
      */}
      <div ref={menuRef} className={`menu-collapse mx-auto max-w-7xl xl:hidden ${mobileOpen ? "is-open" : ""}`}>
        <div ref={menuInnerRef} inert={!mobileOpen} className="pt-2">
          <nav
            className="menu-stagger max-h-[calc(100svh-6rem)] space-y-1 overflow-y-auto rounded-2xl border border-line bg-surface p-3 shadow-xl shadow-black/10"
            aria-label={t("mobileAria")}
          >
            {/* Önce eylem: teklif ve arama */}
            <div className="mb-2 grid grid-cols-2 gap-2">
              <SpecularButton href="/teklif-al" variant="gold" size="md" className="w-full" onClick={kapat}>
                {t("quote")}
              </SpecularButton>
              <a
                href={CONTACT.phoneHref}
                onClick={kapat}
                className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line px-2 text-[13px] font-semibold text-ink hover:bg-surface-alt"
              >
                <Phone className="size-4" strokeWidth={2.2} aria-hidden />
                {CONTACT.phoneDisplay}
              </a>
            </div>

            {/* Masaüstüyle aynı sıra: önce makineler, sonra üretim hatları */}
            <details className="group/d">
              <summary className={ozet}>
                {t("machines")}
                <ChevronDown className="size-3.5 transition-transform duration-200 group-open/d:rotate-180" strokeWidth={1.8} aria-hidden />
              </summary>
              <ul className="mb-2 ms-3 border-s border-line ps-3">
                <li>
                  <Link href="/makineler" onClick={kapat} className={`${mobilAlt} font-medium`}>
                    {t("seeAll")}
                  </Link>
                </li>
                {machineMega.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={kapat} className={mobilAlt}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
            <details className="group/d">
              <summary className={ozet}>
                {t("lines")}
                <ChevronDown className="size-3.5 transition-transform duration-200 group-open/d:rotate-180" strokeWidth={1.8} aria-hidden />
              </summary>
              <ul className="mb-2 ms-3 border-s border-line ps-3">
                {hatMega.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={kapat} className={`${mobilAlt} font-medium`}>
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/roll-form-hatlari" onClick={kapat} className={`${mobilAlt} mt-1 font-medium`}>
                    {t("rollform")}
                  </Link>
                </li>
                {rollFormMega.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={kapat} className={`${mobilAlt} ps-6`}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
            <details className="group/d">
              <summary className={ozet}>
                {t("sectors")}
                <ChevronDown className="size-3.5 transition-transform duration-200 group-open/d:rotate-180" strokeWidth={1.8} aria-hidden />
              </summary>
              <ul className="mb-2 ms-3 border-s border-line ps-3">
                {sectorMega.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={kapat} className={mobilAlt}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
            <Link href="/akademi" onClick={kapat} className={mobilSatir}>
              {ak.nav}
            </Link>
            <Link href="/fuarlar" onClick={kapat} className={mobilSatir}>
              {tFair("title")}
            </Link>
            <Link href="/hakkimizda" onClick={kapat} className={mobilSatir}>
              {t("about")}
            </Link>
            <Link href="/iletisim" onClick={kapat} className={mobilSatir}>
              {t("contact")}
            </Link>

            <div className="mt-2 flex items-center justify-center border-t border-line pt-3">
              <SocialIcons
                variant="brand"
                className="gap-1.5"
                linkClassName="size-9 rounded-md hover:bg-surface-alt"
                iconClassName="size-5"
              />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

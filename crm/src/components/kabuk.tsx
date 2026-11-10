"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  Contact,
  Ellipsis,
  FileText,
  Globe,
  LayoutGrid,
  ListChecks,
  LogOut,
  MailOpen,
  Menu,
  PieChart,
  Search,
  SquareKanban,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * Uygulama kabuğu: solda daraltılabilir kenar menü, üstte arama ve kullanıcı
 * menüsü. Görünüm dekoartizan yönetim panelinin (TailAdmin) AppSidebar ve
 * AppHeader'ından. Menü yalnız gezinme; yetki kontrolü sayfalarda.
 */

type AltOge = { ad: string; href: string; etkin: (yol: string) => boolean };
type Oge = { ad: string; simge: LucideIcon; href: string; alt?: AltOge[] };

const altinda = (yol: string, href: string) =>
  href === "/" ? yol === "/" : yol === href || yol.startsWith(`${href}/`);

function menuler(yonetici: boolean, yazabilir: boolean): { ana: Oge[]; diger: Oge[] } {
  const firmalar: Oge = yazabilir
    ? {
        ad: "Firmalar",
        simge: Building2,
        href: "/firmalar",
        alt: [
          { ad: "Tüm firmalar", href: "/firmalar", etkin: (y) => altinda(y, "/firmalar") && y !== "/firmalar/yeni" },
          { ad: "Firma ekle", href: "/firmalar/yeni", etkin: (y) => y === "/firmalar/yeni" },
        ],
      }
    : { ad: "Firmalar", simge: Building2, href: "/firmalar" };
  return {
    ana: [
      { ad: "Pano", simge: LayoutGrid, href: "/" },
      { ad: "Etkinlikler", simge: CalendarDays, href: "/etkinlikler" },
      firmalar,
      { ad: "Kişiler", simge: Contact, href: "/kisiler" },
      { ad: "Gelen talepler", simge: MailOpen, href: "/yanitlar" },
      { ad: "Satış hunisi", simge: SquareKanban, href: "/huni" },
      { ad: "Görevler", simge: ListChecks, href: "/gorevler" },
      { ad: "Teklifler", simge: FileText, href: "/teklifler" },
      { ad: "Servis", simge: Wrench, href: "/servis" },
    ],
    diger: [
      { ad: "Raporlar", simge: PieChart, href: "/raporlar" },
      { ad: "Harita", simge: Globe, href: "/harita" },
      ...(yonetici ? [{ ad: "Kullanıcılar", simge: Users, href: "/kullanicilar" }] : []),
    ],
  };
}

const basHarfler = (ad: string) =>
  ad
    .split(/\s+/)
    .map((p) => p.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toLocaleUpperCase("tr"))
    .join("");

export type Bildirim = { geciken: number; bugun: number; gelen: number };

export function Kabuk({
  ad,
  rol,
  yonetici,
  yazabilir,
  bildirim,
  cikis,
  children,
}: {
  ad: string;
  rol: string;
  yonetici: boolean;
  yazabilir: boolean;
  bildirim: Bildirim;
  cikis: () => Promise<void>;
  children: React.ReactNode;
}) {
  const yol = usePathname();
  const [genis, setGenis] = useState(true);
  const [uzerinde, setUzerinde] = useState(false);
  const [mobilAcik, setMobilAcik] = useState(false);
  /* Kullanıcının elle açıp kapadığı alt menüler; dokunulmayan, içindeki
     sayfadaysa açık durur. */
  const [elle, setElle] = useState<Record<string, boolean>>({});
  const { ana, diger } = menuler(yonetici, yazabilir);
  const etiket = genis || uzerinde || mobilAcik;

  const kapatMobil = () => setMobilAcik(false);
  const tikla = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setGenis((g) => !g);
    else setMobilAcik((a) => !a);
  };

  const grup = (baslik: string, ogeler: Oge[]) => (
    <div>
      <h2 className={`mb-4 flex text-xs leading-5 text-gray-400 uppercase ${etiket ? "justify-start" : "lg:justify-center"}`}>
        {etiket ? baslik : <Ellipsis size={22} />}
      </h2>
      <ul className="flex flex-col gap-1.5">
        {ogeler.map((o) => {
          const Simge = o.simge;
          if (o.alt) {
            const icinde = o.alt.some((a) => a.etkin(yol));
            const acik = elle[o.ad] ?? icinde;
            return (
              <li key={o.ad}>
                <button
                  type="button"
                  onClick={() => setElle((e) => ({ ...e, [o.ad]: !acik }))}
                  className={`menu-item group ${acik || icinde ? "menu-item-active" : "menu-item-inactive"} ${
                    etiket ? "lg:justify-start" : "lg:justify-center"
                  }`}
                  aria-expanded={acik}
                  title={etiket ? undefined : o.ad}
                >
                  <Simge size={22} strokeWidth={1.75} className={acik || icinde ? "menu-item-icon-active" : "menu-item-icon-inactive"} />
                  {etiket ? (
                    <>
                      <span>{o.ad}</span>
                      <ChevronDown size={20} className={`ml-auto transition-transform duration-200 ${acik ? "rotate-180 text-brand-500" : ""}`} />
                    </>
                  ) : null}
                </button>
                {etiket ? (
                  <div className={`grid transition-[grid-template-rows] duration-300 ${acik ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <ul className="ml-9 space-y-1 overflow-hidden">
                      {o.alt.map((a, i) => (
                        <li key={a.href} className={i === 0 ? "mt-2" : ""}>
                          <Link
                            href={a.href}
                            onClick={kapatMobil}
                            className={`menu-dropdown-item ${a.etkin(yol) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}
                          >
                            {a.ad}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          }
          const etkin = altinda(yol, o.href);
          return (
            <li key={o.ad}>
              <Link
                href={o.href}
                onClick={kapatMobil}
                title={etiket ? undefined : o.ad}
                className={`menu-item group ${etkin ? "menu-item-active" : "menu-item-inactive"} ${
                  etiket ? "lg:justify-start" : "lg:justify-center"
                }`}
              >
                <Simge size={22} strokeWidth={1.75} className={etkin ? "menu-item-icon-active" : "menu-item-icon-inactive"} />
                {etiket ? <span>{o.ad}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside
        onMouseEnter={() => !genis && setUzerinde(true)}
        onMouseLeave={() => setUzerinde(false)}
        className={`fixed top-0 left-0 z-40 mt-16 flex h-[calc(100dvh-4rem)] w-[290px] flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0 lg:h-dvh lg:translate-x-0 ${
          genis || uzerinde ? "" : "lg:w-[90px]"
        } ${mobilAcik ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`hidden py-8 lg:flex ${etiket ? "justify-start" : "justify-center"}`}>
          <Link href="/" className="flex items-center gap-2" title="Servosteel CRM">
            {etiket ? (
              <>
                <Image src="/logo-full.png" alt="Servosteel" width={256} height={113} priority className="h-12 w-auto" />
                <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-theme-xs font-semibold text-brand-500">CRM</span>
              </>
            ) : (
              <Image src="/logo-simge.png" alt="Servosteel" width={113} height={113} priority className="size-11" />
            )}
          </Link>
        </div>
        <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pt-6 pb-6 lg:pt-0">
          {grup("Menü", ana)}
          {grup("Diğer", diger)}
        </nav>
      </aside>

      {mobilAcik ? <div className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden" onClick={kapatMobil} aria-hidden /> : null}

      <div className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${genis ? "lg:ml-[290px]" : "lg:ml-[90px]"}`}>
        <header className="sticky top-0 z-40 flex w-full border-gray-200 bg-white lg:border-b">
          <div className="flex grow items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:border-b-0 lg:px-6 lg:py-4">
            <button
              type="button"
              onClick={tikla}
              aria-label="Menüyü aç / kapat"
              className="flex size-10 items-center justify-center rounded-lg text-gray-500 lg:size-11 lg:border lg:border-gray-200 lg:hover:bg-gray-50"
            >
              {mobilAcik ? <X size={22} /> : <Menu size={20} />}
            </button>

            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <Image src="/logo-full.png" alt="Servosteel" width={256} height={113} className="h-9 w-auto" />
            </Link>

            <form action="/ara" className="relative hidden lg:block">
              <Search size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500" />
              <input
                name="q"
                placeholder="Firma, kişi, teklif ara…"
                aria-label="Firma, kişi, teklif ara"
                className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pr-4 pl-12 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none xl:w-[430px]"
              />
            </form>

            <div className="flex items-center gap-2 lg:ml-auto">
              <Link
                href="/ara"
                aria-label="Ara"
                className="flex size-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
              >
                <Search size={18} />
              </Link>
              <Bildirimler b={bildirim} />
              <KullaniciMenusu ad={ad} rol={rol} cikis={cikis} />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

/** Başlıktaki zil: geciken ve bugünkü görevlerim, CRM'e alınmayı bekleyen talepler. */
function Bildirimler({ b }: { b: Bildirim }) {
  const [acik, setAcik] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);
  const toplam = b.geciken + b.bugun + b.gelen;

  useEffect(() => {
    if (!acik) return;
    const disari = (e: MouseEvent) => {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAcik(false);
    document.addEventListener("mousedown", disari);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", disari);
      document.removeEventListener("keydown", esc);
    };
  }, [acik]);

  const satirlar = [
    { ad: "Geciken görevlerim", sayi: b.geciken, href: "/gorevler?g=benim", renk: "bg-error-50 text-error-600" },
    { ad: "Bugünkü görevlerim", sayi: b.bugun, href: "/gorevler?g=benim", renk: "bg-warning-50 text-warning-600" },
    { ad: "CRM'e alınmayı bekleyen talep ve yanıt", sayi: b.gelen, href: "/yanitlar", renk: "bg-brand-50 text-brand-500" },
  ];

  return (
    <div ref={kutu} className="relative">
      <button
        type="button"
        onClick={() => setAcik((a) => !a)}
        aria-expanded={acik}
        aria-label={`Bildirimler${toplam ? `: ${toplam}` : ""}`}
        className="relative flex size-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:size-11"
      >
        <Bell size={20} />
        {toplam ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white">
            {toplam > 99 ? "99+" : toplam}
          </span>
        ) : null}
      </button>
      {acik ? (
        <div className="absolute right-0 z-50 mt-[17px] w-[300px] rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg">
          <h3 className="px-2 pb-2 text-theme-sm font-semibold text-gray-800">Bildirimler</h3>
          <ul className="space-y-1">
            {satirlar.map((s) => (
              <li key={s.ad}>
                <Link
                  href={s.href}
                  onClick={() => setAcik(false)}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-theme-sm text-gray-700 hover:bg-gray-100"
                >
                  {s.ad}
                  <span className={`rounded-full px-2 py-0.5 text-theme-xs font-semibold tabular-nums ${s.sayi ? s.renk : "bg-gray-100 text-gray-400"}`}>
                    {s.sayi}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function KullaniciMenusu({ ad, rol, cikis }: { ad: string; rol: string; cikis: () => Promise<void> }) {
  const [acik, setAcik] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    const disari = (e: MouseEvent) => {
      if (kutu.current && !kutu.current.contains(e.target as Node)) setAcik(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAcik(false);
    document.addEventListener("mousedown", disari);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", disari);
      document.removeEventListener("keydown", esc);
    };
  }, [acik]);

  return (
    <div ref={kutu} className="relative">
      <button type="button" onClick={() => setAcik((a) => !a)} className="flex items-center text-gray-700" aria-expanded={acik}>
        <span className="mr-3 flex size-11 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-500">
          {basHarfler(ad) || "?"}
        </span>
        <span className="mr-1 hidden text-theme-sm font-medium sm:block">{ad}</span>
        <ChevronDown size={18} className={`text-gray-500 transition-transform duration-200 ${acik ? "rotate-180" : ""}`} />
      </button>

      {acik ? (
        <div className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg">
          <div>
            <span className="block text-theme-sm font-medium text-gray-700">{ad}</span>
            <span className="mt-0.5 block text-theme-xs text-gray-500">{rol}</span>
          </div>
          <form action={cikis} className="mt-3 border-t border-gray-200 pt-3">
            <button
              type="submit"
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut size={22} strokeWidth={1.75} className="text-gray-500 group-hover:text-gray-700" />
              Çıkış yap
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Ellipsis,
  ExternalLink,
  History,
  Inbox,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { cikisEylemi, nabizEylemi } from "./actions";
import { MENU_CEREZ } from "./menu-tercihi";

/**
 * Panel kabuğu — çizim. Düzen dekoartizan panelindeki gibi:
 *
 *  - Masaüstünde menü ikon şeridi olarak durur, üzerine gelince açılır,
 *    fare çekilince kapanır. Açılırken içeriği İTMEZ, üstüne biner — itseydi
 *    fare her kenara değdiğinde talep tablosu sağa sola kayardı.
 *  - Üst çubuktaki tuş menüyü açık tutar; tercih çerezde saklanır.
 *  - Mobilde üst çubuktaki tuşla soldan çekmece açılır.
 *
 * "Kullanıcılar" ve "Kayıtlar" yalnızca yöneticiye görünür — ama bu SADECE
 * görünüm; asıl kilit sunucu eylemlerinde ve sayfanın kendisinde.
 */

export type PanelBolum = "talepler" | "firmalar" | "kullanicilar" | "kayitlar" | "profil";

/* Nabız: panelde geçen süre kayda doğru yazılsın diye (bkz. lib/panel-kayit). */
const NABIZ_MS = 60_000;
const HAREKETSIZ_MS = 5 * 60_000;

type DurumSatiri = { anahtar: string; etiket: string; adet: number | null };

/* Her sayfa kendi kabuğunu çizdiği için gezinmede kabuk yeniden kuruluyor.
   Durum modülde tutulmasaydı, açık menüden bir bağlantıya tıklayınca yeni
   sayfada menü kapalı başlar, fare kıpırdayınca yeniden açılırdı. */
let sonUstunde = false;
let sonSabit: boolean | null = null;
let sonAltAcik: boolean | null = null;

const GENIS = "lg:w-[264px]";
const DAR = "lg:w-20";

export function PanelKabugu({
  aktif,
  durum,
  kullanici,
  admin,
  ilkSabit,
  durumlar,
  toplam,
  children,
}: {
  aktif: PanelBolum;
  durum?: string;
  kullanici: string;
  admin: boolean;
  ilkSabit: boolean;
  durumlar: DurumSatiri[];
  toplam: number | null;
  children: React.ReactNode;
}) {
  const [sabit, setSabitHam] = useState(() => sonSabit ?? ilkSabit);
  const [ustunde, setUstundeHam] = useState(() => sonUstunde);
  const [altAcik, setAltAcikHam] = useState(() => sonAltAcik ?? aktif === "talepler");
  const [mobilAcik, setMobilAcik] = useState(false);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setUstunde = (v: boolean) => {
    sonUstunde = v;
    setUstundeHam(v);
  };
  const setAltAcik = (v: boolean) => {
    sonAltAcik = v;
    setAltAcikHam(v);
  };

  /* Küçük gecikme: fare ekranın soluna yalnızca değip geçtiğinde menü
     açılıp kapanıp göz yormasın. */
  const ustundeGecikmeli = (v: boolean, ms: number) => {
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => setUstunde(v), ms);
  };

  useEffect(
    () => () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    },
    []
  );

  useEffect(() => {
    if (!mobilAcik) return;
    const tus = (e: KeyboardEvent) => e.key === "Escape" && setMobilAcik(false);
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [mobilAcik]);

  /* Dakikalık nabız — oturumun son etkinliğini günceller. Talep okurken
     sayfa değişmediği için sunucu kişinin hâlâ orada olduğunu bilemiyordu.
     Yalnızca sekme GÖRÜNÜRKEN ve son 5 dakikada fare/klavye/dokunma varken
     atar: arka planda unutulan ya da başından kalkılan panel süre yazmaz. */
  useEffect(() => {
    let sonHareket = Date.now();
    const hareket = () => {
      sonHareket = Date.now();
    };
    const olaylar = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"];
    olaylar.forEach((o) => window.addEventListener(o, hareket, { passive: true }));
    const nabiz = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - sonHareket > HAREKETSIZ_MS) return;
      nabizEylemi().catch(() => {});
    }, NABIZ_MS);
    return () => {
      clearInterval(nabiz);
      olaylar.forEach((o) => window.removeEventListener(o, hareket));
    };
  }, []);

  function sabitDegistir() {
    const yeni = !sabit;
    sonSabit = yeni;
    setSabitHam(yeni);
    setUstunde(false);
    document.cookie = `${MENU_CEREZ}=${yeni ? "acik" : "kapali"}; path=/admin; max-age=31536000; samesite=lax`;
  }

  /* Masaüstünde yazılar görünsün mü? Mobil çekmecede her zaman görünür —
     aşağıdaki sınıfların hepsi `lg:` önekli. */
  const genis = sabit || ustunde;
  const yazi = genis ? "" : "lg:sr-only"; // ekran okuyucu yine okur
  const suslu = genis ? "" : "lg:hidden"; // rozet, ok gibi süsler

  const kapatMobil = () => setMobilAcik(false);
  const yeni = durumlar.find((d) => d.anahtar === "yeni")?.adet ?? 0;

  const oge = (etkin: boolean) =>
    `group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      genis ? "" : "lg:justify-center lg:px-0"
    } ${etkin ? "bg-accent/15 text-ink" : "text-ink/80 hover:bg-surface-alt hover:text-ink"}`;
  const ikon = (etkin: boolean) =>
    `size-5 shrink-0 ${etkin ? "text-accent-ink" : "text-muted group-hover:text-ink"}`;

  const baslik = (metin: string) => (
    <h2
      className={`mb-2 flex h-5 items-center px-3 text-[11px] font-semibold uppercase tracking-wider text-muted ${
        genis ? "" : "lg:justify-center lg:px-0"
      }`}
    >
      <span className={yazi}>{metin}</span>
      {genis ? null : <Ellipsis className="hidden size-5 lg:block" aria-hidden />}
    </h2>
  );

  const altOgeler: DurumSatiri[] = [
    { anahtar: "tumu", etiket: "Tümü", adet: toplam },
    ...durumlar,
  ];

  return (
    <div className="min-h-dvh bg-surface-alt">
      {/* ------------------------------------------------------ menü */}
      <aside
        id="panel-menu"
        onMouseEnter={sabit ? undefined : () => ustundeGecikmeli(true, 90)}
        onMouseLeave={sabit ? undefined : () => ustundeGecikmeli(false, 180)}
        onFocus={(e) => {
          /* Klavyeyle menüye girilince de açılsın; fareyle tıklamada
             zaten üzerinde olunduğu için gerekmiyor. */
          if (!sabit && e.target.matches(":focus-visible")) setUstunde(true);
        }}
        onBlur={(e) => {
          if (!sabit && !e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setUstunde(false);
          }
        }}
        className={`fixed bottom-0 left-0 top-16 z-40 flex w-[264px] flex-col overflow-hidden border-r border-line bg-card transition-[width,translate,visibility,box-shadow] duration-300 ease-in-out lg:visible lg:top-0 lg:z-[60] lg:translate-x-0 ${
          mobilAcik ? "visible translate-x-0 shadow-xl" : "invisible -translate-x-full"
        } ${genis ? GENIS : DAR} ${ustunde && !sabit ? "lg:shadow-xl" : "lg:shadow-none"}`}
      >
        <div
          className={`hidden h-16 shrink-0 items-center border-b border-line lg:flex ${
            genis ? "px-6" : "justify-center"
          }`}
        >
          <Link
            href="/admin"
            onClick={kapatMobil}
            aria-label="Talepler"
            className={`block h-10 overflow-hidden transition-[width] duration-300 ${
              genis ? "w-[91px]" : "w-10"
            }`}
          >
            {/* Dar menüde yalnızca dişli amblem görünüyor: logo 256×113,
                amblem soldaki kare kısım. Kutu 40 px'e daralınca yazı
                kırpılıyor. */}
            <Image
              src="/logo-full.png"
              alt="Servosteel"
              width={256}
              height={113}
              className="h-10 w-auto max-w-none"
            />
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-5">
          <nav aria-label="Panel menüsü" className="flex flex-col gap-6">
            <div>
              {baslik("Menü")}
              <ul className="flex flex-col gap-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setAltAcik(!altAcik)}
                    aria-expanded={altAcik}
                    aria-controls="alt-talepler"
                    className={oge(aktif === "talepler")}
                  >
                    <span className="relative">
                      <Inbox className={ikon(aktif === "talepler")} aria-hidden />
                      {yeni ? (
                        <span
                          className={`absolute -right-1 -top-1 size-2.5 rounded-full bg-accent ring-2 ring-card ${
                            genis ? "hidden" : "hidden lg:block"
                          }`}
                          aria-hidden
                        />
                      ) : null}
                    </span>
                    <span className={`flex-1 whitespace-nowrap text-left ${yazi}`}>
                      Talepler
                      {yeni ? <span className="sr-only">, {yeni} yeni</span> : null}
                    </span>
                    {yeni ? (
                      <span
                        className={`rounded-full bg-accent px-2 py-1 text-[11px] font-bold leading-none text-zinc-950 ${suslu}`}
                        aria-hidden
                      >
                        {yeni}
                      </span>
                    ) : null}
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted transition-transform duration-200 ${
                        altAcik ? "rotate-180" : ""
                      } ${suslu}`}
                      aria-hidden
                    />
                  </button>

                  {/* Alt menü yüksekliği grid satırıyla açılıp kapanıyor;
                      kapalıyken `inert` — gizli bağlantılar Tab ile
                      gezilmesin. */}
                  <div
                    id="alt-talepler"
                    inert={!altAcik}
                    className={`grid transition-[grid-template-rows] duration-300 ${
                      altAcik ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    } ${suslu}`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <ul className="ml-[22px] mt-1 flex flex-col gap-0.5 border-l border-line pl-3">
                        {altOgeler.map((d) => {
                          const secili = aktif === "talepler" && durum === d.anahtar;
                          const vurgu = d.anahtar === "yeni" && !!d.adet;
                          return (
                            <li key={d.anahtar}>
                              <Link
                                href={d.anahtar === "tumu" ? "/admin" : `/admin?durum=${d.anahtar}`}
                                onClick={kapatMobil}
                                aria-current={secili ? "page" : undefined}
                                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                                  secili
                                    ? "bg-accent/15 font-semibold text-ink"
                                    : "text-muted hover:bg-surface-alt hover:text-ink"
                                }`}
                              >
                                {d.etiket}
                                {/* Sıfırlar yazılmıyor: sekiz satırın altısında
                                    "0" okumak gürültü. Rozet yoksa kayıt yok. */}
                                {d.adet ? (
                                  <span
                                    className={`ml-auto rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums ${
                                      vurgu ? "bg-accent text-zinc-950" : "bg-surface-alt text-muted"
                                    }`}
                                  >
                                    {d.adet}
                                  </span>
                                ) : null}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </li>

                {/* Tanıtım e-postası — herkese açık: gönderimi satış yapıyor.
                    Sigortayı elle kaldırmak yalnızca yöneticide (sunucuda). */}
                <li>
                  <Link
                    href="/admin/firmalar"
                    onClick={kapatMobil}
                    aria-current={aktif === "firmalar" ? "page" : undefined}
                    className={oge(aktif === "firmalar")}
                  >
                    <Send className={ikon(aktif === "firmalar")} aria-hidden />
                    <span className={`whitespace-nowrap ${yazi}`}>Hedef firmalar</span>
                  </Link>
                </li>

                {admin ? (
                  <li>
                    <Link
                      href="/admin/kullanicilar"
                      onClick={kapatMobil}
                      aria-current={aktif === "kullanicilar" ? "page" : undefined}
                      className={oge(aktif === "kullanicilar")}
                    >
                      <Users className={ikon(aktif === "kullanicilar")} aria-hidden />
                      <span className={`whitespace-nowrap ${yazi}`}>Kullanıcılar</span>
                    </Link>
                  </li>
                ) : null}

                {admin ? (
                  <li>
                    <Link
                      href="/admin/kayitlar"
                      onClick={kapatMobil}
                      aria-current={aktif === "kayitlar" ? "page" : undefined}
                      className={oge(aktif === "kayitlar")}
                    >
                      <History className={ikon(aktif === "kayitlar")} aria-hidden />
                      <span className={`whitespace-nowrap ${yazi}`}>Kayıtlar</span>
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>

            <div>
              {baslik("Hesap")}
              <ul className="flex flex-col gap-1">
                <li>
                  <Link
                    href="/admin/profil"
                    onClick={kapatMobil}
                    aria-current={aktif === "profil" ? "page" : undefined}
                    className={oge(aktif === "profil")}
                  >
                    <UserCog className={ikon(aktif === "profil")} aria-hidden />
                    <span className={`whitespace-nowrap ${yazi}`}>Profil</span>
                  </Link>
                </li>
                <li>
                  <a href="/" target="_blank" rel="noopener" className={oge(false)}>
                    <ExternalLink className={ikon(false)} aria-hidden />
                    <span className={`whitespace-nowrap ${yazi}`}>Siteyi aç</span>
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="shrink-0 border-t border-line p-3">
          <form action={cikisEylemi}>
            <button className={oge(false)}>
              <LogOut className={ikon(false)} aria-hidden />
              <span className={`whitespace-nowrap ${yazi}`}>Çıkış</span>
            </button>
          </form>
        </div>
      </aside>

      {mobilAcik ? (
        <div
          className="fixed inset-0 top-16 z-30 bg-shell/40 lg:hidden"
          onClick={kapatMobil}
          aria-hidden
        />
      ) : null}

      {/* ------------------------------------------------- içerik */}
      <div
        className={`transition-[padding] duration-300 ease-in-out ${
          sabit ? "lg:pl-[264px]" : "lg:pl-20"
        }`}
      >
        <header className="sticky top-0 z-50 flex h-16 items-center gap-3 border-b border-line bg-card px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobilAcik(!mobilAcik)}
            aria-expanded={mobilAcik}
            aria-controls="panel-menu"
            aria-label={mobilAcik ? "Menüyü kapat" : "Menüyü aç"}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-line lg:hidden"
          >
            {mobilAcik ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>

          <button
            type="button"
            onClick={sabitDegistir}
            aria-pressed={sabit}
            aria-label="Menüyü açık tut"
            title={sabit ? "Menüyü daralt — üzerine gelince açılır" : "Menüyü açık tut"}
            className="hidden size-10 shrink-0 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-alt hover:text-ink lg:grid"
          >
            {sabit ? (
              <PanelLeftClose className="size-5" aria-hidden />
            ) : (
              <PanelLeftOpen className="size-5" aria-hidden />
            )}
          </button>

          <Link href="/admin" className="lg:hidden" aria-label="Talepler">
            <Image
              src="/logo-full.png"
              alt="Servosteel"
              width={256}
              height={113}
              className="h-9 w-auto"
            />
          </Link>

          <div className="ml-auto">
            <KullaniciMenusu kullanici={kullanici} admin={admin} />
          </div>
        </header>

        <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}

function KullaniciMenusu({ kullanici, admin }: { kullanici: string; admin: boolean }) {
  const [acik, setAcik] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!acik) return;
    const disari = (e: PointerEvent) => {
      if (!kutu.current?.contains(e.target as Node)) setAcik(false);
    };
    const tus = (e: KeyboardEvent) => e.key === "Escape" && setAcik(false);
    document.addEventListener("pointerdown", disari);
    document.addEventListener("keydown", tus);
    return () => {
      document.removeEventListener("pointerdown", disari);
      document.removeEventListener("keydown", tus);
    };
  }, [acik]);

  const rol = admin ? "Yönetici" : "Kullanıcı";
  const satir =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-alt";

  return (
    <div ref={kutu} className="relative">
      <button
        type="button"
        onClick={() => setAcik(!acik)}
        aria-expanded={acik}
        aria-controls="kullanici-menusu"
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-alt"
      >
        <span
          className="grid size-9 place-items-center rounded-full bg-shell text-sm font-bold uppercase text-accent"
          aria-hidden
        >
          {kullanici.slice(0, 1)}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">{kullanici}</span>
          <span className="block text-xs text-muted">{rol}</span>
        </span>
        <span className="sr-only sm:hidden">{kullanici}</span>
        <ChevronDown
          className={`size-4 text-muted transition-transform duration-200 ${acik ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {acik ? (
        <div
          id="kullanici-menusu"
          className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-line bg-card p-2 shadow-lg"
        >
          <div className="px-3 pb-3 pt-2">
            <p className="text-sm font-semibold">{kullanici}</p>
            <p className="text-xs text-muted">{rol}</p>
          </div>
          <ul className="border-y border-line py-2">
            <li>
              <Link href="/admin/profil" onClick={() => setAcik(false)} className={satir}>
                <UserCog className="size-4 text-muted" aria-hidden />
                Profil ve parola
              </Link>
            </li>
            {admin ? (
              <li>
                <Link href="/admin/kullanicilar" onClick={() => setAcik(false)} className={satir}>
                  <Users className="size-4 text-muted" aria-hidden />
                  Kullanıcılar
                </Link>
              </li>
            ) : null}
            {admin ? (
              <li>
                <Link href="/admin/kayitlar" onClick={() => setAcik(false)} className={satir}>
                  <History className="size-4 text-muted" aria-hidden />
                  Kayıtlar
                </Link>
              </li>
            ) : null}
          </ul>
          <form action={cikisEylemi} className="pt-2">
            <button className={satir}>
              <LogOut className="size-4 text-muted" aria-hidden />
              Çıkış
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

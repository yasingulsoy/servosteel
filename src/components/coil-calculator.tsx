"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Check, Copy, Disc3, Info, Package, Printer, Scissors, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SpecularButton } from "@/components/specular-button";
import { NumField, Related, Result, Row, field, useFmt } from "@/components/calc-ui";
import {
  coilCalc,
  coilFromLength,
  coilFromTurns,
  coilFromWeight,
  slitCalc,
  pickDecoiler,
  DECOILER_HREF,
  DECOILER_OD_MAX,
  DENSITIES,
  KG_PER_LB,
  M_PER_FT,
  MM_PER_IN,
  type CoilResult,
  type MaterialKey,
} from "@/lib/calc";
import { teklifDoldur } from "@/lib/teklif-doldur";
import { CONTACT } from "@/lib/site";

/**
 * Servosteel rulo sac ağırlık ve uzunluk hesaplayıcısı.
 *
 * NEDEN BU KADAR GENİŞ: sahada dolaşan masaüstü "rulo ağırlık / uzunluk"
 * programları dört ölçüden (dış çap, iç çap, genişlik, kalınlık) yalnızca
 * çelik için ağırlık ve uzunluk verir. Alıcının gerçek soruları bunun
 * etrafında: sertifikada yalnız ağırlık yazıyorsa dış çap ne olur (açıcıya
 * sığar mı), dilinince her şerit kaç kilo gelir, ABD'li alıcı inç/lb ile
 * çalışır, ve en sonda "bu ruloyu hangi açıcı taşır". Hepsi aynı geometriden
 * çıkıyor (lib/calc.ts); araç yalnızca bunları tek yerde topluyor.
 *
 * Dış çap, ağırlık, uzunluk ve sarım sayısı BAĞLI alanlardır (Yasin,
 * 2026-11-11: "hangisini bilip yazarsa öteki değerler ondan hesaplansın"):
 * en son yazılan bilinen sayılır, öteki üçü ondan doldurulur ve farklı
 * zeminle "hesaplanan" diye işaretlenir. İç çap, genişlik, kalınlık ve
 * malzeme her zaman girilir.
 *
 * Hesap her zaman mm / kg / m'de yapılır; inç sistemi yalnızca giriş ve
 * gösterim katmanıdır.
 */

/** Birbirine bağlı dört büyüklük: hangisi BİLİNEN ise öteki üçü ondan hesaplanır */
type Mod = "od" | "weight" | "length" | "turns";
type Sistem = "metric" | "imperial";
type Malzeme = MaterialKey | "custom";
type Satir = [etiket: string, deger: string];
type Gosterim = { label: string; value: string; unit: string };

const BAGLI: Mod[] = ["od", "weight", "length", "turns"];

const BIRIM = {
  metric: { boy: "mm", kutle: "kg", uzun: "m", perL: "kg/m", perW: "kg/mm", alan: "m²", ad: "mm · kg" },
  imperial: { boy: "in", kutle: "lb", uzun: "ft", perL: "lb/ft", perW: "lb/in", alan: "ft²", ad: "in · lb" },
} as const;

/** Gösterilen birimden mm / kg / m'ye çarpan */
const carpan = (s: Sistem) =>
  s === "metric" ? { boy: 1, kutle: 1, uzun: 1 } : { boy: MM_PER_IN, kutle: KG_PER_LB, uzun: M_PER_FT };

const yuvarla = (x: number, basamak: number) => {
  const k = 10 ** basamak;
  return Math.round(x * k) / k;
};

/** Küçük sayıda bir ondalık, büyükte tam sayı — 13.116 kg ama 8,4 kg */
const bas = (x: number) => (Math.abs(x) < 100 ? 1 : 0);

const ikincilTus =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent/50 hover:text-accent-ink disabled:pointer-events-none disabled:opacity-50";

const segment = (secili: boolean) =>
  `rounded-lg px-2 py-2 text-xs font-semibold leading-tight transition-colors sm:px-3 sm:text-sm ${
    secili ? "bg-ink text-surface shadow-sm" : "text-muted hover:text-ink"
  }`;

export function CoilCalculator() {
  const t = useTranslations("calc");
  const tk = useTranslations();
  const locale = useLocale();
  const fmt = useFmt();

  const [mod, setMod] = useState<Mod>("od");
  const [sistem, setSistem] = useState<Sistem>("metric");
  const [malzeme, setMalzeme] = useState<Malzeme>("steel");
  const [ozelYogunluk, setOzelYogunluk] = useState(7.85);
  /* Girdiler GÖSTERİLEN birimde tutulur (mm ya da inç…) — ziyaretçinin
     yazdığı sayı, yuvarlanıp geri çevrilerek bozulmasın. */
  const [g, setG] = useState({ od: 1400, id: 508, width: 1250, thickness: 1, weight: 10000, length: 1000, turns: 446 });
  const [dil, setDil] = useState({ stripWidth: 120, trim: 10 });
  const [kopya, setKopya] = useState<"ok" | "hata" | null>(null);
  const kopyaZaman = useRef<ReturnType<typeof setTimeout>>(undefined);
  /* Her "Yazdır" tıklaması sayacı artırır; rapor ilk tıklamada DOM'a girer. */
  const [yazdir, setYazdir] = useState(0);

  const c = carpan(sistem);
  const u = BIRIM[sistem];
  const yogunluk = malzeme === "custom" ? ozelYogunluk : DENSITIES[malzeme];
  const kesit = { id: g.id * c.boy, width: g.width * c.boy, thickness: g.thickness * c.boy, density: yogunluk };

  const res: CoilResult | null =
    mod === "od"
      ? coilCalc({ ...kesit, od: g.od * c.boy })
      : mod === "weight"
        ? coilFromWeight({ ...kesit, weight: g.weight * c.kutle })
        : mod === "length"
          ? coilFromLength({ ...kesit, length: g.length * c.uzun })
          : coilFromTurns({ ...kesit, turns: g.turns });

  const slit = res
    ? slitCalc({
        coilWidth: kesit.width,
        stripWidth: dil.stripWidth * c.boy,
        trim: dil.trim * c.boy,
        coilWeight: res.weight,
        thickness: kesit.thickness,
        density: yogunluk,
      })
    : null;

  const acici = res ? pickDecoiler({ weight: res.weight, width: kesit.width, id: kesit.id, od: res.od }) : null;

  /* ---------- mm/kg/m → gösterilen birim ---------- */
  const goster = {
    boy: (mm: number) => mm / c.boy,
    kutle: (kg: number) => kg / c.kutle,
    uzun: (m: number) => m / c.uzun,
    perL: (kgm: number) => (kgm * c.uzun) / c.kutle,
    perW: (kgmm: number) => (kgmm * c.boy) / c.kutle,
    alan: (m2: number) => m2 / (c.uzun * c.uzun),
  };
  const capBasamak = sistem === "metric" ? 0 : 2;
  /* Yüzde dilin kendi biçimiyle: Türkçe "%4", Almanca "4 %", İngilizce "4%" */
  const yuzde = (oran: number, basamak = 0) =>
    new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: basamak }).format(oran);

  const sistemDegistir = (yeni: Sistem) => {
    if (yeni === sistem) return;
    const a = carpan(sistem);
    const b = carpan(yeni);
    const boy = (x: number, basamak: number) => yuvarla((x * a.boy) / b.boy, basamak);
    const kaba = yeni === "metric" ? 0 : 2; // çap ve genişlik
    const ince = yeni === "metric" ? 2 : 4; // kalınlık
    const serit = yeni === "metric" ? 1 : 3;
    setG({
      od: boy(g.od, kaba),
      id: boy(g.id, kaba),
      width: boy(g.width, kaba),
      thickness: boy(g.thickness, ince),
      weight: yuvarla((g.weight * a.kutle) / b.kutle, 0),
      length: yuvarla((g.length * a.uzun) / b.uzun, 1),
      turns: g.turns,
    });
    setDil({ stripWidth: boy(dil.stripWidth, serit), trim: boy(dil.trim, serit) });
    setSistem(yeni);
  };

  const malzemeAdi = malzeme === "custom" ? t("custom") : t(malzeme);

  /* ---------- bağlı dört alan: dış çap, ağırlık, uzunluk, sarım ----------
     Ziyaretçi hangisine yazarsa o BİLİNEN olur (mod), öteki üçü sonuçtan
     doldurulur — masaüstü programlardaki iki yönlü hesap. Hesaplanan alanın
     değeri gösterim basamağına yuvarlanır; ziyaretçi ona yazmaya başlarsa
     yazdığı sayı bilinen olur. */
  const bagli: Record<Mod, { label: string; unit: string; basamak: number; deger: number | null }> = {
    od: { label: t("od"), unit: u.boy, basamak: capBasamak, deger: res && goster.boy(res.od) },
    weight: { label: t("weight"), unit: u.kutle, basamak: res ? bas(goster.kutle(res.weight)) : 0, deger: res && goster.kutle(res.weight) },
    length: { label: t("clength"), unit: u.uzun, basamak: res ? bas(goster.uzun(res.length)) : 0, deger: res && goster.uzun(res.length) },
    turns: { label: t("turns"), unit: "", basamak: 1, deger: res && res.turns },
  };
  const alanDegeri = (k: Mod) => {
    if (k === mod) return g[k];
    const d = bagli[k].deger;
    return d === null ? NaN : yuvarla(d, bagli[k].basamak);
  };

  /* ---------- sonuç listeleri: pano, teklif ve rapor aynı listeden ---------- */
  const anaSonuclar: Gosterim[] = res
    ? BAGLI.filter((k) => k !== mod).map((k) => ({
        label: bagli[k].label,
        value: fmt(bagli[k].deger ?? NaN, bagli[k].basamak),
        unit: bagli[k].unit,
      }))
    : [];

  const ekSonuclar: Gosterim[] = res
    ? [
        { label: t("linearWeight"), value: fmt(goster.perL(res.kgPerM), 2), unit: u.perL },
        { label: t("perWidth"), value: fmt(goster.perW(res.kgPerMm), 2), unit: u.perW },
        { label: t("surface"), value: fmt(goster.alan(res.areaM2), bas(goster.alan(res.areaM2))), unit: u.alan },
      ]
    : [];

  const dilmeSonuclari: Gosterim[] = slit
    ? [
        { label: t("strips"), value: `${fmt(slit.strips, 0)} × ${fmt(dil.stripWidth, 3)}`, unit: u.boy },
        { label: t("stripWeight"), value: fmt(goster.kutle(slit.stripWeight), bas(goster.kutle(slit.stripWeight))), unit: u.kutle },
        { label: t("stripLinear"), value: fmt(goster.perL(slit.stripKgPerM), 2), unit: u.perL },
        { label: t("scrapWeight"), value: fmt(goster.kutle(slit.scrapWeight), bas(goster.kutle(slit.scrapWeight))), unit: u.kutle },
        { label: t("waste"), value: fmt(goster.boy(slit.waste), sistem === "metric" ? 1 : 3), unit: u.boy },
        { label: t("wastePct"), value: yuzde(slit.wastePct / 100, 2), unit: "" },
      ]
    : [];

  /* Açıcı: ürün tablosundaki değerler mm/kg; inçte parantez içinde karşılığı */
  const model = acici?.model ?? null;
  const aciciAdi = model ? tk(`products.variants.rulo-acicilar.${model.family}-rulo-acicilar.name`) : null;
  const kapasite = model
    ? `${fmt(model.capacity, 0)} kg${sistem === "imperial" ? ` (${fmt(model.capacity / KG_PER_LB, 0)} lb)` : ""}`
    : "";
  const aralik = (min: number, max: number) =>
    `${fmt(min, 0)}–${fmt(max, 0)} mm${
      sistem === "imperial" ? ` (${fmt(min / MM_PER_IN, 1)}–${fmt(max / MM_PER_IN, 1)} in)` : ""
    }`;
  /* Rulo sacın sınıf kapasitesinin ne kadarını kullandığı — %95'lik bir
     seçim ile %40'lık bir seçim aynı şey değil; alıcı bir üst sınıfı da
     düşünebilsin diye görünür. */
  const doluluk = res && model ? Math.min(1, res.weight / model.capacity) : 0;
  const aciciSatirlari: Satir[] =
    model && aciciAdi
      ? [
          [t("decoType"), aciciAdi],
          [t("decoClass"), kapasite],
          [t("decoLoad"), yuzde(doluluk)],
          [t("cwidth"), aralik(model.widthMin, model.widthMax)],
          [t("id"), aralik(model.idMin, model.idMax)],
        ]
      : [];
  const aciciNotlari: string[] =
    res && acici
      ? [
          ...(model && !acici.idFits ? [t("decoIdNote", { id: `${fmt(g.id, capBasamak)} ${u.boy}` })] : []),
          ...(!acici.odFits
            ? [t("decoOdNote", { od: `${fmt(goster.boy(res.od), capBasamak)} ${u.boy}`, max: `${fmt(DECOILER_OD_MAX, 0)} mm` })]
            : []),
        ]
      : [];
  /* Ekranda "seri dışı" metni kutunun kendisinde duruyor; pano ve raporda notlara girer */
  const raporNotlari = res && !model ? [t("decoNone"), ...aciciNotlari] : aciciNotlari;

  const girdiSatirlari: Satir[] = [
    [t("material"), `${malzemeAdi} (${fmt(yogunluk, 2)} g/cm³)`],
    [bagli[mod].label, `${fmt(g[mod], 3)}${bagli[mod].unit ? ` ${bagli[mod].unit}` : ""}`],
    [t("id"), `${fmt(g.id, 3)} ${u.boy}`],
    [t("cwidth"), `${fmt(g.width, 3)} ${u.boy}`],
    [t("thickness"), `${fmt(g.thickness, 4)} ${u.boy}`],
  ];
  const satir = (s: Gosterim): Satir => [s.label, `${s.value}${s.unit ? ` ${s.unit}` : ""}`];
  const bloklar: { baslik: string; satirlar: Satir[] }[] = [
    { baslik: t("reportInputs"), satirlar: girdiSatirlari },
    { baslik: t("reportResults"), satirlar: [...anaSonuclar, ...ekSonuclar].map(satir) },
    ...(slit
      ? [
          {
            baslik: t("slitTitle"),
            satirlar: [
              [t("stripWidth"), `${fmt(dil.stripWidth, 3)} ${u.boy}`] as Satir,
              [t("trim"), `${fmt(dil.trim, 3)} ${u.boy}`] as Satir,
              ...dilmeSonuclari.map(satir),
            ],
          },
        ]
      : []),
    ...(aciciSatirlari.length ? [{ baslik: t("decoTitle"), satirlar: aciciSatirlari }] : []),
  ];

  const sayfaAdresi = () => (typeof window === "undefined" ? "" : window.location.href.split("#")[0]);

  /** Pano ve teklif formu için düz metin */
  const ozetMetni = (adresle: boolean) =>
    [
      t("coilTitle"),
      ...bloklar.flatMap((b) => ["", `${b.baslik}:`, ...b.satirlar.map(([k, v]) => `- ${k}: ${v}`)]),
      ...(raporNotlari.length ? ["", ...raporNotlari] : []),
      ...(adresle ? ["", sayfaAdresi()] : []),
    ].join("\n");

  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(ozetMetni(true));
      setKopya("ok");
    } catch {
      setKopya("hata");
    }
    clearTimeout(kopyaZaman.current);
    kopyaZaman.current = setTimeout(() => setKopya(null), 2500);
  };

  const teklifIste = () => {
    teklifDoldur({
      message: ozetMetni(false),
      product: model && aciciAdi ? `${aciciAdi} · ${fmt(model.capacity, 0)} kg` : tk("products.machines.rulo-acicilar.name"),
    });
    document.getElementById("teklif-formu")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => () => clearTimeout(kopyaZaman.current), []);

  /* Yazdır / PDF: sayfanın kendisi değil, bu hesabın temiz bir raporu basılır.
     Rapor body'nin doğrudan çocuğu (portal); globals.css "rulo-yazdir"
     sınıfı varken yazıcıda yalnızca onu gösteriyor. Logo yüklenmeden
     yazdırılırsa raporda boş kalıyordu — decode beklenir (en çok 1,5 sn). */
  useEffect(() => {
    if (!yazdir) return;
    const kok = document.documentElement;
    let iptal = false;
    const bitir = () => kok.classList.remove("rulo-yazdir");
    kok.classList.add("rulo-yazdir");
    const logo = document.querySelector<HTMLImageElement>("#rulo-rapor img");
    const hazir = logo ? logo.decode().catch(() => undefined) : Promise.resolve();
    Promise.race([hazir, new Promise((r) => setTimeout(r, 1500))]).then(() => {
      if (iptal) return;
      window.addEventListener("afterprint", bitir, { once: true });
      window.print();
    });
    return () => {
      iptal = true;
      window.removeEventListener("afterprint", bitir);
      bitir();
    };
  }, [yazdir]);


  return (
    <section
      id="rulo-sac-hesaplayici"
      data-spotlight
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-accent/40 md:col-span-2"
    >
      <div className="h-1 bg-gradient-to-r from-accent to-accent-strong" aria-hidden />
      <div className="p-5 sm:p-8">
        {/* ---------- Başlık + birim ---------- */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display flex items-start gap-2.5 text-xl font-bold uppercase tracking-tight text-ink sm:text-2xl">
              <Package className="mt-0.5 size-6 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
              {t("coilTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("coilDesc")}</p>
          </div>
          <div className="shrink-0">
            <p className="mb-1 text-xs font-medium text-muted">{t("units")}</p>
            <div role="group" aria-label={t("units")} className="inline-grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-alt p-1">
              {(["metric", "imperial"] as Sistem[]).map((s) => (
                <button key={s} type="button" aria-pressed={sistem === s} onClick={() => sistemDegistir(s)} className={`${segment(sistem === s)} whitespace-nowrap`}>
                  {BIRIM[s].ad}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* ---------- Girdiler ---------- */}
          <div className="space-y-4">
            <div className={`grid gap-x-3 gap-y-4 ${malzeme === "custom" ? "grid-cols-2" : "grid-cols-1"}`}>
              <Row label={t("material")}>
                <select value={malzeme} onChange={(e) => setMalzeme(e.target.value as Malzeme)} className={field}>
                  {(Object.keys(DENSITIES) as MaterialKey[]).map((k) => (
                    <option key={k} value={k}>
                      {t(k)} — {fmt(DENSITIES[k], 2)} g/cm³
                    </option>
                  ))}
                  <option value="custom">{t("custom")}</option>
                </select>
              </Row>
              {malzeme === "custom" && (
                <NumField label={t("density")} unit="g/cm³" value={ozelYogunluk} onChange={setOzelYogunluk} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              <NumField label={t("id")} unit={u.boy} value={g.id} onChange={(v) => setG({ ...g, id: v })} />
              <NumField label={t("cwidth")} unit={u.boy} value={g.width} onChange={(v) => setG({ ...g, width: v })} />
              <NumField label={t("thickness")} unit={u.boy} value={g.thickness} onChange={(v) => setG({ ...g, thickness: v })} />
            </div>

            {malzeme === "galvanized" && (
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                <Info className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                {t("galvNote")}
              </p>
            )}
          </div>

          {/* ---------- Sonuçlar ---------- */}
          <div className="rounded-xl bg-surface-alt p-4 sm:p-5">
            <p className="text-xs leading-relaxed text-muted">{t("linkedHint")}</p>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
              {BAGLI.map((k) => (
                <NumField
                  key={k}
                  large
                  label={bagli[k].label}
                  unit={bagli[k].unit || undefined}
                  value={alanDegeri(k)}
                  computed={k !== mod}
                  badge={k === mod ? t("entered") : t("computed")}
                  onChange={(v) => {
                    setMod(k);
                    setG({ ...g, [k]: v });
                  }}
                />
              ))}
            </div>
            {res ? (
              /* Telefonda çizim üstte ortada, ek sonuçlar tam genişlikte altında
                 (yan yana dururken etiketler üç satıra kırılıyordu) */
              <div className="mt-4 flex flex-col items-center gap-2 border-t border-line pt-3 sm:flex-row sm:gap-4 sm:pt-2">
                <div className="order-last w-full min-w-0 flex-1 sm:order-none">
                  {ekSonuclar.map((s) => (
                    <Result key={s.label} {...s} />
                  ))}
                </div>
                <RuloCizim
                  od={res.od}
                  id={kesit.id}
                  odEtiket={`${t("od")} Ø ${fmt(goster.boy(res.od), capBasamak)} ${u.boy}`}
                  idEtiket={`${t("id")} Ø ${fmt(g.id, capBasamak)} ${u.boy}`}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">{t("invalid")}</p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* ---------- Dilme ---------- */}
          <div className="rounded-xl border border-line p-4 sm:p-5">
            <h3 className="font-display flex items-center gap-2 text-base font-bold uppercase tracking-tight text-ink">
              <Scissors className="size-5 text-accent" strokeWidth={1.8} aria-hidden />
              {t("slitTitle")}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
              <NumField label={t("stripWidth")} unit={u.boy} value={dil.stripWidth} onChange={(v) => setDil({ ...dil, stripWidth: v })} />
              <NumField label={t("trim")} unit={u.boy} value={dil.trim} onChange={(v) => setDil({ ...dil, trim: v })} />
            </div>
            <div className="mt-4 rounded-lg bg-surface-alt px-4 py-2">
              {slit ? (
                dilmeSonuclari.map((s) => <Result key={s.label} {...s} />)
              ) : (
                <p className="py-2 text-sm text-muted">{t("invalid")}</p>
              )}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">{t("yieldNote")}</p>
            <Related href="/dilme-hatlari" nameKey="dilme.title" />
          </div>

          {/* ---------- Açıcı önerisi ---------- */}
          <div className="self-start rounded-xl border border-accent/40 bg-accent/5 p-4 sm:p-5">
            <h3 className="font-display flex items-center gap-2 text-base font-bold uppercase tracking-tight text-ink">
              <Disc3 className="size-5 text-accent" strokeWidth={1.8} aria-hidden />
              {t("decoTitle")}
            </h3>
            {model && aciciAdi ? (
              <>
                <Link
                  href={DECOILER_HREF[model.family]}
                  className="group mt-3 inline-flex flex-wrap items-center gap-x-1.5 text-lg font-bold text-accent-ink"
                >
                  {aciciAdi}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" strokeWidth={2} aria-hidden />
                </Link>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/70" aria-hidden>
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(doluluk * 100)}%` }} />
                </div>
                <div className="mt-2">
                  {aciciSatirlari.slice(1).map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-2 last:border-0">
                      <span className="text-sm text-muted">{k}</span>
                      <span className="text-end text-sm font-semibold tabular-nums text-ink">{v}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : res ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-muted">{t("decoNone")}</p>
                <Related href="/makineler/rulo-acicilar" nameKey="products.machines.rulo-acicilar.name" />
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">{t("invalid")}</p>
            )}
            {aciciNotlari.map((n) => (
              <p key={n} className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted">
                <Info className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                {n}
              </p>
            ))}
          </div>
        </div>

        {/* ---------- Eylemler ---------- */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SpecularButton variant="gold" size="md" onClick={teklifIste} disabled={!res} className="w-full sm:w-auto">
            <Send className="size-4" strokeWidth={2} aria-hidden />
            {t("quoteBtn")}
          </SpecularButton>
          <button type="button" onClick={kopyala} disabled={!res} className={ikincilTus} aria-live="polite">
            {kopya === "ok" ? (
              <Check className="size-4 text-accent-ink" strokeWidth={2} aria-hidden />
            ) : (
              <Copy className="size-4" strokeWidth={1.8} aria-hidden />
            )}
            {kopya === "ok" ? t("copied") : kopya === "hata" ? t("copyFail") : t("copyBtn")}
          </button>
          <button type="button" onClick={() => setYazdir((n) => n + 1)} disabled={!res} className={ikincilTus}>
            <Printer className="size-4" strokeWidth={1.8} aria-hidden />
            {t("printBtn")}
          </button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">{t("coilNote")}</p>
      </div>

      {yazdir > 0 &&
        createPortal(
          <Rapor
            baslik={t("coilTitle")}
            tarih={new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date())}
            adres={sayfaAdresi()}
            bloklar={bloklar}
            notlar={[...raporNotlari, t("coilNote")]}
          />,
          document.body,
        )}
    </section>
  );
}

/**
 * Rulo sacın yandan görünüşü: dış ve iç çap ORANLI çizilir, birkaç sarım
 * çizgisi şeridi anlatır. Dış çap sabit; göbek ona göre küçülür, böylece
 * "göbek kesitin ne kadarını kaplıyor" bir bakışta görünür.
 */
function RuloCizim({ od, id, odEtiket, idEtiket }: { od: number; id: number; odEtiket: string; idEtiket: string }) {
  const R = 88;
  const r = Math.min(R - 4, Math.max(5, (R * id) / od));
  const sarimlar = Array.from({ length: 5 }, (_, i) => r + ((R - r) * (i + 1)) / 6);
  return (
    <figure className="w-24 shrink-0 sm:w-32">
      <svg viewBox="0 0 200 200" className="h-auto w-full" role="img" aria-label={`${odEtiket}, ${idEtiket}`}>
        <circle cx="100" cy="100" r={R} className="fill-accent/20 stroke-accent" strokeWidth="3" />
        {sarimlar.map((s) => (
          <circle key={s} cx="100" cy="100" r={s} fill="none" className="stroke-accent/40" strokeWidth="1.5" />
        ))}
        <circle cx="100" cy="100" r={r} className="fill-card stroke-ink/30" strokeWidth="2" />
        <line x1={100 - R} y1="100" x2={100 + R} y2="100" className="stroke-ink/50" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
      <figcaption className="mt-1 space-y-0.5 text-center text-[11px] leading-tight text-muted">
        <span className="block">{odEtiket}</span>
        <span className="block">{idEtiket}</span>
      </figcaption>
    </figure>
  );
}

/** Yazıcı / PDF için hesap raporu — ekranda görünmez (globals.css #rulo-rapor) */
function Rapor({
  baslik,
  tarih,
  adres,
  bloklar,
  notlar,
}: {
  baslik: string;
  tarih: string;
  adres: string;
  bloklar: { baslik: string; satirlar: Satir[] }[];
  notlar: string[];
}) {
  return (
    <div id="rulo-rapor" className="bg-white p-6 text-zinc-900">
      <div className="flex items-end justify-between gap-6 border-b-2 border-zinc-900 pb-3">
        {/* Düz <img>: next/image tembel yükler ve optimizasyon adresi ister;
            yazdırma anında decode() ile beklenebilen, hemen yüklenen dosya lazım. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-full.png" alt="Servosteel" width={256} height={113} className="h-12 w-auto" />
        <p className="text-sm text-zinc-600">{tarih}</p>
      </div>
      <h1 className="mt-4 text-xl font-bold">{baslik}</h1>
      {bloklar.map((b) => (
        <section key={b.baslik} className="mt-4 break-inside-avoid">
          <h2 className="border-b border-zinc-300 pb-1 text-sm font-bold uppercase tracking-wide">{b.baslik}</h2>
          <table className="mt-1 w-full text-[13px] leading-snug">
            <tbody>
              {b.satirlar.map(([k, v]) => (
                <tr key={k} className="border-b border-zinc-200">
                  <td className="py-[3px] pe-4 text-zinc-600">{k}</td>
                  <td className="py-[3px] text-end font-semibold tabular-nums">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <div className="mt-4 space-y-1 text-xs leading-relaxed text-zinc-600">
        {notlar.map((n) => (
          <p key={n}>{n}</p>
        ))}
        <p className="pt-2">
          Servosteel · {CONTACT.phoneDisplay} · {CONTACT.email} · {adres}
        </p>
      </div>
    </div>
  );
}

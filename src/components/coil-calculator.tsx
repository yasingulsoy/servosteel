"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Calculator, Check, ChevronDown, Copy, Info, Package, Printer, Scissors, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SpecularButton } from "@/components/specular-button";
import { NumField, Related, Result, Row, field, useFmt } from "@/components/calc-ui";
import {
  coilCalc,
  coilFromLength,
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
 * NEDEN VAR: sahada dolaşan masaüstü "rulo ağırlık / uzunluk" programları
 * dört ölçüden (dış çap, iç çap, genişlik, kalınlık) ağırlık ve uzunluk verir.
 * Alıcının öteki soruları da aynı geometriden çıkıyor (lib/calc.ts):
 * sertifikada yalnız ağırlık yazıyorsa dış çap ne olur, bu ruloyu hangi açıcı
 * taşır, dilinince her şerit kaç kilo gelir, ABD'li alıcı inç/lb ile çalışır.
 *
 * TÖRE PROGRAMI GİBİ TEK PANEL (2026-11-20, Yasin + satıştan gelen video).
 * İlk sürümde girdiler solda, dört bağlı büyüklük sağda yazılabilir kutulardı
 * ve hesap canlıydı; kullanan kişi anlamadı ("dış çap nerede, Hesapla nerede,
 * neye göre hesaplıyor?"). Aynı gün ikinci adım: Yasin "rakiplere bak, basit
 * ama anlaşılır, benim attığım program gibi" dedi. Bakılanlar: Töre Makine'nin
 * masaüstü programı, Worthington Steel, Seather Technology, Waelzholz. Ortak
 * düzen, buradaki de o:
 *   - solda ölçüleri harfle gösteren rulo çizimi (D, d, B, t), sağda tek
 *     sütun ölçüler; alanların etiketinde aynı harf (Waelzholz da böyle);
 *   - üstte "ne biliyorsunuz" sekmesi: dış çap / ağırlık / uzunluk (rakipler
 *     iki-üç sekmeyle yapıyor; "sarım sayısından" seçeneği kaldırıldı, sonuç
 *     olarak gösteriliyor);
 *   - büyük HESAPLA düğmesi; sonuç YALNIZ ona (ya da Enter'a) basınca değişir,
 *     hemen altında satır satır durur, en üstte iri olarak ağırlık;
 *   - hesaptan sonra form değişirse sonuç soluklaşır ve "Hesapla'ya basın" der;
 *   - açıcı önerisi ve teklif tuşu tek satırda; ek sonuçlar ve dilme hesabı
 *     açılır kutularda, kapalı.
 * Açıcı, dilme, kopyala / yazdır / teklif son hesaba dayanır.
 *
 * Hesap her zaman mm / kg / m'de yapılır; inç sistemi yalnızca giriş ve
 * gösterim katmanıdır.
 */

/** Bilinen büyüklük: dış çap, ağırlık ya da uzunluk — ötekiler ondan hesaplanır */
type Mod = "od" | "weight" | "length";
/** Sonuçta görünenler: bilinen dışındaki ikisi + sarım sayısı */
type Buyukluk = Mod | "turns";
type Sistem = "metric" | "imperial";
type Malzeme = MaterialKey | "custom";
type Satir = [etiket: string, deger: string];
type Gosterim = { label: string; value: string; unit: string };

const MODLAR: Mod[] = ["od", "weight", "length"];
/* Sonuç sırası: ağırlık en başta, iri — sorulan ilk şey "kaç ton" */
const SONUC_SIRASI: Buyukluk[] = ["weight", "od", "length", "turns"];

/** Formdaki değerler, GÖSTERİLEN birimde (mm ya da inç…) */
type Girdi = { od: number; id: number; width: number; thickness: number; weight: number; length: number };

const BASLANGIC: Girdi = { od: 1400, id: 508, width: 1250, thickness: 1, weight: 10000, length: 1000 };

/** Sonucun dayandığı girdiler: "Hesapla"ya basıldığı andaki form, mm / kg / m'de */
type Hesap = {
  mod: Mod;
  /** Bilinen değer — dış çap mm, ağırlık kg ya da uzunluk m */
  bilinen: number;
  kesit: { id: number; width: number; thickness: number; density: number };
  malzeme: Malzeme;
};

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

const dayanak = (mod: Mod, g: Girdi, sistem: Sistem, malzeme: Malzeme, ozelYogunluk: number): Hesap => {
  const c = carpan(sistem);
  const bilinenCarpan = { od: c.boy, weight: c.kutle, length: c.uzun }[mod];
  return {
    mod,
    bilinen: g[mod] * bilinenCarpan,
    kesit: {
      id: g.id * c.boy,
      width: g.width * c.boy,
      thickness: g.thickness * c.boy,
      density: malzeme === "custom" ? ozelYogunluk : DENSITIES[malzeme],
    },
    malzeme,
  };
};

const hesapla = ({ mod, bilinen, kesit }: Hesap): CoilResult | null =>
  mod === "od"
    ? coilCalc({ ...kesit, od: bilinen })
    : mod === "weight"
      ? coilFromWeight({ ...kesit, weight: bilinen })
      : coilFromLength({ ...kesit, length: bilinen });

/** Küçük sayıda bir ondalık, büyükte tam sayı — 13.116 kg ama 8,4 kg */
const bas = (x: number) => (Math.abs(x) < 100 ? 1 : 0);

const ikincilTus =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent/50 hover:text-accent-ink disabled:pointer-events-none disabled:opacity-50";

const segment = (secili: boolean) =>
  `rounded-lg px-2 py-2 text-xs font-semibold leading-tight transition-colors sm:px-3 sm:text-sm ${
    secili ? "bg-ink text-surface shadow-sm" : "text-muted hover:text-ink"
  }`;

/* Açılır kutu başlığı (<details>): kapalıyken tek satır */
const acilirBaslik =
  "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden";

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
  const [g, setG] = useState<Girdi>(BASLANGIC);
  /* Ekrandaki sonuç bu dayanaktan; açılışta varsayılan ölçülerle hesaplı gelir */
  const [hesap, setHesap] = useState<Hesap>(() => dayanak("od", BASLANGIC, "metric", "steel", 7.85));
  /* Son hesaptan sonra form değişti mi — sonuç o zaman "eski" gösterilir */
  const [bayat, setBayat] = useState(false);
  const sonucKutusu = useRef<HTMLDivElement>(null);
  const [dil, setDil] = useState({ stripWidth: 120, trim: 10 });
  const [kopya, setKopya] = useState<"ok" | "hata" | null>(null);
  const kopyaZaman = useRef<ReturnType<typeof setTimeout>>(undefined);
  /* Her "Yazdır" tıklaması sayacı artırır; rapor ilk tıklamada DOM'a girer. */
  const [yazdir, setYazdir] = useState(0);

  const c = carpan(sistem);
  const u = BIRIM[sistem];
  /* Sonuçla ilgili her şey (dilme, açıcı, rapor) son hesabın dayanağından */
  const kesit = hesap.kesit;
  const yogunluk = kesit.density;
  const res = hesapla(hesap);

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
    });
    setDil({ stripWidth: boy(dil.stripWidth, serit), trim: boy(dil.trim, serit) });
    setSistem(yeni);
  };

  const malzemeAdi = hesap.malzeme === "custom" ? t("custom") : t(hesap.malzeme);

  /* Dış çap, ağırlık, uzunluk ve sarım: `deger` son hesabın sonucu, gösterilen birimde */
  const bagli: Record<Buyukluk, { label: string; unit: string; basamak: number; deger: number | null }> = {
    od: { label: t("od"), unit: u.boy, basamak: capBasamak, deger: res && goster.boy(res.od) },
    weight: { label: t("weight"), unit: u.kutle, basamak: res ? bas(goster.kutle(res.weight)) : 0, deger: res && goster.kutle(res.weight) },
    length: { label: t("clength"), unit: u.uzun, basamak: res ? bas(goster.uzun(res.length)) : 0, deger: res && goster.uzun(res.length) },
    turns: { label: t("turns"), unit: "", basamak: 1, deger: res && res.turns },
  };

  /* ---------- form ---------- */
  const girdi = (yeni: Partial<Girdi>) => {
    setG({ ...g, ...yeni });
    setBayat(true);
  };

  /* Sekme değişince: form son hesapla aynıysa yeni alan o hesabın sonucuyla
     dolar (aynı rulo sac, başka yönden) ve sonuç eskimez. Form zaten
     değişmişse yalnızca sekme değişir. */
  const modSec = (k: Mod) => {
    if (k === mod) return;
    setMod(k);
    const d = bagli[k].deger;
    if (bayat || d === null) return;
    const yeni = { ...g, [k]: yuvarla(d, bagli[k].basamak) };
    setG(yeni);
    setHesap(dayanak(k, yeni, sistem, malzeme, ozelYogunluk));
  };

  const hesaplaTikla = () => {
    setHesap(dayanak(mod, g, sistem, malzeme, ozelYogunluk));
    setBayat(false);
    /* Telefonda sonuç düğmenin altında kalabiliyor: ekranda değilse oraya kay */
    const kutu = sonucKutusu.current;
    if (kutu) {
      const r = kutu.getBoundingClientRect();
      if (r.top > window.innerHeight - 120 || r.bottom < 0) kutu.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  /* ---------- sonuç listeleri: ekran, pano, teklif ve rapor aynı listeden ---------- */
  const anaSonuclar: Gosterim[] = res
    ? SONUC_SIRASI.filter((k) => k !== hesap.mod).map((k) => ({
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
          ...(model && !acici.idFits ? [t("decoIdNote", { id: `${fmt(goster.boy(kesit.id), capBasamak)} ${u.boy}` })] : []),
          ...(!acici.odFits
            ? [t("decoOdNote", { od: `${fmt(goster.boy(res.od), capBasamak)} ${u.boy}`, max: `${fmt(DECOILER_OD_MAX, 0)} mm` })]
            : []),
        ]
      : [];
  /* Ekranda "seri dışı" metni kutunun kendisinde duruyor; pano ve raporda notlara girer */
  const raporNotlari = res && !model ? [t("decoNone"), ...aciciNotlari] : aciciNotlari;

  /* Hesabın dayandığı değerler: sonucun altında "şu değerlerle hesaplandı",
     raporda "girilen değerler" */
  const bilinenGoster = { od: goster.boy, weight: goster.kutle, length: goster.uzun }[hesap.mod](hesap.bilinen);
  const girdiSatirlari: Satir[] = [
    [t("material"), `${malzemeAdi} (${fmt(yogunluk, 2)} g/cm³)`],
    [bagli[hesap.mod].label, `${fmt(bilinenGoster, 3)} ${bagli[hesap.mod].unit}`],
    [t("id"), `${fmt(goster.boy(kesit.id), 3)} ${u.boy}`],
    [t("cwidth"), `${fmt(goster.boy(kesit.width), 3)} ${u.boy}`],
    [t("thickness"), `${fmt(goster.boy(kesit.thickness), 4)} ${u.boy}`],
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

  /* Alan etiketindeki harf, çizimdeki harfle aynı */
  const SEMBOL: Record<Mod, string | undefined> = { od: "D", weight: undefined, length: undefined };

  return (
    <section
      id="rulo-sac-hesaplayici"
      data-spotlight
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-line bg-card md:col-span-2"
    >
      <div className="h-1 bg-gradient-to-r from-accent to-accent-strong" aria-hidden />
      <div className="mx-auto max-w-5xl p-5 sm:p-8">
        {/* ---------- Başlık + birim ---------- */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display flex items-start gap-2.5 text-xl font-bold uppercase tracking-tight text-ink sm:text-2xl">
              <Package className="mt-0.5 size-6 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
              {t("coilTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("coilDesc")}</p>
          </div>
          <div role="group" aria-label={t("units")} className="inline-grid shrink-0 grid-cols-2 gap-1 self-start rounded-xl border border-line bg-surface-alt p-1">
            {(["metric", "imperial"] as Sistem[]).map((s) => (
              <button key={s} type="button" aria-pressed={sistem === s} onClick={() => sistemDegistir(s)} className={`${segment(sistem === s)} whitespace-nowrap`}>
                {BIRIM[s].ad}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Tek panel: çizim + ölçüler + Hesapla + sonuç ---------- */}
        <div className="mt-6 grid items-start gap-6 rounded-xl border border-line bg-surface-alt p-4 sm:p-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-8">
          <RuloSema
            etiket={`${t("od")} (D), ${t("id")} (d), ${t("cwidth")} (B), ${t("thickness")} (t)`}
          />

          <div className="min-w-0">
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                hesaplaTikla();
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <p id="rulo-bilinen" className="mb-1.5 text-sm font-medium leading-snug text-ink">
                  {t("known")}
                </p>
                <div role="group" aria-labelledby="rulo-bilinen" className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-card p-1">
                  {MODLAR.map((k) => (
                    <button key={k} type="button" aria-pressed={mod === k} onClick={() => modSec(k)} className={segment(mod === k)}>
                      {bagli[k].label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{t("linkedHint")}</p>
              </div>

              <div className={`grid gap-x-3 gap-y-4 ${malzeme === "custom" ? "grid-cols-2" : "grid-cols-1"}`}>
                <Row label={t("material")}>
                  <select
                    value={malzeme}
                    onChange={(e) => {
                      setMalzeme(e.target.value as Malzeme);
                      setBayat(true);
                    }}
                    className={field}
                  >
                    {(Object.keys(DENSITIES) as MaterialKey[]).map((k) => (
                      <option key={k} value={k}>
                        {t(k)} — {fmt(DENSITIES[k], 2)} g/cm³
                      </option>
                    ))}
                    <option value="custom">{t("custom")}</option>
                  </select>
                </Row>
                {malzeme === "custom" && (
                  <NumField
                    label={t("density")}
                    unit="g/cm³"
                    value={ozelYogunluk}
                    onChange={(v) => {
                      setOzelYogunluk(v);
                      setBayat(true);
                    }}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                {/* key: sekme değişince kutu kendi yazılı metnini taşımasın */}
                <NumField
                  key={mod}
                  label={bagli[mod].label}
                  sembol={SEMBOL[mod]}
                  unit={bagli[mod].unit}
                  value={g[mod]}
                  onChange={(v) => girdi({ [mod]: v })}
                />
                <NumField label={t("id")} sembol="d" unit={u.boy} value={g.id} onChange={(v) => girdi({ id: v })} />
                <NumField label={t("cwidth")} sembol="B" unit={u.boy} value={g.width} onChange={(v) => girdi({ width: v })} />
                <NumField label={t("thickness")} sembol="t" unit={u.boy} value={g.thickness} onChange={(v) => girdi({ thickness: v })} />
              </div>

              {/* Videodaki gözlem: "kalınlığı 1 de yazsan 3 de yazsan aynı tonajı
                  çıkarıyor" — doğru; ağırlık ve dış çap kalınlıktan bağımsız. */}
              {(mod === "od" || mod === "weight") && (
                <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                  <Info className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                  {t("thickHint")}
                </p>
              )}
              {malzeme === "galvanized" && (
                <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                  <Info className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                  {t("galvNote")}
                </p>
              )}

              <SpecularButton type="submit" variant="gold" size="lg" className="w-full">
                <Calculator className="size-5" strokeWidth={2} aria-hidden />
                {t("calcBtn")}
              </SpecularButton>
            </form>

            {/* ---------- Sonuç: düğmenin hemen altında, satır satır ---------- */}
            <div ref={sonucKutusu} aria-live="polite" className="mt-4 scroll-mt-28 rounded-xl border border-line bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("resultsTitle")}</p>
              {bayat && (
                <p className="mt-2 flex items-start gap-2 rounded-lg border border-accent/60 bg-accent/10 px-3 py-2 text-sm leading-snug text-ink">
                  <Info className="mt-0.5 size-4 shrink-0 text-accent-ink" strokeWidth={2} aria-hidden />
                  {t("stale")}
                </p>
              )}
              {res ? (
                <div className={`transition-opacity motion-reduce:transition-none ${bayat ? "opacity-40" : ""}`}>
                  {anaSonuclar.map((s, i) => (
                    <div key={s.label} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-2 last:border-0">
                      <span className={`text-muted ${i === 0 ? "text-base font-medium text-ink" : "text-sm"}`}>{s.label}</span>
                      <span className={`font-display shrink-0 font-bold tabular-nums text-ink ${i === 0 ? "text-3xl" : "text-xl"}`}>
                        {s.value}
                        {s.unit && <span className="ms-1 text-sm font-semibold text-muted">{s.unit}</span>}
                      </span>
                    </div>
                  ))}
                  {/* "Neye göre hesaplıyor?" sorusunun cevabı */}
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {t("basis")} {girdiSatirlari.map(([k, v], i) => (i === 0 ? v : `${k} ${v}`)).join(" · ")}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">{t("invalid")}</p>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Açıcı önerisi + teklif: tek satır ---------- */}
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("decoTitle")}</p>
            {model && aciciAdi ? (
              <>
                <Link
                  href={DECOILER_HREF[model.family]}
                  className="group mt-1 inline-flex flex-wrap items-center gap-x-1.5 text-base font-bold text-accent-ink"
                >
                  {aciciAdi}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" strokeWidth={2} aria-hidden />
                </Link>
                <p className="mt-0.5 text-sm text-muted">
                  {t("decoClass")}: <span className="font-semibold text-ink">{kapasite}</span> · {t("decoLoad")}:{" "}
                  <span className="font-semibold text-ink">{yuzde(doluluk)}</span>
                </p>
              </>
            ) : res ? (
              <p className="mt-1 text-sm leading-relaxed text-muted">{t("decoNone")}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">{t("invalid")}</p>
            )}
            {aciciNotlari.map((n) => (
              <p key={n} className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted">
                <Info className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                {n}
              </p>
            ))}
          </div>
          <SpecularButton variant="gold" size="md" onClick={teklifIste} disabled={!res} className="w-full shrink-0 sm:w-auto">
            <Send className="size-4" strokeWidth={2} aria-hidden />
            {t("quoteBtn")}
          </SpecularButton>
        </div>

        {/* ---------- İkinci derece: kapalı açılır kutular ---------- */}
        <details className="group/ek mt-4 rounded-xl border border-line">
          <summary className={acilirBaslik}>
            {t("moreTitle")}
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open/ek:rotate-180" aria-hidden />
          </summary>
          <div className="border-t border-line px-4 py-2">
            {res ? ekSonuclar.map((s) => <Result key={s.label} {...s} />) : <p className="py-2 text-sm text-muted">{t("invalid")}</p>}
          </div>
        </details>

        <details className="group/dil mt-3 rounded-xl border border-line">
          <summary className={acilirBaslik}>
            <span className="flex items-center gap-2">
              <Scissors className="size-4 text-accent" strokeWidth={1.8} aria-hidden />
              {t("slitTitle")}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open/dil:rotate-180" aria-hidden />
          </summary>
          <div className="border-t border-line p-4">
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:max-w-md">
              <NumField label={t("stripWidth")} unit={u.boy} value={dil.stripWidth} onChange={(v) => setDil({ ...dil, stripWidth: v })} />
              <NumField label={t("trim")} unit={u.boy} value={dil.trim} onChange={(v) => setDil({ ...dil, trim: v })} />
            </div>
            <div className="mt-4 rounded-lg bg-surface-alt px-4 py-2">
              {slit ? dilmeSonuclari.map((s) => <Result key={s.label} {...s} />) : <p className="py-2 text-sm text-muted">{t("invalid")}</p>}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">{t("yieldNote")}</p>
            <Related href="/dilme-hatlari" nameKey="dilme.title" />
          </div>
        </details>

        {/* ---------- Kopyala / yazdır ---------- */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
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
 * Rulo sacın ölçü şeması (Töre programındaki gibi): ön yüz dış ve iç çapı,
 * gövde genişliği gösterir. Harfler formdaki alan etiketleriyle aynı:
 * D dış çap, d iç çap (göbek), B rulo sac genişliği, t sac kalınlığı.
 * Oranlı değil, sabit çizim — anlatmak için.
 */
function RuloSema({ etiket }: { etiket: string }) {
  /* Ön yüz elipsi: merkez (95, 105), yarıçaplar 45 × 80; göbek 17 × 30 */
  const sarimlar = [0.3, 0.55, 0.8].map((k) => ({ rx: 17 + 28 * k, ry: 30 + 50 * k }));
  const olcu = "stroke-ink/70";
  const yardimci = "stroke-ink/30";
  const harf = "fill-ink font-display text-[17px] font-bold";
  return (
    <figure className="mx-auto w-full max-w-[12rem] md:max-w-none md:pt-6">
      <svg viewBox="0 0 270 235" className="h-auto w-full" role="img" aria-label={etiket}>
        <defs>
          <marker id="rulo-ok" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 1 L9 5 L0 9 z" className="fill-ink/70" />
          </marker>
        </defs>

        {/* Gövde: ön yüzden B kadar arkaya */}
        <path d="M95 25 H195 A45 80 0 0 1 195 185 H95" className="fill-accent/15 stroke-accent" strokeWidth="2.5" />
        {/* Ön yüz, sarımlar, göbek */}
        <ellipse cx="95" cy="105" rx="45" ry="80" className="fill-accent/25 stroke-accent" strokeWidth="2.5" />
        {sarimlar.map((s) => (
          <ellipse key={s.rx} cx="95" cy="105" rx={s.rx} ry={s.ry} fill="none" className="stroke-accent/45" strokeWidth="1.2" />
        ))}
        <ellipse cx="95" cy="105" rx="17" ry="30" className="fill-card stroke-ink/40" strokeWidth="2" />

        {/* D — dış çap */}
        <line x1="95" y1="25" x2="22" y2="25" className={yardimci} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="95" y1="185" x2="22" y2="185" className={yardimci} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="30" y1="28" x2="30" y2="182" className={olcu} strokeWidth="1.5" markerStart="url(#rulo-ok)" markerEnd="url(#rulo-ok)" />
        <text x="14" y="111" className={harf}>
          D
        </text>

        {/* d — iç çap (göbek) */}
        <line x1="95" y1="78" x2="95" y2="132" className={olcu} strokeWidth="1.5" markerStart="url(#rulo-ok)" markerEnd="url(#rulo-ok)" />
        <text x="99" y="110" className={`${harf} text-[15px]`}>
          d
        </text>

        {/* B — rulo sac genişliği */}
        <line x1="95" y1="188" x2="95" y2="222" className={yardimci} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="195" y1="188" x2="195" y2="222" className={yardimci} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="98" y1="214" x2="192" y2="214" className={olcu} strokeWidth="1.5" markerStart="url(#rulo-ok)" markerEnd="url(#rulo-ok)" />
        <text x="145" y="208" textAnchor="middle" className={harf}>
          B
        </text>

        {/* t — sac kalınlığı: dış sarıma işaret */}
        <line x1="150" y1="36" x2="128" y2="49" className={olcu} strokeWidth="1.2" />
        <circle cx="127" cy="49.5" r="2.2" className="fill-ink/70" />
        <text x="153" y="38" className={harf}>
          t
        </text>
      </svg>
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

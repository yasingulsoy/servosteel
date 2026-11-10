"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ExternalLink,
  History,
  List,
  LocateFixed,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { AkisOgesi, HaritaFirmalari, HaritaFirmasi, HaritaUlkesi } from "@/lib/harita";
import { DURUM_KODU } from "@/lib/harita-sabit";
import { FIRMA_DURUMU } from "@/lib/sabitler";
import { crmeAlHaritadan } from "../yanitlar/actions";
import type { KureApi, Secim, Suzgec } from "./kure";

const Kure = dynamic(() => import("./kure"), { ssr: false });

const sayi = (n: number) => n.toLocaleString("tr-TR");

const tarih = (g: string | null) =>
  g ? new Date(`${g}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "—";

function once(iso: string): string {
  const dk = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.round(dk / 60);
  if (sa < 48) return `${sa} sa önce`;
  return `${Math.round(sa / 24)} gün önce`;
}

const PANEL_DURUMU: Record<string, [string, string]> = {
  gonderildi: ["Mail gitti", "bg-white/10 text-zinc-300"],
  yanit: ["Yanıt verdi", "bg-sky-400/20 text-sky-200"],
  olumlu: ["Olumlu", "bg-emerald-400/20 text-emerald-200"],
  red: ["İlgilenmiyor", "bg-red-400/15 text-red-200"],
  iptal: ["Listeden çıktı", "bg-white/5 text-zinc-500"],
  hatali: ["Adres hatalı", "bg-white/5 text-zinc-500"],
  bekliyor: ["Sırada", "bg-white/5 text-zinc-400"],
};

const AKIS_RENGI: Record<AkisOgesi["tur"], string> = {
  mail: "text-[#ffb43c]",
  hatirlatma: "text-[#ffe178]",
  yanit: "text-[#3cc8ff]",
};
const AKIS_ADI: Record<AkisOgesi["tur"], string> = { mail: "Mail", hatirlatma: "Hatırlatma", yanit: "Yanıt" };

/** Açıklamadaki süzgeç düğmeleri; sıra = DURUM_KODU. */
const KATMANLAR = [
  { kod: DURUM_KODU.mail, ad: "Mail gitti", renk: "#ffb43c" },
  { kod: DURUM_KODU.yanit, ad: "Yanıt", renk: "#3cc8ff" },
  { kod: DURUM_KODU.olumlu, ad: "Olumlu", renk: "#3dff9a" },
  { kod: DURUM_KODU.crm, ad: "CRM / fuar", renk: "#c07bff" },
  { kod: DURUM_KODU.sirada, ad: "Sırada", renk: "#8fa6c8" },
] as const;

const VARSAYILAN_KATMAN: number[] = [DURUM_KODU.mail, DURUM_KODU.yanit, DURUM_KODU.olumlu, DURUM_KODU.crm];
const OYNATMA_ADIMI_MS = 380;
const YOKLAMA_MS = 60_000;

function Sayac({ deger, ad, vurgu }: { deger: number; ad: string; vurgu?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-3 py-2">
      <div className={`text-xl font-bold tabular-nums ${vurgu ? "text-[#ffd166]" : ""}`}>{sayi(deger)}</div>
      <div className="text-[11px] text-zinc-400">{ad}</div>
    </div>
  );
}

function Dugme({ onClick, baslik, children, etkin }: { onClick: () => void; baslik: string; children: React.ReactNode; etkin?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={baslik}
      aria-label={baslik}
      aria-pressed={etkin}
      className={`hk-cam grid size-10 place-items-center rounded-xl hover:text-white ${etkin ? "text-[#ffd166]" : "text-zinc-200"}`}
    >
      {children}
    </button>
  );
}

type Props = {
  ulkeler: HaritaUlkesi[];
  veri: HaritaFirmalari;
  akis: AkisOgesi[];
  yazabilir: boolean;
};

export function HaritaSahnesi({ ulkeler, veri, akis, yazabilir }: Props) {
  const api = useRef<KureApi | null>(null);
  const [hazir, setHazir] = useState(false);
  const [secili, setSecili] = useState<Secim | null>(null);
  const [donme, setDonme] = useState(true);
  const [aranan, setAranan] = useState("");
  const [tamEkran, setTamEkran] = useState(false);
  const [listeAcik, setListeAcik] = useState(false);
  const [sonOlaylar, setSonOlaylar] = useState<(AkisOgesi & { no: number })[]>([]);
  const olayNo = useRef(0);
  const [katmanlar, setKatmanlar] = useState<number[]>(VARSAYILAN_KATMAN);
  const [segment, setSegment] = useState(0);
  /* Zaman çizelgesi: null = bugün (bütün firmalar). */
  const [gun, setGun] = useState<number | null>(null);
  const [oynuyor, setOynuyor] = useState(false);
  const [aliniyor, alimBaslat] = useTransition();
  const [alinanlar, setAlinanlar] = useState<Record<number, number>>({});
  /* Son yüklenen seçimin firmaları; seçim değişince eşleşmeyen sonuç gösterilmez. */
  const [yuklenen, setYuklenen] = useState<{ anahtar: string; firmalar: HaritaFirmasi[] | null; hata: boolean } | null>(
    null,
  );
  const secimAnahtari = secili ? `${secili.ulke}|${secili.sehir ?? "*"}` : "";
  const gecerli = yuklenen && yuklenen.anahtar === secimAnahtari ? yuklenen : null;
  const firmalar = gecerli?.firmalar ?? null;
  const hata = gecerli?.hata ?? false;

  const suzgec = useMemo<Suzgec>(() => ({ durumlar: katmanlar, segment, gun }), [katmanlar, segment, gun]);

  /* Zaman çizelgesi için: son gün ve güne kadar mail giden firma sayısı. */
  const { sonGun, birikimli } = useMemo(() => {
    let son = 0;
    for (const f of veri.firmalar) if (f[3] > son) son = f[3];
    const gunluk = new Array(son + 1).fill(0) as number[];
    for (const f of veri.firmalar) if (f[3] >= 0) gunluk[f[3]]++;
    const b: number[] = [];
    gunluk.reduce((t, n, i) => (b[i] = t + n), 0);
    return { sonGun: son, birikimli: b };
  }, [veri]);
  const gunTarihi = (g: number) => {
    const d = new Date(`${veri.baslangic}T12:00:00`);
    d.setDate(d.getDate() + g);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  const katmanSayisi = useMemo(() => {
    const s = new Map<number, number>();
    for (const f of veri.firmalar) if (!segment || f[2] & segment) s.set(f[1], (s.get(f[1]) ?? 0) + 1);
    return s;
  }, [veri, segment]);

  const ulasilan = useMemo(() => ulkeler.filter((u) => u.firma > 0), [ulkeler]);
  const toplam = useMemo(() => {
    const t = { firma: 0, yanit: 0, olumlu: 0, sirada: 0 };
    for (const u of ulkeler) {
      t.firma += u.firma;
      t.yanit += u.yanit;
      t.olumlu += u.olumlu;
      t.sirada += u.sirada;
    }
    return t;
  }, [ulkeler]);
  /* Şehir sayısı yalnız ulaşılan firmaların yerleri: sıradakiler sayılmaz. */
  const sehirSayisi = useMemo(() => {
    const yerler = new Set<number>();
    for (const f of veri.firmalar) if (f[1] !== DURUM_KODU.sirada && veri.yerler[f[0]].sehir) yerler.add(f[0]);
    return yerler.size;
  }, [veri]);
  const son24 = useMemo(() => akis.filter((a) => a.tur !== "yanit").length, [akis]);
  const enCok = ulasilan[0]?.firma ?? 1;
  const seciliVeri = secili ? ulkeler.find((u) => u.ulke === secili.ulke) : undefined;

  /* Seçili ülkenin şehirleri, görünen katmanlara göre. */
  const seciliSehirler = useMemo(() => {
    if (!secili) return [];
    const acik = new Set(katmanlar);
    const yerde = new Map<number, { sehir: string | null; firma: number; yanit: number; olumlu: number }>();
    for (const [yi, durum, maske, g] of veri.firmalar) {
      const y = veri.yerler[yi];
      if (y.ulke !== secili.ulke || !acik.has(durum)) continue;
      if (segment && !(maske & segment)) continue;
      if (gun !== null && (g < 0 || g > gun)) continue;
      const n = yerde.get(yi) ?? { sehir: y.sehir, firma: 0, yanit: 0, olumlu: 0 };
      n.firma++;
      if (durum === DURUM_KODU.yanit || durum === DURUM_KODU.olumlu) n.yanit++;
      if (durum === DURUM_KODU.olumlu) n.olumlu++;
      yerde.set(yi, n);
    }
    return [...yerde.values()].sort((a, b) => b.firma - a.firma);
  }, [veri, secili, katmanlar, segment, gun]);
  const seciliNokta = secili?.sehir != null ? seciliSehirler.find((n) => (n.sehir ?? "") === secili.sehir) : undefined;

  const liste = useMemo(() => {
    const q = aranan.trim().toLocaleLowerCase("tr");
    return q ? ulkeler.filter((u) => u.ulke.toLocaleLowerCase("tr").includes(q)) : ulkeler;
  }, [ulkeler, aranan]);

  const sec = useCallback((s: Secim | null) => {
    setSecili(s);
    if (s) {
      api.current?.ucus(s);
      setListeAcik(true);
    }
  }, []);

  const hazirOldu = useCallback((a: KureApi) => {
    api.current = a;
    setHazir(true);
  }, []);

  const olayGeldi = useCallback((o: AkisOgesi) => {
    const no = ++olayNo.current;
    setSonOlaylar((l) => [{ ...o, no }, ...l].slice(0, 5));
  }, []);

  useEffect(() => {
    api.current?.dondur(donme);
  }, [donme]);

  /* Zaman çizelgesini oynat: her adımda bir gün ilerle, o günün maillerine yay at. */
  const gunRef = useRef(gun);
  useEffect(() => {
    gunRef.current = gun;
  }, [gun]);
  useEffect(() => {
    if (!oynuyor) return;
    api.current?.akisDuraklat(true);
    /* Bugündeyse ya da sondaysa baştan başlar; ortadaysa kaldığı yerden. */
    let g = gunRef.current === null || gunRef.current >= sonGun ? -1 : gunRef.current;
    const saat = window.setInterval(() => {
      g += 1;
      api.current?.gunYaylari(g);
      if (g >= sonGun) {
        setGun(null);
        setOynuyor(false);
      } else setGun(g);
    }, OYNATMA_ADIMI_MS);
    return () => {
      window.clearInterval(saat);
      api.current?.akisDuraklat(false);
    };
  }, [oynuyor, sonGun]);

  /* Canlı akış: dakikada bir yeni giden mailleri ve yanıtları sor. */
  useEffect(() => {
    let son = akis.reduce((m, a) => (a.zaman > m ? a.zaman : m), new Date(Date.now() - 5 * 60_000).toISOString());
    const saat = window.setInterval(() => {
      if (document.hidden) return;
      fetch(`/harita/akis?son=${encodeURIComponent(son)}`)
        .then((r) => (r.ok ? (r.json() as Promise<AkisOgesi[]>) : []))
        .then((yeni) => {
          if (!yeni.length) return;
          son = yeni.reduce((m, a) => (a.zaman > m ? a.zaman : m), son);
          api.current?.olayEkle(yeni);
        })
        .catch(() => {});
    }, YOKLAMA_MS);
    return () => window.clearInterval(saat);
  }, [akis]);

  useEffect(() => {
    if (!secili) return;
    const iptal = new AbortController();
    const anahtar = `${secili.ulke}|${secili.sehir ?? "*"}`;
    const q = new URLSearchParams({ ulke: secili.ulke });
    if (secili.sehir !== null) q.set("sehir", secili.sehir);
    fetch(`/harita/firmalar?${q}`, { signal: iptal.signal })
      .then((r) => (r.ok ? (r.json() as Promise<HaritaFirmasi[]>) : Promise.reject(new Error(String(r.status)))))
      .then((f) => setYuklenen({ anahtar, firmalar: f, hata: false }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setYuklenen({ anahtar, firmalar: null, hata: true });
      });
    return () => iptal.abort();
  }, [secili]);

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) setSecili(null);
    };
    const ekran = () => setTamEkran(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", tus);
    document.addEventListener("fullscreenchange", ekran);
    return () => {
      window.removeEventListener("keydown", tus);
      document.removeEventListener("fullscreenchange", ekran);
    };
  }, []);

  const tamEkranDegistir = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const katmanDegistir = (kod: number) =>
    setKatmanlar((k) => (k.includes(kod) ? (k.length > 1 ? k.filter((x) => x !== kod) : k) : [...k, kod]));

  const crmeAl = (hedefId: number) =>
    alimBaslat(async () => {
      try {
        const { crmId } = await crmeAlHaritadan(hedefId);
        setAlinanlar((a) => ({ ...a, [hedefId]: crmId }));
      } catch {
        setAlinanlar((a) => ({ ...a, [hedefId]: -1 }));
      }
    });

  return (
    <div className="hk-uzay fixed inset-0 z-50 overflow-hidden text-white">
      <Kure
        ulkeler={ulkeler}
        veri={veri}
        suzgec={suzgec}
        akis={akis}
        secili={secili}
        donme={donme}
        onSec={sec}
        onHazir={hazirOldu}
        onOlay={olayGeldi}
      />

      {!hazir && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="size-2 animate-ping rounded-full bg-[#ffb43c]" />
            Dünya yükleniyor…
          </div>
        </div>
      )}

      {/* Sol üst: başlık ve toplamlar */}
      <div className="pointer-events-none absolute left-3 top-3 w-[min(340px,calc(100vw-1.5rem))] sm:left-4 sm:top-4">
        <div data-hk-engel className="hk-cam pointer-events-auto rounded-2xl p-3 sm:p-4">
          <Link href="/" className="mb-2 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
            <ArrowLeft size={13} /> CRM
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
            Ulaştığımız dünya
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-300">
              <span className="size-1.5 animate-pulse rounded-full bg-red-400" /> canlı
            </span>
          </h1>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3">
            <Sayac deger={toplam.firma} ad="firma" vurgu />
            <Sayac deger={ulasilan.length} ad="ülke" />
            <Sayac deger={sehirSayisi} ad="şehir" />
          </div>
          <p className="mt-2 hidden text-[11px] leading-relaxed text-zinc-500 sm:block">
            {sayi(toplam.yanit)} yanıt · {sayi(toplam.olumlu)} olumlu · son 24 saatte {sayi(son24)} mail ·{" "}
            {sayi(toplam.sirada)} firma sırada
          </p>
        </div>
      </div>

      {/* Üst orta: zaman çizelgesi */}
      <div
        data-hk-engel
        className="hk-cam absolute left-1/2 top-4 hidden w-[min(440px,calc(100vw-48rem))] min-w-[300px] -translate-x-1/2 items-center gap-3 rounded-xl px-3 py-2 lg:flex"
      >
        <button
          type="button"
          onClick={() => setOynuyor((o) => !o)}
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-[#ffd166] hover:bg-white/15"
          aria-label={oynuyor ? "Durdur" : "Geçmişi oynat"}
          title={oynuyor ? "Durdur" : "Gönderim geçmişini gün gün oynat"}
        >
          {oynuyor ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <input
          type="range"
          min={0}
          max={sonGun}
          value={gun ?? sonGun}
          onChange={(e) => {
            setOynuyor(false);
            const g = Number(e.target.value);
            setGun(g >= sonGun ? null : g);
          }}
          className="hk-zaman min-w-0 flex-1"
          aria-label="Gün"
        />
        <div className="w-[104px] shrink-0 text-right text-[11px] leading-tight">
          <div className="font-semibold text-white">{gun === null ? "Bugün" : gunTarihi(gun)}</div>
          <div className="tabular-nums text-zinc-400">
            {sayi(birikimli[gun ?? sonGun] ?? 0)} firmaya mail
          </div>
        </div>
        {gun !== null && (
          <button
            type="button"
            onClick={() => {
              setOynuyor(false);
              setGun(null);
            }}
            className="text-zinc-400 hover:text-white"
            aria-label="Bugüne dön"
            title="Bugüne dön"
          >
            <History size={15} />
          </button>
        )}
      </div>

      {/* Sol alt: canlı akış */}
      {sonOlaylar.length > 0 && (
        <div
          data-hk-engel
          className="hk-cam absolute bottom-[4.25rem] left-4 hidden w-[330px] rounded-xl px-3 py-2 sm:block"
          aria-live="off"
        >
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Canlı akış</div>
          <ul className="space-y-0.5">
            {sonOlaylar.map((o, i) => (
              <li key={o.no} className={`flex items-baseline gap-2 text-[11px] ${i === 0 ? "hk-akis-yeni" : "opacity-70"}`}>
                <span className={`w-[5.5rem] shrink-0 whitespace-nowrap font-semibold ${AKIS_RENGI[o.tur]}`}>
                  {o.tur === "yanit" ? "↙" : "↗"} {AKIS_ADI[o.tur]}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {o.firma}
                  <span className="text-zinc-500"> · {o.sehir ? `${o.sehir}, ` : ""}{o.ulke}</span>
                </span>
                <span className="shrink-0 text-zinc-500">{once(o.zaman)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sağ: ülke listesi ya da seçili ülke (telefonda alttan açılır) */}
      <aside
        data-hk-engel
        className={`hk-cam absolute inset-x-3 bottom-[4.25rem] max-h-[52vh] flex-col overflow-hidden rounded-2xl md:inset-x-auto md:bottom-[7.5rem] md:right-4 md:top-4 md:flex md:max-h-none md:w-80 ${
          listeAcik ? "flex" : "hidden"
        }`}
      >
        {secili ? (
          <>
            <div className="flex items-start gap-2 border-b border-white/10 p-4">
              <button
                type="button"
                onClick={() => (secili.sehir !== null ? sec({ ulke: secili.ulke, sehir: null }) : sec(null))}
                className="mt-0.5 text-zinc-400 hover:text-white"
                aria-label="Geri"
                title={secili.sehir !== null ? `${secili.ulke} geneline dön` : "Ülke listesine dön"}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold">
                  {secili.sehir !== null ? secili.sehir || "Şehri belirsiz" : secili.ulke}
                </h2>
                <p className="truncate text-xs text-zinc-400">
                  {secili.sehir !== null
                    ? secili.ulke
                    : seciliVeri && seciliVeri.eposta > 0
                      ? `İlk mail ${tarih(seciliVeri.ilk)} · son ${tarih(seciliVeri.son)}`
                      : "Mail gitmedi"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sec(null);
                  setListeAcik(false);
                }}
                className="text-zinc-400 hover:text-white md:hidden"
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>
            {secili.sehir === null && seciliVeri && (
              <div className="grid grid-cols-3 gap-2 border-b border-white/10 p-3 text-center">
                <Sayac deger={seciliVeri.firma} ad="firma" vurgu />
                <Sayac deger={seciliVeri.yanit} ad="yanıt" />
                <Sayac deger={seciliVeri.olumlu} ad="olumlu" />
                <Sayac deger={seciliVeri.eposta} ad="mail giden" />
                <Sayac deger={seciliVeri.crm} ad="CRM'de" />
                <Sayac deger={seciliVeri.sirada} ad="sırada" />
              </div>
            )}
            {secili.sehir !== null && seciliNokta && (
              <div className="grid grid-cols-3 gap-2 border-b border-white/10 p-3 text-center">
                <Sayac deger={seciliNokta.firma} ad="firma" vurgu />
                <Sayac deger={seciliNokta.yanit} ad="yanıt" />
                <Sayac deger={seciliNokta.olumlu} ad="olumlu" />
              </div>
            )}
            {secili.sehir === null && seciliSehirler.length > 1 && (
              <div className="hk-kaydir flex max-h-28 flex-wrap gap-1.5 overflow-y-auto border-b border-white/10 p-3">
                {seciliSehirler.map((n) => (
                  <button
                    key={n.sehir ?? ""}
                    type="button"
                    onClick={() => sec({ ulke: secili.ulke, sehir: n.sehir ?? "" })}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] hover:border-[#ffd166]/60 hover:text-[#ffd166]"
                  >
                    {n.sehir ?? "Şehri belirsiz"} <b className="ms-0.5 tabular-nums">{n.firma}</b>
                  </button>
                ))}
              </div>
            )}
            <div className="hk-kaydir min-h-0 flex-1 overflow-y-auto p-2">
              {hata && <p className="p-3 text-sm text-red-300">Firmalar yüklenemedi.</p>}
              {!hata && !firmalar && <p className="p-3 text-sm text-zinc-500">Firmalar yükleniyor…</p>}
              {firmalar?.length === 0 && <p className="p-3 text-sm text-zinc-500">Burada ulaşılan firma yok.</p>}
              <ul className="space-y-1">
                {firmalar?.map((f) => {
                  const [durumAd, durumRenk] =
                    f.kaynak === "crm"
                      ? [`CRM · ${FIRMA_DURUMU[f.durum as keyof typeof FIRMA_DURUMU] ?? f.durum}`, "bg-[#c07bff]/20 text-[#dcb6ff]"]
                      : (PANEL_DURUMU[f.durum] ?? [f.durum, "bg-white/10 text-zinc-300"]);
                  const web = f.web ? (/^https?:\/\//i.test(f.web) ? f.web : `https://${f.web}`) : null;
                  const alinan = f.kaynak === "eposta" ? alinanlar[f.id] : undefined;
                  const crmId = f.crmId ?? (alinan && alinan > 0 ? alinan : null);
                  return (
                    <li key={`${f.kaynak}-${f.id}`} className="rounded-lg px-2.5 py-2 hover:bg-white/[0.05]">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          {crmId ? (
                            <Link href={`/firmalar/${crmId}`} className="block truncate text-sm font-medium hover:text-[#ffd166]">
                              {f.ad}
                            </Link>
                          ) : (
                            <span className="block truncate text-sm font-medium">{f.ad}</span>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className={`rounded px-1.5 py-0.5 ${durumRenk}`}>{durumAd}</span>
                            {secili.sehir === null && f.sehir && <span className="text-zinc-300">{f.sehir}</span>}
                            {f.segment && <span className="truncate text-zinc-500">{f.segment}</span>}
                            {f.son && <span className="text-zinc-500">· {tarih(f.son)}</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {yazabilir && f.kaynak === "eposta" && !crmId ? (
                            alinan === -1 ? (
                              <span className="text-[10px] text-red-300">olmadı</span>
                            ) : (
                              <button
                                type="button"
                                disabled={aliniyor}
                                onClick={() => crmeAl(f.id)}
                                className="inline-flex items-center gap-0.5 rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:border-[#ffd166]/60 hover:text-[#ffd166] disabled:opacity-50"
                                title="Bu firmayı CRM'e al (firma, kişi, görüşme ve yarına görev)"
                              >
                                <Plus size={11} /> CRM
                              </button>
                            )
                          ) : null}
                          {web && (
                            <a
                              href={web}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-zinc-500 hover:text-white"
                              title={f.web}
                              aria-label={`${f.ad} sitesi`}
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-white/10 p-3">
              <div className="relative flex-1">
                <Search size={13} className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={aranan}
                  onChange={(e) => setAranan(e.target.value)}
                  placeholder="Ülke ara…"
                  aria-label="Ülke ara"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 ps-8 pe-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#ffb43c]"
                />
              </div>
              <button
                type="button"
                onClick={() => setListeAcik(false)}
                className="text-zinc-400 hover:text-white md:hidden"
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>
            <ol className="hk-kaydir min-h-0 flex-1 overflow-y-auto p-2">
              {liste.map((u) => (
                <li key={u.ulke}>
                  <button
                    type="button"
                    onClick={() => sec({ ulke: u.ulke, sehir: null })}
                    className="group w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.06]"
                  >
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate group-hover:text-[#ffd166]">{u.ulke}</span>
                      {u.olumlu > 0 && <span className="text-[11px] text-[#3dff9a]">{u.olumlu} olumlu</span>}
                      {u.yanit > 0 && <span className="text-[11px] text-[#3cc8ff]">{u.yanit} yanıt</span>}
                      <span className="tabular-nums font-semibold">{sayi(u.firma)}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8a5a00] to-[#ffb43c]"
                        style={{ width: `${Math.max(1.5, (Math.log1p(u.firma) / Math.log1p(enCok)) * 100).toFixed(1)}%` }}
                      />
                    </div>
                  </button>
                </li>
              ))}
              {liste.length === 0 && <li className="p-3 text-sm text-zinc-500">Eşleşen ülke yok.</li>}
            </ol>
          </>
        )}
      </aside>

      {/* Alt sol: kontroller */}
      <div data-hk-engel className="absolute bottom-3 left-3 flex gap-2 sm:bottom-4 sm:left-4">
        <Dugme onClick={() => setDonme((d) => !d)} baslik={donme ? "Dönmeyi durdur" : "Döndür"}>
          {donme ? <Pause size={16} /> : <Play size={16} />}
        </Dugme>
        <Dugme
          onClick={() => {
            sec(null);
            api.current?.ev();
          }}
          baslik="Başa dön"
        >
          <LocateFixed size={16} />
        </Dugme>
        <Dugme onClick={tamEkranDegistir} baslik={tamEkran ? "Tam ekrandan çık" : "Tam ekran"}>
          {tamEkran ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </Dugme>
        <span className="md:hidden">
          <Dugme onClick={() => setListeAcik((a) => !a)} baslik="Ülkeler">
            <List size={16} />
          </Dugme>
        </span>
      </div>

      {/* Alt sağ: katman ve segment süzgeci */}
      <div
        data-hk-engel
        className="hk-cam absolute bottom-4 right-4 hidden w-[min(560px,calc(100vw-24rem))] flex-col gap-2 rounded-xl px-3 py-2 text-[11px] text-zinc-300 md:flex"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {KATMANLAR.map((k) => {
            const acik = katmanlar.includes(k.kod);
            return (
              <button
                key={k.kod}
                type="button"
                onClick={() => katmanDegistir(k.kod)}
                aria-pressed={acik}
                className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition ${
                  acik ? "border-white/20 bg-white/[0.06] text-white" : "border-white/5 text-zinc-500 line-through decoration-zinc-600"
                }`}
              >
                <span className="size-2 rounded-full" style={{ background: k.renk, boxShadow: acik ? `0 0 6px ${k.renk}` : "none", opacity: acik ? 1 : 0.35 }} />
                {k.ad}
                <span className="tabular-nums text-zinc-500">{sayi(katmanSayisi.get(k.kod) ?? 0)}</span>
              </button>
            );
          })}
          <span className="ms-auto flex items-center gap-1.5 text-zinc-500">
            <span className="size-2 rounded-full bg-[#ff4d5e]" /> Servosteel
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={segment}
            onChange={(e) => setSegment(Number(e.target.value))}
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#060b15] px-2 py-1 text-[11px] text-zinc-200 outline-none focus:border-[#ffb43c]"
            aria-label="Segment"
          >
            <option value={0}>Bütün segmentler</option>
            {veri.segmentler.map((s, i) => (
              <option key={s} value={1 << i}>
                {s}
              </option>
            ))}
          </select>
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="size-2.5 rounded-full border border-[#ffb43c]" /> şehri belirsiz
          </span>
        </div>
      </div>
    </div>
  );
}

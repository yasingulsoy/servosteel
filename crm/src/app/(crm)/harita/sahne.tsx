"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, List, LocateFixed, Maximize2, Minimize2, Pause, Play, Search, X } from "lucide-react";
import type { HaritaFirmasi, HaritaUlkesi } from "@/lib/harita";
import { FIRMA_DURUMU } from "@/lib/sabitler";
import type { KureApi } from "./kure";

const Kure = dynamic(() => import("./kure"), { ssr: false });

const sayi = (n: number) => n.toLocaleString("tr-TR");

const tarih = (g: string | null) =>
  g ? new Date(`${g}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "—";

const PANEL_DURUMU: Record<string, [string, string]> = {
  gonderildi: ["Mail gitti", "bg-white/10 text-zinc-300"],
  yanit: ["Yanıt verdi", "bg-sky-400/20 text-sky-200"],
  olumlu: ["Olumlu", "bg-emerald-400/20 text-emerald-200"],
  red: ["İlgilenmiyor", "bg-red-400/15 text-red-200"],
  iptal: ["Listeden çıktı", "bg-white/5 text-zinc-500"],
  hatali: ["Adres hatalı", "bg-white/5 text-zinc-500"],
  bekliyor: ["Sırada", "bg-white/5 text-zinc-400"],
};

function Sayac({ deger, ad, vurgu }: { deger: number; ad: string; vurgu?: boolean }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2">
      <div className={`text-xl font-bold tabular-nums ${vurgu ? "text-[#ffd166]" : ""}`}>{sayi(deger)}</div>
      <div className="text-[11px] text-zinc-400">{ad}</div>
    </div>
  );
}

function Dugme({ onClick, baslik, children }: { onClick: () => void; baslik: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={baslik}
      aria-label={baslik}
      className="hk-cam grid size-10 place-items-center rounded-xl text-zinc-200 hover:text-white"
    >
      {children}
    </button>
  );
}

export function HaritaSahnesi({ ulkeler }: { ulkeler: HaritaUlkesi[] }) {
  const api = useRef<KureApi | null>(null);
  const [hazir, setHazir] = useState(false);
  const [secili, setSecili] = useState<string | null>(null);
  const [donme, setDonme] = useState(true);
  const [aranan, setAranan] = useState("");
  const [tamEkran, setTamEkran] = useState(false);
  const [listeAcik, setListeAcik] = useState(false);
  /* Son yüklenen ülkenin firmaları; seçim değişince eşleşmeyen sonuç gösterilmez. */
  const [yuklenen, setYuklenen] = useState<{ ulke: string; firmalar: HaritaFirmasi[] | null; hata: boolean } | null>(
    null,
  );
  const gecerli = yuklenen && yuklenen.ulke === secili ? yuklenen : null;
  const firmalar = gecerli?.firmalar ?? null;
  const hata = gecerli?.hata ?? false;

  const ulasilan = useMemo(() => ulkeler.filter((u) => u.firma > 0), [ulkeler]);
  const toplam = useMemo(() => {
    const t = { firma: 0, eposta: 0, yanit: 0, olumlu: 0, sirada: 0, ilk: null as string | null };
    for (const u of ulkeler) {
      t.firma += u.firma;
      t.eposta += u.eposta;
      t.yanit += u.yanit;
      t.olumlu += u.olumlu;
      t.sirada += u.sirada;
      if (u.ilk && (!t.ilk || u.ilk < t.ilk)) t.ilk = u.ilk;
    }
    return t;
  }, [ulkeler]);
  const enCok = ulasilan[0]?.firma ?? 1;
  const seciliVeri = secili ? ulkeler.find((u) => u.ulke === secili) : undefined;

  const liste = useMemo(() => {
    const q = aranan.trim().toLocaleLowerCase("tr");
    return q ? ulkeler.filter((u) => u.ulke.toLocaleLowerCase("tr").includes(q)) : ulkeler;
  }, [ulkeler, aranan]);

  const sec = useCallback((ulke: string | null) => {
    setSecili(ulke);
    if (ulke) {
      api.current?.ucus(ulke);
      setListeAcik(true);
    }
  }, []);

  const hazirOldu = useCallback((a: KureApi) => {
    api.current = a;
    setHazir(true);
  }, []);

  useEffect(() => {
    api.current?.dondur(donme);
  }, [donme]);

  useEffect(() => {
    if (!secili) return;
    const iptal = new AbortController();
    fetch(`/harita/firmalar?ulke=${encodeURIComponent(secili)}`, { signal: iptal.signal })
      .then((r) => (r.ok ? (r.json() as Promise<HaritaFirmasi[]>) : Promise.reject(new Error(String(r.status)))))
      .then((f) => setYuklenen({ ulke: secili, firmalar: f, hata: false }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setYuklenen({ ulke: secili, firmalar: null, hata: true });
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

  return (
    <div className="hk-uzay fixed inset-0 z-50 overflow-hidden text-white">
      <Kure ulkeler={ulkeler} secili={secili} donme={donme} onSec={sec} onHazir={hazirOldu} />

      {!hazir && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="flex items-center gap-3 text-sm text-zinc-400">
            <span className="size-2 animate-ping rounded-full bg-[#ffd166]" />
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
          <h1 className="text-lg font-bold tracking-tight">Ulaştığımız dünya</h1>
          <p className="mt-0.5 hidden text-xs text-zinc-400 sm:block">Tanıtım maili giden ve CRM&apos;deki firmalar, ülke ülke</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3">
            <Sayac deger={toplam.firma} ad="firma" vurgu />
            <Sayac deger={ulasilan.length} ad="ülke" />
            <Sayac deger={toplam.yanit} ad="yanıt" />
          </div>
          <p className="mt-2 hidden text-[11px] leading-relaxed text-zinc-500 sm:block">
            {sayi(toplam.olumlu)} olumlu · {sayi(toplam.sirada)} firma sırada · ilk mail {tarih(toplam.ilk)}
          </p>
        </div>
      </div>

      {/* Sağ: ülke listesi ya da seçili ülke (telefonda alttan açılır) */}
      <aside
        data-hk-engel
        className={`hk-cam absolute inset-x-3 bottom-[4.25rem] max-h-[52vh] flex-col overflow-hidden rounded-2xl md:inset-x-auto md:bottom-20 md:right-4 md:top-4 md:flex md:max-h-none md:w-80 ${
          listeAcik ? "flex" : "hidden"
        }`}
      >
        {secili ? (
          <>
            <div className="flex items-start gap-2 border-b border-white/10 p-4">
              <button
                type="button"
                onClick={() => sec(null)}
                className="mt-0.5 text-zinc-400 hover:text-white"
                aria-label="Ülke listesine dön"
                title="Ülke listesine dön"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold">{secili}</h2>
                {seciliVeri && (
                  <p className="text-xs text-zinc-400">
                    {seciliVeri.eposta > 0 ? `İlk mail ${tarih(seciliVeri.ilk)} · son ${tarih(seciliVeri.son)}` : "Mail gitmedi"}
                  </p>
                )}
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
            {seciliVeri && (
              <div className="grid grid-cols-3 gap-2 border-b border-white/10 p-3 text-center">
                <Sayac deger={seciliVeri.firma} ad="firma" vurgu />
                <Sayac deger={seciliVeri.yanit} ad="yanıt" />
                <Sayac deger={seciliVeri.olumlu} ad="olumlu" />
                <Sayac deger={seciliVeri.eposta} ad="mail giden" />
                <Sayac deger={seciliVeri.crm} ad="CRM'de" />
                <Sayac deger={seciliVeri.sirada} ad="sırada" />
              </div>
            )}
            <div className="hk-kaydir min-h-0 flex-1 overflow-y-auto p-2">
              {hata && <p className="p-3 text-sm text-red-300">Firmalar yüklenemedi.</p>}
              {!hata && !firmalar && <p className="p-3 text-sm text-zinc-500">Firmalar yükleniyor…</p>}
              {firmalar?.length === 0 && <p className="p-3 text-sm text-zinc-500">Bu ülkede ulaşılan firma yok.</p>}
              <ul className="space-y-1">
                {firmalar?.map((f) => {
                  const [durumAd, durumRenk] =
                    f.kaynak === "crm"
                      ? [`CRM · ${FIRMA_DURUMU[f.durum as keyof typeof FIRMA_DURUMU] ?? f.durum}`, "bg-[#e7a300]/20 text-[#ffd166]"]
                      : (PANEL_DURUMU[f.durum] ?? [f.durum, "bg-white/10 text-zinc-300"]);
                  const web = f.web ? (/^https?:\/\//i.test(f.web) ? f.web : `https://${f.web}`) : null;
                  return (
                    <li key={`${f.kaynak}-${f.id}`} className="rounded-lg px-2.5 py-2 hover:bg-white/[0.05]">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          {f.crmId ? (
                            <Link href={`/firmalar/${f.crmId}`} className="block truncate text-sm font-medium hover:text-[#ffd166]">
                              {f.ad}
                            </Link>
                          ) : (
                            <span className="block truncate text-sm font-medium">{f.ad}</span>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className={`rounded px-1.5 py-0.5 ${durumRenk}`}>{durumAd}</span>
                            {f.segment && <span className="truncate text-zinc-500">{f.segment}</span>}
                            {f.son && <span className="text-zinc-500">· {tarih(f.son)}</span>}
                          </div>
                        </div>
                        {web && (
                          <a
                            href={web}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-0.5 text-zinc-500 hover:text-white"
                            title={f.web}
                            aria-label={`${f.ad} sitesi`}
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
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
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 ps-8 pe-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#e7a300]"
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
                    onClick={() => sec(u.ulke)}
                    className="group w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-white/[0.06]"
                  >
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate group-hover:text-[#ffd166]">{u.ulke}</span>
                      {u.yanit > 0 && <span className="text-[11px] text-sky-300">{u.yanit} yanıt</span>}
                      <span className="tabular-nums font-semibold">{sayi(u.firma)}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#a87400] to-[#ffd166]"
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

      {/* Alt sağ: açıklama */}
      <div
        data-hk-engel
        className="hk-cam absolute bottom-4 right-4 hidden items-center gap-4 rounded-xl px-3 py-2 text-[11px] text-zinc-300 md:flex">
        <span className="flex items-center gap-2">
          az
          <span className="h-1.5 w-20 rounded-full bg-gradient-to-r from-[#e7a300]/30 to-[#ffd166]" />
          çok firma
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#ff6b6b]" /> Servosteel
        </span>
        <span className="text-zinc-500">Sürükle · tekerlekle yakınlaştır · ülkeye tıkla</span>
      </div>
    </div>
  );
}

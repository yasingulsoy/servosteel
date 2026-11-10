"use client";

import { useEffect, useRef } from "react";
import type { GlobeInstance } from "globe.gl";
import type { Feature, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { ES_AD, MERKEZ, MERKEZ_OFIS, TURKCE_AD } from "@/lib/dunya-ulkeleri";
import type { HaritaUlkesi } from "@/lib/harita";

/**
 * Dönen 3B dünya (globe.gl / three.js). Yalnız tarayıcıda çalışır; sahne.tsx
 * bunu `ssr: false` ile yükler.
 *
 * Katmanlar: ülke çokgenleri (ulaşılan ülkeler altın, koyuluğu firma
 * sayısıyla), İstanbul'dan ulaşılan ülkelere akan yaylar, ülke başına sayıyla
 * boyu artan sütun, ülke etiketleri ("Polonya · 33 firma").
 *
 * Etiketler üst üste binmesin diye her 200 ms'de ekranda yerleşim yapılır:
 * büyük sayılı ülke önce yerleşir, çakışan küçükler gizlenir. Yakınlaştıkça
 * ülkeler ekranda açıldığı için daha çok etiket sığar; firma olmayan
 * ülkelerin adları da ancak yakında görünür.
 */

export type KureApi = {
  ucus: (ulke: string) => void;
  dondur: (acik: boolean) => void;
  ev: () => void;
};

type Props = {
  ulkeler: HaritaUlkesi[];
  secili: string | null;
  donme: boolean;
  onSec: (ulke: string | null) => void;
  onHazir: (api: KureApi) => void;
};

/** Kullanıcı küreyi bıraktıktan sonra dönme bu kadar bekleyip sürer. */
const DONME_BEKLEME_MS = 8000;

type UlkeOgesi = {
  ad: string;
  geometry: Geometry;
  veri: HaritaUlkesi | null;
  lat: number;
  lng: number;
  /** ağırlık merkezi alınan kara parçasının yaklaşık alanı (derece²) */
  alan: number;
  /** 0–1, firma sayısının logaritmik payı */
  t: number;
};

type Etiket = {
  ad: string;
  el: HTMLDivElement;
  lat: number;
  lng: number;
  yukseklik: number;
  oncelik: number;
  veri: boolean;
  w: number;
  h: number;
  gorunur: boolean;
};

const BASLANGIC = { lat: 34, lng: 30, altitude: 2.35 };
const DONME_HIZI = 0.45;
const sayiBicim = new Intl.NumberFormat("tr-TR");

/** En büyük kara parçasının düzlemsel ağırlık merkezi: [enlem, boylam, alan]. */
function agirlikMerkezi(g: Geometry): [number, number, number] | null {
  const parcalar = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  let en: [number, number, number] | null = null;
  for (const p of parcalar) {
    const halka = p[0];
    let a = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0, j = halka.length - 1; i < halka.length; j = i++) {
      const [x0, y0] = halka[j];
      const [x1, y1] = halka[i];
      const f = x0 * y1 - x1 * y0;
      a += f;
      cx += (x0 + x1) * f;
      cy += (y0 + y1) * f;
    }
    if (a !== 0 && (!en || Math.abs(a) / 2 > en[2])) en = [cy / (3 * a), cx / (3 * a), Math.abs(a) / 2];
  }
  return en;
}

function kacisli(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function ipucuHtml(o: UlkeOgesi): string {
  const v = o.veri;
  if (!v) return `<div class="hk-ipucu"><b>${kacisli(o.ad)}</b><span>Henüz ulaşılmadı</span></div>`;
  const satirlar = [
    v.eposta ? `${sayiBicim.format(v.eposta)} firmaya mail` : null,
    v.yanit ? `${sayiBicim.format(v.yanit)} yanıt${v.olumlu ? ` · ${sayiBicim.format(v.olumlu)} olumlu` : ""}` : null,
    v.crm ? `CRM'de ${sayiBicim.format(v.crm)} firma${v.musteri ? ` · ${v.musteri} müşteri` : ""}` : null,
    v.sirada ? `${sayiBicim.format(v.sirada)} firma sırada` : null,
  ].filter(Boolean);
  return `<div class="hk-ipucu"><b>${kacisli(o.ad)} · ${sayiBicim.format(v.firma)} firma</b>${satirlar
    .map((s) => `<span>${s}</span>`)
    .join("")}</div>`;
}

function etiketElemani(ad: string, v: HaritaUlkesi | null, ev: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.className = `hk-etiket${v ? "" : " hk-bos"}${ev ? " hk-ev" : ""} hk-gizli`;
  const adEl = document.createElement("div");
  adEl.className = "hk-ad";
  adEl.textContent = ev ? `${ad} · merkez` : ad;
  el.appendChild(adEl);
  if (v && v.firma > 0) {
    const s = document.createElement("div");
    s.className = "hk-sayi";
    const b = document.createElement("b");
    b.textContent = sayiBicim.format(v.firma);
    s.append(b, " firma");
    el.appendChild(s);
    if (v.yanit > 0) {
      const ek = document.createElement("div");
      ek.className = "hk-ek";
      ek.textContent = `${v.yanit} yanıt${v.olumlu ? ` · ${v.olumlu} olumlu` : ""}`;
      el.appendChild(ek);
    }
  }
  return el;
}

export default function Kure({ ulkeler, secili, donme, onSec, onHazir }: Props) {
  const kapRef = useRef<HTMLDivElement>(null);
  const seciliRef = useRef<string | null>(secili);
  const donmeRef = useRef(donme);
  const yenileRef = useRef<() => void>(() => {});
  /* Geri çağırmalar her çizimde değişebilir; küre bir kez kuruluyor. */
  const cagriRef = useRef({ onSec, onHazir });
  useEffect(() => {
    cagriRef.current = { onSec, onHazir };
  });

  useEffect(() => {
    const kap = kapRef.current;
    if (!kap) return;
    let iptal = false;
    let globe: GlobeInstance | null = null;
    const temizlik: (() => void)[] = [];

    (async () => {
      const [{ default: Globe }, { feature }, dunya] = await Promise.all([
        import("globe.gl"),
        import("topojson-client"),
        fetch("/dunya/countries-50m.json").then(
          (r) => r.json() as Promise<Topology<{ countries: GeometryCollection<{ name: string }> }>>,
        ),
      ]);
      if (iptal) return;

      const veriHaritasi = new Map(ulkeler.map((u) => [ES_AD[u.ulke] ?? u.ulke, u]));
      const enCok = Math.max(1, ...ulkeler.map((u) => u.firma));
      const pay = (n: number) => (n > 0 ? Math.log1p(n) / Math.log1p(enCok) : 0);

      const ogeler: UlkeOgesi[] = [];
      const fc = feature(dunya, dunya.objects.countries);
      for (const f of fc.features as Feature<Geometry, { name: string }>[]) {
        const en = f.properties.name;
        if (en === "Antarctica" || !f.geometry) continue;
        const ad = TURKCE_AD[en] ?? en;
        const m = agirlikMerkezi(f.geometry);
        if (!m) continue;
        const [lat, lng] = MERKEZ[ad] ?? [m[0], m[1]];
        const veri = TURKCE_AD[en] ? (veriHaritasi.get(ad) ?? null) : null;
        ogeler.push({ ad, geometry: f.geometry, veri, lat, lng, alan: m[2], t: pay(veri?.firma ?? 0) });
      }
      const ogeAdi = new Map(ogeler.map((o) => [o.ad, o]));

      /* Ulaşılan ülkeler. Haritada çokgeni olmayan (Bahreyn, Singapur, Malta
         gibi çok küçük) ülke `cokgen: false`: yerine nokta konur. */
      const noktalar: { ad: string; lat: number; lng: number; t: number; veri: HaritaUlkesi; cokgen: boolean }[] = [];
      for (const [ad, v] of veriHaritasi) {
        const o = ogeAdi.get(ad);
        if (o) {
          if (v.firma > 0) noktalar.push({ ad, lat: o.lat, lng: o.lng, t: o.t, veri: v, cokgen: true });
        } else if (MERKEZ[ad] && v.firma > 0) {
          noktalar.push({ ad, lat: MERKEZ[ad][0], lng: MERKEZ[ad][1], t: pay(v.firma), veri: v, cokgen: false });
        }
      }
      const noktaAdi = new Map(noktalar.map((n) => [n.ad, n]));

      let ustunde: UlkeOgesi | null = null;
      const kapakRengi = (o: UlkeOgesi) => {
        const s = o.ad === seciliRef.current;
        const u = o === ustunde;
        if (o.ad === "Türkiye") return s || u ? "rgba(255, 110, 110, 0.95)" : "rgba(220, 60, 60, 0.8)";
        if (!o.veri || o.veri.firma === 0) return u ? "rgba(70, 92, 124, 0.95)" : "rgba(34, 48, 70, 0.92)";
        if (s) return "rgba(255, 214, 102, 1)";
        const a = 0.32 + o.t * 0.6 + (u ? 0.2 : 0);
        return `rgba(231, 163, 0, ${Math.min(1, a).toFixed(3)})`;
      };
      /* Ulaşılan ülke firma sayısıyla yükselir (3B sütun grafiği gibi);
         üstüne gelinen ve seçilen biraz daha kalkar. */
      const taban = (t: number) => 0.007 + t * t * 0.04;
      const yukseklik = (o: UlkeOgesi) =>
        (o.veri && o.veri.firma > 0 ? taban(o.t) : 0.004) +
        (o.ad === seciliRef.current ? 0.014 : o === ustunde ? 0.006 : 0);

      globe = new Globe(kap, {
        animateIn: true,
        rendererConfig: { antialias: true, alpha: true, powerPreference: "high-performance" },
      });
      globe
        .width(kap.clientWidth)
        .height(kap.clientHeight)
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor("#4f9dff")
        .atmosphereAltitude(0.2)
        .showGraticules(true);
      const malzeme = globe.globeMaterial() as unknown as {
        color: { set: (c: string) => void };
        emissive: { set: (c: string) => void };
        shininess: number;
      };
      malzeme.color.set("#0a1a30");
      malzeme.emissive.set("#04101f");
      malzeme.shininess = 6;

      const cokgenleriYenile = () => {
        globe!.polygonCapColor((o: object) => kapakRengi(o as UlkeOgesi)).polygonAltitude((o: object) => yukseklik(o as UlkeOgesi));
      };

      globe
        .polygonsData(ogeler)
        .polygonGeoJsonGeometry("geometry")
        .polygonSideColor(() => "rgba(4, 10, 20, 0.55)")
        .polygonStrokeColor(() => "rgba(150, 180, 220, 0.32)")
        .polygonCapCurvatureResolution(4)
        .polygonsTransitionDuration(250)
        .polygonLabel((o: object) => ipucuHtml(o as UlkeOgesi))
        .onPolygonHover((o: object | null) => {
          ustunde = (o as UlkeOgesi) ?? null;
          kap.style.cursor = ustunde?.veri ? "pointer" : "";
          cokgenleriYenile();
        })
        .onPolygonClick((o: object) => {
          const u = o as UlkeOgesi;
          cagriRef.current.onSec(u.veri ? u.ad : null);
        })
        .onGlobeClick(() => cagriRef.current.onSec(null));
      cokgenleriYenile();

      /* İstanbul'dan ulaşılan ülkelere yaylar. Kalınlık derece cinsinden;
         yakınlaşınca şerit gibi kalınlaşmasın diye üç basamakta incelir. */
      const kalinlikBasamagi = (irt: number) => (irt > 1.5 ? 1 : irt > 0.8 ? 0.45 : 0.2);
      let yayKalinligi = kalinlikBasamagi(BASLANGIC.altitude);
      const yaylar = noktalar
        .filter((n) => n.ad !== "Türkiye" && n.veri.eposta + n.veri.crm > 0)
        .map((n, i) => ({ ...n, bosluk: (i * 0.137) % 1, sure: 2600 + ((i * 397) % 2600) }));
      globe
        .arcsData(yaylar)
        .arcStartLat(() => MERKEZ_OFIS.lat)
        .arcStartLng(() => MERKEZ_OFIS.lng)
        .arcEndLat((d: object) => (d as (typeof yaylar)[number]).lat)
        .arcEndLng((d: object) => (d as (typeof yaylar)[number]).lng)
        .arcColor(() => ["rgba(231, 163, 0, 0.04)", "rgba(255, 205, 90, 0.9)"])
        .arcStroke((d: object) => yayKalinligi * (0.12 + (d as (typeof yaylar)[number]).t * 0.38))
        .arcAltitudeAutoScale(0.38)
        .arcDashLength(0.42)
        .arcDashGap(1.3)
        .arcDashInitialGap((d: object) => (d as (typeof yaylar)[number]).bosluk)
        .arcDashAnimateTime((d: object) => (d as (typeof yaylar)[number]).sure)
        .arcsTransitionDuration(0);

      /* Çokgeni olmayan küçük ülkeler için nokta */
      globe
        .pointsData(noktalar.filter((n) => !n.cokgen))
        .pointLat("lat")
        .pointLng("lng")
        .pointAltitude(0.012)
        .pointRadius(0.35)
        .pointColor(() => "#ffc845")
        .pointResolution(16)
        .pointsMerge(true)
        .pointsTransitionDuration(0);

      const halkalariYenile = () => {
        const s = seciliRef.current ? (noktaAdi.get(seciliRef.current) ?? ogeAdi.get(seciliRef.current)) : null;
        const h: { lat: number; lng: number; ev: boolean }[] = [{ ...MERKEZ_OFIS, ev: true }];
        if (s) h.push({ lat: s.lat, lng: s.lng, ev: false });
        globe!
          .ringsData(h)
          .ringLat("lat")
          .ringLng("lng")
          .ringColor((d: object) => ((t: number) =>
            (d as { ev: boolean }).ev ? `rgba(255, 100, 100, ${1 - t})` : `rgba(255, 214, 102, ${1 - t})`))
          .ringMaxRadius((d: object) => ((d as { ev: boolean }).ev ? 3.2 : 5))
          .ringPropagationSpeed(2.2)
          .ringRepeatPeriod((d: object) => ((d as { ev: boolean }).ev ? 1500 : 900));
      };
      halkalariYenile();

      /* Etiketler */
      /* Yalnız Türkçe adı olan ülkeler etiketlenir; küçük bölgeler (Guernsey,
         Åland…) adsız kalır. Verisi olan ülkenin etiketi yükselen ülkenin üstünde. */
      const turkceAdlar = new Set(Object.values(TURKCE_AD));
      const etiketler: Etiket[] = [];
      for (const o of ogeler) {
        if (!turkceAdlar.has(o.ad) || noktaAdi.has(o.ad)) continue;
        etiketler.push({
          ad: o.ad,
          el: etiketElemani(o.ad, o.veri, o.ad === "Türkiye"),
          lat: o.lat,
          lng: o.lng,
          yukseklik: 0.01,
          oncelik: o.alan,
          veri: false,
          w: 0,
          h: 0,
          gorunur: false,
        });
      }
      for (const n of noktalar) {
        etiketler.push({
          ad: n.ad,
          el: etiketElemani(n.ad, n.veri, n.ad === "Türkiye"),
          lat: n.lat,
          lng: n.lng,
          yukseklik: n.cokgen ? taban(n.t) + 0.004 : 0.016,
          oncelik: 1e6 + n.veri.firma,
          veri: true,
          w: 0,
          h: 0,
          gorunur: false,
        });
      }
      for (const e of etiketler) {
        if (e.veri) {
          e.el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            cagriRef.current.onSec(e.ad);
          });
        }
      }
      globe
        .htmlElementsData(etiketler)
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlAltitude("yukseklik")
        .htmlElement((d: object) => (d as Etiket).el)
        /* Arka yüz kontrolünü yerlestir() kendisi yapıyor; kütüphane gizlemesin. */
        .htmlElementVisibilityModifier(() => {})
        .htmlTransitionDuration(0);

      const rad = Math.PI / 180;
      /** Kameranın baktığı noktaya açısal uzaklık (radyan). */
      const aci = (lat: number, lng: number, pov: { lat: number; lng: number }) => {
        const c =
          Math.sin(lat * rad) * Math.sin(pov.lat * rad) +
          Math.cos(lat * rad) * Math.cos(pov.lat * rad) * Math.cos((lng - pov.lng) * rad);
        return Math.acos(Math.max(-1, Math.min(1, c)));
      };
      /* Veri etiketleri büyükten küçüğe sıralı; uzaktan bakınca yalnız ilk
         bu kadarı yarışır, yaklaştıkça hepsi. */
      const veriSirasi = new Map(
        etiketler.filter((e) => e.veri).sort((a, b) => b.oncelik - a.oncelik).map((e, i) => [e.ad, i]),
      );
      const kotasi = (irt: number) => (irt > 1.9 ? 14 : irt > 1.3 ? 30 : irt > 0.8 ? 70 : Infinity);

      let irtifa = BASLANGIC.altitude;
      const yerlestir = () => {
        if (!globe) return;
        const W = kap.clientWidth;
        const H = kap.clientHeight;
        const s = seciliRef.current;
        const pov = globe.pointOfView();
        irtifa = pov.altitude;
        /* Ufuk: yüzeyden bakılabilen en uzak nokta; kenara yapışan etiket okunmaz, biraz içeride kes. */
        const ufuk = Math.acos(1 / (1 + pov.altitude)) * 0.9;
        const kota = kotasi(irtifa);
        const sirali = [...etiketler].sort(
          (a, b) => (b.ad === s ? 1e9 : b.oncelik) - (a.ad === s ? 1e9 : a.oncelik),
        );
        /* Cam panellerin altına etiket koyma: yarı saydam oldukları için sızıyor. */
        const kapKutu = kap.getBoundingClientRect();
        const kutular: [number, number, number, number][] = [];
        for (const engel of document.querySelectorAll<HTMLElement>("[data-hk-engel]")) {
          const r = engel.getBoundingClientRect();
          if (r.width && r.height)
            kutular.push([r.left - kapKutu.left, r.top - kapKutu.top, r.right - kapKutu.left, r.bottom - kapKutu.top]);
        }
        for (const e of sirali) {
          let goster = aci(e.lat, e.lng, pov) < ufuk;
          if (goster && e.ad !== s) {
            if (e.veri) goster = (veriSirasi.get(e.ad) ?? 0) < kota;
            else goster = irtifa < 1.1;
          }
          if (goster) {
            if (!e.w) {
              e.w = e.el.offsetWidth;
              e.h = e.el.offsetHeight;
            }
            const p = globe.getScreenCoords(e.lat, e.lng, e.yukseklik);
            const x0 = p.x - e.w / 2 - 4;
            const y0 = p.y - e.h / 2 - 3;
            const x1 = p.x + e.w / 2 + 4;
            const y1 = p.y + e.h / 2 + 3;
            if (!e.w || x0 < 0 || y0 < 0 || x1 > W || y1 > H) goster = false;
            else if (kutular.some((k) => x0 < k[2] && x1 > k[0] && y0 < k[3] && y1 > k[1])) goster = false;
            else kutular.push([x0, y0, x1, y1]);
          }
          if (goster !== e.gorunur) {
            e.gorunur = goster;
            e.el.classList.toggle("hk-gizli", !goster);
          }
          e.el.classList.toggle("hk-secili", e.ad === s);
        }
      };
      const yerlesimSaati = window.setInterval(yerlestir, 200);
      temizlik.push(() => window.clearInterval(yerlesimSaati));

      const kontrol = globe.controls();
      kontrol.autoRotate = donmeRef.current;
      kontrol.autoRotateSpeed = DONME_HIZI;
      kontrol.enableDamping = true;
      kontrol.dampingFactor = 0.08;
      kontrol.minDistance = 112;
      kontrol.maxDistance = 620;
      kontrol.rotateSpeed = 0.55;
      kontrol.zoomSpeed = 0.9;

      const yakinlikSinifi = () => {
        const yakin = irtifa < 0.75;
        if (kap.classList.contains("hk-yakin") !== yakin) {
          kap.classList.toggle("hk-yakin", yakin);
          for (const e of etiketler) e.w = 0;
        }
      };
      globe.onZoom((pov) => {
        irtifa = pov.altitude;
        kontrol.autoRotateSpeed = DONME_HIZI * Math.min(1, Math.max(0.12, irtifa / 2.2));
        yakinlikSinifi();
        const k = kalinlikBasamagi(irtifa);
        if (k !== yayKalinligi) {
          yayKalinligi = k;
          globe!.arcStroke((d: object) => yayKalinligi * (0.12 + (d as (typeof yaylar)[number]).t * 0.38));
        }
      });
      /* Kullanıcı tutunca dur, bırakınca biraz bekleyip yeniden dön. */
      let bekleme = 0;
      const tutuldu = () => {
        window.clearTimeout(bekleme);
        kontrol.autoRotate = false;
      };
      const birakildi = () => {
        window.clearTimeout(bekleme);
        bekleme = window.setTimeout(() => {
          kontrol.autoRotate = donmeRef.current && !seciliRef.current;
        }, DONME_BEKLEME_MS);
      };
      kontrol.addEventListener("start", tutuldu);
      kontrol.addEventListener("end", birakildi);
      temizlik.push(() => {
        window.clearTimeout(bekleme);
        kontrol.removeEventListener("start", tutuldu);
        kontrol.removeEventListener("end", birakildi);
      });

      /* Geniş ekranda sağda 20rem'lik panel var: küreyi kalan alanın ortasına kaydır. */
      const boyutla = () =>
        globe
          ?.width(kap.clientWidth)
          .height(kap.clientHeight)
          .globeOffset([kap.clientWidth >= 768 ? -170 : 0, 0]);
      boyutla();
      const gozlemci = new ResizeObserver(boyutla);
      gozlemci.observe(kap);
      temizlik.push(() => gozlemci.disconnect());

      globe.pointOfView(BASLANGIC, 0);

      yenileRef.current = () => {
        cokgenleriYenile();
        halkalariYenile();
        kontrol.autoRotate = donmeRef.current && !seciliRef.current;
        yerlestir();
      };

      cagriRef.current.onHazir({
        ucus: (ad) => {
          const o = noktaAdi.get(ad) ?? ogeAdi.get(ad);
          if (!o || !globe) return;
          const alan = ogeAdi.get(ad)?.alan ?? 1;
          const hedef = Math.min(1.8, Math.max(0.6, 0.5 + Math.sqrt(alan) / 30));
          globe.pointOfView({ lat: o.lat, lng: o.lng, altitude: hedef }, 1400);
        },
        dondur: (acik) => {
          donmeRef.current = acik;
          kontrol.autoRotate = acik && !seciliRef.current;
        },
        ev: () => globe?.pointOfView(BASLANGIC, 1400),
      });
    })().catch((e) => console.error("[harita] küre kurulamadı:", e));

    return () => {
      iptal = true;
      for (const t of temizlik) t();
      yenileRef.current = () => {};
      if (globe) {
        globe.pauseAnimation();
        globe.renderer().dispose();
        globe._destructor();
      }
      kap.replaceChildren();
      kap.classList.remove("hk-yakin");
    };
    /* Veri sayfa yüklenince bir kez geliyor; değişirse küre baştan kurulur. */
  }, [ulkeler]);

  useEffect(() => {
    seciliRef.current = secili;
    donmeRef.current = donme;
    yenileRef.current();
  }, [secili, donme]);

  /* isolate: CSS2D etiketleri derinlik için z-index alıyor; yığın burada
     kapanmazsa etiketler yan panelin üstüne çıkar. */
  return <div ref={kapRef} className="absolute inset-0 isolate" />;
}

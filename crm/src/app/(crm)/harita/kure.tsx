"use client";

import { useEffect, useRef } from "react";
import type { GlobeInstance } from "globe.gl";
import type { Feature, Geometry, Position } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import type * as THREEType from "three";
import { ES_AD, MERKEZ, MERKEZ_OFIS, TURKCE_AD } from "@/lib/dunya-ulkeleri";
import type { AkisOgesi, HaritaFirmalari, HaritaUlkesi } from "@/lib/harita";
import { DURUM_KODU } from "@/lib/harita-sabit";

/**
 * Dönen 3B dünya. Hafif olsun diye ağır işler GPU'ya tek parça gidiyor:
 *
 * - Kara, deniz ve ülke renkleri bir kez 4096×2048 tuvale boyanıp kürenin
 *   dokusu oluyor (ülke başına 3B çokgen yok; eski sürüm açılışta bu yüzden donuyordu).
 * - Sınırlar tek bir çizgi grubu, şehir noktaları tek bir nokta bulutu
 *   (kendi gölgelendiricisiyle parlıyor, tek çizim çağrısı).
 * - Canlı akış: son 24 saatte giden mailler ve son yanıtlar sırayla İstanbul'dan
 *   şehre (yanıt şehirden İstanbul'a) yay olarak uçuyor; aynı anda en çok 12 yay.
 * - Etiketler: ekrana sığanlar seçilip yalnız onlar DOM'a konuyor (en çok ~60).
 * - Fare altındaki şehir/ülke kütüphanenin ışın izlemesiyle değil, ekran
 *   koordinatıyla ve çokgen içi testiyle bulunuyor.
 */

export type Secim = { ulke: string; sehir: string | null };

/** Hangi firmalar görünsün: durum kodları (DURUM_KODU), segment maskesi (0 = hepsi), gün (null = bugün). */
export type Suzgec = { durumlar: number[]; segment: number; gun: number | null };

export type KureApi = {
  ucus: (s: Secim) => void;
  dondur: (acik: boolean) => void;
  ev: () => void;
  /** Zaman çizelgesi: o gün mail giden firmalara yay atar, o günün firma sayısını döner. */
  gunYaylari: (gun: number) => number;
  /** Canlı yoklamadan gelen yeni olaylar; sıradakilerden önce oynar. */
  olayEkle: (o: AkisOgesi[]) => void;
  /** Zaman çizelgesi oynarken canlı akış tekrarı durur. */
  akisDuraklat: (d: boolean) => void;
};

type Props = {
  ulkeler: HaritaUlkesi[];
  veri: HaritaFirmalari;
  suzgec: Suzgec;
  akis: AkisOgesi[];
  secili: Secim | null;
  donme: boolean;
  onSec: (s: Secim | null) => void;
  onHazir: (api: KureApi) => void;
  onOlay: (o: AkisOgesi) => void;
};

type Halka = { bbox: [number, number, number, number]; halkalar: Position[][] };
type UlkeOgesi = {
  ad: string;
  geometry: Geometry;
  parcalar: Halka[];
  lat: number;
  lng: number;
  alan: number;
  veri: HaritaUlkesi | null;
};
type NoktaOgesi = {
  ulke: string;
  sehir: string | null;
  nlat: number;
  nlng: number;
  firma: number;
  mail: number;
  yanit: number;
  olumlu: number;
  crm: number;
  sirada: number;
  renk: string;
  boyut: number;
};
type Etiket = {
  anahtar: string;
  tur: "ulke" | "sehir" | "ad";
  el: HTMLDivElement;
  lat: number;
  lng: number;
  irtifa: number;
  oncelik: number;
  w: number;
  h: number;
  secim: Secim | null;
};

const BASLANGIC = { lat: 36, lng: 28, altitude: 2.3 };
const DONME_HIZI = 0.45;
const DONME_BEKLEME_MS = 8000;
const AKIS_ARALIK_MS = 700;
const YAY_SURE_MS = 1700;
const EN_COK_YAY = 12;

const RENK = {
  mail: "#ffb43c",
  yanit: "#3cc8ff",
  olumlu: "#3dff9a",
  crm: "#c07bff",
  sirada: "#8fa6c8",
  merkez: "#ff4d5e",
};

const sayiBicim = new Intl.NumberFormat("tr-TR");

/** En büyük kara parçasının düzlemsel ağırlık merkezi: [enlem, boylam, alan]. */
function agirlikMerkezi(parcalar: Position[][][]): [number, number, number] | null {
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

function cokgenler(g: Geometry): Position[][][] {
  return g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
}

function icinde(lng: number, lat: number, halka: Position[]): boolean {
  let ic = false;
  for (let i = 0, j = halka.length - 1; i < halka.length; j = i++) {
    const [xi, yi] = halka[i];
    const [xj, yj] = halka[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
}

function ulkedeMi(o: UlkeOgesi, lng: number, lat: number): boolean {
  for (const p of o.parcalar) {
    const [a, b, c, d] = p.bbox;
    if (lng < a || lng > c || lat < b || lat > d) continue;
    if (icinde(lng, lat, p.halkalar[0]) && !p.halkalar.slice(1).some((h) => icinde(lng, lat, h))) return true;
  }
  return false;
}

function kacisli(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function el(sinif: string, ...cocuklar: (Node | string)[]): HTMLDivElement {
  const d = document.createElement("div");
  d.className = sinif;
  d.append(...cocuklar);
  return d;
}

/* Ölçüm kopyayla: asıl eleman kürenin CSS2D katmanına bağlıyken taşınır ya
   da stili sıfırlanırsa (position) etiket ekran boyu şerit olur. */
function etiketBoyutu(e: HTMLDivElement): [number, number] {
  const k = e.cloneNode(true) as HTMLDivElement;
  k.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;transform:none";
  document.body.appendChild(k);
  const r: [number, number] = [k.offsetWidth, k.offsetHeight];
  k.remove();
  return r;
}

export default function Kure({ ulkeler, veri, suzgec, akis, secili, donme, onSec, onHazir, onOlay }: Props) {
  const kapRef = useRef<HTMLDivElement>(null);
  const ipucuRef = useRef<HTMLDivElement>(null);
  const seciliRef = useRef<Secim | null>(secili);
  const donmeRef = useRef(donme);
  const suzgecRef = useRef(suzgec);
  const yenileRef = useRef<() => void>(() => {});
  const uygulaRef = useRef<() => void>(() => {});
  /* Geri çağırmalar her çizimde değişebilir; küre bir kez kuruluyor. */
  const cagriRef = useRef({ onSec, onHazir, onOlay });
  useEffect(() => {
    cagriRef.current = { onSec, onHazir, onOlay };
  });

  useEffect(() => {
    const kap = kapRef.current;
    const ipucu = ipucuRef.current;
    if (!kap || !ipucu) return;
    let iptal = false;
    let globe: GlobeInstance | null = null;
    const temizlik: (() => void)[] = [];

    (async () => {
      const [{ default: Globe }, THREE, { feature }, dunya] = await Promise.all([
        import("globe.gl"),
        import("three"),
        import("topojson-client"),
        fetch("/dunya/countries-50m.json").then(
          (r) => r.json() as Promise<Topology<{ countries: GeometryCollection<{ name: string }> }>>,
        ),
      ]);
      if (iptal) return;

      /* ---- Veri ---- */
      const veriHaritasi = new Map(ulkeler.map((u) => [ES_AD[u.ulke] ?? u.ulke, u]));
      const enCok = Math.max(1, ...ulkeler.map((u) => u.firma));
      const pay = (n: number) => (n > 0 ? Math.log1p(n) / Math.log1p(enCok) : 0);

      const ogeler: UlkeOgesi[] = [];
      for (const f of feature(dunya, dunya.objects.countries).features as Feature<Geometry, { name: string }>[]) {
        const en = f.properties.name;
        if (en === "Antarctica" || !f.geometry) continue;
        const ad = TURKCE_AD[en] ?? en;
        const p = cokgenler(f.geometry);
        const m = agirlikMerkezi(p);
        if (!m) continue;
        const [lat, lng] = MERKEZ[ad] ?? [m[0], m[1]];
        const parcalar = p.map((halkalar) => {
          let a = 180,
            b = 90,
            c = -180,
            d = -90;
          for (const [x, y] of halkalar[0]) {
            a = Math.min(a, x);
            b = Math.min(b, y);
            c = Math.max(c, x);
            d = Math.max(d, y);
          }
          return { bbox: [a, b, c, d] as [number, number, number, number], halkalar };
        });
        ogeler.push({
          ad,
          geometry: f.geometry,
          parcalar,
          lat,
          lng,
          alan: m[2],
          veri: TURKCE_AD[en] ? (veriHaritasi.get(ad) ?? null) : null,
        });
      }
      const ogeAdi = new Map(ogeler.map((o) => [o.ad, o]));
      const ulkeNoktasi = (ulke: string): { lat: number; lng: number } | null => {
        const ad = ES_AD[ulke] ?? ulke;
        const o = ogeAdi.get(ad);
        if (o) return { lat: o.lat, lng: o.lng };
        return MERKEZ[ad] ? { lat: MERKEZ[ad][0], lng: MERKEZ[ad][1] } : null;
      };

      /* Firmaları süzgece göre yer yer topla. Zaman çizelgesinde yalnız o güne
         kadar mail gidenler ve hepsi "mail" renginde (yanıtın günü bu tabloda yok). */
      const yerKoord = veri.yerler.map((y) =>
        y.lat != null && y.lng != null ? { lat: y.lat, lng: y.lng } : ulkeNoktasi(y.ulke),
      );
      const topla = (sz: Suzgec): NoktaOgesi[] => {
        const acik = new Set(sz.durumlar);
        const yerde = new Map<number, NoktaOgesi>();
        for (const [yi, durum, maske, gun] of veri.firmalar) {
          if (!acik.has(durum)) continue;
          if (sz.segment && !(maske & sz.segment)) continue;
          if (sz.gun !== null && (gun < 0 || gun > sz.gun)) continue;
          const k = yerKoord[yi];
          if (!k) continue;
          let n = yerde.get(yi);
          if (!n) {
            const y = veri.yerler[yi];
            n = { ulke: y.ulke, sehir: y.sehir, nlat: k.lat, nlng: k.lng, firma: 0, mail: 0, yanit: 0, olumlu: 0, crm: 0, sirada: 0, renk: "", boyut: 0 };
            yerde.set(yi, n);
          }
          n.firma++;
          const d = sz.gun !== null ? DURUM_KODU.mail : durum;
          if (d === DURUM_KODU.olumlu) {
            n.olumlu++;
            n.yanit++;
          } else if (d === DURUM_KODU.yanit) n.yanit++;
          else if (d === DURUM_KODU.crm) n.crm++;
          else if (d === DURUM_KODU.sirada) n.sirada++;
          else n.mail++;
        }
        const liste = [...yerde.values()];
        for (const n of liste) {
          n.renk = n.olumlu ? RENK.olumlu : n.yanit ? RENK.yanit : n.crm ? RENK.crm : n.mail ? RENK.mail : RENK.sirada;
          n.boyut = n.sehir ? Math.min(26, 5 + 3.2 * Math.sqrt(n.firma)) : Math.min(22, 7 + 1.4 * Math.sqrt(n.firma));
        }
        return liste.sort((a, b) => b.firma - a.firma);
      };
      let nokta: NoktaOgesi[] = topla(suzgecRef.current);

      /* ---- Küre ---- */
      globe = new Globe(kap, {
        animateIn: false,
        rendererConfig: { antialias: true, alpha: true, powerPreference: "high-performance" },
      });
      const renderer = globe.renderer();
      const pikselOrani = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(pikselOrani);
      globe
        .width(kap.clientWidth)
        .height(kap.clientHeight)
        .backgroundColor("rgba(0,0,0,0)")
        .showGraticules(false)
        .showAtmosphere(true)
        .atmosphereColor("#2f7dff")
        .atmosphereAltitude(0.16)
        .enablePointerInteraction(false);

      /* Doku: deniz, kara (noktalı desen), ulaşılan ülkelerde hafif ışık, Türkiye kırmızımsı. */
      const W = Math.min(4096, renderer.capabilities.maxTextureSize);
      const H = W / 2;
      const tuval = document.createElement("canvas");
      tuval.width = W;
      tuval.height = H;
      const t = tuval.getContext("2d")!;
      t.fillStyle = "#030913";
      t.fillRect(0, 0, W, H);
      const kara = document.createElement("canvas");
      kara.width = W;
      kara.height = H;
      const k = kara.getContext("2d")!;
      const ciz = (o: UlkeOgesi) => {
        let tasti = false;
        k.beginPath();
        for (const p of o.parcalar) {
          for (const halka of p.halkalar) {
            let onceki = halka[0][0];
            let kaydir = 0;
            halka.forEach(([lng, lat], i) => {
              if (i > 0) {
                const fark = lng - onceki;
                if (fark > 180) kaydir -= 360;
                else if (fark < -180) kaydir += 360;
              }
              onceki = lng;
              if (kaydir) tasti = true;
              const x = ((lng + kaydir + 180) / 360) * W;
              const y = ((90 - lat) / 180) * H;
              if (i) k.lineTo(x, y);
              else k.moveTo(x, y);
            });
            k.closePath();
          }
        }
        const v = o.veri && o.veri.firma > 0 ? pay(o.veri.firma) : -1;
        k.fillStyle =
          o.ad === "Türkiye"
            ? "#4a1a26"
            : v < 0
              ? "#111c2e"
              : `rgb(${Math.round(22 + v * 26)}, ${Math.round(36 + v * 30)}, ${Math.round(60 + v * 34)})`;
        k.fill("evenodd");
        if (tasti) {
          k.save();
          k.translate(W, 0);
          k.fill("evenodd");
          k.translate(-2 * W, 0);
          k.fill("evenodd");
          k.restore();
        }
      };
      for (const o of ogeler) ciz(o);
      const desen = document.createElement("canvas");
      desen.width = 6;
      desen.height = 6;
      const dg = desen.getContext("2d")!;
      dg.fillStyle = "rgba(150, 195, 255, 0.16)";
      dg.beginPath();
      dg.arc(3, 3, 1, 0, Math.PI * 2);
      dg.fill();
      k.globalCompositeOperation = "source-atop";
      k.fillStyle = k.createPattern(desen, "repeat")!;
      k.fillRect(0, 0, W, H);
      t.drawImage(kara, 0, 0);
      const doku = new THREE.CanvasTexture(tuval);
      doku.colorSpace = THREE.SRGBColorSpace;
      doku.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      globe.globeMaterial(new THREE.MeshPhongMaterial({ map: doku, shininess: 6, specular: new THREE.Color("#0c1626") }));
      temizlik.push(() => doku.dispose());

      /* Sınırlar: bütün ülkeler tek çizgi grubu. */
      const sinirCizgisi = (liste: UlkeOgesi[], irtifa: number) => {
        const konum: number[] = [];
        for (const o of liste) {
          for (const p of o.parcalar) {
            for (const halka of p.halkalar) {
              for (let i = 1; i < halka.length; i++) {
                const [x0, y0] = halka[i - 1];
                const [x1, y1] = halka[i];
                if (Math.abs(x1 - x0) > 180) continue;
                const a = globe!.getCoords(y0, x0, irtifa);
                const b = globe!.getCoords(y1, x1, irtifa);
                konum.push(a.x, a.y, a.z, b.x, b.y, b.z);
              }
            }
          }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(konum, 3));
        return g;
      };
      const sinirlar = new THREE.LineSegments(
        sinirCizgisi(ogeler, 0.0008),
        new THREE.LineBasicMaterial({ color: "#3f6fae", transparent: true, opacity: 0.45, depthWrite: false }),
      );
      globe.scene().add(sinirlar);
      temizlik.push(() => {
        sinirlar.geometry.dispose();
        (sinirlar.material as THREEType.Material).dispose();
      });

      /* Seçili ve üstündeki ülkenin parlak sınırı */
      const vurguMalzeme = new THREE.LineBasicMaterial({ color: "#ffd166", transparent: true, opacity: 0.95, depthWrite: false });
      const ustMalzeme = new THREE.LineBasicMaterial({ color: "#9cc4ff", transparent: true, opacity: 0.8, depthWrite: false });
      let vurgu: THREEType.LineSegments | null = null;
      let ustCizgi: THREEType.LineSegments | null = null;
      const cizgiKoy = (eski: THREEType.LineSegments | null, o: UlkeOgesi | null, m: THREEType.LineBasicMaterial) => {
        if (eski) {
          globe!.scene().remove(eski);
          eski.geometry.dispose();
        }
        if (!o) return null;
        const yeni = new THREE.LineSegments(sinirCizgisi([o], 0.0016), m);
        globe!.scene().add(yeni);
        return yeni;
      };

      /* Şehir noktaları: tek nokta bulutu, parlayan çekirdek + hale; şehri bilinmeyen ülke payı halka. */
      const geoKur = (liste: NoktaOgesi[]) => {
      const noktaGeo = new THREE.BufferGeometry();
      const kon = new Float32Array(liste.length * 3 + 3);
      const renk = new Float32Array(liste.length * 3 + 3);
      const boy = new Float32Array(liste.length + 1);
      const tip = new Float32Array(liste.length + 1);
      const faz = new Float32Array(liste.length + 1);
      const c = new THREE.Color();
      liste.forEach((n, i) => {
        const p = globe!.getCoords(n.nlat, n.nlng, 0.003);
        kon.set([p.x, p.y, p.z], i * 3);
        c.set(n.renk);
        renk.set([c.r, c.g, c.b], i * 3);
        boy[i] = n.boyut;
        tip[i] = n.sehir ? 0 : 1;
        faz[i] = (i * 2.399) % (Math.PI * 2);
      });
      {
        const i = liste.length;
        const p = globe!.getCoords(MERKEZ_OFIS.lat, MERKEZ_OFIS.lng, 0.003);
        kon.set([p.x, p.y, p.z], i * 3);
        c.set(RENK.merkez);
        renk.set([c.r, c.g, c.b], i * 3);
        boy[i] = 16;
        tip[i] = 0;
        faz[i] = 0;
      }
      noktaGeo.setAttribute("position", new THREE.BufferAttribute(kon, 3));
      noktaGeo.setAttribute("aRenk", new THREE.BufferAttribute(renk, 3));
      noktaGeo.setAttribute("aBoyut", new THREE.BufferAttribute(boy, 1));
      noktaGeo.setAttribute("aTip", new THREE.BufferAttribute(tip, 1));
      noktaGeo.setAttribute("aFaz", new THREE.BufferAttribute(faz, 1));
      return noktaGeo;
      };
      const noktaMalzeme = new THREE.ShaderMaterial({
        uniforms: { uOran: { value: pikselOrani }, uZaman: { value: 0 } },
        vertexShader: `
          attribute vec3 aRenk; attribute float aBoyut; attribute float aTip; attribute float aFaz;
          uniform float uOran; uniform float uZaman;
          varying vec3 vRenk; varying float vTip;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float yakin = clamp(260.0 / -mv.z, 0.85, 2.0);
            float nabiz = 1.0 + 0.1 * sin(uZaman * 2.2 + aFaz);
            gl_PointSize = aBoyut * yakin * nabiz * uOran;
            gl_Position = projectionMatrix * mv;
            vRenk = aRenk; vTip = aTip;
          }`,
        fragmentShader: `
          varying vec3 vRenk; varying float vTip;
          void main() {
            float r = length(gl_PointCoord - 0.5) * 2.0;
            if (r > 1.0) discard;
            float hale = pow(1.0 - r, 2.4) * 0.6;
            float a;
            if (vTip > 0.5) {
              float halka = smoothstep(0.1, 0.0, abs(r - 0.6));
              a = max(halka * 0.45, hale * 0.25);
            } else {
              float cekirdek = smoothstep(0.38, 0.12, r);
              a = max(cekirdek, hale);
            }
            gl_FragColor = vec4(mix(vRenk, vec3(1.0), vTip > 0.5 ? 0.0 : smoothstep(0.25, 0.0, r) * 0.5), a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const bulut = new THREE.Points(geoKur(nokta), noktaMalzeme);
      bulut.onBeforeRender = () => {
        noktaMalzeme.uniforms.uZaman.value = performance.now() / 1000;
      };
      globe.scene().add(bulut);
      temizlik.push(() => {
        bulut.geometry.dispose();
        noktaMalzeme.dispose();
      });

      /* ---- Halkalar ve canlı yaylar ---- */
      type HalkaVeri = { lat: number; lng: number; renk: string; buyuk: number; kalici: boolean };
      let gecici: HalkaVeri[] = [];
      const halkalariYenile = () => {
        const s = seciliRef.current;
        const kalici: HalkaVeri[] = [{ ...MERKEZ_OFIS, renk: "255, 77, 94", buyuk: 3, kalici: true }];
        if (s) {
          const n = s.sehir !== null ? nokta.find((x) => x.ulke === s.ulke && (x.sehir ?? "") === s.sehir) : null;
          const k2 = n ? { lat: n.nlat, lng: n.nlng } : ulkeNoktasi(s.ulke);
          if (k2) kalici.push({ ...k2, renk: "255, 209, 102", buyuk: n ? 2.4 : 4.5, kalici: true });
        }
        globe!.ringsData([...kalici, ...gecici]);
      };
      globe
        .ringLat("lat")
        .ringLng("lng")
        .ringColor((d: object) => (t: number) => `rgba(${(d as HalkaVeri).renk}, ${(1 - t) * 0.9})`)
        .ringMaxRadius((d: object) => (d as HalkaVeri).buyuk)
        .ringPropagationSpeed((d: object) => ((d as HalkaVeri).kalici ? 1.6 : 3))
        .ringRepeatPeriod((d: object) => ((d as HalkaVeri).kalici ? 1500 : 5000));
      halkalariYenile();

      type Yay = { id: number; sLat: number; sLng: number; eLat: number; eLng: number; renk: [string, string] };
      let yaylar: Yay[] = [];
      let yaySira = 0;
      globe
        .arcStartLat("sLat")
        .arcStartLng("sLng")
        .arcEndLat("eLat")
        .arcEndLng("eLng")
        .arcColor("renk")
        .arcStroke(0.32)
        .arcAltitudeAutoScale(0.32)
        .arcDashLength(0.38)
        .arcDashGap(3)
        .arcDashInitialGap(1)
        .arcDashAnimateTime(YAY_SURE_MS)
        .arcsTransitionDuration(0)
        .arcsData([]);

      /* Son 24 saatin mailleri sırayla; her 6 mailde bir, son yanıtlardan biri (yeniden eskiye döner). */
      const mailler = akis.filter((a) => a.tur !== "yanit").sort((a, b) => a.zaman.localeCompare(b.zaman));
      const yanitlar = akis.filter((a) => a.tur === "yanit").sort((a, b) => b.zaman.localeCompare(a.zaman));
      const olaylar: AkisOgesi[] = [];
      mailler.forEach((m, i) => {
        olaylar.push(m);
        if (yanitlar.length && i % 6 === 5) olaylar.push(yanitlar[(i / 6) % yanitlar.length | 0]);
      });
      if (!mailler.length) olaylar.push(...yanitlar);
      let olaySira = 0;
      const oncelikli: AkisOgesi[] = [];
      let akisDurdu = false;
      const zamanlayicilar = new Set<number>();
      const sonra = (ms: number, f: () => void) => {
        const id = window.setTimeout(() => {
          zamanlayicilar.delete(id);
          if (!iptal) f();
        }, ms);
        zamanlayicilar.add(id);
      };
      temizlik.push(() => zamanlayicilar.forEach((id) => window.clearTimeout(id)));
      const yayAt = (hedef: { lat: number; lng: number }, tur: AkisOgesi["tur"]) => {
        if (!globe) return;
        const yanit = tur === "yanit";
        const r = yanit ? "60, 200, 255" : tur === "hatirlatma" ? "255, 225, 120" : "255, 180, 60";
        const [bas, son] = yanit ? [hedef, MERKEZ_OFIS] : [MERKEZ_OFIS, hedef];
        /* three-globe yayın kesiğini sondan başa yürütüyor: uçlar ters verilir ki baştan sona aksın. */
        const yay: Yay = {
          id: yaySira++,
          sLat: son.lat,
          sLng: son.lng,
          eLat: bas.lat,
          eLng: bas.lng,
          renk: [`rgba(${r}, 1)`, `rgba(${r}, 0.15)`],
        };
        yaylar = [...yaylar.slice(-(EN_COK_YAY - 1)), yay];
        globe.arcsData(yaylar);
        sonra(YAY_SURE_MS * 0.95, () => {
          const h: HalkaVeri = { ...son, renk: r, buyuk: yanit ? 3 : 2.2, kalici: false };
          gecici = [...gecici.slice(-8), h];
          halkalariYenile();
          sonra(900, () => {
            gecici = gecici.filter((x) => x !== h);
            halkalariYenile();
          });
        });
        sonra(YAY_SURE_MS * 1.45, () => {
          yaylar = yaylar.filter((x) => x !== yay);
          globe?.arcsData(yaylar);
        });
      };
      const olayAt = () => {
        if (akisDurdu || document.hidden || !globe) return;
        const o = oncelikli.shift() ?? (olaylar.length ? olaylar[olaySira++ % olaylar.length] : null);
        if (!o) return;
        const hedef = o.lat != null && o.lng != null ? { lat: o.lat, lng: o.lng } : ulkeNoktasi(o.ulke);
        if (!hedef) return;
        yayAt(hedef, o.tur);
        cagriRef.current.onOlay(o);
      };
      const akisSaati = window.setInterval(olayAt, AKIS_ARALIK_MS);
      temizlik.push(() => window.clearInterval(akisSaati));

      /* ---- Etiketler ---- */
      /* Ülke adları yalnız yakında; Türkçe adı olmayan küçük bölgeler (Guernsey, Åland…) adsız. */
      const turkceAdlar = new Set(Object.values(TURKCE_AD));
      const sabitEtiketler: Etiket[] = [];
      const ulkeSayiEl = new Map<string, HTMLElement>();
      for (const o of ogeler) {
        if (!turkceAdlar.has(o.ad)) continue;
        sabitEtiketler.push({
          anahtar: `ad|${o.ad}`,
          tur: "ad",
          el: el("hk-e hk-e-ad", o.ad.toLocaleUpperCase("tr")),
          lat: o.lat,
          lng: o.lng,
          irtifa: 0.002,
          oncelik: 2e5 + o.alan,
          w: 0,
          h: 0,
          secim: o.veri ? { ulke: o.veri.ulke, sehir: null } : null,
        });
      }
      for (const u of ulkeler) {
        const k2 = ulkeNoktasi(u.ulke);
        if (!k2) continue;
        const sayi = document.createElement("span");
        const b = document.createElement("i");
        b.textContent = sayiBicim.format(u.firma);
        sayi.append(b, " firma");
        ulkeSayiEl.set(u.ulke, b);
        sabitEtiketler.push({
          anahtar: `ulke|${u.ulke}`,
          tur: "ulke",
          el: el(`hk-e hk-e-ulke${u.ulke === "Türkiye" ? " hk-e-ev" : ""}`, el("hk-e-b", u.ulke), sayi),
          lat: k2.lat,
          lng: k2.lng,
          irtifa: 0.004,
          oncelik: 1e6 + u.firma,
          w: 0,
          h: 0,
          secim: { ulke: u.ulke, sehir: null },
        });
      }
      const tikla = (e: Etiket) => {
        if (!e.secim) return;
        const s = e.secim;
        e.el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          cagriRef.current.onSec(s);
        });
      };
      for (const e of sabitEtiketler) tikla(e);
      /* Ülke etiketindeki sayı süzgece göre; sayısı 0 olan ülke etiketlenmez. */
      const ulkeSayisi = new Map<string, number>();
      const sehirEtiketleri = (liste: NoktaOgesi[]): Etiket[] => {
        ulkeSayisi.clear();
        for (const n of liste) ulkeSayisi.set(n.ulke, (ulkeSayisi.get(n.ulke) ?? 0) + n.firma);
        for (const [ulke, b] of ulkeSayiEl) b.textContent = sayiBicim.format(ulkeSayisi.get(ulke) ?? 0);
        for (const e of sabitEtiketler) {
          if (e.tur !== "ulke") continue;
          e.w = 0;
          e.oncelik = 1e6 + (ulkeSayisi.get(e.secim?.ulke ?? "") ?? 0);
        }
        const cikti: Etiket[] = [];
      for (const n of liste) {
        if (!n.sehir) continue;
        const sayi = document.createElement("i");
        sayi.textContent = sayiBicim.format(n.firma);
        const e = el("hk-e hk-e-sehir", el("hk-e-s", n.sehir), sayi);
        e.style.setProperty("--r", n.renk);
        cikti.push({
          anahtar: `sehir|${n.ulke}|${n.sehir}`,
          tur: "sehir",
          el: e,
          lat: n.nlat,
          lng: n.nlng,
          irtifa: 0.003,
          oncelik: n.firma,
          w: 0,
          h: 0,
          secim: { ulke: n.ulke, sehir: n.sehir },
        });
      }
        for (const e of cikti) tikla(e);
        return cikti;
      };
      let etiketler: Etiket[] = [...sabitEtiketler, ...sehirEtiketleri(nokta)];
      globe
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlAltitude("irtifa")
        .htmlElement((d: object) => (d as Etiket).el)
        .htmlElementVisibilityModifier(() => {})
        .htmlTransitionDuration(0)
        .htmlElementsData([]);

      const rad = Math.PI / 180;
      const aci = (lat: number, lng: number, pov: { lat: number; lng: number }) => {
        const cs =
          Math.sin(lat * rad) * Math.sin(pov.lat * rad) +
          Math.cos(lat * rad) * Math.cos(pov.lat * rad) * Math.cos((lng - pov.lng) * rad);
        return Math.acos(Math.max(-1, Math.min(1, cs)));
      };
      const ulkeKotasi = (irt: number) => (irt > 1.9 ? 10 : irt > 1.4 ? 18 : 30);
      let gosterilen = "";
      const yerlestir = () => {
        if (!globe) return;
        const W2 = kap.clientWidth;
        const H2 = kap.clientHeight;
        const pov = globe.pointOfView();
        const irt = pov.altitude;
        const yakin = irt <= 1.05;
        const ufuk = Math.acos(1 / (1 + irt)) * 0.92;
        const s = seciliRef.current;
        const kapKutu = kap.getBoundingClientRect();
        const kutular: [number, number, number, number][] = [];
        for (const engel of document.querySelectorAll<HTMLElement>("[data-hk-engel]")) {
          const r = engel.getBoundingClientRect();
          if (r.width && r.height)
            kutular.push([r.left - kapKutu.left, r.top - kapKutu.top, r.right - kapKutu.left, r.bottom - kapKutu.top]);
        }
        const secimMi = (e: Etiket) =>
          !!s && !!e.secim && e.secim.ulke === s.ulke && (e.tur === "sehir" ? e.secim.sehir === s.sehir : s.sehir === null && e.tur !== "ad");
        const adaylar = etiketler
          .filter((e) => !(e.tur === "ulke" && !(ulkeSayisi.get(e.secim?.ulke ?? "") ?? 0)))
          .filter((e) => (yakin ? e.tur !== "ulke" : e.tur === "ulke") || secimMi(e))
          .sort((a, b) => (secimMi(b) ? 1e12 : b.oncelik) - (secimMi(a) ? 1e12 : a.oncelik));
        const secilen: Etiket[] = [];
        let yerlesenUlke = 0;
        for (const e of adaylar) {
          if (secilen.length >= 70) break;
          if (aci(e.lat, e.lng, pov) > ufuk) continue;
          if (e.tur === "ulke" && !secimMi(e) && yerlesenUlke >= ulkeKotasi(irt)) continue;
          if (!e.w) [e.w, e.h] = etiketBoyutu(e.el);
          const p = globe.getScreenCoords(e.lat, e.lng, e.irtifa);
          /* Şehir etiketi noktanın üstünde durur (CSS'te alttan boşluk). */
          const x0 = p.x - e.w / 2 - 3;
          const y0 = p.y - e.h / 2 - 2;
          const x1 = p.x + e.w / 2 + 3;
          const y1 = p.y + e.h / 2 + 2;
          if (x0 < 0 || y0 < 0 || x1 > W2 || y1 > H2) continue;
          if (kutular.some((q) => x0 < q[2] && x1 > q[0] && y0 < q[3] && y1 > q[1])) continue;
          kutular.push([x0, y0, x1, y1]);
          secilen.push(e);
          if (e.tur === "ulke") yerlesenUlke++;
        }
        for (const e of etiketler) e.el.classList.toggle("hk-e-secili", secimMi(e));
        const imza = secilen.map((e) => e.anahtar).join("\n");
        if (imza !== gosterilen) {
          gosterilen = imza;
          globe.htmlElementsData(secilen);
        }
      };
      const yerlesimSaati = window.setInterval(yerlestir, 250);
      temizlik.push(() => window.clearInterval(yerlesimSaati));

      uygulaRef.current = () => {
        nokta = topla(suzgecRef.current);
        const eski = bulut.geometry;
        bulut.geometry = geoKur(nokta);
        eski.dispose();
        etiketler = [...sabitEtiketler, ...sehirEtiketleri(nokta)];
        gosterilen = "";
        halkalariYenile();
        yerlestir();
      };

      /* ---- Fare: ipucu, tıklama ---- */
      let ustUlke: UlkeOgesi | null = null;
      const bul = (x: number, y: number): { nokta: NoktaOgesi | null; ulke: UlkeOgesi | null } => {
        const pov = globe!.pointOfView();
        const ufuk = Math.acos(1 / (1 + pov.altitude));
        let enYakin: NoktaOgesi | null = null;
        let enUzak = Infinity;
        for (const n of nokta) {
          if (aci(n.nlat, n.nlng, pov) > ufuk) continue;
          const p = globe!.getScreenCoords(n.nlat, n.nlng, 0.003);
          const d = Math.hypot(p.x - x, p.y - y);
          const sinir = Math.max(7, n.boyut * 0.55);
          if (d < sinir && d < enUzak) {
            enUzak = d;
            enYakin = n;
          }
        }
        const g = globe!.toGlobeCoords(x, y);
        const ulke = g ? (ogeler.find((o) => ulkedeMi(o, g.lng, g.lat)) ?? null) : null;
        return { nokta: enYakin, ulke };
      };
      let bekleyen = false;
      let sonOlay: PointerEvent | null = null;
      const fareHareket = (ev: PointerEvent) => {
        sonOlay = ev;
        if (bekleyen) return;
        bekleyen = true;
        requestAnimationFrame(() => {
          bekleyen = false;
          const e = sonOlay;
          if (!e || !globe) return;
          const r = kap.getBoundingClientRect();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          if ((e.target as HTMLElement).closest?.(".hk-e")) {
            ipucu.style.display = "none";
            return;
          }
          const { nokta: n, ulke } = bul(x, y);
          if (ulke !== ustUlke) {
            ustUlke = ulke;
            ustCizgi = cizgiKoy(ustCizgi, ulke && ulke.ad !== seciliRef.current?.ulke ? ulke : null, ustMalzeme);
          }
          let html = "";
          if (n) {
            const satir = [
              `${sayiBicim.format(n.firma)} firma`,
              n.yanit ? `${n.yanit} yanıt` : "",
              n.olumlu ? `${n.olumlu} olumlu` : "",
              n.crm ? `${n.crm} CRM` : "",
            ]
              .filter(Boolean)
              .join(" · ");
            html = `<b>${kacisli(n.sehir ?? `${n.ulke} · şehri belirsiz`)}</b><span>${kacisli(n.sehir ? n.ulke : "")}</span><span>${satir}</span>`;
          } else if (ulke) {
            const v = ulke.veri;
            html = v
              ? `<b>${kacisli(ulke.ad)}</b><span>${sayiBicim.format(v.firma)} firma · ${v.yanit} yanıt · ${v.olumlu} olumlu</span>${
                  v.sirada ? `<span>${sayiBicim.format(v.sirada)} firma sırada</span>` : ""
                }`
              : `<b>${kacisli(ulke.ad)}</b><span>Henüz ulaşılmadı</span>`;
          }
          kap.style.cursor = n || ulke?.veri ? "pointer" : "";
          if (!html) {
            ipucu.style.display = "none";
            return;
          }
          ipucu.innerHTML = html;
          ipucu.style.display = "flex";
          ipucu.style.transform = `translate(${Math.min(x + 14, r.width - 220)}px, ${y + 16}px)`;
        });
      };
      const fareCikti = () => {
        ipucu.style.display = "none";
        ustUlke = null;
        ustCizgi = cizgiKoy(ustCizgi, null, ustMalzeme);
      };
      let basma: { x: number; y: number; t: number } | null = null;
      const bas = (ev: PointerEvent) => {
        basma = { x: ev.clientX, y: ev.clientY, t: performance.now() };
      };
      const birak = (ev: PointerEvent) => {
        const b0 = basma;
        basma = null;
        if (!b0 || !globe) return;
        if (Math.hypot(ev.clientX - b0.x, ev.clientY - b0.y) > 5 || performance.now() - b0.t > 600) return;
        if ((ev.target as HTMLElement).closest?.(".hk-e")) return;
        const r = kap.getBoundingClientRect();
        const { nokta: n, ulke } = bul(ev.clientX - r.left, ev.clientY - r.top);
        if (n) cagriRef.current.onSec({ ulke: n.ulke, sehir: n.sehir ?? "" });
        else if (ulke?.veri) cagriRef.current.onSec({ ulke: ulke.veri.ulke, sehir: null });
        else cagriRef.current.onSec(null);
      };
      kap.addEventListener("pointermove", fareHareket);
      kap.addEventListener("pointerleave", fareCikti);
      kap.addEventListener("pointerdown", bas);
      kap.addEventListener("pointerup", birak);
      temizlik.push(() => {
        kap.removeEventListener("pointermove", fareHareket);
        kap.removeEventListener("pointerleave", fareCikti);
        kap.removeEventListener("pointerdown", bas);
        kap.removeEventListener("pointerup", birak);
      });

      /* ---- Kontroller ---- */
      const kontrol = globe.controls();
      kontrol.autoRotate = donmeRef.current;
      kontrol.autoRotateSpeed = DONME_HIZI;
      kontrol.enableDamping = true;
      kontrol.dampingFactor = 0.08;
      kontrol.minDistance = 108;
      kontrol.maxDistance = 600;
      kontrol.rotateSpeed = 0.5;
      kontrol.zoomSpeed = 0.9;
      globe.onZoom((pov) => {
        kontrol.autoRotateSpeed = DONME_HIZI * Math.min(1, Math.max(0.1, pov.altitude / 2.2));
        kontrol.rotateSpeed = Math.min(0.5, Math.max(0.08, pov.altitude * 0.3));
      });
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

      /* Sekme arkadayken çizme. */
      const gorunurluk = () => (document.hidden ? globe?.pauseAnimation() : globe?.resumeAnimation());
      document.addEventListener("visibilitychange", gorunurluk);
      temizlik.push(() => document.removeEventListener("visibilitychange", gorunurluk));

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
        const s = seciliRef.current;
        vurgu = cizgiKoy(vurgu, s ? (ogeAdi.get(ES_AD[s.ulke] ?? s.ulke) ?? null) : null, vurguMalzeme);
        halkalariYenile();
        kontrol.autoRotate = donmeRef.current && !s;
        yerlestir();
      };
      yenileRef.current();

      cagriRef.current.onHazir({
        ucus: (s) => {
          if (!globe) return;
          const n = s.sehir ? nokta.find((x) => x.ulke === s.ulke && x.sehir === s.sehir) : null;
          if (n) {
            globe.pointOfView({ lat: n.nlat, lng: n.nlng, altitude: 0.45 }, 1400);
            return;
          }
          const o = ogeAdi.get(ES_AD[s.ulke] ?? s.ulke);
          const k2 = ulkeNoktasi(s.ulke);
          if (!k2) return;
          const hedef = Math.min(1.8, Math.max(0.6, 0.5 + Math.sqrt(o?.alan ?? 1) / 30));
          globe.pointOfView({ ...k2, altitude: hedef }, 1400);
        },
        dondur: (acik) => {
          donmeRef.current = acik;
          kontrol.autoRotate = acik && !seciliRef.current;
        },
        ev: () => globe?.pointOfView(BASLANGIC, 1400),
        gunYaylari: (gun) => {
          const ogunku = veri.firmalar.filter((f) => f[3] === gun && f[1] !== DURUM_KODU.crm && f[1] !== DURUM_KODU.sirada);
          const adim = Math.max(1, Math.floor(ogunku.length / 10));
          for (let i = 0; i < ogunku.length && i / adim < 10; i += adim) {
            const k2 = yerKoord[ogunku[i][0]];
            if (k2) sonra((i / adim) * 70, () => yayAt(k2, "mail"));
          }
          return ogunku.length;
        },
        olayEkle: (liste) => {
          oncelikli.push(...liste);
          olaylar.push(...liste);
        },
        akisDuraklat: (d) => {
          akisDurdu = d;
        },
      });
    })().catch((e) => console.error("[harita] küre kurulamadı:", e));

    return () => {
      iptal = true;
      for (const t of temizlik) t();
      yenileRef.current = () => {};
      uygulaRef.current = () => {};
      if (globe) {
        globe.pauseAnimation();
        globe.renderer().dispose();
        globe._destructor();
      }
      kap.replaceChildren();
    };
    /* Veri sayfa yüklenince bir kez geliyor; değişirse küre baştan kurulur. */
  }, [ulkeler, veri, akis]);

  useEffect(() => {
    seciliRef.current = secili;
    donmeRef.current = donme;
    yenileRef.current();
  }, [secili, donme]);

  useEffect(() => {
    suzgecRef.current = suzgec;
    uygulaRef.current();
  }, [suzgec]);

  /* isolate: CSS2D etiketleri derinlik için z-index alıyor; yığın burada
     kapanmazsa etiketler yan panelin üstüne çıkar. */
  return (
    <>
      <div ref={kapRef} className="absolute inset-0 isolate" />
      <div ref={ipucuRef} className="hk-ipucu" style={{ display: "none" }} />
    </>
  );
}

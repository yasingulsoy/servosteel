import fs from "node:fs";
import path from "node:path";

/**
 * Firmanın şehrini kendi metninden bulur. Panelde şehir alanı yok, ama
 * keşif açıklamaları çoğu zaman şehri yazıyor ("…, Bjelovar", "Willoughby OH",
 * "pallet-racks-manufacturers-in-faridabad"). Metindeki sözcük öbekleri o
 * ülkenin şehir listesinde aranır (GeoNames, nüfusu 1000 üstü; data/sehirler.json,
 * üretimi scripts/sehir-verisi.mjs).
 *
 * Yanlış eşleşmeye karşı:
 * - tek sözcüklük ad ürün açıklamasında büyük harfle başlamalı (özel ad);
 * - ülke, eyalet ve sık geçen ticari sözcükler (Steel, Commerce, Victoria…) yok sayılır;
 * - puan: nüfus (log), açıklamanın son virgülden sonraki parçasında geçmek,
 *   ardından eyalet kodunun gelmesi (ABD/Kanada/Avustralya/Hindistan), çok sözcüklü ad.
 * Eşik altında kalan firma şehirsiz kalır; haritada ülkenin noktasında gösterilir.
 *
 * Saf modül: veritabanına bakmaz, sunucuda bir kez yüklenip bellekte kalır.
 */

export type Sehir = { ad: string; lat: number; lng: number; nufus: number };

type Kayit = [string, number, number, number, string];
type Aday = { ad: string; lat: number; lng: number; nufus: number; bolge: string };
type Dizin = { adlar: Map<string, Aday[]>; enUzun: number };

const OZEL: Record<string, string> = {
  ł: "l", Ł: "l", ø: "o", Ø: "o", đ: "d", Đ: "d", ß: "ss", æ: "ae", Æ: "ae", œ: "oe", ı: "i", ħ: "h", þ: "th",
};

export function sade(s: string): string {
  return s
    .replace(/[łŁøØđĐßæÆœıħþ]/g, (c) => OZEL[c] ?? c)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/* Şehir adı olarak eşleşmesi istenmeyen sözcükler (tek sözcük hâlinde). */
const YASAK = new Set(
  `
  steel metal metals roof roofing panel panels rack racks racking cable tray trays industry industries industrial
  commerce trade trading union center centre central global international national general standard royal golden
  star sales export group company products product systems system solutions engineering construction building
  victoria queensland ontario quebec alberta manitoba texas florida california georgia washington indiana nevada
  delaware columbia carolina dakota virginia jersey york mexico panama india china japan korea brazil chile peru
  kenya jordan lebanon israel egypt morocco nigeria ghana uganda angola canada america europe asia africa
  marina paris london berlin lima santiago victoria florence alexandria
  kendi uretim imalat cati sandvic trapez kiremit profil panelleri rafi raf kanal kablo bariyer celik makine
  hat hatti satis sanayi fabrika fabrikasi tesisi atolye otomotiv
  norte sur este oeste nord sud ouest est north south east west new san santa saint st
  plant factory works mill mills city town village port lake river valley hills park post frame
  `
    .split(/\s+/)
    .filter(Boolean),
);
/* Yasaktaki büyük şehirler: "Paris" bir Fransız firmasının açıklamasında gerçekten Paris'tir. */
const YASAK_ISTISNA: Record<string, Set<string>> = {
  FR: new Set(["paris"]),
  GB: new Set(["london"]),
  DE: new Set(["berlin"]),
  PE: new Set(["lima"]),
  CL: new Set(["santiago"]),
  EG: new Set(["alexandria"]),
  IT: new Set(["florence"]),
  PA: new Set(["panama"]),
};

/* Metinde geçen eski ya da İngilizce ad → GeoNames'teki ad (sade hâliyle). */
const TAKMA_AD: Record<string, string> = {
  bangalore: "bengaluru",
  bombay: "mumbai",
  madras: "chennai",
  calcutta: "kolkata",
  gurugram: "gurgaon",
  saigon: "ho chi minh city",
  hcmc: "ho chi minh city",
  "ho chi minh": "ho chi minh city",
  kiev: "kyiv",
  kharkov: "kharkiv",
  odesa: "odessa",
  zaporizhzhia: "zaporizhia",
  zaporozhye: "zaporizhia",
  zaporizhzhya: "zaporizhia",
  lvov: "lviv",
  nikolaev: "mykolaiv",
  dnepr: "dnipro",
  dnipropetrovsk: "dnipro",
  cracow: "krakow",
  cdmx: "mexico city",
  "ciudad de mexico": "mexico city",
};

/* "St. Paul" → "saint paul": GeoNames kısaltmasız yazıyor. */
const KISALTMA: Record<string, string> = { st: "saint", ste: "sainte", mt: "mount", ft: "fort" };

/* Eyalet kodu eşleşmesinin anlamlı olduğu ülkeler (GeoNames admin1 = posta kısaltması). */
const EYALET_KODLU = new Set(["US", "CA", "AU"]);

let dizinler: Map<string, Dizin> | null = null;
let ham: Record<string, Kayit[]> | null = null;

function veri(): Record<string, Kayit[]> {
  if (!ham) {
    const yol = path.join(process.cwd(), "data", "sehirler.json");
    ham = JSON.parse(fs.readFileSync(yol, "utf8")) as Record<string, Kayit[]>;
  }
  return ham;
}

function dizin(kod: string): Dizin | null {
  dizinler ??= new Map();
  const var_ = dizinler.get(kod);
  if (var_) return var_;
  const liste = veri()[kod];
  if (!liste) return null;
  const adlar = new Map<string, Aday[]>();
  let enUzun = 1;
  for (const [ad, lat, lng, nufus, bolge] of liste) {
    const k = sade(ad);
    if (k.length < 3) continue;
    enUzun = Math.max(enUzun, Math.min(4, k.split(" ").length));
    const l = adlar.get(k);
    const a = { ad, lat, lng, nufus, bolge };
    if (l) l.push(a);
    else adlar.set(k, [a]);
  }
  const d = { adlar, enUzun };
  dizinler.set(kod, d);
  return d;
}

type Sozcuk = { s: string; buyuk: boolean; ham: string; parca: number };

function sozcukler(metin: string): { liste: Sozcuk[]; sonParca: number } {
  const liste: Sozcuk[] = [];
  const parcalar = metin.split(/[,;(|]| — | - /);
  parcalar.forEach((p, i) => {
    for (const m of p.matchAll(/[\p{L}\p{N}]+/gu)) {
      const ham = m[0];
      const s0 = sade(ham);
      const s = KISALTMA[s0] ?? s0;
      if (s) liste.push({ s, buyuk: /^\p{Lu}/u.test(ham), ham, parca: i });
    }
  });
  return { liste, sonParca: parcalar.length - 1 };
}

/** Bir URL'nin yol kısmındaki sözcükler ("in-faridabad.html" → in faridabad). */
function yolSozcukleri(adres: string): string {
  try {
    const u = new URL(/^https?:\/\//i.test(adres) ? adres : `https://${adres}`);
    return decodeURIComponent(u.pathname).replace(/\.(html?|php|aspx?)$/i, "");
  } catch {
    return "";
  }
}

type Bulunan = { sehir: Aday; puan: number };

function ara(d: Dizin, kod: string, metin: string, kaynak: "aciklama" | "ad" | "yol"): Bulunan | null {
  const { liste, sonParca } = sozcukler(metin);
  const istisna = YASAK_ISTISNA[kod];
  let en: Bulunan | null = null;
  for (let i = 0; i < liste.length; i++) {
    for (let n = Math.min(d.enUzun, liste.length - i); n >= 1; n--) {
      const ilk = liste[i];
      if (liste[i + n - 1].parca !== ilk.parca) continue;
      const ham_ = liste
        .slice(i, i + n)
        .map((w) => w.s)
        .join(" ");
      const anahtar = TAKMA_AD[ham_] ?? ham_;
      const adaylar = d.adlar.get(anahtar);
      if (!adaylar) continue;
      if (n === 1) {
        if (anahtar.length < 4 || /^\d+$/.test(anahtar)) continue;
        if (YASAK.has(anahtar) && !istisna?.has(anahtar)) continue;
        if (kaynak !== "yol" && !ilk.buyuk) continue;
      }
      const sonraki = liste[i + n];
      const eyalet =
        EYALET_KODLU.has(kod) && sonraki && /^[A-Z]{2}$/.test(sonraki.ham) ? sonraki.ham : null;
      let secilen = adaylar[0];
      let eyaletTuttu = false;
      if (eyalet) {
        const e = adaylar.find((a) => a.bolge === eyalet);
        if (e) {
          secilen = e;
          eyaletTuttu = true;
        }
      }
      const puan =
        Math.log10(secilen.nufus + 10) +
        (n - 1) * 1.5 +
        (kaynak === "aciklama" && ilk.parca === sonParca && sonParca > 0 ? 2.5 : 0) +
        (eyaletTuttu ? 4 : 0) +
        (kaynak === "yol" ? -0.7 : kaynak === "ad" ? -1.5 : 0);
      if (!en || puan > en.puan) en = { sehir: secilen, puan };
      break;
    }
  }
  return en;
}

/**
 * @param kod ISO alpha-2 ülke kodu
 * @param aciklama ürün/kanıt açıklaması (urun)
 * @param ad firma adı
 * @param adresler kanıt ve web adresleri (yalnız yol kısmına bakılır)
 */
export function sehirBul(kod: string, aciklama: string, ad: string, adresler: string[]): Sehir | null {
  const d = dizin(kod);
  if (!d) return null;
  const sonuclar = [
    ara(d, kod, aciklama, "aciklama"),
    ara(d, kod, ad, "ad"),
    ...adresler.map((a) => ara(d, kod, yolSozcukleri(a).replace(/[-_/]+/g, " "), "yol")),
  ].filter((x): x is Bulunan => Boolean(x));
  if (!sonuclar.length) return null;
  const en = sonuclar.reduce((a, b) => (b.puan > a.puan ? b : a));
  if (en.puan < 3.6) return null;
  const s = en.sehir;
  return { ad: s.ad, lat: s.lat, lng: s.lng, nufus: s.nufus };
}

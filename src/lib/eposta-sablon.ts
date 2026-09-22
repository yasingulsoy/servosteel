/**
 * Tanıtım e-postasının HTML sayfası — SAF, içe aktarması yok. Sunucuda
 * gönderimde (görseller iletiye gömülü, `cid:`) ve panelde önizlemede
 * (görseller `/eposta/…` adresinden) AYNI çıktı; Node testi de doğrudan
 * yükler (scripts/eposta-sablon-test.mjs).
 *
 * Gövdede TEK BAŞINA duran bağlantı paragrafı süslenir (Yasin 2026-09-22:
 * "linkleri kısaltıp tıklama şeklinde, makine görsellerini ufaltıp koy, maili süsle"):
 *  - teklif formuna giden (`utm_term=teklif-formu`) → sitenin turuncu düğmesi
 *  - ürün sayfasına giden (`utm_campaign` = segment) → o segmentin 2–3 küçük
 *    makine fotoğrafı, altında aynı bağlantı
 * Cümle içindeki bağlantı olduğu gibi kalır. Editörde o paragrafa yazı eklenirse
 * süs de kalkar — kural görünür ve tahmin edilebilir.
 *
 * Fotoğraflar sitenin GERÇEK ürün fotoğraflarının küçük kopyası
 * (scripts/eposta-gorselleri.py). Kendi fotoğrafı olmayan ürüne (trapez/cephe
 * paneli, market rafı) başka ürünün fotoğrafı konmaz — sitede de o ürünün
 * görseli basılmıyor (catalog.ts hasPhoto). Onlarda fabrika ve o hatta da
 * kullanılan makineler (açıcı, istifleyici…) gösterilir; alt yazı ne olduğunu söyler.
 *
 * Stiller satır içi, düzen tablo: e-posta istemcilerinin çoğu <style> ve
 * flex okumaz; Outlook masaüstü genişliği `width` özniteliğinden alır.
 */

/** Görsel kaynağı: ürün slug'ı ya da "logo" → src. null: gösterilmez (dosya yok). */
export type GorselKaynagi = (anahtar: string) => string | null;

export const LOGO_CID = "logo@servosteel.com.tr";
export const LOGO_GENISLIK = 128;
export const LOGO_YUKSEKLIK = 57;
/** Ürün küçük resmi e-postada 176×132; dosya 336×252 (keskin ekran) */
export const GORSEL_GENISLIK = 176;
export const GORSEL_YUKSEKLIK = 132;

const VURGU = "#e7a300"; // globals.css --color-accent
const VURGU_YAZI = "#0b0c0e"; // --color-shell
const VURGU_KOYU = "#8f6400"; // --accent-ink (açık tema): beyaz zeminde okunur turuncu
const YAZI_TIPI = "Arial,Helvetica,sans-serif";

/** Ürün fotoğraflarının alt yazısı, e-posta dilinde (sözcükler şablondakiyle aynı). */
export const URUN_GORSELI: Record<string, Record<string, string>> = {
  "kablo-kanali": {
    tr: "Kablo kanalı hattı", en: "Cable tray line", es: "Línea para bandejas portacables",
    it: "Linea per passerelle portacavi", de: "Kabelrinnen-Anlage", pl: "Linia do korytek kablowych",
    ru: "Линия для кабельных лотков", fr: "Ligne pour chemins de câbles", pt: "Linha para eletrocalhas",
  },
  "solar-profil": {
    tr: "Solar profil hattı", en: "Solar profile line", es: "Línea para perfiles solares",
    it: "Linea per profili fotovoltaici", de: "Solarprofil-Anlage", pl: "Linia do profili fotowoltaicznych",
    ru: "Линия для солнечных профилей", fr: "Ligne pour profilés solaires", pt: "Linha para perfis solares",
  },
  "agir-raf": {
    tr: "Raf hattı", en: "Storage rack line", es: "Línea para estanterías", it: "Linea per scaffalature",
    de: "Regalanlage", pl: "Linia do regałów", ru: "Стеллажная линия", fr: "Ligne pour rayonnages",
    pt: "Linha para porta-paletes",
  },
  "iskele-kalas": {
    tr: "İskele kalası hattı", en: "Scaffolding plank line", es: "Línea para plataformas de andamio",
    it: "Linea per tavole da ponteggio", de: "Gerüstbohlen-Anlage", pl: "Linia do podestów rusztowaniowych",
    ru: "Линия для настилов лесов", fr: "Ligne pour planchers d'échafaudage", pt: "Linha para pranchas de andaime",
  },
  "yol-bariyeri": {
    tr: "Yol bariyeri hattı", en: "Guardrail line", es: "Línea para barreras viales", it: "Linea per guardrail",
    de: "Schutzplanken-Anlage", pl: "Linia do barier drogowych", ru: "Линия для дорожных ограждений",
    fr: "Ligne pour glissières de sécurité", pt: "Linha para defensas metálicas",
  },
  "gurultu-bariyeri": {
    tr: "Gürültü bariyeri hattı", en: "Noise barrier line", es: "Línea para barreras acústicas",
    it: "Linea per barriere antirumore", de: "Lärmschutzwand-Anlage", pl: "Linia do ekranów akustycznych",
    ru: "Линия для шумозащитных экранов", fr: "Ligne pour écrans acoustiques", pt: "Linha para barreiras acústicas",
  },
  "c-sigma-omega": {
    tr: "C / Sigma / Omega profil hattı", en: "C / Sigma / Omega profile line", es: "Línea de perfiles C / Sigma / Omega",
    it: "Linea per profili C / Sigma / Omega", de: "C-/Sigma-/Omega-Profilanlage", pl: "Linia do profili C / Sigma / Omega",
    ru: "Линия для C-/Sigma-/Omega-профилей", fr: "Ligne pour profilés C / Sigma / Oméga", pt: "Linha para perfis C / Sigma / Ômega",
  },
  "dilme-hatlari": {
    tr: "Dilme hattı", en: "Slitting line", es: "Línea de corte longitudinal", it: "Linea di taglio longitudinale",
    de: "Längsteilanlage", pl: "Linia do cięcia wzdłużnego", ru: "Линия продольной резки", fr: "Ligne de refendage",
    pt: "Linha de corte longitudinal",
  },
  "boy-kesme-hatlari": {
    tr: "Boy kesme hattı", en: "Cut-to-length line", es: "Línea de corte transversal", it: "Linea di taglio trasversale",
    de: "Querteilanlage", pl: "Linia do cięcia poprzecznego", ru: "Линия поперечной резки", fr: "Ligne de coupe à longueur",
    pt: "Linha de corte transversal",
  },
  "rulo-acicilar": {
    tr: "Rulo açıcı", en: "Decoiler", es: "Desbobinador", it: "Svolgitore", de: "Abwickelhaspel", pl: "Rozwijarka",
    ru: "Разматыватель", fr: "Dérouleur", pt: "Desbobinador",
  },
  "servo-suruculer": {
    tr: "Servo sürücü", en: "Servo feeder", es: "Alimentador servo", it: "Alimentatore servo", de: "Servo-Walzenvorschub",
    pl: "Podajnik walcowy servo", ru: "Сервоподатчик", fr: "Amenage servo", pt: "Alimentador servo",
  },
  "dogrultmali-servo-suruculer": {
    tr: "Doğrultmalı servo sürücü", en: "Straightener servo feeder", es: "Alimentador servo con enderezadora",
    it: "Alimentatore servo con raddrizzatrice", de: "Servo-Richtvorschub", pl: "Podajnik servo z prostownicą",
    ru: "Сервоподатчик с правильной машиной", fr: "Amenage-redresseur servo", pt: "Alimentador servo com endireitadeira",
  },
  "kompakt-hatlar": {
    tr: "Kompakt hat", en: "Compact line", es: "Línea compacta", it: "Linea compatta", de: "Kompaktanlage",
    pl: "Linia kompaktowa", ru: "Компактная линия", fr: "Ligne compacte", pt: "Linha compacta",
  },
  "otomatik-istifleyici": {
    tr: "Otomatik istifleyici", en: "Automatic stacker", es: "Apilador automático", it: "Impilatore automatico",
    de: "Automatischer Stapler", pl: "Automatyczny układacz", ru: "Автоматический штабелёр", fr: "Empileur automatique",
    pt: "Empilhador automático",
  },
  "tesis-uretim": {
    tr: "İstanbul'daki fabrikamız", en: "Our factory in Istanbul", es: "Nuestra fábrica en Estambul",
    it: "Il nostro stabilimento a Istanbul", de: "Unser Werk in Istanbul", pl: "Nasz zakład w Stambule",
    ru: "Наш завод в Стамбуле", fr: "Notre usine à Istanbul", pt: "Nossa fábrica em Istambul",
  },
};

/**
 * Segment (bağlantıdaki utm_campaign) → gösterilecek fotoğraflar, sırayla. İlki
 * segmentin kendi hattı; ardından o hatta çalışan makineler (segment
 * cümlelerinde sayılanlar: açıcı, doğrultucu, servo besleyici, istifleyici).
 */
export const KAMPANYA_GORSELLERI: Record<string, string[]> = {
  "kablo-kanali": ["kablo-kanali", "rulo-acicilar", "dogrultmali-servo-suruculer"],
  "solar-profil": ["solar-profil", "rulo-acicilar", "servo-suruculer"],
  raf: ["agir-raf", "rulo-acicilar", "servo-suruculer"],
  "yol-bariyeri": ["yol-bariyeri", "rulo-acicilar", "tesis-uretim"],
  /* trapez/cephe panelinin fotoğrafı yok (catalog.ts noPhoto): fabrika + açıcı + istifleyici */
  "cati-panel": ["tesis-uretim", "rulo-acicilar", "otomatik-istifleyici"],
  "celik-servis": ["dilme-hatlari", "boy-kesme-hatlari", "otomatik-istifleyici"],
  "pres-atolyesi": ["servo-suruculer", "dogrultmali-servo-suruculer", "rulo-acicilar"],
  alcipan: ["dogrultmali-servo-suruculer", "rulo-acicilar", "kompakt-hatlar"],
  asik: ["c-sigma-omega", "rulo-acicilar", "servo-suruculer"],
  iskele: ["iskele-kalas", "rulo-acicilar", "servo-suruculer"],
  /* market rafı hattının fotoğrafı yok: fabrika + servo besleyici + açıcı */
  "market-rafi": ["tesis-uretim", "servo-suruculer", "rulo-acicilar"],
  gurultu: ["gurultu-bariyeri", "dogrultmali-servo-suruculer", "rulo-acicilar"],
  havalandirma: ["kompakt-hatlar", "servo-suruculer", "rulo-acicilar"],
  mobilya: ["servo-suruculer", "kompakt-hatlar", "rulo-acicilar"],
};

export function altYazi(slug: string, dil: string): string {
  const y = URUN_GORSELI[slug];
  return y ? (y[dil] ?? y.en) : slug;
}

/** İletideki gömülü görselin kimliği (Content-ID) */
export function gorselCid(anahtar: string): string {
  return anahtar === "logo" ? LOGO_CID : `urun-${anahtar}@servosteel.com.tr`;
}

/** Panelde gösterim adresi — public/eposta/ (scripts/eposta-gorselleri.py) */
export function gorselAdresi(anahtar: string): string {
  return anahtar === "logo" ? "/eposta/logo.png" : `/eposta/${anahtar}.jpg`;
}

/** HTML'de cid ile başvurulan ürün görselleri (logo hariç), ilk geçiş sırasıyla, tekil */
export function cidGorselleri(html: string): string[] {
  return [...new Set([...html.matchAll(/cid:urun-([a-z0-9-]+)@servosteel\.com\.tr/g)].map((m) => m[1]))];
}

/** Kayıtlı (cid'li) HTML'i tarayıcıda gösterilebilir yapar — Giden sayfası */
export function cidleriAdreseCevir(html: string, adres: (anahtar: string) => string = gorselAdresi): string {
  return html
    .replaceAll(`cid:${LOGO_CID}`, adres("logo"))
    .replace(/cid:urun-([a-z0-9-]+)@servosteel\.com\.tr/g, (_, s: string) => adres(s));
}

const kacir = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Yalnızca tek bağlantıdan oluşan paragraf (editörün eklediği target/rel de olabilir) */
const YALNIZ_BAGLANTI = /<p><a\b[^>]*?\bhref="([^"]*)"[^>]*>((?:(?!<\/a>)[\s\S])*?)<\/a><\/p>/g;

type BaglantiTuru = { tur: "dugme" } | { tur: "urun"; kampanya: string } | null;

export function baglantiTuru(href: string): BaglantiTuru {
  let u: URL;
  try {
    u = new URL(href.replace(/&amp;/g, "&"));
  } catch {
    return null;
  }
  if (u.hostname.replace(/^www\./, "") !== "servosteel.com.tr") return null;
  if (u.searchParams.get("utm_term") === "teklif-formu" || /\/(request-quote|teklif-al)\/?$/.test(u.pathname)) {
    return { tur: "dugme" };
  }
  const k = u.searchParams.get("utm_campaign") ?? "";
  return KAMPANYA_GORSELLERI[k] ? { tur: "urun", kampanya: k } : null;
}

/** Tablo düğme: Outlook masaüstü de hücre rengini ve iç boşluğu çizer */
function dugme(href: string, yazi: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:2px 0 18px;border-collapse:separate">` +
    `<tr><td align="center" bgcolor="${VURGU}" style="background-color:${VURGU};border-radius:6px;padding:12px 24px">` +
    `<a href="${href}" style="color:${VURGU_YAZI};font-family:${YAZI_TIPI};font-size:15px;font-weight:bold;line-height:20px;text-decoration:none">${yazi}</a>` +
    `</td></tr></table>`
  );
}

function urunSeridi(href: string, yazi: string, kampanya: string, dil: string, kaynak: GorselKaynagi): string {
  const gorseller = KAMPANYA_GORSELLERI[kampanya].flatMap((slug) => {
    const src = kaynak(slug);
    return src ? [{ src, ad: kacir(altYazi(slug, dil)) }] : [];
  });
  const baglanti =
    `<p style="margin:${gorseller.length ? 8 : 0}px 0 16px">` +
    `<a href="${href}" style="color:${VURGU_KOYU};font-weight:bold;text-decoration:none">${yazi}&nbsp;&rarr;</a></p>`;
  if (!gorseller.length) return baglanti;
  const n = gorseller.length;
  /* 8 px aralık hücrelere EŞİT paylaştırılır (sol + sağ ≈ aynı): hepsi aynı genişlikte kalsın */
  const pay = (i: number) => `0 ${Math.round((8 * (n - 1 - i)) / n)}px 0 ${Math.round((8 * i) / n)}px`;
  const hucreler = gorseller
    .map(
      (g, i) =>
        `<td valign="top" width="${Math.floor(100 / n)}%" style="padding:${pay(i)}">` +
        `<a href="${href}" style="text-decoration:none"><img src="${g.src}" width="${GORSEL_GENISLIK}" height="${GORSEL_YUKSEKLIK}" alt="${g.ad}" ` +
        `style="display:block;width:100%;max-width:${GORSEL_GENISLIK}px;height:auto;border:0;border-radius:4px"></a>` +
        `<div style="padding:6px 2px 0;font-family:${YAZI_TIPI};font-size:12px;line-height:1.35;color:#555">${g.ad}</div></td>`
    )
    .join("");
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ` +
    `style="margin:2px 0 0;border-collapse:collapse;max-width:${n * GORSEL_GENISLIK + (n - 1) * 8}px"><tr>${hucreler}</tr></table>` +
    baglanti
  );
}

/**
 * Alıcının gördüğü tam sayfa: gövde (editörden temizlenmiş ya da düz metinden
 * üretilmiş HTML) + süsler + imza logosu + gri altbilgi (hazır HTML).
 */
export function epostaSayfasi(
  govdeHtml: string,
  s: { dil: string; altbilgiHtml: string; kaynak: GorselKaynagi }
): string {
  const govde = govdeHtml
    .replace(YALNIZ_BAGLANTI, (tum, href: string, yazi: string) => {
      const t = baglantiTuru(href);
      if (!t) return tum;
      return t.tur === "dugme" ? dugme(href, yazi) : urunSeridi(href, yazi, t.kampanya, s.dil, s.kaynak);
    })
    .replace(/<p>/g, '<p style="margin:0 0 14px">')
    .replace(/<blockquote>/g, '<blockquote style="margin:0 0 14px;padding-left:12px;border-left:3px solid #ddd;color:#555">')
    .replace(/<(ul|ol)>/g, '<$1 style="margin:0 0 14px;padding-left:22px">');
  const logo = s.kaynak("logo");
  return (
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>` +
    `<body style="margin:0;padding:0;background-color:#ffffff">` +
    `<div style="max-width:600px;padding:16px 4px 8px;border-top:3px solid ${VURGU};font-family:${YAZI_TIPI};font-size:15px;line-height:1.55;color:#222">` +
    govde +
    (logo
      ? `<div style="margin:6px 0 0"><img src="${logo}" width="${LOGO_GENISLIK}" height="${LOGO_YUKSEKLIK}" alt="Servosteel" ` +
        `style="display:block;border:0;outline:none;text-decoration:none"></div>`
      : "") +
    `<p style="margin:22px 0 0;padding-top:10px;border-top:1px solid #ddd;font-size:12px;line-height:1.5;color:#777">${s.altbilgiHtml}</p>` +
    `</div></body></html>`
  );
}

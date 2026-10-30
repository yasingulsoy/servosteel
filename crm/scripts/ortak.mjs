/** Aktarma betiklerinin ortak yardımcıları. */
import fs from "node:fs";

const UCRETSIZ =
  /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|aol|gmx|web|mail|yandex|ukr|wp|interia|o2|seznam|abv|libero|virgilio|orange|wanadoo|free|t-online|rambler|bk|inbox|list)\./;

export const alanAdi = (web) => {
  try {
    return web ? new URL(web).hostname.toLowerCase().replace(/^www\./, "") : null;
  } catch {
    return null;
  }
};

/** Kurumsal e-postanın alan adı; ücretsiz posta servislerinde null. */
export const epostaAlani = (e) => {
  const a = e?.split("@")[1]?.toLowerCase().trim();
  return a && !UCRETSIZ.test(a) ? a : null;
};

/** Bölge, uygulamadaki ülke listesinden (src/lib/ulkeler.ts) okunur; tek kaynak. */
const ulkeKaynagi = fs.readFileSync(new URL("../src/lib/ulkeler.ts", import.meta.url), "utf8");
const BOLGE = {};
for (const m of ulkeKaynagi.matchAll(/(?:"([^"]+)"|([\p{L}]+)):\s*"([^"]+)"/gu)) BOLGE[m[1] ?? m[2]] = m[3];
export const bolgesi = (ulke) => (ulke ? (BOLGE[ulke] ?? null) : null);

/** "Ad Soyad <adres@x>" → { ad, eposta } */
export function kimdenAyir(kimden) {
  const m = String(kimden ?? "").match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { ad: m[1].trim() || null, eposta: m[2].trim().toLowerCase() };
  const e = String(kimden ?? "").trim().toLowerCase();
  return { ad: null, eposta: e.includes("@") ? e : null };
}

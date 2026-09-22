/**
 * E-posta gövdesinin düz metin ↔ HTML biçimi — SAF, hem tarayıcıda (editör,
 * önizleme) hem sunucuda çalışır; içe aktarması yok (Node testi doğrudan
 * yükler: scripts/eposta-sablon-test.mjs).
 *
 * Hazır şablonlar düz metin (seo/eposta-taslaklari.json): boş satır paragraf,
 * satır sonu satır sonu, adresler bağlantı. Bağlantı YAZISI gerekiyorsa
 * `[yazı](https://…)` — HTML'de tıklanır yazı olur, adres görünmez; düz metin
 * parçasında "yazı (adres)" (Yasin 2026-09-22: "linkleri kısaltıp tıklama
 * şeklinde"). Editör bu HTML'le açılır.
 */

export const kacir = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Metindeki http(s) adresleri — sondaki noktalama bağlantıya katılmaz. */
export const BAGLANTI = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)]/g;

/** `[yazı](https://…)` — yazıda köşeli parantez ve satır sonu, adreste boşluk ve ")" olamaz. */
export const YAZILI_BAGLANTI = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;

/** Tek satırın HTML'i: yazılı bağlantılar <a>yazı</a>, çıplak adresler <a>adres</a>. */
function satirHtml(s: string): string {
  const ciplak = (p: string) => kacir(p).replace(BAGLANTI, (u) => `<a href="${u}">${u}</a>`);
  let cikti = "";
  let son = 0;
  for (const m of s.matchAll(YAZILI_BAGLANTI)) {
    cikti += ciplak(s.slice(son, m.index)) + `<a href="${kacir(m[2])}">${kacir(m[1])}</a>`;
    son = m.index + m[0].length;
  }
  return cikti + ciplak(s.slice(son));
}

/** Düz metinden sade HTML: boş satır <p>, satır sonu <br>, adresler ve yazılı bağlantılar <a>. */
export function metindenHtml(metin: string): string {
  return metin
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${p.split("\n").map(satirHtml).join("<br>")}</p>`)
    .join("");
}

/** Gönderilen düz metin parçası: `[yazı](adres)` → "yazı (adres)". */
export function metindenDuz(metin: string): string {
  return metin.replace(YAZILI_BAGLANTI, "$1 ($2)");
}

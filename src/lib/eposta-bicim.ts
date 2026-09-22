/**
 * E-posta gövdesinin düz metin ↔ HTML biçimi — SAF, hem tarayıcıda (editör)
 * hem sunucuda çalışır; içe aktarması yok.
 *
 * Hazır şablonlar düz metin (seo/eposta-taslaklari.json): boş satır paragraf,
 * satır sonu satır sonu, adresler bağlantı. Editör bu HTML'le açılır.
 */

const kacir = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Metindeki http(s) adresleri — sondaki noktalama bağlantıya katılmaz. */
export const BAGLANTI = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)]/g;

/** Düz metinden sade HTML: boş satır <p>, satır sonu <br>, adresler <a>. */
export function metindenHtml(metin: string): string {
  return metin
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${kacir(p).replace(BAGLANTI, (u) => `<a href="${u}">${u}</a>`).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

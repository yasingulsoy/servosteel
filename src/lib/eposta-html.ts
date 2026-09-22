import "server-only";
import { convert } from "html-to-text";
import sanitizeHtml from "sanitize-html";

/**
 * Editörden gelen HTML — sunucuda TEMİZLENİR, düz metin hâli ondan üretilir.
 *
 * Sunucu eylemi doğrudan POST ile çağrılabildiği için editörün ürettiğine
 * güvenilmez: yalnızca paragraf, satır sonu, kalın, italik, altı çizili, liste,
 * alıntı ve http/https/mailto bağlantısı kalır. Görsel, stil, betik, form,
 * iframe, olay özniteliği — hepsi atılır (soğuk e-postada görsel ve izleme
 * zaten spam puanı; bkz. outreach.ts).
 */
export function govdeHtmlTemizle(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "blockquote", "a"],
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    /* Boş paragraflar (editörde art arda Enter) tek boşluğa iner */
    exclusiveFilter: (f) => f.tag === "p" && !f.text.trim() && !f.mediaChildren?.length,
  }).trim();
}

/** Temiz HTML'in düz metin hâli — multipart/alternative'in metin parçası ve kayıt için. */
export function htmldenMetin(html: string): string {
  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
      { selector: "ul", options: { itemPrefix: " - " } },
      { selector: "p", options: { leadingLineBreaks: 1, trailingLineBreaks: 2 } },
    ],
  })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

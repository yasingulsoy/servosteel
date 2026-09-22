import type { ParsedMail } from "mailparser";
import type { GelenOzet } from "./gelen-kurallar";

/**
 * mailparser çıktısını sınıflandırıcının okuduğu düz biçime çevirir.
 *
 * Ayrı dosyada ve göreli içe aktarmayla: test betiği (scripts/gelen-kurallar-test.mjs)
 * bunu Node'la doğrudan içe aktarıyor — `@/` yolu ve "server-only" burada yok.
 */
export function gelenOzeti(p: ParsedMail): GelenOzet {
  const kimden = p.from?.value?.[0];
  const basliklar: Record<string, string> = {};
  for (const [ad, deger] of p.headers) {
    const k = ad.toLowerCase();
    if (typeof deger === "string") basliklar[k] = deger;
    else if (deger && typeof deger === "object" && "value" in deger) {
      /* content-type gibi yapılı başlıklar: { value, params } → "multipart/report; report-type=…" */
      const v = deger as { value: unknown; params?: Record<string, string> };
      const params = Object.entries(v.params ?? {}).map(([a, b]) => `${a}=${b}`);
      basliklar[k] = [String(v.value ?? ""), ...params].join("; ");
    }
  }
  const raporlar = (p.attachments ?? [])
    .filter((a) => /^message\/(global-)?delivery-status$/i.test(a.contentType))
    .map((a) => a.content.toString("utf8"));
  return {
    kimden: (kimden?.address ?? "").toLowerCase(),
    kimdenAd: kimden?.name ?? "",
    konu: p.subject ?? "",
    metin: p.text ?? "",
    basliklar,
    raporlar,
  };
}

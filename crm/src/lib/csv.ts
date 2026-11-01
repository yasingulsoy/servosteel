/**
 * Excel'in Türkçe ayarıyla doğrudan açtığı CSV: ayraç noktalı virgül, UTF-8
 * BOM'lu (yoksa Excel Türkçe harfleri bozar), satır sonu CRLF. Formül gibi
 * başlayan hücre ("=", "+", "-", "@") başına ' alır: dosyayı açan kişinin
 * Excel'inde müşteri verisi formül olarak çalışmasın.
 */
export function csv(basliklar: string[], satirlar: (string | number | null | undefined)[][]): string {
  const hucre = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [basliklar, ...satirlar].map((r) => r.map(hucre).join(";")).join("\r\n") + "\r\n";
}

export function csvCevabi(ad: string, icerik: string): Response {
  const gun = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  return new Response(icerik, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ad}-${gun}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

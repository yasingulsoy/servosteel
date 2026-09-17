/**
 * Kayıtlar sayfasının saf yardımcıları — veritabanına ve isteğe dokunmaz,
 * bu yüzden ayrı dosyada ve tek başına test edilebilir.
 */

/** Tarayıcı kimliğinden okunur kısa ad: "Chrome · Windows", "Safari · iPhone". */
export function cihazEtiketi(ua: string): string {
  if (!ua) return "Bilinmiyor";
  const tarayici = /Edg(A|iOS)?\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /SamsungBrowser\//.test(ua)
        ? "Samsung Internet"
        : /CriOS\/|Chrome\//.test(ua)
          ? "Chrome"
          : /FxiOS\/|Firefox\//.test(ua)
            ? "Firefox"
            : /Safari\//.test(ua)
              ? "Safari"
              : "";
  const sistem = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "";
  return [tarayici, sistem].filter(Boolean).join(" · ") || "Bilinmiyor";
}

export type OturumDurumu = "cikti" | "panelde" | "birakti";

/**
 * Oturumun şimdiki durumu.
 *  - çıkış tuşuna bastıysa: çıktı
 *  - çerezi hâlâ geçerli ve son 5 dakikada etkinlik varsa: şu an panelde
 *  - değilse: çıkış yapmadan ayrıldı (sekmeyi kapattı ya da bıraktı)
 */
export function oturumDurumu(
  o: { cikis: string | Date | null; bitis: string | number; son_etkinlik: string | Date },
  simdi = Date.now()
): OturumDurumu {
  if (o.cikis) return "cikti";
  const gecerli = Number(o.bitis) * 1000 > simdi;
  const yakin = simdi - new Date(o.son_etkinlik).getTime() < 5 * 60_000;
  return gecerli && yakin ? "panelde" : "birakti";
}

export const DURUM_YAZISI: Record<OturumDurumu, string> = {
  cikti: "Çıkış yaptı",
  panelde: "Şu an panelde",
  birakti: "Çıkış yapmadan ayrıldı",
};

/** "talep:12" -> 12; başka hedefte null. */
export function talepNo(hedef: string): number | null {
  const m = /^talep:(\d+)$/.exec(hedef);
  return m ? Number(m[1]) : null;
}

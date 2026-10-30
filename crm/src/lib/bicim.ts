/** Form okuma ve ekranda gösterim yardımcıları. */

/** Formdan kırpılmış metin; boşsa null. Uzunluk sınırı veritabanını korur. */
export function metin(fd: FormData, ad: string, en = 500): string | null {
  const v = fd.get(ad);
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, en);
  return t === "" ? null : t;
}

/** YYYY-MM-DD ya da null. */
export function gun(fd: FormData, ad: string): string | null {
  const v = metin(fd, ad, 10);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

export function sayi(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** "rothoblaas.com/..." → "https://rothoblaas.com/..." ; geçersizse null. */
export function webAdresi(v: string | null): string | null {
  if (!v) return null;
  const aday = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(aday);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Eşleştirme için alan adı: küçük harf, www'suz. */
export function alanAdi(web: string | null): string | null {
  if (!web) return null;
  try {
    return new URL(web).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** E-postanın alan adı (ücretsiz posta servisleri hariç). */
const UCRETSIZ = /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|aol|gmx|web|mail|yandex|ukr|wp|interia|o2|seznam|abv|libero|virgilio|orange|wanadoo|free|t-online)\./;
export function epostaAlanAdi(eposta: string | null): string | null {
  const a = eposta?.split("@")[1]?.toLowerCase().trim();
  return a && !UCRETSIZ.test(a) ? a : null;
}

const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

/** Date ya da "YYYY-MM-DD" → "20 Eki 2026". pg DATE sütunu Date nesnesi döner. */
export function tarih(d: Date | string | null | undefined): string {
  if (!d) return "";
  const t = typeof d === "string" ? new Date(`${d.slice(0, 10)}T12:00:00`) : d;
  if (Number.isNaN(t.getTime())) return "";
  return `${t.getDate()} ${AYLAR[t.getMonth()]} ${t.getFullYear()}`;
}

/** <input type="date"> değeri. */
export function inputTarih(d: Date | string | null | undefined): string {
  if (!d) return "";
  if (typeof d === "string") return d.slice(0, 10);
  const y = d.getFullYear();
  const a = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${y}-${a}-${g}`;
}

export function tarihAraligi(a: Date | string | null, b: Date | string | null): string {
  if (!a) return "";
  if (!b || tarih(a) === tarih(b)) return tarih(a);
  return `${tarih(a)} – ${tarih(b)}`;
}

/** 125000.5 → "125.000,50". pg NUMERIC sütunu metin döner. */
export function para(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  const ondalik = n % 1 ? 2 : 0;
  return n.toLocaleString("tr-TR", { minimumFractionDigits: ondalik, maximumFractionDigits: ondalik });
}

/** Formdaki tutar: "125.000,50", "125000.50", "125 000" → 125000.5 ; geçersizse null. */
export function tutar(fd: FormData, ad: string): number | null {
  let v = metin(fd, ad, 30)?.replace(/\s/g, "");
  if (!v) return null;
  /* Hem nokta hem virgül varsa sondaki ondalık ayıracıdır. */
  if (v.includes(",") && v.includes(".")) {
    v = v.lastIndexOf(",") > v.lastIndexOf(".") ? v.replace(/\./g, "").replace(",", ".") : v.replace(/,/g, "");
  } else if (v.includes(",")) {
    v = /,\d{1,2}$/.test(v) ? v.replace(",", ".") : v.replace(/,/g, "");
  } else if (/\.\d{3}(\.|$)/.test(v)) {
    v = v.replace(/\./g, "");
  }
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e12 ? Math.round(n * 100) / 100 : null;
}

/** Zaman damgası → "29 Eki 2026 14:57" (İstanbul). */
export function zaman(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleString("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

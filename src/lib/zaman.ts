/**
 * Panelde tarih gösterimi.
 *
 * Listede göreli ("3 gün önce"), detayda tam tarih. Sebebi: listede bakılan
 * soru "bu ne kadar bekledi", detayda "tam olarak ne zaman geldi". Göreli
 * ifade ilkini bir bakışta cevaplıyor; "15.09.2026 16:30" için kafadan
 * çıkarma yapmak gerekiyor.
 */

const DK = 60_000;
const SAAT = 60 * DK;
const GUN = 24 * SAAT;

export function goreli(iso: string): string {
  const fark = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(fark)) return "";
  if (fark < DK) return "az önce";
  if (fark < SAAT) return `${Math.floor(fark / DK)} dakika önce`;
  if (fark < GUN) return `${Math.floor(fark / SAAT)} saat önce`;
  if (fark < 7 * GUN) return `${Math.floor(fark / GUN)} gün önce`;
  if (fark < 30 * GUN) return `${Math.floor(fark / (7 * GUN))} hafta önce`;
  if (fark < 365 * GUN) return `${Math.floor(fark / (30 * GUN))} ay önce`;
  return tamTarih(iso);
}

/* Saat dilimi AÇIKÇA İstanbul. Verilmezse sunucunun saat dilimi kullanılır;
   konteyner UTC'de çalışıyorsa panelde her saat 3 saat geri görünür, aynı
   tarih sunucuda ve tarayıcıda farklı yazılıp hidrasyon uyuşmazlığı doğar. */
const TZ = "Europe/Istanbul";

export function tamTarih(iso: string | Date): string {
  return new Date(iso).toLocaleString("tr-TR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function kisaTarih(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/** Süre: "1 dk'dan az", "14 dk", "2 sa 5 dk". */
export function sureYaz(saniye: number): string {
  if (!Number.isFinite(saniye) || saniye < 60) return "1 dk'dan az";
  const dk = Math.round(saniye / 60);
  if (dk < 60) return `${dk} dk`;
  const sa = Math.floor(dk / 60);
  const kalan = dk % 60;
  return kalan ? `${sa} sa ${kalan} dk` : `${sa} sa`;
}

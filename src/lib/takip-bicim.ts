/**
 * Takip tarihinin gösterimi — SAF; hem sunucu hem tarayıcı kullanıyor.
 *
 * Tarihler 'YYYY-MM-DD' metni (İstanbul günü). Hesap UTC öğlesinde yapılıyor:
 * gün sınırına uzak, tarayıcının saat dilimi ne olursa olsun aynı günü verir —
 * sunucunun ve tarayıcının çizdiği metin birebir aynı kalır.
 */

export type TakipTuru = "talep" | "firma";

const GUN_MS = 86_400_000;
const ogle = (g: string) => Date.parse(`${g}T12:00:00Z`);

/** Geçerli bir 'YYYY-MM-DD' mi (31 Şubat gibi günler düşer)? */
export function gunGecerli(g: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(g)) return false;
  const t = ogle(g);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === g;
}

/** `tarih` bugünden kaç gün sonra (eksi: geçmiş). */
export function gunFarki(tarih: string, bugun: string): number {
  return Math.round((ogle(tarih) - ogle(bugun)) / GUN_MS);
}

/** "29 Eyl Pzt" */
export function takipTarihi(tarih: string): string {
  return new Date(ogle(tarih)).toLocaleDateString("tr-TR", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    weekday: "short",
  });
}

/** "bugün", "yarın", "3 gün sonra", "dün", "2 gün gecikti" */
export function takipGoreli(tarih: string, bugun: string): string {
  const f = gunFarki(tarih, bugun);
  if (f === 0) return "bugün";
  if (f === 1) return "yarın";
  if (f > 1) return `${f} gün sonra`;
  if (f === -1) return "dün — gecikti";
  return `${-f} gün gecikti`;
}

/** Gecikmiş ya da bugün: kırmızı/turuncu vurgu, bu hafta: sakin. */
export function takipGeldi(tarih: string, bugun: string): boolean {
  return gunFarki(tarih, bugun) <= 0;
}

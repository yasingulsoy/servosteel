import { oturum, rolu } from "@/lib/admin-auth";

/**
 * Sunucu eylemlerinin yetki kontrolü — her eylemin İLK satırı.
 *
 * Next dokümanının uyardığı gibi sunucu eylemleri arayüzden bağımsız olarak
 * doğrudan POST ile çağrılabiliyor; "zaten giriş yapmış olmadan bu düğmeyi
 * göremez" demek güvenlik değildir.
 *
 * "use server" dosyasında DEĞİL: orada dışa açılan her fonksiyon POST ile
 * çağrılabilen bir eyleme dönüşürdü. Buradan içe aktarılınca yalnızca
 * yardımcı olarak kalıyor.
 */
export async function yetki(): Promise<string> {
  const k = await oturum();
  if (!k) throw new Error("yetkisiz");
  return k;
}

/**
 * Yalnızca ADMIN rolü geçer. Kullanıcı açmak, silmek, başkasının parolasını
 * değiştirmek, gönderim sigortasını elle kaldırmak buradan geçer.
 *
 * Kontrol SUNUCUDA, çünkü arayüzdeki menüyü gizlemek güvenlik değil: sunucu
 * eylemi doğrudan POST ile çağrılabiliyor.
 */
export async function adminYetkisi(): Promise<string> {
  const k = await yetki();
  if ((await rolu(k)) !== "admin") throw new Error("bu işlem yalnızca yönetici için");
  return k;
}

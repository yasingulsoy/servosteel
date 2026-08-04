/**
 * Ürün sayfası -> ilgili akademi yazısı eşlemesi.
 *
 * NEDEN: akademi yazıları ürün sayfalarına bol link veriyordu ama TERSİ HİÇ
 * YOKTU — `/dilme-hatlari` sayfasında "nasıl seçilir" ve "ne kadar" yazılarına
 * tek bağlantı bulunmuyordu. Oysa o sayfadaki alıcının kafasındaki soru tam da
 * bu ikisi. Tek yönlü linkleme hem okuru yarıda bırakıyor hem yazıların aldığı
 * iç link sayısını düşük tutuyordu.
 *
 * Slug'lar DAHİLİ (Türkçe) yazılır; Link ve localePath çeviriyi kendisi yapar.
 * Burada listelenen yazının o dilde var olması gerekmez — `hasPost` ile
 * süzülür, olmayan dilde bölüm hiç basılmaz.
 */
export const relatedReading: Record<string, string[]> = {
  "/dilme-hatlari": [
    "rulo-dilme-hatti-nasil-secilir",
    "rulo-dilme-hatti-maliyeti",
    "sac-fire-oranini-dusurmek",
  ],
  "/boy-kesme-hatlari": [
    "boy-kesme-hatti-nasil-secilir",
    "rulo-agirligi-ve-uzunlugu-nasil-hesaplanir",
    "rulo-hatti-nereden-alinmali",
  ],
  "/roll-form-hatlari": [
    "solar-profil-hatti-yatirim-geri-donusu",
    "sac-fire-oranini-dusurmek",
    "rulo-hatti-nereden-alinmali",
  ],
  "/makineler": [
    "servo-besleyici-nasil-secilir",
    "progresif-kalip-servo-besleyici-secimi",
    "rulo-agirligi-ve-uzunlugu-nasil-hesaplanir",
  ],
  "/roll-form-hatlari/solar-profil": ["solar-profil-hatti-yatirim-geri-donusu"],
  "/makineler/servo-suruculer": [
    "servo-besleyici-nasil-secilir",
    "progresif-kalip-servo-besleyici-secimi",
  ],
  "/makineler/rulo-acicilar": ["rulo-agirligi-ve-uzunlugu-nasil-hesaplanir"],
};

/** Bir yol için ilgili yazı slug'ları; tanımsızsa boş dizi. */
export function relatedFor(path: string): string[] {
  return relatedReading[path] ?? [];
}

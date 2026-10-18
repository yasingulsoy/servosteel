/**
 * Akademi yazısı -> ilgili hat ve makine sayfaları eşlemesi (related-reading.ts'in tersi).
 *
 * NEDEN (2026-10-18, GSC son 28 gün): tıkları akademi yazıları ve hesaplayıcılar
 * alıyor (rulo ağırlığı yazısı EN'de 1.475, TR'de 816 gösterim, 4. sıra), ürün
 * sayfaları ise ikinci sayfada (dilme EN 12,3, rulo açıcı 11,3, servo besleyici
 * EN 12,5). Yazılar ürünlere yalnızca metnin içinden, dağınık bağlantı veriyordu;
 * yazının sonunda, teklif formunun hemen üstünde ilgili sayfalara düzenli bir
 * kutu hem okuru ürüne götürür hem ürün sayfalarının aldığı iç bağlantıyı artırır.
 *
 * Slug'lar DAHİLİ (Türkçe) yazılır; Link çeviriyi kendisi yapar. Yollar her dilde
 * var (sayfalar 9 dilde), o yüzden süzme gerekmez.
 */
export const relatedMachines: Record<string, string[]> = {
  "boy-kesme-hatti-nasil-secilir": ["/boy-kesme-hatlari", "/makineler/rulo-acicilar", "/rulo-isleme-hatlari"],
  "hat-ureticisi-nasil-denetlenir": ["/rulo-isleme-hatlari", "/dilme-hatlari", "/roll-form-hatlari"],
  "progresif-kalip-servo-besleyici-secimi": [
    "/makineler/servo-suruculer",
    "/makineler/dogrultmali-servo-suruculer",
    "/makineler/rulo-acicilar",
  ],
  "roll-form-hatti-maliyeti": ["/roll-form-hatlari", "/roll-form-hatlari/kablo-kanali", "/roll-form-hatlari/trapez-cephe-paneli"],
  "roll-form-nedir": ["/roll-form-hatlari", "/roll-form-hatlari/kablo-kanali", "/roll-form-hatlari/c-sigma-omega"],
  "rulo-agirligi-ve-uzunlugu-nasil-hesaplanir": ["/makineler/rulo-acicilar", "/dilme-hatlari", "/boy-kesme-hatlari"],
  "rulo-dilme-hatti-maliyeti": ["/dilme-hatlari", "/makineler/rulo-acicilar", "/rulo-isleme-hatlari"],
  "rulo-dilme-hatti-nasil-secilir": ["/dilme-hatlari", "/makineler/rulo-acicilar", "/rulo-isleme-hatlari"],
  "rulo-hatti-nereden-alinmali": ["/rulo-isleme-hatlari", "/dilme-hatlari", "/boy-kesme-hatlari", "/roll-form-hatlari"],
  "sac-fire-oranini-dusurmek": ["/dilme-hatlari", "/boy-kesme-hatlari", "/roll-form-hatlari"],
  "servo-besleyici-nasil-secilir": [
    "/makineler/servo-suruculer",
    "/makineler/dogrultmali-servo-suruculer",
    "/makineler/kompakt-hatlar",
  ],
  "solar-profil-hatti-yatirim-geri-donusu": ["/roll-form-hatlari/solar-profil", "/roll-form-hatlari"],
};

/** Bir yazı için ilgili ürün yolları; tanımsızsa boş dizi. */
export function machinesFor(slug: string): string[] {
  return relatedMachines[slug] ?? [];
}

/**
 * Ürün yolunun mesaj dosyasındaki adı ve kısa açıklaması: hat aileleri kendi
 * isim alanında (`dilme.title`), makineler ve roll form hatları `products.*`.
 * Tanınmayan yol `null` döner, kutuya girmez.
 */
export function machineKeys(path: string): { name: string; short?: string } | null {
  const aile: Record<string, string> = {
    "/rulo-isleme-hatlari": "ruloIsleme",
    "/dilme-hatlari": "dilme",
    "/boy-kesme-hatlari": "boykesme",
    "/roll-form-hatlari": "hub",
  };
  if (aile[path]) return { name: `${aile[path]}.title` };
  const m = path.match(/^\/(makineler|roll-form-hatlari)\/([^/]+)$/);
  if (!m) return null;
  const grup = m[1] === "makineler" ? "machines" : "rollform";
  return { name: `products.${grup}.${m[2]}.name`, short: `products.${grup}.${m[2]}.short` };
}

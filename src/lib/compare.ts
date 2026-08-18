/**
 * Karşılaştırma sayfaları — "X vs Y" arama niyetini hedefler.
 *
 * Bu sorgular satın alma kararının hemen öncesinde yapılır ve rakiplerde
 * karşılığı yok. Metinler dil dosyalarında (compare.items.<slug>) yaşar;
 * burada yalnızca slug ve ilgili ürün bağlantıları tutulur.
 */

export type CompareItem = {
  slug: string;
  /** Tablodaki A sütununun ürün sayfası (çeviride aName) */
  hrefA: string;
  /** B sütununun ürün sayfası (bName). Karşılığı bir ürün değilse boş bırakılır. */
  hrefB?: string;
  /** Kaç satırlık tablo — çeviri dosyasındaki rows dizisiyle uyumlu olmalı */
  rows: number;
};

/* Karşılaştırılan İKİ tarafa da link verilir. Tek bir "ürün sayfasına git"
   düğmesi varken sayfa yalnızca hub'a bağlanıyordu; Almanca'da bunun sonucu
   şuydu: "hydraulische haspel" sorgusunda karşılaştırma yazısı 5,2'de ve 12
   gösterimde, asıl hidrolik ürün sayfası 3,0'da ama yalnızca 2 gösterimde.
   Ticari sorguyu ürün sayfası karşılamalı. Düğme metni olarak aName/bName
   kullanılıyor — bağlantı metni böylece hedef kelimenin kendisi oluyor
   ("Hydraulische Haspel"), jenerik "ürün sayfasına git" değil. */
export const compareItems: CompareItem[] = [
  /* Mekanik beslemenin ürün sayfası yok — satılan ürün servo besleme. */
  { slug: "servo-vs-mekanik-besleme", hrefA: "/makineler/servo-suruculer", rows: 5 },
  { slug: "dilme-vs-boy-kesme", hrefA: "/dilme-hatlari", hrefB: "/boy-kesme-hatlari", rows: 5 },
  {
    slug: "hidrolik-vs-mekanik-acici",
    hrefA: "/makineler/rulo-acicilar/hidrolik",
    hrefB: "/makineler/rulo-acicilar/mekanik",
    rows: 5,
  },
];

export const compareSlugs = compareItems.map((c) => c.slug);

export function isCompareSlug(slug: string): boolean {
  return compareSlugs.includes(slug);
}

export function getCompare(slug: string): CompareItem | undefined {
  return compareItems.find((c) => c.slug === slug);
}

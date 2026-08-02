/**
 * Karşılaştırma sayfaları — "X vs Y" arama niyetini hedefler.
 *
 * Bu sorgular satın alma kararının hemen öncesinde yapılır ve rakiplerde
 * karşılığı yok. Metinler dil dosyalarında (compare.items.<slug>) yaşar;
 * burada yalnızca slug ve ilgili ürün bağlantısı tutulur.
 */

export type CompareItem = {
  slug: string;
  /** Karşılaştırmanın işaret ettiği ürün sayfası */
  href: string;
  /** Kaç satırlık tablo — çeviri dosyasındaki rows dizisiyle uyumlu olmalı */
  rows: number;
};

export const compareItems: CompareItem[] = [
  { slug: "servo-vs-mekanik-besleme", href: "/makineler/servo-suruculer", rows: 5 },
  { slug: "dilme-vs-boy-kesme", href: "/dilme-hatlari", rows: 5 },
  { slug: "hidrolik-vs-mekanik-acici", href: "/makineler/rulo-acicilar", rows: 5 },
];

export const compareSlugs = compareItems.map((c) => c.slug);

export function isCompareSlug(slug: string): boolean {
  return compareSlugs.includes(slug);
}

export function getCompare(slug: string): CompareItem | undefined {
  return compareItems.find((c) => c.slug === slug);
}

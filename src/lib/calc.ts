/**
 * Hesaplayıcı formülleri — saf fonksiyonlar, birim testine hazır.
 *
 * Buradaki her sonuç GEOMETRİ ve KÜTLE KORUNUMUNDAN türer; hiçbir Servosteel
 * spec'i veya pazarlama sayısı içermez. Bu yüzden değerler evrensel olarak
 * doğrulanabilir — aracın güvenilirliği (ve bağlantı çekiciliği) buna dayanır.
 */

/** Yaygın malzeme yoğunlukları (g/cm³) */
export const DENSITIES = {
  steel: 7.85,
  stainless: 7.9,
  aluminium: 2.7,
  copper: 8.96,
} as const;

export type MaterialKey = keyof typeof DENSITIES;

export type CoilInput = {
  /** Dış çap (mm) */
  od: number;
  /** İç çap — göbek (mm) */
  id: number;
  /** Rulo genişliği (mm) */
  width: number;
  /** Sac kalınlığı (mm) */
  thickness: number;
  /** Yoğunluk (g/cm³) */
  density: number;
};

export type CoilResult = {
  /** Rulo ağırlığı (kg) */
  weight: number;
  /** Açıldığında şerit uzunluğu (m) */
  length: number;
  /** Sarım sayısı (yaklaşık) */
  turns: number;
};

/**
 * Rulo ağırlığı ve uzunluğu.
 *
 * Halka kesit alanı A = π/4·(OD² − ID²). Açıldığında bu alan L·t dikdörtgenine
 * dönüşür (kalınlık korunur), dolayısıyla L = A / t.
 * Kütle = A · genişlik · yoğunluk.
 */
export function coilCalc({ od, id, width, thickness, density }: CoilInput): CoilResult | null {
  if (!(od > id) || id < 0 || width <= 0 || thickness <= 0 || density <= 0) return null;

  const areaMm2 = (Math.PI / 4) * (od * od - id * id);
  /* mm³ → kg : hacim(mm³) × yoğunluk(g/cm³) / 1e6
     (1 mm³ = 1e-3 cm³, 1 g = 1e-3 kg → 1e-6 katsayısı) */
  const weight = (areaMm2 * width * density) / 1e6;
  const length = areaMm2 / thickness / 1000; // mm → m
  const turns = (od - id) / 2 / thickness;

  return { weight, length, turns };
}

export type FeedInput = {
  /** Adım (besleme) boyu — mm */
  feed: number;
  /** Pres strok/dakika */
  spm: number;
  /** Strok başına parça adedi */
  perStroke: number;
  /** Kullanılabilir şerit uzunluğu (m) — rulo ömrü için, 0 = hesaplama */
  coilLength: number;
};

export type FeedResult = {
  /** Saatte parça */
  partsPerHour: number;
  /** Ortalama hat hızı (m/dk) */
  lineSpeed: number;
  /** Saatte tüketilen şerit (m) */
  metersPerHour: number;
  /** Bir rulonun yeteceği süre (saat) — coilLength verilmezse null */
  coilHours: number | null;
};

/**
 * Pres besleme çıktısı.
 *
 * Hat hızı, servo sürücünün ANLIK hızı değil ORTALAMA ilerlemedir: pres her
 * strokta duraklar, sürücü adımı bu duraklar arasında atar. Anlık tepe hız
 * daima daha yüksektir — sürücü seçiminde bu ayrım kritiktir.
 */
export function feedCalc({ feed, spm, perStroke, coilLength }: FeedInput): FeedResult | null {
  if (feed <= 0 || spm <= 0 || perStroke <= 0) return null;

  const metersPerMin = (feed * spm) / 1000;
  const metersPerHour = metersPerMin * 60;

  return {
    partsPerHour: spm * perStroke * 60,
    lineSpeed: metersPerMin,
    metersPerHour,
    coilHours: coilLength > 0 ? coilLength / metersPerHour : null,
  };
}

export type YieldInput = {
  /** Ana rulo genişliği (mm) */
  coilWidth: number;
  /** Şerit genişliği (mm) */
  stripWidth: number;
  /** Toplam kenar traşı (mm) */
  trim: number;
};

export type YieldResult = {
  /** Çıkan şerit adedi */
  strips: number;
  /** Şeritlerin kapladığı genişlik (mm) */
  used: number;
  /** Fire genişliği (mm) — traş + artık */
  waste: number;
  /** Fire oranı (%) */
  wastePct: number;
  /** Kenar traşı dışındaki artık (mm) */
  remainder: number;
};

/**
 * Dilme verimi.
 *
 * Kenar traşı düşüldükten sonra kalan genişliğe tam sayıda şerit sığar;
 * artan kısım fireye eklenir. Şerit sayısı KESİRLİ olamaz — yuvarlanan
 * kısım gerçek maliyettir, bu yüzden ayrı gösterilir.
 */
export function yieldCalc({ coilWidth, stripWidth, trim }: YieldInput): YieldResult | null {
  if (coilWidth <= 0 || stripWidth <= 0 || trim < 0 || trim >= coilWidth) return null;

  const usable = coilWidth - trim;
  const strips = Math.floor(usable / stripWidth);
  if (strips < 1) return null;

  const used = strips * stripWidth;
  const remainder = usable - used;
  const waste = trim + remainder;

  return { strips, used, waste, wastePct: (waste / coilWidth) * 100, remainder };
}

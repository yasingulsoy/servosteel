/**
 * Hesaplayıcı formülleri — saf fonksiyonlar, birim testine hazır.
 *
 * Buradaki her sonuç GEOMETRİ ve KÜTLE KORUNUMUNDAN türer; hiçbir Servosteel
 * spec'i veya pazarlama sayısı içermez. Bu yüzden değerler evrensel olarak
 * doğrulanabilir — aracın güvenilirliği (ve bağlantı çekiciliği) buna dayanır.
 */

/**
 * Yaygın malzeme yoğunlukları (g/cm³). Sıra, seçim kutusundaki ve yoğunluk
 * tablosundaki sıradır.
 *
 * Galvaniz için çeliğin yoğunluğu alınır; çinko kaplama ayrıca eklenmez
 * (Z275 = iki yüzde toplam 275 g/m² → 1 mm sacta 7,85 kg/m²'ye +0,275 kg, %3,5).
 * Aracın altındaki not bunu söylüyor. Pirinç alaşıma göre 8,4–8,7 arası; 8,5
 * yaygın kabul.
 */
export const DENSITIES = {
  steel: 7.85,
  galvanized: 7.85,
  stainless: 7.9,
  aluminium: 2.7,
  copper: 8.96,
  brass: 8.5,
} as const;

export type MaterialKey = keyof typeof DENSITIES;

export type SheetInput = {
  /** Boy (mm) */
  length: number;
  /** En (mm) */
  width: number;
  /** Kalınlık (mm) */
  thickness: number;
  /** Adet */
  qty: number;
  /** Yoğunluk (g/cm³) */
  density: number;
};

export type SheetResult = {
  /** Bir levhanın ağırlığı (kg) */
  weight: number;
  /** Toplam ağırlık (kg) */
  total: number;
  /** Toplam alan (m²) */
  area: number;
  /** Metrekare ağırlığı (kg/m²) — kalınlık × yoğunluk */
  perM2: number;
};

/**
 * Sac / plaka ağırlığı.
 *
 * Levha dikdörtgen bir bloktur: ağırlık = hacim × yoğunluk. mm³ × g/cm³ →
 * kg dönüşüm katsayısı 1e-6 (rulo hesabıyla aynı). Metrekare ağırlığı kalınlık
 * × yoğunluk'tur: 1 mm çelik = 7,85 kg/m² — her sonucu elle sağlamanın yolu.
 */
export function sheetCalc({ length, width, thickness, qty, density }: SheetInput): SheetResult | null {
  /* !(x > 0): boş kutu NaN gelir; NaN <= 0 false olduğu için eski yazım onu geçiriyordu */
  if (!(length > 0) || !(width > 0) || !(thickness > 0) || !(density > 0) || !(qty >= 1)) return null;

  const weight = (length * width * thickness * density) / 1e6;
  const areaM2 = (length * width) / 1e6;
  return { weight, total: weight * qty, area: areaM2 * qty, perM2: thickness * density };
}

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
  /** Dış çap (mm) — dış çaptan hesapta girilen, diğerlerinde bulunan */
  od: number;
  /** Rulo sac ağırlığı (kg) */
  weight: number;
  /** Açıldığında şerit uzunluğu (m) */
  length: number;
  /** Sarım sayısı (yaklaşık) */
  turns: number;
  /** Şeridin metre ağırlığı (kg/m) — genişlik × kalınlık × yoğunluk */
  kgPerM: number;
  /** Genişliğin her milimetresine düşen ağırlık (kg/mm); inç sisteminde PIW (lb/in) */
  kgPerMm: number;
  /** Şeridin tek yüz alanı (m²) — boya/kaplama hesabı için */
  areaM2: number;
};

/** Halka kesit alanı (mm²): π/4·(OD² − ID²) */
const halkaAlani = (od: number, id: number) => (Math.PI / 4) * (od * od - id * id);

/** Halka alanından dış çap: A = π/4·(OD² − ID²) → OD = √(ID² + 4A/π) */
const disCap = (alan: number, id: number) => Math.sqrt(id * id + (4 * alan) / Math.PI);

function coilFromRing(od: number, id: number, width: number, thickness: number, density: number): CoilResult {
  const areaMm2 = halkaAlani(od, id);
  /* mm³ → kg : hacim(mm³) × yoğunluk(g/cm³) / 1e6
     (1 mm³ = 1e-3 cm³, 1 g = 1e-3 kg → 1e-6 katsayısı) */
  const weight = (areaMm2 * width * density) / 1e6;
  const length = areaMm2 / thickness / 1000; // mm → m
  return {
    od,
    weight,
    length,
    turns: (od - id) / 2 / thickness,
    /* 1 m şerit = genişlik × kalınlık × 1000 mm³ → × yoğunluk / 1e6 kg */
    kgPerM: (width * thickness * density) / 1000,
    kgPerMm: weight / width,
    areaM2: (length * width) / 1000,
  };
}

const gecerliKesit = (id: number, width: number, thickness: number, density: number) =>
  id >= 0 && width > 0 && thickness > 0 && density > 0;

/**
 * Rulo sac ağırlığı ve uzunluğu — dış çaptan.
 *
 * Halka kesit alanı A = π/4·(OD² − ID²). Açıldığında bu alan L·t dikdörtgenine
 * dönüşür (kalınlık korunur), dolayısıyla L = A / t.
 * Kütle = A · genişlik · yoğunluk.
 *
 * Şeridin orta hattını sarmal (Arşimet spirali) sayıp tur tur toplamak da aynı
 * sonucu verir: n = (R − r)/t tur, ortalama yarıçap (R + r)/2 →
 * L = 2π·n·(R + r)/2 = π(R² − r²)/t. Yani alan yöntemi yaklaşık değil, sıkı
 * sarılmış rulo için kesin; gerçek rulodaki sapma sarım aralığı ve kalınlık
 * toleransından gelir.
 */
export function coilCalc({ od, id, width, thickness, density }: CoilInput): CoilResult | null {
  if (!(od > id) || !gecerliKesit(id, width, thickness, density)) return null;
  return coilFromRing(od, id, width, thickness, density);
}

export type CoilFromWeightInput = Omit<CoilInput, "od"> & {
  /** Rulo sac ağırlığı (kg) — sertifikadaki değer */
  weight: number;
};

/**
 * Ağırlıktan dış çap ve uzunluk — alıcının elindeki sertifikada çoğu zaman
 * yalnız ağırlık, genişlik ve kalınlık yazar; açıcının dış çap sınırına
 * sığıp sığmadığını bu hesap söyler.
 *
 * A = ağırlık·1e6 / (genişlik·yoğunluk), OD = √(ID² + 4A/π).
 */
export function coilFromWeight({ weight, id, width, thickness, density }: CoilFromWeightInput): CoilResult | null {
  if (!(weight > 0) || !gecerliKesit(id, width, thickness, density)) return null;
  const alan = (weight * 1e6) / (width * density);
  return coilFromRing(disCap(alan, id), id, width, thickness, density);
}

export type CoilFromLengthInput = Omit<CoilInput, "od"> & {
  /** Şerit uzunluğu (m) */
  length: number;
};

/**
 * Uzunluktan dış çap ve ağırlık — "bana 800 m şerit lazım, rulo ne kadar
 * büyük olur" sorusu. A = L·t (L mm'ye çevrilerek), OD = √(ID² + 4A/π).
 */
export function coilFromLength({ length, id, width, thickness, density }: CoilFromLengthInput): CoilResult | null {
  if (!(length > 0) || !gecerliKesit(id, width, thickness, density)) return null;
  const alan = length * 1000 * thickness;
  return coilFromRing(disCap(alan, id), id, width, thickness, density);
}

export type CoilFromTurnsInput = Omit<CoilInput, "od"> & {
  /** Sarım sayısı */
  turns: number;
};

/**
 * Sarım sayısından — her sarım yarıçapa bir kalınlık ekler:
 * OD = ID + 2 · sarım · kalınlık. Sahada rulo sacın yanından sayılan tur
 * sayısıyla ağırlığı tahmin etmenin yolu.
 */
export function coilFromTurns({ turns, id, width, thickness, density }: CoilFromTurnsInput): CoilResult | null {
  if (!(turns > 0) || !gecerliKesit(id, width, thickness, density)) return null;
  return coilFromRing(id + 2 * turns * thickness, id, width, thickness, density);
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
  if (!(feed > 0) || !(spm > 0) || !(perStroke > 0)) return null;

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
  if (!(coilWidth > 0) || !(stripWidth > 0) || !(trim >= 0) || trim >= coilWidth) return null;

  const usable = coilWidth - trim;
  const strips = Math.floor(usable / stripWidth);
  if (strips < 1) return null;

  const used = strips * stripWidth;
  const remainder = usable - used;
  const waste = trim + remainder;

  return { strips, used, waste, wastePct: (waste / coilWidth) * 100, remainder };
}

export type SlitInput = YieldInput & {
  /** Ana rulo sacın ağırlığı (kg) */
  coilWeight: number;
  /** Sac kalınlığı (mm) */
  thickness: number;
  /** Yoğunluk (g/cm³) */
  density: number;
};

export type SlitResult = YieldResult & {
  /** Bir şeridin (dar rulo sacın) ağırlığı (kg) */
  stripWeight: number;
  /** Fire olarak ayrılan ağırlık (kg) — kenar traşı + artık */
  scrapWeight: number;
  /** Şeridin metre ağırlığı (kg/m) */
  stripKgPerM: number;
};

/**
 * Dilme sonrası şerit ağırlıkları.
 *
 * Dilme genişliği böler, uzunluğa ve dış çapa dokunmaz: her dar rulo sac ana
 * rulonun boyunu taşır, ağırlığı genişlik oranında pay alır. Bu yüzden şerit
 * ağırlığı = ana ağırlık × şerit genişliği / ana genişlik — yoğunluk ve çaplar
 * zaten ana ağırlığın içinde.
 */
export function slitCalc({ coilWidth, stripWidth, trim, coilWeight, thickness, density }: SlitInput): SlitResult | null {
  const y = yieldCalc({ coilWidth, stripWidth, trim });
  if (!y || !(coilWeight > 0) || !(thickness > 0) || !(density > 0)) return null;

  const kgPerMmWidth = coilWeight / coilWidth;
  return {
    ...y,
    stripWeight: stripWidth * kgPerMmWidth,
    scrapWeight: y.waste * kgPerMmWidth,
    stripKgPerM: (stripWidth * thickness * density) / 1000,
  };
}

/* ------------------------------------------------------------------ */
/* Açıcı önerisi                                                        */
/* ------------------------------------------------------------------ */

export type DecoilerFamily = "mekanik" | "hidrolik";

export type DecoilerModel = {
  family: DecoilerFamily;
  /** Taşıma kapasitesi (kg) */
  capacity: number;
  /** Malzeme genişliği aralığı (mm) */
  widthMin: number;
  widthMax: number;
  /** Rulo sac iç çapı aralığı (mm) */
  idMin: number;
  idMax: number;
};

/** Standart serinin taşıdığı en büyük dış çap (mm) — iki ailede de 1.600 */
export const DECOILER_OD_MAX = 1600;

/**
 * Servosteel standart açıcı serisi, kapasiteye göre küçükten büyüğe.
 *
 * KAYNAK: ürün sayfalarındaki tablolar — messages/*.json içinde
 * `products.variants.rulo-acicilar.mekanik-rulo-acicilar.table` ve
 * `...hidrolik-rulo-acicilar.table` (2026-11-11). Hidrolikte her kapasitenin
 * birkaç genişlik sürümü var; burada o kapasitenin kapsadığı en geniş aralık
 * duruyor. Tablolar değişirse bu liste de güncellenmeli.
 *
 * Aynı kapasitede (4.000 kg) mekanik önce gelir: ölçüler uyuyorsa daha
 * ekonomik olan önerilir.
 */
export const DECOILERS: readonly DecoilerModel[] = [
  { family: "mekanik", capacity: 500, widthMin: 30, widthMax: 300, idMin: 300, idMax: 550 },
  { family: "mekanik", capacity: 750, widthMin: 30, widthMax: 300, idMin: 350, idMax: 550 },
  { family: "mekanik", capacity: 1500, widthMin: 30, widthMax: 400, idMin: 400, idMax: 550 },
  { family: "mekanik", capacity: 2500, widthMin: 30, widthMax: 500, idMin: 450, idMax: 550 },
  { family: "mekanik", capacity: 3000, widthMin: 80, widthMax: 800, idMin: 450, idMax: 560 },
  { family: "mekanik", capacity: 4000, widthMin: 100, widthMax: 1200, idMin: 450, idMax: 560 },
  { family: "hidrolik", capacity: 4000, widthMin: 70, widthMax: 600, idMin: 470, idMax: 570 },
  { family: "hidrolik", capacity: 6000, widthMin: 70, widthMax: 1000, idMin: 470, idMax: 570 },
  { family: "hidrolik", capacity: 10000, widthMin: 70, widthMax: 1500, idMin: 470, idMax: 570 },
  { family: "hidrolik", capacity: 15000, widthMin: 100, widthMax: 1600, idMin: 470, idMax: 570 },
];

export type DecoilerPick = {
  /** Önerilen sınıf; ölçüler standart serinin dışındaysa null */
  model: DecoilerModel | null;
  /** İç çap, önerilen modelin standart mandren aralığında mı */
  idFits: boolean;
  /** Dış çap standart serinin sınırında mı */
  odFits: boolean;
};

/**
 * Rulo sacın ağırlığına ve genişliğine uyan en küçük açıcı.
 *
 * Belirleyici olan kapasite ve genişlik: ikisi uymazsa model yoktur. İç çap
 * uymazsa yine en küçük uygun sınıf önerilir ama uyarı çıkar — mandren
 * segmentiyle çözülen, satışın konuşacağı bir ayrıntıdır; 400 kg'lık rulo sac
 * için yalnız mandreni uyduğu diye 3.000 kg'lık açıcı önermek yanlış olur.
 */
export function pickDecoiler({ weight, width, id, od }: { weight: number; width: number; id: number; od: number }): DecoilerPick {
  const model = DECOILERS.find((m) => m.capacity >= weight && width >= m.widthMin && width <= m.widthMax) ?? null;
  return {
    model,
    idFits: model !== null && id >= model.idMin && id <= model.idMax,
    odFits: od <= DECOILER_OD_MAX,
  };
}

/** Ürün sayfası yolu */
export const DECOILER_HREF: Record<DecoilerFamily, string> = {
  mekanik: "/makineler/rulo-acicilar/mekanik-rulo-acicilar",
  hidrolik: "/makineler/rulo-acicilar/hidrolik-rulo-acicilar",
};

/* ------------------------------------------------------------------ */
/* Birimler                                                             */
/* ------------------------------------------------------------------ */

/** 1 inç = 25,4 mm (tanım gereği kesin) */
export const MM_PER_IN = 25.4;
/** 1 lb = 0,45359237 kg (uluslararası avoirdupois paund, kesin) */
export const KG_PER_LB = 0.45359237;
/** 1 ft = 0,3048 m (kesin) */
export const M_PER_FT = 0.3048;

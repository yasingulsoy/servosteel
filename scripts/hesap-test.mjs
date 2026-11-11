import assert from "node:assert/strict";
/**
 * Hesaplayıcı formüllerinin testi (src/lib/calc.ts).
 *
 *   node scripts/hesap-test.mjs
 *
 * Beklenen sayılar formülün kendisinden değil, elle ya da bağımsız bir yoldan
 * hesaplandı (açıklama her testin yanında). Yanlış çıkan sayı doğrudan
 * alıcının açıcı kapasitesi kararına girdiği için toleranslar dar tutuldu.
 */
const C = await import(new URL("../src/lib/calc.ts", import.meta.url).href);
const S = await import(new URL("../src/lib/sayi-girdi.ts", import.meta.url).href);

let n = 0;
const t = (ad, fn) => { fn(); n++; console.log("  ok -", ad); };
/** Göreli tolerans: |a − b| ≤ oran × |b| */
const yakin = (a, b, oran = 1e-4, ad = "") =>
  assert.ok(Math.abs(a - b) <= oran * Math.abs(b), `${ad} beklenen ${b}, gelen ${a}`);

const celik = 7.85;

t("1) Akademi örneği: 1400/508/1250 mm, 2 mm çelik → 13.116 kg, 668 m, 223 sarım", () => {
  /* Elle: 1400² − 508² = 1.960.000 − 258.064 = 1.701.936
     A = π/4 × 1.701.936 = 1.336.697,4 mm²
     kg = 1.336.697,4 × 1250 × 7,85 / 1e6 = 13.116,34
     L  = 1.336.697,4 / 2 / 1000 = 668,35 m
     sarım = (1400 − 508) / 2 / 2 = 223 */
  const r = C.coilCalc({ od: 1400, id: 508, width: 1250, thickness: 2, density: celik });
  yakin(r.weight, 13116.34, 1e-6, "ağırlık");
  yakin(r.length, 668.349, 1e-6, "uzunluk");
  assert.equal(r.turns, 223);
  assert.equal(r.od, 1400);
});

t("2) Rehber örneği: aynı rulo sac 1,5 mm → 891 m", () => {
  const r = C.coilCalc({ od: 1400, id: 508, width: 1250, thickness: 1.5, density: celik });
  yakin(r.length, 891.13, 1e-5, "uzunluk");
});

t("3) Ağırlıktan uzunluk: 10 t, 1250 mm, 1 mm çelik → 1.019 m", () => {
  /* Elle: 10.000 / (1,25 × 0,001 × 7.850) = 10.000 / 9,8125 = 1.019,11 m */
  const r = C.coilFromWeight({ weight: 10000, id: 508, width: 1250, thickness: 1, density: celik });
  yakin(r.length, 1019.108, 1e-6, "uzunluk");
  yakin(r.weight, 10000, 1e-12, "ağırlık geri dönüşü");
});

t("4) Alüminyum: 1000/500/1000 mm, 1 mm → 1.590 kg, 589 m", () => {
  /* Elle: A = π/4 × (1.000.000 − 250.000) = π × 187.500 = 589.048,6 mm²
     kg = 589.048,6 × 1000 × 2,7 / 1e6 = 1.590,43 ; L = 589,05 m */
  const r = C.coilCalc({ od: 1000, id: 500, width: 1000, thickness: 1, density: C.DENSITIES.aluminium });
  yakin(r.weight, 1590.43, 1e-5, "ağırlık");
  yakin(r.length, 589.049, 1e-5, "uzunluk");
});

t("5) İnç sistemi, bağımsız yol: 60\"/20\"/48\" çelik → 34.213 lb", () => {
  /* Bağımsız yol: hacim inç³ olarak, çelik 0,28360 lb/in³ (7,85 g/cm³ ×
     0,0361273) ile. V = π/4 × (3600 − 400) × 48 = 120.637,2 in³
     → 120.637,2 × 0,283599 = 34.212,6 lb. Araç ise mm/kg'da hesaplar. */
  const mm = (x) => x * C.MM_PER_IN;
  const r = C.coilCalc({ od: mm(60), id: mm(20), width: mm(48), thickness: mm(0.0598), density: celik });
  yakin(r.weight / C.KG_PER_LB, 120637.2 * 7.85 * 0.0361273, 1e-5, "lb");
});

t("6) Ters hesaplar dış çapı geri bulur (ağırlık ve uzunluktan)", () => {
  const ileri = C.coilCalc({ od: 1400, id: 508, width: 1250, thickness: 2, density: celik });
  const a = C.coilFromWeight({ weight: ileri.weight, id: 508, width: 1250, thickness: 2, density: celik });
  const b = C.coilFromLength({ length: ileri.length, id: 508, width: 1250, thickness: 2, density: celik });
  yakin(a.od, 1400, 1e-12, "ağırlıktan OD");
  yakin(b.od, 1400, 1e-12, "uzunluktan OD");
  yakin(b.weight, 13116.34, 1e-6, "uzunluktan ağırlık");
});

t("6b) İki yönlü bağlı alanlar: ağırlık → uzunluk → ağırlık, sarım → dış çap → sarım", () => {
  const k = { id: 508, width: 1250, thickness: 1.5, density: celik };
  /* Ağırlık girilir, uzunluk hesaplanır; o uzunluk girilince aynı ağırlık dönmeli */
  const a = C.coilFromWeight({ ...k, weight: 8000 });
  const b = C.coilFromLength({ ...k, length: a.length });
  yakin(b.weight, 8000, 1e-12, "ağırlık geri");
  yakin(b.od, a.od, 1e-12, "dış çap aynı");
  /* Uzunluk → ağırlık → uzunluk */
  const c = C.coilFromLength({ ...k, length: 750 });
  yakin(C.coilFromWeight({ ...k, weight: c.weight }).length, 750, 1e-12, "uzunluk geri");
  /* Sarım: elle OD = 508 + 2 × 300 × 1,5 = 1408 mm */
  const s = C.coilFromTurns({ ...k, turns: 300 });
  assert.equal(s.od, 1408);
  yakin(s.turns, 300, 1e-12, "sarım geri");
  yakin(C.coilCalc({ ...k, od: 1408 }).weight, s.weight, 1e-12, "sarım ↔ dış çap aynı ağırlık");
  /* Dört yoldan da aynı rulo sac: dış çaptan başla, diğer üçünden geri dön */
  const ana = C.coilCalc({ ...k, od: 1400 });
  for (const r of [
    C.coilFromWeight({ ...k, weight: ana.weight }),
    C.coilFromLength({ ...k, length: ana.length }),
    C.coilFromTurns({ ...k, turns: ana.turns }),
  ]) {
    yakin(r.od, 1400, 1e-12, "OD");
    yakin(r.weight, ana.weight, 1e-12, "ağırlık");
    yakin(r.length, ana.length, 1e-12, "uzunluk");
  }
  assert.equal(C.coilFromTurns({ ...k, turns: 0 }), null);
  assert.equal(C.coilFromTurns({ ...k, turns: NaN }), null);
});

t("7) Ağırlıktan dış çap: 10 t, 610 göbek, 1500 mm çelik → Ø1.206 mm", () => {
  /* Elle: A = 10.000 × 1e6 / (1500 × 7,85) = 849.256,9 mm²
     OD = √(610² + 4 × 849.256,9 / π) = √(372.100 + 1.081.304) = √1.453.404 = 1.205,6 */
  const r = C.coilFromWeight({ weight: 10000, id: 610, width: 1500, thickness: 3, density: celik });
  yakin(r.od, 1205.57, 1e-5, "OD");
});

t("8) Metre ağırlığı, genişlik başına ağırlık, yüzey alanı", () => {
  /* 1250 × 2 × 7,85 / 1000 = 19,625 kg/m ; 19,625 × 668,349 = 13.116,3 kg (tutarlılık)
     13.116,34 / 1250 = 10,493 kg/mm ; alan = 668,349 × 1,25 = 835,44 m² */
  const r = C.coilCalc({ od: 1400, id: 508, width: 1250, thickness: 2, density: celik });
  yakin(r.kgPerM, 19.625, 1e-12, "kg/m");
  yakin(r.kgPerM * r.length, r.weight, 1e-12, "kg/m × L = ağırlık");
  yakin(r.kgPerMm, 10.49307, 1e-5, "kg/mm");
  yakin(r.areaM2, 835.436, 1e-5, "m²");
});

t("9) Dilme: 1250 mm ana rulo sac, 120 mm şerit, 10 mm traş → 10 şerit × 1.259 kg", () => {
  /* Elle: (1250 − 10) / 120 = 10,33 → 10 şerit, 1200 mm; artık 40, fire 50 mm
     şerit = 13.116,34 × 120 / 1250 = 1.259,17 kg ; fire = 13.116,34 × 50 / 1250 = 524,65 kg
     10 × 1.259,17 + 524,65 = 13.116,34 (kütle korunur) */
  const s = C.slitCalc({ coilWidth: 1250, stripWidth: 120, trim: 10, coilWeight: 13116.34, thickness: 2, density: celik });
  assert.equal(s.strips, 10);
  assert.equal(s.waste, 50);
  yakin(s.stripWeight, 1259.169, 1e-5, "şerit kg");
  yakin(s.scrapWeight, 524.654, 1e-5, "fire kg");
  yakin(s.strips * s.stripWeight + s.scrapWeight, 13116.34, 1e-12, "toplam");
  yakin(s.stripKgPerM, 1.884, 1e-12, "şerit kg/m"); // 120 × 2 × 7,85 / 1000
});

t("10) Açıcı önerisi ürün tablolarına uyar", () => {
  const p = (weight, width, id, od = 1200) => C.pickDecoiler({ weight, width, id, od });
  /* 13,1 t → hidrolik 15 t (10 t yetmez) */
  let r = p(13116, 1250, 508, 1400);
  assert.equal(r.model.family, "hidrolik");
  assert.equal(r.model.capacity, 15000);
  assert.ok(r.idFits && r.odFits);
  /* 1,2 t, 300 mm → mekanik 1.500 kg */
  r = p(1200, 300, 508);
  assert.deepEqual([r.model.family, r.model.capacity, r.idFits], ["mekanik", 1500, true]);
  /* 3,5 t ama 1000 mm genişlik → mekanik 4.000 (3.000 kg en fazla 800 mm) */
  r = p(3500, 1000, 508);
  assert.deepEqual([r.model.family, r.model.capacity], ["mekanik", 4000]);
  /* 4,5 t → hidrolik; 4 t hidrolik en fazla 600 mm, 1000 mm için 6 t */
  r = p(4500, 1000, 508);
  assert.deepEqual([r.model.family, r.model.capacity], ["hidrolik", 6000]);
  /* 400 kg ama göbek 600 → yine en küçük sınıf, iç çap uyarısıyla */
  r = p(400, 200, 600);
  assert.deepEqual([r.model.capacity, r.idFits], [500, false]);
  /* Seri dışı: 20 t ya da 1.700 mm genişlik */
  assert.equal(p(20000, 1000, 508).model, null);
  assert.equal(p(5000, 1700, 508).model, null);
  /* 1.650 mm dış çap uyarısı */
  assert.equal(p(5000, 1000, 508, 1650).odFits, false);
});

t("11) Geçersiz girdi sonuç vermez", () => {
  assert.equal(C.coilCalc({ od: 500, id: 508, width: 1000, thickness: 1, density: celik }), null);
  assert.equal(C.coilCalc({ od: 1400, id: 508, width: 0, thickness: 1, density: celik }), null);
  assert.equal(C.coilFromWeight({ weight: 0, id: 508, width: 1000, thickness: 1, density: celik }), null);
  assert.equal(C.coilFromLength({ length: 100, id: 508, width: 1000, thickness: 0, density: celik }), null);
  assert.equal(C.slitCalc({ coilWidth: 1000, stripWidth: 1200, trim: 0, coilWeight: 5000, thickness: 1, density: celik }), null);
  /* Boş kutu NaN gelir: hiçbir hesap NaN ile "sonuç" üretmemeli */
  assert.equal(C.coilCalc({ od: NaN, id: 508, width: 1000, thickness: 1, density: celik }), null);
  assert.equal(C.coilCalc({ od: 1400, id: NaN, width: 1000, thickness: 1, density: celik }), null);
  assert.equal(C.sheetCalc({ length: NaN, width: 1000, thickness: 1, qty: 1, density: celik }), null);
  assert.equal(C.feedCalc({ feed: NaN, spm: 40, perStroke: 1, coilLength: 0 }), null);
  assert.equal(C.yieldCalc({ coilWidth: 1250, stripWidth: 120, trim: NaN }), null);
  assert.equal(C.slitCalc({ coilWidth: 1250, stripWidth: NaN, trim: 10, coilWeight: 5000, thickness: 1, density: celik }), null);
});

t("11b) Kutudaki sayı sayfa diline göre okunur ve yazılır", () => {
  /* Ondalık: Türkçe/Almanca virgül, İngilizce nokta; ikisi de kabul */
  assert.equal(S.sayiOku("2,5", "tr"), 2.5);
  assert.equal(S.sayiOku("2.5", "tr"), 2.5);
  assert.equal(S.sayiOku("2.5", "en"), 2.5);
  assert.equal(S.sayiOku("0.394", "tr"), 0.394); // inç kalınlık: 0 ile başlayan binlik olamaz
  /* Dilin binlik biçimi */
  assert.equal(S.sayiOku("1.250", "tr"), 1250);
  assert.equal(S.sayiOku("1.250,5", "de"), 1250.5);
  assert.equal(S.sayiOku("1,250", "en"), 1250);
  assert.equal(S.sayiOku("1 250", "ru"), 1250);
  assert.equal(S.sayiOku("١٢٥٠", "ar"), 1250);
  /* Boş ya da anlamsız → NaN (0 değil) */
  assert.ok(Number.isNaN(S.sayiOku("", "tr")));
  assert.ok(Number.isNaN(S.sayiOku("abc", "tr")));
  assert.ok(Number.isNaN(S.sayiOku("-5", "tr")));
  /* Yazım: binlik ayırıcısız, dilin ondalığıyla */
  assert.equal(S.sayiYaz(1250, "tr"), "1250");
  assert.equal(S.sayiYaz(0.0787, "tr"), "0,0787");
  assert.equal(S.sayiYaz(0.0787, "en"), "0.0787");
  assert.equal(S.sayiYaz(NaN, "tr"), "");
  /* Hesaplanan alan binlik ayırıcıyla yazılır */
  assert.equal(S.sayiYaz(13116, "tr", true), "13.116");
  assert.equal(S.sayiYaz(13116, "en", true), "13,116");
  /* Yazılanı geri okuyunca aynı sayı — ayırıcılı da ayırıcısız da */
  for (const l of ["tr", "en", "de", "es", "it", "hu", "pl", "ru", "ar"])
    for (const x of [508, 1250, 2, 0.0787, 24.02, 22046, 13116.5, 1234567])
      for (const gruplu of [false, true])
        assert.equal(S.sayiOku(S.sayiYaz(x, l, gruplu), l), x, `${l} ${x} ${gruplu}`);
});

t("12) Sac: 2500 × 1250 × 3 mm çelik → 73,6 kg, 1 mm = 7,85 kg/m²", () => {
  const r = C.sheetCalc({ length: 2500, width: 1250, thickness: 3, qty: 1, density: celik });
  yakin(r.weight, 73.594, 1e-4, "kg");
  assert.equal(C.sheetCalc({ length: 1000, width: 1000, thickness: 1, qty: 1, density: celik }).weight, 7.85);
});

console.log(`\n${n} test geçti.`);

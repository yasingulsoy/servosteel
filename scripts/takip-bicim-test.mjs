import assert from "node:assert/strict";
/**
 * Takip tarihi yardımcılarının testi.
 *
 *   node scripts/takip-bicim-test.mjs
 *
 * Gün farkı ve "3 gün gecikti" yazısı — yanlışı panelde kırmızı rozet,
 * menüde sayı ve pazartesi özetinde satır olarak görünür.
 */
const T = await import(new URL("../src/lib/takip-bicim.ts", import.meta.url).href);

let n = 0;
const t = (ad, fn) => { fn(); n++; console.log("  ok -", ad); };

t("gecerli gun", () => {
  assert.equal(T.gunGecerli("2026-09-29"), true);
  assert.equal(T.gunGecerli("2026-02-31"), false); // takvimde yok
  assert.equal(T.gunGecerli("2026-9-29"), false);
  assert.equal(T.gunGecerli("29.09.2026"), false);
  assert.equal(T.gunGecerli(""), false);
  assert.equal(T.gunGecerli("2028-02-29"), true); // artık yıl
});

t("gun farki ay ve yil sinirini gecer", () => {
  assert.equal(T.gunFarki("2026-09-29", "2026-09-26"), 3);
  assert.equal(T.gunFarki("2026-09-25", "2026-09-26"), -1);
  assert.equal(T.gunFarki("2026-10-01", "2026-09-30"), 1);
  assert.equal(T.gunFarki("2027-01-01", "2026-12-31"), 1);
  /* Türkiye yaz saati 2016'dan beri yok ama başka saat dilimli tarayıcıda da aynı sonuç */
  assert.equal(T.gunFarki("2026-03-30", "2026-03-28"), 2);
});

t("goreli yazi", () => {
  assert.equal(T.takipGoreli("2026-09-26", "2026-09-26"), "bugün");
  assert.equal(T.takipGoreli("2026-09-27", "2026-09-26"), "yarın");
  assert.equal(T.takipGoreli("2026-09-29", "2026-09-26"), "3 gün sonra");
  assert.equal(T.takipGoreli("2026-09-25", "2026-09-26"), "dün — gecikti");
  assert.equal(T.takipGoreli("2026-09-20", "2026-09-26"), "6 gün gecikti");
});

t("geldi mi", () => {
  assert.equal(T.takipGeldi("2026-09-26", "2026-09-26"), true);
  assert.equal(T.takipGeldi("2026-09-20", "2026-09-26"), true);
  assert.equal(T.takipGeldi("2026-09-27", "2026-09-26"), false);
});

t("tarih yazisi gunu kaydirmaz", () => {
  /* UTC öğlesiyle hesaplanıyor: sunucu UTC, tarayıcı İstanbul ya da Meksika olsa da aynı gün */
  assert.match(T.takipTarihi("2026-09-29"), /^29 Eyl Sal$/);
  assert.match(T.takipTarihi("2026-01-01"), /^1 Oca Per$/);
});

console.log(`${n} test gecti`);

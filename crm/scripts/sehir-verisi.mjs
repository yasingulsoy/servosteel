/**
 * data/sehirler.json üretir: ülke kodu → [ad, enlem, boylam, nüfus, bölge kodu].
 * Kaynak: all-the-cities (GeoNames, nüfusu 1000 üstü yerleşimler, CC BY 4.0).
 * Haritanın şehir bulucusu (src/lib/sehir-bul.ts) bunu okur.
 *
 *   node scripts/sehir-verisi.mjs
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sehirler = require("all-the-cities");

const ulkeler = {};
for (const s of sehirler) {
  if (!s.country || !s.loc?.coordinates) continue;
  const [lng, lat] = s.loc.coordinates;
  (ulkeler[s.country] ??= []).push([s.name, +lat.toFixed(3), +lng.toFixed(3), s.population, s.adminCode || ""]);
}
for (const l of Object.values(ulkeler)) l.sort((a, b) => b[3] - a[3]);
fs.writeFileSync(new URL("../data/sehirler.json", import.meta.url), JSON.stringify(ulkeler));
console.log(Object.keys(ulkeler).length, "ülke,", sehirler.length, "şehir");

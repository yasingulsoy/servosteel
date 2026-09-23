import assert from "node:assert/strict";
import fs from "node:fs";
import pg from "pg";
/**
 * Hatırlatma (ikinci tur) SQL'inin testi — YEREL veritabanında, canlıya dokunmaz.
 *
 *   node scripts/ikinci-tur-test.mjs
 *
 * Neden ayrı test: ikinci tur kuralı tamamen SQL'de duruyor ("dönüş gelmemiş,
 * metni hazır, üstünden 21 gün geçmiş, hatırlatması gitmemiş"). Saf fonksiyon
 * testi bunu yakalayamaz; yanlış yazılmış tek koşul aynı firmaya ikinci kez
 * aynı mektubu gönderir. Burada gerçek Postgres'te çalıştırılıp deneniyor.
 *
 * Sorgu metni src/lib/outreach-db.ts'den KOPYA — dosya değişirse aşağıdaki
 * "kaynakla aynı mı" denetimi patlar, test sessizce eskimiş olmaz.
 *
 * Yerel küme: PGTEST_URL ya da postgres://postgres:postgres@localhost:5432/postgres
 * Küme yoksa test atlanır (çıkış 0) — CI'siz makinede yapıyı bozmasın diye.
 */

const URL_ = process.env.PGTEST_URL || "postgres://postgres:postgres@localhost:5432/postgres";
const VT = "servosteel_ikinci_tur_test";

const KOSUL = `
  h.listede AND h.durum = 'gonderildi' AND h.eposta <> '' AND h.govde2 <> '' AND h.konu2 <> ''
  AND NOT (h.ulke = ANY($1::text[]))
  AND NOT EXISTS (SELECT 1 FROM eposta_engel e WHERE e.eposta = lower(h.eposta))
  AND NOT EXISTS (SELECT 1 FROM hedef_gonderim g
                  WHERE lower(g.eposta) = lower(h.eposta) AND g.tur >= 2 AND g.sonuc IN ('ok', 'belirsiz'))
  AND EXISTS (SELECT 1 FROM hedef_gonderim g
              WHERE lower(g.eposta) = lower(h.eposta) AND g.sonuc IN ('ok', 'belirsiz')
                AND g.zaman < now() - ($9 || ' days')::interval)
`;

/* Kaynakla aynı mı? IKINCI_TUR bir şablon işlevi: ${gunParam} yerine $9 konur. */
const kaynak = fs.readFileSync(new URL("../src/lib/outreach-db.ts", import.meta.url), "utf8");
const m = kaynak.match(/const IKINCI_TUR = \(gunParam: string\) => `([\s\S]*?)`;/);
assert.ok(m, "outreach-db.ts icinde IKINCI_TUR bulunamadi");
assert.equal(m[1].replace("${gunParam}", "$9"), KOSUL, "KOSUL kaynaktaki IKINCI_TUR ile ayni degil");

const yonetici = new pg.Client({ connectionString: URL_, connectionTimeoutMillis: 4000 });
try {
  await yonetici.connect();
} catch {
  console.log("yerel Postgres yok — test atlandi");
  process.exit(0);
}
await yonetici.query(`DROP DATABASE IF EXISTS ${VT}`);
await yonetici.query(`CREATE DATABASE ${VT}`);
await yonetici.end();

const c = new pg.Client({ connectionString: URL_.replace(/\/[^/]*$/, `/${VT}`) });
await c.connect();

const { OUTREACH_SEMA } = await import(new URL("../src/lib/outreach-sema.ts", import.meta.url).href);
await c.query(OUTREACH_SEMA);

/* Altı firma: yalnızca biri hatırlatmayı hak ediyor. */
const firmalar = [
  ["a-bekliyor", "bekliyor", "a@x.com", true, null],
  ["b-hatirlatilir", "gonderildi", "b@x.com", true, 30],
  ["c-cok-yeni", "gonderildi", "c@x.com", true, 5],
  ["d-yanit-verdi", "yanit", "d@x.com", true, 30],
  ["e-metni-yok", "gonderildi", "e@x.com", false, 30],
  ["f-hatirlatmasi-gitti", "gonderildi", "f@x.com", true, 30],
];
for (const [anahtar, durum, eposta, metin, gunOnce] of firmalar) {
  const { rows } = await c.query(
    `INSERT INTO hedef_firmalar (anahtar, firma, hitap, ulke, segmentler, web, kanit, urun, iletisim,
       eposta, dil, konu, govde, konu2, govde2, link, durum, listede, iptal_anahtari, kategori, gonderildi)
     VALUES ($1,$1,$1,'Hindistan','','','','','',$2,'en','K','G',$3,$4,'',$5,true,$1,1,
       CASE WHEN $6::int IS NULL THEN NULL ELSE now() - ($6 || ' days')::interval END)
     RETURNING id`,
    [anahtar, eposta, metin ? "K2" : "", metin ? "G2" : "", durum, gunOnce]
  );
  if (gunOnce !== null) {
    await c.query(
      `INSERT INTO hedef_gonderim (firma_id, kullanici, eposta, konu, govde, sonuc, yanit, zaman, tur)
       VALUES ($1,'test',$2,'K','G','ok','250 ok', now() - ($3 || ' days')::interval, 1)`,
      [rows[0].id, eposta, gunOnce]
    );
  }
  if (anahtar === "f-hatirlatmasi-gitti") {
    await c.query(
      `INSERT INTO hedef_gonderim (firma_id, kullanici, eposta, konu, govde, sonuc, yanit, zaman, tur)
       VALUES ($1,'test',$2,'K2','G2','ok','250 ok', now() - interval '2 days', 2)`,
      [rows[0].id, eposta]
    );
  }
}

const sec = async (gun = 21) =>
  (
    await c.query(
      `SELECT h.anahtar FROM hedef_firmalar h
       WHERE ${KOSUL} AND h.kategori = ANY($2::int[])
         AND ($3::boolean OR NOT (h.ulke = ANY($4::text[])))
         AND ($5::boolean OR NOT h.kesif)
       ORDER BY CASE WHEN h.ulke = ANY($7::text[]) THEN 0
                     WHEN h.ulke = ANY($8::text[]) THEN 1 ELSE 2 END,
                h.gonderildi, h.id
       LIMIT $6`,
      [[], [1], true, [], true, 50, [], [], String(gun)]
    )
  ).rows.map((r) => r.anahtar);

let n = 0;
const t = (ad, fn) => { fn(); n++; console.log("  ok -", ad); };

const yirmiBir = await sec(21);
t("yalnizca donus gelmemis, metni hazir, 21 gunu dolmus firma", () => {
  assert.deepEqual(yirmiBir, ["b-hatirlatilir"]);
});

const uc = await sec(3);
t("bekleme suresi kisalinca yeni firma da giriyor", () => {
  assert.deepEqual(uc.sort(), ["b-hatirlatilir", "c-cok-yeni"]);
});

await c.query(`INSERT INTO eposta_engel (eposta, sebep) VALUES ('b@x.com','test')`);
const engelli = await sec(21);
t("abonelikten cikan hatirlatma almaz", () => {
  assert.deepEqual(engelli, []);
});

await c.query(`DELETE FROM eposta_engel`);
const geri = await sec(21);
t("engel kalkinca geri geliyor", () => {
  assert.deepEqual(geri, ["b-hatirlatilir"]);
});

await c.end();
const kapat = new pg.Client({ connectionString: URL_ });
await kapat.connect();
await kapat.query(`DROP DATABASE IF EXISTS ${VT}`);
await kapat.end();
console.log(`${n} test gecti`);

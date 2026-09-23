/**
 * Hedef firma listesini panel veritabanına aktarır (Panel → Hedef firmalar).
 *
 *   python scripts/hedef-firma-excel.py          # önce: Excel + panel-aktarim.json
 *   node scripts/hedef-firma-aktar.mjs           # KURU: ne değişeceğini yazar, dokunmaz
 *   node scripts/hedef-firma-aktar.mjs --yaz     # veritabanına yazar
 *
 * Bağlantı: ortamdaki DATABASE_URL, yoksa .env.local'daki — o CANLI veritabanı.
 *
 * KURALLAR
 *  - Anahtar alan adı + ülke (Excel'deki tekilleştirmeyle aynı). Var olan
 *    firmanın bilgileri güncellenir; ADRES, DİL ve E-POSTA METNİ yalnızca henüz
 *    gönderilmemiş ("bekliyor") firmada. Gönderilmiş firmanın kaydı gideni
 *    anlatmaya devam etmeli.
 *  - Listeden çıkan firma SİLİNMEZ, `listede = false` olur ve gönderilemez:
 *    gönderim geçmişi ve notlar kaybolmasın.
 *  - Abonelik anahtarı yalnızca YENİ firmada üretilir. Değişseydi gönderilmiş
 *    e-postalardaki "abonelikten çık" bağlantısı ölürdü.
 *  - Gelen liste mevcut listenin yarısından kısaysa YAZMAZ: yarım kalmış bir
 *    JSON yüzlerce firmayı "listede değil" yapmasın.
 *
 * Tablo tanımı panelle ORTAK (src/lib/outreach-sema.ts); Node tür ayıklamasıyla
 * doğrudan içe aktarılıyor, iki ayrı kopya yok.
 */
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import pg from "pg";
import { OUTREACH_SEMA } from "../src/lib/outreach-sema.ts";

const YAZ = process.argv.includes("--yaz");
/* --dosya <yol>: başka bir aktarım dosyası (deneme için). */
const di = process.argv.indexOf("--dosya");
const DOSYA = di > 0 && process.argv[di + 1] ? process.argv[di + 1] : "seo/hedef-firmalar/panel-aktarim.json";

function dosyadanOrtam() {
  let ham = "";
  try {
    ham = fs.readFileSync(".env.local", "utf8");
  } catch {
    return {};
  }
  return Object.fromEntries(
    ham
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "")];
      })
  );
}

const dosya = dosyadanOrtam();
const DATABASE_URL = process.env.DATABASE_URL || dosya.DATABASE_URL;
const DATABASE_SSL = process.env.DATABASE_SSL ?? dosya.DATABASE_SSL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL tanımlı değil (ortamda da .env.local'da da yok).");
  process.exit(1);
}

let veri;
try {
  veri = JSON.parse(fs.readFileSync(DOSYA, "utf8"));
} catch (e) {
  console.error(`${DOSYA} okunamadı — önce: python scripts/hedef-firma-excel.py\n${e.message}`);
  process.exit(1);
}

const ALANLAR = [
  "anahtar", "firma", "hitap", "ulke", "segmentler", "web", "kanit", "urun",
  "iletisim", "eposta", "dil", "konu", "govde", "link", "konu2", "govde2",
];
/* Gönderilmiş firmada korunan alanlar — gönderilmiş metin bir daha değişmesin diye.
   konu2/govde2 BİLEREK burada değil: ikinci tur metnine ihtiyacı olan firmalar
   tam da gönderilmiş olanlar, korunsaydı onlara hiç yazılamazdı. */
const METIN = ["eposta", "dil", "konu", "govde", "link"];
/* Ürün grubu ve panel sırası — sınıflandırma, her aktarımda güncellenir (durumdan bağımsız). */
const GRUP = { kategori: "int", kategori_notu: "text", sira: "int", kesif: "boolean" };
const GRUP_ALANLARI = Object.keys(GRUP);

const firmalar = veri.firmalar;
if (!Array.isArray(firmalar) || firmalar.length === 0) {
  console.error("Dosyada firma yok.");
  process.exit(1);
}
const gorulen = new Set();
for (const f of firmalar) {
  /* İkinci tur alanları olmayan eski aktarım dosyası da okunabilsin. */
  for (const a of ["konu2", "govde2"]) if (typeof f[a] !== "string") f[a] = "";
  for (const a of ALANLAR) {
    if (typeof f[a] !== "string") {
      console.error(`Bozuk kayıt (${a} yok): ${JSON.stringify(f).slice(0, 200)}`);
      process.exit(1);
    }
  }
  /* Eski aktarım dosyasında grup alanları yok: varsayılanla gelir (grup 6, sıra 0). */
  f.kategori = Number.isInteger(f.kategori) ? f.kategori : 6;
  f.kategori_notu = typeof f.kategori_notu === "string" ? f.kategori_notu : "";
  f.sira = Number.isInteger(f.sira) ? f.sira : 0;
  f.kesif = f.kesif === true;
  if (!f.anahtar || gorulen.has(f.anahtar)) {
    console.error(`Boş ya da tekrarlanan anahtar: "${f.anahtar}"`);
    process.exit(1);
  }
  gorulen.add(f.anahtar);
}

const istemci = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_SSL === "off" ? undefined : { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});
await istemci.connect();

/* Kuru çalıştırma şemaya dokunmaz: yeni sütunlar canlıda henüz yoksa okunmaz, "farklı" sayılır. */
async function varOlanlar(sutunlar) {
  const { rows } = await istemci.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'hedef_firmalar'`
  );
  const var_ = new Set(rows.map((r) => r.column_name));
  return sutunlar.filter((s) => var_.has(s));
}

try {
  /* Kuru çalıştırma veritabanına HİÇ yazmaz — tablo yoksa kurmaz da. */
  const { rows: tablo } = await istemci.query(`SELECT to_regclass('hedef_firmalar') IS NOT NULL AS var`);
  if (YAZ) await istemci.query(OUTREACH_SEMA);
  const { rows: mevcut } =
    YAZ || tablo[0].var
      ? await istemci.query(
          `SELECT ${[...ALANLAR, ...(YAZ ? GRUP_ALANLARI : await varOlanlar(GRUP_ALANLARI))].join(", ")},
                  durum, listede FROM hedef_firmalar`
        )
      : { rows: [] };
  const harita = new Map(mevcut.map((r) => [r.anahtar, r]));
  const listedeki = mevcut.filter((r) => r.listede).length;

  let yeni = 0, degisen = 0, ayni = 0, korunan = 0;
  for (const f of firmalar) {
    const r = harita.get(f.anahtar);
    if (!r) {
      yeni++;
      continue;
    }
    const acik = r.durum === "bekliyor";
    const fark =
      ALANLAR.some((a) => (acik || !METIN.includes(a)) && r[a] !== f[a]) ||
      GRUP_ALANLARI.some((a) => r[a] !== f[a]);
    if (!acik && METIN.some((a) => r[a] !== f[a])) korunan++;
    if (fark || !r.listede) degisen++;
    else ayni++;
  }
  const cikan = mevcut.filter((r) => r.listede && !gorulen.has(r.anahtar));

  console.log(`Kaynak: ${DOSYA} (${veri.uretildi ?? "tarih yok"}) — ${firmalar.length} firma, ${firmalar.filter((f) => f.eposta).length} e-postalı`);
  console.log(`Veritabanı: ${mevcut.length} kayıt (${listedeki} listede)`);
  console.log(`  yeni: ${yeni} · güncellenecek: ${degisen} · aynı: ${ayni} · listeden çıkacak: ${cikan.length}`);
  if (korunan) console.log(`  ${korunan} gönderilmiş firmanın adresi/metni KORUNDU (kaynakta değişmiş)`);
  for (const r of cikan.slice(0, 15)) console.log(`    listeden çıkıyor: ${r.firma} (${r.ulke})`);
  if (cikan.length > 15) console.log(`    … ve ${cikan.length - 15} firma daha`);

  if (listedeki > 0 && firmalar.length < listedeki / 2) {
    console.error(`\nDURDU: gelen liste (${firmalar.length}) mevcut listenin (${listedeki}) yarısından kısa. Dosya yarım olabilir.`);
    process.exit(1);
  }
  if (!YAZ) {
    console.log("\nKuru çalıştırma — hiçbir şey yazılmadı. Yazmak için: node scripts/hedef-firma-aktar.mjs --yaz");
    process.exit(0);
  }

  /* Tek sorgu, tek gidiş-dönüş: tüm liste JSON olarak gider. Satır satır
     INSERT uzak veritabanında dakikalar sürüyordu. */
  const kayitlar = firmalar.map((f) => ({
    ...Object.fromEntries([...ALANLAR, ...GRUP_ALANLARI].map((a) => [a, f[a]])),
    iptal_anahtari: randomBytes(16).toString("base64url"),
  }));
  const tumu = [...ALANLAR, ...GRUP_ALANLARI];
  const koru = (a) => `${a} = CASE WHEN hedef_firmalar.durum = 'bekliyor' THEN EXCLUDED.${a} ELSE hedef_firmalar.${a} END`;

  await istemci.query("BEGIN");
  await istemci.query(
    `INSERT INTO hedef_firmalar (${tumu.join(", ")}, iptal_anahtari)
     SELECT ${tumu.join(", ")}, iptal_anahtari
     FROM json_to_recordset($1::json) AS x(${[...ALANLAR, "iptal_anahtari"].map((a) => `${a} text`)
       .concat(GRUP_ALANLARI.map((a) => `${a} ${GRUP[a]}`)).join(", ")})
     ON CONFLICT (anahtar) DO UPDATE SET
       firma = EXCLUDED.firma, hitap = EXCLUDED.hitap, ulke = EXCLUDED.ulke,
       segmentler = EXCLUDED.segmentler, web = EXCLUDED.web, kanit = EXCLUDED.kanit,
       urun = EXCLUDED.urun, iletisim = EXCLUDED.iletisim,
       konu2 = EXCLUDED.konu2, govde2 = EXCLUDED.govde2,
       ${METIN.map(koru).join(",\n       ")},
       ${GRUP_ALANLARI.map((a) => `${a} = EXCLUDED.${a}`).join(", ")},
       listede = true,
       aktarildi = now()`,
    [JSON.stringify(kayitlar)]
  );
  const { rowCount } = await istemci.query(
    `UPDATE hedef_firmalar SET listede = false, guncellendi = now()
     WHERE listede AND NOT (anahtar = ANY($1::text[]))`,
    [[...gorulen]]
  );
  await istemci.query("COMMIT");

  const { rows } = await istemci.query(
    `SELECT count(*)::int AS toplam, count(*) FILTER (WHERE listede)::int AS listede,
            count(*) FILTER (WHERE listede AND durum = 'bekliyor' AND eposta <> '')::int AS bekleyen
     FROM hedef_firmalar`
  );
  console.log(`\nYazıldı. ${rowCount} firma listeden çıkarıldı.`);
  console.log(`Veritabanı şimdi: ${rows[0].toplam} kayıt, ${rows[0].listede} listede, ${rows[0].bekleyen} e-postalı firma gönderim bekliyor.`);
} catch (e) {
  await istemci.query("ROLLBACK").catch(() => {});
  console.error("HATA:", e.message);
  process.exitCode = 1;
} finally {
  await istemci.end();
}

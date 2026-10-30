/**
 * Bir etkinlikte tanışılan firmaları ve kişileri CRM'e aktarır.
 *
 *   node scripts/etkinlik-aktar.mjs --dosya <aktarim.json> --etkinlik <id>          # kuru
 *   node scripts/etkinlik-aktar.mjs --dosya <aktarim.json> --etkinlik <id> --yaz    # yazar
 *
 * Aktarım dosyası (müşteri verisi taşıdığı için DEPOYA KONMAZ):
 *   { "firmalar": [ { "ad", "web", "ulke", "sektor", "faaliyet", "potansiyel",
 *                     "ilgiler": ["kod"], "not",
 *                     "kisiler": [ { "ad", "unvan", "eposta", "eposta2", "telefon",
 *                                    "talep", "takip", "son_temas" } ] } ] }
 *
 * Arayüzdeki hızlı kayıtla aynı kurallar: aynı alan adlı (web ya da kurumsal
 * e-posta) ya da aynı adlı firma varsa yenisi açılmaz; kişi aynı e-postayla
 * varsa tekrar eklenmez; o kişinin bu etkinlikte görüşmesi varsa yenisi
 * yazılmaz. Böylece betik iki kez çalışsa da kayıt çoğalmaz.
 */
import fs from "node:fs";
import { alanAdi, bolgesi, epostaAlani } from "./ortak.mjs";
import { baglan } from "./ortam.mjs";

const arg = (ad) => {
  const i = process.argv.indexOf(ad);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const YAZ = process.argv.includes("--yaz");
const dosya = arg("--dosya");
const etkinlikId = Number(arg("--etkinlik"));
if (!dosya || !Number.isInteger(etkinlikId)) {
  console.error("Kullanım: node scripts/etkinlik-aktar.mjs --dosya <json> --etkinlik <id> [--yaz]");
  process.exit(1);
}
const veri = JSON.parse(fs.readFileSync(dosya, "utf8"));

const TAKIPLER = new Set([
  "gorusuldu", "eposta_gonderildi", "teknik_bilgi_istendi", "cizim_bekleniyor",
  "teklif_verilecek", "teklif_gonderildi", "olumsuz",
]);
const POTANSIYELLER = new Set(["yuksek", "var", "belirsiz", "yok"]);

const db = await baglan();
const sayac = { firmaYeni: 0, firmaMevcut: 0, kisiYeni: 0, kisiMevcut: 0, temasYeni: 0, temasMevcut: 0 };
try {
  const e = (await db.query(`SELECT ad FROM crm_etkinlik WHERE id = $1`, [etkinlikId])).rows[0];
  if (!e) throw new Error(`Etkinlik #${etkinlikId} yok.`);
  console.log(`Etkinlik: ${e.ad} · ${veri.firmalar.length} firma${YAZ ? "" : " · KURU ÇALIŞTIRMA"}\n`);
  await db.query("BEGIN");

  for (const f of veri.firmalar) {
    const ilkKurumsal = f.kisiler.map((k) => epostaAlani(k.eposta)).find(Boolean) ?? null;
    const alan = alanAdi(f.web) ?? ilkKurumsal;
    const bolge = bolgesi(f.ulke);
    const potansiyel = POTANSIYELLER.has(f.potansiyel) ? f.potansiyel : "belirsiz";
    let firma = (
      await db.query(
        `SELECT id FROM crm_firma WHERE ($1::text IS NOT NULL AND alan_adi = $1) OR lower(ad) = lower($2)
          ORDER BY (alan_adi = $1) DESC NULLS LAST, id LIMIT 1`,
        [alan, f.ad]
      )
    ).rows[0];
    const durum = firma ? "mevcut" : "yeni";
    if (firma) {
      sayac.firmaMevcut++;
      await db.query(
        `UPDATE crm_firma SET web = COALESCE(web, $2), alan_adi = COALESCE(alan_adi, $3), ulke = COALESCE(ulke, $4),
                bolge = COALESCE(bolge, $5), sektor = COALESCE(sektor, $6), faaliyet = COALESCE(faaliyet, $7),
                potansiyel = CASE WHEN $8 IN ('var', 'yuksek') THEN $8 ELSE potansiyel END, guncellendi = now()
          WHERE id = $1`,
        [firma.id, f.web, alan, f.ulke, bolge, f.sektor, f.faaliyet, potansiyel]
      );
    } else {
      sayac.firmaYeni++;
      firma = (
        await db.query(
          `INSERT INTO crm_firma (ad, web, alan_adi, ulke, bolge, sektor, faaliyet, potansiyel, notlar, olusturan)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'aktarim') RETURNING id`,
          [f.ad, f.web, alan, f.ulke, bolge, f.sektor, f.faaliyet, potansiyel, f.not ?? null]
        )
      ).rows[0];
    }
    for (const kod of f.ilgiler ?? []) {
      const r = await db.query(
        `INSERT INTO crm_firma_ilgi (firma_id, ilgi_kod) SELECT $1, kod FROM crm_ilgi_alani WHERE kod = $2
         ON CONFLICT DO NOTHING RETURNING ilgi_kod`,
        [firma.id, kod]
      );
      if (!r.rowCount && !(await db.query(`SELECT 1 FROM crm_ilgi_alani WHERE kod = $1`, [kod])).rowCount) {
        console.warn(`  ! bilinmeyen ilgi kodu atlandı: ${kod}`);
      }
    }

    const kisiOzet = [];
    for (const k of f.kisiler) {
      const ad = k.ad || k.eposta || null;
      let kisiId = null;
      if (ad) {
        const var_ = k.eposta
          ? (await db.query(`SELECT id FROM crm_kisi WHERE firma_id = $1 AND lower(eposta) = lower($2)`, [firma.id, k.eposta]))
              .rows[0]
          : (await db.query(`SELECT id FROM crm_kisi WHERE firma_id = $1 AND lower(ad) = lower($2)`, [firma.id, ad])).rows[0];
        if (var_) {
          sayac.kisiMevcut++;
          kisiId = var_.id;
        } else {
          sayac.kisiYeni++;
          kisiId = (
            await db.query(
              `INSERT INTO crm_kisi (firma_id, ad, unvan, eposta, eposta2, telefon, olusturan)
               VALUES ($1, $2, $3, $4, $5, $6, 'aktarim') RETURNING id`,
              [firma.id, ad, k.unvan ?? null, k.eposta ?? null, k.eposta2 ?? null, k.telefon ?? null]
            )
          ).rows[0].id;
        }
      }
      const temasVar = (
        await db.query(
          `SELECT 1 FROM crm_temas WHERE firma_id = $1 AND etkinlik_id = $2 AND kisi_id IS NOT DISTINCT FROM $3`,
          [firma.id, etkinlikId, kisiId]
        )
      ).rowCount;
      if (temasVar) {
        sayac.temasMevcut++;
      } else {
        sayac.temasYeni++;
        await db.query(
          `INSERT INTO crm_temas (firma_id, kisi_id, etkinlik_id, talep, takip, son_temas, olusturan)
           VALUES ($1, $2, $3, $4, $5, $6, 'aktarim')`,
          [firma.id, kisiId, etkinlikId, k.talep ?? null, TAKIPLER.has(k.takip) ? k.takip : "gorusuldu", k.son_temas ?? null]
        );
      }
      kisiOzet.push(`${ad ?? "(kişisiz)"}${k.takip && k.takip !== "eposta_gonderildi" ? ` [${k.takip}]` : ""}`);
    }
    console.log(
      `${durum === "yeni" ? "+" : "="} ${f.ad} · ${f.ulke ?? "ülke yok"}${bolge ? ` (${bolge})` : ""} · ${alan ?? "alan adı yok"}` +
        `${f.ilgiler?.length ? ` · ilgi: ${f.ilgiler.join(", ")}` : ""}\n    ${kisiOzet.join("; ")}`
    );
  }

  if (YAZ) {
    await db.query(
      `INSERT INTO crm_kayit (kullanici, olay, hedef, ayrinti) VALUES ('betik', 'etkinlik_aktar', $1, $2)`,
      [`etkinlik #${etkinlikId}`, JSON.stringify(sayac)]
    );
    await db.query("COMMIT");
  } else {
    await db.query("ROLLBACK");
  }
  console.log(
    `\nFirma: ${sayac.firmaYeni} yeni, ${sayac.firmaMevcut} mevcut · Kişi: ${sayac.kisiYeni} yeni, ${sayac.kisiMevcut} mevcut · ` +
      `Görüşme: ${sayac.temasYeni} yeni, ${sayac.temasMevcut} zaten vardı`
  );
  console.log(YAZ ? "Yazıldı." : "Kuru çalıştırma — hiçbir şey yazılmadı. Yazmak için --yaz.");
} catch (err) {
  await db.query("ROLLBACK").catch(() => {});
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}

/**
 * Panelde satışa iletilmiş işleri CRM'e aktarır.
 *
 *   node scripts/panel-aktar.mjs                       # kuru: ne yazılacağını gösterir
 *   node scripts/panel-aktar.mjs --yaz
 *   node scripts/panel-aktar.mjs --firma 776,2495 --yaz   # e-posta yanıtı satışa iletilmiş hedef firmalar
 *
 * Aktarılanlar:
 *  1. Talepler: durumu "yeni" ve "spam" dışında olan her site/elle talebi.
 *  2. Tanıtım mailine gelen ve satışa iletilen yanıtlar: --firma ile verilen hedef
 *     firmalar ve notunda "satışa iletildi" geçenler.
 *
 * Her kayıt crm_temas.kaynak'ta ("talep:37", "hedef:743001") iz bırakır; betik
 * kaç kez çalışırsa çalışsın aynı kayıt bir kez gelir. CRM'de sonradan
 * değiştirilen alanlara dokunulmaz.
 */
import { alanAdi, bolgesi, epostaAlani, kimdenAyir } from "./ortak.mjs";
import { baglan } from "./ortam.mjs";

const YAZ = process.argv.includes("--yaz");
const fi = process.argv.indexOf("--firma");
const elleFirmalar = fi > 0 ? process.argv[fi + 1].split(",").map(Number).filter(Number.isInteger) : [];

/* Formdaki serbest ülke yazımı → CRM'in Türkçe adı. Bilinmeyen olduğu gibi kalır. */
const ULKE = {
  "south africa": "Güney Afrika", nigeria: "Nijerya", india: "Hindistan", chile: "Şili", ecuador: "Ekvador",
  polska: "Polonya", poland: "Polonya", romania: "Romanya", "côte d’ivoire": "Fildişi Sahili",
  "cote d'ivoire": "Fildişi Sahili", казахстан: "Kazakistan", kazakhstan: "Kazakistan", malaysia: "Malezya",
  kenya: "Kenya", mexico: "Meksika", méxico: "Meksika", egypt: "Mısır", türkiye: "Türkiye", turkey: "Türkiye",
};
function ulkeAdi(ham, dil) {
  const t = String(ham ?? "").trim();
  if (!t) return dil === "tr" ? "Türkiye" : null;
  const k = t.toLowerCase();
  for (const [anahtar, ad] of Object.entries(ULKE)) if (k === anahtar || k.startsWith(`${anahtar} `)) return ad;
  return t;
}

const TAKIP = {
  iletildi: "yeni",
  ulasildi: "gorusuldu",
  bilgi_verildi: "gorusuldu",
  teklif_gonderildi: "teklif_gonderildi",
  kazanildi: "teklif_gonderildi",
  kaybedildi: "olumsuz",
};

/** Sayfa adresinden utm'siz yol ve tanıtım mailindeki firma alan adı. */
function sayfaCoz(sayfa) {
  try {
    const u = new URL(sayfa);
    return {
      yol: u.pathname,
      tanitim: u.searchParams.get("utm_source") === "outreach",
      utmAlan: u.searchParams.get("utm_content")?.toLowerCase() || null,
    };
  } catch {
    return { yol: null, tanitim: false, utmAlan: null };
  }
}

const db = await baglan();
const q = async (s, p = []) => (await db.query(s, p)).rows;
const sayac = { firmaYeni: 0, firmaMevcut: 0, kisiYeni: 0, temasYeni: 0, atlanan: 0 };

/** Hedef firma: alan adından (anahtar "alan|ülke", web ya da e-posta). */
async function hedefBul(alan) {
  if (!alan) return null;
  return (
    await q(
      `SELECT id, firma, ulke, web, segmentler, gonderildi FROM hedef_firmalar
        WHERE split_part(anahtar, '|', 1) = $1 OR lower(split_part(eposta, '@', 2)) = $1
        ORDER BY gonderildi NULLS LAST LIMIT 1`,
      [alan]
    )
  )[0] ?? null;
}

/** CRM firması: alan adı, ad ya da aynı e-postalı kişi; yoksa açılır. */
async function firmaBulAc({ ad, alan, web, ulke, sektor, hedefId, kisiEposta }) {
  let f = (
    await q(
      `SELECT id FROM crm_firma
        WHERE ($1::text IS NOT NULL AND alan_adi = $1) OR lower(ad) = lower($2)
           OR ($3::int IS NOT NULL AND hedef_firma_id = $3)
        ORDER BY (alan_adi = $1) DESC NULLS LAST, id LIMIT 1`,
      [alan, ad, hedefId]
    )
  )[0];
  if (!f && kisiEposta) {
    f = (await q(`SELECT firma_id AS id FROM crm_kisi WHERE lower(eposta) = $1 LIMIT 1`, [kisiEposta]))[0];
  }
  if (f) {
    sayac.firmaMevcut++;
    /* Adı bilinmeden açılmış firma, gerçek adı sonradan gelince o adı alır. */
    await q(
      `UPDATE crm_firma SET web = COALESCE(web, $2), alan_adi = COALESCE(alan_adi, $3), ulke = COALESCE(ulke, $4),
              bolge = COALESCE(bolge, $5), sektor = COALESCE(sektor, $6), hedef_firma_id = COALESCE(hedef_firma_id, $7),
              ad = CASE WHEN ad LIKE '%(firma bilinmiyor)' AND $8 NOT LIKE '%(firma bilinmiyor)' THEN $8 ELSE ad END
        WHERE id = $1`,
      [f.id, web, alan, ulke, bolgesi(ulke), sektor, hedefId, ad]
    );
    return { id: f.id, yeni: false };
  }
  sayac.firmaYeni++;
  const r = await q(
    `INSERT INTO crm_firma (ad, web, alan_adi, ulke, bolge, sektor, potansiyel, hedef_firma_id, olusturan)
     VALUES ($1, $2, $3, $4, $5, $6, 'var', $7, 'aktarim') RETURNING id`,
    [ad, web, alan, ulke, bolgesi(ulke), sektor, hedefId]
  );
  return { id: r[0].id, yeni: true };
}

async function kisiBulAc(firmaId, { ad, eposta, telefon }) {
  if (!ad && !eposta) return null;
  const var_ = eposta
    ? (await q(`SELECT id FROM crm_kisi WHERE firma_id = $1 AND lower(eposta) = $2`, [firmaId, eposta]))[0]
    : (await q(`SELECT id FROM crm_kisi WHERE firma_id = $1 AND lower(ad) = lower($2)`, [firmaId, ad]))[0];
  if (var_) {
    if (telefon) await q(`UPDATE crm_kisi SET telefon = COALESCE(telefon, $2) WHERE id = $1`, [var_.id, telefon]);
    return var_.id;
  }
  sayac.kisiYeni++;
  return (
    await q(
      `INSERT INTO crm_kisi (firma_id, ad, eposta, telefon, olusturan) VALUES ($1, $2, $3, $4, 'aktarim') RETURNING id`,
      [firmaId, ad || eposta, eposta, telefon]
    )
  )[0].id;
}

try {
  await db.query("BEGIN");
  const islenmis = new Set((await q(`SELECT kaynak FROM crm_temas WHERE kaynak IS NOT NULL`)).map((r) => r.kaynak));

  /* 1. Talepler */
  const talepler = await q(
    `SELECT id, olusturuldu, guncellendi, tur, dil, ad, eposta, firma, telefon, ulke, mesaj, sayfa, kaynak, durum
       FROM talepler WHERE durum NOT IN ('yeni', 'spam') ORDER BY id`
  );
  console.log(`Talepler (${talepler.length})${YAZ ? "" : " · KURU ÇALIŞTIRMA"}`);
  for (const t of talepler) {
    const kaynak = `talep:${t.id}`;
    if (islenmis.has(kaynak)) {
      sayac.atlanan++;
      continue;
    }
    const s = sayfaCoz(t.sayfa);
    const eposta = t.eposta?.trim().toLowerCase() || null;
    const alan = epostaAlani(eposta) ?? s.utmAlan;
    const hedef = (await hedefBul(epostaAlani(eposta))) ?? (await hedefBul(s.utmAlan));
    const kanal =
      s.tanitim || (hedef?.gonderildi && new Date(hedef.gonderildi) < new Date(t.olusturuldu))
        ? "tanitim_maili"
        : t.kaynak === "form"
          ? "site_formu"
          : "diger";
    const ulke = hedef?.ulke ?? ulkeAdi(t.ulke, t.dil);
    const ad = hedef?.firma ?? (t.firma?.trim() || alan || `${t.ad} (firma bilinmiyor)`);
    const f = await firmaBulAc({
      ad,
      alan: alan ?? alanAdi(hedef?.web),
      web: hedef?.web ?? (alan ? `https://${alan}/` : null),
      ulke,
      sektor: hedef?.segmentler ?? null,
      hedefId: hedef?.id ?? null,
      kisiEposta: eposta,
    });
    const kisiId = await kisiBulAc(f.id, { ad: t.ad?.trim() || null, eposta, telefon: t.telefon?.trim() || null });
    const gunu = (d) => new Date(d).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
    await q(
      `INSERT INTO crm_temas (firma_id, kisi_id, tarih, talep, takip, kanal, son_temas, notlar, kaynak, olusturan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'aktarim')`,
      [
        f.id,
        kisiId,
        gunu(t.olusturuldu),
        t.mesaj?.trim() || null,
        TAKIP[t.durum] ?? "yeni",
        kanal,
        gunu(t.guncellendi ?? t.olusturuldu),
        `Panel talebi #${t.id}${s.yol ? ` · ${s.yol}` : ""}`,
        kaynak,
      ]
    );
    sayac.temasYeni++;
    console.log(
      `  ${f.yeni ? "+" : "="} #${t.id} ${ad} · ${ulke ?? "ülke yok"} · ${kanal} · ${TAKIP[t.durum] ?? "yeni"}${hedef ? ` · hedef ${hedef.id}` : ""}`
    );
  }

  /* 2. Satışa iletilen e-posta yanıtları */
  const notluFirmalar = (await q(`SELECT DISTINCT firma_id FROM hedef_not WHERE govde ILIKE '%satışa iletildi%'`)).map(
    (r) => r.firma_id
  );
  const hedefler = [...new Set([...elleFirmalar, ...notluFirmalar])];
  console.log(`\nSatışa iletilen e-posta yanıtları (${hedefler.length})`);
  for (const hid of hedefler) {
    const kaynak = `hedef:${hid}`;
    if (islenmis.has(kaynak)) {
      sayac.atlanan++;
      continue;
    }
    const h = (await q(`SELECT id, firma, ulke, web, eposta, segmentler, anahtar FROM hedef_firmalar WHERE id = $1`, [hid]))[0];
    if (!h) {
      console.warn(`  ! hedef firma ${hid} yok`);
      continue;
    }
    const y = (
      await q(
        `SELECT kimden, konu, ozet, zaman FROM gelen_eposta WHERE firma_id = $1 AND tur = 'yanit' ORDER BY zaman DESC LIMIT 1`,
        [hid]
      )
    )[0];
    const kisi = kimdenAyir(y?.kimden ?? h.eposta);
    const alan = h.anahtar?.split("|")[0] || alanAdi(h.web);
    const f = await firmaBulAc({
      ad: h.firma,
      alan,
      web: h.web,
      ulke: h.ulke,
      sektor: h.segmentler,
      hedefId: h.id,
      kisiEposta: kisi.eposta,
    });
    const kisiId = await kisiBulAc(f.id, kisi);
    const gun = y ? new Date(y.zaman).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }) : null;
    await q(
      `INSERT INTO crm_temas (firma_id, kisi_id, tarih, talep, takip, kanal, son_temas, notlar, kaynak, olusturan)
       VALUES ($1, $2, $3, $4, 'yeni', 'tanitim_maili', $3, $5, $6, 'aktarim')`,
      [f.id, kisiId, gun, y ? [y.konu, y.ozet].filter(Boolean).join(" — ").slice(0, 2000) : null, "Tanıtım mailine yanıt; satışa iletildi.", kaynak]
    );
    sayac.temasYeni++;
    console.log(`  ${f.yeni ? "+" : "="} hedef ${hid} ${h.firma} · ${h.ulke ?? "ülke yok"} · ${kisi.eposta ?? "e-posta yok"}`);
  }

  if (YAZ) {
    await q(`INSERT INTO crm_kayit (kullanici, olay, hedef, ayrinti) VALUES ('betik', 'panel_aktar', 'panel', $1)`, [
      JSON.stringify(sayac),
    ]);
    await db.query("COMMIT");
  } else {
    await db.query("ROLLBACK");
  }
  console.log(
    `\nFirma: ${sayac.firmaYeni} yeni, ${sayac.firmaMevcut} mevcut · Kişi: ${sayac.kisiYeni} yeni · ` +
      `Görüşme: ${sayac.temasYeni} yeni, ${sayac.atlanan} daha önce aktarılmış`
  );
  console.log(YAZ ? "Yazıldı." : "Kuru çalıştırma — hiçbir şey yazılmadı. Yazmak için --yaz.");
} catch (e) {
  await db.query("ROLLBACK").catch(() => {});
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await db.end();
}

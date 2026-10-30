import "server-only";
import type { PoolClient } from "pg";
import { db } from "@/lib/db";
import { kayitEkle } from "@/lib/panel-kayit";

/**
 * Panel → CRM bağı: satışa iletilen iş CRM'e "Yeni talep" olarak düşer.
 *
 * CRM ayrı uygulama (crm/), veritabanı aynı. Burada yalnız `crm_` tablolarına
 * yazılır, CRM'in kodu içe alınmaz — sitenin derlemesi crm/'yi dışarıda
 * tutuyor. Eşleştirme kuralları crm/scripts/panel-aktar.mjs ile AYNI (o betik
 * geçmişi bir kez aktarmak için); biri değişirse öteki de değişmeli.
 *
 * Tetik: elle gönderilen e-postanın alıcıları arasında satış adresi varsa
 * (posta-gonder.ts). İki iş tanınır:
 *   - talep iletiliyor (talep numarası formdan / Claude'un ucundan gelir);
 *   - tanıtım mailine gelen yanıt iletiliyor (iletilen iletinin kimliği ya da
 *     göndereni hedef firmayla eşleşirse).
 * Başka her şey (iç yazışma, eşleşmeyen ileti) CRM'e yazılmaz.
 *
 * CRM yazılamazsa e-posta yine gitmiş sayılır; hata panel kaydına düşer.
 */

export const SATIS_ADRESLERI = ["info@servosteel.com.tr", "yavuz@servosteel.com.tr", "agil@servosteel.com.tr"];

export type IletilenIleti = { mesajKimligi: string; kimden: string };

const UCRETSIZ =
  /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|aol|gmx|web|mail|yandex|ukr|wp|interia|o2|seznam|abv|libero|virgilio|orange|wanadoo|free|t-online|rambler|bk|inbox|list)\./;

/** Kurumsal e-postanın alan adı; ücretsiz posta servislerinde null. */
const epostaAlani = (e: string | null) => {
  const a = e?.split("@")[1]?.toLowerCase().trim();
  return a && !UCRETSIZ.test(a) ? a : null;
};

const webAlani = (web: string | null) => {
  try {
    return web ? new URL(web).hostname.toLowerCase().replace(/^www\./, "") : null;
  } catch {
    return null;
  }
};

/* Formdaki serbest ülke yazımı → CRM'in Türkçe adı. Bilinmeyen olduğu gibi kalır. */
const ULKE: Record<string, string> = {
  "south africa": "Güney Afrika", nigeria: "Nijerya", india: "Hindistan", chile: "Şili", ecuador: "Ekvador",
  polska: "Polonya", poland: "Polonya", romania: "Romanya", "côte d’ivoire": "Fildişi Sahili",
  "cote d'ivoire": "Fildişi Sahili", казахстан: "Kazakistan", kazakhstan: "Kazakistan", malaysia: "Malezya",
  kenya: "Kenya", mexico: "Meksika", méxico: "Meksika", egypt: "Mısır", türkiye: "Türkiye", turkey: "Türkiye",
};

function ulkeAdi(ham: string | null, dil: string | null): string | null {
  const t = (ham ?? "").trim();
  if (!t) return dil === "tr" ? "Türkiye" : null;
  const k = t.toLocaleLowerCase("tr");
  for (const [anahtar, ad] of Object.entries(ULKE)) if (k === anahtar || k.startsWith(`${anahtar} `)) return ad;
  return t;
}

/** Formun açıldığı adres: utm'siz yol, tanıtım mailinden mi, mailin gittiği firmanın alan adı. */
function sayfaCoz(sayfa: string | null) {
  try {
    const u = new URL(sayfa ?? "");
    return {
      yol: u.pathname,
      tanitim: u.searchParams.get("utm_source") === "outreach",
      utmAlan: u.searchParams.get("utm_content")?.toLowerCase() || null,
    };
  } catch {
    return { yol: null, tanitim: false, utmAlan: null };
  }
}

const bugun = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });

type Hedef = { id: number; firma: string; ulke: string | null; web: string | null; segmentler: string | null; gonderildi: Date | null; anahtar: string | null };

async function hedefBul(b: PoolClient, alan: string | null): Promise<Hedef | null> {
  if (!alan) return null;
  const r = await b.query<Hedef>(
    `SELECT id, firma, ulke, web, segmentler, gonderildi, anahtar FROM hedef_firmalar
      WHERE split_part(anahtar, '|', 1) = $1 OR lower(split_part(eposta, '@', 2)) = $1
      ORDER BY gonderildi NULLS LAST LIMIT 1`,
    [alan]
  );
  return r.rows[0] ?? null;
}

/** CRM firması: alan adı, ad, hedef bağı ya da aynı e-postalı kişi; yoksa açılır. */
async function firmaBulAc(
  b: PoolClient,
  f: { ad: string; alan: string | null; web: string | null; ulke: string | null; sektor: string | null; hedefId: number | null; kisiEposta: string | null }
): Promise<{ id: number; yeni: boolean }> {
  let id =
    (
      await b.query<{ id: number }>(
        `SELECT id FROM crm_firma
          WHERE ($1::text IS NOT NULL AND alan_adi = $1) OR lower(ad) = lower($2)
             OR ($3::int IS NOT NULL AND hedef_firma_id = $3)
          ORDER BY (alan_adi = $1) DESC NULLS LAST, id LIMIT 1`,
        [f.alan, f.ad, f.hedefId]
      )
    ).rows[0]?.id ?? null;
  if (!id && f.kisiEposta) {
    id =
      (await b.query<{ id: number }>(`SELECT firma_id AS id FROM crm_kisi WHERE lower(eposta) = $1 LIMIT 1`, [f.kisiEposta]))
        .rows[0]?.id ?? null;
  }
  if (id) {
    /* Boş alanlar dolar; adı bilinmeden açılmış firma gerçek adını alır. */
    await b.query(
      `UPDATE crm_firma SET web = COALESCE(web, $2), alan_adi = COALESCE(alan_adi, $3), ulke = COALESCE(ulke, $4),
              sektor = COALESCE(sektor, $5), hedef_firma_id = COALESCE(hedef_firma_id, $6),
              ad = CASE WHEN ad LIKE '%(firma bilinmiyor)' AND $7 NOT LIKE '%(firma bilinmiyor)' THEN $7 ELSE ad END,
              guncellendi = now()
        WHERE id = $1`,
      [id, f.web, f.alan, f.ulke, f.sektor, f.hedefId, f.ad]
    );
    return { id, yeni: false };
  }
  const r = await b.query<{ id: number }>(
    `INSERT INTO crm_firma (ad, web, alan_adi, ulke, sektor, potansiyel, hedef_firma_id, olusturan)
     VALUES ($1, $2, $3, $4, $5, 'var', $6, 'panel') RETURNING id`,
    [f.ad, f.web, f.alan, f.ulke, f.sektor, f.hedefId]
  );
  return { id: r.rows[0].id, yeni: true };
}

async function kisiBulAc(b: PoolClient, firmaId: number, k: { ad: string | null; eposta: string | null; telefon: string | null }) {
  if (!k.ad && !k.eposta) return null;
  const var_ = k.eposta
    ? (await b.query<{ id: number }>(`SELECT id FROM crm_kisi WHERE firma_id = $1 AND lower(eposta) = $2`, [firmaId, k.eposta])).rows[0]
    : (await b.query<{ id: number }>(`SELECT id FROM crm_kisi WHERE firma_id = $1 AND lower(ad) = lower($2)`, [firmaId, k.ad])).rows[0];
  if (var_) {
    if (k.telefon) await b.query(`UPDATE crm_kisi SET telefon = COALESCE(telefon, $2) WHERE id = $1`, [var_.id, k.telefon]);
    return var_.id;
  }
  return (
    await b.query<{ id: number }>(
      `INSERT INTO crm_kisi (firma_id, ad, eposta, telefon, olusturan) VALUES ($1, $2, $3, $4, 'panel') RETURNING id`,
      [firmaId, k.ad || k.eposta, k.eposta, k.telefon]
    )
  ).rows[0].id;
}

/** Talebi CRM'e aktarır. Zaten aktarılmışsa null. */
async function talepAktar(b: PoolClient, talepId: number): Promise<{ firma: string; yeni: boolean } | null> {
  const kaynak = `talep:${talepId}`;
  if ((await b.query(`SELECT 1 FROM crm_temas WHERE kaynak = $1`, [kaynak])).rowCount) return null;
  const t = (
    await b.query<{
      olusturuldu: Date; dil: string | null; ad: string | null; eposta: string | null; firma: string | null;
      telefon: string | null; ulke: string | null; mesaj: string | null; sayfa: string | null; kaynak: string | null;
    }>(`SELECT olusturuldu, dil, ad, eposta, firma, telefon, ulke, mesaj, sayfa, kaynak FROM talepler WHERE id = $1`, [talepId])
  ).rows[0];
  if (!t) return null;

  const s = sayfaCoz(t.sayfa);
  const eposta = t.eposta?.trim().toLowerCase() || null;
  const alan = epostaAlani(eposta) ?? s.utmAlan;
  const hedef = (await hedefBul(b, epostaAlani(eposta))) ?? (await hedefBul(b, s.utmAlan));
  /* Tanıtım maili: bağlantıdan geldiyse ya da firmaya mail talepten ÖNCE gittiyse. */
  const kanal =
    s.tanitim || (hedef?.gonderildi && new Date(hedef.gonderildi) < new Date(t.olusturuldu))
      ? "tanitim_maili"
      : t.kaynak === "form"
        ? "site_formu"
        : "diger";
  const ad = hedef?.firma ?? (t.firma?.trim() || alan || `${t.ad?.trim() || eposta || `Talep #${talepId}`} (firma bilinmiyor)`);
  const f = await firmaBulAc(b, {
    ad,
    alan: alan ?? webAlani(hedef?.web ?? null),
    web: hedef?.web ?? (alan ? `https://${alan}/` : null),
    ulke: hedef?.ulke ?? ulkeAdi(t.ulke, t.dil),
    sektor: hedef?.segmentler ?? null,
    hedefId: hedef?.id ?? null,
    kisiEposta: eposta,
  });
  const kisiId = await kisiBulAc(b, f.id, { ad: t.ad?.trim() || null, eposta, telefon: t.telefon?.trim() || null });
  await b.query(
    `INSERT INTO crm_temas (firma_id, kisi_id, tarih, talep, takip, kanal, son_temas, notlar, kaynak, olusturan)
     VALUES ($1, $2, $3, $4, 'yeni', $5, $6, $7, $8, 'panel')`,
    [
      f.id,
      kisiId,
      new Date(t.olusturuldu).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }),
      t.mesaj?.trim() || null,
      kanal,
      bugun(),
      `Panel talebi #${talepId}${s.yol ? ` · ${s.yol}` : ""}`,
      kaynak,
    ]
  );
  return { firma: ad, yeni: f.yeni };
}

/**
 * İletilen ileti tanıtım mailine gelmiş bir yanıtsa hedef firmayı CRM'e
 * aktarır ve firmaya "satışa iletildi" notu düşer. Eşleşme yoksa null.
 */
async function yanitAktar(
  b: PoolClient,
  ileti: IletilenIleti,
  not: string,
  kim: string
): Promise<{ firma: string; yeni: boolean } | null | "var"> {
  const kimlik = ileti.mesajKimligi.replace(/^[<\s]+|[>\s]+$/g, "").toLowerCase();
  const kimden = ileti.kimden.trim().toLowerCase();
  const gelen = kimlik
    ? (
        await b.query<{ firma_id: number | null; kimden: string; konu: string | null; ozet: string | null; zaman: Date }>(
          `SELECT firma_id, kimden, konu, ozet, zaman FROM gelen_eposta
            WHERE lower(btrim(mesaj_kimligi, '<> ')) = $1 ORDER BY zaman DESC LIMIT 1`,
          [kimlik]
        )
      ).rows[0]
    : undefined;
  /* Önce iletinin kendisi (tarayıcının kaydettiği yanıt), sonra gönderenin
     adresi, en son kurumsal alan adı: yanıt çoğu zaman mailin gittiği
     adresten değil, aynı firmadaki birinden gelir. */
  const hedefId =
    gelen?.firma_id ??
    (kimden
      ? ((await b.query<{ id: number }>(`SELECT id FROM hedef_firmalar WHERE lower(eposta) = $1 ORDER BY id LIMIT 1`, [kimden])).rows[0]
          ?.id ?? null)
      : null) ??
    (await hedefBul(b, epostaAlani(kimden)))?.id ??
    null;
  if (!hedefId) return null;

  /* Panelin satışa iletilmiş yanıtları da tanıması için firmaya not (panel-aktar.mjs bunu arar). */
  await b.query(`INSERT INTO hedef_not (firma_id, yazan, govde) VALUES ($1, $2, $3)`, [hedefId, kim.slice(0, 80), not.slice(0, 4000)]);

  const kaynak = `hedef:${hedefId}`;
  if ((await b.query(`SELECT 1 FROM crm_temas WHERE kaynak = $1`, [kaynak])).rowCount) return "var";
  const h = (await b.query<Hedef>(`SELECT id, firma, ulke, web, segmentler, gonderildi, anahtar FROM hedef_firmalar WHERE id = $1`, [hedefId]))
    .rows[0];
  if (!h) return null;
  const kisiEposta = (gelen?.kimden || kimden || "").toLowerCase() || null;
  const f = await firmaBulAc(b, {
    ad: h.firma,
    alan: h.anahtar?.split("|")[0] || webAlani(h.web),
    web: h.web,
    ulke: h.ulke,
    sektor: h.segmentler,
    hedefId: h.id,
    kisiEposta,
  });
  const kisiId = await kisiBulAc(b, f.id, { ad: null, eposta: kisiEposta, telefon: null });
  const gun = gelen ? new Date(gelen.zaman).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }) : bugun();
  await b.query(
    `INSERT INTO crm_temas (firma_id, kisi_id, tarih, talep, takip, kanal, son_temas, notlar, kaynak, olusturan)
     VALUES ($1, $2, $3, $4, 'yeni', 'tanitim_maili', $5, 'Tanıtım mailine yanıt; satışa iletildi.', $6, 'panel')`,
    [f.id, kisiId, gun, gelen ? [gelen.konu, gelen.ozet].filter(Boolean).join(" — ").slice(0, 2000) : null, bugun(), kaynak]
  );
  return { firma: h.firma, yeni: f.yeni };
}

/**
 * Gönderim sonrası: satışa gidiyorsa CRM'e aktarır. Dönen metin gönderim
 * mesajının sonuna eklenir; iş yoksa null. Hata fırlatmaz.
 */
export async function satisaIletildi(g: {
  kim: string;
  kutu: string;
  alicilar: string[];
  talepId?: number;
  iletilenIleti?: IletilenIleti;
}): Promise<string | null> {
  if (!g.alicilar.some((a) => SATIS_ADRESLERI.includes(a.toLowerCase()))) return null;
  if (!(g.talepId && g.talepId > 0) && !g.iletilenIleti) return null;
  const havuz = db();
  if (!havuz) return null;

  const b = await havuz.connect();
  try {
    await b.query("BEGIN");
    const not = `Satışa iletildi: ${g.alicilar.join(", ")} — ${g.kutu} kutusundan (${g.kim})`;
    const sonuc =
      g.talepId && g.talepId > 0 ? await talepAktar(b, g.talepId) : await yanitAktar(b, g.iletilenIleti!, not, g.kim);
    await b.query("COMMIT");
    if (sonuc === null) return g.talepId ? "CRM'de bu talep zaten vardı." : null;
    if (sonuc === "var") return "CRM'de bu firmanın talebi zaten vardı.";
    const hedef = g.talepId ? `talep:${g.talepId}` : sonuc.firma;
    await kayitEkle(g.kim, "crm_aktar", hedef, `${sonuc.firma} — CRM'e yeni talep${sonuc.yeni ? " (yeni firma)" : ""}`).catch(() => {});
    return `CRM'e yeni talep olarak düştü: ${sonuc.firma}.`;
  } catch (e) {
    await b.query("ROLLBACK").catch(() => {});
    const mesaj = (e as Error).message;
    console.error("[crm-bag]", mesaj);
    await kayitEkle(g.kim, "crm_aktar_hata", g.talepId ? `talep:${g.talepId}` : g.kutu, mesaj.slice(0, 280)).catch(() => {});
    return "CRM'e yazılamadı (e-posta gitti); hata Kayıtlar'da.";
  } finally {
    b.release();
  }
}

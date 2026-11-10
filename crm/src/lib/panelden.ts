import { alanAdi } from "./bicim";
import { islem, sorgu } from "./db";
import type { Kullanici } from "./oturum";
import { bolgesi } from "./ulkeler";

/**
 * Sitenin panelindeki tanıtım listesinden CRM'e geçiş.
 *
 * Satışa iletilen talep ve yanıtlar CRM'e zaten kendiliğinden yazılıyor
 * (sitenin `crm-bag.ts`'i). Ama iletilmeden kalan yanıtlar (nötr ya da
 * olumlu dönüp panelde unutulan) satışın önüne hiç düşmüyordu. Bu modül
 * yanıt veren her firmayı listeler ve tek tıkla CRM'e alır.
 *
 * CRM'e alma `crm/scripts/panel-aktar.mjs` ile aynı kaynak anahtarını
 * kullanır (`hedef:<id>`): aynı yanıt iki kez görüşme olarak açılmaz.
 */

export type YanitVeren = {
  id: number;
  firma: string;
  ulke: string;
  web: string;
  durum: string;
  segment: string;
  kimden: string | null;
  konu: string | null;
  ozet: string | null;
  /** son yanıtın zamanı (ISO) */
  zaman: string | null;
  adet: number;
  crmId: number | null;
  sonNot: string | null;
  ilkMail: string | null;
};

export async function yanitVerenler(): Promise<YanitVeren[]> {
  return sorgu<YanitVeren>(
    `WITH y AS (
       SELECT DISTINCT ON (firma_id) firma_id, kimden, konu, ozet, coalesce(zaman, islendi) AS zaman
         FROM gelen_eposta
        WHERE tur = 'yanit' AND firma_id IS NOT NULL
        ORDER BY firma_id, coalesce(zaman, islendi) DESC
     ), s AS (
       SELECT firma_id, count(*)::int AS adet FROM gelen_eposta
        WHERE tur = 'yanit' AND firma_id IS NOT NULL GROUP BY firma_id
     )
     SELECT h.id, h.firma, trim(h.ulke) AS ulke, h.web, h.durum, h.segmentler AS segment,
            y.kimden, y.konu, y.ozet,
            to_char(y.zaman AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS zaman,
            coalesce(s.adet, 0) AS adet,
            (SELECT min(c.id) FROM crm_firma c WHERE c.hedef_firma_id = h.id) AS "crmId",
            (SELECT n.govde FROM hedef_not n WHERE n.firma_id = h.id ORDER BY n.olusturuldu DESC LIMIT 1) AS "sonNot",
            (SELECT to_char(min(g.zaman) AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM-DD') FROM hedef_gonderim g
              WHERE g.firma_id = h.id AND g.sonuc IN ('ok', 'belirsiz')) AS "ilkMail"
       FROM hedef_firmalar h
       LEFT JOIN y ON y.firma_id = h.id
       LEFT JOIN s ON s.firma_id = h.id
      WHERE h.durum IN ('olumlu', 'yanit', 'red') OR y.firma_id IS NOT NULL
      ORDER BY coalesce(y.zaman, h.guncellendi) DESC`,
  );
}

/**
 * Satışın bakması gereken yanıt: CRM'de değil ve panelde olumlu ya da "yanıt" duruşunda.
 * "Alındı" ve otomatik yanıtlar panelde "Mail gitti"ye geri çekiliyor; onlar sayılmaz.
 */
export const bekleyenYanit = (y: Pick<YanitVeren, "crmId" | "durum">) =>
  !y.crmId && (y.durum === "olumlu" || y.durum === "yanit");

/** "Ad Soyad <adres@x>" → { ad, eposta } */
function kimdenAyir(kimden: string | null): { ad: string | null; eposta: string | null } {
  const m = String(kimden ?? "").match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { ad: m[1].trim() || null, eposta: m[2].trim().toLowerCase() };
  const e = String(kimden ?? "").trim().toLowerCase();
  return { ad: null, eposta: e.includes("@") ? e : null };
}

/**
 * Panel firmasını CRM'e alır (varsa bağlar) ve CRM firmasının kimliğini döner.
 * Açılanlar: firma (sorumlusu işlemi yapan), yanıt verdiyse kişi, "Yeni talep"
 * görüşmesi (kanal tanıtım maili) ve ertesi güne "Yanıta dön" görevi.
 */
export async function crmeAl(hedefId: number, ben: Kullanici): Promise<number> {
  return islem(async (b) => {
    const h = (
      await b.query<{
        id: number;
        firma: string;
        ulke: string;
        web: string;
        eposta: string;
        segmentler: string;
        anahtar: string;
        urun: string;
        durum: string;
      }>(`SELECT id, firma, trim(ulke) AS ulke, web, eposta, segmentler, anahtar, urun, durum FROM hedef_firmalar WHERE id = $1`, [
        hedefId,
      ])
    ).rows[0];
    if (!h) throw new Error("Panelde bu firma yok.");

    const alan = h.anahtar?.split("|")[0] || alanAdi(h.web);
    let firmaId =
      (
        await b.query<{ id: number }>(
          `SELECT id FROM crm_firma
            WHERE hedef_firma_id = $1 OR ($2::text IS NOT NULL AND alan_adi = $2) OR lower(ad) = lower($3)
            ORDER BY (hedef_firma_id = $1) DESC, id LIMIT 1`,
          [h.id, alan, h.firma],
        )
      ).rows[0]?.id ?? null;
    if (firmaId) {
      await b.query(`UPDATE crm_firma SET hedef_firma_id = COALESCE(hedef_firma_id, $2), guncellendi = now() WHERE id = $1`, [
        firmaId,
        h.id,
      ]);
    } else {
      firmaId = (
        await b.query<{ id: number }>(
          `INSERT INTO crm_firma (ad, web, alan_adi, ulke, bolge, sektor, faaliyet, potansiyel, hedef_firma_id, sorumlu, olusturan)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) RETURNING id`,
          [
            h.firma,
            h.web || null,
            alan,
            h.ulke || null,
            bolgesi(h.ulke),
            h.segmentler || null,
            h.urun?.slice(0, 1000) || null,
            h.durum === "olumlu" ? "yuksek" : h.durum === "red" ? "yok" : "var",
            h.id,
            ben.kullanici,
          ],
        )
      ).rows[0].id;
    }

    const y = (
      await b.query<{ kimden: string; konu: string; ozet: string; zaman: Date }>(
        `SELECT kimden, konu, ozet, coalesce(zaman, islendi) AS zaman FROM gelen_eposta
          WHERE firma_id = $1 AND tur = 'yanit' ORDER BY coalesce(zaman, islendi) DESC LIMIT 1`,
        [h.id],
      )
    ).rows[0];
    const kisi = kimdenAyir(y?.kimden ?? h.eposta);
    let kisiId: number | null = null;
    if (kisi.eposta) {
      kisiId =
        (await b.query<{ id: number }>(`SELECT id FROM crm_kisi WHERE firma_id = $1 AND lower(eposta) = $2`, [firmaId, kisi.eposta]))
          .rows[0]?.id ?? null;
      kisiId ??= (
        await b.query<{ id: number }>(
          `INSERT INTO crm_kisi (firma_id, ad, eposta, olusturan) VALUES ($1, $2, $3, $4) RETURNING id`,
          [firmaId, kisi.ad || kisi.eposta, kisi.eposta, ben.kullanici],
        )
      ).rows[0].id;
    }

    const gun = y ? new Date(y.zaman).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }) : null;
    const temas = (
      await b.query<{ id: number }>(
        `INSERT INTO crm_temas (firma_id, kisi_id, tarih, talep, takip, kanal, son_temas, notlar, kaynak, olusturan)
         VALUES ($1, $2, $3, $4, $5, 'tanitim_maili', $3, $6, $7, $8)
         ON CONFLICT (kaynak) DO NOTHING RETURNING id`,
        [
          firmaId,
          kisiId,
          gun,
          y ? [y.konu, y.ozet].filter(Boolean).join(" — ").slice(0, 2000) : null,
          h.durum === "red" ? "olumsuz" : "yeni",
          y ? "Tanıtım mailine yanıt; panelden CRM'e alındı." : "Tanıtım maili gönderilen firma; panelden CRM'e alındı.",
          `hedef:${h.id}`,
          ben.kullanici,
        ],
      )
    ).rows[0];

    if (h.durum !== "red") {
      await b.query(
        `INSERT INTO crm_gorev (baslik, firma_id, temas_id, atanan, son_tarih, kaynak, olusturan)
         VALUES ($1, $2, $3, $4, (now() AT TIME ZONE 'Europe/Istanbul')::date + 1, $5, $4)
         ON CONFLICT (kaynak) WHERE durum = 'acik' AND kaynak IS NOT NULL DO NOTHING`,
        [y ? "Tanıtım mailine verilen yanıta dön" : "Tanıtım maili gönderilen firmayı ara", firmaId, temas?.id ?? null, ben.kullanici, `panel:${h.id}`],
      );
    }
    await b.query(`INSERT INTO crm_kayit (kullanici, olay, hedef, ayrinti) VALUES ($1, 'crme_al', $2, $3)`, [
      ben.kullanici,
      `firma:${firmaId}`,
      `panel ${h.id} ${h.firma}`,
    ]);
    return firmaId;
  });
}

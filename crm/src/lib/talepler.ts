import type { PoolClient } from "pg";
import { alanAdi, epostaAlanAdi } from "./bicim";
import { islem, sorgu, tek } from "./db";
import { TURKCE_AD } from "./dunya-ulkeleri";
import type { Kullanici } from "./oturum";
import { bolgesi } from "./ulkeler";

/**
 * Sitenin iletişim/teklif formundan gelen talepler (`talepler`, sitenin tablosu).
 *
 * Satışa iletilen talep CRM'e kendiliğinden yazılıyor (sitenin `crm-bag.ts`'i);
 * iletilmeden kalan talep satışın önüne düşmüyordu. Bu modül talepleri
 * listeler ve tek tıkla CRM'e alır. Eşleştirme `crm/scripts/panel-aktar.mjs`
 * ile aynı: kaynak anahtarı `talep:<id>`, firma alan adı / ad / tanıtım
 * listesindeki kaydıyla bulunur.
 */

export type GelenTalep = {
  id: number;
  /** ISO */
  zaman: string;
  tur: string;
  dil: string;
  ad: string;
  eposta: string;
  firma: string;
  telefon: string;
  ulke: string;
  mesaj: string;
  sayfa: string;
  durum: string;
  crmId: number | null;
};

export async function gelenTalepler(): Promise<GelenTalep[]> {
  return sorgu<GelenTalep>(
    `SELECT tl.id, to_char(tl.olusturuldu AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS zaman,
            tl.tur, tl.dil, tl.ad, tl.eposta, tl.firma, tl.telefon, tl.ulke, tl.mesaj, tl.sayfa, tl.durum,
            (SELECT t.firma_id FROM crm_temas t WHERE t.kaynak = 'talep:' || tl.id LIMIT 1) AS "crmId"
       FROM talepler tl
      WHERE tl.durum <> 'spam'
      ORDER BY tl.olusturuldu DESC`,
  );
}

export const bekleyenTalep = (t: Pick<GelenTalep, "crmId">) => !t.crmId;

/* Formdaki serbest ülke yazımı → CRM'in Türkçe adı. Harita tablosunun İngilizce
   adları + sık yazımlar; bilinmeyen olduğu gibi kalır. */
const ULKE_ESI: Record<string, string> = Object.fromEntries([
  ...Object.entries(TURKCE_AD).map(([en, tr]) => [en.toLowerCase(), tr]),
  ...Object.values(TURKCE_AD).map((tr) => [tr.toLocaleLowerCase("tr"), tr]),
  ["uae", "BAE"],
  ["u.a.e.", "BAE"],
  ["usa", "ABD"],
  ["us", "ABD"],
  ["united states", "ABD"],
  ["uk", "Birleşik Krallık"],
  ["england", "Birleşik Krallık"],
  ["great britain", "Birleşik Krallık"],
  ["turkey", "Türkiye"],
  ["türkiye", "Türkiye"],
  ["polska", "Polonya"],
  ["méxico", "Meksika"],
  ["czech republic", "Çekya"],
  ["korea", "Güney Kore"],
  ["republic of korea", "Güney Kore"],
  ["russian federation", "Rusya"],
  ["казахстан", "Kazakistan"],
  ["ivory coast", "Fildişi Sahili"],
  ["cote d'ivoire", "Fildişi Sahili"],
  ["côte d’ivoire", "Fildişi Sahili"],
  ["bosnia and herzegovina", "Bosna-Hersek"],
  ["north macedonia", "Kuzey Makedonya"],
  ["dominican republic", "Dominik Cumhuriyeti"],
  ["democratic republic of the congo", "Kongo DC"],
  ["deutschland", "Almanya"],
  ["españa", "İspanya"],
  ["italia", "İtalya"],
  ["brasil", "Brezilya"],
]);

export function ulkeTurkce(ham: string | null, dil: string | null): string | null {
  const t = String(ham ?? "").trim();
  if (!t) return dil === "tr" ? "Türkiye" : null;
  return ULKE_ESI[t.toLowerCase()] ?? ULKE_ESI[t.toLocaleLowerCase("tr")] ?? t;
}

/** Sayfa adresinden yol ve tanıtım mailindeki firma alan adı (utm). */
function sayfaCoz(sayfa: string): { yol: string | null; tanitim: boolean; utmAlan: string | null } {
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

/* Panelin talep durumu → görüşmenin takip durumu (panel-aktar.mjs ile aynı). */
const TALEP_TAKIP: Record<string, string> = {
  yeni: "yeni",
  iletildi: "yeni",
  ulasildi: "gorusuldu",
  bilgi_verildi: "gorusuldu",
  teklif_gonderildi: "teklif_gonderildi",
  kazanildi: "teklif_gonderildi",
  kaybedildi: "olumsuz",
};

async function hedefBul(b: PoolClient, alan: string | null) {
  if (!alan) return null;
  return (
    (
      await b.query<{ id: number; firma: string; ulke: string; web: string; segmentler: string; gonderildi: Date | null }>(
        `SELECT id, firma, trim(ulke) AS ulke, web, segmentler, gonderildi FROM hedef_firmalar
          WHERE split_part(anahtar, '|', 1) = $1 OR lower(split_part(eposta, '@', 2)) = $1
          ORDER BY gonderildi NULLS LAST LIMIT 1`,
        [alan],
      )
    ).rows[0] ?? null
  );
}

/**
 * Talebi CRM'e alır ve CRM firmasının kimliğini döner. Açılanlar: firma (yoksa;
 * sorumlusu işlemi yapan), formu dolduran kişi, talebin görüşmesi ve ertesi
 * güne "Site talebine dön" görevi. Talep zaten CRM'deyse aynı firmayı döner.
 */
export async function talebiCrmeAl(talepId: number, ben: Kullanici): Promise<number> {
  return islem(async (b) => {
    const t = (
      await b.query<{
        id: number;
        olusturuldu: Date;
        guncellendi: Date;
        tur: string;
        dil: string;
        ad: string;
        eposta: string;
        firma: string;
        telefon: string;
        ulke: string;
        mesaj: string;
        sayfa: string;
        kaynak: string;
        durum: string;
      }>(
        `SELECT id, olusturuldu, guncellendi, tur, dil, ad, eposta, firma, telefon, ulke, mesaj, sayfa, kaynak, durum
           FROM talepler WHERE id = $1`,
        [talepId],
      )
    ).rows[0];
    if (!t) throw new Error("Panelde bu talep yok.");
    const kaynak = `talep:${t.id}`;
    const var_ = (await b.query<{ firma_id: number }>(`SELECT firma_id FROM crm_temas WHERE kaynak = $1`, [kaynak])).rows[0];
    if (var_) return var_.firma_id;

    const s = sayfaCoz(t.sayfa);
    const eposta = t.eposta?.trim().toLowerCase() || null;
    const epostaAlani = epostaAlanAdi(eposta);
    const alan = epostaAlani ?? s.utmAlan;
    const hedef = (await hedefBul(b, epostaAlani)) ?? (await hedefBul(b, s.utmAlan));
    const kanal =
      s.tanitim || (hedef?.gonderildi && new Date(hedef.gonderildi) < new Date(t.olusturuldu))
        ? "tanitim_maili"
        : t.kaynak === "form"
          ? "site_formu"
          : "diger";
    const ulke = hedef?.ulke || ulkeTurkce(t.ulke, t.dil);
    const ad = hedef?.firma ?? (t.firma?.trim() || alan || `${t.ad?.trim() || eposta || "Talep"} (firma bilinmiyor)`);
    const firmaAlan = alan ?? alanAdi(hedef?.web ?? null);

    /* Firma: tanıtım kaydı, alan adı, ad ya da aynı e-postalı kişi. */
    let firmaId =
      (
        await b.query<{ id: number }>(
          `SELECT id FROM crm_firma
            WHERE ($1::int IS NOT NULL AND hedef_firma_id = $1) OR ($2::text IS NOT NULL AND alan_adi = $2) OR lower(ad) = lower($3)
            ORDER BY ($1::int IS NOT NULL AND hedef_firma_id = $1) DESC, id LIMIT 1`,
          [hedef?.id ?? null, firmaAlan, ad],
        )
      ).rows[0]?.id ?? null;
    if (!firmaId && eposta)
      firmaId =
        (await b.query<{ firma_id: number }>(`SELECT firma_id FROM crm_kisi WHERE lower(eposta) = $1 LIMIT 1`, [eposta])).rows[0]
          ?.firma_id ?? null;
    if (firmaId) {
      await b.query(
        `UPDATE crm_firma SET hedef_firma_id = COALESCE(hedef_firma_id, $2), ulke = COALESCE(ulke, $3), bolge = COALESCE(bolge, $4),
                guncellendi = now() WHERE id = $1`,
        [firmaId, hedef?.id ?? null, ulke, bolgesi(ulke)],
      );
    } else {
      firmaId = (
        await b.query<{ id: number }>(
          `INSERT INTO crm_firma (ad, web, alan_adi, ulke, bolge, sektor, potansiyel, hedef_firma_id, sorumlu, olusturan)
           VALUES ($1, $2, $3, $4, $5, $6, 'var', $7, $8, $8) RETURNING id`,
          [
            ad,
            hedef?.web || (firmaAlan ? `https://${firmaAlan}/` : null),
            firmaAlan,
            ulke,
            bolgesi(ulke),
            hedef?.segmentler || null,
            hedef?.id ?? null,
            ben.kullanici,
          ],
        )
      ).rows[0].id;
    }

    /* Kişi */
    let kisiId: number | null = null;
    const kisiAd = t.ad?.trim() || null;
    if (kisiAd || eposta) {
      kisiId =
        (
          eposta
            ? await b.query<{ id: number }>(`SELECT id FROM crm_kisi WHERE firma_id = $1 AND lower(eposta) = $2`, [firmaId, eposta])
            : await b.query<{ id: number }>(`SELECT id FROM crm_kisi WHERE firma_id = $1 AND lower(ad) = lower($2)`, [firmaId, kisiAd])
        ).rows[0]?.id ?? null;
      if (kisiId) {
        if (t.telefon?.trim())
          await b.query(`UPDATE crm_kisi SET telefon = COALESCE(telefon, $2) WHERE id = $1`, [kisiId, t.telefon.trim()]);
      } else {
        kisiId = (
          await b.query<{ id: number }>(
            `INSERT INTO crm_kisi (firma_id, ad, eposta, telefon, olusturan) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [firmaId, kisiAd || eposta, eposta, t.telefon?.trim() || null, ben.kullanici],
          )
        ).rows[0].id;
      }
    }

    const gunu = (d: Date) => new Date(d).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
    const takip = TALEP_TAKIP[t.durum] ?? "yeni";
    const temas = (
      await b.query<{ id: number }>(
        `INSERT INTO crm_temas (firma_id, kisi_id, tarih, talep, takip, kanal, son_temas, notlar, kaynak, olusturan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (kaynak) DO NOTHING RETURNING id`,
        [
          firmaId,
          kisiId,
          gunu(t.olusturuldu),
          t.mesaj?.trim().slice(0, 4000) || null,
          takip,
          kanal,
          gunu(t.guncellendi ?? t.olusturuldu),
          `Site talebi #${t.id}${s.yol ? ` · ${s.yol}` : ""}; panelden CRM'e alındı.`,
          kaynak,
          ben.kullanici,
        ],
      )
    ).rows[0];
    if (takip !== "olumsuz" && takip !== "teklif_gonderildi") {
      await b.query(
        `INSERT INTO crm_gorev (baslik, firma_id, temas_id, atanan, son_tarih, kaynak, olusturan)
         VALUES ('Site talebine dön', $1, $2, $3, (now() AT TIME ZONE 'Europe/Istanbul')::date + 1, $4, $3)
         ON CONFLICT (kaynak) WHERE durum = 'acik' AND kaynak IS NOT NULL DO NOTHING`,
        [firmaId, temas?.id ?? null, ben.kullanici, kaynak],
      );
    }
    await b.query(`INSERT INTO crm_kayit (kullanici, olay, hedef, ayrinti) VALUES ($1, 'crme_al', $2, $3)`, [
      ben.kullanici,
      `firma:${firmaId}`,
      `talep ${t.id} ${ad}`,
    ]);
    return firmaId;
  });
}

/** Başlıktaki zil: benim geciken ve bugünkü görevlerim, CRM'e alınmayı bekleyen talep ve yanıtlar. */
export async function bildirimler(kullanici: string): Promise<{ geciken: number; bugun: number; gelen: number }> {
  const r = await tek<{ geciken: number; bugun: number; gelen: number }>(
    `SELECT
       (SELECT count(*) FROM crm_gorev WHERE durum = 'acik' AND atanan = $1
          AND son_tarih < (now() AT TIME ZONE 'Europe/Istanbul')::date)::int AS geciken,
       (SELECT count(*) FROM crm_gorev WHERE durum = 'acik' AND atanan = $1
          AND son_tarih = (now() AT TIME ZONE 'Europe/Istanbul')::date)::int AS bugun,
       ((SELECT count(*) FROM talepler tl WHERE tl.durum <> 'spam'
           AND NOT EXISTS (SELECT 1 FROM crm_temas t WHERE t.kaynak = 'talep:' || tl.id))
        + (SELECT count(*) FROM hedef_firmalar h WHERE h.durum IN ('olumlu', 'yanit')
           AND NOT EXISTS (SELECT 1 FROM crm_firma c WHERE c.hedef_firma_id = h.id)))::int AS gelen`,
    [kullanici],
  ).catch(() => null);
  return r ?? { geciken: 0, bugun: 0, gelen: 0 };
}

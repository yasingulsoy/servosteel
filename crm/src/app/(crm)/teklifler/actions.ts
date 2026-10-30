"use server";

import { redirect } from "next/navigation";
import type { PoolClient } from "pg";
import { gun, metin, sayi, tutar } from "@/lib/bicim";
import { islem, sorgu, tek } from "@/lib/db";
import { kayitEkle } from "@/lib/kayit";
import { type Kullanici, yazarZorunlu } from "@/lib/oturum";
import { DOVIZ, gecerli, RED_SEBEBI, TEKLIF_DURUMU } from "@/lib/sabitler";

const EN_BUYUK = 15 * 1024 * 1024;

/** Formdaki dosyayı kaydeder; dosya seçilmemişse null. */
async function dosyaKaydet(b: PoolClient, fd: FormData, firmaId: number, ben: Kullanici): Promise<number | null> {
  const f = fd.get("dosya");
  if (!(f instanceof File) || f.size === 0) return null;
  if (f.size > EN_BUYUK) throw new Error("Dosya 15 MB'tan büyük olamaz.");
  const ad = (f.name || "dosya").replace(/[\\/\r\n]/g, "_").slice(0, 200);
  const r = await b.query<{ id: number }>(
    `INSERT INTO crm_dosya (firma_id, ad, tur, boyut, icerik, yukleyen) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [firmaId, ad, f.type || "application/octet-stream", f.size, Buffer.from(await f.arrayBuffer()), ben.kullanici]
  );
  return r.rows[0].id;
}

/** Yönlendirme yalnız uygulama içi yola. */
function geriYolu(fd: FormData, varsayilan: string): string {
  const g = String(fd.get("geri") ?? "");
  return g.startsWith("/") && !g.startsWith("//") ? g : varsayilan;
}

/**
 * Teklif ekler ya da günceller. Bağlı görüşmenin takibi ve firmanın durumu
 * kendiliğinden ilerler: gönderildi → görüşme "teklif gönderildi",
 * kabul → firma "müşteri", red → görüşme "olumsuz".
 */
export async function teklifKaydet(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const teklifId = sayi(fd.get("teklif_id"));
  if (!firmaId) throw new Error("Firma yok.");
  const durum = gecerli(TEKLIF_DURUMU, fd.get("durum"), "gonderildi");
  const redSebebi = durum === "red" ? gecerli(RED_SEBEBI, fd.get("red_sebebi"), "diger") : null;
  const tarih =
    gun(fd, "tarih") ??
    new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }); /* sv-SE → YYYY-MM-DD */
  const temasAday = sayi(fd.get("temas_id"));

  await islem(async (b) => {
    const temasId = temasAday
      ? ((await b.query<{ id: number }>(`SELECT id FROM crm_temas WHERE id = $1 AND firma_id = $2`, [temasAday, firmaId]))
          .rows[0]?.id ?? null)
      : null;
    const dosyaId = await dosyaKaydet(b, fd, firmaId, ben);
    const d = [
      temasId,
      metin(fd, "teklif_no", 60),
      metin(fd, "konu", 300),
      tarih,
      gun(fd, "gecerlilik"),
      tutar(fd, "tutar"),
      gecerli(DOVIZ, fd.get("doviz"), "EUR"),
      durum,
      redSebebi,
      metin(fd, "notlar", 2000),
    ];
    if (teklifId) {
      await b.query(
        `UPDATE crm_teklif SET temas_id = $3, teklif_no = $4, konu = $5, tarih = $6, gecerlilik = $7, tutar = $8,
                doviz = $9, durum = $10, red_sebebi = $11, notlar = $12,
                dosya_id = COALESCE($13, dosya_id), guncellendi = now()
          WHERE id = $1 AND firma_id = $2`,
        [teklifId, firmaId, ...d, dosyaId]
      );
    } else {
      await b.query(
        `INSERT INTO crm_teklif (firma_id, temas_id, teklif_no, konu, tarih, gecerlilik, tutar, doviz, durum,
                                 red_sebebi, notlar, dosya_id, olusturan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [firmaId, ...d, dosyaId, ben.kullanici]
      );
    }
    if (temasId && durum === "gonderildi") {
      await b.query(
        `UPDATE crm_temas SET takip = 'teklif_gonderildi', son_temas = GREATEST(COALESCE(son_temas, $2::date), $2::date),
                guncellendi = now()
          WHERE id = $1 AND takip <> 'olumsuz'`,
        [temasId, tarih]
      );
    }
    if (temasId && durum === "red") {
      await b.query(`UPDATE crm_temas SET takip = 'olumsuz', guncellendi = now() WHERE id = $1`, [temasId]);
    }
    if (durum === "kabul") {
      await b.query(`UPDATE crm_firma SET durum = 'musteri' WHERE id = $1 AND durum IN ('aday', 'eski_musteri')`, [firmaId]);
    }
    await b.query(`UPDATE crm_firma SET guncellendi = now() WHERE id = $1`, [firmaId]);
  });

  await kayitEkle(ben, teklifId ? "teklif_guncelle" : "teklif_ekle", `firma #${firmaId}`, String(durum));
  redirect(geriYolu(fd, `/firmalar/${firmaId}`));
}

export async function teklifSil(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const teklifId = sayi(fd.get("teklif_id"));
  if (!firmaId || !teklifId) throw new Error("Teklif yok.");
  const r = await tek<{ teklif_no: string | null }>(
    `DELETE FROM crm_teklif WHERE id = $1 AND firma_id = $2 RETURNING teklif_no`,
    [teklifId, firmaId]
  );
  await kayitEkle(ben, "teklif_sil", `firma #${firmaId}`, r?.teklif_no ?? `#${teklifId}`);
  redirect(`/firmalar/${firmaId}`);
}

/** Teklife bağlı olmayan dosya (müşteri çizimi, katalog…). */
export async function dosyaYukle(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  if (!firmaId) throw new Error("Firma yok.");
  const id = await islem((b) => dosyaKaydet(b, fd, firmaId, ben));
  if (!id) throw new Error("Dosya seçilmedi.");
  await kayitEkle(ben, "dosya_yukle", `firma #${firmaId}`, `dosya #${id}`);
  redirect(`/firmalar/${firmaId}`);
}

export async function dosyaSil(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const dosyaId = sayi(fd.get("dosya_id"));
  if (!firmaId || !dosyaId) throw new Error("Dosya yok.");
  const r = await tek<{ ad: string }>(`DELETE FROM crm_dosya WHERE id = $1 AND firma_id = $2 RETURNING ad`, [
    dosyaId,
    firmaId,
  ]);
  await sorgu(`UPDATE crm_firma SET guncellendi = now() WHERE id = $1`, [firmaId]);
  await kayitEkle(ben, "dosya_sil", `firma #${firmaId}`, r?.ad ?? "");
  redirect(`/firmalar/${firmaId}`);
}

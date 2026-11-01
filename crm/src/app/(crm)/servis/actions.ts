"use server";

import { redirect } from "next/navigation";
import { gun, metin, sayi, tutar } from "@/lib/bicim";
import { islem, sorgu, tek } from "@/lib/db";
import { kayitEkle } from "@/lib/kayit";
import { yazarZorunlu } from "@/lib/oturum";
import { DOVIZ, gecerli, SERVIS_DURUMU, SERVIS_TURU, SIPARIS_DURUMU } from "@/lib/sabitler";

/* Satış sonrası: sipariş, kurulu makine, servis talebi. Hepsi firma kartından. */

const bugun = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });

function geriYolu(fd: FormData, varsayilan: string): string {
  const g = String(fd.get("geri") ?? "");
  return g.startsWith("/") && !g.startsWith("//") ? g : varsayilan;
}

export async function siparisKaydet(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const id = sayi(fd.get("siparis_id"));
  if (!firmaId) throw new Error("Firma yok.");
  const durum = gecerli(SIPARIS_DURUMU, fd.get("durum"), "uretimde");
  const d = [
    metin(fd, "siparis_no", 60),
    metin(fd, "konu", 300),
    gun(fd, "tarih") ?? bugun(),
    tutar(fd, "tutar"),
    gecerli(DOVIZ, fd.get("doviz"), "EUR"),
    gun(fd, "teslim_tarihi"),
    durum,
    metin(fd, "notlar", 2000),
  ];
  if (id) {
    await sorgu(
      `UPDATE crm_siparis SET siparis_no = $3, konu = $4, tarih = $5, tutar = $6, doviz = $7, teslim_tarihi = $8,
              durum = $9, notlar = $10, guncellendi = now()
        WHERE id = $1 AND firma_id = $2`,
      [id, firmaId, ...d]
    );
  } else {
    await sorgu(
      `INSERT INTO crm_siparis (firma_id, siparis_no, konu, tarih, tutar, doviz, teslim_tarihi, durum, notlar, olusturan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [firmaId, ...d, ben.kullanici]
    );
  }
  await sorgu(`UPDATE crm_firma SET durum = 'musteri', guncellendi = now() WHERE id = $1 AND durum IN ('aday', 'eski_musteri')`, [
    firmaId,
  ]);
  await kayitEkle(ben, id ? "siparis_guncelle" : "siparis_ekle", `firma #${firmaId}`, String(durum));
  redirect(`/firmalar/${firmaId}`);
}

/** Kabul edilen tekliften sipariş: konu, tutar, döviz tekliften gelir. */
export async function siparisTekliften(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const teklifId = sayi(fd.get("teklif_id"));
  if (!firmaId || !teklifId) throw new Error("Teklif yok.");
  await islem(async (b) => {
    const var_ = await b.query(`SELECT 1 FROM crm_siparis WHERE teklif_id = $1`, [teklifId]);
    if (var_.rowCount) return;
    await b.query(
      `INSERT INTO crm_siparis (firma_id, teklif_id, siparis_no, konu, tarih, tutar, doviz, olusturan)
       SELECT firma_id, id, teklif_no, konu, $3, tutar, doviz, $4 FROM crm_teklif WHERE id = $1 AND firma_id = $2`,
      [teklifId, firmaId, bugun(), ben.kullanici]
    );
    await b.query(`UPDATE crm_teklif SET durum = 'kabul', guncellendi = now() WHERE id = $1`, [teklifId]);
    await b.query(
      `UPDATE crm_gorev SET durum = 'tamam', tamamlandi = now(), tamamlayan = 'otomatik' WHERE kaynak = $1 AND durum = 'acik'`,
      [`teklif:${teklifId}`]
    );
    await b.query(`UPDATE crm_firma SET durum = 'musteri', guncellendi = now() WHERE id = $1 AND durum IN ('aday', 'eski_musteri')`, [
      firmaId,
    ]);
  });
  await kayitEkle(ben, "siparis_ekle", `firma #${firmaId}`, `teklif #${teklifId}`);
  redirect(`/firmalar/${firmaId}`);
}

export async function siparisSil(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const id = sayi(fd.get("siparis_id"));
  if (!firmaId || !id) throw new Error("Sipariş yok.");
  await sorgu(`DELETE FROM crm_siparis WHERE id = $1 AND firma_id = $2`, [id, firmaId]);
  await kayitEkle(ben, "siparis_sil", `firma #${firmaId}`, `sipariş #${id}`);
  redirect(`/firmalar/${firmaId}`);
}

export async function makineKaydet(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const id = sayi(fd.get("makine_id"));
  const ad = metin(fd, "ad", 200);
  if (!firmaId || !ad) throw new Error("Makinenin adı gerekli.");
  const siparisAday = sayi(fd.get("siparis_id"));
  const siparisId = siparisAday
    ? ((await tek<{ id: number }>(`SELECT id FROM crm_siparis WHERE id = $1 AND firma_id = $2`, [siparisAday, firmaId]))
        ?.id ?? null)
    : null;
  const d = [siparisId, ad, metin(fd, "seri_no", 80), gun(fd, "kurulum_tarihi"), gun(fd, "garanti_bitis"), metin(fd, "notlar", 2000)];
  if (id) {
    await sorgu(
      `UPDATE crm_makine SET siparis_id = $3, ad = $4, seri_no = $5, kurulum_tarihi = $6, garanti_bitis = $7, notlar = $8
        WHERE id = $1 AND firma_id = $2`,
      [id, firmaId, ...d]
    );
  } else {
    await sorgu(
      `INSERT INTO crm_makine (firma_id, siparis_id, ad, seri_no, kurulum_tarihi, garanti_bitis, notlar, olusturan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [firmaId, ...d, ben.kullanici]
    );
  }
  await kayitEkle(ben, id ? "makine_guncelle" : "makine_ekle", `firma #${firmaId}`, ad);
  redirect(`/firmalar/${firmaId}`);
}

export async function makineSil(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const id = sayi(fd.get("makine_id"));
  if (!firmaId || !id) throw new Error("Makine yok.");
  const r = await tek<{ ad: string }>(`DELETE FROM crm_makine WHERE id = $1 AND firma_id = $2 RETURNING ad`, [id, firmaId]);
  await kayitEkle(ben, "makine_sil", `firma #${firmaId}`, r?.ad ?? "");
  redirect(`/firmalar/${firmaId}`);
}

export async function servisKaydet(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const id = sayi(fd.get("servis_id"));
  const aciklama = metin(fd, "aciklama", 4000);
  if (!firmaId || !aciklama) throw new Error("Servis talebinin açıklaması gerekli.");
  const makineAday = sayi(fd.get("makine_id"));
  const makineId = makineAday
    ? ((await tek<{ id: number }>(`SELECT id FROM crm_makine WHERE id = $1 AND firma_id = $2`, [makineAday, firmaId]))?.id ??
      null)
    : null;
  const durum = gecerli(SERVIS_DURUMU, fd.get("durum"), "acik");
  const d = [
    makineId,
    gecerli(SERVIS_TURU, fd.get("tur"), "ariza"),
    aciklama,
    durum,
    metin(fd, "atanan", 40),
    gun(fd, "acildi") ?? bugun(),
    durum === "kapandi" ? (gun(fd, "kapandi") ?? bugun()) : null,
    metin(fd, "sonuc", 2000),
  ];
  if (id) {
    await sorgu(
      `UPDATE crm_servis SET makine_id = $3, tur = $4, aciklama = $5, durum = $6, atanan = $7, acildi = $8, kapandi = $9,
              sonuc = $10, guncellendi = now()
        WHERE id = $1 AND firma_id = $2`,
      [id, firmaId, ...d]
    );
  } else {
    await sorgu(
      `INSERT INTO crm_servis (firma_id, makine_id, tur, aciklama, durum, atanan, acildi, kapandi, sonuc, olusturan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [firmaId, ...d, ben.kullanici]
    );
  }
  await kayitEkle(ben, id ? "servis_guncelle" : "servis_ekle", `firma #${firmaId}`, String(durum));
  redirect(geriYolu(fd, `/firmalar/${firmaId}`));
}

export async function servisSil(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const id = sayi(fd.get("servis_id"));
  if (!firmaId || !id) throw new Error("Servis talebi yok.");
  await sorgu(`DELETE FROM crm_servis WHERE id = $1 AND firma_id = $2`, [id, firmaId]);
  await kayitEkle(ben, "servis_sil", `firma #${firmaId}`, `servis #${id}`);
  redirect(`/firmalar/${firmaId}`);
}

"use server";

import { redirect } from "next/navigation";
import { gun, metin, sayi } from "@/lib/bicim";
import { sorgu, tek } from "@/lib/db";
import { kayitEkle } from "@/lib/kayit";
import { yazarZorunlu, yoneticiZorunlu } from "@/lib/oturum";
import { ETKINLIK_TURU, gecerli } from "@/lib/sabitler";

export async function etkinlikKaydet(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const id = sayi(fd.get("id"));
  const ad = metin(fd, "ad", 200);
  if (!ad) throw new Error("Etkinlik adı gerekli.");
  const d = [
    ad,
    gecerli(ETKINLIK_TURU, fd.get("tur"), "fuar"),
    gun(fd, "baslangic"),
    gun(fd, "bitis"),
    metin(fd, "sehir", 120),
    metin(fd, "ulke", 80),
    metin(fd, "yer", 200),
    metin(fd, "aciklama", 4000),
  ];
  let no = id;
  if (id) {
    await sorgu(
      `UPDATE crm_etkinlik SET ad = $2, tur = $3, baslangic = $4, bitis = $5, sehir = $6, ulke = $7,
              yer = $8, aciklama = $9, guncellendi = now()
        WHERE id = $1`,
      [id, ...d]
    );
  } else {
    no = (
      await tek<{ id: number }>(
        `INSERT INTO crm_etkinlik (ad, tur, baslangic, bitis, sehir, ulke, yer, aciklama, olusturan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [...d, ben.kullanici]
      )
    )!.id;
  }
  await kayitEkle(ben, id ? "etkinlik_guncelle" : "etkinlik_ekle", `etkinlik #${no}`, ad);
  redirect(`/etkinlikler/${no}`);
}

/** Görüşmesi olan etkinlik silinmez: görüşmeler kaynağını kaybederdi. */
export async function etkinlikSil(fd: FormData): Promise<void> {
  const ben = await yoneticiZorunlu();
  const id = sayi(fd.get("id"));
  if (!id) throw new Error("Etkinlik yok.");
  const r = await tek<{ adet: number }>(`SELECT count(*)::int AS adet FROM crm_temas WHERE etkinlik_id = $1`, [id]);
  if (r && r.adet > 0) throw new Error("Bu etkinlikte görüşme kayıtları var; önce onları silin ya da taşıyın.");
  const s = await tek<{ ad: string }>(`DELETE FROM crm_etkinlik WHERE id = $1 RETURNING ad`, [id]);
  await kayitEkle(ben, "etkinlik_sil", `etkinlik #${id}`, s?.ad ?? "");
  redirect("/etkinlikler");
}

"use server";

import { redirect } from "next/navigation";
import { gun, metin, sayi } from "@/lib/bicim";
import { sorgu, tek } from "@/lib/db";
import { kayitEkle } from "@/lib/kayit";
import { yazarZorunlu } from "@/lib/oturum";

/** Yönlendirme yalnız uygulama içi yola. */
function geriYolu(fd: FormData, varsayilan: string): string {
  const g = String(fd.get("geri") ?? "");
  return g.startsWith("/") && !g.startsWith("//") ? g : varsayilan;
}

export async function gorevKaydet(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const id = sayi(fd.get("gorev_id"));
  const baslik = metin(fd, "baslik", 200);
  if (!baslik) throw new Error("Görevin başlığı gerekli.");
  const firmaId = sayi(fd.get("firma_id"));
  const d = [baslik, metin(fd, "aciklama", 2000), firmaId, metin(fd, "atanan", 40), gun(fd, "son_tarih")];
  if (id) {
    await sorgu(
      `UPDATE crm_gorev SET baslik = $2, aciklama = $3, firma_id = $4, atanan = $5, son_tarih = $6 WHERE id = $1`,
      [id, ...d]
    );
  } else {
    await sorgu(
      `INSERT INTO crm_gorev (baslik, aciklama, firma_id, atanan, son_tarih, olusturan) VALUES ($1, $2, $3, $4, $5, $6)`,
      [...d, ben.kullanici]
    );
  }
  await kayitEkle(ben, id ? "gorev_guncelle" : "gorev_ekle", firmaId ? `firma #${firmaId}` : "görev", baslik);
  redirect(geriYolu(fd, firmaId ? `/firmalar/${firmaId}` : "/gorevler"));
}

/** Tamamla ya da yeniden aç. */
export async function gorevDurum(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const id = sayi(fd.get("gorev_id"));
  if (!id) throw new Error("Görev yok.");
  const tamam = fd.get("tamam") === "1";
  const r = await tek<{ baslik: string; firma_id: number | null }>(
    tamam
      ? `UPDATE crm_gorev SET durum = 'tamam', tamamlandi = now(), tamamlayan = $2 WHERE id = $1 RETURNING baslik, firma_id`
      : `UPDATE crm_gorev SET durum = 'acik', tamamlandi = NULL, tamamlayan = NULL WHERE id = $1 AND $2::text IS NOT NULL
         RETURNING baslik, firma_id`,
    [id, ben.kullanici]
  );
  await kayitEkle(ben, tamam ? "gorev_tamam" : "gorev_ac", r?.firma_id ? `firma #${r.firma_id}` : "görev", r?.baslik ?? "");
  redirect(geriYolu(fd, "/gorevler"));
}

export async function gorevSil(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const id = sayi(fd.get("gorev_id"));
  if (!id) throw new Error("Görev yok.");
  const r = await tek<{ baslik: string }>(`DELETE FROM crm_gorev WHERE id = $1 RETURNING baslik`, [id]);
  await kayitEkle(ben, "gorev_sil", "görev", r?.baslik ?? "");
  redirect(geriYolu(fd, "/gorevler"));
}

"use server";

import { revalidatePath } from "next/cache";
import { adminYetkisi } from "@/lib/admin-yetki";
import { sorguSert } from "@/lib/db";
import { ozetAyari, ozetAyariYaz, ozetGonder, ozetSemasiKur } from "@/lib/haftalik-ozet";
import { kayitEkle } from "@/lib/panel-kayit";
import { adresleriAyikla } from "@/lib/posta-bicim";

/**
 * Haftalık özet ayarı ve "Şimdi gönder". İkisi de YALNIZCA yönetici:
 * alıcıyı değiştiren biri şirketin sayılarını istediği adrese yollatabilirdi.
 */

export type OzetSonucu = { tamam: boolean; mesaj: string } | null;

const EN_COK_ALICI = 10;

export async function ozetAyarEylemi(_onceki: OzetSonucu, form: FormData): Promise<OzetSonucu> {
  const ben = await adminYetkisi();
  const acik = form.get("acik") === "on";
  const { gecerli, gecersiz } = adresleriAyikla(String(form.get("alicilar") ?? "").slice(0, 2000));
  if (gecersiz.length) return { tamam: false, mesaj: `Geçersiz adres: ${gecersiz.join(", ")}` };
  if (gecerli.length > EN_COK_ALICI) return { tamam: false, mesaj: `En çok ${EN_COK_ALICI} alıcı.` };
  if (acik && !gecerli.length) return { tamam: false, mesaj: "Açmak için en az bir alıcı yazın." };

  if (!(await ozetSemasiKur())) return { tamam: false, mesaj: "Veritabanına ulaşılamadı." };
  await ozetAyariYaz(acik, gecerli, ben);
  await kayitEkle(ben, "ozet_ayar", "haftalik-ozet", `${acik ? "açık" : "kapalı"}${gecerli.length ? ` · ${gecerli.join(", ")}` : ""}`);
  revalidatePath("/admin/genel");
  return {
    tamam: true,
    mesaj: acik ? "Kaydedildi. Özet her pazartesi 08:30'da gider." : "Kaydedildi. Özet kapalı.",
  };
}

export async function ozetSimdiGonderEylemi(): Promise<OzetSonucu> {
  const ben = await adminYetkisi();
  if (!(await ozetSemasiKur())) return { tamam: false, mesaj: "Veritabanına ulaşılamadı." };
  const liste = adresleriAyikla((await ozetAyari()).alicilar).gecerli;
  if (!liste.length) return { tamam: false, mesaj: "Önce alıcı yazıp kaydedin." };

  /* Yanlışlıkla iki kez basılıp patrona üst üste aynı mail gitmesin. */
  const [{ adet }] = await sorguSert<{ adet: number }>(
    `SELECT count(*)::int AS adet FROM panel_kayit WHERE olay = 'ozet_gonder' AND zaman > now() - interval '10 minutes'`
  );
  if (adet > 0) return { tamam: false, mesaj: "Özet az önce gönderildi — 10 dakika sonra tekrar deneyin." };

  try {
    const { konu } = await ozetGonder(liste);
    await kayitEkle(ben, "ozet_gonder", "haftalik-ozet", `${konu} → ${liste.join(", ")}`);
    return { tamam: true, mesaj: `Gönderildi: ${liste.join(", ")}` };
  } catch (e) {
    return { tamam: false, mesaj: `Gönderilemedi: ${(e as Error).message}`.slice(0, 300) };
  }
}

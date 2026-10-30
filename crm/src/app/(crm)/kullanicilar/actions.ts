"use server";

import { redirect } from "next/navigation";
import { metin, sayi } from "@/lib/bicim";
import { sorgu, tek } from "@/lib/db";
import { kayitEkle } from "@/lib/kayit";
import { parolaKarmala, yoneticiZorunlu } from "@/lib/oturum";
import { gecerli, ROL } from "@/lib/sabitler";

export async function kullaniciEkle(fd: FormData): Promise<void> {
  const ben = await yoneticiZorunlu();
  const kullanici = metin(fd, "kullanici", 40)?.toLowerCase();
  const parola = String(fd.get("parola") ?? "");
  if (!kullanici || !/^[a-z0-9._-]{3,40}$/.test(kullanici)) {
    throw new Error("Kullanıcı adı 3-40 karakter: küçük harf, rakam, nokta, tire.");
  }
  if (parola.length < 10) throw new Error("Parola en az 10 karakter olmalı.");
  const rol = gecerli(ROL, fd.get("rol"), "satis");
  const r = await tek<{ id: number }>(
    `INSERT INTO crm_kullanici (kullanici, ad, eposta, rol, karma) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (kullanici) DO NOTHING RETURNING id`,
    [kullanici, metin(fd, "ad", 120) ?? "", metin(fd, "eposta", 200), rol, await parolaKarmala(parola)]
  );
  if (!r) throw new Error(`"${kullanici}" zaten var.`);
  await kayitEkle(ben, "kullanici_ekle", kullanici, `rol: ${String(rol)}`);
  redirect("/kullanicilar");
}

export async function kullaniciGuncelle(fd: FormData): Promise<void> {
  const ben = await yoneticiZorunlu();
  const id = sayi(fd.get("id"));
  if (!id) throw new Error("Kullanıcı yok.");
  const rol = gecerli(ROL, fd.get("rol"), "satis");
  const aktif = fd.get("aktif") === "on";
  if (id === ben.id && (rol !== "yonetici" || !aktif)) {
    throw new Error("Kendi yönetici yetkinizi kaldıramaz, kendinizi pasifleştiremezsiniz.");
  }
  const r = await tek<{ kullanici: string }>(
    `UPDATE crm_kullanici SET ad = $2, eposta = $3, rol = $4, aktif = $5 WHERE id = $1 RETURNING kullanici`,
    [id, metin(fd, "ad", 120) ?? "", metin(fd, "eposta", 200), rol, aktif]
  );
  /* Pasifleşen kullanıcının açık oturumları o an kapanır. */
  if (!aktif) await sorgu(`DELETE FROM crm_oturum WHERE kullanici_id = $1`, [id]);
  await kayitEkle(ben, "kullanici_guncelle", r?.kullanici ?? `#${id}`, `rol: ${String(rol)}, aktif: ${aktif}`);
  redirect("/kullanicilar");
}

export async function parolaSifirla(fd: FormData): Promise<void> {
  const ben = await yoneticiZorunlu();
  const id = sayi(fd.get("id"));
  const parola = String(fd.get("parola") ?? "");
  if (!id) throw new Error("Kullanıcı yok.");
  if (parola.length < 10) throw new Error("Parola en az 10 karakter olmalı.");
  const r = await tek<{ kullanici: string }>(
    `UPDATE crm_kullanici SET karma = $2, basarisiz = 0, kilit_bitis = NULL WHERE id = $1 RETURNING kullanici`,
    [id, await parolaKarmala(parola)]
  );
  await sorgu(`DELETE FROM crm_oturum WHERE kullanici_id = $1`, [id]);
  await kayitEkle(ben, "parola_sifirla", r?.kullanici ?? `#${id}`);
  redirect("/kullanicilar");
}

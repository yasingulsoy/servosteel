"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  girisYap,
  cikisYap,
  oturum,
  yoneticiKur,
  yoneticiSil,
  parolaDegistir,
} from "@/lib/admin-auth";
import {
  DURUMLAR,
  durumDegistir,
  notEkle,
  talepEkle,
  talepSil,
  semaKur,
  type Durum,
} from "@/lib/leads-db";

/**
 * Panelin sunucu eylemleri.
 *
 * **HER EYLEMDE yetki kontrolü var.** Next dokümanının uyardığı gibi sunucu
 * eylemleri arayüzden bağımsız olarak doğrudan POST ile çağrılabiliyor;
 * "zaten giriş yapmış olmadan bu düğmeyi göremez" demek güvenlik değildir.
 */

async function yetki(): Promise<string> {
  const k = await oturum();
  if (!k) throw new Error("yetkisiz");
  return k;
}

const metin = (v: FormDataEntryValue | null, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function girisEylemi(_onceki: string | null, form: FormData) {
  const kullanici = metin(form.get("kullanici"), 80);
  const parola = metin(form.get("parola"), 200);
  if (!kullanici || !parola) return "Kullanıcı adı ve parola gerekli.";

  const tamam = await girisYap(kullanici, parola);
  /* Hangisinin yanlış olduğu SÖYLENMEZ — geçerli kullanıcı adını
     tahmin etmeyi kolaylaştırır. */
  if (!tamam) return "Kullanıcı adı veya parola hatalı.";

  await semaKur();
  redirect("/admin");
}

export async function cikisEylemi() {
  await yetki();
  await cikisYap();
  redirect("/admin/giris");
}

export async function durumEylemi(form: FormData) {
  await yetki();
  const id = Number(form.get("id"));
  const durum = metin(form.get("durum"), 40) as Durum;
  if (!Number.isInteger(id) || !DURUMLAR.includes(durum)) return;
  await durumDegistir(id, durum);
  revalidatePath("/admin");
  revalidatePath(`/admin/talep/${id}`);
}

export async function notEylemi(form: FormData) {
  const kullanici = await yetki();
  const id = Number(form.get("id"));
  const govde = metin(form.get("govde"), 4000);
  if (!Number.isInteger(id) || !govde) return;
  await notEkle(id, govde, kullanici);
  revalidatePath(`/admin/talep/${id}`);
}

/**
 * Elle talep ekleme.
 *
 * Gerekli, çünkü form bugüne kadar hiçbir yere KAYDETMEDİ — yalnızca
 * e-posta attı. Geçmiş talepler posta kutusunda duruyor ve panele ancak
 * elle giriliyor. `kaynak` alanı 'elle' olarak işaretlenir ki sonradan
 * "bu form mu doldurdu, biz mi girdik" karışmasın.
 */
export async function talepEkleEylemi(form: FormData) {
  await yetki();
  const ad = metin(form.get("ad"), 120);
  const eposta = metin(form.get("eposta"), 160);
  if (!ad && !eposta) return;

  await talepEkle({
    tur: metin(form.get("tur"), 20) || "contact",
    dil: metin(form.get("dil"), 8) || "tr",
    ad,
    eposta,
    firma: metin(form.get("firma"), 160),
    telefon: metin(form.get("telefon"), 60),
    ulke: metin(form.get("ulke"), 80),
    mesaj: metin(form.get("mesaj"), 4000),
    sayfa: metin(form.get("sayfa"), 300),
    kaynak: "elle",
  });
  revalidatePath("/admin");
}

export async function silEylemi(form: FormData) {
  await yetki();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  await talepSil(id);
  revalidatePath("/admin");
  redirect("/admin");
}

/* ------------------------------------------------------- kullanıcılar */

/**
 * Kullanıcı ekler ya da var olanın parolasını değiştirir.
 *
 * Parola en az 8 karakter. Panel canlı sitede duruyor ve kullanıcı adı
 * tahmin edilebilir; tek koruma parolanın kendisi.
 */
export async function kullaniciEkleEylemi(_onceki: string | null, form: FormData) {
  await yetki();
  const kullanici = metin(form.get("kullanici"), 60).toLowerCase();
  const parola = metin(form.get("parola"), 200);

  if (!/^[a-z0-9._-]{3,60}$/.test(kullanici)) {
    return "Kullanıcı adı 3-60 karakter olmalı; harf, rakam, nokta, tire, alt çizgi.";
  }
  if (parola.length < 8) return "Parola en az 8 karakter olmalı.";

  await yoneticiKur(kullanici, parola);
  revalidatePath("/admin/kullanicilar");
  return null;
}

export async function kullaniciSilEylemi(_onceki: string | null, form: FormData) {
  const ben = await yetki();
  const kullanici = metin(form.get("kullanici"), 60);
  /* Kendini silmek oturumu geçersiz kılmaz ama bir sonraki girişte
     kilitlenirsin — baştan engelliyoruz. */
  if (kullanici === ben) return "Kendi hesabınızı silemezsiniz.";
  const hata = await yoneticiSil(kullanici);
  revalidatePath("/admin/kullanicilar");
  return hata;
}

/** Giriş yapmış kullanıcının kendi parolasını değiştirmesi. */
export async function parolamiDegistirEylemi(_onceki: string | null, form: FormData) {
  const ben = await yetki();
  const mevcut = metin(form.get("mevcut"), 200);
  const yeni = metin(form.get("yeni"), 200);
  if (!mevcut || !yeni) return "İki alan da dolu olmalı.";
  const hata = await parolaDegistir(ben, mevcut, yeni);
  return hata ?? "Parolanız değişti.";
}

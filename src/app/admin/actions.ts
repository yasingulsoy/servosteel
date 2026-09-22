"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  girisYap,
  cikisYap,
  yoneticiEkle,
  parolaAta,
  yoneticiSil,
  parolaDegistir,
} from "@/lib/admin-auth";
import { adminYetkisi, yetki } from "@/lib/admin-yetki";
import {
  DURUMLAR,
  DURUM_ETIKET,
  durumDegistir,
  notEkle,
  talep,
  talepEkle,
  talepSil,
  semaKur,
  type Durum,
  type Talep,
} from "@/lib/leads-db";
import { kayitEkle } from "@/lib/panel-kayit";

/**
 * Panelin sunucu eylemleri.
 *
 * **HER EYLEMDE yetki kontrolü var** (`yetki` / `adminYetkisi`,
 * lib/admin-yetki.ts): sunucu eylemleri arayüzden bağımsız olarak doğrudan
 * POST ile çağrılabiliyor.
 */

const metin = (v: FormDataEntryValue | null, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/**
 * Kayıtta talebi tanıtan kısa ad — talep silinse bile kayıt okunabilir kalsın.
 * DIŞA AÇIK DEĞİL: "use server" dosyasında export edilen her fonksiyon POST
 * ile çağrılabilen bir eyleme dönüşür.
 */
function talepOzeti(t: Pick<Talep, "id" | "ad" | "firma" | "eposta">) {
  return [t.ad, t.firma].filter(Boolean).join(" · ") || t.eposta || `Talep #${t.id}`;
}

/* Dakikalık nabız artık sunucu eylemi değil: src/app/api/nabiz/route.ts */

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
  const ben = await yetki();
  const id = Number(form.get("id"));
  const durum = metin(form.get("durum"), 40) as Durum;
  if (!Number.isInteger(id) || !DURUMLAR.includes(durum)) return;
  const once = await talep(id);
  const eskiDurum = once?.durum;
  await durumDegistir(id, durum);
  if (once && eskiDurum !== durum) {
    await kayitEkle(
      ben,
      "durum",
      `talep:${id}`,
      `${talepOzeti(once)} — ${DURUM_ETIKET[eskiDurum as Durum] ?? eskiDurum} → ${DURUM_ETIKET[durum]}`
    );
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/talep/${id}`);
}

export async function notEylemi(form: FormData) {
  const kullanici = await yetki();
  const id = Number(form.get("id"));
  const govde = metin(form.get("govde"), 4000);
  if (!Number.isInteger(id) || !govde) return;
  await notEkle(id, govde, kullanici);
  const t = await talep(id);
  await kayitEkle(
    kullanici,
    "not",
    `talep:${id}`,
    `${t ? talepOzeti(t) : `Talep #${id}`} — ${govde.replace(/\s+/g, " ").slice(0, 160)}`
  );
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
  const ben = await yetki();
  const ad = metin(form.get("ad"), 120);
  const eposta = metin(form.get("eposta"), 160);
  if (!ad && !eposta) return;

  const yeniId = await talepEkle({
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
  if (yeniId !== null) {
    await kayitEkle(
      ben,
      "talep_ekle",
      `talep:${yeniId}`,
      talepOzeti({ id: yeniId, ad, firma: metin(form.get("firma"), 160), eposta })
    );
  }
  revalidatePath("/admin");
}

export async function silEylemi(form: FormData) {
  const ben = await yetki();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  /* Özet silmeden ÖNCE alınıyor: kayıtta "neyi sildi" sorusunun cevabı,
     talep gittikten sonra yalnızca burada kalıyor. */
  const once = await talep(id);
  await talepSil(id);
  await kayitEkle(
    ben,
    "talep_sil",
    `talep:${id}`,
    once ? `${talepOzeti(once)}${once.eposta ? ` · ${once.eposta}` : ""}` : ""
  );
  revalidatePath("/admin");
  redirect("/admin");
}

/* ------------------------------------------------------- kullanıcılar */

/** Form eylemlerinin sonucu: tamam mı, ekranda ne yazacak. */
export type EylemSonucu = { tamam: boolean; mesaj: string } | null;

/**
 * Yeni kullanıcı ekler. Ad alınmışsa EZMEZ — parola değiştirmek listedeki
 * ayrı tuşun işi.
 *
 * Parola en az 8 karakter. Panel canlı sitede duruyor ve kullanıcı adı
 * tahmin edilebilir; tek koruma parolanın kendisi.
 */
export async function kullaniciEkleEylemi(
  _onceki: EylemSonucu,
  form: FormData
): Promise<EylemSonucu> {
  const ben = await adminYetkisi();
  const kullanici = metin(form.get("kullanici"), 60).toLowerCase();
  const parola = metin(form.get("parola"), 200);

  if (!/^[a-z0-9._-]{3,60}$/.test(kullanici)) {
    return {
      tamam: false,
      mesaj: "Kullanıcı adı 3-60 karakter olmalı; harf, rakam, nokta, tire, alt çizgi.",
    };
  }
  if (parola.length < 8) return { tamam: false, mesaj: "Parola en az 8 karakter olmalı." };

  if (!(await yoneticiEkle(kullanici, parola))) {
    return {
      tamam: false,
      mesaj: `"${kullanici}" zaten var. Parolasını listeden değiştirebilirsiniz.`,
    };
  }
  await kayitEkle(ben, "kullanici_ekle", kullanici);
  revalidatePath("/admin/kullanicilar");
  return { tamam: true, mesaj: `"${kullanici}" eklendi.` };
}

/**
 * Yönetici, başka bir kullanıcıya yeni parola verir.
 *
 * Kendine UYGULANMAZ: kendi parolası Profil'den, mevcut parola sorularak
 * değişir. Buradan izin verseydik, açık kalmış bir yönetici oturumunu ele
 * geçiren biri parolayı değiştirip asıl sahibi dışarıda bırakabilirdi.
 */
export async function parolaVerEylemi(
  _onceki: EylemSonucu,
  form: FormData
): Promise<EylemSonucu> {
  const ben = await adminYetkisi();
  const kullanici = metin(form.get("kullanici"), 60);
  const parola = metin(form.get("parola"), 200);

  if (kullanici === ben) {
    return { tamam: false, mesaj: "Kendi parolanızı Profil sayfasından değiştirin." };
  }
  if (parola.length < 8) return { tamam: false, mesaj: "Parola en az 8 karakter olmalı." };
  if (!(await parolaAta(kullanici, parola))) {
    return { tamam: false, mesaj: "Kullanıcı bulunamadı." };
  }
  await kayitEkle(ben, "parola_ver", kullanici);
  return { tamam: true, mesaj: "Parola değişti. Kişi girdikten sonra Profil'den kendi parolasını belirleyebilir." };
}

export async function kullaniciSilEylemi(_onceki: string | null, form: FormData) {
  const ben = await adminYetkisi();
  const kullanici = metin(form.get("kullanici"), 60);
  /* Kendini silmek oturumu geçersiz kılmaz ama bir sonraki girişte
     kilitlenirsin — baştan engelliyoruz. */
  if (kullanici === ben) return "Kendi hesabınızı silemezsiniz.";
  const hata = await yoneticiSil(kullanici);
  if (!hata) await kayitEkle(ben, "kullanici_sil", kullanici);
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
  if (!hata) await kayitEkle(ben, "parola_degistir");
  return hata ?? "Parolanız değişti.";
}

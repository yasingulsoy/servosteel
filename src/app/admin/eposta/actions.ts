"use server";

import { revalidatePath } from "next/cache";
import { yetki } from "@/lib/admin-yetki";
import { elleGonder } from "@/lib/posta-gonder";

/**
 * Panelden elle e-posta: yeni, yanıt ya da iletme. İlk satır `yetki()` —
 * sunucu eylemi doğrudan POST ile çağrılabilir. Kurallar (saatlik sınır,
 * abonelikten çıkanlar, panel kaydı) posta-gonder.ts'te; Claude'un kullandığı
 * uç da aynı yoldan geçer.
 */

export type YazmaSonucu = { tamam: boolean; mesaj: string } | null;

const alan = (form: FormData, ad: string, max = 500) => String(form.get(ad) ?? "").slice(0, max);

export async function epostaGonderEylemi(_onceki: YazmaSonucu, form: FormData): Promise<YazmaSonucu> {
  const ben = await yetki();
  const sonuc = await elleGonder({
    kim: ben,
    kutu: alan(form, "kutu", 254),
    kime: alan(form, "kime", 4000),
    bilgi: alan(form, "bilgi", 4000),
    konu: alan(form, "konu", 300),
    metin: alan(form, "metin", 50_000),
    mesajKimligi: alan(form, "mesaj_kimligi", 1000),
    referanslar: alan(form, "referanslar", 4000),
    yanitUid: Number(alan(form, "yanit_uid", 20)),
  });
  if (sonuc.tamam) revalidatePath("/admin/eposta");
  return sonuc;
}

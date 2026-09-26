"use server";

import { revalidatePath } from "next/cache";
import { yetki } from "@/lib/admin-yetki";
import { kayitEkle } from "@/lib/panel-kayit";
import { takipYaz, type TakipSecimi } from "@/lib/takip";
import { gunGecerli, type TakipTuru } from "@/lib/takip-bicim";

/**
 * Takip tarihi koy / değiştir / kaldır — talep ve hedef firma sayfasındaki
 * "Takip" kutusu. İlk satır `yetki()`: sunucu eylemi doğrudan çağrılabilir,
 * argümanlar da istemciden geldiği için hepsi burada yeniden doğrulanıyor.
 */

export type TakipSonucu = { tamam: boolean; mesaj: string };

export async function takipEylemi(
  tur: TakipTuru,
  id: number,
  secim: TakipSecimi,
  notu: string
): Promise<TakipSonucu> {
  const ben = await yetki();
  if (tur !== "talep" && tur !== "firma") return { tamam: false, mesaj: "Geçersiz kayıt türü." };
  if (!Number.isSafeInteger(id) || id < 1) return { tamam: false, mesaj: "Geçersiz kayıt." };

  let temiz: TakipSecimi = null;
  if (secim !== null) {
    if (typeof secim !== "object") return { tamam: false, mesaj: "Geçersiz tarih." };
    if ("gun" in secim) {
      const g = Math.trunc(Number(secim.gun));
      if (!Number.isFinite(g) || g < 0 || g > 365) return { tamam: false, mesaj: "Gün 0-365 arası olmalı." };
      temiz = { gun: g };
    } else if ("tarih" in secim && typeof secim.tarih === "string" && gunGecerli(secim.tarih)) {
      const yil = Number(secim.tarih.slice(0, 4));
      if (yil < 2020 || yil > 2100) return { tamam: false, mesaj: "Tarih makul bir yıl olmalı." };
      temiz = { tarih: secim.tarih };
    } else {
      return { tamam: false, mesaj: "Geçersiz tarih." };
    }
  }
  const temizNot = String(notu ?? "").replace(/\s+/g, " ").trim().slice(0, 300);

  const r = await takipYaz(tur, id, temiz, temizNot);
  if (!r.bulundu) return { tamam: false, mesaj: "Kayıt bulunamadı." };

  await kayitEkle(
    ben,
    "takip",
    `${tur}:${id}`,
    r.tarih ? `${r.tarih}${temizNot ? ` — ${temizNot}` : ""}` : "takip kaldırıldı"
  );
  revalidatePath(tur === "talep" ? `/admin/talep/${id}` : `/admin/firmalar/${id}`);
  revalidatePath("/admin/genel");
  revalidatePath(tur === "talep" ? "/admin" : "/admin/firmalar");
  return { tamam: true, mesaj: r.tarih ? "Takip tarihi kondu." : "Takip kaldırıldı." };
}

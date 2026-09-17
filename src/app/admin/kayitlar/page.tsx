import { redirect } from "next/navigation";
import { oturum, rolu, yoneticiler } from "@/lib/admin-auth";
import {
  kayitlar,
  kullaniciOzetleri,
  oturumlar,
  type KayitSatiri,
  type KullaniciOzeti,
  type OturumSatiri,
} from "@/lib/panel-kayit";
import { KayitlarGorunumu } from "./gorunum";
import { Kabuk } from "../kabuk";

export const dynamic = "force-dynamic";

/**
 * Kayıtlar — kim ne zaman girdi, ne kadar kaldı, ne yaptı.
 *
 * YALNIZCA YÖNETİCİ. Menüden gizlemek yetmez, adresi bilen yazıp açabilirdi;
 * kontrol burada, sunucuda. Kayıtların nasıl tutulduğu `lib/panel-kayit.ts`'te.
 */
export default async function KayitlarSayfasi({
  searchParams,
}: {
  searchParams: Promise<{ kullanici?: string }>;
}) {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");
  if ((await rolu(ben)) !== "admin") redirect("/admin");

  const { kullanici } = await searchParams;
  const hesaplar = await yoneticiler();
  const secili = hesaplar.some((h) => h.kullanici === kullanici) ? kullanici : undefined;

  let ozet: KullaniciOzeti[] = [];
  let oturumListesi: OturumSatiri[] = [];
  let islemler: KayitSatiri[] = [];
  let okunamadi = false;
  try {
    [ozet, oturumListesi, islemler] = await Promise.all([
      kullaniciOzetleri(30),
      oturumlar(secili, 60),
      kayitlar(secili, 200),
    ]);
  } catch {
    okunamadi = true;
  }

  return (
    <Kabuk aktif="kayitlar" kullanici={ben}>
      <KayitlarGorunumu
        hesaplar={hesaplar}
        secili={secili}
        ozet={ozet}
        oturumListesi={oturumListesi}
        islemler={islemler}
        okunamadi={okunamadi}
      />
    </Kabuk>
  );
}

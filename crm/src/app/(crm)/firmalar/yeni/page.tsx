import type { Metadata } from "next";
import { HizliKayitFormu } from "@/components/formlar";
import { SayfaBasligi } from "@/components/sayfa";
import { sayi } from "@/lib/bicim";
import { yazarZorunlu } from "@/lib/oturum";
import { etkinlikler, ilgiAlanlari } from "@/lib/veri";
import { hizliKayit } from "../actions";

export const metadata: Metadata = { title: "Firma ekle" };

export default async function YeniFirma(props: PageProps<"/firmalar/yeni">) {
  await yazarZorunlu();
  const sp = await props.searchParams;
  const [ilgiler, ets] = await Promise.all([ilgiAlanlari(), etkinlikler()]);
  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi baslik="Firma ekle" yol={[{ ad: "Firmalar", href: "/firmalar" }]} />
      <div className="kart p-5 sm:p-6">
        <HizliKayitFormu
          eylem={hizliKayit}
          ilgiler={ilgiler}
          etkinlikler={ets}
          etkinlikId={sayi(sp.etkinlik) ?? undefined}
          geri="firma"
        />
      </div>
    </div>
  );
}

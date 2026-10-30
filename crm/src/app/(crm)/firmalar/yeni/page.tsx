import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HizliKayitFormu } from "@/components/formlar";
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
    <div className="space-y-5">
      <div>
        <Link href="/firmalar" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={14} /> Firmalar
        </Link>
        <h1 className="mt-1 text-xl font-bold">Firma ekle</h1>
      </div>
      <div className="kart p-4">
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

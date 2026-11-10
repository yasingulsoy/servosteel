import type { Metadata } from "next";
import Link from "next/link";
import { GorevFormu } from "@/components/formlar";
import { GorevListesi } from "@/components/gorev-listesi";
import { SayfaBasligi } from "@/components/sayfa";
import { sorgu } from "@/lib/db";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { gorevler, kullanicilar } from "@/lib/veri";
import { gorevDurum, gorevKaydet } from "./actions";

export const metadata: Metadata = { title: "Görevler" };

const SEKMELER = [
  { kod: "benim", ad: "Benim" },
  { kod: "geciken", ad: "Gecikenler" },
  { kod: "herkes", ad: "Herkesin" },
  { kod: "biten", ad: "Tamamlananlar" },
] as const;

export default async function GorevSayfasi(props: PageProps<"/gorevler">) {
  const ben = await oturumZorunlu();
  const sp = await props.searchParams;
  const sekme = SEKMELER.find((s) => s.kod === sp.g)?.kod ?? "benim";
  const [liste, kisiler, firmalar] = await Promise.all([
    gorevler(
      sekme === "benim"
        ? { atanan: ben.kullanici }
        : sekme === "geciken"
          ? { gecikmis: true }
          : sekme === "biten"
            ? { durum: "tamam" }
            : {}
    ),
    kullanicilar(),
    sorgu<{ id: number; ad: string }>(`SELECT id, ad FROM crm_firma ORDER BY lower(ad) LIMIT 2000`),
  ]);
  const geri = `/gorevler?g=${sekme}`;

  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi baslik="Görevler" yol={[]}>
      <p className="max-w-3xl text-sm text-gray-500">
        Teklif gönderilince 7 gün sonrasına &quot;Teklif takibi&quot;, görüşme &quot;teklif verilecek&quot;e geçince 3
        gün sonrasına &quot;Teklif hazırla&quot; görevi kendiliğinden açılır; iş ilerleyince kendiliğinden kapanır.
        Görev firmanın sorumlusuna düşer.
      </p>
      </SayfaBasligi>
      <div className="sekmeler">
        {SEKMELER.map((s) => (
          <Link key={s.kod} href={`/gorevler?g=${s.kod}`} className={`sekme ${sekme === s.kod ? "sekme-etkin" : ""}`}>
            {s.ad}
          </Link>
        ))}
      </div>
      <GorevListesi gorevler={liste} durumEylemi={gorevDurum} geri={geri} yazabilir={yazabilir(ben)} />
      {yazabilir(ben) ? (
        <details className="kart p-5">
          <summary className="kart-baslik">Yeni görev</summary>
          <div className="mt-5 border-t border-gray-100 pt-5">
            <GorevFormu eylem={gorevKaydet} firmalar={firmalar} kisiler={kisiler} varsayilanAtanan={ben.kullanici} geri={geri} />
          </div>
        </details>
      ) : null}
    </div>
  );
}

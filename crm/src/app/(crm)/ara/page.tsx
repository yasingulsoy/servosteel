import type { Metadata } from "next";
import Link from "next/link";
import { Building2, FileText, UserRound, Wrench } from "lucide-react";
import { Bos, SayfaBasligi } from "@/components/sayfa";
import { oturumZorunlu } from "@/lib/oturum";
import { ara } from "@/lib/veri";

export const metadata: Metadata = { title: "Ara" };

const SIMGE = { firma: Building2, kisi: UserRound, teklif: FileText, makine: Wrench };
const AD = { firma: "Firma", kisi: "Kişi", teklif: "Teklif", makine: "Makine" };

export default async function AraSayfasi(props: PageProps<"/ara">) {
  await oturumZorunlu();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sonuc = q.length >= 2 ? await ara(q) : [];
  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi baslik="Ara" yol={[]} />
      <form className="flex gap-2">
        <input name="q" defaultValue={q} autoFocus placeholder="Firma, kişi, e-posta, telefon, teklif no, seri no…" className="alan" />
        <button type="submit" className="dugme shrink-0">
          Ara
        </button>
      </form>
      {q.length >= 2 ? (
        sonuc.length ? (
          <ul className="kart divide-y divide-gray-100 overflow-hidden">
            {sonuc.map((s, i) => {
              const Simge = SIMGE[s.tur];
              return (
                <li key={`${s.tur}-${s.firma_id}-${i}`}>
                  <Link href={`/firmalar/${s.firma_id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 sm:px-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                      <Simge size={20} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-theme-sm font-medium text-gray-800">
                        {s.baslik} <span className="text-theme-xs font-normal text-gray-500">· {AD[s.tur]}</span>
                      </p>
                      {s.ayrinti ? <p className="truncate text-theme-xs text-gray-500">{s.ayrinti}</p> : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="kart">
            <Bos>&quot;{q}&quot; için sonuç yok.</Bos>
          </div>
        )
      ) : (
        <p className="text-sm text-gray-500">En az 2 harf yazın.</p>
      )}
    </div>
  );
}

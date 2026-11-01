import type { Metadata } from "next";
import Link from "next/link";
import { Building2, FileText, UserRound, Wrench } from "lucide-react";
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
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Ara</h1>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} autoFocus placeholder="Firma, kişi, e-posta, telefon, teklif no, seri no…" className="alan" />
        <button type="submit" className="dugme shrink-0">
          Ara
        </button>
      </form>
      {q.length >= 2 ? (
        sonuc.length ? (
          <ul className="kart divide-y divide-line">
            {sonuc.map((s, i) => {
              const Simge = SIMGE[s.tur];
              return (
                <li key={`${s.tur}-${s.firma_id}-${i}`}>
                  <Link href={`/firmalar/${s.firma_id}`} className="flex items-start gap-3 p-3 hover:bg-surface">
                    <Simge size={16} className="mt-0.5 text-muted" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {s.baslik} <span className="text-xs font-normal text-muted">· {AD[s.tur]}</span>
                      </p>
                      {s.ayrinti ? <p className="truncate text-xs text-muted">{s.ayrinti}</p> : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">&quot;{q}&quot; için sonuç yok.</p>
        )
      ) : (
        <p className="text-sm text-muted">En az 2 harf yazın.</p>
      )}
    </div>
  );
}

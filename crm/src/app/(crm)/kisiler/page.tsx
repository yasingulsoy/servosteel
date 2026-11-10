import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { Bos, SayfaBasligi } from "@/components/sayfa";
import { oturumZorunlu } from "@/lib/oturum";
import { kisiListesi } from "./veri";

export const metadata: Metadata = { title: "Kişiler" };

export default async function KisilerSayfasi(props: PageProps<"/kisiler">) {
  await oturumZorunlu();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const liste = await kisiListesi(q, 1000);

  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi
        baslik="Kişiler"
        yanina={<span className="text-theme-sm text-gray-500 tabular-nums">{liste.length}</span>}
        ek={
          <Link href={`/kisiler/disa-aktar${q ? `?q=${encodeURIComponent(q)}` : ""}`} className="dugme-ikincil" prefetch={false}>
            <Download size={18} /> Excel&apos;e aktar
          </Link>
        }
      />

      <form className="relative max-w-md">
        <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-400" />
        <input name="q" defaultValue={q} placeholder="Ad, e-posta, telefon, firma, ülke…" aria-label="Kişi ara" className="alan ps-10" />
      </form>

      <section className="kart overflow-hidden">
        {liste.length === 0 ? (
          <Bos>{q ? "Aramaya uyan kişi yok." : "Henüz kişi yok."}</Bos>
        ) : (
          <div className="overflow-x-auto">
            <table className="tablo min-w-[900px]">
              <thead>
                <tr>
                  <th>Kişi</th>
                  <th>Firma</th>
                  <th>E-posta</th>
                  <th>Telefon</th>
                  <th>Son temas</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <div className="font-medium text-gray-800">{k.ad}</div>
                      {k.unvan ? <div className="text-theme-xs text-gray-500">{k.unvan}</div> : null}
                    </td>
                    <td>
                      <Link href={`/firmalar/${k.firmaId}`} className="text-gray-800 hover:text-brand-500">
                        {k.firma}
                      </Link>
                      {k.ulke ? <div className="text-theme-xs text-gray-500">{k.ulke}</div> : null}
                    </td>
                    <td className="text-sm">
                      {k.eposta ? (
                        <a href={`mailto:${k.eposta}`} className="text-gray-700 hover:text-brand-500">
                          {k.eposta}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="text-sm whitespace-nowrap">
                      {k.telefon ? (
                        <a href={`tel:${k.telefon.replace(/[^\d+]/g, "")}`} className="text-gray-700 hover:text-brand-500">
                          {k.telefon}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="text-sm whitespace-nowrap text-gray-600">
                      {k.sonTemas ? new Date(`${k.sonTemas}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

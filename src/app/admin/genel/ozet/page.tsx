import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { oturum } from "@/lib/admin-auth";
import { aralikYazisi, gecenHafta, ozetIcerik, ozetVerisi } from "@/lib/haftalik-ozet";
import { semaKur } from "@/lib/leads-db";
import { outreachSemaKur } from "@/lib/outreach-db";
import { Kabuk } from "../../kabuk";

export const dynamic = "force-dynamic";

/**
 * Haftalık özetin önizlemesi — pazartesi giden e-postanın AYNISI, şu anki
 * sayılarla. E-posta HTML'i boş bir sandbox çerçevesinde gösteriliyor:
 * panelin stilleri ona karışmıyor, onun bağlantıları panelde çalışmıyor.
 */
export default async function OzetOnizleme() {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");
  await Promise.all([semaKur(), outreachSemaKur()]);

  let sonuc: { aralik: string; konu: string; metin: string; html: string } | null = null;
  let hata: string | null = null;
  try {
    const aralik = await gecenHafta();
    const icerik = ozetIcerik(await ozetVerisi(aralik));
    sonuc = { aralik: aralikYazisi(aralik.bas, aralik.son), ...icerik };
  } catch (e) {
    hata = (e as Error).message;
  }

  return (
    <Kabuk aktif="genel" kullanici={ben}>
      <main className="max-w-3xl">
        <Link href="/admin/genel" className="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Genel bakış
        </Link>
        <h1 className="mt-4 font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">Haftalık özet — önizleme</h1>

        {hata ? (
          <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">Özet hazırlanamadı: {hata}</p>
        ) : sonuc ? (
          <>
            <p className="mt-1 text-sm text-muted">
              {sonuc.aralik} · pazartesi 08:30&apos;da giden e-postanın aynısı, şu anki sayılarla.
            </p>
            <p className="mt-4 break-words text-sm">
              <span className="text-muted">Konu: </span>
              <strong>{sonuc.konu}</strong>
            </p>
            <iframe
              title="Haftalık özet e-postası"
              srcDoc={sonuc.html}
              sandbox=""
              className="mt-3 h-[56rem] w-full rounded-xl border border-line bg-white"
            />
            <details className="mt-4 rounded-xl border border-line bg-card px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium">Düz metin hâli</summary>
              <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-muted">{sonuc.metin}</pre>
            </details>
          </>
        ) : null}
      </main>
    </Kabuk>
  );
}

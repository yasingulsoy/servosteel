import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { EtkinlikFormu, HizliKayitFormu } from "@/components/formlar";
import { IlgiEtiketleri, PotansiyelRozeti } from "@/components/rozet";
import { TakipSecici } from "@/components/takip-secici";
import { sayi, tarihAraligi } from "@/lib/bicim";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { ETKINLIK_TURU, TAKIP, TAKIP_RENK } from "@/lib/sabitler";
import { etkinlik, etkinlikler, etkinlikTemaslari, firma, ilgiAlanlari } from "@/lib/veri";
import { hizliKayit, takipDegistir } from "../../firmalar/actions";
import { etkinlikKaydet, etkinlikSil } from "../actions";

export async function generateMetadata(props: PageProps<"/etkinlikler/[id]">): Promise<Metadata> {
  const no = sayi((await props.params).id);
  const e = no ? await etkinlik(no) : null;
  return { title: e?.ad ?? "Etkinlik" };
}

export default async function EtkinlikSayfasi(props: PageProps<"/etkinlikler/[id]">) {
  const ben = await oturumZorunlu();
  const no = sayi((await props.params).id);
  const sp = await props.searchParams;
  if (!no) notFound();
  const e = await etkinlik(no);
  if (!e) notFound();

  const [temaslar, ilgiler, tumEtkinlikler] = await Promise.all([
    etkinlikTemaslari(no),
    ilgiAlanlari(),
    etkinlikler(),
  ]);
  const eklenenNo = sayi(sp.eklendi);
  const eklenen = eklenenNo ? await firma(eklenenNo) : null;
  const filtre = typeof sp.takip === "string" && sp.takip in TAKIP ? (sp.takip as keyof typeof TAKIP) : null;
  const gorunen = filtre ? temaslar.filter((t) => t.takip === filtre) : temaslar;
  const sayac = new Map<keyof typeof TAKIP, number>();
  for (const t of temaslar) sayac.set(t.takip, (sayac.get(t.takip) ?? 0) + 1);
  const firmaSayisi = new Set(temaslar.map((t) => t.firma_id)).size;
  const yaz = yazabilir(ben);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/etkinlikler" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft size={14} /> Etkinlikler
        </Link>
        <h1 className="mt-1 text-xl font-bold">{e.ad}</h1>
        <p className="text-sm text-muted">
          {ETKINLIK_TURU[e.tur]} · {tarihAraligi(e.baslangic, e.bitis)}
          {e.sehir ? ` · ${e.sehir}` : ""}
          {e.ulke ? `, ${e.ulke}` : ""}
          {e.yer ? ` · ${e.yer}` : ""}
        </p>
        {e.aciklama ? <p className="mt-2 max-w-3xl whitespace-pre-line text-sm">{e.aciklama}</p> : null}
      </div>

      {eklenen ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 size={16} />
          <span>
            {sp.mevcut ? "Mevcut firmaya eklendi: " : "Kaydedildi: "}
            <Link href={`/firmalar/${eklenen.id}`} className="font-semibold underline">
              {eklenen.ad}
            </Link>
          </span>
        </div>
      ) : null}

      {yaz ? (
        <details className="kart p-4" open={temaslar.length === 0 || Boolean(eklenen)}>
          <summary className="cursor-pointer text-sm font-semibold">Firma ekle</summary>
          <div className="mt-4">
            <HizliKayitFormu
              eylem={hizliKayit}
              ilgiler={ilgiler}
              etkinlikler={tumEtkinlikler}
              etkinlikId={e.id}
              geri="etkinlik"
            />
          </div>
        </details>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-sm font-bold uppercase tracking-wide text-muted">
            {firmaSayisi} firma · {temaslar.length} görüşme
          </h2>
          <Link
            href={`/etkinlikler/${e.id}`}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${filtre ? "bg-card ring-1 ring-line" : "bg-shell text-white"}`}
          >
            Hepsi
          </Link>
          {(Object.keys(TAKIP) as (keyof typeof TAKIP)[])
            .filter((k) => sayac.get(k))
            .map((k) => (
              <Link
                key={k}
                href={`/etkinlikler/${e.id}?takip=${k}`}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TAKIP_RENK[k]} ${filtre === k ? "ring-2 ring-zinc-900" : ""}`}
              >
                {TAKIP[k]} {sayac.get(k)}
              </Link>
            ))}
        </div>

        {gorunen.length === 0 ? (
          <p className="text-sm text-muted">Bu etkinlikte kayıtlı görüşme yok.</p>
        ) : (
          <div className="kart overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-3">Firma</th>
                  <th className="p-3">Kurum yetkilisi</th>
                  <th className="p-3">İlgi / talep</th>
                  <th className="p-3">Takip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {gorunen.map((t) => (
                  <tr key={t.id} className="align-top">
                    <td className="p-3">
                      <Link href={`/firmalar/${t.firma_id}`} className="font-semibold hover:underline">
                        {t.firma_ad}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        {t.firma_ulke ?? "ülke yok"}
                        <PotansiyelRozeti p={t.potansiyel} />
                      </div>
                    </td>
                    <td className="p-3">
                      <div>{t.kisi_ad ?? <span className="text-muted">—</span>}</div>
                      {t.kisi_unvan ? <div className="text-xs text-muted">{t.kisi_unvan}</div> : null}
                      {t.kisi_eposta ? (
                        <a href={`mailto:${t.kisi_eposta}`} className="block text-xs text-muted hover:underline">
                          {t.kisi_eposta}
                        </a>
                      ) : null}
                    </td>
                    <td className="max-w-md p-3">
                      <IlgiEtiketleri ilgiler={t.ilgiler} />
                      {t.talep ? <p className="mt-1">{t.talep}</p> : null}
                    </td>
                    <td className="p-3">
                      <TakipSecici
                        eylem={takipDegistir}
                        temasId={t.id}
                        takip={t.takip}
                        geri={`/etkinlikler/${e.id}${filtre ? `?takip=${filtre}` : ""}`}
                        yazabilir={yaz}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {yaz ? (
        <details className="kart p-4">
          <summary className="cursor-pointer text-sm font-semibold">Etkinlik bilgilerini düzenle</summary>
          <div className="mt-4 space-y-4">
            <EtkinlikFormu eylem={etkinlikKaydet} e={e} />
            {ben.rol === "yonetici" && temaslar.length === 0 ? (
              <form action={etkinlikSil}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className="dugme-tehlike">
                  Etkinliği sil
                </button>
              </form>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}

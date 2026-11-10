import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Inbox } from "lucide-react";
import { Rozet } from "@/components/rozet";
import { Bos, SayfaBasligi } from "@/components/sayfa";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { bekleyenYanit, yanitVerenler, type YanitVeren } from "@/lib/panelden";
import { crmeAlEylemi } from "./actions";

export const metadata: Metadata = { title: "Gelen yanıtlar" };

const DURUM: Record<string, [string, string]> = {
  olumlu: ["Olumlu", "bg-success-50 text-success-600"],
  yanit: ["Yanıt verdi", "bg-blue-light-50 text-blue-light-500"],
  red: ["İlgilenmiyor", "bg-error-50 text-error-600"],
  gonderildi: ["Mail gitti", "bg-gray-100 text-gray-700"],
};

const SEKMELER = [
  { kod: "crmsiz", ad: "CRM'de olmayan", suz: (y: YanitVeren) => bekleyenYanit(y) },
  { kod: "olumlu", ad: "Olumlu", suz: (y: YanitVeren) => y.durum === "olumlu" },
  { kod: "notr", ad: "Nötr", suz: (y: YanitVeren) => y.durum === "yanit" },
  { kod: "alindi", ad: "Alındı / otomatik", suz: (y: YanitVeren) => y.durum === "gonderildi" },
  { kod: "red", ad: "İlgilenmiyor", suz: (y: YanitVeren) => y.durum === "red" },
  { kod: "hepsi", ad: "Hepsi", suz: () => true },
] as const;

const tarihSaat = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" })
    : "—";

const kisa = (s: string | null, n: number) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : (s ?? ""));

export default async function YanitlarSayfasi(props: PageProps<"/yanitlar">) {
  const ben = await oturumZorunlu();
  const sp = await props.searchParams;
  const sekme = SEKMELER.find((s) => s.kod === sp.g) ?? SEKMELER[0];
  const hepsi = await yanitVerenler();
  const liste = hepsi.filter(sekme.suz);
  const geri = `/yanitlar?g=${sekme.kod}`;
  const yaz = yazabilir(ben);

  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi baslik="Gelen yanıtlar" yol={[]}>
        <p className="max-w-3xl text-sm text-gray-500">
          Tanıtım mailine yanıt veren firmalar. Satışa iletilenler CRM&apos;e kendiliğinden düşüyor; iletilmeden
          kalanlar burada &quot;CRM&apos;de olmayan&quot; sekmesinde bekler. Panelde &quot;alındı&quot; ya da otomatik yanıt
          diye işaretlenenler ayrı sekmede. &quot;CRM&apos;e al&quot; firmayı, yanıt
          veren kişiyi ve &quot;Yeni talep&quot; görüşmesini açar, yarına size bir &quot;yanıta dön&quot; görevi koyar.
        </p>
      </SayfaBasligi>

      <div className="sekmeler">
        {SEKMELER.map((s) => (
          <Link key={s.kod} href={`/yanitlar?g=${s.kod}`} className={`sekme ${sekme.kod === s.kod ? "sekme-etkin" : ""}`}>
            {s.ad} <span className="ms-1 tabular-nums opacity-70">{hepsi.filter(s.suz).length}</span>
          </Link>
        ))}
      </div>

      <section className="kart overflow-hidden">
        {liste.length === 0 ? (
          <Bos>
            <Inbox size={16} className="me-1.5 inline" />
            Bu sekmede firma yok.
          </Bos>
        ) : (
          <div className="overflow-x-auto">
            <table className="tablo min-w-[900px]">
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Son yanıt</th>
                  <th>Tarih</th>
                  <th>Durum</th>
                  <th className="text-right">CRM</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((y) => {
                  const [durumAd, durumRenk] = DURUM[y.durum] ?? [y.durum, "bg-gray-100 text-gray-700"];
                  const web = y.web ? (/^https?:\/\//i.test(y.web) ? y.web : `https://${y.web}`) : null;
                  return (
                    <tr key={y.id}>
                      <td className="align-top">
                        <div className="flex items-center gap-1.5 font-medium text-gray-800">
                          {y.firma}
                          {web ? (
                            <a href={web} target="_blank" rel="noreferrer noopener" className="text-gray-400 hover:text-brand-500" aria-label={`${y.firma} sitesi`}>
                              <ExternalLink size={13} />
                            </a>
                          ) : null}
                        </div>
                        <div className="text-theme-xs text-gray-500">
                          {y.ulke}
                          {y.segment ? ` · ${y.segment}` : ""}
                          {y.ilkMail ? ` · ilk mail ${new Date(`${y.ilkMail}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}` : ""}
                        </div>
                      </td>
                      <td className="max-w-[420px] align-top">
                        {y.konu ? <div className="truncate text-sm text-gray-800">{y.konu}</div> : null}
                        {y.ozet ? <div className="text-theme-xs text-gray-500">{kisa(y.ozet, 220)}</div> : null}
                        {!y.konu && !y.ozet && y.sonNot ? <div className="text-theme-xs text-gray-500">Not: {kisa(y.sonNot, 200)}</div> : null}
                        {y.kimden ? <div className="mt-0.5 truncate text-theme-xs text-gray-400">{y.kimden}</div> : null}
                      </td>
                      <td className="align-top whitespace-nowrap text-sm text-gray-600">
                        {tarihSaat(y.zaman)}
                        {y.adet > 1 ? <div className="text-theme-xs text-gray-400">{y.adet} yanıt</div> : null}
                      </td>
                      <td className="align-top">
                        <Rozet sinif={durumRenk}>{durumAd}</Rozet>
                      </td>
                      <td className="align-top text-right">
                        {y.crmId ? (
                          <Link href={`/firmalar/${y.crmId}`} className="dugme-kucuk whitespace-nowrap">
                            CRM&apos;de aç
                          </Link>
                        ) : yaz ? (
                          <form action={crmeAlEylemi}>
                            <input type="hidden" name="id" value={y.id} />
                            <input type="hidden" name="geri" value={geri} />
                            <button type="submit" className="dugme-kucuk whitespace-nowrap">
                              CRM&apos;e al
                            </button>
                          </form>
                        ) : (
                          <span className="text-theme-xs text-gray-400">CRM&apos;de yok</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

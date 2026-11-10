import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Inbox } from "lucide-react";
import { Rozet } from "@/components/rozet";
import { Bos, SayfaBasligi } from "@/components/sayfa";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { bekleyenYanit, yanitVerenler } from "@/lib/panelden";
import { bekleyenTalep, gelenTalepler, ulkeTurkce } from "@/lib/talepler";
import { crmeAlEylemi } from "./actions";

export const metadata: Metadata = { title: "Gelen talepler" };

/** Site formundan talep ya da tanıtım mailine yanıt: tek listede tek biçim. */
type Satir = {
  kaynak: "form" | "yanit";
  id: number;
  firma: string;
  alt: string;
  web: string | null;
  baslik: string;
  metin: string;
  kimden: string;
  zaman: string | null;
  durum: string;
  bekliyor: boolean;
  crmId: number | null;
};

const DURUM: Record<string, [string, string]> = {
  /* tanıtım yanıtı */
  olumlu: ["Olumlu", "bg-success-50 text-success-600"],
  yanit: ["Yanıt verdi", "bg-blue-light-50 text-blue-light-500"],
  red: ["İlgilenmiyor", "bg-error-50 text-error-600"],
  gonderildi: ["Alındı / otomatik", "bg-gray-100 text-gray-700"],
  /* site talebi */
  yeni: ["Yeni talep", "bg-warning-50 text-warning-600"],
  iletildi: ["Satışa iletildi", "bg-gray-100 text-gray-700"],
  ulasildi: ["Ulaşıldı", "bg-blue-light-50 text-blue-light-500"],
  bilgi_verildi: ["Bilgi verildi", "bg-blue-light-50 text-blue-light-500"],
  teklif_gonderildi: ["Teklif gönderildi", "bg-success-50 text-success-600"],
  kazanildi: ["Kazanıldı", "bg-success-50 text-success-600"],
  kaybedildi: ["Kaybedildi", "bg-error-50 text-error-600"],
};

const SEKMELER = [
  { kod: "bekleyen", ad: "CRM'de olmayan", suz: (s: Satir) => s.bekliyor },
  { kod: "form", ad: "Site formu", suz: (s: Satir) => s.kaynak === "form" },
  { kod: "olumlu", ad: "Olumlu yanıt", suz: (s: Satir) => s.kaynak === "yanit" && s.durum === "olumlu" },
  { kod: "notr", ad: "Nötr yanıt", suz: (s: Satir) => s.kaynak === "yanit" && s.durum === "yanit" },
  { kod: "alindi", ad: "Alındı / otomatik", suz: (s: Satir) => s.kaynak === "yanit" && s.durum === "gonderildi" },
  { kod: "red", ad: "İlgilenmiyor", suz: (s: Satir) => s.kaynak === "yanit" && s.durum === "red" },
  { kod: "hepsi", ad: "Hepsi", suz: () => true },
] as const;

const tarihSaat = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" })
    : "—";

const kisa = (s: string | null, n: number) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : (s ?? ""));
const webAdres = (w: string | null) => (w ? (/^https?:\/\//i.test(w) ? w : `https://${w}`) : null);

export default async function GelenTaleplerSayfasi(props: PageProps<"/yanitlar">) {
  const ben = await oturumZorunlu();
  const sp = await props.searchParams;
  const sekme = SEKMELER.find((s) => s.kod === sp.g) ?? SEKMELER[0];
  const [yanitlar, talepler] = await Promise.all([yanitVerenler(), gelenTalepler()]);

  const hepsi: Satir[] = [
    ...talepler.map<Satir>((t) => {
      const alan = t.eposta.split("@")[1] ?? "";
      return {
        kaynak: "form",
        id: t.id,
        firma: t.firma.trim() || alan || t.ad || "Firma yazılmamış",
        alt: [ulkeTurkce(t.ulke, t.dil), t.telefon].filter(Boolean).join(" · "),
        web: null,
        baslik: `Site formu · ${t.tur === "rfq" ? "teklif isteği" : "iletişim"}`,
        metin: t.mesaj,
        kimden: [t.ad, t.eposta && `<${t.eposta}>`].filter(Boolean).join(" "),
        zaman: t.zaman,
        durum: t.durum,
        bekliyor: bekleyenTalep(t),
        crmId: t.crmId,
      };
    }),
    ...yanitlar.map<Satir>((y) => ({
      kaynak: "yanit",
      id: y.id,
      firma: y.firma,
      alt: [y.ulke, y.segment, y.ilkMail && `ilk mail ${new Date(`${y.ilkMail}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}`]
        .filter(Boolean)
        .join(" · "),
      web: webAdres(y.web),
      baslik: y.konu ?? (y.sonNot ? "Panel notu" : "Tanıtım mailine yanıt"),
      metin: y.ozet ?? y.sonNot ?? "",
      kimden: y.kimden ?? "",
      zaman: y.zaman,
      durum: y.durum,
      bekliyor: bekleyenYanit(y),
      crmId: y.crmId,
    })),
  ].sort((a, b) => (b.zaman ?? "").localeCompare(a.zaman ?? ""));

  const liste = hepsi.filter(sekme.suz);
  const geri = `/yanitlar?g=${sekme.kod}`;
  const yaz = yazabilir(ben);

  return (
    <div className="space-y-4 md:space-y-6">
      <SayfaBasligi baslik="Gelen talepler" yol={[]}>
        <p className="max-w-3xl text-sm text-gray-500">
          Sitenin formundan gelen talepler ve tanıtım mailine verilen yanıtlar. Satışa iletilenler CRM&apos;e
          kendiliğinden düşüyor; iletilmeden kalanlar &quot;CRM&apos;de olmayan&quot; sekmesinde bekler. &quot;CRM&apos;e
          al&quot; firmayı, kişiyi ve görüşmeyi açar, yarına size bir &quot;dön&quot; görevi koyar.
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
            Bu sekmede kayıt yok.
          </Bos>
        ) : (
          <div className="overflow-x-auto">
            <table className="tablo min-w-[900px]">
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Talep / yanıt</th>
                  <th>Tarih</th>
                  <th>Durum</th>
                  <th className="text-right">CRM</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((s) => {
                  const [durumAd, durumRenk] = DURUM[s.durum] ?? [s.durum, "bg-gray-100 text-gray-700"];
                  return (
                    <tr key={`${s.kaynak}-${s.id}`}>
                      <td className="align-top">
                        <div className="flex items-center gap-1.5 font-medium text-gray-800">
                          {s.firma}
                          {s.web ? (
                            <a href={s.web} target="_blank" rel="noreferrer noopener" className="text-gray-400 hover:text-brand-500" aria-label={`${s.firma} sitesi`}>
                              <ExternalLink size={13} />
                            </a>
                          ) : null}
                        </div>
                        {s.alt ? <div className="text-theme-xs text-gray-500">{s.alt}</div> : null}
                      </td>
                      <td className="max-w-[440px] align-top">
                        <div className="flex items-center gap-1.5 text-sm text-gray-800">
                          <span className={`size-1.5 shrink-0 rounded-full ${s.kaynak === "form" ? "bg-warning-500" : "bg-blue-light-500"}`} />
                          <span className="truncate">{s.baslik}</span>
                        </div>
                        {s.metin ? <div className="text-theme-xs text-gray-500">{kisa(s.metin, 220)}</div> : null}
                        {s.kimden ? <div className="mt-0.5 truncate text-theme-xs text-gray-400">{s.kimden}</div> : null}
                      </td>
                      <td className="align-top whitespace-nowrap text-sm text-gray-600">{tarihSaat(s.zaman)}</td>
                      <td className="align-top">
                        <Rozet sinif={durumRenk}>{durumAd}</Rozet>
                      </td>
                      <td className="align-top text-right">
                        {s.crmId ? (
                          <Link href={`/firmalar/${s.crmId}`} className="dugme-kucuk whitespace-nowrap">
                            CRM&apos;de aç
                          </Link>
                        ) : yaz ? (
                          <form action={crmeAlEylemi}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="kaynak" value={s.kaynak} />
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

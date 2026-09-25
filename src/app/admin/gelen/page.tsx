import Link from "next/link";
import { redirect } from "next/navigation";
import { MailOpen, RefreshCw, TriangleAlert } from "lucide-react";
import { oturum } from "@/lib/admin-auth";
import { GELEN_SAYFA_BOYU, gelenDurumu, gelenListesi } from "@/lib/gelen-db";
import { outreachSemaKur } from "@/lib/outreach-db";
import { ayarlariOku } from "@/lib/outreach-kurallar";
import { goreli, tamTarih } from "@/lib/zaman";
import { Kabuk } from "../kabuk";
import { gelenTaraEylemi } from "../firmalar/actions";
import { GelenIleti } from "../firmalar/giden/gelen-ileti";

export const dynamic = "force-dynamic";

/**
 * Gelen kutusu — panelde kendi başlığı.
 *
 * Önceden "Giden" sayfasının bir sekmesiydi ve kimse bulamıyordu (Yasin,
 * 25 Eylül 2026: "geleni göremiyorum"). Gönderdiğimiz maillere gelen her
 * şey burada: yanıt, geri dönüş, abonelik iptali, otomatik cevap.
 *
 * İleti gövdesi veritabanında DURMUYOR — satırdaki "Mailin tamamını aç"
 * onu kutudan çeker (bkz. gelen-oku.ts). Kutuya dokunulmaz: okumak iletiyi
 * Thunderbird'de "okundu" yapmaz.
 */

type Arama = { kutu?: string; tur?: string; sayfa?: string };

const TUR_ETIKET: Record<string, string> = {
  yanit: "Yanıt",
  geri_donus: "Geri döndü",
  gecici: "Teslim gecikiyor",
  otomatik: "Otomatik yanıt",
  abonelik: "Abonelikten çıktı",
  ilgisiz: "İlgisiz",
};
const TUR_RENK: Record<string, string> = {
  yanit: "bg-violet-500/15 text-violet-700",
  geri_donus: "bg-red-500/15 text-red-700",
  gecici: "bg-amber-500/15 text-amber-800",
  otomatik: "bg-zinc-500/10 text-zinc-600",
  abonelik: "bg-amber-500/15 text-amber-800",
  ilgisiz: "bg-zinc-500/10 text-zinc-500",
};
/** Üstteki sayaçlar — soldan sağa önem sırası. */
const SAYAC = ["yanit", "geri_donus", "abonelik", "otomatik"] as const;

const qs = (p: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString();

export default async function GelenSayfasi({ searchParams }: { searchParams: Promise<Arama> }) {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");
  const sp = await searchParams;
  if (!(await outreachSemaKur())) redirect("/admin/firmalar");

  const ayar = ayarlariOku(process.env);
  const kutular = ayar.kutular.map((k) => k.user);
  const kutu = sp.kutu && /^[^\s@]+@[^\s@]+$/.test(sp.kutu) ? sp.kutu : undefined;
  const sayfa = Math.max(1, Math.floor(Number(sp.sayfa)) || 1);

  const [liste, durum] = await Promise.all([
    gelenListesi({ kutu, tur: sp.tur, hepsi: sp.tur === "ilgisiz" }, sayfa),
    gelenDurumu(0),
  ]);
  const sayfaSayisi = Math.max(1, Math.ceil(liste.toplam / GELEN_SAYFA_BOYU));
  const sayfaLinki = (n: number) =>
    `/admin/gelen?${qs({ kutu, tur: sp.tur, sayfa: n > 1 ? n : undefined })}`;
  /* Taraması hata vermiş kutular — sessizce durmasın. */
  const bozuk = durum.kutular.filter((k) => k.son_hata);

  return (
    <Kabuk aktif="gelen" kullanici={ben}>
      <main>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">Gelen kutusu</h1>
          <form action={gelenTaraEylemi}>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:bg-surface-alt">
              <RefreshCw className="size-4" aria-hidden /> Şimdi tara
            </button>
          </form>
        </div>
        <p className="mt-1 text-sm text-muted">
          Tanıtım e-postalarına gelen her şey. Kutular dakikada bir kendiliğinden taranıyor; okumak
          iletiyi kutuda &ldquo;okundu&rdquo; yapmaz.
        </p>

        {bozuk.length ? (
          <p className="mt-3 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
            <span>
              Tarama hatası — {bozuk.map((k) => `${k.kutu}: ${k.son_hata}`).join(" · ")}
            </span>
          </p>
        ) : null}

        {/* Bugün işlenenler: tıklanınca o türe süzer */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SAYAC.map((t) => {
            const secili = sp.tur === t;
            return (
              <Link
                key={t}
                href={`/admin/gelen?${qs({ kutu, tur: secili ? undefined : t })}`}
                aria-current={secili ? "true" : undefined}
                className={`rounded-xl border px-3 py-2.5 transition-colors ${
                  secili ? "border-accent bg-surface-alt" : "border-line bg-card hover:bg-surface-alt"
                }`}
              >
                <span className="block text-xs text-muted">{TUR_ETIKET[t]} · bugün</span>
                <span className="mt-0.5 block font-display text-2xl font-bold tabular-nums">
                  {durum.bugun[t] ?? 0}
                </span>
              </Link>
            );
          })}
        </div>

        <form className="mt-4 flex flex-wrap items-end gap-2 text-sm" action="/admin/gelen">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Kutu</span>
            <select name="kutu" defaultValue={kutu ?? ""} className="rounded-lg border border-line bg-card px-2.5 py-2">
              <option value="">Bütün kutular</option>
              {kutular.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Tür</span>
            <select name="tur" defaultValue={sp.tur ?? ""} className="rounded-lg border border-line bg-card px-2.5 py-2">
              <option value="">Hepsi (ilgisizler hariç)</option>
              {Object.entries(TUR_ETIKET).map(([k, ad]) => (
                <option key={k} value={k}>
                  {ad}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-lg bg-shell px-3.5 py-2 font-semibold text-white">Süz</button>
          <span className="ml-auto text-muted">{liste.toplam.toLocaleString("tr-TR")} ileti</span>
        </form>

        {liste.satirlar.length ? (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-card">
            {liste.satirlar.map((g) => (
              <li key={`${g.kutu}-${g.uidvalidity}-${g.uid}`} className="p-3.5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                  <span className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TUR_RENK[g.tur] ?? ""}`}>
                    {TUR_ETIKET[g.tur] ?? g.tur}
                  </span>
                  <span className="min-w-0 flex-1 break-words">
                    {g.firma_id ? (
                      <Link href={`/admin/firmalar/${g.firma_id}`} className="font-semibold underline-offset-4 hover:underline">
                        {g.firma ?? g.kimden}
                      </Link>
                    ) : (
                      <span className="font-semibold">{g.kimden}</span>
                    )}
                    <span className="text-muted"> — {g.konu}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {g.kimden} → {g.kutu} · <span title={tamTarih(g.islendi)}>{goreli(g.islendi)}</span>
                  </span>
                </div>
                <GelenIleti
                  kutu={g.kutu}
                  uidvalidity={g.uidvalidity}
                  uid={g.uid}
                  ozet={g.ozet ?? ""}
                  firmaId={g.firma_id ?? null}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-line bg-card px-4 py-12 text-center text-sm text-muted">
            <MailOpen className="size-6 opacity-40" aria-hidden />
            {sp.tur || kutu ? "Bu süzgeçte ileti yok." : "Henüz işlenen gelen e-posta yok."}
          </p>
        )}

        {sayfaSayisi > 1 ? (
          <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Sayfalar">
            {sayfa > 1 ? (
              <Link href={sayfaLinki(sayfa - 1)} className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface-alt">
                ← Önceki
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted">
              {sayfa} / {sayfaSayisi}
            </span>
            {sayfa < sayfaSayisi ? (
              <Link href={sayfaLinki(sayfa + 1)} className="rounded-lg border border-line px-3 py-1.5 hover:bg-surface-alt">
                Sonraki →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}

        <p className="mt-6 text-xs text-muted">
          Giden e-postalar ayrı sayfada:{" "}
          <Link href="/admin/firmalar/giden" className="underline underline-offset-4">
            Giden kutusu
          </Link>
        </p>
      </main>
    </Kabuk>
  );
}

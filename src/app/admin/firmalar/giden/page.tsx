import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { oturum } from "@/lib/admin-auth";
import { GELEN_SAYFA_BOYU, gelenListesi } from "@/lib/gelen-db";
import { GIDEN_SAYFA_BOYU, gidenListesi, outreachSemaKur } from "@/lib/outreach-db";
import { ayarlariOku } from "@/lib/outreach-kurallar";
import { cidleriAdreseCevir } from "@/lib/eposta-sablon";
import { goreli, tamTarih } from "@/lib/zaman";
import { Kabuk } from "../../kabuk";
import { SONUC_ETIKET } from "../firma-listesi";

export const dynamic = "force-dynamic";

/**
 * Giden / Gelen — tanıtım e-postalarının kutusu.
 *
 * Giden: her gönderim denemesi (hangi kutudan, kime, sonuç, sunucunun cevabı);
 * e-posta alıcının gördüğü gibi açılır (HTML, yalıtılmış çerçevede — içindeki
 * hiçbir betik çalışmaz). Gelen: gönderen kutularına gelip işlenen yanıt,
 * geri dönüş, abonelik iptali ve otomatik yanıtlar (bkz. gelen-tarama.ts).
 */

type Arama = { sekme?: string; kutu?: string; sonuc?: string; tur?: string; sayfa?: string };

const SONUC_RENK: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-700",
  hata: "bg-red-500/15 text-red-700",
  alici: "bg-amber-500/15 text-amber-800",
  belirsiz: "bg-amber-500/15 text-amber-800",
};
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

const qs = (p: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString();

export default async function GidenSayfasi({ searchParams }: { searchParams: Promise<Arama> }) {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");
  const sp = await searchParams;
  if (!(await outreachSemaKur())) redirect("/admin/firmalar");

  const sekme = sp.sekme === "gelen" ? "gelen" : "giden";
  const kutular = ayarlariOku(process.env).kutular.map((k) => k.user);
  const kutu = sp.kutu && /^[^\s@]+@[^\s@]+$/.test(sp.kutu) ? sp.kutu : undefined;
  const sayfa = Math.max(1, Math.floor(Number(sp.sayfa)) || 1);

  const giden = sekme === "giden" ? await gidenListesi({ kutu, sonuc: sp.sonuc }, sayfa) : null;
  const gelen =
    sekme === "gelen" ? await gelenListesi({ kutu, tur: sp.tur, hepsi: sp.tur === "ilgisiz" }, sayfa) : null;
  const toplam = giden?.toplam ?? gelen?.toplam ?? 0;
  const boyut = sekme === "giden" ? GIDEN_SAYFA_BOYU : GELEN_SAYFA_BOYU;
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / boyut));

  const sekmeLinki = (s: string) => `/admin/firmalar/giden?${qs({ sekme: s, kutu })}`;
  const sayfaLinki = (n: number) =>
    `/admin/firmalar/giden?${qs({ sekme, kutu, sonuc: sp.sonuc, tur: sp.tur, sayfa: n > 1 ? n : undefined })}`;

  return (
    <Kabuk aktif="firmalar" kullanici={ben}>
      <main>
        <Link href="/admin/firmalar" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Hedef firmalar
        </Link>
        <h1 className="mt-2 font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">Giden ve gelen</h1>

        <nav className="mt-4 flex gap-1 border-b border-line text-sm" aria-label="Sekmeler">
          {[
            ["giden", "Giden"],
            ["gelen", "Gelen"],
          ].map(([k, ad]) => (
            <Link
              key={k}
              href={sekmeLinki(k)}
              aria-current={sekme === k ? "page" : undefined}
              className={`-mb-px border-b-2 px-3 py-2 font-semibold ${
                sekme === k ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {ad}
            </Link>
          ))}
        </nav>

        <form className="mt-4 flex flex-wrap items-end gap-2 text-sm" action="/admin/firmalar/giden">
          <input type="hidden" name="sekme" value={sekme} />
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
          {sekme === "giden" ? (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">Sonuç</span>
              <select name="sonuc" defaultValue={sp.sonuc ?? ""} className="rounded-lg border border-line bg-card px-2.5 py-2">
                <option value="">Hepsi</option>
                {Object.entries(SONUC_ETIKET).map(([k, ad]) => (
                  <option key={k} value={k}>
                    {ad}
                  </option>
                ))}
              </select>
            </label>
          ) : (
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
          )}
          <button className="rounded-lg bg-shell px-3.5 py-2 font-semibold text-white">Süz</button>
          <span className="ml-auto text-muted">{toplam.toLocaleString("tr-TR")} kayıt</span>
        </form>

        {giden ? (
          giden.satirlar.length ? (
            <ul className="mt-4 space-y-2">
              {giden.satirlar.map((g) => (
                <li key={g.id} className="rounded-xl border border-line bg-card">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-col gap-1 p-3.5 sm:flex-row sm:items-center sm:gap-3">
                      <span className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${SONUC_RENK[g.sonuc] ?? ""}`}>
                        {SONUC_ETIKET[g.sonuc] ?? g.sonuc}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold">{g.firma ?? g.eposta}</span>
                        <span className="text-muted"> — {g.konu}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {g.gonderen || "—"} → {g.eposta} ·{" "}
                        <span title={tamTarih(g.zaman)}>{goreli(g.zaman)}</span> · {g.kullanici}
                      </span>
                    </summary>
                    <div className="border-t border-line p-3.5">
                      {g.govde_html ? (
                        /* Alıcının gördüğü hâli. Betik yok (allow-scripts verilmedi); allow-same-origin
                           yalnızca /eposta/ görselleri yüklensin diye (bkz. gonder-kutusu.tsx) */
                        <iframe
                          title={`E-posta: ${g.konu}`}
                          sandbox="allow-same-origin"
                          /* Gömülü görseller (cid) çerçevede çözülmez — aynı dosyalar /eposta/ adresinden */
                          srcDoc={cidleriAdreseCevir(g.govde_html)}
                          className="h-[36rem] w-full rounded-lg border border-line bg-white"
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap break-words rounded-lg border border-line bg-white p-3 font-sans text-sm text-zinc-800">
                          {g.govde}
                        </pre>
                      )}
                      <p className="mt-2 break-words text-xs text-muted">
                        Sunucu: {g.yanit || "—"}
                        {g.firma_id ? (
                          <>
                            {" · "}
                            <Link href={`/admin/firmalar/${g.firma_id}`} className="underline underline-offset-4">
                              firma sayfası
                            </Link>
                          </>
                        ) : null}
                      </p>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl border border-line bg-card px-4 py-12 text-center text-sm text-muted">
              Bu süzgeçte gönderim yok.
            </p>
          )
        ) : null}

        {gelen ? (
          gelen.satirlar.length ? (
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-card">
              {gelen.satirlar.map((g) => (
                <li key={`${g.kutu}-${g.uid}`} className="flex flex-col gap-1 p-3.5 sm:flex-row sm:items-baseline sm:gap-3">
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
                    {g.ozet ? <span className="mt-0.5 block text-sm text-muted">{g.ozet.slice(0, 300)}</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {g.kimden} → {g.kutu} · <span title={tamTarih(g.islendi)}>{goreli(g.islendi)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-xl border border-line bg-card px-4 py-12 text-center text-sm text-muted">
              Henüz işlenen gelen e-posta yok.
            </p>
          )
        ) : null}

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
      </main>
    </Kabuk>
  );
}

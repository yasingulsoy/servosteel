import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { oturum } from "@/lib/admin-auth";
import {
  HEDEF_DURUMLAR,
  HEDEF_DURUM_ETIKET,
  KATEGORI_ADI,
  ayniAdreseGiden,
  engelliMi,
  firmaEngeli,
  geriDonusDurumu,
  gonderimler,
  hedefFirma,
  hedefNotlar,
  hedefTalepleri,
  kutuDurumlari,
  outreachSemaKur,
  siradaki,
} from "@/lib/outreach-db";
import { ayarlariOku, geriDonusEngeli, kutuSec, ulkeUyarisi } from "@/lib/outreach-kurallar";
import { altbilgiMetni, iptalAdresi } from "@/lib/outreach";
import { goreli, tamTarih } from "@/lib/zaman";
import { Kabuk } from "../../kabuk";
import { engelleEylemi, hedefDurumEylemi, hedefNotEylemi } from "../actions";
import { HedefRozet, SONUC_ETIKET } from "../firma-listesi";
import { GonderKutusu } from "../gonder-kutusu";

export const dynamic = "force-dynamic";

/** Hücredeki ilk http(s) adresi — `javascript:` gibi şemalar bağlantı olmasın. */
function ilkUrl(s: string): string | null {
  const m = /https?:\/\/[^\s|)]+/i.exec(s);
  return m ? m[0].replace(/[.,;]+$/, "") : null;
}

export default async function FirmaSayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ grup?: string; ulke?: string; segment?: string }>;
}) {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");

  const { id } = await params;
  const no = Number(id);
  if (!Number.isInteger(no)) notFound();
  const sp = await searchParams;
  const filtre = { grup: sp.grup || undefined, ulke: sp.ulke || undefined, segment: sp.segment || undefined };
  const surekli = new URLSearchParams(
    Object.entries(filtre).filter((x): x is [string, string] => !!x[1])
  ).toString();

  if (!(await outreachSemaKur())) notFound();
  const f = await hedefFirma(no);
  if (!f) notFound();

  const ayar = ayarlariOku(process.env);
  const [gecmis, notlar, engelli, onceki, kutular, sonraki, gd, talepleri] = await Promise.all([
    gonderimler(no),
    hedefNotlar(no),
    engelliMi(f.eposta),
    ayniAdreseGiden(f.eposta, f.id),
    kutuDurumlari(ayar.kutular),
    siradaki(filtre, no),
    geriDonusDurumu(),
    hedefTalepleri(no),
  ]);

  /* Düğmeyi kapatan sebep — önce firmaya ait olanlar, sonra güne ait olanlar.
     Sunucu eylemi hepsini AYRICA kontrol ediyor; burası kullanıcıya boşuna
     tıklatmamak için. */
  const secim = kutuSec(ayar, kutular.kutu, kutular.alan);
  const engel =
    firmaEngeli(f, engelli, onceki) ??
    (ayar.eksik.length ? `Gönderim ayarları eksik: ${ayar.eksik.join(", ")}.` : null) ??
    geriDonusEngeli(gd.toplam, gd.hatali) ??
    (secim.uygun.length || secim.bekle !== null ? null : secim.sebep);
  const bekleSn = secim.uygun.length ? 0 : (secim.bekle ?? 0);
  /* Önizlemede gösterilen gönderen: şimdi seçilecek kutu (aralık bekleniyorsa ilk boşalacak).
     Gönderim anında yeniden seçilir — arada başkası gönderdiyse başka kutudan gidebilir. */
  const siradakiKutu =
    secim.uygun[0] ??
    secim.satirlar.filter((x) => x.bekle !== null).sort((a, b) => (a.bekle ?? 0) - (b.bekle ?? 0))[0]?.kutu ??
    ayar.kutular[0];
  const gonderenYazisi = siradakiKutu
    ? `${siradakiKutu.ad} <${siradakiKutu.user}>` +
      (ayar.kutular.length > 1 ? ` · ${ayar.kutular.length} kutudan sırayla` : "")
    : "(gönderen kutusu tanımlı değil — OUTREACH_SMTP_USER)";

  const web = ilkUrl(f.web);
  const kanit = ilkUrl(f.kanit);

  const satir = (etiket: string, deger: React.ReactNode) =>
    deger ? (
      <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-3">
        <dt className="shrink-0 text-xs text-muted sm:w-32 sm:text-sm">{etiket}</dt>
        <dd className="min-w-0 break-words text-sm font-medium">{deger}</dd>
      </div>
    ) : null;
  const dis = (url: string, yazi?: string) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="break-all underline-offset-4 hover:underline">
      {yazi ?? url}
    </a>
  );

  return (
    <Kabuk aktif="firmalar" kullanici={ben}>
      <main>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/admin/firmalar${surekli ? `?${surekli}` : ""}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Hedef firmalar
          </Link>
          {sonraki ? (
            <Link
              href={`/admin/firmalar/${sonraki}${surekli ? `?${surekli}` : ""}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            >
              Sıradaki gönderilebilir firma
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-start gap-3">
          {/* BÜYÜK HARF YOK: panel `lang="tr"`, CSS büyütmesi Türkçe kuralla
              yapılıyor ve "Processing" → "PROCESSİNG" oluyordu. Firma adları
              yabancı; yazıldığı gibi gösteriliyor. */}
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{f.firma}</h1>
          <HedefRozet durum={f.durum} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {[f.ulke, f.segmentler, `e-posta dili: ${f.dil}`].filter(Boolean).join(" · ")}
          {!f.listede ? " · son aktarımda listede yoktu" : ""}
        </p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">
            {f.kategori}. {KATEGORI_ADI[f.kategori] ?? "—"}
          </span>
          {f.kategori_notu ? <span className="text-muted"> — {f.kategori_notu}</span> : null}
        </p>

        {talepleri.length ? (
          <section className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900">
            <p className="font-semibold">Bu firma talep bıraktı ({talepleri.length})</p>
            <ul className="mt-1.5 space-y-1">
              {talepleri.map((t) => (
                <li key={t.id}>
                  <Link href={`/admin/talep/${t.id}`} className="underline-offset-4 hover:underline">
                    {tamTarih(t.olusturuldu)} · {t.ad || t.eposta} · {t.tur === "rfq" ? "teklif formu" : "iletişim"}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-6 flex flex-col gap-7 xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start xl:gap-6">
          <div className="flex min-w-0 flex-col gap-7">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">E-posta</h2>
              <div className="mt-2">
                <GonderKutusu
                  key={f.id}
                  id={f.id}
                  gonderen={gonderenYazisi}
                  alici={f.eposta}
                  konu={f.konu}
                  govde={f.govde}
                  altbilgi={altbilgiMetni(f.dil, iptalAdresi(f.iptal_anahtari))}
                  engel={engel}
                  bekleSn={bekleSn}
                  uyari={ulkeUyarisi(f.ulke)}
                  grup={filtre.grup}
                  ulke={filtre.ulke}
                  segment={filtre.segment}
                />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Gönderim geçmişi ({gecmis.length})
              </h2>
              {gecmis.length ? (
                <ul className="mt-3 space-y-3">
                  {gecmis.map((g) => (
                    <li key={g.id} className="rounded-xl border border-line bg-card p-4">
                      <p className="text-sm">
                        <span
                          className={`font-semibold ${
                            g.sonuc === "ok" ? "text-emerald-700" : g.sonuc === "belirsiz" ? "text-amber-700" : "text-red-700"
                          }`}
                        >
                          {SONUC_ETIKET[g.sonuc] ?? g.sonuc}
                        </span>
                        <span className="text-muted">
                          {" · "}
                          <span title={tamTarih(g.zaman)}>{goreli(g.zaman)}</span> · {g.kullanici} · {g.eposta}
                          {g.gonderen ? ` · ${g.gonderen} kutusundan` : ""}
                        </span>
                      </p>
                      {g.yanit ? <p className="mt-1 break-words text-xs text-muted">Sunucu: {g.yanit}</p> : null}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">Giden metin</summary>
                        <p className="mt-2 text-sm font-semibold">{g.konu}</p>
                        <pre className="mt-1 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-muted">
                          {g.govde}
                        </pre>
                      </details>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">Bu firmaya henüz e-posta gönderilmedi.</p>
              )}
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Notlar ({notlar.length})</h2>
              <form action={hedefNotEylemi} className="mt-3">
                <input type="hidden" name="id" value={f.id} />
                <textarea
                  name="govde"
                  rows={3}
                  required
                  placeholder="Ne cevap verdi, kiminle konuşuldu, sıradaki adım ne?"
                  className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base outline-none focus-visible:border-accent sm:text-sm"
                />
                <button className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950 sm:w-auto">
                  Not ekle
                </button>
              </form>
              <ul className="mt-5 space-y-3">
                {notlar.map((n) => (
                  <li key={n.id} className="rounded-xl border border-line bg-card p-4">
                    <p className="text-xs text-muted">
                      <span title={tamTarih(n.olusturuldu)}>{goreli(n.olusturuldu)}</span>
                      {n.yazan ? ` · ${n.yazan}` : ""}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed">{n.govde}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-line bg-card p-4 sm:p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Durum</h2>
              <p className="mt-1 text-xs text-muted">
                Yanıt gelince buradan işaretleyin — sonuç sayaçları bu durumlardan hesaplanıyor.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {HEDEF_DURUMLAR.map((d) => (
                  <form key={d} action={hedefDurumEylemi}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="durum" value={d} />
                    <button
                      className={`rounded-full px-3 py-2 text-sm font-medium ${
                        f.durum === d ? "bg-shell text-white" : "border border-line active:bg-surface-alt"
                      }`}
                    >
                      {HEDEF_DURUM_ETIKET[d]}
                    </button>
                  </form>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-line bg-card px-4 py-2 sm:px-5 sm:py-3">
              <dl className="divide-y divide-line">
                {satir("E-posta", f.eposta ? `${f.eposta}${engelli ? " (engelli)" : ""}` : "")}
                {satir("İletişim notu", f.iletisim !== f.eposta ? f.iletisim : "")}
                {satir("Web sitesi", web ? dis(web) : f.web)}
                {satir("Doğrulama", kanit ? dis(kanit, "kaynak sayfa") : f.kanit)}
                {satir("Ne üretiyor", f.urun)}
                {satir("Ülke", f.ulke)}
                {satir("Segment", f.segmentler)}
                {satir("E-postadaki bağlantı", f.link ? dis(f.link, f.link.replace(/^https:\/\/[^/]+/, "").split("?")[0] || "/") : "")}
                {satir("Listeye girdi", tamTarih(f.olusturuldu))}
              </dl>
            </section>

            {f.eposta && !engelli ? (
              <details className="rounded-xl border border-line bg-card px-4 py-3 text-sm sm:px-5">
                <summary className="cursor-pointer font-medium text-red-700">Bu adresi engelle…</summary>
                <p className="mt-2 text-muted">
                  “Bize yazmayın” diyen ya da yanlış kişiye gittiği anlaşılan adres. Engel listesindeki adrese
                  panelden bir daha e-posta gitmez; geri almak için düğme yok.
                </p>
                <form action={engelleEylemi} className="mt-3">
                  <input type="hidden" name="id" value={f.id} />
                  <button className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white">
                    Evet, {f.eposta} adresini engelle
                  </button>
                </form>
              </details>
            ) : null}
          </div>
        </div>
      </main>
    </Kabuk>
  );
}

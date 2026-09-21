import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CircleCheck, Search, ShieldAlert, TriangleAlert } from "lucide-react";
import { oturum, rolu } from "@/lib/admin-auth";
import {
  HEDEF_DURUMLAR,
  HEDEF_DURUM_ETIKET,
  SAYFA_BOYU,
  bugunGonderilen,
  gonderimDurumu,
  hedefFirmalar,
  hedefOzeti,
  outreachSemaKur,
  segmentListesi,
  siradaki,
  sonGonderimler,
  ulkeListesi,
  type HedefFiltre,
} from "@/lib/outreach-db";
import { ayarlariOku } from "@/lib/outreach-kurallar";
import { goreli, tamTarih } from "@/lib/zaman";
import { Kabuk } from "../kabuk";
import { sigortaSifirlaEylemi } from "./actions";
import { FirmaListesi, SONUC_ETIKET } from "./firma-listesi";

export const dynamic = "force-dynamic";

type Arama = {
  durum?: string;
  ulke?: string;
  segment?: string;
  ara?: string;
  goster?: string;
  sayfa?: string;
};

/** Boş olmayan parametrelerden sorgu dizesi. */
function qs(p: Record<string, string | number | undefined>): string {
  return new URLSearchParams(
    Object.entries(p)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString();
}

async function veriGetir(filtre: HedefFiltre, sayfa: number, ben: string) {
  try {
    const [liste, ozet, ulkeler, segmentler, bugun, durum, son, ilk, rol] = await Promise.all([
      hedefFirmalar(filtre, sayfa),
      hedefOzeti(),
      ulkeListesi(),
      segmentListesi(),
      bugunGonderilen(),
      gonderimDurumu(),
      sonGonderimler(8),
      siradaki(filtre),
      rolu(ben),
    ]);
    return {
      v: { liste, ozet, ulkeler, segmentler, bugun, durum, son, ilk, admin: rol === "admin" },
      hata: null,
    };
  } catch (e) {
    return { v: null, hata: (e as Error).message };
  }
}

export default async function FirmalarSayfasi({
  searchParams,
}: {
  searchParams: Promise<Arama>;
}) {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");
  const sp = await searchParams;

  if (!(await outreachSemaKur())) {
    return (
      <Kabuk aktif="firmalar" kullanici={ben}>
        <main className="max-w-2xl">
          <h1 className="font-display text-2xl font-bold uppercase">Veritabanı bağlı değil</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Hedef firmalar veritabanında tutuluyor; <code>DATABASE_URL</code> olmadan bu sayfa çalışmaz.
          </p>
        </main>
      </Kabuk>
    );
  }

  const filtre: HedefFiltre = {
    durum: sp.durum || undefined,
    ulke: sp.ulke || undefined,
    segment: sp.segment || undefined,
    ara: sp.ara?.trim() || undefined,
    goster: sp.goster || undefined,
  };
  const sayfa = Math.max(1, Math.floor(Number(sp.sayfa)) || 1);
  const ayar = ayarlariOku(process.env);

  const { v, hata } = await veriGetir(filtre, sayfa, ben);

  /* Detay sayfasına süzgeç taşınıyor: "Sıradaki firma" aynı ülke/segmentte kalsın. */
  const surekli = qs({ ulke: filtre.ulke, segment: filtre.segment });
  const sayfaQs = (n: number) => qs({ ...filtre, sayfa: n > 1 ? n : undefined });

  return (
    <Kabuk aktif="firmalar" kullanici={ben}>
      <main>
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">
              Hedef firmalar
            </h1>
            {v ? (
              <p className="mt-0.5 text-sm text-muted">
                {v.ozet.toplam} firma · {v.ozet.epostali} e-postalı · {v.ozet.gonderilebilir} gönderilebilir
              </p>
            ) : null}
          </div>
          {v?.ilk ? (
            <Link
              href={`/admin/firmalar/${v.ilk}${surekli ? `?${surekli}` : ""}`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950"
            >
              Sıradaki firmayı aç
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </header>

        {hata ? (
          <p className="mt-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            Veritabanı hatası: {hata}
          </p>
        ) : null}

        {v ? (
          <>
            {/* ------------------------------------------ gönderim durumu */}
            {ayar.eksik.length ? (
              <section className="mt-5 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Gönderim kapalı — ayarlar eksik</p>
                  <p className="mt-1">
                    {ayar.eksik.join(" · ")}. Canlıda Dokploy → Environment bölümüne eklenip uygulama
                    yeniden dağıtılınca açılır. Liste ve önizleme şimdiden çalışır.
                  </p>
                </div>
              </section>
            ) : v.durum.durdu_bitis && new Date(v.durum.durdu_bitis) > new Date(v.durum.simdi) ? (
              <section className="mt-5 flex gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3.5 text-sm text-red-800">
                <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Gönderim durdu — {tamTarih(v.durum.durdu_bitis)}&apos;de kendiliğinden açılır
                  </p>
                  <p className="mt-1 break-words">{v.durum.durdu_sebep}</p>
                  {v.admin ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium underline-offset-4 hover:underline">
                        Sigortayı şimdi kaldır…
                      </summary>
                      <p className="mt-2">
                        Yalnızca sebep giderildiyse (ör. parola düzeltildi). Hız sınırı ya da spam engeli
                        yüzünden durduysa beklemek gerekir; üstüne gitmek kutuyu kara listeye sokar.
                      </p>
                      <form action={sigortaSifirlaEylemi} className="mt-2">
                        <button className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white">
                          Evet, gönderimi aç
                        </button>
                      </form>
                    </details>
                  ) : null}
                </div>
              </section>
            ) : (
              <section className="mt-5 flex gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900">
                <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
                <p>
                  Gönderime hazır · gönderen <b>{ayar.gondericiAdi}</b> &lt;{ayar.user}&gt; · günde en çok{" "}
                  {ayar.gunlukTavan}, iki e-posta arası en az {ayar.aralikSn} sn
                </p>
              </section>
            )}

            {/* ------------------------------------------------ sayaçlar */}
            <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {(() => {
                const yanit =
                  (v.ozet.durum.yanit ?? 0) + (v.ozet.durum.olumlu ?? 0) + (v.ozet.durum.red ?? 0);
                const oran = v.ozet.gonderilen ? Math.round((yanit / v.ozet.gonderilen) * 100) : 0;
                return [
                  { etiket: "Bugün", deger: `${v.bugun}/${ayar.gunlukTavan}`, alt: "gönderilen / tavan" },
                  { etiket: "Gönderilen", deger: v.ozet.gonderilen, alt: "firma, toplam" },
                  { etiket: "Yanıt", deger: yanit, alt: v.ozet.gonderilen ? `%${oran} yanıt oranı` : "henüz gönderim yok" },
                  { etiket: "Olumlu", deger: v.ozet.durum.olumlu ?? 0, alt: "görüşmeye dönen" },
                ];
              })().map((k) => (
                <div key={k.etiket} className="rounded-xl border border-line bg-card p-3.5">
                  <p className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted">
                    {k.etiket}
                  </p>
                  <p className="mt-1 font-display text-2xl font-extrabold leading-none sm:text-3xl">{k.deger}</p>
                  <p className="mt-1 text-[11px] text-muted">{k.alt}</p>
                </div>
              ))}
            </section>

            {/* ------------------------------------------------- süzgeç */}
            <form action="/admin/firmalar" className="mt-6 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
              <select
                name="durum"
                defaultValue={filtre.durum ?? ""}
                aria-label="Durum"
                className="rounded-lg border border-line bg-card px-3 py-2.5 text-base sm:text-sm"
              >
                <option value="">Tüm durumlar</option>
                {HEDEF_DURUMLAR.map((d) => (
                  <option key={d} value={d}>
                    {HEDEF_DURUM_ETIKET[d]} ({v.ozet.durum[d] ?? 0})
                  </option>
                ))}
              </select>
              <select
                name="ulke"
                defaultValue={filtre.ulke ?? ""}
                aria-label="Ülke"
                className="rounded-lg border border-line bg-card px-3 py-2.5 text-base sm:text-sm"
              >
                <option value="">Tüm ülkeler</option>
                {v.ulkeler.map((u) => (
                  <option key={u.ulke} value={u.ulke}>
                    {u.ulke} ({u.adet})
                  </option>
                ))}
              </select>
              <select
                name="segment"
                defaultValue={filtre.segment ?? ""}
                aria-label="Segment"
                className="rounded-lg border border-line bg-card px-3 py-2.5 text-base sm:text-sm"
              >
                <option value="">Tüm segmentler</option>
                {v.segmentler.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                name="ara"
                type="search"
                defaultValue={filtre.ara ?? ""}
                placeholder="Firma, e-posta, site, ürün…"
                className="min-w-0 rounded-lg border border-line bg-card px-3 py-2.5 text-base outline-none focus-visible:border-accent sm:text-sm lg:w-64"
              />
              <label className="flex items-center gap-2 px-1 text-sm">
                <input
                  type="checkbox"
                  name="goster"
                  value="gonderilebilir"
                  defaultChecked={filtre.goster === "gonderilebilir"}
                  className="size-4 accent-[var(--color-accent)]"
                />
                Yalnızca gönderilebilir
              </label>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-sm font-medium active:bg-surface-alt">
                  <Search className="size-4" strokeWidth={2.2} aria-hidden />
                  Süz
                </button>
                {qs({ ...filtre }) ? (
                  <Link
                    href="/admin/firmalar"
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted"
                  >
                    Temizle
                  </Link>
                ) : null}
              </div>
            </form>

            <p className="mt-4 text-sm text-muted">
              {v.liste.toplam} sonuç
              {v.liste.toplam > SAYFA_BOYU
                ? ` · sayfa ${sayfa}/${Math.ceil(v.liste.toplam / SAYFA_BOYU)}`
                : ""}
            </p>

            <div className="mt-3">
              <FirmaListesi liste={v.liste.satirlar} sorgu={surekli} />
            </div>

            {v.liste.toplam > SAYFA_BOYU ? (
              <nav className="mt-4 flex items-center gap-3 text-sm" aria-label="Sayfalar">
                {sayfa > 1 ? (
                  <Link href={`/admin/firmalar?${sayfaQs(sayfa - 1)}`} className="rounded-lg border border-line px-3 py-2 font-medium">
                    ← Önceki
                  </Link>
                ) : null}
                {sayfa * SAYFA_BOYU < v.liste.toplam ? (
                  <Link href={`/admin/firmalar?${sayfaQs(sayfa + 1)}`} className="rounded-lg border border-line px-3 py-2 font-medium">
                    Sonraki →
                  </Link>
                ) : null}
              </nav>
            ) : null}

            {/* ------------------------------------------- son gönderimler */}
            {v.son.length ? (
              <section className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Son gönderimler</h2>
                <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-card">
                  {v.son.map((g) => (
                    <li key={g.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-2.5 text-sm">
                      <span className="text-muted" title={tamTarih(g.zaman)}>
                        {goreli(g.zaman)}
                      </span>
                      {g.firma_id ? (
                        <Link href={`/admin/firmalar/${g.firma_id}`} className="font-medium underline-offset-4 hover:underline">
                          {g.firma ?? g.eposta}
                        </Link>
                      ) : (
                        <span className="font-medium">{g.eposta}</span>
                      )}
                      <span
                        className={
                          g.sonuc === "ok" ? "text-emerald-700" : g.sonuc === "belirsiz" ? "text-amber-700" : "text-red-700"
                        }
                      >
                        {SONUC_ETIKET[g.sonuc] ?? g.sonuc}
                      </span>
                      <span className="text-muted">· {g.kullanici}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </Kabuk>
  );
}

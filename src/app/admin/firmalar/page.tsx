import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CircleCheck, Search, ShieldAlert, TriangleAlert } from "lucide-react";
import { oturum, rolu } from "@/lib/admin-auth";
import {
  HEDEF_DURUMLAR,
  HEDEF_DURUM_ETIKET,
  KATEGORI_ADI,
  ONCELIKLI,
  SAYFA_BOYU,
  SEGMENT_GRUBU,
  bugunGonderilen,
  geriDonusDurumu,
  gonderimDurumu,
  grupOzeti,
  hedefFirmalar,
  hedefOzeti,
  ilkGonderimGunu,
  outreachSemaKur,
  segmentListesi,
  siradaki,
  sonGonderimler,
  talebeDonen,
  ulkeListesi,
  type GrupOzeti,
  type HedefFiltre,
} from "@/lib/outreach-db";
import { ayarlariOku, geriDonusEngeli, isinmaTavani } from "@/lib/outreach-kurallar";
import { goreli, tamTarih } from "@/lib/zaman";
import { Kabuk } from "../kabuk";
import { sigortaSifirlaEylemi } from "./actions";
import { FirmaListesi, SONUC_ETIKET } from "./firma-listesi";

export const dynamic = "force-dynamic";

/**
 * Hedef firmalar — ürün grubuna göre çalışılan liste.
 *
 * Öncelik sitede öne çıkan sıra (Yasin 2026-09-22): 1 roll form, 2 dilme,
 * 3 boy kesme, 4 pres besleme, 5 kompakt hat. Sayfanın üstü bu beş grubun
 * kartları: her birinde kaç firma gönderilebilir, ne kadar ilerlendi ve
 * grubun sıradaki firması. "Diğer" (alçıpan profili, market rafı) öncelik
 * dışı; kartların altında tek satır, listenin en sonunda.
 */

type Arama = {
  grup?: string;
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

const sayi = (n: number) => n.toLocaleString("tr-TR");

async function veriGetir(filtre: HedefFiltre, sayfa: number, ben: string) {
  try {
    const [liste, ozet, gruplar, ulkeler, segmentler, bugun, durum, son, ilk, rol, ilkGun, gd, talep] =
      await Promise.all([
        hedefFirmalar(filtre, sayfa),
        hedefOzeti(),
        grupOzeti(),
        ulkeListesi(),
        segmentListesi(),
        bugunGonderilen(),
        gonderimDurumu(),
        sonGonderimler(8),
        siradaki(filtre),
        rolu(ben),
        ilkGonderimGunu(),
        geriDonusDurumu(),
        talebeDonen(),
      ]);
    return {
      v: {
        liste, ozet, gruplar, ulkeler, segmentler, bugun, durum, son, ilk,
        admin: rol === "admin", ilkGun, gd, talep,
      },
      hata: null,
    };
  } catch (e) {
    return { v: null, hata: (e as Error).message };
  }
}

const BOS_GRUP = (kategori: number): GrupOzeti => ({
  kategori, toplam: 0, gonderilebilir: 0, gonderilen: 0, yanit: 0, talep: 0, siradaki: null,
});

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
    grup: sp.grup && /^[1-6]$/.test(sp.grup) ? sp.grup : undefined,
    durum: sp.durum || undefined,
    ulke: sp.ulke || undefined,
    segment: sp.segment || undefined,
    ara: sp.ara?.trim() || undefined,
    goster: sp.goster || undefined,
  };
  const sayfa = Math.max(1, Math.floor(Number(sp.sayfa)) || 1);
  const ayar = ayarlariOku(process.env);

  const { v, hata } = await veriGetir(filtre, sayfa, ben);
  const isinma = isinmaTavani(v?.ilkGun ?? null, ayar.gunlukTavan);
  const geriDonus = v ? geriDonusEngeli(v.gd.toplam, v.gd.hatali) : null;
  const grup = new Map((v?.gruplar ?? []).map((g) => [g.kategori, g]));
  const digerSegmentleri = Object.entries(SEGMENT_GRUBU)
    .filter(([, k]) => k === 6)
    .map(([s]) => s.toLocaleLowerCase("tr-TR"));

  /* Detay sayfasına süzgeç taşınıyor: "Sıradaki firma" aynı grup/ülke/segmentte kalsın. */
  const surekli = qs({ grup: filtre.grup, ulke: filtre.ulke, segment: filtre.segment });
  const sayfaQs = (n: number) => qs({ ...filtre, sayfa: n > 1 ? n : undefined });
  const grupQs = (k?: number) => qs({ ...filtre, grup: k ? String(k) : undefined });
  const sayfaSayisi = v ? Math.max(1, Math.ceil(v.liste.toplam / SAYFA_BOYU)) : 1;

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
                {sayi(v.ozet.toplam)} firma · {sayi(v.ozet.epostali)} e-postalı ·{" "}
                {sayi(v.ozet.gonderilebilir)} gönderilebilir
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
            {/* ------------------------------------------------ sonuç şeridi */}
            {(() => {
              const yanit = (v.ozet.durum.yanit ?? 0) + (v.ozet.durum.olumlu ?? 0) + (v.ozet.durum.red ?? 0);
              const oran = v.ozet.gonderilen ? Math.round((yanit / v.ozet.gonderilen) * 100) : 0;
              const kalemler = [
                { etiket: "Bugün", deger: `${v.bugun}/${isinma.tavan}`, alt: isinma.asama ?? "gönderilen / tavan" },
                {
                  etiket: "Gönderilen",
                  deger: sayi(v.ozet.gonderilen),
                  alt: v.gd.hatali ? `${v.gd.hatali} geri döndü` : "firma",
                },
                { etiket: "Yanıt", deger: sayi(yanit), alt: v.ozet.gonderilen ? `%${oran}` : "—" },
                { etiket: "Olumlu", deger: sayi(v.ozet.durum.olumlu ?? 0), alt: "görüşme" },
                /* Asıl ölçü: e-posta gönderilen firmadan sonradan gelen form talebi */
                { etiket: "Talep", deger: sayi(v.talep), alt: "e-postadan sonra" },
              ];
              return (
                /* Telefonda üstte üç, altta iki eşit hücre (6 sütunluk ızgara) — üçlü
                   ızgarada son satırda boş gri bir hücre kalıyordu. */
                <section className="mt-4 grid grid-cols-6 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-5">
                  {kalemler.map((k, i) => (
                    <div key={k.etiket} className={`bg-card px-3 py-2.5 sm:col-span-1 ${i < 3 ? "col-span-2" : "col-span-3"}`}>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{k.etiket}</p>
                      <p className="font-display text-xl font-extrabold leading-tight">{k.deger}</p>
                      <p className="truncate text-[11px] text-muted">{k.alt}</p>
                    </div>
                  ))}
                </section>
              );
            })()}

            {/* ------------------------------------------ gönderim durumu */}
            {ayar.eksik.length ? (
              <section className="mt-4 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
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
              <section className="mt-4 flex gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3.5 text-sm text-red-800">
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
            ) : geriDonus ? (
              <section className="mt-4 flex gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3.5 text-sm text-red-800">
                <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Gönderim durdu — geri dönüş eşiği aşıldı</p>
                  <p className="mt-1">{geriDonus}</p>
                </div>
              </section>
            ) : (
              <section className="mt-4 flex gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900">
                <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
                <p>
                  Gönderime hazır · gönderen <b>{ayar.gondericiAdi}</b> &lt;{ayar.user}&gt; · bugün en çok{" "}
                  {isinma.tavan}
                  {isinma.asama ? ` (${isinma.asama})` : ""} · iki e-posta arası en az {ayar.aralikSn} sn
                </p>
              </section>
            )}

            {/* ----------------------------------------- öncelikli gruplar */}
            <section className="mt-6" aria-labelledby="gruplar-baslik">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="gruplar-baslik" className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Öncelikli ürün grupları
                </h2>
                <span className="text-xs text-muted">sitede öne çıkan sıra · liste de bu sırayla</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {ONCELIKLI.map((k) => {
                  const g = grup.get(k) ?? BOS_GRUP(k);
                  const secili = filtre.grup === String(k);
                  return (
                    <div
                      key={k}
                      className={`flex flex-col rounded-xl border bg-card p-4 ${
                        secili ? "border-accent ring-2 ring-accent/30" : "border-line"
                      }`}
                    >
                      <p className="flex items-start gap-2 text-sm font-semibold leading-tight">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-shell text-xs text-white">
                          {k}
                        </span>
                        {KATEGORI_ADI[k]}
                      </p>
                      <p className="mt-3 font-display text-3xl font-extrabold leading-none">
                        {sayi(g.gonderilebilir)}
                      </p>
                      <p className="mt-1 text-[11px] text-muted">gönderilebilir · {sayi(g.toplam)} firma</p>
                      <p className="mt-2 text-xs text-muted">
                        {sayi(g.gonderilen)} gönderildi · {sayi(g.yanit)} yanıt ·{" "}
                        <span className={g.talep ? "font-semibold text-emerald-700" : ""}>{sayi(g.talep)} talep</span>
                      </p>
                      <div className="mt-auto flex flex-wrap gap-2 pt-3">
                        {g.siradaki ? (
                          <Link
                            href={`/admin/firmalar/${g.siradaki}?grup=${k}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-zinc-950"
                          >
                            Sıradakini aç
                            <ArrowRight className="size-3.5" aria-hidden />
                          </Link>
                        ) : (
                          <span className="px-1 py-2 text-xs text-muted">gönderilecek kalmadı</span>
                        )}
                        <Link
                          href={`/admin/firmalar?${grupQs(k)}`}
                          aria-current={secili ? "true" : undefined}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                            secili ? "bg-shell text-white" : "border border-line"
                          }`}
                        >
                          Listele
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Diğer — öncelik dışı, en sonda */}
              {(() => {
                const g = grup.get(6) ?? BOS_GRUP(6);
                return (
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-dashed border-line px-4 py-2.5 text-sm text-muted">
                    <span>
                      <b className="text-ink">6 · Diğer</b> — {digerSegmentleri.join(", ")}: {sayi(g.toplam)} firma (
                      {sayi(g.gonderilebilir)} gönderilebilir) · öncelik dışı, listenin sonunda
                    </span>
                    <Link
                      href={`/admin/firmalar?${grupQs(6)}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        filtre.grup === "6" ? "bg-shell text-white" : "border border-line"
                      }`}
                    >
                      Listele
                    </Link>
                    {filtre.grup ? (
                      <Link
                        href={`/admin/firmalar${grupQs() ? `?${grupQs()}` : ""}`}
                        className="text-xs font-semibold underline-offset-4 hover:underline"
                      >
                        Tüm gruplar
                      </Link>
                    ) : null}
                  </div>
                );
              })()}
            </section>

            {/* ------------------------------------------------- süzgeç */}
            <form action="/admin/firmalar" className="mt-6 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
              {filtre.grup ? <input type="hidden" name="grup" value={filtre.grup} /> : null}
              <select
                name="segment"
                defaultValue={filtre.segment ?? ""}
                aria-label="Segment"
                className="rounded-lg border border-line bg-card px-3 py-2.5 text-base sm:text-sm"
              >
                <option value="">Tüm segmentler</option>
                {[...ONCELIKLI, 6].map((k) => {
                  const bu = v.segmentler.filter((s) => (SEGMENT_GRUBU[s] ?? 6) === k);
                  return bu.length ? (
                    <optgroup key={k} label={`${k} · ${KATEGORI_ADI[k]}`}>
                      {bu.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </optgroup>
                  ) : null;
                })}
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
              <b className="text-ink">
                {filtre.grup ? `${filtre.grup} · ${KATEGORI_ADI[Number(filtre.grup)]}` : "Tüm gruplar, öncelik sırasıyla"}
              </b>{" "}
              · {sayi(v.liste.toplam)} sonuç
              {sayfaSayisi > 1 ? ` · sayfa ${sayfa}/${sayfaSayisi}` : ""}
            </p>

            <div className="mt-3">
              <FirmaListesi liste={v.liste.satirlar} sorgu={surekli} grupBasligi={!filtre.grup} />
            </div>

            {sayfaSayisi > 1 ? (
              <nav className="mt-4 flex flex-wrap items-center gap-3 text-sm" aria-label="Sayfalar">
                {sayfa > 1 ? (
                  <Link href={`/admin/firmalar?${sayfaQs(sayfa - 1)}`} className="rounded-lg border border-line px-3 py-2 font-medium">
                    ← Önceki
                  </Link>
                ) : null}
                <span className="text-muted">
                  {sayfa}/{sayfaSayisi}
                </span>
                {sayfa < sayfaSayisi ? (
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

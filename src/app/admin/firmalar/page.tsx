import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { ArrowRight, CircleCheck, Search, ShieldAlert, TriangleAlert } from "lucide-react";
import { oturum, rolu } from "@/lib/admin-auth";
import {
  HEDEF_DURUMLAR,
  HEDEF_DURUM_ETIKET,
  KATEGORILER,
  KATEGORI_ADI,
  ONCELIKLI,
  SAYFA_BOYU,
  SEGMENT_GRUBU,
  bugunGonderilen,
  geriDonusDurumu,
  grupOzeti,
  hedefFirmalar,
  hedefOzeti,
  kutuDurumlari,
  outreachSemaKur,
  segmentListesi,
  IKINCI_TUR_GUN,
  siradaki,
  sonGonderimler,
  talebeDonen,
  ulkeListesi,
  type GrupOzeti,
  type HedefFiltre,
} from "@/lib/outreach-db";
import {
  ayarlariOku,
  geriDonusEngeli,
  kutuSec,
  type KutuSatiri,
  type OutreachAyarlari,
} from "@/lib/outreach-kurallar";
import { goreli, tamTarih } from "@/lib/zaman";
import { gelenDurumu, type GelenDurumu } from "@/lib/gelen-db";
import { gelenKutulariTara } from "@/lib/gelen-tarama";
import {
  otomatikAyar,
  otomatikHatirlatmaSayisi,
  otomatikSira,
  type OtomatikAyar,
} from "@/lib/otomatik-gonderim";
import type { OtomatikSiradaki } from "@/lib/outreach-db";
import { Kabuk } from "../kabuk";
import { gelenTaraEylemi, hedefDurumEylemi, otomatikAyarEylemi, sigortaSifirlaEylemi } from "./actions";
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

async function veriGetir(filtre: HedefFiltre, sayfa: number, ben: string, ayar: OutreachAyarlari) {
  try {
    const [liste, ozet, gruplar, ulkeler, segmentler, bugun, kutular, son, ilk, rol, gd, talep, gelen, otomatik] =
      await Promise.all([
        hedefFirmalar(filtre, sayfa),
        hedefOzeti(),
        grupOzeti(),
        ulkeListesi(),
        segmentListesi(),
        bugunGonderilen(),
        kutuDurumlari(ayar.kutular),
        sonGonderimler(8),
        siradaki(filtre),
        rolu(ben),
        geriDonusDurumu(),
        talebeDonen(),
        gelenDurumu(),
        otomatikAyar(),
      ]);
    return {
      v: {
        liste, ozet, gruplar, ulkeler, segmentler, bugun, kutular, son, ilk,
        admin: rol === "admin", gd, talep, gelen, otomatik,
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

  const { v, hata } = await veriGetir(filtre, sayfa, ben, ayar);
  /* Gelen kutuları sayfa gönderildikten SONRA taranır — sayfa beklemez. Kutu
     başına en çok 10 dakikada bir; sonuç bir sonraki açılışta görünür. */
  if (!ayar.eksik.length) {
    after(async () => {
      try {
        await gelenKutulariTara(ayar, { aralikSn: 600 });
      } catch (e) {
        console.error("gelen kutusu taraması:", (e as Error).message);
      }
    });
  }
  const secim = v ? kutuSec(ayar, v.kutular.kutu, v.kutular.alan) : null;
  /* Otomatik gönderimin bugünkü sırası: kalan kapasite kadar (en çok 30) */
  const sira = v?.otomatik ? await otomatikSira(v.otomatik, Math.min(30, secim?.kalan ?? 0)).catch(() => []) : [];
  /* İlk tur bitince liste başa sarar: dönüş gelmemiş firmalara hatırlatma gider. */
  const hatirlatma = v?.otomatik && !sira.length ? await otomatikHatirlatmaSayisi(v.otomatik).catch(() => 0) : 0;
  const duranlar = secim?.satirlar.filter((x) => x.durum.durdu) ?? [];
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
          <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/firmalar/giden"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2.5 text-sm font-semibold hover:bg-surface-alt"
          >
            Giden · Gelen
          </Link>
          {v?.ilk ? (
            <Link
              href={`/admin/firmalar/${v.ilk}${surekli ? `?${surekli}` : ""}`}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950"
            >
              Sıradaki firmayı aç
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null}
          </div>
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
                {
                  etiket: "Bugün",
                  deger: `${v.bugun}/${v.bugun + (secim?.kalan ?? 0)}`,
                  alt: ayar.kutular.length > 1 ? `${ayar.kutular.length} kutu` : "gönderilen / tavan",
                },
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
            ) : geriDonus ? (
              <section className="mt-4 flex gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3.5 text-sm text-red-800">
                <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Gönderim durdu — geri dönüş eşiği aşıldı</p>
                  <p className="mt-1">{geriDonus}</p>
                </div>
              </section>
            ) : secim ? (
              <KutuTablosu secim={secim.satirlar} aralikSn={ayar.aralikSn} admin={v.admin} duran={duranlar.length} />
            ) : null}
            {ayar.uyarilar.length ? (
              <p className="mt-2 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
                <span>{ayar.uyarilar.join(" ")}</span>
              </p>
            ) : null}
            {ayar.kutular.length ? <GelenKutulari durum={v.gelen} kutular={ayar.kutular.map((k) => k.user)} /> : null}
            {v.otomatik && ayar.kutular.length ? (
              <OtomatikGonderim
                a={v.otomatik}
                sira={sira}
                hatirlatma={hatirlatma}
                admin={v.admin}
                kalan={secim?.kalan ?? 0}
              />
            ) : null}

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

/**
 * Gönderen kutuları — her biri bugün kaç gönderdi, tavanı (ısınmayla), alan
 * adının toplamı ve şu anki durumu. Tek kutuyken de aynı tablo: "neden
 * gönderemiyorum" sorusunun cevabı hep aynı yerde.
 */
function KutuTablosu({
  secim,
  aralikSn,
  admin,
  duran,
}: {
  secim: KutuSatiri[];
  aralikSn: number;
  admin: boolean;
  duran: number;
}) {
  const hazir = secim.some((x) => x.engel === null || x.bekle !== null);
  return (
    <section
      className={`mt-4 rounded-xl border px-4 py-3.5 text-sm ${
        hazir ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"
      }`}
    >
      <p className="flex items-center gap-2 font-semibold">
        {hazir ? <CircleCheck className="size-5 shrink-0" aria-hidden /> : <ShieldAlert className="size-5 shrink-0" aria-hidden />}
        {hazir ? "Gönderime hazır" : "Şu an gönderilemiyor"} · {secim.length} kutu · aynı kutudan iki e-posta arası en az{" "}
        {aralikSn} sn
      </p>
      <ul className="mt-2 divide-y divide-black/10">
        {secim.map((x) => (
          <li key={x.kutu.user} className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="min-w-0 break-all font-medium sm:w-72 sm:shrink-0">
              {x.kutu.ad} &lt;{x.kutu.user}&gt;
            </span>
            <span className="tabular-nums">
              bugün {x.durum.bugun}/{x.tavan}
              {x.asama ? ` (${x.asama})` : ""} · {x.kutu.alan} {x.alanBugun}/{x.alanTavani}
              {x.alanAsamasi ? ` (${x.alanAsamasi})` : ""}
            </span>
            <span className="break-words sm:ml-auto sm:text-right">
              {x.engel === null
                ? "hazır"
                : x.durum.durdu && x.durum.durduBitis
                  ? `durdu — ${tamTarih(x.durum.durduBitis)}'e kadar: ${x.durum.durduSebep}`
                  : x.engel}
            </span>
          </li>
        ))}
      </ul>
      {admin && duran ? (
        <details className="mt-2">
          <summary className="cursor-pointer font-medium underline-offset-4 hover:underline">
            Sigortayı şimdi kaldır ({duran} kutu)…
          </summary>
          <p className="mt-2">
            Yalnızca sebep giderildiyse (ör. parola düzeltildi). Hız sınırı ya da spam engeli
            yüzünden durduysa beklemek gerekir; üstüne gitmek alan adını kara listeye sokar.
          </p>
          <form action={sigortaSifirlaEylemi} className="mt-2">
            <button className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white">
              Evet, bütün kutuları aç
            </button>
          </form>
        </details>
      ) : null}
    </section>
  );
}

const GELEN_ETIKET: Record<string, string> = {
  yanit: "Yanıt",
  geri_donus: "Geri döndü",
  gecici: "Teslim gecikiyor",
  otomatik: "Otomatik yanıt",
  abonelik: "Abonelikten çıktı",
};
const GELEN_RENK: Record<string, string> = {
  yanit: "bg-violet-500/15 text-violet-700",
  geri_donus: "bg-red-500/15 text-red-700",
  gecici: "bg-amber-500/15 text-amber-800",
  otomatik: "bg-zinc-500/10 text-zinc-600",
  abonelik: "bg-amber-500/15 text-amber-800",
};

/**
 * Gelen kutuları — yanıtlar, geri dönüşler, abonelik iptalleri kendiliğinden
 * işlenir (src/lib/gelen-tarama.ts). Burada: kutuların son taraması, bugün
 * işlenenler ve son eşleşenler; "Şimdi tara" beklemeden tarar.
 */
function GelenKutulari({ durum, kutular }: { durum: GelenDurumu; kutular: string[] }) {
  const tarama = new Map(durum.kutular.map((k) => [k.kutu, k]));
  const b = durum.bugun;
  return (
    <section className="mt-3 rounded-xl border border-line bg-card px-4 py-3.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          Gelen kutuları <span className="font-normal text-muted">— yanıt, geri dönüş ve abonelik iptali kendiliğinden işlenir</span>
        </p>
        <form action={gelenTaraEylemi}>
          <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surface-alt">
            Şimdi tara
          </button>
        </form>
      </div>
      <p className="mt-1 text-muted">
        Bugün: {b.yanit ?? 0} yanıt · {b.geri_donus ?? 0} geri dönüş · {b.abonelik ?? 0} abonelik iptali ·{" "}
        {b.otomatik ?? 0} otomatik yanıt
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {kutular.map((k) => {
          const t = tarama.get(k);
          return (
            <li key={k} className="break-all">
              {k}:{" "}
              {t?.son_hata ? (
                <span className="text-red-700">hata — {t.son_hata}</span>
              ) : t?.bitti ? (
                <span title={tamTarih(t.bitti)}>{goreli(t.bitti)} tarandı</span>
              ) : (
                "henüz taranmadı"
              )}
            </li>
          );
        })}
      </ul>
      {durum.son.length ? (
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {durum.son.map((g, i) => (
            <li key={`${g.kutu}-${g.islendi}-${i}`} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-3">
              <span className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${GELEN_RENK[g.tur] ?? ""}`}>
                {GELEN_ETIKET[g.tur] ?? g.tur}
              </span>
              <span className="min-w-0 flex-1 break-words">
                {g.firma_id ? (
                  <Link href={`/admin/firmalar/${g.firma_id}`} className="font-medium underline-offset-4 hover:underline">
                    {g.firma ?? g.kimden}
                  </Link>
                ) : (
                  <span className="font-medium">{g.kimden}</span>
                )}
                {g.ozet ? <span className="text-muted"> — {g.ozet.slice(0, 160)}</span> : null}
              </span>
              <span className="shrink-0 text-xs text-muted" title={tamTarih(g.islendi)}>
                {goreli(g.islendi)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/**
 * Otomatik gönderim — durum, aç/durdur ve ayarlar (yönetici), bugün sırada
 * olan firmalar. Sıradaki firmayı "Çıkar" göndermeden önce listeden alır
 * ("Geçildi" olur; firma sayfasından geri alınabilir).
 */
function OtomatikGonderim({
  a,
  sira,
  hatirlatma,
  admin,
  kalan,
}: {
  a: OtomatikAyar;
  sira: OtomatikSiradaki[];
  /** İlk tur bittiyse hatırlatma sırasında bekleyen firma sayısı */
  hatirlatma: number;
  admin: boolean;
  kalan: number;
}) {
  const kapsam = [
    `hafta içi${a.hafta_sonu ? " ve hafta sonu" : ""} ${a.baslangic}:00–${a.bitis}:00`,
    `gruplar ${a.gruplar.join(", ")}`,
    a.ab_dahil ? "AB dahil" : "AB hariç",
    a.kesif_dahil ? "otomatik keşif dahil" : "yalnızca elle araştırılan",
  ].join(" · ");
  return (
    <section
      className={`mt-3 rounded-xl border px-4 py-3.5 text-sm ${
        a.acik ? "border-emerald-300 bg-emerald-50/60" : "border-line bg-card"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          Otomatik gönderim —{" "}
          <span className={a.acik ? "text-emerald-700" : "text-muted"}>{a.acik ? "AÇIK" : "kapalı"}</span>
          <span className="font-normal text-muted"> · {kapsam}</span>
        </p>
        {admin ? (
          <form action={otomatikAyarEylemi}>
            <input type="hidden" name="islem" value={a.acik ? "durdur" : "ac"} />
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                a.acik ? "bg-red-700 text-white" : "bg-emerald-700 text-white"
              }`}
            >
              {a.acik ? "Durdur" : "Aç"}
            </button>
          </form>
        ) : null}
      </div>
      <p className="mt-1 text-muted">
        {a.acik ? (
          <>
            {a.son_sonuc ? <>Son: {a.son_sonuc}</> : "Henüz tur çalışmadı (dakikada bir)."}
            {a.son_tik ? <span title={tamTarih(a.son_tik)}> · tur {goreli(a.son_tik)}</span> : null}
            {a.sonraki && a.sonraki_bekliyor ? (
              <> · sıradaki gönderim {tamTarih(a.sonraki).slice(-5)}</>
            ) : null}
          </>
        ) : (
          "Açınca bugünün kalan kapasitesi pencereye eşit yayılır; elle gönderimle aynı kurallar (tavan, aralık, sigorta, geri dönüş eşiği, aynı adres) geçerli."
        )}
      </p>
      {admin ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium underline-offset-4 hover:underline">Ayarlar…</summary>
          <form action={otomatikAyarEylemi} className="mt-2 flex flex-col gap-2 text-xs">
            <input type="hidden" name="islem" value="kaydet" />
            <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
              <legend className="mb-1 font-semibold">Ürün grupları</legend>
              {KATEGORILER.map((k) => (
                <label key={k} className="flex items-center gap-1.5">
                  <input type="checkbox" name="grup" value={k} defaultChecked={a.gruplar.includes(k)} />
                  {k} · {KATEGORI_ADI[k]}
                </label>
              ))}
            </fieldset>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="ab_dahil" defaultChecked={a.ab_dahil} />
              AB ülkelerine de gönder (kurallar ülkeden ülkeye değişiyor; bazıları şirketlere de önceden izin arıyor)
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" name="kesif_dahil" defaultChecked={a.kesif_dahil} />
              Otomatik keşif firmalarını da dahil et (~%15&apos;i hedef dışı olabilir — sıradakileri aşağıdan kontrol edin)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span>Saat (İstanbul):</span>
              <select name="baslangic" defaultValue={a.baslangic} className="rounded border border-line bg-card px-1.5 py-1">
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
              <span>–</span>
              <select name="bitis" defaultValue={a.bitis} className="rounded border border-line bg-card px-1.5 py-1">
                {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
              <label className="ml-2 flex items-center gap-1.5">
                <input type="checkbox" name="hafta_sonu" defaultChecked={a.hafta_sonu} />
                hafta sonu da
              </label>
            </div>
            <button className="w-fit rounded-lg border border-line px-3 py-1.5 font-semibold hover:bg-surface-alt">
              Kaydet
            </button>
          </form>
        </details>
      ) : null}
      <div className="mt-3 border-t border-line pt-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Bugün sırada ({sira.length}
          {kalan > sira.length ? ` / ${kalan}` : ""})
        </p>
        {sira.length ? (
          <ol className="mt-1 divide-y divide-line">
            {sira.map((f, i) => (
              <li key={f.id} className="flex items-center gap-3 py-1.5">
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted">{i + 1}</span>
                <Link href={`/admin/firmalar/${f.id}`} className="min-w-0 flex-1 truncate font-medium underline-offset-4 hover:underline">
                  {f.firma}
                </Link>
                <span className="hidden shrink-0 text-xs text-muted sm:inline">
                  {f.ulke} · {KATEGORI_ADI[f.kategori]}
                  {f.kesif ? " · keşif" : ""}
                </span>
                <form action={hedefDurumEylemi}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="durum" value="gecildi" />
                  <button
                    className="rounded border border-line px-2 py-0.5 text-xs hover:bg-surface-alt"
                    title="Bu firmaya otomatik gönderilmesin (Geçildi)"
                  >
                    Çıkar
                  </button>
                </form>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-1 text-xs text-muted">
            {kalan <= 0
              ? "Bugünkü tavan doldu."
              : hatirlatma > 0
                ? `İlk tur bitti. ${hatirlatma} firma hatırlatma sırasında — ilk mektuba dönüş gelmeyenlere, ${IKINCI_TUR_GUN} gün sonra, farklı metinle yazılır.`
                : "Kapsama uyan gönderilebilir firma yok."}
          </p>
        )}
      </div>
    </section>
  );
}

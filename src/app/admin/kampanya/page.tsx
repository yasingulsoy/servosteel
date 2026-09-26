import Link from "next/link";
import { redirect } from "next/navigation";
import { ScrollText, ShieldAlert, TriangleAlert } from "lucide-react";
import { oturum, rolu } from "@/lib/admin-auth";
import {
  geriDonusDurumu,
  grupKirilimi,
  gunlukOzet,
  kampanyaToplami,
  kopyaSorunu,
  kutuDurumlari,
  outreachSemaKur,
  sonGonderimler,
  sonTiklayanlar,
  talebeDonen,
  tiklayanFirmaSayisi,
  ulkeKirilimi,
} from "@/lib/outreach-db";
import { ayarlariOku, geriDonusEngeli, kutuSec } from "@/lib/outreach-kurallar";
import { otomatikAyar, otomatikHatirlatmaSayisi, otomatikSira } from "@/lib/otomatik-gonderim";
import { goreli, tamTarih } from "@/lib/zaman";
import { Kabuk } from "../kabuk";
import { Gunluk } from "../firmalar/gunluk";
import { SONUC_ETIKET } from "../firmalar/firma-listesi";
import { KutuTablosu, OtomatikGonderim } from "./parcalar";

export const dynamic = "force-dynamic";

/**
 * Kampanya — tanıtım e-postalarının panosu.
 *
 * Önceden hepsi Hedef firmalar sayfasının üstündeydi: sonuç şeridi, uyarılar,
 * kutu tablosu, gelen kutuları, otomatik gönderim, günlük karne, kırılımlar
 * ve firma listesi aynı sayfada üst üste (Yasin, 26 Eylül 2026: "her şey
 * dağınık"). Burası kampanyanın kendisi; firma listesi kendi sayfasında.
 *
 * Sayıların hepsi TÜM ZAMANLAR ve BUGÜN yan yana.
 */

const ARALIKLAR = [
  ["7", "7 gün"],
  ["14", "14 gün"],
  ["30", "30 gün"],
  ["tumu", "Tüm zamanlar"],
] as const;

const sayi = (n: number) => n.toLocaleString("tr-TR");

export default async function KampanyaSayfasi({ searchParams }: { searchParams: Promise<{ aralik?: string }> }) {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");
  const sp = await searchParams;
  if (!(await outreachSemaKur())) redirect("/admin/genel");

  const ayar = ayarlariOku(process.env);
  const aralik = ARALIKLAR.some(([k]) => k === sp.aralik) ? (sp.aralik as string) : "14";

  /* "Tüm zamanlar" için pencere, ilk gönderimden bugüne — önce toplamlar lazım */
  const toplam = await kampanyaToplami();
  const gunSayisi = aralik === "tumu" ? Math.max(1, toplam.gun_sayisi || 14) : Number(aralik);

  const [kutular, rol, gd, gunler, grupK, kopya, tiklayanlar, ulkeK, talep, otomatik, son, tiklayanFirma] = await Promise.all([
    kutuDurumlari(ayar.kutular),
    rolu(ben),
    geriDonusDurumu(),
    gunlukOzet(gunSayisi),
    grupKirilimi(),
    kopyaSorunu(),
    sonTiklayanlar(15),
    ulkeKirilimi(),
    talebeDonen(),
    otomatikAyar(),
    sonGonderimler(10),
    tiklayanFirmaSayisi(gunSayisi),
  ]);
  const admin = rol === "admin";
  const secim = ayar.kutular.length ? kutuSec(ayar, kutular.kutu, kutular.alan) : null;
  const sira = otomatik ? await otomatikSira(otomatik, Math.min(30, secim?.kalan ?? 0)).catch(() => []) : [];
  const hatirlatma = otomatik && !sira.length ? await otomatikHatirlatmaSayisi(otomatik).catch(() => 0) : 0;
  const duranlar = secim?.satirlar.filter((x) => x.durum.durdu) ?? [];
  const geriDonus = geriDonusEngeli(gd.toplam, gd.hatali);
  const tavan = (secim?.kalan ?? 0) + toplam.gonderim_bugun;

  const kartlar: { etiket: string; deger: string; alt: string; vurgu?: boolean }[] = [
    { etiket: "Gönderim", deger: sayi(toplam.gonderim), alt: `bugün ${sayi(toplam.gonderim_bugun)}${tavan ? ` / ${sayi(tavan)}` : ""}` },
    { etiket: "Tıklama", deger: sayi(toplam.tiklama), alt: `bugün ${sayi(toplam.tiklama_bugun)} · ${sayi(toplam.tiklayan_firma)} firma` },
    { etiket: "Teklif sayfası", deger: sayi(toplam.teklif_sayfasi), alt: "maildeki bağlantıdan" },
    { etiket: "Yanıt", deger: sayi(toplam.yanit), alt: `bugün ${sayi(toplam.yanit_bugun)}`, vurgu: toplam.yanit > 0 },
    { etiket: "Olumlu", deger: sayi(toplam.olumlu), alt: "görüşmeye dönen" },
    { etiket: "Talep", deger: sayi(talep), alt: "mailden sonra form" },
  ];

  return (
    <Kabuk aktif="kampanya" kullanici={ben}>
      <main className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">Kampanya</h1>
            <p className="text-sm text-muted">
              Tanıtım e-postaları
              {toplam.ilk_gonderim ? ` · ${tamTarih(toplam.ilk_gonderim).slice(0, 10)} tarihinden beri` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/firmalar/giden"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-semibold hover:bg-surface-alt"
            >
              <ScrollText className="size-4" aria-hidden /> Gönderim kaydı
            </Link>
            <Link
              href="/admin/firmalar"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-semibold hover:bg-surface-alt"
            >
              Hedef firmalar
            </Link>
          </div>
        </header>

        {/* ---------------------------------------------- tüm zamanlar + bugün */}
        <section aria-label="Kampanya sayıları" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {kartlar.map((k) => (
            <div key={k.etiket} className="min-w-0 rounded-xl border border-line bg-card px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{k.etiket}</p>
              <p className={`mt-0.5 font-display text-2xl font-extrabold tabular-nums ${k.vurgu ? "text-violet-700" : ""}`}>
                {k.deger}
              </p>
              <p className="truncate text-xs text-muted">{k.alt}</p>
            </div>
          ))}
        </section>

        {/* ---------------------------------------------------- uyarılar */}
        {ayar.eksik.length || geriDonus || kopya.adet > 0 || ayar.uyarilar.length ? (
          <section className="space-y-2" aria-label="Uyarılar">
            {ayar.eksik.length ? (
              <p className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span>
                  <strong>Gönderim kapalı — ayarlar eksik:</strong> {ayar.eksik.join(" · ")}. Sunucudaki ortam
                  değişkenlerine eklenip uygulama yeniden dağıtılınca açılır.
                </span>
              </p>
            ) : null}
            {geriDonus ? (
              <p className="flex gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span>
                  <strong>Gönderim durdu — geri dönüş eşiği aşıldı.</strong> {geriDonus}
                </span>
              </p>
            ) : null}
            {kopya.adet > 0 ? (
              <p className="flex gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span>
                  <strong>Kutular dolu — son 24 saatte {sayi(kopya.adet)} mailin kopyası Gönderilmiş klasörüne konamadı.</strong>{" "}
                  Dolu kutu, alıcı sunucuların gönderen doğrulamasını düşürüp &ldquo;550 Sender verify failed&rdquo;
                  reddine yol açıyor. cPanel → E-posta Hesapları&apos;ndan kutular boşaltılmalı.
                  <span className="mt-1 block text-xs opacity-80">Sunucunun cevabı: {kopya.ornek}</span>
                </span>
              </p>
            ) : null}
            {ayar.uyarilar.length ? (
              <p className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
                <span>{ayar.uyarilar.join(" ")}</span>
              </p>
            ) : null}
          </section>
        ) : null}

        {/* ----------------------------------------- kutular + otomatik gönderim */}
        {/* Alt alta: kutu tablosunun satırları (kutu · bugün/tavan · durum) tam
            genişlik istiyor; yarım sütunda üç parçaya bölünüp okunmaz oluyordu. */}
        <section className="space-y-4" aria-label="Gönderim">
          <div className="min-w-0 [&>section]:mt-0">
            {secim && !ayar.eksik.length ? (
              <KutuTablosu secim={secim.satirlar} aralikSn={ayar.aralikSn} admin={admin} duran={duranlar.length} />
            ) : null}
          </div>
          <div className="min-w-0 [&>section]:mt-0">
            {otomatik && ayar.kutular.length ? (
              <OtomatikGonderim a={otomatik} sira={sira} hatirlatma={hatirlatma} admin={admin} kalan={secim?.kalan ?? 0} />
            ) : null}
          </div>
        </section>

        {/* ----------------------------------------------- gün gün + kırılımlar */}
        <section aria-label="Gün gün">
          <nav className="flex flex-wrap gap-1.5" aria-label="Zaman aralığı">
            {ARALIKLAR.map(([k, ad]) => (
              <Link
                key={k}
                href={k === "14" ? "/admin/kampanya" : `/admin/kampanya?aralik=${k}`}
                aria-current={aralik === k ? "page" : undefined}
                className={`rounded-full border px-3 py-1 text-sm ${
                  aralik === k ? "border-accent bg-accent/15 font-semibold text-ink" : "border-line text-muted hover:text-ink"
                }`}
              >
                {ad}
              </Link>
            ))}
          </nav>
          <div className="[&>section]:mt-3">
            <Gunluk gunler={gunler} tiklayanlar={tiklayanlar} gruplar={grupK} ulkeler={ulkeK} tiklayanFirma={tiklayanFirma} />
          </div>
        </section>

        {/* --------------------------------------------------- son gönderimler */}
        {son.length ? (
          <section>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Son gönderimler</h2>
              <Link href="/admin/firmalar/giden" className="text-xs font-semibold underline underline-offset-4">
                Tümü
              </Link>
            </div>
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-card">
              {son.map((g) => (
                <li key={g.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-muted" title={tamTarih(g.zaman)}>
                    {goreli(g.zaman)}
                  </span>
                  {g.firma_id ? (
                    <Link href={`/admin/firmalar/${g.firma_id}`} className="min-w-0 font-medium underline-offset-4 hover:underline">
                      {g.firma ?? g.eposta}
                    </Link>
                  ) : (
                    <span className="min-w-0 font-medium">{g.eposta}</span>
                  )}
                  <span className={g.sonuc === "ok" ? "text-emerald-700" : g.sonuc === "belirsiz" ? "text-amber-700" : "text-red-700"}>
                    {SONUC_ETIKET[g.sonuc] ?? g.sonuc}
                  </span>
                  <span className="ml-auto text-xs text-muted">{g.kullanici}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </Kabuk>
  );
}

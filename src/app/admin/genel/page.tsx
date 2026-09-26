import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Flame, Inbox, Mail, ShieldAlert, TriangleAlert } from "lucide-react";
import { oturum } from "@/lib/admin-auth";
import { bekleyenYanitSayisi, gelenDurumu, sonYanitlar } from "@/lib/gelen-db";
import { DURUM_ETIKET, semaKur, talepler, talepOzeti, type Talep } from "@/lib/leads-db";
import {
  geriDonusDurumu,
  kampanyaToplami,
  kopyaSorunu,
  kutuDurumlari,
  outreachSemaKur,
  sicakFirmalar,
} from "@/lib/outreach-db";
import { ayarlariOku, geriDonusEngeli } from "@/lib/outreach-kurallar";
import { goreli, tamTarih } from "@/lib/zaman";
import { Kabuk } from "../kabuk";
import { DURUM_RENK } from "../talep-listesi";

export const dynamic = "force-dynamic";

/**
 * Genel bakış — panelin giriş sayfası.
 *
 * Tek soruya cevap veriyor: "şu an neye bakmam lazım?" Üstte tüm zamanlar ve
 * bugün yan yana (Yasin, 26 Eylül 2026: "sadece bugün değil tüm zamanlar"),
 * altında dikkat isteyen işler, sıcak firmalar, son yanıtlar ve talepler.
 * Her satır, işin yapıldığı sayfaya bağlanıyor.
 */

const sayi = (n: number) => n.toLocaleString("tr-TR");

/* Map.groupBy yerine elle: package.json "node >=20.9" diyor, Map.groupBy
   Node 21'de geldi — sunucu 20'deyse sayfa çökerdi. */
function hataGrupla<T extends { son_hata: string }>(liste: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of liste) m.set(x.son_hata, [...(m.get(x.son_hata) ?? []), x]);
  return m;
}

async function veri() {
  const ayar = ayarlariOku(process.env);
  const [talep, sonTalepler, kampanya, sicak, yanitlar, bekleyen, kopya, gd, kutular, tarama] = await Promise.all([
    talepOzeti(),
    talepler({}).then((l: Talep[]) => l.slice(0, 5)),
    kampanyaToplami(),
    sicakFirmalar(6),
    sonYanitlar(5),
    bekleyenYanitSayisi(),
    kopyaSorunu(),
    geriDonusDurumu(),
    kutuDurumlari(ayar.kutular),
    gelenDurumu(0),
  ]);
  const duran = Object.values(kutular.kutu).filter((d) => d.durdu).length;
  const taramaHatasi = tarama.kutular.filter((k) => k.son_hata);
  return { talep, sonTalepler, kampanya, sicak, yanitlar, bekleyen, kopya, gd, duran, taramaHatasi };
}

export default async function GenelBakis() {
  const ben = await oturum();
  if (!ben) redirect("/admin/giris");
  if (!(await semaKur()) || !(await outreachSemaKur())) redirect("/admin");

  let v: Awaited<ReturnType<typeof veri>> | null = null;
  let hata: string | null = null;
  try {
    v = await veri();
  } catch (e) {
    hata = (e as Error).message;
  }

  /* min-w-0: ızgara öğesinin varsayılan min-width'i `auto` — onsuz tek
     satıra kısaltılan bir yanıt özeti kartı KENDİ tam genişliğine itiyor ve
     telefonda sayfa 3.000 pikseli aşıyordu. */
  const kart = "min-w-0 rounded-xl border border-line bg-card px-4 py-3";
  const kutuBasligi = "text-xs font-semibold uppercase tracking-wide text-muted";

  return (
    <Kabuk aktif="genel" kullanici={ben}>
      <main className="space-y-6">
        <header>
          <h1 className="font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">Genel bakış</h1>
          <p className="text-sm text-muted">Merhaba {ben} — tüm zamanlar ve bugün, dikkat isteyen işler.</p>
        </header>

        {hata ? (
          <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">Veritabanı hatası: {hata}</p>
        ) : null}

        {v ? (
          <>
            {/* -------------------------------------------- tüm zamanlar + bugün */}
            <section aria-label="Sayılar" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {[
                { etiket: "Talep", deger: v.talep.toplam, alt: `bugün ${sayi(v.talep.bugun)} · 30 günde ${sayi(v.talep.son30)}`, href: "/admin" },
                { etiket: "Site iletişimi", deger: v.talep.iletisim, alt: `30 günde ${sayi(v.talep.iletisim30)} · telefon + e-posta`, href: "/admin" },
                { etiket: "Gönderim", deger: v.kampanya.gonderim, alt: `bugün ${sayi(v.kampanya.gonderim_bugun)}`, href: "/admin/kampanya" },
                { etiket: "Tıklama", deger: v.kampanya.tiklama, alt: `bugün ${sayi(v.kampanya.tiklama_bugun)} · ${sayi(v.kampanya.tiklayan_firma)} firma`, href: "/admin/kampanya" },
                { etiket: "Yanıt", deger: v.kampanya.yanit, alt: `bugün ${sayi(v.kampanya.yanit_bugun)}`, href: "/admin/eposta" },
                { etiket: "Olumlu", deger: v.kampanya.olumlu, alt: "görüşmeye dönen", href: "/admin/firmalar?durum=olumlu" },
              ].map((k) => (
                <Link key={k.etiket} href={k.href} className={`${kart} block transition-colors hover:border-accent`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{k.etiket}</p>
                  <p className="mt-0.5 font-display text-2xl font-extrabold tabular-nums">{sayi(k.deger)}</p>
                  <p className="truncate text-xs text-muted">{k.alt}</p>
                </Link>
              ))}
            </section>

            {/* ------------------------------------------------------- uyarılar */}
            {(() => {
              const geri = geriDonusEngeli(v.gd.toplam, v.gd.hatali);
              const uyarilar = [
                v.kopya.adet > 0
                  ? `Kutular dolu — son 24 saatte ${sayi(v.kopya.adet)} mailin kopyası Gönderilmiş'e konamadı. cPanel'den kutular boşaltılmalı.`
                  : null,
                geri ? `Gönderim durdu: ${geri}` : null,
                v.duran ? `${v.duran} gönderen kutusu bugünlük durdurulmuş — Kampanya sayfasında sebebi yazıyor.` : null,
                /* Aynı hata birden çok kutudaysa tek satır: dört kutu aynı sebeple
                   taranamıyorsa (sunucu, parola) dört kırmızı kutu gürültü olur. */
                ...[...hataGrupla(v.taramaHatasi)].map(([h, kutular]) =>
                  kutular.length > 1
                    ? `${kutular.length} kutu taranamıyor (${kutular.map((k) => k.kutu.split("@")[0]).join(", ")}): ${h}`
                    : `${kutular[0].kutu} taranamıyor: ${h}`
                ),
              ].filter(Boolean) as string[];
              return uyarilar.length ? (
                <section className="space-y-2" aria-label="Uyarılar">
                  {uyarilar.map((u) => (
                    <p key={u} className="flex gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                      <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                      <span>{u}</span>
                    </p>
                  ))}
                </section>
              ) : null;
            })()}

            <div className="grid gap-4 lg:grid-cols-2">
              {/* ---------------------------------------------- dikkat isteyenler */}
              <section className={kart}>
                <h2 className={kutuBasligi}>Dikkat isteyenler</h2>
                <ul className="mt-2 divide-y divide-line text-sm">
                  <li>
                    <Link href="/admin?durum=yeni" className="flex items-center gap-3 py-2.5 hover:text-accent-strong">
                      <Inbox className="size-5 shrink-0 text-muted" aria-hidden />
                      <span className="flex-1">
                        <strong className="tabular-nums">{sayi(v.talep.yeni)}</strong>{" "}yeni talep — henüz kimse dönmedi
                      </span>
                      <ArrowRight className="size-4 text-muted" aria-hidden />
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/eposta" className="flex items-center gap-3 py-2.5 hover:text-accent-strong">
                      <Mail className="size-5 shrink-0 text-muted" aria-hidden />
                      <span className="flex-1">
                        <strong className="tabular-nums">{sayi(v.bekleyen)}</strong>{" "}yanıt elden geçmedi — firması hâlâ &ldquo;Yanıt geldi&rdquo;de
                      </span>
                      <ArrowRight className="size-4 text-muted" aria-hidden />
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/kampanya" className="flex items-center gap-3 py-2.5 hover:text-accent-strong">
                      <Flame className="size-5 shrink-0 text-muted" aria-hidden />
                      <span className="flex-1">
                        <strong className="tabular-nums">{sayi(v.sicak.length)}</strong>{" "}firma maile tıkladı ama yazmadı — aşağıda
                      </span>
                      <ArrowRight className="size-4 text-muted" aria-hidden />
                    </Link>
                  </li>
                </ul>
              </section>

              {/* -------------------------------------------------- son yanıtlar */}
              <section className={kart}>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className={kutuBasligi}>Son yanıtlar</h2>
                  <Link href="/admin/eposta" className="text-xs font-semibold underline underline-offset-4">
                    E-posta
                  </Link>
                </div>
                {v.yanitlar.length ? (
                  <ul className="mt-2 divide-y divide-line text-sm">
                    {v.yanitlar.map((y) => (
                      <li key={`${y.kutu}-${y.uid}`}>
                        <Link
                          href={`/admin/eposta?kutu=${encodeURIComponent(y.kutu)}&klasor=gelen&uid=${y.uid}`}
                          className="block py-2.5 hover:text-accent-strong"
                        >
                          <span className="flex items-baseline gap-2">
                            <span className="min-w-0 flex-1 truncate font-semibold">{y.firma ?? y.kimden}</span>
                            {y.ulke ? <span className="shrink-0 text-xs text-muted">{y.ulke}</span> : null}
                            <span className="shrink-0 text-xs text-muted" title={tamTarih(y.islendi)}>
                              {goreli(y.islendi)}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-muted">{y.ozet || y.konu}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">Henüz yanıt yok.</p>
                )}
              </section>

              {/* ---------------------------------------------------- sıcak firmalar */}
              <section className={kart}>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className={kutuBasligi}>Sıcak firmalar — tıkladı, yazmadı</h2>
                  <Link href="/admin/kampanya" className="text-xs font-semibold underline underline-offset-4">
                    Kampanya
                  </Link>
                </div>
                {v.sicak.length ? (
                  <ul className="mt-2 divide-y divide-line text-sm">
                    {v.sicak.map((f) => (
                      <li key={f.firma_id}>
                        <Link href={`/admin/firmalar/${f.firma_id}`} className="flex items-baseline gap-2 py-2.5 hover:text-accent-strong">
                          <span className="min-w-0 flex-1 truncate font-semibold">{f.firma}</span>
                          <span className="shrink-0 text-xs text-muted">{f.ulke}</span>
                          <span className="shrink-0 text-xs tabular-nums">
                            {f.teklif ? <strong className="text-accent-strong">{f.teklif} teklif sayfası</strong> : `${f.tik} tık`}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">Henüz tıklama yok.</p>
                )}
                <p className="mt-2 text-xs text-muted">
                  Teklif sayfasına girip formu doldurmayanlar önde — kısa bir telefon ya da mail için en yüksek ihtimal.
                </p>
              </section>

              {/* ---------------------------------------------------- son talepler */}
              <section className={kart}>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className={kutuBasligi}>Son talepler</h2>
                  <Link href="/admin" className="text-xs font-semibold underline underline-offset-4">
                    Talepler
                  </Link>
                </div>
                {v.sonTalepler.length ? (
                  <ul className="mt-2 divide-y divide-line text-sm">
                    {v.sonTalepler.map((t) => (
                      <li key={t.id}>
                        <Link href={`/admin/talep/${t.id}`} className="flex items-baseline gap-2 py-2.5 hover:text-accent-strong">
                          <span className="min-w-0 flex-1 truncate font-semibold">{t.firma || t.ad || t.eposta}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${DURUM_RENK[t.durum] ?? ""}`}>
                            {DURUM_ETIKET[t.durum as keyof typeof DURUM_ETIKET] ?? t.durum}
                          </span>
                          <span className="shrink-0 text-xs text-muted" title={tamTarih(t.olusturuldu)}>
                            {goreli(t.olusturuldu)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">Henüz talep yok.</p>
                )}
              </section>
            </div>

            <p className="flex items-center gap-2 text-xs text-muted">
              <TriangleAlert className="size-3.5" aria-hidden />
              Tıklama ölçümü 25 Eylül 2026&apos;da başladı; öncesindeki gönderimlerin tıklamaları sayılmadı.
            </p>
          </>
        ) : null}
      </main>
    </Kabuk>
  );
}

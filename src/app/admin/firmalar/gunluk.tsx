import Link from "next/link";
import { MousePointerClick } from "lucide-react";
import { KATEGORI_ADI, type GunSatiri, type Kirilim, type Tiklayan } from "@/lib/outreach-db";
import { goreli, tamTarih } from "@/lib/zaman";

/**
 * Kampanyanın gün gün karnesi + kimin tıkladığı.
 *
 * NEDEN: "bugün 109 mail gitti" tek başına bir şey söylemiyor. Tıklama ve
 * yanıt aynı satırda durunca oran görünüyor — hangi gün ne işe yaradı.
 *
 * Tıklama sayısı, e-postadaki bağlantıdan gelen ziyaret (`olaylar.tur =
 * 'outreach'`). Bağlantının `utm_content` parametresi o maili alan firmanın
 * alan adını taşıdığı için yalnızca "kaç tıklama" değil, KİMİN tıkladığı da
 * biliniyor — satıcı için asıl değerli olan bu. Ölçüm 25 Eylül 2026'da
 * başladı; öncesindeki günlerde tıklama sütunu boş görünür, veri yok demek,
 * sıfır tıklama demek değil.
 */

const sayi = (n: number) => n.toLocaleString("tr-TR");

/** Gün adı + gün.ay — "25.09 Cum" biçiminde, tabloyu dar tutar. */
function gunEtiketi(g: string): string {
  const t = new Date(`${g}T12:00:00Z`);
  const gun = t.toLocaleDateString("tr-TR", { weekday: "short", timeZone: "UTC" });
  return `${g.slice(8, 10)}.${g.slice(5, 7)} ${gun}`;
}

function KirilimTablosu({ baslik, satirlar, grup }: { baslik: string; satirlar: Kirilim[]; grup?: boolean }) {
  if (!satirlar.length) return null;
  const enCok = Math.max(1, ...satirlar.map((x) => x.gonderim));
  return (
    /* min-w-0: ızgara hücresinin varsayılan min-width'i `auto` — onsuz kart
       içeriğinden dar olamıyor ve dar ekranda sağa taşıyordu (375 px'te
       422 px'lik sayfa). */
    <div className="min-w-0 rounded-xl border border-line bg-card px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{baslik}</p>
      <ul className="mt-2 space-y-1.5 text-sm">
        {satirlar.map((x) => (
          <li key={x.anahtar} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate">
              {grup ? (KATEGORI_ADI[Number(x.ad)] ?? x.ad) : x.ad}
            </span>
            <span className="hidden h-2 w-20 shrink-0 overflow-hidden rounded-full bg-surface-alt sm:block">
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${Math.round((x.gonderim / enCok) * 100)}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right tabular-nums">{sayi(x.gonderim)}</span>
            <span className="w-14 shrink-0 text-right tabular-nums text-muted">
              {x.tiklama ? `${sayi(x.tiklama)} tık` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Gunluk({
  gunler,
  tiklayanlar,
  gruplar,
  ulkeler,
}: {
  gunler: GunSatiri[];
  tiklayanlar: Tiklayan[];
  gruplar: Kirilim[];
  ulkeler: Kirilim[];
}) {
  const enCok = Math.max(1, ...gunler.map((g) => g.gonderim));
  const toplam = gunler.reduce(
    (a, g) => ({
      gonderim: a.gonderim + g.gonderim,
      tiklama: a.tiklama + g.tiklama,
      yanit: a.yanit + g.yanit,
      geri: a.geri + g.geri_donus,
      iptal: a.iptal + g.abonelik,
    }),
    { gonderim: 0, tiklama: 0, yanit: 0, geri: 0, iptal: 0 }
  );

  return (
    <section className="mt-6" aria-labelledby="gunluk-baslik">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="gunluk-baslik" className="text-xs font-semibold uppercase tracking-wide text-muted">
          Gün gün
        </h2>
        <p className="text-xs text-muted">
          {gunler.length} günde {sayi(toplam.gonderim)} gönderim · {sayi(toplam.tiklama)} tıklama ·{" "}
          {sayi(toplam.yanit)} yanıt
          {toplam.geri ? ` · ${sayi(toplam.geri)} geri dönüş` : ""}
          {toplam.iptal ? ` · ${sayi(toplam.iptal)} iptal` : ""}
        </p>
      </div>

      <div className="mt-2 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[460px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-semibold">Gün</th>
              <th className="px-3 py-2 font-semibold">Gönderim</th>
              <th className="px-3 py-2 text-right font-semibold">Tıklama</th>
              <th className="px-3 py-2 text-right font-semibold">Oran</th>
              <th className="px-3 py-2 text-right font-semibold">Yanıt</th>
              <th className="px-3 py-2 text-right font-semibold">Geri dönüş</th>
              <th className="px-3 py-2 text-right font-semibold">İptal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {gunler.map((g) => (
              <tr key={g.gun} className={g.gonderim === 0 ? "text-muted" : ""}>
                <td className="whitespace-nowrap px-3 py-1.5 tabular-nums">{gunEtiketi(g.gun)}</td>
                <td className="px-3 py-1.5">
                  <span className="flex items-center gap-2">
                    {/* Çubuk: o günün en yoğun güne oranı — sayıyı okumadan eğilim görünsün */}
                    <span className="hidden h-2 w-28 shrink-0 overflow-hidden rounded-full bg-surface-alt sm:block">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${Math.round((g.gonderim / enCok) * 100)}%` }}
                      />
                    </span>
                    <span className="tabular-nums">{sayi(g.gonderim)}</span>
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{g.tiklama ? sayi(g.tiklama) : "—"}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-muted">
                  {g.gonderim && g.tiklama ? `%${Math.round((g.tiklama / g.gonderim) * 100)}` : "—"}
                </td>
                <td className={`px-3 py-1.5 text-right tabular-nums ${g.yanit ? "font-semibold text-violet-700" : ""}`}>
                  {g.yanit ? sayi(g.yanit) : "—"}
                </td>
                <td className={`px-3 py-1.5 text-right tabular-nums ${g.geri_donus ? "font-semibold text-red-700" : ""}`}>
                  {g.geri_donus ? sayi(g.geri_donus) : "—"}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{g.abonelik ? sayi(g.abonelik) : "—"}</td>
              </tr>
            ))}
          </tbody>
          {/* Toplam satırı tabloda dursun: gün gün bakarken dönüp özete
              çıkmadan pencerenin tamamı görünüyor. */}
          <tfoot>
            <tr className="border-t-2 border-line bg-surface-alt/60 font-semibold">
              <td className="whitespace-nowrap px-3 py-2">Toplam · {gunler.length} gün</td>
              <td className="px-3 py-2">
                <span className="flex items-center gap-2">
                  {/* Üstteki satırlarda çubuk var; toplamda yok ama sayı aynı
                      hizada kalsın diye çubuk kadar boşluk bırakılıyor. */}
                  <span className="hidden w-28 shrink-0 sm:block" aria-hidden />
                  <span className="tabular-nums">{sayi(toplam.gonderim)}</span>
                </span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{toplam.tiklama ? sayi(toplam.tiklama) : "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {toplam.gonderim && toplam.tiklama
                  ? `%${Math.round((toplam.tiklama / toplam.gonderim) * 100)}`
                  : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{toplam.yanit ? sayi(toplam.yanit) : "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">{toplam.geri ? sayi(toplam.geri) : "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums">{toplam.iptal ? sayi(toplam.iptal) : "—"}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <KirilimTablosu baslik="Ürün grubuna göre" satirlar={gruplar} grup />
        <KirilimTablosu baslik="Ülkeye göre (ilk 12)" satirlar={ulkeler} />
      </div>

      <div className="mt-3 rounded-xl border border-line bg-card px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <MousePointerClick className="size-3.5" aria-hidden /> Maildeki bağlantıya tıklayanlar
        </p>
        {tiklayanlar.length ? (
          <ul className="mt-2 divide-y divide-line text-sm">
            {tiklayanlar.map((t, i) => (
              <li key={`${t.kaynak}-${t.zaman}-${i}`} className="flex flex-wrap items-baseline gap-x-2 py-1.5">
                {t.firma_id ? (
                  <Link href={`/admin/firmalar/${t.firma_id}`} className="font-semibold underline-offset-4 hover:underline">
                    {t.firma}
                  </Link>
                ) : (
                  <span className="font-semibold">{t.kaynak}</span>
                )}
                {t.ulke ? <span className="text-xs text-muted">{t.ulke}</span> : null}
                {/* Tıkladı ama hâlâ "Gönderildi": ilgilendi, yazmadı — hatırlatmanın
                    en sıcak adayı. */}
                {t.durum === "gonderildi" ? (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    yanıt vermedi
                  </span>
                ) : null}
                <span className="text-xs text-muted">{t.yol}</span>
                <span className="ml-auto text-xs text-muted" title={tamTarih(t.zaman)}>
                  {goreli(t.zaman)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-sm text-muted">
            Henüz kayıtlı tıklama yok. Ölçüm 25 Eylül 2026&apos;da başladı — daha önce gönderilen
            maillerin tıklamaları sayılmadı.
          </p>
        )}
      </div>
    </section>
  );
}

import Link from "next/link";
import { MousePointerClick } from "lucide-react";
import type { GunSatiri, Tiklayan } from "@/lib/outreach-db";
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

export function Gunluk({ gunler, tiklayanlar }: { gunler: GunSatiri[]; tiklayanlar: Tiklayan[] }) {
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
        <table className="w-full min-w-[540px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-semibold">Gün</th>
              <th className="px-3 py-2 font-semibold">Gönderim</th>
              <th className="px-3 py-2 text-right font-semibold">Tıklama</th>
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
                    <span className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-surface-alt">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${Math.round((g.gonderim / enCok) * 100)}%` }}
                      />
                    </span>
                    <span className="tabular-nums">{sayi(g.gonderim)}</span>
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{g.tiklama ? sayi(g.tiklama) : "—"}</td>
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
        </table>
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

import { getLocale, getTranslations } from "next-intl/server";
import { Reveal } from "@/components/reveal";
import { DENSITIES, type MaterialKey } from "@/lib/calc";

type Bolum = { h: string; p: string; formula: string; example: string };
type Rehber = {
  sheet: Bolum;
  coil: Bolum;
  length: Bolum;
  densH: string;
  densP: string;
  densHead: string[];
};

/**
 * Hesaplayıcıların altındaki açıklama: formül, çözümlü örnek, yoğunluk tablosu.
 *
 * Neden var: /en/calculators 90 günde tek gösterim almadı. Sayfada yalnızca
 * tarayıcıda çalışan araçlar vardı; Google'ın okuyacağı metin yoktu. Aranan
 * "sheet metal / steel plate / coil weight calculator" sorgularının cevabı
 * (formül ve örnek) artık HTML'de hazır geliyor.
 *
 * Örneklerdeki sayılar elle değil, 2026-09-21'de bu dosyadaki formüllerle
 * hesaplandı. Yoğunluk tablosu doğrudan DENSITIES'ten üretilir — araç ile
 * metin hiçbir zaman ayrışamaz.
 */
export async function CalculatorGuide() {
  const t = await getTranslations("calc");
  const locale = await getLocale();
  const g = t.raw("guide") as Rehber;
  const sayi = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const bolumler = [g.sheet, g.coil, g.length];

  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 lg:pb-20">
      {bolumler.map((b) => (
        <Reveal key={b.h}>
          <div className="mt-12 first:mt-0">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{b.h}</h2>
            <p className="mt-3 leading-relaxed text-muted">{b.p}</p>
            <p className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface-alt px-4 py-3 font-mono text-sm text-ink">
              {b.formula}
            </p>
            <p className="mt-4 leading-relaxed text-muted">{b.example}</p>
          </div>
        </Reveal>
      ))}

      <Reveal>
        <div className="mt-12">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{g.densH}</h2>
          <p className="mt-3 leading-relaxed text-muted">{g.densP}</p>
          <div className="mt-5 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-alt text-ink">
                <tr>
                  {g.densHead.map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(DENSITIES) as MaterialKey[]).map((k) => (
                  <tr key={k} className="border-t border-line text-muted">
                    <td className="px-4 py-3 text-ink">{t(k)}</td>
                    <td className="px-4 py-3">{sayi.format(DENSITIES[k])}</td>
                    {/* 1 m² × 1 mm = 1.000.000 mm³ → kg = yoğunluk (g/cm³) sayısal olarak */}
                    <td className="px-4 py-3">{sayi.format(DENSITIES[k] * 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

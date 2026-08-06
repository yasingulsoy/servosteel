import { CountUp } from "@/components/count-up";
import { Reveal } from "@/components/reveal";

/**
 * Sayaçlı istatistik bandı (10+ yıl, 48+ ülke, %99…).
 * Eski sitedeki kredibilite figürlerinin yeni evi — sayılar görünüm
 * alanına girince 0'dan sayar, arkada yavaşça süzülen altın ışıma var.
 *
 * Zemin AÇIK. Eskiden `bg-shell` (#0b0c0e) idi; sayfanın koyu görünmesine
 * katkısı ölçüldü — videosuz dümdüz siyah panellerden biriydi. Renkler tema
 * değişkenlerinden geliyor, yani koyu temada kendiliğinden koyuya döner.
 *
 * Sayılarda `text-accent` DEĞİL `text-accent-ink` kullanılıyor: ham altın
 * (#e7a300) beyaz üstünde 2,18:1 veriyor ve bu, büyük metin sınırı olan
 * 3:1'in bile altında. `--accent-ink` tam bu iş için var (açık temada
 * #8f6400 -> 4,86:1, koyu temada #f0b428).
 *
 * `grain` kaldırıldı: %5 opaklıkta koyu gürültü açık zeminde doku değil
 * kir gibi duruyordu.
 */
export function StatsBand({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section className="relative overflow-hidden border-y border-line bg-surface-alt">
      {/* Dekoratif ışıma — kaydırmayla hafifçe süzülür (destekleyen tarayıcıda) */}
      <div
        aria-hidden
        className="drift-slow absolute -top-28 left-1/2 h-72 w-[620px] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
      />

      <Reveal
        group
        className="relative mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 py-14 lg:grid-cols-4 lg:py-16"
      >
        {items.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1.5 text-center">
            <CountUp
              value={stat.value}
              className="font-display text-4xl font-extrabold tabular-nums tracking-tight text-accent-ink sm:text-5xl"
            />
            <span className="text-sm text-muted">{stat.label}</span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

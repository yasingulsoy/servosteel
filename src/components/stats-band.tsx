import { CountUp } from "@/components/count-up";
import { Reveal } from "@/components/reveal";

/**
 * Koyu zeminde sayaçlı istatistik bandı (10+ yıl, 48+ ülke, %99…).
 * Eski sitedeki kredibilite figürlerinin yeni evi — sayılar görünüm
 * alanına girince 0'dan sayar, arkada yavaşça süzülen altın ışıma var.
 */
export function StatsBand({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section className="grain relative overflow-hidden bg-shell text-white">
      {/* Dekoratif ışıma — kaydırmayla hafifçe süzülür (destekleyen tarayıcıda) */}
      <div
        aria-hidden
        className="drift-slow absolute -top-28 left-1/2 h-72 w-[620px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <Reveal
        group
        className="relative mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 py-14 lg:grid-cols-4 lg:py-16"
      >
        {items.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1.5 text-center">
            <CountUp
              value={stat.value}
              className="font-display text-4xl font-extrabold tabular-nums tracking-tight text-accent sm:text-5xl"
            />
            <span className="text-sm text-zinc-400">{stat.label}</span>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

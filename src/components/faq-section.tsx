import { Reveal } from "@/components/reveal";

export type FaqItem = { q: string; a: string };

/**
 * Sık sorulan sorular bölümü + FAQPage JSON-LD.
 *
 * Neden <details>/<summary>:
 * - Cevap metni HTML'de HER ZAMAN bulunur (kapalıyken bile) → arama motorları
 *   ve yapay zeka motorları okuyabilir. JavaScript ile gizlenen içerikte bu garanti yoktur.
 * - Klavye ve ekran okuyucu desteği tarayıcıdan gelir, ekstra kod gerekmez.
 *
 * Şema, sayfadaki görünür metinle birebir aynıdır — Google'ın kuralı budur.
 */
export function FaqSection({
  title,
  items,
  eyebrow,
}: {
  title: string;
  items: FaqItem[];
  eyebrow?: string;
}) {
  if (!items?.length) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <section className="border-t border-line bg-surface-alt">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-16 lg:py-20">
        <Reveal>
          {eyebrow && (
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
              <span className="h-px w-8 bg-accent" aria-hidden />
              {eyebrow}
            </p>
          )}
          <h2 className="font-display mt-4 text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            {title}
          </h2>
        </Reveal>

        <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-card">
          {items.map((it, i) => (
            <details key={it.q} className="group/f px-6" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-start font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {it.q}
                <span
                  aria-hidden
                  className="relative size-5 shrink-0 text-accent before:absolute before:left-0 before:top-1/2 before:h-0.5 before:w-5 before:-translate-y-1/2 before:rounded-full before:bg-current after:absolute after:left-1/2 after:top-0 after:h-5 after:w-0.5 after:-translate-x-1/2 after:rounded-full after:bg-current after:transition-transform after:duration-200 group-open/f:after:scale-y-0"
                />
              </summary>
              <p className="pb-6 leading-relaxed text-muted">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

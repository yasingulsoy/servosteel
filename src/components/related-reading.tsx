import { BookOpen, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/reveal";
import { getPosts } from "@/lib/akademi";
import { getAkademiUi } from "@/lib/akademi-ui";
import { relatedFor } from "@/lib/related-reading";

/**
 * "İlgili okuma" — ürün sayfasından ilgili akademi yazılarına köprü.
 *
 * SUNUCU bileşeni: fs okuyan getPosts'u çağırır, client bundle'a girmez.
 *
 * Yazının o dilde GERÇEKTEN var olup olmadığı kontrol edilir. Bir yazı her
 * dilde bulunmayabiliyor (akademi hreflang'i de bunu böyle ele alıyor); var
 * olmayanı listelemek kırık link üretirdi. Hiçbiri yoksa bölüm hiç basılmaz.
 */
export function RelatedReading({ path, locale }: { path: string; locale: string }) {
  const wanted = relatedFor(path);
  if (!wanted.length) return null;

  const available = new Map(getPosts(locale).map((p) => [p.slug, p]));
  const posts = wanted.map((slug) => available.get(slug)).filter((p) => p !== undefined);
  if (!posts.length) return null;

  const ui = getAkademiUi(locale);

  return (
    <section className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
              {ui.relatedTitle}
            </h2>
            <Link
              href="/akademi"
              className="group flex items-center gap-1.5 text-sm font-semibold text-accent-ink"
            >
              {ui.nav}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                strokeWidth={1.8}
                aria-hidden
              />
            </Link>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal key={p.slug} delay={i * 90}>
              <Link
                href={`/akademi/${p.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-line bg-card p-6 transition-colors hover:border-accent/50"
              >
                <BookOpen className="size-7 text-accent" strokeWidth={1.8} aria-hidden />
                <h3 className="font-display mt-4 text-base font-bold uppercase tracking-tight text-ink">
                  {p.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.description}</p>
                <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent-ink">
                  {p.readingMinutes} {ui.minRead}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

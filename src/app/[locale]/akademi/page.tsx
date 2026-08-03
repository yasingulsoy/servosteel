import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pageAlternates, pageTitle } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { getPosts } from "@/lib/akademi";
import { getAkademiUi } from "@/lib/akademi-ui";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const ui = getAkademiUi(locale);
  return {
    title: pageTitle(ui.title),
    description: ui.subtitle,
    alternates: pageAlternates(locale as AppLocale, "/akademi"),
  };
}

export default async function AkademiPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ui = getAkademiUi(locale);
  const posts = getPosts(locale);
  const df = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <PageHero
        crumbs={[{ label: ui.nav, href: "/akademi" }]}
        eyebrow="Servosteel"
        title={ui.title}
        description={ui.subtitle}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
            <p className="text-muted">{ui.empty}</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 3) * 100}>
                <Link
                  href={`/akademi/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-black/10"
                >
                  {post.cover && (
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-alt">
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted">
                      {post.date && <time dateTime={post.date}>{df.format(new Date(post.date))}</time>}
                      <span aria-hidden>·</span>
                      <span>
                        {post.readingMinutes} {ui.minRead}
                      </span>
                    </div>
                    <h2 className="font-display mt-3 text-lg font-bold leading-snug text-ink">{post.title}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{post.description}</p>
                    <span className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
                      {ui.readMore}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <CtaBand />
    </>
  );
}

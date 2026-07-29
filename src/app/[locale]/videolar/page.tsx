import { setRequestLocale, getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { pageAlternates } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { SpecularButton } from "@/components/specular-button";
import { Reveal } from "@/components/reveal";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

/* youtube-nocookie: çerezsiz gömme */
const videoIds = ["2tgCtC8n_1E", "5JRpTEUXun4", "WfSe7M60W3Y"];

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "videos" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/videolar"),
  };
}

export default async function VideolarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("videos");
  const items = t.raw("items") as { title: string; text: string }[];

  return (
    <>
      <PageHero
        crumbs={[{ label: t("metaTitle"), href: "/videolar" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((v, i) => (
            <Reveal key={videoIds[i]} delay={i * 100}>
              <figure className="overflow-hidden rounded-2xl border border-line bg-card">
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoIds[i]}`}
                    title={v.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="size-full"
                  />
                </div>
                <figcaption className="p-5">
                  <h2 className="font-semibold text-ink">{v.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{v.text}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-2xl bg-shell p-8 text-white lg:flex-row lg:items-center">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                {t("bannerTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-zinc-400">{t("bannerText")}</p>
            </div>
            <SpecularButton
              href="https://www.youtube.com/@ServoSteel.ServoMold"
              external
              variant="gold"
              size="lg"
              className="shrink-0"
            >
              {t("bannerCta")}
              <ExternalLink className="size-4" strokeWidth={2} aria-hidden />
            </SpecularButton>
          </div>
        </Reveal>
      </section>

      <CtaBand title={t("ctaTitle")} text={t("ctaText")} />
    </>
  );
}

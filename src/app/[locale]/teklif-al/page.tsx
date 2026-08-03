import { setRequestLocale, getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { pageAlternates, pageTitle } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { RfqForm } from "@/components/rfq-form";
import { CONTACT } from "@/lib/site";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quote" });
  return {
    title: pageTitle(t("metaTitle")),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/teklif-al"),
  };
}

export default async function TeklifAlPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("quote");
  const steps = t.raw("steps") as string[];

  return (
    <>
      <PageHero
        crumbs={[{ label: t("metaTitle"), href: "/teklif-al" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Reveal>
              <RfqForm />
            </Reveal>
          </div>

          <aside>
            <Reveal delay={120}>
              <div className="rounded-2xl bg-shell p-7 text-white">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  {t("processTitle")}
                </h2>
                <ul className="mt-5 space-y-3">
                  {steps.map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.2} aria-hidden />
                      {s}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-white/10 pt-5 text-sm text-zinc-400">
                  <p>{t("directTitle")}</p>
                  <a href={CONTACT.phoneHref} className="mt-2 block font-semibold text-white transition-colors hover:text-accent">
                    {CONTACT.phoneDisplay}
                  </a>
                  <a href={`mailto:${CONTACT.email}`} className="mt-1 block font-semibold text-white transition-colors hover:text-accent">
                    {CONTACT.email}
                  </a>
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}

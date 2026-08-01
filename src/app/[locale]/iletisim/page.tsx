import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Clock, Mail, MapPin, Phone, Printer } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { SpecularButton } from "@/components/specular-button";
import { pageAlternates } from "@/i18n/seo";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { CONTACT } from "@/lib/site";
import type { AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
    alternates: pageAlternates(locale as AppLocale, "/iletisim"),
  };
}

export default async function IletisimPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  const channels = [
    { icon: Phone, title: t("phoneTitle"), value: CONTACT.phoneDisplay, href: CONTACT.phoneHref, note: t("phoneNote") },
    { icon: Mail, title: t("emailTitle"), value: CONTACT.email, href: `mailto:${CONTACT.email}`, note: t("emailNote") },
    { icon: FaWhatsapp, title: t("waTitle"), value: t("waValue"), href: "https://wa.me/902164153005", note: t("waNote") },
  ];

  return (
    <>
      <PageHero
        crumbs={[{ label: t("title"), href: "/iletisim" }]}
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("desc")}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {channels.map((c, i) => (
            <Reveal key={c.title} delay={i * 90}>
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                data-spotlight
                className="group block h-full rounded-2xl border border-line bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-black/10"
              >
                <c.icon className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
                <h2 className="font-display mt-4 text-lg font-bold uppercase tracking-tight text-ink">
                  {c.title}
                </h2>
                <p className="mt-1 font-medium text-accent-ink">{c.value}</p>
                <p className="mt-2 text-sm text-muted">{c.note}</p>
              </a>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl bg-shell p-8 text-white">
              <MapPin className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
              <h2 className="font-display mt-4 text-lg font-bold uppercase tracking-tight">
                {t("addressTitle")}
              </h2>
              <p className="mt-3 leading-relaxed text-zinc-300">
                {CONTACT.addressStreet}
                <br />
                {CONTACT.addressLocality} / {CONTACT.addressRegion}, {t("country")}
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                <Clock className="size-4" strokeWidth={1.8} aria-hidden />
                {t("hours")}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                <Printer className="size-4" strokeWidth={1.8} aria-hidden />
                {t("faxTitle")}: {CONTACT.faxDisplay}
              </p>
              <div className="mt-auto pt-6">
                <SpecularButton
                  href="https://www.google.com/maps/search/?api=1&query=Servosteel+Yunusemre+İskenderpaşa+Sancaktepe+İstanbul"
                  external
                  variant="gold"
                  size="md"
                >
                  {t("directions")}
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                </SpecularButton>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="h-full min-h-[320px] overflow-hidden rounded-2xl border border-line">
              <iframe
                src="https://www.google.com/maps?q=Yunusemre%20Mah.%20%C4%B0skenderpa%C5%9Fa%20Cad.%2021%20Sancaktepe%20%C4%B0stanbul&output=embed"
                title={t("mapTitle")}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="size-full min-h-[320px] border-0"
              />
            </div>
          </Reveal>
        </div>

        <Reveal>
          <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-2xl bg-surface-alt p-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink">
                {t("quoteBoxTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-muted">{t("quoteBoxText")}</p>
            </div>
            <SpecularButton href="/teklif-al" variant="gold" size="lg" className="shrink-0">
              {t("quoteBoxCta")}
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </SpecularButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}

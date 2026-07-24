import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { localePath } from "@/i18n/seo";
import { SITE_URL } from "@/lib/site";
import type { AppLocale } from "@/i18n/routing";

export type Crumb = { label: string; href: string };

/** Alt sayfa girişi: breadcrumb + başlık + açıklama, BreadcrumbList JSON-LD dahil */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  description,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const allCrumbs: Crumb[] = [{ label: t("home"), href: "/" }, ...crumbs];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allCrumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${SITE_URL}${localePath(locale, c.href === "/" ? "" : c.href)}`,
    })),
  };

  return (
    <section className="border-b border-line bg-surface-alt">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
        <nav aria-label={t("breadcrumbAria")} className="flex flex-wrap items-center gap-1 text-xs text-muted">
          {allCrumbs.map((c, i) => {
            const last = i === allCrumbs.length - 1;
            return (
              <span key={c.href} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="font-medium text-accent-ink">
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="transition-colors hover:text-ink">
                    {c.label}
                  </Link>
                )}
                {!last && <ChevronRight className="size-3" strokeWidth={1.8} aria-hidden />}
              </span>
            );
          })}
        </nav>

        {eyebrow && (
          <p className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
            <span className="h-px w-8 bg-accent" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h1 className="font-display mt-3 max-w-3xl text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>
        )}
      </div>
    </section>
  );
}

import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, Check, Cog } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { localePath, sayfaMeta } from "@/i18n/seo";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { PageHero } from "@/components/page-hero";
import { CtaBand } from "@/components/cta-band";
import { SpecularButton } from "@/components/specular-button";
import { Reveal } from "@/components/reveal";
import { InlineQuote } from "@/components/inline-quote";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { RelatedVideos } from "@/components/related-videos";
import { ProductShot } from "@/components/product-shot";
import { hasPhoto, hidesVideos, isMachineVariant, machineVariants, variantPhotosOf, variantsOf } from "@/lib/catalog";
import { routing, type AppLocale } from "@/i18n/routing";
import { compareItems } from "@/lib/compare";

/**
 * Makine varyant sayfası — `/makineler/rulo-acicilar/hidrolik-rulo-acicilar`
 *
 * Neden ayrı sayfa: üst sayfadaki özet tablo iki seriyi tek sütunda anlatmak
 * zorundaydı ve katalogdaki model listeleri (13 hidrolik, 12 mekanik) oraya
 * sığmıyordu. Alıcı "8 ton, 1.200 mm" diye arıyor; o eşleşmeyi ancak model
 * kırılımı verir.
 *
 * Üst sayfa DOKUNULMADAN kalır — "rulo açıcılar" kelimesinde 7. sırada ve
 * hub görevini sürdürüyor. Bu sayfa onun yerine geçmiyor, altına iniyor;
 * ikisi de birbirine link veriyor.
 *
 * Model tablosu İSTEĞE BAĞLI (`table` mesajı yoksa bölüm basılmaz, şemada
 * `additionalProperty` de olmaz): çift kafa açıcı için firmadan kapasite verisi
 * gelmedi, uydurma tablo yerine yalnız genel anlatım duruyor.
 */

type Props = { params: Promise<{ locale: string; slug: string; varyant: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    machineVariants.map((v) => ({ locale, slug: v.parent, varyant: v.slug }))
  );
}

const ns = (slug: string, varyant: string) => `products.variants.${slug}.${varyant}`;

export async function generateMetadata({ params }: Props) {
  const { locale, slug, varyant } = await params;
  if (!isMachineVariant(slug, varyant)) return {};
  const t = await getTranslations({ locale, namespace: ns(slug, varyant) });
  /* Paylaşım görseli: varyantın kendi fotoğrafı, yoksa üst makinenin */
  const kendi = variantPhotosOf(slug, varyant)[0];
  return sayfaMeta(locale as AppLocale, `/makineler/${slug}/${varyant}`, {
    baslik: t.has("metaTitle") ? t("metaTitle") : t("name"),
    aciklama: t("meta"),
    gorsel: kendi ? `/gorseller/${kendi.file}` : hasPhoto(slug) ? `/gorseller/${slug}.jpg` : undefined,
  });
}

export default async function VariantPage({ params }: Props) {
  const { locale, slug, varyant } = await params;
  if (!isMachineVariant(slug, varyant)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations(ns(slug, varyant));
  const td = await getTranslations("detail");
  const tm = await getTranslations("products.machines");
  const tv = await getTranslations("products.variants");

  const features = t.has("features") ? (t.raw("features") as { title: string; text: string }[]) : [];
  const why = td.raw("why") as string[];
  const faq = t.has("faq") ? (t.raw("faq") as FaqItem[]) : [];
  const hasTable = t.has("table");
  const tableHead = hasTable ? (t.raw("table.head") as string[]) : [];
  const tableRows = hasTable ? (t.raw("table.rows") as string[][]) : [];
  const genisTablo = tableHead.length > 5;
  const hucre = genisTablo ? "px-3 py-3 whitespace-nowrap" : "px-5 py-3.5";
  /* Kardeş varyantlar — aynı makinenin diğer tipleri */
  const kardesler = variantsOf(slug).filter((v) => v.slug !== varyant);
  /* Bu varyantı A ya da B sütununda anan karşılaştırma yazısı */
  const buYol = `/makineler/${slug}/${varyant}`;
  const karsilastirma = compareItems.find((c) => c.hrefA === buYol || c.hrefB === buYol);
  const tc = await getTranslations("compare");
  const fotolar = variantPhotosOf(slug, varyant);
  const fotoAlt = t.has("photoAlt") ? (t.raw("photoAlt") as string[]) : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}${localePath(locale as AppLocale, `/makineler/${slug}/${varyant}`)}#webpage`,
    name: t("name"),
    description: t("meta"),
    /* Üst sayfayı işaret eder: bu sayfa onun bir alt kırılımı, rakibi değil. */
    isPartOf: {
      "@id": `${SITE_URL}${localePath(locale as AppLocale, `/makineler/${slug}`)}#webpage`,
    },
    about: {
      "@type": "Thing",
      name: t("name"),
      description: t("meta"),
      brand: { "@type": "Brand", name: SITE_NAME },
      manufacturer: { "@id": `${SITE_URL}/#organization` },
      ...(fotolar.length ? { image: fotolar.map((f) => `${SITE_URL}/gorseller/${f.file}`) } : {}),
      ...(tableRows.length
        ? {
            additionalProperty: tableRows.map((row) => ({
              "@type": "PropertyValue",
              /* Aynı model adı birden çok genişlikte olabilir (SRV6000HA ×3,
                 Yasin 11 Kas: "/400 sonrası silinecek") — ad genişlikle ayrışır */
              name: tableRows.filter((r) => r[0] === row[0]).length > 1 ? `${row[0]} · ${row[1]}` : row[0],
              value: row.slice(1).filter(Boolean).join(" / "),
            })),
          }
        : {}),
    },
  };

  const ozellikler = features.length > 0 && (
    <>
      <Reveal>
        <h2 className={`font-display ${hasTable ? "mt-14 " : ""}text-2xl font-bold uppercase tracking-tight text-ink`}>
          {td("features")}
        </h2>
      </Reveal>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {features.map((fe, i) => (
          <Reveal key={fe.title} delay={i * 90}>
            <div className="h-full rounded-2xl border border-line bg-card p-6">
              <Cog className="size-8 text-accent" strokeWidth={1.8} aria-hidden />
              <h3 className="mt-4 font-semibold text-ink">{fe.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{fe.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        crumbs={[
          { label: tm(`${slug}.name`), href: `/makineler/${slug}` },
          { label: t("name"), href: `/makineler/${slug}/${varyant}` },
        ]}
        eyebrow={td("eyebrowMachine")}
        title={t("name")}
        description={t("hero")}
      />

      {/* Üst makinenin sahadan videoları başlığın hemen altında — makine sayfalarıyla aynı düzen */}
      {!hidesVideos(slug) && <RelatedVideos path={`/makineler/${slug}`} ust />}

      <section className="mx-auto max-w-7xl px-4 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* min-w-0: ızgara öğesi içeriğinden daha dar olabilsin. Olmadan tablonun
              min-w-[...] değeri sütunu mobil ekrandan geniş tutuyor, sağ taraf
              (özellik kartları, form) kesiliyordu; tablo kendi kutusunda kaysın. */}
          <div className="min-w-0 lg:col-span-2">
            {hasTable && (
              <Reveal>
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
                  {t("table.title")}
                </h2>
                {/* Geniş tablo (hidrolik açıcı: 9 sütun, Yasin 11 Kas): hücreler sıkışır,
                    satırlar kırılmaz; sığmazsa tablo kendi kutusunda yatay kayar. */}
                <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
                  <table className={`w-full text-left ${genisTablo ? "min-w-[760px] text-[13px]" : "min-w-[420px] text-sm"}`}>
                    {/* Başlık satırı marka sarısı (Yasin, 11 Kas) — koyu yazı iki temada da okunur */}
                    <thead className="bg-accent">
                      <tr>
                        {tableHead.map((h) => (
                          <th key={h} className={`${genisTablo ? "px-3 py-3 align-bottom leading-snug" : "px-5 py-3.5"} font-semibold text-zinc-950`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row) => (
                        <tr key={row.join("|")} className="border-t border-line">
                          {row.map((cell, ci) => (
                            <td
                              key={ci}
                              className={`${hucre} ${ci === 0 ? "font-medium text-ink" : "text-muted"}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {t.has("tableNote") && (
                  <p className="mt-3 text-sm leading-relaxed text-muted">{t("tableNote")}</p>
                )}
              </Reveal>
            )}

            {/* Tablo yoksa özellikler başa geçer, teklif formu onların altına —
                makine sayfasındaki sırayla aynı. */}
            {!hasTable && ozellikler}

            {/* Teklif formu model tablosunun hemen altında — bkz. inline-quote.tsx */}
            <InlineQuote name={t("name")} />

            {hasTable && ozellikler}
          </div>

          <aside className="space-y-6">
            {fotolar.length > 0 && (
              <Reveal>
                <div className="space-y-4">
                  {fotolar.map((f, i) => (
                    <ProductShot
                      key={f.file}
                      src={`/gorseller/${f.file}`}
                      alt={fotoAlt[i] ?? t("name")}
                      ratio={f.height > f.width ? "3/4" : "4/3"}
                      sizes="(max-width: 1024px) 100vw, 400px"
                    />
                  ))}
                </div>
              </Reveal>
            )}
            <Reveal>
              <div className="rounded-2xl bg-shell p-7 text-white">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  {td("whyTitle")}
                </h2>
                <ul className="mt-5 space-y-3">
                  {why.map((w) => (
                    <li key={w} className="flex items-start gap-2.5 text-sm text-zinc-300">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.2} aria-hidden />
                      {w}
                    </li>
                  ))}
                </ul>
                <SpecularButton href="/teklif-al" variant="gold" size="md" className="mt-6 w-full">
                  {td("machineQuote")}
                </SpecularButton>
              </div>
            </Reveal>

            {/* Karşılaştırma yazısı bu sayfaya bağlanıyordu, bu sayfa ona
                bağlanmıyordu. "Hidrolik mi mekanik mi?" sorusunun cevabı tek
                tıkta (SEO/GEO, Yasin 11 Kas). */}
            {karsilastirma && (
              <Reveal delay={90}>
                <Link
                  href={`/karsilastirma/${karsilastirma.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-card p-5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:bg-accent/5"
                >
                  {tc(`items.${karsilastirma.slug}.name`)}
                  <ArrowRight className="size-4 shrink-0 text-accent-ink transition-transform group-hover:translate-x-0.5 rtl:rotate-180" strokeWidth={2} aria-hidden />
                </Link>
              </Reveal>
            )}

            {kardesler.length > 0 && (
              <Reveal delay={120}>
                <div className="rounded-2xl border border-line bg-card p-6">
                  <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">
                    {tm(`${slug}.name`)}
                  </h2>
                  <div className="mt-4 space-y-2.5">
                    {kardesler.map((k) => (
                      <Link
                        key={k.slug}
                        href={`/makineler/${slug}/${k.slug}`}
                        className="block rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition-all hover:border-accent/50"
                      >
                        {tv(`${slug}.${k.slug}.name`)}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/makineler/${slug}`}
                    className="group mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent-ink"
                  >
                    <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.8} aria-hidden />
                    {tm(`${slug}.name`)}
                  </Link>
                </div>
              </Reveal>
            )}
          </aside>
        </div>
      </section>

      <FaqSection eyebrow={td("faqEyebrow")} title={td("faqTitle")} items={faq} />

      <CtaBand title={td("quoteTitle", { name: t("name") })} />
    </>
  );
}

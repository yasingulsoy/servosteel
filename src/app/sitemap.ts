import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { rollFormItems, machineItems } from "@/lib/catalog";
import { routing, localeHreflang, type AppLocale } from "@/i18n/routing";
import { localePath } from "@/i18n/seo";
import { getAllPostParams, getPostLocales, getPosts } from "@/lib/akademi";

const paths = [
  { path: "", priority: 1 },
  { path: "/roll-form-hatlari", priority: 0.9 },
  { path: "/dilme-hatlari", priority: 0.9 },
  { path: "/boy-kesme-hatlari", priority: 0.9 },
  { path: "/makineler", priority: 0.8 },
  { path: "/hakkimizda", priority: 0.6 },
  { path: "/referanslar", priority: 0.6 },
  { path: "/videolar", priority: 0.5 },
  { path: "/iletisim", priority: 0.7 },
  { path: "/teklif-al", priority: 0.8 },
  { path: "/akademi", priority: 0.6 },
  { path: "/hesaplayicilar", priority: 0.7 },
  ...rollFormItems.map((p) => ({ path: `/roll-form-hatlari/${p.slug}`, priority: 0.8 })),
  ...machineItems.map((p) => ({ path: `/makineler/${p.slug}`, priority: 0.7 })),
];

/** Bir yazının yayın tarihi (slug -> ISO tarih). Aynı slug tüm dillerde aynı tarihi taşır. */
function postDates(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of routing.locales) {
    for (const p of getPosts(l)) {
      if (p.date && !map[p.slug]) map[p.slug] = p.date;
    }
  }
  return map;
}

/**
 * Her yol, her locale için ayrı URL + hreflang alternatifleriyle listelenir.
 *
 * İki bilinçli karar:
 * 1) Alternatiflere **x-default** de eklenir — HTML'deki hreflang ile sitemap'in
 *    birbiriyle tutarlı olması gerekir, aksi halde Google çelişkili sinyal görür.
 * 2) Statik sayfalarda **lastModified YAZILMAZ.** Her build'de "bugün" yazmak,
 *    içerik değişmediği halde "hepsi güncellendi" demek olur; Google yanlış
 *    lastmod gördüğünde bu sinyali tamamen yok sayar. Yazılarda ise gerçek
 *    yayın tarihi kullanılır.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const dates = postDates();

  const staticEntries = paths.flatMap(({ path, priority }) => {
    const languages: Record<string, string> = {};
    for (const l of routing.locales) {
      languages[localeHreflang[l]] = `${SITE_URL}${localePath(l, path)}`;
    }
    languages["x-default"] = `${SITE_URL}${localePath(routing.defaultLocale, path)}`;

    return routing.locales.map((l) => ({
      url: `${SITE_URL}${localePath(l, path)}`,
      changeFrequency: "weekly" as const,
      priority,
      alternates: { languages },
    }));
  });

  /* Akademi yazıları — her yazı yalnızca mevcut olduğu dillerde listelenir */
  const postEntries = getAllPostParams().map(({ locale, slug }) => {
    const postLocales = getPostLocales(slug);
    const languages: Record<string, string> = {};
    for (const l of postLocales) {
      languages[localeHreflang[l]] = `${SITE_URL}${localePath(l, `/akademi/${slug}`)}`;
    }
    const xDefault = postLocales.includes(routing.defaultLocale)
      ? routing.defaultLocale
      : postLocales[0];
    if (xDefault) {
      languages["x-default"] = `${SITE_URL}${localePath(xDefault, `/akademi/${slug}`)}`;
    }

    return {
      url: `${SITE_URL}${localePath(locale as AppLocale, `/akademi/${slug}`)}`,
      lastModified: dates[slug] ? new Date(dates[slug]) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages },
    };
  });

  return [...staticEntries, ...postEntries];
}

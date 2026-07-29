import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { rollFormItems, machineItems } from "@/lib/catalog";
import { routing, localeHreflang, type AppLocale } from "@/i18n/routing";
import { localePath } from "@/i18n/seo";
import { getAllPostParams, getPostLocales } from "@/lib/akademi";

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
  ...rollFormItems.map((p) => ({ path: `/roll-form-hatlari/${p.slug}`, priority: 0.8 })),
  ...machineItems.map((p) => ({ path: `/makineler/${p.slug}`, priority: 0.7 })),
];

/* Her yol, her locale için ayrı URL + hreflang alternatifleriyle listelenir */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries = paths.flatMap(({ path, priority }) => {
    const languages: Record<string, string> = {};
    for (const l of routing.locales) {
      languages[localeHreflang[l]] = `${SITE_URL}${localePath(l, path)}`;
    }
    return routing.locales.map((l) => ({
      url: `${SITE_URL}${localePath(l, path)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority,
      alternates: { languages },
    }));
  });

  /* Akademi yazıları — her yazı yalnızca mevcut olduğu dillerde + o dillerin hreflang'i */
  const postEntries = getAllPostParams().map(({ locale, slug }) => {
    const languages: Record<string, string> = {};
    for (const l of getPostLocales(slug)) {
      languages[localeHreflang[l]] = `${SITE_URL}${localePath(l, `/akademi/${slug}`)}`;
    }
    return {
      url: `${SITE_URL}${localePath(locale as AppLocale, `/akademi/${slug}`)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages },
    };
  });

  return [...staticEntries, ...postEntries];
}

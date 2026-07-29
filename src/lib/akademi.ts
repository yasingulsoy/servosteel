import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Servosteel Akademi — repo içi MDX içerik koleksiyonu (SUNUCU tarafı; fs kullanır).
 * Yazılar: src/content/akademi/{locale}/{slug}.mdx  (YAML frontmatter + gövde).
 * Tüm okuma build zamanında (SSG) olur; ham MDX dosyaları deploy'a çıkmaz.
 * Arayüz metinleri için client-safe @/lib/akademi-ui kullanılır.
 */

const CONTENT_DIR = path.join(process.cwd(), "src", "content", "akademi");

export type PostMeta = {
  slug: string;
  locale: AppLocale;
  title: string;
  description: string;
  date: string; // ISO (YYYY-MM-DD)
  author: string;
  cover?: string;
  tags: string[];
  readingMinutes: number;
};

export type Post = PostMeta & { content: string };

const localeDir = (locale: string) => path.join(CONTENT_DIR, locale);

function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function toMeta(locale: string, slug: string, raw: string): { meta: PostMeta; content: string } {
  const { data, content } = matter(raw);
  return {
    content,
    meta: {
      slug,
      locale: locale as AppLocale,
      title: String(data.title ?? slug),
      description: String(data.description ?? ""),
      date: String(data.date ?? ""),
      author: String(data.author ?? "Servosteel"),
      cover: data.cover ? String(data.cover) : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      readingMinutes: readingMinutes(content),
    },
  };
}

/** Bir dildeki tüm yazıların meta verisi — yeni tarihten eskiye sıralı. */
export function getPosts(locale: string): PostMeta[] {
  const dir = localeDir(locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      return toMeta(locale, slug, fs.readFileSync(path.join(dir, file), "utf8")).meta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Tek yazı (gövde dahil) veya bulunamazsa null. */
export function getPost(locale: string, slug: string): Post | null {
  const file = path.join(localeDir(locale), `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const { meta, content } = toMeta(locale, slug, fs.readFileSync(file, "utf8"));
  return { ...meta, content };
}

/** generateStaticParams için tüm (locale, slug) çiftleri. */
export function getAllPostParams(): { locale: string; slug: string }[] {
  return routing.locales.flatMap((locale) =>
    getPosts(locale).map((p) => ({ locale, slug: p.slug }))
  );
}

/** Bir slug'ın mevcut olduğu diller (hreflang alternatifleri için). */
export function getPostLocales(slug: string): AppLocale[] {
  return routing.locales.filter((l) => fs.existsSync(path.join(localeDir(l), `${slug}.mdx`)));
}

import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { CtaBand } from "@/components/cta-band";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { getPost, getAllPostParams, getPostLocales } from "@/lib/akademi";
import { getAkademiUi } from "@/lib/akademi-ui";
import { localePath } from "@/i18n/seo";
import { localeHreflang, type AppLocale } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return getAllPostParams();
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPost(locale, slug);
  if (!post) return {};

  const languages: Record<string, string> = {};
  for (const l of getPostLocales(slug)) {
    languages[localeHreflang[l]] = localePath(l, `/akademi/${slug}`);
  }

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: localePath(locale as AppLocale, `/akademi/${slug}`), languages },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

/* MDX içindeki dahili linkler locale-önekli Link'e, dış linkler yeni sekmeye. */
const mdxComponents = {
  a: ({ href = "", children }: { href?: string; children?: ReactNode }) =>
    href.startsWith("/") ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
};

export default async function AkademiPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getPost(locale, slug);
  if (!post) notFound();

  const ui = getAkademiUi(locale);
  const df = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date || undefined,
    dateModified: post.date || undefined,
    inLanguage: locale,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-full.png` },
    },
    image: post.cover ? `${SITE_URL}${post.cover}` : undefined,
    mainEntityOfPage: `${SITE_URL}${localePath(locale as AppLocale, `/akademi/${slug}`)}`,
  };

  return (
    <article className="pb-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-3xl px-4 pt-10 lg:pt-14">
        <Link href="/akademi" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180" strokeWidth={1.8} aria-hidden />
          {ui.allPosts}
        </Link>
        <h1 className="font-display mt-5 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{post.author}</span>
          <span aria-hidden>·</span>
          {post.date && <time dateTime={post.date}>{df.format(new Date(post.date))}</time>}
          <span aria-hidden>·</span>
          <span>
            {post.readingMinutes} {ui.minRead}
          </span>
        </div>
      </div>

      {post.cover && (
        <div className="mx-auto mt-8 max-w-4xl px-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-line bg-surface-alt">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      <div className="mx-auto mt-10 max-w-3xl px-4">
        <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-display prose-headings:tracking-tight prose-a:font-medium prose-a:text-accent-ink prose-img:rounded-xl">
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-3xl px-4">
        <Link href="/akademi" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180" strokeWidth={1.8} aria-hidden />
          {ui.allPosts}
        </Link>
      </div>

      <div className="mt-16">
        <CtaBand />
      </div>
    </article>
  );
}

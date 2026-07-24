import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/reveal";
import { CONTACT } from "@/lib/site";

/** Sayfa sonu altın CTA bandı — başlık/metin verilmezse çeviriden gelir */
export function CtaBand({ title, text }: { title?: string; text?: string }) {
  const t = useTranslations("cta");

  return (
    <section className="bg-gradient-to-br from-accent to-accent-strong text-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-16 lg:flex-row lg:items-center">
        <Reveal>
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">
            {title ?? t("title")}
          </h2>
          <p className="mt-3 max-w-xl font-medium text-zinc-950/75">{text ?? t("text")}</p>
        </Reveal>
        <Reveal delay={120}>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/teklif-al"
              className="rounded-lg bg-zinc-950 px-6 py-3.5 text-sm font-bold text-white shadow-xl transition-transform hover:scale-[1.03]"
            >
              {t("quote")}
            </Link>
            <a
              href={CONTACT.phoneHref}
              className="rounded-lg border border-zinc-950/40 px-6 py-3.5 text-sm font-bold transition-colors hover:bg-zinc-950/10"
            >
              {CONTACT.phoneDisplay}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

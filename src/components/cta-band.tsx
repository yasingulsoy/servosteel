import { useTranslations } from "next-intl";
import { Reveal } from "@/components/reveal";
import { SpecularButton } from "@/components/specular-button";
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
            <SpecularButton href="/teklif-al" variant="dark" size="lg">
              {t("quote")}
            </SpecularButton>
            <SpecularButton href={CONTACT.phoneHref} variant="ghost" size="lg" className="text-zinc-950">
              {CONTACT.phoneDisplay}
            </SpecularButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

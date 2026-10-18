import { ArrowRight, Factory } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/reveal";
import { getAkademiUi } from "@/lib/akademi-ui";
import { machineKeys, machinesFor } from "@/lib/related-machines";

/**
 * Akademi yazısının sonunda "ilgili hatlar ve makineler" — yazıdan ürün
 * sayfasına köprü (RelatedReading'in tersi). Gerekçe related-machines.ts'te.
 *
 * SUNUCU bileşeni. Adlar mevcut çeviri anahtarlarından okunur, yeni ürün metni
 * yazılmaz; tanınmayan yol listeye girmez, hiçbiri yoksa bölüm basılmaz.
 */
export async function RelatedMachines({ slug, locale }: { slug: string; locale: string }) {
  const t = await getTranslations({ locale });
  const items = machinesFor(slug)
    .map((path) => {
      const k = machineKeys(path);
      if (!k || !t.has(k.name)) return null;
      return { path, name: t(k.name), short: k.short && t.has(k.short) ? t(k.short) : undefined };
    })
    .filter((x) => x !== null);
  if (!items.length) return null;

  const ui = getAkademiUi(locale);

  return (
    <section aria-labelledby="ilgili-makineler" className="mx-auto mt-14 max-w-3xl px-4">
      <Reveal>
        <h2
          id="ilgili-makineler"
          className="font-display text-xl font-bold uppercase tracking-tight text-ink sm:text-2xl"
        >
          {ui.machinesTitle}
        </h2>
      </Reveal>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((m, i) => (
          <li key={m.path}>
            <Reveal delay={i * 70}>
              <Link
                href={m.path}
                className="group flex h-full items-start gap-3 rounded-2xl border border-line bg-card p-5 transition-colors hover:border-accent/50"
              >
                <Factory className="mt-0.5 size-6 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 font-semibold text-ink">
                    {m.name}
                    <ArrowRight
                      className="size-4 shrink-0 text-accent-ink transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                      strokeWidth={1.8}
                      aria-hidden
                    />
                  </span>
                  {m.short && <span className="mt-1 block text-sm leading-relaxed text-muted">{m.short}</span>}
                </span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

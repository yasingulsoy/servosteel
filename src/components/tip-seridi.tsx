import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type TipKarti = {
  src: string;
  alt: string;
  /** Fotoğrafın altındaki görünür etiket: "Hidrolik rulo açıcı" */
  etiket: string;
  /** Tipin kendi sayfası varsa oraya gider */
  href?: string;
  /** Kare kutuda kırpılırken makinenin kalacağı yer (CSS object-position) */
  konum?: string;
};

/**
 * Ürün sayfasında başlığın altındaki tip şeridi (bkz. lib/catalog.ts typesOf):
 * makinenin tipleri yan yana, her biri kendi etiketiyle. Fotoğraflar farklı
 * oranlarda (yatay, dikey) geldiği için hepsi aynı kare kutuda gösterilir;
 * böylece etiketler aynı hizada durur.
 */
export function TipSeridi({ tipler }: { tipler: TipKarti[] }) {
  if (!tipler.length) return null;
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 lg:pt-14">
      <ul className={`grid gap-6 ${tipler.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {tipler.map((t) => {
          const govde = (
            <figure>
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-surface-alt">
                <Image
                  src={t.src}
                  alt={t.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 400px"
                  loading="eager"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  style={t.konum ? { objectPosition: t.konum } : undefined}
                />
              </div>
              <figcaption className="mt-3 flex items-center gap-1.5 font-display text-lg font-bold uppercase tracking-tight text-ink">
                {t.etiket}
                {t.href && (
                  <ArrowRight
                    className="size-4 text-accent-ink transition-transform group-hover:translate-x-0.5 rtl:rotate-180"
                    strokeWidth={2}
                    aria-hidden
                  />
                )}
              </figcaption>
            </figure>
          );
          return (
            <li key={t.src}>
              {t.href ? (
                <Link href={t.href} className="group block">
                  {govde}
                </Link>
              ) : (
                govde
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

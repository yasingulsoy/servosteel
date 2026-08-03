import { ArrowRight } from "lucide-react";
import { SpecularButton } from "@/components/specular-button";

export type VideoBandContentProps = {
  /** Sloganın ilk satırı (beyaz) */
  l1: string;
  /** İkinci satır (altın) */
  l2: string;
  /** Butonun gittiği ürün sayfası */
  href: string;
  /** Buton metni */
  cta: string;
};

/**
 * Video bandı üzerindeki hero düzeni — cam panelin yerini aldı.
 *
 * Hero ile aynı dil: iki satırlık büyük display başlık (ikinci satır altın),
 * altında tek altın buton, dikeyde ortalanmış. Metin gölgesi de hero'yla
 * birebir aynı değerdedir.
 *
 * Sağ/sol hizası BURADA belirlenmez — bandın data-side'ı sürer (globals.css),
 * böylece içeriğin tarafı ile karartmanın koyu tarafı ayrışamaz.
 *
 * Ölçek mobilde belirgin şekilde küçülür: 16:9 bant dar ekranda ~210 px
 * yüksekliğe iner, hero ölçüsündeki başlık oraya sığmaz.
 */
export function VideoBandContent({ l1, l2, href, cta }: VideoBandContentProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="band-content max-w-2xl">
          <h2
            className="font-display text-lg font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-3xl lg:text-5xl xl:text-6xl"
            style={{ textShadow: "0 2px 18px rgba(0,0,0,0.55)" }}
          >
            {l1}
            <br />
            <span className="text-accent">{l2}</span>
          </h2>

          <SpecularButton
            href={href}
            variant="gold"
            size="md"
            className="pointer-events-auto mt-3 sm:mt-6 lg:mt-8"
          >
            {cta}
            <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
          </SpecularButton>
        </div>
      </div>
    </div>
  );
}

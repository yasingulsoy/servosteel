import { Link } from "@/i18n/navigation";

export type MarqueeItem = { label: string; href: string };

/**
 * Sonsuz akan ürün şeridi — dev "hayalet" tipografiyle modern vitrin dokunuşu.
 *
 * Saf CSS animasyonu (globals.css → .marquee): iz iki kez basılır, kayıt
 * -%50'ye kayınca dikişsiz döner. İkinci kopya ekran okuyucudan ve Tab
 * sırasından gizlidir. Hover/odakta durur; RTL'de yön tersine döner;
 * reduced-motion'da hiç akmaz.
 */
export function Marquee({ items }: { items: MarqueeItem[] }) {
  const track = (hidden: boolean) => (
    <ul
      className="flex shrink-0 items-center"
      aria-hidden={hidden || undefined}
    >
      {items.map((item) => (
        <li key={item.href} className="flex shrink-0 items-center">
          <Link
            href={item.href}
            tabIndex={hidden ? -1 : undefined}
            /* text-ink/20 idi: açık temada 1,54:1 kontrast veriyordu, WCAG'in
               büyük metin için istediği 3:1'in çok altında. Bunlar dekoratif
               değil, ürün sayfalarına giden GERÇEK bağlantılar — okunabilir
               olmaları gerekiyor. /50 en düşük geçen değer: açık 3,45:1,
               koyu 5,01:1. */
            className="font-display whitespace-nowrap px-6 py-4 text-2xl font-extrabold uppercase tracking-tight text-ink/50 transition-colors duration-300 hover:text-accent sm:px-9 sm:text-4xl"
          >
            {item.label}
          </Link>
          <span aria-hidden className="size-2 rotate-45 bg-accent/50" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee border-y border-line bg-surface">
      <div className="marquee-track">
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
}

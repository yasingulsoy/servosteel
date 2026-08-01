import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type VideoOverlayCardProps = {
  /** Üstteki küçük kategori satırı */
  eyebrow?: string;
  /** Panelin başlığı — videoda görünen hat/makine adı */
  title: string;
  /** Kısa etiketler: malzeme, kabiliyet veya öne çıkan özellikler */
  chips?: string[];
  /** Tıklanınca gidilecek ürün sayfası */
  href?: string;
  /** Bağlantı metni */
  cta?: string;
};

/**
 * Video bandının üzerine binen cam panel (glassmorphism).
 *
 * Videonun kendisi tıklanabilir bir şey içermediği için dış katman
 * pointer-events-none; sadece panelin kendisi tıklamayı yakalar.
 *
 * backdrop-filter desteklemeyen tarayıcılarda panel saydam kalıp metin
 * okunmaz hale gelmesin diye zemin varsayılan olarak koyu; destek varsa
 * beyaz cama geçiyor.
 */
export function VideoOverlayCard({ eyebrow, title, chips = [], href, cta }: VideoOverlayCardProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end">
      <div className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 sm:pb-10 lg:pb-14">
        {/* Mobilde daha şeffaf (bg-white/5, ince kenar, hafif gölge); sm ve
            üstünde yoğunluk artar. Cam desteği yoksa koyu zemine düşer. */}
        <div className="overlay-card pointer-events-auto max-w-md rounded-xl border border-white/15 bg-black/30 p-4 text-white shadow-lg supports-[backdrop-filter]:bg-white/5 supports-[backdrop-filter]:backdrop-blur-lg sm:rounded-2xl sm:border-white/20 sm:bg-black/45 sm:p-6 sm:shadow-2xl sm:supports-[backdrop-filter]:bg-white/10 sm:supports-[backdrop-filter]:backdrop-blur-xl">
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent sm:text-xs">
              {eyebrow}
            </p>
          )}

          <h2 className="font-display mt-1 text-lg font-bold uppercase leading-tight tracking-tight sm:mt-2 sm:text-2xl">
            {title}
          </h2>

          {/* Etiketler dar ekranda gizli: 16:9 bant telefonda kısaldığı için
              başlık ve bağlantıya öncelik veriliyor. */}
          {chips.length > 0 && (
            <ul className="mt-3 hidden flex-wrap gap-2 sm:flex">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90"
                >
                  {chip}
                </li>
              ))}
            </ul>
          )}

          {href && cta && (
            <Link
              href={href}
              className="group mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-white sm:mt-5"
            >
              {cta}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.8}
                aria-hidden
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

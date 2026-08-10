import { ArrowRight } from "lucide-react";
import { SpecularButton } from "@/components/specular-button";

export type VideoBandContentProps = {
  /** Bandın anlattığı hattın adı — bandın BAŞLIĞI budur. */
  name: string;
  /** Butonun gittiği ürün sayfası */
  href: string;
  /** Buton metni */
  cta: string;
  /**
   * Videolar sayfasındaki bölümün anahtarı (videos.groups.<key>).
   *
   * Verilirse ikinci bir tuş çıkar ve /videolar#<key> adresine gider — o
   * sayfadaki filtre hash'i okuyup yalnızca ilgili bölümü gösterir. Yani "bu
   * hattı gördüm, başka videosu var mı" sorusu bandın kendisinden cevaplanıyor.
   */
  videoGroup?: string;
  /** İkinci tuşun metni (home.videoCta — "Videoları İzleyin") */
  videoCta?: string;
};

/**
 * Video bandı üzerindeki hero düzeni.
 *
 * Başlık HATTIN ADIDIR. Önceden iki satırlık şiirsel bir slogan ("Tek rulodan /
 * onlarca şerit") büyük puntoyla duruyor, hattın gerçek adı ise butonun yanında
 * küçük bir satır olarak kalıyordu. Sıralama ters çevrildi: ürünü arayan kişi
 * ekranda önce onun adını görüyor, slogan tamamen kaldırıldı. Sloganların
 * anlattığı kabiliyetler sayfanın metinlerinde zaten yazılı.
 *
 * Hero ile aynı dil: tek satır büyük display başlık (altın), altında butonlar,
 * dikeyde ortalanmış. Metin gölgesi de hero'yla birebir aynı sınıftan gelir
 * (globals.css .on-video) — videoda karartma perdesi olmadığı için
 * okunabilirliği taşıyan tek şey o.
 *
 * Sağ/sol hizası BURADA belirlenmez — bandın data-side'ı sürer (globals.css).
 *
 * Ölçek mobilde belirgin şekilde küçülür: 16:9 bant dar ekranda ~210 px
 * yüksekliğe iner, hero ölçüsündeki başlık oraya sığmaz.
 */
export function VideoBandContent({
  name,
  href,
  cta,
  videoGroup,
  videoCta,
}: VideoBandContentProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="band-content max-w-2xl">
          <h2 className="on-video font-display text-accent text-lg font-extrabold uppercase leading-[1.05] tracking-tight sm:text-3xl lg:text-5xl xl:text-6xl">
            {name}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-6 lg:mt-8">
            <SpecularButton href={href} variant="gold" size="md" className="pointer-events-auto">
              {cta}
              <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2} aria-hidden />
            </SpecularButton>

            {videoGroup && videoCta && (
              /* Altın tuş ürüne, bu tuş videoya gider. İkincil stil: iki tuş yan
                 yana dururken hangisinin ana eylem olduğu belli kalsın diye
                 altın olan tek başına vurgulu bırakıldı. */
              <a
                href={`/videolar#${videoGroup}`}
                className="on-video-sm pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/15"
              >
                {videoCta}
                <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2} aria-hidden />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

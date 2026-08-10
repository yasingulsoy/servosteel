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
  /**
   * Bandın anlattığı hattın/ürünün GERÇEK adı — butonun yanında görünür.
   *
   * Sloganlar şiirsel ("Tek rulodan onlarca şerit") ve içinde ürünün adı
   * geçmiyor. Ad hiçbir yerde yazılı olmayınca hem okur hangi ürüne baktığını
   * anlamıyor hem de bandın metni ürün adını hiç içermiyordu. Slogan görsel
   * başlık (h2) olarak kalır, ad onun altında h3 olarak durur — başlık
   * hiyerarşisi bozulmaz.
   */
  name?: string;
  /**
   * Videolar sayfasındaki bölümün anahtarı (videos.groups.<key>).
   *
   * Verilirse bandın altına ikinci bir tuş çıkar ve /videolar#<key> adresine
   * gider — o sayfadaki filtre hash'i okuyup yalnızca ilgili bölümü gösterir.
   * Yani "bu videoyu beğendim, benzerleri var mı" sorusu bandın kendisinden
   * cevaplanıyor; ziyaretçi listeyi baştan taramak zorunda kalmıyor.
   */
  videoGroup?: string;
  /** İkinci tuşun metni (home.videoCta — "Videoları İzleyin") */
  videoCta?: string;
};

/**
 * Video bandı üzerindeki hero düzeni — cam panelin yerini aldı.
 *
 * Hero ile aynı dil: iki satırlık büyük display başlık (ikinci satır altın),
 * altında tek altın buton, dikeyde ortalanmış. Metin gölgesi de hero'yla
 * birebir aynı sınıftan gelir (globals.css .on-video / .on-video-sm) —
 * videoda karartma perdesi olmadığı için okunabilirliği taşıyan tek şey o.
 *
 * Sağ/sol hizası BURADA belirlenmez — bandın data-side'ı sürer (globals.css),
 * böylece içeriğin tarafı ile karartmanın koyu tarafı ayrışamaz.
 *
 * Ölçek mobilde belirgin şekilde küçülür: 16:9 bant dar ekranda ~210 px
 * yüksekliğe iner, hero ölçüsündeki başlık oraya sığmaz.
 */
export function VideoBandContent({
  l1,
  l2,
  href,
  cta,
  name,
  videoGroup,
  videoCta,
}: VideoBandContentProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="band-content max-w-2xl">
          <h2 className="on-video font-display text-lg font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-3xl lg:text-5xl xl:text-6xl">
            {l1}
            <br />
            <span className="text-accent">{l2}</span>
          </h2>

          {/* Buton ile ürün adı yan yana; dar ekranda alt alta sarar.
              Ad butonun YANINDA duruyor ama h3 olarak işaretli — görsel yerleşim
              başlık anlamını bozmuyor. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-6 lg:mt-8">
            <SpecularButton href={href} variant="gold" size="md" className="pointer-events-auto">
              {cta}
              <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2} aria-hidden />
            </SpecularButton>

            {videoGroup && videoCta && (
              /* Altın tuş ürüne, bu tuş videoya gider. Cam görünümlü ikincil
                 stil: iki tuş yan yana dururken hangisinin ana eylem olduğu
                 belli kalsın diye altın olan tek başına vurgulu bırakıldı. */
              <a
                href={`/videolar#${videoGroup}`}
                className="on-video-sm pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/60 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/15"
              >
                {videoCta}
                <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={2} aria-hidden />
              </a>
            )}

            {name && (
              <h3 className="on-video-sm font-display text-sm font-bold uppercase tracking-[0.14em] text-white sm:text-base">
                {name}
              </h3>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { embedUrl, humanDuration, thumbUrl } from "@/lib/videos";

/**
 * Tıklanana kadar iframe YÜKLEMEYEN video kartı (facade deseni).
 *
 * Neden: sayfada 24 video var. 24 YouTube iframe'i açılışta ~10 MB ve
 * yüzlerce istek demek olurdu — LCP ve INP çöker. Bunun yerine önce sadece
 * önizleme görseli basılır; kullanıcı tıklayınca o kartın iframe'i doğar
 * (autoplay ile, çünkü tıklama zaten kullanıcı niyetidir).
 *
 * SEO tarafı etkilenmez: VideoObject şeması sunucuda basılır, arama motoru
 * iframe'in varlığına bakmaz.
 */
export function VideoCard({
  id,
  title,
  sec,
  priority = false,
}: {
  id: string;
  title: string;
  sec: number;
  priority?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <figure className="group overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-black/10">
      <div className="relative aspect-video bg-shell">
        {open ? (
          <iframe
            src={`${embedUrl(id)}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={title}
            className="absolute inset-0 size-full cursor-pointer"
          >
            <Image
              src={thumbUrl(id)}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Küçük resim perdesi. Kontrast için gerekmiyordu: oynat düğmesi
                dolu altın, süre rozetinin kendi bg-black/75 zemini var. Yani
                %25 sırf dekoratif karartmaydı — 78 küçük resmi birden soluk
                gösteriyordu. Ayrım için yeten en düşük değere indirildi. */}
            <span aria-hidden className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-zinc-950 shadow-xl transition-transform duration-300 group-hover:scale-110"
            >
              <Play className="size-6 translate-x-0.5 fill-current" />
            </span>
            <span
              aria-hidden
              className="absolute bottom-2 end-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white"
            >
              {humanDuration(sec)}
            </span>
          </button>
        )}
      </div>
      <figcaption className="p-4">
        <h3 className="text-sm font-semibold leading-snug text-ink">{title}</h3>
      </figcaption>
    </figure>
  );
}

import { embedUrl } from "@/lib/videos";

/**
 * Sayfa içi YouTube oynatıcısı — YALNIZ izleme sayfalarında (/videolar/[slug]).
 *
 * Sitenin geri kalanında video kartı YouTube'a gidiyor (17 Eylül kararı, bkz.
 * video-card.tsx). İzleme sayfasında oynatıcı ŞART: Google bir videoyu video
 * sonuçlarına ancak oynatıcı sayfanın ana içeriğiyse alır; küçük resim +
 * bağlantı "video izleme sayfasında değil" sayılıyordu (229 video, 11 Ekim).
 * Gömülü oynatmalar YouTube kanalının izlenmesine sayılır.
 *
 * Tıklayınca doğan bir "cephe" (facade) BİLEREK kullanılmadı: Google'ın videoyu
 * sayfada görebilmesi için iframe ilk HTML'de olmalı. youtube-nocookie alan
 * adı, oynatılana kadar çerez bırakmaz. Kaydırmadan görünen tek öğe olduğu
 * için tembel yükleme de yok.
 */
export function VideoPlayer({ id, title }: { id: string; title: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-shell">
      <iframe
        src={embedUrl(id)}
        title={title}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute inset-0 size-full"
      />
    </div>
  );
}

import { CheckCircle2 } from "lucide-react";

/**
 * Gönderim başarılı olduğunda formun YERİNE geçer.
 *
 * Formu bırakıp altına küçük bir yazı eklemek yerine tamamen değiştiriyoruz:
 * mailto döneminde kullanıcı "gönder"e basıp hiçbir şey olmadığını görüyordu.
 * Artık ne olduğu tartışmasız belli olsun — ekranın o bölümü baştan aşağı
 * "alındı" diyor.
 */
export function LeadSent({ text }: { text: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-6"
    >
      <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-accent-ink" strokeWidth={2} aria-hidden />
      <p className="text-sm leading-relaxed font-medium text-ink">{text}</p>
    </div>
  );
}

/** Bot tuzağı — gerçek kullanıcı göremez, otomatik doldurucu doldurur. */
export function HoneyPot() {
  return (
    <div className="hidden" aria-hidden>
      <label htmlFor="lead-website">Website</label>
      <input id="lead-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

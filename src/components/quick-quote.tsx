import { useTranslations } from "next-intl";
import { Phone } from "lucide-react";
import { QuickQuoteForm } from "@/components/quick-quote-form";
import { CONTACT } from "@/lib/site";

/**
 * Hızlı teklif bandı — tam genişlik, solda sayılar ve telefon, sağda dört
 * alanlı form (ad soyad, e-posta, telefon, not).
 *
 * NEREDE: anasayfada "Üç ana hat"ın hemen altında; roll form ve makine
 * listelerinde ürün ızgarasının altında; video sayfasında gruplardan sonra.
 *
 * NEDEN: teklif formunu AÇAN 10 kişiden 9'u gönderiyor; darboğaz form değil,
 * forma varmak. 90 günün 9 talebinin 9'u da iletişim ve teklif sayfalarından
 * geldi — form yalnızca oralarda vardı (bkz. inline-quote.tsx).
 *
 * NEDEN DÖRT ALAN: hat seçimi, firma ve ölçü alanları bu formda yok
 * (2026-09-17, Yasin'in kararı) — ayrıntı teklif sayfasındaki tam formda.
 */
export function QuickQuote({
  guvence,
}: {
  /** Sol sütundaki sayılar — sitede zaten yayımlanan istatistikler. */
  guvence: { value: string; label: string }[];
}) {
  const t = useTranslations("quote.form");
  const th = useTranslations("home");

  return (
    <section id="hizli-teklif" className="relative overflow-hidden border-y border-line bg-surface-alt">
      {/* Arka plandaki ince altın ışık — bölümü sayfanın geri kalanından
          ayırır, zemini koyulaştırmadan. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-40 -top-40 size-[520px] rounded-full bg-accent/15 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:py-24">
        <div className="lg:pt-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
            <span className="h-px w-8 bg-accent" aria-hidden />
            {th("quickEyebrow")}
          </p>
          <h2 className="font-display mt-4 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
            {th("quickTitle")}
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted">{th("quickText")}</p>

          {guvence.length ? (
            <ul className="mt-8 grid max-w-sm grid-cols-2 gap-3">
              {guvence.map((g) => (
                <li key={g.label} className="rounded-xl border border-line bg-card px-4 py-3">
                  <span className="font-display block text-2xl font-extrabold text-accent-ink">{g.value}</span>
                  <span className="block text-xs font-medium text-muted">{g.label}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <a
            href={CONTACT.phoneHref}
            className="mt-8 inline-flex items-center gap-3 text-sm font-semibold text-ink underline-offset-4 hover:text-accent-strong hover:underline"
          >
            <span className="grid size-10 place-items-center rounded-full bg-accent text-zinc-950">
              <Phone className="size-4" strokeWidth={2.2} aria-hidden />
            </span>
            <span>
              <span className="block text-xs font-medium text-muted">{t("callUs")}</span>
              {CONTACT.phoneDisplay}
            </span>
          </a>
        </div>

        <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-xl shadow-black/5">
          <div className="h-1 bg-gradient-to-r from-accent to-accent-strong" aria-hidden />
          <div className="p-5 sm:p-8">
            <QuickQuoteForm idPrefix="hz" />
          </div>
        </div>
      </div>
    </section>
  );
}

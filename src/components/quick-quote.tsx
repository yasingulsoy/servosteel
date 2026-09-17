"use client";

import { useTranslations } from "next-intl";
import { Phone, Send } from "lucide-react";
import { SpecularButton } from "@/components/specular-button";
import { LeadSent, HoneyPot } from "@/components/lead-sent";
import { useLeadSubmit } from "@/components/use-lead-submit";
import { CONTACT } from "@/lib/site";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/25";

/* Teklif formunun etiketleri "E-posta *" biçiminde; işareti bu form alanın
   gerçekten zorunlu olup olmadığına göre kendisi koyuyor. */
const yalin = (s: string) => s.replace(/\s*\*\s*$/, "");

/**
 * Anasayfadaki hızlı teklif formu — dört alan: ad soyad, e-posta, telefon, not.
 *
 * NEDEN ANASAYFADA: teklif formunu AÇAN 10 kişiden 9'u gönderiyor; darboğaz
 * form değil, forma varmak (bkz. inline-quote.tsx). Form "Üç ana hat"ın
 * hemen altında, sayfanın ilk üçte birinde.
 *
 * NEDEN DÖRT ALAN: hat seçimi, firma ve ölçü alanları bu formda yok
 * (2026-09-17, Yasin'in kararı) — ayrıntı teklif sayfasındaki tam formda.
 * Burada amaç ziyaretçiyi en kısa yoldan satış ekibine ulaştırmak.
 * Gönderim teklif sayfasıyla aynı (/api/talep, "rfq"); sayfa adresi talep
 * kaydına düşüyor, panelde hangi formdan geldiği görünür.
 */
export function QuickQuote({
  guvence,
}: {
  /** Sol sütundaki sayılar — sitede zaten yayımlanan istatistikler. */
  guvence: { value: string; label: string }[];
}) {
  const t = useTranslations("quote.form");
  const th = useTranslations("home");
  const { status, submit } = useLeadSubmit("rfq");

  const etiket = (ad: string, zorunlu: boolean) =>
    zorunlu ? (
      `${yalin(ad)} *`
    ) : (
      <>
        {yalin(ad)} <span className="font-normal text-muted">({th("quickOptional")})</span>
      </>
    );

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
            {status === "sent" ? (
              <LeadSent text={t("sent")} />
            ) : (
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <HoneyPot />
                <div className="sm:col-span-2">
                  <label htmlFor="hz-name" className="mb-1.5 block text-sm font-medium text-ink">
                    {etiket(t("name"), true)}
                  </label>
                  <input id="hz-name" name="name" required autoComplete="name" className={inputClass} placeholder={t("namePh")} />
                </div>
                <div>
                  <label htmlFor="hz-email" className="mb-1.5 block text-sm font-medium text-ink">
                    {etiket(t("email"), true)}
                  </label>
                  <input id="hz-email" name="email" type="email" required autoComplete="email" className={inputClass} placeholder={t("emailPh")} />
                </div>
                <div>
                  <label htmlFor="hz-phone" className="mb-1.5 block text-sm font-medium text-ink">
                    {etiket(t("phone"), true)}
                  </label>
                  <input id="hz-phone" name="phone" type="tel" required autoComplete="tel" className={inputClass} placeholder={t("phonePh")} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="hz-message" className="mb-1.5 block text-sm font-medium text-ink">
                    {etiket(t("message"), false)}
                  </label>
                  <textarea id="hz-message" name="message" rows={4} className={inputClass} placeholder={t("messagePh")} />
                </div>

                <div className="flex flex-col gap-3 sm:col-span-2">
                  <SpecularButton
                    type="submit"
                    variant="gold"
                    size="lg"
                    disabled={status === "sending"}
                    className="w-full sm:w-auto sm:self-start"
                  >
                    <Send className="size-4" strokeWidth={2} aria-hidden />
                    {status === "sending" ? t("sending") : t("submit")}
                  </SpecularButton>
                  {status === "failed" && (
                    <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                      {t("failed")}
                    </p>
                  )}
                  <p className="text-xs leading-relaxed text-muted">{t("note")}</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

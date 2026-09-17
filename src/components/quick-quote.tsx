"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Phone, Send } from "lucide-react";
import { SpecularButton } from "@/components/specular-button";
import { LeadSent, HoneyPot } from "@/components/lead-sent";
import { useLeadSubmit } from "@/components/use-lead-submit";
import { CONTACT } from "@/lib/site";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-4 py-3 text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";

/* Teklif formunun etiketleri "Firma *" biçiminde; işareti bu form alanın
   gerçekten zorunlu olup olmadığına göre kendisi koyuyor. */
const yalin = (s: string) => s.replace(/\s*\*\s*$/, "");

/**
 * Anasayfadaki hızlı teklif formu — hat seçimiyle başlar.
 *
 * NEDEN ANASAYFADA: teklif formunu AÇAN 10 kişiden 9'u gönderiyor; darboğaz
 * form değil, forma varmak (bkz. inline-quote.tsx). Anasayfada teklif için
 * bir tuş vardı ama form ayrı sayfadaydı. Form artık "Üç ana hat"ın hemen
 * altında, sayfanın ilk üçte birinde.
 *
 * Hat seçimi ilk adım: ziyaretçiye önce kolay bir soru soruluyor, iletişim
 * bilgisi ikinci adımda. Satış tarafına da talebin hangi hatla ilgili olduğu
 * baştan geliyor. Alanlar ve gönderim teklif sayfasındaki formla aynı
 * (/api/talep, "rfq"); yeni bir akış yok. Sayfa adresi talep kaydına
 * zaten düşüyor, hangi formdan geldiği panelde görünür.
 */
export function QuickQuote({ hatlar }: { hatlar: string[] }) {
  const t = useTranslations("quote.form");
  const th = useTranslations("home");
  const [hat, setHat] = useState<string | null>(null);
  const { status, submit } = useLeadSubmit("rfq");

  const etiket = (ad: string, zorunlu: boolean) =>
    zorunlu ? `${yalin(ad)} *` : (
      <>
        {yalin(ad)} <span className="font-normal text-muted">({th("quickOptional")})</span>
      </>
    );

  return (
    <section id="hizli-teklif" className="border-y border-line bg-surface-alt">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:py-20">
        <div className="lg:pt-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-ink">
            <span className="h-px w-8 bg-accent" aria-hidden />
            {th("quickEyebrow")}
          </p>
          <h2 className="font-display mt-4 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
            {th("quickTitle")}
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted">{th("quickText")}</p>
          <a
            href={CONTACT.phoneHref}
            className="mt-8 inline-flex items-center gap-2.5 text-sm font-semibold text-ink underline-offset-4 hover:text-accent-strong hover:underline"
          >
            <Phone className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
            {t("callUs")}: {CONTACT.phoneDisplay}
          </a>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-7">
          {status === "sent" ? (
            <LeadSent text={t("sent")} />
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-7">
              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-ink">{th("quickStep1")}</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {hatlar.map((h) => (
                    <label
                      key={h}
                      className={`flex cursor-pointer items-center rounded-lg border px-3 py-2.5 text-sm font-medium leading-snug transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40 ${
                        hat === h
                          ? "border-accent bg-accent/10 text-ink"
                          : "border-line bg-card text-ink/80 hover:border-accent/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="product"
                        value={h}
                        required
                        checked={hat === h}
                        onChange={() => setHat(h)}
                        className="sr-only"
                      />
                      {h}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-ink">{th("quickStep2")}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="hz-name" className="mb-1.5 block text-sm font-medium text-ink">
                      {etiket(t("name"), true)}
                    </label>
                    <input id="hz-name" name="name" required autoComplete="name" className={inputClass} placeholder={t("namePh")} />
                  </div>
                  <div>
                    <label htmlFor="hz-company" className="mb-1.5 block text-sm font-medium text-ink">
                      {etiket(t("company"), true)}
                    </label>
                    <input id="hz-company" name="company" required autoComplete="organization" className={inputClass} placeholder={t("companyPh")} />
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
                    <label htmlFor="hz-specs" className="mb-1.5 block text-sm font-medium text-ink">
                      {etiket(t("specs"), false)}
                    </label>
                    <input id="hz-specs" name="specs" className={inputClass} placeholder={t("specsPh")} />
                  </div>
                </div>
              </fieldset>

              <HoneyPot />

              <div className="flex flex-col gap-3">
                <SpecularButton type="submit" variant="gold" size="lg" disabled={status === "sending"} className="self-start">
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
    </section>
  );
}

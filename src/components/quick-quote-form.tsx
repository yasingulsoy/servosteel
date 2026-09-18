"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { SpecularButton } from "@/components/specular-button";
import { LeadSent, HoneyPot } from "@/components/lead-sent";
import { useLeadSubmit } from "@/components/use-lead-submit";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent/25";

/* Teklif formunun etiketleri "E-posta *" biçiminde; işareti bu form alanın
   gerçekten zorunlu olup olmadığına göre kendisi koyuyor. */
const yalin = (s: string) => s.replace(/\s*\*\s*$/, "");

/**
 * Dört alanlı teklif formu: ad soyad, e-posta, telefon, not.
 *
 * Anasayfa bandı (`QuickQuote`) ve ürün sayfalarındaki kart (`InlineQuote`)
 * aynı formu kullanır. Gönderim teklif sayfasıyla aynı (/api/talep, "rfq");
 * sayfa adresi talep kaydına düşer.
 *
 * `product` verilirse gizli alan olarak gider: e-posta konusu "Teklif talebi —
 * {ürün}" olur, satış ekibi hangi makine için yazıldığını açmadan görür.
 */
export function QuickQuoteForm({ product, idPrefix }: { product?: string; idPrefix?: string }) {
  const t = useTranslations("quote.form");
  const th = useTranslations("home");
  const { status, submit } = useLeadSubmit("rfq");
  const otomatik = useId();
  const id = (ad: string) => `${idPrefix ?? otomatik}-${ad}`;

  const etiket = (ad: string, zorunlu: boolean) =>
    zorunlu ? (
      `${yalin(ad)} *`
    ) : (
      <>
        {yalin(ad)} <span className="font-normal text-muted">({th("quickOptional")})</span>
      </>
    );

  if (status === "sent") return <LeadSent text={t("sent")} />;

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <HoneyPot />
      {product ? <input type="hidden" name="product" value={product} /> : null}
      <div className="sm:col-span-2">
        <label htmlFor={id("name")} className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("name"), true)}
        </label>
        <input id={id("name")} name="name" required autoComplete="name" className={inputClass} placeholder={t("namePh")} />
      </div>
      <div>
        <label htmlFor={id("email")} className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("email"), true)}
        </label>
        <input id={id("email")} name="email" type="email" required autoComplete="email" className={inputClass} placeholder={t("emailPh")} />
      </div>
      <div>
        <label htmlFor={id("phone")} className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("phone"), true)}
        </label>
        <input id={id("phone")} name="phone" type="tel" required autoComplete="tel" className={inputClass} placeholder={t("phonePh")} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={id("message")} className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("message"), false)}
        </label>
        <textarea id={id("message")} name="message" rows={4} className={inputClass} placeholder={t("messagePh")} />
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
  );
}

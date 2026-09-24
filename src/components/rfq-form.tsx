"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Phone } from "lucide-react";
import { SpecularButton } from "@/components/specular-button";
import { LeadSent, HoneyPot } from "@/components/lead-sent";
import { useLeadSubmit } from "@/components/use-lead-submit";
import { CONTACT } from "@/lib/site";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-4 py-3 text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";

/* Etiket metinleri çeviride "Telefon *" biçiminde geliyor; yıldızı söküp
   alanın GERÇEK durumuna göre yeniden koyuyoruz (bkz. quick-quote-form). */
const yalin = (s: string) => s.replace(/\s*\*\s*$/, "");

/**
 * Teklif talebi formu. Gönderim /api/talep üzerinden sunucu tarafında yapılır;
 * ziyaretçi sayfadan ayrılmaz ve talebin ulaştığını görür.
 *
 * Mail gövdesi artık burada kurulmuyor — sunucu kuruyor. Sebebi: maili okuyan
 * firma personeli, ziyaretçinin hangi dilde yazdığından bağımsız olarak aynı
 * düzeni görsün. Ziyaretçinin dili ayrı bir satır olarak geçiyor.
 */
export function RfqForm() {
  const t = useTranslations("quote.form");
  const th = useTranslations("home");
  const options = t.raw("options") as string[];
  const [product, setProduct] = useState(options[0]);
  const { status, submit } = useLeadSubmit("rfq");

  /* Zorunlu olan yalnızca ad, firma, e-posta ve ürün. Telefon 2026-09-24'te
     zorunluluktan çıkarıldı: sunucu zaten istemiyordu (api/talep yalnızca ad
     ve geçerli e-posta arar) ve ilk temasta numara istemek, hiç tanımadığı
     yabancı tedarikçiye yazan alıcıyı formun ortasında geri döndürüyordu.
     İsteğe bağlı alanlar artık öyle olduklarını BASMADAN ÖNCE söylüyor. */
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
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="rfq-name" className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("name"), true)}
        </label>
        <input id="rfq-name" name="name" required autoComplete="name" className={inputClass} placeholder={t("namePh")} />
      </div>
      <div>
        <label htmlFor="rfq-company" className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("company"), true)}
        </label>
        <input id="rfq-company" name="company" required autoComplete="organization" className={inputClass} placeholder={t("companyPh")} />
      </div>
      <div>
        <label htmlFor="rfq-email" className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("email"), true)}
        </label>
        <input id="rfq-email" name="email" type="email" required autoComplete="email" className={inputClass} placeholder={t("emailPh")} />
      </div>
      <div>
        <label htmlFor="rfq-phone" className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("phone"), false)}
        </label>
        <input id="rfq-phone" name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder={t("phonePh")} />
      </div>
      <div>
        <label htmlFor="rfq-location" className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("location"), false)}
        </label>
        <input id="rfq-location" name="location" autoComplete="country-name" className={inputClass} placeholder={t("locationPh")} />
      </div>
      <div>
        <label htmlFor="rfq-product" className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("product"), true)}
        </label>
        <select
          id="rfq-product"
          name="product"
          required
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className={inputClass}
        >
          {options.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="rfq-specs" className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("specs"), false)}
        </label>
        <input id="rfq-specs" name="specs" className={inputClass} placeholder={t("specsPh")} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="rfq-message" className="mb-1.5 block text-sm font-medium text-ink">
          {etiket(t("message"), false)}
        </label>
        <textarea id="rfq-message" name="message" rows={5} className={inputClass} placeholder={t("messagePh")} />
      </div>

      <HoneyPot />

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <SpecularButton type="submit" variant="gold" size="lg" disabled={status === "sending"}>
          <Send className="size-4" strokeWidth={2} aria-hidden />
          {status === "sending" ? t("sending") : t("submit")}
        </SpecularButton>
        <SpecularButton
          href={CONTACT.phoneHref}
          variant="ghost"
          size="lg"
          className="text-ink"
        >
          <Phone className="size-4" strokeWidth={2} aria-hidden />
          {t("callUs")}
        </SpecularButton>
      </div>

      {status === "failed" && (
        <p role="alert" className="text-sm font-medium text-red-600 sm:col-span-2 dark:text-red-400">
          {t("failed")}
        </p>
      )}
      <p className="text-xs leading-relaxed text-muted sm:col-span-2">{t("note")}</p>
    </form>
  );
}

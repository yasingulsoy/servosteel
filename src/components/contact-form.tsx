"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { SpecularButton } from "@/components/specular-button";
import { LeadSent, HoneyPot } from "@/components/lead-sent";
import { useLeadSubmit } from "@/components/use-lead-submit";

const inputClass =
  "w-full rounded-lg border border-line bg-card px-4 py-3 text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";

/**
 * Genel amaçlı iletişim formu — RfqForm'un sade kardeşi.
 *
 * Gönderim /api/talep üzerinden sunucu tarafında yapılır; ziyaretçi sayfadan
 * ayrılmaz. Alternatif kanal olarak konu satırı önceden doldurulmuş WhatsApp
 * duruyor — o kanal iyi çalışıyor ve bilerek korundu.
 */
export function ContactForm() {
  const t = useTranslations("contact.form");
  const [subject, setSubject] = useState("");
  const { status, submit } = useLeadSubmit("contact");

  const waText = encodeURIComponent(t("waPrefill", { subject: subject || "-" }));

  if (status === "sent") return <LeadSent text={t("sent")} />;

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="cf-name" className="mb-1.5 block text-sm font-medium text-ink">
          {t("name")}
        </label>
        <input id="cf-name" name="name" required autoComplete="name" className={inputClass} placeholder={t("namePh")} />
      </div>
      <div>
        <label htmlFor="cf-email" className="mb-1.5 block text-sm font-medium text-ink">
          {t("email")}
        </label>
        <input id="cf-email" name="email" type="email" required autoComplete="email" className={inputClass} placeholder={t("emailPh")} />
      </div>
      <div>
        <label htmlFor="cf-phone" className="mb-1.5 block text-sm font-medium text-ink">
          {t("phone")}
        </label>
        <input id="cf-phone" name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder={t("phonePh")} />
      </div>
      <div>
        <label htmlFor="cf-subject" className="mb-1.5 block text-sm font-medium text-ink">
          {t("subject")}
        </label>
        <input
          id="cf-subject"
          name="subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
          placeholder={t("subjectPh")}
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="cf-message" className="mb-1.5 block text-sm font-medium text-ink">
          {t("message")}
        </label>
        <textarea id="cf-message" name="message" required rows={5} className={inputClass} placeholder={t("messagePh")} />
      </div>

      <HoneyPot />

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <SpecularButton type="submit" variant="gold" size="lg" disabled={status === "sending"}>
          <Send className="size-4" strokeWidth={2} aria-hidden />
          {status === "sending" ? t("sending") : t("submit")}
        </SpecularButton>
        <SpecularButton
          href={`https://wa.me/902164153005?text=${waText}`}
          external
          variant="ghost"
          size="lg"
          className="text-ink"
        >
          <FaWhatsapp className="size-4" aria-hidden />
          {t("wa")}
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

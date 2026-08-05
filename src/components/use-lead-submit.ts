"use client";

import { useState } from "react";
import { useLocale } from "next-intl";

/**
 * Form gönderimini /api/talep'e taşır ve durumu döndürür.
 *
 * İki form da aynı davranışı paylaşıyor; mantık burada tek yerde durur ki
 * birinde düzelttiğimiz bir şey diğerinde eksik kalmasın.
 *
 * Başarılı gönderimde GA4'e `generate_lead` olayı gider — bu sitede ölçülecek
 * TEK gerçek dönüşüm o. Sayfa görüntülemesi çok şey anlatmıyor; asıl soru
 * "kaç teklif talebi geldi".
 */

declare global {
  interface Window {
    gtag?: (command: string, event: string, params?: Record<string, unknown>) => void;
  }
}

export type LeadStatus = "idle" | "sending" | "sent" | "failed";

export function useLeadSubmit(kind: "rfq" | "contact") {
  const locale = useLocale();
  const [status, setStatus] = useState<LeadStatus>("idle");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return; // çift tıklama koruması

    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    setStatus("sending");

    try {
      const res = await fetch("/api/talep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          locale,
          name: get("name"),
          email: get("email"),
          company: get("company"),
          phone: get("phone"),
          location: get("location"),
          product: get("product"),
          specs: get("specs"),
          subject: get("subject"),
          message: get("message"),
          website: get("website"), // bal küpü — bkz. api/talep/route.ts
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      window.gtag?.("event", "generate_lead", { form_type: kind, locale });
    } catch {
      setStatus("failed");
    }
  };

  return { status, submit };
}

"use client";

import { useTranslations } from "next-intl";
import { Phone, Mail } from "lucide-react";
import { CONTACT } from "@/lib/site";

/**
 * Her sayfada duran iletişim tuşları: telefon + e-posta.
 *
 * ÖNCESİ WHATSAPP'TI, KALDIRILDI (2026-08-24). Sebep ölçüm: 30 günde
 * **20 tıklama** geldi ve hiçbiri karşılık bulmadı — bağlantıdaki numara
 * firmanın sabit hattı ve o hatta WhatsApp Business hesabı hiç açılmadı.
 * Üç hafta boyunca açılması beklendi, açılmayacağına karar verildi.
 *
 * Çalışmayan bir tuş, hiç tuş olmamasından kötüdür: ziyaretçi en düşük
 * eşikli kanalı seçiyor, karşılık bulamıyor ve genelde ikinci bir deneme
 * yapmıyor. O 20 kişi sessizce kayboldu.
 *
 * Yerine iki gerçek kanal kondu. Telefon önce çünkü bu sektörde alıcı
 * yazmak yerine konuşmayı tercih ediyor — WhatsApp'ın forma yedi kat
 * tıklanmasının sebebi de buydu; istenen WhatsApp değil, **anında temas**.
 *
 * Konum: sağ alt (RTL'de sol alt — `end-*` mantıksal özellik).
 * Erişilebilirlik: ikonlar tek başına anlam taşımadığı için `aria-label`
 * şart; geniş ekranda metin de görünür, dar ekranda yalnızca ikon kalır.
 */
export function ContactFloat() {
  const t = useTranslations("common");

  return (
    /* z-40: header (z-50) altında kalsın ki mobil menü açıkken üstüne
       binmesin. print:hidden — çıktıda anlamsız. */
    <div className="fixed bottom-5 end-5 z-40 flex flex-col items-end gap-2.5 print:hidden">
      <a
        href={`mailto:${CONTACT.email}`}
        aria-label={t("floatMail")}
        className="group flex items-center gap-2.5 rounded-full bg-shell py-3 ps-3 pe-4 text-white shadow-lg shadow-black/25 transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shell motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        <Mail className="size-5 shrink-0" strokeWidth={2} aria-hidden />
        <span className="hidden text-sm font-semibold sm:inline">{t("floatMail")}</span>
      </a>

      {/* Telefon altta ve vurgulu: başparmağın en kolay ulaştığı yer ve
          sektörde en çok istenen kanal. */}
      <a
        href={CONTACT.phoneHref}
        aria-label={`${t("floatCall")} — ${CONTACT.phoneDisplay}`}
        className="group flex items-center gap-2.5 rounded-full bg-accent py-3.5 ps-3.5 pe-4 text-zinc-950 shadow-lg shadow-accent/30 transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        <Phone className="size-6 shrink-0" strokeWidth={2} aria-hidden />
        <span className="hidden text-sm font-semibold sm:inline">{t("floatCall")}</span>
      </a>
    </div>
  );
}

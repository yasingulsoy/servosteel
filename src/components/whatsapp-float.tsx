"use client";

import { useTranslations } from "next-intl";
import { FaWhatsapp } from "react-icons/fa6";
import { WHATSAPP_URL } from "@/lib/site";

/**
 * Her sayfada duran WhatsApp tuşu.
 *
 * Neden var: 28 günlük ölçümde WhatsApp'a **6**, iletişim formuna **2** tıklama
 * geldi — bu sektörde insanlar yazışmak yerine konuşmak istiyor. Ama WhatsApp
 * bağlantısı yalnızca /iletisim sayfasında, iki formun altında ve sosyal ikon
 * sırasındaydı. Ana sayfayı 185 kişi görürken iletişim sayfasına 41 kişi
 * iniyordu; kalan 144 kişinin WhatsApp'a ulaşacağı bir yol yoktu.
 *
 * Konum: sağ alt (RTL'de sol alt — `end-*` mantıksal özellik). Hero'daki
 * "aşağı kaydır" göstergesi ekranın ortasında olduğu için çakışmıyor.
 *
 * Erişilebilirlik: ikon tek başına anlam taşımadığı için `aria-label` şart;
 * geniş ekranda metin de görünür, dar ekranda yalnızca ikon kalır.
 */
export function WhatsAppFloat() {
  const t = useTranslations("common");

  return (
    <a
      href={`${WHATSAPP_URL}?text=${encodeURIComponent(t("waFloatPrefill"))}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("waFloat")}
      /* z-40: header (z-50) altında kalsın ki mobil menü açıkken üstüne binmesin.
         print:hidden — çıktıda anlamsız. */
      className="group fixed bottom-5 end-5 z-40 flex items-center gap-2.5 rounded-full bg-[#25D366] py-3.5 ps-3.5 pe-4 text-white shadow-lg shadow-black/25 transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] motion-reduce:transition-none motion-reduce:hover:scale-100 print:hidden"
    >
      <FaWhatsapp className="size-6 shrink-0" aria-hidden />
      <span className="hidden text-sm font-semibold sm:inline">{t("waFloat")}</span>
    </a>
  );
}

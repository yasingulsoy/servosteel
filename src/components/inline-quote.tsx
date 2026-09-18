import { useTranslations } from "next-intl";
import { Phone } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { QuickQuoteForm } from "@/components/quick-quote-form";
import { CONTACT } from "@/lib/site";

/**
 * Sayfanın gövdesine giren teklif FORMU — ürün sayfalarında teknik tablonun
 * hemen altında, Akademi yazılarında yazının sonunda.
 *
 * NEDEN FORM, DÜĞME DEĞİL: burada önceden "/teklif-al"a giden bir düğme
 * vardı. 90 günde gelen 9 talebin 9'u da iletişim ve teklif sayfalarından
 * geldi (GA4, 2026-09-18) — form yalnızca oralarda vardı. Ziyaretçi ürün
 * sayfasından o sayfalara geçmek zorundaydı ve formu AÇAN 10 kişiden 9'u
 * gönderdiği için kayıp tam o geçişte. Form artık ziyaretçinin olduğu yerde.
 *
 * NEDEN TABLONUN ALTINDA: Clarity'de ürün sayfalarında kaydırma %53-58'de
 * duruyor; sayfa sonundaki altın `CtaBand`'i ziyaretçilerin yarısı görmüyor.
 * Ölçü tablosunu okuyan ziyaretçi "bu bana uyar mı" sorusunu geçmiş, sırada
 * "ne kadar" var.
 *
 * `name` verilirse başlık "{ürün} için teklif alın" olur ve ürün adı talebe
 * gizli alan olarak eklenir. Yeni çeviri anahtarı yok: `detail.quoteTitle`,
 * `home.quick*` ve `quote.form.*` dokuz dilde zaten var.
 */
export function InlineQuote({ name }: { name?: string }) {
  const t = useTranslations("quote.form");
  const td = useTranslations("detail");
  const th = useTranslations("home");

  return (
    <Reveal>
      <div
        id="teklif-formu"
        className="mt-12 scroll-mt-28 overflow-hidden rounded-2xl border border-line bg-card shadow-lg shadow-black/5"
      >
        <div className="h-1 bg-gradient-to-r from-accent to-accent-strong" aria-hidden />
        <div className="p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink sm:text-2xl">
            {name ? td("quoteTitle", { name }) : th("quickTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{th("quickText")}</p>

          <div className="mt-6">
            <QuickQuoteForm product={name} />
          </div>

          {/* Telefon formun altında ama duruyor: iletişim tuşu ölçümünde
              e-postanın iki katı tıklanıyor. */}
          <a
            href={CONTACT.phoneHref}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink underline-offset-4 transition-colors hover:text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Phone className="size-4 shrink-0 text-accent-ink" strokeWidth={2.2} aria-hidden />
            <span className="text-muted">{t("callUs")}:</span>
            {CONTACT.phoneDisplay}
          </a>
        </div>
      </div>
    </Reveal>
  );
}

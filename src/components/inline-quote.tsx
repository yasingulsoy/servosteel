import { useTranslations } from "next-intl";
import { Phone } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SpecularButton } from "@/components/specular-button";
import { CONTACT } from "@/lib/site";

/**
 * Teknik tablonun hemen ALTINA giren kompakt teklif çağrısı.
 *
 * NEDEN BURADA: Clarity'de ürün sayfalarında kaydırma **%53–58**'de duruyor
 * (2026-09-15). Sayfa sonundaki altın `CtaBand`'i ziyaretçilerin yarısı hiç
 * görmüyor; yan sütundaki teklif tuşu ise mobilde gövde metninin tamamının
 * altına iniyor. Yani en güçlü iki çağrımız da eşiğin dışında kalıyordu.
 *
 * Tablodan hemen sonrası, sayfanın en isabetli yeri: ölçü tablosunu okuyan
 * ziyaretçi zaten "bu bana uyar mı" sorusunu geçmiş, sırada "ne kadar" var.
 *
 * Ölçüm bunun neden önemli olduğunu söylüyor: formu AÇAN 10 kişiden 9'u
 * gönderiyor — darboğaz form değil, forma varmak.
 *
 * Bilerek SAKİN tasarlandı: `CtaBand` altın ve tam genişlik; bu kart kenarlıklı
 * ve nötr. İkisi aynı anda bağırırsa sayfa reklam panosuna döner ve ikisi de
 * okunmaz olur.
 *
 * Yeni çeviri anahtarı EKLENMEDİ — `detail.machineQuote` ve `cta.text` dokuz
 * dilde zaten var.
 */
export function InlineQuote() {
  const t = useTranslations("cta");
  const td = useTranslations("detail");

  return (
    <Reveal>
      <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-line bg-surface-alt p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <p className="max-w-xl text-sm leading-relaxed text-muted">{t("text")}</p>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <SpecularButton href="/teklif-al" variant="gold" size="md">
            {td("machineQuote")}
          </SpecularButton>
          {/* Telefon ikinci ama duruyor: iletişim tuşu ölçümünde e-postanın
              iki katı tıklanıyor (20 günde telefon 9, e-posta 4). */}
          <a
            href={CONTACT.phoneHref}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-ink underline-offset-4 transition-colors hover:text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Phone className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
            {CONTACT.phoneDisplay}
          </a>
        </div>
      </div>
    </Reveal>
  );
}

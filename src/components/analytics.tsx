import Script from "next/script";
import { CLARITY_PROJECT_ID, GA_MEASUREMENT_ID, IS_PRODUCTION_SITE } from "@/lib/site";

/**
 * Google Analytics 4 + Microsoft Clarity.
 *
 * İkisi farklı soruya cevap veriyor: GA4 "kaç kişi, nereden, hangi sayfa",
 * Clarity "o sayfada ne yaptı" — kaydırma derinliği, ölü tıklama, öfke
 * tıklaması, oturum kaydı. Dönüşüm sıfırken ikincisi olmadan sebep bulunamaz.
 *
 * ÖNIZLEME KOPYALARINDA HİÇ YÜKLENMEZ. Aynı `IS_PRODUCTION_SITE` korumasına
 * bağlı — robots.txt ve canonical de ondan besleniyor, yani "burası canlı mı"
 * sorusunun tek bir cevabı var. Demo domainlerinden gelen ziyaretler gerçek
 * rakamları şişirmez.
 *
 * `afterInteractive`: sayfa etkileşime hazır olduktan SONRA yüklenir. GA'yı
 * `beforeInteractive` ile yüklemek üçüncü parti bir isteği kritik yola sokar
 * ve LCP'yi geciktirir — bu sitede hero videosu zaten 7,5 MB, oraya bir de
 * ölçüm scripti eklemenin anlamı yok.
 */
export function Analytics() {
  if (!IS_PRODUCTION_SITE) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
      </Script>

      {/* Clarity'nin kendi yükleyicisi: script etiketini kendisi oluşturup
          DOM'a sokuyor. next/script'in `src`'siyle değiştirilmedi çünkü
          Clarity kuyruk fonksiyonunu (`clarity.q`) etiketten ÖNCE tanımlamak
          zorunda — aksi halde tag inmeden çağrılan olaylar kaybolur. */}
      <Script id="clarity-init" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_PROJECT_ID}");`}
      </Script>
    </>
  );
}

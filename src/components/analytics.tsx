import Script from "next/script";
import { GA_MEASUREMENT_ID, IS_PRODUCTION_SITE } from "@/lib/site";

/**
 * Google Analytics 4.
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
    </>
  );
}

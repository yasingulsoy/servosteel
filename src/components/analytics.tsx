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
      {/* `_rsc` adres çubuğundan temizlenir — Next.js'in prefetch parametresi.
          29 Ağustos 2026'da bir tarayıcı robotu prefetch adreslerini de gezdi;
          GA4 bunları ayrı iniş sayfası saydı ve tek günde 76 sahte "doğrudan"
          oturum üretti. O gün bir haftalık analizi bozdu — ortalamayı iki
          katına çıkarıp olmayan bir trafik düşüşü gösterdi.

          YALNIZCA `_rsc` siliniyor. Tüm sorgu dizesini atmak `utm_*`
          etiketlerini de siler ve kampanya atfını kör eder — GA4 kaynağı
          page_location'dan okuyor. */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());var _l=location.href;try{var _u=new URL(_l);if(_u.searchParams.has('_rsc')){_u.searchParams.delete('_rsc');_l=_u.href}}catch(e){}gtag('config','${GA_MEASUREMENT_ID}',{page_location:_l});`}
      </Script>

      {/* tel: ve mailto: tıklamaları — GA4 bunları KENDİ BAŞINA saymıyor.
          Gelişmiş ölçümün outbound_click'i yalnızca dış bağlantılarda
          çalışıyor; `tel:`/`mailto:` dış link sayılmıyor. WhatsApp tuşu
          `https://wa.me/...` olduğu için sayılıyordu, telefon/e-postaya
          geçince ölçüm kör kaldı.

          Olay adı `click`, parametre `link_url` — mevcut raporlar bu ikisini
          sorguluyor, GA4 arayüzünde özel boyut tanımlamaya gerek kalmıyor.
          Yakalama aşamasında dinleniyor ki sayfa terk edilmeden önce gitsin. */}
      <Script id="ga4-contact-clicks" strategy="afterInteractive">
        {`document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest&&e.target.closest('a[href^="tel:"],a[href^="mailto:"]');
  if(!a||typeof gtag!=='function')return;
  var h=a.getAttribute('href')||'';
  gtag('event','click',{
    link_url:h,
    link_text:(a.innerText||a.getAttribute('aria-label')||'').trim().slice(0,100),
    contact_type:h.indexOf('tel:')===0?'phone':'email',
    transport_type:'beacon'
  });
},true);`}
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

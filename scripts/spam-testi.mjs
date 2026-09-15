/**
 * Spam süzgecinin sınavı: gerçek spam elenmeli, GERÇEK TALEP GEÇMELİ.
 *
 * İkincisi daha önemli. Kaçan bir spam can sıkar; elenen bir talep satış
 * kaybettirir. O yüzden örneklerin çoğu gerçek alıcı senaryosu ve içlerinde
 * bilerek "database", "sample", "regards" gibi tuzak kelimeler var.
 *
 *   node scripts/spam-testi.mjs
 */
import { spamPuani } from "../src/lib/spam.ts";

const ORNEKLER = [
  // --- ELENMESİ gerekenler -------------------------------------------
  {
    beklenen: "spam",
    ad: "Liste satıcısı (14 Eyl'de gerçekten geldi)",
    konu: "Sheet Metal Industry Database",
    mesaj: `Hello,

I'm reaching out to see if you'd be interested in accessing our latest Sheet Metal Industry Database.

We provide customized, verified B2B contact databases covering relevant companies and key decision-makers based on your specific requirements.

Our verified database includes key decision-makers such CEO, President, Owner, Managing Director, Procurement Director, Purchasing Manager.

If you'd like to review a free sample, simply share your targeting criteria:

• Target Industry: ____________________
• Target Job Titles: ____________________
• Target Geographies: ____________________

Best regards,
Sophia Rose

If you're not interested, please reply "Opt Out"`,
  },
  {
    beklenen: "spam",
    ad: "SEO ajansı toplu gönderimi",
    konu: "Improve your rankings",
    mesaj: `Dear Sir,

We offer guest post and backlink packages to improve your SEO.
See https://a.example https://b.example https://c.example

Best regards,
Mark

To unsubscribe reply STOP`,
  },

  // --- GEÇMESİ gerekenler --------------------------------------------
  {
    beklenen: "temiz",
    ad: "Türk alıcı, dilme hattı",
    konu: "Rulo dilme hattı teklifi",
    mesaj: `Merhaba,
0,5-3 mm kalınlıkta, 1250 mm genişliğinde galvaniz sac işleyeceğiz.
Rulo ağırlığı 8 ton. Şerit sayısı 6-8 arası olacak.
Teslim süresi ve fiyat bilgisi rica ederim.
Saygılarımla, Mehmet Yılmaz`,
  },
  {
    beklenen: "temiz",
    ad: "İngiliz alıcı, teknik detaylı",
    konu: "Cut to length line enquiry",
    mesaj: `Hello,

We are looking for a cut-to-length line for 2 mm mild steel, 1500 mm width,
coil weight up to 10 tonnes. We need a stacker at the exit.

Could you send technical specifications and a budgetary price?
Our decision makers will review it next month.

Best regards,
John Fletcher, Operations Manager`,
  },
  {
    beklenen: "temiz",
    ad: "Tuzak kelimeli gerçek talep",
    konu: "Machine database / documentation",
    mesaj: `Hi, do you have a database of past installations we could review,
and can you send a free sample of the roll formed profile?
We want to verify surface quality before ordering. Thanks, Anna`,
  },
  {
    beklenen: "temiz",
    ad: "Çok kısa talep",
    konu: "",
    mesaj: "Fiyat listesi gönderebilir misiniz?",
  },
  {
    beklenen: "temiz",
    ad: "Alman alıcı",
    konu: "Anfrage Rollformanlage",
    mesaj: `Guten Tag,
wir suchen eine Rollformanlage für Kabelrinnen, 1,5 mm verzinkt.
Bitte senden Sie uns ein Angebot. Mit freundlichen Grüßen, K. Bauer`,
  },
];

let hata = 0;
console.log(
  "sonuç".padEnd(8) + "örnek".padEnd(40) + "puan".padStart(5) + "  sebepler"
);
console.log("-".repeat(96));

for (const o of ORNEKLER) {
  const r = spamPuani({ mesaj: o.mesaj, konu: o.konu });
  const cikan = r.spam ? "spam" : "temiz";
  const dogru = cikan === o.beklenen;
  if (!dogru) hata++;
  console.log(
    (dogru ? "  ✓ " : "  ✗ ").padEnd(8) +
      o.ad.padEnd(40) +
      String(r.puan).padStart(5) +
      "  " +
      (r.sebepler.join(", ") || "—") +
      (dogru ? "" : `   << BEKLENEN: ${o.beklenen}`)
  );
}

console.log("-".repeat(96));
console.log(hata === 0 ? "Hepsi doğru." : `${hata} örnek YANLIŞ sınıflandı.`);
process.exit(hata === 0 ? 0 : 1);

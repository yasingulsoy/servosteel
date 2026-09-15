/**
 * Form spam süzgeci — puanlama usulü.
 *
 * TEK KURALLA ELEME YAPMIYOR. Gerçek bir alıcı da "database" yazabilir,
 * "sample" isteyebilir. Yanlış pozitif burada çok pahalı: eleyeceğimiz şey
 * bir satış talebi olabilir. O yüzden her sinyal puan ekliyor ve yalnızca
 * TOPLAM eşiği aşarsa mesaj düşüyor.
 *
 * Hedef, siteye gelen gerçek spam ailesi: B2B iletişim listesi / veri tabanı
 * pazarlayan toplu gönderimler. 2026-09-14'te gelen örnek tipik —
 * "Sheet Metal Industry Database", doldurulacak boşluklu şablon, sonunda
 * "reply Opt Out".
 *
 * Bilerek YAPILMAYANLAR:
 *   - Harici servis (Akismet, reCAPTCHA): üçüncü tarafa ziyaretçi verisi
 *     göndermek, KVKK tarafında yeni bir yükümlülük açar. Form zaten az
 *     trafik alıyor; bu kadarı yetiyor.
 *   - Engellenen mesajı kaydetmek: Yasin "kayıt olmasın" dedi. Sayaç
 *     sunucu günlüğünde kalıyor, tablo kirlenmiyor.
 */

/** Tek başına güçlü sinyaller — toplu pazarlamanın imzası. */
const AGIR: [RegExp, number, string][] = [
  [/\bopt[\s-]?out\b/i, 4, "opt-out"],
  [/\bunsubscribe\b/i, 4, "unsubscribe"],
  [/\b(b2b|email|contact|industry)\s+(data\s?base|database|list)\b/i, 4, "liste-satışı"],
  [/\bdecision[\s-]?makers?\b/i, 3, "karar-verici"],
  [/\btargeting\s+criteria\b/i, 3, "hedefleme-kriteri"],
  [/\bverified\s+(database|contacts?|list)\b/i, 3, "doğrulanmış-liste"],
  [/_{4,}/, 3, "boş-doldurma-şablonu"],
];

/** Yardımcı sinyaller — tek başına yetmez, ağırla birleşince eler. */
const HAFIF: [RegExp, number, string][] = [
  [/\bfree\s+sample\b/i, 2, "ücretsiz-örnek"],
  [/\b(seo|backlink|guest\s+post|web\s+design)\b/i, 2, "ajans-spam"],
  [/\bcrypto|bitcoin|forex\b/i, 3, "yatırım-spam"],
  [/\bdear\s+(sir|madam|owner)\b/i, 1, "genel-hitap"],
  [/\bbest\s+regards,?\s*\n/i, 1, "şablon-imza"],
];

const ESIK = 6;

export type SpamSonuc = { spam: boolean; puan: number; sebepler: string[] };

export function spamPuani(alanlar: {
  mesaj?: string;
  konu?: string;
  eposta?: string;
}): SpamSonuc {
  const metin = [alanlar.konu, alanlar.mesaj].filter(Boolean).join("\n");
  if (!metin) return { spam: false, puan: 0, sebepler: [] };

  let puan = 0;
  const sebepler: string[] = [];

  for (const [desen, agirlik, ad] of [...AGIR, ...HAFIF]) {
    if (desen.test(metin)) {
      puan += agirlik;
      sebepler.push(ad);
    }
  }

  /* Bağlantı sayısı: gerçek bir teklif talebinde en fazla bir site adresi
     olur. Üç ve üzeri, tanıtım metni demektir. */
  const baglanti = (metin.match(/https?:\/\//gi) ?? []).length;
  if (baglanti >= 3) {
    puan += 3;
    sebepler.push(`${baglanti}-bağlantı`);
  }

  /* Çok uzun + madde işaretli metin: alıcı sorusu değil, katalog. Tek
     başına elemez, yalnızca diğer sinyalleri destekler. */
  if (metin.length > 1200 && /[•·]\s/.test(metin)) {
    puan += 2;
    sebepler.push("uzun-madde-listesi");
  }

  return { spam: puan >= ESIK, puan, sebepler };
}

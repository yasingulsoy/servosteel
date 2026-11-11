/**
 * Hesaplayıcı kutularındaki sayıyı dile göre yazma ve okuma.
 *
 * NEDEN `type="number"` DEĞİL: o kutu ondalığı tarayıcının diline göre kabul
 * eder, sayfanın diline göre değil; Türkçe sayfada "2,5" yazan ziyaretçi
 * boş değer alabiliyordu. Kutuyu temizleyince de React değeri 0'a çekiyor,
 * ziyaretçi "0" görüyordu (2026-11-11, Yasin'in ekran görüntüsü). Kutu artık
 * düz metin; burada sayfa diline göre biçimlenip okunuyor.
 */

const ayiriciOnbellek = new Map<string, string>();

/** Dilin ondalık ayırıcısı: tr/de/… "," — en/ar "." */
function ondalikAyirici(locale: string): string {
  let a = ayiriciOnbellek.get(locale);
  if (!a) {
    a = new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === "decimal")?.value ?? ".";
    ayiriciOnbellek.set(locale, a);
  }
  return a;
}

/**
 * Kutuya yazılacak metin, ondalık dilin ayırıcısıyla. Geçersiz sayı → boş.
 *
 * Binlik ayırıcı yalnızca `gruplu` istenirse (hesaplanan, okunacak değer:
 * "13.116"). Ziyaretçinin yazacağı kutuda yok — rakamı düzenlerken araya
 * nokta girmesin. Gruplu metin de sayiOku ile aynı sayıya geri okunur.
 */
export function sayiYaz(n: number, locale: string, gruplu = false): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat(locale, { useGrouping: gruplu, maximumFractionDigits: 6 }).format(n);
}

/**
 * Ziyaretçinin yazdığını sayıya çevirir; anlaşılmazsa NaN (hesap "geçersiz"
 * der, 0 ile sessizce hesaplamaz).
 *
 * Hem "," hem "." ondalık sayılır — Türkçe sayfada sayısal tuş takımından
 * "2.5" yazan da doğru sonuç alır. Tek istisna dilin binlik biçimiyle
 * yazılmış sayı: Türkçe "1.250" ve İngilizce "1,250" bin iki yüz elli okunur.
 * Arapça rakamlar (٠-٩) ve ayırıcılar da kabul edilir.
 */
export function sayiOku(metin: string, locale: string): number {
  let s = metin
    .trim()
    .replace(/[٠-٩]/g, (r) => String(r.charCodeAt(0) - 0x660))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",")
    .replace(/[\s  ']/g, "");
  if (s === "") return NaN;

  const virgulDili = ondalikAyirici(locale) === ",";
  const binlikDeseni = virgulDili ? /^[1-9]\d{0,2}(\.\d{3})+(,\d*)?$/ : /^[1-9]\d{0,2}(,\d{3})+(\.\d*)?$/;
  if (binlikDeseni.test(s)) s = s.replace(virgulDili ? /\./g : /,/g, "");

  const son = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
  if (son >= 0) s = `${s.slice(0, son).replace(/[.,]/g, "")}.${s.slice(son + 1)}`;
  if (!/^\d*\.?\d*$/.test(s) || s === ".") return NaN;
  return Number(s);
}

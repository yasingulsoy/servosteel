/**
 * Panelin e-posta istemcisinin SAF yardımcıları — yanıt konusu, alıntı,
 * konuşma zinciri, adres ayıklama.
 *
 * Ayrı dosya ve içe aktarması yok: `scripts/posta-bicim-test.mjs` bunu Node'la
 * doğrudan içe aktarıyor. IMAP/SMTP işi `posta.ts`'te.
 */

/** Konunun başındaki yanıt önekleri: İngilizce, Almanca, İskandinav, Türkçe, Portekizce, İtalyanca. */
const YANIT_ONEKI = /^\s*(re|aw|sv|ynt|res|rif)\s*(\[\d+\])?\s*:/i;
/** İletme önekleri: İngilizce, Almanca, İspanyolca, Fransızca, Portekizce, Türkçe. */
const ILETME_ONEKI = /^\s*(fw|fwd|wg|rv|tr|enc|ilt)\s*:/i;

/** Yanıtın konusu: başında zaten bir yanıt öneki varsa ikinci kez eklenmez ("RE: RE: …" olmaz). */
export function yanitKonusu(konu: string): string {
  const k = (konu ?? "").replace(/\s+/g, " ").trim();
  if (!k) return "RE:";
  return YANIT_ONEKI.test(k) ? k : `RE: ${k}`;
}

/** İletilen iletinin konusu. */
export function iletKonusu(konu: string): string {
  const k = (konu ?? "").replace(/\s+/g, " ").trim();
  if (!k) return "FW:";
  return ILETME_ONEKI.test(k) ? k : `FW: ${k}`;
}

/** Yeni e-postaya, yanıta ve iletmeye eklenen imza — panelde kullanıcı istediği gibi değiştirebilir. */
export const IMZA = "Best regards,\nServosteel\n+90 216 415 30 05 · servosteel.com.tr";

/** Alıntı başlığındaki tarih: yazışma çoğunlukla yabancı alıcıyla, kalıp İngilizce. */
export function alintiTarihi(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** İletilen iletinin gövdeye eklenen başlığı ve metni — istemcilerin tanıdığı kalıp. */
export function iletBlogu(i: { kimden: string; tarih: string | null; konu: string; kime: string; metin: string }): string {
  return `\n\n---------- Forwarded message ----------\nFrom: ${i.kimden}\nDate: ${alintiTarihi(i.tarih)}\nSubject: ${i.konu}\nTo: ${i.kime}\n\n${i.metin}`;
}

/** Alıntının en çok bu kadar karakteri alınır — on turluk zincirler yanıtı şişirmesin. */
export const ALINTI_SINIRI = 8000;

/**
 * Yanıtın altına eklenen alıntı: "On <tarih>, <kişi> wrote:" ve her satırın
 * başında "> ". Başlık İngilizce çünkü yazışmanın çoğu yabancı alıcıyla; bu
 * satır bütün e-posta istemcilerinin tanıdığı kalıp.
 */
export function alintila(metin: string, kimden: string, tarihMetni: string): string {
  let govde = (metin ?? "").replace(/\r\n?/g, "\n").trimEnd();
  let kirpildi = false;
  if (govde.length > ALINTI_SINIRI) {
    govde = govde.slice(0, ALINTI_SINIRI);
    kirpildi = true;
  }
  const satirlar = govde.split("\n").map((s) => (s.startsWith(">") ? `>${s}` : s ? `> ${s}` : ">"));
  if (kirpildi) satirlar.push("> […]");
  const kim = (kimden ?? "").trim() || "the sender";
  const ne = (tarihMetni ?? "").trim();
  return `\n\n${ne ? `On ${ne}, ${kim} wrote:` : `${kim} wrote:`}\n${satirlar.join("\n")}`;
}

/**
 * Konuşma zinciri (References başlığı): yanıtlanan iletinin References'ı +
 * kendi Message-ID'si. E-posta istemcileri yanıtı bununla aynı konuşmaya
 * bağlıyor. Sonsuz uzamasın diye son 12 kimlik.
 */
export function referansZinciri(oncekiReferanslar: string | undefined, mesajKimligi: string | undefined): string {
  const kimlikler = [...(oncekiReferanslar ?? "").matchAll(/<[^<>\s]+>/g)].map((m) => m[0]);
  const kendi = (mesajKimligi ?? "").trim();
  if (kendi) {
    const k = kendi.match(/<[^<>\s]+>/)?.[0] ?? `<${kendi.replace(/[<>\s]/g, "")}>`;
    if (k !== "<>" && !kimlikler.includes(k)) kimlikler.push(k);
  }
  return kimlikler.slice(-12).join(" ");
}

/** Tek bir e-posta adresinin kabaca geçerli olup olmadığı. */
export function adresGecerli(a: string): boolean {
  return /^[^\s@<>(),;:"[\]]+@[^\s@<>(),;:"[\]]+\.[a-z]{2,}$/i.test(a);
}

/**
 * Kutuya yazılan adres listesi → geçerli adresler (küçük harf, tekrarsız) ve
 * geçersiz parçalar. Virgül, noktalı virgül ya da satır sonuyla ayrılabilir;
 * "Ad Soyad <a@b.com>" biçimi de kabul edilir.
 */
export function adresleriAyikla(girdi: string): { gecerli: string[]; gecersiz: string[] } {
  const gecerli: string[] = [];
  const gecersiz: string[] = [];
  for (const parca of (girdi ?? "").split(/[,;\n]+/)) {
    const p = parca.trim();
    if (!p) continue;
    const adres = (p.match(/<([^<>]+)>/)?.[1] ?? p).trim().toLowerCase();
    if (adresGecerli(adres)) {
      if (!gecerli.includes(adres)) gecerli.push(adres);
    } else {
      gecersiz.push(p);
    }
  }
  return { gecerli, gecersiz };
}

/** "Ad <adres>" ya da yalnızca adres — listede ve başlıkta gösterim için. */
export function adresGoster(v: { name?: string; address?: string }[] | undefined): string {
  return (v ?? [])
    .map((a) => {
      const ad = (a.name ?? "").trim();
      const adres = (a.address ?? "").trim();
      return ad && adres ? `${ad} <${adres}>` : ad || adres;
    })
    .filter(Boolean)
    .join(", ");
}

/** Listedeki kısa ad: kişinin adı varsa o, yoksa adres. */
export function kisaAd(v: { name?: string; address?: string }[] | undefined): string {
  const a = v?.[0];
  if (!a) return "—";
  return (a.name ?? "").trim() || (a.address ?? "").trim() || "—";
}

/** Kutunun panelde görünen kısa adı: "ege@servosteel.com.tr" → "ege". */
export function kutuKisaAdi(adres: string): string {
  return (adres ?? "").split("@")[0] || adres;
}

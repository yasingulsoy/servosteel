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

/* ---------------------------------------------------------------- ekler */

/** IMAP BODYSTRUCTURE düğümü — imapflow'un verdiğinin burada gereken kısmı. */
export type YapiDugumu = {
  part?: string;
  type: string;
  parameters?: Record<string, string>;
  id?: string;
  encoding?: string;
  size?: number;
  disposition?: string;
  dispositionParameters?: Record<string, string>;
  childNodes?: YapiDugumu[];
  envelope?: { subject?: string };
};

export type Ek = {
  /** IMAP parça numarası ("2", "1.2") — indirirken bununla istenir */
  parca: string;
  ad: string;
  tur: string;
  /** Yaklaşık gerçek boyut (base64 şişmesi düşülmüş) */
  boyut: number;
  /** Metnin içine gömülü görsel (imza logosu, yapıştırılmış ekran görüntüsü) */
  satirIci: boolean;
};

const UZANTI: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "application/pdf": "pdf",
  "message/rfc822": "eml",
  "text/plain": "txt",
  "text/calendar": "ics",
};

/** Dosya adından yol ayırıcı ve denetim karakterleri atılır; boş kalırsa yedek ad. */
export function ekAdiTemizle(ad: string, yedek: string): string {
  const t = (ad ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 150);
  return t || yedek;
}

/**
 * Bir iletinin ekleri, BODYSTRUCTURE'dan — iletinin tamamı indirilmeden, ne
 * kadar büyük olursa olsun eksiksiz. Gövde metni (adsız text/plain, text/html)
 * ve teslim raporu parçaları ek sayılmaz. Ekli bir e-posta (message/rfc822)
 * tek bir .eml olarak kalır, içine inilmez.
 */
export function ekleriBul(kok: YapiDugumu): Ek[] {
  const ekler: Ek[] = [];
  const gez = (d: YapiDugumu) => {
    const tur = (d.type ?? "").toLowerCase();
    if (tur !== "message/rfc822" && d.childNodes?.length) {
      for (const c of d.childNodes) gez(c);
      return;
    }
    if (tur.startsWith("multipart/")) return;
    const yerlesim = (d.disposition ?? "").toLowerCase();
    const ham = d.dispositionParameters?.filename ?? d.parameters?.name ?? "";
    const adli = Boolean(ham.trim());
    if (!adli && yerlesim !== "attachment") {
      if (tur.startsWith("text/")) return; // gövde, teslim raporu başlıkları
      if (tur === "message/delivery-status" || tur === "message/disposition-notification") return;
    }
    const parca = d.part ?? "1";
    const yedek =
      tur === "message/rfc822" && d.envelope?.subject
        ? `${d.envelope.subject}.eml`
        : `${tur.startsWith("image/") ? "gorsel" : "ek"}-${parca}.${UZANTI[tur] ?? "bin"}`;
    const boyut = d.size ?? 0;
    ekler.push({
      parca,
      ad: ekAdiTemizle(ham, ekAdiTemizle(yedek, `ek-${parca}`)),
      tur: tur || "application/octet-stream",
      boyut: (d.encoding ?? "").toLowerCase() === "base64" ? Math.floor(boyut * 0.74) : boyut,
      satirIci: Boolean(d.id) && tur.startsWith("image/") && yerlesim !== "attachment",
    });
  };
  gez(kok);
  return ekler;
}

/** "1,2 MB" · "340 KB" · "12 B" */
export function boyutYaz(bayt: number): string {
  if (!Number.isFinite(bayt) || bayt < 1024) return `${Math.max(0, Math.round(bayt || 0))} B`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${(bayt / (1024 * 1024)).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB`;
}

/**
 * Metindeki "[cid:…]" yer tutucuları siler — Outlook'un düz metin hâlinde
 * gömülü görselin yeri. Görseller okuyucuda ayrıca gösteriliyor.
 */
export function cidTemizle(metin: string): string {
  return (metin ?? "")
    .replace(/\[cid:[^\]\s]*\]/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Tarayıcıda AÇILMASI güvenli türler — betik çalıştıramayanlar. SVG ve HTML bilerek yok. */
export const ONIZLENEBILIR: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "application/pdf",
  "text/plain",
]);

/** Content-Disposition: ASCII yedek ad + UTF-8 ad (RFC 6266 / 5987). */
export function icerikYerlesimi(ad: string, satirIci: boolean): string {
  const ascii =
    ad
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7e]/g, "_")
      .replace(/["\\]/g, "_") || "ek";
  const utf8 = encodeURIComponent(ad).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${satirIci ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}

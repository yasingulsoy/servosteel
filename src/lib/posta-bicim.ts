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
 * Metindeki gömülü görsel yer tutucularını siler. İki biçim var:
 *  - "[cid:…]": Outlook'un düz metin hâlinde ekli görselin yeri. Ekli
 *    görseller okuyucuda ayrıca gösteriliyor.
 *  - "[data:image/png;base64,…]": görsel HTML'in İÇİNE gömülüyse düz metne
 *    binlerce harflik bir dizi olarak geçiyor. Giffin'in 27 Eylül 2026
 *    mailinde iki sosyal medya simgesi okuyucuyu harf yığınına çevirdi.
 *    Yanıtta ve iletide alıntıya da giriyordu.
 */
export const GORSEL_IZI = /\[(cid:[^\]\s]*|data:[a-z]+\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]*)\]/gi;

export function gorselIzleriniTemizle(metin: string): string {
  return (metin ?? "")
    .replace(GORSEL_IZI, "")
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

/* ------------------------------------------------------------- klasörler */

/**
 * Özel klasörler — adres çubuğunda kısa adlarıyla, panelde bu sırayla. Sunucu
 * yolları farklı ("INBOX.Sent", "Sent Items", "INBOX.spam"…); hangisinin ne
 * olduğunu sunucunun SPECIAL-USE işareti, yoksa imapflow'un ad tahmini söylüyor.
 */
export type KlasorTuru = "gelen" | "taslak" | "giden" | "arsiv" | "onemsiz" | "cop";
export const KLASOR_TURLERI: readonly KlasorTuru[] = ["gelen", "taslak", "giden", "arsiv", "onemsiz", "cop"];
export const KLASOR_TURU_ADI: Record<KlasorTuru, string> = {
  gelen: "Gelen",
  taslak: "Taslaklar",
  giden: "Gönderilmiş",
  arsiv: "Arşiv",
  onemsiz: "Önemsiz",
  cop: "Silinmiş",
};
const OZEL_KULLANIM: Record<string, KlasorTuru> = {
  "\drafts": "taslak",
  "\sent": "giden",
  "\archive": "arsiv",
  "\junk": "onemsiz",
  "\trash": "cop",
};

/** imapflow'un LIST cevabından gereken kadarı */
export type HamKlasor = {
  path: string;
  name: string;
  delimiter: string;
  flags: Iterable<string>;
  specialUse?: string;
  specialUseSource?: string;
  status?: { messages?: number; unseen?: number };
};

export type KlasorBilgisi = {
  /** Adres çubuğundaki adı: özel klasörde tür ("onemsiz"), ötekinde yolu */
  anahtar: string;
  /** Sunucudaki yolu ("INBOX.Junk") */
  yol: string;
  ad: string;
  tur: KlasorTuru | null;
  toplam: number;
  okunmamis: number;
  /** Özel olmayan klasörde iç içelik (0 = en üst) — listede girinti */
  derinlik: number;
};

/**
 * Sunucunun klasör listesini panelin sırasına koyar: önce özel klasörler
 * (Gelen, Taslaklar, Gönderilmiş, Arşiv, Önemsiz, Silinmiş), sonra ötekiler
 * yollarına göre. Seçilemeyen (\Noselect) kök düğümler atlanır. Aynı türü iki
 * klasör iddia ederse sunucunun işaretlediği, addan tahmin edilene üstün gelir;
 * kaybeden sıradan klasör olarak kalır — ileti kaybolmasın, görünsün.
 */
export function klasorleriDuzenle(liste: HamKlasor[]): KlasorBilgisi[] {
  const secilebilir = liste.filter((k) => ![...k.flags].some((f) => /^\(noselect|nonexistent)$/i.test(f)));
  const tur = new Map<string, KlasorTuru>();
  const alinan = new Set<KlasorTuru>();
  const oncelik = (k: HamKlasor) => (k.path.toUpperCase() === "INBOX" ? -1 : k.specialUseSource === "name" ? 1 : 0);
  for (const k of [...secilebilir].sort((a, b) => oncelik(a) - oncelik(b))) {
    const t: KlasorTuru | undefined =
      k.path.toUpperCase() === "INBOX" ? "gelen" : OZEL_KULLANIM[(k.specialUse ?? "").toLowerCase()];
    if (t && !alinan.has(t)) {
      tur.set(k.path, t);
      alinan.add(t);
    }
  }
  const sira = (b: KlasorBilgisi) => (b.tur ? KLASOR_TURLERI.indexOf(b.tur) : KLASOR_TURLERI.length);
  return secilebilir
    .map((k): KlasorBilgisi => {
      const t = tur.get(k.path) ?? null;
      const parcalar = k.delimiter ? k.path.split(k.delimiter) : [k.path];
      const kok = parcalar.length > 1 && parcalar[0].toUpperCase() === "INBOX" ? 1 : 0;
      /* Özel olmayan klasörün adı bir türün kısa adıyla çakışırsa ("gelen" diye bir klasör) önek alır */
      const anahtar = t ?? ((KLASOR_TURLERI as readonly string[]).includes(k.path.toLowerCase()) ? `k:${k.path}` : k.path);
      return {
        anahtar,
        yol: k.path,
        ad: t ? KLASOR_TURU_ADI[t] : k.name || k.path,
        tur: t,
        toplam: k.status?.messages ?? 0,
        okunmamis: k.status?.unseen ?? 0,
        derinlik: t ? 0 : Math.max(0, parcalar.length - 1 - kok),
      };
    })
    .sort((a, b) => sira(a) - sira(b) || a.yol.localeCompare(b.yol, "tr"));
}

/**
 * Tümünü yanıtla: gönderen (ya da Reply-To) Kime'ye; ilk iletinin Kime ve
 * Bilgi'sindekiler Bilgi'ye. Kendi adresimiz ve tekrarlar çıkar — Outlook da
 * kendine yazmaz.
 */
export function tumunuYanitlaAlicilari(
  yanitAdresi: string,
  kime: string,
  bilgi: string,
  kendi: string
): { kime: string; bilgi: string } {
  const ben = (kendi ?? "").trim().toLowerCase();
  const ilk = adresleriAyikla(yanitAdresi).gecerli.filter((a) => a !== ben);
  const oteki = [...adresleriAyikla(kime).gecerli, ...adresleriAyikla(bilgi).gecerli].filter(
    (a, i, l) => a !== ben && !ilk.includes(a) && l.indexOf(a) === i
  );
  return { kime: ilk.join(", "), bilgi: oteki.join(", ") };
}

/* --------------------------------------------------------- talep iletme */

/** Talebi iletmenin varsayılan alıcıları: satış (Yasin, 28 Eylül 2026: "info ve yavuz maillerine"). */
export const TALEP_ILET_ALICILARI = "info@servosteel.com.tr, yavuz@servosteel.com.tr";

/** İletilecek talebin gereken alanları (leads-db Talep'in bir kısmı) */
export type IletilenTalep = {
  id: number;
  tur: string;
  ad: string;
  eposta: string;
  firma: string;
  telefon: string;
  ulke: string;
  dil: string;
  mesaj: string;
  sayfa: string;
};

export function talepIletKonusu(t: IletilenTalep): string {
  const kim = t.firma || t.ad || t.eposta || `#${t.id}`;
  const tur = t.tur === "rfq" ? "Teklif talebi" : "İletişim formu";
  return `${tur} #${t.id} — ${kim}${t.ulke ? ` (${t.ulke})` : ""}`.replace(/\s+/g, " ").trim().slice(0, 300);
}

/**
 * Satışa iletilen talebin metni — içeride Türkçe, müşteriye gitmez. Boş alan
 * yazılmaz. Tanıtım mailindeki bağlantıdan geldiyse söylenir (formun açıldığı
 * adreste `utm_source=outreach`). `tarih` İstanbul saatiyle hazır metin.
 */
export function talepIletMetni(t: IletilenTalep, tarih: string): string {
  const alan = (ad: string, deger: string) => (deger?.trim() ? [`${ad}: ${deger.trim()}`] : []);
  const kampanyadan = /[?&]utm_source=outreach\b/i.test(t.sayfa ?? "");
  return [
    "Merhaba,",
    "",
    `Siteden ${t.tur === "rfq" ? "bir teklif talebi" : "bir iletişim formu"} geldi (talep #${t.id}, ${tarih}).` +
      (kampanyadan ? " Tanıtım mailimizdeki bağlantıdan gelip formu doldurdu." : "") +
      " Bilgiler aşağıda.",
    "",
    ...alan("Ad", t.ad),
    ...alan("Firma", t.firma),
    ...alan("E-posta", t.eposta),
    ...alan("Telefon", t.telefon),
    ...alan("Ülke", t.ulke),
    ...alan("Form dili", (t.dil ?? "").toUpperCase()),
    "",
    "Mesaj:",
    t.mesaj?.trim() || "(mesaj yok)",
    "",
    "Gereğini rica ederim.",
    "",
    "Saygılarımla,",
  ].join("\n");
}

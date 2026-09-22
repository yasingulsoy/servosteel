import "server-only";
import { readFileSync } from "node:fs";
import { resolve4, resolve6, resolveMx } from "node:dns/promises";
import path from "node:path";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import {
  altbilgi,
  altbilgiHtml,
  type GonderenKutusu,
  type OutreachAyarlari,
  type SmtpHatasi,
} from "@/lib/outreach-kurallar";
import { metindenDuz, metindenHtml } from "@/lib/eposta-bicim";
import { LOGO_PNG_BASE64 } from "@/lib/eposta-logo";
import { cidGorselleri, epostaSayfasi, gorselCid, LOGO_CID } from "@/lib/eposta-sablon";
import { CONTACT, LEGAL_NAME, SITE_URL } from "@/lib/site";

/**
 * Tanıtım e-postasını firmanın KENDİ SMTP'sinden, AYRI bir kutudan gönderir.
 * Birden çok kutu tanımlıysa hangisinden gideceğini gönderim eylemi seçer
 * (kutuSec); burası yalnızca verilen kutuyla gönderir.
 *
 * Neden kendi sunucumuz: SPF/DKIM/DMARC zaten servosteel.com.tr için hizalı;
 * ek DNS kaydı ve üçüncü taraf hesabı gerekmiyor. Neden ayrı kutu: bkz.
 * `ayarlariOku` — form bildirimleri etkilenmesin.
 *
 * Düz metin + HTML (multipart/alternative). HTML'in süsü (turuncu teklif
 * düğmesi, 2–3 küçük ürün fotoğrafı, imza logosu) eposta-sablon.ts'te; görseller
 * iletiye GÖMÜLÜ (cid, ~15 KB'lık küçük kopyalar, ileti ~85 KB) — uzak görsel
 * Outlook'ta varsayılan engelli ve izleme pikseli sayılıyor. İzleme pikseli YOK;
 * kimin tıkladığını bağlantıdaki UTM söylüyor (`scripts/outreach-olcum.py`).
 * Düz metin parçasında görsel yok, bağlantılar "yazı (adres)".
 *
 * İleti önce BURADA kurulur (MailComposer); aynı ham ileti hem SMTP'ye gider
 * hem kutunun Gönderilmiş klasörüne konur — ikisi arasında fark olamaz.
 */

export const ADRES_SATIRI = `${CONTACT.addressStreet}, ${CONTACT.addressLocality} / ${CONTACT.addressRegion}, Türkiye`;

export function iptalAdresi(anahtar: string): string {
  return `${SITE_URL}/api/unsubscribe?t=${encodeURIComponent(anahtar)}`;
}

/** Her e-postanın sonuna eklenen altbilgi — önizlemede de aynısı gösterilir. */
export function altbilgiMetni(dil: string, iptalUrl: string): string {
  return altbilgi(dil, iptalUrl, LEGAL_NAME, ADRES_SATIRI);
}

/** Altbilginin HTML hâli — abonelik bağlantısı tıklanır yazı. Panel önizlemesi de bunu kullanır. */
export function altbilgiHtmlMetni(dil: string, iptalUrl: string): string {
  return altbilgiHtml(dil, iptalUrl, LEGAL_NAME, ADRES_SATIRI);
}

/** Gönderilecek tam metin: panelde yazılan gövde (`[yazı](adres)` → "yazı (adres)") + değiştirilemeyen altbilgi. */
export function tamMetin(govde: string, dil: string, iptalUrl: string): string {
  return metindenDuz(govde).trimEnd() + altbilgiMetni(dil, iptalUrl);
}

/**
 * Ürün küçük resmi: public/eposta/{slug}.jpg (scripts/eposta-gorselleri.py).
 * Bir kez okunur, bellekte kalır. Dosya yoksa null — o görsel e-postaya
 * konmaz, gönderim durmaz (şerit kalan görsellerle, hiç yoksa yalnızca
 * bağlantıyla çıkar).
 */
const gorselOnbellek = new Map<string, Buffer | null>();
function urunGorseli(slug: string): Buffer | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  if (!gorselOnbellek.has(slug)) {
    let veri: Buffer | null = null;
    try {
      veri = readFileSync(path.join(process.cwd(), "public", "eposta", `${slug}.jpg`));
    } catch {
      console.error(`[outreach] e-posta görseli yok: public/eposta/${slug}.jpg`);
    }
    gorselOnbellek.set(slug, veri);
  }
  return gorselOnbellek.get(slug) ?? null;
}

/**
 * HTML hâli: gövde (editörden temizlenmiş HTML ya da düz metinden üretilen) +
 * şablonun süsleri + imza logosu + gri altbilgi (bkz. eposta-sablon.ts).
 * Görseller `cid:` ile iletideki gömülü parçalara bağlanır (tanitimGonder ekler).
 */
export function tamHtml(govdeHtml: string, dil: string, iptalUrl: string): string {
  return epostaSayfasi(govdeHtml, {
    dil,
    altbilgiHtml: altbilgiHtmlMetni(dil, iptalUrl),
    kaynak: (a) => (a === "logo" || urunGorseli(a) ? `cid:${gorselCid(a)}` : null),
  });
}

/** IMAP sunucusu: OUTREACH_IMAP_HOST / _PORT, yoksa gönderen kutusunun sunucusu, 993. */
export function imapSunucusu(kutu: GonderenKutusu) {
  const host = (process.env.OUTREACH_IMAP_HOST ?? "").trim() || kutu.host;
  const port = Number(process.env.OUTREACH_IMAP_PORT) || 993;
  return { host, port };
}

export function imapIstemcisi(kutu: GonderenKutusu) {
  const { host, port } = imapSunucusu(kutu);
  return new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: { user: kutu.user, pass: kutu.pass },
    logger: false,
    disableAutoIdle: true,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 60_000,
  });
}

/**
 * Giden iletinin kopyasını kutunun Gönderilmiş klasörüne koyar (IMAP APPEND,
 * okunmuş işaretli) — e-posta istemcisinin kendiliğinden yaptığı iş: Liza
 * kutuyu Thunderbird'de açınca giden e-postayı da görür, yanıt gelince konuşma
 * birleşir. Klasör yoksa oluşturulur. Hata olursa gönderim yine geçerli —
 * dönen metin nota yazılır; başarılıysa null.
 */
export async function gonderilmislereEkle(kutu: GonderenKutusu, ham: Buffer): Promise<string | null> {
  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const klasorler = await istemci.list();
    const gonderilmis =
      klasorler.find((k) => k.specialUse === "\\Sent") ??
      klasorler.find((k) => /^(inbox[./])?(sent|sent items|sent messages)$/i.test(k.path));
    let yol = gonderilmis?.path;
    if (!yol) {
      const ayrac = klasorler.find((k) => k.delimiter)?.delimiter ?? ".";
      yol = klasorler.some((k) => k.path.toUpperCase().startsWith(`INBOX${ayrac}`)) ? `INBOX${ayrac}Sent` : "Sent";
      await istemci.mailboxCreate(yol);
    }
    await istemci.append(yol, ham, ["\\Seen"]);
    await istemci.logout();
    return null;
  } catch (h) {
    istemci.close();
    const x = h as { message?: string; responseText?: string };
    return `${x.responseText || x.message || String(h)}`.slice(0, 200);
  }
}

/**
 * Alıcının alan adı e-posta kabul ediyor mu — göndermeden ÖNCE.
 *
 *  "var"        MX kaydı var (ya da MX yok ama A/AAAA var: RFC 5321 örtük MX)
 *  "yok"        alan adı yok, ya da "null MX" (öncelik 0, sunucu ".") — posta almıyor
 *  "bilinmiyor" DNS'e ulaşılamadı; tekrar denenir, firma işaretlenmez
 *
 * Neden: kapanmış firmanın alan adına giden e-posta geri döner; geri dönüş
 * oranı sağlayıcıların spam puanına doğrudan giriyor. Bunu göndermeden
 * yakalamak bedava.
 */
export async function postaSunucusu(eposta: string): Promise<"var" | "yok" | "bilinmiyor"> {
  const alan = eposta.split("@")[1]?.toLowerCase();
  if (!alan) return "yok";
  const kod = (e: unknown) => (e as { code?: string })?.code ?? "";
  const yokKodlari = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);
  try {
    const mx = await resolveMx(alan);
    if (mx.length === 0) throw Object.assign(new Error("bos"), { code: "ENODATA" });
    const gercek = mx.filter((m) => m.exchange && m.exchange !== ".");
    return gercek.length ? "var" : "yok";
  } catch (e) {
    if (!yokKodlari.has(kod(e))) return "bilinmiyor";
  }
  for (const coz of [resolve4, resolve6]) {
    try {
      if ((await coz(alan)).length) return "var";
    } catch (e) {
      if (!yokKodlari.has(kod(e))) return "bilinmiyor";
    }
  }
  return "yok";
}

/**
 * Tek gönderimin üst sınırı. Aralık kuralı (en az 60 sn) bundan uzun olduğu
 * için bir gönderim bitmeden aynı firmaya ikincisi başlayamaz.
 */
const SERT_SINIR_MS = 45_000;

/** `metin`: giden düz metin (kayıt için), her durumda dolu. `ham`: giden ileti (Gönderilmiş'e kopya için). */
export type GonderimCevabi = { metin: string; html: string } & (
  | { durum: "ok"; yanit: string; mesajKimligi: string; ham: Buffer }
  | { durum: "hata"; hata: SmtpHatasi }
  | { durum: "belirsiz"; yanit: string }
);

export async function tanitimGonder(
  ayar: Pick<OutreachAyarlari, "yanitAdresi" | "gizliKopya">,
  kutu: GonderenKutusu,
  /* govde: düz metin (kayıt ve metin parçası). govdeHtml: editörde düzenlenmiş,
     TEMİZLENMİŞ HTML (bkz. eposta-html.ts); yoksa düz metinden üretilir. */
  e: { alici: string; konu: string; govde: string; govdeHtml?: string; dil: string; iptalUrl: string }
): Promise<GonderimCevabi> {
  const tasiyici = nodemailer.createTransport({
    host: kutu.host,
    port: kutu.port,
    secure: kutu.port === 465, // 465 baştan TLS, 587 STARTTLS ile yükseltir
    auth: { user: kutu.user, pass: kutu.pass },
    /* Bağlanamadıysa ya da sunucu selam vermediyse e-posta KESİN gitmedi —
       normal hata. Selamdan sonraki takılmada ise hangi adımda kaldığı
       bilinemiyor (nodemailer her zaman aşımını "CONN" diye bildiriyor):
       DATA gitmiş olabilir. Bu yüzden oturum zaman aşımı sert sınırdan
       UZUN; orta yerde takılan gönderimi sert sınır yakalar ve "belirsiz"
       sayar (gönderildi işaretle + günü durdur), "tekrar dene" demez. */
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 60_000,
  });

  const metin = tamMetin(e.govde, e.dil, e.iptalUrl);
  const html = tamHtml(e.govdeHtml || metindenHtml(e.govde), e.dil, e.iptalUrl);
  const dugum = new MailComposer({
    from: { name: kutu.ad, address: kutu.user },
    to: e.alici,
    ...(ayar.yanitAdresi ? { replyTo: ayar.yanitAdresi } : {}),
    ...(ayar.gizliKopya ? { bcc: ayar.gizliKopya } : {}),
    subject: e.konu,
    text: metin,
    html,
    /* Görseller gömülü: HTML "cid:" ile gösterir, ayrı ek olarak görünmez.
       Yalnızca HTML'de gerçekten geçen ürün görselleri eklenir. */
    attachments: [
      {
        filename: "servosteel.png",
        content: Buffer.from(LOGO_PNG_BASE64, "base64"),
        contentType: "image/png",
        cid: LOGO_CID,
        contentDisposition: "inline",
      },
      ...cidGorselleri(html).flatMap((slug) => {
        const veri = urunGorseli(slug);
        return veri
          ? [{ filename: `${slug}.jpg`, content: veri, contentType: "image/jpeg", cid: gorselCid(slug), contentDisposition: "inline" as const }]
          : [];
      }),
    ],
    headers: {
      /* Gmail/Outlook bunu görünce adresin yanına "abonelikten çık" koyuyor.
         Alıcıya "spam" düğmesinden daha kolay bir yol vermek, itibarı
         korumanın en ucuz yolu. POST tek tıkla çıkarır (RFC 8058). */
      "List-Unsubscribe": `<${e.iptalUrl}>, <mailto:${kutu.user}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  }).compile();
  /* Bcc başlığı ham iletiye yazılmaz (MailComposer atar); alıcılar zarfta. */
  const ham = await dugum.build();
  const mesajKimligi = dugum.messageId();
  const gorev = tasiyici.sendMail({ envelope: dugum.getEnvelope(), raw: ham });

  let saat: ReturnType<typeof setTimeout> | undefined;
  const zamanAsimi = new Promise<"zaman">((coz) => {
    saat = setTimeout(() => coz("zaman"), SERT_SINIR_MS);
  });

  try {
    const r = await Promise.race([gorev, zamanAsimi]);
    if (r === "zaman") {
      return { durum: "belirsiz", yanit: `Sunucu ${SERT_SINIR_MS / 1000} sn içinde cevap vermedi`, metin, html };
    }
    /* Tek alıcı var; reddedildiyse nodemailer zaten hata fırlatır. Yine de
       "kabul edildi" listesi boşsa gitmiş saymıyoruz. */
    if (!r.accepted?.length) {
      return {
        durum: "hata",
        hata: { code: "EENVELOPE", responseCode: 550, response: String(r.response ?? "alıcı kabul edilmedi") },
        metin,
        html,
      };
    }
    return { durum: "ok", yanit: String(r.response ?? ""), mesajKimligi, ham, metin, html };
  } catch (h) {
    const x = h as SmtpHatasi;
    return {
      durum: "hata",
      hata: {
        code: x.code,
        responseCode: x.responseCode,
        response: x.response,
        command: x.command,
        message: x.message,
      },
      metin,
      html,
    };
  } finally {
    clearTimeout(saat);
    tasiyici.close();
  }
}

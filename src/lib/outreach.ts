import "server-only";
import nodemailer from "nodemailer";
import { altbilgi, type OutreachAyarlari, type SmtpHatasi } from "@/lib/outreach-kurallar";
import { CONTACT, LEGAL_NAME, SITE_URL } from "@/lib/site";

/**
 * Tanıtım e-postasını firmanın KENDİ SMTP'sinden, AYRI bir kutudan gönderir.
 *
 * Neden kendi sunucumuz: SPF/DKIM/DMARC zaten servosteel.com.tr için hizalı;
 * ek DNS kaydı ve üçüncü taraf hesabı gerekmiyor. Neden ayrı kutu: bkz.
 * `ayarlariOku` — form bildirimleri etkilenmesin.
 *
 * Yalnızca DÜZ METİN. Soğuk e-postada HTML, görsel ve izleme pikseli spam
 * puanını yükseltiyor; kimin tıkladığını zaten bağlantıdaki UTM söylüyor
 * (`scripts/outreach-olcum.py`).
 */

export const ADRES_SATIRI = `${CONTACT.addressStreet}, ${CONTACT.addressLocality} / ${CONTACT.addressRegion}, Türkiye`;

export function iptalAdresi(anahtar: string): string {
  return `${SITE_URL}/api/unsubscribe?t=${encodeURIComponent(anahtar)}`;
}

/** Her e-postanın sonuna eklenen altbilgi — önizlemede de aynısı gösterilir. */
export function altbilgiMetni(dil: string, iptalUrl: string): string {
  return altbilgi(dil, iptalUrl, LEGAL_NAME, ADRES_SATIRI);
}

/** Gönderilecek tam metin: panelde yazılan gövde + değiştirilemeyen altbilgi. */
export function tamMetin(govde: string, dil: string, iptalUrl: string): string {
  return govde.trimEnd() + altbilgiMetni(dil, iptalUrl);
}

/**
 * Tek gönderimin üst sınırı. Aralık kuralı (en az 60 sn) bundan uzun olduğu
 * için bir gönderim bitmeden aynı firmaya ikincisi başlayamaz.
 */
const SERT_SINIR_MS = 45_000;

export type GonderimCevabi =
  | { durum: "ok"; yanit: string; mesajKimligi: string }
  | { durum: "hata"; hata: SmtpHatasi }
  | { durum: "belirsiz"; yanit: string };

export async function tanitimGonder(
  ayar: OutreachAyarlari,
  e: { alici: string; konu: string; govde: string; dil: string; iptalUrl: string }
): Promise<GonderimCevabi> {
  const tasiyici = nodemailer.createTransport({
    host: ayar.host,
    port: ayar.port,
    secure: ayar.port === 465, // 465 baştan TLS, 587 STARTTLS ile yükseltir
    auth: { user: ayar.user, pass: ayar.pass },
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

  const gorev = tasiyici.sendMail({
    from: { name: ayar.gondericiAdi, address: ayar.user },
    to: e.alici,
    ...(ayar.yanitAdresi ? { replyTo: ayar.yanitAdresi } : {}),
    ...(ayar.gizliKopya ? { bcc: ayar.gizliKopya } : {}),
    subject: e.konu,
    text: tamMetin(e.govde, e.dil, e.iptalUrl),
    headers: {
      /* Gmail/Outlook bunu görünce adresin yanına "abonelikten çık" koyuyor.
         Alıcıya "spam" düğmesinden daha kolay bir yol vermek, itibarı
         korumanın en ucuz yolu. POST tek tıkla çıkarır (RFC 8058). */
      "List-Unsubscribe": `<${e.iptalUrl}>, <mailto:${ayar.user}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  let saat: ReturnType<typeof setTimeout> | undefined;
  const zamanAsimi = new Promise<"zaman">((coz) => {
    saat = setTimeout(() => coz("zaman"), SERT_SINIR_MS);
  });

  try {
    const r = await Promise.race([gorev, zamanAsimi]);
    if (r === "zaman") {
      return { durum: "belirsiz", yanit: `Sunucu ${SERT_SINIR_MS / 1000} sn içinde cevap vermedi` };
    }
    /* Tek alıcı var; reddedildiyse nodemailer zaten hata fırlatır. Yine de
       "kabul edildi" listesi boşsa gitmiş saymıyoruz. */
    if (!r.accepted?.length) {
      return {
        durum: "hata",
        hata: { code: "EENVELOPE", responseCode: 550, response: String(r.response ?? "alıcı kabul edilmedi") },
      };
    }
    return { durum: "ok", yanit: String(r.response ?? ""), mesajKimligi: String(r.messageId ?? "") };
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
    };
  } finally {
    clearTimeout(saat);
    tasiyici.close();
  }
}

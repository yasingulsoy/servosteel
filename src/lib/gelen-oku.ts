import "server-only";
import { simpleParser } from "mailparser";
import { imapIstemcisi } from "@/lib/outreach";
import { ayarlariOku } from "@/lib/outreach-kurallar";
import { htmldenMetin } from "@/lib/eposta-html";

/**
 * Gelen kutusundaki TEK iletiyi okur — panelde "aç ve oku" için.
 *
 * Gövde veritabanında DURMUYOR: `gelen_eposta` yalnızca 500 karakterlik özeti
 * tutuyor. Sebebi hem hesabın 1 GB kotası hem de gereksiz kopya. Onun yerine
 * `kutu + uidvalidity + uid` saklanıyor ve ileti istendiğinde kutudan çekiliyor;
 * böylece panelde görünen şey her zaman kutudaki ileti, kopyası değil.
 *
 * KUTUYA DOKUNMAZ: tarama gibi INBOX salt okunur açılır (EXAMINE) ve gövde
 * BODY.PEEK ile alınır — panelde bir maili açmak onu Liza'nın Thunderbird'ünde
 * "okundu" yapmaz, taşımaz, silmez.
 *
 * Gövde DÜZ METİN döner. Gelen posta güvenilmeyen içeriktir; yanıtları okumak
 * için biçimli HTML'e gerek yok, işlemek ise gereksiz risk. HTML'den başka
 * parça yoksa metne çevrilir (giden e-postanın düz metin parçasıyla aynı yol).
 */

/** 512 KB: uzun alıntı zincirli yanıtlar sığar, ekli devasa ileti indirilmez. */
const EN_COK_BAYT = 512 * 1024;

export type OkunanIleti = {
  konu: string;
  kimden: string;
  kime: string;
  tarih: string | null;
  metin: string;
  /** Ek dosya adları — içerik indirilmez, yalnızca "var" bilgisi */
  ekler: string[];
  /** Gövde EN_COK_BAYT sınırına takıldıysa true */
  kirpildi: boolean;
};

export type OkumaSonucu = { tamam: true; ileti: OkunanIleti } | { tamam: false; hata: string };

const adres = (v: { address?: string; name?: string }[] | undefined) =>
  (v ?? [])
    .map((a) => (a.name ? `${a.name} <${a.address ?? ""}>` : (a.address ?? "")))
    .filter(Boolean)
    .join(", ");

export async function gelenIletiyiOku(
  kutuAdi: string,
  uidvalidity: number,
  uid: number
): Promise<OkumaSonucu> {
  const kutu = ayarlariOku(process.env).kutular.find((k) => k.user === kutuAdi);
  if (!kutu) return { tamam: false, hata: "Bu gönderen kutusu artık tanımlı değil." };

  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const kilit = await istemci.getMailboxLock("INBOX", { readOnly: true });
    try {
      /* UIDVALIDITY değiştiyse UID'ler artık başka iletilere denk gelir —
         yanlış maili göstermektense hiç göstermemek doğru. */
      const gecerlilik = Number(istemci.mailbox ? istemci.mailbox.uidValidity : 0);
      if (gecerlilik !== uidvalidity) {
        return { tamam: false, hata: "Kutu yeniden kurulmuş; bu ileti artık bu numarayla bulunamıyor." };
      }
      const ham = await istemci.fetchOne(
        String(uid),
        { uid: true, source: { maxLength: EN_COK_BAYT } },
        { uid: true }
      );
      if (!ham || !ham.source) {
        return { tamam: false, hata: "İleti kutuda yok — taşınmış ya da silinmiş olabilir." };
      }
      const p = await simpleParser(ham.source);
      const govde = (p.text || (p.html ? htmldenMetin(p.html) : "")).replace(/\r\n?/g, "\n").trim();
      return {
        tamam: true,
        ileti: {
          konu: p.subject ?? "",
          kimden: adres(p.from?.value) || "—",
          kime: adres(Array.isArray(p.to) ? p.to.flatMap((t) => t.value) : p.to?.value) || kutuAdi,
          tarih: p.date ? p.date.toISOString() : null,
          metin: govde || "(ileti boş görünüyor)",
          ekler: (p.attachments ?? [])
            .map((a) => a.filename ?? "")
            .filter(Boolean)
            .slice(0, 20),
          kirpildi: ham.source.length >= EN_COK_BAYT,
        },
      };
    } finally {
      kilit.release();
    }
  } catch (e) {
    return { tamam: false, hata: `Kutuya bağlanılamadı: ${(e as Error).message}`.slice(0, 200) };
  } finally {
    try {
      await istemci.logout();
    } catch {
      /* bağlantı zaten kopmuşsa önemli değil */
    }
  }
}

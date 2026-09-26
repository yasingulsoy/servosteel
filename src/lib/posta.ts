import "server-only";
import { simpleParser, type AddressObject } from "mailparser";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { gonderilmislereEkle, imapIstemcisi } from "@/lib/outreach";
import { ayarlariOku, type GonderenKutusu } from "@/lib/outreach-kurallar";
import { htmldenMetin } from "@/lib/eposta-html";
import { metindenHtml } from "@/lib/eposta-bicim";
import { adresGoster, kisaAd, referansZinciri } from "@/lib/posta-bicim";

/**
 * Panelin e-posta istemcisi — gönderen kutularının GERÇEK klasörleri.
 *
 * Önceki "gelen kutusu" yalnızca taramanın işleyip veritabanına yazdığı
 * iletileri gösteriyordu; kutunun kendisi görünmüyordu. Burası kutuyu IMAP'ten
 * olduğu gibi okur: Gelen (INBOX) ve Gönderilmiş, en yenisi başta, sayfa sayfa.
 * Gönderme aynı kutunun SMTP'siyle yapılır ve kopyası Gönderilmiş'e konur —
 * Thunderbird ne görüyorsa panel de onu görür.
 *
 * KUTUYA DOKUNMAZ (okurken): klasör salt okunur açılır, gövde BODY.PEEK ile
 * alınır. Panelde bir mail açmak onu Thunderbird'de "okundu" yapmaz.
 *
 * Gövde DÜZ METİN: gelen posta güvenilmeyen içerik; HTML'ini işlemek gereksiz
 * risk. Yalnızca HTML parçası olan ileti metne çevrilir.
 *
 * Bu modülü hem panel (sunucu bileşeni + eylem) hem de Claude'un kullandığı
 * uç (`api/posta`) çağırıyor — ikisi aynı kodla çalışır.
 */

export type Klasor = "gelen" | "giden";
export const KLASOR_ADI: Record<Klasor, string> = { gelen: "Gelen", giden: "Gönderilmiş" };

/** Sayfa başına ileti sayısı. */
export const POSTA_SAYFA_BOYU = 40;

/** 512 KB: uzun alıntı zincirli yanıtlar sığar, ekli devasa ileti indirilmez. */
const ILETI_EN_COK_BAYT = 512 * 1024;

export type PostaKutusu = { user: string; ad: string };

/** Panelde görünen kutular — gönderim ayarlarındaki kutuların aynısı. */
export function postaKutulari(): PostaKutusu[] {
  return ayarlariOku(process.env).kutular.map((k) => ({ user: k.user, ad: k.ad }));
}

function kutuBul(adres: string): GonderenKutusu | null {
  const a = (adres ?? "").trim().toLowerCase();
  return ayarlariOku(process.env).kutular.find((k) => k.user === a) ?? null;
}

export type IletiOzeti = {
  uid: number;
  tarih: string | null;
  /** Gelen'de gönderen, Gönderilmiş'te alıcı — listede gösterilecek karşı taraf */
  kisi: string;
  kisiAdres: string;
  konu: string;
  okundu: boolean;
  yanitlandi: boolean;
  ekVar: boolean;
  boyut: number;
};

export type OkunanIleti = {
  uid: number;
  konu: string;
  kimden: string;
  kimdenAdres: string;
  kime: string;
  bilgi: string;
  tarih: string | null;
  metin: string;
  ekler: string[];
  kirpildi: boolean;
  /** Yanıt için: bu iletinin Message-ID'si ve References zinciri */
  mesajKimligi: string;
  referanslar: string;
  /** Yanıtın gideceği adres (Reply-To varsa o, yoksa gönderen) */
  yanitAdresi: string;
};

export type KutuGorunumu =
  | {
      tamam: true;
      klasorYolu: string | null;
      uidvalidity: number;
      toplam: number;
      sayfa: number;
      sayfaSayisi: number;
      iletiler: IletiOzeti[];
      secili: OkunanIleti | null;
      seciliHata: string | null;
    }
  | { tamam: false; hata: string };

type ImapIstemci = ReturnType<typeof imapIstemcisi>;

/** Gönderilmiş klasörünün yolu — sunucu \Sent işaretini vermiyorsa addan. Okurken OLUŞTURMAZ. */
async function gonderilmisYolu(istemci: ImapIstemci): Promise<string | null> {
  const klasorler = await istemci.list();
  const k =
    klasorler.find((x) => x.specialUse === "\\Sent") ??
    klasorler.find((x) => /^(inbox[./])?(sent|sent items|sent messages|gönderilmiş öğeler)$/i.test(x.path));
  return k?.path ?? null;
}

type Adresler = { name?: string; address?: string }[] | undefined;

function ekVarMi(yapi: unknown): boolean {
  const y = yapi as { disposition?: string; childNodes?: unknown[] } | undefined;
  if (!y) return false;
  if ((y.disposition ?? "").toLowerCase() === "attachment") return true;
  return (y.childNodes ?? []).some(ekVarMi);
}

const adresListesi = (a: AddressObject | AddressObject[] | undefined): Adresler =>
  a ? (Array.isArray(a) ? a.flatMap((x) => x.value) : a.value) : undefined;

const ILETI_YOK = "İleti bu klasörde yok — taşınmış ya da silinmiş olabilir.";

const baglantiHatasi = (e: unknown) => {
  const x = e as { message?: string; responseText?: string };
  return `Kutuya bağlanılamadı: ${x.responseText || x.message || String(e)}`.slice(0, 240);
};

async function kapat(istemci: ImapIstemci) {
  try {
    await istemci.logout();
  } catch {
    /* bağlantı zaten kopmuşsa önemli değil */
  }
}

/** Kilitli (açık) klasörden bir iletinin tamamı, düz metin. Yoksa null. */
async function iletiyiCoz(istemci: ImapIstemci, uid: number): Promise<OkunanIleti | null> {
  const m = await istemci.fetchOne(String(uid), { uid: true, source: { maxLength: ILETI_EN_COK_BAYT } }, { uid: true });
  if (!m || !m.source) return null;
  const p = await simpleParser(m.source);
  const govde = (p.text || (p.html ? htmldenMetin(p.html) : "")).replace(/\r\n?/g, "\n").trim();
  const kimden = adresListesi(p.from);
  const yanitla = adresListesi(p.replyTo);
  const referanslar = Array.isArray(p.references) ? p.references.join(" ") : (p.references ?? "");
  return {
    uid,
    konu: p.subject ?? "",
    kimden: adresGoster(kimden) || "—",
    kimdenAdres: (kimden?.[0]?.address ?? "").toLowerCase(),
    kime: adresGoster(adresListesi(p.to)) || "—",
    bilgi: adresGoster(adresListesi(p.cc)),
    tarih: p.date ? p.date.toISOString() : null,
    metin: govde || "(ileti boş görünüyor)",
    ekler: (p.attachments ?? [])
      .filter((a) => a.contentDisposition !== "inline")
      .map((a) => a.filename ?? "")
      .filter(Boolean)
      .slice(0, 20),
    kirpildi: m.source.length >= ILETI_EN_COK_BAYT,
    mesajKimligi: p.messageId ?? "",
    referanslar,
    yanitAdresi: (yanitla?.[0]?.address ?? kimden?.[0]?.address ?? "").toLowerCase(),
  };
}

/**
 * Bir kutunun bir klasörü: bir sayfa ileti (en yenisi başta) ve istenirse
 * seçili iletinin tamamı — TEK IMAP oturumunda. Her gezinmede kutuya bir
 * kez bağlanılıyor; paylaşımlı sunucunun eşzamanlı oturum sınırı zorlanmasın.
 */
export async function kutuGorunumu(
  kutuAdresi: string,
  klasor: Klasor,
  sayfa: number,
  seciliUid?: number
): Promise<KutuGorunumu> {
  const kutu = kutuBul(kutuAdresi);
  if (!kutu) return { tamam: false, hata: "Bu kutu gönderim ayarlarında tanımlı değil." };

  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const yol = klasor === "gelen" ? "INBOX" : await gonderilmisYolu(istemci);
    if (!yol) {
      return {
        tamam: true, klasorYolu: null, uidvalidity: 0, toplam: 0, sayfa: 1, sayfaSayisi: 1,
        iletiler: [], secili: null, seciliHata: null,
      };
    }
    const kilit = await istemci.getMailboxLock(yol, { readOnly: true });
    try {
      const kutuBilgisi = istemci.mailbox;
      const toplam = kutuBilgisi ? kutuBilgisi.exists : 0;
      const uidvalidity = kutuBilgisi ? Number(kutuBilgisi.uidValidity) : 0;
      const sayfaSayisi = Math.max(1, Math.ceil(toplam / POSTA_SAYFA_BOYU));
      const s = Math.min(Math.max(1, Math.trunc(sayfa) || 1), sayfaSayisi);

      /* Sıra numarası 1 en eski — en yeniden geriye doğru bir sayfa */
      const bitis = toplam - (s - 1) * POSTA_SAYFA_BOYU;
      const baslangic = Math.max(1, bitis - POSTA_SAYFA_BOYU + 1);
      const iletiler: IletiOzeti[] = [];
      if (bitis >= 1) {
        const ham = await istemci.fetchAll(`${baslangic}:${bitis}`, {
          uid: true,
          flags: true,
          envelope: true,
          internalDate: true,
          size: true,
          bodyStructure: true,
        });
        for (const m of ham.reverse()) {
          const e = m.envelope;
          const karsi = (klasor === "gelen" ? e?.from : e?.to) as Adresler;
          const tarih = e?.date ?? m.internalDate;
          iletiler.push({
            uid: m.uid,
            tarih: tarih ? new Date(tarih).toISOString() : null,
            kisi: kisaAd(karsi),
            kisiAdres: (karsi?.[0]?.address ?? "").toLowerCase(),
            konu: e?.subject ?? "",
            okundu: m.flags?.has("\\Seen") ?? false,
            yanitlandi: m.flags?.has("\\Answered") ?? false,
            ekVar: ekVarMi(m.bodyStructure),
            boyut: m.size ?? 0,
          });
        }
      }

      let secili: OkunanIleti | null = null;
      let seciliHata: string | null = null;
      if (seciliUid && Number.isSafeInteger(seciliUid) && seciliUid > 0) {
        secili = await iletiyiCoz(istemci, seciliUid);
        if (!secili) seciliHata = ILETI_YOK;
      }

      return { tamam: true, klasorYolu: yol, uidvalidity, toplam, sayfa: s, sayfaSayisi, iletiler, secili, seciliHata };
    } finally {
      kilit.release();
    }
  } catch (e) {
    return { tamam: false, hata: baglantiHatasi(e) };
  } finally {
    await kapat(istemci);
  }
}

/** Tek bir iletinin tamamı — listeyi çekmeden (Claude'un ucu, yanıtlanan iletinin kimliği). */
export async function iletiOku(
  kutuAdresi: string,
  klasor: Klasor,
  uid: number
): Promise<{ tamam: true; ileti: OkunanIleti } | { tamam: false; hata: string }> {
  const kutu = kutuBul(kutuAdresi);
  if (!kutu) return { tamam: false, hata: "Bu kutu gönderim ayarlarında tanımlı değil." };
  if (!Number.isSafeInteger(uid) || uid < 1) return { tamam: false, hata: "Geçersiz ileti numarası." };

  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const yol = klasor === "gelen" ? "INBOX" : await gonderilmisYolu(istemci);
    if (!yol) return { tamam: false, hata: "Bu kutuda Gönderilmiş klasörü yok." };
    const kilit = await istemci.getMailboxLock(yol, { readOnly: true });
    try {
      const ileti = await iletiyiCoz(istemci, uid);
      return ileti ? { tamam: true, ileti } : { tamam: false, hata: ILETI_YOK };
    } finally {
      kilit.release();
    }
  } catch (e) {
    return { tamam: false, hata: baglantiHatasi(e) };
  } finally {
    await kapat(istemci);
  }
}

/**
 * Yanıtlanan gelen iletiyi kutuda "yanıtlandı" (\Answered) işaretler — e-posta
 * istemcisinin kendiliğinden yaptığı iş; Thunderbird'de iletinin yanında ok
 * görünür. Okumanın aksine bu kutuyu DEĞİŞTİRİR, ama yalnızca bu bayrağı.
 * Olmazsa gönderim yine geçerli; sessizce geçilir.
 */
export async function yanitlandiIsaretle(kutuAdresi: string, uid: number): Promise<void> {
  const kutu = kutuBul(kutuAdresi);
  if (!kutu || !Number.isSafeInteger(uid) || uid < 1) return;
  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const kilit = await istemci.getMailboxLock("INBOX");
    try {
      await istemci.messageFlagsAdd(String(uid), ["\\Answered"], { uid: true });
    } finally {
      kilit.release();
    }
  } catch {
    /* işaret konamadıysa önemli değil */
  } finally {
    await kapat(istemci);
  }
}

/* ------------------------------------------------------------ gönderme */

export type GonderimGirdisi = {
  kutuAdresi: string;
  kime: string[];
  bilgi: string[];
  konu: string;
  metin: string;
  /** Yanıtsa: yanıtlanan iletinin Message-ID'si ve References zinciri (konuşma bağlansın) */
  yanitlanan?: { mesajKimligi: string; referanslar: string };
};

export type GonderimSonucu =
  | { tamam: true; mesajKimligi: string; kopyaHatasi: string | null }
  | { tamam: false; hata: string };

const SERT_SINIR_MS = 45_000;

/** Düz metnin HTML hâli — tek sütun, sade; istemci kendi yazı tipini kullanmasın diye stil satır içi. */
const htmlSarmala = (govde: string) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#18181b">${govde}</div>`;

/**
 * Elle yazılan e-posta ya da yanıt. Tanıtım e-postasından FARKLI: abonelikten
 * çık altbilgisi, ürün görselleri, List-Unsubscribe yok — bu bire bir yazışma.
 * Kopya Gönderilmiş klasörüne konur; konamazsa gönderim yine geçerli, sebebi döner.
 */
export async function epostaGonder(g: GonderimGirdisi): Promise<GonderimSonucu> {
  const kutu = kutuBul(g.kutuAdresi);
  if (!kutu) return { tamam: false, hata: "Bu kutu gönderim ayarlarında tanımlı değil." };
  if (!g.kime.length) return { tamam: false, hata: "Alıcı yok." };
  if (g.kime.length + g.bilgi.length > 20) return { tamam: false, hata: "Tek seferde en çok 20 alıcı." };
  const konu = (g.konu ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 300);
  const metin = (g.metin ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 50_000);
  if (!konu) return { tamam: false, hata: "Konu boş olamaz." };
  if (!metin) return { tamam: false, hata: "Metin boş olamaz." };

  const dugum = new MailComposer({
    from: { name: kutu.ad, address: kutu.user },
    to: g.kime,
    ...(g.bilgi.length ? { cc: g.bilgi } : {}),
    subject: konu,
    text: metin,
    html: htmlSarmala(metindenHtml(metin)),
    ...(g.yanitlanan?.mesajKimligi
      ? {
          inReplyTo: g.yanitlanan.mesajKimligi,
          references: referansZinciri(g.yanitlanan.referanslar, g.yanitlanan.mesajKimligi),
        }
      : {}),
  }).compile();
  const ham = await dugum.build();
  const mesajKimligi = dugum.messageId();

  const tasiyici = nodemailer.createTransport({
    host: kutu.host,
    port: kutu.port,
    secure: kutu.port === 465,
    auth: { user: kutu.user, pass: kutu.pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 60_000,
  });
  let saat: ReturnType<typeof setTimeout> | undefined;
  try {
    const r = await Promise.race([
      tasiyici.sendMail({ envelope: dugum.getEnvelope(), raw: ham }),
      new Promise<"zaman">((coz) => {
        saat = setTimeout(() => coz("zaman"), SERT_SINIR_MS);
      }),
    ]);
    if (r === "zaman") {
      return { tamam: false, hata: `Sunucu ${SERT_SINIR_MS / 1000} sn içinde cevap vermedi — e-posta gitmiş olabilir, Gönderilmiş'e bakın.` };
    }
    if (!r.accepted?.length) return { tamam: false, hata: `Alıcı kabul edilmedi: ${String(r.response ?? "")}`.slice(0, 240) };
  } catch (e) {
    const x = e as { response?: string; message?: string };
    return { tamam: false, hata: `Gönderilemedi: ${x.response || x.message || String(e)}`.slice(0, 240) };
  } finally {
    clearTimeout(saat);
    tasiyici.close();
  }

  const kopyaHatasi = await gonderilmislereEkle(kutu, ham);
  return { tamam: true, mesajKimligi, kopyaHatasi };
}

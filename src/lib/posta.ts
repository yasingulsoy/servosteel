import "server-only";
import { Readable } from "node:stream";
import { simpleParser, type AddressObject } from "mailparser";
import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { gonderilmislereEkle, imapIstemcisi } from "@/lib/outreach";
import { ayarlariOku, type GonderenKutusu } from "@/lib/outreach-kurallar";
import { htmldenMetin } from "@/lib/eposta-html";
import { metindenHtml } from "@/lib/eposta-bicim";
import {
  KLASOR_TURU_ADI,
  adresGoster,
  ekleriBul,
  gorselIzleriniTemizle,
  kisaAd,
  klasorleriDuzenle,
  referansZinciri,
  type Ek,
  type HamKlasor,
  type KlasorBilgisi,
  type KlasorTuru,
  type YapiDugumu,
} from "@/lib/posta-bicim";

/**
 * Panelin e-posta istemcisi — gönderen kutularının GERÇEK klasörleri.
 *
 * Önceki "gelen kutusu" yalnızca taramanın işleyip veritabanına yazdığı
 * iletileri gösteriyordu; kutunun kendisi görünmüyordu. Burası kutuyu IMAP'ten
 * olduğu gibi okur: Gelen (INBOX) ve Gönderilmiş, en yenisi başta, sayfa sayfa.
 * Gönderme aynı kutunun SMTP'siyle yapılır ve kopyası Gönderilmiş'e konur —
 * Thunderbird ne görüyorsa panel de onu görür.
 *
 * Outlook gibi (Yasin, 28 Eylül 2026: "outlook gibi mail aracı olmalı"): kutudaki
 * bütün klasörler, panelde AÇILAN ileti okundu sayılır, okunmadı/bayrak/taşı/
 * sil/arşivle/önemsiz, taslak. Sil = Silinmiş klasörüne taşı; kalıcı silme yok.
 * Listeyi göstermek, Claude'un ucunun okuması ve ek indirmek kutuya DOKUNMAZ
 * (salt okunur, BODY.PEEK).
 *
 * Gövde DÜZ METİN: gelen posta güvenilmeyen içerik; HTML'ini işlemek gereksiz
 * risk. Yalnızca HTML parçası olan ileti metne çevrilir.
 *
 * Bu modülü hem panel (sunucu bileşeni + eylem) hem de Claude'un kullandığı
 * uç (`api/posta`) çağırıyor — ikisi aynı kodla çalışır.
 */

/**
 * Klasörün adres çubuğundaki adı: özel klasörde türü ("gelen", "giden",
 * "taslak", "arsiv", "onemsiz", "cop"), ötekinde sunucudaki yolu (bkz.
 * posta-bicim klasorleriDuzenle).
 */
export type Klasor = string;
export type { KlasorBilgisi, KlasorTuru };

/** Sayfa başına ileti sayısı. */
export const POSTA_SAYFA_BOYU = 40;

/** 512 KB: uzun alıntı zincirli yanıtlar sığar, ekli devasa ileti indirilmez. */
const ILETI_EN_COK_BAYT = 512 * 1024;

export type PostaKutusu = {
  user: string;
  ad: string;
  /** Tanıtım e-postası bu kutudan gidiyor mu — form kutusunda (website@) hayır */
  tanitim: boolean;
};

/**
 * Sitenin form bildirim kutusu (`SMTP_USER`, website@). Tanıtım e-postası bu
 * kutudan GİTMEZ (bkz. outreach-kurallar: form kutusu gönderici olamaz); panelde
 * okunur ve elle yazılır — talep iletmek için (Yasin, 28 Eylül 2026: "talep
 * geldi, iletmem lazım"). Şifresi sunucuda zaten tanımlı; yeni ayar gerekmez.
 */
function formKutusu(env: Record<string, string | undefined>): GonderenKutusu | null {
  const user = (env.SMTP_USER ?? "").trim().toLowerCase();
  const pass = env.SMTP_PASS ?? "";
  const host = (env.SMTP_HOST ?? "").trim();
  if (!user.includes("@") || !pass || !host) return null;
  const port = Number(env.SMTP_PORT ?? 465) || 465;
  return { no: 0, host, port, user, pass, ad: "Servosteel", alan: user.split("@")[1] };
}

/** Panelde görünen kutular: tanıtım gönderen kutular + form kutusu (en sonda). */
function panelKutulari(): GonderenKutusu[] {
  const kutular = ayarlariOku(process.env).kutular;
  const form = formKutusu(process.env);
  return form && !kutular.some((k) => k.user === form.user) ? [...kutular, form] : kutular;
}

export function postaKutulari(): PostaKutusu[] {
  const tanitim = new Set(ayarlariOku(process.env).kutular.map((k) => k.user));
  return panelKutulari().map((k) => ({ user: k.user, ad: k.ad, tanitim: tanitim.has(k.user) }));
}

/** Form kutusunun adresi (website@) — tanımlı değilse boş */
export function formKutusuAdresi(): string {
  return formKutusu(process.env)?.user ?? "";
}

function kutuBul(adres: string): GonderenKutusu | null {
  const a = (adres ?? "").trim().toLowerCase();
  return panelKutulari().find((k) => k.user === a) ?? null;
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
  bayrakli: boolean;
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
  /** Gizli alıcılar — yalnızca taslakta ve Gönderilmiş kopyasında bulunur */
  gizli: string;
  okundu: boolean;
  bayrakli: boolean;
  tarih: string | null;
  metin: string;
  /** BODYSTRUCTURE'dan — ileti kırpılsa da eksiksiz */
  ekler: Ek[];
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
      /** Kutunun bütün klasörleri, okunmamış sayılarıyla — kenar çubuğu */
      klasorler: KlasorBilgisi[];
      /** Açık klasör; kutuda yoksa null */
      klasor: KlasorBilgisi | null;
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

/** Kutunun klasörleri panelin sırasıyla; `sayilarla` okunmamış ve toplam sayıları da (STATUS). */
async function klasorleriOku(istemci: ImapIstemci, sayilarla = false): Promise<KlasorBilgisi[]> {
  const liste = await istemci.list(sayilarla ? { statusQuery: { messages: true, unseen: true } } : undefined);
  return klasorleriDuzenle(liste as unknown as HamKlasor[]);
}

const klasorBul = (klasorler: KlasorBilgisi[], anahtar: Klasor) => klasorler.find((k) => k.anahtar === anahtar) ?? null;

/** Anahtarın sunucudaki yolu — yoksa null. Okurken klasör OLUŞTURMAZ. */
async function klasorYolu(istemci: ImapIstemci, anahtar: Klasor): Promise<string | null> {
  if (anahtar === "gelen") return "INBOX";
  return klasorBul(await klasorleriOku(istemci), anahtar)?.yol ?? null;
}

/**
 * Özel klasör kutuda yoksa (Arşiv, Önemsiz, Silinmiş, Taslaklar) açar — yerini
 * kutunun düzeninden alır: öteki klasörler "INBOX." altındaysa oraya.
 */
async function ozelKlasorAc(istemci: ImapIstemci, klasorler: KlasorBilgisi[], tur: KlasorTuru): Promise<string> {
  const var_ = klasorler.find((k) => k.tur === tur);
  if (var_) return var_.yol;
  const ad = { arsiv: "Archive", onemsiz: "Junk", cop: "Trash", taslak: "Drafts", giden: "Sent", gelen: "INBOX" }[tur];
  const liste = await istemci.list();
  const ornek = liste.find((k) => k.path.toUpperCase() !== "INBOX" && k.delimiter);
  const onek = ornek && ornek.path.toUpperCase().startsWith(`INBOX${ornek.delimiter}`) ? `INBOX${ornek.delimiter}` : "";
  const yol = `${onek}${ad}`;
  await istemci.mailboxCreate(yol);
  return yol;
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
  const m = await istemci.fetchOne(
    String(uid),
    { uid: true, flags: true, bodyStructure: true, source: { maxLength: ILETI_EN_COK_BAYT } },
    { uid: true }
  );
  if (!m || !m.source) return null;
  const p = await simpleParser(m.source);
  const govde = gorselIzleriniTemizle((p.text || (p.html ? htmldenMetin(p.html) : "")).replace(/\r\n?/g, "\n"));
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
    gizli: adresGoster(adresListesi(p.bcc)),
    okundu: m.flags?.has("\\Seen") ?? false,
    bayrakli: m.flags?.has("\\Flagged") ?? false,
    tarih: p.date ? p.date.toISOString() : null,
    metin: govde || "(ileti boş görünüyor)",
    /* Ekler kaynağın ilk 512 KB'ından değil yapıdan: büyük iletide eki
       taşıyan kısım indirilmiyordu ve ek hiç görünmüyordu (iRack, 26 Eylül). */
    ekler: m.bodyStructure ? ekleriBul(m.bodyStructure as YapiDugumu).slice(0, 40) : [],
    kirpildi: m.source.length >= ILETI_EN_COK_BAYT,
    mesajKimligi: p.messageId ?? "",
    referanslar,
    yanitAdresi: (yanitla?.[0]?.address ?? kimden?.[0]?.address ?? "").toLowerCase(),
  };
}

/** Listede her ileti için istenen alanlar — gövde yok, yalnızca zarf. */
const OZET_SORGUSU = { uid: true, flags: true, envelope: true, internalDate: true, size: true, bodyStructure: true };

type HamIleti = Awaited<ReturnType<ImapIstemci["fetchAll"]>>[number];

/** Listede karşı taraf: Gönderilmiş ve Taslaklar'da alıcı, ötekilerde gönderen. */
const alicidanMi = (k: KlasorBilgisi | null | undefined, anahtar: Klasor) =>
  k ? k.tur === "giden" || k.tur === "taslak" : anahtar === "giden" || anahtar === "taslak";

function ozetle(m: HamIleti, alicidan: boolean): IletiOzeti {
  const e = m.envelope;
  const karsi = (alicidan ? e?.to : e?.from) as Adresler;
  const tarih = e?.date ?? m.internalDate;
  return {
    uid: m.uid,
    tarih: tarih ? new Date(tarih).toISOString() : null,
    kisi: kisaAd(karsi),
    kisiAdres: (karsi?.[0]?.address ?? "").toLowerCase(),
    konu: e?.subject ?? "",
    okundu: m.flags?.has("\\Seen") ?? false,
    yanitlandi: m.flags?.has("\\Answered") ?? false,
    bayrakli: m.flags?.has("\\Flagged") ?? false,
    ekVar: ekVarMi(m.bodyStructure),
    boyut: m.size ?? 0,
  };
}

/** Arama kutusuna yazılan: boşluklar sadeleşir, en çok 100 karakter. */
export function aramaTemizle(v: unknown): string {
  return (typeof v === "string" ? v : "").replace(/\s+/g, " ").trim().slice(0, 100);
}

/**
 * Kimden, kime, bilgi, konu ya da metinde geçen — IMAP SEARCH, aramayı
 * sunucu yapar. Büyük/küçük harf duyarsız; Türkçe karakterli arama UTF-8
 * gider (CHARSET'i imapflow kendisi ekliyor).
 */
const aramaOlcutu = (ara: string) => ({
  or: [{ from: ara }, { to: ara }, { cc: ara }, { subject: ara }, { body: ara }],
});

/** Tüm kutularda aramada gösterilen en çok sonuç. */
export const ARAMA_EN_COK = 60;

/**
 * Bir kutunun bir klasörü: bir sayfa ileti (en yenisi başta) ve istenirse
 * seçili iletinin tamamı — TEK IMAP oturumunda. Her gezinmede kutuya bir
 * kez bağlanılıyor; paylaşımlı sunucunun eşzamanlı oturum sınırı zorlanmasın.
 *
 * `arama` verilirse liste yalnızca eşleşen iletiler: sunucu UID'leri bulur,
 * en büyük UID (en son gelen) başta, zarflar sayfa sayfa çekilir.
 */
export async function kutuGorunumu(
  kutuAdresi: string,
  klasor: Klasor,
  sayfa: number,
  seciliUid?: number,
  arama = "",
  /** Panelde açılan ileti okundu sayılsın (Outlook gibi) — Claude'un ucu vermez */
  secenek: { okunduYap?: boolean } = {}
): Promise<KutuGorunumu> {
  const kutu = kutuBul(kutuAdresi);
  if (!kutu) return { tamam: false, hata: "Bu kutu gönderim ayarlarında tanımlı değil." };

  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const klasorler = await klasorleriOku(istemci, true);
    const acik = klasorBul(klasorler, klasor);
    const yol = acik?.yol ?? null;
    if (!yol) {
      return {
        tamam: true, klasorler, klasor: null, klasorYolu: null, uidvalidity: 0, toplam: 0, sayfa: 1, sayfaSayisi: 1,
        iletiler: [], secili: null, seciliHata: null,
      };
    }
    const alicidan = alicidanMi(acik, klasor);
    const secimVar = Boolean(seciliUid && Number.isSafeInteger(seciliUid) && seciliUid > 0);
    const kilit = await istemci.getMailboxLock(yol, { readOnly: !(secenek.okunduYap && secimVar) });
    try {
      const kutuBilgisi = istemci.mailbox;
      const uidvalidity = kutuBilgisi ? Number(kutuBilgisi.uidValidity) : 0;
      const sayfaYap = (toplam: number) => {
        const sayfaSayisi = Math.max(1, Math.ceil(toplam / POSTA_SAYFA_BOYU));
        return { sayfaSayisi, s: Math.min(Math.max(1, Math.trunc(sayfa) || 1), sayfaSayisi) };
      };

      let toplam: number;
      let iletiler: IletiOzeti[] = [];
      let sayfaSayisi: number;
      let s: number;
      if (arama) {
        const uidler = ((await istemci.search(aramaOlcutu(arama), { uid: true })) || []).sort((a, b) => b - a);
        toplam = uidler.length;
        ({ sayfaSayisi, s } = sayfaYap(toplam));
        const dilim = uidler.slice((s - 1) * POSTA_SAYFA_BOYU, s * POSTA_SAYFA_BOYU);
        if (dilim.length) {
          const ham = await istemci.fetchAll(dilim.join(","), OZET_SORGUSU, { uid: true });
          iletiler = ham.map((m) => ozetle(m, alicidan)).sort((a, b) => b.uid - a.uid);
        }
      } else {
        toplam = kutuBilgisi ? kutuBilgisi.exists : 0;
        ({ sayfaSayisi, s } = sayfaYap(toplam));
        /* Sıra numarası 1 en eski — en yeniden geriye doğru bir sayfa */
        const bitis = toplam - (s - 1) * POSTA_SAYFA_BOYU;
        const baslangic = Math.max(1, bitis - POSTA_SAYFA_BOYU + 1);
        if (bitis >= 1) {
          const ham = await istemci.fetchAll(`${baslangic}:${bitis}`, OZET_SORGUSU);
          iletiler = ham.reverse().map((m) => ozetle(m, alicidan));
        }
      }

      let secili: OkunanIleti | null = null;
      let seciliHata: string | null = null;
      if (secimVar) {
        secili = await iletiyiCoz(istemci, seciliUid as number);
        if (!secili) seciliHata = ILETI_YOK;
        /* Outlook gibi: açılan ileti okundu. Liste ve klasör sayısı da aynı
           cevapta güncellenir — ekran kutuyla tutarlı kalsın. */
        if (secili && secenek.okunduYap && !secili.okundu) {
          const tamam = await istemci
            .messageFlagsAdd(String(secili.uid), ["\\Seen"], { uid: true })
            .catch(() => false);
          if (tamam) {
            secili = { ...secili, okundu: true };
            iletiler = iletiler.map((m) => (m.uid === secili?.uid ? { ...m, okundu: true } : m));
            if (acik) acik.okunmamis = Math.max(0, acik.okunmamis - 1);
          }
        }
      }

      return {
        tamam: true, klasorler, klasor: acik, klasorYolu: yol, uidvalidity, toplam, sayfa: s, sayfaSayisi,
        iletiler, secili, seciliHata,
      };
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
 * Tek bir iletinin tamamı — listeyi çekmeden (tüm kutularda aramada okunan
 * ileti, Claude'un ucu, yanıtlanan iletinin kimliği). Klasörün UIDVALIDITY'si
 * de döner: taramanın sınıfı (yanıt, geri dönüş…) onunla eşleşiyor.
 */
export async function iletiOku(
  kutuAdresi: string,
  klasor: Klasor,
  uid: number
): Promise<{ tamam: true; ileti: OkunanIleti; uidvalidity: number } | { tamam: false; hata: string }> {
  const kutu = kutuBul(kutuAdresi);
  if (!kutu) return { tamam: false, hata: "Bu kutu gönderim ayarlarında tanımlı değil." };
  if (!Number.isSafeInteger(uid) || uid < 1) return { tamam: false, hata: "Geçersiz ileti numarası." };

  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const yol = await klasorYolu(istemci, klasor);
    if (!yol) return { tamam: false, hata: "Bu klasör kutuda yok." };
    const kilit = await istemci.getMailboxLock(yol, { readOnly: true });
    try {
      const uidvalidity = istemci.mailbox ? Number(istemci.mailbox.uidValidity) : 0;
      const ileti = await iletiyiCoz(istemci, uid);
      return ileti ? { tamam: true, ileti, uidvalidity } : { tamam: false, hata: ILETI_YOK };
    } finally {
      kilit.release();
    }
  } catch (e) {
    return { tamam: false, hata: baglantiHatasi(e) };
  } finally {
    await kapat(istemci);
  }
}

/* ------------------------------------------------------------- ekler */

/** Tek bir ekin indirilebileceği en büyük boyut (okuyucudaki Aç / İndir). */
export const EK_EN_COK_BAYT = 30 * 1024 * 1024;

type Kilit = Awaited<ReturnType<ImapIstemci["getMailboxLock"]>>;

/** Klasörü açar, iletinin ekler listesini yapıdan çıkarır — iki ek işlevinin ortak girişi. */
async function ekliIletiyiAc(
  istemci: ImapIstemci,
  klasor: Klasor,
  uid: number
): Promise<{ kilit: Kilit; ekler: Ek[] } | { hata: string; durum: number }> {
  await istemci.connect();
  const yol = await klasorYolu(istemci, klasor);
  if (!yol) return { hata: "Bu klasör kutuda yok.", durum: 404 };
  const kilit = await istemci.getMailboxLock(yol, { readOnly: true });
  const m = await istemci.fetchOne(String(uid), { uid: true, bodyStructure: true }, { uid: true });
  if (!m || !m.bodyStructure) {
    kilit.release();
    return { hata: ILETI_YOK, durum: 404 };
  }
  return { kilit, ekler: ekleriBul(m.bodyStructure as YapiDugumu) };
}

export type EkAkisi =
  | { tamam: true; ek: Ek; akis: ReadableStream<Uint8Array> }
  | { tamam: false; durum: number; hata: string };

/**
 * Bir eki kutudan AKITARAK verir — bellekte biriktirmeden, iletinin geri
 * kalanını indirmeden. Bağlantı ve klasör kilidi akış bitene (ya da tarayıcı
 * vazgeçene) kadar açık kalır. İstenen parça iletinin eklerinden biri
 * olmalı; gövde ya da rapor parçası bu yoldan verilmez.
 */
export async function ekAkisi(kutuAdresi: string, klasor: Klasor, uid: number, parca: string): Promise<EkAkisi> {
  const kutu = kutuBul(kutuAdresi);
  if (!kutu) return { tamam: false, durum: 404, hata: "Bu kutu gönderim ayarlarında tanımlı değil." };
  if (!Number.isSafeInteger(uid) || uid < 1 || !/^\d{1,3}(\.\d{1,3}){0,9}$/.test(parca)) {
    return { tamam: false, durum: 400, hata: "Geçersiz istek." };
  }
  const istemci = imapIstemcisi(kutu);
  let kilit: Kilit | null = null;
  let devredildi = false;
  try {
    const a = await ekliIletiyiAc(istemci, klasor, uid);
    if ("hata" in a) return { tamam: false, durum: a.durum, hata: a.hata };
    kilit = a.kilit;
    const ek = a.ekler.find((e) => e.parca === parca);
    if (!ek) return { tamam: false, durum: 404, hata: "Ek bulunamadı — ileti taşınmış ya da silinmiş olabilir." };

    const d = await istemci.download(String(uid), parca, { uid: true, maxBytes: EK_EN_COK_BAYT });
    const acikKilit = kilit;
    let bitti = false;
    const bitir = () => {
      if (bitti) return;
      bitti = true;
      acikKilit.release();
      void kapat(istemci);
    };
    d.content.once("end", bitir);
    d.content.once("close", bitir);
    d.content.once("error", bitir);
    devredildi = true;
    return { tamam: true, ek, akis: Readable.toWeb(d.content) as unknown as ReadableStream<Uint8Array> };
  } catch (e) {
    return { tamam: false, durum: 502, hata: baglantiHatasi(e) };
  } finally {
    if (!devredildi) {
      kilit?.release();
      await kapat(istemci);
    }
  }
}

/** Giden e-postaya konacak ek — yüklenen dosya ya da iletilen iletinin eki. */
export type GidenEk = { ad: string; tur: string; icerik: Buffer };

/**
 * İletirken: seçilen ekler bellekte, iletinin yapısındaki adlarıyla. Toplam
 * `enCok` baytı aşarsa hiçbiri alınmaz ve sebebi döner.
 */
export async function ekleriIndir(
  kutuAdresi: string,
  klasor: Klasor,
  uid: number,
  parcalar: string[],
  enCok: number
): Promise<{ tamam: true; ekler: GidenEk[] } | { tamam: false; hata: string }> {
  const kutu = kutuBul(kutuAdresi);
  if (!kutu) return { tamam: false, hata: "İletilen iletinin kutusu tanımlı değil." };
  if (!parcalar.length) return { tamam: true, ekler: [] };
  const istemci = imapIstemcisi(kutu);
  let kilit: Kilit | null = null;
  try {
    const a = await ekliIletiyiAc(istemci, klasor, uid);
    if ("hata" in a) return { tamam: false, hata: `İletilen ileti açılamadı: ${a.hata}` };
    kilit = a.kilit;
    const secilen = parcalar.map((p) => a.ekler.find((e) => e.parca === p));
    if (secilen.some((e) => !e)) return { tamam: false, hata: "İletilen iletinin eki bulunamadı — ileti değişmiş olabilir." };

    const ekler: GidenEk[] = [];
    let toplam = 0;
    for (const ek of secilen as Ek[]) {
      const d = await istemci.download(String(uid), ek.parca, { uid: true, maxBytes: enCok + 1 });
      const parcaParca: Buffer[] = [];
      for await (const c of d.content) {
        toplam += (c as Buffer).length;
        if (toplam > enCok) {
          d.content.destroy();
          return { tamam: false, hata: `Ekler çok büyük — iletilebilecek toplam en çok ${Math.round(enCok / 1048576)} MB.` };
        }
        parcaParca.push(c as Buffer);
      }
      ekler.push({ ad: ek.ad, tur: ek.tur, icerik: Buffer.concat(parcaParca) });
    }
    return { tamam: true, ekler };
  } catch (e) {
    return { tamam: false, hata: baglantiHatasi(e) };
  } finally {
    kilit?.release();
    await kapat(istemci);
  }
}

export type AramaSatiri = IletiOzeti & { kutu: string; klasor: Klasor; uidvalidity: number };

/**
 * Bütün kutularda, Gelen'de ve Gönderilmiş'te arama — "bu firmayla ne
 * yazıştık?" sorusu için; tanıtım e-postası bir kutudan gidiyor, yanıtı başka
 * bir iletiye verilmiş olabiliyor. Kutu başına tek oturum, kutular aynı anda.
 * Klasör başına en yeni `enCok` eşleşme alınır, hepsi tarihe göre dizilip ilk
 * `enCok` döner; `toplam` bütün eşleşmelerin sayısı.
 */
export async function herYerdeAra(
  arama: string,
  enCok = ARAMA_EN_COK
): Promise<{ satirlar: AramaSatiri[]; toplam: number; hatalar: string[] }> {
  const kutular = panelKutulari();
  const sonuc = await Promise.all(
    kutular.map(async (kutu) => {
      const satirlar: AramaSatiri[] = [];
      let toplam = 0;
      const istemci = imapIstemcisi(kutu);
      try {
        await istemci.connect();
        const klasorler = await klasorleriOku(istemci);
        for (const klasor of ["gelen", "giden"] as const) {
          const yol = klasorBul(klasorler, klasor)?.yol;
          if (!yol) continue;
          const kilit = await istemci.getMailboxLock(yol, { readOnly: true });
          try {
            const uidvalidity = istemci.mailbox ? Number(istemci.mailbox.uidValidity) : 0;
            const uidler = ((await istemci.search(aramaOlcutu(arama), { uid: true })) || []).sort((a, b) => b - a);
            toplam += uidler.length;
            const dilim = uidler.slice(0, enCok);
            if (dilim.length) {
              const ham = await istemci.fetchAll(dilim.join(","), OZET_SORGUSU, { uid: true });
              for (const m of ham) satirlar.push({ ...ozetle(m, klasor === "giden"), kutu: kutu.user, klasor, uidvalidity });
            }
          } finally {
            kilit.release();
          }
        }
        return { satirlar, toplam, hata: null };
      } catch (e) {
        return { satirlar, toplam, hata: `${kutu.user}: ${baglantiHatasi(e)}` };
      } finally {
        await kapat(istemci);
      }
    })
  );
  return {
    satirlar: sonuc
      .flatMap((x) => x.satirlar)
      .sort((a, b) => (b.tarih ?? "").localeCompare(a.tarih ?? ""))
      .slice(0, enCok),
    toplam: sonuc.reduce((t, x) => t + x.toplam, 0),
    hatalar: sonuc.flatMap((x) => (x.hata ? [x.hata] : [])),
  };
}

/**
 * Yanıtlanan gelen iletiyi kutuda "yanıtlandı" (\Answered) işaretler — e-posta
 * istemcisinin kendiliğinden yaptığı iş; Thunderbird'de iletinin yanında ok
 * görünür. Okumanın aksine bu kutuyu DEĞİŞTİRİR, ama yalnızca bu bayrağı.
 * Olmazsa gönderim yine geçerli; sessizce geçilir.
 */
export async function yanitlandiIsaretle(kutuAdresi: string, uid: number, klasor: Klasor = "gelen"): Promise<void> {
  const kutu = kutuBul(kutuAdresi);
  if (!kutu || !Number.isSafeInteger(uid) || uid < 1) return;
  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const yol = await klasorYolu(istemci, klasor);
    if (!yol) return;
    const kilit = await istemci.getMailboxLock(yol);
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

/* ------------------------------------------------------- ileti işlemleri */

export const ILETI_ISLEMLERI = [
  "okundu",
  "okunmadi",
  "bayrak",
  "bayrak-kaldir",
  "arsivle",
  "onemsiz",
  "onemsiz-degil",
  "sil",
  "geri-al",
  "tasi",
] as const;
export type IletiIslemi = (typeof ILETI_ISLEMLERI)[number];

/** Taşıyan işlemlerin hedefi — "tasi"da hedef kullanıcıdan gelir. */
const HEDEF_TURU: Partial<Record<IletiIslemi, KlasorTuru>> = {
  arsivle: "arsiv",
  onemsiz: "onemsiz",
  "onemsiz-degil": "gelen",
  sil: "cop",
  "geri-al": "gelen",
};

/**
 * Outlook'taki araç çubuğu: işaretle, bayrakla, taşı. SİL, Silinmiş klasörüne
 * taşır — kalıcı silme panelde yok; Silinmiş'teki ileti "geri al"la Gelen'e
 * döner. Hedef özel klasör (Arşiv, Önemsiz, Silinmiş) kutuda yoksa açılır.
 */
export async function iletiIslemi(
  kutuAdresi: string,
  klasor: Klasor,
  uidler: number[],
  islem: IletiIslemi,
  hedef?: Klasor
): Promise<{ tamam: true; mesaj: string; tasindi: boolean } | { tamam: false; hata: string }> {
  const kutu = kutuBul(kutuAdresi);
  if (!kutu) return { tamam: false, hata: "Bu kutu tanımlı değil." };
  const liste = [...new Set(uidler)].filter((u) => Number.isSafeInteger(u) && u > 0).slice(0, 200);
  if (!liste.length) return { tamam: false, hata: "İleti seçilmedi." };
  if (!(ILETI_ISLEMLERI as readonly string[]).includes(islem)) return { tamam: false, hata: "Bilinmeyen işlem." };

  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const klasorler = await klasorleriOku(istemci);
    const kaynak = klasorBul(klasorler, klasor);
    if (!kaynak) return { tamam: false, hata: "Klasör kutuda yok." };
    const aralik = liste.join(",");
    const adet = liste.length > 1 ? `${liste.length} ileti` : "İleti";

    const bayrak = { okundu: "\\Seen", okunmadi: "\\Seen", bayrak: "\\Flagged", "bayrak-kaldir": "\\Flagged" } as const;
    if (islem in bayrak) {
      const kilit = await istemci.getMailboxLock(kaynak.yol);
      try {
        const b = bayrak[islem as keyof typeof bayrak];
        if (islem === "okundu" || islem === "bayrak") await istemci.messageFlagsAdd(aralik, [b], { uid: true });
        else await istemci.messageFlagsRemove(aralik, [b], { uid: true });
      } finally {
        kilit.release();
      }
      const yazi = { okundu: "okundu", okunmadi: "okunmadı", bayrak: "bayraklandı", "bayrak-kaldir": "bayrağı kaldırıldı" }[
        islem as keyof typeof bayrak
      ];
      return { tamam: true, mesaj: `${adet} ${yazi}.`, tasindi: false };
    }

    if (islem === "sil" && kaynak.tur === "cop") {
      return { tamam: false, hata: "İleti zaten Silinmiş'te. Kalıcı silme panelden yapılmıyor." };
    }
    let hedefYol: string;
    let hedefAd: string;
    const tur = HEDEF_TURU[islem];
    if (tur) {
      hedefYol = await ozelKlasorAc(istemci, klasorler, tur);
      hedefAd = KLASOR_TURU_ADI[tur];
    } else {
      const h = hedef ? klasorBul(klasorler, hedef) : null;
      if (!h) return { tamam: false, hata: "Hedef klasör yok." };
      hedefYol = h.yol;
      hedefAd = h.ad;
    }
    if (hedefYol === kaynak.yol) return { tamam: false, hata: `İleti zaten ${hedefAd} klasöründe.` };

    const kilit = await istemci.getMailboxLock(kaynak.yol);
    try {
      const r = await istemci.messageMove(aralik, hedefYol, { uid: true });
      if (!r) return { tamam: false, hata: "Sunucu taşımayı kabul etmedi." };
    } finally {
      kilit.release();
    }
    return { tamam: true, mesaj: `${adet} ${hedefAd} klasörüne taşındı.`, tasindi: true };
  } catch (e) {
    return { tamam: false, hata: baglantiHatasi(e) };
  } finally {
    await kapat(istemci);
  }
}

/* ------------------------------------------------------------- taslaklar */

export type TaslakGirdisi = {
  kutuAdresi: string;
  kime: string[];
  bilgi: string[];
  gizli: string[];
  konu: string;
  metin: string;
  ekler?: GidenEk[];
  /** Aynı taslak daha önce kaydedildiyse eski kopyası silinir */
  eskiUid?: number;
};

/**
 * Taslağı kutunun Taslaklar klasörüne koyar (\Draft) — Thunderbird de görür.
 * Yeniden kaydedince eski kopya silinir; Outlook da taslağı yerinde günceller.
 * Taslak kutunun kendi taslağı: silmesi kalıcı ama yalnızca eski sürümü.
 */
export async function taslakKaydet(g: TaslakGirdisi): Promise<{ tamam: true; uid: number | null } | { tamam: false; hata: string }> {
  const kutu = kutuBul(g.kutuAdresi);
  if (!kutu) return { tamam: false, hata: "Bu kutu tanımlı değil." };
  const dugum = new MailComposer({
    from: { name: kutu.ad, address: kutu.user },
    ...(g.kime.length ? { to: g.kime } : {}),
    ...(g.bilgi.length ? { cc: g.bilgi } : {}),
    ...(g.gizli.length ? { bcc: g.gizli } : {}),
    subject: (g.konu ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 300),
    text: (g.metin ?? "").replace(/\r\n?/g, "\n").slice(0, 50_000),
    ...(g.ekler?.length
      ? { attachments: g.ekler.map((e) => ({ filename: e.ad, content: e.icerik, contentType: e.tur })) }
      : {}),
  }).compile();
  dugum.keepBcc = true;
  const ham = await dugum.build();

  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const yol = await ozelKlasorAc(istemci, await klasorleriOku(istemci), "taslak");
    const r = await istemci.append(yol, ham, ["\\Draft", "\\Seen"]);
    if (!r) return { tamam: false, hata: "Taslak kaydedilemedi." };
    if (g.eskiUid && Number.isSafeInteger(g.eskiUid) && g.eskiUid > 0) {
      const kilit = await istemci.getMailboxLock(yol);
      try {
        await istemci.messageDelete(String(g.eskiUid), { uid: true });
      } finally {
        kilit.release();
      }
    }
    return { tamam: true, uid: typeof r.uid === "number" ? r.uid : null };
  } catch (e) {
    return { tamam: false, hata: baglantiHatasi(e) };
  } finally {
    await kapat(istemci);
  }
}

/** Gönderilen taslağın kaydı Taslaklar'dan kalkar (Outlook gibi). Olmazsa sessizce geçilir. */
export async function taslakSil(kutuAdresi: string, uid: number): Promise<void> {
  const kutu = kutuBul(kutuAdresi);
  if (!kutu || !Number.isSafeInteger(uid) || uid < 1) return;
  const istemci = imapIstemcisi(kutu);
  try {
    await istemci.connect();
    const yol = await klasorYolu(istemci, "taslak");
    if (!yol) return;
    const kilit = await istemci.getMailboxLock(yol);
    try {
      await istemci.messageDelete(String(uid), { uid: true });
    } finally {
      kilit.release();
    }
  } catch {
    /* taslak kalırsa elle silinir */
  } finally {
    await kapat(istemci);
  }
}

/* ------------------------------------------------------------ gönderme */

export type GonderimGirdisi = {
  kutuAdresi: string;
  kime: string[];
  bilgi: string[];
  /** Gizli alıcılar (Bcc) — alıcılar görmez, Gönderilmiş kopyasında durur */
  gizli?: string[];
  konu: string;
  metin: string;
  /** Yanıtsa: yanıtlanan iletinin Message-ID'si ve References zinciri (konuşma bağlansın) */
  yanitlanan?: { mesajKimligi: string; referanslar: string };
  /** Yüklenen dosyalar ve iletilen iletinin seçilen ekleri */
  ekler?: GidenEk[];
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
  const gizli = g.gizli ?? [];
  if (g.kime.length + g.bilgi.length + gizli.length > 20) return { tamam: false, hata: "Tek seferde en çok 20 alıcı." };
  const konu = (g.konu ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 300);
  const metin = (g.metin ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 50_000);
  if (!konu) return { tamam: false, hata: "Konu boş olamaz." };
  if (!metin) return { tamam: false, hata: "Metin boş olamaz." };

  const dugum = new MailComposer({
    from: { name: kutu.ad, address: kutu.user },
    to: g.kime,
    ...(g.bilgi.length ? { cc: g.bilgi } : {}),
    ...(gizli.length ? { bcc: gizli } : {}),
    subject: konu,
    text: metin,
    html: htmlSarmala(metindenHtml(metin)),
    ...(g.yanitlanan?.mesajKimligi
      ? {
          inReplyTo: g.yanitlanan.mesajKimligi,
          references: referansZinciri(g.yanitlanan.referanslar, g.yanitlanan.mesajKimligi),
        }
      : {}),
    ...(g.ekler?.length
      ? { attachments: g.ekler.map((e) => ({ filename: e.ad, content: e.icerik, contentType: e.tur })) }
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

  /* Giden iletide Bcc başlığı yok (alıcılar görmesin); Gönderilmiş kopyasında
     var — Outlook da kime gizli gittiğini gösterir. Aynı düğüm: Message-ID aynı. */
  let kopya = ham;
  if (gizli.length) {
    dugum.keepBcc = true;
    kopya = await dugum.build();
  }
  const kopyaHatasi = await gonderilmislereEkle(kutu, kopya);
  return { tamam: true, mesajKimligi, kopyaHatasi };
}

/**
 * Gönderen kutularına GELEN e-postanın sınıflandırılması — SAF fonksiyonlar.
 *
 * Veritabanına, ağa ya da Next'e dokunmaz; içe aktarması yok. Node'la doğrudan
 * test ediliyor (scripts/gelen-kurallar-test.mjs). Tarayıcı
 * (src/lib/gelen-tarama.ts) her iletiyi buradan geçirip ne yapacağına karar
 * verir:
 *
 *   geri_donus  — adres yok / reddetti. Kalıcıysa firma "Adres hatalı" olur
 *                 (geri dönüş eşiği ancak böyle çalışır); geçiciyse yalnız not.
 *   otomatik    — "izindeyim", otomatik yanıt: yanıt SAYILMAZ, yalnız not.
 *   abonelik    — "unsubscribe", "remove me", "darse de baja": adres engel
 *                 listesine girer (yasal zorunluluk; List-Unsubscribe'ın
 *                 mailto: yolu da buraya düşer).
 *   yanit       — bir insanın yanıtı: firma "Yanıt geldi" olur, ilk satırları not.
 *
 * Gelen iletinin içeriği GÜVENİLMEZ: yalnızca düz metin olarak okunur, kısaltılıp
 * not olarak saklanır, hiçbir bağlantısı açılmaz.
 */

export type GelenOzet = {
  /** Gönderen adresi, küçük harf */
  kimden: string;
  /** Görünen ad */
  kimdenAd: string;
  konu: string;
  /** Düz metin gövde (HTML'den çevrilmiş olabilir) */
  metin: string;
  /** Başlıklar: küçük harf ad → değer */
  basliklar: Record<string, string>;
  /** message/delivery-status parçalarının metni (geri dönüş raporu) */
  raporlar: string[];
};

export type Siniflama =
  | { tur: "geri_donus"; kalici: boolean; adresler: string[]; sebep: string }
  | { tur: "otomatik"; sebep: string }
  | { tur: "abonelik"; sebep: string }
  | { tur: "yanit"; ozet: string };

const EPOSTA = /[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/* ------------------------------------------------------------ alıntı */

/* Yanıtın altına eklenen eski ileti: "On … wrote:", Outlook'un "From: … Sent:"
   bloğu, "-----Original Message-----", çizgi ayraç. Dillere göre. */
const ALINTI_BASI = new RegExp(
  [
    String.raw`^on .{3,200}wrote:\s*$`,
    String.raw`^el .{3,200}escribi[oó]:\s*$`,
    String.raw`^em .{3,200}escreveu:\s*$`,
    String.raw`^le .{3,200}a [ée]crit\s*:\s*$`,
    String.raw`^am .{3,200}schrieb.{0,80}:\s*$`,
    String.raw`^il .{3,200}ha scritto:\s*$`,
    String.raw`^.{3,200}(пишет|написал\(а\)|написал):\s*$`,
    String.raw`^.{3,200}tarihinde .{0,120}(şunu yazdı|yazdı):\s*$`,
    String.raw`^-{2,}\s*(original message|mensaje original|mensagem original|message d'origine|ursprüngliche nachricht|messaggio originale|исходное сообщение|orijinal ileti)\s*-{2,}\s*$`,
    String.raw`^_{10,}\s*$`,
    String.raw`^(from|de|von|da|от|kimden)\s*:\s.+$`,
  ].join("|"),
  "im"
);

/**
 * Yanıtın YENİ kısmı: alıntılanan eski ileti ve bizim altbilgimiz atılır.
 * Altbilgide her dilde "abonelikten çık" cümlesi var — alıntıda kaldıysa
 * yanıt yanlışlıkla abonelik iptali sayılırdı.
 */
export function yeniMetin(metin: string): string {
  const satirlar = metin.replace(/\r\n?/g, "\n").split("\n");
  const kalan: string[] = [];
  for (const s of satirlar) {
    const t = s.trim();
    if (t.startsWith(">")) break;
    if (ALINTI_BASI.test(t)) break;
    if (/\/api\/unsubscribe\?t=/i.test(t)) break; // bizim altbilgimiz (alıntısız kopyalanmış)
    if (t === "--" || t === "-- ") break; // imza ayracı: altı imza/altbilgi
    kalan.push(s);
  }
  return kalan.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* ------------------------------------------------------ geri dönüş */

const SISTEM_GONDERICI = /^(mailer-daemon|mailerdaemon|mail-daemon|postmaster)@/i;
const SISTEM_AD = /mail delivery (system|subsystem)|mailer-daemon|postmaster|microsoft outlook$|e-posta teslim/i;
const GERI_DONUS_KONU =
  /undeliver|undelivered|delivery (status notification|failure|has failed|failed|incomplete)|mail delivery failed|returned mail|failure notice|non[- ]?deliver|could not be delivered|returned to sender|no se pudo entregar|entrega fallida|não (foi possível )?entreg|non remis|unzustellbar|non recapitat|не доставлено|iletilemedi|teslim edilemedi/i;
/* Durum kodlarında orta hane 0-7 (RFC 3463 konu sınıfları): "Exim 4.99.5" gibi
   bir sürüm numarası "4.x.x geçici hata" sanılmasın. */
const KALICI = /permanent(ly)? (error|failure|fatal)|\b5\.[0-7]\.\d{1,3}\b|\b55[0-4]\b|does not exist|user unknown|unknown user|no such (user|mailbox|recipient)|mailbox (is )?(unavailable|not found|disabled)|address rejected|recipient (address )?rejected|not a valid|invalid (recipient|address|mailbox)|account (has been )?disabled|domain (not found|does not exist)|host or domain name not found|name or service not known/i;
const GECICI = /temporar(y|ily)|delayed|delay|will (continue|retry|be retried)|has not yet been delivered|still trying|\b4\.[0-7]\.\d{1,3}\b|\b4[25]\d\b.*(try again|later)/i;

/* Geri dönüş metninin çoğu, gönderdiğimiz iletinin başlıklarını da alıntılıyor
   (Office 365: "Original Message Headers", Exim: "This is a copy of the
   message…"). O başlıklardaki "Received: … (Exim 4.99.5)" satırı 550 5.7.133
   kalıcı reddini "geçici" gösterdi (26 Eylül, MATRO). Kod yalnızca raporun
   kendi metninde aranır. */
const KOPYA_BASI = /^\s*(original message headers|-+ ?this is a copy of the message|-+ ?original message ?-+|received: from )/im;

function raporMetni(metin: string): string {
  const i = metin.search(KOPYA_BASI);
  return i > 0 ? metin.slice(0, i) : metin;
}

function geriDonusMu(g: GelenOzet): boolean {
  if (g.raporlar.length) return true;
  if (/report-type\s*=\s*"?delivery-status/i.test(g.basliklar["content-type"] ?? "")) return true;
  if (g.basliklar["x-failed-recipients"]) return true;
  if (SISTEM_GONDERICI.test(g.kimden) || SISTEM_AD.test(g.kimdenAd)) return GERI_DONUS_KONU.test(g.konu) || KALICI.test(g.metin);
  return false;
}

function geriDonusAdresleri(g: GelenOzet): string[] {
  const bulunan = new Set<string>();
  for (const r of g.raporlar) {
    for (const m of r.matchAll(/(?:final|original)-recipient:\s*rfc822;\s*<?([^\s<>;]+@[^\s<>;]+)>?/gi)) {
      bulunan.add(m[1].toLowerCase().replace(/[.,]+$/, ""));
    }
  }
  for (const a of (g.basliklar["x-failed-recipients"] ?? "").split(/[,\s]+/)) {
    if (a.includes("@")) bulunan.add(a.toLowerCase().replace(/[<>]/g, ""));
  }
  /* Rapor yoksa (Exim'in düz metin raporu) gövdedeki bütün adresler aday —
     hangisine gerçekten gönderdiğimize veritabanı karar verir. */
  if (!bulunan.size) for (const m of g.metin.matchAll(EPOSTA)) bulunan.add(m[0].toLowerCase());
  return [...bulunan];
}

function geriDonusSebebi(g: GelenOzet): string {
  const kaynak = [...g.raporlar, g.metin].join("\n");
  const tani = /diagnostic-code:\s*(?:smtp;\s*)?(.+)/i.exec(kaynak)?.[1];
  const satir =
    tani ??
    kaynak.split("\n").map((s) => s.trim()).find((s) => /\b[45]\d\d\b|[45]\.\d\.\d|does not exist|unknown|rejected|not found/i.test(s)) ??
    g.konu;
  return satir.replace(/\s+/g, " ").trim().slice(0, 240);
}

function kaliciMi(g: GelenOzet): boolean {
  for (const r of g.raporlar) {
    const s = /^status:\s*([245])\.\d+\.\d+/im.exec(r)?.[1];
    if (s === "5") return true;
    if (s === "4") return false;
    const a = /^action:\s*(\w+)/im.exec(r)?.[1]?.toLowerCase();
    if (a === "failed") return true;
    if (a === "delayed") return false;
  }
  const metin = raporMetni(`${g.konu}\n${g.metin}`);
  if (GECICI.test(metin) && !/permanent/i.test(metin)) return false;
  return KALICI.test(metin);
}

/* --------------------------------------------------- otomatik yanıt */

const OTOMATIK_KONU =
  /^(automatic reply|auto(matic)?[- ]?reply|auto:|autoreply|auto-response|out of (the )?office|ooo\b|otomatik yan[ıi]t|respuesta autom[aá]tica|resposta autom[aá]tica|r[ée]ponse automatique|automatische antwort|risposta automatica|автоответ|автоматический ответ|abwesenheit|fuera de la oficina|absence|vacation|on leave|away from)/i;

function otomatikMi(g: GelenOzet): string | null {
  const as = (g.basliklar["auto-submitted"] ?? "").trim();
  if (as && !/^no\b/i.test(as)) return `Auto-Submitted: ${as}`;
  if (g.basliklar["x-autoreply"] || g.basliklar["x-autorespond"]) return "X-Autoreply";
  if (/^(auto_reply|bulk|junk)$/i.test((g.basliklar["precedence"] ?? "").trim())) return `Precedence: ${g.basliklar["precedence"]}`;
  const konu = g.konu.replace(/^\s*((re|aw|sv|fw|fwd|rv|enc|tr)\s*:\s*)+/i, "");
  if (OTOMATIK_KONU.test(konu)) return `konu: ${g.konu.slice(0, 120)}`;
  return null;
}

/* ------------------------------------------------- abonelik iptali */

const ABONELIK =
  /unsubscribe|remove me|take me off|opt[- ]?out|stop (sending|emailing|contacting)|do not (contact|email|send|write)|don'?t (contact|email|send|write)|darse de baja|dar(me)? de baja|no (me|nos) (env[ií]e|env[ií]en|escriba|escriban|contacte)|descadastr|cancelar (inscri|assinatura)|pare de (enviar|mandar)|n[ãa]o (quero|desejo) (mais )?receber|d[ée]sabonn|d[ée]sinscri|ne plus (recevoir|m'envoyer)|abbestell|abmeld|keine (weiteren )?(e-?mails|nachrichten)|cancellami|disiscri|non (voglio|desidero) (pi[uù] )?ricevere|отпис|больше не (пишите|присылайте)|abonelikten [çc][ıi]k|listeden [çc][ıi]kar|bir daha (yazmay|g[öo]ndermey)|wypis|rezygnuj/i;

function abonelikMi(g: GelenOzet, yeni: string): string | null {
  const konu = g.konu.replace(/^\s*((re|aw|sv|fw|fwd|rv|enc|tr)\s*:\s*)+/i, "").trim();
  if (ABONELIK.test(konu)) return `konu: ${konu.slice(0, 120)}`;
  /* Yalnızca yanıtın başı: uzun bir yanıtın ortasındaki "unsubscribe" bir
     alıntı ya da imza olabilir */
  const bas = yeni.slice(0, 400);
  const m = ABONELIK.exec(bas);
  if (m) return `metin: “${bas.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\s+/g, " ").trim()}”`;
  return null;
}

/* --------------------------------------------------------- karar */

export function gelenSiniflandir(g: GelenOzet): Siniflama {
  if (geriDonusMu(g)) {
    return { tur: "geri_donus", kalici: kaliciMi(g), adresler: geriDonusAdresleri(g), sebep: geriDonusSebebi(g) };
  }
  const oto = otomatikMi(g);
  if (oto) return { tur: "otomatik", sebep: oto };
  const yeni = yeniMetin(g.metin);
  const abone = abonelikMi(g, yeni);
  if (abone) return { tur: "abonelik", sebep: abone };
  return { tur: "yanit", ozet: yeni.replace(/\s+/g, " ").trim().slice(0, 500) };
}

/** In-Reply-To / References başlıklarındaki ileti kimlikleri: köşeli parantezsiz, küçük harf. */
export function mesajKimlikleri(...basliklar: (string | string[] | undefined)[]): string[] {
  const hepsi = new Set<string>();
  for (const b of basliklar.flat()) {
    for (const m of String(b ?? "").matchAll(/<([^<>\s]+)>/g)) hepsi.add(m[1].toLowerCase());
  }
  return [...hepsi];
}

/** Kayıttaki ileti kimliği ("<abc@host>") aynı biçime. */
export function kimlikSade(k: string): string {
  return k.trim().replace(/^<|>$/g, "").toLowerCase();
}

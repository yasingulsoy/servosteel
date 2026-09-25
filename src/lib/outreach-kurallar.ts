/**
 * Tanıtım e-postası kuralları — SAF fonksiyonlar ve metinler.
 *
 * Veritabanına, isteğe ya da Next'e dokunmaz; içe aktarması da yok. Bu yüzden
 * Node'la doğrudan test edilebiliyor ve kurallar tek yerde okunuyor:
 * hangi ülkeye yazılmaz, altbilgide ne yazar, sunucunun hangi cevabı
 * gönderimi o gün için durdurur.
 */

/* ------------------------------------------------------------ ülkeler */

/**
 * E-posta GÖNDERİLMEYEN ülkeler. Buradaki iki ülkede şirketlere de ticari
 * e-posta için önceden açık izin gerekiyor (DE: UWG §7, AT: TKG 2021 §174);
 * izinsiz tek bir e-posta bile ihtar ve tazminat konusu olabiliyor.
 * Liste veritabanında değil kodda: panelden biri "bir kereliğine" açamasın.
 */
export const ENGELLI_ULKELER: Record<string, string> = {
  Almanya:
    "Almanya'da şirketlere de ticari e-posta için önceden açık izin gerekiyor (UWG §7). Telefon, iletişim formu ya da LinkedIn ile ulaşın.",
  Avusturya:
    "Avusturya'da şirketlere de ticari e-posta için önceden açık izin gerekiyor (TKG 2021 §174). Telefon, iletişim formu ya da LinkedIn ile ulaşın.",
};

/** Gönderilebilen ama kuralları ülkeden ülkeye değişen AB ülkeleri — önizlemede uyarı çıkar,
 *  otomatik gönderim varsayılan olarak bunlara YAZMAZ (bkz. otomatik-gonderim.ts). */
const AB_ULKELERI = new Set([
  "Belçika", "Bulgaristan", "Çekya", "Danimarka", "Estonya", "Finlandiya", "Fransa",
  "Hırvatistan", "Hollanda", "İrlanda", "İspanya", "İsveç", "İtalya", "Kıbrıs",
  "Letonya", "Litvanya", "Lüksemburg", "Macaristan", "Malta", "Polonya", "Portekiz",
  "Romanya", "Slovakya", "Slovenya", "Yunanistan",
]);

export const AB_ULKE_LISTESI = [...AB_ULKELERI];

export function ulkeUyarisi(ulke: string): string | null {
  if (!AB_ULKELERI.has(ulke)) return null;
  return "AB ülkesi: ticari e-posta kuralları ülkeden ülkeye değişiyor, bazıları şirketlere yazmak için de önceden izin arıyor. Göndermek sizin kararınız; e-posta tek, firmaya özel ve abonelikten çıkma bağlantılı gider.";
}

/* ------------------------------------------------------------ diller */

/** Şablonu olan diller (seo/eposta-taslaklari.json ile aynı). Macarca şablon yok → İngilizce. */
const DILLER = ["en", "es", "it", "de", "pl", "ru", "tr", "fr", "pt"] as const;
export type EpostaDili = (typeof DILLER)[number];

export function epostaDili(dil: string): EpostaDili {
  return (DILLER as readonly string[]).includes(dil) ? (dil as EpostaDili) : "en";
}

/* ---------------------------------------------------------- altbilgi */

const IPTAL_SATIRI: Record<EpostaDili, string> = {
  en: "Prefer not to hear from us again? Unsubscribe: {link}",
  es: "¿Prefiere no recibir más correos nuestros? Darse de baja: {link}",
  it: "Preferisce non ricevere altre nostre e-mail? Annulla l'iscrizione: {link}",
  de: "Sie möchten keine weiteren E-Mails von uns erhalten? Abmelden: {link}",
  pl: "Nie chcą Państwo otrzymywać od nas kolejnych wiadomości? Rezygnacja: {link}",
  ru: "Не хотите больше получать наши письма? Отписаться: {link}",
  tr: "Bizden başka e-posta almak istemiyorsanız: {link}",
  fr: "Vous préférez ne plus recevoir nos e-mails ? Se désabonner : {link}",
  pt: "Prefere não receber mais e-mails nossos? Cancelar: {link}",
};

/**
 * E-postanın sonuna eklenen altbilgi: abonelikten çıkma bağlantısı, unvan,
 * adres. Paneldeki metin kutusunun DIŞINDA — gönderen düzenlerken yanlışlıkla
 * silemesin. Ayraç "-- " (sonda boşlukla): e-posta istemcileri altını imza
 * sayıp soluk gösteriyor.
 */
export function altbilgi(dil: string, iptalUrl: string, unvan: string, adres: string): string {
  const satir = IPTAL_SATIRI[epostaDili(dil)].replace("{link}", iptalUrl);
  return `\n\n-- \n${satir}\n${unvan}\n${adres}`;
}

/** HTML altbilgide bağlantı adres değil, tıklanır yazı: düz metindeki "Unsubscribe: {link}" → [Unsubscribe] */
const IPTAL_HTML: Record<EpostaDili, string> = {
  en: "Prefer not to hear from us again? {a}Unsubscribe{/a}",
  es: "¿Prefiere no recibir más correos nuestros? {a}Darse de baja{/a}",
  it: "Preferisce non ricevere altre nostre e-mail? {a}Annulla l'iscrizione{/a}",
  de: "Sie möchten keine weiteren E-Mails von uns erhalten? {a}Abmelden{/a}",
  pl: "Nie chcą Państwo otrzymywać od nas kolejnych wiadomości? {a}Rezygnacja{/a}",
  ru: "Не хотите больше получать наши письма? {a}Отписаться{/a}",
  tr: "Bizden başka e-posta almak istemiyorsanız {a}abonelikten çıkın{/a}.",
  fr: "Vous préférez ne plus recevoir nos e-mails ? {a}Se désabonner{/a}",
  pt: "Prefere não receber mais e-mails nossos? {a}Cancelar{/a}",
};

/** Altbilginin HTML hâli (e-postanın HTML parçası ve panel önizlemesi) — satırlar aynı, bağlantı yazılı. */
export function altbilgiHtml(dil: string, iptalUrl: string, unvan: string, adres: string): string {
  const k = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const satir = k(IPTAL_HTML[epostaDili(dil)])
    .replace("{a}", `<a href="${k(iptalUrl)}" style="color:#777">`)
    .replace("{/a}", "</a>");
  return `${satir}<br>${k(unvan)}<br>${k(adres)}`;
}

/* ------------------------------------------------ abonelik iptal sayfası */

export type IptalMetni = {
  baslik: string;
  soru: string;
  dugme: string;
  tamam: string;
  gecersiz: string;
};

/** {eposta} yer tutucusu maskelenmiş adresle doldurulur. */
export const IPTAL_SAYFASI: Record<EpostaDili, IptalMetni> = {
  en: {
    baslik: "Unsubscribe",
    soru: "Stop receiving emails from Servosteel at {eposta}?",
    dugme: "Yes, unsubscribe",
    tamam: "Done. We will not send any more emails to {eposta}.",
    gecersiz: "This link is not valid. To stop our emails, simply reply with “unsubscribe”.",
  },
  es: {
    baslik: "Darse de baja",
    soru: "¿Dejar de recibir correos de Servosteel en {eposta}?",
    dugme: "Sí, darme de baja",
    tamam: "Listo. No enviaremos más correos a {eposta}.",
    gecersiz: "Este enlace no es válido. Para dejar de recibir nuestros correos, responda con «baja».",
  },
  it: {
    baslik: "Annulla l'iscrizione",
    soru: "Non ricevere più e-mail da Servosteel all'indirizzo {eposta}?",
    dugme: "Sì, annulla",
    tamam: "Fatto. Non invieremo più e-mail a {eposta}.",
    gecersiz: "Questo link non è valido. Per non ricevere più le nostre e-mail, risponda con «cancellami».",
  },
  de: {
    baslik: "Abmelden",
    soru: "Keine E-Mails mehr von Servosteel an {eposta}?",
    dugme: "Ja, abmelden",
    tamam: "Erledigt. Wir senden keine E-Mails mehr an {eposta}.",
    gecersiz: "Dieser Link ist ungültig. Antworten Sie einfach mit „Abmelden“, um keine E-Mails mehr zu erhalten.",
  },
  pl: {
    baslik: "Rezygnacja z wiadomości",
    soru: "Czy nie chcą Państwo otrzymywać wiadomości od Servosteel na adres {eposta}?",
    dugme: "Tak, rezygnuję",
    tamam: "Gotowe. Nie wyślemy więcej wiadomości na adres {eposta}.",
    gecersiz: "Ten link jest nieprawidłowy. Aby zrezygnować z naszych wiadomości, prosimy odpowiedzieć „rezygnuję”.",
  },
  ru: {
    baslik: "Отписка",
    soru: "Больше не получать письма от Servosteel на адрес {eposta}?",
    dugme: "Да, отписаться",
    tamam: "Готово. Мы больше не будем писать на адрес {eposta}.",
    gecersiz: "Ссылка недействительна. Чтобы отписаться, просто ответьте на письмо словом «отписаться».",
  },
  tr: {
    baslik: "Abonelikten çık",
    soru: "{eposta} adresine Servosteel'den e-posta gelmesin mi?",
    dugme: "Evet, çıkar",
    tamam: "Tamam. {eposta} adresine artık e-posta göndermeyeceğiz.",
    gecersiz: "Bu bağlantı geçersiz. E-postalarımızı durdurmak için “çıkar” yazarak yanıtlamanız yeterli.",
  },
  fr: {
    baslik: "Se désabonner",
    soru: "Ne plus recevoir d'e-mails de Servosteel à l'adresse {eposta} ?",
    dugme: "Oui, me désabonner",
    tamam: "C'est fait. Nous n'enverrons plus d'e-mails à {eposta}.",
    gecersiz: "Ce lien n'est pas valide. Pour ne plus recevoir nos e-mails, répondez simplement « désabonner ».",
  },
  pt: {
    baslik: "Cancelar inscrição",
    soru: "Deixar de receber e-mails da Servosteel em {eposta}?",
    dugme: "Sim, cancelar",
    tamam: "Pronto. Não enviaremos mais e-mails para {eposta}.",
    gecersiz: "Este link não é válido. Para não receber mais nossos e-mails, basta responder com «cancelar».",
  },
};

/* ------------------------------------------------------------ adres */

const EPOSTA = /^[^\s@<>"',;:()[\]\\]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function epostaGecerli(e: string): boolean {
  return e.length <= 254 && EPOSTA.test(e);
}

/** "info@firma.com" -> "in**@firma.com". Abonelik sayfası bağlantıyı bilen herkese açık. */
export function maskele(e: string): string {
  const [ad, alan] = e.split("@");
  if (!ad || !alan) return "";
  const acik = ad.length <= 2 ? ad.slice(0, 1) : ad.slice(0, 2);
  return `${acik}${"*".repeat(Math.max(2, ad.length - acik.length))}@${alan}`;
}

/* --------------------------------------------------------- sigorta */

/** nodemailer hatasının işimize yarayan alanları. */
export type SmtpHatasi = {
  code?: string;
  responseCode?: number;
  response?: string;
  command?: string;
  message?: string;
};

/**
 *  sigorta — gönderim o gün için DURUR (giriş reddi, hız sınırı, spam/engel)
 *  alici   — yalnızca bu adres kötü; firma "adres hatalı" olur, gönderim sürer
 *  hata    — diğer her şey; üst üste ikincisi sigortayı atar
 */
export type HataTuru = "sigorta" | "alici" | "hata";

/**
 * Sigorta kimi durdurur:
 *  kutu — yalnızca bu kutu (giriş reddi, "relay"/yetki: ayar sorunu)
 *  alan — bu alan adındaki BÜTÜN kutular (hız sınırı, spam/engel, itibar:
 *         sağlayıcılar itibarı alan adına bakarak tutuyor; aynı alan adındaki
 *         öbür kutuyla devam etmek aynı engele gitmek demek)
 */
export type SigortaKapsami = "kutu" | "alan";

/* "relay" / "authenticat…": sunucu bizi göndermeye yetkili saymıyor — alıcının
   değil ayarın sorunu; alıcı hatası sayılsaydı her denemede bir firma yanlışlıkla
   "adres hatalı" olurdu. */
const POLITIKA =
  /rate|limit|exceed|quota|too many|throttl|spam|block|blacklist|listed|policy|reputation|abuse|suspend|frozen|disabled|relay|not permitted|authenticat/i;
/* Politika cevaplarından hesaba/ayara ait olanlar — alan adının itibarıyla ilgisi yok */
const KUTU_POLITIKASI = /relay|not permitted|authenticat/i;
const ALICI_YOK =
  /user unknown|unknown user|no such user|mailbox (is )?(unavailable|not found)|does not exist|invalid (recipient|address|mailbox)|recipient (address )?rejected|address rejected|5\.1\.\d/i;

/* Alıcı sunucu BİZİM gönderen adresimizi doğrulayamadı. Exim bunu RCPT TO
   aşamasında 550 ile reddediyor, o yüzden "alıcının adresi bozuk" sanılıyordu —
   oysa sorun alıcıda değil bizde: karşı sunucu MX'imize geri bağlanıp
   gulsoy@servosteel.com.tr var mı diye soruyor ve cevap alamıyor. Firmayı
   "Adres hatalı" işaretlemek burada İKİ hata yapardı: sağlam bir müşteri
   adayını temelli yakar, üstelik geri dönüş sigortasını yanlış sebeple
   doldurup bütün gönderimi durdururdu. (İlk görülme: 25 Eylül 2026,
   Steel Frame Solutions / Yeni Zelanda.) */
const GONDEREN_DOGRULAMA =
  /sender verify (failed|fail)|sender verification|verify failed for|callout|sender address rejected/i;

function kisa(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, 240);
}

export function hataSiniflandir(h: SmtpHatasi): { tur: HataTuru; sebep: string; kapsam: SigortaKapsami } {
  /* nodemailer'ın mesajı sunucu cevabını genelde zaten içeriyor
     ("Mail command failed: 421 …") — ikisini yan yana yazınca aynı satır
     iki kez okunuyordu. */
  const cevap = h.response ?? "";
  const mesaj = h.message ?? "";
  const metin = kisa(cevap && mesaj.includes(cevap) ? mesaj : `${cevap} ${mesaj}`);
  const kod = h.responseCode ?? 0;

  if (h.code === "EAUTH" || kod === 530 || kod === 534 || kod === 535) {
    return {
      tur: "sigorta",
      sebep: "SMTP girişi reddedildi — kutunun adresi ve parolası (OUTREACH_SMTP_USER / _PASS) kontrol edilmeli.",
      kapsam: "kutu",
    };
  }
  /* Kendi sunucumuzun 4xx'i: "şimdi değil" — hız sınırı ya da geçici engel.
     Üstüne gitmek hesabı kara listeye götürür. */
  if (kod >= 400 && kod < 500) {
    return { tur: "sigorta", sebep: `Sunucu geçici olarak reddetti (${kod}): ${metin}`, kapsam: "alan" };
  }
  if (POLITIKA.test(metin)) {
    return {
      tur: "sigorta",
      sebep: `Sunucu gönderimi sınırladı ya da engelledi: ${metin}`,
      kapsam: KUTU_POLITIKASI.test(metin) ? "kutu" : "alan",
    };
  }
  /* Gönderen doğrulaması alıcı kontrolünden ÖNCE: ikisi de RCPT TO'da 550
     veriyor, sonra bakılsa alıcı sanılırdı. */
  if (GONDEREN_DOGRULAMA.test(metin)) {
    return {
      tur: "hata",
      sebep: `Alıcı sunucu bizim gönderen adresimizi doğrulayamadı${kod ? ` (${kod})` : ""}: ${metin}`,
      kapsam: "kutu",
    };
  }
  if (h.code === "EENVELOPE" || (kod >= 500 && (h.command === "RCPT TO" || ALICI_YOK.test(metin)))) {
    return { tur: "alici", sebep: `Alıcı adresi reddedildi${kod ? ` (${kod})` : ""}: ${metin}`, kapsam: "kutu" };
  }
  return { tur: "hata", sebep: metin || h.code || "bilinmeyen hata", kapsam: "kutu" };
}

/* ------------------------------------------------------- itibar kuralları */

/**
 * Sisteme ya da hiç kimseye gitmeyen adresler. Bunlara giden e-posta ya geri
 * döner ya da "biz size yazmadık" şikâyeti olur — ikisi de itibardan yer.
 */
const SISTEM_ADRESI =
  /^(no-?reply|donotreply|do-not-reply|noresponder|postmaster|abuse|mailer-daemon|hostmaster|webmaster|bounce\w*|devnull|null)@/i;

export function sistemAdresiMi(e: string): boolean {
  return SISTEM_ADRESI.test(e);
}

/**
 * Isınma (KUTU başına): yeni kutunun itibarı yok. Büyük sağlayıcılar (Gmail, Outlook) ilk
 * haftalarda gelen hacme bakıyor; sıfırdan günde 20-50'ye çıkan gönderici
 * "spam" sayılıyor. İlk gönderimden itibaren:
 *   1. gün    → günde en çok 10
 *   2. gün    → günde en çok 20
 *   3-4. gün  → günde en çok 30
 *   sonrası   → ayarlanan tavan (OUTREACH_DAILY_LIMIT, üst sınır 50)
 *
 * 2026-09-23 (Yasin: "her kutudan 40'ar çıkmalı"): rampa dikleştirildi, kutu
 * başına hedef tavan 40 (env). Karar Yasin'in; benim payıma düşen, çıkışı tek
 * hamlede değil dört günde yapmak — sağlayıcılar rakama değil hacmin EĞİMİNE
 * bakıyor, bir günde 10'dan 40'a çıkan kutu "devralınmış hesap" gibi görünür.
 * Kutular bir günlük; alan adı eski. Fren: geri dönüş eşiği %6'ya çekildi.
 * `gun` = ilk başarılı gönderimden bu yana geçen İstanbul günü; hiç yoksa null.
 */
export function isinmaTavani(gun: number | null, tavan: number): { tavan: number; asama: string | null } {
  const g = gun ?? 0;
  if (g < 1) return { tavan: Math.min(tavan, 10), asama: `ısınma: ${g + 1}. gün` };
  if (g < 2) return { tavan: Math.min(tavan, 20), asama: `ısınma: ${g + 1}. gün` };
  if (g < 4) return { tavan: Math.min(tavan, 30), asama: `ısınma: ${g + 1}. gün` };
  /* Alan adı merdiveniyle aynı ara basamak: 180'lik alan tavanı dört kutuya
     bölününce zaten ~45 düşüyor, bu sınır yalnızca alan tavanı bağlamazsa
     (kutu sayısı değişirse) devreye girer. */
  if (g < 6) return { tavan: Math.min(tavan, 50), asama: `ısınma: ${g + 1}. gün` };
  return { tavan, asama: null };
}

/**
 * Geri dönüş eşiği. Geri dönen e-posta (bounce) gönderene gelir; panel onu
 * okuyamaz, firmayı "Adres hatalı" işaretlemek elle. Son 50 gönderimde
 * hatalı oranı %6'yı (en az 3 firma) geçerse liste kirlidir: devam etmek
 * sağlayıcıların gözünde "adres toplayıp yazan" göndericiye çevirir.
 *
 * 2026-09-23'te %10'dan %6'ya çekildi: günlük hacim 20'den 150'ye çıkarken
 * aynı oran çok daha fazla kötü adres demek (%10 × 150 = günde 15 geri dönüş),
 * o da alan adının itibarını hızla yakar. Hız yükseliyorsa fren de sıkılır.
 */
export function geriDonusEngeli(toplam: number, hatali: number): string | null {
  if (hatali >= 3 && toplam > 0 && hatali / toplam >= 0.06) {
    return `Son ${toplam} gönderimin ${hatali}'i geri döndü (%${Math.round((hatali / toplam) * 100)}). Geri dönen adresler temizlenmeden ve sebebi anlaşılmadan gönderime devam edilmez.`;
  }
  return null;
}

/* ------------------------------------------------------------ ayarlar */

/**
 * Tek gönderen kutusu. `no` 1'den başlar: 1 = `OUTREACH_SMTP_USER`,
 * 2…9 = `OUTREACH_SMTP_USER_2` … `_9`.
 */
export type GonderenKutusu = {
  no: number;
  host: string;
  port: number;
  /** Tam adres, küçük harf */
  user: string;
  pass: string;
  /** Görünen ad ("Elizaveta Shpelevaya") */
  ad: string;
  /** Adresin alan adı — itibar ve alan adı tavanı buna göre */
  alan: string;
};

export type OutreachAyarlari = {
  /** Kullanılabilir kutular (eksiksiz tanımlananlar), numara sırasıyla */
  kutular: GonderenKutusu[];
  yanitAdresi: string;
  gizliKopya: string;
  /** Kutu başına günlük tavan (ısınma sonrası), üst sınır 50 */
  gunlukTavan: number;
  /** Alan adı başına günlük tavan — o alan adındaki kutuların TOPLAMI, üst sınır 150 */
  alanTavani: number;
  /** Aynı kutudan iki e-posta arası en az saniye */
  aralikSn: number;
  /** Boşsa gönderime hazır. Doluysa hiçbir kutu kullanılamıyor. */
  eksik: string[];
  /** Tanımı yarım kalan ek kutular — onlar atlanır, diğerleri gönderir */
  uyarilar: string[];
};

const EK_KUTU_EN_COK = 9;

/**
 * Gönderim ayarları — ortam değişkenlerinden.
 *
 * Kutu ve parola AYRI (`OUTREACH_SMTP_USER`/`_PASS`): form bildirimleri
 * `SMTP_USER` (website@) kutusundan gidiyor ve o kutu talebin tek kanalı.
 * Tanıtım e-postası yüzünden bir hız sınırı ya da engel yenirse talep
 * bildirimleri etkilenmemeli; aynı kutu verilirse o kutu kullanılmaz.
 * Sunucu ve port aynı olabilir; verilmezse formunkiler kullanılır.
 *
 * Ek kutular `OUTREACH_SMTP_USER_2` / `OUTREACH_SMTP_PASS_2` … `_9`; sunucu,
 * port ve görünen ad verilmezse 1. kutununkiler (`OUTREACH_SMTP_HOST_2`,
 * `_PORT_2`, `OUTREACH_FROM_NAME_2` ile ayrı verilebilir — başka alan adındaki
 * kutunun sunucusu farklıdır).
 *
 * Tavan ve aralığın sınırı KODDA: yeni kutunun itibarı yok, günde 50'nin
 * üstü ya da dakikada birden sık gönderim paylaşımlı sunucuda kara listeye
 * giden yol. Alan adı tavanı ayrı: Gmail/Outlook itibarı kutuya değil alan
 * adına bakıyor — aynı alan adında beş kutu açmak hacmi beşe katlamaz, o alan
 * adından giden soğuk e-postayı beşe katlar.
 */
export function ayarlariOku(env: Record<string, string | undefined>): OutreachAyarlari {
  const host = (env.OUTREACH_SMTP_HOST ?? env.SMTP_HOST ?? "").trim();
  const port = Number(env.OUTREACH_SMTP_PORT ?? env.SMTP_PORT ?? 465) || 465;
  const ad = (env.OUTREACH_FROM_NAME ?? "").trim() || "Servosteel";
  const formKutusu = (env.SMTP_USER ?? "").trim().toLowerCase();

  const eksik: string[] = [];
  const uyarilar: string[] = [];
  const kutular: GonderenKutusu[] = [];
  const gorulen = new Set<string>();

  /* 1. kutu: eksikse gönderim kapalı sayılır (panelin anlattığı kurulum bu) —
     ancak ek kutulardan biri tamamsa onlarla gönderilir. */
  const user1 = (env.OUTREACH_SMTP_USER ?? "").trim().toLowerCase();
  const pass1 = env.OUTREACH_SMTP_PASS ?? "";
  const eksik1: string[] = [];
  if (!host) eksik1.push("OUTREACH_SMTP_HOST");
  if (!user1) eksik1.push("OUTREACH_SMTP_USER");
  if (!pass1) eksik1.push("OUTREACH_SMTP_PASS");
  if (user1 && formKutusu && user1 === formKutusu) {
    eksik1.push("OUTREACH_SMTP_USER form bildirim kutusuyla (SMTP_USER) aynı — ayrı bir kutu gerekli");
  } else if (user1 && !user1.includes("@")) {
    eksik1.push("OUTREACH_SMTP_USER tam adres olmalı (ör. export@alanadi.com)");
  }
  if (!eksik1.length) {
    kutular.push({ no: 1, host, port, user: user1, pass: pass1, ad, alan: user1.split("@")[1] });
    gorulen.add(user1);
  }

  for (let n = 2; n <= EK_KUTU_EN_COK; n++) {
    const user = (env[`OUTREACH_SMTP_USER_${n}`] ?? "").trim().toLowerCase();
    const pass = env[`OUTREACH_SMTP_PASS_${n}`] ?? "";
    if (!user && !pass) continue;
    const h = (env[`OUTREACH_SMTP_HOST_${n}`] ?? "").trim() || host;
    const p = Number(env[`OUTREACH_SMTP_PORT_${n}`] ?? port) || port;
    const sorun = !user
      ? `OUTREACH_SMTP_USER_${n} yok`
      : !user.includes("@")
        ? `OUTREACH_SMTP_USER_${n} tam adres olmalı`
        : !pass
          ? `OUTREACH_SMTP_PASS_${n} yok`
          : !h
            ? `OUTREACH_SMTP_HOST_${n} yok`
            : user === formKutusu
              ? `OUTREACH_SMTP_USER_${n} form bildirim kutusuyla (SMTP_USER) aynı`
              : gorulen.has(user)
                ? `OUTREACH_SMTP_USER_${n} başka bir kutuyla aynı (${user})`
                : null;
    if (sorun) {
      uyarilar.push(`${n}. kutu kullanılmıyor: ${sorun}.`);
      continue;
    }
    gorulen.add(user);
    kutular.push({
      no: n,
      host: h,
      port: p,
      user,
      pass,
      ad: (env[`OUTREACH_FROM_NAME_${n}`] ?? "").trim() || ad,
      alan: user.split("@")[1],
    });
  }

  if (!kutular.length) eksik.push(...eksik1);
  else if (eksik1.length && user1) uyarilar.push(`1. kutu kullanılmıyor: ${eksik1.join(", ")}.`);

  const tavan = Math.trunc(Number(env.OUTREACH_DAILY_LIMIT)) || 20;
  const alanTavani = Math.trunc(Number(env.OUTREACH_DOMAIN_DAILY_LIMIT)) || 50;
  const aralik = Math.trunc(Number(env.OUTREACH_INTERVAL_SEC)) || 90;

  return {
    kutular,
    yanitAdresi: (env.OUTREACH_REPLY_TO ?? "").trim(),
    gizliKopya: (env.OUTREACH_BCC ?? "").trim(),
    gunlukTavan: Math.min(75, Math.max(1, tavan)),
    alanTavani: Math.min(300, Math.max(1, alanTavani)),
    aralikSn: Math.max(60, aralik),
    eksik,
    uyarilar,
  };
}

/* ---------------------------------------------------------- kutu seçimi */

/**
 * Alan adı ısınması — aynı alan adındaki kutuların TOPLAMI için. Yeni alan
 * adının itibarı kutularınkinden önce gelir: beş yeni kutu ilk gün 5 × 10
 * gönderirse alan adı ilk gününde 50 soğuk e-posta atmış olur.
 *   1. gün    → günde en çok 20
 *   2. gün    → günde en çok 70
 *   3-4. gün  → günde en çok 110
 *   5-6. gün  → günde en çok 180
 *   sonrası   → OUTREACH_DOMAIN_DAILY_LIMIT (varsayılan 50, üst sınır 300 —
 *               dört kutu × kutu tavanı 75).
 *
 * Bu üst sınırlar TAVSİYE değil, yazım hatasının aşamayacağı sınır: gerçek
 * sayıyı env veriyor. 25 Eylül 2026'da Yasin'in isteğiyle 50/200 → 75/300.
 * Dayanak: dört günde 241 gönderim, sıfır geri dönüş, sıfır şikâyet,
 * Postmaster Tools yeşil.
 *
 * İKİ UYARI, ikisi de ölçülmüş şeyler:
 *   1. Merdiven 4. günde env'e devrediyor; 110'dan 300'e BİR GÜNDE çıkmak
 *      2,7 katlık sıçrama demek. Süzgeçlerin tepki verdiği şey tam da bu.
 *   2. Kutular DOLU (bkz. kopyaSorunu). Dolu kutu alıcı sunucuların
 *      gönderen doğrulamasını düşürüyor; hacim arttıkça sessiz red artar.
 *
 * 2026-09-23'te hızlandırıldı. Gerekçe: servosteel.com.tr YENİ bir alan adı
 * değil — yıllardır gerçek yazışma yapıyor, SPF/DKIM/DMARC hizalı; ilk günün
 * 19 gönderiminin tamamı kabul edildi, geri dönüş ve şikâyet yok, BCC kopyası
 * Gelen kutusuna düştü. Yine de tek hamlede tavana çıkılmıyor: sağlayıcılar
 * hacmin EĞİMİNE bakıyor. Sinyal bozulursa (geri dönüş, Tanıtımlar/Spam'e
 * düşme) bu kademeler geri alınır — kararın dayanağı ölçüm, tahmin değil.
 */
export function alanIsinmaTavani(gun: number | null, tavan: number): { tavan: number; asama: string | null } {
  const g = gun ?? 0;
  if (g < 1) return { tavan: Math.min(tavan, 20), asama: `alan adı ısınması: ${g + 1}. gün` };
  if (g < 2) return { tavan: Math.min(tavan, 70), asama: `alan adı ısınması: ${g + 1}. gün` };
  if (g < 4) return { tavan: Math.min(tavan, 110), asama: `alan adı ısınması: ${g + 1}. gün` };
  /* ARA BASAMAK (Yasin, 25 Eylül 2026: "yarın 180 pazartesi 300"). Merdiven
     eskiden 4. günde doğrudan env'e devrediyordu; 110'dan 300'e bir günde
     çıkmak 2,7 katlık sıçrama demekti ve süzgeçlerin tepki verdiği şey tam
     olarak bu. İki gün 180'de durup sonra env'e geçiliyor:
       4-5. gün (26-27 Eylül) → 180
       6. günden (28 Eylül, pazartesi) → OUTREACH_DOMAIN_DAILY_LIMIT */
  if (g < 6) return { tavan: Math.min(tavan, 180), asama: `alan adı ısınması: ${g + 1}. gün` };
  return { tavan, asama: null };
}

/** Bir kutunun anlık durumu — veritabanından (bkz. kutuDurumlari). */
export type KutuDurumu = {
  /** Bugün bu kutudan giden (başarılı + belirsiz) */
  bugun: number;
  /** Bu kutunun ilk gönderiminden bu yana geçen İstanbul günü; hiç yoksa null */
  ilkGun: number | null;
  /** Son denemeden bu yana geçen saniye; hiç yoksa null */
  gecenSn: number | null;
  /** Sigorta atık mı (bitiş zamanı gelecekte) */
  durdu: boolean;
  durduBitis: string | null;
  durduSebep: string;
};

/** Alan adının bugünkü ve ilk gönderimi — o alan adındaki BÜTÜN kutular (eskiler dahil). */
export type AlanDurumu = { bugun: number; ilkGun: number | null };

export type KutuSatiri = {
  kutu: GonderenKutusu;
  /** Isınmayla birlikte bugünkü kutu tavanı */
  tavan: number;
  asama: string | null;
  alanTavani: number;
  alanAsamasi: string | null;
  durum: KutuDurumu;
  alanBugun: number;
  /** null = şimdi gönderebilir; değilse neden gönderemiyor */
  engel: string | null;
  /** Aralık bekleniyorsa kalan saniye */
  bekle: number | null;
};

export type KutuSecimi = {
  /** Her kutu, ekranda gösterilecek hâliyle */
  satirlar: KutuSatiri[];
  /** Şimdi gönderebilecek kutular — deneme sırasıyla (bugün en az göndereni önce) */
  uygun: GonderenKutusu[];
  /** Hiçbiri uygun değil ama biri aralık bekliyorsa: en kısa bekleme (sn) */
  bekle: number | null;
  /** Hiçbiri uygun değilse ve beklenecek bir şey yoksa: neden */
  sebep: string | null;
  /** Bugün hâlâ gönderilebilecek toplam (kutu ve alan adı tavanları birlikte) */
  kalan: number;
  /** Bugün gönderilebilecek toplam (bugün gidenler dahil) */
  gunlukKapasite: number;
};

const BOS_DURUM: KutuDurumu = {
  bugun: 0, ilkGun: null, gecenSn: null, durdu: false, durduBitis: null, durduSebep: "",
};

/**
 * Hangi kutudan gönderilecek? Sırayla: sigortası atık olan, kendi tavanı
 * dolan, alan adının toplam tavanı dolan kutu atlanır; aralığı dolmayan
 * "bekliyor" sayılır. Kalanlar bugün en az gönderenden başlayarak sıralanır —
 * yük kutulara eşit dağılsın, hiçbir kutu tek başına tavana dayanmasın.
 */
export function kutuSec(
  ayar: Pick<OutreachAyarlari, "kutular" | "gunlukTavan" | "alanTavani" | "aralikSn">,
  kutuDurum: Record<string, KutuDurumu | undefined>,
  alanDurum: Record<string, AlanDurumu | undefined>
): KutuSecimi {
  const satirlar: KutuSatiri[] = ayar.kutular.map((kutu) => {
    const durum = kutuDurum[kutu.user] ?? BOS_DURUM;
    const alan = alanDurum[kutu.alan] ?? { bugun: 0, ilkGun: null };
    const { tavan, asama } = isinmaTavani(durum.ilkGun, ayar.gunlukTavan);
    const ai = alanIsinmaTavani(alan.ilkGun, ayar.alanTavani);
    let engel: string | null = null;
    let bekle: number | null = null;
    if (durum.durdu) engel = `durdu: ${durum.durduSebep || "sigorta"}`;
    else if (durum.bugun >= tavan) engel = `kutunun bugünkü tavanı doldu (${durum.bugun}/${tavan})`;
    else if (alan.bugun >= ai.tavan) engel = `${kutu.alan} alan adının bugünkü tavanı doldu (${alan.bugun}/${ai.tavan})`;
    else if (durum.gecenSn !== null && durum.gecenSn < ayar.aralikSn) {
      bekle = Math.max(1, Math.ceil(ayar.aralikSn - durum.gecenSn));
      engel = `aralık: ${bekle} sn`;
    }
    return {
      kutu, tavan, asama, alanTavani: ai.tavan, alanAsamasi: ai.asama, durum, alanBugun: alan.bugun, engel, bekle,
    };
  });

  const uygun = satirlar
    .filter((s) => s.engel === null)
    .sort((a, b) => a.durum.bugun - b.durum.bugun || a.kutu.no - b.kutu.no)
    .map((s) => s.kutu);
  const bekleyen = satirlar.filter((s) => s.bekle !== null).map((s) => s.bekle as number);
  const bekle = uygun.length || !bekleyen.length ? null : Math.min(...bekleyen);

  /* Kapasite: her alan adında min(alan tavanı, o alandaki kutuların tavan toplamı).
     Sigortası atık kutu bugünün kapasitesinden düşer. */
  const alanlar = new Map<string, { alanTavani: number; alanBugun: number; kutuTavan: number; kutuKalan: number }>();
  for (const s of satirlar) {
    const a = alanlar.get(s.kutu.alan) ?? { alanTavani: s.alanTavani, alanBugun: s.alanBugun, kutuTavan: 0, kutuKalan: 0 };
    if (!s.durum.durdu) {
      a.kutuTavan += s.tavan;
      a.kutuKalan += Math.max(0, s.tavan - s.durum.bugun);
    }
    alanlar.set(s.kutu.alan, a);
  }
  let kalan = 0;
  let gunlukKapasite = 0;
  for (const a of alanlar.values()) {
    kalan += Math.max(0, Math.min(a.alanTavani - a.alanBugun, a.kutuKalan));
    gunlukKapasite += Math.min(a.alanTavani, a.kutuTavan);
  }

  let sebep: string | null = null;
  if (!uygun.length && bekle === null) {
    if (!satirlar.length) sebep = "Gönderen kutusu tanımlı değil.";
    else if (satirlar.every((s) => s.durum.durdu)) {
      /* Alan adı çapında atan sigorta her kutuda aynı sebeple durur — bir kez yazılır */
      const sebepler = [...new Set(satirlar.map((s) => s.durum.durduSebep || "sigorta"))];
      sebep = `Gönderim durdu (${satirlar.length} kutu) — ${sebepler.join(" · ")}`;
    } else {
      sebep = `Bugünkü tavan doldu (${satirlar.reduce((t, s) => t + s.durum.bugun, 0)} gönderildi). Yarın devam edilir.`;
    }
  }
  return { satirlar, uygun, bekle, sebep, kalan, gunlukKapasite };
}

/* ------------------------------------------------------ otomatik gönderim */

export type IstanbulSaati = { saat: number; dakika: number; /** 0 pazar … 6 cumartesi */ haftaGunu: number };

const GUNLER: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Verilen anın İstanbul'daki saati — sunucu UTC'de çalışıyor. */
export function istanbulSaati(t: Date): IstanbulSaati {
  const parca = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Istanbul",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    })
      .formatToParts(t)
      .map((p) => [p.type, p.value])
  );
  return { saat: Number(parca.hour), dakika: Number(parca.minute), haftaGunu: GUNLER[parca.weekday] ?? 1 };
}

/**
 * Otomatik gönderim şu an çalışabilir mi? Hafta içi (hafta sonu açık değilse)
 * ve [baslangic, bitis) saatleri arasında. `kalanDk`: pencerenin bitmesine kalan.
 */
export function otomatikPencere(
  t: IstanbulSaati,
  a: { baslangic: number; bitis: number; haftaSonu: boolean }
): { acik: boolean; sebep: string | null; kalanDk: number } {
  const dk = t.saat * 60 + t.dakika;
  const kalanDk = Math.max(0, a.bitis * 60 - dk);
  if (!a.haftaSonu && (t.haftaGunu === 0 || t.haftaGunu === 6)) return { acik: false, sebep: "hafta sonu", kalanDk };
  if (dk < a.baslangic * 60) return { acik: false, sebep: `saat ${a.baslangic}:00'da başlar`, kalanDk };
  if (dk >= a.bitis * 60) return { acik: false, sebep: `bugünkü pencere ${a.bitis}:00'da kapandı`, kalanDk: 0 };
  return { acik: true, sebep: null, kalanDk };
}

/**
 * Bir sonraki otomatik gönderime kaç saniye: kalan kapasite pencerenin kalanına
 * EŞİT yayılır (20 e-posta, 9 saat → ~27 dk), hiçbir zaman kutu aralığından
 * kısa değil. ±%25 oynatılır — dakikası dakikasına giden e-posta makine izi.
 * `rastgele` 0…1 (test için dışarıdan).
 */
export function sonrakiAralikSn(kalanDk: number, kalan: number, aralikSn: number, rastgele: number): number {
  const hedef = Math.max(aralikSn, (kalanDk * 60) / Math.max(1, kalan));
  return Math.round(hedef * (0.75 + Math.min(1, Math.max(0, rastgele)) * 0.5));
}

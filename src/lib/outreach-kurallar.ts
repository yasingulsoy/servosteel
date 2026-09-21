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

/** Gönderilebilen ama kuralları ülkeden ülkeye değişen AB ülkeleri — önizlemede uyarı çıkar. */
const AB_ULKELERI = new Set([
  "Belçika", "Bulgaristan", "Çekya", "Danimarka", "Estonya", "Finlandiya", "Fransa",
  "Hırvatistan", "Hollanda", "İrlanda", "İspanya", "İsveç", "İtalya", "Kıbrıs",
  "Letonya", "Litvanya", "Lüksemburg", "Macaristan", "Malta", "Polonya", "Portekiz",
  "Romanya", "Slovakya", "Slovenya", "Yunanistan",
]);

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

/* "relay" / "authenticat…": sunucu bizi göndermeye yetkili saymıyor — alıcının
   değil ayarın sorunu; alıcı hatası sayılsaydı her denemede bir firma yanlışlıkla
   "adres hatalı" olurdu. */
const POLITIKA =
  /rate|limit|exceed|quota|too many|throttl|spam|block|blacklist|listed|policy|reputation|abuse|suspend|frozen|disabled|relay|not permitted|authenticat/i;
const ALICI_YOK =
  /user unknown|unknown user|no such user|mailbox (is )?(unavailable|not found)|does not exist|invalid (recipient|address|mailbox)|recipient (address )?rejected|address rejected|5\.1\.\d/i;

function kisa(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, 240);
}

export function hataSiniflandir(h: SmtpHatasi): { tur: HataTuru; sebep: string } {
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
      sebep: "SMTP girişi reddedildi — OUTREACH_SMTP_USER / OUTREACH_SMTP_PASS kontrol edilmeli.",
    };
  }
  /* Kendi sunucumuzun 4xx'i: "şimdi değil" — hız sınırı ya da geçici engel.
     Üstüne gitmek hesabı kara listeye götürür. */
  if (kod >= 400 && kod < 500) {
    return { tur: "sigorta", sebep: `Sunucu geçici olarak reddetti (${kod}): ${metin}` };
  }
  if (POLITIKA.test(metin)) {
    return { tur: "sigorta", sebep: `Sunucu gönderimi sınırladı ya da engelledi: ${metin}` };
  }
  if (h.code === "EENVELOPE" || (kod >= 500 && (h.command === "RCPT TO" || ALICI_YOK.test(metin)))) {
    return { tur: "alici", sebep: `Alıcı adresi reddedildi${kod ? ` (${kod})` : ""}: ${metin}` };
  }
  return { tur: "hata", sebep: metin || h.code || "bilinmeyen hata" };
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
 * Isınma: yeni kutunun itibarı yok. Büyük sağlayıcılar (Gmail, Outlook) ilk
 * haftalarda gelen hacme bakıyor; sıfırdan günde 20-50'ye çıkan gönderici
 * "spam" sayılıyor. İlk gönderimden itibaren:
 *   0-6. gün  → günde en çok 10
 *   7-13. gün → günde en çok 15
 *   sonrası   → ayarlanan tavan (OUTREACH_DAILY_LIMIT, üst sınır 50)
 * `gun` = ilk başarılı gönderimden bu yana geçen İstanbul günü; hiç yoksa null.
 */
export function isinmaTavani(gun: number | null, tavan: number): { tavan: number; asama: string | null } {
  const g = gun ?? 0;
  if (g < 7) return { tavan: Math.min(tavan, 10), asama: `ısınma: 1. hafta, ${g + 1}. gün` };
  if (g < 14) return { tavan: Math.min(tavan, 15), asama: `ısınma: 2. hafta, ${g + 1}. gün` };
  return { tavan, asama: null };
}

/**
 * Geri dönüş eşiği. Geri dönen e-posta (bounce) gönderene gelir; panel onu
 * okuyamaz, firmayı "Adres hatalı" işaretlemek elle. Son 50 gönderimde
 * hatalı oranı %10'u (en az 3 firma) geçerse liste kirlidir: devam etmek
 * sağlayıcıların gözünde "adres toplayıp yazan" göndericiye çevirir.
 */
export function geriDonusEngeli(toplam: number, hatali: number): string | null {
  if (hatali >= 3 && toplam > 0 && hatali / toplam >= 0.1) {
    return `Son ${toplam} gönderimin ${hatali}'i geri döndü (%${Math.round((hatali / toplam) * 100)}). Geri dönen adresler temizlenmeden ve sebebi anlaşılmadan gönderime devam edilmez.`;
  }
  return null;
}

/* ------------------------------------------------------------ ayarlar */

export type OutreachAyarlari = {
  host: string;
  port: number;
  user: string;
  pass: string;
  gondericiAdi: string;
  yanitAdresi: string;
  gizliKopya: string;
  gunlukTavan: number;
  aralikSn: number;
  /** Boşsa gönderime hazır. */
  eksik: string[];
};

/**
 * Gönderim ayarları — ortam değişkenlerinden.
 *
 * Kutu ve parola AYRI (`OUTREACH_SMTP_USER`/`_PASS`): form bildirimleri
 * `SMTP_USER` (website@) kutusundan gidiyor ve o kutu talebin tek kanalı.
 * Tanıtım e-postası yüzünden bir hız sınırı ya da engel yenirse talep
 * bildirimleri etkilenmemeli; aynı kutu verilirse gönderim açılmaz.
 * Sunucu ve port aynı olabilir; verilmezse formunkiler kullanılır.
 *
 * Tavan ve aralığın sınırı KODDA: yeni kutunun itibarı yok, günde 50'nin
 * üstü ya da dakikada birden sık gönderim paylaşımlı sunucuda kara listeye
 * giden yol.
 */
export function ayarlariOku(env: Record<string, string | undefined>): OutreachAyarlari {
  const host = (env.OUTREACH_SMTP_HOST ?? env.SMTP_HOST ?? "").trim();
  const port = Number(env.OUTREACH_SMTP_PORT ?? env.SMTP_PORT ?? 465) || 465;
  const user = (env.OUTREACH_SMTP_USER ?? "").trim();
  const pass = env.OUTREACH_SMTP_PASS ?? "";
  const formKutusu = (env.SMTP_USER ?? "").trim().toLowerCase();

  const eksik: string[] = [];
  if (!host) eksik.push("OUTREACH_SMTP_HOST");
  if (!user) eksik.push("OUTREACH_SMTP_USER");
  if (!pass) eksik.push("OUTREACH_SMTP_PASS");
  if (user && formKutusu && user.toLowerCase() === formKutusu) {
    eksik.push("OUTREACH_SMTP_USER form bildirim kutusuyla (SMTP_USER) aynı — ayrı bir kutu gerekli");
  }

  const tavan = Math.trunc(Number(env.OUTREACH_DAILY_LIMIT)) || 20;
  const aralik = Math.trunc(Number(env.OUTREACH_INTERVAL_SEC)) || 90;

  return {
    host,
    port,
    user,
    pass,
    gondericiAdi: (env.OUTREACH_FROM_NAME ?? "").trim() || "Servosteel",
    yanitAdresi: (env.OUTREACH_REPLY_TO ?? "").trim(),
    gizliKopya: (env.OUTREACH_BCC ?? "").trim(),
    gunlukTavan: Math.min(50, Math.max(1, tavan)),
    aralikSn: Math.max(60, aralik),
    eksik,
  };
}

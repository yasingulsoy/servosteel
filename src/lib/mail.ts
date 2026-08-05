import "server-only";
import nodemailer from "nodemailer";

/**
 * Form taleplerini firmanın KENDİ cPanel SMTP'si üzerinden gönderir.
 *
 * Neden üçüncü parti (Resend vb.) değil: mail zaten firmanın alan adından
 * firmanın kendi kutusuna gidiyor. Kendi sunucusundan gönderince SPF ve DKIM
 * doğal olarak hizalı kalıyor, ek DNS kaydı gerekmiyor ve talep verisi dışarı
 * çıkmıyor.
 *
 * Değişkenler `NEXT_PUBLIC_` DEĞİL: sunucuda istek anında okunuyorlar, derlemeye
 * gömülmüyorlar. Şifre tarayıcıya asla ulaşmaz.
 */

export type LeadKind = "rfq" | "contact";

export type Lead = {
  kind: LeadKind;
  locale: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  location?: string;
  product?: string;
  specs?: string;
  subject?: string;
  message?: string;
};

/** Eksik yapılandırmayı sessizce yutma — form "gönderildi" deyip mail gitmesin. */
function config() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const to = process.env.MAIL_TO?.trim();
  const port = Number(process.env.SMTP_PORT ?? 465);

  const missing = [
    !host && "SMTP_HOST",
    !user && "SMTP_USER",
    !pass && "SMTP_PASS",
    !to && "MAIL_TO",
  ].filter(Boolean);

  if (missing.length) throw new Error(`Eksik ortam değişkeni: ${missing.join(", ")}`);
  return { host: host!, user: user!, pass: pass!, to: to!, port };
}

/* Alıcı firma personeli; gövde onların dilinde yazılır, ziyaretçinin dilinde değil.
   Ziyaretçinin dili ayrı satır olarak geçer ki hangi dilde yanıtlanacağı bilinsin. */
const LABEL: Record<string, string> = {
  name: "Ad Soyad",
  company: "Firma",
  email: "E-posta",
  phone: "Telefon",
  location: "Ülke / Şehir",
  product: "İlgilenilen ürün",
  specs: "Teknik not",
  subject: "Konu",
  message: "Mesaj",
  locale: "Sitedeki dili",
};

function body(lead: Lead): string {
  const order: (keyof Lead)[] = [
    "name", "company", "email", "phone", "location",
    "product", "specs", "subject", "locale",
  ];
  const lines = order
    .filter((k) => lead[k])
    .map((k) => `${LABEL[k]}: ${lead[k]}`);

  if (lead.message?.trim()) lines.push("", `${LABEL.message}:`, lead.message.trim());
  return lines.join("\n");
}

export async function sendLead(lead: Lead): Promise<void> {
  const cfg = config();

  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465, // 465 baştan TLS, 587 STARTTLS ile yükseltir
    auth: { user: cfg.user, pass: cfg.pass },
  });

  const heading = lead.kind === "rfq" ? "Teklif talebi" : "İletişim formu";
  const subject = lead.product
    ? `${heading} — ${lead.product}`
    : `${heading}${lead.subject ? ` — ${lead.subject}` : ""}`;

  await transport.sendMail({
    from: `"Servosteel Web" <${cfg.user}>`, // SPF/DKIM hizası için kendi adresimiz
    to: cfg.to,
    replyTo: `"${lead.name}" <${lead.email}>`, // "Yanıtla" doğrudan müşteriye gitsin
    subject,
    text: body(lead),
  });
}

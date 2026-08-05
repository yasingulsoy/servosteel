import { NextResponse } from "next/server";
import { sendLead, type Lead } from "@/lib/mail";

/**
 * Form taleplerini alır ve e-posta olarak gönderir.
 *
 * Buraya kadar formlar `mailto:` ile çalışıyordu. Sorun ölçüm değil kayıptı:
 * masaüstünde tarayıcıdan webmail kullanan biri "gönder"e bastığında çoğu kez
 * hiçbir şey olmuyor — yapılandırılmış bir e-posta istemcisi yok. Ziyaretçi
 * formu doldurmuş, gönderdiğini sanmış, talep hiç var olmamış oluyordu.
 */

export const runtime = "nodejs"; // nodemailer TCP soket açar, edge'de çalışmaz

/* Basit hız sınırı: aynı IP dakikada 3 talep. Sunucu belleğinde tutulur —
   tek konteynerli kurulumda yeterli, Redis kurmaya değmez. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // bellek tavanı
  return recent.length > MAX_PER_WINDOW;
}

const str = (v: unknown, max = 2000) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "bilinmiyor";

  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "json" }, { status: 400 });
  }

  /* Bal küpü: gerçek kullanıcı bu alanı göremez, bot doldurur. Bota "başarılı"
     denir ki tekrar denemesin, ama mail gönderilmez. */
  if (str(raw.website)) return NextResponse.json({ ok: true });

  const lead: Lead = {
    kind: raw.kind === "rfq" ? "rfq" : "contact",
    locale: str(raw.locale, 8) || "tr",
    name: str(raw.name, 120),
    email: str(raw.email, 160),
    company: str(raw.company, 160),
    phone: str(raw.phone, 60),
    location: str(raw.location, 120),
    product: str(raw.product, 200),
    specs: str(raw.specs, 400),
    subject: str(raw.subject, 200),
    message: str(raw.message, 4000),
  };

  if (!lead.name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) {
    return NextResponse.json({ ok: false, error: "gecersiz" }, { status: 400 });
  }

  try {
    await sendLead(lead);
    return NextResponse.json({ ok: true });
  } catch (err) {
    /* Sunucu günlüğüne yaz, ziyaretçiye ayrıntı verme. Bu satır önemli:
       SMTP bilgisi eksik/yanlışsa sessizce kaybolmasın, günlükte görünsün. */
    console.error("[talep] gönderilemedi:", err);
    return NextResponse.json({ ok: false, error: "gonderim" }, { status: 500 });
  }
}

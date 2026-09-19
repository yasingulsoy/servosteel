import { NextResponse } from "next/server";
import { sendLead, type Lead } from "@/lib/mail";
import { talepEkle } from "@/lib/leads-db";

/**
 * Form taleplerini alır ve e-posta olarak gönderir.
 *
 * Buraya kadar formlar `mailto:` ile çalışıyordu. Sorun ölçüm değil kayıptı:
 * masaüstünde tarayıcıdan webmail kullanan biri "gönder"e bastığında çoğu kez
 * hiçbir şey olmuyor — yapılandırılmış bir e-posta istemcisi yok. Ziyaretçi
 * formu doldurmuş, gönderdiğini sanmış, talep hiç var olmamış oluyordu.
 *
 * İÇERİK SPAM SÜZGECİ YOK — bilerek (2026-09-19, Yasin: "spam gelsin, talep
 * gelsin"). 15 Eylül'de eklenen puanlama süzgeci kaldırıldı: bir gerçek talebi
 * kaçırmanın bedeli, gelen kutusundaki birkaç çöp mailden çok daha yüksek.
 * Çöp, admin panelinde "Spam" olarak işaretlenir; gerçek talep sayısından
 * düşülür. Kalan iki koruma insanı hiç engellemez: görünmez bal küpü alanı
 * (yalnızca bot doldurur) ve IP başına dakikada 3 gönderim.
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

  /* Bal küpü: gerçek kullanıcı bu alanı göremez (display:none — tarayıcının
     otomatik doldurması da görünmez alana dokunmaz), bot doldurur. Bota
     "başarılı" denir ki tekrar denemesin, ama mail gönderilmez. Günlüğe yazılır
     ki kaç gönderimin burada kaldığı sayılabilsin. */
  if (str(raw.website)) {
    console.warn(`[talep] bal küpü dolu, gönderilmedi — ${str(raw.email, 160)}`);
    return NextResponse.json({ ok: true });
  }

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

  /* `talepEkle` hata fırlatmaz (içeride yutuyor) — kayıt hiçbir yolu bozamaz. */
  const kaydet = (kaynak: string) =>
    talepEkle({
      tur: lead.kind,
      dil: lead.locale,
      ad: lead.name ?? "",
      eposta: lead.email ?? "",
      firma: lead.company ?? "",
      telefon: lead.phone ?? "",
      ulke: lead.location ?? "",
      mesaj: [lead.subject, lead.product, lead.specs, lead.message]
        .filter(Boolean)
        .join("\n\n"),
      sayfa: req.headers.get("referer") ?? "",
      kaynak,
    });

  try {
    await sendLead(lead);
  } catch (err) {
    /* Mail gitmedi. 2026-09-19'a kadar talep burada TAMAMEN kayboluyordu:
       veritabanına yalnızca başarılı mailden sonra yazılıyordu, geriye tek
       iz sunucu günlüğündeki bu satır kalıyordu. Artık panele "mail gitmedi"
       işaretiyle yazılıyor — SMTP şifresi değişse ya da alıcı kutu kotayı
       doldursa bile talep elde kalır. Ziyaretçiye yine hata dönülür ("bizi
       arayın"): firmaya bildirim ulaşmadı, aramaktan vazgeçmesin. */
    console.error("[talep] gönderilemedi:", err);
    await kaydet("form-mail-gitmedi");
    return NextResponse.json({ ok: false, error: "gonderim" }, { status: 500 });
  }

  /* Başarılı yolda kayıt mailden SONRA. Sıra bilinçli: **e-posta aslıdır,
     veritabanı kopyadır.** Postgres düşerse talep yine de firmaya ulaşır. */
  await kaydet("form");
  return NextResponse.json({ ok: true });
}

import type { NextRequest } from "next/server";
import { engelle, engelliMi, iptalBul, outreachSemaKur } from "@/lib/outreach-db";
import { IPTAL_SAYFASI, epostaDili, maskele } from "@/lib/outreach-kurallar";

/**
 * Tanıtım e-postalarındaki "abonelikten çık" bağlantısı.
 *
 * GET bir ONAY sayfası gösterir, çıkarmaz. Kurumsal e-posta güvenlik
 * tarayıcıları (Safe Links, Mimecast…) postadaki her bağlantıyı açıp
 * bakıyor; GET çıkarsaydı alıcı e-postayı okumadan listeden düşerdi.
 * Çıkarma POST ile: ya sayfadaki düğmeden ya da Gmail/Outlook'un "abonelikten
 * çık" tuşundan (RFC 8058 tek tık — `List-Unsubscribe-Post` başlığı).
 *
 * Bağlantıdaki anahtar firmaya özel, tahmin edilemez (16 bayt rastgele).
 * Sayfa adresi AÇIK YAZMAZ, maskeler: bağlantı yönlendirilmiş bir postada
 * başkasının eline geçebilir.
 *
 * Panelin dışında, `api/` altında: proxy.ts `api`'yi dil yönlendirmesinden
 * muaf tutuyor, alıcı hangi dilde olursa olsun adres tek.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Herkese açık uç: dakikada IP başına 30 istek. Anahtar tahmin edilemese de
   denemeyi ucuz bırakmıyoruz. */
const PENCERE_MS = 60_000;
const AZAMI = 30;
const vurus = new Map<string, number[]>();

function sinirAsildi(ip: string): boolean {
  const simdi = Date.now();
  const son = (vurus.get(ip) ?? []).filter((t) => simdi - t < PENCERE_MS);
  son.push(simdi);
  vurus.set(ip, son);
  if (vurus.size > 5000) vurus.clear();
  return son.length > AZAMI;
}

function kacir(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function sayfa(dil: string, baslik: string, icerik: string, durum = 200): Response {
  const html = `<!doctype html>
<html lang="${kacir(dil)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${kacir(baslik)} · Servosteel</title>
<style>
  :root { color-scheme: light dark; --z: #f4f4f5; --k: #fff; --y: #18181b; --s: #52525b; --c: #e4e4e7; --v: #facc15; }
  @media (prefers-color-scheme: dark) { :root { --z: #09090b; --k: #18181b; --y: #fafafa; --s: #a1a1aa; --c: #27272a; } }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
         background: var(--z); color: var(--y); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { width: 100%; max-width: 440px; background: var(--k); border: 1px solid var(--c);
         border-radius: 16px; padding: 28px 24px; }
  .m { margin: 0 0 18px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; font-size: 14px; }
  h1 { margin: 0 0 10px; font-size: 22px; line-height: 1.25; }
  p { margin: 0; color: var(--s); overflow-wrap: anywhere; }
  button { margin-top: 20px; width: 100%; border: 0; border-radius: 10px; padding: 12px 16px;
           background: var(--v); color: #09090b; font: inherit; font-weight: 700; cursor: pointer; }
</style>
</head>
<body><main><p class="m">Servosteel</p><h1>${kacir(baslik)}</h1>${icerik}</main></body>
</html>`;
  return new Response(html, {
    status: durum,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function istemciIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "bilinmiyor"
  );
}

async function coz(req: NextRequest) {
  const anahtar = req.nextUrl.searchParams.get("t") ?? "";
  if (!(await outreachSemaKur())) return { anahtar, kayit: null };
  return { anahtar, kayit: await iptalBul(anahtar) };
}

const cokFazla = () => sayfa("en", "Too many requests", "<p>Please try again in a minute.</p>", 429);

export async function GET(req: NextRequest) {
  if (sinirAsildi(istemciIp(req))) return cokFazla();
  const { anahtar, kayit } = await coz(req);
  if (!kayit) {
    const m = IPTAL_SAYFASI.en;
    return sayfa("en", m.baslik, `<p>${kacir(m.gecersiz)}</p>`, 404);
  }
  const dil = epostaDili(kayit.dil);
  const m = IPTAL_SAYFASI[dil];
  const adres = kacir(maskele(kayit.eposta));

  /* Daha önce çıktıysa soru sormadan sonucu göster. */
  if (await engelliMi(kayit.eposta)) {
    return sayfa(dil, m.baslik, `<p>${kacir(m.tamam).replace("{eposta}", adres)}</p>`);
  }
  return sayfa(
    dil,
    m.baslik,
    `<p>${kacir(m.soru).replace("{eposta}", adres)}</p>
<form method="post" action="/api/unsubscribe?t=${encodeURIComponent(anahtar)}">
<button type="submit">${kacir(m.dugme)}</button>
</form>`
  );
}

/** Onay düğmesi ve RFC 8058 tek tık ("List-Unsubscribe=One-Click" gövdesiyle) aynı yere gelir. */
export async function POST(req: NextRequest) {
  if (sinirAsildi(istemciIp(req))) return cokFazla();
  const { kayit } = await coz(req);
  if (!kayit) {
    const m = IPTAL_SAYFASI.en;
    return sayfa("en", m.baslik, `<p>${kacir(m.gecersiz)}</p>`, 404);
  }
  await engelle(kayit.eposta, "abonelik bağlantısı");
  const dil = epostaDili(kayit.dil);
  const m = IPTAL_SAYFASI[dil];
  return sayfa(dil, m.baslik, `<p>${kacir(m.tamam).replace("{eposta}", kacir(maskele(kayit.eposta)))}</p>`);
}

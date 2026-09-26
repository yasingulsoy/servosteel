import "server-only";
import { createSign } from "node:crypto";

/**
 * Search Console'dan haftalık sayı — pazartesi özetinin "Google araması"
 * bölümü için. İSTEĞE BAĞLI: sunucuda GSC_HIZMET_HESABI yoksa `null` döner
 * ve özet o bölüm olmadan gider.
 *
 * GSC_HIZMET_HESABI: Search Console'a kullanıcı olarak eklenmiş bir Google
 * servis hesabının JSON anahtarı — düz JSON ya da (ortam değişkeni tek satır
 * olsun diye) base64. Yalnızca OKUMA izni istenir (webmasters.readonly).
 * Paket eklemeden: JWT'yi Node'un kendi RSA imzasıyla kurup Google'dan
 * erişim anahtarı alıyor.
 *
 * Google verisi 1-2 gün gecikmeli; `dataState: "all"` taze (kesinleşmemiş)
 * günleri de katıyor — pazartesi sabahı pazar günü de görünsün.
 */

type Hesap = { client_email: string; private_key: string };

function hesapOku(): Hesap | null {
  const ham = process.env.GSC_HIZMET_HESABI?.trim();
  if (!ham) return null;
  try {
    const j = JSON.parse(ham.startsWith("{") ? ham : Buffer.from(ham, "base64").toString("utf8"));
    if (typeof j.client_email === "string" && typeof j.private_key === "string") {
      return { client_email: j.client_email, private_key: j.private_key };
    }
  } catch {
    /* bozuk değer: bağlı değil sayılır */
  }
  return null;
}

export const gscBagli = () => hesapOku() !== null;

const b64url = (b: Buffer | string) =>
  Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

async function erisimAnahtari(h: Hesap): Promise<string> {
  const simdi = Math.floor(Date.now() / 1000);
  const govde = [
    b64url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    b64url(
      JSON.stringify({
        iss: h.client_email,
        scope: "https://www.googleapis.com/auth/webmasters.readonly",
        aud: "https://oauth2.googleapis.com/token",
        iat: simdi,
        exp: simdi + 3600,
      })
    ),
  ].join(".");
  const imza = createSign("RSA-SHA256").update(govde).sign(h.private_key);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${govde}.${b64url(imza)}`,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const j = (await r.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!r.ok || !j.access_token) throw new Error(`Google girişi olmadı: ${j.error_description || j.error || r.status}`);
  return j.access_token;
}

type Satir = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };

export type GscToplam = { tiklama: number; gosterim: number; ctr: number; sira: number };
export type GscHaftasi = {
  bu: GscToplam;
  once: GscToplam;
  sorgular: { sorgu: string; tiklama: number; gosterim: number; sira: number }[];
};

/** [bas, son] ve önceki dönem için toplamlar + en çok tıklanan 5 arama. Tarihler 'YYYY-MM-DD'. */
export async function gscHaftasi(
  bas: string,
  son: string,
  onceBas: string,
  onceSon: string
): Promise<GscHaftasi | { hata: string } | null> {
  const h = hesapOku();
  if (!h) return null;
  const mulk = process.env.GSC_MULK?.trim() || "sc-domain:servosteel.com.tr";
  try {
    const anahtar = await erisimAnahtari(h);
    const sor = async (govde: object): Promise<Satir[]> => {
      const r = await fetch(
        `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(mulk)}/searchAnalytics/query`,
        {
          method: "POST",
          headers: { authorization: `Bearer ${anahtar}`, "content-type": "application/json" },
          body: JSON.stringify({ dataState: "all", ...govde }),
          signal: AbortSignal.timeout(20_000),
        }
      );
      const j = (await r.json().catch(() => ({}))) as { rows?: Satir[]; error?: { message?: string } };
      if (!r.ok) throw new Error(`Search Console: ${j.error?.message || r.status}`);
      return j.rows ?? [];
    };
    const toplam = (x: Satir | undefined): GscToplam =>
      x ? { tiklama: x.clicks, gosterim: x.impressions, ctr: x.ctr, sira: x.position } : { tiklama: 0, gosterim: 0, ctr: 0, sira: 0 };
    const [bu, once, sorgular] = await Promise.all([
      sor({ startDate: bas, endDate: son }),
      sor({ startDate: onceBas, endDate: onceSon }),
      sor({ startDate: bas, endDate: son, dimensions: ["query"], rowLimit: 5 }),
    ]);
    return {
      bu: toplam(bu[0]),
      once: toplam(once[0]),
      sorgular: sorgular.map((x) => ({ sorgu: x.keys?.[0] ?? "", tiklama: x.clicks, gosterim: x.impressions, sira: x.position })),
    };
  } catch (e) {
    return { hata: (e as Error).message.slice(0, 200) };
  }
}

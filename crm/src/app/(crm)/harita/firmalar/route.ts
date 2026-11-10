import { ulkeFirmalari } from "@/lib/harita";
import { oturum } from "@/lib/oturum";

/**
 * Haritada seçilen ülkenin (ya da şehrin) firmaları — yalnız oturumla.
 * ?ulke=Polonya            bütün ülke
 * ?ulke=Polonya&sehir=Kraków  o şehir
 * ?ulke=Polonya&sehir=        şehri bilinmeyenler
 */
export async function GET(istek: Request) {
  if (!(await oturum())) return new Response("Giriş gerekli", { status: 401 });
  const p = new URL(istek.url).searchParams;
  const ulke = p.get("ulke")?.trim().slice(0, 80);
  const sehir = p.has("sehir") ? (p.get("sehir") ?? "").trim().slice(0, 120) : null;
  const firmalar = ulke ? await ulkeFirmalari(ulke, sehir) : [];
  return Response.json(firmalar, { headers: { "Cache-Control": "private, no-store" } });
}

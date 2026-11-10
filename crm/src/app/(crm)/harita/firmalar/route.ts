import { ulkeFirmalari } from "@/lib/harita";
import { oturum } from "@/lib/oturum";

/** Haritada seçilen ülkenin firmaları — yalnız oturumla. */
export async function GET(istek: Request) {
  if (!(await oturum())) return new Response("Giriş gerekli", { status: 401 });
  const ulke = new URL(istek.url).searchParams.get("ulke")?.trim().slice(0, 80);
  const firmalar = ulke ? await ulkeFirmalari(ulke) : [];
  return Response.json(firmalar, { headers: { "Cache-Control": "private, no-store" } });
}

import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { otomatikTur } from "@/lib/otomatik-gonderim";

/**
 * Otomatik gönderimin dakikalık turu. YALNIZCA sunucunun kendisi çağırır:
 * src/instrumentation.ts açılışta rastgele bir anahtar üretip globalThis'e
 * koyar ve bu adrese o anahtarla istek atar. Anahtarı bilmeyen her istek 404
 * görür — dışarıdan tetiklenemez, var olduğu bile söylenmez.
 */
export const dynamic = "force-dynamic";

const yok = () => new NextResponse("Not Found", { status: 404 });

export async function POST(istek: NextRequest) {
  const beklenen = (globalThis as { __servosteelOtomatik?: string }).__servosteelOtomatik ?? "";
  const gelen = istek.headers.get("x-otomatik") ?? "";
  if (!beklenen || gelen.length !== beklenen.length) return yok();
  if (!timingSafeEqual(Buffer.from(gelen), Buffer.from(beklenen))) return yok();
  const sonuc = await otomatikTur();
  return NextResponse.json(sonuc);
}

export function GET() {
  return yok();
}

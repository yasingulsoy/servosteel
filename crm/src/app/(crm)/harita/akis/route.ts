import { haritaAkisi } from "@/lib/harita";
import { oturum } from "@/lib/oturum";

/** Haritanın canlı akışı: ?son=<ISO> sonrasında giden mailler ve gelen yanıtlar. */
export async function GET(istek: Request) {
  if (!(await oturum())) return new Response("Giriş gerekli", { status: 401 });
  const son = new URL(istek.url).searchParams.get("son") ?? undefined;
  if (!son) return Response.json([]);
  return Response.json(await haritaAkisi(son), { headers: { "Cache-Control": "private, no-store" } });
}

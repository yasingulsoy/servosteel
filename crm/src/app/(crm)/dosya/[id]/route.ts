import { sayi } from "@/lib/bicim";
import { tek } from "@/lib/db";
import { oturum } from "@/lib/oturum";

/**
 * Dosya indirme — yalnız oturumla. Dosyaların herkese açık adresi yok.
 *
 * Yalnız PDF tarayıcıda açılır; diğer her tür indirilir. Yüklenen dosyanın
 * türünü yükleyen belirler, HTML ya da SVG sayfa içinde açılsaydı CRM'in
 * kendi adresinde betik çalıştırabilirdi.
 */
export async function GET(_istek: Request, ctx: RouteContext<"/dosya/[id]">) {
  if (!(await oturum())) return new Response("Giriş gerekli", { status: 401 });
  const id = sayi((await ctx.params).id);
  const d = id
    ? await tek<{ ad: string; tur: string; icerik: Buffer }>(`SELECT ad, tur, icerik FROM crm_dosya WHERE id = $1`, [id])
    : null;
  if (!d) return new Response("Bulunamadı", { status: 404 });
  const pdf = d.tur === "application/pdf";
  return new Response(new Uint8Array(d.icerik), {
    headers: {
      "Content-Type": pdf ? "application/pdf" : "application/octet-stream",
      "Content-Disposition": `${pdf ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(d.ad)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

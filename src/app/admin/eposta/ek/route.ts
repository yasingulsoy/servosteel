import { NextResponse, type NextRequest } from "next/server";
import { oturum } from "@/lib/admin-auth";
import { ekAkisi, type Klasor } from "@/lib/posta";
import { ONIZLENEBILIR, icerikYerlesimi } from "@/lib/posta-bicim";

/**
 * E-posta ekini aç / indir — okuyucudaki bağlantılar buraya gelir:
 *   /admin/eposta/ek?kutu=…&klasor=gelen&uid=5&parca=2[&goster=1]
 *
 * Yalnızca panel oturumuyla. Ek kutudan AKITILIR (bellekte biriktirilmez).
 *
 * GÜVENLİK: ek, dışarıdan gelen içerik ve panelin kendi adresinden sunuluyor.
 * Tarayıcıda açılan bir HTML/SVG ek betik çalıştırıp panel adına istek
 * atabilirdi. Bu yüzden:
 *   - yalnızca ONIZLENEBILIR türler (görsel, PDF, düz metin) tarayıcıda
 *     açılır, gerisi HER ZAMAN indirilir (Content-Disposition: attachment,
 *     tür application/octet-stream);
 *   - nosniff: tarayıcı türü tahmin edip HTML sanmaz;
 *   - PDF dışında CSP sandbox: açılan içerik betik çalıştıramaz, panelle
 *     aynı köken sayılmaz. (Tarayıcının PDF görüntüleyicisi sandbox'ta
 *     açılmıyor; PDF'in kendi betikleri zaten görüntüleyicinin içinde kalır.)
 */
export const dynamic = "force-dynamic";

export async function GET(istek: NextRequest) {
  if (!(await oturum())) return new NextResponse("Oturum yok — panele giriş yapın.", { status: 401 });

  const sp = istek.nextUrl.searchParams;
  const klasor: Klasor = (sp.get("klasor") ?? "").slice(0, 200) || "gelen";
  const r = await ekAkisi(sp.get("kutu") ?? "", klasor, Math.floor(Number(sp.get("uid"))), sp.get("parca") ?? "");
  if (!r.tamam) return new NextResponse(r.hata, { status: r.durum, headers: { "Content-Type": "text/plain; charset=utf-8" } });

  const guvenli = ONIZLENEBILIR.has(r.ek.tur);
  const ac = guvenli && sp.get("goster") === "1";
  const basliklar: Record<string, string> = {
    "Content-Type": guvenli ? (r.ek.tur === "text/plain" ? "text/plain; charset=utf-8" : r.ek.tur) : "application/octet-stream",
    "Content-Disposition": icerikYerlesimi(r.ek.ad, ac),
    "X-Content-Type-Options": "nosniff",
    /* UID + parça bir kez yazılır, değişmez: tarayıcı 10 dk tutsun — okuyucudaki
       küçük görseller her gezinmede kutuya yeniden bağlanmasın. Yalnızca bu
       tarayıcı (private), ara sunucu değil. */
    "Cache-Control": "private, max-age=600",
    "Referrer-Policy": "no-referrer",
  };
  if (r.ek.tur !== "application/pdf") {
    basliklar["Content-Security-Policy"] = "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'";
  }
  return new NextResponse(r.akis, { headers: basliklar });
}

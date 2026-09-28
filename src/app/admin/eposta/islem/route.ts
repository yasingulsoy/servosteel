import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { oturum } from "@/lib/admin-auth";
import { gelenIletileriIsle } from "@/lib/gelen-tarama";
import { ayarlariOku } from "@/lib/outreach-kurallar";
import { kayitEkle } from "@/lib/panel-kayit";
import { ILETI_ISLEMLERI, iletiIslemi, type IletiIslemi } from "@/lib/posta";

/**
 * E-posta istemcisinin araç çubuğu — okundu/okunmadı, bayrak, arşivle,
 * önemsiz, sil (Silinmiş'e taşır), geri al, taşı. JSON POST; okuyucudaki
 * düğmeler (islemler.tsx) çağırır.
 *
 * Gönderim ucu gibi: önce oturum, Origin bu siteden değilse ret. Taşıyan
 * işlemler (sil dahil) panel kaydına düşer — kimin hangi iletiyi nereye
 * kaldırdığı görünsün; okundu/bayrak işaretleri kayda yazılmaz (gürültü).
 *
 * Gelen'den taşımadan ÖNCE ileti taramadan geçer: tarama yalnızca Gelen'e
 * bakıyor, taranmadan arşivlenen yanıt firmaya işlenmezdi.
 */
const GELENDEN_TASIYAN = new Set<IletiIslemi>(["arsivle", "onemsiz", "sil", "tasi"]);

export const dynamic = "force-dynamic";

const cevap = (tamam: boolean, mesaj: string, ek: Record<string, unknown> = {}, status = 200) =>
  NextResponse.json({ tamam, mesaj, ...ek }, { status });

export async function POST(istek: NextRequest) {
  const ben = await oturum();
  if (!ben) return cevap(false, "Oturum kapanmış — sayfayı yenileyip yeniden giriş yapın.", {}, 401);
  const koken = istek.headers.get("origin");
  if (koken && new URL(koken).host !== istek.headers.get("host")) return cevap(false, "Geçersiz istek.", {}, 403);

  let g: Record<string, unknown>;
  try {
    g = await istek.json();
  } catch {
    return cevap(false, "İstek okunamadı.", {}, 400);
  }
  const yazi = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
  const islem = yazi(g.islem, 20) as IletiIslemi;
  if (!(ILETI_ISLEMLERI as readonly string[]).includes(islem)) return cevap(false, "Bilinmeyen işlem.", {}, 400);
  const uidler = (Array.isArray(g.uidler) ? g.uidler : []).map((u) => Math.floor(Number(u))).filter((u) => u > 0);

  const kutu = yazi(g.kutu, 254).trim().toLowerCase();
  const klasor = yazi(g.klasor, 200) || "gelen";
  if (klasor === "gelen" && GELENDEN_TASIYAN.has(islem)) {
    await gelenIletileriIsle(ayarlariOku(process.env), kutu, uidler).catch(() => 0);
  }
  const r = await iletiIslemi(kutu, klasor, uidler, islem, yazi(g.hedef, 200) || undefined);
  if (!r.tamam) return cevap(false, r.hata);

  if (r.tasindi) {
    await kayitEkle(ben, "eposta_islem", kutu, `${klasor} · ${uidler.length} ileti — ${r.mesaj}`).catch(() => {});
  }
  revalidatePath("/admin/eposta");
  return cevap(true, r.mesaj, { tasindi: r.tasindi });
}

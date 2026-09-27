import { NextResponse } from "next/server";
import { olayEkle } from "@/lib/leads-db";

/**
 * Telefon / e-posta tuşu tıklamalarını kendi veritabanımıza yazar.
 *
 * NEDEN GA4 YETMİYOR: GA4 rakamı veriyor ama sorguyu her seferinde API'den
 * çekmek gerekiyor, veri 1-2 gün gecikiyor ve panelde talebin yanında
 * gösterilemiyor. Burada tutulunca "bu ay kaç kişi aradı" paneldeki tek
 * bakışta görünüyor. GA4 kaydı da duruyor — ikisi birbirini doğruluyor.
 *
 * KİŞİSEL VERİ YAZILMAZ. Yalnızca olay türü, yol ve dil. IP, çerez, kullanıcı
 * kimliği yok — bu uç noktanın KVKK açısından ek bir yükümlülük doğurmaması
 * için bilerek böyle. Tanıtım e-postası ziyaretinde bir de sayfa açılışının
 * rastgele kimliği (`gorunum`) ve "sayfada hareket oldu mu" bilgisi geliyor;
 * kimlik her açılışta yeniden üretiliyor, kişiyi ya da cihazı tanımıyor.
 */

export const runtime = "nodejs";

/* Herkese açık bir yazma ucu: istismara karşı dakikada IP başına 20 olay.
   Tıklama seyrek bir şey; 20 fazlasıyla yeterli, botun tabloyu şişirmesini
   engeller. */
const PENCERE_MS = 60_000;
const AZAMI = 20;
const vurus = new Map<string, number[]>();

function sinirAsildi(ip: string): boolean {
  const simdi = Date.now();
  const son = (vurus.get(ip) ?? []).filter((t) => simdi - t < PENCERE_MS);
  son.push(simdi);
  vurus.set(ip, son);
  if (vurus.size > 5000) vurus.clear();
  return son.length > AZAMI;
}

/* "outreach": tanıtım e-postasındaki bağlantıdan gelen ziyaret. utm_content
   o maili alan firmanın alan adını taşıyor (bkz. hedef-firma-excel.py
   gonderim_linki) — yani hangi firmanın tıkladığı buradan bilinir. Kendi
   linkimizin kendi parametresi; çerez, IP, kullanıcı kimliği yine yok. */
const IZINLI = new Set(["telefon", "eposta", "outreach"]);

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "bilinmiyor";
  if (sinirAsildi(ip)) return new NextResponse(null, { status: 429 });

  let g: Record<string, unknown>;
  try {
    g = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const tur = typeof g.tur === "string" ? g.tur : "";
  if (!IZINLI.has(tur)) return new NextResponse(null, { status: 400 });

  const yol = typeof g.yol === "string" ? g.yol.slice(0, 300) : "";
  const dil = typeof g.dil === "string" ? g.dil.slice(0, 8) : "";
  /* Yalnızca alan adı biçimi — başka bir şey yazılamasın. */
  const ham = typeof g.kaynak === "string" ? g.kaynak.slice(0, 120) : "";
  const kaynak = tur === "outreach" && /^[a-z0-9.-]+$/i.test(ham) ? ham.toLowerCase() : "";

  /* Aynı ziyaretin iki işareti: açılışta etkilesim=false, ilk gerçek hareket
     (fare, tekerlek, dokunma, tuş) gelince true — `gorunum` ikisini tek
     satırda birleştirir. Yayından önce açılmış sayfanın işaretinde ikisi de
     yok; o satır NULL kalır ve gönderim saatine göre ayrılır. */
  const gorunum =
    tur === "outreach" && typeof g.gorunum === "string" && /^[a-z0-9-]{8,64}$/i.test(g.gorunum) ? g.gorunum : "";
  const etkilesim = gorunum && typeof g.etkilesim === "boolean" ? g.etkilesim : null;

  /* Ülke, CDN/ters vekilin koyduğu başlıktan — yoksa boş. Kendimiz IP'den
     çıkarmıyoruz, IP'yi hiç saklamıyoruz. */
  const ulke = req.headers.get("cf-ipcountry") ?? "";

  await olayEkle(tur, yol, dil, ulke, kaynak, gorunum, etkilesim);
  return new NextResponse(null, { status: 204 });
}

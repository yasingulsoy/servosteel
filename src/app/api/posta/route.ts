import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { firmaEslesmeleri, gelenSiniflari, kutuBasinaBekleyenYanit, sonYanitlar } from "@/lib/gelen-db";
import { outreachSemaKur } from "@/lib/outreach-db";
import { iletiOku, kutuGorunumu, postaKutulari, type Klasor } from "@/lib/posta";
import { IMZA, alintiTarihi, alintila, iletBlogu, iletKonusu, kutuKisaAdi, yanitKonusu } from "@/lib/posta-bicim";
import { elleGonder, type ElleGonderim } from "@/lib/posta-gonder";

/**
 * Claude'un e-posta ucu — panelin E-posta sayfasının yaptığını komut
 * satırından yapar: kutuları sayar, klasör listeler, ileti okur, yazar,
 * yanıtlar, iletir. İstemcisi `scripts/posta.mjs`.
 *
 * Yasin, 26 Eylül 2026: "gerektiği yerde bunu sen de yapabilmelisin".
 *
 * ANAHTAR: sunucudaki POSTA_API_ANAHTARI (en az 32 karakter), istekte
 * `Authorization: Bearer …`. Tanımlı değilse, kısaysa ya da istek başka anahtar
 * getirirse cevap 404 — uç kapalıyken var olduğu bile söylenmez
 * (otomatik/route.ts ile aynı). Anahtar yalnızca sunucunun ortam
 * değişkenlerinde ve yerel .env.local'da durur.
 *
 * Gönderim paneldeki formla AYNI yoldan geçer (posta-gonder.ts): saatlik sınır
 * ortak, abonelikten çıkana yeni e-posta gitmez, her gönderim panel kaydına
 * "claude" adıyla düşer. `dene: true` bütün kontrolleri çalıştırır, göndermez.
 */
export const dynamic = "force-dynamic";

const KIM = "claude";
const yok = () => new NextResponse("Not Found", { status: 404 });
const hata = (mesaj: string, status = 400) => NextResponse.json({ tamam: false, hata: mesaj }, { status });

function anahtarDogru(istek: NextRequest): boolean {
  const beklenen = Buffer.from(process.env.POSTA_API_ANAHTARI ?? "");
  if (beklenen.length < 32) return false;
  const gelen = Buffer.from((istek.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""));
  return gelen.length === beklenen.length && timingSafeEqual(gelen, beklenen);
}

/* Kutuları yormasın: 10 dakikada en çok 120 istek (süreç başına). */
const PENCERE_MS = 10 * 60_000;
const PENCERE_ISTEK = 120;
const istekler: number[] = [];
function sinirDoldu(): boolean {
  const simdi = Date.now();
  while (istekler.length && istekler[0] < simdi - PENCERE_MS) istekler.shift();
  if (istekler.length >= PENCERE_ISTEK) return true;
  istekler.push(simdi);
  return false;
}

type Govde = {
  islem?: string;
  kutu?: string;
  klasor?: string;
  sayfa?: number;
  uid?: number;
  adet?: number;
  kime?: string;
  bilgi?: string;
  konu?: string;
  metin?: string;
  /** Yanıtta alıntı eklensin mi (varsayılan evet) */
  alinti?: boolean;
  /** İmza eklensin mi (varsayılan evet — paneldeki form da imzayla açılıyor) */
  imza?: boolean;
  dene?: boolean;
};

const metin = (v: unknown, max: number) => (typeof v === "string" ? v : "").slice(0, max);

/** "ege" ya da "ege@servosteel.com.tr" → tanımlı kutunun tam adresi */
function kutuCoz(v: unknown): string | null {
  const a = metin(v, 254).trim().toLowerCase();
  if (!a) return null;
  return postaKutulari().find((k) => k.user === a || kutuKisaAdi(k.user) === a)?.user ?? null;
}

const klasorCoz = (v: unknown): Klasor => (v === "giden" ? "giden" : "gelen");

/** Yazılan metin + imza. Metin yazanın; imza panelle aynı. */
function govdeKur(g: Govde): string {
  const m = metin(g.metin, 50_000).replace(/\r\n?/g, "\n").trim();
  return g.imza === false ? m : `${m}\n\n${IMZA}`;
}

async function gonder(t: Omit<ElleGonderim, "kim">) {
  const s = await elleGonder({ ...t, kim: KIM });
  return NextResponse.json(
    { ...s, dene: Boolean(t.dene), taslak: { kutu: t.kutu, kime: t.kime, bilgi: t.bilgi ?? "", konu: t.konu, metin: t.metin } },
    { status: s.tamam ? 200 : 400 }
  );
}

export async function POST(istek: NextRequest) {
  if (!anahtarDogru(istek)) return yok();
  if (sinirDoldu()) return hata("Çok sık istek — birkaç dakika sonra tekrar deneyin.", 429);
  if (Number(istek.headers.get("content-length") ?? 0) > 200_000) return hata("İstek çok büyük.", 413);

  let g: Govde;
  try {
    g = (await istek.json()) as Govde;
  } catch {
    return hata("Gövde JSON olmalı.");
  }
  if (!g || typeof g !== "object") return hata("Gövde JSON nesnesi olmalı.");
  await outreachSemaKur();

  if (g.islem === "kutular") {
    const bekleyen = await kutuBasinaBekleyenYanit().catch(() => new Map<string, number>());
    return NextResponse.json({
      tamam: true,
      kutular: postaKutulari().map((k) => ({ ...k, bekleyenYanit: bekleyen.get(k.user) ?? 0 })),
    });
  }

  if (g.islem === "yanitlar") {
    return NextResponse.json({ tamam: true, yanitlar: await sonYanitlar(Number(g.adet) || 10) });
  }

  const kutu = kutuCoz(g.kutu);
  if (!kutu) return hata(`Kutu yok ya da tanımlı değil. Tanımlı olanlar: ${postaKutulari().map((k) => k.user).join(", ")}`);
  const klasor = klasorCoz(g.klasor);

  if (g.islem === "liste") {
    const r = await kutuGorunumu(kutu, klasor, Number(g.sayfa) || 1);
    if (!r.tamam) return hata(r.hata, 502);
    const [siniflar, firmalar] = await Promise.all([
      klasor === "gelen"
        ? gelenSiniflari(kutu, r.uidvalidity, r.iletiler.map((m) => m.uid)).catch(() => new Map())
        : Promise.resolve(new Map()),
      firmaEslesmeleri(r.iletiler.map((m) => m.kisiAdres)).catch(() => new Map()),
    ]);
    return NextResponse.json({
      tamam: true,
      kutu,
      klasor,
      klasorYolu: r.klasorYolu,
      toplam: r.toplam,
      sayfa: r.sayfa,
      sayfaSayisi: r.sayfaSayisi,
      iletiler: r.iletiler.map((m) => ({ ...m, sinif: siniflar.get(m.uid) ?? null, firma: firmalar.get(m.kisiAdres) ?? null })),
    });
  }

  const uid = Math.floor(Number(g.uid));

  if (g.islem === "oku") {
    const r = await iletiOku(kutu, klasor, uid);
    if (!r.tamam) return hata(r.hata);
    const firmalar = await firmaEslesmeleri([r.ileti.kimdenAdres]).catch(() => new Map());
    return NextResponse.json({ tamam: true, kutu, klasor, ileti: r.ileti, firma: firmalar.get(r.ileti.kimdenAdres) ?? null });
  }

  if (g.islem === "gonder") {
    return gonder({
      kutu,
      kime: metin(g.kime, 4000),
      bilgi: metin(g.bilgi, 4000),
      konu: metin(g.konu, 300),
      metin: govdeKur(g),
      dene: g.dene === true,
    });
  }

  if (g.islem === "yanitla") {
    /* Yanıt her zaman Gelen'deki bir iletiye: alıcı, konu, alıntı ve konuşma
       zinciri iletinin kendisinden — panelin "Yanıtla" düğmesiyle aynı. */
    const r = await iletiOku(kutu, "gelen", uid);
    if (!r.tamam) return hata(r.hata);
    const x = r.ileti;
    return gonder({
      kutu,
      kime: metin(g.kime, 4000) || x.yanitAdresi,
      bilgi: metin(g.bilgi, 4000),
      konu: metin(g.konu, 300) || yanitKonusu(x.konu),
      metin: govdeKur(g) + (g.alinti === false ? "" : alintila(x.metin, x.kimden, alintiTarihi(x.tarih))),
      mesajKimligi: x.mesajKimligi,
      referanslar: x.referanslar,
      yanitUid: uid,
      dene: g.dene === true,
    });
  }

  if (g.islem === "ilet") {
    const r = await iletiOku(kutu, klasor, uid);
    if (!r.tamam) return hata(r.hata);
    const x = r.ileti;
    return gonder({
      kutu,
      kime: metin(g.kime, 4000),
      bilgi: metin(g.bilgi, 4000),
      konu: metin(g.konu, 300) || iletKonusu(x.konu),
      metin: govdeKur(g) + iletBlogu(x),
      dene: g.dene === true,
    });
  }

  return hata("Bilinmeyen işlem. Olanlar: kutular, yanitlar, liste, oku, gonder, yanitla, ilet.");
}

export function GET() {
  return yok();
}

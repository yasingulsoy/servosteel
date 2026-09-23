import "server-only";
import { sorguSert } from "@/lib/db";
import { gelenKutulariTara } from "@/lib/gelen-tarama";
import { tekGonderim } from "@/lib/gonderim";
import {
  hedefFirma,
  kutuDurumlari,
  otomatikSiradakiler,
  outreachSemaKur,
  type OtomatikSiradaki,
} from "@/lib/outreach-db";
import { gonderimSirasi } from "@/lib/saat-dilimi";
import {
  AB_ULKE_LISTESI,
  ayarlariOku,
  istanbulSaati,
  kutuSec,
  otomatikPencere,
  sonrakiAralikSn,
} from "@/lib/outreach-kurallar";

/**
 * Otomatik gönderim — her dakika bir TUR (tetik: src/instrumentation.ts →
 * /api/otomatik). Tur şunları yapar, sırayla:
 *
 *   1. açık mı, pencerede mi (hafta içi 09–18 İstanbul, ayarlanabilir)
 *   2. tur kilidi (tek satırlık koşullu yazma: iki sunucu örneği aynı dakikada
 *      iki tur çalıştıramaz)
 *   3. planlanan zaman geldiyse sıradaki firmaya tekGonderim — elle gönderimle
 *      AYNI kurallar: tavanlar, ısınma, aralık, sigorta, geri dönüş eşiği, aynı
 *      adres kilidi, MX. Kutu durmuşsa ya da tavan dolmuşsa hiçbir şey olmaz.
 *   4. sonraki gönderim zamanı: günün KALAN kapasitesi pencerenin kalanına eşit
 *      yayılır, ±%25 oynatılır (20 e-posta / 9 saat → ~27 dk)
 *   5. gelen kutuları (kutu başına en çok 10 dk'da bir) — otomatik açık olmasa da
 *
 * Varsayılan KAPALI; açan ve ayarları değiştiren panel kaydına yazılır.
 */

export type OtomatikAyar = {
  acik: boolean;
  gruplar: number[];
  ab_dahil: boolean;
  kesif_dahil: boolean;
  baslangic: number;
  bitis: number;
  hafta_sonu: boolean;
  son_tik: string | null;
  son_gonderim: string | null;
  sonraki: string | null;
  /** sonraki gelecekte mi (veritabanı saatine göre) */
  sonraki_bekliyor: boolean;
  son_sonuc: string;
  degistiren: string;
  degisti: string | null;
};

export async function otomatikAyar(): Promise<OtomatikAyar | null> {
  const r = await sorguSert<OtomatikAyar>(
    `SELECT acik, gruplar::int[] AS gruplar, ab_dahil, kesif_dahil, baslangic, bitis, hafta_sonu,
            son_tik, son_gonderim, sonraki, COALESCE(sonraki > now(), false) AS sonraki_bekliyor,
            son_sonuc, degistiren, degisti
     FROM otomatik_gonderim WHERE id = 1`
  );
  return r[0] ?? null;
}

export async function otomatikAyarKaydet(
  a: Pick<OtomatikAyar, "acik" | "gruplar" | "ab_dahil" | "kesif_dahil" | "baslangic" | "bitis" | "hafta_sonu">,
  kim: string
) {
  await sorguSert(
    `UPDATE otomatik_gonderim SET acik = $1, gruplar = $2::smallint[], ab_dahil = $3, kesif_dahil = $4,
       baslangic = $5, bitis = $6, hafta_sonu = $7, degistiren = $8, degisti = now(),
       sonraki = CASE WHEN $1 AND NOT acik THEN NULL ELSE sonraki END
     WHERE id = 1`,
    [a.acik, a.gruplar, a.ab_dahil, a.kesif_dahil, a.baslangic, a.bitis, a.hafta_sonu, kim.slice(0, 80)]
  );
}

const kapsam = (a: OtomatikAyar) => ({
  gruplar: a.gruplar,
  abDahil: a.ab_dahil,
  kesifDahil: a.kesif_dahil,
  abUlkeleri: AB_ULKE_LISTESI,
});

/**
 * Bugün sırada olan (henüz gitmemiş) firmalar — paneldeki "Bugün sırada" listesi.
 * Sıra hedefin kendi saatine göre diziliyor; panel gerçekte ne gideceğini gösterir.
 */
export async function otomatikSira(
  a: OtomatikAyar,
  adet: number,
  simdi = new Date()
): Promise<OtomatikSiradaki[]> {
  return otomatikSiradakiler(kapsam(a), adet, gonderimSirasi(simdi));
}

async function turKilidiAl(): Promise<boolean> {
  const r = await sorguSert(
    `UPDATE otomatik_gonderim SET son_tik = now()
     WHERE id = 1 AND (son_tik IS NULL OR son_tik <= now() - interval '50 seconds')
     RETURNING id`
  );
  return r.length > 0;
}

async function sonucYaz(sonuc: string, gonderildi: boolean, sonrakiSn: number | null) {
  await sorguSert(
    `UPDATE otomatik_gonderim SET son_sonuc = $1,
       son_gonderim = CASE WHEN $2 THEN now() ELSE son_gonderim END,
       sonraki = CASE WHEN $3::int IS NULL THEN sonraki ELSE now() + make_interval(secs => $3::int) END
     WHERE id = 1`,
    [sonuc.slice(0, 500), gonderildi, sonrakiSn]
  );
}

export type TurSonucu = { gonderim: string; gelen: string };

/** Bir tur. Hata fırlatmaz — sonucu döner ve otomatik_gonderim.son_sonuc'a yazar. */
export async function otomatikTur(simdi = new Date()): Promise<TurSonucu> {
  if (!(await outreachSemaKur())) return { gonderim: "veritabanı yok", gelen: "" };
  const ayar = ayarlariOku(process.env);
  if (ayar.eksik.length) return { gonderim: "gönderim ayarları eksik", gelen: "" };
  if (!(await turKilidiAl())) return { gonderim: "başka tur sürüyor", gelen: "" };

  let gonderim = "kapalı";
  try {
    gonderim = await gonderimAdimi(simdi, ayar);
  } catch (e) {
    gonderim = `hata: ${(e as Error).message}`.slice(0, 300);
    await sonucYaz(gonderim, false, null).catch(() => {});
  }

  let gelen = "";
  try {
    const r = await gelenKutulariTara(ayar, { aralikSn: 600, enCokSn: 40 });
    const islenen = r.reduce((t, x) => t + x.islenen, 0);
    const hatali = r.filter((x) => x.hata).map((x) => `${x.kutu}: ${x.hata}`);
    gelen = hatali.length ? `hata — ${hatali.join(" · ")}` : islenen ? `${islenen} ileti işlendi` : "";
  } catch (e) {
    gelen = `hata: ${(e as Error).message}`.slice(0, 300);
  }
  return { gonderim, gelen };
}

async function gonderimAdimi(simdi: Date, ayar: ReturnType<typeof ayarlariOku>): Promise<string> {
  const a = await otomatikAyar();
  if (!a || !a.acik) return "kapalı";

  const pencere = otomatikPencere(istanbulSaati(simdi), {
    baslangic: a.baslangic,
    bitis: a.bitis,
    haftaSonu: a.hafta_sonu,
  });
  if (!pencere.acik) return `beklemede — ${pencere.sebep}`;
  if (a.sonraki && new Date(a.sonraki).getTime() > simdi.getTime()) return "tempo: sıradaki zamanı bekliyor";

  const durum = await kutuDurumlari(ayar.kutular);
  const secim = kutuSec(ayar, durum.kutu, durum.alan);
  if (secim.kalan <= 0) {
    const s = "bugünkü tavan doldu — yarın devam";
    await sonucYaz(s, false, null);
    return s;
  }
  if (!secim.uygun.length) {
    const s = secim.bekle !== null ? `kutu aralığı: ${secim.bekle} sn` : (secim.sebep ?? "gönderebilecek kutu yok");
    if (secim.bekle === null) await sonucYaz(s, false, null);
    return s;
  }

  /* Sıradaki firma. MX yoksa ya da adres o arada başka satırdan yazıldıysa
     tekGonderim göndermeden döner — aynı turda bir sonrakine geçilir (en çok 5). */
  const adaylar = await otomatikSira(a, 5, simdi);
  if (!adaylar.length) {
    const s = "sırada firma yok (kapsamı genişletin ya da listeyi büyütün)";
    await sonucYaz(s, false, null);
    return s;
  }
  for (const aday of adaylar) {
    const f = await hedefFirma(aday.id);
    if (!f) continue;
    const r = await tekGonderim({ firmaId: f.id, konu: f.konu, govde: f.govde, kullanici: "otomatik" });
    if (!r.denendi && r.bekle === undefined && /MX|e-posta almıyor|yazıldı|Durumu/.test(r.mesaj)) continue;
    /* Sonraki gönderim: kalan kapasite pencerenin kalanına yayılır */
    const kalanSonra = Math.max(0, secim.kalan - (r.denendi ? 1 : 0));
    const sonrakiSn = r.denendi ? sonrakiAralikSn(pencere.kalanDk, kalanSonra, ayar.aralikSn, Math.random()) : null;
    const s = `${f.firma}: ${r.mesaj}`;
    await sonucYaz(s, r.denendi, sonrakiSn);
    return s;
  }
  const s = "sıradaki firmalara gönderilemedi (adres/MX) — sonraki turda devam";
  await sonucYaz(s, false, null);
  return s;
}

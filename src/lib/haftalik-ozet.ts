import "server-only";
import { sorgu, sorguSert } from "@/lib/db";
import { gscHaftasi, type GscHaftasi } from "@/lib/gsc";
import { panelEpostasi } from "@/lib/mail";
import { adresleriAyikla } from "@/lib/posta-bicim";
import { SITE_URL } from "@/lib/site";
import { takipListesi } from "@/lib/takip";

/**
 * Pazartesi özeti — geçen haftanın (pazartesi-pazar, İstanbul) sayıları tek
 * e-postada: talep, site iletişimi, tanıtım e-postası hunisi, Google araması
 * (bağlıysa), takip. Yasin, 26 Eylül 2026: "patrona ve size tek mail".
 *
 * Açık mı, kim alır: panelden (Genel bakış → Haftalık özet), yönetici
 * değiştirir. Ne zaman: pazartesi 08:30'dan sonraki ilk dakikalık turda
 * (otomatik-gonderim.ts). Haftada BİR kez — hafta, veritabanında tek bir
 * satırla sahipleniliyor; iki süreç aynı anda göndermez. Olmazsa 30 dakika
 * arayla en çok 3 deneme. Açıldığı haftaya geriye dönük gitmez: cuma açılan
 * özet ilk kez pazartesi gider ("Şimdi gönder" ile hemen denenebilir).
 *
 * Yalnızca sayı ve liste — "şuna dönün" gibi çağrı yok.
 */

let semaHazir = false;

export async function ozetSemasiKur(): Promise<boolean> {
  if (semaHazir) return true;
  const r = await sorgu(`
    CREATE TABLE IF NOT EXISTS ozet_ayar (
      id           SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      acik         BOOLEAN NOT NULL DEFAULT false,
      alicilar     TEXT NOT NULL DEFAULT '',
      acildi       TIMESTAMPTZ,
      guncelleyen  TEXT NOT NULL DEFAULT '',
      guncellendi  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    INSERT INTO ozet_ayar (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
    CREATE TABLE IF NOT EXISTS ozet_gonderim (
      hafta       DATE PRIMARY KEY,
      basladi     TIMESTAMPTZ NOT NULL DEFAULT now(),
      gonderildi  TIMESTAMPTZ,
      deneme      INTEGER NOT NULL DEFAULT 1,
      sonuc       TEXT NOT NULL DEFAULT '',
      alicilar    TEXT NOT NULL DEFAULT ''
    );
  `);
  semaHazir = r !== null;
  return semaHazir;
}

/* ---------------------------------------------------------------- ayar */

export type OzetAyari = { acik: boolean; alicilar: string; acildi: string | null; guncelleyen: string };

export async function ozetAyari(): Promise<OzetAyari> {
  const r = await sorguSert<OzetAyari>(`SELECT acik, alicilar, acildi, guncelleyen FROM ozet_ayar WHERE id = 1`);
  return r[0] ?? { acik: false, alicilar: "", acildi: null, guncelleyen: "" };
}

/** Kapalıdan açığa geçince `acildi` yenilenir — o haftaya geriye dönük gönderilmez. */
export async function ozetAyariYaz(acik: boolean, alicilar: string[], kim: string) {
  await sorguSert(
    `UPDATE ozet_ayar
     SET acildi = CASE WHEN $1 AND NOT acik THEN now() ELSE acildi END,
         acik = $1, alicilar = $2, guncelleyen = $3, guncellendi = now()
     WHERE id = 1`,
    [acik, alicilar.join(", "), kim.slice(0, 80)]
  );
}

export type SonOzet = { hafta: string; gonderildi: string | null; sonuc: string; alicilar: string };

export async function sonOzet(): Promise<SonOzet | null> {
  const r = await sorguSert<SonOzet>(
    `SELECT to_char(hafta, 'YYYY-MM-DD') AS hafta, gonderildi, sonuc, alicilar
     FROM ozet_gonderim ORDER BY hafta DESC LIMIT 1`
  );
  return r[0] ?? null;
}

/* ---------------------------------------------------------------- veri */

/** Özetin kapsadığı hafta: bu haftanın pazartesisinden önceki pazartesi-pazar ve ondan önceki hafta. */
export type OzetAraligi = { hafta: string; bas: string; son: string; onceBas: string; onceSon: string };

export async function gecenHafta(): Promise<OzetAraligi> {
  const r = await sorguSert<OzetAraligi>(
    `WITH p AS (SELECT date_trunc('week', now() AT TIME ZONE 'Europe/Istanbul')::date AS pzt)
     SELECT to_char(pzt, 'YYYY-MM-DD') AS hafta,
            to_char(pzt - 7, 'YYYY-MM-DD') AS bas,
            to_char(pzt - 1, 'YYYY-MM-DD') AS son,
            to_char(pzt - 14, 'YYYY-MM-DD') AS "onceBas",
            to_char(pzt - 8, 'YYYY-MM-DD') AS "onceSon"
     FROM p`
  );
  return r[0];
}

export type OzetSayilari = {
  talep: number;
  talep_once: number;
  teklif_formu: number;
  iletisim: number;
  iletisim_once: number;
  gonderim: number;
  gonderim_once: number;
  tiklama: number;
  tiklama_once: number;
  tiklayan: number;
  tiklayan_once: number;
  teklif_sayfasi: number;
  teklif_sayfasi_once: number;
  yanit: number;
  yanit_once: number;
  geri_donus: number;
  abonelik: number;
  talep_toplam: number;
  kazanilan: number;
  olumlu: number;
  gonderim_toplam: number;
};

export type OzetVerisi = {
  aralik: OzetAraligi;
  sayi: OzetSayilari;
  talepler: { id: number; ad: string; ulke: string; tur: string }[];
  yanitlar: { firma: string | null; ulke: string | null; kimden: string }[];
  takip: { geldi: number; hafta: number };
  gsc: GscHaftasi | { hata: string } | null;
};

/* Bu hafta [b1, s1), önceki hafta [b0, b1) — İstanbul gece yarıları. */
const BU = (k: string) => `${k} >= p.b1 AND ${k} < p.s1`;
const ONCE = (k: string) => `${k} >= p.b0 AND ${k} < p.b1`;
const TEKLIF_SAYFASI = `(yol LIKE '%request-quote%' OR yol LIKE '%teklif-al%')`;

export async function ozetVerisi(aralik: OzetAraligi): Promise<OzetVerisi> {
  const p = `WITH p AS (
    SELECT ($1::date)::timestamp AT TIME ZONE 'Europe/Istanbul' AS b1,
           ($2::date + 1)::timestamp AT TIME ZONE 'Europe/Istanbul' AS s1,
           ($1::date - 7)::timestamp AT TIME ZONE 'Europe/Istanbul' AS b0
  )`;
  const deger = [aralik.bas, aralik.son];
  const [sayilar, talepler, yanitlar, takip, gsc] = await Promise.all([
    sorguSert<OzetSayilari>(
      `${p}
       SELECT
         (SELECT count(*) FROM talepler WHERE ${BU("olusturuldu")} AND durum <> 'spam')::int AS talep,
         (SELECT count(*) FROM talepler WHERE ${ONCE("olusturuldu")} AND durum <> 'spam')::int AS talep_once,
         (SELECT count(*) FROM talepler WHERE ${BU("olusturuldu")} AND durum <> 'spam' AND tur = 'rfq')::int AS teklif_formu,
         (SELECT count(*) FROM olaylar WHERE ${BU("olusturuldu")} AND tur IN ('telefon', 'eposta'))::int AS iletisim,
         (SELECT count(*) FROM olaylar WHERE ${ONCE("olusturuldu")} AND tur IN ('telefon', 'eposta'))::int AS iletisim_once,
         (SELECT count(*) FROM hedef_gonderim WHERE ${BU("zaman")} AND sonuc = 'ok')::int AS gonderim,
         (SELECT count(*) FROM hedef_gonderim WHERE ${ONCE("zaman")} AND sonuc = 'ok')::int AS gonderim_once,
         (SELECT count(*) FROM olaylar WHERE ${BU("olusturuldu")} AND tur = 'outreach')::int AS tiklama,
         (SELECT count(*) FROM olaylar WHERE ${ONCE("olusturuldu")} AND tur = 'outreach')::int AS tiklama_once,
         (SELECT count(DISTINCT kaynak) FROM olaylar WHERE ${BU("olusturuldu")} AND tur = 'outreach' AND kaynak <> '')::int AS tiklayan,
         (SELECT count(DISTINCT kaynak) FROM olaylar WHERE ${ONCE("olusturuldu")} AND tur = 'outreach' AND kaynak <> '')::int AS tiklayan_once,
         (SELECT count(*) FROM olaylar WHERE ${BU("olusturuldu")} AND tur = 'outreach' AND ${TEKLIF_SAYFASI})::int AS teklif_sayfasi,
         (SELECT count(*) FROM olaylar WHERE ${ONCE("olusturuldu")} AND tur = 'outreach' AND ${TEKLIF_SAYFASI})::int AS teklif_sayfasi_once,
         (SELECT count(*) FROM gelen_eposta WHERE ${BU("islendi")} AND tur = 'yanit')::int AS yanit,
         (SELECT count(*) FROM gelen_eposta WHERE ${ONCE("islendi")} AND tur = 'yanit')::int AS yanit_once,
         (SELECT count(*) FROM gelen_eposta WHERE ${BU("islendi")} AND tur = 'geri_donus')::int AS geri_donus,
         (SELECT count(*) FROM gelen_eposta WHERE ${BU("islendi")} AND tur = 'abonelik')::int AS abonelik,
         (SELECT count(*) FROM talepler WHERE durum <> 'spam')::int AS talep_toplam,
         (SELECT count(*) FROM talepler WHERE durum = 'kazanildi')::int AS kazanilan,
         (SELECT count(*) FROM hedef_firmalar WHERE durum = 'olumlu')::int AS olumlu,
         (SELECT count(*) FROM hedef_gonderim WHERE sonuc = 'ok')::int AS gonderim_toplam
       FROM p`,
      deger
    ),
    sorguSert<{ id: number; ad: string; ulke: string; tur: string }>(
      `${p}
       SELECT t.id, COALESCE(NULLIF(t.firma, ''), NULLIF(t.ad, ''), t.eposta) AS ad, t.ulke, t.tur
       FROM talepler t, p WHERE t.olusturuldu >= p.b1 AND t.olusturuldu < p.s1 AND t.durum <> 'spam'
       ORDER BY t.olusturuldu LIMIT 25`,
      deger
    ),
    sorguSert<{ firma: string | null; ulke: string | null; kimden: string }>(
      `${p}
       SELECT h.firma, h.ulke, e.kimden
       FROM gelen_eposta e LEFT JOIN hedef_firmalar h ON h.id = e.firma_id, p
       WHERE e.tur = 'yanit' AND e.islendi >= p.b1 AND e.islendi < p.s1
       ORDER BY e.islendi LIMIT 25`,
      deger
    ),
    takipListesi(7, 500).catch(() => ({ satirlar: [], bugun: "" })),
    gscHaftasi(aralik.bas, aralik.son, aralik.onceBas, aralik.onceSon),
  ]);
  return {
    aralik,
    sayi: sayilar[0],
    talepler,
    yanitlar,
    takip: {
      geldi: takip.satirlar.filter((t) => t.gun <= 0).length,
      hafta: takip.satirlar.filter((t) => t.gun > 0).length,
    },
    gsc,
  };
}

/* -------------------------------------------------------------- metin */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sayi = (n: number) => n.toLocaleString("tr-TR");
const ogle = (g: string) => new Date(`${g}T12:00:00Z`);

/** "22–28 Eylül 2026" ya da "29 Eylül – 5 Ekim 2026" */
export function aralikYazisi(bas: string, son: string): string {
  const b = ogle(bas);
  const s = ogle(son);
  const ay = (d: Date) => d.toLocaleDateString("tr-TR", { timeZone: "UTC", month: "long" });
  const yil = s.getUTCFullYear();
  if (b.getUTCMonth() === s.getUTCMonth() && b.getUTCFullYear() === s.getUTCFullYear()) {
    return `${b.getUTCDate()}–${s.getUTCDate()} ${ay(s)} ${yil}`;
  }
  const byil = b.getUTCFullYear() === yil ? "" : ` ${b.getUTCFullYear()}`;
  return `${b.getUTCDate()} ${ay(b)}${byil} – ${s.getUTCDate()} ${ay(s)} ${yil}`;
}

/** Sütun başlığı: "14–20 Eyl" — "bu hafta" demek pazartesi okununca yeni haftayla karışırdı. */
function kisaAralik(bas: string, son: string): string {
  const b = ogle(bas);
  const s = ogle(son);
  const ay = (d: Date) => d.toLocaleDateString("tr-TR", { timeZone: "UTC", month: "short" });
  return b.getUTCMonth() === s.getUTCMonth()
    ? `${b.getUTCDate()}–${s.getUTCDate()} ${ay(s)}`
    : `${b.getUTCDate()} ${ay(b)} – ${s.getUTCDate()} ${ay(s)}`;
}

type Satir = [etiket: string, bu: string, once: string];

export function ozetIcerik(v: OzetVerisi): { konu: string; metin: string; html: string } {
  const s = v.sayi;
  const aralik = aralikYazisi(v.aralik.bas, v.aralik.son);
  const buSutun = kisaAralik(v.aralik.bas, v.aralik.son);
  const onceSutun = kisaAralik(v.aralik.onceBas, v.aralik.onceSon);
  const panel = `${SITE_URL}/admin/genel`;

  const satirlar: Satir[] = [
    ["Talep (spam hariç)", `${sayi(s.talep)}${s.teklif_formu ? ` · ${sayi(s.teklif_formu)} teklif formu` : ""}`, sayi(s.talep_once)],
    ["Sitede telefon / e-posta tuşu", sayi(s.iletisim), sayi(s.iletisim_once)],
    ["Tanıtım e-postası gönderildi", sayi(s.gonderim), sayi(s.gonderim_once)],
    ["E-postadaki bağlantıya tıklama", `${sayi(s.tiklama)} · ${sayi(s.tiklayan)} firma`, `${sayi(s.tiklama_once)} · ${sayi(s.tiklayan_once)} firma`],
    ["Teklif sayfasına gelen (e-postadan)", sayi(s.teklif_sayfasi), sayi(s.teklif_sayfasi_once)],
    ["Yanıt", sayi(s.yanit), sayi(s.yanit_once)],
    ["Geri dönen / abonelikten çıkan", `${sayi(s.geri_donus)} / ${sayi(s.abonelik)}`, "—"],
  ];

  let gscSatirlari: Satir[] = [];
  let gscSorgular: string[] = [];
  let gscNot = "";
  if (v.gsc && "hata" in v.gsc) {
    gscNot = `Google verisi alınamadı: ${v.gsc.hata}`;
  } else if (v.gsc) {
    const g = v.gsc;
    const sira = (x: number) => (x ? x.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) : "—");
    gscSatirlari = [
      ["Google aramasından tıklama", sayi(g.bu.tiklama), sayi(g.once.tiklama)],
      ["Google'da görünme (gösterim)", sayi(g.bu.gosterim), sayi(g.once.gosterim)],
      ["Ortalama sıra", sira(g.bu.sira), sira(g.once.sira)],
    ];
    gscSorgular = g.sorgular.filter((x) => x.sorgu).map((x) => `${x.sorgu} — ${sayi(x.tiklama)} tık, ${sayi(x.gosterim)} gösterim`);
  }

  const toplamlar = `Bugüne kadar: ${sayi(s.talep_toplam)} talep (${sayi(s.kazanilan)} kazanıldı) · ${sayi(s.gonderim_toplam)} tanıtım e-postası · ${sayi(s.olumlu)} olumlu firma`;
  const takipYazisi = `Takip: ${sayi(v.takip.geldi)} işin günü geldi ya da geçti, önümüzdeki 7 günde ${sayi(v.takip.hafta)} iş var.`;
  const talepSatiri = (t: OzetVerisi["talepler"][number]) =>
    `${t.ad}${t.ulke ? ` (${t.ulke})` : ""} — ${t.tur === "rfq" ? "teklif formu" : "iletişim formu"}`;
  const yanitSatiri = (y: OzetVerisi["yanitlar"][number]) => `${y.firma ?? y.kimden}${y.ulke ? ` (${y.ulke})` : ""}`;

  const konu = `Servosteel haftalık özet · ${aralik}: ${sayi(s.talep)} talep, ${sayi(s.gonderim)} gönderim, ${sayi(s.yanit)} yanıt`;

  /* ---- düz metin */
  const metin = [
    `Servosteel — haftalık özet`,
    `${aralik} (pazartesi–pazar) · parantez içinde önceki hafta (${onceSutun})`,
    "",
    ...[...satirlar, ...gscSatirlari].map(([e, b, o]) => `${e}: ${b}${o !== "—" ? ` (${o})` : ""}`),
    gscNot,
    ...(gscSorgular.length ? ["", "En çok tıklanan aramalar:", ...gscSorgular.map((x) => `- ${x}`)] : []),
    ...(v.talepler.length ? ["", "Haftanın talepleri:", ...v.talepler.map((t) => `- ${talepSatiri(t)}`)] : []),
    ...(v.yanitlar.length ? ["", "Yanıt veren firmalar:", ...v.yanitlar.map((y) => `- ${yanitSatiri(y)}`)] : []),
    "",
    takipYazisi,
    toplamlar,
    "",
    `Panel: ${panel}`,
    "Bu e-posta her pazartesi 08:30'da gider; alıcılar panelden değiştirilir.",
  ]
    .filter((x, i, a) => !(x === "" && a[i - 1] === ""))
    .join("\n");

  /* ---- HTML: tek sütun, satır içi stil — e-posta istemcileri stil sayfası okumaz */
  const td = "padding:7px 10px;border-bottom:1px solid #e4e4e7;";
  const tablo = (rows: Satir[]) =>
    rows
      .map(
        ([e, b, o]) =>
          `<tr><td style="${td}">${esc(e)}</td><td style="${td}text-align:right;font-weight:bold;white-space:nowrap">${esc(b)}</td><td style="${td}text-align:right;color:#71717a;white-space:nowrap">${esc(o)}</td></tr>`
      )
      .join("");
  const liste = (baslik: string, ogeler: string[]) =>
    ogeler.length
      ? `<h2 style="font-size:15px;margin:22px 0 6px">${esc(baslik)}</h2><ul style="margin:0;padding-left:18px">${ogeler
          .map((x) => `<li style="margin:3px 0">${esc(x)}</li>`)
          .join("")}</ul>`
      : "";

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#18181b;max-width:640px">
<h1 style="font-size:19px;margin:0 0 2px">Servosteel — haftalık özet</h1>
<p style="margin:0 0 14px;color:#71717a">${esc(aralik)} · pazartesi–pazar</p>
<table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%">
<tr><th style="${td}text-align:left;color:#71717a;font-weight:normal"></th><th style="${td}text-align:right;color:#71717a;font-weight:normal;white-space:nowrap">${esc(buSutun)}</th><th style="${td}text-align:right;color:#71717a;font-weight:normal;white-space:nowrap">${esc(onceSutun)}</th></tr>
${tablo(satirlar)}
${gscSatirlari.length ? tablo(gscSatirlari) : ""}
</table>
${gscNot ? `<p style="margin:8px 0 0;color:#b45309;font-size:13px">${esc(gscNot)}</p>` : ""}
${liste("En çok tıklanan Google aramaları", gscSorgular)}
${liste("Haftanın talepleri", v.talepler.map(talepSatiri))}
${liste("Yanıt veren firmalar", v.yanitlar.map(yanitSatiri))}
<p style="margin:22px 0 4px">${esc(takipYazisi)}</p>
<p style="margin:0;color:#52525b">${esc(toplamlar)}</p>
<p style="margin:22px 0 0;font-size:12px;color:#71717a"><a href="${esc(panel)}" style="color:#18181b">Paneli aç</a> · Bu e-posta her pazartesi 08:30'da gider; alıcılar panelden değiştirilir.</p>
</div>`;

  return { konu, metin, html };
}

/* ------------------------------------------------------------ gönderim */

export async function ozetGonder(alicilar: string[]): Promise<{ konu: string }> {
  const v = await ozetVerisi(await gecenHafta());
  const icerik = ozetIcerik(v);
  await panelEpostasi({ alicilar, ...icerik });
  return { konu: icerik.konu };
}

/**
 * Dakikalık turun adımı. Zamanı gelmediyse (ya da bu hafta gittiyse) tek
 * hafif sorgu ve boş dönüş. Sahiplenme tek INSERT: hafta satırı yoksa
 * açılır, varsa ancak gönderilmemiş, 3'ten az denenmiş ve son denemenin
 * üstünden 30 dakika geçmişse yeniden alınır.
 */
export async function haftalikOzetAdimi(): Promise<string> {
  if (!(await ozetSemasiKur())) return "";
  const r = await sorguSert<{ hafta: string; alicilar: string }>(
    `WITH a AS (SELECT acik, alicilar, acildi FROM ozet_ayar WHERE id = 1),
          s AS (SELECT date_trunc('week', now() AT TIME ZONE 'Europe/Istanbul')::date AS hafta,
                       (date_trunc('week', now() AT TIME ZONE 'Europe/Istanbul') + interval '8 hours 30 minutes')
                         AT TIME ZONE 'Europe/Istanbul' AS saat)
     INSERT INTO ozet_gonderim (hafta, alicilar)
     SELECT s.hafta, a.alicilar FROM a, s
     WHERE a.acik AND a.alicilar <> '' AND now() >= s.saat AND (a.acildi IS NULL OR a.acildi <= s.saat)
     ON CONFLICT (hafta) DO UPDATE
       SET basladi = now(), deneme = ozet_gonderim.deneme + 1, alicilar = EXCLUDED.alicilar
       WHERE ozet_gonderim.gonderildi IS NULL AND ozet_gonderim.deneme < 3
         AND ozet_gonderim.basladi < now() - interval '30 minutes'
     RETURNING to_char(hafta, 'YYYY-MM-DD') AS hafta, alicilar`
  );
  if (!r.length) return "";
  const { hafta, alicilar } = r[0];
  const liste = adresleriAyikla(alicilar).gecerli;
  try {
    const { konu } = await ozetGonder(liste);
    await sorguSert(`UPDATE ozet_gonderim SET gonderildi = now(), sonuc = $2 WHERE hafta = $1::date`, [
      hafta,
      konu.slice(0, 300),
    ]);
    return `haftalık özet gönderildi (${liste.length} alıcı)`;
  } catch (e) {
    const hata = `hata: ${(e as Error).message}`.slice(0, 300);
    await sorguSert(`UPDATE ozet_gonderim SET sonuc = $2 WHERE hafta = $1::date`, [hafta, hata]);
    return `haftalık özet gönderilemedi — ${hata}`;
  }
}

import { sorgu, sorguSert } from "@/lib/db";
import { ENGELLI_ULKELER, epostaGecerli } from "@/lib/outreach-kurallar";
import { OUTREACH_SEMA } from "@/lib/outreach-sema";

/**
 * Hedef firmalar ve tanıtım e-postası gönderimi — veritabanı katmanı.
 *
 * Firmalar `scripts/hedef-firma-aktar.mjs` ile gelir (kaynak
 * seo/hedef-firmalar/*.md → Excel betiği → JSON). E-posta metni orada, Excel'dekiyle
 * AYNI şablondan üretilir; panel yalnızca gösterir, düzenletir ve gönderir.
 *
 * Gönderim kuralları burada SQL'le uygulanıyor, arayüzde değil: sunucu
 * eylemi doğrudan POST ile çağrılabilir, düğmeyi gizlemek kural değildir.
 */

export const HEDEF_DURUMLAR = [
  "bekliyor",
  "gonderildi",
  "yanit",
  "olumlu",
  "red",
  "iptal",
  "hatali",
  "gecildi",
] as const;

export type HedefDurum = (typeof HEDEF_DURUMLAR)[number];

export const HEDEF_DURUM_ETIKET: Record<HedefDurum, string> = {
  bekliyor: "Gönderilmedi",
  gonderildi: "Gönderildi",
  yanit: "Yanıt geldi",
  olumlu: "Olumlu",
  red: "İlgilenmiyor",
  iptal: "Abonelikten çıktı",
  hatali: "Adres hatalı",
  gecildi: "Geçildi",
};

export type HedefFirma = {
  id: number;
  anahtar: string;
  firma: string;
  hitap: string;
  ulke: string;
  segmentler: string;
  web: string;
  kanit: string;
  urun: string;
  iletisim: string;
  eposta: string;
  dil: string;
  konu: string;
  govde: string;
  link: string;
  durum: HedefDurum;
  listede: boolean;
  iptal_anahtari: string;
  gonderildi: string | null;
  olusturuldu: string;
  guncellendi: string;
  aktarildi: string;
};

export type HedefSatiri = Pick<
  HedefFirma,
  "id" | "firma" | "ulke" | "segmentler" | "eposta" | "dil" | "durum" | "gonderildi" | "listede"
>;

export type Gonderim = {
  id: number;
  firma_id: number | null;
  zaman: string;
  kullanici: string;
  eposta: string;
  konu: string;
  govde: string;
  sonuc: "ok" | "hata" | "alici" | "belirsiz";
  yanit: string;
  mesaj_kimligi: string;
};

export type HedefNot = {
  id: number;
  firma_id: number;
  olusturuldu: string;
  yazan: string;
  govde: string;
};

export type GonderimDurumu = {
  son_deneme: string | null;
  durdu_bitis: string | null;
  durdu_sebep: string;
  simdi: string;
};

/* CREATE TABLE her istekte çalışmasın — süreç başına bir kez yeter. */
let semaHazir = false;

export async function outreachSemaKur(): Promise<boolean> {
  if (semaHazir) return true;
  const r = await sorgu(OUTREACH_SEMA);
  semaHazir = r !== null;
  return semaHazir;
}

/* ------------------------------------------------------ gönderilebilir mi */

/**
 * Bu firmaya ŞU AN neden e-posta gönderilemez? Gönderilebiliyorsa `null`.
 * Günlük tavan, aralık ve sigorta burada değil — onlar firmaya değil güne ait.
 */
export function firmaEngeli(f: HedefFirma, engelli: boolean): string | null {
  if (!f.listede) return "Firma son aktarımda listede yoktu (elenmiş olabilir).";
  if (f.durum !== "bekliyor") {
    return `Durumu "${HEDEF_DURUM_ETIKET[f.durum] ?? f.durum}" — yalnızca gönderilmemiş firmaya yazılır.`;
  }
  if (!f.eposta) return "E-posta adresi yok (sitede doğrulanamadı). Telefon ya da iletişim formu.";
  if (!epostaGecerli(f.eposta)) return `E-posta adresi geçersiz görünüyor: ${f.eposta}`;
  if (ENGELLI_ULKELER[f.ulke]) return ENGELLI_ULKELER[f.ulke];
  if (engelli) return "Bu adres engel listesinde (abonelikten çıktı ya da elle engellendi).";
  if (!f.konu.trim() || !f.govde.trim()) return "Hazır e-posta metni yok.";
  return null;
}

/* SQL karşılığı: gönderilebilir firmalar. Günlük listede ve "sıradaki" düğmesinde. */
const GONDERILEBILIR = `
  h.listede AND h.durum = 'bekliyor' AND h.eposta <> '' AND h.konu <> ''
  AND NOT (h.ulke = ANY($1::text[]))
  AND NOT EXISTS (SELECT 1 FROM eposta_engel e WHERE e.eposta = lower(h.eposta))
`;
const engelliUlkeler = () => Object.keys(ENGELLI_ULKELER);

/* ----------------------------------------------------------------- liste */

export type HedefFiltre = {
  durum?: string;
  ulke?: string;
  segment?: string;
  ara?: string;
  /** "gonderilebilir" = şu an gönderilebilecekler */
  goster?: string;
};

function kosullar(f: HedefFiltre): { nerede: string; deger: unknown[] } {
  const deger: unknown[] = [engelliUlkeler()];
  const kosul: string[] = ["h.listede"];
  if (f.goster === "gonderilebilir") kosul.push(GONDERILEBILIR);
  if (f.durum && HEDEF_DURUMLAR.includes(f.durum as HedefDurum)) {
    deger.push(f.durum);
    kosul.push(`h.durum = $${deger.length}`);
  }
  if (f.ulke) {
    deger.push(f.ulke);
    kosul.push(`h.ulke = $${deger.length}`);
  }
  if (f.segment) {
    deger.push(`%${f.segment}%`);
    kosul.push(`h.segmentler LIKE $${deger.length}`);
  }
  if (f.ara) {
    deger.push(`%${f.ara.toLowerCase()}%`);
    const i = deger.length;
    kosul.push(
      `(lower(h.firma) LIKE $${i} OR lower(h.eposta) LIKE $${i} OR lower(h.web) LIKE $${i} OR lower(h.urun) LIKE $${i})`
    );
  }
  /* $1 (engelli ülkeler) her zaman gönderiliyor; kullanılmadığında da
     Postgres türünü bilsin diye ::text[] ile anılıyor. */
  if (!kosul.some((k) => k.includes("$1"))) kosul.push("cardinality($1::text[]) >= 0");
  return { nerede: `WHERE ${kosul.join(" AND ")}`, deger };
}

export const SAYFA_BOYU = 50;

export async function hedefFirmalar(
  f: HedefFiltre,
  sayfa = 1
): Promise<{ satirlar: HedefSatiri[]; toplam: number }> {
  const { nerede, deger } = kosullar(f);
  const s = Number.isFinite(sayfa) && sayfa >= 1 ? Math.floor(sayfa) : 1;
  const [satirlar, sayim] = await Promise.all([
    sorguSert<HedefSatiri>(
      `SELECT h.id, h.firma, h.ulke, h.segmentler, h.eposta, h.dil, h.durum, h.gonderildi, h.listede
       FROM hedef_firmalar h ${nerede}
       ORDER BY h.id
       LIMIT ${SAYFA_BOYU} OFFSET ${(s - 1) * SAYFA_BOYU}`,
      deger
    ),
    sorguSert<{ adet: string }>(`SELECT count(*)::text AS adet FROM hedef_firmalar h ${nerede}`, deger),
  ]);
  return { satirlar, toplam: Number(sayim[0]?.adet ?? 0) };
}

/** Süzgeçteki bir sonraki gönderilebilir firma — `sonra` verilirse ondan sonraki. */
export async function siradaki(f: HedefFiltre, sonra = 0): Promise<number | null> {
  const { nerede, deger } = kosullar({ ...f, durum: undefined, goster: "gonderilebilir" });
  deger.push(sonra);
  const r = await sorguSert<{ id: number }>(
    `SELECT h.id FROM hedef_firmalar h ${nerede} AND h.id > $${deger.length} ORDER BY h.id LIMIT 1`,
    deger
  );
  return r[0]?.id ?? null;
}

export async function hedefFirma(id: number): Promise<HedefFirma | null> {
  const r = await sorguSert<HedefFirma>(`SELECT * FROM hedef_firmalar WHERE id = $1`, [id]);
  return r[0] ?? null;
}

export type HedefOzeti = {
  toplam: number;
  epostali: number;
  gonderilebilir: number;
  /** E-postası en az bir kez gitmiş (ya da gitmiş olabilecek) firma sayısı */
  gonderilen: number;
  durum: Record<string, number>;
};

export async function hedefOzeti(): Promise<HedefOzeti> {
  const [genel, durumlar, giden] = await Promise.all([
    sorguSert<{ toplam: string; epostali: string; gonderilebilir: string }>(
      `SELECT count(*)::text AS toplam,
              count(*) FILTER (WHERE h.eposta <> '')::text AS epostali,
              count(*) FILTER (WHERE ${GONDERILEBILIR})::text AS gonderilebilir
       FROM hedef_firmalar h WHERE h.listede`,
      [engelliUlkeler()]
    ),
    sorguSert<{ durum: string; adet: string }>(
      `SELECT durum, count(*)::text AS adet FROM hedef_firmalar WHERE listede GROUP BY durum`
    ),
    /* Durumdan değil gönderim kaydından: "Gönderildi" sonra "Yanıt geldi"ye
       dönen firma da gönderilmiş sayılmalı. */
    sorguSert<{ adet: string }>(
      `SELECT count(DISTINCT firma_id)::text AS adet FROM hedef_gonderim
       WHERE sonuc IN ('ok', 'belirsiz')`
    ),
  ]);
  return {
    toplam: Number(genel[0]?.toplam ?? 0),
    epostali: Number(genel[0]?.epostali ?? 0),
    gonderilebilir: Number(genel[0]?.gonderilebilir ?? 0),
    gonderilen: Number(giden[0]?.adet ?? 0),
    durum: Object.fromEntries(durumlar.map((d) => [d.durum, Number(d.adet)])),
  };
}

export async function ulkeListesi() {
  return sorguSert<{ ulke: string; adet: string }>(
    `SELECT ulke, count(*)::text AS adet FROM hedef_firmalar
     WHERE listede AND ulke <> '' GROUP BY ulke ORDER BY count(*) DESC, ulke`
  );
}

export async function segmentListesi(): Promise<string[]> {
  const r = await sorguSert<{ s: string }>(
    `SELECT DISTINCT trim(x) AS s
     FROM hedef_firmalar, unnest(string_to_array(segmentler, '+')) AS x
     WHERE listede AND trim(x) <> '' ORDER BY 1`
  );
  return r.map((x) => x.s);
}

/* -------------------------------------------------------------- geçmiş */

export async function gonderimler(firmaId: number) {
  return sorguSert<Gonderim>(
    `SELECT * FROM hedef_gonderim WHERE firma_id = $1 ORDER BY zaman DESC, id DESC`,
    [firmaId]
  );
}

export async function sonGonderimler(adet = 10) {
  return sorguSert<Gonderim & { firma: string | null }>(
    `SELECT g.*, h.firma FROM hedef_gonderim g
     LEFT JOIN hedef_firmalar h ON h.id = g.firma_id
     ORDER BY g.zaman DESC, g.id DESC LIMIT $1`,
    [adet]
  );
}

export async function hedefNotlar(firmaId: number) {
  return sorguSert<HedefNot>(
    `SELECT * FROM hedef_not WHERE firma_id = $1 ORDER BY olusturuldu DESC`,
    [firmaId]
  );
}

/* ------------------------------------------------ günlük tavan, aralık, sigorta */

/* İstanbul'da bugünün başı. Sunucu UTC'de çalışıyor; "bugün" İstanbul günü. */
const BUGUN_BASI = `(date_trunc('day', now() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul')`;

/**
 * Bugün tavandan düşülen gönderimler: başarılı + belirsiz (zaman aşımı —
 * gitmiş olabilir). Alıcı reddi ve bağlantı hatası sayılmaz, çünkü e-posta
 * sunucumuzdan hiç çıkmadı.
 */
export async function bugunGonderilen(): Promise<number> {
  const r = await sorguSert<{ adet: string }>(
    `SELECT count(*)::text AS adet FROM hedef_gonderim
     WHERE sonuc IN ('ok', 'belirsiz') AND zaman >= ${BUGUN_BASI}`
  );
  return Number(r[0]?.adet ?? 0);
}

export async function gonderimDurumu(): Promise<GonderimDurumu> {
  const r = await sorguSert<GonderimDurumu>(
    `SELECT son_deneme, durdu_bitis, durdu_sebep, now() AS simdi FROM gonderim_durumu WHERE id = 1`
  );
  return r[0] ?? { son_deneme: null, durdu_bitis: null, durdu_sebep: "", simdi: new Date().toISOString() };
}

/**
 * Gönderim sırasını ALIR: son denemeden bu yana `aralikSn` geçtiyse ve
 * sigorta atık değilse son deneme zamanını şimdi yapar ve `true` döner.
 *
 * Tek bir koşullu UPDATE — iki kişi aynı saniyede "Gönder"e bassa bile
 * yalnızca biri sırayı alır; kontrol ile yazma arasında boşluk yok.
 * Aralık, bir gönderimin en uzun süresinden (45 sn, bkz. outreach.ts)
 * uzun olduğu için aynı firmaya iki e-posta da gidemez.
 */
export async function siraAl(aralikSn: number): Promise<boolean> {
  const r = await sorguSert(
    `UPDATE gonderim_durumu SET son_deneme = now()
     WHERE id = 1
       AND (son_deneme IS NULL OR son_deneme <= now() - make_interval(secs => $1::int))
       AND (durdu_bitis IS NULL OR durdu_bitis <= now())
     RETURNING id`,
    [aralikSn]
  );
  return r.length > 0;
}

/**
 * Sigortayı atar: gönderim İstanbul'da gün bitene kadar durur, en az 6 saat.
 * 6 saat alt sınırı gece 23:50'de atan sigortanın 10 dakikada kalkmasın diye;
 * barındırma firmalarının hız sınırı penceresi genelde saatlik.
 */
export async function sigortaAt(sebep: string) {
  await sorguSert(
    `UPDATE gonderim_durumu SET
       durdu_bitis = GREATEST(
         (date_trunc('day', now() AT TIME ZONE 'Europe/Istanbul') + interval '1 day') AT TIME ZONE 'Europe/Istanbul',
         now() + interval '6 hours'),
       durdu_sebep = $1
     WHERE id = 1`,
    [sebep.slice(0, 500)]
  );
}

export async function sigortaSifirla() {
  await sorguSert(`UPDATE gonderim_durumu SET durdu_bitis = NULL, durdu_sebep = '' WHERE id = 1`);
}

/** Son iki denemenin sonucu (yeniden eskiye) — "üst üste iki hata" kuralı için. */
export async function sonSonuclar(): Promise<string[]> {
  const r = await sorguSert<{ sonuc: string }>(
    `SELECT sonuc FROM hedef_gonderim ORDER BY zaman DESC, id DESC LIMIT 2`
  );
  return r.map((x) => x.sonuc);
}

/* ---------------------------------------------------------------- yazma */

export async function gonderimKaydet(g: {
  firmaId: number;
  kullanici: string;
  eposta: string;
  konu: string;
  govde: string;
  sonuc: Gonderim["sonuc"];
  yanit: string;
  mesajKimligi?: string;
}) {
  await sorguSert(
    `INSERT INTO hedef_gonderim (firma_id, kullanici, eposta, konu, govde, sonuc, yanit, mesaj_kimligi)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      g.firmaId,
      g.kullanici.slice(0, 80),
      g.eposta.slice(0, 254),
      g.konu.slice(0, 300),
      g.govde.slice(0, 20000),
      g.sonuc,
      g.yanit.slice(0, 1000),
      (g.mesajKimligi ?? "").slice(0, 300),
    ]
  );
}

export async function hedefDurumDegistir(id: number, durum: HedefDurum) {
  await sorguSert(
    `UPDATE hedef_firmalar SET durum = $1, guncellendi = now(),
       gonderildi = CASE WHEN $1 = 'gonderildi' AND gonderildi IS NULL THEN now() ELSE gonderildi END
     WHERE id = $2`,
    [durum, id]
  );
}

export async function hedefNotEkle(firmaId: number, govde: string, yazan: string) {
  await sorguSert(`INSERT INTO hedef_not (firma_id, govde, yazan) VALUES ($1,$2,$3)`, [
    firmaId,
    govde.slice(0, 4000),
    yazan.slice(0, 80),
  ]);
  await sorguSert(`UPDATE hedef_firmalar SET guncellendi = now() WHERE id = $1`, [firmaId]);
}

/* ------------------------------------------------------------ engel listesi */

export async function engelliMi(eposta: string): Promise<boolean> {
  if (!eposta) return false;
  const r = await sorguSert(`SELECT 1 FROM eposta_engel WHERE eposta = lower($1)`, [eposta]);
  return r.length > 0;
}

/**
 * Adresi engel listesine yazar ve o adresi taşıyan, henüz sonuçlanmamış
 * firmaları "Abonelikten çıktı" yapar. Olumlu/İlgilenmiyor gibi sonuçlar
 * korunuyor — bilgi kaybolmasın; engel listesi zaten her gönderimde bakılıyor.
 */
export async function engelle(eposta: string, sebep: string) {
  await sorguSert(
    `INSERT INTO eposta_engel (eposta, sebep) VALUES (lower($1), $2)
     ON CONFLICT (eposta) DO NOTHING`,
    [eposta.trim(), sebep.slice(0, 200)]
  );
  await sorguSert(
    `UPDATE hedef_firmalar SET durum = 'iptal', guncellendi = now()
     WHERE lower(eposta) = lower($1) AND durum IN ('bekliyor', 'gonderildi', 'yanit')`,
    [eposta.trim()]
  );
}

/** Abonelik bağlantısının anahtarından firma — yoksa `null`. */
export async function iptalBul(anahtar: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(anahtar)) return null;
  const r = await sorgu<{ id: number; eposta: string; dil: string }>(
    `SELECT id, eposta, dil FROM hedef_firmalar WHERE iptal_anahtari = $1`,
    [anahtar]
  );
  return r?.[0] ?? null;
}

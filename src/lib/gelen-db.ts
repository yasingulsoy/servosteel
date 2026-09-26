import { sorguSert } from "@/lib/db";

/**
 * Gelen kutusu taramasının veritabanı katmanı (bkz. gelen-tarama.ts).
 * Tablolar outreach-sema.ts'te: gelen_eposta, gelen_tarama.
 */

export type TaramaKaydi = { uidvalidity: number | null; son_uid: number };

/**
 * Kutunun taramasını ALIR: son başlangıçtan bu yana `aralikSn` geçtiyse
 * başlangıcı şimdi yapar ve nereye kadar okunduğunu döner; geçmediyse null.
 * Tek koşullu yazma: iki sayfa açılışı aynı kutuyu aynı anda taramaz.
 */
export async function taramaKilidiAl(kutu: string, aralikSn: number): Promise<TaramaKaydi | null> {
  const r = await sorguSert<{ uidvalidity: string | null; son_uid: string }>(
    `INSERT INTO gelen_tarama (kutu, basladi) VALUES (lower($1), now())
     ON CONFLICT (kutu) DO UPDATE SET basladi = now()
     WHERE gelen_tarama.basladi IS NULL OR gelen_tarama.basladi <= now() - make_interval(secs => $2::int)
     RETURNING uidvalidity::text, son_uid::text`,
    [kutu, aralikSn]
  );
  if (!r.length) return null;
  return { uidvalidity: r[0].uidvalidity === null ? null : Number(r[0].uidvalidity), son_uid: Number(r[0].son_uid) };
}

export async function taramaBitir(kutu: string, uidvalidity: number | null, sonUid: number, hata: string) {
  await sorguSert(
    `UPDATE gelen_tarama SET uidvalidity = $2, son_uid = $3, bitti = now(), son_hata = $4 WHERE kutu = lower($1)`,
    [kutu, uidvalidity, sonUid, hata.slice(0, 500)]
  );
}

export async function gelenIslendiMi(kutu: string, uidvalidity: number, uid: number): Promise<boolean> {
  const r = await sorguSert(
    `SELECT 1 FROM gelen_eposta WHERE kutu = lower($1) AND uidvalidity = $2 AND uid = $3`,
    [kutu, uidvalidity, uid]
  );
  return r.length > 0;
}

export async function gelenKaydet(g: {
  kutu: string;
  uidvalidity: number;
  uid: number;
  mesajKimligi: string;
  kimden: string;
  konu: string;
  tur: string;
  firmaId: number | null;
  ozet: string;
  zaman: Date | null;
}) {
  await sorguSert(
    `INSERT INTO gelen_eposta (kutu, uidvalidity, uid, mesaj_kimligi, kimden, konu, tur, firma_id, ozet, zaman)
     VALUES (lower($1), $2, $3, $4, lower($5), $6, $7, $8, $9, $10)
     ON CONFLICT (kutu, uidvalidity, uid) DO NOTHING`,
    [
      g.kutu,
      g.uidvalidity,
      g.uid,
      g.mesajKimligi.slice(0, 300),
      g.kimden.slice(0, 254),
      g.konu.slice(0, 300),
      g.tur,
      g.firmaId,
      g.ozet.slice(0, 1000),
      g.zaman,
    ]
  );
}

export type Eslesme = { firma_id: number; eposta: string; firma: string; durum: string };

/**
 * Gelen ileti hangi gönderimimize ait? Önce ileti kimliği (In-Reply-To /
 * References = bizim Message-ID'miz), yoksa adres. Yalnızca GERÇEKTEN e-posta
 * gönderdiğimiz firmalar — kutuya düşen reklam ya da başka yazışma eşleşmez.
 */
export async function gonderimeEsle(kimlikler: string[], adresler: string[]): Promise<Eslesme | null> {
  if (!kimlikler.length && !adresler.length) return null;
  const r = await sorguSert<Eslesme>(
    `SELECT g.firma_id, g.eposta, h.firma, h.durum
     FROM hedef_gonderim g JOIN hedef_firmalar h ON h.id = g.firma_id
     WHERE g.sonuc IN ('ok', 'belirsiz', 'alici')
       AND (lower(btrim(g.mesaj_kimligi, '<> ')) = ANY($1::text[]) OR lower(g.eposta) = ANY($2::text[]))
     ORDER BY (lower(btrim(g.mesaj_kimligi, '<> ')) = ANY($1::text[])) DESC, g.zaman DESC
     LIMIT 1`,
    [kimlikler, adresler.map((a) => a.toLowerCase())]
  );
  return r[0] ?? null;
}

/** İlk gönderimin tarihi — ilk taramada o günden bu yana gelenlere bakılır. */
export async function ilkGonderimTarihi(): Promise<Date | null> {
  const r = await sorguSert<{ ilk: Date | null }>(
    `SELECT min(zaman) AS ilk FROM hedef_gonderim WHERE sonuc IN ('ok', 'belirsiz', 'alici')`
  );
  return r[0]?.ilk ?? null;
}

export type GelenDurumu = {
  kutular: { kutu: string; bitti: string | null; basladi: string | null; son_hata: string }[];
  bugun: Record<string, number>;
  son: { kutu: string; kimden: string; konu: string; tur: string; firma_id: number | null; firma: string | null; ozet: string; islendi: string }[];
};

/** Panel için: kutuların son taraması, bugün işlenenler (türüne göre), son eşleşenler. */
export async function gelenDurumu(adet = 6): Promise<GelenDurumu> {
  const [kutular, bugun, son] = await Promise.all([
    sorguSert<{ kutu: string; bitti: string | null; basladi: string | null; son_hata: string }>(
      `SELECT kutu, bitti, basladi, son_hata FROM gelen_tarama ORDER BY kutu`
    ),
    sorguSert<{ tur: string; adet: number }>(
      `SELECT tur, count(*)::int AS adet FROM gelen_eposta
       WHERE islendi >= (date_trunc('day', now() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul')
       GROUP BY tur`
    ),
    sorguSert<GelenDurumu["son"][number]>(
      `SELECT e.kutu, e.kimden, e.konu, e.tur, e.firma_id, h.firma, e.ozet, e.islendi
       FROM gelen_eposta e LEFT JOIN hedef_firmalar h ON h.id = e.firma_id
       WHERE e.tur <> 'ilgisiz'
       ORDER BY e.islendi DESC LIMIT $1`,
      [adet]
    ),
  ]);
  return { kutular, bugun: Object.fromEntries(bugun.map((b) => [b.tur, b.adet])), son };
}

/**
 * Menü rozeti: yanıt vermiş ama henüz elden geçmemiş firma sayısı.
 * "Yanıt geldi" durumu, biri firmayı Olumlu/İlgilenmiyor yapınca düşer —
 * yani rozet "sana bakan iş" demek, "toplam yanıt" değil.
 */
export async function bekleyenYanitSayisi(): Promise<number> {
  const r = await sorguSert<{ adet: string }>(
    `SELECT count(*)::text AS adet FROM hedef_firmalar WHERE durum = 'yanit'`
  );
  return Number(r[0]?.adet ?? 0);
}

/**
 * E-posta istemcisinin Gelen listesi için: taramanın bu iletileri nasıl
 * sınıfladığı (yanıt, geri dönüş, otomatik…) ve hangi hedef firmayla
 * eşlediği. Anahtar uid. uid/uidvalidity BIGINT — metin olarak gelir.
 */
export type GelenSinifi = { tur: string; firma_id: number | null; firma: string | null };

export async function gelenSiniflari(
  kutu: string,
  uidvalidity: number,
  uidler: number[]
): Promise<Map<number, GelenSinifi>> {
  if (!uidler.length || !uidvalidity) return new Map();
  const r = await sorguSert<GelenSinifi & { uid: string }>(
    `SELECT e.uid::text AS uid, e.tur, e.firma_id, h.firma
     FROM gelen_eposta e LEFT JOIN hedef_firmalar h ON h.id = e.firma_id
     WHERE e.kutu = lower($1) AND e.uidvalidity = $2 AND e.uid = ANY($3::bigint[])`,
    [kutu, uidvalidity, uidler]
  );
  return new Map(r.map((x) => [Number(x.uid), { tur: x.tur, firma_id: x.firma_id, firma: x.firma }]));
}

/**
 * Bir adres listesinin hangi hedef firmalara ait olduğu — Gönderilmiş'teki
 * alıcıyı ve okunan iletinin karşı tarafını firma sayfasına bağlamak için.
 */
export async function firmaEslesmeleri(adresler: string[]): Promise<Map<string, { id: number; firma: string }>> {
  const temiz = [...new Set(adresler.map((a) => a.trim().toLowerCase()).filter(Boolean))];
  if (!temiz.length) return new Map();
  const r = await sorguSert<{ eposta: string; id: number; firma: string }>(
    `SELECT DISTINCT ON (lower(eposta)) lower(eposta) AS eposta, id, firma
     FROM hedef_firmalar WHERE lower(eposta) = ANY($1::text[])
     ORDER BY lower(eposta), id`,
    [temiz]
  );
  return new Map(r.map((x) => [x.eposta, { id: x.id, firma: x.firma }]));
}

/**
 * Kutu başına elden geçmemiş yanıt: firması hâlâ "Yanıt geldi"de duran
 * yanıtlar. Biri firmayı Olumlu/İlgilenmiyor yapınca düşer — e-posta
 * menüsündeki rozet "sana bakan iş" demek.
 */
export async function kutuBasinaBekleyenYanit(): Promise<Map<string, number>> {
  const r = await sorguSert<{ kutu: string; adet: string }>(
    `SELECT e.kutu, count(DISTINCT e.firma_id)::text AS adet
     FROM gelen_eposta e JOIN hedef_firmalar h ON h.id = e.firma_id
     WHERE e.tur = 'yanit' AND h.durum = 'yanit'
     GROUP BY e.kutu`
  );
  return new Map(r.map((x) => [x.kutu, Number(x.adet)]));
}

/** Son yanıtlar — genel bakışta; her biri e-posta istemcisinde doğrudan açılır. */
export type YanitSatiri = {
  kutu: string;
  uidvalidity: number;
  uid: number;
  kimden: string;
  konu: string;
  ozet: string;
  islendi: string;
  firma_id: number | null;
  firma: string | null;
  ulke: string | null;
};

export async function sonYanitlar(adet = 5): Promise<YanitSatiri[]> {
  const r = await sorguSert<Omit<YanitSatiri, "uid" | "uidvalidity"> & { uid: string; uidvalidity: string }>(
    `SELECT e.kutu, e.uidvalidity::text, e.uid::text, e.kimden, e.konu, e.ozet, e.islendi, e.firma_id, h.firma, h.ulke
     FROM gelen_eposta e LEFT JOIN hedef_firmalar h ON h.id = e.firma_id
     WHERE e.tur = 'yanit'
     ORDER BY e.islendi DESC LIMIT $1`,
    [Math.min(20, Math.max(1, Math.trunc(adet)))]
  );
  return r.map((x) => ({ ...x, uid: Number(x.uid), uidvalidity: Number(x.uidvalidity) }));
}

export const GELEN_SAYFA_BOYU = 40;
/* uidvalidity + uid: iletinin kutudaki adresi. Gövde burada durmuyor, panelde
   "aç" denince bu ikisiyle kutudan çekiliyor (bkz. posta.ts). */
export type GelenSatiri = GelenDurumu["son"][number] & {
  uid: number;
  uidvalidity: number;
  zaman: string | null;
};

/** "Gelen" sayfası: işlenen iletiler (ilgisizler hariç, istenirse dahil), yeniden eskiye. */
export async function gelenListesi(
  f: { kutu?: string; tur?: string; hepsi?: boolean },
  sayfa = 1
): Promise<{ satirlar: GelenSatiri[]; toplam: number }> {
  const kosul: string[] = [];
  const deger: unknown[] = [];
  if (!f.hepsi) kosul.push(`e.tur <> 'ilgisiz'`);
  if (f.kutu) {
    deger.push(f.kutu.toLowerCase());
    kosul.push(`e.kutu = $${deger.length}`);
  }
  if (f.tur) {
    deger.push(f.tur);
    kosul.push(`e.tur = $${deger.length}`);
  }
  const nerede = kosul.length ? `WHERE ${kosul.join(" AND ")}` : "";
  const s = Math.max(1, Math.floor(sayfa) || 1);
  /* uid ve uidvalidity BIGINT: node-postgres bigint'i METİN döndürüyor
     (taramaKilidiAl'da da öyle). Tipte `number` yazdığı hâlde çalışma
     anında string gelirse iletiyi açan doğrulama "geçersiz" der — 25 Eylül
     2026'da gelen kutusundaki her mail bu yüzden açılmıyordu. */
  const [ham, sayim] = await Promise.all([
    sorguSert<Omit<GelenSatiri, "uid" | "uidvalidity"> & { uid: string; uidvalidity: string }>(
      `SELECT e.kutu, e.uid::text, e.uidvalidity::text, e.kimden, e.konu, e.tur, e.firma_id, h.firma, e.ozet, e.islendi, e.zaman
       FROM gelen_eposta e LEFT JOIN hedef_firmalar h ON h.id = e.firma_id
       ${nerede} ORDER BY e.islendi DESC, e.uid DESC LIMIT ${GELEN_SAYFA_BOYU} OFFSET ${(s - 1) * GELEN_SAYFA_BOYU}`,
      deger
    ),
    sorguSert<{ adet: string }>(`SELECT count(*)::text AS adet FROM gelen_eposta e ${nerede}`, deger),
  ]);
  const satirlar = ham.map((r) => ({ ...r, uid: Number(r.uid), uidvalidity: Number(r.uidvalidity) }));
  return { satirlar, toplam: Number(sayim[0]?.adet ?? 0) };
}

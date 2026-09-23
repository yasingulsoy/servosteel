import { sorgu, sorguSert } from "@/lib/db";
import {
  ENGELLI_ULKELER,
  epostaGecerli,
  sistemAdresiMi,
  type AlanDurumu,
  type GonderenKutusu,
  type KutuDurumu,
} from "@/lib/outreach-kurallar";
import { OUTREACH_SEMA } from "@/lib/outreach-sema";
import { kisaTarih } from "@/lib/zaman";

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

/** Ürün grupları — sitede öne çıkan sıra. Excel betiğindeki KATEGORI_ADI ile aynı. */
export const KATEGORI_ADI: Record<number, string> = {
  1: "Roll form hatları",
  2: "Rulo sac dilme hatları",
  3: "Rulo sac boy kesme hatları",
  4: "Pres besleme sistemleri",
  5: "Kompakt hatlar",
  6: "Diğer",
};
export const KATEGORILER = [1, 2, 3, 4, 5, 6] as const;
/** Öncelikli beş grup — "ekmek yedirecek" olanlar (Yasin 2026-09-22); 6 "Diğer" ayrı durur. */
export const ONCELIKLI = [1, 2, 3, 4, 5] as const;

/** Segment → ürün grubu. scripts/hedef-firma-excel.py SEGMENT_KATEGORI ile AYNI olmalı. */
export const SEGMENT_GRUBU: Record<string, number> = {
  "Kablo Kanalı": 1, "Solar Profil": 1, "Raf Sistemleri": 1, "İskele Kalası": 1,
  "Yol Bariyeri": 1, "Gürültü Bariyeri": 1, "Çatı ve Cephe Paneli": 1, "Aşık ve Çelik Yapı": 1,
  "Çelik Servis Merkezi": 2,
  "Pres Atölyeleri": 4, "Çelik Mobilya": 4,
  "Havalandırma Kanalı": 5,
  "Alçıpan Profili": 6, "Market Rafı": 6,
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
  /** İkinci tur (hatırlatma) metni — ilk mektuba dönüş gelmeyen firmaya */
  konu2: string;
  govde2: string;
  link: string;
  durum: HedefDurum;
  listede: boolean;
  iptal_anahtari: string;
  gonderildi: string | null;
  olusturuldu: string;
  guncellendi: string;
  aktarildi: string;
  kategori: number;
  kategori_notu: string;
  sira: number;
  kesif: boolean;
};

export type HedefSatiri = Pick<
  HedefFirma,
  "id" | "firma" | "ulke" | "segmentler" | "eposta" | "dil" | "durum" | "gonderildi" | "listede" | "kategori" | "kesif"
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
  /** Hangi kutudan (tek kutulu dönemde boş) */
  gonderen: string;
  /** Giden HTML hâli (2026-09-22'den önce boş) */
  govde_html: string;
};

export type HedefNot = {
  id: number;
  firma_id: number;
  olusturuldu: string;
  yazan: string;
  govde: string;
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
export function firmaEngeli(
  f: HedefFirma,
  engelli: boolean,
  /** Bu adrese BAŞKA bir firma satırından giden e-posta (bkz. ayniAdreseGiden) */
  onceki: AyniAdres | null = null,
  /** 1 ilk tanıtım · 2 hatırlatma (ilk mektuba dönüş gelmemiş firmaya) */
  tur: 1 | 2 = 1
): string | null {
  if (!f.listede) return "Firma son aktarımda listede yoktu (elenmiş olabilir).";
  if (tur === 2) {
    /* İkinci tur yalnızca "yazdık, hiçbir şey dönmedi" durumundaki firmaya gider.
       Yanıt geldiyse durum "yanit", geri döndüyse "hatali", çıktıysa "iptal" olur
       — üçü de burada elenir. */
    if (f.durum !== "gonderildi") {
      return `Durumu "${HEDEF_DURUM_ETIKET[f.durum] ?? f.durum}" — hatırlatma yalnızca dönüş gelmemiş firmaya yazılır.`;
    }
  } else if (f.durum !== "bekliyor") {
    return `Durumu "${HEDEF_DURUM_ETIKET[f.durum] ?? f.durum}" — yalnızca gönderilmemiş firmaya yazılır.`;
  }
  if (!f.eposta) return "E-posta adresi yok (sitede doğrulanamadı). Telefon ya da iletişim formu.";
  if (!epostaGecerli(f.eposta)) return `E-posta adresi geçersiz görünüyor: ${f.eposta}`;
  if (sistemAdresiMi(f.eposta)) return `${f.eposta} bir sistem adresi (kimse okumaz) — iletişim formu ya da telefon.`;
  if (ENGELLI_ULKELER[f.ulke]) return ENGELLI_ULKELER[f.ulke];
  if (engelli) return "Bu adres engel listesinde (abonelikten çıktı ya da elle engellendi).";
  if (tur === 2) {
    if (!f.konu2.trim() || !f.govde2.trim()) return "Hatırlatma metni yok.";
    return null;
  }
  if (onceki) {
    return `Bu adrese ${kisaTarih(onceki.zaman)} tarihinde "${onceki.firma}" satırından yazıldı — aynı adrese ikinci tanıtım e-postası gitmez.`;
  }
  if (!f.konu.trim() || !f.govde.trim()) return "Hazır e-posta metni yok.";
  return null;
}

/* SQL karşılığı: gönderilebilir firmalar. Günlük listede ve "sıradaki" düğmesinde.
   Son satır: aynı adres başka bir firma satırında da olabilir (keşifte bir site
   birden çok ülkenin aramasında çıkıyor) — adrese bir kez yazılır. */
const GONDERILEBILIR = `
  h.listede AND h.durum = 'bekliyor' AND h.eposta <> '' AND h.konu <> ''
  AND NOT (h.ulke = ANY($1::text[]))
  AND NOT EXISTS (SELECT 1 FROM eposta_engel e WHERE e.eposta = lower(h.eposta))
  AND NOT EXISTS (SELECT 1 FROM hedef_gonderim g
                  WHERE lower(g.eposta) = lower(h.eposta) AND g.sonuc IN ('ok', 'belirsiz'))
`;

/* SQL karşılığı: hatırlatma (ikinci tur) gönderilebilir firmalar. İlk turdan
   FARKLI üç koşul: durum "gonderildi" (yanıt/geri dönüş/çıkış hepsi durumu
   değiştirir, üçü de burada elenir), hatırlatma metni hazır, ve ilk mektubun
   üstünden yeterince gün geçmiş. Aynı adrese ikinci hatırlatma gitmez. */
const IKINCI_TUR = (gunParam: string) => `
  h.listede AND h.durum = 'gonderildi' AND h.eposta <> '' AND h.govde2 <> '' AND h.konu2 <> ''
  AND NOT (h.ulke = ANY($1::text[]))
  AND NOT EXISTS (SELECT 1 FROM eposta_engel e WHERE e.eposta = lower(h.eposta))
  AND NOT EXISTS (SELECT 1 FROM hedef_gonderim g
                  WHERE lower(g.eposta) = lower(h.eposta) AND g.tur >= 2 AND g.sonuc IN ('ok', 'belirsiz'))
  AND EXISTS (SELECT 1 FROM hedef_gonderim g
              WHERE lower(g.eposta) = lower(h.eposta) AND g.sonuc IN ('ok', 'belirsiz')
                AND g.zaman < now() - (${gunParam} || ' days')::interval)
`;

/** Hatırlatmadan önce beklenen gün. Üç hafta: erken hatırlatma rahatsız eder. */
export const IKINCI_TUR_GUN = 21;

export type OtomatikKapsam = { gruplar: number[]; abDahil: boolean; kesifDahil: boolean; abUlkeleri: string[] };
export type OtomatikSiradaki = Pick<HedefFirma, "id" | "firma" | "ulke" | "eposta" | "kategori" | "kesif" | "segmentler">;

/**
 * Otomatik gönderimin sıradaki firmaları — elle gönderimle AYNI "gönderilebilir"
 * kuralı + otomatiğin kapsamı: seçili gruplar, AB ülkeleri (varsayılan hariç),
 * otomatik keşif firmaları.
 *
 * Sıra artık hedefin KENDİ saatine bakıyor: yerel sabahı (08-11) olan ülkeler
 * önce, mesaisi (11-17) olanlar sonra, gecesi ya da hafta sonu olan en sonda.
 * Eşitlikte panel sırası (ürün grubu önce). Hiçbir firma elenmiyor, yalnızca
 * sıralanıyor — pencere 24 saate açıldığında e-posta alıcının sabahına denk
 * gelsin diye (bkz. saat-dilimi.ts).
 */
export async function otomatikSiradakiler(
  k: OtomatikKapsam,
  adet: number,
  oncelik: { sabah: string[]; mesai: string[] } = { sabah: [], mesai: [] }
): Promise<OtomatikSiradaki[]> {
  if (!k.gruplar.length || adet <= 0) return [];
  return sorguSert<OtomatikSiradaki>(
    `SELECT h.id, h.firma, h.ulke, h.eposta, h.kategori, h.kesif, h.segmentler
     FROM hedef_firmalar h
     WHERE ${GONDERILEBILIR}
       AND h.kategori = ANY($2::int[])
       AND ($3::boolean OR NOT (h.ulke = ANY($4::text[])))
       AND ($5::boolean OR NOT h.kesif)
     ORDER BY CASE WHEN h.ulke = ANY($7::text[]) THEN 0
                   WHEN h.ulke = ANY($8::text[]) THEN 1
                   ELSE 2 END,
              h.sira, h.id
     LIMIT $6`,
    [
      engelliUlkeler(),
      k.gruplar,
      k.abDahil,
      k.abUlkeleri,
      k.kesifDahil,
      Math.min(200, adet),
      oncelik.sabah,
      oncelik.mesai,
    ]
  );
}

/**
 * Hatırlatma (ikinci tur) sırasındaki firmalar. Otomatik gönderim buraya ANCAK
 * ilk tur bittiğinde düşer: sıra boşalınca liste başa sarar ama aynı mektup
 * tekrar gitmez — ikinci turun kendi metni var (hedef_firmalar.govde2).
 *
 * Sıralama ilk turunkiyle aynı mantıkta: hedefin kendi sabahı önce. Eşitlikte
 * EN ESKİ ilk mektup önce — en uzun bekleyen firma sıranın başında.
 */
export async function ikinciTurAdaylari(
  k: OtomatikKapsam,
  adet: number,
  oncelik: { sabah: string[]; mesai: string[] } = { sabah: [], mesai: [] },
  gun = IKINCI_TUR_GUN
): Promise<OtomatikSiradaki[]> {
  if (!k.gruplar.length || adet <= 0) return [];
  return sorguSert<OtomatikSiradaki>(
    `SELECT h.id, h.firma, h.ulke, h.eposta, h.kategori, h.kesif, h.segmentler
     FROM hedef_firmalar h
     WHERE ${IKINCI_TUR("$9")}
       AND h.kategori = ANY($2::int[])
       AND ($3::boolean OR NOT (h.ulke = ANY($4::text[])))
       AND ($5::boolean OR NOT h.kesif)
     ORDER BY CASE WHEN h.ulke = ANY($7::text[]) THEN 0
                   WHEN h.ulke = ANY($8::text[]) THEN 1
                   ELSE 2 END,
              h.gonderildi, h.id
     LIMIT $6`,
    [
      engelliUlkeler(),
      k.gruplar,
      k.abDahil,
      k.abUlkeleri,
      k.kesifDahil,
      Math.min(200, adet),
      oncelik.sabah,
      oncelik.mesai,
      String(Math.max(1, Math.trunc(gun))),
    ]
  );
}

/** Hatırlatma sırasında kaç firma var — panelde ve tur sonucunda gösterilir. */
export async function ikinciTurSayisi(k: OtomatikKapsam, gun = IKINCI_TUR_GUN): Promise<number> {
  if (!k.gruplar.length) return 0;
  const r = await sorguSert<{ adet: string }>(
    `SELECT count(*)::text AS adet FROM hedef_firmalar h
     WHERE ${IKINCI_TUR("$6")}
       AND h.kategori = ANY($2::int[])
       AND ($3::boolean OR NOT (h.ulke = ANY($4::text[])))
       AND ($5::boolean OR NOT h.kesif)`,
    [engelliUlkeler(), k.gruplar, k.abDahil, k.abUlkeleri, k.kesifDahil, String(Math.max(1, Math.trunc(gun)))]
  );
  return Number(r[0]?.adet ?? 0);
}

export type AyniAdres = { firma: string; zaman: string };

/**
 * Bu adrese başka bir firma satırından gitmiş (ya da gitmiş olabilecek) son e-posta.
 * Aynı satırdan gideni durum zaten yakalıyor ("Gönderildi").
 */
export async function ayniAdreseGiden(eposta: string, firmaId: number): Promise<AyniAdres | null> {
  if (!eposta) return null;
  const r = await sorguSert<AyniAdres>(
    `SELECT COALESCE(h.firma, '(silinmiş firma)') AS firma, g.zaman
     FROM hedef_gonderim g LEFT JOIN hedef_firmalar h ON h.id = g.firma_id
     WHERE lower(g.eposta) = lower($1) AND g.sonuc IN ('ok', 'belirsiz')
       AND g.firma_id IS DISTINCT FROM $2
     ORDER BY g.zaman DESC LIMIT 1`,
    [eposta, firmaId]
  );
  return r[0] ?? null;
}
const engelliUlkeler = () => Object.keys(ENGELLI_ULKELER);

/* ----------------------------------------------------------------- liste */

export type HedefFiltre = {
  /** ürün grubu 1-6 */
  grup?: string;
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
  if (f.grup && /^[1-6]$/.test(f.grup)) {
    deger.push(Number(f.grup));
    kosul.push(`h.kategori = $${deger.length}`);
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
      `SELECT h.id, h.firma, h.ulke, h.segmentler, h.eposta, h.dil, h.durum, h.gonderildi, h.listede,
              h.kategori, h.kesif
       FROM hedef_firmalar h ${nerede}
       ORDER BY h.sira, h.id
       LIMIT ${SAYFA_BOYU} OFFSET ${(s - 1) * SAYFA_BOYU}`,
      deger
    ),
    sorguSert<{ adet: string }>(`SELECT count(*)::text AS adet FROM hedef_firmalar h ${nerede}`, deger),
  ]);
  return { satirlar, toplam: Number(sayim[0]?.adet ?? 0) };
}

/**
 * Süzgeçteki bir sonraki gönderilebilir firma — panel sırasıyla (ürün grubu önce);
 * `sonra` verilirse o firmadan sonraki.
 */
export async function siradaki(f: HedefFiltre, sonra = 0): Promise<number | null> {
  const { nerede, deger } = kosullar({ ...f, durum: undefined, goster: "gonderilebilir" });
  let ek = "";
  if (sonra) {
    deger.push(sonra);
    ek = ` AND (h.sira, h.id) > (SELECT x.sira, x.id FROM hedef_firmalar x WHERE x.id = $${deger.length})`;
  }
  const r = await sorguSert<{ id: number }>(
    `SELECT h.id FROM hedef_firmalar h ${nerede}${ek} ORDER BY h.sira, h.id LIMIT 1`,
    deger
  );
  return r[0]?.id ?? null;
}

export async function hedefFirma(id: number): Promise<HedefFirma | null> {
  const r = await sorguSert<HedefFirma>(`SELECT * FROM hedef_firmalar WHERE id = $1`, [id]);
  return r[0] ?? null;
}

export type HedefOzeti = {
  /** ürün grubu → firma sayısı (listede) */
  grup: Record<number, number>;
  toplam: number;
  epostali: number;
  gonderilebilir: number;
  /** E-postası en az bir kez gitmiş (ya da gitmiş olabilecek) firma sayısı */
  gonderilen: number;
  durum: Record<string, number>;
};

export async function hedefOzeti(): Promise<HedefOzeti> {
  const [genel, durumlar, giden, gruplar] = await Promise.all([
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
    sorguSert<{ kategori: number; adet: string }>(
      `SELECT kategori, count(*)::text AS adet FROM hedef_firmalar WHERE listede GROUP BY kategori`
    ),
  ]);
  return {
    grup: Object.fromEntries(gruplar.map((g) => [Number(g.kategori), Number(g.adet)])),
    toplam: Number(genel[0]?.toplam ?? 0),
    epostali: Number(genel[0]?.epostali ?? 0),
    gonderilebilir: Number(genel[0]?.gonderilebilir ?? 0),
    gonderilen: Number(giden[0]?.adet ?? 0),
    durum: Object.fromEntries(durumlar.map((d) => [d.durum, Number(d.adet)])),
  };
}

export type GrupOzeti = {
  kategori: number;
  toplam: number;
  gonderilebilir: number;
  gonderilen: number;
  yanit: number;
  talep: number;
  /** grubun sıradaki gönderilebilir firması */
  siradaki: number | null;
};

/** Grup kartları: her ürün grubunda kaç firma, kaçı gönderilebilir, ne kadar ilerlendi. */
export async function grupOzeti(): Promise<GrupOzeti[]> {
  const [ana, talep] = await Promise.all([
    sorguSert<Omit<GrupOzeti, "talep">>(
      `WITH g AS (
         SELECT h.kategori,
                count(*)::int AS toplam,
                count(*) FILTER (WHERE ${GONDERILEBILIR})::int AS gonderilebilir,
                count(*) FILTER (WHERE EXISTS (SELECT 1 FROM hedef_gonderim x
                  WHERE x.firma_id = h.id AND x.sonuc IN ('ok', 'belirsiz')))::int AS gonderilen,
                count(*) FILTER (WHERE h.durum IN ('yanit', 'olumlu', 'red'))::int AS yanit
         FROM hedef_firmalar h WHERE h.listede GROUP BY h.kategori),
       s AS (
         SELECT DISTINCT ON (h.kategori) h.kategori, h.id AS siradaki
         FROM hedef_firmalar h WHERE ${GONDERILEBILIR}
         ORDER BY h.kategori, h.sira, h.id)
       SELECT g.*, s.siradaki FROM g LEFT JOIN s USING (kategori) ORDER BY g.kategori`,
      [engelliUlkeler()]
    ),
    /* talepler tablosu hiç talep gelmemiş kurulumda olmayabilir — hata değil, sıfır */
    sorgu<{ kategori: number; talep: number }>(
      `SELECT h.kategori, count(DISTINCT h.id)::int AS talep
       FROM hedef_firmalar h JOIN talepler t ON ${TALEP_ESLES}
       WHERE t.durum <> 'spam'
         AND EXISTS (SELECT 1 FROM hedef_gonderim x WHERE x.firma_id = h.id AND x.sonuc IN ('ok', 'belirsiz'))
       GROUP BY h.kategori`
    ),
  ]);
  const t = new Map((talep ?? []).map((x) => [Number(x.kategori), x.talep]));
  return ana.map((g) => ({ ...g, kategori: Number(g.kategori), talep: t.get(Number(g.kategori)) ?? 0 }));
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

export const GIDEN_SAYFA_BOYU = 40;

/** "Giden" sayfası: bütün gönderim denemeleri, yeniden eskiye; kutuya ve sonuca göre süzülür. */
export async function gidenListesi(
  f: { kutu?: string; sonuc?: string },
  sayfa = 1
): Promise<{ satirlar: (Gonderim & { firma: string | null })[]; toplam: number }> {
  const kosul: string[] = [];
  const deger: unknown[] = [];
  if (f.kutu) {
    deger.push(f.kutu.toLowerCase());
    kosul.push(`lower(g.gonderen) = $${deger.length}`);
  }
  if (f.sonuc && ["ok", "hata", "alici", "belirsiz"].includes(f.sonuc)) {
    deger.push(f.sonuc);
    kosul.push(`g.sonuc = $${deger.length}`);
  }
  const nerede = kosul.length ? `WHERE ${kosul.join(" AND ")}` : "";
  const s = Math.max(1, Math.floor(sayfa) || 1);
  const [satirlar, sayim] = await Promise.all([
    sorguSert<Gonderim & { firma: string | null }>(
      `SELECT g.*, h.firma FROM hedef_gonderim g LEFT JOIN hedef_firmalar h ON h.id = g.firma_id
       ${nerede} ORDER BY g.zaman DESC, g.id DESC LIMIT ${GIDEN_SAYFA_BOYU} OFFSET ${(s - 1) * GIDEN_SAYFA_BOYU}`,
      deger
    ),
    sorguSert<{ adet: string }>(`SELECT count(*)::text AS adet FROM hedef_gonderim g ${nerede}`, deger),
  ]);
  return { satirlar, toplam: Number(sayim[0]?.adet ?? 0) };
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

/* ---------------------------------- günlük tavan, aralık, sigorta — KUTU başına */

/* İstanbul'da bugünün başı. Sunucu UTC'de çalışıyor; "bugün" İstanbul günü. */
const BUGUN_BASI = `(date_trunc('day', now() AT TIME ZONE 'Europe/Istanbul') AT TIME ZONE 'Europe/Istanbul')`;

/**
 * Bugün giden bütün tanıtım e-postaları (bütün kutular): başarılı + belirsiz
 * (zaman aşımı — gitmiş olabilir). Alıcı reddi ve bağlantı hatası sayılmaz,
 * çünkü e-posta sunucumuzdan hiç çıkmadı.
 */
export async function bugunGonderilen(): Promise<number> {
  const r = await sorguSert<{ adet: string }>(
    `SELECT count(*)::text AS adet FROM hedef_gonderim
     WHERE sonuc IN ('ok', 'belirsiz') AND zaman >= ${BUGUN_BASI}`
  );
  return Number(r[0]?.adet ?? 0);
}

/**
 * Kutuların ve alan adlarının anlık durumu — kutu seçimi (kutuSec) bunu okur.
 *
 * Alan adı sayımı o alan adındaki BÜTÜN gönderimleri kapsar, bugün tanımlı
 * olmayan (çıkarılmış) kutularınkini de: itibar alan adında birikiyor,
 * kutuyu kaldırmak alan adının bugün gönderdiğini sıfırlamaz.
 */
export async function kutuDurumlari(
  kutular: GonderenKutusu[]
): Promise<{ kutu: Record<string, KutuDurumu>; alan: Record<string, AlanDurumu> }> {
  const adresler = kutular.map((k) => k.user);
  const alanlar = [...new Set(kutular.map((k) => k.alan))];
  const [gonderim, durum, alan] = await Promise.all([
    sorguSert<{ gonderen: string; bugun: number; ilk_gun: number | null }>(
      `SELECT lower(gonderen) AS gonderen,
              count(*) FILTER (WHERE zaman >= ${BUGUN_BASI})::int AS bugun,
              ((now() AT TIME ZONE 'Europe/Istanbul')::date
                 - (min(zaman) AT TIME ZONE 'Europe/Istanbul')::date) AS ilk_gun
       FROM hedef_gonderim
       WHERE sonuc IN ('ok', 'belirsiz') AND lower(gonderen) = ANY($1::text[])
       GROUP BY 1`,
      [adresler]
    ),
    sorguSert<{ gonderen: string; gecen_sn: number | null; durdu: boolean; durdu_bitis: string | null; durdu_sebep: string }>(
      `SELECT gonderen,
              extract(epoch FROM now() - son_deneme)::float8 AS gecen_sn,
              COALESCE(durdu_bitis > now(), false) AS durdu,
              durdu_bitis, durdu_sebep
       FROM gonderen_durumu WHERE gonderen = ANY($1::text[])`,
      [adresler]
    ),
    sorguSert<{ alan: string; bugun: number; ilk_gun: number | null }>(
      `SELECT lower(split_part(gonderen, '@', 2)) AS alan,
              count(*) FILTER (WHERE zaman >= ${BUGUN_BASI})::int AS bugun,
              ((now() AT TIME ZONE 'Europe/Istanbul')::date
                 - (min(zaman) AT TIME ZONE 'Europe/Istanbul')::date) AS ilk_gun
       FROM hedef_gonderim
       WHERE sonuc IN ('ok', 'belirsiz') AND lower(split_part(gonderen, '@', 2)) = ANY($1::text[])
       GROUP BY 1`,
      [alanlar]
    ),
  ]);

  const kutu: Record<string, KutuDurumu> = {};
  for (const a of adresler) {
    const g = gonderim.find((x) => x.gonderen === a);
    const d = durum.find((x) => x.gonderen === a);
    kutu[a] = {
      bugun: g?.bugun ?? 0,
      ilkGun: g?.ilk_gun === null || g?.ilk_gun === undefined ? null : Number(g.ilk_gun),
      gecenSn: d?.gecen_sn === null || d?.gecen_sn === undefined ? null : Number(d.gecen_sn),
      durdu: d?.durdu ?? false,
      durduBitis: d?.durdu_bitis ?? null,
      durduSebep: d?.durdu_sebep ?? "",
    };
  }
  const alanSonuc: Record<string, AlanDurumu> = {};
  for (const a of alanlar) {
    const x = alan.find((y) => y.alan === a);
    alanSonuc[a] = {
      bugun: x?.bugun ?? 0,
      ilkGun: x?.ilk_gun === null || x?.ilk_gun === undefined ? null : Number(x.ilk_gun),
    };
  }
  return { kutu, alan: alanSonuc };
}

/**
 * Son 50 gönderilen firmadan kaçı "Adres hatalı" — geri dönüş eşiği için.
 * Gönderim sonrası elle işaretlenen (geri dönen) ve gönderimde reddedilen
 * adresler birlikte sayılır. Kutudan bağımsız: kirli liste her kutuda kirli.
 */
export async function geriDonusDurumu(): Promise<{ toplam: number; hatali: number }> {
  const r = await sorguSert<{ toplam: number; hatali: number }>(
    `WITH son AS (
       SELECT firma_id, max(zaman) AS zaman FROM hedef_gonderim
       WHERE sonuc IN ('ok', 'belirsiz', 'alici') AND firma_id IS NOT NULL
       GROUP BY firma_id ORDER BY max(zaman) DESC LIMIT 50)
     SELECT count(*)::int AS toplam, count(*) FILTER (WHERE h.durum = 'hatali')::int AS hatali
     FROM son JOIN hedef_firmalar h ON h.id = son.firma_id`
  );
  return { toplam: r[0]?.toplam ?? 0, hatali: r[0]?.hatali ?? 0 };
}

/**
 * Kutunun gönderim sırasını ALIR: o kutunun son denemesinden bu yana
 * `aralikSn` geçtiyse ve kutunun sigortası atık değilse son deneme zamanını
 * şimdi yapar ve `true` döner.
 *
 * Tek bir koşullu INSERT … ON CONFLICT — iki kişi aynı saniyede "Gönder"e
 * bassa bile aynı kutuyu yalnızca biri alır; kontrol ile yazma arasında
 * boşluk yok. Aralık, bir gönderimin en uzun süresinden (45 sn, bkz.
 * outreach.ts) uzun olduğu için aynı kutudan üst üste iki gönderim de
 * çakışamaz. Farklı kutular birbirini beklemez.
 */
export async function siraAl(gonderen: string, aralikSn: number): Promise<boolean> {
  const r = await sorguSert(
    `INSERT INTO gonderen_durumu (gonderen, son_deneme) VALUES (lower($1), now())
     ON CONFLICT (gonderen) DO UPDATE SET son_deneme = now()
     WHERE (gonderen_durumu.son_deneme IS NULL
            OR gonderen_durumu.son_deneme <= now() - make_interval(secs => $2::int))
       AND (gonderen_durumu.durdu_bitis IS NULL OR gonderen_durumu.durdu_bitis <= now())
     RETURNING gonderen`,
    [gonderen, aralikSn]
  );
  return r.length > 0;
}

/**
 * Sigortayı atar: verilen kutulardan gönderim İstanbul'da gün bitene kadar
 * durur, en az 6 saat. 6 saat alt sınırı gece 23:50'de atan sigortanın 10
 * dakikada kalkmasın diye; barındırma firmalarının hız sınırı penceresi
 * genelde saatlik. Kimin durduğuna çağıran karar verir (bkz. SigortaKapsami).
 */
export async function sigortaAt(gonderenler: string[], sebep: string) {
  if (!gonderenler.length) return;
  await sorguSert(
    `INSERT INTO gonderen_durumu (gonderen, durdu_bitis, durdu_sebep)
     SELECT lower(g), GREATEST(
              (date_trunc('day', now() AT TIME ZONE 'Europe/Istanbul') + interval '1 day') AT TIME ZONE 'Europe/Istanbul',
              now() + interval '6 hours'),
            $2
     FROM unnest($1::text[]) AS g
     ON CONFLICT (gonderen) DO UPDATE SET durdu_bitis = EXCLUDED.durdu_bitis, durdu_sebep = EXCLUDED.durdu_sebep`,
    [gonderenler, sebep.slice(0, 500)]
  );
}

/** Bütün kutuların sigortasını kaldırır; kaldırılanların sebeplerini döner (kayıt için). */
export async function sigortaSifirla(): Promise<string[]> {
  const r = await sorguSert<{ gonderen: string; durdu_sebep: string }>(
    `WITH eski AS (
       SELECT gonderen, durdu_sebep FROM gonderen_durumu WHERE durdu_bitis > now() FOR UPDATE)
     UPDATE gonderen_durumu g SET durdu_bitis = NULL, durdu_sebep = ''
     FROM eski WHERE g.gonderen = eski.gonderen
     RETURNING g.gonderen, eski.durdu_sebep`
  );
  return r.map((x) => `${x.gonderen}: ${x.durdu_sebep}`);
}

/** Bu kutunun son iki denemesinin sonucu (yeniden eskiye) — "üst üste iki hata" kuralı için. */
export async function sonSonuclar(gonderen: string): Promise<string[]> {
  const r = await sorguSert<{ sonuc: string }>(
    `SELECT sonuc FROM hedef_gonderim WHERE lower(gonderen) = lower($1) ORDER BY zaman DESC, id DESC LIMIT 2`,
    [gonderen]
  );
  return r.map((x) => x.sonuc);
}

/* ---------------------------------------------------------------- yazma */

export async function gonderimKaydet(g: {
  firmaId: number;
  kullanici: string;
  /** Gönderen kutu (tam adres) */
  gonderen: string;
  eposta: string;
  konu: string;
  govde: string;
  govdeHtml?: string;
  sonuc: Gonderim["sonuc"];
  yanit: string;
  mesajKimligi?: string;
  /** 1 ilk tanıtım · 2 hatırlatma */
  tur?: 1 | 2;
}) {
  await sorguSert(
    `INSERT INTO hedef_gonderim (firma_id, kullanici, eposta, konu, govde, sonuc, yanit, mesaj_kimligi, gonderen, govde_html, tur)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,lower($9),$10,$11)`,
    [
      g.firmaId,
      g.kullanici.slice(0, 80),
      g.eposta.slice(0, 254),
      g.konu.slice(0, 300),
      g.govde.slice(0, 20000),
      g.sonuc,
      g.yanit.slice(0, 1000),
      (g.mesajKimligi ?? "").slice(0, 300),
      g.gonderen.slice(0, 254),
      (g.govdeHtml ?? "").slice(0, 60000),
      g.tur ?? 1,
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

/* ------------------------------------------------------ talebe dönüşüm */

/**
 * Hedef firmadan gelen talepler — e-postanın asıl ölçüsü.
 *
 * Eşleşme iki yoldan: talebi gönderenin e-posta alan adı firmanın alan adı
 * (anahtarın ilk parçası, ör. "firma.com.mx") ya da talep formunun açıldığı
 * sayfa adresinde e-postadaki bağlantının `utm_content=<alan adı>` izi
 * (api/talep, Referer'ı `sayfa` olarak kaydediyor). Ücretsiz posta adresli
 * firmalar yalnızca ikinci yoldan eşleşir — gmail.com alan adıyla eşleştirmek
 * herkesi eşleştirirdi; anahtardaki alan adı firmanın SİTESİ, e-postası değil.
 */
const TALEP_ESLES = `
  (lower(split_part(t.eposta, '@', 2)) = split_part(h.anahtar, '|', 1)
   OR lower(split_part(t.eposta, '@', 2)) LIKE '%.' || split_part(h.anahtar, '|', 1)
   OR lower(t.sayfa) LIKE '%utm_content=' || split_part(h.anahtar, '|', 1) || '&%'
   OR lower(t.sayfa) LIKE '%utm_content=' || split_part(h.anahtar, '|', 1))
`;

export type HedefTalebi = { id: number; olusturuldu: string; ad: string; eposta: string; tur: string };

export async function hedefTalepleri(firmaId: number): Promise<HedefTalebi[]> {
  const r = await sorgu<HedefTalebi>(
    `SELECT t.id, t.olusturuldu, t.ad, t.eposta, t.tur
     FROM hedef_firmalar h JOIN talepler t ON ${TALEP_ESLES}
     WHERE h.id = $1 AND t.durum <> 'spam'
     ORDER BY t.olusturuldu DESC`,
    [firmaId]
  );
  return r ?? [];   // talepler tablosu yoksa (hiç talep gelmemiş kurulum) boş
}

/** Gönderim yapılmış firmalardan kaçı sonradan talep bıraktı. */
export async function talebeDonen(): Promise<number> {
  const r = await sorgu<{ adet: number }>(
    `SELECT count(DISTINCT h.id)::int AS adet
     FROM hedef_firmalar h JOIN talepler t ON ${TALEP_ESLES}
     WHERE t.durum <> 'spam'
       AND EXISTS (SELECT 1 FROM hedef_gonderim g WHERE g.firma_id = h.id AND g.sonuc IN ('ok', 'belirsiz'))`
  );
  return r?.[0]?.adet ?? 0;
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

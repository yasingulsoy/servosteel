"use server";

import { redirect } from "next/navigation";
import { alanAdi, epostaAlanAdi, gun, metin, sayi, webAdresi } from "@/lib/bicim";
import { islem, sorgu, tek } from "@/lib/db";
import { kayitEkle } from "@/lib/kayit";
import { yazarZorunlu, yoneticiZorunlu } from "@/lib/oturum";
import { FIRMA_DURUMU, gecerli, KANAL, POTANSIYEL, TAKIP } from "@/lib/sabitler";
import { bolgesi } from "@/lib/ulkeler";

/** Formdaki ilgi kutuları; yalnız tabloda olan kodlar yazılır (yabancı anahtar korur). */
const ilgiKodlari = (fd: FormData) =>
  [...new Set(fd.getAll("ilgi").filter((v): v is string => typeof v === "string" && /^[a-z0-9-]{2,40}$/.test(v)))];

function firmaAlanlari(fd: FormData) {
  const web = webAdresi(metin(fd, "web", 300));
  const ulke = metin(fd, "ulke", 80);
  return {
    ad: metin(fd, "firma_ad", 200),
    web,
    ulke,
    bolge: metin(fd, "bolge", 80) ?? bolgesi(ulke),
    sehir: metin(fd, "sehir", 120),
    sektor: metin(fd, "sektor", 160),
    faaliyet: metin(fd, "faaliyet", 1000),
    potansiyel: gecerli(POTANSIYEL, fd.get("potansiyel"), "belirsiz"),
  };
}

function kisiAlanlari(fd: FormData) {
  const eposta = metin(fd, "eposta", 200)?.toLowerCase() ?? null;
  return {
    ad: metin(fd, "kisi_ad", 160) ?? eposta,
    unvan: metin(fd, "unvan", 160),
    eposta,
    eposta2: metin(fd, "eposta2", 200)?.toLowerCase() ?? null,
    telefon: metin(fd, "telefon", 60),
  };
}

/**
 * Tek formdan firma + kurum yetkilisi + görüşme. Fuarda art arda kayıt girmek
 * için: aynı alan adlı ya da aynı adlı firma varsa YENİSİ AÇILMAZ, kişi ve
 * görüşme mevcut firmaya eklenir; firmanın boş alanları doldurulur.
 */
export async function hizliKayit(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const f = firmaAlanlari(fd);
  if (!f.ad) throw new Error("Firma adı gerekli.");
  const k = kisiAlanlari(fd);
  const alan = alanAdi(f.web) ?? epostaAlanAdi(k.eposta);
  const etkinlikId = sayi(fd.get("etkinlik_id"));
  const talep = metin(fd, "talep", 2000);
  const takip = gecerli(TAKIP, fd.get("takip"), "gorusuldu");
  const kanal = gecerli(KANAL, fd.get("kanal"), etkinlikId ? "fuar" : "diger");
  const not = metin(fd, "not", 4000);
  const ilgiler = ilgiKodlari(fd);

  const { firmaId, mevcut } = await islem(async (b) => {
    const var_ = (
      await b.query<{ id: number }>(
        `SELECT id FROM crm_firma
          WHERE ($1::text IS NOT NULL AND alan_adi = $1) OR lower(ad) = lower($2)
          ORDER BY (alan_adi = $1) DESC NULLS LAST, id LIMIT 1`,
        [alan, f.ad]
      )
    ).rows[0];

    let firmaId: number;
    if (var_) {
      firmaId = var_.id;
      await b.query(
        `UPDATE crm_firma SET
           web = COALESCE(web, $2), alan_adi = COALESCE(alan_adi, $3), ulke = COALESCE(ulke, $4),
           bolge = COALESCE(bolge, $5), sehir = COALESCE(sehir, $6), sektor = COALESCE(sektor, $7),
           faaliyet = COALESCE(faaliyet, $8),
           potansiyel = CASE WHEN $9 <> 'belirsiz' THEN $9 ELSE potansiyel END,
           guncellendi = now()
         WHERE id = $1`,
        [firmaId, f.web, alan, f.ulke, f.bolge, f.sehir, f.sektor, f.faaliyet, f.potansiyel]
      );
    } else {
      firmaId = (
        await b.query<{ id: number }>(
          `INSERT INTO crm_firma (ad, web, alan_adi, ulke, bolge, sehir, sektor, faaliyet, potansiyel, olusturan)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [f.ad, f.web, alan, f.ulke, f.bolge, f.sehir, f.sektor, f.faaliyet, f.potansiyel, ben.kullanici]
        )
      ).rows[0].id;
    }

    for (const kod of ilgiler) {
      await b.query(
        `INSERT INTO crm_firma_ilgi (firma_id, ilgi_kod)
         SELECT $1, kod FROM crm_ilgi_alani WHERE kod = $2 ON CONFLICT DO NOTHING`,
        [firmaId, kod]
      );
    }

    let kisiId: number | null = null;
    if (k.ad) {
      const ayni = k.eposta
        ? (
            await b.query<{ id: number }>(
              `SELECT id FROM crm_kisi WHERE firma_id = $1 AND lower(eposta) = $2 LIMIT 1`,
              [firmaId, k.eposta]
            )
          ).rows[0]
        : undefined;
      if (ayni) {
        kisiId = ayni.id;
        await b.query(
          `UPDATE crm_kisi SET unvan = COALESCE(unvan, $2), eposta2 = COALESCE(eposta2, $3),
                  telefon = COALESCE(telefon, $4), guncellendi = now() WHERE id = $1`,
          [kisiId, k.unvan, k.eposta2, k.telefon]
        );
      } else {
        kisiId = (
          await b.query<{ id: number }>(
            `INSERT INTO crm_kisi (firma_id, ad, unvan, eposta, eposta2, telefon, olusturan)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [firmaId, k.ad, k.unvan, k.eposta, k.eposta2, k.telefon, ben.kullanici]
          )
        ).rows[0].id;
      }
    }

    if (etkinlikId || talep) {
      await b.query(
        `INSERT INTO crm_temas (firma_id, kisi_id, etkinlik_id, tarih, talep, takip, kanal, son_temas, olusturan)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [firmaId, kisiId, etkinlikId, gun(fd, "tarih"), talep, takip, kanal, gun(fd, "son_temas"), ben.kullanici]
      );
    }
    if (not) {
      await b.query(`INSERT INTO crm_not (firma_id, metin, yazan) VALUES ($1, $2, $3)`, [firmaId, not, ben.kullanici]);
    }
    return { firmaId, mevcut: Boolean(var_) };
  });

  await kayitEkle(ben, mevcut ? "hizli_kayit_mevcut" : "hizli_kayit", `firma #${firmaId}`, f.ad);
  if (fd.get("geri") === "etkinlik" && etkinlikId) {
    redirect(`/etkinlikler/${etkinlikId}?eklendi=${firmaId}${mevcut ? "&mevcut=1" : ""}`);
  }
  redirect(`/firmalar/${firmaId}${mevcut ? "?mevcut=1" : ""}`);
}

export async function firmaGuncelle(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const id = sayi(fd.get("id"));
  const f = firmaAlanlari(fd);
  if (!id || !f.ad) throw new Error("Firma adı gerekli.");
  await sorgu(
    `UPDATE crm_firma SET ad = $2, web = $3, alan_adi = COALESCE($4, alan_adi), ulke = $5, bolge = $6,
            sehir = $7, sektor = $8, faaliyet = $9, potansiyel = $10, durum = $11, notlar = $12,
            guncellendi = now()
      WHERE id = $1`,
    [
      id,
      f.ad,
      f.web,
      alanAdi(f.web),
      f.ulke,
      f.bolge,
      f.sehir,
      f.sektor,
      f.faaliyet,
      f.potansiyel,
      gecerli(FIRMA_DURUMU, fd.get("durum"), "aday"),
      metin(fd, "notlar", 4000),
    ]
  );
  await kayitEkle(ben, "firma_guncelle", `firma #${id}`, f.ad);
  redirect(`/firmalar/${id}`);
}

export async function ilgiKaydet(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const id = sayi(fd.get("id"));
  if (!id) throw new Error("Firma yok.");
  const kodlar = ilgiKodlari(fd);
  await islem(async (b) => {
    await b.query(`DELETE FROM crm_firma_ilgi WHERE firma_id = $1`, [id]);
    for (const kod of kodlar) {
      await b.query(
        `INSERT INTO crm_firma_ilgi (firma_id, ilgi_kod) SELECT $1, kod FROM crm_ilgi_alani WHERE kod = $2`,
        [id, kod]
      );
    }
    await b.query(`UPDATE crm_firma SET guncellendi = now() WHERE id = $1`, [id]);
  });
  await kayitEkle(ben, "ilgi_kaydet", `firma #${id}`, kodlar.join(", "));
  redirect(`/firmalar/${id}`);
}

export async function kisiKaydet(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const kisiId = sayi(fd.get("kisi_id"));
  const k = kisiAlanlari(fd);
  if (!firmaId || !k.ad) throw new Error("Kişinin adı ya da e-postası gerekli.");
  const notlar = metin(fd, "notlar", 2000);
  if (kisiId) {
    await sorgu(
      `UPDATE crm_kisi SET ad = $3, unvan = $4, eposta = $5, eposta2 = $6, telefon = $7, notlar = $8,
              guncellendi = now()
        WHERE id = $1 AND firma_id = $2`,
      [kisiId, firmaId, k.ad, k.unvan, k.eposta, k.eposta2, k.telefon, notlar]
    );
  } else {
    await sorgu(
      `INSERT INTO crm_kisi (firma_id, ad, unvan, eposta, eposta2, telefon, notlar, olusturan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [firmaId, k.ad, k.unvan, k.eposta, k.eposta2, k.telefon, notlar, ben.kullanici]
    );
  }
  await sorgu(`UPDATE crm_firma SET guncellendi = now() WHERE id = $1`, [firmaId]);
  await kayitEkle(ben, kisiId ? "kisi_guncelle" : "kisi_ekle", `firma #${firmaId}`, k.ad);
  redirect(`/firmalar/${firmaId}`);
}

export async function kisiSil(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const kisiId = sayi(fd.get("kisi_id"));
  if (!firmaId || !kisiId) throw new Error("Kişi yok.");
  const r = await tek<{ ad: string }>(`DELETE FROM crm_kisi WHERE id = $1 AND firma_id = $2 RETURNING ad`, [
    kisiId,
    firmaId,
  ]);
  await kayitEkle(ben, "kisi_sil", `firma #${firmaId}`, r?.ad ?? "");
  redirect(`/firmalar/${firmaId}`);
}

export async function temasKaydet(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const temasId = sayi(fd.get("temas_id"));
  if (!firmaId) throw new Error("Firma yok.");
  /* Kişi bu firmaya ait değilse bağlanmaz. */
  const kisiAday = sayi(fd.get("kisi_id"));
  const kisiId = kisiAday
    ? ((await tek<{ id: number }>(`SELECT id FROM crm_kisi WHERE id = $1 AND firma_id = $2`, [kisiAday, firmaId]))?.id ??
      null)
    : null;
  const etkinlikId = sayi(fd.get("etkinlik_id"));
  const d = [
    kisiId,
    etkinlikId,
    gun(fd, "tarih"),
    metin(fd, "talep", 2000),
    gecerli(TAKIP, fd.get("takip"), "gorusuldu"),
    gun(fd, "son_temas"),
    metin(fd, "notlar", 2000),
    gecerli(KANAL, fd.get("kanal"), etkinlikId ? "fuar" : "diger"),
  ];
  if (temasId) {
    await sorgu(
      `UPDATE crm_temas SET kisi_id = $3, etkinlik_id = $4, tarih = $5, talep = $6, takip = $7,
              son_temas = $8, notlar = $9, kanal = $10, guncellendi = now()
        WHERE id = $1 AND firma_id = $2`,
      [temasId, firmaId, ...d]
    );
  } else {
    await sorgu(
      `INSERT INTO crm_temas (firma_id, kisi_id, etkinlik_id, tarih, talep, takip, son_temas, notlar, kanal, olusturan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [firmaId, ...d, ben.kullanici]
    );
  }
  await sorgu(`UPDATE crm_firma SET guncellendi = now() WHERE id = $1`, [firmaId]);
  await kayitEkle(ben, temasId ? "temas_guncelle" : "temas_ekle", `firma #${firmaId}`, String(d[4]));
  redirect(fd.get("geri") === "etkinlik" && d[1] ? `/etkinlikler/${d[1]}` : `/firmalar/${firmaId}`);
}

/** Listeden tek tıkla takip durumu değişikliği. */
export async function takipDegistir(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const temasId = sayi(fd.get("temas_id"));
  if (!temasId) throw new Error("Görüşme yok.");
  const takip = gecerli(TAKIP, fd.get("takip"), "gorusuldu");
  const r = await tek<{ firma_id: number; etkinlik_id: number | null }>(
    /* Veritabanı UTC'de; gece yarısından sonra "bugün" İstanbul'a göre olmalı. */
    `UPDATE crm_temas SET takip = $2, son_temas = (now() AT TIME ZONE 'Europe/Istanbul')::date, guncellendi = now()
      WHERE id = $1 RETURNING firma_id, etkinlik_id`,
    [temasId, takip]
  );
  if (!r) throw new Error("Görüşme bulunamadı.");
  await kayitEkle(ben, "takip_degistir", `firma #${r.firma_id}`, String(takip));
  const geri = String(fd.get("geri") ?? "");
  redirect(geri.startsWith("/") && !geri.startsWith("//") ? geri : `/firmalar/${r.firma_id}`);
}

export async function temasSil(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const temasId = sayi(fd.get("temas_id"));
  if (!firmaId || !temasId) throw new Error("Görüşme yok.");
  await sorgu(`DELETE FROM crm_temas WHERE id = $1 AND firma_id = $2`, [temasId, firmaId]);
  await kayitEkle(ben, "temas_sil", `firma #${firmaId}`, `temas #${temasId}`);
  redirect(`/firmalar/${firmaId}`);
}

export async function notEkle(fd: FormData): Promise<void> {
  const ben = await yazarZorunlu();
  const firmaId = sayi(fd.get("firma_id"));
  const m = metin(fd, "metin", 4000);
  if (!firmaId || !m) throw new Error("Not boş.");
  await sorgu(`INSERT INTO crm_not (firma_id, metin, yazan) VALUES ($1, $2, $3)`, [firmaId, m, ben.kullanici]);
  await sorgu(`UPDATE crm_firma SET guncellendi = now() WHERE id = $1`, [firmaId]);
  redirect(`/firmalar/${firmaId}`);
}

export async function firmaSil(fd: FormData): Promise<void> {
  const ben = await yoneticiZorunlu();
  const id = sayi(fd.get("id"));
  if (!id || fd.get("onay") !== "SIL") throw new Error("Silmek için kutuya SIL yazın.");
  const r = await tek<{ ad: string }>(`DELETE FROM crm_firma WHERE id = $1 RETURNING ad`, [id]);
  await kayitEkle(ben, "firma_sil", `firma #${id}`, r?.ad ?? "");
  redirect("/firmalar");
}

import "server-only";
import { satisaIletildi, type IletilenIleti } from "@/lib/crm-bag";
import { sorguSert } from "@/lib/db";
import { iletildiIsaretle, notEkle } from "@/lib/leads-db";
import { kayitEkle } from "@/lib/panel-kayit";
import {
  ekleriIndir,
  epostaGonder,
  postaKutulari,
  taslakSil,
  yanitlandiIsaretle,
  type GidenEk,
  type Klasor,
} from "@/lib/posta";
import { adresleriAyikla, boyutYaz } from "@/lib/posta-bicim";

/**
 * Elle e-posta göndermenin TEK yolu — paneldeki form da (eposta/gonder/route.ts),
 * Claude'un kullandığı uç da (api/posta) buradan geçer. Kurallar bir yerde:
 *
 *   - gönderen kutusu gönderim ayarlarındaki kutulardan biri olmalı;
 *   - adresler doğrulanır, geçersiz olan varsa hiçbir şey gitmez;
 *   - saatte en çok ELLE_SAATLIK elle e-posta (panel + uç toplamı) — çalınan
 *     bir oturumun ya da anahtarın kutuyu spam makinesine çevirmesini sınırlar;
 *   - abonelikten çıkmış adrese YENİ e-posta gitmez; yanıtta gider ("beni
 *     listeden çıkarın" yazana "çıkardık" demek gerekebilir);
 *   - her gönderim ve her başarısızlık panel kaydına düşer (kim, hangi
 *     kutudan, kime, konu) — Kayıtlar sayfasında görünür;
 *   - ekler (yüklenen dosyalar + iletilen iletinin seçilen ekleri) toplam en
 *     çok EK_TOPLAM_EN_COK bayt;
 *   - talep iletildiyse talebe not düşer ve "İletildi" olur; satışa giden
 *     talep ya da tanıtım yanıtı CRM'e "Yeni talep" olarak aktarılır (crm-bag.ts).
 *
 * Tanıtım e-postasının kuralları (günlük tavan, ısınma, aralık) BURADA YOK:
 * bu bire bir yazışma.
 */

export const ELLE_SAATLIK = 40;

/** Bir e-postadaki eklerin toplamı en çok — paylaşımlı sunucunun kabul ettiği makul boyut. */
export const EK_TOPLAM_EN_COK = 20 * 1024 * 1024;

export type ElleGonderim = {
  /** Panel kullanıcısı ya da "claude" — panel kaydına yazılır */
  kim: string;
  kutu: string;
  kime: string;
  bilgi?: string;
  /** Gizli alıcılar (Bcc) */
  gizli?: string;
  konu: string;
  metin: string;
  /** Yanıtsa: yanıtlanan iletinin Message-ID'si ve References zinciri */
  mesajKimligi?: string;
  referanslar?: string;
  /** Yanıtlanan iletinin UID'si, klasörü ve kutusu — orada "yanıtlandı" işaretlenir.
      Kutu verilmezse gönderen kutu (gönderen değiştirildiyse ileti öteki kutuda kalır). */
  yanitUid?: number;
  yanitKlasor?: Klasor;
  yanitKutu?: string;
  /** Taslaktan gönderiliyorsa: gidince taslak kendi kutusunun Taslaklar'ından kalkar */
  taslak?: { kutu: string; uid: number };
  /** Bütün kontroller çalışır, e-posta GİTMEZ (Claude'un ucundaki önizleme) */
  dene?: boolean;
  /** Formdan yüklenen dosyalar */
  ekler?: GidenEk[];
  /** İletilen iletinin gönderime eklenecek ekleri (parça numaraları) */
  iletilenEkler?: { kutu: string; klasor: Klasor; uid: number; parcalar: string[] };
  /** Talep iletiliyorsa talebin numarası: gidince not, "İletildi" ve CRM */
  talepId?: number;
  /** İletilen iletinin kimliği ve göndereni: satışa giden tanıtım yanıtı CRM'e bağlanır */
  iletilenIleti?: IletilenIleti;
};

/** `uyari`: gitti ama kopyası Gönderilmiş'e konamadı — form uyarıyı göstermek için yerinde kalır */
export type ElleSonuc = { tamam: boolean; mesaj: string; uyari?: boolean };

export async function elleGonder(g: ElleGonderim): Promise<ElleSonuc> {
  const kutu = (g.kutu ?? "").trim().toLowerCase();
  if (!postaKutulari().some((k) => k.user === kutu)) return { tamam: false, mesaj: "Gönderen kutusu geçersiz." };

  const kime = adresleriAyikla(g.kime ?? "");
  const bilgi = adresleriAyikla(g.bilgi ?? "");
  const gizli = adresleriAyikla(g.gizli ?? "");
  const bozuk = [...kime.gecersiz, ...bilgi.gecersiz, ...gizli.gecersiz];
  if (bozuk.length) return { tamam: false, mesaj: `Geçersiz adres: ${bozuk.join(", ")}` };
  if (!kime.gecerli.length) return { tamam: false, mesaj: "En az bir alıcı adresi yazın." };
  if (kime.gecerli.length + bilgi.gecerli.length + gizli.gecerli.length > 20) {
    return { tamam: false, mesaj: "Tek seferde en çok 20 alıcı." };
  }
  if (!(g.konu ?? "").trim()) return { tamam: false, mesaj: "Konu boş olamaz." };
  if (!(g.metin ?? "").trim()) return { tamam: false, mesaj: "Metin boş olamaz." };

  const mesajKimligi = (g.mesajKimligi ?? "").trim();
  const yanitMi = Boolean(mesajKimligi);

  const [{ adet }] = await sorguSert<{ adet: number }>(
    `SELECT count(*)::int AS adet FROM panel_kayit WHERE olay = 'eposta_gonder' AND zaman > now() - interval '1 hour'`
  );
  if (adet >= ELLE_SAATLIK) {
    return { tamam: false, mesaj: `Son bir saatte ${adet} e-posta gönderildi — saatlik sınır ${ELLE_SAATLIK}. Biraz sonra tekrar deneyin.` };
  }

  if (!yanitMi) {
    const engelli = await sorguSert<{ eposta: string }>(
      `SELECT eposta FROM eposta_engel WHERE eposta = ANY($1::text[])`,
      [[...kime.gecerli, ...bilgi.gecerli, ...gizli.gecerli]]
    );
    if (engelli.length) {
      return {
        tamam: false,
        mesaj: `${engelli.map((e) => e.eposta).join(", ")} abonelikten çıktı — bu adrese yeni e-posta gönderilmez. (Onların yazdığı bir iletiye yanıt verebilirsiniz.)`,
      };
    }
  }

  const yuklenen = g.ekler ?? [];
  const yuklenenBoyut = yuklenen.reduce((t, e) => t + e.icerik.length, 0);
  if (yuklenenBoyut > EK_TOPLAM_EN_COK) {
    return { tamam: false, mesaj: `Ekler çok büyük (${boyutYaz(yuklenenBoyut)}) — toplam en çok ${boyutYaz(EK_TOPLAM_EN_COK)}.` };
  }

  if (g.dene) return { tamam: true, mesaj: "Kontrollerden geçti — GÖNDERİLMEDİ (önizleme)." };

  /* İletilen iletinin ekleri gönderim anında kutudan alınır — tarayıcıya
     inip geri yüklenmez. */
  let iletilen: GidenEk[] = [];
  if (g.iletilenEkler?.parcalar.length) {
    const r = await ekleriIndir(
      g.iletilenEkler.kutu,
      g.iletilenEkler.klasor,
      g.iletilenEkler.uid,
      g.iletilenEkler.parcalar,
      EK_TOPLAM_EN_COK - yuklenenBoyut
    );
    if (!r.tamam) return { tamam: false, mesaj: r.hata };
    iletilen = r.ekler;
  }
  const ekler = [...iletilen, ...yuklenen];

  const r = await epostaGonder({
    kutuAdresi: kutu,
    kime: kime.gecerli,
    bilgi: bilgi.gecerli,
    gizli: gizli.gecerli,
    konu: g.konu ?? "",
    metin: g.metin ?? "",
    yanitlanan: yanitMi ? { mesajKimligi, referanslar: g.referanslar ?? "" } : undefined,
    ekler,
  });

  const ekYazisi = ekler.length ? ` · ${ekler.length} ek (${boyutYaz(ekler.reduce((t, e) => t + e.icerik.length, 0))})` : "";
  const gizliYazisi = gizli.gecerli.length ? ` · gizli: ${gizli.gecerli.join(", ")}` : "";
  const ozet = `${kutu} → ${[...kime.gecerli, ...bilgi.gecerli].join(", ")}${gizliYazisi} — ${g.konu ?? ""}${ekYazisi}`.slice(0, 280);
  if (!r.tamam) {
    await kayitEkle(g.kim, "eposta_gonder_hata", kutu, `${ozet} · ${r.hata}`.slice(0, 280));
    return { tamam: false, mesaj: r.hata };
  }

  await kayitEkle(g.kim, "eposta_gonder", kutu, ozet);
  if (yanitMi) {
    /* Taslaktan giden yanıtta UID bilinmiyor: ileti Message-ID'siyle bulunur */
    if (g.yanitUid && g.yanitUid > 0) {
      await yanitlandiIsaretle((g.yanitKutu || kutu).trim().toLowerCase(), { uid: g.yanitUid, klasor: g.yanitKlasor ?? "gelen" });
    } else if (g.taslak) {
      await yanitlandiIsaretle(kutu, { mesajKimligi });
    }
  }
  if (g.taslak && g.taslak.uid > 0) await taslakSil(g.taslak.kutu, g.taslak.uid);

  /* Talep iletildiyse talebin notlarına iz: kime, hangi kutudan. Not
     yazılamasa da gönderim geçerli — mail gitti. */
  const talepId = g.talepId && g.talepId > 0 ? Math.floor(g.talepId) : 0;
  if (talepId) {
    const not = `İletildi: ${kime.gecerli.join(", ")}${bilgi.gecerli.length ? ` · bilgi: ${bilgi.gecerli.join(", ")}` : ""} — ${kutu} kutusundan`;
    await notEkle(talepId, not, g.kim).catch(() => {});
    await kayitEkle(g.kim, "not", `talep:${talepId}`, `Talep #${talepId} — ${not}`).catch(() => {});
    /* Yeni talep İletildi'ye geçer; listede ve "yeni talep" sayısında görünsün. */
    if (await iletildiIsaretle(talepId).catch(() => false)) {
      await kayitEkle(g.kim, "durum", `talep:${talepId}`, `Talep #${talepId} — Yeni → İletildi`).catch(() => {});
    }
  }
  const crm = await satisaIletildi({
    kim: g.kim,
    kutu,
    alicilar: [...kime.gecerli, ...bilgi.gecerli],
    talepId: talepId || undefined,
    iletilenIleti: g.iletilenIleti,
  });

  const gitti = r.kopyaHatasi
    ? `Gönderildi — ama kopyası Gönderilmiş klasörüne konamadı: ${r.kopyaHatasi}`
    : "Gönderildi. Kopyası Gönderilmiş klasöründe.";
  return { tamam: true, uyari: Boolean(r.kopyaHatasi), mesaj: crm ? `${gitti} ${crm}` : gitti };
}

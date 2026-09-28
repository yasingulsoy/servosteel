import "server-only";
import { sorguSert } from "@/lib/db";
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
 *     çok EK_TOPLAM_EN_COK bayt.
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
  /** Yanıtlanan iletinin UID'si ve klasörü — kutuda "yanıtlandı" işaretlenir */
  yanitUid?: number;
  yanitKlasor?: Klasor;
  /** Taslaktan gönderiliyorsa: gidince taslak Taslaklar'dan kalkar */
  taslakUid?: number;
  /** Bütün kontroller çalışır, e-posta GİTMEZ (Claude'un ucundaki önizleme) */
  dene?: boolean;
  /** Formdan yüklenen dosyalar */
  ekler?: GidenEk[];
  /** İletilen iletinin gönderime eklenecek ekleri (parça numaraları) */
  iletilenEkler?: { kutu: string; klasor: Klasor; uid: number; parcalar: string[] };
};

export type ElleSonuc = { tamam: boolean; mesaj: string };

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
  if (yanitMi && g.yanitUid && g.yanitUid > 0) await yanitlandiIsaretle(kutu, g.yanitUid, g.yanitKlasor ?? "gelen");
  if (g.taslakUid && g.taslakUid > 0) await taslakSil(kutu, g.taslakUid);
  return {
    tamam: true,
    mesaj: r.kopyaHatasi
      ? `Gönderildi — ama kopyası Gönderilmiş klasörüne konamadı: ${r.kopyaHatasi}`
      : "Gönderildi. Kopyası Gönderilmiş klasöründe.",
  };
}

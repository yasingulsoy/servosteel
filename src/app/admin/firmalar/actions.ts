"use server";

import { revalidatePath } from "next/cache";
import { adminYetkisi, yetki } from "@/lib/admin-yetki";
import { kayitEkle } from "@/lib/panel-kayit";
import {
  HEDEF_DURUMLAR,
  HEDEF_DURUM_ETIKET,
  ayniAdreseGiden,
  engelle,
  engelliMi,
  firmaEngeli,
  geriDonusDurumu,
  gonderimKaydet,
  hedefDurumDegistir,
  hedefFirma,
  hedefNotEkle,
  kutuDurumlari,
  outreachSemaKur,
  siraAl,
  siradaki,
  sigortaAt,
  sigortaSifirla,
  sonSonuclar,
  type HedefDurum,
} from "@/lib/outreach-db";
import {
  ayarlariOku,
  geriDonusEngeli,
  hataSiniflandir,
  kutuSec,
  type GonderenKutusu,
} from "@/lib/outreach-kurallar";
import { iptalAdresi, postaSunucusu, tamMetin, tanitimGonder } from "@/lib/outreach";
import { gelenKutulariTara } from "@/lib/gelen-tarama";

/**
 * Hedef firma eylemleri. Her birinin ilk satırı `yetki()` — sunucu eylemi
 * doğrudan POST ile çağrılabilir.
 *
 * GÖNDERİM SIRASI (gonderEylemi) — her adım bir öncekini geçmeden çalışmaz:
 *   1. ayarlar tam mı (ayrı kutu, parola)
 *   2. firma gönderilebilir mi (durum, adres, ülke, engel listesi, sistem adresi)
 *   3. alıcının alan adı e-posta alıyor mu (MX) — almıyorsa "Adres hatalı"
 *   4. son 50 gönderimde geri dönüş %10'u geçmedi mi
 *   5. kutu seçimi (kutuSec): sigortası atık, kendi tavanı (ısınma: ilk hafta
 *      10, ikinci hafta 15) ya da alan adının toplam tavanı (ilk hafta 20,
 *      ikinci 35, sonra OUTREACH_DOMAIN_DAILY_LIMIT) dolan kutu atlanır;
 *      kalanlar bugün en az gönderenden başlayarak denenir
 *   6. kutunun aralığı geçti mi + sigortası atık değil mi — TEK koşullu
 *      yazmayla sıra alınır, iki kişi aynı kutuyu aynı anda alamaz
 *   7. gönder; sonucu kaydet (hangi kutudan); sunucu itiraz ettiyse sigortayı
 *      at — giriş hatasında kutuyu, hız sınırı/spam engelinde alan adını
 */

export type GonderSonucu = {
  tamam: boolean;
  mesaj: string;
  /** Süzgeçteki bir sonraki gönderilebilir firma */
  sonraki?: number | null;
  /** Aralık dolmadıysa kalan saniye — düğme geri sayar */
  bekle?: number;
} | null;

const metin = (v: FormDataEntryValue | null, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/* Gövdede satır sonları korunur; yalnızca sondaki boşluk kırpılır. */
const govdeAl = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.replace(/\r\n?/g, "\n").replace(/\s+$/, "").slice(0, 20000) : "";

function yenile(id?: number) {
  revalidatePath("/admin/firmalar");
  if (id) revalidatePath(`/admin/firmalar/${id}`);
}

export async function gonderEylemi(_onceki: GonderSonucu, form: FormData): Promise<GonderSonucu> {
  const ben = await yetki();
  const id = Number(form.get("id"));
  /* Konu tek satır: başlığa satır sonu girerse sunucu başlık enjeksiyonu sayar. */
  const konu = metin(form.get("konu"), 300).replace(/[\r\n]+/g, " ");
  const govde = govdeAl(form.get("govde"));
  const filtre = {
    grup: metin(form.get("grup"), 2) || undefined,
    ulke: metin(form.get("ulke"), 80) || undefined,
    segment: metin(form.get("segment"), 80) || undefined,
  };
  if (!Number.isInteger(id)) return { tamam: false, mesaj: "Geçersiz istek." };
  if (!konu || !govde) return { tamam: false, mesaj: "Konu ve metin boş olamaz." };

  const ayar = ayarlariOku(process.env);
  if (ayar.eksik.length) {
    return { tamam: false, mesaj: `Gönderim ayarları eksik: ${ayar.eksik.join(", ")}.` };
  }

  if (!(await outreachSemaKur())) return { tamam: false, mesaj: "Veritabanına bağlanılamadı." };
  const f = await hedefFirma(id);
  if (!f) return { tamam: false, mesaj: "Firma bulunamadı." };
  const engel = firmaEngeli(f, await engelliMi(f.eposta), await ayniAdreseGiden(f.eposta, f.id));
  if (engel) return { tamam: false, mesaj: engel };

  /* Alan adı e-posta almıyorsa göndermeye çalışmak geri dönüş demek. Sıra
     alınmadan önce bakılıyor: kötü adres 90 sn'lik hakkı yemesin. */
  const mx = await postaSunucusu(f.eposta);
  if (mx === "bilinmiyor") {
    return { tamam: false, mesaj: "Alıcının alan adı DNS'te sorgulanamadı — birazdan tekrar deneyin." };
  }
  if (mx === "yok") {
    const alan = f.eposta.split("@")[1];
    await hedefDurumDegistir(id, "hatali");
    await hedefNotEkle(id, `Gönderilmedi: ${alan} alan adında e-posta sunucusu yok (MX/A kaydı bulunamadı).`, ben);
    await kayitEkle(ben, "hedef_durum", `firma:${id}`, `${f.firma} — ${alan} e-posta almıyor → Adres hatalı`);
    yenile(id);
    return {
      tamam: false,
      mesaj: `${alan} alan adı e-posta almıyor (MX kaydı yok) — gönderilmedi, firma “Adres hatalı” işaretlendi.`,
    };
  }

  const gd = await geriDonusDurumu();
  const gdEngel = geriDonusEngeli(gd.toplam, gd.hatali);
  if (gdEngel) return { tamam: false, mesaj: gdEngel };

  /* Kutu seçimi: sigortası atık, kendi tavanı ya da alan adının tavanı dolan
     kutu atlanır; kalanlar bugün en az gönderenden başlayarak denenir. */
  const durum = await kutuDurumlari(ayar.kutular);
  const secim = kutuSec(ayar, durum.kutu, durum.alan);
  if (!secim.uygun.length) {
    if (secim.bekle !== null) {
      return {
        tamam: false,
        mesaj: `Aynı kutudan iki e-posta arasında en az ${ayar.aralikSn} sn olmalı — ${secim.bekle} sn sonra gönderilebilir.`,
        bekle: secim.bekle,
      };
    }
    return { tamam: false, mesaj: secim.sebep ?? "Şu an gönderebilecek kutu yok." };
  }
  let kutu: GonderenKutusu | null = null;
  for (const aday of secim.uygun) {
    if (await siraAl(aday.user, ayar.aralikSn)) {
      kutu = aday;
      break;
    }
  }
  if (!kutu) {
    /* Seçimle sıra alma arasında başka biri aynı kutuları kullandı */
    return { tamam: false, mesaj: "Kutular az önce kullanıldı — birkaç saniye sonra tekrar deneyin.", bekle: 5 };
  }
  const gonderen = kutu;
  const satir = secim.satirlar.find((s) => s.kutu.user === gonderen.user);

  const iptalUrl = iptalAdresi(f.iptal_anahtari);
  const gonderilen = tamMetin(govde, f.dil, iptalUrl);
  const cevap = await tanitimGonder(ayar, gonderen, { alici: f.eposta, konu, govde, dil: f.dil, iptalUrl });
  const ozet = `${f.firma} · ${f.eposta} · ${gonderen.user} kutusundan`;
  const kayit = { firmaId: id, kullanici: ben, gonderen: gonderen.user, eposta: f.eposta, konu, govde: gonderilen };

  if (cevap.durum === "ok") {
    await gonderimKaydet({ ...kayit, sonuc: "ok", yanit: cevap.yanit, mesajKimligi: cevap.mesajKimligi });
    await hedefDurumDegistir(id, "gonderildi");
    await kayitEkle(ben, "hedef_gonder", `firma:${id}`, ozet);
    yenile(id);
    return {
      tamam: true,
      mesaj:
        `Gönderildi: ${f.eposta} — ${gonderen.user} kutusundan` +
        (satir ? ` (bu kutu bugün ${satir.durum.bugun + 1}/${satir.tavan})` : "") +
        ` · bugün gönderilebilecek ${Math.max(0, secim.kalan - 1)} kaldı.`,
      sonraki: await siradaki(filtre, id),
    };
  }

  /* Zaman aşımı sunucunun sorunu (kutunun değil): o sunucudaki bütün kutular durur.
     Hız sınırı / spam / itibar alan adına ait: o alan adındaki bütün kutular durur. */
  const ayniSunucu = ayar.kutular.filter((k) => k.host === gonderen.host).map((k) => k.user);
  const ayniAlan = ayar.kutular.filter((k) => k.alan === gonderen.alan).map((k) => k.user);

  if (cevap.durum === "belirsiz") {
    /* Gitmiş olabilir. Aynı firmaya ikinci e-postayı atmaktansa bir firmayı
       kaçırmak iyidir: "Gönderildi" işaretlenir, o sunucunun kutuları durdurulur. */
    await gonderimKaydet({ ...kayit, sonuc: "belirsiz", yanit: cevap.yanit });
    await hedefDurumDegistir(id, "gonderildi");
    /* SMTP'den giden e-posta kutunun Gönderilmiş klasörüne DÜŞMEZ; kopyası ancak
       OUTREACH_BCC adresine gelir. */
    await sigortaAt(
      ayniSunucu,
      `${gonderen.user} kutusunda zaman aşımı (${cevap.yanit}) — e-posta gitmiş olabilir; BCC adresine kopyası geldiyse gitmiştir.`
    );
    await kayitEkle(ben, "hedef_gonder_hata", `firma:${id}`, `${ozet} — belirsiz`);
    yenile(id);
    return {
      tamam: false,
      mesaj: `Sunucu zamanında cevap vermedi; e-posta gitmiş olabilir. Firma “Gönderildi” işaretlendi, ${gonderen.host} sunucusundaki ${ayniSunucu.length} kutu bugünlük durduruldu.`,
    };
  }

  const k = hataSiniflandir(cevap.hata);
  await gonderimKaydet({ ...kayit, sonuc: k.tur === "alici" ? "alici" : "hata", yanit: k.sebep });
  if (k.tur === "alici") await hedefDurumDegistir(id, "hatali");

  /* Sigorta: sunucu itiraz ettiyse hemen — giriş/yetki hatasında yalnız bu kutu,
     hız sınırı/spam/itibarda alan adının bütün kutuları. Değilse bu kutunun üst
     üste ikinci başarısızlığında yalnız bu kutu. */
  const [, onceki] = await sonSonuclar(gonderen.user);
  let durdu = "";
  if (k.tur === "sigorta") {
    const kimler = k.kapsam === "alan" ? ayniAlan : [gonderen.user];
    await sigortaAt(
      kimler,
      kimler.length > 1
        ? `${gonderen.user} kutusundaki cevap ${gonderen.alan} alan adının bütün kutularını durdurdu: ${k.sebep}`
        : k.sebep
    );
    durdu =
      k.kapsam === "alan"
        ? `${gonderen.alan} alan adındaki ${kimler.length} kutu bugünlük durduruldu.`
        : `${gonderen.user} kutusu bugünlük durduruldu.`;
  } else if (onceki && onceki !== "ok") {
    await sigortaAt([gonderen.user], `Üst üste iki başarısız gönderim. Son hata: ${k.sebep}`);
    durdu = `${gonderen.user} kutusu bugünlük durduruldu.`;
  }
  await kayitEkle(ben, "hedef_gonder_hata", `firma:${id}`, `${ozet} — ${k.sebep}`);
  yenile(id);
  return {
    tamam: false,
    mesaj: [
      k.tur === "alici" ? "Adres reddedildi; firma “Adres hatalı” işaretlendi." : `Gönderilemedi (${gonderen.user}).`,
      k.sebep,
      durdu,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export async function hedefDurumEylemi(form: FormData) {
  const ben = await yetki();
  const id = Number(form.get("id"));
  const durum = metin(form.get("durum"), 20) as HedefDurum;
  if (!Number.isInteger(id) || !HEDEF_DURUMLAR.includes(durum)) return;
  const f = await hedefFirma(id);
  if (!f || f.durum === durum) return;
  await hedefDurumDegistir(id, durum);
  await kayitEkle(
    ben,
    "hedef_durum",
    `firma:${id}`,
    `${f.firma} — ${HEDEF_DURUM_ETIKET[f.durum] ?? f.durum} → ${HEDEF_DURUM_ETIKET[durum]}`
  );
  yenile(id);
}

export async function hedefNotEylemi(form: FormData) {
  const ben = await yetki();
  const id = Number(form.get("id"));
  const govde = metin(form.get("govde"), 4000);
  if (!Number.isInteger(id) || !govde) return;
  const f = await hedefFirma(id);
  if (!f) return;
  await hedefNotEkle(id, govde, ben);
  await kayitEkle(ben, "hedef_not", `firma:${id}`, `${f.firma} — ${govde.replace(/\s+/g, " ").slice(0, 160)}`);
  yenile(id);
}

/**
 * Adresi engel listesine alır — "bize yazmayın" diyen ya da yanlış kişiye
 * gittiği anlaşılan adres. Geri almak için tuş YOK: engeli kaldırmak
 * birinin açık isteğini çiğnemek olabilir; gerekiyorsa veritabanından.
 */
export async function engelleEylemi(form: FormData) {
  const ben = await yetki();
  const id = Number(form.get("id"));
  if (!Number.isInteger(id)) return;
  const f = await hedefFirma(id);
  if (!f?.eposta) return;
  await engelle(f.eposta, `elle: ${ben}`);
  await kayitEkle(ben, "hedef_engel", `firma:${id}`, `${f.firma} · ${f.eposta}`);
  yenile(id);
}

/**
 * Sigortayı elle kaldırır — yalnızca yönetici. Örnek: parola yanlış girilmiş,
 * düzeltilip yeniden dağıtıldı; ertesi günü beklemeye gerek yok. Hız sınırı
 * ya da spam engeli yüzünden attıysa KALDIRILMAMALI — sebep ekranda yazıyor.
 */
export async function sigortaSifirlaEylemi() {
  const ben = await adminYetkisi();
  if (!(await outreachSemaKur())) return;
  const kaldirilan = await sigortaSifirla();
  await kayitEkle(ben, "sigorta_sifirla", "", kaldirilan.join(" · ").slice(0, 280));
  yenile();
}

/**
 * Gönderen kutularının gelen kutusunu ŞİMDİ tarar (sayfa açılışındaki
 * kendiliğinden tarama en çok 10 dakikada bir). Aynı kutu 60 sn içinde iki
 * kez taranmaz — çift tıklama iki tarama başlatmasın.
 */
export async function gelenTaraEylemi() {
  const ben = await yetki();
  const ayar = ayarlariOku(process.env);
  if (ayar.eksik.length) return;
  const sonuc = await gelenKutulariTara(ayar, { aralikSn: 60 });
  const ozet = sonuc
    .map((r) => `${r.kutu}: ${r.hata ? `hata — ${r.hata}` : r.atlandi ?? `${r.islenen} ileti (${r.yanit} yanıt, ${r.geriDonus} geri dönüş, ${r.abonelik} iptal)`}`)
    .join(" · ");
  await kayitEkle(ben, "gelen_tara", "", ozet.slice(0, 280));
  yenile();
}

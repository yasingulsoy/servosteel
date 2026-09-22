import "server-only";
import { kayitEkle } from "@/lib/panel-kayit";
import {
  ayniAdreseGiden,
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
  sigortaAt,
  sonSonuclar,
} from "@/lib/outreach-db";
import {
  ayarlariOku,
  geriDonusEngeli,
  hataSiniflandir,
  kutuSec,
  type GonderenKutusu,
} from "@/lib/outreach-kurallar";
import { gonderilmislereEkle, iptalAdresi, postaSunucusu, tanitimGonder } from "@/lib/outreach";

/**
 * TEK bir tanıtım e-postasının gönderimi — panelin "Gönder" düğmesi ve
 * otomatik gönderici (otomatik-gonderim.ts) AYNI yoldan geçer, kurallar tek yerde.
 *
 * SIRA — her adım bir öncekini geçmeden çalışmaz:
 *   1. ayarlar tam mı (ayrı kutu, parola)
 *   2. firma gönderilebilir mi (durum, adres, ülke, engel listesi, sistem adresi,
 *      aynı adrese daha önce gitmiş mi)
 *   3. alıcının alan adı e-posta alıyor mu (MX) — almıyorsa "Adres hatalı"
 *   4. son 50 gönderimde geri dönüş %10'u geçmedi mi
 *   5. kutu seçimi (kutuSec): sigortası atık, kendi tavanı (ısınma: ilk hafta
 *      10, ikinci hafta 15) ya da alan adının toplam tavanı (ilk hafta 20,
 *      ikinci 35, sonra OUTREACH_DOMAIN_DAILY_LIMIT) dolan kutu atlanır;
 *      kalanlar bugün en az gönderenden başlayarak denenir
 *   6. kutunun aralığı geçti mi + sigortası atık değil mi — TEK koşullu
 *      yazmayla sıra alınır, iki kişi (ya da kişi ve otomatik gönderici) aynı
 *      kutuyu aynı anda alamaz
 *   7. gönder; sonucu kaydet (hangi kutudan); kopyayı kutunun Gönderilmiş
 *      klasörüne koy; sunucu itiraz ettiyse sigortayı at — giriş hatasında
 *      kutuyu, hız sınırı/spam engelinde alan adını
 */

export type TekGonderimSonucu = {
  tamam: boolean;
  mesaj: string;
  /** Kutuların aralığı dolmadıysa en kısa bekleme (sn) */
  bekle?: number;
  /** SMTP'ye gerçekten gidildi mi (sıra alındı ve deneme yapıldı) — otomatik göndericinin temposu buna bakar */
  denendi: boolean;
  /** Gönderilen kutu */
  gonderen?: string;
};

export async function tekGonderim(p: {
  firmaId: number;
  konu: string;
  govde: string;
  /** Panel kullanıcısı ya da "otomatik" */
  kullanici: string;
}): Promise<TekGonderimSonucu> {
  const { firmaId: id, kullanici: ben } = p;
  /* Konu tek satır: başlığa satır sonu girerse sunucu başlık enjeksiyonu sayar. */
  const konu = p.konu.trim().slice(0, 300).replace(/[\r\n]+/g, " ");
  const govde = p.govde.replace(/\r\n?/g, "\n").replace(/\s+$/, "").slice(0, 20000);
  if (!konu || !govde) return { tamam: false, mesaj: "Konu ve metin boş olamaz.", denendi: false };

  const ayar = ayarlariOku(process.env);
  if (ayar.eksik.length) {
    return { tamam: false, mesaj: `Gönderim ayarları eksik: ${ayar.eksik.join(", ")}.`, denendi: false };
  }

  if (!(await outreachSemaKur())) return { tamam: false, mesaj: "Veritabanına bağlanılamadı.", denendi: false };
  const f = await hedefFirma(id);
  if (!f) return { tamam: false, mesaj: "Firma bulunamadı.", denendi: false };
  const engel = firmaEngeli(f, await engelliMi(f.eposta), await ayniAdreseGiden(f.eposta, f.id));
  if (engel) return { tamam: false, mesaj: engel, denendi: false };

  /* Alan adı e-posta almıyorsa göndermeye çalışmak geri dönüş demek. Sıra
     alınmadan önce bakılıyor: kötü adres kutunun aralık hakkını yemesin. */
  const mx = await postaSunucusu(f.eposta);
  if (mx === "bilinmiyor") {
    return { tamam: false, mesaj: "Alıcının alan adı DNS'te sorgulanamadı — birazdan tekrar deneyin.", denendi: false };
  }
  if (mx === "yok") {
    const alan = f.eposta.split("@")[1];
    await hedefDurumDegistir(id, "hatali");
    await hedefNotEkle(id, `Gönderilmedi: ${alan} alan adında e-posta sunucusu yok (MX/A kaydı bulunamadı).`, ben);
    await kayitEkle(ben, "hedef_durum", `firma:${id}`, `${f.firma} — ${alan} e-posta almıyor → Adres hatalı`);
    return {
      tamam: false,
      mesaj: `${alan} alan adı e-posta almıyor (MX kaydı yok) — gönderilmedi, firma “Adres hatalı” işaretlendi.`,
      denendi: false,
    };
  }

  const gd = await geriDonusDurumu();
  const gdEngel = geriDonusEngeli(gd.toplam, gd.hatali);
  if (gdEngel) return { tamam: false, mesaj: gdEngel, denendi: false };

  const durum = await kutuDurumlari(ayar.kutular);
  const secim = kutuSec(ayar, durum.kutu, durum.alan);
  if (!secim.uygun.length) {
    if (secim.bekle !== null) {
      return {
        tamam: false,
        mesaj: `Aynı kutudan iki e-posta arasında en az ${ayar.aralikSn} sn olmalı — ${secim.bekle} sn sonra gönderilebilir.`,
        bekle: secim.bekle,
        denendi: false,
      };
    }
    return { tamam: false, mesaj: secim.sebep ?? "Şu an gönderebilecek kutu yok.", denendi: false };
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
    return { tamam: false, mesaj: "Kutular az önce kullanıldı — birkaç saniye sonra tekrar deneyin.", bekle: 5, denendi: false };
  }
  const gonderen = kutu;
  const satir = secim.satirlar.find((s) => s.kutu.user === gonderen.user);

  const iptalUrl = iptalAdresi(f.iptal_anahtari);
  const cevap = await tanitimGonder(ayar, gonderen, { alici: f.eposta, konu, govde, dil: f.dil, iptalUrl });
  const ozet = `${f.firma} · ${f.eposta} · ${gonderen.user} kutusundan`;
  const kayit = { firmaId: id, kullanici: ben, gonderen: gonderen.user, eposta: f.eposta, konu, govde: cevap.metin };

  if (cevap.durum === "ok") {
    await gonderimKaydet({ ...kayit, sonuc: "ok", yanit: cevap.yanit, mesajKimligi: cevap.mesajKimligi });
    await hedefDurumDegistir(id, "gonderildi");
    await kayitEkle(ben, "hedef_gonder", `firma:${id}`, ozet);
    /* Kopya kutunun Gönderilmiş klasörüne — Thunderbird'de görünsün, yanıtlar
       konuşma olarak birleşsin. Başarısızsa gönderim geçerli; yalnızca not. */
    const ekle = await gonderilmislereEkle(gonderen, cevap.ham);
    if (ekle) await hedefNotEkle(id, `Gönderildi ama kopyası Gönderilmiş klasörüne konamadı: ${ekle}`, "gönderim");
    return {
      tamam: true,
      mesaj:
        `Gönderildi: ${f.eposta} — ${gonderen.user} kutusundan` +
        (satir ? ` (bu kutu bugün ${satir.durum.bugun + 1}/${satir.tavan})` : "") +
        ` · bugün gönderilebilecek ${Math.max(0, secim.kalan - 1)} kaldı.`,
      denendi: true,
      gonderen: gonderen.user,
    };
  }

  /* Zaman aşımı sunucunun sorunu (kutunun değil): o sunucudaki bütün kutular durur.
     Hız sınırı / spam / itibar alan adına ait: o alan adındaki bütün kutular durur. */
  const ayniSunucu = ayar.kutular.filter((k) => k.host === gonderen.host).map((k) => k.user);
  const ayniAlan = ayar.kutular.filter((k) => k.alan === gonderen.alan).map((k) => k.user);

  if (cevap.durum === "belirsiz") {
    /* Gitmiş olabilir. Aynı firmaya ikinci e-postayı atmaktansa bir firmayı
       kaçırmak iyidir: "Gönderildi" işaretlenir, o sunucunun kutuları durdurulur.
       SMTP'den giden e-posta kutunun Gönderilmiş klasörüne kendiliğinden DÜŞMEZ;
       kopyası ancak OUTREACH_BCC adresine gelir. */
    await gonderimKaydet({ ...kayit, sonuc: "belirsiz", yanit: cevap.yanit });
    await hedefDurumDegistir(id, "gonderildi");
    await sigortaAt(
      ayniSunucu,
      `${gonderen.user} kutusunda zaman aşımı (${cevap.yanit}) — e-posta gitmiş olabilir; BCC adresine kopyası geldiyse gitmiştir.`
    );
    await kayitEkle(ben, "hedef_gonder_hata", `firma:${id}`, `${ozet} — belirsiz`);
    return {
      tamam: false,
      mesaj: `Sunucu zamanında cevap vermedi; e-posta gitmiş olabilir. Firma “Gönderildi” işaretlendi, ${gonderen.host} sunucusundaki ${ayniSunucu.length} kutu bugünlük durduruldu.`,
      denendi: true,
      gonderen: gonderen.user,
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
  return {
    tamam: false,
    mesaj: [
      k.tur === "alici" ? "Adres reddedildi; firma “Adres hatalı” işaretlendi." : `Gönderilemedi (${gonderen.user}).`,
      k.sebep,
      durdu,
    ]
      .filter(Boolean)
      .join(" "),
    denendi: true,
    gonderen: gonderen.user,
  };
}

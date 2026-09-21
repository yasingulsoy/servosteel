"use server";

import { revalidatePath } from "next/cache";
import { adminYetkisi, yetki } from "@/lib/admin-yetki";
import { kayitEkle } from "@/lib/panel-kayit";
import {
  HEDEF_DURUMLAR,
  HEDEF_DURUM_ETIKET,
  bugunGonderilen,
  engelle,
  engelliMi,
  firmaEngeli,
  geriDonusDurumu,
  gonderimDurumu,
  gonderimKaydet,
  hedefDurumDegistir,
  hedefFirma,
  hedefNotEkle,
  ilkGonderimGunu,
  outreachSemaKur,
  siraAl,
  siradaki,
  sigortaAt,
  sigortaSifirla,
  sonSonuclar,
  type HedefDurum,
} from "@/lib/outreach-db";
import { ayarlariOku, geriDonusEngeli, hataSiniflandir, isinmaTavani } from "@/lib/outreach-kurallar";
import { iptalAdresi, postaSunucusu, tamMetin, tanitimGonder } from "@/lib/outreach";
import { tamTarih } from "@/lib/zaman";

/**
 * Hedef firma eylemleri. Her birinin ilk satırı `yetki()` — sunucu eylemi
 * doğrudan POST ile çağrılabilir.
 *
 * GÖNDERİM SIRASI (gonderEylemi) — her adım bir öncekini geçmeden çalışmaz:
 *   1. ayarlar tam mı (ayrı kutu, parola)
 *   2. firma gönderilebilir mi (durum, adres, ülke, engel listesi, sistem adresi)
 *   3. alıcının alan adı e-posta alıyor mu (MX) — almıyorsa "Adres hatalı"
 *   4. son 50 gönderimde geri dönüş %10'u geçmedi mi
 *   5. bugünkü tavan dolmadı mı (ısınma: ilk hafta 10, ikinci hafta 15)
 *   6. aralık geçti mi + sigorta atık değil mi — TEK koşullu UPDATE ile
 *      sıra alınır, iki kişi aynı anda basamaz
 *   7. gönder; sonucu kaydet; sunucu itiraz ettiyse sigortayı at
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
  const engel = firmaEngeli(f, await engelliMi(f.eposta));
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

  const { tavan, asama } = isinmaTavani(await ilkGonderimGunu(), ayar.gunlukTavan);
  const bugun = await bugunGonderilen();
  if (bugun >= tavan) {
    return {
      tamam: false,
      mesaj: `Bugünkü tavan doldu (${bugun}/${tavan}${asama ? ` — ${asama}` : ""}). Yarın devam edilir.`,
    };
  }

  if (!(await siraAl(ayar.aralikSn))) {
    const d = await gonderimDurumu();
    const simdi = new Date(d.simdi).getTime();
    if (d.durdu_bitis && new Date(d.durdu_bitis).getTime() > simdi) {
      return {
        tamam: false,
        mesaj: `Gönderim durduruldu (${tamTarih(d.durdu_bitis)}'e kadar): ${d.durdu_sebep}`,
      };
    }
    const gecen = d.son_deneme ? (simdi - new Date(d.son_deneme).getTime()) / 1000 : ayar.aralikSn;
    const bekle = Math.max(1, Math.ceil(ayar.aralikSn - gecen));
    return {
      tamam: false,
      mesaj: `İki gönderim arasında en az ${ayar.aralikSn} sn olmalı — ${bekle} sn sonra gönderilebilir.`,
      bekle,
    };
  }

  const iptalUrl = iptalAdresi(f.iptal_anahtari);
  const gonderilen = tamMetin(govde, f.dil, iptalUrl);
  const cevap = await tanitimGonder(ayar, { alici: f.eposta, konu, govde, dil: f.dil, iptalUrl });
  const ozet = `${f.firma} · ${f.eposta}`;
  const kayit = { firmaId: id, kullanici: ben, eposta: f.eposta, konu, govde: gonderilen };

  if (cevap.durum === "ok") {
    await gonderimKaydet({ ...kayit, sonuc: "ok", yanit: cevap.yanit, mesajKimligi: cevap.mesajKimligi });
    await hedefDurumDegistir(id, "gonderildi");
    await kayitEkle(ben, "hedef_gonder", `firma:${id}`, ozet);
    yenile(id);
    return {
      tamam: true,
      mesaj: `Gönderildi: ${f.eposta} — bugün ${bugun + 1}/${tavan}.`,
      sonraki: await siradaki(filtre, id),
    };
  }

  if (cevap.durum === "belirsiz") {
    /* Gitmiş olabilir. Aynı firmaya ikinci e-postayı atmaktansa bir firmayı
       kaçırmak iyidir: "Gönderildi" işaretlenir, gün durdurulur. */
    await gonderimKaydet({ ...kayit, sonuc: "belirsiz", yanit: cevap.yanit });
    await hedefDurumDegistir(id, "gonderildi");
    await sigortaAt(`${cevap.yanit} — e-posta gitmiş olabilir, gönderen kutusuna bakın.`);
    await kayitEkle(ben, "hedef_gonder_hata", `firma:${id}`, `${ozet} — belirsiz`);
    yenile(id);
    return {
      tamam: false,
      mesaj:
        "Sunucu zamanında cevap vermedi; e-posta gitmiş olabilir. Firma “Gönderildi” işaretlendi, gönderim bugünlük durduruldu.",
    };
  }

  const k = hataSiniflandir(cevap.hata);
  await gonderimKaydet({ ...kayit, sonuc: k.tur === "alici" ? "alici" : "hata", yanit: k.sebep });
  if (k.tur === "alici") await hedefDurumDegistir(id, "hatali");

  /* Sigorta: sunucu itiraz ettiyse hemen; değilse üst üste ikinci başarısızlıkta. */
  const [, onceki] = await sonSonuclar();
  let durdu = false;
  if (k.tur === "sigorta") {
    await sigortaAt(k.sebep);
    durdu = true;
  } else if (onceki && onceki !== "ok") {
    await sigortaAt(`Üst üste iki başarısız gönderim. Son hata: ${k.sebep}`);
    durdu = true;
  }
  await kayitEkle(ben, "hedef_gonder_hata", `firma:${id}`, `${ozet} — ${k.sebep}`);
  yenile(id);
  return {
    tamam: false,
    mesaj: [
      k.tur === "alici" ? "Adres reddedildi; firma “Adres hatalı” işaretlendi." : "Gönderilemedi.",
      k.sebep,
      durdu ? "Gönderim bugünlük durduruldu." : "",
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
  const d = await gonderimDurumu();
  await sigortaSifirla();
  await kayitEkle(ben, "sigorta_sifirla", "", d.durdu_sebep.slice(0, 280));
  yenile();
}

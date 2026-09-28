import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { oturum } from "@/lib/admin-auth";
import { notEkle } from "@/lib/leads-db";
import { kayitEkle } from "@/lib/panel-kayit";
import { ekleriIndir, taslakKaydet, type GidenEk } from "@/lib/posta";
import { adresleriAyikla, ekAdiTemizle } from "@/lib/posta-bicim";
import { EK_TOPLAM_EN_COK, elleGonder } from "@/lib/posta-gonder";

/**
 * Panelden e-posta gönder — yazma formu (yeni, yanıt, ilet) buraya POST eder.
 *
 * Sunucu eylemi DEĞİL, çünkü dosya yükleniyor: eylemlerin gövdesi yetki
 * kontrolünden ÖNCE okunuyor ve sınırı büyütmek her eylemi, oturumu olmayan
 * birinin 20 MB'lık isteğine açardı. Burada önce oturum, sonra boyut, en son
 * gövde okunur. Oturum çerezi SameSite=Lax: başka siteden gelen POST çerezsiz
 * gelir; yine de Origin bu siteden değilse reddedilir.
 *
 * Kurallar (sınır, abonelikten çıkanlar, kayıt) posta-gonder.ts'te — Claude'un
 * ucu da aynı yoldan geçer.
 */
export const dynamic = "force-dynamic";

const ISTEK_EN_COK = EK_TOPLAM_EN_COK + 2 * 1024 * 1024; // ekler + metin ve form sınırları
const DOSYA_EN_COK_ADET = 10;
const PARCA = /^\d{1,3}(\.\d{1,3}){0,9}$/;

const cevap = (tamam: boolean, mesaj: string, status = 200) => NextResponse.json({ tamam, mesaj }, { status });

export async function POST(istek: NextRequest) {
  const ben = await oturum();
  if (!ben) return cevap(false, "Oturum kapanmış — sayfayı yenileyip yeniden giriş yapın.", 401);

  const koken = istek.headers.get("origin");
  if (koken && new URL(koken).host !== istek.headers.get("host")) return cevap(false, "Geçersiz istek.", 403);
  const boy = Number(istek.headers.get("content-length") ?? 0);
  if (!boy || boy > ISTEK_EN_COK) {
    return cevap(false, boy ? "Ekler çok büyük — toplam en çok 20 MB." : "Boş istek.", 413);
  }

  let form: FormData;
  try {
    form = await istek.formData();
  } catch {
    return cevap(false, "Form okunamadı.", 400);
  }
  const alan = (ad: string, max = 500) => String(form.get(ad) ?? "").slice(0, max);

  const dosyalar = form.getAll("dosya").filter((x): x is File => typeof x === "object" && x !== null && x.size > 0);
  if (dosyalar.length > DOSYA_EN_COK_ADET) return cevap(false, `Tek e-postada en çok ${DOSYA_EN_COK_ADET} dosya.`);
  const ekler: GidenEk[] = await Promise.all(
    dosyalar.map(async (f) => ({
      ad: ekAdiTemizle(f.name, "dosya"),
      tur: (f.type || "application/octet-stream").toLowerCase().slice(0, 100),
      icerik: Buffer.from(await f.arrayBuffer()),
    }))
  );

  const iletUid = Math.floor(Number(alan("ilet_uid", 20)));
  const parcalar = form
    .getAll("ilet_parca")
    .map(String)
    .filter((p) => PARCA.test(p))
    .slice(0, 40);
  const iletilenEkler =
    iletUid > 0 && parcalar.length
      ? { kutu: alan("ilet_kutu", 254), klasor: alan("ilet_klasor", 200) || "gelen", uid: iletUid, parcalar }
      : undefined;
  /* Açık taslak: hangi kutunun Taslaklar'ında, hangi UID ile. Gönderen
     değiştirilmiş olabilir — taslak kendi kutusundan silinir. */
  const kutu = alan("kutu", 254).trim().toLowerCase();
  const taslakUid = Math.floor(Number(alan("taslak_uid", 20))) || 0;
  const taslak = taslakUid > 0 ? { kutu: alan("taslak_kutu", 254).trim().toLowerCase() || kutu, uid: taslakUid } : undefined;
  const mesajKimligi = alan("mesaj_kimligi", 1000);
  const referanslar = alan("referanslar", 4000);

  /* Taslak kaydet: gönderim kuralları yok (alıcı eksik olabilir), kutunun
     Taslaklar klasörüne konur; eskisi varsa değiştirilir. */
  if (alan("islem", 20) === "taslak") {
    let tasinan: GidenEk[] = [];
    if (iletilenEkler) {
      const r = await ekleriIndir(iletilenEkler.kutu, iletilenEkler.klasor, iletilenEkler.uid, iletilenEkler.parcalar, EK_TOPLAM_EN_COK);
      if (!r.tamam) return cevap(false, r.hata);
      tasinan = r.ekler;
    }
    const liste = (ad: string) => adresleriAyikla(alan(ad, 4000)).gecerli;
    const r = await taslakKaydet({
      kutuAdresi: kutu,
      kime: liste("kime"),
      bilgi: liste("bilgi"),
      gizli: liste("gizli"),
      konu: alan("konu", 300),
      metin: alan("metin", 50_000),
      ekler: [...tasinan, ...ekler],
      yanitlanan: mesajKimligi ? { mesajKimligi, referanslar } : undefined,
      eski: taslak,
    });
    if (!r.tamam) return cevap(false, r.hata);
    revalidatePath("/admin/eposta");
    const saat = new Date().toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
    return NextResponse.json({
      tamam: true,
      mesaj: r.uid ? `Taslak kaydedildi (${saat}).` : `Taslak kaydedildi (${saat}) — ama kutuda bulunamadı; yeniden kaydederseniz ikinci kopya oluşur.`,
      taslak: r.uid ? { kutu, uid: r.uid, ekler: r.ekler } : null,
    });
  }

  const sonuc = await elleGonder({
    kim: ben,
    kutu,
    kime: alan("kime", 4000),
    bilgi: alan("bilgi", 4000),
    gizli: alan("gizli", 4000),
    konu: alan("konu", 300),
    metin: alan("metin", 50_000),
    mesajKimligi,
    referanslar,
    yanitUid: Number(alan("yanit_uid", 20)),
    yanitKlasor: alan("yanit_klasor", 200) || "gelen",
    yanitKutu: alan("yanit_kutu", 254),
    taslak,
    ekler,
    iletilenEkler,
  });
  if (sonuc.tamam) {
    revalidatePath("/admin/eposta");
    /* Talep iletildiyse talebin notlarına iz: kime, hangi kutudan. Not
       yazılamasa da gönderim geçerli — mail gitti. */
    const talepId = Math.floor(Number(alan("talep_id", 20)));
    if (talepId > 0) {
      const kime = adresleriAyikla(alan("kime", 4000)).gecerli;
      const bilgi = adresleriAyikla(alan("bilgi", 4000)).gecerli;
      const not = `İletildi: ${kime.join(", ")}${bilgi.length ? ` · bilgi: ${bilgi.join(", ")}` : ""} — ${kutu} kutusundan`;
      await notEkle(talepId, not, ben).catch(() => {});
      await kayitEkle(ben, "not", `talep:${talepId}`, `Talep #${talepId} — ${not}`).catch(() => {});
      revalidatePath(`/admin/talep/${talepId}`);
    }
  }
  return cevap(sonuc.tamam, sonuc.mesaj);
}

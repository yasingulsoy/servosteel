"use server";

import { revalidatePath } from "next/cache";
import { adminYetkisi, yetki } from "@/lib/admin-yetki";
import { kayitEkle } from "@/lib/panel-kayit";
import {
  HEDEF_DURUMLAR,
  HEDEF_DURUM_ETIKET,
  engelle,
  hedefDurumDegistir,
  hedefFirma,
  hedefNotEkle,
  outreachSemaKur,
  siradaki,
  sigortaSifirla,
  type HedefDurum,
} from "@/lib/outreach-db";
import { ayarlariOku } from "@/lib/outreach-kurallar";
import { tekGonderim } from "@/lib/gonderim";
import { gelenKutulariTara } from "@/lib/gelen-tarama";

/**
 * Hedef firma eylemleri. Her birinin ilk satırı `yetki()` — sunucu eylemi
 * doğrudan POST ile çağrılabilir.
 *
 * Gönderimin kuralları ve sırası src/lib/gonderim.ts'te (tekGonderim): elle
 * gönderim ile otomatik gönderici aynı fonksiyondan geçer.
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
  const filtre = {
    grup: metin(form.get("grup"), 2) || undefined,
    ulke: metin(form.get("ulke"), 80) || undefined,
    segment: metin(form.get("segment"), 80) || undefined,
  };
  if (!Number.isInteger(id)) return { tamam: false, mesaj: "Geçersiz istek." };
  /* Kurallar tek yerde: elle gönderim ile otomatik gönderici aynı yoldan geçer */
  const r = await tekGonderim({
    firmaId: id,
    konu: metin(form.get("konu"), 300),
    govde: govdeAl(form.get("govde")),
    kullanici: ben,
  });
  yenile(id);
  return {
    tamam: r.tamam,
    mesaj: r.mesaj,
    bekle: r.bekle,
    sonraki: r.tamam ? await siradaki(filtre, id) : undefined,
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

import { csv, csvCevabi } from "@/lib/csv";
import { kayitEkle } from "@/lib/kayit";
import { oturum } from "@/lib/oturum";
import { RED_SEBEBI, TEKLIF_DURUMU } from "@/lib/sabitler";
import { teklifler } from "@/lib/veri";

/** Teklifler Excel'e. Tutar Excel'in Türkçe ayarında sayı olarak okunsun diye virgüllü. */
export async function GET(istek: Request) {
  const ben = await oturum();
  if (!ben) return new Response("Giriş gerekli", { status: 401 });
  const d = new URL(istek.url).searchParams.get("durum") ?? "";
  const liste = await teklifler(d in TEKLIF_DURUMU ? d : undefined);
  const icerik = csv(
    ["Tarih", "Firma", "Ülke", "Teklif no", "Konu", "Tutar", "Döviz", "Durum", "Red sebebi", "Geçerlilik", "Giren"],
    liste.map((t) => [
      t.tarih,
      t.firma_ad,
      t.firma_ulke,
      t.teklif_no,
      t.konu,
      t.tutar ? String(Number(t.tutar)).replace(".", ",") : "",
      t.doviz,
      TEKLIF_DURUMU[t.durum],
      t.red_sebebi ? RED_SEBEBI[t.red_sebebi] : "",
      t.gecerlilik,
      t.olusturan,
    ])
  );
  await kayitEkle(ben, "disa_aktar", "teklifler", `${liste.length} teklif`);
  return csvCevabi("crm-teklifler", icerik);
}

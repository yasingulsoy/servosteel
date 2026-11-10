import { csv, csvCevabi } from "@/lib/csv";
import { kayitEkle } from "@/lib/kayit";
import { oturum } from "@/lib/oturum";
import { kisiListesi } from "../veri";

/** Kişi listesi Excel'e — sayfadaki aramanın aynısıyla, sınırsız. */
export async function GET(istek: Request) {
  const ben = await oturum();
  if (!ben) return new Response("Giriş gerekli", { status: 401 });
  const q = (new URL(istek.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  const liste = await kisiListesi(q, 100_000);
  await kayitEkle(ben, "disa_aktar", "kisiler", `${liste.length} kişi${q ? `, arama: ${q}` : ""}`);
  return csvCevabi(
    "kisiler",
    csv(
      ["Ad", "Unvan", "E-posta", "Telefon", "Firma", "Ülke", "Son temas"],
      liste.map((k) => [k.ad, k.unvan, k.eposta, k.telefon, k.firma, k.ulke, k.sonTemas]),
    ),
  );
}

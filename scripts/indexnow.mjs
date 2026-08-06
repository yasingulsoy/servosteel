/**
 * IndexNow — sitemap'teki tüm URL'leri Bing ve Yandex'e anında bildirir.
 *
 * Neden var: geçişten sonraki darboğaz içerik değil, TARAMA. Google 424
 * sayfanın çok azını görmüş durumda ve kendi hızında ilerliyor — beklemekten
 * başka yapılacak bir şey yok. Bing ve Yandex ise IndexNow'ı destekliyor:
 * bildirilen URL genelde saatler içinde sıraya giriyor.
 *
 * Yandex ayrıca doğrudan iş sonucu: Rusya'da pazarın %60'ından fazlası orada
 * ve Wordstat ölçümü o pazarın sandığımızdan büyük olduğunu gösterdi.
 *
 * Anahtar `public/<anahtar>.txt` içinde ve içeriği anahtarın kendisi. Sunucu
 * bunu 200 ile dönmeden bildirim REDDEDİLİR — yani önce deploy, sonra bu
 * script. Anahtar gizli değil, sahiplik kanıtı; herkese açık olması normal.
 *
 * Kullanım:
 *   node scripts/indexnow.mjs           # sitemap'ten okur, gönderir
 *   node scripts/indexnow.mjs --dry     # göndermez, ne göndereceğini yazar
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://servosteel.com.tr";
const HOST = new URL(SITE).host;
const KURU = process.argv.includes("--dry");

/* Anahtarı public/ altındaki 32 haneli .txt dosyasından bul — tek kaynak,
   iki yere yazılıp birbirinden ayrışamaz. */
function anahtar() {
  const dosya = readdirSync(join(process.cwd(), "public"))
    .find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!dosya) {
    throw new Error("public/ altında IndexNow anahtar dosyası yok (<32 hane>.txt).");
  }
  return dosya.replace(/\.txt$/, "");
}

async function sitemapUrlleri() {
  const r = await fetch(`${SITE}/sitemap.xml`);
  if (!r.ok) throw new Error(`sitemap.xml ${r.status}`);
  const xml = await r.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function anahtarErisilebilirMi(k) {
  const r = await fetch(`${SITE}/${k}.txt`);
  if (!r.ok) return false;
  return (await r.text()).trim() === k;
}

const key = anahtar();
const urls = await sitemapUrlleri();
console.log(`anahtar : ${key}`);
console.log(`sitemap : ${urls.length} URL`);

const erisilir = await anahtarErisilebilirMi(key);
console.log(`anahtar dosyası canlıda: ${erisilir ? "EVET" : "HAYIR"}`);
if (!erisilir) {
  console.log(`\n  ${SITE}/${key}.txt henüz yayında değil.`);
  console.log("  Önce deploy edilmeli; aksi halde IndexNow bildirimi reddeder.");
  if (!KURU) process.exit(1);
}

if (KURU) {
  console.log(`\n[kuru çalışma] gönderilecek ilk 5:`);
  urls.slice(0, 5).forEach((u) => console.log(`  ${u}`));
  process.exit(0);
}

/* IndexNow tek istekte en fazla 10.000 URL kabul ediyor; yine de parçalıyoruz
   ki bir parça reddedilirse hepsi birden düşmesin. */
const PARCA = 1000;
let basarili = 0;
let basarisiz = 0;

for (let i = 0; i < urls.length; i += PARCA) {
  const dilim = urls.slice(i, i + PARCA);
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/${key}.txt`, urlList: dilim }),
  });
  /* 200 = alındı, 202 = alındı ama anahtar doğrulaması sürüyor. İkisi de iyi. */
  const ok = r.status === 200 || r.status === 202;
  if (ok) basarili += dilim.length;
  else basarisiz += dilim.length;
  console.log(
    `  ${i + 1}-${i + dilim.length}: HTTP ${r.status}` +
      (r.status === 202 ? "  (alındı, doğrulama sürüyor)" : ok ? "  (alındı)" : "  REDDEDİLDİ")
  );
  if (!ok) console.log(`    ${(await r.text()).slice(0, 240)}`);
}

/* Bu blok bilerek koşullu: script'in ilk hâli istek 403 dönmesine rağmen
   "Bitti, iletildi" yazıyordu. Başarısızlığı başarı diye raporlayan bir araç
   işe yaramaz — çıkış kodu da onu yansıtmalı ki otomasyonda fark edilsin. */
if (basarisiz === 0) {
  console.log(`\n${basarili} URL iletildi — Bing, Yandex ve IndexNow'ı paylaşan diğer motorlara.`);
} else {
  console.log(`\nGÖNDERİLEMEDİ: ${basarisiz} URL reddedildi${basarili ? `, ${basarili} iletildi` : ""}.`);
  console.log(
    "SiteVerificationNotCompleted ise: anahtar dosyası yeni yayınlanmıştır ve\n" +
      "IndexNow onu henüz kendisi çekmemiştir. Doğrulama asenkron — birkaç saat\n" +
      "sonra tekrar çalıştır, kod değişikliği gerekmiyor."
  );
  process.exit(1);
}

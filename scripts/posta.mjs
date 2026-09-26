/**
 * E-posta kutularına komut satırından erişim — sitedeki /api/posta ucunu
 * çağırır. Panelin E-posta sayfasının yaptığını yapar: kutuları sayar, klasör
 * listeler, ileti okur, yazar, yanıtlar, iletir. Claude bunu kullanır.
 *
 * Anahtar: POSTA_API_ANAHTARI (.env.local ya da ortam) — sunucudakiyle AYNI.
 * Adres:   POSTA_API_ADRESI, yoksa https://servosteel.com.tr
 *          (yerelde denemek için: --adres http://localhost:3200)
 *
 *   node scripts/posta.mjs kutular
 *   node scripts/posta.mjs yanitlar [adet]
 *   node scripts/posta.mjs liste <kutu> [gelen|giden] [sayfa]
 *   node scripts/posta.mjs oku <kutu> <uid> [gelen|giden]
 *   node scripts/posta.mjs yanitla <kutu> <uid> --metin-dosya yanit.txt [--bilgi a@b.com] [--alintisiz]
 *   node scripts/posta.mjs gonder <kutu> --kime a@b.com --konu "…" --metin-dosya metin.txt
 *   node scripts/posta.mjs ilet <kutu> <uid> --kime a@b.com [--metin "…"] [--klasor giden]
 *
 * <kutu>: "ege" ya da "ege@servosteel.com.tr".
 * Metin: --metin "…" ya da --metin-dosya <dosya> (UTF-8). İmza sunucuda
 * eklenir (panelle aynı); istemezseniz --imzasiz.
 *
 * GÖNDERMEZ, --gonder verilmedikçe: önce e-postanın son hâlini (kime, konu,
 * metin + imza + alıntı) gösterir ve sunucudaki kontrolleri (adres, saatlik
 * sınır, abonelikten çıkanlar) çalıştırır. --json: ham cevap.
 */
import fs from "node:fs";

const ANAHTARLI = new Set(["kime", "bilgi", "konu", "metin", "metin-dosya", "klasor", "adres"]);
const konum = [];
const bayrak = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) {
    konum.push(a);
    continue;
  }
  const [ad, esit] = a.slice(2).split(/=(.*)/s);
  if (ANAHTARLI.has(ad)) bayrak[ad] = esit ?? argv[++i] ?? "";
  else bayrak[ad] = true;
}

function envOku() {
  try {
    return Object.fromEntries(
      fs
        .readFileSync(".env.local", "utf8")
        .split(/\r?\n/)
        .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
        .map((l) => {
          const i = l.indexOf("=");
          return [
            l.slice(0, i).trim(),
            l
              .slice(i + 1)
              .trim()
              .replace(/^['"]|['"]$/g, ""),
          ];
        })
    );
  } catch {
    return {};
  }
}

/* process.exit() KULLANILMAZ: Windows'ta fetch'in açık soketiyle çakışıp Node'u
   çökertiyor (UV_HANDLE_CLOSING). Hata fırlatılır, çıkış kodu process.exitCode. */
class Dur extends Error {}
const dur = (mesaj) => {
  throw new Dur(mesaj);
};

async function calis() {
  const [islem, ...geri] = konum;
  if (!islem || bayrak.yardim || bayrak.help) {
    console.log(
      fs
        .readFileSync(new URL(import.meta.url), "utf8")
        .split("*/")[0]
        .replace(/^\/\*\*?|^ \* ?/gm, "")
    );
    return 0;
  }

  const env = { ...envOku(), ...process.env };
  const anahtar = env.POSTA_API_ANAHTARI ?? "";
  if (anahtar.length < 32) dur("POSTA_API_ANAHTARI yok ya da kısa (.env.local) — sunucudakiyle aynı değer olmalı.");
  const adres = String(bayrak.adres || env.POSTA_API_ADRESI || "https://servosteel.com.tr").replace(/\/+$/, "");

  function metinAl() {
    if (typeof bayrak["metin-dosya"] === "string" && bayrak["metin-dosya"]) {
      try {
        return fs.readFileSync(bayrak["metin-dosya"], "utf8");
      } catch (e) {
        dur(`Metin dosyası okunamadı: ${e.message}`);
      }
    }
    return typeof bayrak.metin === "string" ? bayrak.metin.replace(/\\n/g, "\n") : "";
  }

  /** İstek gövdesi: komut + konum argümanları + bayraklar */
  const govde = { islem };
  if (islem === "yanitlar") govde.adet = Number(geri[0]) || 10;
  if (["liste", "oku", "yanitla", "gonder", "ilet"].includes(islem)) govde.kutu = geri[0];
  if (islem === "liste") Object.assign(govde, { klasor: geri[1] || "gelen", sayfa: Number(geri[2]) || 1 });
  if (islem === "oku") Object.assign(govde, { uid: Number(geri[1]), klasor: geri[2] || bayrak.klasor || "gelen" });
  if (["yanitla", "ilet"].includes(islem)) Object.assign(govde, { uid: Number(geri[1]), klasor: bayrak.klasor || "gelen" });
  if (["yanitla", "gonder", "ilet"].includes(islem)) {
    Object.assign(govde, {
      kime: bayrak.kime ?? "",
      bilgi: bayrak.bilgi ?? "",
      konu: bayrak.konu ?? "",
      metin: metinAl(),
      alinti: !bayrak.alintisiz,
      imza: !bayrak.imzasiz,
      dene: !bayrak.gonder,
    });
  }

  let cevap;
  try {
    cevap = await fetch(`${adres}/api/posta`, {
      method: "POST",
      headers: { authorization: `Bearer ${anahtar}`, "content-type": "application/json" },
      body: JSON.stringify(govde),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (e) {
    dur(`${adres} adresine ulaşılamadı: ${e.message}`);
  }
  /* Kapalı uç düz "Not Found" döner (JSON değil) — var olduğu söylenmez. */
  const v = await cevap.json().catch(() => null);
  if (!v) {
    dur(
      cevap.status === 404
        ? "Uç kapalı ya da anahtar tutmuyor (404): sunucuda POSTA_API_ANAHTARI tanımlı ve .env.local'dakiyle aynı mı, deploy yapıldı mı?"
        : `Beklenmeyen cevap: HTTP ${cevap.status}`
    );
  }
  if (bayrak.json) {
    console.log(JSON.stringify(v, null, 2));
    return v.tamam ? 0 : 1;
  }
  if (!v.tamam && !v.taslak) dur(`Hata: ${v.hata}`);

  const tarih = (iso) =>
    iso
      ? new Date(iso).toLocaleString("tr-TR", {
          timeZone: "Europe/Istanbul",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const kes = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n));
  const TUR = {
    yanit: "YANIT",
    geri_donus: "geri dönüş",
    otomatik: "otomatik",
    abonelik: "abonelik iptali",
    ilgisiz: "",
  };

  if (islem === "kutular") {
    for (const k of v.kutular) {
      console.log(`${k.user.padEnd(34)} ${k.ad}${k.bekleyenYanit ? `  · ${k.bekleyenYanit} yanıt bekliyor` : ""}`);
    }
  } else if (islem === "yanitlar") {
    for (const y of v.yanitlar) {
      console.log(`${tarih(y.islendi)}  ${y.kutu}  uid ${y.uid}  ${y.firma ?? "—"}${y.ulke ? ` (${y.ulke})` : ""}`);
      console.log(`   ${y.kimden} — ${y.konu}`);
      if (y.ozet) console.log(`   ${y.ozet.replace(/\s+/g, " ").slice(0, 160)}`);
    }
  } else if (islem === "liste") {
    const ad = v.klasor === "giden" ? "Gönderilmiş" : "Gelen";
    console.log(`${v.kutu} · ${ad} · ${v.toplam} ileti · sayfa ${v.sayfa}/${v.sayfaSayisi}\n`);
    if (v.klasorYolu === null) console.log("(Bu kutuda Gönderilmiş klasörü yok — ilk gönderimde oluşturulur.)");
    for (const m of v.iletiler) {
      const isaret = `${m.okundu ? " " : "●"}${m.yanitlandi ? "↩" : " "}${m.ekVar ? "+" : " "}`;
      const sinif =
        m.sinif && TUR[m.sinif.tur] ? ` [${TUR[m.sinif.tur]}${m.sinif.firma ? ` · ${m.sinif.firma}` : ""}]` : "";
      const firma = !sinif && m.firma ? ` [${m.firma.firma}]` : "";
      console.log(
        `${String(m.uid).padStart(6)} ${isaret} ${tarih(m.tarih)}  ${kes(m.kisi, 26)}  ${m.konu}${sinif}${firma}`
      );
    }
    if (v.sayfa < v.sayfaSayisi)
      console.log(`\nDaha eski: node scripts/posta.mjs liste ${v.kutu} ${v.klasor} ${v.sayfa + 1}`);
  } else if (islem === "oku") {
    const x = v.ileti;
    console.log(`Konu:   ${x.konu}`);
    console.log(`Kimden: ${x.kimden}${v.firma ? `   [hedef firma: ${v.firma.firma}]` : ""}`);
    console.log(`Kime:   ${x.kime}`);
    if (x.bilgi) console.log(`Bilgi:  ${x.bilgi}`);
    console.log(`Tarih:  ${tarih(x.tarih)}`);
    if (x.ekler.length) console.log(`Ekler:  ${x.ekler.join(", ")}`);
    console.log(`\n${x.metin}`);
    if (x.kirpildi) console.log("\n[ileti çok büyük — kırpıldı]");
  } else {
    const t = v.taslak;
    console.log(`Kimden: ${t.kutu}\nKime:   ${t.kime}${t.bilgi ? `\nBilgi:  ${t.bilgi}` : ""}\nKonu:   ${t.konu}\n`);
    console.log(t.metin);
    console.log(`\n${"─".repeat(60)}`);
    console.log(v.tamam ? v.mesaj : `OLMADI: ${v.mesaj}`);
    if (v.tamam && v.dene) console.log("Göndermek için aynı komutu --gonder ile çalıştırın.");
    return v.tamam ? 0 : 1;
  }
  return 0;
}

try {
  process.exitCode = await calis();
} catch (e) {
  if (!(e instanceof Dur)) throw e;
  console.error(e.message);
  process.exitCode = 1;
}

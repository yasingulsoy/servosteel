import assert from "node:assert/strict";
/**
 * Tanıtım e-postası kurallarının testi — saf fonksiyonlar, veritabanı ve ağ yok.
 *
 *   node scripts/outreach-kurallar-test.mjs
 *
 * Node .ts dosyasını tür ayıklamasıyla doğrudan içe aktarıyor (Node 23.6+).
 * Kurallar değişince (ülke engeli, sigorta sınıflandırması, tavan/aralık
 * sınırları, altbilgi) önce bu çalıştırılır; gönderim akışının uçtan uca
 * denemesi için scripts/smtp-yutucu.py.
 */
const K = await import(new URL("../src/lib/outreach-kurallar.ts", import.meta.url).href);

let n = 0;
const t = (ad, fn) => { fn(); n++; console.log("  ok -", ad); };

t("dil geri dusmesi", () => {
  assert.equal(K.epostaDili("hu"), "en");
  assert.equal(K.epostaDili("ar"), "en");
  assert.equal(K.epostaDili("pl"), "pl");
});
t("altbilgi", () => {
  const a = K.altbilgi("pl", "https://x/api/unsubscribe?t=abc", "UNVAN", "ADRES");
  assert.ok(a.startsWith("\n\n-- \n"));
  assert.ok(a.includes("Rezygnacja: https://x/api/unsubscribe?t=abc"));
  assert.ok(a.endsWith("UNVAN\nADRES"));
  assert.ok(K.altbilgi("hu", "U", "A", "B").includes("Unsubscribe: U"));
});
t("maskele", () => {
  assert.equal(K.maskele("info@firma.com"), "in**@firma.com");
  assert.equal(K.maskele("ab@x.com"), "a**@x.com");
  assert.equal(K.maskele("ventas.mexico@racksm.com.mx"), "ve***********@racksm.com.mx");
  assert.equal(K.maskele("bozuk"), "");
});
t("eposta gecerli", () => {
  for (const e of ["info@firma.com", "p.osnastka.uz@gmail.com", "a+b@x-y.co.uk"]) assert.ok(K.epostaGecerli(e), e);
  for (const e of ["", "a@b", "a b@c.com", "a@b.c", "<a@b.com>", "a@b.com;c@d.com"]) assert.ok(!K.epostaGecerli(e), e);
});
t("siniflandirma", () => {
  const s = (h) => K.hataSiniflandir(h).tur;
  assert.equal(s({ code: "EAUTH", responseCode: 535, response: "535 5.7.8 Error: authentication failed" }), "sigorta");
  assert.equal(s({ code: "EENVELOPE", responseCode: 421, response: "421 4.7.0 Too many messages", command: "MAIL FROM" }), "sigorta");
  assert.equal(s({ code: "EENVELOPE", responseCode: 451, response: "451 4.3.0 Temporary lookup failure", command: "RCPT TO" }), "sigorta");
  assert.equal(s({ code: "EENVELOPE", responseCode: 550, response: "550 5.1.1 <x>: Recipient address rejected: User unknown in virtual mailbox table", command: "RCPT TO" }), "alici");
  assert.equal(s({ code: "EMESSAGE", responseCode: 554, response: "554 5.7.1 Message rejected as spam", command: "DATA" }), "sigorta");
  assert.equal(s({ code: "EENVELOPE", responseCode: 550, response: "550 5.7.1 Relaying denied", command: "RCPT TO" }), "sigorta");
  assert.equal(s({ code: "EENVELOPE", responseCode: 550, response: "550 Sender exceeded the max emails per hour (100) allowed", command: "MAIL FROM" }), "sigorta");
  assert.equal(s({ code: "ECONNECTION", message: "connect ECONNREFUSED 127.0.0.1:2525" }), "hata");
  assert.equal(s({ code: "ETIMEDOUT", message: "Greeting never received", command: "CONN" }), "hata");
  /* "limit/exceed" geçtiği için boyut reddi de günü durdurur — bilerek: aynı
     metin her firmada aynı boyutta, ertesi denemede de reddedilir. */
  assert.equal(s({ code: "EMESSAGE", responseCode: 552, response: "552 5.3.4 Message size exceeds fixed limit", command: "DATA" }), "sigorta");
  /* Sunucu cevabı mesajın içinde de geçiyorsa sebep tek kez yazılır. */
  const k = K.hataSiniflandir({ responseCode: 421, response: "421 4.7.0 Try later", message: "Mail command failed: 421 4.7.0 Try later" });
  assert.equal(k.sebep.split("421 4.7.0 Try later").length - 1, 1);
});
t("ayarlar", () => {
  const bos = K.ayarlariOku({});
  assert.deepEqual(bos.eksik, ["OUTREACH_SMTP_HOST", "OUTREACH_SMTP_USER", "OUTREACH_SMTP_PASS"]);
  const ayni = K.ayarlariOku({ SMTP_HOST: "h", SMTP_USER: "website@x.com", OUTREACH_SMTP_USER: "Website@x.com", OUTREACH_SMTP_PASS: "p" });
  assert.equal(ayni.host, "h");
  assert.equal(ayni.eksik.length, 1);
  assert.match(ayni.eksik[0], /ayrı bir kutu/);
  const tam = K.ayarlariOku({ OUTREACH_SMTP_HOST: "h", OUTREACH_SMTP_USER: "export@x.com", OUTREACH_SMTP_PASS: "p", OUTREACH_DAILY_LIMIT: "500", OUTREACH_INTERVAL_SEC: "10" });
  assert.deepEqual(tam.eksik, []);
  assert.equal(tam.gunlukTavan, 50);
  assert.equal(tam.aralikSn, 60);
  assert.equal(tam.port, 465);
  assert.equal(tam.gondericiAdi, "Servosteel");
  const varsayilan = K.ayarlariOku({ OUTREACH_DAILY_LIMIT: "abc", OUTREACH_INTERVAL_SEC: "" });
  assert.equal(varsayilan.gunlukTavan, 20);
  assert.equal(varsayilan.aralikSn, 90);
});
t("ulke kurallari", () => {
  assert.ok(K.ENGELLI_ULKELER["Almanya"]);
  assert.ok(K.ENGELLI_ULKELER["Avusturya"]);
  assert.equal(K.ENGELLI_ULKELER["Polonya"], undefined);
  assert.ok(K.ulkeUyarisi("Polonya"));
  assert.equal(K.ulkeUyarisi("Hindistan"), null);
});
t("iptal sayfasi dilleri tam", () => {
  for (const d of ["en", "es", "it", "de", "pl", "ru", "tr", "fr", "pt"]) {
    const m = K.IPTAL_SAYFASI[d];
    for (const a of ["baslik", "soru", "dugme", "tamam", "gecersiz"]) assert.ok(m[a], d + "." + a);
    assert.ok(m.soru.includes("{eposta}") && m.tamam.includes("{eposta}"), d);
  }
});
console.log(`${n} test gecti`);

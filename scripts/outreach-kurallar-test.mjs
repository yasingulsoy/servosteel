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
const S = await import(new URL("../src/lib/saat-dilimi.ts", import.meta.url).href);

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
t("ayarlar: tek kutu", () => {
  const bos = K.ayarlariOku({});
  assert.deepEqual(bos.eksik, ["OUTREACH_SMTP_HOST", "OUTREACH_SMTP_USER", "OUTREACH_SMTP_PASS"]);
  assert.equal(bos.kutular.length, 0);
  const ayni = K.ayarlariOku({ SMTP_HOST: "h", SMTP_USER: "website@x.com", OUTREACH_SMTP_USER: "Website@x.com", OUTREACH_SMTP_PASS: "p" });
  assert.equal(ayni.kutular.length, 0);
  assert.equal(ayni.eksik.length, 1);
  assert.match(ayni.eksik[0], /ayrı bir kutu/);
  const tam = K.ayarlariOku({ OUTREACH_SMTP_HOST: "h", OUTREACH_SMTP_USER: "Export@X.com", OUTREACH_SMTP_PASS: "p", OUTREACH_DAILY_LIMIT: "500", OUTREACH_INTERVAL_SEC: "10", OUTREACH_DOMAIN_DAILY_LIMIT: "900" });
  assert.deepEqual(tam.eksik, []);
  assert.deepEqual(tam.uyarilar, []);
  assert.equal(tam.gunlukTavan, 50);
  assert.equal(tam.alanTavani, 200);
  assert.equal(tam.aralikSn, 60);
  assert.deepEqual(tam.kutular, [{ no: 1, host: "h", port: 465, user: "export@x.com", pass: "p", ad: "Servosteel", alan: "x.com" }]);
  const varsayilan = K.ayarlariOku({ OUTREACH_DAILY_LIMIT: "abc", OUTREACH_INTERVAL_SEC: "" });
  assert.equal(varsayilan.gunlukTavan, 20);
  assert.equal(varsayilan.alanTavani, 50);
  assert.equal(varsayilan.aralikSn, 90);
});
t("ayarlar: ek kutular", () => {
  const a = K.ayarlariOku({
    OUTREACH_SMTP_HOST: "mail.servosteel.com.tr", OUTREACH_SMTP_USER: "export@servosteel.com.tr", OUTREACH_SMTP_PASS: "p1",
    OUTREACH_FROM_NAME: "Elizaveta Shpelevaya", SMTP_USER: "website@servosteel.com.tr",
    OUTREACH_SMTP_USER_2: "liza@servosteel-export.com", OUTREACH_SMTP_PASS_2: "p2", OUTREACH_SMTP_HOST_2: "mail.servosteel-export.com",
    OUTREACH_SMTP_USER_3: "ali@servosteel-export.com",                       // parola yok
    OUTREACH_SMTP_USER_4: "EXPORT@servosteel.com.tr", OUTREACH_SMTP_PASS_4: "p4",   // 1. kutuyla aynı
    OUTREACH_SMTP_USER_5: "website@servosteel.com.tr", OUTREACH_SMTP_PASS_5: "p5",  // form kutusu
    OUTREACH_SMTP_USER_6: "sales@servosteel-export.com", OUTREACH_SMTP_PASS_6: "p6", OUTREACH_FROM_NAME_6: "Servosteel Sales", OUTREACH_SMTP_PORT_6: "587",
  });
  assert.deepEqual(a.eksik, []);
  assert.deepEqual(a.kutular.map((k) => [k.no, k.user, k.alan, k.host, k.port, k.ad]), [
    [1, "export@servosteel.com.tr", "servosteel.com.tr", "mail.servosteel.com.tr", 465, "Elizaveta Shpelevaya"],
    [2, "liza@servosteel-export.com", "servosteel-export.com", "mail.servosteel-export.com", 465, "Elizaveta Shpelevaya"],
    [6, "sales@servosteel-export.com", "servosteel-export.com", "mail.servosteel.com.tr", 587, "Servosteel Sales"],
  ]);
  assert.equal(a.uyarilar.length, 3);
  assert.match(a.uyarilar[0], /3\. kutu.*OUTREACH_SMTP_PASS_3/);
  assert.match(a.uyarilar[1], /4\. kutu.*başka bir kutuyla aynı/);
  assert.match(a.uyarilar[2], /5\. kutu.*form bildirim/);
  /* 1. kutu yarım ama ek kutu tam: gönderim açık, uyarı var */
  const b = K.ayarlariOku({ OUTREACH_SMTP_HOST: "h", OUTREACH_SMTP_USER: "x@a.com", OUTREACH_SMTP_USER_2: "y@b.com", OUTREACH_SMTP_PASS_2: "p" });
  assert.deepEqual(b.eksik, []);
  assert.deepEqual(b.kutular.map((k) => k.no), [2]);
  assert.match(b.uyarilar[0], /1\. kutu.*OUTREACH_SMTP_PASS/);
});
t("alan adi isinmasi", () => {
  assert.equal(K.alanIsinmaTavani(null, 50).tavan, 20);
  assert.equal(K.alanIsinmaTavani(0, 150).tavan, 20);
  assert.equal(K.alanIsinmaTavani(1, 150).tavan, 70);
  assert.equal(K.alanIsinmaTavani(3, 150).tavan, 110);
  assert.equal(K.alanIsinmaTavani(4, 150).tavan, 150);
  assert.equal(K.alanIsinmaTavani(4, 150).asama, null);
  /* Ayarlanan tavan kademeden düşükse o kazanır */
  assert.equal(K.alanIsinmaTavani(2, 10).tavan, 10);
});
t("kutu secimi", () => {
  const kutu = (no, user) => ({ no, host: "h", port: 465, user, pass: "p", ad: "A", alan: user.split("@")[1] });
  const ayar = { kutular: [kutu(1, "a@x.com"), kutu(2, "b@x.com"), kutu(3, "c@y.com")], gunlukTavan: 20, alanTavani: 50, aralikSn: 90 };
  const d = (o) => ({ bugun: 0, ilkGun: 20, gecenSn: null, durdu: false, durduBitis: null, durduSebep: "", ...o });
  const eski = { bugun: 0, ilkGun: 20 };
  /* bugün en az gönderen önce; eşitse numara sırası */
  let s = K.kutuSec(ayar, { "a@x.com": d({ bugun: 5 }), "b@x.com": d({ bugun: 2 }), "c@y.com": d({ bugun: 2 }) },
    { "x.com": { bugun: 7, ilkGun: 20 }, "y.com": { bugun: 2, ilkGun: 20 } });
  assert.deepEqual(s.uygun.map((k) => k.no), [2, 3, 1]);
  assert.equal(s.bekle, null);
  assert.equal(s.gunlukKapasite, 40 + 20);       // x.com: min(50, 20+20) · y.com: min(50, 20)
  assert.equal(s.kalan, (15 + 18) + 18);
  /* sigorta atık kutu atlanır ve kapasiteden düşer */
  s = K.kutuSec(ayar, { "a@x.com": d({ durdu: true, durduSebep: "421" }), "b@x.com": d(), "c@y.com": d() },
    { "x.com": eski, "y.com": eski });
  assert.deepEqual(s.uygun.map((k) => k.no), [2, 3]);
  assert.match(s.satirlar[0].engel, /durdu: 421/);
  assert.equal(s.gunlukKapasite, 20 + 20);
  /* alan adı tavanı: kutular eski (tavan 20) ama x.com ilk haftasında (20) ve 20 gitmiş → a ve b durur, c sürer */
  s = K.kutuSec(ayar, { "a@x.com": d({ bugun: 10 }), "b@x.com": d({ bugun: 10 }), "c@y.com": d() },
    { "x.com": { bugun: 20, ilkGun: 0 }, "y.com": eski });
  assert.deepEqual(s.uygun.map((k) => k.no), [3]);
  assert.match(s.satirlar[0].engel, /x\.com alan adının bugünkü tavanı doldu \(20\/20\)/);
  /* aralık: hepsi yeni göndermişse en kısa bekleme döner */
  s = K.kutuSec(ayar, { "a@x.com": d({ gecenSn: 30 }), "b@x.com": d({ gecenSn: 70 }), "c@y.com": d({ gecenSn: 10 }) },
    { "x.com": eski, "y.com": eski });
  assert.deepEqual(s.uygun, []);
  assert.equal(s.bekle, 20);
  assert.equal(s.sebep, null);
  /* hepsi tavanda: sebep, bekleme yok */
  s = K.kutuSec({ ...ayar, kutular: [ayar.kutular[0]] }, { "a@x.com": d({ bugun: 20 }) }, { "x.com": { bugun: 20, ilkGun: 20 } });
  assert.deepEqual(s.uygun, []);
  assert.equal(s.bekle, null);
  assert.match(s.sebep, /tavan doldu/);
  /* hepsi durmuş: sebep kutuları sayar */
  s = K.kutuSec({ ...ayar, kutular: [ayar.kutular[0]] }, { "a@x.com": d({ durdu: true, durduSebep: "spam engeli" }) }, {});
  assert.equal(s.sebep, "Gönderim durdu (1 kutu) — spam engeli");
  /* aynı sebeple duran iki kutu: sebep bir kez yazılır */
  s = K.kutuSec({ ...ayar, kutular: ayar.kutular.slice(0, 2) },
    { "a@x.com": d({ durdu: true, durduSebep: "421" }), "b@x.com": d({ durdu: true, durduSebep: "421" }) }, {});
  assert.equal(s.sebep, "Gönderim durdu (2 kutu) — 421");
  /* kutu ısınması: ilk gün kutu tavanı 10 */
  s = K.kutuSec({ ...ayar, kutular: [ayar.kutular[2]] }, { "c@y.com": d({ bugun: 10, ilkGun: 0 }) }, { "y.com": { bugun: 10, ilkGun: 0 } });
  assert.match(s.satirlar[0].engel, /kutunun bugünkü tavanı doldu \(10\/10\)/);
  /* geçmişi olmayan kutu ısınmanın ilk günündedir: kapasite 10 */
  assert.equal(K.kutuSec({ ...ayar, kutular: [ayar.kutular[0]] }, {}, {}).gunlukKapasite, 10);
  assert.equal(K.kutuSec({ ...ayar, kutular: [] }, {}, {}).sebep, "Gönderen kutusu tanımlı değil.");
});
t("sigorta kapsami", () => {
  const k = (h) => K.hataSiniflandir(h).kapsam;
  assert.equal(k({ code: "EAUTH", responseCode: 535, response: "535 Authentication failed" }), "kutu");
  assert.equal(k({ responseCode: 421, response: "421 4.7.0 Too many messages" }), "alan");
  assert.equal(k({ responseCode: 550, response: "550 5.7.1 Relaying denied", command: "RCPT TO" }), "kutu");
  assert.equal(k({ responseCode: 554, response: "554 5.7.1 Message rejected as spam", command: "DATA" }), "alan");
  assert.equal(k({ responseCode: 550, response: "550 Domain servosteel.com.tr has exceeded the max emails per hour (100) allowed" }), "alan");
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
t("sistem adresi", () => {
  for (const e of ["noreply@firma.com", "no-reply@firma.com", "postmaster@firma.com", "webmaster@firma.co.ke", "bounces@firma.com"])
    assert.ok(K.sistemAdresiMi(e), e);
  for (const e of ["info@firma.com", "ventas@firma.com.mx", "reply@firma.com"]) assert.ok(!K.sistemAdresiMi(e), e);
});
t("isinma tavani", () => {
  assert.deepEqual(K.isinmaTavani(null, 20).tavan, 10);
  assert.equal(K.isinmaTavani(0, 20).asama, "ısınma: 1. gün");
  assert.equal(K.isinmaTavani(0, 40).tavan, 10);
  assert.equal(K.isinmaTavani(1, 40).tavan, 20);
  assert.equal(K.isinmaTavani(3, 40).tavan, 30);
  assert.equal(K.isinmaTavani(4, 40).tavan, 40);
  assert.equal(K.isinmaTavani(4, 40).asama, null);
  assert.equal(K.isinmaTavani(13, 50).tavan, 50);
  assert.equal(K.isinmaTavani(14, 50).tavan, 50);
  assert.equal(K.isinmaTavani(14, 50).asama, null);
  assert.equal(K.isinmaTavani(3, 5).tavan, 5);   // ayarlanan tavan daha düşükse o geçerli
});
t("geri donus esigi", () => {
  assert.equal(K.geriDonusEngeli(0, 0), null);
  assert.equal(K.geriDonusEngeli(10, 2), null);          // en az 3 firma
  assert.ok(K.geriDonusEngeli(10, 3));                    // %30
  assert.ok(K.geriDonusEngeli(50, 3));                    // %6 tam sınır
  assert.equal(K.geriDonusEngeli(60, 3), null);           // %5 — eşiğin altı
  assert.ok(K.geriDonusEngeli(50, 5));                    // %10
});
t("istanbul saati", () => {
  /* 2026-09-22 06:30 UTC = 09:30 İstanbul, salı */
  assert.deepEqual(K.istanbulSaati(new Date("2026-09-22T06:30:00Z")), { saat: 9, dakika: 30, haftaGunu: 2 });
  /* 2026-09-26 21:05 UTC = 27 Eylül 00:05 İstanbul, pazar */
  assert.deepEqual(K.istanbulSaati(new Date("2026-09-26T21:05:00Z")), { saat: 0, dakika: 5, haftaGunu: 0 });
});
t("otomatik pencere", () => {
  const a = { baslangic: 9, bitis: 18, haftaSonu: false };
  assert.deepEqual(K.otomatikPencere({ saat: 10, dakika: 0, haftaGunu: 2 }, a), { acik: true, sebep: null, kalanDk: 480 });
  assert.equal(K.otomatikPencere({ saat: 8, dakika: 59, haftaGunu: 2 }, a).acik, false);
  assert.equal(K.otomatikPencere({ saat: 18, dakika: 0, haftaGunu: 2 }, a).acik, false);
  assert.equal(K.otomatikPencere({ saat: 12, dakika: 0, haftaGunu: 6 }, a).sebep, "hafta sonu");
  assert.equal(K.otomatikPencere({ saat: 12, dakika: 0, haftaGunu: 0 }, { ...a, haftaSonu: true }).acik, true);
});
t("otomatik tempo", () => {
  /* 20 e-posta, 9 saat: 27 dk ±%25 */
  assert.equal(K.sonrakiAralikSn(540, 20, 90, 0.5), 1620);
  assert.equal(K.sonrakiAralikSn(540, 20, 90, 0), 1215);
  assert.equal(K.sonrakiAralikSn(540, 20, 90, 1), 2025);
  /* pencerenin sonu yaklaşınca bile kutu aralığının altına inmez */
  assert.equal(K.sonrakiAralikSn(5, 20, 90, 0.5), 90);
  assert.equal(K.sonrakiAralikSn(60, 0, 90, 0.5), 3600);
});
t("alan adi tavani ust siniri", () => {
  /* Dort kutu x kutu tavani 50 = 200; env daha buyugunu yazsa da burada kesilir */
  const o = (v) => K.ayarlariOku({
    OUTREACH_HOST_1: "mail.x.com", OUTREACH_PORT_1: "465", OUTREACH_USER_1: "a@x.com",
    OUTREACH_PASS_1: "p", OUTREACH_FROM_NAME_1: "X", OUTREACH_DOMAIN_DAILY_LIMIT: v,
  });
  assert.equal(o("200").alanTavani, 200);
  assert.equal(o("999").alanTavani, 200);
  assert.equal(o("70").alanTavani, 70);
});
t("hedefin kendi saati", () => {
  /* 2026-09-23 03:00 UTC, carsamba: Hindistan 08:00, Meksika 21:00 (sali) */
  assert.deepEqual(S.yerelZaman("Hindistan", new Date("2026-09-23T03:00:00Z")), { saat: 8, haftaGunu: 3 });
  assert.deepEqual(S.yerelZaman("Meksika", new Date("2026-09-23T03:00:00Z")), { saat: 21, haftaGunu: 2 });
  assert.equal(S.yerelZaman("Atlantis", new Date("2026-09-23T03:00:00Z")), null);
});
t("hafta sonu ulkeye gore", () => {
  /* Korfez'de cuma-cumartesi tatil, pazar is gunu */
  assert.equal(S.isGunu("Suudi Arabistan", 5), false);
  assert.equal(S.isGunu("Suudi Arabistan", 6), false);
  assert.equal(S.isGunu("Suudi Arabistan", 0), true);
  /* BAE 2022'de cumartesi-pazara gecti */
  assert.equal(S.isGunu("BAE", 5), true);
  assert.equal(S.isGunu("BAE", 0), false);
  assert.equal(S.isGunu("Nepal", 0), true);
  assert.equal(S.isGunu("Nepal", 6), false);
  assert.equal(S.isGunu("Hindistan", 0), false);
  assert.equal(S.isGunu("Hindistan", 3), true);
});
t("gonderim sirasi hedefin sabahini one alir", () => {
  /* 03:00 UTC carsamba: Hindistan'da 08:00 -> sabah; Meksika ve ABD gece */
  const a = S.gonderimSirasi(new Date("2026-09-23T03:00:00Z"));
  assert.ok(a.sabah.includes("Hindistan"));
  assert.ok(!a.sabah.includes("Meksika") && !a.mesai.includes("Meksika"));
  assert.ok(!a.sabah.includes("ABD") && !a.mesai.includes("ABD"));
  /* 14:00 UTC: Meksika 08:00, ABD 09:00 -> sabah; Hindistan 19:00 -> disarida */
  const b = S.gonderimSirasi(new Date("2026-09-23T14:00:00Z"));
  assert.ok(b.sabah.includes("Meksika"));
  assert.ok(b.sabah.includes("ABD"));
  assert.ok(!b.sabah.includes("Hindistan") && !b.mesai.includes("Hindistan"));
  /* Cuma 09:00 UTC: Suudi'de 12:00 ama cuma tatil -> listede yok; Hindistan 14:00 mesai */
  const c = S.gonderimSirasi(new Date("2026-09-25T09:00:00Z"));
  assert.ok(!c.sabah.includes("Suudi Arabistan") && !c.mesai.includes("Suudi Arabistan"));
  assert.ok(c.mesai.includes("Hindistan"));
});
t("her hedef ulkenin saat dilimi var", () => {
  /* Veritabanindaki 111 ulkenin hepsi tabloda; eksik olan siralamada en sona duser */
  assert.equal(Object.keys(S.ULKE_DILIMI).length, 111);
  for (const [ulke, dilim] of Object.entries(S.ULKE_DILIMI)) {
    assert.doesNotThrow(() => new Intl.DateTimeFormat("en-US", { timeZone: dilim }), `${ulke}: ${dilim}`);
  }
});
t("gonderen dogrulamasi alici hatasi sayilmaz", () => {
  /* 25 Eylul 2026'da gercekten gelen cevap. Exim RCPT TO'da 550 veriyor ama
     sikayet ALICInin adresi degil, BIZIM gonderen adresimiz. "alici" sayilsaydi
     saglam firma temelli yanardi ve geri donus sigortasi yanlis dolardi. */
  const g = K.hataSiniflandir({
    responseCode: 550,
    command: "RCPT TO",
    response: "550 Can't send mail - all recipients were rejected: 550 Sender verify failed",
    message: "Can't send mail - all recipients were rejected: 550 Sender verify failed",
  });
  assert.equal(g.tur, "hata");
  assert.match(g.sebep, /gönderen adresimizi doğrulayamadı/);
  /* Gercek alici hatasi hala "alici" */
  const a = K.hataSiniflandir({
    responseCode: 550,
    command: "RCPT TO",
    response: "550 5.1.1 <yok@ornek.com>: Recipient address rejected: User unknown",
    message: "550 5.1.1 Recipient address rejected: User unknown",
  });
  assert.equal(a.tur, "alici");
  /* Gecici red ve giris hatasi degismedi */
  assert.equal(K.hataSiniflandir({ responseCode: 421, response: "421 too many connections", message: "" }).tur, "sigorta");
  assert.equal(K.hataSiniflandir({ code: "EAUTH", response: "535 auth failed", message: "" }).tur, "sigorta");
});
console.log(`${n} test gecti`);

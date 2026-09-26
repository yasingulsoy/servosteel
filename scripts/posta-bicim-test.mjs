import assert from "node:assert/strict";
/**
 * Paneldeki e-posta istemcisinin saf yardımcılarının testi.
 *
 *   node scripts/posta-bicim-test.mjs
 *
 * Yanıt konusu, alıntı, konuşma zinciri ve adres ayıklama — yanlışı doğrudan
 * müşteriye giden bir mailde görünen şeyler.
 */
const P = await import(new URL("../src/lib/posta-bicim.ts", import.meta.url).href);

let n = 0;
const t = (ad, fn) => { fn(); n++; console.log("  ok -", ad); };

t("yanit konusu iki kez RE almaz", () => {
  assert.equal(P.yanitKonusu("Guardrail lines"), "RE: Guardrail lines");
  assert.equal(P.yanitKonusu("RE: Guardrail lines"), "RE: Guardrail lines");
  assert.equal(P.yanitKonusu("Re: x"), "Re: x");
  assert.equal(P.yanitKonusu("AW: Angebot"), "AW: Angebot");        // Almanca
  assert.equal(P.yanitKonusu("YNT: teklif"), "YNT: teklif");          // Türkçe Outlook
  assert.equal(P.yanitKonusu("RE[2]: x"), "RE[2]: x");
  assert.equal(P.yanitKonusu("  çok   boşluk  "), "RE: çok boşluk");
  assert.equal(P.yanitKonusu(""), "RE:");
  /* "Return" kelimesi önek değildir */
  assert.equal(P.yanitKonusu("Return policy"), "RE: Return policy");
});

t("ilet konusu", () => {
  assert.equal(P.iletKonusu("Teklif"), "FW: Teklif");
  assert.equal(P.iletKonusu("Fwd: Teklif"), "Fwd: Teklif");
  assert.equal(P.iletKonusu("WG: Angebot"), "WG: Angebot");
});

t("alinti her satira > koyar, bos satiri korur", () => {
  const a = P.alintila("Merhaba\n\nTeklif alalım", "Ali <ali@x.com>", "25 Sep 2026 10:55");
  assert.equal(a, "\n\nOn 25 Sep 2026 10:55, Ali <ali@x.com> wrote:\n> Merhaba\n>\n> Teklif alalım");
  /* İç içe alıntı bir kat daha derinleşir */
  assert.match(P.alintila("> eski", "x", "d"), /\n>> eski$/);
  /* CRLF */
  assert.match(P.alintila("a\r\nb", "x", "d"), /\n> a\n> b$/);
});

t("alinti uzunsa kirpilir ve bunu soyler", () => {
  const a = P.alintila("x".repeat(P.ALINTI_SINIRI + 500), "k", "d");
  assert.ok(a.endsWith("> […]"));
  assert.ok(a.length < P.ALINTI_SINIRI + 100);
});

t("alinti tarihi Istanbul saatiyle, iletme blogu", () => {
  assert.equal(P.alintiTarihi(null), "");
  /* 13:40 UTC → İstanbul 16:40; ICU sürümüne göre "Sep" ya da "Sept" */
  assert.match(P.alintiTarihi("2026-09-25T13:40:00Z"), /^25 Sept? 2026, 16:40$/);
  const b = P.iletBlogu({ kimden: "A <a@x.com>", tarih: "2026-09-25T13:40:00Z", konu: "Teklif", kime: "b@x.com", metin: "Gövde" });
  assert.ok(b.startsWith("\n\n---------- Forwarded message ----------\nFrom: A <a@x.com>\nDate: 25 Sep"));
  assert.ok(b.endsWith("\nSubject: Teklif\nTo: b@x.com\n\nGövde"));
  assert.match(P.IMZA, /^Best regards,\nServosteel\n/);
});

t("referans zinciri", () => {
  assert.equal(P.referansZinciri("", "<a@x>"), "<a@x>");
  assert.equal(P.referansZinciri("<a@x> <b@x>", "<c@x>"), "<a@x> <b@x> <c@x>");
  /* Aynı kimlik iki kez girmez */
  assert.equal(P.referansZinciri("<a@x>", "<a@x>"), "<a@x>");
  /* Köşeli parantezsiz kimlik sarılır */
  assert.equal(P.referansZinciri(undefined, "c@x"), "<c@x>");
  /* En çok 12 kimlik, en yenileri */
  const uzun = Array.from({ length: 15 }, (_, i) => `<m${i}@x>`).join(" ");
  const z = P.referansZinciri(uzun, "<son@x>").split(" ");
  assert.equal(z.length, 12);
  assert.equal(z.at(-1), "<son@x>");
  assert.equal(P.referansZinciri("", ""), "");
});

t("adres ayiklama", () => {
  const r = P.adresleriAyikla("Ali Veli <Ali@Firma.com>, ayse@x.com.tr; yanlis, ayse@x.com.tr\nbir@iki.co");
  assert.deepEqual(r.gecerli, ["ali@firma.com", "ayse@x.com.tr", "bir@iki.co"]);
  assert.deepEqual(r.gecersiz, ["yanlis"]);
  assert.deepEqual(P.adresleriAyikla("").gecerli, []);
  /* Başlık enjeksiyonu denemesi geçersiz */
  assert.deepEqual(P.adresleriAyikla("a@b.com\r\nBcc: c@d.com").gecerli, ["a@b.com"]);
  assert.equal(P.adresGecerli("a b@c.com"), false);
  assert.equal(P.adresGecerli("a@c"), false);
});

t("adres gosterimi ve kisa ad", () => {
  assert.equal(P.adresGoster([{ name: "Ali", address: "a@x.com" }, { address: "b@x.com" }]), "Ali <a@x.com>, b@x.com");
  assert.equal(P.kisaAd([{ name: "", address: "a@x.com" }]), "a@x.com");
  assert.equal(P.kisaAd(undefined), "—");
  assert.equal(P.kutuKisaAdi("ege@servosteel.com.tr"), "ege");
});

console.log(`${n} test gecti`);

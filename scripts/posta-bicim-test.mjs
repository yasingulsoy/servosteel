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

/* imapflow'un BODYSTRUCTURE çıktısı biçiminde: iRack'teki gibi alternatif gövde +
   gömülü logo + Türkçe adlı PDF + görsel eki + ekli e-posta + teslim raporu */
const YAPI = {
  type: "multipart/mixed",
  childNodes: [
    {
      part: "1",
      type: "multipart/alternative",
      childNodes: [
        { part: "1.1", type: "text/plain", parameters: { charset: "utf-8" }, encoding: "quoted-printable", size: 900 },
        {
          part: "1.2",
          type: "multipart/related",
          childNodes: [
            { part: "1.2.1", type: "text/html", encoding: "quoted-printable", size: 2000 },
            { part: "1.2.2", type: "image/png", id: "<logo-irack>", encoding: "base64", size: 4000 },
          ],
        },
      ],
    },
    {
      part: "2",
      type: "application/pdf",
      encoding: "base64",
      size: 1_000_000,
      disposition: "attachment",
      dispositionParameters: { filename: "Kesit çizimi – raf dikmesi.pdf" },
    },
    { part: "3", type: "image/jpeg", parameters: { name: "../../etc/profil.jpg" }, encoding: "base64", size: 3000 },
    {
      part: "4",
      type: "message/rfc822",
      envelope: { subject: "Eski teklif" },
      size: 5000,
      childNodes: [{ part: "4.1", type: "text/plain", size: 100 }],
    },
    { part: "5", type: "message/delivery-status", size: 300 },
    { part: "6", type: "text/plain", disposition: "attachment", size: 50 },
  ],
};

t("ekler yapidan: govde ve rapor haric, gomulu gorsel ayri", () => {
  const e = P.ekleriBul(YAPI);
  assert.deepEqual(
    e.map((x) => [x.parca, x.ad, x.satirIci]),
    [
      ["1.2.2", "gorsel-1.2.2.png", true],
      ["2", "Kesit çizimi – raf dikmesi.pdf", false],
      ["3", "_.._etc_profil.jpg", false], // yol ayırıcı ve baştaki noktalar temizlendi
      ["4", "Eski teklif.eml", false], // ekli e-postanın içine inilmez
      ["6", "ek-6.txt", false], // adsız ama "attachment" metin eki
    ]
  );
  /* base64 şişmesi düşülür: 1.000.000 kodlanmış bayt ≈ 740 KB gerçek */
  assert.equal(e[1].boyut, 740_000);
  /* tek parçalı ileti: parça numarası yoksa "1" */
  assert.deepEqual(P.ekleriBul({ type: "application/pdf", size: 10, disposition: "attachment" }).map((x) => x.parca), ["1"]);
  assert.deepEqual(P.ekleriBul({ type: "text/plain", size: 10 }), []);
});

t("boyut, cid temizligi, indirme basligi", () => {
  assert.equal(P.boyutYaz(512), "512 B");
  assert.equal(P.boyutYaz(700_016), "684 KB");
  assert.equal(P.boyutYaz(2.5 * 1024 * 1024), "2,5 MB");
  assert.equal(P.gorselIzleriniTemizle("Best regards,\n\n[cid:095aff34-da6d-49c1-8c61-3499c071355d]\n\n\nOsama"), "Best regards,\n\nOsama");
  assert.equal(P.gorselIzleriniTemizle("logo [cid:image001.png@01DA2B3C.4D5E6F70] burada"), "logo  burada");
  /* HTML'e gömülü görsel (Giffin, 27 Eylül): tek satırda ve satıra bölünmüş */
  assert.equal(
    P.gorselIzleriniTemizle("Stay connected\n\n[data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABw+/=]\nLinkedIn\nlinkedin.com/company/x"),
    "Stay connected\n\nLinkedIn\nlinkedin.com/company/x"
  );
  assert.equal(P.gorselIzleriniTemizle("a [data:image/jpeg;base64,AAAA\nBBBB==] b"), "a  b");
  /* Köşeli parantezli olağan metin kalır */
  assert.equal(P.gorselIzleriniTemizle("[data] sheet [see attached]"), "[data] sheet [see attached]");
  assert.equal(
    P.icerikYerlesimi("Kesit çizimi – raf dikmesi.pdf", false),
    "attachment; filename=\"Kesit cizimi _ raf dikmesi.pdf\"; filename*=UTF-8''Kesit%20%C3%A7izimi%20%E2%80%93%20raf%20dikmesi.pdf"
  );
  assert.match(P.icerikYerlesimi("a\"b'(c).png", true), /^inline; filename="a_b'\(c\)\.png"; filename\*=UTF-8''a%22b%27%28c%29\.png$/);
  assert.equal(P.ONIZLENEBILIR.has("image/svg+xml"), false); // betik çalıştırabilir
  assert.equal(P.ONIZLENEBILIR.has("text/html"), false);
});

console.log(`${n} test gecti`);

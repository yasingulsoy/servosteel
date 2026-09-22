import assert from "node:assert/strict";
import fs from "node:fs";
/**
 * Tanıtım e-postasının biçim ve şablon testi — saf fonksiyonlar, ağ ve veritabanı yok.
 *
 *   node scripts/eposta-sablon-test.mjs
 *
 * Yazılı bağlantı ([yazı](adres)), teklif düğmesi, ürün fotoğrafı şeridi,
 * altbilgi, cid ↔ adres dönüşümü; ayrıca her segmentin fotoğrafı ve dokuz
 * dilde alt yazısı var mı, şablonlarda düğme ve ürün bağlantısı yerinde mi.
 */
const B = await import(new URL("../src/lib/eposta-bicim.ts", import.meta.url).href);
const S = await import(new URL("../src/lib/eposta-sablon.ts", import.meta.url).href);
const K = await import(new URL("../src/lib/outreach-kurallar.ts", import.meta.url).href);

let n = 0;
const t = (ad, fn) => { fn(); n++; console.log("  ok -", ad); };

const FORM = "https://servosteel.com.tr/en/request-quote?utm_source=outreach&utm_medium=email&utm_campaign=kablo-kanali&utm_content=ornek.com&utm_term=teklif-formu";
const URUN = "https://servosteel.com.tr/en/roll-forming-lines/cable-tray?utm_source=outreach&utm_medium=email&utm_campaign=kablo-kanali&utm_content=ornek.com";
const govde = `Dear team,\n\nWe build cable tray lines.\n\n[See the details on our website](${URUN})\n\nYou can request a quote in two minutes:\n\n[Request a quote](${FORM})\n\nBest regards,\nMarketing Team`;
const kaynak = (a) => (a === "logo" ? "L.png" : `/eposta/${a}.jpg`);

t("yazili baglanti HTML'de yazi, adres gorunmez", () => {
  const h = B.metindenHtml(govde);
  assert.ok(h.includes(`<p><a href="${URUN.replaceAll("&", "&amp;")}">See the details on our website</a></p>`));
  assert.ok(h.includes(">Request a quote</a></p>"));
  assert.ok(!h.includes(">https://"), "adres yazi olarak gorunmemeli");
});

t("ciplak adres eskisi gibi baglanti, satir sonu <br>", () => {
  const h = B.metindenHtml("Site: https://servosteel.com.tr/en.\nIkinci satir");
  assert.equal(h, '<p>Site: <a href="https://servosteel.com.tr/en">https://servosteel.com.tr/en</a>.<br>Ikinci satir</p>');
});

t("yazi kacirilir", () => {
  const h = B.metindenHtml("[A <b> & C](https://servosteel.com.tr/x?a=1&b=2)");
  assert.equal(h, '<p><a href="https://servosteel.com.tr/x?a=1&amp;b=2">A &lt;b&gt; &amp; C</a></p>');
});

t("duz metin parcasi: yazi (adres)", () => {
  const d = B.metindenDuz(govde);
  assert.ok(d.includes(`Request a quote (${FORM})`));
  assert.ok(d.includes(`See the details on our website (${URUN})`));
  assert.ok(!d.includes("]("));
});

t("baglanti turu", () => {
  assert.deepEqual(S.baglantiTuru(FORM.replaceAll("&", "&amp;")), { tur: "dugme" });
  assert.deepEqual(S.baglantiTuru("https://servosteel.com.tr/teklif-al"), { tur: "dugme" });
  assert.deepEqual(S.baglantiTuru(URUN), { tur: "urun", kampanya: "kablo-kanali" });
  assert.equal(S.baglantiTuru("https://servosteel.com.tr/en?utm_campaign=bilinmiyor"), null);
  assert.equal(S.baglantiTuru("https://baska-site.com/x?utm_campaign=kablo-kanali"), null);
  assert.equal(S.baglantiTuru("gecersiz adres"), null);
});

t("teklif baglantisi turuncu dugme, urun baglantisi 3 fotograf + baglanti", () => {
  const h = S.epostaSayfasi(B.metindenHtml(govde), { dil: "en", altbilgiHtml: "ALT", kaynak });
  assert.ok(/bgcolor="#e7a300"[^]*?>Request a quote<\/a><\/td>/.test(h), "dugme");
  const img = [...h.matchAll(/<img src="([^"]+)"[^>]*alt="([^"]*)"/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(img, [
    ["/eposta/kablo-kanali.jpg", "Cable tray line"],
    ["/eposta/rulo-acicilar.jpg", "Decoiler"],
    ["/eposta/dogrultmali-servo-suruculer.jpg", "Straightener servo feeder"],
    ["L.png", "Servosteel"],
  ]);
  assert.ok(h.includes(">See the details on our website&nbsp;&rarr;</a></p>"));
  assert.ok(h.includes(">ALT</p>"));
  assert.ok(!/<p>/.test(h), "her paragraf stilli");
});

t("alt yazi e-posta dilinde, bilinmeyen dilde Ingilizce", () => {
  const tr = S.epostaSayfasi(B.metindenHtml(`[x](${URUN})`), { dil: "tr", altbilgiHtml: "", kaynak });
  assert.ok(tr.includes('alt="Kablo kanalı hattı"') && tr.includes('alt="Rulo açıcı"'));
  const hu = S.epostaSayfasi(B.metindenHtml(`[x](${URUN})`), { dil: "hu", altbilgiHtml: "", kaynak });
  assert.ok(hu.includes('alt="Cable tray line"'));
});

t("editorun target/rel eklenmis baglantisi da suslenir", () => {
  const h = S.epostaSayfasi(`<p><a target="_blank" rel="noopener noreferrer nofollow" href="${FORM}">Request a quote</a></p>`, {
    dil: "en", altbilgiHtml: "", kaynak,
  });
  assert.ok(h.includes('bgcolor="#e7a300"'));
});

t("cumle icindeki baglanti ve bilinmeyen kampanya olduğu gibi kalir", () => {
  const ic = `<p>Quote <a href="${FORM}">here</a> please.</p>`;
  assert.ok(S.epostaSayfasi(ic, { dil: "en", altbilgiHtml: "", kaynak }).includes(`Quote <a href="${FORM}">here</a> please.`));
  const bil = '<p><a href="https://servosteel.com.tr/en?utm_campaign=yok">x</a></p>';
  assert.ok(S.epostaSayfasi(bil, { dil: "en", altbilgiHtml: "", kaynak }).includes('<p style="margin:0 0 14px"><a href="https://servosteel.com.tr/en?utm_campaign=yok">x</a></p>'));
});

t("dosyasi olmayan fotograf atlanir, hic yoksa yalniz baglanti", () => {
  const eksik = (a) => (a === "rulo-acicilar" ? null : kaynak(a));
  const h = S.epostaSayfasi(B.metindenHtml(`[x](${URUN})`), { dil: "en", altbilgiHtml: "", kaynak: eksik });
  assert.equal((h.match(/<td valign="top" width="50%"/g) ?? []).length, 2);
  const hic = S.epostaSayfasi(B.metindenHtml(`[x](${URUN})`), { dil: "en", altbilgiHtml: "", kaynak: () => null });
  assert.ok(!h.includes("rulo-acicilar") && !hic.includes("<img") && hic.includes(">x&nbsp;&rarr;</a>"));
});

t("cid listesi ve adrese cevirme", () => {
  const h = S.epostaSayfasi(B.metindenHtml(govde), {
    dil: "en", altbilgiHtml: "", kaynak: (a) => `cid:${S.gorselCid(a)}`,
  });
  assert.deepEqual(S.cidGorselleri(h), ["kablo-kanali", "rulo-acicilar", "dogrultmali-servo-suruculer"]);
  assert.ok(h.includes(`src="cid:${S.LOGO_CID}"`));
  const g = S.cidleriAdreseCevir(h);
  assert.ok(!g.includes("cid:") && g.includes('src="/eposta/logo.png"') && g.includes('src="/eposta/kablo-kanali.jpg"'));
});

t("altbilgi HTML: abonelik baglantisi tiklanir yazi, satirlar kacirilir", () => {
  const en = K.altbilgiHtml("en", "https://x/api/unsubscribe?t=a&b", "UNVAN & CO", "ADRES");
  assert.equal(en, 'Prefer not to hear from us again? <a href="https://x/api/unsubscribe?t=a&amp;b" style="color:#777">Unsubscribe</a><br>UNVAN &amp; CO<br>ADRES');
  assert.ok(K.altbilgiHtml("tr", "U", "A", "B").startsWith('Bizden başka e-posta almak istemiyorsanız <a href="U" style="color:#777">abonelikten çıkın</a>.'));
  assert.ok(K.altbilgiHtml("hu", "U", "A", "B").includes(">Unsubscribe</a>"));
});

const DILLER = ["tr", "en", "es", "it", "de", "pl", "ru", "fr", "pt"];
const sablon = JSON.parse(fs.readFileSync(new URL("../seo/eposta-taslaklari.json", import.meta.url), "utf8"));

t("her segmentin fotograflari var, dosyalari var, 9 dilde alt yazisi var", () => {
  for (const kamp of Object.keys(sablon.en.segment)) {
    const liste = S.KAMPANYA_GORSELLERI[kamp];
    assert.ok(liste?.length >= 2, `${kamp}: fotograf listesi yok`);
    for (const slug of liste) {
      assert.ok(fs.existsSync(new URL(`../public/eposta/${slug}.jpg`, import.meta.url)), `${slug}.jpg yok`);
      for (const d of DILLER) assert.ok(S.URUN_GORSELI[slug]?.[d], `${slug}: ${d} alt yazisi yok`);
    }
  }
  assert.ok(fs.existsSync(new URL("../public/eposta/logo.png", import.meta.url)));
});

t("sablonlarda tek basina duran dugme ve urun baglantisi yerinde", () => {
  for (const d of DILLER) {
    const g = sablon[d].govde;
    assert.match(g, /\n\n\[[^\]\n]+\]\(\{form\}\)\n\n/, `${d}: dugme satiri`);
    assert.match(g, /\{cumle\}\{ek\}\n\n\[[^\]\n]+\]\(\{link\}\)\n\n/, `${d}: urun baglantisi`);
    assert.ok(!/: \{(form|link)\}/.test(g), `${d}: ciplak adres kalmis`);
  }
});

console.log(`${n} test gecti`);

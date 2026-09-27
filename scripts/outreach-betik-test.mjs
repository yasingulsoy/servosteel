import assert from "node:assert/strict";
/**
 * Tanıtım e-postası ölçüm betiğinin testi (src/lib/outreach-betik.ts).
 *
 *   node scripts/outreach-betik-test.mjs
 *
 * Betik sahte bir sayfada çalıştırılır: açılışta tek işaret (etkilesim
 * false), ilk GERÇEK harekette aynı kimlikle ikinci işaret (true), sonra hiç.
 * Yanlışı panelde görünür: güvenlik taraması insan sayılır ya da insan
 * tıklaması taramaya düşer ve "sıcak firmalar"dan kaybolur.
 */
const { OUTREACH_BETIGI } = await import(new URL("../src/lib/outreach-betik.ts", import.meta.url).href);

/** Sahte sayfa: adres, dinleyiciler, gönderilen işaretler */
function sayfa(adres) {
  const u = new URL(adres);
  const dinleyici = new Map();
  const giden = [];
  const ortam = {
    location: { search: u.search, pathname: u.pathname },
    navigator: { sendBeacon: (yol, blob) => (giden.push({ yol, blob }), true) },
    document: { documentElement: { lang: "en" } },
    addEventListener: (tur, fn, secenek) => {
      assert.equal(secenek.capture, true, "yakalama aşamasında dinlenmeli");
      dinleyici.set(tur, fn);
    },
    removeEventListener: (tur, fn, yakala) => {
      assert.equal(yakala, true);
      if (dinleyici.get(tur) === fn) dinleyici.delete(tur);
    },
  };
  new Function(...Object.keys(ortam), OUTREACH_BETIGI)(...Object.values(ortam));
  return {
    dinleyici,
    olay: (tur, ek = {}) => dinleyici.get(tur)?.({ type: tur, isTrusted: true, ...ek }),
    isaretler: () => Promise.all(giden.map(async (g) => ({ uc: g.yol, ...JSON.parse(await g.blob.text()) }))),
  };
}

const ADRES = "https://servosteel.com.tr/en/request-quote?utm_source=outreach&utm_medium=email&utm_content=irackeg.com";

let n = 0;
const t = async (ad, fn) => { await fn(); n++; console.log("  ok -", ad); };

await t("tanitim e-postasindan gelmeyen ziyarette hicbir sey yapmaz", async () => {
  const s = sayfa("https://servosteel.com.tr/en/request-quote?utm_source=google");
  assert.equal((await s.isaretler()).length, 0);
  assert.equal(s.dinleyici.size, 0);
});

await t("acilista tek isaret: etkilesim false, firma ve sayfa dogru", async () => {
  const s = sayfa(ADRES);
  const [i, ...fazla] = await s.isaretler();
  assert.equal(fazla.length, 0);
  assert.equal(i.uc, "/api/olay");
  assert.equal(i.tur, "outreach");
  assert.equal(i.etkilesim, false);
  assert.equal(i.kaynak, "irackeg.com");
  assert.equal(i.yol, "/en/request-quote");
  assert.equal(i.dil, "en");
  assert.match(i.gorunum, /^[a-z0-9-]{8,64}$/i, "sunucunun kabul ettiği biçim");
  assert.deepEqual([...s.dinleyici.keys()].sort(), ["keydown", "mousemove", "pointerdown", "touchstart", "wheel"]);
});

await t("sifir hareketli fare olayi ve betikle uretilen olay sayilmaz", async () => {
  const s = sayfa(ADRES);
  /* Sayfa imlecin altında kayınca tarayıcının kendiliğinden ürettiği olay */
  s.olay("mousemove", { movementX: 0, movementY: 0 });
  s.olay("pointerdown", { isTrusted: false });
  s.olay("keydown", { isTrusted: false });
  assert.equal((await s.isaretler()).length, 1);
});

await t("ilk gercek harekette ayni kimlikle ikinci isaret, sonra hic", async () => {
  const s = sayfa(ADRES);
  s.olay("mousemove", { movementX: 3, movementY: -1 });
  s.olay("mousemove", { movementX: 5, movementY: 2 });
  s.olay("keydown");
  const [ilk, ikinci, ...fazla] = await s.isaretler();
  assert.equal(fazla.length, 0, "tek bir etkileşim işareti");
  assert.equal(ikinci.etkilesim, true);
  assert.equal(ikinci.gorunum, ilk.gorunum, "sunucu ikisini tek satırda birleştiriyor");
  assert.equal(ikinci.kaynak, "irackeg.com");
  assert.equal(s.dinleyici.size, 0, "dinleyiciler kaldırıldı");
});

await t("dokunma, tekerlek ve tus da insan sayilir", async () => {
  for (const tur of ["touchstart", "wheel", "keydown", "pointerdown"]) {
    const s = sayfa(ADRES);
    s.olay(tur);
    const l = await s.isaretler();
    assert.equal(l.length, 2, tur);
    assert.equal(l[1].etkilesim, true, tur);
  }
});

await t("yer degisimi bilinmeyen eski tarayicida fare hareketi sayilir", async () => {
  const s = sayfa(ADRES);
  s.olay("mousemove", {});
  assert.equal((await s.isaretler()).length, 2);
});

await t("her acilista yeni kimlik", async () => {
  const [a] = await sayfa(ADRES).isaretler();
  const [b] = await sayfa(ADRES).isaretler();
  assert.notEqual(a.gorunum, b.gorunum);
});

console.log(`\n${n} test gecti`);

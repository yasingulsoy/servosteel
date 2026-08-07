const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  ExternalHyperlink, LevelFormat, PageBreak, convertInchesToTwip,
} = require("docx");
const fs = require("fs");

const ALTIN = "B8860B";
const KOYU = "1A1A1A";
const GRI = "5A5A5A";
const KIRMIZI = "B03030";

/* --- kisayollar --- */
const P = (text, o = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 120, line: 280 },
    alignment: o.align,
    ...o.p,
    children: [new TextRun({ text, size: o.size ?? 21, color: o.color ?? KOYU, bold: o.bold, italics: o.italics })],
  });

/* Zengin paragraf: [{t, b, c, i}] parcalari */
const PR = (parts, o = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 120, line: 280 },
    ...o.p,
    children: parts.map((x) =>
      x.link
        ? new ExternalHyperlink({
            link: x.link,
            children: [new TextRun({ text: x.t, size: o.size ?? 21, color: "1155CC", underline: {} })],
          })
        : new TextRun({ text: x.t, size: o.size ?? 21, bold: x.b, italics: x.i, color: x.c ?? KOYU })
    ),
  });

const H1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 380, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ALTIN, space: 6 } },
    children: [new TextRun({ text, size: 30, bold: true, color: KOYU })],
  });

const H2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, size: 24, bold: true, color: KOYU })],
  });

const SORU = (kod, text) =>
  new Paragraph({
    spacing: { after: 100, line: 280 },
    indent: { left: 200 },
    children: [
      new TextRun({ text: kod + "  ", size: 21, bold: true, color: ALTIN }),
      new TextRun({ text, size: 21, color: KOYU }),
    ],
  });

/* Soru + icinde link */
const SORUL = (kod, parts) =>
  new Paragraph({
    spacing: { after: 100, line: 280 },
    indent: { left: 200 },
    children: [
      new TextRun({ text: kod + "  ", size: 21, bold: true, color: ALTIN }),
      ...parts.map((x) =>
        x.link
          ? new ExternalHyperlink({
              link: x.link,
              children: [new TextRun({ text: x.t, size: 21, color: "1155CC", underline: {} })],
            })
          : new TextRun({ text: x.t, size: 21, bold: x.b, color: x.c ?? KOYU })
      ),
    ],
  });

const NOT = (text) =>
  new Paragraph({
    spacing: { before: 120, after: 200, line: 280 },
    indent: { left: 220 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: ALTIN, space: 10 } },
    children: [new TextRun({ text, size: 19, italics: true, color: GRI })],
  });

const MADDE = (text) =>
  new Paragraph({ numbering: { reference: "nokta", level: 0 }, spacing: { after: 70, line: 280 },
    children: [new TextRun({ text, size: 21, color: KOYU })] });

const hucre = (icerik, genislik, o = {}) =>
  new TableCell({
    width: { size: genislik, type: WidthType.DXA },
    shading: o.bg ? { type: ShadingType.CLEAR, fill: o.bg, color: "auto" } : undefined,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: Array.isArray(icerik) ? icerik : [icerik],
  });

const th = (t, w) => hucre(P(t, { bold: true, size: 19, after: 0, color: "FFFFFF" }), w, { bg: "3A3A3A" });
const td = (t, w, o = {}) => hucre(P(t, { size: 19, after: 0, bold: o.bold, color: o.color }), w);
const tdL = (parts, w) => hucre(PR(parts, { size: 19, after: 0 }), w);

const TABLO = (kolonlar, satirlar) =>
  new Table({
    columnWidths: kolonlar,
    width: { size: kolonlar.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    rows: satirlar,
  });

/* ------------------------------------------------------------------ */
const S = "https://servosteel.com.tr";
const govde = [];

/* ---------- KAPAK ---------- */
govde.push(
  new Paragraph({ spacing: { before: 1600, after: 100 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "SERVOSTEEL", size: 56, bold: true, color: KOYU, characterSpacing: 60 })] }),
  new Paragraph({ spacing: { after: 700 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "web sitesi · doğrulama ve bilgi talebi", size: 22, color: ALTIN })] }),
  P("Filiz Hanım'a", { align: AlignmentType.CENTER, size: 34, bold: true, after: 120 }),
  P("Kontrol edilecek sayfalar ve cevap bekleyen sorular", { align: AlignmentType.CENTER, size: 22, color: GRI, after: 900 }),
  P("Hazırlayan: Yasin Gülsoy", { align: AlignmentType.CENTER, size: 20, color: GRI, after: 60 }),
  P("7 Ağustos 2026", { align: AlignmentType.CENTER, size: 20, color: GRI, after: 0 }),
  new Paragraph({ children: [new PageBreak()] })
);

/* ---------- NASIL KULLANILIR ---------- */
govde.push(
  H1("Bu belge nasıl kullanılır"),
  P("Belge iki bölümden oluşuyor ve iki ayrı kişiye gidiyor."),
  PR([
    { t: "A bölümü — mühendislik. ", b: true },
    { t: "Sitede yayında olan teknik sayılar ve doğrulanması gereken değerler. Her satırda sayfanın canlı linki var; tıklayıp bakabilirler. " },
    { t: "Ricam: mühendis yalnızca Türkçe sayfadaki sayıyı işaretlesin", b: true },
    { t: " — “doğru” ya da “doğrusu şu”. Dokuz dile yaymayı ben yapacağım, dosya düzeltmelerine girmelerine gerek yok." },
  ]),
  PR([
    { t: "B–H bölümleri — ticari ve idari. ", b: true },
    { t: "Sizin ya da yönetimin cevaplayacağı sorular." },
  ]),
  NOT(
    "Neden şimdi: Google, 6–7 Ağustos'ta üç makine sayfamızın teknik özellik tablosunu taradı. " +
    "Yani yayındaki sayılar artık yalnızca sitede değil, arama sonuçlarında da görünebiliyor. " +
    "Yanlış bir değerin düzeltilmesi bu yüzden aciliyet kazandı."
  ),
  new Paragraph({ children: [new PageBreak()] })
);

/* ---------- A. MUHENDISLIK ---------- */
govde.push(
  H1("A. Mühendislik doğrulaması"),
  H2("A.1  Teknik tablosu yayında olan sayfalar — sayıları teyit edilecek"),
  P("Aşağıdaki altı sayfada tablo zaten yayında. Değerlerin doğru olduğunu teyit etmeniz yeterli; hatalı olan varsa doğrusunu yazın.", { color: GRI, size: 20 })
);

const W1 = [2500, 4900, 2100];
govde.push(
  TABLO(W1, [
    new TableRow({ tableHeader: true, children: [th("Sayfa", W1[0]), th("Doğrulanacak değerler", W1[1]), th("Bilinen sorun", W1[2])] }),
    new TableRow({ children: [
      tdL([{ t: "Rulo Açıcılar", link: `${S}/makineler/rulo-acicilar` }], W1[0]),
      td("Mekanik 500 / 750 / 1.500 / 2.500 kg · Hidrolik 6–20 ton · genişlik 30–500 ve 80–1.000 mm · iç çap 300 ve 450–560 mm · dış çap 1.600 mm", W1[1]),
      td("ÇELİŞKİ: sayfa başlığı “500–4.000 kg” diyor, tablo 2.500 kg'da bitiyor. Üst kapasite hangisi?", W1[2], { color: KIRMIZI, bold: true }),
    ]}),
    new TableRow({ children: [
      tdL([{ t: "Servo Sürücüler", link: `${S}/makineler/servo-suruculer` }], W1[0]),
      td("Kalınlık 0,4–4,0 mm · sac ≤1.600 mm · serbest hız 35 m/dk · 2 × Ø85 mm besleme silindiri · 7\" dokunmatik · 250 reçete hafızası", W1[1]),
      td("±0,1 mm besleme hassasiyeti bu üründe de geçerli mi? Şu an yalnızca kompakt hatta yazılı.", W1[2], { color: KIRMIZI }),
    ]}),
    new TableRow({ children: [
      tdL([{ t: "Doğrultmalı Servo Sürücüler", link: `${S}/makineler/dogrultmali-servo-suruculer` }], W1[0]),
      td("Sac ≤1.600 mm · kalınlık 0,5–4,0 mm · doğrultma silindiri 7 / 9 / 11 / 13 · 250 reçete · Schneider renkli LCD", W1[1]),
      td("—", W1[2]),
    ]}),
    new TableRow({ children: [
      tdL([{ t: "Kompakt Hatlar", link: `${S}/makineler/kompakt-hatlar` }], W1[0]),
      td("Malzeme 40–1.300 mm · kalınlık 0,5–4,0 mm · serbest hız 40 m/dk · besleme hassasiyeti −0,1 mm · rulo 2.500–10.000 kg · iç 450–560 / dış 1.300–1.600 mm · 2+2 besleme · 5 × Ø85 doğrultma silindiri", W1[1]),
      td("—", W1[2]),
    ]}),
    new TableRow({ children: [
      tdL([{ t: "Rulo Dilme Hatları", link: `${S}/dilme-hatlari` }], W1[0]),
      td("Hafif seri 1.500 / 2.500 / 3.000 / 4.000 kg · ağır seri 6.000–15.000 kg · kalınlık kademeleri 0,5–1 · 0,5–2 · 0,8–3 · 1–5 mm · 8 bileşen listesi", W1[1]),
      td("15.000 kg üst kademe hâlâ üretiliyor mu?", W1[2], { color: KIRMIZI }),
    ]}),
    new TableRow({ children: [
      tdL([{ t: "Boy Kesme Hatları", link: `${S}/boy-kesme-hatlari` }], W1[0]),
      td("7 bileşen: rulo açıcı · yükleme arabası · doğrultma · otomatik servo besleme · giyotin makas · otomatik istifleme · PVC folyo uygulama", W1[1]),
      td("PVC folyo ünitesi standart mı, opsiyon mu?", W1[2], { color: KIRMIZI }),
    ]}),
  ])
);

govde.push(
  H2("A.2  Metin içinde geçen teknik iddialar"),
  P("Bunlar tabloda değil, sayfa metinlerinde yazıyor. Doğruluğu teyit edilmeli.", { color: GRI, size: 20 })
);

const W2 = [3000, 6500];
govde.push(
  TABLO(W2, [
    new TableRow({ tableHeader: true, children: [th("İddia", W2[0]), th("Geçtiği sayfalar", W2[1])] }),
    new TableRow({ children: [
      td("Merdaneler 4140 çelikten üretilir, 58–60 HRC sertliğe sertleştirilir", W2[0], { bold: true }),
      tdL([
        { t: "Kablo Kanalı", link: `${S}/roll-form-hatlari/kablo-kanali` }, { t: "  ·  " },
        { t: "C-Sigma-Omega", link: `${S}/roll-form-hatlari/c-sigma-omega` }, { t: "  ·  " },
        { t: "Solar Profil", link: `${S}/roll-form-hatlari/solar-profil` }, { t: "  ·  " },
        { t: "Solar yatırım yazısı", link: `${S}/akademi/solar-profil-hatti-yatirim-geri-donusu` },
      ], W2[1]),
    ]}),
    new TableRow({ children: [
      td("“27+ uzman kadro”  —  eski sitede “20+ saha personeli” yazıyordu. Güncel sayı kaç?", W2[0], { bold: true }),
      tdL([{ t: "Hakkımızda", link: `${S}/hakkimizda` }, { t: "  (istatistik şeridi + değerler bölümü)" }], W2[1]),
    ]}),
    new TableRow({ children: [
      td("Çalışma saati 08:30–18:00  —  eski sitede 08:00–18:00'di. Hangisi doğru?", W2[0], { bold: true }),
      tdL([{ t: "İletişim", link: `${S}/iletisim` }, { t: "  —  Google'a işletme bilgisi olarak gidiyor" }], W2[1]),
    ]}),
    new TableRow({ children: [
      td("48+ ülke · %99 zamanında teslim · %99 kalite kontrol onayı", W2[0], { bold: true }),
      tdL([{ t: "Hakkımızda", link: `${S}/hakkimizda` }, { t: " ve ana sayfa şeridi — pazarlama sayıları, teyit yeterli" }], W2[1]),
    ]}),
  ])
);

govde.push(
  new Paragraph({ children: [new PageBreak()] }),
  H2("A.3  Teknik tablosu OLMAYAN sayfalar — sayı bekleniyor"),
  PR([
    { t: "En çok iş görecek bölüm burası. " },
    { t: "17 ürün sayfamızın 13'ünde teknik özellik tablosu yok.", b: true },
    { t: " Alıcı makineyi ürün adıyla değil ölçüyle arıyor: “0,5–3 mm roll forming machine”, “1250 mm slitting line”. Çinli rakiplerin hepsi tam tablo yayınlıyor; her boş tablo kaybettiğimiz bir arama demek." },
  ]),
  P("Aşağıdaki sekiz roll form hattının HER BİRİ için şu sekiz değer lazım:", { bold: true, after: 100 })
);

[
  "İşlenebilen sac kalınlığı (min–maks, mm)",
  "Rulo / şerit genişliği (min–maks, mm)",
  "Hat hızı (m/dk)",
  "İstasyon sayısı (kaç merdane grubu)",
  "Kesme tipi — hidrolik giyotin mi, uçan makas mı?",
  "Toplam motor gücü (kW)",
  "PLC / kontrol markası (Schneider, Siemens, Delta…)",
  "Çalışılabilen malzeme — galvaniz, boyalı (PPGI), paslanmaz, alüminyum?",
].forEach((x) => govde.push(MADDE(x)));

govde.push(P("Hatlar (linkler sayfayı açar):", { bold: true, after: 100 }));

const W3 = [3400, 6100];
const hatlar = [
  ["Kablo kanalı hattı", "kablo-kanali"],
  ["Solar profil hattı", "solar-profil"],
  ["Ağır raf hattı", "agir-raf"],
  ["İskele kalası hattı", "iskele-kalas"],
  ["Yol bariyeri hattı", "yol-bariyeri"],
  ["Gürültü bariyeri hattı", "gurultu-bariyeri"],
  ["Trapez / cephe paneli hattı", "trapez-cephe-paneli"],
  ["C-Sigma-Omega profil hattı", "c-sigma-omega"],
];
govde.push(
  TABLO(W3, [
    new TableRow({ tableHeader: true, children: [th("Hat", W3[0]), th("Sayfa", W3[1])] }),
    ...hatlar.map(([ad, slug]) =>
      new TableRow({ children: [
        td(ad, W3[0]),
        tdL([{ t: `${S}/roll-form-hatlari/${slug}`, link: `${S}/roll-form-hatlari/${slug}` }], W3[1]),
      ]})
    ),
    new TableRow({ children: [
      td("Otomatik istifleyici  (fotoğrafı da yok)", W3[0], { bold: true }),
      tdL([{ t: `${S}/makineler/otomatik-istifleyici`, link: `${S}/makineler/otomatik-istifleyici` }], W3[1]),
    ]}),
  ]),
  NOT(
    "Sayılar gelene kadar bu sayfalara hiçbir teknik değer yazmayacağım. Eski sitedeki jenerik “2 × 11 kW motor” " +
    "değerini bilerek taşımadım — o tek bir hattın değeriydi, sekiz farklı hatta yayılamaz."
  )
);

govde.push(
  H2("A.4  Rulo dilme hattı — detay sorular"),
  SORU("A.4.a", "Hangi rulo kapasitelerini gerçekten üretiyoruz? Eski sitede 1.500 / 2.500 / 3.000 / 4.000 / 6.000 / 8.000 / 10.000 / 15.000 kg yazıyordu — bu liste hâlâ geçerli mi?"),
  SORU("A.4.b", "Kalınlık kademeleri 0,5–1 / 0,5–2 / 0,8–3 / 1,0–5 mm — doğru mu?"),
  SORU("A.4.c", "Maksimum sac genişliği kaç mm?"),
  SORU("A.4.d", "Tek geçişte en fazla kaç şerit çıkarabiliyoruz?"),
  SORU("A.4.e", "Hat hızı (m/dk)?"),
  SORU("A.4.f", "Bıçak tipi ve dilme toleransı (± mm)?"),

  H2("A.5  Boy kesme hattı — detay sorular"),
  SORU("A.5.a", "Kalınlık aralığı (mm)?"),
  SORU("A.5.b", "Genişlik aralığı (mm)?"),
  SORU("A.5.c", "Kesilebilen boy aralığı (min–maks mm)?"),
  SORU("A.5.d", "Boy toleransı (± mm) — alıcının en çok sorduğu değer bu."),
  SORU("A.5.e", "Hat hızı ve dakikada kaç levha?"),
  SORU("A.5.f", "Rulo ağırlık kapasitesi?"),

  H2("A.6  Otomatik istifleyici"),
  SORU("A.6.a", "İstifleyebildiği levha ölçüsü (min–maks)?"),
  SORU("A.6.b", "İstif yüksekliği / ağırlık kapasitesi?"),
  SORU("A.6.c", "Dakikada kaç levha istifliyor?"),
  SORU("A.6.d", "Hangi hatlara entegre çalışıyor — boy kesme, roll form, ikisi de?"),

  H2("A.7  Genel üretim kabiliyeti"),
  SORU("A.7.a", "Tüm ürün gamımızda en kalın işleyebildiğimiz sac kaç mm?"),
  SORU("A.7.b", "En geniş rulo kaç mm?"),
  SORU("A.7.c", "En ağır rulo kaç ton?"),
  SORU("A.7.d", "Makinelerimiz CE işaretli mi? Hangi belgelerimiz var?"),
  SORU("A.7.e", "Standart olarak hangi PLC / otomasyon markasını kullanıyoruz? Sitede Schneider geçiyor — hepsinde öyle mi?"),
  SORU("A.7.f", "Yurt dışında montaj ve devreye alma yapıyor muyuz? Kendi ekibimizle mi, yerel partnerle mi?"),
  SORU("A.7.g", "Uzaktan bağlantı / teleservis desteğimiz var mı?"),
  SORU("A.7.h", "Yedek parça teminini ne kadar sürede sağlıyoruz?"),
  new Paragraph({ children: [new PageBreak()] })
);

/* ---------- B. TICARI ---------- */
govde.push(
  H1("B. Ticari şartlar"),
  P("Sitede şu an teslim süresi, garanti ve ödeme koşullarıyla ilgili tek bir bilgi yok."),
  SORU("B.a", "Sipariş onayından sevkiyata kadar ortalama teslim süresi ne kadar? Makine tipine göre değişiyorsa kabaca aralık verebilir misiniz? (ör. servo besleyici X hafta, dilme hattı Y hafta)"),
  SORU("B.b", "Garanti süresi ne kadar ve neyi kapsıyor? Yedek parça ve işçilik dahil mi?"),
  SORU("B.c", "Ödeme koşulları nasıl işliyor? Peşinat yüzdesi, kalanın ne zaman ödendiği, akreditif kabul ediyor muyuz?"),
  SORU("B.d", "FAT (fabrika kabul testi) prosedürümüz var mı? Müşteri sevkiyat öncesi makineyi bizim tesiste görüp onaylıyor mu?"),
  NOT(
    "Neden önemli: Çinli rakiplerimizin sitelerinde bu bilgilerin hiçbiri yok — kimse yayınlamıyor. " +
    "Bunları yazarsak dokuz dilde bir içerik çıkar ve alıcının en çok merak ettiği ama cevabını bulamadığı şeyi biz veririz. " +
    "Rakiplerin açık verdiği tek nokta bu."
  )
);

/* ---------- C. URUN KAPSAMI ---------- */
govde.push(
  H1("C. Bu ürünleri yapıyor muyuz?"),
  P("Arama hacimleri ölçüldü, talep var, ama bizim sayfamız yok. Yapıyorsak sayfalarını açacağım; yapmıyorsak hiç uğraşmayalım."),
  SORU("C.a", "Trapez / kiremit görünümlü çatı paneli hattı — Rusça'da ayda 109 arama. Rusya bizim için önemli bir pazar ve orada ürünü son ürün adıyla arıyorlar."),
  SORU("C.b", "Oluk (yağmur oluğu) profil hattı — İngilizce'de ayda 280 arama."),
  SORU("C.c", "Çatı paneli (roof panel) hattı — ayda 150 arama."),
  SORU("C.d", "Taşınabilir / mobil roll form makinesi — ayda 140 arama."),
  SORU("C.e", "Yukarıdakiler dışında üretebildiğimiz ama sitede hiç yazmayan bir hat ya da makine var mı? Listede olmayan her ürün, hiç görünmediğimiz bir arama demek.")
);

/* ---------- D. REFERANSLAR ---------- */
govde.push(
  H1("D. Referanslar"),
  P("Projede şu an sadece iki referans kayıtlı ve ikisi de yayına kapalı — izniniz gelmeden açmıyorum.")
);
const W4 = [4200, 1600, 3700];
govde.push(
  TABLO(W4, [
    new TableRow({ tableHeader: true, children: [th("Firma", W4[0]), th("Logo", W4[1]), th("Kamuya açık dayanak", W4[2])] }),
    new TableRow({ children: [
      td("Sarıgözoğlu Hidrolik Makina ve Kalıp San. A.Ş.", W4[0]),
      td("var", W4[1]), td("Kendi YouTube kanalımızdaki ortak video", W4[2]),
    ]}),
    new TableRow({ children: [
      td("Mega Solar Metal A.Ş.", W4[0]), td("var", W4[1]), td("—", W4[2]),
    ]}),
    new TableRow({ children: [
      td("SMT Enerji", W4[0]), td("YOK", W4[1], { color: KIRMIZI, bold: true }), td("Projede hiç geçmiyor", W4[2]),
    ]}),
    new TableRow({ children: [
      td("Astor", W4[0]), td("YOK", W4[1], { color: KIRMIZI, bold: true }), td("Projede hiç geçmiyor", W4[2]),
    ]}),
  ])
);
govde.push(
  P("", { after: 60 }),
  SORU("D.a", "SMT Enerji ve Astor da referansımız mı? Projede hiç geçmiyorlar — ne logo var ne kayıt."),
  SORU("D.b", "Öyleyse tam resmî unvanları nedir? Logo altına o yazılacak (ör. “Astor Enerji A.Ş.” mi, başka bir unvan mı?)."),
  SORU("D.c", "Logo dosyalarını alabilir miyim? SVG tercih edilir, yoksa şeffaf zeminli PNG."),
  SORU("D.d", "Dört firmanın da logosunu siteye koyabilir miyiz? Yazılı izin almamız gerekiyor mu?"),
  SORU("D.e", "Bunlar dışında adını verebileceğimiz başka müşterimiz var mı?"),
  NOT(
    "Astor halka açık bir şirket (BIST'te işlem görüyor). Halka açık bir firmanın logosunu izinsiz kullanmak " +
    "daha görünür ve daha riskli. Sarıgözoğlu'nda elimiz rahat, çünkü iş birliği zaten kendi kanalımızdan yayınlanmış."
  ),
  NOT(
    "Neden ısrar ediyorum: incelediğim 18 rakip sitesinin 15'inde müşteri referansı bölümü var. " +
    "Bizde hazır ama kilitli — şu an en büyük eksiğimiz bu."
  )
);

/* ---------- E. GORSEL ---------- */
govde.push(
  H1("E. Görsel eksiği"),
  SORUL("E.a", [
    { t: "Otomatik istifleyici", b: true }, { t: " (" }, { t: "sayfa", link: `${S}/makineler/otomatik-istifleyici` }, { t: ") ve " },
    { t: "trapez / cephe paneli hattı", b: true }, { t: " (" }, { t: "sayfa", link: `${S}/roll-form-hatlari/trapez-cephe-paneli` },
    { t: ") sayfalarında hiç fotoğraf yok. Arşivdeki 175 görselin hepsine baktım, bu iki ürüne ait tek kare yok. Sahadan ya da atölyeden fotoğraf/video bulabilir miyiz?" },
  ]),
  SORU("E.b", "A.3'teki hatların çalışır hâlde videosu ya da fotoğrafı varsa onları da alabilir miyim? Ürün sayfasında çalışan makine görüntüsü hem satışı hem sıralamayı yukarı çekiyor.")
);

/* ---------- F. KARAR ---------- */
govde.push(
  H1("F. Karar ve aksiyon bekleyenler"),
  SORU("F.a", "tr.servosteel.com.tr diye ikinci bir site varmış — ana sitenin neredeyse birebir kopyası. Bu bilinçli mi yapılmıştı? Şu an ana siteye yönlendiriyorum ama arka planını bilmek istiyorum."),
  SORU("F.b", "Mevcut SEO ajansının link çalışmasını durdurabilir miyiz? Raporlarını inceledim: kurdukları linkler 2010'ların yöntemi ve bugün fayda değil zarar veriyor."),
  SORU("F.c", "info@servosteel.com.tr'ye gelen mailler reddediliyor — son 10 günde 433 kayıt var. Sunucumuz karşı tarafı doğrulayamadığı için gelen maili geri çeviriyor; muhtemelen müşteri talebi de kaybediyoruz. Veridyen'e ticket açalım mı?"),
  SORU("F.d", "Şu üç eski site hâlâ ayakta ve “servosteel” aramasında bizim altımızda sıralanıyor: servosteel.wixsite.com, servosteel.blogspot.com, servosteel.com. Kimde bunlar, kapatabilir miyiz?")
);

/* ---------- G. ÜYELİK ---------- */
govde.push(
  H1("G. Kurumsal üyelikler ve fuarlar"),
  P("Siteyi üst sıralara çıkarmak için sektör dizinlerinde ve kurumsal listelerde yer almamız gerekiyor. Bunlar zaten bizim aradığımız kelimelerde sıralanıyor — otoriteleri hazır."),
  P("Şunlarda üyeliğimiz / kaydımız var mı, varsa giriş bilgilerine ulaşabilir miyim?", { bold: true, after: 100 })
);
["MİB — Makina İmalatçıları Birliği", "TOBB sektör meclisi", "İMMİB ihracatçı listeleri",
 "DirectIndustry · Europages · IndustryStock · Kompass (uluslararası sektör dizinleri)",
 "makinaturkiye.com (Türkçe aramada 1 numara, kayıt ücretsiz)"].forEach((x) => govde.push(MADDE(x)));
govde.push(
  SORU("G.a", "Son 2–3 yılda hangi fuarlara katıldık? Fuarların katılımcı listeleri kalıcı ve değerli bağlantı veriyor; geçmiş fuarlarınkiler de işe yarar.")
);

/* ---------- H. STRATEJI ---------- */
govde.push(
  new Paragraph({ children: [new PageBreak()] }),
  H1("H. Strateji — doğru yere çalışmam için"),
  H2("H.1  Gerçek rakiplerimiz kimler?"),
  P("Rakipleri şu an Google'da kimin çıktığına bakarak çıkardım. Ama işi gerçekte kime kaptırdığımız bambaşka olabilir; ikisi farklıysa yanlış kelimelere çalışıyorum demektir."),
  SORU("H.a", "Son 1–2 yılda kaybettiğimiz işlerde müşteri kimi tercih etti? İsim verebilir misiniz — hem Türk hem yabancı."),
  SORU("H.b", "Müşteri bizi hangi gerekçeyle eledi? Fiyat mı, teslim süresi mi, referans eksikliği mi?"),
  SORU("H.c", "Fiyatta nerede duruyoruz — Çin'in üstünde, Avrupa'nın altında mı? Yoksa başka bir konum mu? İçeriğin tonunu bu belirliyor."),
  H2("H.2  Hangi pazar gerçekten para ediyor?"),
  P("Sitede dokuz dil var ve hepsine eşit emek veriliyor. Ama pazarlar eşit değil."),
  SORU("H.d", "Cironun ülke / bölge dağılımı kabaca nasıl? İlk beş ülke hangileri?"),
  SORU("H.e", "Önümüzdeki bir yılda hangi pazara girmek istiyoruz?"),
  SORU("H.f", "48 ülkeye ihracat yazıyoruz — hangi ülkeler olduğunu alabilir miyim? Ülke bazlı içerik açarsak lazım."),
  NOT("Bu cevaplar gelince emeği o dillere yığarım. Şu an dokuz dile eşit dağıtıyorum, bu da hiçbirinde yeterince derine inememek demek."),
  H2("H.3  Eksik parçalar"),
  SORU("H.g", "Kuruluş yılımız tam olarak kaç? Sitede sadece “10 yılı aşkın” yazıyor, kesin yıl hiçbir yerde yok. Google'a şirket bilgisi olarak veriliyor."),
  SORU("H.h", "Bugüne kadar kaç makine / hat teslim ettik? Rakam varsa siteye koyarız — alıcı için en ikna edici sayı bu."),
  SORU("H.i", "Google İşletme Profilimiz var mı? Yoksa açalım: “servosteel” şu an en çok tık alan kelimemiz ve işletme profili o aramanın sağ tarafını komple bize verir. Varsa yönetim erişimi alabilir miyim?"),
  SORU("H.j", "Formdan gelen talepler şu an e-postaya düşüyor. CRM'e mi aksın, yoksa böyle devam mı? Bölgeye göre farklı kişiye gitmesi gerekiyor mu?"),
  H2("H.4  ServoMold — ikinci markamız arama motorlarında hiç görünmüyor"),
  PR([
    { t: "Kalıp işinin " }, { t: "servomold.com.tr", b: true },
    { t: " üzerinden devam ettiğini öğrendim. Siteye baktım: sayfa başlığı kendini tekrarlıyor, H1 başlığı hiç yok, sitemap boş, robots.txt yok, altyapı çok eski. " },
    { t: "Google'da sıralandığı kelime sayısı sıfır.", b: true },
    { t: " Gerçek bir ciro kalemiyse tamamen boşta duran bir pazar demek." },
  ]),
  SORU("H.k", "servomold.com.tr'yi kim yönetiyor? Erişimini alabilir miyim?"),
  SORU("H.l", "Kalıp işi ne kadar ciro yapıyor, büyütmek istiyor muyuz? İstiyorsak o siteyi de ele almamız gerekir."),
  SORU("H.m", "İki siteyi birbirine linkleyelim mi? Servosteel'de kalıp arayan ziyaretçi şu an hiçbir yere yönlendirilmiyor."),
  NOT("Dürüst olayım: iki siteyi linklemek sıralama kazandırmaz. ServoMold'un arama otoritesi sıfır olduğu için oradan gelen bağlantı Servosteel'e bir şey katmaz. Bunu ziyaretçi aradığını bulsun diye yaparız, SEO için değil.")
);

/* ---------- ONCELIK ---------- */
govde.push(
  new Paragraph({ children: [new PageBreak()] }),
  H1("Öncelik sırası"),
  P("Hepsi aynı anda gerekmiyor. Sıralama şöyle:")
);
const W5 = [900, 3400, 5200];
govde.push(
  TABLO(W5, [
    new TableRow({ tableHeader: true, children: [th("Sıra", W5[0]), th("Ne", W5[1]), th("Neden", W5[2])] }),
    new TableRow({ children: [
      td("1", W5[0], { bold: true }),
      td("H.1 ve H.2 — gerçek rakipler ve hangi pazar para ediyor", W5[1], { bold: true }),
      td("Kısa cevaplar bile yeter. Bunlar yanlışsa aşağıdaki teknik işi de yanlış ürünler için yapmış olurum.", W5[2]),
    ]}),
    new TableRow({ children: [
      td("2", W5[0], { bold: true }),
      td("A bölümü — teknik doğrulama ve eksik tablolar", W5[1], { bold: true }),
      td("En çok trafiği bu açar. 13 sayfa şu an alıcının aradığı sayıyı içermiyor. Ayrıca Google spec tablolarımızı taramaya başladı.", W5[2]),
    ]}),
    new TableRow({ children: [
      td("3", W5[0], { bold: true }),
      td("B bölümü — ticari şartlar", W5[1], { bold: true }),
      td("Rakiplerin hiçbirinin yayınlamadığı bilgi. Dokuz dilde tek bir içerik, doğrudan fark yaratır.", W5[2]),
    ]}),
    new TableRow({ children: [
      td("4", W5[0], { bold: true }),
      td("D — referans izni  ·  F.b ve F.c", W5[1], { bold: true }),
      td("Referans 18 rakibin 15'inde var, bizde kilitli. F.b ve F.c ise gecikince zararı büyüyen türden.", W5[2]),
    ]}),
  ]),
  P("", { after: 200 }),
  P("Cevaplar geldikçe siteye ben işlerim; hiçbirini sizin dosya üzerinde düzeltmeniz gerekmiyor.", { italics: true, color: GRI })
);

/* ------------------------------------------------------------------ */
const doc = new Document({
  creator: "Yasin Gülsoy",
  title: "Servosteel — Filiz Hanım'a doğrulama ve bilgi talebi",
  numbering: {
    config: [{
      reference: "nokta",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 420, hanging: 220 } } },
      }],
    }],
  },
  styles: {
    default: { document: { run: { font: "Calibri", size: 21 } } },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: convertInchesToTwip(0.9), bottom: convertInchesToTwip(0.9),
                  left: convertInchesToTwip(0.85), right: convertInchesToTwip(0.85) },
      },
    },
    children: govde,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("Servosteel-Filiz-Hanim.docx", buf);
  console.log("yazildi:", buf.length, "bayt");
});

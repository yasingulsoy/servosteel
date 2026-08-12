# Servosteel — Kontrol Defteri

İki bölüm: **A)** Filiz Hanım'ın mühendislere doğrulatacağı teknik sayfalar
(canlı linkleriyle) · **B)** bizim her seferinde koştuğumuz periyodik kontroller.

**Güncelleme:** 2026-08-08 · SEO/strateji arka planı: [SEO.md](SEO.md)

> **Neden acil:** Search Console 6–7 Ağustos'ta üç makine sayfasının **Product
> şemasını taradı** (straightener-servo-feeders, doğrultmalı-servo-sürücüler,
> servo-sürücüler). Yani Google spec tablolarımızı okumaya başladı — yanlış bir
> sayı artık sadece sitede değil, arama sonucunda da görünebilir.

---

## A. Mühendis doğrulama listesi

Kural: mühendis yalnızca **Türkçe sayfadaki sayıyı** işaretlesin ("doğru" /
"doğrusu şu"). Dokuz dile yaymayı biz yaparız — tek tek dosya düzeltmesin.

> **DERS: her ürün ailesinin katalogda BİRDEN FAZLA tablosu var.**
>
> 2026-08-10 sabahı katalogdan yalnızca bazı tabloları okuyup canlıya değer
> yazdım; öğleden sonra kalan sayfalar okununca hepsinin **fazla dar** olduğu
> çıktı. Bir ürüne dair sayı yazmadan önce **o ürünün TÜM sayfaları** okunmuş
> olmalı.
>
> | ürün | katalogdaki tablolar |
> |---|---|
> | mekanik açıcı | s.8 SRV-MA 500–2.500 kg · s.9 konik mandren 3.000–4.000 kg · s.10 SRV-MA3000/4000 3.000–4.000 kg, 1.200 mm'ye kadar |
> | kompakt hat | s.23 SRV-KH…**3** 0,5–3 mm / 35 m/dk / 5 merdane / Ø85 · s.25 SRV-KH…**6** 1–6 mm / 25 m/dk / 7 merdane / Ø110 |
> | doğrultmalı sürücü | s.19 DSS 7 merdane 0,4–3 mm · s.20 DSS 9 merdane 0,5–4 mm · metin: 7/9/11/13 merdane, **0,4–6 mm** |
>
> **Sabah "çelişki" sanılan iki şey çelişki değilmiş, ayrı serilermiş:**
> - "4.000 mı 2.500 mi" → mekanik açıcı gerçekten **4.000 kg**'a çıkıyor (s.10).
>   İlk yorumum ("4.000 dilme hattının kapasitesi") yanlıştı.
> - "kompakt kalınlık 0,5–4 mü 1–6 mı" → **iki ayrı seri**; özet tablo ikisini
>   birden kapsamalı (0,5–6 mm).
>
> **"±0,1 mm"** doğrulandı: kompakt hatların sürme hassasiyeti, yalnızca o ürün
> için geçerli (s.23 ve s.25, ikisinde de ~0,1).
>
> Katalogda **iki hata**, firmaya bildirilecek: s.16'da İngilizce satır "600 mm"
> diyor (doğrusu 1600, mini sürücülerden kopyalanmış); s.25 ve s.23'te iki farklı
> sütun aynı model kodunu taşıyor (KH806 / KH803) — her iki tabloda tekrarladığı
> için dizgi hatası değil, açıcı tipine göre ayrılan bir konfigürasyon olabilir.

> **A.1 tabloları katalogla hizalandı (2026-08-10).** Canlıdaki 9 değer
> katalogla çelişiyordu; 9 dilde birden düzeltildi. Çoğu makineyi olduğundan
> KÜÇÜK gösteriyordu — en kötüsü hidrolik açıcının rulo genişliğiydi:
> **80–1.000 mm** yazıyordu, doğrusu **80–1.600 mm**. 1.400 mm rulo işleyecek
> bir alıcı sayfayı okuyup eleniyordu.
>
> | sayfa | satır | eski | yeni |
> |---|---|---|---|
> | rulo-acicilar | rulo genişliği (hidrolik) | 80–1.000 mm | **80–1.600 mm** |
> | rulo-acicilar | rulo iç çapı (mekanik) | 300 mm | **300–550 mm** |
> | servo-suruculer | malzeme kalınlığı | 0,4–4,0 mm | **0,2–4,0 mm** |
> | servo-suruculer | serbest besleme hızı | 35 m/dk | **35 / 100 / 250 m/dk** |
> | servo-suruculer | besleme silindiri | 2 × Ø85 | **2 × Ø80–Ø85** |
> | kompakt-hatlar | malzeme kalınlığı | 0,5–4,0 mm | **1–6 mm** |
> | kompakt-hatlar | serbest hız | 40 m/dk | **25 m/dk** |
> | kompakt-hatlar | besleme hassasiyeti | −0,1 mm | **±0,1 mm** |
> | kompakt-hatlar | doğrultma silindiri | 5 × Ø85 | **7 × Ø110** |
>
> Kural: kapasitede katalogdaki GENİŞ değer alındı, **hızda DÜŞÜK değer**.
> Kapasiteyi eksik yazmak müşteri kaçırır; hızı fazla yazmak taahhüt yaratır.
>
> **Dokunulmayan ikisi:**
> - `rulo dış çapı (maks.) 1.600` — doğru. LA modelleri 1.600'e çıkıyor, satırda
>   "(maks.)" yazdığı için geçerli. İlk taramada yanlış işaretlemiştim.
> - `dogrultmali-servo-suruculer` tablosunun tamamı — katalogda **kasalı**
>   doğrultmalı serinin tablosu henüz okunmadı (s.19-24). Yalnızca mini seriyi
>   (SRV-MDS) görüp sayfanın tamamını değiştirmek yanlış olurdu.
>
> **Firmaya sorulacak:** kompakt hatta kalınlık gerçekten 1-6 mm mi (site 0,5-4
> diyordu), hız 25 mi 40 mı? İkisi birbirini kapsamıyor, biri yanlış.

### A.0 Makine varyant sayfaları (2026-08-10, yeni)

**6 varyant × 9 dil = 54 URL.** Sitemap 416 → **470**, build 426 → **480 sayfa**.
Üst sayfalara **dokunulmadı** — `/makineler/rulo-acicilar` "rulo açıcılar"da
7. sırada ve hub olarak kalıyor; her üst sayfaya çocuklarına giden kart eklendi.

| yol | katalog serisi | model |
|---|---|---|
| rulo-acicilar/hidrolik | SRV-HA | 6.000–20.000 kg |
| rulo-acicilar/mekanik | SRV-MA | 500–2.500 kg |
| servo-suruculer/mini | SRV-SS | 6 model, 10–600 mm |
| servo-suruculer/kasali | SRV-KS | 9 model, 40–1.600 mm |
| dogrultmali-servo-suruculer/mini | SRV-MDS | 4 model, 15–400 mm |
| dogrultmali-servo-suruculer/kasali | SRV-DSS | 9 model, 30–1.600 mm |

**Model kodları: sürücülerde YAZILDI, açıcılarda YAZILMADI.** Sürücü kodları
tek tek kontrol edildi, tekrar eden yok. Açıcılarda `SRV-HA6000-PUB` kodu iki
farklı satırda farklı genişliklerle geçiyor (`SRV-KH806`'da da aynı sorun);
orada kapasite kırılımı verildi, kodlar firma teyit edince eklenir.

**Yazılmayan iki veri:** SRV-MDS'in "doğrultma merdanesi 5–60 adet" hücresi
(60 merdane fiziksel olarak makul değil, katalogda dizgi/okuma hatası olmalı) ·
SRV-DSS'in seri adı (sayfa başlığı `SRV-DDS`, satırlardaki kodlar `SRV-DSS`;
satırlardaki yazıldı).

**Katalog sitedeki doğrultmalı tablosunu doğruladı:** ≤1.600 mm ve 0,5–4 mm
doğru, "7/9/11/13 doğrultma silindiri" de doğru — s.20 bunun "9 merdane"
konfigürasyonu. Değiştirmemek doğru karardı.

Yapı: slug tablosu `slugs.ts` → `VARIANT_SLUGS`, yol üretimi `routing.ts` →
`buildPathnames`, sayfa listesi `catalog.ts` → `machineVariants`. Üçü ayrışırsa
routing.ts açılışta hata fırlatır. Varyant üst ürününe bağlı —
`/makineler/kompakt-hatlar/hidrolik` 404 döner.

**Yakalanan hata:** ilk yazımda `metaTitle` değerlerine "| Servosteel" konmuştu,
oysa marka son ekini layout şablonu ekliyor — başlıklar "… | Servosteel |
Servosteel" çıkıyordu. 54 başlıktan temizlendi. İngilizce başlıklarda
görünmüyordu çünkü 60 karakteri aşıp şablonu atlıyorlardı; hata oradaydı ama
gizliydi.

### A.1 Spec tablosu YAYINDA olan sayfalar — sayılar teyit edilecek

| # | sayfa | doğrulanacak değerler | bilinen sorun |
|---|---|---|---|
| 1 | [Rulo Açıcılar](https://servosteel.com.tr/makineler/rulo-acicilar) | Mekanik 500/750/1.500/2.500 kg · Hidrolik 6–20 ton · genişlikler 30–500 / 80–1.000 mm · iç çap 300 / 450–560 mm · dış çap 1.600 mm | ⚠️ **ÇELİŞKİ:** `<title>` "500–4.000 kg" diyor, tablo 2.500'de bitiyor. Eski site de kendi içinde tutarsızdı. **Üst kapasite hangisi?** |
| 2 | [Servo Sürücüler](https://servosteel.com.tr/makineler/servo-suruculer) | 0,4–4,0 mm · ≤1.600 mm · 35 m/dk · 2×Ø85 mm · 7" HMI · 250 reçete | ⚠️ **±0,1 mm hassasiyet servo sürücü için de geçerli mi?** Şu an yalnızca kompakt hatta yazılı |
| 3 | [Doğrultmalı Servo Sürücüler](https://servosteel.com.tr/makineler/dogrultmali-servo-suruculer) | ≤1.600 mm · 0,5–4,0 mm · doğrultma silindiri 7/9/11/13 · 250 reçete · Schneider LCD | — |
| 4 | [Kompakt Hatlar](https://servosteel.com.tr/makineler/kompakt-hatlar) | 40–1.300 mm · 0,5–4,0 mm · 40 m/dk · **−0,1 mm** · rulo 2.500–10.000 kg · iç 450–560 / dış 1.300–1.600 mm · 2+2 besleme · 5×Ø85 doğrultma | — |
| 5 | [Rulo Dilme Hatları](https://servosteel.com.tr/dilme-hatlari) | Kapasite kademeleri: hafif 1.500–4.000 kg / ağır 6.000–15.000 kg · kalınlık kademeleri 0,5–1 / 0,5–2 / 0,8–3 / 1–5 mm · 8 bileşen | **15.000 kg üst kademe hâlâ üretiliyor mu?** |
| 6 | [Boy Kesme Hatları](https://servosteel.com.tr/boy-kesme-hatlari) | 7 bileşen: açıcı, yükleme arabası, doğrultma, servo besleme, giyotin, istifleme, **PVC folyo uygulama** | PVC folyo ünitesi standart mı, opsiyon mu? |

### A.2 Spec DIŞI teknik iddialar — metin içinde geçiyor

| # | iddia | geçtiği sayfalar |
|---|---|---|
| 7 | **Merdane: 4140 çelik, 58–60 HRC** | [Kablo Kanalı](https://servosteel.com.tr/roll-form-hatlari/kablo-kanali) (özellik kutusu) · [C-Sigma-Omega](https://servosteel.com.tr/roll-form-hatlari/c-sigma-omega) (SSS) · [Solar Profil](https://servosteel.com.tr/roll-form-hatlari/solar-profil) (SSS) · [Solar yatırım yazısı](https://servosteel.com.tr/akademi/solar-profil-hatti-yatirim-geri-donusu) |
| 8 | **"27+ uzman kadro"** | [Hakkımızda](https://servosteel.com.tr/hakkimizda) — eski sitede "20+ saha personeli" yazıyordu; güncel sayı? |
| 9 | **Çalışma saati 08:30–18:00** | [İletişim](https://servosteel.com.tr/iletisim) — eski sitede 08:00–18:00'di; hangisi doğru? |
| 10 | 48+ ülke · %99 zamanında teslim · %99 QC | [Hakkımızda](https://servosteel.com.tr/hakkimizda) + ana sayfa şeridi — pazarlama sayıları, teyit yeterli |

### A.3 Tablosu OLMAYAN sayfalar — mühendislikten SAYI BEKLİYOR

Bu 8 hattın her biri için 8 değer lazım (Filiz Hanım listesindeki 3.1 sorusu):
kalınlık · genişlik · hat hızı · istasyon sayısı · kesme tipi (giyotin/uçan
makas) · toplam motor gücü (kW) · PLC markası · çalışılan malzeme.

- [Kablo Kanalı](https://servosteel.com.tr/roll-form-hatlari/kablo-kanali) · [Solar Profil](https://servosteel.com.tr/roll-form-hatlari/solar-profil) · [Ağır Raf](https://servosteel.com.tr/roll-form-hatlari/agir-raf) · [İskele Kalası](https://servosteel.com.tr/roll-form-hatlari/iskele-kalas) · [Yol Bariyeri](https://servosteel.com.tr/roll-form-hatlari/yol-bariyeri) · [Gürültü Bariyeri](https://servosteel.com.tr/roll-form-hatlari/gurultu-bariyeri) · [Trapez/Cephe Paneli](https://servosteel.com.tr/roll-form-hatlari/trapez-cephe-paneli) · [C-Sigma-Omega](https://servosteel.com.tr/roll-form-hatlari/c-sigma-omega)
- Ayrıca: [Otomatik İstifleyici](https://servosteel.com.tr/makineler/otomatik-istifleyici) (levha ölçüsü, kapasite, hız) — fotoğrafı da yok.

Sayılar gelene kadar bu sayfalara **hiçbir spec yazılmayacak** — eski jenerik
"2×11 kW" değeri bilerek taşınmadı (tek hattın değeriydi, sekize yayılamaz).

**Katalog (2026-08-10) 8 değerden ikisini kapattı:** PLC markası **Schneider**
(tüm hatlarda), kesme tipi roll form hatlarında **uçar makas** / boy kesmede
**giyotin**. Kalan altı değer (kalınlık, genişlik, hat hızı, istasyon sayısı,
motor gücü, malzeme) hâlâ mühendislikten bekleniyor. Katalogda 8 hattın yalnızca
üçü var: kablo kanalı, market rafı, solar panel. Ayrıntı ve makine tabloları:
`belgeler/KATALOG-VERILERI.md`.

**Otomatik istifleyici fotoğrafı:** katalog s.29'un sağ alt fotoğrafında makaslı
istifleme masası var — kırpılıp kullanılabilir, firmadan yeni fotoğraf beklemeye
gerek kalmayabilir.

---

## B. Periyodik kontroller — her seferinde

### B.1 Deploy sonrası (her yayında)

```bash
python scripts/canli-kontrol.py
```
14 canlı kontrol: yeni yazı, başlıklar, video bölümleri, SSS'ler, sitemap,
GA4 ve Clarity script'lerinin yüklendiği.
Hepsi OK ise ve **yeni URL** eklendiyse:
```bash
npm run indexnow
```

### B.2 Haftalık ölçüm (komutlar `~/.config/claude-seo` içinden)

```bash
python gsc.py --property sc-domain:servosteel.com.tr --days 7 --dimensions query --limit 30
python gsc.py --property sc-domain:servosteel.com.tr --days 7 --dimensions page --limit 30
python url-denetim.py
python ga4.py --property 548769261 --days 7
python ga4.py --property 548769261 --report top-pages --days 28
python clarity.py --gun 3
python clarity.py --gun 3 --kirilim Device
```

**Microsoft Clarity: `xzdxkpw7qv`** — ısı haritası, kaydırma derinliği, ölü/öfke
tıklaması ve oturum kaydı. GA4 "kaç oturum" der, Clarity "o sayfada ne yaptı"
der. Dönüşüm sıfırken sebebi ancak bu gösterir. GA4 ile aynı
`IS_PRODUCTION_SITE` korumasına bağlı — önizleme kopyalarında hiç yüklenmez.
Sitede çalıştığı doğrulandı (2026-08-09): `window.clarity` fonksiyon,
`clarity.js 0.8.69` iniyor.

**Clarity API token'ı PROJE BAZLIDIR.** Çağrıda proje kimliği gönderilmiyor —
token hangi projede üretildiyse onun verisi geliyor. Elimizdeki token
`dekoartizan` projesine aitti ve Servosteel sanılıyordu; `clarity.py` artık her
çalışmada dönen host'ları yazdırıp beklenenle karşılaştırıyor, aynı karışıklık
sessizce tekrarlanamaz. Günde proje başına **10 istek** sınırı var.

**GA4 mülkü: `ServoSteel 548769261`** — erişim test edildi (2026-08-07),
servis hesabı Görüntüleyici olarak veri çekiyor. `generate_lead` olayı form
gönderimlerinde tetikleniyor; dönüşüm olarak işaretlenmesi GA4 arayüzünden
yapılmalı (Yönetici → Etkinlikler → generate_lead → anahtar etkinlik).

### B.3 İzlenen kelimeler (GSC'de gözle)

| kelime | taban (2026-08-07) | hedef |
|---|---|---|
| rulo açıcılar | 7. sıra | ilk sayfa üstü |
| trapez sac makinesi | — | ilk sayfa (480/ay, SERP zayıf) |
| rollform makinesi | — | ilk sayfa (590/ay) |
| roll forming machine manufacturer (US/UK) | — | ilk 2 sayfa (140/ay, LOW) |
| cable tray roll forming machine (US) | — | ilk sayfa (40/ay, SERP'te CN) |
| servosteel (marka) | 1. | korunacak + sitelink'ler bize kalacak |
| noise barrier production equipment | 5. (2026-08-09) | sayfa derinleştirildi, 1. sayfa üstü |
| rack production | 5. (2026-08-09) | aynı |
| sigma profiler · decoilers · steel coil uncoiler | 6. | aynı |
| road barrier line · barrera bionda · cable production line | 9. | aynı |
| roll forming line · slitting coil | 10. | aynı |
| guardrail production · slitting line | 12. | aynı |
| sac ağırlık hesaplama (TR) | — | ilk sayfa (8.100/ay) — **link hedefi, talep değil** |
| sheet metal weight calculator (US/UK) | — | ilk 2 sayfa (570/ay) — aynı gerekçe |

### B.4 Search Console özel raporlar

- **Ürün snippet'leri raporu:** 3 örnek sayfa tarandı (6–7 Ağu) — hata/uyarı
  çıkarsa spec şemasında alan eksiği demektir, bana getir.
- **Video raporu:** 8 Ağustos'ta iki uyarı vardı — `uploadDate`'te zaman dilimi
  eksik + geçersiz datetime (7 öğe). Düzeltildi: 102 videonun gerçek yükleme
  saati YouTube'dan çekilip tam ISO 8601'e (+03:00) çevrildi. Uyarıların
  kapandığını birkaç hafta içinde bu raporda gör.
- **Bing Site Scan — "Alt attribute is missing" YANLIŞ ALARM.** Tek `alt=""`
  olan görsel header'daki koyu tema logo kopyası ve `aria-hidden` işaretli;
  dekoratif görsele boş alt vermek doğru olandır. Doldurulursa ekran okuyucu
  marka adını iki kez okur. Rapor tekrar çıkarsa yok say.
- **Kapsam:** "keşfedildi, dizine eklenmedi" sayısı düşüyor mu.
  - taban: 424 sayfanın ~3'ü indeksli (2026-08-06)
  - **2026-08-10: 74 URL'lik katmanlı örnekte %41 indeksli (30/74).** Kalan 44'ün
    20'si "keşfedildi, indekslenmedi", 24'ü "Google bilmiyor". Örneklenen her
    sayfa 200 dönüyor, `noindex` yok, self-canonical, ana sayfadan linkli ve
    sitemap'te — yani teknik kusur değil, Google'ın henüz sırası gelmemiş.
    Ölçüm: `scratchpad/kapsama.py` (sabit tohum, tekrar çekilebilir).

### B.4.1 Taşınma tabanı — GSC mülkü yalnızca 2026-07-28'den beri veri tutuyor

Alan adı mülkü o tarihte doğrulandı; öncesi geri doldurulmuyor. Karşılaştırma
noktası kaybolmasın diye buraya yazıldı (ölçüm 2026-08-10):

| | 12 gün (28 Tem–8 Ağu) | son 6 gün |
|---|---|---|
| tık / gösterim | 67 / 905 | — |
| ortalama pozisyon | 16,3 | — |
| **yeni site URL'leri** | %19,5 gösterim payı | **%23,7** |
| eski WordPress URL'leri | %57,5 | %51,1 |
| `tr.` kopya alt alan adı | %23,0 | %25,1 |

Yeni URL payı yükseliyor, eski WP payı düşüyor — 301'ler işliyor. `tr.`, `www.tr.`
ve `www.` host'larının üçü de apex'e 301/308 veriyor (2026-08-10 teyit edildi);
GSC'de hâlâ görünmeleri Google'ın yönlendirmeyi henüz işlememesinden.

### B.5 Bekleyenler (kapanınca buradan silinecek)

**Katalog baştan sona okundu (2026-08-12) — firmaya sorulacaklar:**

- [ ] **Tüzel kişilik unvanı.** Katalog iki farklı yazıyor: s.3 "STEEL Makina
  Kalıp **ve Sanayi** Ltd. Şti.", s.6 "Steel Makina Kalıp **San. ve Tic.**
  Ltd. Şti." Ticaret sicilindeki tam hâli lazım — **KVKK/gizlilik sayfası
  buna bağlı**, aylardır bu yüzden yazılamıyordu.
- [ ] **SRV-BDH birleşik hattı** (boy kesme + dilme tek hatta, s.31) hâlâ
  satılıyor mu? Satılıyorsa sitede sayfası yok.
- [ ] **"Market Raf" mı "Ağır Raf" mı** — katalog s.36 "Market Raf Üretim
  Hattı" diyor, sitede "Ağır Raf Üretim Hattı" var. Aynı ürün mü?
- [ ] **SRV-BH 1500 mm / 6 mm** — sahadaki makinenin etiketi (s.30) 6 mm
  diyor, katalog kalınlık kademeleri 1–5 mm'de bitiyor.
- [ ] **Kompakt hat model kodları** — `KH803` / `KH804` / `KH806` her tabloda
  ikişer kez, farklı rulo ağırlığı ve mandren tipiyle geçiyor. Aynı kod iki
  açıcı seçeneğini mi kapsıyor? Teyit gelmeden model kodları siteye yazılmadı.
- [ ] **Katalogdaki 6 hata** — TR/EN uyuşmazlıkları (3 yerde), giriş metni ile
  tablo çelişkisi (3 yerde), seri adı tutarsızlığı (KSS/KS, DDS/DSS). Katalog
  yurtdışına gittiği için İngilizce hatalar öncelikli.
  Ayrıntı: `belgeler/KATALOG-VERILERI.md`
- [ ] **ASTOR referansı** — katalog s.30'daki kurulum fotoğrafı Astor'un
  tesisinde çekilmiş (vinçlerden belli). Logo izni istenirken bu kullanılabilir.

- [x] GA4 mülk numarası → **548769261 alındı, test edildi (2026-08-07)**
- [x] Yandex `https://` host'u **eklendi ve DNS ile doğrulandı (2026-08-09)** — token `caf7df52b9c31e1a` iki host için de geçerli
- [ ] Yandex **ana ayna** ayarı: `https://` seçilecek (ikisinde de boş). Host yüklenince yapılabilir
- [ ] Yandex'e **sitemap ekle** (`NO_SITEMAPS` sorunu duruyor) — `https://servosteel.com.tr/sitemap.xml`, https host'una
- [x] Bing Webmaster kaydı — **yapıldı (2026-08-07)**
- [x] ~~Terk edilmiş mülkler (wixsite/blogspot/.com)~~ — **kapsam dışı bırakıldı (2026-08-07 kararı)**
- [x] ~~6 ürün sayfasının kalan 7 dili~~ — **tamamlandı (2026-08-09)**: 54 sayfa/dil
  kombinasyonunun tamamında 6 adımlı üretim akışı + 8 SSS (EN kablo kanalında 9).
  Kelime aralığı dile göre 1.094–1.753.
- [ ] **Clarity API token'ı Servosteel projesinden üretilecek** — Clarity'de
  `xzdxkpw7qv` projesini aç → Settings → Data Export → Generate new API token →
  değeri `~/.config/claude-seo/clarity.json` içinde `projects.servosteel.api_token`
  alanına yapıştır (sohbete yazma). Sonrası hazır: `python clarity.py`
- [ ] **Gizlilik / KVKK aydınlatma sayfası YOK** — iletişim ve teklif formları
  ad, e-posta, telefon, firma topluyor; Clarity oturum kaydı da alıyor. KVKK
  m.10 toplama anında bilgilendirme istiyor, AB dilleri (DE/ES/IT/PL/HU) için
  GDPR m.13 aynı şeyi. Yazabilmem için firmadan 3 bilgi lazım: **resmi ünvan**
  (veri sorumlusu olarak yazılacak), **VERBİS kaydı var mı**, **form
  e-postaları ne kadar saklanıyor**. Gerisini 9 dile ben yazarım.
- [ ] Mevcut ajansın link inşasını durdur
- [ ] Referans logoları izni (Sarıgözoğlu · Mega Solar · SMT Enerji · Astor) — kod hazır, `PUBLISH_REFERENCES=false`
- [x] ~~cPanel `filtre1`~~ — **silindi (2026-08-10)**, mail hemen geldi. Kural
  `Konu içerir "spam" → Mesajı At` idi; alt dize eşleşmesi olduğu için konusunda
  "spam" harfleri geçen her mail sessizce yok ediliyordu — klasöre düşmüyor,
  gönderene hata dönmüyordu. Teslim raporunda `Teslim Alan: /dev/null`,
  `Yönlendirici: central_filter` olarak görülüyordu.
- [ ] **Filtre yüzünden kaybedilen mailleri çıkar** — cPanel → Takip Teslimatı,
  sonucu "Filtrelenmiş" olanlar. Yalnızca 10 gün geriye kayıt var, o yüzden acele.
  Müşteri talebi varsa en azından kimden geldiği öğrenilir.
- [ ] **Spam Filtreleri ayarı** — "Otomatik Olarak Spam'i Sil" kapalı olmalı,
  "Spam Kutusu" açık. Silinen mail geri gelmiyor, klasördeki geliyor.
- [x] ~~liza@ kutusundaki eski mailler~~ — **kapsam dışı bırakıldı (2026-08-10
  kararı)**. Sunucuda yoklar: 267 gönderilmiş mail × 1,43 MB = 382 MB, kotanın
  tamamını açıklıyor, yani çöp/arşiv de boş. Eski PC'de 6,2 MB'lık bir .pst
  bulundu ama aktarılmadı. Hesap o bilgisayardan kaldırıldı, yeni kurulum IMAP —
  yani bundan sonra gelen mail kaybolmuyor, kayıp geçmişle sınırlı.
- [ ] **liza@ kotası 1 GB'da sınırlı** — cPanel "Kotalar 1 GB değerini aşamaz"
  diyor, bu hosting paketi tavanı (WHM → paket → Max Mailbox Quota). Veridyen'den
  yükseltme istenecek. Şu an 382 MB dolu; tamamı 24 Temmuz kampanyasının 267
  gönderilmiş kopyası.
- [ ] **Katalog siteye konacak** — 1,43 MB PDF'i 267 kişiye eklemek sunucuda 267
  kopya demek, üstelik teslim oranını düşürüyor ve kaç kişinin açtığı ölçülemiyor.
  Siteye konup mailde link verilirse üçü de çözülür.
- [ ] 4 CalDAV/CardDAV SRV kaydı → `cpanel.servosteel.com.tr`

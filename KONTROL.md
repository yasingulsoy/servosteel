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
- **Kapsam:** "keşfedildi, dizine eklenmedi" sayısı düşüyor mu (taban: 424
  sayfanın ~3'ü indeksli, 2026-08-06).

### B.5 Bekleyenler (kapanınca buradan silinecek)

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
- [ ] **liza@ kutusunda eski mailler görünmüyor** — önce webmail'den bak: eski
  mailler orada VARSA istemcinin senkronizasyon penceresi ("son X gün" yerine
  "tümü"), YOKSA hesap bir cihazda POP3 olarak kurulmuş ve mailleri sunucudan
  çekmiş demektir.
- [ ] 4 CalDAV/CardDAV SRV kaydı → `cpanel.servosteel.com.tr`

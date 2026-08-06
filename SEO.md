# Servosteel — SEO ve Pazarlama

**Tek kaynak.** Daha önce altı ayrı rapor vardı (rakip analizi, pazar analizi, dijital
plan, fuar planı, teknik denetim, eski site arşivi); tamamlanan işler ve eskiyen
tahminler ayıklanıp bu dosyada birleştirildi.

**Son güncelleme:** 2026-08-06

---

## 1. Nerede duruyoruz — ölçüm, tahmin değil

Site 2026 Ağustos başında WordPress'ten Next.js'e taşındı. Google'ın taşınmayı
sindirmesi haftalar sürer; aşağıdaki tablo o sürecin **başlangıç noktasıdır**,
başarısızlık değil.

### Search Console, son 28 gün

```
42 tık · 575 gösterim · ortalama sıra 16,2
```

| ülke | tık | gösterim | ort. sıra |
|---|---:|---:|---:|
| Türkiye | 36 | 239 | 10,1 |
| İngiltere | **0** | 101 | 15,3 |
| ABD | **0** | 75 | 28,8 |
| Hindistan | 0 | 36 | 18,3 |

Tıkların %86'sı Türkiye'den ve neredeyse tamamı **marka araması**. İngiltere ve
ABD'den 176 gösterim geliyor ama tık sıfır — 15.–29. sıradayız, yani 2.–3. sayfa.

### İlk sayfada gerçekte ne var

GSC 14 kelime için "ilk sayfa" diyor ama **12'sinin gösterimi 1**. Bir kişinin
bir kez aradığı terimde çıkmak sıralama değil, gürültü. Rapora yazılmaz.

| kelime | sıra | gösterim |
|---|---:|---:|
| **servosteel** | 4,7 | **78** |
| servostal | 10,5 | 2 |
| diğer 12 terim | 1–9 | **hepsi 1** |

Canlı SERP kontrolünde markada **1. sıradayız** (GSC'nin 4,7'si geçiş dönemini de
içeren 28 günlük ortalama). Yani gerçekten sıralandığımız tek şey kendi adımız.

### Vuruş mesafesi — 2. sayfa

| sıra | gösterim | kelime |
|---:|---:|---|
| 13,2 | 53 | servo steel *(marka varyantı)* |
| 15,8 | 8 | solar panel production line |
| 16,7 | 6 | automated roll forming production line |
| 15,2 | 4 | automated roll forming line machine |
| 12,5 | 2 | slitting line |

### İndeksleme — asıl darboğaz

Sitemap sorunsuz (414 URL, 0 hata, gönderildi ve indirildi), robots.txt tamamen
açık. Ama URL denetiminde 12 temsili sayfadan:

- **3'ü indeksli** · 2'si "keşfedildi, indekslenmedi" · **7'si Google'da hiç yok**

Son 7 günde yeni sitenin **hiçbir** sayfası gösterim almadı; sıralamada duran her
şey hâlâ eski WordPress adresi. Teknik engel yok — Google henüz gelmedi.

**Yapıldı:** IndexNow kuruldu, 414 URL Bing + Yandex'e iletildi (`npm run indexnow`).
Google'da böyle bir kısayol yok, orada beklemek zorundayız.

### Marka adımızı kendimizle bölüyoruz

"servosteel" aramasında 1. sırayız ama altımızdaki sıralar **kendi terk edilmiş
mülklerimiz**:

| sıra | site | durum |
|---:|---|---|
| 4 | `servosteel.wixsite.com` | ayakta, içinde rulo/pres geçiyor |
| 5 | `www.servosteel.com` | ayrı alan adı, ayakta |
| 8 | `servosteel.blogspot.com` | ayakta |

`tr.servosteel.com.tr` ile aynı problemdi, o 301'lendi. Bu üçü hâlâ duruyor.
Kapatılıp yönlendirilirlerse o sıralar kendi alt sayfalarımıza kalır.

---

## 2. Kelime gerçeği — ve 11 tuzak

**Kural:** Hacim gördüğün hiçbir terimi SERP'ine bakmadan rakam olarak sunma.
Aşağıdaki 11 terim toplam ~52.000 arama taşıyor ve hepsi tuzak. Bir raporda
"hedef kelime" diye görünselerdi kazanç sanılırlardı.

| terim | hacim | gerçekte aranan |
|---|---:|---|
| sac kesme makinesi | 6.600 | **saç** kesme makinesi |
| trapez sac | 12.100 | sacın kendisi, makine değil |
| coil car | 5.400 | araba ateşleme bobini |
| haspel | 4.400 | yün sarma |
| hasítógép (HU) | 1.900 | odun yarma |
| dilme makinesi | 1.600 | salam dilimleme |
| профилегибочный станок (RU) | 1.478 | el tipi büküm aleti |
| stacker machine | 480 | forklift |
| poprzecznica (PL) | 390 | anatomi terimi |
| servo sürücü | 320 | sürücü elektroniği |
| spianatrice (IT) | 210 | ahşap planya |
| solar panel production line | 70 | fotovoltaik panel montaj hattı |
| doğrultma makinesi | 50 | **tel** ve çubuk doğrultma |
| kablo kanalı makinesi | 20 | **PVC ekstruder** (ve tıkanıklık açma) |

Son üçü başlık çalışmasında yakalandı — üçü de en yüksek hacimli adaylardı ve
SERP'e bakılmasa "kazanç" diye rapora girerlerdi.

Bu liste aynı zamanda **hazır negatif kelime listesidir** — reklam verilecekse
ilk gün eklenmeli.

### Türkçe: hacim nerede, nerede değil

Türkiye tıklarımızın %86'sını veriyor, o yüzden ayrıca ölçüldü.

| terim | hacim | rekabet | not |
|---|---:|---|---|
| **rollform makinesi** | **590** | orta | bitişik yazım; sitede 7'ye 75 yanlış taraftaydı |
| **trapez sac makinesi** | **480** | **düşük** | SERP zayıf: ilk 5'in üçü pazaryeri/dizin |
| roll form makinesi | 320 | orta | ayrı yazım |
| rulo açıcı / açıcılar | 140 | orta | **7. sıradayız** — 1. sayfaya en yakın olduğumuz kelime |
| sac dilme hattı | 30 | orta | "rulo dilme hattı" yalnızca 10 |
| pres besleme sistemleri | 20 | orta | SERP'i birebir rakip listemiz |
| **boy kesme** (6 varyant) | **0** | — | tutarlı sıfır; Türkiye'de aramayla satılmıyor |

⚠️ **Trapez'in 480'i tam olarak bizim değil.** İlgili aramalar ikinci el
ağırlıklı: "2 el", "sahibinden", "ikinci el", "satılık", "Mini Trapez".
Nitelikli kısmı belki %30-40'ı. Yine de en iyi Türkçe fırsatımız, çünkü SERP
zayıf ve fiyat arayan da sonuçta alıcı.

### Rusya: Google'ın gizlediği pazar

DataForSEO (Kazakistan üzerinden) Rusça için 150/ay diyordu. Yandex Wordstat
sadece örneklenen terimlerde **~1.750** gösterdi. Rusya, sandığımızdan büyük ve
3. sıradaki pazar.

**Kritik davranış farkı:** Rus alıcı makine kategorisiyle değil **son ürünle**
arıyor.

| terim | hacim |
|---|---:|
| станок для профнастила | 401 |
| станок для металлочерепицы | 109 |
| профилегибочная линия | **0** |

Rusça meta başlıklar buna göre düzeltildi (bkz. git geçmişi).

### Sayfası olmayan ama hacmi olan ürünler

| ürün | hacim | dil |
|---|---:|---|
| gutter roll forming machine | 280 | EN |
| roof panel roll forming | 150 | EN |
| portable roll forming machine | 140 | EN |
| станок для металлочерепицы | 109 | RU |

Firmadan "yapıyor muyuz" cevabı bekliyor (bkz. bölüm 5).

---

## 3. Rakipler

### Türk rakipler — teklif masasında karşılaştıklarımız

| firma | site | not |
|---|---|---|
| **AGMLine / Sacform** | [agmline.com](https://agmline.com/) · [sacform.com](https://sacform.com/) | **Aynı firma, iki domain.** En yakın rakip: ürün örtüşmesi ~%100, aktif içerik pazarlaması (~10+ teknik yazı), Avrupa fuarlarına gidiyor. Zayıf: 2 dil, spec tablosu yok |
| **Coiltech** | [coiltech.com.tr](https://coiltech.com.tr) | Pres beslemede en doğrudan rakip; "Avrupa'nın en büyüğü" konumlanması, ~70 ülke iddiası |
| **EAE Machinery** | [eaemachinery.com](https://www.eaemachinery.com/) | 1996'dan beri; **TR/EN/RU** — Rusça'sı var, BDT avantajımızı kısmen dengeliyor. Zayıf: teklif formu bile yok |
| **Etcoma** | [etcoma.com.tr](https://www.etcoma.com.tr/) | Farklı segment (rollform tasarım + kalıp). ⭐ **30+ müşteri logosu: Bosch, Renault, Tofaş, Faurecia** — bizdeki en büyük eksik |
| Akdeniz San. Mak. | [akdenizsanayimakinalari.com](https://akdenizsanayimakinalari.com/) | Ürün listesi bizimle birebir; hero başlığı bile yok |
| Hermak · Rollser · Tunaboylu · Rollform Machine | — | Türkçe aramada görünen diğerleri; Rollser'in blogu var ve üst sıralarda |

**Dizin sitesi rakip gibi davranıyor:** [makinaturkiye.com](https://www.makinaturkiye.com/roll-form-makinalari-firmalari-sc-104981)
Türkçe head kelimede 1 numara. Kayıt bedava.

### Çin — arama sonuçlarındaki asıl rakip

Teklif masasında görülmezler ama SERP'i tutarlar: Kingreal, Lotos, Sunway, Faith
Machinery, Yingyee, SunRui (pres beslemede 8 sonucun 5'i), Beli, Sihua, Patech,
XHH, Raintech.

**Kazanma formülleri teknik değil, üç içerik taktiği:**

1. **Kelime başına ayrı sayfa** — jenerik "roll form hatları" yerine 20+ hedefli URL
2. **"Ultimate Guide" / "Top 10" uzun içerik** — hem head hem niş kelimeyi aynı anda yakalıyor
3. **Eğitici içerik ticari kelimeyi kapıyor** — "What is the cut to length process?" yazısı "cut to length line manufacturer" aramasında çıkıyor

Üçü de kopyalanabilir ve bizde altyapısı hazır.

### Batı premium — fiyatta değil itibarda rakip

Dallan (IT), Fagor Arrasate (ES), Red Bud · Braner · Rowe · Delta Steel ·
Formtek (US), Schuler · Dreistern (DE), Gasparini (IT).

### Konumlandırma

```
   FİYAT
   yüksek │  [Batı Premium]  ← itibar, ama pahalı
          │        ★ SERVOSTEEL
          │          Çin'den kaliteli, Batı'dan uygun + esnek + hızlı
          │  [Türk rakipler] ← aynı bölge; farkı DİJİTAL + KANIT yaratır
   düşük  │  [Çin] ← ucuz, kalite/servis algısı zayıf
          └─────────────────────────────
             düşük      KALİTE/GÜVEN      yüksek
```

⚠️ Bu konumlandırma **varsayım.** Gerçek rakip ve fiyat konumu firmadan
teyit edilmeli (bölüm 5).

### Doğrulanmış üstünlüklerimiz

| üstünlük | rakip durumu |
|---|---|
| **9 dil** | Rakipler 2–3 dil. **Arapça hiçbirinde yok**, ES/IT/HU/PL de yok |
| **Gerçek spec tabloları** | İncelenen hiçbir Türk rakipte sayısal tablo yok — hepsi pazarlama metni |
| **~109 saha videosu** | Sayı tek başına ayırt edici değil (EAE'de ~113 olabilir); fark **kullanımda** — her ürün sayfasına gömülü |
| **llms.txt + AI botlarına açık robots** | Sektörde neredeyse yok — erken hareket avantajı |
| **Teklif formu + WhatsApp** | EAE ve Etcoma'da teklif formu bile yok |

### Kapatılması gereken açığımız

**Müşteri logosu yok.** Etcoma Bosch/Renault/Tofaş/Faurecia gösteriyor. Bizde
Sarıgözoğlu + Mega Solar kodda hazır ama **yayın kilidi kapalı** (izin bekliyor);
SMT Enerji ve Astor'un logosu hiç yok.

---

## 4. Ne yapılacak — öncelik sırası

### Şimdi, engel yok

- [ ] **`servosteel.wixsite.com` · `servosteel.blogspot.com` · `www.servosteel.com`** — kapat ya da 301'le
- [ ] **Sektör dizinlerine kayıt** — bunlar zaten bizim kelimelerimizde sıralanıyor, otoriteleri hazır:
      makinaturkiye · Europages · IndustryStock · **DirectIndustry** ("cut-to-length cutting line" aramasında üst sırada)
- [ ] **Google İşletme Profili** (Sancaktepe) — "servosteel" en çok tık alan kelimemiz, profil o aramanın sağ tarafını komple verir
- [ ] **Bing Webmaster** kaydı — asıl kazanç Yandex tarafını hızlandırmak ve AI aramaların beslendiği indekse girmek
- [ ] **Mevcut ajansın link inşasını durdur** — 2010'ların yöntemi, zarar veriyor

### Firmadan cevap gelince

- [ ] **13 ürün sayfasına teknik tablo** — en çok trafiği bu açar (bkz. bölüm 5.3)
- [ ] Ticari şartlar yazısı, 9 dil — rakiplerin **hiçbirinin** yayınlamadığı bilgi
- [ ] Hacmi olan 4 yeni ürün sayfası
- [ ] Referans logolarını yayına aç

### Sürekli

- [ ] **Akademi'yi ritme bağla** — 2 haftada 1 yazı. Çin'in kazandığı format: "nasıl seçilir" + "Ultimate Guide"
- [ ] Her ürün sayfasına ilgili **çalışan hat videosu** — alıcının %70'i video izliyor
- [ ] YouTube başlıklarını hedef kelimeyle yaz, açıklamaya ürün sayfası linki

### Akademi

**Yayında (9 dil):** rulo dilme hattı nasıl seçilir · boy kesme hattı nasıl
seçilir · servo besleyici nasıl seçilir · progresif kalıp & servo besleyici ·
rulo dilme hattı maliyeti · rulo ağırlığı ve uzunluğu hesabı · sac fire oranını
düşürmek · solar profil hattı yatırım geri dönüşü · rulo hattı nereden alınmalı

**Yayında (yalnızca TR):** roll form nedir — `rollform nedir` 70/ay +
`roll form nedir` 20 + `roll form makinesi nedir` 20 + `soğuk şekillendirme` 50,
dördü de düşük rekabet. İngilizce'ye çevrilmedi çünkü oradaki karşılıkları
10-30/ay ve rekabet yüksek.

**Sıradakiler:**
- Roll Form Hattı Satın Alma Rehberi (bütçe, teslim, merdane ömrü)
- Kablo Kanalı Hattı: delikli/deliksiz, tava/kapak farkları
- Rulo Açıcı Seçimi: hidrolik mi mekanik mi? *(sayfası 7. sırada, destek ister)*
- CE uyumu ve hat güvenliği: ihracat için ne gerekir
- Devreye alma süreci: fabrika testinden sahaya
- Yedek parça ve uzaktan destek: duruş maliyetini düşürmek

> Not: "Dilme mi boy kesme mi" ayrı yazı olarak gerekmiyor —
> `/karsilastirma/dilme-vs-boy-kesme` sayfası zaten var.

### Reklam — mantıklı ama sırayla

SEO'nun ticari kelimelerde sonuç vermesi aylar alır; reklam yarın talep getirir.
Tek satış milyonları bulduğu için küçük bütçe bile geri döner.

**Ön koşullar:** GA4 mülk numarası (ölçüm yoksa körlemesine harcama) ·
negatif kelime listesi (bölüm 2) · **sadece spec tablosu dolu 4 sayfaya** reklam
(rulo açıcılar, servo sürücüler, doğrultmalı servo sürücüler, kompakt hatlar) —
spec göremeyen ziyaretçide tıklama boşa gider.

Rusya için **Yandex Direct**, Google değil.

### Yapmayacaklarımız

- ❌ Takipçi peşinde koşmak — 50.000 alakasız takipçi, 200 doğru mühendisten değersiz
- ❌ Ölçüm kurmadan reklam vermek
- ❌ Spec uydurmak — yanlış spec kaybedilen ihaleden pahalı
- ❌ Makine çevirisiyle dil eklemek — kötü Arapça, Arapça olmamaktan kötü

---

## 5. Firmadan bekleyenler

Tam soru listesi: `filiz-hanima-sorular.md` (proje dışında, scratchpad'de).
Özet:

### 5.1 Ticari şartlar — en yüksek getirili

Teslim süresi · garanti kapsamı · ödeme koşulları · FAT prosedürü.
**Çinli rakiplerin hiçbiri bunları yayınlamıyor.** Alıcının en çok merak ettiği
ama cevabını bulamadığı şey; 9 dilde bir içerik açar.

### 5.2 Sitede duran çelişkiler

| konu | durum |
|---|---|
| **Mekanik açıcı üst kapasitesi** | Başlıkta "500–4.000 kg", açıklamada "500–2.500 kg" — 9 dilde. **Eski site de tutarsızdı:** metinde 500–4.000 kg yazıyor ama model listesi 500/750/1500/2500 kg diyor |
| **Çalışma saati** | Eski site 08:00–18:00, yeni site 08:30–18:00 |
| **Kadro sayısı** | Eski site "20+ saha personeli", yeni site "27+ uzman kadro" |
| **ISO 27001** | Eski site iddia ediyordu, yeni sitede yok. Geçerliyse eklenebilir |
| **Servo besleyici ±0,1 mm** | Akademi yazısı bu değeri veriyor ama tablo yalnızca kompakt hatta gösteriyor. Servo sürücü için de geçerli mi? |

### 5.3 13 ürün sayfasında teknik tablo yok

Alıcı makineyi ürün adıyla değil **ölçüyle** arıyor. Çinli rakiplerin hepsi tam
tablo yayınlıyor.

| tablosu VAR | tablosu YOK |
|---|---|
| rulo açıcılar · servo sürücüler · doğrultmalı servo sürücüler · kompakt hatlar | **8 roll-form hattının tamamı** · otomatik istifleyici · dilme · boy kesme · hub |

Her roll-form hattı için gereken 8 değer: kalınlık · genişlik · hat hızı ·
istasyon sayısı · kesme tipi (hidrolik giyotin / uçan makas) · motor gücü ·
PLC markası · çalışılan malzeme (galvaniz/PPGI/paslanmaz/alüminyum).

### 5.4 Strateji

**Gerçek rakipler kimler** (SERP'te çıkan ≠ işi kaptığımız) · **hangi pazar ciro
yapıyor** (9 dile eşit emek veriyoruz, pazarlar eşit değil) · kuruluş yılı ·
teslim edilen makine sayısı · ServoMold'un durumu.

### 5.5 Görsel ve izin

Otomatik istifleyici ve trapez/cephe paneli sayfalarında **hiç fotoğraf yok**
(arşivdeki 175 görselin hepsi tarandı) · 4 referans firmanın logosu ve izni.

---

## 6. Kanallar

### Alıcı davranışı — neden site "tanıtım" değil satıcı

| gerçek | kaynak |
|---|---|
| Sanayi alıcılarının **%77'si** tedarikçiyle temastan önce internette araştırıyor | [Konstruct Digital](https://www.konstructdigital.com/digital-marketing/industrial-marketing-trends/) |
| Araştırmanın **%60–80'i** tedarikçiyle konuşulmadan tamamlanıyor | [Optimum7](https://www.optimum7.com/blog/b2b-marketing-guide-for-industrial-companies.html) |
| **%57'si** ilk görüşmeden önce tedarikçisini seçmiş oluyor | aynı |
| B2B alıcılarının **%70'i** araştırmada tedarikçi videosu izliyor | aynı |
| Ortalama imalat satış döngüsü **130 gün**, karar komitesi **6,3 kişi** | [SellersCommerce](https://www.sellerscommerce.com/blog/b2b-marketing-statistics/) |

Görünmediğimiz her arama, haberimiz olmadan kaybedilen bir ihale.

### Portallar — başkasının hazır otoritesine binmek

| portal | not |
|---|---|
| **Europages** | ~2,3 M iş müşterisi/ay, 210 ülke, 26 dil |
| **IndustryStock** | Kitlenin %76'sı Avrupa |
| **DirectIndustry** | ⭐ "cut-to-length cutting line" aramasında Google'da üst sırada |
| **makinaturkiye.com** | ⭐ Türkçe head kelimede 1 numara, kayıt bedava |
| Alibaba / Made-in-China | ⚠️ Çinli rakiplerin sahası, fiyat karşılaştırmasına girersin |

<sub>Portal erişim sayıları platformların kendi beyanı, bağımsız doğrulanmadı.</sub>

### Ölçüm — neye bakacağız

**Asıl KPI trafik değil, teklif (RFQ) sayısı.** Yanında: RFQ'ların ülke dağılımı ·
kelime bazlı gösterim/pozisyon (GSC) · hangi dil trafik getiriyor · ürün sayfası →
teklif dönüşümü · AI aramada görünürlük (ayda 1 elle test).

---

## 7. Fuar takvimi

| fuar | tarih | yer | öncelik |
|---|---|---|:---:|
| **FABEX / Metal & Steel Saudi Arabia** | **11–14 Ekim 2026** | Riyad | ★★★ |
| **EuroBLECH** | 20–23 Ekim 2026 | Hannover | ★★★ |
| Blechexpo | 26–29 Ekim 2027 | Stuttgart | ★★☆ |
| Metal & Steel Egypt | 4–6 Eylül 2027 | Kahire | ★★☆ |

⚠️ **Takvim çatışması:** FABEX ile EuroBLECH aynı ay, bir hafta arayla. Tek seçim
yapılacaksa: satış hacmi için FABEX, marka + Avrupa bayi ağı için EuroBLECH.

Fuar tek başına zayıf kanal. Bağlanması gerekenler: fuar öncesi randevu daveti +
standda **QR → teklif formu** (kartvizitten çok daha izlenebilir) + ilk 72 saatte
otomatik takip.

Fuar katılımcı listeleri ayrıca **kalıcı backlink** verir — geçmiş fuarların
listeleri de toplanmalı.

---

## EK A — Eski WordPress sitesinin arşivi

Eski site kapatılmadan önce çıkarıldı. **Buradaki spec değerleri yayına almadan
önce mühendislikle doğrulanmalı** — ama yeni sitedeki tahmini sayılarla
çelişiyorsa, gerçek olan bunlardır.

Eski site **tamamen İngilizceydi**, tek dilli. Mevcut Google sıralamalarımızın
İngilizce sorgularda olmasının sebebi bu.

### Şirket bilgileri (NAP — birebir korunmalı)

- **Adres:** Yunusemre dst, Iskenderpasha Ave 21/1, Sancaktepe, İstanbul
- **Telefon:** (+90) 216-415-30-05 · **Faks:** (+90) 216-4153006
- **E-posta:** info@servosteel.com.tr
- **Çalışma saatleri:** Pzt–Cum 08:00–18:00 ⚠️ *(yeni sitede 08:30 — teyit edilecek)*
- **Google Maps:** https://maps.app.goo.gl/sL6kJhmJ2aLEtKA96

### Gerçek teknik spec'ler

**Servo Sürücüler:** kalınlık 0,4–4,0 mm · 2 besleme silindiri Ø85 mm ·
serbest hız 35 m/dk · genişlik ≤1600 mm · 7" dokunmatik · 250 kalıp hafızası

**Doğrultmalı Servo Sürücüler:** şerit ≤1600 mm · kalınlık 0,5–4 mm ·
7/9/11/13 mandrel · 250 hafıza · Schneider renkli LCD

**Kompakt Hatlar** *(en zengin tablo)*: 3 konfigürasyon · genişlik 40–1300 mm ·
kalınlık 0,5–4 mm · serbest hız 40 m/dk · **besleme hassasiyeti −0,1 mm** ·
rulo 2500–10000 kg · iç çap 450–560 mm · dış çap 1300–1600 mm ·
besleme silindiri 2+2 · doğrultma silindiri 5 × Ø85 mm

**Rulo Dilme Hatları:** kapasite kademeleri 1.500 / 2.500 / 3.000 / 4.000 /
6.000 / 8.000 / 10.000 / 15.000 kg · kalınlık kademeleri 0,5–1 / 0,5–2 /
0,8–3 / 1,0–5 mm · bileşenler: açıcı, yükleme arabası, otomatik gönye, rulo
doğrultucu, otomatik besleyici, dilme ünitesi, otomatik boşaltıcı, sarma sistemi

**Mekanik Açıcılar:** rulo 500–4.000 kg ⚠️ · genişlik 30–500 mm · dış çap
1.600 mm · iç çap 300 mm · mekanik mandrel
*(⚠️ model listesi 500/750/1500/2500 kg diyor — eski site kendi içinde tutarsız)*

**Hidrolik Açıcılar (6 ton örnek):** 6.000 kg · genişlik 80–1000 mm ·
dış 1600 mm · iç 450–560 mm · hidrolik mandrel · Schneider PLC · çift yönlü

**Boy Kesme Hattı:** bileşenler: açıcı, doğrultucu, yükleme arabası, besleyici,
giyotin, istifleme, PVC yapıştırma · Schneider Lexium/Altivar · *sayısal spec yok*

**Roll Form Hattı:** 2 × 11 kW motor-redüktör · tüm silindirler **4140 çelik
(58–60 HRC)** · Schneider Lexium + Altivar

**Model dizilimi:** hidrolik 6/8/10/12/15/20 ton · mekanik 500/750/1500/2500 kg

### Kredibilite figürleri (eski site beyanı — teyit edilmeli)

"48+ ülke" · %99 zamanında teslim · %99 QC · **ISO 27001** · 10+ yıl ·
**20+ saha personeli** *(yeni sitede 27+ uzman kadro)*

---

## EK B — Teknik denetimden kalanlar

Demo aşamasında yapılan denetimde 1 kritik + 3 yüksek + 5 orta sorun bulundu;
kritik ve yüksek olanların tamamı düzeltildi ve site canlıya çıktı. Kalanlar:

**Orta**
- `alt.mp4` 17,9 MB. Yükleme stratejisi zaten doğru (lazy + `preload="none"`).
  Yeniden kodlama denendi, kazanç çıkmadı — boyutun sebebi **49 saniyelik süre**.
  Gerçek kaldıraç süreyi kısaltmak; bu bir içerik kararı.
- 53 KB kullanılmayan JS + gereksiz `Array.prototype.at` polyfill (13,7 KB)
- Ölü bağımlılıklar: `@phosphor-icons/react`, `@radix-ui/react-dialog`

**Düşük**
- Kısa başlıklar: `/iletisim` 21, `/videolar` 21, `/teklif-al` 22 karakter
- `logo-full.png` → SVG (%54 kazanç)
- Video dosyalarında `Cache-Control` 4 saat → parmak izli adla 1 yıl olabilir
- Üçüncü taraf otorite sinyali yok (`sameAs` tamamen kendi hesaplarımız) —
  Wikidata + sektör dizinleri

**Altyapı işleri (SEO dışı)**
- 4 CalDAV/CardDAV SRV kaydı hâlâ köke bakıyor (artık Dokploy, 2079/2080 portu
  yok) → `cpanel.servosteel.com.tr`'ye çevrilmeli
- cPanel'de `filtre1` duruyor: konusunda "spam" geçen mail sessizce siliniyor
- `info@` adresine gelen mailler SMTP seviyesinde reddediliyor (10 günde 433
  kayıt) — muhtemelen müşteri talebi kaybediliyor

# Servosteel — SEO ve Pazarlama

**Tek kaynak.** Daha önce altı ayrı rapor vardı (rakip analizi, pazar analizi, dijital
plan, fuar planı, teknik denetim, eski site arşivi); tamamlanan işler ve eskiyen
tahminler ayıklanıp bu dosyada birleştirildi.

**Son güncelleme:** 2026-08-08

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

### İndeksleme — darboğaz, ama açılıyor

Sitemap sorunsuz (416 URL, 0 hata), robots.txt tamamen açık. Teknik engel yok;
Google kendi hızında geliyor ve **iki günde gözle görülür ilerledi**:

| URL denetimi (12 temsili sayfa) | 6 Ağu | 8 Ağu |
|---|---:|---:|
| indekslenmiş | 3 | **7** |
| keşfedildi, indekslenmedi | 2 | **0** |
| Google'ın haberi yok | 7 | 5 |

6-7 Ağustos'ta taranıp indekslenenler: `/makineler`, `/makineler/rulo-acicilar`,
`/en/coil-slitting-lines`, `/en/roll-forming-lines`.

⚠️ **Ama trafik hâlâ eskiden akıyor.** Son 7 günde sitemap'teki 416 sayfadan
yalnızca **2'si** gösterim aldı (ana sayfa 107, `/en/…/solar-panel-profile` 2);
buna karşılık eski WordPress adresleri **51 sayfa, 360 gösterim, 20 tık**. Yani
301'ler taşıyor — bozulmamaları kritik, `npm run kontrol` her deployda bakıyor.

**Yapıldı:** IndexNow kuruldu; 416 URL Bing + Yandex'e iletildi
(`npm run indexnow`). Google'da böyle bir kısayol yok, orada beklenecek.

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

## 2. Kelime gerçeği — ve 16 tuzak

**Kural:** Hacim gördüğün hiçbir terimi SERP'ine bakmadan rakam olarak sunma.
Aşağıdaki 16 terim toplam ~53.000 arama taşıyor ve hepsi tuzak. Bir raporda
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
| perfiladora (ES) | 210 | **kozmetik** — kaş/kontur ve saç kesme makinesi |
| profiliermaschine (DE) | 210 | çatı/kenet paneli makinesi — portatif segment |
| maszyna do profilowania blachy (PL) | 590 | **bulmaca** — krzyżówka siteleri |
| walcowanie profili (PL) | 140 | profil **büküm hizmeti**, makine değil |
| profilarka do blachy (PL) | 170 | çatıcı/portatif (Schlebach, Jouanel, WUKO) |

Son sekizi başlık çalışmasında yakalandı. Hepsi kendi dilindeki en yüksek
hacimli adaylardı — SERP'e bakılmasa "kazanç" diye rapora girerlerdi.

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

### Diğer diller: hub sayfalarının tamamı yanlış terimdeydi

İngilizce ve Türkçe'de bulunan hata (aranan şey "hat" değil **makine**) dört
dilde daha çıktı. Üçü düzeltildi, Lehçe'de kullanılabilir terim bulunamadı.

| dil | eski (hacim) | yeni (hacim) | durum |
|---|---|---|---|
| DE | Rollformanlage (20) | **Rollformmaschine** (110) | ✅ değişti |
| IT | Linea di profilatura (10) | **Profilatrice** (140) | ✅ değişti |
| ES | Línea de perfilado (0) | **Perfiladora de chapa** (30) | ✅ değişti |
| PL | Linia profilująca (0) | — | ❌ **temiz terim yok** |

ES'de baş terim `perfiladora` 210/ay ama kozmetik; "de chapa" nitelemesi şart.
PL'de dört aday da elendi (yukarıdaki tuzak tablosuna bakın) — Lehçe dilme ve
boy kesme başlıkları doğru, yalnızca hub'a uygun terim yok.

### Dil ≠ pazar: Arapça ve Macarca'da talep yok

Rakip denetimi "18 rakibin hiçbirinde Arapça yok" diyordu ve bu, MENA'nın boş
arazi olduğu sonucuna götürülmüştü. **Yarısı yanlış.** Rakip yok, ama talep de
Arapça değil — MENA alıcısı **İngilizce arıyor**.

| pazar | yerel dilde | İngilizce'de |
|---|---:|---:|
| Suudi Arabistan | ~40/ay | **100**/ay |
| BAE | — | **130**/ay |
| Mısır | — | **90**/ay |
| Macaristan | ~0 | **60**/ay |

Arapça'da en yüksek terim 10/ay (`ماكينة تشكيل المعادن`). Macarca'da tek yüksek
rakam `hasítógép` 1.900 — o da zaten tuzak listesinde (odun yarma).

**Sonuç:** AR ve HU sayfalarında değiştirilecek başlık yok, çünkü hedeflenecek
hacim yok. O sayfalar ziyaretçi geldiğinde güven ve dönüşüm için değerli, arama
trafiği için değil. **MENA stratejisi İngilizce sayfalardır** — ve İngilizce tam
olarak 176 gösterim alıp sıfır tık aldığımız yer. İngilizce içeriğe yatırım,
aynı anda MENA'ya da yatırım demek.

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

## 3. Rakipler — dünya kütüğü

**Yöntem (2026-08-07):** 6 pazarda 12 ticari sorgu için canlı SERP çekildi
(ABD/EN, DE, ES, IT, PL, TR — ham veri: oturum scratchpad `dunya-serp.json`),
9 rakibin organik gücü Labs API ile ölçüldü, 20 rakip sitesinin ana sayfası
müşteri-bulma özellikleri için tek tek denetlendi (`rakip-ozellik.json`).
Rusya için Google verisi yok ve **Yandex SERP API planımızda kapalı** — RU
rakip listesi çıkarılamadı, elimizde yalnızca Wordstat hacimleri var.

### 3.1 Dijital güç — ölçüldü, tahmin değil

Labs `ranked_keywords`: kaç kelimede sıralanıyor + tahmini aylık organik trafik.

| domain | pazar | kelime | trafik/ay |
|---|:---:|---:|---:|
| us.cidanmachinery.com | US | 112 | **1.216** |
| dallan.com | US | 104 | 273 |
| lotosforming.com | US | 190 | 240 |
| kingreal.org | US | 74 | 105 |
| athader.com | US | 25 | 93 |
| swforming.com (Sunway) | US | 136 | 71 |
| agmline.com | TR | 6 | 60 |
| **servosteel.com.tr** | TR | **3** | **~100 (marka)** |
| coiltech.com.tr | TR | 3 | 1 |
| toncelik.com | TR | 3 | 1 |

İki çıkarım: **(1)** Türk rakiplerin tamamı dijitalde zayıf — ev sahasında
kimse kaleyi tutmuyor. **(2)** Küresel kazananlar üretim deviyle değil içerik
disipliniyle kazanıyor (Lotos 190 kelime, CIDAN 1.216 trafik).

### 3.2 Türkiye

| firma | site | not |
|---|---|---|
| **AGMLine / Sacform** | agmline.com · sacform.com | Aynı firma, iki domain. En yakın rakip; aktif blog; TR'de 60 trafikle en güçlü yerli |
| **Coiltech** | coiltech.com.tr | Pres beslemede en doğrudan rakip; "Avrupa'nın en büyüğü" iddiası; **ABD SERP'ine YouTube videosuyla giriyor** ama sitesi 3 kelime/1 trafik |
| **Bosporas** | bosporas.com | ✅ doğrulandı: "pres besleme sistemleri"nde TR 1. sıra; katalog+bülten+fuar sayfası var |
| EAE Machinery | eaemachinery.com | 1996'dan beri; TR/EN/RU; teklif formu yok |
| Etcoma | etcoma.com.tr | Rollform tasarım+kalıp; 30+ müşteri logosu (Bosch, Renault, Tofaş, Faurecia) |
| Akdeniz Sanayi Mak. | akdenizsanayimakinalari.com | Ürün listesi bizimle birebir; "rulo dilme hattı" TR 2. sıra |
| Hermak | hermak.com.tr | Dilme/boy kesme/rollform; TR 4. sıra |
| Rollser | rollser.com | Blog'u var, "rollform makinesi"nde üstte |
| Tunaboylu | tunaboylumakine.com.tr | Rollform + pres besleme |
| **Ton Çelik** | toncelik.com | Yeni tespit: "rulo dilme hattı" TR 7-8. sıra; WhatsApp+katalog var |
| HKTM | hktm.com.tr | Kesme-dilme sistemleri; TR 5. sıra |
| Köprü Metal | koprumetal.com | Dilme + boy kesme |
| Ayba Makina | aybamakina.com | "sac dilme hattı" TR 1. sıra |
| Haskar Metal | haskarmetal.com.tr | Rulo sac dilme imalatı |
| Güngörmak | gungormak.com.tr | Trapez hattı; başlığında telefon yazacak kadar amatör ama 4. sırada |
| Dönem Makina | donemmakina.com | Trapez üretim hattı |
| YCS Makine | ycsmakine.com | "Roll form nedir" içeriğiyle sıralanıyor |
| Teotech | teotechrollform.com | Rollform; eğitici içerik |
| Rollx | rollformmakinalari.com | Rollform imalat |
| Demetal | demetal.com | Rollform makineleri |
| Çağdaş Makina | cagdasmakina.net | Kompakt sürücüler / pres besleme |
| Mekanikel | mekanikel.com | Pres besleme TR 2. sıra |
| ⚠️ doğrulanmadı | — | SEAS, Rolline, Rolltürk, Magafi (dizin olabilir), Supreme Engineering (SK) |

### 3.3 Çin — arama sonuçlarının asıl sahibi

| firma | site | güç |
|---|---|---|
| **Lotos** (Wuxi) | lotosforming.com · lotosslitting.com | ABD'de 190 kelime; "cable tray roll forming machine" **1. sıra**; canlı chat + bülten + fuar |
| **Kingreal** | kingreal.org | Eğitici yazısı "cut to length line" ticari sorgusunda **iki kez** ilk sayfada |
| **Sunway** | swforming.com | "Ultimate Guide" formatının şampiyonu; 136 kelime |
| **Beli** | belirollforming.com | ⭐ Özellik denetiminde 9/9 — WhatsApp, chat, katalog, referans, sertifika, video, bülten, fuar, çok dil. **Kopyalanacak şablon bu** |
| SunRui | sz-sunrui.com | Pres besleme kümesini tek başına tutuyor (8 sonucun 5'i) |
| Faith Machinery | faith-machinery.com | "2026 Ranking" listicle'ları |
| Yingyee | yingyeemachinery.com | Kablo kanalı |
| JSR Rollformer | jsrrollformer.com | "What is..." eğitici formatı, kablo kanalında 5. |
| Metoform | metoform.com | Aynı format, 8. |
| He-machine · Henli · Huagong (decoiler.cn) · Technic | he-machine.com vb. | "decoiler straightener feeder" ilk 5'i bunlar |
| Tengdi | tengdimachine.com | ES ve ABD'de eğitici içerik |
| Linbay · Alekvs · KI (roll-forming-line.com) | — | DE/PL SERP'lerine Almanca/Lehçe çeviri sayfalarla giriyorlar |
| Raintech · XHH · Sihua · Superda · Patech · HOPEX⚠️ | — | Önceki turdan; Patech "Top 10" listicle'ı hâlâ üstte |

### 3.4 Batı — premium ve bölgesel

| firma | ülke | not |
|---|---|---|
| **CIDAN Machinery** | SE/US | Yeni tespit; ABD'de 1.216 trafikle ölçülen en güçlü rakip; hem rollform hem CTL SERP'inde |
| **Athader** | ES | Yeni tespit; ES dilme 1. + ABD CTL 5.; Bradbury grubu |
| **GEORG** | DE | Yeni tespit; "längsteilanlage" DE 2. — Alman premium dilme |
| Kohler | DE | Querteilanlage 2.; doğrultma/CTL |
| b+s germany | DE | Dilme + boy kesme 3./3. |
| G+K Umformtechnik · JÖRG · HPL Group | DE | CTL bölgesel oyuncuları |
| BMS (rollformingmill.com) · Prima-Press | DE | Rollform; Prima "Hersteller" sorgusunda 2. |
| Pasterkamp | NL | "rollformmaschine" DE 1. sıra |
| Dallan | IT | IT profilatrice 2. + ABD 273 trafik |
| Gasparini | IT | ✅ doğrulandı (gasparini-spa.com); IT 3.; chat+katalog+sertifika |
| STAM | IT | ES ve PL SERP'lerinde de var — çok pazarlı |
| Dalma Sistemi · OPM Stampi · BS Macchine · Remat | IT | İtalya yerel |
| Fagor Arrasate | ES | ABD dilme 1. + DE 3. + ES 3. — üç pazarda birden |
| Roll Former LLC · ASC Machine Tools · Stan Group | US | "manufacturer" sorgusunun ilk 3'ü |
| Formtek · American Steel · Galaxie · Red Bud · Braner · Rowe · Delta Steel | US | Dilme/CTL bloku |
| Bradbury · Samco · Dreistern · Schuler · Dimeco⚠️ | US/DE/FR | Önceki turdan |
| BTC Maszyny · Polteknik · Świtała | PL | Polonya yerel üretici/entegratörler |
| Jupiter Roll Forming · Press Room Automation | IN | Kablo kanalı 4. / pres besleme |

### 3.5 Rakip OLMAYANLAR — kütüğe karışmasın

- **Fotovoltaik hat üreticileri** (Horad, JVG-Thoma): "solar panel production line" SERP'i bunların — paneli üreten makine, profili değil. 12. tuzağın sahipleri.
- **PVC ekstruder** (Sharc, ACC): "kablo kanalı makinesi" TR SERP'i bunların. 14. tuzak.
- **Çelik servis merkezleri** (Ulbrich, Mead Metals, Steel Warehouse, Böcker, BWS): makine satmıyorlar ama **içerik rakibi** — Ulbrich'in dilme rehberi ABD 2. sırada. Ayrıca DE'dekiler **müşteri adayı**: yeni dilme hattı aldıklarını haberleştiriyorlar.
- **Medya** (thefabricator.com) ve **listicle siteleri** (vigert, believeindustry): link/PR hedefi.
- **2. el pazaryerleri** — her pazarda ilk sayfada: Surplus Record (US), Maschinensucher + resale (DE), Exapro (TR/PL), Machineseeker (PL), Centro Macchine (IT), makinecim + sahibinden (TR). **Rakip değil KANAL**: Machineseeker/Maschinensucher yeni makine ilanı da kabul ediyor → kayıt aksiyonu §4'te.

### 3.6 SERP'ten okunan taktik gerçekler

1. **Eğitici içerik ticari sorguda sıralanıyor** — Kingreal'in "What is the cut to length machine process?" yazısı "cut to length line" aramasında ilk sayfada iki kez; Ulbrich rehberi dilmede 2. Akademi'nin İngilizce'ye açılması gereken formatı bu.
2. **Almanca pazarda "Hersteller/Top" listicle'ları** üstte (vigert Top 8, Prima "Hersteller von...") — DE için üretici-rehberi içerik boşluğu var.
3. **PL dikkat:** "linia cięcia wzdłużnego" SERP'i metal ama PAA kutusu ahşap kesim soruları — terim çift anlamlı, PL içerikte "blachy/kręgów" niteleyicisi şart.
4. **Kullanılmış-makine niyeti küresel** — TR trapez bulgusuyla aynı desen her pazarda: SERP'lerin tepesinde 2. el pazaryerleri var. "İkinci el mi yeni mi" içeriği (trapez SSS'inde yaptık) her dile taşınabilir kalıp.

### 3.7 Müşteri-bulma özellik denetimi — 18 site, tek tek

Ana sayfa HTML'inden sinyal tarandı (JS ile geç yüklenen widget'lar
görünmeyebilir; CIDAN ve Red Bud bot korumasından erişilemedi — dürüst boşluk).

| özellik | kaçında var | bizde | boşluk |
|---|:---:|:---:|---|
| Referans/vaka bölümü | **15/18** | ❌ kilitli | **En büyük fark.** Logolar kodda hazır, izin bekliyor (§5) |
| Video (sitede) | 15/18 | ✅ | ✅ **bugün kapatıldı:** 12 ürün sayfasına saha videosu gömüldü |
| WhatsApp | 11/18 | ✅ | — |
| PDF katalog/broşür | 9/18 | ❌ | Spec onayı gelince ürün sayfasından otomatik PDF üretilebilir |
| Fuar/haber sayfası | 9/18 | ❌ | Fuar listesi firmadan bekleniyor (§5) |
| E-bülten | 8/18 | ❌ | 130 günlük satış döngüsünde tek ucuz "sıcak tutma" aracı; altyapı kararı gerek |
| Sertifika beyanı (ISO/CE) | 5/18 | ❌ | CE/ISO durumu firmadan bekleniyor (§5) — Batı premium'un tamamında var |
| Canlı chat | 3/18 | ❌ | Düşük öncelik: WhatsApp aynı işi görüyor; sadece en agresif CN'lerde var |
| Çok dilli hreflang | 8/18 | ✅ 9 dil | Üstünlük bizde |

**Şablon rakip: Beli** (belirollforming.com) — dokuz özelliğin dokuzu da var.
Bir sonraki özellik eklerken "Beli'de nasıl?" diye bakmak yeterli.

---

### 3.8 Backlink gerçeği — sektörde link profili baştan aşağı sahte

**Ölçüm (2026-08-08):** DataForSEO Backlinks API ile 10 rakibin özeti, dördünün
atıf yapan domain listesi ve kendi ankor metinlerimiz çekildi.

| domain | rank | backlink | atıf domain | spam |
|---|---:|---:|---:|---:|
| eaemachinery.com | **296** | 4.433 | 148 | 7 |
| dallan.com (IT) | 274 | 1.532 | **211** | **5** |
| coiltech.com.tr | 265 | 1.704 | 135 | 12 |
| lotosforming.com (CN) | 204 | 1.184 | 148 | 12 |
| **servosteel.com.tr** | **197** | 478 | **85** | 11 |
| sacform.com | 186 | 570 | 52 | 11 |
| agmline.com | 147 | 164 | 51 | 15 |
| swforming.com (CN) | 130 | 202 | 59 | 15 |
| **us.cidanmachinery.com** | 109 | 224 | **18** | **0** |
| etcoma.com.tr | 84 | 26 | 15 | 27 |

Rakamlara bakınca "fena değiliz" denebilir — 85 atıf yapan domain, rank 197.
**Listeye bakınca öyle değil.**

#### Bizim 85 domainimiz çöp

İlk sıradakiler: `legendary11.com` · `bulletinafrica.com` · `promoteproject.com`
· `jogajog.com.bd` · `thequikads.com` · `ogapatapata.com` · `paravecmoi.club` ·
`topclassifieds.com` ("Submit free ads") · `classifieds4free.biz` ·
`salesale.sale`. Ücretsiz ilan siteleri ve PBN ağı.

Ankor metinleri bunu kesinleştiriyor — neredeyse tamamı **çıplak URL**:

| ankor | link | domain |
|---|---:|---:|
| `https://www.servosteel.com.tr/` | 78 | 25 |
| `https://www.servosteel.com.tr/product/cut-to-length-…` | 78 | 13 |
| `servosteel.com.tr` | 50 | 44 |
| *"turnkey steel processing line"* (tek tanımlayıcı ankor) | **7** | 6 |

Gerçek editoryal link tanımlayıcı ankor kullanır. Çıplak URL bombardımanı,
otomatik dizin/ilan gönderiminin imzasıdır. **Mevcut ajansın işi bu** — #17'nin
kanıtı artık elimizde, tahmin değil.

Not: bu linkler eski WordPress adreslerine bakıyor (`/product/…`, `/lines/`,
`/decoilers/`). 301'ler doğru çalıştığı için ne varsa yeni sayfalara akıyor.

#### Rakiplerinki de sahte — ama farklı şekilde

**EAE Machinery (rank 296, sektörün en yükseği):** ilk 10 atıf domaininin
**dokuzu kendi grup şirketleri** — `ceeind.com`, `eaeaydinlatma.com`,
`ceeindustrial.com`, `eaelighting.com`, `eaeelectric.com`,
`eaeelektroteknik.com`, `eaeitalia.it`, `eae.com.de`, `eaetechnology.com`.
Dışarıdan tek gerçek link: **`maktekfuari.com`** — bir fuar sitesi.
Yani 296'lık rank kendi ağından geliyor; kopyalanamaz (bizim grup şirketimiz yok).

**AGMLine (rank 147):** tek anlamlı link `sacform.com` — kendi ikinci domaini.
Gerisi URL kısaltıcı ve çöp.

**Coiltech (rank 265) — SEKTÖRDEKİ TEK KOPYALANABİLİR DESEN:**

| kaynak | rank | ne |
|---|---:|---|
| `vizyon.net.tr` | 256 | portal/ajans bağlantısı |
| **`bvv.cz`** | **170** | **Brno Fuarları — katılımcı sayfası** |
| **`pasterkamp.nl`** | **140** | Hollandalı roll form firması — partner/distribütör |
| `olsons.se` | 124 | İsveç |
| `moki.co.jp` | 9 | Japonya |
| `cagdasmakina.net` | 47 | Türk sektör firması |

**Coiltech'in gerçek avantajı: fuar katılımcı sayfaları + uluslararası
partner/distribütör linkleri.** Satın alınmamış, üretilmemiş — iş yaparken
doğal olarak oluşmuş linkler.

#### CIDAN istisnası — link olmadan da kazanılıyor

ABD'de ölçülen en yüksek organik trafik CIDAN'da (1.216/ay) ama **atıf yapan
domain sayısı 18** — bizim beşte birimiz, ve spam skoru **0**. Yani o trafik
linkten değil, içerik ve alaka düzeyinden geliyor.

Bu, "önce link toplayalım" refleksine karşı en iyi kanıt: bu sektörde temiz ve
alakalı içerik, kirli linkten daha çok iş görüyor.

#### Çıkarım — link stratejimiz ne OLMALI

1. **Ajansın link üretimini durdur** (#17). Yenisi eklenmesin; mevcutları
   disavow etmek şimdilik gereksiz, Google bu tür linkleri zaten yok sayıyor.
2. **Kopyalanacak tek desen fuar + partner.** Coiltech'in bvv.cz linki
   katıldıkları fuardan; EAE'nin tek gerçek dış linki de maktekfuari.com.
   → Filiz Hanım'a sorulan "hangi fuarlara katıldık" sorusu bu yüzden kritik:
   **geçmiş fuarların katılımcı listeleri hâlâ canlı ve link veriyor.**
3. **Uluslararası partner/distribütör** — Coiltech'in NL, SE, JP linkleri.
   48 ülkeye ihracat yapan bir firmanın bu tür doğal linki olmaması bir eksik.
4. **Dizinlerde link beklentisi düşük tut.** makinaturkiye profil sayfasında
   firmanın kendi sitesine **tek link yok** (817 linkli bir sayfada, ölçüldü).
   Oraya görünürlük ve doğrudan talep için girilir, otorite için değil.

## 4. Ne yapılacak — öncelik sırası

### Şimdi, engel yok

- [ ] **`servosteel.wixsite.com` · `servosteel.blogspot.com` · `www.servosteel.com`** — kapat ya da 301'le
- [ ] **Sektör dizinlerine kayıt** — bunlar zaten bizim kelimelerimizde sıralanıyor, otoriteleri hazır:
      makinaturkiye · Europages · IndustryStock · **DirectIndustry** ("cut-to-length cutting line" aramasında üst sırada)
- [ ] **2. el pazaryerlerine YENİ makine ilanı** — dünya taraması gösterdi: Machineseeker/Maschinensucher,
      Exapro ve Surplus Record her pazarda ilk sayfada ve yeni makine ilanı da kabul ediyorlar (§3.5)
- [ ] **Google İşletme Profili** (Sancaktepe) — "servosteel" en çok tık alan kelimemiz, profil o aramanın sağ tarafını komple verir
- [ ] **Bing Webmaster** kaydı — asıl kazanç Yandex tarafını hızlandırmak ve AI aramaların beslendiği indekse girmek
- [ ] **Mevcut ajansın link inşasını durdur** — 2010'ların yöntemi, zarar veriyor

### Firmadan cevap gelince

- [ ] **13 ürün sayfasına teknik tablo** — en çok trafiği bu açar (bkz. bölüm 5.3)
- [ ] Ticari şartlar yazısı, 9 dil — rakiplerin **hiçbirinin** yayınlamadığı bilgi
- [ ] Hacmi olan 4 yeni ürün sayfası
- [ ] Referans logolarını yayına aç

### Sürekli

- [ ] **Akademi'yi ritme bağla** — 2 haftada 1 yazı. Çin'in kazandığı format: "nasıl seçilir" + "Ultimate Guide".
      Sıradaki: İngilizce eğitici yazı — Kingreal'in yazısı ticari sorguda sıralanıyor (§3.6)
- [x] ~~Her ürün sayfasına ilgili çalışan hat videosu~~ — **yapıldı (2026-08-07):** 12 ürün yoluna
      başlık-doğrulamalı eşlemeyle gömüldü; eşleşmesi olmayan 4 sayfada bilerek yok (§3.7)
- [ ] YouTube başlıklarını hedef kelimeyle yaz, açıklamaya ürün sayfası linki

### Akademi

**Yayında (9 dil):** rulo dilme hattı nasıl seçilir · boy kesme hattı nasıl
seçilir · servo besleyici nasıl seçilir · progresif kalıp & servo besleyici ·
rulo dilme hattı maliyeti · rulo ağırlığı ve uzunluğu hesabı · sac fire oranını
düşürmek · solar profil hattı yatırım geri dönüşü · rulo hattı nereden alınmalı

**Yayında (TR + EN, ayrı yazılmış):** roll form nedir.
TR kümesi: `rollform nedir` 70 + `roll form nedir` 20 + `roll form makinesi nedir`
20 + `soğuk şekillendirme` 50.
EN kümesi: `what is roll forming` 110 + `roll forming process` 60 +
`cold roll forming` 50 + `roll forming vs stamping` 20 + `roll forming machine
cost` 20 — hepsi düşük rekabet, toplam ~280/ay (ABD+İngiltere), üstüne MENA.
İngilizce sürüm çeviri DEĞİL: presle karşılaştırma ve maliyet kalemleri Türkçe
sürümde yok, çünkü o hacim yalnızca İngilizce'de var.

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

> Mühendis doğrulama listesi (canlı linklerle) ve periyodik kontrol komutları
> ayrı bir çalışma dosyasında: **[KONTROL.md](KONTROL.md)** — Filiz Hanım'a
> gidecek olan o dosyadır, burası stratejinin kaydı.

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

## 8. Yol haritası

Ölçülen her şeyin tek sayfada özeti ve sıralaması. Tarih verilen yerler tahmin
değil, mevcut ilerleme hızından türetildi.

### Durum tespiti — tek paragraf

Site tarafında yapılacak iş büyük ölçüde bitti: 416 sayfa, 9 dil, şema, SSS,
ürün sayfalarında video, altı dilde ölçülmüş başlıklar. Denetlenen 18 rakibin
**hiçbirinde sayısal spec tablosu ve 9 dil yok** — sayfa kalitesinde zaten
öndeyiz. Eksik olan içerik değil; **zaman (indeksleme), otorite (link) ve
mühendislikten gelecek sayılar.**

### Kademe 0 — şimdi: taşınmayı tamamla (kendiliğinden ilerliyor)

| gösterge | 6 Ağu | 8 Ağu |
|---|---|---|
| indekslenmiş örnek sayfa | 3/12 | **7/12** |
| "keşfedildi, indekslenmedi" | 2 | **0** |
| gösterim alan yeni sayfa | 0 | 2 |
| tık / gösterim (28 gün) | 42 / 575 | 46 / 639 |

Google iki günde 4 sayfa daha indeksledi. **Yapılacak bir şey yok, beklenecek.**
Her deploy sonrası `npm run kontrol`, yeni URL varsa `npm run indexnow`.

⚠️ Trafiğin çoğu hâlâ eski WordPress adreslerinden 301'lerle akıyor (51 sayfa,
360 gösterim). Yönlendirmelerin bozulmaması kritik — regresyon script'i bunu
her deployda kontrol ediyor.

### Kademe 1 — 1-3 ay: Türkiye'de ilk sayfa

**Neden burası:** Türk rakiplerin tamamı dijitalde boş. Coiltech ölçümde
**3 kelime / ayda 1 ziyaret**, üstelik "Avrupa'nın en büyüğü" diyor. Ev
sahasında kaleyi kimse tutmuyor ve tıklarımızın %86'sı zaten Türkiye'den.

| hedef kelime | hacim | durum | ne gerek |
|---|---:|---|---|
| rulo açıcılar | 140 | **7. sırada** | sayfa hazır, spec tablosu dolu — en yakın kazanç |
| trapez sac makinesi | 480 | başlık doğru | SSS eklendi; SERP zayıf (ilk 5'in üçü pazaryeri) |
| rollform makinesi | 590 | başlık düzeltildi | hub içeriği derinleşmeli |
| sac dilme hattı | 30 | — | dilme sayfası hazır |

**Blokaj:** yok. Bu kademe zaten yürüyor.

### Kademe 2 — 3-6 ay: gerçek link (fuar + partner)

Backlink analizi (§3.8) sektörde tek kopyalanabilir deseni gösterdi:
**fuar katılımcı sayfaları ve uluslararası partner linkleri.**

1. **Ajansın link üretimini durdur** — bizim 85 domainimiz ilan sitesi spam'i,
   ankorların neredeyse tamamı çıplak URL. Yenisi eklenmesin.
2. **Geçmiş fuar katılımcı listeleri** — Coiltech'in en değerli linki
   `bvv.cz` (Brno Fuarları), EAE'nin tek gerçek dış linki `maktekfuari.com`.
   Katıldığımız fuarların sayfaları hâlâ canlı ve link veriyor.
   → Filiz Hanım'a sorulan "hangi fuarlara katıldık" bu yüzden kritik.
3. **Uluslararası partner / distribütör** — Coiltech'in NL, SE, JP linkleri
   iş ilişkisinden doğmuş. 48 ülkeye ihracat yapan bir firmada bunun olmaması
   bir eksik.
4. **Dizinler** — makinaturkiye, Europages, DirectIndustry, IndustryStock.
   ⚠️ makinaturkiye profil sayfasında firmaya **link yok** (ölçüldü); oraya
   görünürlük ve doğrudan talep için girilir, otorite için değil.

### Kademe 3 — 6-12 ay: İngilizce ticari kelimeler

En zor kademe: orada Çinliler ve CIDAN gibi gerçek rakipler var. Şu an
İngiltere + ABD'den **176 gösterim, sıfır tık** — 15.-28. sıradayız.

**Ama CIDAN gösteriyor ki link şart değil:** ABD'de 1.216 trafik alıyorlar,
atıf yapan domain sayısı **18** (bizim beşte birimiz), spam skoru 0. Oradaki
başarı içerik ve alaka düzeyinden geliyor.

Bizim yolumuz da o: eğitici içerik ticari kelimeyi kapıyor (Kingreal'in
"What is…" yazısı ticari sorguda ilk sayfada iki kez). İlk parça yayında —
`/en/academy/what-is-roll-forming`.

**MENA bu kademeye dahil:** Arapça'da talep yok (en yüksek terim 10/ay), MENA
İngilizce arıyor (Suudi 100, BAE 130, Mısır 90). İngilizce içerik = MENA
stratejisi.

### Kilit blokaj: 13 teknik tablo

Kademe 1 ve 3'ün ikisini birden hızlandıracak tek şey. 17 ürün sayfasının
13'ünde teknik özellik tablosu yok; alıcı makineyi **ölçüyle** arıyor ve
rakiplerin hiçbirinde bu tablo yok — yani bizde *olabilir*.

Filiz Hanım'a Word olarak gönderildi (`belgeler/`), mühendislik cevabı bekleniyor.

### Sırayla ne yapılacak

| # | iş | kimde | neden bu sırada |
|---|---|---|---|
| 1 | Form testi — `generate_lead` hiç tetiklenmedi | **sen** | Ölçüm kanıtlanmadan gerisi körlemesine. 2 dakika |
| 2 | Mühendislik cevapları → 13 tablo | Filiz Hanım | En büyük tek kaldıraç |
| 3 | Ajansın link üretimini durdur | Filiz Hanım | Her gün yeni çöp ekleniyor |
| 4 | Fuar listesi → katılımcı sayfaları | Filiz Hanım | Sektörde çalışan tek link deseni |
| 5 | Yandex `https://` host | **sen** | Rusya 3. pazar, hâlâ `http://` kayıtlı |
| 6 | Referans logo izni | Filiz Hanım | 18 rakibin 15'inde var, bizde kilitli |
| 7 | Türkçe hub içeriğini derinleştir | ben | Kademe 1'in kalan işi |
| 8 | İngilizce eğitici içerik serisi | ben | Kademe 3'ün tek yolu |

**Not:** 7 ve 8 bende ama listenin sonunda — çünkü sitenin sayfa kalitesi zaten
rakiplerin önünde. Daha fazla içerik üretmek, üstteki altı madde çözülmeden
marjinal fayda veriyor.

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

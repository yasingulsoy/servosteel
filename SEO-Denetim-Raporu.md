# Servosteel — SEO Denetim Raporu

**Denetlenen:** `https://demo.yasingulsoy.cloud` (yeni sitenin canlı kopyası)
**Denetim tarihi:** 2026-07-31 · **Son güncelleme:** 2026-07-31 (düzeltmeler sonrası)
**Yöntem:** Canlı site taraması + Lighthouse (mobil/masaüstü) + kaynak kod incelemesi
**Not:** `servosteel.com.tr` hâlâ **eski WordPress** sitesini gösteriyor. Denetim yeni siteye yapıldı.

---

## Yönetici özeti

Site teknik olarak **sağlam kurulmuş**. 15 sayfada tek H1, tüm görsellerde alt metin, 9 dilde eksiksiz hreflang, geçerli sitemap, JSON-LD — bu sektörde nadir bir taban.

Denetimde **1 kritik, 3 yüksek, 5 orta** öncelikli sorun bulundu. **Kritik ve yüksek olanların tamamı düzeltildi ve doğrulandı.** Ardından en büyük içerik boşluğu olan FAQ da kapatıldı (bkz. bölüm 10).

En değerli iki bulgu:
1. **Demo sitesi tamamen indekslenebilirdi** — canlıya geçişte kendi kopyasıyla yarışacaktı.
2. **Mobil LCP 6,3 saniye** (kötü) — 7,5 MB'lık hero videosu yüzünden. Masaüstünde 2,0 sn (iyi) olması sorunun kaynağını kanıtlıyordu.

**Toplam çıktı:** 243 statik sayfa · 9 dil · 4 şema tipi (Organization, BreadcrumbList, Article, Product, FAQPage) · 17 FAQ sorusu × 9 dil

---

## 🔴 KRİTİK — düzeltildi

### 1. Demo sitesi arama motorlarına tamamen açıktı
**Kanıt:** `robots.txt` → `Allow: /` · canonical demo adresini gösteriyor · sitemap'te **234 URL ve 2106 hreflang girdisinin tamamı** demo adresine bakıyor.

**Risk:** Google demo'yu indekslerse, canlıya geçildiğinde aynı içerik iki domainde olur; site kendi kopyasıyla yarışır.

**Düzeltme:** Ortama göre otomatik kapanma eklendi. Canlı domain dışındaki her adres (demo, localhost, önizleme) artık `noindex, nofollow` + `Disallow: /` alıyor. Canlıda hiçbir manuel işlem gerekmiyor.

| Ortam | robots.txt | robots meta |
|---|---|---|
| Canlı domain | `Allow: /` + 10 AI botu | `index, follow` |
| Demo | `Disallow: /` | `noindex, nofollow` |
| localhost | `Disallow: /` | `noindex, nofollow` |

**Ek güvenlik:** İlk uygulamada karşılaştırma tam metin eşleşmesiydi — canlıda yanlışlıkla `www.` veya `http://` yazılsa **tüm site sessizce noindex olurdu.** Denetim bunu yakaladı; karşılaştırma host bazlı ve toleranslı hale getirildi.

> **Yayın kontrolü:** Canlıya geçtikten sonra `https://servosteel.com.tr/robots.txt` adresinde `Disallow: /` **olmadığını** doğrulayın.

---

## 🟠 YÜKSEK — düzeltildi

### 2. Mobil LCP 6,3 saniye (Google eşiği 2,5 sn)
**Ölçüm (Lighthouse, canlı):**

| Sayfa | Cihaz | LCP | CLS | TBT | Skor |
|---|---|---|---|---|---|
| Ana sayfa | Mobil | **6,3 sn — kötü** | 0 ✓ | 42 ms ✓ | 74 |
| Ana sayfa | Masaüstü | 2,0 sn — iyi | 0 ✓ | 0 ms ✓ | 89 |

**Kök neden:** `hero.mp4` **7,46 MB** ve `preload="auto"` ile daha sayfa boyanmadan indiriliyordu. Mobilde poster görseli LCP yarışını kaybediyor, LCP öğesi olarak **navbar logosu** kalıyordu. Masaüstünde poster kazanıyor — bu fark sorunun yükleme stratejisi olduğunu kanıtlıyor.

**Düzeltme:** `preload="auto"` → `preload="none"` + poster'a yüksek öncelikli preload ipucu. Video artık kritik yoldan çıktı; poster hemen boyanıyor, oynatma sonra başlıyor. Kullanılmayan `hero.webm` kaynağı da kaldırıldı.

### 3. Makale meta açıklamalarının 25'i çok uzundu
27 makale açıklamasından **25'i 160 karakteri aşıyordu** (Rusça/Arapça 400'e kadar). Google ~160'ta kestiği için açıklamalar cümle ortasında kopuyordu. **27'sinin tamamı ≤160 karaktere indirildi.**

### 4. Akademi makalelerinde x-default eksikti
Diğer tüm sayfalarda vardı, makalelerde yoktu (metadata'yı elle kurduğum için). Eklendi — artık 9 dil + x-default.

---

## 🟡 ORTA — düzeltildi

### 5. Sitemap ile HTML çelişiyordu
Sitemap'te x-default yoktu (HTML'de vardı) → Google'a çelişkili sinyal. **234 x-default eklendi.**

### 6. Tüm lastmod tarihleri aynıydı
Her build'de "bugün" yazılıyordu — içerik değişmese de "hepsi güncellendi" demek. Google yanlış lastmod görünce bu sinyali tamamen yok sayar. **Statik sayfalardan kaldırıldı, makalelerde gerçek yayın tarihi kullanılıyor.**

### 7. llms.txt eksik ürün içeriyordu
5 makine kategorisinden **kalıp/merdane sayfası llms.txt'te yoktu** (sayfa sonradan eklenmiş, dosya güncellenmemiş). Eklendi. Ayrıca 9 dili tanıtan "Languages" bölümü eklendi — dosya AI motorlarına siteyi İngilizce-tek-dil gibi gösteriyordu.

### 8. Organization şemasında Arapça yoktu
`/ar` locale'i tam çalışırken şema Arapça'yı listelemiyordu — MENA hedefiyle çelişki. Eklendi. Ayrıca `@id`, açıklama ("makine üreticisidir, çelik tedarikçisi değildir"), `knowsAbout`, `areaServed` ve `logo` (ImageObject) eklendi.

### 9. Spec tabloları makine tarafından okunamıyordu
Tablolar sadece görsel HTML'di — yapay zekanın "±0,1 mm" değerini Servosteel'e atfetmesi için çıkarım yapması gerekiyordu. **Product şeması eklendi:** her makine sayfası artık spec tablosundan otomatik üretilen `PropertyValue` listesi ve `manufacturer` bağı taşıyor. Bu hem alıntılanabilirliği hem "üretici mi tedarikçi mi" belirsizliğini çözüyor. Fiyat bilinçli olarak yok — bu makineler tekliflendirilerek satılıyor.

---

## ✅ Denetimden temiz çıkanlar

| Kontrol | Sonuç |
|---|---|
| hreflang | 9 dil + x-default, tüm sayfalarda ✓ |
| Canonical | Her sayfada, kendine referanslı ✓ |
| H1 | 15 sayfanın hepsinde tam 1 tane ✓ |
| Görsel alt metni | **Eksik yok** ✓ |
| CLS | **0** (mobil + masaüstü) ✓ |
| TBT | 42 ms / 0 ms ✓ |
| TTFB | 110–178 ms ✓ |
| Sıkıştırma | Brotli aktif (%82 azalma) ✓ |
| next/image | WebP/AVIF pazarlığı çalışıyor ✓ |
| Arapça font | Arapça olmayan sayfalarda **indirilmiyor** ✓ |
| RTL | `/ar` doğru `dir="rtl"` ✓ |
| Sitemap | 234 URL, geçerli XML ✓ |

---

## 10. FAQ — denetim sonrası eklendi ✅

Denetimin en yüksek öncelikli **içerik** boşluğuydu: alıcıların gerçekten aradığı sorular sitede hiç cevaplanmıyordu.

**Eklenen:** 4 sayfaya, **9 dilde, toplam 17 soru** — hepsi FAQPage şemalı.

| Sayfa | Soru | Kapattığı boşluk |
|---|:---:|---|
| `/dilme-hatlari` | 5 | Ne işe yarar · kapasite seçimi · **dilme mi boy kesme mi** · **fiyat neye göre değişir** · devreye alma |
| `/boy-kesme-hatlari` | 4 | Karşılaştırmanın diğer yüzü · plaka düzlüğü · fiyat |
| `/roll-form-hatlari` | 4 | **Roll form hattı maliyeti** · katalog dışı profil · çok profilli kullanım |
| `/makineler/kalip-ve-merdane` | 4 | **"Progresif kalıp nedir"** · merdane malzemesi (4140 / 58-60 HRC) · tasarım girdisi |

**Teknik notlar:**
- `<details>/<summary>` kullanıldı: cevap metni kapalıyken bile HTML'de bulunur, yani arama motorları ve yapay zeka motorları okuyabilir. JavaScript ile gizlenen içerikte bu garanti yoktur.
- Şema, sayfadaki görünür metinle **birebir aynı** — Google'ın kuralı budur.
- FAQ opsiyoneldir: yalnızca içeriği tanımlı sayfalarda görünür, diğer makine sayfalarında bölüm hiç render edilmez.
- Fiyat sorularında **rakam verilmiyor**; fiyatı belirleyen etkenler açıklanıp teklife yönlendiriliyor.

---

## 📋 Kalan işler (düzeltilmedi — karar/onay gerekiyor)

**Yüksek**
- **`alt.mp4` 17,9 MB.** Yükleme stratejisi zaten doğru (lazy, `preload="none"`). Yeniden kodlama denendi: **orijinal kaynaktan aynı ayarlarla kodlayınca hiç kazanç çıkmadı** — dosya zaten optimize edilmiş, boyutun sebebi **49 saniyelik süre**. Gerçek kaldıraç süreyi kısaltmak (ör. 20 sn → yaklaşık yarı boyut, kalite kaybı yok). Çözünürlük düşürme denendi ve **elendi**: 1600px'e indirince gözle görülür yumuşama oluşuyor. *Süre kısaltma içerik kararı olduğu için yapılmadı.*

**Orta**
- **Spec çelişkisi:** Akademi makalesi servo besleyici için **±0,1 mm** diyor, ama bu değer sadece kompakt hat spec tablosunda var — servo sürücü tablosunda yok. Eski sitede de yalnızca kompakt hatta yayınlanmıştı. **Mühendislikle netleştirilmeli:** servo sürücü için de geçerliyse tabloya eklenmeli, değilse makale düzeltilmeli.
- **Müşteri logosu yok** — rakip Etcoma'da Bosch/Renault/Tofaş/Faurecia logoları var. En güçlü güven aracı.
- **53 KB kullanılmayan JS** + gereksiz `Array.prototype.at` polyfill (13,7 KB).
- **Ölü bağımlılıklar:** `@phosphor-icons/react` (hiç kullanılmıyor) ve `@radix-ui/react-dialog` (tek kullanıcısı olan `ui/dialog.tsx` silindi). Paket kilidi geçişi yeni düzeldiği için bu temizlik **ayrı bir işte** yapılmalı — deploy riskini şimdi almaya değmez.

**Düşük**
- Kısa başlıklar: `/iletisim` 21, `/videolar` 21, `/teklif-al` 22 karakter — anahtar kelime taşımıyor.
- `logo-full.png` → SVG (%54 kazanç).
- Video dosyalarında `Cache-Control` 4 saat — parmak izli dosya adıyla 1 yıla çıkarılabilir.
- Üçüncü taraf otorite sinyali yok (`sameAs` tamamen kendi hesapları) — Wikidata + sektör dizinleri.

---

## Yayına geçiş kontrol listesi

1. Bu düzeltmeleri deploy et
2. Domaini yeni siteye yönlendir
3. `NEXT_PUBLIC_SITE_URL=https://servosteel.com.tr` gir **ya da hiç tanımlama** (kod zaten doğru adrese düşüyor)
4. **`https://servosteel.com.tr/robots.txt` adresinde `Disallow: /` OLMADIĞINI doğrula** ← en kritik kontrol
5. `www → www'suz 301` yönlendirmesini ayarla
6. Search Console + Bing Webmaster kur, sitemap gönder
7. 79 adet 301 yönlendirmesinin çalıştığını örnekle (ör. `/product/coil-slitting-lines/` → `/en/dilme-hatlari`)
8. 404 raporunu ilk hafta günlük izle

---

*Denetim canlı ölçümlere ve kaynak kod incelemesine dayanır. Ölçülemeyen noktalar rapor içinde belirtilmiştir: ürün ve makale sayfalarının Lighthouse skorları alınamadı (yalnızca ana sayfa ölçüldü) ve demo domaininde CrUX saha verisi bulunmuyor.*

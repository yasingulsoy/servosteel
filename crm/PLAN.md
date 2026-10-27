# Servosteel CRM — Plan

> **Durum:** taslak, 27 Ekim 2026. Kod yazılmadan önce kararlar bu belgede netleşecek.
> En sondaki "Karar bekleyen sorular" cevaplanınca Faz 0'a başlanır.
>
> **Depo herkese açık (public).** Bu klasöre ve CRM koduna müşteri verisi, kişi adı,
> e-posta adresi, ekran görüntüsü, şifre ya da anahtar girmez. Veri yalnız
> veritabanında, gizli değerler yalnız sunucunun ortam değişkenlerinde durur.

---

## 1. Amaç

Bir firmayla ilgili her şeyi tek ekranda toplamak: ilk temastan (tanıtım maili, site
formu, fuar, telefon, referans) teklife, siparişe, kuruluma ve satış sonrasına kadar.

Bugün bu bilgi dağınık:

- talepler ve tanıtım maili kayıtları admin panelinde,
- yazışmalar beş ayrı posta kutusunda ve satışın Outlook'unda,
- teklifler Excel/PDF olarak kişilerin bilgisayarında.

Satışa iletilen iş panelden çıkıyor ve sonrası görünmüyor: kaç teklif gitti, hangisi
kazanıldı, hangi kanal gerçekten satış getirdi, bilinmiyor.

**Başarı ölçütü:**

- Her talebin sonucu CRM'den okunabilsin: teklif gitti mi, kazanıldı mı, kaybedildiyse neden.
- Kanal başına **talep → teklif → sipariş** oranı çıkarılabilsin. Kanallar: tanıtım maili,
  organik site formu, Europages, fuar, referans, eski müşteri.

---

## 2. Admin paneliyle sınır

| | Admin paneli (olduğu gibi kalır) | CRM (yeni) |
|---|---|---|
| **Kullanan** | pazarlama | satış, pazarlama, yönetim |
| **İş** | site talepleri, tanıtım maili kampanyası (hedef firmalar, gönderim, otomatik gönderim), e-posta istemcisi, site ayarları | firma ilişkisi: kişiler, fırsatlar, teklifler, görevler, aktiviteler, satış sonrası |
| **Geçiş noktası** | "Satışa ilet" bugün e-posta ile gidiyor | aynı düğme CRM'de fırsat açar; satışa e-posta bildirimi yine gider |

Admin paneli pazarlamanın aracı olarak kalır, CRM satışın aracı olur. İkisi aynı
veritabanını kullanır. Panel CRM tablolarına yalnız "CRM'e aktar / Satışa ilet"
adımıyla yazar.

---

## 3. Bugün elimizde olan

Veritabanında (PostgreSQL 18) panelin tabloları. Sayılar 27 Ekim itibarıyla yaklaşık:

| Tablo | Ne tutuyor | Kayıt |
|---|---|---|
| `hedef_firmalar` | tanıtım maili hedef firmaları: ad, ülke, segment, web, tek e-posta, durum, kategori, takip tarihi | ~10.000 |
| `hedef_gonderim` | giden her tanıtım maili ve hatırlatma (tur 1/2), sonuç, gönderen kutu | ~8.400 |
| `gelen_eposta` | gelen postanın sınıflandırılmış özeti (yanıt / otomatik / geri dönüş / abonelik), eşleşen firma | ~160 |
| `hedef_not` | firma notları | ~350 |
| `talepler` + `talep_not` | site formları ve elle girilen talepler, durum, takip tarihi, notlar | ~30 |
| `eposta_engel` | mail atılmayacak adresler (abonelikten çıkanlar) | ~35 |
| `olaylar` | sitedeki telefon/e-posta tıklamaları, tanıtım mailinden gelen ziyaretler | ~4.500 |
| `yoneticiler`, `panel_oturum`, `panel_kayit` | panel kullanıcıları (admin / kullanici), oturumlar, denetim kaydı | — |

**Eksikler** (kodda doğrulandı):

- **Kişi tablosu yok.** Firmada tek e-posta ve serbest metin "hitap" var. Talepte ad, e-posta ve telefon talebin içinde.
- **Talep–firma bağı yok.** `talepler.firma` serbest metin; eşleşme yalnız alan adı tahminiyle yapılıyor.
- **Fırsat yok.** Tutar, döviz, olasılık ya da aşama tutulmuyor; yalnız talep durumu var.
- **Teklif kaydı yok.** Teklif numarası, kalemleri, sürümü tutulmuyor.
- **Görev yok.** Kayıt başına tek takip tarihi var; atanan kişi, tamamlanma ve geçmiş yok.
- **Kayıt sahibi yok.** Hiçbir kayıtta "sorumlu" alanı yok.
- **Tek zaman çizelgesi yok.** Geçmiş beş ayrı tabloya dağılmış.
- **Satışın yazışmaları sistem dışında.** Satış kutuları Outlook'ta POP3 ile çalışıyor.
- **Roller yalnız iki tane:** admin ve kullanici.

---

## 4. Mimari

**Öneri:** `crm/` klasöründe **ayrı bir Next.js uygulaması**, **aynı PostgreSQL**.

- **Neden ayrı uygulama:**
  - Site ve panel yayını CRM'den bağımsız kalır; birindeki hata ötekini düşürmez.
  - Ayrı alt alan adı (öneri: `crm.servosteel.com.tr`), ayrı oturum, ayrı yetkiler.
- **Neden aynı veritabanı:** talepler, hedef firmalar, giden ve gelen e-posta geçmişi
  zaten orada. Kopyalamak eşitleme sorunu çıkarır.
- **Teknoloji:** sitenin aynısı (Next.js 16, TypeScript, Tailwind, `pg`); ekip ve araçlar
  ortak. Arayüz Türkçe, tek dil.
- **Şema yönetimi:**
  - Numaralı SQL migration dosyaları (`crm/db/migrations/0001_…sql`) ve küçük bir
    çalıştırıcı. Migration'lar yayından önce çalışır.
  - Panelin "ilk kullanımda `CREATE TABLE IF NOT EXISTS`" yöntemi CRM'de kullanılmaz.
- **Ad alanı:**
  - CRM tablolarının hepsi `crm_` önekli.
  - CRM panelin tablolarını yalnız **okur**. Tek istisna bağlantı alanlarıdır (ör.
    `talepler.crm_firsat_id`); bunlar da migration ile eklenir.
- **Arka plan işleri:**
  - CRM kendi dakikalık döngüsünü kurmaz.
  - Hatırlatma e-postası gibi işler kilitli tek bir zamanlanmış uç noktadan çalışır;
    panelin otomatik gönderimiyle çakışmaz.
- **Yayın:**
  - Dokploy'da ayrı servis, kök dizini `crm/`.
  - Kök projenin `tsconfig.json` ve `eslint.config.mjs` dosyalarında `crm` hariç
    tutulmalı. Kök tsconfig `**/*.ts` kapsıyor; eklenmezse sitenin derlemesi CRM
    kodunu da derler ve CRM'deki bir tip hatası site yayınını durdurur.
- **Erişim:**
  - Her sayfa girişe bağlı ve sunucu tarafında yetki kontrolünden geçer.
  - `noindex`, robots kapalı.
- **Yedek:** CRM satışın asıl kaydı olacağı için veritabanının düzenli ve geri
  yüklemesi denenmiş yedeği Faz 0'da doğrulanmalı.

---

## 5. Veri modeli (ilk taslak)

### Çekirdek

| Tablo | Ana alanlar |
|---|---|
| `crm_firma` | ad, ülke, şehir, web, alan adı (eşleştirme için), sektör/segment, kaynak, durum (aday / müşteri / eski müşteri / bayi-iş ortağı / rakip), sorumlu kullanıcı, `hedef_firma_id` (panel bağı, opsiyonel), oluşturma/güncelleme |
| `crm_kisi` | firma, ad, unvan, e-posta, telefon, WhatsApp, dil, birincil mi, iletişim izni / abonelik durumu |
| `crm_firsat` | firma, kişi, başlık, ürün (sitenin katalog slug'ı: roll form hattı, makine…), aşama, tahmini tutar + döviz, olasılık, beklenen karar tarihi, kaynak, `talep_id` (bağ), sorumlu, kayıp sebebi, kazanılma tarihi |
| `crm_teklif` | fırsat, teklif no (ör. `SRV-2026-0012`), sürüm, tarih, geçerlilik, döviz, toplam, durum (taslak / gönderildi / kabul / red), teslim ve ödeme şartları, PDF |
| `crm_teklif_kalem` | teklif, ürün, açıklama, adet, birim fiyat, iskonto |
| `crm_aktivite` | firma / kişi / fırsat, tür (not, arama, toplantı, ziyaret, giden e-posta, gelen e-posta, fuar, WhatsApp), özet, gövde, zaman, kullanıcı, kaynak referansı (ör. `gelen_eposta` / `hedef_gonderim` kaydı) |
| `crm_gorev` | başlık, bağlı kayıt (firma / fırsat), atanan, son tarih, durum, tamamlanma |
| `crm_dosya` | bağlı kayıt, ad, tür, boyut, depolama yolu (teklif PDF'i, müşteri çizimleri) |
| `crm_etiket`, `crm_firma_etiket` | serbest etiketler |
| `crm_kullanici` | kullanıcı adı, ad, e-posta, rol, şifre karması (scrypt), aktif |
| `crm_kayit` | denetim kaydı: kim, neyi, ne zaman, eski → yeni değer |

### Fırsat aşamaları

`Yeni` → `Netleştirme` → `Teklif hazırlanıyor` → `Teklif gönderildi` → `Görüşme` → **`Kazanıldı`** / **`Kaybedildi`**

- **Netleştirme:** teknik sorular, çizim, kalınlık, kapasite toplanıyor.
- **Kayıp sebebi** (Kaybedildi'de zorunlu): fiyat, teslim süresi, rakip, proje iptal, cevap yok,
  teknik uygunsuzluk, finansman, diğer.
- **Panelin talep durumlarından aktarım:**

  | Talep durumu | Fırsat aşaması |
  |---|---|
  | `yeni` | Yeni |
  | `iletildi`, `ulasildi`, `bilgi_verildi` | Netleştirme |
  | `teklif_gonderildi` | Teklif gönderildi |
  | `kazanildi` / `kaybedildi` | aynı |
  | `spam` | aktarılmaz |

### Satış sonrası (Faz 4)

| Tablo | Ana alanlar |
|---|---|
| `crm_siparis` | fırsat, sipariş tarihi, tutar, ödeme planı, teslim tarihi |
| `crm_makine` | sipariş, model, seri no, kurulum tarihi, garanti bitişi, bulunduğu firma |
| `crm_servis` | makine, talep türü (arıza / bakım / yedek parça / eğitim), durum, kapanış |

---

## 6. Mevcut veriden CRM'e

- **Hedef firmalar toplu aktarılmaz** (~10.000 kaydın çoğu hiç cevap vermedi). CRM'e girenler:
  1. satışa iletilen her talep ve e-posta yanıtı. Bugün 24 tane: 18'i tanıtım mailinden, 6'sı organik site formundan.
  2. ilgilendiğini yazan, cevap bekleyen firmalar.
  3. satışın elindeki mevcut ve eski müşteri listesi (Excel ile içe aktarma).
- **Bağ:** CRM firması, panelin hedef firma kaydına `hedef_firma_id` ile bağlanır. O
  firmaya giden tanıtım mailleri ve gelen yanıtlar CRM'in zaman çizelgesinde
  görünür; kopyalanmaz, kaynağından okunur.
- **Talepler:** paneldeki her talep bir fırsata dönüşebilir. "Satışa ilet" düğmesi
  CRM'de fırsatı açar ve satışa bildirim e-postasını gönderir.
- **E-posta:**
  - Tanıtım kutuları zaten IMAP ile okunuyor; yanıtları firma zaman çizelgesine düşer.
  - Satış kutuları bugün Outlook'ta POP3 ile çekiliyor. CRM'de görünmeleri için iki yol var:
    1. **IMAP ile okuma.** Mailler sunucuda kalmalı; Outlook'ta "sunucuda kopya bırak" açık olmalı.
    2. **BCC adresi.** Satışın gönderdiği maillere CRM'e özel bir gizli kopya adresi eklenir.

    Karar bekliyor (soru 4).

---

## 7. Ekranlar — A'dan Z'ye

1. **Pano.** Bugünün görevleri, gecikenler, bu hafta karar bekleyen fırsatlar, yeni
   talepler, son aktiviteler, aşamalara göre fırsat tutarı.
2. **Firmalar.**
   - Liste: filtre (ülke, segment, durum, sorumlu, etiket), arama, Excel'e aktarma.
   - **Firma kartı (360°):** bilgiler, kişiler, açık ve kapanmış fırsatlar, teklifler,
     görevler ve tek **zaman çizelgesi**. Zaman çizelgesinde notlar, aramalar, tanıtım
     mailleri, gelen ve giden yazışmalar, form talepleri, site ziyaretleri sırayla görünür.
3. **Kişiler.** Firma altında birden çok kişi; birincil kişi; iletişim izni ve abonelik
   durumu. Abonelikten çıkan adres CRM'den de mail alamaz.
4. **Fırsatlar.** Liste ve **kanban** (aşamalar sütun, sürükle-bırak). Aşama geçişinde
   zorunlu alanlar (ör. Kaybedildi'de sebep).
5. **Teklifler.**
   - Kalemli teklif, döviz, iskonto, teslim ve ödeme şartları.
   - Servosteel antetli **PDF**, Türkçe ve İngilizce.
   - Sürüm takibi (v1, v2…), müşteriye e-postayla gönderme.
6. **Görevler.** "Benim görevlerim", ekip görevleri, son tarih, tekrar eden görev.
   Fırsat aşamasına bağlı otomatik görev (ör. teklif gönderildi → 3 gün sonra takip).
7. **Takvim.** Görevler, toplantılar ve beklenen karar tarihleri.
8. **E-posta.**
   - Firma kartından şablonlu e-posta gönderme.
   - Gönderilen ve gelen yazışmalar zaman çizelgesinde.
   - Gönderim, panelin kutularını ve kurallarını (engel listesi, imza) kullanır.
9. **Raporlar.**
   - Huni: talep → fırsat → teklif → kazanılan.
   - Kanal, ülke ve ürün başına dönüşüm.
   - Kazanma oranı, ortalama süre, kayıp sebepleri.
   - Sorumlu başına açık iş.
10. **İçe ve dışa aktarma.** Excel ile firma, kişi ve müşteri listesi yükleme; mükerrer
    kontrolü alan adı ve e-postaya göre.
11. **Arama.** Tek kutudan firma, kişi, e-posta, telefon ve teklif numarası.
12. **Bildirimler.** Atanan görev, yaklaşan son tarih, yeni talep; uygulama içinde ve
    günlük özet e-postası.
13. **Ayarlar.** Kullanıcılar ve roller, fırsat aşamaları, kayıp sebepleri, ürün
    listesi, döviz, teklif numarası biçimi, e-posta şablonları.
14. **Satış sonrası (Faz 4).** Siparişler, kurulan makineler (seri no, garanti), servis ve
    yedek parça talepleri.

---

## 8. Roller ve yetki

| Rol | Görür | Yapar |
|---|---|---|
| **Yönetici** | her şey | ayarlar, kullanıcılar, silme, toplu işlemler |
| **Satış** | tüm firmalar ve fırsatlar | fırsat, teklif, görev, aktivite; kendi kayıtlarının sorumlusu |
| **Pazarlama** | firmalar, kişiler, aktiviteler, fırsat aşamaları | firma/kişi ekleme, fırsat açma; teklif tutarlarını görür mü? → karar |
| **Görüntüleyici** | pano ve raporlar | — |

Her kayıtta bir **sorumlu** vardır. Fiyat ve teklif tutarlarının görünürlüğü role bağlıdır.

---

## 9. Kişisel veri ve güvenlik

- **KVKK ve GDPR.** CRM kişi verisi tutar: ad, e-posta, telefon. Müşterilerin bir kısmı AB'de.
  - Amaç satış ilişkisidir; saklama süresi belirlenir.
  - Kişi isterse verisi dışa aktarılır ya da silinir.
  - Abonelikten çıkan (`eposta_engel`) adrese CRM'den de mail gitmez.
- **Oturum.**
  - Güçlü şifre (scrypt), sınırlı oturum süresi.
  - Art arda başarısız girişte kilit.
  - İsteğe bağlı iki aşamalı doğrulama.
- **Denetim kaydı.** Kim neyi ne zaman değiştirdi, eski ve yeni değeriyle.
- **Dosyalar.** Teklif PDF'leri ve müşteri çizimleri depoda değil, sunucuda kalıcı
  birimde durur; herkese açık adresleri yoktur, yalnız oturumla indirilir.
- **Public depo.** Örnek veri, test kaydı ya da ekran görüntüsü depoya girmez.
  Kişi/firma verisi taşıyan geçici dosyalar depo klasörüne konmaz.

---

## 10. Yol haritası

Her faz ayrı yayınlanabilir; bir faz bitmeden sonrakine geçilmez.

| Faz | Kapsam | Bitti sayılır |
|---|---|---|
| **0 — İskelet** | `crm/` Next uygulaması; kök tsconfig/eslint'te `crm` hariç; migration çalıştırıcı; giriş ve roller; Dokploy servisi ve alt alan adı; yedek doğrulaması; boş pano | canlı adreste giriş yapılıyor, site yayını etkilenmiyor |
| **1 — Çekirdek** | firmalar, kişiler, fırsatlar (liste + kanban), aktiviteler/notlar, görevler, arama; satışa iletilmiş 24 kaydın aktarımı; paneldeki "Satışa ilet" → CRM fırsatı | satış yeni talebi CRM'den takip ediyor ve aşamayı kendisi değiştiriyor |
| **2 — Teklif ve e-posta** | kalemli teklif, PDF (TR/EN), sürüm; tanıtım kutularının yazışmaları zaman çizelgesinde; şablonlu e-posta; satış kutuları (karar çıkarsa) | bir teklif CRM'de hazırlanıp PDF olarak müşteriye gidiyor |
| **3 — Rapor ve hatırlatma** | huni, kanal/ülke/ürün dönüşümü, kayıp sebepleri; günlük görev özeti; Excel içe/dışa aktarma | "hangi kanal satış getirdi" sorusu tek ekrandan cevaplanıyor |
| **4 — Satış sonrası** | sipariş, kurulan makine, garanti, servis ve yedek parça talepleri | kurulu bir makinenin servis geçmişi firma kartında görünüyor |

---

## 11. Karar bekleyen sorular

1. **Kullanıcılar.** CRM'i kimler kullanacak, kaç kişi, hangi rollerle? Pazarlama teklif tutarlarını görsün mü?
2. **Adres.** Ayrı alt alan adı (`crm.servosteel.com.tr`) mı, yoksa mevcut sitenin altında `/crm` mi? Öneri: ayrı alt alan adı.
3. **Giriş.** CRM kendi kullanıcı tablosunu mu tutsun, yoksa panelin kullanıcılarıyla mı girilsin? Öneri: kendi tablosu.
4. **Satış kutuları.** Satışın yazışmaları CRM'de görünsün mü? Görünecekse hangi yolla: IMAP (POP3'ten geçiş) mi, BCC adresi mi?
5. **Teklif.** Teklifler CRM'de mi hazırlansın (kalem, fiyat, PDF), yoksa mevcut Excel/PDF teklifler yalnız dosya olarak mı yüklensin? Hangi dövizler (EUR, USD, TRY)?
6. **Mevcut müşteriler.** Satışın elinde eski ve mevcut müşteri listesi var mı? Varsa hangi biçimde?
7. **Satış sonrası.** Kurulum, garanti ve servis takibi bu projenin kapsamında mı?
8. **Mobil.** Fuarda ya da ziyarette telefondan kayıt girmek gerekiyor mu? Gerekiyorsa ekranlar telefona öncelikli tasarlanır.

---

## 12. Sonraki adım

Sorular cevaplanınca bu belge güncellenir ve Faz 0 başlar. Faz 0'ın ilk işi kök
projenin derlemesinden `crm/` klasörünü hariç tutmak; böylece CRM üzerinde çalışırken
site yayını hiçbir an etkilenmez.

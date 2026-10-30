# Servosteel CRM

Sitenin deposunda duran **ayrı** Next.js uygulaması. Sitenin veritabanını kullanır;
tabloları `crm_` önekli. Plan ve kararlar: [PLAN.md](PLAN.md).

> Depo herkese açık. Müşteri verisi (Excel, aktarım JSON'u, ekran görüntüsü) bu
> klasöre konmaz; veri yalnız veritabanında durur.

## Yerelde çalıştırma

```bash
cd crm
npm install
cp .env.example .env.local   # DATABASE_URL'i doldur
npm run goc                  # şemayı kur / güncelle
npm run dev                  # http://localhost:3100
```

`.env.local`'da `CRM_GELISTIRME_GIRIS=1` varsa `next dev` girişsiz açılır
(geliştirici oturumu). Canlıda bu değişkenin etkisi yoktur.

## Kullanıcı açma

İlk yönetici komut satırından açılır, parola gizli girişle sorulur:

```bash
npm run kullanici-ekle -- yasin yonetici "Yasin Gülsoy"
```

Sonrakiler CRM'deki **Kullanıcılar** sayfasından. Roller: yönetici, satış,
pazarlama, görüntüleyici.

## Etkinlikten toplu aktarma

Fuarda toplanan liste önce aktarım JSON'una çevrilir (depo dışında tutulur), sonra:

```bash
node scripts/etkinlik-aktar.mjs --dosya <yol.json> --etkinlik <id>          # kuru
node scripts/etkinlik-aktar.mjs --dosya <yol.json> --etkinlik <id> --yaz
```

Aynı firma (alan adı ya da ad), aynı kişi (e-posta) ve aynı görüşme ikinci kez
yazılmaz; betik tekrar çalıştırılabilir.

## Panelden satışa iletilenler

**Kendiliğinden (30 Ekim 2026'dan beri):** sitenin panelinden ya da Claude'un e-posta
ucundan giden bir e-postanın alıcıları arasında satış adresi (info@, yavuz@,
agil@) varsa, gönderim sonrasında CRM'e "Yeni talep" yazılır
(`src/lib/crm-bag.ts`, sitenin kodunda). İki durumda çalışır:
- **Talep iletiliyorsa:** paneldeki "Talebi ilet" ya da `posta.mjs gonder … --talep 37`.
- **Gelen mail iletiliyorsa:** iletilen mail tanıtım listesindeki bir firmadan
  gelmişse. Eşleştirme sırası: mailin kimliği, gönderen adres, kurumsal alan adı.

CRM'e yazılamazsa e-posta yine gider; hata panelin Kayıtlar sayfasına düşer.

Geçmişi bir kez aktarmak için betik (aynı kurallar, tekrar çalıştırılabilir):

```bash
node scripts/panel-aktar.mjs            # kuru
node scripts/panel-aktar.mjs --yaz
```

Betik, panelde durumu "yeni" dışındaki her talebi ve notunda "satışa iletildi"
geçen hedef firmanın son yanıtını aktarır. Kanal kendiliğinden bulunur:
tanıtım mailinin bağlantısından gelen ya da maili aldıktan sonra yazan
"tanıtım maili", diğer formlar "site formu".

## Dokploy

- Yeni uygulama, aynı GitHub deposu, dal `main`, **derleme yolu `/crm`**.
- Ortam: `DATABASE_URL` (sitenin aynısı), gerekiyorsa `DATABASE_SSL=off`.
  `CRM_GELISTIRME_GIRIS` **konmaz**.
- Alan adı: `crm.servosteel.com.tr` (DNS'te A kaydı sunucuya).
- `npm start` önce bekleyen şema göçlerini uygular, sonra uygulamayı açar.

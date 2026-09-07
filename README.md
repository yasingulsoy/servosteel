# Servosteel

servosteel.com.tr — rulo işleme ve roll form makineleri üreticisinin kurumsal
sitesi. **Canlıda**; her değişiklik gerçek trafiği etkiler.

Next.js 16 · React 19 · next-intl 4 · Tailwind 4 · MDX içerik

## Komutlar

```bash
npm run dev        # geliştirme sunucusu
npm run build      # üretim derlemesi
npm run lint       # eslint
npm run kontrol    # yayın sonrası 14 canlı kontrol
npm run indexnow   # yeni URL'leri Bing + Yandex'e bildir
```

Yayından sonra sırayla: `npm run kontrol`, yeni URL eklendiyse `npm run indexnow`.

## Dokuz dil

`tr en de es it hu pl ru ar` — varsayılan **tr**, Arapça RTL.

Yollar dile göre çevrilir (`/makineler/rulo-acicilar` → `/en/machines/decoilers`).
Çeviri tablosu `src/i18n/slugs.ts`'ten **üretilir**; elle tutulan ikinci bir liste
yok, o yüzden ayrışamazlar. Ayrıntı ve gerekçeler `src/i18n/routing.ts` başındaki
açıklamada.

| yer | ne |
|---|---|
| `src/messages/*.json` | 9 dilin tüm metni |
| `src/i18n/slugs.ts` | slug tablosu — yol üretiminin tek kaynağı |
| `src/content/akademi/<dil>/*.mdx` | blog yazıları |
| `src/lib/catalog.ts` | ürün listesi ve sayfa üretimi |

## Bilmeden dokunulmayacak üç şey

1. **Locale JSON'a `JSON.parse` → `stringify` yapılmaz.** Metin cerrahisiyle
   düzenlenir; aksi hâlde dosyanın tamamı yeniden biçimlenir ve diff okunmaz olur.
2. **`next-intl`'in `Link`'i dil önekini kendi ekler.** MDX içinde iç yol yazılır
   (`/makineler`), `/en/machines` değil — yoksa `/en/en/machines` çıkar, 404 verir.
3. **`next.config.ts`'teki `both()` canlı bir yol için kullanılmaz.** Hem
   `/product/x` hem `/x` üretir; `/x → /x` sonsuz döngü olur ve **build tertemiz
   geçer**. Bir kez yaşandı, üç ürün sayfası erişilemez oldu.

Bu üçünün ve diğer tuzakların tam listesi: [KONTROL.md](KONTROL.md) §E.

## Belgeler

| dosya | ne |
|---|---|
| [AGENTS.md](AGENTS.md) | bu Next.js sürümü eğitim verisinden farklı — kod yazmadan önce oku |
| [SEO.md](SEO.md) | ölçüm, rakip analizi, kelime verisi, yol haritası |
| [KONTROL.md](KONTROL.md) | açık işler + tuzaklar. Kapanan madde oradan silinir |
| [belgeler/](belgeler/) | katalog PDF'i, katalogdan çıkarılan veriler, firmaya giden belgeler |

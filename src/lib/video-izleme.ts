/**
 * Video izleme sayfaları — hangi videonun kendi sayfası var, adresi ne.
 *
 * Neden var (2026-10-11): Search Console'da 229 video "izleme sayfasında
 * değil" diye dizin dışıydı. Videolar ürün sayfalarında ve /videolar
 * listesinde YouTube'a giden küçük resim olarak duruyor; Google bir videoyu
 * video sonuçlarına ancak oynatıcının sayfanın ana içeriği olduğu sayfadan
 * alır. Yasin'in kararı: oynatıcı YALNIZ bu sayfalarda (gömülü izlenme de
 * YouTube kanalına sayılır); liste ve ürün sayfaları YouTube'a gitmeye devam
 * eder (17 Eylül kararı, bkz. video-card.tsx).
 *
 * Yalnız çevrilmiş başlığı olan 25 seçkin video: başlığı dokuz dilde elle
 * yazılmış olmayan videonun sayfası dokuz dilde aynı İngilizce/Türkçe
 * YouTube başlığını taşırdı — ince ve tekrar eden sayfa.
 *
 * `tr` Türkçe adres (kök), `en` diğer sekiz dilin adresi — slugs.ts'teki
 * düzenin aynısı. Saf veri: slugs.ts bunu okuyor, bu dosya hiçbir şey
 * import etmez (döngü olmasın). Adres bir kez yayınlandıktan sonra
 * DEĞİŞTİRİLMEZ; başlık değişse bile.
 */
export const IZLEME_SAYFALARI = [
  { id: "h7aPJ6rJc_U", tr: "rulo-sac-dilme-hatti-komple-hat", en: "coil-slitting-line-decoiler-to-recoiler" },
  { id: "GEYcBSPqutQ", tr: "dilme-hatti-bicak-grubu-gergin-sarma", en: "slitting-line-knife-set-tension-recoiling" },
  { id: "hc_Znq2u8MI", tr: "dilme-ve-delik-delme-hatti", en: "combined-slitting-and-punching-line" },
  { id: "JOHZwMBLqKo", tr: "dilme-ile-boy-kesme-tek-hatta", en: "slitting-and-cut-to-length-on-one-line" },
  { id: "4QETxHS-CD4", tr: "boy-kesme-hatti-komple-hat-calismasi", en: "cut-to-length-line-full-line-in-operation" },
  { id: "mwZx6X1mV0c", tr: "boy-kesme-giyotin-ve-istifleme-unitesi", en: "cut-to-length-shear-and-stacking-unit" },
  { id: "H-h-IF4QbUI", tr: "kenar-ve-boy-kesme-hatti", en: "edge-trimming-and-cut-to-length-line" },
  { id: "_lOTZE21aGE", tr: "klima-santrali-sac-isleme-hatti", en: "sheet-processing-line-for-air-handling-units" },
  { id: "kQbK5kXquaY", tr: "birlesik-krallik-solar-c-profil-hatti-otomatik-istifleyici", en: "solar-c-profile-line-uk-automatic-stacker" },
  { id: "qmWM1NgcACw", tr: "yapisal-u-c-profil-hatti-350x5-mm", en: "structural-u-c-profile-line-350x5-mm" },
  { id: "NR25bt36uQg", tr: "hmi-ve-uretim-raporlama-yazilimi", en: "hmi-and-production-reporting-software" },
  { id: "UCeR9epppK8", tr: "otomatik-istifleyici-u-ve-c-profil", en: "automatic-stacker-u-and-c-profiles" },
  { id: "MaJswAJo8JQ", tr: "kablo-kanali-uretim-hatti", en: "cable-tray-production-line" },
  { id: "J-O8xfI2ovA", tr: "agir-hizmet-raf-profili-hatti", en: "heavy-duty-rack-profile-line" },
  { id: "3xmcJvv6LNc", tr: "solar-panel-profil-hatti", en: "solar-panel-profile-line" },
  { id: "5vVTpg3hltE", tr: "sigma-ve-solar-c-profil-hatti", en: "sigma-and-solar-c-profile-line" },
  { id: "tm520w7WsBI", tr: "solar-c-profil-uretim-hatti", en: "solar-c-profile-production-line" },
  { id: "2tgCtC8n_1E", tr: "pres-besleme-sistemleri-genel-tanitim", en: "press-feeding-systems-overview" },
  { id: "ONmiUo8vtvk", tr: "kompakt-hat-acici-dogrultucu-surucu", en: "compact-line-decoiler-straightener-feeder" },
  { id: "a7W3BzFYiow", tr: "sahada-pres-besleme-otomotiv-presi", en: "press-feeding-on-site-automotive-press" },
  { id: "7RcuUmfN7QE", tr: "kompakt-hat-testi-srv606-srv3000", en: "compact-line-test-srv606-srv3000" },
  { id: "P3zbB3c6NBY", tr: "srv504-dogrultmali-servo-surucu-ve-acici", en: "srv504-straightener-servo-feeder-and-decoiler" },
  { id: "bc5nAkQXJTw", tr: "mds302-mini-dogrultmali-surucu-ve-srv500-acici", en: "mds302-mini-straightener-feeder-and-srv500-decoiler" },
  { id: "AqcEyDbbWtA", tr: "hidrolik-rulo-acici-fren-balata-sistemi", en: "hydraulic-decoiler-brake-pad-system" },
  { id: "v9_1snhusMY", tr: "hidrolik-rulo-sarici", en: "hydraulic-recoiler" },
] as const;

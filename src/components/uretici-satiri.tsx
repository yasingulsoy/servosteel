/**
 * Başlığın hemen altındaki "üretici künyesi": kim üretiyor, nerede, hangi
 * kapasitede — tek satırda.
 *
 * NEDEN VAR: 24 Eylül 2026 yapay zeka görünürlük ölçümünde 12 sorunun
 * yalnızca 3'ünde anıldık ve kaçırdıklarımızın örüntüsü netti — soru
 * "Türkiye'de" demeyip doğrudan ürünü sorduğunda ("cable tray roll forming
 * machine manufacturer recommendations") yokuz. Asistanın o cevabı kurarken
 * okuduğu kaynaklar rakiplerin KENDİ siteleriydi (stam.it 4 cevapta,
 * bosporas.com 3, athader.com 3). Bizim sitemiz de 3 cevapta kaynaktı, yani
 * okunuyoruz; eksik olan, sayfanın "bu makineyi Servosteel üretir, İstanbul'da,
 * şu aralıkta" cümlesini hiç kurmamasıydı. Ürün anlatılıyordu, üretici değil.
 *
 * Asistandan gelen ziyaretçi ölçülen en iyi dönüşen kanal (%4,00; organik arama
 * %0,47), o yüzden buradaki her kayıp cevap doğrudan taleptir.
 *
 * Cümle üründen bağımsız ve yer tutucusuz: ürün adı zaten hemen üstteki H1'de
 * yazıyor, tekrarı hem okuyucuya gürültü hem de dokuz dilde cins/hâl uyumu
 * riski olurdu. Özet, sayfanın KENDİ tablosunun ilk üç satırından üretiliyor —
 * ayrı bir yerde tutulan ikinci bir doğruluk kaynağı yok, tablo değişince bu
 * satır da değişir.
 */
export function UreticiSatiri({
  cumle,
  satirlar,
}: {
  /** detail.ureticiSatiri — "Üretici: Servosteel — İstanbul, Türkiye. …" */
  cumle: string;
  /** Spec tablosunun satırları ([etiket, değer]); ilk üçü kullanılır, yoksa boş geçilir */
  satirlar?: string[][];
}) {
  const ozet = (satirlar ?? [])
    .slice(0, 3)
    .filter((s) => s[0] && s[1])
    .map((s) => `${s[0]} ${s[1]}`)
    .join(" · ");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8">
      <p className="text-sm leading-relaxed text-muted">
        <span className="font-semibold text-ink">{cumle}</span>
        {ozet ? <> {ozet}</> : null}
      </p>
    </div>
  );
}

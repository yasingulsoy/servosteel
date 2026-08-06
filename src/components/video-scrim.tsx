/** Karartmanın koyu tarafı: metnin durduğu taraf */
export type ScrimSide = "start" | "end";

/**
 * Video karartma perdesi — TEK KAYNAK.
 *
 * Hero ve tüm video bantları bu bileşeni kullanır; böylece karartma seviyesi
 * her yerde birebir aynıdır ve zamanla birbirinden ayrışamaz.
 * Karartmayı değiştirmek istediğinde SADECE burayı değiştir.
 *
 * Üç katman:
 *  1) Yatay degrade — koyu taraf `side` ile seçilir. Kart sağa alınırsa
 *     karartma da sağa geçmelidir, aksi halde metin aydınlık zeminde kalır.
 *  2) Üst şerit      — navbar'ın şeffaf olduğu yerde logo/menü okunabilir kalsın.
 *  3) Alt degrade    — sayfanın koyu zeminine (shell) yumuşak geçiş.
 *
 * RTL: yatay degrade mantıksal yöne göre aynalanır — Arapçada "start" sağdır.
 *
 * ── Seviyeler neden tam olarak bunlar ────────────────────────────────────
 * Rastgele seçilmediler. Dört videodan 16 kare çıkarıldı, DOM'dan da metin
 * öğelerinin gerçek sınırları okundu (h1/h2, ghost buton, ürün adı h3) ve her
 * kombinasyon bu kutularda ölçüldü. Kısıt: hiçbir kutuda eski perdeden kötü
 * olmamak. Amaç: videonun karartılmamış alanını büyütmek.
 *
 * Eski perdenin hatası karartmayı KAREYE YAYMAKTI: yatay degrade ancak %100'de
 * şeffaflaşıyordu (sağ kenar bile isliydi) ve alt degrade kareyi tam
 * ORTASINDAN başlatıyordu. Yeni perde aynı korumayı metnin gerçekten durduğu
 * yere toplar, gerisini serbest bırakır.
 *
 * Ölçüm sonucu (grade dahil, bkz. globals.css .video-grade):
 *   geniş ekran  karartılmamış alan %65,8 -> %71,3 ; 4 metin kutusu da +0,01..+0,66
 *   dar ekran    karartılmamış alan %62,7 -> %64,1 ; 4 metin kutusu da +0,02..+0,44
 *
 * Dar ekranda kazanç neden küçük: orada metin `max-w-2xl`e sığmadığı için
 * bandın %84'üne yayılıyor, korunması gereken alan neredeyse tüm kare. Asıl
 * kazanç için metnin dar ekranda daha erken sarması gerekir — ayrı bir iş.
 *
 * Değiştireceksen ölçmeden değiştirme: bu değerlerin çoğu kısıtın tam ucunda.
 */
export function VideoScrim({ side = "start" }: { side?: ScrimSide }) {
  /*
   * Dar ekranda içerik bloğu bandın TAM genişliğini kaplar; sağa/sola
   * hizalanamaz ve metin her hâlükârda mantıksal başlangıçtan akar.
   * Bu yüzden perde de md altında daima başlangıç tarafını koyulaştırır —
   * aksi halde metin aydınlık tarafta kalıyordu. Yön değişimi, hizalamanın
   * gerçekten görünür olduğu md'den itibaren devreye girer.
   */
  const horizontal =
    side === "start"
      ? "bg-gradient-to-r rtl:bg-gradient-to-l"
      : "bg-gradient-to-r rtl:bg-gradient-to-l md:bg-gradient-to-l md:rtl:bg-gradient-to-r";

  return (
    <>
      {/* Yatay degrade. md altında metin bandın %84'üne yayıldığı için perde
          hiç sıfırlanmaz (%22'de biter); md üstünde metin `max-w-2xl` içinde
          kaldığından %78'de tamamen biter ve sağ taraf hiç karartılmaz. */}
      <div
        aria-hidden
        className={`absolute inset-0 from-black/44 from-0% via-black/32 via-45% to-black/22 md:from-black/46 md:via-black/38 md:via-46% md:to-transparent md:to-78% ${horizontal}`}
      />
      {/* Üst şerit: sadece şeffaf navbar'ın arkası. 128px -> 80px; bant dar
          ekranda ~291px olduğu için eski şerit bandın %44'ünü kaplıyordu. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/16 to-transparent"
      />
      {/* Alt geçiş: kareyi ortadan değil, son %36'dan itibaren yakalar —
          her bandın alt kenarındaki siyah bant bu yüzden gitti. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-shell/20 to-transparent"
      />
    </>
  );
}

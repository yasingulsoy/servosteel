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
      <div
        aria-hidden
        className={`absolute inset-0 from-black/45 via-black/20 to-transparent ${horizontal}`}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-shell/55 via-transparent to-transparent"
      />
    </>
  );
}

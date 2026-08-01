/**
 * Video karartma perdesi — TEK KAYNAK.
 *
 * Hero ve tüm video bantları bu bileşeni kullanır; böylece karartma seviyesi
 * her yerde birebir aynıdır ve zamanla birbirinden ayrışamaz.
 * Karartmayı değiştirmek istediğinde SADECE burayı değiştir.
 *
 * Üç katman:
 *  1) Yatay degrade — soldan sağa açılır (hero'da metnin durduğu taraf koyu).
 *  2) Üst şerit      — navbar'ın şeffaf olduğu yerde logo/menü okunabilir kalsın.
 *  3) Alt degrade    — sayfanın koyu zeminine (shell) yumuşak geçiş.
 */
export function VideoScrim() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent rtl:bg-gradient-to-l"
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

/**
 * Masaüstünde menünün açık tutulup tutulmadığı.
 *
 * localStorage'da DEĞİL çerezde: sunucu sayfayı doğru genişlikle çizsin
 * diye. localStorage'dan okunsaydı her sayfa açılışında menü önce dar
 * çizilip hemen ardından genişlerdi, içerik de onunla birlikte zıplardı.
 *
 * Ayrı dosyada, çünkü hem sunucu kabuğu hem istemci kabuğu okuyor —
 * "use client" dosyasından dışa aktarılan bir sabit sunucuda düz metin
 * olarak gelmez.
 */
export const MENU_CEREZ = "sv_menu";

/**
 * Sayfadaki bir araçtan aynı sayfadaki teklif formunu doldurma.
 *
 * Rulo sac hesaplayıcısı (coil-calculator.tsx) ile teklif formu
 * (quick-quote-form.tsx) sunucu sayfasında kardeş bileşenler; ortak bir
 * React durumu yok. Pencereye atılan tek bir olay ikisini bağlıyor — form
 * yalnızca `prefill` verilen yerde dinliyor, başka sayfadaki formlar
 * etkilenmiyor.
 *
 * NEDEN: hesaplayıcı sitenin en çok gösterim alan sayfası. Hesabı yapan
 * ziyaretçinin ölçüleri zaten ekranda; teklif formuna yeniden yazdırmak onu
 * kaybettiren adımdı.
 */
export const TEKLIF_DOLDUR = "servosteel:teklif-doldur";

export type TeklifDoldurDetay = {
  /** Mesaj kutusuna yazılacak metin (ziyaretçi göndermeden önce düzenleyebilir) */
  message: string;
  /** Gizli ürün alanı — e-posta konusuna düşer */
  product?: string;
};

export function teklifDoldur(detay: TeklifDoldurDetay) {
  window.dispatchEvent(new CustomEvent<TeklifDoldurDetay>(TEKLIF_DOLDUR, { detail: detay }));
}

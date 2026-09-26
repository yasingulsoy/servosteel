import { redirect } from "next/navigation";

/**
 * Eski gelen kutusu — yerini panelin e-posta istemcisi aldı (/admin/eposta:
 * hesap seçimi, Gelen/Gönderilmiş, okuma, yanıt). Yer imleri ve eski
 * bağlantılar bozulmasın diye yalnızca yönlendiriyor.
 */
export default function EskiGelen() {
  redirect("/admin/eposta");
}

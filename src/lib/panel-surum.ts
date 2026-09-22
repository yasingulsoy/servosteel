import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Çalışan derlemenin kimliği — her deploy'da değişir (`next build` yazar:
 * .next/BUILD_ID). Panel sayfası bunu çizer, dakikalık nabız (api/nabiz)
 * sunucunun şimdiki kimliğini döner; ikisi ayrışırsa sekme deploy'dan ÖNCE
 * açılmış demektir.
 *
 * Neden gerekli: Next sunucu eylemlerinin kimliği her derlemede değişiyor.
 * Deploy'dan önce açık kalan sekme eski kimlikle istek atınca sunucu 404
 * dönüyor ("Server Action … was not found", Yasin 2026-09-22). Sekme bunu
 * ÖNCEDEN bilirse "Panel güncellendi — yenileyin" der, düğmeye basınca
 * hata vermez.
 *
 * Dosya okunamazsa (next dev) sürecin açılış anı — süreç içinde sabit.
 */
export function panelSurumu(): string {
  const g = globalThis as { __servosteelPanelSurum?: string };
  if (!g.__servosteelPanelSurum) {
    try {
      g.__servosteelPanelSurum = readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
    } catch {
      g.__servosteelPanelSurum = `acilis-${Date.now().toString(36)}`;
    }
  }
  return g.__servosteelPanelSurum;
}

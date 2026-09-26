import { cookies } from "next/headers";
import { rolu } from "@/lib/admin-auth";
import { DURUMLAR, DURUM_ETIKET, durumSayilari } from "@/lib/leads-db";
import { bekleyenYanitSayisi } from "@/lib/gelen-db";
import { panelSurumu } from "@/lib/panel-surum";
import { takipSayisi } from "@/lib/takip";
import { PanelKabugu, type PanelBolum } from "./kabuk-istemci";
import { MENU_CEREZ } from "./menu-tercihi";

export type { PanelBolum };

/**
 * Panel kabuğu — sunucu tarafı. Rolü, talep sayılarını ve menü tercihini
 * okur; çizimi `kabuk-istemci.tsx` yapar.
 *
 * Ortak bir `layout.tsx`'e TAŞINMADI. Düzenler sayfalar arası gezinmede
 * yeniden çizilmez; menüdeki talep sayıları, sayfa yenilenene kadar bayat
 * kalırdı. Her sayfa kendi kabuğunu çizdiği için sayılar her gezinmede taze.
 */
export async function Kabuk({
  aktif,
  durum,
  kullanici,
  children,
}: {
  aktif: PanelBolum;
  /** Talepler sayfasındaki seçili süzgeç; süzgeçsizse "tumu". */
  durum?: string;
  kullanici: string;
  children: React.ReactNode;
}) {
  const [rol, sayilar, yanit, takip, cerez] = await Promise.all([
    rolu(kullanici),
    /* Okunamazsa menüde "0" YAZILMIYOR — "0 yeni talep" yanlış bilgi
       olurdu. Sayı rozetleri tamamen gizleniyor. */
    durumSayilari().catch(() => null),
    /* Tablo henüz kurulmamışsa (şema yoksa) rozet 0 — menü yine çizilir. */
    bekleyenYanitSayisi().catch(() => 0),
    /* Günü gelen takip — Genel bakış rozeti. Sütunlar yoksa 0. */
    takipSayisi().catch(() => 0),
    cookies(),
  ]);

  const adet = new Map((sayilar ?? []).map((s) => [s.durum, Number(s.adet)]));

  return (
    <PanelKabugu
      aktif={aktif}
      durum={durum}
      kullanici={kullanici}
      surum={panelSurumu()}
      admin={rol === "admin"}
      yanitSayisi={yanit}
      takipSayisi={takip}
      ilkSabit={cerez.get(MENU_CEREZ)?.value === "acik"}
      durumlar={DURUMLAR.map((d) => ({
        anahtar: d,
        etiket: DURUM_ETIKET[d],
        adet: sayilar ? (adet.get(d) ?? 0) : null,
      }))}
      toplam={sayilar ? sayilar.reduce((a, s) => a + Number(s.adet), 0) : null}
    >
      {children}
    </PanelKabugu>
  );
}

import { NextResponse } from "next/server";
import { oturum } from "@/lib/admin-auth";
import { panelSurumu } from "@/lib/panel-surum";

/**
 * Panelin dakikalık nabzı (kabuk-istemci.tsx): oturumun son etkinliğini
 * günceller ve çalışan derlemenin kimliğini döner.
 *
 * Sunucu eylemi DEĞİL, sabit adresli uç: eylem kimliği her derlemede
 * değiştiği için deploy'dan önce açık kalan sekmenin nabzı her dakika 404
 * alıyordu. Bu adres deploy'dan deploy'a aynı; dönen `surum` sayfanınkinden
 * farklıysa sekme "Panel güncellendi" der.
 */
export const dynamic = "force-dynamic";

export async function POST() {
  const ben = await oturum();
  return NextResponse.json(
    { surum: panelSurumu(), oturum: !!ben },
    { status: ben ? 200 : 401, headers: { "Cache-Control": "no-store" } }
  );
}

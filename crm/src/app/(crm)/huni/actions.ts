"use server";

import { revalidatePath } from "next/cache";
import { sayi } from "@/lib/bicim";
import { islem } from "@/lib/db";
import { temasGorevi } from "@/lib/gorev-oto";
import { kayitEkle } from "@/lib/kayit";
import { yazarZorunlu } from "@/lib/oturum";
import { TAKIP } from "@/lib/sabitler";

/**
 * Satış hunisinde kartı başka aşamaya taşır. Firmalardaki takipDegistir ile
 * aynı iş (son temas bugün, otomatik görevler), ama sayfa yönlendirmeden.
 */
export async function asamaDegistir(temasId: number, takip: string): Promise<void> {
  const ben = await yazarZorunlu();
  const id = sayi(temasId);
  if (!id) throw new Error("Görüşme yok.");
  if (!(takip in TAKIP)) throw new Error("Aşama tanınmıyor.");
  const r = await islem(async (b) => {
    const t = (
      await b.query<{ firma_id: number }>(
        `UPDATE crm_temas SET takip = $2, son_temas = (now() AT TIME ZONE 'Europe/Istanbul')::date, guncellendi = now()
          WHERE id = $1 RETURNING firma_id`,
        [id, takip],
      )
    ).rows[0];
    if (t) await temasGorevi(b, { id, firmaId: t.firma_id, takip }, ben);
    return t;
  });
  if (!r) throw new Error("Görüşme bulunamadı.");
  await kayitEkle(ben, "takip_degistir", `firma #${r.firma_id}`, `${takip} (huni)`);
  revalidatePath("/huni");
  revalidatePath(`/firmalar/${r.firma_id}`);
}

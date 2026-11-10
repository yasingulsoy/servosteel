import { Listeler } from "@/components/formlar";
import { Kabuk } from "@/components/kabuk";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { bildirimler } from "@/lib/talepler";
import { ROL } from "@/lib/sabitler";
import { kullanilanSektorler } from "@/lib/veri";
import { cikisEylemi } from "../giris/actions";

export const dynamic = "force-dynamic";

export default async function CrmDuzeni({ children }: { children: React.ReactNode }) {
  const ben = await oturumZorunlu();
  const [sektorler, bildirim] = await Promise.all([kullanilanSektorler(), bildirimler(ben.kullanici)]);
  return (
    <Kabuk
      ad={ben.ad || ben.kullanici}
      rol={ROL[ben.rol]}
      yonetici={ben.rol === "yonetici"}
      yazabilir={yazabilir(ben)}
      bildirim={bildirim}
      cikis={cikisEylemi}
    >
      <Listeler sektorler={sektorler} />
      {children}
    </Kabuk>
  );
}

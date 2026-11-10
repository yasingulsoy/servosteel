import { Listeler } from "@/components/formlar";
import { Kabuk } from "@/components/kabuk";
import { oturumZorunlu, yazabilir } from "@/lib/oturum";
import { ROL } from "@/lib/sabitler";
import { kullanilanSektorler } from "@/lib/veri";
import { cikisEylemi } from "../giris/actions";

export const dynamic = "force-dynamic";

export default async function CrmDuzeni({ children }: { children: React.ReactNode }) {
  const ben = await oturumZorunlu();
  const sektorler = await kullanilanSektorler();
  return (
    <Kabuk
      ad={ben.ad || ben.kullanici}
      rol={ROL[ben.rol]}
      yonetici={ben.rol === "yonetici"}
      yazabilir={yazabilir(ben)}
      cikis={cikisEylemi}
    >
      <Listeler sektorler={sektorler} />
      {children}
    </Kabuk>
  );
}

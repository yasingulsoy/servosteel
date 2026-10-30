import { POTANSIYEL, POTANSIYEL_RENK, TAKIP, TAKIP_RENK } from "@/lib/sabitler";

export function Rozet({ sinif, children }: { sinif: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${sinif}`}>
      {children}
    </span>
  );
}

export function TakipRozeti({ takip }: { takip: keyof typeof TAKIP | null }) {
  if (!takip) return null;
  return <Rozet sinif={TAKIP_RENK[takip]}>{TAKIP[takip]}</Rozet>;
}

export function PotansiyelRozeti({ p }: { p: keyof typeof POTANSIYEL }) {
  return <Rozet sinif={POTANSIYEL_RENK[p]}>{POTANSIYEL[p]}</Rozet>;
}

export function IlgiEtiketleri({ ilgiler }: { ilgiler: string[] }) {
  if (!ilgiler.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {ilgiler.map((i) => (
        <Rozet key={i} sinif="bg-amber-50 text-amber-900 ring-1 ring-amber-200">
          {i}
        </Rozet>
      ))}
    </div>
  );
}

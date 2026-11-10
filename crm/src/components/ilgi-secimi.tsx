import type { IlgiAlani } from "@/lib/veri";

/** İlgi alanı onay kutuları, gruplara ayrılmış. Form alanı adı: "ilgi" (çoklu). */
export function IlgiSecimi({ ilgiler, secili = [] }: { ilgiler: IlgiAlani[]; secili?: string[] }) {
  const gruplar = new Map<string, IlgiAlani[]>();
  for (const i of ilgiler) gruplar.set(i.grup, [...(gruplar.get(i.grup) ?? []), i]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...gruplar].map(([grup, liste]) => (
        <fieldset key={grup}>
          <legend className="mb-2 text-sm font-medium text-gray-700">{grup}</legend>
          <div className="space-y-1">
            {liste.map((i) => (
              <label key={i.kod} className="flex cursor-pointer items-start gap-2.5 text-theme-sm text-gray-700">
                <input
                  type="checkbox"
                  name="ilgi"
                  value={i.kod}
                  defaultChecked={secili.includes(i.kod)}
                  className="mt-0.5 size-4 shrink-0 rounded accent-brand-500"
                />
                {i.ad}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

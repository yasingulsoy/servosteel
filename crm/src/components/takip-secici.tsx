"use client";

import { ChevronDown } from "lucide-react";
import { TAKIP, TAKIP_RENK } from "@/lib/sabitler";

/** Takip durumunu listeden değiştirir; seçince form kendiliğinden gönderilir. */
export function TakipSecici({
  eylem,
  temasId,
  takip,
  geri,
  yazabilir,
}: {
  eylem: (fd: FormData) => Promise<void>;
  temasId: number;
  takip: keyof typeof TAKIP;
  geri: string;
  yazabilir: boolean;
}) {
  if (!yazabilir) {
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-theme-xs font-medium whitespace-nowrap ${TAKIP_RENK[takip]}`}>
        {TAKIP[takip]}
      </span>
    );
  }
  return (
    <form action={eylem}>
      <input type="hidden" name="temas_id" value={temasId} />
      <input type="hidden" name="geri" value={geri} />
      <span className="relative inline-flex">
        <select
          name="takip"
          defaultValue={takip}
          aria-label="Takip durumu"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className={`cursor-pointer appearance-none rounded-full border-0 py-0.5 ps-2.5 pe-6 text-theme-xs font-medium outline-none focus:ring-3 focus:ring-brand-500/10 ${TAKIP_RENK[takip]}`}
        >
          {Object.entries(TAKIP).map(([k, v]) => (
            <option key={k} value={k} className="bg-white text-gray-700">
              {v}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute end-2 top-1/2 -translate-y-1/2 opacity-70" />
      </span>
    </form>
  );
}

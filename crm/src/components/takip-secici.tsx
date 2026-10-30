"use client";

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
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TAKIP_RENK[takip]}`}>{TAKIP[takip]}</span>;
  }
  return (
    <form action={eylem}>
      <input type="hidden" name="temas_id" value={temasId} />
      <input type="hidden" name="geri" value={geri} />
      <select
        name="takip"
        defaultValue={takip}
        aria-label="Takip durumu"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`cursor-pointer rounded-full border-0 px-2 py-0.5 text-xs font-medium outline-none ${TAKIP_RENK[takip]}`}
      >
        {Object.entries(TAKIP).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </form>
  );
}

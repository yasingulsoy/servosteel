"use client";

import { useActionState } from "react";
import { parolamiDegistirEylemi } from "../actions";

const ALAN =
  "mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base outline-none focus-visible:border-accent sm:text-sm";

export function ParolaFormu() {
  const [sonuc, gonder, bekliyor] = useActionState(parolamiDegistirEylemi, null);
  const basarili = sonuc === "Parolanız değişti.";

  return (
    <form action={gonder} className="mt-5 space-y-4">
      <label className="block text-sm font-medium">
        Mevcut parola
        <input
          name="mevcut"
          type="password"
          autoComplete="current-password"
          required
          className={ALAN}
        />
      </label>

      <label className="block text-sm font-medium">
        Yeni parola
        <input
          name="yeni"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={ALAN}
        />
        <span className="mt-1 block text-xs font-normal text-muted">
          En az 8 karakter.
        </span>
      </label>

      {sonuc ? (
        <p
          role={basarili ? "status" : "alert"}
          className={`text-sm font-medium ${basarili ? "text-emerald-700" : "text-red-600"}`}
        >
          {sonuc}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={bekliyor}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-60 sm:w-auto"
      >
        {bekliyor ? "Değiştiriliyor…" : "Parolayı değiştir"}
      </button>
    </form>
  );
}

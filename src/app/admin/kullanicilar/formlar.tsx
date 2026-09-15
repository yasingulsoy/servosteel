"use client";

import { useActionState } from "react";
import { kullaniciEkleEylemi, kullaniciSilEylemi } from "../actions";

const ALAN =
  "mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base outline-none focus-visible:border-accent sm:text-sm";

export function KullaniciFormu() {
  const [hata, gonder, bekliyor] = useActionState(kullaniciEkleEylemi, null);

  return (
    <form action={gonder} className="mt-5 space-y-4">
      <label className="block text-sm font-medium">
        Kullanıcı adı
        <input
          name="kullanici"
          autoComplete="off"
          required
          placeholder="ör. filiz"
          className={ALAN}
        />
      </label>

      <label className="block text-sm font-medium">
        Parola
        <input
          name="parola"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={ALAN}
        />
      </label>

      {hata ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {hata}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={bekliyor}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-60 sm:w-auto"
      >
        {bekliyor ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}

export function SilTusu({ kullanici }: { kullanici: string }) {
  const [hata, gonder, bekliyor] = useActionState(kullaniciSilEylemi, null);

  return (
    <form action={gonder} className="flex items-center gap-3">
      <input type="hidden" name="kullanici" value={kullanici} />
      {hata ? <span className="text-xs text-red-600">{hata}</span> : null}
      <button
        type="submit"
        disabled={bekliyor}
        className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-60"
      >
        {bekliyor ? "…" : "Sil"}
      </button>
    </form>
  );
}

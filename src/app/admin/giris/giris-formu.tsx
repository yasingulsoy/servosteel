"use client";

import { useActionState } from "react";
import { girisEylemi } from "../actions";

/**
 * Giriş formu. İstemci bileşeni çünkü hata mesajını `useActionState` ile
 * sayfayı tazelemeden gösteriyor.
 */
export function GirisFormu() {
  const [hata, gonder, bekliyor] = useActionState(girisEylemi, null);

  return (
    <form action={gonder} className="mt-8 space-y-4">
      <div>
        <label htmlFor="kullanici" className="block text-sm font-medium">
          Kullanıcı adı
        </label>
        <input
          id="kullanici"
          name="kullanici"
          autoComplete="username"
          required
          className="mt-1.5 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm outline-none focus-visible:border-accent"
        />
      </div>

      <div>
        <label htmlFor="parola" className="block text-sm font-medium">
          Parola
        </label>
        <input
          id="parola"
          name="parola"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm outline-none focus-visible:border-accent"
        />
      </div>

      {hata ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {hata}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={bekliyor}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-60"
      >
        {bekliyor ? "Kontrol ediliyor…" : "Giriş"}
      </button>
    </form>
  );
}

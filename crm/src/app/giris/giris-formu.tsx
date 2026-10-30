"use client";

import { useActionState } from "react";
import { girisEylemi } from "./actions";

export function GirisFormu() {
  const [hata, gonder, bekliyor] = useActionState(girisEylemi, null);
  return (
    <form action={gonder} className="mt-8 space-y-4">
      <div>
        <label htmlFor="kullanici" className="etiket">
          Kullanıcı adı
        </label>
        <input id="kullanici" name="kullanici" autoComplete="username" autoCapitalize="none" required className="alan" />
      </div>
      <div>
        <label htmlFor="parola" className="etiket">
          Parola
        </label>
        <input id="parola" name="parola" type="password" autoComplete="current-password" required className="alan" />
      </div>
      {hata ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {hata}
        </p>
      ) : null}
      <button type="submit" disabled={bekliyor} className="dugme w-full">
        {bekliyor ? "Kontrol ediliyor…" : "Giriş"}
      </button>
    </form>
  );
}

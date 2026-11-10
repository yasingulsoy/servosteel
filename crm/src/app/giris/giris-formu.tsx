"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { girisEylemi } from "./actions";

export function GirisFormu() {
  const [hata, gonder, bekliyor] = useActionState(girisEylemi, null);
  const [goster, setGoster] = useState(false);
  return (
    <form action={gonder} className="space-y-6">
      {hata ? (
        <p role="alert" className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600">
          {hata}
        </p>
      ) : null}
      <div>
        <label htmlFor="kullanici" className="etiket">
          Kullanıcı adı <span className="text-error-500">*</span>
        </label>
        <input
          id="kullanici"
          name="kullanici"
          autoComplete="username"
          autoCapitalize="none"
          required
          placeholder="kullanıcı adınız"
          className="alan"
        />
      </div>
      <div>
        <label htmlFor="parola" className="etiket">
          Parola <span className="text-error-500">*</span>
        </label>
        <div className="relative">
          <input
            id="parola"
            name="parola"
            type={goster ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Parolanızı girin"
            className="alan pr-12"
          />
          <button
            type="button"
            onClick={() => setGoster((g) => !g)}
            aria-label={goster ? "Parolayı gizle" : "Parolayı göster"}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {goster ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
      </div>
      <button type="submit" disabled={bekliyor} className="dugme w-full">
        {bekliyor ? "Kontrol ediliyor…" : "Giriş yap"}
      </button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound } from "lucide-react";
import {
  kullaniciEkleEylemi,
  kullaniciSilEylemi,
  parolaVerEylemi,
  type EylemSonucu,
} from "../actions";

const ALAN =
  "mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base outline-none focus-visible:border-accent sm:text-sm";

function Sonuc({ sonuc }: { sonuc: EylemSonucu }) {
  if (!sonuc) return null;
  return (
    <p
      role={sonuc.tamam ? "status" : "alert"}
      className={`text-sm font-medium ${sonuc.tamam ? "text-emerald-700" : "text-red-600"}`}
    >
      {sonuc.mesaj}
    </p>
  );
}

export function KullaniciFormu() {
  const [sonuc, gonder, bekliyor] = useActionState(kullaniciEkleEylemi, null);

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
        <span className="mt-1 block text-xs font-normal text-muted">En az 8 karakter.</span>
      </label>

      <Sonuc sonuc={sonuc} />

      <button
        type="submit"
        disabled={bekliyor}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-60 sm:w-auto"
      >
        {bekliyor ? "Ekleniyor…" : "Kullanıcı ekle"}
      </button>
    </form>
  );
}

/**
 * Listedeki tek kullanıcı satırı.
 *
 * "Parolasını değiştir" başka birine yeni parola verir — yalnızca yönetici
 * bu listeyi görüyor, sunucu eylemi de ayrıca kontrol ediyor. Kendi
 * satırında bu tuş yok: kendi parolası Profil'den, mevcut parola sorularak
 * değişir.
 */
export function KullaniciSatiri({
  kullanici,
  yonetici,
  ben,
  tarih,
}: {
  kullanici: string;
  yonetici: boolean;
  ben: boolean;
  tarih: string;
}) {
  const [acik, setAcik] = useState(false);
  const [sonuc, setSonuc] = useState<EylemSonucu>(null);

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-shell text-sm font-bold uppercase text-accent"
            aria-hidden
          >
            {kullanici.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="font-semibold">
              {kullanici}
              {yonetici ? (
                <span className="ml-2 rounded-full bg-shell px-2 py-0.5 text-xs font-semibold text-white">
                  yönetici
                </span>
              ) : null}
              {ben ? (
                <span className="ml-2 rounded-full bg-accent/25 px-2 py-0.5 text-xs font-semibold text-accent-ink">
                  siz
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-muted">{tarih}</p>
          </div>
        </div>

        {ben ? (
          <Link
            href="/admin/profil"
            className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Parolanızı Profil&apos;den değiştirin
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            {acik ? null : (
              <button
                type="button"
                onClick={() => {
                  setSonuc(null);
                  setAcik(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-alt"
              >
                <KeyRound className="size-4 text-muted" aria-hidden />
                Parolasını değiştir
              </button>
            )}
            <SilTusu kullanici={kullanici} />
          </div>
        )}
      </div>

      {acik ? (
        <form
          action={async (fd) => {
            const r = await parolaVerEylemi(null, fd);
            setSonuc(r);
            if (r?.tamam) setAcik(false);
          }}
          className="mt-3 space-y-3 rounded-lg border border-line bg-surface-alt p-4"
        >
          <input type="hidden" name="kullanici" value={kullanici} />
          <label className="block text-sm font-medium">
            {kullanici} için yeni parola
            <input
              name="parola"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              autoFocus
              className={ALAN}
            />
            <span className="mt-1 block text-xs font-normal text-muted">
              En az 8 karakter. Kişinin açık oturumu hemen kapanır, yeni parolayla girer.
            </span>
          </label>
          {sonuc && !sonuc.tamam ? <Sonuc sonuc={sonuc} /> : null}
          <div className="flex gap-2">
            <KaydetTusu />
            <button
              type="button"
              onClick={() => setAcik(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink"
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : sonuc?.tamam ? (
        <div className="mt-2">
          <Sonuc sonuc={sonuc} />
        </div>
      ) : null}
    </li>
  );
}

function KaydetTusu() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
    >
      {pending ? "Kaydediliyor…" : "Kaydet"}
    </button>
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
        onClick={(e) => {
          /* Tek tıkla silinmesin — silinen kişinin oturumu da anında düşüyor. */
          if (!window.confirm(`"${kullanici}" silinsin mi? Bu kişi panele giremez olur.`)) {
            e.preventDefault();
          }
        }}
        className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        {bekliyor ? "…" : "Sil"}
      </button>
    </form>
  );
}

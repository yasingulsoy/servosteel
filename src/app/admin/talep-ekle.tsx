"use client";

import { useState } from "react";
import { talepEkleEylemi } from "./actions";

/**
 * Elle talep girişi.
 *
 * Gerekli çünkü site formu bugüne kadar hiçbir yere KAYDETMEDİ — yalnızca
 * e-posta attı. Geçmişteki talepler posta kutusunda duruyor; panele ancak
 * buradan girilebiliyor. Kayıt `kaynak='elle'` olarak işaretlenir ki
 * sonradan hangisinin formdan geldiği karışmasın.
 *
 * Varsayılan olarak kapalı: günlük iş talep OKUMAK, girmek değil.
 */
export function TalepEkleKutusu() {
  const [acik, setAcik] = useState(false);

  const alan =
    "mt-1.5 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus-visible:border-accent";

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="mt-8 rounded-lg border border-line px-4 py-2.5 text-sm font-medium hover:bg-surface-alt"
      >
        + Elle talep ekle
      </button>
    );
  }

  return (
    <section className="mt-8 rounded-xl border border-line bg-card p-5">
      <h2 className="font-display text-lg font-bold uppercase tracking-tight">Elle talep ekle</h2>
      <p className="mt-1 text-sm text-muted">
        Posta kutusundaki eski talepleri buradan geçirin.
      </p>

      <form
        action={async (fd) => {
          await talepEkleEylemi(fd);
          setAcik(false);
        }}
        className="mt-5 grid gap-4 sm:grid-cols-2"
      >
        <label className="text-sm font-medium">
          Ad Soyad
          <input name="ad" className={alan} />
        </label>
        <label className="text-sm font-medium">
          E-posta
          <input name="eposta" type="email" className={alan} />
        </label>
        <label className="text-sm font-medium">
          Firma
          <input name="firma" className={alan} />
        </label>
        <label className="text-sm font-medium">
          Telefon
          <input name="telefon" className={alan} />
        </label>
        <label className="text-sm font-medium">
          Ülke
          <input name="ulke" className={alan} />
        </label>
        <label className="text-sm font-medium">
          Tür
          <select name="tur" className={alan} defaultValue="contact">
            <option value="contact">İletişim formu</option>
            <option value="rfq">Teklif talebi</option>
          </select>
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Mesaj
          <textarea name="mesaj" rows={4} className={alan} />
        </label>

        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-zinc-950"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={() => setAcik(false)}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium hover:bg-surface-alt"
          >
            Vazgeç
          </button>
        </div>
      </form>
    </section>
  );
}

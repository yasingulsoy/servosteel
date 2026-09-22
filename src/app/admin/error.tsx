"use client";

import { unstable_isUnrecognizedActionError } from "next/navigation";
import { useEffect } from "react";

/**
 * Panelin hata sınırı. En sık sebep deploy: deploy'dan önce açılmış sekmede
 * bir düğmeye basılınca sunucu eylemin eski kimliğini tanımıyor
 * ("Server Action … was not found"). O durumda yenilemek yeter — kullanıcıya
 * teknik hata değil bunu söyler. Nabız bunu çoğu zaman önceden yakalayıp
 * bant gösterir (kabuk-istemci.tsx); bu, bant çıkmadan basılan düğme için.
 */
export default function PanelHatasi({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const guncellendi = unstable_isUnrecognizedActionError(error);
  useEffect(() => {
    if (!guncellendi) console.error(error);
  }, [error, guncellendi]);

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-card p-6 text-sm">
        <h1 className="text-base font-semibold">{guncellendi ? "Panel güncellendi" : "Bir şey ters gitti"}</h1>
        <p className="mt-2 text-muted">
          {guncellendi
            ? "Bu sayfa önceki sürümden açık kalmıştı; yaptığınız işlem gönderilmedi. Sayfayı yenileyip tekrar deneyin."
            : "Sayfa yüklenirken bir hata oldu. Tekrar deneyin; sürerse sayfayı yenileyin."}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => (guncellendi ? window.location.reload() : unstable_retry())}
            className="rounded-lg bg-shell px-3.5 py-2 font-semibold text-white"
          >
            {guncellendi ? "Sayfayı yenile" : "Tekrar dene"}
          </button>
          {!guncellendi ? (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-line px-3.5 py-2 font-medium"
            >
              Yenile
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}

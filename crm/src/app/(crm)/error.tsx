"use client";

/**
 * Eylem ya da sayfa hatası. Canlıda Next sunucu hatasının metnini gizler;
 * geliştirmede mesaj görünür.
 */
export default function Hata({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="kart max-w-xl space-y-3 p-6">
      <h1 className="text-lg font-bold">İşlem tamamlanamadı</h1>
      <p className="text-sm">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "Bir alan eksik ya da geçersiz olabilir. Geri dönüp formu kontrol edin."}
      </p>
      {error.digest ? <p className="text-xs text-muted">Kod: {error.digest}</p> : null}
      <div className="flex gap-2">
        <button type="button" onClick={() => history.back()} className="dugme-ikincil">
          Geri dön
        </button>
        <button type="button" onClick={reset} className="dugme-ikincil">
          Yeniden dene
        </button>
      </div>
    </div>
  );
}

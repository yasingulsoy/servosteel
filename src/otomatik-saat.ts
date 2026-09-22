/**
 * Otomatik gönderimin saati — YALNIZCA Node çalışma ortamında yüklenir
 * (src/instrumentation.ts). Dakikada bir uygulamanın KENDİ /api/otomatik
 * adresine istek atar; işin kendisi orada, normal sunucu kodunda yapılır
 * (bkz. src/lib/otomatik-gonderim.ts). Anahtar her açılışta rastgele üretilir
 * ve yalnızca bu süreçte (globalThis) durur — adres dışarıdan çağrılamaz.
 */
export function otomatikSaatiKur() {
  if (process.env.OUTREACH_AUTO_RUNNER === "off") return;
  /* Yalnızca üretimde (next start): yerel `next dev` .env.local üzerinden CANLI
     veritabanına bağlı, orada kendiliğinden e-posta göndermek olmaz. Yerel
     deneme için OUTREACH_AUTO_DEV=1 (yalnızca yerel test veritabanıyla). */
  if (process.env.NODE_ENV !== "production" && process.env.OUTREACH_AUTO_DEV !== "1") return;

  const bayt = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bayt);
  const anahtar = Array.from(bayt, (b) => b.toString(16).padStart(2, "0")).join("");
  (globalThis as { __servosteelOtomatik?: string }).__servosteelOtomatik = anahtar;

  const port = process.env.PORT || "3000";
  let suruyor = false;
  const tur = async () => {
    if (suruyor) return;
    suruyor = true;
    try {
      await fetch(`http://127.0.0.1:${port}/api/otomatik`, {
        method: "POST",
        headers: { "x-otomatik": anahtar },
        signal: AbortSignal.timeout(170_000),
      });
    } catch {
      /* sunucu henüz dinlemiyor ya da tur uzun sürdü — bir sonraki dakika */
    } finally {
      suruyor = false;
    }
  };
  const saat = setInterval(tur, 60_000);
  saat.unref?.();
}

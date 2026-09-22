/**
 * Sunucu açılışında bir kez çalışır (Next.js `register`). Next bu dosyayı
 * Edge için de derliyor; Node'a özgü kod ayrı dosyada ve yalnızca Node
 * ortamında yükleniyor (Next'in önerdiği biçim).
 *
 * Otomatik gönderimin dakikalık saati: src/otomatik-saat.ts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { otomatikSaatiKur } = await import("./otomatik-saat");
    otomatikSaatiKur();
  }
}

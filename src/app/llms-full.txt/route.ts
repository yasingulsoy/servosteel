import { llmsFull } from "@/lib/llms";

/**
 * /llms-full.txt — sitenin İngilizce metninin tamamı tek dosyada: ürün
 * açıklamaları, teknik tablolar, sık sorulan sorular ve Akademi yazılarının
 * tam metni. llms.txt bağlantı listesi; bu dosya ise asistanın sayfa sayfa
 * gezmeden okuyabileceği kaynak (llmstxt.org'daki llms-full.txt kuralı).
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsFull(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

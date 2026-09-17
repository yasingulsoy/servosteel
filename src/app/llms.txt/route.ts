import { llmsIndex } from "@/lib/llms";

/**
 * /llms.txt — LLM / yapay zeka arama motorları (ChatGPT, Perplexity, AI Overviews)
 * için siteyi özetleyen yapılandırılmış rehber (llmstxt.org kuralı).
 * Metin src/lib/llms.ts'te, sitenin İngilizce içeriğinden üretiliyor.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsIndex(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

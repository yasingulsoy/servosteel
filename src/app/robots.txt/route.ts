import { SITE_URL, IS_PRODUCTION_SITE, PRODUCTION_URL } from "@/lib/site";

/**
 * /robots.txt — raw route handler (Next metadata objesi yorum/özel satır desteklemediği için).
 * Strateji: site tamamen açık; yapay zeka arama & asistan botları AÇIKÇA karşılanır
 * (GEO görünürlüğü — ChatGPT, Perplexity, Google AI Overviews, Copilot, Claude).
 * Bir botu engellemek istersen ilgili "Allow: /" satırını "Disallow: /" yap.
 */
export const dynamic = "force-static";

/* Açıkça izin verilen AI botları (arama + eğitim). */
const AI_BOTS = [
  "OAI-SearchBot", // OpenAI — ChatGPT arama sonuçları
  "ChatGPT-User", // OpenAI — kullanıcı isteğiyle tarama
  "GPTBot", // OpenAI — model eğitimi / bilgi
  "PerplexityBot", // Perplexity — dizin
  "Perplexity-User", // Perplexity — kullanıcı isteğiyle tarama
  "Google-Extended", // Google — Gemini / AI Overviews
  "ClaudeBot", // Anthropic — dizin/eğitim
  "Claude-User", // Anthropic — kullanıcı isteğiyle tarama
  "Applebot-Extended", // Apple Intelligence
  "CCBot", // Common Crawl (birçok AI veri kümesini besler)
];

export function GET() {
  /* Demo / önizleme kopyası: hiçbir bot indekslemesin — canlı site kendi kopyasıyla yarışmasın. */
  if (!IS_PRODUCTION_SITE) {
    return new Response(
      `# Bu bir demo/önizleme kopyasıdır — arama motorlarına kapalıdır.\n` +
        `# Canlı site: ${PRODUCTION_URL}\n\nUser-agent: *\nDisallow: /\n`,
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const aiRules = AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n");

  const body = `# Servosteel — robots.txt
# Site tüm botlara açıktır. Yapay zeka arama & asistan botları aşağıda açıkça karşılanır.

User-agent: *
Allow: /

# --- Yapay zeka arama & asistanları (GEO görünürlüğü) ---
${aiRules}

Sitemap: ${SITE_URL}/sitemap.xml

# Yapay zeka için site rehberi (llms.txt standardı):
# ${SITE_URL}/llms.txt
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

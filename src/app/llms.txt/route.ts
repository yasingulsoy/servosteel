import { SITE_URL } from "@/lib/site";
import { getPosts } from "@/lib/akademi";

/**
 * /llms.txt — LLM / yapay zeka arama motorları (ChatGPT, Perplexity, AI Overviews)
 * için siteyi özetleyen yapılandırılmış rehber (llmstxt.org kuralı).
 * İngilizce + /en/* sayfalara işaret eder; akademi listesi içerikten otomatik türetilir.
 */
export const dynamic = "force-static";

export function GET() {
  const posts = getPosts("en");
  const academy = posts.length
    ? posts.map((p) => `- [${p.title}](${SITE_URL}/en/akademi/${p.slug}): ${p.description}`).join("\n")
    : "- (coming soon)";

  const body = `# Servosteel

> Turkish manufacturer of coil-processing and press-feeding machinery — roll forming lines, coil slitting lines, cut-to-length lines and press feeding systems. Every line is custom-engineered, produced and tested in-house, and commissioned turnkey. Exported to 48+ countries.

Servosteel designs and builds tailor-made steel coil processing lines in Sancaktepe, Istanbul, Türkiye. The website is available in 9 languages (Turkish at the root; others under /en, /de, /es, /it, /hu, /pl, /ru, /ar). The English pages are linked below.

## Solutions
- [Roll Forming Lines](${SITE_URL}/en/roll-form-hatlari): Continuous roll forming lines for cable tray, solar mounting profiles, storage racks, scaffolding, guardrails, noise barriers and C/Sigma/Omega profiles.
- [Coil Slitting Lines](${SITE_URL}/en/dilme-hatlari): Lines that cut wide coils into strips — 1,500-15,000 kg coil capacity, 0.5-5 mm thickness.
- [Cut-to-Length Lines](${SITE_URL}/en/boy-kesme-hatlari): Lines that cut coil into precise sheets with straightening, servo feeding, guillotine and stacking.

## Machines
- [Decoilers](${SITE_URL}/en/makineler/rulo-acicilar): Hydraulic (6-20 t) and mechanical (500-2,500 kg) decoilers.
- [Servo Feeders](${SITE_URL}/en/makineler/servo-suruculer): Precision servo feeders for press lines, 0.4-4 mm thickness, up to 1,600 mm width.
- [Straightener Servo Feeders](${SITE_URL}/en/makineler/dogrultmali-servo-suruculer): Combined straightening and servo feeding in one body (7/9/11/13 straightening rolls).
- [Compact Lines](${SITE_URL}/en/makineler/kompakt-hatlar): Decoiler, straightener and servo feeder on a single platform for tight spaces — ± 0.1 mm feed accuracy, 2,500-10,000 kg coil weight.
- [Tooling and Roll Sets](${SITE_URL}/en/makineler/kalip-ve-merdane): Roll forming tooling and progressive press dies, designed with the line — 4140 alloy steel rolls hardened to 58-60 HRC.

## Academy (technical guides)
${academy}

## Company
- [About Servosteel](${SITE_URL}/en/hakkimizda): Coil handling and press feeding systems manufacturer; 10+ years; single-source, turnkey engineering.
- [References](${SITE_URL}/en/referanslar): Field installations across 48+ countries.
- [Videos](${SITE_URL}/en/videolar): 100+ real field videos of running lines.
- [Contact](${SITE_URL}/en/iletisim): Yunusemre Mah. İskenderpaşa Cad. 21/1, Sancaktepe, Istanbul, Türkiye · +90 216 415 30 05 · info@servosteel.com.tr
- [Request a Quote](${SITE_URL}/en/teklif-al): Send sheet thickness, coil weight and target strip/sheet dimensions for a custom line proposal.

## Languages
The same pages are published in 9 languages: Turkish (site root), English (/en), German (/de), Spanish (/es), Italian (/it), Hungarian (/hu), Polish (/pl), Russian (/ru) and Arabic (/ar, right-to-left). Replace /en/ with any other locale code for the same page in that language. Priority export markets: European Union, MENA (Arabic) and CIS / Central Asia (Russian).
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

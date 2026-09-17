import en from "@/messages/en.json";
import { SITE_URL } from "@/lib/site";
import { getPost, getPosts } from "@/lib/akademi";
import { localePath } from "@/i18n/seo";
import { machineItems, machineVariants, rollFormItems } from "@/lib/catalog";
import { compareItems } from "@/lib/compare";
import { sectors } from "@/lib/sectors";

/**
 * /llms.txt ve /llms-full.txt metinleri — yapay zekâ asistanları için.
 *
 * İçerik ELLE YAZILMAZ; sitenin İngilizce mesajlarından ve Akademi
 * yazılarından türetilir. Önceki llms.txt elle yazılmıştı ve sayfalardan
 * ayrışmıştı: mekanik açıcıyı "500-2,500 kg" diyordu, sayfanın teknik tablosu
 * 4.000 kg'a kadar model listeliyordu. Tek kaynaktan üretilince bir sayı
 * sitede düzeltildiğinde burada da düzelir.
 *
 * İngilizce: asistanların çoğu İngilizce kaynağı tercih ediyor; diğer dillerin
 * adresi "Languages" bölümünde tarif ediliyor.
 */

type Faq = { q: string; a: string };
type Table = { title?: string; head: string[]; rows: string[][]; note?: string };
type Item = { name: string; short: string; meta?: string; hero?: string; table?: Table; faq?: Faq[] };

const M = en as unknown as {
  hub: { metaDesc: string; desc: string; faq: Faq[] };
  dilme: { metaDesc: string; desc: string; tableHead: string[]; tableRows: string[][]; tableNote: string; faq: Faq[] };
  boykesme: { metaDesc: string; desc: string; faq: Faq[] };
  calc: { metaDesc: string };
  compare: { items: Record<string, { name: string; aName: string; bName: string; verdict: string; rows: { label: string; a: string; b: string }[] }> };
  sectors: { items: Record<string, { name: string; short: string; faq?: Faq[] }> };
  videos: { metaDesc: string };
  products: {
    rollform: Record<string, Item>;
    machines: Record<string, Item>;
    variants: Record<string, Record<string, Item>>;
  };
};

/** Mutlak İngilizce adres. Yol DAHİLİ (Türkçe) yazılır, slug tablosundan çevrilir. */
const url = (path: string) => {
  const [yol, hash] = path.split("#");
  return `${SITE_URL}${localePath("en", yol)}${hash ? `#${hash}` : ""}`;
};

const SUMMARY =
  "Turkish manufacturer of coil-processing and press-feeding machinery — roll forming lines, coil slitting lines, cut-to-length lines and press feeding systems. Every line is custom-engineered, produced and tested in-house, and commissioned turnkey. Exported to 48+ countries.";

const INTRO =
  "Servosteel designs and builds tailor-made steel coil processing lines in Sancaktepe, Istanbul, Türkiye. The website is available in 9 languages (Turkish at the root; others under /en, /de, /es, /it, /hu, /pl, /ru, /ar). The English pages are linked below.";

const CONTACT =
  "Yunusemre Mah. İskenderpaşa Cad. 21/1, Sancaktepe, Istanbul, Türkiye · +90 216 415 30 05 · info@servosteel.com.tr";

const LANGUAGES = `The same pages are published in 9 languages. Turkish lives at the site root and uses Turkish URL slugs (e.g. ${SITE_URL}/dilme-hatlari). The other eight — English (/en), German (/de), Spanish (/es), Italian (/it), Hungarian (/hu), Polish (/pl), Russian (/ru) and Arabic (/ar, right-to-left) — share the same English slugs, so replacing /en/ with any of those locale codes gives the same page in that language. Priority export markets: European Union, MENA (Arabic) and CIS / Central Asia (Russian).`;

const line = (name: string, path: string, text: string) => `- [${name}](${url(path)}): ${text}`;

function faqBlock(faq: Faq[] | undefined): string {
  if (!faq?.length) return "";
  return faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
}

function tableBlock(t: Table | undefined): string {
  if (!t?.rows?.length) return "";
  const out = [
    t.title ? `${t.title}:` : "",
    `| ${t.head.join(" | ")} |`,
    `| ${t.head.map(() => "---").join(" | ")} |`,
    ...t.rows.map((r) => `| ${r.join(" | ")} |`),
    t.note ? `Note: ${t.note}` : "",
  ];
  return out.filter(Boolean).join("\n");
}

/** MDX gövdesindeki site içi bağlantıları mutlak İngilizce adrese çevirir. */
function absoluteLinks(md: string): string {
  return md.replace(/\]\((\/[^)\s]*)\)/g, (_, p: string) => `](${url(p)})`);
}

export function llmsIndex(): string {
  const posts = getPosts("en");
  const P = M.products;

  const rollforms = rollFormItems.map((i) =>
    line(P.rollform[i.slug].name, `/roll-form-hatlari/${i.slug}`, P.rollform[i.slug].short)
  );
  const machines = machineItems.flatMap((i) => [
    line(P.machines[i.slug].name, `/makineler/${i.slug}`, P.machines[i.slug].short),
    ...machineVariants
      .filter((v) => v.parent === i.slug)
      .map((v) => {
        const it = P.variants[v.parent][v.slug];
        return `  ${line(it.name, `/makineler/${v.parent}/${v.slug}`, it.short)}`;
      }),
  ]);
  const compares = compareItems.map((c) =>
    line(M.compare.items[c.slug].name, `/karsilastirma/${c.slug}`, M.compare.items[c.slug].verdict)
  );
  const apps = sectors.map((s) => line(M.sectors.items[s.slug].name, `/uygulamalar/${s.slug}`, M.sectors.items[s.slug].short));
  const academy = posts.map((p) => line(p.title, `/akademi/${p.slug}`, p.summary ?? p.description));

  return `# Servosteel

> ${SUMMARY}

${INTRO}

Full English text of every guide, product FAQ and specification table: ${SITE_URL}/llms-full.txt

## Solutions
${line("Roll Forming Lines", "/roll-form-hatlari", M.hub.metaDesc)}
${line("Coil Slitting Lines", "/dilme-hatlari", M.dilme.metaDesc)}
${line("Cut-to-Length Lines", "/boy-kesme-hatlari", M.boykesme.metaDesc)}

## Roll forming line types
${rollforms.join("\n")}

## Machines
${machines.join("\n")}

## Selection guides and calculators
${line("Calculators", "/hesaplayicilar", M.calc.metaDesc)}
${compares.join("\n")}

## Applications by sector
${apps.join("\n")}

## Academy (technical guides)
${academy.join("\n")}

## Company
- [About Servosteel](${url("/hakkimizda")}): Coil handling and press feeding systems manufacturer; 10+ years; single-source, turnkey engineering.
- [References](${url("/referanslar")}): Field installations across 48+ countries.
- [Videos](${url("/videolar")}): ${M.videos.metaDesc}
- [Contact](${url("/iletisim")}): ${CONTACT}
- [Request a Quote](${url("/teklif-al")}): Send sheet thickness, coil weight and target strip/sheet dimensions for a custom line proposal.

## Languages
${LANGUAGES}
`;
}

export function llmsFull(): string {
  const P = M.products;
  const parts: string[] = [];

  parts.push(`# Servosteel — full reference for language models (English)

> ${SUMMARY}

${INTRO}

This file collects the English text of the site in one place: product descriptions, specification tables, frequently asked questions and the complete academy guides. Every section names its source page. Contact: ${CONTACT}`);

  parts.push(`## Roll forming lines
Source: ${url("/roll-form-hatlari")}

${M.hub.desc}

${faqBlock(M.hub.faq)}`);

  for (const i of rollFormItems) {
    const it = P.rollform[i.slug];
    parts.push(
      [`### ${it.name}`, `Source: ${url(`/roll-form-hatlari/${i.slug}`)}`, it.meta ?? it.short, tableBlock(it.table), faqBlock(it.faq)]
        .filter(Boolean)
        .join("\n\n")
    );
  }

  parts.push(
    [
      "## Coil slitting lines",
      `Source: ${url("/dilme-hatlari")}`,
      M.dilme.desc,
      tableBlock({ head: M.dilme.tableHead, rows: M.dilme.tableRows, note: M.dilme.tableNote }),
      faqBlock(M.dilme.faq),
    ].join("\n\n")
  );

  parts.push(["## Cut-to-length lines", `Source: ${url("/boy-kesme-hatlari")}`, M.boykesme.desc, faqBlock(M.boykesme.faq)].join("\n\n"));

  parts.push("## Machines");
  for (const i of machineItems) {
    const it = P.machines[i.slug];
    parts.push(
      [`### ${it.name}`, `Source: ${url(`/makineler/${i.slug}`)}`, it.meta ?? it.short, tableBlock(it.table), faqBlock(it.faq)]
        .filter(Boolean)
        .join("\n\n")
    );
    for (const v of machineVariants.filter((x) => x.parent === i.slug)) {
      const vi = P.variants[v.parent][v.slug];
      parts.push(
        [`#### ${vi.name}`, `Source: ${url(`/makineler/${v.parent}/${v.slug}`)}`, vi.hero ?? vi.short, tableBlock(vi.table)]
          .filter(Boolean)
          .join("\n\n")
      );
    }
  }

  parts.push("## Comparisons");
  for (const c of compareItems) {
    const it = M.compare.items[c.slug];
    parts.push(
      [
        `### ${it.name}`,
        `Source: ${url(`/karsilastirma/${c.slug}`)}`,
        tableBlock({ head: ["Criterion", it.aName, it.bName], rows: it.rows.map((r) => [r.label, r.a, r.b]) }),
        `In short: ${it.verdict}`,
      ].join("\n\n")
    );
  }

  parts.push("## Applications by sector");
  for (const s of sectors) {
    const it = M.sectors.items[s.slug];
    parts.push([`### ${it.name}`, `Source: ${url(`/uygulamalar/${s.slug}`)}`, it.short, faqBlock(it.faq)].filter(Boolean).join("\n\n"));
  }

  parts.push("## Academy guides");
  for (const meta of getPosts("en")) {
    const post = getPost("en", meta.slug);
    if (!post) continue;
    parts.push(
      [
        `### ${post.title}`,
        `Source: ${url(`/akademi/${post.slug}`)} · Published ${post.date}${post.updated ? ` · Updated ${post.updated}` : ""}`,
        post.summary ? `Short answer: ${post.summary}` : post.description,
        absoluteLinks(post.content.trim()).replace(/^## /gm, "#### ").replace(/^### /gm, "##### "),
        post.faq.length ? `Frequently asked questions:\n\n${faqBlock(post.faq)}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    );
  }

  parts.push(`## Languages\n\n${LANGUAGES}`);
  return parts.join("\n\n") + "\n";
}

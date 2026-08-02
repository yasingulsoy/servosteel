/**
 * İçindekiler (ToC) — başlık çıkarma ve çapa (anchor) üretimi.
 *
 * Kritik nokta: aynı slug algoritması HEM ham MDX'ten başlık listesi çıkarırken
 * HEM de başlıklar HTML'e basılırken kullanılır. İki taraf ayrışırsa bağlantılar
 * hiçbir yere gitmez — bu yüzden tek fonksiyon, tek kaynak.
 */

export type TocItem = {
  /** 2 = H2, 3 = H3 */
  level: 2 | 3;
  text: string;
  id: string;
};

/**
 * Başlık metnini çapaya çevirir.
 *
 * Unicode korunur: Rusça ve Arapça başlıklarda ASCII'ye indirgeme yapılsaydı
 * slug boş kalırdı. Türkçe'de İ/I ayrımı için özel eşleme yapılır — JS'in
 * varsayılan toLowerCase'i "İ" harfini iki kod noktasına açar.
 */
export function slugifyHeading(text: string): string {
  return text
    .replace(/[İI]/g, "i")
    .replace(/Ğ/g, "ğ")
    .replace(/Ş/g, "ş")
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, "") // markdown işaretleri
    .replace(/[^\p{L}\p{N}]+/gu, "-") // harf/rakam dışındaki her şey tire
    .replace(/^-+|-+$/g, "");
}

/** React children'dan düz metin — başlıkta <strong>, <code> vb. olabilir */
export function textOf(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) {
    return textOf((node as { props?: { children?: unknown } }).props?.children);
  }
  return "";
}

/**
 * Ham MDX kaynağından H2 ve H3 başlıklarını sırayla çıkarır.
 *
 * Kod bloklarının içi atlanır — ``` bash bloğundaki "# yorum" satırı başlık
 * değildir. Aynı metinli iki başlık olursa slug'a sayı eklenir, aksi halde
 * ikisi de aynı çapaya giderdi.
 */
export function extractToc(source: string): TocItem[] {
  const out: TocItem[] = [];
  const seen = new Map<string, number>();
  let inFence = false;

  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;

    const level = m[1].length as 2 | 3;
    const text = m[2].replace(/[*_`]/g, "").trim();
    if (!text) continue;

    const base = slugifyHeading(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);

    out.push({ level, text, id: n === 0 ? base : `${base}-${n}` });
  }

  return out;
}

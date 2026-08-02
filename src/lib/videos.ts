/**
 * YouTube video kataloğu — küratörlü.
 *
 * Kanalda 102 video var; buraya ürün kategorilerimizi en iyi temsil eden 24'ü
 * seçildi. `date` ve `sec` alanları YouTube'un GERÇEK metadata'sından alındı
 * (yt-dlp ile çekildi) — VideoObject şeması uydurma tarih kabul etmez, Google
 * uploadDate'i zorunlu tutar.
 *
 * Başlıklar dil dosyalarında (videos.items.<id>) yaşar; model kodu ve ölçüler
 * (SRV504, 350×5 mm) dilden bağımsız olduğu için çeviride aynen korunur.
 */

export type VideoItem = {
  /** YouTube video kimliği — embed ve thumbnail URL'i bundan türetilir */
  id: string;
  /** Yayın tarihi (YYYY-MM-DD) — schema.org uploadDate */
  date: string;
  /** Süre (saniye) — ISO 8601'e çevrilir */
  sec: number;
};

export type VideoGroup = {
  /** Çeviri anahtarı: videos.groups.<key> */
  key: string;
  items: VideoItem[];
  /** Grubun bağlandığı ürün sayfası */
  href?: string;
};

export const videoGroups: VideoGroup[] = [
  {
    key: "slitting",
    href: "/dilme-hatlari",
    items: [
      { id: "h7aPJ6rJc_U", date: "2026-07-13", sec: 182 },
      { id: "GEYcBSPqutQ", date: "2023-04-28", sec: 167 },
      { id: "hc_Znq2u8MI", date: "2022-10-05", sec: 133 },
      { id: "JOHZwMBLqKo", date: "2021-10-27", sec: 243 },
    ],
  },
  {
    key: "ctl",
    href: "/boy-kesme-hatlari",
    items: [
      { id: "4QETxHS-CD4", date: "2022-03-11", sec: 328 },
      { id: "mwZx6X1mV0c", date: "2022-05-16", sec: 231 },
      { id: "H-h-IF4QbUI", date: "2016-07-19", sec: 122 },
      { id: "_lOTZE21aGE", date: "2021-04-26", sec: 172 },
    ],
  },
  {
    key: "rollform",
    href: "/roll-form-hatlari",
    items: [
      { id: "qmWM1NgcACw", date: "2026-04-03", sec: 166 },
      { id: "NR25bt36uQg", date: "2026-02-11", sec: 224 },
      { id: "UCeR9epppK8", date: "2025-11-17", sec: 137 },
      { id: "MaJswAJo8JQ", date: "2022-04-07", sec: 295 },
      { id: "J-O8xfI2ovA", date: "2024-08-29", sec: 96 },
    ],
  },
  {
    key: "solar",
    href: "/roll-form-hatlari/solar-profil",
    items: [
      { id: "3xmcJvv6LNc", date: "2021-06-12", sec: 176 },
      { id: "5vVTpg3hltE", date: "2024-11-06", sec: 147 },
      { id: "tm520w7WsBI", date: "2023-12-04", sec: 129 },
    ],
  },
  {
    key: "feeding",
    href: "/makineler/servo-suruculer",
    items: [
      { id: "2tgCtC8n_1E", date: "2021-04-17", sec: 150 },
      { id: "ONmiUo8vtvk", date: "2025-08-01", sec: 123 },
      { id: "a7W3BzFYiow", date: "2021-04-15", sec: 156 },
      { id: "7RcuUmfN7QE", date: "2017-06-10", sec: 114 },
    ],
  },
  {
    key: "machines",
    href: "/makineler",
    items: [
      { id: "P3zbB3c6NBY", date: "2015-11-23", sec: 85 },
      { id: "bc5nAkQXJTw", date: "2015-11-14", sec: 101 },
      { id: "AqcEyDbbWtA", date: "2015-08-31", sec: 106 },
      { id: "v9_1snhusMY", date: "2015-10-30", sec: 125 },
    ],
  },
];

export const allVideos = videoGroups.flatMap((g) => g.items);

/** Saniye -> ISO 8601 süre (PT2M30S) — schema.org duration bu biçimi ister */
export function isoDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `PT${m > 0 ? `${m}M` : ""}${s > 0 ? `${s}S` : ""}` || "PT0S";
}

/** İnsan okunur süre (2:30) */
export function humanDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** YouTube önizleme görseli — hqdefault her videoda garanti mevcuttur */
export function thumbUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function watchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function embedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

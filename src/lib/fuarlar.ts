/**
 * Katıldığımız fuarlar — /fuarlar sayfasının verisi (dil bağımsız kısım).
 * Fuar başına metin (okunan yer adı, açıklama) mesaj dosyalarında
 * `fairs.items.<slug>`; `mekan` yalnızca şema içindir.
 *
 * Görseller ve videolar `public/fuarlar/<slug>/` altında, sunucudan yayınlanır
 * (YouTube'a değil). Videolar sitenin diğer videoları gibi git'e girer; o yüzden
 * eklemeden önce boyutları kontrol edilir, sıkıştırma kararı Yasin'indir.
 * Ölçüler dosyanın gerçek pikselleri: en-boy oranı bunlardan gelir.
 */

export type FuarGorsel = { file: string; width: number; height: number };
export type FuarVideo = FuarGorsel & { poster?: string };

export type Fuar = {
  slug: string;
  /** Fuarın kendi adı — çevrilmez */
  ad: string;
  /** Gün olarak (YYYY-MM-DD), fuarın yapıldığı yerin takvimine göre */
  baslangic: string;
  bitis: string;
  /** Şema için yer (çevrilmez); okunan yer adı mesaj dosyasında */
  mekan: { ad: string; sehir: string; ulke: string };
  salon?: string;
  stand?: string;
  /** Birlikte katıldığımız firma */
  ortak?: string;
  /** Fuar duyuru afişi — dik (story) biçim */
  afis?: FuarGorsel;
  fotolar: FuarGorsel[];
  videolar: FuarVideo[];
  /** Kanalda zaten olan videolar (YouTube kimliği) — kart YouTube'a gider */
  youtube: string[];
};

/** Yeniden eskiye. Yeni fuar başa eklenir. */
export const fuarlar: Fuar[] = [
  {
    slug: "euroblech-2026",
    ad: "EuroBLECH 2026",
    baslangic: "2026-10-20",
    bitis: "2026-10-23",
    mekan: { ad: "Deutsche Messe", sehir: "Hannover", ulke: "DE" },
    salon: "27",
    stand: "D39",
    afis: { file: "afis.jpg", width: 941, height: 1672 },
    fotolar: [],
    /* Standdan telefon çekimleri (dikey, H.264/AAC, 17-54 sn), dosyalar olduğu
       gibi; kapaklar videonun kendi karesinden, aynı çözünürlükte */
    videolar: [1, 2, 3, 4, 5].map((n) => ({
      file: `video-${n}.mp4`,
      poster: `video-${n}.jpg`,
      width: 464,
      height: 848,
    })),
    youtube: [],
  },
  {
    slug: "maktek-2026",
    ad: "MAKTEK Avrasya 2026",
    baslangic: "2026-09-28",
    bitis: "2026-10-03",
    mekan: { ad: "Tüyap Fuar ve Kongre Merkezi", sehir: "İstanbul", ulke: "TR" },
    ortak: "Dirinler Pres",
    fotolar: [],
    videolar: [],
    youtube: [],
  },
  {
    slug: "blechexpo-2017",
    ad: "Blechexpo 2017",
    baslangic: "2017-11-07",
    bitis: "2017-11-10",
    mekan: { ad: "Landesmesse Stuttgart", sehir: "Stuttgart", ulke: "DE" },
    fotolar: [],
    videolar: [],
    youtube: ["pUO5YhCUUs0"],
  },
];

export const fuarDosyasi = (slug: string, file: string) => `/fuarlar/${slug}/${file}`;

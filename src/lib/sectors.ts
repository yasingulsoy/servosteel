/**
 * Uygulama sektörleri — dil bağımsız iskelet.
 *
 * NEDEN AYRI BİR BÖLÜM: alıcı "roll form makinesi" aramıyor; "solar montaj
 * profili makinesi", "kablo kanalı üretim hattı", "market rafı roll form"
 * arıyor. Sektör sayfaları bu uzun kuyruğu toplar. Sektörler roll-form ile
 * SINIRLI DEĞİL — otomotiv ve beyaz eşyada iş pres besleme tarafından geliyor,
 * bu yüzden /roll-form-hatlari altına değil kendi bölümüne konuldu.
 *
 * `lines` ve `machines`: sektörün bağlandığı MEVCUT ürün sayfaları. Yeni sayfa
 * açmıyoruz, var olanları sektöre göre topluyoruz — mevcut URL'ler değişmiyor.
 *
 * `videos`: kanaldaki GERÇEK video kimlikleri. Sektör iddiasının kanıtı bunlar;
 * hepsi Servosteel'in kendi kanalında yayında.
 *
 * DİKKAT — çerçeve: bir sektörde video olması "o hattı üretiyoruz" demek
 * değildir. Çoğu videoda o sektörün üreticisine BESLEME SİSTEMİ verilmiş.
 * Metinler bu yüzden "uygulama alanı" dilinde yazılır, ürün iddiası değil.
 */

export type Sector = {
  slug: string;
  /** lucide ikon anahtarı (components/sector-icon.tsx) */
  icon: "energy" | "construction" | "logistics" | "automotive" | "furniture" | "machinery";
  /** Bağlantılı roll-form hattı slug'ları */
  lines: string[];
  /** Bağlantılı makine slug'ları */
  machines: string[];
  /** Kanaldaki gerçek YouTube video kimlikleri */
  videos: string[];
};

export const sectors: Sector[] = [
  {
    slug: "enerji",
    icon: "energy",
    lines: ["solar-profil", "kablo-kanali"],
    machines: ["servo-suruculer", "rulo-acicilar"],
    videos: [
      "WpgcqvfDGxY", // Solar GES C profil roll form hattı
      "Jb0Q2hUqkC0", // Solar GES C profil roll form hattı
      "SJB1vo0IpK4", // Solar profil roll forming line
      "AmUzbkdGz94", // Solar energy line
      "Q8ib1GtIplI", // Solar enerji dikme profili
      "U3vrOowAaSs", // Diagonal roll form hattı
      "dZFlUWKASn0", // Otomat ray / klemens ray
      "xipqsdmb56A", // Pano imalatı
      "2lrDqMmHmlg", // Kablo kanal hattı
      "gAF9a4uNg3Y", // Kanal merdiven
    ],
  },
  {
    slug: "insaat",
    icon: "construction",
    lines: ["iskele-kalas", "c-sigma-omega", "trapez-cephe-paneli", "yol-bariyeri", "gurultu-bariyeri"],
    machines: ["dogrultmali-servo-suruculer", "otomatik-istifleyici"],
    videos: [
      "YIO_4p9c7sE", // Çelik kalas hattı
      "Et0LqSbb3lw", // İskele kalas hattı
      "wJ4Ic8QVXsY", // Yol bariyer hattı
      "EQ54wWjqJHM", // Asma tavan hattı
      "FFN-DWlKK6U", // Dış cephe bağlantı elemanları
      "CFOYOJkSYRg", // Dış cephe bağlantı elemanları
      "-8nr4OAOrXM", // Alüminyum kepenk / davlumbaz
      "EsvFKg5hOAY", // Asansör kapı rayı
      "AwOMOqniZc8", // Asansör ekipmanları
      "s2qPGbfcyrE", // Havalandırma ekipmanları
    ],
  },
  {
    slug: "lojistik-depolama",
    icon: "logistics",
    lines: ["agir-raf"],
    machines: ["servo-suruculer", "otomatik-istifleyici"],
    videos: [
      "1VPa1ROQbhc", // Market raf roll forming hattı
      "SE8tTfxkKWI", // Raf imalatı
      "uYcMY45J4OA", // UNO chanel roll form hattı
    ],
  },
  /**
   * Aşağıdaki iki sektör firmanın kendi sektör/ürün/hat eşleme tablosundan
   * geldi (sekötrler.xlsx) — tabloda vardı, sitede yoktu.
   */
  {
    slug: "metal-mobilya",
    icon: "furniture",
    lines: ["agir-raf"],
    machines: ["servo-suruculer", "kompakt-hatlar"],
    videos: [
      "1VPa1ROQbhc", // Market raf roll forming hattı
      "oU_Fl1IewMU", // Banyo aksesuarları
    ],
  },
  {
    slug: "makine-ekipman",
    icon: "machinery",
    lines: ["c-sigma-omega"],
    machines: ["dogrultmali-servo-suruculer", "kompakt-hatlar"],
    /* Bu sektörde video seçkisi bilerek DAR: kanaldaki kayıtların çoğu
       başka sektörlere ait ve zorlama eşleştirme yanlış beyan olur. */
    videos: [
      "s2qPGbfcyrE", // Havalandırma ekipmanları
      "Q9s4biWoxI8", // Boru kelepçe imalatı
      "7_H6v8L3fSs", // Zincir imalatı
    ],
  },
  {
    slug: "otomotiv-beyaz-esya",
    icon: "automotive",
    lines: [],
    machines: ["servo-suruculer", "dogrultmali-servo-suruculer", "kompakt-hatlar"],
    videos: [
      "JiRHyDZ3Avs", // Otomotiv parça üretimi — Sırbistan
      "Mou1HTzXwE4", // Otomotiv parça üretimi — İtalya
      "9uuCqiEN3ZY", // Pres otomotiv rulo sac şekillendirme
      "ygR3uOEIIzE", // Beyaz eşya imalatı
      "NFIRAt990hY", // Panel radyatör üst kapak hattı
      "9qjcVtN7y28", // Petek ızgara
      "gZlLIyMHxwU", // Petek ızgara imalatı
      "oU_Fl1IewMU", // Banyo aksesuarları
    ],
  },
];

export const sectorSlugs = sectors.map((s) => s.slug);

export function isSectorSlug(slug: string): boolean {
  return sectorSlugs.includes(slug);
}

export function getSector(slug: string): Sector | undefined {
  return sectors.find((s) => s.slug === slug);
}

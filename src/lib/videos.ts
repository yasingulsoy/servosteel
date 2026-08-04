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

/**
 * Kanaldaki TÜM videoların gerçek metadata'sı.
 *
 * `videoGroups` /videolar sayfasının KÜRATÖRLÜ seçkisidir; bu katalog ise
 * kanalın tamamıdır. Sektör sayfaları buradan besleniyor — bir videoyu bir
 * sektöre bağlamak için sadece kimliğini lib/sectors.ts'e yazmak yetiyor.
 *
 * date/sec alanları yt-dlp ile YouTube'dan çekildi. VideoObject şeması
 * uploadDate'i ZORUNLU tutar ve tahmini tarih şemayı geçersiz kılar; bu yüzden
 * metadata'sı olmayan video şemaya hiç girmez (bkz. videoMeta).
 */
/** Kanaldaki TÜM videoların gerçek metadata'sı (yt-dlp, 102 kayıt). */
const CATALOG: VideoItem[] = [
  { id: "h7aPJ6rJc_U", date: "2026-07-13", sec: 182 }, // ServoSteel Rulo Sac Dilme Hattı / Coil Slitting Line / Линия продольной резки 
  { id: "qmWM1NgcACw", date: "2026-04-03", sec: 166 }, // Structural Steel Profiles Roll Forming Line Machine 350mmx5mm U-C Yapı Çelik G
  { id: "NR25bt36uQg", date: "2026-02-11", sec: 224 }, // ServoSteel & ServoMold Roll Forming Line Machine HMI & Production Reporting So
  { id: "UCeR9epppK8", date: "2025-11-17", sec: 137 }, // ServoSteel Roll Forming Line Automatic Stacker for U & C Profile Production
  { id: "ONmiUo8vtvk", date: "2025-08-01", sec: 123 }, // ServoSteel Decoiler Straightener Feeder System / Compact System
  { id: "-IJBSlt7H6Y", date: "2025-06-01", sec: 217 }, // ServoSteel & ServoMold (10. YILIMIZ KUTLU OLSUN - HAPPY 10TH ANNIVERSARY)
  { id: "5vVTpg3hltE", date: "2024-11-06", sec: 147 }, // ServoSteel / M Sigma Profil Ve Solar Ges C Profil Rollform Hattı / Solar C Pro
  { id: "J-O8xfI2ovA", date: "2024-08-29", sec: 96 }, // ServoSteel/ServoMold/ Ağır Hizmet Çelik Raf Market Direği/ HEAVY DUTY RACK PRO
  { id: "WpgcqvfDGxY", date: "2024-07-02", sec: 106 }, // Servo Steel / Solar Ges C Profil Rollform Hattı / Solar C Profile Rollformin L
  { id: "L8-dZg7kAKk", date: "2024-06-06", sec: 91 }, // Servo Steel / Rulo Sac Açma Makinası / Rulo Sac Boy Kesme Hattı / Cut to Lengt
  { id: "Jb0Q2hUqkC0", date: "2024-02-26", sec: 111 }, // Servo Steel / Solar Ges C Profil Rollform Hattı / Solar C Profil Rollformin Li
  { id: "tm520w7WsBI", date: "2023-12-04", sec: 129 }, // ServoSteel / Solar C Profile Production Lines / Solar C Profil Üretim Hattı
  { id: "U3vrOowAaSs", date: "2023-11-06", sec: 108 }, // ServoSteel / Diagonal Roll Form Hattı / Diagonal roll forming line
  { id: "SJB1vo0IpK4", date: "2023-10-11", sec: 116 }, // Servo Steel / Solar Ges C Profil Rollform Hattı / Solar Profıles Roll Formıng 
  { id: "mLP_37kH06M", date: "2023-07-07", sec: 121 }, // Servo Steel / Solar Ges C Profil Rollform Hattı / Solar C Profil Rollformin Li
  { id: "Qyx4uoxu810", date: "2023-05-29", sec: 104 }, // Servo Steel / Rulo Sac Açma Makinası / Rulo Sac Boy Kesme Hattı / Cut to Lengt
  { id: "GEYcBSPqutQ", date: "2023-04-28", sec: 167 }, // Servo Steel Rulo Sac Dilme Hattı / ServoSteel Coil Slitting Line
  { id: "hc_Znq2u8MI", date: "2022-10-05", sec: 133 }, // ServoSteel Rulo Sac Dilme Ve Punch Delik Delme Hattı - Roll Punch and Cut-to-L
  { id: "uJBkNTQQqK4", date: "2022-09-15", sec: 141 }, // Servo Steel Rulo Sac Dilme Hattı / Coil Slitting Line
  { id: "mwZx6X1mV0c", date: "2022-05-16", sec: 231 }, // ServoSteel Cut to Length Line / Rulo Sac Boy Kesme Hattı
  { id: "MaJswAJo8JQ", date: "2022-04-07", sec: 295 }, // ServoSteel & ServoMold / Kablo Kanal Hattı / Cable Tray Production Lines
  { id: "4QETxHS-CD4", date: "2022-03-11", sec: 328 }, // ServoSteel Boy Kesme Hatları / Cut to Length Lines
  { id: "dZFlUWKASn0", date: "2022-03-02", sec: 71 }, // ServoSteel Otomat Ray Klemens Ray Rollform Hattı
  { id: "r2i4ekuSgH4", date: "2022-03-01", sec: 135 }, // ServoSteel Rulo Sac Boy Kesme Hattı / Cut to Length Lines
  { id: "lp5SYxnOyZ8", date: "2022-01-18", sec: 89 }, // ServoSteel  Cut to Length Line  / Rulo Sac Boy Kesme Hattı
  { id: "EsvFKg5hOAY", date: "2022-01-17", sec: 129 }, // ServoSteel Asansör Kapı Rayı Rollform Hattı
  { id: "JOHZwMBLqKo", date: "2021-10-27", sec: 243 }, // ServoSteel Dilme Ve Boy Kesme Hattı & Coil Slitting And Cut-to-Length Line
  { id: "aoGq70qn_wI", date: "2021-10-25", sec: 99 }, // Servo Steel Boy Kesme Hattı
  { id: "qlHxLjWS52Q", date: "2021-10-21", sec: 189 }, // ServoSteel Soğuk Rulo Sac Haddeleme Makinası
  { id: "EaN_Q6SdRzg", date: "2021-06-15", sec: 133 }, // ServoSteel Boy Kesme Hattı
  { id: "3xmcJvv6LNc", date: "2021-06-12", sec: 176 }, // ServoSteel Solar Panel Rollform Hattı
  { id: "_lOTZE21aGE", date: "2021-04-26", sec: 172 }, // ServoSteel & Klima Santral Rulo Sac Boy Kesme Hattı
  { id: "2tgCtC8n_1E", date: "2021-04-17", sec: 150 }, // ServoSteel Pres Besleme Sistemleri
  { id: "OozPnPYhkVY", date: "2021-04-15", sec: 50 }, // ServoSteel Otomat Ray Klemens Ray Rollform Hattı
  { id: "a7W3BzFYiow", date: "2021-04-15", sec: 156 }, // ServoSteel & Sarıgözoğlu Pres Besleme Sistemleri
  { id: "-8nr4OAOrXM", date: "2021-04-05", sec: 144 }, // ServoSteel Alüminyum Kepenk Davlumbaz Rollform Hattı
  { id: "gAF9a4uNg3Y", date: "2021-04-01", sec: 125 }, // ServoSteel Kanal Merdiven Hattı & Chanel Ladder Lıne
  { id: "uYcMY45J4OA", date: "2021-03-17", sec: 181 }, // ServoSteel UNO Chanel Rollform Hattı
  { id: "2lrDqMmHmlg", date: "2021-03-17", sec: 158 }, // ServoSteel Kablo Kanal Hattı & Cable Tray Line
  { id: "-PLsVMx4VE0", date: "2021-03-10", sec: 207 }, // ServoSteel & Sarıgözoğlu Pres Besleme Sistemleri
  { id: "HR88wNpqu98", date: "2021-01-19", sec: 142 }, // ServoSteel Rulo Kenar Ve Boy Kesme Hattı
  { id: "PVT9TJByKZA", date: "2020-12-15", sec: 187 }, // ServoSteel & ServoMold
  { id: "1VPa1ROQbhc", date: "2020-12-08", sec: 124 }, // ServoSteel Market Raf Rollforming Hattı
  { id: "uRgA_M9Hj9Y", date: "2020-11-09", sec: 168 }, // ServoSteel Boy Kesme Hattı
  { id: "_RCREnpe-ko", date: "2018-05-07", sec: 122 }, // SERVOSTEEL - Boy Kesme Hattı - Cut to Roll Length Machine -  Линии Поперечной 
  { id: "EcRm89gy_xs", date: "2018-05-07", sec: 45 }, // SERVOSTEEL Compact Line  - Kompakt Pres Besleme Sistemi
  { id: "AmUzbkdGz94", date: "2018-05-07", sec: 145 }, // SERVOSTEEL Rollforming Line / Solar energy line / Cолнечная энергия линия
  { id: "pUO5YhCUUs0", date: "2018-05-07", sec: 57 }, // ServoSteel - Blechexpo 2017 Fuarı
  { id: "oU_Fl1IewMU", date: "2017-08-29", sec: 47 }, // ServoSteel / Pres Besleme Sistemleri / Banyo Aksesuarları
  { id: "AwOMOqniZc8", date: "2017-08-29", sec: 91 }, // ServoSteel / Pres Besleme Sistemleri / Asansör Ekipmanları
  { id: "gZlLIyMHxwU", date: "2017-08-17", sec: 75 }, // ServoSteel - Pres Besleme Sistemleri - Petek Izgara İmalatı
  { id: "5JRpTEUXun4", date: "2017-08-16", sec: 39 }, // ServoSteel - Pres Besleme Sistemleri - Boy Kesme Hattı Test Aşaması
  { id: "JiRHyDZ3Avs", date: "2017-08-16", sec: 78 }, // ServoSteel - Pres Besleme Sistemleri - Otomotiv Parça Üretimi - Sırbistan
  { id: "Mou1HTzXwE4", date: "2017-08-16", sec: 69 }, // ServoSteel - Pres Besleme Sistemleri - Otomotiv Parça Üretimi - İtalya
  { id: "WfSe7M60W3Y", date: "2017-08-12", sec: 83 }, // ServoSteel - Pres Besleme Sistemleri - Asansör Bağlantı Elemanları
  { id: "fzcIa14TLP0", date: "2017-08-12", sec: 112 }, // ServoSteel - Pres Besleme Sistemleri - Fason İmalat
  { id: "hVhopZTeplo", date: "2017-08-12", sec: 84 }, // ServoSteel - Pres Besleme Sistemleri - Fason İmalat
  { id: "Et0LqSbb3lw", date: "2017-08-12", sec: 61 }, // ServoSteel - Pres Besleme Sistemi - İskele Kalas Hattı
  { id: "9uuCqiEN3ZY", date: "2017-06-10", sec: 95 }, // ServoSteel / Pres Otomotiv Rulo  Sac Şekillendirme Hattı / Servo Sürücü Ve Rul
  { id: "7RcuUmfN7QE", date: "2017-06-10", sec: 114 }, // ServoSteel / Kompakt Hat Test Aşaması / SRV606 - 6mm / SRV3000 - 3'Ton Hidroli
  { id: "Q8ib1GtIplI", date: "2017-04-22", sec: 92 }, // ServoSteel / Solar Enerji Dikme Profili / Servo Sürücü Sistemleri / Steel Maki
  { id: "FFN-DWlKK6U", date: "2017-04-08", sec: 114 }, // ServoSteel / Dış Cephe Bağlantı Elemanları /Servo Sürücü Ve Rulo Sac Açma Sist
  { id: "s2qPGbfcyrE", date: "2017-04-08", sec: 81 }, // ServoSteel / Havalandırma Ekipmanları /Servo Sürücü Ve Rulo Sac Açma Sistemler
  { id: "CFOYOJkSYRg", date: "2017-04-08", sec: 97 }, // ServoSteel / Dış Cephe Bağlantı Elemanları /Servo Sürücü Ve Rulo Sac Açma Sist
  { id: "Q9s4biWoxI8", date: "2017-04-08", sec: 39 }, // ServoSteel / Boru Kelepçe İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri
  { id: "Wio7E5_jSwg", date: "2017-04-08", sec: 43 }, // ServoSteel / Sera Bağlantı Elemanları /Servo Sürücü Ve Rulo Sac Açma Sistemler
  { id: "dl-fkLurlGY", date: "2017-04-08", sec: 72 }, // ServoSteel / Dış Cephe Bağlantı Elemanları /Servo Sürücü Ve Rulo Sac Açma Sist
  { id: "ygR3uOEIIzE", date: "2017-04-08", sec: 72 }, // ServoSteel / Beyaz Eşya İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri
  { id: "wJ4Ic8QVXsY", date: "2017-04-01", sec: 135 }, // ServoSteel / Yol Bariyer Hattı /Servo Sürücü Ve Rulo Sac Açma Sistemleri /Stra
  { id: "9qjcVtN7y28", date: "2017-04-01", sec: 95 }, // ServoSteel / Petek Izgara  /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Straigh
  { id: "3JSHgO9t4EE", date: "2017-04-01", sec: 81 }, // ServoSteel / Bakalit İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Strai
  { id: "7_H6v8L3fSs", date: "2017-04-01", sec: 97 }, // ServoSteel / Zincir İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Straig
  { id: "EQ54wWjqJHM", date: "2017-04-01", sec: 175 }, // ServoSteel / Asma Tavan Hattı /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Stra
  { id: "xipqsdmb56A", date: "2017-03-18", sec: 169 }, // ServoSteel / Pano İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Straight
  { id: "ZbrbNsy_Pf0", date: "2016-09-21", sec: 163 }, // SERVOSTEEL® / RULO SAC AÇMA VE SÜRME SİSTEMLERİ
  { id: "H-h-IF4QbUI", date: "2016-07-19", sec: 122 }, // ServoSteel , Kenar Ve Boy Kesme Hattı , Cut To Length Sheet Line
  { id: "SE8tTfxkKWI", date: "2016-06-18", sec: 104 }, // ServoSteel / Raf İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Straighte
  { id: "ZmsULZfvhGo", date: "2016-05-24", sec: 53 }, // ServoSteel / Steel Makina  , Kompakt Sistem , Sevkiyat Öncesi Test
  { id: "WYSDLD9We40", date: "2016-04-16", sec: 111 }, // SERVOSTEEL, Rulo Sac Açma Ve Sürme Sistemleri / Coil Feeding Systems
  { id: "FizIELj6iA8", date: "2016-04-05", sec: 81 }, // ServoSteel , Boy Kesme Hattı , Cut to Length Lines
  { id: "NFIRAt990hY", date: "2016-03-29", sec: 73 }, // ServoSteel , Roll Forming ,Panel Radyatör Üst Kapak Hattı..
  { id: "3vyCkJLbiEo", date: "2016-03-29", sec: 163 }, // ServoSteel Roll Forming Feeding Line , Mechanical Decoiler , Servo Feeder with
  { id: "r2DspNVGD40", date: "2016-02-26", sec: 127 }, // SERVOSTEEL, Rulo Sac Açma Ve Sürme Sistemleri / Coil Feeding Systems
  { id: "ikmDnxvuzdM", date: "2016-02-22", sec: 100 }, // SERVOSTEEL, Rulo Sac Açma Ve Sürme Sistemleri / Coil Feeding Systems
  { id: "Vl3Xksubd1k", date: "2016-02-09", sec: 194 }, // SERVOSTEEL, Rulo Sac Açma Ve Sürme Sistemleri / Coil Feeding Systems
  { id: "CnYT8fZV0mE", date: "2016-01-20", sec: 58 }, // SERVOSTEEL, Rulo Sac Açma Ve Doğrultma Sistemleri / Coil Feeding System
  { id: "6BKIwW1dqts", date: "2016-01-20", sec: 66 }, // SERVOSTEEL, Rulo Sac Açma Ve Doğrultma Sistemleri / Coil Feeding Systems
  { id: "P3zbB3c6NBY", date: "2015-11-23", sec: 85 }, // SERVOSTEEL / SRV504 DOĞRULTMALI SERVO SÜRÜCÜ / 2.5'TON RULO AÇICI
  { id: "iujuSe6ezX4", date: "2015-11-21", sec: 60 }, // ServoSteel / Doğrultmalı Servo Sürücü
  { id: "tw7dO6pfmG8", date: "2015-11-21", sec: 90 }, // SERVOSTEEL /  SRV3000A-INV  3'TON MEKANİK RULO SAC AÇMA MAKİNASI
  { id: "VwFAmHGj_hc", date: "2015-11-14", sec: 60 }, // SERVO STEEL / RULO SAC AÇMA MAKİNASI VE DOĞRULTMALI SERVO SÜRÜCÜ
  { id: "bc5nAkQXJTw", date: "2015-11-14", sec: 101 }, // SERVOSTEEL / MDS302 , MİNİ DOĞRULTMALI SERVO SÜRÜCÜ - SRV500-INV , 500'KG RULO
  { id: "7vkSE8vx1Ks", date: "2015-10-31", sec: 53 }, // SERVOSTEEL - RULO AÇICI -  RULO SARICI - SERVO SÜRÜCÜ
  { id: "YHG77aJiMBs", date: "2015-10-30", sec: 103 }, // SERVOSTEEL - DOĞRULTMALI SERVO SÜRÜCÜ - KOMPAKT HAT
  { id: "v9_1snhusMY", date: "2015-10-30", sec: 125 }, // SERVOSTEEL - HİDROLİK RULO SARICI
  { id: "KNcz5vikj6w", date: "2015-10-30", sec: 61 }, // SERVOSTEEL - RULO SAC DİLME HATTI
  { id: "AqcEyDbbWtA", date: "2015-08-31", sec: 106 }, // ServoSteel , Hidrolik rulo açıcı , Rulo açıcı , Frenli Rulo Sac Açma Makinası
  { id: "YIO_4p9c7sE", date: "2015-07-29", sec: 150 }, // SERVOSTEEL® ÇELİK KALAS HATTI Servo Feeders with Straightener
  { id: "9YzWpue9Ujo", date: "2015-07-24", sec: 30 }, // SERVOSTEEL / STEEL MAKİNA / İSKELE KALASI
  { id: "bLHhRhloysM", date: "2015-07-24", sec: 105 }, // SERVOSTEEL / STEEL MAKİNA
  { id: "5me9dmSmeHg", date: "2015-07-24", sec: 50 }, // SERVOSTEEL / STEEL MAKİNA
  { id: "8LFK6sbpqkw", date: "2015-07-23", sec: 241 }, // SERVOSTEEL / STEEL MAKİNA
];

const CATALOG_BY_ID = new Map(CATALOG.map((v) => [v.id, v]));

/** Kimlikten video metadata'sı; bilinmeyen kimlikte undefined döner. */
export function videoMeta(id: string): VideoItem | undefined {
  return CATALOG_BY_ID.get(id);
}

/** Kanaldaki toplam video sayısı — /videolar sayfasında gösterilir. */
export const CHANNEL_VIDEO_COUNT = CATALOG.length;

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

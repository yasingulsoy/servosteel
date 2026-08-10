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
  /** Yayın anı, tam ISO 8601 + saat dilimi — schema.org uploadDate.
   *  Sadece tarih basmak Search Console'da "zaman dilimi eksik" ve
   *  "geçersiz datetime" uyarısı üretiyordu. Değerler YouTube'dan
   *  gerçek upload timestamp olarak çekildi, saat uydurulmadı. */
  date: string;
  /** Süre (saniye) — ISO 8601'e çevrilir */
  sec: number;
};

/**
 * Katalog kaydı = VideoItem + YouTube'daki gerçek başlık.
 * Başlık ayrı bir alan çünkü çevrilmiyor (gerekçe: videoTitle).
 */
export type CatalogItem = VideoItem & { title: string };

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
      { id: "h7aPJ6rJc_U", date: "2026-07-13T11:26:11+03:00", sec: 182 },
      { id: "GEYcBSPqutQ", date: "2023-04-28T11:23:32+03:00", sec: 167 },
      { id: "hc_Znq2u8MI", date: "2022-10-05T15:56:48+03:00", sec: 133 },
      { id: "JOHZwMBLqKo", date: "2021-10-27T09:37:02+03:00", sec: 243 },
      { id: "KNcz5vikj6w", date: "2015-10-30T15:47:33+03:00", sec: 61 },
      { id: "uJBkNTQQqK4", date: "2022-09-16T00:30:43+03:00", sec: 141 },
    ],
  },
  {
    key: "ctl",
    href: "/boy-kesme-hatlari",
    items: [
      { id: "4QETxHS-CD4", date: "2022-03-11T12:45:36+03:00", sec: 328 },
      { id: "mwZx6X1mV0c", date: "2022-05-16T17:48:18+03:00", sec: 231 },
      { id: "H-h-IF4QbUI", date: "2016-07-19T10:59:49+03:00", sec: 122 },
      { id: "_lOTZE21aGE", date: "2021-04-26T17:46:51+03:00", sec: 172 },
      { id: "Qyx4uoxu810", date: "2023-05-29T17:02:38+03:00", sec: 104 },
      { id: "L8-dZg7kAKk", date: "2024-06-06T10:37:50+03:00", sec: 91 },
      { id: "r2i4ekuSgH4", date: "2022-03-01T12:02:55+03:00", sec: 135 },
      { id: "lp5SYxnOyZ8", date: "2022-01-18T10:40:23+03:00", sec: 89 },
      { id: "FizIELj6iA8", date: "2016-04-05T19:58:40+03:00", sec: 81 },
      { id: "_RCREnpe-ko", date: "2018-05-07T20:52:36+03:00", sec: 122 },
      { id: "HR88wNpqu98", date: "2021-01-19T21:38:04+03:00", sec: 142 },
      { id: "EaN_Q6SdRzg", date: "2021-06-15T07:17:49+03:00", sec: 133 },
      { id: "aoGq70qn_wI", date: "2021-10-25T09:13:51+03:00", sec: 99 },
      { id: "uRgA_M9Hj9Y", date: "2020-11-09T17:55:08+03:00", sec: 168 },
    ],
  },
  {
    key: "rollform",
    href: "/roll-form-hatlari",
    items: [
      { id: "qmWM1NgcACw", date: "2026-04-03T09:56:53+03:00", sec: 166 },
      { id: "NR25bt36uQg", date: "2026-02-11T13:08:05+03:00", sec: 224 },
      { id: "UCeR9epppK8", date: "2025-11-17T06:19:34+03:00", sec: 137 },
      { id: "MaJswAJo8JQ", date: "2022-04-07T23:48:39+03:00", sec: 295 },
      { id: "J-O8xfI2ovA", date: "2024-08-29T13:26:54+03:00", sec: 96 },
      { id: "2lrDqMmHmlg", date: "2021-03-17T17:14:28+03:00", sec: 158 },
      { id: "-8nr4OAOrXM", date: "2021-04-05T16:34:17+03:00", sec: 144 },
      { id: "1VPa1ROQbhc", date: "2020-12-08T22:30:17+03:00", sec: 124 },
      { id: "EsvFKg5hOAY", date: "2022-01-17T12:58:40+03:00", sec: 129 },
      { id: "OozPnPYhkVY", date: "2021-04-15T18:08:34+03:00", sec: 50 },
      { id: "dZFlUWKASn0", date: "2022-03-02T13:25:34+03:00", sec: 71 },
      { id: "U3vrOowAaSs", date: "2023-11-06T16:52:00+03:00", sec: 108 },
      { id: "uYcMY45J4OA", date: "2021-03-17T17:35:56+03:00", sec: 181 },
      { id: "gAF9a4uNg3Y", date: "2021-04-01T14:55:57+03:00", sec: 125 },
      { id: "NFIRAt990hY", date: "2016-03-29T20:56:34+03:00", sec: 73 },
      { id: "wJ4Ic8QVXsY", date: "2017-04-01T16:14:39+03:00", sec: 135 },
      { id: "YIO_4p9c7sE", date: "2015-07-29T09:26:19+03:00", sec: 150 },
      { id: "9YzWpue9Ujo", date: "2015-07-24T18:00:58+03:00", sec: 30 },
    ],
  },
  {
    key: "solar",
    href: "/roll-form-hatlari/solar-profil",
    items: [
      { id: "3xmcJvv6LNc", date: "2021-06-12T07:00:22+03:00", sec: 176 },
      { id: "5vVTpg3hltE", date: "2024-11-06T17:44:27+03:00", sec: 147 },
      { id: "tm520w7WsBI", date: "2023-12-04T16:49:44+03:00", sec: 129 },
      { id: "Jb0Q2hUqkC0", date: "2024-02-26T12:40:01+03:00", sec: 111 },
      { id: "SJB1vo0IpK4", date: "2023-10-11T15:32:21+03:00", sec: 116 },
      { id: "WpgcqvfDGxY", date: "2024-07-02T09:10:46+03:00", sec: 106 },
      { id: "mLP_37kH06M", date: "2023-07-07T11:22:38+03:00", sec: 121 },
      { id: "AmUzbkdGz94", date: "2018-05-07T19:03:13+03:00", sec: 145 },
      { id: "Q8ib1GtIplI", date: "2017-04-22T13:22:29+03:00", sec: 92 },
    ],
  },
  {
    key: "feeding",
    href: "/makineler/servo-suruculer",
    items: [
      { id: "2tgCtC8n_1E", date: "2021-04-17T22:34:25+03:00", sec: 150 },
      { id: "ONmiUo8vtvk", date: "2025-08-01T17:29:17+03:00", sec: 123 },
      { id: "a7W3BzFYiow", date: "2021-04-15T17:56:28+03:00", sec: 156 },
      { id: "7RcuUmfN7QE", date: "2017-06-10T12:10:34+03:00", sec: 114 },
      { id: "EcRm89gy_xs", date: "2018-05-07T19:48:14+03:00", sec: 45 },
      { id: "YHG77aJiMBs", date: "2015-10-30T17:43:25+03:00", sec: 103 },
      { id: "ZmsULZfvhGo", date: "2016-05-24T19:01:47+03:00", sec: 53 },
      { id: "-PLsVMx4VE0", date: "2021-03-10T14:15:29+03:00", sec: 207 },
      { id: "JiRHyDZ3Avs", date: "2017-08-16T18:45:26+03:00", sec: 78 },
      { id: "Mou1HTzXwE4", date: "2017-08-16T18:35:11+03:00", sec: 69 },
      { id: "WfSe7M60W3Y", date: "2017-08-12T15:27:36+03:00", sec: 83 },
      { id: "AwOMOqniZc8", date: "2017-08-29T19:57:55+03:00", sec: 91 },
      { id: "gZlLIyMHxwU", date: "2017-08-17T19:31:30+03:00", sec: 75 },
      { id: "5JRpTEUXun4", date: "2017-08-16T19:17:37+03:00", sec: 39 },
      { id: "Et0LqSbb3lw", date: "2017-08-12T10:01:20+03:00", sec: 61 },
      { id: "9uuCqiEN3ZY", date: "2017-06-10T15:59:51+03:00", sec: 95 },
    ],
  },
  {
    key: "machines",
    href: "/makineler",
    items: [
      { id: "P3zbB3c6NBY", date: "2015-11-23T11:01:10+03:00", sec: 85 },
      { id: "bc5nAkQXJTw", date: "2015-11-14T18:52:08+03:00", sec: 101 },
      { id: "AqcEyDbbWtA", date: "2015-08-31T14:43:37+03:00", sec: 106 },
      { id: "v9_1snhusMY", date: "2015-10-30T17:08:52+03:00", sec: 125 },
      { id: "tw7dO6pfmG8", date: "2015-11-21T13:49:29+03:00", sec: 90 },
      { id: "7vkSE8vx1Ks", date: "2015-10-31T13:20:07+03:00", sec: 53 },
      { id: "VwFAmHGj_hc", date: "2015-11-14T19:06:54+03:00", sec: 60 },
      { id: "iujuSe6ezX4", date: "2015-11-21T17:13:27+03:00", sec: 60 },
      { id: "6BKIwW1dqts", date: "2016-01-20T11:59:57+03:00", sec: 66 },
      { id: "CnYT8fZV0mE", date: "2016-01-20T12:39:42+03:00", sec: 58 },
      { id: "Vl3Xksubd1k", date: "2016-02-09T13:40:41+03:00", sec: 194 },
      { id: "WYSDLD9We40", date: "2016-04-16T12:31:01+03:00", sec: 111 },
      { id: "ikmDnxvuzdM", date: "2016-02-22T23:26:55+03:00", sec: 100 },
      { id: "r2DspNVGD40", date: "2016-02-26T18:48:08+03:00", sec: 127 },
      { id: "ZbrbNsy_Pf0", date: "2016-09-21T19:12:47+03:00", sec: 163 },
      { id: "3vyCkJLbiEo", date: "2016-03-29T20:13:26+03:00", sec: 163 },
      { id: "qlHxLjWS52Q", date: "2021-10-21T18:16:29+03:00", sec: 189 },
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
const CATALOG: CatalogItem[] = [
  { id: "h7aPJ6rJc_U", date: "2026-07-13T11:26:11+03:00", sec: 182, title: "Rulo Sac Dilme Hattı / Coil Slitting Line / Линия продольной резки рулонного металла" },
  { id: "qmWM1NgcACw", date: "2026-04-03T09:56:53+03:00", sec: 166, title: "Structural Steel Profiles Roll Forming Line Machine 350mmx5mm U-C Yapı Çelik Ges Profil üretim hattı" },
  { id: "NR25bt36uQg", date: "2026-02-11T13:08:05+03:00", sec: 224, title: "Roll Forming Line Machine HMI & Production Reporting Software U - C Profile" },
  { id: "UCeR9epppK8", date: "2025-11-17T06:19:34+03:00", sec: 137, title: "Roll Forming Line Automatic Stacker for U & C Profile Production" },
  { id: "ONmiUo8vtvk", date: "2025-08-01T17:29:17+03:00", sec: 123, title: "Decoiler Straightener Feeder System / Compact System" },
  { id: "-IJBSlt7H6Y", date: "2025-06-01T11:38:32+03:00", sec: 217, title: "(10. YILIMIZ KUTLU OLSUN - HAPPY 10TH ANNIVERSARY)" },
  { id: "5vVTpg3hltE", date: "2024-11-06T17:44:27+03:00", sec: 147, title: "M Sigma Profil Ve Solar Ges C Profil Rollform Hattı / Solar C Profile / Sigma M Profil" },
  { id: "J-O8xfI2ovA", date: "2024-08-29T13:26:54+03:00", sec: 96, title: "Ağır Hizmet Çelik Raf Market Direği/ HEAVY DUTY RACK PROFILE ROLL FORMING LINE" },
  { id: "WpgcqvfDGxY", date: "2024-07-02T09:10:46+03:00", sec: 106, title: "Solar Ges C Profil Rollform Hattı / Solar C Profile Rollformin Line /Solar C Profile" },
  { id: "L8-dZg7kAKk", date: "2024-06-06T10:37:50+03:00", sec: 91, title: "Rulo Sac Açma Makinası / Rulo Sac Boy Kesme Hattı / Cut to Length Lines ServoSteel" },
  { id: "Jb0Q2hUqkC0", date: "2024-02-26T12:40:01+03:00", sec: 111, title: "Solar Ges C Profil Rollform Hattı / Solar C Profil Rollformin Line /Solar C Profile" },
  { id: "tm520w7WsBI", date: "2023-12-04T16:49:44+03:00", sec: 129, title: "Solar C Profile Production Lines / Solar C Profil Üretim Hattı" },
  { id: "U3vrOowAaSs", date: "2023-11-06T16:52:00+03:00", sec: 108, title: "Diagonal Roll Form Hattı / Diagonal roll forming line" },
  { id: "SJB1vo0IpK4", date: "2023-10-11T15:32:21+03:00", sec: 116, title: "Solar Ges C Profil Rollform Hattı / Solar Profıles Roll Formıng Line" },
  { id: "mLP_37kH06M", date: "2023-07-07T11:22:38+03:00", sec: 121, title: "Solar Ges C Profil Rollform Hattı / Solar C Profil Rollformin Line" },
  { id: "Qyx4uoxu810", date: "2023-05-29T17:02:38+03:00", sec: 104, title: "Rulo Sac Açma Makinası / Rulo Sac Boy Kesme Hattı / Cut to Length Lines ServoSteel" },
  { id: "GEYcBSPqutQ", date: "2023-04-28T11:23:32+03:00", sec: 167, title: "Rulo Sac Dilme Hattı / ServoSteel Coil Slitting Line" },
  { id: "hc_Znq2u8MI", date: "2022-10-05T15:56:48+03:00", sec: 133, title: "Rulo Sac Dilme Ve Punch Delik Delme Hattı - Roll Punch and Cut-to-Length Line" },
  { id: "uJBkNTQQqK4", date: "2022-09-16T00:30:43+03:00", sec: 141, title: "Rulo Sac Dilme Hattı / Coil Slitting Line" },
  { id: "mwZx6X1mV0c", date: "2022-05-16T17:48:18+03:00", sec: 231, title: "Cut to Length Line / Rulo Sac Boy Kesme Hattı" },
  { id: "MaJswAJo8JQ", date: "2022-04-07T23:48:39+03:00", sec: 295, title: "Kablo Kanal Hattı / Cable Tray Production Lines" },
  { id: "4QETxHS-CD4", date: "2022-03-11T12:45:36+03:00", sec: 328, title: "Boy Kesme Hatları / Cut to Length Lines" },
  { id: "dZFlUWKASn0", date: "2022-03-02T13:25:34+03:00", sec: 71, title: "Otomat Ray Klemens Ray Rollform Hattı" },
  { id: "r2i4ekuSgH4", date: "2022-03-01T12:02:55+03:00", sec: 135, title: "Rulo Sac Boy Kesme Hattı / Cut to Length Lines" },
  { id: "lp5SYxnOyZ8", date: "2022-01-18T10:40:23+03:00", sec: 89, title: "Cut to Length Line / Rulo Sac Boy Kesme Hattı" },
  { id: "EsvFKg5hOAY", date: "2022-01-17T12:58:40+03:00", sec: 129, title: "Asansör Kapı Rayı Rollform Hattı" },
  { id: "JOHZwMBLqKo", date: "2021-10-27T09:37:02+03:00", sec: 243, title: "Dilme Ve Boy Kesme Hattı & Coil Slitting And Cut-to-Length Line" },
  { id: "aoGq70qn_wI", date: "2021-10-25T09:13:51+03:00", sec: 99, title: "Boy Kesme Hattı" },
  { id: "qlHxLjWS52Q", date: "2021-10-21T18:16:29+03:00", sec: 189, title: "Soğuk Rulo Sac Haddeleme Makinası" },
  { id: "EaN_Q6SdRzg", date: "2021-06-15T07:17:49+03:00", sec: 133, title: "Boy Kesme Hattı" },
  { id: "3xmcJvv6LNc", date: "2021-06-12T07:00:22+03:00", sec: 176, title: "Solar Panel Rollform Hattı" },
  { id: "_lOTZE21aGE", date: "2021-04-26T17:46:51+03:00", sec: 172, title: "Klima Santral Rulo Sac Boy Kesme Hattı" },
  { id: "2tgCtC8n_1E", date: "2021-04-17T22:34:25+03:00", sec: 150, title: "Pres Besleme Sistemleri" },
  { id: "OozPnPYhkVY", date: "2021-04-15T18:08:34+03:00", sec: 50, title: "Otomat Ray Klemens Ray Rollform Hattı" },
  { id: "a7W3BzFYiow", date: "2021-04-15T17:56:28+03:00", sec: 156, title: "Sarıgözoğlu Pres Besleme Sistemleri" },
  { id: "-8nr4OAOrXM", date: "2021-04-05T16:34:17+03:00", sec: 144, title: "Alüminyum Kepenk Davlumbaz Rollform Hattı" },
  { id: "gAF9a4uNg3Y", date: "2021-04-01T14:55:57+03:00", sec: 125, title: "Kanal Merdiven Hattı & Chanel Ladder Lıne" },
  { id: "uYcMY45J4OA", date: "2021-03-17T17:35:56+03:00", sec: 181, title: "UNO Chanel Rollform Hattı" },
  { id: "2lrDqMmHmlg", date: "2021-03-17T17:14:28+03:00", sec: 158, title: "Kablo Kanal Hattı & Cable Tray Line" },
  { id: "-PLsVMx4VE0", date: "2021-03-10T14:15:29+03:00", sec: 207, title: "Sarıgözoğlu Pres Besleme Sistemleri" },
  { id: "HR88wNpqu98", date: "2021-01-19T21:38:04+03:00", sec: 142, title: "Rulo Kenar Ve Boy Kesme Hattı" },
  { id: "PVT9TJByKZA", date: "2020-12-15T18:45:43+03:00", sec: 187, title: "ServoMold" },
  { id: "1VPa1ROQbhc", date: "2020-12-08T22:30:17+03:00", sec: 124, title: "Market Raf Rollforming Hattı" },
  { id: "uRgA_M9Hj9Y", date: "2020-11-09T17:55:08+03:00", sec: 168, title: "Boy Kesme Hattı" },
  { id: "_RCREnpe-ko", date: "2018-05-07T20:52:36+03:00", sec: 122, title: "Boy Kesme Hattı - Cut to Roll Length Machine - Линии Поперечной Резки Металла" },
  { id: "EcRm89gy_xs", date: "2018-05-07T19:48:14+03:00", sec: 45, title: "Compact Line - Kompakt Pres Besleme Sistemi" },
  { id: "AmUzbkdGz94", date: "2018-05-07T19:03:13+03:00", sec: 145, title: "Rollforming Line / Solar energy line / Cолнечная энергия линия" },
  { id: "pUO5YhCUUs0", date: "2018-05-07T17:06:53+03:00", sec: 57, title: "Blechexpo 2017 Fuarı" },
  { id: "oU_Fl1IewMU", date: "2017-08-29T21:20:57+03:00", sec: 47, title: "Pres Besleme Sistemleri / Banyo Aksesuarları" },
  { id: "AwOMOqniZc8", date: "2017-08-29T19:57:55+03:00", sec: 91, title: "Pres Besleme Sistemleri / Asansör Ekipmanları" },
  { id: "gZlLIyMHxwU", date: "2017-08-17T19:31:30+03:00", sec: 75, title: "Pres Besleme Sistemleri - Petek Izgara İmalatı" },
  { id: "5JRpTEUXun4", date: "2017-08-16T19:17:37+03:00", sec: 39, title: "Pres Besleme Sistemleri - Boy Kesme Hattı Test Aşaması" },
  { id: "JiRHyDZ3Avs", date: "2017-08-16T18:45:26+03:00", sec: 78, title: "Pres Besleme Sistemleri - Otomotiv Parça Üretimi - Sırbistan" },
  { id: "Mou1HTzXwE4", date: "2017-08-16T18:35:11+03:00", sec: 69, title: "Pres Besleme Sistemleri - Otomotiv Parça Üretimi - İtalya" },
  { id: "WfSe7M60W3Y", date: "2017-08-12T15:27:36+03:00", sec: 83, title: "Pres Besleme Sistemleri - Asansör Bağlantı Elemanları" },
  { id: "fzcIa14TLP0", date: "2017-08-12T12:10:43+03:00", sec: 112, title: "Pres Besleme Sistemleri - Fason İmalat" },
  { id: "hVhopZTeplo", date: "2017-08-12T10:59:36+03:00", sec: 84, title: "Pres Besleme Sistemleri - Fason İmalat" },
  { id: "Et0LqSbb3lw", date: "2017-08-12T10:01:20+03:00", sec: 61, title: "Pres Besleme Sistemi - İskele Kalas Hattı" },
  { id: "9uuCqiEN3ZY", date: "2017-06-10T15:59:51+03:00", sec: 95, title: "Pres Otomotiv Rulo Sac Şekillendirme Hattı / Servo Sürücü Ve Rulo Sac Açma Sistemleri" },
  { id: "7RcuUmfN7QE", date: "2017-06-10T12:10:34+03:00", sec: 114, title: "Kompakt Hat Test Aşaması / SRV606 - 6mm / SRV3000 - 3'Ton Hidrolik / Compact Line Test" },
  { id: "Q8ib1GtIplI", date: "2017-04-22T13:22:29+03:00", sec: 92, title: "Solar Enerji Dikme Profili / Servo Sürücü Sistemleri / Steel Makina" },
  { id: "FFN-DWlKK6U", date: "2017-04-08T15:25:21+03:00", sec: 114, title: "Dış Cephe Bağlantı Elemanları /Servo Sürücü Ve Rulo Sac Açma Sistemleri" },
  { id: "s2qPGbfcyrE", date: "2017-04-08T14:09:34+03:00", sec: 81, title: "Havalandırma Ekipmanları /Servo Sürücü Ve Rulo Sac Açma Sistemleri" },
  { id: "CFOYOJkSYRg", date: "2017-04-08T13:05:22+03:00", sec: 97, title: "Dış Cephe Bağlantı Elemanları /Servo Sürücü Ve Rulo Sac Açma Sistemleri" },
  { id: "Q9s4biWoxI8", date: "2017-04-08T11:45:28+03:00", sec: 39, title: "Boru Kelepçe İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri" },
  { id: "Wio7E5_jSwg", date: "2017-04-08T11:41:01+03:00", sec: 43, title: "Sera Bağlantı Elemanları /Servo Sürücü Ve Rulo Sac Açma Sistemleri" },
  { id: "dl-fkLurlGY", date: "2017-04-08T11:36:32+03:00", sec: 72, title: "Dış Cephe Bağlantı Elemanları /Servo Sürücü Ve Rulo Sac Açma Sistemleri" },
  { id: "ygR3uOEIIzE", date: "2017-04-08T10:19:27+03:00", sec: 72, title: "Beyaz Eşya İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri" },
  { id: "wJ4Ic8QVXsY", date: "2017-04-01T16:14:39+03:00", sec: 135, title: "Yol Bariyer Hattı /Servo Sürücü Ve Rulo Sac Açma Sistemleri /Straightener Servo Feeders" },
  { id: "9qjcVtN7y28", date: "2017-04-01T14:53:47+03:00", sec: 95, title: "Petek Izgara /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Straightener Servo Feeders" },
  { id: "3JSHgO9t4EE", date: "2017-04-01T13:04:47+03:00", sec: 81, title: "Bakalit İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Straightener Servo Feeders" },
  { id: "7_H6v8L3fSs", date: "2017-04-01T12:23:15+03:00", sec: 97, title: "Zincir İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Straightener Servo Feeders" },
  { id: "EQ54wWjqJHM", date: "2017-04-01T11:28:59+03:00", sec: 175, title: "Asma Tavan Hattı /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Straightener Servo Feeders" },
  { id: "xipqsdmb56A", date: "2017-03-18T13:58:54+03:00", sec: 169, title: "Pano İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Straightener Servo Feeders" },
  { id: "ZbrbNsy_Pf0", date: "2016-09-21T19:12:47+03:00", sec: 163, title: "SERVOSTEEL® / RULO SAC AÇMA VE SÜRME SİSTEMLERİ" },
  { id: "H-h-IF4QbUI", date: "2016-07-19T10:59:49+03:00", sec: 122, title: "Kenar Ve Boy Kesme Hattı , Cut To Length Sheet Line" },
  { id: "SE8tTfxkKWI", date: "2016-06-18T12:19:04+03:00", sec: 104, title: "Raf İmalatı /Servo Sürücü Ve Rulo Sac Açma Sistemleri / Straightener Servo Feeders" },
  { id: "ZmsULZfvhGo", date: "2016-05-24T19:01:47+03:00", sec: 53, title: "Steel Makina , Kompakt Sistem , Sevkiyat Öncesi Test" },
  { id: "WYSDLD9We40", date: "2016-04-16T12:31:01+03:00", sec: 111, title: "Rulo Sac Açma Ve Sürme Sistemleri / Coil Feeding Systems" },
  { id: "FizIELj6iA8", date: "2016-04-05T19:58:40+03:00", sec: 81, title: "Boy Kesme Hattı , Cut to Length Lines" },
  { id: "NFIRAt990hY", date: "2016-03-29T20:56:34+03:00", sec: 73, title: "Roll Forming ,Panel Radyatör Üst Kapak Hattı.." },
  { id: "3vyCkJLbiEo", date: "2016-03-29T20:13:26+03:00", sec: 163, title: "Roll Forming Feeding Line , Mechanical Decoiler , Servo Feeder with Straihgtener." },
  { id: "r2DspNVGD40", date: "2016-02-26T18:48:08+03:00", sec: 127, title: "Rulo Sac Açma Ve Sürme Sistemleri / Coil Feeding Systems" },
  { id: "ikmDnxvuzdM", date: "2016-02-22T23:26:55+03:00", sec: 100, title: "Rulo Sac Açma Ve Sürme Sistemleri / Coil Feeding Systems" },
  { id: "Vl3Xksubd1k", date: "2016-02-09T13:40:41+03:00", sec: 194, title: "Rulo Sac Açma Ve Sürme Sistemleri / Coil Feeding Systems" },
  { id: "CnYT8fZV0mE", date: "2016-01-20T12:39:42+03:00", sec: 58, title: "Rulo Sac Açma Ve Doğrultma Sistemleri / Coil Feeding System" },
  { id: "6BKIwW1dqts", date: "2016-01-20T11:59:57+03:00", sec: 66, title: "Rulo Sac Açma Ve Doğrultma Sistemleri / Coil Feeding Systems" },
  { id: "P3zbB3c6NBY", date: "2015-11-23T11:01:10+03:00", sec: 85, title: "SRV504 DOĞRULTMALI SERVO SÜRÜCÜ / 2.5'TON RULO AÇICI" },
  { id: "iujuSe6ezX4", date: "2015-11-21T17:13:27+03:00", sec: 60, title: "Doğrultmalı Servo Sürücü" },
  { id: "tw7dO6pfmG8", date: "2015-11-21T13:49:29+03:00", sec: 90, title: "SRV3000A-INV 3'TON MEKANİK RULO SAC AÇMA MAKİNASI" },
  { id: "VwFAmHGj_hc", date: "2015-11-14T19:06:54+03:00", sec: 60, title: "RULO SAC AÇMA MAKİNASI VE DOĞRULTMALI SERVO SÜRÜCÜ" },
  { id: "bc5nAkQXJTw", date: "2015-11-14T18:52:08+03:00", sec: 101, title: "MDS302 , MİNİ DOĞRULTMALI SERVO SÜRÜCÜ - SRV500-INV , 500'KG RULO AÇICI" },
  { id: "7vkSE8vx1Ks", date: "2015-10-31T13:20:07+03:00", sec: 53, title: "RULO AÇICI - RULO SARICI - SERVO SÜRÜCÜ" },
  { id: "YHG77aJiMBs", date: "2015-10-30T17:43:25+03:00", sec: 103, title: "DOĞRULTMALI SERVO SÜRÜCÜ - KOMPAKT HAT" },
  { id: "v9_1snhusMY", date: "2015-10-30T17:08:52+03:00", sec: 125, title: "HİDROLİK RULO SARICI" },
  { id: "KNcz5vikj6w", date: "2015-10-30T15:47:33+03:00", sec: 61, title: "RULO SAC DİLME HATTI" },
  { id: "AqcEyDbbWtA", date: "2015-08-31T14:43:37+03:00", sec: 106, title: "Hidrolik rulo açıcı , Rulo açıcı , Frenli Rulo Sac Açma Makinası" },
  { id: "YIO_4p9c7sE", date: "2015-07-29T09:26:19+03:00", sec: 150, title: "SERVOSTEEL® ÇELİK KALAS HATTI Servo Feeders with Straightener" },
  { id: "9YzWpue9Ujo", date: "2015-07-24T18:00:58+03:00", sec: 30, title: "STEEL MAKİNA / İSKELE KALASI" },
  { id: "bLHhRhloysM", date: "2015-07-24T10:33:25+03:00", sec: 105, title: "STEEL MAKİNA" },
  { id: "5me9dmSmeHg", date: "2015-07-24T09:30:31+03:00", sec: 50, title: "STEEL MAKİNA" },
  { id: "8LFK6sbpqkw", date: "2015-07-23T17:00:36+03:00", sec: 241, title: "STEEL MAKİNA" },
];

const CATALOG_BY_ID = new Map(CATALOG.map((v) => [v.id, v]));

/** Kimlikten video metadata'sı; bilinmeyen kimlikte undefined döner. */
export function videoMeta(id: string): VideoItem | undefined {
  return CATALOG_BY_ID.get(id);
}

/**
 * Videonun YouTube'daki gerçek başlığı (marka öneki temizlenmiş).
 *
 * ÇEVİRİLMEZ ve bu bilinçli: 102 video × 9 dil = 918 dize eder, her yeni
 * videoda dokuz dil borcu doğar ve liste kaçınılmaz olarak bayatlar.
 * YouTube başlıkları zaten çoğunlukla iki dilli (TR/EN, kimi zaman RU) ve
 * gerçek veridir. Küratörlü 24 videonun elle yazılmış başlıkları message
 * dosyalarında durmaya devam eder; `titleOf` önce onlara bakar, yoksa buraya
 * düşer (bkz. videoTitleResolver).
 */
export function videoTitle(id: string): string | undefined {
  return CATALOG_BY_ID.get(id)?.title;
}

/**
 * Başlık çözücü: çeviri varsa onu, yoksa gerçek YouTube başlığını döndürür.
 * Hiçbiri yoksa kimliği döndürür — boş başlık VideoObject'i geçersiz kılar.
 */
export function videoTitleResolver(
  translated: (id: string) => string | undefined
): (id: string) => string {
  return (id) => translated(id) ?? videoTitle(id) ?? id;
}

/** Kanaldaki toplam video sayısı — /videolar sayfasında gösterilir. */
export const CHANNEL_VIDEO_COUNT = CATALOG.length;

/**
 * Küratörlü gruplara girmemiş videolar — yeniden eskiye.
 *
 * /videolar sayfası önce 6 küratörlü grubu (elle yazılmış başlıklar, ürün
 * sayfasına bağlı), ardından bu listeyi gösterir. Böylece kanalın TAMAMI
 * sitede indekslenir: her biri VideoObject şeması taşır ve video aramasında
 * ayrı bir giriş noktası olur.
 */
const CURATED_IDS = new Set(allVideos.map((v) => v.id));

export const uncuratedVideos: CatalogItem[] = CATALOG.filter(
  (v) => !CURATED_IDS.has(v.id)
);

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

/**
 * Ürün sayfası -> video eşlemesi. BAŞLIK DOĞRULANARAK kuruldu: her kimlik,
 * message dosyalarındaki küratörlü başlığı o ürünü açıkça anlatan videodur
 * ("Kablo kanalı üretim hattı" -> kablo-kanali gibi).
 *
 * Neden var: rakip denetiminde (2026-08-07, 18 site) videoyu ürün sayfasına
 * gömmek yaygın pratik çıktı; bizde video yalnızca /videolar'daydı. B2B
 * alıcısının %70'i karar sürecinde video izliyor — video ürünün yanında
 * durmalı, ayrı bir arşiv sayfasında değil.
 *
 * İskele, yol/gürültü bariyeri ve trapez BİLEREK yok: küratörlü 24 video
 * içinde bu ürünleri net gösteren kayıt yok. Yanlış video göstermektense
 * bölüm hiç basılmaz (RelatedVideos boş listede null döner).
 */
const PRODUCT_VIDEO_IDS: Record<string, string[]> = {
  "/dilme-hatlari": ["h7aPJ6rJc_U", "JOHZwMBLqKo"],
  "/boy-kesme-hatlari": ["4QETxHS-CD4", "mwZx6X1mV0c"],
  "/roll-form-hatlari": ["MaJswAJo8JQ", "3xmcJvv6LNc"],
  "/roll-form-hatlari/kablo-kanali": ["MaJswAJo8JQ"],
  "/roll-form-hatlari/solar-profil": ["3xmcJvv6LNc", "tm520w7WsBI"],
  "/roll-form-hatlari/agir-raf": ["J-O8xfI2ovA"],
  "/roll-form-hatlari/c-sigma-omega": ["qmWM1NgcACw", "5vVTpg3hltE"],
  "/makineler/rulo-acicilar": ["AqcEyDbbWtA", "v9_1snhusMY"],
  "/makineler/servo-suruculer": ["2tgCtC8n_1E", "a7W3BzFYiow"],
  "/makineler/dogrultmali-servo-suruculer": ["P3zbB3c6NBY", "bc5nAkQXJTw"],
  "/makineler/kompakt-hatlar": ["ONmiUo8vtvk", "7RcuUmfN7QE"],
  "/makineler/otomatik-istifleyici": ["UCeR9epppK8"],
};

const VIDEO_BY_ID = new Map(allVideos.map((v) => [v.id, v]));

/** Bir ürün yolunun doğrulanmış videoları; eşleme yoksa boş dizi. */
export function videosForProduct(path: string): VideoItem[] {
  return (PRODUCT_VIDEO_IDS[path] ?? [])
    .map((id) => VIDEO_BY_ID.get(id))
    .filter((v): v is VideoItem => Boolean(v));
}

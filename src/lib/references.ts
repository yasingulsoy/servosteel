/**
 * Adı geçen müşteri referansları.
 *
 * ⚠️ YAYIN KİLİDİ — `PUBLISH_REFERENCES` false olduğu sürece bu bölüm siteye
 * HİÇ basılmaz. Bir müşterinin logosunu ve adını kendi pazarlama sayfanızda
 * kullanmak o firmanın iznini gerektirir; izin gelmeden yayına almak ticari ve
 * hukuki bir risktir. İzin geldiğinde tek yapılacak: aşağıdaki sabiti true
 * yapmak. Logolar zaten yerinde (public/gorseller/referanslar/).
 *
 * Sarıgözoğlu için işi kolaylaştıran bir dayanak var: Servosteel kendi YouTube
 * kanalında "ServoSteel & Sarıgözoğlu Pres Besleme Sistemleri" videosunu
 * yayınlamış (-PLsVMx4VE0), yani iş birliği zaten kamuya açık.
 */
export const PUBLISH_REFERENCES = false;

export type ClientReference = {
  /** Firmanın resmî tam adı */
  name: string;
  /** public/ altındaki logo yolu */
  logo: string;
  /** Logonun doğal en/boy oranı — yer ayırmak için (CLS önlemi) */
  width: number;
  height: number;
  /** Çeviri anahtarı: refs.clients.<key> */
  key: string;
  /** Varsa, iş birliğini gösteren kendi kanalımızdaki video kimliği */
  video?: string;
};

export const clientReferences: ClientReference[] = [
  {
    key: "sarigozoglu",
    name: "Sarıgözoğlu Hidrolik Makina ve Kalıp Sanayi A.Ş.",
    logo: "/gorseller/referanslar/sarigozoglu.png",
    width: 700,
    height: 92,
    video: "-PLsVMx4VE0",
  },
  {
    key: "mega-solar",
    name: "Mega Solar Metal A.Ş.",
    logo: "/gorseller/referanslar/mega-solar.svg",
    width: 158,
    height: 27,
  },
];

/** Yayına açık referanslar; kilit kapalıysa boş dizi. */
export function visibleReferences(): ClientReference[] {
  return PUBLISH_REFERENCES ? clientReferences : [];
}

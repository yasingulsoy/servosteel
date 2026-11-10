/** Şemadaki CHECK değerlerinin ekranda görünen adları. Sıra = ekrandaki sıra. */

export const ETKINLIK_TURU = {
  fuar: "Fuar",
  ziyaret: "Ziyaret",
  konferans: "Konferans",
  webinar: "Webinar",
  diger: "Diğer",
} as const;

export const POTANSIYEL = {
  yuksek: "Yüksek",
  var: "Potansiyel var",
  belirsiz: "Belirsiz",
  yok: "Potansiyel yok",
} as const;

export const POTANSIYEL_RENK: Record<keyof typeof POTANSIYEL, string> = {
  yuksek: "bg-success-500 text-white",
  var: "bg-success-50 text-success-600",
  belirsiz: "bg-gray-100 text-gray-700",
  yok: "bg-error-50 text-error-600",
};

export const FIRMA_DURUMU = {
  aday: "Aday",
  musteri: "Müşteri",
  eski_musteri: "Eski müşteri",
  is_ortagi: "Bayi / iş ortağı",
  rakip: "Rakip",
} as const;

export const TAKIP = {
  yeni: "Yeni talep",
  gorusuldu: "Görüşüldü",
  eposta_gonderildi: "E-posta gönderildi",
  teknik_bilgi_istendi: "Teknik bilgi istendi",
  cizim_bekleniyor: "Çizim bekleniyor",
  teklif_verilecek: "Teklif verilecek",
  teklif_gonderildi: "Teklif gönderildi",
  olumsuz: "Olumsuz",
} as const;

export const TAKIP_RENK: Record<keyof typeof TAKIP, string> = {
  yeni: "bg-theme-purple-50 text-theme-purple-500",
  gorusuldu: "bg-gray-100 text-gray-700",
  eposta_gonderildi: "bg-blue-light-50 text-blue-light-500",
  teknik_bilgi_istendi: "bg-warning-50 text-warning-600",
  cizim_bekleniyor: "bg-warning-50 text-warning-600",
  teklif_verilecek: "bg-orange-50 text-orange-600",
  teklif_gonderildi: "bg-success-50 text-success-600",
  olumsuz: "bg-error-50 text-error-600",
};

export const KANAL = {
  fuar: "Fuar",
  tanitim_maili: "Tanıtım maili",
  site_formu: "Site formu",
  europages: "Europages",
  telefon: "Telefon",
  ziyaret: "Ziyaret",
  referans: "Referans",
  eski_musteri: "Eski müşteri",
  diger: "Diğer",
} as const;

export const TEKLIF_DURUMU = {
  hazirlaniyor: "Hazırlanıyor",
  gonderildi: "Gönderildi",
  kabul: "Kabul edildi",
  red: "Reddedildi",
  iptal: "İptal",
} as const;

export const TEKLIF_RENK: Record<keyof typeof TEKLIF_DURUMU, string> = {
  hazirlaniyor: "bg-gray-100 text-gray-700",
  gonderildi: "bg-blue-light-50 text-blue-light-500",
  kabul: "bg-success-500 text-white",
  red: "bg-error-50 text-error-600",
  iptal: "bg-gray-100 text-gray-500 line-through",
};

export const RED_SEBEBI = {
  fiyat: "Fiyat",
  teslim_suresi: "Teslim süresi",
  rakip: "Rakibi seçti",
  proje_iptal: "Proje iptal",
  cevap_yok: "Cevap yok",
  teknik: "Teknik uygunsuzluk",
  finansman: "Finansman",
  diger: "Diğer",
} as const;

export const DOVIZ = { EUR: "€", USD: "$", TRY: "₺", GBP: "£" } as const;

export const SIPARIS_DURUMU = {
  uretimde: "Üretimde",
  sevk_edildi: "Sevk edildi",
  kuruldu: "Kuruldu",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
} as const;

export const SERVIS_TURU = {
  ariza: "Arıza",
  bakim: "Bakım",
  yedek_parca: "Yedek parça",
  egitim: "Eğitim",
  diger: "Diğer",
} as const;

export const SERVIS_DURUMU = {
  acik: "Açık",
  surecte: "Sürüyor",
  kapandi: "Kapandı",
} as const;

export const SERVIS_RENK: Record<keyof typeof SERVIS_DURUMU, string> = {
  acik: "bg-error-50 text-error-600",
  surecte: "bg-warning-50 text-warning-600",
  kapandi: "bg-gray-100 text-gray-600",
};

export const ROL = {
  yonetici: "Yönetici",
  satis: "Satış",
  pazarlama: "Pazarlama",
  goruntuleyici: "Görüntüleyici",
} as const;

export function gecerli<T extends Record<string, string>>(liste: T, deger: unknown, varsayilan: keyof T): keyof T {
  return typeof deger === "string" && deger in liste ? (deger as keyof T) : varsayilan;
}

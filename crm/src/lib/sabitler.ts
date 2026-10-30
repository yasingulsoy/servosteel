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
  yuksek: "bg-emerald-600 text-white",
  var: "bg-emerald-100 text-emerald-900",
  belirsiz: "bg-zinc-100 text-zinc-700",
  yok: "bg-red-50 text-red-800",
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
  yeni: "bg-violet-100 text-violet-900",
  gorusuldu: "bg-zinc-100 text-zinc-700",
  eposta_gonderildi: "bg-sky-100 text-sky-900",
  teknik_bilgi_istendi: "bg-amber-100 text-amber-900",
  cizim_bekleniyor: "bg-amber-100 text-amber-900",
  teklif_verilecek: "bg-orange-200 text-orange-950",
  teklif_gonderildi: "bg-emerald-100 text-emerald-900",
  olumsuz: "bg-red-50 text-red-800",
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
  hazirlaniyor: "bg-zinc-100 text-zinc-700",
  gonderildi: "bg-sky-100 text-sky-900",
  kabul: "bg-emerald-600 text-white",
  red: "bg-red-50 text-red-800",
  iptal: "bg-zinc-100 text-zinc-500 line-through",
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

export const ROL = {
  yonetici: "Yönetici",
  satis: "Satış",
  pazarlama: "Pazarlama",
  goruntuleyici: "Görüntüleyici",
} as const;

export function gecerli<T extends Record<string, string>>(liste: T, deger: unknown, varsayilan: keyof T): keyof T {
  return typeof deger === "string" && deger in liste ? (deger as keyof T) : varsayilan;
}

/**
 * Akademi arayüz metinleri — next-intl mesajlarından bağımsız, modüler.
 * fs içermez → hem sunucu hem client bileşenlerinden güvenle import edilebilir
 * (header/footer client olduğu için ayrı tutulur; içerik okuyucu akademi.ts'te).
 */
export type AkademiUi = {
  nav: string;
  title: string;
  subtitle: string;
  allPosts: string;
  readMore: string;
  minRead: string;
  empty: string;
  published: string;
};

const FALLBACK: AkademiUi = {
  nav: "Akademi",
  title: "Servosteel Akademi",
  subtitle: "",
  allPosts: "All articles",
  readMore: "Read more",
  minRead: "min read",
  empty: "New articles coming soon.",
  published: "Published",
};

export const akademiUi: Record<string, AkademiUi> = {
  tr: {
    nav: "Akademi",
    title: "Servosteel Akademi",
    subtitle:
      "Rulo işleme, roll form ve pres besleme üzerine mühendislik rehberleri, teknik ipuçları ve saha deneyimleri.",
    allPosts: "Tüm yazılar",
    readMore: "Devamını oku",
    minRead: "dk okuma",
    empty: "Yakında yeni içerikler yayınlanacak.",
    published: "Yayınlandı",
  },
  en: {
    nav: "Academy",
    title: "Servosteel Academy",
    subtitle:
      "Engineering guides, technical tips and field insights on coil processing, roll forming and press feeding.",
    allPosts: "All articles",
    readMore: "Read more",
    minRead: "min read",
    empty: "New articles coming soon.",
    published: "Published",
  },
  de: {
    nav: "Akademie",
    title: "Servosteel Akademie",
    subtitle:
      "Engineering-Leitfäden, technische Tipps und Praxiswissen zu Bandverarbeitung, Rollformen und Pressenzuführung.",
    allPosts: "Alle Beiträge",
    readMore: "Weiterlesen",
    minRead: "Min. Lesezeit",
    empty: "Bald neue Inhalte.",
    published: "Veröffentlicht",
  },
  es: {
    nav: "Academia",
    title: "Servosteel Academia",
    subtitle:
      "Guías de ingeniería, consejos técnicos y experiencia de campo sobre procesamiento de bobina, perfilado y alimentación de prensas.",
    allPosts: "Todos los artículos",
    readMore: "Leer más",
    minRead: "min de lectura",
    empty: "Pronto nuevos artículos.",
    published: "Publicado",
  },
  it: {
    nav: "Accademia",
    title: "Servosteel Accademia",
    subtitle:
      "Guide tecniche, consigli e know-how sul campo su lavorazione coil, profilatura e alimentazione presse.",
    allPosts: "Tutti gli articoli",
    readMore: "Leggi di più",
    minRead: "min di lettura",
    empty: "Presto nuovi contenuti.",
    published: "Pubblicato",
  },
  hu: {
    nav: "Akadémia",
    title: "Servosteel Akadémia",
    subtitle:
      "Mérnöki útmutatók, technikai tippek és terepi tapasztalatok tekercsfeldolgozás, görgős profilozás és présadagolás témában.",
    allPosts: "Összes cikk",
    readMore: "Tovább",
    minRead: "perc olvasás",
    empty: "Hamarosan új tartalmak.",
    published: "Közzétéve",
  },
  pl: {
    nav: "Akademia",
    title: "Servosteel Akademia",
    subtitle:
      "Poradniki inżynierskie, wskazówki techniczne i doświadczenia z praktyki dotyczące przetwarzania kręgów, profilowania i podawania pras.",
    allPosts: "Wszystkie artykuły",
    readMore: "Czytaj dalej",
    minRead: "min czytania",
    empty: "Wkrótce nowe treści.",
    published: "Opublikowano",
  },
  ru: {
    nav: "Академия",
    title: "Servosteel Академия",
    subtitle:
      "Инженерные руководства, технические советы и практический опыт по обработке рулона, профилированию и подаче в пресс.",
    allPosts: "Все статьи",
    readMore: "Читать далее",
    minRead: "мин чтения",
    empty: "Скоро новые материалы.",
    published: "Опубликовано",
  },
  ar: {
    nav: "الأكاديمية",
    title: "أكاديمية Servosteel",
    subtitle:
      "أدلة هندسية ونصائح تقنية وخبرات ميدانية حول معالجة اللفائف والدرفلة وتغذية المكابس.",
    allPosts: "كل المقالات",
    readMore: "اقرأ المزيد",
    minRead: "دقيقة قراءة",
    empty: "محتوى جديد قريبًا.",
    published: "نُشر في",
  },
};

export const getAkademiUi = (locale: string): AkademiUi => akademiUi[locale] ?? FALLBACK;

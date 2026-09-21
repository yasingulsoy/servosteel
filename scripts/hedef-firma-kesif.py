# -*- coding: utf-8 -*-
"""Yeni hedef firma kesfi: ulke konumlu Google aramasi + otomatik dogrulama.

  python scripts/hedef-firma-kesif.py --plan      # sorgu sayisi ve tahmini ucret, hicbir sey cekmez
  python scripts/hedef-firma-kesif.py             # ara (onbellekte yoksa) + dogrula + .md yaz

1. Her hedef ulkede, o ulkenin is dilinde, 12 segment icin "<urun> ureticisi"
   aramasi (DataForSEO standart kuyruk, ilk 20 sonuc). Sonuclar
   seo/hedef-firmalar/kesif/serp-<tarih>.json'a yazilir; ayni gun ikinci
   calistirmada yeniden ucret odenmez.
2. Rehber/pazar yeri/sosyal ag sonuclari, makine ureticileri (rakip) ve listede
   zaten olan (ya da daha once elenmis) alan adlari atilir.
3. Kalan her aday taranir. Satira girmesi icin HEPSI gerekli:
     - site aciliyor, segmentin urunu sayfada geciyor (hedef-firma-dogrula.py KELIME)
     - uretim izi var; sepet var ama uretim izi yoksa dukkan sayilir, elenir
     - ulke tutuyor: alan adi o ulkenin uzantisinda ya da sitede ulkenin telefon kodu var
       (yerel aramada cikan Cinli/Hintli ihracatci bu kontrolde dusuyor)
     - e-posta firmanin KENDI sitesinde yaziyor (eposta_bulucu.py)
4. Sonuc: seo/hedef-firmalar/bolge-kesif-<tarih>.md — bolge dosyasi bicimi
   (Segment sutunlu); Excel betigi ve dogrulayici dogrudan okur.

Kapsam disi: AB'de B2B e-postaya da onceden izin arayan ulkeler (DE, AT, PL, ES,
IT, CZ, RO — mevcut satirlari duruyor, yenisi eklenmiyor) ve yaptirim altindaki
pazarlar (Rusya, Belarus, Iran, Suriye).
"""
import argparse
import base64
import importlib.util
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from html import unescape as html_coz
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
from datetime import date

sys.stdout.reconfigure(encoding="utf-8")
BURASI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BURASI)
import eposta_bulucu as B  # noqa: E402

_spec = importlib.util.spec_from_file_location("dogrula", os.path.join(BURASI, "hedef-firma-dogrula.py"))
D = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(D)

KLASOR = D.KLASOR
KESIF = os.path.join(KLASOR, "kesif")
API = "https://api.dataforseo.com/v3/"
AYAR = os.path.expanduser("~/.config/claude-seo/dataforseo.json")
DERINLIK = 20
SAYFA_UCRETI = 0.0006   # standart kuyruk, 10 sonuc (bkz. siralama.py)

SEGMENT_ADI = {
    "kablo-kanali": "Kablo Kanalı", "solar-profil": "Solar Profil", "raf-sistemleri": "Raf Sistemleri",
    "yol-bariyeri": "Yol Bariyeri", "cati-cephe-paneli": "Çatı ve Cephe Paneli",
    "celik-servis-merkezi": "Çelik Servis Merkezi", "asik-celik-yapi": "Aşık ve Çelik Yapı",
    "iskele-kalasi": "İskele Kalası", "market-rafi": "Market Rafı", "havalandirma-kanali": "Havalandırma Kanalı",
    "metal-mobilya": "Çelik Mobilya", "alcipan-profili": "Alçıpan Profili",
    "pres-atolyeleri": "Pres Atölyeleri",
}

SORGU = {
    "en": {"kablo-kanali": "cable tray manufacturer", "solar-profil": "solar mounting structure manufacturer",
           "raf-sistemleri": "pallet racking manufacturer", "yol-bariyeri": "crash barrier guardrail manufacturer",
           "cati-cephe-paneli": "roofing sheet manufacturer", "celik-servis-merkezi": "steel coil slitting service center",
           "asik-celik-yapi": "steel purlin manufacturer", "iskele-kalasi": "scaffolding manufacturer",
           "market-rafi": "supermarket shelving manufacturer", "havalandirma-kanali": "HVAC duct manufacturer",
           "metal-mobilya": "steel lockers cabinets manufacturer", "alcipan-profili": "drywall metal stud manufacturer"},
    "es": {"kablo-kanali": "fabricante de bandejas portacables", "solar-profil": "fabricante de estructuras para paneles solares",
           "raf-sistemleri": "fabricante de racks industriales", "yol-bariyeri": "fabricante de defensas metálicas para carreteras",
           "cati-cephe-paneli": "fabricante de techos metálicos y panel sándwich", "celik-servis-merkezi": "centro de servicio de acero corte de bobinas",
           "asik-celik-yapi": "fabricante de perfiles metálicos C y Z", "iskele-kalasi": "fabricante de andamios",
           "market-rafi": "fabricante de góndolas para supermercado", "havalandirma-kanali": "fabricante de ductos para aire acondicionado",
           "metal-mobilya": "fabricante de lockers metálicos", "alcipan-profili": "fabricante de perfiles para drywall"},
    "pt": {"kablo-kanali": "fabricante de eletrocalhas", "solar-profil": "fabricante de estruturas para painéis solares",
           "raf-sistemleri": "fabricante de porta paletes", "yol-bariyeri": "fabricante de defensas metálicas rodovias",
           "cati-cephe-paneli": "fabricante de telhas metálicas", "celik-servis-merkezi": "centro de serviços de aço corte de bobinas",
           "asik-celik-yapi": "fabricante de perfis estruturais U enrijecido", "iskele-kalasi": "fabricante de andaimes",
           "market-rafi": "fabricante de gôndolas para supermercado", "havalandirma-kanali": "fabricante de dutos de ar condicionado",
           "metal-mobilya": "fabricante de armários de aço", "alcipan-profili": "fabricante de perfis para drywall"},
    "fr": {"kablo-kanali": "fabricant de chemins de câbles", "solar-profil": "fabricant de structures pour panneaux solaires",
           "raf-sistemleri": "fabricant de rayonnage industriel", "yol-bariyeri": "fabricant de glissières de sécurité",
           "cati-cephe-paneli": "fabricant de tôles de couverture panneaux sandwich", "celik-servis-merkezi": "centre de service acier découpe de bobines",
           "asik-celik-yapi": "fabricant de profilés pannes acier", "iskele-kalasi": "fabricant d'échafaudages",
           "market-rafi": "fabricant de gondoles supermarché", "havalandirma-kanali": "fabricant de gaines de ventilation",
           "metal-mobilya": "fabricant de mobilier métallique armoires vestiaires", "alcipan-profili": "fabricant de profilés pour plaques de plâtre"},
    "ru": {"kablo-kanali": "производитель кабельных лотков", "solar-profil": "производство конструкций для солнечных панелей",
           "raf-sistemleri": "производство стеллажей", "yol-bariyeri": "производство дорожных ограждений",
           "cati-cephe-paneli": "производство профнастила", "celik-servis-merkezi": "металлосервис продольная резка рулонной стали",
           "asik-celik-yapi": "производство ЛСТК профилей", "iskele-kalasi": "производство строительных лесов",
           "market-rafi": "производство торгового оборудования стеллажи", "havalandirma-kanali": "производство воздуховодов",
           "metal-mobilya": "производство металлической мебели", "alcipan-profili": "производство профиля для гипсокартона"},
    "vi": {"kablo-kanali": "sản xuất máng cáp", "solar-profil": "sản xuất khung giá đỡ pin năng lượng mặt trời",
           "raf-sistemleri": "sản xuất kệ kho hàng", "yol-bariyeri": "sản xuất tôn lượn sóng hộ lan",
           "cati-cephe-paneli": "sản xuất tôn lợp", "celik-servis-merkezi": "xẻ băng thép cuộn",
           "asik-celik-yapi": "sản xuất xà gồ thép", "iskele-kalasi": "sản xuất giàn giáo",
           "market-rafi": "sản xuất kệ siêu thị", "havalandirma-kanali": "sản xuất ống gió",
           "metal-mobilya": "sản xuất tủ sắt văn phòng", "alcipan-profili": "sản xuất khung trần thạch cao"},
    "id": {"kablo-kanali": "produsen kabel tray", "solar-profil": "produsen mounting panel surya",
           "raf-sistemleri": "produsen rak gudang", "yol-bariyeri": "produsen guardrail jalan",
           "cati-cephe-paneli": "pabrik atap spandek", "celik-servis-merkezi": "slitting coil baja",
           "asik-celik-yapi": "pabrik baja ringan kanal C", "iskele-kalasi": "produsen scaffolding",
           "market-rafi": "produsen rak minimarket", "havalandirma-kanali": "produsen ducting",
           "metal-mobilya": "produsen lemari besi", "alcipan-profili": "produsen rangka plafon hollow"},
}

# (listede kullanilan Turkce ad, ISO, dil, telefon kodu, sorguya eklenecek ulke adi)
ULKELER = [
    ("Hindistan", "IN", "en", "91", "India"), ("BAE", "AE", "en", "971", "UAE"),
    ("Suudi Arabistan", "SA", "en", "966", "Saudi Arabia"), ("Mısır", "EG", "en", "20", "Egypt"),
    ("Katar", "QA", "en", "974", "Qatar"), ("Kuveyt", "KW", "en", "965", "Kuwait"),
    ("Umman", "OM", "en", "968", "Oman"), ("Bahreyn", "BH", "en", "973", "Bahrain"),
    ("Ürdün", "JO", "en", "962", "Jordan"), ("Irak", "IQ", "en", "964", "Iraq"),
    ("Nijerya", "NG", "en", "234", "Nigeria"), ("Kenya", "KE", "en", "254", "Kenya"),
    ("Güney Afrika", "ZA", "en", "27", "South Africa"), ("Gana", "GH", "en", "233", "Ghana"),
    ("Tanzanya", "TZ", "en", "255", "Tanzania"), ("Etiyopya", "ET", "en", "251", "Ethiopia"),
    ("Uganda", "UG", "en", "256", "Uganda"), ("Pakistan", "PK", "en", "92", "Pakistan"),
    ("Bangladeş", "BD", "en", "880", "Bangladesh"), ("Sri Lanka", "LK", "en", "94", "Sri Lanka"),
    ("Malezya", "MY", "en", "60", "Malaysia"), ("Filipinler", "PH", "en", "63", "Philippines"),
    ("Tayland", "TH", "en", "66", "Thailand"), ("Singapur", "SG", "en", "65", "Singapore"),
    ("Birleşik Krallık", "GB", "en", "44", "UK"), ("ABD", "US", "en", "1", "USA"),
    ("Kanada", "CA", "en", "1", "Canada"), ("Avustralya", "AU", "en", "61", "Australia"),
    ("Yeni Zelanda", "NZ", "en", "64", "New Zealand"),
    ("Meksika", "MX", "es", "52", "México"), ("Kolombiya", "CO", "es", "57", "Colombia"),
    ("Peru", "PE", "es", "51", "Perú"), ("Şili", "CL", "es", "56", "Chile"),
    ("Arjantin", "AR", "es", "54", "Argentina"), ("Ekvador", "EC", "es", "593", "Ecuador"),
    ("Guatemala", "GT", "es", "502", "Guatemala"), ("Kosta Rika", "CR", "es", "506", "Costa Rica"),
    ("Panama", "PA", "es", "507", "Panamá"), ("Dominik Cumhuriyeti", "DO", "es", "1", "República Dominicana"),
    ("Bolivya", "BO", "es", "591", "Bolivia"), ("Paraguay", "PY", "es", "595", "Paraguay"),
    ("Uruguay", "UY", "es", "598", "Uruguay"),
    ("Brezilya", "BR", "pt", "55", "Brasil"), ("Portekiz", "PT", "pt", "351", "Portugal"),
    ("Angola", "AO", "pt", "244", "Angola"), ("Mozambik", "MZ", "pt", "258", "Moçambique"),
    ("Fas", "MA", "fr", "212", "Maroc"), ("Cezayir", "DZ", "fr", "213", "Algérie"),
    ("Tunus", "TN", "fr", "216", "Tunisie"), ("Senegal", "SN", "fr", "221", "Sénégal"),
    ("Fildişi Sahili", "CI", "fr", "225", "Côte d'Ivoire"), ("Kamerun", "CM", "fr", "237", "Cameroun"),
    ("Fransa", "FR", "fr", "33", "France"), ("Belçika", "BE", "fr", "32", "Belgique"),
    ("Kazakistan", "KZ", "ru", "7", "Казахстан"), ("Özbekistan", "UZ", "ru", "998", "Узбекистан"),
    ("Kırgızistan", "KG", "ru", "996", "Кыргызстан"),
    ("Vietnam", "VN", "vi", "84", ""), ("Endonezya", "ID", "id", "62", "Indonesia"),
]

# ------------------------------------------------------------------ turlar
# a: 59 ulke x ana arama · b: yeni ulkeler x ana arama · c: 59 ulke x es anlamli arama
# d: buyuk pazarlarda sehir bazli ana arama · e: oncelikli urun gruplari (dilme / boy kesme ->
# celik servis merkezi, pres besleme -> pres atolyesi), a+b ulkeleri, segment basina iki arama.
# Her tur ayri dosyalara yazar; sonraki tur onceki turlarin .md'lerindeki alan adlarini
# "zaten listede" sayip atlar.

SORGU_B = {
    "en": {"kablo-kanali": "cable ladder and perforated cable tray manufacturer",
           "solar-profil": "solar panel mounting system manufacturer",
           "raf-sistemleri": "storage racking system manufacturer",
           "yol-bariyeri": "W beam highway guardrail manufacturer",
           "cati-cephe-paneli": "sandwich panel manufacturer",
           "celik-servis-merkezi": "steel coil processing slitting cut to length company",
           "asik-celik-yapi": "C Z purlin and light gauge steel frame manufacturer",
           "iskele-kalasi": "scaffolding plank steel board manufacturer",
           "market-rafi": "gondola shelving supermarket racks manufacturer",
           "havalandirma-kanali": "spiral duct and ductwork fabrication company",
           "metal-mobilya": "steel office furniture filing cabinet manufacturer",
           "alcipan-profili": "gypsum ceiling metal profiles manufacturer"},
    "es": {"kablo-kanali": "fabricante de escalerillas portacables",
           "solar-profil": "fabricante de soportes para paneles solares",
           "raf-sistemleri": "fabricante de estanterías metálicas industriales",
           "yol-bariyeri": "fabricante de barreras de contención vial",
           "cati-cephe-paneli": "fabricante de lámina acanalada y teja metálica",
           "celik-servis-merkezi": "corte y slitteo de bobinas de acero",
           "asik-celik-yapi": "fabricante de correas y perfiles galvanizados",
           "iskele-kalasi": "fabricante de plataformas y andamios metálicos",
           "market-rafi": "fabricante de estanterías para supermercados",
           "havalandirma-kanali": "fabricación de ductos de lámina galvanizada",
           "metal-mobilya": "fabricante de muebles metálicos de oficina",
           "alcipan-profili": "fabricante de perfiles galvanizados para tablaroca"},
    "pt": {"kablo-kanali": "fabricante de leitos para cabos e perfilados",
           "solar-profil": "fabricante de suportes para painéis fotovoltaicos",
           "raf-sistemleri": "fabricante de estantes de aço industriais",
           "yol-bariyeri": "fabricante de guard rail rodoviário",
           "cati-cephe-paneli": "fabricante de telhas termoacústicas",
           "celik-servis-merkezi": "centro de serviços de aço slitter bobinas",
           "asik-celik-yapi": "fabricante de perfis de aço galvanizado steel frame",
           "iskele-kalasi": "fabricante de pranchas metálicas para andaime",
           "market-rafi": "fabricante de gôndolas e prateleiras para supermercado",
           "havalandirma-kanali": "fabricante de dutos galvanizados para climatização",
           "metal-mobilya": "fabricante de móveis de aço para escritório",
           "alcipan-profili": "fabricante de perfis para forro de gesso"},
    "fr": {"kablo-kanali": "fabricant de chemins de câbles perforés et échelles à câbles",
           "solar-profil": "fabricant de supports pour panneaux photovoltaïques",
           "raf-sistemleri": "fabricant de rayonnages métalliques",
           "yol-bariyeri": "fabricant de glissières de sécurité routière",
           "cati-cephe-paneli": "fabricant de bacs acier et tôles ondulées",
           "celik-servis-merkezi": "centre de parachèvement acier refendage",
           "asik-celik-yapi": "fabricant de pannes métalliques et charpente légère",
           "iskele-kalasi": "fabricant de planchers d'échafaudage",
           "market-rafi": "fabricant de gondoles et rayonnages pour magasins",
           "havalandirma-kanali": "fabrication de gaines de climatisation en tôle",
           "metal-mobilya": "fabricant de mobilier métallique de bureau",
           "alcipan-profili": "fabricant de rails et montants pour plaques de plâtre"},
    "ru": {"kablo-kanali": "производство перфорированных кабельных лотков",
           "solar-profil": "производитель крепежных систем для солнечных панелей",
           "raf-sistemleri": "производитель складских стеллажей",
           "yol-bariyeri": "производство барьерного ограждения",
           "cati-cephe-paneli": "производство сэндвич панелей",
           "celik-servis-merkezi": "металлосервис порезка рулонной стали",
           "asik-celik-yapi": "производство оцинкованных профилей прогонов",
           "iskele-kalasi": "производство стальных настилов для лесов",
           "market-rafi": "производство стеллажей для магазинов",
           "havalandirma-kanali": "изготовление воздуховодов из оцинкованной стали",
           "metal-mobilya": "производство металлических шкафов",
           "alcipan-profili": "производство профилей для гипсокартона и подвесных потолков"},
    "vi": {"kablo-kanali": "sản xuất thang máng cáp", "solar-profil": "sản xuất giá đỡ tấm pin mặt trời",
           "raf-sistemleri": "sản xuất giá kệ sắt công nghiệp", "yol-bariyeri": "sản xuất hộ lan tôn sóng",
           "cati-cephe-paneli": "sản xuất tấm panel cách nhiệt", "celik-servis-merkezi": "gia công xả băng cắt tấm thép cuộn",
           "asik-celik-yapi": "sản xuất xà gồ C Z mạ kẽm", "iskele-kalasi": "sản xuất mâm giàn giáo",
           "market-rafi": "sản xuất giá kệ siêu thị", "havalandirma-kanali": "gia công ống gió tôn",
           "metal-mobilya": "sản xuất tủ locker sắt", "alcipan-profili": "sản xuất thanh xương trần thạch cao"},
    "id": {"kablo-kanali": "pabrik kabel ladder dan cable tray", "solar-profil": "produsen struktur mounting PLTS",
           "raf-sistemleri": "pabrik rak heavy duty", "yol-bariyeri": "pabrik guardrail W beam",
           "cati-cephe-paneli": "produsen panel sandwich", "celik-servis-merkezi": "jasa slitting dan shearing coil",
           "asik-celik-yapi": "produsen kanal C baja ringan", "iskele-kalasi": "pabrik steel deck scaffolding",
           "market-rafi": "pabrik rak supermarket gondola", "havalandirma-kanali": "fabrikasi ducting BJLS",
           "metal-mobilya": "pabrik lemari arsip besi", "alcipan-profili": "pabrik rangka hollow gypsum"},
}

# Yeni ulkeler: B2B e-postada onceden izin sarti olmayan (ya da AB disi) pazarlar.
# +1 kullanan Karayip ulkeleri alinmadi (Dominik'teki ABD numarasi karisikligi).
ULKELER_B = [
    ("İrlanda", "IE", "en", "353", "Ireland"), ("Hollanda", "NL", "en", "31", "Netherlands"),
    ("İsveç", "SE", "en", "46", "Sweden"), ("Finlandiya", "FI", "en", "358", "Finland"),
    ("Norveç", "NO", "en", "47", "Norway"), ("Zambiya", "ZM", "en", "260", "Zambia"),
    ("Zimbabve", "ZW", "en", "263", "Zimbabwe"), ("Botsvana", "BW", "en", "267", "Botswana"),
    ("Namibya", "NA", "en", "264", "Namibia"), ("Ruanda", "RW", "en", "250", "Rwanda"),
    ("Mauritius", "MU", "en", "230", "Mauritius"), ("Malavi", "MW", "en", "265", "Malawi"),
    ("Libya", "LY", "en", "218", "Libya"), ("Nepal", "NP", "en", "977", "Nepal"),
    ("Kamboçya", "KH", "en", "855", "Cambodia"), ("Moğolistan", "MN", "en", "976", "Mongolia"),
    ("Papua Yeni Gine", "PG", "en", "675", "Papua New Guinea"), ("Fiji", "FJ", "en", "679", "Fiji"),
    ("Gürcistan", "GE", "en", "995", "Georgia"), ("Ermenistan", "AM", "en", "374", "Armenia"),
    ("Azerbaycan", "AZ", "en", "994", "Azerbaijan"), ("Sırbistan", "RS", "en", "381", "Serbia"),
    ("Bosna-Hersek", "BA", "en", "387", "Bosnia and Herzegovina"),
    ("Kuzey Makedonya", "MK", "en", "389", "North Macedonia"), ("Arnavutluk", "AL", "en", "355", "Albania"),
    ("Karadağ", "ME", "en", "382", "Montenegro"), ("Moldova", "MD", "en", "373", "Moldova"),
    ("Lübnan", "LB", "en", "961", "Lebanon"),
    ("Madagaskar", "MG", "fr", "261", "Madagascar"), ("Kongo DC", "CD", "fr", "243", "RDC Congo"),
    ("Kongo", "CG", "fr", "242", "Congo Brazzaville"), ("Gabon", "GA", "fr", "241", "Gabon"),
    ("Togo", "TG", "fr", "228", "Togo"), ("Benin", "BJ", "fr", "229", "Bénin"),
    ("Burkina Faso", "BF", "fr", "226", "Burkina Faso"), ("Mali", "ML", "fr", "223", "Mali"),
    ("Nijer", "NE", "fr", "227", "Niger"), ("Gine", "GN", "fr", "224", "Guinée"),
    ("Moritanya", "MR", "fr", "222", "Mauritanie"),
    ("Honduras", "HN", "es", "504", "Honduras"), ("El Salvador", "SV", "es", "503", "El Salvador"),
    ("Nikaragua", "NI", "es", "505", "Nicaragua"),
    ("Tacikistan", "TJ", "ru", "992", "Таджикистан"), ("Türkmenistan", "TM", "ru", "993", "Туркменистан"),
]

# Sehir bazli: en buyuk pazarlarda ulke geneli aramada cikmayan yerel ureticiler
SEHIRLER_D = [
    ("Hindistan", "IN", "en", "91", s) for s in ("Mumbai", "Delhi", "Pune", "Chennai", "Ahmedabad", "Kolkata", "Hyderabad", "Bangalore")
] + [
    ("Meksika", "MX", "es", "52", s) for s in ("Monterrey", "Guadalajara", "Ciudad de México", "Querétaro")
] + [
    ("Brezilya", "BR", "pt", "55", s) for s in ("São Paulo", "Curitiba", "Belo Horizonte", "Porto Alegre")
] + [
    ("ABD", "US", "en", "1", s) for s in ("Texas", "California", "Ohio", "Georgia USA")
] + [
    ("Endonezya", "ID", "id", "62", s) for s in ("Jakarta", "Surabaya", "Bekasi")
] + [
    ("Vietnam", "VN", "vi", "84", s) for s in ("Hà Nội", "Hồ Chí Minh", "Bình Dương")
] + [
    ("Güney Afrika", "ZA", "en", "27", s) for s in ("Johannesburg", "Cape Town", "Durban")
] + [
    ("Nijerya", "NG", "en", "234", s) for s in ("Lagos", "Abuja")
] + [
    ("Mısır", "EG", "en", "20", s) for s in ("Cairo", "10th of Ramadan City")
] + [
    ("Suudi Arabistan", "SA", "en", "966", s) for s in ("Riyadh", "Jeddah", "Dammam")
]


# E turu (2026-09-22, Yasin: "oncelik roll form, dilme, boy kesme, pres besleme, kompakt"):
# dilme ve boy kesme hattini CELIK SERVIS MERKEZI alir (40 + 49 firmayla en kucuk iki grup),
# pres besleme ve kompakt hatti PRES ATOLYESI. Deger liste: segment basina iki arama.
SORGU_E = {
    "en": {"celik-servis-merkezi": ["steel service center", "coil slitting and cut to length services"],
           "pres-atolyeleri": ["metal stamping company", "sheet metal pressing parts manufacturer"]},
    "es": {"celik-servis-merkezi": ["centro de servicio de acero", "corte longitudinal y transversal de bobinas de acero"],
           "pres-atolyeleri": ["estampado de metales", "troquelado de piezas metálicas"]},
    "pt": {"celik-servis-merkezi": ["centro de serviços de aço", "corte de bobinas de aço slitter e blanks"],
           "pres-atolyeleri": ["estamparia de metais", "estampagem de peças metálicas"]},
    "fr": {"celik-servis-merkezi": ["centre de service acier", "découpe de bobines acier refendage cisaillage"],
           "pres-atolyeleri": ["découpage emboutissage métal sous-traitance", "fabricant de pièces embouties en tôle"]},
    "ru": {"celik-servis-merkezi": ["металлосервисный центр", "продольная и поперечная резка рулонной стали"],
           "pres-atolyeleri": ["холодная листовая штамповка металла", "штамповка металлических деталей на заказ"]},
    "vi": {"celik-servis-merkezi": ["trung tâm gia công thép cuộn", "xả băng cắt tấm thép cuộn"],
           "pres-atolyeleri": ["gia công dập kim loại", "dập tấm kim loại theo yêu cầu"]},
    "id": {"celik-servis-merkezi": ["steel service center", "jasa potong coil plat besi"],
           "pres-atolyeleri": ["jasa stamping metal", "pabrik press part logam"]},
}


def tur_tanimi(tur):
    """(ulkeler, sorgu_seti, dosya_eki)"""
    if tur == "e":
        return ULKELER + ULKELER_B, SORGU_E, "-e"
    if tur == "b":
        return ULKELER_B, SORGU, "-b"
    if tur == "c":
        return ULKELER, SORGU_B, "-c"
    if tur == "d":
        return SEHIRLER_D, SORGU, "-d"
    return ULKELER, SORGU, ""


# Rehber, pazar yeri, sosyal ag, haber, kamu — firma sitesi degil
KARA_LISTE = re.compile(
    r"(indiamart|tradeindia|exportersindia|justdial|sulekha|alibaba|aliexpress|made-in-china|globalsources|"
    r"dhgate|europages|kompass|yellowpages|yelp|linkedin|facebook|instagram|youtube|twitter|tiktok|pinterest|"
    r"wikipedia|wikimedia|amazon\.|ebay\.|mercadoli[bv]re|olx\.|jiji\.|tokopedia|shopee|lazada|bukalapak|"
    r"blibli|avito|satu\.kz|prom\.ua|pulscen|blizko|tiu\.ru|yandex|google\.|bing\.|medium\.com|quora|reddit|"
    r"issuu|scribd|slideshare|glassdoor|indeed|zoominfo|dnb\.com|bloomberg|crunchbase|opencorporates|cylex|"
    r"hotfrog|businesslist|tuugo|infoisinfo|paginasamarillas|amarillas|guiamais|pagesjaunes|tradekey|ec21|"
    r"ecplaza|exporthub|go4worldbusiness|thomasnet|manta\.com|bizapedia|mapquest|waze|foursquare|tripadvisor|"
    r"ensun|machinematcher|enfsolar|solarfeeds|kellysearch|directindustry|archiexpo|b2b|marketplace|"
    r"\.gov|\.gob\.|\.edu|\.ac\.|news|noticias|blogspot|wordpress\.com|wix\.com|weebly|jimdo|sites\.google|"
    r"statista|researchandmarkets|marketsandmarkets|mordorintelligence|6wresearch|grandviewresearch|"
    r"imarcgroup|expertmarketresearch|zaubacorp|tofler|infobel|ghanayello|kenyayello|nigeriagalleria|"
    r"businesslistings|africa-business|vymaps|dubaidirectory|yello|zawya|arabianbusiness|construction\.com|"
    r"houzz|bark\.com|checkatrade|homeadvisor|angi\.com|trustpilot|clutch\.co|goodfirms|upwork|fiverr|"
    r"ngcontacts|goafricaonline|finelib|vconnect|africabizinfo|kenyabizinfo|businessdirectory|bizdirectory|"
    r"yellowpages|pagesjaunes|paginasamarillas|cybo\.com|ensun|companieslist|allbiz|all\.biz|exportpages|"
    r"tradewheel|yellowpagesnigeria|enf\.com|solarquotes|energysage|"
    r"iprocure|infopages|autoshow|pngpages|rwandayp|government\.com\.|aajjo|thebluebook|"
    r"iberinform|guia1122|indusmart|otimize|xometry|planplus|companywall|bdstall|"
    r"framecad)", re.I)   # framecad: LGS roll form makinesi ureticisi (rakip)

# Rakip: makine uretenler (baslik/ozette)
MAKINE = re.compile(
    r"roll\s*-?\s*form(ing|er)?\s*machine|forming machine|machinery|machines?\b|máquina|maquinaria|perfiladora|"
    r"machine à profiler|profileuse|станок|оборудование для|"
    r"(?<!nhà )(?<!nha )máy (cán|sản xuất|xả|cắt|dập|uốn)|mesin|makine|"
    r"l[ií]neas? de corte|linhas? de corte|(slitting|cut[ -]to[ -]length|slitter) (line|machine)s?|"
    r"equipamento para|equipment manufacturer", re.I)

ULKE_UZANTI = {"GB": "uk"}


def yetki():
    k = json.load(io.open(AYAR, encoding="utf-8"))
    return "Basic " + base64.b64encode(("%s:%s" % (k["login"], k["password"])).encode()).decode()


def istek(yol, govde=None, deneme=3):
    veri = json.dumps(govde).encode() if govde is not None else None
    for i in range(deneme):
        try:
            r = urllib.request.Request(API + yol, data=veri, headers={"Authorization": yetki(),
                                                                        "Content-Type": "application/json"})
            with urllib.request.urlopen(r, timeout=120) as y:
                return json.load(y)
        except Exception:
            if i == deneme - 1:
                raise
            time.sleep(5 * (i + 1))


def konum_kodlari(ulkeler):
    """Ulke konum kodlari (DataForSEO, ucretsiz uc). Onbellekte olmayanlar sorulur."""
    yol = os.path.join(KESIF, "konumlar.json")
    kodlar = json.load(io.open(yol, encoding="utf-8")) if os.path.exists(yol) else {}
    for iso in sorted({u[1] for u in ulkeler} - set(kodlar)):
        t = istek("serp/google/locations/" + iso.lower())["tasks"][0]
        ulke = [x for x in (t.get("result") or []) if x.get("location_type") == "Country"]
        if ulke:
            kodlar[iso] = ulke[0]["location_code"]
        else:
            print("  [uyarı] %s için konum kodu yok, atlanıyor" % iso)
    json.dump(kodlar, io.open(yol, "w", encoding="utf-8"))
    return kodlar


def gorevler(kodlar, ulkeler, sorgu):
    liste = []
    for ad, iso, dil, _, sorgu_ulke in ulkeler:
        if iso not in kodlar:
            continue
        for seg, ifadeler in sorgu[dil].items():
            for ifade in ([ifadeler] if isinstance(ifadeler, str) else ifadeler):
                kelime = ("%s %s" % (ifade, sorgu_ulke)).strip()
                liste.append({"keyword": kelime, "location_code": kodlar[iso], "language_code": dil,
                              "depth": DERINLIK, "tag": "%s|%s" % (iso, seg)})
    return liste


def serp_cek(liste, yol):
    """Standart kuyruk: gonder, hazir oldukca al. Doner: [{iso, seg, sonuclar:[{url,domain,title,description}]}]"""
    bekleyen, gelen, maliyet = {}, [], 0.0
    for i in range(0, len(liste), 100):
        for t in istek("serp/google/organic/task_post", liste[i:i + 100])["tasks"]:
            maliyet += t.get("cost") or 0
            if t.get("status_code") == 20100:
                bekleyen[t["id"]] = t["data"]["tag"]
    print("  %d arama kuyrukta (gönderim ücreti %.3f $)" % (len(bekleyen), maliyet), flush=True)

    def sor(gid):
        try:
            return gid, istek("serp/google/organic/task_get/regular/" + gid)["tasks"][0]
        except Exception:
            return gid, None

    son = time.time() + 40 * 60
    while bekleyen and time.time() < son:
        time.sleep(20)
        with ThreadPoolExecutor(8) as h:
            for gid, t in h.map(sor, list(bekleyen)):
                if t is None or t.get("status_code") in (40601, 40602):
                    continue
                etiket = bekleyen.pop(gid)
                iso, seg = etiket.split("|")
                sonuc = []
                for r in ((t.get("result") or [{}])[0] or {}).get("items") or []:
                    if r.get("type") == "organic":
                        sonuc.append({k: r.get(k) for k in ("url", "domain", "title", "description")})
                gelen.append({"iso": iso, "seg": seg, "sonuclar": sonuc})
        print("  hazır %d/%d" % (len(liste) - len(bekleyen), len(liste)), flush=True)
    json.dump({"tarih": date.today().isoformat(), "maliyet": round(maliyet, 4), "aramalar": gelen},
              io.open(yol, "w", encoding="utf-8"), ensure_ascii=False)
    if bekleyen:
        print("  [uyarı] %d arama 40 dakikada bitmedi, atlandı" % len(bekleyen))
    return gelen, maliyet


def tur_sirasi(dosya):
    """bolge-kesif-<tarih>[-<tur>].md -> (tarih, tur); a turunun eki yok. Kesif disi dosya: None."""
    m = re.match(r"bolge-kesif-(\d{4}-\d{2}-\d{2})(?:-([a-z]))?\.md$", dosya)
    return (m.group(1), m.group(2) or "a") if m else None


def bilinen_alanlar(haric=""):
    """Listede ya da Elenenler'de gecen her alan adi — yeniden eklenmesin.
    `haric`: bu turun kendi ciktisi; yeniden calistirmada kendi bulduklarini elemesin.
    Kesif dosyalarindan yalniz bu turdan ONCEKILER sayilir: yeniden calistirmada sonraki
    turun buldugu alan adi bu turdan dusmesin — sonraki turun kurali onu eleyebilir, o zaman
    iki turdan da kaybolurdu (C/D/E ayni anda calisti, birbirinin bulduklarini icerebilir)."""
    kendi = tur_sirasi(os.path.basename(haric)) if haric else None
    alanlar = set()
    for f in os.listdir(KLASOR):
        if not f.endswith(".md") or os.path.join(KLASOR, f) == haric:
            continue
        sira = tur_sirasi(f)
        if kendi and sira and sira > kendi:
            continue
        for u in re.findall(r"https?://[^\s|)\]]+", io.open(os.path.join(KLASOR, f), encoding="utf-8").read()):
            alanlar.add(B.url_alani(u))
    return alanlar


def metin(html):
    return D.metin(html.lower())


def firma_adi(html, alan):
    m = re.search(r'<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\']([^"\']{2,60})', html, re.I) \
        or re.search(r'<meta[^>]+content=["\']([^"\']{2,60})["\'][^>]+property=["\']og:site_name', html, re.I)
    if m:
        return re.sub(r"\s+", " ", m.group(1)).strip()
    baslik = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    etiket = alan.split(".")[0]
    if baslik:
        parcalar = [p.strip() for p in re.split(r"\s[|\-–—:·»]\s", re.sub(r"\s+", " ", baslik.group(1))) if p.strip()]
        for p in parcalar:
            if etiket[:4].lower() in re.sub(r"[^a-z0-9]", "", p.lower()):
                return p[:60]
    return etiket.replace("-", " ").title()


def hucre(s):
    # Sayfa basliklari HTML varligiyla geliyor ("Kosto &#8211; Cut and Bend", "&amp;")
    return re.sub(r"\s+", " ", html_coz(s or "").replace("|", "/")).strip()


def aday_dogrula(a):
    """a: {alan, iso, ulke, tel, seg, url, title, description}. Doner: satir dict ya da (None, neden)."""
    kok = "https://" + a["domain"].lstrip(".") + "/"
    k1, h1, s1 = B.getir(a["url"])      # aramada cikan sayfa
    k0, h0, s0 = B.getir(kok)           # ana sayfa (ayniysa onbellekten)
    if k0 != 200 and k1 != 200:
        return None, "açılmadı"
    sayfa_metni = metin(h1) if k1 == 200 else ""
    ana_metni = metin(h0) if k0 == 200 else ""
    birlikte = sayfa_metni + " " + ana_metni
    kelimeler = D.KELIME.get(a["seg"], [])
    if not any(w in birlikte for w in kelimeler):
        return None, "ürün kelimesi yok"
    baslik = re.search(r"<title[^>]*>(.*?)</title>", h0 or h1 or "", re.I | re.S)
    if baslik and MAKINE.search(baslik.group(1)):
        return None, "makine üreticisi"
    uretim = any(w in birlikte for w in D.URETIM)
    if not uretim and any(w in (h0 or "").lower() + (h1 or "").lower() for w in D.SEPET):
        return None, "dükkân"
    if not uretim:
        return None, "üretim izi yok"
    eposta, esayfa, _, _ = B.site_eposta(s0 if k0 == 200 else kok, ek_sayfalar=[a["url"]])
    if not eposta:
        return None, "e-posta yok"
    # Ulke: yerel uzanti ya da sitede ulke telefon kodu
    alan = B.url_alani(s0 if k0 == 200 else a["url"])
    uzanti = alan.rsplit(".", 1)[-1]
    beklenen = ULKE_UZANTI.get(a["iso"], a["iso"].lower())
    if uzanti != beklenen:
        tum = (h0 or "") + (h1 or "")
        for u in (esayfa,):
            k2, h2, _ = B.getir(u) if u else (0, "", "")
            tum += h2 if k2 == 200 else ""
        if a["tel"] == "1":
            # ABD/Kanada siteleri numarayi +1'siz yaziyor: (555) 123-4567 / 555-123-4567
            tel = re.compile(r"\+1[\s\-.(]|\(\d{3}\)\s?\d{3}[\s\-.]\d{4}|\d{3}[\-.]\d{3}[\-.]\d{4}")
        else:
            tel = re.compile(r"(\+|00|\()\s?%s[\s\-().]" % a["tel"])
        if len(uzanti) == 2 and uzanti not in ("co", "io", "me", "tv", "cc", "ai"):
            return None, "başka ülkenin uzantısı (.%s)" % uzanti
        if not tel.search(tum):
            return None, "ülke tutmuyor (telefon kodu yok)"
    return {
        "firma": hucre(firma_adi(h0 if k0 == 200 else h1, alan)),
        "ulke": a["ulke"],
        "web": "https://" + (urllib.parse.urlparse(s0).netloc if k0 == 200 else a["domain"]) + "/",
        "dogrulama": a["url"],
        "urun": hucre(a["title"])[:120],
        "eposta": "%s — sitede: %s" % (eposta, esayfa),
        "segment": SEGMENT_ADI[a["seg"]],
    }, ""


# ---------------------------------------------------------------- siki suzgec
# Ilk kontrol (urun kelimesi + "uretim izi" + e-posta + ulke) yetmedi: 21 Eylul ornek
# incelemesinde kabul edilenlerin yarisi kiralama (andamios venta y alquiler), perakende
# (Do It Center), bayi/ithalatci ("Top Dealers & Suppliers", "trading") ve dagiticiydi.
# "Uretim izi" listesi "produc" gibi zayif kokler iceriyordu ("products" bile geciyordu).
# Ikinci suzgec: firma KENDINI URETICI olarak tanitmali — arama basliginda/ozetinde ya da
# sayfanin basligi, aciklamasi, H1'inde — ve baslikta perakende/kiralama/bayi izi olmamali.

IMALATCI = re.compile(
    r"manufactur|fabricante|fabricamos|fabricaci[oó]n|f[aá]brica\b|fabricant|fabbric|produttor|"
    r"producent|производ|завод|s[aả]n xu[aấ]t|nh[aà] m[aá]y|produsen|pabrik|factory|fabricator|"
    r"fabrication|we produce|producimos|produzimos|fabrik|hersteller|roll[ -]?form|industr(ies|ia[sl]?) ",
    re.I)
NEGATIF = re.compile(
    r"alquiler|arriendo|renta de|\brental|\bhire\b|aluguel|loca[cç][aã]o|location d|tienda|\bloja\b|"
    r"\bstore\b|\bshop\b|ferreter|home ?cent|hardware|wholesal|mayorista|atacad|importador|importer|"
    r"\btrading\b|dealer|revendedor|precio|price list|pre[cç]o|\bprix\b|comprar|buy online|marketplace|"
    r"cotiza en l[ií]nea|supermercado de|installer|instalador|contractor|contratista|consult", re.I)
# Dominik Cumhuriyeti de +1 kullaniyor: ABD bicimli her numara gecmesin, alan kodu sart
DO_TELEFON = re.compile(r"\b8[024]9[\s\-.)]*\d{3}[\s\-.]?\d{4}\b")
BOZUK_KULLANICI = re.compile(r"^(u00[0-9a-f]{2}|x[0-9a-f]{2}|%[0-9a-f]{2})", re.I)

# Celik servis merkezi kendini "uretici" diye tanitmaz: "service centre", "slitting", "corte de
# bobinas", "продольная резка" der; cogu ayni zamanda stokcu/ithalatci oldugu icin "trading" /
# "importadora" izi de eleme sebebi degil. A ve B turlarinda bu yuzden elenen ~100 adayin
# cogu gercek servis merkeziydi (Ann Joo, Russel Metals, Venture Steel, Coil Pro, Flinkenberg).
SERVIS_TANIM = re.compile(IMALATCI.pattern + "|" +
    r"service ?cent(er|re)|servicecent|coil (processing|cent(er|re))|(steel|metal|coil) processing|"
    r"processing (cent(er|re)|services?|capabilit)|slitt|slitter|cut[ -]to[ -]length|shearing|decoil|"
    r"centro de servicio|centro de servi[cç]os|centre de (service|parach)|parach[eè]vement|refendage|"
    r"fractionnage|coupage (des |de )?bobines|cisaillage|travail [aà] fa[cç]on|"
    r"cortes? (longitudinal|transversal|de bobina|y rebaje|a flejes)|slitteo|flej(e|ad)|"
    r"planchado y corte|alisado y corte|rebobinad|process?adora|"
    r"металлосервис|металлоцентр|продольн\w* резк|поперечн\w* резк|резка (рулон|металл)|"
    r"xả băng|cắt tấm|gia công thép|jasa (slitting|shearing|potong)|slitting coil|shearing coil|"
    r"spaltning|stålservice|metal service|metall ?service", re.I)
NEGATIF_SERVIS = re.compile(
    r"alquiler|arriendo|renta de|\brental|\bhire\b|aluguel|loca[cç][aã]o|location d|tienda|\bloja\b|"
    r"\bstore\b|\bshop\b|ferreter|home ?cent|hardware|precio|price list|pre[cç]o|\bprix\b|comprar|"
    r"buy online|marketplace|cotiza en l[ií]nea|installer|instalador|contractor|contratista|consult|"
    r"repuesto|spare parts|chisel|universit", re.I)
# Pres atolyesi de "uretici" demeyebilir: "metal stamping", "estampado", "штамповка" yeter
PRES_TANIM = re.compile(IMALATCI.pattern + "|" +
    r"stamping|pressings?\b|pressed (metal|steel|parts?|components?)|press(ed)? parts|press shop|presswork|"
    r"deep[ -]draw|progressive die|fine ?blank|estampad|estampaci[oó]n|estampagem|estamparia|troquelad|"
    r"emboutiss|d[eé]coupage|штамповк|dập (kim loại|tấm|sắt|thép)|gia công dập|pengepresan|"
    r"metal ?forming|conformado de (metal|chapa)", re.I)
# segment -> (kendini tanitma, baslikta olmamasi gereken)
TANIM = {"celik-servis-merkezi": (SERVIS_TANIM, NEGATIF_SERVIS), "pres-atolyeleri": (PRES_TANIM, NEGATIF)}
# Siki suzgec kurali degisen segment: ara kayittaki ELENMIS satirlari yeniden degerlendirilir
# (gecenler gecmis sayilir; yeni kural eskisinden gevsek).
KURAL = {"celik-servis-merkezi": 2}


def baslik_bilgisi(html):
    """<title>, meta/og aciklama, ilk H1 — firmanin kendini tanittigi yerler."""
    if not html:
        return ""
    parca = []
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    if m:
        parca.append(m.group(1))
    parca += re.findall(r'<meta[^>]+(?:name|property)=["\'](?:description|og:description|og:title)["\'][^>]+content=["\']([^"\']*)', html, re.I)
    parca += re.findall(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:name|property)=["\'](?:description|og:description|og:title)', html, re.I)
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
    if h1:
        parca.append(re.sub(r"<[^>]+>", " ", h1.group(1)))
    return re.sub(r"\s+", " ", " ".join(parca))


def ad_sec(html, alan, serp_baslik):
    """Firma adi: alan adiyla ortak parcasi olan aday; yoksa alan adi."""
    etiket = re.sub(r"[^a-z0-9]", "", alan.split(".")[0].lower())
    adaylar = []
    m = re.search(r'<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\']([^"\']{2,60})', html or "", re.I) \
        or re.search(r'<meta[^>]+content=["\']([^"\']{2,60})["\'][^>]+property=["\']og:site_name', html or "", re.I)
    if m:
        adaylar.append(m.group(1))
    t = re.search(r"<title[^>]*>(.*?)</title>", html or "", re.I | re.S)
    for kaynak in ((t.group(1) if t else ""), serp_baslik or ""):
        adaylar += [p.strip() for p in re.split(r"\s[|\-–—:·»]\s|\s[|·]\s?", re.sub(r"\s+", " ", kaynak)) if p.strip()]
    for a in adaylar:
        sade_a = re.sub(r"[^a-z0-9]", "", a.lower())
        if len(etiket) >= 4 and (etiket[:5] in sade_a or (len(sade_a) >= 4 and sade_a[:5] in etiket)):
            return re.sub(r"\s+", " ", a).strip()[:60]
    return etiket.replace("-", " ").title() if etiket else alan


AYRAC = re.compile(r"\s+[-|–—·:/]\s+|:\s+|,\s*")
HOSGELDIN = re.compile(r"^(welcome to|bienvenid[oa]s? a|bem[- ]vind[oa]s? [àa]|bienvenue (chez|sur|à))(?=[^\w]|$)\s*", re.I)
KENAR = re.compile(r"^[^\w(«]+|[^\w)»]+$")
TIRNAKLI = re.compile(r"[«\"“]([^»\"”]{2,45})[»\"”]")
SIRKET_EKI = re.compile(r"\b(limited|ltd|llc|inc|corp(oration)?|company|gmbh|sdn bhd|bhd|pvt|pty|plc|ltda|"
                        r"s\.?a\.?c?|s\.?r\.?l|industries|industrias|group|grupo|engineering)\b", re.I)


def ad_duzelt(ad, alan):
    """Sayfa basligindan gelen firma adi e-postada hitap oluyor: bas/son isaretler, "Welcome
    to", uzun basliklar ayiklanir; ad cikmazsa alan adindan uretilir. Yazarken uygulanir —
    ara kayittaki eski adlar da duzelir."""
    etiket = re.sub(r"[^a-z0-9]", "", alan.split(".")[0].lower())
    uyar = lambda p: len(etiket) >= 4 and etiket[:5] in re.sub(r"[^a-z0-9]", "", p.lower())
    a = KENAR.sub("", HOSGELDIN.sub("", KENAR.sub("", html_coz(ad or "").strip())))
    a = re.sub(r"\s+", " ", a).strip()
    # "Firma – slogan", "Firma: urunler, urunler": alan adina uyan parca; uyan yoksa uzunsa ilki
    parcalar = [KENAR.sub("", p) for p in AYRAC.split(a) if KENAR.sub("", p)]
    uyan = [p for p in parcalar if uyar(p)]
    if len(parcalar) > 1 and uyan:
        a = uyan[0]
    elif len(parcalar) > 1 and len(a) > 45:
        a = parcalar[0]
    if len(a) > 45:           # «Asia Stal Group» / "..."
        t = TIRNAKLI.search(a)
        if t:
            a = t.group(1).strip()
    # hala uzun ve sirket adi gibi durmuyor: basliktaki alan adina uyan kelime ("StroyVitrina.uz")
    if len(a) > 45 and not (len(a) <= 60 and SIRKET_EKI.search(a)):
        kelime = [k for k in re.findall(r"[\w.&'-]+", a) if uyar(k)]
        a = re.sub(r"\.[a-z]{2,3}(\.[a-z]{2})?$", "", kelime[0]) if kelime else ""
    a = re.sub(r"[\"“”«»]", "", a).strip()
    if not a or "://" in a or a.lower().startswith("www.") or not re.search(r"[^\W\d_]", a):
        return alan.split(".")[0].replace("-", " ").title() or alan
    if a == a.lower() and re.sub(r"[^a-z0-9]", "", a) == etiket:
        a = a.title()
    return a


def siki_dogrula(is_):
    """is_: (satir, aday). Doner: (satir|None, neden)."""
    satir, aday = is_
    eposta = satir["eposta"].split(" — ")[0]
    if BOZUK_KULLANICI.match(eposta.partition("@")[0]):
        return None, "bozuk adres"
    k1, h1, _ = B.getir(satir["dogrulama"])
    k0, h0, _ = B.getir(satir["web"])
    baslik = " ".join([aday.get("title", ""), aday.get("description", ""), baslik_bilgisi(h1), baslik_bilgisi(h0)])
    serp_ve_sayfa_basligi = " ".join([aday.get("title", ""),
                                      (re.search(r"<title[^>]*>(.*?)</title>", h1 or "", re.I | re.S) or [None, ""])[1],
                                      (re.search(r"<title[^>]*>(.*?)</title>", h0 or "", re.I | re.S) or [None, ""])[1]])
    tanim, negatif = TANIM.get(aday.get("seg"), (IMALATCI, NEGATIF))
    if negatif.search(serp_ve_sayfa_basligi) and not tanim.search(serp_ve_sayfa_basligi):
        return None, "başlıkta mağaza/kiralama/bayi izi"
    if not tanim.search(baslik):
        return None, "kendini üretici olarak tanıtmıyor"
    if aday.get("iso") == "DO":
        alan = B.url_alani(satir["web"])
        if not alan.endswith(".do") and not DO_TELEFON.search((h0 or "") + (h1 or "")):
            return None, "Dominik alan kodu yok (809/829/849)"
    yeni = dict(satir)
    yeni["firma"] = hucre(ad_sec(h0 or h1, B.url_alani(satir["web"]), aday.get("title", "")))
    return yeni, ""


def siki_parca(parca):
    B.ONBELLEK_EN_COK = 300
    with ThreadPoolExecutor(8) as ex:
        return list(ex.map(siki_dogrula, parca))


# ------------------------------------------------------------------ ince suzgec
# Siki suzgecten sonra 40 satirlik ornekte hala ~%20 hedef disi vardi: is rehberi
# (ngcontacts, goafricaonline), "top 10" listeleri, dev markalarin yerel subesi (Layher
# Peru), gunes paneli KURUCUSU (montaj yapisi ureticisi degil), fiberglas/PVC kablo
# kanali (roll form degil), yalnizca yalitim ureticisi (cam yunu). Hepsi arama basligi ve
# ozetinden yakalaniyor — yeniden indirme gerekmez.

REHBER_BASLIK = re.compile(
    r"\b(directory|directorio|annuaire|companies in|empresas de .{0,20} en|list of|top ?\d+|best \d+|"
    r"\d+ (best|top|leading)|yellow ?pages|p[aá]ginas amarillas|business (list|listing|directory)|"
    r"\d{3,} companies|compan(y|ies) list|"
    # B turu (2026-09-22): kurum, dernek, ajans, emlak — firma degil
    r"federation|federaci[oó]n|f[eé]d[eé]ration|association|asociaci[oó]n|associa[cç][aã]o|chamber|"
    r"c[aá]mara de|development agency|agencia|agency for|ministry|ministerio|minist[eè]re|council|"
    r"market briefs?|real estate|inmobiliaria|imobili[aá]ria|портал|"
    r"(business|b2b|construction|industrial|trade|building) portal|meilleures entreprises|"
    r"mejores empresas|melhores empresas)\b", re.I)
KURUM_ALANI = re.compile(r"(^|\.)(org|gov|gob|edu|ac|mil|int)(\.[a-z]{2})?$", re.I)
METAL = re.compile(r"steel|metal|metál|металл|thép|besi|acero|a[cç]o\b|acier|stahl|čelik|челик|inox", re.I)
DEV_MARKA = re.compile(
    r"(^|\.)(layher|abb|se|schneider-electric|legrand|eaton|siemens|hilti|obo|obo-bettermann|niedax|"
    r"panduit|atkore|kingspan|tatasteel|arcelormittal|ulma|ulmaconstruction|peri|doka|hunnebeck|altrad|"
    r"lindab|saint-gobain|knauf|usg|etex|rockwool|owenscorning)\.", re.I)
KABLO_PLASTIK = re.compile(r"\b(frp|grp|fib(er|re) ?glass|fibra de vidrio|pvc|plastic|pl[aá]stic|polymer)\b", re.I)
CELIK = re.compile(r"steel|metal|galvani|acero|a[cç]o\b|acier|stahl|сталь|thép|baja|inox", re.I)
SOLAR_YAPI = re.compile(
    r"mount|structure|struct|racking|bracket|clamp|rail|frame|carport|ground ?screw|montaje|estructura|"
    r"soporte|suporte|estrutura|fixation|support|крепеж|конструкц|giá đỡ|khung|rangka|dudukan|penyangga",
    re.I)
YALITIM = re.compile(r"glass ?wool|rock ?wool|stone ?wool|mineral wool|insulation|aislante|aislamiento|"
                     r"isolamento|isolant|утеплит|изоляц|bông thủy tinh", re.I)
CATI_URUN = re.compile(r"panel|sheet|roof|cladding|teja|l[aá]mina|telha|t[oô]le|bac|profnastil|профнастил|"
                       r"сэндвич|tôn|atap|genteng|corrugat|trapez", re.I)

SERVIS_DISI = re.compile(r"\bhire\b|chisel|\bsaws?\b|repuesto|spare parts|auto ?parts|universit|conveyor|"
                         r"sewing|scrap (metal|yard|dealer)|chatarr|sucata|ferraille", re.I)
PRES_DISI = re.compile(r"rubber stamp|self[- ]?inking|\bseals?\b|\bsellos?\b|carimbo|tampon|печат|con dấu|"
                       r"stempel|hot ?stamping|stamping foil|leather|textile|t-?shirt|printing|imprenta|"
                       r"gr[aá]fica|passport|notar|postage|philatel|stamp duty|tattoo|concrete|clothing|cosmetic|"
                       r"cart[oó]n|papel|\bpaper\b|plastigram|etiquetas?|\blabels?\b",
                       re.I)
# "slot" tek basina olmaz: "slotted cable tray", "slotted angle rack" gercek urun
KUMAR = re.compile(r"\bslots? ?(online|gacor|terbaru|terpercaya|resmi|demo|88|777)\b|situs (slot|judi)|casino|"
                   r"\bjudi\b|togel|gacor|login game|poker|\bbetting|sbobet", re.I)
FIYAT = re.compile(r"price list|\bprices?\b|\bprecios?\b|\bpre[cç]os?\b|\bprix\b|bảng giá|báo giá|\bharga\b", re.I)
KIRALIK = re.compile(r"\brenta\b|for rent\b|\balquiler|\baluguel|\bhire\b|\brental", re.I)
PRES_METAL = re.compile(METAL.pattern + r"|alumin|deep[ -]draw|progressive|fine ?blank|sheet|chapa|l[aá]mina|"
                        r"t[oô]le|листов|tấm|automotive|automot|bracket|washer|arandela", re.I)
# Pres isi arama basliginda/ozetinde gorunmeli: "uretici" kelimesi tek basina yetmez (kelime
# listesindeki "press" WordPress'te bile geciyor; metal mobilyaci pres atolyesi sayiliyordu)
PRES_ISI = re.compile(r"stamp|pressings?\b|pressed|press(ed)? parts?|press shop|presswork|deep[ -]draw|"
                      r"progressive die|fine ?blank|estampad|estampaci|estampagem|estamparia|troquel|"
                      r"emboutiss|d[eé]coupage|штамп|dập|pengepresan|metal ?forming|conformado", re.I)


def ince_suz(satir, aday):
    """Doner: neden (str) ya da None (gecti)."""
    metin = "%s %s" % (aday.get("title", ""), aday.get("description", ""))
    baslik = aday.get("title", "")
    if REHBER_BASLIK.search(baslik) or REHBER_BASLIK.search(satir.get("firma", "")):
        return "rehber / kurum / liste başlığı"
    if KURUM_ALANI.search(B.url_alani(satir["web"])):
        return "kurum alan adı (.org/.gov/.edu)"
    if DEV_MARKA.search(B.url_alani(satir["web"])):
        return "dev marka şubesi"
    seg = aday.get("seg")
    if seg == "kablo-kanali" and KABLO_PLASTIK.search(baslik) and not CELIK.search(baslik):
        return "plastik/fiberglas kablo kanalı"
    if seg == "solar-profil" and not SOLAR_YAPI.search(metin):
        return "güneş: montaj yapısı değil"
    if seg == "cati-cephe-paneli" and YALITIM.search(baslik) and not CATI_URUN.search(baslik):
        return "yalnız yalıtım"
    if seg == "metal-mobilya" and not METAL.search(metin):
        return "mobilya ama metal değil"
    # D turu ornegi: "Andamios Querétaro - Venta, renta y ..." sıkı süzgeçten geçmişti
    if KIRALIK.search(baslik) and not IMALATCI.search(baslik):
        return "kiralama"
    if KUMAR.search(metin):
        return "ele geçirilmiş site (kumar reklamı)"
    # Yalniz servis merkezinde: "X Price in Pakistan", "Báo Giá 2025" Guney Asya'da uretici
    # sitelerinin de SEO basligi (Eurorack, Hi-Tech Autocon elenmisti)
    if seg == "celik-servis-merkezi" and FIYAT.search(baslik) and not IMALATCI.search(baslik):
        return "fiyat listesi — satıcı"
    if seg == "celik-servis-merkezi" and SERVIS_DISI.search(metin):
        return "servis merkezi değil (kiralama/yedek parça/hurda)"
    if seg == "pres-atolyeleri" and (PRES_DISI.search(metin) or not PRES_METAL.search(metin)
                                     or not PRES_ISI.search(metin)):
        return "pres işi görünmüyor (kaşe/baskı/genel imalat)"
    return None


def parca_isle(parca):
    """Bir surecte bir grup aday (ayni alan adinin adaylari ayni parcada: sayfalar bir
    kez indirilir). Doner: [(aday, satir|None, neden)]"""
    B.ONBELLEK_EN_COK = 300      # sekiz surec x 1500 sayfa bellegi sisirirdi
    with ThreadPoolExecutor(8) as ex:
        return [(x, *sonuc) for x, sonuc in zip(parca, ex.map(aday_dogrula, parca))]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", action="store_true")
    ap.add_argument("--tarih", default=date.today().isoformat())
    ap.add_argument("--tur", default="a", choices=["a", "b", "c", "d", "e"],
                    help="a: ana | b: yeni ulkeler | c: es anlamli aramalar | d: sehir bazli | "
                         "e: oncelikli gruplar (servis merkezi, pres atolyesi)")
    a = ap.parse_args()
    os.makedirs(KESIF, exist_ok=True)
    ulkeler, sorgu, ek = tur_tanimi(a.tur)
    serp_yolu = os.path.join(KESIF, "serp-%s%s.json" % (a.tarih, ek))

    if a.plan or not os.path.exists(serp_yolu):
        kodlar = konum_kodlari(ulkeler)
        liste = gorevler(kodlar, ulkeler, sorgu)
        tahmin = len(liste) * (DERINLIK // 10) * SAYFA_UCRETI
        print("Tur %s: %d arama (%d konum), tahmini %.2f $" % (a.tur, len(liste), len({u[4] for u in ulkeler}), tahmin))
        if a.plan:
            return
        aramalar, maliyet = serp_cek(liste, serp_yolu)
        print("Arama ücreti: %.3f $" % maliyet)
    else:
        aramalar = json.load(io.open(serp_yolu, encoding="utf-8"))["aramalar"]
        print("Önbellekten: %s (%d arama)" % (serp_yolu, len(aramalar)))

    ulke = {iso: (ad, tel) for ad, iso, _, tel, _ in ulkeler}
    yol = os.path.join(KLASOR, "bolge-kesif-%s%s.md" % (a.tarih, ek))
    bilinen = bilinen_alanlar(haric=yol)
    adaylar, elenen = {}, {"rehber/pazar yeri": 0, "makine (rakip)": 0, "zaten listede": 0}
    for s in aramalar:
        for r in s["sonuclar"]:
            alan = B.url_alani(r.get("url") or "")
            if not alan:
                continue
            if KARA_LISTE.search(r.get("domain") or "") or KARA_LISTE.search(alan):
                elenen["rehber/pazar yeri"] += 1
                continue
            # Yalniz baslik: ozette "makinelerimizle uretiyoruz" diyen gercek uretici elenmesin
            if MAKINE.search(r.get("title") or ""):
                elenen["makine (rakip)"] += 1
                continue
            if alan in bilinen:
                elenen["zaten listede"] += 1
                continue
            anahtar = (alan, s["iso"], s["seg"])
            if anahtar not in adaylar:
                ad, tel = ulke[s["iso"]]
                adaylar[anahtar] = {"alan": alan, "domain": r.get("domain") or alan, "iso": s["iso"], "ulke": ad,
                                    "tel": tel, "seg": s["seg"], "url": r["url"], "title": r.get("title") or "",
                                    "description": r.get("description") or ""}
    # Ayni alan adi birden fazla segmentte: her segment ayri dogrulanir (ayri satir; Excel birlestirir)
    print("Aday: %d (alan adı × segment) · elenen: %s" % (len(adaylar), elenen), flush=True)

    # Tek surec bir cekirdege takiliyordu (8.732 aday ~saatler): 8 surec x 8 is parcacigi.
    # Ara kayit: her biten parca kesif/dogrulama-<tarih>.jsonl'a yazilir; yarida kalirsa
    # ayni komut kaldigi yerden surer.
    ara = os.path.join(KESIF, "dogrulama-%s%s.jsonl" % (a.tarih, ek))
    bitmis = {}
    if os.path.exists(ara):
        for satir in io.open(ara, encoding="utf-8"):
            k = json.loads(satir)
            bitmis[tuple(k["anahtar"])] = (k["satir"], k["neden"])
    gruplar = {}
    for anahtar, x in adaylar.items():
        if anahtar not in bitmis:
            gruplar.setdefault(x["alan"], []).append(x)
    parcalar, parca = [], []
    for liste in gruplar.values():
        parca.extend(liste)
        if len(parca) >= 60:
            parcalar.append(parca)
            parca = []
    if parca:
        parcalar.append(parca)
    print("Doğrulanacak: %d aday (%d önceden bitmiş), %d parça" % (
        sum(len(p) for p in parcalar), len(bitmis), len(parcalar)), flush=True)
    basla = time.time()
    with ProcessPoolExecutor(8) as ex, io.open(ara, "a", encoding="utf-8") as kayit:
        isler = [ex.submit(parca_isle, p) for p in parcalar]
        for i, f in enumerate(as_completed(isler), 1):
            for x, satir, n in f.result():
                anahtar = (x["alan"], x["iso"], x["seg"])
                bitmis[anahtar] = (satir, n)
                kayit.write(json.dumps({"anahtar": anahtar, "satir": satir, "neden": n}, ensure_ascii=False) + "\n")
            kayit.flush()
            if i % 5 == 0 or i == len(isler):
                gecen = time.time() - basla
                print("  %d/%d parça · %d dk · kalan tahmini %d dk" % (
                    i, len(isler), gecen / 60, gecen / i * (len(isler) - i) / 60), flush=True)

    ilk, neden = [], {}
    for anahtar, x in adaylar.items():
        satir, n = bitmis.get(anahtar, (None, "doğrulanmadı"))
        if satir:
            ilk.append((satir, x))
        else:
            neden[n] = neden.get(n, 0) + 1
    print("İlk kontrolden geçen: %d satır — sıkı süzgeç (üretici mi, mağaza/kiralama/bayi mi)…" % len(ilk), flush=True)
    gruplar = {}
    for satir, x in ilk:
        gruplar.setdefault(x["alan"], []).append((satir, x))
    parcalar, parca = [], []
    for liste in gruplar.values():
        parca.extend(liste)
        if len(parca) >= 40:
            parcalar.append(parca)
            parca = []
    if parca:
        parcalar.append(parca)
    # Siki suzgec sonucu da ara kayitli: yeniden calistirmada sayfalar tekrar indirilmez
    siki_yol = os.path.join(KESIF, "suzgec-%s%s.jsonl" % (a.tarih, ek))
    siki = {}
    if os.path.exists(siki_yol):
        for sat in io.open(siki_yol, encoding="utf-8"):
            k = json.loads(sat)
            if not k["satir"] and k.get("kural", 1) < KURAL.get(k["anahtar"][2], 1):
                continue      # kural degisti: yeniden bakilacak
            siki[tuple(k["anahtar"])] = (k["satir"], k["neden"])
    anahtar_of = lambda x: (x["alan"], x["iso"], x["seg"])
    parcalar = [[is_ for is_ in p_ if anahtar_of(is_[1]) not in siki] for p_ in parcalar]
    parcalar = [p_ for p_ in parcalar if p_]
    with ProcessPoolExecutor(8) as ex, io.open(siki_yol, "a", encoding="utf-8") as kayit:
        for p_, sonuc in zip(parcalar, ex.map(siki_parca, parcalar)):
            for (satir0, x), (satir, n) in zip(p_, sonuc):
                siki[anahtar_of(x)] = (satir, n)
                kayit.write(json.dumps({"anahtar": anahtar_of(x), "satir": satir, "neden": n,
                                        "kural": KURAL.get(x["seg"], 1)}, ensure_ascii=False) + "\n")
    satirlar = []
    for satir0, x in ilk:
        satir, n = siki.get(anahtar_of(x), (None, "sıkı süzgeç yapılmadı"))
        if satir:
            n = ince_suz(satir, x)
            if n is None:
                satirlar.append(satir)
                continue
            n = "ince süzgeç — " + n
        else:
            n = "sıkı süzgeç — " + n
        neden[n] = neden.get(n, 0) + 1
    for s_ in satirlar:
        s_["firma"] = hucre(ad_duzelt(s_["firma"], B.url_alani(s_["web"])))
    # Ayni alan adi + ulke tek firma: segmentleri ayri satir kalir, sira ulke/firma
    satirlar.sort(key=lambda s: (s["ulke"], s["firma"].lower(), s["segment"]))
    firma_sayisi = len({(B.url_alani(s["web"]), s["ulke"]) for s in satirlar})
    print("\nDOĞRULANAN: %d satır, %d firma" % (len(satirlar), firma_sayisi))
    for n, adet in sorted(neden.items(), key=lambda x: -x[1]):
        print("  elendi — %s: %d" % (n, adet))

    basliklar = ["Firma", "Ülke", "Web sitesi", "Doğrulama sayfası", "Ne üretiyor", "E-posta / İletişim", "Segment"]
    govde = [
        "# Keşif %s — Google araması + otomatik doğrulama (%s)" % (a.tur.upper(), a.tarih), "",
        "Kaynak: DataForSEO Google organik sonuçları — ülke konumlu, o ülkenin iş dilinde",
        "\"<ürün> üreticisi\" aramaları (%d ülke, %d arama, tur %s). `scripts/hedef-firma-kesif.py --tur %s`."
        % (len(ulke), len(aramalar), a.tur, a.tur), "",
        "Her satır otomatik doğrulandı: site açılıyor; segmentin ürünü sayfada geçiyor; firma kendini",
        "ÜRETİCİ olarak tanıtıyor — çelik servis merkezinde dilme/boy kesme/işleme, pres atölyesinde",
        "metal pres/derin çekme işi de sayılır — (arama başlığı/özeti ya da sayfa başlığı, açıklaması, H1'i) ve",
        "başlığında mağaza, kiralama, bayi, ithalatçı izi yok; ülke tutuyor (yerel uzantı ya da sitede",
        "ülke telefon kodu; Dominik Cumhuriyeti için 809/829/849); e-posta firmanın kendi sitesinde",
        "yazıyor (\"sitede:\" sayfası). Rehber/pazar yeri siteleri ve makine üreticileri (rakip) elendi.",
        "\"Ne üretiyor\" sütunu Google'daki sayfa başlığı — elle doğrulanmadı.", "",
        "**Doğrulanmış firma sayısı:** %d" % firma_sayisi, "",
        "| " + " | ".join(basliklar) + " |",
        "|" + "---|" * len(basliklar),
    ]
    for s in satirlar:
        govde.append("| %s |" % " | ".join(
            hucre(s[k]) for k in ("firma", "ulke", "web", "dogrulama", "urun", "eposta", "segment")))
    io.open(yol, "w", encoding="utf-8", newline="\n").write("\n".join(govde) + "\n")
    print("\nYazıldı: %s" % yol)


if __name__ == "__main__":
    main()

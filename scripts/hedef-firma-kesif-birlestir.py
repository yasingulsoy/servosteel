# DataForSEO olmadan kesif: alt ajanlarin topladigi sonuclari SERP onbellek bicimine cevirir.
# kullanim: python scripts/hedef-firma-kesif-birlestir.py TUR TARIH
# Girdi: seo/hedef-firmalar/kesif/ajan/<tur>/*.json — her dosya bir liste:
#   [{"iso": "PL", "seg": "raf-sistemleri", "q": "<sorgu ya da kaynak>",
#     "sonuclar": [{"url": "...", "title": "...", "description": "..."}]}]
# Cikti: seo/hedef-firmalar/kesif/serp-<tarih>-<tur>.json. hedef-firma-kesif.py bu dosyayi onbellek
# sayar, arama yapmaz. Ajan iki yoldan toplar (KONTROL.md "Keşif N-S"): web aramasi (o turda
# haber/rehber agirlikli cikti) ya da rehber/uye listesi sayfasindan ureticinin kendi sitesi.
import glob, io, json, os, re, sys
from urllib.parse import urlparse

TUR, TARIH = sys.argv[1], sys.argv[2]
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KESIF = os.path.join(KOK, "seo", "hedef-firmalar", "kesif")
HEDEF = os.path.join(KESIF, "serp-%s-%s.json" % (TARIH, TUR))
# Ajanin ara dosyalari (sonuc-2-b1.json gibi) alinmaz
dosyalar = sorted(f for f in glob.glob(os.path.join(KESIF, "ajan", TUR, "*.json"))
                  if re.fullmatch(r"(sonuc|tekrar-sonuc)-[A-Za-z0-9]+\.json", os.path.basename(f)))
aramalar, toplam, bos = [], 0, 0
for yol in dosyalar:
    for s in json.load(io.open(yol, encoding="utf-8")):
        sonuc = []
        for r in s.get("sonuclar") or []:
            url = (r.get("url") or "").strip()
            if not url.startswith("http"):
                continue
            sonuc.append({"url": url, "domain": urlparse(url).netloc.lower(), "title": r.get("title") or "",
                          "description": r.get("description") or ""})
        toplam += len(sonuc)
        bos += not sonuc
        aramalar.append({"iso": s["iso"], "seg": s["seg"], "sonuclar": sonuc})
json.dump({"tarih": TARIH, "maliyet": 0, "kaynak": "alt ajan (DataForSEO yok)", "aramalar": aramalar},
          io.open(HEDEF, "w", encoding="utf-8"), ensure_ascii=False)
print("dosya:", len(dosyalar), "· arama:", len(aramalar), "· sonuç:", toplam, "· boş arama:", bos)

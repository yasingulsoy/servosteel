# -*- coding: utf-8 -*-
"""Hedef firmalari sitede one cikan urun gruplarina gore siniflandirir ve gozden gecirir.

  python scripts/hedef-firma-excel.py        # once: panel-aktarim.json (butun firmalar)
  python scripts/hedef-firma-kategori.py     # her firmanin sitesine bakar -> kategori.json
  python scripts/hedef-firma-excel.py        # tekrar: Excel ve panel JSON gruplu/sirali
  node scripts/hedef-firma-aktar.mjs --yaz   # panele

Oncelik (Yasin 2026-09-22 — sitede one cikan sira):
  1 Roll form hatlari        kablo kanali, solar, agir raf, iskele kalasi, yol bariyeri,
                             gurultu bariyeri, trapez/cephe paneli, C-sigma-omega (asik)
  2 Rulo sac dilme hatlari   celik servis merkezi — sitesinde dilme agir basiyorsa
  3 Rulo sac boy kesme       celik servis merkezi — sitesinde levha/boy kesme agir basiyorsa
  4 Pres besleme sistemleri  pres atolyeleri, alcipan profili, celik mobilya (servo besleyici,
                             dogrultmali besleyici, rulo acici teklif ediliyor)
  5 Kompakt hatlar           havalandirma kanali
  6 Diger                    market rafi (sitede hat sayfasi yok) ve eslesmeyenler

Cok segmentli firma en oncelikli grubuna girer. Gozden gecirme: firmanin ana sayfasi ve
dogrulama sayfasi yeniden indirilir; grubunun urunu sayfada geciyorsa "sitede dogrulandi".
Gecmiyorsa grup degismez (segment arastirmada dogrulanmisti) ama not duser ve grup icinde
sona gecer; site acilmiyorsa da.

Cikti: seo/hedef-firmalar/kategori.json  {anahtar: {kategori, not, dogrulandi, site}}
"""
import importlib.util
import io
import json
import os
import re
import sys
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding="utf-8")
BURASI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BURASI)
import eposta_bulucu as B  # noqa: E402

_spec = importlib.util.spec_from_file_location("dogrula", os.path.join(BURASI, "hedef-firma-dogrula.py"))
D = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(D)

KLASOR = D.KLASOR
PANEL = os.path.join(KLASOR, "panel-aktarim.json")
CIKTI = os.path.join(KLASOR, "kategori.json")

# Grup tanimlari Excel betiginde (tek kaynak); burada yalniz KELIME anahtarlari
_spec_e = importlib.util.spec_from_file_location("excel", os.path.join(BURASI, "hedef-firma-excel.py"))
E = importlib.util.module_from_spec(_spec_e)
_spec_e.loader.exec_module(E)
KATEGORI_ADI = E.KATEGORI_ADI
KELIME_ANAHTARI = {
    "Kablo Kanalı": "kablo-kanali", "Solar Profil": "solar-profil", "Raf Sistemleri": "raf-sistemleri",
    "İskele Kalası": "iskele-kalasi", "Yol Bariyeri": "yol-bariyeri", "Gürültü Bariyeri": "gurultu-bariyeri",
    "Çatı ve Cephe Paneli": "cati-cephe-paneli", "Aşık ve Çelik Yapı": "asik-celik-yapi",
    "Çelik Servis Merkezi": "celik-servis-merkezi", "Pres Atölyeleri": "pres-atolyeleri",
    "Alçıpan Profili": "alcipan-profili", "Çelik Mobilya": "metal-mobilya",
    "Havalandırma Kanalı": "havalandirma-kanali", "Market Rafı": "market-rafi",
}
SEGMENT = {ad: (E.SEGMENT_KATEGORI[ad], KELIME_ANAHTARI[ad]) for ad in E.SEGMENT_KATEGORI}

DILME = re.compile(
    r"slitting|slitter|slit coil|narrow strip|dilme|\bşerit|fleje|corte longitudinal|bobinas? angosta|"
    r"refendage|feuillard|продольн|xẻ băng|spaltband|längsteil|taglio longitudinale|nastri", re.I)
BOY_KESME = re.compile(
    r"cut[ -]to[ -]length|\bctl\b|boy kesme|\bsheets?\b|\bplates?\b|\bblanks?\b|shearing|\blevha|"
    r"plancha|corte transversal|chapas?\b|tôles?\b|листов|поперечн|cắt tấm|querteil|blech|lamiere", re.I)


def gorunur_metin(html):
    """Baslik, aciklama, H1-H3 ve govde metni (kucuk harf)."""
    return D.metin(html.lower()) if html else ""


def firma_incele(f):
    """f: panel kaydi. Doner: (anahtar, sonuc dict)."""
    segler = [s.strip() for s in f["segmentler"].split("+") if s.strip()]
    eslesen = [(SEGMENT[s][0], s) for s in segler if s in SEGMENT]
    if not eslesen:
        return f["anahtar"], {"kategori": 6, "not": "segment tanınmadı", "dogrulandi": False, "site": False}
    kategori = min(k for k, _ in eslesen)
    ana_seg = [s for k, s in eslesen if k == kategori]

    web = re.search(r"https?://[^\s|)]+", f["web"] or "") or re.search(r"https?://[^\s|)]+", f["kanit"] or "")
    kanit = re.search(r"https?://[^\s|)]+", f["kanit"] or "")
    sayfalar = []
    for u in {x.group(0).rstrip(".,;") for x in (web, kanit) if x}:
        kod, html, _ = B.getir(u)
        if kod == 200 and html:
            sayfalar.append(gorunur_metin(html))
    metin = " ".join(sayfalar)
    site = bool(sayfalar)

    kelimeler = [w for s in ana_seg for w in D.KELIME.get(SEGMENT[s][1], [])]
    dogrulandi = site and any(w in metin for w in kelimeler)

    not_ = ", ".join(ana_seg)
    if kategori == 2:
        # Celik servis merkezi: dilme mi boy kesme mi? Sitedeki agirliga gore; esitse dilme.
        d = len(DILME.findall(metin)) + len(DILME.findall(f.get("urun", "")))
        b = len(BOY_KESME.findall(metin)) + len(BOY_KESME.findall(f.get("urun", "")))
        if b > d:
            kategori = 3
            not_ = "çelik servis — sitede boy kesme/levha ağır basıyor"
        else:
            not_ = "çelik servis — sitede dilme ağır basıyor" if d else "çelik servis — dilme/boy kesme ayrımı sitede yok"
    if not site:
        not_ += " · site açılmadı, tekrar bakılmalı"
    elif not dogrulandi:
        not_ += " · ürün sitede doğrulanamadı"
    return f["anahtar"], {"kategori": kategori, "not": not_, "dogrulandi": dogrulandi, "site": site}


def parca(liste):
    B.ONBELLEK_EN_COK = 200
    with ThreadPoolExecutor(8) as ex:
        return list(ex.map(firma_incele, liste))


def main():
    firmalar = json.load(io.open(PANEL, encoding="utf-8"))["firmalar"]
    onceki = json.load(io.open(CIKTI, encoding="utf-8")) if os.path.exists(CIKTI) else {}
    yapilacak = [f for f in firmalar if f["anahtar"] not in onceki]
    print("firma: %d · önceden incelenmiş: %d · incelenecek: %d" % (len(firmalar), len(firmalar) - len(yapilacak), len(yapilacak)), flush=True)
    parcalar = [yapilacak[i:i + 40] for i in range(0, len(yapilacak), 40)]
    sonuc = dict(onceki)
    with ProcessPoolExecutor(8) as ex:
        isler = [ex.submit(parca, p) for p in parcalar]
        for i, f in enumerate(as_completed(isler), 1):
            sonuc.update(dict(f.result()))
            if i % 10 == 0 or i == len(isler):
                # ara kayit: yarida kalirsa bastan baslamasin
                json.dump(sonuc, io.open(CIKTI, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
                print("  %d/%d parça" % (i, len(isler)), flush=True)
    json.dump(sonuc, io.open(CIKTI, "w", encoding="utf-8"), ensure_ascii=False, indent=0)

    from collections import Counter
    say = Counter(v["kategori"] for k, v in sonuc.items() if k in {f["anahtar"] for f in firmalar})
    dog = Counter(v["kategori"] for k, v in sonuc.items() if v["dogrulandi"])
    print("\nGrup                         firma  sitede doğrulanan")
    for k in sorted(KATEGORI_ADI):
        print("  %d %-26s %5d  %5d" % (k, KATEGORI_ADI[k], say.get(k, 0), dog.get(k, 0)))
    print("site açılmadı: %d" % sum(1 for v in sonuc.values() if not v["site"]))
    print("\n%s yazıldı. Sonra: python scripts/hedef-firma-excel.py" % CIKTI)


if __name__ == "__main__":
    main()

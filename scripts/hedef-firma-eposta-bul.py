# -*- coding: utf-8 -*-
"""Listede e-postasi OLMAYAN firmalarin sitesinde yayimlanmis adresi arar.

  python scripts/hedef-firma-eposta-bul.py            # rapor, dosyalara dokunmaz
  python scripts/hedef-firma-eposta-bul.py --uygula   # bulunanlari .md tablolarina yazar

Arastirma sirasinda adresi bulunamayan ya da dogrulayicinin "sitede
dogrulanamadi" dedigi satirlar hedef. Bulucu (eposta_bulucu.py) ana sayfayi,
iletisim/hakkimizda sayfalarini tarar; Cloudflare korumali, mailto'lu ve
"[at]" yazimli adresleri cozer. Yalnizca firmanin kendi alan adindaki ya da
sitede yazan ucretsiz posta adresi alinir — tahmin yok.

Yazilan hucre: "adres — sitede: <sayfa>" (+ eski hucredeki telefon). Ayni
firma birden fazla dosyada geciyorsa hepsi guncellenir. Satirlar metinleriyle
bulunur: tarama sirasinda dosya degistiyse o satira dokunulmaz.

Sonra: python scripts/hedef-firma-excel.py && node scripts/hedef-firma-aktar.mjs --yaz
"""
import argparse
import importlib.util
import io
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor

sys.stdout.reconfigure(encoding="utf-8")
BURASI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BURASI)
import eposta_bulucu as B  # noqa: E402

_spec = importlib.util.spec_from_file_location("dogrula", os.path.join(BURASI, "hedef-firma-dogrula.py"))
D = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(D)

EPOSTA_HUCRE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
TELEFON = re.compile(r"(?:tel|phone|telefon|tlf|ph)\.?\s*:?\s*(\+?[\d][\d\s().\-/]{6,}\d)", re.I)


def adressiz(hucre):
    """Hucrede kullanilabilir adres yok mu? (panel_kaydi ile ayni kural)"""
    return not EPOSTA_HUCRE.search(hucre or "") or "doğrulanamadı" in (hucre or "")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--uygula", action="store_true")
    ap.add_argument("--dosya", default="*.md")
    a = ap.parse_args()
    import fnmatch
    dosyalar = sorted(f for f in os.listdir(D.KLASOR) if f.endswith(".md") and fnmatch.fnmatch(f, a.dosya))

    isler = []  # (dosya, satir_no, hucreler, e_idx, web, dogrulama, firma, ham_satir)
    for f in dosyalar:
        satirlar, basliklar, veri, _ = D.tablo_satirlari(io.open(os.path.join(D.KLASOR, f), encoding="utf-8").read())
        if not basliklar:
            continue
        iw = D.sutun(basliklar, r"^web", r"^website", r"^site")
        idg = D.sutun(basliklar, r"doğrulama|dogrulama|verification|kanıt|kanit|evidence")
        ie = D.sutun(basliklar, r"e-?posta|e-?mail|iletişim|iletisim|contact")
        ifi = D.sutun(basliklar, r"^firma$|^company")
        if ie is None:
            continue
        for no, h, _b in veri:
            g = lambda i: (h[i] if i is not None and i < len(h) else "")
            if not adressiz(g(ie)):
                continue
            web = re.search(r"https?://[^\s|)]+", g(iw)) or re.search(r"https?://[^\s|)]+", g(idg))
            dog = re.search(r"https?://[^\s|)]+", g(idg))
            if not web:
                continue
            isler.append((f, no, h, ie, web.group(0).rstrip(".,;"), dog.group(0).rstrip(".,;") if dog else "",
                          g(ifi) or h[0], satirlar[no]))

    # Ayni site bir kez taranir
    siteler = {}
    for x in isler:
        siteler.setdefault(B.url_alani(x[4]), (x[4], set()))[1].update({x[5]} if x[5] else set())
    print("adresi olmayan satır: %d · taranacak site: %d" % (len(isler), len(siteler)), flush=True)

    def tara(kv):
        alan, (web, ek) = kv
        # iletisim hucresindeki sayfa da taransin
        return alan, B.site_eposta(web, ek_sayfalar=sorted(ek))

    with ThreadPoolExecutor(24) as ex:
        sonuc = dict(ex.map(tara, siteler.items()))

    bulunan = {al: s for al, s in sonuc.items() if s[0]}
    acilmayan = sum(1 for s in sonuc.values() if s[3] != 200)
    print("\nBULUNDU: %d site · bulunamadı: %d · açılmadı/engelledi: %d"
          % (len(bulunan), len(sonuc) - len(bulunan) - acilmayan, acilmayan))
    tur = {"ayni": 0, "ucretsiz": 0}
    for al, (e, sayfa, _, _) in sorted(bulunan.items()):
        tur["ucretsiz" if B.UCRETSIZ.match(e.partition("@")[2]) else "ayni"] += 1
        print("  %-32s %-38s %s" % (al[:32], e[:38], sayfa[:70]))
    print("  (kendi alan adında: %d · ücretsiz posta: %d)" % (tur["ayni"], tur["ucretsiz"]))

    if not a.uygula:
        print("\n(rapor modu — dosyalara dokunulmadı; yazmak için --uygula)")
        return

    dosya_isleri = {}
    for x in isler:
        s = sonuc.get(B.url_alani(x[4]))
        if s and s[0]:
            dosya_isleri.setdefault(x[0], []).append((x, s))
    toplam = 0
    for f, liste in dosya_isleri.items():
        yol = os.path.join(D.KLASOR, f)
        satirlar = io.open(yol, encoding="utf-8").read().split("\n")
        konum = {}
        for i, sat in enumerate(satirlar):
            konum.setdefault(sat.strip(), i)
        yazilan = kayip = 0
        for (f_, no, h, ie, web, dog, firma, ham), (e, sayfa, _, _) in liste:
            i = konum.get(ham.strip())
            if i is None:
                kayip += 1
                continue
            h2 = list(h)
            eski = h2[ie] if ie < len(h2) else ""
            tel = TELEFON.search(eski)
            h2[ie] = "%s — sitede: %s%s" % (e, sayfa, (" · tel: %s" % tel.group(1).strip()) if tel else "")
            satirlar[i] = "| " + " | ".join(h2) + " |"
            yazilan += 1
        io.open(yol, "w", encoding="utf-8").write("\n".join(satirlar))
        toplam += yazilan
        print("  yazıldı: %-28s %d satır%s" % (f, yazilan, (" (%d satır değişmiş, dokunulmadı)" % kayip) if kayip else ""))
    print("Toplam %d satıra adres yazıldı. Sonra: python scripts/hedef-firma-excel.py" % toplam)


if __name__ == "__main__":
    main()

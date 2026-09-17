# -*- coding: utf-8 -*-
"""Akademi yazılarına kısa cevap (summary), SSS (faq) ve güncelleme tarihi ekler.

    python scripts/akademi-sss-ekle.py <dil> <girdi.json> [--kuru]

girdi.json: {"<slug>": {"summary": "...", "faq": [{"q": "...", "a": "..."}]}}

Yazının GÖVDESİNE DOKUNULMAZ; yalnızca ön bilgi (frontmatter) değişir ve bu
her dosyada ayrıca doğrulanır.

Bekçiler — biri tutmazsa o dosya YAZILMAZ:
  1. Gövde bayt bayt aynı kalmalı.
  2. Özet ve SSS'deki her sayı (iki haneli ve üstü) yazının kendisinde
     (başlık, açıklama, gövde) geçmeli. Kısa cevap yazıda olmayan bir bilgi
     iddia edemez; asistanlar bu metni alıntılıyor.
  3. Özet 25-90 kelime, SSS 3-5 soru, her cevap en fazla 70 kelime.
  4. Sonuç YAML olarak okunabilmeli ve gray-matter'ın göreceği alanlar doğru
     tipte olmalı.

Metinler JSON dizesi olarak yazılır — JSON dizesi geçerli bir YAML çift
tırnaklı dizedir, kaçış kuralları tek yerden gelir.
"""
import io
import json
import os
import re
import sys

import yaml

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

GUNCELLEME = "2026-09-17"
KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "content", "akademi")

SAYI = re.compile(r"\d+(?:[.,\s  ]\d+)*")


def sayilar(metin):
    """Sayıları biçimden bağımsız karşılaştırmak için yalnızca rakamlara indirger."""
    out = set()
    for m in SAYI.findall(metin):
        rakam = re.sub(r"\D", "", m)
        if len(rakam) >= 2:
            out.add(rakam.lstrip("0") or "0")
    return out


def kelime(metin):
    return len(re.findall(r"\w+", metin))


def isle(dil, slug, veri, kuru):
    yol = os.path.join(KOK, dil, slug + ".mdx")
    ham = io.open(yol, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", ham, re.S)
    if not m:
        return "ön bilgi bulunamadı"
    on, govde = m.group(1), ham[m.end():]
    fm = yaml.safe_load(on)

    ozet = veri["summary"].strip()
    faq = [{"q": f["q"].strip(), "a": f["a"].strip()} for f in veri["faq"]]

    hatalar = []
    if not 25 <= kelime(ozet) <= 90:
        hatalar.append("özet %d kelime" % kelime(ozet))
    if not 3 <= len(faq) <= 5:
        hatalar.append("SSS %d soru" % len(faq))
    for f in faq:
        if kelime(f["a"]) > 70:
            hatalar.append("uzun cevap (%d kelime): %s" % (kelime(f["a"]), f["q"][:40]))
    kaynak = sayilar(" ".join([str(fm.get("title", "")), str(fm.get("description", "")), govde]))
    yeni_sayi = sayilar(" ".join([ozet] + [f["q"] + " " + f["a"] for f in faq]))
    yabanci = sorted(yeni_sayi - kaynak)
    if yabanci:
        hatalar.append("yazıda olmayan sayı: %s" % ", ".join(yabanci))
    if hatalar:
        return "; ".join(hatalar)

    # eski eklemeler varsa at, yenilerini sona ekle
    satirlar = on.split("\n")
    temiz, atla = [], False
    for s in satirlar:
        if re.match(r"^(updated|summary|faq):", s):
            atla = s.startswith("faq:")
            continue
        if atla and (s.startswith("  ") or s.startswith("-")):
            continue
        atla = False
        temiz.append(s)
    ek = ['updated: "%s"' % GUNCELLEME, "summary: " + json.dumps(ozet, ensure_ascii=False), "faq:"]
    for f in faq:
        ek.append("  - q: " + json.dumps(f["q"], ensure_ascii=False))
        ek.append("    a: " + json.dumps(f["a"], ensure_ascii=False))
    yeni_on = "\n".join(temiz + ek)
    yeni = "---\n" + yeni_on + "\n---\n" + govde

    # doğrulama: gövde aynı, YAML okunuyor, alanlar yerinde
    m2 = re.match(r"^---\n(.*?)\n---\n", yeni, re.S)
    assert yeni[m2.end():] == govde, "gövde değişti"
    fm2 = yaml.safe_load(m2.group(1))
    assert fm2["summary"] == ozet and fm2["faq"] == faq and str(fm2["updated"]) == GUNCELLEME
    for k in ("title", "description", "date", "author", "tags"):
        if k in fm:
            assert fm2[k] == fm[k], "ön bilgi alanı değişti: " + k

    if not kuru:
        io.open(yol, "w", encoding="utf-8", newline="\n").write(yeni)
    return None


def main():
    dil, girdi = sys.argv[1], sys.argv[2]
    kuru = "--kuru" in sys.argv
    veri = json.load(io.open(girdi, encoding="utf-8"))
    mevcut = {f[:-4] for f in os.listdir(os.path.join(KOK, dil)) if f.endswith(".mdx")}
    eksik = sorted(mevcut - set(veri))
    fazla = sorted(set(veri) - mevcut)
    if fazla:
        print("  [HATA] yazısı olmayan slug: %s" % ", ".join(fazla))
    tamam = 0
    for slug in sorted(set(veri) & mevcut):
        hata = isle(dil, slug, veri[slug], kuru)
        if hata:
            print("  [HATA] %s/%s: %s" % (dil, slug, hata))
        else:
            tamam += 1
    print("%s: %d yazı %s%s" % (dil, tamam, "denetimden geçti (kuru)" if kuru else "güncellendi",
                                 (" · girdide olmayan: " + ", ".join(eksik)) if eksik else ""))
    sys.exit(0 if tamam == len(set(veri) & mevcut) and not fazla else 1)


if __name__ == "__main__":
    main()

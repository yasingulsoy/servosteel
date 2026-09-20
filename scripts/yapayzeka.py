# -*- coding: utf-8 -*-
"""Yapay zeka asistanlarında görünürlük ölçümü.

NEDEN: Ölçülen en iyi dönüşen kanal bu. 2026-09-12 ölçümünde yapay zeka
asistanlarından gelen ziyaretçi %4,00 dönüştü, organik arama %0,47 (8,5 kat).
Alıcı "Türkiye'de dilme hattı üreticisi kim" diye ChatGPT'ye soruyor; cevapta
adımız geçiyor mu, kaçıncı sırada geçiyor ve asistan hangi kaynaklara bakıyor —
ölçtüğümüz şey bu. Kaynak listesi aynı zamanda "nerede kayıtlı olmalıyız"
sorusunun cevabıdır.

KULLANIM
    python scripts/yapayzeka.py            # tüm sorular
    python scripts/yapayzeka.py --pazar us,de
    python scripts/yapayzeka.py --kuru     # istek atmaz, ne sorulacağını yazar

Soru listesi: seo/ai-sorulari.json · Kayıt: seo/ai-gorunurluk/YYYY-AA-GG.json
Rapor: seo/ai-gorunurluk/RAPOR.md

Maliyet: web aramalı yanıt başına ~0,09 $ (DataForSEO AI Optimization).
Kimlik ~/.config/claude-seo/dataforseo.json'dan okunur, asla yazdırılmaz.
"""
import argparse
import collections
import datetime
import io
import json
import os
import re
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(KOK, "scripts"))
from siralama import istek, AYLAR  # noqa: E402  (kimlik + HTTP yardımcıları orada)

SORU_DOSYA = os.path.join(KOK, "seo", "ai-sorulari.json")
KAYIT_KLASOR = os.path.join(KOK, "seo", "ai-gorunurluk")
BIZ = re.compile(r"servo\s*-?\s*steel", re.I)
UC = "ai_optimization/chat_gpt/llm_responses/live"


def yanit_coz(gorev):
    """DataForSEO yanıtından asistanın NİHAİ cevabını, kaynaklarını ve aramalarını çıkarır.

    Tuzak: `items` listesinin başındaki kayıtlar modelin düşünme adımları
    (`type == "reasoning"`). Nihai cevap `type == "message"` olandır; ilk öğeyi
    okumak "Searching for recommendations..." gibi bir ön metin döndürür.
    """
    sonuc = (gorev.get("result") or [{}])[0]
    metin, kaynaklar = [], []
    for oge in sonuc.get("items") or []:
        if oge.get("type") != "message":
            continue
        for bolum in oge.get("sections") or []:
            metin.append(bolum.get("text") or "")
            for ek in bolum.get("annotations") or []:
                url = ek.get("url") or ""
                if url:
                    kaynaklar.append(re.sub(r"^https?://(www\.)?([^/?#]+).*", r"\2", url))
    return "\n".join(metin), kaynaklar, sonuc.get("fan_out_queries") or []


def sira_bul(metin):
    """Numaralı listede adımız kaçıncı sırada? Liste yoksa None."""
    for satir in metin.split("\n"):
        m = re.match(r"\s*(\d{1,2})[.)]\s+(.*)", satir)
        if m and BIZ.search(m.group(2)[:120]):
            return int(m.group(1))
    return None


def firmalar(metin):
    """Cevapta kalın yazılan firma adları — kimlerle birlikte anılıyoruz."""
    adlar = []
    for ad in re.findall(r"\*\*([^*\n]{2,45})\*\*", metin):
        ad = re.sub(r"\s*[—–-].*$", "", ad).strip(" :,")
        if len(ad) < 3 or ad.lower().startswith(("as of", "not ", "note")):
            continue
        if ad not in adlar:
            adlar.append(ad)
    return adlar[:10]


def sor(soru, ulke, model):
    govde = {"user_prompt": soru["soru"], "model_name": model, "web_search": True}
    if ulke:
        govde["web_search_country_iso_code"] = ulke
    y = istek(UC, [govde])
    g = (y.get("tasks") or [{}])[0]
    if g.get("status_code") != 20000:
        return {"hata": "%s %s" % (g.get("status_code"), g.get("status_message"))}
    metin, kaynaklar, aramalar = yanit_coz(g)
    return {
        "bizden": bool(BIZ.search(metin)),
        "sira": sira_bul(metin),
        "firmalar": firmalar(metin),
        "kaynaklar": sorted(set(kaynaklar)),
        "aramalar": aramalar[:8],
        "yanit_uzunluk": len(metin),
        "maliyet": g.get("cost") or 0,
    }


def gun_yazi(t):
    return "%d %s %d" % (t.day, AYLAR[t.month - 1], t.year)


def rapor_yaz(kayit, yol):
    sorular = kayit["sorular"]
    anan = [s for s in sorular if s.get("bizden")]
    kaynak_say = collections.Counter()
    rakip_say = collections.Counter()
    for s in sorular:
        for k in s.get("kaynaklar") or []:
            kaynak_say[k] += 1
        for f in s.get("firmalar") or []:
            if not BIZ.search(f):
                rakip_say[f] += 1

    y = ["# Yapay zeka görünürlüğü — %s" % gun_yazi(datetime.date.fromisoformat(kayit["tarih"])), ""]
    y.append("ChatGPT (%s), web aramasi açık · %d soru · maliyet %.2f $" %
             (kayit["model"], len(sorular), kayit["maliyet"]))
    y.append("")
    y.append("**Bizi anan cevap: %d/%d.** Asistandan gelen ziyaretçi sitedeki en iyi dönüşen "
             "kanal (§KONTROL D), o yüzden buradaki her kayıp cevap doğrudan taleptir." %
             (len(anan), len(sorular)))
    y.append("")
    y.append("| pazar | soru | bizi andı mı | listede sıra | birlikte anıldıklarımız |")
    y.append("|---|---|:-:|---:|---|")
    for s in sorular:
        if s.get("hata"):
            y.append("| %s | %s | hata | — | %s |" % (s["pazar"], s["soru"][:60], s["hata"]))
            continue
        rakip = ", ".join([f for f in (s.get("firmalar") or []) if not BIZ.search(f)][:4]) or "—"
        y.append("| %s | %s | %s | %s | %s |" % (
            s["pazar"], s["soru"][:60], "**evet**" if s["bizden"] else "hayır",
            s.get("sira") or "—", rakip))
    y.append("")
    y.append("## Asistanın baktığı kaynaklar — nerede kayıtlı olmalıyız")
    y.append("")
    y.append("| kaynak | kaç cevapta |")
    y.append("|---|---:|")
    for k, n in kaynak_say.most_common(20):
        y.append("| %s | %d |" % (k, n))
    y.append("")
    y.append("## En çok birlikte anıldığımız firmalar")
    y.append("")
    for f, n in rakip_say.most_common(12):
        y.append("- %s — %d cevapta" % (f, n))
    y.append("")
    y.append("---")
    y.append("")
    y.append("**Yöntem:** DataForSEO AI Optimization, ChatGPT web aramalı. Soru listesi "
             "`seo/ai-sorulari.json`; markamız soruların içinde geçmez, ölçülen şey asistanın "
             "bizi kendiliğinden anıp anmadığıdır. Cevaplar her çalıştırmada birebir aynı "
             "olmaz — tek bir cevaba değil, oran ve kaynak listesine bakılır.")
    io.open(yol, "w", encoding="utf-8", newline="\n").write("\n".join(y) + "\n")


def main():
    ap = argparse.ArgumentParser(description="Yapay zeka asistanlarında görünürlük")
    ap.add_argument("--pazar", help="virgüllü pazar listesi (us,de,...)")
    ap.add_argument("--kuru", action="store_true", help="istek atmadan soruları listele")
    a = ap.parse_args()

    ayar = json.load(io.open(SORU_DOSYA, encoding="utf-8"))
    sorular = ayar["sorular"]
    if a.pazar:
        se = {p.strip() for p in a.pazar.split(",") if p.strip()}
        sorular = [s for s in sorular if s["pazar"] in se]
    if not sorular:
        raise SystemExit("[HATA] soru kalmadı")

    if a.kuru:
        for s in sorular:
            print("%-3s %s" % (s["pazar"], s["soru"]))
        print("\n%d soru · tahmini maliyet %.2f $" % (len(sorular), 0.09 * len(sorular)))
        return

    print("%d soru soruluyor (web aramalı, ~%.2f $)..." % (len(sorular), 0.09 * len(sorular)))
    cikti, toplam = [], 0.0
    for s in sorular:
        sonuc = sor(s, s.get("ulke"), ayar["model"])
        toplam += sonuc.pop("maliyet", 0) or 0
        satir = dict(s)
        satir.update(sonuc)
        cikti.append(satir)
        durum = "HATA %s" % sonuc["hata"] if sonuc.get("hata") else (
            "ANILDI%s" % (" (%d. sırada)" % sonuc["sira"] if sonuc.get("sira") else "")
            if sonuc["bizden"] else "yok")
        print("  %-3s %-58s %s" % (s["pazar"], s["soru"][:58], durum))

    bugun = datetime.date.today()
    kayit = {"tarih": bugun.isoformat(), "model": ayar["model"], "maliyet": round(toplam, 4),
             "sorular": cikti}
    if not os.path.isdir(KAYIT_KLASOR):
        os.makedirs(KAYIT_KLASOR)
    kayit_yol = os.path.join(KAYIT_KLASOR, "%s.json" % bugun.isoformat())
    io.open(kayit_yol, "w", encoding="utf-8", newline="\n").write(
        json.dumps(kayit, ensure_ascii=False, indent=1))
    rapor_yol = os.path.join(KAYIT_KLASOR, "RAPOR.md")
    rapor_yaz(kayit, rapor_yol)
    anan = sum(1 for s in cikti if s.get("bizden"))
    print("\nBizi anan cevap: %d/%d · maliyet %.2f $" % (anan, len(cikti), toplam))
    print("Rapor: %s" % os.path.relpath(rapor_yol, KOK))


if __name__ == "__main__":
    main()

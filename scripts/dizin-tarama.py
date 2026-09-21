# -*- coding: utf-8 -*-
"""Site haritasindaki HER adresi URL Inspection API ile sorar; sonucu JSON'a yazar, ozet basar."""
import sys, os, json, re, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from collections import Counter
sys.path.insert(0, os.path.expanduser("~/.config/claude-seo"))
sys.stdout.reconfigure(encoding="utf-8")
from _common import get_session
s, _, _ = get_session(["https://www.googleapis.com/auth/webmasters"])
SITE = "sc-domain:servosteel.com.tr"
CIKTI = sys.argv[1]

xml = urllib.request.urlopen(urllib.request.Request("https://servosteel.com.tr/sitemap.xml",
      headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read().decode("utf-8")
urls = sorted(set(re.findall(r"<loc>([^<]+)</loc>", xml)))
print("site haritasinda", len(urls), "adres", flush=True)

def sor(u):
    for deneme in range(5):
        try:
            r = s.post("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
                       json={"inspectionUrl": u, "siteUrl": SITE, "languageCode": "tr-TR"}, timeout=60)
        except Exception as e:          # ag zaman asimi tum taramayi dusurmesin
            time.sleep(5 * (deneme + 1)); continue
        if r.status_code == 200:
            ir = r.json().get("inspectionResult", {}).get("indexStatusResult", {})
            return {"url": u, "verdict": ir.get("verdict"), "coverage": ir.get("coverageState"),
                    "lastCrawl": ir.get("lastCrawlTime"), "googleCanonical": ir.get("googleCanonical"),
                    "userCanonical": ir.get("userCanonical"), "robots": ir.get("robotsTxtState"),
                    "indexing": ir.get("indexingState"), "fetch": ir.get("pageFetchState")}
        if r.status_code in (429, 500, 503):
            time.sleep(5 * (deneme + 1)); continue
        return {"url": u, "hata": r.status_code, "govde": r.text[:200]}
    return {"url": u, "hata": "tekrar denemeler bitti"}

sonuc = []
with ThreadPoolExecutor(4) as ex:
    for i, x in enumerate(ex.map(sor, urls), 1):
        sonuc.append(x)
        if i % 50 == 0:
            print(f"  {i}/{len(urls)}", flush=True)
json.dump(sonuc, open(CIKTI, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("\nKAPSAM DURUMU:")
for k, n in Counter(x.get("coverage") or f"HATA {x.get('hata')}" for x in sonuc).most_common():
    print(f"  {n:>4}  {k}")
print("\nVERDICT:", dict(Counter(x.get("verdict") for x in sonuc)))

# -*- coding: utf-8 -*-
"""Canli sitedeki her sayfanin her ic linkini cagirir: 404'e giden link var mi?

  python scripts/ic-link-kontrol.py          # her yayindan sonra (KONTROL C.1)

canli-kontrol.py site haritasindaki sayfalari denetler; bu betik o sayfalarin
ICINDEKI linkleri. Fark onemli: 2026-09-21'de 478 sayfanin hepsi 200 donerken
DE/ES/IT/RU maliyet yazisi o dillerde olmayan "roll form nedir" yazisina link
veriyordu — 4 kirik link, canli-kontrol'un gormedigi yerde. Cikis kodu: kirik
link varsa 1.
"""
import sys, re, urllib.request, urllib.parse, ssl
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
sys.stdout.reconfigure(encoding="utf-8")
UA = {"User-Agent": "Mozilla/5.0 (compatible; servosteel-linkcheck)"}
KOK = "https://servosteel.com.tr"

def al(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return 0, type(e).__name__

_, xml = al(KOK + "/sitemap.xml")
sayfalar = sorted(set(re.findall(r"<loc>([^<]+)</loc>", xml)))
print("sayfa:", len(sayfalar), flush=True)

nereden = defaultdict(set)
def linkler(u):
    k, h = al(u)
    out = set()
    for m in re.finditer(r'<a\b[^>]*\bhref="([^"#]+)', h):
        href = m.group(1).replace("&amp;", "&")
        tam = urllib.parse.urljoin(u, href)
        p = urllib.parse.urlparse(tam)
        if p.netloc in ("servosteel.com.tr", "www.servosteel.com.tr") and p.scheme in ("http", "https"):
            out.add(urllib.parse.urlunparse(p._replace(fragment="", query="")))
    return u, k, out

with ThreadPoolExecutor(8) as ex:
    for u, k, out in ex.map(linkler, sayfalar):
        for l in out:
            nereden[l].add(u)
hedefler = sorted(nereden)
print("benzersiz ic link hedefi:", len(hedefler), flush=True)

def durum(u):
    return u, al(u)[0]
kotu = []
with ThreadPoolExecutor(8) as ex:
    for u, k in ex.map(durum, hedefler):
        if k != 200:
            kotu.append((k, u))
print("\n200 DISI DONEN IC LINK:", len(kotu))
for k, u in sorted(kotu):
    ornek = sorted(nereden[u])[:3]
    print(f"  {k}  {u}\n       <- {len(nereden[u])} sayfadan, ornek: {', '.join(x.replace(KOK, '') for x in ornek)}")
sys.exit(1 if kotu else 0)

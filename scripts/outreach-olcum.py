# -*- coding: utf-8 -*-
"""Hedef firma e-postalarindaki linke kim tikladi?

  python scripts/outreach-olcum.py            # son 30 gun
  python scripts/outreach-olcum.py 7          # son 7 gun

Excel'deki her link utm_source=outreach, utm_campaign=<segment>,
utm_content=<firmanin alan adi> tasiyor. GA4 bunlari oturum boyutu olarak
tutuyor; bu betik firma firma listeler. Tiklayan firma = sicak firma:
takip telefonu once ona.

Veri ~24-48 saat gecikmeli gelir (GA4 standart rapor). Bugun gonderilen
e-postanin tiklamasini yarin arayin.
"""
import os
import sys

sys.path.insert(0, os.path.expanduser("~/.config/claude-seo"))
from _common import get_session  # noqa: E402

GUN = int(sys.argv[1]) if len(sys.argv) > 1 else 30
PID = "properties/548769261"   # Servosteel GA4 — dekoartizan DEGIL

s, _, _ = get_session(["https://www.googleapis.com/auth/analytics.readonly"])


def rapor(boyutlar, metrikler, filtre=None, sira=None):
    govde = {
        "dateRanges": [{"startDate": "%ddaysAgo" % (GUN - 1), "endDate": "today"}],
        "dimensions": [{"name": b} for b in boyutlar],
        "metrics": [{"name": m} for m in metrikler],
        "limit": 500,
    }
    if filtre:
        govde["dimensionFilter"] = filtre
    if sira:
        govde["orderBys"] = sira
    r = s.post("https://analyticsdata.googleapis.com/v1beta/%s:runReport" % PID, json=govde)
    if r.status_code != 200:
        raise SystemExit("[HATA] %s: %s" % (r.status_code, r.text[:300]))
    return [([d["value"] for d in x["dimensionValues"]], [m["value"] for m in x["metricValues"]])
            for x in r.json().get("rows", [])]


OUTREACH = {"filter": {"fieldName": "sessionSource",
                       "stringFilter": {"value": "outreach", "matchType": "EXACT"}}}

print("# Hedef firma e-postalari — son %d gun (GA4 %s)\n" % (GUN, PID))

firmalar = rapor(["sessionManualAdContent", "sessionCampaignName", "country"],
                 ["sessions", "screenPageViews", "userEngagementDuration"],
                 OUTREACH, [{"metric": {"metricName": "sessions"}, "desc": True}])
if not firmalar:
    print("Henuz tiklama yok (ya e-posta gitmedi ya da veri 24-48 saat gecikmede).")
    sys.exit(0)

print("## Tiklayan firmalar")
print("%-34s %-14s %-14s %7s %6s %7s" % ("firma (alan adi)", "segment", "ulke", "oturum", "sayfa", "sure sn"))
for (icerik, kampanya, ulke), (oturum, sayfa, sure) in firmalar:
    print("%-34s %-14s %-14s %7s %6s %7s" % (icerik[:34], kampanya[:14], ulke[:14], oturum, sayfa, sure))

print("\n## Segment ozeti")
for (kampanya,), (oturum, kisi) in rapor(["sessionCampaignName"], ["sessions", "totalUsers"], OUTREACH):
    print("  %-16s %4s oturum  %4s kisi" % (kampanya, oturum, kisi))

donusum = rapor(["sessionManualAdContent", "eventName"], ["eventCount"], {"andGroup": {"expressions": [
    OUTREACH,
    {"filter": {"fieldName": "eventName", "inListFilter": {"values": ["generate_lead", "form_start"]}}},
]}})
print("\n## Forma dokunan / talep gonderen")
if not donusum:
    print("  yok")
for (icerik, olay), (n,) in donusum:
    print("  %-34s %-14s %s" % (icerik[:34], olay, n))

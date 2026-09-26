# -*- coding: utf-8 -*-
"""Yerel sahte IMAP sunucusu — panelin e-posta istemcisini (src/lib/posta.ts)
ve gelen kutusu taramasini gercek imapflow istemcisiyle denemek icin.

127.0.0.1:9993, duz baglanti (993 degil -> imapflow TLS istemez). Her parola
kabul; durum bellekte, yeniden baslatinca sifirlanir.

  python scripts/imap-sahte.py

Desteklenen: CAPABILITY, LOGIN, LIST/LSUB (Gonderilmis special-use isaretli), SELECT/EXAMINE,
FETCH/UID FETCH (UID FLAGS ENVELOPE INTERNALDATE RFC822.SIZE BODYSTRUCTURE
BODY.PEEK[]<a.b>), SEARCH (SINCE, UID), STORE, APPEND, CREATE, STATUS, NOOP, LOGOUT.

Kutular:
  ege@        Gelen: 4 ornek (yanit, ekli, yalniz HTML, Turkce ic yazisma) · Gonderilmis: 1
  marketing@  Gelen: 45 ileti (sayfalama) · Gonderilmis: bos
  yasin@      Gelen: bos · Gonderilmis klasoru YOK (ilk gonderimde acilir)
  gulsoy@     Gelen: 1 · Gonderilmis: bos

UIDVALIDITY 2^31'in ustunde: BIGINT / Number donusumleri de sinansin.

Paneli buna baglamak icin yerel sunucuda OUTREACH_IMAP_HOST=127.0.0.1,
OUTREACH_IMAP_PORT=9993; gonderim icin scripts/smtp-yutucu.py. Ayni DIKKAT:
yerel sunucu .env.local'daki CANLI veritabanina bagliysa tarama canliya yazar —
ayri bir veritabaniyla deneyin.
"""
import email
import email.policy
import email.utils
import re
import socketserver
import sys
import threading
import time
from email.message import EmailMessage

PORT = 9993
UIDVALIDITY = 3857529045
KILIT = threading.Lock()


def ileti(kimden, kime, konu, govde, *, tarih, kimlik, yanit=None, referans=None, bilgi=None,
          yanitla=None, html=False, ek=None):
    m = EmailMessage(policy=email.policy.SMTP)
    m["From"] = kimden
    m["To"] = kime
    if bilgi:
        m["Cc"] = bilgi
    if yanitla:
        m["Reply-To"] = yanitla
    m["Subject"] = konu
    m["Date"] = email.utils.format_datetime(tarih)
    m["Message-ID"] = kimlik
    if yanit:
        m["In-Reply-To"] = yanit
    if referans:
        m["References"] = referans
    if html:
        m.set_content(govde, subtype="html")
    else:
        m.set_content(govde)
    if ek:
        m.add_attachment(ek[1], maintype="application", subtype="pdf", filename=ek[0])
    return m.as_bytes()


def gun(g, s=10, d=0):
    import datetime as dt
    return dt.datetime(2026, 9, g, s, d, tzinfo=dt.timezone(dt.timedelta(hours=3)))


KUTULAR = {}


def kutu_kur():
    ege_gelen = [
        (ileti("Stripsteel Ventas <ventas@stripsteel.example>", "Servosteel Export <ege@servosteel.com.tr>",
               "Re: Líneas de corte longitudinal — Servosteel, Estambul",
               "Hola,\n\nGracias por su correo. Nos interesa una línea de corte longitudinal para bobinas de 1500 mm.\n"
               "¿Podrían enviarnos una cotización?\n\nSaludos,\nMaría González\nStripsteel\n\n"
               "> Dear Stripsteel team,\n> We are writing from Servosteel in Istanbul.",
               tarih=gun(25, 16, 40), kimlik="<strip-1@stripsteel.example>",
               yanit="<ilk-1@servosteel.com.tr>", referans="<ilk-1@servosteel.com.tr>"), set()),
        (ileti("G - Connect <connect@giffin.example>", "Servosteel Export <ege@servosteel.com.tr>",
               "RE: Guardrail roll forming lines — Servosteel, Istanbul",
               "Dear Sir/Madam,\n\nPlease share your company profile and references.\n\nKind regards,\nProcurement",
               tarih=gun(24, 9, 5), kimlik="<giffin-1@giffin.example>", bilgi="procurement@giffin.example",
               yanitla="procurement@giffin.example", ek=("Company-Profile.pdf", b"%PDF-1.4 sahte")),
         {"\\Seen", "\\Answered"}),
        (ileti("Mail Delivery System <mailer-daemon@hera.example>", "ege@servosteel.com.tr",
               "Mail delivery failed: returning message to sender",
               "<html><body><p>This message was created automatically.</p><p><b>info@yok.example</b>: "
               "550 mailbox unavailable</p></body></html>",
               tarih=gun(23, 22, 0), kimlik="<bounce-1@hera.example>", html=True), set()),
        (ileti("Liza Shpelevaya <liza@servosteel.com.tr>", "ege@servosteel.com.tr",
               "Fiyat listesi güncellendi", "Merhaba,\n\nYeni fiyat listesi ekte değil, sunucuda. Çalışmalara başlayabiliriz.\n\nLiza",
               tarih=gun(20, 11, 30), kimlik="<liza-1@servosteel.com.tr>"), {"\\Seen"}),
    ]
    ege_giden = [
        (ileti("Servosteel Export <ege@servosteel.com.tr>", "ventas@stripsteel.example",
               "Líneas de corte longitudinal — Servosteel, Estambul",
               "Dear Stripsteel team,\nWe are writing from Servosteel in Istanbul.",
               tarih=gun(22, 10, 0), kimlik="<ilk-1@servosteel.com.tr>"), {"\\Seen"}),
    ]
    pazarlama = [
        (ileti(f"Firma {i} <satis{i}@ornek{i}.example>", "marketing@servosteel.com.tr",
               f"Soru {i}", f"İleti {i} gövdesi.", tarih=gun(1 + i % 25, 8 + i % 10, i % 60),
               kimlik=f"<m{i}@ornek{i}.example>"), {"\\Seen"} if i % 3 else set())
        for i in range(1, 46)
    ]
    gulsoy = [
        (ileti("Bilgi <info@tedarik.example>", "gulsoy@servosteel.com.tr", "Katalog talebi",
               "Katalog gönderebilir misiniz?", tarih=gun(26, 8, 15), kimlik="<t-1@tedarik.example>"), set()),
    ]

    def dolu(liste, ilk_uid):
        return [{"uid": ilk_uid + i, "raw": raw, "flags": set(f), "idate": time.time() - (len(liste) - i) * 3600}
                for i, (raw, f) in enumerate(liste)]

    KUTULAR["ege@servosteel.com.tr"] = {"INBOX": dolu(ege_gelen, 101), "Sent": dolu(ege_giden, 1)}
    KUTULAR["marketing@servosteel.com.tr"] = {"INBOX": dolu(pazarlama, 1), "Sent": []}
    KUTULAR["yasin@servosteel.com.tr"] = {"INBOX": []}
    KUTULAR["gulsoy@servosteel.com.tr"] = {"INBOX": dolu(gulsoy, 7), "Sent": []}


# ------------------------------------------------------------------ biçim

def dizgi(s):
    """IMAP dizgisi: ASCII ve güvenliyse tırnaklı, değilse literal. bytes döner."""
    if s is None:
        return b"NIL"
    if isinstance(s, bytes):
        b = s
    else:
        b = s.encode("utf-8")
    if any(c > 126 or c < 32 for c in b) or b'"' in b or b"\\" in b:
        return b"{%d}\r\n" % len(b) + b
    return b'"' + b + b'"'


def katla(v):
    return re.sub(r"\r?\n[ \t]+", " ", v) if v else v


def adresler(v):
    if not v:
        return b"NIL"
    liste = email.utils.getaddresses([katla(v)])
    parca = []
    for ad, adres in liste:
        kutu, _, alan = adres.partition("@")
        parca.append(b"(" + dizgi(ad or None) + b" NIL " + dizgi(kutu) + b" " + dizgi(alan) + b")")
    return b"(" + b"".join(parca) + b")" if parca else b"NIL"


def zarf(m):
    kimden = m.get("From")
    return b"(" + b" ".join([
        dizgi(katla(m.get("Date"))),
        dizgi(katla(m.get("Subject"))),
        adresler(kimden),
        adresler(m.get("Sender") or kimden),
        adresler(m.get("Reply-To") or kimden),
        adresler(m.get("To")),
        adresler(m.get("Cc")),
        adresler(m.get("Bcc")),
        dizgi(katla(m.get("In-Reply-To"))),
        dizgi(katla(m.get("Message-ID"))),
    ]) + b")"


def parametreler(p):
    ps = p.get_params(header="content-type") or []
    ps = ps[1:]
    if not ps:
        return b"NIL"
    return b"(" + b" ".join(dizgi(k.upper()) + b" " + dizgi(str(v)) for k, v in ps) + b")"


def yerlesim(p):
    d = p.get("Content-Disposition")
    if not d:
        return b"NIL"
    tur = d.split(";")[0].strip().upper()
    ps = p.get_params(header="content-disposition") or []
    ps = ps[1:]
    pb = b"(" + b" ".join(dizgi(k.upper()) + b" " + dizgi(str(v)) for k, v in ps) + b")" if ps else b"NIL"
    return b"(" + dizgi(tur) + b" " + pb + b")"


def yapi(p):
    if p.is_multipart():
        alt = b"".join(yapi(x) for x in p.get_payload())
        return b"(" + alt + b" " + dizgi(p.get_content_subtype().upper()) + b" " + parametreler(p) + b" NIL NIL NIL)"
    ana = p.get_content_maintype().upper()
    govde = p.get_payload(decode=False)
    govde_b = govde.encode("utf-8", "replace") if isinstance(govde, str) else bytes(govde)
    alanlar = [
        dizgi(ana), dizgi(p.get_content_subtype().upper()), parametreler(p),
        dizgi(p.get("Content-ID")), b"NIL", dizgi((p.get("Content-Transfer-Encoding") or "7BIT").upper()),
        str(len(govde_b)).encode(),
    ]
    if ana == "TEXT":
        alanlar.append(str(govde_b.count(b"\n") + 1).encode())
    alanlar += [b"NIL", yerlesim(p), b"NIL", b"NIL"]
    return b"(" + b" ".join(alanlar) + b")"


def ic_tarih(t):
    return time.strftime("%d-%b-%Y %H:%M:%S +0300", time.gmtime(t + 3 * 3600))


# ------------------------------------------------------------------ çözümleme

class Q(str):
    """Tırnaklı dizgi (atomdan ayırmak için)."""


def parcala(s, literaller):
    yigin = [[]]
    i = 0
    while i < len(s):
        c = s[i]
        if c == " ":
            i += 1
        elif c == "(":
            yigin.append([])
            i += 1
        elif c == ")":
            t = yigin.pop()
            yigin[-1].append(t)
            i += 1
        elif c == '"':
            j = i + 1
            buf = ""
            while s[j] != '"':
                if s[j] == "\\":
                    j += 1
                buf += s[j]
                j += 1
            yigin[-1].append(Q(buf))
            i = j + 1
        elif s.startswith("\x00L", i):
            j = s.index("\x00", i + 2)
            yigin[-1].append(literaller[int(s[i + 2:j])])
            i = j + 1
        else:
            j = i
            derinlik = 0
            while j < len(s) and (derinlik > 0 or s[j] not in " ()"):
                if s[j] == "[":
                    derinlik += 1
                elif s[j] == "]":
                    derinlik -= 1
                j += 1
            yigin[-1].append(s[i:j])
            i = j
    return yigin[0]


def kume(s, en_buyuk):
    out = set()
    for parca in str(s).split(","):
        if ":" in parca:
            a, b = parca.split(":")
            a = en_buyuk if a == "*" else int(a)
            b = en_buyuk if b == "*" else int(b)
            out.update(range(min(a, b), max(a, b) + 1))
        else:
            out.add(en_buyuk if parca == "*" else int(parca))
    return out


def kutu_adi(v):
    v = str(v)
    return "INBOX" if v.upper() == "INBOX" else v


class Isleyici(socketserver.StreamRequestHandler):
    def yaz(self, b):
        self.wfile.write(b)
        self.wfile.flush()

    def komut_oku(self):
        parcalar = []
        literaller = []
        while True:
            satir = self.rfile.readline()
            if not satir:
                return None
            satir = satir.rstrip(b"\r\n")
            m = re.search(rb"~?\{(\d+)(\+?)\}$", satir)
            if m:
                n = int(m.group(1))
                if not m.group(2):
                    self.yaz(b"+ Hazir\r\n")
                literaller.append(self.rfile.read(n))
                parcalar.append(satir[:m.start()].decode("utf-8", "replace") + "\x00L%d\x00" % (len(literaller) - 1))
                continue
            parcalar.append(satir.decode("utf-8", "replace"))
            return "".join(parcalar), literaller

    def handle(self):
        self.kullanici = None
        self.secili = None
        self.salt_okunur = True
        self.yaz(b"* OK [CAPABILITY IMAP4rev1 SPECIAL-USE UIDPLUS] Sahte IMAP hazir\r\n")
        while True:
            k = self.komut_oku()
            if k is None:
                return
            metin, literaller = k
            t = parcala(metin, literaller)
            if len(t) < 2:
                continue
            etiket, ad, arg = t[0], str(t[1]).upper(), t[2:]
            uid_mu = False
            if ad == "UID":
                uid_mu = True
                ad, arg = str(arg[0]).upper(), arg[1:]
            gunluk = metin if ad != "LOGIN" else f"{etiket} LOGIN {arg[0]} ***"
            print(f"[{self.kullanici or '-'}] {gunluk[:200]}", flush=True)
            try:
                with KILIT:
                    son = getattr(self, "k_" + ad.replace(".", "_"), None)
                    if son is None:
                        self.yaz(f"{etiket} BAD {ad} desteklenmiyor\r\n".encode())
                        continue
                    if son(etiket, arg, uid_mu) == "cik":
                        return
            except Exception as e:  # noqa: BLE001
                print("HATA:", repr(e), flush=True)
                self.yaz(f"{etiket} BAD sunucu hatasi\r\n".encode())

    # ---- komutlar

    def k_CAPABILITY(self, e, a, u):
        self.yaz(b"* CAPABILITY IMAP4rev1 SPECIAL-USE UIDPLUS\r\n" + f"{e} OK CAPABILITY tamam\r\n".encode())

    def k_NOOP(self, e, a, u):
        self.yaz(f"{e} OK NOOP\r\n".encode())

    def k_LOGIN(self, e, a, u):
        kul = str(a[0]).lower()
        KUTULAR.setdefault(kul, {"INBOX": []})
        self.kullanici = kul
        self.yaz(f"{e} OK [CAPABILITY IMAP4rev1 SPECIAL-USE UIDPLUS] LOGIN tamam\r\n".encode())

    def k_LOGOUT(self, e, a, u):
        self.yaz(b"* BYE gule gule\r\n" + f"{e} OK LOGOUT tamam\r\n".encode())
        return "cik"

    def _liste(self, e, a, komut, ozel):
        desen = str(a[1]) if len(a) > 1 else "*"
        if desen == "":
            self.yaz(f'* {komut} (\\Noselect) "." ""\r\n{e} OK {komut} tamam\r\n'.encode())
            return
        for ad in KUTULAR[self.kullanici]:
            if desen not in ("*", "%") and kutu_adi(desen) != ad:
                continue
            bayrak = "\\HasNoChildren"
            if ozel and ad == "Sent":
                bayrak += " \\Sent"
            self.yaz(f'* {komut} ({bayrak}) "." "{ad}"\r\n'.encode())
        self.yaz(f"{e} OK {komut} tamam\r\n".encode())

    def k_LIST(self, e, a, u):
        self._liste(e, a, "LIST", True)

    def k_LSUB(self, e, a, u):
        self._liste(e, a, "LSUB", False)

    def k_NAMESPACE(self, e, a, u):
        self.yaz(f'* NAMESPACE (("" ".")) NIL NIL\r\n{e} OK NAMESPACE\r\n'.encode())

    def k_CREATE(self, e, a, u):
        KUTULAR[self.kullanici].setdefault(kutu_adi(a[0]), [])
        self.yaz(f"{e} OK CREATE tamam\r\n".encode())

    def _sec(self, e, a, salt):
        ad = kutu_adi(a[0])
        kutu = KUTULAR[self.kullanici].get(ad)
        if kutu is None:
            self.secili = None
            self.yaz(f"{e} NO [NONEXISTENT] boyle klasor yok\r\n".encode())
            return
        self.secili = ad
        self.salt_okunur = salt
        uidnext = (max((m["uid"] for m in kutu), default=0)) + 1
        self.yaz(
            b"* FLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft)\r\n"
            + b"* OK [PERMANENTFLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft \\*)] izinli\r\n"
            + f"* {len(kutu)} EXISTS\r\n* 0 RECENT\r\n".encode()
            + f"* OK [UIDVALIDITY {UIDVALIDITY}] uidvalidity\r\n* OK [UIDNEXT {uidnext}] uidnext\r\n".encode()
            + f"{e} OK [{'READ-ONLY' if salt else 'READ-WRITE'}] {'EXAMINE' if salt else 'SELECT'} tamam\r\n".encode()
        )

    def k_SELECT(self, e, a, u):
        self._sec(e, a, False)

    def k_EXAMINE(self, e, a, u):
        self._sec(e, a, True)

    def k_CLOSE(self, e, a, u):
        self.secili = None
        self.yaz(f"{e} OK CLOSE\r\n".encode())

    k_UNSELECT = k_CLOSE

    def k_STATUS(self, e, a, u):
        ad = kutu_adi(a[0])
        kutu = KUTULAR[self.kullanici].get(ad, [])
        gorulmemis = sum(1 for m in kutu if "\\Seen" not in m["flags"])
        uidnext = (max((m["uid"] for m in kutu), default=0)) + 1
        self.yaz(f'* STATUS "{ad}" (MESSAGES {len(kutu)} UIDNEXT {uidnext} UIDVALIDITY {UIDVALIDITY} UNSEEN {gorulmemis})\r\n{e} OK STATUS\r\n'.encode())

    def _hedefler(self, kume_metni, uid_mu):
        kutu = KUTULAR[self.kullanici][self.secili]
        if uid_mu:
            en = max((m["uid"] for m in kutu), default=0)
            istenen = kume(kume_metni, en)
            return [(i + 1, m) for i, m in enumerate(kutu) if m["uid"] in istenen]
        istenen = kume(kume_metni, len(kutu))
        return [(i + 1, m) for i, m in enumerate(kutu) if (i + 1) in istenen]

    def k_FETCH(self, e, a, u):
        if not self.secili:
            self.yaz(f"{e} BAD klasor secili degil\r\n".encode())
            return
        ogeler = a[1] if isinstance(a[1], list) else [a[1]]
        ogeler = [str(x).upper() if not isinstance(x, list) else x for x in ogeler]
        for sira, m in self._hedefler(a[0], u):
            msg = email.message_from_bytes(m["raw"], policy=email.policy.compat32)
            parca = []
            if u or "UID" in ogeler:
                parca.append(b"UID %d" % m["uid"])
            for o in ogeler:
                if o == "UID":
                    continue
                if o == "FLAGS":
                    parca.append(b"FLAGS (" + " ".join(sorted(m["flags"])).encode() + b")")
                elif o == "INTERNALDATE":
                    parca.append(b'INTERNALDATE "' + ic_tarih(m["idate"]).encode() + b'"')
                elif o == "RFC822.SIZE":
                    parca.append(b"RFC822.SIZE %d" % len(m["raw"]))
                elif o == "ENVELOPE":
                    parca.append(b"ENVELOPE " + zarf(msg))
                elif o == "BODYSTRUCTURE":
                    parca.append(b"BODYSTRUCTURE " + yapi(msg))
                elif o.startswith("BODY.PEEK[]") or o.startswith("BODY[]"):
                    veri = m["raw"]
                    ek = re.search(r"<(\d+)(?:\.(\d+))?>", o)
                    if ek:
                        bas = int(ek.group(1))
                        uz = int(ek.group(2)) if ek.group(2) else len(veri)
                        veri = veri[bas:bas + uz]
                        parca.append(b"BODY[]<%d> {%d}\r\n" % (bas, len(veri)) + veri)
                    else:
                        parca.append(b"BODY[] {%d}\r\n" % len(veri) + veri)
                    if o.startswith("BODY[]") and not self.salt_okunur:
                        m["flags"].add("\\Seen")
                else:
                    print("  bilinmeyen FETCH ogesi:", o, flush=True)
            self.yaz(b"* %d FETCH (" % sira + b" ".join(parca) + b")\r\n")
        self.yaz(f"{e} OK FETCH tamam\r\n".encode())

    def k_SEARCH(self, e, a, u):
        """Yalnızca taramanın kullandıkları: SINCE <tarih>, UID <küme>, ALL."""
        if not self.secili:
            self.yaz(f"{e} BAD klasor secili degil\r\n".encode())
            return
        kutu = KUTULAR[self.kullanici][self.secili]
        adaylar = list(enumerate(kutu, start=1))
        i = 0
        while i < len(a):
            o = str(a[i]).upper()
            if o == "SINCE":
                sinir = time.mktime(time.strptime(str(a[i + 1]), "%d-%b-%Y"))
                adaylar = [(s, m) for s, m in adaylar if m["idate"] >= sinir]
                i += 2
            elif o == "UID":
                en = max((m["uid"] for m in kutu), default=0)
                istenen = kume(a[i + 1], en)
                adaylar = [(s, m) for s, m in adaylar if m["uid"] in istenen]
                i += 2
            else:
                i += 1
        sonuc = " ".join(str(m["uid"] if u else s) for s, m in adaylar)
        self.yaz(f"* SEARCH {sonuc}\r\n{e} OK SEARCH tamam\r\n".replace("* SEARCH \r\n", "* SEARCH\r\n").encode())

    def k_STORE(self, e, a, u):
        if not self.secili or self.salt_okunur:
            self.yaz(f"{e} NO salt okunur\r\n".encode())
            return
        islem = str(a[1]).upper()
        bayraklar = a[2] if isinstance(a[2], list) else [a[2]]
        bayraklar = {str(b) for b in bayraklar}
        for sira, m in self._hedefler(a[0], u):
            if islem.startswith("+"):
                m["flags"] |= bayraklar
            elif islem.startswith("-"):
                m["flags"] -= bayraklar
            else:
                m["flags"] = set(bayraklar)
            if not islem.endswith(".SILENT"):
                self.yaz(b"* %d FETCH (UID %d FLAGS (" % (sira, m["uid"]) + " ".join(sorted(m["flags"])).encode() + b"))\r\n")
        self.yaz(f"{e} OK STORE tamam\r\n".encode())

    def k_APPEND(self, e, a, u):
        ad = kutu_adi(a[0])
        kutu = KUTULAR[self.kullanici].get(ad)
        if kutu is None:
            self.yaz(f"{e} NO [TRYCREATE] klasor yok\r\n".encode())
            return
        bayraklar = set()
        veri = None
        for x in a[1:]:
            if isinstance(x, list):
                bayraklar = {str(b) for b in x}
            elif isinstance(x, bytes):
                veri = x
        uid = (max((m["uid"] for m in kutu), default=0)) + 1
        kutu.append({"uid": uid, "raw": veri or b"", "flags": bayraklar, "idate": time.time()})
        self.yaz(f"{e} OK [APPENDUID {UIDVALIDITY} {uid}] APPEND tamam\r\n".encode())


class Sunucu(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    kutu_kur()
    with Sunucu(("127.0.0.1", PORT), Isleyici) as s:
        print(f"sahte IMAP 127.0.0.1:{PORT} — kutular: {', '.join(KUTULAR)}", flush=True)
        s.serve_forever()

# -*- coding: utf-8 -*-
"""Yerel sahte SMTP sunucusu — panelin tanitim e-postasi gonderimini denemek icin.

HICBIR e-postayi disari iletmez. Gelen her iletiyi gecici klasore
(<TEMP>/servosteel-smtp-yutucu/gelen/NNN.eml) yazar.

  python scripts/smtp-yutucu.py          # 127.0.0.1:2525, mod: normal
  python scripts/smtp-yutucu.py 421      # baslangic modu

Mod her baglantida <TEMP>/servosteel-smtp-yutucu/mod.txt'den okunur, yeniden
baslatmadan degistirilebilir:
  normal   her sey 250
  421      MAIL FROM'a 421 (hiz siniri)        -> sigorta atmali
  550      RCPT TO'ya 550 5.1.1 user unknown   -> firma "Adres hatali", gonderim surer
  535      AUTH'a 535                          -> sigorta, "parola" mesaji
  yavas    DATA'dan sonra 50 sn bekler         -> 45 sn sert sinir: "belirsiz"

Paneli buna baglamak icin yerel sunucuda OUTREACH_SMTP_HOST=127.0.0.1,
OUTREACH_SMTP_PORT=2525 (parola herhangi bir sey). DIKKAT: yerel sunucu
.env.local'daki CANLI veritabanina bagliysa gonderim kaydi ve firma durumu
canlida degisir — denemeyi ayri bir veritabaniyla yapin (DATABASE_URL).
"""
import os
import socketserver
import sys
import tempfile
import threading
import time

KOK = os.path.join(tempfile.gettempdir(), "servosteel-smtp-yutucu")
GELEN = os.path.join(KOK, "gelen")
MOD = os.path.join(KOK, "mod.txt")
os.makedirs(GELEN, exist_ok=True)
sayac_kilit = threading.Lock()


def mod():
    try:
        return open(MOD, encoding="utf-8").read().strip() or "normal"
    except OSError:
        return "normal"


class Isleyici(socketserver.StreamRequestHandler):
    def yaz(self, satir):
        self.wfile.write((satir + "\r\n").encode("utf-8"))
        self.wfile.flush()

    def handle(self):
        m = mod()
        self.yaz("220 yutucu.local ESMTP test")
        veri_modu, satirlar, zarf = False, [], {"from": "", "to": []}
        while True:
            ham = self.rfile.readline()
            if not ham:
                return
            s = ham.decode("utf-8", "replace").rstrip("\r\n")
            if veri_modu:
                if s == ".":
                    veri_modu = False
                    with sayac_kilit:
                        n = len(os.listdir(GELEN)) + 1
                        with open(os.path.join(GELEN, "%03d.eml" % n), "w", encoding="utf-8") as d:
                            d.write("X-Zarf-From: %s\nX-Zarf-To: %s\n" % (zarf["from"], ",".join(zarf["to"])))
                            d.write("\n".join(satirlar))
                    satirlar = []
                    if m == "yavas":
                        time.sleep(50)
                    self.yaz("250 2.0.0 Ok: queued as TEST%03d" % n)
                else:
                    satirlar.append(s[1:] if s.startswith("..") else s)
                continue
            k = s.upper()
            if k.startswith("EHLO"):
                self.wfile.write(b"250-yutucu.local\r\n250-AUTH PLAIN LOGIN\r\n250-8BITMIME\r\n250-SMTPUTF8\r\n250 SIZE 10485760\r\n")
                self.wfile.flush()
            elif k.startswith("HELO"):
                self.yaz("250 yutucu.local")
            elif k.startswith("AUTH"):
                if m == "535":
                    self.yaz("535 5.7.8 Error: authentication failed")
                    continue
                if k.startswith("AUTH LOGIN"):
                    parca = s.split()
                    if len(parca) < 3:
                        self.yaz("334 VXNlcm5hbWU6")
                        self.rfile.readline()
                    self.yaz("334 UGFzc3dvcmQ6")
                    self.rfile.readline()
                self.yaz("235 2.7.0 Authentication successful")
            elif k.startswith("MAIL FROM"):
                if m == "421":
                    self.yaz("421 4.7.0 Too many messages from this account, try again later")
                    continue
                zarf["from"] = s[10:].strip()
                self.yaz("250 2.1.0 Ok")
            elif k.startswith("RCPT TO"):
                if m == "550":
                    self.yaz("550 5.1.1 <x>: Recipient address rejected: User unknown in virtual mailbox table")
                    continue
                zarf["to"].append(s[8:].strip())
                self.yaz("250 2.1.5 Ok")
            elif k == "DATA":
                veri_modu = True
                self.yaz("354 End data with <CR><LF>.<CR><LF>")
            elif k == "RSET":
                zarf = {"from": "", "to": []}
                self.yaz("250 2.0.0 Ok")
            elif k == "NOOP":
                self.yaz("250 2.0.0 Ok")
            elif k == "QUIT":
                self.yaz("221 2.0.0 Bye")
                return
            else:
                self.yaz("502 5.5.2 Error: command not recognized")


class Sunucu(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(MOD, "w", encoding="utf-8") as d:
            d.write(sys.argv[1])
    print("mod: %s · gelenler: %s" % (mod(), GELEN), flush=True)
    with Sunucu(("127.0.0.1", 2525), Isleyici) as s:
        print("yutucu 127.0.0.1:2525 dinliyor", flush=True)
        s.serve_forever()

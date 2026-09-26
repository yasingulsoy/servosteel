import assert from "node:assert/strict";
import { simpleParser } from "mailparser";
/**
 * Gelen e-posta sınıflandırmasının testi — gerçek biçimli örnek iletiler, ağ yok.
 *
 *   node scripts/gelen-kurallar-test.mjs
 *
 * İletiler mailparser'dan geçiriliyor: tarayıcı (src/lib/gelen-tarama.ts) da
 * aynı yolla okuyor, yani başlık ve rapor parçaları gerçekteki gibi gelir.
 */
const K = await import(new URL("../src/lib/gelen-kurallar.ts", import.meta.url).href);
const O = await import(new URL("../src/lib/gelen-ozet.ts", import.meta.url).href);

const ileti = async (ham) => O.gelenOzeti(await simpleParser(ham.replace(/\n/g, "\r\n")));
const sinifla = async (ham) => K.gelenSiniflandir(await ileti(ham));

let n = 0;
const t = async (ad, fn) => { await fn(); n++; console.log("  ok -", ad); };

await t("exim geri donusu (cPanel)", async () => {
  const s = await sinifla(`From: Mail Delivery System <Mailer-Daemon@hera.veridyen.com>
To: marketing@servosteel.com.tr
Subject: Mail delivery failed: returning message to sender
Auto-Submitted: auto-replied
X-Failed-Recipients: info@firma-yok.com
Content-Type: text/plain; charset=utf-8

This message was created automatically by mail delivery software.

A message that you sent could not be delivered to one or more of its
recipients. This is a permanent error. The following address(es) failed:

  info@firma-yok.com
    host mx.firma-yok.com [1.2.3.4]
    SMTP error from remote mail server after RCPT TO:<info@firma-yok.com>:
    550 5.1.1 <info@firma-yok.com>: Recipient address rejected: User unknown
`);
  assert.equal(s.tur, "geri_donus");
  assert.equal(s.kalici, true);
  assert.deepEqual(s.adresler, ["info@firma-yok.com"]);
  assert.match(s.sebep, /550 5\.1\.1/);
});

await t("gmail teslim raporu (multipart/report)", async () => {
  const s = await sinifla(`From: Mail Delivery Subsystem <mailer-daemon@googlemail.com>
To: yasin@servosteel.com.tr
Subject: Delivery Status Notification (Failure)
MIME-Version: 1.0
Content-Type: multipart/report; report-type=delivery-status; boundary="b1"

--b1
Content-Type: text/plain; charset=UTF-8

Address not found
Your message wasn't delivered to ventas@yok.com.mx because the address couldn't be found.
--b1
Content-Type: message/delivery-status

Reporting-MTA: dns; googlemail.com

Final-Recipient: rfc822; ventas@yok.com.mx
Action: failed
Status: 5.1.1
Diagnostic-Code: smtp; 550-5.1.1 The email account that you tried to reach does not exist.
--b1--
`);
  assert.equal(s.tur, "geri_donus");
  assert.equal(s.kalici, true);
  assert.deepEqual(s.adresler, ["ventas@yok.com.mx"]);
  assert.match(s.sebep, /does not exist/);
});

await t("gecikme bildirimi kalici degil", async () => {
  const s = await sinifla(`From: Mail Delivery System <MAILER-DAEMON@hera.veridyen.com>
Subject: Warning: message 1wx-000 delayed 24 hours
Content-Type: multipart/report; report-type=delivery-status; boundary="b2"

--b2
Content-Type: text/plain

This message was created automatically by mail delivery software.
A message that you sent has not yet been delivered to one or more of its
recipients after more than 24 hours on the queue. No action is required on your part.
--b2
Content-Type: message/delivery-status

Final-Recipient: rfc822;info@yavas.co.ke
Action: delayed
Status: 4.4.7
--b2--
`);
  assert.equal(s.tur, "geri_donus");
  assert.equal(s.kalici, false);
  assert.deepEqual(s.adresler, ["info@yavas.co.ke"]);
});

await t("outlook otomatik yanit (konu)", async () => {
  const s = await sinifla(`From: Juan Perez <juan@firma.com>
Subject: Automatic reply: Roll forming lines for PYMA
Content-Type: text/plain

I am out of the office until October 1st with limited access to email.
`);
  assert.equal(s.tur, "otomatik");
});

await t("gmail tatil yaniti (Auto-Submitted)", async () => {
  const s = await sinifla(`From: ventas@firma.com
Subject: Re: Líneas de perfilado
Auto-Submitted: auto-replied
Content-Type: text/plain

Gracias por su mensaje. Estaré de vacaciones hasta el lunes.
`);
  assert.equal(s.tur, "otomatik");
  assert.match(s.sebep, /auto-replied/);
});

await t("List-Unsubscribe mailto: konu 'unsubscribe'", async () => {
  const s = await sinifla(`From: info@firma.com
To: marketing@servosteel.com.tr
Subject: unsubscribe
Content-Type: text/plain

`);
  assert.equal(s.tur, "abonelik");
});

await t("ispanyolca 'dar de baja' govdede", async () => {
  const s = await sinifla(`From: compras@firma.com.pe
Subject: RE: Líneas de corte longitudinal
Content-Type: text/plain

Por favor dar de baja este correo, no nos interesa.
`);
  assert.equal(s.tur, "abonelik");
});

await t("gercek yanit, altbilgimiz outlook alintisinda", async () => {
  const s = await sinifla(`From: Juan <ventas@pyma.com.mx>
Subject: RE: Roll forming lines
In-Reply-To: <abc123@servosteel.com.tr>
Content-Type: text/plain; charset=utf-8

Hello Elizaveta, please send us the quotation for a cable tray line 100-600 mm.
Regards, Juan

From: Servosteel Export <marketing@servosteel.com.tr>
Sent: Monday, September 22, 2026 10:00 AM
To: ventas@pyma.com.mx
Subject: Roll forming lines

Dear PYMA team,
--
¿Prefiere no recibir más correos nuestros? Darse de baja: https://servosteel.com.tr/api/unsubscribe?t=abc
`);
  assert.equal(s.tur, "yanit");
  assert.match(s.ozet, /^Hello Elizaveta, please send us the quotation/);
  assert.doesNotMatch(s.ozet, /baja|From:/);
});

await t("gercek yanit, gmail > alintisi", async () => {
  const s = await sinifla(`From: compras@acero.cl
Subject: Re: Centro de servicio de acero
Content-Type: text/plain; charset=utf-8

Gracias, nos interesa. ¿Cuál es el precio de la línea de corte?

El lun, 22 sept 2026 a las 10:00, Servosteel Export (<yasin@servosteel.com.tr>) escribió:
> Estimado equipo,
> ¿Prefiere no recibir más correos nuestros? Darse de baja: https://servosteel.com.tr/api/unsubscribe?t=x
`);
  assert.equal(s.tur, "yanit");
  assert.equal(s.ozet, "Gracias, nos interesa. ¿Cuál es el precio de la línea de corte?");
});

await t("insan gonderen 'postmaster' degilse geri donus sayilmaz", async () => {
  const s = await sinifla(`From: Ali <ali@firma.com>
Subject: Re: delivery failed?
Content-Type: text/plain

Your previous email said delivery failed, can you resend the catalogue?
`);
  assert.equal(s.tur, "yanit");
});

/* 26 Eylül, MATRO: Office 365 reddi (550 5.7.133) gövdesinde gönderdiğimiz
   iletinin başlıklarını alıntılıyor; "Exim 4.99.5" sürümü 4.x.x geçici kod
   sanıldı ve kalıcı ret "geçici" kaydedildi. */
const O365_RED = `From: postmaster@matro.com.mx
To: ege@servosteel.com.tr
Subject: Undeliverable: Alimentadores servo para sus prensas — Servosteel, Estambul
Content-Type: text/plain; charset=utf-8

Your message to infomatro@matro.com.mx couldn't be delivered.
The group infomatro only accepts messages from people in its organization or on its allowed senders list.

More Info for Email Admins
Status code: 550 5.7.133

Original Message Details
Created Date:   9/25/2026 10:31:30 PM
Sender Address: ege@servosteel.com.tr
Recipient Address:      infomatro@matro.com.mx

Original Message Headers

Received: from hera.veridyen.com (45.151.248.76) by BN1PEPF0000468E.mail.protection.outlook.com
Received: from [78.142.209.185] (port=41822 helo=servosteel.com.tr)
 by hera.veridyen.com with esmtpsa (TLS1.3) tls TLS_AES_256_GCM_SHA384
 (Exim 4.99.5) (envelope-from <ege@servosteel.com.tr>)
 id 1wx9A2-00000001aB7-3kQx for infomatro@matro.com.mx;
`;

await t("office 365 reddi: alintilanan basliktaki Exim surumu kalici hatayi gecici yapmaz", async () => {
  const s = await sinifla(O365_RED);
  assert.equal(s.tur, "geri_donus");
  assert.equal(s.kalici, true);
  assert.ok(s.adresler.includes("infomatro@matro.com.mx"));
});

await t("gercek gecici hata alintili baslikla da gecici kalir", async () => {
  const s = await sinifla(`From: Mail Delivery System <Mailer-Daemon@hera.veridyen.com>
To: ege@servosteel.com.tr
Subject: Mail delivery failed: returning message to sender
X-Failed-Recipients: info@yavas.example

This message was created automatically by mail delivery software.
A message that you sent has not yet been delivered to one or more of its recipients after more than 24 hours on the queue.
  info@yavas.example
    451 4.7.1 Greylisted, please try again later

------ This is a copy of the message, including all the headers. ------
Received: from [78.142.209.185] by hera.veridyen.com with esmtpsa (Exim 4.99.5)
`);
  assert.equal(s.tur, "geri_donus");
  assert.equal(s.kalici, false);
});

await t("ileti kimlikleri", async () => {
  assert.deepEqual(K.mesajKimlikleri("<ABC@servosteel.com.tr>", "<x@y> <abc@servosteel.com.tr>", undefined),
    ["abc@servosteel.com.tr", "x@y"]);
  assert.deepEqual(K.mesajKimlikleri(["<a@b>", "<c@d>"]), ["a@b", "c@d"]);
  assert.equal(K.kimlikSade("<Q1@Host>"), "q1@host");
});

console.log(`${n} test gecti`);

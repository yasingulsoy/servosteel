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

await t("basliksiz sistem cevabi govdesinden otomatik (Giffin, 27 Eylul)", async () => {
  const s = await sinifla(`From: "Connect G - Home of Traffic" <connect@giffin.ae>
To: Servosteel Export <ege@servosteel.com.tr>
Subject: RE: Guardrail roll forming lines - Servosteel, Istanbul
Content-Type: text/plain; charset=utf-8

Connect - Procurement
Thank you for introducing your company

Dear Sir / Madam,
Thank you for reaching out and for introducing your company's services to our group.
Please note that your email has also been forwarded to the above addresses for their visibility.

Kind regards,

This is an automated acknowledgement. Please do not reply directly to this email.

________________________________
From: Servosteel Export <ege@servosteel.com.tr>
Sent: Sunday, 27 September 2026 11:15:03
Subject: RE: Guardrail roll forming lines - Servosteel, Istanbul

Dear Procurement Team,
`);
  assert.equal(s.tur, "otomatik");
  assert.match(s.sebep, /automated acknowledgement/i);
});

await t("gomulu gorsel izi yanit ozetine girmez", async () => {
  const s = await sinifla(`From: Ali <ali@firma.example>
To: ege@servosteel.com.tr
Subject: RE: Rack upright and beam lines - Servosteel, Istanbul
Content-Type: text/plain; charset=utf-8

[data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd+UAAADTUlEQVR42r2WTWhcVRTHf+feN+/NvFjTQLTQQC26qLhp3ejCLoLSVfGrJYIbBSFddiUKXTgku7oquHMWgm4kgtCA+xC6sLiwwQ9srYhCmxET2+TZefM+7j0uZpImZJLMNIkH3ubPffd37j3n/u8VJmYsX73lahfmzompfoC6U6gLAWFvoYjNEXtDffvj9NPxr5mYsQIQT859JNGhKXUFuJx9DRsitoJmSb3VGJ+W2uS110xUu6p5y6MeRMy+AlU9YpAwNj5LXzeIr6sr9UBg0JlTPepKRXw9EDiJywSRLTUzAkYEBZzXvUFdhsDJALC9x0Ar9/jcg4G4FuxLRXvOYgTywvPC04/z/LHHuN8qufr90r7scE+gNULedrz94pNcPDPGatsxe2MJr2AFtNP0aHcnRARU6WfXewJLr4S1gM+uLfLtb6ustktUOwezcIoqGCNUrNAuPEXpsFaoVSxedXCgKgRWuNVM+bWZbjjJcDgOCIzQLj3L93PGRqs8NVrlnwcFv9xtEUd2cGBghSQpuPTGcT48e4ybzRavXF4gSUu+mHyWl58b4fI3f7KcFDTeOwFAWngac4u8/+Vtwophu4Wa7c8rVCuWQ1XLcC0AAfVKHFlG4oB3XjpC/c3jfD6/yM93W9Qqhotnxjh7apRW6rBGBgMCOO3Uq3AP0y27NXzmiRrnPvmJd6/8yKtXfmApKfCqjJ8YRp1ua8Q7AmW9Cx9qXhURmL+1wne3Vxg5GvP7321uNlsYEWrhzjV8ZCtbTR0igvedBMo+ncg8ulux3hiDmN6uQO1T6xe8ew3ZXEORrdomfS9Ap51botzQpc7r+rdprOvquyxT4gvz2mtlXpWRoQojQwFFqdy5l+FVOTIcMRQZHmSev1ZyjIBXOHo4pBoaVlPHUpKvX2v9WRsdQ176t6DZnTQMDCLCnXsZziu266VrBv7HciehjXrf1rYWFSuE3Z/XOjIMBGGzBhBVeusDAVW3dl4vbSe9V9M4/r9wRmEBGymq/sAwqh4bqcKCQc2U2EAQw4FA156JNhDUTJm0cXpWs6QuYWwIov1/JgaRkTA2miX1tHF61jAxY1uN8WmfJ+dRriM2G9Aed3rqZyjXfZ6cbzXGp5mYsf8BXCqQ8wAeqgYAAAAASUVORK5CYII=]
Hello, please send us an offer for the line.
`);
  assert.equal(s.tur, "yanit");
  assert.equal(s.ozet, "Hello, please send us an offer for the line.");
});

await t("otomatik kelimesi gecen gercek yanit yanit kalir", async () => {
  const s = await sinifla(`From: Ahmed <ahmed@firma.example>
To: ege@servosteel.com.tr
Subject: RE: Rack upright and beam lines - Servosteel, Istanbul
Content-Type: text/plain; charset=utf-8

Hello, our current line is fully automated but too slow. Please send an offer for 20 m/min.
This is an automated line with PLC, we need the same.

Regards, Ahmed

> This is an automated message from Servosteel
`);
  assert.equal(s.tur, "yanit");
});

/* Arapca (28 Eylul): Arapca kesif turunun firmalarina e-posta Arapca gidiyor */
const b64 = (s) => `=?UTF-8?B?${Buffer.from(s).toString("base64")}?=`;

await t("arapca abonelik iptali", async () => {
  const s = await sinifla(`From: Mohamed <m@masnaa.example>
To: marketing@servosteel.com.tr
Subject: ${b64("رد: خطوط الرفوف")}
Content-Type: text/plain; charset=utf-8

من فضلكم إلغاء الاشتراك، لا ترسلوا لنا رسائل أخرى.
`);
  assert.equal(s.tur, "abonelik");
});

await t("arapca otomatik yanit konusu", async () => {
  const s = await sinifla(`From: Info <info@masnaa.example>
To: marketing@servosteel.com.tr
Subject: ${b64("رد تلقائي: خطوط الرفوف")}
Content-Type: text/plain; charset=utf-8

شكرا لرسالتكم، سنرد عليكم في أقرب وقت.
`);
  assert.equal(s.tur, "otomatik");
});

await t("arapca yanit: alinti basligindan sonrasi (altbilgimiz) sayilmaz", async () => {
  const s = await sinifla(`From: Ahmed <ahmed@masnaa.example>
To: marketing@servosteel.com.tr
Subject: ${b64("رد: خطوط مقاطع C وSigma وOmega")}
Content-Type: text/plain; charset=utf-8

السلام عليكم، نحن مهتمون بخط مقاطع C بسماكة 2 مم. أرسلوا لنا عرض سعر من فضلكم.

في الخميس، ٢٥ سبتمبر ٢٠٢٦، Servosteel <marketing@servosteel.com.tr> كتب:
إلى فريق المصنع المحترم،
لا ترغبون في تلقي رسائلنا مرة أخرى؟ إلغاء الاشتراك
`);
  assert.equal(s.tur, "yanit");
  assert.ok(!K.yeniMetin("سطر\nفي الخميس، ٢٥ سبتمبر ٢٠٢٦، X كتب:\nإلغاء الاشتراك").includes("إلغاء"));
});

await t("ileti kimlikleri", async () => {
  assert.deepEqual(K.mesajKimlikleri("<ABC@servosteel.com.tr>", "<x@y> <abc@servosteel.com.tr>", undefined),
    ["abc@servosteel.com.tr", "x@y"]);
  assert.deepEqual(K.mesajKimlikleri(["<a@b>", "<c@d>"]), ["a@b", "c@d"]);
  assert.equal(K.kimlikSade("<Q1@Host>"), "q1@host");
});

console.log(`${n} test gecti`);

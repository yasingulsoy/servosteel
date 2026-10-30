/**
 * CRM kullanıcısı açar. Parola komut satırına YAZILMAZ (geçmişte kalırdı);
 * gizli girişle iki kez sorulur.
 *
 *   node scripts/kullanici-ekle.mjs <kullanici> <rol> ["Ad Soyad"]
 *
 * Rol: yonetici | satis | pazarlama | goruntuleyici
 * İlk yönetici bu betikle açılır; sonrakiler CRM'deki Kullanıcılar sayfasından.
 */
import { randomBytes, scrypt } from "node:crypto";
import readline from "node:readline";
import { baglan } from "./ortam.mjs";

const ROLLER = ["yonetici", "satis", "pazarlama", "goruntuleyici"];
const [kullanici, rol, ad = ""] = process.argv.slice(2);

if (!kullanici || !ROLLER.includes(rol)) {
  console.error(`Kullanım: node scripts/kullanici-ekle.mjs <kullanici> <${ROLLER.join("|")}> ["Ad Soyad"]`);
  process.exit(1);
}
if (!/^[a-z0-9._-]{3,40}$/.test(kullanici)) {
  console.error("Kullanıcı adı 3-40 karakter: küçük harf, rakam, nokta, tire, alt çizgi.");
  process.exit(1);
}

function gizliSor(soru) {
  return new Promise((coz) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      if (s.includes(soru)) rl.output.write(s);
    };
    rl.question(soru, (cevap) => {
      rl.close();
      process.stdout.write("\n");
      coz(cevap);
    });
  });
}

const parola = await gizliSor("Parola (en az 10 karakter): ");
if (parola.length < 10) {
  console.error("Parola en az 10 karakter olmalı.");
  process.exit(1);
}
if ((await gizliSor("Parola (tekrar): ")) !== parola) {
  console.error("Parolalar aynı değil.");
  process.exit(1);
}

const tuz = randomBytes(16);
const karma = await new Promise((coz, red) =>
  scrypt(parola, tuz, 64, (e, k) => (e ? red(e) : coz(`scrypt:${tuz.toString("hex")}:${k.toString("hex")}`)))
);

const db = await baglan();
try {
  const { rows } = await db.query(
    `INSERT INTO crm_kullanici (kullanici, ad, rol, karma) VALUES ($1, $2, $3, $4)
     ON CONFLICT (kullanici) DO NOTHING RETURNING id`,
    [kullanici, ad, rol, karma]
  );
  if (rows.length === 0) {
    console.error(`"${kullanici}" zaten var; parolasını CRM'deki Kullanıcılar sayfasından değiştirin.`);
    process.exitCode = 1;
  } else {
    await db.query(
      `INSERT INTO crm_kayit (kullanici, olay, hedef, ayrinti) VALUES ('betik', 'kullanici_ekle', $1, $2)`,
      [kullanici, `rol: ${rol}`]
    );
    console.log(`Kullanıcı açıldı: ${kullanici} (${rol}).`);
  }
} finally {
  await db.end();
}

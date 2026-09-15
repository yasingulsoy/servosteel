/**
 * Yönetim paneli parolası için karma üretir.
 *
 *   node scripts/admin-parola.mjs "parolanız"
 *
 * Çıkan satırı `.env.local` içine yapıştırın. Parolanın kendisi hiçbir yere
 * yazılmaz; panel yalnızca bu karmayı saklar ve girişte karşılaştırır.
 *
 * Aynı parola için her çalıştırmada FARKLI karma çıkar — tuz rastgeledir.
 * Bu normaldir, ikisi de doğrular.
 */
import { randomBytes, scrypt } from "node:crypto";

const parola = process.argv[2];

if (!parola) {
  console.error("Kullanım: node scripts/admin-parola.mjs \"parolanız\"");
  process.exit(1);
}
if (parola.length < 10) {
  console.error("Parola en az 10 karakter olmalı. Panel canlı sitede duruyor.");
  process.exit(1);
}

const tuz = randomBytes(16);
scrypt(parola, tuz, 64, (e, k) => {
  if (e) throw e;
  const oturumGizli = randomBytes(48).toString("base64url");
  console.log("\n.env.local içine ekleyin:\n");
  console.log(`ADMIN_USER=yasin`);
  console.log(`ADMIN_PASSWORD_HASH=scrypt$${tuz.toString("hex")}$${k.toString("hex")}`);
  console.log(`ADMIN_SESSION_SECRET=${oturumGizli}`);
  console.log("\nKullanıcı adını istediğinizle değiştirin. Parolayı hiçbir yere yazmayın.\n");
});

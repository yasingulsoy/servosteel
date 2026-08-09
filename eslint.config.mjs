import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    /* Belge üreticileri uygulamanın parçası değil: `node belgeler/*.js` ile
       elle çalıştırılan CommonJS script'ler. Uygulamanın ESM/TS kuralları
       burada geçerli değil — require() onlar için doğru olan. */
    "belgeler/**",
  ]),
]);

export default eslintConfig;

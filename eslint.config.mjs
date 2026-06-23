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
  ]),
  {
    rules: {
      // Higiena encji HTML w tekście JSX — to nie bug (React renderuje " poprawnie),
      // a escapowanie pogarsza czytelność polskich cytatów. Trzymamy jako ostrzeżenie.
      "react/no-unescaped-entities": "warn",
      // Reguła z pakietu React Compiler readiness — flaguje poprawne wzorce:
      // hydracja ze storage na mount (musi być w efekcie, nie w renderze SSR) oraz
      // reset stanu po zmianie trasy. Bezpieczne w React bez kompilatora → ostrzeżenie.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;

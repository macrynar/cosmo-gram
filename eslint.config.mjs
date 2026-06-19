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
      // Polish UI copy uses literal typographic quotes (" „ ”) in JSX text.
      // React renders these correctly; escaping is a readability preference,
      // not a correctness issue, so we don't enforce it.
      "react/no-unescaped-entities": "off",
      // Several components legitimately initialize state from an external
      // source (localStorage, matchMedia, fetch) on mount via setState in an
      // effect. The rule flags a perf hint, not a bug. Keep it as a warning so
      // it stays visible without failing CI; refactoring these would change
      // product behaviour and is out of scope here.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;

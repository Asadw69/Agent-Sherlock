import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow an explicit `_`-prefix to mark a parameter as intentionally
      // unused (e.g. kept for call-site clarity or a fixed function
      // signature) without silencing genuinely unused variables/imports.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Uploaded repositories contain arbitrary third-party source that
    // must never be linted as part of this app's own codebase.
    "uploads/**",
  ]),
]);

export default eslintConfig;

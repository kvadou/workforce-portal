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
    // Project-specific ignores:
    "scripts/**",
    "prisma/**",
    ".worktrees/**",
    ".playwright-mcp/**",
  ]),
  // Custom rule overrides
  {
    rules: {
      // These rules are too strict for common patterns like form initialization
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      // Allow unused vars prefixed with _ (common pattern for destructuring)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Downgrade to warnings - these are style issues, not bugs
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow dynamic component patterns like const Icon = getIcon(type); <Icon />
      "react-hooks/static-components": "warn",
    },
  },
]);

export default eslintConfig;

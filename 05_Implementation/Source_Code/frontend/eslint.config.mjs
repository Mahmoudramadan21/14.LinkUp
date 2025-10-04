/**
 * ESLint configuration for the LinkUp application using Flat Config.
 */

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initializes ESLint compatibility for legacy configurations.
 */
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * ESLint configuration array.
 * @type {Array}
 */
const eslintConfig = [
  /**
   * Extends Next.js core web vitals and TypeScript configurations.
   */
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  /**
   * Custom rules for TypeScript files.
   */
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      /**
       * Warns when 'any' type is used explicitly to encourage better type safety.
       */
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript")];

export default async function config() {
  const [{ default: tsParser }, { default: tsPlugin }] = await Promise.all([
    import("@typescript-eslint/parser"),
    import("@typescript-eslint/eslint-plugin"),
  ]);

  return [
    ...eslintConfig,
    {
      plugins: {
        "@typescript-eslint": tsPlugin,
      },
      languageOptions: {
        parser: tsParser,
      },
      rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
          },
        ],
      },
    },
  ];
}

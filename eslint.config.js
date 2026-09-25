import globals from "globals";

export default [
  {
    files: ["api/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: { ...globals.node } },
    rules: { "no-undef": "error", "no-unused-vars": "error" },
  },
  {
    files: ["*.js"],
    ignores: ["eslint.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": "off",
      eqeqeq: "warn",
      curly: ["warn", "all"],
    },
  },
];

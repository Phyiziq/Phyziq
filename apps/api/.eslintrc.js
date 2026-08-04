/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // ── Health DB isolation boundary ────────────────────────────────────
    //
    // The health DB pool (health-db.ts) must ONLY be imported from within
    // the consent module. Any other module importing it would bypass the
    // HealthDataRepository audit layer and violate Requirements 1.7, 11.2.
    //
    // Allowed: apps/api/src/modules/consent/**
    // Blocked: everywhere else
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/modules/consent/health-db*'],
            message:
              'Do not import the health DB pool directly. ' +
              'Use HealthDataRepository from @/modules/consent instead. ' +
              'Direct access bypasses the audit log (Requirement 11.6).',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // Within the consent module itself, allow health-db imports
      files: ['src/modules/consent/**/*.ts'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      // Relax some rules for test files
      files: ['src/**/*.test.ts', 'src/**/*.property.test.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};

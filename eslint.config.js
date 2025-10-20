// eslint.config.js (ESLint v9+ flat config)
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'docs/architecture/**',
      'tools/**',
      'site/**',
    ],
  },

  // Base recommended sets
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  // Your project rules
  {
    files: ['**/*.js', '**/*.mjs', '**/*.ts'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];

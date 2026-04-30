import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
        project: ['./tsconfig.json'],
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off', // Temporarily turn off to fix existing code
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/return-await': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-vars': 'warn',
      'react/jsx-uses-react': 'warn',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'warn',
      'react/jsx-no-duplicate-props': 'warn',
      'react/jsx-key': 'warn',
      'react/jsx-no-target-blank': 'warn',
      'react/no-unknown-property': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-no-duplicate-props': 'warn',
      'react/jsx-no-undef': 'error',
      'react/display-name': 'off',
    },
  },
  {
    files: ['e2e/**/*.{ts,tsx}', '*.config.ts', 'vitest.config.ts', 'playwright.config.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
])
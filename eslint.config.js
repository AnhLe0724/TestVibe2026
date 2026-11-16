import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Luật phụ thuộc 4 tầng (mục 3.1): domain -> data -> services -> ui
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-*', '*/data/*', '*/services/*', '*/ui/*', '**/data/**', '**/services/**', '**/ui/**'], message: 'Tầng domain là TS thuần: cấm import React hoặc tầng khác.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Cấm dùng window trong domain.' },
        { name: 'document', message: 'Cấm dùng document trong domain.' },
        { name: 'localStorage', message: 'Cấm dùng localStorage trong domain.' },
      ],
    },
  },
  {
    files: ['src/data/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-*', '*/services/*', '*/ui/*', '**/services/**', '**/ui/**'], message: 'Tầng data chỉ được import domain.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-*', '*/ui/*', '**/ui/**'], message: 'Tầng services chỉ được import domain và data.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['*/data/*', '**/data/**'], message: 'Tầng ui cấm import data trực tiếp, phải đi qua services.' },
          ],
        },
      ],
    },
  },
);

import js from '@eslint/js';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import vue from 'eslint-plugin-vue';

import { architectureRule } from './scripts/eslintArchitecture.mjs';

export default defineConfigWithVueTs(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'src/generated/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  vue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    files: ['**/*.{ts,vue,mjs}'],
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': [
        'error',
        { groups: [['^node:', '^@?\\w'], ['^@/'], ['^\\.']] },
      ],
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'vue/no-v-html': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression:not([typeAnnotation.typeName.name="const"])',
          message: '使用Schema或类型守卫校验，不用类型断言。',
        },
        { selector: 'TSTypeAssertion', message: '使用Schema或类型守卫校验。' },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    plugins: { architecture: { rules: { boundaries: architectureRule } } },
    rules: { 'architecture/boundaries': 'error' },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
    },
  },
);

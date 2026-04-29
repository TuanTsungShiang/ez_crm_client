import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import ts from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.vite/**', '*.config.js', '*.config.ts'],
  },

  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],
  prettierConfig,

  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'error',

      // House rule: forbid static inline style. Dynamic :style="{}" bindings
      // are allowed (different AST node). See discussion in 2026-04-28 work_log
      // about Linky360's 3,554 inline-style debt — this is the structural
      // guard that prevents that here.
      'vue/no-restricted-syntax': [
        'error',
        {
          selector: "VAttribute[key.name='style']",
          message: '禁止 inline style,請用 Tailwind class 或 scoped CSS。動態值請用 :style="{}"。',
        },
      ],

      // TS strict reinforcement
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',

      // Vue 3 conventions
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/no-v-html': 'warn',
      'vue/multi-word-component-names': 'off', // Existing single-word views (HomeView, MeView)
    },
  },
]

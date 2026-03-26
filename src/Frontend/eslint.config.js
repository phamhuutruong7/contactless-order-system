import pluginVue from 'eslint-plugin-vue'
import vueTsConfig from '@vue/eslint-config-typescript'

export default [
  // ── Ignores ─────────────────────────────────────────────────────────────────
  {
    ignores: ['dist/**', 'coverage/**', '*.d.ts'],
  },

  // ── Vue + TypeScript files ───────────────────────────────────────────────────
  ...pluginVue.configs['flat/strongly-recommended'],
  ...vueTsConfig(),

  {
    files: ['**/*.{ts,vue}'],
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // Vue
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits'] }],
      'vue/no-unused-vars': 'error',

      // General
      'no-console': 'warn',
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
]

// @ts-check
import eslint from '@eslint/js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended, // cấu hình eslint cơ bản
  ...tseslint.configs.recommendedTypeChecked, // cáu hình eslint cho typescript có type-checking
  eslintPluginPrettierRecommended, // tích hợp prettier vào eslint
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'prettier/prettier': ['off', { endOfLine: 'auto' }],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // có những rule dùng dạng JS là được, ko cần chuyển qua dạng TS vì ko liên quan đến type
      'no-console': 'warn',
      'no-lonely-if': 'warn',
      'no-unexpected-multiline': 'warn',
    },
  },
)

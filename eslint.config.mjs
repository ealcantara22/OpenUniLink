import pluginJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
//import jest from 'eslint-plugin-jest';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    jsx: false,
    commaDangle: 'always-multiline',
    quoteProps: 'as-needed',
    braceStyle: '1tbs',
  }),
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  // jest.configs['flat/recommended'],
  // jest.configs['flat/style'],

  {
    ignores: [
      '**/.eslintrc.js',
      '**/package.json',
      '**/package-lock.json',
      '**/*.md',
      '**/*.yaml',
      '**/*.yml',
      '**/tsconfig.json',
    ],
  },
  {
    languageOptions: {
      globals: {
        ...globals.es2020,
        ...globals.node,
        // ...globals.jest,
      },

      parser: tsParser,
      ecmaVersion: 12,
      sourceType: 'module',

      parserOptions: {
        project: 'tsconfig.json',
        extraFileExtensions: ['.json', '.yml', '.yaml'],
      },
    },

    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],

      // 'jest/no-disabled-tests': 'warn',
      // 'jest/no-focused-tests': 'error',
      // 'jest/no-identical-title': 'error',
      // 'jest/prefer-to-have-length': 'warn',
      // 'jest/valid-expect': 'error',
      // 'jest/valid-title': 'off',
      // 'jest/no-conditional-expect': 'off',
      // 'jest/no-export': 'off',
      // 'jest/no-mocks-import': 'off',

      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-absolute-path': 'error',
      'import/no-amd': 'error',
      'import/no-unresolved': 'off',
      'import/order': [
        'error',
        {
          named: true,
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          groups: [
            ['builtin', 'external'],
            'parent',
            ['sibling', 'index'],
            'object',
          ],
        },
      ],

      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/max-len': [
        'error',
        110,
        {
          ignoreUrls: true,
          ignoreComments: true,
          ignoreRegExpLiterals: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],

      complexity: ['error', 16],
      'newline-after-var': ['error', 'always'],
    },
  },
];

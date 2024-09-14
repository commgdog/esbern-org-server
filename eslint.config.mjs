import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import typescript from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  stylistic.configs.customize({
    semi: true,
  }),
  ...typescript.configs.recommended,
  {
    rules: {
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs'],
    },
  },
];

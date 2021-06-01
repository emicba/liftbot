module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ['airbnb-base'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['prettier', '@typescript-eslint'],
  rules: {
    'import/extensions': 0,
    'import/no-unresolved': 0,
    'no-console': 0,
    'no-underscore-dangle': 0,
    'no-shadow': 0,
    '@typescript-eslint/no-shadow': ['error'],
    'no-unused-vars': 0,
    '@typescript-eslint/no-unused-vars': ['error'],
    'prettier/prettier': 'error',
  },
};

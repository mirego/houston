module.exports = {
  root: true,
  extends: ['prettier'],
  plugins: ['unused-imports', 'import'],
  rules: {
    'import/order': 2,
    'unused-imports/no-unused-imports': 2,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            caughtErrorsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
          },
        ],
      },
    },
  ],
};

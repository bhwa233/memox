import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      camelcase: 'off',
      'import/prefer-default-export': 'off',
      'import/extensions': ['warn', 'ignorePackages', {
        ts: 'never', tsx: 'never', js: 'never', jsx: 'never',
      }],
      'react/jsx-filename-extension': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/no-unused-prop-types': 'off',
      'react/require-default-props': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
  {
    files: ['*.config.{ts,mts,mjs}'],
    // These files execute in Node, where ESM JavaScript imports need extensions.
    rules: {
      'import/extensions': ['warn', 'ignorePackages', {
        js: 'always', mjs: 'always', ts: 'never',
      }],
    },
  },
  globalIgnores([
    '.next/**', '.open-next/**', '.wrangler/**', 'out/**', 'build/**',
    'coverage/**', 'next-env.d.ts', 'cloudflare-env.d.ts',
    'public/sw.js', 'public/sw.js.map', 'public/swe-worker*',
  ]),
]);

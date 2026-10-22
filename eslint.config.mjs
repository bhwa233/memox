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
      // React Compiler is not enabled in this app. Surface its new diagnostics
      // during the config migration without turning them into a refactor gate.
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
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
  globalIgnores([
    '.next/**', '.open-next/**', '.wrangler/**', 'out/**', 'build/**',
    'coverage/**', 'next-env.d.ts', 'cloudflare-env.d.ts',
    'public/sw.js', 'public/sw.js.map', 'public/swe-worker*',
  ]),
]);

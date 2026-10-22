# Repository checks

- Reuse existing UI in `src/components/ui`, stores in `src/store`, and installed
  packages in `package.json` before adding dependencies or shared helpers.
- Run `pnpm exec tsc --noEmit` for type checking.
- Run `pnpm cf:next-build` to check the production Webpack build and generated
  Service Worker. The default Next.js Turbopack build does not generate this SW.
- Run `pnpm lint` for repository-wide ESLint checks. Configuration lives in
  `eslint.config.mjs`; generated Next.js, OpenNext, and Service Worker files are
  excluded. Use the installed Next.js flat presets without a legacy adapter.
- Jest is configured in `jest.config.ts` with jsdom and no extra setup files.
  There is no script that enumerates test files. Add tests for meaningful logic
  or regressions; do not test configuration text or duplicate library behavior.
- Validate navigation caching in a real browser with the production SW,
  including slow responses with and without a cached page and auth redirects.

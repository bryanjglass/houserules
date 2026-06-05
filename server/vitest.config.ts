import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// The server uses NodeNext module resolution with explicit `.js` import
// specifiers that actually point at `.ts` sources (e.g. `import './tz.js'`).
// Vite (under Vitest) doesn't rewrite `.js` -> `.ts`, so map a relative `*.js`
// import to its `*.ts` sibling when one exists. Runtime (tsx/NodeNext) is
// unaffected — this only runs during tests.
const jsToTsResolver = {
  name: 'js-to-ts-resolver',
  enforce: 'pre' as const,
  resolveId(source: string, importer: string | undefined) {
    if (importer && /^\.\.?\//.test(source) && source.endsWith('.js')) {
      const tsPath = resolve(dirname(importer), source.replace(/\.js$/, '.ts'));
      if (existsSync(tsPath)) return tsPath;
    }
    return null;
  },
};

export default defineConfig({
  plugins: [jsToTsResolver],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

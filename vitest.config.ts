import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    // Tests run against workspace sources so `tsc -b` is not a prerequisite.
    alias: {
      '@livingdoc/core': src('./packages/core/src/index.ts'),
      '@livingdoc/adapter-vitest': src(
        './packages/adapters/vitest/src/index.ts',
      ),
      '@livingdoc/cli': src('./packages/cli/src/index.ts'),
    },
  },
  test: {
    include: ['packages/**/test/**/*.test.ts', 'tests/**/*.test.ts'],
  },
})

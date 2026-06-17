import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { defineConfig } from 'vitest/config';

// Pin the project root to THIS config's directory and scope `include` to the
// package's own tests/src. The monorepo gate (scripts/adapters-build.cjs) runs
// vitest with cwd = repo root; without this, vitest 4's default recursive
// `**/*.test.ts` collection scans the whole tree — including registered agent
// worktrees under .claude/worktrees/** — running stale duplicate copies. For
// this package those duplicates bind the same HTTP ports concurrently and flake.
const ROOT = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: ROOT,
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});

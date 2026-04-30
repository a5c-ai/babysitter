import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, '..', '..', '..');
const localReact = path.resolve(repoRoot, 'node_modules/react');
const localReactDom = path.resolve(repoRoot, 'node_modules/react-dom');
const testingLibraryReact = path.resolve(
  repoRoot,
  'node_modules/@testing-library/react/dist/@testing-library/react.esm.js',
);
const testingLibraryDom = path.resolve(
  repoRoot,
  'node_modules/@testing-library/dom/dist/@testing-library/dom.esm.js',
);
const reactNativeShim = path.resolve(repoRoot, 'test-shims/react-native.ts');

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        pretendToBeVisual: true,
      },
    },
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    server: {
      deps: {
        inline: [
          '@testing-library/react',
          '@testing-library/jest-dom',
          '@testing-library/user-event',
          '@testing-library/dom',
        ],
      },
    },
  },
  resolve: {
    alias: {
      '@a5c-ai/agent-catalog': path.resolve(rootDir, '..', '..', 'agent-catalog', 'src', 'index.ts'),
      '@a5c-ai/agent-mux-core/automation': path.resolve(rootDir, '..', 'core', 'src', 'automation.ts'),
      '@a5c-ai/agent-mux-core/kanban': path.resolve(rootDir, '..', 'core', 'src', 'kanban.ts'),
      '@a5c-ai/agent-mux-core/browser': path.resolve(rootDir, '..', 'core', 'src', 'browser.ts'),
      '@a5c-ai/agent-mux-core': path.resolve(rootDir, '..', 'core', 'src', 'index.ts'),
      '@a5c-ai/agent-mux-ui/gateway': path.resolve(rootDir, '..', 'ui', 'src', 'gateway.ts'),
      '@a5c-ai/agent-mux-ui/session-flow': path.resolve(rootDir, '..', 'ui', 'src', 'session-flow.ts'),
      '@a5c-ai/agent-mux-ui': path.resolve(rootDir, '..', 'ui', 'src', 'index.ts'),
      '@testing-library/react': testingLibraryReact,
      '@testing-library/dom': testingLibraryDom,
      '@': path.resolve(rootDir, 'src'),
      'react': localReact,
      'react/jsx-runtime': path.join(localReact, 'jsx-runtime'),
      'react/jsx-dev-runtime': path.join(localReact, 'jsx-dev-runtime'),
      'react-dom': localReactDom,
      'react-dom/client': path.join(localReactDom, 'client'),
      'react-dom/test-utils': path.join(localReactDom, 'test-utils'),
      'react-native': reactNativeShim,
      'react-native$': reactNativeShim,
    },
  },
});

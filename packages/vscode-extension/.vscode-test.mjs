import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'dist/test/e2e/suite/**/*.test.js',
  version: 'stable',
  workspaceFolder: '.vscode-test-workspace',
  launchArgs: [
    '--disable-extensions',
    '--disable-workspace-trust',
  ],
  mocha: {
    ui: 'bdd',
    color: true,
    timeout: 30000,
  },
});

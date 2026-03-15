import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const extensionBuildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: !isWatch,
  treeShaking: true,
  logLevel: 'info',
};

/** @type {import('esbuild').BuildOptions} */
const testBuildOptions = {
  entryPoints: [
    'src/test/e2e/runTest.ts',
    'src/test/e2e/suite/index.ts',
    'src/test/e2e/suite/extension.test.ts',
    'src/test/e2e/suite/tree-view.test.ts',
    'src/test/e2e/suite/commands.test.ts',
    'src/test/e2e/suite/webview.test.ts',
  ],
  bundle: true,
  outdir: 'dist',
  outbase: 'src',
  external: ['vscode', 'mocha'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: false,
  logLevel: 'info',
};

async function main() {
  if (isWatch) {
    const ctx = await esbuild.context(extensionBuildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(extensionBuildOptions);
    await esbuild.build(testBuildOptions);
    console.log('Build complete.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

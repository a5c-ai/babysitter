This directory vendors the published `webpackbar@6.0.1` artifact.

Why it exists:
- Docusaurus currently resolves `webpackbar@6.0.1`.
- That build writes to `this.options`, which collides with the Webpack plugin instance shape used in this workspace.
- Root installation previously fixed that by mutating `node_modules/webpackbar/dist/*` in `postinstall`.

What changed here:
- The vendored `dist/index.cjs` and `dist/index.mjs` rename the internal field from `options` to `webpackbarOptions`.

Update process:
1. Replace this directory with the upstream `webpackbar@6.0.1` package contents.
2. Reapply the field rename in both `dist` entrypoints.
3. Run `npm install` at the repository root to refresh `package-lock.json`.

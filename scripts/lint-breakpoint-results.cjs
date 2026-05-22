#!/usr/bin/env node
/**
 * Lint rule: breakpoint results must be read.
 *
 * Flags any `ctx.breakpoint(...)` / `await ctx.breakpoint(...)` call whose
 * return value is discarded. In babysitter processes, breakpoint results
 * carry `.approved` and `.feedback` -- ignoring them means rejections are
 * silently treated as approvals (the "rejection == approval" bug the
 * n-strikes-escalation shared component was built to prevent).
 *
 * Usage:
 *   node scripts/lint-breakpoint-results.cjs
 *   node scripts/lint-breakpoint-results.cjs --staged   # only staged files
 *
 * Exit code 1 if any violations are found.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Linter } = require('eslint');

const repoRoot = path.resolve(__dirname, '..');
const libraryRoot = path.join(repoRoot, 'library');

function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full, out);
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function staged() {
  const r = spawnSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--', 'library'],
    { cwd: repoRoot, encoding: 'utf8' }
  );
  if (r.status !== 0) return [];
  return r.stdout
    .split('\n')
    .filter((l) => l.endsWith('.js'))
    .map((l) => path.join(repoRoot, l));
}

const linter = new Linter();

linter.defineRule('breakpoint-result-must-be-read', {
  meta: {
    type: 'problem',
    docs: {
      description:
        'ctx.breakpoint() result must be read (bp.approved). Otherwise rejection is silently treated as approval.',
    },
    schema: [],
  },
  create(context) {
    function isBreakpointCall(node) {
      return (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        !node.callee.computed &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'breakpoint' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'ctx'
      );
    }
    return {
      CallExpression(node) {
        if (!isBreakpointCall(node)) return;
        // Walk up parents: if the nearest non-AwaitExpression ancestor is an
        // ExpressionStatement, the result is discarded.
        let parent = node.parent;
        while (parent && parent.type === 'AwaitExpression') parent = parent.parent;
        if (parent && parent.type === 'ExpressionStatement') {
          context.report({
            node,
            message:
              'ctx.breakpoint() result is discarded — rejection will be silently treated as approval. Read bp.approved.',
          });
        }
      },
    };
  },
});

function checkFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const messages = linter.verify(
    src,
    {
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      rules: { 'breakpoint-result-must-be-read': 'error' },
    },
    { filename: file }
  );
  return messages.map((m) => ({
    file,
    line: m.line,
    column: m.column,
    message: m.message,
  }));
}

function main() {
  const onlyStaged = process.argv.includes('--staged');
  const files = onlyStaged
    ? staged().filter((f) => f.startsWith(libraryRoot + path.sep))
    : collect(libraryRoot);

  const all = [];
  for (const f of files) all.push(...checkFile(f));

  if (all.length === 0) {
    console.log(`lint-breakpoint-results: OK (${files.length} files scanned)`);
    process.exit(0);
  }

  for (const v of all) {
    const rel = path.relative(repoRoot, v.file);
    console.error(`${rel}:${v.line}:${v.column}  ${v.message}`);
  }
  console.error(`\n${all.length} violation(s) found.`);
  process.exit(1);
}

main();

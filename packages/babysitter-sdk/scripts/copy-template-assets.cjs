'use strict';

const fs = require('fs');
const path = require('path');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

const COPY_PAIRS = [
  ['src/cli/commands/templates', 'dist/cli/commands/templates'],
  ['src/prompts/templates', 'dist/prompts/templates'],
];

for (const [sourceRelative, targetRelative] of COPY_PAIRS) {
  const sourcePath = path.join(PACKAGE_ROOT, sourceRelative);
  const targetPath = path.join(PACKAGE_ROOT, targetRelative);

  if (!fs.existsSync(sourcePath)) {
    continue;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.cpSync(sourcePath, targetPath, { recursive: true });
}

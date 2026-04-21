const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', '@a5c-ai', 'agent-mux', 'package.json');

// Fix for missing "require" export in @a5c-ai/agent-mux package.json
// The package only defines "import" exports but is used in mixed module environments
const fixExports = (packageJsonContent) => {
  const pkg = JSON.parse(packageJsonContent);

  // Check if already patched
  if (pkg.exports && pkg.exports['.'] && pkg.exports['.'].require) {
    return null; // Already patched
  }

  // Apply the fix: add "require" export alongside existing "import" export
  if (pkg.exports && pkg.exports['.'] && pkg.exports['.'].import) {
    pkg.exports['.'].require = {
      types: "./dist/index.d.ts",
      default: "./dist/index.js"
    };
    return JSON.stringify(pkg, null, 2);
  }

  throw new Error('Unexpected package.json structure in @a5c-ai/agent-mux');
};

if (!fs.existsSync(target)) {
  // Package not installed, skip patching
  process.stdout.write('agent-mux not found, skipping patch\n');
  process.exit(0);
}

const original = fs.readFileSync(target, 'utf8');
const patched = fixExports(original);

if (patched === null) {
  // Already patched
  process.stdout.write('agent-mux exports already patched\n');
  process.exit(0);
}

fs.writeFileSync(target, patched);
process.stdout.write(`patched ${path.relative(process.cwd(), target)}\n`);
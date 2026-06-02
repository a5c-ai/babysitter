#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const commands = {
  serve: 'Start HTTP API server',
  mcp: 'Start MCP server (stdio)',
  status: 'Show workspace status (org, resources, health)',
  models: 'List model catalog (internal + external)',
  routes: 'List model routes',
  'virtual-models': 'List virtual models',
  stacks: 'List agent stacks',
  dispatch: 'Dispatch an agent run (requires --stack)',
  apply: 'Apply a resource from file (--file)',
  get: 'Get a resource (--kind --name)',
  list: 'List resources (--kind)',
  delete: 'Delete a resource (--kind --name)',
  version: 'Show version',
  help: 'Show help',
};

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { flags: {}, positional: [] };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args.flags[key] = next;
        i += 2;
      } else {
        args.flags[key] = true;
        i += 1;
      }
    } else {
      args.positional.push(arg);
      i += 1;
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// YAML serializer (no external deps — minimal subset for resource output)
// ---------------------------------------------------------------------------

function toYaml(obj, indent = 0) {
  if (obj === null || obj === undefined) return 'null';
  const pad = '  '.repeat(indent);
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.startsWith(' ')) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map((item) => `\n${pad}- ${toYaml(item, indent + 1)}`).join('');
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    return entries
      .map(([k, v]) => {
        if (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0) {
          return `\n${pad}${k}:\n${pad}  ${toYaml(v, indent + 1).trimStart()}`;
        }
        if (Array.isArray(v)) {
          return `\n${pad}${k}:${toYaml(v, indent + 1)}`;
        }
        return `\n${pad}${k}: ${toYaml(v, indent + 1)}`;
      })
      .join('');
  }
  return String(obj);
}

function printYaml(obj) {
  const yaml = toYaml(obj, 0).trimStart();
  console.log(yaml);
}

// ---------------------------------------------------------------------------
// Package version
// ---------------------------------------------------------------------------

function getVersion() {
  try {
    const pkgPath = resolve(__dirname, '../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// ---------------------------------------------------------------------------
// Controller factory (lazy — only created for commands that need it)
// ---------------------------------------------------------------------------

async function getController() {
  const { createKrateApiController } = await import('../../core/src/api-controller.js');
  const { createKubernetesResourceGateway } = await import('../../core/src/kubernetes-resource-gateway.js');
  return createKrateApiController({
    resourceGateway: createKubernetesResourceGateway(),
  });
}

// ---------------------------------------------------------------------------
// Command implementations
// ---------------------------------------------------------------------------

async function cmdStatus() {
  const controller = await getController();
  const snapshot = await controller.snapshot();
  const resourceCounts = {};
  for (const [kind, items] of Object.entries(snapshot.resources || {})) {
    resourceCounts[kind] = Array.isArray(items) ? items.length : 0;
  }
  console.log('Workspace Status');
  console.log('================');
  console.log(`Namespace : ${snapshot.namespace || controller.namespace}`);
  console.log(`Resources : ${Object.keys(resourceCounts).length} kinds`);
  for (const [kind, count] of Object.entries(resourceCounts)) {
    console.log(`  ${kind}: ${count}`);
  }
  console.log('Health    : ok');
}

async function cmdStacks() {
  const controller = await getController();
  const result = await controller.listResource('AgentStack');
  const items = result.items || [];
  if (items.length === 0) {
    console.log('No agent stacks found.');
    return;
  }
  console.log(`${'NAME'.padEnd(32)} ${'ADAPTER'.padEnd(20)} PHASE`);
  for (const stack of items) {
    const name = stack.metadata?.name || '-';
    const adapter = stack.spec?.adapterRef || stack.spec?.baseAgent || '-';
    const phase = stack.status?.phase || 'Unknown';
    console.log(`${name.padEnd(32)} ${adapter.padEnd(20)} ${phase}`);
  }
}

async function cmdDispatch(flags) {
  const stackName = flags.stack;
  if (!stackName) {
    console.error('Error: --stack <name> is required');
    process.exit(1);
  }
  const controller = await getController();
  const result = await controller.dispatchAgent({ agentStack: stackName, ...flags });
  console.log('Dispatched agent run:');
  printYaml(result);
}

async function cmdApply(flags) {
  const filePath = flags.file;
  if (!filePath) {
    console.error('Error: --file <path> is required');
    process.exit(1);
  }
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error: cannot read file: ${filePath}: ${err.message}`);
    process.exit(1);
  }
  // Very lightweight YAML→JSON parser for simple resource manifests.
  // For production you'd use a full YAML parser; here we do best-effort JSON fallback.
  let resource;
  try {
    resource = JSON.parse(content);
  } catch {
    // Try to extract top-level key:value pairs into a plain object
    // (sufficient for basic resource YAML with no nested arrays)
    resource = parseSimpleYaml(content);
  }
  const controller = await getController();
  const result = await controller.applyResource(resource);
  console.log('Applied resource:');
  printYaml(result);
}

async function cmdGet(positional, flags) {
  // Supports: krate get AgentStack my-stack  OR  krate get --kind AgentStack --name my-stack
  const kind = positional[0] || flags.kind;
  const name = positional[1] || flags.name;
  if (!kind || !name) {
    console.error('Error: kind and name are required. Usage: krate get <Kind> <name>');
    process.exit(1);
  }
  const controller = await getController();
  const result = await controller.getResource(kind, name);
  const resource = result?.resource || result;
  printYaml(resource);
}

async function cmdList(positional, flags) {
  // Supports: krate list AgentStack  OR  krate list --kind AgentStack
  const kind = positional[0] || flags.kind;
  if (!kind) {
    console.error('Error: kind is required. Usage: krate list <Kind>');
    process.exit(1);
  }
  const controller = await getController();
  const result = await controller.listResource(kind);
  const items = result?.items || [];
  if (items.length === 0) {
    console.log(`No ${kind} resources found.`);
    return;
  }
  for (const item of items) {
    printYaml(item);
    console.log('---');
  }
}

async function cmdDelete(positional, flags) {
  // Supports: krate delete AgentStack my-stack  OR  krate delete --kind AgentStack --name my-stack
  const kind = positional[0] || flags.kind;
  const name = positional[1] || flags.name;
  if (!kind || !name) {
    console.error('Error: kind and name are required. Usage: krate delete <Kind> <name>');
    process.exit(1);
  }

  // Confirmation (skip if --yes flag present or non-TTY)
  if (!flags.yes && process.stdout.isTTY) {
    const confirmed = await confirm(`Delete ${kind}/${name}? [y/N] `);
    if (!confirmed) {
      console.log('Aborted.');
      return;
    }
  }

  const controller = await getController();
  const result = await controller.deleteResource(kind, name);
  console.log(`Deleted ${kind}/${name}`);
  if (result && Object.keys(result).length > 0) {
    printYaml(result);
  }
}

async function cmdModels() {
  const controller = await getController();
  try {
    const catalog = await controller.listModelCatalog('default');
    const models = catalog?.models || [];
    if (models.length === 0) {
      console.log('No models in catalog. Deploy models via the web console or create KrateModelRoute resources.');
      return;
    }
    console.log(`${'NAME'.padEnd(28)} ${'TYPE'.padEnd(10)} ${'PROVIDER'.padEnd(16)} ${'STATUS'.padEnd(12)} ENDPOINT`);
    for (const m of models) {
      console.log(`${(m.name || '-').padEnd(28)} ${(m.type || '-').padEnd(10)} ${(m.provider || '-').padEnd(16)} ${(m.status || '-').padEnd(12)} ${m.endpoint || '-'}`);
    }
  } catch (err) {
    console.error(`Error listing models: ${err.message}`);
    process.exit(1);
  }
}

async function cmdRoutes() {
  const controller = await getController();
  const result = await controller.listResource('KrateModelRoute');
  const items = result?.items || [];
  if (items.length === 0) {
    console.log('No model routes configured.');
    return;
  }
  console.log(`${'NAME'.padEnd(28)} ${'MODEL'.padEnd(24)} ${'TYPE'.padEnd(10)} ENABLED`);
  for (const route of items) {
    const name = route.metadata?.name || '-';
    const modelName = route.spec?.modelName || '-';
    const routeType = route.spec?.routeType || '-';
    const enabled = route.spec?.enabled !== false ? 'yes' : 'no';
    console.log(`${name.padEnd(28)} ${modelName.padEnd(24)} ${routeType.padEnd(10)} ${enabled}`);
  }
}

async function cmdVirtualModels() {
  const controller = await getController();
  const result = await controller.listResource('KrateVirtualModel');
  const items = result?.items || [];
  if (items.length === 0) {
    console.log('No virtual models configured.');
    return;
  }
  console.log(`${'NAME'.padEnd(28)} ${'MODEL'.padEnd(24)} ${'ROUTES'.padEnd(8)} ENABLED`);
  for (const vm of items) {
    const name = vm.metadata?.name || '-';
    const modelName = vm.spec?.modelName || '-';
    const routeCount = String(vm.spec?.routes?.length || 0);
    const enabled = vm.spec?.enabled !== false ? 'yes' : 'no';
    console.log(`${name.padEnd(28)} ${modelName.padEnd(24)} ${routeCount.padEnd(8)} ${enabled}`);
  }
}

function cmdVersion() {
  console.log(`krate v${getVersion()}`);
}

function cmdHelp() {
  console.log('Usage: krate <command> [options]\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(commands).map((k) => k.length));
  for (const [cmd, desc] of Object.entries(commands)) {
    console.log(`  ${cmd.padEnd(maxLen + 2)} ${desc}`);
  }
  console.log('\nOptions:');
  console.log('  --stack <name>   Stack name for dispatch');
  console.log('  --file <path>    File path for apply');
  console.log('  --kind <kind>    Resource kind for get/list/delete');
  console.log('  --name <name>    Resource name for get/delete');
  console.log('  --yes            Skip confirmation prompts');
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function confirm(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Minimal YAML→object parser for flat resource manifests.
 * Handles top-level key: value pairs, nested objects (indented), and
 * simple inline arrays. Does not handle anchors, multiline strings, etc.
 */
function parseSimpleYaml(text) {
  // Strip YAML document markers and comments
  const lines = text
    .split('\n')
    .filter((l) => !l.trimStart().startsWith('#') && l.trim() !== '---');

  function parseLinesAt(lineArr, baseIndent) {
    const obj = {};
    let i = 0;
    while (i < lineArr.length) {
      const line = lineArr[i];
      const indent = line.match(/^(\s*)/)[1].length;
      if (indent < baseIndent) break;
      if (indent > baseIndent) { i++; continue; }
      const trimmed = line.trim();
      if (!trimmed) { i++; continue; }
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) { i++; continue; }
      const key = trimmed.slice(0, colonIdx).trim();
      const rest = trimmed.slice(colonIdx + 1).trim();
      if (rest === '' || rest === '{}') {
        // Look for nested lines
        const nested = [];
        let j = i + 1;
        while (j < lineArr.length) {
          const nline = lineArr[j];
          const nindent = nline.match(/^(\s*)/)[1].length;
          if (nindent > baseIndent) {
            nested.push(nline);
            j++;
          } else {
            break;
          }
        }
        if (nested.length > 0) {
          obj[key] = parseLinesAt(nested, baseIndent + 2);
          i = j;
        } else {
          obj[key] = rest === '{}' ? {} : null;
          i++;
        }
      } else {
        obj[key] = parseScalar(rest);
        i++;
      }
    }
    return obj;
  }

  function parseScalar(val) {
    if (val === 'null' || val === '~') return null;
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(val)) return Number(val);
    if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
    return val;
  }

  return parseLinesAt(lines, 0);
}

// ---------------------------------------------------------------------------
// Main dispatch
// ---------------------------------------------------------------------------

const rawArgs = process.argv.slice(2);
const command = rawArgs[0];
const args = parseArgs(rawArgs.slice(1));

if (command === 'serve' || !command) {
  const { createKrateHttpServer } = await import('../src/index.js');
  const server = createKrateHttpServer();
  const port = Number(process.env.PORT || 3080);
  server.listen(port, () => console.log(`Krate server listening on port ${port}`));
} else if (command === 'mcp') {
  const { createMcpServer } = await import('../src/mcp-server.js');
  const server = createMcpServer();
  server.start();
} else if (command === 'status') {
  await cmdStatus();
} else if (command === 'models') {
  await cmdModels();
} else if (command === 'routes') {
  await cmdRoutes();
} else if (command === 'virtual-models') {
  await cmdVirtualModels();
} else if (command === 'stacks') {
  await cmdStacks();
} else if (command === 'dispatch') {
  await cmdDispatch(args.flags);
} else if (command === 'apply') {
  await cmdApply(args.flags);
} else if (command === 'get') {
  await cmdGet(args.positional, args.flags);
} else if (command === 'list') {
  await cmdList(args.positional, args.flags);
} else if (command === 'delete') {
  await cmdDelete(args.positional, args.flags);
} else if (command === 'version' || command === '--version' || command === '-v') {
  cmdVersion();
} else if (command === 'help' || command === '--help' || command === '-h') {
  cmdHelp();
} else {
  console.error(`Unknown command: ${command}`);
  console.error('Run "krate help" for usage.');
  process.exit(1);
}

#!/usr/bin/env node

const DEFAULT_ALGORITHM_CHANGE_PATTERNS = [
  "packages/sdk/src/runtime/**",
  "packages/sdk/src/storage/**",
];

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const changedFiles = args.changedFiles;
const patterns = args.patterns.length > 0 ? args.patterns : DEFAULT_ALGORITHM_CHANGE_PATTERNS;

if (!args.bugClass && !args.instrumentationOnly && changedFiles.length === 0) {
  console.log("[gate] no strike-3 forward-fix inputs provided; check-fix-strikes pass.");
  process.exit(0);
}

const gate = evaluateGate({
  bugClass: args.bugClass,
  strikeCount: args.strikeCount,
  instrumentationOnly: args.instrumentationOnly,
  changedFiles,
  patterns,
  override: args.override,
});

for (const line of gate.diagnostics) {
  console.log(line);
}

if (gate.overrideAudit) {
  console.log(JSON.stringify({ overrideAudit: gate.overrideAudit }, null, 2));
}

process.exit(gate.allowed ? 0 : 1);

function parseArgs(argv) {
  const parsed = {
    bugClass: undefined,
    strikeCount: 0,
    instrumentationOnly: false,
    changedFiles: [],
    patterns: [],
    override: undefined,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--bug-class") {
      parsed.bugClass = nextValue(argv, ++i, arg);
    } else if (arg === "--strike-count") {
      parsed.strikeCount = Number(nextValue(argv, ++i, arg));
      if (!Number.isFinite(parsed.strikeCount)) parsed.strikeCount = 0;
    } else if (arg === "--instrumentation-only") {
      parsed.instrumentationOnly = true;
    } else if (arg === "--changed-file") {
      parsed.changedFiles.push(nextValue(argv, ++i, arg));
    } else if (arg === "--changed-files") {
      parsed.changedFiles.push(...nextValue(argv, ++i, arg).split(",").map((value) => value.trim()).filter(Boolean));
    } else if (arg === "--pattern") {
      parsed.patterns.push(nextValue(argv, ++i, arg));
    } else if (arg === "--strike3-override") {
      parsed.override = {
        ...parsed.override,
        reason: nextValue(argv, ++i, arg),
      };
    } else if (arg === "--override-actor") {
      parsed.override = {
        ...parsed.override,
        actor: nextValue(argv, ++i, arg),
      };
    } else if (arg === "--override-timestamp") {
      parsed.override = {
        ...parsed.override,
        timestamp: nextValue(argv, ++i, arg),
      };
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function nextValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function evaluateGate(input) {
  const bugClass = normalizeString(input.bugClass);

  if (!bugClass) {
    return {
      allowed: false,
      diagnostics: ["[gate] missing bugClass for instrumentation-only forward-fix gate."],
    };
  }

  if (!input.instrumentationOnly) {
    return {
      allowed: true,
      diagnostics: [`[gate] ${bugClass}: not instrumentation_only; deploy-block gate skipped.`],
    };
  }

  const matchedFiles = input.changedFiles.filter((file) => (
    !isAlwaysAllowedPath(file) && input.patterns.some((pattern) => matchPattern(file, pattern))
  ));

  if (matchedFiles.length === 0) {
    return {
      allowed: true,
      diagnostics: [`[gate] ${bugClass}: no algorithm-change files matched at strike ${input.strikeCount}.`],
    };
  }

  if (input.override) {
    const actor = normalizeString(input.override.actor);
    const reason = normalizeString(input.override.reason);
    const timestamp = normalizeString(input.override.timestamp);

    if (!actor || !reason || !timestamp) {
      return {
        allowed: false,
        diagnostics: [
          `[gate] ${bugClass}: invalid --strike3-override.`,
          "[gate] --strike3-override reason, actor, and timestamp are required for audit.",
          `[gate] matched algorithm files: ${matchedFiles.join(", ")}`,
        ],
      };
    }

    return {
      allowed: true,
      diagnostics: [
        `[gate] strike-3 override applied for ${bugClass} at strike ${input.strikeCount}.`,
        `[gate] override actor: ${actor}`,
        `[gate] override reason: ${reason}`,
        `[gate] matched algorithm files: ${matchedFiles.join(", ")}`,
      ],
      overrideAudit: {
        actor,
        reason,
        bugClass,
        strikeCount: input.strikeCount,
        matchedFiles,
        timestamp,
      },
    };
  }

  return {
    allowed: false,
    diagnostics: [
      `[gate] ${bugClass}: strike ${input.strikeCount} instrumentation_only deploy block.`,
      `[gate] matched algorithm files: ${matchedFiles.join(", ")}`,
      "[gate] remediation: keep only logs/env flags/no-op guards/reverts or use audited --strike3-override.",
    ],
  };
}

function normalizeString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isAlwaysAllowedPath(path) {
  return path.startsWith("docs/") || path.includes("/__tests__/") || path.endsWith(".test.ts") || path.endsWith(".test.mjs");
}

function matchPattern(path, pattern) {
  if (pattern.endsWith("/**")) {
    return path.startsWith(pattern.slice(0, -3));
  }
  if (pattern.includes("**")) {
    const [prefix, suffix] = pattern.split("**", 2);
    return path.startsWith(prefix) && (!suffix || path.endsWith(suffix));
  }
  if (pattern.endsWith("*")) {
    return path.startsWith(pattern.slice(0, -1));
  }
  return path === pattern || path.startsWith(`${pattern}/`);
}

function printHelp() {
  console.log(`Usage: node scripts/check-fix-strikes.mjs [options]

Options:
  --bug-class <name>              Explicit forward-fix bugClass
  --strike-count <n>              Prior failed attempts for the bugClass
  --instrumentation-only          Enforce instrumentation_only deploy-block behavior
  --changed-file <path>           Changed file path; repeatable
  --changed-files <a,b>           Comma-separated changed file paths
  --pattern <glob>                Algorithm-change pattern; repeatable
  --strike3-override <reason>     Override reason for strike-3 deploy block
  --override-actor <name>         Actor recorded in override audit
  --override-timestamp <iso>      Timestamp recorded in override audit
`);
}

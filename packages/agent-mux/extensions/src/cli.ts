#!/usr/bin/env node
// CLI for extension-mux compiler

import * as path from 'path';
import * as process from 'process';
import { fileURLToPath } from 'url';
import { compile, compileAll } from './compiler.js';
import { diffTarget, formatDiffResult } from './diff.js';
import { INIT_TEMPLATES, scaffoldPlugin } from './init.js';
import { validate } from './validate.js';
import { getAllTargets } from './targets/index.js';
import type { Diagnostic } from './types.js';

interface CliIo {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

const defaultIo: CliIo = {
  stdout: (message) => console.log(message),
  stderr: (message) => console.error(message),
};

function showUsage(io: CliIo) {
  io.stdout(`
extension-mux - Cross-harness plugin compiler for AI coding agents

Usage:
  extension-mux compile --target <name|all> --output <dir> [options]
  extension-mux validate [options]
  extension-mux diff --target <name> --existing <dir> [options]
  extension-mux init --name <name> [options]
  extension-mux list-targets [options]

Commands:
  compile        Compile UPF source to target format(s)
  validate       Validate UPF source without compiling
  diff           Compare compiled output against existing directory
  init           Scaffold a new UPF plugin
  list-targets   List available compilation targets

Options:
  --source <dir>     UPF source directory (default: current directory)
  --target <name>    Target harness name or "all"
  --output <dir>     Output directory
  --existing <dir>   Path to existing plugin directory (for diff)
  --name <name>      Plugin name (for init)
  --template <name>  Template to use: ${INIT_TEMPLATES.join(', ')}
  --verify           Run verification checks after compilation
  --dry-run          Show what would be emitted without writing files
  --json             Output structured JSON result
  --verbose          Verbose logging
  --help, -h         Show this help message

Valid targets:
  claude-code, codex, cursor, gemini, github-copilot,
  pi, oh-my-pi, opencode, openclaw
`);
}

function parseArgs(args: string[]): Record<string, string | boolean> {
  const parsed: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);

      if (
        key === 'verify' ||
        key === 'dry-run' ||
        key === 'json' ||
        key === 'verbose' ||
        key === 'help'
      ) {
        parsed[key] = true;
      } else {
        const value = args[i + 1];
        if (value && !value.startsWith('--')) {
          parsed[key] = value;
          i++;
        }
      }
    } else if (arg === '-h') {
      parsed.help = true;
    } else if (!parsed.command) {
      parsed.command = arg;
    }
  }

  return parsed;
}

function printDiagnostics(diagnostics: Diagnostic[], verbose = false) {
  const errors = diagnostics.filter((d) => d.level === 'error');
  const warnings = diagnostics.filter((d) => d.level === 'warning');
  const infos = diagnostics.filter((d) => d.level === 'info');

  for (const diag of errors) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${diag.message}`);
    if (diag.source) console.error(`  Source: ${diag.source}`);
    if (diag.suggestion) console.error(`  Suggestion: ${diag.suggestion}`);
  }

  for (const diag of warnings) {
    console.warn(`\x1b[33m[WARNING]\x1b[0m ${diag.message}`);
    if (diag.source && verbose) console.warn(`  Source: ${diag.source}`);
  }

  if (verbose) {
    for (const diag of infos) {
      console.log(`\x1b[36m[INFO]\x1b[0m ${diag.message}`);
    }
  }

  if (errors.length > 0 || warnings.length > 0 || infos.length > 0) {
    console.log(
      `\nSummary: ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info`
    );
  }
}

function runCompile(parsed: Record<string, string | boolean>, io: CliIo): number {
  const source = (parsed.source as string) || process.cwd();
  const target = parsed.target as string;
  const output = parsed.output as string;
  const dryRun = parsed['dry-run'] as boolean;
  const verifyOutput = parsed.verify as boolean;
  const jsonOutput = parsed.json as boolean;
  const verbose = parsed.verbose as boolean;

  if (!target || !output) {
    io.stderr('Error: --target and --output are required');
    return 1;
  }

  if (target === 'all') {
    const results = compileAll(source, output, { dryRun, verifyOutput });

    if (jsonOutput) {
      io.stdout(JSON.stringify(results, null, 2));
    } else {
      for (const result of results) {
        io.stdout(`\n=== Target: ${result.target} ===`);
        io.stdout(`Status: ${result.status}`);
        io.stdout(`Output: ${result.outputDir}`);
        io.stdout(`Emitted files: ${result.emittedFiles.length}`);
        printDiagnostics(result.diagnostics, verbose);
      }

      const failed = results.filter((r) => r.status === 'error').length;
      const warnings = results.filter((r) => r.status === 'warning').length;
      const success = results.filter((r) => r.status === 'success').length;

      io.stdout(
        `\n=== Overall ===\n${success} succeeded, ${warnings} with warnings, ${failed} failed`
      );
    }

    const hasErrors = results.some((r) => r.status === 'error');
    return hasErrors ? 1 : 0;
  } else {
    const result = compile({
      source,
      target,
      output,
      dryRun,
      verifyOutput,
    });

    if (jsonOutput) {
      io.stdout(JSON.stringify(result, null, 2));
    } else {
      io.stdout(`Target: ${result.target}`);
      io.stdout(`Status: ${result.status}`);
      io.stdout(`Output: ${result.outputDir}`);
      io.stdout(`Emitted files: ${result.emittedFiles.length}`);

      if (result.verificationChecklist.length > 0 && verbose) {
        io.stdout('\nVerification:');
        for (const check of result.verificationChecklist) {
          io.stdout(`  ${check}`);
        }
      }

      printDiagnostics(result.diagnostics, verbose);
    }

    return result.status === 'error' ? 1 : 0;
  }
}

function runValidate(parsed: Record<string, string | boolean>, io: CliIo): number {
  const source = (parsed.source as string) || process.cwd();
  const jsonOutput = parsed.json as boolean;
  const verbose = parsed.verbose as boolean;

  const result = validate(source);

  if (jsonOutput) {
    io.stdout(JSON.stringify(result, null, 2));
  } else {
    io.stdout(`Valid: ${result.valid}`);
    printDiagnostics(result.diagnostics, verbose);
  }

  return result.valid ? 0 : 1;
}

function runListTargets(parsed: Record<string, string | boolean>, io: CliIo): number {
  const jsonOutput = parsed.json as boolean;
  const targets = getAllTargets();

  if (jsonOutput) {
    io.stdout(JSON.stringify(targets, null, 2));
  } else {
    io.stdout('Available targets:');
    for (const target of targets) {
      io.stdout(`  - ${target}`);
    }
  }

  return 0;
}

function runDiff(parsed: Record<string, string | boolean>, io: CliIo): number {
  const source = (parsed.source as string) || process.cwd();
  const target = parsed.target as string;
  const existing = parsed.existing as string;
  const jsonOutput = parsed.json as boolean;
  const verbose = parsed.verbose as boolean;

  if (!target || !existing) {
    io.stderr('Error: --target and --existing are required');
    return 1;
  }

  if (target === 'all') {
    io.stderr('Error: diff currently supports a single target; pass a specific --target name');
    return 1;
  }

  const result = diffTarget({ source, target, existing });

  if (jsonOutput) {
    io.stdout(JSON.stringify(result, null, 2));
  } else {
    io.stdout(formatDiffResult(result));
    if (result.diagnostics.length > 0) {
      printDiagnostics(result.diagnostics, verbose);
    }
  }

  return result.status === 'match' ? 0 : 1;
}

function runInit(parsed: Record<string, string | boolean>, io: CliIo): number {
  const name = parsed.name as string | undefined;
  const template = parsed.template as string | undefined;
  const output = (parsed.output as string | undefined) ?? process.cwd();
  const dryRun = parsed['dry-run'] as boolean;
  const jsonOutput = parsed.json as boolean;

  if (!name) {
    io.stderr('Error: --name is required');
    return 1;
  }

  const result = scaffoldPlugin({
    name,
    template: template as (typeof INIT_TEMPLATES)[number] | undefined,
    output,
    dryRun,
  });

  if (jsonOutput) {
    io.stdout(JSON.stringify(result, null, 2));
  } else {
    io.stdout(`Scaffolded template: ${result.template}`);
    io.stdout(`Output: ${result.outputDir}`);
    io.stdout(`Files: ${result.writtenFiles.length}`);

    if (parsed.verbose) {
      for (const file of result.writtenFiles) {
        io.stdout(`  - ${file}`);
      }
    }

    if (dryRun) {
      io.stdout('Dry run only. No files were written.');
    }
  }

  return 0;
}

export function runCli(args: string[], io: CliIo = defaultIo): number {
  const parsed = parseArgs(args);

  if (parsed.help || !parsed.command) {
    showUsage(io);
    return 0;
  }

  const command = parsed.command as string;

  try {
    switch (command) {
      case 'compile':
        return runCompile(parsed, io);
      case 'validate':
        return runValidate(parsed, io);
      case 'list-targets':
        return runListTargets(parsed, io);
      case 'diff':
        return runDiff(parsed, io);
      case 'init':
        return runInit(parsed, io);
      default:
        io.stderr(`Unknown command: ${command}`);
        showUsage(io);
        return 1;
    }
  } catch (error) {
    io.stderr(`Fatal error: ${(error as Error).message}`);
    if (parsed.verbose) {
      io.stderr((error as Error).stack ?? '');
    }
    return 1;
  }
}

function isExecutedDirectly(): boolean {
  const entryPoint = process.argv[1];
  if (!entryPoint) {
    return false;
  }

  return path.resolve(entryPoint) === fileURLToPath(import.meta.url);
}

function main() {
  process.exit(runCli(process.argv.slice(2)));
}

if (isExecutedDirectly()) {
  main();
}

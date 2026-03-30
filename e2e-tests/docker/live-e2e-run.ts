/**
 * Live E2E: babysitter orchestration with REAL subagent work.
 *
 * Agent tasks read real files, scan real directories, and verify real artifacts.
 * Node tasks write real files to disk. This proves the orchestration drives
 * actual work, not chat completions.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import activate from '/app/plugins/babysitter-pi/extensions/babysitter/index.ts';
import { bindRun } from '/app/plugins/babysitter-pi/extensions/babysitter/session-binder.ts';
import { iterate, getRunStatus, postResult } from '/app/plugins/babysitter-pi/extensions/babysitter/sdk-bridge.ts';
import { resetGuardState } from '/app/plugins/babysitter-pi/extensions/babysitter/guards.ts';
import { loadJournal } from '@a5c-ai/babysitter-sdk';

const SID = 'live-e2e-real-work';
const RUNS = '/tmp/live-e2e/runs';
const log = (msg: string) => process.stderr.write(`[LIVE] ${msg}\n`);

// ---------------------------------------------------------------------------
// Read the full task definition from tasks/<effectId>/task.json
// ---------------------------------------------------------------------------
function readTaskDef(runDir: string, effectId: string): Record<string, unknown> {
  const taskPath = path.join(runDir, 'tasks', effectId, 'task.json');
  try {
    return JSON.parse(fs.readFileSync(taskPath, 'utf-8'));
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Real subagent: executes work based on metadata from the task definition
// ---------------------------------------------------------------------------
function executeAgentWork(taskDef: Record<string, unknown>): { status: 'ok' | 'error'; value: unknown } {
  const metadata = (taskDef.metadata || {}) as Record<string, unknown>;
  const workType = metadata.work as string || 'unknown';
  const title = taskDef.title as string || '(untitled)';

  log(`  SUBAGENT work type: "${workType}" | title: "${title}"`);

  switch (workType) {
    case 'scan-filesystem': {
      const targetDir = metadata.targetDir as string || '/app/packages/sdk/src';
      log(`  SUBAGENT scanning directory: ${targetDir}`);

      const dirs = fs.readdirSync(targetDir, { withFileTypes: true })
        .filter((d: any) => d.isDirectory())
        .map((d: any) => d.name);
      const inventory: Record<string, number> = {};
      for (const dir of dirs) {
        const files = fs.readdirSync(path.join(targetDir, dir))
          .filter((f: string) => f.endsWith('.ts'));
        inventory[dir] = files.length;
      }
      const totalFiles = Object.values(inventory).reduce((a, b) => a + b, 0);
      log(`  SUBAGENT found ${dirs.length} modules, ${totalFiles} .ts files`);
      for (const [mod, count] of Object.entries(inventory)) {
        log(`    ${mod}: ${count} files`);
      }
      return { status: 'ok', value: { modules: inventory, totalModules: dirs.length, totalFiles } };
    }

    case 'verify-file': {
      const filePath = metadata.filePath as string;
      const requiredFields = metadata.requiredFields as string[] || [];
      const checks = metadata.checks as string[] || [];

      log(`  SUBAGENT verifying file: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        log(`  SUBAGENT FAIL: file does not exist`);
        return { status: 'ok', value: { verified: false, issues: ['File not found'] } };
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const issues: string[] = [];

      for (const field of requiredFields) {
        if (!(field in data)) {
          issues.push(`Missing field: ${field}`);
        }
      }

      for (const check of checks) {
        const match = check.match(/^(\w+)\s*>\s*(\d+)$/);
        if (match) {
          const [, field, threshold] = match;
          if ((data[field] ?? 0) <= Number(threshold)) {
            issues.push(`Check failed: ${check} (actual: ${data[field]})`);
          }
        }
      }

      log(`  SUBAGENT verification: ${issues.length === 0 ? 'PASSED' : 'FAILED'}`);
      if (issues.length > 0) {
        for (const issue of issues) log(`    ISSUE: ${issue}`);
      } else {
        log(`    Report has ${data.totalModules} modules, ${data.totalFiles} files`);
        log(`    Generated at: ${data.generatedAt}`);
      }

      return { status: 'ok', value: { verified: issues.length === 0, issues, summary: data } };
    }

    default:
      log(`  SUBAGENT: unknown work type "${workType}", executing generically`);
      return { status: 'ok', value: { handled: true, workType } };
  }
}

// ---------------------------------------------------------------------------
// Execute a node task via the SDK's node runner (child_process)
// ---------------------------------------------------------------------------
function executeNodeTask(taskDef: Record<string, unknown>): { status: 'ok' | 'error'; value: unknown } {
  const nodeDef = taskDef.node as Record<string, unknown> | undefined;
  const title = taskDef.title as string || '(untitled)';

  if (!nodeDef) {
    log(`  NODE: no node config, skipping`);
    return { status: 'ok', value: { skipped: true } };
  }

  const args = (nodeDef.args as string[]) || [];
  const script = args[0] || '';

  log(`  NODE executing: "${title}"`);
  log(`  NODE script length: ${script.length} chars`);

  try {
    const output = execSync(`node -e ${JSON.stringify(script)}`, {
      encoding: 'utf-8',
      timeout: 30_000,
    }).trim();
    log(`  NODE output: ${output.slice(0, 120)}`);

    let parsed: unknown = output;
    try { parsed = JSON.parse(output); } catch { /* not JSON */ }
    return { status: 'ok', value: parsed };
  } catch (err: any) {
    log(`  NODE failed: ${err.message}`);
    return { status: 'error', value: err.message };
  }
}

// ---------------------------------------------------------------------------
// omp extension API mock
// ---------------------------------------------------------------------------
const handlers: Record<string, Function[]> = {};
const pi: any = {
  on(e: string, h: Function) { (handlers[e] ??= []).push(h); },
  registerCommand() {},
  appendEntry(entry: {type: string, content: string}) {
    log(`[${entry.type}] ${entry.content.slice(0, 150)}`);
  },
  sendMessage() {},
  sendUserMessage(msg: any) { log(`[continuation] ${msg.content?.slice(0, 80)}`); },
  registerTool() {},
  registerMessageRenderer() {},
  getActiveTools() { return []; },
  setActiveTools() {},
  setStatus() {},
  setWidget() {},
};

// ---------------------------------------------------------------------------
// Main orchestration
// ---------------------------------------------------------------------------
async function main() {
  log('================================================');
  log('  BABYSITTER LIVE E2E: REAL SUBAGENT WORK');
  log('================================================\n');

  // Activate extension
  activate(pi);
  resetGuardState();
  if (handlers.session_start?.length) {
    await handlers.session_start[0]({ sessionId: SID });
  }
  log('[OK] Extension activated and session started\n');

  // Create run
  const runState = await bindRun(SID, {
    processId: 'live-e2e-real-work',
    importPath: '/tmp/live-e2e/proc.js',
    exportName: 'process',
    prompt: 'Scan the SDK, write a report, and verify it',
    runsDir: RUNS,
  });
  log(`[OK] Run created: ${runState.runId}\n`);

  // Orchestration loop
  let iter = await iterate(runState.runDir);
  runState.iteration = 1;
  log(`[ITER ${runState.iteration}] Status: ${iter.status}\n`);

  let loopCount = 0;
  const workLog: Array<{ effectId: string; kind: string; title: string; result: string }> = [];

  while (iter.status === 'waiting' && loopCount < 10) {
    loopCount++;
    const status = await getRunStatus(runState.runDir);
    const pending = status.pendingEffects;
    log(`[LOOP ${loopCount}] ${pending.length} pending effect(s)\n`);

    for (const effect of pending) {
      // Read the FULL task definition from disk (includes metadata)
      const taskDef = readTaskDef(runState.runDir, effect.effectId);
      const title = (taskDef.title as string) || effect.label || '(untitled)';
      const kind = effect.kind;

      log(`=== Effect: ${effect.effectId} ===`);
      log(`    Kind: ${kind} | Title: ${title}`);

      let result: { status: 'ok' | 'error'; value: unknown };

      if (kind === 'agent') {
        result = executeAgentWork(taskDef);
      } else if (kind === 'node') {
        result = executeNodeTask(taskDef);
      } else {
        result = { status: 'ok', value: { handled: true } };
      }

      await postResult({
        runDir: runState.runDir,
        effectId: effect.effectId,
        status: result.status,
        value: result.value,
      });

      workLog.push({ effectId: effect.effectId, kind, title, result: result.status });
      log(`[OK] Effect resolved\n`);
    }

    iter = await iterate(runState.runDir);
    runState.iteration++;
    log(`[ITER ${runState.iteration}] Status: ${iter.status}\n`);
  }

  // Verify artifacts
  log('================================================');
  log('  ARTIFACT VERIFICATION');
  log('================================================\n');

  const reportPath = '/tmp/live-e2e/module-report.json';
  const reportExists = fs.existsSync(reportPath);
  let reportData: any = null;

  if (reportExists) {
    reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    log(`[OK] Report file exists at ${reportPath}`);
    log(`    Total modules: ${reportData.totalModules}`);
    log(`    Total .ts files: ${reportData.totalFiles}`);
    log(`    Modules: ${Object.keys(reportData.modules).join(', ')}`);
    log(`    Generated at: ${reportData.generatedAt}`);
  } else {
    log(`[FAIL] Report file NOT found at ${reportPath}`);
  }

  // Journal
  const journal = await loadJournal(runState.runDir);
  const eventTypes = journal.map((e: any) => e.type);
  log(`\n  Journal: ${eventTypes.join(' -> ')}`);

  // Final result
  const success = reportExists
    && reportData?.totalModules > 0
    && reportData?.totalFiles > 0
    && eventTypes.includes('RUN_COMPLETED');

  log(`\n================================================`);
  log(`  RESULT: ${success ? 'SUCCESS' : 'FAILURE'}`);
  log(`================================================\n`);

  console.log(JSON.stringify({
    success,
    runId: runState.runId,
    iterations: runState.iteration,
    journalEvents: eventTypes,
    workLog,
    report: reportData ? {
      totalModules: reportData.totalModules,
      totalFiles: reportData.totalFiles,
      modules: Object.keys(reportData.modules),
    } : null,
  }, null, 2));
}

main().catch(e => {
  log(`FATAL: ${e.message}\n${e.stack}`);
  console.log(JSON.stringify({ error: e.message, success: false }));
  process.exit(1);
});

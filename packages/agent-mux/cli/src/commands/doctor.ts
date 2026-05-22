/**
 * `amux doctor` — aggregated environment health check.
 *
 * Reports Node.js version, per-adapter install + auth + config-file status,
 * and hook registry paths. Designed for copy/paste into bug reports.
 */
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { AgentMuxClient, DetectInstallationResult, AuthState } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../parse-args.js';
import { flagBool } from '../parse-args.js';
import { ExitCode } from '../exit-codes.js';
import { printJsonOk } from '../output.js';

interface AgentReport {
  agent: string;
  install: DetectInstallationResult | { installed: false; notes: string };
  auth: AuthState;
  configFiles: Array<{ path: string; exists: boolean }>;
}

interface DoctorReport {
  node: { version: string; platform: string; arch: string; meetsMinimum: boolean };
  agents: AgentReport[];
  hooks: { globalPath: string; projectPath: string; globalExists: boolean; projectExists: boolean };
  summary: { installedAgents: number; authenticatedAgents: number; totalAgents: number };
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function meetsNodeMinimum(version: string): boolean {
  const m = version.replace(/^v/, '').split('.').map((n) => parseInt(n, 10));
  if (m[0] > 20) return true;
  if (m[0] === 20 && m[1] >= 9) return true;
  return false;
}

async function buildReport(client: AgentMuxClient): Promise<DoctorReport> {
  const adapters = client.adapters.list();
  const agents: AgentReport[] = [];

  for (const info of adapters) {
    const adapter = client.adapters.get(info.agent);
    if (!adapter) continue;

    let install: AgentReport['install'];
    try {
      install = adapter.detectInstallation
        ? await adapter.detectInstallation()
        : { installed: false, notes: 'detectInstallation() not implemented' };
    } catch (e) {
      install = { installed: false, notes: `error: ${e instanceof Error ? e.message : String(e)}` };
    }

    let auth: AuthState;
    try {
      auth = await adapter.detectAuth();
    } catch (e) {
      auth = { status: 'unauthenticated' };
      void e;
    }

    const configFiles: AgentReport['configFiles'] = [];
    const paths = adapter.configSchema?.configFilePaths ?? [];
    for (const p of paths) {
      configFiles.push({ path: p, exists: await fileExists(p) });
    }

    agents.push({ agent: info.agent, install, auth, configFiles });
  }

  const globalHookPath = path.join(os.homedir(), '.amux', 'hooks.json');
  const projectHookPath = path.join(process.cwd(), '.amux', 'hooks.json');

  const installedAgents = agents.filter((a) => a.install.installed).length;
  const authenticatedAgents = agents.filter((a) => a.auth.status === 'authenticated').length;

  return {
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      meetsMinimum: meetsNodeMinimum(process.version),
    },
    agents,
    hooks: {
      globalPath: globalHookPath,
      projectPath: projectHookPath,
      globalExists: await fileExists(globalHookPath),
      projectExists: await fileExists(projectHookPath),
    },
    summary: {
      installedAgents,
      authenticatedAgents,
      totalAgents: agents.length,
    },
  };
}

function formatReport(r: DoctorReport): string {
  const lines: string[] = [];
  lines.push('amux doctor');
  lines.push('───────────');
  lines.push(
    `Node:   ${r.node.version} on ${r.node.platform}/${r.node.arch} ${r.node.meetsMinimum ? 'OK' : '— below minimum (needs >= 20.9.0)'}`,
  );
  lines.push(
    `Agents: ${r.summary.installedAgents}/${r.summary.totalAgents} installed, ${r.summary.authenticatedAgents} authenticated`,
  );
  lines.push('');
  for (const a of r.agents) {
    const installed = a.install.installed ? 'installed' : 'not installed';
    const version = 'version' in a.install && a.install.version ? ` v${a.install.version}` : '';
    const authed = a.auth.status === 'authenticated' ? 'authenticated' : a.auth.status;
    const cfg = a.configFiles.length === 0
      ? 'none'
      : a.configFiles.map((c) => `${c.path}${c.exists ? '' : ' (missing)'}`).join(', ');
    lines.push(`  ${a.agent.padEnd(20)} ${installed}${version}; auth: ${authed}`);
    lines.push(`    config: ${cfg}`);
  }
  lines.push('');
  lines.push('Hooks:');
  lines.push(`  global:  ${r.hooks.globalPath}${r.hooks.globalExists ? '' : ' (missing)'}`);
  lines.push(`  project: ${r.hooks.projectPath}${r.hooks.projectExists ? '' : ' (missing)'}`);
  return lines.join('\n') + '\n';
}

export async function doctorCommand(
  client: AgentMuxClient,
  args: ParsedArgs,
): Promise<number> {
  const jsonMode = flagBool(args.flags, 'json') === true;
  const report = await buildReport(client);

  if (jsonMode) {
    printJsonOk(report as unknown as Record<string, unknown>);
  } else {
    process.stdout.write(formatReport(report));
  }

  return ExitCode.SUCCESS;
}

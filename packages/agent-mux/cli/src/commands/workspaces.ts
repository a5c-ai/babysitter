import type { AgentMuxClient, WorkspaceSessionBinding } from '@a5c-ai/agent-mux-comm';
import { WorkspaceService } from '@a5c-ai/agent-mux-comm';

import type { ParsedArgs, FlagDef } from '../parse-args.js';
import { flagArr, flagBool, flagStr } from '../parse-args.js';
import { ExitCode } from '../exit-codes.js';
import { printError, printJsonError, printJsonOk, printTable } from '../output.js';

export const WORKSPACE_FLAGS: Record<string, FlagDef> = {
  repo: { type: 'string', repeatable: true },
  mode: { type: 'string' },
  name: { type: 'string' },
  branch: { type: 'string' },
  root: { type: 'string' },
  force: { type: 'boolean' },
};

function jsonMode(args: ParsedArgs): boolean {
  return flagBool(args.flags, 'json') === true;
}

function toSessionBindings(value: unknown): WorkspaceSessionBinding[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }
    const session = entry as Record<string, unknown>;
    if (typeof session.agent !== 'string' || typeof session.sessionId !== 'string') {
      return [];
    }
    return [{
      agent: session.agent,
      sessionId: session.sessionId,
      status: session.status === 'running' ? 'running' : 'stopped',
      cwd: typeof session.cwd === 'string' ? session.cwd : undefined,
      title: typeof session.title === 'string' ? session.title : undefined,
      updatedAt: typeof session.updatedAt === 'string' ? session.updatedAt : new Date().toISOString(),
      activeRunId: typeof session.activeRunId === 'string' ? session.activeRunId : null,
      latestRunId: typeof session.latestRunId === 'string' ? session.latestRunId : null,
    }];
  });
}

export async function workspacesCommand(_client: AgentMuxClient, args: ParsedArgs): Promise<number> {
  const json = jsonMode(args);
  const service = new WorkspaceService();
  const sub = args.subcommand ?? 'list';

  try {
    switch (sub) {
      case 'list': {
        const payload = await service.listWorkspaces();
        if (json) {
          printJsonOk(payload);
          return ExitCode.SUCCESS;
        }
        printTable(
          ['ID', 'Name', 'Status', 'Mode', 'CWD', 'Root'],
          payload.workspaces.map((workspace: { id: string; name: string; status: string; mode: string; defaultCwd: string; rootPath: string }) => [
            workspace.id,
            workspace.name,
            workspace.status,
            workspace.mode,
            workspace.defaultCwd,
            workspace.rootPath,
          ]),
        );
        return ExitCode.SUCCESS;
      }
      case 'create': {
        const name = args.positionals[0] ?? flagStr(args.flags, 'name');
        const repos = flagArr(args.flags, 'repo');
        if (!name) {
          if (json) printJsonError('VALIDATION_ERROR', 'Usage: amux workspaces create <name> --repo <path> [--repo <path>...]');
          else printError('Usage: amux workspaces create <name> --repo <path> [--repo <path>...]');
          return ExitCode.USAGE_ERROR;
        }
        if (repos.length === 0) {
          if (json) printJsonError('VALIDATION_ERROR', 'At least one --repo path is required.');
          else printError('At least one --repo path is required.');
          return ExitCode.USAGE_ERROR;
        }
        const created = await service.createWorkspace({
          name,
          repos: repos.map((repo) => ({ path: repo })),
          mode: flagStr(args.flags, 'mode') === 'symlink' ? 'symlink' : 'worktree',
          branchName: flagStr(args.flags, 'branch') ?? undefined,
          rootDir: flagStr(args.flags, 'root') ?? undefined,
        });
        if (json) {
          printJsonOk(created);
        } else {
          process.stdout.write(`${created.id}\t${created.rootPath}\n`);
        }
        return ExitCode.SUCCESS;
      }
      case 'archive': {
        const identifier = args.positionals[0];
        if (!identifier) {
          if (json) printJsonError('VALIDATION_ERROR', 'Usage: amux workspaces archive <workspace>');
          else printError('Usage: amux workspaces archive <workspace>');
          return ExitCode.USAGE_ERROR;
        }
        const archived = await service.archiveWorkspace(identifier);
        if (json) printJsonOk(archived);
        else process.stdout.write(`Archived ${archived.id}\n`);
        return ExitCode.SUCCESS;
      }
      case 'cleanup': {
        const identifier = args.positionals[0];
        if (!identifier) {
          if (json) printJsonError('VALIDATION_ERROR', 'Usage: amux workspaces cleanup <workspace>');
          else printError('Usage: amux workspaces cleanup <workspace>');
          return ExitCode.USAGE_ERROR;
        }
        const cleaned = await service.cleanupWorkspace(identifier);
        if (json) printJsonOk(cleaned);
        else process.stdout.write(`Cleaned ${cleaned.id}\n`);
        return ExitCode.SUCCESS;
      }
      case 'recover': {
        const identifier = args.positionals[0];
        if (!identifier) {
          if (json) printJsonError('VALIDATION_ERROR', 'Usage: amux workspaces recover <workspace>');
          else printError('Usage: amux workspaces recover <workspace>');
          return ExitCode.USAGE_ERROR;
        }
        const recovered = await service.recoverWorkspace(identifier);
        if (json) printJsonOk(recovered);
        else process.stdout.write(`Recovered ${recovered.id}\n`);
        return ExitCode.SUCCESS;
      }
      case 'delete': {
        const identifier = args.positionals[0];
        if (!identifier) {
          if (json) printJsonError('VALIDATION_ERROR', 'Usage: amux workspaces delete <workspace> [--force]');
          else printError('Usage: amux workspaces delete <workspace> [--force]');
          return ExitCode.USAGE_ERROR;
        }
        await service.deleteWorkspace(identifier, { forceCleanup: flagBool(args.flags, 'force') === true });
        if (json) printJsonOk({ deleted: identifier });
        else process.stdout.write(`Deleted ${identifier}\n`);
        return ExitCode.SUCCESS;
      }
      case 'sync-sessions': {
        const body = toSessionBindings(args.positionals[0] ? JSON.parse(args.positionals[0]) : []);
        await service.reconcileSessions(body);
        const payload = await service.listWorkspaces();
        if (json) printJsonOk(payload);
        else process.stdout.write(`Synced ${body.length} sessions\n`);
        return ExitCode.SUCCESS;
      }
      default:
        if (json) printJsonError('VALIDATION_ERROR', `Unknown workspaces subcommand: ${sub}`);
        else printError(`Unknown workspaces subcommand: ${sub}`);
        return ExitCode.USAGE_ERROR;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      printJsonError('INTERNAL', message);
    } else {
      printError(message);
    }
    return ExitCode.GENERAL_ERROR;
  }
}

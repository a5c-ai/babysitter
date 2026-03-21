import {
  bindActiveProcessLibrary,
  cloneProcessLibrary,
  resolveActiveProcessLibrary,
  updateProcessLibrary,
} from "../../processLibrary/active";

export interface ProcessLibraryCommandArgs {
  subcommand: "clone" | "update" | "use" | "active";
  repo?: string;
  dir?: string;
  ref?: string;
  runId?: string;
  sessionId?: string;
  stateDir?: string;
  json: boolean;
}

function requireArg(
  value: string | undefined,
  name: string,
  command: string,
  json: boolean
): string | null {
  if (!value) {
    const message = `[${command}] ${name} is required`;
    if (json) {
      console.log(JSON.stringify({ error: "missing_argument", message }));
    } else {
      console.error(message);
    }
    return null;
  }
  return value;
}

export async function handleProcessLibraryClone(
  args: ProcessLibraryCommandArgs
): Promise<number> {
  const repo = requireArg(args.repo, "--repo", "process-library:clone", args.json);
  if (!repo) return 1;
  const dir = requireArg(args.dir, "--dir", "process-library:clone", args.json);
  if (!dir) return 1;

  try {
    const result = await cloneProcessLibrary({ repo, dir, ref: args.ref });
    if (args.json) {
      console.log(JSON.stringify({ success: true, ...result }, null, 2));
    } else {
      console.log(
        `Process library cloned.\n  Repo: ${result.repo}\n  Dir: ${result.dir}\n  Revision: ${result.revision}`
      );
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (args.json) {
      console.log(JSON.stringify({ error: "clone_failed", message }));
    } else {
      console.error(`[process-library:clone] ${message}`);
    }
    return 1;
  }
}

export async function handleProcessLibraryUpdate(
  args: ProcessLibraryCommandArgs
): Promise<number> {
  const dir = requireArg(args.dir, "--dir", "process-library:update", args.json);
  if (!dir) return 1;

  try {
    const result = await updateProcessLibrary({ dir, ref: args.ref });
    if (args.json) {
      console.log(JSON.stringify({ success: true, ...result }, null, 2));
    } else {
      console.log(
        `Process library updated.\n  Dir: ${result.dir}\n  Revision: ${result.revision}`
      );
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (args.json) {
      console.log(JSON.stringify({ error: "update_failed", message }));
    } else {
      console.error(`[process-library:update] ${message}`);
    }
    return 1;
  }
}

export async function handleProcessLibraryUse(
  args: ProcessLibraryCommandArgs
): Promise<number> {
  const dir = requireArg(args.dir, "--dir", "process-library:use", args.json);
  if (!dir) return 1;

  try {
    const result = await bindActiveProcessLibrary({
      dir,
      stateDir: args.stateDir,
      runId: args.runId,
      sessionId: args.sessionId,
      ref: args.ref,
    });
    if (args.json) {
      console.log(JSON.stringify({ success: true, ...result }, null, 2));
    } else {
      console.log(
        `Active process library updated.\n  Scope: ${result.bindingScope}\n  Dir: ${result.binding.dir}\n  State: ${result.stateFile}`
      );
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (args.json) {
      console.log(JSON.stringify({ error: "bind_failed", message }));
    } else {
      console.error(`[process-library:use] ${message}`);
    }
    return 1;
  }
}

export async function handleProcessLibraryActive(
  args: ProcessLibraryCommandArgs
): Promise<number> {
  try {
    const result = await resolveActiveProcessLibrary({
      stateDir: args.stateDir,
      runId: args.runId,
      sessionId: args.sessionId,
    });
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (!result.binding) {
      console.log(`No active process-library binding found.\n  State: ${result.stateFile}`);
    } else {
      console.log(
        `Active process library.\n  Scope: ${result.bindingScope}\n  Dir: ${result.binding.dir}\n  Revision: ${result.binding.revision ?? "unknown"}`
      );
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (args.json) {
      console.log(JSON.stringify({ error: "active_failed", message }));
    } else {
      console.error(`[process-library:active] ${message}`);
    }
    return 1;
  }
}

export async function handleProcessLibraryCommand(
  args: ProcessLibraryCommandArgs
): Promise<number> {
  switch (args.subcommand) {
    case "clone":
      return handleProcessLibraryClone(args);
    case "update":
      return handleProcessLibraryUpdate(args);
    case "use":
      return handleProcessLibraryUse(args);
    case "active":
      return handleProcessLibraryActive(args);
    default:
      console.error(`[process-library] Unknown subcommand: ${args.subcommand}`);
      return 1;
  }
}

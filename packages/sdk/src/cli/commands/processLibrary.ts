import {
  bindActiveProcessLibrary,
  cloneProcessLibrary,
  ensureActiveProcessLibrary,
  getDefaultProcessLibrarySpec,
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

export async function handleProcessLibraryClone(
  args: ProcessLibraryCommandArgs
): Promise<number> {
  const defaults = getDefaultProcessLibrarySpec({
    stateDir: args.stateDir,
    repo: args.repo,
    cloneDir: args.dir,
    ref: args.ref,
  });
  const repo = args.repo ?? defaults.repo;
  const dir = args.dir ?? defaults.cloneDir;

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
  const defaults = getDefaultProcessLibrarySpec({
    stateDir: args.stateDir,
    cloneDir: args.dir,
    ref: args.ref,
  });
  const dir = args.dir ?? defaults.cloneDir;

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
  try {
    const result = args.dir
      ? await bindActiveProcessLibrary({
          dir: args.dir,
          stateDir: args.stateDir,
          runId: args.runId,
          sessionId: args.sessionId,
          ref: args.ref,
        })
      : await ensureActiveProcessLibrary({
          stateDir: args.stateDir,
          runId: args.runId,
          sessionId: args.sessionId,
          ref: args.ref,
        });
    if (args.json) {
      console.log(JSON.stringify({ success: true, ...result }, null, 2));
    } else {
      const boundDir = result.binding?.dir ?? "(missing)";
      console.log(
        `Active process library updated.\n  Scope: ${result.bindingScope}\n  Dir: ${boundDir}\n  State: ${result.stateFile}`
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
    const result = await ensureActiveProcessLibrary({
      stateDir: args.stateDir,
      runId: args.runId,
      sessionId: args.sessionId,
    });
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const lines = [
        "Active process library.",
        `  Scope: ${result.bindingScope}`,
        `  Dir: ${result.binding?.dir ?? "(missing)"}`,
        `  Revision: ${result.binding?.revision ?? "unknown"}`,
        `  State: ${result.stateFile}`,
      ];
      if (result.bootstrapped) {
        lines.push(`  Bootstrapped: yes (${result.defaultSpec.cloneDir})`);
      }
      console.log(lines.join("\n"));
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
    default: {
      const _exhaustive: never = args.subcommand;
      void _exhaustive;
      console.error("[process-library] Unknown subcommand");
      return 1;
    }
  }
}

import type { HarnessParsedArgs } from "../args/types.js";

export interface PrintOptions {
  prompt: string;
  model?: string;
  harness?: string;
  workspace?: string;
  json?: boolean;
  verbose?: boolean;
}

export async function handlePrint(args: HarnessParsedArgs): Promise<number> {
  const prompt = args.prompt;
  if (!prompt) {
    if (args.json) {
      process.stdout.write(JSON.stringify({ error: "No prompt provided. Usage: genty -p 'query'" }) + "\n");
    } else {
      process.stderr.write("Error: No prompt provided. Usage: genty -p 'query'\n");
    }
    return 1;
  }

  const harness = args.harness || "internal";
  const model = args.model;
  const workspace = args.workspace || process.cwd();
  const jsonMode = args.json || false;

  try {
    if (jsonMode) {
      process.stdout.write(JSON.stringify({ event: "start", prompt, harness, model, workspace, timestamp: new Date().toISOString() }) + "\n");
    }

    const { handleHarnessCreateRun } = await import("./harness/createRun.js");
    const result = await handleHarnessCreateRun({
      ...args,
      prompt,
      harness,
      model: model || undefined,
      workspace,
      interactive: false,
      maxIterations: 1,
    });

    if (jsonMode) {
      process.stdout.write(JSON.stringify({ event: "end", exitCode: result, timestamp: new Date().toISOString() }) + "\n");
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (jsonMode) {
      process.stdout.write(JSON.stringify({ event: "error", error: message, timestamp: new Date().toISOString() }) + "\n");
    } else {
      process.stderr.write(`Error: ${message}\n`);
    }
    return 1;
  }
}

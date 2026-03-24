import { dockerExec } from "./helpers";

/**
 * Create a mock harness script inside the container.
 * The script echoes the given output and exits with the given code,
 * making it available as an executable at /usr/local/bin/<name>.
 */
export function createMockHarness(
  _container: string,
  name: string,
  output: string,
  exitCode: number = 0,
): void {
  const scriptDir = `/tmp/mock-harnesses`;
  const scriptPath = `${scriptDir}/${name}`;
  // Write to /tmp (always writable), then ensure dir is on PATH
  const scriptContent = `#!/bin/bash\necho ${JSON.stringify(output)}\nexit ${exitCode}\n`;
  const b64 = Buffer.from(scriptContent).toString("base64");
  dockerExec(`mkdir -p ${scriptDir}`);
  dockerExec(`echo "${b64}" | base64 -d > ${scriptPath}`);
  dockerExec(`chmod +x ${scriptPath}`);
}

/**
 * Create a minimal process .js file in the given directory inside the container.
 * The process does a single shell task (echo hello) and returns.
 */
export function createSimpleProcess(dir: string): void {
  dockerExec(
    [
      `mkdir -p ${dir}`,
      `printf '%s' 'export async function process(inputs, ctx) { return { hello: "world" }; }' > ${dir}/proc.js`,
    ].join(" && "),
  );
}

/**
 * Remove any mock harness scripts created during tests.
 * Accepts a list of script names to clean up.
 */
export function cleanupMockHarnesses(
  container: string,
  ...names: string[]
): void {
  if (names.length === 0) return;
  const rmPaths = names.map((n) => `/tmp/mock-harnesses/${n}`).join(" ");
  dockerExec(`rm -f ${rmPaths}`);
}

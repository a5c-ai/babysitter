import type { ParsedArgs } from "./types";
import { USAGE } from "./usage";
import { handleCompressionReset } from "../commands/compression/reset";
import { handleCompressionSet } from "../commands/compression/set";
import { handleCompressionStatus } from "../commands/compression/status";
import { handleCompressionToggle } from "../commands/compression/toggle";
import { handleCompressOutput } from "../commands/compressOutput";
import { handleConfigureCommand } from "../commands/configure";
import { handleHealthCommand } from "../commands/health";
import { handleHarnessInstall, handleHarnessInstallPlugin } from "../commands/harness/install";
import { handleTokensStats } from "../commands/tokensStats";
import {
  handleHarnessDiscover,
} from "./ui";

export async function executeHarnessInfraCommand(parsed: ParsedArgs): Promise<number | undefined> {
  switch (parsed.command) {
    case "health":
      return await handleHealthCommand({ json: parsed.json, verbose: parsed.verbose });
    case "configure":
      return await handleConfigureCommand(parsed.configureSubcommand ? [parsed.configureSubcommand] : [], {
        json: parsed.json,
        defaultsOnly: parsed.defaultsOnly,
      });
    case "tokens:stats":
      return await handleTokensStats({ runId: parsed.tokensRunId, all: parsed.tokensAll, json: parsed.json, runsDir: parsed.runsDir });
    case "compression:status":
      return handleCompressionStatus({ json: parsed.json });
    case "compression:toggle":
      if (!parsed.compressionLayer) {
        console.error("compression:toggle requires <layer> and <on|off> arguments");
        console.error(USAGE);
        return 1;
      }
      if (parsed.compressionToggleValue === undefined) {
        console.error("compression:toggle requires <on|off> as the second argument");
        console.error(USAGE);
        return 1;
      }
      return await handleCompressionToggle({ layer: parsed.compressionLayer, value: parsed.compressionToggleValue, json: parsed.json });
    case "compression:set":
      if (!parsed.compressionSetKey || parsed.compressionSetValue === undefined) {
        console.error("compression:set requires <layer.key> and <value> arguments");
        console.error(USAGE);
        return 1;
      }
      return await handleCompressionSet({ key: parsed.compressionSetKey, value: parsed.compressionSetValue, json: parsed.json });
    case "compression:reset":
      return await handleCompressionReset({ json: parsed.json });
    case "compress-output":
      return handleCompressOutput({ args: parsed.compressOutputArgs ?? [] });
    case "discover":
    case "list":
      return await handleHarnessDiscover(parsed);
    case "harness:install":
      return await handleHarnessInstall({
        harnessName: parsed.positional?.[0],
        workspace: parsed.workspace,
        json: parsed.json,
        dryRun: parsed.dryRun,
        verbose: parsed.verbose,
      });
    case "harness:install-plugin":
      return await handleHarnessInstallPlugin({
        harnessName: parsed.positional?.[0],
        workspace: parsed.workspace,
        json: parsed.json,
        dryRun: parsed.dryRun,
        verbose: parsed.verbose,
      });
    default:
      return undefined;
  }
}

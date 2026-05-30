import { Command } from "commander";
import { ResponderMatcher } from "../../client/index.js";
import { formatResponder, formatTable, printError } from "../output.js";

interface GlobalOpts {
  serverUrl?: string;
  json?: boolean;
  responderDir?: string;
  repoRoot?: string;
  configRoot?: string;
}

interface ListOpts {
  domain?: string;
}

interface SearchOpts extends ListOpts {
  available?: boolean;
}

function matchesResponderQuery(responder: { id: string; name: string; title: string; domains: string[]; tags: string[] }, query: string): boolean {
  const needle = query.toLowerCase();
  return [
    responder.id,
    responder.name,
    responder.title,
    ...responder.domains,
    ...responder.tags,
  ].join(" ").toLowerCase().includes(needle);
}

export function createRespondersCommand(): Command {
  const cmd = new Command("responders").description("Manage and view responder profiles");

  cmd
    .command("list")
    .description("List available responders")
    .option("-d, --domain <domain>", "Filter by domain")
    .action(async (opts, command: Command) => {
      const allOpts: GlobalOpts & ListOpts = command.optsWithGlobals();
      const localOpts = opts as ListOpts;
      const jsonMode = allOpts.json === true;
      try {
        const matcher = new ResponderMatcher({
          responderDir: allOpts.responderDir,
          repoRoot: allOpts.repoRoot,
          configRoot: allOpts.configRoot,
        });
        const responders = await matcher.loadResponders();

        let filtered = responders;
        if (localOpts.domain) {
          const domain = localOpts.domain.toLowerCase();
          filtered = responders.filter((r) =>
            r.domains.some((d) => d.toLowerCase().includes(domain)),
          );
        }

        if (jsonMode) {
          console.log(JSON.stringify(filtered, null, 2));
        } else if (filtered.length === 0) {
          console.log("No responders found.");
        } else {
          const rows = filtered.map((r) => [
            r.id,
            r.name,
            r.title,
            r.availability ? "yes" : "no",
            r.domains.join(", "),
          ]);
          console.log(
            formatTable(rows, ["ID", "Name", "Title", "Available", "Domains"]),
          );
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("search")
    .description("Search responder profiles")
    .argument("<query>", "Search query")
    .option("-d, --domain <domain>", "Filter by domain")
    .option("--available", "Only show available responders")
    .action(async (query: string, opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts & SearchOpts = command.optsWithGlobals();
      const localOpts = opts as SearchOpts;
      const jsonMode = allOpts.json === true;
      try {
        const matcher = new ResponderMatcher({
          responderDir: allOpts.responderDir,
          repoRoot: allOpts.repoRoot,
          configRoot: allOpts.configRoot,
        });
        const responders = await matcher.loadResponders();
        const domain = localOpts.domain?.toLowerCase();
        const filtered = responders.filter((responder) => {
          if (localOpts.available === true && !responder.availability) return false;
          if (domain && !responder.domains.some((d) => d.toLowerCase().includes(domain))) return false;
          return matchesResponderQuery(responder, query);
        });

        if (jsonMode) {
          console.log(JSON.stringify(filtered, null, 2));
        } else if (filtered.length === 0) {
          console.log("No responders found.");
        } else {
          const rows = filtered.map((r) => [
            r.id,
            r.name,
            r.title,
            r.availability ? "yes" : "no",
            r.domains.join(", "),
          ]);
          console.log(formatTable(rows, ["ID", "Name", "Title", "Available", "Domains"]));
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("stats")
    .description("Show responder profile statistics")
    .action(async (_opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;
      try {
        const matcher = new ResponderMatcher({
          responderDir: allOpts.responderDir,
          repoRoot: allOpts.repoRoot,
          configRoot: allOpts.configRoot,
        });
        const responders = await matcher.loadResponders();
        const stats = {
          total: responders.length,
          available: responders.filter((r) => r.availability).length,
          unavailable: responders.filter((r) => !r.availability).length,
          byType: responders.reduce<Record<string, number>>((acc, responder) => {
            const type = responder.type ?? "human";
            acc[type] = (acc[type] ?? 0) + 1;
            return acc;
          }, {}),
        };

        if (jsonMode) {
          console.log(JSON.stringify(stats, null, 2));
        } else {
          console.log(formatTable([
            ["total", String(stats.total)],
            ["available", String(stats.available)],
            ["unavailable", String(stats.unavailable)],
          ], ["Metric", "Value"]));
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("show")
    .description("Show responder profile details")
    .argument("<responderId>", "Responder ID")
    .action(async (responderId: string, _opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;
      try {
        const matcher = new ResponderMatcher({
          responderDir: allOpts.responderDir,
          repoRoot: allOpts.repoRoot,
          configRoot: allOpts.configRoot,
        });
        const responders = await matcher.loadResponders();
        const responder = responders.find((r) => r.id === responderId);

        if (!responder) {
          throw new Error(`Responder not found: ${responderId}`);
        }

        console.log(formatResponder(responder, jsonMode));
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  return cmd;
}

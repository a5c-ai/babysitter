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

interface SearchOpts {
  query?: string;
  domain?: string;
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
    .option("-q, --query <text>", "Text query")
    .option("-d, --domain <domain>", "Filter by domain")
    .action(async (opts, command: Command) => {
      const allOpts: GlobalOpts & SearchOpts = command.optsWithGlobals();
      const localOpts = opts as SearchOpts;
      const jsonMode = allOpts.json === true;
      try {
        const matcher = new ResponderMatcher({
          responderDir: allOpts.responderDir,
          repoRoot: allOpts.repoRoot,
          configRoot: allOpts.configRoot,
        });
        const query = localOpts.query?.toLowerCase();
        const domain = localOpts.domain?.toLowerCase();
        const responders = (await matcher.loadResponders()).filter((responder) => {
          if (domain && !responder.domains.some((item) => item.toLowerCase().includes(domain))) {
            return false;
          }
          if (!query) return true;
          return [
            responder.id,
            responder.name,
            responder.title,
            ...responder.domains,
          ].join("\n").toLowerCase().includes(query);
        });

        if (jsonMode) {
          console.log(JSON.stringify(responders, null, 2));
        } else if (responders.length === 0) {
          console.log("No responders found.");
        } else {
          const rows = responders.map((r) => [
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
        const byDomain = responders.reduce<Record<string, number>>((acc, responder) => {
          for (const domain of responder.domains) acc[domain] = (acc[domain] ?? 0) + 1;
          return acc;
        }, {});
        const stats = {
          total: responders.length,
          available: responders.filter((responder) => responder.availability).length,
          unavailable: responders.filter((responder) => !responder.availability).length,
          byDomain,
        };

        console.log(JSON.stringify(stats, null, 2));
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

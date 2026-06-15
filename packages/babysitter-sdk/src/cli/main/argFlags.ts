import type { ParsedArgs } from "./types";

export { FLAG_PARSERS } from "./argFlagParsers";

export const BOOLEAN_FLAGS: Record<string, (parsed: ParsedArgs) => void> = {
  "--json": (parsed) => {
    parsed.json = true;
  },
  "--dry-run": (parsed) => {
    parsed.dryRun = true;
  },
  "--verbose": (parsed) => {
    parsed.verbose = true;
  },
  "--pending": (parsed) => {
    parsed.pendingOnly = true;
  },
  "--reverse": (parsed) => {
    parsed.reverseOrder = true;
  },
  "--show-config": (parsed) => {
    parsed.showConfig = true;
  },
  "--show-strata": (parsed) => {
    parsed.showStrata = true;
  },
  "--defaults-only": (parsed) => {
    parsed.defaultsOnly = true;
  },
  "--tree": (parsed) => {
    parsed.tree = true;
  },
  "--rich": (parsed) => {
    parsed.rich = true;
  },
  "--foreground": (parsed) => {
    parsed.foreground = true;
  },
  "--interactive": (parsed) => {
    parsed.interactive = true;
  },
  "--no-interactive": (parsed) => {
    parsed.interactive = false;
  },
  "--non-interactive": (parsed) => {
    parsed.interactive = false;
  },
  "--include-remote": (parsed) => {
    parsed.includeRemote = true;
  },
  "--summary-only": (parsed) => {
    parsed.summaryOnly = true;
  },
  "--user": (parsed) => {
    parsed.profileUser = true;
  },
  "--project": (parsed) => {
    parsed.profileProject = true;
    parsed.pluginScope = "project";
  },
  "--force": (parsed) => {
    parsed.pluginForce = true;
    parsed.sessionForce = true;
  },
  "--global": (parsed) => {
    parsed.pluginScope = "global";
  },
  "--all": (parsed) => {
    parsed.tokensAll = true;
    parsed.costAll = true;
    parsed.retrospectAll = true;
  },
  "--tui": (parsed) => {
    parsed.tuiFlag = true;
  },
};

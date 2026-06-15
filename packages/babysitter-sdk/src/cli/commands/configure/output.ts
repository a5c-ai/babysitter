import type {
  ConfigurePathsResult,
  ConfigureShowResult,
  ConfigureValidateResult,
} from "../configure";

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
} as const;

export function supportsColors(): boolean {
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }
  if (process.env.FORCE_COLOR !== undefined) {
    return true;
  }
  return Boolean(process.stdout && typeof process.stdout.isTTY === "boolean" && process.stdout.isTTY);
}

export function outputShowTable(result: ConfigureShowResult, useColors: boolean, docBaseUrl: string): void {
  console.log("");
  const header = useColors
    ? `${COLORS.bold}${COLORS.cyan}Babysitter SDK Configuration${COLORS.reset}`
    : "Babysitter SDK Configuration";
  console.log(header);
  console.log("");

  const headers = ["Setting", "Value", "Source"];
  const rows: string[][] = [headers];

  for (const item of result.values) {
    const sourceStr =
      item.source === "env"
        ? useColors
          ? `${COLORS.green}env${COLORS.reset}`
          : "env"
        : useColors
          ? `${COLORS.dim}default${COLORS.reset}`
          : "default";

    rows.push([item.key, formatValue(item.value), sourceStr]);
  }

  const widths = calculateColumnWidths(rows);
  const headerRow = headers.map((headerValue, index) => padString(
    useColors ? `${COLORS.bold}${headerValue}${COLORS.reset}` : headerValue,
    widths[index],
  ));
  console.log("  " + headerRow.join("  "));

  const separator = widths.map((width) => "-".repeat(width)).join("  ");
  console.log("  " + (useColors ? `${COLORS.dim}${separator}${COLORS.reset}` : separator));

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index].map((cell, cellIndex) => padString(cell, widths[cellIndex]));
    console.log("  " + row.join("  "));
  }

  console.log("");

  const envOverridden = result.values.filter((value) => value.source === "env");
  if (envOverridden.length > 0) {
    console.log(useColors ? `${COLORS.cyan}Environment Overrides:${COLORS.reset}` : "Environment Overrides:");
    for (const item of envOverridden) {
      console.log(`  ${item.envVar} = ${formatValue(item.value)}`);
    }
    console.log("");
  }

  const docHint = useColors
    ? `${COLORS.dim}Documentation: ${docBaseUrl}${COLORS.reset}`
    : `Documentation: ${docBaseUrl}`;
  console.log(docHint);
  console.log("");
}

export function outputValidateResult(result: ConfigureValidateResult, useColors: boolean): void {
  console.log("");

  const statusIcon = result.valid
    ? useColors
      ? `${COLORS.green}\u2713${COLORS.reset}`
      : "[PASS]"
    : useColors
      ? `${COLORS.red}\u2717${COLORS.reset}`
      : "[FAIL]";

  const statusText = result.valid ? "Configuration is valid" : "Configuration has errors";
  const header = useColors
    ? `${COLORS.bold}${statusIcon} ${statusText}${COLORS.reset}`
    : `${statusIcon} ${statusText}`;
  console.log(header);
  console.log("");

  if (result.errors.length > 0) {
    console.log(useColors ? `${COLORS.red}${COLORS.bold}Errors:${COLORS.reset}` : "Errors:");
    for (const error of result.errors) {
      const bullet = useColors ? `${COLORS.red}\u2022${COLORS.reset}` : "-";
      console.log(`  ${bullet} ${error}`);
    }
    console.log("");
  }

  if (result.warnings.length > 0) {
    console.log(useColors ? `${COLORS.yellow}${COLORS.bold}Warnings:${COLORS.reset}` : "Warnings:");
    for (const warning of result.warnings) {
      const bullet = useColors ? `${COLORS.yellow}\u2022${COLORS.reset}` : "-";
      console.log(`  ${bullet} ${warning}`);
    }
    console.log("");
  }

  if (result.valid && result.warnings.length === 0) {
    console.log(
      useColors
        ? `${COLORS.dim}All configuration values are within valid ranges.${COLORS.reset}`
        : "All configuration values are within valid ranges.",
    );
    console.log("");
  }
}

export function outputPathsResult(result: ConfigurePathsResult, useColors: boolean): void {
  console.log("");
  const header = useColors
    ? `${COLORS.bold}${COLORS.cyan}Babysitter SDK Paths${COLORS.reset}`
    : "Babysitter SDK Paths";
  console.log(header);
  console.log("");

  for (const pathInfo of result.paths) {
    const existsIcon = pathInfo.exists
      ? useColors
        ? `${COLORS.green}\u2713${COLORS.reset}`
        : "[EXISTS]"
      : useColors
        ? `${COLORS.yellow}\u2717${COLORS.reset}`
        : "[MISSING]";
    const nameStr = useColors
      ? `${COLORS.bold}${pathInfo.name}${COLORS.reset}`
      : pathInfo.name;
    const descStr = useColors
      ? `${COLORS.dim}${pathInfo.description}${COLORS.reset}`
      : pathInfo.description;

    console.log(`  ${existsIcon} ${nameStr}`);
    console.log(`      Path: ${pathInfo.path}`);
    console.log(`      ${descStr}`);
    console.log("");
  }
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return String(value);
}

function calculateColumnWidths(rows: string[][]): number[] {
  if (rows.length === 0) {
    return [];
  }
  const numCols = rows[0].length;
  const widths: number[] = new Array<number>(numCols).fill(0);
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /\x1b\[[0-9;]*m/g;

  for (const row of rows) {
    for (let index = 0; index < row.length; index += 1) {
      widths[index] = Math.max(widths[index], row[index].replace(ansiRegex, "").length);
    }
  }

  return widths;
}

function padString(value: string, width: number): string {
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/\x1b\[[0-9;]*m/g, "");
  return value + " ".repeat(Math.max(0, width - stripped.length));
}

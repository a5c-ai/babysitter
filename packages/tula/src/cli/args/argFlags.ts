import {
  BOOLEAN_FLAGS as CORE_BOOLEAN_FLAGS,
  FLAG_PARSERS as CORE_FLAG_PARSERS,
} from "@a5c-ai/babysitter-sdk";
import type { HarnessParsedArgs } from "./types";

type FlagParser = (parsed: HarnessParsedArgs, args: string[], index: number) => number;

function expectFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function parseIntegerFlag(raw: string): number {
  return parseInt(raw, 10);
}

export const BOOLEAN_FLAGS: Record<string, (parsed: HarnessParsedArgs) => void> = {
  ...CORE_BOOLEAN_FLAGS as Record<string, (parsed: HarnessParsedArgs) => void>,
  "--mcp": (parsed) => {
    parsed.anycliMcp = true;
  },
};

export const FLAG_PARSERS: Record<string, FlagParser> = {
  ...CORE_FLAG_PARSERS as Record<string, FlagParser>,
  "--transport": (parsed, args, index) => {
    parsed.transport = expectFlagValue(args, index + 1, "--transport");
    parsed.anycliTransport = parsed.transport;
    return index + 1;
  },
  "--service": (parsed, args, index) => {
    parsed.anycliService = expectFlagValue(args, index + 1, "--service");
    return index + 1;
  },
  "--scope": (parsed, args, index) => {
    parsed.anycliScope = expectFlagValue(args, index + 1, "--scope");
    return index + 1;
  },
  "--auth-file": (parsed, args, index) => {
    parsed.anycliAuthFile = expectFlagValue(args, index + 1, "--auth-file");
    return index + 1;
  },
  "--port": (parsed, args, index) => {
    parsed.port = parseIntegerFlag(expectFlagValue(args, index + 1, "--port"));
    return index + 1;
  },
  "--host": (parsed, args, index) => {
    parsed.host = expectFlagValue(args, index + 1, "--host");
    return index + 1;
  },
  "--auth-token": (parsed, args, index) => {
    parsed.authToken = expectFlagValue(args, index + 1, "--auth-token");
    return index + 1;
  },
  "--ws-ping-interval": (parsed, args, index) => {
    parsed.wsPingInterval = parseIntegerFlag(expectFlagValue(args, index + 1, "--ws-ping-interval"));
    return index + 1;
  },
  "--ws-grace-period": (parsed, args, index) => {
    parsed.wsGracePeriod = parseIntegerFlag(expectFlagValue(args, index + 1, "--ws-grace-period"));
    return index + 1;
  },
  "--ws-max-mps": (parsed, args, index) => {
    parsed.wsMaxMps = parseIntegerFlag(expectFlagValue(args, index + 1, "--ws-max-mps"));
    return index + 1;
  },
  "--output-format": (parsed, args, index) => {
    const value = expectFlagValue(args, index + 1, "--output-format");
    if (value !== "json" && value !== "text" && value !== "amux-events") {
      throw new Error(`--output-format must be one of: json, text, amux-events (got "${value}")`);
    }
    parsed.outputFormat = value;
    return index + 1;
  },
};

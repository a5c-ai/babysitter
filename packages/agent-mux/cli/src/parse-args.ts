/**
 * Lightweight argument parser for the amux CLI.
 *
 * Zero external dependencies. Handles:
 * - Long flags (--flag, --flag=value, --no-flag for booleans)
 * - Short flags (-a, -a value, combined -abc)
 * - Positional arguments
 * - -- terminator
 * - Repeatable flags (--tag x --tag y)
 */

/** Parsed CLI arguments. */
export interface ParsedArgs {
  /** The command (e.g., 'run', 'adapters'). */
  command: string | undefined;

  /** The subcommand (e.g., 'list', 'show'). */
  subcommand: string | undefined;

  /** Remaining positional arguments after command/subcommand. */
  positionals: string[];

  /** Named flags. Boolean flags are true/false. String/number flags are strings. */
  flags: Record<string, string | boolean | string[]>;
}

/** Known flag definition for the parser. */
export interface FlagDef {
  /** Short alias (single character). */
  short?: string;

  /** Flag type. */
  type: 'boolean' | 'string' | 'number';

  /** Whether the flag can be specified multiple times. */
  repeatable?: boolean;
}

/**
 * Global flags recognized by all commands.
 */
export const GLOBAL_FLAGS: Record<string, FlagDef> = {
  'agent': { short: 'a', type: 'string' },
  'model': { short: 'm', type: 'string' },
  'json': { type: 'boolean' },
  'debug': { type: 'boolean' },
  'config-dir': { type: 'string' },
  'project-dir': { type: 'string' },
  'log-level': { type: 'string' },
  'log-file': { type: 'string' },
  'no-color': { type: 'boolean' },
  'version': { short: 'V', type: 'boolean' },
  'help': { short: 'h', type: 'boolean' },
  'completions': { type: 'string' },
};

/** Known commands — first positional is treated as command if it matches. */
const COMMANDS = new Set([
  'run', 'install', 'uninstall', 'update', 'detect', 'detect-host',
  'remote', 'hooks',
  'adapters', 'capabilities', 'models',
  'plugins', 'plugin', 'mcp', 'sessions', 'cost', 'config', 'profiles',
  'auth', 'init', 'version', 'help', 'doctor', 'tui', 'skill', 'agent',
  'gateway', 'launch', 'workspaces',
]);

/** Commands that have subcommands. */
const SUBCOMMAND_COMMANDS = new Set([
  'adapters', 'models', 'plugins', 'plugin', 'mcp', 'sessions', 'config', 'profiles', 'auth',
  'remote', 'hooks', 'skill', 'agent',
  'gateway', 'workspaces',
]);

/**
 * Parse argv into structured args.
 *
 * @param argv - Arguments (typically process.argv.slice(2))
 * @param extraFlags - Additional command-specific flag definitions
 */
export function parseArgs(
  argv: string[],
  extraFlags?: Record<string, FlagDef>,
): ParsedArgs {
  const allFlags: Record<string, FlagDef> = { ...GLOBAL_FLAGS, ...extraFlags };

  // Build short-to-long map
  const shortMap = new Map<string, string>();
  for (const [long, def] of Object.entries(allFlags)) {
    if (def.short) {
      shortMap.set(def.short, long);
    }
  }

  const flags: Record<string, string | boolean | string[]> = {};
  const positionals: string[] = [];
  let terminated = false;

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i]!;

    if (terminated) {
      positionals.push(arg);
      i++;
      continue;
    }

    if (arg === '--') {
      terminated = true;
      i++;
      continue;
    }

    if (arg.startsWith('--')) {
      // Long flag
      let name: string;
      let value: string | undefined;

      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        name = arg.slice(2, eqIdx);
        value = arg.slice(eqIdx + 1);
      } else {
        name = arg.slice(2);
      }

      // Handle --no-X for booleans
      let negated = false;
      if (name.startsWith('no-') && !allFlags[name] && allFlags[name.slice(3)]) {
        negated = true;
        name = name.slice(3);
      }

      const def = allFlags[name];

      if (negated) {
        flags[name] = false;
        i++;
        continue;
      }

      if (def && def.type === 'boolean') {
        flags[name] = true;
        i++;
        continue;
      }

      // String or number flag, or unknown (treat as string)
      if (value === undefined) {
        i++;
        if (i < argv.length) {
          value = argv[i]!;
        } else {
          // Flag without value — treat as boolean true for unknown flags
          flags[name] = true;
          continue;
        }
      }

      if (def?.repeatable) {
        const existing = flags[name];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else if (typeof existing === 'string') {
          flags[name] = [existing, value];
        } else {
          flags[name] = [value];
        }
      } else {
        flags[name] = value;
      }

      i++;
      continue;
    }

    if (arg.startsWith('-') && arg.length > 1) {
      // Short flag(s)
      const chars = arg.slice(1);

      if (chars.length === 1) {
        const longName = shortMap.get(chars) ?? chars;
        const def = allFlags[longName];

        if (def && def.type === 'boolean') {
          flags[longName] = true;
          i++;
          continue;
        }

        // Needs a value
        i++;
        if (i < argv.length) {
          flags[longName] = argv[i]!;
        } else {
          flags[longName] = true;
        }
        i++;
        continue;
      }

      // Multiple combined short flags (all boolean except possibly last)
      for (let j = 0; j < chars.length; j++) {
        const ch = chars[j]!;
        const longName = shortMap.get(ch) ?? ch;
        const def = allFlags[longName];

        if (j < chars.length - 1) {
          // Not the last char — must be boolean
          flags[longName] = true;
        } else {
          // Last char — could take a value
          if (def && def.type === 'boolean') {
            flags[longName] = true;
          } else {
            // Next arg is the value
            i++;
            if (i < argv.length) {
              flags[longName] = argv[i]!;
            } else {
              flags[longName] = true;
            }
          }
        }
      }

      i++;
      continue;
    }

    // Positional argument
    positionals.push(arg);
    i++;
  }

  // Extract command and subcommand from positionals
  let command: string | undefined;
  let subcommand: string | undefined;
  const restPositionals: string[] = [];

  if (positionals.length > 0 && COMMANDS.has(positionals[0]!)) {
    command = positionals[0];
    if (
      positionals.length > 1 &&
      SUBCOMMAND_COMMANDS.has(command!) &&
      !positionals[1]!.startsWith('-')
    ) {
      subcommand = positionals[1];
      restPositionals.push(...positionals.slice(2));
    } else {
      restPositionals.push(...positionals.slice(1));
    }
  } else {
    restPositionals.push(...positionals);
  }

  return {
    command,
    subcommand,
    positionals: restPositionals,
    flags,
  };
}

/**
 * Get a flag value as a string, or undefined.
 */
export function flagStr(flags: Record<string, string | boolean | string[]>, name: string): string | undefined {
  const val = flags[name];
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && val.length > 0) return val[val.length - 1];
  return undefined;
}

/**
 * Get a flag value as a number, or undefined.
 */
export function flagNum(flags: Record<string, string | boolean | string[]>, name: string): number | undefined {
  const s = flagStr(flags, name);
  if (s === undefined) return undefined;
  const n = Number(s);
  if (Number.isNaN(n)) return undefined;
  return n;
}

/**
 * Get a flag value as a boolean.
 */
export function flagBool(flags: Record<string, string | boolean | string[]>, name: string): boolean | undefined {
  const val = flags[name];
  if (typeof val === 'boolean') return val;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
}

/**
 * Get a flag value as a string array (for repeatable flags).
 */
export function flagArr(flags: Record<string, string | boolean | string[]>, name: string): string[] {
  const val = flags[name];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return [val];
  return [];
}

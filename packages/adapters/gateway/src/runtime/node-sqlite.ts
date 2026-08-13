/**
 * The single load point for the built-in `node:sqlite` module (FIX-008).
 *
 * Node.js added `node:sqlite` in v22.5.0 behind `--experimental-sqlite` and
 * only made it loadable without that flag in v22.13.0
 * (https://nodejs.org/docs/latest-v22.x/api/sqlite.html). The gateway loads
 * SQLite eagerly from the token store, the bootstrap auth store and the run
 * event-log index, and `src/index.ts` eagerly re-exports the SQLite token
 * store, so importing the package root on any older runtime is fatal.
 *
 * `engines.node` in `package.json`, the README runtime requirements and the
 * `gateway-node-engine` CI matrix must all stay pinned to
 * `GATEWAY_MINIMUM_NODE_VERSION`; `tests/node-engine-floor.test.ts` enforces
 * that and re-derives the floor from the built-ins the packed root actually
 * loads.
 */
import { createRequire } from 'node:module';

/** First Node.js release that exposes `node:sqlite` without a CLI flag. */
export const GATEWAY_MINIMUM_NODE_VERSION = '22.13.0';

function parseNodeVersion(version: string): [number, number, number] {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new Error(`Unrecognized Node.js version string: ${JSON.stringify(version)}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Fail fast with an actionable engine diagnostic instead of letting the runtime
 * surface a bare ERR_UNKNOWN_BUILTIN_MODULE for `node:sqlite`. This is a
 * preflight assertion, not a fallback: there is no degraded SQLite-less mode.
 */
export function assertNodeSupportsGatewaySqlite(version: string = process.versions.node): void {
  const actual = parseNodeVersion(version);
  const required = parseNodeVersion(GATEWAY_MINIMUM_NODE_VERSION);
  for (let index = 0; index < 3; index += 1) {
    if (actual[index] > required[index]) {
      return;
    }
    if (actual[index] < required[index]) {
      throw new Error(
        `@a5c-ai/adapters-gateway requires Node.js >=${GATEWAY_MINIMUM_NODE_VERSION}, but this process is running ` +
          `Node.js v${version}. The gateway loads the built-in node:sqlite module, which is only available without ` +
          `--experimental-sqlite from Node.js v${GATEWAY_MINIMUM_NODE_VERSION} onward. Upgrade Node.js to ` +
          `>=${GATEWAY_MINIMUM_NODE_VERSION}.`,
      );
    }
  }
}

assertNodeSupportsGatewaySqlite();

const require = createRequire(import.meta.url);

export const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (path: string) => any;
};

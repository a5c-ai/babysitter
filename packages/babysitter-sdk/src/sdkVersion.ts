import { readFileSync } from "node:fs";
import * as path from "node:path";

const pkg = JSON.parse(
  readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
) as { version?: unknown };

export const BABYSITTER_SDK_VERSION =
  typeof pkg.version === "string" && pkg.version.trim() !== ""
    ? pkg.version
    : "0.0.0-unknown";

export function withSdkVersion<T extends object>(record: T): T & { sdkVersion: string } {
  return {
    ...record,
    sdkVersion: BABYSITTER_SDK_VERSION,
  };
}

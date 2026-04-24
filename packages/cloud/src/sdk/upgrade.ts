import type { CloudConfig, InstallOptions, InstallResult } from "../types.js";
import { installEnvironment } from "./deploy.js";

export async function upgradeEnvironment(config: CloudConfig, options: InstallOptions = {}): Promise<InstallResult> {
  return await installEnvironment(config, options);
}


import { listMarketplaces } from '../../../plugins/marketplace';
import type { PluginScope } from '../../../plugins/types';

export interface PluginCommandArgs {
  pluginName?: string;
  marketplaceName?: string;
  marketplaceUrl?: string;
  marketplacePath?: string;
  marketplaceBranch?: string;
  pluginVersion?: string;
  scope?: 'global' | 'project';
  json: boolean;
  verbose?: boolean;
  runsDir?: string;
  force?: boolean;
}

export function validateScope(scope: string | undefined): scope is PluginScope {
  return scope === 'global' || scope === 'project';
}

export function requireArg(
  value: string | undefined,
  name: string,
  command: string,
  json: boolean,
): string | null {
  if (!value) {
    const message = `[${command}] ${name} is required`;
    if (json) {
      console.log(JSON.stringify({ error: 'missing_argument', message }));
    } else {
      console.error(message);
    }
    return null;
  }
  return value;
}

export function requireScope(
  scope: string | undefined,
  command: string,
  json: boolean,
): scope is PluginScope {
  if (!validateScope(scope)) {
    const message = `[${command}] --global or --project is required`;
    if (json) {
      console.log(JSON.stringify({ error: 'missing_argument', message }));
    } else {
      console.error(message);
    }
    return false;
  }
  return true;
}

export function getProjectDir(scope: PluginScope): string | undefined {
  return scope === 'project' ? process.cwd() : undefined;
}

export async function autoResolveMarketplace(
  scope: PluginScope,
  projectDir?: string,
): Promise<string | null> {
  const marketplaces = await listMarketplaces(scope, projectDir);
  return marketplaces.length === 1 ? marketplaces[0] : null;
}

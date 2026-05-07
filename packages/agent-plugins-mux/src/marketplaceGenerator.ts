// Marketplace file generator
// Generates marketplace.json for targets that use marketplace distribution

import * as path from 'path';
import type { A5cPluginManifest, TargetProfile } from './types.js';

export function generateMarketplaceJson(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  pluginOutputDir: string,
  outputBaseDir: string,
): string {
  const authorName = typeof manifest.author === 'string'
    ? manifest.author
    : manifest.author.name;
  const relativePluginPath = path.relative(outputBaseDir, pluginOutputDir).replace(/\\/g, '/');
  const pluginSourcePath = relativePluginPath.startsWith('.')
    ? relativePluginPath
    : `./${relativePluginPath}`;

  if (targetProfile.packageMetadata?.activationMessage === 'codex-open-plugins') {
    return JSON.stringify({
      name: `${manifest.name}-local`,
      interface: {
        displayName: `${manifest.name.charAt(0).toUpperCase() + manifest.name.slice(1)} Local`,
      },
      plugins: [{
        name: manifest.name,
        source: {
          source: 'local',
          path: pluginSourcePath,
        },
        policy: {
          installation: 'AVAILABLE',
          authentication: 'ON_INSTALL',
        },
        category: 'Coding',
      }],
    }, null, 2) + '\n';
  }

  return JSON.stringify({
    name: authorName,
    owner: {
      name: authorName,
      email: `support@${authorName}`,
    },
    plugins: [{
      name: manifest.name,
      source: pluginSourcePath,
      description: manifest.description,
      version: manifest.version,
      author: { name: authorName },
    }],
  }, null, 2) + '\n';
}

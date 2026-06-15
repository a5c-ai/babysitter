// Unified installation instructions generator for all targets

import * as fs from 'fs';
import * as path from 'path';
import type { A5cPluginManifest, TargetProfile } from './types.js';
import {
  resolveSdkConfig,
  resolveTargetCliName,
  resolveTargetNpmPackageName,
} from './sdkConfig.js';

export function generateInstallInstructions(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  sourceDir?: string
): string {
  // If a README.template.md exists in the source dir, use it
  if (sourceDir) {
    const templatePath = path.join(sourceDir, 'README.template.md');
    if (fs.existsSync(templatePath)) {
      return renderTemplate(
        fs.readFileSync(templatePath, 'utf-8'),
        manifest,
        targetProfile
      );
    }
  }

  return renderDefault(manifest, targetProfile);
}

function renderTemplate(
  template: string,
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const sdk = resolveSdkConfig(manifest);
  const npmPkg = resolveTargetNpmPackageName(manifest, targetProfile);
  const cliName = resolveTargetCliName(manifest, targetProfile);

  const skillNames = manifest.skills
    ? manifest.skills.map(s => s.name).join(', ')
    : 'none';

  const hookNames = manifest.hooks
    ? Object.keys(manifest.hooks)
        .filter(h => {
          const val = manifest.hooks![h];
          if (val === null) return false;
          return targetProfile.supportedHooks.has(h);
        })
        .join(', ')
    : 'none';

  const commandList = getCommandNames(manifest).join(', ') || 'none';

  const hasBinScripts = targetProfile.distribution === 'npm-cli' || targetProfile.distribution === 'both';
  const hasExtension = targetProfile.adapterFamily === 'programmatic';

  let installInstructions: string;
  switch (targetProfile.distribution) {
    case 'marketplace':
      installInstructions = generateMarketplaceBlock(targetProfile, sdk.cli);
      break;
    case 'npm-cli':
      installInstructions = generateNpmCliBlock(targetProfile, npmPkg, cliName);
      break;
    case 'both':
      installInstructions = `### Option 1: Marketplace (Recommended)\n\n${generateMarketplaceBlock(targetProfile, sdk.cli)}\n\n### Option 2: npm Install\n\n${generateNpmCliBlock(targetProfile, npmPkg, cliName)}`;
      break;
  }

  let verifyCommands = '';
  if (targetProfile.npmPublishable) {
    verifyCommands += `npm ls -g ${npmPkg} --depth=0\n`;
  }
  verifyCommands += `${sdk.cli} harness:discover --json | grep ${targetProfile.adapterName}`;

  let result = template;
  result = result.replace(/\{\{name\}\}/g, manifest.name);
  result = result.replace(/\{\{description\}\}/g, manifest.description);
  result = result.replace(/\{\{targetDisplayName\}\}/g, targetProfile.displayName);
  result = result.replace(/\{\{installInstructions\}\}/g, installInstructions);
  result = result.replace(/\{\{skillNames\}\}/g, skillNames);
  result = result.replace(/\{\{hookNames\}\}/g, hookNames);
  result = result.replace(/\{\{commandList\}\}/g, commandList);
  result = result.replace(/\{\{verifyCommands\}\}/g, verifyCommands);

  // Conditional blocks: {{#if flag}}...{{/if}}
  result = replaceConditional(result, 'hasBinScripts', hasBinScripts);
  result = replaceConditional(result, 'hasExtension', hasExtension);

  return result;
}

function replaceConditional(text: string, flag: string, value: boolean): string {
  const pattern = new RegExp(`\\{\\{#if ${flag}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, 'g');
  return text.replace(pattern, value ? '$1' : '');
}

function getCommandNames(manifest: A5cPluginManifest): string[] {
  if (!manifest.commands) return [];
  if (typeof manifest.commands === 'string') return ['(directory)'];
  return manifest.commands.map(c => c.replace(/\.md$/, ''));
}

function generateMarketplaceBlock(targetProfile: TargetProfile, sdkCli: string): string {
  return `\`\`\`bash\n${sdkCli} harness:install-plugin ${targetProfile.name}\n\`\`\``;
}

function generateNpmCliBlock(
  targetProfile: TargetProfile,
  npmPkg: string,
  cliName: string
): string {
  const lines = [
    '```bash',
    `npm install -g ${npmPkg}`,
    `${cliName} install --global`,
    '```',
    '',
  ];
  if (targetProfile.packageMetadata?.activationMessage === 'codex-open-plugins') {
    lines.push('Then open Codex and navigate to `/plugins` to activate the plugin.');
  } else {
    lines.push(`Restart ${targetProfile.displayName} to pick up the installed plugin.`);
  }
  return lines.join('\n');
}

function renderDefault(
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile
): string {
  const sdk = resolveSdkConfig(manifest);
  const npmPkg = resolveTargetNpmPackageName(manifest, targetProfile);
  const cliName = resolveTargetCliName(manifest, targetProfile);
  const sections: string[] = [];

  sections.push(`# ${manifest.name} — ${targetProfile.displayName} Plugin`);
  sections.push('');
  sections.push(manifest.description);
  sections.push('');
  sections.push('## Prerequisites');
  sections.push('');
  sections.push('Install the SDK CLI:');
  sections.push('');
  sections.push('```bash');
  sections.push(`npm install -g ${sdk.package}`);
  sections.push('```');
  sections.push('');
  sections.push('## Installation');
  sections.push('');

  switch (targetProfile.distribution) {
    case 'marketplace':
      sections.push(generateMarketplaceBlock(targetProfile, sdk.cli));
      break;
    case 'npm-cli':
      sections.push(generateNpmCliBlock(targetProfile, npmPkg, cliName));
      break;
    case 'both':
      sections.push('### Option 1: Marketplace (Recommended)');
      sections.push('');
      sections.push(generateMarketplaceBlock(targetProfile, sdk.cli));
      sections.push('');
      sections.push('### Option 2: npm Install');
      sections.push('');
      sections.push(generateNpmCliBlock(targetProfile, npmPkg, cliName));
      break;
  }

  sections.push('');
  if (targetProfile.npmPublishable) {
    sections.push('### Workspace Install');
    sections.push('');
    sections.push('```bash');
    sections.push(`npx -y ${npmPkg} install --workspace .`);
    sections.push('```');
    sections.push('');
  }

  sections.push('## Verification');
  sections.push('');
  sections.push('```bash');
  if (targetProfile.npmPublishable) {
    sections.push(`npm ls -g ${npmPkg} --depth=0`);
  }
  sections.push(`${sdk.cli} harness:discover --json | grep ${targetProfile.adapterName}`);
  sections.push('```');

  return sections.join('\n');
}

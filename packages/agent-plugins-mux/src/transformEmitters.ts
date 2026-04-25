// Manifest generators and file copy functions for the transform stage

import * as fs from 'fs';
import * as path from 'path';
import type { A5cPluginManifest, TargetProfile, TransformedFile, Diagnostic } from './types.js';
import {
  generateClaudeCodeManifest,
  generateCodexManifest,
  generateCursorManifest,
  generateGeminiManifest,
  generateGithubCopilotManifest,
  generatePiManifest,
  generateOhMyPiManifest,
  generateOpenCodeManifest,
  generateOpenClawPackageManifest,
  generateOpenClawManifest,
} from './manifestGenerators.js';
import { generateProgrammaticExtension } from './proxiedHookTemplates.js';
import { generateCliBinScript, generateInstallScript, generateUninstallScript } from './binTemplates.js';
import { generateInstallInstructions } from './installInstructions.js';
import {
  generateHarnessManifest,
  generateTeamInstall,
  generateOpenClawNativeHooksSection,
  generateOpenCodeAccomplishSkill,
  resolveExtraFiles,
} from './transformHelpers.js';
import { generateInstallShared } from './installSharedGenerator.js';
import {
  resolveSdkConfig,
  resolveTargetCliName,
  resolveTargetNpmPackageName,
} from './sdkConfig.js';
import { getCommandPaths } from './transform.js';

function toOutputPath(value: string): string {
  return value.replace(/\\/g, '/');
}

function generateCjsWrapper(moduleBasename: string, exportOnly = false): string {
  if (exportOnly) {
    return `'use strict';\n\nmodule.exports = require('./${moduleBasename}.js');\n`;
  }
  return `#!/usr/bin/env node
'use strict';

require('./${moduleBasename}.js');
`;
}

export function generateManifests(
  sourceDir: string,
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  _diagnostics: Diagnostic[]
): TransformedFile[] {
  const files: TransformedFile[] = [];

  // Filter manifest hooks to only those supported by this target
  // and resolve handler paths through hookFilePattern
  const sdkCfg = resolveSdkConfig(manifest);
  const filteredManifest = { ...manifest };
  if (manifest.hooks) {
    const hookFilePattern = manifest.targets?.[targetProfile.name]?.hookFilePattern
      ?? manifest.hookFilePattern;
    const pat = typeof hookFilePattern === 'string' ? hookFilePattern : undefined;
    const toSlug = (s: string) => s
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const toNativeSlug = (s: string) => s.replace(/[._]/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    const filtered: Record<string, string | boolean | null> = {};
    for (const [canonical, handler] of Object.entries(manifest.hooks)) {
      if (handler === null || !targetProfile.supportedHooks.has(canonical)) continue;
      if (typeof handler === 'string' && handler !== 'proxy' && pat) {
        const native = targetProfile.supportedHooks.get(canonical) || canonical;
        const resolved = 'hooks/' + pat
          .replace(/\{\{name\}\}/g, manifest.name)
          .replace(/\{\{slug\}\}/g, toSlug(canonical))
          .replace(/\{\{native\}\}/g, toNativeSlug(native));
        filtered[canonical] = resolved;
      } else {
        filtered[canonical] = handler;
      }
    }
    filteredManifest.hooks = filtered;
  }
  // Add target name to end of keywords if not already present
  if (filteredManifest.keywords) {
    const kw = [...filteredManifest.keywords];
    if (!kw.includes(targetProfile.name)) {
      kw.push(targetProfile.name);
    }
    filteredManifest.keywords = kw;
  }

  switch (targetProfile.name) {
    case 'claude-code': {
      const ccManifest = generateClaudeCodeManifest(filteredManifest);
      files.push({ path: 'plugin.json', content: ccManifest });
      const author = typeof manifest.author === 'string'
        ? { name: manifest.author }
        : manifest.author;
      files.push({ path: '.claude-plugin/plugin.json', content: JSON.stringify({
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author,
      }, null, 2) + '\n' });
      break;
    }
    case 'codex': {
      const codexPkg = generateCodexManifest(filteredManifest);
      files.push({ path: 'package.json', content: codexPkg });
      files.push({ path: '.codex-plugin/plugin.json', content: generateHarnessManifest(manifest, targetProfile) });
      files.push({ path: '.app.json', content: JSON.stringify({ apps: {} }, null, 2) + '\n' });
      break;
    }
    case 'cursor': {
      const cursorManifest = generateCursorManifest(filteredManifest);
      files.push({ path: 'plugin.json', content: cursorManifest });
      files.push({ path: '.cursor-plugin/plugin.json', content: generateHarnessManifest(manifest, targetProfile) });
      break;
    }
    case 'gemini':
      {
        const commandPaths = getCommandPaths(sourceDir, manifest);
      files.push({
        path: 'plugin.json',
        content: generateGeminiManifest(filteredManifest, commandPaths),
      });
      files.push({
        path: 'gemini-extension.json',
        content: JSON.stringify(
          {
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            contextFileName: 'GEMINI.md',
            settings: [],
          },
          null,
          2
        ) + '\n',
      });
      }
      break;
    case 'github-copilot': {
      const copilotManifest = generateGithubCopilotManifest(filteredManifest);
      files.push({
        path: 'plugin.json',
        content: copilotManifest,
      });
      files.push({
        path: '.github/plugin.json',
        content: copilotManifest,
      });
      break;
    }
    case 'pi':
      files.push({
        path: 'package.json',
        content: generatePiManifest(filteredManifest),
      });
      break;
    case 'oh-my-pi':
      files.push({
        path: 'package.json',
        content: generateOhMyPiManifest(filteredManifest),
      });
      break;
    case 'opencode':
      files.push({
        path: 'plugin.json',
        content: generateOpenCodeManifest(filteredManifest),
      });
      break;
    case 'openclaw':
      files.push({
        path: 'package.json',
        content: generateOpenClawPackageManifest(filteredManifest),
      });
      files.push({
        path: 'plugin.json',
        content: generateOpenClawManifest(filteredManifest),
      });
      files.push({
        path: 'openclaw.plugin.json',
        content: JSON.stringify(
          {
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            entrypoint: 'extensions/index.ts',
            hooks: generateOpenClawNativeHooksSection(filteredManifest, targetProfile),
            capabilities: ['orchestration', 'process-management', 'human-in-the-loop'],
          },
          null,
          2
        ) + '\n',
      });
      break;
  }

  // Generate package.json for npm-distributed targets that don't already have one
  if (
    (targetProfile.distribution === 'npm-cli' || targetProfile.distribution === 'both') &&
    !files.some(f => f.path === 'package.json')
  ) {
    const packageMetadata = targetProfile.packageMetadata ?? {};
    const npmPkg = resolveTargetNpmPackageName(manifest, targetProfile);
    const cliName = resolveTargetCliName(manifest, targetProfile);
    const isEsm = packageMetadata.moduleType === 'module';
    const ext = packageMetadata.binScriptExt ?? (isEsm ? '.cjs' : '.js');
    const scripts: Record<string, string> = {
      deploy: 'npm publish --access public',
      'deploy:staging': 'npm publish --access public --tag staging',
    };
    if (packageMetadata.installLifecycle === 'plugin-scripts') {
      scripts['plugin:install'] = `node bin/install${ext} --global`;
      scripts['plugin:uninstall'] = `node bin/uninstall${ext} --global`;
    } else if (packageMetadata.installLifecycle === 'postinstall') {
      scripts.postinstall = `node bin/install${ext}`;
      scripts.preuninstall = `node bin/uninstall${ext}`;
    }
    scripts['team:install'] = `node scripts/team-install${ext}`;
    for (const [scriptName, scriptValue] of Object.entries(packageMetadata.extraScripts ?? {})) {
      scripts[scriptName] = scriptValue;
    }
    const packageFiles = ['bin/', ...(packageMetadata.extraPackageFiles ?? [])];
    packageFiles.push('hooks/', 'skills/', 'commands/', 'scripts/', 'plugin.json');
    packageFiles.push('README.md', 'versions.json', 'package.json');
    const pkgJson: Record<string, unknown> = {
      name: npmPkg,
      version: manifest.version,
      description: manifest.description,
      scripts,
      bin: { [cliName]: `bin/cli${ext}` },
      files: packageFiles,
      keywords: [manifest.name, targetProfile.name, 'orchestration'],
      author: manifest.author,
      license: manifest.license,
      publishConfig: { access: 'public' },
      dependencies: { [sdkCfg.package]: manifest.version },
    };
    if (isEsm) pkgJson.type = 'module';
    if (manifest.repository) pkgJson.repository = manifest.repository;
    if (manifest.repository) {
      const repoUrl = typeof manifest.repository === 'string' ? manifest.repository : manifest.repository.url;
      pkgJson.homepage = `${repoUrl}/tree/main/plugins/${npmPkg.split('/').pop()}#readme`;
    }
    if (targetProfile.adapterFamily === 'programmatic') {
      const peerPkg = packageMetadata.peerDependencyPackage;
      if (peerPkg) pkgJson.peerDependencies = { [peerPkg]: '*' };
    }
    files.push({ path: 'package.json', content: JSON.stringify(pkgJson, null, 2) + '\n' });
  }

  return files;
}

export function copyContextFiles(
  sourceDir: string,
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  _diagnostics: Diagnostic[]
): TransformedFile[] {
  const files: TransformedFile[] = [];

  if (!manifest.contextFiles) {
    return files;
  }

  const contextPath = manifest.contextFiles[targetProfile.name];
  if (contextPath) {
    const fullPath = path.join(sourceDir, contextPath);
    if (fs.existsSync(fullPath)) {
      const basename = path.basename(contextPath);
      files.push({
        path: toOutputPath(basename),
        content: fs.readFileSync(fullPath, 'utf-8'),
      });
    }
  }

  return files;
}

export function copyIncludedFiles(
  sourceDir: string,
  manifest: A5cPluginManifest,
  excludePatterns: string[] = []
): TransformedFile[] {
  const files: TransformedFile[] = [];

  if (!manifest.include || manifest.include.length === 0) {
    return files;
  }

  for (const pattern of manifest.include) {
    if (excludePatterns.some(ex => pattern === ex || pattern.startsWith(ex))) continue;

    if (!pattern.includes('*')) {
      const fullPath = path.join(sourceDir, pattern);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          files.push({
            path: toOutputPath(pattern),
            content: fs.readFileSync(fullPath, 'utf-8'),
          });
        } else if (stat.isDirectory()) {
          collectDir(sourceDir, pattern, files);
        }
      }
      continue;
    }

    // Simple *.ext glob in a directory
    const dir = path.dirname(pattern);
    const ext = path.extname(pattern);
    const fullDir = path.join(sourceDir, dir);
    if (fs.existsSync(fullDir) && fs.statSync(fullDir).isDirectory()) {
      for (const entry of fs.readdirSync(fullDir)) {
        if (ext && !entry.endsWith(ext)) continue;
        const entryPath = toOutputPath(path.join(dir, entry));
        const fullEntry = path.join(sourceDir, entryPath);
        if (fs.statSync(fullEntry).isFile()) {
          files.push({
            path: entryPath,
            content: fs.readFileSync(fullEntry, 'utf-8'),
          });
        }
      }
    }
  }

  return files;
}

export function collectDir(
  sourceDir: string,
  relDir: string,
  files: TransformedFile[]
): void {
  const fullDir = path.join(sourceDir, relDir);
  for (const entry of fs.readdirSync(fullDir)) {
    const relPath = toOutputPath(path.join(relDir, entry));
    const fullPath = path.join(sourceDir, relPath);
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      files.push({
        path: relPath,
        content: fs.readFileSync(fullPath, 'utf-8'),
      });
    } else if (stat.isDirectory()) {
      collectDir(sourceDir, relPath, files);
    }
  }
}

export function generateExtraFiles(
  sourceDir: string,
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  _diagnostics: Diagnostic[]
): TransformedFile[] {
  const files: TransformedFile[] = [];
  const sdkCfg = resolveSdkConfig(manifest);

  // Generate programmatic extensions (Pi, oh-my-pi, and other programmatic targets)
  if (targetProfile.adapterFamily === 'programmatic') {
    const cmdPaths = getCommandPaths(sourceDir, manifest);
    const extensionsContent = generateProgrammaticExtension(manifest, targetProfile, cmdPaths);
    files.push({
      path: 'extensions/index.ts',
      content: extensionsContent,
    });
  }

  // Generate CLI bin scripts for npm-cli distribution targets
  if (targetProfile.distribution === 'npm-cli' || targetProfile.distribution === 'both') {
    const packageMetadata = targetProfile.packageMetadata ?? {};
    const isEsm = packageMetadata.moduleType === 'module';
    const ext = packageMetadata.binScriptExt ?? (isEsm ? '.cjs' : '.js');
    files.push({ path: `bin/cli${ext}`, content: generateCliBinScript(manifest, targetProfile), executable: true });
    files.push({ path: `bin/install${ext}`, content: generateInstallScript(manifest, targetProfile), executable: true });
    files.push({ path: `bin/uninstall${ext}`, content: generateUninstallScript(manifest, targetProfile), executable: true });
    files.push({ path: `bin/install-shared${ext}`, content: generateInstallShared(manifest, targetProfile, sourceDir) });
    files.push({ path: `scripts/team-install${ext}`, content: generateTeamInstall(manifest, targetProfile), executable: true });

    if (packageMetadata.emitCjsWrappers) {
      files.push({ path: 'bin/cli.cjs', content: generateCjsWrapper('cli'), executable: true });
      files.push({ path: 'bin/install.cjs', content: generateCjsWrapper('install'), executable: true });
      files.push({ path: 'bin/uninstall.cjs', content: generateCjsWrapper('uninstall'), executable: true });
      files.push({ path: 'bin/install-shared.cjs', content: generateCjsWrapper('install-shared', true) });
    }
  }

  // Generate installation instructions for all targets
  files.push({
    path: 'README.md',
    content: generateInstallInstructions(manifest, targetProfile, sourceDir),
  });

  // .gitignore
  files.push({
    path: '.gitignore',
    content: `node_modules/\ndist/\n${sdkCfg.stateDir}/runs/\n${sdkCfg.stateDir}/logs/\n${sdkCfg.stateDir}/processes/\n${sdkCfg.stateDir}/artifacts/\n${sdkCfg.stateDir}/session.json\n${sdkCfg.stateDir}/current-run.json\n${sdkCfg.stateDir}/observer.json\n${sdkCfg.stateDir}/index/\n${sdkCfg.stateDir}/team/\n${sdkCfg.stateDir}/config/rules.local.json\n*.sqlite\n*.sqlite-shm\n*.sqlite-wal\n*.log\n.DS_Store\n`,
  });
  // Emit target-override extraFiles
  const extraFiles = resolveExtraFiles(manifest, targetProfile);
  if (Object.keys(extraFiles).length > 0) {
    for (const [outputPath, value] of Object.entries(extraFiles)) {
      if (value.startsWith('file:')) {
        const srcPath = value.slice(5);
        const fullPath = path.join(sourceDir, srcPath);
        if (fs.existsSync(fullPath)) {
          const isBinary = /\.(png|jpg|jpeg|gif|ico|woff2?|ttf|eot|svg|pdf)$/i.test(outputPath);
          if (isBinary) {
            files.push({
              path: outputPath,
              content: '',
              binaryContent: fs.readFileSync(fullPath),
            });
          } else {
            files.push({
              path: outputPath,
              content: fs.readFileSync(fullPath, 'utf-8'),
            });
          }
        }
      } else {
        files.push({ path: outputPath, content: value });
      }
    }
  }
  if (manifest.postInstall) {
    const postInstallPath = path.join(sourceDir, manifest.postInstall);
    if (fs.existsSync(postInstallPath)) {
      files.push({ path: 'scripts/post-install.js', content: fs.readFileSync(postInstallPath, 'utf-8'), executable: true });
    }
  }
  if (targetProfile.name === 'opencode') {
    const accomplishSkill = generateOpenCodeAccomplishSkill(manifest);
    if (accomplishSkill) {
      files.push({ path: `accomplish-skills/${manifest.name}/SKILL.md`, content: accomplishSkill });
    }
  }
  return files;
}

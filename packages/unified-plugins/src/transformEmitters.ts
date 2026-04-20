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
  generateOpenClawManifest,
} from './manifestGenerators.js';
import { generateProgrammaticExtension } from './proxiedHookTemplates.js';
import { generateCliBinScript, generateInstallScript, generateUninstallScript } from './binTemplates.js';
import { generateInstallInstructions } from './installInstructions.js';
import { generateHarnessManifest, generateInstallShared, generateTeamInstall, generateOpenClawNativeHooksSection, generateOpenCodeAccomplishSkill, generateGeminiPostinstall, generateGeminiPreuninstall } from './transformHelpers.js';
import { getCommandPaths } from './transform.js';

export function generateManifests(
  sourceDir: string,
  manifest: A5cPluginManifest,
  targetProfile: TargetProfile,
  _diagnostics: Diagnostic[]
): TransformedFile[] {
  const files: TransformedFile[] = [];

  switch (targetProfile.name) {
    case 'claude-code': {
      const ccManifest = generateClaudeCodeManifest(manifest);
      files.push({ path: 'plugin.json', content: ccManifest });
      files.push({ path: '.claude-plugin/plugin.json', content: ccManifest });
      break;
    }
    case 'codex': {
      const codexPkg = generateCodexManifest(manifest);
      files.push({ path: 'package.json', content: codexPkg });
      files.push({ path: '.codex-plugin/plugin.json', content: generateHarnessManifest(manifest, targetProfile) });
      files.push({ path: '.app.json', content: JSON.stringify({ apps: {} }, null, 2) + '\n' });
      break;
    }
    case 'cursor': {
      const cursorManifest = generateCursorManifest(manifest);
      files.push({ path: 'plugin.json', content: cursorManifest });
      files.push({ path: '.cursor-plugin/plugin.json', content: generateHarnessManifest(manifest, targetProfile) });
      break;
    }
    case 'gemini':
      files.push({
        path: 'plugin.json',
        content: generateGeminiManifest(manifest),
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
        ),
      });
      break;
    case 'github-copilot': {
      const copilotManifest = generateGithubCopilotManifest(manifest);
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
        content: generatePiManifest(manifest),
      });
      break;
    case 'oh-my-pi':
      files.push({
        path: 'package.json',
        content: generateOhMyPiManifest(manifest),
      });
      break;
    case 'opencode':
      files.push({
        path: 'plugin.json',
        content: generateOpenCodeManifest(manifest),
      });
      break;
    case 'openclaw':
      files.push({
        path: 'plugin.json',
        content: generateOpenClawManifest(manifest),
      });
      files.push({
        path: 'openclaw.plugin.json',
        content: JSON.stringify(
          {
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            entrypoint: 'extensions/index.ts',
            hooks: generateOpenClawNativeHooksSection(manifest, targetProfile),
            capabilities: ['orchestration', 'process-management', 'human-in-the-loop'],
          },
          null,
          2
        ),
      });
      break;
  }

  // Generate package.json for npm-distributed targets that don't already have one
  if (
    (targetProfile.distribution === 'npm-cli' || targetProfile.distribution === 'both') &&
    !files.some(f => f.path === 'package.json')
  ) {
    const npmPkg = targetProfile.npmPackageName || `@a5c-ai/${manifest.name}-${targetProfile.name}`;
    const authorStr = typeof manifest.author === 'string' ? manifest.author : manifest.author.name;
    const isEsm = targetProfile.name === 'pi' || targetProfile.name === 'oh-my-pi' || targetProfile.name === 'openclaw';
    const ext = isEsm ? '.cjs' : '.js';
    const pkgJson: Record<string, unknown> = {
      name: npmPkg,
      version: manifest.version,
      description: manifest.description,
      scripts: {
        deploy: 'npm publish --access public',
        'deploy:staging': 'npm publish --access public --tag staging',
        ...(targetProfile.name === 'gemini' ? { postinstall: 'node bin/postinstall.js', preuninstall: 'node bin/preuninstall.js' } : {}),
      },
      bin: { [`${manifest.name}-${targetProfile.name}`]: `bin/cli${ext}` },
      files: ['bin/', 'hooks/', 'hooks.json', 'skills/', 'commands/', 'README.md', 'versions.json', 'plugin.json', 'package.json'],
      keywords: [manifest.name, targetProfile.name, 'orchestration'],
      author: authorStr,
      license: manifest.license,
      publishConfig: { access: 'public' },
    };
    if (manifest.repository) pkgJson.repository = manifest.repository;
    files.push({ path: 'package.json', content: JSON.stringify(pkgJson, null, 2) });
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
        path: basename,
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
            path: pattern,
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
        const entryPath = path.join(dir, entry);
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
    const relPath = path.join(relDir, entry);
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
    const isEsm = targetProfile.name === 'pi' || targetProfile.name === 'oh-my-pi' || targetProfile.name === 'openclaw';
    const ext = isEsm ? '.cjs' : '.js';
    files.push({ path: `bin/cli${ext}`, content: generateCliBinScript(manifest, targetProfile), executable: true });
    files.push({ path: `bin/install${ext}`, content: generateInstallScript(manifest, targetProfile), executable: true });
    files.push({ path: `bin/uninstall${ext}`, content: generateUninstallScript(manifest, targetProfile), executable: true });
    files.push({ path: `bin/install-shared${ext}`, content: generateInstallShared(manifest, targetProfile) });
    files.push({ path: `scripts/team-install${ext}`, content: generateTeamInstall(manifest, targetProfile), executable: true });
  }

  // Gemini: npm lifecycle scripts
  if (targetProfile.name === 'gemini') {
    files.push({ path: 'bin/postinstall.js', content: generateGeminiPostinstall(), executable: true });
    files.push({ path: 'bin/preuninstall.js', content: generateGeminiPreuninstall(), executable: true });
  }

  // Generate installation instructions for all targets
  files.push({
    path: 'README.md',
    content: generateInstallInstructions(manifest, targetProfile, sourceDir),
  });

  // .gitignore
  files.push({
    path: '.gitignore',
    content: 'node_modules/\ndist/\n.a5c/runs/\n.a5c/logs/\n.a5c/processes/\n.a5c/artifacts/\n.a5c/session.json\n.a5c/current-run.json\n.a5c/observer.json\n.a5c/index/\n.a5c/team/\n.a5c/config/rules.local.json\n*.sqlite\n*.sqlite-shm\n*.sqlite-wal\n*.log\n.DS_Store\n',
  });

  // Emit target-override extraFiles
  const targetOverride = manifest.targets?.[targetProfile.name];
  if (targetOverride?.extraFiles) {
    for (const [outputPath, value] of Object.entries(targetOverride.extraFiles)) {
      if (value.startsWith('file:')) {
        const srcPath = value.slice(5);
        const fullPath = path.join(sourceDir, srcPath);
        if (fs.existsSync(fullPath)) {
          files.push({
            path: outputPath,
            content: fs.readFileSync(fullPath, 'utf-8'),
          });
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

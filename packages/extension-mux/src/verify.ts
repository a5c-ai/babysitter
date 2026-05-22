// Stage 5: VERIFY - Verify emitted output

import * as fs from 'fs';
import * as path from 'path';
import type { VerifyResult, Diagnostic } from './types.js';

export interface VerifyOptions {
  outputBaseDir?: string;
}

function getMarketplaceRootDir(marketplacePath: string): string {
  return path.resolve(path.dirname(marketplacePath), '..', '..');
}

function resolveMarketplaceSourceCandidates(
  fullPath: string,
  sourceValue: string,
  useMarketplaceRootDir: boolean,
): string[] {
  const candidates = new Set<string>();
  const baseDir = path.dirname(fullPath);
  candidates.add(path.resolve(baseDir, sourceValue));
  candidates.add(path.resolve(baseDir, '..', sourceValue));
  candidates.add(path.resolve(baseDir, '..', '..', sourceValue));

  if (useMarketplaceRootDir) {
    candidates.add(path.resolve(getMarketplaceRootDir(fullPath), sourceValue));
  }

  return [...candidates];
}

export function verify(
  outputDir: string,
  emittedFiles: string[],
  options: VerifyOptions = {}
): VerifyResult {
  const diagnostics: Diagnostic[] = [];
  const verificationChecklist: string[] = [];
  const resolutionRoots = Array.from(
    new Set([path.resolve(outputDir), options.outputBaseDir ? path.resolve(options.outputBaseDir) : null]
      .filter((value): value is string => value !== null))
  );

  const resolvedFiles = new Map<string, string>();
  const parsedJsonFiles = new Map<string, { fullPath: string; value: unknown }>();

  const addChecklist = (message: string) => {
    if (!verificationChecklist.includes(message)) {
      verificationChecklist.push(message);
    }
  };

  const addDiagnostic = (
    message: string,
    source: string,
    level: Diagnostic['level'] = 'error',
    suggestion?: string
  ) => {
    diagnostics.push({
      level,
      category: 'verification',
      message,
      source,
      suggestion,
    });
  };

  const resolveEmittedPath = (filePath: string): string | null => {
    for (const root of resolutionRoots) {
      const candidate = path.join(root, filePath);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return null;
  };

  const normalizeOutputReference = (reference: string): string | null => {
    const trimmed = reference.trim();
    if (
      trimmed.length === 0 ||
      trimmed === '.' ||
      trimmed === './' ||
      /^(?:[a-z]+:)?\/\//i.test(trimmed)
    ) {
      return null;
    }

    const normalized = trimmed.replace(/^\.\/+/, '').replace(/\/+$/, '');
    return normalized.length > 0 ? normalized : null;
  };

  const verifyPluginReference = (reference: string, context: string) => {
    const normalized = normalizeOutputReference(reference);
    if (!normalized) {
      return;
    }

    const resolved = path.join(outputDir, normalized);
    if (!fs.existsSync(resolved)) {
      addDiagnostic(`${context.replace(/ exists$/, ' missing')}: ${normalized}`, resolved);
      return;
    }

    addChecklist(`✓ ${context}: ${normalized}`);
  };

  const verifyPackageJson = (filePath: string, value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return;
    }

    const pkg = value as {
      bin?: Record<string, string>;
      files?: string[];
      scripts?: Record<string, string>;
      pi?: { extensions?: string[]; skills?: string[] };
      omp?: { extensions?: string[]; skills?: string[] };
      openclaw?: { extensions?: string[] };
    };

    for (const target of Object.values(pkg.bin ?? {})) {
      if (typeof target === 'string') {
        verifyPluginReference(target, `${filePath} bin target exists`);
      }
    }

    for (const entry of pkg.files ?? []) {
      if (typeof entry === 'string') {
        verifyPluginReference(entry, `${filePath} publishable path exists`);
      }
    }

    for (const command of Object.values(pkg.scripts ?? {})) {
      if (typeof command !== 'string') {
        continue;
      }
      const matches = command.matchAll(/(?:^|\s)(?:node|tsx|ts-node)\s+((?:bin|scripts)\/[^\s'"]+)/g);
      for (const match of matches) {
        verifyPluginReference(match[1], `${filePath} script target exists`);
      }
    }

    for (const extensionPath of pkg.pi?.extensions ?? []) {
      if (typeof extensionPath === 'string') {
        verifyPluginReference(extensionPath, `${filePath} pi extension exists`);
      }
    }
    for (const skillPath of pkg.pi?.skills ?? []) {
      if (typeof skillPath === 'string') {
        verifyPluginReference(skillPath, `${filePath} pi skill path exists`);
      }
    }
    for (const extensionPath of pkg.omp?.extensions ?? []) {
      if (typeof extensionPath === 'string') {
        verifyPluginReference(extensionPath, `${filePath} omp extension exists`);
      }
    }
    for (const skillPath of pkg.omp?.skills ?? []) {
      if (typeof skillPath === 'string') {
        verifyPluginReference(skillPath, `${filePath} omp skill path exists`);
      }
    }
    for (const extensionPath of pkg.openclaw?.extensions ?? []) {
      if (typeof extensionPath === 'string') {
        verifyPluginReference(extensionPath, `${filePath} openclaw extension exists`);
      }
    }
  };

  const verifyManifestJson = (filePath: string, value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return;
    }

    const manifest = value as {
      hooks?: string | Record<string, string | boolean>;
      commands?: string | string[];
      skills?: string | Array<{ file?: string }>;
      agents?: string | string[];
      contextFileName?: string;
      extensionManifest?: string;
      entrypoint?: string;
    };

    if (typeof manifest.hooks === 'string') {
      verifyPluginReference(manifest.hooks, `${filePath} hooks path exists`);
    } else if (manifest.hooks && typeof manifest.hooks === 'object') {
      for (const hookTarget of Object.values(manifest.hooks)) {
        if (typeof hookTarget === 'string' && hookTarget !== 'proxy') {
          verifyPluginReference(hookTarget, `${filePath} hook target exists`);
        }
      }
    }

    if (typeof manifest.commands === 'string') {
      verifyPluginReference(manifest.commands, `${filePath} commands path exists`);
    } else if (Array.isArray(manifest.commands)) {
      for (const commandPath of manifest.commands) {
        if (typeof commandPath === 'string') {
          verifyPluginReference(commandPath, `${filePath} command target exists`);
        }
      }
    }

    if (typeof manifest.skills === 'string') {
      verifyPluginReference(manifest.skills, `${filePath} skills path exists`);
    } else if (Array.isArray(manifest.skills)) {
      for (const skill of manifest.skills) {
        if (skill && typeof skill === 'object' && typeof skill.file === 'string') {
          verifyPluginReference(skill.file, `${filePath} skill file exists`);
        }
      }
    }

    if (typeof manifest.agents === 'string') {
      verifyPluginReference(manifest.agents, `${filePath} agents path exists`);
    } else if (Array.isArray(manifest.agents)) {
      for (const agentPath of manifest.agents) {
        if (typeof agentPath === 'string') {
          verifyPluginReference(agentPath, `${filePath} agent file exists`);
        }
      }
    }

    if (typeof manifest.contextFileName === 'string') {
      verifyPluginReference(manifest.contextFileName, `${filePath} context file exists`);
    }
    if (typeof manifest.extensionManifest === 'string') {
      verifyPluginReference(manifest.extensionManifest, `${filePath} extension manifest exists`);
    }
    if (typeof manifest.entrypoint === 'string') {
      verifyPluginReference(manifest.entrypoint, `${filePath} entrypoint exists`);
    }
  };

  const verifyHookRegistrationJson = (filePath: string, value: unknown) => {
    const pathTokenPattern = /(^|[^A-Za-z0-9_.-])((?:hooks|commands|skills|extensions|bin)\/[^"'`\s)]+)/g;

    const visit = (node: unknown) => {
      if (typeof node === 'string') {
        for (const match of node.matchAll(pathTokenPattern)) {
          verifyPluginReference(match[2], `${filePath} command target exists`);
        }
        return;
      }
      if (Array.isArray(node)) {
        for (const item of node) {
          visit(item);
        }
        return;
      }
      if (node && typeof node === 'object') {
        for (const child of Object.values(node)) {
          visit(child);
        }
      }
    };

    visit(value);
  };

  const verifyMarketplaceJson = (filePath: string, fullPath: string, value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return;
    }

    const marketplace = value as {
      plugins?: Array<{ source?: string | { path?: string } }>;
    };

    for (const pluginEntry of marketplace.plugins ?? []) {
      const sourceValue = typeof pluginEntry.source === 'string'
        ? pluginEntry.source
        : pluginEntry.source?.path;
      if (typeof sourceValue !== 'string' || sourceValue.trim().length === 0) {
        continue;
      }

      const candidates = resolveMarketplaceSourceCandidates(
        fullPath,
        sourceValue,
        typeof pluginEntry.source !== 'string',
      );
      const resolved = candidates.find((candidate) => fs.existsSync(candidate));
      if (!resolved) {
        addDiagnostic(
          `${filePath} marketplace entry source missing: ${sourceValue}`,
          candidates[0] ?? path.resolve(path.dirname(fullPath), sourceValue),
        );
        continue;
      }

      addChecklist(`✓ ${filePath} marketplace entry source exists: ${sourceValue}`);
    }
  };

  // Check that all emitted files exist
  for (const filePath of emittedFiles) {
    const fullPath = resolveEmittedPath(filePath);
    if (!fullPath) {
      addDiagnostic(`Emitted file does not exist: ${filePath}`, path.join(outputDir, filePath));
    } else {
      resolvedFiles.set(filePath, fullPath);
      addChecklist(`✓ File exists: ${filePath}`);
    }
  }

  // Verify JSON files are valid JSON
  for (const filePath of emittedFiles) {
    if (filePath.endsWith('.json')) {
      const fullPath = resolvedFiles.get(filePath);
      if (fullPath) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const value = JSON.parse(content);
          parsedJsonFiles.set(filePath, { fullPath, value });
          addChecklist(`✓ Valid JSON: ${filePath}`);
        } catch (error) {
          addDiagnostic(`Invalid JSON in ${filePath}: ${(error as Error).message}`, fullPath);
        }
      }
    }
  }

  // Verify hook scripts have shebangs
  for (const filePath of emittedFiles) {
    if (filePath.endsWith('.sh') || filePath.endsWith('.js')) {
      const fullPath = resolvedFiles.get(filePath);
      if (fullPath) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (!content.startsWith('#!')) {
          addDiagnostic(
            `Hook script missing shebang: ${filePath}`,
            fullPath,
            'warning',
            'Add shebang line (#!/bin/bash or #!/usr/bin/env node)',
          );
        } else {
          addChecklist(`✓ Shebang present: ${filePath}`);
        }
      }
    }
  }

  // Verify SKILL.md files have valid frontmatter
  for (const filePath of emittedFiles) {
    if (filePath.endsWith('SKILL.md')) {
      const fullPath = resolvedFiles.get(filePath);
      if (fullPath) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (!content.startsWith('---')) {
          addDiagnostic(`SKILL.md missing frontmatter: ${filePath}`, fullPath, 'warning');
        } else {
          addChecklist(`✓ Frontmatter present: ${filePath}`);
        }
      }
    }
  }

  for (const [filePath, parsed] of parsedJsonFiles) {
    if (filePath.endsWith('package.json')) {
      verifyPackageJson(filePath, parsed.value);
    }

    if (
      filePath.endsWith('plugin.json')
      || filePath.endsWith('gemini-extension.json')
    ) {
      verifyManifestJson(filePath, parsed.value);
    }

    if (path.basename(filePath) === 'hooks.json') {
      verifyHookRegistrationJson(filePath, parsed.value);
    }

    if (path.basename(filePath) === 'marketplace.json') {
      verifyMarketplaceJson(filePath, parsed.fullPath, parsed.value);
    }
  }

  return { diagnostics, verificationChecklist };
}

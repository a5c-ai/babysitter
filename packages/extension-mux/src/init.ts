import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { A5cPluginManifest } from './types.js';
import { listPluginTargetDescriptors } from '@a5c-ai/agent-catalog';

/**
 * Build the contextFiles map from catalog data.
 * Targets with a requiredSurfaceFile that is an AGENTS.md-style file
 * get a context/ mapping.
 */
function buildContextFilesMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const target of listPluginTargetDescriptors()) {
    if (target.requiredSurfaceFile) {
      map[target.targetId] = `context/${target.requiredSurfaceFile}`;
    }
  }
  return map;
}

function buildContextSurfaceFiles(name: string, manifest: A5cPluginManifest): TemplateFile[] {
  const contextFiles = manifest.contextFiles ?? {};
  const uniquePaths = [...new Set(Object.values(contextFiles))];
  return uniquePaths.map((contextPath) => ({
    path: contextPath,
    content: buildAgentsContext(name),
  }));
}

export const INIT_TEMPLATES = ['minimal', 'full', 'hooks-only'] as const;

export type InitTemplate = typeof INIT_TEMPLATES[number];

export interface InitOptions {
  name: string;
  output?: string;
  template?: InitTemplate;
  dryRun?: boolean;
}

export interface InitResult {
  name: string;
  outputDir: string;
  template: InitTemplate;
  writtenFiles: string[];
  dryRun: boolean;
}

interface TemplateFile {
  path: string;
  content: string;
  executable?: boolean;
}

const NAME_PATTERN = /^[a-z0-9-]+$/;

export function scaffoldPlugin(options: InitOptions): InitResult {
  const template = normalizeTemplate(options.template);
  const outputDir = path.resolve(options.output ?? process.cwd());
  const dryRun = options.dryRun ?? false;

  if (!options.name) {
    throw new Error('Plugin name is required');
  }

  if (!NAME_PATTERN.test(options.name)) {
    throw new Error('Plugin name must match pattern ^[a-z0-9-]+$');
  }

  ensureScaffoldTarget(outputDir);

  const files = buildTemplateFiles(options.name, template);

  if (!dryRun) {
    fs.mkdirSync(outputDir, { recursive: true });

    for (const file of files) {
      const fullPath = path.join(outputDir, file.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, file.content, 'utf-8');

      if (file.executable) {
        fs.chmodSync(fullPath, 0o755);
      }
    }
  }

  return {
    name: options.name,
    outputDir,
    template,
    writtenFiles: files.map((file) => file.path),
    dryRun,
  };
}

function normalizeTemplate(template: InitOptions['template']): InitTemplate {
  if (!template) {
    return 'minimal';
  }

  if (INIT_TEMPLATES.includes(template)) {
    return template;
  }

  throw new Error(
    `Unsupported template: ${template}. Expected one of: ${INIT_TEMPLATES.join(', ')}`
  );
}

function ensureScaffoldTarget(outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    return;
  }

  const stat = fs.statSync(outputDir);
  if (!stat.isDirectory()) {
    throw new Error(`Output path is not a directory: ${outputDir}`);
  }

  const entries = fs.readdirSync(outputDir);
  if (entries.length > 0) {
    throw new Error(`Output directory must be empty: ${outputDir}`);
  }
}

function buildTemplateFiles(name: string, template: InitTemplate): TemplateFile[] {
  const manifest = buildManifest(name, template);
  const files: TemplateFile[] = [
    {
      path: 'plugin.json',
      content: `${JSON.stringify(manifest, null, 2)}\n`,
    },
    {
      path: 'versions.json',
      content: `${JSON.stringify({ sdkVersion: readPackageVersion() }, null, 2)}\n`,
    },
  ];

  switch (template) {
    case 'minimal':
      return files;
    case 'full':
      return files.concat([
        {
          path: 'commands/example.md',
          content: buildExampleCommand(name),
        },
        {
          path: 'skills/example/SKILL.md',
          content: buildExampleSkill(name),
        },
        {
          path: 'hooks/session-start.handler.sh',
          content: buildSessionStartHook(),
          executable: true,
        },
        ...buildContextSurfaceFiles(name, manifest),
      ]);
    case 'hooks-only':
      return files.concat([
        {
          path: 'hooks/session-start.handler.sh',
          content: buildSessionStartHook(),
          executable: true,
        },
      ]);
  }
}

function buildManifest(name: string, template: InitTemplate): A5cPluginManifest {
  const baseManifest: A5cPluginManifest = {
    name,
    version: '0.1.0',
    description: `Starter unified plugin for ${name}`,
    author: 'Your Name',
    license: 'MIT',
  };

  if (template === 'full') {
    return {
      ...baseManifest,
      hooks: {
        SessionStart: 'hooks/session-start.handler.sh',
      },
      commands: 'commands',
      skills: [
        {
          name: 'example',
          file: 'skills/example/SKILL.md',
        },
      ],
      contextFiles: buildContextFilesMap(),
    };
  }

  if (template === 'hooks-only') {
    return {
      ...baseManifest,
      hooks: {
        SessionStart: 'hooks/session-start.handler.sh',
      },
    };
  }

  return baseManifest;
}

function buildExampleCommand(name: string): string {
  return `# Example Command

This is the starter command for \`${name}\`.

- Replace this file with your real command docs.
- Keep commands in markdown so compatible targets can copy or adapt them.
`;
}

function buildExampleSkill(name: string): string {
  return `# Example Skill

Use this skill as the starter skill for \`${name}\`.

Update the content to describe when the skill should be used and what it should do.
`;
}

function buildSessionStartHook(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

# Starter hook for SessionStart. Emit JSON for the harness runtime.
printf '{}\n'
`;
}

function buildAgentsContext(name: string): string {
  return `# ${name}

Add harness-facing project guidance here for targets that support context files.
`;
}

function readPackageVersion(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = path.resolve(moduleDir, '../package.json');

  try {
    const raw = fs.readFileSync(packageJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

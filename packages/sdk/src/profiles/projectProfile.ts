/**
 * Project Profile Management for Babysitter SDK
 *
 * Provides functions to read, write, merge, and render project profiles.
 * Project profiles are stored at `{projectRoot}/.a5c/project-profile.json`
 * with a companion human-readable markdown file alongside.
 *
 * All file operations are synchronous for CJS compatibility.
 * Writes use an atomic temp-file-then-rename strategy to prevent corruption.
 */

import * as fs from "fs";
import * as path from "path";

import {
  ProjectProfile,
  PROJECT_PROFILE_FILENAME,
  PROJECT_PROFILE_MD_FILENAME,
} from "./types";

/**
 * Returns the directory for storing the project profile.
 *
 * Defaults to `{cwd}/.a5c/` if no project root is specified.
 *
 * @param projectRoot - Absolute path to the project root. Defaults to `process.cwd()`.
 * @returns Absolute path to the project profile directory
 */
export function getProjectProfileDir(projectRoot?: string): string {
  const root = projectRoot ?? process.cwd();
  return path.join(root, ".a5c");
}

/**
 * Reads the project profile from disk.
 *
 * Returns `null` if the profile file does not exist or contains
 * malformed JSON. Does not throw on missing or corrupt files.
 *
 * @param projectRoot - Absolute path to the project root. Defaults to `process.cwd()`.
 * @returns The parsed project profile, or `null` if unavailable
 */
export function readProjectProfile(projectRoot?: string): ProjectProfile | null {
  const dir = getProjectProfileDir(projectRoot);
  const filePath = path.join(dir, PROJECT_PROFILE_FILENAME);

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as ProjectProfile;
  } catch (_error: unknown) {
    return null;
  }
}

/**
 * Writes a project profile to disk atomically.
 *
 * Creates the profile directory recursively if it does not exist.
 * Uses a temporary file with rename to prevent partial writes.
 * Also writes a companion markdown summary file for human readability.
 *
 * @param profile - The complete project profile to persist
 * @param projectRoot - Absolute path to the project root. Defaults to `process.cwd()`.
 */
export function writeProjectProfile(profile: ProjectProfile, projectRoot?: string): void {
  const dir = getProjectProfileDir(projectRoot);
  fs.mkdirSync(dir, { recursive: true });

  const jsonPath = path.join(dir, PROJECT_PROFILE_FILENAME);
  const mdPath = path.join(dir, PROJECT_PROFILE_MD_FILENAME);
  const jsonData = JSON.stringify(profile, null, 2) + "\n";

  // Atomic write for JSON
  const tmpPath = `${jsonPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, jsonData, "utf8");
    fs.renameSync(tmpPath, jsonPath);
  } catch (_error: unknown) {
    // Clean up temp file on failure
    try {
      fs.unlinkSync(tmpPath);
    } catch (_cleanupError: unknown) {
      // Ignore cleanup errors
    }
    throw _error;
  }

  // Write markdown summary (best-effort, not atomic)
  try {
    const markdown = renderProjectProfileMarkdown(profile);
    fs.writeFileSync(mdPath, markdown, "utf8");
  } catch (_mdError: unknown) {
    // Markdown write failure is non-fatal
  }
}

/**
 * Deep-merges partial updates into an existing project profile.
 *
 * Merge strategy:
 * - **Scalars** (strings, numbers, booleans): overwritten by the update value
 * - **Objects**: spread-merged (shallow merge per nested object)
 * - **Arrays with identifiable items** (having `id`, `name`, or similar fields):
 *   deduplicated by that key, with update items taking precedence
 * - **Arrays of primitives**: deduplicated by value
 * - `updatedAt` is set to the current ISO timestamp
 * - `version` is incremented by 1
 *
 * @param existing - The current project profile
 * @param updates - Partial profile fields to merge in
 * @returns A new merged project profile (does not mutate inputs)
 */
export function mergeProjectProfile(
  existing: ProjectProfile,
  updates: Partial<ProjectProfile>,
): ProjectProfile {
  const merged: ProjectProfile = { ...existing };

  // Merge scalar fields
  if (updates.projectName !== undefined) merged.projectName = updates.projectName;
  if (updates.description !== undefined) merged.description = updates.description;
  if (updates.createdAt !== undefined) merged.createdAt = updates.createdAt;

  // Merge goals (deduplicate by id)
  if (updates.goals !== undefined) {
    merged.goals = mergeArrayByKey(existing.goals, updates.goals, "id");
  }

  // Merge tech stack
  if (updates.techStack !== undefined) {
    merged.techStack = { ...existing.techStack };
    if (updates.techStack.languages !== undefined) {
      merged.techStack.languages = mergeArrayByKey(
        existing.techStack.languages ?? [],
        updates.techStack.languages,
        "name",
      );
    }
    if (updates.techStack.frameworks !== undefined) {
      merged.techStack.frameworks = mergeArrayByKey(
        existing.techStack.frameworks ?? [],
        updates.techStack.frameworks,
        "name",
      );
    }
    if (updates.techStack.databases !== undefined) {
      merged.techStack.databases = mergeArrayByKey(
        existing.techStack.databases ?? [],
        updates.techStack.databases,
        "name",
      );
    }
    if (updates.techStack.infrastructure !== undefined) {
      merged.techStack.infrastructure = mergeArrayByKey(
        existing.techStack.infrastructure ?? [],
        updates.techStack.infrastructure,
        "name",
      );
    }
    if (updates.techStack.buildTools !== undefined) {
      merged.techStack.buildTools = deduplicatePrimitiveArray([
        ...(existing.techStack.buildTools ?? []),
        ...updates.techStack.buildTools,
      ]);
    }
    if (updates.techStack.packageManagers !== undefined) {
      merged.techStack.packageManagers = deduplicatePrimitiveArray([
        ...(existing.techStack.packageManagers ?? []),
        ...updates.techStack.packageManagers,
      ]);
    }
  }

  // Merge architecture
  if (updates.architecture !== undefined) {
    merged.architecture = { ...existing.architecture, ...updates.architecture };
    if (updates.architecture.modules !== undefined) {
      merged.architecture.modules = mergeArrayByKey(
        existing.architecture.modules ?? [],
        updates.architecture.modules,
        "name",
      );
    }
    if (updates.architecture.entryPoints !== undefined) {
      merged.architecture.entryPoints = deduplicatePrimitiveArray([
        ...(existing.architecture.entryPoints ?? []),
        ...updates.architecture.entryPoints,
      ]);
    }
  }

  // Merge team (deduplicate by name)
  if (updates.team !== undefined) {
    merged.team = mergeArrayByKey(existing.team ?? [], updates.team, "name");
  }

  // Merge workflows (deduplicate by name)
  if (updates.workflows !== undefined) {
    merged.workflows = mergeArrayByKey(existing.workflows, updates.workflows, "name");
  }

  // Merge processes (deduplicate by id)
  if (updates.processes !== undefined) {
    merged.processes = mergeArrayByKey(
      existing.processes ?? [],
      updates.processes,
      "id",
    );
  }

  // Merge tools (shallow spread per category)
  if (updates.tools !== undefined) {
    merged.tools = { ...existing.tools };
    if (updates.tools.linting !== undefined) {
      merged.tools.linting = mergeArrayByKey(
        existing.tools?.linting ?? [],
        updates.tools.linting,
        "name",
      );
    }
    if (updates.tools.testing !== undefined) {
      merged.tools.testing = mergeArrayByKey(
        existing.tools?.testing ?? [],
        updates.tools.testing,
        "name",
      );
    }
    if (updates.tools.formatting !== undefined) {
      merged.tools.formatting = mergeArrayByKey(
        existing.tools?.formatting ?? [],
        updates.tools.formatting,
        "name",
      );
    }
    // Merge additional tool categories
    for (const [key, value] of Object.entries(updates.tools)) {
      if (key !== "linting" && key !== "testing" && key !== "formatting") {
        (merged.tools as Record<string, unknown>)[key] = value;
      }
    }
  }

  // Merge services (deduplicate by name)
  if (updates.services !== undefined) {
    merged.services = mergeArrayByKey(
      existing.services ?? [],
      updates.services,
      "name",
    );
  }

  // Merge external integrations (deduplicate by service)
  if (updates.externalIntegrations !== undefined) {
    merged.externalIntegrations = mergeArrayByKey(
      existing.externalIntegrations ?? [],
      updates.externalIntegrations,
      "service",
    );
  }

  // Merge CI/CD
  if (updates.cicd !== undefined) {
    merged.cicd = { ...(existing.cicd ?? {}), ...updates.cicd };
    if (updates.cicd.configPaths !== undefined) {
      merged.cicd.configPaths = deduplicatePrimitiveArray([
        ...(existing.cicd?.configPaths ?? []),
        ...updates.cicd.configPaths,
      ]);
    }
    if (updates.cicd.pipelines !== undefined) {
      merged.cicd.pipelines = mergeArrayByKey(
        existing.cicd?.pipelines ?? [],
        updates.cicd.pipelines,
        "name",
      );
    }
    if (updates.cicd.babysitterIntegration !== undefined) {
      merged.cicd.babysitterIntegration = {
        ...(existing.cicd?.babysitterIntegration ?? {}),
        ...updates.cicd.babysitterIntegration,
      };
      if (updates.cicd.babysitterIntegration.triggerOn) {
        merged.cicd.babysitterIntegration.triggerOn = deduplicatePrimitiveArray([
          ...(existing.cicd?.babysitterIntegration?.triggerOn ?? []),
          ...updates.cicd.babysitterIntegration.triggerOn,
        ]);
      }
      if (updates.cicd.babysitterIntegration.processIds) {
        merged.cicd.babysitterIntegration.processIds = deduplicatePrimitiveArray([
          ...(existing.cicd?.babysitterIntegration?.processIds ?? []),
          ...updates.cicd.babysitterIntegration.processIds,
        ]);
      }
    }
  }

  // Merge pain points (deduplicate by id)
  if (updates.painPoints !== undefined) {
    merged.painPoints = mergeArrayByKey(
      existing.painPoints ?? [],
      updates.painPoints,
      "id",
    );
  }

  // Merge bottlenecks (deduplicate by id)
  if (updates.bottlenecks !== undefined) {
    merged.bottlenecks = mergeArrayByKey(
      existing.bottlenecks ?? [],
      updates.bottlenecks,
      "id",
    );
  }

  // Merge conventions (shallow spread per sub-object)
  if (updates.conventions !== undefined) {
    merged.conventions = { ...existing.conventions };
    if (updates.conventions.naming !== undefined) {
      merged.conventions.naming = {
        ...(existing.conventions.naming ?? {}),
        ...updates.conventions.naming,
      };
    }
    if (updates.conventions.git !== undefined) {
      merged.conventions.git = {
        ...(existing.conventions.git ?? {}),
        ...updates.conventions.git,
      };
    }
    if (updates.conventions.codeStyle !== undefined) {
      merged.conventions.codeStyle = {
        ...(existing.conventions.codeStyle ?? {}),
        ...updates.conventions.codeStyle,
      };
    }
    if (updates.conventions.importOrder !== undefined) {
      merged.conventions.importOrder = deduplicatePrimitiveArray([
        ...(existing.conventions.importOrder ?? []),
        ...updates.conventions.importOrder,
      ]);
    }
    if (updates.conventions.errorHandling !== undefined) {
      merged.conventions.errorHandling = updates.conventions.errorHandling;
    }
    if (updates.conventions.testingConventions !== undefined) {
      merged.conventions.testingConventions = updates.conventions.testingConventions;
    }
    if (updates.conventions.additionalRules !== undefined) {
      merged.conventions.additionalRules = deduplicatePrimitiveArray([
        ...(existing.conventions.additionalRules ?? []),
        ...updates.conventions.additionalRules,
      ]);
    }
  }

  // Merge repositories (deduplicate by name)
  if (updates.repositories !== undefined) {
    merged.repositories = mergeArrayByKey(
      existing.repositories ?? [],
      updates.repositories,
      "name",
    );
  }

  // Merge CLAUDE.md instructions (deduplicate)
  if (updates.claudeMdInstructions !== undefined) {
    merged.claudeMdInstructions = deduplicatePrimitiveArray([
      ...(existing.claudeMdInstructions ?? []),
      ...updates.claudeMdInstructions,
    ]);
  }

  // Merge installed skills/agents/processes (deduplicate)
  if (updates.installedSkills !== undefined) {
    merged.installedSkills = deduplicatePrimitiveArray([
      ...(existing.installedSkills ?? []),
      ...updates.installedSkills,
    ]);
  }
  if (updates.installedAgents !== undefined) {
    merged.installedAgents = deduplicatePrimitiveArray([
      ...(existing.installedAgents ?? []),
      ...updates.installedAgents,
    ]);
  }
  if (updates.installedProcesses !== undefined) {
    merged.installedProcesses = deduplicatePrimitiveArray([
      ...(existing.installedProcesses ?? []),
      ...updates.installedProcesses,
    ]);
  }

  // Always update metadata
  merged.updatedAt = new Date().toISOString();
  merged.version = existing.version + 1;

  return merged;
}

/**
 * Creates a new project profile with sensible defaults.
 *
 * @param projectName - Name of the project
 * @returns A complete project profile with default values
 */
export function createDefaultProjectProfile(projectName: string): ProjectProfile {
  const now = new Date().toISOString();
  return {
    projectName,
    description: "",
    goals: [],
    techStack: {},
    architecture: {},
    workflows: [],
    tools: {},
    conventions: {},
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

/**
 * Renders a human-readable markdown summary of a project profile.
 *
 * @param profile - The project profile to render
 * @returns Markdown-formatted string summarizing the profile
 */
export function renderProjectProfileMarkdown(profile: ProjectProfile): string {
  const lines: string[] = [];

  lines.push(`# Project Profile: ${profile.projectName}`);
  lines.push("");
  if (profile.description) {
    lines.push(profile.description);
    lines.push("");
  }
  lines.push(`> Last updated: ${profile.updatedAt} | Version: ${profile.version}`);
  lines.push("");

  // Goals
  if (profile.goals.length > 0) {
    lines.push("## Goals");
    lines.push("");
    for (const goal of profile.goals) {
      const priority = goal.priority ? ` [${goal.priority}]` : "";
      const status = goal.status ? ` (${goal.status})` : "";
      const category = goal.category ? `**${goal.category}**` : "";
      lines.push(`- ${category}${priority}: ${goal.description}${status}`);
    }
    lines.push("");
  }

  // Tech Stack
  const ts = profile.techStack;
  const hasTechStack =
    (ts.languages?.length ?? 0) > 0 ||
    (ts.frameworks?.length ?? 0) > 0 ||
    (ts.databases?.length ?? 0) > 0 ||
    (ts.infrastructure?.length ?? 0) > 0 ||
    (ts.buildTools?.length ?? 0) > 0 ||
    (ts.packageManagers?.length ?? 0) > 0;
  if (hasTechStack) {
    lines.push("## Tech Stack");
    lines.push("");
    if (ts.languages?.length) {
      lines.push("### Languages");
      lines.push("");
      for (const lang of ts.languages) {
        const version = lang.version ? ` v${lang.version}` : "";
        const role = lang.role ? ` (${lang.role})` : "";
        lines.push(`- ${lang.name}${version}${role}`);
      }
      lines.push("");
    }
    if (ts.frameworks?.length) {
      lines.push("### Frameworks");
      lines.push("");
      for (const fw of ts.frameworks) {
        const version = fw.version ? ` v${fw.version}` : "";
        const category = fw.category ? ` [${fw.category}]` : "";
        lines.push(`- ${fw.name}${version}${category}`);
      }
      lines.push("");
    }
    if (ts.databases?.length) {
      lines.push("### Databases");
      lines.push("");
      for (const db of ts.databases) {
        const dbType = db.type ? ` (${db.type})` : "";
        const version = db.version ? ` v${db.version}` : "";
        lines.push(`- ${db.name}${dbType}${version}`);
      }
      lines.push("");
    }
    if (ts.infrastructure?.length) {
      lines.push("### Infrastructure");
      lines.push("");
      for (const infra of ts.infrastructure) {
        const category = infra.category ? ` [${infra.category}]` : "";
        lines.push(`- ${infra.name}${category}`);
      }
      lines.push("");
    }
    if (ts.buildTools?.length) {
      lines.push(`**Build tools:** ${ts.buildTools.join(", ")}`);
      lines.push("");
    }
    if (ts.packageManagers?.length) {
      lines.push(`**Package managers:** ${ts.packageManagers.join(", ")}`);
      lines.push("");
    }
  }

  // Architecture
  const arch = profile.architecture;
  const hasArchitecture =
    arch.pattern ||
    (arch.modules?.length ?? 0) > 0 ||
    (arch.entryPoints?.length ?? 0) > 0;
  if (hasArchitecture) {
    lines.push("## Architecture");
    lines.push("");
    if (arch.pattern) lines.push(`**Pattern:** ${arch.pattern}`);
    if (arch.dataFlow) lines.push(`**Data flow:** ${arch.dataFlow}`);
    lines.push("");
    if (arch.modules?.length) {
      lines.push("### Modules");
      lines.push("");
      lines.push("| Module | Path | Description |");
      lines.push("|--------|------|-------------|");
      for (const mod of arch.modules) {
        const desc = mod.description ?? "";
        lines.push(`| ${mod.name} | \`${mod.path}\` | ${desc} |`);
      }
      lines.push("");
    }
    if (arch.entryPoints?.length) {
      lines.push(`**Entry points:** ${arch.entryPoints.map((e) => `\`${e}\``).join(", ")}`);
      lines.push("");
    }
  }

  // Team
  if (profile.team?.length) {
    lines.push("## Team");
    lines.push("");
    for (const member of profile.team) {
      const responsibilities = member.responsibilities?.length
        ? `: ${member.responsibilities.join(", ")}`
        : "";
      lines.push(`- **${member.name}** (${member.role})${responsibilities}`);
    }
    lines.push("");
  }

  // Workflows
  if (profile.workflows.length > 0) {
    lines.push("## Workflows");
    lines.push("");
    for (const wf of profile.workflows) {
      lines.push(`### ${wf.name}`);
      lines.push("");
      if (wf.description) lines.push(wf.description);
      if (wf.triggers?.length) {
        lines.push(`**Triggers:** ${wf.triggers.join(", ")}`);
      }
      if (wf.steps?.length) {
        lines.push("");
        for (let i = 0; i < wf.steps.length; i++) {
          lines.push(`${i + 1}. ${wf.steps[i]}`);
        }
      }
      lines.push("");
    }
  }

  // Processes
  if (profile.processes?.length) {
    lines.push("## Processes");
    lines.push("");
    for (const proc of profile.processes) {
      const desc = proc.description ? ` - ${proc.description}` : "";
      lines.push(`- **${proc.name}** (\`${proc.id}\`, ${proc.type})${desc}`);
    }
    lines.push("");
  }

  // Tools
  const tools = profile.tools;
  const hasTools =
    (tools?.linting as unknown[] | undefined)?.length ||
    (tools?.testing as unknown[] | undefined)?.length ||
    (tools?.formatting as unknown[] | undefined)?.length;
  if (hasTools) {
    lines.push("## Tools");
    lines.push("");
    if (tools?.linting && (tools.linting as unknown[]).length > 0) {
      lines.push("### Linting");
      lines.push("");
      for (const tool of tools.linting) {
        const config = tool.configPath ? ` (\`${tool.configPath}\`)` : "";
        lines.push(`- ${tool.name}${config}`);
      }
      lines.push("");
    }
    if (tools?.testing && (tools.testing as unknown[]).length > 0) {
      lines.push("### Testing");
      lines.push("");
      for (const tool of tools.testing) {
        const config = tool.configPath ? ` (\`${tool.configPath}\`)` : "";
        const cmd = tool.command ? ` \`${tool.command}\`` : "";
        lines.push(`- ${tool.name}${config}${cmd}`);
      }
      lines.push("");
    }
    if (tools?.formatting && (tools.formatting as unknown[]).length > 0) {
      lines.push("### Formatting");
      lines.push("");
      for (const tool of tools.formatting) {
        const config = tool.configPath ? ` (\`${tool.configPath}\`)` : "";
        lines.push(`- ${tool.name}${config}`);
      }
      lines.push("");
    }
  }

  // Services
  if (profile.services?.length) {
    lines.push("## Services");
    lines.push("");
    for (const svc of profile.services) {
      const url = svc.url ? ` - ${svc.url}` : "";
      lines.push(`- **${svc.name}** (${svc.type})${url}`);
    }
    lines.push("");
  }

  // CI/CD
  if (profile.cicd) {
    lines.push("## CI/CD");
    lines.push("");
    if (profile.cicd.provider) lines.push(`**Provider:** ${profile.cicd.provider}`);
    if (profile.cicd.configPaths?.length) {
      lines.push(`**Config files:** ${profile.cicd.configPaths.map((p) => `\`${p}\``).join(", ")}`);
    }
    if (profile.cicd.pipelines?.length) {
      lines.push("");
      lines.push("### Pipelines");
      lines.push("");
      for (const pipeline of profile.cicd.pipelines) {
        const trigger = pipeline.trigger ? ` (trigger: ${pipeline.trigger})` : "";
        lines.push(`- **${pipeline.name}**${trigger}`);
        if (pipeline.stages?.length) {
          lines.push(`  Stages: ${pipeline.stages.join(" -> ")}`);
        }
      }
    }
    lines.push("");
  }

  // Pain Points
  if (profile.painPoints?.length) {
    lines.push("## Pain Points");
    lines.push("");
    for (const pp of profile.painPoints) {
      const category = pp.category ? ` [${pp.category}]` : "";
      lines.push(`- **${pp.severity}**${category}: ${pp.description}`);
      if (pp.suggestedRemediation) {
        lines.push(`  - Remediation: ${pp.suggestedRemediation}`);
      }
    }
    lines.push("");
  }

  // Bottlenecks
  if (profile.bottlenecks?.length) {
    lines.push("## Bottlenecks");
    lines.push("");
    for (const bn of profile.bottlenecks) {
      const location = bn.location ? ` at ${bn.location}` : "";
      const freq = bn.frequency ? ` (${bn.frequency})` : "";
      lines.push(`- ${bn.description}${location}${freq}`);
      lines.push(`  Impact: ${bn.impact}`);
    }
    lines.push("");
  }

  // Conventions
  const conv = profile.conventions;
  const hasConventions =
    conv.naming ||
    conv.git ||
    conv.errorHandling ||
    conv.testingConventions ||
    conv.additionalRules?.length;
  if (hasConventions) {
    lines.push("## Conventions");
    lines.push("");
    if (conv.naming) {
      lines.push("### Naming");
      lines.push("");
      for (const [entity, rule] of Object.entries(conv.naming)) {
        lines.push(`- **${entity}:** ${rule}`);
      }
      lines.push("");
    }
    if (conv.git) {
      lines.push("### Git");
      lines.push("");
      for (const [key, value] of Object.entries(conv.git)) {
        lines.push(`- **${key}:** ${value}`);
      }
      lines.push("");
    }
    if (conv.importOrder?.length) {
      lines.push(`**Import order:** ${conv.importOrder.join(" > ")}`);
      lines.push("");
    }
    if (conv.errorHandling) {
      lines.push(`**Error handling:** ${conv.errorHandling}`);
      lines.push("");
    }
    if (conv.testingConventions) {
      lines.push(`**Testing:** ${conv.testingConventions}`);
      lines.push("");
    }
    if (conv.additionalRules?.length) {
      lines.push("### Additional Rules");
      lines.push("");
      for (const rule of conv.additionalRules) {
        lines.push(`- ${rule}`);
      }
      lines.push("");
    }
  }

  // Repositories
  if (profile.repositories?.length) {
    lines.push("## Repositories");
    lines.push("");
    for (const repo of profile.repositories) {
      const primary = repo.isPrimary ? " (primary)" : "";
      const url = repo.url ? ` - ${repo.url}` : "";
      const repoPath = repo.path ? ` [\`${repo.path}\`]` : "";
      lines.push(`- **${repo.name}**${primary}${url}${repoPath}`);
    }
    lines.push("");
  }

  // CLAUDE.md Instructions
  if (profile.claudeMdInstructions?.length) {
    lines.push("## CLAUDE.md Instructions");
    lines.push("");
    for (const instruction of profile.claudeMdInstructions) {
      lines.push(`- ${instruction}`);
    }
    lines.push("");
  }

  // Installed Extensions
  const hasExtensions =
    (profile.installedSkills?.length ?? 0) > 0 ||
    (profile.installedAgents?.length ?? 0) > 0 ||
    (profile.installedProcesses?.length ?? 0) > 0;
  if (hasExtensions) {
    lines.push("## Installed Extensions");
    lines.push("");
    if (profile.installedSkills?.length) {
      lines.push(`- Skills: ${profile.installedSkills.join(", ")}`);
    }
    if (profile.installedAgents?.length) {
      lines.push(`- Agents: ${profile.installedAgents.join(", ")}`);
    }
    if (profile.installedProcesses?.length) {
      lines.push(`- Processes: ${profile.installedProcesses.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Internal Helpers ─────────────────────────────────────────────────

/**
 * Merges two arrays of objects, deduplicating by a specified key field.
 * Items from the `updates` array take precedence over `existing` items
 * with the same key value.
 */
function mergeArrayByKey<T, K extends keyof T>(
  existing: T[],
  updates: T[],
  key: K,
): T[] {
  const map = new Map<unknown, T>();
  for (const item of existing) {
    const keyValue = item[key];
    if (keyValue !== undefined) {
      map.set(keyValue, item);
    }
  }
  for (const item of updates) {
    const keyValue = item[key];
    if (keyValue !== undefined) {
      const prev = map.get(keyValue);
      map.set(keyValue, prev ? { ...prev, ...item } : item);
    } else {
      // Items without the key field are appended
      map.set(Symbol(), item);
    }
  }
  return Array.from(map.values());
}

/**
 * Removes duplicate primitive values from an array while preserving order.
 */
function deduplicatePrimitiveArray<T extends string | number | boolean>(arr: T[]): T[] {
  return [...new Set(arr)];
}

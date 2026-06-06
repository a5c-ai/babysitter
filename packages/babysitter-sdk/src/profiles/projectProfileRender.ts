import type { ProjectProfile } from "./types";

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

  appendGoals(lines, profile);
  appendTechStack(lines, profile);
  appendArchitecture(lines, profile);
  appendTeam(lines, profile);
  appendWorkflows(lines, profile);
  appendProcesses(lines, profile);
  appendTools(lines, profile);
  appendServices(lines, profile);
  appendCicd(lines, profile);
  appendPainPoints(lines, profile);
  appendBottlenecks(lines, profile);
  appendConventions(lines, profile);
  appendRepositories(lines, profile);
  appendClaudeInstructions(lines, profile);
  appendInstalledExtensions(lines, profile);

  return lines.join("\n");
}

function appendGoals(lines: string[], profile: ProjectProfile): void {
  if (profile.goals.length === 0) return;
  lines.push("## Goals", "");
  for (const goal of profile.goals) {
    const priority = goal.priority ? ` [${goal.priority}]` : "";
    const status = goal.status ? ` (${goal.status})` : "";
    const category = goal.category ? `**${goal.category}**` : "";
    lines.push(`- ${category}${priority}: ${goal.description}${status}`);
  }
  lines.push("");
}

function appendTechStack(lines: string[], profile: ProjectProfile): void {
  const techStack = profile.techStack;
  const hasTechStack =
    (techStack.languages?.length ?? 0) > 0 ||
    (techStack.frameworks?.length ?? 0) > 0 ||
    (techStack.databases?.length ?? 0) > 0 ||
    (techStack.infrastructure?.length ?? 0) > 0 ||
    (techStack.buildTools?.length ?? 0) > 0 ||
    (techStack.packageManagers?.length ?? 0) > 0;
  if (!hasTechStack) return;

  lines.push("## Tech Stack", "");
  appendNamedVersionList(lines, "Languages", techStack.languages, (entry) => `${entry.name}${entry.version ? ` v${entry.version}` : ""}${entry.role ? ` (${entry.role})` : ""}`);
  appendNamedVersionList(lines, "Frameworks", techStack.frameworks, (entry) => `${entry.name}${entry.version ? ` v${entry.version}` : ""}${entry.category ? ` [${entry.category}]` : ""}`);
  appendNamedVersionList(lines, "Databases", techStack.databases, (entry) => `${entry.name}${entry.type ? ` (${entry.type})` : ""}${entry.version ? ` v${entry.version}` : ""}`);
  appendNamedVersionList(lines, "Infrastructure", techStack.infrastructure, (entry) => `${entry.name}${entry.category ? ` [${entry.category}]` : ""}`);
  if (techStack.buildTools?.length) {
    lines.push(`**Build tools:** ${techStack.buildTools.join(", ")}`, "");
  }
  if (techStack.packageManagers?.length) {
    lines.push(`**Package managers:** ${techStack.packageManagers.join(", ")}`, "");
  }
}

function appendArchitecture(lines: string[], profile: ProjectProfile): void {
  const architecture = profile.architecture;
  const hasArchitecture = architecture.pattern || (architecture.modules?.length ?? 0) > 0 || (architecture.entryPoints?.length ?? 0) > 0;
  if (!hasArchitecture) return;

  lines.push("## Architecture", "");
  if (architecture.pattern) lines.push(`**Pattern:** ${architecture.pattern}`);
  if (architecture.dataFlow) lines.push(`**Data flow:** ${architecture.dataFlow}`);
  lines.push("");
  if (architecture.modules?.length) {
    lines.push("### Modules", "", "| Module | Path | Description |", "|--------|------|-------------|");
    for (const moduleEntry of architecture.modules) {
      lines.push(`| ${moduleEntry.name} | \`${moduleEntry.path}\` | ${moduleEntry.description ?? ""} |`);
    }
    lines.push("");
  }
  if (architecture.entryPoints?.length) {
    lines.push(`**Entry points:** ${architecture.entryPoints.map((entry) => `\`${entry}\``).join(", ")}`, "");
  }
}

function appendTeam(lines: string[], profile: ProjectProfile): void {
  if (!profile.team?.length) return;
  lines.push("## Team", "");
  for (const member of profile.team) {
    const responsibilities = member.responsibilities?.length ? `: ${member.responsibilities.join(", ")}` : "";
    lines.push(`- **${member.name}** (${member.role})${responsibilities}`);
  }
  lines.push("");
}

function appendWorkflows(lines: string[], profile: ProjectProfile): void {
  if (profile.workflows.length === 0) return;
  lines.push("## Workflows", "");
  for (const workflow of profile.workflows) {
    lines.push(`### ${workflow.name}`, "");
    if (workflow.description) lines.push(workflow.description);
    if (workflow.triggers?.length) {
      lines.push(`**Triggers:** ${workflow.triggers.join(", ")}`);
    }
    if (workflow.steps?.length) {
      lines.push("");
      for (let index = 0; index < workflow.steps.length; index += 1) {
        lines.push(`${index + 1}. ${workflow.steps[index]}`);
      }
    }
    lines.push("");
  }
}

function appendProcesses(lines: string[], profile: ProjectProfile): void {
  if (!profile.processes?.length) return;
  lines.push("## Processes", "");
  for (const process of profile.processes) {
    lines.push(`- **${process.name}** (\`${process.id}\`, ${process.type})${process.description ? ` - ${process.description}` : ""}`);
  }
  lines.push("");
}

function appendTools(lines: string[], profile: ProjectProfile): void {
  const tools = profile.tools;
  const hasTools = (tools?.linting as unknown[] | undefined)?.length || (tools?.testing as unknown[] | undefined)?.length || (tools?.formatting as unknown[] | undefined)?.length;
  if (!hasTools) return;

  lines.push("## Tools", "");
  appendToolSection(lines, "Linting", tools?.linting);
  appendToolSection(lines, "Testing", tools?.testing, true);
  appendToolSection(lines, "Formatting", tools?.formatting);
}

function appendServices(lines: string[], profile: ProjectProfile): void {
  if (!profile.services?.length) return;
  lines.push("## Services", "");
  for (const service of profile.services) {
    lines.push(`- **${service.name}** (${service.type})${service.url ? ` - ${service.url}` : ""}`);
  }
  lines.push("");
}

function appendCicd(lines: string[], profile: ProjectProfile): void {
  if (!profile.cicd) return;
  lines.push("## CI/CD", "");
  if (profile.cicd.provider) lines.push(`**Provider:** ${profile.cicd.provider}`);
  if (profile.cicd.configPaths?.length) {
    lines.push(`**Config files:** ${profile.cicd.configPaths.map((configPath) => `\`${configPath}\``).join(", ")}`);
  }
  if (profile.cicd.pipelines?.length) {
    lines.push("", "### Pipelines", "");
    for (const pipeline of profile.cicd.pipelines) {
      lines.push(`- **${pipeline.name}**${pipeline.trigger ? ` (trigger: ${pipeline.trigger})` : ""}`);
      if (pipeline.stages?.length) {
        lines.push(`  Stages: ${pipeline.stages.join(" -> ")}`);
      }
    }
  }
  lines.push("");
}

function appendPainPoints(lines: string[], profile: ProjectProfile): void {
  if (!profile.painPoints?.length) return;
  lines.push("## Pain Points", "");
  for (const painPoint of profile.painPoints) {
    lines.push(`- **${painPoint.severity}**${painPoint.category ? ` [${painPoint.category}]` : ""}: ${painPoint.description}`);
    if (painPoint.suggestedRemediation) {
      lines.push(`  - Remediation: ${painPoint.suggestedRemediation}`);
    }
  }
  lines.push("");
}

function appendBottlenecks(lines: string[], profile: ProjectProfile): void {
  if (!profile.bottlenecks?.length) return;
  lines.push("## Bottlenecks", "");
  for (const bottleneck of profile.bottlenecks) {
    lines.push(`- ${bottleneck.description}${bottleneck.location ? ` at ${bottleneck.location}` : ""}${bottleneck.frequency ? ` (${bottleneck.frequency})` : ""}`);
    lines.push(`  Impact: ${bottleneck.impact}`);
  }
  lines.push("");
}

function appendConventions(lines: string[], profile: ProjectProfile): void {
  const conventions = profile.conventions;
  const hasConventions =
    conventions.naming ||
    conventions.git ||
    conventions.errorHandling ||
    conventions.testingConventions ||
    conventions.additionalRules?.length;
  if (!hasConventions) return;

  lines.push("## Conventions", "");
  appendObjectSection(lines, "Naming", conventions.naming);
  appendObjectSection(lines, "Git", conventions.git);
  if (conventions.importOrder?.length) {
    lines.push(`**Import order:** ${conventions.importOrder.join(" > ")}`, "");
  }
  if (conventions.errorHandling) {
    lines.push(`**Error handling:** ${conventions.errorHandling}`, "");
  }
  if (conventions.testingConventions) {
    lines.push(`**Testing:** ${conventions.testingConventions}`, "");
  }
  if (conventions.additionalRules?.length) {
    lines.push("### Additional Rules", "");
    for (const rule of conventions.additionalRules) {
      lines.push(`- ${rule}`);
    }
    lines.push("");
  }
}

function appendRepositories(lines: string[], profile: ProjectProfile): void {
  if (!profile.repositories?.length) return;
  lines.push("## Repositories", "");
  for (const repository of profile.repositories) {
    lines.push(`- **${repository.name}**${repository.isPrimary ? " (primary)" : ""}${repository.url ? ` - ${repository.url}` : ""}${repository.path ? ` [\`${repository.path}\`]` : ""}`);
  }
  lines.push("");
}

function appendClaudeInstructions(lines: string[], profile: ProjectProfile): void {
  if (!profile.claudeMdInstructions?.length) return;
  lines.push("## CLAUDE.md Instructions", "");
  for (const instruction of profile.claudeMdInstructions) {
    lines.push(`- ${instruction}`);
  }
  lines.push("");
}

function appendInstalledExtensions(lines: string[], profile: ProjectProfile): void {
  const hasExtensions =
    (profile.installedSkills?.length ?? 0) > 0 ||
    (profile.installedAgents?.length ?? 0) > 0 ||
    (profile.installedProcesses?.length ?? 0) > 0;
  if (!hasExtensions) return;

  lines.push("## Installed Extensions", "");
  if (profile.installedSkills?.length) lines.push(`- Skills: ${profile.installedSkills.join(", ")}`);
  if (profile.installedAgents?.length) lines.push(`- Agents: ${profile.installedAgents.join(", ")}`);
  if (profile.installedProcesses?.length) lines.push(`- Processes: ${profile.installedProcesses.join(", ")}`);
  lines.push("");
}

function appendNamedVersionList<T>(lines: string[], heading: string, entries: T[] | undefined, formatEntry: (entry: T) => string): void {
  if (!entries?.length) return;
  lines.push(`### ${heading}`, "");
  for (const entry of entries) {
    lines.push(`- ${formatEntry(entry)}`);
  }
  lines.push("");
}

function appendToolSection(
  lines: string[],
  heading: string,
  tools: Array<{ name: string; configPath?: string; command?: string }> | undefined,
  includeCommand = false,
): void {
  if (!tools?.length) return;
  lines.push(`### ${heading}`, "");
  for (const tool of tools) {
    lines.push(`- ${tool.name}${tool.configPath ? ` (\`${tool.configPath}\`)` : ""}${includeCommand && tool.command ? ` \`${tool.command}\`` : ""}`);
  }
  lines.push("");
}

function appendObjectSection(lines: string[], heading: string, values: Record<string, string> | undefined): void {
  if (!values) return;
  lines.push(`### ${heading}`, "");
  for (const [key, value] of Object.entries(values)) {
    lines.push(`- **${key}:** ${value}`);
  }
  lines.push("");
}

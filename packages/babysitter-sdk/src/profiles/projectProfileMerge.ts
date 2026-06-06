import type { ProjectProfile } from "./types";

export function mergeProjectProfile(
  existing: ProjectProfile,
  updates: Partial<ProjectProfile>,
): ProjectProfile {
  const merged: ProjectProfile = { ...existing };

  if (updates.projectName !== undefined) merged.projectName = updates.projectName;
  if (updates.description !== undefined) merged.description = updates.description;
  if (updates.createdAt !== undefined) merged.createdAt = updates.createdAt;

  if (updates.goals !== undefined) {
    merged.goals = mergeArrayByKey(existing.goals, updates.goals, "id");
  }

  if (updates.techStack !== undefined) {
    merged.techStack = { ...existing.techStack };
    if (updates.techStack.languages !== undefined) {
      merged.techStack.languages = mergeArrayByKey(existing.techStack.languages ?? [], updates.techStack.languages, "name");
    }
    if (updates.techStack.frameworks !== undefined) {
      merged.techStack.frameworks = mergeArrayByKey(existing.techStack.frameworks ?? [], updates.techStack.frameworks, "name");
    }
    if (updates.techStack.databases !== undefined) {
      merged.techStack.databases = mergeArrayByKey(existing.techStack.databases ?? [], updates.techStack.databases, "name");
    }
    if (updates.techStack.infrastructure !== undefined) {
      merged.techStack.infrastructure = mergeArrayByKey(existing.techStack.infrastructure ?? [], updates.techStack.infrastructure, "name");
    }
    if (updates.techStack.buildTools !== undefined) {
      merged.techStack.buildTools = deduplicatePrimitiveArray([...(existing.techStack.buildTools ?? []), ...updates.techStack.buildTools]);
    }
    if (updates.techStack.packageManagers !== undefined) {
      merged.techStack.packageManagers = deduplicatePrimitiveArray([...(existing.techStack.packageManagers ?? []), ...updates.techStack.packageManagers]);
    }
  }

  if (updates.architecture !== undefined) {
    merged.architecture = { ...existing.architecture, ...updates.architecture };
    if (updates.architecture.modules !== undefined) {
      merged.architecture.modules = mergeArrayByKey(existing.architecture.modules ?? [], updates.architecture.modules, "name");
    }
    if (updates.architecture.entryPoints !== undefined) {
      merged.architecture.entryPoints = deduplicatePrimitiveArray([...(existing.architecture.entryPoints ?? []), ...updates.architecture.entryPoints]);
    }
  }

  if (updates.team !== undefined) {
    merged.team = mergeArrayByKey(existing.team ?? [], updates.team, "name");
  }
  if (updates.workflows !== undefined) {
    merged.workflows = mergeArrayByKey(existing.workflows, updates.workflows, "name");
  }
  if (updates.processes !== undefined) {
    merged.processes = mergeArrayByKey(existing.processes ?? [], updates.processes, "id");
  }

  if (updates.tools !== undefined) {
    merged.tools = { ...existing.tools };
    if (updates.tools.linting !== undefined) {
      merged.tools.linting = mergeArrayByKey(existing.tools?.linting ?? [], updates.tools.linting, "name");
    }
    if (updates.tools.testing !== undefined) {
      merged.tools.testing = mergeArrayByKey(existing.tools?.testing ?? [], updates.tools.testing, "name");
    }
    if (updates.tools.formatting !== undefined) {
      merged.tools.formatting = mergeArrayByKey(existing.tools?.formatting ?? [], updates.tools.formatting, "name");
    }
    for (const [key, value] of Object.entries(updates.tools)) {
      if (key !== "linting" && key !== "testing" && key !== "formatting") {
        (merged.tools as Record<string, unknown>)[key] = value;
      }
    }
  }

  if (updates.services !== undefined) {
    merged.services = mergeArrayByKey(existing.services ?? [], updates.services, "name");
  }
  if (updates.externalIntegrations !== undefined) {
    merged.externalIntegrations = mergeArrayByKey(existing.externalIntegrations ?? [], updates.externalIntegrations, "service");
  }

  if (updates.cicd !== undefined) {
    merged.cicd = { ...(existing.cicd ?? {}), ...updates.cicd };
    if (updates.cicd.configPaths !== undefined) {
      merged.cicd.configPaths = deduplicatePrimitiveArray([...(existing.cicd?.configPaths ?? []), ...updates.cicd.configPaths]);
    }
    if (updates.cicd.pipelines !== undefined) {
      merged.cicd.pipelines = mergeArrayByKey(existing.cicd?.pipelines ?? [], updates.cicd.pipelines, "name");
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

  if (updates.painPoints !== undefined) {
    merged.painPoints = mergeArrayByKey(existing.painPoints ?? [], updates.painPoints, "id");
  }
  if (updates.bottlenecks !== undefined) {
    merged.bottlenecks = mergeArrayByKey(existing.bottlenecks ?? [], updates.bottlenecks, "id");
  }

  if (updates.conventions !== undefined) {
    merged.conventions = { ...existing.conventions };
    if (updates.conventions.naming !== undefined) {
      merged.conventions.naming = { ...(existing.conventions.naming ?? {}), ...updates.conventions.naming };
    }
    if (updates.conventions.git !== undefined) {
      merged.conventions.git = { ...(existing.conventions.git ?? {}), ...updates.conventions.git };
    }
    if (updates.conventions.codeStyle !== undefined) {
      merged.conventions.codeStyle = { ...(existing.conventions.codeStyle ?? {}), ...updates.conventions.codeStyle };
    }
    if (updates.conventions.importOrder !== undefined) {
      merged.conventions.importOrder = deduplicatePrimitiveArray([...(existing.conventions.importOrder ?? []), ...updates.conventions.importOrder]);
    }
    if (updates.conventions.errorHandling !== undefined) {
      merged.conventions.errorHandling = updates.conventions.errorHandling;
    }
    if (updates.conventions.testingConventions !== undefined) {
      merged.conventions.testingConventions = updates.conventions.testingConventions;
    }
    if (updates.conventions.additionalRules !== undefined) {
      merged.conventions.additionalRules = deduplicatePrimitiveArray([...(existing.conventions.additionalRules ?? []), ...updates.conventions.additionalRules]);
    }
  }

  if (updates.repositories !== undefined) {
    merged.repositories = mergeArrayByKey(existing.repositories ?? [], updates.repositories, "name");
  }
  if (updates.claudeMdInstructions !== undefined) {
    merged.claudeMdInstructions = deduplicatePrimitiveArray([...(existing.claudeMdInstructions ?? []), ...updates.claudeMdInstructions]);
  }
  if (updates.installedSkills !== undefined) {
    merged.installedSkills = deduplicatePrimitiveArray([...(existing.installedSkills ?? []), ...updates.installedSkills]);
  }
  if (updates.installedAgents !== undefined) {
    merged.installedAgents = deduplicatePrimitiveArray([...(existing.installedAgents ?? []), ...updates.installedAgents]);
  }
  if (updates.installedProcesses !== undefined) {
    merged.installedProcesses = deduplicatePrimitiveArray([...(existing.installedProcesses ?? []), ...updates.installedProcesses]);
  }

  merged.updatedAt = new Date().toISOString();
  merged.version = existing.version + 1;
  return merged;
}

function mergeArrayByKey<T, K extends keyof T>(existing: T[], updates: T[], key: K): T[] {
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
      const previous = map.get(keyValue);
      map.set(keyValue, previous ? { ...previous, ...item } : item);
    } else {
      map.set(Symbol(), item);
    }
  }
  return Array.from(map.values());
}

function deduplicatePrimitiveArray<T extends string | number | boolean>(values: T[]): T[] {
  return [...new Set(values)];
}

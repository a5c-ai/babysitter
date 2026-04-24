/**
 * Skill, agent, and process discovery CLI commands.
 * Replaces bash logic from skill-context-resolver.sh and skill-discovery.sh
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import {
  capPerSpecialization,
  DEFAULT_CACHE_TTL,
  deduplicateAgents,
  deduplicateSkills,
  detectRunDomain,
  extractSpecializationFromProcessPath,
  generateSummary,
  readCache,
  resolveDiscoveryProcessRoot,
  scanAgentsDirectory,
  scanProcessesDirectory,
  scanSkillsDirectory,
  sortAgentsByDomain,
  sortSkillsByDomain,
  writeCache,
} from './skill/discoveryLocal';
import {
  fetchRemoteSkillSources,
  fetchRemoteSkillsBySource,
} from './skill/remoteDiscovery';
import { getActiveProcessLibraryPath } from '../../processLibrary/active';
import { resolveRunsDir } from '../../config';
import type {
  AgentMetadata,
  DiscoverSkillsResult,
  DiscoveryCacheEntry,
  ProcessMetadata,
  SkillCommandArgs,
  SkillMetadata,
} from './skill/types';

export type {
  AgentMetadata,
  DiscoverSkillsResult,
  ProcessDiscoveryResult,
  ProcessMarker,
  ProcessMarkersResult,
  ProcessMetadata,
  SkillCommandArgs,
  SkillMetadata,
} from './skill/types';
export {
  discoverFromProcessFile,
  parseProcessFileMarkers,
} from './skill/processMarkers';

export async function discoverSkillsInternal(options: {
  pluginRoot?: string;
  libraryPath?: string;
  runId?: string;
  cacheTtl?: number;
  runsDir?: string;
  includeRemote?: boolean;
  processPath?: string;
  includeProcesses?: boolean;
}): Promise<DiscoverSkillsResult> {
  const {
    pluginRoot: explicitPluginRoot,
    libraryPath,
    runId = '',
    cacheTtl = DEFAULT_CACHE_TTL,
    runsDir = resolveRunsDir(),
    includeRemote = false,
    processPath,
    includeProcesses = false,
  } = options;

  // Resolve pluginRoot from explicit arg or environment variables
  const pluginRoot = explicitPluginRoot
    || process.env.CLAUDE_PLUGIN_ROOT
    || process.env.CODEX_PLUGIN_ROOT
    || process.env.CURSOR_PLUGIN_ROOT
    || process.env.GEMINI_EXTENSION_PATH
    || process.env.COPILOT_PLUGIN_ROOT
    || process.env.PI_PLUGIN_ROOT
    || process.env.OMP_PLUGIN_ROOT
    || '';

  if (!processPath) {
    const cached = await readCache(runId, cacheTtl);
    if (cached) {
      return {
        skills: cached.skills,
        agents: cached.agents,
        summary: cached.summary,
        cached: true,
      };
    }
  }

  let domain = '';
  if (processPath) {
    domain = extractSpecializationFromProcessPath(processPath) ?? '';
  }
  if (!domain) {
    domain = await detectRunDomain(runId, runsDir);
  }

  const processRoot = await resolveDiscoveryProcessRoot({
    pluginRoot,
    libraryPath,
    runId,
  });
  const specializationsDir = path.join(processRoot, 'specializations');

  const allSkills: SkillMetadata[] = [];
  allSkills.push(...await scanSkillsDirectory(specializationsDir, 'local'));

  const pluginSkills = await scanSkillsDirectory(
    path.join(pluginRoot, 'skills'),
    'local-plugin',
  );
  allSkills.push(
    ...pluginSkills.filter((skill) =>
      !(skill.file?.replace(/\\/g, '/').includes('/specializations/'))
    ),
  );

  const repoSkillsDir = '.a5c/skills';
  try {
    await fs.access(repoSkillsDir);
    allSkills.push(...await scanSkillsDirectory(repoSkillsDir, 'local'));
  } catch {
    // Repo skills dir doesn't exist, skip
  }

  if (includeRemote) {
    allSkills.push(...await fetchRemoteSkillSources(pluginRoot));
  }

  const allAgents: AgentMetadata[] = [];
  allAgents.push(...await scanAgentsDirectory(specializationsDir, 'local'));

  const repoAgentsDir = '.a5c/agents';
  try {
    await fs.access(repoAgentsDir);
    allAgents.push(...await scanAgentsDirectory(repoAgentsDir, 'local'));
  } catch {
    // Repo agents dir doesn't exist, skip
  }

  let processes: ProcessMetadata[] | undefined;
  if (includeProcesses) {
    const allProcesses: ProcessMetadata[] = [];

    try {
      const specDirs = await fs.readdir(specializationsDir, { withFileTypes: true });
      for (const entry of specDirs) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          allProcesses.push(
            ...await scanProcessesDirectory(
              path.join(specializationsDir, entry.name),
              entry.name,
              'library',
            ),
          );
        }
      }
    } catch {
      // Specializations dir may not exist
    }

    const methodologiesDir = path.join(processRoot, 'methodologies');
    try {
      allProcesses.push(
        ...await scanProcessesDirectory(methodologiesDir, 'methodologies', 'library'),
      );
      const methodDirs = await fs.readdir(methodologiesDir, { withFileTypes: true });
      for (const entry of methodDirs) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          allProcesses.push(
            ...await scanProcessesDirectory(
              path.join(methodologiesDir, entry.name),
              entry.name,
              'library',
            ),
          );
        }
      }
    } catch {
      // Methodologies dir may not exist
    }

    const repoProcessesDir = '.a5c/processes';
    try {
      await fs.access(repoProcessesDir);
      allProcesses.push(...await scanProcessesDirectory(repoProcessesDir, 'project', 'repo'));
    } catch {
      // Repo processes dir doesn't exist
    }

    processes = allProcesses;
  }

  let skills = deduplicateSkills(allSkills);
  let agents = deduplicateAgents(allAgents);

  const isSpecFile = (filePath?: string) =>
    Boolean(filePath?.replace(/\\/g, '/').includes('/specializations/'));

  if (processPath && domain) {
    const lowerDomain = domain.toLowerCase();
    const matchesSpec = (filePath?: string) => {
      if (!filePath) return false;
      const normalized = filePath.replace(/\\/g, '/').toLowerCase();
      return normalized.includes(`/specializations/${lowerDomain}/`);
    };

    skills = skills.filter((skill) => matchesSpec(skill.file));
    agents = agents.filter((agent) => matchesSpec(agent.file));

    if (processes) {
      processes = processes.filter((processItem) =>
        processItem.category.toLowerCase() === lowerDomain
      );
    }
  } else if (processPath && !domain) {
    skills = skills.filter((skill) => !isSpecFile(skill.file));
    agents = agents.filter((agent) => !isSpecFile(agent.file));
  } else {
    skills = sortSkillsByDomain(skills, domain);
    agents = sortAgentsByDomain(agents, domain);
    const perSpecializationCap = 5;
    skills = capPerSpecialization(skills, perSpecializationCap);
    agents = capPerSpecialization(agents, perSpecializationCap);
  }

  skills = skills.slice(0, 30);
  agents = agents.slice(0, 30);

  const summary = generateSummary(skills, agents);

  if (!processPath) {
    const cacheEntry: DiscoveryCacheEntry = {
      skills,
      agents,
      summary,
      timestamp: Date.now(),
    };
    await writeCache(runId, cacheEntry);
  }

  return { skills, agents, processes, summary, cached: false };
}

export async function handleSkillDiscover(args: SkillCommandArgs): Promise<number> {
  const {
    pluginRoot,
    runId,
    cacheTtl,
    runsDir,
    json,
    includeRemote,
    summaryOnly,
    processPath,
  } = args;

  const libraryPath = await getActiveProcessLibraryPath();
  const result = await discoverSkillsInternal({
    pluginRoot: pluginRoot || undefined,
    libraryPath: libraryPath || undefined,
    runId,
    cacheTtl,
    runsDir,
    includeRemote,
    processPath,
    includeProcesses: true,
  });

  if (summaryOnly) {
    console.log(result.summary || '');
    return 0;
  }

  if (json) {
    console.log(JSON.stringify({
      skills: result.skills,
      agents: result.agents,
      processes: result.processes,
      summary: result.summary,
      cached: result.cached,
    }, null, 2));
  } else if (result.skills.length === 0 && result.agents.length === 0) {
    console.log('(no skills or agents found)');
  } else {
    if (result.skills.length > 0) {
      console.log(`Skills (${result.skills.length}):`);
      for (const skill of result.skills) {
        console.log(`  - ${skill.name}: ${skill.description || '(no description)'}${skill.file ? ` [${skill.file}]` : ''}`);
      }
    }
    if (result.agents.length > 0) {
      console.log(`Agents (${result.agents.length}):`);
      for (const agent of result.agents) {
        console.log(`  - ${agent.name}: ${agent.description || '(no description)'}${agent.file ? ` [${agent.file}]` : ''}`);
      }
    }
    if (result.processes && result.processes.length > 0) {
      console.log(`Processes (${result.processes.length}):`);
      for (const processItem of result.processes) {
        console.log(`  - ${processItem.name} [${processItem.category}]: ${processItem.file}`);
      }
    }
  }

  return 0;
}

export async function handleSkillFetchRemote(args: SkillCommandArgs): Promise<number> {
  const { sourceType, url, json } = args;

  if (!sourceType) {
    const error = { error: 'MISSING_SOURCE_TYPE', message: '--source-type is required (github or well-known)' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('Error: --source-type is required (github or well-known)');
    }
    return 1;
  }

  if (sourceType !== 'github' && sourceType !== 'well-known') {
    const error = {
      error: 'INVALID_SOURCE_TYPE',
      message: '--source-type must be github or well-known',
    };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('Error: --source-type must be github or well-known');
    }
    return 1;
  }

  if (!url) {
    const error = { error: 'MISSING_URL', message: '--url is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('Error: --url is required');
    }
    return 1;
  }

  const skills = await fetchRemoteSkillsBySource(sourceType, url);

  if (json) {
    console.log(JSON.stringify({ skills }, null, 2));
  } else if (skills.length === 0) {
    console.log('[]');
  } else {
    for (const skill of skills) {
      console.log(`- ${skill.name}: ${skill.description || '(no description)'}`);
    }
  }

  return 0;
}

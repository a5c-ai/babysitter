import { promises as fs } from 'node:fs';
import { parseSkillFrontmatter } from './discoveryLocal';
import type { SkillMetadata } from './types';

function githubWebToApi(url: string): { apiUrl: string; rawBase: string } | null {
  const treeMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/);
  if (treeMatch) {
    const [, owner, repo, branch, treePath] = treeMatch;
    return {
      apiUrl: `https://api.github.com/repos/${owner}/${repo}/contents/${treePath}?ref=${branch}`,
      rawBase: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${treePath}`,
    };
  }

  const repoMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if (repoMatch) {
    const [, owner, repo] = repoMatch;
    return {
      apiUrl: `https://api.github.com/repos/${owner}/${repo}/contents/skills?ref=main`,
      rawBase: `https://raw.githubusercontent.com/${owner}/${repo}/main/skills`,
    };
  }

  return null;
}

async function fetchWithTimeout(url: string, timeout: number = 10000): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'babysitter-sdk' },
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

async function discoverGitHub(url: string): Promise<SkillMetadata[]> {
  const parsed = githubWebToApi(url);
  if (!parsed) return [];

  const { apiUrl, rawBase } = parsed;
  const skills: SkillMetadata[] = [];
  const listingText = await fetchWithTimeout(apiUrl);
  if (!listingText) return [];

  let listing;
  try {
    listing = JSON.parse(listingText) as Array<{ name: string; type: string; download_url?: string }>;
  } catch {
    return [];
  }

  const dirs = listing.filter((entry) => entry.type === 'dir').map((entry) => entry.name);
  const skillFile = listing.find((entry) => entry.name === 'SKILL.md');
  if (skillFile?.download_url) {
    const content = await fetchWithTimeout(skillFile.download_url);
    if (content) {
      const parsedSkill = parseSkillFrontmatter(content);
      if (parsedSkill) {
        skills.push({
          ...parsedSkill,
          source: 'remote',
          url,
        });
      }
    }
    return skills;
  }

  let count = 0;
  for (const dir of dirs) {
    if (count >= 20) break;
    count += 1;

    const content = await fetchWithTimeout(`${rawBase}/${dir}/SKILL.md`);
    if (content) {
      const parsedSkill = parseSkillFrontmatter(content);
      if (parsedSkill) {
        skills.push({
          ...parsedSkill,
          source: 'remote',
          url: `${rawBase}/${dir}/SKILL.md`,
        });
      }
    }
  }

  return skills;
}

async function discoverWellKnown(url: string): Promise<SkillMetadata[]> {
  const baseUrl = url.replace(/\/$/, '');
  const skills: SkillMetadata[] = [];

  let indexUrl = `${baseUrl}/.well-known/skills/index.json`;
  let content = await fetchWithTimeout(indexUrl);
  if (!content) {
    const hostMatch = baseUrl.match(/^https?:\/\/([^/]+)/);
    if (hostMatch) {
      indexUrl = `https://${hostMatch[1]}/.well-known/skills/index.json`;
      content = await fetchWithTimeout(indexUrl);
    }
  }
  if (!content) return [];

  try {
    const index = JSON.parse(content) as { skills?: Array<{ name: string; description?: string }> };
    if (index.skills) {
      for (const skill of index.skills) {
        skills.push({
          name: skill.name,
          description: skill.description || '',
          category: '',
          source: 'remote',
          url: baseUrl,
        });
      }
    }
  } catch {
    // Invalid JSON
  }

  return skills;
}

export async function fetchRemoteSkillSources(_pluginRoot: string): Promise<SkillMetadata[]> {
  const remoteSkills: SkillMetadata[] = [];
  const sources: Array<{ type: 'github' | 'well-known'; url: string }> = [
    { type: 'github', url: 'https://github.com/a5c-ai/babysitter/tree/main/plugins/babysitter-unified/skills' },
  ];

  try {
    const content = await fs.readFile('.a5c/skill-sources.json', 'utf8');
    const parsed = JSON.parse(content) as { sources?: Array<{ type: string; url: string }> };
    if (parsed.sources && Array.isArray(parsed.sources)) {
      for (const source of parsed.sources) {
        if ((source.type === 'github' || source.type === 'well-known') && typeof source.url === 'string') {
          sources.push({ type: source.type, url: source.url });
        }
      }
    }
  } catch {
    // No external sources file, that's fine
  }

  for (const source of sources) {
    try {
      const skills = source.type === 'github'
        ? await discoverGitHub(source.url)
        : await discoverWellKnown(source.url);
      remoteSkills.push(...skills);
    } catch {
      // Skip failed remote sources
    }
  }

  return remoteSkills;
}

export async function fetchRemoteSkillsBySource(
  sourceType: 'github' | 'well-known',
  url: string,
): Promise<SkillMetadata[]> {
  return sourceType === 'github'
    ? discoverGitHub(url)
    : discoverWellKnown(url);
}

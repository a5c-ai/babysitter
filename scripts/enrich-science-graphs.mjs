#!/usr/bin/env node
/**
 * Enrich @graph blocks in library/specializations/domains/science/
 * Replace shallow/invalid edges with rich valid ones.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

function buildGraphBlock(profile, indent = ' *   ') {
  const lines = [];
  if (profile.domains?.length) lines.push(`${indent}domains: [${profile.domains.join(', ')}]`);
  if (profile.specializations?.length) lines.push(`${indent}specializations: [${profile.specializations.join(', ')}]`);
  if (profile.skillAreas?.length) lines.push(`${indent}skillAreas: [${profile.skillAreas.join(', ')}]`);
  if (profile.workflows?.length) lines.push(`${indent}workflows: [${profile.workflows.join(', ')}]`);
  if (profile.roles?.length) lines.push(`${indent}roles: [${profile.roles.join(', ')}]`);
  return lines.join('\n');
}

function enrichGraphInJs(content, profile) {
  const graphPattern = /(\* @graph\r?\n)((?:\s+\*\s+\w+:.*\r?\n)*)/;
  const newGraphBlock = ' * @graph\n' + buildGraphBlock(profile) + '\n';
  if (graphPattern.test(content)) {
    return content.replace(graphPattern, newGraphBlock);
  }
  return content;
}

function enrichGraphInYaml(content, profile) {
  const graphPattern = /^graph:\r?\n((?:\s+\S.*\r?\n)*)/m;
  const newGraphBlock = 'graph:\n' + buildGraphBlock(profile, '  ') + '\n';
  if (graphPattern.test(content)) {
    return content.replace(graphPattern, newGraphBlock);
  }
  return content;
}

// Per-subdirectory enrichment profiles for science domains
const PROFILES = {
  'computer-science': {
    domains: ['domain:computer-science'],
    specializations: ['specialization:theoretical-computer-science'],
    skillAreas: ['skill-area:language-design', 'skill-area:compiler-implementation', 'skill-area:graph-algorithms'],
    workflows: ['workflow:research-grant-lifecycle'],
    roles: ['role:research-engineer', 'role:computational-scientist'],
  },
  'mathematics': {
    domains: ['domain:mathematics'],
    specializations: ['specialization:computational-mathematics'],
    skillAreas: ['skill-area:statistical-analysis', 'skill-area:mathematical-reasoning', 'skill-area:data-analysis'],
    workflows: ['workflow:experiment-design'],
    roles: ['role:research-engineer', 'role:computational-scientist'],
  },
  'physics': {
    domains: ['domain:physics'],
    skillAreas: ['skill-area:statistical-analysis', 'skill-area:mathematical-reasoning', 'skill-area:data-analysis'],
    workflows: ['workflow:experiment-design', 'workflow:peer-review-cycle'],
    roles: ['role:research-engineer', 'role:computational-scientist'],
  },
  'quantum-computing': {
    domains: ['domain:quantum-computing'],
    specializations: ['specialization:quantum-computing'],
    skillAreas: ['skill-area:mathematical-reasoning', 'skill-area:compiler-implementation', 'skill-area:language-design'],
    workflows: ['workflow:experiment-design'],
    roles: ['role:research-engineer'],
  },
  'bioinformatics': {
    domains: ['domain:bioinformatics'],
    specializations: ['specialization:biomedical-informatics'],
    skillAreas: ['skill-area:data-analysis', 'skill-area:statistical-analysis', 'skill-area:python-data-pipelines'],
    workflows: ['workflow:experiment-design'],
    roles: ['role:research-engineer', 'role:biomedical-engineer'],
  },
  'biomedical-engineering': {
    domains: ['domain:biomedical-engineering'],
    skillAreas: ['skill-area:data-analysis', 'skill-area:sensor-fusion', 'skill-area:statistical-analysis'],
    workflows: ['workflow:experiment-design', 'workflow:peer-review-cycle'],
    roles: ['role:biomedical-engineer', 'role:research-engineer'],
  },
  'aerospace-engineering': {
    domains: ['domain:aerospace-engineering'],
    specializations: ['specialization:aerospace-engineering'],
    skillAreas: ['skill-area:mathematical-reasoning', 'skill-area:physics-simulation', 'skill-area:sensor-fusion'],
    roles: ['role:systems-integration-engineer', 'role:research-engineer'],
  },
  'chemical-engineering': {
    domains: ['domain:chemical-engineering'],
    skillAreas: ['skill-area:mathematical-reasoning', 'skill-area:statistical-analysis', 'skill-area:data-analysis'],
    workflows: ['workflow:experiment-design'],
    roles: ['role:research-engineer'],
  },
  'civil-engineering': {
    domains: ['domain:civil-engineering'],
    skillAreas: ['skill-area:mathematical-reasoning', 'skill-area:computational-geometry', 'skill-area:data-analysis'],
    roles: ['role:systems-integration-engineer', 'role:research-engineer'],
  },
  'electrical-engineering': {
    domains: ['domain:electrical-engineering'],
    skillAreas: ['skill-area:hardware-abstraction-layer', 'skill-area:device-drivers', 'skill-area:firmware-development'],
    roles: ['role:embedded-engineer', 'role:systems-integration-engineer'],
  },
  'mechanical-engineering': {
    domains: ['domain:mechanical-engineering'],
    skillAreas: ['skill-area:physics-simulation', 'skill-area:mathematical-reasoning', 'skill-area:motion-planning'],
    roles: ['role:systems-integration-engineer', 'role:research-engineer'],
  },
  'environmental-engineering': {
    domains: ['domain:environmental-engineering'],
    skillAreas: ['skill-area:data-analysis', 'skill-area:statistical-analysis', 'skill-area:geospatial-data-analysis'],
    workflows: ['workflow:experiment-design'],
    roles: ['role:research-engineer'],
  },
  'industrial-engineering': {
    domains: ['domain:industrial-engineering'],
    skillAreas: ['skill-area:statistical-analysis', 'skill-area:organizational-design', 'skill-area:data-analysis'],
    roles: ['role:operations-analyst', 'role:research-engineer'],
  },
  'materials-science': {
    domains: ['domain:materials-science'],
    skillAreas: ['skill-area:data-analysis', 'skill-area:statistical-analysis', 'skill-area:mathematical-reasoning'],
    workflows: ['workflow:experiment-design'],
    roles: ['role:research-engineer'],
  },
  'nanotechnology': {
    domains: ['domain:nanotechnology'],
    skillAreas: ['skill-area:mathematical-reasoning', 'skill-area:physics-simulation', 'skill-area:data-analysis'],
    workflows: ['workflow:experiment-design'],
    roles: ['role:research-engineer'],
  },
  'automotive-engineering': {
    domains: ['domain:automotive-engineering'],
    skillAreas: ['skill-area:sensor-fusion', 'skill-area:motion-planning', 'skill-area:physics-simulation'],
    roles: ['role:systems-integration-engineer', 'role:embedded-engineer'],
  },
  'scientific-discovery': {
    domains: ['domain:scientific-discovery'],
    specializations: ['specialization:scientific-research-methods'],
    skillAreas: ['skill-area:data-analysis', 'skill-area:statistical-analysis', 'skill-area:deep-web-research'],
    workflows: ['workflow:experiment-design', 'workflow:peer-review-cycle'],
    roles: ['role:research-engineer', 'role:computational-scientist'],
  },
};

function processDirectory(dir, profile) {
  let count = 0;
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      count += processDirectory(fullPath, profile);
    } else if (stat.isFile()) {
      const ext = extname(entry);
      if (ext === '.js' || entry === 'SKILL.md' || entry === 'AGENT.md') {
        const content = readFileSync(fullPath, 'utf8');
        let newContent;

        if (entry === 'SKILL.md' || entry === 'AGENT.md') {
          newContent = enrichGraphInYaml(content, profile);
        } else {
          newContent = enrichGraphInJs(content, profile);
        }

        if (newContent !== content) {
          writeFileSync(fullPath, newContent, 'utf8');
          count++;
        }
      }
    }
  }

  return count;
}

// Fix double-space issue after replacement
function fixDoubleSpace(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      fixDoubleSpace(fullPath);
    } else if (entry.endsWith('.js') || entry === 'SKILL.md' || entry === 'AGENT.md') {
      const content = readFileSync(fullPath, 'utf8');
      const fixed = content.replace(/^  \* @graph$/mg, ' * @graph');
      if (fixed !== content) {
        writeFileSync(fullPath, fixed, 'utf8');
      }
    }
  }
}

const baseDir = 'C:/Users/tmusk/IdeaProjects/babysitter/library/specializations/domains/science';
let totalModified = 0;
const results = {};

for (const [subdir, profile] of Object.entries(PROFILES)) {
  const fullDir = join(baseDir, subdir);
  try {
    const count = processDirectory(fullDir, profile);
    results[subdir] = count;
    totalModified += count;
    console.log(`${subdir}: ${count} files modified`);
  } catch (e) {
    console.error(`Error processing ${subdir}: ${e.message}`);
    results[subdir] = 0;
  }
}

// Fix indentation
fixDoubleSpace(baseDir);

console.log(`\nTotal modified: ${totalModified}`);
console.log(JSON.stringify(results, null, 2));

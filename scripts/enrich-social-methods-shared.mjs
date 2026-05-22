#!/usr/bin/env node
/**
 * Enrich @graph blocks in social-sciences-humanities + methodologies + cradle + processes/shared
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

function buildGraphBlock(profile, indent = ' *   ') {
  const lines = [];
  if (profile.domains?.length) lines.push(`${indent}domains: [${profile.domains.join(', ')}]`);
  if (profile.specializations?.length) lines.push(`${indent}specializations: [${profile.specializations.join(', ')}]`);
  if (profile.skillAreas?.length) lines.push(`${indent}skillAreas: [${profile.skillAreas.join(', ')}]`);
  if (profile.workflows?.length) lines.push(`${indent}workflows: [${profile.workflows.join(', ')}]`);
  if (profile.topics?.length) lines.push(`${indent}topics: [${profile.topics.join(', ')}]`);
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

function fixDoubleSpace(content) {
  return content.replace(/^  \* @graph$/mg, ' * @graph');
}

// Social sciences/humanities profiles
const SOCIAL_PROFILES = {
  'arts-culture': {
    domains: ['domain:arts-culture'],
    skillAreas: ['skill-area:visual-design', 'skill-area:motion-design', 'skill-area:data-analysis'],
    roles: ['role:creative-director', 'role:design-lead'],
  },
  'education': {
    domains: ['domain:education'],
    specializations: ['specialization:instructional-design'],
    skillAreas: ['skill-area:tutorial-design', 'skill-area:docs-as-code', 'skill-area:learning-development'],
    workflows: ['workflow:peer-review-cycle'],
    roles: ['role:technical-writer'],
  },
  'healthcare': {
    domains: ['domain:healthcare'],
    specializations: ['specialization:clinical-informatics'],
    skillAreas: ['skill-area:data-analysis', 'skill-area:statistical-analysis', 'skill-area:data-governance'],
    workflows: ['workflow:experiment-design'],
    roles: ['role:research-engineer'],
  },
  'humanities': {
    domains: ['domain:humanities'],
    specializations: ['specialization:digital-humanities'],
    skillAreas: ['skill-area:data-analysis', 'skill-area:deep-web-research', 'skill-area:docs-as-code'],
    workflows: ['workflow:peer-review-cycle'],
    roles: ['role:research-engineer'],
  },
  'philosophy': {
    domains: ['domain:philosophy'],
    specializations: ['specialization:applied-ethics'],
    skillAreas: ['skill-area:deep-web-research', 'skill-area:docs-as-code', 'skill-area:data-analysis'],
    workflows: ['workflow:peer-review-cycle'],
    roles: ['role:research-engineer'],
  },
  'social-sciences': {
    domains: ['domain:social-sciences'],
    skillAreas: ['skill-area:data-analysis', 'skill-area:statistical-analysis', 'skill-area:user-research'],
    workflows: ['workflow:experiment-design', 'workflow:peer-review-cycle'],
    roles: ['role:research-engineer', 'role:data-analyst'],
  },
};

// Methodology profile by name/description pattern
function getMethodologyProfile(filename, description = '') {
  const desc = (description + ' ' + filename).toLowerCase();

  // TDD/testing related
  if (desc.includes('tdd') || desc.includes('test-driven') || desc.includes('atdd') || desc.includes('bdd') || desc.includes('red-green') || desc.includes('specification by example')) {
    return {
      domains: ['domain:software-engineering'],
      skillAreas: ['skill-area:unit-testing', 'skill-area:integration-testing', 'skill-area:acceptance-testing'],
      topics: ['topic:test-driven-development'],
      workflows: ['workflow:feature-development'],
      roles: ['role:backend-engineer', 'role:qa-engineer', 'role:tech-lead'],
    };
  }

  // Agile/Scrum/Kanban/Sprint
  if (desc.includes('agile') || desc.includes('scrum') || desc.includes('kanban') || desc.includes('sprint') || desc.includes('rup') || desc.includes('xp') || desc.includes('extreme programming') || desc.includes('feature-driven')) {
    return {
      domains: ['domain:software-engineering'],
      skillAreas: ['skill-area:stakeholder-management', 'skill-area:roadmap-planning', 'skill-area:prioritization-frameworks'],
      topics: ['topic:developer-experience'],
      workflows: ['workflow:feature-development', 'workflow:release-management'],
      roles: ['role:engineering-manager', 'role:tech-lead', 'role:scrum-master'],
    };
  }

  // Architecture/design patterns
  if (desc.includes('domain-driven') || desc.includes('ddd') || desc.includes('hexagonal') || desc.includes('clean arch') || desc.includes('ontology') || desc.includes('architecture') || desc.includes('c4-') || desc.includes('event-storming')) {
    return {
      domains: ['domain:software-engineering'],
      specializations: ['specialization:software-architecture'],
      skillAreas: ['skill-area:domain-driven-design', 'skill-area:c4-modeling', 'skill-area:adr-writing'],
      topics: ['topic:domain-driven-design', 'topic:clean-architecture'],
      workflows: ['workflow:architecture-decision-record'],
      roles: ['role:architect', 'role:tech-lead'],
    };
  }

  // CI/CD, DevOps, deployment
  if (desc.includes('devops') || desc.includes('ci/cd') || desc.includes('deployment') || desc.includes('pipeline') || desc.includes('gitops') || desc.includes('release') || desc.includes('canary')) {
    return {
      domains: ['domain:devops'],
      specializations: ['specialization:devops-sre-platform'],
      skillAreas: ['skill-area:gitops', 'skill-area:containerization', 'skill-area:configuration-management'],
      topics: ['topic:continuous-integration', 'topic:continuous-deployment'],
      workflows: ['workflow:release-management'],
      roles: ['role:devops-engineer', 'role:platform-engineer'],
    };
  }

  // Research/analysis
  if (desc.includes('research') || desc.includes('investigation') || desc.includes('analysis') || desc.includes('deep-research') || desc.includes('hypothesis')) {
    return {
      domains: ['domain:software-engineering'],
      specializations: ['specialization:research'],
      skillAreas: ['skill-area:deep-web-research', 'skill-area:data-analysis', 'skill-area:statistical-analysis'],
      topics: ['topic:developer-experience'],
      workflows: ['workflow:experiment-design'],
      roles: ['role:research-engineer', 'role:tech-lead'],
    };
  }

  // Planning/spec/requirements
  if (desc.includes('planning') || desc.includes('spec') || desc.includes('requirements') || desc.includes('shape up') || desc.includes('impact mapping') || desc.includes('jobs-to-be-done') || desc.includes('double-diamond')) {
    return {
      domains: ['domain:software-engineering'],
      skillAreas: ['skill-area:prioritization-frameworks', 'skill-area:product-discovery', 'skill-area:roadmap-planning'],
      topics: ['topic:developer-experience'],
      workflows: ['workflow:product-discovery', 'workflow:feature-development'],
      roles: ['role:tech-lead', 'role:engineering-manager', 'role:product-manager'],
    };
  }

  // AI/agents/agentic
  if (desc.includes('ai') || desc.includes('agent') || desc.includes('agentic') || desc.includes('llm') || desc.includes('automaker') || desc.includes('metaswarm') || desc.includes('maestro') || desc.includes('claude')) {
    return {
      domains: ['domain:software-engineering'],
      specializations: ['specialization:ai-agents-conversational'],
      skillAreas: ['skill-area:agentic-loops', 'skill-area:prompt-engineering', 'skill-area:multi-agent-coordination'],
      topics: ['topic:developer-experience'],
      workflows: ['workflow:feature-development'],
      roles: ['role:backend-engineer', 'role:platform-engineer', 'role:tech-lead'],
    };
  }

  // Quality/quality gates
  if (desc.includes('quality') || desc.includes('cleanroom') || desc.includes('v-model') || desc.includes('waterfall') || desc.includes('spiral')) {
    return {
      domains: ['domain:software-engineering'],
      specializations: ['specialization:qa-testing-automation'],
      skillAreas: ['skill-area:acceptance-testing', 'skill-area:integration-testing', 'skill-area:e2e-testing'],
      topics: ['topic:test-driven-development'],
      workflows: ['workflow:feature-development', 'workflow:release-management'],
      roles: ['role:qa-engineer', 'role:tech-lead'],
    };
  }

  // Documentation/knowledge
  if (desc.includes('documentation') || desc.includes('knowledge') || desc.includes('wiki') || desc.includes('second-brain') || desc.includes('second brain')) {
    return {
      domains: ['domain:software-engineering'],
      skillAreas: ['skill-area:docs-as-code', 'skill-area:reference-docs', 'skill-area:api-doc-generation'],
      topics: ['topic:developer-experience'],
      roles: ['role:technical-writer', 'role:tech-lead'],
    };
  }

  // Code review/collaboration
  if (desc.includes('code review') || desc.includes('pr') || desc.includes('pull request') || desc.includes('review')) {
    return {
      domains: ['domain:software-engineering'],
      specializations: ['specialization:collaboration'],
      skillAreas: ['skill-area:code-review-practice', 'skill-area:code-analysis-linting'],
      topics: ['topic:code-review-best-practices'],
      workflows: ['workflow:code-review', 'workflow:pull-request-lifecycle'],
      roles: ['role:tech-lead', 'role:engineering-manager'],
    };
  }

  // Default catch-all for software engineering methodology
  return {
    domains: ['domain:software-engineering'],
    skillAreas: ['skill-area:agentic-loops', 'skill-area:orchestration-loop'],
    topics: ['topic:developer-experience'],
    workflows: ['workflow:feature-development'],
    roles: ['role:tech-lead', 'role:backend-engineer'],
  };
}

// Cradle profiles
const CRADLE_PROFILE = {
  domains: ['domain:software-engineering'],
  skillAreas: ['skill-area:bug-fixing-from-issues', 'skill-area:code-review-practice'],
  workflows: ['workflow:bug-triage', 'workflow:feature-development'],
  roles: ['role:backend-engineer', 'role:devops-engineer'],
};

// Shared processes profiles
const SHARED_PROFILE = {
  domains: ['domain:software-engineering'],
  skillAreas: ['skill-area:code-review-practice', 'skill-area:e2e-testing'],
  topics: ['topic:test-driven-development', 'topic:code-review-best-practices'],
  workflows: ['workflow:code-review', 'workflow:feature-development', 'workflow:release-management'],
  roles: ['role:backend-engineer', 'role:tech-lead', 'role:qa-engineer'],
};

function processFile(fullPath, entry, profile) {
  const content = readFileSync(fullPath, 'utf8');
  let newContent;

  if (entry === 'SKILL.md' || entry === 'AGENT.md') {
    newContent = enrichGraphInYaml(content, profile);
  } else {
    newContent = enrichGraphInJs(content, profile);
    newContent = fixDoubleSpace(newContent);
  }

  if (newContent !== content) {
    writeFileSync(fullPath, newContent, 'utf8');
    return true;
  }
  return false;
}

function processDirectoryWithProfile(dir, profile) {
  let count = 0;
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      count += processDirectoryWithProfile(fullPath, profile);
    } else if (stat.isFile()) {
      const ext = extname(entry);
      if (ext === '.js' || entry === 'SKILL.md' || entry === 'AGENT.md') {
        if (processFile(fullPath, entry, profile)) count++;
      }
    }
  }
  return count;
}

function processMethodologiesDirectory(dir) {
  let count = 0;
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && entry !== 'node_modules') {
      count += processMethodologiesDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = extname(entry);
      if (ext === '.js' || entry === 'SKILL.md' || entry === 'AGENT.md') {
        const content = readFileSync(fullPath, 'utf8');
        // Extract description for profile selection
        const descMatch = content.match(/@description\s+([^\n]+)/);
        const description = descMatch ? descMatch[1] : '';
        const profile = getMethodologyProfile(entry, description);

        let newContent;
        if (entry === 'SKILL.md' || entry === 'AGENT.md') {
          newContent = enrichGraphInYaml(content, profile);
        } else {
          newContent = enrichGraphInJs(content, profile);
          newContent = fixDoubleSpace(newContent);
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

const baseDir = 'C:/Users/tmusk/IdeaProjects/babysitter';
const results = {};
let total = 0;

// Process social sciences/humanities
const socialBase = join(baseDir, 'library/specializations/domains/social-sciences-humanities');
for (const [subdir, profile] of Object.entries(SOCIAL_PROFILES)) {
  const fullDir = join(socialBase, subdir);
  try {
    const count = processDirectoryWithProfile(fullDir, profile);
    results[`social/${subdir}`] = count;
    total += count;
    console.log(`social/${subdir}: ${count} files modified`);
  } catch (e) {
    console.error(`Error processing social/${subdir}: ${e.message}`);
  }
}

// Process methodologies
const methodDir = join(baseDir, 'library/methodologies');
const methodCount = processMethodologiesDirectory(methodDir);
results['methodologies'] = methodCount;
total += methodCount;
console.log(`methodologies: ${methodCount} files modified`);

// Process cradle
const cradleDir = join(baseDir, 'library/cradle');
try {
  const count = processDirectoryWithProfile(cradleDir, CRADLE_PROFILE);
  results['cradle'] = count;
  total += count;
  console.log(`cradle: ${count} files modified`);
} catch (e) {
  console.error(`Error processing cradle: ${e.message}`);
}

// Process processes/shared
const sharedDir = join(baseDir, 'library/processes/shared');
try {
  const count = processDirectoryWithProfile(sharedDir, SHARED_PROFILE);
  results['processes/shared'] = count;
  total += count;
  console.log(`processes/shared: ${count} files modified`);
} catch (e) {
  console.error(`Error processing processes/shared: ${e.message}`);
}

console.log(`\nTotal modified: ${total}`);
console.log(JSON.stringify(results, null, 2));

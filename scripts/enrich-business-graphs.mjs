#!/usr/bin/env node
/**
 * Enrich @graph blocks in library/specializations/domains/business/
 * Replace shallow/invalid edges with rich valid ones.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// Mapping of invalid -> valid IDs for skill areas
const SKILL_AREA_REPLACEMENTS = {
  'skill-area:financial-analysis': 'skill-area:financial-modeling',
  'skill-area:talent-management': 'skill-area:talent-acquisition-strategy',
  'skill-area:marketing-analytics': 'skill-area:digital-marketing-analytics',
  'skill-area:operations-management': 'skill-area:organizational-design',
  'skill-area:project-management': 'skill-area:stakeholder-management',
  'skill-area:supply-chain-management': 'skill-area:procurement-management',
  'skill-area:legal-analysis': 'skill-area:financial-regulation',
  'skill-area:communications-strategy': 'skill-area:content-marketing',
  'skill-area:technical-writing': 'skill-area:docs-as-code',
  // already valid ones, keep:
  'skill-area:business-analysis': 'skill-area:business-analysis',
  'skill-area:customer-success': 'skill-area:customer-success',
  'skill-area:data-analysis': 'skill-area:data-analysis',
  'skill-area:investment-analysis': 'skill-area:investment-analysis',
  'skill-area:sales-methodology': 'skill-area:sales-methodology',
  'skill-area:strategic-planning': 'skill-area:strategic-planning',
};

// Mapping of invalid -> valid role IDs
const ROLE_REPLACEMENTS = {
  'role:communications-manager': 'role:content-strategist',
  'role:digital-marketing-manager': 'role:marketing-strategist',
  'role:founder': 'role:strategic-planner',
  'role:knowledge-manager': 'role:information-architect',
  'role:logistics-manager': 'role:supply-chain-analyst',
  'role:operations-manager': 'role:operations-analyst',
  'role:sales-manager': 'role:account-executive',
  'role:strategy-consultant': 'role:strategic-planner',
  'role:supply-chain-manager': 'role:supply-chain-analyst',
  'role:venture-capitalist': 'role:financial-analyst',
  // already valid ones, keep:
  'role:business-analyst': 'role:business-analyst',
  'role:customer-success-manager': 'role:customer-success-manager',
  'role:data-analyst': 'role:data-analyst',
  'role:financial-analyst': 'role:financial-analyst',
  'role:hr-manager': 'role:hr-manager',
  'role:legal-counsel': 'role:legal-counsel',
  'role:marketing-manager': 'role:marketing-manager',
  'role:project-manager': 'role:project-manager',
  'role:marketing-strategist': 'role:marketing-strategist',
};

// Valid topics from atlas-ids-reference.txt that are relevant for business
const VALID_TOPICS = new Set([
  'topic:api-design', 'topic:architecture-decisions', 'topic:auto-scaling',
  'topic:blue-green-deployment', 'topic:chaos-engineering', 'topic:clean-architecture',
  'topic:continuous-deployment', 'topic:continuous-integration', 'topic:cqrs',
  'topic:data-mesh', 'topic:database-sharding', 'topic:dependency-injection',
  'topic:design-patterns', 'topic:developer-experience', 'topic:domain-driven-design',
  'topic:event-driven-architecture', 'topic:event-sourcing', 'topic:feature-flags',
  'topic:gitflow', 'topic:horizontal-scaling', 'topic:immutable-infrastructure',
  'topic:infrastructure-as-code', 'topic:jwt-handling', 'topic:layered-architecture',
  'topic:load-balancing', 'topic:microservices', 'topic:microservices-architecture',
  'topic:mvc', 'topic:oauth-flows', 'topic:observability-driven-development',
  'topic:pair-programming', 'topic:publish-subscribe', 'topic:rate-limiting',
  'topic:refactoring', 'topic:repository-pattern', 'topic:rest',
  'topic:serverless-architecture', 'topic:service-mesh', 'topic:service-oriented-architecture',
  'topic:strategy-pattern', 'topic:technical-debt', 'topic:test-driven-development',
  'topic:trunk-based-development', 'topic:twelve-factor-app', 'topic:zero-trust-architecture',
]);

// Per-subdirectory enrichment profiles
const PROFILES = {
  'business-analysis': {
    domains: ['domain:business-intelligence'],
    specializations: ['specialization:strategic-consulting'],
    skillAreas: ['skill-area:business-analysis', 'skill-area:strategic-analysis', 'skill-area:competitive-intelligence'],
    workflows: ['workflow:market-analysis'],
    roles: ['role:business-analyst', 'role:strategic-planner'],
  },
  'business-strategy': {
    domains: ['domain:strategy'],
    specializations: ['specialization:strategic-consulting'],
    skillAreas: ['skill-area:strategic-planning', 'skill-area:business-model-design', 'skill-area:growth-strategy'],
    workflows: ['workflow:strategic-planning', 'workflow:competitive-analysis'],
    roles: ['role:strategic-planner', 'role:business-analyst'],
  },
  'business-strategy-advanced': {
    domains: ['domain:strategy'],
    specializations: ['specialization:strategic-consulting'],
    skillAreas: ['skill-area:strategic-planning', 'skill-area:change-management-leadership', 'skill-area:market-sizing'],
    workflows: ['workflow:strategic-planning'],
    roles: ['role:strategic-planner', 'role:business-analyst'],
  },
  'finance-accounting': {
    domains: ['domain:finance'],
    specializations: ['specialization:corporate-finance'],
    skillAreas: ['skill-area:financial-modeling', 'skill-area:budgeting-forecasting', 'skill-area:investment-analysis', 'skill-area:valuation-analysis'],
    workflows: ['workflow:financial-planning', 'workflow:budget-planning'],
    roles: ['role:financial-analyst'],
  },
  'human-resources': {
    domains: ['domain:human-resources'],
    specializations: ['specialization:talent-management'],
    skillAreas: ['skill-area:talent-acquisition-strategy', 'skill-area:performance-management', 'skill-area:organizational-design', 'skill-area:learning-development'],
    workflows: ['workflow:talent-acquisition-pipeline'],
    roles: ['role:hr-manager', 'role:talent-recruiter'],
  },
  'marketing': {
    domains: ['domain:marketing'],
    skillAreas: ['skill-area:brand-strategy', 'skill-area:brand-positioning', 'skill-area:content-marketing'],
    workflows: ['workflow:brand-campaign-launch'],
    roles: ['role:marketing-manager', 'role:marketing-strategist', 'role:brand-manager'],
  },
  'digital-marketing': {
    domains: ['domain:digital-marketing'],
    specializations: ['specialization:digital-marketing-strategy'],
    skillAreas: ['skill-area:digital-marketing-analytics', 'skill-area:seo-sem', 'skill-area:analytics-tracking'],
    roles: ['role:marketing-strategist', 'role:marketing-manager'],
  },
  'sales': {
    domains: ['domain:sales'],
    skillAreas: ['skill-area:sales-methodology', 'skill-area:customer-success', 'skill-area:revenue-operations'],
    workflows: ['workflow:customer-journey-optimization'],
    roles: ['role:account-executive', 'role:sales-engineer', 'role:customer-success-manager'],
  },
  'venture-capital': {
    domains: ['domain:venture-capital'],
    skillAreas: ['skill-area:investment-analysis', 'skill-area:valuation-analysis', 'skill-area:financial-modeling'],
    roles: ['role:financial-analyst'],
  },
  'legal': {
    domains: ['domain:legal'],
    specializations: ['specialization:legal-compliance'],
    skillAreas: ['skill-area:financial-regulation', 'skill-area:compliance-automation'],
    workflows: ['workflow:contract-lifecycle', 'workflow:compliance-audit'],
    roles: ['role:legal-counsel', 'role:compliance-officer'],
  },
  'customer-experience': {
    domains: ['domain:customer-experience'],
    skillAreas: ['skill-area:customer-success', 'skill-area:user-research', 'skill-area:product-discovery'],
    workflows: ['workflow:customer-journey-optimization', 'workflow:user-feedback-loop'],
    roles: ['role:product-designer', 'role:customer-success-manager', 'role:ux-researcher'],
  },
  'decision-intelligence': {
    domains: ['domain:business-intelligence'],
    skillAreas: ['skill-area:data-analysis', 'skill-area:statistical-analysis', 'skill-area:business-analysis'],
    roles: ['role:data-analyst', 'role:business-analyst'],
  },
  'entrepreneurship': {
    domains: ['domain:entrepreneurship'],
    skillAreas: ['skill-area:business-model-design', 'skill-area:growth-strategy', 'skill-area:product-strategy'],
    workflows: ['workflow:product-discovery'],
    roles: ['role:strategic-planner', 'role:product-manager'],
  },
  'knowledge-management': {
    domains: ['domain:knowledge-management'],
    skillAreas: ['skill-area:docs-as-code', 'skill-area:reference-docs', 'skill-area:data-governance'],
    roles: ['role:information-architect', 'role:technical-writer'],
  },
  'logistics': {
    domains: ['domain:logistics'],
    skillAreas: ['skill-area:procurement-management', 'skill-area:organizational-design'],
    roles: ['role:supply-chain-analyst', 'role:operations-analyst'],
  },
  'operations': {
    domains: ['domain:operations'],
    skillAreas: ['skill-area:organizational-design', 'skill-area:stakeholder-management'],
    workflows: ['workflow:vendor-onboarding', 'workflow:vendor-evaluation'],
    roles: ['role:operations-analyst', 'role:procurement-manager'],
  },
  'project-management': {
    domains: ['domain:project-management'],
    skillAreas: ['skill-area:stakeholder-management', 'skill-area:roadmap-planning'],
    workflows: ['workflow:project-kickoff', 'workflow:feature-development'],
    roles: ['role:project-manager', 'role:scrum-master'],
  },
  'public-relations': {
    domains: ['domain:public-relations'],
    skillAreas: ['skill-area:brand-positioning', 'skill-area:content-marketing', 'skill-area:brand-strategy'],
    roles: ['role:marketing-strategist', 'role:content-strategist'],
  },
  'supply-chain': {
    domains: ['domain:supply-chain'],
    specializations: ['specialization:supply-chain-optimization'],
    skillAreas: ['skill-area:procurement-management', 'skill-area:vendor-management-ops'],
    workflows: ['workflow:vendor-onboarding', 'workflow:vendor-evaluation'],
    roles: ['role:supply-chain-analyst', 'role:procurement-manager'],
  },
  'travel': {
    domains: ['domain:travel'],
    skillAreas: ['skill-area:travel-itinerary-planning', 'skill-area:product-discovery'],
    workflows: ['workflow:customer-journey-optimization'],
    roles: ['role:product-manager', 'role:operations-analyst'],
  },
};

function buildGraphBlock(profile, indent = ' *   ') {
  const lines = [];

  if (profile.domains?.length) {
    lines.push(`${indent}domains: [${profile.domains.join(', ')}]`);
  }
  if (profile.specializations?.length) {
    lines.push(`${indent}specializations: [${profile.specializations.join(', ')}]`);
  }
  if (profile.skillAreas?.length) {
    lines.push(`${indent}skillAreas: [${profile.skillAreas.join(', ')}]`);
  }
  if (profile.workflows?.length) {
    lines.push(`${indent}workflows: [${profile.workflows.join(', ')}]`);
  }
  if (profile.roles?.length) {
    lines.push(`${indent}roles: [${profile.roles.join(', ')}]`);
  }

  return lines.join('\n');
}

function enrichGraphInJs(content, profile) {
  // Match @graph block in JSDoc (from @graph to the closing */)
  // Pattern: * @graph\n *   domains: [...]\n *   skillAreas: [...]\n *   topics: [...]\n *   roles: [...]
  const graphPattern = /(\* @graph\r?\n)((?:\s+\*\s+\w+:.*\r?\n)*)/;

  const newGraphBlock = ' * @graph\n' + buildGraphBlock(profile) + '\n';

  if (graphPattern.test(content)) {
    return content.replace(graphPattern, newGraphBlock);
  }

  // If no @graph, don't add one (shouldn't happen based on our check)
  return content;
}

function enrichGraphInSkillMd(content, profile) {
  // Match YAML graph: block
  const graphPattern = /^graph:\r?\n((?:\s+\S.*\r?\n)*)/m;

  const newGraphBlock = 'graph:\n' +
    buildGraphBlock(profile, '  ') + '\n';

  if (graphPattern.test(content)) {
    return content.replace(graphPattern, newGraphBlock);
  }

  return content;
}

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
          newContent = enrichGraphInSkillMd(content, profile);
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

const baseDir = 'C:/Users/tmusk/IdeaProjects/babysitter/library/specializations/domains/business';
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

console.log(`\nTotal modified: ${totalModified}`);
console.log(JSON.stringify(results, null, 2));

/**
 * Agent parser - combines frontmatter and markdown parsing for AGENT.md files
 */

import type {
  ParseResult,
  ParsedAgent,
  AgentMetadata,
  MarkdownSection,
  ParserOptions,
} from './types';
import { parseAgentFrontmatter } from './frontmatter';
import {
  parseMarkdownSections,
  findSection,
  extractListItems,
} from './markdown';
import {
  extractDomainFromPath,
  extractSpecializationFromPath,
  extractNameFromPath,
} from './directory';

// =============================================================================
// AGENT PARSER
// =============================================================================

/**
 * Agent parser options
 */
export interface AgentParserOptions extends ParserOptions {
  /** Whether to extract responsibilities from markdown */
  extractResponsibilities?: boolean;
  /** Whether to extract required skills from markdown */
  extractRequiredSkills?: boolean;
  /** Whether to extract collaboration info from markdown */
  extractCollaboration?: boolean;
}

const DEFAULT_OPTIONS: AgentParserOptions = {
  extractResponsibilities: true,
  extractRequiredSkills: true,
  extractCollaboration: true,
  parseMarkdownSections: true,
};

/**
 * Parse an agent definition from AGENT.md content
 *
 * @param content - Raw file content
 * @param filePath - Source file path
 * @param options - Parser options
 * @returns Parsed agent definition
 */
export function parseAgentContent(
  content: string,
  filePath: string = '',
  options: AgentParserOptions = {}
): ParseResult<ParsedAgent> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Parse frontmatter
  const frontmatterResult = parseAgentFrontmatter(content);

  if (!frontmatterResult.success || !frontmatterResult.data) {
    return {
      success: false,
      error: frontmatterResult.error || {
        code: 'AGENT_PARSE_ERROR',
        message: 'Failed to parse agent frontmatter',
        file: filePath,
      },
    };
  }

  const { data: frontmatter, content: markdownContent } = frontmatterResult.data;

  // Parse markdown sections
  let sections: MarkdownSection[] = [];
  if (opts.parseMarkdownSections) {
    const sectionsResult = parseMarkdownSections(markdownContent);
    if (sectionsResult.success && sectionsResult.data) {
      sections = sectionsResult.data;
    }
  }

  // Build agent definition
  const agent: ParsedAgent = {
    name: frontmatter.name,
    description: frontmatter.description,
    role: frontmatter.role,
    expertise: frontmatter.expertise || [],
    metadata: normalizeAgentMetadata(frontmatter.metadata, filePath),
    sections,
    source: {
      file: filePath,
      directory: getDirectory(filePath),
    },
  };

  // Extract responsibilities
  if (opts.extractResponsibilities) {
    agent.responsibilities = extractResponsibilities(sections);
  }

  // Extract required skills
  if (opts.extractRequiredSkills) {
    agent.requiredSkills = extractRequiredSkills(sections);
  }

  // Extract collaboration info
  if (opts.extractCollaboration) {
    agent.collaboration = extractCollaboration(sections);
  }

  return {
    success: true,
    data: agent,
    warnings: frontmatterResult.warnings,
  };
}

/**
 * Parse an agent from a file
 *
 * @param filePath - Path to AGENT.md file
 * @param readFile - Function to read file contents
 * @param options - Parser options
 * @returns Parsed agent definition
 */
export async function parseAgentFile(
  filePath: string,
  readFile: (path: string) => Promise<string>,
  options: AgentParserOptions = {}
): Promise<ParseResult<ParsedAgent>> {
  try {
    const content = await readFile(filePath);
    return parseAgentContent(content, filePath, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error reading file';
    return {
      success: false,
      error: {
        code: 'FILE_READ_ERROR',
        message: errorMessage,
        file: filePath,
      },
    };
  }
}

/**
 * Normalize agent metadata, filling in missing values from file path
 */
function normalizeAgentMetadata(
  metadata: AgentMetadata | undefined,
  filePath: string
): AgentMetadata {
  const normalized: AgentMetadata = { ...metadata };

  // Extract from path if not in frontmatter
  if (!normalized.domain && filePath) {
    normalized.domain = extractDomainFromPath(filePath);
  }

  if (!normalized.specialization && filePath) {
    normalized.specialization = extractSpecializationFromPath(filePath);
  }

  if (!normalized.id && filePath) {
    normalized.id = extractNameFromPath(filePath);
  }

  return normalized;
}

/**
 * Extract responsibilities from markdown sections
 */
function extractResponsibilities(sections: MarkdownSection[]): string[] {
  const responsibilities: string[] = [];

  // Look for "Responsibilities" section
  const responsibilitiesSection = findSection(sections, 'Responsibilities');
  if (responsibilitiesSection) {
    responsibilities.push(...extractListItems(responsibilitiesSection.content));

    // Also extract from subsections
    if (responsibilitiesSection.subsections) {
      for (const subsection of responsibilitiesSection.subsections) {
        const items = extractListItems(subsection.content);
        responsibilities.push(...items);
      }
    }
  }

  // Also check for "Role" section that might contain responsibilities
  const roleSection = findSection(sections, 'Role');
  if (roleSection && responsibilities.length === 0) {
    responsibilities.push(...extractListItems(roleSection.content));
  }

  return responsibilities;
}

/**
 * Extract required skills from markdown sections
 */
function extractRequiredSkills(sections: MarkdownSection[]): string[] {
  const skills: string[] = [];

  // Look for various skill-related section names
  const skillSectionNames = [
    'Required Skills',
    'Skills',
    'Required Capabilities',
    'Capabilities',
    'Tools',
    'Required Tools',
  ];

  for (const sectionName of skillSectionNames) {
    const section = findSection(sections, sectionName);
    if (section) {
      skills.push(...extractListItems(section.content));
    }
  }

  return Array.from(new Set(skills)); // Remove duplicates
}

/**
 * Extract collaboration info from markdown sections
 */
function extractCollaboration(sections: MarkdownSection[]): string[] {
  const collaboration: string[] = [];

  // Look for collaboration-related sections
  const collaborationSectionNames = [
    'Collaboration',
    'Collaborations',
    'Works With',
    'Dependencies',
    'Coordinates With',
  ];

  for (const sectionName of collaborationSectionNames) {
    const section = findSection(sections, sectionName);
    if (section) {
      collaboration.push(...extractListItems(section.content));
    }
  }

  return collaboration;
}

/**
 * Get directory from file path
 */
function getDirectory(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash >= 0 ? normalized.slice(0, lastSlash) : '';
}

/**
 * Validate parsed agent
 *
 * @param agent - Parsed agent to validate
 * @returns Validation result
 */
export function validateAgent(agent: ParsedAgent): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!agent.name) {
    errors.push('Agent name is required');
  }

  if (!agent.description) {
    errors.push('Agent description is required');
  }

  // Recommended fields
  if (!agent.role) {
    warnings.push('Agent role is recommended');
  }

  if (agent.expertise.length === 0) {
    warnings.push('Agent expertise list is recommended');
  }

  if (!agent.metadata.specialization && !agent.metadata.domain) {
    warnings.push('Agent should specify specialization or domain');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert parsed agent to catalog entry format
 */
export function agentToCatalogEntry(agent: ParsedAgent): {
  id: string;
  type: 'agent';
  name: string;
  description: string;
  path: string;
  domain?: string;
  specialization?: string;
  category?: string;
  phase?: number;
  tags: string[];
  metadata: Record<string, unknown>;
} {
  return {
    id: agent.metadata.id || agent.name,
    type: 'agent',
    name: agent.name,
    description: agent.description,
    path: agent.source.file,
    domain: agent.metadata.domain,
    specialization: agent.metadata.specialization,
    category: agent.metadata.category,
    phase: agent.metadata.phase,
    tags: [
      ...(agent.expertise || []),
      agent.role ? `role:${agent.role}` : '',
    ].filter(Boolean),
    metadata: {
      role: agent.role,
      responsibilities: agent.responsibilities,
      requiredSkills: agent.requiredSkills,
      collaboration: agent.collaboration,
    },
  };
}

/**
 * Generate agent summary
 */
export function generateAgentSummary(agent: ParsedAgent): string {
  const parts: string[] = [];

  parts.push(`# ${agent.name}`);
  parts.push('');

  if (agent.role) {
    parts.push(`**Role:** ${agent.role}`);
    parts.push('');
  }

  parts.push(`**Description:** ${agent.description}`);
  parts.push('');

  if (agent.expertise.length > 0) {
    parts.push('**Expertise:**');
    for (const exp of agent.expertise) {
      parts.push(`- ${exp}`);
    }
    parts.push('');
  }

  if (agent.responsibilities && agent.responsibilities.length > 0) {
    parts.push('**Responsibilities:**');
    for (const resp of agent.responsibilities) {
      parts.push(`- ${resp}`);
    }
    parts.push('');
  }

  if (agent.requiredSkills && agent.requiredSkills.length > 0) {
    parts.push('**Required Skills:**');
    for (const skill of agent.requiredSkills) {
      parts.push(`- ${skill}`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

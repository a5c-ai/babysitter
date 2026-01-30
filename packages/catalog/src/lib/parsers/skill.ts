/**
 * Skill parser - combines frontmatter and markdown parsing for SKILL.md files
 */

import type {
  ParseResult,
  ParsedSkill,
  SkillMetadata,
  MarkdownSection,
  ParserOptions,
} from './types';
import { parseSkillFrontmatter } from './frontmatter';
import {
  parseMarkdownSections,
  findSection,
  extractListItems,
  getPlainText,
} from './markdown';
import {
  extractDomainFromPath,
  extractSpecializationFromPath,
  extractNameFromPath,
} from './directory';

// =============================================================================
// SKILL PARSER
// =============================================================================

/**
 * Skill parser options
 */
export interface SkillParserOptions extends ParserOptions {
  /** Whether to extract purpose from markdown */
  extractPurpose?: boolean;
  /** Whether to extract capabilities from markdown */
  extractCapabilities?: boolean;
  /** Whether to extract usage guidelines from markdown */
  extractUsageGuidelines?: boolean;
  /** Whether to extract tools/libraries from markdown */
  extractTools?: boolean;
}

const DEFAULT_OPTIONS: SkillParserOptions = {
  extractPurpose: true,
  extractCapabilities: true,
  extractUsageGuidelines: true,
  extractTools: true,
  parseMarkdownSections: true,
};

/**
 * Parse a skill definition from SKILL.md content
 *
 * @param content - Raw file content
 * @param filePath - Source file path
 * @param options - Parser options
 * @returns Parsed skill definition
 */
export function parseSkillContent(
  content: string,
  filePath: string = '',
  options: SkillParserOptions = {}
): ParseResult<ParsedSkill> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Parse frontmatter
  const frontmatterResult = parseSkillFrontmatter(content);

  if (!frontmatterResult.success || !frontmatterResult.data) {
    return {
      success: false,
      error: frontmatterResult.error || {
        code: 'SKILL_PARSE_ERROR',
        message: 'Failed to parse skill frontmatter',
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

  // Build skill definition
  const skill: ParsedSkill = {
    name: frontmatter.name,
    description: frontmatter.description,
    allowedTools: frontmatter['allowed-tools'] || [],
    metadata: normalizeSkillMetadata(frontmatter.metadata, filePath),
    sections,
    source: {
      file: filePath,
      directory: getDirectory(filePath),
    },
  };

  // Extract purpose
  if (opts.extractPurpose) {
    skill.purpose = extractPurpose(sections);
  }

  // Extract capabilities
  if (opts.extractCapabilities) {
    skill.capabilities = extractCapabilities(sections);
  }

  // Extract usage guidelines
  if (opts.extractUsageGuidelines) {
    skill.usageGuidelines = extractUsageGuidelines(sections);
  }

  // Extract tools
  if (opts.extractTools) {
    skill.tools = extractTools(sections);
  }

  return {
    success: true,
    data: skill,
    warnings: frontmatterResult.warnings,
  };
}

/**
 * Parse a skill from a file
 *
 * @param filePath - Path to SKILL.md file
 * @param readFile - Function to read file contents
 * @param options - Parser options
 * @returns Parsed skill definition
 */
export async function parseSkillFile(
  filePath: string,
  readFile: (path: string) => Promise<string>,
  options: SkillParserOptions = {}
): Promise<ParseResult<ParsedSkill>> {
  try {
    const content = await readFile(filePath);
    return parseSkillContent(content, filePath, options);
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
 * Normalize skill metadata, filling in missing values from file path
 */
function normalizeSkillMetadata(
  metadata: SkillMetadata | undefined,
  filePath: string
): SkillMetadata {
  const normalized: SkillMetadata = { ...metadata };

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
 * Extract purpose from markdown sections
 */
function extractPurpose(sections: MarkdownSection[]): string | undefined {
  // Look for "Purpose" section
  const purposeSection = findSection(sections, 'Purpose');
  if (purposeSection) {
    return getPlainText(purposeSection.content);
  }

  // Try "Overview" section
  const overviewSection = findSection(sections, 'Overview');
  if (overviewSection) {
    return getPlainText(overviewSection.content);
  }

  // Try "Description" section
  const descSection = findSection(sections, 'Description');
  if (descSection) {
    return getPlainText(descSection.content);
  }

  return undefined;
}

/**
 * Extract capabilities from markdown sections
 */
function extractCapabilities(sections: MarkdownSection[]): string[] {
  const capabilities: string[] = [];

  // Look for "Capabilities" section
  const capabilitiesSection = findSection(sections, 'Capabilities');
  if (capabilitiesSection) {
    capabilities.push(...extractListItems(capabilitiesSection.content));
  }

  // Also try "Features" section
  const featuresSection = findSection(sections, 'Features');
  if (featuresSection) {
    capabilities.push(...extractListItems(featuresSection.content));
  }

  // Also try "What it does" section
  const whatSection = findSection(sections, 'What it does');
  if (whatSection) {
    capabilities.push(...extractListItems(whatSection.content));
  }

  return Array.from(new Set(capabilities)); // Remove duplicates
}

/**
 * Extract usage guidelines from markdown sections
 */
function extractUsageGuidelines(sections: MarkdownSection[]): string[] {
  const guidelines: string[] = [];

  // Look for various usage-related section names
  const usageSectionNames = [
    'Usage Guidelines',
    'Usage',
    'How to Use',
    'Getting Started',
    'Instructions',
    'Guidelines',
  ];

  for (const sectionName of usageSectionNames) {
    const section = findSection(sections, sectionName);
    if (section) {
      guidelines.push(...extractListItems(section.content));

      // Also extract from subsections
      if (section.subsections) {
        for (const subsection of section.subsections) {
          const items = extractListItems(subsection.content);
          if (items.length > 0) {
            guidelines.push(`**${subsection.title}:**`);
            guidelines.push(...items);
          }
        }
      }
    }
  }

  return guidelines;
}

/**
 * Extract tools/libraries from markdown sections
 */
function extractTools(sections: MarkdownSection[]): string[] {
  const tools: string[] = [];

  // Look for various tool-related section names
  const toolSectionNames = [
    'Tools',
    'Libraries',
    'Tools/Libraries',
    'Dependencies',
    'Requirements',
    'External Tools',
  ];

  for (const sectionName of toolSectionNames) {
    const section = findSection(sections, sectionName);
    if (section) {
      tools.push(...extractListItems(section.content));
    }
  }

  return Array.from(new Set(tools)); // Remove duplicates
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
 * Validate parsed skill
 *
 * @param skill - Parsed skill to validate
 * @returns Validation result
 */
export function validateSkill(skill: ParsedSkill): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!skill.name) {
    errors.push('Skill name is required');
  }

  if (!skill.description) {
    errors.push('Skill description is required');
  }

  // Recommended fields
  if (skill.allowedTools.length === 0) {
    warnings.push('Skill allowed-tools list is recommended');
  }

  if (!skill.metadata.specialization && !skill.metadata.domain) {
    warnings.push('Skill should specify specialization or domain');
  }

  if (!skill.purpose) {
    warnings.push('Skill should have a Purpose section');
  }

  if (!skill.capabilities || skill.capabilities.length === 0) {
    warnings.push('Skill should have a Capabilities section');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert parsed skill to catalog entry format
 */
export function skillToCatalogEntry(skill: ParsedSkill): {
  id: string;
  type: 'skill';
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
    id: skill.metadata.id || skill.name,
    type: 'skill',
    name: skill.name,
    description: skill.description,
    path: skill.source.file,
    domain: skill.metadata.domain,
    specialization: skill.metadata.specialization,
    category: skill.metadata.category,
    phase: skill.metadata.phase,
    tags: [
      ...skill.allowedTools.map((t) => `tool:${t}`),
      ...(skill.capabilities || []).slice(0, 5), // First 5 capabilities as tags
    ],
    metadata: {
      allowedTools: skill.allowedTools,
      purpose: skill.purpose,
      capabilities: skill.capabilities,
      usageGuidelines: skill.usageGuidelines,
      tools: skill.tools,
    },
  };
}

/**
 * Generate skill summary
 */
export function generateSkillSummary(skill: ParsedSkill): string {
  const parts: string[] = [];

  parts.push(`# ${skill.name}`);
  parts.push('');

  parts.push(`**Description:** ${skill.description}`);
  parts.push('');

  if (skill.purpose) {
    parts.push(`**Purpose:** ${skill.purpose}`);
    parts.push('');
  }

  if (skill.allowedTools.length > 0) {
    parts.push('**Allowed Tools:**');
    for (const tool of skill.allowedTools) {
      parts.push(`- ${tool}`);
    }
    parts.push('');
  }

  if (skill.capabilities && skill.capabilities.length > 0) {
    parts.push('**Capabilities:**');
    for (const cap of skill.capabilities) {
      parts.push(`- ${cap}`);
    }
    parts.push('');
  }

  if (skill.tools && skill.tools.length > 0) {
    parts.push('**Tools/Libraries:**');
    for (const tool of skill.tools) {
      parts.push(`- ${tool}`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Check if a skill is compatible with given tools
 */
export function isSkillCompatibleWithTools(
  skill: ParsedSkill,
  availableTools: string[]
): boolean {
  // If no allowed tools specified, assume compatible
  if (skill.allowedTools.length === 0) {
    return true;
  }

  // Check if all required tools are available
  return skill.allowedTools.every((tool) =>
    availableTools.some((available) =>
      available.toLowerCase() === tool.toLowerCase()
    )
  );
}

/**
 * Get skills by category
 */
export function groupSkillsByCategory(
  skills: ParsedSkill[]
): Map<string, ParsedSkill[]> {
  const grouped = new Map<string, ParsedSkill[]>();

  for (const skill of skills) {
    const category = skill.metadata.category || 'uncategorized';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(skill);
  }

  return grouped;
}

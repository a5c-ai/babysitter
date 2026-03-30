/**
 * @process meta/skill-creation
 * @description Create a new skill with SKILL.md, README.md, and supporting files
 * @inputs { skillName: string, description: string, allowedTools: array, category: string, specialization: string, outputDir: string }
 * @outputs { success: boolean, skillPath: string, files: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    skillName,
    description,
    allowedTools = ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
    category = 'general',
    specialization,
    outputDir,
    capabilities = [],
    targetProcesses = [],
    mcpServers = [],
    constraints = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Creating skill: ${skillName}`);

  const skillPath = `${outputDir}/skills/${skillName}`;

  // ============================================================================
  // PHASE 1: DEFINE SKILL CAPABILITIES
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining skill capabilities');

  const capabilityDef = await ctx.task(capabilityDefinitionTask, {
    skillName,
    description,
    capabilities,
    targetProcesses,
    allowedTools
  });

  artifacts.push(...capabilityDef.artifacts);

  // ============================================================================
  // PHASE 2: GENERATE SKILL.md
  // ============================================================================

  ctx.log('info', 'Phase 2: Generating SKILL.md');

  const skillMd = await ctx.task(skillMdGenerationTask, {
    skillName,
    description,
    allowedTools,
    category,
    capabilities: capabilityDef.capabilities,
    mcpServers,
    constraints,
    targetProcesses,
    skillPath
  });

  artifacts.push(...skillMd.artifacts);

  // ============================================================================
  // PHASE 3: GENERATE README.md
  // ============================================================================

  ctx.log('info', 'Phase 3: Generating README.md');

  const readmeMd = await ctx.task(skillReadmeGenerationTask, {
    skillName,
    description,
    capabilities: capabilityDef.capabilities,
    skillPath
  });

  artifacts.push(...readmeMd.artifacts);

  // ============================================================================
  // PHASE 4: VALIDATE SKILL
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating skill');

  const validation = await ctx.task(skillValidationTask, {
    skillPath,
    skillName
  });

  artifacts.push(...validation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.valid,
    skillName,
    skillPath,
    files: [
      `${skillPath}/SKILL.md`,
      `${skillPath}/README.md`
    ],
    capabilities: capabilityDef.capabilities.length,
    validation: validation.results,
    artifacts,
    duration,
    metadata: {
      processId: 'meta/skill-creation',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Capability Definition
export const capabilityDefinitionTask = defineTask('capability-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define skill capabilities',
  skill: { name: 'skill-analyzer' },
  agent: {
    name: 'skill-designer',
    prompt: {
      role: 'Skill capability analyst',
      task: 'Define comprehensive capabilities for the skill',
      context: args,
      instructions: [
        'Analyze the skill description and purpose',
        'Define specific capabilities the skill provides',
        'Each capability should be:',
        '  - Actionable and specific',
        '  - Within scope of allowed tools',
        '  - Aligned with target processes',
        'Consider input/output patterns',
        'Define interaction patterns',
        'Identify prerequisites'
      ],
      outputFormat: 'JSON with capabilities (array), prerequisites (array), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['capabilities', 'artifacts'],
      properties: {
        capabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        prerequisites: { type: 'array', items: { type: 'string' } },
        interactionPatterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'skill', 'capabilities']
}));

// Task 2: SKILL.md Generation
export const skillMdGenerationTask = defineTask('skill-md-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate SKILL.md file',
  skill: { name: 'skill-generator' },
  agent: {
    name: 'skill-designer',
    prompt: {
      role: 'Skill documentation writer',
      task: 'Generate comprehensive SKILL.md file',
      context: args,
      instructions: [
        'Create SKILL.md with proper structure:',
        '1. YAML frontmatter:',
        '   ---',
        '   name: skill-name',
        '   description: Description',
        '   allowed-tools: Tool1 Tool2 Tool3',
        '   metadata:',
        '     author: babysitter-sdk',
        '     version: "1.0.0"',
        '     category: category',
        '   ---',
        '2. Overview section',
        '3. Capabilities section with examples',
        '4. Prerequisites section',
        '5. MCP Server Integration (if applicable)',
        '6. Best Practices section',
        '7. Process Integration section',
        '8. Output Format section',
        '9. Error Handling section',
        '10. Constraints section',
        `Create directory: ${args.skillPath}`,
        `Save to: ${args.skillPath}/SKILL.md`
      ],
      outputFormat: 'JSON with skillMdPath, content, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['skillMdPath', 'artifacts'],
      properties: {
        skillMdPath: { type: 'string' },
        content: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'skill', 'documentation']
}));

// Task 3: README.md Generation
export const skillReadmeGenerationTask = defineTask('skill-readme-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate skill README.md',
  skill: { name: 'documentation-generator' },
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical documentation writer',
      task: 'Generate README.md for the skill',
      context: args,
      instructions: [
        'Create README.md with:',
        '1. Skill title and badge',
        '2. Quick overview',
        '3. Installation/setup instructions',
        '4. Usage examples with code',
        '5. Configuration options',
        '6. API reference',
        '7. Troubleshooting guide',
        '8. Contributing guidelines',
        '9. License information',
        `Save to: ${args.skillPath}/README.md`
      ],
      outputFormat: 'JSON with readmePath, content, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        content: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'skill', 'readme']
}));

// Task 4: Skill Validation
export const skillValidationTask = defineTask('skill-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate skill files',
  skill: { name: 'skill-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Skill validation specialist',
      task: 'Validate skill files are complete and correct',
      context: args,
      instructions: [
        'Validate SKILL.md:',
        '  - Has valid YAML frontmatter',
        '  - name field matches directory name',
        '  - description is comprehensive',
        '  - allowed-tools are valid',
        '  - Has required sections',
        'Validate README.md:',
        '  - Has overview section',
        '  - Has usage examples',
        '  - Has proper markdown formatting',
        'Check directory structure',
        'Generate validation report'
      ],
      outputFormat: 'JSON with valid (boolean), results (object), issues (array), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'results', 'artifacts'],
      properties: {
        valid: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            hasSkillMd: { type: 'boolean' },
            hasReadme: { type: 'boolean' },
            validFrontmatter: { type: 'boolean' },
            hasRequiredSections: { type: 'boolean' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'skill', 'validation']
}));

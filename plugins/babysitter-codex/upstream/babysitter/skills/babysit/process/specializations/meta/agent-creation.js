/**
 * @process meta/agent-creation
 * @description Create a new agent with AGENT.md and README.md including role definition, expertise, and prompt templates
 * @inputs { agentName: string, description: string, role: string, expertise: array, specialization: string, outputDir: string }
 * @outputs { success: boolean, agentPath: string, files: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName,
    description,
    role,
    expertise = [],
    specialization,
    outputDir,
    targetProcesses = [],
    collaborators = [],
    promptGuidelines = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Creating agent: ${agentName}`);

  const agentPath = `${outputDir}/agents/${agentName}`;

  // ============================================================================
  // PHASE 1: DEFINE AGENT ROLE AND EXPERTISE
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining agent role and expertise');

  const roleDef = await ctx.task(roleDefinitionTask, {
    agentName,
    description,
    role,
    expertise,
    targetProcesses
  });

  artifacts.push(...roleDef.artifacts);

  // ============================================================================
  // PHASE 2: CREATE PROMPT TEMPLATES
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating prompt templates');

  const prompts = await ctx.task(promptTemplateCreationTask, {
    agentName,
    role: roleDef.refinedRole,
    expertise: roleDef.expertise,
    promptGuidelines
  });

  artifacts.push(...prompts.artifacts);

  // ============================================================================
  // PHASE 3: GENERATE AGENT.md
  // ============================================================================

  ctx.log('info', 'Phase 3: Generating AGENT.md');

  const agentMd = await ctx.task(agentMdGenerationTask, {
    agentName,
    description,
    role: roleDef.refinedRole,
    expertise: roleDef.expertise,
    capabilities: roleDef.capabilities,
    targetProcesses,
    promptTemplate: prompts.mainTemplate,
    collaborators,
    agentPath
  });

  artifacts.push(...agentMd.artifacts);

  // ============================================================================
  // PHASE 4: GENERATE README.md
  // ============================================================================

  ctx.log('info', 'Phase 4: Generating README.md');

  const readmeMd = await ctx.task(agentReadmeGenerationTask, {
    agentName,
    description,
    role: roleDef.refinedRole,
    expertise: roleDef.expertise,
    agentPath
  });

  artifacts.push(...readmeMd.artifacts);

  // ============================================================================
  // PHASE 5: VALIDATE AGENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Validating agent');

  const validation = await ctx.task(agentValidationTask, {
    agentPath,
    agentName
  });

  artifacts.push(...validation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.valid,
    agentName,
    agentPath,
    role: roleDef.refinedRole,
    files: [
      `${agentPath}/AGENT.md`,
      `${agentPath}/README.md`
    ],
    expertise: roleDef.expertise.length,
    validation: validation.results,
    artifacts,
    duration,
    metadata: {
      processId: 'meta/agent-creation',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Role Definition
export const roleDefinitionTask = defineTask('role-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define agent role and expertise',
  skill: { name: 'agent-analyzer' },
  agent: {
    name: 'agent-designer',
    prompt: {
      role: 'Agent design specialist',
      task: 'Define comprehensive role, expertise, and capabilities for the agent',
      context: args,
      instructions: [
        'Analyze the agent description and purpose',
        'Refine the role title to be specific',
        'Define expertise areas (5-10 items)',
        'Each expertise should be:',
        '  - Specific and measurable',
        '  - Relevant to target processes',
        '  - Complementary to other expertise',
        'Define capabilities the agent provides',
        'Identify interaction patterns with other agents'
      ],
      outputFormat: 'JSON with refinedRole, expertise (array), capabilities (array), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedRole', 'expertise', 'artifacts'],
      properties: {
        refinedRole: { type: 'string' },
        expertise: { type: 'array', items: { type: 'string' } },
        capabilities: { type: 'array', items: { type: 'string' } },
        interactionPatterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'agent-design', 'role']
}));

// Task 2: Prompt Template Creation
export const promptTemplateCreationTask = defineTask('prompt-template-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create prompt templates for agent',
  skill: { name: 'prompt-engineer' },
  agent: {
    name: 'agent-designer',
    prompt: {
      role: 'Prompt engineering specialist',
      task: 'Create effective prompt templates for the agent',
      context: args,
      instructions: [
        'Create main prompt template with:',
        '  - role: Clear role description',
        '  - expertise: Array of expertise areas',
        '  - task: Placeholder for specific task',
        '  - guidelines: Array of behavior guidelines',
        '  - outputFormat: Expected output structure',
        'Follow prompt engineering best practices:',
        '  - Be specific and unambiguous',
        '  - Include examples where helpful',
        '  - Define output format clearly',
        '  - Add constraints and guardrails',
        'Create alternative templates for different use cases'
      ],
      outputFormat: 'JSON with mainTemplate (object), alternativeTemplates (array), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mainTemplate', 'artifacts'],
      properties: {
        mainTemplate: {
          type: 'object',
          properties: {
            role: { type: 'string' },
            expertise: { type: 'array' },
            task: { type: 'string' },
            guidelines: { type: 'array' },
            outputFormat: { type: 'string' }
          }
        },
        alternativeTemplates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'agent-design', 'prompts']
}));

// Task 3: AGENT.md Generation
export const agentMdGenerationTask = defineTask('agent-md-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate AGENT.md file',
  skill: { name: 'agent-generator' },
  agent: {
    name: 'agent-designer',
    prompt: {
      role: 'Agent documentation writer',
      task: 'Generate comprehensive AGENT.md file',
      context: args,
      instructions: [
        'Create AGENT.md with proper structure:',
        '1. YAML frontmatter:',
        '   ---',
        '   name: agent-name',
        '   description: Description',
        '   role: Role Category',
        '   expertise:',
        '     - Expertise area 1',
        '     - Expertise area 2',
        '   ---',
        '2. # Agent Name Agent header',
        '3. ## Overview section',
        '4. ## Capabilities section with bullet points',
        '5. ## Target Processes section',
        '6. ## Prompt Template section with code block',
        '7. ## Interaction Patterns section',
        `Create directory: ${args.agentPath}`,
        `Save to: ${args.agentPath}/AGENT.md`
      ],
      outputFormat: 'JSON with agentMdPath, content, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['agentMdPath', 'artifacts'],
      properties: {
        agentMdPath: { type: 'string' },
        content: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'agent-design', 'documentation']
}));

// Task 4: README.md Generation
export const agentReadmeGenerationTask = defineTask('agent-readme-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate agent README.md',
  skill: { name: 'documentation-generator' },
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical documentation writer',
      task: 'Generate README.md for the agent',
      context: args,
      instructions: [
        'Create README.md with:',
        '1. Agent title',
        '2. Quick overview',
        '3. When to use this agent',
        '4. Capabilities summary',
        '5. Usage examples',
        '6. Integration guide',
        '7. Best practices for prompting',
        `Save to: ${args.agentPath}/README.md`
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
  labels: ['agent', 'meta', 'agent-design', 'readme']
}));

// Task 5: Agent Validation
export const agentValidationTask = defineTask('agent-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate agent files',
  skill: { name: 'agent-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Agent validation specialist',
      task: 'Validate agent files are complete and correct',
      context: args,
      instructions: [
        'Validate AGENT.md:',
        '  - Has valid YAML frontmatter',
        '  - name field matches directory name',
        '  - description is comprehensive',
        '  - role is defined',
        '  - expertise array has items',
        '  - Has required sections',
        'Validate README.md:',
        '  - Has overview section',
        '  - Has usage examples',
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
            hasAgentMd: { type: 'boolean' },
            hasReadme: { type: 'boolean' },
            validFrontmatter: { type: 'boolean' },
            hasExpertise: { type: 'boolean' },
            hasPromptTemplate: { type: 'boolean' }
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
  labels: ['agent', 'meta', 'agent-design', 'validation']
}));

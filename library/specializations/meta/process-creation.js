/**
 * @process meta/process-creation
 * @description Create a new process JS file from requirements with task definitions, quality gates, and breakpoints
 * @inputs { processName: string, specialization: string, description: string, inputs: object, outputs: object, outputDir: string }
 * @outputs { success: boolean, processFile: string, taskCount: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    specialization,
    description,
    processInputs = {},
    processOutputs = {},
    outputDir,
    includeBreakpoints = true,
    includeQualityGates = true,
    referenceProcess = null
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Creating process: ${specialization}/${processName}`);

  // ============================================================================
  // PHASE 1: ANALYZE REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing process requirements');

  const requirements = await ctx.task(requirementsAnalysisTask, {
    processName,
    specialization,
    description,
    processInputs,
    processOutputs,
    referenceProcess
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: DESIGN TASK STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing task structure');

  const taskDesign = await ctx.task(taskStructureDesignTask, {
    processName,
    requirements: requirements.analysis,
    includeBreakpoints,
    includeQualityGates
  });

  artifacts.push(...taskDesign.artifacts);

  // Breakpoint: Review task design
  await ctx.breakpoint({
    question: `Task structure designed with ${taskDesign.taskCount} tasks. Review before implementation?`,
    title: 'Task Structure Review',
    context: {
      runId: ctx.runId,
      files: taskDesign.artifacts.map(a => ({
        path: a.path,
        format: 'json',
        label: a.label
      })),
      summary: {
        taskCount: taskDesign.taskCount,
        phases: taskDesign.phases,
        breakpoints: taskDesign.breakpointCount,
        qualityGates: taskDesign.qualityGateCount
      }
    }
  });

  // ============================================================================
  // PHASE 3: GENERATE PROCESS FILE
  // ============================================================================

  ctx.log('info', 'Phase 3: Generating process file');

  const generation = await ctx.task(processGenerationTask, {
    processName,
    specialization,
    description,
    processInputs,
    processOutputs,
    taskDesign: taskDesign.design,
    outputDir
  });

  artifacts.push(...generation.artifacts);

  // ============================================================================
  // PHASE 4: VALIDATE PROCESS
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating process file');

  const validation = await ctx.task(processValidationTask, {
    processFile: generation.processFile,
    expectedTasks: taskDesign.taskCount
  });

  artifacts.push(...validation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.valid,
    processFile: generation.processFile,
    processId: `${specialization}/${processName}`,
    taskCount: taskDesign.taskCount,
    phases: taskDesign.phases,
    breakpoints: taskDesign.breakpointCount,
    qualityGates: taskDesign.qualityGateCount,
    validation: validation.results,
    artifacts,
    duration,
    metadata: {
      processId: 'meta/process-creation',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Requirements Analysis
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze process requirements',
  skill: { name: 'process-analyzer' },
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Process requirements analyst',
      task: 'Analyze process requirements and define scope',
      context: args,
      instructions: [
        'Analyze the process description and purpose',
        'Define clear process boundaries',
        'Identify input parameters and types',
        'Define expected outputs and artifacts',
        'Identify key decision points',
        'Determine quality criteria',
        'Note dependencies on skills/agents',
        'If reference process provided, analyze its patterns'
      ],
      outputFormat: 'JSON with analysis object containing scope, inputs, outputs, decisions, qualityCriteria, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            scope: { type: 'string' },
            inputs: { type: 'object' },
            outputs: { type: 'object' },
            decisions: { type: 'array', items: { type: 'string' } },
            qualityCriteria: { type: 'array', items: { type: 'string' } },
            dependencies: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'requirements']
}));

// Task 2: Task Structure Design
export const taskStructureDesignTask = defineTask('task-structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design task structure for process',
  skill: { name: 'process-generator' },
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Process structure designer',
      task: 'Design the task structure including phases, tasks, breakpoints, and quality gates',
      context: args,
      instructions: [
        'Organize process into logical phases',
        'Design individual tasks for each phase',
        'Each task should have:',
        '  - Unique name (kebab-case)',
        '  - Clear title',
        '  - Kind (agent, skill, node, breakpoint)',
        '  - Skill and agent references',
        '  - Input/output schema',
        'Place breakpoints at decision points (if enabled)',
        'Place quality gates for scoring (if enabled)',
        'Ensure proper task sequencing',
        'Document task dependencies'
      ],
      outputFormat: 'JSON with design (object), taskCount, phases, breakpointCount, qualityGateCount, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'taskCount', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            tasks: { type: 'array' },
            breakpoints: { type: 'array' },
            qualityGates: { type: 'array' }
          }
        },
        taskCount: { type: 'number' },
        phases: { type: 'number' },
        breakpointCount: { type: 'number' },
        qualityGateCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'design']
}));

// Task 3: Process Generation
export const processGenerationTask = defineTask('process-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate process JS file',
  skill: { name: 'process-generator' },
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Process code generator',
      task: 'Generate the complete process JS file',
      context: args,
      instructions: [
        'Generate process file following SDK patterns:',
        '1. JSDoc header with @process, @description, @inputs, @outputs',
        '2. Import statement: import { defineTask } from "@a5c-ai/babysitter-sdk"',
        '3. Export async function process(inputs, ctx)',
        '4. Phase sections with ctx.log() calls',
        '5. Task calls with ctx.task(taskName, args)',
        '6. Breakpoints with ctx.breakpoint({ question, title, context })',
        '7. Return structured output',
        '8. Export task definitions with defineTask',
        'Each task definition should have:',
        '  - kind: "agent"',
        '  - title: descriptive title',
        '  - skill: { name: "skill-name" }',
        '  - agent: { name, prompt, outputSchema }',
        '  - io: { inputJsonPath, outputJsonPath }',
        '  - labels array',
        `Save to: ${args.outputDir}/${args.processName}.js`
      ],
      outputFormat: 'JSON with processFile (path), code (content), and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processFile', 'artifacts'],
      properties: {
        processFile: { type: 'string' },
        code: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'meta', 'generation']
}));

// Task 4: Process Validation
export const processValidationTask = defineTask('process-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate generated process',
  skill: { name: 'process-validator' },
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Process validation specialist',
      task: 'Validate the generated process file',
      context: args,
      instructions: [
        'Read the generated process file',
        'Validate JSDoc metadata is complete',
        'Validate import statement is correct',
        'Validate process function signature',
        'Count and verify task definitions',
        'Check task definition structure:',
        '  - Has kind field',
        '  - Has title field',
        '  - Has agent or skill object',
        '  - Has io object with paths',
        'Verify breakpoints have required fields',
        'Check for syntax errors',
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
            hasJsdoc: { type: 'boolean' },
            hasImport: { type: 'boolean' },
            hasProcessFunction: { type: 'boolean' },
            taskCount: { type: 'number' },
            validTasks: { type: 'number' }
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
  labels: ['agent', 'meta', 'validation']
}));

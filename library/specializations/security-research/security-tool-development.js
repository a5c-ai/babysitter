/**
 * @process specializations/security-research/security-tool-development
 * @description Development of custom security tools including scanners, exploit frameworks, detection
 * tools, and automation scripts. Covers design, implementation, testing, and documentation following
 * secure development practices.
 * @inputs { projectName: string, toolType: string, requirements: object }
 * @outputs { success: boolean, tool: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/security-tool-development', {
 *   projectName: 'Custom Vulnerability Scanner',
 *   toolType: 'scanner',
 *   requirements: { language: 'python', features: ['api-scanning', 'reporting'] }
 * });
 *
 * @references
 * - OWASP Secure Coding: https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    toolType,
    requirements,
    outputDir = 'tool-development-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Security Tool Development for ${projectName}`);
  ctx.log('info', `Tool Type: ${toolType}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS AND DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining requirements and architecture');

  const design = await ctx.task(toolDesignTask, {
    projectName,
    toolType,
    requirements,
    outputDir
  });

  artifacts.push(...design.artifacts);

  // ============================================================================
  // PHASE 2: CORE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing core functionality');

  const coreImpl = await ctx.task(coreImplementationTask, {
    projectName,
    design,
    requirements,
    outputDir
  });

  artifacts.push(...coreImpl.artifacts);

  // ============================================================================
  // PHASE 3: FEATURE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing features');

  const featureImpl = await ctx.task(featureImplementationTask, {
    projectName,
    design,
    coreImpl,
    requirements,
    outputDir
  });

  artifacts.push(...featureImpl.artifacts);

  // ============================================================================
  // PHASE 4: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 4: Testing tool functionality');

  const testing = await ctx.task(toolTestingTask, {
    projectName,
    coreImpl,
    featureImpl,
    outputDir
  });

  artifacts.push(...testing.artifacts);

  // ============================================================================
  // PHASE 5: SECURITY REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 5: Security review of tool code');

  const securityReview = await ctx.task(toolSecurityReviewTask, {
    projectName,
    coreImpl,
    featureImpl,
    outputDir
  });

  artifacts.push(...securityReview.artifacts);

  // ============================================================================
  // PHASE 6: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating documentation');

  const documentation = await ctx.task(toolDocumentationTask, {
    projectName,
    design,
    coreImpl,
    featureImpl,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Tool development complete. Tests passed: ${testing.passed}/${testing.total}. Security issues: ${securityReview.issues.length}. Review and release?`,
    title: 'Tool Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        toolType,
        testsPassed: testing.passed,
        testsTotal: testing.total,
        securityIssues: securityReview.issues.length
      },
      files: documentation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    tool: {
      type: toolType,
      version: design.version,
      path: coreImpl.toolPath,
      features: featureImpl.features
    },
    documentation: {
      readmePath: documentation.readmePath,
      apiDocs: documentation.apiDocs
    },
    testResults: testing.results,
    securityReview: securityReview.issues,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/security-tool-development',
      timestamp: startTime,
      toolType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const toolDesignTask = defineTask('tool-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Tool - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Security Tool Architect',
      task: 'Design tool architecture',
      context: args,
      instructions: [
        '1. Define tool purpose',
        '2. Design architecture',
        '3. Define interfaces',
        '4. Plan modules',
        '5. Define data structures',
        '6. Plan extensibility',
        '7. Define CLI/API',
        '8. Document design'
      ],
      outputFormat: 'JSON with design'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'version', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        version: { type: 'string' },
        modules: { type: 'array' },
        interfaces: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'tool-dev', 'design']
}));

export const coreImplementationTask = defineTask('core-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Core - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Security Tool Developer',
      task: 'Implement core functionality',
      context: args,
      instructions: [
        '1. Set up project structure',
        '2. Implement core modules',
        '3. Implement CLI interface',
        '4. Add configuration',
        '5. Implement logging',
        '6. Add error handling',
        '7. Create base classes',
        '8. Document code'
      ],
      outputFormat: 'JSON with implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['toolPath', 'modules', 'artifacts'],
      properties: {
        toolPath: { type: 'string' },
        modules: { type: 'array' },
        linesOfCode: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'tool-dev', 'implementation']
}));

export const featureImplementationTask = defineTask('feature-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Features - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Feature Developer',
      task: 'Implement features',
      context: args,
      instructions: [
        '1. Implement required features',
        '2. Add reporting functionality',
        '3. Implement plugins',
        '4. Add output formats',
        '5. Implement filters',
        '6. Add optimization',
        '7. Implement caching',
        '8. Document features'
      ],
      outputFormat: 'JSON with features'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'implemented', 'artifacts'],
      properties: {
        features: { type: 'array' },
        implemented: { type: 'number' },
        plugins: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'tool-dev', 'features']
}));

export const toolTestingTask = defineTask('tool-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Tool - ${args.projectName}`,
  agent: {
    name: 'fuzzing-engineer',
    prompt: {
      role: 'Security Tool Tester',
      task: 'Test tool functionality',
      context: args,
      instructions: [
        '1. Write unit tests',
        '2. Write integration tests',
        '3. Test edge cases',
        '4. Test error handling',
        '5. Performance testing',
        '6. Test CLI interface',
        '7. Test all features',
        '8. Document results'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'total', 'results', 'artifacts'],
      properties: {
        passed: { type: 'number' },
        total: { type: 'number' },
        results: { type: 'array' },
        coverage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'tool-dev', 'testing']
}));

export const toolSecurityReviewTask = defineTask('tool-security-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Review - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Security Code Reviewer',
      task: 'Security review of tool code',
      context: args,
      instructions: [
        '1. Review for injection flaws',
        '2. Check input validation',
        '3. Review authentication',
        '4. Check for secrets',
        '5. Review dependencies',
        '6. Check error handling',
        '7. Review file operations',
        '8. Document issues'
      ],
      outputFormat: 'JSON with security review'
    },
    outputSchema: {
      type: 'object',
      required: ['issues', 'reviewed', 'artifacts'],
      properties: {
        issues: { type: 'array' },
        reviewed: { type: 'boolean' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'tool-dev', 'security-review']
}));

export const toolDocumentationTask = defineTask('tool-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Tool - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Create tool documentation',
      context: args,
      instructions: [
        '1. Create README',
        '2. Document installation',
        '3. Document usage',
        '4. Create API docs',
        '5. Document configuration',
        '6. Add examples',
        '7. Create changelog',
        '8. Add contributing guide'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'apiDocs', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        apiDocs: { type: 'string' },
        examples: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'tool-dev', 'documentation']
}));

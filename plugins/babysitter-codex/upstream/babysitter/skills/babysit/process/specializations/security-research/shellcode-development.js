/**
 * @process specializations/security-research/shellcode-development
 * @description Creation of position-independent payload code for exploit delivery. Includes shellcode
 * for various purposes and architectures with constraint handling, encoding, and testing.
 * @inputs { projectName: string, architecture: string, purpose: string, constraints?: object }
 * @outputs { success: boolean, shellcode: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/shellcode-development', {
 *   projectName: 'x64 Reverse Shell',
 *   architecture: 'x86_64',
 *   purpose: 'reverse-shell',
 *   constraints: { badChars: ['0x00', '0x0a', '0x0d'], maxSize: 512 }
 * });
 *
 * @references
 * - Shell-Storm: http://shell-storm.org/shellcode/
 * - Pwntools: https://docs.pwntools.com/
 * - OSCP: https://www.offensive-security.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    architecture,
    purpose,
    constraints = {},
    outputDir = 'shellcode-dev-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Shellcode Development for ${projectName}`);
  ctx.log('info', `Architecture: ${architecture}, Purpose: ${purpose}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing shellcode requirements');

  const requirements = await ctx.task(requirementsAnalysisTask, {
    projectName,
    architecture,
    purpose,
    constraints,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: SHELLCODE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing shellcode structure');

  const design = await ctx.task(shellcodeDesignTask, {
    projectName,
    architecture,
    requirements,
    outputDir
  });

  artifacts.push(...design.artifacts);

  // ============================================================================
  // PHASE 3: ASSEMBLY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Writing assembly code');

  const assembly = await ctx.task(assemblyDevelopmentTask, {
    projectName,
    architecture,
    design,
    constraints,
    outputDir
  });

  artifacts.push(...assembly.artifacts);

  // ============================================================================
  // PHASE 4: ENCODING AND OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Encoding and optimizing shellcode');

  const encoding = await ctx.task(encodingOptimizationTask, {
    projectName,
    assembly,
    constraints,
    outputDir
  });

  artifacts.push(...encoding.artifacts);

  // ============================================================================
  // PHASE 5: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing shellcode functionality');

  const testing = await ctx.task(shellcodeTestingTask, {
    projectName,
    encoding,
    architecture,
    outputDir
  });

  artifacts.push(...testing.artifacts);

  // ============================================================================
  // PHASE 6: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Documenting shellcode');

  const documentation = await ctx.task(shellcodeDocumentationTask, {
    projectName,
    assembly,
    encoding,
    testing,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Shellcode development complete. Size: ${encoding.finalSize} bytes. All tests passed: ${testing.allPassed}. Review shellcode?`,
    title: 'Shellcode Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        architecture,
        purpose,
        size: encoding.finalSize,
        encoded: encoding.encoderUsed,
        testsPassed: testing.allPassed
      },
      files: documentation.artifacts.map(a => ({ path: a.path, format: a.format || 'text', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    shellcode: {
      architecture,
      purpose,
      rawBytes: encoding.rawBytes,
      encodedBytes: encoding.encodedBytes,
      size: encoding.finalSize
    },
    testResults: {
      allPassed: testing.allPassed,
      tests: testing.testResults
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/shellcode-development',
      timestamp: startTime,
      architecture,
      purpose,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Requirements - ${args.projectName}`,
  agent: {
    name: 'exploit-developer',
    prompt: {
      role: 'Shellcode Architect',
      task: 'Analyze shellcode requirements',
      context: args,
      instructions: [
        '1. Define shellcode functionality',
        '2. Identify target architecture details',
        '3. Document constraint requirements',
        '4. Identify bad characters',
        '5. Determine size constraints',
        '6. Research system call numbers',
        '7. Plan encoding needs',
        '8. Document requirements'
      ],
      outputFormat: 'JSON with requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['functionality', 'constraints', 'artifacts'],
      properties: {
        functionality: { type: 'array' },
        constraints: { type: 'object' },
        syscalls: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'shellcode', 'requirements']
}));

export const shellcodeDesignTask = defineTask('shellcode-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Shellcode - ${args.projectName}`,
  agent: {
    name: 'exploit-developer',
    prompt: {
      role: 'Shellcode Designer',
      task: 'Design shellcode structure',
      context: args,
      instructions: [
        '1. Design execution flow',
        '2. Plan register usage',
        '3. Design data section',
        '4. Plan null-byte avoidance',
        '5. Design position independence',
        '6. Plan stack operations',
        '7. Design payload delivery',
        '8. Document design'
      ],
      outputFormat: 'JSON with shellcode design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'executionFlow', 'artifacts'],
      properties: {
        design: { type: 'object' },
        executionFlow: { type: 'array' },
        registerMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'shellcode', 'design']
}));

export const assemblyDevelopmentTask = defineTask('assembly-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop Assembly - ${args.projectName}`,
  agent: {
    name: 'exploit-developer',
    prompt: {
      role: 'Assembly Developer',
      task: 'Write shellcode assembly',
      context: args,
      instructions: [
        '1. Write assembly prologue',
        '2. Implement core functionality',
        '3. Handle system calls',
        '4. Implement null-byte avoidance',
        '5. Optimize for size',
        '6. Ensure position independence',
        '7. Assemble and extract bytes',
        '8. Document assembly code'
      ],
      outputFormat: 'JSON with assembly code'
    },
    outputSchema: {
      type: 'object',
      required: ['assemblyCode', 'rawBytes', 'artifacts'],
      properties: {
        assemblyCode: { type: 'string' },
        rawBytes: { type: 'string' },
        size: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'shellcode', 'assembly']
}));

export const encodingOptimizationTask = defineTask('encoding-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Encode and Optimize - ${args.projectName}`,
  agent: {
    name: 'exploit-developer',
    prompt: {
      role: 'Shellcode Encoder',
      task: 'Encode and optimize shellcode',
      context: args,
      instructions: [
        '1. Check for bad characters',
        '2. Apply encoding if needed',
        '3. Create decoder stub',
        '4. Optimize for constraints',
        '5. Verify no bad bytes',
        '6. Calculate final size',
        '7. Generate multiple formats',
        '8. Document encoding'
      ],
      outputFormat: 'JSON with encoded shellcode'
    },
    outputSchema: {
      type: 'object',
      required: ['rawBytes', 'encodedBytes', 'finalSize', 'artifacts'],
      properties: {
        rawBytes: { type: 'string' },
        encodedBytes: { type: 'string' },
        encoderUsed: { type: 'string' },
        finalSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'shellcode', 'encoding']
}));

export const shellcodeTestingTask = defineTask('shellcode-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Shellcode - ${args.projectName}`,
  agent: {
    name: 'exploit-developer',
    prompt: {
      role: 'Shellcode Tester',
      task: 'Test shellcode functionality',
      context: args,
      instructions: [
        '1. Create test harness',
        '2. Test in isolated environment',
        '3. Verify functionality',
        '4. Test on target architecture',
        '5. Test with constraints applied',
        '6. Verify decoder works',
        '7. Test reliability',
        '8. Document test results'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'testResults', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        testResults: { type: 'array' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'shellcode', 'testing']
}));

export const shellcodeDocumentationTask = defineTask('shellcode-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Shellcode - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Shellcode Documentation Specialist',
      task: 'Document shellcode',
      context: args,
      instructions: [
        '1. Document purpose and functionality',
        '2. Document architecture details',
        '3. Include annotated assembly',
        '4. Document constraints handled',
        '5. Provide usage instructions',
        '6. Include test results',
        '7. Document limitations',
        '8. Create reference materials'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath', 'artifacts'],
      properties: {
        documentationPath: { type: 'string' },
        usageGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'shellcode', 'documentation']
}));

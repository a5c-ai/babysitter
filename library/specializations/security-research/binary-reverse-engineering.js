/**
 * @process specializations/security-research/binary-reverse-engineering
 * @description Systematic analysis of compiled binaries without source code access. Covers static disassembly,
 * dynamic analysis, function identification, and vulnerability discovery in closed-source software using
 * Ghidra, IDA Pro, Binary Ninja, and debugging tools.
 * @inputs { projectName: string, binaryPath: string, architecture?: string, analysisTools?: array }
 * @outputs { success: boolean, analysisReport: object, vulnerabilities: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/binary-reverse-engineering', {
 *   projectName: 'Firmware Binary Analysis',
 *   binaryPath: '/path/to/binary',
 *   architecture: 'x86_64',
 *   analysisTools: ['ghidra', 'gdb']
 * });
 *
 * @references
 * - Ghidra: https://ghidra-sre.org/
 * - IDA Pro: https://hex-rays.com/ida-pro/
 * - Binary Ninja: https://binary.ninja/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    binaryPath,
    architecture = 'auto',
    analysisTools = ['ghidra', 'gdb'],
    analysisDepth = 'comprehensive',
    outputDir = 'binary-re-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const vulnerabilities = [];

  ctx.log('info', `Starting Binary Reverse Engineering for ${projectName}`);
  ctx.log('info', `Binary: ${binaryPath}, Architecture: ${architecture}`);

  // ============================================================================
  // PHASE 1: BINARY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying binary format and architecture');

  const binaryId = await ctx.task(binaryIdentificationTask, {
    projectName,
    binaryPath,
    outputDir
  });

  artifacts.push(...binaryId.artifacts);

  // ============================================================================
  // PHASE 2: STATIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Performing initial static analysis');

  const staticAnalysis = await ctx.task(staticAnalysisTask, {
    projectName,
    binaryPath,
    binaryId,
    analysisTools,
    outputDir
  });

  artifacts.push(...staticAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: FUNCTION IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying key functions and data structures');

  const functionId = await ctx.task(functionIdentificationTask, {
    projectName,
    binaryPath,
    staticAnalysis,
    outputDir
  });

  artifacts.push(...functionId.artifacts);

  // ============================================================================
  // PHASE 4: DYNAMIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Applying dynamic analysis and debugging');

  const dynamicAnalysis = await ctx.task(dynamicAnalysisTask, {
    projectName,
    binaryPath,
    functionId,
    analysisTools,
    outputDir
  });

  artifacts.push(...dynamicAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: VULNERABILITY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying security vulnerabilities');

  const vulnId = await ctx.task(binaryVulnIdentificationTask, {
    projectName,
    staticAnalysis,
    dynamicAnalysis,
    functionId,
    outputDir
  });

  vulnerabilities.push(...vulnId.vulnerabilities);
  artifacts.push(...vulnId.artifacts);

  // ============================================================================
  // PHASE 6: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Documenting reverse engineering findings');

  const documentation = await ctx.task(reDocumentationTask, {
    projectName,
    binaryId,
    staticAnalysis,
    functionId,
    dynamicAnalysis,
    vulnerabilities,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Reverse engineering complete for ${projectName}. ${functionId.keyFunctions.length} key functions identified, ${vulnerabilities.length} vulnerabilities found. Review analysis?`,
    title: 'Binary RE Complete',
    context: {
      runId: ctx.runId,
      summary: {
        binaryFormat: binaryId.format,
        architecture: binaryId.architecture,
        functionsIdentified: functionId.totalFunctions,
        vulnerabilities: vulnerabilities.length
      },
      files: documentation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    analysisReport: {
      binaryInfo: binaryId,
      functionsAnalyzed: functionId.totalFunctions,
      reportPath: documentation.reportPath
    },
    vulnerabilities,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/binary-reverse-engineering',
      timestamp: startTime,
      analysisTools,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const binaryIdentificationTask = defineTask('binary-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Binary - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Binary Analysis Specialist',
      task: 'Identify binary format and architecture',
      context: args,
      instructions: [
        '1. Identify binary format (PE, ELF, Mach-O)',
        '2. Determine target architecture',
        '3. Check for packing or obfuscation',
        '4. Identify compiler and build info',
        '5. Extract file headers and metadata',
        '6. Identify linked libraries',
        '7. Check for debugging symbols',
        '8. Document binary characteristics'
      ],
      outputFormat: 'JSON with binary identification'
    },
    outputSchema: {
      type: 'object',
      required: ['format', 'architecture', 'packed', 'artifacts'],
      properties: {
        format: { type: 'string' },
        architecture: { type: 'string' },
        packed: { type: 'boolean' },
        compiler: { type: 'string' },
        libraries: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'reverse-engineering', 'binary-id']
}));

export const staticAnalysisTask = defineTask('static-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Static Binary Analysis - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Static Analysis Specialist',
      task: 'Perform initial static analysis of binary',
      context: args,
      instructions: [
        '1. Load binary in Ghidra/IDA',
        '2. Run auto-analysis',
        '3. Extract strings and constants',
        '4. Identify import/export tables',
        '5. Analyze code sections',
        '6. Identify data sections',
        '7. Look for security-relevant patterns',
        '8. Document initial findings'
      ],
      outputFormat: 'JSON with static analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['strings', 'imports', 'exports', 'artifacts'],
      properties: {
        strings: { type: 'array' },
        imports: { type: 'array' },
        exports: { type: 'array' },
        sections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'reverse-engineering', 'static']
}));

export const functionIdentificationTask = defineTask('function-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Functions - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Function Analysis Specialist',
      task: 'Identify key functions and data structures',
      context: args,
      instructions: [
        '1. Identify all functions',
        '2. Recognize library functions',
        '3. Identify security-critical functions',
        '4. Analyze function arguments',
        '5. Identify data structures',
        '6. Map function call graphs',
        '7. Rename and annotate functions',
        '8. Document key functions'
      ],
      outputFormat: 'JSON with function analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalFunctions', 'keyFunctions', 'artifacts'],
      properties: {
        totalFunctions: { type: 'number' },
        keyFunctions: { type: 'array' },
        dataStructures: { type: 'array' },
        callGraph: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'reverse-engineering', 'functions']
}));

export const dynamicAnalysisTask = defineTask('dynamic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dynamic Binary Analysis - ${args.projectName}`,
  agent: {
    name: 'reverse-engineer',
    prompt: {
      role: 'Dynamic Analysis Specialist',
      task: 'Apply dynamic analysis and debugging',
      context: args,
      instructions: [
        '1. Set up debugging environment',
        '2. Trace program execution',
        '3. Monitor API calls',
        '4. Analyze runtime behavior',
        '5. Capture memory state',
        '6. Monitor file/network operations',
        '7. Identify runtime checks',
        '8. Document dynamic behavior'
      ],
      outputFormat: 'JSON with dynamic analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['executionTraces', 'apiCalls', 'artifacts'],
      properties: {
        executionTraces: { type: 'array' },
        apiCalls: { type: 'array' },
        runtimeBehavior: { type: 'object' },
        memoryLayout: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'reverse-engineering', 'dynamic']
}));

export const binaryVulnIdentificationTask = defineTask('binary-vuln-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Vulnerabilities - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Binary Vulnerability Researcher',
      task: 'Identify security vulnerabilities in binary',
      context: args,
      instructions: [
        '1. Look for memory safety issues',
        '2. Identify input validation flaws',
        '3. Check for cryptographic weaknesses',
        '4. Analyze authentication logic',
        '5. Find privilege escalation paths',
        '6. Identify unsafe function usage',
        '7. Check for format string issues',
        '8. Document all vulnerabilities'
      ],
      outputFormat: 'JSON with vulnerabilities'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'totalFound', 'artifacts'],
      properties: {
        vulnerabilities: { type: 'array' },
        totalFound: { type: 'number' },
        bySeverity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'reverse-engineering', 'vulnerabilities']
}));

export const reDocumentationTask = defineTask('re-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document RE Findings - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'RE Documentation Specialist',
      task: 'Document reverse engineering findings',
      context: args,
      instructions: [
        '1. Create analysis summary',
        '2. Document binary characteristics',
        '3. Document key functions',
        '4. Include control flow diagrams',
        '5. Document vulnerabilities found',
        '6. Provide remediation guidance',
        '7. Include methodology notes',
        '8. Format as professional report'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'reverse-engineering', 'documentation']
}));

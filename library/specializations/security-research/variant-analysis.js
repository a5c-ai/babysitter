/**
 * @process specializations/security-research/variant-analysis
 * @description Systematic search for similar vulnerabilities across a codebase or related projects after
 * discovering an initial vulnerability. Uses pattern matching, CodeQL, Semgrep, and code similarity analysis
 * to find variants and incomplete fixes.
 * @inputs { projectName: string, initialVulnerability: object, codebasePath: string, tools?: array }
 * @outputs { success: boolean, variants: array, detectionQueries: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/variant-analysis', {
 *   projectName: 'XSS Variant Analysis',
 *   initialVulnerability: {
 *     type: 'xss',
 *     pattern: 'innerHTML assignment without sanitization',
 *     cweId: 'CWE-79'
 *   },
 *   codebasePath: '/path/to/codebase',
 *   tools: ['codeql', 'semgrep']
 * });
 *
 * @references
 * - CodeQL: https://codeql.github.com/
 * - Semgrep: https://semgrep.dev/
 * - Project Zero Blog: https://googleprojectzero.blogspot.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    initialVulnerability,
    codebasePath,
    tools = ['codeql', 'semgrep'],
    searchScope = 'full-codebase',
    outputDir = 'variant-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const variants = [];

  ctx.log('info', `Starting Variant Analysis for ${projectName}`);
  ctx.log('info', `Initial vulnerability: ${initialVulnerability.type}`);

  // ============================================================================
  // PHASE 1: PATTERN DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining vulnerability pattern');

  const patternDefinition = await ctx.task(patternDefinitionTask, {
    projectName,
    initialVulnerability,
    outputDir
  });

  artifacts.push(...patternDefinition.artifacts);

  // ============================================================================
  // PHASE 2: DETECTION QUERY CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating detection queries');

  const queryCreation = await ctx.task(queryCreationTask, {
    projectName,
    patternDefinition,
    tools,
    outputDir
  });

  artifacts.push(...queryCreation.artifacts);

  // ============================================================================
  // PHASE 3: CODEBASE SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Scanning codebase for variants');

  const codebaseScanning = await ctx.task(codebaseScanningTask, {
    projectName,
    codebasePath,
    queries: queryCreation.queries,
    tools,
    searchScope,
    outputDir
  });

  variants.push(...codebaseScanning.potentialVariants);
  artifacts.push(...codebaseScanning.artifacts);

  // ============================================================================
  // PHASE 4: FINDINGS VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating potential variants');

  const validation = await ctx.task(variantValidationTask, {
    projectName,
    potentialVariants: codebaseScanning.potentialVariants,
    patternDefinition,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // ============================================================================
  // PHASE 5: INCOMPLETE FIX CHECKING
  // ============================================================================

  ctx.log('info', 'Phase 5: Checking for incomplete fixes');

  const incompleteFixCheck = await ctx.task(incompleteFixCheckTask, {
    projectName,
    initialVulnerability,
    validatedVariants: validation.validatedVariants,
    codebasePath,
    outputDir
  });

  artifacts.push(...incompleteFixCheck.artifacts);

  // ============================================================================
  // PHASE 6: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Documenting all variants discovered');

  const documentation = await ctx.task(variantDocumentationTask, {
    projectName,
    initialVulnerability,
    validatedVariants: validation.validatedVariants,
    incompleteFixCheck,
    queryCreation,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Variant analysis complete. Found ${validation.validatedVariants.length} confirmed variants and ${incompleteFixCheck.incompleteFixes.length} incomplete fixes. Review findings?`,
    title: 'Variant Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        initialVulnerability: initialVulnerability.type,
        variantsFound: validation.validatedVariants.length,
        incompleteFixes: incompleteFixCheck.incompleteFixes.length,
        queriesCreated: queryCreation.queries.length
      },
      files: documentation.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    variants: validation.validatedVariants,
    incompleteFixes: incompleteFixCheck.incompleteFixes,
    detectionQueries: queryCreation.queries,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/variant-analysis',
      timestamp: startTime,
      tools,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const patternDefinitionTask = defineTask('pattern-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Vulnerability Pattern - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Vulnerability Pattern Specialist',
      task: 'Define the vulnerability pattern for variant detection',
      context: args,
      instructions: [
        '1. Analyze the initial vulnerability',
        '2. Extract core vulnerable pattern',
        '3. Identify pattern variations',
        '4. Define pattern signature',
        '5. Document data flow characteristics',
        '6. Identify source and sink patterns',
        '7. Note language-specific variations',
        '8. Create pattern documentation'
      ],
      outputFormat: 'JSON with pattern definition'
    },
    outputSchema: {
      type: 'object',
      required: ['pattern', 'signature', 'variations', 'artifacts'],
      properties: {
        pattern: { type: 'object' },
        signature: { type: 'string' },
        variations: { type: 'array' },
        sourcePatterns: { type: 'array' },
        sinkPatterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'variant-analysis', 'pattern']
}));

export const queryCreationTask = defineTask('query-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Detection Queries - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Security Query Engineer',
      task: 'Create CodeQL and Semgrep detection queries',
      context: args,
      instructions: [
        '1. Create CodeQL query for pattern detection',
        '2. Create Semgrep rules for pattern matching',
        '3. Include data flow tracking queries',
        '4. Handle pattern variations',
        '5. Optimize for precision (minimize false positives)',
        '6. Include context-specific patterns',
        '7. Test queries on known examples',
        '8. Document query usage'
      ],
      outputFormat: 'JSON with detection queries'
    },
    outputSchema: {
      type: 'object',
      required: ['queries', 'codeqlQueries', 'semgrepRules', 'artifacts'],
      properties: {
        queries: { type: 'array' },
        codeqlQueries: { type: 'array' },
        semgrepRules: { type: 'array' },
        testResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'variant-analysis', 'queries']
}));

export const codebaseScanningTask = defineTask('codebase-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scan Codebase for Variants - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Security Scanner Operator',
      task: 'Scan codebase for vulnerability variants',
      context: args,
      instructions: [
        '1. Run CodeQL queries on codebase',
        '2. Run Semgrep rules on codebase',
        '3. Collect all potential matches',
        '4. Note match locations and context',
        '5. Track query performance',
        '6. Handle large codebases efficiently',
        '7. Collect supporting evidence',
        '8. Generate scan report'
      ],
      outputFormat: 'JSON with scan results'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialVariants', 'scanStats', 'artifacts'],
      properties: {
        potentialVariants: { type: 'array' },
        scanStats: { type: 'object' },
        matchesByTool: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'variant-analysis', 'scanning']
}));

export const variantValidationTask = defineTask('variant-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Variants - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Variant Validation Analyst',
      task: 'Validate potential variants as true vulnerabilities',
      context: args,
      instructions: [
        '1. Review each potential variant',
        '2. Confirm exploitability',
        '3. Filter false positives',
        '4. Assess severity of each variant',
        '5. Document proof of vulnerability',
        '6. Compare to original vulnerability',
        '7. Categorize variants by type',
        '8. Prioritize by risk'
      ],
      outputFormat: 'JSON with validated variants'
    },
    outputSchema: {
      type: 'object',
      required: ['validatedVariants', 'falsePositives', 'artifacts'],
      properties: {
        validatedVariants: { type: 'array' },
        falsePositives: { type: 'number' },
        validationRate: { type: 'number' },
        bySeverity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'variant-analysis', 'validation']
}));

export const incompleteFixCheckTask = defineTask('incomplete-fix-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Check for Incomplete Fixes - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Security Fix Analyst',
      task: 'Check for incomplete or bypassed fixes',
      context: args,
      instructions: [
        '1. Identify prior fix attempts',
        '2. Analyze fix coverage',
        '3. Find bypass conditions',
        '4. Check for edge cases',
        '5. Identify missing validations',
        '6. Review fix effectiveness',
        '7. Document incomplete fixes',
        '8. Suggest complete remediation'
      ],
      outputFormat: 'JSON with incomplete fix analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['incompleteFixes', 'bypassConditions', 'artifacts'],
      properties: {
        incompleteFixes: { type: 'array' },
        bypassConditions: { type: 'array' },
        priorFixAttempts: { type: 'number' },
        remediationGaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'variant-analysis', 'fix-check']
}));

export const variantDocumentationTask = defineTask('variant-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Variants - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Security Documentation Specialist',
      task: 'Document all discovered variants',
      context: args,
      instructions: [
        '1. Create comprehensive variant report',
        '2. Document each variant with details',
        '3. Include detection queries used',
        '4. Provide remediation for each variant',
        '5. Create executive summary',
        '6. Include metrics and statistics',
        '7. Document methodology',
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
        variantCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'variant-analysis', 'documentation']
}));

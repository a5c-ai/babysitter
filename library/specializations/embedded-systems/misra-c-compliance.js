/**
 * @process specializations/embedded-systems/misra-c-compliance
 * @description MISRA C Compliance - Implementing Motor Industry Software Reliability Association C coding guidelines
 * for safety-critical embedded software, including static analysis, rule verification, and deviation documentation.
 * @inputs { projectName: string, misraVersion?: string, targetFiles?: array, deviationsAllowed?: boolean, outputDir?: string }
 * @outputs { success: boolean, compliance: object, violations: array, deviations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/misra-c-compliance', {
 *   projectName: 'SafetyController',
 *   misraVersion: 'MISRA-C:2012',
 *   targetFiles: ['src/**\/*.c'],
 *   deviationsAllowed: true
 * });
 *
 * @references
 * - MISRA C Guidelines: https://www.misra.org.uk/
 * - MISRA C Compliance: https://www.embedded.com/misra-c-compliance-testing-tools/
 * - Static Analysis: https://interrupt.memfault.com/blog/static-analysis-with-misra-c
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    misraVersion = 'MISRA-C:2012',
    targetFiles = ['src/**/*.c'],
    deviationsAllowed = true,
    ruleSeverity = 'all',
    outputDir = 'misra-compliance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MISRA C Compliance Check: ${projectName}`);
  ctx.log('info', `MISRA Version: ${misraVersion}`);

  // ============================================================================
  // PHASE 1: COMPLIANCE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting Up Compliance Environment');

  const complianceSetup = await ctx.task(misraComplianceSetupTask, {
    projectName,
    misraVersion,
    targetFiles,
    ruleSeverity,
    outputDir
  });

  artifacts.push(...complianceSetup.artifacts);

  // ============================================================================
  // PHASE 2: STATIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Running Static Analysis');

  const staticAnalysis = await ctx.task(misraStaticAnalysisTask, {
    projectName,
    misraVersion,
    complianceSetup,
    targetFiles,
    outputDir
  });

  artifacts.push(...staticAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: RULE VIOLATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing Rule Violations');

  const violationAnalysis = await ctx.task(ruleViolationAnalysisTask, {
    projectName,
    staticAnalysis,
    misraVersion,
    outputDir
  });

  artifacts.push(...violationAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: DEVIATION HANDLING
  // ============================================================================

  let deviationHandling = null;
  if (deviationsAllowed && violationAnalysis.deviationCandidates.length > 0) {
    ctx.log('info', 'Phase 4: Processing Deviations');

    deviationHandling = await ctx.task(deviationHandlingTask, {
      projectName,
      violationAnalysis,
      misraVersion,
      outputDir
    });

    artifacts.push(...deviationHandling.artifacts);
  }

  // ============================================================================
  // PHASE 5: CODE REMEDIATION GUIDANCE
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating Remediation Guidance');

  const remediationGuidance = await ctx.task(misraRemediationTask, {
    projectName,
    violationAnalysis,
    deviationHandling,
    outputDir
  });

  artifacts.push(...remediationGuidance.artifacts);

  // ============================================================================
  // PHASE 6: COMPLIANCE MATRIX
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating Compliance Matrix');

  const complianceMatrix = await ctx.task(complianceMatrixTask, {
    projectName,
    misraVersion,
    violationAnalysis,
    deviationHandling,
    outputDir
  });

  artifacts.push(...complianceMatrix.artifacts);

  // ============================================================================
  // PHASE 7: COMPLIANCE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Compliance Report');

  const complianceReport = await ctx.task(misraComplianceReportTask, {
    projectName,
    misraVersion,
    staticAnalysis,
    violationAnalysis,
    deviationHandling,
    complianceMatrix,
    remediationGuidance,
    outputDir
  });

  artifacts.push(...complianceReport.artifacts);

  const totalViolations = violationAnalysis.violations.length;
  const deviations = deviationHandling?.approvedDeviations?.length || 0;
  const remainingViolations = totalViolations - deviations;

  // Final Breakpoint
  await ctx.breakpoint({
    question: `MISRA C Compliance Check Complete for ${projectName}. Violations: ${remainingViolations}, Deviations: ${deviations}. Compliance: ${complianceMatrix.complianceLevel}. Review?`,
    title: 'MISRA Compliance Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalViolations,
        deviations,
        remainingViolations,
        complianceLevel: complianceMatrix.complianceLevel
      },
      files: [
        { path: complianceReport.reportPath, format: 'markdown', label: 'Compliance Report' },
        { path: complianceMatrix.matrixPath, format: 'csv', label: 'Compliance Matrix' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: remainingViolations === 0 || complianceMatrix.complianceLevel !== 'non-compliant',
    projectName,
    compliance: {
      level: complianceMatrix.complianceLevel,
      rulesChecked: complianceMatrix.rulesChecked,
      rulesPassed: complianceMatrix.rulesPassed,
      percentage: complianceMatrix.compliancePercentage
    },
    violations: violationAnalysis.violations,
    deviations: deviationHandling?.approvedDeviations || [],
    remediation: remediationGuidance.guidance,
    reportPath: complianceReport.reportPath,
    matrixPath: complianceMatrix.matrixPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/misra-c-compliance',
      timestamp: startTime,
      projectName,
      misraVersion,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const misraComplianceSetupTask = defineTask('misra-compliance-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Compliance Setup - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Safety Compliance Engineer',
      task: 'Set up MISRA compliance environment',
      context: args,
      instructions: [
        '1. Configure static analyzer',
        '2. Set MISRA version rules',
        '3. Configure rule categories',
        '4. Set mandatory rules',
        '5. Set required rules',
        '6. Set advisory rules',
        '7. Configure file filters',
        '8. Set up reporting',
        '9. Create baseline',
        '10. Document setup'
      ],
      outputFormat: 'JSON with compliance setup'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'rulesEnabled', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        rulesEnabled: { type: 'number' },
        categories: { type: 'object' },
        analyzerConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'misra', 'setup']
}));

export const misraStaticAnalysisTask = defineTask('misra-static-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Static Analysis - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Safety Compliance Engineer',
      task: 'Run MISRA static analysis',
      context: args,
      instructions: [
        '1. Run static analyzer',
        '2. Check mandatory rules',
        '3. Check required rules',
        '4. Check advisory rules',
        '5. Collect warnings',
        '6. Categorize findings',
        '7. Map to source files',
        '8. Calculate metrics',
        '9. Export results',
        '10. Document analysis'
      ],
      outputFormat: 'JSON with analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'filesAnalyzed', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        filesAnalyzed: { type: 'number' },
        linesAnalyzed: { type: 'number' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'misra', 'analysis']
}));

export const ruleViolationAnalysisTask = defineTask('rule-violation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Violation Analysis - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Safety Compliance Engineer',
      task: 'Analyze rule violations',
      context: args,
      instructions: [
        '1. Categorize violations',
        '2. Identify severity',
        '3. Map to rules',
        '4. Identify patterns',
        '5. Find root causes',
        '6. Identify deviation candidates',
        '7. Calculate impact',
        '8. Prioritize fixes',
        '9. Group by file',
        '10. Document analysis'
      ],
      outputFormat: 'JSON with violation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['violations', 'deviationCandidates', 'artifacts'],
      properties: {
        violations: { type: 'array', items: { type: 'object' } },
        deviationCandidates: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'object' } },
        rootCauses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'misra', 'violations']
}));

export const deviationHandlingTask = defineTask('deviation-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Deviation Handling - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Safety Compliance Engineer',
      task: 'Handle MISRA deviations',
      context: args,
      instructions: [
        '1. Review deviation candidates',
        '2. Assess justification',
        '3. Document rationale',
        '4. Assess safety impact',
        '5. Create deviation records',
        '6. Assign deviation IDs',
        '7. Document mitigations',
        '8. Get approval chain',
        '9. Create deviation report',
        '10. Document process'
      ],
      outputFormat: 'JSON with deviation handling'
    },
    outputSchema: {
      type: 'object',
      required: ['approvedDeviations', 'rejectedDeviations', 'artifacts'],
      properties: {
        approvedDeviations: { type: 'array', items: { type: 'object' } },
        rejectedDeviations: { type: 'array', items: { type: 'object' } },
        deviationRecords: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'misra', 'deviations']
}));

export const misraRemediationTask = defineTask('misra-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Remediation Guidance - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Safety Compliance Engineer',
      task: 'Generate remediation guidance',
      context: args,
      instructions: [
        '1. Analyze each violation',
        '2. Provide fix guidance',
        '3. Show code examples',
        '4. Explain rule rationale',
        '5. Suggest refactoring',
        '6. Prioritize fixes',
        '7. Estimate effort',
        '8. Group related fixes',
        '9. Create fix checklist',
        '10. Document guidance'
      ],
      outputFormat: 'JSON with remediation guidance'
    },
    outputSchema: {
      type: 'object',
      required: ['guidance', 'prioritizedFixes', 'artifacts'],
      properties: {
        guidance: { type: 'array', items: { type: 'object' } },
        prioritizedFixes: { type: 'array', items: { type: 'object' } },
        codeExamples: { type: 'array', items: { type: 'object' } },
        estimatedEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'misra', 'remediation']
}));

export const complianceMatrixTask = defineTask('compliance-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Compliance Matrix - ${args.projectName}`,
  agent: {
    name: 'safety-compliance-expert',
    prompt: {
      role: 'Safety Compliance Engineer',
      task: 'Generate compliance matrix',
      context: args,
      instructions: [
        '1. List all rules',
        '2. Mark compliance status',
        '3. Note deviations',
        '4. Calculate percentages',
        '5. Categorize by severity',
        '6. Track mandatory compliance',
        '7. Track required compliance',
        '8. Track advisory compliance',
        '9. Determine overall level',
        '10. Format matrix'
      ],
      outputFormat: 'JSON with compliance matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceLevel', 'rulesChecked', 'rulesPassed', 'matrixPath', 'artifacts'],
      properties: {
        complianceLevel: { type: 'string' },
        rulesChecked: { type: 'number' },
        rulesPassed: { type: 'number' },
        compliancePercentage: { type: 'string' },
        matrixPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'misra', 'matrix']
}));

export const misraComplianceReportTask = defineTask('misra-compliance-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Compliance Report - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate MISRA compliance report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document methodology',
        '3. Present findings',
        '4. Include compliance matrix',
        '5. Document deviations',
        '6. Include remediation plan',
        '7. Add appendices',
        '8. Include tool info',
        '9. Add sign-off section',
        '10. Format report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'misra', 'reporting']
}));

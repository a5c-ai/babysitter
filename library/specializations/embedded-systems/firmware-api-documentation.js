/**
 * @process specializations/embedded-systems/firmware-api-documentation
 * @description Firmware API Documentation - Generating comprehensive API documentation for firmware modules including
 * function descriptions, parameter specifications, usage examples, and integration guides using tools like Doxygen.
 * @inputs { projectName: string, sourceDirectories?: array, documentationTool?: string, outputFormat?: string, outputDir?: string }
 * @outputs { success: boolean, documentation: object, apiCoverage: object, generatedArtifacts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/firmware-api-documentation', {
 *   projectName: 'FirmwareSDK',
 *   sourceDirectories: ['src/drivers', 'src/hal', 'src/lib'],
 *   documentationTool: 'doxygen',
 *   outputFormat: 'html'
 * });
 *
 * @references
 * - Doxygen Guide: https://www.doxygen.nl/manual/
 * - API Documentation Best Practices: https://embeddedartistry.com/blog/2018/04/09/documenting-your-embedded-c-api/
 * - Code Comments: https://interrupt.memfault.com/blog/better-firmware-documentation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sourceDirectories = ['src'],
    documentationTool = 'doxygen',
    outputFormat = 'html',
    includeExamples = true,
    generatePdf = false,
    outputDir = 'firmware-api-docs-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Firmware API Documentation: ${projectName}`);
  ctx.log('info', `Tool: ${documentationTool}, Format: ${outputFormat}`);

  // ============================================================================
  // PHASE 1: SOURCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Source Code');

  const sourceAnalysis = await ctx.task(sourceAnalysisTask, {
    projectName,
    sourceDirectories,
    outputDir
  });

  artifacts.push(...sourceAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: DOCUMENTATION AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 2: Auditing Existing Documentation');

  const docAudit = await ctx.task(documentationAuditTask, {
    projectName,
    sourceAnalysis,
    outputDir
  });

  artifacts.push(...docAudit.artifacts);

  await ctx.breakpoint({
    question: `Documentation audit complete. Coverage: ${docAudit.coverage}%, Missing docs: ${docAudit.undocumented.length}. Proceed with gap filling?`,
    title: 'Documentation Audit Review',
    context: {
      runId: ctx.runId,
      audit: docAudit.summary,
      files: docAudit.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: DOCUMENTATION TEMPLATE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing Documentation Templates');

  const templateDesign = await ctx.task(documentationTemplateTask, {
    projectName,
    documentationTool,
    sourceAnalysis,
    outputDir
  });

  artifacts.push(...templateDesign.artifacts);

  // ============================================================================
  // PHASE 4: API COMMENT ENHANCEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Enhancing API Comments');

  const commentEnhancement = await ctx.task(apiCommentEnhancementTask, {
    projectName,
    docAudit,
    templateDesign,
    outputDir
  });

  artifacts.push(...commentEnhancement.artifacts);

  // ============================================================================
  // PHASE 5: EXAMPLE CODE GENERATION
  // ============================================================================

  let exampleGeneration = null;
  if (includeExamples) {
    ctx.log('info', 'Phase 5: Generating Example Code');

    exampleGeneration = await ctx.task(exampleCodeGenerationTask, {
      projectName,
      sourceAnalysis,
      outputDir
    });

    artifacts.push(...exampleGeneration.artifacts);
  }

  // ============================================================================
  // PHASE 6: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating Documentation');

  const docGeneration = await ctx.task(documentationGenerationTask, {
    projectName,
    documentationTool,
    outputFormat,
    generatePdf,
    sourceDirectories,
    templateDesign,
    outputDir
  });

  artifacts.push(...docGeneration.artifacts);

  // ============================================================================
  // PHASE 7: INTEGRATION GUIDE
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating Integration Guide');

  const integrationGuide = await ctx.task(integrationGuideTask, {
    projectName,
    sourceAnalysis,
    exampleGeneration,
    outputDir
  });

  artifacts.push(...integrationGuide.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 8: Reviewing Generated Documentation');

  const docReview = await ctx.task(documentationReviewTask, {
    projectName,
    docGeneration,
    integrationGuide,
    docAudit,
    outputDir
  });

  artifacts.push(...docReview.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Firmware API Documentation Complete for ${projectName}. Coverage: ${docReview.finalCoverage}%, Quality: ${docReview.qualityScore}. Review?`,
    title: 'API Documentation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        modulesDocumented: sourceAnalysis.moduleCount,
        functionsDocumented: docReview.documentedFunctions,
        coverage: docReview.finalCoverage,
        qualityScore: docReview.qualityScore
      },
      files: [
        { path: docGeneration.outputPath, format: outputFormat, label: 'API Documentation' },
        { path: integrationGuide.guidePath, format: 'markdown', label: 'Integration Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    documentation: {
      outputPath: docGeneration.outputPath,
      format: outputFormat,
      tool: documentationTool,
      integrationGuide: integrationGuide.guidePath
    },
    apiCoverage: {
      modules: sourceAnalysis.moduleCount,
      functions: docReview.documentedFunctions,
      coverage: docReview.finalCoverage,
      quality: docReview.qualityScore
    },
    generatedArtifacts: docGeneration.generatedFiles,
    examples: exampleGeneration?.examples || [],
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/firmware-api-documentation',
      timestamp: startTime,
      projectName,
      documentationTool,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const sourceAnalysisTask = defineTask('source-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Source Analysis - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze source code structure',
      context: args,
      instructions: [
        '1. Scan source directories',
        '2. Identify modules',
        '3. List public APIs',
        '4. Identify dependencies',
        '5. Map module relationships',
        '6. Categorize functions',
        '7. Identify data structures',
        '8. Find callbacks/hooks',
        '9. Create module hierarchy',
        '10. Document analysis'
      ],
      outputFormat: 'JSON with source analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'moduleCount', 'publicApis', 'artifacts'],
      properties: {
        modules: { type: 'array', items: { type: 'object' } },
        moduleCount: { type: 'number' },
        publicApis: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'api-docs', 'analysis']
}));

export const documentationAuditTask = defineTask('documentation-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Documentation Audit - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Audit existing documentation',
      context: args,
      instructions: [
        '1. Check function comments',
        '2. Verify parameter docs',
        '3. Check return value docs',
        '4. Verify struct docs',
        '5. Check enum docs',
        '6. Assess completeness',
        '7. Check consistency',
        '8. Identify gaps',
        '9. Calculate coverage',
        '10. Document audit results'
      ],
      outputFormat: 'JSON with audit results'
    },
    outputSchema: {
      type: 'object',
      required: ['coverage', 'undocumented', 'summary', 'artifacts'],
      properties: {
        coverage: { type: 'string' },
        undocumented: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'api-docs', 'audit']
}));

export const documentationTemplateTask = defineTask('documentation-template', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Documentation Templates - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Design documentation templates',
      context: args,
      instructions: [
        '1. Create function template',
        '2. Create struct template',
        '3. Create enum template',
        '4. Create module template',
        '5. Define comment style',
        '6. Create example template',
        '7. Define grouping',
        '8. Create main page',
        '9. Configure Doxygen',
        '10. Document templates'
      ],
      outputFormat: 'JSON with templates'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'doxygenConfig', 'artifacts'],
      properties: {
        templates: { type: 'object' },
        doxygenConfig: { type: 'object' },
        commentStyle: { type: 'object' },
        mainPageTemplate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'api-docs', 'templates']
}));

export const apiCommentEnhancementTask = defineTask('api-comment-enhancement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Comment Enhancement - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Enhance API comments',
      context: args,
      instructions: [
        '1. Add missing function docs',
        '2. Add parameter descriptions',
        '3. Document return values',
        '4. Add preconditions',
        '5. Add postconditions',
        '6. Document side effects',
        '7. Add thread safety notes',
        '8. Add usage notes',
        '9. Add see-also refs',
        '10. Verify consistency'
      ],
      outputFormat: 'JSON with enhancements'
    },
    outputSchema: {
      type: 'object',
      required: ['enhancements', 'newCoverage', 'artifacts'],
      properties: {
        enhancements: { type: 'array', items: { type: 'object' } },
        newCoverage: { type: 'string' },
        modifiedFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'api-docs', 'comments']
}));

export const exampleCodeGenerationTask = defineTask('example-code-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Example Generation - ${args.projectName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Generate example code',
      context: args,
      instructions: [
        '1. Identify key APIs',
        '2. Create basic examples',
        '3. Create advanced examples',
        '4. Add error handling',
        '5. Show typical usage',
        '6. Create integration examples',
        '7. Add inline comments',
        '8. Verify compilation',
        '9. Add to documentation',
        '10. Document examples'
      ],
      outputFormat: 'JSON with examples'
    },
    outputSchema: {
      type: 'object',
      required: ['examples', 'exampleCount', 'artifacts'],
      properties: {
        examples: { type: 'array', items: { type: 'object' } },
        exampleCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'api-docs', 'examples']
}));

export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Doc Generation - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate documentation',
      context: args,
      instructions: [
        '1. Configure Doxygen',
        '2. Run documentation tool',
        '3. Generate HTML output',
        '4. Generate PDF if needed',
        '5. Create navigation',
        '6. Add search index',
        '7. Include diagrams',
        '8. Verify output',
        '9. Fix warnings',
        '10. Package output'
      ],
      outputFormat: 'JSON with generation results'
    },
    outputSchema: {
      type: 'object',
      required: ['outputPath', 'generatedFiles', 'artifacts'],
      properties: {
        outputPath: { type: 'string' },
        generatedFiles: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        pdfPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'api-docs', 'generation']
}));

export const integrationGuideTask = defineTask('integration-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Integration Guide - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Create integration guide',
      context: args,
      instructions: [
        '1. Create getting started',
        '2. Document prerequisites',
        '3. Add installation steps',
        '4. Create quick start',
        '5. Document configuration',
        '6. Add troubleshooting',
        '7. Include best practices',
        '8. Add migration guide',
        '9. Document FAQ',
        '10. Format guide'
      ],
      outputFormat: 'JSON with integration guide'
    },
    outputSchema: {
      type: 'object',
      required: ['guidePath', 'sections', 'artifacts'],
      properties: {
        guidePath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        quickStart: { type: 'string' },
        troubleshooting: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'api-docs', 'integration']
}));

export const documentationReviewTask = defineTask('documentation-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation Review - ${args.projectName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Review generated documentation',
      context: args,
      instructions: [
        '1. Verify completeness',
        '2. Check accuracy',
        '3. Verify examples',
        '4. Check navigation',
        '5. Verify links',
        '6. Assess readability',
        '7. Check formatting',
        '8. Calculate coverage',
        '9. Score quality',
        '10. Document review'
      ],
      outputFormat: 'JSON with review results'
    },
    outputSchema: {
      type: 'object',
      required: ['finalCoverage', 'qualityScore', 'documentedFunctions', 'artifacts'],
      properties: {
        finalCoverage: { type: 'string' },
        qualityScore: { type: 'string' },
        documentedFunctions: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'api-docs', 'review']
}));

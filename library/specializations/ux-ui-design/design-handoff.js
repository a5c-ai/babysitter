/**
 * @process specializations/ux-ui-design/design-handoff
 * @description Design Handoff to Development - Comprehensive process for handing off design work to development teams
 * with design annotation, developer documentation, asset export, component specifications, interaction specs, design tokens,
 * handoff meetings, and QA criteria. Ensures seamless design-to-development transition with clarity and completeness.
 * @inputs { projectName: string, designFiles: array, platform: string, outputDir?: string, includePrototype?: boolean, technology?: string }
 * @outputs { success: boolean, handoffPackage: object, documentation: object, assets: object, specifications: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/design-handoff', {
 *   projectName: 'Mobile Banking App Redesign',
 *   designFiles: ['figma://file/abc123', 'sketch://file/xyz789'],
 *   platform: 'mobile',
 *   technology: 'react-native',
 *   includePrototype: true,
 *   targetDevelopers: ['frontend-team', 'mobile-team'],
 *   outputDir: 'design-handoff-output'
 * });
 *
 * @references
 * - Design Handoff Best Practices: https://www.figma.com/best-practices/design-handoff/
 * - Zeplin Handoff Guide: https://support.zeplin.io/
 * - InVision Inspect: https://www.invisionapp.com/inside-design/design-handoff/
 * - Material Design Handoff: https://material.io/design/communication/design-handoff.html
 * - Design Tokens W3C: https://www.w3.org/community/design-tokens/
 * - Component Driven Development: https://www.componentdriven.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    designFiles = [],
    platform = 'web',
    technology = 'react',
    targetDevelopers = [],
    includePrototype = true,
    includeRedlines = true,
    includeAccessibilitySpecs = true,
    outputDir = 'design-handoff-output',
    designToolUrl = '',
    repositoryUrl = ''
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let handoffPackage = {};
  let documentation = {};
  let assets = {};
  let specifications = {};

  ctx.log('info', `Starting Design Handoff to Development: ${projectName}`);
  ctx.log('info', `Platform: ${platform}, Technology: ${technology}`);

  // ============================================================================
  // PHASE 1: DESIGN READINESS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing design readiness for handoff');

  const readinessAssessment = await ctx.task(designReadinessAssessmentTask, {
    projectName,
    designFiles,
    platform,
    technology,
    includePrototype,
    outputDir
  });

  artifacts.push(...readinessAssessment.artifacts);

  // Quality Gate: Design readiness check
  if (readinessAssessment.readinessScore < 70) {
    await ctx.breakpoint({
      question: `Design readiness score: ${readinessAssessment.readinessScore}/100. Below recommended threshold of 70. ${readinessAssessment.blockers.length} blocking issues found. Review and resolve issues before proceeding?`,
      title: 'Design Readiness Gate',
      context: {
        runId: ctx.runId,
        readinessScore: readinessAssessment.readinessScore,
        blockers: readinessAssessment.blockers,
        warnings: readinessAssessment.warnings,
        recommendations: readinessAssessment.recommendations,
        files: readinessAssessment.artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          label: a.label
        }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: DESIGN ANNOTATION AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Annotating designs with developer notes');

  const designAnnotation = await ctx.task(designAnnotationTask, {
    projectName,
    designFiles,
    platform,
    technology,
    readinessAssessment,
    includeRedlines,
    outputDir
  });

  artifacts.push(...designAnnotation.artifacts);

  ctx.log('info', `Design annotation complete: ${designAnnotation.annotatedScreensCount} screens annotated`);

  // ============================================================================
  // PHASE 3: COMPONENT SPECIFICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating detailed component specifications');

  const componentSpecs = await ctx.task(componentSpecificationsTask, {
    projectName,
    designFiles,
    platform,
    technology,
    designAnnotation,
    outputDir
  });

  artifacts.push(...componentSpecs.artifacts);
  specifications = componentSpecs.specifications;

  ctx.log('info', `Component specifications created: ${componentSpecs.componentCount} components documented`);

  // ============================================================================
  // PHASE 4: INTERACTION AND ANIMATION SPECIFICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Documenting interactions and animations');

  const interactionSpecs = await ctx.task(interactionSpecificationsTask, {
    projectName,
    designFiles,
    platform,
    technology,
    componentSpecs,
    includePrototype,
    outputDir
  });

  artifacts.push(...interactionSpecs.artifacts);

  ctx.log('info', `Interaction specs documented: ${interactionSpecs.interactionCount} interactions, ${interactionSpecs.animationCount} animations`);

  // ============================================================================
  // PHASE 5: RESPONSIVE BEHAVIOR SPECIFICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Defining responsive behavior and breakpoints');

  const responsiveSpecs = await ctx.task(responsiveSpecificationsTask, {
    projectName,
    designFiles,
    platform,
    componentSpecs,
    outputDir
  });

  artifacts.push(...responsiveSpecs.artifacts);

  // ============================================================================
  // PHASE 6: DESIGN TOKENS EXPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Extracting and exporting design tokens');

  const designTokens = await ctx.task(designTokensExportTask, {
    projectName,
    designFiles,
    platform,
    technology,
    outputDir
  });

  artifacts.push(...designTokens.artifacts);

  ctx.log('info', `Design tokens exported: ${designTokens.tokenCount} tokens in ${designTokens.categories.length} categories`);

  // ============================================================================
  // PHASE 7: ASSET EXPORT AND OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Exporting and optimizing design assets');

  const assetExport = await ctx.task(assetExportTask, {
    projectName,
    designFiles,
    platform,
    technology,
    componentSpecs,
    outputDir
  });

  artifacts.push(...assetExport.artifacts);
  assets = assetExport.assets;

  ctx.log('info', `Assets exported: ${assetExport.totalAssets} assets (${assetExport.iconsCount} icons, ${assetExport.imagesCount} images)`);

  // Breakpoint: Review exported assets
  await ctx.breakpoint({
    question: `Asset export complete. ${assetExport.totalAssets} assets exported and optimized. Total size: ${assetExport.totalSize}. Review asset quality and optimization?`,
    title: 'Asset Export Review',
    context: {
      runId: ctx.runId,
      assetsSummary: {
        totalAssets: assetExport.totalAssets,
        iconsCount: assetExport.iconsCount,
        imagesCount: assetExport.imagesCount,
        totalSize: assetExport.totalSize,
        formats: assetExport.formats,
        optimizationScore: assetExport.optimizationScore
      },
      files: assetExport.artifacts.slice(0, 5).map(a => ({
        path: a.path,
        format: a.format,
        label: a.label
      }))
    }
  });

  // ============================================================================
  // PHASE 8: ACCESSIBILITY SPECIFICATIONS
  // ============================================================================

  let accessibilitySpecs = null;
  if (includeAccessibilitySpecs) {
    ctx.log('info', 'Phase 8: Creating accessibility specifications');

    accessibilitySpecs = await ctx.task(accessibilitySpecificationsTask, {
      projectName,
      designFiles,
      componentSpecs,
      platform,
      outputDir
    });

    artifacts.push(...accessibilitySpecs.artifacts);

    ctx.log('info', `Accessibility specs documented: ${accessibilitySpecs.componentsWithA11y} components with a11y requirements`);
  }

  // ============================================================================
  // PHASE 9: DEVELOPER DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive developer documentation');

  const developerDocs = await ctx.task(developerDocumentationTask, {
    projectName,
    platform,
    technology,
    componentSpecs,
    interactionSpecs,
    responsiveSpecs,
    designTokens,
    accessibilitySpecs,
    designToolUrl,
    repositoryUrl,
    outputDir
  });

  artifacts.push(...developerDocs.artifacts);
  documentation = developerDocs.documentation;

  // ============================================================================
  // PHASE 10: CODE SNIPPETS AND EXAMPLES
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating code snippets and implementation examples');

  const codeSnippets = await ctx.task(codeSnippetsGenerationTask, {
    projectName,
    technology,
    componentSpecs,
    designTokens,
    platform,
    outputDir
  });

  artifacts.push(...codeSnippets.artifacts);

  ctx.log('info', `Code snippets generated: ${codeSnippets.snippetCount} snippets for ${codeSnippets.componentCount} components`);

  // ============================================================================
  // PHASE 11: PROTOTYPE AND INTERACTION DEMO
  // ============================================================================

  let prototypeDemo = null;
  if (includePrototype) {
    ctx.log('info', 'Phase 11: Preparing interactive prototype and demos');

    prototypeDemo = await ctx.task(prototypeDemoPreparationTask, {
      projectName,
      designFiles,
      interactionSpecs,
      platform,
      outputDir
    });

    artifacts.push(...prototypeDemo.artifacts);
  }

  // ============================================================================
  // PHASE 12: QA CRITERIA AND ACCEPTANCE TESTS
  // ============================================================================

  ctx.log('info', 'Phase 12: Defining QA criteria and acceptance tests');

  const qaCriteria = await ctx.task(qaCriteriaDefinitionTask, {
    projectName,
    componentSpecs,
    interactionSpecs,
    responsiveSpecs,
    accessibilitySpecs,
    platform,
    outputDir
  });

  artifacts.push(...qaCriteria.artifacts);

  ctx.log('info', `QA criteria defined: ${qaCriteria.testCaseCount} test cases across ${qaCriteria.testCategories.length} categories`);

  // ============================================================================
  // PHASE 13: HANDOFF PACKAGE ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 13: Assembling complete handoff package');

  const handoffAssembly = await ctx.task(handoffPackageAssemblyTask, {
    projectName,
    designAnnotation,
    componentSpecs,
    interactionSpecs,
    responsiveSpecs,
    designTokens,
    assetExport,
    accessibilitySpecs,
    developerDocs,
    codeSnippets,
    prototypeDemo,
    qaCriteria,
    outputDir
  });

  artifacts.push(...handoffAssembly.artifacts);
  handoffPackage = handoffAssembly.handoffPackage;

  // ============================================================================
  // PHASE 14: HANDOFF MEETING PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Preparing handoff meeting materials');

  const meetingPrep = await ctx.task(handoffMeetingPreparationTask, {
    projectName,
    handoffPackage,
    targetDevelopers,
    componentSpecs,
    interactionSpecs,
    qaCriteria,
    outputDir
  });

  artifacts.push(...meetingPrep.artifacts);

  // Breakpoint: Review handoff materials before meeting
  await ctx.breakpoint({
    question: `Handoff package assembled. ${componentSpecs.componentCount} components, ${interactionSpecs.interactionCount} interactions, ${assetExport.totalAssets} assets, ${qaCriteria.testCaseCount} test cases. Ready for handoff meeting?`,
    title: 'Handoff Package Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        platform,
        technology,
        componentsCount: componentSpecs.componentCount,
        interactionsCount: interactionSpecs.interactionCount,
        assetsCount: assetExport.totalAssets,
        testCasesCount: qaCriteria.testCaseCount,
        documentationPages: developerDocs.pageCount,
        codeSnippets: codeSnippets.snippetCount
      },
      packageDetails: {
        designTokens: designTokens.tokenCount,
        annotatedScreens: designAnnotation.annotatedScreensCount,
        accessibilitySpecs: accessibilitySpecs?.componentsWithA11y || 0,
        prototypeIncluded: includePrototype
      },
      files: [
        { path: handoffAssembly.packageIndexPath, format: 'markdown', label: 'Handoff Package Index' },
        { path: developerDocs.mainDocPath, format: 'markdown', label: 'Developer Documentation' },
        { path: meetingPrep.presentationPath, format: 'link', label: 'Handoff Presentation' },
        { path: qaCriteria.testPlanPath, format: 'markdown', label: 'QA Test Plan' }
      ]
    }
  });

  // ============================================================================
  // PHASE 15: HANDOFF EXECUTION AND Q&A
  // ============================================================================

  ctx.log('info', 'Phase 15: Conducting handoff meeting and Q&A');

  const handoffExecution = await ctx.task(handoffExecutionTask, {
    projectName,
    handoffPackage,
    meetingPrep,
    targetDevelopers,
    componentSpecs,
    outputDir
  });

  artifacts.push(...handoffExecution.artifacts);

  // ============================================================================
  // PHASE 16: IMPLEMENTATION SUPPORT PLAN
  // ============================================================================

  ctx.log('info', 'Phase 16: Creating implementation support and collaboration plan');

  const supportPlan = await ctx.task(implementationSupportPlanTask, {
    projectName,
    handoffExecution,
    targetDevelopers,
    componentSpecs,
    qaCriteria,
    outputDir
  });

  artifacts.push(...supportPlan.artifacts);

  // ============================================================================
  // PHASE 17: HANDOFF QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 17: Validating handoff completeness and quality');

  const qualityValidation = await ctx.task(handoffQualityValidationTask, {
    projectName,
    handoffPackage,
    componentSpecs,
    interactionSpecs,
    designTokens,
    assetExport,
    accessibilitySpecs,
    developerDocs,
    qaCriteria,
    handoffExecution,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const validationScore = qualityValidation.validationScore;
  const handoffReady = qualityValidation.handoffReady;

  // Final Breakpoint: Handoff approval
  await ctx.breakpoint({
    question: `Design Handoff Complete! ${projectName}: ${componentSpecs.componentCount} components, ${interactionSpecs.interactionCount} interactions, validation score: ${validationScore}/100. Handoff ready: ${handoffReady}. Approve and close handoff?`,
    title: 'Design Handoff Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        platform,
        technology,
        validationScore,
        handoffReady,
        componentsHandedOff: componentSpecs.componentCount,
        interactions: interactionSpecs.interactionCount,
        animations: interactionSpecs.animationCount,
        assets: assetExport.totalAssets,
        designTokens: designTokens.tokenCount,
        testCases: qaCriteria.testCaseCount,
        developerQuestions: handoffExecution.questionsCount,
        supportWeeks: supportPlan.supportDuration
      },
      deliverables: qualityValidation.deliverables,
      completeness: qualityValidation.completeness,
      developersReady: handoffExecution.developersReady,
      nextSteps: supportPlan.nextSteps,
      files: [
        { path: handoffAssembly.packageIndexPath, format: 'markdown', label: 'Handoff Package' },
        { path: developerDocs.mainDocPath, format: 'markdown', label: 'Developer Documentation' },
        { path: assetExport.assetManifestPath, format: 'json', label: 'Asset Manifest' },
        { path: designTokens.tokensFilePath, format: 'json', label: 'Design Tokens' },
        { path: qaCriteria.testPlanPath, format: 'markdown', label: 'QA Test Plan' },
        { path: supportPlan.supportPlanPath, format: 'markdown', label: 'Implementation Support Plan' },
        { path: qualityValidation.reportPath, format: 'markdown', label: 'Handoff Validation Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: handoffReady,
    projectName,
    platform,
    technology,
    handoffPackage: {
      packagePath: handoffAssembly.packagePath,
      indexPath: handoffAssembly.packageIndexPath,
      completeness: qualityValidation.completeness
    },
    components: {
      count: componentSpecs.componentCount,
      specifications: componentSpecs.specificationsPath,
      documented: componentSpecs.componentCount
    },
    interactions: {
      count: interactionSpecs.interactionCount,
      animations: interactionSpecs.animationCount,
      specificationsPath: interactionSpecs.specificationsPath
    },
    responsive: {
      breakpoints: responsiveSpecs.breakpointCount,
      specificationsPath: responsiveSpecs.specificationsPath
    },
    designTokens: {
      tokenCount: designTokens.tokenCount,
      categories: designTokens.categories,
      tokensFilePath: designTokens.tokensFilePath,
      platformFormats: designTokens.platformFormats
    },
    assets: {
      totalAssets: assetExport.totalAssets,
      iconsCount: assetExport.iconsCount,
      imagesCount: assetExport.imagesCount,
      totalSize: assetExport.totalSize,
      formats: assetExport.formats,
      assetManifestPath: assetExport.assetManifestPath,
      optimizationScore: assetExport.optimizationScore
    },
    accessibility: accessibilitySpecs ? {
      componentsWithA11y: accessibilitySpecs.componentsWithA11y,
      criteriaCount: accessibilitySpecs.criteriaCount,
      specificationsPath: accessibilitySpecs.specificationsPath,
      complianceLevel: accessibilitySpecs.complianceLevel
    } : null,
    documentation: {
      mainDocPath: developerDocs.mainDocPath,
      pageCount: developerDocs.pageCount,
      sectionsCount: developerDocs.sectionsCount,
      codeSnippets: codeSnippets.snippetCount
    },
    codeExamples: {
      snippetCount: codeSnippets.snippetCount,
      componentsCovered: codeSnippets.componentCount,
      technology,
      examplesPath: codeSnippets.examplesPath
    },
    prototype: prototypeDemo ? {
      prototypeUrl: prototypeDemo.prototypeUrl,
      flowsCount: prototypeDemo.flowsCount,
      interactionsEnabled: prototypeDemo.interactionsEnabled
    } : null,
    qa: {
      testCaseCount: qaCriteria.testCaseCount,
      testCategories: qaCriteria.testCategories,
      testPlanPath: qaCriteria.testPlanPath,
      acceptanceCriteria: qaCriteria.acceptanceCriteriaCount
    },
    handoffMeeting: {
      completed: handoffExecution.meetingCompleted,
      attendeesCount: handoffExecution.attendeesCount,
      questionsCount: handoffExecution.questionsCount,
      developersReady: handoffExecution.developersReady,
      meetingNotesPath: handoffExecution.meetingNotesPath
    },
    support: {
      supportDuration: supportPlan.supportDuration,
      checkpointsScheduled: supportPlan.checkpointsScheduled,
      communicationChannels: supportPlan.communicationChannels,
      supportPlanPath: supportPlan.supportPlanPath
    },
    validation: {
      validationScore,
      handoffReady,
      completeness: qualityValidation.completeness,
      missingItems: qualityValidation.missingItems,
      recommendations: qualityValidation.recommendations,
      reportPath: qualityValidation.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/design-handoff',
      timestamp: startTime,
      platform,
      technology,
      targetDevelopers: targetDevelopers.length,
      includePrototype,
      includeAccessibilitySpecs
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Design Readiness Assessment
export const designReadinessAssessmentTask = defineTask('design-readiness-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design Readiness Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Handoff Specialist',
      task: 'Assess design readiness for developer handoff',
      context: {
        projectName: args.projectName,
        designFiles: args.designFiles,
        platform: args.platform,
        technology: args.technology,
        includePrototype: args.includePrototype,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all design files for completeness',
        '2. Check that all screens and states are designed (default, hover, active, disabled, error, empty, loading)',
        '3. Verify component consistency across screens',
        '4. Check design system usage and token application',
        '5. Validate that all interactive elements are specified',
        '6. Ensure responsive designs exist for all required breakpoints',
        '7. Check for design annotations and developer notes',
        '8. Verify asset naming conventions are consistent',
        '9. Check for missing edge cases and error states',
        '10. Validate accessibility considerations (color contrast, touch targets, focus states)',
        '11. Identify blockers that prevent handoff (must be resolved)',
        '12. Identify warnings and recommendations (should be addressed)',
        '13. Calculate readiness score (0-100)',
        '14. Create readiness assessment report with findings',
        '15. Save assessment report to output directory'
      ],
      outputFormat: 'JSON object with design readiness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'blockers', 'warnings', 'recommendations', 'artifacts'],
      properties: {
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        isReady: { type: 'boolean' },
        blockers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              affectedScreens: { type: 'array' },
              recommendation: { type: 'string' }
            }
          }
        },
        warnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        completeness: {
          type: 'object',
          properties: {
            allScreensDesigned: { type: 'boolean' },
            allStatesDocumented: { type: 'boolean' },
            componentConsistency: { type: 'boolean' },
            responsiveDesigns: { type: 'boolean' },
            interactionsSpecified: { type: 'boolean' },
            assetsNamed: { type: 'boolean' },
            accessibilityConsidered: { type: 'boolean' }
          }
        },
        screensCount: { type: 'number' },
        componentsCount: { type: 'number' },
        assessmentReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'readiness-assessment', 'ux-ui-design']
}));

// Phase 2: Design Annotation
export const designAnnotationTask = defineTask('design-annotation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Design Annotation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Annotator and Technical Designer',
      task: 'Annotate designs with developer notes, measurements, and specifications',
      context: args,
      instructions: [
        '1. Add developer notes to all screens explaining layout, behavior, and logic',
        '2. Annotate component hierarchies and relationships',
        '3. Add spacing measurements (padding, margins, gaps) if redlines enabled',
        '4. Document font specifications (family, size, weight, line-height, letter-spacing)',
        '5. Specify color values with hex/RGB codes and token names',
        '6. Add notes for interactive elements (clickable areas, hover states, transitions)',
        '7. Document z-index layering and elevation',
        '8. Specify border properties (width, style, radius, color)',
        '9. Add notes for conditional logic (show/hide, enable/disable rules)',
        '10. Document data sources and dynamic content areas',
        '11. Annotate scroll behavior and overflow handling',
        '12. Add platform-specific notes (iOS vs Android, mobile vs desktop)',
        '13. Link components to design system or library',
        '14. Create annotated screen exports',
        '15. Generate annotation summary document'
      ],
      outputFormat: 'JSON with annotated designs'
    },
    outputSchema: {
      type: 'object',
      required: ['annotatedScreensCount', 'annotationsCount', 'artifacts'],
      properties: {
        annotatedScreensCount: { type: 'number' },
        annotationsCount: { type: 'number' },
        annotationTypes: {
          type: 'object',
          properties: {
            measurements: { type: 'number' },
            colors: { type: 'number' },
            typography: { type: 'number' },
            interactions: { type: 'number' },
            logic: { type: 'number' },
            platformSpecific: { type: 'number' }
          }
        },
        annotatedScreens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              screenName: { type: 'string' },
              annotationsCount: { type: 'number' },
              exportPath: { type: 'string' }
            }
          }
        },
        annotationSummaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'annotation', 'ux-ui-design']
}));

// Phase 3: Component Specifications
export const componentSpecificationsTask = defineTask('component-specifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Component Specifications - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI Component Specialist and Technical Designer',
      task: 'Create detailed component specifications for development',
      context: args,
      instructions: [
        '1. Identify and catalog all UI components in designs',
        '2. For each component, document:',
        '   - Component name and purpose',
        '   - Visual specifications (size, colors, typography, spacing)',
        '   - Variants (sizes, styles, types - e.g., primary/secondary buttons)',
        '   - States (default, hover, active, focus, disabled, loading, error)',
        '   - Props/Parameters needed for implementation',
        '   - Children/Slot content areas',
        '   - Component API and interface',
        '3. Document component composition and nesting',
        '4. Specify default values and optional vs required props',
        '5. Document data types for dynamic content',
        '6. Add usage guidelines and do/dont examples',
        '7. Link to design system components if applicable',
        '8. Document responsive behavior at component level',
        '9. Specify accessibility requirements (ARIA roles, labels, keyboard interaction)',
        '10. Create component specification documents',
        '11. Generate component inventory matrix',
        '12. Create visual component catalog'
      ],
      outputFormat: 'JSON with component specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'componentCount', 'specificationsPath', 'artifacts'],
      properties: {
        specifications: { type: 'object', description: 'Complete component specifications' },
        componentCount: { type: 'number' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              variantsCount: { type: 'number' },
              statesCount: { type: 'number' },
              propsCount: { type: 'number' },
              complexityLevel: { type: 'string', enum: ['simple', 'moderate', 'complex'] }
            }
          }
        },
        specificationsPath: { type: 'string' },
        componentInventoryPath: { type: 'string' },
        componentCatalogPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'component-specs', 'ux-ui-design']
}));

// Phase 4: Interaction Specifications
export const interactionSpecificationsTask = defineTask('interaction-specifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Interaction & Animation Specs - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interaction Designer and Animation Specialist',
      task: 'Document all interactions and animations for development',
      context: args,
      instructions: [
        '1. Document all user interactions:',
        '   - Click/Tap behaviors',
        '   - Hover effects',
        '   - Focus states',
        '   - Drag and drop',
        '   - Swipe gestures',
        '   - Scroll behaviors',
        '   - Keyboard shortcuts',
        '2. Specify animations and transitions:',
        '   - Animation type (fade, slide, scale, rotate, etc.)',
        '   - Duration (milliseconds)',
        '   - Easing function (ease-in, ease-out, linear, cubic-bezier)',
        '   - Delay and staggering',
        '   - Loop or one-time',
        '3. Document micro-interactions:',
        '   - Button press effects',
        '   - Loading indicators',
        '   - Success/error feedback',
        '   - Toast notifications',
        '   - Tooltip appearances',
        '4. Specify page transitions and navigation animations',
        '5. Document complex interaction flows (multi-step forms, wizards)',
        '6. Reference prototype for interaction examples',
        '7. Create interaction flow diagrams',
        '8. Document gesture requirements for mobile',
        '9. Specify interaction feedback (visual, haptic, audio)',
        '10. Create animation timing reference chart',
        '11. Document motion design principles used',
        '12. Generate interaction specifications document'
      ],
      outputFormat: 'JSON with interaction and animation specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['interactionCount', 'animationCount', 'specificationsPath', 'artifacts'],
      properties: {
        interactionCount: { type: 'number' },
        animationCount: { type: 'number' },
        interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              trigger: { type: 'string' },
              type: { type: 'string' },
              target: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        animations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              duration: { type: 'number' },
              easing: { type: 'string' },
              properties: { type: 'array' }
            }
          }
        },
        gesturesCount: { type: 'number' },
        microInteractionsCount: { type: 'number' },
        specificationsPath: { type: 'string' },
        flowDiagramsPath: { type: 'string' },
        timingChartPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'interaction-specs', 'ux-ui-design']
}));

// Phase 5: Responsive Specifications
export const responsiveSpecificationsTask = defineTask('responsive-specifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Responsive Behavior Specs - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Responsive Design Specialist',
      task: 'Define responsive behavior across breakpoints',
      context: args,
      instructions: [
        '1. Define breakpoints for platform:',
        '   - Mobile: 320px, 375px, 414px',
        '   - Tablet: 768px, 1024px',
        '   - Desktop: 1280px, 1440px, 1920px',
        '2. Document layout changes at each breakpoint',
        '3. Specify component behavior changes (stack, hide, reorder)',
        '4. Document font size scaling across breakpoints',
        '5. Specify spacing adjustments (padding, margins)',
        '6. Document navigation pattern changes (drawer, top nav, sidebar)',
        '7. Specify image and asset scaling behavior',
        '8. Document grid system breakdowns',
        '9. Specify touch target sizes for mobile (minimum 44x44 iOS, 48x48 Android)',
        '10. Document viewport meta tags and settings',
        '11. Create responsive behavior matrix',
        '12. Generate responsive specification document'
      ],
      outputFormat: 'JSON with responsive specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['breakpointCount', 'specificationsPath', 'artifacts'],
      properties: {
        breakpointCount: { type: 'number' },
        breakpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              minWidth: { type: 'number' },
              maxWidth: { type: 'number' },
              layoutChanges: { type: 'array' },
              componentBehaviors: { type: 'array' }
            }
          }
        },
        responsiveRules: { type: 'array', items: { type: 'string' } },
        specificationsPath: { type: 'string' },
        behaviorMatrixPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'responsive-specs', 'ux-ui-design']
}));

// Phase 6: Design Tokens Export
export const designTokensExportTask = defineTask('design-tokens-export', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Design Tokens Export - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Tokens Specialist',
      task: 'Extract and export design tokens for development',
      context: args,
      instructions: [
        '1. Extract all design tokens from design files:',
        '   - Colors (brand, semantic, component-specific)',
        '   - Typography (font families, sizes, weights, line heights, letter spacing)',
        '   - Spacing (margins, padding, gaps - base unit and scale)',
        '   - Border radius (corner rounding)',
        '   - Shadows (elevations, box shadows)',
        '   - Borders (widths, styles)',
        '   - Z-index (layering)',
        '   - Transitions (durations, easings)',
        '   - Breakpoints (viewport sizes)',
        '   - Opacity values',
        '   - Icon sizes',
        '2. Organize tokens hierarchically (primitive → semantic → component)',
        '3. Create token naming convention (BEM, kebab-case, or custom)',
        '4. Export tokens in JSON format (Style Dictionary compatible)',
        '5. Generate platform-specific formats:',
        '   - CSS/SCSS variables',
        '   - JavaScript/TypeScript constants',
        '   - iOS Swift (UIKit/SwiftUI)',
        '   - Android XML resources',
        '   - React Native JavaScript',
        '6. Create token documentation with usage examples',
        '7. Generate visual token reference guide',
        '8. Create token migration guide if updating existing system'
      ],
      outputFormat: 'JSON with design tokens export'
    },
    outputSchema: {
      type: 'object',
      required: ['tokenCount', 'categories', 'tokensFilePath', 'platformFormats', 'artifacts'],
      properties: {
        tokenCount: { type: 'number' },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Token categories (color, typography, spacing, etc.)'
        },
        tokens: {
          type: 'object',
          description: 'Complete tokens structure'
        },
        tokensFilePath: { type: 'string', description: 'Path to tokens JSON file' },
        platformFormats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              format: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        tokenDocumentationPath: { type: 'string' },
        tokenReferenceGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'design-tokens', 'ux-ui-design']
}));

// Phase 7: Asset Export
export const assetExportTask = defineTask('asset-export', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Asset Export & Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Asset Manager and Optimization Specialist',
      task: 'Export and optimize all design assets for production',
      context: args,
      instructions: [
        '1. Identify all exportable assets:',
        '   - Icons',
        '   - Images (photos, illustrations)',
        '   - Logos',
        '   - Background images',
        '   - Patterns and textures',
        '2. Export icons:',
        '   - SVG format (optimized, remove unnecessary metadata)',
        '   - Multiple sizes if needed (16px, 24px, 32px, 48px)',
        '   - Icon sprite sheet or individual files',
        '   - React/Vue icon components if applicable',
        '3. Export images:',
        '   - Multiple resolutions (@1x, @2x, @3x for mobile)',
        '   - WebP format for web (with fallbacks)',
        '   - PNG for transparency',
        '   - JPEG for photos',
        '   - AVIF for next-gen optimization',
        '4. Apply naming conventions:',
        '   - Lowercase, kebab-case or snake_case',
        '   - Descriptive names (icon-search.svg, hero-image@2x.png)',
        '   - Consistent prefixes/suffixes',
        '5. Optimize assets:',
        '   - Compress images (lossy/lossless)',
        '   - Optimize SVGs (SVGO)',
        '   - Remove unused paths and groups',
        '   - Reduce file sizes',
        '6. Organize in directory structure:',
        '   - /icons/, /images/, /logos/, etc.',
        '   - Platform-specific folders if needed',
        '7. Create asset manifest (JSON) with metadata',
        '8. Calculate total asset size and optimization savings',
        '9. Generate asset usage guide',
        '10. Create asset naming reference'
      ],
      outputFormat: 'JSON with asset export details'
    },
    outputSchema: {
      type: 'object',
      required: ['totalAssets', 'iconsCount', 'imagesCount', 'totalSize', 'formats', 'assetManifestPath', 'optimizationScore', 'artifacts'],
      properties: {
        totalAssets: { type: 'number' },
        iconsCount: { type: 'number' },
        imagesCount: { type: 'number' },
        totalSize: { type: 'string', description: 'Total size like "2.5 MB"' },
        optimizationScore: { type: 'number', minimum: 0, maximum: 100 },
        sizeBeforeOptimization: { type: 'string' },
        sizeAfterOptimization: { type: 'string' },
        formats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Asset formats exported (SVG, PNG, WebP, etc.)'
        },
        assets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' },
              size: { type: 'string' },
              path: { type: 'string' },
              resolutions: { type: 'array' }
            }
          }
        },
        assetManifestPath: { type: 'string' },
        assetUsageGuidePath: { type: 'string' },
        namingReferencePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'asset-export', 'ux-ui-design']
}));

// Phase 8: Accessibility Specifications
export const accessibilitySpecificationsTask = defineTask('accessibility-specifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Accessibility Specifications - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Specialist (a11y)',
      task: 'Create comprehensive accessibility specifications',
      context: args,
      instructions: [
        '1. For each component, document:',
        '   - ARIA roles and attributes',
        '   - Labels and descriptions',
        '   - Keyboard navigation support (Tab, Enter, Space, Arrow keys)',
        '   - Focus management and visual focus indicators',
        '   - Screen reader announcements',
        '   - Semantic HTML requirements',
        '2. Specify color contrast requirements:',
        '   - Text: minimum 4.5:1 (normal), 3:1 (large text) for WCAG AA',
        '   - Interactive elements: minimum 3:1',
        '   - Document any failing combinations and alternatives',
        '3. Document touch target sizes:',
        '   - Minimum 44x44pt (iOS), 48x48dp (Android)',
        '   - Spacing between targets',
        '4. Specify text resizing support (up to 200% without loss of functionality)',
        '5. Document alternative text for images and icons',
        '6. Specify form validation and error handling:',
        '   - Error messages',
        '   - Success feedback',
        '   - Inline validation',
        '7. Document skip links and landmark regions',
        '8. Specify focus trapping for modals and dialogs',
        '9. Document animation preferences (prefers-reduced-motion)',
        '10. Create accessibility checklist for QA',
        '11. Generate WCAG compliance matrix (A, AA, AAA)',
        '12. Create accessibility testing guide'
      ],
      outputFormat: 'JSON with accessibility specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['componentsWithA11y', 'criteriaCount', 'specificationsPath', 'complianceLevel', 'artifacts'],
      properties: {
        componentsWithA11y: { type: 'number' },
        criteriaCount: { type: 'number' },
        complianceLevel: { type: 'string', enum: ['WCAG-A', 'WCAG-AA', 'WCAG-AAA'] },
        accessibilityCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              ariaRoles: { type: 'array' },
              keyboardSupport: { type: 'array' },
              screenReaderText: { type: 'string' },
              contrastRatio: { type: 'number' },
              touchTargetSize: { type: 'string' }
            }
          }
        },
        contrastIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              foreground: { type: 'string' },
              background: { type: 'string' },
              ratio: { type: 'number' },
              required: { type: 'number' },
              passes: { type: 'boolean' }
            }
          }
        },
        specificationsPath: { type: 'string' },
        checklistPath: { type: 'string' },
        complianceMatrixPath: { type: 'string' },
        testingGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'accessibility', 'ux-ui-design']
}));

// Phase 9: Developer Documentation
export const developerDocumentationTask = defineTask('developer-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Developer Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and Developer Advocate',
      task: 'Create comprehensive developer documentation for handoff',
      context: args,
      instructions: [
        '1. Create main documentation index',
        '2. Write Getting Started guide:',
        '   - Project overview',
        '   - Technology stack',
        '   - Setup instructions',
        '   - Design tool access',
        '3. Document design system usage:',
        '   - How to use design tokens',
        '   - Component library reference',
        '   - Theming and customization',
        '4. Create component implementation guide:',
        '   - Component hierarchy',
        '   - Props and API',
        '   - Usage examples',
        '   - Best practices',
        '5. Document layout and grid system',
        '6. Create styling guide:',
        '   - CSS methodology (BEM, CSS Modules, Styled Components)',
        '   - Token usage',
        '   - Responsive patterns',
        '7. Document interaction patterns and animations',
        '8. Create accessibility implementation guide',
        '9. Document asset usage and optimization',
        '10. Create troubleshooting and FAQ section',
        '11. Add links to design files, prototypes, and resources',
        '12. Generate searchable documentation site or markdown docs',
        '13. Include code examples throughout'
      ],
      outputFormat: 'JSON with developer documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'mainDocPath', 'pageCount', 'sectionsCount', 'artifacts'],
      properties: {
        documentation: { type: 'object' },
        mainDocPath: { type: 'string' },
        pageCount: { type: 'number' },
        sectionsCount: { type: 'number' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              topics: { type: 'array' }
            }
          }
        },
        codeExamplesIncluded: { type: 'boolean' },
        searchable: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'documentation', 'ux-ui-design']
}));

// Phase 10: Code Snippets Generation
export const codeSnippetsGenerationTask = defineTask('code-snippets-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Code Snippets Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Frontend Developer and Code Generator',
      task: 'Generate implementation code snippets and examples',
      context: args,
      instructions: [
        '1. For each component, generate code snippets:',
        '   - Basic usage example',
        '   - Props/configuration examples',
        '   - Different variants',
        '   - Common patterns',
        '2. Generate styling code:',
        '   - CSS/SCSS using design tokens',
        '   - Styled-components examples',
        '   - CSS-in-JS examples',
        '   - Tailwind classes if applicable',
        '3. Generate layout examples:',
        '   - Grid layouts',
        '   - Flexbox patterns',
        '   - Responsive wrappers',
        '4. Generate animation code:',
        '   - CSS transitions',
        '   - CSS animations',
        '   - JavaScript animation hooks',
        '   - Framer Motion examples (if React)',
        '5. Generate accessibility code:',
        '   - ARIA attributes',
        '   - Keyboard handlers',
        '   - Focus management',
        '6. Generate token usage examples:',
        '   - Importing tokens',
        '   - Using in styles',
        '   - Theming examples',
        '7. Ensure code follows technology best practices',
        '8. Add code comments explaining key decisions',
        '9. Organize snippets by component and category',
        '10. Generate snippet library or documentation'
      ],
      outputFormat: 'JSON with code snippets'
    },
    outputSchema: {
      type: 'object',
      required: ['snippetCount', 'componentCount', 'examplesPath', 'artifacts'],
      properties: {
        snippetCount: { type: 'number' },
        componentCount: { type: 'number' },
        snippetsByType: {
          type: 'object',
          properties: {
            components: { type: 'number' },
            styling: { type: 'number' },
            layouts: { type: 'number' },
            animations: { type: 'number' },
            accessibility: { type: 'number' }
          }
        },
        snippets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              language: { type: 'string' },
              code: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        examplesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'code-generation', 'ux-ui-design']
}));

// Phase 11: Prototype Demo Preparation
export const prototypeDemoPreparationTask = defineTask('prototype-demo-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Prototype Demo Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Prototyping Specialist',
      task: 'Prepare interactive prototype and demos for handoff',
      context: args,
      instructions: [
        '1. Ensure prototype is up-to-date with final designs',
        '2. Set up prototype sharing permissions for developers',
        '3. Create prototype walkthrough:',
        '   - Main user flows',
        '   - Key interactions',
        '   - Edge cases',
        '4. Document prototype navigation',
        '5. Create video recordings of key flows',
        '6. Document prototype limitations vs final product',
        '7. Create prototype usage guide for developers',
        '8. Generate prototype URL and access instructions',
        '9. Create flow diagrams from prototype',
        '10. List all interactive elements in prototype'
      ],
      outputFormat: 'JSON with prototype details'
    },
    outputSchema: {
      type: 'object',
      required: ['prototypeUrl', 'flowsCount', 'interactionsEnabled', 'artifacts'],
      properties: {
        prototypeUrl: { type: 'string' },
        flowsCount: { type: 'number' },
        interactionsEnabled: { type: 'boolean' },
        accessInstructions: { type: 'string' },
        mainFlows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              screensCount: { type: 'number' },
              videoPath: { type: 'string' }
            }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        usageGuidePath: { type: 'string' },
        flowDiagramsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'prototype', 'ux-ui-design']
}));

// Phase 12: QA Criteria Definition
export const qaCriteriaDefinitionTask = defineTask('qa-criteria-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: QA Criteria & Acceptance Tests - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Specialist and Test Architect',
      task: 'Define comprehensive QA criteria and acceptance tests',
      context: args,
      instructions: [
        '1. Create visual QA criteria:',
        '   - Pixel-perfect alignment with designs',
        '   - Color accuracy',
        '   - Typography matching',
        '   - Spacing and layout accuracy',
        '2. Define functional test cases:',
        '   - User interactions work as specified',
        '   - All states render correctly',
        '   - Forms validate properly',
        '   - Navigation flows work',
        '3. Create responsive test cases:',
        '   - Layout adapts at breakpoints',
        '   - Touch targets appropriate size',
        '   - Content readable on all sizes',
        '4. Define accessibility test cases:',
        '   - Keyboard navigation works',
        '   - Screen reader support',
        '   - Color contrast passes',
        '   - ARIA attributes present',
        '5. Create performance criteria:',
        '   - Animation frame rates',
        '   - Asset load times',
        '   - Initial render time',
        '6. Define cross-browser/platform test cases',
        '7. Create edge case test scenarios',
        '8. Define acceptance criteria for each component',
        '9. Create test plan document',
        '10. Generate testing checklist'
      ],
      outputFormat: 'JSON with QA criteria and tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testCaseCount', 'testCategories', 'testPlanPath', 'acceptanceCriteriaCount', 'artifacts'],
      properties: {
        testCaseCount: { type: 'number' },
        acceptanceCriteriaCount: { type: 'number' },
        testCategories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Test categories (visual, functional, responsive, accessibility, performance)'
        },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              component: { type: 'string' },
              description: { type: 'string' },
              steps: { type: 'array' },
              expectedResult: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        acceptanceCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        testPlanPath: { type: 'string' },
        checklistPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'qa-criteria', 'ux-ui-design']
}));

// Phase 13: Handoff Package Assembly
export const handoffPackageAssemblyTask = defineTask('handoff-package-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Handoff Package Assembly - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Handoff Coordinator',
      task: 'Assemble complete handoff package with all deliverables',
      context: args,
      instructions: [
        '1. Create handoff package directory structure',
        '2. Organize all deliverables:',
        '   - /documentation/ (developer docs)',
        '   - /specifications/ (component specs, interaction specs)',
        '   - /assets/ (icons, images, organized)',
        '   - /tokens/ (design tokens in all formats)',
        '   - /code-examples/ (snippets and examples)',
        '   - /qa/ (test plans, checklists)',
        '   - /prototype/ (links and guides)',
        '3. Create package index/README:',
        '   - Project overview',
        '   - Whats included',
        '   - How to use package',
        '   - Links to all resources',
        '4. Add quick start guide',
        '5. Include version information and changelog',
        '6. Add contact information for design team',
        '7. Include links to design files and tools',
        '8. Add handoff checklist for developers',
        '9. Package for delivery (ZIP or repository)',
        '10. Generate package manifest with file listing'
      ],
      outputFormat: 'JSON with handoff package details'
    },
    outputSchema: {
      type: 'object',
      required: ['handoffPackage', 'packagePath', 'packageIndexPath', 'artifacts'],
      properties: {
        handoffPackage: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            createdDate: { type: 'string' },
            expiryDate: { type: 'string' },
            contactEmail: { type: 'string' }
          }
        },
        packagePath: { type: 'string' },
        packageIndexPath: { type: 'string' },
        packageSize: { type: 'string' },
        fileCount: { type: 'number' },
        structure: {
          type: 'object',
          properties: {
            documentation: { type: 'number' },
            specifications: { type: 'number' },
            assets: { type: 'number' },
            tokens: { type: 'number' },
            codeExamples: { type: 'number' },
            qa: { type: 'number' }
          }
        },
        packageManifestPath: { type: 'string' },
        quickStartGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'package-assembly', 'ux-ui-design']
}));

// Phase 14: Handoff Meeting Preparation
export const handoffMeetingPreparationTask = defineTask('handoff-meeting-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Handoff Meeting Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Meeting Facilitator and Presenter',
      task: 'Prepare materials for handoff meeting',
      context: args,
      instructions: [
        '1. Create handoff presentation slides:',
        '   - Project overview and goals',
        '   - Design approach and principles',
        '   - Component walkthrough',
        '   - Interaction demos',
        '   - Technical specifications highlights',
        '   - QA criteria overview',
        '   - Timeline and milestones',
        '2. Prepare live demo of prototype',
        '3. Create meeting agenda with time allocations',
        '4. Prepare Q&A anticipation document',
        '5. Create handoff checklist to review in meeting',
        '6. Prepare component priority list for phased implementation',
        '7. Create meeting invitation with:',
        '   - Attendees',
        '   - Date/time',
        '   - Agenda',
        '   - Pre-read materials',
        '8. Prepare feedback form for developers',
        '9. Create meeting notes template',
        '10. Prepare follow-up action items template'
      ],
      outputFormat: 'JSON with meeting preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['presentationPath', 'agendaPath', 'artifacts'],
      properties: {
        presentationPath: { type: 'string' },
        agendaPath: { type: 'string' },
        agenda: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              duration: { type: 'number' },
              presenter: { type: 'string' }
            }
          }
        },
        meetingDuration: { type: 'number', description: 'Minutes' },
        attendees: { type: 'array', items: { type: 'string' } },
        qaPrepPath: { type: 'string' },
        checklistPath: { type: 'string' },
        priorityListPath: { type: 'string' },
        feedbackFormPath: { type: 'string' },
        notesTemplatePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'meeting-prep', 'ux-ui-design']
}));

// Phase 15: Handoff Execution
export const handoffExecutionTask = defineTask('handoff-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Handoff Meeting Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Handoff Meeting Facilitator',
      task: 'Conduct handoff meeting and gather feedback',
      context: args,
      instructions: [
        '1. Present handoff materials following agenda',
        '2. Walk through component specifications',
        '3. Demo prototype and interactions',
        '4. Review design tokens and how to use them',
        '5. Explain responsive behavior and breakpoints',
        '6. Review accessibility requirements',
        '7. Demonstrate asset usage',
        '8. Review QA criteria and acceptance tests',
        '9. Facilitate Q&A session',
        '10. Document questions and answers',
        '11. Gather developer feedback:',
        '    - Clarity of specifications',
        '    - Completeness of documentation',
        '    - Concerns or blockers',
        '    - Estimated effort',
        '12. Confirm developer understanding and readiness',
        '13. Identify any missing information or gaps',
        '14. Create action items for follow-up',
        '15. Schedule follow-up checkpoints',
        '16. Generate meeting notes and summary'
      ],
      outputFormat: 'JSON with handoff execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['meetingCompleted', 'attendeesCount', 'questionsCount', 'developersReady', 'meetingNotesPath', 'artifacts'],
      properties: {
        meetingCompleted: { type: 'boolean' },
        meetingDate: { type: 'string' },
        attendeesCount: { type: 'number' },
        questionsCount: { type: 'number' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              askedBy: { type: 'string' },
              answer: { type: 'string' },
              followUpNeeded: { type: 'boolean' }
            }
          }
        },
        developerFeedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              developer: { type: 'string' },
              clarityScore: { type: 'number', minimum: 1, maximum: 5 },
              completenessScore: { type: 'number', minimum: 1, maximum: 5 },
              concerns: { type: 'array' },
              comments: { type: 'string' }
            }
          }
        },
        developersReady: { type: 'boolean' },
        gaps: { type: 'array', items: { type: 'string' } },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        nextCheckpointDate: { type: 'string' },
        meetingNotesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'meeting-execution', 'ux-ui-design']
}));

// Phase 16: Implementation Support Plan
export const implementationSupportPlanTask = defineTask('implementation-support-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Implementation Support Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design-Dev Collaboration Lead',
      task: 'Create ongoing implementation support and collaboration plan',
      context: args,
      instructions: [
        '1. Define support duration (typically 2-4 weeks during implementation)',
        '2. Schedule regular checkpoints:',
        '   - Weekly sync meetings',
        '   - Mid-sprint reviews',
        '   - Pre-deployment reviews',
        '3. Set up communication channels:',
        '   - Slack channel for quick questions',
        '   - Email for formal requests',
        '   - Shared document for Q&A log',
        '4. Define designer availability and response times',
        '5. Create design review process:',
        '   - When to request review',
        '   - Review checklist',
        '   - Feedback turnaround time',
        '6. Plan phased implementation approach',
        '7. Define criteria for design sign-off on implemented components',
        '8. Create escalation path for blockers',
        '9. Plan knowledge transfer sessions if needed',
        '10. Define handoff closure criteria',
        '11. Create support contact list',
        '12. Generate implementation support plan document'
      ],
      outputFormat: 'JSON with support plan'
    },
    outputSchema: {
      type: 'object',
      required: ['supportDuration', 'checkpointsScheduled', 'communicationChannels', 'supportPlanPath', 'artifacts'],
      properties: {
        supportDuration: { type: 'string', description: 'Duration like "4 weeks"' },
        checkpointsScheduled: { type: 'number' },
        checkpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              frequency: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        communicationChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              purpose: { type: 'string' },
              responseTime: { type: 'string' }
            }
          }
        },
        reviewProcess: {
          type: 'object',
          properties: {
            requestMethod: { type: 'string' },
            turnaroundTime: { type: 'string' },
            checklistPath: { type: 'string' }
          }
        },
        implementationPhases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              components: { type: 'array' },
              timeline: { type: 'string' }
            }
          }
        },
        nextSteps: { type: 'array', items: { type: 'string' } },
        supportContacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              email: { type: 'string' },
              availability: { type: 'string' }
            }
          }
        },
        supportPlanPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'support-plan', 'ux-ui-design']
}));

// Phase 17: Handoff Quality Validation
export const handoffQualityValidationTask = defineTask('handoff-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Handoff Quality Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UX Lead and Handoff Quality Auditor',
      task: 'Validate completeness and quality of design handoff',
      context: args,
      instructions: [
        '1. Validate all deliverables are present:',
        '   - Design annotations',
        '   - Component specifications',
        '   - Interaction specifications',
        '   - Responsive specifications',
        '   - Design tokens',
        '   - Exported assets',
        '   - Accessibility specifications',
        '   - Developer documentation',
        '   - Code examples',
        '   - QA test plan',
        '   - Prototype access',
        '2. Check documentation completeness (0-100 score)',
        '3. Validate asset quality and optimization',
        '4. Check token completeness and format correctness',
        '5. Validate specification clarity and detail level',
        '6. Review developer feedback from meeting',
        '7. Check for missing information or gaps',
        '8. Validate handoff meeting outcomes',
        '9. Calculate overall handoff quality score (0-100)',
        '10. Determine if handoff is ready for implementation',
        '11. Provide recommendations for improvements',
        '12. Generate validation report'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'handoffReady', 'completeness', 'deliverables', 'missingItems', 'recommendations', 'reportPath', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        handoffReady: { type: 'boolean' },
        completeness: {
          type: 'object',
          properties: {
            designAnnotations: { type: 'boolean' },
            componentSpecs: { type: 'boolean' },
            interactionSpecs: { type: 'boolean' },
            responsiveSpecs: { type: 'boolean' },
            designTokens: { type: 'boolean' },
            assets: { type: 'boolean' },
            accessibilitySpecs: { type: 'boolean' },
            documentation: { type: 'boolean' },
            codeExamples: { type: 'boolean' },
            qaTestPlan: { type: 'boolean' },
            prototype: { type: 'boolean' },
            handoffMeeting: { type: 'boolean' }
          }
        },
        deliverables: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            completed: { type: 'number' },
            missing: { type: 'number' }
          }
        },
        qualityScores: {
          type: 'object',
          properties: {
            documentationClarity: { type: 'number', minimum: 0, maximum: 100 },
            specificationDetail: { type: 'number', minimum: 0, maximum: 100 },
            assetQuality: { type: 'number', minimum: 0, maximum: 100 },
            tokenCompleteness: { type: 'number', minimum: 0, maximum: 100 },
            developerReadiness: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        missingItems: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-handoff', 'quality-validation', 'ux-ui-design']
}));

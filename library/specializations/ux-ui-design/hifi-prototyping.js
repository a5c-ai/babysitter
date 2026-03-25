/**
 * @process specializations/ux-ui-design/hifi-prototyping
 * @description Hi-Fi Prototyping and Interaction Design - Comprehensive high-fidelity prototyping workflow implementing
 * design tool setup, interaction design patterns, microinteractions, animations, transitions, user testing validation,
 * and developer handoff with detailed specifications and assets.
 * @inputs { projectName: string, projectType?: string, designTool?: string, targetPlatforms?: array, pages?: array, components?: array, interactionComplexity?: string, animationStyle?: string, designSystem?: object, userTestingRequired?: boolean }
 * @outputs { success: boolean, prototypeUrl: string, interactionsImplemented: number, animationsCreated: number, userTestingResults: object, handoffPackage: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/hifi-prototyping', {
 *   projectName: 'E-Commerce Mobile App',
 *   projectType: 'mobile-app',
 *   designTool: 'figma',
 *   targetPlatforms: ['ios', 'android'],
 *   pages: ['home', 'product-detail', 'cart', 'checkout', 'profile'],
 *   components: ['navigation', 'product-card', 'search', 'filters'],
 *   interactionComplexity: 'high',
 *   animationStyle: 'smooth',
 *   designSystem: { name: 'Material Design', version: '3.0' },
 *   userTestingRequired: true,
 *   testingParticipants: 8,
 *   handoffFormat: 'developer-friendly'
 * });
 *
 * @references
 * - Figma Prototyping: https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma
 * - ProtoPie: https://www.protopie.io/
 * - Framer Motion: https://www.framer.com/motion/
 * - Principle: https://principleformac.com/
 * - Material Design Motion: https://m3.material.io/styles/motion/overview
 * - iOS Human Interface Guidelines - Motion: https://developer.apple.com/design/human-interface-guidelines/motion
 * - Interaction Design Foundation: https://www.interaction-design.org/
 * - Lottie Animations: https://lottiefiles.com/
 * - Design Handoff Best Practices: https://www.figma.com/best-practices/developer-handoff/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    projectType = 'web-app', // 'web-app', 'mobile-app', 'desktop-app', 'responsive'
    designTool = 'figma', // 'figma', 'sketch', 'adobe-xd', 'framer', 'protopie'
    targetPlatforms = ['web'],
    pages = [],
    components = [],
    interactionComplexity = 'medium', // 'low', 'medium', 'high', 'advanced'
    animationStyle = 'subtle', // 'none', 'subtle', 'smooth', 'playful', 'dramatic'
    designSystem = null,
    brandGuidelines = null,
    userTestingRequired = true,
    testingParticipants = 5,
    testingScenarios = [],
    handoffFormat = 'developer-friendly', // 'developer-friendly', 'comprehensive', 'minimal'
    includeSpecifications = true,
    includeAssets = true,
    includeCode = false,
    outputDir = 'hifi-prototype-output',
    interactionPatterns = {
      gestures: true, // swipe, pinch, drag
      transitions: true,
      microinteractions: true,
      loading: true,
      feedback: true,
      animations: true
    },
    accessibilityValidation = true,
    devicePreview = true,
    collaborationMode = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let interactionsImplemented = 0;
  let animationsCreated = 0;
  let prototypeUrl = '';
  let userTestingResults = null;

  ctx.log('info', `Starting Hi-Fi Prototyping: ${projectName}`);
  ctx.log('info', `Design Tool: ${designTool}, Platform(s): ${targetPlatforms.join(', ')}, Complexity: ${interactionComplexity}`);
  ctx.log('info', `Pages: ${pages.length}, Components: ${components.length}`);

  // ============================================================================
  // PHASE 1: PROTOTYPE STRATEGY AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning hi-fi prototype strategy');

  const strategyPlanning = await ctx.task(prototypeStrategyTask, {
    projectName,
    projectType,
    designTool,
    targetPlatforms,
    pages,
    components,
    interactionComplexity,
    animationStyle,
    designSystem,
    brandGuidelines,
    interactionPatterns,
    userTestingRequired,
    handoffFormat,
    outputDir
  });

  if (!strategyPlanning.success) {
    return {
      success: false,
      error: 'Prototype strategy planning failed',
      details: strategyPlanning,
      metadata: {
        processId: 'specializations/ux-ui-design/hifi-prototyping',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...strategyPlanning.artifacts);

  // Quality Gate: Strategy review
  await ctx.breakpoint({
    question: `Hi-Fi Prototype strategy planned. ${strategyPlanning.totalScreens} screens, ${strategyPlanning.totalInteractions} interactions planned across ${targetPlatforms.length} platform(s). Design tool: ${designTool}. Review and approve strategy?`,
    title: 'Prototype Strategy Review',
    context: {
      runId: ctx.runId,
      strategy: {
        designTool,
        projectType,
        totalScreens: strategyPlanning.totalScreens,
        totalInteractions: strategyPlanning.totalInteractions,
        interactionComplexity,
        animationStyle,
        estimatedDuration: strategyPlanning.estimatedDuration
      },
      scope: {
        pages: pages.length,
        components: components.length,
        platforms: targetPlatforms,
        userTestingRequired
      },
      files: strategyPlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: DESIGN TOOL SETUP AND CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up design tool and workspace');

  const toolSetup = await ctx.task(designToolSetupTask, {
    projectName,
    designTool,
    projectType,
    targetPlatforms,
    designSystem,
    brandGuidelines,
    collaborationMode,
    devicePreview,
    outputDir
  });

  if (!toolSetup.success) {
    return {
      success: false,
      error: 'Design tool setup failed',
      details: toolSetup,
      metadata: {
        processId: 'specializations/ux-ui-design/hifi-prototyping',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...toolSetup.artifacts);
  prototypeUrl = toolSetup.projectUrl;

  ctx.log('info', `Design tool configured: ${designTool}, Project URL: ${prototypeUrl}`);

  // ============================================================================
  // PHASE 3: DESIGN SYSTEM AND COMPONENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up design system and components');

  const designSystemSetup = await ctx.task(designSystemSetupTask, {
    projectName,
    designTool,
    designSystem,
    brandGuidelines,
    components,
    targetPlatforms,
    projectUrl: prototypeUrl,
    outputDir
  });

  artifacts.push(...designSystemSetup.artifacts);

  ctx.log('info', `Design system configured: ${designSystemSetup.componentsCreated} components, ${designSystemSetup.tokensCreated} design tokens`);

  // ============================================================================
  // PHASE 4: HIGH-FIDELITY SCREEN DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating high-fidelity screen designs');

  const screenDesignResults = [];

  for (const page of pages) {
    ctx.log('info', `Designing high-fidelity screens for: ${page}`);

    const screenDesign = await ctx.task(screenDesignTask, {
      projectName,
      page,
      projectType,
      targetPlatforms,
      designTool,
      designSystem: designSystemSetup.designSystemReference,
      components: designSystemSetup.components,
      brandGuidelines,
      projectUrl: prototypeUrl,
      outputDir
    });

    screenDesignResults.push({
      page,
      result: screenDesign,
      screensCreated: screenDesign.screensCreated,
      variantsCreated: screenDesign.variantsCreated
    });

    artifacts.push(...screenDesign.artifacts);

    ctx.log('info', `Page ${page}: ${screenDesign.screensCreated} screen(s) created with ${screenDesign.variantsCreated} variant(s)`);
  }

  const totalScreensCreated = screenDesignResults.reduce((sum, r) => sum + r.screensCreated, 0);

  // Quality Gate: Screen design review
  await ctx.breakpoint({
    question: `${totalScreensCreated} high-fidelity screen(s) designed across ${pages.length} page(s). Review visual designs for brand consistency, usability, and completeness. Approve to proceed with interaction design?`,
    title: 'Screen Design Review',
    context: {
      runId: ctx.runId,
      screens: {
        total: totalScreensCreated,
        pages: screenDesignResults.length,
        averageVariantsPerPage: (screenDesignResults.reduce((sum, r) => sum + r.variantsCreated, 0) / pages.length).toFixed(1)
      },
      designSystem: {
        components: designSystemSetup.componentsCreated,
        tokens: designSystemSetup.tokensCreated
      },
      prototypeUrl,
      files: screenDesignResults
        .slice(0, 5)
        .flatMap(r => r.result.artifacts)
        .filter(a => a.type === 'screenshot')
        .map(a => ({ path: a.path, format: 'image', label: `Screen: ${a.label}` }))
    }
  });

  // ============================================================================
  // PHASE 5: INTERACTION DESIGN PATTERNS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing interaction design patterns');

  const interactionDesign = await ctx.task(interactionDesignTask, {
    projectName,
    pages,
    screenDesignResults,
    targetPlatforms,
    interactionComplexity,
    interactionPatterns,
    designTool,
    projectUrl: prototypeUrl,
    outputDir
  });

  interactionsImplemented = interactionDesign.interactionsImplemented;
  artifacts.push(...interactionDesign.artifacts);

  ctx.log('info', `${interactionsImplemented} interaction(s) implemented: ${interactionDesign.interactionTypes.join(', ')}`);

  // ============================================================================
  // PHASE 6: NAVIGATION AND USER FLOWS
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing navigation and user flows');

  const navigationDesign = await ctx.task(navigationDesignTask, {
    projectName,
    pages,
    screenDesignResults,
    interactionDesign: interactionDesign.interactions,
    projectType,
    targetPlatforms,
    designTool,
    projectUrl: prototypeUrl,
    outputDir
  });

  artifacts.push(...navigationDesign.artifacts);

  ctx.log('info', `Navigation designed: ${navigationDesign.flowsCreated} user flow(s), ${navigationDesign.connectionsCreated} screen connection(s)`);

  // ============================================================================
  // PHASE 7: MICROINTERACTIONS DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing microinteractions');

  const microinteractions = await ctx.task(microinteractionsTask, {
    projectName,
    pages,
    components,
    screenDesignResults,
    interactionPatterns,
    animationStyle,
    targetPlatforms,
    designTool,
    projectUrl: prototypeUrl,
    outputDir
  });

  artifacts.push(...microinteractions.artifacts);

  ctx.log('info', `${microinteractions.microinteractionsCreated} microinteraction(s) designed across buttons, forms, and UI elements`);

  // ============================================================================
  // PHASE 8: ANIMATION AND MOTION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating animations and motion design');

  const animations = await ctx.task(animationDesignTask, {
    projectName,
    pages,
    screenDesignResults,
    animationStyle,
    interactionPatterns,
    targetPlatforms,
    projectType,
    designTool,
    projectUrl: prototypeUrl,
    outputDir
  });

  animationsCreated = animations.animationsCreated;
  artifacts.push(...animations.artifacts);

  ctx.log('info', `${animationsCreated} animation(s) created: transitions, loading states, feedback animations`);

  // Quality Gate: Interaction and animation review
  await ctx.breakpoint({
    question: `Interactions and animations complete. ${interactionsImplemented} interactions, ${animationsCreated} animations, ${microinteractions.microinteractionsCreated} microinteractions. Review prototype for interaction quality and motion design. Approve to proceed with testing?`,
    title: 'Interaction Design Review',
    context: {
      runId: ctx.runId,
      interactions: {
        total: interactionsImplemented,
        types: interactionDesign.interactionTypes,
        complexity: interactionComplexity
      },
      animations: {
        total: animationsCreated,
        style: animationStyle,
        types: animations.animationTypes
      },
      microinteractions: {
        total: microinteractions.microinteractionsCreated,
        categories: microinteractions.categories
      },
      navigation: {
        flows: navigationDesign.flowsCreated,
        connections: navigationDesign.connectionsCreated
      },
      prototypeUrl,
      files: [
        ...interactionDesign.artifacts.filter(a => a.type === 'video').slice(0, 3).map(a => ({ path: a.path, format: 'video', label: 'Interaction Demo' })),
        ...animations.artifacts.filter(a => a.type === 'video').slice(0, 2).map(a => ({ path: a.path, format: 'video', label: 'Animation Demo' }))
      ]
    }
  });

  // ============================================================================
  // PHASE 9: GESTURE AND TOUCH INTERACTIONS (MOBILE/TABLET)
  // ============================================================================

  let gestureDesign = null;
  if (['mobile-app', 'tablet-app', 'responsive'].includes(projectType) && interactionPatterns.gestures) {
    ctx.log('info', 'Phase 9: Implementing gesture and touch interactions');

    gestureDesign = await ctx.task(gestureDesignTask, {
      projectName,
      pages,
      screenDesignResults,
      targetPlatforms,
      projectType,
      designTool,
      projectUrl: prototypeUrl,
      outputDir
    });

    artifacts.push(...gestureDesign.artifacts);

    ctx.log('info', `${gestureDesign.gesturesImplemented} gesture(s) implemented: ${gestureDesign.gestureTypes.join(', ')}`);
  }

  // ============================================================================
  // PHASE 10: LOADING STATES AND FEEDBACK DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 10: Designing loading states and user feedback');

  const feedbackDesign = await ctx.task(feedbackDesignTask, {
    projectName,
    pages,
    screenDesignResults,
    interactionPatterns,
    animationStyle,
    designTool,
    projectUrl: prototypeUrl,
    outputDir
  });

  artifacts.push(...feedbackDesign.artifacts);

  ctx.log('info', `Feedback design complete: ${feedbackDesign.loadingStatesCreated} loading states, ${feedbackDesign.feedbackPatternsCreated} feedback patterns`);

  // ============================================================================
  // PHASE 11: RESPONSIVE AND ADAPTIVE DESIGN (IF APPLICABLE)
  // ============================================================================

  let responsiveDesign = null;
  if (projectType === 'responsive' || targetPlatforms.length > 1) {
    ctx.log('info', 'Phase 11: Creating responsive and adaptive design variations');

    responsiveDesign = await ctx.task(responsiveDesignTask, {
      projectName,
      pages,
      screenDesignResults,
      targetPlatforms,
      projectType,
      designTool,
      projectUrl: prototypeUrl,
      outputDir
    });

    artifacts.push(...responsiveDesign.artifacts);

    ctx.log('info', `Responsive design: ${responsiveDesign.breakpointsCreated} breakpoint(s), ${responsiveDesign.adaptiveVariantsCreated} adaptive variant(s)`);
  }

  // ============================================================================
  // PHASE 12: ACCESSIBILITY VALIDATION
  // ============================================================================

  let accessibilityResults = null;
  if (accessibilityValidation) {
    ctx.log('info', 'Phase 12: Validating accessibility (a11y) compliance');

    accessibilityResults = await ctx.task(accessibilityValidationTask, {
      projectName,
      pages,
      screenDesignResults,
      targetPlatforms,
      designTool,
      projectUrl: prototypeUrl,
      outputDir
    });

    artifacts.push(...accessibilityResults.artifacts);

    ctx.log('info', `Accessibility validation: ${accessibilityResults.issuesFound} issue(s) found, ${accessibilityResults.wcagCompliance}% WCAG 2.1 AA compliance`);

    // Quality Gate: Accessibility review
    if (accessibilityResults.issuesFound > 0) {
      await ctx.breakpoint({
        question: `Accessibility validation found ${accessibilityResults.issuesFound} issue(s). WCAG 2.1 AA compliance: ${accessibilityResults.wcagCompliance}%. Review issues and approve fixes before proceeding?`,
        title: 'Accessibility Review',
        context: {
          runId: ctx.runId,
          accessibility: {
            issuesFound: accessibilityResults.issuesFound,
            wcagCompliance: accessibilityResults.wcagCompliance,
            criticalIssues: accessibilityResults.criticalIssues,
            warningIssues: accessibilityResults.warningIssues
          },
          topIssues: accessibilityResults.topIssues.slice(0, 10),
          files: [
            { path: accessibilityResults.reportPath, format: 'html', label: 'Accessibility Report' }
          ]
        }
      });
    }
  }

  // ============================================================================
  // PHASE 13: DEVICE PREVIEW AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating device previews');

  const devicePreviewResults = await ctx.task(devicePreviewTask, {
    projectName,
    pages,
    targetPlatforms,
    projectType,
    designTool,
    projectUrl: prototypeUrl,
    outputDir
  });

  artifacts.push(...devicePreviewResults.artifacts);

  ctx.log('info', `Device previews created for ${devicePreviewResults.devicesGenerated} device(s)`);

  // ============================================================================
  // PHASE 14: PROTOTYPE REFINEMENT AND POLISH
  // ============================================================================

  ctx.log('info', 'Phase 14: Refining and polishing prototype');

  const prototypeRefinement = await ctx.task(prototypeRefinementTask, {
    projectName,
    pages,
    screenDesignResults,
    interactionDesign,
    animations,
    microinteractions,
    feedbackDesign,
    navigationDesign,
    designTool,
    projectUrl: prototypeUrl,
    outputDir
  });

  artifacts.push(...prototypeRefinement.artifacts);

  ctx.log('info', `Prototype refined: ${prototypeRefinement.refinementsApplied} refinement(s) applied`);

  // Quality Gate: Final prototype review
  await ctx.breakpoint({
    question: `High-fidelity prototype complete with ${totalScreensCreated} screens, ${interactionsImplemented} interactions, ${animationsCreated} animations. Review final prototype for quality and completeness. Approve to proceed with user testing?`,
    title: 'Final Prototype Review',
    context: {
      runId: ctx.runId,
      prototype: {
        screens: totalScreensCreated,
        interactions: interactionsImplemented,
        animations: animationsCreated,
        microinteractions: microinteractions.microinteractionsCreated,
        flows: navigationDesign.flowsCreated,
        url: prototypeUrl
      },
      quality: {
        refinementsApplied: prototypeRefinement.refinementsApplied,
        accessibilityCompliance: accessibilityResults?.wcagCompliance || 'Not tested',
        devicesCovered: devicePreviewResults.devicesGenerated
      },
      files: [
        { path: prototypeRefinement.prototypeWalkthroughPath, format: 'video', label: 'Prototype Walkthrough' },
        ...devicePreviewResults.artifacts.filter(a => a.type === 'screenshot').slice(0, 5).map(a => ({ path: a.path, format: 'image', label: `Preview: ${a.label}` }))
      ]
    }
  });

  // ============================================================================
  // PHASE 15: USER TESTING PREPARATION
  // ============================================================================

  let userTestingPrep = null;
  if (userTestingRequired) {
    ctx.log('info', 'Phase 15: Preparing user testing plan');

    userTestingPrep = await ctx.task(userTestingPrepTask, {
      projectName,
      pages,
      testingParticipants,
      testingScenarios,
      navigationDesign: navigationDesign.flows,
      projectType,
      targetPlatforms,
      prototypeUrl,
      outputDir
    });

    artifacts.push(...userTestingPrep.artifacts);

    ctx.log('info', `User testing plan: ${userTestingPrep.scenariosCreated} scenario(s), ${userTestingPrep.tasksCreated} task(s), ${testingParticipants} participant(s)`);
  }

  // ============================================================================
  // PHASE 16: USER TESTING EXECUTION
  // ============================================================================

  if (userTestingRequired && userTestingPrep) {
    ctx.log('info', 'Phase 16: Conducting user testing sessions');

    const userTesting = await ctx.task(userTestingExecutionTask, {
      projectName,
      testingPlan: userTestingPrep.testingPlan,
      testingParticipants,
      prototypeUrl,
      targetPlatforms,
      outputDir
    });

    userTestingResults = userTesting;
    artifacts.push(...userTesting.artifacts);

    ctx.log('info', `User testing complete: ${userTesting.sessionsCompleted} session(s), ${userTesting.issuesFound} issue(s) identified`);

    // Quality Gate: User testing results review
    await ctx.breakpoint({
      question: `User testing complete with ${userTesting.sessionsCompleted} session(s). ${userTesting.issuesFound} issue(s) found (${userTesting.criticalIssues} critical). Success rate: ${userTesting.overallSuccessRate}%. Review findings and decide on iterations or proceed to handoff?`,
      title: 'User Testing Results',
      context: {
        runId: ctx.runId,
        testing: {
          sessionsCompleted: userTesting.sessionsCompleted,
          issuesFound: userTesting.issuesFound,
          criticalIssues: userTesting.criticalIssues,
          successRate: userTesting.overallSuccessRate,
          satisfactionScore: userTesting.satisfactionScore
        },
        topIssues: userTesting.topIssues.slice(0, 10),
        topInsights: userTesting.insights.slice(0, 5),
        recommendations: userTesting.recommendations,
        files: [
          { path: userTesting.reportPath, format: 'html', label: 'User Testing Report' },
          { path: userTesting.videoHighlightsPath, format: 'video', label: 'Testing Highlights' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 17: INTERACTION SPECIFICATIONS DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 17: Creating interaction specifications');

  const interactionSpecs = await ctx.task(interactionSpecsTask, {
    projectName,
    pages,
    screenDesignResults,
    interactionDesign,
    animations,
    microinteractions,
    gestureDesign,
    feedbackDesign,
    navigationDesign,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...interactionSpecs.artifacts);

  ctx.log('info', `Interaction specifications created: ${interactionSpecs.specificationsCreated} spec document(s)`);

  // ============================================================================
  // PHASE 18: DESIGN TOKENS AND ASSETS EXPORT
  // ============================================================================

  ctx.log('info', 'Phase 18: Exporting design tokens and assets');

  const assetsExport = await ctx.task(assetsExportTask, {
    projectName,
    designTool,
    designSystem: designSystemSetup.designSystemReference,
    targetPlatforms,
    includeAssets,
    includeCode,
    projectUrl: prototypeUrl,
    outputDir
  });

  artifacts.push(...assetsExport.artifacts);

  ctx.log('info', `Assets exported: ${assetsExport.assetsExported} asset(s), ${assetsExport.tokensExported} design token(s)`);

  // ============================================================================
  // PHASE 19: DEVELOPER HANDOFF PACKAGE
  // ============================================================================

  ctx.log('info', 'Phase 19: Creating developer handoff package');

  const handoffPackage = await ctx.task(developerHandoffTask, {
    projectName,
    handoffFormat,
    designTool,
    targetPlatforms,
    screenDesignResults,
    interactionSpecs,
    assetsExport,
    designSystem: designSystemSetup.designSystemReference,
    includeSpecifications,
    includeAssets,
    includeCode,
    prototypeUrl,
    outputDir
  });

  artifacts.push(...handoffPackage.artifacts);

  ctx.log('info', `Handoff package created: ${handoffPackage.documentsIncluded} document(s), ${handoffPackage.assetsIncluded} asset(s)`);

  // ============================================================================
  // PHASE 20: PROTOTYPE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 20: Generating comprehensive documentation');

  const documentation = await ctx.task(prototypeDocumentationTask, {
    projectName,
    projectType,
    designTool,
    targetPlatforms,
    strategyPlanning,
    toolSetup,
    designSystemSetup,
    screenDesignResults,
    interactionDesign,
    navigationDesign,
    animations,
    microinteractions,
    gestureDesign,
    feedbackDesign,
    responsiveDesign,
    accessibilityResults,
    devicePreviewResults,
    userTestingResults,
    interactionSpecs,
    assetsExport,
    handoffPackage,
    prototypeUrl,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 21: FINAL VALIDATION AND APPROVAL
  // ============================================================================

  ctx.log('info', 'Phase 21: Conducting final validation');

  const finalValidation = await ctx.task(prototypeValidationTask, {
    projectName,
    totalScreensCreated,
    interactionsImplemented,
    animationsCreated,
    strategyPlanning,
    screenDesignResults,
    interactionDesign,
    userTestingResults,
    accessibilityResults,
    handoffPackage,
    prototypeUrl,
    outputDir
  });

  artifacts.push(...finalValidation.artifacts);

  const validationScore = finalValidation.validationScore;
  const productionReady = finalValidation.productionReady;

  // Final Breakpoint: Prototype completion approval
  await ctx.breakpoint({
    question: `Hi-Fi Prototype Complete! Validation score: ${validationScore}/100. ${totalScreensCreated} screens, ${interactionsImplemented} interactions, ${animationsCreated} animations. User testing: ${userTestingResults?.overallSuccessRate || 'N/A'}% success. Production ready: ${productionReady}. Approve for handoff?`,
    title: 'Prototype Complete - Final Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        projectType,
        designTool,
        screens: totalScreensCreated,
        interactions: interactionsImplemented,
        animations: animationsCreated,
        microinteractions: microinteractions.microinteractionsCreated,
        flows: navigationDesign.flowsCreated,
        platforms: targetPlatforms,
        validationScore,
        productionReady
      },
      userTesting: userTestingResults ? {
        sessionsCompleted: userTestingResults.sessionsCompleted,
        successRate: userTestingResults.overallSuccessRate,
        satisfactionScore: userTestingResults.satisfactionScore,
        issuesFound: userTestingResults.issuesFound
      } : null,
      accessibility: accessibilityResults ? {
        wcagCompliance: accessibilityResults.wcagCompliance,
        issuesFound: accessibilityResults.issuesFound
      } : null,
      handoff: {
        documentsIncluded: handoffPackage.documentsIncluded,
        assetsIncluded: handoffPackage.assetsIncluded,
        format: handoffFormat
      },
      prototypeUrl,
      verdict: finalValidation.verdict,
      recommendation: finalValidation.recommendation,
      files: [
        { path: documentation.projectOverviewPath, format: 'markdown', label: 'Project Overview' },
        { path: interactionSpecs.masterSpecPath, format: 'markdown', label: 'Interaction Specifications' },
        { path: handoffPackage.handoffGuidePath, format: 'markdown', label: 'Developer Handoff Guide' },
        { path: finalValidation.reportPath, format: 'markdown', label: 'Validation Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: productionReady,
    projectName,
    projectType,
    designTool,
    prototypeUrl,
    screens: {
      total: totalScreensCreated,
      pages: pages.length,
      variants: screenDesignResults.reduce((sum, r) => sum + r.variantsCreated, 0)
    },
    interactionsImplemented,
    interactions: {
      total: interactionsImplemented,
      types: interactionDesign.interactionTypes,
      complexity: interactionComplexity
    },
    animationsCreated,
    animations: {
      total: animationsCreated,
      style: animationStyle,
      types: animations.animationTypes
    },
    microinteractions: {
      total: microinteractions.microinteractionsCreated,
      categories: microinteractions.categories
    },
    navigation: {
      flows: navigationDesign.flowsCreated,
      connections: navigationDesign.connectionsCreated
    },
    gestures: gestureDesign ? {
      implemented: gestureDesign.gesturesImplemented,
      types: gestureDesign.gestureTypes
    } : null,
    feedback: {
      loadingStates: feedbackDesign.loadingStatesCreated,
      patterns: feedbackDesign.feedbackPatternsCreated
    },
    responsive: responsiveDesign ? {
      breakpoints: responsiveDesign.breakpointsCreated,
      adaptiveVariants: responsiveDesign.adaptiveVariantsCreated
    } : null,
    accessibility: accessibilityResults ? {
      wcagCompliance: accessibilityResults.wcagCompliance,
      issuesFound: accessibilityResults.issuesFound,
      issuesFixed: accessibilityResults.issuesFixed
    } : null,
    devicePreviews: {
      devicesGenerated: devicePreviewResults.devicesGenerated
    },
    userTesting: userTestingResults ? {
      sessionsCompleted: userTestingResults.sessionsCompleted,
      successRate: userTestingResults.overallSuccessRate,
      satisfactionScore: userTestingResults.satisfactionScore,
      issuesFound: userTestingResults.issuesFound,
      criticalIssues: userTestingResults.criticalIssues,
      insights: userTestingResults.insights.length
    } : null,
    handoffPackage: {
      format: handoffFormat,
      documentsIncluded: handoffPackage.documentsIncluded,
      assetsIncluded: handoffPackage.assetsIncluded,
      specificationsIncluded: handoffPackage.specificationsIncluded,
      packagePath: handoffPackage.packagePath
    },
    designSystem: {
      components: designSystemSetup.componentsCreated,
      tokens: designSystemSetup.tokensCreated
    },
    assets: {
      exported: assetsExport.assetsExported,
      tokensExported: assetsExport.tokensExported
    },
    validation: {
      score: validationScore,
      productionReady,
      verdict: finalValidation.verdict,
      recommendation: finalValidation.recommendation
    },
    artifacts,
    documentation: {
      projectOverview: documentation.projectOverviewPath,
      interactionSpecs: interactionSpecs.masterSpecPath,
      handoffGuide: handoffPackage.handoffGuidePath,
      userGuide: documentation.userGuidePath
    },
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/hifi-prototyping',
      timestamp: startTime,
      designTool,
      projectType,
      platforms: targetPlatforms,
      interactionComplexity,
      animationStyle
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Prototype Strategy Planning
export const prototypeStrategyTask = defineTask('prototype-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Prototype Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UX/UI Designer and Interaction Design Architect',
      task: 'Plan comprehensive high-fidelity prototyping strategy',
      context: {
        projectName: args.projectName,
        projectType: args.projectType,
        designTool: args.designTool,
        targetPlatforms: args.targetPlatforms,
        pages: args.pages,
        components: args.components,
        interactionComplexity: args.interactionComplexity,
        animationStyle: args.animationStyle,
        designSystem: args.designSystem,
        brandGuidelines: args.brandGuidelines,
        interactionPatterns: args.interactionPatterns,
        userTestingRequired: args.userTestingRequired,
        handoffFormat: args.handoffFormat,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze project requirements and scope (pages, components, platforms)',
        '2. Define prototyping approach based on project type and complexity',
        '3. Plan screen inventory: all screens, states, and variants needed',
        '4. Identify all interaction points requiring design (taps, clicks, gestures)',
        '5. Plan navigation structure and user flow connections',
        '6. Define animation and motion design requirements',
        '7. Plan microinteraction details (buttons, forms, feedback)',
        '8. Determine gesture interactions for mobile/tablet platforms',
        '9. Plan responsive breakpoints if multi-platform',
        '10. Define accessibility requirements and validation approach',
        '11. Plan user testing scenarios and success metrics',
        '12. Estimate timeline and effort for each phase',
        '13. Create comprehensive prototyping strategy document',
        '14. Document design tool selection rationale and setup requirements'
      ],
      outputFormat: 'JSON object with prototype strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalScreens', 'totalInteractions', 'estimatedDuration', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalScreens: { type: 'number', description: 'Total screens including states and variants' },
        totalInteractions: { type: 'number', description: 'Estimated interaction points' },
        screenInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              screens: { type: 'number' },
              states: { type: 'array', items: { type: 'string' } },
              variants: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        interactionPlan: {
          type: 'object',
          properties: {
            navigations: { type: 'number' },
            gestures: { type: 'number' },
            microinteractions: { type: 'number' },
            animations: { type: 'number' },
            transitions: { type: 'number' }
          }
        },
        platformStrategy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              considerations: { type: 'array', items: { type: 'string' } },
              uniqueRequirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        designToolRationale: { type: 'string' },
        estimatedDuration: { type: 'string' },
        phaseBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        strategyDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'prototyping', 'strategy']
}));

// Phase 2: Design Tool Setup
export const designToolSetupTask = defineTask('design-tool-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Design Tool Setup - ${args.designTool} - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX/UI Designer and Design Tool Specialist',
      task: 'Set up design tool workspace and project structure for high-fidelity prototyping',
      context: {
        projectName: args.projectName,
        designTool: args.designTool,
        projectType: args.projectType,
        targetPlatforms: args.targetPlatforms,
        designSystem: args.designSystem,
        brandGuidelines: args.brandGuidelines,
        collaborationMode: args.collaborationMode,
        devicePreview: args.devicePreview,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create new ${args.designTool} project for ${args.projectName}`,
        '2. Set up project structure: pages, components, assets folders',
        '3. Configure canvas/artboard sizes for target platforms',
        '4. Import or create design system foundation if specified',
        '5. Import brand guidelines (colors, typography, logos)',
        '6. Set up shared libraries for reusable components',
        '7. Configure prototyping settings and interactions',
        '8. Set up collaboration and sharing permissions',
        '9. Configure device preview settings for target platforms',
        '10. Create naming conventions and organizational structure',
        '11. Set up version control or file management',
        '12. Configure plugins/extensions for prototyping (if applicable)',
        '13. Generate shareable project URL',
        '14. Document tool setup and access instructions'
      ],
      outputFormat: 'JSON object with tool setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'projectUrl', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        designTool: { type: 'string' },
        projectUrl: { type: 'string', description: 'Shareable project URL' },
        projectStructure: {
          type: 'object',
          properties: {
            pages: { type: 'array', items: { type: 'string' } },
            componentLibrary: { type: 'string' },
            assetsFolder: { type: 'string' }
          }
        },
        canvasConfiguration: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              width: { type: 'number' },
              height: { type: 'number' },
              scale: { type: 'number' }
            }
          }
        },
        collaborationSettings: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            shareableLink: { type: 'string' },
            accessLevel: { type: 'string' }
          }
        },
        pluginsInstalled: { type: 'array', items: { type: 'string' } },
        setupGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'design-tool', 'setup']
}));

// Phase 3: Design System Setup
export const designSystemSetupTask = defineTask('design-system-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Design System Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design System Architect',
      task: 'Set up design system foundation with components and design tokens',
      context: {
        projectName: args.projectName,
        designTool: args.designTool,
        designSystem: args.designSystem,
        brandGuidelines: args.brandGuidelines,
        components: args.components,
        targetPlatforms: args.targetPlatforms,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Import existing design system or create foundation',
        '2. Define design tokens: colors, typography, spacing, shadows, borders',
        '3. Create atomic components: buttons, inputs, checkboxes, icons, avatars',
        '4. Build molecular components: form groups, cards, list items',
        '5. Design organism components: headers, footers, navigation, modals',
        '6. Create component states: default, hover, active, disabled, error',
        '7. Define interaction states and transitions for each component',
        '8. Document component usage and variations',
        '9. Set up component library organization',
        '10. Create platform-specific variants if needed (iOS vs Android)',
        '11. Configure auto-layout and responsive behaviors',
        '12. Test component consistency across screens',
        '13. Generate design system documentation',
        '14. Export design tokens for developer handoff'
      ],
      outputFormat: 'JSON object with design system setup'
    },
    outputSchema: {
      type: 'object',
      required: ['componentsCreated', 'tokensCreated', 'designSystemReference', 'artifacts'],
      properties: {
        componentsCreated: { type: 'number' },
        tokensCreated: { type: 'number' },
        designSystemReference: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            libraryUrl: { type: 'string' }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['atom', 'molecule', 'organism'] },
              variants: { type: 'number' },
              states: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        designTokens: {
          type: 'object',
          properties: {
            colors: { type: 'number' },
            typography: { type: 'number' },
            spacing: { type: 'number' },
            shadows: { type: 'number' },
            borders: { type: 'number' }
          }
        },
        platformVariants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              componentsWithVariants: { type: 'number' }
            }
          }
        },
        documentationPath: { type: 'string' },
        tokensExportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'design-system', 'components']
}));

// Phase 4: High-Fidelity Screen Design
export const screenDesignTask = defineTask('screen-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Screen Design - ${args.page}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UI Designer',
      task: 'Create polished high-fidelity screen designs',
      context: {
        projectName: args.projectName,
        page: args.page,
        projectType: args.projectType,
        targetPlatforms: args.targetPlatforms,
        designTool: args.designTool,
        designSystem: args.designSystem,
        components: args.components,
        brandGuidelines: args.brandGuidelines,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create high-fidelity designs for ${args.page} page`,
        '2. Design all necessary screen states: empty, loading, error, success, populated',
        '3. Apply brand guidelines: colors, typography, imagery, tone',
        '4. Use design system components consistently',
        '5. Design responsive layouts for each target platform',
        '6. Create visual hierarchy with typography, color, and spacing',
        '7. Design CTAs, buttons, and interactive elements',
        '8. Add real or representative content (text, images, icons)',
        '9. Ensure accessibility: contrast ratios, touch targets, readability',
        '10. Design micro-copy and error messages',
        '11. Create modal, overlay, and dialog variants',
        '12. Design form validation states and feedback',
        '13. Add annotations for interactions and behaviors',
        '14. Export screen previews and document design decisions'
      ],
      outputFormat: 'JSON object with screen design details'
    },
    outputSchema: {
      type: 'object',
      required: ['screensCreated', 'variantsCreated', 'artifacts'],
      properties: {
        page: { type: 'string' },
        screensCreated: { type: 'number' },
        variantsCreated: { type: 'number' },
        screens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              state: { type: 'string' },
              platform: { type: 'string' },
              url: { type: 'string' }
            }
          }
        },
        designDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              decision: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        accessibilityChecks: {
          type: 'object',
          properties: {
            contrastRatios: { type: 'boolean' },
            touchTargets: { type: 'boolean' },
            readability: { type: 'boolean' }
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
  labels: ['agent', 'ux-ui', 'screen-design', 'visual-design']
}));

// Phase 5: Interaction Design
export const interactionDesignTask = defineTask('interaction-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Interaction Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interaction Designer',
      task: 'Design and implement comprehensive interaction patterns',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        screenDesignResults: args.screenDesignResults,
        targetPlatforms: args.targetPlatforms,
        interactionComplexity: args.interactionComplexity,
        interactionPatterns: args.interactionPatterns,
        designTool: args.designTool,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all interactive elements across screens',
        '2. Define click/tap interactions for buttons, links, cards',
        '3. Design hover and focus states for desktop interfaces',
        '4. Implement form interactions: input focus, validation, submission',
        '5. Design modal and overlay trigger interactions',
        '6. Create dropdown and menu interactions',
        '7. Design scroll interactions and parallax effects (if applicable)',
        '8. Implement tab and accordion interactions',
        '9. Design drag-and-drop interactions (if applicable)',
        '10. Create search and filter interactions',
        '11. Design notification and toast interactions',
        '12. Implement contextual menus and right-click behaviors',
        '13. Add keyboard navigation and shortcuts',
        '14. Document all interaction behaviors and triggers'
      ],
      outputFormat: 'JSON object with interaction design details'
    },
    outputSchema: {
      type: 'object',
      required: ['interactionsImplemented', 'interactionTypes', 'interactions', 'artifacts'],
      properties: {
        interactionsImplemented: { type: 'number' },
        interactionTypes: { type: 'array', items: { type: 'string' } },
        interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              trigger: { type: 'string' },
              action: { type: 'string' },
              feedback: { type: 'string' },
              platforms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyboardNavigation: {
          type: 'object',
          properties: {
            implemented: { type: 'boolean' },
            shortcuts: { type: 'array', items: { type: 'object' } }
          }
        },
        interactionMapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'interaction-design', 'ixd']
}));

// Phase 6: Navigation Design
export const navigationDesignTask = defineTask('navigation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Navigation Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Designer and Information Architect',
      task: 'Design navigation structure and connect user flows',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        screenDesignResults: args.screenDesignResults,
        interactionDesign: args.interactionDesign,
        projectType: args.projectType,
        targetPlatforms: args.targetPlatforms,
        designTool: args.designTool,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Map all user flows from entry points to goals',
        '2. Connect screens with navigation links and transitions',
        '3. Design primary navigation structure',
        '4. Design secondary and tertiary navigation',
        '5. Create breadcrumb navigation (if applicable)',
        '6. Design back/forward navigation patterns',
        '7. Map modal and overlay navigation patterns',
        '8. Create deep linking structure',
        '9. Design navigation for different user states (logged in/out)',
        '10. Map error and edge case navigation paths',
        '11. Design onboarding flow navigation',
        '12. Validate all flows are complete and connected',
        '13. Create user flow diagrams',
        '14. Document navigation architecture and rationale'
      ],
      outputFormat: 'JSON object with navigation design'
    },
    outputSchema: {
      type: 'object',
      required: ['flowsCreated', 'connectionsCreated', 'flows', 'artifacts'],
      properties: {
        flowsCreated: { type: 'number' },
        connectionsCreated: { type: 'number' },
        flows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              entryPoint: { type: 'string' },
              goal: { type: 'string' },
              steps: { type: 'number' },
              screens: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        navigationStructure: {
          type: 'object',
          properties: {
            primary: { type: 'array', items: { type: 'string' } },
            secondary: { type: 'array', items: { type: 'string' } },
            utility: { type: 'array', items: { type: 'string' } }
          }
        },
        flowDiagramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'navigation', 'user-flows']
}));

// Phase 7: Microinteractions
export const microinteractionsTask = defineTask('microinteractions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Microinteractions - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interaction Designer specializing in Microinteractions',
      task: 'Design delightful microinteractions for UI elements',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        components: args.components,
        screenDesignResults: args.screenDesignResults,
        interactionPatterns: args.interactionPatterns,
        animationStyle: args.animationStyle,
        targetPlatforms: args.targetPlatforms,
        designTool: args.designTool,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design button press/tap microinteractions (scale, ripple, color change)',
        '2. Create toggle and switch animations',
        '3. Design checkbox and radio button selection animations',
        '4. Create input field focus and validation microinteractions',
        '5. Design hover effects for interactive elements',
        '6. Create icon animation microinteractions',
        '7. Design like/favorite button animations',
        '8. Create pull-to-refresh microinteraction',
        '9. Design tooltip and popover reveal animations',
        '10. Create progress indicator microinteractions',
        '11. Design success/error feedback animations',
        '12. Create badge and notification pulse animations',
        '13. Design scroll indicator microinteractions',
        '14. Test and refine microinteraction timing and easing'
      ],
      outputFormat: 'JSON object with microinteractions'
    },
    outputSchema: {
      type: 'object',
      required: ['microinteractionsCreated', 'categories', 'artifacts'],
      properties: {
        microinteractionsCreated: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        microinteractions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              trigger: { type: 'string' },
              animation: { type: 'string' },
              duration: { type: 'string' },
              easing: { type: 'string' }
            }
          }
        },
        timingConsiderations: {
          type: 'object',
          properties: {
            averageDuration: { type: 'string' },
            easingFunction: { type: 'string' }
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
  labels: ['agent', 'ux-ui', 'microinteractions', 'animation']
}));

// Phase 8: Animation Design
export const animationDesignTask = defineTask('animation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Animation Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Motion Designer and UI Animator',
      task: 'Create animations and transitions for prototype',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        screenDesignResults: args.screenDesignResults,
        animationStyle: args.animationStyle,
        interactionPatterns: args.interactionPatterns,
        targetPlatforms: args.targetPlatforms,
        projectType: args.projectType,
        designTool: args.designTool,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design screen transition animations (slide, fade, zoom, custom)',
        '2. Create page load animations and skeleton screens',
        '3. Design modal/overlay entrance and exit animations',
        '4. Create scroll-triggered animations (fade-in, slide-in)',
        '5. Design navigation transition animations',
        '6. Create animated illustrations or hero graphics',
        '7. Design loading spinner and progress animations',
        '8. Create success/error state animations',
        '9. Design empty state animations',
        '10. Create onboarding animation sequence',
        '11. Design notification entrance/exit animations',
        '12. Apply easing curves and timing appropriate to animation style',
        '13. Ensure animations respect platform guidelines (Material Motion, iOS HIG)',
        '14. Export animation specifications and timing diagrams'
      ],
      outputFormat: 'JSON object with animation details'
    },
    outputSchema: {
      type: 'object',
      required: ['animationsCreated', 'animationTypes', 'artifacts'],
      properties: {
        animationsCreated: { type: 'number' },
        animationTypes: { type: 'array', items: { type: 'string' } },
        animations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              duration: { type: 'string' },
              easing: { type: 'string' },
              trigger: { type: 'string' },
              screens: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        motionPrinciples: {
          type: 'object',
          properties: {
            style: { type: 'string' },
            duration: { type: 'string' },
            easing: { type: 'string' },
            platformGuidelines: { type: 'string' }
          }
        },
        timingDiagramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'animation', 'motion-design']
}));

// Phase 9: Gesture Design (Mobile/Tablet)
export const gestureDesignTask = defineTask('gesture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Gesture Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mobile Interaction Designer',
      task: 'Design gesture-based interactions for mobile and tablet',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        screenDesignResults: args.screenDesignResults,
        targetPlatforms: args.targetPlatforms,
        projectType: args.projectType,
        designTool: args.designTool,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design swipe gestures (left, right, up, down) for navigation',
        '2. Create pinch-to-zoom interactions for images and content',
        '3. Design long-press interactions for contextual menus',
        '4. Create swipe-to-delete or swipe-to-action patterns',
        '5. Design pull-to-refresh gesture',
        '6. Create drag-and-drop gestures for reordering',
        '7. Design edge swipe gestures for navigation drawers',
        '8. Create double-tap interactions (zoom, like)',
        '9. Design multi-finger gestures if applicable',
        '10. Add visual feedback for gesture recognition',
        '11. Design gesture tutorials/hints for first-time users',
        '12. Ensure gestures follow platform conventions (iOS vs Android)',
        '13. Test gesture conflict resolution',
        '14. Document all gesture behaviors and visual feedback'
      ],
      outputFormat: 'JSON object with gesture design'
    },
    outputSchema: {
      type: 'object',
      required: ['gesturesImplemented', 'gestureTypes', 'artifacts'],
      properties: {
        gesturesImplemented: { type: 'number' },
        gestureTypes: { type: 'array', items: { type: 'string' } },
        gestures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gesture: { type: 'string' },
              action: { type: 'string' },
              screens: { type: 'array', items: { type: 'string' } },
              feedback: { type: 'string' },
              platform: { type: 'string' }
            }
          }
        },
        gestureConventions: {
          type: 'object',
          properties: {
            iOS: { type: 'array', items: { type: 'string' } },
            Android: { type: 'array', items: { type: 'string' } }
          }
        },
        tutorialDesign: {
          type: 'object',
          properties: {
            included: { type: 'boolean' },
            gesturesTaught: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'ux-ui', 'gestures', 'mobile']
}));

// Phase 10: Feedback Design
export const feedbackDesignTask = defineTask('feedback-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Feedback Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Designer specializing in User Feedback',
      task: 'Design loading states and user feedback mechanisms',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        screenDesignResults: args.screenDesignResults,
        interactionPatterns: args.interactionPatterns,
        animationStyle: args.animationStyle,
        designTool: args.designTool,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design skeleton loading screens for content-heavy pages',
        '2. Create spinner/progress indicators for actions',
        '3. Design success confirmation feedback (toasts, snackbars, checkmarks)',
        '4. Create error message designs with clear actions',
        '5. Design form validation feedback (inline, field-level)',
        '6. Create network error and offline state screens',
        '7. Design "processing" feedback for payments and submissions',
        '8. Create undo/redo feedback mechanisms',
        '9. Design haptic feedback specifications for mobile',
        '10. Create sound feedback specifications (if applicable)',
        '11. Design progress bars for multi-step processes',
        '12. Create empty state feedback with helpful actions',
        '13. Design timeout and session expiry feedback',
        '14. Ensure feedback timing and placement follows UX best practices'
      ],
      outputFormat: 'JSON object with feedback design'
    },
    outputSchema: {
      type: 'object',
      required: ['loadingStatesCreated', 'feedbackPatternsCreated', 'artifacts'],
      properties: {
        loadingStatesCreated: { type: 'number' },
        feedbackPatternsCreated: { type: 'number' },
        loadingStates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              screen: { type: 'string' },
              type: { type: 'string', enum: ['skeleton', 'spinner', 'progress'] },
              duration: { type: 'string' }
            }
          }
        },
        feedbackPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['success', 'error', 'warning', 'info'] },
              presentation: { type: 'string', enum: ['toast', 'snackbar', 'modal', 'inline'] },
              duration: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        hapticFeedback: {
          type: 'object',
          properties: {
            specified: { type: 'boolean' },
            events: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'ux-ui', 'feedback', 'loading-states']
}));

// Phase 11: Responsive Design
export const responsiveDesignTask = defineTask('responsive-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Responsive Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Responsive Design Specialist',
      task: 'Create responsive and adaptive design variations',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        screenDesignResults: args.screenDesignResults,
        targetPlatforms: args.targetPlatforms,
        projectType: args.projectType,
        designTool: args.designTool,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define responsive breakpoints (mobile, tablet, desktop)',
        '2. Create layout adaptations for each breakpoint',
        '3. Design navigation transformations (hamburger menu, full nav)',
        '4. Adapt content hierarchy for different screen sizes',
        '5. Design responsive images and media scaling',
        '6. Create touch-friendly variants for mobile',
        '7. Design responsive tables and data displays',
        '8. Adapt modals and overlays for small screens',
        '9. Design responsive forms with appropriate input types',
        '10. Create adaptive typography scales',
        '11. Design responsive grid systems',
        '12. Test responsive behaviors at edge cases',
        '13. Document responsive rules and breakpoints',
        '14. Create responsive design specifications for developers'
      ],
      outputFormat: 'JSON object with responsive design'
    },
    outputSchema: {
      type: 'object',
      required: ['breakpointsCreated', 'adaptiveVariantsCreated', 'artifacts'],
      properties: {
        breakpointsCreated: { type: 'number' },
        adaptiveVariantsCreated: { type: 'number' },
        breakpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              minWidth: { type: 'number' },
              maxWidth: { type: 'number' },
              layoutAdaptations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        adaptiveComponents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              breakpointVariants: { type: 'number' },
              adaptationStrategy: { type: 'string' }
            }
          }
        },
        responsiveSpecPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'responsive', 'adaptive']
}));

// Phase 12: Accessibility Validation
export const accessibilityValidationTask = defineTask('accessibility-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Accessibility Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility (a11y) Specialist',
      task: 'Validate prototype against WCAG 2.1 AA accessibility guidelines',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        screenDesignResults: args.screenDesignResults,
        targetPlatforms: args.targetPlatforms,
        designTool: args.designTool,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Check color contrast ratios (WCAG AA: 4.5:1 for text, 3:1 for large text)',
        '2. Validate touch target sizes (minimum 44x44 pixels)',
        '3. Check text readability and font sizes',
        '4. Validate keyboard navigation support',
        '5. Check focus indicators visibility and clarity',
        '6. Validate form labels and error messages',
        '7. Check alt text specifications for images and icons',
        '8. Validate heading hierarchy and semantic structure',
        '9. Check for screen reader compatibility notes',
        '10. Validate color is not sole means of conveying information',
        '11. Check animation and motion controls (respect prefers-reduced-motion)',
        '12. Validate link and button text clarity',
        '13. Generate WCAG compliance report with issues and recommendations',
        '14. Prioritize issues by severity and impact'
      ],
      outputFormat: 'JSON object with accessibility validation'
    },
    outputSchema: {
      type: 'object',
      required: ['issuesFound', 'wcagCompliance', 'criticalIssues', 'reportPath', 'artifacts'],
      properties: {
        issuesFound: { type: 'number' },
        issuesFixed: { type: 'number', default: 0 },
        wcagCompliance: { type: 'number', description: 'Percentage compliance with WCAG 2.1 AA' },
        criticalIssues: { type: 'number' },
        warningIssues: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              screen: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              wcagCriterion: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        topIssues: {
          type: 'array',
          description: 'Top 10 most critical issues'
        },
        complianceChecklist: {
          type: 'object',
          properties: {
            colorContrast: { type: 'boolean' },
            touchTargets: { type: 'boolean' },
            keyboardNav: { type: 'boolean' },
            focusIndicators: { type: 'boolean' },
            formLabels: { type: 'boolean' },
            altText: { type: 'boolean' },
            headingHierarchy: { type: 'boolean' }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'accessibility', 'a11y', 'wcag']
}));

// Phase 13: Device Preview
export const devicePreviewTask = defineTask('device-preview', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Device Preview - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Designer',
      task: 'Generate device previews and mockups',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        targetPlatforms: args.targetPlatforms,
        projectType: args.projectType,
        designTool: args.designTool,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate device mockups for each target platform',
        '2. Create iPhone mockups (latest models)',
        '3. Create Android device mockups (Pixel, Samsung)',
        '4. Create tablet mockups (iPad, Android tablets)',
        '5. Create desktop browser mockups (Chrome, Safari, Firefox)',
        '6. Generate device frames with actual screen content',
        '7. Create presentation-ready mockups',
        '8. Generate animated device mockups showing interactions',
        '9. Create comparison views across devices',
        '10. Generate shareable preview links',
        '11. Create QR codes for mobile device testing',
        '12. Export high-resolution mockups for presentations',
        '13. Document device testing matrix',
        '14. Generate device preview gallery'
      ],
      outputFormat: 'JSON object with device previews'
    },
    outputSchema: {
      type: 'object',
      required: ['devicesGenerated', 'artifacts'],
      properties: {
        devicesGenerated: { type: 'number' },
        devicePreviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              device: { type: 'string' },
              platform: { type: 'string' },
              previewUrl: { type: 'string' },
              mockupImagePath: { type: 'string' }
            }
          }
        },
        previewLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              url: { type: 'string' },
              qrCodePath: { type: 'string' }
            }
          }
        },
        galleryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'device-preview', 'mockups']
}));

// Phase 14: Prototype Refinement
export const prototypeRefinementTask = defineTask('prototype-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Prototype Refinement - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UX/UI Designer',
      task: 'Refine and polish prototype for quality and consistency',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        screenDesignResults: args.screenDesignResults,
        interactionDesign: args.interactionDesign,
        animations: args.animations,
        microinteractions: args.microinteractions,
        feedbackDesign: args.feedbackDesign,
        navigationDesign: args.navigationDesign,
        designTool: args.designTool,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all screens for visual consistency',
        '2. Verify design system components are used consistently',
        '3. Check spacing and alignment across all screens',
        '4. Refine typography hierarchy and readability',
        '5. Polish colors and contrast',
        '6. Smooth transition timing and easing curves',
        '7. Refine microinteraction timing and feel',
        '8. Test all interactive hotspots and connections',
        '9. Verify navigation flows are complete and logical',
        '10. Polish loading and feedback animations',
        '11. Refine copy and microcopy for clarity',
        '12. Test prototype on actual devices',
        '13. Fix any visual or interaction bugs',
        '14. Create walkthrough video of refined prototype'
      ],
      outputFormat: 'JSON object with refinement details'
    },
    outputSchema: {
      type: 'object',
      required: ['refinementsApplied', 'prototypeWalkthroughPath', 'artifacts'],
      properties: {
        refinementsApplied: { type: 'number' },
        refinements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              screensAffected: { type: 'number' }
            }
          }
        },
        consistencyChecks: {
          type: 'object',
          properties: {
            visualConsistency: { type: 'boolean' },
            interactionConsistency: { type: 'boolean' },
            navigationCompleteness: { type: 'boolean' },
            deviceTesting: { type: 'boolean' }
          }
        },
        prototypeWalkthroughPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'refinement', 'polish']
}));

// Phase 15: User Testing Preparation
export const userTestingPrepTask = defineTask('user-testing-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: User Testing Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Researcher',
      task: 'Prepare comprehensive user testing plan',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        testingParticipants: args.testingParticipants,
        testingScenarios: args.testingScenarios,
        navigationDesign: args.navigationDesign,
        projectType: args.projectType,
        targetPlatforms: args.targetPlatforms,
        prototypeUrl: args.prototypeUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define user testing goals and research questions',
        '2. Create participant screener and recruitment criteria',
        '3. Design task scenarios covering key user flows',
        '4. Create task success criteria and metrics',
        '5. Design pre-test questionnaire (demographics, experience)',
        '6. Create moderation guide with script and probes',
        '7. Design post-task questions for each scenario',
        '8. Create post-test questionnaire (SUS, satisfaction)',
        '9. Define quantitative metrics (success rate, time on task, errors)',
        '10. Define qualitative observation points',
        '11. Create testing session schedule and logistics plan',
        '12. Set up testing tools (recording, note-taking)',
        '13. Create consent forms and NDA if needed',
        '14. Prepare prototype testing environment and access'
      ],
      outputFormat: 'JSON object with testing plan'
    },
    outputSchema: {
      type: 'object',
      required: ['testingPlan', 'scenariosCreated', 'tasksCreated', 'artifacts'],
      properties: {
        testingPlan: {
          type: 'object',
          properties: {
            goals: { type: 'array', items: { type: 'string' } },
            researchQuestions: { type: 'array', items: { type: 'string' } },
            participantCriteria: { type: 'string' },
            sessionDuration: { type: 'string' }
          }
        },
        scenariosCreated: { type: 'number' },
        tasksCreated: { type: 'number' },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              task: { type: 'string' },
              successCriteria: { type: 'string' },
              flows: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            quantitative: { type: 'array', items: { type: 'string' } },
            qualitative: { type: 'array', items: { type: 'string' } }
          }
        },
        moderationGuidePath: { type: 'string' },
        screenerPath: { type: 'string' },
        questionnairesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-research', 'user-testing', 'preparation']
}));

// Phase 16: User Testing Execution
export const userTestingExecutionTask = defineTask('user-testing-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: User Testing Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Researcher and Usability Testing Moderator',
      task: 'Conduct user testing sessions and synthesize findings',
      context: {
        projectName: args.projectName,
        testingPlan: args.testingPlan,
        testingParticipants: args.testingParticipants,
        prototypeUrl: args.prototypeUrl,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Recruit participants matching screener criteria',
        '2. Schedule testing sessions',
        '3. Conduct moderated usability testing sessions',
        '4. Observe and record user interactions',
        '5. Collect think-aloud verbal feedback',
        '6. Measure task completion rates',
        '7. Measure time on task',
        '8. Count and categorize errors',
        '9. Collect post-task and post-test questionnaire responses',
        '10. Identify usability issues and pain points',
        '11. Capture user quotes and insights',
        '12. Synthesize findings across all sessions',
        '13. Calculate quantitative metrics (avg success rate, avg time, SUS score)',
        '14. Prioritize issues by severity and frequency',
        '15. Generate recommendations for improvements',
        '16. Create highlights reel video',
        '17. Write comprehensive user testing report'
      ],
      outputFormat: 'JSON object with testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['sessionsCompleted', 'issuesFound', 'overallSuccessRate', 'reportPath', 'artifacts'],
      properties: {
        sessionsCompleted: { type: 'number' },
        issuesFound: { type: 'number' },
        criticalIssues: { type: 'number' },
        overallSuccessRate: { type: 'number', description: 'Percentage of tasks completed successfully' },
        satisfactionScore: { type: 'number', description: 'System Usability Scale (SUS) score out of 100' },
        taskResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              successRate: { type: 'number' },
              averageTime: { type: 'string' },
              errors: { type: 'number' },
              difficulty: { type: 'string' }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              screen: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              frequency: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        topIssues: {
          type: 'array',
          description: 'Top 10 most critical/frequent issues'
        },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              userQuote: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        reportPath: { type: 'string' },
        videoHighlightsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-research', 'user-testing', 'usability']
}));

// Phase 17: Interaction Specifications
export const interactionSpecsTask = defineTask('interaction-specs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Interaction Specifications - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interaction Designer and Technical Documentation Specialist',
      task: 'Create comprehensive interaction specifications for developers',
      context: {
        projectName: args.projectName,
        pages: args.pages,
        screenDesignResults: args.screenDesignResults,
        interactionDesign: args.interactionDesign,
        animations: args.animations,
        microinteractions: args.microinteractions,
        gestureDesign: args.gestureDesign,
        feedbackDesign: args.feedbackDesign,
        navigationDesign: args.navigationDesign,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document all interaction behaviors with precise specifications',
        '2. Specify animation timing, duration, and easing curves',
        '3. Document gesture specifications and feedback',
        '4. Specify hover and focus state behaviors',
        '5. Document form validation rules and error states',
        '6. Specify loading state behaviors and transitions',
        '7. Document success/error feedback specifications',
        '8. Specify navigation transition behaviors',
        '9. Document modal and overlay behaviors',
        '10. Specify touch target sizes and hit areas',
        '11. Document microinteraction timings and triggers',
        '12. Create state transition diagrams',
        '13. Specify responsive interaction adaptations',
        '14. Generate master interaction specification document'
      ],
      outputFormat: 'JSON object with interaction specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specificationsCreated', 'masterSpecPath', 'artifacts'],
      properties: {
        specificationsCreated: { type: 'number' },
        specifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              interaction: { type: 'string' },
              trigger: { type: 'string' },
              behavior: { type: 'string' },
              timing: { type: 'string' },
              platforms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        animationSpecs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              animation: { type: 'string' },
              duration: { type: 'string' },
              easing: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        stateTransitionDiagramsPath: { type: 'string' },
        masterSpecPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'specifications', 'documentation']
}));

// Phase 18: Assets Export
export const assetsExportTask = defineTask('assets-export', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Assets Export - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI Designer and Design Handoff Specialist',
      task: 'Export design assets and design tokens for development',
      context: {
        projectName: args.projectName,
        designTool: args.designTool,
        designSystem: args.designSystem,
        targetPlatforms: args.targetPlatforms,
        includeAssets: args.includeAssets,
        includeCode: args.includeCode,
        projectUrl: args.projectUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Export design tokens (colors, typography, spacing, shadows)',
        '2. Export component specifications',
        '3. Export all icons in multiple formats (SVG, PNG @1x, @2x, @3x)',
        '4. Export images and illustrations',
        '5. Export logos in all required formats',
        '6. Generate sprite sheets if needed',
        '7. Export animations (Lottie JSON, GIF, video)',
        '8. Generate style guide CSS/SCSS if requested',
        '9. Export platform-specific assets (iOS, Android, web)',
        '10. Create asset naming conventions documentation',
        '11. Organize assets in developer-friendly folder structure',
        '12. Generate asset inventory with usage notes',
        '13. Export color swatches and gradients',
        '14. Create asset delivery package with README'
      ],
      outputFormat: 'JSON object with asset export details'
    },
    outputSchema: {
      type: 'object',
      required: ['assetsExported', 'tokensExported', 'artifacts'],
      properties: {
        assetsExported: { type: 'number' },
        tokensExported: { type: 'number' },
        assetCategories: {
          type: 'object',
          properties: {
            icons: { type: 'number' },
            images: { type: 'number' },
            illustrations: { type: 'number' },
            logos: { type: 'number' },
            animations: { type: 'number' }
          }
        },
        designTokens: {
          type: 'object',
          properties: {
            colors: { type: 'number' },
            typography: { type: 'number' },
            spacing: { type: 'number' },
            shadows: { type: 'number' },
            tokensFilePath: { type: 'string' }
          }
        },
        platformAssets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              assetsExported: { type: 'number' },
              path: { type: 'string' }
            }
          }
        },
        assetInventoryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'assets', 'export']
}));

// Phase 19: Developer Handoff
export const developerHandoffTask = defineTask('developer-handoff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 19: Developer Handoff - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design-to-Development Handoff Specialist',
      task: 'Create comprehensive developer handoff package',
      context: {
        projectName: args.projectName,
        handoffFormat: args.handoffFormat,
        designTool: args.designTool,
        targetPlatforms: args.targetPlatforms,
        screenDesignResults: args.screenDesignResults,
        interactionSpecs: args.interactionSpecs,
        assetsExport: args.assetsExport,
        designSystem: args.designSystem,
        includeSpecifications: args.includeSpecifications,
        includeAssets: args.includeAssets,
        includeCode: args.includeCode,
        prototypeUrl: args.prototypeUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create developer handoff guide with overview',
        '2. Include prototype URL and access instructions',
        '3. Document design system and component library',
        '4. Include interaction specifications document',
        '5. Package all exported assets with organization guide',
        '6. Include design tokens and style guide',
        '7. Document responsive breakpoints and behaviors',
        '8. Include animation specifications (timing, easing)',
        '9. Document accessibility requirements and ARIA labels',
        '10. Include platform-specific implementation notes',
        '11. Add code snippets for complex interactions (if applicable)',
        '12. Include user flow diagrams',
        '13. Document edge cases and error states',
        '14. Create implementation checklist',
        '15. Add contact info for design questions',
        '16. Generate comprehensive README for package'
      ],
      outputFormat: 'JSON object with handoff package'
    },
    outputSchema: {
      type: 'object',
      required: ['documentsIncluded', 'assetsIncluded', 'handoffGuidePath', 'packagePath', 'artifacts'],
      properties: {
        documentsIncluded: { type: 'number' },
        assetsIncluded: { type: 'number' },
        specificationsIncluded: { type: 'boolean' },
        handoffPackage: {
          type: 'object',
          properties: {
            prototypeUrl: { type: 'string' },
            designSystemUrl: { type: 'string' },
            interactionSpecsPath: { type: 'string' },
            assetsPath: { type: 'string' },
            designTokensPath: { type: 'string' },
            flowDiagramsPath: { type: 'string' }
          }
        },
        platformSpecificDocs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              documentPath: { type: 'string' }
            }
          }
        },
        implementationChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              priority: { type: 'string' },
              reference: { type: 'string' }
            }
          }
        },
        handoffGuidePath: { type: 'string' },
        packagePath: { type: 'string' },
        readmePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'developer-handoff', 'documentation']
}));

// Phase 20: Prototype Documentation
export const prototypeDocumentationTask = defineTask('prototype-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 20: Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and UX Documentation Specialist',
      task: 'Generate comprehensive prototype documentation',
      context: args,
      instructions: [
        '1. Create project overview document',
        '2. Document design strategy and rationale',
        '3. Summarize screen inventory and coverage',
        '4. Document interaction design patterns used',
        '5. Summarize animation and motion design approach',
        '6. Document accessibility considerations',
        '7. Summarize user testing findings and iterations',
        '8. Document design system and component usage',
        '9. Create prototype user guide',
        '10. Document known limitations and future enhancements',
        '11. Include metrics and validation results',
        '12. Create presentation deck for stakeholders',
        '13. Generate executive summary',
        '14. Compile all documentation into organized structure'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['projectOverviewPath', 'userGuidePath', 'artifacts'],
      properties: {
        projectOverviewPath: { type: 'string' },
        userGuidePath: { type: 'string' },
        presentationDeckPath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'documentation']
}));

// Phase 21: Final Validation
export const prototypeValidationTask = defineTask('prototype-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 21: Final Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UX/UI Design Lead and Quality Assurance',
      task: 'Validate prototype completeness and quality for production handoff',
      context: {
        projectName: args.projectName,
        totalScreensCreated: args.totalScreensCreated,
        interactionsImplemented: args.interactionsImplemented,
        animationsCreated: args.animationsCreated,
        strategyPlanning: args.strategyPlanning,
        screenDesignResults: args.screenDesignResults,
        interactionDesign: args.interactionDesign,
        userTestingResults: args.userTestingResults,
        accessibilityResults: args.accessibilityResults,
        handoffPackage: args.handoffPackage,
        prototypeUrl: args.prototypeUrl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate all planned screens are complete',
        '2. Verify all interactions are implemented',
        '3. Check all user flows are connected',
        '4. Validate animations and transitions are polished',
        '5. Review accessibility compliance',
        '6. Verify design system consistency',
        '7. Review user testing results and iterations',
        '8. Validate handoff package completeness',
        '9. Check documentation is comprehensive',
        '10. Verify prototype works on target devices',
        '11. Review against project requirements',
        '12. Calculate validation score (0-100)',
        '13. Determine production readiness',
        '14. Provide verdict and recommendations',
        '15. Generate final validation report'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'productionReady', 'verdict', 'recommendation', 'reportPath', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        productionReady: { type: 'boolean' },
        qualityGates: {
          type: 'object',
          properties: {
            screensComplete: { type: 'boolean' },
            interactionsImplemented: { type: 'boolean' },
            flowsConnected: { type: 'boolean' },
            animationsPolished: { type: 'boolean' },
            accessibilityValidated: { type: 'boolean' },
            userTestingComplete: { type: 'boolean' },
            handoffPackageReady: { type: 'boolean' },
            documentationComplete: { type: 'boolean' }
          }
        },
        verdict: { type: 'string' },
        recommendation: { type: 'string', enum: ['approve', 'conditional-approve', 'revisions-required'] },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-ui', 'validation', 'quality-assurance']
}));

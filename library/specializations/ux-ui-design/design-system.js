/**
 * @process specializations/ux-ui-design/design-system
 * @description Design System Creation - Comprehensive process for creating a scalable, accessible, and maintainable design system
 * including design audit, principles establishment, foundational systems (color, typography, spacing), component library,
 * design tokens, implementation guidelines, documentation, and governance with quality gates and stakeholder approval.
 * @inputs { projectName: string, brandGuidelines?: object, targetPlatforms?: array, designTool?: string, techStack?: object, accessibilityLevel?: string, outputDir?: string }
 * @outputs { success: boolean, designSystem: object, tokens: object, components: array, documentation: object, implementation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/design-system', {
 *   projectName: 'Acme Corp Design System',
 *   brandGuidelines: {
 *     primaryColor: '#0066CC',
 *     fontFamily: 'Inter',
 *     brandValues: ['trust', 'innovation', 'simplicity']
 *   },
 *   targetPlatforms: ['web', 'ios', 'android'],
 *   designTool: 'figma',
 *   techStack: {
 *     framework: 'react',
 *     styling: 'styled-components',
 *     storybook: true
 *   },
 *   accessibilityLevel: 'WCAG-AA'
 * });
 *
 * @references
 * - Atomic Design: https://atomicdesign.bradfrost.com/
 * - Design Tokens: https://design-tokens.github.io/community-group/format/
 * - Material Design: https://material.io/design
 * - Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
 * - Inclusive Design Principles: https://inclusivedesignprinciples.org/
 * - Design Systems Handbook: https://www.designbetter.co/design-systems-handbook
 * - Style Dictionary: https://amzn.github.io/style-dictionary/
 * - Figma Design Tokens: https://www.figma.com/community/plugin/888356646278934516/Design-Tokens
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    brandGuidelines = {},
    targetPlatforms = ['web'],
    designTool = 'figma',
    techStack = {
      framework: 'react',
      styling: 'css',
      storybook: true
    },
    accessibilityLevel = 'WCAG-AA',
    existingDesigns = [],
    componentScope = 'comprehensive', // 'minimal', 'standard', 'comprehensive'
    includeMotion = true,
    includeIllustration = false,
    outputDir = 'design-system-output',
    documentationSite = true,
    implementationRequired = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const recommendations = [];
  let designSystem = {};
  let tokens = {};
  let components = [];
  let documentation = {};
  let implementation = {};

  ctx.log('info', `Starting Design System Creation: ${projectName}`);
  ctx.log('info', `Target Platforms: ${targetPlatforms.join(', ')}, Design Tool: ${designTool}`);
  ctx.log('info', `Accessibility Level: ${accessibilityLevel}, Component Scope: ${componentScope}`);

  // ============================================================================
  // PHASE 1: DESIGN AUDIT AND INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting design audit and inventory');
  const designAudit = await ctx.task(designAuditTask, {
    projectName,
    existingDesigns,
    targetPlatforms,
    brandGuidelines,
    outputDir
  });

  if (!designAudit.success) {
    return {
      success: false,
      error: 'Design audit failed',
      details: designAudit,
      metadata: {
        processId: 'specializations/ux-ui-design/design-system',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...designAudit.artifacts);
  recommendations.push(...designAudit.recommendations);

  ctx.log('info', `Design audit complete: ${designAudit.inconsistenciesFound} inconsistencies found`);

  // Quality Gate: Audit completeness
  if (designAudit.coverageScore < 70) {
    await ctx.breakpoint({
      question: `Design audit coverage: ${designAudit.coverageScore}% (below 70% threshold). Audit may be incomplete. Review findings and decide: supplement audit, continue with gaps documented, or abort?`,
      title: 'Design Audit Coverage Check',
      context: {
        runId: ctx.runId,
        coverageScore: designAudit.coverageScore,
        auditedAreas: designAudit.auditedAreas,
        missingAreas: designAudit.missingAreas,
        inconsistencies: designAudit.inconsistenciesFound,
        files: designAudit.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: DESIGN PRINCIPLES ESTABLISHMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Establishing design principles and values');
  const designPrinciples = await ctx.task(designPrinciplesTask, {
    projectName,
    brandGuidelines,
    designAudit,
    targetPlatforms,
    accessibilityLevel,
    outputDir
  });

  artifacts.push(...designPrinciples.artifacts);
  recommendations.push(...designPrinciples.recommendations);

  // Breakpoint: Review and approve design principles
  await ctx.breakpoint({
    question: `Design principles established: ${designPrinciples.principles.length} core principles defined. Review principles and approve to proceed with foundational systems?`,
    title: 'Design Principles Review',
    context: {
      runId: ctx.runId,
      principles: designPrinciples.principles,
      values: designPrinciples.values,
      goals: designPrinciples.goals,
      files: [
        { path: designPrinciples.principlesDocPath, format: 'markdown', label: 'Design Principles Document' },
        { path: designPrinciples.visualExamplesPath, format: 'pdf', label: 'Visual Examples' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: COLOR SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing color system');
  const colorSystem = await ctx.task(colorSystemTask, {
    projectName,
    brandGuidelines,
    designPrinciples,
    accessibilityLevel,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...colorSystem.artifacts);
  recommendations.push(...colorSystem.recommendations);

  ctx.log('info', `Color system: ${colorSystem.palettes.length} palettes, ${colorSystem.totalColors} colors defined`);

  // Quality Gate: Color contrast compliance
  if (colorSystem.accessibilityScore < 100 && accessibilityLevel !== 'none') {
    await ctx.breakpoint({
      question: `Color system accessibility: ${colorSystem.accessibilityScore}% compliant with ${accessibilityLevel}. ${colorSystem.contrastIssues} contrast issues found. Review and fix color combinations?`,
      title: 'Color Accessibility Check',
      context: {
        runId: ctx.runId,
        accessibilityScore: colorSystem.accessibilityScore,
        targetLevel: accessibilityLevel,
        contrastIssues: colorSystem.contrastIssues,
        problematicCombinations: colorSystem.problematicCombinations,
        files: [
          { path: colorSystem.paletteDocPath, format: 'html', label: 'Color Palettes' },
          { path: colorSystem.contrastReportPath, format: 'html', label: 'Contrast Analysis' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 4: TYPOGRAPHY SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing typography system');
  const typographySystem = await ctx.task(typographySystemTask, {
    projectName,
    brandGuidelines,
    designPrinciples,
    targetPlatforms,
    accessibilityLevel,
    outputDir
  });

  artifacts.push(...typographySystem.artifacts);
  recommendations.push(...typographySystem.recommendations);

  ctx.log('info', `Typography: ${typographySystem.typeScales.length} scales, ${typographySystem.fontFamilies.length} font families`);

  // ============================================================================
  // PHASE 5: SPACING AND LAYOUT SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing spacing and layout system');
  const spacingSystem = await ctx.task(spacingSystemTask, {
    projectName,
    designPrinciples,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...spacingSystem.artifacts);

  ctx.log('info', `Spacing system: ${spacingSystem.spacingScale.length} scale values, ${spacingSystem.gridSystems.length} grid systems`);

  // ============================================================================
  // PHASE 6: FOUNDATIONAL SYSTEMS (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing additional foundational systems in parallel');

  const foundationalTasks = [
    () => ctx.task(elevationSystemTask, {
      projectName,
      designPrinciples,
      targetPlatforms,
      outputDir
    }),
    () => ctx.task(borderRadiusSystemTask, {
      projectName,
      designPrinciples,
      outputDir
    }),
    () => ctx.task(iconographySystemTask, {
      projectName,
      brandGuidelines,
      designPrinciples,
      outputDir
    })
  ];

  if (includeMotion) {
    foundationalTasks.push(() => ctx.task(motionSystemTask, {
      projectName,
      designPrinciples,
      targetPlatforms,
      accessibilityLevel,
      outputDir
    }));
  }

  if (includeIllustration) {
    foundationalTasks.push(() => ctx.task(illustrationSystemTask, {
      projectName,
      brandGuidelines,
      designPrinciples,
      outputDir
    }));
  }

  const foundationalSystems = await ctx.parallel.all(foundationalTasks);

  foundationalSystems.forEach(system => {
    artifacts.push(...system.artifacts);
    if (system.recommendations) {
      recommendations.push(...system.recommendations);
    }
  });

  ctx.log('info', `Foundational systems complete: ${foundationalSystems.length} systems defined`);

  // ============================================================================
  // PHASE 7: DESIGN TOKENS CREATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating design tokens');
  const designTokens = await ctx.task(designTokensTask, {
    projectName,
    colorSystem,
    typographySystem,
    spacingSystem,
    foundationalSystems,
    targetPlatforms,
    techStack,
    outputDir
  });

  artifacts.push(...designTokens.artifacts);
  tokens = designTokens.tokens;

  ctx.log('info', `Design tokens: ${designTokens.tokenCount} tokens across ${designTokens.categories.length} categories`);

  // Breakpoint: Review design tokens
  await ctx.breakpoint({
    question: `Design tokens created: ${designTokens.tokenCount} tokens defined. Review token structure and naming conventions. Approve to proceed with component design?`,
    title: 'Design Tokens Review',
    context: {
      runId: ctx.runId,
      tokenCount: designTokens.tokenCount,
      categories: designTokens.categories,
      platforms: designTokens.platformOutputs,
      files: [
        { path: designTokens.tokensJsonPath, format: 'json', label: 'Design Tokens (JSON)' },
        { path: designTokens.tokensDocPath, format: 'markdown', label: 'Tokens Documentation' },
        ...designTokens.platformFiles.map(f => ({ path: f.path, format: f.format, label: f.label }))
      ]
    }
  });

  // ============================================================================
  // PHASE 8: COMPONENT LIBRARY PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 8: Planning component library structure');
  const componentPlanning = await ctx.task(componentPlanningTask, {
    projectName,
    componentScope,
    targetPlatforms,
    designAudit,
    designPrinciples,
    outputDir
  });

  artifacts.push(...componentPlanning.artifacts);

  const componentsByCategory = componentPlanning.componentsByCategory;
  const totalComponents = Object.values(componentsByCategory).flat().length;

  ctx.log('info', `Component library planned: ${totalComponents} components across ${Object.keys(componentsByCategory).length} categories`);

  // ============================================================================
  // PHASE 9: COMPONENT DESIGN (PARALLEL BY CATEGORY)
  // ============================================================================

  ctx.log('info', 'Phase 9: Designing components in parallel by category');

  const componentDesignTasks = Object.entries(componentsByCategory)
    .filter(([_, components]) => components.length > 0)
    .map(([category, components]) =>
      () => ctx.task(componentCategoryDesignTask, {
        projectName,
        category,
        components,
        colorSystem,
        typographySystem,
        spacingSystem,
        foundationalSystems,
        designTokens,
        accessibilityLevel,
        designTool,
        outputDir
      })
    );

  const componentDesigns = await ctx.parallel.all(componentDesignTasks);

  componentDesigns.forEach(design => {
    components.push(...design.components);
    artifacts.push(...design.artifacts);
    recommendations.push(...design.recommendations);
  });

  ctx.log('info', `Components designed: ${components.length} components with variants and states`);

  // Quality Gate: Component accessibility
  const accessibilityIssues = components.filter(c => c.accessibilityScore < 90).length;
  if (accessibilityIssues > 0 && accessibilityLevel !== 'none') {
    await ctx.breakpoint({
      question: `${accessibilityIssues} components have accessibility scores below 90%. Review components and address accessibility issues?`,
      title: 'Component Accessibility Review',
      context: {
        runId: ctx.runId,
        accessibilityIssues,
        totalComponents: components.length,
        componentsWithIssues: components.filter(c => c.accessibilityScore < 90).map(c => ({
          name: c.name,
          score: c.accessibilityScore,
          issues: c.accessibilityIssues
        })),
        files: componentDesigns.flatMap(d => d.artifacts.map(a => ({ path: a.path, format: a.format, label: a.label })))
      }
    });
  }

  // ============================================================================
  // PHASE 10: COMPONENT DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating component documentation');
  const componentDocs = await ctx.task(componentDocumentationTask, {
    projectName,
    components,
    designTokens,
    accessibilityLevel,
    outputDir
  });

  artifacts.push(...componentDocs.artifacts);

  // ============================================================================
  // PHASE 11: DESIGN TOOL LIBRARY SETUP
  // ============================================================================

  ctx.log('info', `Phase 11: Setting up ${designTool} design library`);
  const designToolSetup = await ctx.task(designToolLibraryTask, {
    projectName,
    designTool,
    colorSystem,
    typographySystem,
    spacingSystem,
    foundationalSystems,
    components,
    designTokens,
    outputDir
  });

  artifacts.push(...designToolSetup.artifacts);

  ctx.log('info', `${designTool} library: ${designToolSetup.librariesCreated} libraries, ${designToolSetup.componentsPublished} components published`);

  // Breakpoint: Review design tool setup
  await ctx.breakpoint({
    question: `${designTool} design library created with ${designToolSetup.componentsPublished} components. Review library organization and approve to proceed with code implementation?`,
    title: `${designTool} Library Review`,
    context: {
      runId: ctx.runId,
      designTool,
      librariesCreated: designToolSetup.librariesCreated,
      componentsPublished: designToolSetup.componentsPublished,
      libraryLinks: designToolSetup.libraryLinks,
      files: [
        { path: designToolSetup.setupGuidePath, format: 'markdown', label: 'Setup Guide' },
        { path: designToolSetup.usageGuidePath, format: 'markdown', label: 'Usage Guide' }
      ]
    }
  });

  // ============================================================================
  // PHASE 12: CODE IMPLEMENTATION SETUP
  // ============================================================================

  let codeImplementation = null;
  if (implementationRequired) {
    ctx.log('info', 'Phase 12: Setting up code implementation');
    codeImplementation = await ctx.task(codeImplementationSetupTask, {
      projectName,
      techStack,
      designTokens,
      components,
      targetPlatforms,
      outputDir
    });

    artifacts.push(...codeImplementation.artifacts);
    implementation = codeImplementation.implementation;

    ctx.log('info', `Code setup: ${codeImplementation.packagesCreated} packages, ${codeImplementation.componentsScaffolded} components scaffolded`);
  }

  // ============================================================================
  // PHASE 13: COMPONENT IMPLEMENTATION (PARALLEL)
  // ============================================================================

  let componentImplementations = [];
  if (implementationRequired) {
    ctx.log('info', 'Phase 13: Implementing components in parallel');

    // Implement foundational components first
    const foundationalComponents = components.filter(c => c.category === 'atoms' || c.priority === 'high');
    const supportingComponents = components.filter(c => c.category !== 'atoms' && c.priority !== 'high');

    // Phase 13a: Foundational components
    const foundationalImplTasks = foundationalComponents.map(component =>
      () => ctx.task(componentImplementationTask, {
        projectName,
        component,
        techStack,
        designTokens,
        codeImplementation,
        outputDir
      })
    );

    const foundationalImpls = await ctx.parallel.all(foundationalImplTasks);
    componentImplementations.push(...foundationalImpls);

    artifacts.push(...foundationalImpls.flatMap(impl => impl.artifacts));

    ctx.log('info', `Foundational components implemented: ${foundationalComponents.length}`);

    // Phase 13b: Supporting components
    if (supportingComponents.length > 0) {
      const supportingImplTasks = supportingComponents.map(component =>
        () => ctx.task(componentImplementationTask, {
          projectName,
          component,
          techStack,
          designTokens,
          codeImplementation,
          outputDir
        })
      );

      const supportingImpls = await ctx.parallel.all(supportingImplTasks);
      componentImplementations.push(...supportingImpls);

      artifacts.push(...supportingImpls.flatMap(impl => impl.artifacts));

      ctx.log('info', `Supporting components implemented: ${supportingComponents.length}`);
    }

    ctx.log('info', `Total components implemented: ${componentImplementations.length}`);
  }

  // ============================================================================
  // PHASE 14: STORYBOOK SETUP AND DOCUMENTATION
  // ============================================================================

  let storybookSetup = null;
  if (implementationRequired && techStack.storybook) {
    ctx.log('info', 'Phase 14: Setting up Storybook documentation');
    storybookSetup = await ctx.task(storybookSetupTask, {
      projectName,
      components,
      componentImplementations,
      designTokens,
      techStack,
      outputDir
    });

    artifacts.push(...storybookSetup.artifacts);

    ctx.log('info', `Storybook: ${storybookSetup.storiesCreated} stories, ${storybookSetup.addonsInstalled.length} addons installed`);
  }

  // ============================================================================
  // PHASE 15: ACCESSIBILITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 15: Testing component accessibility');
  const accessibilityTesting = await ctx.task(accessibilityTestingTask, {
    projectName,
    components: implementationRequired ? componentImplementations : components,
    accessibilityLevel,
    storybookSetup,
    outputDir
  });

  artifacts.push(...accessibilityTesting.artifacts);

  const accessibilityScore = accessibilityTesting.overallScore;
  ctx.log('info', `Accessibility testing complete: ${accessibilityScore}% score, ${accessibilityTesting.violationsFound} violations`);

  // Quality Gate: Accessibility compliance
  const requiredScore = accessibilityLevel === 'WCAG-AAA' ? 95 : 85;
  if (accessibilityScore < requiredScore) {
    await ctx.breakpoint({
      question: `Accessibility score: ${accessibilityScore}% (below ${requiredScore}% for ${accessibilityLevel}). ${accessibilityTesting.violationsFound} violations found. Review and remediate accessibility issues?`,
      title: 'Accessibility Compliance Gate',
      context: {
        runId: ctx.runId,
        score: accessibilityScore,
        requiredScore,
        targetLevel: accessibilityLevel,
        violations: accessibilityTesting.violations,
        criticalIssues: accessibilityTesting.criticalIssues,
        files: [
          { path: accessibilityTesting.reportPath, format: 'html', label: 'Accessibility Report' },
          { path: accessibilityTesting.remediationPlanPath, format: 'markdown', label: 'Remediation Plan' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 16: DOCUMENTATION SITE CREATION
  // ============================================================================

  let documentationSiteSetup = null;
  if (documentationSite) {
    ctx.log('info', 'Phase 16: Creating documentation site');
    documentationSiteSetup = await ctx.task(documentationSiteTask, {
      projectName,
      designPrinciples,
      colorSystem,
      typographySystem,
      spacingSystem,
      foundationalSystems,
      components,
      designTokens,
      componentDocs,
      storybookSetup,
      accessibilityTesting,
      outputDir
    });

    artifacts.push(...documentationSiteSetup.artifacts);
    documentation = documentationSiteSetup.documentation;

    ctx.log('info', `Documentation site: ${documentationSiteSetup.pagesCreated} pages, deployed at ${documentationSiteSetup.siteUrl}`);
  }

  // ============================================================================
  // PHASE 17: USAGE GUIDELINES AND EXAMPLES
  // ============================================================================

  ctx.log('info', 'Phase 17: Creating usage guidelines and examples');
  const usageGuidelines = await ctx.task(usageGuidelinesTask, {
    projectName,
    designPrinciples,
    components,
    designTokens,
    codeImplementation,
    storybookSetup,
    outputDir
  });

  artifacts.push(...usageGuidelines.artifacts);

  // ============================================================================
  // PHASE 18: CONTRIBUTION AND GOVERNANCE
  // ============================================================================

  ctx.log('info', 'Phase 18: Establishing contribution guidelines and governance');
  const governance = await ctx.task(governanceTask, {
    projectName,
    designPrinciples,
    components,
    implementationRequired,
    outputDir
  });

  artifacts.push(...governance.artifacts);

  // ============================================================================
  // PHASE 19: VERSIONING AND RELEASE STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 19: Defining versioning and release strategy');
  const releaseStrategy = await ctx.task(releaseStrategyTask, {
    projectName,
    implementationRequired,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...releaseStrategy.artifacts);

  // ============================================================================
  // PHASE 20: DESIGN SYSTEM VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 20: Validating design system completeness');
  const validation = await ctx.task(designSystemValidationTask, {
    projectName,
    designPrinciples,
    colorSystem,
    typographySystem,
    spacingSystem,
    foundationalSystems,
    components,
    designTokens,
    codeImplementation,
    storybookSetup,
    accessibilityTesting,
    documentationSiteSetup,
    governance,
    releaseStrategy,
    componentScope,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const validationScore = validation.completenessScore;
  ctx.log('info', `Design system validation: ${validationScore}% complete`);

  // Quality Gate: Design system completeness
  if (validationScore < 85) {
    await ctx.breakpoint({
      question: `Design system completeness: ${validationScore}% (below 85% threshold). Missing: ${validation.missingElements.join(', ')}. Address gaps before finalizing?`,
      title: 'Design System Completeness Check',
      context: {
        runId: ctx.runId,
        completenessScore: validationScore,
        missingElements: validation.missingElements,
        completedSections: validation.completedSections,
        recommendations: validation.recommendations,
        files: [
          { path: validation.reportPath, format: 'html', label: 'Validation Report' },
          { path: validation.checklistPath, format: 'markdown', label: 'Completeness Checklist' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 21: FINAL REVIEW AND HANDOFF
  // ============================================================================

  ctx.log('info', 'Phase 21: Conducting final review and preparing handoff');
  const finalReview = await ctx.task(finalReviewTask, {
    projectName,
    validation,
    accessibilityTesting,
    documentationSiteSetup,
    governance,
    releaseStrategy,
    artifacts,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Final Breakpoint: Design system approval
  await ctx.breakpoint({
    question: `Design System creation complete. Completeness: ${validationScore}%, Accessibility: ${accessibilityScore}%, ${components.length} components. ${finalReview.verdict}. Approve for launch and handoff to teams?`,
    title: 'Final Design System Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        completenessScore: validationScore,
        accessibilityScore,
        componentsCount: components.length,
        tokensCount: designTokens.tokenCount,
        platformsSupported: targetPlatforms,
        implementationReady: implementationRequired
      },
      verdict: finalReview.verdict,
      strengths: finalReview.strengths,
      concerns: finalReview.concerns,
      launchReady: finalReview.launchReady,
      files: [
        { path: finalReview.summaryPath, format: 'pdf', label: 'Executive Summary' },
        { path: finalReview.handoffGuidePath, format: 'markdown', label: 'Handoff Guide' },
        ...(documentationSiteSetup ? [{ path: documentationSiteSetup.siteUrl, format: 'url', label: 'Documentation Site' }] : []),
        ...(storybookSetup ? [{ path: storybookSetup.storybookUrl, format: 'url', label: 'Storybook' }] : [])
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  // Assemble design system object
  designSystem = {
    name: projectName,
    version: releaseStrategy.initialVersion,
    principles: designPrinciples.principles,
    foundations: {
      colors: colorSystem,
      typography: typographySystem,
      spacing: spacingSystem,
      ...foundationalSystems.reduce((acc, sys) => ({ ...acc, [sys.name]: sys }), {})
    },
    tokens: designTokens.tokens,
    components: components.map(c => ({
      name: c.name,
      category: c.category,
      variants: c.variants,
      props: c.props,
      accessibilityScore: c.accessibilityScore
    })),
    implementation: codeImplementation ? {
      framework: techStack.framework,
      packages: codeImplementation.packages,
      ready: true
    } : { ready: false },
    documentation: documentationSiteSetup ? {
      url: documentationSiteSetup.siteUrl,
      pages: documentationSiteSetup.pagesCreated
    } : null,
    governance: governance.guidelines,
    accessibility: {
      level: accessibilityLevel,
      score: accessibilityScore,
      compliant: accessibilityScore >= requiredScore
    }
  };

  return {
    success: true,
    projectName,
    designSystem,
    tokens,
    components: components.map(c => ({
      name: c.name,
      category: c.category,
      status: c.status,
      accessibilityScore: c.accessibilityScore
    })),
    documentation,
    implementation,
    metrics: {
      completenessScore: validationScore,
      accessibilityScore,
      componentsCreated: components.length,
      tokensCreated: designTokens.tokenCount,
      platformsSupported: targetPlatforms.length,
      pagesDocumented: documentationSiteSetup?.pagesCreated || 0
    },
    launchReady: finalReview.launchReady,
    handoff: {
      guidePath: finalReview.handoffGuidePath,
      documentationUrl: documentationSiteSetup?.siteUrl,
      storybookUrl: storybookSetup?.storybookUrl,
      designLibraryLinks: designToolSetup.libraryLinks
    },
    artifacts,
    recommendations,
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/design-system',
      timestamp: startTime,
      designTool,
      techStack,
      accessibilityLevel,
      componentScope
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Design Audit
export const designAuditTask = defineTask('design-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design Audit - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UX Auditor and Design Systems Specialist',
      task: 'Conduct comprehensive design audit and inventory of existing designs',
      context: {
        projectName: args.projectName,
        existingDesigns: args.existingDesigns,
        targetPlatforms: args.targetPlatforms,
        brandGuidelines: args.brandGuidelines,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Audit existing design files, screens, and components',
        '2. Inventory all colors, typography, spacing, and component patterns',
        '3. Identify design inconsistencies and variations',
        '4. Document common patterns and repeated elements',
        '5. Analyze brand guideline adherence',
        '6. Identify accessibility issues in current designs',
        '7. Document UI patterns across different platforms',
        '8. Create visual inventory with screenshots/examples',
        '9. Assess design debt and technical constraints',
        '10. Calculate coverage score and identify gaps',
        '11. Provide recommendations for design system scope',
        '12. Generate comprehensive audit report'
      ],
      outputFormat: 'JSON object with audit findings and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'coverageScore', 'inconsistenciesFound', 'auditedAreas', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        coverageScore: { type: 'number', minimum: 0, maximum: 100 },
        inconsistenciesFound: { type: 'number' },
        auditedAreas: {
          type: 'array',
          items: { type: 'string' }
        },
        missingAreas: {
          type: 'array',
          items: { type: 'string' }
        },
        inventory: {
          type: 'object',
          properties: {
            colors: { type: 'number' },
            fonts: { type: 'number' },
            components: { type: 'number' },
            patterns: { type: 'number' }
          }
        },
        inconsistencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              instances: { type: 'number' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        auditReportPath: { type: 'string' },
        inventoryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'audit', 'ux']
}));

// Phase 2: Design Principles
export const designPrinciplesTask = defineTask('design-principles', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Design Principles - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Strategy Lead and Brand Architect',
      task: 'Establish core design principles and values for the design system',
      context: {
        projectName: args.projectName,
        brandGuidelines: args.brandGuidelines,
        designAudit: args.designAudit,
        targetPlatforms: args.targetPlatforms,
        accessibilityLevel: args.accessibilityLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define core design principles (4-7 principles)',
        '2. Establish brand values and personality',
        '3. Define design system goals and objectives',
        '4. Create principle statements with rationale',
        '5. Develop visual examples for each principle',
        '6. Define accessibility commitment and approach',
        '7. Establish inclusive design guidelines',
        '8. Define platform-specific considerations',
        '9. Create dos and don\'ts for each principle',
        '10. Document decision-making framework',
        '11. Create visual examples and mood boards',
        '12. Generate principles documentation'
      ],
      outputFormat: 'JSON object with design principles and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['principles', 'values', 'goals', 'recommendations', 'artifacts'],
      properties: {
        principles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              statement: { type: 'string' },
              rationale: { type: 'string' },
              examples: { type: 'array' }
            }
          }
        },
        values: {
          type: 'array',
          items: { type: 'string' }
        },
        goals: {
          type: 'array',
          items: { type: 'string' }
        },
        accessibilityCommitment: { type: 'string' },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        principlesDocPath: { type: 'string' },
        visualExamplesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'principles', 'strategy']
}));

// Phase 3: Color System
export const colorSystemTask = defineTask('color-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Color System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Color Specialist and Accessibility Expert',
      task: 'Design comprehensive color system with accessibility compliance',
      context: {
        projectName: args.projectName,
        brandGuidelines: args.brandGuidelines,
        designPrinciples: args.designPrinciples,
        accessibilityLevel: args.accessibilityLevel,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define primary, secondary, and accent color palettes',
        '2. Create semantic color tokens (success, error, warning, info)',
        '3. Generate tonal scales for each color (50-900)',
        '4. Design neutral/gray scale palette',
        '5. Create text color hierarchy (primary, secondary, tertiary)',
        '6. Define interactive state colors (hover, active, disabled, focus)',
        '7. Test all color combinations for WCAG contrast compliance',
        '8. Create dark mode color variants if needed',
        '9. Define color usage guidelines and constraints',
        '10. Document color accessibility requirements',
        '11. Generate color palette documentation with swatches',
        '12. Create contrast analysis report'
      ],
      outputFormat: 'JSON object with color system and accessibility analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['palettes', 'totalColors', 'accessibilityScore', 'recommendations', 'artifacts'],
      properties: {
        palettes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              colors: { type: 'array' },
              usage: { type: 'string' }
            }
          }
        },
        totalColors: { type: 'number' },
        semanticColors: {
          type: 'object',
          properties: {
            success: { type: 'string' },
            error: { type: 'string' },
            warning: { type: 'string' },
            info: { type: 'string' }
          }
        },
        accessibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        contrastIssues: { type: 'number' },
        problematicCombinations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              foreground: { type: 'string' },
              background: { type: 'string' },
              ratio: { type: 'number' },
              required: { type: 'number' }
            }
          }
        },
        darkModeSupport: { type: 'boolean' },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        paletteDocPath: { type: 'string' },
        contrastReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'color', 'accessibility']
}));

// Phase 4: Typography System
export const typographySystemTask = defineTask('typography-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Typography System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Typography Specialist and Type Designer',
      task: 'Design comprehensive typography system with responsive scaling',
      context: {
        projectName: args.projectName,
        brandGuidelines: args.brandGuidelines,
        designPrinciples: args.designPrinciples,
        targetPlatforms: args.targetPlatforms,
        accessibilityLevel: args.accessibilityLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select and define font families (primary, secondary, monospace)',
        '2. Create type scale using modular scale or custom scale',
        '3. Define font weights and when to use each',
        '4. Create text styles (heading 1-6, body, caption, etc.)',
        '5. Define line heights for optimal readability',
        '6. Set letter spacing for different sizes',
        '7. Create responsive typography scales for different breakpoints',
        '8. Define text hierarchy and semantic meaning',
        '9. Establish font loading strategy',
        '10. Define accessibility requirements (minimum sizes, contrast)',
        '11. Create typography usage guidelines',
        '12. Generate type specimen and documentation'
      ],
      outputFormat: 'JSON object with typography system'
    },
    outputSchema: {
      type: 'object',
      required: ['fontFamilies', 'typeScales', 'textStyles', 'recommendations', 'artifacts'],
      properties: {
        fontFamilies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['primary', 'secondary', 'monospace'] },
              fallback: { type: 'string' },
              weights: { type: 'array' }
            }
          }
        },
        typeScales: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              baseSize: { type: 'number' },
              ratio: { type: 'number' },
              sizes: { type: 'array' }
            }
          }
        },
        textStyles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              fontSize: { type: 'string' },
              fontWeight: { type: 'string' },
              lineHeight: { type: 'string' },
              letterSpacing: { type: 'string' }
            }
          }
        },
        responsiveScales: {
          type: 'object',
          properties: {
            mobile: { type: 'object' },
            tablet: { type: 'object' },
            desktop: { type: 'object' }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        specimenPath: { type: 'string' },
        usageGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'typography']
}));

// Phase 5: Spacing System
export const spacingSystemTask = defineTask('spacing-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Spacing and Layout System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Layout Specialist and Grid System Designer',
      task: 'Design comprehensive spacing and layout system',
      context: {
        projectName: args.projectName,
        designPrinciples: args.designPrinciples,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define base spacing unit (typically 4px or 8px)',
        '2. Create spacing scale (xs, sm, md, lg, xl, etc.)',
        '3. Define margin and padding conventions',
        '4. Create grid system for layouts',
        '5. Define breakpoints for responsive design',
        '6. Create container sizes and max-widths',
        '7. Define column configurations for different screens',
        '8. Create gap/gutter spacing rules',
        '9. Define component spacing patterns',
        '10. Create vertical rhythm guidelines',
        '11. Document spacing usage guidelines',
        '12. Generate spacing visualization and examples'
      ],
      outputFormat: 'JSON object with spacing and layout system'
    },
    outputSchema: {
      type: 'object',
      required: ['spacingScale', 'gridSystems', 'breakpoints', 'artifacts'],
      properties: {
        baseUnit: { type: 'number' },
        spacingScale: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
              pixels: { type: 'number' }
            }
          }
        },
        gridSystems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              columns: { type: 'number' },
              gutter: { type: 'string' },
              maxWidth: { type: 'string' }
            }
          }
        },
        breakpoints: {
          type: 'object',
          properties: {
            mobile: { type: 'string' },
            tablet: { type: 'string' },
            desktop: { type: 'string' },
            wide: { type: 'string' }
          }
        },
        containers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              maxWidth: { type: 'string' },
              padding: { type: 'string' }
            }
          }
        },
        usageGuidePath: { type: 'string' },
        visualizationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'spacing', 'layout']
}));

// Phase 6a: Elevation System
export const elevationSystemTask = defineTask('elevation-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Elevation System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI Designer specializing in depth and hierarchy',
      task: 'Design elevation system using shadows and layers',
      context: {
        projectName: args.projectName,
        designPrinciples: args.designPrinciples,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define elevation levels (0-24 typically)',
        '2. Create shadow styles for each elevation level',
        '3. Define when to use each elevation level',
        '4. Create layering hierarchy guidelines',
        '5. Design focus states with elevation changes',
        '6. Create platform-specific adaptations',
        '7. Define dark mode shadow variants',
        '8. Document elevation usage patterns',
        '9. Generate elevation examples and visualizations'
      ],
      outputFormat: 'JSON object with elevation system'
    },
    outputSchema: {
      type: 'object',
      required: ['name', 'elevationLevels', 'artifacts'],
      properties: {
        name: { type: 'string', const: 'elevation' },
        elevationLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              shadow: { type: 'string' },
              usage: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        docPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'elevation', 'shadows']
}));

// Phase 6b: Border Radius System
export const borderRadiusSystemTask = defineTask('border-radius-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Border Radius System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI Designer specializing in component styling',
      task: 'Design border radius system for consistent rounded corners',
      context: {
        projectName: args.projectName,
        designPrinciples: args.designPrinciples,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define border radius scale (none, sm, md, lg, xl, full)',
        '2. Create usage guidelines for each radius size',
        '3. Define component-specific radius rules',
        '4. Document when to use sharp vs rounded corners',
        '5. Generate border radius examples'
      ],
      outputFormat: 'JSON object with border radius system'
    },
    outputSchema: {
      type: 'object',
      required: ['name', 'radiusScale', 'artifacts'],
      properties: {
        name: { type: 'string', const: 'borderRadius' },
        radiusScale: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
              usage: { type: 'string' }
            }
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
  labels: ['agent', 'design-system', 'border-radius']
}));

// Phase 6c: Iconography System
export const iconographySystemTask = defineTask('iconography-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Iconography System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Icon Designer and Visual Systems Specialist',
      task: 'Design comprehensive iconography system',
      context: {
        projectName: args.projectName,
        brandGuidelines: args.brandGuidelines,
        designPrinciples: args.designPrinciples,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define icon style (outline, filled, two-tone)',
        '2. Establish icon grid and sizing system',
        '3. Create size scale (16, 20, 24, 32, 48)',
        '4. Define stroke width and corner radius for icons',
        '5. Create icon categories and naming conventions',
        '6. Design core icon set (minimum 50-100 icons)',
        '7. Define icon usage guidelines',
        '8. Create accessibility guidelines for icons',
        '9. Document icon creation process',
        '10. Generate icon library documentation'
      ],
      outputFormat: 'JSON object with iconography system'
    },
    outputSchema: {
      type: 'object',
      required: ['name', 'iconStyle', 'sizes', 'artifacts'],
      properties: {
        name: { type: 'string', const: 'iconography' },
        iconStyle: { type: 'string' },
        sizes: {
          type: 'array',
          items: { type: 'number' }
        },
        strokeWidth: { type: 'number' },
        iconCount: { type: 'number' },
        categories: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        libraryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'iconography', 'icons']
}));

// Phase 6d: Motion System
export const motionSystemTask = defineTask('motion-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Motion System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Motion Designer and Animation Specialist',
      task: 'Design motion and animation system',
      context: {
        projectName: args.projectName,
        designPrinciples: args.designPrinciples,
        targetPlatforms: args.targetPlatforms,
        accessibilityLevel: args.accessibilityLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define animation duration scale (fast, normal, slow)',
        '2. Create easing curves library',
        '3. Define transition types (fade, slide, scale, etc.)',
        '4. Create motion principles and guidelines',
        '5. Define performance considerations',
        '6. Create reduced motion alternatives for accessibility',
        '7. Document when to use animations',
        '8. Create animation examples and demos',
        '9. Generate motion design guidelines'
      ],
      outputFormat: 'JSON object with motion system'
    },
    outputSchema: {
      type: 'object',
      required: ['name', 'durations', 'easings', 'artifacts'],
      properties: {
        name: { type: 'string', const: 'motion' },
        durations: {
          type: 'object',
          properties: {
            fast: { type: 'string' },
            normal: { type: 'string' },
            slow: { type: 'string' }
          }
        },
        easings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              curve: { type: 'string' },
              usage: { type: 'string' }
            }
          }
        },
        transitions: {
          type: 'array',
          items: { type: 'string' }
        },
        reducedMotionSupport: { type: 'boolean' },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'motion', 'animation']
}));

// Phase 6e: Illustration System
export const illustrationSystemTask = defineTask('illustration-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Illustration System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Illustrator and Visual Designer',
      task: 'Design illustration system and guidelines',
      context: {
        projectName: args.projectName,
        brandGuidelines: args.brandGuidelines,
        designPrinciples: args.designPrinciples,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define illustration style and principles',
        '2. Create character design guidelines',
        '3. Define color usage in illustrations',
        '4. Establish perspective and composition rules',
        '5. Create illustration library structure',
        '6. Define when to use illustrations vs photos vs icons',
        '7. Create illustration templates',
        '8. Document illustration creation process',
        '9. Generate illustration style guide'
      ],
      outputFormat: 'JSON object with illustration system'
    },
    outputSchema: {
      type: 'object',
      required: ['name', 'style', 'artifacts'],
      properties: {
        name: { type: 'string', const: 'illustration' },
        style: { type: 'string' },
        principles: {
          type: 'array',
          items: { type: 'string' }
        },
        categories: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        styleGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'illustration']
}));

// Phase 7: Design Tokens
export const designTokensTask = defineTask('design-tokens', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Design Tokens - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Tokens Architect and Platform Engineer',
      task: 'Create comprehensive design tokens from all foundational systems',
      context: {
        projectName: args.projectName,
        colorSystem: args.colorSystem,
        typographySystem: args.typographySystem,
        spacingSystem: args.spacingSystem,
        foundationalSystems: args.foundationalSystems,
        targetPlatforms: args.targetPlatforms,
        techStack: args.techStack,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Convert color system to design tokens',
        '2. Convert typography system to design tokens',
        '3. Convert spacing system to design tokens',
        '4. Convert all foundational systems to design tokens',
        '5. Organize tokens into categories (color, size, space, etc.)',
        '6. Create token naming conventions (namespace.category.property.variant)',
        '7. Define token hierarchy (alias tokens referencing core tokens)',
        '8. Generate platform-specific token outputs (CSS, SCSS, JS, iOS, Android)',
        '9. Use Style Dictionary or similar tool for transformation',
        '10. Create token documentation with examples',
        '11. Generate JSON token format following W3C standard',
        '12. Create token usage guidelines'
      ],
      outputFormat: 'JSON object with design tokens'
    },
    outputSchema: {
      type: 'object',
      required: ['tokens', 'tokenCount', 'categories', 'platformOutputs', 'artifacts'],
      properties: {
        tokens: {
          type: 'object',
          description: 'Complete token structure'
        },
        tokenCount: { type: 'number' },
        categories: {
          type: 'array',
          items: { type: 'string' }
        },
        platformOutputs: {
          type: 'array',
          items: { type: 'string' }
        },
        platformFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              path: { type: 'string' },
              format: { type: 'string' },
              label: { type: 'string' }
            }
          }
        },
        tokensJsonPath: { type: 'string' },
        tokensDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'design-tokens']
}));

// Phase 8: Component Planning
export const componentPlanningTask = defineTask('component-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Component Library Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Component Library Architect and UX Engineer',
      task: 'Plan comprehensive component library structure',
      context: {
        projectName: args.projectName,
        componentScope: args.componentScope,
        targetPlatforms: args.targetPlatforms,
        designAudit: args.designAudit,
        designPrinciples: args.designPrinciples,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define component hierarchy using Atomic Design (atoms, molecules, organisms)',
        '2. Identify all required components based on scope and audit',
        '3. For minimal scope: 15-20 core components',
        '4. For standard scope: 30-40 components',
        '5. For comprehensive scope: 50+ components',
        '6. Categorize components (Layout, Input, Display, Feedback, Navigation)',
        '7. Define component naming conventions',
        '8. Identify component dependencies',
        '9. Prioritize components (critical, high, medium, low)',
        '10. Create component roadmap',
        '11. Document component requirements',
        '12. Generate component planning document'
      ],
      outputFormat: 'JSON object with component plan'
    },
    outputSchema: {
      type: 'object',
      required: ['componentsByCategory', 'totalComponents', 'artifacts'],
      properties: {
        componentsByCategory: {
          type: 'object',
          properties: {
            atoms: { type: 'array' },
            molecules: { type: 'array' },
            organisms: { type: 'array' },
            templates: { type: 'array' }
          }
        },
        totalComponents: { type: 'number' },
        componentList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              dependencies: { type: 'array' }
            }
          }
        },
        roadmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              components: { type: 'array' }
            }
          }
        },
        planningDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'component-planning']
}));

// Phase 9: Component Design by Category
export const componentCategoryDesignTask = defineTask('component-category-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Component Design - ${args.category}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Component Designer and Interaction Specialist',
      task: `Design all components in the ${args.category} category`,
      context: {
        projectName: args.projectName,
        category: args.category,
        components: args.components,
        colorSystem: args.colorSystem,
        typographySystem: args.typographySystem,
        spacingSystem: args.spacingSystem,
        foundationalSystems: args.foundationalSystems,
        designTokens: args.designTokens,
        accessibilityLevel: args.accessibilityLevel,
        designTool: args.designTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each component in the category:',
        '2. Define component purpose and use cases',
        '3. Design component anatomy and structure',
        '4. Define component variants (size, style, state)',
        '5. Design interactive states (default, hover, active, focus, disabled)',
        '6. Define component props and API',
        '7. Apply design tokens to component',
        '8. Design responsive behavior',
        '9. Define accessibility requirements (ARIA, keyboard navigation)',
        '10. Create component usage examples',
        '11. Document component specifications',
        '12. Design component in design tool (Figma/Sketch)',
        '13. Generate component documentation'
      ],
      outputFormat: 'JSON object with designed components'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'recommendations', 'artifacts'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              purpose: { type: 'string' },
              variants: { type: 'array' },
              states: { type: 'array' },
              props: { type: 'array' },
              accessibilityScore: { type: 'number', minimum: 0, maximum: 100 },
              accessibilityIssues: { type: 'array' },
              status: { type: 'string', enum: ['designed', 'reviewed', 'approved'] }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'component-design']
}));

// Phase 10: Component Documentation
export const componentDocumentationTask = defineTask('component-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Component Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and Documentation Specialist',
      task: 'Create comprehensive component documentation',
      context: {
        projectName: args.projectName,
        components: args.components,
        designTokens: args.designTokens,
        accessibilityLevel: args.accessibilityLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each component, document:',
        '2. Component overview and purpose',
        '3. Anatomy and structure diagram',
        '4. Variants and when to use each',
        '5. Props/properties reference',
        '6. Usage examples (code and visual)',
        '7. Do\'s and Don\'ts',
        '8. Accessibility guidelines',
        '9. Related components',
        '10. Design specifications',
        '11. Create component API documentation',
        '12. Generate component catalog'
      ],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentsCreated', 'artifacts'],
      properties: {
        documentsCreated: { type: 'number' },
        catalogPath: { type: 'string' },
        apiDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'documentation']
}));

// Phase 11: Design Tool Library
export const designToolLibraryTask = defineTask('design-tool-library', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: ${args.designTool} Library Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `${args.designTool} Library Specialist and Design Ops Engineer`,
      task: `Set up comprehensive ${args.designTool} design library`,
      context: {
        projectName: args.projectName,
        designTool: args.designTool,
        colorSystem: args.colorSystem,
        typographySystem: args.typographySystem,
        spacingSystem: args.spacingSystem,
        foundationalSystems: args.foundationalSystems,
        components: args.components,
        designTokens: args.designTokens,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create ${args.designTool} library structure`,
        '2. Set up color styles from color system',
        '3. Set up text styles from typography system',
        '4. Create effect styles (shadows, blurs)',
        '5. Set up grid and layout styles',
        '6. Create component variants using variants feature',
        '7. Set up component properties',
        '8. Organize components into pages/sections',
        '9. Create component documentation within design tool',
        '10. Set up design tokens plugin if available',
        '11. Create library usage examples',
        '12. Publish library for team access',
        '13. Generate library setup and usage guides'
      ],
      outputFormat: 'JSON object with library details'
    },
    outputSchema: {
      type: 'object',
      required: ['librariesCreated', 'componentsPublished', 'artifacts'],
      properties: {
        librariesCreated: { type: 'number' },
        componentsPublished: { type: 'number' },
        stylesCreated: { type: 'number' },
        libraryLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' }
            }
          }
        },
        setupGuidePath: { type: 'string' },
        usageGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'figma', 'design-tool']
}));

// Phase 12: Code Implementation Setup
export const codeImplementationSetupTask = defineTask('code-implementation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Code Implementation Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Frontend Architect and Component Library Engineer',
      task: 'Set up code implementation infrastructure for design system',
      context: {
        projectName: args.projectName,
        techStack: args.techStack,
        designTokens: args.designTokens,
        components: args.components,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize component library project structure',
        '2. Set up build tooling (Webpack, Rollup, or Vite)',
        '3. Configure TypeScript if applicable',
        '4. Set up CSS/styling infrastructure (CSS-in-JS, SCSS, etc.)',
        '5. Import and configure design tokens',
        '6. Create base component templates',
        '7. Set up testing framework (Jest, Testing Library)',
        '8. Configure linting and formatting (ESLint, Prettier)',
        '9. Set up component scaffolding scripts',
        '10. Create package.json with proper exports',
        '11. Set up documentation generation',
        '12. Generate implementation guide'
      ],
      outputFormat: 'JSON object with implementation setup'
    },
    outputSchema: {
      type: 'object',
      required: ['packagesCreated', 'componentsScaffolded', 'implementation', 'artifacts'],
      properties: {
        packagesCreated: { type: 'number' },
        componentsScaffolded: { type: 'number' },
        implementation: {
          type: 'object',
          properties: {
            rootPath: { type: 'string' },
            packagesPath: { type: 'string' },
            componentsPath: { type: 'string' },
            framework: { type: 'string' },
            buildTool: { type: 'string' }
          }
        },
        packages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        implementationGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'implementation', 'code']
}));

// Phase 13: Component Implementation
export const componentImplementationTask = defineTask('component-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Implement ${args.component.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Component Developer and Frontend Engineer',
      task: `Implement ${args.component.name} component`,
      context: {
        projectName: args.projectName,
        component: args.component,
        techStack: args.techStack,
        designTokens: args.designTokens,
        codeImplementation: args.codeImplementation,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Implement ${args.component.name} component structure`,
        '2. Apply design tokens for styling',
        '3. Implement all component variants',
        '4. Implement all interactive states',
        '5. Add prop validation and TypeScript types',
        '6. Implement accessibility features (ARIA, keyboard navigation)',
        '7. Add focus management',
        '8. Write component tests (unit, integration, accessibility)',
        '9. Create component documentation',
        '10. Export component properly',
        '11. Verify implementation against design'
      ],
      outputFormat: 'JSON object with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['componentName', 'implemented', 'testCoverage', 'artifacts'],
      properties: {
        componentName: { type: 'string' },
        implemented: { type: 'boolean' },
        filePath: { type: 'string' },
        testFilePath: { type: 'string' },
        testCoverage: { type: 'number' },
        accessibilityTests: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'implementation', 'component']
}));

// Phase 14: Storybook Setup
export const storybookSetupTask = defineTask('storybook-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Storybook Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Storybook Specialist and Documentation Engineer',
      task: 'Set up Storybook for component documentation and development',
      context: {
        projectName: args.projectName,
        components: args.components,
        componentImplementations: args.componentImplementations,
        designTokens: args.designTokens,
        techStack: args.techStack,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize Storybook with appropriate framework',
        '2. Configure Storybook addons (a11y, controls, docs, viewport)',
        '3. Set up design token theme',
        '4. Create stories for all components',
        '5. Document component props with controls',
        '6. Add accessibility testing addon',
        '7. Configure viewport addon for responsive testing',
        '8. Create documentation pages (Getting Started, Design Tokens, etc.)',
        '9. Set up story organization structure',
        '10. Configure Storybook build and deployment',
        '11. Generate Storybook usage guide'
      ],
      outputFormat: 'JSON object with Storybook setup'
    },
    outputSchema: {
      type: 'object',
      required: ['storiesCreated', 'addonsInstalled', 'artifacts'],
      properties: {
        storiesCreated: { type: 'number' },
        addonsInstalled: {
          type: 'array',
          items: { type: 'string' }
        },
        storybookUrl: { type: 'string' },
        storybookPath: { type: 'string' },
        usageGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'storybook', 'documentation']
}));

// Phase 15: Accessibility Testing
export const accessibilityTestingTask = defineTask('accessibility-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Accessibility Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility Specialist and QA Engineer',
      task: 'Test all components for accessibility compliance',
      context: {
        projectName: args.projectName,
        components: args.components,
        accessibilityLevel: args.accessibilityLevel,
        storybookSetup: args.storybookSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test each component with automated tools (axe, Pa11y)',
        '2. Test keyboard navigation for all interactive components',
        '3. Verify ARIA attributes and roles',
        '4. Test focus management and focus indicators',
        '5. Test with screen readers (NVDA, JAWS, VoiceOver)',
        '6. Verify color contrast compliance',
        '7. Test with various zoom levels',
        '8. Test reduced motion preferences',
        '9. Identify and document violations',
        '10. Create remediation plan for issues',
        '11. Calculate overall accessibility score',
        '12. Generate accessibility testing report'
      ],
      outputFormat: 'JSON object with accessibility test results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'violationsFound', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        violationsFound: { type: 'number' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'serious', 'moderate', 'minor'] },
              issue: { type: 'string' },
              wcagCriterion: { type: 'string' }
            }
          }
        },
        criticalIssues: { type: 'number' },
        componentScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              score: { type: 'number' }
            }
          }
        },
        reportPath: { type: 'string' },
        remediationPlanPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'accessibility', 'testing']
}));

// Phase 16: Documentation Site
export const documentationSiteTask = defineTask('documentation-site', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Documentation Site - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Site Developer and Technical Writer',
      task: 'Create comprehensive documentation website for design system',
      context: {
        projectName: args.projectName,
        designPrinciples: args.designPrinciples,
        colorSystem: args.colorSystem,
        typographySystem: args.typographySystem,
        spacingSystem: args.spacingSystem,
        foundationalSystems: args.foundationalSystems,
        components: args.components,
        designTokens: args.designTokens,
        componentDocs: args.componentDocs,
        storybookSetup: args.storybookSetup,
        accessibilityTesting: args.accessibilityTesting,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Choose documentation framework (Docusaurus, VuePress, Gatsby, Next.js)',
        '2. Create site structure and navigation',
        '3. Create Getting Started guide',
        '4. Document Design Principles',
        '5. Create Foundation pages (Color, Typography, Spacing, etc.)',
        '6. Create Component pages with examples',
        '7. Document Design Tokens',
        '8. Create Guidelines pages (Accessibility, Content, etc.)',
        '9. Add search functionality',
        '10. Integrate Storybook if available',
        '11. Add version selector',
        '12. Deploy documentation site',
        '13. Generate site maintenance guide'
      ],
      outputFormat: 'JSON object with documentation site details'
    },
    outputSchema: {
      type: 'object',
      required: ['pagesCreated', 'siteUrl', 'documentation', 'artifacts'],
      properties: {
        pagesCreated: { type: 'number' },
        siteUrl: { type: 'string' },
        documentation: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            sitePath: { type: 'string' },
            sections: { type: 'array' }
          }
        },
        maintenanceGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'documentation', 'website']
}));

// Phase 17: Usage Guidelines
export const usageGuidelinesTask = defineTask('usage-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Usage Guidelines - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Writer and Design System Evangelist',
      task: 'Create comprehensive usage guidelines and best practices',
      context: {
        projectName: args.projectName,
        designPrinciples: args.designPrinciples,
        components: args.components,
        designTokens: args.designTokens,
        codeImplementation: args.codeImplementation,
        storybookSetup: args.storybookSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Getting Started guide for designers',
        '2. Create Getting Started guide for developers',
        '3. Document common patterns and recipes',
        '4. Create do\'s and don\'ts guide',
        '5. Document accessibility best practices',
        '6. Create responsive design guidelines',
        '7. Document content guidelines and voice/tone',
        '8. Create migration guide for existing projects',
        '9. Document versioning and update strategy',
        '10. Create troubleshooting guide',
        '11. Generate usage examples and code snippets',
        '12. Create FAQ document'
      ],
      outputFormat: 'JSON object with usage guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['guidesCreated', 'artifacts'],
      properties: {
        guidesCreated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              audience: { type: 'string', enum: ['designer', 'developer', 'both'] }
            }
          }
        },
        gettingStartedDesignerPath: { type: 'string' },
        gettingStartedDeveloperPath: { type: 'string' },
        patternsGuidePath: { type: 'string' },
        migrationGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'guidelines', 'documentation']
}));

// Phase 18: Governance
export const governanceTask = defineTask('governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Governance and Contribution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Systems Program Manager and Governance Lead',
      task: 'Establish governance model and contribution guidelines',
      context: {
        projectName: args.projectName,
        designPrinciples: args.designPrinciples,
        components: args.components,
        implementationRequired: args.implementationRequired,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define design system team roles and responsibilities',
        '2. Create contribution guidelines for designers',
        '3. Create contribution guidelines for developers',
        '4. Define component proposal process',
        '5. Create design review process',
        '6. Create code review process',
        '7. Define quality standards and acceptance criteria',
        '8. Create issue triage process',
        '9. Define communication channels (Slack, Discord, etc.)',
        '10. Create deprecation policy',
        '11. Define support model',
        '12. Generate governance documentation'
      ],
      outputFormat: 'JSON object with governance guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'artifacts'],
      properties: {
        guidelines: {
          type: 'object',
          properties: {
            roles: { type: 'array' },
            contributionProcess: { type: 'string' },
            reviewProcess: { type: 'string' },
            supportModel: { type: 'string' }
          }
        },
        contributionGuidePath: { type: 'string' },
        governanceDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'governance']
}));

// Phase 19: Release Strategy
export const releaseStrategyTask = defineTask('release-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 19: Release Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Release Manager and DevOps Engineer',
      task: 'Define versioning and release strategy',
      context: {
        projectName: args.projectName,
        implementationRequired: args.implementationRequired,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define semantic versioning strategy',
        '2. Create release process and checklist',
        '3. Define breaking change policy',
        '4. Create changelog format and guidelines',
        '5. Set up automated releases (CI/CD)',
        '6. Define release cadence (monthly, quarterly, etc.)',
        '7. Create hotfix process',
        '8. Define version communication strategy',
        '9. Create migration guides template',
        '10. Set up package publishing (npm, etc.)',
        '11. Generate release documentation'
      ],
      outputFormat: 'JSON object with release strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['initialVersion', 'releaseProcess', 'artifacts'],
      properties: {
        initialVersion: { type: 'string' },
        versioningScheme: { type: 'string' },
        releaseCadence: { type: 'string' },
        releaseProcess: {
          type: 'object',
          properties: {
            steps: { type: 'array' },
            checklist: { type: 'array' },
            automation: { type: 'boolean' }
          }
        },
        releaseDocPath: { type: 'string' },
        changelogTemplatePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'release', 'versioning']
}));

// Phase 20: Design System Validation
export const designSystemValidationTask = defineTask('design-system-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 20: Design System Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design System Quality Assurance Lead',
      task: 'Validate design system completeness and quality',
      context: {
        projectName: args.projectName,
        designPrinciples: args.designPrinciples,
        colorSystem: args.colorSystem,
        typographySystem: args.typographySystem,
        spacingSystem: args.spacingSystem,
        foundationalSystems: args.foundationalSystems,
        components: args.components,
        designTokens: args.designTokens,
        codeImplementation: args.codeImplementation,
        storybookSetup: args.storybookSetup,
        accessibilityTesting: args.accessibilityTesting,
        documentationSiteSetup: args.documentationSiteSetup,
        governance: args.governance,
        releaseStrategy: args.releaseStrategy,
        componentScope: args.componentScope,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate all foundational systems are complete',
        '2. Verify all planned components are designed/implemented',
        '3. Check design tokens coverage',
        '4. Verify documentation completeness',
        '5. Check accessibility compliance',
        '6. Verify design tool library is published',
        '7. Check code implementation if required',
        '8. Verify testing coverage',
        '9. Check governance documentation',
        '10. Verify release strategy is defined',
        '11. Identify any gaps or missing elements',
        '12. Calculate overall completeness score',
        '13. Generate validation report and checklist'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['completenessScore', 'missingElements', 'completedSections', 'recommendations', 'artifacts'],
      properties: {
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        missingElements: {
          type: 'array',
          items: { type: 'string' }
        },
        completedSections: {
          type: 'array',
          items: { type: 'string' }
        },
        validation: {
          type: 'object',
          properties: {
            foundationsComplete: { type: 'boolean' },
            componentsComplete: { type: 'boolean' },
            tokensComplete: { type: 'boolean' },
            documentationComplete: { type: 'boolean' },
            accessibilityCompliant: { type: 'boolean' },
            implementationReady: { type: 'boolean' }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        reportPath: { type: 'string' },
        checklistPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'validation', 'qa']
}));

// Phase 21: Final Review
export const finalReviewTask = defineTask('final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 21: Final Review - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design System Director and Executive Reviewer',
      task: 'Conduct final comprehensive review and prepare for launch',
      context: {
        projectName: args.projectName,
        validation: args.validation,
        accessibilityTesting: args.accessibilityTesting,
        documentationSiteSetup: args.documentationSiteSetup,
        governance: args.governance,
        releaseStrategy: args.releaseStrategy,
        artifacts: args.artifacts,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review overall design system quality',
        '2. Assess completeness and readiness for launch',
        '3. Review accessibility compliance',
        '4. Assess documentation quality and coverage',
        '5. Review governance and support structures',
        '6. Identify launch blockers if any',
        '7. List design system strengths',
        '8. List areas of concern or improvement',
        '9. Provide launch recommendation (approve/conditional/delay)',
        '10. Create executive summary',
        '11. Create handoff guide for teams',
        '12. Define success metrics and KPIs',
        '13. Create launch communication plan',
        '14. Generate final review report'
      ],
      outputFormat: 'JSON object with final review and recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'launchReady', 'strengths', 'concerns', 'artifacts'],
      properties: {
        verdict: { type: 'string' },
        launchReady: { type: 'boolean' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        strengths: {
          type: 'array',
          items: { type: 'string' }
        },
        concerns: {
          type: 'array',
          items: { type: 'string' }
        },
        launchBlockers: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendation: {
          type: 'string',
          enum: ['approve-launch', 'conditional-launch', 'delay-launch']
        },
        successMetrics: {
          type: 'array',
          items: { type: 'string' }
        },
        summaryPath: { type: 'string' },
        handoffGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'review', 'approval']
}));

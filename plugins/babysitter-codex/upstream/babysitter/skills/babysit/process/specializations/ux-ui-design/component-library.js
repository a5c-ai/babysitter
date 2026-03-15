/**
 * @process specializations/ux-ui-design/component-library
 * @description Component Library Development - Comprehensive design system and component library creation process
 * covering design tokens, reusable components, patterns, accessibility, documentation, and integration with development
 * workflows. Ensures consistency, scalability, and maintainability across products.
 * @inputs { projectName: string, scope?: string, designLanguage?: object, platforms?: array, technology?: string, existingDesigns?: array }
 * @outputs { success: boolean, componentLibrary: object, designTokens: object, documentation: object, integrationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/component-library', {
 *   projectName: 'Acme Design System',
 *   scope: 'enterprise-product-suite',
 *   designLanguage: {
 *     brandColors: ['#0066CC', '#FF6B35'],
 *     typography: 'Inter, system-ui',
 *     designPhilosophy: 'minimal, accessible, consistent'
 *   },
 *   platforms: ['web', 'mobile-ios', 'mobile-android'],
 *   technology: 'react',
 *   existingDesigns: ['legacy-ui-kit', 'marketing-components'],
 *   accessibilityLevel: 'WCAG-AA',
 *   targetFrameworks: ['React', 'Vue', 'Angular']
 * });
 *
 * @references
 * - Design Systems Handbook: https://www.designbetter.co/design-systems-handbook
 * - Atomic Design: https://atomicdesign.bradfrost.com/
 * - Material Design: https://material.io/design
 * - Carbon Design System: https://carbondesignsystem.com/
 * - Storybook: https://storybook.js.org/
 * - Style Dictionary: https://amzn.github.io/style-dictionary/
 * - Design Tokens W3C: https://www.w3.org/community/design-tokens/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    scope = 'product-suite',
    designLanguage = {},
    platforms = ['web'],
    technology = 'react',
    existingDesigns = [],
    accessibilityLevel = 'WCAG-AA',
    targetFrameworks = ['React'],
    includeIcons = true,
    includeIllustrations = true,
    versioningStrategy = 'semantic',
    outputDir = 'component-library-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let componentLibrary = {};
  let designTokens = {};
  let documentation = {};
  let integrationPlan = {};

  ctx.log('info', `Starting Component Library Development: ${projectName}`);
  ctx.log('info', `Scope: ${scope}, Platforms: ${platforms.join(', ')}, Technology: ${technology}`);

  // ============================================================================
  // PHASE 1: DESIGN SYSTEM STRATEGY AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning design system strategy');

  const strategyPlanning = await ctx.task(designSystemStrategyTask, {
    projectName,
    scope,
    designLanguage,
    platforms,
    technology,
    existingDesigns,
    targetFrameworks,
    accessibilityLevel,
    outputDir
  });

  if (!strategyPlanning.success) {
    return {
      success: false,
      error: 'Design system strategy planning failed',
      details: strategyPlanning,
      metadata: {
        processId: 'specializations/ux-ui-design/component-library',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...strategyPlanning.artifacts);

  // Quality Gate: Strategy review
  await ctx.breakpoint({
    question: `Design system strategy planned for ${projectName}. Scope: ${strategyPlanning.componentCount} components across ${platforms.length} platform(s). Architecture: ${strategyPlanning.architecture}. Review and approve strategy?`,
    title: 'Design System Strategy Review',
    context: {
      runId: ctx.runId,
      strategy: {
        projectName,
        componentCount: strategyPlanning.componentCount,
        platforms,
        architecture: strategyPlanning.architecture,
        accessibilityLevel
      },
      principles: strategyPlanning.designPrinciples,
      governance: strategyPlanning.governanceModel,
      files: strategyPlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: DESIGN TOKENS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining design tokens');

  const tokenDefinition = await ctx.task(designTokensDefinitionTask, {
    projectName,
    designLanguage,
    platforms,
    strategyPlanning,
    outputDir
  });

  artifacts.push(...tokenDefinition.artifacts);
  designTokens = tokenDefinition.designTokens;

  ctx.log('info', `Design tokens defined: ${tokenDefinition.tokenCount} tokens across ${tokenDefinition.categories.length} categories`);

  // ============================================================================
  // PHASE 3: COLOR SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing color system');

  const colorSystem = await ctx.task(colorSystemDesignTask, {
    projectName,
    designLanguage,
    designTokens: tokenDefinition.designTokens,
    accessibilityLevel,
    platforms,
    outputDir
  });

  artifacts.push(...colorSystem.artifacts);

  // Quality Gate: Color accessibility validation
  if (colorSystem.accessibilityScore < 90) {
    await ctx.breakpoint({
      question: `Color accessibility score: ${colorSystem.accessibilityScore}/100. Below recommended threshold of 90 for ${accessibilityLevel}. Review color contrast issues?`,
      title: 'Color Accessibility Review',
      context: {
        runId: ctx.runId,
        accessibilityScore: colorSystem.accessibilityScore,
        contrastIssues: colorSystem.contrastIssues,
        recommendations: colorSystem.accessibilityRecommendations,
        files: [
          { path: colorSystem.colorPalettePath, format: 'image', label: 'Color Palette' },
          { path: colorSystem.accessibilityReportPath, format: 'markdown', label: 'Accessibility Report' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 4: TYPOGRAPHY SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing typography system');

  const typographySystem = await ctx.task(typographySystemDesignTask, {
    projectName,
    designLanguage,
    platforms,
    designTokens: tokenDefinition.designTokens,
    accessibilityLevel,
    outputDir
  });

  artifacts.push(...typographySystem.artifacts);

  // ============================================================================
  // PHASE 5: SPACING AND LAYOUT SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing spacing and layout system');

  const spacingSystem = await ctx.task(spacingLayoutSystemTask, {
    projectName,
    platforms,
    designTokens: tokenDefinition.designTokens,
    outputDir
  });

  artifacts.push(...spacingSystem.artifacts);

  // ============================================================================
  // PHASE 6: COMPONENT INVENTORY AND CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating component inventory');

  const componentInventory = await ctx.task(componentInventoryTask, {
    projectName,
    scope,
    platforms,
    existingDesigns,
    strategyPlanning,
    outputDir
  });

  artifacts.push(...componentInventory.artifacts);

  const totalComponents = componentInventory.components.length;
  ctx.log('info', `Component inventory: ${totalComponents} components identified`);

  // ============================================================================
  // PHASE 7: FOUNDATIONAL COMPONENTS DESIGN (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing foundational components in parallel');

  const foundationalComponents = componentInventory.components.filter(c => c.category === 'foundational');

  const foundationalDesignTasks = foundationalComponents.map(component =>
    () => ctx.task(componentDesignTask, {
      projectName,
      component,
      designTokens: tokenDefinition.designTokens,
      colorSystem: colorSystem.colors,
      typographySystem: typographySystem.typography,
      spacingSystem: spacingSystem.spacing,
      platforms,
      accessibilityLevel,
      outputDir
    })
  );

  const foundationalDesigns = await ctx.parallel.all(foundationalDesignTasks);

  artifacts.push(...foundationalDesigns.flatMap(d => d.artifacts));

  ctx.log('info', `Foundational components designed: ${foundationalDesigns.length}`);

  // Breakpoint: Review foundational components
  await ctx.breakpoint({
    question: `Foundational components designed: ${foundationalDesigns.length} components (Button, Input, Checkbox, Radio, etc.). Review designs and approve to proceed with complex components?`,
    title: 'Foundational Components Review',
    context: {
      runId: ctx.runId,
      componentsDesigned: foundationalDesigns.length,
      components: foundationalDesigns.map(d => ({
        name: d.componentName,
        variants: d.variantCount,
        states: d.stateCount,
        accessibilityScore: d.accessibilityScore
      })),
      files: foundationalDesigns.slice(0, 5).map(d => ({
        path: d.designFilePath,
        format: 'image',
        label: `Component: ${d.componentName}`
      }))
    }
  });

  // ============================================================================
  // PHASE 8: COMPLEX COMPONENTS DESIGN (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 8: Designing complex components in parallel');

  const complexComponents = componentInventory.components.filter(c => c.category === 'complex');

  const complexDesignTasks = complexComponents.map(component =>
    () => ctx.task(componentDesignTask, {
      projectName,
      component,
      designTokens: tokenDefinition.designTokens,
      colorSystem: colorSystem.colors,
      typographySystem: typographySystem.typography,
      spacingSystem: spacingSystem.spacing,
      platforms,
      accessibilityLevel,
      foundationalComponents: foundationalDesigns,
      outputDir
    })
  );

  const complexDesigns = await ctx.parallel.all(complexDesignTasks);

  artifacts.push(...complexDesigns.flatMap(d => d.artifacts));

  ctx.log('info', `Complex components designed: ${complexDesigns.length}`);

  // ============================================================================
  // PHASE 9: PATTERN LIBRARY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 9: Designing pattern library');

  const patternLibrary = await ctx.task(patternLibraryDesignTask, {
    projectName,
    componentInventory,
    foundationalDesigns,
    complexDesigns,
    platforms,
    outputDir
  });

  artifacts.push(...patternLibrary.artifacts);

  ctx.log('info', `Pattern library created: ${patternLibrary.patternCount} patterns`);

  // ============================================================================
  // PHASE 10: ICON SYSTEM DESIGN
  // ============================================================================

  let iconSystem = null;
  if (includeIcons) {
    ctx.log('info', 'Phase 10: Designing icon system');

    iconSystem = await ctx.task(iconSystemDesignTask, {
      projectName,
      designLanguage,
      platforms,
      designTokens: tokenDefinition.designTokens,
      outputDir
    });

    artifacts.push(...iconSystem.artifacts);

    ctx.log('info', `Icon system created: ${iconSystem.iconCount} icons`);
  }

  // ============================================================================
  // PHASE 11: ILLUSTRATION SYSTEM DESIGN
  // ============================================================================

  let illustrationSystem = null;
  if (includeIllustrations) {
    ctx.log('info', 'Phase 11: Designing illustration system');

    illustrationSystem = await ctx.task(illustrationSystemDesignTask, {
      projectName,
      designLanguage,
      colorSystem: colorSystem.colors,
      platforms,
      outputDir
    });

    artifacts.push(...illustrationSystem.artifacts);
  }

  // ============================================================================
  // PHASE 12: ACCESSIBILITY AUDIT AND ENHANCEMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Conducting accessibility audit');

  const accessibilityAudit = await ctx.task(accessibilityAuditTask, {
    projectName,
    accessibilityLevel,
    colorSystem,
    typographySystem,
    foundationalDesigns,
    complexDesigns,
    outputDir
  });

  artifacts.push(...accessibilityAudit.artifacts);

  const accessibilityScore = accessibilityAudit.overallScore;
  const criticalIssues = accessibilityAudit.criticalIssues;

  ctx.log('info', `Accessibility audit: ${accessibilityScore}/100, ${criticalIssues.length} critical issues`);

  // Quality Gate: Accessibility compliance
  if (criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `Accessibility audit found ${criticalIssues.length} critical issue(s). Overall score: ${accessibilityScore}/100. Review and fix critical accessibility issues before proceeding?`,
      title: 'Accessibility Compliance Gate',
      context: {
        runId: ctx.runId,
        accessibilityScore,
        criticalIssues,
        targetLevel: accessibilityLevel,
        recommendations: accessibilityAudit.recommendations,
        files: [
          { path: accessibilityAudit.reportPath, format: 'markdown', label: 'Accessibility Audit Report' },
          { path: accessibilityAudit.remediationPlanPath, format: 'markdown', label: 'Remediation Plan' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 13: RESPONSIVE BEHAVIOR DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 13: Designing responsive behavior');

  const responsiveDesign = await ctx.task(responsiveBehaviorTask, {
    projectName,
    platforms,
    foundationalDesigns,
    complexDesigns,
    spacingSystem: spacingSystem.spacing,
    outputDir
  });

  artifacts.push(...responsiveDesign.artifacts);

  // ============================================================================
  // PHASE 14: INTERACTION AND ANIMATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 14: Designing interactions and animations');

  const interactionDesign = await ctx.task(interactionAnimationTask, {
    projectName,
    designLanguage,
    foundationalDesigns,
    complexDesigns,
    platforms,
    outputDir
  });

  artifacts.push(...interactionDesign.artifacts);

  // ============================================================================
  // PHASE 15: COMPONENT DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Creating component documentation');

  const componentDocumentation = await ctx.task(componentDocumentationTask, {
    projectName,
    foundationalDesigns,
    complexDesigns,
    patternLibrary,
    designTokens: tokenDefinition.designTokens,
    platforms,
    outputDir
  });

  artifacts.push(...componentDocumentation.artifacts);

  documentation = componentDocumentation.documentation;

  // ============================================================================
  // PHASE 16: FIGMA/SKETCH LIBRARY SETUP
  // ============================================================================

  ctx.log('info', 'Phase 16: Setting up design tool library');

  const designToolSetup = await ctx.task(designToolLibraryTask, {
    projectName,
    designTokens: tokenDefinition.designTokens,
    colorSystem: colorSystem.colors,
    typographySystem: typographySystem.typography,
    foundationalDesigns,
    complexDesigns,
    iconSystem,
    platforms,
    outputDir
  });

  artifacts.push(...designToolSetup.artifacts);

  componentLibrary = designToolSetup.library;

  // Breakpoint: Design library review
  await ctx.breakpoint({
    question: `Design library created in ${designToolSetup.tool}. ${totalComponents} components organized and published. Review library structure and component organization?`,
    title: 'Design Library Review',
    context: {
      runId: ctx.runId,
      tool: designToolSetup.tool,
      componentCount: totalComponents,
      libraryStructure: designToolSetup.libraryStructure,
      publishStatus: designToolSetup.publishStatus,
      files: [
        { path: designToolSetup.libraryFilePath, format: 'link', label: 'Design Library Link' },
        { path: designToolSetup.organizationGuidePath, format: 'markdown', label: 'Library Organization' }
      ]
    }
  });

  // ============================================================================
  // PHASE 17: CODE IMPLEMENTATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 17: Planning code implementation');

  const codeImplementation = await ctx.task(codeImplementationPlanTask, {
    projectName,
    technology,
    targetFrameworks,
    platforms,
    designTokens: tokenDefinition.designTokens,
    foundationalDesigns,
    complexDesigns,
    outputDir
  });

  artifacts.push(...codeImplementation.artifacts);

  integrationPlan = codeImplementation.implementationPlan;

  // ============================================================================
  // PHASE 18: STORYBOOK SETUP AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 18: Setting up Storybook documentation');

  const storybookSetup = await ctx.task(storybookSetupTask, {
    projectName,
    technology,
    targetFrameworks,
    foundationalDesigns,
    complexDesigns,
    designTokens: tokenDefinition.designTokens,
    componentDocumentation: componentDocumentation.documentation,
    outputDir
  });

  artifacts.push(...storybookSetup.artifacts);

  ctx.log('info', `Storybook configured: ${storybookSetup.storiesCount} stories`);

  // ============================================================================
  // PHASE 19: VERSIONING AND GOVERNANCE
  // ============================================================================

  ctx.log('info', 'Phase 19: Establishing versioning and governance');

  const governanceSetup = await ctx.task(governanceVersioningTask, {
    projectName,
    versioningStrategy,
    strategyPlanning,
    componentLibrary,
    outputDir
  });

  artifacts.push(...governanceSetup.artifacts);

  // ============================================================================
  // PHASE 20: DEVELOPER HANDOFF PACKAGE
  // ============================================================================

  ctx.log('info', 'Phase 20: Creating developer handoff package');

  const developerHandoff = await ctx.task(developerHandoffTask, {
    projectName,
    designTokens: tokenDefinition.designTokens,
    foundationalDesigns,
    complexDesigns,
    componentDocumentation: componentDocumentation.documentation,
    codeImplementation: codeImplementation.implementationPlan,
    platforms,
    outputDir
  });

  artifacts.push(...developerHandoff.artifacts);

  // ============================================================================
  // PHASE 21: ADOPTION AND TRAINING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 21: Creating adoption and training plan');

  const adoptionPlan = await ctx.task(adoptionTrainingTask, {
    projectName,
    scope,
    componentLibrary,
    documentation,
    governanceSetup,
    outputDir
  });

  artifacts.push(...adoptionPlan.artifacts);

  // ============================================================================
  // PHASE 22: FINAL VALIDATION AND QUALITY CHECK
  // ============================================================================

  ctx.log('info', 'Phase 22: Conducting final validation');

  const finalValidation = await ctx.task(componentLibraryValidationTask, {
    projectName,
    componentLibrary,
    designTokens: tokenDefinition.designTokens,
    accessibilityAudit,
    componentDocumentation: componentDocumentation.documentation,
    storybookSetup,
    governanceSetup,
    totalComponents,
    accessibilityLevel,
    outputDir
  });

  artifacts.push(...finalValidation.artifacts);

  const validationScore = finalValidation.validationScore;
  const productionReady = finalValidation.productionReady;

  // Final Breakpoint: Component library approval
  await ctx.breakpoint({
    question: `Component Library Development Complete! ${projectName}: ${totalComponents} components, ${designTokens.tokenCount} design tokens, validation score: ${validationScore}/100. Production ready: ${productionReady}. Approve for release?`,
    title: 'Component Library Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        totalComponents,
        foundationalComponents: foundationalDesigns.length,
        complexComponents: complexDesigns.length,
        designTokens: tokenDefinition.tokenCount,
        patterns: patternLibrary.patternCount,
        icons: iconSystem?.iconCount || 0,
        validationScore,
        accessibilityScore,
        productionReady
      },
      platforms,
      technology,
      targetFrameworks,
      verdict: finalValidation.verdict,
      recommendation: finalValidation.recommendation,
      files: [
        { path: designToolSetup.libraryFilePath, format: 'link', label: 'Design Library' },
        { path: storybookSetup.storybookUrl, format: 'link', label: 'Storybook Documentation' },
        { path: componentDocumentation.mainDocPath, format: 'markdown', label: 'Component Documentation' },
        { path: developerHandoff.handoffPackagePath, format: 'markdown', label: 'Developer Handoff' },
        { path: finalValidation.reportPath, format: 'markdown', label: 'Validation Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: productionReady,
    projectName,
    scope,
    platforms,
    technology,
    componentLibrary: {
      totalComponents,
      foundationalComponents: foundationalDesigns.length,
      complexComponents: complexDesigns.length,
      patterns: patternLibrary.patternCount,
      libraryPath: designToolSetup.libraryFilePath,
      tool: designToolSetup.tool
    },
    designTokens: {
      tokenCount: tokenDefinition.tokenCount,
      categories: tokenDefinition.categories,
      tokensPath: tokenDefinition.tokensFilePath
    },
    colorSystem: {
      palettes: colorSystem.paletteCount,
      accessibilityScore: colorSystem.accessibilityScore,
      colorPalettePath: colorSystem.colorPalettePath
    },
    typography: {
      scales: typographySystem.scaleCount,
      fonts: typographySystem.fonts
    },
    iconSystem: iconSystem ? {
      iconCount: iconSystem.iconCount,
      formats: iconSystem.formats
    } : null,
    accessibility: {
      overallScore: accessibilityScore,
      targetLevel: accessibilityLevel,
      criticalIssues: criticalIssues.length,
      complianceStatus: accessibilityAudit.complianceStatus
    },
    documentation: {
      componentDocs: componentDocumentation.componentCount,
      mainDocPath: componentDocumentation.mainDocPath,
      storybookUrl: storybookSetup.storybookUrl,
      storiesCount: storybookSetup.storiesCount
    },
    codeImplementation: {
      implementationPlanPath: codeImplementation.implementationPlanPath,
      targetFrameworks,
      estimatedEffort: codeImplementation.estimatedEffort
    },
    governance: {
      versioningStrategy,
      governanceModelPath: governanceSetup.governanceModelPath,
      contributionGuidelinePath: governanceSetup.contributionGuidelinePath
    },
    handoff: {
      developerPackagePath: developerHandoff.handoffPackagePath,
      assetsPackagePath: developerHandoff.assetsPackagePath
    },
    adoption: {
      trainingPlanPath: adoptionPlan.trainingPlanPath,
      rolloutStrategy: adoptionPlan.rolloutStrategy
    },
    validation: {
      score: validationScore,
      productionReady,
      verdict: finalValidation.verdict,
      recommendation: finalValidation.recommendation
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/component-library',
      timestamp: startTime,
      platforms,
      technology,
      accessibilityLevel
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Design System Strategy
export const designSystemStrategyTask = defineTask('design-system-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design System Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design System Architect',
      task: 'Plan comprehensive design system strategy and architecture',
      context: {
        projectName: args.projectName,
        scope: args.scope,
        designLanguage: args.designLanguage,
        platforms: args.platforms,
        technology: args.technology,
        existingDesigns: args.existingDesigns,
        targetFrameworks: args.targetFrameworks,
        accessibilityLevel: args.accessibilityLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define design system vision, goals, and principles',
        '2. Identify stakeholders and target audiences (designers, developers, product teams)',
        '3. Audit existing designs and identify reusable patterns',
        '4. Define component scope and categorization (foundational, complex, patterns)',
        '5. Plan design token structure (colors, typography, spacing, shadows, etc.)',
        '6. Choose architecture approach (Atomic Design, Functional, Domain-driven)',
        '7. Define naming conventions and organization system',
        '8. Establish governance model (ownership, contribution, review process)',
        '9. Plan multi-platform strategy (web, iOS, Android, responsive)',
        '10. Define accessibility requirements and WCAG compliance level',
        '11. Create component inventory matrix',
        '12. Estimate effort and create phased rollout plan',
        '13. Document design principles and philosophy',
        '14. Create strategy document with architecture diagrams'
      ],
      outputFormat: 'JSON object with design system strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'componentCount', 'architecture', 'designPrinciples', 'governanceModel', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        componentCount: { type: 'number', description: 'Total components to build' },
        architecture: { type: 'string', description: 'Architecture approach (Atomic, Functional, etc.)' },
        designPrinciples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        governanceModel: {
          type: 'object',
          properties: {
            ownership: { type: 'string' },
            contributionProcess: { type: 'string' },
            reviewProcess: { type: 'string' },
            decisionMaking: { type: 'string' }
          }
        },
        componentCategories: {
          type: 'object',
          properties: {
            foundational: { type: 'array', items: { type: 'string' } },
            complex: { type: 'array', items: { type: 'string' } },
            patterns: { type: 'array', items: { type: 'string' } }
          }
        },
        tokenStructure: {
          type: 'object',
          description: 'Design token organization'
        },
        namingConventions: {
          type: 'object',
          properties: {
            components: { type: 'string' },
            tokens: { type: 'string' },
            files: { type: 'string' }
          }
        },
        rolloutPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              deliverables: { type: 'array' },
              timeline: { type: 'string' }
            }
          }
        },
        strategyDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'strategy', 'architecture']
}));

// Phase 2: Design Tokens Definition
export const designTokensDefinitionTask = defineTask('design-tokens-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Design Tokens Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Design Token Specialist',
      task: 'Define comprehensive design tokens for the design system',
      context: {
        projectName: args.projectName,
        designLanguage: args.designLanguage,
        platforms: args.platforms,
        strategyPlanning: args.strategyPlanning,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define color tokens (primitive, semantic, component-specific)',
        '2. Create typography tokens (font families, sizes, weights, line heights, letter spacing)',
        '3. Define spacing tokens (margin, padding, gap - use consistent scale)',
        '4. Create border tokens (width, radius, style)',
        '5. Define shadow tokens (elevations, depths)',
        '6. Create animation tokens (durations, easings, timing functions)',
        '7. Define z-index tokens (layering system)',
        '8. Create breakpoint tokens (responsive design)',
        '9. Use token aliasing (primitive → semantic → component)',
        '10. Organize tokens by category and hierarchy',
        '11. Generate tokens in JSON format compatible with Style Dictionary',
        '12. Create platform-specific token transformations',
        '13. Document token usage guidelines',
        '14. Validate token consistency and completeness'
      ],
      outputFormat: 'JSON object with design tokens'
    },
    outputSchema: {
      type: 'object',
      required: ['designTokens', 'tokenCount', 'categories', 'tokensFilePath', 'artifacts'],
      properties: {
        designTokens: {
          type: 'object',
          description: 'Complete design tokens structure'
        },
        tokenCount: { type: 'number' },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Token categories (color, typography, spacing, etc.)'
        },
        tokenHierarchy: {
          type: 'object',
          properties: {
            primitive: { type: 'number' },
            semantic: { type: 'number' },
            componentSpecific: { type: 'number' }
          }
        },
        tokensFilePath: { type: 'string', description: 'Path to tokens JSON file' },
        platformTransforms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              transformConfigPath: { type: 'string' }
            }
          }
        },
        usageGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'tokens', 'foundation']
}));

// Phase 3: Color System Design
export const colorSystemDesignTask = defineTask('color-system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Color System Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Color System Designer',
      task: 'Design accessible, scalable color system',
      context: {
        projectName: args.projectName,
        designLanguage: args.designLanguage,
        designTokens: args.designTokens,
        accessibilityLevel: args.accessibilityLevel,
        platforms: args.platforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define primary, secondary, and accent color palettes',
        '2. Create semantic color categories (success, warning, error, info)',
        '3. Generate tonal scales for each color (50, 100, 200...900)',
        '4. Design neutral/gray scale palette',
        '5. Create text colors (on-light, on-dark, disabled, muted)',
        '6. Define surface colors (backgrounds, cards, overlays)',
        '7. Create border and divider colors',
        '8. Design interactive state colors (hover, active, focus, disabled)',
        '9. Validate color contrast ratios against WCAG AA/AAA standards',
        '10. Test color combinations for readability',
        '11. Create color palette documentation with swatches',
        '12. Generate accessibility report with contrast ratios',
        '13. Create color usage guidelines',
        '14. Export color system to design tokens'
      ],
      outputFormat: 'JSON object with color system'
    },
    outputSchema: {
      type: 'object',
      required: ['colors', 'accessibilityScore', 'colorPalettePath', 'artifacts'],
      properties: {
        colors: {
          type: 'object',
          properties: {
            primary: { type: 'object' },
            secondary: { type: 'object' },
            accent: { type: 'object' },
            semantic: { type: 'object' },
            neutral: { type: 'object' },
            text: { type: 'object' },
            surface: { type: 'object' }
          }
        },
        paletteCount: { type: 'number' },
        totalColors: { type: 'number' },
        accessibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        contrastIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              combination: { type: 'string' },
              ratio: { type: 'number' },
              required: { type: 'number' },
              severity: { type: 'string' }
            }
          }
        },
        accessibilityRecommendations: { type: 'array', items: { type: 'string' } },
        colorPalettePath: { type: 'string' },
        accessibilityReportPath: { type: 'string' },
        usageGuidePath: { type: 'string' },
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

// Phase 4: Typography System Design
export const typographySystemDesignTask = defineTask('typography-system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Typography System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Typography Designer',
      task: 'Design comprehensive typography system',
      context: args,
      instructions: [
        '1. Select font families (primary, secondary, monospace)',
        '2. Define type scale using modular scale ratio (1.125, 1.25, 1.333, etc.)',
        '3. Create text styles (h1-h6, body, caption, overline, etc.)',
        '4. Define font weights (light, regular, medium, semibold, bold)',
        '5. Set line heights for optimal readability',
        '6. Define letter spacing for different sizes',
        '7. Create responsive typography rules',
        '8. Set text color semantics',
        '9. Define text decoration and transformation rules',
        '10. Ensure readability across platforms',
        '11. Validate WCAG compliance for text',
        '12. Create typography documentation with specimens'
      ],
      outputFormat: 'JSON object with typography system'
    },
    outputSchema: {
      type: 'object',
      required: ['typography', 'fonts', 'scaleCount', 'artifacts'],
      properties: {
        typography: { type: 'object' },
        fonts: { type: 'array', items: { type: 'string' } },
        scaleCount: { type: 'number' },
        textStyles: { type: 'array' },
        typeScaleRatio: { type: 'number' },
        responsiveRules: { type: 'array' },
        specimenPath: { type: 'string' },
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

// Phase 5: Spacing and Layout System
export const spacingLayoutSystemTask = defineTask('spacing-layout-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Spacing & Layout - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Layout System Designer',
      task: 'Design spacing and layout system',
      context: args,
      instructions: [
        '1. Define base spacing unit (4px, 8px common)',
        '2. Create spacing scale (multiples of base unit)',
        '3. Define layout grid system (12-column, flexbox, etc.)',
        '4. Create container sizes and max-widths',
        '5. Define responsive breakpoints',
        '6. Create margin and padding utilities',
        '7. Define gap values for flexbox/grid',
        '8. Create border radius scale',
        '9. Document spacing usage guidelines',
        '10. Create layout patterns and templates'
      ],
      outputFormat: 'JSON with spacing and layout system'
    },
    outputSchema: {
      type: 'object',
      required: ['spacing', 'artifacts'],
      properties: {
        spacing: { type: 'object' },
        baseUnit: { type: 'number' },
        spacingScale: { type: 'array' },
        gridSystem: { type: 'object' },
        breakpoints: { type: 'object' },
        borderRadius: { type: 'object' },
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

// Phase 6: Component Inventory
export const componentInventoryTask = defineTask('component-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Component Inventory - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Component Inventory Analyst',
      task: 'Create comprehensive component inventory',
      context: args,
      instructions: [
        '1. Audit existing designs and identify all UI components',
        '2. Categorize components (foundational, complex, patterns)',
        '3. Identify component variants and states',
        '4. Map component dependencies',
        '5. Prioritize components by usage frequency',
        '6. Document component purpose and use cases',
        '7. Identify missing components from audit',
        '8. Create component roadmap',
        '9. Generate component inventory matrix'
      ],
      outputFormat: 'JSON with component inventory'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              priority: { type: 'string' },
              variants: { type: 'array' },
              states: { type: 'array' },
              dependencies: { type: 'array' }
            }
          }
        },
        inventoryMatrixPath: { type: 'string' },
        roadmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-system', 'inventory']
}));

// Phase 7 & 8: Component Design Task (used for both foundational and complex)
export const componentDesignTask = defineTask('component-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Component Design: ${args.component.name} - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI Component Designer',
      task: `Design ${args.component.name} component with all variants and states`,
      context: args,
      instructions: [
        '1. Design default component state',
        '2. Create all variants (sizes, styles, types)',
        '3. Design interactive states (hover, active, focus, disabled)',
        '4. Apply design tokens consistently',
        '5. Ensure accessibility (ARIA, keyboard navigation, focus indicators)',
        '6. Design responsive behavior',
        '7. Create component specifications',
        '8. Design dark mode variant if applicable',
        '9. Document component API (props, slots, events)',
        '10. Create usage examples and do-dont guidelines',
        '11. Export component designs',
        '12. Generate component documentation'
      ],
      outputFormat: 'JSON with component design'
    },
    outputSchema: {
      type: 'object',
      required: ['componentName', 'variantCount', 'stateCount', 'accessibilityScore', 'designFilePath', 'artifacts'],
      properties: {
        componentName: { type: 'string' },
        category: { type: 'string' },
        variantCount: { type: 'number' },
        stateCount: { type: 'number' },
        variants: { type: 'array' },
        states: { type: 'array' },
        accessibilityScore: { type: 'number' },
        accessibilityFeatures: { type: 'array' },
        componentAPI: { type: 'object' },
        usageExamples: { type: 'array' },
        designFilePath: { type: 'string' },
        specificationPath: { type: 'string' },
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

// Additional task stubs for remaining phases (9-22)
// For brevity, showing condensed versions:

export const patternLibraryDesignTask = defineTask('pattern-library-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Pattern Library - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Pattern Designer', task: 'Create reusable UI patterns from components', context: args, instructions: ['Design common patterns (forms, cards, modals, navigation)', 'Document pattern usage', 'Create pattern examples'], outputFormat: 'JSON with patterns' },
    outputSchema: { type: 'object', required: ['patternCount', 'artifacts'], properties: { patternCount: { type: 'number' }, patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'patterns']
}));

export const iconSystemDesignTask = defineTask('icon-system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Icon System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Icon Designer', task: 'Design comprehensive icon system', context: args, instructions: ['Create icon grid and design principles', 'Design icon set (outline, filled, colored)', 'Ensure optical balance', 'Export in multiple formats'], outputFormat: 'JSON with icon system' },
    outputSchema: { type: 'object', required: ['iconCount', 'formats', 'artifacts'], properties: { iconCount: { type: 'number' }, formats: { type: 'array' }, iconSetPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'icons']
}));

export const illustrationSystemDesignTask = defineTask('illustration-system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Illustration System - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Illustration Designer', task: 'Design illustration system', context: args, instructions: ['Define illustration style', 'Create illustration library', 'Document usage guidelines'], outputFormat: 'JSON with illustrations' },
    outputSchema: { type: 'object', required: ['illustrationCount', 'artifacts'], properties: { illustrationCount: { type: 'number' }, style: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'illustrations']
}));

export const accessibilityAuditTask = defineTask('accessibility-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Accessibility Audit - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Accessibility Specialist', task: 'Conduct comprehensive accessibility audit', context: args, instructions: ['Audit color contrast ratios', 'Check keyboard navigation', 'Validate ARIA attributes', 'Test screen reader compatibility', 'Create remediation plan'], outputFormat: 'JSON with audit results' },
    outputSchema: { type: 'object', required: ['overallScore', 'criticalIssues', 'complianceStatus', 'reportPath', 'artifacts'], properties: { overallScore: { type: 'number' }, criticalIssues: { type: 'array' }, recommendations: { type: 'array' }, complianceStatus: { type: 'string' }, reportPath: { type: 'string' }, remediationPlanPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'accessibility']
}));

export const responsiveBehaviorTask = defineTask('responsive-behavior', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Responsive Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Responsive Design Specialist', task: 'Design responsive behavior for all components', context: args, instructions: ['Define breakpoint behavior', 'Design mobile adaptations', 'Create responsive rules'], outputFormat: 'JSON with responsive design' },
    outputSchema: { type: 'object', required: ['artifacts'], properties: { responsiveRules: { type: 'array' }, breakpointBehaviors: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'responsive']
}));

export const interactionAnimationTask = defineTask('interaction-animation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Interactions & Animations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Interaction Designer', task: 'Design interactions and animations', context: args, instructions: ['Define micro-interactions', 'Create animation specifications', 'Design transition effects', 'Document motion principles'], outputFormat: 'JSON with interactions' },
    outputSchema: { type: 'object', required: ['artifacts'], properties: { interactionCount: { type: 'number' }, animationSpecs: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'interaction']
}));

export const componentDocumentationTask = defineTask('component-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Component Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Technical Writer', task: 'Create comprehensive component documentation', context: args, instructions: ['Document each component with props, usage, examples', 'Create getting started guide', 'Write contribution guidelines'], outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'componentCount', 'mainDocPath', 'artifacts'], properties: { documentation: { type: 'object' }, componentCount: { type: 'number' }, mainDocPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'documentation']
}));

export const designToolLibraryTask = defineTask('design-tool-library', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Design Tool Library Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Design Tool Specialist', task: 'Set up component library in Figma/Sketch', context: args, instructions: ['Organize components in library', 'Set up styles and tokens', 'Create library structure', 'Publish library'], outputFormat: 'JSON with library setup' },
    outputSchema: { type: 'object', required: ['library', 'tool', 'libraryFilePath', 'publishStatus', 'artifacts'], properties: { library: { type: 'object' }, tool: { type: 'string' }, libraryFilePath: { type: 'string' }, libraryStructure: { type: 'object' }, publishStatus: { type: 'string' }, organizationGuidePath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'tooling']
}));

export const codeImplementationPlanTask = defineTask('code-implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Code Implementation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Frontend Architect', task: 'Plan code implementation strategy', context: args, instructions: ['Define component architecture', 'Plan token transformation', 'Create build pipeline', 'Document implementation guidelines'], outputFormat: 'JSON with implementation plan' },
    outputSchema: { type: 'object', required: ['implementationPlan', 'implementationPlanPath', 'estimatedEffort', 'artifacts'], properties: { implementationPlan: { type: 'object' }, implementationPlanPath: { type: 'string' }, estimatedEffort: { type: 'string' }, architecture: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'implementation']
}));

export const storybookSetupTask = defineTask('storybook-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Storybook Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Storybook Specialist', task: 'Set up Storybook for component documentation', context: args, instructions: ['Configure Storybook', 'Create stories for all components', 'Add addons (a11y, docs, controls)', 'Deploy Storybook'], outputFormat: 'JSON with Storybook setup' },
    outputSchema: { type: 'object', required: ['storiesCount', 'storybookUrl', 'artifacts'], properties: { storiesCount: { type: 'number' }, storybookUrl: { type: 'string' }, addons: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'storybook']
}));

export const governanceVersioningTask = defineTask('governance-versioning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 19: Governance & Versioning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Design System Governance Lead', task: 'Establish governance and versioning', context: args, instructions: ['Define versioning strategy', 'Create contribution process', 'Set up approval workflow', 'Document governance model'], outputFormat: 'JSON with governance' },
    outputSchema: { type: 'object', required: ['governanceModelPath', 'contributionGuidelinePath', 'artifacts'], properties: { governanceModelPath: { type: 'string' }, contributionGuidelinePath: { type: 'string' }, versioningStrategy: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'governance']
}));

export const developerHandoffTask = defineTask('developer-handoff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 20: Developer Handoff - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Design-Dev Bridge Specialist', task: 'Create developer handoff package', context: args, instructions: ['Create handoff documentation', 'Export design assets', 'Generate code snippets', 'Create implementation guide'], outputFormat: 'JSON with handoff package' },
    outputSchema: { type: 'object', required: ['handoffPackagePath', 'assetsPackagePath', 'artifacts'], properties: { handoffPackagePath: { type: 'string' }, assetsPackagePath: { type: 'string' }, codeSnippetsPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'handoff']
}));

export const adoptionTrainingTask = defineTask('adoption-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 21: Adoption & Training - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Change Management Specialist', task: 'Create adoption and training plan', context: args, instructions: ['Create training materials', 'Plan rollout strategy', 'Design onboarding program', 'Set up support channels'], outputFormat: 'JSON with adoption plan' },
    outputSchema: { type: 'object', required: ['trainingPlanPath', 'rolloutStrategy', 'artifacts'], properties: { trainingPlanPath: { type: 'string' }, rolloutStrategy: { type: 'string' }, onboardingMaterials: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'adoption']
}));

export const componentLibraryValidationTask = defineTask('component-library-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 22: Final Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: { role: 'Senior Design System Architect', task: 'Validate component library completeness and quality', context: args, instructions: ['Validate all components are complete', 'Check documentation completeness', 'Verify accessibility compliance', 'Assess production readiness', 'Generate validation report'], outputFormat: 'JSON with validation results' },
    outputSchema: { type: 'object', required: ['validationScore', 'productionReady', 'verdict', 'recommendation', 'reportPath', 'artifacts'], properties: { validationScore: { type: 'number', minimum: 0, maximum: 100 }, productionReady: { type: 'boolean' }, qualityGates: { type: 'object' }, verdict: { type: 'string' }, recommendation: { type: 'string', enum: ['approve', 'conditional-approve', 'review-required'] }, strengths: { type: 'array' }, concerns: { type: 'array' }, reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'design-system', 'validation']
}));

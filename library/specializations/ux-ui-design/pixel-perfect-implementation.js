/**
 * @process specializations/ux-ui-design/pixel-perfect-implementation
 * @description Pixel-Perfect UI Implementation Process - A comprehensive, iterative convergence process
 * for achieving exact visual fidelity between design mocks and implementation. Uses multi-dimensional
 * scoring across layout, typography, colors, spacing, components, and decorative elements with strict
 * quality gates and continuous refinement until target quality is achieved.
 *
 * This process is generic and can be used with any design mock (Figma, image files, etc.) to ensure
 * the implementation matches the design specification exactly.
 *
 * @inputs {
 *   projectName: string,
 *   mockSource: { type: 'image'|'figma'|'sketch'|'url', path: string, frame?: string },
 *   targetUrl: string,
 *   targetQuality: number,
 *   maxIterations: number,
 *   scoringWeights?: object,
 *   tolerances?: object,
 *   viewports?: array,
 *   includeResponsive?: boolean,
 *   includeAccessibility?: boolean
 * }
 * @outputs {
 *   success: boolean,
 *   converged: boolean,
 *   finalScore: number,
 *   iterations: number,
 *   improvements: array,
 *   artifacts: array
 * }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/pixel-perfect-implementation', {
 *   projectName: 'Dashboard Redesign',
 *   mockSource: { type: 'image', path: '/designs/dashboard-mock.png' },
 *   targetUrl: 'http://localhost:3000/dashboard',
 *   targetQuality: 98,
 *   maxIterations: 15,
 *   scoringWeights: {
 *     layout: 25,
 *     typography: 20,
 *     colors: 20,
 *     spacing: 15,
 *     components: 10,
 *     decorative: 10
 *   },
 *   tolerances: {
 *     pixelDifference: 0.5,
 *     colorDelta: 3,
 *     spacingPx: 2,
 *     fontSizePx: 1
 *   }
 * });
 *
 * @agents
 * - design-mock-analyzer: Extracts specifications from design mocks
 * - visual-qa-scorer: Multi-dimensional visual quality scoring
 * - refinement-planner: Prioritizes changes for maximum impact
 * - ui-implementer: Executes refinement plan in codebase
 * - responsive-verifier: Tests implementation across viewports
 * - accessibility-verifier: Checks WCAG compliance
 *
 * @skills
 * - visual-diff-scorer: Pixel-diff and structural analysis
 * - mock-spec-extractor: Design specification extraction
 * - css-precision-editor: Precision CSS modifications
 *
 * @references
 * - Visual QA Best Practices: https://www.smashingmagazine.com/
 * - Pixel-Perfect Design Implementation: https://css-tricks.com/
 * - Visual Regression Testing: https://playwright.dev/docs/test-snapshots
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    mockSource,
    targetUrl,
    targetQuality = 98,
    maxIterations = 20,
    scoringWeights = {
      layout: 25,        // Structure, positioning, alignment
      typography: 20,    // Fonts, sizes, weights, spacing
      colors: 20,        // Colors, gradients, opacity
      spacing: 15,       // Margins, padding, gaps
      components: 10,    // Buttons, inputs, cards
      decorative: 10     // Icons, illustrations, effects
    },
    tolerances = {
      pixelDifference: 0.5,  // % pixel difference threshold
      colorDelta: 3,         // Delta-E color difference (0-100)
      spacingPx: 2,          // px tolerance for spacing
      fontSizePx: 1,         // px tolerance for font sizes
      lineHeightPx: 2,       // px tolerance for line height
      borderRadiusPx: 1      // px tolerance for border radius
    },
    viewports = [{ name: 'desktop', width: 1920, height: 1080 }],
    includeResponsive = false,
    includeAccessibility = true,
    breakpointInterval = 1  // Create breakpoint every N iterations (1 = every iteration)
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const improvements = [];
  let iteration = 0;
  let currentScore = 0;
  let converged = false;

  ctx.log('info', `Starting Pixel-Perfect Implementation Process: ${projectName}`);
  ctx.log('info', `Target Quality: ${targetQuality}%, Max Iterations: ${maxIterations}`);
  ctx.log('info', `Mock Source: ${mockSource.type} - ${mockSource.path}`);
  ctx.log('info', `Target URL: ${targetUrl}`);

  // ============================================================================
  // PHASE 1: DESIGN MOCK ANALYSIS
  // Comprehensive extraction of all visual specifications from the design mock
  // ============================================================================

  ctx.log('info', 'Phase 1: Comprehensive design mock analysis');

  const mockAnalysis = await ctx.task(analyzeDesignMockTask, {
    mockSource,
    scoringWeights,
    tolerances,
    outputDir: `${ctx.runDir}/artifacts`
  });

  if (!mockAnalysis.success) {
    return {
      success: false,
      error: 'Design mock analysis failed',
      details: mockAnalysis,
      metadata: {
        processId: 'specializations/ux-ui-design/pixel-perfect-implementation',
        timestamp: startTime
      }
    };
  }

  artifacts.push({
    path: `${ctx.runDir}/artifacts/mock-analysis.json`,
    format: 'json',
    label: 'Design Mock Analysis'
  });

  ctx.log('info', `Mock analysis complete: ${mockAnalysis.elementsIdentified} elements identified`);
  ctx.log('info', `Color palette: ${mockAnalysis.colorPalette?.colors?.length || 0} colors`);
  ctx.log('info', `Typography styles: ${mockAnalysis.typography?.styles?.length || 0} styles`);
  ctx.log('info', `Components: ${mockAnalysis.components?.length || 0} components`);

  // ============================================================================
  // PHASE 2: INITIAL IMPLEMENTATION ASSESSMENT
  // Capture current state and establish baseline score
  // ============================================================================

  ctx.log('info', 'Phase 2: Initial implementation assessment');

  // Capture initial screenshot
  const initialScreenshot = await ctx.task(captureImplementationTask, {
    targetUrl,
    viewports,
    iteration: 0,
    label: 'initial',
    outputDir: `${ctx.runDir}/artifacts`
  });

  artifacts.push({
    path: initialScreenshot.screenshotPath,
    format: 'image',
    label: 'Initial Screenshot'
  });

  // Score initial implementation
  const initialScore = await ctx.task(scoreImplementationTask, {
    mockSource,
    mockAnalysis,
    screenshotPath: initialScreenshot.screenshotPath,
    scoringWeights,
    tolerances,
    iteration: 0,
    outputDir: `${ctx.runDir}/artifacts`
  });

  currentScore = initialScore.overallScore;
  converged = currentScore >= targetQuality;

  improvements.push({
    iteration: 0,
    score: currentScore,
    label: 'initial-assessment',
    screenshotPath: initialScreenshot.screenshotPath,
    breakdown: initialScore.breakdown,
    gaps: initialScore.majorGaps
  });

  ctx.log('info', `Initial score: ${currentScore}/${targetQuality}`);

  // Breakpoint: Review initial assessment
  await ctx.breakpoint({
    question: `Initial assessment complete. Score: ${currentScore}/100 (target: ${targetQuality}). ` +
              `${initialScore.majorGaps?.length || 0} major gaps identified. ` +
              `Review gap analysis and approve to begin refinement?`,
    title: 'Initial Assessment Review',
    tag: 'initial-assessment',
    context: {
      runId: ctx.runId,
      score: currentScore,
      targetQuality,
      breakdown: initialScore.breakdown,
      majorGaps: initialScore.majorGaps,
      mockElements: mockAnalysis.elementsIdentified
    }
  });

  // ============================================================================
  // PHASE 3: ITERATIVE CONVERGENCE LOOP
  // Plan → Implement → Capture → Score → Review (repeat until converged)
  // ============================================================================

  ctx.log('info', 'Phase 3: Starting iterative convergence loop');

  while (!converged && iteration < maxIterations) {
    iteration++;
    const previousScore = currentScore;

    ctx.log('info', `=== Iteration ${iteration} ===`);

    // Step 3.1: Analyze gaps and plan refinements
    const refinementPlan = await ctx.task(planRefinementsTask, {
      iteration,
      mockAnalysis,
      previousScore: improvements[improvements.length - 1],
      scoringWeights,
      tolerances,
      outputDir: `${ctx.runDir}/artifacts`
    });

    ctx.log('info', `Planned ${refinementPlan.changes?.length || 0} refinements`);

    // Step 3.2: Implement refinements
    const implementation = await ctx.task(implementRefinementsTask, {
      iteration,
      mockAnalysis,
      refinementPlan,
      targetUrl,
      outputDir: `${ctx.runDir}/artifacts`
    });

    if (!implementation.success) {
      ctx.log('warn', `Implementation partially failed: ${implementation.failedChanges?.length || 0} changes could not be applied`);
    }

    // Step 3.3: Capture updated screenshot
    const screenshot = await ctx.task(captureImplementationTask, {
      targetUrl,
      viewports,
      iteration,
      label: `iteration-${iteration}`,
      outputDir: `${ctx.runDir}/artifacts`
    });

    artifacts.push({
      path: screenshot.screenshotPath,
      format: 'image',
      label: `Iteration ${iteration} Screenshot`
    });

    // Step 3.4: Score updated implementation
    const score = await ctx.task(scoreImplementationTask, {
      mockSource,
      mockAnalysis,
      screenshotPath: screenshot.screenshotPath,
      scoringWeights,
      tolerances,
      iteration,
      outputDir: `${ctx.runDir}/artifacts`
    });

    currentScore = score.overallScore;
    converged = currentScore >= targetQuality;
    const improvement = currentScore - previousScore;

    improvements.push({
      iteration,
      score: currentScore,
      previousScore,
      improvement,
      screenshotPath: screenshot.screenshotPath,
      breakdown: score.breakdown,
      gaps: score.remainingGaps,
      changesImplemented: implementation.changesApplied
    });

    ctx.log('info', `Iteration ${iteration} complete: ${currentScore}/${targetQuality} (+${improvement})`);

    // Step 3.5: Breakpoint for review (based on interval setting)
    if (!converged && (iteration % breakpointInterval === 0 || improvement < 0)) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: Score ${currentScore}/${targetQuality} ` +
                  `(${improvement >= 0 ? '+' : ''}${improvement}). ` +
                  `${score.remainingGaps?.length || 0} gaps remaining. ` +
                  `Continue refinement?`,
        title: `Pixel-Perfect Convergence - Iteration ${iteration}`,
        tag: `iteration-${iteration}-review`,
        context: {
          runId: ctx.runId,
          iteration,
          score: currentScore,
          targetQuality,
          improvement,
          breakdown: score.breakdown,
          remainingGaps: score.remainingGaps,
          changesApplied: implementation.changesApplied?.length || 0
        }
      });
    }

    // Early exit if no improvement for consecutive iterations
    if (improvement <= 0 && iteration > 3) {
      const lastThree = improvements.slice(-3);
      const noProgress = lastThree.every(i => i.improvement <= 0);
      if (noProgress) {
        ctx.log('warn', 'No progress in last 3 iterations, may need manual intervention');
        await ctx.breakpoint({
          question: `No improvement in last 3 iterations. Current score: ${currentScore}/${targetQuality}. ` +
                    `Continue with different approach or accept current state?`,
          title: 'Convergence Stalled',
          tag: 'convergence-stalled',
          context: {
            runId: ctx.runId,
            currentScore,
            lastThreeIterations: lastThree
          }
        });
      }
    }
  }

  // ============================================================================
  // PHASE 4: RESPONSIVE VERIFICATION (Optional)
  // Verify implementation across different viewports
  // ============================================================================

  let responsiveResults = null;
  if (includeResponsive && viewports.length > 1) {
    ctx.log('info', 'Phase 4: Responsive verification');

    responsiveResults = await ctx.task(verifyResponsiveDesignTask, {
      targetUrl,
      viewports,
      mockSource,
      mockAnalysis,
      tolerances,
      outputDir: `${ctx.runDir}/artifacts`
    });

    artifacts.push(...(responsiveResults.artifacts || []));
    ctx.log('info', `Responsive verification: ${responsiveResults.passRate}% pass rate`);
  }

  // ============================================================================
  // PHASE 5: ACCESSIBILITY VERIFICATION (Optional)
  // Verify implementation meets accessibility standards
  // ============================================================================

  let accessibilityResults = null;
  if (includeAccessibility) {
    ctx.log('info', 'Phase 5: Accessibility verification');

    accessibilityResults = await ctx.task(verifyAccessibilityTask, {
      targetUrl,
      mockAnalysis,
      outputDir: `${ctx.runDir}/artifacts`
    });

    artifacts.push({
      path: `${ctx.runDir}/artifacts/accessibility-report.json`,
      format: 'json',
      label: 'Accessibility Report'
    });

    ctx.log('info', `Accessibility: ${accessibilityResults.violations?.length || 0} violations found`);
  }

  // ============================================================================
  // PHASE 6: FINAL QUALITY GATE
  // ============================================================================

  ctx.log('info', 'Phase 6: Final quality assessment');

  const finalResult = {
    success: converged,
    converged,
    finalScore: currentScore,
    targetQuality,
    iterations: iteration,
    improvements,
    responsiveResults,
    accessibilityResults,
    artifacts,
    metadata: {
      processId: 'specializations/ux-ui-design/pixel-perfect-implementation',
      projectName,
      mockSource,
      targetUrl,
      startTime,
      endTime: ctx.now(),
      scoringWeights,
      tolerances
    }
  };

  if (converged) {
    ctx.log('info', `SUCCESS: Pixel-perfect quality achieved at ${currentScore}% after ${iteration} iterations`);

    await ctx.breakpoint({
      question: `Target quality achieved! Final score: ${currentScore}/${targetQuality}. ` +
                `${iteration} iterations completed. ` +
                `Review final implementation and approve for completion?`,
      title: 'Pixel-Perfect Implementation Complete',
      tag: 'final-approval',
      context: {
        runId: ctx.runId,
        finalResult: {
          score: currentScore,
          iterations: iteration,
          improvements: improvements.map(i => ({ iteration: i.iteration, score: i.score }))
        }
      }
    });
  } else {
    ctx.log('warn', `Did not converge: Score ${currentScore}% after ${maxIterations} iterations`);

    await ctx.breakpoint({
      question: `Max iterations reached. Final score: ${currentScore}/${targetQuality} (${targetQuality - currentScore} points short). ` +
                `Accept current state or continue manual refinement?`,
      title: 'Final Quality Gate',
      tag: 'final-quality-gate',
      context: {
        runId: ctx.runId,
        finalResult
      }
    });
  }

  return finalResult;
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Analyze Design Mock Task
 * Extracts comprehensive specifications from the design mock including colors,
 * typography, spacing, components, and decorative elements.
 */
export const analyzeDesignMockTask = defineTask('analyze-design-mock', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze design mock comprehensively',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UI/UX designer and design system architect with pixel-perfect attention to detail',
      task: 'Analyze the design mock exhaustively to extract every visual specification needed for exact implementation',
      context: {
        mockSource: args.mockSource,
        scoringWeights: args.scoringWeights,
        tolerances: args.tolerances
      },
      instructions: [
        `Load and analyze the design mock from: ${args.mockSource.path}`,
        '',
        '=== LAYOUT ANALYSIS ===',
        '- Document the overall page structure and grid system',
        '- Identify container widths, max-widths, and breakpoints',
        '- Map element positions (absolute coordinates where relevant)',
        '- Document alignment patterns (center, flex, grid)',
        '- Note any fixed or sticky positioning',
        '',
        '=== TYPOGRAPHY ANALYSIS ===',
        'For EVERY text element, extract:',
        '- Font family (exact name, fallbacks)',
        '- Font size (px)',
        '- Font weight (numeric: 400, 500, 600, 700, etc.)',
        '- Line height (px or ratio)',
        '- Letter spacing (px or em)',
        '- Text color (exact hex code)',
        '- Text transform (uppercase, capitalize, etc.)',
        '- Text shadow (if any)',
        '- Text decoration (underline, etc.)',
        '',
        '=== COLOR ANALYSIS ===',
        'Extract complete color palette:',
        '- Primary colors (exact hex codes)',
        '- Secondary colors',
        '- Background colors (solid and gradients)',
        '- Text colors (primary, secondary, muted)',
        '- Border colors',
        '- Shadow colors with opacity',
        '- Accent colors',
        '- State colors (hover, active, disabled)',
        '- Gradient definitions (angle, color stops with positions)',
        '- Textures or patterns (if apparent)',
        '- Special rendering, effects, filtering, transformations, even shaders or post-processing effects if needed',
        '',
        '=== SPACING ANALYSIS ===',
        '- Document spacing scale/system if apparent',
        '- Margins for all major elements (top, right, bottom, left)',
        '- Padding for all containers and components',
        '- Gap values for flex/grid layouts',
        '- White space patterns',
        '',
        '=== COMPONENT ANALYSIS ===',
        'For each UI component (buttons, inputs, cards, etc.):',
        '- Dimensions (width, height, min/max)',
        '- Border (width, style, color, radius)',
        '- Background (color, gradient, image)',
        '- Shadow (x, y, blur, spread, color)',
        '- Padding and internal spacing',
        '- Typography specifications',
        '- Animations or transitions (if apparent)',
        '- Textures or patterns (if apparent)',
        '- Decoration and geometry (if apparent)',
        '- Special rendering, effects, filtering, transformations, even shaders or post-processing effects if needed',
        '- State variations (hover, focus, active, disabled)',
        '',
        '=== DECORATIVE ELEMENTS ===',
        '- Icons (size, color, style)',
        '- Illustrations and graphics',
        '- Dividers and separators',
        '- Background patterns or textures',
        '- SVG elements and their properties',
        '- Animations or transitions (if apparent)',
        '- Textures or patterns (if apparent)',
        '- Special rendering, effects, filtering, transformations, even shaders or post-processing effects if needed',
        '',
        '=== CRITICAL REQUIREMENTS ===',
        'Identify elements that MUST match exactly vs those with flexibility',
        'Document any design system tokens or variables',
        'Note any responsive variations visible in the mock'
      ],
      outputFormat: 'JSON with success, elementsIdentified, layout, typography, colorPalette, spacing, components, decorativeElements, criticalRequirements, designTokens'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'elementsIdentified'],
      properties: {
        success: { type: 'boolean' },
        elementsIdentified: { type: 'number' },
        layout: {
          type: 'object',
          properties: {
            structure: { type: 'string' },
            grid: { type: 'object' },
            containers: { type: 'array' },
            positioning: { type: 'array' }
          }
        },
        typography: {
          type: 'object',
          properties: {
            styles: { type: 'array' },
            fontFamilies: { type: 'array' },
            scale: { type: 'array' }
          }
        },
        colorPalette: {
          type: 'object',
          properties: {
            colors: { type: 'array' },
            gradients: { type: 'array' },
            semantic: { type: 'object' }
          }
        },
        spacing: {
          type: 'object',
          properties: {
            scale: { type: 'array' },
            elements: { type: 'array' }
          }
        },
        components: { type: 'array' },
        decorativeElements: { type: 'array' },
        criticalRequirements: { type: 'array' },
        designTokens: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analysis', 'design-mock']
}));

/**
 * Capture Implementation Task
 * Captures high-quality screenshots of the current implementation
 */
export const captureImplementationTask = defineTask('capture-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture implementation screenshot (${args.label || `iteration-${args.iteration}`})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA automation engineer',
      task: 'Capture a high-quality screenshot of the current implementation for visual comparison',
      context: {
        targetUrl: args.targetUrl,
        viewports: args.viewports,
        iteration: args.iteration,
        label: args.label
      },
      instructions: [
        `Navigate to: ${args.targetUrl}`,
        'Wait for page to fully load (including all images, fonts, and animations)',
        'Ensure all lazy-loaded content is visible',
        `Set viewport to: ${args.viewports?.[0]?.width || 1920}x${args.viewports?.[0]?.height || 1080}`,
        'Disable any loading spinners or skeleton states',
        'Wait for any CSS transitions to complete',
        'Capture full-page or viewport screenshot using Playwright',
        `Save as: ${args.outputDir}/screenshot-${args.label || `iteration-${args.iteration}`}.png`,
        'Return the screenshot file path'
      ],
      outputFormat: 'JSON with success, screenshotPath, viewport, capturedAt'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'screenshotPath'],
      properties: {
        success: { type: 'boolean' },
        screenshotPath: { type: 'string' },
        viewport: { type: 'object' },
        capturedAt: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'screenshot', `iteration-${args.iteration}`]
}));

/**
 * Score Implementation Task
 * Performs multi-dimensional scoring of implementation against design mock
 */
export const scoreImplementationTask = defineTask('score-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score implementation (iteration ${args.iteration})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Expert visual QA specialist with strict attention to pixel-perfect accuracy',
      task: 'Compare the implementation screenshot against the design mock and score across all dimensions',
      context: {
        mockSource: args.mockSource,
        mockAnalysis: args.mockAnalysis,
        screenshotPath: args.screenshotPath,
        scoringWeights: args.scoringWeights,
        tolerances: args.tolerances,
        iteration: args.iteration
      },
      instructions: [
        'Load both images for comparison:',
        `  - Design mock: ${args.mockSource.path}`,
        `  - Implementation: ${args.screenshotPath}`,
        '',
        '=== SCORING RUBRIC ===',
        '',
        `LAYOUT (${args.scoringWeights?.layout || 25} points):`,
        '- Overall structure matches design (-5 per major difference)',
        '- Element positioning accurate (-2 per misalignment >5px)',
        '- Container sizes correct (-2 per significant size difference)',
        '- Grid/flex alignment proper (-1 per minor alignment issue)',
        '',
        `TYPOGRAPHY (${args.scoringWeights?.typography || 20} points):`,
        '- Correct font families (-5 per wrong font)',
        '- Font sizes match (-2 per size mismatch >1px)',
        '- Font weights correct (-1 per weight mismatch)',
        '- Line heights match (-1 per line height mismatch)',
        '- Letter spacing correct (-1 per spacing mismatch)',
        '- Text colors match (-1 per color mismatch)',
        '',
        `COLORS (${args.scoringWeights?.colors || 20} points):`,
        '- Background colors match (-3 per mismatch)',
        '- Gradients correct (-3 per gradient issue)',
        '- Border colors match (-1 per mismatch)',
        '- Text colors match (-1 per mismatch)',
        '- Shadow colors/opacity correct (-1 per mismatch)',
        '',
        `SPACING (${args.scoringWeights?.spacing || 15} points):`,
        '- Margins match (-2 per mismatch >2px)',
        '- Padding correct (-2 per mismatch >2px)',
        '- Gaps between elements correct (-1 per mismatch)',
        '',
        `COMPONENTS (${args.scoringWeights?.components || 10} points):`,
        '- Button styling matches (-2 per component type off)',
        '- Input styling correct (-2 per input style issue)',
        '- Card styling matches (-2 per card issue)',
        '- Border radius correct (-1 per radius mismatch)',
        '- Decoration and geometry (if apparent)',
        '- Special rendering, effects, filtering, transformations, even shaders or post-processing effects if needed',
        '- Textures or patterns (if apparent)',
        '',
        `DECORATIVE (${args.scoringWeights?.decorative || 10} points):`,
        '- Icons present and correct (-2 per missing/wrong icon)',
        '- Illustrations/graphics match (-2 per difference)',
        '- Decorative elements positioned correctly (-1 per misposition)',
        '- Visual effects (shadows, etc.) match (-1 per effect issue)',
        '- Decoration and geometry (if apparent)',
        '- Special rendering, effects, filtering, transformations, even shaders or post-processing effects if needed',
        '- Textures or patterns (if apparent)',
        '',
        'BE OBJECTIVE AND CONSISTENT.',
        'Document SPECIFIC differences found.',
        'Prioritize remaining gaps by visual impact.',
        'Provide actionable feedback for each deduction.'
      ],
      outputFormat: 'JSON with overallScore, breakdown (by category), differences, feedback, majorGaps, remainingGaps, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'breakdown', 'feedback'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: {
          type: 'object',
          properties: {
            layout: { type: 'number' },
            typography: { type: 'number' },
            colors: { type: 'number' },
            spacing: { type: 'number' },
            components: { type: 'number' },
            decorative: { type: 'number' }
          }
        },
        differences: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'array', items: { type: 'string' } },
        majorGaps: { type: 'array', items: { type: 'string' } },
        remainingGaps: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scoring', `iteration-${args.iteration}`]
}));

/**
 * Plan Refinements Task
 * Analyzes gaps and creates detailed plan for next iteration
 */
export const planRefinementsTask = defineTask('plan-refinements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan refinements for iteration ${args.iteration}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UI implementation strategist',
      task: 'Analyze scoring feedback and create a prioritized plan for the most impactful refinements',
      context: {
        iteration: args.iteration,
        mockAnalysis: args.mockAnalysis,
        previousScore: args.previousScore,
        scoringWeights: args.scoringWeights
      },
      instructions: [
        'Review the previous score breakdown and feedback carefully',
        '',
        'PRIORITIZATION CRITERIA:',
        '1. Highest point impact (fix issues causing largest deductions)',
        '2. Cascading fixes (changes that fix multiple issues)',
        '3. Foundational fixes (layout before details)',
        '',
        'For each planned change, specify:',
        '- Target file(s) to modify',
        '- Exact CSS property or code change (if simple enough to be describe as a single css change)',
        '- Current value vs target value (if simple enough to be describe as a single css change)',
        '- Description of the change',
        '- Estimated point improvement',
        '- Any dependencies on other changes',
        '',
        'LIMIT TO 5-7 CHANGES per iteration to ensure quality',
        'Focus on measurable, verifiable changes',
        'Include specific values (colors, dimensions, etc.)'
      ],
      outputFormat: 'JSON with changes (array of {description, estimatedImpact}), estimatedTotalImprovement, implementationOrder'
    },
    outputSchema: {
      type: 'object',
      required: ['changes', 'estimatedTotalImprovement'],
      properties: {
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              estimatedImpact: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        estimatedTotalImprovement: { type: 'number' },
        implementationOrder: { type: 'array', items: { type: 'number' } },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'planning', `iteration-${args.iteration}`]
}));

/**
 * Implement Refinements Task
 * Applies the planned changes to the codebase
 */
export const implementRefinementsTask = defineTask('implement-refinements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement refinements (iteration ${args.iteration})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Frontend developer implementing pixel-perfect UI changes',
      task: 'Implement the planned refinements with exact precision',
      context: {
        iteration: args.iteration,
        mockAnalysis: args.mockAnalysis,
        refinementPlan: args.refinementPlan,
        targetUrl: args.targetUrl
      },
      instructions: [
        'Follow the refinement plan in order',
        '',
        'For each planned change:',
        '1. Read the target files',
        '2. Locate the exact changes and elements to apply the changes to',
        '3. Apply the EXACT change specified',
        '4. Verify the change was applied correctly',
        '',
        'PRECISION REQUIREMENTS:',
        '- Use exact hex color codes (not named colors)',
        '- Use exact pixel values (not relative units where specified)',
        '- Match exact gradient angles and color stops',
        '- Use exact font-family strings with proper quotes',
        '- Apply exact border-radius values',
        '- Decoration and geometry (if apparent)',
        '- Special rendering, effects, filtering, transformations, even shaders or post-processing effects if needed',
        '- Textures or patterns (if apparent)',
        '',
        'DO NOT:',
        '- Make additional "improvements" not in the plan',
        '- Change unrelated code',
        '',
        'Report each change with before/after values'
      ],
      outputFormat: 'JSON with success, changesApplied (array), failedChanges (array), filesModified (array), summary'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'changesApplied'],
      properties: {
        success: { type: 'boolean' },
        changesApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              change: { type: 'string' },
              beforeValue: { type: 'string' },
              afterValue: { type: 'string' }
            }
          }
        },
        failedChanges: { type: 'array' },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'implementation', `iteration-${args.iteration}`]
}));

/**
 * Verify Responsive Design Task
 * Tests implementation across multiple viewports
 */
export const verifyResponsiveDesignTask = defineTask('verify-responsive-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify responsive design',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Responsive design QA specialist',
      task: 'Verify the implementation works correctly across all specified viewports',
      context: {
        targetUrl: args.targetUrl,
        viewports: args.viewports,
        mockAnalysis: args.mockAnalysis
      },
      instructions: [
        'For each viewport size:',
        '1. Set the browser viewport',
        '2. Capture screenshot',
        '3. Verify layout adapts appropriately',
        '4. Check for overflow issues',
        '5. Verify touch targets are adequate on mobile',
        '6. Check text readability',
        '',
        'Common issues to check:',
        '- Horizontal scrolling on mobile',
        '- Text overflow or truncation',
        '- Image scaling issues',
        '- Navigation collapse behavior',
        '- Touch target sizes (min 44x44px)',
        '- Font size readability (min 16px on mobile)'
      ],
      outputFormat: 'JSON with passRate, viewportResults (array), issues (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['passRate', 'viewportResults'],
      properties: {
        passRate: { type: 'number' },
        viewportResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewport: { type: 'string' },
              passed: { type: 'boolean' },
              issues: { type: 'array' },
              screenshotPath: { type: 'string' }
            }
          }
        },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'responsive', 'verification']
}));

/**
 * Verify Accessibility Task
 * Runs accessibility checks on the implementation
 */
export const verifyAccessibilityTask = defineTask('verify-accessibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify accessibility compliance',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Accessibility specialist',
      task: 'Verify the implementation meets WCAG 2.1 AA accessibility standards',
      context: {
        targetUrl: args.targetUrl,
        mockAnalysis: args.mockAnalysis
      },
      instructions: [
        'Run accessibility audit on the page',
        '',
        'Check for:',
        '- Color contrast (minimum 4.5:1 for normal text, 3:1 for large)',
        '- Keyboard navigation (all interactive elements reachable)',
        '- Focus indicators (visible focus states)',
        '- Alt text for images',
        '- Proper heading hierarchy (h1-h6)',
        '- Form labels and error messages',
        '- ARIA labels where appropriate',
        '- Skip links for navigation',
        '',
        'Use axe-core or similar tool if available',
        'Document all violations with severity levels',
        'Provide remediation suggestions'
      ],
      outputFormat: 'JSON with wcagLevel, violations (array with severity), passes (array), recommendations (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['wcagLevel', 'violations'],
      properties: {
        wcagLevel: { type: 'string' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              impact: { type: 'string' },
              description: { type: 'string' },
              nodes: { type: 'array' },
              remediation: { type: 'string' }
            }
          }
        },
        passes: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'accessibility', 'verification']
}));

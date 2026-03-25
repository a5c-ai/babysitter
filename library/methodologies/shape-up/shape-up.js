/**
 * @process methodologies/shape-up
 * @description Shape Up - Basecamp's methodology for building products through 6-week cycles with shaping, betting, and building phases
 * @inputs { projectName: string, workDescription: string, appetite?: string, cycleWeeks?: number, teamSize?: string, phase?: string }
 * @outputs { success: boolean, pitch?: object, scopeMap?: object, hillChart?: object, cycle?: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Shape Up Process
 *
 * Basecamp's methodology for product development through fixed-time, variable-scope cycles.
 * Emphasizes appetite-driven development, upfront shaping, betting table decisions, and
 * autonomous team execution with hill chart progress tracking.
 *
 * Methodology: Ryan Singer / Basecamp (2019)
 *
 * This process implements:
 * - Shaping: Abstract design work before committing resources
 * - Betting: Senior team decides what to build
 * - Building: Small autonomous teams with 6-week cycles
 * - Cool-down: 2-week breaks between cycles
 * - Hill Charts: Visual progress tracking (uphill = figuring out, downhill = executing)
 * - Circuit Breaker: Work doesn't get extended automatically
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Project name
 * @param {string} inputs.workDescription - Description of the work to shape/bet/build
 * @param {string} inputs.appetite - Time appetite: 'small-batch' (1-2 weeks), 'big-batch' (6 weeks) (default: 'big-batch')
 * @param {number} inputs.cycleWeeks - Cycle length in weeks (default: 6)
 * @param {string} inputs.teamSize - Team size: 'one-designer-two-programmers', 'one-designer-one-programmer' (default: 'one-designer-two-programmers')
 * @param {string} inputs.phase - Which phase to run: 'shaping', 'betting', 'building', 'cool-down', 'full-cycle' (default: 'full-cycle')
 * @param {string} inputs.existingPitch - Existing pitch document to use (for betting/building phases)
 * @param {Array<string>} inputs.competingPitches - Other pitches competing for resources (for betting phase)
 * @param {Object} inputs.teamCapacity - Team capacity and availability
 * @param {boolean} inputs.includeCoolDown - Include cool-down phase activities (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with pitch, scope map, hill chart, and cycle artifacts
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    workDescription,
    appetite = 'big-batch',
    cycleWeeks = 6,
    teamSize = 'one-designer-two-programmers',
    phase = 'full-cycle',
    existingPitch = null,
    competingPitches = [],
    teamCapacity = null,
    includeCoolDown = true
  } = inputs;

  // Validate inputs
  if (!projectName || !workDescription) {
    throw new Error('projectName and workDescription are required');
  }

  const validAppetites = ['small-batch', 'big-batch'];
  if (!validAppetites.includes(appetite)) {
    throw new Error(`appetite must be one of: ${validAppetites.join(', ')}`);
  }

  const validPhases = ['shaping', 'betting', 'building', 'cool-down', 'full-cycle'];
  if (!validPhases.includes(phase)) {
    throw new Error(`phase must be one of: ${validPhases.join(', ')}`);
  }

  const results = {
    projectName,
    workDescription,
    appetite,
    cycleWeeks,
    phase
  };

  // ============================================================================
  // PHASE 1: SHAPING
  // ============================================================================

  if (phase === 'shaping' || phase === 'full-cycle') {
    // Step 1: Set boundaries (appetite)
    const appetiteResult = await ctx.task(defineAppetiteTask, {
      projectName,
      workDescription,
      appetite,
      cycleWeeks
    });

    results.appetiteDefinition = appetiteResult;

    // Step 2: Rough out the elements (breadboarding)
    const breadboardResult = await ctx.task(breadboardingTask, {
      projectName,
      workDescription,
      appetite: appetiteResult,
      cycleWeeks
    });

    results.breadboard = breadboardResult;

    // Step 3: Address risks and rabbit holes
    const rabbitHolesResult = await ctx.task(identifyRabbitHolesTask, {
      projectName,
      workDescription,
      breadboard: breadboardResult,
      appetite: appetiteResult
    });

    results.rabbitHoles = rabbitHolesResult;

    // Step 4: Fat marker sketches (if UI work)
    const sketchesResult = await ctx.task(fatMarkerSketchesTask, {
      projectName,
      workDescription,
      breadboard: breadboardResult,
      appetite: appetiteResult
    });

    results.sketches = sketchesResult;

    // Step 5: Write the pitch
    const pitchResult = await ctx.task(writePitchTask, {
      projectName,
      workDescription,
      appetite: appetiteResult,
      breadboard: breadboardResult,
      rabbitHoles: rabbitHolesResult,
      sketches: sketchesResult,
      cycleWeeks
    });

    results.pitch = pitchResult;

    // Breakpoint: Review shaped work
    await ctx.breakpoint({
      question: `Shaping complete for "${workDescription}". Appetite: ${appetite} (${appetiteResult.timeEstimate}). ${rabbitHolesResult.rabbitHoles.length} rabbit holes identified, ${rabbitHolesResult.noGos.length} no-gos defined. Ready to present pitch at betting table?`,
      title: 'Shaping Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/shape-up/shaping/pitch.md', format: 'markdown', label: 'Pitch Document' },
          { path: 'artifacts/shape-up/shaping/breadboard.md', format: 'markdown', label: 'Breadboard' },
          { path: 'artifacts/shape-up/shaping/sketches.md', format: 'markdown', label: 'Fat Marker Sketches' },
          { path: 'artifacts/shape-up/shaping/rabbit-holes.json', format: 'code', language: 'json', label: 'Risks & Rabbit Holes' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 2: BETTING
  // ============================================================================

  if (phase === 'betting' || phase === 'full-cycle') {
    const pitchToEvaluate = existingPitch || results.pitch;

    if (!pitchToEvaluate) {
      throw new Error('No pitch available for betting phase. Either complete shaping first or provide existingPitch.');
    }

    // Betting table evaluation
    const bettingEvaluation = await ctx.task(bettingTableEvaluationTask, {
      projectName,
      pitch: pitchToEvaluate,
      competingPitches,
      teamCapacity: teamCapacity || {
        availableTeams: 1,
        teamComposition: teamSize,
        currentCommitments: []
      },
      cycleWeeks
    });

    results.bettingEvaluation = bettingEvaluation;

    // Breakpoint: Betting table decision
    await ctx.breakpoint({
      question: `Betting table evaluation complete. Score: ${bettingEvaluation.score}/100. Recommendation: ${bettingEvaluation.recommendation}. Key factors: ${bettingEvaluation.keyFactors.slice(0, 3).join(', ')}. ${competingPitches.length} competing pitches. Place bet on this work?`,
      title: 'Betting Table Decision',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/shape-up/betting/evaluation.md', format: 'markdown', label: 'Betting Evaluation' },
          { path: 'artifacts/shape-up/betting/comparison.md', format: 'markdown', label: 'Pitch Comparison' }
        ]
      }
    });

    // If bet is placed, create cycle plan
    if (bettingEvaluation.recommendation === 'bet') {
      const cyclePlan = await ctx.task(createCyclePlanTask, {
        projectName,
        pitch: pitchToEvaluate,
        cycleWeeks,
        teamSize,
        startDate: inputs.cycleStartDate || new Date().toISOString()
      });

      results.cyclePlan = cyclePlan;
    }
  }

  // ============================================================================
  // PHASE 3: BUILDING
  // ============================================================================

  if (phase === 'building' || phase === 'full-cycle') {
    const pitchToBuild = existingPitch || results.pitch;
    const planToExecute = results.cyclePlan;

    if (!pitchToBuild) {
      throw new Error('No pitch available for building phase. Either complete shaping/betting first or provide existingPitch.');
    }

    // Step 1: Get oriented - understand the terrain
    const orientationResult = await ctx.task(getOrientedTask, {
      projectName,
      pitch: pitchToBuild,
      cyclePlan: planToExecute,
      teamSize
    });

    results.orientation = orientationResult;

    // Step 2: Map the scopes
    const scopeMappingResult = await ctx.task(mapScopesTask, {
      projectName,
      pitch: pitchToBuild,
      orientation: orientationResult,
      cycleWeeks
    });

    results.scopeMap = scopeMappingResult;

    // Breakpoint: Review scope map
    await ctx.breakpoint({
      question: `Scope mapping complete. Identified ${scopeMappingResult.scopes.length} scopes: ${scopeMappingResult.scopes.map(s => s.name).join(', ')}. Team understands the terrain. Ready to start building?`,
      title: 'Scope Map Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/shape-up/building/scope-map.md', format: 'markdown', label: 'Scope Map' },
          { path: 'artifacts/shape-up/building/scope-diagram.md', format: 'markdown', label: 'Scope Diagram' }
        ]
      }
    });

    // Step 3: Execute cycle with hill chart tracking
    const cycleExecution = await ctx.task(executeCycleTask, {
      projectName,
      pitch: pitchToBuild,
      scopeMap: scopeMappingResult,
      cycleWeeks,
      teamSize
    });

    results.cycleExecution = cycleExecution;

    // Step 4: Track progress on hill chart (simulate multiple check-ins)
    const checkIns = [];
    const totalCheckIns = 3; // Simulate 3 check-ins during cycle

    for (let i = 0; i < totalCheckIns; i++) {
      const weekNumber = Math.floor((cycleWeeks / totalCheckIns) * (i + 1));

      const hillChartUpdate = await ctx.task(updateHillChartTask, {
        projectName,
        scopeMap: scopeMappingResult,
        cycleWeek: weekNumber,
        totalWeeks: cycleWeeks,
        previousCheckIn: checkIns[i - 1] || null
      });

      checkIns.push(hillChartUpdate);

      // Breakpoint: Hill chart check-in
      await ctx.breakpoint({
        question: `Week ${weekNumber}/${cycleWeeks} check-in. ${hillChartUpdate.uphill.length} scopes uphill (figuring out), ${hillChartUpdate.downhill.length} scopes downhill (executing), ${hillChartUpdate.completed.length} completed. ${hillChartUpdate.stuckScopes.length} scopes potentially stuck. ${hillChartUpdate.riskLevel} risk level. Continue cycle?`,
        title: `Week ${weekNumber} Hill Chart Check-in`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/shape-up/building/hill-chart-week-${weekNumber}.md`, format: 'markdown', label: 'Hill Chart' },
            { path: `artifacts/shape-up/building/progress-week-${weekNumber}.json`, format: 'code', language: 'json', label: 'Progress Data' }
          ]
        }
      });
    }

    results.hillChartHistory = checkIns;

    // Step 5: QA and integration
    const qaResult = await ctx.task(qaAndIntegrationTask, {
      projectName,
      pitch: pitchToBuild,
      scopeMap: scopeMappingResult,
      cycleExecution: cycleExecution,
      finalHillChart: checkIns[checkIns.length - 1]
    });

    results.qaAndIntegration = qaResult;

    // Circuit breaker check
    const circuitBreakerCheck = await ctx.task(circuitBreakerCheckTask, {
      projectName,
      pitch: pitchToBuild,
      cycleWeeks,
      scopeMap: scopeMappingResult,
      finalHillChart: checkIns[checkIns.length - 1],
      qaResult
    });

    results.circuitBreaker = circuitBreakerCheck;

    // Breakpoint: End of cycle decision
    await ctx.breakpoint({
      question: `End of ${cycleWeeks}-week cycle. ${circuitBreakerCheck.completed.length}/${scopeMappingResult.scopes.length} scopes completed. Status: ${circuitBreakerCheck.status}. ${circuitBreakerCheck.status === 'incomplete' ? 'Work is incomplete. Circuit breaker activated - no automatic extension.' : 'Work complete!'} QA ${qaResult.passed ? 'passed' : 'has issues'}. Ship or abandon?`,
      title: 'Circuit Breaker - End of Cycle',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/shape-up/building/final-hill-chart.md', format: 'markdown', label: 'Final Hill Chart' },
          { path: 'artifacts/shape-up/building/circuit-breaker.md', format: 'markdown', label: 'Circuit Breaker Report' },
          { path: 'artifacts/shape-up/building/qa-report.md', format: 'markdown', label: 'QA Report' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 4: COOL-DOWN
  // ============================================================================

  if ((phase === 'cool-down' || phase === 'full-cycle') && includeCoolDown) {
    const coolDownResult = await ctx.task(coolDownTask, {
      projectName,
      cycleResults: results,
      cycleWeeks
    });

    results.coolDown = coolDownResult;

    // Breakpoint: Cool-down activities
    await ctx.breakpoint({
      question: `Cool-down phase (2 weeks). Activities: ${coolDownResult.activities.length} items - ${coolDownResult.activities.slice(0, 3).map(a => a.type).join(', ')}. Technical debt addressed, bugs fixed, exploration done. Ready for next cycle?`,
      title: 'Cool-Down Complete',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/shape-up/cool-down/activities.md', format: 'markdown', label: 'Cool-Down Activities' },
          { path: 'artifacts/shape-up/cool-down/cycle-retrospective.md', format: 'markdown', label: 'Cycle Retrospective' }
        ]
      }
    });
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  const allPhasesComplete = phase === 'full-cycle'
    ? results.pitch && results.bettingEvaluation && results.cycleExecution && results.circuitBreaker
    : true;

  const shipped = results.circuitBreaker?.status === 'complete' || false;
  const completionRate = results.circuitBreaker
    ? (results.circuitBreaker.completed.length / results.scopeMap.scopes.length) * 100
    : 0;

  // Final breakpoint
  await ctx.breakpoint({
    question: `Shape Up ${phase} complete for "${workDescription}". ${phase === 'full-cycle' ? `${cycleWeeks}-week cycle finished. ${shipped ? 'Work shipped!' : 'Circuit breaker activated.'} Completion: ${completionRate.toFixed(0)}%. ${includeCoolDown ? 'Cool-down activities done.' : ''}` : `${phase} phase complete.`} Review final artifacts?`,
    title: 'Shape Up Process Complete',
    context: {
      runId: ctx.runId,
      files: [
        ...(results.pitch ? [{ path: 'artifacts/shape-up/shaping/pitch.md', format: 'markdown', label: 'Pitch' }] : []),
        ...(results.bettingEvaluation ? [{ path: 'artifacts/shape-up/betting/evaluation.md', format: 'markdown', label: 'Betting Evaluation' }] : []),
        ...(results.scopeMap ? [{ path: 'artifacts/shape-up/building/scope-map.md', format: 'markdown', label: 'Scope Map' }] : []),
        ...(results.hillChartHistory ? [{ path: 'artifacts/shape-up/building/final-hill-chart.md', format: 'markdown', label: 'Final Hill Chart' }] : []),
        ...(results.coolDown ? [{ path: 'artifacts/shape-up/cool-down/cycle-retrospective.md', format: 'markdown', label: 'Retrospective' }] : [])
      ]
    }
  });

  return {
    success: allPhasesComplete && (phase !== 'full-cycle' || shipped),
    projectName,
    workDescription,
    appetite,
    phase,
    ...results,
    summary: {
      phase,
      appetite,
      cycleWeeks,
      pitched: !!results.pitch,
      betPlaced: results.bettingEvaluation?.recommendation === 'bet',
      scopeCount: results.scopeMap?.scopes.length || 0,
      completionRate: completionRate.toFixed(0) + '%',
      shipped: shipped,
      coolDownIncluded: includeCoolDown && !!results.coolDown
    },
    artifacts: {
      shaping: 'artifacts/shape-up/shaping/',
      betting: 'artifacts/shape-up/betting/',
      building: 'artifacts/shape-up/building/',
      coolDown: 'artifacts/shape-up/cool-down/'
    },
    metadata: {
      processId: 'methodologies/shape-up',
      methodology: 'Shape Up (Basecamp)',
      creator: 'Ryan Singer',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const defineAppetiteTask = defineTask('define-appetite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Appetite: ${args.workDescription}`,
  description: 'Set boundaries by defining how much time we want to spend',

  agent: {
    name: 'shape-up-shaper',
    prompt: {
      role: 'product shaper defining appetite',
      task: 'Define the appetite (time budget) for this work',
      context: {
        projectName: args.projectName,
        workDescription: args.workDescription,
        appetite: args.appetite,
        cycleWeeks: args.cycleWeeks
      },
      instructions: [
        'Analyze the work description and determine appropriate appetite',
        'Small batch: 1-2 weeks for one designer + one programmer',
        'Big batch: Full 6-week cycle for standard team',
        'Define what can be accomplished within the appetite',
        'Set clear boundaries on scope',
        'Identify what is out of scope',
        'Define the problem, not the solution',
        'Focus on user value, not technical details',
        'Consider team size and composition',
        'Think in terms of bets, not estimates'
      ],
      outputFormat: 'JSON with appetite definition, time estimate, boundaries, and constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['appetite', 'timeEstimate', 'boundaries', 'inScope', 'outOfScope'],
      properties: {
        appetite: { type: 'string', enum: ['small-batch', 'big-batch'] },
        timeEstimate: { type: 'string' },
        problemStatement: { type: 'string' },
        boundaries: {
          type: 'object',
          properties: {
            mustHave: { type: 'array', items: { type: 'string' } },
            niceToHave: { type: 'array', items: { type: 'string' } },
            notNow: { type: 'array', items: { type: 'string' } }
          }
        },
        inScope: { type: 'array', items: { type: 'string' } },
        outOfScope: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        teamComposition: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'shaping', 'appetite']
}));

export const breadboardingTask = defineTask('breadboarding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Breadboard Flow and Affordances',
  description: 'Rough out the elements - places, affordances, and connection lines',

  agent: {
    name: 'breadboarder',
    prompt: {
      role: 'interaction designer creating breadboard',
      task: 'Create a breadboard showing places, affordances, and connection lines',
      context: {
        projectName: args.projectName,
        workDescription: args.workDescription,
        appetite: args.appetite,
        cycleWeeks: args.cycleWeeks
      },
      instructions: [
        'Focus on components and connections, not visual design',
        'Identify PLACES: screens, dialogs, menus where users arrive',
        'Identify AFFORDANCES: buttons, links, fields users can interact with',
        'Draw CONNECTION LINES: how affordances take users from place to place',
        'Use words, not pictures - no visual design yet',
        'Keep it at room temperature - not too hot (specific), not too cold (abstract)',
        'Show the flow through the solution',
        'Identify key user actions and system responses',
        'Note any data requirements',
        'Consider edge cases and error states'
      ],
      outputFormat: 'JSON with places, affordances, connections, and flow description'
    },
    outputSchema: {
      type: 'object',
      required: ['places', 'affordances', 'connections', 'flow'],
      properties: {
        places: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['screen', 'dialog', 'menu', 'state'] }
            }
          }
        },
        affordances: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              placeId: { type: 'string' },
              type: { type: 'string', enum: ['button', 'link', 'field', 'toggle', 'action'] },
              description: { type: 'string' }
            }
          }
        },
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              affordance: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        flow: {
          type: 'object',
          properties: {
            entryPoint: { type: 'string' },
            mainPath: { type: 'array', items: { type: 'string' } },
            alternatePaths: { type: 'array', items: { type: 'string' } },
            exitPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        dataRequirements: { type: 'array', items: { type: 'string' } },
        edgeCases: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'shaping', 'breadboarding']
}));

export const identifyRabbitHolesTask = defineTask('identify-rabbit-holes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Rabbit Holes and No-Gos',
  description: 'Call out risks and things we are NOT going to do',

  agent: {
    name: 'risk-identifier',
    prompt: {
      role: 'experienced shaper identifying risks',
      task: 'Identify rabbit holes, risks, and no-gos',
      context: {
        projectName: args.projectName,
        workDescription: args.workDescription,
        breadboard: args.breadboard,
        appetite: args.appetite
      },
      instructions: [
        'Identify rabbit holes: areas that could consume unlimited time',
        'Call out technical unknowns and risks',
        'Define no-gos: features/approaches we explicitly will NOT do',
        'Identify edge cases to ignore in the initial bet',
        'Note dependencies on other teams or systems',
        'Consider browser/platform compatibility issues',
        'Identify areas where the team might get stuck',
        'Suggest de-risking strategies',
        'Propose simplifications to fit the appetite',
        'Be specific about what could go wrong'
      ],
      outputFormat: 'JSON with rabbit holes, risks, no-gos, and mitigation strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['rabbitHoles', 'noGos', 'risks', 'mitigation'],
      properties: {
        rabbitHoles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              area: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              deRiskingStrategy: { type: 'string' }
            }
          }
        },
        noGos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              feature: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        mitigation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              strategy: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        dependencies: { type: 'array', items: { type: 'string' } },
        edgeCasesToIgnore: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'shaping', 'risk-management']
}));

export const fatMarkerSketchesTask = defineTask('fat-marker-sketches', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Fat Marker Sketches',
  description: 'Visual sketches at the right level of abstraction',

  agent: {
    name: 'sketcher',
    prompt: {
      role: 'designer creating fat marker sketches',
      task: 'Create rough visual sketches showing key screens and interactions',
      context: {
        projectName: args.projectName,
        workDescription: args.workDescription,
        breadboard: args.breadboard,
        appetite: args.appetite
      },
      instructions: [
        'Create rough sketches showing key screens and UI elements',
        'Use fat marker level: enough detail to see it works, not too much to lock in details',
        'Show important UI elements without specifying exact placement',
        'Illustrate key user interactions and flows',
        'Use annotations to explain behavior',
        'Focus on novel or unusual parts of the UI',
        'Skip standard patterns everyone already knows',
        'Show how pieces fit together',
        'Indicate relative importance of elements',
        'Keep it rough - resist the urge to make it pretty'
      ],
      outputFormat: 'JSON with sketch descriptions, annotations, and key UI elements'
    },
    outputSchema: {
      type: 'object',
      required: ['sketches', 'keyElements', 'annotations'],
      properties: {
        sketches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              placeId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              elements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    label: { type: 'string' },
                    importance: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] }
                  }
                }
              }
            }
          }
        },
        keyElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              purpose: { type: 'string' },
              behavior: { type: 'string' }
            }
          }
        },
        annotations: { type: 'array', items: { type: 'string' } },
        novelPatterns: { type: 'array', items: { type: 'string' } },
        standardPatterns: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'shaping', 'ui-design']
}));

export const writePitchTask = defineTask('write-pitch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write Pitch Document',
  description: 'Formal pitch document for betting table',

  agent: {
    name: 'pitch-writer',
    prompt: {
      role: 'product shaper writing pitch',
      task: 'Write comprehensive pitch document synthesizing all shaping work',
      context: {
        projectName: args.projectName,
        workDescription: args.workDescription,
        appetite: args.appetite,
        breadboard: args.breadboard,
        rabbitHoles: args.rabbitHoles,
        sketches: args.sketches,
        cycleWeeks: args.cycleWeeks
      },
      instructions: [
        'Write clear problem statement from user perspective',
        'Explain why now - what makes this the right time',
        'Define appetite clearly (small batch or big batch)',
        'Describe the solution at right level of abstraction',
        'Include breadboard showing flow',
        'Reference fat marker sketches for key UI',
        'Call out rabbit holes explicitly',
        'List no-gos clearly',
        'Explain what the team will actually build',
        'Make it compelling but realistic',
        'Format as markdown document'
      ],
      outputFormat: 'JSON with pitch markdown, summary, and metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['pitchMarkdown', 'summary', 'problem', 'solution', 'appetite'],
      properties: {
        pitchMarkdown: { type: 'string' },
        summary: { type: 'string' },
        problem: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            whyNow: { type: 'string' },
            impact: { type: 'string' }
          }
        },
        solution: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            approach: { type: 'string' },
            keyElements: { type: 'array', items: { type: 'string' } }
          }
        },
        appetite: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            duration: { type: 'string' },
            teamSize: { type: 'string' }
          }
        },
        rabbitHoles: { type: 'array', items: { type: 'string' } },
        noGos: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        visualAids: {
          type: 'object',
          properties: {
            breadboard: { type: 'string' },
            sketches: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'shaping', 'pitch']
}));

export const bettingTableEvaluationTask = defineTask('betting-table-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Betting Table Evaluation',
  description: 'Evaluate pitch and decide whether to bet resources',

  agent: {
    name: 'betting-table',
    prompt: {
      role: 'senior leadership at betting table',
      task: 'Evaluate pitch and decide whether to place a bet',
      context: {
        projectName: args.projectName,
        pitch: args.pitch,
        competingPitches: args.competingPitches,
        teamCapacity: args.teamCapacity,
        cycleWeeks: args.cycleWeeks
      },
      instructions: [
        'Evaluate the pitch critically from business and technical perspective',
        'Consider if problem is worth solving now',
        'Assess if solution fits within stated appetite',
        'Evaluate if team can actually build this in the cycle',
        'Consider risks and rabbit holes',
        'Compare with other competing pitches',
        'Assess strategic alignment',
        'Consider team capacity and availability',
        'Evaluate market timing',
        'Make recommendation: bet, pass, or needs-more-shaping',
        'Score the pitch 0-100',
        'Provide clear rationale'
      ],
      outputFormat: 'JSON with recommendation, score, rationale, and comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'score', 'rationale', 'keyFactors'],
      properties: {
        recommendation: { type: 'string', enum: ['bet', 'pass', 'needs-more-shaping'] },
        score: { type: 'number' },
        rationale: { type: 'string' },
        keyFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              assessment: { type: 'string' },
              weight: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        conditions: { type: 'array', items: { type: 'string' } },
        comparison: {
          type: 'object',
          properties: {
            vsOtherPitches: { type: 'string' },
            relativeRanking: { type: 'number' }
          }
        },
        capacityAssessment: {
          type: 'object',
          properties: {
            teamAvailable: { type: 'boolean' },
            timing: { type: 'string' },
            conflicts: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'betting', 'evaluation']
}));

export const createCyclePlanTask = defineTask('create-cycle-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Cycle Plan',
  description: 'Plan the 6-week cycle execution',

  agent: {
    name: 'cycle-planner',
    prompt: {
      role: 'cycle coordinator creating execution plan',
      task: 'Create plan for executing the bet during the cycle',
      context: {
        projectName: args.projectName,
        pitch: args.pitch,
        cycleWeeks: args.cycleWeeks,
        teamSize: args.teamSize,
        startDate: args.startDate
      },
      instructions: [
        'Define cycle start and end dates',
        'Assign team members',
        'Set up communication channels',
        'Plan check-in cadence',
        'Define success criteria',
        'Identify key milestones',
        'Set up tracking mechanisms',
        'Plan QA integration strategy',
        'Consider deployment timeline',
        'Define done criteria'
      ],
      outputFormat: 'JSON with cycle timeline, team, milestones, and logistics'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'team', 'milestones', 'successCriteria'],
      properties: {
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            weeks: { type: 'number' },
            checkInDays: { type: 'array', items: { type: 'string' } }
          }
        },
        team: {
          type: 'object',
          properties: {
            designer: { type: 'string' },
            programmers: { type: 'array', items: { type: 'string' } },
            qa: { type: 'string' },
            size: { type: 'string' }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              week: { type: 'number' },
              description: { type: 'string' },
              deliverable: { type: 'string' }
            }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        logistics: {
          type: 'object',
          properties: {
            communication: { type: 'string' },
            tracking: { type: 'string' },
            repository: { type: 'string' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'building', 'planning']
}));

export const getOrientedTask = defineTask('get-oriented', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Get Oriented',
  description: 'Team explores and understands the terrain before building',

  agent: {
    name: 'orientation-guide',
    prompt: {
      role: 'team lead orienting the team',
      task: 'Help team understand the work and get oriented',
      context: {
        projectName: args.projectName,
        pitch: args.pitch,
        cyclePlan: args.cyclePlan,
        teamSize: args.teamSize
      },
      instructions: [
        'Review the pitch with the team',
        'Identify starting points for exploration',
        'Map out areas of the codebase to touch',
        'Identify unknowns that need investigation',
        'Discuss technical approaches',
        'Review constraints and rabbit holes',
        'Plan initial spike tasks',
        'Set expectations about uphill vs downhill work',
        'Discuss how to tackle the first tasks',
        'Establish team working agreements'
      ],
      outputFormat: 'JSON with orientation summary, starting points, and initial tasks'
    },
    outputSchema: {
      type: 'object',
      required: ['orientationSummary', 'startingPoints', 'codebaseAreas', 'unknowns'],
      properties: {
        orientationSummary: { type: 'string' },
        startingPoints: { type: 'array', items: { type: 'string' } },
        codebaseAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              familiarity: { type: 'string', enum: ['familiar', 'somewhat-familiar', 'unfamiliar'] },
              complexity: { type: 'string', enum: ['simple', 'medium', 'complex'] }
            }
          }
        },
        unknowns: { type: 'array', items: { type: 'string' } },
        technicalApproaches: { type: 'array', items: { type: 'string' } },
        initialTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              type: { type: 'string', enum: ['spike', 'build', 'investigate'] },
              assignee: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'building', 'orientation']
}));

export const mapScopesTask = defineTask('map-scopes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Scopes',
  description: 'Break work into integrated slices (scopes) for hill chart tracking',

  agent: {
    name: 'scope-mapper',
    prompt: {
      role: 'team mapping out scopes',
      task: 'Break the work into scopes (integrated slices of functionality)',
      context: {
        projectName: args.projectName,
        pitch: args.pitch,
        orientation: args.orientation,
        cycleWeeks: args.cycleWeeks
      },
      instructions: [
        'Identify scopes: integrated slices of the project',
        'Each scope should be end-to-end functionality',
        'Scopes should be independently shippable pieces',
        'Name scopes from user perspective (not technical layers)',
        'Identify dependencies between scopes',
        'Estimate relative complexity',
        'Map which scopes are must-have vs. nice-to-have',
        'Consider ordering and parallelization',
        'Keep scopes at right granularity (3-8 scopes typical)',
        'Each scope will move on the hill chart independently'
      ],
      outputFormat: 'JSON with scopes, dependencies, and scope map'
    },
    outputSchema: {
      type: 'object',
      required: ['scopes', 'dependencies', 'scopeMap'],
      properties: {
        scopes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'nice-to-have'] },
              complexity: { type: 'string', enum: ['simple', 'medium', 'complex'] },
              estimatedWeeks: { type: 'number' },
              tasksInvolved: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scopeId: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } },
              type: { type: 'string', enum: ['blocking', 'non-blocking'] }
            }
          }
        },
        scopeMap: {
          type: 'object',
          properties: {
            totalScopes: { type: 'number' },
            mustHaveScopes: { type: 'number' },
            niceToHaveScopes: { type: 'number' },
            criticalPath: { type: 'array', items: { type: 'string' } },
            parallelizable: { type: 'array', items: { type: 'array', items: { type: 'string' } } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'building', 'scope-mapping']
}));

export const executeCycleTask = defineTask('execute-cycle', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Cycle',
  description: 'Simulate the 6-week build cycle',

  agent: {
    name: 'cycle-executor',
    prompt: {
      role: 'development team executing cycle',
      task: 'Simulate building the scopes during the cycle',
      context: {
        projectName: args.projectName,
        pitch: args.pitch,
        scopeMap: args.scopeMap,
        cycleWeeks: args.cycleWeeks,
        teamSize: args.teamSize
      },
      instructions: [
        'Simulate development of each scope',
        'Consider team capacity and velocity',
        'Account for uphill (unknowns) vs downhill (execution) work',
        'Identify where team might get stuck',
        'Consider integration challenges',
        'Account for technical discoveries',
        'Simulate realistic progress',
        'Identify scopes that ship early vs. late in cycle',
        'Consider QA integration throughout',
        'Simulate realistic complications'
      ],
      outputFormat: 'JSON with execution summary, scope progress, and challenges'
    },
    outputSchema: {
      type: 'object',
      required: ['executionSummary', 'scopeProgress', 'challenges'],
      properties: {
        executionSummary: { type: 'string' },
        scopeProgress: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scopeId: { type: 'string' },
              status: { type: 'string', enum: ['completed', 'in-progress', 'not-started'] },
              weekCompleted: { type: 'number' },
              actualComplexity: { type: 'string' },
              surprises: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        challenges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scopeId: { type: 'string' },
              challenge: { type: 'string' },
              resolution: { type: 'string' },
              impactWeeks: { type: 'number' }
            }
          }
        },
        discoveries: { type: 'array', items: { type: 'string' } },
        integrationPoints: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'building', 'execution']
}));

export const updateHillChartTask = defineTask('update-hill-chart', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hill Chart - Week ${args.cycleWeek}`,
  description: 'Update hill chart showing scope progress (uphill vs downhill)',

  agent: {
    name: 'hill-chart-tracker',
    prompt: {
      role: 'team lead updating hill chart',
      task: 'Update hill chart showing progress of each scope',
      context: {
        projectName: args.projectName,
        scopeMap: args.scopeMap,
        cycleWeek: args.cycleWeek,
        totalWeeks: args.totalWeeks,
        previousCheckIn: args.previousCheckIn
      },
      instructions: [
        'Place each scope on the hill chart',
        'Left side (uphill): figuring things out, unknowns, exploration',
        'Top of hill: transition point - unknowns resolved, ready to execute',
        'Right side (downhill): executing, building out known solution',
        'Far right: complete',
        'Consider how much progress since last check-in',
        'Identify scopes that are stuck',
        'Flag scopes moving backward (discovered new unknowns)',
        'Assess overall progress and risk',
        'Position = 0 (start) to 100 (done), 50 = top of hill'
      ],
      outputFormat: 'JSON with scope positions, movements, and risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['week', 'scopePositions', 'uphill', 'downhill', 'completed', 'riskLevel'],
      properties: {
        week: { type: 'number' },
        scopePositions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scopeId: { type: 'string' },
              scopeName: { type: 'string' },
              position: { type: 'number' },
              phase: { type: 'string', enum: ['uphill', 'top', 'downhill', 'complete'] },
              movement: { type: 'string', enum: ['forward', 'stuck', 'backward'] },
              notes: { type: 'string' }
            }
          }
        },
        uphill: { type: 'array', items: { type: 'string' } },
        downhill: { type: 'array', items: { type: 'string' } },
        completed: { type: 'array', items: { type: 'string' } },
        stuckScopes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scopeId: { type: 'string' },
              reason: { type: 'string' },
              intervention: { type: 'string' }
            }
          }
        },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
        riskAssessment: { type: 'string' },
        weeksSinceMovement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scopeId: { type: 'string' },
              weeks: { type: 'number' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'building', 'hill-chart', `week-${args.cycleWeek}`]
}));

export const qaAndIntegrationTask = defineTask('qa-and-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QA and Integration',
  description: 'QA testing and integration throughout and at end of cycle',

  agent: {
    name: 'qa-engineer',
    prompt: {
      role: 'QA engineer testing and integrating',
      task: 'Perform QA testing and integration of completed scopes',
      context: {
        projectName: args.projectName,
        pitch: args.pitch,
        scopeMap: args.scopeMap,
        cycleExecution: args.cycleExecution,
        finalHillChart: args.finalHillChart
      },
      instructions: [
        'Test completed scopes against acceptance criteria',
        'Verify integration between scopes',
        'Test edge cases identified in pitch',
        'Verify no-gos are not included',
        'Check for regression issues',
        'Test user workflows end-to-end',
        'Identify bugs by severity',
        'Assess if work is ready to ship',
        'Consider known limitations',
        'Provide ship/no-ship recommendation'
      ],
      outputFormat: 'JSON with test results, bugs, and ship readiness'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'bugs', 'passed', 'shipReadiness'],
      properties: {
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scopeId: { type: 'string' },
              testsPassed: { type: 'number' },
              testsFailed: { type: 'number' },
              coverage: { type: 'number' }
            }
          }
        },
        bugs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              scopeId: { type: 'string' },
              description: { type: 'string' },
              mustFixForShip: { type: 'boolean' }
            }
          }
        },
        passed: { type: 'boolean' },
        shipReadiness: {
          type: 'object',
          properties: {
            recommendation: { type: 'string', enum: ['ship', 'fix-bugs-then-ship', 'not-ready'] },
            rationale: { type: 'string' },
            blockingIssues: { type: 'array', items: { type: 'string' } },
            knownLimitations: { type: 'array', items: { type: 'string' } }
          }
        },
        integrationStatus: { type: 'string' },
        regressionStatus: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'building', 'qa']
}));

export const circuitBreakerCheckTask = defineTask('circuit-breaker-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Circuit Breaker Check',
  description: 'End-of-cycle decision: ship, cut scope, or stop',

  agent: {
    name: 'circuit-breaker',
    prompt: {
      role: 'leadership making circuit breaker decision',
      task: 'Evaluate end-of-cycle status and make ship/stop decision',
      context: {
        projectName: args.projectName,
        pitch: args.pitch,
        cycleWeeks: args.cycleWeeks,
        scopeMap: args.scopeMap,
        finalHillChart: args.finalHillChart,
        qaResult: args.qaResult
      },
      instructions: [
        'Assess what was completed vs. planned',
        'Evaluate if must-have scopes are done',
        'Check if QA passed',
        'Consider what was learned during the cycle',
        'Apply circuit breaker: no automatic extensions',
        'Decide: ship, cut scope and ship, or stop',
        'If incomplete, decide if work should be reshaped for future bet',
        'Provide clear rationale for decision',
        'Identify what would be in a future pitch if stopped',
        'Assess if appetite was accurate'
      ],
      outputFormat: 'JSON with decision, completion status, and rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'decision', 'completed', 'incomplete', 'rationale'],
      properties: {
        status: { type: 'string', enum: ['complete', 'incomplete', 'partial'] },
        decision: { type: 'string', enum: ['ship', 'cut-scope-and-ship', 'stop', 'needs-more-work'] },
        completed: { type: 'array', items: { type: 'string' } },
        incomplete: { type: 'array', items: { type: 'string' } },
        cut: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
        learnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              learning: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'scope', 'appetite', 'team'] }
            }
          }
        },
        appetiteAssessment: {
          type: 'object',
          properties: {
            wasAccurate: { type: 'boolean' },
            shouldHaveBeen: { type: 'string' },
            notes: { type: 'string' }
          }
        },
        futurePitch: {
          type: 'object',
          properties: {
            needed: { type: 'boolean' },
            scope: { type: 'string' },
            appetite: { type: 'string' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'building', 'circuit-breaker']
}));

export const coolDownTask = defineTask('cool-down', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cool-Down Activities',
  description: '2-week cool-down between cycles for cleanup and exploration',

  agent: {
    name: 'cool-down-coordinator',
    prompt: {
      role: 'team during cool-down period',
      task: 'Plan and execute cool-down activities',
      context: {
        projectName: args.projectName,
        cycleResults: args.cycleResults,
        cycleWeeks: args.cycleWeeks
      },
      instructions: [
        'Identify technical debt to address',
        'List bugs to fix (especially from recent cycle)',
        'Plan exploratory work for potential future bets',
        'Schedule time for learning and experimentation',
        'Allow team to work on passion projects',
        'Refactor and cleanup recent code',
        'Update documentation',
        'Conduct cycle retrospective',
        'Rest and recharge',
        'No structured projects during cool-down'
      ],
      outputFormat: 'JSON with cool-down activities, retrospective, and preparations'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'retrospective', 'duration'],
      properties: {
        duration: { type: 'string' },
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['bug-fix', 'tech-debt', 'exploration', 'learning', 'refactoring', 'documentation'] },
              description: { type: 'string' },
              assignee: { type: 'string' },
              completed: { type: 'boolean' }
            }
          }
        },
        retrospective: {
          type: 'object',
          properties: {
            wentWell: { type: 'array', items: { type: 'string' } },
            wentPoorly: { type: 'array', items: { type: 'string' } },
            learnings: { type: 'array', items: { type: 'string' } },
            actionItems: { type: 'array', items: { type: 'string' } }
          }
        },
        explorations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              idea: { type: 'string' },
              findings: { type: 'string' },
              potentialPitch: { type: 'boolean' }
            }
          }
        },
        nextCyclePreparations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'shape-up', 'cool-down', 'retrospective']
}));

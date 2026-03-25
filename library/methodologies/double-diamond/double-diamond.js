/**
 * @process methodologies/double-diamond
 * @description Double Diamond - Design thinking framework with divergent and convergent phases
 * @inputs { projectName: string, context?: string, initialResearch?: string, phase?: string }
 * @outputs { success: boolean, discovery: object, definition: object, development: object, delivery: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Double Diamond Design Thinking Process
 *
 * British Design Council's Double Diamond Framework (2005): Two diamonds representing
 * divergent (exploring) and convergent (focusing) thinking in problem and solution spaces.
 *
 * Four-Phase Design Process:
 * 1. Discover (Diverge on Problem) - Explore the problem space broadly
 * 2. Define (Converge on Problem) - Narrow to specific problem statement
 * 3. Develop (Diverge on Solutions) - Explore many possible solutions
 * 4. Deliver (Converge on Solution) - Narrow to final solution and implement
 *
 * First Diamond: Problem Space (Discover → Define)
 * Second Diamond: Solution Space (Develop → Deliver)
 *
 * Supports: User-centered design, iterative refinement, divergent/convergent thinking
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the design project
 * @param {string} inputs.context - Project context and background
 * @param {string} inputs.initialResearch - Initial research data (user interviews, market analysis)
 * @param {string} inputs.phase - Starting phase: discover|define|develop|deliver|full (default: full)
 * @param {string} inputs.existingDiscovery - Path to existing discovery artifacts (for continuation)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with discovery, definition, development, and delivery outputs
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    context = '',
    initialResearch = '',
    phase = 'full',
    existingDiscovery = null
  } = inputs;

  const results = {
    projectName,
    discovery: null,
    definition: null,
    development: null,
    delivery: null,
    iterations: []
  };

  // ============================================================================
  // DIAMOND 1, PHASE 1: DISCOVER (DIVERGE ON PROBLEM)
  // ============================================================================

  if (phase === 'discover' || phase === 'full') {
    // Step 1.1: Discover - Divergent exploration of problem space
    const discoveryResult = await ctx.task(discoverTask, {
      projectName,
      context,
      initialResearch,
      existingDiscovery
    });

    results.discovery = discoveryResult;

    // Breakpoint: Review discovery insights
    await ctx.breakpoint({
      question: `Review discovery insights for "${projectName}". ${discoveryResult.userInsights?.length || 0} user insights, ${discoveryResult.marketInsights?.length || 0} market insights, and ${discoveryResult.problemAreas?.length || 0} problem areas identified. Divergent thinking phase complete - explored problem space broadly. Approve to converge on specific problem?`,
      title: 'Discovery Phase Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/double-diamond/DISCOVERY.md', format: 'markdown', label: 'Discovery Insights' },
          { path: 'artifacts/double-diamond/user-research.json', format: 'code', language: 'json', label: 'User Research' },
          { path: 'artifacts/double-diamond/problem-map.md', format: 'markdown', label: 'Problem Space Map' }
        ]
      }
    });
  }

  // ============================================================================
  // DIAMOND 1, PHASE 2: DEFINE (CONVERGE ON PROBLEM)
  // ============================================================================

  if (phase === 'define' || phase === 'full') {
    // If starting from define phase, load existing discovery
    if (phase === 'define' && existingDiscovery) {
      const loadedDiscovery = await ctx.task(loadArtifactsTask, {
        artifactPath: existingDiscovery
      });
      results.discovery = loadedDiscovery;
    }

    // Step 1.2: Define - Convergent synthesis to problem statement
    const definitionResult = await ctx.task(defineTask, {
      projectName,
      context,
      discovery: results.discovery
    });

    results.definition = definitionResult;

    // Breakpoint: Review problem definition
    await ctx.breakpoint({
      question: `Review problem definition for "${projectName}". Problem statement: "${definitionResult.problemStatement}". ${definitionResult.designPrinciples?.length || 0} design principles defined. ${definitionResult.successCriteria?.length || 0} success criteria established. First diamond complete - problem space defined. Approve to begin second diamond (solution space)?`,
      title: 'Definition Phase Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/double-diamond/DEFINITION.md', format: 'markdown', label: 'Problem Definition' },
          { path: 'artifacts/double-diamond/problem-statement.json', format: 'code', language: 'json', label: 'Problem Statement' },
          { path: 'artifacts/double-diamond/design-principles.md', format: 'markdown', label: 'Design Principles' }
        ]
      }
    });
  }

  // ============================================================================
  // DIAMOND 2, PHASE 3: DEVELOP (DIVERGE ON SOLUTIONS)
  // ============================================================================

  if (phase === 'develop' || phase === 'full') {
    // If starting from develop phase, load existing artifacts
    if (phase === 'develop' && existingDiscovery) {
      const loadedData = await ctx.task(loadArtifactsTask, {
        artifactPath: existingDiscovery
      });
      results.discovery = loadedData.discovery;
      results.definition = loadedData.definition;
    }

    // Step 2.1: Develop - Divergent ideation and prototyping
    const developmentResult = await ctx.task(developTask, {
      projectName,
      context,
      definition: results.definition,
      discovery: results.discovery
    });

    results.development = developmentResult;

    // Breakpoint: Review solution concepts
    await ctx.breakpoint({
      question: `Review solution concepts for "${projectName}". ${developmentResult.concepts?.length || 0} solution concepts generated through ideation. ${developmentResult.prototypes?.length || 0} prototypes created. Divergent exploration of solution space complete. Approve to converge on final solution?`,
      title: 'Development Phase Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/double-diamond/DEVELOPMENT.md', format: 'markdown', label: 'Solution Development' },
          { path: 'artifacts/double-diamond/solution-concepts.json', format: 'code', language: 'json', label: 'Solution Concepts' },
          { path: 'artifacts/double-diamond/prototypes.md', format: 'markdown', label: 'Prototypes' }
        ]
      }
    });
  }

  // ============================================================================
  // DIAMOND 2, PHASE 4: DELIVER (CONVERGE ON SOLUTION)
  // ============================================================================

  if (phase === 'deliver' || phase === 'full') {
    // If starting from deliver phase, load existing artifacts
    if (phase === 'deliver' && existingDiscovery) {
      const loadedData = await ctx.task(loadArtifactsTask, {
        artifactPath: existingDiscovery
      });
      results.discovery = loadedData.discovery;
      results.definition = loadedData.definition;
      results.development = loadedData.development;
    }

    // Step 2.2: Deliver - Convergent selection and implementation
    const deliveryResult = await ctx.task(deliverTask, {
      projectName,
      context,
      definition: results.definition,
      development: results.development
    });

    results.delivery = deliveryResult;

    // Breakpoint: Review final solution
    await ctx.breakpoint({
      question: `Review final solution for "${projectName}". Solution selected: "${deliveryResult.selectedSolution}". Implementation plan created with ${deliveryResult.implementationSteps?.length || 0} steps. Second diamond complete - solution defined and ready for delivery. Approve final solution?`,
      title: 'Delivery Phase Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/double-diamond/DELIVERY.md', format: 'markdown', label: 'Solution Delivery' },
          { path: 'artifacts/double-diamond/final-solution.json', format: 'code', language: 'json', label: 'Final Solution' },
          { path: 'artifacts/double-diamond/implementation-plan.md', format: 'markdown', label: 'Implementation Plan' }
        ]
      }
    });
  }

  // ============================================================================
  // ITERATION DECISION
  // ============================================================================

  if (phase === 'full') {
    // Decide if another diamond iteration is needed
    const iterationDecision = await ctx.task(iterationDecisionTask, {
      projectName,
      discovery: results.discovery,
      definition: results.definition,
      development: results.development,
      delivery: results.delivery
    });

    results.iterationDecision = iterationDecision;

    // If iteration recommended, log but don't automatically restart
    if (iterationDecision.iterationRecommended) {
      await ctx.breakpoint({
        question: `Iteration recommended for "${projectName}". Reason: ${iterationDecision.reason}. New focus: ${iterationDecision.newFocus}. Double Diamond process is iterative - you can run another diamond to refine the solution. Do you want to proceed with current results?`,
        title: 'Iteration Decision',
        context: {
          runId: ctx.runId,
          files: [
            { path: 'artifacts/double-diamond/iteration-analysis.json', format: 'code', language: 'json', label: 'Iteration Analysis' }
          ]
        }
      });
    }
  }

  // ============================================================================
  // FINAL VALIDATION
  // ============================================================================

  // Validate complete Double Diamond process
  const finalValidation = await ctx.task(validateDoubleDiamondTask, {
    projectName,
    discovery: results.discovery,
    definition: results.definition,
    development: results.development,
    delivery: results.delivery,
    phase
  });

  // Final breakpoint
  await ctx.breakpoint({
    question: `Double Diamond process complete for "${projectName}". Validation: ${finalValidation.valid}. Two diamonds (problem → solution) with divergent/convergent thinking applied. Review complete analysis and approve?`,
    title: 'Double Diamond Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/double-diamond/SUMMARY.md', format: 'markdown', label: 'Double Diamond Summary' },
        { path: 'artifacts/double-diamond/DISCOVERY.md', format: 'markdown', label: 'Discovery Phase' },
        { path: 'artifacts/double-diamond/DEFINITION.md', format: 'markdown', label: 'Definition Phase' },
        { path: 'artifacts/double-diamond/DEVELOPMENT.md', format: 'markdown', label: 'Development Phase' },
        { path: 'artifacts/double-diamond/DELIVERY.md', format: 'markdown', label: 'Delivery Phase' }
      ]
    }
  });

  return {
    success: finalValidation.valid,
    projectName,
    phase,
    discovery: results.discovery,
    definition: results.definition,
    development: results.development,
    delivery: results.delivery,
    iterationDecision: results.iterationDecision,
    validation: finalValidation,
    artifacts: {
      summary: 'artifacts/double-diamond/SUMMARY.md',
      discovery: 'artifacts/double-diamond/DISCOVERY.md',
      definition: 'artifacts/double-diamond/DEFINITION.md',
      development: 'artifacts/double-diamond/DEVELOPMENT.md',
      delivery: 'artifacts/double-diamond/DELIVERY.md',
      problemStatement: 'artifacts/double-diamond/problem-statement.json',
      finalSolution: 'artifacts/double-diamond/final-solution.json',
      implementationPlan: 'artifacts/double-diamond/implementation-plan.md'
    },
    metadata: {
      processId: 'methodologies/double-diamond',
      timestamp: ctx.now(),
      methodology: 'Double Diamond (British Design Council)',
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task: Discover (Diverge on Problem)
 * Explore the problem space broadly through research and insight gathering
 */
export const discoverTask = defineTask('discover', (args, taskCtx) => ({
  kind: 'agent',
  title: `Discover problem space: ${args.projectName}`,
  description: 'Divergent exploration of problem space through user research and analysis',

  agent: {
    name: 'design-researcher',
    prompt: {
      role: 'Design researcher and user insight analyst',
      task: 'Discover and explore the problem space broadly',
      context: {
        projectName: args.projectName,
        context: args.context,
        initialResearch: args.initialResearch,
        existingDiscovery: args.existingDiscovery
      },
      instructions: [
        'DIVERGENT THINKING: Explore problem space as broadly as possible',
        'Conduct user research: interviews, observations, contextual inquiry',
        'Analyze market landscape and competitive solutions',
        'Identify user needs, pain points, and desires',
        'Map the context in which problems occur',
        'Gather qualitative and quantitative insights',
        'Document user behaviors and workarounds',
        'Identify stakeholders and their perspectives',
        'Explore edge cases and extreme users',
        'Avoid jumping to solutions - stay in problem space',
        'Cast a wide net - this is divergent phase',
        'Look for contradictions and tensions',
        'Identify assumptions to validate'
      ],
      outputFormat: 'JSON with user insights, market insights, problem areas, and research synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['userInsights', 'marketInsights', 'problemAreas'],
      properties: {
        userInsights: {
          type: 'array',
          items: {
            type: 'object',
            required: ['insight', 'source', 'evidence'],
            properties: {
              insight: { type: 'string' },
              source: { type: 'string' },
              evidence: { type: 'string' },
              userQuote: { type: 'string' },
              significance: { type: 'string', enum: ['high', 'medium', 'low'] },
              theme: { type: 'string' }
            }
          }
        },
        marketInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              competitorAnalysis: { type: 'string' },
              opportunity: { type: 'string' },
              trend: { type: 'string' }
            }
          }
        },
        problemAreas: {
          type: 'array',
          items: {
            type: 'object',
            required: ['area', 'description', 'userImpact'],
            properties: {
              area: { type: 'string' },
              description: { type: 'string' },
              userImpact: { type: 'string' },
              frequency: { type: 'string', enum: ['constant', 'frequent', 'occasional', 'rare'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              affectedUsers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        userBehaviors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              behavior: { type: 'string' },
              context: { type: 'string' },
              motivation: { type: 'string' },
              workarounds: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              perspective: { type: 'string' },
              needsAndGoals: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              risk: { type: 'string', enum: ['high', 'medium', 'low'] },
              validationMethod: { type: 'string' }
            }
          }
        },
        researchSynthesis: {
          type: 'object',
          properties: {
            keyThemes: { type: 'array', items: { type: 'string' } },
            surprisingFindings: { type: 'array', items: { type: 'string' } },
            contradictions: { type: 'array', items: { type: 'string' } },
            researchGaps: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'double-diamond', 'discover', 'divergent', 'research']
}));

/**
 * Task: Define (Converge on Problem)
 * Synthesize research to create focused problem statement
 */
export const defineTask = defineTask('define', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define problem statement: ${args.projectName}`,
  description: 'Convergent synthesis of research into focused problem statement',

  agent: {
    name: 'problem-synthesizer',
    prompt: {
      role: 'Design strategist and problem definition expert',
      task: 'Synthesize discovery insights into focused problem statement',
      context: {
        projectName: args.projectName,
        context: args.context,
        discovery: args.discovery
      },
      instructions: [
        'CONVERGENT THINKING: Narrow from broad insights to specific problem',
        'Synthesize discovery insights into coherent narrative',
        'Identify the core problem to solve',
        'Write clear, actionable problem statement',
        'Define design principles that will guide solution development',
        'Establish success criteria - what does good look like?',
        'Identify constraints (technical, business, user)',
        'Define who the primary users are',
        'Frame the opportunity space',
        'Problem statement should be specific but not prescribe solution',
        'Good: "Busy parents struggle to plan healthy meals"',
        'Bad: "We need a meal planning app"',
        'Design principles guide solution development',
        'Success criteria must be measurable'
      ],
      outputFormat: 'JSON with problem statement, design principles, success criteria, and constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['problemStatement', 'designPrinciples', 'successCriteria'],
      properties: {
        problemStatement: {
          type: 'object',
          required: ['statement', 'who', 'what', 'why', 'where', 'when'],
          properties: {
            statement: { type: 'string' },
            who: { type: 'string' },
            what: { type: 'string' },
            why: { type: 'string' },
            where: { type: 'string' },
            when: { type: 'string' },
            impact: { type: 'string' }
          }
        },
        designPrinciples: {
          type: 'array',
          items: {
            type: 'object',
            required: ['principle', 'rationale', 'examples'],
            properties: {
              principle: { type: 'string' },
              rationale: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              tradeoffs: { type: 'string' }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            required: ['criterion', 'measurement', 'target'],
            properties: {
              criterion: { type: 'string' },
              measurement: { type: 'string' },
              target: { type: 'string' },
              type: { type: 'string', enum: ['user-outcome', 'business-outcome', 'behavioral', 'qualitative'] }
            }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            technical: { type: 'array', items: { type: 'string' } },
            business: { type: 'array', items: { type: 'string' } },
            user: { type: 'array', items: { type: 'string' } },
            regulatory: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' },
            budget: { type: 'string' }
          }
        },
        primaryUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userGroup: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } },
              needs: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] }
            }
          }
        },
        opportunitySpace: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            potentialValue: { type: 'string' },
            risks: { type: 'array', items: { type: 'string' } },
            dependencies: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'double-diamond', 'define', 'convergent', 'synthesis']
}));

/**
 * Task: Develop (Diverge on Solutions)
 * Generate multiple solution concepts through ideation and prototyping
 */
export const developTask = defineTask('develop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop solution concepts: ${args.projectName}`,
  description: 'Divergent ideation and prototyping of multiple solution concepts',

  agent: {
    name: 'solution-ideator',
    prompt: {
      role: 'Creative ideation facilitator and solution designer',
      task: 'Generate multiple solution concepts through divergent thinking',
      context: {
        projectName: args.projectName,
        context: args.context,
        definition: args.definition,
        discovery: args.discovery
      },
      instructions: [
        'DIVERGENT THINKING: Explore many possible solutions',
        'Generate wide range of solution concepts',
        'Use ideation techniques: brainstorming, SCAMPER, analogies, provocation',
        'Challenge assumptions in each concept',
        'Range from incremental to radical solutions',
        'Consider multiple approaches: technology, process, behavior change, etc.',
        'Create rough prototypes or sketches for each concept',
        'Evaluate concepts against design principles',
        'Assess technical feasibility at high level',
        'Identify strengths and weaknesses of each concept',
        'Defer judgment - explore fully before eliminating',
        'Build on ideas - yes, and...',
        'Quantity leads to quality in ideation',
        'Aim for at least 5-10 distinct concepts'
      ],
      outputFormat: 'JSON with solution concepts, prototypes, and concept evaluations'
    },
    outputSchema: {
      type: 'object',
      required: ['concepts', 'prototypes'],
      properties: {
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'description', 'approach', 'howItWorks'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              approach: { type: 'string', enum: ['incremental', 'transformative', 'radical', 'hybrid'] },
              howItWorks: { type: 'string' },
              keyFeatures: { type: 'array', items: { type: 'string' } },
              userExperience: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              assumptions: { type: 'array', items: { type: 'string' } },
              designPrincipleAlignment: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    principle: { type: 'string' },
                    alignmentScore: { type: 'number', minimum: 1, maximum: 5 },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        prototypes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['conceptName', 'fidelity', 'description'],
            properties: {
              conceptName: { type: 'string' },
              fidelity: { type: 'string', enum: ['sketch', 'wireframe', 'mockup', 'interactive'] },
              description: { type: 'string' },
              userFlow: { type: 'string' },
              keyScreens: { type: 'array', items: { type: 'string' } },
              interactions: { type: 'array', items: { type: 'string' } },
              testingGoals: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        ideationSummary: {
          type: 'object',
          properties: {
            totalConceptsGenerated: { type: 'number' },
            ideationTechniquesUsed: { type: 'array', items: { type: 'string' } },
            conceptThemes: { type: 'array', items: { type: 'string' } },
            mostPromisingConcepts: { type: 'array', items: { type: 'string' } },
            conceptsRequiringValidation: { type: 'array', items: { type: 'string' } }
          }
        },
        technicalFeasibility: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conceptName: { type: 'string' },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'] },
              technicalChallenges: { type: 'array', items: { type: 'string' } },
              requiredCapabilities: { type: 'array', items: { type: 'string' } },
              effort: { type: 'string', enum: ['small', 'medium', 'large', 'extra-large'] }
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

  labels: ['agent', 'double-diamond', 'develop', 'divergent', 'ideation']
}));

/**
 * Task: Deliver (Converge on Solution)
 * Select final solution and create implementation plan
 */
export const deliverTask = defineTask('deliver', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deliver final solution: ${args.projectName}`,
  description: 'Convergent selection of final solution and detailed implementation planning',

  agent: {
    name: 'solution-finalizer',
    prompt: {
      role: 'Solution architect and delivery planner',
      task: 'Select final solution and create detailed implementation plan',
      context: {
        projectName: args.projectName,
        context: args.context,
        definition: args.definition,
        development: args.development
      },
      instructions: [
        'CONVERGENT THINKING: Narrow from many concepts to final solution',
        'Evaluate concepts against success criteria',
        'Score concepts on design principle alignment',
        'Consider technical feasibility, effort, and value',
        'Select final solution with clear rationale',
        'May combine elements from multiple concepts',
        'Create detailed specification of final solution',
        'Define user experience and key interactions',
        'Break down into implementation steps',
        'Identify dependencies and risks',
        'Create delivery timeline',
        'Define quality assurance approach',
        'Plan for measurement and iteration',
        'Document decisions and rationale',
        'Prepare for handoff to implementation team'
      ],
      outputFormat: 'JSON with selected solution, detailed specification, and implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedSolution', 'specification', 'implementationSteps'],
      properties: {
        selectedSolution: {
          type: 'object',
          required: ['name', 'description', 'rationale'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            basedOnConcepts: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' },
            valueProposition: { type: 'string' },
            differentiators: { type: 'array', items: { type: 'string' } }
          }
        },
        specification: {
          type: 'object',
          required: ['overview', 'userExperience', 'keyFeatures'],
          properties: {
            overview: { type: 'string' },
            userExperience: {
              type: 'object',
              properties: {
                userFlow: { type: 'string' },
                keyInteractions: { type: 'array', items: { type: 'string' } },
                designGuidelines: { type: 'array', items: { type: 'string' } }
              }
            },
            keyFeatures: {
              type: 'array',
              items: {
                type: 'object',
                required: ['feature', 'description', 'priority'],
                properties: {
                  feature: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
                  userBenefit: { type: 'string' },
                  technicalRequirements: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            technicalArchitecture: {
              type: 'object',
              properties: {
                overview: { type: 'string' },
                components: { type: 'array', items: { type: 'string' } },
                integrations: { type: 'array', items: { type: 'string' } },
                dataModel: { type: 'string' }
              }
            }
          }
        },
        implementationSteps: {
          type: 'array',
          items: {
            type: 'object',
            required: ['step', 'description', 'deliverables'],
            properties: {
              step: { type: 'string' },
              description: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              estimatedEffort: { type: 'string' },
              risks: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        deliveryTimeline: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  milestones: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            criticalPath: { type: 'array', items: { type: 'string' } }
          }
        },
        qualityAssurance: {
          type: 'object',
          properties: {
            testingStrategy: { type: 'string' },
            userTesting: { type: 'array', items: { type: 'string' } },
            successMetrics: { type: 'array', items: { type: 'string' } },
            iterationPlan: { type: 'string' }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
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

  labels: ['agent', 'double-diamond', 'deliver', 'convergent', 'implementation']
}));

/**
 * Task: Iteration Decision
 * Determine if another Double Diamond iteration is needed
 */
export const iterationDecisionTask = defineTask('iteration-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: `Iteration decision: ${args.projectName}`,
  description: 'Analyze if another Double Diamond iteration is needed',

  agent: {
    name: 'iteration-analyzer',
    prompt: {
      role: 'Design process facilitator and iteration strategist',
      task: 'Determine if another Double Diamond iteration is needed',
      context: {
        projectName: args.projectName,
        discovery: args.discovery,
        definition: args.definition,
        development: args.development,
        delivery: args.delivery
      },
      instructions: [
        'Review completed Double Diamond process',
        'Identify unresolved questions or uncertainties',
        'Assess if new insights emerged during development',
        'Check if problem statement needs refinement',
        'Evaluate if solution adequately addresses problem',
        'Look for assumptions that need validation',
        'Consider if scope is too large for one diamond',
        'Identify areas that need deeper exploration',
        'Recommend iteration if significant unknowns remain',
        'Define focus for next diamond if iteration needed',
        'Double Diamond is iterative - multiple diamonds are normal',
        'Each iteration should zoom in on specific aspect'
      ],
      outputFormat: 'JSON with iteration recommendation and rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['iterationRecommended', 'confidence'],
      properties: {
        iterationRecommended: { type: 'boolean' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        reason: { type: 'string' },
        unresolvedQuestions: { type: 'array', items: { type: 'string' } },
        areasNeedingExploration: { type: 'array', items: { type: 'string' } },
        assumptionsToValidate: { type: 'array', items: { type: 'string' } },
        newFocus: { type: 'string' },
        iterationType: {
          type: 'string',
          enum: ['zoom-in', 'zoom-out', 'pivot', 'refinement', 'validation']
        },
        recommendedPhase: {
          type: 'string',
          enum: ['discover', 'define', 'develop', 'deliver', 'full']
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'double-diamond', 'iteration', 'decision']
}));

/**
 * Task: Validate Double Diamond
 * Validate complete Double Diamond process for consistency and completeness
 */
export const validateDoubleDiamondTask = defineTask('validate-double-diamond', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Double Diamond: ${args.projectName}`,
  description: 'Validate Double Diamond process for consistency and completeness',

  agent: {
    name: 'double-diamond-validator',
    prompt: {
      role: 'Design methodology validator and quality assurance',
      task: 'Validate complete Double Diamond process',
      context: {
        projectName: args.projectName,
        discovery: args.discovery,
        definition: args.definition,
        development: args.development,
        delivery: args.delivery,
        phase: args.phase
      },
      instructions: [
        'Validate that discovery phase was truly divergent (broad exploration)',
        'Check that definition phase converged to clear problem statement',
        'Verify development phase generated multiple solution concepts',
        'Validate delivery phase converged to specific solution',
        'Ensure problem statement is clear and actionable',
        'Check that design principles are defined and used',
        'Verify success criteria are measurable',
        'Validate solution addresses defined problem',
        'Check for consistency across phases',
        'Identify gaps or weak areas',
        'Verify user-centered approach throughout',
        'Check that divergent and convergent thinking applied appropriately'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'completeness', 'issues', 'recommendations'],
      properties: {
        valid: { type: 'boolean' },
        completeness: {
          type: 'object',
          properties: {
            discovery: { type: 'number' },
            definition: { type: 'number' },
            development: { type: 'number' },
            delivery: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              phase: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              phase: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        diamondQuality: {
          type: 'object',
          properties: {
            problemDiamond: {
              type: 'object',
              properties: {
                divergenceQuality: { type: 'number', minimum: 1, maximum: 5 },
                convergenceQuality: { type: 'number', minimum: 1, maximum: 5 },
                notes: { type: 'string' }
              }
            },
            solutionDiamond: {
              type: 'object',
              properties: {
                divergenceQuality: { type: 'number', minimum: 1, maximum: 5 },
                convergenceQuality: { type: 'number', minimum: 1, maximum: 5 },
                notes: { type: 'string' }
              }
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

  labels: ['agent', 'double-diamond', 'validation']
}));

/**
 * Task: Load Artifacts
 * Load existing Double Diamond artifacts for continuation
 */
export const loadArtifactsTask = defineTask('load-artifacts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Load existing Double Diamond artifacts',
  description: 'Load and parse existing Double Diamond artifacts',

  agent: {
    name: 'artifact-loader',
    prompt: {
      role: 'Artifact loader and parser',
      task: 'Load and parse existing Double Diamond artifacts',
      context: {
        artifactPath: args.artifactPath
      },
      instructions: [
        'Load existing Double Diamond artifacts from specified path',
        'Parse discovery, definition, development, and delivery data',
        'Validate artifact structure and completeness',
        'Return loaded data for continuation of process'
      ],
      outputFormat: 'JSON with loaded discovery, definition, development, delivery data'
    },
    outputSchema: {
      type: 'object',
      properties: {
        discovery: { type: 'object' },
        definition: { type: 'object' },
        development: { type: 'object' },
        delivery: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'double-diamond', 'load-artifacts']
}));

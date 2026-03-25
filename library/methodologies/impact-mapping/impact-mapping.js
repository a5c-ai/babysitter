/**
 * @process methodologies/impact-mapping
 * @description Impact Mapping strategic planning technique - connects business goals to features through actors and impacts
 * @inputs { goal: string, timeframe: string, successMetrics: array, constraints: object }
 * @outputs { success: boolean, goal: object, actors: array, impacts: array, deliverables: array, map: object, assumptions: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Impact Mapping Process
 *
 * Creator: Gojko Adzic
 * Methodology: Strategic planning technique that creates a visual map connecting
 * business goals to features through actors and their behavioral impacts.
 *
 * Hierarchy: Goal → Actor → Impact → Deliverable
 * - Goal: Why are we doing this? (Business objective with metrics)
 * - Actor: Who can create the impact? (Users, stakeholders, systems)
 * - Impact: How should their behavior change? (Desired effect)
 * - Deliverable: What can we build? (Features, stories, capabilities)
 *
 * Process Flow:
 * 1. Goal Definition - Define measurable business objective
 * 2. Actor Identification - Identify who can help achieve the goal
 * 3. Impact Analysis - Define desired behavioral changes for each actor
 * 4. Deliverable Generation - Generate features that create impacts
 * 5. Prioritization - Prioritize deliverables by impact potential
 * 6. Map Visualization - Create visual tree structure of the map
 *
 * Success Criteria:
 * - Clear, measurable goal with success metrics
 * - Diverse actor types identified (primary, secondary, negative)
 * - Impacts are specific and measurable
 * - Deliverables traced to impacts and goals
 * - Assumptions flagged for validation
 * - Visual map created for stakeholder alignment
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.goal - The business goal or objective (required)
 * @param {string} inputs.timeframe - Timeline for achieving the goal (e.g., "Q2 2026", "6 months")
 * @param {Array<Object>} inputs.successMetrics - Metrics to measure goal success
 * @param {Object} inputs.constraints - Budget, resources, technical constraints
 * @param {Object} inputs.context - Existing product/system context
 * @param {Array<string>} inputs.knownActors - Pre-identified actors (optional)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Impact map with goals, actors, impacts, and deliverables
 */
export async function process(inputs, ctx) {
  const {
    goal,
    timeframe = '6 months',
    successMetrics = [],
    constraints = {},
    context = null,
    knownActors = []
  } = inputs;

  if (!goal || goal.trim().length === 0) {
    throw new Error('Business goal is required for Impact Mapping');
  }

  const mappingStartTime = ctx.now();

  // ============================================================================
  // PHASE 1: GOAL DEFINITION
  // ============================================================================

  const goalDefinition = await ctx.task(goalDefinitionTask, {
    goal,
    timeframe,
    successMetrics,
    constraints,
    context
  });

  // Breakpoint: Review defined goal
  await ctx.breakpoint({
    question: `Defined goal with ${goalDefinition.successMetrics.length} success metric(s). Is this goal SMART (Specific, Measurable, Achievable, Relevant, Time-bound)?`,
    title: 'Goal Definition Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/impact-mapping/goal.json',
          format: 'code',
          language: 'json',
          label: 'Goal Definition'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: ACTOR IDENTIFICATION
  // ============================================================================

  const actorIdentification = await ctx.task(actorIdentificationTask, {
    goal: goalDefinition,
    knownActors,
    context
  });

  const actors = actorIdentification.actors;

  // Breakpoint: Review identified actors
  await ctx.breakpoint({
    question: `Identified ${actors.length} actor(s): ${actorIdentification.primaryCount} primary, ${actorIdentification.secondaryCount} secondary, ${actorIdentification.negativeCount} negative. Review actors before analyzing impacts?`,
    title: 'Actor Identification Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/impact-mapping/actors.md',
          format: 'markdown',
          label: 'Identified Actors'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: IMPACT ANALYSIS (Parallel by Actor)
  // ============================================================================

  // Analyze impacts for each actor in parallel
  const impactResults = await ctx.parallel.all(
    actors.map(actor => async () => {
      const result = await ctx.task(impactAnalysisTask, {
        goal: goalDefinition,
        actor,
        context
      });
      return result;
    })
  );

  // Flatten and consolidate impacts
  const allImpacts = impactResults.flatMap(result => result.impacts);

  // Track assumptions across all impacts
  const allAssumptions = allImpacts
    .filter(impact => impact.assumptions && impact.assumptions.length > 0)
    .flatMap(impact => impact.assumptions.map(assumption => ({
      ...assumption,
      relatedImpactId: impact.id,
      relatedActorId: impact.actorId
    })));

  // Breakpoint: Review impacts and assumptions
  await ctx.breakpoint({
    question: `Generated ${allImpacts.length} impact(s) across all actors. Found ${allAssumptions.length} assumption(s) requiring validation. Review impacts before generating deliverables?`,
    title: 'Impact Analysis Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/impact-mapping/impacts.md',
          format: 'markdown',
          label: 'Behavioral Impacts'
        },
        {
          path: 'artifacts/impact-mapping/assumptions.json',
          format: 'code',
          language: 'json',
          label: 'Assumptions to Validate'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 4: DELIVERABLE GENERATION (Parallel by Impact)
  // ============================================================================

  // Generate deliverables for each impact in parallel
  const deliverableResults = await ctx.parallel.all(
    allImpacts.map(impact => async () => {
      const actor = actors.find(a => a.id === impact.actorId);
      const result = await ctx.task(deliverableGenerationTask, {
        goal: goalDefinition,
        actor,
        impact,
        context,
        constraints
      });
      return result;
    })
  );

  // Flatten and consolidate deliverables
  const allDeliverables = deliverableResults.flatMap(result => result.deliverables);

  // Breakpoint: Review deliverables
  await ctx.breakpoint({
    question: `Generated ${allDeliverables.length} deliverable(s) (features/stories). Review deliverables before prioritization?`,
    title: 'Deliverable Generation Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/impact-mapping/deliverables.md',
          format: 'markdown',
          label: 'Potential Deliverables'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 5: PRIORITIZATION AND ROADMAP
  // ============================================================================

  const prioritization = await ctx.task(prioritizationTask, {
    goal: goalDefinition,
    actors,
    impacts: allImpacts,
    deliverables: allDeliverables,
    assumptions: allAssumptions,
    constraints,
    timeframe
  });

  const prioritizedDeliverables = prioritization.prioritizedDeliverables;
  const roadmap = prioritization.roadmap;

  // Breakpoint: Review prioritization and roadmap
  await ctx.breakpoint({
    question: `Prioritized ${prioritizedDeliverables.length} deliverable(s) into ${roadmap.milestones.length} milestone(s). Review prioritization strategy and roadmap?`,
    title: 'Prioritization Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/impact-mapping/prioritization.md',
          format: 'markdown',
          label: 'Prioritized Deliverables'
        },
        {
          path: 'artifacts/impact-mapping/roadmap.json',
          format: 'code',
          language: 'json',
          label: 'Implementation Roadmap'
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 6: MAP VISUALIZATION
  // ============================================================================

  const mapVisualization = await ctx.task(mapVisualizationTask, {
    goal: goalDefinition,
    actors,
    impacts: allImpacts,
    deliverables: prioritizedDeliverables,
    assumptions: allAssumptions,
    roadmap
  });

  const impactMap = mapVisualization.map;
  const mermaidDiagram = mapVisualization.mermaidDiagram;

  // Final breakpoint: Review complete impact map
  await ctx.breakpoint({
    question: `Impact Map complete with ${actors.length} actors, ${allImpacts.length} impacts, and ${prioritizedDeliverables.length} deliverables. Review visual map and proceed with implementation?`,
    title: 'Complete Impact Map Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: 'artifacts/impact-mapping/impact-map.mmd',
          format: 'code',
          language: 'mermaid',
          label: 'Visual Impact Map'
        },
        {
          path: 'artifacts/impact-mapping/complete-map.json',
          format: 'code',
          language: 'json',
          label: 'Complete Map Data'
        },
        {
          path: 'artifacts/impact-mapping/summary.md',
          format: 'markdown',
          label: 'Impact Mapping Summary'
        }
      ]
    }
  });

  // ============================================================================
  // RETURN RESULTS
  // ============================================================================

  const mappingEndTime = ctx.now();
  const sessionDurationMinutes = (mappingEndTime - mappingStartTime) / (1000 * 60);

  return {
    success: true,
    sessionDurationMinutes,
    goal: goalDefinition,
    actors,
    actorCount: actors.length,
    actorBreakdown: {
      primary: actorIdentification.primaryCount,
      secondary: actorIdentification.secondaryCount,
      negative: actorIdentification.negativeCount
    },
    impacts: allImpacts,
    impactCount: allImpacts.length,
    deliverables: prioritizedDeliverables,
    deliverableCount: prioritizedDeliverables.length,
    assumptions: allAssumptions,
    assumptionCount: allAssumptions.length,
    criticalAssumptions: allAssumptions.filter(a => a.priority === 'critical').length,
    roadmap,
    milestoneCount: roadmap.milestones.length,
    map: impactMap,
    visualization: {
      mermaid: mermaidDiagram,
      format: 'mermaid'
    },
    artifacts: {
      goal: 'artifacts/impact-mapping/goal.json',
      actors: 'artifacts/impact-mapping/actors.md',
      impacts: 'artifacts/impact-mapping/impacts.md',
      deliverables: 'artifacts/impact-mapping/deliverables.md',
      assumptions: 'artifacts/impact-mapping/assumptions.json',
      prioritization: 'artifacts/impact-mapping/prioritization.md',
      roadmap: 'artifacts/impact-mapping/roadmap.json',
      visualization: 'artifacts/impact-mapping/impact-map.mmd',
      completeMap: 'artifacts/impact-mapping/complete-map.json',
      summary: 'artifacts/impact-mapping/summary.md'
    },
    metadata: {
      processId: 'methodologies/impact-mapping',
      timeframe,
      timestamp: ctx.now(),
      creator: 'Gojko Adzic'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task: Define Measurable Goal
 * Creates a SMART goal with clear success metrics and constraints
 */
export const goalDefinitionTask = defineTask('goal-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Measurable Goal',
  agent: {
    name: 'goal-definer',
    prompt: {
      role: 'system',
      content: `You are a strategic planning expert helping to define a measurable business goal for Impact Mapping.

Your task is to refine and structure the provided goal into a SMART format (Specific, Measurable, Achievable, Relevant, Time-bound).

Goal Components:
1. **Clear Objective**: What are we trying to achieve?
2. **Why It Matters**: Business value and strategic importance
3. **Success Metrics**: How will we measure success? (quantifiable KPIs)
4. **Timeline**: When should we achieve this?
5. **Constraints**: Budget, resources, technical, regulatory
6. **Assumptions**: What we're assuming to be true
7. **Risks**: What could prevent goal achievement?

Guidelines:
- Make the goal concrete and actionable
- Define 3-5 measurable success metrics
- Be realistic about constraints
- Identify critical assumptions early
- Connect goal to business outcomes

Context:
- Goal: {{goal}}
- Timeframe: {{timeframe}}
- Provided Metrics: {{successMetrics}}
- Constraints: {{constraints}}
- Context: {{context}}

Create a well-defined, measurable goal with clear success criteria.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'Refined goal statement' },
        why: { type: 'string', description: 'Business value and importance' },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              currentValue: { type: 'string' },
              targetValue: { type: 'string' },
              measurement: { type: 'string', description: 'How to measure' },
              priority: { type: 'string', enum: ['critical', 'important', 'nice-to-have'] }
            },
            required: ['metric', 'targetValue', 'measurement']
          }
        },
        timeline: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            milestones: { type: 'array', items: { type: 'string' } },
            deadline: { type: 'string' }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            budget: { type: 'string' },
            team: { type: 'string' },
            technical: { type: 'array', items: { type: 'string' } },
            regulatory: { type: 'array', items: { type: 'string' } },
            other: { type: 'array', items: { type: 'string' } }
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
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        smartScore: {
          type: 'object',
          properties: {
            specific: { type: 'boolean' },
            measurable: { type: 'boolean' },
            achievable: { type: 'boolean' },
            relevant: { type: 'boolean' },
            timeBound: { type: 'boolean' },
            score: { type: 'number', description: 'Score out of 5' }
          }
        }
      },
      required: ['goal', 'why', 'successMetrics', 'timeline', 'smartScore']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'impact-mapping', 'goal']
}));

/**
 * Task: Identify Actors
 * Identifies all actors who can help achieve the goal
 */
export const actorIdentificationTask = defineTask('actor-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Actors',
  agent: {
    name: 'actor-identifier',
    prompt: {
      role: 'system',
      content: `You are a strategic planning expert identifying actors for Impact Mapping.

Your task is to identify all actors who can help achieve (or hinder) the goal.

Actor Types:
1. **Primary Actors**: Direct users who will use the product/service
   - End users
   - Customers
   - Key personas

2. **Secondary Actors**: Indirect beneficiaries or influencers
   - Decision makers
   - Stakeholders
   - Partners
   - Support teams
   - Internal systems

3. **Negative Actors**: Opposition or competition
   - Competitors
   - Detractors
   - Systems/processes to replace
   - Regulatory challenges

Actor Properties:
- **Role/Type**: What is their role?
- **Influence**: How much can they impact goal achievement?
- **Reach**: How many people does this actor represent?
- **Current Behavior**: What do they do now?
- **Desired Behavior**: What should they do to help achieve the goal?

Guidelines:
- Think broadly - include all who can impact the goal
- Consider different user segments separately
- Include systems and organizations as actors
- Don't forget negative actors (competition, obstacles)
- Prioritize actors by potential impact

Context:
- Goal: {{goal}}
- Known Actors: {{knownActors}}
- Context: {{context}}

Identify all relevant actors and their characteristics.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        actors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['primary', 'secondary', 'negative'] },
              description: { type: 'string' },
              role: { type: 'string' },
              influence: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              reach: { type: 'string', description: 'Number or percentage they represent' },
              currentBehavior: { type: 'string' },
              desiredBehavior: { type: 'string' },
              motivations: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } }
            },
            required: ['id', 'name', 'type', 'description', 'influence']
          }
        },
        primaryCount: { type: 'number' },
        secondaryCount: { type: 'number' },
        negativeCount: { type: 'number' },
        totalCount: { type: 'number' },
        priorityActors: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of highest-impact actors'
        }
      },
      required: ['actors', 'primaryCount', 'secondaryCount', 'negativeCount', 'totalCount']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'impact-mapping', 'actors']
}));

/**
 * Task: Analyze Impacts for an Actor
 * Defines desired behavioral changes and their effects
 */
export const impactAnalysisTask = defineTask('impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Impacts for Actor: ${args.actor.name}`,
  agent: {
    name: 'impact-analyzer',
    prompt: {
      role: 'system',
      content: `You are a strategic planning expert analyzing behavioral impacts for Impact Mapping.

Your task is to define how this actor's behavior should change to help achieve the goal.

Impact Definition:
- **Behavioral Change**: Specific change in what the actor does
- **Effect**: How this change contributes to the goal
- **Measurability**: How we'll know the impact is happening
- **Assumptions**: What we assume for this impact to work

Impact Types:
- **Adoption**: Start using something new
- **Engagement**: Increase interaction or usage
- **Efficiency**: Do things faster/better
- **Advocacy**: Promote or recommend to others
- **Retention**: Continue using, reduce churn
- **Conversion**: Move to paid/premium tier
- **Reduction**: Stop unwanted behavior
- **Prevention**: Block negative actor impact

Guidelines:
- Focus on behavior, not features
- Be specific and measurable
- One impact per statement
- Consider happy path and obstacles
- Flag assumptions that need validation
- Think about measurement methods

Context:
- Goal: {{goal}}
- Actor: {{actor}}
- Context: {{context}}

Define 2-5 behavioral impacts for this actor.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        actorId: { type: 'string' },
        impacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              actorId: { type: 'string' },
              description: { type: 'string' },
              type: {
                type: 'string',
                enum: ['adoption', 'engagement', 'efficiency', 'advocacy', 'retention', 'conversion', 'reduction', 'prevention']
              },
              behavioralChange: { type: 'string' },
              effect: { type: 'string', description: 'How this helps achieve the goal' },
              measurement: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  method: { type: 'string' },
                  target: { type: 'string' }
                }
              },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              assumptions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    assumption: { type: 'string' },
                    priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                    validationMethod: { type: 'string' },
                    validationEffort: { type: 'string', enum: ['low', 'medium', 'high'] }
                  }
                }
              },
              obstacles: { type: 'array', items: { type: 'string' } }
            },
            required: ['id', 'actorId', 'description', 'type', 'behavioralChange', 'effect', 'priority']
          }
        }
      },
      required: ['actorId', 'impacts']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'impact-mapping', 'impacts', args.actor.id]
}));

/**
 * Task: Generate Deliverables for an Impact
 * Generates features and stories that create the desired impact
 */
export const deliverableGenerationTask = defineTask('deliverable-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Deliverables for Impact: ${args.impact.id}`,
  agent: {
    name: 'deliverable-generator',
    prompt: {
      role: 'system',
      content: `You are a product strategist generating deliverables (features) for Impact Mapping.

Your task is to brainstorm deliverables (features, stories, capabilities) that could create the desired impact.

Deliverable Qualities:
- **Specific**: Clear, concrete feature or capability
- **Traceable**: Links to impact, actor, and goal
- **Scoped**: Right-sized for implementation
- **Measurable**: Can verify if it creates the impact
- **Valuable**: Delivers part of the impact

Deliverable Types:
- **Feature**: New capability or functionality
- **Enhancement**: Improvement to existing feature
- **Content**: Documentation, training, marketing
- **Integration**: Connection to other systems
- **Automation**: Remove manual work
- **UI/UX**: Interface or experience improvement
- **Infrastructure**: Technical enabler

Prioritization Factors:
- **Impact Potential**: How much does this contribute to the impact?
- **Effort**: Development complexity and time
- **Risk**: Technical or business risk
- **Dependencies**: What else is needed?
- **Assumptions**: What must be true?

Guidelines:
- Generate 2-5 deliverable options per impact
- Think divergently - multiple solutions
- Include quick wins and strategic bets
- Consider build vs. buy vs. integrate
- Flag high-risk or high-assumption deliverables

Context:
- Goal: {{goal}}
- Actor: {{actor}}
- Impact: {{impact}}
- Context: {{context}}
- Constraints: {{constraints}}

Generate deliverable options for this impact.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        impactId: { type: 'string' },
        deliverables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              impactId: { type: 'string' },
              actorId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              type: {
                type: 'string',
                enum: ['feature', 'enhancement', 'content', 'integration', 'automation', 'ui-ux', 'infrastructure']
              },
              userStory: { type: 'string', description: 'As a... I want... So that...' },
              impactPotential: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['small', 'medium', 'large', 'xl'] },
              risk: { type: 'string', enum: ['high', 'medium', 'low'] },
              dependencies: { type: 'array', items: { type: 'string' } },
              assumptions: { type: 'array', items: { type: 'string' } },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              alternatives: { type: 'array', items: { type: 'string' } }
            },
            required: ['id', 'impactId', 'actorId', 'title', 'description', 'type', 'impactPotential', 'effort']
          }
        }
      },
      required: ['impactId', 'deliverables']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'impact-mapping', 'deliverables', args.impact.id]
}));

/**
 * Task: Prioritize Deliverables and Create Roadmap
 * Prioritizes deliverables by impact and creates implementation roadmap
 */
export const prioritizationTask = defineTask('prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize Deliverables and Create Roadmap',
  agent: {
    name: 'prioritizer',
    prompt: {
      role: 'system',
      content: `You are a product strategist prioritizing deliverables and creating an implementation roadmap for Impact Mapping.

Your task is to:
1. Prioritize all deliverables by their potential to achieve the goal
2. Create an implementation roadmap with milestones
3. Balance quick wins with strategic investments
4. Identify validation experiments for critical assumptions

Prioritization Framework:
- **Impact Potential**: Contribution to goal (weight: 40%)
- **Effort**: Development complexity (weight: 30%)
- **Risk**: Technical and business risk (weight: 15%)
- **Dependencies**: Sequencing constraints (weight: 15%)

Prioritization Tiers:
1. **Must Have**: Critical path to goal, high impact
2. **Should Have**: Important but not critical
3. **Could Have**: Nice to have, lower impact
4. **Won't Have (Now)**: Deprioritized, future consideration

Roadmap Strategy:
- **Phase 1 (MVP)**: Highest impact, lowest effort - validate core assumptions
- **Phase 2 (Growth)**: Build on MVP, expand impact
- **Phase 3 (Scale)**: Optimize and expand to more actors
- Include assumption validation experiments early

Context:
- Goal: {{goal}}
- Actors: {{actors}}
- Impacts: {{impacts}}
- Deliverables: {{deliverables}}
- Assumptions: {{assumptions}}
- Constraints: {{constraints}}
- Timeframe: {{timeframe}}

Prioritize deliverables and create roadmap.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        prioritizedDeliverables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              deliverable: { type: 'object' },
              priorityScore: { type: 'number', description: 'Weighted score 0-100' },
              priorityTier: { type: 'string', enum: ['must-have', 'should-have', 'could-have', 'wont-have-now'] },
              rationale: { type: 'string' },
              recommendedPhase: { type: 'number', description: 'Which milestone phase' },
              blockedBy: { type: 'array', items: { type: 'string' } },
              enables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        roadmap: {
          type: 'object',
          properties: {
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'number' },
                  name: { type: 'string' },
                  goal: { type: 'string' },
                  duration: { type: 'string' },
                  deliverableIds: { type: 'array', items: { type: 'string' } },
                  successCriteria: { type: 'array', items: { type: 'string' } },
                  assumptions: { type: 'array', items: { type: 'string' } },
                  validationExperiments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        assumption: { type: 'string' },
                        experiment: { type: 'string' },
                        effort: { type: 'string' }
                      }
                    }
                  }
                }
              }
            },
            strategy: { type: 'string' },
            riskMitigation: { type: 'array', items: { type: 'string' } }
          }
        },
        mustHaveCount: { type: 'number' },
        shouldHaveCount: { type: 'number' },
        couldHaveCount: { type: 'number' },
        wontHaveCount: { type: 'number' },
        totalEstimatedEffort: { type: 'string' }
      },
      required: ['prioritizedDeliverables', 'roadmap']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'impact-mapping', 'prioritization']
}));

/**
 * Task: Create Visual Impact Map
 * Generates visual representation of the complete impact map
 */
export const mapVisualizationTask = defineTask('map-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Visual Impact Map',
  agent: {
    name: 'map-visualizer',
    prompt: {
      role: 'system',
      content: `You are a visualization expert creating a visual Impact Map using Mermaid diagram syntax.

Your task is to create a tree-structured diagram showing the complete impact map hierarchy:

Goal → Actors → Impacts → Deliverables

Visualization Requirements:
1. **Clear Hierarchy**: Show parent-child relationships
2. **Visual Indicators**:
   - 🎯 Goal (root node)
   - 👤 Primary Actors (blue)
   - 👥 Secondary Actors (green)
   - ⚠️ Negative Actors (red)
   - 💫 Impacts
   - 📦 Deliverables (prioritized)
   - ⚡ Assumptions (flagged)
3. **Priority Markers**: Highlight must-have deliverables
4. **Assumption Flags**: Mark nodes with critical assumptions
5. **Clean Layout**: Readable, not cluttered

Mermaid Syntax:
\`\`\`mermaid
graph TB
    goal["🎯 GOAL: Increase revenue by 30%"]
    actor1["👤 Existing Customers"]
    actor2["👥 New Customers"]

    impact1["💫 Upgrade to premium tier"]
    impact2["💫 Reduce churn rate"]

    del1["📦 Feature: Advanced Analytics"]
    del2["📦 Feature: Loyalty Program ⚡"]

    goal --> actor1
    goal --> actor2
    actor1 --> impact1
    actor1 --> impact2
    impact1 --> del1
    impact2 --> del2
\`\`\`

Context:
- Goal: {{goal}}
- Actors: {{actors}}
- Impacts: {{impacts}}
- Deliverables: {{deliverables}}
- Assumptions: {{assumptions}}
- Roadmap: {{roadmap}}

Create a complete, visual Impact Map.`
    },
    outputSchema: {
      type: 'object',
      properties: {
        map: {
          type: 'object',
          properties: {
            goal: { type: 'object' },
            tree: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  actor: { type: 'object' },
                  impacts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        impact: { type: 'object' },
                        deliverables: { type: 'array' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        mermaidDiagram: { type: 'string', description: 'Complete Mermaid diagram code' },
        summary: {
          type: 'object',
          properties: {
            totalNodes: { type: 'number' },
            maxDepth: { type: 'number', description: 'Tree depth' },
            branchingFactor: { type: 'number', description: 'Avg children per node' },
            assumptionNodes: { type: 'number', description: 'Nodes with assumptions' }
          }
        },
        insights: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key insights from the map structure'
        }
      },
      required: ['map', 'mermaidDiagram', 'summary']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'impact-mapping', 'visualization']
}));

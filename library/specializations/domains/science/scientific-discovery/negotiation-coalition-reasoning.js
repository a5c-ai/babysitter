/**
 * @process specializations/domains/science/scientific-discovery/negotiation-coalition-reasoning
 * @description Negotiation and Coalition Reasoning - Reason systematically about acceptable agreements,
 * coalition formation, bargaining strategies, and multi-party negotiations in scientific collaboration,
 * resource allocation, and research partnership contexts.
 * @inputs { parties: object[], issues: object[], constraints?: object, objectives?: string[], context?: string }
 * @outputs { success: boolean, agreements: object[], coalitions: object[], strategies: object[], recommendations: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/negotiation-coalition-reasoning', {
 *   parties: [{ name: 'University Lab', interests: ['publication', 'patents'] }, { name: 'Industry Partner', interests: ['IP rights', 'product development'] }],
 *   issues: [{ name: 'IP ownership', options: ['shared', 'exclusive', 'split by domain'] }],
 *   objectives: ['Fair resource distribution', 'Maximize collaboration potential'],
 *   context: 'Research collaboration agreement negotiation'
 * });
 *
 * @references
 * - Negotiation Theory: https://www.pon.harvard.edu/tag/negotiation-theory/
 * - Coalition Formation: https://plato.stanford.edu/entries/game-theory/#CoalGame
 * - Bargaining Theory: https://www.nobelprize.org/prizes/economic-sciences/1994/summary/
 * - Multi-Party Negotiation: https://www.sciencedirect.com/topics/economics-econometrics-and-finance/negotiation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    parties,
    issues,
    constraints = {},
    objectives = [],
    context = ''
  } = inputs;

  // Phase 1: Party and Interest Analysis
  const partyAnalysis = await ctx.task(partyInterestAnalysisTask, {
    parties,
    issues,
    context
  });

  // Quality Gate: Parties must have identifiable interests
  if (!partyAnalysis.parties || partyAnalysis.parties.length < 2) {
    return {
      success: false,
      error: 'Negotiation requires at least 2 parties with identifiable interests',
      phase: 'party-analysis',
      agreements: null
    };
  }

  // Phase 2: Issue Analysis and Structuring
  const issueAnalysis = await ctx.task(issueAnalysisTask, {
    issues,
    partyAnalysis: partyAnalysis.parties,
    constraints,
    context
  });

  // Phase 3: BATNA and Reservation Value Analysis
  const batnaAnalysis = await ctx.task(batnaAnalysisTask, {
    parties: partyAnalysis.parties,
    issues: issueAnalysis.issues,
    constraints,
    context
  });

  // Phase 4: Zone of Possible Agreement (ZOPA) Identification
  const zopaAnalysis = await ctx.task(zopaIdentificationTask, {
    parties: partyAnalysis.parties,
    issues: issueAnalysis.issues,
    batnaAnalysis,
    constraints
  });

  // Breakpoint: Review negotiation structure
  await ctx.breakpoint({
    question: `Review negotiation structure for "${context}". ZOPA exists: ${zopaAnalysis.zopaExists}. Proceed with strategy development?`,
    title: 'Negotiation Structure Review',
    context: {
      runId: ctx.runId,
      context,
      partyCount: partyAnalysis.parties.length,
      issueCount: issueAnalysis.issues.length,
      zopaExists: zopaAnalysis.zopaExists,
      files: [{
        path: 'artifacts/negotiation-structure.json',
        format: 'json',
        content: { partyAnalysis, issueAnalysis, batnaAnalysis, zopaAnalysis }
      }]
    }
  });

  // Phase 5: Coalition Structure Analysis
  const coalitionAnalysis = await ctx.task(coalitionStructureAnalysisTask, {
    parties: partyAnalysis.parties,
    issues: issueAnalysis.issues,
    zopaAnalysis,
    objectives
  });

  // Phase 6: Value Creation Opportunities
  const valueCreation = await ctx.task(valueCreationAnalysisTask, {
    parties: partyAnalysis.parties,
    issues: issueAnalysis.issues,
    coalitionAnalysis,
    constraints
  });

  // Phase 7: Bargaining Strategy Development
  const bargainingStrategies = await ctx.task(bargainingStrategyTask, {
    parties: partyAnalysis.parties,
    issues: issueAnalysis.issues,
    batnaAnalysis,
    zopaAnalysis,
    valueCreation
  });

  // Phase 8: Agreement Design
  const agreementDesign = await ctx.task(agreementDesignTask, {
    parties: partyAnalysis.parties,
    issues: issueAnalysis.issues,
    zopaAnalysis,
    valueCreation,
    coalitionAnalysis,
    constraints
  });

  // Phase 9: Implementation and Enforcement Analysis
  const implementationAnalysis = await ctx.task(implementationAnalysisTask, {
    agreementDesign,
    parties: partyAnalysis.parties,
    constraints
  });

  // Phase 10: Synthesis and Recommendations
  const synthesis = await ctx.task(negotiationSynthesisTask, {
    partyAnalysis: partyAnalysis.parties,
    issueAnalysis: issueAnalysis.issues,
    batnaAnalysis,
    zopaAnalysis,
    coalitionAnalysis,
    valueCreation,
    bargainingStrategies,
    agreementDesign,
    implementationAnalysis,
    objectives,
    context
  });

  // Final Breakpoint: Negotiation Analysis Approval
  await ctx.breakpoint({
    question: `Negotiation analysis complete for "${context}". Review proposed agreements and strategies?`,
    title: 'Negotiation Analysis Approval',
    context: {
      runId: ctx.runId,
      context,
      agreementCount: agreementDesign.agreements?.length || 0,
      coalitionCount: coalitionAnalysis.coalitions?.length || 0,
      files: [
        { path: 'artifacts/negotiation-report.json', format: 'json', content: synthesis },
        { path: 'artifacts/negotiation-report.md', format: 'markdown', content: synthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    context,
    agreements: agreementDesign.agreements,
    coalitions: coalitionAnalysis.coalitions,
    strategies: bargainingStrategies.strategies,
    recommendations: synthesis.recommendations,
    analysis: {
      parties: partyAnalysis.parties,
      issues: issueAnalysis.issues,
      zopa: zopaAnalysis,
      batna: batnaAnalysis,
      valueCreation: valueCreation.opportunities,
      implementation: implementationAnalysis
    },
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/negotiation-coalition-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const partyInterestAnalysisTask = defineTask('party-interest-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Party and Interest Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Negotiation Analyst specializing in interest-based negotiation',
      task: 'Analyze parties, their interests, positions, and underlying needs',
      context: {
        parties: args.parties,
        issues: args.issues,
        context: args.context
      },
      instructions: [
        '1. Identify all parties and their roles in the negotiation',
        '2. Distinguish between stated positions and underlying interests',
        '3. Identify core interests vs peripheral interests for each party',
        '4. Assess power dynamics and leverage points',
        '5. Identify shared interests that can form basis for agreement',
        '6. Analyze conflicting interests and their sources',
        '7. Assess each party\'s alternatives and dependencies',
        '8. Identify hidden stakeholders or constituencies',
        '9. Analyze cultural or institutional factors affecting negotiation',
        '10. Map relationships and history between parties'
      ],
      outputFormat: 'JSON object with comprehensive party analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['parties'],
      properties: {
        parties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              statedPositions: { type: 'array', items: { type: 'string' } },
              underlyingInterests: { type: 'array', items: { type: 'object' } },
              coreInterests: { type: 'array', items: { type: 'string' } },
              power: { type: 'string', enum: ['high', 'medium', 'low'] },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        sharedInterests: { type: 'array', items: { type: 'object' } },
        conflictingInterests: { type: 'array', items: { type: 'object' } },
        powerDynamics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['negotiation', 'interest-analysis', 'party-assessment']
}));

export const issueAnalysisTask = defineTask('issue-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Issue Analysis and Structuring',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Negotiation Structuring Expert',
      task: 'Analyze and structure negotiation issues',
      context: {
        issues: args.issues,
        partyAnalysis: args.partyAnalysis,
        constraints: args.constraints,
        context: args.context
      },
      instructions: [
        '1. Identify all explicit and implicit issues to be negotiated',
        '2. Classify issues by type (distributive, integrative, procedural)',
        '3. Assess importance of each issue to each party',
        '4. Identify issue linkages and tradeoff possibilities',
        '5. Determine which issues are negotiable vs fixed',
        '6. Assess complexity and difficulty of each issue',
        '7. Identify issues that may expand or contract the pie',
        '8. Determine optimal sequencing of issues',
        '9. Identify framing effects on issues',
        '10. Create issue matrix mapping parties to issues'
      ],
      outputFormat: 'JSON object with structured issue analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['issues'],
      properties: {
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['distributive', 'integrative', 'procedural'] },
              importance: { type: 'object' },
              options: { type: 'array', items: { type: 'string' } },
              negotiable: { type: 'boolean' },
              complexity: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        issueLinkages: { type: 'array', items: { type: 'object' } },
        recommendedSequence: { type: 'array', items: { type: 'string' } },
        issueMatrix: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['negotiation', 'issue-analysis', 'structuring']
}));

export const batnaAnalysisTask = defineTask('batna-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: BATNA and Reservation Value Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'BATNA Analysis Expert',
      task: 'Analyze Best Alternatives To Negotiated Agreement and reservation values',
      context: {
        parties: args.parties,
        issues: args.issues,
        constraints: args.constraints,
        context: args.context
      },
      instructions: [
        '1. Identify BATNA for each party (what they\'ll do if no agreement)',
        '2. Assess strength and attractiveness of each BATNA',
        '3. Calculate reservation values (walk-away points) for each party',
        '4. Identify factors that could improve or weaken BATNAs',
        '5. Assess uncertainty in BATNA estimates',
        '6. Identify dependency between parties\' BATNAs',
        '7. Analyze how time pressure affects BATNAs',
        '8. Identify ways to improve own BATNA',
        '9. Identify ways to influence other parties\' perception of BATNAs',
        '10. Calculate negotiation surplus available'
      ],
      outputFormat: 'JSON object with BATNA and reservation value analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['batnas', 'reservationValues'],
      properties: {
        batnas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partyId: { type: 'string' },
              batna: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              attractiveness: { type: 'number', minimum: 0, maximum: 10 },
              uncertainty: { type: 'string', enum: ['high', 'medium', 'low'] },
              improvementOptions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reservationValues: {
          type: 'object',
          description: 'Reservation values by party and issue'
        },
        negotiationSurplus: { type: 'number' },
        timePressureEffects: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['negotiation', 'batna', 'reservation-values']
}));

export const zopaIdentificationTask = defineTask('zopa-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Zone of Possible Agreement Identification',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'ZOPA Analysis Expert',
      task: 'Identify Zone of Possible Agreement and agreement space',
      context: {
        parties: args.parties,
        issues: args.issues,
        batnaAnalysis: args.batnaAnalysis,
        constraints: args.constraints
      },
      instructions: [
        '1. Determine if positive ZOPA exists for each issue',
        '2. Map the boundaries of ZOPA for each issue',
        '3. Identify multi-issue ZOPA through package deals',
        '4. Assess size and shape of overall ZOPA',
        '5. Identify Pareto-optimal outcomes within ZOPA',
        '6. Determine focal points within ZOPA',
        '7. Assess how uncertainty affects ZOPA boundaries',
        '8. Identify ways to expand ZOPA',
        '9. Map ZOPA for different coalition structures',
        '10. Identify agreements that maximize joint value'
      ],
      outputFormat: 'JSON object with ZOPA analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['zopaExists', 'boundaries'],
      properties: {
        zopaExists: { type: 'boolean' },
        boundaries: {
          type: 'object',
          description: 'ZOPA boundaries by issue'
        },
        size: { type: 'string', enum: ['large', 'medium', 'small', 'none'] },
        paretoFrontier: { type: 'array', items: { type: 'object' } },
        focalPoints: { type: 'array', items: { type: 'object' } },
        expansionOpportunities: { type: 'array', items: { type: 'string' } },
        multiIssueZopa: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['negotiation', 'zopa', 'agreement-space']
}));

export const coalitionStructureAnalysisTask = defineTask('coalition-structure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Coalition Structure Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Coalition Formation Expert',
      task: 'Analyze possible coalition structures and their stability',
      context: {
        parties: args.parties,
        issues: args.issues,
        zopaAnalysis: args.zopaAnalysis,
        objectives: args.objectives
      },
      instructions: [
        '1. Enumerate possible coalition structures',
        '2. Calculate value of each coalition',
        '3. Assess stability of each coalition (blocking potential)',
        '4. Identify natural alliance patterns based on interests',
        '5. Analyze conditions for coalition formation',
        '6. Calculate fair division within coalitions (Shapley values)',
        '7. Identify pivotal players in coalition formation',
        '8. Assess impact of exclusion on excluded parties',
        '9. Identify sustainable vs temporary coalitions',
        '10. Recommend coalition strategies'
      ],
      outputFormat: 'JSON object with coalition analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['coalitions'],
      properties: {
        coalitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              members: { type: 'array', items: { type: 'string' } },
              value: { type: 'number' },
              stability: { type: 'string', enum: ['stable', 'conditionally-stable', 'unstable'] },
              formationConditions: { type: 'array', items: { type: 'string' } },
              blocking: { type: 'boolean' }
            }
          }
        },
        shapleyValues: { type: 'object' },
        pivotalPlayers: { type: 'array', items: { type: 'string' } },
        naturalAlliances: { type: 'array', items: { type: 'object' } },
        recommendedStrategy: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['negotiation', 'coalition-formation', 'game-theory']
}));

export const valueCreationAnalysisTask = defineTask('value-creation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Value Creation Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Integrative Negotiation Expert',
      task: 'Identify opportunities to create value and expand the pie',
      context: {
        parties: args.parties,
        issues: args.issues,
        coalitionAnalysis: args.coalitionAnalysis,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify differences in interests that enable value creation',
        '2. Find opportunities for logrolling (trading low-value for high-value)',
        '3. Identify bridging solutions that satisfy underlying interests',
        '4. Find ways to reduce transaction costs through agreement',
        '5. Identify economies of scale or scope through cooperation',
        '6. Find risk-sharing arrangements that increase joint value',
        '7. Identify contingent contracts for uncertain outcomes',
        '8. Find non-competing differences to exploit',
        '9. Identify post-settlement opportunities',
        '10. Calculate potential value creation amounts'
      ],
      outputFormat: 'JSON object with value creation opportunities'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['logrolling', 'bridging', 'cost-cutting', 'risk-sharing', 'contingent', 'scale'] },
              description: { type: 'string' },
              valueCreated: { type: 'number' },
              beneficiaries: { type: 'array', items: { type: 'string' } },
              requirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalValueCreation: { type: 'number' },
        implementationComplexity: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['negotiation', 'value-creation', 'integrative']
}));

export const bargainingStrategyTask = defineTask('bargaining-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Bargaining Strategy Development',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Bargaining Strategy Expert',
      task: 'Develop comprehensive bargaining strategies for negotiation',
      context: {
        parties: args.parties,
        issues: args.issues,
        batnaAnalysis: args.batnaAnalysis,
        zopaAnalysis: args.zopaAnalysis,
        valueCreation: args.valueCreation
      },
      instructions: [
        '1. Develop opening position strategy (ambitious but credible)',
        '2. Design concession strategy (pattern, timing, size)',
        '3. Plan value-claiming tactics within ZOPA',
        '4. Develop value-creation proposals',
        '5. Plan information revelation strategy',
        '6. Design anchoring and framing approaches',
        '7. Develop commitment and deadline tactics',
        '8. Plan response strategies to counterpart tactics',
        '9. Design face-saving mechanisms for concessions',
        '10. Develop walkaway and threat strategies'
      ],
      outputFormat: 'JSON object with bargaining strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partyId: { type: 'string' },
              openingStrategy: { type: 'object' },
              concessionStrategy: { type: 'object' },
              valueClaimingTactics: { type: 'array', items: { type: 'string' } },
              valueCreationProposals: { type: 'array', items: { type: 'object' } },
              informationStrategy: { type: 'string' },
              commitmentTactics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        tacticalRecommendations: { type: 'array', items: { type: 'object' } },
        riskMitigation: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['negotiation', 'bargaining', 'strategy']
}));

export const agreementDesignTask = defineTask('agreement-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Agreement Design',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Agreement Design Specialist',
      task: 'Design optimal agreement structures',
      context: {
        parties: args.parties,
        issues: args.issues,
        zopaAnalysis: args.zopaAnalysis,
        valueCreation: args.valueCreation,
        coalitionAnalysis: args.coalitionAnalysis,
        constraints: args.constraints
      },
      instructions: [
        '1. Design multiple agreement options within ZOPA',
        '2. Structure agreements to capture value creation',
        '3. Include contingent provisions for uncertainty',
        '4. Design dispute resolution mechanisms',
        '5. Create incentive-compatible terms',
        '6. Include renegotiation provisions',
        '7. Design exit clauses and conditions',
        '8. Structure payment/benefit timing',
        '9. Include monitoring and verification provisions',
        '10. Assess fairness and sustainability of each design'
      ],
      outputFormat: 'JSON object with agreement designs'
    },
    outputSchema: {
      type: 'object',
      required: ['agreements'],
      properties: {
        agreements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              terms: { type: 'object' },
              contingencies: { type: 'array', items: { type: 'object' } },
              disputeResolution: { type: 'string' },
              renegotiationProvisions: { type: 'string' },
              exitClauses: { type: 'array', items: { type: 'string' } },
              fairnessScore: { type: 'number' },
              sustainability: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        recommendedAgreement: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['negotiation', 'agreement-design', 'contract']
}));

export const implementationAnalysisTask = defineTask('implementation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Implementation and Enforcement Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Implementation and Enforcement Analyst',
      task: 'Analyze implementation requirements and enforcement mechanisms',
      context: {
        agreementDesign: args.agreementDesign,
        parties: args.parties,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify implementation requirements for each agreement',
        '2. Assess enforceability of agreement terms',
        '3. Design monitoring mechanisms',
        '4. Identify potential implementation obstacles',
        '5. Create implementation timeline',
        '6. Design incentives for compliance',
        '7. Identify verification methods',
        '8. Assess third-party enforcement options',
        '9. Design early warning systems for non-compliance',
        '10. Create contingency plans for implementation failures'
      ],
      outputFormat: 'JSON object with implementation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'enforcementMechanisms'],
      properties: {
        requirements: { type: 'array', items: { type: 'object' } },
        enforcementMechanisms: { type: 'array', items: { type: 'object' } },
        monitoringPlan: { type: 'object' },
        obstacles: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        complianceIncentives: { type: 'array', items: { type: 'object' } },
        contingencyPlans: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['negotiation', 'implementation', 'enforcement']
}));

export const negotiationSynthesisTask = defineTask('negotiation-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Negotiation Synthesis and Recommendations',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Negotiation Strategy Synthesizer',
      task: 'Synthesize all analyses into actionable recommendations',
      context: {
        partyAnalysis: args.partyAnalysis,
        issueAnalysis: args.issueAnalysis,
        batnaAnalysis: args.batnaAnalysis,
        zopaAnalysis: args.zopaAnalysis,
        coalitionAnalysis: args.coalitionAnalysis,
        valueCreation: args.valueCreation,
        bargainingStrategies: args.bargainingStrategies,
        agreementDesign: args.agreementDesign,
        implementationAnalysis: args.implementationAnalysis,
        objectives: args.objectives,
        context: args.context
      },
      instructions: [
        '1. Synthesize key insights from all analyses',
        '2. Prioritize recommendations by impact',
        '3. Identify critical success factors',
        '4. Highlight key risks and mitigation strategies',
        '5. Provide party-specific recommendations',
        '6. Recommend optimal negotiation approach',
        '7. Identify quick wins and long-term strategies',
        '8. Provide contingency recommendations',
        '9. Summarize expected outcomes',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with synthesis and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'markdown'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              targetParty: { type: 'string' },
              implementationSteps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyInsights: { type: 'array', items: { type: 'string' } },
        criticalSuccessFactors: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'object' } },
        expectedOutcomes: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['negotiation', 'synthesis', 'recommendations']
}));

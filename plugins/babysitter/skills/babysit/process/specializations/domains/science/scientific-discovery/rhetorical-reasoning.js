/**
 * @process specializations/domains/science/scientific-discovery/rhetorical-reasoning
 * @description Rhetorical Reasoning - Persuasion-oriented reasoning that considers audience characteristics,
 * framing strategies, argument presentation, and communicative effectiveness for scientific communication,
 * grant writing, policy advocacy, and public engagement in scientific discovery.
 * @inputs { claim: string, audience: object, purpose: string, context?: string, constraints?: object }
 * @outputs { success: boolean, rhetoricalStrategy: object, arguments: object[], framings: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/rhetorical-reasoning', {
 *   claim: 'Climate models are reliable predictors of future warming',
 *   audience: { type: 'policymakers', expertise: 'non-specialist', concerns: ['economic impact', 'certainty'] },
 *   purpose: 'Persuade adoption of evidence-based climate policy',
 *   context: 'Policy briefing on climate science'
 * });
 *
 * @references
 * - Rhetoric (Aristotle): https://plato.stanford.edu/entries/aristotle-rhetoric/
 * - Argumentation Theory: https://plato.stanford.edu/entries/argument/
 * - Science Communication: https://www.sciencedirect.com/topics/social-sciences/science-communication
 * - Framing Effects: https://www.annualreviews.org/doi/abs/10.1146/annurev.polisci.10.072805.103054
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    claim,
    audience,
    purpose,
    context = '',
    constraints = {}
  } = inputs;

  // Phase 1: Claim Analysis
  const claimAnalysis = await ctx.task(claimAnalysisTask, {
    claim,
    purpose,
    context
  });

  // Quality Gate: Claim must be defensible
  if (!claimAnalysis.defensibility || claimAnalysis.defensibility === 'indefensible') {
    return {
      success: false,
      error: 'Claim is not defensible for rhetorical presentation',
      phase: 'claim-analysis',
      rhetoricalStrategy: null
    };
  }

  // Phase 2: Audience Analysis
  const audienceAnalysis = await ctx.task(audienceAnalysisTask, {
    audience,
    claim: claimAnalysis,
    purpose,
    context
  });

  // Phase 3: Rhetorical Situation Analysis
  const situationAnalysis = await ctx.task(rhetoricalSituationTask, {
    claim: claimAnalysis,
    audience: audienceAnalysis,
    purpose,
    context,
    constraints
  });

  // Phase 4: Ethos Development
  const ethosStrategy = await ctx.task(ethosStrategyTask, {
    audience: audienceAnalysis,
    situation: situationAnalysis,
    claim: claimAnalysis
  });

  // Breakpoint: Review rhetorical analysis
  await ctx.breakpoint({
    question: `Review rhetorical analysis for claim: "${claim}". Audience: ${audience.type}. Proceed with strategy development?`,
    title: 'Rhetorical Analysis Review',
    context: {
      runId: ctx.runId,
      claim,
      audience: audienceAnalysis.summary,
      situation: situationAnalysis.summary,
      files: [{
        path: 'artifacts/rhetorical-analysis.json',
        format: 'json',
        content: { claimAnalysis, audienceAnalysis, situationAnalysis, ethosStrategy }
      }]
    }
  });

  // Phase 5: Logos Development
  const logosStrategy = await ctx.task(logosStrategyTask, {
    claim: claimAnalysis,
    audience: audienceAnalysis,
    situation: situationAnalysis,
    constraints
  });

  // Phase 6: Pathos Development
  const pathosStrategy = await ctx.task(pathosStrategyTask, {
    claim: claimAnalysis,
    audience: audienceAnalysis,
    situation: situationAnalysis,
    purpose
  });

  // Phase 7: Framing Strategy Development
  const framingStrategy = await ctx.task(framingStrategyTask, {
    claim: claimAnalysis,
    audience: audienceAnalysis,
    ethos: ethosStrategy,
    logos: logosStrategy,
    pathos: pathosStrategy
  });

  // Phase 8: Argument Construction
  const argumentConstruction = await ctx.task(argumentConstructionTask, {
    claim: claimAnalysis,
    framingStrategy,
    ethos: ethosStrategy,
    logos: logosStrategy,
    pathos: pathosStrategy,
    audience: audienceAnalysis
  });

  // Phase 9: Counterargument Anticipation
  const counterargumentStrategy = await ctx.task(counterargumentStrategyTask, {
    claim: claimAnalysis,
    arguments: argumentConstruction.arguments,
    audience: audienceAnalysis,
    situation: situationAnalysis
  });

  // Phase 10: Rhetorical Strategy Synthesis
  const strategySynthesis = await ctx.task(rhetoricalStrategySynthesisTask, {
    claim: claimAnalysis,
    audience: audienceAnalysis,
    situation: situationAnalysis,
    ethos: ethosStrategy,
    logos: logosStrategy,
    pathos: pathosStrategy,
    framing: framingStrategy,
    arguments: argumentConstruction,
    counterarguments: counterargumentStrategy,
    purpose,
    context
  });

  // Final Breakpoint: Rhetorical Strategy Approval
  await ctx.breakpoint({
    question: `Rhetorical strategy complete for "${claim}". Primary approach: ${strategySynthesis.primaryApproach}. Approve strategy?`,
    title: 'Rhetorical Strategy Approval',
    context: {
      runId: ctx.runId,
      claim,
      primaryApproach: strategySynthesis.primaryApproach,
      argumentCount: argumentConstruction.arguments?.length || 0,
      files: [
        { path: 'artifacts/rhetorical-strategy.json', format: 'json', content: strategySynthesis },
        { path: 'artifacts/rhetorical-strategy.md', format: 'markdown', content: strategySynthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    claim: claimAnalysis.refinedClaim,
    rhetoricalStrategy: strategySynthesis.strategy,
    arguments: argumentConstruction.arguments,
    framings: framingStrategy.framings,
    appeals: {
      ethos: ethosStrategy.strategies,
      logos: logosStrategy.strategies,
      pathos: pathosStrategy.strategies
    },
    counterargumentDefenses: counterargumentStrategy.defenses,
    recommendations: strategySynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/rhetorical-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const claimAnalysisTask = defineTask('claim-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Claim Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'rhetorical-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Rhetorical Analyst specializing in claim assessment',
      task: 'Analyze the claim for rhetorical presentation',
      context: {
        claim: args.claim,
        purpose: args.purpose,
        context: args.context
      },
      instructions: [
        '1. Clarify and refine the claim for precision',
        '2. Identify the type of claim (fact, value, policy)',
        '3. Assess inherent defensibility of the claim',
        '4. Identify evidence available to support the claim',
        '5. Identify qualifications or limits needed',
        '6. Assess how controversial the claim is',
        '7. Identify what the claim commits the speaker to',
        '8. Find the strongest formulation of the claim',
        '9. Identify potential weaknesses in the claim',
        '10. Assess claim fit with rhetorical purpose'
      ],
      outputFormat: 'JSON object with claim analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedClaim', 'claimType', 'defensibility'],
      properties: {
        refinedClaim: { type: 'string' },
        claimType: { type: 'string', enum: ['fact', 'value', 'policy', 'definition', 'cause'] },
        defensibility: { type: 'string', enum: ['strong', 'moderate', 'weak', 'indefensible'] },
        availableEvidence: { type: 'array', items: { type: 'object' } },
        qualifications: { type: 'array', items: { type: 'string' } },
        controversyLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        commitments: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rhetorical-reasoning', 'claim-analysis', 'assessment']
}));

export const audienceAnalysisTask = defineTask('audience-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Audience Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'rhetorical-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Audience Research Expert',
      task: 'Analyze audience characteristics for persuasion strategy',
      context: {
        audience: args.audience,
        claim: args.claim,
        purpose: args.purpose,
        context: args.context
      },
      instructions: [
        '1. Characterize audience demographics and background',
        '2. Assess audience knowledge level on topic',
        '3. Identify audience values and priorities',
        '4. Assess likely audience attitudes toward claim',
        '5. Identify audience concerns and objections',
        '6. Determine what would be persuasive to this audience',
        '7. Identify audience trust markers and credibility cues',
        '8. Assess audience information processing style',
        '9. Identify emotional resonance points',
        '10. Characterize decision-making factors for audience'
      ],
      outputFormat: 'JSON object with audience analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'persuasionFactors', 'summary'],
      properties: {
        profile: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            knowledgeLevel: { type: 'string', enum: ['expert', 'informed', 'general', 'novice'] },
            values: { type: 'array', items: { type: 'string' } },
            priorities: { type: 'array', items: { type: 'string' } }
          }
        },
        attitudeTowardClaim: { type: 'string', enum: ['supportive', 'neutral', 'skeptical', 'opposed'] },
        concerns: { type: 'array', items: { type: 'object' } },
        persuasionFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        trustMarkers: { type: 'array', items: { type: 'string' } },
        processingStyle: { type: 'string', enum: ['analytical', 'heuristic', 'narrative', 'mixed'] },
        emotionalResonance: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rhetorical-reasoning', 'audience-analysis', 'persuasion']
}));

export const rhetoricalSituationTask = defineTask('rhetorical-situation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Rhetorical Situation Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'rhetorical-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Rhetorical Situation Analyst',
      task: 'Analyze the rhetorical situation (exigence, constraints, kairos)',
      context: {
        claim: args.claim,
        audience: args.audience,
        purpose: args.purpose,
        context: args.context,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify the exigence (urgent issue requiring response)',
        '2. Analyze the kairos (opportune moment and timing)',
        '3. Identify constraints on rhetoric (physical, cultural, genre)',
        '4. Assess the medium and channel implications',
        '5. Identify competing voices and messages',
        '6. Analyze power dynamics in the situation',
        '7. Assess what actions are available to audience',
        '8. Identify fitting responses to the situation',
        '9. Analyze genre expectations and conventions',
        '10. Summarize rhetorical opportunities and challenges'
      ],
      outputFormat: 'JSON object with rhetorical situation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['exigence', 'kairos', 'constraints', 'summary'],
      properties: {
        exigence: {
          type: 'object',
          properties: {
            urgentIssue: { type: 'string' },
            imperfection: { type: 'string' },
            modifiability: { type: 'string', enum: ['high', 'medium', 'low'] }
          }
        },
        kairos: {
          type: 'object',
          properties: {
            timing: { type: 'string' },
            opportuneness: { type: 'string', enum: ['optimal', 'good', 'acceptable', 'poor'] },
            contextualFactors: { type: 'array', items: { type: 'string' } }
          }
        },
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              type: { type: 'string', enum: ['physical', 'cultural', 'genre', 'ethical', 'practical'] },
              impact: { type: 'string' }
            }
          }
        },
        competingVoices: { type: 'array', items: { type: 'object' } },
        genreExpectations: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        challenges: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rhetorical-reasoning', 'situation-analysis', 'kairos']
}));

export const ethosStrategyTask = defineTask('ethos-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Ethos Development',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'rhetorical-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Ethos Strategy Expert',
      task: 'Develop credibility and character-based persuasion strategies',
      context: {
        audience: args.audience,
        situation: args.situation,
        claim: args.claim
      },
      instructions: [
        '1. Identify sources of credibility for this audience',
        '2. Develop phronesis (practical wisdom) demonstrations',
        '3. Develop arete (virtue/expertise) demonstrations',
        '4. Develop eunoia (goodwill) demonstrations',
        '5. Identify authorities to cite or invoke',
        '6. Plan how to establish common ground',
        '7. Identify potential credibility threats to address',
        '8. Develop strategies for building trust',
        '9. Plan appropriate self-presentation',
        '10. Identify ways to leverage existing reputation'
      ],
      outputFormat: 'JSON object with ethos strategies'
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
              strategy: { type: 'string' },
              type: { type: 'string', enum: ['phronesis', 'arete', 'eunoia', 'authority', 'common-ground'] },
              implementation: { type: 'string' },
              expectedEffect: { type: 'string' }
            }
          }
        },
        authorityReferences: { type: 'array', items: { type: 'object' } },
        commonGroundElements: { type: 'array', items: { type: 'string' } },
        credibilityThreats: { type: 'array', items: { type: 'object' } },
        trustBuildingApproaches: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rhetorical-reasoning', 'ethos', 'credibility']
}));

export const logosStrategyTask = defineTask('logos-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Logos Development',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'rhetorical-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Logical Argumentation Expert',
      task: 'Develop logic and evidence-based persuasion strategies',
      context: {
        claim: args.claim,
        audience: args.audience,
        situation: args.situation,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify strongest evidence for the claim',
        '2. Select appropriate argument structures (deductive, inductive, abductive)',
        '3. Identify data and statistics to present',
        '4. Plan use of examples and cases',
        '5. Develop causal reasoning chains',
        '6. Identify appropriate level of technicality',
        '7. Plan logical organization of arguments',
        '8. Identify enthymemes (implicit premises audience accepts)',
        '9. Develop appropriate qualifications and hedges',
        '10. Plan evidence presentation for maximum impact'
      ],
      outputFormat: 'JSON object with logos strategies'
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
              strategy: { type: 'string' },
              argumentType: { type: 'string', enum: ['deductive', 'inductive', 'abductive', 'analogical', 'causal'] },
              evidence: { type: 'array', items: { type: 'string' } },
              implementation: { type: 'string' }
            }
          }
        },
        keyEvidence: { type: 'array', items: { type: 'object' } },
        examples: { type: 'array', items: { type: 'object' } },
        enthymemes: { type: 'array', items: { type: 'object' } },
        logicalOrganization: { type: 'string' },
        technicalityLevel: { type: 'string', enum: ['technical', 'informed', 'general', 'simplified'] }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rhetorical-reasoning', 'logos', 'argumentation']
}));

export const pathosStrategyTask = defineTask('pathos-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Pathos Development',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'rhetorical-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Emotional Persuasion Expert',
      task: 'Develop emotion-based persuasion strategies',
      context: {
        claim: args.claim,
        audience: args.audience,
        situation: args.situation,
        purpose: args.purpose
      },
      instructions: [
        '1. Identify emotions that support persuasion goal',
        '2. Identify emotional barriers to overcome',
        '3. Develop appropriate narratives and stories',
        '4. Identify vivid language and imagery opportunities',
        '5. Plan emotional arc of the presentation',
        '6. Identify appropriate emotional appeals',
        '7. Develop connection to audience values and identity',
        '8. Plan use of concrete, humanizing details',
        '9. Identify metaphors and analogies with emotional resonance',
        '10. Ensure ethical use of emotional appeal'
      ],
      outputFormat: 'JSON object with pathos strategies'
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
              strategy: { type: 'string' },
              targetEmotion: { type: 'string' },
              technique: { type: 'string' },
              ethicalCheck: { type: 'boolean' },
              implementation: { type: 'string' }
            }
          }
        },
        emotionalBarriers: { type: 'array', items: { type: 'object' } },
        narratives: { type: 'array', items: { type: 'object' } },
        imagery: { type: 'array', items: { type: 'string' } },
        emotionalArc: { type: 'object' },
        metaphors: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rhetorical-reasoning', 'pathos', 'emotional-appeal']
}));

export const framingStrategyTask = defineTask('framing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Framing Strategy Development',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'rhetorical-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Strategic Framing Expert',
      task: 'Develop framing strategies for effective persuasion',
      context: {
        claim: args.claim,
        audience: args.audience,
        ethos: args.ethos,
        logos: args.logos,
        pathos: args.pathos
      },
      instructions: [
        '1. Identify alternative frames for presenting the claim',
        '2. Assess which frames resonate with audience values',
        '3. Develop gain frames vs loss frames as appropriate',
        '4. Identify metaphorical frames that aid understanding',
        '5. Plan how to define key terms favorably',
        '6. Identify frames used by opposition to counter',
        '7. Develop reframing strategies for counterarguments',
        '8. Plan problem-solution framing structure',
        '9. Identify identity-relevant frames',
        '10. Select optimal primary and secondary frames'
      ],
      outputFormat: 'JSON object with framing strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['framings'],
      properties: {
        framings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frame: { type: 'string' },
              type: { type: 'string', enum: ['gain', 'loss', 'metaphorical', 'problem-solution', 'identity', 'values'] },
              audienceResonance: { type: 'string', enum: ['high', 'medium', 'low'] },
              implementation: { type: 'string' }
            }
          }
        },
        primaryFrame: { type: 'object' },
        secondaryFrames: { type: 'array', items: { type: 'object' } },
        oppositionFrames: { type: 'array', items: { type: 'object' } },
        reframingStrategies: { type: 'array', items: { type: 'object' } },
        termDefinitions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rhetorical-reasoning', 'framing', 'strategic-communication']
}));

export const argumentConstructionTask = defineTask('argument-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Argument Construction',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'rhetorical-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Argument Construction Expert',
      task: 'Construct complete arguments integrating ethos, logos, and pathos',
      context: {
        claim: args.claim,
        framingStrategy: args.framingStrategy,
        ethos: args.ethos,
        logos: args.logos,
        pathos: args.pathos,
        audience: args.audience
      },
      instructions: [
        '1. Construct main arguments supporting the claim',
        '2. Integrate ethos, logos, and pathos appropriately',
        '3. Apply selected framing to arguments',
        '4. Organize arguments for maximum effect',
        '5. Develop transitions between arguments',
        '6. Include appropriate evidence and support',
        '7. Build to strongest argument placement',
        '8. Ensure arguments are audience-appropriate',
        '9. Include necessary qualifications',
        '10. Develop memorable formulations'
      ],
      outputFormat: 'JSON object with constructed arguments'
    },
    outputSchema: {
      type: 'object',
      required: ['arguments'],
      properties: {
        arguments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              claim: { type: 'string' },
              support: { type: 'array', items: { type: 'string' } },
              warrant: { type: 'string' },
              backing: { type: 'string' },
              qualifications: { type: 'array', items: { type: 'string' } },
              appealType: { type: 'string', enum: ['primarily-ethos', 'primarily-logos', 'primarily-pathos', 'integrated'] },
              strength: { type: 'string', enum: ['strong', 'moderate', 'supporting'] }
            }
          }
        },
        argumentOrder: { type: 'array', items: { type: 'string' } },
        transitions: { type: 'array', items: { type: 'object' } },
        memorableFormulations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rhetorical-reasoning', 'argument-construction', 'persuasion']
}));

export const counterargumentStrategyTask = defineTask('counterargument-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Counterargument Anticipation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'rhetorical-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Counterargument Defense Expert',
      task: 'Anticipate and develop responses to counterarguments',
      context: {
        claim: args.claim,
        arguments: args.arguments,
        audience: args.audience,
        situation: args.situation
      },
      instructions: [
        '1. Identify likely counterarguments from this audience',
        '2. Categorize counterarguments by type and severity',
        '3. Develop refutation strategies for each',
        '4. Plan inoculation against predictable objections',
        '5. Develop concession-and-response strategies',
        '6. Identify which counterarguments to address proactively',
        '7. Develop reframing responses',
        '8. Plan tone and approach for addressing objections',
        '9. Identify counterarguments to acknowledge vs dismiss',
        '10. Develop recovery strategies if arguments challenged'
      ],
      outputFormat: 'JSON object with counterargument strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['counterarguments', 'defenses'],
      properties: {
        counterarguments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              argument: { type: 'string' },
              source: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'significant', 'moderate', 'minor'] },
              likelihood: { type: 'string', enum: ['very-likely', 'likely', 'possible', 'unlikely'] }
            }
          }
        },
        defenses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              counterargument: { type: 'string' },
              strategy: { type: 'string', enum: ['refute', 'reframe', 'concede-and-respond', 'inoculate', 'acknowledge'] },
              response: { type: 'string' },
              timing: { type: 'string', enum: ['proactive', 'reactive'] }
            }
          }
        },
        inoculationPlan: { type: 'array', items: { type: 'object' } },
        recoveryStrategies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rhetorical-reasoning', 'counterargument', 'defense']
}));

export const rhetoricalStrategySynthesisTask = defineTask('rhetorical-strategy-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Rhetorical Strategy Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'rhetorical-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Rhetorical Strategy Synthesizer',
      task: 'Synthesize all elements into cohesive rhetorical strategy',
      context: {
        claim: args.claim,
        audience: args.audience,
        situation: args.situation,
        ethos: args.ethos,
        logos: args.logos,
        pathos: args.pathos,
        framing: args.framing,
        arguments: args.arguments,
        counterarguments: args.counterarguments,
        purpose: args.purpose,
        context: args.context
      },
      instructions: [
        '1. Synthesize all elements into unified strategy',
        '2. Determine primary persuasive approach',
        '3. Create presentation outline',
        '4. Identify key moments and turning points',
        '5. Develop opening and closing strategies',
        '6. Plan adaptation based on audience response',
        '7. Identify success indicators',
        '8. Develop contingency approaches',
        '9. Summarize key recommendations',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with complete rhetorical strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'primaryApproach', 'recommendations', 'markdown'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            openingStrategy: { type: 'string' },
            bodyStructure: { type: 'array', items: { type: 'string' } },
            closingStrategy: { type: 'string' },
            keyMoments: { type: 'array', items: { type: 'object' } },
            adaptationTriggers: { type: 'array', items: { type: 'object' } }
          }
        },
        primaryApproach: { type: 'string', enum: ['ethos-led', 'logos-led', 'pathos-led', 'balanced'] },
        presentationOutline: { type: 'array', items: { type: 'object' } },
        successIndicators: { type: 'array', items: { type: 'string' } },
        contingencies: { type: 'array', items: { type: 'object' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              rationale: { type: 'string' }
            }
          }
        },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rhetorical-reasoning', 'synthesis', 'strategy']
}));

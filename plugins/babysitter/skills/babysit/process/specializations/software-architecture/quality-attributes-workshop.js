/**
 * @process software-architecture/quality-attributes-workshop
 * @description Facilitated workshop for identifying, prioritizing, and specifying quality attributes (non-functional requirements) with scenario-based elicitation, stakeholder-driven prioritization, and architecture implications mapping
 * @inputs { systemName: string, businessContext: object, stakeholders: array, constraints: object, existingRequirements: array }
 * @outputs { success: boolean, qualityAttributes: array, scenarios: array, prioritizedScenarios: array, architectureImplications: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'System',
    businessContext = {},
    stakeholders = [],
    constraints = {},
    existingRequirements = [],
    outputDir = 'quality-attributes-workshop-output',
    qualityFramework = 'ISO 25010' // ISO 25010, FURPS+, or custom
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quality Attributes Workshop for ${systemName}`);

  // ============================================================================
  // PHASE 1: WORKSHOP PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing for quality attributes workshop');
  const workshopPreparation = await ctx.task(workshopPreparationTask, {
    systemName,
    businessContext,
    stakeholders,
    constraints,
    qualityFramework,
    outputDir
  });

  artifacts.push(...workshopPreparation.artifacts);

  // ============================================================================
  // PHASE 2: SYSTEM CONTEXT PRESENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Establishing system context and scope');
  const systemContextPresentation = await ctx.task(systemContextPresentationTask, {
    systemName,
    businessContext,
    existingRequirements,
    constraints,
    workshopPreparation,
    outputDir
  });

  artifacts.push(...systemContextPresentation.artifacts);

  // ============================================================================
  // PHASE 3: QUALITY ATTRIBUTES BRAINSTORMING
  // ============================================================================

  ctx.log('info', 'Phase 3: Brainstorming quality attributes with stakeholders');
  const qualityAttributesBrainstorm = await ctx.task(qualityAttributesBrainstormTask, {
    systemName,
    businessContext,
    stakeholders,
    systemContextPresentation,
    qualityFramework,
    outputDir
  });

  artifacts.push(...qualityAttributesBrainstorm.artifacts);

  // ============================================================================
  // PHASE 4: SCENARIO DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining quality attribute scenarios with measurable criteria');
  const scenarioDefinition = await ctx.task(scenarioDefinitionTask, {
    systemName,
    qualityAttributes: qualityAttributesBrainstorm.qualityAttributes,
    stakeholders,
    businessContext,
    outputDir
  });

  artifacts.push(...scenarioDefinition.artifacts);

  // ============================================================================
  // PHASE 5: SCENARIO PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Prioritizing scenarios and identifying trade-offs');
  const scenarioPrioritization = await ctx.task(scenarioPrioritizationTask, {
    systemName,
    scenarios: scenarioDefinition.scenarios,
    stakeholders,
    businessContext,
    constraints,
    outputDir
  });

  artifacts.push(...scenarioPrioritization.artifacts);

  // Breakpoint: Review prioritized scenarios
  await ctx.breakpoint({
    question: `Quality attribute scenarios defined and prioritized. Total scenarios: ${scenarioDefinition.scenarios.length}, High priority: ${scenarioPrioritization.highPriorityScenarios?.length || 0}. Review and approve prioritization?`,
    title: 'Scenario Prioritization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        systemName,
        totalScenarios: scenarioDefinition.scenarios.length,
        highPriorityCount: scenarioPrioritization.highPriorityScenarios?.length || 0,
        mustHaveCount: scenarioPrioritization.mustHaveScenarios?.length || 0,
        identifiedTradeoffs: scenarioPrioritization.tradeoffs?.length || 0,
        qualityAttributesCount: qualityAttributesBrainstorm.qualityAttributes.length
      }
    }
  });

  // ============================================================================
  // PHASE 6: SCENARIO REFINEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Refining and detailing high-priority scenarios');
  const scenarioRefinement = await ctx.task(scenarioRefinementTask, {
    systemName,
    prioritizedScenarios: scenarioPrioritization.prioritizedScenarios,
    highPriorityScenarios: scenarioPrioritization.highPriorityScenarios,
    mustHaveScenarios: scenarioPrioritization.mustHaveScenarios,
    stakeholders,
    outputDir
  });

  artifacts.push(...scenarioRefinement.artifacts);

  // ============================================================================
  // PHASE 7: ARCHITECTURE IMPLICATIONS MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 7: Mapping quality attributes to architecture implications');
  const architectureMapping = await ctx.task(architectureMappingTask, {
    systemName,
    qualityAttributes: qualityAttributesBrainstorm.qualityAttributes,
    refinedScenarios: scenarioRefinement.refinedScenarios,
    prioritizedScenarios: scenarioPrioritization.prioritizedScenarios,
    businessContext,
    constraints,
    outputDir
  });

  artifacts.push(...architectureMapping.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY REQUIREMENTS DOCUMENT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive quality requirements document');
  const requirementsDocumentGeneration = await ctx.task(requirementsDocumentGenerationTask, {
    systemName,
    businessContext,
    stakeholders,
    constraints,
    qualityAttributes: qualityAttributesBrainstorm.qualityAttributes,
    scenarios: scenarioDefinition.scenarios,
    prioritizedScenarios: scenarioPrioritization.prioritizedScenarios,
    refinedScenarios: scenarioRefinement.refinedScenarios,
    tradeoffs: scenarioPrioritization.tradeoffs,
    architectureImplications: architectureMapping.architectureImplications,
    outputDir
  });

  artifacts.push(...requirementsDocumentGeneration.artifacts);

  // ============================================================================
  // PHASE 9: VALIDATION APPROACH DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 9: Defining validation and measurement approach');
  const validationApproach = await ctx.task(validationApproachDefinitionTask, {
    systemName,
    refinedScenarios: scenarioRefinement.refinedScenarios,
    architectureImplications: architectureMapping.architectureImplications,
    constraints,
    outputDir
  });

  artifacts.push(...validationApproach.artifacts);

  // ============================================================================
  // PHASE 10: WORKSHOP QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing workshop quality and completeness');
  const workshopQualityAssessment = await ctx.task(workshopQualityAssessmentTask, {
    systemName,
    workshopPreparation,
    qualityAttributesBrainstorm,
    scenarioDefinition,
    scenarioPrioritization,
    scenarioRefinement,
    architectureMapping,
    requirementsDocumentGeneration,
    validationApproach,
    outputDir
  });

  artifacts.push(...workshopQualityAssessment.artifacts);

  const workshopScore = workshopQualityAssessment.overallScore;
  const qualityMet = workshopScore >= 85;

  // Breakpoint: Review workshop outcomes
  await ctx.breakpoint({
    question: `Quality Attributes Workshop complete. Quality score: ${workshopScore}/100. ${qualityMet ? 'Workshop outcomes meet quality standards!' : 'Workshop may need additional refinement.'} Review final outputs and approve?`,
    title: 'Workshop Outcomes Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        workshopScore,
        qualityMet,
        systemName,
        totalArtifacts: artifacts.length,
        qualityAttributesIdentified: qualityAttributesBrainstorm.qualityAttributes.length,
        totalScenarios: scenarioDefinition.scenarios.length,
        highPriorityScenarios: scenarioPrioritization.highPriorityScenarios?.length || 0,
        architecturalPatterns: architectureMapping.architecturalPatterns?.length || 0,
        tradeoffsIdentified: scenarioPrioritization.tradeoffs?.length || 0,
        validationApproachesDefined: validationApproach.validationApproaches?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    workshopScore,
    qualityMet,
    qualityAttributes: qualityAttributesBrainstorm.qualityAttributes,
    qualityAttributesCount: qualityAttributesBrainstorm.qualityAttributes.length,
    scenarios: scenarioDefinition.scenarios,
    totalScenarios: scenarioDefinition.scenarios.length,
    prioritizedScenarios: scenarioPrioritization.prioritizedScenarios,
    highPriorityScenarios: scenarioPrioritization.highPriorityScenarios,
    mustHaveScenarios: scenarioPrioritization.mustHaveScenarios,
    refinedScenarios: scenarioRefinement.refinedScenarios,
    tradeoffs: scenarioPrioritization.tradeoffs,
    architectureImplications: architectureMapping.architectureImplications,
    architecturalPatterns: architectureMapping.architecturalPatterns,
    validationApproaches: validationApproach.validationApproaches,
    requirementsDocument: requirementsDocumentGeneration.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'software-architecture/quality-attributes-workshop',
      timestamp: startTime,
      systemName,
      outputDir,
      qualityFramework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Workshop Preparation
export const workshopPreparationTask = defineTask('workshop-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for quality attributes workshop',
  agent: {
    name: 'workshop-facilitator',
    prompt: {
      role: 'senior software architect and workshop facilitator',
      task: 'Prepare comprehensive quality attributes workshop including stakeholder identification, agenda creation, and quality framework reference materials',
      context: args,
      instructions: [
        'Identify key stakeholders: business owners, technical leads, operations, security, UX',
        'Create workshop agenda (2-4 hours) with clear objectives and timeline',
        'Prepare quality attributes framework reference based on ISO 25010 or FURPS+',
        'ISO 25010 categories: Performance, Compatibility, Usability, Reliability, Security, Maintainability, Portability',
        'FURPS+ categories: Functionality, Usability, Reliability, Performance, Supportability + Design/Implementation/Interface/Physical constraints',
        'Gather business context: system purpose, target users, business drivers, success metrics',
        'Prepare workshop materials: templates, examples, scenario formats',
        'Create stakeholder briefing document explaining workshop purpose and expected outcomes',
        'Define workshop ground rules and facilitation approach',
        'Set up collaboration tools (virtual whiteboard, voting mechanism)',
        'Generate workshop preparation package'
      ],
      outputFormat: 'JSON with agenda, stakeholderList, qualityFrameworkReference, workshopMaterials, groundRules, collaborationSetup, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'stakeholderList', 'qualityFrameworkReference', 'artifacts'],
      properties: {
        agenda: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        stakeholderList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              perspective: { type: 'string' },
              criticalInput: { type: 'string' }
            }
          }
        },
        qualityFrameworkReference: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  description: { type: 'string' },
                  examples: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        workshopMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              material: { type: 'string' },
              purpose: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        groundRules: { type: 'array', items: { type: 'string' } },
        collaborationSetup: {
          type: 'object',
          properties: {
            tools: { type: 'array', items: { type: 'string' } },
            approach: { type: 'string' }
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
  labels: ['agent', 'quality-attributes', 'workshop-preparation']
}));

// Task 2: System Context Presentation
export const systemContextPresentationTask = defineTask('system-context-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish system context and scope',
  agent: {
    name: 'context-presenter',
    prompt: {
      role: 'senior software architect and technical communicator',
      task: 'Create comprehensive system context presentation covering purpose, scope, business drivers, use cases, and constraints',
      context: args,
      instructions: [
        'Describe system purpose and scope clearly and concisely',
        'Explain business drivers: why this system exists, what problems it solves',
        'Identify target users and personas',
        'Outline key use cases and user journeys',
        'Present known constraints: budget, timeline, technology mandates, regulatory requirements',
        'Explain integration points with external systems',
        'Present high-level architecture vision (if available)',
        'Define success metrics and business outcomes',
        'Identify critical business events or workflows',
        'Create visual context diagram (system boundaries, users, external systems)',
        'Prepare concise presentation materials (10-15 minutes presentation)',
        'Generate system context document and presentation'
      ],
      outputFormat: 'JSON with systemPurpose, businessDrivers, targetUsers, keyUseCases, constraints, integrationPoints, successMetrics, contextDiagram, presentationMaterials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['systemPurpose', 'businessDrivers', 'keyUseCases', 'constraints', 'artifacts'],
      properties: {
        systemPurpose: { type: 'string' },
        businessDrivers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              driver: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' }
            }
          }
        },
        targetUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              persona: { type: 'string' },
              role: { type: 'string' },
              needs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyUseCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              useCase: { type: 'string' },
              priority: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            budget: { type: 'string' },
            timeline: { type: 'string' },
            technology: { type: 'array', items: { type: 'string' } },
            regulatory: { type: 'array', items: { type: 'string' } },
            other: { type: 'array', items: { type: 'string' } }
          }
        },
        integrationPoints: { type: 'array', items: { type: 'string' } },
        successMetrics: { type: 'array', items: { type: 'string' } },
        contextDiagram: { type: 'string' },
        presentationMaterials: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-attributes', 'system-context']
}));

// Task 3: Quality Attributes Brainstorming
export const qualityAttributesBrainstormTask = defineTask('quality-attributes-brainstorm', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Brainstorm quality attributes with stakeholders',
  agent: {
    name: 'brainstorm-facilitator',
    prompt: {
      role: 'workshop facilitator and quality attributes expert',
      task: 'Facilitate quality attributes brainstorming session, collecting stakeholder concerns and categorizing them into quality attribute categories',
      context: args,
      instructions: [
        'Introduce quality attributes framework (ISO 25010, FURPS+, etc.)',
        'Explain each quality attribute category with examples',
        'Performance efficiency: response time, throughput, resource utilization',
        'Scalability: horizontal/vertical scaling, load handling',
        'Reliability: availability, fault tolerance, recoverability',
        'Security: authentication, authorization, data protection, privacy',
        'Usability: learnability, efficiency, error prevention, accessibility',
        'Maintainability: modularity, testability, analyzability, modifiability',
        'Portability: installability, adaptability, replaceability',
        'Compatibility: co-existence, interoperability',
        'Facilitate brainstorming: collect quality concerns from all stakeholders',
        'Use round-robin or silent brainstorming to ensure all voices heard',
        'Group similar concerns together',
        'Categorize concerns into quality attribute categories',
        'Identify gaps: quality attributes not mentioned but potentially important',
        'Document stakeholder rationale for each concern',
        'Generate initial quality attributes list with stakeholder input'
      ],
      outputFormat: 'JSON with qualityAttributes (array with category, concerns, stakeholderRationale), gaps, brainstormNotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityAttributes', 'artifacts'],
      properties: {
        qualityAttributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              attribute: { type: 'string' },
              concerns: { type: 'array', items: { type: 'string' } },
              stakeholderRationale: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attribute: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        brainstormNotes: { type: 'string' },
        participationSummary: {
          type: 'object',
          properties: {
            totalParticipants: { type: 'number' },
            inputsByRole: { type: 'object' }
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
  labels: ['agent', 'quality-attributes', 'brainstorming']
}));

// Task 4: Scenario Definition
export const scenarioDefinitionTask = defineTask('scenario-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define quality attribute scenarios with measurable criteria',
  agent: {
    name: 'scenario-architect',
    prompt: {
      role: 'software architect and quality scenarios specialist',
      task: 'Create concrete, measurable quality attribute scenarios using the scenario template: Stimulus, Source, Environment, Artifact, Response, Response Measure',
      context: args,
      instructions: [
        'For each quality attribute, create 1-3 concrete scenarios',
        'Use standard scenario structure:',
        '  - Stimulus: Event or condition triggering the scenario',
        '  - Source: Actor or system generating the stimulus',
        '  - Environment: System state when stimulus occurs (normal operation, overload, failure, etc.)',
        '  - Artifact: Component or system affected',
        '  - Response: Expected system behavior',
        '  - Response Measure: Quantifiable success criteria',
        'Example Performance Scenario: "Under peak load (stimulus) from 10,000 concurrent users (source) during normal operation (environment), the web application (artifact) responds to search requests (response) in less than 200ms for 95% of requests (response measure)"',
        'Example Security Scenario: "When unauthorized access is attempted (stimulus) by external attacker (source) at any time (environment), the authentication system (artifact) blocks access and logs the attempt (response) with 100% detection rate and <1s response time (response measure)"',
        'Example Usability Scenario: "When a new user (source) attempts to complete a purchase (stimulus) for the first time (environment), the checkout flow (artifact) guides them successfully (response) with <5 steps and <3 minutes completion time for 90% of users (response measure)"',
        'Make response measures SMART: Specific, Measurable, Achievable, Relevant, Time-bound',
        'Ensure scenarios are testable and verifiable',
        'Cover both positive scenarios (desired behavior) and negative scenarios (error handling)',
        'Document assumptions for each scenario',
        'Generate comprehensive scenario catalog'
      ],
      outputFormat: 'JSON with scenarios (array with stimulus, source, environment, artifact, response, responseMeasure, qualityAttribute, testable, assumptions), scenarioCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'scenarioCount', 'artifacts'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              qualityAttribute: { type: 'string' },
              category: { type: 'string' },
              stimulus: { type: 'string' },
              source: { type: 'string' },
              environment: { type: 'string' },
              artifact: { type: 'string' },
              response: { type: 'string' },
              responseMeasure: { type: 'string' },
              testable: { type: 'boolean' },
              assumptions: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        scenarioCount: { type: 'number' },
        scenariosByCategory: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        testabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-attributes', 'scenario-definition']
}));

// Task 5: Scenario Prioritization
export const scenarioPrioritizationTask = defineTask('scenario-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize scenarios and identify trade-offs',
  agent: {
    name: 'prioritization-facilitator',
    prompt: {
      role: 'workshop facilitator and prioritization expert',
      task: 'Facilitate scenario prioritization using MoSCoW method, identify conflicting quality attributes, and document trade-offs',
      context: args,
      instructions: [
        'Use MoSCoW prioritization method:',
        '  - Must Have: Critical to system success, non-negotiable',
        '  - Should Have: Important but not critical, high value',
        '  - Could Have: Desirable but lower priority, nice to have',
        '  - Won\'t Have (this time): Explicitly deferred or out of scope',
        'Facilitate stakeholder voting on scenario importance',
        'Consider business value, risk, regulatory requirements, user impact',
        'Identify high-priority scenarios (Must Have + Should Have)',
        'Identify critical scenarios requiring immediate attention',
        'Identify conflicting quality attributes (trade-offs):',
        '  - Performance vs. Security (e.g., encryption overhead)',
        '  - Consistency vs. Availability (CAP theorem)',
        '  - Flexibility vs. Performance (abstraction overhead)',
        '  - Security vs. Usability (authentication friction)',
        '  - Cost vs. Reliability (redundancy expenses)',
        'Document trade-off decisions and rationale',
        'Assess feasibility of scenarios given constraints',
        'Create prioritized scenario list',
        'Generate prioritization report with stakeholder consensus'
      ],
      outputFormat: 'JSON with prioritizedScenarios (array with moscowCategory, priority, businessValue), highPriorityScenarios, mustHaveScenarios, tradeoffs (array with conflictingAttributes, tradeoffDescription, decision, rationale), feasibilityAssessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedScenarios', 'highPriorityScenarios', 'mustHaveScenarios', 'tradeoffs', 'artifacts'],
      properties: {
        prioritizedScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              scenario: { type: 'string' },
              qualityAttribute: { type: 'string' },
              moscowCategory: { type: 'string', enum: ['Must Have', 'Should Have', 'Could Have', 'Won\'t Have'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              businessValue: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              stakeholderConsensus: { type: 'boolean' },
              votes: { type: 'number' }
            }
          }
        },
        highPriorityScenarios: { type: 'array' },
        mustHaveScenarios: { type: 'array' },
        tradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conflictingAttributes: { type: 'array', items: { type: 'string' } },
              tradeoffDescription: { type: 'string' },
              scenarios: { type: 'array', items: { type: 'string' } },
              decision: { type: 'string' },
              rationale: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        feasibilityAssessment: {
          type: 'object',
          properties: {
            feasibleScenarios: { type: 'number' },
            challengingScenarios: { type: 'number' },
            infeasibleScenarios: { type: 'number' },
            constraintViolations: { type: 'array', items: { type: 'string' } }
          }
        },
        consensusScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-attributes', 'prioritization']
}));

// Task 6: Scenario Refinement
export const scenarioRefinementTask = defineTask('scenario-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine and detail high-priority scenarios',
  agent: {
    name: 'scenario-refiner',
    prompt: {
      role: 'software architect and requirements specialist',
      task: 'Refine high-priority scenarios with detailed acceptance criteria, measurement approach, dependencies, and implementation considerations',
      context: args,
      instructions: [
        'Focus on high-priority and must-have scenarios',
        'Expand response measures with detailed acceptance criteria',
        'Define measurement approach: how will this be verified?',
        '  - Performance: Load testing, APM tools, benchmarks',
        '  - Security: Penetration testing, security audits, compliance checks',
        '  - Usability: User testing, A/B testing, analytics',
        '  - Reliability: Chaos engineering, failure injection, monitoring',
        '  - Maintainability: Code reviews, static analysis, complexity metrics',
        'Identify dependencies between scenarios',
        'Document assumptions and prerequisites',
        'Add implementation notes and architectural considerations',
        'Define test strategy for each scenario',
        'Estimate effort and complexity for implementation',
        'Identify potential risks and challenges',
        'Create detailed scenario specifications ready for architecture design',
        'Generate refined scenario document'
      ],
      outputFormat: 'JSON with refinedScenarios (array with scenarioId, detailedAcceptanceCriteria, measurementApproach, testStrategy, dependencies, implementationNotes, effort, risks), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedScenarios', 'artifacts'],
      properties: {
        refinedScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              qualityAttribute: { type: 'string' },
              originalScenario: { type: 'string' },
              detailedAcceptanceCriteria: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    criterion: { type: 'string' },
                    threshold: { type: 'string' },
                    measurement: { type: 'string' }
                  }
                }
              },
              measurementApproach: {
                type: 'object',
                properties: {
                  method: { type: 'string' },
                  tools: { type: 'array', items: { type: 'string' } },
                  frequency: { type: 'string' }
                }
              },
              testStrategy: {
                type: 'object',
                properties: {
                  testType: { type: 'string' },
                  testApproach: { type: 'string' },
                  automatable: { type: 'boolean' }
                }
              },
              dependencies: { type: 'array', items: { type: 'string' } },
              implementationNotes: { type: 'string' },
              architecturalConsiderations: { type: 'array', items: { type: 'string' } },
              effort: { type: 'string', enum: ['low', 'medium', 'high', 'very high'] },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        refinementSummary: {
          type: 'object',
          properties: {
            totalRefined: { type: 'number' },
            highEffortScenarios: { type: 'number' },
            highRiskScenarios: { type: 'number' },
            automatable: { type: 'number' }
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
  labels: ['agent', 'quality-attributes', 'scenario-refinement']
}));

// Task 7: Architecture Implications Mapping
export const architectureMappingTask = defineTask('architecture-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map quality attributes to architecture implications',
  agent: {
    name: 'architecture-strategist',
    prompt: {
      role: 'principal software architect',
      task: 'Map quality attributes to architectural patterns, tactics, and design decisions that support or enable each quality attribute',
      context: args,
      instructions: [
        'For each quality attribute, identify relevant architectural patterns and tactics:',
        'Performance: Caching (Redis, CDN), Load balancing, Async processing, Database optimization, CDN',
        'Scalability: Microservices, Horizontal scaling, Stateless design, Message queues, Sharding',
        'Reliability: Redundancy, Health checks, Circuit breakers, Retry mechanisms, Chaos engineering',
        'Security: Authentication (OAuth, JWT), Authorization (RBAC), Encryption (TLS, at-rest), WAF, Security headers',
        'Usability: Responsive design, Progressive enhancement, Error handling, Feedback mechanisms',
        'Maintainability: Modular design, Clean architecture, Dependency injection, SOLID principles, Documentation',
        'Portability: Containerization (Docker), Cloud-agnostic design, Configuration externalization',
        'Compatibility: API versioning, Backward compatibility, Standards compliance',
        'Map scenarios to specific architectural tactics',
        'Identify architectural views needed (4+1 views, C4 model)',
        'Document design decisions required for each quality attribute',
        'Identify technology choices aligned with quality attributes',
        'Create architecture implications matrix',
        'Document trade-offs in architectural decisions',
        'Generate architecture strategy document'
      ],
      outputFormat: 'JSON with architectureImplications (object mapping QA to patterns/tactics), architecturalPatterns (array), designDecisions (array), technologyChoices (array), architecturalViews (array), tradeoffAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architectureImplications', 'architecturalPatterns', 'designDecisions', 'artifacts'],
      properties: {
        architectureImplications: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              qualityAttribute: { type: 'string' },
              patterns: { type: 'array', items: { type: 'string' } },
              tactics: { type: 'array', items: { type: 'string' } },
              technologies: { type: 'array', items: { type: 'string' } },
              designPrinciples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        architecturalPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              supportedQualityAttributes: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
              applicability: { type: 'string' }
            }
          }
        },
        designDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              qualityAttribute: { type: 'string' },
              rationale: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } },
              tradeoffs: { type: 'string' }
            }
          }
        },
        technologyChoices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technology: { type: 'string' },
              purpose: { type: 'string' },
              qualityAttributes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        architecturalViews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              view: { type: 'string' },
              purpose: { type: 'string' },
              stakeholders: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        tradeoffAnalysis: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-attributes', 'architecture-mapping']
}));

// Task 8: Requirements Document Generation
export const requirementsDocumentGenerationTask = defineTask('requirements-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive quality requirements document',
  agent: {
    name: 'requirements-writer',
    prompt: {
      role: 'senior technical writer and software architect',
      task: 'Generate comprehensive, stakeholder-ready quality requirements document consolidating workshop outcomes',
      context: args,
      instructions: [
        'Create executive summary highlighting key quality attributes and priorities',
        'Include workshop overview: participants, agenda, outcomes',
        'Document system context: purpose, scope, business drivers, constraints',
        'Present complete quality attributes catalog organized by category',
        'Detail all quality attribute scenarios with full structure (stimulus, source, etc.)',
        'Present prioritization results with MoSCoW categories and rationale',
        'Include refined scenarios with acceptance criteria and measurement approach',
        'Document identified trade-offs with decisions and rationale',
        'Present architecture implications: patterns, tactics, design decisions',
        'Include validation approach for each high-priority scenario',
        'Add appendices: quality frameworks reference, stakeholder matrix, glossary',
        'Format as professional Markdown document with clear structure',
        'Ensure document is actionable for architecture design phase',
        'Include visual diagrams where helpful (quality attribute tree, trade-off matrix)',
        'Save requirements document to output directory'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, keyQualityAttributes (array), criticalScenarios (array), majorTradeoffs (array), nextSteps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'keyQualityAttributes', 'nextSteps', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyQualityAttributes: { type: 'array', items: { type: 'string' } },
        criticalScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              qualityAttribute: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        majorTradeoffs: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        documentStructure: {
          type: 'object',
          properties: {
            sections: { type: 'array', items: { type: 'string' } },
            pageCount: { type: 'number' }
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
  labels: ['agent', 'quality-attributes', 'documentation']
}));

// Task 9: Validation Approach Definition
export const validationApproachDefinitionTask = defineTask('validation-approach-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define validation and measurement approach',
  agent: {
    name: 'validation-architect',
    prompt: {
      role: 'quality assurance architect and testing strategist',
      task: 'Define comprehensive validation approach for quality attribute scenarios including testing strategies, tools, metrics, and acceptance criteria',
      context: args,
      instructions: [
        'For each refined scenario, define validation approach:',
        'Performance validation: Load testing (k6, JMeter), APM tools (New Relic, Datadog), benchmarking',
        'Security validation: Penetration testing, SAST/DAST tools, security audits, compliance scans',
        'Usability validation: User testing, A/B testing, heuristic evaluation, accessibility audits',
        'Reliability validation: Chaos engineering (Chaos Monkey), failure injection, synthetic monitoring',
        'Maintainability validation: Code quality tools (SonarQube), complexity metrics, review checklists',
        'Scalability validation: Load testing with increasing load, stress testing, capacity planning',
        'Define metrics and KPIs for each quality attribute',
        'Specify measurement frequency (continuous, periodic, on-demand)',
        'Identify validation tools and frameworks',
        'Plan for baseline measurements and ongoing monitoring',
        'Define quality gates and acceptance thresholds',
        'Create validation roadmap with phases',
        'Document validation responsibilities',
        'Generate validation strategy document'
      ],
      outputFormat: 'JSON with validationApproaches (array with scenario, testingStrategy, tools, metrics, frequency, acceptanceThreshold), validationRoadmap, qualityGates, monitoringPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationApproaches', 'qualityGates', 'artifacts'],
      properties: {
        validationApproaches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              qualityAttribute: { type: 'string' },
              testingStrategy: {
                type: 'object',
                properties: {
                  approach: { type: 'string' },
                  testType: { type: 'string' },
                  automatable: { type: 'boolean' }
                }
              },
              tools: { type: 'array', items: { type: 'string' } },
              metrics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    metric: { type: 'string' },
                    unit: { type: 'string' },
                    target: { type: 'string' }
                  }
                }
              },
              frequency: { type: 'string' },
              acceptanceThreshold: { type: 'string' },
              baselineMeasurement: { type: 'boolean' }
            }
          }
        },
        validationRoadmap: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  activities: { type: 'array', items: { type: 'string' } },
                  timeline: { type: 'string' }
                }
              }
            }
          }
        },
        qualityGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              threshold: { type: 'string' },
              enforcement: { type: 'string' }
            }
          }
        },
        monitoringPlan: {
          type: 'object',
          properties: {
            continuousMetrics: { type: 'array', items: { type: 'string' } },
            dashboards: { type: 'array', items: { type: 'string' } },
            alerts: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'quality-attributes', 'validation']
}));

// Task 10: Workshop Quality Assessment
export const workshopQualityAssessmentTask = defineTask('workshop-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess workshop quality and completeness',
  agent: {
    name: 'workshop-evaluator',
    prompt: {
      role: 'principal architect and workshop quality auditor',
      task: 'Assess overall workshop quality, completeness, and readiness for architecture design phase',
      context: args,
      instructions: [
        'Evaluate workshop preparation thoroughness (weight: 10%)',
        'Assess stakeholder participation and engagement (weight: 10%)',
        'Review quality attributes coverage and completeness (weight: 20%)',
        'Assess scenario quality: clarity, measurability, testability (weight: 20%)',
        'Evaluate prioritization consensus and rationale (weight: 15%)',
        'Review architecture implications depth and actionability (weight: 15%)',
        'Assess validation approach feasibility and completeness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps in quality attribute coverage',
        'Check for missing critical quality attributes (performance, security, usability)',
        'Validate scenario measurability and testability',
        'Assess stakeholder alignment and consensus',
        'Identify risks and challenges for implementation',
        'Provide specific recommendations for improvement',
        'Assess readiness for architecture design phase'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), recommendations (array), readinessLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            preparation: { type: 'number' },
            participation: { type: 'number' },
            qualityAttributeCoverage: { type: 'number' },
            scenarioQuality: { type: 'number' },
            prioritization: { type: 'number' },
            architectureImplications: { type: 'number' },
            validationApproach: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            allCriticalQAsIdentified: { type: 'boolean' },
            scenariosAreMeasurable: { type: 'boolean' },
            prioritizationHasConsensus: { type: 'boolean' },
            architectureGuidanceProvided: { type: 'boolean' },
            validationApproachDefined: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['ready', 'minor-refinement', 'major-refinement'] },
        strengths: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-attributes', 'validation', 'quality-scoring']
}));

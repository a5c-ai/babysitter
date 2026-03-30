/**
 * @process specializations/domains/business/operations/root-cause-analysis
 * @description Root Cause Analysis Process - Apply systematic problem-solving using 5 Whys, fishbone diagrams,
 * fault tree analysis, and hypothesis testing to identify true root causes of problems.
 * @inputs { problemDescription: string, severity?: string, impactArea?: string, dataAvailable?: boolean }
 * @outputs { success: boolean, rootCauses: array, verifiedRootCauses: array, correctiveActions: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/root-cause-analysis', {
 *   problemDescription: 'Increased defect rate in final assembly by 50%',
 *   severity: 'high',
 *   impactArea: 'Assembly Line 1',
 *   dataAvailable: true
 * });
 *
 * @references
 * - Andersen, B. & Fagerhaug, T. (2006). Root Cause Analysis
 * - Ishikawa, K. (1990). Introduction to Quality Control
 * - Taiichi Ohno - 5 Whys methodology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemDescription,
    severity = 'medium',
    impactArea = '',
    dataAvailable = false,
    teamMembers = [],
    deadline = null,
    outputDir = 'rca-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Root Cause Analysis for: ${problemDescription}`);

  // Phase 1: Problem Definition
  ctx.log('info', 'Phase 1: Problem Definition');
  const problemDefinition = await ctx.task(problemDefinitionTask, {
    problemDescription,
    severity,
    impactArea,
    teamMembers,
    outputDir
  });

  artifacts.push(...problemDefinition.artifacts);

  // Quality Gate: Problem Statement Review
  await ctx.breakpoint({
    question: `Problem defined: "${problemDefinition.problemStatement}". Impact: ${problemDefinition.impact}. Is problem statement clear and specific? Proceed with data collection?`,
    title: 'Problem Definition Review',
    context: {
      runId: ctx.runId,
      problemStatement: problemDefinition.problemStatement,
      impact: problemDefinition.impact,
      scope: problemDefinition.scope,
      files: problemDefinition.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Data Collection
  ctx.log('info', 'Phase 2: Data Collection and Fact Gathering');
  const dataCollection = await ctx.task(dataCollectionTask, {
    problemDefinition,
    dataAvailable,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Phase 3: Cause Brainstorming (Fishbone/Ishikawa)
  ctx.log('info', 'Phase 3: Cause Brainstorming - Fishbone Diagram');
  const fishboneAnalysis = await ctx.task(fishboneAnalysisTask, {
    problemDefinition,
    dataCollection,
    outputDir
  });

  artifacts.push(...fishboneAnalysis.artifacts);

  // Phase 4: 5 Whys Analysis
  ctx.log('info', 'Phase 4: 5 Whys Deep Dive Analysis');
  const fiveWhysAnalysis = await ctx.task(fiveWhysAnalysisTask, {
    problemDefinition,
    fishboneAnalysis,
    outputDir
  });

  artifacts.push(...fiveWhysAnalysis.artifacts);

  // Quality Gate: Initial Causes Review
  await ctx.breakpoint({
    question: `Initial analysis complete. ${fishboneAnalysis.totalCauses} potential causes identified. ${fiveWhysAnalysis.rootCauses.length} root causes from 5 Whys. Proceed with verification?`,
    title: 'Initial Cause Analysis Review',
    context: {
      runId: ctx.runId,
      fishboneCauses: fishboneAnalysis.causesByCategory,
      fiveWhysRootCauses: fiveWhysAnalysis.rootCauses,
      files: [...fishboneAnalysis.artifacts, ...fiveWhysAnalysis.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 5: Fault Tree Analysis (for complex problems)
  let faultTreeAnalysis = null;
  if (severity === 'high' || severity === 'critical') {
    ctx.log('info', 'Phase 5: Fault Tree Analysis');
    faultTreeAnalysis = await ctx.task(faultTreeAnalysisTask, {
      problemDefinition,
      fiveWhysAnalysis,
      outputDir
    });

    artifacts.push(...faultTreeAnalysis.artifacts);
  }

  // Phase 6: Cause Prioritization
  ctx.log('info', 'Phase 6: Cause Prioritization');
  const causePrioritization = await ctx.task(causePrioritizationTask, {
    fishboneAnalysis,
    fiveWhysAnalysis,
    faultTreeAnalysis,
    dataCollection,
    outputDir
  });

  artifacts.push(...causePrioritization.artifacts);

  // Phase 7: Root Cause Verification
  ctx.log('info', 'Phase 7: Root Cause Verification');
  const causeVerification = await ctx.task(causeVerificationTask, {
    causePrioritization,
    dataCollection,
    outputDir
  });

  artifacts.push(...causeVerification.artifacts);

  // Quality Gate: Verified Root Causes
  await ctx.breakpoint({
    question: `Verification complete. ${causeVerification.verifiedCauses.length}/${causePrioritization.prioritizedCauses.length} causes verified. Primary root cause: "${causeVerification.primaryRootCause}". Confidence: ${causeVerification.confidence}%. Proceed with corrective actions?`,
    title: 'Root Cause Verification Review',
    context: {
      runId: ctx.runId,
      verifiedCauses: causeVerification.verifiedCauses,
      primaryRootCause: causeVerification.primaryRootCause,
      confidence: causeVerification.confidence,
      files: causeVerification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 8: Corrective Action Development
  ctx.log('info', 'Phase 8: Corrective Action Development');
  const correctiveActions = await ctx.task(correctiveActionsTask, {
    causeVerification,
    problemDefinition,
    outputDir
  });

  artifacts.push(...correctiveActions.artifacts);

  // Phase 9: Preventive Actions
  ctx.log('info', 'Phase 9: Preventive Action Development');
  const preventiveActions = await ctx.task(preventiveActionsTask, {
    causeVerification,
    correctiveActions,
    outputDir
  });

  artifacts.push(...preventiveActions.artifacts);

  // Phase 10: Report Generation
  ctx.log('info', 'Phase 10: RCA Report Generation');
  const report = await ctx.task(rcaReportTask, {
    problemDefinition,
    dataCollection,
    fishboneAnalysis,
    fiveWhysAnalysis,
    faultTreeAnalysis,
    causePrioritization,
    causeVerification,
    correctiveActions,
    preventiveActions,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    problemStatement: problemDefinition.problemStatement,
    rootCauses: fiveWhysAnalysis.rootCauses,
    verifiedRootCauses: causeVerification.verifiedCauses,
    primaryRootCause: causeVerification.primaryRootCause,
    confidence: causeVerification.confidence,
    fishboneCategories: fishboneAnalysis.causesByCategory,
    correctiveActions: correctiveActions.actions,
    preventiveActions: preventiveActions.actions,
    faultTree: faultTreeAnalysis?.faultTree || null,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/root-cause-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Problem Definition
export const problemDefinitionTask = defineTask('rca-problem-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Problem Definition',
  agent: {
    name: 'problem-analyst',
    prompt: {
      role: 'Problem Solving Facilitator',
      task: 'Define the problem clearly and specifically',
      context: args,
      instructions: [
        '1. Write clear problem statement (What, Where, When, Extent)',
        '2. Quantify the problem impact',
        '3. Define problem boundaries/scope',
        '4. Identify when problem first occurred',
        '5. Document IS/IS NOT analysis',
        '6. Identify affected stakeholders',
        '7. Gather timeline of events',
        '8. Document any containment actions taken',
        '9. Set investigation timeline/deadline',
        '10. Assign investigation team roles'
      ],
      outputFormat: 'JSON with problem definition'
    },
    outputSchema: {
      type: 'object',
      required: ['problemStatement', 'impact', 'scope', 'artifacts'],
      properties: {
        problemStatement: { type: 'string' },
        impact: { type: 'object' },
        scope: { type: 'object' },
        isIsNotAnalysis: { type: 'object' },
        timeline: { type: 'array', items: { type: 'object' } },
        stakeholders: { type: 'array', items: { type: 'string' } },
        containmentActions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'problem-definition']
}));

// Task 2: Data Collection
export const dataCollectionTask = defineTask('rca-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Data Collection',
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'RCA Investigator',
      task: 'Collect facts and data related to the problem',
      context: args,
      instructions: [
        '1. Gather quantitative data (metrics, measurements)',
        '2. Collect qualitative data (observations, interviews)',
        '3. Review process documentation',
        '4. Examine maintenance records',
        '5. Review change history',
        '6. Collect environmental data',
        '7. Interview involved personnel (Genchi Genbutsu)',
        '8. Photograph/document physical evidence',
        '9. Review similar past incidents',
        '10. Organize and summarize findings'
      ],
      outputFormat: 'JSON with collected data'
    },
    outputSchema: {
      type: 'object',
      required: ['quantitativeData', 'qualitativeData', 'findings', 'artifacts'],
      properties: {
        quantitativeData: { type: 'object' },
        qualitativeData: { type: 'object' },
        changeHistory: { type: 'array', items: { type: 'object' } },
        interviews: { type: 'array', items: { type: 'object' } },
        physicalEvidence: { type: 'array', items: { type: 'object' } },
        pastIncidents: { type: 'array', items: { type: 'object' } },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'data-collection']
}));

// Task 3: Fishbone Analysis
export const fishboneAnalysisTask = defineTask('rca-fishbone', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Fishbone/Ishikawa Analysis',
  agent: {
    name: 'fishbone-facilitator',
    prompt: {
      role: 'Fishbone Analysis Facilitator',
      task: 'Conduct fishbone (Ishikawa) diagram analysis',
      context: args,
      instructions: [
        '1. Use 6M categories (Man, Machine, Method, Material, Measurement, Environment)',
        '2. Brainstorm causes for each category',
        '3. Add sub-causes (bones)',
        '4. Consider interactions between categories',
        '5. Review data to validate potential causes',
        '6. Identify likely primary causes',
        '7. Note areas needing more investigation',
        '8. Count causes per category',
        '9. Create visual fishbone diagram',
        '10. Document all potential causes'
      ],
      outputFormat: 'JSON with fishbone analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['causesByCategory', 'totalCauses', 'likelyCauses', 'artifacts'],
      properties: {
        causesByCategory: {
          type: 'object',
          properties: {
            man: { type: 'array', items: { type: 'object' } },
            machine: { type: 'array', items: { type: 'object' } },
            method: { type: 'array', items: { type: 'object' } },
            material: { type: 'array', items: { type: 'object' } },
            measurement: { type: 'array', items: { type: 'object' } },
            environment: { type: 'array', items: { type: 'object' } }
          }
        },
        totalCauses: { type: 'number' },
        likelyCauses: { type: 'array', items: { type: 'object' } },
        fishboneDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'fishbone', 'ishikawa']
}));

// Task 4: 5 Whys Analysis
export const fiveWhysAnalysisTask = defineTask('rca-five-whys', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA 5 Whys Analysis',
  agent: {
    name: 'five-whys-facilitator',
    prompt: {
      role: '5 Whys Analysis Facilitator',
      task: 'Conduct 5 Whys deep dive for likely causes',
      context: args,
      instructions: [
        '1. Start with each likely cause from fishbone',
        '2. Ask "Why?" and document answer',
        '3. Continue asking "Why?" (typically 5 times)',
        '4. Stop when you reach actionable root cause',
        '5. Verify each answer with data if available',
        '6. Document multiple paths if causes branch',
        '7. Identify true root causes (not symptoms)',
        '8. Note any assumptions made',
        '9. Validate logic chain',
        '10. Document all 5 Whys chains'
      ],
      outputFormat: 'JSON with 5 Whys analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['whyChains', 'rootCauses', 'artifacts'],
      properties: {
        whyChains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startingCause: { type: 'string' },
              whys: { type: 'array', items: { type: 'object' } },
              rootCause: { type: 'string' }
            }
          }
        },
        rootCauses: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'five-whys']
}));

// Task 5: Fault Tree Analysis
export const faultTreeAnalysisTask = defineTask('rca-fault-tree', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Fault Tree Analysis',
  agent: {
    name: 'fault-tree-analyst',
    prompt: {
      role: 'Fault Tree Analysis Specialist',
      task: 'Conduct fault tree analysis for complex problems',
      context: args,
      instructions: [
        '1. Define top event (undesired outcome)',
        '2. Identify intermediate events',
        '3. Use AND/OR gates to show relationships',
        '4. Break down to basic events (root causes)',
        '5. Calculate probability if data available',
        '6. Identify critical paths',
        '7. Find minimal cut sets',
        '8. Prioritize based on probability/impact',
        '9. Create visual fault tree diagram',
        '10. Document analysis results'
      ],
      outputFormat: 'JSON with fault tree analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['faultTree', 'basicEvents', 'criticalPaths', 'artifacts'],
      properties: {
        faultTree: { type: 'object' },
        topEvent: { type: 'string' },
        intermediateEvents: { type: 'array', items: { type: 'object' } },
        basicEvents: { type: 'array', items: { type: 'object' } },
        criticalPaths: { type: 'array', items: { type: 'array' } },
        minimalCutSets: { type: 'array', items: { type: 'array' } },
        probabilities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'fault-tree']
}));

// Task 6: Cause Prioritization
export const causePrioritizationTask = defineTask('rca-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Cause Prioritization',
  agent: {
    name: 'prioritization-analyst',
    prompt: {
      role: 'Cause Prioritization Analyst',
      task: 'Prioritize potential root causes',
      context: args,
      instructions: [
        '1. List all identified potential root causes',
        '2. Rate each cause by likelihood (evidence)',
        '3. Rate each cause by impact if confirmed',
        '4. Rate each cause by detectability',
        '5. Calculate priority score',
        '6. Consider ease of verification',
        '7. Group related causes',
        '8. Rank causes for verification',
        '9. Identify quick verification opportunities',
        '10. Document prioritization results'
      ],
      outputFormat: 'JSON with prioritized causes'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedCauses', 'prioritizationMatrix', 'artifacts'],
      properties: {
        prioritizedCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              likelihood: { type: 'number' },
              impact: { type: 'number' },
              priorityScore: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        prioritizationMatrix: { type: 'object' },
        topCauses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'prioritization']
}));

// Task 7: Cause Verification
export const causeVerificationTask = defineTask('rca-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Root Cause Verification',
  agent: {
    name: 'verification-analyst',
    prompt: {
      role: 'Root Cause Verification Analyst',
      task: 'Verify identified root causes',
      context: args,
      instructions: [
        '1. Design verification tests for each cause',
        '2. Use hypothesis testing approach',
        '3. Gather additional data if needed',
        '4. Apply statistical analysis where possible',
        '5. Test cause-effect relationship',
        '6. Verify cause is actionable',
        '7. Confirm cause explains all symptoms',
        '8. Calculate confidence level',
        '9. Identify primary root cause',
        '10. Document verification results'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verifiedCauses', 'primaryRootCause', 'confidence', 'artifacts'],
      properties: {
        verifiedCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              verified: { type: 'boolean' },
              evidence: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        primaryRootCause: { type: 'string' },
        confidence: { type: 'number' },
        verificationTests: { type: 'array', items: { type: 'object' } },
        unverifiedCauses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'verification']
}));

// Task 8: Corrective Actions
export const correctiveActionsTask = defineTask('rca-corrective-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Corrective Actions',
  agent: {
    name: 'corrective-action-developer',
    prompt: {
      role: 'Corrective Action Developer',
      task: 'Develop corrective actions for verified root causes',
      context: args,
      instructions: [
        '1. Develop actions for each verified root cause',
        '2. Address cause, not symptoms',
        '3. Evaluate multiple solution options',
        '4. Assess effectiveness of each action',
        '5. Estimate implementation cost/effort',
        '6. Identify potential side effects',
        '7. Assign owner and due date',
        '8. Define success criteria',
        '9. Plan verification method',
        '10. Document corrective actions'
      ],
      outputFormat: 'JSON with corrective actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'artifacts'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rootCause: { type: 'string' },
              action: { type: 'string' },
              type: { type: 'string', enum: ['immediate', 'short-term', 'long-term'] },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              successCriteria: { type: 'string' },
              cost: { type: 'string' }
            }
          }
        },
        implementationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'corrective-actions']
}));

// Task 9: Preventive Actions
export const preventiveActionsTask = defineTask('rca-preventive-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Preventive Actions',
  agent: {
    name: 'preventive-action-developer',
    prompt: {
      role: 'Preventive Action Developer',
      task: 'Develop preventive actions to avoid recurrence',
      context: args,
      instructions: [
        '1. Identify similar processes/areas at risk',
        '2. Develop systemic prevention measures',
        '3. Update procedures and standards',
        '4. Implement error-proofing (poka-yoke)',
        '5. Enhance detection capabilities',
        '6. Update training materials',
        '7. Implement monitoring/alerts',
        '8. Share lessons learned',
        '9. Update FMEA if applicable',
        '10. Document preventive actions'
      ],
      outputFormat: 'JSON with preventive actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'lessonsLearned', 'artifacts'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              scope: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        pokayoke: { type: 'array', items: { type: 'object' } },
        standardsUpdates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'preventive-actions']
}));

// Task 10: RCA Report
export const rcaReportTask = defineTask('rca-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Report Generation',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive RCA report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document problem definition',
        '3. Present data collection findings',
        '4. Include fishbone diagram',
        '5. Present 5 Whys analysis',
        '6. Include fault tree if applicable',
        '7. Document verification results',
        '8. Present corrective actions',
        '9. Document preventive actions',
        '10. Format professionally'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'reporting']
}));

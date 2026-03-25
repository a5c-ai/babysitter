/**
 * @process specializations/domains/science/scientific-discovery/deontic-reasoning
 * @description Deontic Reasoning - Reason systematically about permission, obligation, prohibition,
 * and normative requirements in scientific ethics, research conduct, institutional policies,
 * and regulatory compliance contexts.
 * @inputs { situation: object, norms: object[], agents: object[], context?: string }
 * @outputs { success: boolean, deonticAnalysis: object, obligations: object[], permissions: object[], prohibitions: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/deontic-reasoning', {
 *   situation: { action: 'Sharing preliminary research data publicly', domain: 'Clinical trials' },
 *   norms: [{ type: 'regulation', source: 'FDA', content: 'Trial data confidentiality requirements' }],
 *   agents: [{ role: 'Principal Investigator', obligations: ['Patient safety', 'Data integrity'] }]
 * });
 *
 * @references
 * - Deontic Logic: https://plato.stanford.edu/entries/logic-deontic/
 * - Ethics of Science: https://plato.stanford.edu/entries/scientific-research/
 * - Normative Ethics: https://plato.stanford.edu/entries/ethics-normative/
 * - Research Ethics: https://www.niehs.nih.gov/research/resources/bioethics/index.cfm
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    situation,
    norms,
    agents,
    context = ''
  } = inputs;

  // Phase 1: Situation and Action Analysis
  const situationAnalysis = await ctx.task(situationActionAnalysisTask, {
    situation,
    agents,
    context
  });

  // Phase 2: Norm Identification and Extraction
  const normExtraction = await ctx.task(normExtractionTask, {
    norms,
    situation: situationAnalysis,
    context
  });

  // Quality Gate: Must have applicable norms
  if (!normExtraction.applicableNorms || normExtraction.applicableNorms.length === 0) {
    return {
      success: false,
      error: 'No applicable norms identified for deontic analysis',
      phase: 'norm-extraction',
      deonticAnalysis: null
    };
  }

  // Phase 3: Obligation Analysis
  const obligationAnalysis = await ctx.task(obligationAnalysisTask, {
    situation: situationAnalysis,
    norms: normExtraction.applicableNorms,
    agents
  });

  // Phase 4: Permission Analysis
  const permissionAnalysis = await ctx.task(permissionAnalysisTask, {
    situation: situationAnalysis,
    norms: normExtraction.applicableNorms,
    agents,
    obligations: obligationAnalysis.obligations
  });

  // Breakpoint: Review deontic status
  await ctx.breakpoint({
    question: `Review deontic analysis for situation. ${obligationAnalysis.obligations?.length || 0} obligations, ${permissionAnalysis.permissions?.length || 0} permissions. Continue?`,
    title: 'Deontic Analysis Review',
    context: {
      runId: ctx.runId,
      situationDescription: situation.action,
      obligationCount: obligationAnalysis.obligations?.length || 0,
      permissionCount: permissionAnalysis.permissions?.length || 0,
      files: [{
        path: 'artifacts/deontic-analysis.json',
        format: 'json',
        content: { situationAnalysis, normExtraction, obligationAnalysis, permissionAnalysis }
      }]
    }
  });

  // Phase 5: Prohibition Analysis
  const prohibitionAnalysis = await ctx.task(prohibitionAnalysisTask, {
    situation: situationAnalysis,
    norms: normExtraction.applicableNorms,
    agents,
    permissions: permissionAnalysis.permissions
  });

  // Phase 6: Norm Conflict Detection
  const conflictDetection = await ctx.task(normConflictTask, {
    obligations: obligationAnalysis.obligations,
    permissions: permissionAnalysis.permissions,
    prohibitions: prohibitionAnalysis.prohibitions,
    norms: normExtraction.applicableNorms
  });

  // Phase 7: Deontic Consequence Analysis
  const consequenceAnalysis = await ctx.task(deonticConsequenceTask, {
    situation: situationAnalysis,
    obligations: obligationAnalysis.obligations,
    permissions: permissionAnalysis.permissions,
    prohibitions: prohibitionAnalysis.prohibitions,
    conflicts: conflictDetection.conflicts
  });

  // Phase 8: Agent-Specific Deontic Status
  const agentDeonticStatus = await ctx.task(agentDeonticStatusTask, {
    agents,
    obligations: obligationAnalysis.obligations,
    permissions: permissionAnalysis.permissions,
    prohibitions: prohibitionAnalysis.prohibitions,
    situation: situationAnalysis
  });

  // Phase 9: Compliance Assessment
  const complianceAssessment = await ctx.task(complianceAssessmentTask, {
    situation: situationAnalysis,
    agentDeonticStatus,
    conflicts: conflictDetection.conflicts,
    consequences: consequenceAnalysis.consequences
  });

  // Phase 10: Deontic Synthesis and Recommendations
  const deonticSynthesis = await ctx.task(deonticSynthesisTask, {
    situation: situationAnalysis,
    obligations: obligationAnalysis.obligations,
    permissions: permissionAnalysis.permissions,
    prohibitions: prohibitionAnalysis.prohibitions,
    conflicts: conflictDetection.conflicts,
    agentStatus: agentDeonticStatus,
    compliance: complianceAssessment,
    consequences: consequenceAnalysis,
    context
  });

  // Final Breakpoint: Deontic Analysis Approval
  await ctx.breakpoint({
    question: `Deontic analysis complete. Overall compliance: ${complianceAssessment.overallStatus}. Approve analysis?`,
    title: 'Deontic Analysis Approval',
    context: {
      runId: ctx.runId,
      situationDescription: situation.action,
      complianceStatus: complianceAssessment.overallStatus,
      conflictCount: conflictDetection.conflicts?.length || 0,
      files: [
        { path: 'artifacts/deontic-report.json', format: 'json', content: deonticSynthesis },
        { path: 'artifacts/deontic-report.md', format: 'markdown', content: deonticSynthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    situation: situationAnalysis,
    deonticAnalysis: {
      norms: normExtraction.applicableNorms,
      conflicts: conflictDetection.conflicts,
      consequences: consequenceAnalysis.consequences,
      compliance: complianceAssessment
    },
    obligations: obligationAnalysis.obligations,
    permissions: permissionAnalysis.permissions,
    prohibitions: prohibitionAnalysis.prohibitions,
    agentStatus: agentDeonticStatus.status,
    recommendations: deonticSynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/deontic-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const situationActionAnalysisTask = defineTask('situation-action-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Situation and Action Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'deontic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Deontic Situation Analyst',
      task: 'Analyze the situation and actions for deontic evaluation',
      context: {
        situation: args.situation,
        agents: args.agents,
        context: args.context
      },
      instructions: [
        '1. Identify the specific action or situation to be evaluated',
        '2. Characterize the action type (commission, omission, attempt)',
        '3. Identify all relevant agents and their roles',
        '4. Determine the institutional context',
        '5. Identify affected parties and stakeholders',
        '6. Characterize potential consequences of action',
        '7. Identify relevant domains (ethics, law, policy)',
        '8. Note time constraints or urgency',
        '9. Identify relevant circumstances and conditions',
        '10. Document situation for deontic analysis'
      ],
      outputFormat: 'JSON object with situation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['action', 'agents', 'domain'],
      properties: {
        action: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            type: { type: 'string', enum: ['commission', 'omission', 'attempt', 'ongoing'] },
            specificity: { type: 'string', enum: ['specific', 'general', 'conditional'] }
          }
        },
        agents: { type: 'array', items: { type: 'object' } },
        domain: { type: 'string' },
        institutionalContext: { type: 'string' },
        affectedParties: { type: 'array', items: { type: 'object' } },
        potentialConsequences: { type: 'array', items: { type: 'string' } },
        circumstances: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['deontic-reasoning', 'situation-analysis', 'normative']
}));

export const normExtractionTask = defineTask('norm-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Norm Identification and Extraction',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'deontic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Norm Extraction Expert',
      task: 'Identify and extract applicable norms',
      context: {
        norms: args.norms,
        situation: args.situation,
        context: args.context
      },
      instructions: [
        '1. Extract explicit norms from provided sources',
        '2. Identify implicit norms relevant to situation',
        '3. Categorize norms by type (legal, ethical, professional, institutional)',
        '4. Identify norm sources and authority',
        '5. Assess norm applicability to situation',
        '6. Identify conditional aspects of norms',
        '7. Note norm hierarchies and priorities',
        '8. Identify gaps in normative coverage',
        '9. Extract specific deontic operators from norms',
        '10. Document applicable norm set'
      ],
      outputFormat: 'JSON object with extracted norms'
    },
    outputSchema: {
      type: 'object',
      required: ['applicableNorms'],
      properties: {
        applicableNorms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              type: { type: 'string', enum: ['legal', 'ethical', 'professional', 'institutional', 'social'] },
              source: { type: 'string' },
              authority: { type: 'string', enum: ['binding', 'advisory', 'customary'] },
              deonticOperator: { type: 'string', enum: ['obligation', 'permission', 'prohibition', 'facultative'] },
              conditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        implicitNorms: { type: 'array', items: { type: 'object' } },
        normHierarchy: { type: 'object' },
        normGaps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['deontic-reasoning', 'norm-extraction', 'normative']
}));

export const obligationAnalysisTask = defineTask('obligation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Obligation Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'deontic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Obligation Analysis Expert',
      task: 'Analyze obligations arising from norms',
      context: {
        situation: args.situation,
        norms: args.norms,
        agents: args.agents
      },
      instructions: [
        '1. Identify all obligations from applicable norms',
        '2. Specify who bears each obligation',
        '3. Specify what each obligation requires',
        '4. Identify conditions triggering obligations',
        '5. Assess obligation strength (strict, prima facie)',
        '6. Identify time constraints on obligations',
        '7. Distinguish perfect from imperfect obligations',
        '8. Identify correlative rights',
        '9. Assess fulfillment conditions',
        '10. Document all obligations'
      ],
      outputFormat: 'JSON object with obligation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['obligations'],
      properties: {
        obligations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              bearer: { type: 'string' },
              source: { type: 'string' },
              strength: { type: 'string', enum: ['strict', 'prima-facie', 'defeasible'] },
              type: { type: 'string', enum: ['perfect', 'imperfect'] },
              conditions: { type: 'array', items: { type: 'string' } },
              timeConstraint: { type: 'string' },
              fulfillmentConditions: { type: 'array', items: { type: 'string' } },
              correlativeRight: { type: 'string' }
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
  labels: ['deontic-reasoning', 'obligations', 'duties']
}));

export const permissionAnalysisTask = defineTask('permission-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Permission Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'deontic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Permission Analysis Expert',
      task: 'Analyze permissions arising from norms',
      context: {
        situation: args.situation,
        norms: args.norms,
        agents: args.agents,
        obligations: args.obligations
      },
      instructions: [
        '1. Identify all permissions from applicable norms',
        '2. Specify who holds each permission',
        '3. Specify what each permission allows',
        '4. Distinguish strong from weak permissions',
        '5. Identify conditions on permissions',
        '6. Analyze permission-obligation relationships',
        '7. Identify derived permissions',
        '8. Assess permission scope and limits',
        '9. Identify liberty rights',
        '10. Document all permissions'
      ],
      outputFormat: 'JSON object with permission analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['permissions'],
      properties: {
        permissions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              holder: { type: 'string' },
              source: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'weak'] },
              conditions: { type: 'array', items: { type: 'string' } },
              scope: { type: 'string' },
              limits: { type: 'array', items: { type: 'string' } },
              derived: { type: 'boolean' }
            }
          }
        },
        libertyRights: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['deontic-reasoning', 'permissions', 'rights']
}));

export const prohibitionAnalysisTask = defineTask('prohibition-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Prohibition Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'deontic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Prohibition Analysis Expert',
      task: 'Analyze prohibitions arising from norms',
      context: {
        situation: args.situation,
        norms: args.norms,
        agents: args.agents,
        permissions: args.permissions
      },
      instructions: [
        '1. Identify all prohibitions from applicable norms',
        '2. Specify who is subject to each prohibition',
        '3. Specify what each prohibition forbids',
        '4. Assess prohibition strength (absolute, prima facie)',
        '5. Identify conditions on prohibitions',
        '6. Identify exceptions to prohibitions',
        '7. Analyze prohibition-permission relationships',
        '8. Assess consequences of violation',
        '9. Identify implicit prohibitions',
        '10. Document all prohibitions'
      ],
      outputFormat: 'JSON object with prohibition analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['prohibitions'],
      properties: {
        prohibitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              subject: { type: 'string' },
              source: { type: 'string' },
              strength: { type: 'string', enum: ['absolute', 'prima-facie', 'defeasible'] },
              conditions: { type: 'array', items: { type: 'string' } },
              exceptions: { type: 'array', items: { type: 'string' } },
              violationConsequences: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        implicitProhibitions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['deontic-reasoning', 'prohibitions', 'forbidden']
}));

export const normConflictTask = defineTask('norm-conflict', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Norm Conflict Detection',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'deontic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Norm Conflict Analyst',
      task: 'Detect and analyze conflicts between norms',
      context: {
        obligations: args.obligations,
        permissions: args.permissions,
        prohibitions: args.prohibitions,
        norms: args.norms
      },
      instructions: [
        '1. Identify obligation-prohibition conflicts',
        '2. Identify obligation-obligation conflicts',
        '3. Identify permission-prohibition tensions',
        '4. Analyze deontic paradoxes',
        '5. Identify practical dilemmas',
        '6. Propose conflict resolution strategies',
        '7. Apply norm priority rules',
        '8. Identify tragic choices',
        '9. Assess conflict severity',
        '10. Document all conflicts'
      ],
      outputFormat: 'JSON object with norm conflicts'
    },
    outputSchema: {
      type: 'object',
      required: ['conflicts'],
      properties: {
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['obligation-prohibition', 'obligation-obligation', 'permission-prohibition', 'dilemma'] },
              norm1: { type: 'string' },
              norm2: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'significant', 'manageable'] },
              resolutionStrategy: { type: 'string' }
            }
          }
        },
        paradoxes: { type: 'array', items: { type: 'object' } },
        tragicChoices: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['deontic-reasoning', 'norm-conflict', 'dilemmas']
}));

export const deonticConsequenceTask = defineTask('deontic-consequence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Deontic Consequence Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'deontic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Deontic Consequence Analyst',
      task: 'Analyze consequences of deontic status',
      context: {
        situation: args.situation,
        obligations: args.obligations,
        permissions: args.permissions,
        prohibitions: args.prohibitions,
        conflicts: args.conflicts
      },
      instructions: [
        '1. Analyze consequences of fulfilling obligations',
        '2. Analyze consequences of violating obligations',
        '3. Analyze consequences of acting on permissions',
        '4. Analyze consequences of violating prohibitions',
        '5. Assess liability and responsibility',
        '6. Identify cascade effects of deontic choices',
        '7. Analyze reputational consequences',
        '8. Identify legal consequences',
        '9. Assess moral residue from conflicts',
        '10. Document consequence landscape'
      ],
      outputFormat: 'JSON object with consequence analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['consequences'],
      properties: {
        consequences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              type: { type: 'string', enum: ['fulfillment', 'violation', 'exercise'] },
              consequences: { type: 'array', items: { type: 'string' } },
              liability: { type: 'string' },
              severity: { type: 'string', enum: ['severe', 'moderate', 'minor'] }
            }
          }
        },
        cascadeEffects: { type: 'array', items: { type: 'object' } },
        moralResidue: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['deontic-reasoning', 'consequences', 'liability']
}));

export const agentDeonticStatusTask = defineTask('agent-deontic-status', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Agent-Specific Deontic Status',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'deontic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Agent Deontic Status Analyst',
      task: 'Determine deontic status for each agent',
      context: {
        agents: args.agents,
        obligations: args.obligations,
        permissions: args.permissions,
        prohibitions: args.prohibitions,
        situation: args.situation
      },
      instructions: [
        '1. Map obligations to specific agents',
        '2. Map permissions to specific agents',
        '3. Map prohibitions to specific agents',
        '4. Assess role-specific deontic status',
        '5. Identify agent-specific conflicts',
        '6. Assess agent capacity to fulfill obligations',
        '7. Identify delegation possibilities',
        '8. Assess excuse and justification conditions',
        '9. Provide agent-specific guidance',
        '10. Document agent deontic profiles'
      ],
      outputFormat: 'JSON object with agent deontic status'
    },
    outputSchema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentId: { type: 'string' },
              role: { type: 'string' },
              obligations: { type: 'array', items: { type: 'string' } },
              permissions: { type: 'array', items: { type: 'string' } },
              prohibitions: { type: 'array', items: { type: 'string' } },
              conflicts: { type: 'array', items: { type: 'string' } },
              capacity: { type: 'string', enum: ['full', 'limited', 'incapable'] },
              guidance: { type: 'array', items: { type: 'string' } }
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
  labels: ['deontic-reasoning', 'agent-status', 'role-based']
}));

export const complianceAssessmentTask = defineTask('compliance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Compliance Assessment',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'deontic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Compliance Assessment Expert',
      task: 'Assess compliance status and risks',
      context: {
        situation: args.situation,
        agentDeonticStatus: args.agentDeonticStatus,
        conflicts: args.conflicts,
        consequences: args.consequences
      },
      instructions: [
        '1. Assess current compliance status',
        '2. Identify compliance risks',
        '3. Assess compliance gaps',
        '4. Identify compliance requirements',
        '5. Assess audit readiness',
        '6. Identify remediation needs',
        '7. Assess compliance monitoring needs',
        '8. Identify compliance documentation requirements',
        '9. Provide overall compliance assessment',
        '10. Document compliance findings'
      ],
      outputFormat: 'JSON object with compliance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['overallStatus'],
      properties: {
        overallStatus: { type: 'string', enum: ['compliant', 'partially-compliant', 'non-compliant', 'at-risk'] },
        complianceGaps: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        remediationNeeds: { type: 'array', items: { type: 'object' } },
        monitoringRequirements: { type: 'array', items: { type: 'string' } },
        documentationNeeds: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['deontic-reasoning', 'compliance', 'assessment']
}));

export const deonticSynthesisTask = defineTask('deontic-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Deontic Synthesis and Recommendations',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'deontic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Deontic Analysis Synthesist',
      task: 'Synthesize deontic analysis and provide recommendations',
      context: {
        situation: args.situation,
        obligations: args.obligations,
        permissions: args.permissions,
        prohibitions: args.prohibitions,
        conflicts: args.conflicts,
        agentStatus: args.agentStatus,
        compliance: args.compliance,
        consequences: args.consequences,
        context: args.context
      },
      instructions: [
        '1. Synthesize all deontic findings',
        '2. Summarize key obligations, permissions, prohibitions',
        '3. Highlight critical conflicts and resolutions',
        '4. Provide action recommendations',
        '5. Prioritize recommendations by urgency',
        '6. Identify risk mitigation strategies',
        '7. Provide compliance improvement guidance',
        '8. Note areas requiring further analysis',
        '9. Assess confidence in conclusions',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with deontic synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'recommendations', 'markdown'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            situation: { type: 'string' },
            keyObligations: { type: 'array', items: { type: 'string' } },
            keyPermissions: { type: 'array', items: { type: 'string' } },
            keyProhibitions: { type: 'array', items: { type: 'string' } },
            criticalConflicts: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              agent: { type: 'string' }
            }
          }
        },
        riskMitigation: { type: 'array', items: { type: 'object' } },
        furtherAnalysisNeeded: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['deontic-reasoning', 'synthesis', 'recommendations']
}));

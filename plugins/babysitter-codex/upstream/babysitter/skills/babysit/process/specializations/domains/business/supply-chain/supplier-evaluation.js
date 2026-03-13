/**
 * @process specializations/domains/business/supply-chain/supplier-evaluation
 * @description Supplier Evaluation and Selection - Assess and qualify suppliers using weighted scorecards
 * covering quality, cost, delivery, service, sustainability, and risk criteria with TCO analysis.
 * @inputs { supplierName?: string, category?: string, evaluationCriteria?: object, currentPerformance?: object }
 * @outputs { success: boolean, evaluation: object, qualification: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/supplier-evaluation', {
 *   supplierName: 'Acme Corp',
 *   category: 'Raw Materials',
 *   evaluationCriteria: { quality: 30, cost: 25, delivery: 20, service: 15, sustainability: 10 },
 *   currentPerformance: { onTimeDelivery: 0.95, qualityRating: 4.2 }
 * });
 *
 * @references
 * - CIPS Qualifications: https://www.cips.org/qualifications/
 * - Supplier Qualification Best Practices: https://www.jaggaer.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    supplierName = '',
    category = '',
    evaluationCriteria = {},
    currentPerformance = {},
    evaluationType = 'comprehensive',
    includeRiskAssessment = true,
    includeTCOAnalysis = true,
    outputDir = 'supplier-evaluation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Supplier Evaluation for: ${supplierName}`);

  // ============================================================================
  // PHASE 1: SUPPLIER PROFILE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing supplier profile');

  const profileAssessment = await ctx.task(profileAssessmentTask, {
    supplierName,
    category,
    currentPerformance,
    outputDir
  });

  artifacts.push(...profileAssessment.artifacts);

  // ============================================================================
  // PHASE 2: QUALITY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Evaluating quality capabilities');

  const qualityEvaluation = await ctx.task(qualityEvaluationTask, {
    supplierName,
    profileAssessment,
    evaluationCriteria,
    outputDir
  });

  artifacts.push(...qualityEvaluation.artifacts);

  // ============================================================================
  // PHASE 3: COST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing costs and TCO');

  const costAnalysis = await ctx.task(costAnalysisTask, {
    supplierName,
    profileAssessment,
    includeTCOAnalysis,
    outputDir
  });

  artifacts.push(...costAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: DELIVERY PERFORMANCE EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Evaluating delivery performance');

  const deliveryEvaluation = await ctx.task(deliveryEvaluationTask, {
    supplierName,
    profileAssessment,
    currentPerformance,
    outputDir
  });

  artifacts.push(...deliveryEvaluation.artifacts);

  // ============================================================================
  // PHASE 5: SERVICE AND RESPONSIVENESS
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing service and responsiveness');

  const serviceAssessment = await ctx.task(serviceAssessmentTask, {
    supplierName,
    profileAssessment,
    outputDir
  });

  artifacts.push(...serviceAssessment.artifacts);

  // ============================================================================
  // PHASE 6: SUSTAINABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Evaluating sustainability practices');

  const sustainabilityAssessment = await ctx.task(sustainabilityAssessmentTask, {
    supplierName,
    profileAssessment,
    outputDir
  });

  artifacts.push(...sustainabilityAssessment.artifacts);

  // ============================================================================
  // PHASE 7: RISK ASSESSMENT
  // ============================================================================

  let riskAssessment = null;
  if (includeRiskAssessment) {
    ctx.log('info', 'Phase 7: Conducting risk assessment');

    riskAssessment = await ctx.task(riskAssessmentTask, {
      supplierName,
      profileAssessment,
      qualityEvaluation,
      costAnalysis,
      deliveryEvaluation,
      outputDir
    });

    artifacts.push(...riskAssessment.artifacts);
  }

  // ============================================================================
  // PHASE 8: SCORECARD GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating supplier scorecard');

  const scorecardGeneration = await ctx.task(scorecardGenerationTask, {
    supplierName,
    evaluationCriteria,
    qualityEvaluation,
    costAnalysis,
    deliveryEvaluation,
    serviceAssessment,
    sustainabilityAssessment,
    riskAssessment,
    outputDir
  });

  artifacts.push(...scorecardGeneration.artifacts);

  // Breakpoint: Review evaluation results
  await ctx.breakpoint({
    question: `Supplier evaluation complete for ${supplierName}. Overall Score: ${scorecardGeneration.overallScore}/100. Qualification Status: ${scorecardGeneration.qualificationStatus}. Review evaluation?`,
    title: 'Supplier Evaluation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        overallScore: scorecardGeneration.overallScore,
        qualificationStatus: scorecardGeneration.qualificationStatus,
        categoryScores: scorecardGeneration.categoryScores
      }
    }
  });

  // ============================================================================
  // PHASE 9: QUALIFICATION DECISION
  // ============================================================================

  ctx.log('info', 'Phase 9: Making qualification decision');

  const qualificationDecision = await ctx.task(qualificationDecisionTask, {
    supplierName,
    scorecardGeneration,
    riskAssessment,
    outputDir
  });

  artifacts.push(...qualificationDecision.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    evaluation: {
      supplierName,
      overallScore: scorecardGeneration.overallScore,
      categoryScores: scorecardGeneration.categoryScores,
      strengths: scorecardGeneration.strengths,
      weaknesses: scorecardGeneration.weaknesses
    },
    qualification: {
      status: qualificationDecision.qualificationStatus,
      decision: qualificationDecision.decision,
      conditions: qualificationDecision.conditions,
      approvedCategories: qualificationDecision.approvedCategories
    },
    tcoAnalysis: costAnalysis.tcoAnalysis,
    riskProfile: riskAssessment ? riskAssessment.riskProfile : null,
    recommendations: qualificationDecision.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/supplier-evaluation',
      timestamp: startTime,
      supplierName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const profileAssessmentTask = defineTask('profile-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Supplier Profile Assessment',
  agent: {
    name: 'supplier-analyst',
    prompt: {
      role: 'Supplier Assessment Analyst',
      task: 'Assess supplier profile and background',
      context: args,
      instructions: [
        '1. Gather supplier company information',
        '2. Review financial stability indicators',
        '3. Assess organizational capabilities',
        '4. Document certifications and accreditations',
        '5. Review customer references',
        '6. Assess geographic footprint',
        '7. Document technology capabilities',
        '8. Create supplier profile summary'
      ],
      outputFormat: 'JSON with supplier profile assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['companyProfile', 'financialHealth', 'artifacts'],
      properties: {
        companyProfile: { type: 'object' },
        financialHealth: { type: 'object' },
        certifications: { type: 'array' },
        capabilities: { type: 'object' },
        references: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-evaluation', 'profile']
}));

export const qualityEvaluationTask = defineTask('quality-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Quality Evaluation',
  agent: {
    name: 'quality-evaluator',
    prompt: {
      role: 'Supplier Quality Engineer',
      task: 'Evaluate supplier quality capabilities and performance',
      context: args,
      instructions: [
        '1. Review quality management system (ISO 9001, etc.)',
        '2. Analyze historical quality performance',
        '3. Evaluate inspection and testing capabilities',
        '4. Assess corrective action processes',
        '5. Review product/process certifications',
        '6. Evaluate continuous improvement practices',
        '7. Assess traceability capabilities',
        '8. Calculate quality score'
      ],
      outputFormat: 'JSON with quality evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'qualityCapabilities', 'artifacts'],
      properties: {
        qualityScore: { type: 'number' },
        qualityCapabilities: { type: 'object' },
        defectRates: { type: 'object' },
        certifications: { type: 'array' },
        improvementAreas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-evaluation', 'quality']
}));

export const costAnalysisTask = defineTask('cost-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Cost Analysis and TCO',
  agent: {
    name: 'cost-analyst',
    prompt: {
      role: 'Cost Analysis Specialist',
      task: 'Analyze supplier pricing and total cost of ownership',
      context: args,
      instructions: [
        '1. Analyze unit pricing competitiveness',
        '2. Calculate total cost of ownership (TCO)',
        '3. Include logistics and freight costs',
        '4. Factor in quality costs (returns, rework)',
        '5. Include inventory carrying costs',
        '6. Assess payment terms impact',
        '7. Evaluate cost reduction potential',
        '8. Calculate cost score'
      ],
      outputFormat: 'JSON with cost analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['costScore', 'tcoAnalysis', 'artifacts'],
      properties: {
        costScore: { type: 'number' },
        tcoAnalysis: { type: 'object' },
        pricingCompetitiveness: { type: 'string' },
        costBreakdown: { type: 'object' },
        savingsOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-evaluation', 'cost']
}));

export const deliveryEvaluationTask = defineTask('delivery-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Delivery Performance Evaluation',
  agent: {
    name: 'delivery-evaluator',
    prompt: {
      role: 'Delivery Performance Analyst',
      task: 'Evaluate supplier delivery performance and capabilities',
      context: args,
      instructions: [
        '1. Analyze on-time delivery (OTD) performance',
        '2. Calculate OTIF (On-Time In-Full) metrics',
        '3. Assess lead time competitiveness',
        '4. Evaluate flexibility and responsiveness',
        '5. Assess capacity and scalability',
        '6. Review delivery reliability',
        '7. Evaluate order fulfillment accuracy',
        '8. Calculate delivery score'
      ],
      outputFormat: 'JSON with delivery evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['deliveryScore', 'otdPerformance', 'artifacts'],
      properties: {
        deliveryScore: { type: 'number' },
        otdPerformance: { type: 'number' },
        otifPerformance: { type: 'number' },
        leadTime: { type: 'object' },
        flexibility: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-evaluation', 'delivery']
}));

export const serviceAssessmentTask = defineTask('service-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Service and Responsiveness',
  agent: {
    name: 'service-assessor',
    prompt: {
      role: 'Supplier Service Analyst',
      task: 'Assess supplier service levels and responsiveness',
      context: args,
      instructions: [
        '1. Evaluate communication responsiveness',
        '2. Assess technical support capabilities',
        '3. Review problem resolution effectiveness',
        '4. Evaluate account management quality',
        '5. Assess innovation and value-add services',
        '6. Review collaboration willingness',
        '7. Evaluate customer service culture',
        '8. Calculate service score'
      ],
      outputFormat: 'JSON with service assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['serviceScore', 'responsiveness', 'artifacts'],
      properties: {
        serviceScore: { type: 'number' },
        responsiveness: { type: 'object' },
        technicalSupport: { type: 'object' },
        valueAddServices: { type: 'array' },
        collaborationRating: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-evaluation', 'service']
}));

export const sustainabilityAssessmentTask = defineTask('sustainability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Sustainability Assessment',
  agent: {
    name: 'sustainability-assessor',
    prompt: {
      role: 'Sustainability Assessment Specialist',
      task: 'Evaluate supplier sustainability practices',
      context: args,
      instructions: [
        '1. Review environmental certifications (ISO 14001)',
        '2. Assess carbon footprint and emissions',
        '3. Evaluate waste management practices',
        '4. Review social responsibility policies',
        '5. Assess labor practices and working conditions',
        '6. Evaluate ethical sourcing practices',
        '7. Review sustainability reporting',
        '8. Calculate sustainability score'
      ],
      outputFormat: 'JSON with sustainability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['sustainabilityScore', 'environmentalPractices', 'artifacts'],
      properties: {
        sustainabilityScore: { type: 'number' },
        environmentalPractices: { type: 'object' },
        socialResponsibility: { type: 'object' },
        certifications: { type: 'array' },
        improvementAreas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-evaluation', 'sustainability']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Risk Assessment',
  agent: {
    name: 'risk-assessor',
    prompt: {
      role: 'Supplier Risk Analyst',
      task: 'Assess supplier risk profile',
      context: args,
      instructions: [
        '1. Assess financial risk (creditworthiness)',
        '2. Evaluate operational risk',
        '3. Assess geographic and geopolitical risk',
        '4. Evaluate single-source risk',
        '5. Assess regulatory and compliance risk',
        '6. Evaluate business continuity capabilities',
        '7. Create risk profile summary',
        '8. Recommend risk mitigation actions'
      ],
      outputFormat: 'JSON with risk assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['riskProfile', 'overallRiskLevel', 'artifacts'],
      properties: {
        riskProfile: { type: 'object' },
        overallRiskLevel: { type: 'string' },
        riskFactors: { type: 'array' },
        mitigationActions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-evaluation', 'risk']
}));

export const scorecardGenerationTask = defineTask('scorecard-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Scorecard Generation',
  agent: {
    name: 'scorecard-generator',
    prompt: {
      role: 'Supplier Scorecard Specialist',
      task: 'Generate comprehensive supplier scorecard',
      context: args,
      instructions: [
        '1. Compile all evaluation scores',
        '2. Apply weights to category scores',
        '3. Calculate overall weighted score',
        '4. Identify supplier strengths',
        '5. Identify areas for improvement',
        '6. Compare to qualification thresholds',
        '7. Generate visual scorecard',
        '8. Document scoring methodology'
      ],
      outputFormat: 'JSON with supplier scorecard'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'categoryScores', 'qualificationStatus', 'artifacts'],
      properties: {
        overallScore: { type: 'number' },
        categoryScores: { type: 'object' },
        strengths: { type: 'array' },
        weaknesses: { type: 'array' },
        qualificationStatus: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-evaluation', 'scorecard']
}));

export const qualificationDecisionTask = defineTask('qualification-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Qualification Decision',
  agent: {
    name: 'qualification-manager',
    prompt: {
      role: 'Supplier Qualification Manager',
      task: 'Make supplier qualification decision',
      context: args,
      instructions: [
        '1. Review overall evaluation results',
        '2. Apply qualification criteria',
        '3. Determine qualification status',
        '4. Identify conditions for qualification',
        '5. Define approved categories/scope',
        '6. Set review/requalification timeline',
        '7. Document recommendations',
        '8. Create qualification certificate if approved'
      ],
      outputFormat: 'JSON with qualification decision'
    },
    outputSchema: {
      type: 'object',
      required: ['qualificationStatus', 'decision', 'recommendations', 'artifacts'],
      properties: {
        qualificationStatus: { type: 'string' },
        decision: { type: 'string' },
        conditions: { type: 'array' },
        approvedCategories: { type: 'array' },
        reviewDate: { type: 'string' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'supplier-evaluation', 'qualification']
}));

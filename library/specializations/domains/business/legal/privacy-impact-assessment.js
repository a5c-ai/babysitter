/**
 * @process specializations/domains/business/legal/privacy-impact-assessment
 * @description Privacy Impact Assessment (PIA) - Deploy privacy impact assessment methodology for new
 * processing activities, systems, and vendors.
 * @inputs { assessmentId?: string, subject: object, assessmentType?: string, outputDir?: string }
 * @outputs { success: boolean, assessment: object, risks: array, recommendations: array, approval: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/privacy-impact-assessment', {
 *   subject: { name: 'Customer Analytics Platform', type: 'system', dataCategories: ['behavioral', 'demographic'] },
 *   assessmentType: 'dpia',
 *   outputDir: 'pia-assessments'
 * });
 *
 * @references
 * - ISO 27701 Privacy Management: https://www.iso.org/standard/71670.html
 * - GDPR DPIA Requirements: https://gdpr.eu/article-35-impact-assessment/
 * - NIST Privacy Framework: https://www.nist.gov/privacy-framework
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    assessmentId = `PIA-${Date.now()}`,
    subject,
    assessmentType = 'pia', // 'pia', 'dpia', 'threshold'
    outputDir = 'pia-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Privacy Impact Assessment - ${assessmentId} for ${subject.name}`);

  // Phase 1: Threshold Assessment
  const threshold = await ctx.task(thresholdAssessmentTask, {
    assessmentId,
    subject,
    outputDir
  });
  artifacts.push(...threshold.artifacts);

  // If threshold indicates no DPIA needed and not explicitly requested
  if (!threshold.dpiaRequired && assessmentType === 'threshold') {
    return {
      success: true,
      assessmentId,
      assessmentType: 'threshold',
      subject,
      dpiaRequired: false,
      rationale: threshold.rationale,
      artifacts,
      metadata: { processId: 'specializations/domains/business/legal/privacy-impact-assessment', timestamp: startTime }
    };
  }

  // Phase 2: Data Flow Analysis
  const dataFlowAnalysis = await ctx.task(piaDataFlowTask, {
    assessmentId,
    subject,
    outputDir
  });
  artifacts.push(...dataFlowAnalysis.artifacts);

  // Phase 3: Necessity and Proportionality
  const necessityAssessment = await ctx.task(necessityAssessmentTask, {
    assessmentId,
    subject,
    dataFlows: dataFlowAnalysis.flows,
    outputDir
  });
  artifacts.push(...necessityAssessment.artifacts);

  // Phase 4: Risk Assessment
  const riskAssessment = await ctx.task(piaRiskAssessmentTask, {
    assessmentId,
    subject,
    dataFlows: dataFlowAnalysis.flows,
    outputDir
  });
  artifacts.push(...riskAssessment.artifacts);

  // Quality Gate: High risk findings
  const highRisks = riskAssessment.risks.filter(r => r.level === 'high');
  if (highRisks.length > 0) {
    await ctx.breakpoint({
      question: `PIA ${assessmentId} identified ${highRisks.length} high privacy risks. Review risks and mitigation measures?`,
      title: 'High Privacy Risk Alert',
      context: {
        runId: ctx.runId,
        assessmentId,
        highRisks: highRisks.map(r => ({ risk: r.description, mitigation: r.mitigation })),
        files: riskAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 5: Mitigation Measures
  const mitigation = await ctx.task(mitigationMeasuresTask, {
    assessmentId,
    risks: riskAssessment.risks,
    outputDir
  });
  artifacts.push(...mitigation.artifacts);

  // Phase 6: Residual Risk Assessment
  const residualRisk = await ctx.task(residualRiskAssessmentTask, {
    assessmentId,
    originalRisks: riskAssessment.risks,
    mitigations: mitigation.measures,
    outputDir
  });
  artifacts.push(...residualRisk.artifacts);

  // Phase 7: DPO Consultation (if DPIA)
  let dpoConsultation = null;
  if (assessmentType === 'dpia') {
    dpoConsultation = await ctx.task(dpoConsultationTask, {
      assessmentId,
      subject,
      residualRisk,
      outputDir
    });
    artifacts.push(...dpoConsultation.artifacts);
  }

  // Phase 8: Assessment Report
  const report = await ctx.task(piaReportTask, {
    assessmentId,
    subject,
    assessmentType,
    threshold,
    dataFlowAnalysis,
    necessityAssessment,
    riskAssessment,
    mitigation,
    residualRisk,
    dpoConsultation,
    outputDir
  });
  artifacts.push(...report.artifacts);

  // Phase 9: Approval
  const approval = await ctx.task(piaApprovalTask, {
    assessmentId,
    subject,
    residualRiskLevel: residualRisk.overallLevel,
    reportPath: report.reportPath,
    outputDir
  });
  artifacts.push(...approval.artifacts);

  await ctx.breakpoint({
    question: `PIA ${assessmentId} complete. Residual risk: ${residualRisk.overallLevel}. ${mitigation.measures.length} mitigations recommended. Approve assessment?`,
    title: 'PIA Approval Review',
    context: {
      runId: ctx.runId,
      assessmentId,
      residualRiskLevel: residualRisk.overallLevel,
      mitigationsCount: mitigation.measures.length,
      files: [{ path: report.reportPath, format: 'markdown', label: 'PIA Report' }]
    }
  });

  return {
    success: true,
    assessmentId,
    assessmentType,
    subject,
    assessment: {
      dpiaRequired: threshold.dpiaRequired,
      necessityScore: necessityAssessment.score,
      proportionalityScore: necessityAssessment.proportionalityScore
    },
    risks: riskAssessment.risks.map(r => ({
      description: r.description,
      level: r.level,
      mitigation: r.mitigation
    })),
    residualRisk: {
      overallLevel: residualRisk.overallLevel,
      acceptableForProcessing: residualRisk.acceptable
    },
    recommendations: mitigation.measures,
    approval: approval.decision,
    reportPath: report.reportPath,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/privacy-impact-assessment', timestamp: startTime }
  };
}

export const thresholdAssessmentTask = defineTask('threshold-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct threshold assessment',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Threshold Assessment Specialist',
      task: 'Determine if DPIA is required',
      context: args,
      instructions: ['Review processing description', 'Check DPIA trigger criteria', 'Document assessment rationale', 'Determine DPIA requirement'],
      outputFormat: 'JSON with dpiaRequired, rationale, triggers, artifacts'
    },
    outputSchema: { type: 'object', required: ['dpiaRequired', 'rationale', 'artifacts'], properties: { dpiaRequired: { type: 'boolean' }, rationale: { type: 'string' }, triggers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pia']
}));

export const piaDataFlowTask = defineTask('pia-data-flow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze data flows',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Data Flow Analyst',
      task: 'Analyze data flows for PIA',
      context: args,
      instructions: ['Map all data flows', 'Identify data categories', 'Document data sources', 'Track data recipients'],
      outputFormat: 'JSON with flows array, dataCategories, artifacts'
    },
    outputSchema: { type: 'object', required: ['flows', 'artifacts'], properties: { flows: { type: 'array' }, dataCategories: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pia']
}));

export const necessityAssessmentTask = defineTask('necessity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess necessity and proportionality',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Necessity Assessment Specialist',
      task: 'Assess necessity and proportionality',
      context: args,
      instructions: ['Evaluate processing necessity', 'Assess data minimization', 'Check purpose limitation', 'Score proportionality'],
      outputFormat: 'JSON with score, proportionalityScore, findings, artifacts'
    },
    outputSchema: { type: 'object', required: ['score', 'proportionalityScore', 'artifacts'], properties: { score: { type: 'number' }, proportionalityScore: { type: 'number' }, findings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pia']
}));

export const piaRiskAssessmentTask = defineTask('pia-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess privacy risks',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Privacy Risk Assessor',
      task: 'Assess privacy risks',
      context: args,
      instructions: ['Identify privacy risks', 'Assess likelihood and impact', 'Rate risk level', 'Identify potential mitigations'],
      outputFormat: 'JSON with risks array, overallRiskLevel, artifacts'
    },
    outputSchema: { type: 'object', required: ['risks', 'overallRiskLevel', 'artifacts'], properties: { risks: { type: 'array' }, overallRiskLevel: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pia']
}));

export const mitigationMeasuresTask = defineTask('mitigation-measures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define mitigation measures',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Mitigation Specialist',
      task: 'Define risk mitigation measures',
      context: args,
      instructions: ['Propose mitigations for each risk', 'Prioritize by effectiveness', 'Assess implementation feasibility', 'Document measures'],
      outputFormat: 'JSON with measures array, artifacts'
    },
    outputSchema: { type: 'object', required: ['measures', 'artifacts'], properties: { measures: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pia']
}));

export const residualRiskAssessmentTask = defineTask('residual-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess residual risk',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Residual Risk Assessor',
      task: 'Assess residual privacy risk',
      context: args,
      instructions: ['Calculate residual risk after mitigations', 'Determine overall residual level', 'Assess acceptability', 'Document assessment'],
      outputFormat: 'JSON with overallLevel, acceptable, residualRisks, artifacts'
    },
    outputSchema: { type: 'object', required: ['overallLevel', 'acceptable', 'artifacts'], properties: { overallLevel: { type: 'string' }, acceptable: { type: 'boolean' }, residualRisks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pia']
}));

export const dpoConsultationTask = defineTask('dpo-consultation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Consult DPO',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'DPO Consultation Specialist',
      task: 'Document DPO consultation',
      context: args,
      instructions: ['Present assessment to DPO', 'Document DPO feedback', 'Incorporate recommendations', 'Record consultation'],
      outputFormat: 'JSON with consultation object, recommendations, artifacts'
    },
    outputSchema: { type: 'object', required: ['consultation', 'artifacts'], properties: { consultation: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pia']
}));

export const piaReportTask = defineTask('pia-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate PIA report',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'PIA Report Specialist',
      task: 'Generate PIA/DPIA report',
      context: args,
      instructions: ['Compile all assessment sections', 'Document findings', 'Include recommendations', 'Format as formal report'],
      outputFormat: 'JSON with reportPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pia']
}));

export const piaApprovalTask = defineTask('pia-approval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process PIA approval',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'PIA Approval Specialist',
      task: 'Process PIA approval',
      context: args,
      instructions: ['Determine approval recommendation', 'Document conditions if any', 'Record approval decision', 'Set review date'],
      outputFormat: 'JSON with decision object, conditions, reviewDate, artifacts'
    },
    outputSchema: { type: 'object', required: ['decision', 'artifacts'], properties: { decision: { type: 'object' }, conditions: { type: 'array' }, reviewDate: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'pia']
}));

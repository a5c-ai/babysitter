/**
 * @process specializations/domains/science/aerospace-engineering/safety-assessment-arp4761
 * @description Safety assessment process following ARP4761 methodology including FHA, PSSA, SSA,
 * fault tree analysis, and common cause analysis.
 * @inputs { projectName: string, systemDefinition: object, functionalArchitecture: object, safetyObjectives?: object }
 * @outputs { success: boolean, fha: object, pssa: object, ssa: object, safetyCase: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, systemDefinition, functionalArchitecture, safetyObjectives = {} } = inputs;

  let lastFeedback_analysisApproval = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    // No preceding task identified for re-run with feedback
    const analysisApproval = await ctx.breakpoint({
    question: `FHA complete for ${projectName}. ${fha.hazards.length} hazards identified, ${fha.catastrophic} catastrophic. Proceed with PSSA?`,
    title: 'FHA Review',
    context: { runId: ctx.runId, fha },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_analysisApproval || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (analysisApproval.approved) break;
    lastFeedback_analysisApproval = analysisApproval.response || analysisApproval.feedback || 'Changes requested';
  }
  const pssa = await ctx.task(pssaTask, { projectName, fha, systemDefinition });
  const faultTreeAnalysis = await ctx.task(faultTreeTask, { projectName, pssa, systemDefinition });
  let ccaAnalysis = await ctx.task(ccaTask, { projectName, faultTreeAnalysis, systemDefinition });

      let lastFeedback_reviewApproval = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_reviewApproval) {
        ccaAnalysis = await ctx.task(ccaTask, { ...{ projectName, faultTreeAnalysis, systemDefinition }, feedback: lastFeedback_reviewApproval, attempt: attempt + 1 });
      }
  const reviewApproval = await ctx.breakpoint({
      question: `${ccaAnalysis.commonCauses.length} common cause failures identified. Review mitigation strategies?`,
      title: 'CCA Warning',
      context: { runId: ctx.runId, commonCauses: ccaAnalysis.commonCauses },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_reviewApproval || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (reviewApproval.approved) break;
      lastFeedback_reviewApproval = reviewApproval.response || reviewApproval.feedback || 'Changes requested';
    } }

  const fmeaAnalysis = await ctx.task(fmeaTask, { projectName, systemDefinition, pssa });
  const ddAnalysis = await ctx.task(ddAnalysisTask, { projectName, faultTreeAnalysis, fmeaAnalysis });
  const ssa = await ctx.task(ssaTask, { projectName, fha, pssa, faultTreeAnalysis, ccaAnalysis, fmeaAnalysis });
  let safetyCase = await ctx.task(safetyCaseTask, { projectName, fha, pssa, ssa, faultTreeAnalysis, ccaAnalysis });
    let lastFeedback_finalApproval = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_finalApproval) {
      safetyCase = await ctx.task(safetyCaseTask, { ...{ projectName, fha, pssa, ssa, faultTreeAnalysis, ccaAnalysis }, feedback: lastFeedback_finalApproval, attempt: attempt + 1 });
    }
  const finalApproval = await ctx.breakpoint({
    question: `Safety assessment complete for ${projectName}. All DAL requirements ${ssa.dalCompliant ? 'met' : 'NOT met'}. Approve?`,
    title: 'Safety Assessment Approval',
    context: { runId: ctx.runId, summary: { hazards: fha.hazards.length, catastrophic: fha.catastrophic, dalCompliant: ssa.dalCompliant } },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_finalApproval || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (finalApproval.approved) break;
    lastFeedback_finalApproval = finalApproval.response || finalApproval.feedback || 'Changes requested';
  }
  return { success: true, projectName, fha, pssa, ssa, safetyCase, report, metadata: { processId: 'safety-assessment-arp4761', timestamp: ctx.now() } };
}

export const fhaTask = defineTask('fha', (args, taskCtx) => ({
  kind: 'agent', title: `FHA - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Safety Engineer', task: 'Conduct Functional Hazard Assessment', context: args,
    instructions: ['1. Identify aircraft functions', '2. Identify failure conditions', '3. Classify severity (CAT/HAZ/MAJ/MIN/NSE)', '4. Assign probability objectives', '5. Document FHA'],
    outputFormat: 'JSON object with FHA results'
  }, outputSchema: { type: 'object', required: ['hazards', 'catastrophic'], properties: { hazards: { type: 'array', items: { type: 'object' } }, catastrophic: { type: 'number' }, hazardous: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['safety', 'aerospace', 'arp4761']
}));

export const pssaTask = defineTask('pssa', (args, taskCtx) => ({
  kind: 'agent', title: `PSSA - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'PSSA Engineer', task: 'Conduct Preliminary System Safety Assessment', context: args,
    instructions: ['1. Derive safety requirements', '2. Allocate requirements to systems', '3. Define DAL levels', '4. Identify architecture constraints', '5. Document PSSA'],
    outputFormat: 'JSON object with PSSA results'
  }, outputSchema: { type: 'object', required: ['safetyRequirements', 'dalAllocations'], properties: { safetyRequirements: { type: 'array', items: { type: 'object' } }, dalAllocations: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['safety', 'aerospace', 'arp4761']
}));

export const faultTreeTask = defineTask('fault-tree', (args, taskCtx) => ({
  kind: 'agent', title: `Fault Tree Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'FTA Engineer', task: 'Conduct Fault Tree Analysis', context: args,
    instructions: ['1. Define top events', '2. Develop fault trees', '3. Identify cut sets', '4. Calculate probabilities', '5. Identify single points of failure', '6. Document FTA'],
    outputFormat: 'JSON object with FTA results'
  }, outputSchema: { type: 'object', required: ['faultTrees', 'cutSets'], properties: { faultTrees: { type: 'array', items: { type: 'object' } }, cutSets: { type: 'array', items: { type: 'object' } }, singlePointFailures: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['safety', 'aerospace', 'arp4761']
}));

export const ccaTask = defineTask('cca', (args, taskCtx) => ({
  kind: 'agent', title: `CCA - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'CCA Engineer', task: 'Conduct Common Cause Analysis', context: args,
    instructions: ['1. Perform ZSA (Zonal Safety Analysis)', '2. Perform PRA (Particular Risks Analysis)', '3. Perform CMA (Common Mode Analysis)', '4. Identify common causes', '5. Define mitigation', '6. Document CCA'],
    outputFormat: 'JSON object with CCA results'
  }, outputSchema: { type: 'object', required: ['commonCauses'], properties: { commonCauses: { type: 'array', items: { type: 'object' } }, zsa: { type: 'object' }, pra: { type: 'object' }, cma: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['safety', 'aerospace', 'arp4761']
}));

export const fmeaTask = defineTask('fmea', (args, taskCtx) => ({
  kind: 'agent', title: `FMEA - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'FMEA Engineer', task: 'Conduct Failure Modes and Effects Analysis', context: args,
    instructions: ['1. Identify failure modes', '2. Analyze local effects', '3. Analyze system effects', '4. Determine severity', '5. Identify detection means', '6. Document FMEA'],
    outputFormat: 'JSON object with FMEA results'
  }, outputSchema: { type: 'object', required: ['failureModes'], properties: { failureModes: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['safety', 'aerospace', 'arp4761']
}));

export const ddAnalysisTask = defineTask('dd-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `DD Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Dependency Diagram Engineer', task: 'Conduct Dependency Diagram Analysis', context: args,
    instructions: ['1. Create dependency diagrams', '2. Identify functional dependencies', '3. Analyze cascading failures', '4. Verify independence', '5. Document analysis'],
    outputFormat: 'JSON object with DD analysis'
  }, outputSchema: { type: 'object', required: ['dependencies'], properties: { dependencies: { type: 'array', items: { type: 'object' } }, cascadingFailures: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['safety', 'aerospace', 'arp4761']
}));

export const ssaTask = defineTask('ssa', (args, taskCtx) => ({
  kind: 'agent', title: `SSA - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'SSA Engineer', task: 'Conduct System Safety Assessment', context: args,
    instructions: ['1. Verify safety requirements compliance', '2. Verify FTA results', '3. Verify CCA compliance', '4. Validate DAL compliance', '5. Document SSA'],
    outputFormat: 'JSON object with SSA results'
  }, outputSchema: { type: 'object', required: ['dalCompliant', 'verificationStatus'], properties: { dalCompliant: { type: 'boolean' }, verificationStatus: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['safety', 'aerospace', 'arp4761']
}));

export const safetyCaseTask = defineTask('safety-case', (args, taskCtx) => ({
  kind: 'agent', title: `Safety Case - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Safety Case Engineer', task: 'Build safety case', context: args,
    instructions: ['1. Define safety claims', '2. Structure safety arguments', '3. Link to evidence', '4. Address counter-arguments', '5. Document safety case'],
    outputFormat: 'JSON object with safety case'
  }, outputSchema: { type: 'object', required: ['claims', 'arguments'], properties: { claims: { type: 'array', items: { type: 'object' } }, arguments: { type: 'array', items: { type: 'object' } }, evidence: { type: 'array', items: { type: 'object' } } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['safety', 'aerospace', 'arp4761']
}));

export const safetyReportTask = defineTask('safety-report', (args, taskCtx) => ({
  kind: 'agent', title: `Safety Report - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Safety Report Author', task: 'Generate safety assessment report', context: args,
    instructions: ['1. Create executive summary', '2. Document FHA results', '3. Document PSSA results', '4. Document SSA results', '5. Present safety case', '6. Generate markdown'],
    outputFormat: 'JSON object with report'
  }, outputSchema: { type: 'object', required: ['report', 'markdown'], properties: { report: { type: 'object' }, markdown: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['safety', 'aerospace', 'arp4761']
}));

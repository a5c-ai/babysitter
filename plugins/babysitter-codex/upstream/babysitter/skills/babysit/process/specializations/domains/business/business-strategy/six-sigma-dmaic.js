/**
 * @process business-strategy/six-sigma-dmaic
 * @description Data-driven quality improvement methodology following Define, Measure, Analyze, Improve, Control phases
 * @inputs { problemStatement: string, projectScope: object, organizationContext: object, outputDir: string }
 * @outputs { success: boolean, dmaicPhases: object, rootCauses: array, solutions: array, controlPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemStatement = '',
    projectScope = {},
    organizationContext = {},
    outputDir = 'dmaic-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Six Sigma DMAIC Process');

  // Phase 1: DEFINE
  ctx.log('info', 'Phase 1: DEFINE - Defining the problem and project scope');
  const definePhase = await ctx.task(definePhaseTask, {
    problemStatement,
    projectScope,
    organizationContext,
    outputDir
  });
  artifacts.push(...definePhase.artifacts);

  // Phase 2: MEASURE
  ctx.log('info', 'Phase 2: MEASURE - Measuring current performance');
  const measurePhase = await ctx.task(measurePhaseTask, {
    definePhase,
    outputDir
  });
  artifacts.push(...measurePhase.artifacts);

  // Phase 3: ANALYZE
  ctx.log('info', 'Phase 3: ANALYZE - Analyzing root causes');
  const analyzePhase = await ctx.task(analyzePhaseTask, {
    definePhase,
    measurePhase,
    outputDir
  });
  artifacts.push(...analyzePhase.artifacts);

  // Breakpoint: Review analysis
  await ctx.breakpoint({
    question: `DMAIC analysis complete. ${analyzePhase.rootCauses.length} root causes identified. Proceed to improvement phase?`,
    title: 'DMAIC Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        baselineSigma: measurePhase.sigmaLevel,
        rootCauses: analyzePhase.rootCauses.length
      }
    }
  });

  // Phase 4: IMPROVE
  ctx.log('info', 'Phase 4: IMPROVE - Developing and implementing solutions');
  const improvePhase = await ctx.task(improvePhaseTask, {
    analyzePhase,
    definePhase,
    outputDir
  });
  artifacts.push(...improvePhase.artifacts);

  // Phase 5: CONTROL
  ctx.log('info', 'Phase 5: CONTROL - Sustaining improvements');
  const controlPhase = await ctx.task(controlPhaseTask, {
    improvePhase,
    measurePhase,
    outputDir
  });
  artifacts.push(...controlPhase.artifacts);

  // Generate DMAIC Report
  ctx.log('info', 'Generating DMAIC report');
  const dmaicReport = await ctx.task(dmaicReportTask, {
    definePhase,
    measurePhase,
    analyzePhase,
    improvePhase,
    controlPhase,
    outputDir
  });
  artifacts.push(...dmaicReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    dmaicPhases: {
      define: definePhase.summary,
      measure: measurePhase.summary,
      analyze: analyzePhase.summary,
      improve: improvePhase.summary,
      control: controlPhase.summary
    },
    rootCauses: analyzePhase.rootCauses,
    solutions: improvePhase.solutions,
    controlPlan: controlPhase.controlPlan,
    sigmaImprovement: {
      baseline: measurePhase.sigmaLevel,
      target: improvePhase.targetSigma
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'business-strategy/six-sigma-dmaic',
      timestamp: startTime
    }
  };
}

// Task Definitions
export const definePhaseTask = defineTask('define-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'DEFINE phase',
  agent: {
    name: 'six-sigma-black-belt',
    prompt: {
      role: 'Six Sigma Black Belt',
      task: 'Complete the DEFINE phase of DMAIC',
      context: args,
      instructions: [
        'Create project charter',
        'Define Voice of Customer (VOC)',
        'Identify Critical to Quality (CTQ) characteristics',
        'Create SIPOC diagram',
        'Define project scope and boundaries',
        'Save deliverables to output directory'
      ],
      outputFormat: 'JSON with charter (object), ctqs (array), sipoc (object), summary (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['charter', 'ctqs', 'summary', 'artifacts'],
      properties: {
        charter: { type: 'object' },
        ctqs: { type: 'array' },
        sipoc: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'define']
}));

export const measurePhaseTask = defineTask('measure-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'MEASURE phase',
  agent: {
    name: 'six-sigma-analyst',
    prompt: {
      role: 'Six Sigma measurement analyst',
      task: 'Complete the MEASURE phase of DMAIC',
      context: args,
      instructions: [
        'Define operational definitions for CTQs',
        'Create data collection plan',
        'Validate measurement system (MSA)',
        'Collect baseline data',
        'Calculate process capability and sigma level',
        'Save measurements to output directory'
      ],
      outputFormat: 'JSON with dataCollectionPlan (object), baselineData (object), sigmaLevel (number), processCapability (object), summary (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sigmaLevel', 'summary', 'artifacts'],
      properties: {
        dataCollectionPlan: { type: 'object' },
        baselineData: { type: 'object' },
        sigmaLevel: { type: 'number' },
        processCapability: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'measure']
}));

export const analyzePhaseTask = defineTask('analyze-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'ANALYZE phase',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'Six Sigma root cause analyst',
      task: 'Complete the ANALYZE phase of DMAIC',
      context: args,
      instructions: [
        'Perform process analysis',
        'Conduct statistical analysis',
        'Create fishbone diagram',
        'Perform 5 Whys analysis',
        'Validate root causes with data',
        'Prioritize root causes',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with rootCauses (array), statisticalAnalysis (object), fishbone (object), summary (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'summary', 'artifacts'],
      properties: {
        rootCauses: { type: 'array' },
        statisticalAnalysis: { type: 'object' },
        fishbone: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'analyze']
}));

export const improvePhaseTask = defineTask('improve-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'IMPROVE phase',
  agent: {
    name: 'improvement-specialist',
    prompt: {
      role: 'Six Sigma improvement specialist',
      task: 'Complete the IMPROVE phase of DMAIC',
      context: args,
      instructions: [
        'Generate solution alternatives',
        'Evaluate solutions (Pugh matrix)',
        'Design pilot test',
        'Implement solutions',
        'Validate improvements',
        'Calculate target sigma level',
        'Save improvements to output directory'
      ],
      outputFormat: 'JSON with solutions (array), pilotResults (object), targetSigma (number), summary (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['solutions', 'targetSigma', 'summary', 'artifacts'],
      properties: {
        solutions: { type: 'array' },
        pilotResults: { type: 'object' },
        targetSigma: { type: 'number' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'improve']
}));

export const controlPhaseTask = defineTask('control-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CONTROL phase',
  agent: {
    name: 'process-control-specialist',
    prompt: {
      role: 'Six Sigma process control specialist',
      task: 'Complete the CONTROL phase of DMAIC',
      context: args,
      instructions: [
        'Develop control plan',
        'Implement statistical process control (SPC)',
        'Create response plan',
        'Document standard operating procedures',
        'Transfer ownership to process owner',
        'Save control plan to output directory'
      ],
      outputFormat: 'JSON with controlPlan (object), spcCharts (array), responsePlan (object), summary (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['controlPlan', 'summary', 'artifacts'],
      properties: {
        controlPlan: { type: 'object' },
        spcCharts: { type: 'array' },
        responsePlan: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'control']
}));

export const dmaicReportTask = defineTask('dmaic-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate DMAIC report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'Six Sigma consultant and technical writer',
      task: 'Generate comprehensive DMAIC project report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document each DMAIC phase',
        'Include statistical analysis',
        'Present improvements achieved',
        'Include control plan',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'reporting']
}));

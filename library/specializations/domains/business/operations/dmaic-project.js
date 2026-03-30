/**
 * @process specializations/domains/business/operations/dmaic-project
 * @description DMAIC Project Execution Process - Execute Define-Measure-Analyze-Improve-Control methodology for
 * process improvement projects with tollgate reviews and documentation following Six Sigma principles.
 * @inputs { projectName: string, problemStatement?: string, scope?: string, targetMetric?: object, sponsor?: string }
 * @outputs { success: boolean, projectResults: object, improvements: array, controlPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/dmaic-project', {
 *   projectName: 'Reduce Defect Rate in Assembly',
 *   problemStatement: 'Assembly defect rate is 3.5%, target is 1%',
 *   scope: 'Assembly Line 1 processes',
 *   targetMetric: { name: 'defect-rate', current: 3.5, target: 1.0, unit: 'percent' },
 *   sponsor: 'VP Operations'
 * });
 *
 * @references
 * - Pyzdek, T. & Keller, P. (2018). The Six Sigma Handbook
 * - George, M.L. (2002). Lean Six Sigma
 * - Montgomery, D.C. (2019). Introduction to Statistical Quality Control
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    problemStatement = '',
    scope = '',
    targetMetric = null,
    sponsor = null,
    teamMembers = [],
    timeline = null,
    outputDir = 'dmaic-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting DMAIC Project: ${projectName}`);

  // ============================================================================
  // DEFINE PHASE
  // ============================================================================
  ctx.log('info', 'DEFINE Phase: Defining project scope and objectives');

  const definePhase = await ctx.task(definePhaseTask, {
    projectName,
    problemStatement,
    scope,
    targetMetric,
    sponsor,
    teamMembers,
    timeline,
    outputDir
  });

  artifacts.push(...definePhase.artifacts);

  // Define Phase Tollgate
  await ctx.breakpoint({
    question: `DEFINE tollgate: Project charter complete. Problem: ${definePhase.problemStatement}. Goal: ${definePhase.goalStatement}. Scope approved? Approve to proceed to MEASURE phase?`,
    title: 'DEFINE Phase Tollgate Review',
    context: {
      runId: ctx.runId,
      projectName,
      charter: definePhase.charter,
      sipoc: definePhase.sipoc,
      voc: definePhase.voiceOfCustomer,
      files: definePhase.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // MEASURE PHASE
  // ============================================================================
  ctx.log('info', 'MEASURE Phase: Measuring current process performance');

  const measurePhase = await ctx.task(measurePhaseTask, {
    projectName,
    definePhase,
    targetMetric,
    outputDir
  });

  artifacts.push(...measurePhase.artifacts);

  // Measure Phase Tollgate
  await ctx.breakpoint({
    question: `MEASURE tollgate: Baseline established. Current sigma: ${measurePhase.currentSigma}. Baseline: ${measurePhase.baseline}. Data validated? Approve to proceed to ANALYZE phase?`,
    title: 'MEASURE Phase Tollgate Review',
    context: {
      runId: ctx.runId,
      projectName,
      baseline: measurePhase.baseline,
      processCapability: measurePhase.processCapability,
      measurementSystem: measurePhase.msaResults,
      files: measurePhase.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // ANALYZE PHASE
  // ============================================================================
  ctx.log('info', 'ANALYZE Phase: Analyzing root causes');

  const analyzePhase = await ctx.task(analyzePhaseTask, {
    projectName,
    measurePhase,
    outputDir
  });

  artifacts.push(...analyzePhase.artifacts);

  // Analyze Phase Tollgate
  await ctx.breakpoint({
    question: `ANALYZE tollgate: ${analyzePhase.verifiedRootCauses.length} root causes verified. Primary: ${analyzePhase.primaryRootCause}. Statistical validation complete? Approve to proceed to IMPROVE phase?`,
    title: 'ANALYZE Phase Tollgate Review',
    context: {
      runId: ctx.runId,
      projectName,
      rootCauses: analyzePhase.verifiedRootCauses,
      statisticalAnalysis: analyzePhase.statisticalFindings,
      files: analyzePhase.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // IMPROVE PHASE
  // ============================================================================
  ctx.log('info', 'IMPROVE Phase: Implementing improvements');

  const improvePhase = await ctx.task(improvePhaseTask, {
    projectName,
    analyzePhase,
    targetMetric,
    outputDir
  });

  artifacts.push(...improvePhase.artifacts);

  // Improve Phase Tollgate
  await ctx.breakpoint({
    question: `IMPROVE tollgate: ${improvePhase.implementedSolutions.length} solutions implemented. Improvement: ${improvePhase.improvementPercentage}%. Pilot successful? Approve to proceed to CONTROL phase?`,
    title: 'IMPROVE Phase Tollgate Review',
    context: {
      runId: ctx.runId,
      projectName,
      solutions: improvePhase.implementedSolutions,
      pilotResults: improvePhase.pilotResults,
      files: improvePhase.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // CONTROL PHASE
  // ============================================================================
  ctx.log('info', 'CONTROL Phase: Sustaining improvements');

  const controlPhase = await ctx.task(controlPhaseTask, {
    projectName,
    improvePhase,
    measurePhase,
    outputDir
  });

  artifacts.push(...controlPhase.artifacts);

  // Control Phase Tollgate
  await ctx.breakpoint({
    question: `CONTROL tollgate: Control plan established. Final sigma: ${controlPhase.finalSigma}. Improvement sustained: ${controlPhase.improvementSustained}. Approve project closure?`,
    title: 'CONTROL Phase Tollgate Review',
    context: {
      runId: ctx.runId,
      projectName,
      controlPlan: controlPhase.controlPlan,
      finalResults: controlPhase.finalResults,
      files: controlPhase.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PROJECT CLOSEOUT
  // ============================================================================
  ctx.log('info', 'Project Closeout: Generating final report');

  const closeout = await ctx.task(projectCloseoutTask, {
    projectName,
    definePhase,
    measurePhase,
    analyzePhase,
    improvePhase,
    controlPhase,
    outputDir
  });

  artifacts.push(...closeout.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    projectResults: {
      baselineSigma: measurePhase.currentSigma,
      finalSigma: controlPhase.finalSigma,
      sigmaImprovement: controlPhase.finalSigma - measurePhase.currentSigma,
      baselineMetric: measurePhase.baseline,
      finalMetric: controlPhase.finalResults.currentMetric,
      improvementPercentage: improvePhase.improvementPercentage,
      financialBenefit: closeout.financialBenefit
    },
    phases: {
      define: { status: 'complete', charter: definePhase.charter },
      measure: { status: 'complete', baseline: measurePhase.baseline, capability: measurePhase.processCapability },
      analyze: { status: 'complete', rootCauses: analyzePhase.verifiedRootCauses },
      improve: { status: 'complete', solutions: improvePhase.implementedSolutions },
      control: { status: 'complete', controlPlan: controlPhase.controlPlan }
    },
    improvements: improvePhase.implementedSolutions,
    controlPlan: controlPhase.controlPlan,
    lessonsLearned: closeout.lessonsLearned,
    artifacts,
    reportPath: closeout.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/dmaic-project',
      timestamp: startTime,
      outputDir
    }
  };
}

// DEFINE Phase Task
export const definePhaseTask = defineTask('dmaic-define', (args, taskCtx) => ({
  kind: 'agent',
  title: `DMAIC DEFINE - ${args.projectName}`,
  agent: {
    name: 'six-sigma-black-belt',
    prompt: {
      role: 'Six Sigma Black Belt',
      task: 'Execute DEFINE phase of DMAIC project',
      context: args,
      instructions: [
        '1. Develop project charter with business case',
        '2. Define problem statement (specific, measurable)',
        '3. Create goal statement with SMART criteria',
        '4. Define project scope and boundaries',
        '5. Create SIPOC diagram',
        '6. Identify Voice of Customer (VOC)',
        '7. Translate VOC to CTQ (Critical to Quality)',
        '8. Create project timeline',
        '9. Define team roles and responsibilities',
        '10. Get sponsor approval'
      ],
      outputFormat: 'JSON with DEFINE phase deliverables'
    },
    outputSchema: {
      type: 'object',
      required: ['charter', 'problemStatement', 'goalStatement', 'sipoc', 'voiceOfCustomer', 'artifacts'],
      properties: {
        charter: { type: 'object' },
        problemStatement: { type: 'string' },
        goalStatement: { type: 'string' },
        sipoc: { type: 'object' },
        voiceOfCustomer: { type: 'object' },
        ctqTree: { type: 'object' },
        projectTimeline: { type: 'object' },
        teamRoles: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'define', 'six-sigma']
}));

// MEASURE Phase Task
export const measurePhaseTask = defineTask('dmaic-measure', (args, taskCtx) => ({
  kind: 'agent',
  title: `DMAIC MEASURE - ${args.projectName}`,
  agent: {
    name: 'six-sigma-black-belt',
    prompt: {
      role: 'Six Sigma Black Belt',
      task: 'Execute MEASURE phase of DMAIC project',
      context: args,
      instructions: [
        '1. Develop data collection plan',
        '2. Validate measurement system (MSA/Gage R&R)',
        '3. Collect baseline data',
        '4. Calculate baseline performance',
        '5. Calculate process capability (Cp, Cpk)',
        '6. Calculate sigma level',
        '7. Create detailed process map',
        '8. Identify key process input variables (KPIVs)',
        '9. Create cause and effect matrix',
        '10. Document measurement results'
      ],
      outputFormat: 'JSON with MEASURE phase deliverables'
    },
    outputSchema: {
      type: 'object',
      required: ['baseline', 'currentSigma', 'processCapability', 'msaResults', 'artifacts'],
      properties: {
        dataCollectionPlan: { type: 'object' },
        msaResults: { type: 'object' },
        baseline: { type: 'number' },
        currentSigma: { type: 'number' },
        processCapability: {
          type: 'object',
          properties: {
            cp: { type: 'number' },
            cpk: { type: 'number' },
            ppk: { type: 'number' }
          }
        },
        processMap: { type: 'object' },
        kpivs: { type: 'array', items: { type: 'object' } },
        causeEffectMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'measure', 'six-sigma']
}));

// ANALYZE Phase Task
export const analyzePhaseTask = defineTask('dmaic-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: `DMAIC ANALYZE - ${args.projectName}`,
  agent: {
    name: 'six-sigma-black-belt',
    prompt: {
      role: 'Six Sigma Black Belt',
      task: 'Execute ANALYZE phase of DMAIC project',
      context: args,
      instructions: [
        '1. Analyze data graphically (histograms, Pareto, scatter)',
        '2. Perform hypothesis testing',
        '3. Conduct regression analysis',
        '4. Perform ANOVA if applicable',
        '5. Create fishbone diagram',
        '6. Apply 5 Whys analysis',
        '7. Conduct FMEA',
        '8. Verify root causes with data',
        '9. Prioritize root causes',
        '10. Document analysis findings'
      ],
      outputFormat: 'JSON with ANALYZE phase deliverables'
    },
    outputSchema: {
      type: 'object',
      required: ['verifiedRootCauses', 'primaryRootCause', 'statisticalFindings', 'artifacts'],
      properties: {
        graphicalAnalysis: { type: 'object' },
        hypothesisTests: { type: 'array', items: { type: 'object' } },
        regressionResults: { type: 'object' },
        fishboneDiagram: { type: 'object' },
        fiveWhys: { type: 'array', items: { type: 'object' } },
        fmea: { type: 'object' },
        verifiedRootCauses: { type: 'array', items: { type: 'object' } },
        primaryRootCause: { type: 'string' },
        statisticalFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'analyze', 'six-sigma']
}));

// IMPROVE Phase Task
export const improvePhaseTask = defineTask('dmaic-improve', (args, taskCtx) => ({
  kind: 'agent',
  title: `DMAIC IMPROVE - ${args.projectName}`,
  agent: {
    name: 'six-sigma-black-belt',
    prompt: {
      role: 'Six Sigma Black Belt',
      task: 'Execute IMPROVE phase of DMAIC project',
      context: args,
      instructions: [
        '1. Generate solution ideas',
        '2. Evaluate solutions using criteria matrix',
        '3. Conduct DOE (Design of Experiments) if needed',
        '4. Select optimal solutions',
        '5. Develop implementation plan',
        '6. Conduct risk assessment',
        '7. Pilot solutions',
        '8. Validate improvement with data',
        '9. Calculate improvement percentage',
        '10. Document improvement results'
      ],
      outputFormat: 'JSON with IMPROVE phase deliverables'
    },
    outputSchema: {
      type: 'object',
      required: ['implementedSolutions', 'pilotResults', 'improvementPercentage', 'artifacts'],
      properties: {
        solutionIdeas: { type: 'array', items: { type: 'object' } },
        solutionMatrix: { type: 'object' },
        doeResults: { type: 'object' },
        selectedSolutions: { type: 'array', items: { type: 'object' } },
        implementationPlan: { type: 'object' },
        riskAssessment: { type: 'object' },
        pilotResults: { type: 'object' },
        implementedSolutions: { type: 'array', items: { type: 'object' } },
        improvementPercentage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'improve', 'six-sigma']
}));

// CONTROL Phase Task
export const controlPhaseTask = defineTask('dmaic-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `DMAIC CONTROL - ${args.projectName}`,
  agent: {
    name: 'six-sigma-black-belt',
    prompt: {
      role: 'Six Sigma Black Belt',
      task: 'Execute CONTROL phase of DMAIC project',
      context: args,
      instructions: [
        '1. Develop control plan',
        '2. Implement statistical process control (SPC)',
        '3. Create control charts',
        '4. Define response plan for out-of-control conditions',
        '5. Update standard operating procedures',
        '6. Train process owners',
        '7. Establish monitoring system',
        '8. Calculate final sigma level',
        '9. Verify improvement is sustained',
        '10. Transition to process owner'
      ],
      outputFormat: 'JSON with CONTROL phase deliverables'
    },
    outputSchema: {
      type: 'object',
      required: ['controlPlan', 'finalSigma', 'improvementSustained', 'finalResults', 'artifacts'],
      properties: {
        controlPlan: { type: 'object' },
        controlCharts: { type: 'array', items: { type: 'object' } },
        responsePlan: { type: 'object' },
        updatedSops: { type: 'array', items: { type: 'string' } },
        trainingCompleted: { type: 'boolean' },
        monitoringSystem: { type: 'object' },
        finalSigma: { type: 'number' },
        improvementSustained: { type: 'boolean' },
        finalResults: {
          type: 'object',
          properties: {
            currentMetric: { type: 'number' },
            capability: { type: 'object' }
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
  labels: ['agent', 'dmaic', 'control', 'six-sigma']
}));

// Project Closeout Task
export const projectCloseoutTask = defineTask('dmaic-closeout', (args, taskCtx) => ({
  kind: 'agent',
  title: `DMAIC Closeout - ${args.projectName}`,
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'Six Sigma Project Manager',
      task: 'Close out DMAIC project',
      context: args,
      instructions: [
        '1. Compile project storyboard',
        '2. Calculate financial benefits',
        '3. Document lessons learned',
        '4. Identify replication opportunities',
        '5. Create final presentation',
        '6. Archive project documentation',
        '7. Celebrate team success',
        '8. Submit for belt certification if applicable',
        '9. Plan follow-up audits',
        '10. Generate final report'
      ],
      outputFormat: 'JSON with closeout deliverables'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'financialBenefit', 'lessonsLearned', 'artifacts'],
      properties: {
        storyboard: { type: 'object' },
        financialBenefit: { type: 'number' },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        replicationOpportunities: { type: 'array', items: { type: 'string' } },
        finalPresentation: { type: 'string' },
        archiveLocation: { type: 'string' },
        followUpPlan: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dmaic', 'closeout', 'six-sigma']
}));

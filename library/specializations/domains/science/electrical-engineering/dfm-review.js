/**
 * @process specializations/domains/science/electrical-engineering/dfm-review
 * @description Design for Manufacturing Review - Guide systematic DFM/DFA review for PCB and electronic assemblies.
 * Covers component selection, PCB layout rules, assembly considerations, test coverage, and cost optimization.
 * @inputs { projectName: string, designFiles: object, manufacturingTarget: object, reviewScope?: string }
 * @outputs { success: boolean, dfmAnalysis: object, dfaAnalysis: object, costAnalysis: object, recommendations: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/dfm-review', {
 *   projectName: 'Power Supply Module',
 *   designFiles: { schematic: 'power-supply.sch', layout: 'power-supply.brd' },
 *   manufacturingTarget: { volume: '10000/year', assembler: 'standard-smt' },
 *   reviewScope: 'full'
 * });
 *
 * @references
 * - IPC-2221 (PCB Design Standard)
 * - IPC-A-610 (Acceptability of Electronic Assemblies)
 * - IPC-7351 (Land Pattern Standard)
 * - DFM Guidelines for Electronics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    designFiles,
    manufacturingTarget,
    reviewScope = 'standard'
  } = inputs;

  // Phase 1: Component Selection Review
  const componentReview = await ctx.task(componentReviewTask, {
    projectName,
    designFiles,
    manufacturingTarget
  });

  // Phase 2: PCB Fabrication Review
  const fabricationReview = await ctx.task(fabricationReviewTask, {
    projectName,
    designFiles,
    manufacturingTarget
  });

  // Breakpoint: Review component and fabrication findings
  await ctx.breakpoint({
    question: `DFM review for ${projectName}. Component issues: ${componentReview.issues.length}. Fabrication issues: ${fabricationReview.issues.length}. Proceed with assembly review?`,
    title: 'DFM Initial Review',
    context: {
      runId: ctx.runId,
      projectName,
      componentReview,
      fabricationReview,
      files: [{
        path: `artifacts/phase2-fabrication.json`,
        format: 'json',
        content: { component: componentReview, fabrication: fabricationReview }
      }]
    }
  });

  // Phase 3: Assembly Process Review (DFA)
  const assemblyReview = await ctx.task(assemblyReviewTask, {
    projectName,
    designFiles,
    manufacturingTarget,
    componentData: componentReview.components
  });

  // Phase 4: Solder Joint and Thermal Review
  const solderThermalReview = await ctx.task(solderThermalReviewTask, {
    projectName,
    designFiles,
    assemblyData: assemblyReview.results
  });

  // Phase 5: Test Coverage Analysis
  const testCoverageAnalysis = await ctx.task(testCoverageAnalysisTask, {
    projectName,
    designFiles,
    manufacturingTarget
  });

  // Breakpoint: Review assembly and test findings
  await ctx.breakpoint({
    question: `Assembly issues: ${assemblyReview.issues.length}. Test coverage: ${testCoverageAnalysis.coverage}%. Proceed with cost analysis?`,
    title: 'DFA and Test Review',
    context: {
      runId: ctx.runId,
      assemblyReview,
      testCoverageAnalysis,
      files: [
        { path: `artifacts/phase3-assembly.json`, format: 'json', content: assemblyReview },
        { path: `artifacts/phase5-testcoverage.json`, format: 'json', content: testCoverageAnalysis }
      ]
    }
  });

  // Phase 6: Cost Optimization Analysis
  const costOptimization = await ctx.task(costOptimizationTask, {
    projectName,
    componentData: componentReview.components,
    fabricationData: fabricationReview.results,
    assemblyData: assemblyReview.results,
    manufacturingTarget
  });

  // Phase 7: Risk Assessment
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    componentReview,
    fabricationReview,
    assemblyReview,
    testCoverageAnalysis,
    manufacturingTarget
  });

  // Quality Gate: Critical issues check
  const criticalIssues = [
    ...componentReview.issues.filter(i => i.severity === 'critical'),
    ...fabricationReview.issues.filter(i => i.severity === 'critical'),
    ...assemblyReview.issues.filter(i => i.severity === 'critical')
  ];

  if (criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `${criticalIssues.length} critical DFM issues found. Design changes required before manufacturing. Review critical issues?`,
      title: 'Critical DFM Issues',
      context: {
        runId: ctx.runId,
        criticalIssues,
        recommendations: riskAssessment.recommendations
      }
    });
  }

  // Phase 8: Generate DFM Report
  const dfmReport = await ctx.task(dfmReportTask, {
    projectName,
    dfmAnalysis: {
      component: componentReview,
      fabrication: fabricationReview
    },
    dfaAnalysis: {
      assembly: assemblyReview,
      solderThermal: solderThermalReview
    },
    testCoverage: testCoverageAnalysis,
    costOptimization,
    riskAssessment
  });

  // Final Breakpoint: DFM Approval
  await ctx.breakpoint({
    question: `DFM review complete for ${projectName}. Manufacturing readiness: ${dfmReport.readinessLevel}. Approve design for manufacturing?`,
    title: 'DFM Approval',
    context: {
      runId: ctx.runId,
      projectName,
      summary: dfmReport.summary,
      files: [
        { path: `artifacts/dfm-analysis.json`, format: 'json', content: { dfm: componentReview, dfa: assemblyReview } },
        { path: `artifacts/dfm-report.md`, format: 'markdown', content: dfmReport.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    dfmAnalysis: {
      component: componentReview.results,
      fabrication: fabricationReview.results
    },
    dfaAnalysis: {
      assembly: assemblyReview.results,
      solderThermal: solderThermalReview.results
    },
    costAnalysis: costOptimization.results,
    recommendations: {
      critical: criticalIssues,
      improvements: dfmReport.improvements,
      riskMitigation: riskAssessment.mitigations
    },
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/dfm-review',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const componentReviewTask = defineTask('component-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Component Selection Review - ${args.projectName}`,
  agent: {
    name: 'pcb-layout-engineer',
    prompt: {
      role: 'DFM Component Engineer',
      task: 'Review component selection for manufacturability',
      context: args,
      instructions: [
        '1. Check component availability and lead times',
        '2. Review component lifecycle status',
        '3. Check for single-source components',
        '4. Verify component package compatibility',
        '5. Review moisture sensitivity levels',
        '6. Check ESD sensitivity requirements',
        '7. Verify component tolerances',
        '8. Review component standardization',
        '9. Check for obsolete or NRND parts',
        '10. Document component review findings'
      ],
      outputFormat: 'JSON object with component review results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'components', 'issues'],
      properties: {
        results: { type: 'object' },
        components: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'dfm', 'components']
}));

export const fabricationReviewTask = defineTask('fabrication-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: PCB Fabrication Review - ${args.projectName}`,
  agent: {
    name: 'pcb-layout-engineer',
    prompt: {
      role: 'PCB Fabrication Engineer',
      task: 'Review PCB design for fabrication',
      context: args,
      instructions: [
        '1. Check trace widths and spacing',
        '2. Review via sizes and aspect ratios',
        '3. Check drill sizes and tolerances',
        '4. Review layer stackup',
        '5. Check impedance control requirements',
        '6. Review copper balance',
        '7. Check silkscreen clearances',
        '8. Review solder mask requirements',
        '9. Check board outline and routing',
        '10. Document fabrication review findings'
      ],
      outputFormat: 'JSON object with fabrication review results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'issues'],
      properties: {
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'dfm', 'fabrication']
}));

export const assemblyReviewTask = defineTask('assembly-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Assembly Process Review - ${args.projectName}`,
  agent: {
    name: 'pcb-layout-engineer',
    prompt: {
      role: 'Assembly Process Engineer',
      task: 'Review design for assembly (DFA)',
      context: args,
      instructions: [
        '1. Review component placement orientation',
        '2. Check fiducial mark placement',
        '3. Review pad sizes for reflow',
        '4. Check component spacing for rework',
        '5. Review wave solder considerations',
        '6. Check for shadowing effects',
        '7. Review paste stencil requirements',
        '8. Check pick-and-place compatibility',
        '9. Review panel design',
        '10. Document assembly review findings'
      ],
      outputFormat: 'JSON object with assembly review results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'issues'],
      properties: {
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'dfm', 'assembly']
}));

export const solderThermalReviewTask = defineTask('solder-thermal-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Solder and Thermal Review - ${args.projectName}`,
  agent: {
    name: 'pcb-layout-engineer',
    prompt: {
      role: 'Soldering Process Engineer',
      task: 'Review solder joint and thermal considerations',
      context: args,
      instructions: [
        '1. Review solder paste volume requirements',
        '2. Check thermal relief patterns',
        '3. Review reflow profile compatibility',
        '4. Check for thermal mass imbalance',
        '5. Review BGA/QFN pad design',
        '6. Check via-in-pad requirements',
        '7. Review thermal pad design',
        '8. Check solder joint reliability',
        '9. Review conformal coating considerations',
        '10. Document solder/thermal review findings'
      ],
      outputFormat: 'JSON object with solder/thermal review results'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'dfm', 'solder']
}));

export const testCoverageAnalysisTask = defineTask('test-coverage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Test Coverage Analysis - ${args.projectName}`,
  agent: {
    name: 'pcb-layout-engineer',
    prompt: {
      role: 'Test Engineering Manager',
      task: 'Analyze test coverage and testability',
      context: args,
      instructions: [
        '1. Review ICT test point access',
        '2. Check boundary scan coverage',
        '3. Review functional test access',
        '4. Check bed-of-nails compatibility',
        '5. Review flying probe accessibility',
        '6. Check AOI/AXI coverage',
        '7. Review programming access',
        '8. Check calibration points',
        '9. Analyze test coverage percentage',
        '10. Document test coverage findings'
      ],
      outputFormat: 'JSON object with test coverage analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['coverage', 'results'],
      properties: {
        coverage: { type: 'string' },
        results: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'dfm', 'test-coverage']
}));

export const costOptimizationTask = defineTask('cost-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Cost Optimization Analysis - ${args.projectName}`,
  agent: {
    name: 'pcb-layout-engineer',
    prompt: {
      role: 'Cost Optimization Engineer',
      task: 'Analyze and optimize manufacturing cost',
      context: args,
      instructions: [
        '1. Analyze BOM cost breakdown',
        '2. Identify cost reduction opportunities',
        '3. Review PCB fabrication cost drivers',
        '4. Analyze assembly cost factors',
        '5. Review test cost impact',
        '6. Identify component consolidation',
        '7. Analyze yield impact',
        '8. Review logistics and supply chain',
        '9. Calculate total landed cost',
        '10. Document cost optimization recommendations'
      ],
      outputFormat: 'JSON object with cost optimization analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'savings'],
      properties: {
        results: { type: 'object' },
        savings: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'dfm', 'cost']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Manufacturing Risk Assessment - ${args.projectName}`,
  agent: {
    name: 'pcb-layout-engineer',
    prompt: {
      role: 'Manufacturing Risk Analyst',
      task: 'Assess manufacturing risks',
      context: args,
      instructions: [
        '1. Assess supply chain risks',
        '2. Evaluate component obsolescence risk',
        '3. Review yield risk factors',
        '4. Assess quality risk areas',
        '5. Evaluate regulatory compliance risks',
        '6. Review scalability risks',
        '7. Assess tooling and fixture risks',
        '8. Evaluate process capability risks',
        '9. Develop risk mitigation strategies',
        '10. Document risk assessment'
      ],
      outputFormat: 'JSON object with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'mitigations', 'recommendations'],
      properties: {
        risks: { type: 'array', items: { type: 'object' } },
        mitigations: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'dfm', 'risk']
}));

export const dfmReportTask = defineTask('dfm-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: DFM Report Generation - ${args.projectName}`,
  agent: {
    name: 'pcb-layout-engineer',
    prompt: {
      role: 'DFM Review Lead',
      task: 'Generate comprehensive DFM report',
      context: args,
      instructions: [
        '1. Summarize component review findings',
        '2. Summarize fabrication review findings',
        '3. Summarize assembly review findings',
        '4. Summarize test coverage analysis',
        '5. Summarize cost optimization findings',
        '6. Summarize risk assessment',
        '7. Provide prioritized recommendations',
        '8. Assess manufacturing readiness level',
        '9. Define action items with owners',
        '10. Create comprehensive DFM report'
      ],
      outputFormat: 'JSON object with DFM report'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessLevel', 'summary'],
      properties: {
        readinessLevel: { type: 'string' },
        summary: { type: 'string' },
        improvements: { type: 'array', items: { type: 'object' } },
        markdown: { type: 'string' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'dfm', 'report']
}));

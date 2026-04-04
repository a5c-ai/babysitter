/**
 * @process specializations/domains/science/electrical-engineering/power-flow-analysis
 * @description Power Flow and Load Analysis - Guide the analysis of electrical power systems for load flow studies,
 * voltage profiles, and power transfer capabilities. Essential for system planning, operation, and expansion studies.
 * @inputs { systemName: string, networkModel: object, loadData: object, generationSchedule?: object }
 * @outputs { success: boolean, powerFlowResults: object, voltageProfiles: object, contingencyResults: object, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/power-flow-analysis', {
 *   systemName: 'Regional Distribution Network',
 *   networkModel: { buses: 50, branches: 65, transformers: 12 },
 *   loadData: { peakLoad: '150MW', loadGrowth: '3%/year' },
 *   generationSchedule: { units: ['G1', 'G2'], totalCapacity: '200MW' }
 * });
 *
 * @references
 * - IEEE Power System Analysis Standards
 * - NERC Reliability Standards
 * - Regional Grid Codes
 * - ETAP/PSS/E User Guides
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    networkModel,
    loadData,
    generationSchedule = {}
  } = inputs;

  // Phase 1: Develop Single-Line Diagram and System Model
  const systemModeling = await ctx.task(systemModelingTask, {
    systemName,
    networkModel,
    loadData,
    generationSchedule
  });

  // Quality Gate: Model must be complete
  if (!systemModeling.modelComplete) {
    return {
      success: false,
      error: 'System model incomplete',
      phase: 'system-modeling',
      missingData: systemModeling.missingData
    };
  }

  // Breakpoint: Review system model
  await ctx.breakpoint({
    question: `Review system model for ${systemName}. ${systemModeling.busCount} buses, ${systemModeling.branchCount} branches. Proceed with data gathering?`,
    title: 'System Model Review',
    context: {
      runId: ctx.runId,
      systemName,
      modelSummary: systemModeling.summary,
      files: [{
        path: `artifacts/phase1-system-model.json`,
        format: 'json',
        content: systemModeling
      }]
    }
  });

  // Phase 2: Gather Load Data and Generation Schedules
  const dataGathering = await ctx.task(dataGatheringTask, {
    systemName,
    systemModel: systemModeling.model,
    loadData,
    generationSchedule
  });

  // Phase 3: Configure Power Flow Solver Parameters
  const solverConfiguration = await ctx.task(solverConfigurationTask, {
    systemName,
    systemModel: systemModeling.model,
    loadProfile: dataGathering.loadProfile,
    generationDispatch: dataGathering.generationDispatch
  });

  // Phase 4: Run Base Case Power Flow Analysis
  const baseCasePowerFlow = await ctx.task(baseCasePowerFlowTask, {
    systemName,
    systemModel: systemModeling.model,
    loadProfile: dataGathering.loadProfile,
    generationDispatch: dataGathering.generationDispatch,
    solverSettings: solverConfiguration.settings
  });

  // Quality Gate: Power flow must converge
  if (!baseCasePowerFlow.converged) {
    await ctx.breakpoint({
      question: `Base case power flow did not converge. ${baseCasePowerFlow.convergenceIssue}. Adjust model or solver settings?`,
      title: 'Convergence Issue',
      context: {
        runId: ctx.runId,
        convergenceDetails: baseCasePowerFlow.convergenceDetails,
        recommendations: baseCasePowerFlow.recommendations
      }
    });
  }

  // Breakpoint: Review base case results
  await ctx.breakpoint({
    question: `Base case power flow complete for ${systemName}. Total losses: ${baseCasePowerFlow.totalLosses}. Review results?`,
    title: 'Base Case Results Review',
    context: {
      runId: ctx.runId,
      summary: baseCasePowerFlow.summary,
      voltageRange: baseCasePowerFlow.voltageRange,
      files: [{
        path: `artifacts/phase4-basecase.json`,
        format: 'json',
        content: baseCasePowerFlow
      }]
    }
  });

  // Phase 5: Analyze Voltage Profiles and Power Losses
  const voltageAndLossAnalysis = await ctx.task(voltageAndLossAnalysisTask, {
    systemName,
    powerFlowResults: baseCasePowerFlow.results,
    systemModel: systemModeling.model
  });

  // Phase 6: Perform Contingency Analysis (N-1, N-2)
  const contingencyAnalysis = await ctx.task(contingencyAnalysisTask, {
    systemName,
    systemModel: systemModeling.model,
    baseCaseResults: baseCasePowerFlow.results,
    loadProfile: dataGathering.loadProfile,
    solverSettings: solverConfiguration.settings
  });

  // Quality Gate: Check for critical contingencies
  if (contingencyAnalysis.criticalContingencies && contingencyAnalysis.criticalContingencies.length > 0) {
    await ctx.breakpoint({
      question: `Contingency analysis found ${contingencyAnalysis.criticalContingencies.length} critical contingencies causing violations. Review and plan mitigations?`,
      title: 'Critical Contingencies Found',
      context: {
        runId: ctx.runId,
        criticalContingencies: contingencyAnalysis.criticalContingencies,
        violations: contingencyAnalysis.worstViolations
      }
    });
  }

  // Phase 7: Identify Congestion and Voltage Violations
  const violationIdentification = await ctx.task(violationIdentificationTask, {
    systemName,
    baseCaseResults: baseCasePowerFlow.results,
    contingencyResults: contingencyAnalysis.results,
    voltageAnalysis: voltageAndLossAnalysis.voltageAnalysis
  });

  // Phase 8: Recommend System Improvements and Document Results
  const recommendationsAndDocumentation = await ctx.task(recommendationsAndDocumentationTask, {
    systemName,
    systemModeling,
    dataGathering,
    baseCasePowerFlow,
    voltageAndLossAnalysis,
    contingencyAnalysis,
    violationIdentification
  });

  // Final Breakpoint: Analysis Approval
  await ctx.breakpoint({
    question: `Power flow analysis complete for ${systemName}. ${violationIdentification.totalViolations} violations identified. Approve analysis report?`,
    title: 'Analysis Approval',
    context: {
      runId: ctx.runId,
      systemName,
      analysisScore: recommendationsAndDocumentation.systemHealthScore,
      keyFindings: recommendationsAndDocumentation.keyFindings,
      files: [
        { path: `artifacts/final-analysis.json`, format: 'json', content: baseCasePowerFlow.results },
        { path: `artifacts/analysis-report.md`, format: 'markdown', content: recommendationsAndDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    systemName,
    powerFlowResults: {
      baseCase: baseCasePowerFlow.results,
      converged: baseCasePowerFlow.converged,
      totalLosses: baseCasePowerFlow.totalLosses
    },
    voltageProfiles: voltageAndLossAnalysis.voltageProfiles,
    lossAnalysis: voltageAndLossAnalysis.lossAnalysis,
    contingencyResults: {
      n1Results: contingencyAnalysis.n1Results,
      n2Results: contingencyAnalysis.n2Results,
      criticalContingencies: contingencyAnalysis.criticalContingencies
    },
    violations: violationIdentification.violations,
    recommendations: recommendationsAndDocumentation.recommendations,
    systemHealthScore: recommendationsAndDocumentation.systemHealthScore,
    documentation: recommendationsAndDocumentation.document,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/power-flow-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const systemModelingTask = defineTask('system-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: System Modeling - ${args.systemName}`,
  agent: {
    name: 'power-systems-engineer',
    prompt: {
      role: 'Power Systems Engineer with expertise in network modeling',
      task: 'Develop single-line diagram and system model for power flow analysis',
      context: {
        systemName: args.systemName,
        networkModel: args.networkModel,
        loadData: args.loadData,
        generationSchedule: args.generationSchedule
      },
      instructions: [
        '1. Create single-line diagram representation of the power system',
        '2. Define bus data (types: slack, PV, PQ; voltages, angles)',
        '3. Define branch data (lines, transformers: impedances, ratings)',
        '4. Model generators with capability curves and limits',
        '5. Model loads with real and reactive power',
        '6. Include shunt elements (capacitors, reactors)',
        '7. Define transformer tap settings and phase shifters',
        '8. Model HVDC links if applicable',
        '9. Verify model connectivity and data consistency',
        '10. Document model assumptions and simplifications'
      ],
      outputFormat: 'JSON object with complete system model'
    },
    outputSchema: {
      type: 'object',
      required: ['modelComplete', 'model', 'busCount', 'branchCount'],
      properties: {
        modelComplete: { type: 'boolean' },
        model: {
          type: 'object',
          properties: {
            buses: { type: 'array', items: { type: 'object' } },
            branches: { type: 'array', items: { type: 'object' } },
            generators: { type: 'array', items: { type: 'object' } },
            loads: { type: 'array', items: { type: 'object' } },
            shunts: { type: 'array', items: { type: 'object' } }
          }
        },
        busCount: { type: 'number' },
        branchCount: { type: 'number' },
        summary: { type: 'string' },
        missingData: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-systems', 'modeling']
}));

export const dataGatheringTask = defineTask('data-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Data Gathering - ${args.systemName}`,
  agent: {
    name: 'power-systems-engineer',
    prompt: {
      role: 'Power Systems Data Analyst',
      task: 'Gather and validate load data and generation schedules',
      context: {
        systemName: args.systemName,
        systemModel: args.systemModel,
        loadData: args.loadData,
        generationSchedule: args.generationSchedule
      },
      instructions: [
        '1. Collect historical load data and identify peak conditions',
        '2. Develop load profiles (daily, seasonal, annual)',
        '3. Allocate loads to individual buses based on metering',
        '4. Gather generation dispatch schedules',
        '5. Collect generator reactive capability data',
        '6. Identify load power factors and correction requirements',
        '7. Account for distributed generation and demand response',
        '8. Validate data against system measurements',
        '9. Identify data gaps and apply estimation methods',
        '10. Document data sources and quality assessment'
      ],
      outputFormat: 'JSON object with load and generation data'
    },
    outputSchema: {
      type: 'object',
      required: ['loadProfile', 'generationDispatch'],
      properties: {
        loadProfile: {
          type: 'object',
          properties: {
            peakLoad: { type: 'string' },
            loadByBus: { type: 'array', items: { type: 'object' } },
            powerFactor: { type: 'number' },
            loadCurve: { type: 'array', items: { type: 'object' } }
          }
        },
        generationDispatch: {
          type: 'object',
          properties: {
            totalGeneration: { type: 'string' },
            unitCommitment: { type: 'array', items: { type: 'object' } },
            reserveMargin: { type: 'string' }
          }
        },
        dataQuality: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-systems', 'data-analysis']
}));

export const solverConfigurationTask = defineTask('solver-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Solver Configuration - ${args.systemName}`,
  agent: {
    name: 'power-systems-engineer',
    prompt: {
      role: 'Power Flow Analysis Expert',
      task: 'Configure power flow solver parameters for analysis',
      context: {
        systemName: args.systemName,
        systemModel: args.systemModel,
        loadProfile: args.loadProfile,
        generationDispatch: args.generationDispatch
      },
      instructions: [
        '1. Select appropriate power flow solution method (Newton-Raphson, Fast Decoupled, DC)',
        '2. Configure convergence tolerance settings',
        '3. Set iteration limits and acceleration factors',
        '4. Define voltage limits for PQ to PV switching',
        '5. Configure generator reactive power limits enforcement',
        '6. Set transformer tap adjustment modes',
        '7. Configure area interchange controls',
        '8. Set up flat start or previous solution starting point',
        '9. Configure output reporting options',
        '10. Document solver settings and rationale'
      ],
      outputFormat: 'JSON object with solver configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['settings'],
      properties: {
        settings: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            tolerance: { type: 'number' },
            maxIterations: { type: 'number' },
            accelerationFactor: { type: 'number' },
            voltageLimits: { type: 'object' },
            enforceLimits: { type: 'boolean' }
          }
        },
        rationale: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-systems', 'solver']
}));

export const baseCasePowerFlowTask = defineTask('base-case-power-flow', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Base Case Power Flow - ${args.systemName}`,
  agent: {
    name: 'power-systems-engineer',
    prompt: {
      role: 'Power Systems Analysis Engineer',
      task: 'Run base case power flow analysis',
      context: {
        systemName: args.systemName,
        systemModel: args.systemModel,
        loadProfile: args.loadProfile,
        generationDispatch: args.generationDispatch,
        solverSettings: args.solverSettings
      },
      instructions: [
        '1. Initialize power flow solution',
        '2. Execute power flow solver',
        '3. Monitor convergence progress',
        '4. Record bus voltages and angles',
        '5. Calculate line flows and losses',
        '6. Check generator output against limits',
        '7. Verify area interchange balance',
        '8. Calculate total system losses',
        '9. Identify any limit violations',
        '10. Document solution summary and statistics'
      ],
      outputFormat: 'JSON object with power flow results'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'results', 'totalLosses'],
      properties: {
        converged: { type: 'boolean' },
        iterations: { type: 'number' },
        convergenceIssue: { type: 'string' },
        convergenceDetails: { type: 'object' },
        results: {
          type: 'object',
          properties: {
            busResults: { type: 'array', items: { type: 'object' } },
            branchResults: { type: 'array', items: { type: 'object' } },
            generatorResults: { type: 'array', items: { type: 'object' } }
          }
        },
        totalLosses: { type: 'string' },
        voltageRange: { type: 'object' },
        summary: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-systems', 'power-flow']
}));

export const voltageAndLossAnalysisTask = defineTask('voltage-loss-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Voltage and Loss Analysis - ${args.systemName}`,
  agent: {
    name: 'power-systems-engineer',
    prompt: {
      role: 'Power Systems Analysis Engineer',
      task: 'Analyze voltage profiles and power losses',
      context: {
        systemName: args.systemName,
        powerFlowResults: args.powerFlowResults,
        systemModel: args.systemModel
      },
      instructions: [
        '1. Generate voltage profile plots across the system',
        '2. Identify buses with low or high voltages',
        '3. Calculate voltage deviation from nominal',
        '4. Analyze reactive power flows and sources',
        '5. Break down losses by component type (lines, transformers)',
        '6. Identify high-loss elements',
        '7. Calculate loss factors and marginal losses',
        '8. Evaluate voltage regulation effectiveness',
        '9. Identify areas requiring VAR support',
        '10. Document voltage and loss analysis findings'
      ],
      outputFormat: 'JSON object with voltage and loss analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['voltageProfiles', 'lossAnalysis', 'voltageAnalysis'],
      properties: {
        voltageProfiles: {
          type: 'object',
          properties: {
            byBus: { type: 'array', items: { type: 'object' } },
            byVoltageLevel: { type: 'array', items: { type: 'object' } },
            violations: { type: 'array', items: { type: 'object' } }
          }
        },
        voltageAnalysis: {
          type: 'object',
          properties: {
            minVoltage: { type: 'object' },
            maxVoltage: { type: 'object' },
            averageDeviation: { type: 'string' }
          }
        },
        lossAnalysis: {
          type: 'object',
          properties: {
            totalRealLoss: { type: 'string' },
            totalReactiveLoss: { type: 'string' },
            lossByType: { type: 'object' },
            highLossElements: { type: 'array', items: { type: 'object' } }
          }
        },
        varRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-systems', 'voltage-analysis', 'loss-analysis']
}));

export const contingencyAnalysisTask = defineTask('contingency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Contingency Analysis - ${args.systemName}`,
  agent: {
    name: 'power-systems-engineer',
    prompt: {
      role: 'Power Systems Reliability Engineer',
      task: 'Perform N-1 and N-2 contingency analysis',
      context: {
        systemName: args.systemName,
        systemModel: args.systemModel,
        baseCaseResults: args.baseCaseResults,
        loadProfile: args.loadProfile,
        solverSettings: args.solverSettings
      },
      instructions: [
        '1. Define contingency list (line outages, generator trips, transformer failures)',
        '2. Execute N-1 contingency analysis for all defined contingencies',
        '3. Check for thermal overloads after each contingency',
        '4. Check for voltage violations after each contingency',
        '5. Identify non-converging contingencies',
        '6. Rank contingencies by severity',
        '7. Perform selected N-2 contingency analysis',
        '8. Identify critical contingencies causing cascading failures',
        '9. Calculate transfer limits and margins',
        '10. Document contingency analysis results'
      ],
      outputFormat: 'JSON object with contingency analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['n1Results', 'criticalContingencies'],
      properties: {
        n1Results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contingency: { type: 'string' },
              converged: { type: 'boolean' },
              violations: { type: 'array', items: { type: 'object' } },
              severity: { type: 'string' }
            }
          }
        },
        n2Results: {
          type: 'array',
          items: { type: 'object' }
        },
        criticalContingencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contingency: { type: 'string' },
              impact: { type: 'string' },
              violations: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        worstViolations: { type: 'array', items: { type: 'object' } },
        results: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-systems', 'contingency', 'reliability']
}));

export const violationIdentificationTask = defineTask('violation-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Violation Identification - ${args.systemName}`,
  agent: {
    name: 'power-systems-engineer',
    prompt: {
      role: 'Power Systems Compliance Engineer',
      task: 'Identify congestion and voltage violations',
      context: {
        systemName: args.systemName,
        baseCaseResults: args.baseCaseResults,
        contingencyResults: args.contingencyResults,
        voltageAnalysis: args.voltageAnalysis
      },
      instructions: [
        '1. Compile all thermal overloads (base case and contingencies)',
        '2. Compile all voltage violations (high and low)',
        '3. Identify congested transmission corridors',
        '4. Analyze reactive power deficiencies',
        '5. Identify stability-limited transfers',
        '6. Classify violations by severity (critical, major, minor)',
        '7. Map violations to geographical areas',
        '8. Identify seasonal or load-level dependencies',
        '9. Prioritize violations for mitigation',
        '10. Document all violations with root cause analysis'
      ],
      outputFormat: 'JSON object with violation summary'
    },
    outputSchema: {
      type: 'object',
      required: ['violations', 'totalViolations'],
      properties: {
        violations: {
          type: 'object',
          properties: {
            thermal: { type: 'array', items: { type: 'object' } },
            voltage: { type: 'array', items: { type: 'object' } },
            reactive: { type: 'array', items: { type: 'object' } }
          }
        },
        totalViolations: { type: 'number' },
        violationsBySeverity: { type: 'object' },
        congestedCorridors: { type: 'array', items: { type: 'object' } },
        prioritizedList: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-systems', 'violations', 'compliance']
}));

export const recommendationsAndDocumentationTask = defineTask('recommendations-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Recommendations and Documentation - ${args.systemName}`,
  agent: {
    name: 'power-systems-engineer',
    prompt: {
      role: 'Power Systems Planning Engineer',
      task: 'Recommend system improvements and document analysis results',
      context: {
        systemName: args.systemName,
        systemModeling: args.systemModeling,
        dataGathering: args.dataGathering,
        baseCasePowerFlow: args.baseCasePowerFlow,
        voltageAndLossAnalysis: args.voltageAndLossAnalysis,
        contingencyAnalysis: args.contingencyAnalysis,
        violationIdentification: args.violationIdentification
      },
      instructions: [
        '1. Develop recommendations for thermal violations (line upgrades, reconductoring)',
        '2. Recommend voltage support solutions (capacitors, SVCs, STATCOM)',
        '3. Propose generation redispatch options',
        '4. Identify transmission expansion needs',
        '5. Recommend operational measures (switching, load management)',
        '6. Estimate costs and benefits of each recommendation',
        '7. Prioritize recommendations by urgency and impact',
        '8. Calculate system health score',
        '9. Create executive summary of findings',
        '10. Generate comprehensive analysis report'
      ],
      outputFormat: 'JSON object with recommendations and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'systemHealthScore', 'document', 'markdown'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              recommendation: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string' },
              estimatedCost: { type: 'string' },
              benefit: { type: 'string' }
            }
          }
        },
        systemHealthScore: { type: 'number' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            methodology: { type: 'string' },
            results: { type: 'object' },
            recommendations: { type: 'array', items: { type: 'object' } }
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
  labels: ['ee', 'power-systems', 'planning', 'documentation']
}));

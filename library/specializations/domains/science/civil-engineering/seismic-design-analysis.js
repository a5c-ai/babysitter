/**
 * @process civil-engineering/seismic-design-analysis
 * @description Earthquake-resistant design process including seismic hazard analysis, structural system selection, and compliance with ASCE 7 seismic provisions
 * @inputs { projectId: string, siteLocation: object, buildingType: string, structuralSystem: string, geotechnicalData: object }
 * @outputs { success: boolean, seismicDesignReport: object, detailingRequirements: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    siteLocation,
    buildingType,
    structuralSystem,
    geotechnicalData,
    occupancyCategory = 'II',
    designCode = 'ASCE7-22',
    outputDir = 'seismic-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Site Seismic Hazard Analysis
  ctx.log('info', 'Starting seismic design: Site hazard analysis');
  const hazardAnalysis = await ctx.task(seismicHazardTask, {
    projectId,
    siteLocation,
    geotechnicalData,
    designCode,
    outputDir
  });

  if (!hazardAnalysis.success) {
    return {
      success: false,
      error: 'Seismic hazard analysis failed',
      details: hazardAnalysis,
      metadata: { processId: 'civil-engineering/seismic-design-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...hazardAnalysis.artifacts);

  // Task 2: Seismic Design Category Determination
  ctx.log('info', 'Determining seismic design category');
  const sdcDetermination = await ctx.task(sdcDeterminationTask, {
    projectId,
    hazardAnalysis,
    occupancyCategory,
    buildingType,
    outputDir
  });

  artifacts.push(...sdcDetermination.artifacts);

  // Task 3: Structural System Selection
  ctx.log('info', 'Selecting seismic force-resisting system');
  const systemSelection = await ctx.task(systemSelectionTask, {
    projectId,
    sdcDetermination,
    structuralSystem,
    buildingType,
    outputDir
  });

  artifacts.push(...systemSelection.artifacts);

  // Task 4: Seismic Force Analysis
  ctx.log('info', 'Performing seismic force analysis');
  const forceAnalysis = await ctx.task(seismicForceAnalysisTask, {
    projectId,
    hazardAnalysis,
    systemSelection,
    buildingType,
    outputDir
  });

  artifacts.push(...forceAnalysis.artifacts);

  // Task 5: Response Spectrum Analysis
  ctx.log('info', 'Performing response spectrum analysis');
  const rsaAnalysis = await ctx.task(responseSpectrumTask, {
    projectId,
    hazardAnalysis,
    systemSelection,
    forceAnalysis,
    outputDir
  });

  artifacts.push(...rsaAnalysis.artifacts);

  // Task 6: Drift and Stability Analysis
  ctx.log('info', 'Analyzing drift and stability');
  const driftAnalysis = await ctx.task(driftAnalysisTask, {
    projectId,
    forceAnalysis,
    rsaAnalysis,
    systemSelection,
    outputDir
  });

  artifacts.push(...driftAnalysis.artifacts);

  // Breakpoint: Review seismic analysis results
  await ctx.breakpoint({
    question: `Seismic analysis complete for ${projectId}. SDC: ${sdcDetermination.sdc}. Review results and proceed to detailing?`,
    title: 'Seismic Design Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        seismicDesignCategory: sdcDetermination.sdc,
        SDS: hazardAnalysis.SDS,
        SD1: hazardAnalysis.SD1,
        baseShear: forceAnalysis.baseShear,
        R: systemSelection.R,
        maxDriftRatio: driftAnalysis.maxDriftRatio
      }
    }
  });

  // Task 7: Seismic Detailing Requirements
  ctx.log('info', 'Developing seismic detailing requirements');
  const detailingRequirements = await ctx.task(seismicDetailingTask, {
    projectId,
    sdcDetermination,
    systemSelection,
    structuralSystem,
    outputDir
  });

  artifacts.push(...detailingRequirements.artifacts);

  // Task 8: Non-Structural Component Design
  ctx.log('info', 'Designing for non-structural components');
  const nonStructuralDesign = await ctx.task(nonStructuralTask, {
    projectId,
    hazardAnalysis,
    sdcDetermination,
    buildingType,
    outputDir
  });

  artifacts.push(...nonStructuralDesign.artifacts);

  // Task 9: Seismic Design Report
  ctx.log('info', 'Generating seismic design report');
  const designReport = await ctx.task(seismicReportTask, {
    projectId,
    hazardAnalysis,
    sdcDetermination,
    systemSelection,
    forceAnalysis,
    rsaAnalysis,
    driftAnalysis,
    detailingRequirements,
    nonStructuralDesign,
    outputDir
  });

  artifacts.push(...designReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    seismicDesignReport: {
      seismicDesignCategory: sdcDetermination.sdc,
      spectralAccelerations: {
        Ss: hazardAnalysis.Ss,
        S1: hazardAnalysis.S1,
        SDS: hazardAnalysis.SDS,
        SD1: hazardAnalysis.SD1
      },
      structuralSystem: systemSelection.system,
      designCoefficients: {
        R: systemSelection.R,
        Cd: systemSelection.Cd,
        omega0: systemSelection.omega0
      },
      baseShear: forceAnalysis.baseShear,
      driftResults: driftAnalysis.results
    },
    detailingRequirements: detailingRequirements.requirements,
    nonStructuralRequirements: nonStructuralDesign.requirements,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/seismic-design-analysis',
      timestamp: startTime,
      projectId,
      designCode,
      outputDir
    }
  };
}

// Task 1: Seismic Hazard Analysis
export const seismicHazardTask = defineTask('seismic-hazard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform site seismic hazard analysis',
  agent: {
    name: 'seismic-design-specialist',
    prompt: {
      role: 'geotechnical/seismic engineer',
      task: 'Determine site seismic hazard parameters',
      context: args,
      instructions: [
        'Obtain mapped spectral accelerations (Ss, S1) from USGS data',
        'Determine site class from geotechnical data',
        'Calculate site coefficients (Fa, Fv)',
        'Calculate adjusted spectral accelerations (SMS, SM1)',
        'Calculate design spectral accelerations (SDS, SD1)',
        'Develop site-specific design response spectrum',
        'Document seismic hazard assessment',
        'Consider site-specific ground motion study if needed'
      ],
      outputFormat: 'JSON with spectral parameters, site class, response spectrum, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'Ss', 'S1', 'SDS', 'SD1', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        Ss: { type: 'number' },
        S1: { type: 'number' },
        siteClass: { type: 'string' },
        Fa: { type: 'number' },
        Fv: { type: 'number' },
        SMS: { type: 'number' },
        SM1: { type: 'number' },
        SDS: { type: 'number' },
        SD1: { type: 'number' },
        responseSpectrum: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'seismic', 'hazard-analysis']
}));

// Task 2: SDC Determination
export const sdcDeterminationTask = defineTask('sdc-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine Seismic Design Category',
  agent: {
    name: 'building-code-analyst',
    prompt: {
      role: 'structural engineer',
      task: 'Determine Seismic Design Category per ASCE 7',
      context: args,
      instructions: [
        'Determine risk category from building use',
        'Determine SDC based on SDS and risk category',
        'Determine SDC based on SD1 and risk category',
        'Use more severe SDC',
        'Check for SDC exemptions if applicable',
        'Document SDC determination process',
        'Identify applicable code sections',
        'List structural requirements for SDC'
      ],
      outputFormat: 'JSON with SDC, risk category, applicable requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['sdc', 'riskCategory', 'artifacts'],
      properties: {
        sdc: { type: 'string' },
        riskCategory: { type: 'string' },
        sdcFromSDS: { type: 'string' },
        sdcFromSD1: { type: 'string' },
        applicableRequirements: { type: 'array' },
        exemptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'seismic', 'sdc']
}));

// Task 3: Structural System Selection
export const systemSelectionTask = defineTask('system-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select seismic force-resisting system',
  agent: {
    name: 'seismic-design-specialist',
    prompt: {
      role: 'structural engineer',
      task: 'Select and evaluate seismic force-resisting system',
      context: args,
      instructions: [
        'Review permitted systems for SDC',
        'Evaluate system options (moment frame, braced frame, shear wall, dual system)',
        'Determine R, Cd, and Omega_0 factors',
        'Check height limits for selected system',
        'Check irregularity restrictions',
        'Verify system compatibility with architecture',
        'Document system selection rationale',
        'Identify redundancy requirements'
      ],
      outputFormat: 'JSON with selected system, design coefficients, restrictions'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'R', 'Cd', 'omega0', 'artifacts'],
      properties: {
        system: { type: 'string' },
        systemType: { type: 'string' },
        R: { type: 'number' },
        Cd: { type: 'number' },
        omega0: { type: 'number' },
        heightLimit: { type: 'number' },
        redundancyFactor: { type: 'number' },
        irregularities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'seismic', 'system-selection']
}));

// Task 4: Seismic Force Analysis
export const seismicForceAnalysisTask = defineTask('seismic-force-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform seismic force analysis',
  agent: {
    name: 'seismic-design-specialist',
    prompt: {
      role: 'structural engineer',
      task: 'Calculate seismic design forces per ASCE 7',
      context: args,
      instructions: [
        'Calculate effective seismic weight',
        'Calculate seismic response coefficient (Cs)',
        'Apply minimum and maximum Cs limits',
        'Calculate seismic base shear (V)',
        'Distribute base shear vertically (Fx)',
        'Calculate story shears',
        'Apply horizontal distribution to frames',
        'Include accidental torsion',
        'Document force calculations'
      ],
      outputFormat: 'JSON with base shear, force distribution, story forces'
    },
    outputSchema: {
      type: 'object',
      required: ['baseShear', 'Cs', 'forceDistribution', 'artifacts'],
      properties: {
        effectiveWeight: { type: 'number' },
        Cs: { type: 'number' },
        baseShear: { type: 'number' },
        forceDistribution: { type: 'array' },
        storyShears: { type: 'array' },
        torsionalMoments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'seismic', 'force-analysis']
}));

// Task 5: Response Spectrum Analysis
export const responseSpectrumTask = defineTask('response-spectrum', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform response spectrum analysis',
  agent: {
    name: 'seismic-design-specialist',
    prompt: {
      role: 'structural engineer',
      task: 'Perform modal response spectrum analysis',
      context: args,
      instructions: [
        'Develop design response spectrum',
        'Perform modal analysis to determine periods',
        'Calculate modal participation factors',
        'Determine number of modes required (90% mass)',
        'Calculate modal responses',
        'Combine modal responses (CQC or SRSS)',
        'Scale RSA results to ELF base shear if required',
        'Compare ELF and RSA results',
        'Document modal analysis results'
      ],
      outputFormat: 'JSON with modal results, combined responses, scaling factors'
    },
    outputSchema: {
      type: 'object',
      required: ['periods', 'modalResponses', 'combinedResponse', 'artifacts'],
      properties: {
        periods: { type: 'array' },
        massParticipation: { type: 'array' },
        modalResponses: { type: 'array' },
        combinedResponse: { type: 'object' },
        scalingFactor: { type: 'number' },
        rsaBaseShear: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'seismic', 'rsa']
}));

// Task 6: Drift and Stability Analysis
export const driftAnalysisTask = defineTask('drift-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze drift and stability',
  agent: {
    name: 'seismic-design-specialist',
    prompt: {
      role: 'structural engineer',
      task: 'Check seismic drift and stability requirements',
      context: args,
      instructions: [
        'Calculate elastic story drifts',
        'Amplify by Cd for inelastic drifts',
        'Check drift against allowable limits per ASCE 7',
        'Check drift at building corners for torsion',
        'Calculate stability coefficient (theta)',
        'Check P-delta requirements',
        'Identify stories requiring stiffening',
        'Document drift calculations by direction'
      ],
      outputFormat: 'JSON with drift results, stability checks, compliance status'
    },
    outputSchema: {
      type: 'object',
      required: ['maxDriftRatio', 'results', 'artifacts'],
      properties: {
        maxDriftRatio: { type: 'number' },
        allowableDrift: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              story: { type: 'number' },
              driftX: { type: 'number' },
              driftY: { type: 'number' },
              theta: { type: 'number' }
            }
          }
        },
        pDeltaRequired: { type: 'boolean' },
        compliance: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'seismic', 'drift']
}));

// Task 7: Seismic Detailing Requirements
export const seismicDetailingTask = defineTask('seismic-detailing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop seismic detailing requirements',
  agent: {
    name: 'building-code-analyst',
    prompt: {
      role: 'structural engineer',
      task: 'Define seismic detailing requirements',
      context: args,
      instructions: [
        'Determine applicable seismic detailing provisions',
        'Define special moment frame requirements (ACI 318 Ch. 18)',
        'Define special shear wall requirements',
        'Define braced frame requirements (AISC 341)',
        'Specify confinement reinforcement',
        'Specify splice locations and types',
        'Define collector and diaphragm requirements',
        'Document deferred submittals for seismic systems'
      ],
      outputFormat: 'JSON with detailing requirements by system type'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: {
          type: 'object',
          properties: {
            momentFrames: { type: 'object' },
            shearWalls: { type: 'object' },
            bracedFrames: { type: 'object' },
            diaphragms: { type: 'object' },
            collectors: { type: 'object' }
          }
        },
        confinementDetails: { type: 'object' },
        spliceRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'seismic', 'detailing']
}));

// Task 8: Non-Structural Component Design
export const nonStructuralTask = defineTask('non-structural', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design for non-structural components',
  agent: {
    name: 'seismic-design-specialist',
    prompt: {
      role: 'structural engineer',
      task: 'Design non-structural component anchorage per ASCE 7',
      context: args,
      instructions: [
        'Identify architectural components requiring design',
        'Identify mechanical/electrical equipment',
        'Calculate seismic design forces (Fp)',
        'Determine component importance factor (Ip)',
        'Design component anchorage',
        'Check component flexibility requirements',
        'Specify allowable displacements for attachments',
        'Coordinate with MEP engineers',
        'Document non-structural requirements'
      ],
      outputFormat: 'JSON with non-structural requirements, design forces'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        componentForces: { type: 'object' },
        anchorageDesigns: { type: 'array' },
        displacementRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'seismic', 'non-structural']
}));

// Task 9: Seismic Design Report
export const seismicReportTask = defineTask('seismic-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate seismic design report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'structural engineer',
      task: 'Generate comprehensive seismic design report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document site seismic hazard',
        'Present SDC determination',
        'Describe structural system selection',
        'Present seismic force calculations',
        'Include response spectrum analysis results',
        'Document drift and stability checks',
        'Summarize detailing requirements',
        'Include non-structural requirements',
        'Provide code compliance summary'
      ],
      outputFormat: 'JSON with report path, key findings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        codeCompliance: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'seismic', 'reporting']
}));

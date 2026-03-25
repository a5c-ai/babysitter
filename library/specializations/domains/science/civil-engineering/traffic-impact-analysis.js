/**
 * @process civil-engineering/traffic-impact-analysis
 * @description Analysis of traffic impacts from proposed development including trip generation, distribution, and intersection level of service analysis
 * @inputs { projectId: string, developmentType: string, developmentSize: object, studyArea: object, existingTrafficData: object }
 * @outputs { success: boolean, trafficStudy: object, losAnalysis: object, mitigationRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    developmentType,
    developmentSize,
    studyArea,
    existingTrafficData,
    buildYear,
    analysisMethod = 'HCM',
    outputDir = 'traffic-impact-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Scope and Study Area Definition
  ctx.log('info', 'Starting traffic impact analysis: Defining scope and study area');
  const studyScope = await ctx.task(studyScopeTask, {
    projectId,
    developmentType,
    developmentSize,
    studyArea,
    outputDir
  });

  if (!studyScope.success) {
    return {
      success: false,
      error: 'Study scope definition failed',
      details: studyScope,
      metadata: { processId: 'civil-engineering/traffic-impact-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...studyScope.artifacts);

  // Task 2: Existing Conditions Analysis
  ctx.log('info', 'Analyzing existing traffic conditions');
  const existingConditions = await ctx.task(existingConditionsTask, {
    projectId,
    studyScope,
    existingTrafficData,
    outputDir
  });

  artifacts.push(...existingConditions.artifacts);

  // Task 3: Trip Generation
  ctx.log('info', 'Calculating trip generation');
  const tripGeneration = await ctx.task(tripGenerationTask, {
    projectId,
    developmentType,
    developmentSize,
    outputDir
  });

  artifacts.push(...tripGeneration.artifacts);

  // Task 4: Trip Distribution and Assignment
  ctx.log('info', 'Distributing and assigning trips');
  const tripDistribution = await ctx.task(tripDistributionTask, {
    projectId,
    tripGeneration,
    studyScope,
    existingConditions,
    outputDir
  });

  artifacts.push(...tripDistribution.artifacts);

  // Task 5: Future Background Traffic
  ctx.log('info', 'Projecting future background traffic');
  const backgroundTraffic = await ctx.task(backgroundTrafficTask, {
    projectId,
    existingConditions,
    buildYear,
    studyScope,
    outputDir
  });

  artifacts.push(...backgroundTraffic.artifacts);

  // Task 6: Level of Service Analysis
  ctx.log('info', 'Performing level of service analysis');
  const losAnalysis = await ctx.task(losAnalysisTask, {
    projectId,
    existingConditions,
    backgroundTraffic,
    tripDistribution,
    analysisMethod,
    outputDir
  });

  artifacts.push(...losAnalysis.artifacts);

  // Breakpoint: Review traffic analysis
  await ctx.breakpoint({
    question: `Traffic impact analysis complete for ${projectId}. Total trips: ${tripGeneration.totalTrips}. Review LOS results?`,
    title: 'Traffic Impact Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalTrips: tripGeneration.totalTrips,
        amPeakTrips: tripGeneration.amPeakTrips,
        pmPeakTrips: tripGeneration.pmPeakTrips,
        intersectionsAnalyzed: losAnalysis.intersectionCount,
        failingIntersections: losAnalysis.failingCount
      }
    }
  });

  // Task 7: Mitigation Analysis
  ctx.log('info', 'Developing mitigation recommendations');
  const mitigation = await ctx.task(mitigationTask, {
    projectId,
    losAnalysis,
    studyScope,
    outputDir
  });

  artifacts.push(...mitigation.artifacts);

  // Task 8: Site Access Analysis
  ctx.log('info', 'Analyzing site access');
  const siteAccess = await ctx.task(siteAccessTask, {
    projectId,
    developmentType,
    tripGeneration,
    studyScope,
    outputDir
  });

  artifacts.push(...siteAccess.artifacts);

  // Task 9: Traffic Impact Report
  ctx.log('info', 'Generating traffic impact study report');
  const trafficReport = await ctx.task(trafficReportTask, {
    projectId,
    studyScope,
    existingConditions,
    tripGeneration,
    tripDistribution,
    backgroundTraffic,
    losAnalysis,
    mitigation,
    siteAccess,
    outputDir
  });

  artifacts.push(...trafficReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    trafficStudy: {
      scope: studyScope.scope,
      existingConditions: existingConditions.conditions,
      tripGeneration: tripGeneration.trips,
      tripDistribution: tripDistribution.distribution,
      backgroundTraffic: backgroundTraffic.projections
    },
    losAnalysis: losAnalysis.results,
    mitigationRecommendations: mitigation.recommendations,
    siteAccessDesign: siteAccess.design,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/traffic-impact-analysis',
      timestamp: startTime,
      projectId,
      analysisMethod,
      outputDir
    }
  };
}

// Task 1: Study Scope Definition
export const studyScopeTask = defineTask('study-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define study scope and area',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'senior traffic engineer',
      task: 'Define traffic impact study scope',
      context: args,
      instructions: [
        'Define study area boundaries',
        'Identify study intersections',
        'Determine analysis periods (AM, PM, Saturday)',
        'Establish horizon years',
        'Identify data collection needs',
        'Determine analysis scenarios',
        'Coordinate with reviewing agency',
        'Document scope assumptions'
      ],
      outputFormat: 'JSON with study scope, intersections, scenarios'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scope', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scope: { type: 'object' },
        studyIntersections: { type: 'array' },
        analysisPeriods: { type: 'array' },
        horizonYears: { type: 'array' },
        scenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'traffic', 'scope']
}));

// Task 2: Existing Conditions Analysis
export const existingConditionsTask = defineTask('existing-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze existing traffic conditions',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic engineer',
      task: 'Document and analyze existing conditions',
      context: args,
      instructions: [
        'Review turning movement count data',
        'Document intersection geometrics',
        'Note signal timing and phasing',
        'Identify existing traffic control',
        'Note pedestrian and bicycle facilities',
        'Document transit service',
        'Perform existing conditions LOS analysis',
        'Identify existing deficiencies'
      ],
      outputFormat: 'JSON with existing conditions, baseline LOS'
    },
    outputSchema: {
      type: 'object',
      required: ['conditions', 'artifacts'],
      properties: {
        conditions: { type: 'object' },
        trafficVolumes: { type: 'object' },
        intersectionGeometry: { type: 'array' },
        signalTiming: { type: 'object' },
        existingLOS: { type: 'object' },
        deficiencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'traffic', 'existing-conditions']
}));

// Task 3: Trip Generation
export const tripGenerationTask = defineTask('trip-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate trip generation',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic engineer',
      task: 'Calculate project trip generation per ITE Trip Generation Manual',
      context: args,
      instructions: [
        'Identify appropriate ITE land use codes',
        'Select trip generation rates or equations',
        'Calculate daily trip generation',
        'Calculate AM peak hour trips',
        'Calculate PM peak hour trips',
        'Apply pass-by and internal capture reductions',
        'Calculate net new trips',
        'Document trip generation calculations'
      ],
      outputFormat: 'JSON with trip generation by period'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTrips', 'amPeakTrips', 'pmPeakTrips', 'trips', 'artifacts'],
      properties: {
        trips: { type: 'object' },
        totalTrips: { type: 'number' },
        amPeakTrips: { type: 'number' },
        pmPeakTrips: { type: 'number' },
        passbyReduction: { type: 'number' },
        internalCapture: { type: 'number' },
        netNewTrips: { type: 'object' },
        iteLandUseCodes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'traffic', 'trip-generation']
}));

// Task 4: Trip Distribution and Assignment
export const tripDistributionTask = defineTask('trip-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Distribute and assign project trips',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic engineer',
      task: 'Distribute and assign trips to roadway network',
      context: args,
      instructions: [
        'Develop trip distribution percentages',
        'Consider regional trip patterns',
        'Assign trips to approach routes',
        'Calculate turning movements at intersections',
        'Document distribution methodology',
        'Consider directionality of trips',
        'Create trip assignment diagrams',
        'Verify assignment reasonableness'
      ],
      outputFormat: 'JSON with trip distribution, assignment'
    },
    outputSchema: {
      type: 'object',
      required: ['distribution', 'artifacts'],
      properties: {
        distribution: { type: 'object' },
        distributionPercentages: { type: 'object' },
        tripAssignment: { type: 'object' },
        turningMovements: { type: 'object' },
        assignmentDiagrams: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'traffic', 'trip-distribution']
}));

// Task 5: Future Background Traffic
export const backgroundTrafficTask = defineTask('background-traffic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Project future background traffic',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic engineer',
      task: 'Project future background traffic',
      context: args,
      instructions: [
        'Determine appropriate growth rate',
        'Apply growth to existing volumes',
        'Add trips from approved developments',
        'Consider planned transportation improvements',
        'Calculate build year background volumes',
        'Document background traffic assumptions',
        'Create background volume diagrams',
        'Verify projections against regional forecasts'
      ],
      outputFormat: 'JSON with background traffic projections'
    },
    outputSchema: {
      type: 'object',
      required: ['projections', 'artifacts'],
      properties: {
        projections: { type: 'object' },
        growthRate: { type: 'number' },
        backgroundVolumes: { type: 'object' },
        approvedDevelopments: { type: 'array' },
        plannedImprovements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'traffic', 'background']
}));

// Task 6: Level of Service Analysis
export const losAnalysisTask = defineTask('los-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform level of service analysis',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic engineer',
      task: 'Perform intersection level of service analysis',
      context: args,
      instructions: [
        'Analyze signalized intersections per HCM',
        'Analyze unsignalized intersections',
        'Calculate delay and LOS for each scenario',
        'Compare existing, background, and total traffic LOS',
        'Identify intersections failing LOS standards',
        'Determine project-specific impacts',
        'Document analysis parameters',
        'Create LOS summary tables'
      ],
      outputFormat: 'JSON with LOS results by intersection and scenario'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'intersectionCount', 'failingCount', 'artifacts'],
      properties: {
        results: { type: 'object' },
        intersectionCount: { type: 'number' },
        failingCount: { type: 'number' },
        losSummary: { type: 'array' },
        signalWarrants: { type: 'object' },
        impactedIntersections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'traffic', 'los']
}));

// Task 7: Mitigation Analysis
export const mitigationTask = defineTask('mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop mitigation recommendations',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic engineer',
      task: 'Develop traffic mitigation measures',
      context: args,
      instructions: [
        'Identify mitigation needed for failing intersections',
        'Evaluate signal timing optimization',
        'Evaluate geometric improvements',
        'Evaluate new traffic signals',
        'Analyze turn lane additions',
        'Consider TDM measures',
        'Evaluate roundabout alternatives',
        'Estimate improvement costs'
      ],
      outputFormat: 'JSON with mitigation recommendations, costs'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              intersection: { type: 'string' },
              improvement: { type: 'string' },
              cost: { type: 'number' },
              improvedLOS: { type: 'string' }
            }
          }
        },
        totalCost: { type: 'number' },
        tdmMeasures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'traffic', 'mitigation']
}));

// Task 8: Site Access Analysis
export const siteAccessTask = defineTask('site-access', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze site access',
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'traffic engineer',
      task: 'Analyze and design site access',
      context: args,
      instructions: [
        'Determine number and location of driveways',
        'Design driveway geometry',
        'Evaluate sight distance at driveways',
        'Determine turn lane requirements',
        'Analyze internal circulation',
        'Evaluate pedestrian access',
        'Coordinate with access management standards',
        'Create site access plan'
      ],
      outputFormat: 'JSON with site access design, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        driveways: { type: 'array' },
        sightDistanceCheck: { type: 'object' },
        turnLaneRequirements: { type: 'array' },
        internalCirculation: { type: 'object' },
        pedestrianAccess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'traffic', 'site-access']
}));

// Task 9: Traffic Impact Report
export const trafficReportTask = defineTask('traffic-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate traffic impact study report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'traffic engineer',
      task: 'Generate comprehensive traffic impact study report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document project description',
        'Present existing conditions',
        'Document trip generation analysis',
        'Present trip distribution',
        'Document LOS analysis results',
        'Present mitigation recommendations',
        'Include site access design',
        'Attach technical appendices'
      ],
      outputFormat: 'JSON with report path, key findings'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array' },
        conclusions: { type: 'array' },
        mitigationSummary: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'traffic', 'reporting']
}));

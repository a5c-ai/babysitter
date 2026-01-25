/**
 * @process civil-engineering/geotechnical-site-investigation
 * @description Comprehensive subsurface investigation including boring program design, field testing, laboratory testing, and geotechnical report preparation
 * @inputs { projectId: string, siteLocation: object, projectType: string, structureLoads: object }
 * @outputs { success: boolean, geotechnicalReport: object, boringLogs: array, labResults: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    siteLocation,
    projectType,
    structureLoads,
    siteArea,
    investigationScope = 'full',
    outputDir = 'geotech-investigation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Preliminary Site Assessment
  ctx.log('info', 'Starting geotechnical investigation: Preliminary site assessment');
  const siteAssessment = await ctx.task(siteAssessmentTask, {
    projectId,
    siteLocation,
    projectType,
    siteArea,
    outputDir
  });

  if (!siteAssessment.success) {
    return {
      success: false,
      error: 'Site assessment failed',
      details: siteAssessment,
      metadata: { processId: 'civil-engineering/geotechnical-site-investigation', timestamp: startTime }
    };
  }

  artifacts.push(...siteAssessment.artifacts);

  // Task 2: Boring Program Design
  ctx.log('info', 'Designing boring program');
  const boringProgram = await ctx.task(boringProgramTask, {
    projectId,
    siteAssessment,
    projectType,
    structureLoads,
    outputDir
  });

  artifacts.push(...boringProgram.artifacts);

  // Task 3: Field Investigation
  ctx.log('info', 'Executing field investigation');
  const fieldInvestigation = await ctx.task(fieldInvestigationTask, {
    projectId,
    boringProgram,
    siteLocation,
    outputDir
  });

  artifacts.push(...fieldInvestigation.artifacts);

  // Task 4: Laboratory Testing Program
  ctx.log('info', 'Executing laboratory testing program');
  const labTesting = await ctx.task(labTestingTask, {
    projectId,
    fieldInvestigation,
    projectType,
    outputDir
  });

  artifacts.push(...labTesting.artifacts);

  // Task 5: Subsurface Characterization
  ctx.log('info', 'Characterizing subsurface conditions');
  const subsurfaceCharacterization = await ctx.task(subsurfaceCharacterizationTask, {
    projectId,
    fieldInvestigation,
    labTesting,
    outputDir
  });

  artifacts.push(...subsurfaceCharacterization.artifacts);

  // Breakpoint: Review investigation results
  await ctx.breakpoint({
    question: `Geotechnical investigation complete for ${projectId}. Review soil profile and lab results?`,
    title: 'Geotechnical Investigation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        boringCount: boringProgram.boringCount,
        maxDepth: fieldInvestigation.maxBoringDepth,
        soilTypes: subsurfaceCharacterization.soilTypes,
        groundwaterDepth: fieldInvestigation.groundwaterDepth
      }
    }
  });

  // Task 6: Foundation Recommendations
  ctx.log('info', 'Developing foundation recommendations');
  const foundationRecommendations = await ctx.task(foundationRecommendationsTask, {
    projectId,
    subsurfaceCharacterization,
    structureLoads,
    projectType,
    outputDir
  });

  artifacts.push(...foundationRecommendations.artifacts);

  // Task 7: Construction Considerations
  ctx.log('info', 'Identifying construction considerations');
  const constructionConsiderations = await ctx.task(constructionConsiderationsTask, {
    projectId,
    subsurfaceCharacterization,
    foundationRecommendations,
    outputDir
  });

  artifacts.push(...constructionConsiderations.artifacts);

  // Task 8: Geotechnical Report
  ctx.log('info', 'Generating geotechnical engineering report');
  const geotechReport = await ctx.task(geotechReportTask, {
    projectId,
    siteAssessment,
    boringProgram,
    fieldInvestigation,
    labTesting,
    subsurfaceCharacterization,
    foundationRecommendations,
    constructionConsiderations,
    outputDir
  });

  artifacts.push(...geotechReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    geotechnicalReport: {
      siteConditions: siteAssessment.conditions,
      subsurfaceProfile: subsurfaceCharacterization.profile,
      soilProperties: subsurfaceCharacterization.properties,
      foundationRecommendations: foundationRecommendations.recommendations,
      constructionConsiderations: constructionConsiderations.considerations
    },
    boringLogs: fieldInvestigation.boringLogs,
    labResults: labTesting.results,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/geotechnical-site-investigation',
      timestamp: startTime,
      projectId,
      outputDir
    }
  };
}

// Task 1: Preliminary Site Assessment
export const siteAssessmentTask = defineTask('site-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform preliminary site assessment',
  agent: {
    name: 'geotechnical-investigation-specialist',
    prompt: {
      role: 'senior geotechnical engineer',
      task: 'Conduct preliminary site assessment and desktop study',
      context: args,
      instructions: [
        'Review available geologic maps and publications',
        'Obtain historical boring data from area',
        'Review aerial photographs and topography',
        'Identify potential geologic hazards',
        'Review environmental reports if available',
        'Document site history and past uses',
        'Perform site reconnaissance',
        'Identify access and drilling constraints'
      ],
      outputFormat: 'JSON with site conditions, hazards, constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'conditions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        conditions: { type: 'object' },
        geologicSetting: { type: 'string' },
        potentialHazards: { type: 'array' },
        siteConstraints: { type: 'array' },
        historicalData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'geotechnical', 'site-assessment']
}));

// Task 2: Boring Program Design
export const boringProgramTask = defineTask('boring-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design boring program',
  agent: {
    name: 'geotechnical-investigation-specialist',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Design subsurface exploration program',
      context: args,
      instructions: [
        'Determine number and spacing of borings',
        'Establish boring depths based on structure loads',
        'Specify drilling methods (hollow stem auger, mud rotary, etc.)',
        'Plan SPT testing intervals',
        'Specify undisturbed sampling requirements',
        'Include groundwater monitoring wells',
        'Plan CPT testing if needed',
        'Create boring location plan'
      ],
      outputFormat: 'JSON with boring layout, depths, sampling plan'
    },
    outputSchema: {
      type: 'object',
      required: ['boringCount', 'boringLayout', 'artifacts'],
      properties: {
        boringCount: { type: 'number' },
        boringLayout: { type: 'array' },
        boringDepths: { type: 'object' },
        samplingPlan: { type: 'object' },
        drillingMethods: { type: 'array' },
        cptLocations: { type: 'array' },
        monitoringWells: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'geotechnical', 'boring-program']
}));

// Task 3: Field Investigation
export const fieldInvestigationTask = defineTask('field-investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute field investigation',
  agent: {
    name: 'geotechnical-investigation-specialist',
    prompt: {
      role: 'geotechnical field engineer',
      task: 'Document field investigation results',
      context: args,
      instructions: [
        'Log soil borings per ASTM D2488',
        'Record SPT N-values at intervals',
        'Note soil descriptions and stratification',
        'Document groundwater levels',
        'Collect undisturbed samples',
        'Perform field tests (pocket penetrometer, vane shear)',
        'Note drilling observations',
        'Create boring logs per standard format'
      ],
      outputFormat: 'JSON with boring logs, SPT data, groundwater info'
    },
    outputSchema: {
      type: 'object',
      required: ['boringLogs', 'maxBoringDepth', 'groundwaterDepth', 'artifacts'],
      properties: {
        boringLogs: { type: 'array' },
        maxBoringDepth: { type: 'number' },
        groundwaterDepth: { type: 'number' },
        sptResults: { type: 'object' },
        samples: { type: 'array' },
        fieldObservations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'geotechnical', 'field-investigation']
}));

// Task 4: Laboratory Testing Program
export const labTestingTask = defineTask('lab-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute laboratory testing program',
  agent: {
    name: 'geotechnical-investigation-specialist',
    prompt: {
      role: 'geotechnical laboratory manager',
      task: 'Plan and document laboratory testing',
      context: args,
      instructions: [
        'Perform classification tests (grain size, Atterberg limits)',
        'Conduct moisture content and unit weight tests',
        'Perform consolidation tests for settlement analysis',
        'Conduct triaxial or direct shear tests',
        'Test unconfined compressive strength',
        'Perform chemical tests (pH, sulfates, chlorides)',
        'Compile test results in standard format',
        'Generate laboratory test summary'
      ],
      outputFormat: 'JSON with lab test results, soil classifications'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            classification: { type: 'object' },
            strength: { type: 'object' },
            consolidation: { type: 'object' },
            chemical: { type: 'object' }
          }
        },
        soilClassifications: { type: 'array' },
        testSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'geotechnical', 'lab-testing']
}));

// Task 5: Subsurface Characterization
export const subsurfaceCharacterizationTask = defineTask('subsurface-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize subsurface conditions',
  agent: {
    name: 'geotechnical-investigation-specialist',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Develop subsurface characterization',
      context: args,
      instructions: [
        'Develop generalized soil profile',
        'Correlate borings and develop cross-sections',
        'Determine engineering soil properties',
        'Estimate bearing capacity parameters',
        'Determine site seismic site class',
        'Evaluate groundwater conditions',
        'Identify problematic soil layers',
        'Create subsurface profile drawings'
      ],
      outputFormat: 'JSON with soil profile, properties, cross-sections'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'properties', 'soilTypes', 'artifacts'],
      properties: {
        profile: { type: 'object' },
        properties: { type: 'object' },
        soilTypes: { type: 'array' },
        seismicSiteClass: { type: 'string' },
        groundwaterAnalysis: { type: 'object' },
        crossSections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'geotechnical', 'characterization']
}));

// Task 6: Foundation Recommendations
export const foundationRecommendationsTask = defineTask('foundation-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop foundation recommendations',
  agent: {
    name: 'geotechnical-investigation-specialist',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Develop foundation recommendations',
      context: args,
      instructions: [
        'Evaluate foundation alternatives',
        'Calculate allowable bearing pressures',
        'Estimate foundation settlements',
        'Recommend foundation type and depths',
        'Provide design parameters for shallow foundations',
        'Provide design parameters for deep foundations',
        'Recommend ground improvement if needed',
        'Specify foundation construction requirements'
      ],
      outputFormat: 'JSON with foundation recommendations, design parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: { type: 'object' },
        shallowFoundations: {
          type: 'object',
          properties: {
            allowableBearing: { type: 'number' },
            minimumDepth: { type: 'number' },
            estimatedSettlement: { type: 'number' }
          }
        },
        deepFoundations: {
          type: 'object',
          properties: {
            pileCapacity: { type: 'number' },
            recommendedLength: { type: 'number' },
            pileType: { type: 'string' }
          }
        },
        groundImprovement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'geotechnical', 'foundations']
}));

// Task 7: Construction Considerations
export const constructionConsiderationsTask = defineTask('construction-considerations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify construction considerations',
  agent: {
    name: 'geotechnical-investigation-specialist',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Identify geotechnical construction considerations',
      context: args,
      instructions: [
        'Recommend excavation methods and slopes',
        'Specify dewatering requirements',
        'Provide temporary shoring recommendations',
        'Identify fill and backfill requirements',
        'Specify compaction requirements',
        'Recommend subgrade preparation',
        'Identify problematic construction conditions',
        'Provide inspection and testing recommendations'
      ],
      outputFormat: 'JSON with construction recommendations, specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['considerations', 'artifacts'],
      properties: {
        considerations: { type: 'object' },
        excavationRecommendations: { type: 'object' },
        dewateringRequirements: { type: 'object' },
        shoringRecommendations: { type: 'object' },
        compactionSpecifications: { type: 'object' },
        inspectionRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'geotechnical', 'construction']
}));

// Task 8: Geotechnical Report
export const geotechReportTask = defineTask('geotech-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate geotechnical engineering report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Generate comprehensive geotechnical engineering report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document site conditions and project description',
        'Present subsurface exploration program',
        'Include boring logs and lab test results',
        'Describe subsurface conditions',
        'Present engineering analyses',
        'Provide foundation recommendations',
        'Include construction considerations',
        'Attach appendices with data'
      ],
      outputFormat: 'JSON with report path, key recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyRecommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyRecommendations: { type: 'array' },
        limitations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'geotechnical', 'reporting']
}));

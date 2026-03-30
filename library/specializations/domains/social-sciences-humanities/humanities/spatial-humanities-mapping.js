/**
 * @process humanities/spatial-humanities-mapping
 * @description Develop GIS-based historical and cultural analysis integrating geographic data with humanities research questions
 * @inputs { researchQuestion: string, spatialData: object, temporalScope: object, analysisTypes: array }
 * @outputs { success: boolean, spatialAnalysis: object, maps: array, patterns: object, artifacts: array }
 * @recommendedSkills SK-HUM-011 (gis-mapping-humanities), SK-HUM-014 (metadata-standards-implementation)
 * @recommendedAgents AG-HUM-005 (digital-humanities-technologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    spatialData = {},
    temporalScope = {},
    analysisTypes = ['mapping', 'spatial-analysis'],
    historicalSources = [],
    outputDir = 'spatial-humanities-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Spatial Data Assessment and Preparation
  ctx.log('info', 'Assessing and preparing spatial data');
  const dataAssessment = await ctx.task(spatialDataAssessmentTask, {
    spatialData,
    historicalSources,
    temporalScope,
    outputDir
  });

  if (!dataAssessment.success) {
    return {
      success: false,
      error: 'Spatial data assessment failed',
      details: dataAssessment,
      metadata: { processId: 'humanities/spatial-humanities-mapping', timestamp: startTime }
    };
  }

  artifacts.push(...dataAssessment.artifacts);

  // Task 2: Historical Georeferencing
  ctx.log('info', 'Georeferencing historical materials');
  const georeferencing = await ctx.task(georeferencingTask, {
    historicalSources,
    spatialData,
    temporalScope,
    outputDir
  });

  artifacts.push(...georeferencing.artifacts);

  // Task 3: Spatial Database Design
  ctx.log('info', 'Designing spatial database');
  const databaseDesign = await ctx.task(spatialDatabaseTask, {
    dataAssessment,
    georeferencing,
    researchQuestion,
    outputDir
  });

  artifacts.push(...databaseDesign.artifacts);

  // Task 4: Cartographic Design
  ctx.log('info', 'Developing cartographic design');
  const cartographicDesign = await ctx.task(cartographicDesignTask, {
    researchQuestion,
    spatialData,
    temporalScope,
    outputDir
  });

  artifacts.push(...cartographicDesign.artifacts);

  // Task 5: Spatial Analysis
  ctx.log('info', 'Conducting spatial analysis');
  const spatialAnalysis = await ctx.task(spatialAnalysisTask, {
    databaseDesign,
    researchQuestion,
    analysisTypes,
    outputDir
  });

  artifacts.push(...spatialAnalysis.artifacts);

  // Task 6: Temporal-Spatial Integration
  ctx.log('info', 'Integrating temporal and spatial dimensions');
  const temporalSpatial = await ctx.task(temporalSpatialTask, {
    spatialAnalysis,
    temporalScope,
    databaseDesign,
    outputDir
  });

  artifacts.push(...temporalSpatial.artifacts);

  // Task 7: Generate Spatial Humanities Report
  ctx.log('info', 'Generating spatial humanities report');
  const spatialReport = await ctx.task(spatialReportTask, {
    researchQuestion,
    dataAssessment,
    georeferencing,
    databaseDesign,
    cartographicDesign,
    spatialAnalysis,
    temporalSpatial,
    outputDir
  });

  artifacts.push(...spatialReport.artifacts);

  // Breakpoint: Review spatial analysis
  await ctx.breakpoint({
    question: `Spatial humanities analysis complete. Maps created: ${cartographicDesign.maps?.length || 0}. Patterns identified: ${spatialAnalysis.patterns?.length || 0}. Review analysis?`,
    title: 'Spatial Humanities Mapping Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        researchQuestion,
        mapsCreated: cartographicDesign.maps?.length || 0,
        dataLayers: databaseDesign.layers?.length || 0,
        patterns: spatialAnalysis.patterns?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    spatialAnalysis: {
      patterns: spatialAnalysis.patterns,
      statistics: spatialAnalysis.statistics,
      findings: spatialAnalysis.findings
    },
    maps: cartographicDesign.maps,
    database: {
      layers: databaseDesign.layers,
      schema: databaseDesign.schema
    },
    temporalPatterns: temporalSpatial.patterns,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/spatial-humanities-mapping',
      timestamp: startTime,
      researchQuestion,
      outputDir
    }
  };
}

// Task 1: Spatial Data Assessment and Preparation
export const spatialDataAssessmentTask = defineTask('spatial-data-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess and prepare spatial data',
  agent: {
    name: 'spatial-data-specialist',
    prompt: {
      role: 'spatial data preparation specialist',
      task: 'Assess and prepare spatial data for humanities analysis',
      context: args,
      instructions: [
        'Inventory available spatial data',
        'Assess data quality and completeness',
        'Identify coordinate systems and projections',
        'Identify data gaps',
        'Plan data cleaning procedures',
        'Identify base map requirements',
        'Assess historical map availability',
        'Document data provenance'
      ],
      outputFormat: 'JSON with success, inventory, quality, gaps, preparation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'inventory', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        inventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataset: { type: 'string' },
              type: { type: 'string' },
              coverage: { type: 'string' },
              quality: { type: 'string' }
            }
          }
        },
        quality: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        preparation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spatial-data', 'assessment', 'gis']
}));

// Task 2: Historical Georeferencing
export const georeferencingTask = defineTask('georeferencing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Georeference historical materials',
  agent: {
    name: 'georeferencer',
    prompt: {
      role: 'historical georeferencing specialist',
      task: 'Georeference historical maps and sources',
      context: args,
      instructions: [
        'Identify historical maps for georeferencing',
        'Select control points',
        'Apply appropriate transformation',
        'Assess georeferencing accuracy',
        'Extract features from historical maps',
        'Geocode historical place names',
        'Handle uncertain locations',
        'Document georeferencing methods'
      ],
      outputFormat: 'JSON with georeferenced, accuracy, methods, uncertainties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['georeferenced', 'artifacts'],
      properties: {
        georeferenced: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              transformation: { type: 'string' },
              rmse: { type: 'number' },
              controlPoints: { type: 'number' }
            }
          }
        },
        accuracy: { type: 'object' },
        methods: { type: 'object' },
        uncertainties: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'georeferencing', 'historical-gis', 'mapping']
}));

// Task 3: Spatial Database Design
export const spatialDatabaseTask = defineTask('spatial-database', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design spatial database',
  agent: {
    name: 'database-designer',
    prompt: {
      role: 'spatial database specialist',
      task: 'Design spatial database for humanities project',
      context: args,
      instructions: [
        'Design database schema',
        'Define feature classes and layers',
        'Establish attribute tables',
        'Define relationships between layers',
        'Implement temporal dimensions',
        'Define topology rules',
        'Create metadata documentation',
        'Establish data entry protocols'
      ],
      outputFormat: 'JSON with layers, schema, relationships, temporal, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['layers', 'schema', 'artifacts'],
      properties: {
        layers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              geometryType: { type: 'string' },
              attributes: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        schema: {
          type: 'object',
          properties: {
            structure: { type: 'object' },
            relationships: { type: 'array', items: { type: 'object' } }
          }
        },
        temporal: { type: 'object' },
        topology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'database', 'gis', 'schema']
}));

// Task 4: Cartographic Design
export const cartographicDesignTask = defineTask('cartographic-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop cartographic design',
  agent: {
    name: 'cartographer',
    prompt: {
      role: 'humanities cartography specialist',
      task: 'Develop cartographic design for humanities visualization',
      context: args,
      instructions: [
        'Select appropriate map projections',
        'Design symbology and color schemes',
        'Create thematic map designs',
        'Design legend and map elements',
        'Plan interactive features',
        'Design for print and web',
        'Address uncertainty visualization',
        'Create map series design'
      ],
      outputFormat: 'JSON with maps, symbology, design, interactive, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maps', 'design', 'artifacts'],
      properties: {
        maps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
              projection: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        symbology: {
          type: 'object',
          properties: {
            colorScheme: { type: 'object' },
            symbols: { type: 'array', items: { type: 'object' } }
          }
        },
        design: {
          type: 'object',
          properties: {
            layout: { type: 'object' },
            elements: { type: 'array', items: { type: 'string' } }
          }
        },
        interactive: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cartography', 'visualization', 'design']
}));

// Task 5: Spatial Analysis
export const spatialAnalysisTask = defineTask('spatial-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct spatial analysis',
  agent: {
    name: 'spatial-analyst',
    prompt: {
      role: 'spatial analysis specialist',
      task: 'Conduct spatial analysis for humanities research',
      context: args,
      instructions: [
        'Perform density and clustering analysis',
        'Conduct proximity analysis',
        'Analyze spatial distributions',
        'Identify spatial patterns',
        'Perform network analysis if applicable',
        'Analyze viewsheds and visibility',
        'Conduct least-cost path analysis',
        'Document spatial statistics'
      ],
      outputFormat: 'JSON with patterns, statistics, findings, methods, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'findings', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              significance: { type: 'number' }
            }
          }
        },
        statistics: {
          type: 'object',
          properties: {
            clustering: { type: 'object' },
            distribution: { type: 'object' }
          }
        },
        findings: { type: 'array', items: { type: 'string' } },
        methods: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'spatial-analysis', 'gis', 'patterns']
}));

// Task 6: Temporal-Spatial Integration
export const temporalSpatialTask = defineTask('temporal-spatial', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate temporal and spatial dimensions',
  agent: {
    name: 'temporal-spatial-analyst',
    prompt: {
      role: 'temporal-spatial analysis specialist',
      task: 'Integrate temporal and spatial analysis',
      context: args,
      instructions: [
        'Analyze spatial change over time',
        'Create time-series visualizations',
        'Identify temporal-spatial patterns',
        'Analyze diffusion patterns',
        'Create animated maps if appropriate',
        'Analyze periodization spatially',
        'Document temporal uncertainty',
        'Create timeline integrations'
      ],
      outputFormat: 'JSON with patterns, timeSeries, change, animations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              temporalRange: { type: 'string' },
              spatialExtent: { type: 'string' }
            }
          }
        },
        timeSeries: { type: 'array', items: { type: 'object' } },
        change: {
          type: 'object',
          properties: {
            areas: { type: 'array', items: { type: 'object' } },
            trends: { type: 'array', items: { type: 'string' } }
          }
        },
        animations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'temporal', 'spatial', 'change-analysis']
}));

// Task 7: Spatial Humanities Report Generation
export const spatialReportTask = defineTask('spatial-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate spatial humanities report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'spatial humanities documentation specialist',
      task: 'Generate comprehensive spatial humanities report',
      context: args,
      instructions: [
        'Document research question and methodology',
        'Present data sources and preparation',
        'Document georeferencing methods',
        'Present spatial database design',
        'Include map products',
        'Present spatial analysis findings',
        'Document temporal-spatial patterns',
        'Address research question conclusions'
      ],
      outputFormat: 'JSON with reportPath, sections, maps, findings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'findings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        maps: { type: 'array', items: { type: 'string' } },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              evidence: { type: 'string' }
            }
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
  labels: ['agent', 'reporting', 'spatial-humanities', 'gis']
}));

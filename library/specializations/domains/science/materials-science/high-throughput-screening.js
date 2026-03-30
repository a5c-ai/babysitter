/**
 * @process domains/science/materials-science/high-throughput-screening
 * @description High-Throughput Computational Screening - Implement automated screening workflows using Materials Project/AFLOW
 * databases with property filters and stability criteria.
 * @inputs { targetProperty: string, propertyRange?: object, chemicalSpace?: array, stabilityThreshold?: number }
 * @outputs { success: boolean, candidates: array, rankings: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/high-throughput-screening', {
 *   targetProperty: 'band-gap',
 *   propertyRange: { min: 1.5, max: 2.5 },
 *   chemicalSpace: ['Ti', 'O', 'N'],
 *   stabilityThreshold: 0.025
 * });
 *
 * @references
 * - Materials Project: https://materialsproject.org/
 * - AFLOW: https://aflow.org/
 * - atomate: https://atomate.org/
 * - pymatgen: https://pymatgen.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetProperty = 'band-gap',
    propertyRange = {},
    chemicalSpace = [],
    stabilityThreshold = 0.025,
    maxCandidates = 100,
    databases = ['materials-project'],
    additionalFilters = {},
    outputDir = 'hts-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting High-Throughput Screening for property: ${targetProperty}`);
  ctx.log('info', `Chemical space: ${chemicalSpace.join('-')}, Databases: ${databases.join(', ')}`);

  // Phase 1: Define Search Criteria
  ctx.log('info', 'Phase 1: Defining search criteria');
  const searchCriteria = await ctx.task(defineSearchCriteriaTask, {
    targetProperty,
    propertyRange,
    chemicalSpace,
    stabilityThreshold,
    additionalFilters,
    outputDir
  });

  artifacts.push(...searchCriteria.artifacts);

  // Phase 2: Database Query
  ctx.log('info', 'Phase 2: Querying materials databases');
  const databaseQuery = await ctx.task(databaseQueryTask, {
    searchCriteria: searchCriteria.criteria,
    databases,
    maxCandidates: maxCandidates * 10,
    outputDir
  });

  artifacts.push(...databaseQuery.artifacts);

  await ctx.breakpoint({
    question: `Database query returned ${databaseQuery.totalHits} materials. After initial filters: ${databaseQuery.filteredCount}. Continue with detailed screening?`,
    title: 'Database Query Results',
    context: {
      runId: ctx.runId,
      summary: {
        totalHits: databaseQuery.totalHits,
        filteredCount: databaseQuery.filteredCount,
        databases: databases
      },
      files: databaseQuery.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Stability Screening
  ctx.log('info', 'Phase 3: Screening for thermodynamic stability');
  const stabilityScreening = await ctx.task(stabilityScreeningTask, {
    candidates: databaseQuery.candidates,
    stabilityThreshold,
    outputDir
  });

  artifacts.push(...stabilityScreening.artifacts);

  // Phase 4: Property Filtering
  ctx.log('info', 'Phase 4: Applying property filters');
  const propertyFiltering = await ctx.task(propertyFilteringTask, {
    candidates: stabilityScreening.stableCandidates,
    targetProperty,
    propertyRange,
    additionalFilters,
    outputDir
  });

  artifacts.push(...propertyFiltering.artifacts);

  // Phase 5: Property Calculation for Missing Data
  ctx.log('info', 'Phase 5: Calculating missing properties');
  const propertyCalculation = await ctx.task(propertyCalculationTask, {
    candidates: propertyFiltering.filteredCandidates,
    targetProperty,
    outputDir
  });

  artifacts.push(...propertyCalculation.artifacts);

  // Phase 6: Multi-objective Ranking
  ctx.log('info', 'Phase 6: Ranking candidates');
  const ranking = await ctx.task(candidateRankingTask, {
    candidates: propertyCalculation.candidates,
    targetProperty,
    propertyRange,
    maxCandidates,
    outputDir
  });

  artifacts.push(...ranking.artifacts);

  await ctx.breakpoint({
    question: `Screening complete. ${ranking.rankedCandidates.length} candidates identified. Top candidate: ${ranking.rankedCandidates[0]?.formula}. Review rankings?`,
    title: 'Screening Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        totalCandidates: ranking.rankedCandidates.length,
        topCandidates: ranking.rankedCandidates.slice(0, 5).map(c => ({
          formula: c.formula,
          property: c[targetProperty],
          stability: c.energyAboveHull
        }))
      },
      files: ranking.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Synthesizability Assessment
  ctx.log('info', 'Phase 7: Assessing synthesizability');
  const synthesizability = await ctx.task(synthesizabilityAssessmentTask, {
    candidates: ranking.rankedCandidates,
    outputDir
  });

  artifacts.push(...synthesizability.artifacts);

  // Phase 8: Generate Candidate Reports
  ctx.log('info', 'Phase 8: Generating candidate reports');
  const candidateReports = await ctx.task(candidateReportsTask, {
    candidates: ranking.rankedCandidates.slice(0, 20),
    synthesizability: synthesizability.assessments,
    targetProperty,
    outputDir
  });

  artifacts.push(...candidateReports.artifacts);

  // Phase 9: Summary Report
  ctx.log('info', 'Phase 9: Generating screening summary report');
  const report = await ctx.task(htsReportTask, {
    targetProperty,
    propertyRange,
    chemicalSpace,
    searchCriteria,
    databaseQuery,
    stabilityScreening,
    ranking,
    synthesizability,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    targetProperty,
    chemicalSpace,
    screeningSummary: {
      initialHits: databaseQuery.totalHits,
      afterStabilityFilter: stabilityScreening.stableCandidates.length,
      afterPropertyFilter: propertyFiltering.filteredCandidates.length,
      finalCandidates: ranking.rankedCandidates.length
    },
    candidates: ranking.rankedCandidates.map(c => ({
      materialId: c.materialId,
      formula: c.formula,
      spaceGroup: c.spaceGroup,
      targetPropertyValue: c[targetProperty],
      energyAboveHull: c.energyAboveHull,
      synthesizabilityScore: synthesizability.assessments[c.materialId]?.score
    })),
    rankings: ranking.rankedCandidates.slice(0, maxCandidates),
    synthesizability: synthesizability.summary,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/high-throughput-screening',
      timestamp: startTime,
      databases,
      stabilityThreshold,
      outputDir
    }
  };
}

// Task 1: Define Search Criteria
export const defineSearchCriteriaTask = defineTask('hts-define-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Search Criteria',
  agent: {
    name: 'materials-informatics-specialist',
    prompt: {
      role: 'Materials Informatics Specialist',
      task: 'Define comprehensive search criteria for high-throughput screening',
      context: args,
      instructions: [
        '1. Parse target property requirements',
        '2. Define chemical composition constraints',
        '3. Set stability criteria (energy above hull)',
        '4. Define structural constraints if needed',
        '5. Set property range filters',
        '6. Include experimental synthesizability considerations',
        '7. Define exclusion criteria (toxic elements, rare earths)',
        '8. Set database-specific query parameters',
        '9. Validate criteria completeness',
        '10. Document search criteria'
      ],
      outputFormat: 'JSON with search criteria definition'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'artifacts'],
      properties: {
        criteria: {
          type: 'object',
          properties: {
            chemicalConstraints: { type: 'object' },
            propertyFilters: { type: 'object' },
            stabilityFilters: { type: 'object' },
            structuralFilters: { type: 'object' }
          }
        },
        queryStrings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'high-throughput-screening', 'criteria', 'materials-science']
}));

// Task 2: Database Query
export const databaseQueryTask = defineTask('hts-database-query', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Query Materials Databases',
  agent: {
    name: 'database-specialist',
    prompt: {
      role: 'Materials Database Specialist',
      task: 'Query materials databases for candidate structures',
      context: args,
      instructions: [
        '1. Connect to Materials Project API',
        '2. Connect to AFLOW REST API if requested',
        '3. Execute search queries with criteria',
        '4. Apply initial property filters',
        '5. Retrieve structure and property data',
        '6. Handle pagination for large result sets',
        '7. Merge results from multiple databases',
        '8. Remove duplicates',
        '9. Cache results locally',
        '10. Document query statistics'
      ],
      outputFormat: 'JSON with database query results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalHits', 'filteredCount', 'candidates', 'artifacts'],
      properties: {
        totalHits: { type: 'number' },
        filteredCount: { type: 'number' },
        candidates: { type: 'array', items: { type: 'object' } },
        databaseStats: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'high-throughput-screening', 'database', 'materials-science']
}));

// Task 3: Stability Screening
export const stabilityScreeningTask = defineTask('hts-stability-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stability Screening',
  agent: {
    name: 'stability-analyst',
    prompt: {
      role: 'Thermodynamic Stability Analyst',
      task: 'Screen candidates for thermodynamic stability',
      context: args,
      instructions: [
        '1. Retrieve energy above hull data',
        '2. Apply stability threshold filter',
        '3. Identify metastable candidates',
        '4. Check for dynamic stability (imaginary phonons)',
        '5. Assess phase decomposition pathways',
        '6. Flag borderline cases',
        '7. Calculate stability scores',
        '8. Rank by stability',
        '9. Document stability analysis',
        '10. Export stable candidates list'
      ],
      outputFormat: 'JSON with stability screening results'
    },
    outputSchema: {
      type: 'object',
      required: ['stableCandidates', 'stabilityStats', 'artifacts'],
      properties: {
        stableCandidates: { type: 'array', items: { type: 'object' } },
        metastableCandidates: { type: 'array', items: { type: 'object' } },
        stabilityStats: {
          type: 'object',
          properties: {
            stable: { type: 'number' },
            metastable: { type: 'number' },
            unstable: { type: 'number' }
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
  labels: ['agent', 'high-throughput-screening', 'stability', 'materials-science']
}));

// Task 4: Property Filtering
export const propertyFilteringTask = defineTask('hts-property-filtering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Property Filtering',
  agent: {
    name: 'property-analyst',
    prompt: {
      role: 'Materials Property Analyst',
      task: 'Apply property-based filters to candidates',
      context: args,
      instructions: [
        '1. Apply target property range filter',
        '2. Apply additional property constraints',
        '3. Handle missing property data',
        '4. Flag candidates needing calculations',
        '5. Apply composition-based rules',
        '6. Filter by structural properties',
        '7. Apply electronic property constraints',
        '8. Document filtering statistics',
        '9. Rank by property match',
        '10. Export filtered candidates'
      ],
      outputFormat: 'JSON with property filtering results'
    },
    outputSchema: {
      type: 'object',
      required: ['filteredCandidates', 'filterStats', 'artifacts'],
      properties: {
        filteredCandidates: { type: 'array', items: { type: 'object' } },
        candidatesNeedingCalculation: { type: 'array', items: { type: 'string' } },
        filterStats: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'high-throughput-screening', 'filtering', 'materials-science']
}));

// Task 5: Property Calculation
export const propertyCalculationTask = defineTask('hts-property-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Property Calculation',
  agent: {
    name: 'computational-specialist',
    prompt: {
      role: 'Computational Property Specialist',
      task: 'Calculate missing properties for candidates',
      context: args,
      instructions: [
        '1. Identify candidates with missing data',
        '2. Set up DFT calculations if needed',
        '3. Use ML models for rapid estimation',
        '4. Apply descriptor-based predictions',
        '5. Validate calculation results',
        '6. Update candidate property database',
        '7. Flag calculation failures',
        '8. Estimate prediction uncertainties',
        '9. Document calculation methods',
        '10. Merge calculated properties'
      ],
      outputFormat: 'JSON with property calculation results'
    },
    outputSchema: {
      type: 'object',
      required: ['candidates', 'calculationsPerformed', 'artifacts'],
      properties: {
        candidates: { type: 'array', items: { type: 'object' } },
        calculationsPerformed: { type: 'number' },
        calculationMethod: { type: 'string' },
        uncertainties: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'high-throughput-screening', 'calculation', 'materials-science']
}));

// Task 6: Candidate Ranking
export const candidateRankingTask = defineTask('hts-candidate-ranking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Candidate Ranking',
  agent: {
    name: 'ranking-specialist',
    prompt: {
      role: 'Materials Ranking Specialist',
      task: 'Rank candidates using multi-objective optimization',
      context: args,
      instructions: [
        '1. Define ranking criteria and weights',
        '2. Normalize property values',
        '3. Calculate composite scores',
        '4. Apply Pareto optimization if multi-objective',
        '5. Identify Pareto-optimal candidates',
        '6. Rank by distance from ideal',
        '7. Consider trade-offs between properties',
        '8. Generate ranked candidate list',
        '9. Identify top candidates',
        '10. Document ranking methodology'
      ],
      outputFormat: 'JSON with candidate ranking results'
    },
    outputSchema: {
      type: 'object',
      required: ['rankedCandidates', 'paretoFront', 'artifacts'],
      properties: {
        rankedCandidates: { type: 'array', items: { type: 'object' } },
        paretoFront: { type: 'array', items: { type: 'object' } },
        rankingCriteria: { type: 'object' },
        compositeScores: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'high-throughput-screening', 'ranking', 'materials-science']
}));

// Task 7: Synthesizability Assessment
export const synthesizabilityAssessmentTask = defineTask('hts-synthesizability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesizability Assessment',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'Materials Synthesis Specialist',
      task: 'Assess synthesizability of candidate materials',
      context: args,
      instructions: [
        '1. Check for experimentally synthesized analogs',
        '2. Assess precursor availability',
        '3. Evaluate synthesis routes',
        '4. Consider cost of raw materials',
        '5. Assess toxicity and handling concerns',
        '6. Estimate synthesis difficulty',
        '7. Check for patent/IP constraints',
        '8. Generate synthesizability scores',
        '9. Suggest synthesis methods',
        '10. Document synthesizability assessment'
      ],
      outputFormat: 'JSON with synthesizability assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['assessments', 'summary', 'artifacts'],
      properties: {
        assessments: { type: 'object' },
        summary: {
          type: 'object',
          properties: {
            highlySynthesizable: { type: 'number' },
            moderatelySynthesizable: { type: 'number' },
            difficultToSynthesize: { type: 'number' }
          }
        },
        suggestedMethods: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'high-throughput-screening', 'synthesizability', 'materials-science']
}));

// Task 8: Candidate Reports
export const candidateReportsTask = defineTask('hts-candidate-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Candidate Reports',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'Materials Candidate Report Generator',
      task: 'Generate detailed reports for top candidates',
      context: args,
      instructions: [
        '1. Create individual candidate data sheets',
        '2. Include structure visualization',
        '3. Summarize all properties',
        '4. Present stability analysis',
        '5. Include synthesis recommendations',
        '6. Compare with similar materials',
        '7. Highlight advantages and disadvantages',
        '8. Suggest experimental validation',
        '9. Generate comparison tables',
        '10. Format for review'
      ],
      outputFormat: 'JSON with candidate report results'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPaths', 'comparisonTable', 'artifacts'],
      properties: {
        reportPaths: { type: 'array', items: { type: 'string' } },
        comparisonTable: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'high-throughput-screening', 'candidate-report', 'materials-science']
}));

// Task 9: Summary Report
export const htsReportTask = defineTask('hts-summary-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'HTS Summary Report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'High-Throughput Screening Technical Writer',
      task: 'Generate comprehensive screening summary report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document screening methodology',
        '3. Present screening funnel statistics',
        '4. Highlight top candidates',
        '5. Include property distributions',
        '6. Present ranking analysis',
        '7. Discuss synthesizability',
        '8. Add recommendations',
        '9. Include all data tables',
        '10. Format for stakeholder review'
      ],
      outputFormat: 'JSON with report path and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        figures: { type: 'array', items: { type: 'string' } },
        tables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'high-throughput-screening', 'report', 'documentation', 'materials-science']
}));

/**
 * @process domains/science/materials-science/additive-manufacturing
 * @description Additive Manufacturing Qualification - Qualify AM processes (SLM, EBM, DED) including parameter
 * optimization, defect minimization, and mechanical property validation.
 * @inputs { material: string, amProcess: string, component?: string, targetProperties?: object }
 * @outputs { success: boolean, processParameters: object, qualificationData: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/additive-manufacturing', {
 *   material: 'Ti-6Al-4V',
 *   amProcess: 'SLM',
 *   component: 'aerospace-bracket',
 *   targetProperties: { tensileStrength: 900, elongation: 10 }
 * });
 *
 * @references
 * - ASTM F3122: Standard Guide for Evaluating Mechanical Properties of Metal Materials Made via AM
 * - ASTM F3001: Standard Specification for Additive Manufacturing Titanium-6 Aluminum-4 Vanadium
 * - NASA-STD-6030: Additive Manufacturing Requirements
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    material,
    amProcess = 'SLM',
    component = null,
    targetProperties = {},
    qualificationLevel = 'standard',
    buildOrientation = 'vertical',
    outputDir = 'am-qualification-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting AM Qualification for: ${material} using ${amProcess}`);
  ctx.log('info', `Component: ${component || 'generic'}, Qualification level: ${qualificationLevel}`);

  // Phase 1: Powder/Feedstock Qualification
  ctx.log('info', 'Phase 1: Qualifying powder feedstock');
  const feedstockQualification = await ctx.task(feedstockQualificationTask, {
    material,
    amProcess,
    outputDir
  });

  artifacts.push(...feedstockQualification.artifacts);

  // Phase 2: Process Parameter Development
  ctx.log('info', 'Phase 2: Developing process parameters');
  const parameterDevelopment = await ctx.task(amParameterDevelopmentTask, {
    material,
    amProcess,
    targetProperties,
    buildOrientation,
    outputDir
  });

  artifacts.push(...parameterDevelopment.artifacts);

  await ctx.breakpoint({
    question: `Process parameters developed. Power: ${parameterDevelopment.parameters.laserPower}W, Speed: ${parameterDevelopment.parameters.scanSpeed}mm/s. Review parameters?`,
    title: 'AM Parameter Review',
    context: {
      runId: ctx.runId,
      summary: {
        parameters: parameterDevelopment.parameters,
        energyDensity: parameterDevelopment.energyDensity
      },
      files: parameterDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Build Execution
  ctx.log('info', 'Phase 3: Executing qualification builds');
  const buildExecution = await ctx.task(qualificationBuildTask, {
    material,
    amProcess,
    parameters: parameterDevelopment.parameters,
    buildOrientation,
    outputDir
  });

  artifacts.push(...buildExecution.artifacts);

  // Phase 4: Defect Analysis
  ctx.log('info', 'Phase 4: Analyzing defects');
  const defectAnalysis = await ctx.task(amDefectAnalysisTask, {
    material,
    buildExecution,
    outputDir
  });

  artifacts.push(...defectAnalysis.artifacts);

  // Phase 5: Microstructure Characterization
  ctx.log('info', 'Phase 5: Characterizing microstructure');
  const microstructureCharacterization = await ctx.task(amMicrostructureTask, {
    material,
    amProcess,
    buildOrientation,
    outputDir
  });

  artifacts.push(...microstructureCharacterization.artifacts);

  // Phase 6: Mechanical Property Testing
  ctx.log('info', 'Phase 6: Testing mechanical properties');
  const mechanicalTesting = await ctx.task(amMechanicalTestingTask, {
    material,
    targetProperties,
    buildOrientation,
    outputDir
  });

  artifacts.push(...mechanicalTesting.artifacts);

  await ctx.breakpoint({
    question: `Mechanical testing complete. UTS: ${mechanicalTesting.tensileStrength} MPa, Elongation: ${mechanicalTesting.elongation}%. Meets requirements: ${mechanicalTesting.meetsRequirements}. Review?`,
    title: 'Mechanical Properties Review',
    context: {
      runId: ctx.runId,
      summary: {
        tensileStrength: mechanicalTesting.tensileStrength,
        yieldStrength: mechanicalTesting.yieldStrength,
        elongation: mechanicalTesting.elongation,
        meetsRequirements: mechanicalTesting.meetsRequirements
      },
      files: mechanicalTesting.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Post-Processing Optimization
  ctx.log('info', 'Phase 7: Optimizing post-processing');
  const postProcessing = await ctx.task(amPostProcessingTask, {
    material,
    asBuiltProperties: mechanicalTesting,
    targetProperties,
    outputDir
  });

  artifacts.push(...postProcessing.artifacts);

  // Phase 8: Process Validation
  ctx.log('info', 'Phase 8: Validating process');
  const processValidation = await ctx.task(amProcessValidationTask, {
    material,
    amProcess,
    parameterDevelopment,
    defectAnalysis,
    mechanicalTesting,
    postProcessing,
    qualificationLevel,
    outputDir
  });

  artifacts.push(...processValidation.artifacts);

  // Phase 9: Documentation and Report
  ctx.log('info', 'Phase 9: Generating qualification report');
  const report = await ctx.task(amQualificationReportTask, {
    material,
    amProcess,
    component,
    feedstockQualification,
    parameterDevelopment,
    defectAnalysis,
    microstructureCharacterization,
    mechanicalTesting,
    postProcessing,
    processValidation,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    material,
    amProcess,
    processParameters: parameterDevelopment.parameters,
    qualificationData: {
      feedstock: feedstockQualification.qualified,
      defectLevel: defectAnalysis.defectDensity,
      porosity: defectAnalysis.porosity,
      mechanicalProperties: {
        tensileStrength: mechanicalTesting.tensileStrength,
        yieldStrength: mechanicalTesting.yieldStrength,
        elongation: mechanicalTesting.elongation,
        fatigue: mechanicalTesting.fatigue
      },
      microstructure: microstructureCharacterization.summary,
      postProcessing: postProcessing.treatments,
      validationStatus: processValidation.status
    },
    qualificationStatus: processValidation.qualified ? 'QUALIFIED' : 'NOT QUALIFIED',
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/additive-manufacturing',
      timestamp: startTime,
      qualificationLevel,
      buildOrientation,
      outputDir
    }
  };
}

// Task 1: Feedstock Qualification
export const feedstockQualificationTask = defineTask('am-feedstock-qualification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feedstock Qualification - ${args.material}`,
  agent: {
    name: 'am-powder-specialist',
    prompt: {
      role: 'AM Powder Qualification Specialist',
      task: 'Qualify powder feedstock for additive manufacturing',
      context: args,
      instructions: [
        '1. Verify powder chemistry (ICP-OES, XRF)',
        '2. Measure particle size distribution',
        '3. Assess powder morphology (SEM)',
        '4. Measure apparent and tap density',
        '5. Evaluate flowability (Hall flow, Carney)',
        '6. Check for moisture content',
        '7. Assess recycled powder if applicable',
        '8. Verify against material specification',
        '9. Document powder lot information',
        '10. Generate powder qualification report'
      ],
      outputFormat: 'JSON with feedstock qualification results'
    },
    outputSchema: {
      type: 'object',
      required: ['qualified', 'particleSize', 'chemistry', 'artifacts'],
      properties: {
        qualified: { type: 'boolean' },
        chemistry: { type: 'object' },
        particleSize: {
          type: 'object',
          properties: {
            D10: { type: 'number' },
            D50: { type: 'number' },
            D90: { type: 'number' }
          }
        },
        flowability: { type: 'number' },
        apparentDensity: { type: 'number' },
        morphology: { type: 'string' },
        lotNumber: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'additive-manufacturing', 'powder', 'materials-science']
}));

// Task 2: Parameter Development
export const amParameterDevelopmentTask = defineTask('am-parameter-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Parameter Development - ${args.material}`,
  agent: {
    name: 'am-process-engineer',
    prompt: {
      role: 'AM Process Development Engineer',
      task: 'Develop optimized AM process parameters',
      context: args,
      instructions: [
        '1. Define energy density window',
        '2. Set laser/beam power',
        '3. Determine scan speed',
        '4. Set layer thickness',
        '5. Define hatch spacing',
        '6. Design scan strategy',
        '7. Set build plate temperature',
        '8. Define contour parameters',
        '9. Optimize for density vs. productivity',
        '10. Document parameter rationale'
      ],
      outputFormat: 'JSON with AM process parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'energyDensity', 'artifacts'],
      properties: {
        parameters: {
          type: 'object',
          properties: {
            laserPower: { type: 'number', description: 'W' },
            scanSpeed: { type: 'number', description: 'mm/s' },
            layerThickness: { type: 'number', description: 'um' },
            hatchSpacing: { type: 'number', description: 'um' },
            scanStrategy: { type: 'string' }
          }
        },
        energyDensity: { type: 'number', description: 'J/mm3' },
        processingWindow: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'additive-manufacturing', 'parameters', 'materials-science']
}));

// Task 3: Qualification Build
export const qualificationBuildTask = defineTask('am-qualification-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Qualification Build - ${args.material}`,
  agent: {
    name: 'am-build-engineer',
    prompt: {
      role: 'AM Build Engineer',
      task: 'Execute qualification builds with test specimens',
      context: args,
      instructions: [
        '1. Design build layout with test coupons',
        '2. Include tensile bars, fatigue specimens, cubes',
        '3. Set up build in multiple orientations',
        '4. Execute builds with process monitoring',
        '5. Log all build parameters',
        '6. Monitor for build failures',
        '7. Document any deviations',
        '8. Remove parts from build plate',
        '9. Track specimen identification',
        '10. Document build results'
      ],
      outputFormat: 'JSON with build execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'specimens', 'buildLog', 'artifacts'],
      properties: {
        completed: { type: 'boolean' },
        specimens: { type: 'array', items: { type: 'object' } },
        buildTime: { type: 'number', description: 'hours' },
        buildLog: { type: 'string' },
        deviations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'additive-manufacturing', 'build', 'materials-science']
}));

// Task 4: Defect Analysis
export const amDefectAnalysisTask = defineTask('am-defect-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Defect Analysis - ${args.material}`,
  agent: {
    name: 'nde-specialist',
    prompt: {
      role: 'AM Defect Analysis Specialist',
      task: 'Analyze defects in AM builds',
      context: args,
      instructions: [
        '1. Perform CT scanning for internal defects',
        '2. Measure porosity level',
        '3. Identify lack of fusion defects',
        '4. Detect keyholing defects',
        '5. Analyze crack formation',
        '6. Quantify defect size distribution',
        '7. Map defect locations',
        '8. Assess defect criticality',
        '9. Compare with acceptance criteria',
        '10. Document defect analysis'
      ],
      outputFormat: 'JSON with defect analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['porosity', 'defectDensity', 'artifacts'],
      properties: {
        porosity: { type: 'number', description: '%' },
        defectDensity: { type: 'number' },
        defectTypes: { type: 'array', items: { type: 'string' } },
        largestDefect: { type: 'number', description: 'um' },
        defectDistribution: { type: 'object' },
        ctScanPath: { type: 'string' },
        meetsAcceptance: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'additive-manufacturing', 'defect-analysis', 'materials-science']
}));

// Task 5: Microstructure Characterization
export const amMicrostructureTask = defineTask('am-microstructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Microstructure Characterization - ${args.material}`,
  agent: {
    name: 'metallographer',
    prompt: {
      role: 'AM Microstructure Specialist',
      task: 'Characterize microstructure of AM material',
      context: args,
      instructions: [
        '1. Prepare metallographic samples',
        '2. Examine as-built microstructure',
        '3. Identify melt pool boundaries',
        '4. Characterize grain structure (EBSD)',
        '5. Measure grain size',
        '6. Identify phases present',
        '7. Analyze texture and orientation',
        '8. Compare XY vs. Z directions',
        '9. Document microstructural features',
        '10. Generate microstructure report'
      ],
      outputFormat: 'JSON with microstructure characterization results'
    },
    outputSchema: {
      type: 'object',
      required: ['grainSize', 'phases', 'summary', 'artifacts'],
      properties: {
        grainSize: { type: 'number', description: 'um' },
        grainMorphology: { type: 'string' },
        phases: { type: 'array', items: { type: 'string' } },
        texture: { type: 'string' },
        anisotropy: { type: 'string' },
        meltPoolStructure: { type: 'string' },
        summary: { type: 'string' },
        imagePaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'additive-manufacturing', 'microstructure', 'materials-science']
}));

// Task 6: Mechanical Testing
export const amMechanicalTestingTask = defineTask('am-mechanical-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mechanical Testing - ${args.material}`,
  agent: {
    name: 'mechanical-test-engineer',
    prompt: {
      role: 'AM Mechanical Testing Engineer',
      task: 'Test mechanical properties of AM specimens',
      context: args,
      instructions: [
        '1. Perform tensile testing per ASTM E8',
        '2. Test multiple orientations (XY, Z)',
        '3. Perform hardness testing',
        '4. Conduct fatigue testing if required',
        '5. Test fracture toughness if required',
        '6. Perform impact testing if required',
        '7. Calculate statistics',
        '8. Compare with requirements',
        '9. Compare with wrought equivalents',
        '10. Document test results'
      ],
      outputFormat: 'JSON with mechanical testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['tensileStrength', 'yieldStrength', 'elongation', 'meetsRequirements', 'artifacts'],
      properties: {
        tensileStrength: { type: 'number', description: 'MPa' },
        yieldStrength: { type: 'number', description: 'MPa' },
        elongation: { type: 'number', description: '%' },
        reductionInArea: { type: 'number', description: '%' },
        hardness: { type: 'number' },
        fatigue: { type: 'object' },
        anisotropyRatio: { type: 'number' },
        meetsRequirements: { type: 'boolean' },
        statisticalAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'additive-manufacturing', 'mechanical-testing', 'materials-science']
}));

// Task 7: Post-Processing
export const amPostProcessingTask = defineTask('am-post-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-Processing - ${args.material}`,
  agent: {
    name: 'post-processing-engineer',
    prompt: {
      role: 'AM Post-Processing Engineer',
      task: 'Optimize post-processing treatments',
      context: args,
      instructions: [
        '1. Design stress relief treatment',
        '2. Develop HIP parameters if needed',
        '3. Design heat treatment schedule',
        '4. Plan surface finishing',
        '5. Design machining strategy',
        '6. Test post-processed properties',
        '7. Compare as-built vs. post-processed',
        '8. Optimize treatment parameters',
        '9. Document post-processing sequence',
        '10. Verify property improvements'
      ],
      outputFormat: 'JSON with post-processing optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['treatments', 'propertyChanges', 'artifacts'],
      properties: {
        treatments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              parameters: { type: 'object' }
            }
          }
        },
        propertyChanges: { type: 'object' },
        surfaceFinish: { type: 'number', description: 'Ra' },
        finalDensity: { type: 'number', description: '%' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'additive-manufacturing', 'post-processing', 'materials-science']
}));

// Task 8: Process Validation
export const amProcessValidationTask = defineTask('am-process-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Process Validation - ${args.material}`,
  agent: {
    name: 'qualification-engineer',
    prompt: {
      role: 'AM Process Qualification Engineer',
      task: 'Validate AM process meets qualification requirements',
      context: args,
      instructions: [
        '1. Review all qualification data',
        '2. Verify feedstock compliance',
        '3. Confirm defect levels acceptable',
        '4. Verify mechanical properties meet spec',
        '5. Check microstructure requirements',
        '6. Validate reproducibility',
        '7. Assess process capability (Cpk)',
        '8. Document any deviations',
        '9. Make qualification decision',
        '10. Generate validation summary'
      ],
      outputFormat: 'JSON with process validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['qualified', 'status', 'artifacts'],
      properties: {
        qualified: { type: 'boolean' },
        status: { type: 'string', enum: ['QUALIFIED', 'CONDITIONALLY_QUALIFIED', 'NOT_QUALIFIED'] },
        complianceMatrix: { type: 'object' },
        deviations: { type: 'array', items: { type: 'string' } },
        processCpk: { type: 'number' },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'additive-manufacturing', 'validation', 'materials-science']
}));

// Task 9: Qualification Report
export const amQualificationReportTask = defineTask('am-qualification-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Qualification Report - ${args.material}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'AM Qualification Technical Writer',
      task: 'Generate comprehensive AM qualification report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document feedstock qualification',
        '3. Present process parameters',
        '4. Include defect analysis',
        '5. Present microstructure results',
        '6. Document mechanical properties',
        '7. Include post-processing details',
        '8. Present validation summary',
        '9. Add conclusions and recommendations',
        '10. Format per qualification standards'
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
  labels: ['agent', 'additive-manufacturing', 'report', 'documentation', 'materials-science']
}));

/**
 * @process specializations/domains/science/mechanical-engineering/stress-deflection-analysis
 * @description Stress and Deflection Analysis - Evaluating component strength and stiffness through
 * analytical hand calculations (Roark's Formulas) and FEA to verify design against yield, ultimate,
 * and deflection criteria with appropriate safety factors. Covers beam theory, plate theory, and
 * pressure vessel calculations.
 * @inputs { projectName: string, componentType: string, geometry: object, material: object, loads: array }
 * @outputs { success: boolean, stressResults: object, deflectionResults: object, safetyFactors: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/stress-deflection-analysis', {
 *   projectName: 'Cantilever Beam Analysis',
 *   componentType: 'beam',
 *   geometry: { length: 500, crossSection: 'rectangular', width: 50, height: 25 },
 *   material: { name: 'Steel 1018', E: 200000, yieldStrength: 370, ultimateStrength: 440 },
 *   loads: [{ type: 'point', magnitude: 1000, location: 'tip' }]
 * });
 *
 * @references
 * - Roark's Formulas for Stress and Strain: https://www.mheducation.com/highered/product/roark-s-formulas-stress-strain-young-sadegh/M9780073398204.html
 * - Shigley's Mechanical Engineering Design: https://www.mheducation.com/highered/product/shigley-s-mechanical-engineering-design-budynas-nisbett/M9780073398204.html
 * - Mechanics of Materials by Hibbeler
 * - ASME BPVC Section VIII: https://www.asme.org/codes-standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    componentType, // 'beam', 'plate', 'shell', 'pressure-vessel', 'shaft', 'column'
    geometry = {},
    material = {},
    loads = [],
    constraints = [],
    analysisRequirements = {},
    designCriteria = {},
    outputDir = 'stress-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Stress and Deflection Analysis for ${projectName}`);
  ctx.log('info', `Component Type: ${componentType}`);

  // ============================================================================
  // PHASE 1: INPUT VALIDATION AND PROBLEM SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Input Validation and Problem Setup');

  const setupResult = await ctx.task(problemSetupTask, {
    projectName,
    componentType,
    geometry,
    material,
    loads,
    constraints,
    designCriteria,
    outputDir
  });

  artifacts.push(...setupResult.artifacts);

  ctx.log('info', `Problem setup complete - ${setupResult.loadCases} load cases identified`);

  // ============================================================================
  // PHASE 2: SECTION PROPERTY CALCULATIONS
  // ============================================================================

  ctx.log('info', 'Phase 2: Section Property Calculations');

  const sectionResult = await ctx.task(sectionPropertiesTask, {
    projectName,
    componentType,
    geometry,
    outputDir
  });

  artifacts.push(...sectionResult.artifacts);

  ctx.log('info', `Section properties calculated - I=${sectionResult.momentOfInertia} mm^4, A=${sectionResult.area} mm^2`);

  // ============================================================================
  // PHASE 3: ANALYTICAL STRESS CALCULATIONS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analytical Stress Calculations');

  const stressResult = await ctx.task(analyticalStressTask, {
    projectName,
    componentType,
    geometry,
    sectionResult,
    material,
    loads,
    constraints,
    outputDir
  });

  artifacts.push(...stressResult.artifacts);

  ctx.log('info', `Stress calculations complete - Max stress: ${stressResult.maxStress} MPa`);

  // Quality Gate: Stress exceeds yield
  if (stressResult.maxStress > material.yieldStrength) {
    await ctx.breakpoint({
      question: `Maximum stress ${stressResult.maxStress} MPa exceeds yield strength ${material.yieldStrength} MPa. Yielding predicted at location: ${stressResult.criticalLocation}. Review and redesign?`,
      title: 'Yield Strength Exceeded',
      context: {
        runId: ctx.runId,
        stressSummary: stressResult.summary,
        criticalLocation: stressResult.criticalLocation,
        stressDistribution: stressResult.stressDistribution,
        files: stressResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: DEFLECTION CALCULATIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Deflection Calculations');

  const deflectionResult = await ctx.task(deflectionCalculationsTask, {
    projectName,
    componentType,
    geometry,
    sectionResult,
    material,
    loads,
    constraints,
    outputDir
  });

  artifacts.push(...deflectionResult.artifacts);

  ctx.log('info', `Deflection calculations complete - Max deflection: ${deflectionResult.maxDeflection} mm`);

  // Quality Gate: Deflection exceeds limit
  const deflectionLimit = designCriteria.deflectionLimit || geometry.length / 250;
  if (deflectionResult.maxDeflection > deflectionLimit) {
    await ctx.breakpoint({
      question: `Maximum deflection ${deflectionResult.maxDeflection} mm exceeds limit ${deflectionLimit} mm (L/${Math.round(geometry.length / deflectionLimit)}). Stiffness insufficient. Review design?`,
      title: 'Deflection Limit Exceeded',
      context: {
        runId: ctx.runId,
        deflectionSummary: deflectionResult.summary,
        deflectionLimit,
        deflectionCurve: deflectionResult.deflectionCurve,
        files: deflectionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: COMBINED STRESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Combined Stress Analysis');

  const combinedResult = await ctx.task(combinedStressTask, {
    projectName,
    componentType,
    stressResult,
    material,
    outputDir
  });

  artifacts.push(...combinedResult.artifacts);

  ctx.log('info', `Combined stress analysis complete - Von Mises: ${combinedResult.vonMisesStress} MPa`);

  // ============================================================================
  // PHASE 6: SAFETY FACTOR CALCULATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Safety Factor Calculations');

  const safetyResult = await ctx.task(safetyFactorTask, {
    projectName,
    stressResult,
    combinedResult,
    material,
    designCriteria,
    outputDir
  });

  artifacts.push(...safetyResult.artifacts);

  ctx.log('info', `Safety factors calculated - Yield SF: ${safetyResult.yieldSF}, Ultimate SF: ${safetyResult.ultimateSF}`);

  // Quality Gate: Safety factor below requirement
  const requiredSF = designCriteria.safetyFactor || 2.0;
  if (safetyResult.yieldSF < requiredSF) {
    await ctx.breakpoint({
      question: `Yield safety factor ${safetyResult.yieldSF} is below required ${requiredSF}. Design does not meet safety requirements. Redesign required?`,
      title: 'Safety Factor Warning',
      context: {
        runId: ctx.runId,
        safetyFactors: safetyResult,
        requiredSF,
        recommendations: safetyResult.recommendations,
        files: safetyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: FEA CORRELATION (IF APPLICABLE)
  // ============================================================================

  let feaCorrelationResult = null;
  if (analysisRequirements.includeFEA) {
    ctx.log('info', 'Phase 7: FEA Correlation');

    feaCorrelationResult = await ctx.task(feaCorrelationTask, {
      projectName,
      componentType,
      geometry,
      material,
      loads,
      constraints,
      analyticalStress: stressResult.maxStress,
      analyticalDeflection: deflectionResult.maxDeflection,
      outputDir
    });

    artifacts.push(...feaCorrelationResult.artifacts);

    ctx.log('info', `FEA correlation complete - Stress difference: ${feaCorrelationResult.stressDifference}%`);
  }

  // ============================================================================
  // PHASE 8: GENERATE ANALYSIS REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Analysis Report');

  const reportResult = await ctx.task(generateStressReportTask, {
    projectName,
    componentType,
    geometry,
    material,
    loads,
    sectionResult,
    stressResult,
    deflectionResult,
    combinedResult,
    safetyResult,
    feaCorrelationResult,
    designCriteria,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Stress and Deflection Analysis Complete for ${projectName}. Max stress: ${stressResult.maxStress} MPa, Max deflection: ${deflectionResult.maxDeflection} mm, Yield SF: ${safetyResult.yieldSF}. Approve analysis?`,
    title: 'Stress Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        maxStress: stressResult.maxStress,
        maxDeflection: deflectionResult.maxDeflection,
        vonMisesStress: combinedResult.vonMisesStress,
        yieldSF: safetyResult.yieldSF,
        ultimateSF: safetyResult.ultimateSF
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Analysis Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    componentType,
    stressResults: {
      maxStress: stressResult.maxStress,
      maxBendingStress: stressResult.maxBendingStress,
      maxShearStress: stressResult.maxShearStress,
      vonMisesStress: combinedResult.vonMisesStress,
      criticalLocation: stressResult.criticalLocation
    },
    deflectionResults: {
      maxDeflection: deflectionResult.maxDeflection,
      deflectionLocation: deflectionResult.maxDeflectionLocation,
      slopeAtEnd: deflectionResult.slopeAtEnd
    },
    safetyFactors: {
      yieldSF: safetyResult.yieldSF,
      ultimateSF: safetyResult.ultimateSF,
      deflectionMargin: safetyResult.deflectionMargin
    },
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/stress-deflection-analysis',
      processSlug: 'stress-deflection-analysis',
      category: 'mechanical-engineering',
      timestamp: startTime,
      componentType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const problemSetupTask = defineTask('problem-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Problem Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Analysis Specialist',
      task: 'Validate inputs and set up stress analysis problem',
      context: {
        projectName: args.projectName,
        componentType: args.componentType,
        geometry: args.geometry,
        material: args.material,
        loads: args.loads,
        constraints: args.constraints,
        designCriteria: args.designCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate geometry inputs for completeness',
        '2. Verify material properties (E, Sy, Su, nu)',
        '3. Classify loads by type (static, dynamic, thermal)',
        '4. Define boundary conditions/constraints',
        '5. Identify load cases and combinations',
        '6. Select appropriate analysis methods',
        '7. Define design criteria and allowables',
        '8. Determine applicable codes/standards',
        '9. Create free body diagram',
        '10. Document assumptions and simplifications'
      ],
      outputFormat: 'JSON object with problem setup results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'loadCases', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        loadCases: { type: 'number' },
        analysisMethod: { type: 'string' },
        assumptions: { type: 'array' },
        applicableStandards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'stress-analysis', 'setup']
}));

export const sectionPropertiesTask = defineTask('section-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: `Section Properties - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Analysis Specialist',
      task: 'Calculate cross-section properties',
      context: {
        projectName: args.projectName,
        componentType: args.componentType,
        geometry: args.geometry,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate cross-sectional area (A)',
        '2. Calculate centroid location',
        '3. Calculate moment of inertia (Ix, Iy)',
        '4. Calculate section modulus (Sx, Sy)',
        '5. Calculate polar moment of inertia (J)',
        '6. Calculate radius of gyration (r)',
        '7. Calculate first moment of area (Q) for shear',
        '8. Calculate plastic section modulus (Z)',
        '9. Handle composite sections if applicable',
        '10. Document all property calculations'
      ],
      outputFormat: 'JSON object with section properties'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'area', 'momentOfInertia', 'sectionModulus', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        area: { type: 'number' },
        momentOfInertia: { type: 'number' },
        momentOfInertiaY: { type: 'number' },
        sectionModulus: { type: 'number' },
        polarMoment: { type: 'number' },
        radiusOfGyration: { type: 'number' },
        firstMomentQ: { type: 'number' },
        plasticModulus: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'stress-analysis', 'section-properties']
}));

export const analyticalStressTask = defineTask('analytical-stress', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analytical Stress Calculations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Analysis Specialist',
      task: 'Calculate stresses using analytical methods',
      context: {
        projectName: args.projectName,
        componentType: args.componentType,
        geometry: args.geometry,
        sectionResult: args.sectionResult,
        material: args.material,
        loads: args.loads,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate internal forces (shear, moment, axial, torsion)',
        '2. Create shear force diagram (SFD)',
        '3. Create bending moment diagram (BMD)',
        '4. Calculate bending stress: sigma = M*c/I',
        '5. Calculate shear stress: tau = V*Q/(I*t)',
        '6. Calculate axial stress: sigma = P/A',
        '7. Calculate torsional stress: tau = T*r/J',
        '8. Apply stress concentration factors (Kt)',
        '9. Identify maximum stress location',
        '10. Plot stress distribution'
      ],
      outputFormat: 'JSON object with stress calculation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'maxStress', 'criticalLocation', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        maxStress: { type: 'number' },
        maxBendingStress: { type: 'number' },
        maxShearStress: { type: 'number' },
        maxAxialStress: { type: 'number' },
        maxTorsionalStress: { type: 'number' },
        criticalLocation: { type: 'string' },
        stressDistribution: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'stress-analysis', 'analytical']
}));

export const deflectionCalculationsTask = defineTask('deflection-calculations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deflection Calculations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Analysis Specialist',
      task: 'Calculate deflections using analytical methods',
      context: {
        projectName: args.projectName,
        componentType: args.componentType,
        geometry: args.geometry,
        sectionResult: args.sectionResult,
        material: args.material,
        loads: args.loads,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select deflection calculation method:',
        '   - Direct integration',
        '   - Superposition with standard formulas',
        '   - Energy methods (Castigliano)',
        '2. Apply Roark\'s formulas for standard cases',
        '3. Calculate deflection: delta = f(load, E, I, L)',
        '4. Calculate slope: theta = d(delta)/dx',
        '5. Handle multiple loads by superposition',
        '6. Calculate deflection at critical points',
        '7. Plot deflection curve',
        '8. Check for large deflection effects',
        '9. Consider shear deflection if applicable',
        '10. Document calculation methodology'
      ],
      outputFormat: 'JSON object with deflection results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'maxDeflection', 'maxDeflectionLocation', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        maxDeflection: { type: 'number' },
        maxDeflectionLocation: { type: 'string' },
        slopeAtEnd: { type: 'number' },
        deflectionCurve: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'stress-analysis', 'deflection']
}));

export const combinedStressTask = defineTask('combined-stress', (args, taskCtx) => ({
  kind: 'agent',
  title: `Combined Stress Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Analysis Specialist',
      task: 'Analyze combined stress states and failure criteria',
      context: {
        projectName: args.projectName,
        componentType: args.componentType,
        stressResult: args.stressResult,
        material: args.material,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Construct stress tensor at critical location',
        '2. Calculate principal stresses (sigma1, sigma2, sigma3)',
        '3. Calculate maximum shear stress',
        '4. Calculate Von Mises equivalent stress:',
        '   sigma_vm = sqrt(sigma1^2 - sigma1*sigma2 + sigma2^2)',
        '5. Calculate Tresca stress',
        '6. Plot Mohr\'s circle',
        '7. Identify governing failure criterion',
        '8. Check biaxial and triaxial stress states',
        '9. Evaluate stress state (plane stress/strain)',
        '10. Document combined stress analysis'
      ],
      outputFormat: 'JSON object with combined stress results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vonMisesStress', 'principalStresses', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vonMisesStress: { type: 'number' },
        trescaStress: { type: 'number' },
        principalStresses: {
          type: 'object',
          properties: {
            sigma1: { type: 'number' },
            sigma2: { type: 'number' },
            sigma3: { type: 'number' }
          }
        },
        maxShearStress: { type: 'number' },
        stressTensor: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'stress-analysis', 'combined-stress']
}));

export const safetyFactorTask = defineTask('safety-factor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Safety Factor Calculations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Analysis Specialist',
      task: 'Calculate safety factors and evaluate design adequacy',
      context: {
        projectName: args.projectName,
        stressResult: args.stressResult,
        combinedResult: args.combinedResult,
        material: args.material,
        designCriteria: args.designCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate yield safety factor:',
        '   SF_yield = Sy / sigma_max',
        '2. Calculate ultimate safety factor:',
        '   SF_ultimate = Su / sigma_max',
        '3. Apply appropriate failure theory:',
        '   - Ductile: Von Mises or Tresca',
        '   - Brittle: Maximum Normal Stress',
        '4. Compare to required safety factors',
        '5. Calculate margin of safety: MS = SF - 1',
        '6. Evaluate deflection margin',
        '7. Identify limiting criterion',
        '8. Provide redesign recommendations if needed',
        '9. Consider load and material variability',
        '10. Document safety assessment'
      ],
      outputFormat: 'JSON object with safety factor results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'yieldSF', 'ultimateSF', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        yieldSF: { type: 'number' },
        ultimateSF: { type: 'number' },
        marginOfSafety: { type: 'number' },
        deflectionMargin: { type: 'number' },
        limitingCriterion: { type: 'string' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'stress-analysis', 'safety-factor']
}));

export const feaCorrelationTask = defineTask('fea-correlation', (args, taskCtx) => ({
  kind: 'agent',
  title: `FEA Correlation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Specialist',
      task: 'Correlate analytical results with FEA',
      context: {
        projectName: args.projectName,
        componentType: args.componentType,
        geometry: args.geometry,
        material: args.material,
        loads: args.loads,
        constraints: args.constraints,
        analyticalStress: args.analyticalStress,
        analyticalDeflection: args.analyticalDeflection,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Build simple FEA model',
        '2. Apply equivalent loads and constraints',
        '3. Run linear static analysis',
        '4. Extract max stress from FEA',
        '5. Extract max deflection from FEA',
        '6. Compare with analytical results',
        '7. Calculate percentage difference',
        '8. Identify sources of difference:',
        '   - Mesh refinement',
        '   - Boundary condition idealization',
        '   - Stress concentration effects',
        '9. Validate analytical approach',
        '10. Document correlation findings'
      ],
      outputFormat: 'JSON object with FEA correlation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'feaStress', 'feaDeflection', 'stressDifference', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        feaStress: { type: 'number' },
        feaDeflection: { type: 'number' },
        stressDifference: { type: 'number' },
        deflectionDifference: { type: 'number' },
        correlationAssessment: { type: 'string' },
        differenceSources: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'stress-analysis', 'fea-correlation']
}));

export const generateStressReportTask = defineTask('generate-stress-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Stress Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive stress analysis report',
      context: {
        projectName: args.projectName,
        componentType: args.componentType,
        geometry: args.geometry,
        material: args.material,
        loads: args.loads,
        sectionResult: args.sectionResult,
        stressResult: args.stressResult,
        deflectionResult: args.deflectionResult,
        combinedResult: args.combinedResult,
        safetyResult: args.safetyResult,
        feaCorrelationResult: args.feaCorrelationResult,
        designCriteria: args.designCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document analysis scope and objectives',
        '3. Present geometry and material properties',
        '4. Show load cases and boundary conditions',
        '5. Present section property calculations',
        '6. Show stress calculations with diagrams',
        '7. Present deflection results',
        '8. Document safety factor assessment',
        '9. Include FEA correlation if performed',
        '10. State conclusions and recommendations'
      ],
      outputFormat: 'JSON object with report path'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        conclusions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'stress-analysis', 'reporting']
}));

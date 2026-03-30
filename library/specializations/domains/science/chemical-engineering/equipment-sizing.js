/**
 * @process chemical-engineering/equipment-sizing
 * @description Size and specify major process equipment including vessels, columns, heat exchangers, pumps, and compressors
 * @inputs { processName: string, equipmentType: string, processConditions: object, designBasis: object, outputDir: string }
 * @outputs { success: boolean, specifications: object, datasheet: string, drawings: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    equipmentType,
    processConditions,
    designBasis,
    applicableCodes = ['ASME', 'API'],
    outputDir = 'equipment-sizing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Calculate Design Conditions
  ctx.log('info', 'Starting equipment sizing: Calculating design conditions');
  const designConditionsResult = await ctx.task(designConditionsTask, {
    processName,
    equipmentType,
    processConditions,
    designBasis,
    applicableCodes,
    outputDir
  });

  if (!designConditionsResult.success) {
    return {
      success: false,
      error: 'Design conditions calculation failed',
      details: designConditionsResult,
      metadata: { processId: 'chemical-engineering/equipment-sizing', timestamp: startTime }
    };
  }

  artifacts.push(...designConditionsResult.artifacts);

  // Task 2: Apply Design Margins and Safety Factors
  ctx.log('info', 'Applying design margins and safety factors');
  const marginsResult = await ctx.task(designMarginsTask, {
    processName,
    equipmentType,
    designConditions: designConditionsResult.designConditions,
    applicableCodes,
    outputDir
  });

  artifacts.push(...marginsResult.artifacts);

  // Task 3: Perform Equipment Sizing Calculations
  ctx.log('info', 'Performing equipment sizing calculations');
  const sizingResult = await ctx.task(equipmentSizingTask, {
    processName,
    equipmentType,
    designConditions: marginsResult.finalDesignConditions,
    processConditions,
    designBasis,
    outputDir
  });

  artifacts.push(...sizingResult.artifacts);

  // Task 4: Select Materials of Construction
  ctx.log('info', 'Selecting materials of construction');
  const materialSelectionResult = await ctx.task(materialSelectionTask, {
    processName,
    equipmentType,
    processConditions,
    designConditions: marginsResult.finalDesignConditions,
    corrosionData: designBasis.corrosionData || {},
    outputDir
  });

  artifacts.push(...materialSelectionResult.artifacts);

  // Task 5: Develop Equipment Specification Sheet
  ctx.log('info', 'Developing equipment specification sheet');
  const specSheetResult = await ctx.task(specificationSheetTask, {
    processName,
    equipmentType,
    sizing: sizingResult.sizing,
    materials: materialSelectionResult.materials,
    designConditions: marginsResult.finalDesignConditions,
    applicableCodes,
    outputDir
  });

  artifacts.push(...specSheetResult.artifacts);

  // Breakpoint: Review equipment specifications
  await ctx.breakpoint({
    question: `Equipment sizing complete for ${equipmentType}. Key dimensions: ${JSON.stringify(sizingResult.keyDimensions)}. Material: ${materialSelectionResult.materials.primary}. Review specifications?`,
    title: 'Equipment Sizing Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        equipmentType,
        keyDimensions: sizingResult.keyDimensions,
        designPressure: marginsResult.finalDesignConditions.designPressure,
        designTemperature: marginsResult.finalDesignConditions.designTemperature,
        material: materialSelectionResult.materials.primary
      }
    }
  });

  // Task 6: Coordinate with Mechanical Engineering
  ctx.log('info', 'Coordinating with mechanical engineering');
  const mechanicalCoordResult = await ctx.task(mechanicalCoordinationTask, {
    processName,
    equipmentType,
    specifications: specSheetResult.specifications,
    sizing: sizingResult.sizing,
    materials: materialSelectionResult.materials,
    applicableCodes,
    outputDir
  });

  artifacts.push(...mechanicalCoordResult.artifacts);

  // Task 7: Generate Vendor Data Requirements
  ctx.log('info', 'Generating vendor data requirements');
  const vendorDataResult = await ctx.task(vendorDataRequirementsTask, {
    processName,
    equipmentType,
    specifications: specSheetResult.specifications,
    outputDir
  });

  artifacts.push(...vendorDataResult.artifacts);

  // Task 8: Create P&ID Equipment Tags
  ctx.log('info', 'Creating P&ID equipment tags and descriptions');
  const pidTagsResult = await ctx.task(pidTagsTask, {
    processName,
    equipmentType,
    specifications: specSheetResult.specifications,
    outputDir
  });

  artifacts.push(...pidTagsResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    equipmentType,
    specifications: specSheetResult.specifications,
    sizing: sizingResult.sizing,
    materials: materialSelectionResult.materials,
    datasheet: specSheetResult.datasheetPath,
    pidTag: pidTagsResult.pidTag,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/equipment-sizing',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Design Conditions Calculation
export const designConditionsTask = defineTask('design-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate design conditions',
  agent: {
    name: 'equipment-engineer',
    prompt: {
      role: 'process engineer',
      task: 'Calculate design pressure, temperature, and flow rates for equipment',
      context: args,
      instructions: [
        'Review operating conditions (normal, maximum, minimum)',
        'Identify upset and emergency conditions',
        'Calculate design pressure per applicable codes (ASME, API)',
        'Calculate design temperature range',
        'Determine design flow rates including turndown',
        'Consider hydraulic considerations (static head, etc.)',
        'Document basis for design conditions',
        'List all conditions used in sizing'
      ],
      outputFormat: 'JSON with design conditions, calculation basis, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'designConditions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        designConditions: {
          type: 'object',
          properties: {
            operatingPressure: { type: 'number' },
            operatingTemperature: { type: 'number' },
            maxOperatingPressure: { type: 'number' },
            maxOperatingTemperature: { type: 'number' },
            flowRates: { type: 'object' }
          }
        },
        calculationBasis: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'equipment-sizing', 'design-conditions']
}));

// Task 2: Design Margins
export const designMarginsTask = defineTask('design-margins', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply design margins and safety factors',
  agent: {
    name: 'equipment-engineer',
    prompt: {
      role: 'process design engineer',
      task: 'Apply appropriate design margins and safety factors per codes',
      context: args,
      instructions: [
        'Apply design pressure margin (typically 10% or 25 psi min)',
        'Apply design temperature margin (typically 25-50F)',
        'Apply flow rate design margins (typically 10-20%)',
        'Consider future expansion requirements',
        'Apply code-specific safety factors',
        'Document margin basis and rationale',
        'Calculate final design conditions',
        'Verify compliance with applicable codes'
      ],
      outputFormat: 'JSON with final design conditions, margins applied, code compliance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'finalDesignConditions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        finalDesignConditions: {
          type: 'object',
          properties: {
            designPressure: { type: 'number' },
            designTemperature: { type: 'number' },
            designFlowRate: { type: 'number' }
          }
        },
        marginsApplied: { type: 'object' },
        codeCompliance: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'equipment-sizing', 'design-margins']
}));

// Task 3: Equipment Sizing Calculations
export const equipmentSizingTask = defineTask('equipment-sizing-calc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform equipment sizing calculations',
  agent: {
    name: 'equipment-engineer',
    prompt: {
      role: 'equipment sizing engineer',
      task: 'Size equipment using established engineering methods',
      context: args,
      instructions: [
        'Apply appropriate sizing methodology for equipment type',
        'For vessels: calculate volume, diameter, height, L/D ratio',
        'For heat exchangers: calculate area, tubes, shell diameter',
        'For pumps: calculate head, NPSH, power requirements',
        'For compressors: calculate stages, power, discharge conditions',
        'For columns: calculate diameter, height, number of stages',
        'Document all calculations with references',
        'Identify key dimensions and capacities'
      ],
      outputFormat: 'JSON with sizing results, key dimensions, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sizing', 'keyDimensions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sizing: { type: 'object' },
        keyDimensions: { type: 'object' },
        calculations: { type: 'object' },
        references: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'equipment-sizing', 'calculations']
}));

// Task 4: Material Selection
export const materialSelectionTask = defineTask('material-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select materials of construction',
  agent: {
    name: 'equipment-engineer',
    prompt: {
      role: 'materials and corrosion engineer',
      task: 'Select appropriate materials of construction for equipment',
      context: args,
      instructions: [
        'Evaluate process fluid corrosivity',
        'Consider operating temperature effects on materials',
        'Assess hydrogen embrittlement potential',
        'Evaluate stress corrosion cracking susceptibility',
        'Select primary material of construction',
        'Specify cladding or lining if required',
        'Select gasket and seal materials',
        'Document material selection rationale and corrosion allowance'
      ],
      outputFormat: 'JSON with materials selection, corrosion allowance, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'materials', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        materials: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            cladding: { type: 'string' },
            gaskets: { type: 'string' },
            corrosionAllowance: { type: 'number' }
          }
        },
        rationale: { type: 'string' },
        corrosionAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'equipment-sizing', 'materials']
}));

// Task 5: Specification Sheet Development
export const specificationSheetTask = defineTask('specification-sheet', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop equipment specification sheet',
  agent: {
    name: 'equipment-engineer',
    prompt: {
      role: 'equipment specification engineer',
      task: 'Develop comprehensive equipment specification/data sheet',
      context: args,
      instructions: [
        'Create equipment tag and service description',
        'Document design conditions (pressure, temperature)',
        'List all dimensions and capacities',
        'Specify materials for all components',
        'Include process data (flows, compositions)',
        'List applicable codes and standards',
        'Include mechanical design requirements',
        'Add notes for fabrication and testing'
      ],
      outputFormat: 'JSON with specifications, datasheet path, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'specifications', 'datasheetPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        specifications: { type: 'object' },
        datasheetPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'equipment-sizing', 'specification']
}));

// Task 6: Mechanical Coordination
export const mechanicalCoordinationTask = defineTask('mechanical-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate with mechanical engineering',
  agent: {
    name: 'equipment-engineer',
    prompt: {
      role: 'mechanical engineering coordinator',
      task: 'Coordinate process requirements with mechanical engineering',
      context: args,
      instructions: [
        'Review process requirements for mechanical design',
        'Coordinate nozzle sizing and orientation',
        'Specify internals requirements (baffles, trays, etc.)',
        'Define support and foundation requirements',
        'Coordinate insulation requirements',
        'Specify access requirements (manholes, platforms)',
        'Document mechanical design inputs',
        'Create interface document for mechanical'
      ],
      outputFormat: 'JSON with mechanical requirements, interface document, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'mechanicalRequirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        mechanicalRequirements: { type: 'object' },
        interfaceDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'equipment-sizing', 'mechanical']
}));

// Task 7: Vendor Data Requirements
export const vendorDataRequirementsTask = defineTask('vendor-data-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate vendor data requirements',
  agent: {
    name: 'equipment-engineer',
    prompt: {
      role: 'procurement engineer',
      task: 'Define vendor data requirements for equipment procurement',
      context: args,
      instructions: [
        'List required vendor drawings (GA, sectional, etc.)',
        'Specify calculation submittals required',
        'Define test requirements and certifications',
        'List material certifications required',
        'Specify performance guarantees needed',
        'Define spare parts requirements',
        'List O&M manual requirements',
        'Create vendor data requirement list'
      ],
      outputFormat: 'JSON with vendor data requirements list, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vendorDataRequirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        vendorDataRequirements: {
          type: 'object',
          properties: {
            drawings: { type: 'array' },
            calculations: { type: 'array' },
            certifications: { type: 'array' },
            guarantees: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'equipment-sizing', 'procurement']
}));

// Task 8: P&ID Tags
export const pidTagsTask = defineTask('pid-tags', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create P&ID equipment tags and descriptions',
  agent: {
    name: 'equipment-engineer',
    prompt: {
      role: 'P&ID engineer',
      task: 'Create equipment tags and descriptions for P&ID',
      context: args,
      instructions: [
        'Assign equipment tag following project naming convention',
        'Create equipment description for P&ID legend',
        'Define equipment symbol for P&ID',
        'List nozzle tags and descriptions',
        'Create instrument connections list',
        'Document process and utility connections',
        'Generate P&ID data sheet entries',
        'Coordinate with P&ID drafter'
      ],
      outputFormat: 'JSON with P&ID tag, description, nozzle list, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pidTag', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pidTag: { type: 'string' },
        description: { type: 'string' },
        nozzles: { type: 'array' },
        instrumentConnections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'equipment-sizing', 'pid']
}));

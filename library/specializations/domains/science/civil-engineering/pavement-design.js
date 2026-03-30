/**
 * @process civil-engineering/pavement-design
 * @description Design of flexible and rigid pavement structures including traffic analysis, material selection, and thickness determination
 * @inputs { projectId: string, pavementType: string, trafficData: object, subgradeProperties: object, designLife: number }
 * @outputs { success: boolean, pavementDesign: object, typicalSections: array, materialSpecs: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    pavementType,
    trafficData,
    subgradeProperties,
    designLife = 20,
    climateData,
    designMethod = 'AASHTO-93',
    outputDir = 'pavement-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Traffic Analysis
  ctx.log('info', 'Starting pavement design: Traffic analysis');
  const trafficAnalysis = await ctx.task(trafficAnalysisTask, {
    projectId,
    trafficData,
    designLife,
    outputDir
  });

  if (!trafficAnalysis.success) {
    return {
      success: false,
      error: 'Traffic analysis failed',
      details: trafficAnalysis,
      metadata: { processId: 'civil-engineering/pavement-design', timestamp: startTime }
    };
  }

  artifacts.push(...trafficAnalysis.artifacts);

  // Task 2: Subgrade Characterization
  ctx.log('info', 'Characterizing subgrade');
  const subgradeCharacterization = await ctx.task(subgradeCharacterizationTask, {
    projectId,
    subgradeProperties,
    designMethod,
    outputDir
  });

  artifacts.push(...subgradeCharacterization.artifacts);

  // Task 3: Material Selection
  ctx.log('info', 'Selecting pavement materials');
  const materialSelection = await ctx.task(materialSelectionTask, {
    projectId,
    pavementType,
    trafficAnalysis,
    climateData,
    outputDir
  });

  artifacts.push(...materialSelection.artifacts);

  // Task 4: Pavement Thickness Design
  ctx.log('info', 'Designing pavement thickness');
  const thicknessDesign = await ctx.task(thicknessDesignTask, {
    projectId,
    pavementType,
    trafficAnalysis,
    subgradeCharacterization,
    materialSelection,
    designLife,
    designMethod,
    outputDir
  });

  artifacts.push(...thicknessDesign.artifacts);

  // Task 5: Drainage Design
  ctx.log('info', 'Designing pavement drainage');
  const drainageDesign = await ctx.task(pavementDrainageTask, {
    projectId,
    thicknessDesign,
    subgradeCharacterization,
    outputDir
  });

  artifacts.push(...drainageDesign.artifacts);

  // Breakpoint: Review pavement design
  await ctx.breakpoint({
    question: `Pavement design complete for ${projectId}. Type: ${pavementType}, Total thickness: ${thicknessDesign.totalThickness}in. Review design?`,
    title: 'Pavement Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        pavementType: pavementType,
        designESALs: trafficAnalysis.designESALs,
        subgradeMr: subgradeCharacterization.resilientModulus,
        totalThickness: thicknessDesign.totalThickness,
        surfaceThickness: thicknessDesign.surfaceThickness,
        baseThickness: thicknessDesign.baseThickness
      }
    }
  });

  // Task 6: Joint Design (for rigid pavement)
  let jointDesign = null;
  if (pavementType === 'rigid') {
    ctx.log('info', 'Designing pavement joints');
    jointDesign = await ctx.task(jointDesignTask, {
      projectId,
      thicknessDesign,
      trafficAnalysis,
      climateData,
      outputDir
    });

    artifacts.push(...jointDesign.artifacts);
  }

  // Task 7: Typical Sections
  ctx.log('info', 'Developing typical sections');
  const typicalSections = await ctx.task(typicalSectionsTask, {
    projectId,
    pavementType,
    thicknessDesign,
    drainageDesign,
    jointDesign,
    outputDir
  });

  artifacts.push(...typicalSections.artifacts);

  // Task 8: Material Specifications
  ctx.log('info', 'Developing material specifications');
  const materialSpecs = await ctx.task(materialSpecsTask, {
    projectId,
    pavementType,
    materialSelection,
    thicknessDesign,
    outputDir
  });

  artifacts.push(...materialSpecs.artifacts);

  // Task 9: Pavement Design Report
  ctx.log('info', 'Generating pavement design report');
  const designReport = await ctx.task(pavementReportTask, {
    projectId,
    trafficAnalysis,
    subgradeCharacterization,
    materialSelection,
    thicknessDesign,
    drainageDesign,
    jointDesign,
    typicalSections,
    outputDir
  });

  artifacts.push(...designReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    pavementDesign: {
      type: pavementType,
      designLife: designLife,
      trafficAnalysis: trafficAnalysis.results,
      subgradeCharacterization: subgradeCharacterization.properties,
      thicknessDesign: thicknessDesign.design,
      drainageDesign: drainageDesign.design,
      jointDesign: jointDesign?.design
    },
    typicalSections: typicalSections.sections,
    materialSpecs: materialSpecs.specifications,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/pavement-design',
      timestamp: startTime,
      projectId,
      designMethod,
      outputDir
    }
  };
}

// Task 1: Traffic Analysis
export const trafficAnalysisTask = defineTask('traffic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform pavement traffic analysis',
  agent: {
    name: 'pavement-engineer',
    prompt: {
      role: 'pavement engineer',
      task: 'Analyze traffic for pavement design',
      context: args,
      instructions: [
        'Obtain current traffic volumes (ADT)',
        'Determine truck percentages by class',
        'Calculate truck factors (LEF)',
        'Project traffic growth over design life',
        'Calculate design ESALs',
        'Determine directional and lane distribution',
        'Calculate design traffic for pavement design',
        'Document traffic analysis assumptions'
      ],
      outputFormat: 'JSON with traffic analysis, ESALs'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'designESALs', 'results', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: { type: 'object' },
        currentADT: { type: 'number' },
        truckPercentage: { type: 'number' },
        truckFactor: { type: 'number' },
        growthRate: { type: 'number' },
        designESALs: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'pavement', 'traffic']
}));

// Task 2: Subgrade Characterization
export const subgradeCharacterizationTask = defineTask('subgrade-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize subgrade',
  agent: {
    name: 'geotechnical-investigation-specialist',
    prompt: {
      role: 'geotechnical/pavement engineer',
      task: 'Characterize subgrade for pavement design',
      context: args,
      instructions: [
        'Review soil boring data',
        'Determine soil classification (AASHTO, USCS)',
        'Establish design CBR values',
        'Calculate resilient modulus (Mr)',
        'Consider seasonal moisture variations',
        'Evaluate subgrade drainage conditions',
        'Determine need for subgrade stabilization',
        'Document subgrade characterization'
      ],
      outputFormat: 'JSON with subgrade properties, Mr value'
    },
    outputSchema: {
      type: 'object',
      required: ['resilientModulus', 'properties', 'artifacts'],
      properties: {
        properties: { type: 'object' },
        soilClassification: { type: 'string' },
        designCBR: { type: 'number' },
        resilientModulus: { type: 'number' },
        seasonalFactor: { type: 'number' },
        stabilizationNeeded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'pavement', 'subgrade']
}));

// Task 3: Material Selection
export const materialSelectionTask = defineTask('material-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select pavement materials',
  agent: {
    name: 'pavement-engineer',
    prompt: {
      role: 'pavement engineer',
      task: 'Select pavement materials',
      context: args,
      instructions: [
        'Select surface course material (HMA mix type or PCC)',
        'Select base course material',
        'Select subbase material if needed',
        'Determine material layer coefficients',
        'Consider climate requirements',
        'Select binder grade for HMA',
        'Specify aggregate requirements',
        'Document material selection rationale'
      ],
      outputFormat: 'JSON with material selections, properties'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'artifacts'],
      properties: {
        materials: {
          type: 'object',
          properties: {
            surface: { type: 'object' },
            base: { type: 'object' },
            subbase: { type: 'object' }
          }
        },
        layerCoefficients: { type: 'object' },
        binderGrade: { type: 'string' },
        aggregateSpecs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'pavement', 'materials']
}));

// Task 4: Thickness Design
export const thicknessDesignTask = defineTask('thickness-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design pavement thickness',
  agent: {
    name: 'pavement-engineer',
    prompt: {
      role: 'pavement engineer',
      task: 'Design pavement layer thicknesses',
      context: args,
      instructions: [
        'Calculate required structural number (SN) for flexible',
        'Calculate required slab thickness for rigid',
        'Determine reliability level',
        'Apply appropriate design equation',
        'Distribute thickness among layers',
        'Check minimum layer thicknesses',
        'Verify structural adequacy',
        'Document design calculations'
      ],
      outputFormat: 'JSON with layer thicknesses, design verification'
    },
    outputSchema: {
      type: 'object',
      required: ['totalThickness', 'surfaceThickness', 'baseThickness', 'design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        structuralNumber: { type: 'number' },
        totalThickness: { type: 'number' },
        surfaceThickness: { type: 'number' },
        baseThickness: { type: 'number' },
        subbaseThickness: { type: 'number' },
        reliability: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'pavement', 'thickness']
}));

// Task 5: Pavement Drainage Design
export const pavementDrainageTask = defineTask('pavement-drainage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design pavement drainage',
  agent: {
    name: 'pavement-engineer',
    prompt: {
      role: 'pavement engineer',
      task: 'Design pavement subsurface drainage',
      context: args,
      instructions: [
        'Evaluate drainage requirements',
        'Design permeable base if needed',
        'Design edge drains',
        'Specify drain pipe and filter',
        'Design drain outlets',
        'Determine drainage coefficients',
        'Apply drainage adjustment to design',
        'Document drainage design'
      ],
      outputFormat: 'JSON with drainage design, details'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        drainageCoefficient: { type: 'number' },
        permeableBase: { type: 'object' },
        edgeDrains: { type: 'object' },
        outletSpacing: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'pavement', 'drainage']
}));

// Task 6: Joint Design (Rigid Pavement)
export const jointDesignTask = defineTask('joint-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design pavement joints',
  agent: {
    name: 'pavement-engineer',
    prompt: {
      role: 'pavement engineer',
      task: 'Design rigid pavement joints',
      context: args,
      instructions: [
        'Determine transverse joint spacing',
        'Determine longitudinal joint spacing',
        'Design contraction joints',
        'Design expansion joints',
        'Design construction joints',
        'Design dowel bars for load transfer',
        'Design tie bars for longitudinal joints',
        'Specify sealant materials'
      ],
      outputFormat: 'JSON with joint design, spacing, details'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        transverseSpacing: { type: 'number' },
        longitudinalSpacing: { type: 'number' },
        dowelDesign: { type: 'object' },
        tieBarDesign: { type: 'object' },
        sealantSpecs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'pavement', 'joints']
}));

// Task 7: Typical Sections
export const typicalSectionsTask = defineTask('typical-sections', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop typical pavement sections',
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'highway CAD technician',
      task: 'Develop typical pavement sections',
      context: args,
      instructions: [
        'Create typical pavement section drawing',
        'Show all layer thicknesses',
        'Detail edge conditions',
        'Show subsurface drainage details',
        'Show joint details for rigid',
        'Include material callouts',
        'Create shoulder sections',
        'Create transition sections'
      ],
      outputFormat: 'JSON with typical section drawings'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'artifacts'],
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              path: { type: 'string' }
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
  labels: ['agent', 'civil-engineering', 'pavement', 'sections']
}));

// Task 8: Material Specifications
export const materialSpecsTask = defineTask('material-specifications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop material specifications',
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'pavement specifications writer',
      task: 'Develop pavement material specifications',
      context: args,
      instructions: [
        'Specify surface course requirements',
        'Specify base course requirements',
        'Specify subbase requirements',
        'Specify aggregate gradations',
        'Specify asphalt binder requirements',
        'Specify concrete requirements for rigid',
        'Define compaction requirements',
        'Reference applicable standards'
      ],
      outputFormat: 'JSON with material specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'artifacts'],
      properties: {
        specifications: { type: 'object' },
        surfaceSpecs: { type: 'object' },
        baseSpecs: { type: 'object' },
        aggregateSpecs: { type: 'object' },
        compactionRequirements: { type: 'object' },
        testingRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'pavement', 'specifications']
}));

// Task 9: Pavement Design Report
export const pavementReportTask = defineTask('pavement-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate pavement design report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'pavement engineer',
      task: 'Generate comprehensive pavement design report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document design methodology',
        'Present traffic analysis',
        'Document subgrade characterization',
        'Present pavement thickness design',
        'Document drainage design',
        'Include typical sections',
        'Provide material specifications',
        'Include design calculations appendix'
      ],
      outputFormat: 'JSON with report path, key findings'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array' },
        designSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'pavement', 'reporting']
}));

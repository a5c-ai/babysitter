/**
 * @process specializations/domains/science/mechanical-engineering/gdt-drawing-creation
 * @description GD&T Specification and Drawing Creation - Developing 2D engineering drawings with geometric
 * dimensioning and tolerancing per ASME Y14.5 or ISO 1101, including datum selection, tolerance allocation,
 * and stack-up analysis for assembly feasibility.
 * @inputs { projectName: string, partDescription: string, functionalRequirements?: object, cadModel?: string, standard?: string }
 * @outputs { success: boolean, drawingSpec: object, gdtScheme: object, toleranceStackUp: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/gdt-drawing-creation', {
 *   projectName: 'Precision Shaft Drawing',
 *   partDescription: 'Ground shaft for bearing interface',
 *   standard: 'ASME Y14.5-2018',
 *   functionalRequirements: { fit: 'H7/g6', concentricity: 0.025 }
 * });
 *
 * @references
 * - ASME Y14.5-2018: https://www.asme.org/codes-standards/find-codes-standards/y14-5-dimensioning-tolerancing
 * - ISO 1101: https://www.iso.org/standard/66777.html
 * - Geometric Dimensioning and Tolerancing Handbook: https://www.asme.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    partDescription,
    functionalRequirements = {},
    cadModel = '',
    standard = 'ASME Y14.5-2018'
  } = inputs;

  // Phase 1: Functional Analysis
  const functionalAnalysis = await ctx.task(functionalAnalysisTask, {
    projectName,
    partDescription,
    functionalRequirements
  });

  // Phase 2: Datum Selection Strategy
  const datumStrategy = await ctx.task(datumStrategyTask, {
    projectName,
    partDescription,
    functionalAnalysis: functionalAnalysis.analysis,
    standard
  });

  // Breakpoint: Review datum selection
  await ctx.breakpoint({
    question: `Review datum selection for ${projectName}. Are datums properly aligned with functional requirements?`,
    title: 'Datum Selection Review',
    context: {
      runId: ctx.runId,
      datums: datumStrategy.datums,
      rationale: datumStrategy.rationale,
      files: [{
        path: `artifacts/datum-strategy.json`,
        format: 'json',
        content: datumStrategy
      }]
    }
  });

  // Phase 3: GD&T Feature Control Frames
  const featureControlFrames = await ctx.task(featureControlFramesTask, {
    projectName,
    functionalAnalysis: functionalAnalysis.analysis,
    datumStrategy: datumStrategy.datums,
    standard
  });

  // Phase 4: Tolerance Allocation
  const toleranceAllocation = await ctx.task(toleranceAllocationTask, {
    projectName,
    functionalRequirements,
    featureControlFrames: featureControlFrames.frames,
    standard
  });

  // Phase 5: Stack-Up Analysis
  const stackUpAnalysis = await ctx.task(stackUpAnalysisTask, {
    projectName,
    toleranceAllocation: toleranceAllocation.tolerances,
    functionalRequirements,
    datumStrategy: datumStrategy.datums
  });

  // Quality Gate: Stack-up must be within limits
  if (stackUpAnalysis.worstCaseResult > stackUpAnalysis.allowableGap) {
    await ctx.breakpoint({
      question: `Stack-up analysis shows worst case ${stackUpAnalysis.worstCaseResult} exceeds allowable ${stackUpAnalysis.allowableGap}. Review tolerance allocation?`,
      title: 'Stack-Up Warning',
      context: {
        runId: ctx.runId,
        stackUpAnalysis,
        recommendation: 'Consider tightening critical tolerances or revising design'
      }
    });
  }

  // Phase 6: Drawing View Selection
  const viewSelection = await ctx.task(viewSelectionTask, {
    projectName,
    partDescription,
    featureControlFrames: featureControlFrames.frames,
    cadModel
  });

  // Phase 7: Dimension Layout Planning
  const dimensionLayout = await ctx.task(dimensionLayoutTask, {
    projectName,
    viewSelection: viewSelection.views,
    featureControlFrames: featureControlFrames.frames,
    toleranceAllocation: toleranceAllocation.tolerances
  });

  // Phase 8: Notes and Specifications
  const notesSpec = await ctx.task(notesSpecTask, {
    projectName,
    standard,
    functionalRequirements,
    datumStrategy: datumStrategy.datums
  });

  // Phase 9: Drawing Validation Checklist
  const validationChecklist = await ctx.task(validationChecklistTask, {
    projectName,
    standard,
    featureControlFrames: featureControlFrames.frames,
    dimensionLayout: dimensionLayout.dimensions
  });

  // Phase 10: Drawing Specification Document
  const drawingSpec = await ctx.task(drawingSpecTask, {
    projectName,
    partDescription,
    standard,
    functionalAnalysis,
    datumStrategy,
    featureControlFrames,
    toleranceAllocation,
    stackUpAnalysis,
    viewSelection,
    dimensionLayout,
    notesSpec,
    validationChecklist
  });

  // Final Breakpoint: Drawing Specification Approval
  await ctx.breakpoint({
    question: `Drawing Specification Complete for ${projectName}. Approve to proceed with drawing creation?`,
    title: 'Drawing Specification Approval',
    context: {
      runId: ctx.runId,
      gdtScheme: featureControlFrames.frames,
      files: [
        { path: `artifacts/drawing-spec.json`, format: 'json', content: drawingSpec },
        { path: `artifacts/drawing-spec.md`, format: 'markdown', content: drawingSpec.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    drawingSpec: drawingSpec.specification,
    gdtScheme: {
      datums: datumStrategy.datums,
      featureControlFrames: featureControlFrames.frames,
      tolerances: toleranceAllocation.tolerances
    },
    toleranceStackUp: stackUpAnalysis,
    validationChecklist: validationChecklist.checklist,
    nextSteps: drawingSpec.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/gdt-drawing-creation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const functionalAnalysisTask = defineTask('functional-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Functional Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior GD&T Engineer with expertise in functional dimensioning',
      task: 'Analyze functional requirements for dimensioning strategy',
      context: {
        projectName: args.projectName,
        partDescription: args.partDescription,
        functionalRequirements: args.functionalRequirements
      },
      instructions: [
        '1. Identify all functional features on the part',
        '2. Determine feature functions (location, orientation, form, size)',
        '3. Identify mating part interfaces and assembly relationships',
        '4. Determine critical-to-function dimensions',
        '5. Identify fit requirements (clearance, interference, transition)',
        '6. Determine inspection requirements and methods',
        '7. Identify manufacturing process capabilities',
        '8. Document functional chains and relationships',
        '9. Identify features requiring GD&T vs. +/- tolerances',
        '10. Document assumptions about assembly and usage'
      ],
      outputFormat: 'JSON object with functional analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            functionalFeatures: { type: 'array', items: { type: 'object' } },
            matingInterfaces: { type: 'array', items: { type: 'object' } },
            criticalDimensions: { type: 'array', items: { type: 'object' } },
            fitRequirements: { type: 'array', items: { type: 'object' } },
            functionalChains: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'gdt', 'functional-analysis']
}));

export const datumStrategyTask = defineTask('datum-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Datum Selection Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GD&T Specialist with expertise in datum reference frames',
      task: 'Define datum reference frame and datum selection',
      context: {
        projectName: args.projectName,
        partDescription: args.partDescription,
        functionalAnalysis: args.functionalAnalysis,
        standard: args.standard
      },
      instructions: [
        '1. Identify candidate datum features based on function',
        '2. Select primary datum (most constrained plane/surface)',
        '3. Select secondary datum (orientation reference)',
        '4. Select tertiary datum (complete constraint)',
        '5. Verify datum features are accessible for inspection',
        '6. Define datum feature symbols and notation',
        '7. Consider datum targets for irregular surfaces',
        '8. Define datum precedence for each tolerance',
        '9. Document datum selection rationale',
        '10. Verify alignment with mating part datums'
      ],
      outputFormat: 'JSON object with datum strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['datums', 'rationale'],
      properties: {
        datums: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              feature: { type: 'string' },
              type: { type: 'string' },
              precedence: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] },
              degreesOfFreedom: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rationale: { type: 'string' },
        datumTargets: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'gdt', 'datum-selection']
}));

export const featureControlFramesTask = defineTask('feature-control-frames', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: GD&T Feature Control Frames - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GD&T Expert with ASME/ISO certification',
      task: 'Define feature control frames for all toleranced features',
      context: {
        projectName: args.projectName,
        functionalAnalysis: args.functionalAnalysis,
        datumStrategy: args.datumStrategy,
        standard: args.standard
      },
      instructions: [
        '1. Determine appropriate geometric characteristic for each feature',
        '2. Apply form tolerances (flatness, straightness, circularity, cylindricity)',
        '3. Apply orientation tolerances (perpendicularity, angularity, parallelism)',
        '4. Apply location tolerances (position, concentricity, symmetry)',
        '5. Apply runout tolerances (circular, total)',
        '6. Apply profile tolerances (line, surface)',
        '7. Determine material condition modifiers (MMC, LMC, RFS)',
        '8. Define composite tolerances where needed',
        '9. Apply simultaneous requirements where applicable',
        '10. Document feature control frame notation per standard'
      ],
      outputFormat: 'JSON object with feature control frames'
    },
    outputSchema: {
      type: 'object',
      required: ['frames'],
      properties: {
        frames: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              characteristic: { type: 'string' },
              tolerance: { type: 'number' },
              materialCondition: { type: 'string' },
              datumReference: { type: 'string' },
              notation: { type: 'string' }
            }
          }
        },
        compositeTolerances: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'gdt', 'feature-control-frames']
}));

export const toleranceAllocationTask = defineTask('tolerance-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Tolerance Allocation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Tolerance Engineer with expertise in tolerance allocation',
      task: 'Allocate tolerances to meet functional requirements',
      context: {
        projectName: args.projectName,
        functionalRequirements: args.functionalRequirements,
        featureControlFrames: args.featureControlFrames,
        standard: args.standard
      },
      instructions: [
        '1. Determine assembly tolerance budget from functional requirements',
        '2. Allocate tolerances using equal, proportional, or optimization methods',
        '3. Apply standard tolerance grades (IT grades) where applicable',
        '4. Consider manufacturing process capabilities',
        '5. Apply standard fits (ISO or ANSI) for mating features',
        '6. Balance tolerance tightness with manufacturing cost',
        '7. Document tolerance allocation rationale',
        '8. Verify tolerance values are achievable',
        '9. Apply statistical tolerancing where beneficial',
        '10. Document inspection equipment requirements'
      ],
      outputFormat: 'JSON object with tolerance allocation'
    },
    outputSchema: {
      type: 'object',
      required: ['tolerances'],
      properties: {
        tolerances: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              dimension: { type: 'number' },
              upperTolerance: { type: 'number' },
              lowerTolerance: { type: 'number' },
              itGrade: { type: 'string' },
              fit: { type: 'string' }
            }
          }
        },
        allocationMethod: { type: 'string' },
        processCapabilities: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'gdt', 'tolerance-allocation']
}));

export const stackUpAnalysisTask = defineTask('stack-up-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Stack-Up Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Tolerance Analyst with expertise in stack-up analysis',
      task: 'Perform tolerance stack-up analysis for assembly',
      context: {
        projectName: args.projectName,
        toleranceAllocation: args.toleranceAllocation,
        functionalRequirements: args.functionalRequirements,
        datumStrategy: args.datumStrategy
      },
      instructions: [
        '1. Identify critical assembly gaps and fits',
        '2. Create tolerance chain for each critical measurement',
        '3. Perform worst-case (arithmetic) stack-up analysis',
        '4. Perform RSS (statistical) stack-up analysis',
        '5. Compare results against functional requirements',
        '6. Identify largest contributors to stack-up',
        '7. Calculate Cpk for assembly variation',
        '8. Recommend tolerance adjustments if needed',
        '9. Document stack-up assumptions and methods',
        '10. Create stack-up analysis report'
      ],
      outputFormat: 'JSON object with stack-up analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['worstCaseResult', 'rssResult', 'allowableGap'],
      properties: {
        toleranceChain: { type: 'array', items: { type: 'object' } },
        worstCaseResult: { type: 'number' },
        rssResult: { type: 'number' },
        allowableGap: { type: 'number' },
        contributors: { type: 'array', items: { type: 'object' } },
        cpk: { type: 'number' },
        pass: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'gdt', 'stack-up-analysis']
}));

export const viewSelectionTask = defineTask('view-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Drawing View Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Detailing Engineer with expertise in engineering drawings',
      task: 'Select appropriate drawing views for the part',
      context: {
        projectName: args.projectName,
        partDescription: args.partDescription,
        featureControlFrames: args.featureControlFrames,
        cadModel: args.cadModel
      },
      instructions: [
        '1. Select principal view orientation',
        '2. Determine required orthographic views',
        '3. Identify need for section views',
        '4. Identify need for detail views',
        '5. Determine auxiliary views for angled features',
        '6. Plan removed section views',
        '7. Determine isometric/pictorial views if needed',
        '8. Plan view scale and sheet layout',
        '9. Identify break views for long parts',
        '10. Document view projection method (first/third angle)'
      ],
      outputFormat: 'JSON object with view selection'
    },
    outputSchema: {
      type: 'object',
      required: ['views'],
      properties: {
        views: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewType: { type: 'string' },
              scale: { type: 'string' },
              purpose: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        sheetLayout: { type: 'object' },
        projectionMethod: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'gdt', 'drawing-views']
}));

export const dimensionLayoutTask = defineTask('dimension-layout', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Dimension Layout Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Drafter with expertise in dimension layout',
      task: 'Plan dimension and annotation layout on drawing views',
      context: {
        projectName: args.projectName,
        viewSelection: args.viewSelection,
        featureControlFrames: args.featureControlFrames,
        toleranceAllocation: args.toleranceAllocation
      },
      instructions: [
        '1. Assign dimensions to appropriate views',
        '2. Group related dimensions logically',
        '3. Plan baseline dimensioning scheme',
        '4. Avoid dimension crowding and crossing',
        '5. Place feature control frames near features',
        '6. Position datum symbols clearly',
        '7. Plan leader and extension line routing',
        '8. Ensure consistent dimension spacing',
        '9. Plan ordinate dimensions where appropriate',
        '10. Follow standard dimension placement rules'
      ],
      outputFormat: 'JSON object with dimension layout'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions'],
      properties: {
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              view: { type: 'string' },
              position: { type: 'object' },
              style: { type: 'string' }
            }
          }
        },
        layoutGuidelines: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'gdt', 'dimension-layout']
}));

export const notesSpecTask = defineTask('notes-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Notes and Specifications - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Engineering Documentation Specialist',
      task: 'Define drawing notes and specifications',
      context: {
        projectName: args.projectName,
        standard: args.standard,
        functionalRequirements: args.functionalRequirements,
        datumStrategy: args.datumStrategy
      },
      instructions: [
        '1. Define general notes (material, finish, standards)',
        '2. Specify material and heat treatment requirements',
        '3. Define surface finish requirements',
        '4. Specify coating or plating requirements',
        '5. Define edge break and deburr requirements',
        '6. Specify marking requirements',
        '7. Define inspection and test requirements',
        '8. Document interpretation standard reference',
        '9. Specify unless otherwise specified (UOS) tolerances',
        '10. Define revision history block'
      ],
      outputFormat: 'JSON object with notes specification'
    },
    outputSchema: {
      type: 'object',
      required: ['notes'],
      properties: {
        notes: {
          type: 'object',
          properties: {
            general: { type: 'array', items: { type: 'string' } },
            material: { type: 'object' },
            finish: { type: 'object' },
            inspection: { type: 'array', items: { type: 'string' } },
            uos: { type: 'object' }
          }
        },
        titleBlock: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'gdt', 'drawing-notes']
}));

export const validationChecklistTask = defineTask('validation-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Drawing Validation Checklist - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Engineer with expertise in drawing validation',
      task: 'Create validation checklist for drawing review',
      context: {
        projectName: args.projectName,
        standard: args.standard,
        featureControlFrames: args.featureControlFrames,
        dimensionLayout: args.dimensionLayout
      },
      instructions: [
        '1. Verify all features are dimensioned',
        '2. Check GD&T syntax per standard',
        '3. Verify datum references are correct',
        '4. Check material condition modifiers',
        '5. Verify dimension completeness (no duplicate or missing)',
        '6. Check scale accuracy',
        '7. Verify title block completeness',
        '8. Check note accuracy and completeness',
        '9. Verify tolerance consistency',
        '10. Create comprehensive review checklist'
      ],
      outputFormat: 'JSON object with validation checklist'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist'],
      properties: {
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              category: { type: 'string' },
              status: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        commonErrors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'gdt', 'validation']
}));

export const drawingSpecTask = defineTask('drawing-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Drawing Specification Document - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer with expertise in engineering documentation',
      task: 'Generate comprehensive drawing specification document',
      context: {
        projectName: args.projectName,
        partDescription: args.partDescription,
        standard: args.standard,
        functionalAnalysis: args.functionalAnalysis,
        datumStrategy: args.datumStrategy,
        featureControlFrames: args.featureControlFrames,
        toleranceAllocation: args.toleranceAllocation,
        stackUpAnalysis: args.stackUpAnalysis,
        viewSelection: args.viewSelection,
        dimensionLayout: args.dimensionLayout,
        notesSpec: args.notesSpec,
        validationChecklist: args.validationChecklist
      },
      instructions: [
        '1. Write specification summary',
        '2. Document GD&T scheme rationale',
        '3. Include datum strategy documentation',
        '4. Include tolerance stack-up results',
        '5. Document view and layout plan',
        '6. Include notes specification',
        '7. Include validation checklist',
        '8. Define drawing creation instructions',
        '9. Document review and approval process',
        '10. Generate JSON and markdown formats'
      ],
      outputFormat: 'JSON object with drawing specification'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'markdown'],
      properties: {
        specification: { type: 'object' },
        markdown: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'gdt', 'documentation']
}));

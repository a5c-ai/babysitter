/**
 * @process specializations/domains/science/mechanical-engineering/cad-model-development
 * @description 3D CAD Model Development - Creating parametric solid models and assemblies in CAD software
 * (SolidWorks, CATIA, NX, Creo) with proper design intent, feature organization, and configuration
 * management for design variations and revisions.
 * @inputs { projectName: string, componentDescription: string, designRequirements?: object, cadPlatform?: string, existingModels?: string[] }
 * @outputs { success: boolean, cadModelSpec: object, featureTree: object, configurationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/cad-model-development', {
 *   projectName: 'Hydraulic Cylinder Assembly',
 *   componentDescription: 'Double-acting hydraulic cylinder for industrial press',
 *   cadPlatform: 'SolidWorks',
 *   designRequirements: { bore: '100mm', stroke: '500mm', pressure: '350bar' }
 * });
 *
 * @references
 * - SolidWorks Help: https://help.solidworks.com/
 * - CATIA Documentation: https://www.3ds.com/support/documentation/
 * - Siemens NX Documentation: https://docs.plm.automation.siemens.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    componentDescription,
    designRequirements = {},
    cadPlatform = 'SolidWorks',
    existingModels = []
  } = inputs;

  // Phase 1: Design Intent Analysis
  const designIntentAnalysis = await ctx.task(designIntentAnalysisTask, {
    projectName,
    componentDescription,
    designRequirements
  });

  // Phase 2: Part Decomposition and Planning
  const partDecomposition = await ctx.task(partDecompositionTask, {
    projectName,
    componentDescription,
    designIntentAnalysis: designIntentAnalysis.analysis,
    existingModels
  });

  // Breakpoint: Review part decomposition
  await ctx.breakpoint({
    question: `Review part decomposition for ${projectName}. Are all components identified and properly structured?`,
    title: 'Part Decomposition Review',
    context: {
      runId: ctx.runId,
      partList: partDecomposition.parts,
      assemblyStructure: partDecomposition.assemblyStructure,
      files: [{
        path: `artifacts/part-decomposition.json`,
        format: 'json',
        content: partDecomposition
      }]
    }
  });

  // Phase 3: Parametric Strategy Definition
  const parametricStrategy = await ctx.task(parametricStrategyTask, {
    projectName,
    designRequirements,
    partDecomposition: partDecomposition.parts,
    designIntent: designIntentAnalysis.analysis
  });

  // Phase 4: Sketch and Reference Geometry Planning
  const sketchPlanning = await ctx.task(sketchPlanningTask, {
    projectName,
    parts: partDecomposition.parts,
    parametricStrategy: parametricStrategy.strategy,
    cadPlatform
  });

  // Phase 5: Feature Tree Development
  const featureTree = await ctx.task(featureTreeTask, {
    projectName,
    parts: partDecomposition.parts,
    sketchPlanning: sketchPlanning.sketches,
    cadPlatform
  });

  // Phase 6: Assembly Modeling Strategy
  const assemblyStrategy = await ctx.task(assemblyStrategyTask, {
    projectName,
    assemblyStructure: partDecomposition.assemblyStructure,
    parts: partDecomposition.parts,
    cadPlatform
  });

  // Phase 7: Configuration and Variant Planning
  const configurationPlan = await ctx.task(configurationPlanTask, {
    projectName,
    designRequirements,
    parametricStrategy: parametricStrategy.strategy,
    parts: partDecomposition.parts
  });

  // Phase 8: Standards and Templates Setup
  const standardsSetup = await ctx.task(standardsSetupTask, {
    projectName,
    cadPlatform,
    parts: partDecomposition.parts,
    companyStandards: designRequirements.companyStandards
  });

  // Phase 9: Bill of Materials Structure
  const bomStructure = await ctx.task(bomStructureTask, {
    projectName,
    parts: partDecomposition.parts,
    assemblyStructure: partDecomposition.assemblyStructure,
    configurationPlan: configurationPlan.configurations
  });

  // Phase 10: CAD Model Specification Document
  const cadModelSpec = await ctx.task(cadModelSpecTask, {
    projectName,
    componentDescription,
    cadPlatform,
    designIntentAnalysis,
    partDecomposition,
    parametricStrategy,
    sketchPlanning,
    featureTree,
    assemblyStrategy,
    configurationPlan,
    standardsSetup,
    bomStructure
  });

  // Final Breakpoint: CAD Specification Approval
  await ctx.breakpoint({
    question: `CAD Model Specification Complete for ${projectName}. Approve specification to proceed with modeling?`,
    title: 'CAD Specification Approval',
    context: {
      runId: ctx.runId,
      summary: cadModelSpec.summary,
      files: [
        { path: `artifacts/cad-model-spec.json`, format: 'json', content: cadModelSpec },
        { path: `artifacts/cad-model-spec.md`, format: 'markdown', content: cadModelSpec.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    cadModelSpec: cadModelSpec.specification,
    featureTree: featureTree.tree,
    configurationPlan: configurationPlan.configurations,
    assemblyStructure: partDecomposition.assemblyStructure,
    parametricStrategy: parametricStrategy.strategy,
    bomStructure: bomStructure.bom,
    nextSteps: cadModelSpec.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/cad-model-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const designIntentAnalysisTask = defineTask('design-intent-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design Intent Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior CAD Engineer with expertise in design intent and parametric modeling',
      task: 'Analyze design intent and establish modeling strategy',
      context: {
        projectName: args.projectName,
        componentDescription: args.componentDescription,
        designRequirements: args.designRequirements
      },
      instructions: [
        '1. Identify primary design intent (what should the model capture)',
        '2. Determine key driving dimensions and parameters',
        '3. Identify relationships between features that must be maintained',
        '4. Determine likely design changes and how model should respond',
        '5. Identify symmetry, patterns, and reusable features',
        '6. Define parent-child relationships between features',
        '7. Identify critical surfaces and references',
        '8. Determine manufacturing considerations affecting design intent',
        '9. Identify assembly interfaces and constraints',
        '10. Document design intent decisions and rationale'
      ],
      outputFormat: 'JSON object with design intent analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            primaryIntent: { type: 'string' },
            drivingDimensions: { type: 'array', items: { type: 'object' } },
            featureRelationships: { type: 'array', items: { type: 'object' } },
            changeScenarios: { type: 'array', items: { type: 'object' } },
            symmetryPatterns: { type: 'array', items: { type: 'object' } },
            criticalSurfaces: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cad', 'design-intent']
}));

export const partDecompositionTask = defineTask('part-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Part Decomposition and Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mechanical Design Engineer with expertise in product structure',
      task: 'Decompose the design into parts and assemblies',
      context: {
        projectName: args.projectName,
        componentDescription: args.componentDescription,
        designIntentAnalysis: args.designIntentAnalysis,
        existingModels: args.existingModels
      },
      instructions: [
        '1. Identify all unique parts required for the design',
        '2. Classify parts (custom designed, purchased, standard)',
        '3. Define part naming convention and numbering scheme',
        '4. Create assembly hierarchy (top-level, sub-assemblies)',
        '5. Identify standard components (fasteners, bearings, seals)',
        '6. Determine reusable and mirrored parts',
        '7. Identify weldments and multi-body parts',
        '8. Define part-to-part interfaces',
        '9. Document material assignments',
        '10. Identify parts requiring multiple configurations'
      ],
      outputFormat: 'JSON object with part decomposition'
    },
    outputSchema: {
      type: 'object',
      required: ['parts', 'assemblyStructure'],
      properties: {
        parts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partNumber: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['custom', 'purchased', 'standard'] },
              material: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        assemblyStructure: {
          type: 'object',
          properties: {
            topLevel: { type: 'string' },
            subAssemblies: { type: 'array', items: { type: 'object' } },
            hierarchy: { type: 'object' }
          }
        },
        standardComponents: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cad', 'part-decomposition']
}));

export const parametricStrategyTask = defineTask('parametric-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Parametric Strategy Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CAD Specialist with expertise in parametric modeling',
      task: 'Define parametric modeling strategy and global variables',
      context: {
        projectName: args.projectName,
        designRequirements: args.designRequirements,
        partDecomposition: args.partDecomposition,
        designIntent: args.designIntent
      },
      instructions: [
        '1. Define global variables and equations',
        '2. Create parameter naming convention',
        '3. Identify driving vs driven dimensions',
        '4. Define cross-part parameter links',
        '5. Create design tables for configurations',
        '6. Define parameter ranges and constraints',
        '7. Identify calculated parameters and formulas',
        '8. Plan parameter inheritance hierarchy',
        '9. Define units and precision standards',
        '10. Document parameter dependencies'
      ],
      outputFormat: 'JSON object with parametric strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            globalVariables: { type: 'array', items: { type: 'object' } },
            equations: { type: 'array', items: { type: 'object' } },
            parameterLinks: { type: 'array', items: { type: 'object' } },
            designTables: { type: 'array', items: { type: 'object' } },
            namingConvention: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cad', 'parametric-modeling']
}));

export const sketchPlanningTask = defineTask('sketch-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Sketch and Reference Geometry Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CAD Designer with expertise in sketch-based modeling',
      task: 'Plan sketches and reference geometry for each part',
      context: {
        projectName: args.projectName,
        parts: args.parts,
        parametricStrategy: args.parametricStrategy,
        cadPlatform: args.cadPlatform
      },
      instructions: [
        '1. Define origin and coordinate system for each part',
        '2. Plan reference planes and axes',
        '3. Define master sketch with key dimensions',
        '4. Plan sketch profiles for each feature',
        '5. Identify fully constrained sketch requirements',
        '6. Plan construction geometry and references',
        '7. Define sketch relations and constraints',
        '8. Identify shared sketches between features',
        '9. Plan 3D sketches for sweep paths',
        '10. Document sketch best practices for platform'
      ],
      outputFormat: 'JSON object with sketch planning'
    },
    outputSchema: {
      type: 'object',
      required: ['sketches'],
      properties: {
        sketches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partNumber: { type: 'string' },
              sketchName: { type: 'string' },
              plane: { type: 'string' },
              profile: { type: 'string' },
              constraints: { type: 'array', items: { type: 'string' } },
              keyDimensions: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        referencePlanes: { type: 'array', items: { type: 'object' } },
        coordinateSystems: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cad', 'sketch-planning']
}));

export const featureTreeTask = defineTask('feature-tree', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Feature Tree Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior CAD Engineer with expertise in feature-based modeling',
      task: 'Define feature tree structure for each part',
      context: {
        projectName: args.projectName,
        parts: args.parts,
        sketchPlanning: args.sketchPlanning,
        cadPlatform: args.cadPlatform
      },
      instructions: [
        '1. Define feature sequence for each part',
        '2. Identify base feature (first feature) for each part',
        '3. Plan boss/extrude features',
        '4. Plan cut/pocket features',
        '5. Plan revolve features',
        '6. Plan sweep and loft features',
        '7. Plan fillet and chamfer features',
        '8. Plan pattern features (linear, circular)',
        '9. Plan shell and rib features',
        '10. Document feature dependencies and parent-child relationships'
      ],
      outputFormat: 'JSON object with feature tree'
    },
    outputSchema: {
      type: 'object',
      required: ['tree'],
      properties: {
        tree: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partNumber: { type: 'string' },
              features: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    order: { type: 'number' },
                    featureName: { type: 'string' },
                    featureType: { type: 'string' },
                    sketch: { type: 'string' },
                    parameters: { type: 'object' },
                    parent: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cad', 'feature-tree']
}));

export const assemblyStrategyTask = defineTask('assembly-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Assembly Modeling Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Assembly Design Engineer with expertise in assembly modeling',
      task: 'Define assembly modeling strategy and mates',
      context: {
        projectName: args.projectName,
        assemblyStructure: args.assemblyStructure,
        parts: args.parts,
        cadPlatform: args.cadPlatform
      },
      instructions: [
        '1. Define assembly origin and coordinate system',
        '2. Identify fixed (grounded) component',
        '3. Plan mate strategy (coincident, concentric, distance, angle)',
        '4. Define mate references for standard connections',
        '5. Plan smart mates and magnetic mates',
        '6. Define degrees of freedom for movable components',
        '7. Plan sub-assembly structure for performance',
        '8. Define flexible vs rigid sub-assemblies',
        '9. Plan in-context design references',
        '10. Document assembly best practices and standards'
      ],
      outputFormat: 'JSON object with assembly strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            origin: { type: 'object' },
            groundedComponent: { type: 'string' },
            mates: { type: 'array', items: { type: 'object' } },
            mateReferences: { type: 'array', items: { type: 'object' } },
            subAssemblyRules: { type: 'object' },
            inContextReferences: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cad', 'assembly-modeling']
}));

export const configurationPlanTask = defineTask('configuration-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Configuration and Variant Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CAD Administrator with expertise in configuration management',
      task: 'Plan configurations and design variants',
      context: {
        projectName: args.projectName,
        designRequirements: args.designRequirements,
        parametricStrategy: args.parametricStrategy,
        parts: args.parts
      },
      instructions: [
        '1. Identify parts requiring multiple configurations',
        '2. Define configuration naming convention',
        '3. Plan design tables for parametric variants',
        '4. Define suppressed/unsuppressed features per configuration',
        '5. Plan display states for each configuration',
        '6. Define configuration-specific custom properties',
        '7. Plan derived configurations',
        '8. Define configuration publisher settings',
        '9. Plan SpeedPak configurations for performance',
        '10. Document configuration management procedures'
      ],
      outputFormat: 'JSON object with configuration plan'
    },
    outputSchema: {
      type: 'object',
      required: ['configurations'],
      properties: {
        configurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partNumber: { type: 'string' },
              configName: { type: 'string' },
              description: { type: 'string' },
              parameters: { type: 'object' },
              suppressedFeatures: { type: 'array', items: { type: 'string' } },
              displayState: { type: 'string' }
            }
          }
        },
        designTables: { type: 'array', items: { type: 'object' } },
        namingConvention: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cad', 'configuration-management']
}));

export const standardsSetupTask = defineTask('standards-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Standards and Templates Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CAD Standards Administrator',
      task: 'Define CAD standards and templates for the project',
      context: {
        projectName: args.projectName,
        cadPlatform: args.cadPlatform,
        parts: args.parts,
        companyStandards: args.companyStandards
      },
      instructions: [
        '1. Define part and assembly templates',
        '2. Define drawing templates and sheet formats',
        '3. Establish custom property schema',
        '4. Define material library and appearances',
        '5. Establish tolerance and precision settings',
        '6. Define layer/color standards',
        '7. Establish file naming conventions',
        '8. Define revision and version control',
        '9. Establish model checking rules',
        '10. Document PDM/PLM integration requirements'
      ],
      outputFormat: 'JSON object with standards setup'
    },
    outputSchema: {
      type: 'object',
      required: ['standards'],
      properties: {
        standards: {
          type: 'object',
          properties: {
            templates: { type: 'array', items: { type: 'object' } },
            customProperties: { type: 'array', items: { type: 'object' } },
            materialLibrary: { type: 'array', items: { type: 'string' } },
            namingConvention: { type: 'object' },
            revisionControl: { type: 'object' },
            checkingRules: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cad', 'standards']
}));

export const bomStructureTask = defineTask('bom-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Bill of Materials Structure - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Data Engineer with expertise in BOM management',
      task: 'Define bill of materials structure and properties',
      context: {
        projectName: args.projectName,
        parts: args.parts,
        assemblyStructure: args.assemblyStructure,
        configurationPlan: args.configurationPlan
      },
      instructions: [
        '1. Define BOM type (indented, flattened, top-level only)',
        '2. Establish part numbering scheme',
        '3. Define required BOM columns/properties',
        '4. Plan purchased part documentation',
        '5. Define quantity calculations',
        '6. Establish BOM for each configuration',
        '7. Define BOM export formats',
        '8. Plan ERP/MRP integration',
        '9. Define phantom assemblies',
        '10. Document BOM maintenance procedures'
      ],
      outputFormat: 'JSON object with BOM structure'
    },
    outputSchema: {
      type: 'object',
      required: ['bom'],
      properties: {
        bom: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            columns: { type: 'array', items: { type: 'object' } },
            items: { type: 'array', items: { type: 'object' } },
            numberingScheme: { type: 'object' },
            exportFormats: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cad', 'bom']
}));

export const cadModelSpecTask = defineTask('cad-model-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: CAD Model Specification Document - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer with expertise in CAD documentation',
      task: 'Generate comprehensive CAD model specification document',
      context: {
        projectName: args.projectName,
        componentDescription: args.componentDescription,
        cadPlatform: args.cadPlatform,
        designIntentAnalysis: args.designIntentAnalysis,
        partDecomposition: args.partDecomposition,
        parametricStrategy: args.parametricStrategy,
        sketchPlanning: args.sketchPlanning,
        featureTree: args.featureTree,
        assemblyStrategy: args.assemblyStrategy,
        configurationPlan: args.configurationPlan,
        standardsSetup: args.standardsSetup,
        bomStructure: args.bomStructure
      },
      instructions: [
        '1. Write executive summary of CAD model requirements',
        '2. Document design intent and parametric strategy',
        '3. List all parts with modeling instructions',
        '4. Document feature trees for each part',
        '5. Document assembly structure and mates',
        '6. Document configuration plan',
        '7. Document standards and templates',
        '8. Include BOM structure specification',
        '9. Define modeling milestones and deliverables',
        '10. Generate both JSON and markdown formats'
      ],
      outputFormat: 'JSON object with CAD model specification'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'markdown', 'summary'],
      properties: {
        specification: { type: 'object' },
        markdown: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            partCount: { type: 'number' },
            assemblyCount: { type: 'number' },
            configurationCount: { type: 'number' }
          }
        },
        nextSteps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cad', 'documentation']
}));

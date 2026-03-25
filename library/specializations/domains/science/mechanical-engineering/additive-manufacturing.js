/**
 * @process additive-manufacturing
 * @description Additive manufacturing process development - DfAM, build preparation, parameter optimization, and post-processing
 * @inputs {object} inputs
 * @inputs {string} inputs.partNumber - Part identification number
 * @inputs {string} inputs.cadModel - 3D CAD model for printing
 * @inputs {object} inputs.requirements - Mechanical and dimensional requirements
 * @inputs {object} inputs.printerSpec - Target AM system specifications
 * @inputs {string} inputs.material - Print material specification
 * @outputs {object} amProcess - Complete AM process package with build file and post-processing
 * @example
 * const result = await process({
 *   partNumber: 'AM-2024-001',
 *   cadModel: 'models/bracket.step',
 *   requirements: { tensile: 800, density: 99.5, tolerance: 0.1 },
 *   printerSpec: { type: 'LPBF', brand: 'EOS M290', material: 'Ti64' },
 *   material: 'Ti-6Al-4V Grade 23'
 * });
 * @references ASTM F3301, ISO/ASTM 52900, NASA-STD-6030, AM Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const artifacts = [];

  // Phase 1: DfAM Analysis
  const dfamAnalysis = await ctx.task(dfamAnalysisTask, {
    cadModel: inputs.cadModel,
    requirements: inputs.requirements,
    printerSpec: inputs.printerSpec,
    material: inputs.material
  });
  artifacts.push({ phase: 'dfam-analysis', data: dfamAnalysis });

  // Breakpoint: DfAM Review
  await ctx.breakpoint('dfam-review', {
    question: 'Review DfAM recommendations. Proceed with design modifications?',
    context: {
      printabilityScore: dfamAnalysis.printabilityScore,
      recommendations: dfamAnalysis.recommendations,
      supportVolume: dfamAnalysis.supportAnalysis.volume
    }
  });

  // Phase 2: Part Orientation Optimization
  const orientationOptimization = await ctx.task(orientationTask, {
    cadModel: inputs.cadModel,
    printerSpec: inputs.printerSpec,
    requirements: inputs.requirements,
    dfamAnalysis: dfamAnalysis
  });
  artifacts.push({ phase: 'orientation', data: orientationOptimization });

  // Phase 3: Support Structure Design
  const supportDesign = await ctx.task(supportDesignTask, {
    cadModel: inputs.cadModel,
    orientation: orientationOptimization.optimalOrientation,
    printerSpec: inputs.printerSpec,
    material: inputs.material
  });
  artifacts.push({ phase: 'support-design', data: supportDesign });

  // Phase 4: Build Parameter Development
  const parameterDevelopment = await ctx.task(parameterDevelopmentTask, {
    printerSpec: inputs.printerSpec,
    material: inputs.material,
    requirements: inputs.requirements,
    geometry: dfamAnalysis.geometryAnalysis
  });
  artifacts.push({ phase: 'parameters', data: parameterDevelopment });

  // Phase 5: Build Layout and Nesting
  const buildLayout = await ctx.task(buildLayoutTask, {
    cadModel: inputs.cadModel,
    orientation: orientationOptimization.optimalOrientation,
    supports: supportDesign,
    printerSpec: inputs.printerSpec
  });
  artifacts.push({ phase: 'build-layout', data: buildLayout });

  // Phase 6: Thermal Simulation
  const thermalSimulation = await ctx.task(thermalSimulationTask, {
    buildLayout: buildLayout,
    parameters: parameterDevelopment,
    material: inputs.material
  });
  artifacts.push({ phase: 'thermal-simulation', data: thermalSimulation });

  // Phase 7: Build File Generation
  const buildFile = await ctx.task(buildFileTask, {
    buildLayout: buildLayout,
    parameters: parameterDevelopment,
    printerSpec: inputs.printerSpec
  });
  artifacts.push({ phase: 'build-file', data: buildFile });

  // Phase 8: Post-Processing Plan
  const postProcessingPlan = await ctx.task(postProcessingTask, {
    partNumber: inputs.partNumber,
    material: inputs.material,
    requirements: inputs.requirements,
    supportDesign: supportDesign
  });
  artifacts.push({ phase: 'post-processing', data: postProcessingPlan });

  // Phase 9: Quality Plan Development
  const qualityPlan = await ctx.task(qualityPlanTask, {
    requirements: inputs.requirements,
    material: inputs.material,
    printerSpec: inputs.printerSpec
  });
  artifacts.push({ phase: 'quality-plan', data: qualityPlan });

  // Final Breakpoint: Build Approval
  await ctx.breakpoint('build-approval', {
    question: 'Approve build package for production?',
    context: {
      partNumber: inputs.partNumber,
      buildTime: buildFile.estimatedBuildTime,
      materialCost: buildFile.materialCost,
      thermalRisk: thermalSimulation.riskAssessment
    }
  });

  return {
    success: true,
    results: {
      partNumber: inputs.partNumber,
      buildFile: buildFile,
      orientation: orientationOptimization,
      supports: supportDesign,
      parameters: parameterDevelopment,
      postProcessingPlan: postProcessingPlan,
      qualityPlan: qualityPlan,
      thermalAnalysis: thermalSimulation
    },
    artifacts,
    metadata: {
      estimatedBuildTime: buildFile.estimatedBuildTime,
      materialConsumption: buildFile.materialConsumption,
      supportVolume: supportDesign.totalVolume
    }
  };
}

const dfamAnalysisTask = defineTask('dfam-analysis', (args) => ({
  kind: 'agent',
  title: 'Design for Additive Manufacturing Analysis',
  agent: {
    name: 'dfam-specialist',
    prompt: {
      role: 'Design for Additive Manufacturing Specialist',
      task: 'Analyze part design for AM printability and optimization opportunities',
      context: args,
      instructions: [
        'Evaluate geometry for AM process constraints',
        'Identify overhangs requiring support structures',
        'Assess wall thickness and feature size against machine resolution',
        'Check hole orientations for self-supporting angles',
        'Identify opportunities for topology optimization',
        'Evaluate internal channels and lattice potential',
        'Assess powder removal paths for internal features',
        'Score overall printability and recommend modifications'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['printabilityScore', 'recommendations', 'supportAnalysis', 'geometryAnalysis'],
      properties: {
        printabilityScore: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'object' } },
        supportAnalysis: { type: 'object' },
        geometryAnalysis: { type: 'object' },
        optimizationOpportunities: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const orientationTask = defineTask('orientation-optimization', (args) => ({
  kind: 'agent',
  title: 'Part Orientation Optimization',
  agent: {
    name: 'am-engineer',
    prompt: {
      role: 'AM Process Engineer',
      task: 'Optimize part orientation for build quality and efficiency',
      context: args,
      instructions: [
        'Analyze multiple orientation options',
        'Evaluate support volume for each orientation',
        'Consider surface finish requirements by surface',
        'Assess thermal distortion risk per orientation',
        'Consider build height and time impact',
        'Evaluate critical feature orientations',
        'Select optimal orientation with justification',
        'Consider recoater interference and part stability'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['optimalOrientation', 'orientationOptions', 'selectionRationale'],
      properties: {
        optimalOrientation: { type: 'object' },
        orientationOptions: { type: 'array', items: { type: 'object' } },
        selectionRationale: { type: 'string' },
        tradeoffs: { type: 'object' }
      }
    }
  }
}));

const supportDesignTask = defineTask('support-design', (args) => ({
  kind: 'agent',
  title: 'Support Structure Design',
  agent: {
    name: 'support-specialist',
    prompt: {
      role: 'AM Support Structure Specialist',
      task: 'Design optimal support structures for the build',
      context: args,
      instructions: [
        'Identify all surfaces requiring support',
        'Select appropriate support types (block, cone, tree, lattice)',
        'Design supports for easy removal and minimal marking',
        'Ensure adequate support for overhanging features',
        'Consider thermal management through supports',
        'Minimize support contact with critical surfaces',
        'Design support teeth/perforations for removal',
        'Calculate total support volume and material usage'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['supportStructures', 'totalVolume', 'removalPlan'],
      properties: {
        supportStructures: { type: 'array', items: { type: 'object' } },
        totalVolume: { type: 'number' },
        removalPlan: { type: 'object' },
        contactPoints: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const parameterDevelopmentTask = defineTask('parameter-development', (args) => ({
  kind: 'agent',
  title: 'Build Parameter Development',
  agent: {
    name: 'am-process-engineer',
    prompt: {
      role: 'AM Process Engineer',
      task: 'Develop and optimize print parameters for part requirements',
      context: args,
      instructions: [
        'Select layer thickness based on resolution requirements',
        'Optimize laser/electron beam power and speed',
        'Configure hatch spacing and pattern',
        'Set contour and infill parameters separately',
        'Define downskin and upskin strategies',
        'Configure support parameters',
        'Set recoater speed and gas flow parameters',
        'Define preheating and post-heating if applicable'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['coreParameters', 'contourParameters', 'supportParameters'],
      properties: {
        coreParameters: { type: 'object' },
        contourParameters: { type: 'object' },
        supportParameters: { type: 'object' },
        skinParameters: { type: 'object' },
        machineSettings: { type: 'object' }
      }
    }
  }
}));

const buildLayoutTask = defineTask('build-layout', (args) => ({
  kind: 'agent',
  title: 'Build Layout and Nesting',
  agent: {
    name: 'build-planner',
    prompt: {
      role: 'AM Build Planner',
      task: 'Arrange parts on build platform for optimal production',
      context: args,
      instructions: [
        'Position parts within build envelope',
        'Maintain required spacing between parts',
        'Consider gas flow direction effects',
        'Optimize for thermal uniformity',
        'Arrange for efficient powder usage',
        'Consider recoater blade direction',
        'Calculate build height and estimated time',
        'Plan for multiple parts if batch production'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['partPositions', 'buildHeight', 'platformUtilization'],
      properties: {
        partPositions: { type: 'array', items: { type: 'object' } },
        buildHeight: { type: 'number' },
        platformUtilization: { type: 'number' },
        spacing: { type: 'object' },
        estimatedTime: { type: 'number' }
      }
    }
  }
}));

const thermalSimulationTask = defineTask('thermal-simulation', (args) => ({
  kind: 'agent',
  title: 'Thermal Simulation Analysis',
  agent: {
    name: 'simulation-analyst',
    prompt: {
      role: 'AM Thermal Simulation Analyst',
      task: 'Simulate thermal history and predict distortion',
      context: args,
      instructions: [
        'Model layer-by-layer thermal accumulation',
        'Predict residual stress distribution',
        'Identify high distortion risk areas',
        'Simulate warpage and shrinkage',
        'Recommend pre-compensation if needed',
        'Identify potential crack initiation zones',
        'Assess support structure adequacy for thermal loads',
        'Generate thermal risk assessment report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['thermalHistory', 'distortionPrediction', 'riskAssessment'],
      properties: {
        thermalHistory: { type: 'object' },
        distortionPrediction: { type: 'object' },
        riskAssessment: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        preCompensation: { type: 'object' }
      }
    }
  }
}));

const buildFileTask = defineTask('build-file', (args) => ({
  kind: 'agent',
  title: 'Build File Generation',
  agent: {
    name: 'build-processor',
    prompt: {
      role: 'AM Build Processor',
      task: 'Generate machine-ready build file with all parameters',
      context: args,
      instructions: [
        'Slice part and supports at specified layer thickness',
        'Apply scan strategies per layer region',
        'Generate scan paths with parameters',
        'Configure layer-specific parameter changes if needed',
        'Include machine warmup and calibration routines',
        'Calculate accurate build time estimate',
        'Calculate material consumption',
        'Export in machine-native format'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['buildFilePath', 'estimatedBuildTime', 'materialConsumption'],
      properties: {
        buildFilePath: { type: 'string' },
        estimatedBuildTime: { type: 'number' },
        materialConsumption: { type: 'number' },
        materialCost: { type: 'number' },
        layerCount: { type: 'number' }
      }
    }
  }
}));

const postProcessingTask = defineTask('post-processing', (args) => ({
  kind: 'agent',
  title: 'Post-Processing Plan Development',
  agent: {
    name: 'post-process-engineer',
    prompt: {
      role: 'AM Post-Processing Engineer',
      task: 'Develop complete post-processing sequence',
      context: args,
      instructions: [
        'Define stress relief heat treatment parameters',
        'Plan support removal method and sequence',
        'Specify surface finishing requirements (machining, polishing)',
        'Define HIP parameters if required for density',
        'Plan final heat treatment for mechanical properties',
        'Specify cleaning and powder removal procedures',
        'Define inspection hold points',
        'Create post-processing traveler'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'heatTreatment', 'surfaceFinishing'],
      properties: {
        operations: { type: 'array', items: { type: 'object' } },
        heatTreatment: { type: 'object' },
        surfaceFinishing: { type: 'object' },
        hipParameters: { type: 'object' },
        traveler: { type: 'object' }
      }
    }
  }
}));

const qualityPlanTask = defineTask('quality-plan', (args) => ({
  kind: 'agent',
  title: 'Quality Plan Development',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'AM Quality Engineer',
      task: 'Develop comprehensive quality plan per aerospace standards',
      context: args,
      instructions: [
        'Define powder certification requirements',
        'Specify in-situ monitoring requirements',
        'Plan witness specimen locations and testing',
        'Define CT scan or NDT requirements',
        'Specify dimensional inspection plan',
        'Define metallurgical evaluation requirements',
        'Plan mechanical property testing',
        'Create quality documentation requirements per ASTM F3301'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['inspectionPlan', 'testingRequirements', 'documentation'],
      properties: {
        inspectionPlan: { type: 'object' },
        testingRequirements: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'array', items: { type: 'string' } },
        witnessSpecimens: { type: 'array', items: { type: 'object' } },
        ndtRequirements: { type: 'object' }
      }
    }
  }
}));

export default { process };

/**
 * @process MS-018: Corrosion & Degradation Assessment
 * @description Comprehensive corrosion and environmental degradation analysis including
 * electrochemical testing, exposure studies, and lifetime prediction for materials in service
 * @inputs {
 *   materialSystem: string,
 *   environmentType: string, // aqueous, atmospheric, high-temp, molten-salt, etc.
 *   corrosionMechanisms: string[], // uniform, pitting, crevice, galvanic, SCC, etc.
 *   testingStandards: string[], // ASTM G, ISO, NACE standards
 *   serviceConditions: object,
 *   sampleSpecifications: object,
 *   projectContext: string
 * }
 * @outputs {
 *   corrosionReport: object,
 *   electrochemicalData: object,
 *   degradationMechanisms: object,
 *   lifetimePrediction: object,
 *   mitigationStrategies: object,
 *   artifacts: string[]
 * }
 * @example
 * {
 *   "materialSystem": "316L stainless steel",
 *   "environmentType": "marine-atmospheric",
 *   "corrosionMechanisms": ["pitting", "crevice", "SCC"],
 *   "testingStandards": ["ASTM G48", "ASTM G61", "ASTM G129"],
 *   "serviceConditions": { "temperature": "25C", "chloride": "high", "humidity": "85%" },
 *   "sampleSpecifications": { "form": "plate", "surfaceFinish": "2B" }
 * }
 * @references ASTM G Standards, ISO 9227, NACE MR0175, ASTM G48 Pitting Test
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    materialSystem,
    environmentType,
    corrosionMechanisms,
    testingStandards,
    serviceConditions,
    sampleSpecifications,
    projectContext
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Environment and Material Analysis
  ctx.log('info', 'Phase 1: Analyzing corrosion environment and material susceptibility');
  const environmentAnalysis = await ctx.task(analyzeCorrosionEnvironment, {
    materialSystem,
    environmentType,
    serviceConditions,
    corrosionMechanisms,
    projectContext
  });
  artifacts.push(...(environmentAnalysis.artifacts || []));

  // Phase 2: Electrochemical Testing Protocol
  ctx.log('info', 'Phase 2: Executing electrochemical testing protocol');
  const electrochemicalTesting = await ctx.task(executeElectrochemicalTests, {
    materialSystem,
    environmentType,
    testingStandards,
    sampleSpecifications,
    susceptibilityAssessment: environmentAnalysis.susceptibilityAssessment
  });
  artifacts.push(...(electrochemicalTesting.artifacts || []));

  // Phase 3: Exposure and Immersion Testing
  ctx.log('info', 'Phase 3: Conducting exposure and immersion studies');
  const exposureTesting = await ctx.task(conductExposureTesting, {
    materialSystem,
    environmentType,
    corrosionMechanisms,
    testingStandards,
    serviceConditions,
    electrochemicalResults: electrochemicalTesting.results
  });
  artifacts.push(...(exposureTesting.artifacts || []));

  // Phase 4: Corrosion Product Analysis
  ctx.log('info', 'Phase 4: Analyzing corrosion products and degradation morphology');
  const productAnalysis = await ctx.task(analyzeCorrosionProducts, {
    materialSystem,
    exposureResults: exposureTesting.results,
    corrosionMechanisms,
    electrochemicalData: electrochemicalTesting.results
  });
  artifacts.push(...(productAnalysis.artifacts || []));

  // Phase 5: Mechanistic Interpretation
  ctx.log('info', 'Phase 5: Developing mechanistic understanding');
  const mechanisticAnalysis = await ctx.task(interpretCorrosionMechanisms, {
    materialSystem,
    environmentType,
    electrochemicalResults: electrochemicalTesting.results,
    exposureResults: exposureTesting.results,
    productAnalysis: productAnalysis.results,
    corrosionMechanisms
  });
  artifacts.push(...(mechanisticAnalysis.artifacts || []));

  // Phase 6: Lifetime Prediction Modeling
  ctx.log('info', 'Phase 6: Developing lifetime prediction models');
  const lifetimePrediction = await ctx.task(predictServiceLifetime, {
    materialSystem,
    serviceConditions,
    corrosionRates: exposureTesting.corrosionRates,
    mechanisticModel: mechanisticAnalysis.model,
    electrochemicalParameters: electrochemicalTesting.parameters
  });
  artifacts.push(...(lifetimePrediction.artifacts || []));

  // Quality Gate: Review corrosion assessment
  await ctx.breakpoint({
    question: 'Review corrosion assessment results. Are the degradation mechanisms properly identified and lifetime predictions reasonable?',
    title: 'Corrosion Assessment Review',
    context: {
      runId: ctx.runId,
      summary: {
        materialSystem,
        environmentType,
        identifiedMechanisms: mechanisticAnalysis.mechanisms,
        corrosionRates: exposureTesting.corrosionRates,
        predictedLifetime: lifetimePrediction.serviceLife
      },
      files: artifacts
    }
  });

  // Phase 7: Mitigation Strategy Development
  ctx.log('info', 'Phase 7: Developing corrosion mitigation strategies');
  const mitigationStrategies = await ctx.task(developMitigationStrategies, {
    materialSystem,
    environmentType,
    corrosionMechanisms: mechanisticAnalysis.mechanisms,
    serviceConditions,
    lifetimePrediction: lifetimePrediction.results,
    costConstraints: inputs.costConstraints
  });
  artifacts.push(...(mitigationStrategies.artifacts || []));

  // Phase 8: Monitoring and Inspection Protocol
  ctx.log('info', 'Phase 8: Establishing monitoring and inspection protocols');
  const monitoringProtocol = await ctx.task(establishMonitoringProtocol, {
    materialSystem,
    corrosionMechanisms: mechanisticAnalysis.mechanisms,
    mitigationStrategies: mitigationStrategies.strategies,
    serviceConditions,
    criticalLocations: mechanisticAnalysis.criticalLocations
  });
  artifacts.push(...(monitoringProtocol.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true,
    corrosionReport: {
      materialSystem,
      environmentType,
      testingStandards,
      environmentAnalysis: environmentAnalysis.results,
      electrochemicalData: electrochemicalTesting.results,
      exposureResults: exposureTesting.results,
      productAnalysis: productAnalysis.results
    },
    electrochemicalData: {
      polarizationCurves: electrochemicalTesting.polarizationData,
      impedanceSpectra: electrochemicalTesting.eisData,
      corrosionPotentials: electrochemicalTesting.potentials,
      corrosionCurrents: electrochemicalTesting.currents,
      pittingPotentials: electrochemicalTesting.pittingData
    },
    degradationMechanisms: {
      identifiedMechanisms: mechanisticAnalysis.mechanisms,
      dominantMechanism: mechanisticAnalysis.dominantMechanism,
      mechanisticModel: mechanisticAnalysis.model,
      criticalFactors: mechanisticAnalysis.criticalFactors,
      criticalLocations: mechanisticAnalysis.criticalLocations
    },
    lifetimePrediction: {
      serviceLife: lifetimePrediction.serviceLife,
      confidenceInterval: lifetimePrediction.confidence,
      degradationCurve: lifetimePrediction.degradationCurve,
      failureCriteria: lifetimePrediction.failureCriteria,
      sensitivityAnalysis: lifetimePrediction.sensitivity
    },
    mitigationStrategies: {
      coatings: mitigationStrategies.coatingOptions,
      inhibitors: mitigationStrategies.inhibitorOptions,
      cathodicProtection: mitigationStrategies.cpOptions,
      materialUpgrades: mitigationStrategies.materialAlternatives,
      environmentalControl: mitigationStrategies.environmentControl,
      costBenefit: mitigationStrategies.costAnalysis
    },
    monitoringProtocol: {
      techniques: monitoringProtocol.techniques,
      inspectionSchedule: monitoringProtocol.schedule,
      criticalIndicators: monitoringProtocol.indicators,
      alertThresholds: monitoringProtocol.thresholds
    },
    artifacts,
    metadata: {
      processId: 'MS-018',
      startTime,
      endTime,
      duration: endTime - startTime
    }
  };
}

export const analyzeCorrosionEnvironment = defineTask('analyze-corrosion-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Corrosion Environment Analysis',
  agent: {
    name: 'corrosion-environment-analyst',
    prompt: {
      role: 'Corrosion engineer specializing in environmental analysis and material susceptibility',
      task: `Analyze the corrosion environment and assess material susceptibility for ${args.materialSystem}`,
      context: args,
      instructions: [
        'Characterize the service environment (chemistry, temperature, flow, etc.)',
        'Identify aggressive species and their concentrations',
        'Assess thermodynamic stability using Pourbaix diagrams',
        'Evaluate kinetic factors affecting corrosion rate',
        'Map material susceptibility to identified mechanisms',
        'Consider synergistic effects between environmental factors',
        'Reference relevant standards and case studies'
      ],
      outputFormat: 'JSON with environment characterization and susceptibility assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'susceptibilityAssessment', 'artifacts'],
      properties: {
        results: { type: 'object' },
        susceptibilityAssessment: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'corrosion', 'environment', 'materials-science']
}));

export const executeElectrochemicalTests = defineTask('execute-electrochemical-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Electrochemical Corrosion Testing',
  agent: {
    name: 'electrochemical-testing-specialist',
    prompt: {
      role: 'Electrochemist specializing in corrosion testing and potentiostatic techniques',
      task: `Execute electrochemical corrosion testing protocol for ${args.materialSystem}`,
      context: args,
      instructions: [
        'Design electrochemical cell configuration per standards',
        'Perform open circuit potential (OCP) measurements',
        'Execute potentiodynamic polarization scans (Tafel, cyclic)',
        'Conduct electrochemical impedance spectroscopy (EIS)',
        'Perform pitting/crevice corrosion tests if applicable',
        'Calculate corrosion parameters (icorr, Ecorr, Epit, Erp)',
        'Fit equivalent circuits for EIS interpretation',
        'Ensure reproducibility with replicate tests'
      ],
      outputFormat: 'JSON with electrochemical data and derived parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'polarizationData', 'eisData', 'potentials', 'currents', 'parameters', 'artifacts'],
      properties: {
        results: { type: 'object' },
        polarizationData: { type: 'object' },
        eisData: { type: 'object' },
        potentials: { type: 'object' },
        currents: { type: 'object' },
        pittingData: { type: 'object' },
        parameters: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'electrochemistry', 'corrosion-testing', 'materials-science']
}));

export const conductExposureTesting = defineTask('conduct-exposure-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Corrosion Exposure Testing',
  agent: {
    name: 'exposure-testing-specialist',
    prompt: {
      role: 'Corrosion testing specialist for exposure and immersion studies',
      task: `Conduct exposure testing for ${args.materialSystem} in ${args.environmentType} environment`,
      context: args,
      instructions: [
        'Design exposure test matrix per applicable standards',
        'Set up immersion, salt spray, or atmospheric exposure tests',
        'Establish sample preparation and mounting procedures',
        'Monitor exposure conditions throughout testing',
        'Perform periodic mass loss and dimensional measurements',
        'Calculate corrosion rates (mpy, mm/yr)',
        'Document pit density, depth, and distribution if applicable',
        'Evaluate degradation of protective films or coatings'
      ],
      outputFormat: 'JSON with exposure results and corrosion rates'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'corrosionRates', 'artifacts'],
      properties: {
        results: { type: 'object' },
        corrosionRates: { type: 'object' },
        massLossData: { type: 'object' },
        pittingData: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'exposure-testing', 'corrosion', 'materials-science']
}));

export const analyzeCorrosionProducts = defineTask('analyze-corrosion-products', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Corrosion Product Analysis',
  agent: {
    name: 'corrosion-product-analyst',
    prompt: {
      role: 'Materials characterization specialist for corrosion product analysis',
      task: `Analyze corrosion products and degradation morphology for ${args.materialSystem}`,
      context: args,
      instructions: [
        'Examine corroded surfaces using optical and electron microscopy',
        'Identify corrosion product phases using XRD and Raman',
        'Analyze composition using EDS, XPS, or AES',
        'Characterize pit morphology and propagation paths',
        'Examine cross-sections for attack depth and profile',
        'Identify secondary phases or preferential attack',
        'Correlate product chemistry with environment',
        'Document photographic evidence of degradation'
      ],
      outputFormat: 'JSON with corrosion product characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        productPhases: { type: 'array' },
        morphologyAnalysis: { type: 'object' },
        compositionData: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'characterization', 'corrosion-products', 'materials-science']
}));

export const interpretCorrosionMechanisms = defineTask('interpret-corrosion-mechanisms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Corrosion Mechanism Interpretation',
  agent: {
    name: 'corrosion-mechanist',
    prompt: {
      role: 'Senior corrosion scientist specializing in mechanistic interpretation',
      task: `Develop mechanistic understanding of corrosion for ${args.materialSystem}`,
      context: args,
      instructions: [
        'Integrate electrochemical and exposure test results',
        'Identify active corrosion mechanisms and their interactions',
        'Determine rate-controlling steps for each mechanism',
        'Develop kinetic models for corrosion processes',
        'Map critical environmental and material factors',
        'Identify locations most susceptible to attack',
        'Compare with literature and field failure data',
        'Establish mechanism hierarchy and transitions'
      ],
      outputFormat: 'JSON with mechanistic model and critical factors'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'dominantMechanism', 'model', 'criticalFactors', 'criticalLocations', 'artifacts'],
      properties: {
        mechanisms: { type: 'array' },
        dominantMechanism: { type: 'string' },
        model: { type: 'object' },
        criticalFactors: { type: 'array' },
        criticalLocations: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mechanisms', 'corrosion-science', 'materials-science']
}));

export const predictServiceLifetime = defineTask('predict-service-lifetime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Corrosion Lifetime Prediction',
  agent: {
    name: 'lifetime-prediction-specialist',
    prompt: {
      role: 'Corrosion engineer specializing in lifetime prediction and reliability',
      task: `Develop service lifetime predictions for ${args.materialSystem}`,
      context: args,
      instructions: [
        'Select appropriate lifetime prediction methodology',
        'Extrapolate laboratory data to service conditions',
        'Apply acceleration factors and dose-response models',
        'Account for mechanism transitions over time',
        'Perform probabilistic lifetime analysis',
        'Establish failure criteria based on service requirements',
        'Conduct sensitivity analysis on key parameters',
        'Quantify prediction uncertainty and confidence bounds'
      ],
      outputFormat: 'JSON with lifetime prediction and uncertainty analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'serviceLife', 'confidence', 'degradationCurve', 'failureCriteria', 'sensitivity', 'artifacts'],
      properties: {
        results: { type: 'object' },
        serviceLife: { type: 'object' },
        confidence: { type: 'object' },
        degradationCurve: { type: 'object' },
        failureCriteria: { type: 'object' },
        sensitivity: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lifetime-prediction', 'reliability', 'materials-science']
}));

export const developMitigationStrategies = defineTask('develop-mitigation-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Corrosion Mitigation Strategy Development',
  agent: {
    name: 'corrosion-mitigation-engineer',
    prompt: {
      role: 'Corrosion control engineer specializing in mitigation strategies',
      task: `Develop corrosion mitigation strategies for ${args.materialSystem}`,
      context: args,
      instructions: [
        'Evaluate protective coating systems for the environment',
        'Assess corrosion inhibitor options and effectiveness',
        'Design cathodic or anodic protection systems if applicable',
        'Identify material substitution alternatives',
        'Consider environmental modification approaches',
        'Develop combined/hybrid protection strategies',
        'Perform cost-benefit analysis for each option',
        'Recommend optimal mitigation approach with justification'
      ],
      outputFormat: 'JSON with mitigation options and cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'coatingOptions', 'inhibitorOptions', 'cpOptions', 'materialAlternatives', 'environmentControl', 'costAnalysis', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        coatingOptions: { type: 'array' },
        inhibitorOptions: { type: 'array' },
        cpOptions: { type: 'object' },
        materialAlternatives: { type: 'array' },
        environmentControl: { type: 'object' },
        costAnalysis: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'mitigation', 'corrosion-control', 'materials-science']
}));

export const establishMonitoringProtocol = defineTask('establish-monitoring-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Corrosion Monitoring Protocol',
  agent: {
    name: 'corrosion-monitoring-specialist',
    prompt: {
      role: 'Asset integrity specialist for corrosion monitoring programs',
      task: `Establish corrosion monitoring and inspection protocol for ${args.materialSystem}`,
      context: args,
      instructions: [
        'Select appropriate monitoring techniques (coupons, probes, UT, etc.)',
        'Define monitoring locations based on risk assessment',
        'Establish inspection intervals and schedules',
        'Define corrosion rate thresholds and alert criteria',
        'Specify NDT methods for damage assessment',
        'Integrate monitoring data with integrity management',
        'Develop trending and prediction protocols',
        'Create documentation and reporting requirements'
      ],
      outputFormat: 'JSON with monitoring protocol and schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'schedule', 'indicators', 'thresholds', 'artifacts'],
      properties: {
        techniques: { type: 'array' },
        schedule: { type: 'object' },
        indicators: { type: 'array' },
        thresholds: { type: 'object' },
        locations: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'monitoring', 'inspection', 'materials-science']
}));

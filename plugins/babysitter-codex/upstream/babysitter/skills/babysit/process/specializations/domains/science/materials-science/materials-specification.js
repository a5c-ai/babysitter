/**
 * @process MS-020: Materials Specification Development
 * @description Comprehensive materials specification development including composition,
 * processing, properties, testing requirements, and quality assurance for procurement and manufacturing
 * @inputs {
 *   applicationRequirements: object,
 *   materialClass: string, // metals, polymers, ceramics, composites
 *   performanceCriteria: object,
 *   processingConstraints: object,
 *   regulatoryRequirements: string[],
 *   industryStandards: string[],
 *   projectContext: string
 * }
 * @outputs {
 *   materialSpecification: object,
 *   compositionLimits: object,
 *   propertyRequirements: object,
 *   testingProtocol: object,
 *   qualityRequirements: object,
 *   artifacts: string[]
 * }
 * @example
 * {
 *   "applicationRequirements": { "component": "turbine-blade", "temperature": "1000C", "stress": "150MPa" },
 *   "materialClass": "nickel-superalloy",
 *   "performanceCriteria": { "creepLife": "10000h", "oxidationResistance": "high" },
 *   "regulatoryRequirements": ["FAA", "EASA"],
 *   "industryStandards": ["AMS", "ASTM"]
 * }
 * @references AMS Standards, ASTM Specifications, SAE Standards, ISO Material Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    applicationRequirements,
    materialClass,
    performanceCriteria,
    processingConstraints,
    regulatoryRequirements,
    industryStandards,
    projectContext
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Requirements Analysis
  ctx.log('info', 'Phase 1: Analyzing application requirements and constraints');
  const requirementsAnalysis = await ctx.task(analyzeRequirements, {
    applicationRequirements,
    materialClass,
    performanceCriteria,
    processingConstraints,
    regulatoryRequirements,
    projectContext
  });
  artifacts.push(...(requirementsAnalysis.artifacts || []));

  // Phase 2: Benchmark Existing Specifications
  ctx.log('info', 'Phase 2: Benchmarking existing specifications and standards');
  const specificationBenchmark = await ctx.task(benchmarkSpecifications, {
    materialClass,
    industryStandards,
    requirementsProfile: requirementsAnalysis.profile,
    regulatoryRequirements
  });
  artifacts.push(...(specificationBenchmark.artifacts || []));

  // Phase 3: Composition Specification
  ctx.log('info', 'Phase 3: Defining chemical composition requirements');
  const compositionSpec = await ctx.task(specifyComposition, {
    materialClass,
    performanceCriteria,
    benchmarkSpecs: specificationBenchmark.relevantSpecs,
    processingConstraints,
    traceElementLimits: inputs.traceElementLimits
  });
  artifacts.push(...(compositionSpec.artifacts || []));

  // Phase 4: Processing Requirements
  ctx.log('info', 'Phase 4: Specifying processing and heat treatment requirements');
  const processingSpec = await ctx.task(specifyProcessing, {
    materialClass,
    compositionLimits: compositionSpec.limits,
    applicationRequirements,
    processingConstraints,
    microstructureRequirements: inputs.microstructureRequirements
  });
  artifacts.push(...(processingSpec.artifacts || []));

  // Phase 5: Property Requirements
  ctx.log('info', 'Phase 5: Defining mechanical and physical property requirements');
  const propertySpec = await ctx.task(specifyProperties, {
    applicationRequirements,
    performanceCriteria,
    compositionLimits: compositionSpec.limits,
    processingConditions: processingSpec.conditions,
    testTemperatures: inputs.testTemperatures
  });
  artifacts.push(...(propertySpec.artifacts || []));

  // Phase 6: Testing Protocol
  ctx.log('info', 'Phase 6: Developing testing and verification protocol');
  const testingProtocol = await ctx.task(developTestingProtocol, {
    propertyRequirements: propertySpec.requirements,
    compositionLimits: compositionSpec.limits,
    industryStandards,
    samplingRequirements: inputs.samplingRequirements,
    statisticalBasis: inputs.statisticalBasis
  });
  artifacts.push(...(testingProtocol.artifacts || []));

  // Quality Gate: Review specification draft
  await ctx.breakpoint({
    question: 'Review the draft material specification. Are all requirements properly captured and test methods appropriate?',
    title: 'Material Specification Review',
    context: {
      runId: ctx.runId,
      summary: {
        materialClass,
        compositionLimits: compositionSpec.limits,
        keyProperties: propertySpec.keyRequirements,
        testMethods: testingProtocol.methods
      },
      files: artifacts
    }
  });

  // Phase 7: Quality Assurance Requirements
  ctx.log('info', 'Phase 7: Establishing quality assurance requirements');
  const qualityRequirements = await ctx.task(establishQualityRequirements, {
    regulatoryRequirements,
    industryStandards,
    testingProtocol: testingProtocol.protocol,
    supplierQualification: inputs.supplierQualification,
    traceabilityRequirements: inputs.traceabilityRequirements
  });
  artifacts.push(...(qualityRequirements.artifacts || []));

  // Phase 8: Documentation and Formatting
  ctx.log('info', 'Phase 8: Formatting specification document');
  const specificationDocument = await ctx.task(formatSpecification, {
    requirementsAnalysis: requirementsAnalysis.results,
    compositionSpec: compositionSpec.specification,
    processingSpec: processingSpec.specification,
    propertySpec: propertySpec.specification,
    testingProtocol: testingProtocol.protocol,
    qualityRequirements: qualityRequirements.requirements,
    documentFormat: inputs.documentFormat || 'AMS-style'
  });
  artifacts.push(...(specificationDocument.artifacts || []));

  // Phase 9: Review and Validation
  ctx.log('info', 'Phase 9: Validating specification completeness');
  const specificationValidation = await ctx.task(validateSpecification, {
    specification: specificationDocument.document,
    applicationRequirements,
    regulatoryRequirements,
    industryStandards,
    performanceCriteria
  });
  artifacts.push(...(specificationValidation.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true,
    materialSpecification: {
      document: specificationDocument.document,
      specificationNumber: specificationDocument.specNumber,
      revision: specificationDocument.revision,
      scope: requirementsAnalysis.scope,
      applicableMaterials: compositionSpec.applicableMaterials
    },
    compositionLimits: {
      chemicalComposition: compositionSpec.limits,
      traceElements: compositionSpec.traceElementLimits,
      impurityLimits: compositionSpec.impurityLimits,
      tolerances: compositionSpec.tolerances
    },
    propertyRequirements: {
      mechanical: propertySpec.mechanicalRequirements,
      physical: propertySpec.physicalRequirements,
      environmental: propertySpec.environmentalRequirements,
      minimumValues: propertySpec.minimumValues,
      statisticalBasis: propertySpec.statisticalBasis
    },
    processingRequirements: {
      meltingPractice: processingSpec.meltingRequirements,
      formingOperations: processingSpec.formingRequirements,
      heatTreatment: processingSpec.heatTreatmentRequirements,
      surfaceCondition: processingSpec.surfaceRequirements
    },
    testingProtocol: {
      testMethods: testingProtocol.methods,
      samplingPlan: testingProtocol.sampling,
      acceptanceCriteria: testingProtocol.acceptance,
      frequencyRequirements: testingProtocol.frequency,
      laboratoryRequirements: testingProtocol.labRequirements
    },
    qualityRequirements: {
      supplierQualification: qualityRequirements.supplierRequirements,
      processControl: qualityRequirements.processControl,
      documentation: qualityRequirements.documentation,
      traceability: qualityRequirements.traceability,
      nonconformance: qualityRequirements.nonconformanceHandling
    },
    validation: specificationValidation.results,
    artifacts,
    metadata: {
      processId: 'MS-020',
      startTime,
      endTime,
      duration: endTime - startTime
    }
  };
}

export const analyzeRequirements = defineTask('analyze-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Requirements Analysis',
  agent: {
    name: 'materials-requirements-analyst',
    prompt: {
      role: 'Materials engineer specializing in specification development',
      task: `Analyze application requirements for ${args.materialClass} specification`,
      context: args,
      instructions: [
        'Review application requirements and service conditions',
        'Identify critical performance drivers',
        'Map requirements to material property needs',
        'Consider processing and manufacturing constraints',
        'Identify regulatory and certification requirements',
        'Define specification scope and applicability',
        'Prioritize requirements by criticality',
        'Document assumptions and boundary conditions'
      ],
      outputFormat: 'JSON with requirements profile and scope'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'profile', 'scope', 'artifacts'],
      properties: {
        results: { type: 'object' },
        profile: { type: 'object' },
        scope: { type: 'object' },
        criticalRequirements: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'requirements', 'specification', 'materials-science']
}));

export const benchmarkSpecifications = defineTask('benchmark-specifications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specification Benchmarking',
  agent: {
    name: 'specification-benchmark-analyst',
    prompt: {
      role: 'Standards specialist for material specifications',
      task: `Benchmark existing specifications for ${args.materialClass}`,
      context: args,
      instructions: [
        'Survey existing industry specifications (AMS, ASTM, SAE, etc.)',
        'Identify specifications meeting requirements profile',
        'Compare composition and property requirements',
        'Analyze testing and quality provisions',
        'Identify gaps in existing specifications',
        'Note best practices from benchmark specs',
        'Consider proprietary vs. public specifications',
        'Document specification evolution and revisions'
      ],
      outputFormat: 'JSON with benchmark analysis and relevant specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['relevantSpecs', 'gaps', 'artifacts'],
      properties: {
        relevantSpecs: { type: 'array' },
        benchmarkComparison: { type: 'object' },
        gaps: { type: 'array' },
        bestPractices: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'benchmarking', 'standards', 'materials-science']
}));

export const specifyComposition = defineTask('specify-composition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Composition Specification',
  agent: {
    name: 'composition-specification-engineer',
    prompt: {
      role: 'Metallurgist specializing in alloy chemistry and specification',
      task: `Define chemical composition requirements for ${args.materialClass}`,
      context: args,
      instructions: [
        'Establish primary alloying element ranges',
        'Set trace element and impurity limits',
        'Consider composition-property relationships',
        'Account for processing effects on chemistry',
        'Define analytical tolerances and methods',
        'Address melt practice variations',
        'Consider recyclability and sustainability',
        'Balance specification tightness with producibility'
      ],
      outputFormat: 'JSON with composition limits and tolerances'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'limits', 'traceElementLimits', 'impurityLimits', 'tolerances', 'applicableMaterials', 'artifacts'],
      properties: {
        specification: { type: 'object' },
        limits: { type: 'object' },
        traceElementLimits: { type: 'object' },
        impurityLimits: { type: 'object' },
        tolerances: { type: 'object' },
        applicableMaterials: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'composition', 'chemistry', 'materials-science']
}));

export const specifyProcessing = defineTask('specify-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Processing Specification',
  agent: {
    name: 'processing-specification-engineer',
    prompt: {
      role: 'Process metallurgist for material specification development',
      task: `Specify processing requirements for ${args.materialClass}`,
      context: args,
      instructions: [
        'Define melting and refining practice requirements',
        'Specify forming and working operations',
        'Establish heat treatment parameters and tolerances',
        'Define microstructure requirements',
        'Specify surface condition and preparation',
        'Address dimensional and form tolerances',
        'Consider certification and traceability',
        'Balance prescription vs. performance-based requirements'
      ],
      outputFormat: 'JSON with processing requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'conditions', 'meltingRequirements', 'formingRequirements', 'heatTreatmentRequirements', 'surfaceRequirements', 'artifacts'],
      properties: {
        specification: { type: 'object' },
        conditions: { type: 'object' },
        meltingRequirements: { type: 'object' },
        formingRequirements: { type: 'object' },
        heatTreatmentRequirements: { type: 'object' },
        surfaceRequirements: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'processing', 'manufacturing', 'materials-science']
}));

export const specifyProperties = defineTask('specify-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Property Specification',
  agent: {
    name: 'property-specification-engineer',
    prompt: {
      role: 'Materials engineer for mechanical and physical property specification',
      task: 'Define mechanical and physical property requirements',
      context: args,
      instructions: [
        'Establish tensile property requirements (YS, UTS, elongation)',
        'Define hardness requirements and ranges',
        'Specify impact/toughness requirements',
        'Set fatigue and fracture toughness criteria if required',
        'Define creep/stress-rupture requirements if applicable',
        'Specify physical properties (density, thermal, electrical)',
        'Establish statistical basis for property values',
        'Define property requirements at temperature'
      ],
      outputFormat: 'JSON with property requirements and minimums'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'requirements', 'keyRequirements', 'mechanicalRequirements', 'physicalRequirements', 'environmentalRequirements', 'minimumValues', 'statisticalBasis', 'artifacts'],
      properties: {
        specification: { type: 'object' },
        requirements: { type: 'object' },
        keyRequirements: { type: 'array' },
        mechanicalRequirements: { type: 'object' },
        physicalRequirements: { type: 'object' },
        environmentalRequirements: { type: 'object' },
        minimumValues: { type: 'object' },
        statisticalBasis: { type: 'string' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'properties', 'mechanical', 'materials-science']
}));

export const developTestingProtocol = defineTask('develop-testing-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Testing Protocol Development',
  agent: {
    name: 'testing-protocol-developer',
    prompt: {
      role: 'Materials testing specialist for specification development',
      task: 'Develop testing and verification protocol',
      context: args,
      instructions: [
        'Select appropriate test methods per standards',
        'Define sampling plan and test frequency',
        'Establish acceptance criteria for each test',
        'Specify specimen geometry and preparation',
        'Define test conditions and parameters',
        'Address laboratory qualification requirements',
        'Establish retest and rejection criteria',
        'Consider witness and source inspection points'
      ],
      outputFormat: 'JSON with testing protocol and methods'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'methods', 'sampling', 'acceptance', 'frequency', 'labRequirements', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        methods: { type: 'array' },
        sampling: { type: 'object' },
        acceptance: { type: 'object' },
        frequency: { type: 'object' },
        labRequirements: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'testing', 'protocol', 'materials-science']
}));

export const establishQualityRequirements = defineTask('establish-quality-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quality Requirements Establishment',
  agent: {
    name: 'quality-requirements-specialist',
    prompt: {
      role: 'Quality engineer for material specification quality provisions',
      task: 'Establish quality assurance requirements',
      context: args,
      instructions: [
        'Define supplier qualification requirements',
        'Establish process control provisions',
        'Specify documentation and certification requirements',
        'Define traceability requirements',
        'Establish nonconformance handling procedures',
        'Address special process approvals',
        'Define audit and surveillance provisions',
        'Consider continuous improvement requirements'
      ],
      outputFormat: 'JSON with quality requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'supplierRequirements', 'processControl', 'documentation', 'traceability', 'nonconformanceHandling', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        supplierRequirements: { type: 'object' },
        processControl: { type: 'object' },
        documentation: { type: 'object' },
        traceability: { type: 'object' },
        nonconformanceHandling: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality', 'assurance', 'materials-science']
}));

export const formatSpecification = defineTask('format-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specification Formatting',
  agent: {
    name: 'specification-document-formatter',
    prompt: {
      role: 'Technical writer for material specifications',
      task: 'Format and compile specification document',
      context: args,
      instructions: [
        'Organize content per standard specification format',
        'Include all required sections and clauses',
        'Ensure consistent terminology and units',
        'Add referenced documents and standards',
        'Include appendices for supplementary data',
        'Format tables and figures per convention',
        'Assign specification number and revision',
        'Prepare for review and approval workflow'
      ],
      outputFormat: 'JSON with formatted specification document'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'specNumber', 'revision', 'artifacts'],
      properties: {
        document: { type: 'object' },
        specNumber: { type: 'string' },
        revision: { type: 'string' },
        sections: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'formatting', 'materials-science']
}));

export const validateSpecification = defineTask('validate-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specification Validation',
  agent: {
    name: 'specification-validator',
    prompt: {
      role: 'Senior materials engineer for specification validation',
      task: 'Validate specification completeness and consistency',
      context: args,
      instructions: [
        'Verify all requirements are addressed',
        'Check internal consistency of specification',
        'Validate against regulatory requirements',
        'Ensure producibility of specified material',
        'Verify test methods match property requirements',
        'Check for conflicts with referenced standards',
        'Assess specification clarity and usability',
        'Document validation findings and recommendations'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'findings', 'recommendations', 'artifacts'],
      properties: {
        results: { type: 'object' },
        compliant: { type: 'boolean' },
        findings: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'validation', 'review', 'materials-science']
}));

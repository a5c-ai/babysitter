/**
 * @process test-plan-development
 * @description Engineering test plan development - test requirements, procedures, fixtures, and data acquisition
 * @inputs {object} inputs
 * @inputs {string} inputs.projectId - Project identification
 * @inputs {object} inputs.requirements - Product requirements to be verified
 * @inputs {object} inputs.testArticle - Test article specifications
 * @inputs {string} inputs.testType - Type of testing (qualification, acceptance, development)
 * @inputs {object} inputs.constraints - Budget, schedule, and facility constraints
 * @outputs {object} testPlan - Comprehensive test plan with procedures and instrumentation
 * @example
 * const result = await process({
 *   projectId: 'TP-2024-001',
 *   requirements: { functional: [...], environmental: [...], performance: [...] },
 *   testArticle: { part: 'Hydraulic Actuator', quantity: 3 },
 *   testType: 'qualification',
 *   constraints: { budget: 150000, duration: 12, facility: 'internal' }
 * });
 * @references MIL-STD-810, RTCA DO-160, ISO 16750, SAE J1211
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const artifacts = [];

  // Phase 1: Requirements Analysis and Test Matrix
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    requirements: inputs.requirements,
    testType: inputs.testType,
    testArticle: inputs.testArticle
  });
  artifacts.push({ phase: 'requirements-analysis', data: requirementsAnalysis });

  // Phase 2: Test Strategy Development
  const testStrategy = await ctx.task(testStrategyTask, {
    testMatrix: requirementsAnalysis.testMatrix,
    constraints: inputs.constraints,
    testType: inputs.testType
  });
  artifacts.push({ phase: 'test-strategy', data: testStrategy });

  // Breakpoint: Test Strategy Review
  await ctx.breakpoint('strategy-review', {
    question: 'Review test strategy and approach. Approve test methodology?',
    context: {
      testCount: testStrategy.testCount,
      estimatedCost: testStrategy.costEstimate,
      estimatedDuration: testStrategy.durationEstimate
    }
  });

  // Phase 3: Test Procedure Development
  const testProcedures = await ctx.task(testProceduresTask, {
    testMatrix: requirementsAnalysis.testMatrix,
    testStrategy: testStrategy,
    testArticle: inputs.testArticle
  });
  artifacts.push({ phase: 'test-procedures', data: testProcedures });

  // Phase 4: Test Fixture Design Requirements
  const fixtureRequirements = await ctx.task(fixtureRequirementsTask, {
    testProcedures: testProcedures,
    testArticle: inputs.testArticle
  });
  artifacts.push({ phase: 'fixture-requirements', data: fixtureRequirements });

  // Phase 5: Instrumentation and DAQ Planning
  const instrumentationPlan = await ctx.task(instrumentationTask, {
    testProcedures: testProcedures,
    requirements: inputs.requirements,
    testArticle: inputs.testArticle
  });
  artifacts.push({ phase: 'instrumentation', data: instrumentationPlan });

  // Phase 6: Data Analysis Planning
  const dataAnalysisPlan = await ctx.task(dataAnalysisTask, {
    testProcedures: testProcedures,
    requirements: inputs.requirements,
    instrumentationPlan: instrumentationPlan
  });
  artifacts.push({ phase: 'data-analysis', data: dataAnalysisPlan });

  // Phase 7: Risk Assessment and Mitigation
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    testProcedures: testProcedures,
    testArticle: inputs.testArticle,
    constraints: inputs.constraints
  });
  artifacts.push({ phase: 'risk-assessment', data: riskAssessment });

  // Phase 8: Resource and Schedule Planning
  const resourcePlan = await ctx.task(resourcePlanTask, {
    testProcedures: testProcedures,
    fixtureRequirements: fixtureRequirements,
    instrumentationPlan: instrumentationPlan,
    constraints: inputs.constraints
  });
  artifacts.push({ phase: 'resource-plan', data: resourcePlan });

  // Phase 9: Test Plan Documentation
  const testPlanDocument = await ctx.task(testPlanDocumentTask, {
    projectId: inputs.projectId,
    requirementsAnalysis: requirementsAnalysis,
    testStrategy: testStrategy,
    testProcedures: testProcedures,
    instrumentationPlan: instrumentationPlan,
    resourcePlan: resourcePlan
  });
  artifacts.push({ phase: 'test-plan-document', data: testPlanDocument });

  // Final Breakpoint: Test Plan Approval
  await ctx.breakpoint('test-plan-approval', {
    question: 'Approve test plan for execution?',
    context: {
      projectId: inputs.projectId,
      totalTests: testStrategy.testCount,
      totalCost: resourcePlan.totalCost,
      totalDuration: resourcePlan.totalDuration
    }
  });

  return {
    success: true,
    results: {
      projectId: inputs.projectId,
      testPlan: testPlanDocument,
      testMatrix: requirementsAnalysis.testMatrix,
      testProcedures: testProcedures,
      instrumentationPlan: instrumentationPlan,
      fixtureRequirements: fixtureRequirements,
      resourcePlan: resourcePlan,
      riskAssessment: riskAssessment
    },
    artifacts,
    metadata: {
      testCount: testStrategy.testCount,
      estimatedCost: resourcePlan.totalCost,
      estimatedDuration: resourcePlan.totalDuration
    }
  };
}

const requirementsAnalysisTask = defineTask('requirements-analysis', (args) => ({
  kind: 'agent',
  title: 'Requirements Analysis and Test Matrix Development',
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Senior Test Engineer',
      task: 'Analyze requirements and develop verification test matrix',
      context: args,
      instructions: [
        'Review all product requirements for testability',
        'Identify verification method for each requirement (test, analysis, inspection)',
        'Develop requirements verification matrix (RVM)',
        'Group related requirements for test efficiency',
        'Identify critical requirements requiring additional test coverage',
        'Determine test levels (component, subsystem, system)',
        'Map requirements to specific test conditions',
        'Identify requirements that can be combined in single tests'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testMatrix', 'verificationMethods', 'requirementMapping'],
      properties: {
        testMatrix: { type: 'array', items: { type: 'object' } },
        verificationMethods: { type: 'object' },
        requirementMapping: { type: 'object' },
        criticalRequirements: { type: 'array', items: { type: 'string' } },
        testLevels: { type: 'object' }
      }
    }
  }
}));

const testStrategyTask = defineTask('test-strategy', (args) => ({
  kind: 'agent',
  title: 'Test Strategy Development',
  agent: {
    name: 'test-strategist',
    prompt: {
      role: 'Test Program Manager',
      task: 'Develop comprehensive test strategy within constraints',
      context: args,
      instructions: [
        'Define test philosophy (test-to-failure vs test-to-requirements)',
        'Determine test sequence for logical flow',
        'Identify tests that share setup or conditions',
        'Plan for test article usage and attrition',
        'Determine make/buy decisions for test capability',
        'Plan for retest scenarios and failure investigation',
        'Develop preliminary schedule and cost estimates',
        'Identify long-lead items and critical path'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testPhilosophy', 'testSequence', 'testCount', 'costEstimate', 'durationEstimate'],
      properties: {
        testPhilosophy: { type: 'string' },
        testSequence: { type: 'array', items: { type: 'object' } },
        testCount: { type: 'number' },
        costEstimate: { type: 'number' },
        durationEstimate: { type: 'number' },
        makeBuyAnalysis: { type: 'object' },
        criticalPath: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}));

const testProceduresTask = defineTask('test-procedures', (args) => ({
  kind: 'agent',
  title: 'Test Procedure Development',
  agent: {
    name: 'procedure-writer',
    prompt: {
      role: 'Test Procedure Engineer',
      task: 'Develop detailed test procedures for all planned tests',
      context: args,
      instructions: [
        'Write step-by-step test procedures',
        'Define test setup and configuration requirements',
        'Specify test conditions (loads, temperatures, pressures)',
        'Define pass/fail criteria for each test',
        'Include safety precautions and hazard mitigations',
        'Specify hold points for data review or inspection',
        'Define test abort criteria and recovery procedures',
        'Include data recording requirements at each step'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'testConditions', 'passCriteria'],
      properties: {
        procedures: { type: 'array', items: { type: 'object' } },
        testConditions: { type: 'array', items: { type: 'object' } },
        passCriteria: { type: 'array', items: { type: 'object' } },
        safetyRequirements: { type: 'array', items: { type: 'object' } },
        holdPoints: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const fixtureRequirementsTask = defineTask('fixture-requirements', (args) => ({
  kind: 'agent',
  title: 'Test Fixture Design Requirements',
  agent: {
    name: 'fixture-engineer',
    prompt: {
      role: 'Test Fixture Engineer',
      task: 'Define test fixture and tooling requirements',
      context: args,
      instructions: [
        'Identify fixture requirements for each test',
        'Define load introduction and reaction requirements',
        'Specify fixture interface with test equipment',
        'Define fixture accuracy and repeatability requirements',
        'Identify standard vs custom fixture needs',
        'Specify fixture material and environmental compatibility',
        'Define fixture calibration and verification requirements',
        'Estimate fixture design and fabrication lead times'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['fixtures', 'interfaceRequirements', 'specifications'],
      properties: {
        fixtures: { type: 'array', items: { type: 'object' } },
        interfaceRequirements: { type: 'object' },
        specifications: { type: 'array', items: { type: 'object' } },
        standardFixtures: { type: 'array', items: { type: 'string' } },
        customFixtures: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const instrumentationTask = defineTask('instrumentation', (args) => ({
  kind: 'agent',
  title: 'Instrumentation and Data Acquisition Planning',
  agent: {
    name: 'instrumentation-engineer',
    prompt: {
      role: 'Instrumentation Engineer',
      task: 'Plan instrumentation and data acquisition systems',
      context: args,
      instructions: [
        'Define measurement parameters for each test',
        'Select appropriate transducers and sensors',
        'Specify measurement range and accuracy requirements',
        'Define sample rates and data acquisition requirements',
        'Plan sensor installation locations',
        'Specify signal conditioning requirements',
        'Define calibration requirements and intervals',
        'Plan for data storage and backup'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['measurements', 'sensors', 'daqRequirements'],
      properties: {
        measurements: { type: 'array', items: { type: 'object' } },
        sensors: { type: 'array', items: { type: 'object' } },
        daqRequirements: { type: 'object' },
        calibrationRequirements: { type: 'array', items: { type: 'object' } },
        channelList: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const dataAnalysisTask = defineTask('data-analysis-plan', (args) => ({
  kind: 'agent',
  title: 'Data Analysis Planning',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Test Data Analysis Engineer',
      task: 'Develop data analysis plan and reporting requirements',
      context: args,
      instructions: [
        'Define data processing and filtering requirements',
        'Specify derived parameters and calculations',
        'Define statistical analysis requirements',
        'Plan data comparison with predictions/requirements',
        'Define data visualization requirements',
        'Specify test report content and format',
        'Plan for real-time data monitoring during test',
        'Define data archival and retention requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analysisRequirements', 'derivedParameters', 'reportFormat'],
      properties: {
        analysisRequirements: { type: 'array', items: { type: 'object' } },
        derivedParameters: { type: 'array', items: { type: 'object' } },
        statisticalMethods: { type: 'array', items: { type: 'string' } },
        reportFormat: { type: 'object' },
        visualizations: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const riskAssessmentTask = defineTask('risk-assessment', (args) => ({
  kind: 'agent',
  title: 'Test Risk Assessment and Mitigation',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'Test Risk Analyst',
      task: 'Assess test program risks and develop mitigations',
      context: args,
      instructions: [
        'Identify technical risks (test article failure, equipment issues)',
        'Identify programmatic risks (schedule, cost, resources)',
        'Assess safety risks during test execution',
        'Rate risks by probability and consequence',
        'Develop mitigation strategies for high risks',
        'Plan contingencies for critical failures',
        'Identify risk triggers and monitoring approach',
        'Develop risk-based test prioritization'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'mitigations', 'contingencies'],
      properties: {
        risks: { type: 'array', items: { type: 'object' } },
        mitigations: { type: 'array', items: { type: 'object' } },
        contingencies: { type: 'array', items: { type: 'object' } },
        riskMatrix: { type: 'object' },
        monitoringPlan: { type: 'object' }
      }
    }
  }
}));

const resourcePlanTask = defineTask('resource-plan', (args) => ({
  kind: 'agent',
  title: 'Resource and Schedule Planning',
  agent: {
    name: 'resource-planner',
    prompt: {
      role: 'Test Resource Planner',
      task: 'Develop detailed resource plan and schedule',
      context: args,
      instructions: [
        'Identify personnel requirements and skills',
        'Plan equipment and facility utilization',
        'Develop detailed test schedule with dependencies',
        'Calculate labor and equipment costs',
        'Plan procurement of sensors and consumables',
        'Identify facility booking requirements',
        'Plan for support services (calibration, NDT, etc.)',
        'Develop resource-loaded schedule'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['personnelPlan', 'schedule', 'totalCost', 'totalDuration'],
      properties: {
        personnelPlan: { type: 'array', items: { type: 'object' } },
        equipmentPlan: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        costBreakdown: { type: 'object' },
        totalCost: { type: 'number' },
        totalDuration: { type: 'number' },
        facilityRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const testPlanDocumentTask = defineTask('test-plan-document', (args) => ({
  kind: 'agent',
  title: 'Test Plan Document Compilation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'Test Documentation Specialist',
      task: 'Compile comprehensive test plan document',
      context: args,
      instructions: [
        'Organize test plan per standard format (MIL-STD-810, etc.)',
        'Include executive summary and test objectives',
        'Document test matrix and traceability',
        'Include all test procedures',
        'Document instrumentation and fixture requirements',
        'Include schedule and resource plan',
        'Add risk assessment and mitigations',
        'Include appendices for supporting data'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['documentStructure', 'sections', 'appendices'],
      properties: {
        documentStructure: { type: 'object' },
        sections: { type: 'array', items: { type: 'object' } },
        appendices: { type: 'array', items: { type: 'object' } },
        revisionHistory: { type: 'array', items: { type: 'object' } },
        approvalSignatures: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

export default { process };

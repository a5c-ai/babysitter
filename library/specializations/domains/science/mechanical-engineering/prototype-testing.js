/**
 * @process prototype-testing
 * @description Prototype testing and test-analysis correlation - physical testing, model validation, and prediction refinement
 * @inputs {object} inputs
 * @inputs {string} inputs.projectId - Project identification
 * @inputs {object} inputs.prototype - Prototype specifications and instrumentation
 * @inputs {object} inputs.testPlan - Approved test plan
 * @inputs {object} inputs.analyticalModels - Predictions from analysis models
 * @inputs {object} inputs.requirements - Product requirements for pass/fail
 * @outputs {object} testResults - Correlated test results with model updates
 * @example
 * const result = await process({
 *   projectId: 'PT-2024-001',
 *   prototype: { serial: 'P001', instrumentation: [...] },
 *   testPlan: { procedures: [...], conditions: [...] },
 *   analyticalModels: { fea: {...}, cfd: {...} },
 *   requirements: { performance: [...], durability: [...] }
 * });
 * @references ASME V&V 10, AIAA Guide for Verification and Validation, NASA-STD-7009
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const artifacts = [];

  // Phase 1: Pre-Test Preparation
  const preTestPrep = await ctx.task(preTestPrepTask, {
    prototype: inputs.prototype,
    testPlan: inputs.testPlan,
    analyticalModels: inputs.analyticalModels
  });
  artifacts.push({ phase: 'pre-test-prep', data: preTestPrep });

  // Phase 2: Instrumentation Verification
  const instrumentVerification = await ctx.task(instrumentVerificationTask, {
    prototype: inputs.prototype,
    instrumentationPlan: inputs.testPlan.instrumentation
  });
  artifacts.push({ phase: 'instrument-verification', data: instrumentVerification });

  // Breakpoint: Pre-Test Readiness Review
  await ctx.breakpoint('pre-test-review', {
    question: 'Pre-test readiness review complete. Proceed with testing?',
    context: {
      instrumentationStatus: instrumentVerification.status,
      calibrationStatus: instrumentVerification.calibrationStatus,
      predictedResults: preTestPrep.predictions
    }
  });

  // Phase 3: Test Execution
  const testExecution = await ctx.task(testExecutionTask, {
    testPlan: inputs.testPlan,
    prototype: inputs.prototype,
    instrumentVerification: instrumentVerification
  });
  artifacts.push({ phase: 'test-execution', data: testExecution });

  // Phase 4: Data Processing and Reduction
  const dataProcessing = await ctx.task(dataProcessingTask, {
    rawData: testExecution.rawData,
    testConditions: testExecution.actualConditions,
    instrumentation: inputs.prototype.instrumentation
  });
  artifacts.push({ phase: 'data-processing', data: dataProcessing });

  // Phase 5: Test-Analysis Correlation
  const correlation = await ctx.task(correlationTask, {
    testResults: dataProcessing.processedResults,
    analyticalModels: inputs.analyticalModels,
    testConditions: testExecution.actualConditions
  });
  artifacts.push({ phase: 'correlation', data: correlation });

  // Phase 6: Discrepancy Investigation
  const discrepancyInvestigation = await ctx.task(discrepancyTask, {
    correlation: correlation,
    testResults: dataProcessing.processedResults,
    analyticalModels: inputs.analyticalModels
  });
  artifacts.push({ phase: 'discrepancy-investigation', data: discrepancyInvestigation });

  // Breakpoint: Correlation Review
  await ctx.breakpoint('correlation-review', {
    question: 'Review test-analysis correlation. Are model updates needed?',
    context: {
      correlationMetrics: correlation.metrics,
      discrepancies: discrepancyInvestigation.significantDiscrepancies,
      proposedUpdates: discrepancyInvestigation.modelUpdates
    }
  });

  // Phase 7: Model Update and Validation
  const modelUpdate = await ctx.task(modelUpdateTask, {
    analyticalModels: inputs.analyticalModels,
    discrepancyInvestigation: discrepancyInvestigation,
    correlation: correlation
  });
  artifacts.push({ phase: 'model-update', data: modelUpdate });

  // Phase 8: Requirements Verification Assessment
  const requirementsAssessment = await ctx.task(requirementsAssessmentTask, {
    testResults: dataProcessing.processedResults,
    requirements: inputs.requirements,
    correlation: correlation
  });
  artifacts.push({ phase: 'requirements-assessment', data: requirementsAssessment });

  // Phase 9: Test Report Generation
  const testReport = await ctx.task(testReportTask, {
    projectId: inputs.projectId,
    testExecution: testExecution,
    dataProcessing: dataProcessing,
    correlation: correlation,
    requirementsAssessment: requirementsAssessment
  });
  artifacts.push({ phase: 'test-report', data: testReport });

  // Final Breakpoint: Test Completion Review
  await ctx.breakpoint('test-completion', {
    question: 'Approve test report and results for release?',
    context: {
      requirementsStatus: requirementsAssessment.summary,
      correlationStatus: correlation.overallStatus,
      anomalies: testExecution.anomalies
    }
  });

  return {
    success: true,
    results: {
      projectId: inputs.projectId,
      testReport: testReport,
      processedResults: dataProcessing.processedResults,
      correlation: correlation,
      requirementsAssessment: requirementsAssessment,
      modelUpdates: modelUpdate,
      discrepancyFindings: discrepancyInvestigation
    },
    artifacts,
    metadata: {
      testsExecuted: testExecution.testsCompleted,
      requirementsPassed: requirementsAssessment.passedCount,
      requirementsFailed: requirementsAssessment.failedCount,
      correlationScore: correlation.overallScore
    }
  };
}

const preTestPrepTask = defineTask('pre-test-prep', (args) => ({
  kind: 'agent',
  title: 'Pre-Test Preparation and Prediction Generation',
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Test Engineer',
      task: 'Complete pre-test preparation and generate predictions',
      context: args,
      instructions: [
        'Verify prototype configuration matches test requirements',
        'Review instrumentation installation and routing',
        'Generate pre-test predictions from analytical models',
        'Define expected response ranges for each measurement',
        'Prepare test data sheets and checklists',
        'Verify safety systems and emergency procedures',
        'Complete pre-test inspection documentation',
        'Prepare data acquisition system configuration'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessChecklist', 'predictions', 'configuration'],
      properties: {
        readinessChecklist: { type: 'array', items: { type: 'object' } },
        predictions: { type: 'array', items: { type: 'object' } },
        configuration: { type: 'object' },
        safetyVerification: { type: 'object' },
        daqConfiguration: { type: 'object' }
      }
    }
  }
}));

const instrumentVerificationTask = defineTask('instrument-verification', (args) => ({
  kind: 'agent',
  title: 'Instrumentation Verification',
  agent: {
    name: 'instrumentation-engineer',
    prompt: {
      role: 'Instrumentation Engineer',
      task: 'Verify all instrumentation is installed and calibrated',
      context: args,
      instructions: [
        'Verify all sensors are properly installed per plan',
        'Check sensor wiring and connections',
        'Verify calibration status of all instruments',
        'Perform functional checks on each channel',
        'Verify data acquisition system communication',
        'Document any deviations from instrumentation plan',
        'Verify range and scale settings',
        'Check backup/redundant instrumentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'calibrationStatus', 'channelVerification'],
      properties: {
        status: { type: 'string' },
        calibrationStatus: { type: 'array', items: { type: 'object' } },
        channelVerification: { type: 'array', items: { type: 'object' } },
        deviations: { type: 'array', items: { type: 'object' } },
        functionalChecks: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const testExecutionTask = defineTask('test-execution', (args) => ({
  kind: 'agent',
  title: 'Test Execution',
  agent: {
    name: 'test-conductor',
    prompt: {
      role: 'Test Conductor',
      task: 'Execute test procedures and document results',
      context: args,
      instructions: [
        'Execute each test per approved procedures',
        'Monitor critical parameters during test',
        'Document actual test conditions',
        'Record any anomalies or deviations',
        'Complete hold point reviews as required',
        'Document test witness observations',
        'Capture raw data for all measurements',
        'Complete post-test inspection'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testsCompleted', 'rawData', 'actualConditions'],
      properties: {
        testsCompleted: { type: 'number' },
        rawData: { type: 'object' },
        actualConditions: { type: 'array', items: { type: 'object' } },
        anomalies: { type: 'array', items: { type: 'object' } },
        witnessObservations: { type: 'array', items: { type: 'string' } },
        postTestInspection: { type: 'object' }
      }
    }
  }
}));

const dataProcessingTask = defineTask('data-processing', (args) => ({
  kind: 'agent',
  title: 'Data Processing and Reduction',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Test Data Analyst',
      task: 'Process raw test data and compute derived quantities',
      context: args,
      instructions: [
        'Apply appropriate filtering to raw data',
        'Correct for sensor calibration factors',
        'Compute derived quantities per analysis plan',
        'Apply coordinate transformations as needed',
        'Calculate measurement uncertainties',
        'Identify and flag any anomalous data points',
        'Generate data summary statistics',
        'Create data visualizations for key parameters'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['processedResults', 'derivedQuantities', 'uncertainties'],
      properties: {
        processedResults: { type: 'object' },
        derivedQuantities: { type: 'array', items: { type: 'object' } },
        uncertainties: { type: 'object' },
        dataQuality: { type: 'object' },
        statistics: { type: 'object' }
      }
    }
  }
}));

const correlationTask = defineTask('correlation', (args) => ({
  kind: 'agent',
  title: 'Test-Analysis Correlation',
  agent: {
    name: 'correlation-analyst',
    prompt: {
      role: 'Test-Analysis Correlation Specialist',
      task: 'Correlate test results with analytical predictions',
      context: args,
      instructions: [
        'Compare test results to pre-test predictions',
        'Calculate correlation metrics (error, R-squared, etc.)',
        'Identify systematic vs random differences',
        'Assess correlation at each measurement location',
        'Evaluate correlation across test conditions',
        'Identify areas of good and poor correlation',
        'Assess impact of boundary condition assumptions',
        'Rate overall correlation quality'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'comparison', 'overallScore', 'overallStatus'],
      properties: {
        metrics: { type: 'object' },
        comparison: { type: 'array', items: { type: 'object' } },
        overallScore: { type: 'number' },
        overallStatus: { type: 'string' },
        correlationByLocation: { type: 'array', items: { type: 'object' } },
        correlationByCondition: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const discrepancyTask = defineTask('discrepancy-investigation', (args) => ({
  kind: 'agent',
  title: 'Discrepancy Investigation',
  agent: {
    name: 'analysis-engineer',
    prompt: {
      role: 'Analysis Engineer',
      task: 'Investigate and explain test-analysis discrepancies',
      context: args,
      instructions: [
        'Identify significant discrepancies exceeding criteria',
        'Investigate potential causes for each discrepancy',
        'Assess test setup factors (boundary conditions, loading)',
        'Assess model factors (mesh, material properties, assumptions)',
        'Assess measurement factors (uncertainty, installation)',
        'Propose model updates to improve correlation',
        'Prioritize discrepancies by impact on design margins',
        'Document investigation findings and conclusions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['significantDiscrepancies', 'rootCauses', 'modelUpdates'],
      properties: {
        significantDiscrepancies: { type: 'array', items: { type: 'object' } },
        rootCauses: { type: 'array', items: { type: 'object' } },
        modelUpdates: { type: 'array', items: { type: 'object' } },
        testFactors: { type: 'array', items: { type: 'object' } },
        modelFactors: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const modelUpdateTask = defineTask('model-update', (args) => ({
  kind: 'agent',
  title: 'Model Update and Validation',
  agent: {
    name: 'analysis-engineer',
    prompt: {
      role: 'Analysis Engineer',
      task: 'Update analytical models based on test correlation',
      context: args,
      instructions: [
        'Implement recommended model updates',
        'Update material properties if indicated',
        'Refine boundary condition assumptions',
        'Adjust mesh density in critical areas',
        'Update damping values from test data',
        'Rerun analysis with updated model',
        'Verify improved correlation with test data',
        'Document model version and changes'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedModels', 'changesImplemented', 'improvedCorrelation'],
      properties: {
        updatedModels: { type: 'array', items: { type: 'object' } },
        changesImplemented: { type: 'array', items: { type: 'object' } },
        improvedCorrelation: { type: 'object' },
        validationResults: { type: 'object' },
        modelVersion: { type: 'string' }
      }
    }
  }
}));

const requirementsAssessmentTask = defineTask('requirements-assessment', (args) => ({
  kind: 'agent',
  title: 'Requirements Verification Assessment',
  agent: {
    name: 'systems-engineer',
    prompt: {
      role: 'Systems Engineer',
      task: 'Assess requirements verification status from test results',
      context: args,
      instructions: [
        'Compare test results to requirement thresholds',
        'Document pass/fail status for each requirement',
        'Calculate margins for passed requirements',
        'Assess severity of any failures',
        'Identify requirements needing retest',
        'Document requirements verified by analysis',
        'Update requirements verification matrix',
        'Prepare verification status summary'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'passedCount', 'failedCount', 'requirementStatus'],
      properties: {
        summary: { type: 'object' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        requirementStatus: { type: 'array', items: { type: 'object' } },
        margins: { type: 'array', items: { type: 'object' } },
        retestRequired: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}));

const testReportTask = defineTask('test-report', (args) => ({
  kind: 'agent',
  title: 'Test Report Generation',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Test Report Writer',
      task: 'Generate comprehensive test report',
      context: args,
      instructions: [
        'Compile test report per standard format',
        'Include executive summary with key findings',
        'Document test setup and configuration',
        'Present data and results with visualizations',
        'Include test-analysis correlation summary',
        'Document any anomalies and investigations',
        'Present requirements verification status',
        'Include conclusions and recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['reportDocument', 'executiveSummary', 'conclusions'],
      properties: {
        reportDocument: { type: 'object' },
        executiveSummary: { type: 'string' },
        sections: { type: 'array', items: { type: 'object' } },
        conclusions: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        appendices: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

export default { process };

/**
 * @process specializations/domains/science/biomedical-engineering/dicom-interoperability
 * @description DICOM Integration and Interoperability - Implement DICOM compliance and healthcare
 * interoperability for medical imaging systems and software.
 * @inputs { systemName: string, serviceClasses: string[], iheProfiles: string[], integrationTargets: string[] }
 * @outputs { success: boolean, conformanceStatement: object, integrationTestReports: object, securityAssessment: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/dicom-interoperability', {
 *   systemName: 'PACS Workstation',
 *   serviceClasses: ['Storage SCU', 'Query/Retrieve SCU', 'Worklist SCU'],
 *   iheProfiles: ['SWF', 'PIR'],
 *   integrationTargets: ['Modalities', 'PACS', 'RIS']
 * });
 *
 * @references
 * - DICOM Standard: https://www.dicomstandard.org/
 * - IHE Radiology Technical Framework: https://www.ihe.net/
 * - HL7 FHIR: https://www.hl7.org/fhir/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    serviceClasses,
    iheProfiles,
    integrationTargets
  } = inputs;

  // Phase 1: DICOM Conformance Statement Development
  const conformanceStatement = await ctx.task(conformanceStatementTask, {
    systemName,
    serviceClasses
  });

  // Phase 2: Service Class Implementation
  const serviceClassImplementation = await ctx.task(serviceClassTask, {
    systemName,
    serviceClasses,
    conformanceStatement
  });

  // Phase 3: PACS Integration Testing
  const pacsIntegration = await ctx.task(pacsIntegrationTask, {
    systemName,
    serviceClassImplementation,
    integrationTargets
  });

  // Phase 4: IHE Profile Implementation
  const iheImplementation = await ctx.task(iheImplementationTask, {
    systemName,
    iheProfiles,
    serviceClassImplementation
  });

  // Breakpoint: Review integration testing
  await ctx.breakpoint({
    question: `Review DICOM integration testing for ${systemName}. Are all service classes functioning correctly?`,
    title: 'Integration Testing Review',
    context: {
      runId: ctx.runId,
      systemName,
      testResults: pacsIntegration.results,
      files: [{
        path: `artifacts/phase3-pacs-integration.json`,
        format: 'json',
        content: pacsIntegration
      }]
    }
  });

  // Phase 5: HL7/FHIR Integration
  const hl7FhirIntegration = await ctx.task(hl7FhirTask, {
    systemName,
    integrationTargets
  });

  // Phase 6: Interoperability Testing
  const interoperabilityTesting = await ctx.task(interoperabilityTestingTask, {
    systemName,
    pacsIntegration,
    iheImplementation,
    hl7FhirIntegration
  });

  // Phase 7: Cybersecurity Assessment
  const cybersecurityAssessment = await ctx.task(cybersecurityTask, {
    systemName,
    serviceClasses,
    integrationTargets
  });

  // Phase 8: Integration Documentation
  const integrationDocumentation = await ctx.task(integrationDocumentationTask, {
    systemName,
    serviceClasses,
    iheProfiles,
    conformanceStatement,
    serviceClassImplementation,
    pacsIntegration,
    iheImplementation,
    hl7FhirIntegration,
    interoperabilityTesting,
    cybersecurityAssessment
  });

  // Final Breakpoint: Integration Approval
  await ctx.breakpoint({
    question: `DICOM integration complete for ${systemName}. Interoperability: ${interoperabilityTesting.overallResult}. Approve for deployment?`,
    title: 'Integration Approval',
    context: {
      runId: ctx.runId,
      systemName,
      interoperabilityResult: interoperabilityTesting.overallResult,
      files: [
        { path: `artifacts/integration-documentation.json`, format: 'json', content: integrationDocumentation }
      ]
    }
  });

  return {
    success: true,
    systemName,
    conformanceStatement: conformanceStatement.statement,
    integrationTestReports: {
      pacs: pacsIntegration.report,
      ihe: iheImplementation.report,
      hl7: hl7FhirIntegration.report,
      interoperability: interoperabilityTesting.report
    },
    securityAssessment: cybersecurityAssessment.assessment,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/dicom-interoperability',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const conformanceStatementTask = defineTask('conformance-statement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Conformance Statement - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DICOM Integration Specialist',
      task: 'Develop DICOM Conformance Statement',
      context: {
        systemName: args.systemName,
        serviceClasses: args.serviceClasses
      },
      instructions: [
        '1. Document product implementation',
        '2. List supported service classes',
        '3. Document SOP classes',
        '4. Specify transfer syntaxes',
        '5. Document association policies',
        '6. Specify network configuration',
        '7. Document character set support',
        '8. List supported attributes',
        '9. Document extensions',
        '10. Create conformance statement'
      ],
      outputFormat: 'JSON object with conformance statement'
    },
    outputSchema: {
      type: 'object',
      required: ['statement', 'serviceClasses', 'sopClasses'],
      properties: {
        statement: { type: 'object' },
        serviceClasses: { type: 'array', items: { type: 'object' } },
        sopClasses: { type: 'array', items: { type: 'object' } },
        transferSyntaxes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dicom', 'conformance', 'interoperability']
}));

export const serviceClassTask = defineTask('service-class-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Service Class Implementation - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DICOM Developer',
      task: 'Implement DICOM service classes',
      context: {
        systemName: args.systemName,
        serviceClasses: args.serviceClasses,
        conformanceStatement: args.conformanceStatement
      },
      instructions: [
        '1. Implement Storage SCP/SCU',
        '2. Implement Query/Retrieve',
        '3. Implement Worklist Management',
        '4. Implement MPPS if required',
        '5. Implement Print if required',
        '6. Unit test implementations',
        '7. Test error handling',
        '8. Verify conformance',
        '9. Document implementation',
        '10. Create implementation report'
      ],
      outputFormat: 'JSON object with service class implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['implementations', 'testing', 'conformance'],
      properties: {
        implementations: { type: 'array', items: { type: 'object' } },
        testing: { type: 'object' },
        conformance: { type: 'object' },
        documentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dicom', 'implementation', 'service-class']
}));

export const pacsIntegrationTask = defineTask('pacs-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: PACS Integration - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Test Engineer',
      task: 'Test PACS integration',
      context: {
        systemName: args.systemName,
        serviceClassImplementation: args.serviceClassImplementation,
        integrationTargets: args.integrationTargets
      },
      instructions: [
        '1. Configure PACS connection',
        '2. Test C-STORE operations',
        '3. Test C-FIND operations',
        '4. Test C-MOVE operations',
        '5. Test error scenarios',
        '6. Verify data integrity',
        '7. Test performance',
        '8. Document test cases',
        '9. Log integration issues',
        '10. Create integration report'
      ],
      outputFormat: 'JSON object with PACS integration'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'report', 'issues'],
      properties: {
        results: { type: 'object' },
        report: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        performance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dicom', 'pacs', 'integration-testing']
}));

export const iheImplementationTask = defineTask('ihe-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: IHE Implementation - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'IHE Integration Specialist',
      task: 'Implement IHE profiles',
      context: {
        systemName: args.systemName,
        iheProfiles: args.iheProfiles,
        serviceClassImplementation: args.serviceClassImplementation
      },
      instructions: [
        '1. Review IHE Technical Framework',
        '2. Implement required actors',
        '3. Implement transactions',
        '4. Test profile compliance',
        '5. Conduct pre-connectathon testing',
        '6. Document implementation',
        '7. Create IHE integration statement',
        '8. Plan connectathon participation',
        '9. Address compliance gaps',
        '10. Create IHE report'
      ],
      outputFormat: 'JSON object with IHE implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'actors', 'report'],
      properties: {
        profiles: { type: 'array', items: { type: 'object' } },
        actors: { type: 'array', items: { type: 'object' } },
        report: { type: 'object' },
        integrationStatement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dicom', 'ihe', 'profiles']
}));

export const hl7FhirTask = defineTask('hl7-fhir-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: HL7/FHIR Integration - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Healthcare Integration Engineer',
      task: 'Implement HL7/FHIR integration',
      context: {
        systemName: args.systemName,
        integrationTargets: args.integrationTargets
      },
      instructions: [
        '1. Define integration requirements',
        '2. Implement HL7 v2 interfaces',
        '3. Implement FHIR resources',
        '4. Map data elements',
        '5. Test message exchange',
        '6. Validate data integrity',
        '7. Test error handling',
        '8. Document interfaces',
        '9. Create interface specifications',
        '10. Create integration report'
      ],
      outputFormat: 'JSON object with HL7/FHIR integration'
    },
    outputSchema: {
      type: 'object',
      required: ['interfaces', 'resources', 'report'],
      properties: {
        interfaces: { type: 'array', items: { type: 'object' } },
        resources: { type: 'array', items: { type: 'string' } },
        report: { type: 'object' },
        mappings: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hl7', 'fhir', 'interoperability']
}));

export const interoperabilityTestingTask = defineTask('interoperability-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Interoperability Testing - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interoperability Test Lead',
      task: 'Conduct comprehensive interoperability testing',
      context: {
        systemName: args.systemName,
        pacsIntegration: args.pacsIntegration,
        iheImplementation: args.iheImplementation,
        hl7FhirIntegration: args.hl7FhirIntegration
      },
      instructions: [
        '1. Define test scenarios',
        '2. Test end-to-end workflows',
        '3. Test with multiple vendors',
        '4. Verify data consistency',
        '5. Test failure recovery',
        '6. Performance testing',
        '7. Document test results',
        '8. Identify interoperability gaps',
        '9. Create test report',
        '10. Recommend improvements'
      ],
      outputFormat: 'JSON object with interoperability testing'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'overallResult', 'gaps'],
      properties: {
        report: { type: 'object' },
        overallResult: { type: 'string' },
        gaps: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dicom', 'interoperability', 'testing']
}));

export const cybersecurityTask = defineTask('cybersecurity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Cybersecurity Assessment - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Healthcare Cybersecurity Specialist',
      task: 'Assess cybersecurity of integration',
      context: {
        systemName: args.systemName,
        serviceClasses: args.serviceClasses,
        integrationTargets: args.integrationTargets
      },
      instructions: [
        '1. Assess network security',
        '2. Evaluate authentication',
        '3. Assess data encryption',
        '4. Review access controls',
        '5. Assess audit logging',
        '6. Evaluate TLS implementation',
        '7. Review HIPAA compliance',
        '8. Conduct vulnerability assessment',
        '9. Document security controls',
        '10. Create security assessment report'
      ],
      outputFormat: 'JSON object with cybersecurity assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'controls', 'vulnerabilities'],
      properties: {
        assessment: { type: 'object' },
        controls: { type: 'array', items: { type: 'object' } },
        vulnerabilities: { type: 'array', items: { type: 'object' } },
        compliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cybersecurity', 'dicom', 'hipaa']
}));

export const integrationDocumentationTask = defineTask('integration-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Documentation Manager',
      task: 'Compile integration documentation',
      context: {
        systemName: args.systemName,
        serviceClasses: args.serviceClasses,
        iheProfiles: args.iheProfiles,
        conformanceStatement: args.conformanceStatement,
        serviceClassImplementation: args.serviceClassImplementation,
        pacsIntegration: args.pacsIntegration,
        iheImplementation: args.iheImplementation,
        hl7FhirIntegration: args.hl7FhirIntegration,
        interoperabilityTesting: args.interoperabilityTesting,
        cybersecurityAssessment: args.cybersecurityAssessment
      },
      instructions: [
        '1. Compile conformance statement',
        '2. Document test reports',
        '3. Create deployment guide',
        '4. Document security configuration',
        '5. Create troubleshooting guide',
        '6. Document known issues',
        '7. Create user documentation',
        '8. Archive documentation',
        '9. Obtain approvals',
        '10. Create documentation package'
      ],
      outputFormat: 'JSON object with integration documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['conformanceStatement', 'testReports', 'deploymentGuide'],
      properties: {
        conformanceStatement: { type: 'object' },
        testReports: { type: 'object' },
        deploymentGuide: { type: 'object' },
        securityDocumentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dicom', 'documentation', 'interoperability']
}));

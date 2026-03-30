/**
 * @process specializations/domains/science/electrical-engineering/emc-design-testing
 * @description EMC Design and Pre-Compliance Testing - Guide the design for electromagnetic compatibility and
 * pre-compliance testing. Covers EMI mitigation, shielding, filtering, and measurement techniques.
 * @inputs { productName: string, emcRequirements: object, productType: string, targetMarkets?: array }
 * @outputs { success: boolean, designGuidelines: object, testResults: object, complianceStatus: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/emc-design-testing', {
 *   productName: 'Industrial IoT Gateway',
 *   emcRequirements: { emissionsClass: 'Class-A', immunityLevel: 'Industrial' },
 *   productType: 'ITE',
 *   targetMarkets: ['CE', 'FCC', 'China-CCC']
 * });
 *
 * @references
 * - CISPR 32 (Emissions for Multimedia Equipment)
 * - IEC 61000 (EMC Standards Series)
 * - FCC Part 15 (Radio Frequency Devices)
 * - CE Marking EMC Directive Requirements
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName,
    emcRequirements,
    productType,
    targetMarkets = ['CE', 'FCC']
  } = inputs;

  // Phase 1: Identify EMC Requirements and Applicable Standards
  const standardsIdentification = await ctx.task(standardsIdentificationTask, {
    productName,
    emcRequirements,
    productType,
    targetMarkets
  });

  // Phase 2: Apply EMC Design Rules to Schematic and Layout
  const emcDesignRules = await ctx.task(emcDesignRulesTask, {
    productName,
    standards: standardsIdentification.applicableStandards,
    productType
  });

  // Breakpoint: Review EMC design rules
  await ctx.breakpoint({
    question: `Review EMC design rules for ${productName}. ${emcDesignRules.ruleCount} rules defined. Proceed with filter design?`,
    title: 'EMC Design Rules Review',
    context: {
      runId: ctx.runId,
      productName,
      rules: emcDesignRules.rules,
      files: [{
        path: `artifacts/phase2-emc-rules.json`,
        format: 'json',
        content: emcDesignRules
      }]
    }
  });

  // Phase 3: Design Filtering and Suppression Circuits
  const filteringDesign = await ctx.task(filteringDesignTask, {
    productName,
    standards: standardsIdentification.applicableStandards,
    emcDesignRules: emcDesignRules.rules
  });

  // Phase 4: Implement Proper Grounding and Shielding
  const groundingShielding = await ctx.task(groundingShieldingTask, {
    productName,
    standards: standardsIdentification.applicableStandards,
    productType,
    filteringDesign
  });

  // Phase 5: Conduct Pre-Compliance Emissions Testing
  const emissionsTesting = await ctx.task(emissionsTestingTask, {
    productName,
    standards: standardsIdentification.emissionsStandards,
    designImplementation: { filters: filteringDesign, grounding: groundingShielding }
  });

  // Quality Gate: Emissions must pass pre-compliance
  if (!emissionsTesting.preCompliancePass) {
    await ctx.breakpoint({
      question: `Pre-compliance emissions testing found ${emissionsTesting.failures.length} frequencies exceeding limits. Debug and mitigate?`,
      title: 'Emissions Failures',
      context: {
        runId: ctx.runId,
        failures: emissionsTesting.failures,
        recommendations: emissionsTesting.mitigationRecommendations
      }
    });
  }

  // Phase 6: Perform Immunity Testing
  const immunityTesting = await ctx.task(immunityTestingTask, {
    productName,
    standards: standardsIdentification.immunityStandards,
    productType
  });

  // Breakpoint: Review immunity test results
  await ctx.breakpoint({
    question: `Immunity testing complete for ${productName}. ESD: ${immunityTesting.esdResult}, Surge: ${immunityTesting.surgeResult}. Review results?`,
    title: 'Immunity Testing Review',
    context: {
      runId: ctx.runId,
      results: immunityTesting.results,
      files: [{
        path: `artifacts/phase6-immunity.json`,
        format: 'json',
        content: immunityTesting
      }]
    }
  });

  // Phase 7: Debug and Mitigate EMC Issues
  const emcDebugging = await ctx.task(emcDebuggingTask, {
    productName,
    emissionsResults: emissionsTesting.results,
    immunityResults: immunityTesting.results,
    currentDesign: { filters: filteringDesign, grounding: groundingShielding }
  });

  // Phase 8: Document Compliance Test Results
  const complianceDocumentation = await ctx.task(complianceDocumentationTask, {
    productName,
    standardsIdentification,
    emcDesignRules,
    filteringDesign,
    groundingShielding,
    emissionsTesting,
    immunityTesting,
    emcDebugging,
    targetMarkets
  });

  // Final Breakpoint: Compliance Approval
  await ctx.breakpoint({
    question: `EMC design and testing complete for ${productName}. Pre-compliance: ${complianceDocumentation.overallStatus}. Ready for formal certification?`,
    title: 'Compliance Approval',
    context: {
      runId: ctx.runId,
      productName,
      complianceStatus: complianceDocumentation.status,
      files: [
        { path: `artifacts/emc-test-results.json`, format: 'json', content: complianceDocumentation.testSummary },
        { path: `artifacts/emc-report.md`, format: 'markdown', content: complianceDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    productName,
    designGuidelines: {
      rules: emcDesignRules.rules,
      filtering: filteringDesign,
      grounding: groundingShielding.guidelines
    },
    testResults: {
      emissions: emissionsTesting.results,
      immunity: immunityTesting.results
    },
    complianceStatus: complianceDocumentation.status,
    documentation: complianceDocumentation.document,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/emc-design-testing',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const standardsIdentificationTask = defineTask('standards-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Standards Identification - ${args.productName}`,
  agent: {
    name: 'emc-engineer',
    prompt: {
      role: 'EMC Regulatory Compliance Specialist',
      task: 'Identify EMC requirements and applicable standards',
      context: {
        productName: args.productName,
        emcRequirements: args.emcRequirements,
        productType: args.productType,
        targetMarkets: args.targetMarkets
      },
      instructions: [
        '1. Identify product category (ITE, industrial, automotive, etc.)',
        '2. Determine applicable emissions standards (CISPR, FCC)',
        '3. Determine applicable immunity standards (IEC 61000-4-x)',
        '4. Identify class limits (Class A vs. Class B)',
        '5. Document frequency ranges for testing',
        '6. Identify any product-specific standards',
        '7. Determine test levels for immunity',
        '8. Document certification requirements per market',
        '9. Identify harmonized standards if applicable',
        '10. Create standards compliance matrix'
      ],
      outputFormat: 'JSON object with applicable standards'
    },
    outputSchema: {
      type: 'object',
      required: ['applicableStandards', 'emissionsStandards', 'immunityStandards'],
      properties: {
        applicableStandards: { type: 'array', items: { type: 'object' } },
        emissionsStandards: { type: 'array', items: { type: 'object' } },
        immunityStandards: { type: 'array', items: { type: 'object' } },
        complianceMatrix: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'emc', 'standards', 'compliance']
}));

export const emcDesignRulesTask = defineTask('emc-design-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: EMC Design Rules - ${args.productName}`,
  agent: {
    name: 'emc-engineer',
    prompt: {
      role: 'EMC Design Engineer',
      task: 'Apply EMC design rules to schematic and layout',
      context: {
        productName: args.productName,
        standards: args.standards,
        productType: args.productType
      },
      instructions: [
        '1. Define clock and high-frequency routing rules',
        '2. Specify return path requirements',
        '3. Define PCB layer stack-up for EMC',
        '4. Specify component placement guidelines',
        '5. Define connector and I/O interface rules',
        '6. Specify power supply decoupling requirements',
        '7. Define split plane and stitching rules',
        '8. Specify cable routing and shielding',
        '9. Define edge rate control requirements',
        '10. Document all EMC design rules'
      ],
      outputFormat: 'JSON object with EMC design rules'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'ruleCount'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              rule: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        ruleCount: { type: 'number' },
        layoutGuidelines: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'emc', 'design-rules']
}));

export const filteringDesignTask = defineTask('filtering-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Filtering Design - ${args.productName}`,
  agent: {
    name: 'emc-engineer',
    prompt: {
      role: 'EMI Filter Design Engineer',
      task: 'Design filtering and suppression circuits',
      context: {
        productName: args.productName,
        standards: args.standards,
        emcDesignRules: args.emcDesignRules
      },
      instructions: [
        '1. Design AC mains EMI filter',
        '2. Design DC power input filtering',
        '3. Design I/O connector filtering',
        '4. Select common-mode chokes',
        '5. Select X and Y capacitors',
        '6. Design TVS/varistor protection',
        '7. Design ferrite bead filtering',
        '8. Design LC filters for power supplies',
        '9. Specify filter insertion loss requirements',
        '10. Document filter designs and BOM'
      ],
      outputFormat: 'JSON object with filtering designs'
    },
    outputSchema: {
      type: 'object',
      required: ['filters'],
      properties: {
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              type: { type: 'string' },
              components: { type: 'array', items: { type: 'object' } },
              insertionLoss: { type: 'string' }
            }
          }
        },
        suppressionDevices: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'emc', 'filtering']
}));

export const groundingShieldingTask = defineTask('grounding-shielding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Grounding and Shielding - ${args.productName}`,
  agent: {
    name: 'emc-engineer',
    prompt: {
      role: 'EMC Grounding and Shielding Specialist',
      task: 'Implement proper grounding and shielding',
      context: {
        productName: args.productName,
        standards: args.standards,
        productType: args.productType,
        filteringDesign: args.filteringDesign
      },
      instructions: [
        '1. Design system grounding architecture',
        '2. Plan PCB ground planes and splits',
        '3. Design chassis/enclosure grounding',
        '4. Specify cable shield termination',
        '5. Design enclosure shielding if needed',
        '6. Plan gasket and seam treatment',
        '7. Design aperture shielding',
        '8. Specify ground connections for I/O',
        '9. Plan ESD ground paths',
        '10. Document grounding scheme'
      ],
      outputFormat: 'JSON object with grounding and shielding design'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines'],
      properties: {
        guidelines: {
          type: 'object',
          properties: {
            groundingArchitecture: { type: 'string' },
            pcbGrounding: { type: 'object' },
            chassisGrounding: { type: 'object' },
            cableShielding: { type: 'object' },
            enclosureShielding: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'emc', 'grounding', 'shielding']
}));

export const emissionsTestingTask = defineTask('emissions-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Emissions Testing - ${args.productName}`,
  agent: {
    name: 'emc-engineer',
    prompt: {
      role: 'EMC Test Engineer',
      task: 'Conduct pre-compliance emissions testing',
      context: {
        productName: args.productName,
        standards: args.standards,
        designImplementation: args.designImplementation
      },
      instructions: [
        '1. Set up pre-compliance test environment',
        '2. Configure LISN for conducted emissions',
        '3. Perform conducted emissions measurement',
        '4. Perform radiated emissions measurement',
        '5. Compare results to applicable limits',
        '6. Identify frequencies exceeding limits',
        '7. Perform diagnostic scans to locate sources',
        '8. Test in different operating modes',
        '9. Document test setup and conditions',
        '10. Provide mitigation recommendations'
      ],
      outputFormat: 'JSON object with emissions test results'
    },
    outputSchema: {
      type: 'object',
      required: ['preCompliancePass', 'results'],
      properties: {
        preCompliancePass: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            conductedEmissions: { type: 'object' },
            radiatedEmissions: { type: 'object' }
          }
        },
        failures: { type: 'array', items: { type: 'object' } },
        mitigationRecommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'emc', 'emissions', 'testing']
}));

export const immunityTestingTask = defineTask('immunity-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Immunity Testing - ${args.productName}`,
  agent: {
    name: 'emc-engineer',
    prompt: {
      role: 'EMC Immunity Test Engineer',
      task: 'Perform immunity testing (ESD, surge, RF)',
      context: {
        productName: args.productName,
        standards: args.standards,
        productType: args.productType
      },
      instructions: [
        '1. Perform ESD testing (contact and air discharge)',
        '2. Perform surge testing (line-to-line, line-to-ground)',
        '3. Perform EFT/burst testing',
        '4. Perform conducted RF immunity testing',
        '5. Perform radiated RF immunity testing',
        '6. Perform power frequency magnetic field test',
        '7. Perform voltage dips and interruptions test',
        '8. Document pass/fail criteria per standard',
        '9. Record any failures or anomalies',
        '10. Provide hardening recommendations'
      ],
      outputFormat: 'JSON object with immunity test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'esdResult', 'surgeResult'],
      properties: {
        results: {
          type: 'object',
          properties: {
            esd: { type: 'object' },
            surge: { type: 'object' },
            eftBurst: { type: 'object' },
            conductedRf: { type: 'object' },
            radiatedRf: { type: 'object' },
            powerDips: { type: 'object' }
          }
        },
        esdResult: { type: 'string' },
        surgeResult: { type: 'string' },
        failures: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'emc', 'immunity', 'testing']
}));

export const emcDebuggingTask = defineTask('emc-debugging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: EMC Debugging - ${args.productName}`,
  agent: {
    name: 'emc-engineer',
    prompt: {
      role: 'EMC Debug Specialist',
      task: 'Debug and mitigate EMC issues',
      context: {
        productName: args.productName,
        emissionsResults: args.emissionsResults,
        immunityResults: args.immunityResults,
        currentDesign: args.currentDesign
      },
      instructions: [
        '1. Analyze emissions failure frequencies',
        '2. Use near-field probing to locate sources',
        '3. Correlate emissions with circuit activity',
        '4. Implement filtering fixes',
        '5. Add/modify shielding',
        '6. Analyze immunity failure modes',
        '7. Implement ESD hardening',
        '8. Implement surge protection',
        '9. Verify fixes with retest',
        '10. Document all fixes and their effectiveness'
      ],
      outputFormat: 'JSON object with debugging results and fixes'
    },
    outputSchema: {
      type: 'object',
      required: ['fixes'],
      properties: {
        fixes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              rootCause: { type: 'string' },
              fix: { type: 'string' },
              effectiveness: { type: 'string' }
            }
          }
        },
        retestResults: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'emc', 'debugging']
}));

export const complianceDocumentationTask = defineTask('compliance-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Compliance Documentation - ${args.productName}`,
  agent: {
    name: 'emc-engineer',
    prompt: {
      role: 'EMC Compliance Documentation Specialist',
      task: 'Document compliance test results',
      context: {
        productName: args.productName,
        standardsIdentification: args.standardsIdentification,
        emcDesignRules: args.emcDesignRules,
        filteringDesign: args.filteringDesign,
        groundingShielding: args.groundingShielding,
        emissionsTesting: args.emissionsTesting,
        immunityTesting: args.immunityTesting,
        emcDebugging: args.emcDebugging,
        targetMarkets: args.targetMarkets
      },
      instructions: [
        '1. Compile test configuration documentation',
        '2. Document test equipment and calibration',
        '3. Create emissions test report',
        '4. Create immunity test report',
        '5. Document design features for compliance',
        '6. Create technical construction file (TCF)',
        '7. Generate compliance matrix',
        '8. Document any non-compliances and mitigations',
        '9. Prepare for formal certification',
        '10. Create comprehensive EMC report'
      ],
      outputFormat: 'JSON object with compliance documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'document', 'overallStatus'],
      properties: {
        status: {
          type: 'object',
          properties: {
            emissions: { type: 'string' },
            immunity: { type: 'string' },
            overall: { type: 'string' }
          }
        },
        overallStatus: { type: 'string' },
        document: {
          type: 'object',
          properties: {
            testReports: { type: 'array', items: { type: 'object' } },
            complianceMatrix: { type: 'object' },
            tcf: { type: 'object' }
          }
        },
        testSummary: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'emc', 'compliance', 'documentation']
}));

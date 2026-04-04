/**
 * @process specializations/domains/science/automotive-engineering/cybersecurity-engineering
 * @description Cybersecurity Engineering (ISO/SAE 21434) - Implement automotive cybersecurity engineering
 * per ISO/SAE 21434 including threat analysis, security architecture, and vulnerability management.
 * @inputs { itemName: string, itemDescription: string, connectivityFeatures: string[], existingTara?: object }
 * @outputs { success: boolean, tara: object, cybersecurityConcept: object, securityTestReports: object, incidentResponsePlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/cybersecurity-engineering', {
 *   itemName: 'Connected-Vehicle-Gateway',
 *   itemDescription: 'Central gateway ECU with connectivity to telematics, OBD, and in-vehicle networks',
 *   connectivityFeatures: ['cellular', 'wifi', 'bluetooth', 'OBD-II', 'CAN'],
 *   existingTara: null
 * });
 *
 * @references
 * - ISO/SAE 21434:2021 Road Vehicles Cybersecurity Engineering
 * - UN ECE R155 Cybersecurity and CSMS
 * - UN ECE R156 Software Update Management
 * - SAE J3061 Cybersecurity Guidebook
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    itemName,
    itemDescription,
    connectivityFeatures = [],
    existingTara = null
  } = inputs;

  // Phase 1: Item Definition for Cybersecurity
  const csItemDefinition = await ctx.task(csItemDefinitionTask, {
    itemName,
    itemDescription,
    connectivityFeatures
  });

  // Quality Gate: Item definition complete
  if (!csItemDefinition.definition) {
    return {
      success: false,
      error: 'Cybersecurity item definition incomplete',
      phase: 'item-definition',
      tara: null
    };
  }

  // Phase 2: Threat Analysis and Risk Assessment (TARA)
  const tara = await ctx.task(taraTask, {
    itemName,
    csItemDefinition,
    connectivityFeatures,
    existingTara
  });

  // Breakpoint: TARA review
  await ctx.breakpoint({
    question: `Review TARA for ${itemName}. ${tara.threats?.length || 0} threats identified. Approve TARA?`,
    title: 'TARA Review',
    context: {
      runId: ctx.runId,
      itemName,
      tara,
      files: [{
        path: `artifacts/tara.json`,
        format: 'json',
        content: tara
      }]
    }
  });

  // Phase 3: Cybersecurity Goals and Requirements
  const csRequirements = await ctx.task(csRequirementsTask, {
    itemName,
    tara,
    csItemDefinition
  });

  // Phase 4: Cybersecurity Architecture Design
  const csArchitecture = await ctx.task(csArchitectureTask, {
    itemName,
    tara,
    csRequirements
  });

  // Breakpoint: Architecture review
  await ctx.breakpoint({
    question: `Review cybersecurity architecture for ${itemName}. ${csArchitecture.countermeasures?.length || 0} countermeasures defined. Approve architecture?`,
    title: 'Cybersecurity Architecture Review',
    context: {
      runId: ctx.runId,
      itemName,
      csArchitecture,
      files: [{
        path: `artifacts/cs-architecture.json`,
        format: 'json',
        content: csArchitecture
      }]
    }
  });

  // Phase 5: Countermeasure Implementation
  const countermeasureImpl = await ctx.task(countermeasureImplTask, {
    itemName,
    csArchitecture,
    csRequirements
  });

  // Phase 6: Security Testing
  const securityTesting = await ctx.task(securityTestingTask, {
    itemName,
    csArchitecture,
    countermeasureImpl,
    tara
  });

  // Quality Gate: Security test results
  if (securityTesting.vulnerabilities && securityTesting.vulnerabilities.length > 0) {
    await ctx.breakpoint({
      question: `Security testing identified ${securityTesting.vulnerabilities.length} vulnerabilities. Review and approve remediation plan?`,
      title: 'Security Vulnerabilities Found',
      context: {
        runId: ctx.runId,
        securityTesting,
        recommendation: 'Address all critical and high vulnerabilities before production'
      }
    });
  }

  // Phase 7: Vulnerability Management
  const vulnManagement = await ctx.task(vulnManagementTask, {
    itemName,
    securityTesting,
    csArchitecture
  });

  // Phase 8: Incident Response Planning
  const incidentResponse = await ctx.task(incidentResponseTask, {
    itemName,
    tara,
    csArchitecture,
    vulnManagement
  });

  // Final Breakpoint: Cybersecurity approval
  await ctx.breakpoint({
    question: `Cybersecurity Engineering complete for ${itemName}. UN R155 compliance: ${incidentResponse.r155Compliance}. Approve for production?`,
    title: 'Cybersecurity Approval',
    context: {
      runId: ctx.runId,
      itemName,
      securitySummary: incidentResponse.summary,
      files: [
        { path: `artifacts/tara-final.json`, format: 'json', content: tara },
        { path: `artifacts/security-test-reports.json`, format: 'json', content: securityTesting }
      ]
    }
  });

  return {
    success: true,
    itemName,
    tara: tara.analysis,
    cybersecurityConcept: csArchitecture.concept,
    securityTestReports: securityTesting.reports,
    incidentResponsePlan: incidentResponse.plan,
    vulnerabilityManagement: vulnManagement.process,
    r155Compliance: incidentResponse.r155Compliance,
    nextSteps: incidentResponse.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/cybersecurity-engineering',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const csItemDefinitionTask = defineTask('cs-item-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Item Definition for Cybersecurity - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Automotive Cybersecurity Engineer',
      task: 'Define item for cybersecurity analysis per ISO/SAE 21434',
      context: {
        itemName: args.itemName,
        itemDescription: args.itemDescription,
        connectivityFeatures: args.connectivityFeatures
      },
      instructions: [
        '1. Define item functionality and purpose',
        '2. Identify item boundaries',
        '3. Document connectivity interfaces',
        '4. Identify data assets and flows',
        '5. Document trust boundaries',
        '6. Identify stakeholders and interactions',
        '7. Document operational environment',
        '8. Identify regulatory requirements',
        '9. Document assumptions',
        '10. Create item architecture diagram'
      ],
      outputFormat: 'JSON object with cybersecurity item definition'
    },
    outputSchema: {
      type: 'object',
      required: ['definition', 'assets', 'trustBoundaries'],
      properties: {
        definition: {
          type: 'object',
          properties: {
            functionality: { type: 'string' },
            boundaries: { type: 'array', items: { type: 'string' } },
            interfaces: { type: 'array', items: { type: 'object' } }
          }
        },
        assets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              sensitivity: { type: 'string' }
            }
          }
        },
        trustBoundaries: { type: 'array', items: { type: 'object' } },
        dataFlows: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'cybersecurity', 'ISO21434', 'item-definition']
}));

export const taraTask = defineTask('tara', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Threat Analysis and Risk Assessment - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Automotive Threat Analyst',
      task: 'Conduct TARA per ISO/SAE 21434',
      context: {
        itemName: args.itemName,
        csItemDefinition: args.csItemDefinition,
        connectivityFeatures: args.connectivityFeatures,
        existingTara: args.existingTara
      },
      instructions: [
        '1. Identify threat scenarios',
        '2. Assess impact (safety, financial, operational, privacy)',
        '3. Assess attack feasibility (CVSS-based)',
        '4. Calculate risk values',
        '5. Determine risk treatment decisions',
        '6. Identify attack paths',
        '7. Apply STRIDE methodology',
        '8. Document threat scenarios',
        '9. Prioritize threats for mitigation',
        '10. Document TARA rationale'
      ],
      outputFormat: 'JSON object with TARA results'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'threats', 'riskTreatment'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            methodology: { type: 'string' },
            scope: { type: 'string' },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        threats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              attackPath: { type: 'string' },
              impactRating: { type: 'object' },
              feasibilityRating: { type: 'object' },
              riskValue: { type: 'number' }
            }
          }
        },
        riskTreatment: { type: 'array', items: { type: 'object' } },
        attackTrees: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'cybersecurity', 'TARA', 'threat-analysis']
}));

export const csRequirementsTask = defineTask('cs-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Cybersecurity Goals and Requirements - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cybersecurity Requirements Engineer',
      task: 'Define cybersecurity goals and requirements',
      context: {
        itemName: args.itemName,
        tara: args.tara,
        csItemDefinition: args.csItemDefinition
      },
      instructions: [
        '1. Define cybersecurity goals from TARA',
        '2. Derive cybersecurity requirements',
        '3. Specify security controls required',
        '4. Define cryptographic requirements',
        '5. Specify authentication requirements',
        '6. Define authorization requirements',
        '7. Specify secure communication requirements',
        '8. Define logging and monitoring requirements',
        '9. Establish CAL (Cybersecurity Assurance Level)',
        '10. Document requirements traceability'
      ],
      outputFormat: 'JSON object with cybersecurity requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['goals', 'requirements', 'cal'],
      properties: {
        goals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              derivedFromThreats: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              derivedFromGoal: { type: 'string' },
              cal: { type: 'number' }
            }
          }
        },
        cal: { type: 'object' },
        traceability: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'cybersecurity', 'requirements', 'goals']
}));

export const csArchitectureTask = defineTask('cs-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Cybersecurity Architecture Design - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cybersecurity Architect',
      task: 'Design cybersecurity architecture and countermeasures',
      context: {
        itemName: args.itemName,
        tara: args.tara,
        csRequirements: args.csRequirements
      },
      instructions: [
        '1. Design secure architecture',
        '2. Define countermeasures for each threat',
        '3. Specify cryptographic mechanisms',
        '4. Design authentication/authorization',
        '5. Design secure boot and firmware protection',
        '6. Design intrusion detection mechanisms',
        '7. Design secure communication protocols',
        '8. Define key management architecture',
        '9. Design secure OTA update mechanism',
        '10. Document security architecture rationale'
      ],
      outputFormat: 'JSON object with cybersecurity architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['concept', 'countermeasures', 'architecture'],
      properties: {
        concept: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            principles: { type: 'array', items: { type: 'string' } },
            layers: { type: 'array', items: { type: 'object' } }
          }
        },
        countermeasures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              threatId: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              effectiveness: { type: 'string' }
            }
          }
        },
        architecture: {
          type: 'object',
          properties: {
            crypto: { type: 'object' },
            authentication: { type: 'object' },
            secureBoot: { type: 'object' },
            ids: { type: 'object' },
            keyManagement: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'cybersecurity', 'architecture', 'design']
}));

export const countermeasureImplTask = defineTask('countermeasure-impl', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Countermeasure Implementation - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Implementation Engineer',
      task: 'Implement cybersecurity countermeasures',
      context: {
        itemName: args.itemName,
        csArchitecture: args.csArchitecture,
        csRequirements: args.csRequirements
      },
      instructions: [
        '1. Implement cryptographic functions',
        '2. Implement secure boot chain',
        '3. Implement authentication mechanisms',
        '4. Implement access control',
        '5. Implement secure communication',
        '6. Implement intrusion detection',
        '7. Implement security logging',
        '8. Implement key storage and management',
        '9. Apply secure coding practices',
        '10. Document implementation specifications'
      ],
      outputFormat: 'JSON object with countermeasure implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'status', 'specifications'],
      properties: {
        implementation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              countermeasureId: { type: 'string' },
              status: { type: 'string' },
              component: { type: 'string' },
              technology: { type: 'string' }
            }
          }
        },
        status: { type: 'object' },
        specifications: { type: 'object' },
        secureCodingCompliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'cybersecurity', 'implementation', 'countermeasures']
}));

export const securityTestingTask = defineTask('security-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Security Testing - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Test Engineer',
      task: 'Execute security testing and penetration testing',
      context: {
        itemName: args.itemName,
        csArchitecture: args.csArchitecture,
        countermeasureImpl: args.countermeasureImpl,
        tara: args.tara
      },
      instructions: [
        '1. Execute vulnerability scanning',
        '2. Perform static code analysis (SAST)',
        '3. Perform dynamic application testing (DAST)',
        '4. Execute penetration testing',
        '5. Test cryptographic implementations',
        '6. Test authentication mechanisms',
        '7. Test secure boot chain',
        '8. Test intrusion detection',
        '9. Fuzz testing on interfaces',
        '10. Document test results and findings'
      ],
      outputFormat: 'JSON object with security test results'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'vulnerabilities', 'testCoverage'],
      properties: {
        reports: {
          type: 'object',
          properties: {
            vulnerabilityScan: { type: 'object' },
            sast: { type: 'object' },
            dast: { type: 'object' },
            penetrationTest: { type: 'object' },
            fuzzTest: { type: 'object' }
          }
        },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              cwe: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        testCoverage: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'cybersecurity', 'testing', 'penetration-testing']
}));

export const vulnManagementTask = defineTask('vuln-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Vulnerability Management - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vulnerability Management Engineer',
      task: 'Establish vulnerability management process',
      context: {
        itemName: args.itemName,
        securityTesting: args.securityTesting,
        csArchitecture: args.csArchitecture
      },
      instructions: [
        '1. Define vulnerability monitoring process',
        '2. Establish vulnerability tracking',
        '3. Define severity classification',
        '4. Establish remediation timelines',
        '5. Define patch management process',
        '6. Establish security advisory process',
        '7. Define coordination with suppliers',
        '8. Establish CVE monitoring',
        '9. Define vulnerability disclosure process',
        '10. Document vulnerability management procedures'
      ],
      outputFormat: 'JSON object with vulnerability management'
    },
    outputSchema: {
      type: 'object',
      required: ['process', 'tracking', 'procedures'],
      properties: {
        process: {
          type: 'object',
          properties: {
            monitoring: { type: 'object' },
            classification: { type: 'object' },
            remediation: { type: 'object' },
            patchManagement: { type: 'object' }
          }
        },
        tracking: { type: 'object' },
        procedures: { type: 'array', items: { type: 'object' } },
        supplierCoordination: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'cybersecurity', 'vulnerability', 'management']
}));

export const incidentResponseTask = defineTask('incident-response', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Incident Response Planning - ${args.itemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cybersecurity Incident Response Engineer',
      task: 'Develop incident response plan',
      context: {
        itemName: args.itemName,
        tara: args.tara,
        csArchitecture: args.csArchitecture,
        vulnManagement: args.vulnManagement
      },
      instructions: [
        '1. Define incident detection mechanisms',
        '2. Establish incident classification',
        '3. Define response procedures',
        '4. Establish escalation paths',
        '5. Define communication procedures',
        '6. Plan for forensic analysis',
        '7. Define recovery procedures',
        '8. Establish lessons learned process',
        '9. Document UN R155 compliance',
        '10. Create incident response playbooks'
      ],
      outputFormat: 'JSON object with incident response plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'r155Compliance', 'summary'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            detection: { type: 'object' },
            classification: { type: 'object' },
            response: { type: 'array', items: { type: 'object' } },
            escalation: { type: 'object' },
            recovery: { type: 'object' }
          }
        },
        r155Compliance: { type: 'string' },
        summary: { type: 'object' },
        nextSteps: { type: 'array', items: { type: 'object' } },
        playbooks: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'cybersecurity', 'incident-response', 'UN-R155']
}));

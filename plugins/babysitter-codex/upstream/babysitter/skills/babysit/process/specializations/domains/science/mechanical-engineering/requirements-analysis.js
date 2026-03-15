/**
 * @process specializations/domains/science/mechanical-engineering/requirements-analysis
 * @description Requirements Analysis and Flow-Down - Systematic capture and decomposition of functional,
 * performance, and constraint requirements from stakeholders, including environmental conditions,
 * applicable codes/standards, and design targets documented in a requirements management system.
 * @inputs { projectName: string, systemDescription: string, stakeholders?: string[], standards?: string[], environmentalConditions?: string }
 * @outputs { success: boolean, requirementsDocument: object, traceabilityMatrix: object, complianceChecklist: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/requirements-analysis', {
 *   projectName: 'Industrial Pump System',
 *   systemDescription: 'High-pressure centrifugal pump for chemical processing',
 *   stakeholders: ['Process Engineer', 'Maintenance Manager', 'Safety Officer'],
 *   standards: ['ASME B73.1', 'API 610'],
 *   environmentalConditions: 'Corrosive environment, 40-120F ambient temperature'
 * });
 *
 * @references
 * - ASME Codes and Standards: https://www.asme.org/codes-standards
 * - INCOSE Systems Engineering Handbook: https://www.incose.org/products-and-publications/se-handbook
 * - NASA Systems Engineering Handbook: https://www.nasa.gov/seh/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    systemDescription,
    stakeholders = [],
    standards = [],
    environmentalConditions = ''
  } = inputs;

  // Phase 1: Stakeholder Needs Identification
  const stakeholderNeeds = await ctx.task(stakeholderNeedsTask, {
    projectName,
    systemDescription,
    stakeholders
  });

  // Quality Gate: Stakeholder needs must be captured
  if (!stakeholderNeeds.needs || stakeholderNeeds.needs.length === 0) {
    return {
      success: false,
      error: 'Stakeholder needs not adequately captured',
      phase: 'stakeholder-needs',
      requirementsDocument: null
    };
  }

  // Breakpoint: Review stakeholder needs
  await ctx.breakpoint({
    question: `Review captured stakeholder needs for ${projectName}. Are all key stakeholders represented?`,
    title: 'Stakeholder Needs Review',
    context: {
      runId: ctx.runId,
      projectName,
      stakeholderNeeds: stakeholderNeeds.needs,
      files: [{
        path: `artifacts/phase1-stakeholder-needs.json`,
        format: 'json',
        content: stakeholderNeeds
      }]
    }
  });

  // Phase 2: Functional Requirements Derivation
  const functionalRequirements = await ctx.task(functionalRequirementsTask, {
    projectName,
    systemDescription,
    stakeholderNeeds: stakeholderNeeds.needs
  });

  // Phase 3: Performance Requirements Definition
  const performanceRequirements = await ctx.task(performanceRequirementsTask, {
    projectName,
    systemDescription,
    functionalRequirements: functionalRequirements.requirements,
    environmentalConditions
  });

  // Phase 4: Standards and Codes Analysis
  const standardsAnalysis = await ctx.task(standardsAnalysisTask, {
    projectName,
    systemDescription,
    standards,
    functionalRequirements: functionalRequirements.requirements
  });

  // Phase 5: Environmental and Interface Requirements
  const environmentalRequirements = await ctx.task(environmentalRequirementsTask, {
    projectName,
    systemDescription,
    environmentalConditions,
    standardsAnalysis: standardsAnalysis.applicableStandards
  });

  // Phase 6: Constraint Requirements Definition
  const constraintRequirements = await ctx.task(constraintRequirementsTask, {
    projectName,
    stakeholderNeeds: stakeholderNeeds.needs,
    standardsAnalysis: standardsAnalysis.applicableStandards,
    environmentalRequirements: environmentalRequirements.requirements
  });

  // Phase 7: Requirements Flow-Down and Decomposition
  const requirementsFlowDown = await ctx.task(requirementsFlowDownTask, {
    projectName,
    functionalRequirements: functionalRequirements.requirements,
    performanceRequirements: performanceRequirements.requirements,
    constraintRequirements: constraintRequirements.requirements
  });

  // Phase 8: Traceability Matrix Development
  const traceabilityMatrix = await ctx.task(traceabilityMatrixTask, {
    projectName,
    stakeholderNeeds: stakeholderNeeds.needs,
    functionalRequirements: functionalRequirements.requirements,
    performanceRequirements: performanceRequirements.requirements,
    constraintRequirements: constraintRequirements.requirements,
    flowDown: requirementsFlowDown.decomposition
  });

  // Phase 9: Verification Requirements Definition
  const verificationRequirements = await ctx.task(verificationRequirementsTask, {
    projectName,
    functionalRequirements: functionalRequirements.requirements,
    performanceRequirements: performanceRequirements.requirements,
    standardsAnalysis: standardsAnalysis.applicableStandards
  });

  // Phase 10: Requirements Document Generation
  const requirementsDocument = await ctx.task(requirementsDocumentTask, {
    projectName,
    systemDescription,
    stakeholderNeeds,
    functionalRequirements,
    performanceRequirements,
    standardsAnalysis,
    environmentalRequirements,
    constraintRequirements,
    requirementsFlowDown,
    traceabilityMatrix,
    verificationRequirements,
    stakeholders
  });

  // Final Breakpoint: Requirements Approval
  await ctx.breakpoint({
    question: `Requirements Analysis Complete for ${projectName}. Review and approve the requirements document?`,
    title: 'Requirements Approval',
    context: {
      runId: ctx.runId,
      projectName,
      totalRequirements: requirementsDocument.summary.totalRequirements,
      files: [
        { path: `artifacts/requirements-document.json`, format: 'json', content: requirementsDocument },
        { path: `artifacts/requirements-document.md`, format: 'markdown', content: requirementsDocument.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    requirementsDocument: requirementsDocument.document,
    traceabilityMatrix: traceabilityMatrix.matrix,
    complianceChecklist: standardsAnalysis.complianceChecklist,
    summary: {
      totalRequirements: requirementsDocument.summary.totalRequirements,
      functionalCount: functionalRequirements.requirements.length,
      performanceCount: performanceRequirements.requirements.length,
      constraintCount: constraintRequirements.requirements.length,
      applicableStandards: standardsAnalysis.applicableStandards.length
    },
    verificationPlan: verificationRequirements.verificationPlan,
    nextSteps: requirementsDocument.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/requirements-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const stakeholderNeedsTask = defineTask('stakeholder-needs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Stakeholder Needs Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Systems Engineer with expertise in requirements elicitation',
      task: 'Identify and document stakeholder needs for the mechanical engineering project',
      context: {
        projectName: args.projectName,
        systemDescription: args.systemDescription,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Identify all stakeholder groups (users, operators, maintainers, regulators, etc.)',
        '2. Elicit needs from each stakeholder group using structured techniques',
        '3. Document needs in clear, unambiguous language',
        '4. Categorize needs by stakeholder priority and criticality',
        '5. Identify conflicting needs and document resolution strategies',
        '6. Document assumptions and constraints from stakeholders',
        '7. Capture operational scenarios and use cases',
        '8. Identify lifecycle considerations (installation, operation, maintenance, disposal)',
        '9. Document safety and regulatory needs',
        '10. Prioritize needs using MoSCoW or similar methodology'
      ],
      outputFormat: 'JSON object with structured stakeholder needs'
    },
    outputSchema: {
      type: 'object',
      required: ['needs', 'stakeholderGroups'],
      properties: {
        stakeholderGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              interests: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        needs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              needId: { type: 'string' },
              stakeholder: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'could-have', 'wont-have'] },
              rationale: { type: 'string' }
            }
          }
        },
        conflicts: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'requirements', 'stakeholder-needs']
}));

export const functionalRequirementsTask = defineTask('functional-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Functional Requirements Derivation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mechanical Systems Engineer with expertise in functional analysis',
      task: 'Derive functional requirements from stakeholder needs',
      context: {
        projectName: args.projectName,
        systemDescription: args.systemDescription,
        stakeholderNeeds: args.stakeholderNeeds
      },
      instructions: [
        '1. Transform stakeholder needs into measurable functional requirements',
        '2. Use functional decomposition to identify all system functions',
        '3. Document input/output relationships for each function',
        '4. Specify functional modes and states',
        '5. Define functional interfaces with external systems',
        '6. Ensure requirements are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)',
        '7. Assign unique identifiers to each requirement',
        '8. Document parent-child relationships between requirements',
        '9. Identify derived requirements from functional analysis',
        '10. Verify completeness against stakeholder needs'
      ],
      outputFormat: 'JSON object with functional requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              function: { type: 'string' },
              description: { type: 'string' },
              rationale: { type: 'string' },
              parentNeeds: { type: 'array', items: { type: 'string' } },
              verificationMethod: { type: 'string', enum: ['analysis', 'inspection', 'demonstration', 'test'] }
            }
          }
        },
        functionalDecomposition: { type: 'object' },
        interfaces: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'requirements', 'functional-analysis']
}));

export const performanceRequirementsTask = defineTask('performance-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Performance Requirements Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Mechanical Engineer with expertise in performance specification',
      task: 'Define quantitative performance requirements for the system',
      context: {
        projectName: args.projectName,
        systemDescription: args.systemDescription,
        functionalRequirements: args.functionalRequirements,
        environmentalConditions: args.environmentalConditions
      },
      instructions: [
        '1. Define performance metrics for each functional requirement',
        '2. Specify quantitative targets with tolerances and units',
        '3. Define operating ranges (normal, marginal, survival)',
        '4. Specify response times and cycle times',
        '5. Define efficiency and energy consumption requirements',
        '6. Specify reliability targets (MTBF, availability, etc.)',
        '7. Define accuracy and precision requirements',
        '8. Specify capacity and throughput requirements',
        '9. Define weight, size, and envelope constraints',
        '10. Document performance margins and design factors'
      ],
      outputFormat: 'JSON object with performance requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              parameter: { type: 'string' },
              targetValue: { type: 'string' },
              tolerance: { type: 'string' },
              units: { type: 'string' },
              operatingRange: { type: 'object' },
              verificationMethod: { type: 'string' }
            }
          }
        },
        reliabilityTargets: { type: 'object' },
        designMargins: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'requirements', 'performance']
}));

export const standardsAnalysisTask = defineTask('standards-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Standards and Codes Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mechanical Engineer with expertise in codes and standards compliance',
      task: 'Identify and analyze applicable codes, standards, and regulations',
      context: {
        projectName: args.projectName,
        systemDescription: args.systemDescription,
        standards: args.standards,
        functionalRequirements: args.functionalRequirements
      },
      instructions: [
        '1. Identify all applicable ASME, ASTM, ISO, and industry standards',
        '2. Determine mandatory vs. advisory standard requirements',
        '3. Extract specific requirements from each applicable standard',
        '4. Identify design code requirements (ASME BPVC, etc.)',
        '5. Document material specifications from standards',
        '6. Identify testing and inspection requirements',
        '7. Document documentation and certification requirements',
        '8. Identify quality system requirements (ISO 9001, AS9100, etc.)',
        '9. Create compliance checklist for each standard',
        '10. Document standard revision levels and effectivity'
      ],
      outputFormat: 'JSON object with standards analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['applicableStandards', 'complianceChecklist'],
      properties: {
        applicableStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standardId: { type: 'string' },
              title: { type: 'string' },
              revision: { type: 'string' },
              applicability: { type: 'string' },
              keyRequirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        complianceChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirement: { type: 'string' },
              status: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        materialSpecs: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'requirements', 'standards', 'compliance']
}));

export const environmentalRequirementsTask = defineTask('environmental-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Environmental and Interface Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mechanical Engineer with expertise in environmental design',
      task: 'Define environmental and interface requirements',
      context: {
        projectName: args.projectName,
        systemDescription: args.systemDescription,
        environmentalConditions: args.environmentalConditions,
        standardsAnalysis: args.standardsAnalysis
      },
      instructions: [
        '1. Define operating temperature range requirements',
        '2. Specify humidity and moisture resistance requirements',
        '3. Define corrosion and chemical resistance requirements',
        '4. Specify vibration and shock requirements',
        '5. Define pressure and vacuum requirements',
        '6. Specify EMC/EMI requirements if applicable',
        '7. Define ingress protection (IP rating) requirements',
        '8. Specify interface dimensions and mounting requirements',
        '9. Define utility interface requirements (power, fluid, pneumatic)',
        '10. Document storage and transportation environment requirements'
      ],
      outputFormat: 'JSON object with environmental and interface requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              specification: { type: 'string' },
              testMethod: { type: 'string' }
            }
          }
        },
        interfaces: { type: 'array', items: { type: 'object' } },
        environmentalEnvelope: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'requirements', 'environmental']
}));

export const constraintRequirementsTask = defineTask('constraint-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Constraint Requirements Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Systems Engineer with expertise in constraint analysis',
      task: 'Define design and project constraint requirements',
      context: {
        projectName: args.projectName,
        stakeholderNeeds: args.stakeholderNeeds,
        standardsAnalysis: args.standardsAnalysis,
        environmentalRequirements: args.environmentalRequirements
      },
      instructions: [
        '1. Document budget and cost constraints',
        '2. Define schedule and timeline constraints',
        '3. Specify physical constraints (size, weight, envelope)',
        '4. Define manufacturing constraints (processes, facilities)',
        '5. Specify material constraints (availability, cost, lead time)',
        '6. Document technology readiness constraints',
        '7. Define maintenance and serviceability constraints',
        '8. Specify tooling and equipment constraints',
        '9. Document regulatory and certification constraints',
        '10. Define legacy system interface constraints'
      ],
      outputFormat: 'JSON object with constraint requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraintId: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' },
              flexibility: { type: 'string', enum: ['fixed', 'negotiable', 'target'] }
            }
          }
        },
        budgetConstraints: { type: 'object' },
        scheduleConstraints: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'requirements', 'constraints']
}));

export const requirementsFlowDownTask = defineTask('requirements-flow-down', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Requirements Flow-Down and Decomposition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems Engineer with expertise in requirements decomposition',
      task: 'Decompose and flow down system requirements to subsystems and components',
      context: {
        projectName: args.projectName,
        functionalRequirements: args.functionalRequirements,
        performanceRequirements: args.performanceRequirements,
        constraintRequirements: args.constraintRequirements
      },
      instructions: [
        '1. Identify system architecture and subsystem boundaries',
        '2. Allocate system requirements to subsystems',
        '3. Derive subsystem-level requirements from system requirements',
        '4. Allocate subsystem requirements to components',
        '5. Derive component-level specifications',
        '6. Document requirement allocation rationale',
        '7. Verify completeness of flow-down (no orphan requirements)',
        '8. Identify interface requirements between subsystems',
        '9. Document requirement inheritance relationships',
        '10. Validate consistency across decomposition levels'
      ],
      outputFormat: 'JSON object with requirements flow-down'
    },
    outputSchema: {
      type: 'object',
      required: ['decomposition', 'allocation'],
      properties: {
        decomposition: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              element: { type: 'string' },
              requirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        allocation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parentRequirement: { type: 'string' },
              childRequirements: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' }
            }
          }
        },
        interfaceRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'requirements', 'flow-down', 'decomposition']
}));

export const traceabilityMatrixTask = defineTask('traceability-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Traceability Matrix Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Requirements Engineer with expertise in traceability',
      task: 'Develop comprehensive requirements traceability matrix',
      context: {
        projectName: args.projectName,
        stakeholderNeeds: args.stakeholderNeeds,
        functionalRequirements: args.functionalRequirements,
        performanceRequirements: args.performanceRequirements,
        constraintRequirements: args.constraintRequirements,
        flowDown: args.flowDown
      },
      instructions: [
        '1. Create forward traceability (needs to requirements)',
        '2. Create backward traceability (requirements to needs)',
        '3. Map requirements to design elements',
        '4. Map requirements to verification activities',
        '5. Identify untraceable or orphan requirements',
        '6. Document traceability gaps and resolution',
        '7. Create traceability reports for each requirement level',
        '8. Verify coverage of all stakeholder needs',
        '9. Document requirement change impact paths',
        '10. Generate traceability matrix visualization'
      ],
      outputFormat: 'JSON object with traceability matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix'],
      properties: {
        matrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              parentNeed: { type: 'string' },
              childRequirements: { type: 'array', items: { type: 'string' } },
              designElement: { type: 'string' },
              verificationActivity: { type: 'string' }
            }
          }
        },
        coverage: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'requirements', 'traceability']
}));

export const verificationRequirementsTask = defineTask('verification-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Verification Requirements Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Engineer with expertise in verification planning',
      task: 'Define verification requirements and methods for all requirements',
      context: {
        projectName: args.projectName,
        functionalRequirements: args.functionalRequirements,
        performanceRequirements: args.performanceRequirements,
        standardsAnalysis: args.standardsAnalysis
      },
      instructions: [
        '1. Assign verification method (Analysis, Inspection, Demonstration, Test) to each requirement',
        '2. Define test conditions and environments',
        '3. Specify acceptance criteria for each requirement',
        '4. Identify test equipment and instrumentation needs',
        '5. Define sample sizes and statistical criteria',
        '6. Document test sequences and dependencies',
        '7. Identify qualification vs. acceptance test requirements',
        '8. Define inspection points and criteria',
        '9. Document analysis methods and tools',
        '10. Create verification cross-reference matrix'
      ],
      outputFormat: 'JSON object with verification requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationPlan'],
      properties: {
        verificationPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              method: { type: 'string', enum: ['analysis', 'inspection', 'demonstration', 'test'] },
              procedure: { type: 'string' },
              acceptanceCriteria: { type: 'string' },
              equipment: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        testRequirements: { type: 'array', items: { type: 'object' } },
        inspectionRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'requirements', 'verification']
}));

export const requirementsDocumentTask = defineTask('requirements-document', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Requirements Document Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer with expertise in requirements documentation',
      task: 'Generate comprehensive requirements document synthesizing all analyses',
      context: {
        projectName: args.projectName,
        systemDescription: args.systemDescription,
        stakeholderNeeds: args.stakeholderNeeds,
        functionalRequirements: args.functionalRequirements,
        performanceRequirements: args.performanceRequirements,
        standardsAnalysis: args.standardsAnalysis,
        environmentalRequirements: args.environmentalRequirements,
        constraintRequirements: args.constraintRequirements,
        requirementsFlowDown: args.requirementsFlowDown,
        traceabilityMatrix: args.traceabilityMatrix,
        verificationRequirements: args.verificationRequirements,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Create executive summary with scope and objectives',
        '2. Document system description and context',
        '3. Compile all requirements in standard format',
        '4. Include traceability matrix',
        '5. Include verification cross-reference',
        '6. Document applicable standards and compliance',
        '7. Include glossary and definitions',
        '8. Document assumptions and dependencies',
        '9. Define change control process',
        '10. Generate both structured JSON and markdown formats'
      ],
      outputFormat: 'JSON object with complete requirements document'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown', 'summary'],
      properties: {
        document: { type: 'object' },
        markdown: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            totalRequirements: { type: 'number' },
            byCategory: { type: 'object' }
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
  labels: ['mechanical-engineering', 'requirements', 'documentation']
}));

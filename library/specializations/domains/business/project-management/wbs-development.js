/**
 * @process specializations/domains/business/project-management/wbs-development
 * @description Work Breakdown Structure (WBS) Development - Decompose project scope into manageable
 * work packages with clear deliverables, creating hierarchical structure for planning and control.
 * @inputs { projectName: string, scopeStatement: object, deliverables: array, constraints?: object }
 * @outputs { success: boolean, wbs: object, wbsDictionary: array, workPackages: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/wbs-development', {
 *   projectName: 'Mobile App Development',
 *   scopeStatement: { description: 'Native iOS and Android application', boundaries: [...] },
 *   deliverables: ['iOS App', 'Android App', 'Backend API', 'Admin Portal'],
 *   constraints: { timeline: '6 months', methodology: 'hybrid' }
 * });
 *
 * @references
 * - PMI WBS Practice Standard: https://www.pmi.org/pmbok-guide-standards/practice-guides/wbs
 * - WBS Best Practices: https://www.pmi.org/learning/library/applying-work-breakdown-structure-project-lifecycle-6979
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    scopeStatement,
    deliverables = [],
    constraints = {},
    decompositionApproach = 'deliverable-based',
    maxLevels = 5,
    existingTemplates = []
  } = inputs;

  // Phase 1: Scope Analysis and Decomposition Strategy
  const decompositionStrategy = await ctx.task(decompositionStrategyTask, {
    projectName,
    scopeStatement,
    deliverables,
    decompositionApproach,
    existingTemplates
  });

  // Quality Gate: Strategy must be defined
  if (!decompositionStrategy.approach || !decompositionStrategy.levelDefinitions) {
    return {
      success: false,
      error: 'Decomposition strategy not properly defined',
      phase: 'strategy',
      wbs: null
    };
  }

  // Breakpoint: Review decomposition strategy
  await ctx.breakpoint({
    question: `Review WBS decomposition strategy for ${projectName}. Approach: ${decompositionStrategy.approach}. Proceed with decomposition?`,
    title: 'WBS Strategy Review',
    context: {
      runId: ctx.runId,
      projectName,
      approach: decompositionStrategy.approach,
      levels: decompositionStrategy.levelDefinitions,
      files: [{
        path: `artifacts/phase1-decomposition-strategy.json`,
        format: 'json',
        content: decompositionStrategy
      }]
    }
  });

  // Phase 2: Level 1 Decomposition (Major Deliverables/Phases)
  const level1Decomposition = await ctx.task(level1DecompositionTask, {
    projectName,
    scopeStatement,
    deliverables,
    decompositionStrategy
  });

  // Phase 3: Level 2 Decomposition (Sub-deliverables/Components)
  const level2Decomposition = await ctx.task(level2DecompositionTask, {
    projectName,
    level1Decomposition,
    decompositionStrategy
  });

  // Phase 4: Level 3+ Decomposition (Work Packages)
  const detailedDecomposition = await ctx.task(detailedDecompositionTask, {
    projectName,
    level2Decomposition,
    decompositionStrategy,
    maxLevels
  });

  // Quality Gate: Work packages must be estimable (8-80 rule)
  const workPackageValidation = await ctx.task(workPackageValidationTask, {
    projectName,
    detailedDecomposition,
    constraints
  });

  if (workPackageValidation.invalidPackages?.length > 0) {
    await ctx.breakpoint({
      question: `${workPackageValidation.invalidPackages.length} work packages need refinement (too large or too small). Review and adjust?`,
      title: 'Work Package Validation Warning',
      context: {
        runId: ctx.runId,
        invalidPackages: workPackageValidation.invalidPackages,
        recommendation: 'Further decompose large packages or consolidate small ones'
      }
    });
  }

  // Phase 5: WBS Dictionary Development
  const wbsDictionary = await ctx.task(wbsDictionaryDevelopmentTask, {
    projectName,
    detailedDecomposition,
    scopeStatement
  });

  // Phase 6: Work Package Definition
  const workPackageDefinitions = await ctx.task(workPackageDefinitionTask, {
    projectName,
    detailedDecomposition,
    wbsDictionary
  });

  // Phase 7: Integration and Dependencies
  const integrationAnalysis = await ctx.task(integrationAnalysisTask, {
    projectName,
    detailedDecomposition,
    workPackageDefinitions
  });

  // Phase 8: Control Account Definition
  const controlAccounts = await ctx.task(controlAccountDefinitionTask, {
    projectName,
    detailedDecomposition,
    workPackageDefinitions,
    constraints
  });

  // Phase 9: WBS Validation
  const wbsValidation = await ctx.task(wbsValidationTask, {
    projectName,
    detailedDecomposition,
    wbsDictionary,
    scopeStatement,
    deliverables
  });

  // Phase 10: WBS Documentation Generation
  const wbsDocumentation = await ctx.task(wbsDocumentationTask, {
    projectName,
    decompositionStrategy,
    detailedDecomposition,
    wbsDictionary,
    workPackageDefinitions,
    integrationAnalysis,
    controlAccounts,
    wbsValidation
  });

  // Final Quality Gate
  const completenessScore = wbsDocumentation.completenessScore || 0;
  const ready = completenessScore >= 80 && wbsValidation.isValid;

  // Final Breakpoint
  await ctx.breakpoint({
    question: `WBS development complete for ${projectName}. Elements: ${detailedDecomposition.totalElements}, Work Packages: ${workPackageDefinitions.workPackages.length}. Completeness: ${completenessScore}/100. Approve?`,
    title: 'WBS Approval Review',
    context: {
      runId: ctx.runId,
      projectName,
      totalElements: detailedDecomposition.totalElements,
      workPackageCount: workPackageDefinitions.workPackages.length,
      validationStatus: wbsValidation.isValid ? 'Valid' : 'Needs Review',
      files: [
        { path: `artifacts/wbs-structure.json`, format: 'json', content: detailedDecomposition },
        { path: `artifacts/wbs-dictionary.json`, format: 'json', content: wbsDictionary },
        { path: `artifacts/wbs-document.md`, format: 'markdown', content: wbsDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    completenessScore,
    ready,
    wbs: {
      structure: detailedDecomposition.structure,
      totalElements: detailedDecomposition.totalElements,
      levels: detailedDecomposition.maxLevel,
      approach: decompositionStrategy.approach
    },
    wbsDictionary: wbsDictionary.entries,
    workPackages: workPackageDefinitions.workPackages,
    controlAccounts: controlAccounts.accounts,
    dependencies: integrationAnalysis.dependencies,
    validation: {
      isValid: wbsValidation.isValid,
      issues: wbsValidation.issues,
      scopeCoverage: wbsValidation.scopeCoverage
    },
    documentation: {
      markdown: wbsDocumentation.markdown,
      diagram: wbsDocumentation.diagram
    },
    recommendations: wbsDocumentation.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/wbs-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const decompositionStrategyTask = defineTask('decomposition-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Decomposition Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'WBS Expert and Project Planning Specialist',
      task: 'Define WBS decomposition strategy and approach',
      context: {
        projectName: args.projectName,
        scopeStatement: args.scopeStatement,
        deliverables: args.deliverables,
        decompositionApproach: args.decompositionApproach,
        existingTemplates: args.existingTemplates
      },
      instructions: [
        '1. Analyze project scope and deliverables',
        '2. Select decomposition approach (deliverable, phase, or hybrid)',
        '3. Define WBS level definitions and naming conventions',
        '4. Establish decomposition rules (8-80 hour rule, etc.)',
        '5. Identify applicable templates or standards',
        '6. Define work package criteria',
        '7. Establish coding/numbering scheme',
        '8. Define control account placement level',
        '9. Document decomposition guidelines',
        '10. Identify subject matter experts for decomposition'
      ],
      outputFormat: 'JSON object with decomposition strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'levelDefinitions', 'codingScheme'],
      properties: {
        approach: { type: 'string', enum: ['deliverable-based', 'phase-based', 'hybrid', 'organizational'] },
        levelDefinitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        decompositionRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        codingScheme: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            example: { type: 'string' },
            separator: { type: 'string' }
          }
        },
        workPackageCriteria: { type: 'array', items: { type: 'string' } },
        controlAccountLevel: { type: 'number' },
        applicableTemplates: { type: 'array', items: { type: 'string' } },
        smeRequired: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'planning', 'strategy', 'decomposition']
}));

export const level1DecompositionTask = defineTask('level1-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Level 1 Decomposition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager with WBS expertise',
      task: 'Decompose project into Level 1 elements (major deliverables or phases)',
      context: {
        projectName: args.projectName,
        scopeStatement: args.scopeStatement,
        deliverables: args.deliverables,
        decompositionStrategy: args.decompositionStrategy
      },
      instructions: [
        '1. Identify all major deliverables or phases',
        '2. Ensure Level 1 covers 100% of scope',
        '3. Apply coding scheme to Level 1 elements',
        '4. Define Level 1 element descriptions',
        '5. Verify elements are mutually exclusive',
        '6. Ensure elements are at consistent level of detail',
        '7. Include project management as Level 1 element',
        '8. Document any scope exclusions',
        '9. Validate against scope statement',
        '10. Create Level 1 structure'
      ],
      outputFormat: 'JSON object with Level 1 decomposition'
    },
    outputSchema: {
      type: 'object',
      required: ['level1Elements', 'scopeCoverage'],
      properties: {
        level1Elements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wbsCode: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['deliverable', 'phase', 'management'] },
              scopeItems: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        scopeCoverage: { type: 'number', minimum: 0, maximum: 100 },
        scopeGaps: { type: 'array', items: { type: 'string' } },
        exclusions: { type: 'array', items: { type: 'string' } },
        validationNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'decomposition', 'level1']
}));

export const level2DecompositionTask = defineTask('level2-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Level 2 Decomposition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager with WBS expertise',
      task: 'Decompose Level 1 elements into Level 2 (sub-deliverables or components)',
      context: {
        projectName: args.projectName,
        level1Decomposition: args.level1Decomposition,
        decompositionStrategy: args.decompositionStrategy
      },
      instructions: [
        '1. Decompose each Level 1 element into Level 2 components',
        '2. Ensure each Level 1 is fully decomposed (100% rule)',
        '3. Apply coding scheme to Level 2 elements',
        '4. Define Level 2 element descriptions',
        '5. Verify elements are at consistent detail level',
        '6. Identify elements requiring further decomposition',
        '7. Document decomposition rationale',
        '8. Ensure parent-child relationships are clear',
        '9. Validate against scope items',
        '10. Create Level 2 structure'
      ],
      outputFormat: 'JSON object with Level 2 decomposition'
    },
    outputSchema: {
      type: 'object',
      required: ['level2Structure'],
      properties: {
        level2Structure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parentWbsCode: { type: 'string' },
              parentName: { type: 'string' },
              children: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    wbsCode: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    requiresFurtherDecomposition: { type: 'boolean' }
                  }
                }
              }
            }
          }
        },
        totalLevel2Elements: { type: 'number' },
        decompositionRationale: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'decomposition', 'level2']
}));

export const detailedDecompositionTask = defineTask('detailed-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Detailed Decomposition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'WBS Expert',
      task: 'Complete detailed decomposition to work package level',
      context: {
        projectName: args.projectName,
        level2Decomposition: args.level2Decomposition,
        decompositionStrategy: args.decompositionStrategy,
        maxLevels: args.maxLevels
      },
      instructions: [
        '1. Continue decomposition until work package level reached',
        '2. Apply 8-80 hour (or similar) rule for work packages',
        '3. Ensure all branches reach similar detail level',
        '4. Maintain consistent naming conventions',
        '5. Apply coding scheme to all elements',
        '6. Document decomposition decisions',
        '7. Identify work packages (lowest level elements)',
        '8. Ensure 100% rule at each level',
        '9. Track total elements and levels',
        '10. Create complete hierarchical structure'
      ],
      outputFormat: 'JSON object with complete WBS structure'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'totalElements', 'maxLevel'],
      properties: {
        structure: { type: 'object' },
        totalElements: { type: 'number' },
        maxLevel: { type: 'number' },
        workPackageCount: { type: 'number' },
        elementsByLevel: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        decompositionNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'decomposition', 'work-packages']
}));

export const workPackageValidationTask = defineTask('work-package-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Work Package Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Controller',
      task: 'Validate work packages meet sizing and estimability criteria',
      context: {
        projectName: args.projectName,
        detailedDecomposition: args.detailedDecomposition,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify all work packages (lowest level elements)',
        '2. Assess estimated size/duration of each',
        '3. Apply 8-80 hour rule (or project-specific rule)',
        '4. Flag packages that are too large',
        '5. Flag packages that are too small',
        '6. Verify packages are assignable',
        '7. Verify packages are estimable',
        '8. Verify packages are schedulable',
        '9. Document validation results',
        '10. Provide recommendations for invalid packages'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validPackages', 'invalidPackages'],
      properties: {
        validPackages: { type: 'array', items: { type: 'string' } },
        invalidPackages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wbsCode: { type: 'string' },
              name: { type: 'string' },
              issue: { type: 'string', enum: ['too-large', 'too-small', 'not-estimable', 'not-assignable'] },
              recommendation: { type: 'string' }
            }
          }
        },
        validationSummary: {
          type: 'object',
          properties: {
            totalPackages: { type: 'number' },
            validCount: { type: 'number' },
            invalidCount: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'validation', 'work-packages']
}));

export const wbsDictionaryDevelopmentTask = defineTask('wbs-dictionary-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: WBS Dictionary Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Documentation Specialist',
      task: 'Develop comprehensive WBS dictionary entries',
      context: {
        projectName: args.projectName,
        detailedDecomposition: args.detailedDecomposition,
        scopeStatement: args.scopeStatement
      },
      instructions: [
        '1. Create dictionary entry for each WBS element',
        '2. Include WBS code, name, and description',
        '3. Document scope of work for each element',
        '4. List deliverables for each element',
        '5. Document acceptance criteria',
        '6. Identify responsible organization/person',
        '7. List assumptions and constraints',
        '8. Document interdependencies',
        '9. Include resource requirements (high-level)',
        '10. Note any technical references or standards'
      ],
      outputFormat: 'JSON object with WBS dictionary'
    },
    outputSchema: {
      type: 'object',
      required: ['entries'],
      properties: {
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wbsCode: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              scopeOfWork: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              responsibleParty: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } },
              constraints: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              resources: { type: 'array', items: { type: 'string' } },
              technicalReferences: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dictionaryVersion: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'dictionary', 'documentation']
}));

export const workPackageDefinitionTask = defineTask('work-package-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Work Package Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Planner',
      task: 'Define detailed work package specifications',
      context: {
        projectName: args.projectName,
        detailedDecomposition: args.detailedDecomposition,
        wbsDictionary: args.wbsDictionary
      },
      instructions: [
        '1. Identify all work packages from WBS',
        '2. Define work package scope in detail',
        '3. List specific activities within each package',
        '4. Define deliverables and acceptance criteria',
        '5. Estimate effort range (hours)',
        '6. Identify required skills/resources',
        '7. Document assumptions specific to package',
        '8. Identify predecessor/successor packages',
        '9. Assign work package owner',
        '10. Define progress measurement criteria'
      ],
      outputFormat: 'JSON object with work package definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['workPackages'],
      properties: {
        workPackages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wbsCode: { type: 'string' },
              name: { type: 'string' },
              scope: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              effortEstimate: {
                type: 'object',
                properties: {
                  low: { type: 'number' },
                  likely: { type: 'number' },
                  high: { type: 'number' }
                }
              },
              requiredSkills: { type: 'array', items: { type: 'string' } },
              assumptions: { type: 'array', items: { type: 'string' } },
              predecessors: { type: 'array', items: { type: 'string' } },
              successors: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' },
              progressMeasurement: { type: 'string' }
            }
          }
        },
        totalWorkPackages: { type: 'number' },
        totalEstimatedEffort: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'work-packages', 'planning']
}));

export const integrationAnalysisTask = defineTask('integration-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Integration and Dependencies - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems Engineer',
      task: 'Analyze WBS integration points and dependencies',
      context: {
        projectName: args.projectName,
        detailedDecomposition: args.detailedDecomposition,
        workPackageDefinitions: args.workPackageDefinitions
      },
      instructions: [
        '1. Map dependencies between WBS elements',
        '2. Identify integration points between deliverables',
        '3. Document technical interfaces',
        '4. Identify shared resources across elements',
        '5. Map predecessor-successor relationships',
        '6. Identify potential bottlenecks',
        '7. Document hand-off points',
        '8. Identify cross-functional dependencies',
        '9. Assess dependency risks',
        '10. Create dependency matrix'
      ],
      outputFormat: 'JSON object with integration analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'integrationPoints'],
      properties: {
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              predecessor: { type: 'string' },
              successor: { type: 'string' },
              type: { type: 'string', enum: ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'] },
              lag: { type: 'string' },
              isCritical: { type: 'boolean' }
            }
          }
        },
        integrationPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              elements: { type: 'array', items: { type: 'string' } },
              integrationType: { type: 'string' },
              description: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        sharedResources: { type: 'array', items: { type: 'string' } },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        handoffPoints: { type: 'array', items: { type: 'string' } },
        dependencyRisks: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'integration', 'dependencies']
}));

export const controlAccountDefinitionTask = defineTask('control-account-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Control Account Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Controller',
      task: 'Define control accounts for project performance management',
      context: {
        projectName: args.projectName,
        detailedDecomposition: args.detailedDecomposition,
        workPackageDefinitions: args.workPackageDefinitions,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify appropriate WBS level for control accounts',
        '2. Define control account boundaries',
        '3. Assign Control Account Manager (CAM) to each',
        '4. Define budget allocation approach',
        '5. Establish performance measurement method',
        '6. Define reporting requirements',
        '7. Document authorization limits',
        '8. Create control account structure',
        '9. Define change control process',
        '10. Document variance thresholds'
      ],
      outputFormat: 'JSON object with control account definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['accounts'],
      properties: {
        accounts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accountCode: { type: 'string' },
              name: { type: 'string' },
              wbsElements: { type: 'array', items: { type: 'string' } },
              manager: { type: 'string' },
              budget: { type: 'number' },
              performanceMethod: { type: 'string' },
              reportingFrequency: { type: 'string' },
              varianceThresholds: {
                type: 'object',
                properties: {
                  cost: { type: 'number' },
                  schedule: { type: 'number' }
                }
              }
            }
          }
        },
        totalAccounts: { type: 'number' },
        controlAccountLevel: { type: 'number' },
        changeControlProcess: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'control-accounts', 'performance-management']
}));

export const wbsValidationTask = defineTask('wbs-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: WBS Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Assurance Specialist',
      task: 'Validate WBS completeness and quality',
      context: {
        projectName: args.projectName,
        detailedDecomposition: args.detailedDecomposition,
        wbsDictionary: args.wbsDictionary,
        scopeStatement: args.scopeStatement,
        deliverables: args.deliverables
      },
      instructions: [
        '1. Verify 100% scope coverage',
        '2. Check for scope gaps or overlaps',
        '3. Validate decomposition rules compliance',
        '4. Verify naming convention consistency',
        '5. Check coding scheme accuracy',
        '6. Validate work package sizing',
        '7. Verify dictionary completeness',
        '8. Check for orphan elements',
        '9. Validate against deliverables list',
        '10. Document validation findings'
      ],
      outputFormat: 'JSON object with WBS validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'scopeCoverage'],
      properties: {
        isValid: { type: 'boolean' },
        scopeCoverage: { type: 'number', minimum: 0, maximum: 100 },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueType: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              element: { type: 'string' },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        validationChecks: {
          type: 'object',
          properties: {
            scopeCoverage: { type: 'boolean' },
            noOverlaps: { type: 'boolean' },
            namingConvention: { type: 'boolean' },
            codingScheme: { type: 'boolean' },
            workPackageSizing: { type: 'boolean' },
            dictionaryComplete: { type: 'boolean' }
          }
        },
        gapsIdentified: { type: 'array', items: { type: 'string' } },
        overlapsIdentified: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'validation', 'quality']
}));

export const wbsDocumentationTask = defineTask('wbs-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: WBS Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and Project Manager',
      task: 'Generate comprehensive WBS documentation',
      context: {
        projectName: args.projectName,
        decompositionStrategy: args.decompositionStrategy,
        detailedDecomposition: args.detailedDecomposition,
        wbsDictionary: args.wbsDictionary,
        workPackageDefinitions: args.workPackageDefinitions,
        integrationAnalysis: args.integrationAnalysis,
        controlAccounts: args.controlAccounts,
        wbsValidation: args.wbsValidation
      },
      instructions: [
        '1. Create WBS overview document',
        '2. Generate hierarchical WBS diagram (text representation)',
        '3. Compile complete WBS dictionary',
        '4. Document work package specifications',
        '5. Include dependency analysis',
        '6. Document control account structure',
        '7. Generate markdown version',
        '8. Calculate completeness score',
        '9. Document recommendations',
        '10. Add version control information'
      ],
      outputFormat: 'JSON object with complete WBS documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'completenessScore'],
      properties: {
        markdown: { type: 'string' },
        diagram: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            totalElements: { type: 'number' },
            levels: { type: 'number' },
            workPackages: { type: 'number' },
            controlAccounts: { type: 'number' }
          }
        },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'array', items: { type: 'string' } },
        documentControl: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            date: { type: 'string' },
            status: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['wbs', 'documentation', 'deliverable']
}));

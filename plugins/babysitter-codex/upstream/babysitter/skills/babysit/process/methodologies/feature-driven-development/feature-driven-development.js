/**
 * @process methodologies/feature-driven-development
 * @description Feature-Driven Development (FDD) - Five-step process with parking lot tracking
 * @inputs { projectName: string, domainDescription: string, iterationWeeks: number, features?: array }
 * @outputs { success: boolean, domainModel: object, featuresList: object, plan: object, iterations: array, parkingLot: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Feature-Driven Development (FDD) Process
 *
 * Created by Jeff De Luca and Peter Coad (1997)
 *
 * FDD is a feature-centric agile methodology that organizes work around building small,
 * client-valued features in short, predictable cycles. It provides discipline for large
 * projects while maintaining agile responsiveness.
 *
 * Five-Step Process:
 * 1. Develop Overall Model - Domain walkthrough and object modeling
 * 2. Build Features List - Feature decomposition in <action> <result> <object> format
 * 3. Plan by Feature - Sequence, assign to Chief Programmers, schedule iterations
 * 4. Design by Feature - Detailed design with sequence diagrams and design inspection
 * 5. Build by Feature - Code, test, inspect, integrate, promote to build
 *
 * Key Characteristics:
 * - Parking Lot Diagrams: Visual progress tracking with colored feature set boxes
 * - Class Ownership: Individual developers own classes (reduces merge conflicts)
 * - Feature Teams: Chief Programmer + 2-5 developers
 * - Regular Builds: 2-week iterations with working builds
 * - Progress Visibility: Real-time tracking of feature completion
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.domainDescription - High-level domain/business description
 * @param {number} inputs.iterationWeeks - Length of each iteration in weeks (default: 2)
 * @param {Array<Object>} inputs.features - Pre-defined features (optional, will generate if not provided)
 * @param {Object} inputs.existingCodebase - Information about existing codebase for brownfield projects
 * @param {number} inputs.teamSize - Total team size including Chief Programmers (default: 6)
 * @param {number} inputs.chiefProgrammers - Number of Chief Programmers (default: 2)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with domain model, features, plan, iterations, and parking lot
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    domainDescription,
    iterationWeeks = 2,
    features: predefinedFeatures = null,
    existingCodebase = null,
    teamSize = 6,
    chiefProgrammers = 2
  } = inputs;

  // ============================================================================
  // STEP 1: DEVELOP OVERALL MODEL
  // ============================================================================

  const domainModelResult = await ctx.task(developOverallModelTask, {
    projectName,
    domainDescription,
    existingCodebase,
    teamSize
  });

  // Breakpoint: Review domain model
  await ctx.breakpoint({
    question: `Review the domain object model for "${projectName}". Classes, relationships, and specifications have been identified. Approve to proceed with feature list?`,
    title: 'Domain Model Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/fdd/domain-model.md', format: 'markdown', label: 'Domain Model' },
        { path: 'artifacts/fdd/domain-model.json', format: 'code', language: 'json', label: 'Model Data' }
      ]
    }
  });

  // ============================================================================
  // STEP 2: BUILD FEATURES LIST
  // ============================================================================

  const featuresListResult = await ctx.task(buildFeaturesListTask, {
    projectName,
    domainModel: domainModelResult,
    predefinedFeatures,
    domainDescription
  });

  // Breakpoint: Review features list
  await ctx.breakpoint({
    question: `Review ${featuresListResult.totalFeatures} features organized into ${featuresListResult.featureSets.length} feature sets. Features follow <action> <result> <object> format. Approve to proceed with planning?`,
    title: 'Features List Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/fdd/features-list.md', format: 'markdown', label: 'Features List' },
        { path: 'artifacts/fdd/features-list.json', format: 'code', language: 'json', label: 'Features Data' }
      ]
    }
  });

  // ============================================================================
  // STEP 3: PLAN BY FEATURE
  // ============================================================================

  const planByFeatureResult = await ctx.task(planByFeatureTask, {
    projectName,
    domainModel: domainModelResult,
    featuresList: featuresListResult,
    iterationWeeks,
    chiefProgrammers,
    teamSize
  });

  // Breakpoint: Review feature plan
  await ctx.breakpoint({
    question: `Review planning for ${planByFeatureResult.iterations.length} iterations (${iterationWeeks}-week cycles). Features assigned to Chief Programmers with class owners identified. Approve to begin iterations?`,
    title: 'Feature Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/fdd/feature-plan.md', format: 'markdown', label: 'Feature Plan' },
        { path: 'artifacts/fdd/feature-plan.json', format: 'code', language: 'json', label: 'Plan Data' },
        { path: 'artifacts/fdd/parking-lot-initial.svg', format: 'image', label: 'Initial Parking Lot' }
      ]
    }
  });

  // ============================================================================
  // STEP 4 & 5: DESIGN BY FEATURE + BUILD BY FEATURE (Iterations)
  // ============================================================================

  const iterationResults = [];

  for (let iterIdx = 0; iterIdx < planByFeatureResult.iterations.length; iterIdx++) {
    const iteration = planByFeatureResult.iterations[iterIdx];

    const iterationData = {
      iterationNumber: iterIdx + 1,
      startDate: ctx.now(),
      features: iteration.features,
      duration: iterationWeeks
    };

    // Design and Build features in parallel per Chief Programmer
    const designBuildResults = await ctx.parallel.all(
      iteration.chiefProgrammerAssignments.map(assignment => async () => {
        const featureResults = [];

        // Process each feature assigned to this Chief Programmer
        for (const featureId of assignment.features) {
          const feature = iteration.features.find(f => f.id === featureId);

          // STEP 4: Design by Feature
          const designResult = await ctx.task(designByFeatureTask, {
            projectName,
            feature,
            domainModel: domainModelResult,
            chiefProgrammer: assignment.chiefProgrammer,
            classOwners: assignment.classOwners,
            iterationNumber: iterIdx + 1
          });

          // STEP 5: Build by Feature
          const buildResult = await ctx.task(buildByFeatureTask, {
            projectName,
            feature,
            design: designResult,
            domainModel: domainModelResult,
            chiefProgrammer: assignment.chiefProgrammer,
            classOwners: assignment.classOwners,
            iterationNumber: iterIdx + 1
          });

          featureResults.push({
            feature,
            design: designResult,
            build: buildResult
          });
        }

        return {
          chiefProgrammer: assignment.chiefProgrammer,
          features: featureResults
        };
      })
    );

    iterationData.results = designBuildResults;
    iterationData.endDate = ctx.now();

    // Generate parking lot diagram for this iteration
    const parkingLotResult = await ctx.task(generateParkingLotTask, {
      projectName,
      featuresList: featuresListResult,
      completedFeatures: [
        ...iterationResults.flatMap(ir =>
          ir.results.flatMap(r => r.features.map(f => f.feature.id))
        ),
        ...designBuildResults.flatMap(r => r.features.map(f => f.feature.id))
      ],
      iterationNumber: iterIdx + 1
    });

    iterationData.parkingLot = parkingLotResult;

    // Calculate iteration metrics
    const totalFeaturesInIteration = designBuildResults.reduce(
      (sum, r) => sum + r.features.length,
      0
    );
    const completedFeaturesInIteration = designBuildResults.reduce(
      (sum, r) => sum + r.features.filter(f => f.build.status === 'promoted').length,
      0
    );

    iterationData.metrics = {
      totalFeatures: totalFeaturesInIteration,
      completedFeatures: completedFeaturesInIteration,
      completionRate: (completedFeaturesInIteration / totalFeaturesInIteration) * 100
    };

    iterationResults.push(iterationData);

    // Iteration checkpoint
    await ctx.breakpoint({
      question: `Iteration ${iterIdx + 1} complete. ${completedFeaturesInIteration}/${totalFeaturesInIteration} features promoted to build. Review parking lot and proceed?`,
      title: `Iteration ${iterIdx + 1} Complete`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/fdd/iteration-${iterIdx + 1}-summary.md`, format: 'markdown', label: 'Iteration Summary' },
          { path: `artifacts/fdd/parking-lot-iteration-${iterIdx + 1}.svg`, format: 'image', label: 'Parking Lot Progress' }
        ]
      }
    });
  }

  // ============================================================================
  // FINAL SUMMARY & PARKING LOT
  // ============================================================================

  // Generate final parking lot
  const allCompletedFeatures = iterationResults.flatMap(ir =>
    ir.results.flatMap(r =>
      r.features
        .filter(f => f.build.status === 'promoted')
        .map(f => f.feature.id)
    )
  );

  const finalParkingLot = await ctx.task(generateParkingLotTask, {
    projectName,
    featuresList: featuresListResult,
    completedFeatures: allCompletedFeatures,
    iterationNumber: 'final'
  });

  // Calculate overall metrics
  const totalFeatures = featuresListResult.totalFeatures;
  const completedFeatures = allCompletedFeatures.length;
  const overallCompletionRate = (completedFeatures / totalFeatures) * 100;

  // Final breakpoint
  await ctx.breakpoint({
    question: `FDD process complete for "${projectName}". ${completedFeatures}/${totalFeatures} features delivered (${overallCompletionRate.toFixed(1)}%). Review final parking lot and deliverables?`,
    title: 'FDD Process Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/fdd/domain-model.md', format: 'markdown', label: 'Domain Model' },
        { path: 'artifacts/fdd/features-list.md', format: 'markdown', label: 'Features List' },
        { path: 'artifacts/fdd/feature-plan.md', format: 'markdown', label: 'Feature Plan' },
        { path: 'artifacts/fdd/parking-lot-final.svg', format: 'image', label: 'Final Parking Lot' },
        { path: 'artifacts/fdd/final-summary.md', format: 'markdown', label: 'Summary' }
      ]
    }
  });

  return {
    success: completedFeatures === totalFeatures,
    projectName,
    domainModel: domainModelResult,
    featuresList: featuresListResult,
    plan: planByFeatureResult,
    iterations: iterationResults,
    parkingLot: finalParkingLot,
    metrics: {
      totalFeatures,
      completedFeatures,
      completionRate: overallCompletionRate,
      totalIterations: iterationResults.length,
      iterationWeeks,
      averageFeaturesPerIteration: totalFeatures / iterationResults.length,
      featureSetCompletion: featuresListResult.featureSets.map(fs => ({
        name: fs.name,
        total: fs.features.length,
        completed: fs.features.filter(f => allCompletedFeatures.includes(f.id)).length,
        percentage: (fs.features.filter(f => allCompletedFeatures.includes(f.id)).length / fs.features.length) * 100
      }))
    },
    artifacts: {
      domainModel: 'artifacts/fdd/domain-model.md',
      featuresList: 'artifacts/fdd/features-list.md',
      featurePlan: 'artifacts/fdd/feature-plan.md',
      parkingLot: 'artifacts/fdd/parking-lot-final.svg',
      summary: 'artifacts/fdd/final-summary.md'
    },
    metadata: {
      processId: 'methodologies/feature-driven-development',
      timestamp: ctx.now(),
      chiefProgrammers,
      teamSize
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Step 1: Develop Overall Model
 * Domain walkthrough, study documents, build domain object model
 */
export const developOverallModelTask = defineTask('develop-overall-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop Domain Model: ${args.projectName}`,
  description: 'Create comprehensive domain object model with classes and relationships',

  agent: {
    name: 'domain-modeler',
    prompt: {
      role: 'domain modeling expert and software architect',
      task: 'Develop overall domain model for the project',
      context: {
        projectName: args.projectName,
        domainDescription: args.domainDescription,
        existingCodebase: args.existingCodebase,
        teamSize: args.teamSize
      },
      instructions: [
        'Conduct domain walkthrough - understand business context',
        'Study existing documents and requirements',
        'Identify major domain objects and entities',
        'Define classes with attributes and methods',
        'Map relationships between classes (associations, inheritance, composition)',
        'Create class specifications with responsibilities',
        'Identify bounded contexts and aggregates',
        'Consider existing codebase if provided (brownfield)',
        'Use UML class diagram notation',
        'Keep model focused on business domain, not technical infrastructure'
      ],
      outputFormat: 'JSON with classes, relationships, specifications, and model diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['classes', 'relationships', 'modelDiagram'],
      properties: {
        classes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              responsibilities: { type: 'string' },
              attributes: { type: 'array', items: { type: 'string' } },
              methods: { type: 'array', items: { type: 'string' } },
              stereotype: { type: 'string' }
            }
          }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        modelDiagram: { type: 'string' },
        boundedContexts: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/fdd/domain-model.md', format: 'markdown' },
      { path: 'artifacts/fdd/domain-model.json', format: 'json' }
    ]
  },

  labels: ['agent', 'fdd', 'domain-modeling', 'step-1']
}));

/**
 * Step 2: Build Features List
 * Feature decomposition in <action> <result> <object> format
 */
export const buildFeaturesListTask = defineTask('build-features-list', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Features List: ${args.projectName}`,
  description: 'Decompose system into feature sets and features',

  agent: {
    name: 'feature-decomposer',
    prompt: {
      role: 'FDD feature planning expert',
      task: 'Build comprehensive features list organized into feature sets',
      context: {
        projectName: args.projectName,
        domainModel: args.domainModel,
        predefinedFeatures: args.predefinedFeatures,
        domainDescription: args.domainDescription
      },
      instructions: [
        'Identify major feature sets (functional areas)',
        'Break each feature set into individual features',
        'Use FDD feature format: <action> <result> <object>',
        'Examples: "Calculate total of sale", "Validate password of user", "Display history of account"',
        'Features should be small (2 hours to 2 weeks)',
        'Features should be client-valued (business meaningful)',
        'Prioritize features (high, medium, low)',
        'Identify dependencies between features',
        'Organize into parking lot structure (feature sets as boxes)',
        'Each feature set should have 5-15 features ideally',
        'Map features to domain model classes'
      ],
      outputFormat: 'JSON with feature sets, features, priorities, and parking lot structure'
    },
    outputSchema: {
      type: 'object',
      required: ['featureSets', 'totalFeatures'],
      properties: {
        featureSets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              features: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    action: { type: 'string' },
                    result: { type: 'string' },
                    object: { type: 'string' },
                    priority: { type: 'string' },
                    estimatedDays: { type: 'number' },
                    dependencies: { type: 'array', items: { type: 'string' } },
                    relatedClasses: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        },
        totalFeatures: { type: 'number' },
        parkingLotLayout: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/fdd/features-list.md', format: 'markdown' },
      { path: 'artifacts/fdd/features-list.json', format: 'json' }
    ]
  },

  labels: ['agent', 'fdd', 'feature-decomposition', 'step-2']
}));

/**
 * Step 3: Plan by Feature
 * Sequence features, assign to Chief Programmers, identify class owners
 */
export const planByFeatureTask = defineTask('plan-by-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan by Feature: ${args.projectName}`,
  description: 'Sequence features and assign to Chief Programmers with class ownership',

  agent: {
    name: 'fdd-planner',
    prompt: {
      role: 'FDD Chief Programmer and planning lead',
      task: 'Create detailed plan by feature with assignments and schedule',
      context: {
        projectName: args.projectName,
        domainModel: args.domainModel,
        featuresList: args.featuresList,
        iterationWeeks: args.iterationWeeks,
        chiefProgrammers: args.chiefProgrammers,
        teamSize: args.teamSize
      },
      instructions: [
        'Identify feature dependencies and sequence appropriately',
        'Assign features to Chief Programmers based on domain expertise',
        'Identify class owners for each class (individual ownership)',
        'Organize into iterations (default 2-week cycles)',
        'Balance workload across Chief Programmers',
        'Consider class ownership when assigning features (minimize conflicts)',
        'Each Chief Programmer leads feature team of 2-5 developers',
        'Schedule allows for parallel development',
        'Mark critical path features',
        'Generate initial parking lot diagram'
      ],
      outputFormat: 'JSON with iterations, assignments, class ownership, and schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['iterations', 'classOwnership', 'schedule'],
      properties: {
        iterations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'number' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              features: { type: 'array', items: { type: 'object' } },
              chiefProgrammerAssignments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    chiefProgrammer: { type: 'string' },
                    features: { type: 'array', items: { type: 'string' } },
                    classOwners: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        },
        classOwnership: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        schedule: {
          type: 'object',
          properties: {
            totalWeeks: { type: 'number' },
            iterationCount: { type: 'number' },
            startDate: { type: 'string' },
            estimatedEndDate: { type: 'string' }
          }
        },
        parkingLotInitial: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/fdd/feature-plan.md', format: 'markdown' },
      { path: 'artifacts/fdd/feature-plan.json', format: 'json' },
      { path: 'artifacts/fdd/parking-lot-initial.svg', format: 'image' }
    ]
  },

  labels: ['agent', 'fdd', 'planning', 'step-3']
}));

/**
 * Step 4: Design by Feature
 * Detailed design with sequence diagrams and design inspection
 */
export const designByFeatureTask = defineTask('design-by-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design: ${args.feature.title}`,
  description: 'Create detailed design for feature with sequence diagrams',

  agent: {
    name: 'feature-designer',
    prompt: {
      role: 'software designer and Chief Programmer',
      task: 'Design the feature in detail',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        domainModel: args.domainModel,
        chiefProgrammer: args.chiefProgrammer,
        classOwners: args.classOwners,
        iterationNumber: args.iterationNumber
      },
      instructions: [
        'Refine domain object model for this feature',
        'Create sequence diagrams showing object interactions',
        'Design class methods and interfaces needed',
        'Identify algorithms and data structures',
        'Consider design patterns applicable',
        'Document design decisions and rationale',
        'Perform design inspection (review quality)',
        'Ensure design follows SOLID principles',
        'Keep class ownership in mind (who will implement)',
        'Design should take no more than 1 day for small features'
      ],
      outputFormat: 'JSON with refined model, sequence diagrams, method signatures, design inspection results'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedModel', 'sequenceDiagrams', 'inspectionPassed'],
      properties: {
        refinedModel: {
          type: 'object',
          properties: {
            classesModified: { type: 'array', items: { type: 'string' } },
            newMethods: { type: 'array', items: { type: 'object' } }
          }
        },
        sequenceDiagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              diagram: { type: 'string' },
              participants: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        methodSignatures: { type: 'array', items: { type: 'string' } },
        designPatterns: { type: 'array', items: { type: 'string' } },
        inspectionPassed: { type: 'boolean' },
        inspectionNotes: { type: 'string' },
        estimatedImplementationHours: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/fdd/designs/${args.feature.id}-design.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'fdd', 'design', 'step-4', `iteration-${args.iterationNumber}`, `feature-${args.feature.id}`]
}));

/**
 * Step 5: Build by Feature
 * Implement, test, code inspect, integrate, promote to build
 */
export const buildByFeatureTask = defineTask('build-by-feature', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build: ${args.feature.title}`,
  description: 'Implement feature following design with testing and code inspection',

  agent: {
    name: 'feature-builder',
    prompt: {
      role: 'software developer and class owner',
      task: 'Build the feature following the approved design',
      context: {
        projectName: args.projectName,
        feature: args.feature,
        design: args.design,
        domainModel: args.domainModel,
        chiefProgrammer: args.chiefProgrammer,
        classOwners: args.classOwners,
        iterationNumber: args.iterationNumber
      },
      instructions: [
        'Implement code following the design',
        'Respect class ownership (each developer owns specific classes)',
        'Write unit tests for all new methods',
        'Follow coding standards and conventions',
        'Perform code inspection (peer review)',
        'Fix any issues found during inspection',
        'Run all unit tests and ensure they pass',
        'Integrate with main build',
        'Verify integration successful',
        'Promote to build (mark feature complete)',
        'Update class ownership if new classes created'
      ],
      outputFormat: 'JSON with implementation details, tests, inspection results, integration status'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'unitTestsPassed', 'codeInspectionPassed', 'integrated', 'status'],
      properties: {
        implemented: { type: 'boolean' },
        filesModified: { type: 'array', items: { type: 'string' } },
        linesOfCode: { type: 'number' },
        unitTests: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' }
          }
        },
        unitTestsPassed: { type: 'boolean' },
        codeInspection: {
          type: 'object',
          properties: {
            reviewer: { type: 'string' },
            issuesFound: { type: 'array', items: { type: 'string' } },
            issuesFixed: { type: 'array', items: { type: 'string' } }
          }
        },
        codeInspectionPassed: { type: 'boolean' },
        integrated: { type: 'boolean' },
        integrationNotes: { type: 'string' },
        status: {
          type: 'string',
          enum: ['promoted', 'in-progress', 'blocked', 'failed']
        },
        actualHours: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/fdd/builds/${args.feature.id}-build.md`, format: 'markdown' }
    ]
  },

  labels: ['agent', 'fdd', 'build', 'step-5', `iteration-${args.iterationNumber}`, `feature-${args.feature.id}`]
}));

/**
 * Generate Parking Lot Diagram
 * Visual progress tracking with colored feature set boxes
 */
export const generateParkingLotTask = defineTask('generate-parking-lot', (args, taskCtx) => ({
  kind: 'node',
  title: `Generate Parking Lot: Iteration ${args.iterationNumber}`,
  description: 'Create visual parking lot diagram showing feature completion status',

  node: {
    run: async (taskArgs) => {
      // This would typically use a visualization library
      // For now, we'll generate SVG markup
      const { featuresList, completedFeatures } = taskArgs;

      const svg = generateParkingLotSVG(featuresList.featureSets, completedFeatures);

      return {
        svgContent: svg,
        completionPercentage: (completedFeatures.length / featuresList.totalFeatures) * 100,
        featureSetStatus: featuresList.featureSets.map(fs => {
          const completed = fs.features.filter(f => completedFeatures.includes(f.id)).length;
          const total = fs.features.length;
          const percentage = (completed / total) * 100;

          return {
            name: fs.name,
            completed,
            total,
            percentage,
            color: getStatusColor(percentage)
          };
        })
      };
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: `artifacts/fdd/parking-lot-iteration-${args.iterationNumber}.svg`, format: 'image' }
    ]
  },

  labels: ['node', 'fdd', 'parking-lot', 'visualization']
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate SVG parking lot diagram
 */
function generateParkingLotSVG(featureSets, completedFeatures) {
  const boxWidth = 200;
  const boxHeight = 150;
  const padding = 20;
  const cols = 3;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * (boxWidth + padding) + padding}" height="${Math.ceil(featureSets.length / cols) * (boxHeight + padding) + padding}">`;

  featureSets.forEach((fs, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = col * (boxWidth + padding) + padding;
    const y = row * (boxHeight + padding) + padding;

    const completed = fs.features.filter(f => completedFeatures.includes(f.id)).length;
    const total = fs.features.length;
    const percentage = (completed / total) * 100;
    const color = getStatusColor(percentage);

    svgContent += `
      <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}"
            fill="${color}" stroke="#333" stroke-width="2" rx="5"/>
      <text x="${x + boxWidth / 2}" y="${y + 30}"
            text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">
        ${fs.name}
      </text>
      <text x="${x + boxWidth / 2}" y="${y + boxHeight / 2}"
            text-anchor="middle" font-size="36" font-weight="bold" fill="#fff">
        ${percentage.toFixed(0)}%
      </text>
      <text x="${x + boxWidth / 2}" y="${y + boxHeight - 20}"
            text-anchor="middle" font-size="14" fill="#fff">
        ${completed} / ${total} features
      </text>
    `;
  });

  svgContent += '</svg>';
  return svgContent;
}

/**
 * Get status color based on completion percentage
 */
function getStatusColor(percentage) {
  if (percentage === 0) return '#999999'; // Gray - Not started
  if (percentage < 50) return '#ff6b6b'; // Red - In progress (< 50%)
  if (percentage < 100) return '#ffd93d'; // Yellow - In progress (>= 50%)
  return '#6bcf7f'; // Green - Complete
}

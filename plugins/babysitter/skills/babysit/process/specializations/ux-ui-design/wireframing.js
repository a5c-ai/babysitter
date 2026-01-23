/**
 * @process ux-ui-design/wireframing
 * @description Wireframing and Lo-Fi Prototyping process for exploring information architecture, layout, and user flows through iterative wireframe creation
 * @inputs { projectName: string, requirements: array, userFlows: array, contentInventory: object, designPrinciples: array, fidelityLevel: string }
 * @outputs { success: boolean, wireframes: object, userFlowDiagrams: array, annotations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    requirements = [],
    userFlows = [],
    contentInventory = {},
    designPrinciples = [],
    fidelityLevel = 'medium', // low, medium, high
    targetScreens = [],
    deviceTypes = ['desktop'], // desktop, mobile, tablet
    outputDir = 'wireframing-output',
    iterationLimit = 3
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Wireframing Process for ${projectName}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS AND CONTENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements and content structure');
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    requirements,
    contentInventory,
    userFlows,
    targetScreens,
    deviceTypes,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: INFORMATION ARCHITECTURE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining information architecture and content hierarchy');
  const informationArchitecture = await ctx.task(informationArchitectureTask, {
    projectName,
    requirements,
    contentInventory,
    requirementsAnalysis,
    userFlows,
    outputDir
  });

  artifacts.push(...informationArchitecture.artifacts);

  // ============================================================================
  // PHASE 3: USER FLOW MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Mapping user flows and interaction paths');
  const userFlowMapping = await ctx.task(userFlowMappingTask, {
    projectName,
    userFlows,
    requirementsAnalysis,
    informationArchitecture,
    targetScreens,
    outputDir
  });

  artifacts.push(...userFlowMapping.artifacts);

  // ============================================================================
  // PHASE 4: LOW-FIDELITY WIREFRAME CREATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating low-fidelity wireframes');
  const lowFidelityWireframes = await ctx.task(lowFidelityWireframeTask, {
    projectName,
    requirements,
    informationArchitecture,
    userFlowMapping,
    designPrinciples,
    deviceTypes,
    targetScreens,
    outputDir
  });

  artifacts.push(...lowFidelityWireframes.artifacts);

  // ============================================================================
  // PHASE 5: WIREFRAME REVIEW AND FEEDBACK (Iteration 1)
  // ============================================================================

  ctx.log('info', 'Phase 5: Initial wireframe review');
  const initialReview = await ctx.task(wireframeReviewTask, {
    projectName,
    wireframes: lowFidelityWireframes.wireframes,
    requirements,
    userFlows,
    informationArchitecture,
    iteration: 1,
    outputDir
  });

  artifacts.push(...initialReview.artifacts);

  // Breakpoint: Review low-fidelity wireframes
  await ctx.breakpoint({
    question: `Low-fidelity wireframes complete. Review score: ${initialReview.reviewScore}/100. Review wireframes and provide feedback for refinement?`,
    title: 'Low-Fidelity Wireframe Review',
    context: {
      runId: ctx.runId,
      files: artifacts
        .filter(a => a.phase === 'low-fidelity' || a.type === 'wireframe')
        .map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
      summary: {
        projectName,
        totalScreens: lowFidelityWireframes.totalScreens,
        reviewScore: initialReview.reviewScore,
        strengths: initialReview.strengths,
        improvementAreas: initialReview.improvementAreas,
        criticalIssues: initialReview.criticalIssues?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 6: MEDIUM-FIDELITY WIREFRAME REFINEMENT
  // ============================================================================

  let mediumFidelityWireframes = null;
  let finalReview = initialReview;

  if (fidelityLevel === 'medium' || fidelityLevel === 'high') {
    ctx.log('info', 'Phase 6: Refining to medium-fidelity wireframes');
    mediumFidelityWireframes = await ctx.task(mediumFidelityWireframeTask, {
      projectName,
      lowFidelityWireframes,
      initialReview,
      requirements,
      informationArchitecture,
      userFlowMapping,
      designPrinciples,
      deviceTypes,
      outputDir
    });

    artifacts.push(...mediumFidelityWireframes.artifacts);

    // ============================================================================
    // PHASE 7: MEDIUM-FIDELITY REVIEW
    // ============================================================================

    ctx.log('info', 'Phase 7: Medium-fidelity wireframe review');
    finalReview = await ctx.task(wireframeReviewTask, {
      projectName,
      wireframes: mediumFidelityWireframes.wireframes,
      requirements,
      userFlows,
      informationArchitecture,
      iteration: 2,
      previousReview: initialReview,
      outputDir
    });

    artifacts.push(...finalReview.artifacts);

    // Breakpoint: Review medium-fidelity wireframes
    await ctx.breakpoint({
      question: `Medium-fidelity wireframes complete. Review score: ${finalReview.reviewScore}/100. Approve or request further refinement?`,
      title: 'Medium-Fidelity Wireframe Review',
      context: {
        runId: ctx.runId,
        files: artifacts
          .filter(a => a.phase === 'medium-fidelity' || a.type === 'wireframe-refined')
          .map(a => ({
            path: a.path,
            format: a.format || 'markdown',
            language: a.language || undefined,
            label: a.label || undefined
          })),
        summary: {
          projectName,
          totalScreens: mediumFidelityWireframes.totalScreens,
          reviewScore: finalReview.reviewScore,
          improvement: finalReview.reviewScore - initialReview.reviewScore,
          strengths: finalReview.strengths,
          improvementAreas: finalReview.improvementAreas,
          criticalIssues: finalReview.criticalIssues?.length || 0
        }
      }
    });
  }

  // ============================================================================
  // PHASE 8: ANNOTATION AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating annotations and documentation');
  const annotationGeneration = await ctx.task(annotationGenerationTask, {
    projectName,
    wireframes: mediumFidelityWireframes?.wireframes || lowFidelityWireframes.wireframes,
    informationArchitecture,
    userFlowMapping,
    requirements,
    designPrinciples,
    outputDir
  });

  artifacts.push(...annotationGeneration.artifacts);

  // ============================================================================
  // PHASE 9: INTERACTIVE FLOW PROTOTYPE (if high fidelity requested)
  // ============================================================================

  let interactivePrototype = null;

  if (fidelityLevel === 'high') {
    ctx.log('info', 'Phase 9: Creating interactive clickable prototype');
    interactivePrototype = await ctx.task(interactivePrototypeTask, {
      projectName,
      wireframes: mediumFidelityWireframes.wireframes,
      userFlowMapping,
      annotations: annotationGeneration.annotations,
      outputDir
    });

    artifacts.push(...interactivePrototype.artifacts);
  }

  // ============================================================================
  // PHASE 10: COMPREHENSIVE WIREFRAME PACKAGE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive wireframe documentation package');
  const wireframePackage = await ctx.task(wireframePackageGenerationTask, {
    projectName,
    requirementsAnalysis,
    informationArchitecture,
    userFlowMapping,
    lowFidelityWireframes,
    mediumFidelityWireframes,
    annotationGeneration,
    interactivePrototype,
    finalReview,
    outputDir
  });

  artifacts.push(...wireframePackage.artifacts);

  // ============================================================================
  // PHASE 11: QUALITY AND COMPLETENESS VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating wireframe quality and completeness');
  const qualityValidation = await ctx.task(qualityValidationTask, {
    projectName,
    requirements,
    wireframes: mediumFidelityWireframes?.wireframes || lowFidelityWireframes.wireframes,
    userFlowMapping,
    informationArchitecture,
    annotations: annotationGeneration.annotations,
    finalReview,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityScore = qualityValidation.overallScore;
  const qualityMet = qualityScore >= 80;

  // Breakpoint: Final approval
  await ctx.breakpoint({
    question: `Wireframing complete. Quality score: ${qualityScore}/100. ${qualityMet ? 'Wireframes meet quality standards!' : 'Wireframes may need additional refinement.'} Approve for next phase?`,
    title: 'Final Wireframe Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        qualityScore,
        qualityMet,
        totalScreens: mediumFidelityWireframes?.totalScreens || lowFidelityWireframes.totalScreens,
        totalArtifacts: artifacts.length,
        fidelityLevel,
        hasInteractivePrototype: !!interactivePrototype,
        allRequirementsCovered: qualityValidation.requirementsCoverage === 100
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    qualityScore,
    qualityMet,
    fidelityLevel,
    wireframes: {
      lowFidelity: lowFidelityWireframes.wireframes,
      mediumFidelity: mediumFidelityWireframes?.wireframes || null,
      totalScreens: mediumFidelityWireframes?.totalScreens || lowFidelityWireframes.totalScreens
    },
    userFlowDiagrams: userFlowMapping.flowDiagrams,
    informationArchitecture: {
      sitemap: informationArchitecture.sitemap,
      navigationStructure: informationArchitecture.navigationStructure,
      contentHierarchy: informationArchitecture.contentHierarchy
    },
    annotations: annotationGeneration.annotations,
    interactivePrototype: interactivePrototype?.prototypeUrl || null,
    qualityMetrics: {
      requirementsCoverage: qualityValidation.requirementsCoverage,
      userFlowCompleteness: qualityValidation.userFlowCompleteness,
      usabilityScore: qualityValidation.usabilityScore,
      accessibilityScore: qualityValidation.accessibilityScore
    },
    artifacts,
    duration,
    metadata: {
      processId: 'ux-ui-design/wireframing',
      timestamp: startTime,
      projectName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Requirements and Content Analysis
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze requirements and content structure',
  agent: {
    name: 'ux-requirements-analyst',
    prompt: {
      role: 'senior UX designer and information architect',
      task: 'Analyze project requirements, content inventory, and user flows to identify wireframing scope and priorities',
      context: args,
      instructions: [
        'Review all functional requirements and identify screens/views needed',
        'Analyze content inventory to understand content types and structure',
        'Map requirements to specific screens and interface elements',
        'Identify critical user paths that require wireframe coverage',
        'Determine content priority and hierarchy for each screen',
        'Identify interaction patterns needed (forms, navigation, search, filters)',
        'Assess device-specific considerations (responsive, mobile-first, adaptive)',
        'Flag ambiguous requirements needing clarification',
        'Prioritize screens by importance: critical, high, medium, low',
        'Estimate wireframing scope and effort',
        'Generate requirements analysis report with screen list'
      ],
      outputFormat: 'JSON with totalRequirements, screensIdentified (array), contentTypes (array), interactionPatterns (array), prioritizedScreens (object), deviceConsiderations (object), ambiguousRequirements (array), estimatedEffort (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRequirements', 'screensIdentified', 'prioritizedScreens', 'artifacts'],
      properties: {
        totalRequirements: { type: 'number' },
        screensIdentified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              screenName: { type: 'string' },
              purpose: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              deviceTypes: { type: 'array', items: { type: 'string' } },
              requirementIds: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        contentTypes: { type: 'array', items: { type: 'string' } },
        interactionPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              screens: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'string', enum: ['simple', 'moderate', 'complex'] }
            }
          }
        },
        prioritizedScreens: {
          type: 'object',
          properties: {
            critical: { type: 'array', items: { type: 'string' } },
            high: { type: 'array', items: { type: 'string' } },
            medium: { type: 'array', items: { type: 'string' } },
            low: { type: 'array', items: { type: 'string' } }
          }
        },
        deviceConsiderations: {
          type: 'object',
          properties: {
            approach: { type: 'string', enum: ['responsive', 'adaptive', 'mobile-first', 'desktop-first'] },
            breakpoints: { type: 'array', items: { type: 'string' } },
            specialConsiderations: { type: 'array', items: { type: 'string' } }
          }
        },
        ambiguousRequirements: { type: 'array', items: { type: 'string' } },
        estimatedEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wireframing', 'requirements-analysis']
}));

// Task 2: Information Architecture Definition
export const informationArchitectureTask = defineTask('information-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define information architecture and content hierarchy',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'senior information architect',
      task: 'Design comprehensive information architecture including sitemap, navigation structure, and content hierarchy for wireframes',
      context: args,
      instructions: [
        'Create sitemap showing all screens and their hierarchical relationships',
        'Define primary navigation structure (global nav, main menu)',
        'Define secondary navigation patterns (breadcrumbs, tabs, sidebars)',
        'Establish content hierarchy for each screen type',
        'Define labeling and nomenclature standards',
        'Identify cross-linking opportunities between screens',
        'Plan for scalability (future content, features)',
        'Consider mental models and user expectations',
        'Define search and filtering architecture if applicable',
        'Create navigation flow diagrams',
        'Document IA rationale and design decisions',
        'Generate comprehensive IA documentation'
      ],
      outputFormat: 'JSON with sitemap (object), navigationStructure (object), contentHierarchy (object), labelingStandards (array), crossLinks (array), scalabilityConsiderations (array), rationale (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sitemap', 'navigationStructure', 'contentHierarchy', 'artifacts'],
      properties: {
        sitemap: {
          type: 'object',
          properties: {
            rootPages: { type: 'array', items: { type: 'object' } },
            depth: { type: 'number' },
            totalPages: { type: 'number' }
          }
        },
        navigationStructure: {
          type: 'object',
          properties: {
            primaryNavigation: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  target: { type: 'string' },
                  children: { type: 'array' }
                }
              }
            },
            secondaryNavigation: { type: 'array' },
            utilityNavigation: { type: 'array' }
          }
        },
        contentHierarchy: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              screen: { type: 'string' },
              primaryContent: { type: 'array', items: { type: 'string' } },
              secondaryContent: { type: 'array', items: { type: 'string' } },
              supportingContent: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        labelingStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              label: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        crossLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        scalabilityConsiderations: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wireframing', 'information-architecture']
}));

// Task 3: User Flow Mapping
export const userFlowMappingTask = defineTask('user-flow-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map user flows and interaction paths',
  agent: {
    name: 'user-flow-designer',
    prompt: {
      role: 'senior UX designer specializing in user flows',
      task: 'Create detailed user flow diagrams showing how users navigate through screens to complete key tasks',
      context: args,
      instructions: [
        'Identify all critical user journeys from requirements',
        'Map entry points for each user flow (homepage, deep links, search)',
        'Document step-by-step paths through screens',
        'Identify decision points, branches, and alternate paths',
        'Include error states, edge cases, and failure scenarios',
        'Show success states and completion points',
        'Identify opportunities for shortcuts or optimized paths',
        'Consider first-time vs returning user flows',
        'Map authentication/authorization touchpoints',
        'Include system-initiated flows (notifications, emails)',
        'Create swimlane diagrams for complex multi-actor flows',
        'Generate user flow diagrams (visual flowcharts)',
        'Document flow assumptions and constraints'
      ],
      outputFormat: 'JSON with flowDiagrams (array), criticalPaths (array), decisionPoints (array), errorHandling (object), entryPoints (array), exitPoints (array), optimizationOpportunities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['flowDiagrams', 'criticalPaths', 'artifacts'],
      properties: {
        flowDiagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              flowName: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stepNumber: { type: 'number' },
                    screen: { type: 'string' },
                    action: { type: 'string' },
                    outcome: { type: 'string' }
                  }
                }
              },
              diagramPath: { type: 'string' }
            }
          }
        },
        criticalPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pathName: { type: 'string' },
              screens: { type: 'array', items: { type: 'string' } },
              expectedTime: { type: 'string' },
              conversionGoal: { type: 'string' }
            }
          }
        },
        decisionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              decision: { type: 'string' },
              branches: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        errorHandling: {
          type: 'object',
          properties: {
            errorScenarios: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  screen: { type: 'string' },
                  recovery: { type: 'string' }
                }
              }
            }
          }
        },
        entryPoints: { type: 'array', items: { type: 'string' } },
        exitPoints: { type: 'array', items: { type: 'string' } },
        optimizationOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wireframing', 'user-flows']
}));

// Task 4: Low-Fidelity Wireframe Creation
export const lowFidelityWireframeTask = defineTask('low-fidelity-wireframes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create low-fidelity wireframes',
  agent: {
    name: 'wireframe-designer',
    prompt: {
      role: 'senior UX designer specializing in wireframing',
      task: 'Create low-fidelity wireframes focusing on layout, information hierarchy, and functionality without detailed visual design',
      context: args,
      instructions: [
        'Create wireframes for all prioritized screens (critical and high priority first)',
        'Use gray boxes, placeholder text, and simple shapes',
        'Focus on layout structure: header, navigation, content areas, sidebar, footer',
        'Establish visual hierarchy using size, position, and grouping',
        'Include all functional elements: buttons, forms, links, navigation',
        'Show content placeholders with descriptive labels',
        'Indicate interactive elements and their states (default, hover, active, disabled)',
        'Include responsive breakpoints for mobile, tablet, desktop',
        'Use consistent spacing and alignment across screens',
        'Show navigation patterns and how they work',
        'Include annotations for unclear elements',
        'Maintain consistency with design principles',
        'Generate wireframe files (SVG, PNG, or design tool format)',
        'Create wireframe index/inventory document'
      ],
      outputFormat: 'JSON with wireframes (array), totalScreens (number), layoutPatterns (array), componentInventory (array), responsiveNotes (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['wireframes', 'totalScreens', 'componentInventory', 'artifacts'],
      properties: {
        wireframes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              screenName: { type: 'string' },
              deviceType: { type: 'string' },
              priority: { type: 'string' },
              wireframePath: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' }
            }
          }
        },
        totalScreens: { type: 'number' },
        layoutPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              description: { type: 'string' },
              usedIn: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        componentInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              type: { type: 'string' },
              frequency: { type: 'number' },
              screens: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        responsiveNotes: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            breakpoints: { type: 'array', items: { type: 'string' } },
            adaptiveChanges: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wireframing', 'low-fidelity']
}));

// Task 5: Wireframe Review
export const wireframeReviewTask = defineTask('wireframe-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review and score wireframes',
  agent: {
    name: 'ux-reviewer',
    prompt: {
      role: 'senior UX auditor and usability expert',
      task: 'Review wireframes for usability, consistency, completeness, and alignment with requirements',
      context: args,
      instructions: [
        'Evaluate requirement coverage: all requirements wireframed (weight: 25%)',
        'Assess information hierarchy clarity and effectiveness (weight: 20%)',
        'Review navigation consistency and intuitiveness (weight: 20%)',
        'Evaluate user flow completeness and logical progression (weight: 15%)',
        'Check consistency across screens (layouts, patterns, spacing) (weight: 10%)',
        'Assess responsive design considerations (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify strengths and successful design patterns',
        'Identify improvement areas and missing elements',
        'Flag critical issues blocking user tasks',
        'Provide specific, actionable recommendations',
        'Compare with previous iteration if applicable'
      ],
      outputFormat: 'JSON with reviewScore (number 0-100), componentScores (object), strengths (array), improvementAreas (array), criticalIssues (array), recommendations (array), requirementsCovered (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        reviewScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            requirementCoverage: { type: 'number' },
            informationHierarchy: { type: 'number' },
            navigationConsistency: { type: 'number' },
            userFlowCompleteness: { type: 'number' },
            crossScreenConsistency: { type: 'number' },
            responsiveDesign: { type: 'number' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        improvementAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'moderate', 'major'] },
              recommendation: { type: 'string' }
            }
          }
        },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              impact: { type: 'string' },
              screen: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        requirementsCovered: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wireframing', 'review']
}));

// Task 6: Medium-Fidelity Wireframe Refinement
export const mediumFidelityWireframeTask = defineTask('medium-fidelity-wireframes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine to medium-fidelity wireframes',
  agent: {
    name: 'wireframe-refiner',
    prompt: {
      role: 'senior UX designer',
      task: 'Enhance low-fidelity wireframes to medium-fidelity with more detail, realistic content, and refined interactions',
      context: args,
      instructions: [
        'Incorporate feedback from low-fidelity review',
        'Add more detailed content structure (headings, body text, captions)',
        'Use realistic text length and content examples',
        'Refine component details (button labels, form fields, microcopy)',
        'Add interaction states (hover, focus, error, success)',
        'Include icon placeholders with descriptions',
        'Show data patterns (lists, tables, cards, grids)',
        'Add more detailed navigation elements',
        'Refine spacing and alignment for visual polish',
        'Show loading states and empty states',
        'Include modal, tooltip, and overlay patterns',
        'Ensure all critical user flows are well-represented',
        'Maintain responsive considerations',
        'Generate refined wireframe files'
      ],
      outputFormat: 'JSON with wireframes (array), totalScreens (number), refinedComponents (array), interactionStates (object), improvementsApplied (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['wireframes', 'totalScreens', 'refinedComponents', 'artifacts'],
      properties: {
        wireframes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              screenName: { type: 'string' },
              deviceType: { type: 'string' },
              priority: { type: 'string' },
              wireframePath: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } },
              interactionStates: { type: 'array', items: { type: 'string' } },
              changesFromLowFi: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' }
            }
          }
        },
        totalScreens: { type: 'number' },
        refinedComponents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              refinements: { type: 'array', items: { type: 'string' } },
              screens: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        interactionStates: {
          type: 'object',
          properties: {
            statesDocumented: { type: 'array', items: { type: 'string' } },
            components: { type: 'array', items: { type: 'string' } }
          }
        },
        improvementsApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              improvement: { type: 'string' },
              screens: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wireframing', 'medium-fidelity']
}));

// Task 7: Annotation Generation
export const annotationGenerationTask = defineTask('annotation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create annotations and documentation',
  agent: {
    name: 'ux-documenter',
    prompt: {
      role: 'senior UX designer and technical writer',
      task: 'Create comprehensive annotations documenting functionality, interactions, business rules, and edge cases for each wireframe',
      context: args,
      instructions: [
        'Annotate each screen with functional specifications',
        'Document interaction behaviors (clicks, hovers, gestures)',
        'Specify form validation rules and error messages',
        'Document dynamic content and data sources',
        'Describe conditional logic and business rules',
        'Specify responsive behavior changes by breakpoint',
        'Document accessibility considerations (ARIA, keyboard nav, screen reader)',
        'Include microcopy and content guidance',
        'Document API requirements and data dependencies',
        'Specify loading, error, and empty states',
        'Include cross-references to user flows',
        'Document assumptions and open questions',
        'Generate annotation document for each screen',
        'Create master annotation index'
      ],
      outputFormat: 'JSON with annotations (array), annotationIndex (object), openQuestions (array), accessibilityNotes (array), technicalRequirements (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['annotations', 'annotationIndex', 'artifacts'],
      properties: {
        annotations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              screenName: { type: 'string' },
              annotationPath: { type: 'string' },
              functionalSpec: { type: 'string' },
              interactions: { type: 'array', items: { type: 'string' } },
              validationRules: { type: 'array', items: { type: 'string' } },
              businessRules: { type: 'array', items: { type: 'string' } },
              accessibilityRequirements: { type: 'array', items: { type: 'string' } },
              technicalNotes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        annotationIndex: {
          type: 'object',
          properties: {
            totalAnnotations: { type: 'number' },
            indexPath: { type: 'string' }
          }
        },
        openQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              screen: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        accessibilityNotes: { type: 'array', items: { type: 'string' } },
        technicalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              screens: { type: 'array', items: { type: 'string' } },
              type: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wireframing', 'annotation']
}));

// Task 8: Interactive Prototype Creation (optional)
export const interactivePrototypeTask = defineTask('interactive-prototype', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create interactive clickable prototype',
  agent: {
    name: 'prototype-builder',
    prompt: {
      role: 'senior UX prototyper',
      task: 'Create interactive clickable prototype linking wireframes to demonstrate user flows and interactions',
      context: args,
      instructions: [
        'Link all wireframes to create navigable prototype',
        'Implement primary user flows with click-through navigation',
        'Add interactive hotspots for buttons, links, navigation elements',
        'Include transitions between screens (instant, fade, slide)',
        'Implement form interactions (field focus, validation feedback)',
        'Show hover states for interactive elements',
        'Implement modal and overlay behaviors',
        'Add back button and navigation history',
        'Include starting point and success endpoints',
        'Test all critical user flows for completeness',
        'Generate shareable prototype URL or file',
        'Create prototype usage guide with instructions'
      ],
      outputFormat: 'JSON with prototypeUrl (string), linkedScreens (number), implementedFlows (array), interactiveElements (number), usageGuide (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prototypeUrl', 'linkedScreens', 'implementedFlows', 'artifacts'],
      properties: {
        prototypeUrl: { type: 'string' },
        linkedScreens: { type: 'number' },
        implementedFlows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              flowName: { type: 'string' },
              startScreen: { type: 'string' },
              endScreen: { type: 'string' },
              stepCount: { type: 'number' }
            }
          }
        },
        interactiveElements: { type: 'number' },
        transitionTypes: { type: 'array', items: { type: 'string' } },
        usageGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wireframing', 'prototype']
}));

// Task 9: Wireframe Package Generation
export const wireframePackageGenerationTask = defineTask('wireframe-package-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive wireframe documentation package',
  agent: {
    name: 'wireframe-packager',
    prompt: {
      role: 'senior UX designer and technical writer',
      task: 'Compile comprehensive wireframe documentation package with all deliverables, context, and handoff materials',
      context: args,
      instructions: [
        'Create executive summary of wireframing process and outcomes',
        'Include project overview and design objectives',
        'Document information architecture (sitemap, navigation)',
        'Include user flow diagrams with descriptions',
        'Compile all wireframes organized by priority and device type',
        'Include all annotations and functional specifications',
        'Add interactive prototype link and usage instructions',
        'Document design decisions and rationale',
        'Include component inventory and pattern library',
        'Add responsive design strategy and breakpoints',
        'Document accessibility considerations',
        'Include next steps and recommendations',
        'Create index with links to all artifacts',
        'Format as professional deliverable ready for stakeholders',
        'Generate master wireframe package document'
      ],
      outputFormat: 'JSON with packagePath (string), executiveSummary (string), tableOfContents (array), deliverables (array), nextSteps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'executiveSummary', 'deliverables', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        executiveSummary: { type: 'string' },
        tableOfContents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              subsections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        deliverables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              deliverable: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        designDecisions: { type: 'array', items: { type: 'string' } },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wireframing', 'documentation']
}));

// Task 10: Quality Validation
export const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate wireframe quality and completeness',
  agent: {
    name: 'quality-validator',
    prompt: {
      role: 'principal UX architect and quality auditor',
      task: 'Assess overall wireframe quality, completeness, and readiness for visual design phase',
      context: args,
      instructions: [
        'Evaluate requirement coverage: all requirements addressed (weight: 25%)',
        'Assess user flow completeness: all critical paths wireframed (weight: 20%)',
        'Review information architecture effectiveness (weight: 15%)',
        'Evaluate usability: intuitive navigation, clear hierarchy (weight: 20%)',
        'Assess accessibility considerations and WCAG alignment (weight: 10%)',
        'Review consistency across screens and patterns (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Validate annotations completeness and clarity',
        'Check for missing screens or incomplete flows',
        'Identify blockers for next phase (visual design)',
        'Provide recommendations for improvement',
        'Assess stakeholder approval readiness'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), requirementsCoverage (number), userFlowCompleteness (number), usabilityScore (number), accessibilityScore (number), blockers (array), recommendations (array), readiness (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'requirementsCoverage', 'usabilityScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            requirementCoverage: { type: 'number' },
            userFlowCompleteness: { type: 'number' },
            informationArchitecture: { type: 'number' },
            usability: { type: 'number' },
            accessibility: { type: 'number' },
            consistency: { type: 'number' }
          }
        },
        requirementsCoverage: { type: 'number', minimum: 0, maximum: 100 },
        userFlowCompleteness: { type: 'number', minimum: 0, maximum: 100 },
        usabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        accessibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        completenessChecks: {
          type: 'object',
          properties: {
            allRequirementsCovered: { type: 'boolean' },
            allCriticalFlowsComplete: { type: 'boolean' },
            annotationsComplete: { type: 'boolean' },
            responsiveDesignAddressed: { type: 'boolean' },
            accessibilityConsidered: { type: 'boolean' }
          }
        },
        blockers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              blocker: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              resolution: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        readiness: { type: 'string', enum: ['ready', 'minor-issues', 'major-issues'] },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'wireframing', 'validation', 'quality-scoring']
}));

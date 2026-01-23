/**
 * @process technical-documentation/user-guide-docs
 * @description User Guide and Getting Started Documentation process with content discovery, structure design, progressive tutorial creation, quality validation, and publication workflow using Diataxis framework
 * @inputs { product: string, targetAudience: string, features: array, existingDocs: string, outputDir: string, framework: string, sections: array, includeInteractive: boolean }
 * @outputs { success: boolean, documentationPath: string, sections: array, qualityScore: number, artifacts: array, metadata: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    product = '',
    targetAudience = 'general users',
    features = [],
    existingDocs = '',
    outputDir = 'user-guide-output',
    framework = 'diataxis', // diataxis, standard, custom
    sections = ['getting-started', 'features', 'tutorials', 'faq', 'troubleshooting', 'glossary'],
    includeInteractive = false,
    requireApproval = true,
    styleGuide = 'default'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting User Guide and Getting Started Documentation Process');

  // ============================================================================
  // PHASE 1: DISCOVERY AND REQUIREMENTS GATHERING
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovery and requirements gathering');
  const discovery = await ctx.task(discoveryAnalysisTask, {
    product,
    targetAudience,
    features,
    existingDocs,
    outputDir
  });

  artifacts.push(...discovery.artifacts);

  if (!discovery.hasAdequateInformation) {
    ctx.log('warn', 'Insufficient information to create comprehensive documentation');
    return {
      success: false,
      reason: 'Insufficient information',
      missingInformation: discovery.missingInformation,
      recommendations: discovery.recommendations,
      metadata: {
        processId: 'technical-documentation/user-guide-docs',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: AUDIENCE ANALYSIS AND PERSONAS
  // ============================================================================

  ctx.log('info', 'Phase 2: Audience analysis and persona development');
  const audienceAnalysis = await ctx.task(audienceAnalysisTask, {
    targetAudience,
    product,
    features: discovery.refinedFeatures,
    userJourneys: discovery.userJourneys || [],
    outputDir
  });

  artifacts.push(...audienceAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: INFORMATION ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing information architecture');
  const iaDesign = await ctx.task(informationArchitectureTask, {
    product,
    features: discovery.refinedFeatures,
    sections,
    framework,
    personas: audienceAnalysis.personas,
    userJourneys: audienceAnalysis.userJourneys,
    outputDir
  });

  artifacts.push(...iaDesign.artifacts);

  // Breakpoint: Review information architecture
  await ctx.breakpoint({
    question: `Information architecture designed with ${iaDesign.sections.length} sections and ${iaDesign.topics.length} topics. Review structure?`,
    title: 'IA Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        product,
        sections: iaDesign.sections.length,
        topics: iaDesign.topics.length,
        framework,
        navigationDepth: iaDesign.navigationDepth
      }
    }
  });

  // ============================================================================
  // PHASE 4: GETTING STARTED GUIDE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating getting started guide');
  const gettingStarted = await ctx.task(gettingStartedTask, {
    product,
    features: discovery.refinedFeatures,
    personas: audienceAnalysis.personas,
    prerequisites: discovery.prerequisites || [],
    installationSteps: discovery.installationSteps || [],
    quickWins: discovery.quickWins || [],
    outputDir
  });

  artifacts.push(...gettingStarted.artifacts);

  // ============================================================================
  // PHASE 5: FEATURE GUIDES CREATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating feature guides');
  const featureGuides = await ctx.task(featureGuidesTask, {
    product,
    features: discovery.refinedFeatures,
    framework,
    personas: audienceAnalysis.personas,
    iaStructure: iaDesign.structure,
    outputDir
  });

  artifacts.push(...featureGuides.artifacts);

  // ============================================================================
  // PHASE 6: TUTORIALS CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating step-by-step tutorials');
  const tutorials = await ctx.task(tutorialsCreationTask, {
    product,
    features: discovery.refinedFeatures,
    framework,
    personas: audienceAnalysis.personas,
    learningPaths: audienceAnalysis.learningPaths || [],
    includeInteractive,
    outputDir
  });

  artifacts.push(...tutorials.artifacts);

  // ============================================================================
  // PHASE 7: FAQ AND TROUBLESHOOTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating FAQ and troubleshooting guides');
  const faqTroubleshooting = await ctx.task(faqTroubleshootingTask, {
    product,
    features: discovery.refinedFeatures,
    commonIssues: discovery.commonIssues || [],
    supportTickets: discovery.supportTickets || [],
    outputDir
  });

  artifacts.push(...faqTroubleshooting.artifacts);

  // ============================================================================
  // PHASE 8: GLOSSARY AND REFERENCE
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating glossary and reference materials');
  const glossaryReference = await ctx.task(glossaryReferenceTask, {
    product,
    features: discovery.refinedFeatures,
    terminology: discovery.terminology || [],
    concepts: discovery.concepts || [],
    outputDir
  });

  artifacts.push(...glossaryReference.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY VALIDATION AND SCORING
  // ============================================================================

  ctx.log('info', 'Phase 9: Validating documentation quality');
  const qualityValidation = await ctx.task(qualityValidationTask, {
    product,
    sections: iaDesign.sections,
    artifacts,
    styleGuide,
    framework,
    targetAudience,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityMet = qualityValidation.overallScore >= 80;

  // Breakpoint: Review quality validation
  await ctx.breakpoint({
    question: `Documentation quality score: ${qualityValidation.overallScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Quality may need improvement.'} Review documentation?`,
    title: 'Quality Validation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore: qualityValidation.overallScore,
        qualityMet,
        sectionsCompleted: iaDesign.sections.length,
        tutorialsCreated: tutorials.tutorialCount,
        faqCount: faqTroubleshooting.faqCount,
        glossaryTerms: glossaryReference.termCount
      }
    }
  });

  // ============================================================================
  // PHASE 10: PEER REVIEW AND TECHNICAL ACCURACY
  // ============================================================================

  let reviewedDocs = artifacts;
  let reviewResult = null;

  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting peer review');
    reviewResult = await ctx.task(peerReviewTask, {
      product,
      artifacts,
      sections: iaDesign.sections,
      personas: audienceAnalysis.personas,
      qualityScore: qualityValidation,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Review approval gate
    await ctx.breakpoint({
      question: `Documentation review complete. ${reviewResult.approved ? 'Approved by reviewers!' : 'Requires revisions.'} Proceed with refinement and publication?`,
      title: 'Documentation Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          reviewersCount: reviewResult.reviewers.length,
          feedbackItems: reviewResult.feedback.length,
          revisionsNeeded: reviewResult.revisionsNeeded,
          criticalIssues: reviewResult.criticalIssues || 0
        }
      }
    });

    // If revisions needed, incorporate feedback
    if (reviewResult.revisionsNeeded && reviewResult.approved) {
      ctx.log('info', 'Incorporating review feedback');
      const revision = await ctx.task(revisionTask, {
        product,
        artifacts,
        feedback: reviewResult.feedback,
        sections: iaDesign.sections,
        outputDir
      });
      reviewedDocs = revision.updatedArtifacts;
      artifacts.push(...revision.artifacts);
    }
  }

  // ============================================================================
  // PHASE 11: NAVIGATION AND SEARCH SETUP
  // ============================================================================

  ctx.log('info', 'Phase 11: Setting up navigation and search');
  const navigationSearch = await ctx.task(navigationSearchTask, {
    product,
    sections: iaDesign.sections,
    structure: iaDesign.structure,
    artifacts: reviewedDocs,
    outputDir
  });

  artifacts.push(...navigationSearch.artifacts);

  // ============================================================================
  // PHASE 12: PUBLICATION AND DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Publishing documentation');
  const publication = await ctx.task(publicationTask, {
    product,
    artifacts: reviewedDocs,
    sections: iaDesign.sections,
    navigationConfig: navigationSearch.navigationConfig,
    searchConfig: navigationSearch.searchConfig,
    outputDir
  });

  artifacts.push(...publication.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    product,
    documentationPath: publication.publishedPath,
    sections: iaDesign.sections,
    qualityScore: qualityValidation.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    statistics: {
      sections: iaDesign.sections.length,
      topics: iaDesign.topics.length,
      tutorials: tutorials.tutorialCount,
      howToGuides: featureGuides.guideCount,
      faqItems: faqTroubleshooting.faqCount,
      troubleshootingGuides: faqTroubleshooting.troubleshootingCount,
      glossaryTerms: glossaryReference.termCount,
      totalPages: publication.pageCount,
      estimatedReadTime: publication.totalReadTime
    },
    artifacts,
    duration,
    metadata: {
      processId: 'technical-documentation/user-guide-docs',
      timestamp: startTime,
      outputDir,
      framework,
      targetAudience,
      styleGuide
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Discovery and Requirements Analysis
export const discoveryAnalysisTask = defineTask('discovery-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze product and gather requirements',
  agent: {
    name: 'technical-documentation-analyst',
    prompt: {
      role: 'senior technical documentation analyst and product expert',
      task: 'Analyze product features, target audience, and gather requirements for comprehensive user documentation',
      context: args,
      instructions: [
        'Review product description and existing documentation',
        'Analyze feature list and categorize by complexity and importance',
        'Identify target audience segments and their documentation needs',
        'Determine prerequisites (software, accounts, knowledge level)',
        'Identify installation/setup steps required',
        'Discover quick win scenarios (what users can accomplish quickly)',
        'Map common user journeys (getting started → mastery)',
        'Identify common issues and pain points from existing docs/tickets',
        'Extract key terminology and concepts needing explanation',
        'Assess adequacy of information for creating complete documentation',
        'List any missing information needed',
        'Provide recommendations for documentation scope and approach',
        'Save discovery analysis to output directory'
      ],
      outputFormat: 'JSON with hasAdequateInformation (boolean), refinedFeatures (array), prerequisites (array), installationSteps (array), quickWins (array), userJourneys (array), commonIssues (array), terminology (array), concepts (array), missingInformation (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasAdequateInformation', 'refinedFeatures', 'artifacts'],
      properties: {
        hasAdequateInformation: { type: 'boolean' },
        refinedFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              complexity: { type: 'string', enum: ['basic', 'intermediate', 'advanced'] },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              userValue: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        prerequisites: { type: 'array', items: { type: 'string' } },
        installationSteps: { type: 'array', items: { type: 'string' } },
        quickWins: { type: 'array', items: { type: 'string' } },
        userJourneys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              persona: { type: 'string' },
              goal: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        commonIssues: { type: 'array', items: { type: 'string' } },
        supportTickets: { type: 'array', items: { type: 'string' } },
        terminology: { type: 'array', items: { type: 'string' } },
        concepts: { type: 'array', items: { type: 'string' } },
        missingInformation: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'discovery']
}));

// Task 2: Audience Analysis and Personas
export const audienceAnalysisTask = defineTask('audience-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze target audience and create personas',
  agent: {
    name: 'user-experience-researcher',
    prompt: {
      role: 'UX researcher and documentation strategist',
      task: 'Analyze target audience and create detailed user personas for documentation',
      context: args,
      instructions: [
        'Segment target audience by experience level, role, and use case',
        'Create 2-4 primary personas with:',
        '  - Name and role',
        '  - Experience level (beginner, intermediate, expert)',
        '  - Goals and motivations',
        '  - Pain points and challenges',
        '  - Preferred learning style',
        '  - Documentation needs',
        'Map user journeys for each persona',
        'Identify learning paths (beginner → intermediate → advanced)',
        'Determine content depth and complexity for each audience segment',
        'Define progressive disclosure strategy (what to show when)',
        'Identify persona-specific documentation requirements',
        'Save audience analysis and personas to output directory'
      ],
      outputFormat: 'JSON with personas (array), audienceSegments (array), learningPaths (array), userJourneys (array), progressiveDisclosureStrategy (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['personas', 'learningPaths', 'userJourneys', 'artifacts'],
      properties: {
        personas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              experienceLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
              goals: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } },
              learningStyle: { type: 'string' },
              documentationNeeds: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        audienceSegments: { type: 'array', items: { type: 'string' } },
        learningPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              stages: { type: 'array', items: { type: 'string' } },
              topics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        userJourneys: { type: 'array' },
        progressiveDisclosureStrategy: {
          type: 'object',
          properties: {
            beginner: { type: 'array', items: { type: 'string' } },
            intermediate: { type: 'array', items: { type: 'string' } },
            advanced: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'documentation', 'ux-research', 'personas']
}));

// Task 3: Information Architecture Design
export const informationArchitectureTask = defineTask('information-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design information architecture and structure',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'information architect and documentation strategist',
      task: 'Design comprehensive information architecture using Diataxis framework',
      context: args,
      instructions: [
        'Apply Diataxis framework to organize content:',
        '  - Tutorials (learning-oriented): step-by-step lessons for beginners',
        '  - How-to guides (task-oriented): solutions to specific problems',
        '  - Reference (information-oriented): technical descriptions and specs',
        '  - Explanation (understanding-oriented): concepts and background',
        'Design hierarchical structure with clear navigation paths',
        'Create section hierarchy (Level 1, Level 2, Level 3)',
        'Define topics and subtopics for each section',
        'Design navigation menu structure',
        'Plan breadcrumb navigation',
        'Create sitemap and page hierarchy',
        'Define cross-references and related links strategy',
        'Optimize for findability and discoverability',
        'Save IA design, sitemap, and navigation structure to output directory'
      ],
      outputFormat: 'JSON with structure (object), sections (array), topics (array), navigationDepth (number), sitemap (object), navigationMenu (array), breadcrumbStrategy (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'sections', 'topics', 'navigationDepth', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            tutorials: { type: 'array', items: { type: 'string' } },
            howToGuides: { type: 'array', items: { type: 'string' } },
            reference: { type: 'array', items: { type: 'string' } },
            explanation: { type: 'array', items: { type: 'string' } }
          }
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] },
              topics: { type: 'array', items: { type: 'string' } },
              order: { type: 'number' }
            }
          }
        },
        topics: { type: 'array', items: { type: 'string' } },
        navigationDepth: { type: 'number' },
        sitemap: { type: 'object' },
        navigationMenu: { type: 'array' },
        breadcrumbStrategy: { type: 'object' },
        crossReferencingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'information-architecture']
}));

// Task 4: Getting Started Guide Creation
export const gettingStartedTask = defineTask('getting-started-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create getting started and quickstart guide',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer specializing in onboarding documentation',
      task: 'Create comprehensive getting started guide with quickstart path',
      context: args,
      instructions: [
        'Write engaging introduction explaining what product does and key benefits',
        'Document prerequisites clearly (required software, accounts, knowledge)',
        'Create step-by-step installation guide with:',
        '  - Multiple installation methods (if applicable)',
        '  - Platform-specific instructions',
        '  - Verification steps',
        '  - Troubleshooting common installation issues',
        'Build quickstart tutorial (5-10 minutes) showing immediate value:',
        '  - Simple end-to-end example',
        '  - Expected outcome clearly stated',
        '  - Next steps for further learning',
        'Include "Hello World" or equivalent first example',
        'Add configuration guide for initial setup',
        'Provide clear success criteria (how to verify it works)',
        'Link to next learning resources',
        'Use conversational, encouraging tone for beginners',
        'Add screenshots, code examples, and visual aids',
        'Save getting started guide to output directory'
      ],
      outputFormat: 'JSON with gettingStartedDoc (string - markdown), quickstartDoc (string - markdown), installationGuide (string), successCriteria (array), nextSteps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gettingStartedDoc', 'quickstartDoc', 'artifacts'],
      properties: {
        gettingStartedDoc: { type: 'string' },
        quickstartDoc: { type: 'string' },
        installationGuide: { type: 'string' },
        configurationGuide: { type: 'string' },
        successCriteria: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        estimatedTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'getting-started', 'onboarding']
}));

// Task 5: Feature Guides Creation
export const featureGuidesTask = defineTask('feature-guides', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create feature guides and how-to documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer specializing in task-oriented documentation',
      task: 'Create comprehensive feature guides and task-oriented how-to documentation',
      context: args,
      instructions: [
        'For each feature, create structured documentation with:',
        '  - Feature overview (what it is, why use it)',
        '  - Use cases and scenarios',
        '  - Step-by-step instructions',
        '  - Configuration options and parameters',
        '  - Code examples and best practices',
        '  - Common pitfalls and troubleshooting',
        'Write task-oriented how-to guides focused on specific goals:',
        '  - Clear problem statement',
        '  - Prerequisites and assumptions',
        '  - Step-by-step solution',
        '  - Expected results',
        '  - Variations and alternatives',
        'Organize by user tasks, not implementation details',
        'Use imperative voice ("Do this", not "You can do this")',
        'Include practical examples from real-world scenarios',
        'Add cross-references to related features',
        'Optimize for scannability (headings, bullets, code blocks)',
        'Save feature guides to output directory'
      ],
      outputFormat: 'JSON with featureGuides (array of objects with name and content), howToGuides (array), guideCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['featureGuides', 'howToGuides', 'guideCount', 'artifacts'],
      properties: {
        featureGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              overview: { type: 'string' },
              useCases: { type: 'array', items: { type: 'string' } },
              documentation: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              relatedFeatures: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        howToGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              problem: { type: 'string' },
              solution: { type: 'string' },
              prerequisites: { type: 'array', items: { type: 'string' } },
              steps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        guideCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'feature-guides', 'how-to']
}));

// Task 6: Tutorials Creation
export const tutorialsCreationTask = defineTask('tutorials-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create step-by-step tutorials',
  agent: {
    name: 'instructional-designer',
    prompt: {
      role: 'instructional designer and technical educator',
      task: 'Create learning-oriented tutorials following educational best practices',
      context: args,
      instructions: [
        'Create progressive tutorials from beginner to advanced',
        'Each tutorial should be:',
        '  - Learning-oriented (teaching concepts, not solving problems)',
        '  - Safe to fail (learner can\'t break anything)',
        '  - Hands-on and practical',
        '  - Repeatable with same results',
        '  - Complete and self-contained',
        'Structure each tutorial with:',
        '  - Learning objectives (what learner will accomplish)',
        '  - Time estimate',
        '  - Prerequisites and required knowledge',
        '  - Step-by-step instructions with explanations',
        '  - Checkpoints to verify progress',
        '  - Summary of what was learned',
        '  - Next steps and further reading',
        'Use narrative style ("Now we will...", "Let\'s try...")',
        'Explain the "why" behind each step, not just the "how"',
        'Build confidence through progressive complexity',
        'If includeInteractive=true, design interactive components:',
        '  - Code playgrounds',
        '  - Try-it-yourself exercises',
        '  - Embedded demos',
        'Save tutorials to output directory'
      ],
      outputFormat: 'JSON with tutorials (array of objects), tutorialCount (number), learningPaths (array), interactiveComponents (array if applicable), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tutorials', 'tutorialCount', 'artifacts'],
      properties: {
        tutorials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
              objectives: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              prerequisites: { type: 'array', items: { type: 'string' } },
              content: { type: 'string' },
              checkpoints: { type: 'array', items: { type: 'string' } },
              summary: { type: 'string' },
              nextSteps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        tutorialCount: { type: 'number' },
        learningPaths: { type: 'array' },
        interactiveComponents: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'tutorials', 'learning']
}));

// Task 7: FAQ and Troubleshooting
export const faqTroubleshootingTask = defineTask('faq-troubleshooting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create FAQ and troubleshooting guides',
  agent: {
    name: 'support-documentation-specialist',
    prompt: {
      role: 'support documentation specialist and problem-solver',
      task: 'Create comprehensive FAQ and troubleshooting documentation',
      context: args,
      instructions: [
        'Compile FAQ based on:',
        '  - Common questions from discovery',
        '  - Support tickets and issues',
        '  - Anticipated questions from new users',
        'Organize FAQ by category (Getting Started, Features, Troubleshooting, etc.)',
        'Write clear, concise answers with links to detailed documentation',
        'Use question-answer format optimized for search',
        'Create troubleshooting guides with:',
        '  - Symptom description',
        '  - Possible causes',
        '  - Step-by-step diagnosis',
        '  - Solutions (ordered by likelihood)',
        '  - When to contact support',
        'Include common error messages and their meanings',
        'Add debugging tips and diagnostic commands',
        'Create decision trees for complex troubleshooting',
        'Provide workarounds for known issues',
        'Link to related documentation and resources',
        'Save FAQ and troubleshooting guides to output directory'
      ],
      outputFormat: 'JSON with faqItems (array), faqCategories (array), faqCount (number), troubleshootingGuides (array), troubleshootingCount (number), commonErrors (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['faqItems', 'faqCount', 'troubleshootingGuides', 'troubleshootingCount', 'artifacts'],
      properties: {
        faqItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
              category: { type: 'string' },
              relatedLinks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        faqCategories: { type: 'array', items: { type: 'string' } },
        faqCount: { type: 'number' },
        troubleshootingGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              symptom: { type: 'string' },
              possibleCauses: { type: 'array', items: { type: 'string' } },
              solutions: { type: 'array', items: { type: 'string' } },
              preventionTips: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        troubleshootingCount: { type: 'number' },
        commonErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorMessage: { type: 'string' },
              meaning: { type: 'string' },
              solution: { type: 'string' }
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
  labels: ['agent', 'documentation', 'faq', 'troubleshooting']
}));

// Task 8: Glossary and Reference
export const glossaryReferenceTask = defineTask('glossary-reference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create glossary and reference materials',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer specializing in reference documentation',
      task: 'Create comprehensive glossary and reference materials',
      context: args,
      instructions: [
        'Create glossary of technical terms and concepts:',
        '  - Alphabetically organized',
        '  - Clear, concise definitions',
        '  - Context and usage examples',
        '  - Cross-references to related terms',
        '  - Links to detailed explanations',
        'Document technical specifications and reference information:',
        '  - Command reference (if CLI)',
        '  - Configuration options reference',
        '  - API endpoints (if applicable)',
        '  - Keyboard shortcuts',
        '  - Default values and limits',
        'Create conceptual explanations (understanding-oriented):',
        '  - Architecture overview',
        '  - Key concepts and how they relate',
        '  - Design philosophy and principles',
        '  - Background information',
        'Add visual aids (diagrams, flowcharts) for complex concepts',
        'Optimize for quick reference and lookup',
        'Save glossary and reference docs to output directory'
      ],
      outputFormat: 'JSON with glossaryTerms (array), termCount (number), referenceGuides (array), conceptualDocs (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['glossaryTerms', 'termCount', 'referenceGuides', 'artifacts'],
      properties: {
        glossaryTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              definition: { type: 'string' },
              example: { type: 'string' },
              relatedTerms: { type: 'array', items: { type: 'string' } },
              category: { type: 'string' }
            }
          }
        },
        termCount: { type: 'number' },
        referenceGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        conceptualDocs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              concept: { type: 'string' },
              explanation: { type: 'string' }
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
  labels: ['agent', 'documentation', 'glossary', 'reference']
}));

// Task 9: Quality Validation
export const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate documentation quality and completeness',
  agent: {
    name: 'documentation-quality-auditor',
    prompt: {
      role: 'principal documentation engineer and quality auditor',
      task: 'Assess documentation quality, completeness, accuracy, and usability',
      context: args,
      instructions: [
        'Evaluate Completeness (weight: 25%):',
        '  - All sections present and complete',
        '  - All features documented',
        '  - No gaps or missing information',
        '  - All user journeys covered',
        'Evaluate Clarity and Readability (weight: 25%):',
        '  - Clear, concise language',
        '  - Appropriate for target audience',
        '  - Good structure and organization',
        '  - Effective use of headings and formatting',
        'Evaluate Accuracy and Technical Correctness (weight: 25%):',
        '  - Technically accurate information',
        '  - Code examples work correctly',
        '  - Up-to-date with current product version',
        '  - Correct terminology used',
        'Evaluate Usability and Findability (weight: 15%):',
        '  - Good information architecture',
        '  - Effective navigation',
        '  - Searchable content',
        '  - Clear cross-references',
        'Evaluate Style Consistency (weight: 10%):',
        '  - Consistent voice and tone',
        '  - Follows style guide',
        '  - Consistent formatting',
        '  - Proper terminology usage',
        'Calculate weighted overall score (0-100)',
        'Identify gaps, errors, and improvement areas',
        'Check accessibility (alt text, heading structure, etc.)',
        'Validate links and references',
        'Assess estimated read times',
        'Provide specific improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completenessCheck (object), gaps (array), errors (array), recommendations (array), accessibilityScore (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            clarity: { type: 'number' },
            accuracy: { type: 'number' },
            usability: { type: 'number' },
            styleConsistency: { type: 'number' }
          }
        },
        completenessCheck: {
          type: 'object',
          properties: {
            hasGettingStarted: { type: 'boolean' },
            hasFeatureGuides: { type: 'boolean' },
            hasTutorials: { type: 'boolean' },
            hasFAQ: { type: 'boolean' },
            hasTroubleshooting: { type: 'boolean' },
            hasGlossary: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        accessibilityScore: { type: 'number' },
        brokenLinks: { type: 'array', items: { type: 'string' } },
        readabilityMetrics: {
          type: 'object',
          properties: {
            averageReadingLevel: { type: 'string' },
            totalReadTime: { type: 'string' }
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
  labels: ['agent', 'documentation', 'quality-validation']
}));

// Task 10: Peer Review
export const peerReviewTask = defineTask('peer-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct peer review and technical validation',
  agent: {
    name: 'documentation-review-team',
    prompt: {
      role: 'documentation review team including technical writers and subject matter experts',
      task: 'Conduct comprehensive peer review of documentation',
      context: args,
      instructions: [
        'Simulate peer review from multiple perspectives:',
        '  - Technical accuracy review (SME)',
        '  - Editorial review (senior technical writer)',
        '  - User experience review (UX)',
        '  - Accessibility review',
        'Validate technical correctness of all content',
        'Check code examples work as documented',
        'Verify instructions are clear and complete',
        'Assess appropriateness for target audience',
        'Review consistency with style guide',
        'Check for bias, assumptions, or unclear language',
        'Validate navigation and structure',
        'Test search and findability',
        'Gather feedback from each reviewer',
        'Categorize feedback by severity (critical, major, minor)',
        'Identify required revisions vs. suggestions',
        'Determine approval or rejection',
        'Document review outcome and revision requirements'
      ],
      outputFormat: 'JSON with approved (boolean), reviewers (array), feedback (array), revisionsNeeded (boolean), criticalIssues (number), majorIssues (number), minorIssues (number), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'reviewers', 'feedback', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        reviewers: { type: 'array', items: { type: 'string' } },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reviewer: { type: 'string' },
              section: { type: 'string' },
              comment: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor', 'suggestion'] },
              actionRequired: { type: 'boolean' }
            }
          }
        },
        revisionsNeeded: { type: 'boolean' },
        criticalIssues: { type: 'number' },
        majorIssues: { type: 'number' },
        minorIssues: { type: 'number' },
        technicalAccuracyVerified: { type: 'boolean' },
        accessibilityVerified: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'peer-review']
}));

// Task 11: Revision
export const revisionTask = defineTask('revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Incorporate review feedback and revise',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer',
      task: 'Incorporate peer review feedback and revise documentation',
      context: args,
      instructions: [
        'Review all feedback items by severity',
        'Address all critical issues (blockers)',
        'Address all major issues',
        'Incorporate minor suggestions where appropriate',
        'Maintain documentation structure and format',
        'Update affected sections and pages',
        'Fix technical inaccuracies',
        'Improve clarity where needed',
        'Add missing information',
        'Update cross-references if structure changed',
        'Document what changed and why',
        'Validate all changes',
        'Save revised documentation to output directory'
      ],
      outputFormat: 'JSON with updatedArtifacts (array), changesApplied (array), issuesAddressed (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedArtifacts', 'changesApplied', 'artifacts'],
      properties: {
        updatedArtifacts: { type: 'array' },
        changesApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              change: { type: 'string' },
              reason: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        issuesAddressed: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'revision']
}));

// Task 12: Navigation and Search Setup
export const navigationSearchTask = defineTask('navigation-search', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up navigation and search functionality',
  agent: {
    name: 'docs-platform-engineer',
    prompt: {
      role: 'documentation platform engineer',
      task: 'Configure navigation menu, breadcrumbs, search, and related content recommendations',
      context: args,
      instructions: [
        'Create navigation menu configuration:',
        '  - Main menu structure',
        '  - Sidebar navigation for each section',
        '  - Mobile-responsive navigation',
        '  - Previous/Next page links',
        'Configure breadcrumb navigation',
        'Set up search functionality:',
        '  - Index all content for search',
        '  - Configure search ranking/relevance',
        '  - Set up filters and facets',
        '  - Optimize search snippets',
        'Create related content recommendations',
        'Configure table of contents for long pages',
        'Set up "On this page" navigation',
        'Add "Was this helpful?" feedback mechanism',
        'Configure page metadata for SEO',
        'Save navigation and search configurations to output directory'
      ],
      outputFormat: 'JSON with navigationConfig (object), searchConfig (object), breadcrumbConfig (object), relatedContentRules (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['navigationConfig', 'searchConfig', 'artifacts'],
      properties: {
        navigationConfig: {
          type: 'object',
          properties: {
            mainMenu: { type: 'array' },
            sidebarSections: { type: 'object' },
            mobileNav: { type: 'object' }
          }
        },
        searchConfig: {
          type: 'object',
          properties: {
            indexedPages: { type: 'number' },
            filters: { type: 'array', items: { type: 'string' } },
            rankingCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        breadcrumbConfig: { type: 'object' },
        relatedContentRules: { type: 'array' },
        feedbackMechanism: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'navigation', 'search']
}));

// Task 13: Publication
export const publicationTask = defineTask('publication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Publish documentation',
  agent: {
    name: 'docs-publisher',
    prompt: {
      role: 'documentation publisher and release manager',
      task: 'Publish documentation to target platform and configure deployment',
      context: args,
      instructions: [
        'Organize all documentation files in final structure',
        'Generate table of contents and index pages',
        'Create landing page with documentation overview',
        'Configure documentation platform (Docusaurus, MkDocs, etc.)',
        'Set up versioning if applicable',
        'Configure custom domain if needed',
        'Set up analytics tracking',
        'Generate sitemap.xml for SEO',
        'Create robots.txt',
        'Simulate deployment to hosting (Netlify, Vercel, GitHub Pages, etc.)',
        'Document publication details (URL, deployment date)',
        'Create changelog entry',
        'Notify stakeholders of documentation release',
        'Save publication manifest and deployment info'
      ],
      outputFormat: 'JSON with publishedPath (string), deploymentUrl (string), pageCount (number), totalReadTime (string), publicationDate (string), notificationsSent (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['publishedPath', 'pageCount', 'publicationDate', 'artifacts'],
      properties: {
        publishedPath: { type: 'string' },
        deploymentUrl: { type: 'string' },
        pageCount: { type: 'number' },
        totalReadTime: { type: 'string' },
        publicationDate: { type: 'string' },
        analyticsConfigured: { type: 'boolean' },
        seoConfigured: { type: 'boolean' },
        notificationsSent: { type: 'array', items: { type: 'string' } },
        deploymentStatus: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'publication', 'deployment']
}));

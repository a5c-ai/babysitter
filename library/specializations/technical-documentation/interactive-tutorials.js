/**
 * @process technical-documentation/interactive-tutorials
 * @description Complete interactive tutorial and learning content creation process with code playgrounds, executable notebooks, and step-by-step walkthroughs for learning-oriented documentation
 * @inputs { topic: string, targetAudience: string, learningObjectives: array, prerequisites: array, technologies: array, tutorialFormat: string, outputDir: string }
 * @outputs { success: boolean, tutorialFiles: array, playgroundLinks: array, notebookFiles: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    topic = 'Technical Topic',
    targetAudience = 'beginner',
    learningObjectives = [],
    prerequisites = [],
    technologies = [],
    tutorialFormat = 'markdown-with-playground', // markdown-with-playground, jupyter-notebook, katacoda, both
    outputDir = 'interactive-tutorial-output',
    includeQuizzes = true,
    includeExercises = true,
    playgroundPlatform = 'codesandbox', // codesandbox, stackblitz, repl.it, jupyterlite
    estimatedDuration = '30 minutes',
    difficultyLevel = 'beginner' // beginner, intermediate, advanced
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Interactive Tutorial Creation for "${topic}"`);

  // ============================================================================
  // PHASE 1: LEARNING NEEDS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing learning needs and defining tutorial scope');
  const learningAnalysis = await ctx.task(learningNeedsAnalysisTask, {
    topic,
    targetAudience,
    learningObjectives,
    prerequisites,
    technologies,
    difficultyLevel,
    estimatedDuration,
    outputDir
  });

  artifacts.push(...learningAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: TUTORIAL STRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing tutorial structure and learning path');
  const tutorialStructure = await ctx.task(tutorialStructureDesignTask, {
    topic,
    learningAnalysis,
    tutorialFormat,
    includeQuizzes,
    includeExercises,
    outputDir
  });

  artifacts.push(...tutorialStructure.artifacts);

  // Breakpoint: Review tutorial structure with instructional designer
  await ctx.breakpoint({
    question: `Tutorial structure designed with ${tutorialStructure.sectionCount} sections and ${tutorialStructure.stepCount} total steps. Review learning flow and approve to proceed with content creation?`,
    title: 'Tutorial Structure Review',
    context: {
      runId: ctx.runId,
      files: tutorialStructure.artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || 'Tutorial Outline'
      })),
      summary: {
        topic,
        sectionCount: tutorialStructure.sectionCount,
        stepCount: tutorialStructure.stepCount,
        estimatedDuration: tutorialStructure.totalDuration,
        difficultyLevel
      }
    }
  });

  // ============================================================================
  // PHASE 3: CONTENT CREATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating tutorial content for each section');

  // Create content for each section in parallel
  const contentCreationTasks = tutorialStructure.sections.map(section => ({
    name: `content-creation-${section.id}`,
    task: contentCreationTask,
    args: {
      topic,
      section,
      learningAnalysis,
      technologies,
      targetAudience,
      outputDir
    }
  }));

  const sectionContents = await ctx.parallel.all(
    contentCreationTasks.map(t => ctx.task(t.task, t.args))
  );

  sectionContents.forEach(content => {
    artifacts.push(...content.artifacts);
  });

  // ============================================================================
  // PHASE 4: CODE PLAYGROUND SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up interactive code playgrounds');
  const playgroundSetup = await ctx.task(codePlaygroundSetupTask, {
    topic,
    sectionContents,
    playgroundPlatform,
    technologies,
    outputDir
  });

  artifacts.push(...playgroundSetup.artifacts);

  // ============================================================================
  // PHASE 5: EXECUTABLE NOTEBOOKS CREATION
  // ============================================================================

  let notebookCreation = { notebookFiles: [], artifacts: [] };
  if (tutorialFormat === 'jupyter-notebook' || tutorialFormat === 'both') {
    ctx.log('info', 'Phase 5: Creating executable Jupyter notebooks');
    notebookCreation = await ctx.task(executableNotebookCreationTask, {
      topic,
      sectionContents,
      learningAnalysis,
      technologies,
      outputDir
    });

    artifacts.push(...notebookCreation.artifacts);
  } else {
    ctx.log('info', 'Phase 5: Skipping notebook creation (format not selected)');
  }

  // ============================================================================
  // PHASE 6: INTERACTIVE EXERCISES AND CHALLENGES
  // ============================================================================

  let exerciseCreation = { exercises: [], artifacts: [] };
  if (includeExercises) {
    ctx.log('info', 'Phase 6: Creating interactive exercises and coding challenges');
    exerciseCreation = await ctx.task(interactiveExerciseCreationTask, {
      topic,
      sectionContents,
      learningObjectives: learningAnalysis.refinedLearningObjectives,
      playgroundPlatform,
      outputDir
    });

    artifacts.push(...exerciseCreation.artifacts);
  } else {
    ctx.log('info', 'Phase 6: Skipping exercise creation');
  }

  // ============================================================================
  // PHASE 7: KNOWLEDGE CHECK QUIZZES
  // ============================================================================

  let quizCreation = { quizzes: [], artifacts: [] };
  if (includeQuizzes) {
    ctx.log('info', 'Phase 7: Creating knowledge check quizzes');
    quizCreation = await ctx.task(knowledgeCheckQuizCreationTask, {
      topic,
      sectionContents,
      learningObjectives: learningAnalysis.refinedLearningObjectives,
      outputDir
    });

    artifacts.push(...quizCreation.artifacts);
  } else {
    ctx.log('info', 'Phase 7: Skipping quiz creation');
  }

  // Breakpoint: Review content quality before assembly
  await ctx.breakpoint({
    question: `Tutorial content created with ${sectionContents.length} sections, ${playgroundSetup.playgroundCount} playgrounds, ${exerciseCreation.exercises?.length || 0} exercises, and ${quizCreation.quizzes?.length || 0} quizzes. Review content quality and approve assembly?`,
    title: 'Tutorial Content Quality Review',
    context: {
      runId: ctx.runId,
      files: artifacts
        .filter(a => a.path.includes('section-') || a.path.includes('playground-') || a.path.includes('exercise-'))
        .map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || 'Tutorial Content'
        })),
      summary: {
        topic,
        sectionCount: sectionContents.length,
        playgroundCount: playgroundSetup.playgroundCount,
        exerciseCount: exerciseCreation.exercises?.length || 0,
        quizCount: quizCreation.quizzes?.length || 0,
        totalSteps: sectionContents.reduce((sum, s) => sum + (s.stepCount || 0), 0)
      }
    }
  });

  // ============================================================================
  // PHASE 8: TUTORIAL ASSEMBLY AND NAVIGATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Assembling complete tutorial with navigation');
  const tutorialAssembly = await ctx.task(tutorialAssemblyTask, {
    topic,
    learningAnalysis,
    tutorialStructure,
    sectionContents,
    playgroundSetup,
    notebookCreation,
    exerciseCreation,
    quizCreation,
    tutorialFormat,
    outputDir
  });

  artifacts.push(...tutorialAssembly.artifacts);

  // ============================================================================
  // PHASE 9: ACCESSIBILITY AND USABILITY CHECK
  // ============================================================================

  ctx.log('info', 'Phase 9: Checking accessibility and usability');
  const accessibilityCheck = await ctx.task(accessibilityUsabilityCheckTask, {
    topic,
    tutorialAssembly,
    playgroundSetup,
    outputDir
  });

  artifacts.push(...accessibilityCheck.artifacts);

  // ============================================================================
  // PHASE 10: TUTORIAL QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating tutorial quality and learning effectiveness');
  const qualityValidation = await ctx.task(tutorialQualityValidationTask, {
    topic,
    learningAnalysis,
    tutorialStructure,
    sectionContents,
    playgroundSetup,
    exerciseCreation,
    quizCreation,
    tutorialAssembly,
    accessibilityCheck,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityScore = qualityValidation.overallScore;
  const qualityMet = qualityScore >= 85;

  // Final Breakpoint: Review complete interactive tutorial
  await ctx.breakpoint({
    question: `Interactive tutorial complete. Quality score: ${qualityScore}/100. ${qualityMet ? 'Tutorial meets quality standards!' : 'Tutorial may need refinement.'} Review and approve for publication?`,
    title: 'Interactive Tutorial Final Review',
    context: {
      runId: ctx.runId,
      files: artifacts
        .filter(a => a.path.includes('tutorial-') || a.path.includes('index'))
        .map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || 'Tutorial File'
        })),
      summary: {
        qualityScore,
        qualityMet,
        topic,
        targetAudience,
        difficultyLevel,
        totalArtifacts: artifacts.length,
        sections: sectionContents.length,
        playgrounds: playgroundSetup.playgroundCount,
        notebooks: notebookCreation.notebookFiles?.length || 0,
        exercises: exerciseCreation.exercises?.length || 0,
        quizzes: quizCreation.quizzes?.length || 0,
        estimatedDuration: tutorialStructure.totalDuration,
        mainTutorialPath: tutorialAssembly.mainTutorialPath
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    topic,
    targetAudience,
    difficultyLevel,
    qualityScore,
    qualityMet,
    tutorialFiles: tutorialAssembly.tutorialFiles,
    playgroundLinks: playgroundSetup.playgroundLinks,
    notebookFiles: notebookCreation.notebookFiles || [],
    exerciseFiles: exerciseCreation.exercises?.map(e => e.filePath) || [],
    quizFiles: quizCreation.quizzes?.map(q => q.filePath) || [],
    mainTutorialPath: tutorialAssembly.mainTutorialPath,
    estimatedDuration: tutorialStructure.totalDuration,
    artifacts,
    duration,
    metadata: {
      processId: 'technical-documentation/interactive-tutorials',
      timestamp: startTime,
      topic,
      tutorialFormat,
      playgroundPlatform,
      outputDir,
      sectionCount: sectionContents.length,
      totalSteps: sectionContents.reduce((sum, s) => sum + (s.stepCount || 0), 0)
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Learning Needs Analysis
export const learningNeedsAnalysisTask = defineTask('learning-needs-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze learning needs and define tutorial scope',
  agent: {
    name: 'learning-designer',
    prompt: {
      role: 'instructional designer and technical educator specializing in hands-on learning',
      task: 'Analyze target audience, learning objectives, prerequisites, and define optimal tutorial scope following Diataxis framework for learning-oriented tutorials',
      context: args,
      instructions: [
        'Analyze target audience characteristics and prior knowledge level',
        'Review and refine learning objectives to be specific, measurable, achievable',
        'Identify knowledge gaps between prerequisites and learning objectives',
        'Define tutorial scope: what will be covered and what is out of scope',
        'Determine optimal learning path progression (simple to complex)',
        'Identify hands-on activities needed to achieve learning objectives',
        'Define success criteria for learning outcomes',
        'Consider cognitive load and pacing for target audience',
        'Follow Diataxis principles: learning-oriented, allow mistakes, provide guidance',
        'Recommend tutorial format best suited for content (interactive, notebook, both)',
        'Create learning analysis document with recommendations'
      ],
      outputFormat: 'JSON with refinedLearningObjectives (array), targetAudienceProfile (object), knowledgeGaps (array), tutorialScope (object), learningPath (array), successCriteria (array), recommendedFormat (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedLearningObjectives', 'targetAudienceProfile', 'tutorialScope', 'learningPath', 'artifacts'],
      properties: {
        refinedLearningObjectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              bloomLevel: { type: 'string' },
              assessmentMethod: { type: 'string' }
            }
          }
        },
        targetAudienceProfile: {
          type: 'object',
          properties: {
            level: { type: 'string' },
            priorKnowledge: { type: 'array', items: { type: 'string' } },
            learningPreferences: { type: 'array', items: { type: 'string' } }
          }
        },
        knowledgeGaps: { type: 'array', items: { type: 'string' } },
        tutorialScope: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } },
            boundaries: { type: 'string' }
          }
        },
        learningPath: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              focus: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        recommendedFormat: { type: 'string' },
        cognitiveLoadConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interactive-tutorial', 'learning-design', 'needs-analysis']
}));

// Task 2: Tutorial Structure Design
export const tutorialStructureDesignTask = defineTask('tutorial-structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design tutorial structure and learning path',
  agent: {
    name: 'tutorial-architect',
    prompt: {
      role: 'technical educator and content strategist',
      task: 'Design comprehensive tutorial structure with sections, steps, checkpoints, and navigation following progressive disclosure and scaffolding principles',
      context: args,
      instructions: [
        'Create tutorial sections aligned with learning path stages',
        'Break each section into manageable steps (5-15 minutes each)',
        'Apply progressive disclosure: introduce concepts incrementally',
        'Use scaffolding: provide support early, reduce gradually',
        'Design hands-on activities for each learning objective',
        'Plan checkpoints for knowledge validation (quizzes, exercises)',
        'Include "What you\'ll learn" and "What you\'ll build" sections',
        'Design clear navigation and progress indicators',
        'Plan for common mistakes and troubleshooting sections',
        'Include "Next steps" and "Further reading" sections',
        'Ensure logical flow and smooth transitions between sections',
        'Estimate time for each section and total duration',
        'Create detailed tutorial outline document'
      ],
      outputFormat: 'JSON with sections (array with id, title, description, learningObjectives, steps, duration), sectionCount, stepCount, totalDuration, navigationStructure (object), checkpoints (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'sectionCount', 'stepCount', 'totalDuration', 'artifacts'],
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              learningObjectives: { type: 'array', items: { type: 'string' } },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stepNumber: { type: 'number' },
                    title: { type: 'string' },
                    type: { type: 'string' },
                    duration: { type: 'string' }
                  }
                }
              },
              duration: { type: 'string' }
            }
          }
        },
        sectionCount: { type: 'number' },
        stepCount: { type: 'number' },
        totalDuration: { type: 'string' },
        navigationStructure: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } }
          }
        },
        checkpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              afterSection: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' }
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
  labels: ['agent', 'interactive-tutorial', 'structure-design']
}));

// Task 3: Content Creation
export const contentCreationTask = defineTask('content-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create tutorial section content',
  agent: {
    name: 'tutorial-content-writer',
    prompt: {
      role: 'technical writer specializing in hands-on tutorials and interactive learning',
      task: 'Create engaging, hands-on tutorial content for a section with clear explanations, code examples, and guided practice following best practices for learning-oriented documentation',
      context: args,
      instructions: [
        'Write introduction explaining what learners will accomplish in this section',
        'Use conversational, encouraging tone suitable for target audience',
        'Provide clear, step-by-step instructions with numbered steps',
        'Include code snippets with syntax highlighting and explanations',
        'Add inline comments in code to explain key concepts',
        'Use screenshots, diagrams, or visual aids where helpful',
        'Anticipate common mistakes and add "Common Pitfalls" or "Troubleshooting" boxes',
        'Include "Try it yourself" prompts for hands-on practice',
        'Add explanatory callouts for important concepts (Note, Tip, Warning)',
        'Link concepts to prerequisites or future sections where relevant',
        'End each section with a summary of what was learned',
        'Ensure code examples are complete, tested, and runnable',
        'Format content in Markdown with proper structure',
        'Save section content to output directory'
      ],
      outputFormat: 'JSON with sectionId, contentFilePath, stepCount, codeExamplesCount, visualAidsCount, calloutCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sectionId', 'contentFilePath', 'stepCount', 'artifacts'],
      properties: {
        sectionId: { type: 'string' },
        contentFilePath: { type: 'string' },
        stepCount: { type: 'number' },
        codeExamplesCount: { type: 'number' },
        visualAidsCount: { type: 'number' },
        calloutCount: { type: 'number' },
        summaryPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interactive-tutorial', 'content-creation']
}));

// Task 4: Code Playground Setup
export const codePlaygroundSetupTask = defineTask('code-playground-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup interactive code playgrounds',
  agent: {
    name: 'playground-engineer',
    prompt: {
      role: 'developer experience engineer specializing in interactive learning environments',
      task: 'Create interactive code playgrounds for tutorial examples using specified platform (CodeSandbox, StackBlitz, Repl.it, JupyterLite) with starter code, dependencies, and instructions',
      context: args,
      instructions: [
        'Identify all code examples from tutorial sections that need playgrounds',
        'For each playground, set up project structure with starter code',
        'Configure dependencies and build tools based on technologies',
        'Add clear README in each playground with instructions',
        'Create starter code that is minimal but functional',
        'Include TODO comments guiding learners on what to implement',
        'Add solution branches or files for reference (if applicable)',
        'Test each playground for functionality and loading time',
        'Generate shareable links for each playground',
        'Create playground index with descriptions and links',
        'Add embed codes for playgrounds to include in tutorial',
        'Document playground setup in metadata file'
      ],
      outputFormat: 'JSON with playgroundLinks (array with id, title, url, embedCode, platform), playgroundCount, setupInstructions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['playgroundLinks', 'playgroundCount', 'artifacts'],
      properties: {
        playgroundLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              url: { type: 'string' },
              embedCode: { type: 'string' },
              platform: { type: 'string' },
              sectionId: { type: 'string' }
            }
          }
        },
        playgroundCount: { type: 'number' },
        setupInstructions: { type: 'array', items: { type: 'string' } },
        technologiesConfigured: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interactive-tutorial', 'code-playground']
}));

// Task 5: Executable Notebook Creation
export const executableNotebookCreationTask = defineTask('executable-notebook-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create executable Jupyter notebooks',
  agent: {
    name: 'notebook-creator',
    prompt: {
      role: 'data science educator and Jupyter notebook specialist',
      task: 'Convert tutorial content into executable Jupyter notebooks with narrative cells, code cells, outputs, and interactive widgets',
      context: args,
      instructions: [
        'Create Jupyter notebook (.ipynb) for the tutorial',
        'Structure notebook with markdown cells for narrative and code cells for examples',
        'Add tutorial introduction in first markdown cell',
        'For each section, create markdown cells explaining concepts',
        'Add code cells with executable examples after explanations',
        'Include cell outputs showing expected results',
        'Add exercise cells with "# TODO" comments for learners',
        'Use markdown formatting: headers, lists, code blocks, links',
        'Include images or diagrams in markdown cells if helpful',
        'Add interactive widgets (ipywidgets) for exploration where appropriate',
        'Ensure all code cells are executable and produce expected output',
        'Test notebook execution from top to bottom',
        'Add metadata for kernelspec and language',
        'Save notebook file to output directory',
        'Create requirements.txt or environment.yml for dependencies'
      ],
      outputFormat: 'JSON with notebookFiles (array with path, title, description), cellCount (object with markdown, code), dependenciesFile (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['notebookFiles', 'cellCount', 'artifacts'],
      properties: {
        notebookFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              kernel: { type: 'string' }
            }
          }
        },
        cellCount: {
          type: 'object',
          properties: {
            markdown: { type: 'number' },
            code: { type: 'number' }
          }
        },
        dependenciesFile: { type: 'string' },
        interactiveWidgets: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interactive-tutorial', 'jupyter-notebook']
}));

// Task 6: Interactive Exercise Creation
export const interactiveExerciseCreationTask = defineTask('interactive-exercise-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create interactive exercises and coding challenges',
  agent: {
    name: 'exercise-designer',
    prompt: {
      role: 'technical educator specializing in hands-on practice and assessment',
      task: 'Design interactive coding exercises and challenges that reinforce learning objectives with clear instructions, starter code, hints, and solutions',
      context: args,
      instructions: [
        'Create 2-3 exercises per section aligned with learning objectives',
        'Design exercises with increasing difficulty within each section',
        'Provide clear problem statements and success criteria',
        'Include starter code and file structure for each exercise',
        'Add hints section to help learners without giving away solution',
        'Create complete solution with explanatory comments',
        'Add test cases or expected outputs for self-validation',
        'Include extension challenges for advanced learners',
        'Format exercises as interactive playground links or notebook cells',
        'Create exercise document with all exercises organized by section',
        'Ensure exercises are practical and related to real-world scenarios',
        'Test exercises to ensure they are solvable and not too frustrating'
      ],
      outputFormat: 'JSON with exercises (array with id, title, sectionId, difficulty, starterCodePath, solutionPath, hintsPath, playgroundUrl), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['exercises', 'artifacts'],
      properties: {
        exercises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              sectionId: { type: 'string' },
              difficulty: { type: 'string' },
              description: { type: 'string' },
              starterCodePath: { type: 'string' },
              solutionPath: { type: 'string' },
              hintsPath: { type: 'string' },
              playgroundUrl: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        totalExercises: { type: 'number' },
        exercisesBySectionCount: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interactive-tutorial', 'exercises', 'coding-challenges']
}));

// Task 7: Knowledge Check Quiz Creation
export const knowledgeCheckQuizCreationTask = defineTask('knowledge-check-quiz-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create knowledge check quizzes',
  agent: {
    name: 'quiz-designer',
    prompt: {
      role: 'instructional designer specializing in formative assessment',
      task: 'Create knowledge check quizzes to validate understanding of concepts with multiple choice, true/false, and code-based questions',
      context: args,
      instructions: [
        'Create quiz for each major section or concept',
        'Include 3-5 questions per quiz covering key concepts',
        'Use variety of question types: multiple choice, true/false, fill-in-blank, code output prediction',
        'Ensure questions test understanding, not just memorization',
        'Write clear, unambiguous questions',
        'Provide 4 answer options for multiple choice (1 correct, 3 plausible distractors)',
        'Add explanations for correct answers to reinforce learning',
        'Add explanations for incorrect answers to address misconceptions',
        'Avoid trick questions or overly complex wording',
        'Include at least one applied/scenario-based question per quiz',
        'Format quizzes in structured JSON or Markdown format',
        'Create quiz index with links and topics covered'
      ],
      outputFormat: 'JSON with quizzes (array with id, sectionId, title, questions array with question, type, options, correctAnswer, explanation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['quizzes', 'artifacts'],
      properties: {
        quizzes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              sectionId: { type: 'string' },
              title: { type: 'string' },
              filePath: { type: 'string' },
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    type: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                    correctAnswer: { type: 'string' },
                    explanation: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        totalQuizzes: { type: 'number' },
        totalQuestions: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interactive-tutorial', 'quizzes', 'knowledge-check']
}));

// Task 8: Tutorial Assembly
export const tutorialAssemblyTask = defineTask('tutorial-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble complete tutorial with navigation',
  agent: {
    name: 'tutorial-assembler',
    prompt: {
      role: 'technical documentation engineer and content integrator',
      task: 'Assemble all tutorial components into cohesive final tutorial with navigation, progress tracking, and supplementary materials',
      context: args,
      instructions: [
        'Create main tutorial document combining all sections',
        'Add table of contents with links to all sections',
        'Embed or link code playgrounds at appropriate locations',
        'Integrate exercises and quizzes after relevant sections',
        'Add navigation elements: Previous/Next buttons, breadcrumbs',
        'Create progress tracker showing completion status',
        'Add "What you\'ll learn" overview at the beginning',
        'Add "Prerequisites" section with links to required knowledge',
        'Include "What you\'ll build" section with demo or screenshots',
        'Add "Next steps" and "Further reading" at the end',
        'Create supplementary materials: cheat sheets, reference cards, glossary',
        'Generate tutorial index/landing page',
        'Ensure consistent formatting and styling throughout',
        'Add metadata: author, date, version, estimated duration',
        'Create README with setup instructions and learning path',
        'Validate all internal links and playground embeds'
      ],
      outputFormat: 'JSON with mainTutorialPath, tutorialFiles (array), navigationStructure (object), supplementaryMaterials (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mainTutorialPath', 'tutorialFiles', 'artifacts'],
      properties: {
        mainTutorialPath: { type: 'string' },
        tutorialFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              title: { type: 'string' }
            }
          }
        },
        navigationStructure: {
          type: 'object',
          properties: {
            tocPath: { type: 'string' },
            indexPath: { type: 'string' },
            navigationFeatures: { type: 'array', items: { type: 'string' } }
          }
        },
        supplementaryMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
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
  labels: ['agent', 'interactive-tutorial', 'assembly', 'navigation']
}));

// Task 9: Accessibility and Usability Check
export const accessibilityUsabilityCheckTask = defineTask('accessibility-usability-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check accessibility and usability',
  agent: {
    name: 'accessibility-specialist',
    prompt: {
      role: 'accessibility expert and UX specialist for educational content',
      task: 'Evaluate tutorial accessibility (WCAG 2.1 AA), usability, and learning experience quality with specific recommendations for improvement',
      context: args,
      instructions: [
        'Check accessibility of tutorial content (WCAG 2.1 AA):',
        '  - Text alternatives for images and diagrams',
        '  - Proper heading hierarchy (h1, h2, h3)',
        '  - Sufficient color contrast',
        '  - Keyboard navigation support',
        '  - Screen reader compatibility',
        '  - Descriptive link text',
        'Evaluate usability and user experience:',
        '  - Clear navigation and wayfinding',
        '  - Consistent layout and formatting',
        '  - Readable font sizes and line spacing',
        '  - Mobile responsiveness of content',
        '  - Loading time for playgrounds',
        'Assess learning experience quality:',
        '  - Clarity of instructions',
        '  - Appropriate pacing and cognitive load',
        '  - Effectiveness of examples',
        '  - Helpfulness of hints and feedback',
        'Test code playgrounds for usability',
        'Identify barriers to learning',
        'Provide specific, actionable recommendations',
        'Create accessibility and usability report'
      ],
      outputFormat: 'JSON with accessibilityScore (0-100), usabilityScore (0-100), learningExperienceScore (0-100), issues (array with severity, description, recommendation), strengths (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['accessibilityScore', 'usabilityScore', 'learningExperienceScore', 'issues', 'artifacts'],
      properties: {
        accessibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        usabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        learningExperienceScore: { type: 'number', minimum: 0, maximum: 100 },
        wcagCompliance: {
          type: 'object',
          properties: {
            level: { type: 'string' },
            criteriaMet: { type: 'number' },
            criteriaTotal: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              category: { type: 'string' },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'interactive-tutorial', 'accessibility', 'usability']
}));

// Task 10: Tutorial Quality Validation
export const tutorialQualityValidationTask = defineTask('tutorial-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate tutorial quality and learning effectiveness',
  agent: {
    name: 'tutorial-quality-validator',
    prompt: {
      role: 'senior instructional designer and tutorial quality expert',
      task: 'Comprehensively assess interactive tutorial quality, learning effectiveness, technical accuracy, and adherence to best practices for learning-oriented documentation',
      context: args,
      instructions: [
        'Evaluate learning design quality (weight: 25%)',
        '  - Learning objectives clearly stated and achievable?',
        '  - Content aligned with objectives?',
        '  - Appropriate scaffolding and progressive disclosure?',
        '  - Effective use of hands-on activities?',
        'Evaluate content quality (weight: 25%)',
        '  - Clear, accurate, and engaging writing?',
        '  - Code examples complete and tested?',
        '  - Explanations appropriate for target audience?',
        '  - Visual aids effective?',
        'Evaluate interactivity and engagement (weight: 20%)',
        '  - Code playgrounds functional and useful?',
        '  - Exercises reinforce learning objectives?',
        '  - Quizzes effective for knowledge validation?',
        '  - Appropriate balance of guidance and exploration?',
        'Evaluate accessibility and usability (weight: 15%)',
        '  - WCAG compliance?',
        '  - Navigation intuitive?',
        '  - Content structure clear?',
        'Evaluate completeness and polish (weight: 15%)',
        '  - All sections present and complete?',
        '  - Consistent formatting?',
        '  - No broken links or missing resources?',
        '  - Professional presentation?',
        'Calculate weighted overall score (0-100)',
        'Identify strengths and weaknesses',
        'Provide specific recommendations for improvement',
        'Assess adherence to Diataxis principles for tutorials'
      ],
      outputFormat: 'JSON with overallScore (0-100), componentScores (object with learningDesign, contentQuality, interactivity, accessibility, completeness), strengths (array), weaknesses (array), recommendations (array), diataxisCompliance (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            learningDesign: { type: 'number', minimum: 0, maximum: 100 },
            contentQuality: { type: 'number', minimum: 0, maximum: 100 },
            interactivity: { type: 'number', minimum: 0, maximum: 100 },
            accessibility: { type: 'number', minimum: 0, maximum: 100 },
            completeness: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        diataxisCompliance: {
          type: 'object',
          properties: {
            learningOriented: { type: 'boolean' },
            allowsMistakes: { type: 'boolean' },
            providesGuidance: { type: 'boolean' },
            inspiresConfidence: { type: 'boolean' }
          }
        },
        technicalAccuracy: {
          type: 'object',
          properties: {
            codeExamplesValid: { type: 'boolean' },
            playgroundsFunctional: { type: 'boolean' },
            conceptsCorrect: { type: 'boolean' }
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
  labels: ['agent', 'interactive-tutorial', 'validation', 'quality-scoring']
}));

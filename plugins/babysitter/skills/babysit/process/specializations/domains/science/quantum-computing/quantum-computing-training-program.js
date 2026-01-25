/**
 * @process Quantum Computing Training Program
 * @id QC-EDU-001
 * @description Develop and deliver quantum computing training programs for developers, scientists,
 * and business stakeholders at various skill levels.
 * @category Quantum Computing - Education and Training
 * @priority P2 - Medium
 * @inputs {{ audienceType: string, skillLevel: string, duration?: number }}
 * @outputs {{ success: boolean, curriculum: object, materials: array, assessments: array, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-computing-training-program', {
 *   audienceType: 'developers',
 *   skillLevel: 'beginner',
 *   duration: 40 // hours
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    audienceType = 'developers', // 'developers', 'scientists', 'executives', 'mixed'
    skillLevel = 'beginner', // 'beginner', 'intermediate', 'advanced'
    duration = 40, // hours
    includeHands = true,
    includeAssessments = true,
    framework = 'qiskit',
    outputDir = 'training-program-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Computing Training Program Development`);
  ctx.log('info', `Audience: ${audienceType}, Level: ${skillLevel}, Duration: ${duration}h`);

  // ============================================================================
  // PHASE 1: TRAINING NEEDS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Training Needs Assessment');

  const needsResult = await ctx.task(trainingNeedsAssessmentTask, {
    audienceType,
    skillLevel,
    duration
  });

  artifacts.push(...(needsResult.artifacts || []));

  await ctx.breakpoint({
    question: `Training needs assessed. Learning objectives: ${needsResult.objectiveCount}, Prerequisites identified: ${needsResult.prerequisites.length}. Proceed with curriculum design?`,
    title: 'Training Needs Assessment Review',
    context: {
      runId: ctx.runId,
      needs: needsResult,
      files: (needsResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: CURRICULUM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Curriculum Design');

  const curriculumResult = await ctx.task(curriculumDesignTask, {
    needs: needsResult,
    audienceType,
    skillLevel,
    duration,
    framework
  });

  artifacts.push(...(curriculumResult.artifacts || []));

  ctx.log('info', `Curriculum designed. Modules: ${curriculumResult.moduleCount}`);

  // ============================================================================
  // PHASE 3: LEARNING MATERIALS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Learning Materials Development');

  const materialsResult = await ctx.task(learningMaterialsDevelopmentTask, {
    curriculum: curriculumResult,
    audienceType,
    skillLevel,
    framework
  });

  artifacts.push(...(materialsResult.artifacts || []));

  // ============================================================================
  // PHASE 4: HANDS-ON LAB DEVELOPMENT
  // ============================================================================

  let labsResult = null;
  if (includeHands) {
    ctx.log('info', 'Phase 4: Hands-On Lab Development');

    labsResult = await ctx.task(handsOnLabDevelopmentTask, {
      curriculum: curriculumResult,
      skillLevel,
      framework
    });

    artifacts.push(...(labsResult.artifacts || []));
  }

  await ctx.breakpoint({
    question: `Materials developed. Presentations: ${materialsResult.presentationCount}, Labs: ${labsResult?.labCount || 0}. Proceed with assessment development?`,
    title: 'Learning Materials Review',
    context: {
      runId: ctx.runId,
      materials: materialsResult,
      labs: labsResult,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: ASSESSMENT DEVELOPMENT
  // ============================================================================

  let assessmentResult = null;
  if (includeAssessments) {
    ctx.log('info', 'Phase 5: Assessment Development');

    assessmentResult = await ctx.task(assessmentDevelopmentTask, {
      curriculum: curriculumResult,
      skillLevel
    });

    artifacts.push(...(assessmentResult.artifacts || []));
  }

  // ============================================================================
  // PHASE 6: INSTRUCTOR GUIDE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Instructor Guide Creation');

  const instructorGuideResult = await ctx.task(instructorGuideCreationTask, {
    curriculum: curriculumResult,
    materials: materialsResult,
    labs: labsResult,
    assessments: assessmentResult
  });

  artifacts.push(...(instructorGuideResult.artifacts || []));

  // ============================================================================
  // PHASE 7: LEARNING PATH CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Learning Path Configuration');

  const learningPathResult = await ctx.task(learningPathConfigurationTask, {
    curriculum: curriculumResult,
    audienceType,
    skillLevel
  });

  artifacts.push(...(learningPathResult.artifacts || []));

  // ============================================================================
  // PHASE 8: PROGRAM VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Program Validation');

  const validationResult = await ctx.task(programValidationTask, {
    curriculum: curriculumResult,
    materials: materialsResult,
    labs: labsResult,
    assessments: assessmentResult,
    instructorGuide: instructorGuideResult,
    outputDir
  });

  artifacts.push(...(validationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Training program complete. Modules: ${curriculumResult.moduleCount}, Labs: ${labsResult?.labCount || 0}, Assessments: ${assessmentResult?.assessmentCount || 0}. Approve program?`,
    title: 'Training Program Complete',
    context: {
      runId: ctx.runId,
      summary: {
        audienceType,
        skillLevel,
        duration,
        modules: curriculumResult.moduleCount,
        labs: labsResult?.labCount || 0,
        assessments: assessmentResult?.assessmentCount || 0
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    audienceType,
    skillLevel,
    curriculum: {
      modules: curriculumResult.modules,
      learningObjectives: needsResult.objectives,
      prerequisites: needsResult.prerequisites,
      totalDuration: curriculumResult.totalDuration
    },
    materials: materialsResult.materials,
    labs: labsResult?.labs || [],
    assessments: assessmentResult?.assessments || [],
    instructorGuide: instructorGuideResult.guide,
    learningPaths: learningPathResult.paths,
    validation: validationResult.validationReport,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-EDU-001',
      processName: 'Quantum Computing Training Program',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const trainingNeedsAssessmentTask = defineTask('qc-training-needs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Training Needs Assessment',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Learning and Development Specialist',
      task: 'Assess training needs for quantum computing program',
      context: args,
      instructions: [
        '1. Analyze target audience characteristics',
        '2. Identify current knowledge gaps',
        '3. Define learning objectives',
        '4. Determine prerequisites',
        '5. Assess organizational context',
        '6. Identify success metrics',
        '7. Map competency framework',
        '8. Define proficiency levels',
        '9. Create learner personas',
        '10. Document training requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'prerequisites', 'objectiveCount'],
      properties: {
        objectives: { type: 'array' },
        prerequisites: { type: 'array' },
        objectiveCount: { type: 'number' },
        competencyFramework: { type: 'object' },
        learnerPersonas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'training', 'needs-assessment']
}));

export const curriculumDesignTask = defineTask('qc-curriculum-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Curriculum Design',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Curriculum Design Specialist',
      task: 'Design quantum computing curriculum',
      context: args,
      instructions: [
        '1. Structure course modules',
        '2. Sequence learning topics',
        '3. Define module objectives',
        '4. Allocate time per module',
        '5. Design progressive complexity',
        '6. Include theory and practice mix',
        '7. Plan knowledge checkpoints',
        '8. Define hands-on components',
        '9. Create module dependencies',
        '10. Document curriculum structure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'moduleCount', 'totalDuration'],
      properties: {
        modules: { type: 'array' },
        moduleCount: { type: 'number' },
        totalDuration: { type: 'number' },
        sequenceMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'training', 'curriculum']
}));

export const learningMaterialsDevelopmentTask = defineTask('qc-materials-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Learning Materials Development',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Instructional Designer',
      task: 'Develop quantum computing learning materials',
      context: args,
      instructions: [
        '1. Create presentation slides',
        '2. Develop lecture notes',
        '3. Write explanatory content',
        '4. Create visual diagrams',
        '5. Develop worked examples',
        '6. Create reference sheets',
        '7. Design infographics',
        '8. Develop video scripts',
        '9. Create supplementary readings',
        '10. Package materials by module'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'presentationCount'],
      properties: {
        materials: { type: 'array' },
        presentationCount: { type: 'number' },
        lectureNotes: { type: 'array' },
        visualAssets: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'training', 'materials']
}));

export const handsOnLabDevelopmentTask = defineTask('qc-lab-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hands-On Lab Development',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Quantum Computing Lab Developer',
      task: 'Develop hands-on quantum computing labs',
      context: args,
      instructions: [
        '1. Design lab exercises',
        '2. Create Jupyter notebooks',
        '3. Write step-by-step instructions',
        '4. Develop starter code',
        '5. Create solution code',
        '6. Design challenge problems',
        '7. Set up lab environments',
        '8. Create sandbox configurations',
        '9. Test all lab exercises',
        '10. Document lab procedures'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['labs', 'labCount'],
      properties: {
        labs: { type: 'array' },
        labCount: { type: 'number' },
        notebooks: { type: 'array' },
        challenges: { type: 'array' },
        environmentConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'training', 'labs']
}));

export const assessmentDevelopmentTask = defineTask('qc-assessment-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assessment Development',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Assessment Design Specialist',
      task: 'Develop assessments for quantum computing training',
      context: args,
      instructions: [
        '1. Design knowledge checks',
        '2. Create quizzes per module',
        '3. Develop practical assessments',
        '4. Create coding challenges',
        '5. Design project assignments',
        '6. Create rubrics',
        '7. Develop final exam',
        '8. Set passing criteria',
        '9. Create answer keys',
        '10. Document assessment strategy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['assessments', 'assessmentCount'],
      properties: {
        assessments: { type: 'array' },
        assessmentCount: { type: 'number' },
        rubrics: { type: 'array' },
        passingCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'training', 'assessment']
}));

export const instructorGuideCreationTask = defineTask('qc-instructor-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Instructor Guide Creation',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Training Delivery Specialist',
      task: 'Create instructor guide for quantum computing training',
      context: args,
      instructions: [
        '1. Write facilitation guide',
        '2. Create session timelines',
        '3. Document teaching strategies',
        '4. Add discussion prompts',
        '5. Include troubleshooting tips',
        '6. Add common Q&A',
        '7. Create demonstration scripts',
        '8. Document setup procedures',
        '9. Add engagement techniques',
        '10. Include feedback mechanisms'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['guide'],
      properties: {
        guide: { type: 'object' },
        sessionPlans: { type: 'array' },
        teachingStrategies: { type: 'array' },
        setupProcedures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'training', 'instructor-guide']
}));

export const learningPathConfigurationTask = defineTask('qc-learning-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Learning Path Configuration',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Learning Experience Designer',
      task: 'Configure learning paths for quantum computing',
      context: args,
      instructions: [
        '1. Define role-based paths',
        '2. Create skill-based tracks',
        '3. Map progressive journeys',
        '4. Configure prerequisites',
        '5. Set milestones',
        '6. Define certifications',
        '7. Create path visualizations',
        '8. Add time estimates',
        '9. Configure branching options',
        '10. Document path recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['paths'],
      properties: {
        paths: { type: 'array' },
        certifications: { type: 'array' },
        milestones: { type: 'array' },
        pathVisualization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'training', 'learning-paths']
}));

export const programValidationTask = defineTask('qc-program-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Program Validation',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['statevector-simulator', 'qiskit-circuit-builder', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Training Quality Specialist',
      task: 'Validate quantum computing training program',
      context: args,
      instructions: [
        '1. Review curriculum completeness',
        '2. Validate learning objectives alignment',
        '3. Check materials quality',
        '4. Verify lab functionality',
        '5. Review assessment validity',
        '6. Check accessibility',
        '7. Validate time allocations',
        '8. Review instructor guide',
        '9. Generate validation report',
        '10. Provide improvement recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['validationReport'],
      properties: {
        validationReport: { type: 'object' },
        issues: { type: 'array' },
        recommendations: { type: 'array' },
        qualityScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'training', 'validation']
}));

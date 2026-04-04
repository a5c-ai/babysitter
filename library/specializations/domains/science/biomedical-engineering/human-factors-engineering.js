/**
 * @process specializations/domains/science/biomedical-engineering/human-factors-engineering
 * @description Human Factors Engineering and Usability per IEC 62366-1 - Apply human factors engineering
 * principles to ensure medical devices are safe and effective for intended users in intended use environments.
 * @inputs { deviceName: string, intendedUsers: string[], criticalTasks: string[], useEnvironments?: string[] }
 * @outputs { success: boolean, hfeFile: object, usabilityValidationReport: object, useRelatedRiskAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/human-factors-engineering', {
 *   deviceName: 'Automated External Defibrillator',
 *   intendedUsers: ['Lay rescuers', 'First responders', 'Healthcare professionals'],
 *   criticalTasks: ['Electrode placement', 'Shock delivery', 'CPR guidance'],
 *   useEnvironments: ['Public spaces', 'Homes', 'Emergency settings']
 * });
 *
 * @references
 * - IEC 62366-1:2015 Medical devices - Application of usability engineering to medical devices
 * - FDA Human Factors Guidance: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/applying-human-factors-and-usability-engineering-medical-devices
 * - AAMI HE75:2009 Human factors engineering - Design of medical devices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    intendedUsers,
    criticalTasks,
    useEnvironments = []
  } = inputs;

  // Phase 1: Use-Related Risk Analysis
  const useRelatedRiskAnalysis = await ctx.task(useRelatedRiskAnalysisTask, {
    deviceName,
    intendedUsers,
    criticalTasks,
    useEnvironments
  });

  // Phase 2: User Profile Characterization
  const userProfiles = await ctx.task(userProfileCharacterizationTask, {
    deviceName,
    intendedUsers,
    useRelatedRiskAnalysis
  });

  // Phase 3: Use Environment Characterization
  const useEnvironmentCharacterization = await ctx.task(useEnvironmentTask, {
    deviceName,
    useEnvironments,
    userProfiles
  });

  // Phase 4: Task Analysis
  const taskAnalysis = await ctx.task(taskAnalysisTask, {
    deviceName,
    criticalTasks,
    userProfiles,
    useEnvironmentCharacterization
  });

  // Breakpoint: Review critical tasks
  await ctx.breakpoint({
    question: `Review task analysis for ${deviceName}. Are all critical tasks identified and analyzed?`,
    title: 'Task Analysis Review',
    context: {
      runId: ctx.runId,
      deviceName,
      criticalTasks: taskAnalysis.criticalTasks,
      taskComplexity: taskAnalysis.complexityAnalysis,
      files: [{
        path: `artifacts/phase4-task-analysis.json`,
        format: 'json',
        content: taskAnalysis
      }]
    }
  });

  // Phase 5: User Interface Design Specification
  const uiDesignSpec = await ctx.task(uiDesignSpecificationTask, {
    deviceName,
    userProfiles,
    taskAnalysis,
    useRelatedRiskAnalysis
  });

  // Phase 6: Formative Usability Evaluation
  const formativeEvaluation = await ctx.task(formativeUsabilityTask, {
    deviceName,
    uiDesignSpec,
    userProfiles,
    criticalTasks: taskAnalysis.criticalTasks
  });

  // Quality Gate: Formative evaluation findings must be addressed
  const criticalFindings = formativeEvaluation.criticalFindings || [];
  if (criticalFindings.length > 0) {
    await ctx.breakpoint({
      question: `${criticalFindings.length} critical findings from formative evaluation. Review and address before summative validation?`,
      title: 'Formative Evaluation Critical Findings',
      context: {
        runId: ctx.runId,
        criticalFindings,
        recommendation: 'Address critical usability issues before proceeding to summative validation'
      }
    });
  }

  // Phase 7: User Interface Design Optimization
  const uiOptimization = await ctx.task(uiOptimizationTask, {
    deviceName,
    formativeFindings: formativeEvaluation.findings,
    uiDesignSpec,
    criticalTasks: taskAnalysis.criticalTasks
  });

  // Phase 8: Summative Usability Validation Planning
  const summativeValidationPlan = await ctx.task(summativeValidationPlanTask, {
    deviceName,
    userProfiles,
    criticalTasks: taskAnalysis.criticalTasks,
    useEnvironmentCharacterization,
    optimizedUI: uiOptimization
  });

  // Phase 9: Use Error Analysis
  const useErrorAnalysis = await ctx.task(useErrorAnalysisTask, {
    deviceName,
    taskAnalysis,
    formativeEvaluation,
    useRelatedRiskAnalysis
  });

  // Phase 10: HFE File Compilation
  const hfeFile = await ctx.task(hfeFileCompilationTask, {
    deviceName,
    intendedUsers,
    useRelatedRiskAnalysis,
    userProfiles,
    useEnvironmentCharacterization,
    taskAnalysis,
    uiDesignSpec,
    formativeEvaluation,
    uiOptimization,
    summativeValidationPlan,
    useErrorAnalysis
  });

  // Final Breakpoint: HFE File Approval
  await ctx.breakpoint({
    question: `Human Factors Engineering complete for ${deviceName}. Approve HFE File and proceed to summative validation?`,
    title: 'HFE File Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      criticalTaskCount: taskAnalysis.criticalTasks.length,
      useErrorsIdentified: useErrorAnalysis.useErrors.length,
      files: [
        { path: `artifacts/hfe-file.json`, format: 'json', content: hfeFile },
        { path: `artifacts/summative-validation-plan.json`, format: 'json', content: summativeValidationPlan }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    hfeFile: hfeFile.file,
    usabilityValidationReport: {
      formativeEvaluation: formativeEvaluation.summary,
      summativeValidationPlan: summativeValidationPlan.plan,
      criticalTasks: taskAnalysis.criticalTasks
    },
    useRelatedRiskAnalysis: useRelatedRiskAnalysis.analysis,
    useErrors: useErrorAnalysis.useErrors,
    userProfiles: userProfiles.profiles,
    nextSteps: hfeFile.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/human-factors-engineering',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const useRelatedRiskAnalysisTask = defineTask('use-related-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Use-Related Risk Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Human Factors Risk Analyst with expertise in use-related hazard analysis',
      task: 'Conduct comprehensive use-related risk analysis for medical device',
      context: {
        deviceName: args.deviceName,
        intendedUsers: args.intendedUsers,
        criticalTasks: args.criticalTasks,
        useEnvironments: args.useEnvironments
      },
      instructions: [
        '1. Identify use-related hazards and hazardous situations',
        '2. Analyze potential use errors (perception, cognition, action)',
        '3. Assess severity of harm from use errors',
        '4. Identify user interface elements contributing to use errors',
        '5. Document use scenarios leading to hazardous situations',
        '6. Analyze interactions between users and device',
        '7. Identify environmental factors contributing to use errors',
        '8. Assess training and experience requirements',
        '9. Document use-related risk control measures',
        '10. Create use-related risk summary'
      ],
      outputFormat: 'JSON object with comprehensive use-related risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'useErrors', 'riskControls'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            hazardousSituations: { type: 'array', items: { type: 'object' } },
            useErrorCategories: { type: 'array', items: { type: 'string' } },
            riskPriority: { type: 'array', items: { type: 'object' } }
          }
        },
        useErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorId: { type: 'string' },
              errorType: { type: 'string', enum: ['perception', 'cognition', 'action'] },
              description: { type: 'string' },
              task: { type: 'string' },
              potentialHarm: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        riskControls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorId: { type: 'string' },
              controlType: { type: 'string' },
              controlDescription: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['human-factors', 'iec-62366', 'risk-analysis', 'medical-device']
}));

export const userProfileCharacterizationTask = defineTask('user-profile-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: User Profile Characterization - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Human Factors Engineer with expertise in user characterization',
      task: 'Characterize user profiles for all intended user populations',
      context: {
        deviceName: args.deviceName,
        intendedUsers: args.intendedUsers,
        useRelatedRiskAnalysis: args.useRelatedRiskAnalysis
      },
      instructions: [
        '1. Define user populations and their roles',
        '2. Document physical characteristics (age, strength, dexterity, sensory)',
        '3. Document cognitive characteristics (education, experience, training)',
        '4. Identify user expectations and mental models',
        '5. Document language and literacy requirements',
        '6. Assess fatigue and stress factors',
        '7. Identify accessibility needs',
        '8. Document cultural and demographic factors',
        '9. Define minimum and typical user capabilities',
        '10. Create comprehensive user profile summaries'
      ],
      outputFormat: 'JSON object with complete user profile characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'accessibilityNeeds'],
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userGroup: { type: 'string' },
              role: { type: 'string' },
              physicalCharacteristics: { type: 'object' },
              cognitiveCharacteristics: { type: 'object' },
              trainingLevel: { type: 'string' },
              experienceLevel: { type: 'string' },
              languageRequirements: { type: 'array', items: { type: 'string' } },
              stressFactors: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        accessibilityNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              need: { type: 'string' },
              userGroups: { type: 'array', items: { type: 'string' } },
              designImplication: { type: 'string' }
            }
          }
        },
        minimumCapabilities: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['human-factors', 'iec-62366', 'user-profiles', 'medical-device']
}));

export const useEnvironmentTask = defineTask('use-environment-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Use Environment Characterization - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Human Factors Engineer with expertise in environmental analysis',
      task: 'Characterize use environments for medical device',
      context: {
        deviceName: args.deviceName,
        useEnvironments: args.useEnvironments,
        userProfiles: args.userProfiles
      },
      instructions: [
        '1. Define physical environment characteristics (lighting, noise, space)',
        '2. Document environmental conditions (temperature, humidity, vibration)',
        '3. Identify distractions and interruptions',
        '4. Assess workflow integration and time pressures',
        '5. Document equipment and accessories in the environment',
        '6. Identify cleaning and maintenance requirements',
        '7. Assess emergency and abnormal conditions',
        '8. Document storage and transport conditions',
        '9. Identify regulatory and facility requirements',
        '10. Create environment-specific design requirements'
      ],
      outputFormat: 'JSON object with complete use environment characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['environments', 'environmentalRequirements'],
      properties: {
        environments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              environmentName: { type: 'string' },
              physicalCharacteristics: { type: 'object' },
              environmentalConditions: { type: 'object' },
              distractions: { type: 'array', items: { type: 'string' } },
              timePressures: { type: 'string' },
              workflowContext: { type: 'string' }
            }
          }
        },
        environmentalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              rationale: { type: 'string' },
              environment: { type: 'string' }
            }
          }
        },
        worstCaseConditions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['human-factors', 'iec-62366', 'use-environment', 'medical-device']
}));

export const taskAnalysisTask = defineTask('task-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Task Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cognitive Task Analyst with expertise in medical device task analysis',
      task: 'Conduct comprehensive task analysis for medical device use',
      context: {
        deviceName: args.deviceName,
        criticalTasks: args.criticalTasks,
        userProfiles: args.userProfiles,
        useEnvironmentCharacterization: args.useEnvironmentCharacterization
      },
      instructions: [
        '1. Decompose tasks into subtasks and steps',
        '2. Identify critical tasks that could result in harm',
        '3. Document task sequences and dependencies',
        '4. Analyze cognitive demands for each task',
        '5. Identify decision points and information requirements',
        '6. Document physical demands and actions required',
        '7. Assess task frequency and timing requirements',
        '8. Identify potential error points in task sequences',
        '9. Document feedback requirements at each step',
        '10. Create task flow diagrams and hierarchical task analysis'
      ],
      outputFormat: 'JSON object with complete task analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalTasks', 'taskDecomposition', 'complexityAnalysis'],
      properties: {
        criticalTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              taskName: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'important', 'routine'] },
              potentialHarm: { type: 'string' },
              userGroups: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        taskDecomposition: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              subtasks: { type: 'array', items: { type: 'object' } },
              steps: { type: 'array', items: { type: 'object' } },
              decisionPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        complexityAnalysis: {
          type: 'object',
          properties: {
            cognitiveLoad: { type: 'string' },
            physicalDemands: { type: 'string' },
            timeConstraints: { type: 'string' },
            errorPotential: { type: 'string' }
          }
        },
        errorPoints: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['human-factors', 'iec-62366', 'task-analysis', 'medical-device']
}));

export const uiDesignSpecificationTask = defineTask('ui-design-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: UI Design Specification - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Device UI/UX Designer with expertise in IEC 62366',
      task: 'Develop user interface design specification based on human factors analysis',
      context: {
        deviceName: args.deviceName,
        userProfiles: args.userProfiles,
        taskAnalysis: args.taskAnalysis,
        useRelatedRiskAnalysis: args.useRelatedRiskAnalysis
      },
      instructions: [
        '1. Define user interface design objectives',
        '2. Specify display requirements (visibility, readability, organization)',
        '3. Specify control requirements (accessibility, feedback, error prevention)',
        '4. Define alarm and alert requirements',
        '5. Specify labeling and instructions requirements',
        '6. Define workflow support requirements',
        '7. Specify error recovery and undo capabilities',
        '8. Document accessibility requirements',
        '9. Define training and documentation requirements',
        '10. Create UI design specifications document'
      ],
      outputFormat: 'JSON object with complete UI design specification'
    },
    outputSchema: {
      type: 'object',
      required: ['designObjectives', 'displayRequirements', 'controlRequirements'],
      properties: {
        designObjectives: { type: 'array', items: { type: 'string' } },
        displayRequirements: {
          type: 'object',
          properties: {
            visibility: { type: 'array', items: { type: 'string' } },
            readability: { type: 'array', items: { type: 'string' } },
            organization: { type: 'array', items: { type: 'string' } },
            colorCoding: { type: 'array', items: { type: 'string' } }
          }
        },
        controlRequirements: {
          type: 'object',
          properties: {
            accessibility: { type: 'array', items: { type: 'string' } },
            feedback: { type: 'array', items: { type: 'string' } },
            errorPrevention: { type: 'array', items: { type: 'string' } }
          }
        },
        alarmRequirements: { type: 'array', items: { type: 'object' } },
        labelingRequirements: { type: 'array', items: { type: 'string' } },
        accessibilityRequirements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['human-factors', 'iec-62366', 'ui-design', 'medical-device']
}));

export const formativeUsabilityTask = defineTask('formative-usability-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Formative Usability Evaluation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Usability Test Specialist with expertise in medical device evaluation',
      task: 'Plan and conduct formative usability evaluation',
      context: {
        deviceName: args.deviceName,
        uiDesignSpec: args.uiDesignSpec,
        userProfiles: args.userProfiles,
        criticalTasks: args.criticalTasks
      },
      instructions: [
        '1. Define formative evaluation objectives',
        '2. Plan usability test methods (heuristic evaluation, cognitive walkthrough, user testing)',
        '3. Define participant recruitment criteria',
        '4. Develop test scenarios covering critical tasks',
        '5. Define data collection methods',
        '6. Conduct heuristic evaluation against standards',
        '7. Plan iterative design improvements',
        '8. Document findings and severity ratings',
        '9. Prioritize design improvements',
        '10. Create formative evaluation report'
      ],
      outputFormat: 'JSON object with complete formative evaluation plan and findings'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluationPlan', 'findings', 'criticalFindings'],
      properties: {
        evaluationPlan: {
          type: 'object',
          properties: {
            methods: { type: 'array', items: { type: 'string' } },
            participantCriteria: { type: 'object' },
            testScenarios: { type: 'array', items: { type: 'object' } }
          }
        },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              findingId: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor', 'cosmetic'] },
              affectedTask: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        criticalFindings: { type: 'array', items: { type: 'string' } },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['human-factors', 'iec-62366', 'usability-testing', 'medical-device']
}));

export const uiOptimizationTask = defineTask('ui-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: UI Design Optimization - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Device UI/UX Designer with expertise in iterative design',
      task: 'Optimize user interface design based on formative evaluation findings',
      context: {
        deviceName: args.deviceName,
        formativeFindings: args.formativeFindings,
        uiDesignSpec: args.uiDesignSpec,
        criticalTasks: args.criticalTasks
      },
      instructions: [
        '1. Analyze formative evaluation findings',
        '2. Prioritize design changes based on risk and severity',
        '3. Develop design solutions for critical findings',
        '4. Document design rationale for changes',
        '5. Verify design changes address identified issues',
        '6. Update UI design specifications',
        '7. Plan verification of design changes',
        '8. Document design iteration history',
        '9. Assess readiness for summative validation',
        '10. Create optimized design documentation'
      ],
      outputFormat: 'JSON object with UI optimization documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['designChanges', 'updatedSpec', 'verificationPlan'],
      properties: {
        designChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              findingAddressed: { type: 'string' },
              changeDescription: { type: 'string' },
              rationale: { type: 'string' },
              verificationMethod: { type: 'string' }
            }
          }
        },
        updatedSpec: { type: 'object' },
        verificationPlan: { type: 'array', items: { type: 'object' } },
        readinessAssessment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['human-factors', 'iec-62366', 'ui-optimization', 'medical-device']
}));

export const summativeValidationPlanTask = defineTask('summative-validation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Summative Validation Planning - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Usability Validation Specialist with expertise in summative studies',
      task: 'Develop summative usability validation plan',
      context: {
        deviceName: args.deviceName,
        userProfiles: args.userProfiles,
        criticalTasks: args.criticalTasks,
        useEnvironmentCharacterization: args.useEnvironmentCharacterization,
        optimizedUI: args.optimizedUI
      },
      instructions: [
        '1. Define summative validation objectives',
        '2. Specify participant recruitment criteria (number, characteristics)',
        '3. Develop simulated use test protocol',
        '4. Define test scenarios for critical tasks',
        '5. Specify success criteria and pass/fail thresholds',
        '6. Define data collection methods and metrics',
        '7. Plan simulated use environment setup',
        '8. Define moderator instructions and scripts',
        '9. Plan data analysis methodology',
        '10. Create validation protocol document'
      ],
      outputFormat: 'JSON object with complete summative validation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'protocol', 'successCriteria'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            participantCriteria: { type: 'object' },
            sampleSize: { type: 'object' },
            testEnvironment: { type: 'object' }
          }
        },
        protocol: {
          type: 'object',
          properties: {
            testScenarios: { type: 'array', items: { type: 'object' } },
            moderatorScript: { type: 'string' },
            dataCollectionForms: { type: 'array', items: { type: 'string' } }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              metric: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        analysisMethodology: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['human-factors', 'iec-62366', 'validation', 'medical-device']
}));

export const useErrorAnalysisTask = defineTask('use-error-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Use Error Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Human Factors Safety Analyst with expertise in use error analysis',
      task: 'Conduct comprehensive use error analysis and root cause evaluation',
      context: {
        deviceName: args.deviceName,
        taskAnalysis: args.taskAnalysis,
        formativeEvaluation: args.formativeEvaluation,
        useRelatedRiskAnalysis: args.useRelatedRiskAnalysis
      },
      instructions: [
        '1. Identify all observed and potential use errors',
        '2. Classify use errors by type (perception, cognition, action)',
        '3. Conduct root cause analysis for use errors',
        '4. Identify contributing factors (design, training, environment)',
        '5. Link use errors to hazardous situations',
        '6. Assess severity of potential harm from use errors',
        '7. Evaluate effectiveness of existing risk controls',
        '8. Recommend additional risk controls if needed',
        '9. Document residual use-related risks',
        '10. Create use error summary for risk management file'
      ],
      outputFormat: 'JSON object with complete use error analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['useErrors', 'rootCauseAnalysis', 'residualRisks'],
      properties: {
        useErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorId: { type: 'string' },
              description: { type: 'string' },
              errorType: { type: 'string' },
              task: { type: 'string' },
              rootCause: { type: 'string' },
              contributingFactors: { type: 'array', items: { type: 'string' } },
              hazardousSituation: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        rootCauseAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorId: { type: 'string' },
              rootCause: { type: 'string' },
              designContribution: { type: 'string' },
              mitigationEffectiveness: { type: 'string' }
            }
          }
        },
        residualRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              description: { type: 'string' },
              acceptability: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['human-factors', 'iec-62366', 'use-error', 'medical-device']
}));

export const hfeFileCompilationTask = defineTask('hfe-file-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: HFE File Compilation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Human Factors Specialist with expertise in HFE documentation',
      task: 'Compile comprehensive Human Factors Engineering File',
      context: {
        deviceName: args.deviceName,
        intendedUsers: args.intendedUsers,
        useRelatedRiskAnalysis: args.useRelatedRiskAnalysis,
        userProfiles: args.userProfiles,
        useEnvironmentCharacterization: args.useEnvironmentCharacterization,
        taskAnalysis: args.taskAnalysis,
        uiDesignSpec: args.uiDesignSpec,
        formativeEvaluation: args.formativeEvaluation,
        uiOptimization: args.uiOptimization,
        summativeValidationPlan: args.summativeValidationPlan,
        useErrorAnalysis: args.useErrorAnalysis
      },
      instructions: [
        '1. Compile HFE process documentation',
        '2. Document use specification (users, environments, use)',
        '3. Compile user interface specification',
        '4. Document use-related risk analysis',
        '5. Compile formative evaluation records',
        '6. Document UI design and optimization history',
        '7. Include summative validation protocol',
        '8. Compile use error analysis',
        '9. Document residual use-related risks',
        '10. Create HFE summary report'
      ],
      outputFormat: 'JSON object with complete HFE file'
    },
    outputSchema: {
      type: 'object',
      required: ['file', 'completeness', 'nextSteps'],
      properties: {
        file: {
          type: 'object',
          properties: {
            tableOfContents: { type: 'array', items: { type: 'string' } },
            useSpecification: { type: 'object' },
            userInterfaceSpecification: { type: 'object' },
            useRelatedRiskAnalysis: { type: 'object' },
            formativeEvaluationRecords: { type: 'object' },
            summativeValidationProtocol: { type: 'object' },
            useErrorAnalysis: { type: 'object' },
            residualRisks: { type: 'object' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            missingElements: { type: 'array', items: { type: 'string' } }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              responsible: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['human-factors', 'iec-62366', 'documentation', 'medical-device']
}));

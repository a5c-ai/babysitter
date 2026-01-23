/**
 * @process product-management/customer-advisory-board
 * @description Customer Advisory Board (CAB) Setup process with program purpose definition, member selection criteria, program structure design, meeting cadence planning, feedback mechanisms, and value exchange framework
 * @inputs { productName: string, programGoals: array, outputDir: string, boardSize: number, customerBase: object, meetingFrequency: string, industryFocus: array, programDuration: string }
 * @outputs { success: boolean, programCharter: object, selectionCriteria: object, memberProfiles: array, meetingStructure: object, feedbackMechanisms: array, valueExchange: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName = '',
    programGoals = [],
    outputDir = 'cab-output',
    boardSize = 12,
    customerBase = {},
    meetingFrequency = 'quarterly',
    industryFocus = [],
    programDuration = '12 months',
    includeExternalExperts = false,
    requireNDA = true,
    compensationModel = 'mixed', // 'none', 'monetary', 'credits', 'mixed'
    virtualMeetings = true,
    executiveSponsorRequired = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Customer Advisory Board (CAB) Setup for: ${productName}`);
  ctx.log('info', `Board size: ${boardSize}, Meeting frequency: ${meetingFrequency}`);

  // ============================================================================
  // PHASE 1: CAB PURPOSE AND CHARTER DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining CAB purpose and charter');
  const charterDefinition = await ctx.task(cabCharterDefinitionTask, {
    productName,
    programGoals,
    boardSize,
    meetingFrequency,
    programDuration,
    executiveSponsorRequired,
    outputDir
  });

  artifacts.push(...charterDefinition.artifacts);

  const programCharter = charterDefinition.charter;
  ctx.log('info', `CAB charter created with ${programCharter.objectives.length} objectives`);

  // ============================================================================
  // PHASE 2: MEMBER SELECTION CRITERIA AND PROCESS
  // ============================================================================

  ctx.log('info', 'Phase 2: Establishing member selection criteria and process');
  const selectionCriteria = await ctx.task(memberSelectionCriteriaTask, {
    productName,
    programCharter,
    boardSize,
    customerBase,
    industryFocus,
    includeExternalExperts,
    outputDir
  });

  artifacts.push(...selectionCriteria.artifacts);

  ctx.log('info', `Selection criteria defined with ${selectionCriteria.criteria.length} key criteria`);

  // Breakpoint: Review charter and selection criteria
  await ctx.breakpoint({
    question: `CAB charter and member selection criteria complete. Board size: ${boardSize} members, ${selectionCriteria.diversityDimensions.length} diversity dimensions. Review before member identification?`,
    title: 'CAB Foundation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        programPurpose: programCharter.purpose,
        boardSize,
        meetingFrequency,
        criteriaCount: selectionCriteria.criteria.length
      }
    }
  });

  // ============================================================================
  // PHASE 3: IDEAL MEMBER PROFILE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing ideal member profiles');
  const memberProfiles = await ctx.task(memberProfileDevelopmentTask, {
    productName,
    programCharter,
    selectionCriteria,
    boardSize,
    customerBase,
    industryFocus,
    outputDir
  });

  artifacts.push(...memberProfiles.artifacts);

  ctx.log('info', `Created ${memberProfiles.profiles.length} member profile archetypes`);

  // ============================================================================
  // PHASE 4: RECRUITMENT AND NOMINATION PROCESS
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing recruitment and nomination process');
  const recruitmentProcess = await ctx.task(recruitmentProcessTask, {
    productName,
    programCharter,
    selectionCriteria,
    memberProfiles: memberProfiles.profiles,
    customerBase,
    requireNDA,
    outputDir
  });

  artifacts.push(...recruitmentProcess.artifacts);

  // ============================================================================
  // PHASE 5: PROGRAM STRUCTURE AND GOVERNANCE
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing program structure and governance');
  const programStructure = await ctx.task(programStructureTask, {
    productName,
    programCharter,
    boardSize,
    meetingFrequency,
    programDuration,
    executiveSponsorRequired,
    virtualMeetings,
    outputDir
  });

  artifacts.push(...programStructure.artifacts);

  const meetingStructure = programStructure.meetingStructure;
  ctx.log('info', `Program structure created with ${meetingStructure.meetingTypes.length} meeting types`);

  // Breakpoint: Review program structure
  await ctx.breakpoint({
    question: `Program structure and governance designed. ${meetingStructure.meetingTypes.length} meeting types, ${programStructure.governance.roles.length} governance roles. Review structure?`,
    title: 'Program Structure Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        meetingFrequency,
        meetingTypes: meetingStructure.meetingTypes.length,
        governanceRoles: programStructure.governance.roles.length,
        virtualMeetings
      }
    }
  });

  // ============================================================================
  // PHASE 6: MEETING CADENCE AND AGENDA FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 6: Establishing meeting cadence and agenda framework');
  const meetingCadence = await ctx.task(meetingCadenceTask, {
    productName,
    programCharter,
    meetingFrequency,
    programDuration,
    meetingStructure,
    virtualMeetings,
    outputDir
  });

  artifacts.push(...meetingCadence.artifacts);

  ctx.log('info', `Meeting cadence established: ${meetingCadence.annualMeetings} meetings per year`);

  // ============================================================================
  // PHASE 7: FEEDBACK MECHANISMS AND INPUT CHANNELS
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing feedback mechanisms and input channels');
  const feedbackMechanisms = await ctx.task(feedbackMechanismsTask, {
    productName,
    programCharter,
    boardSize,
    meetingCadence,
    virtualMeetings,
    outputDir
  });

  artifacts.push(...feedbackMechanisms.artifacts);

  const mechanisms = feedbackMechanisms.mechanisms;
  ctx.log('info', `Created ${mechanisms.length} feedback mechanisms`);

  // ============================================================================
  // PHASE 8: VALUE EXCHANGE AND MEMBER BENEFITS
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining value exchange and member benefits');
  const valueExchange = await ctx.task(valueExchangeTask, {
    productName,
    programCharter,
    boardSize,
    compensationModel,
    meetingCadence,
    outputDir
  });

  artifacts.push(...valueExchange.artifacts);

  ctx.log('info', `Value exchange framework created with ${valueExchange.memberBenefits.length} member benefits`);

  // Breakpoint: Review feedback and value exchange
  await ctx.breakpoint({
    question: `Feedback mechanisms (${mechanisms.length}) and value exchange framework complete. Compensation model: ${compensationModel}. Review engagement approach?`,
    title: 'Engagement Framework Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        feedbackMechanisms: mechanisms.length,
        memberBenefits: valueExchange.memberBenefits.length,
        compensationModel,
        timeCommitment: valueExchange.timeCommitment
      }
    }
  });

  // ============================================================================
  // PHASE 9: COMMUNICATION AND ENGAGEMENT PLAN
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing communication and engagement plan');
  const communicationPlan = await ctx.task(communicationPlanTask, {
    productName,
    programCharter,
    boardSize,
    meetingCadence,
    feedbackMechanisms,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // ============================================================================
  // PHASE 10: ONBOARDING AND ORIENTATION PROGRAM
  // ============================================================================

  ctx.log('info', 'Phase 10: Designing onboarding and orientation program');
  const onboardingProgram = await ctx.task(onboardingProgramTask, {
    productName,
    programCharter,
    programStructure,
    valueExchange,
    requireNDA,
    outputDir
  });

  artifacts.push(...onboardingProgram.artifacts);

  // ============================================================================
  // PHASE 11: SUCCESS METRICS AND MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 11: Defining success metrics and measurement framework');
  const successMetrics = await ctx.task(successMetricsTask, {
    productName,
    programCharter,
    programGoals,
    boardSize,
    meetingCadence,
    outputDir
  });

  artifacts.push(...successMetrics.artifacts);

  ctx.log('info', `Defined ${successMetrics.metrics.length} success metrics`);

  // ============================================================================
  // PHASE 12: PROGRAM LAUNCH PLAN
  // ============================================================================

  ctx.log('info', 'Phase 12: Creating program launch plan');
  const launchPlan = await ctx.task(launchPlanTask, {
    productName,
    programCharter,
    recruitmentProcess,
    onboardingProgram,
    meetingCadence,
    communicationPlan,
    outputDir
  });

  artifacts.push(...launchPlan.artifacts);

  // ============================================================================
  // PHASE 13: PROGRAM DOCUMENTATION AND PLAYBOOK
  // ============================================================================

  ctx.log('info', 'Phase 13: Assembling comprehensive CAB program playbook');
  const programPlaybook = await ctx.task(programPlaybookTask, {
    productName,
    programCharter,
    selectionCriteria,
    memberProfiles: memberProfiles.profiles,
    programStructure,
    meetingCadence,
    feedbackMechanisms,
    valueExchange,
    communicationPlan,
    onboardingProgram,
    successMetrics,
    launchPlan,
    outputDir
  });

  artifacts.push(...programPlaybook.artifacts);

  // ============================================================================
  // PHASE 14: PROGRAM VALIDATION AND READINESS CHECK
  // ============================================================================

  ctx.log('info', 'Phase 14: Validating program design and readiness');
  const programValidation = await ctx.task(programValidationTask, {
    productName,
    programPlaybook: programPlaybook.playbook,
    programCharter,
    programStructure,
    selectionCriteria,
    valueExchange,
    outputDir
  });

  artifacts.push(...programValidation.artifacts);

  const readinessScore = programValidation.readinessScore;
  const programReady = readinessScore >= 85;

  // Final Breakpoint: Review complete program
  await ctx.breakpoint({
    question: `CAB program design complete. Readiness score: ${readinessScore}/100. ${programReady ? 'Ready to launch!' : 'May need adjustments before launch.'} Review complete program?`,
    title: 'CAB Program Readiness Review',
    context: {
      runId: ctx.runId,
      files: [{
        path: programPlaybook.playbookPath,
        format: 'markdown',
        label: 'CAB Program Playbook'
      }, {
        path: programValidation.reportPath,
        format: 'markdown',
        label: 'Program Validation Report'
      }],
      summary: {
        readinessScore,
        programReady,
        boardSize,
        meetingFrequency,
        compensationModel,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    programCharter: {
      purpose: programCharter.purpose,
      objectives: programCharter.objectives.length,
      scope: programCharter.scope
    },
    selectionCriteria: {
      criteria: selectionCriteria.criteria.length,
      diversityDimensions: selectionCriteria.diversityDimensions.length,
      selectionProcess: selectionCriteria.processSteps
    },
    memberProfiles: memberProfiles.profiles.map(p => ({
      archetype: p.archetype,
      priority: p.priority
    })),
    programStructure: {
      boardSize,
      meetingFrequency,
      programDuration,
      governance: programStructure.governance.roles.length
    },
    meetingStructure: {
      annualMeetings: meetingCadence.annualMeetings,
      meetingTypes: meetingStructure.meetingTypes.length,
      agendaTemplates: meetingCadence.agendaTemplates.length
    },
    feedbackMechanisms: mechanisms.map(m => ({
      type: m.type,
      frequency: m.frequency
    })),
    valueExchange: {
      compensationModel,
      memberBenefits: valueExchange.memberBenefits.length,
      timeCommitment: valueExchange.timeCommitment,
      companyInvestment: valueExchange.companyInvestment
    },
    onboarding: {
      phases: onboardingProgram.phases.length,
      duration: onboardingProgram.duration
    },
    successMetrics: {
      metrics: successMetrics.metrics.length,
      reviewCadence: successMetrics.reviewCadence
    },
    launchPlan: {
      phases: launchPlan.phases.length,
      launchTimeline: launchPlan.timeline,
      firstMeetingDate: launchPlan.firstMeetingDate
    },
    readinessScore,
    programReady,
    playbookPath: programPlaybook.playbookPath,
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/customer-advisory-board',
      timestamp: startTime,
      outputDir,
      boardSize,
      meetingFrequency,
      compensationModel
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: CAB Charter Definition
export const cabCharterDefinitionTask = defineTask('cab-charter-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define CAB purpose and charter',
  agent: {
    name: 'cab-strategist',
    prompt: {
      role: 'customer advisory board strategist and program design expert',
      task: 'Define comprehensive Customer Advisory Board charter and program purpose',
      context: args,
      instructions: [
        'Create CAB charter document with components:',
        '  1. Program Purpose',
        '     - Why establish a CAB',
        '     - Strategic value to company',
        '     - Value to members',
        '     - Differentiation from other customer engagement',
        '  2. Program Vision',
        '     - Desired future state',
        '     - Impact on product and customers',
        '     - Long-term aspirations',
        '  3. Program Objectives',
        '     - Gather customer insights and feedback',
        '     - Validate product direction and roadmap',
        '     - Foster innovation and co-creation',
        '     - Build customer champions and advocates',
        '     - Strengthen customer relationships',
        '     - Enhance market understanding',
        '     - For each objective: specific outcomes',
        '  4. Scope',
        '     - What CAB will cover (in scope)',
        '     - What CAB will not cover (out of scope)',
        '     - Boundaries and limitations',
        '  5. Guiding Principles',
        '     - Transparency and openness',
        '     - Mutual respect and trust',
        '     - Confidentiality and NDA',
        '     - Action-oriented feedback',
        '     - Diverse perspectives',
        '     - Regular engagement',
        '  6. Success Criteria',
        '     - What success looks like',
        '     - Key outcomes and impact',
        '  7. Executive Sponsorship (if required)',
        '     - Executive sponsor role and responsibilities',
        '     - Commitment and involvement',
        '  8. Program Commitment',
        '     - Duration (e.g., 12 months)',
        '     - Meeting frequency',
        '     - Expected time commitment',
        'Ensure charter is inspiring yet practical',
        'Align with program goals provided',
        'Save CAB charter to output directory'
      ],
      outputFormat: 'JSON with charter (object with purpose, vision, objectives, scope, principles, successCriteria, sponsorship), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['charter', 'artifacts'],
      properties: {
        charter: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            vision: { type: 'string' },
            objectives: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objective: { type: 'string' },
                  outcomes: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium'] }
                }
              }
            },
            scope: {
              type: 'object',
              properties: {
                inScope: { type: 'array', items: { type: 'string' } },
                outOfScope: { type: 'array', items: { type: 'string' } }
              }
            },
            principles: { type: 'array', items: { type: 'string' } },
            successCriteria: { type: 'array', items: { type: 'string' } },
            sponsorship: {
              type: 'object',
              properties: {
                required: { type: 'boolean' },
                role: { type: 'string' },
                responsibilities: { type: 'array', items: { type: 'string' } }
              }
            },
            programCommitment: {
              type: 'object',
              properties: {
                duration: { type: 'string' },
                frequency: { type: 'string' },
                timeCommitment: { type: 'string' }
              }
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
  labels: ['agent', 'customer-advisory-board', 'charter']
}));

// Task 2: Member Selection Criteria
export const memberSelectionCriteriaTask = defineTask('member-selection-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish member selection criteria',
  agent: {
    name: 'selection-strategist',
    prompt: {
      role: 'customer engagement specialist and board composition expert',
      task: 'Define comprehensive member selection criteria and process',
      context: args,
      instructions: [
        'Define selection criteria across dimensions:',
        '  1. Customer Profile Criteria',
        '     - Customer tenure (long-term customers preferred)',
        '     - Product usage level (active, power users)',
        '     - Account value/size',
        '     - Product adoption breadth',
        '     - Customer satisfaction/NPS score',
        '  2. Industry and Market Criteria',
        '     - Industry representation (target industries)',
        '     - Company size (SMB, mid-market, enterprise)',
        '     - Geographic distribution',
        '     - Market segment coverage',
        '  3. Role and Expertise Criteria',
        '     - Decision-maker or influencer',
        '     - Technical vs. business user',
        '     - Functional expertise',
        '     - Innovation mindset',
        '  4. Engagement Criteria',
        '     - Willingness to provide candid feedback',
        '     - Communication skills',
        '     - Time availability',
        '     - Collaborative mindset',
        '     - Track record of participation',
        '  5. Diversity Criteria',
        '     - Industry diversity',
        '     - Company size diversity',
        '     - Role diversity',
        '     - Geographic diversity',
        '     - Perspective diversity (champions, critics, pragmatists)',
        '  6. External Experts (if included)',
        '     - Industry analysts',
        '     - Academic researchers',
        '     - Independent consultants',
        'Define selection process:',
        '  - Nomination process (how candidates are identified)',
        '  - Evaluation process (scoring criteria)',
        '  - Approval process (who decides)',
        '  - Invitation process',
        'Create scoring rubric for candidate evaluation',
        'Define minimum and preferred qualifications',
        'Establish diversity targets for balanced board composition',
        'Document selection timeline and milestones',
        'Save selection criteria and process to output directory'
      ],
      outputFormat: 'JSON with criteria (array), diversityDimensions (array), scoringRubric (object), processSteps (array), qualifications (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'diversityDimensions', 'scoringRubric', 'processSteps', 'artifacts'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              criterion: { type: 'string' },
              weight: { type: 'number' },
              evaluationMethod: { type: 'string' }
            }
          }
        },
        diversityDimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              targetDistribution: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        scoringRubric: {
          type: 'object',
          properties: {
            totalScore: { type: 'number' },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  maxScore: { type: 'number' },
                  weight: { type: 'number' }
                }
              }
            },
            passingScore: { type: 'number' }
          }
        },
        processSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              description: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        qualifications: {
          type: 'object',
          properties: {
            minimum: { type: 'array', items: { type: 'string' } },
            preferred: { type: 'array', items: { type: 'string' } },
            disqualifiers: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'customer-advisory-board', 'selection-criteria']
}));

// Task 3: Member Profile Development
export const memberProfileDevelopmentTask = defineTask('member-profile-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop ideal member profiles',
  agent: {
    name: 'profile-architect',
    prompt: {
      role: 'customer segmentation expert and persona developer',
      task: 'Create ideal member profile archetypes for CAB composition',
      context: args,
      instructions: [
        'Based on selection criteria and board size, create member profile archetypes',
        'For typical board of 12 members, create 4-6 profile archetypes:',
        '  - Strategic Enterprise Leader (Fortune 500 decision maker)',
        '  - Innovation Champion (early adopter, tech-forward)',
        '  - Power User Expert (deep product expertise)',
        '  - Industry Specialist (vertical industry expert)',
        '  - Growth Company Leader (scaling business)',
        '  - Critical Evaluator (constructive critic)',
        'For each profile archetype, document:',
        '  - Archetype name and description',
        '  - Company profile (size, industry)',
        '  - Role and title',
        '  - Product usage patterns',
        '  - Key characteristics',
        '  - Value they bring to CAB',
        '  - Perspective they represent',
        '  - Priority level (how many seats to allocate)',
        'Create target composition matrix:',
        '  - Number of members per archetype',
        '  - Balance across dimensions',
        '  - Rationale for mix',
        'Develop candidate identification strategies per archetype',
        'Define "reserve" profiles for substitution if needed',
        'Save member profiles to output directory'
      ],
      outputFormat: 'JSON with profiles (array), compositionMatrix (object), identificationStrategies (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'compositionMatrix', 'identificationStrategies', 'artifacts'],
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              archetype: { type: 'string' },
              description: { type: 'string' },
              companyProfile: {
                type: 'object',
                properties: {
                  sizeRange: { type: 'string' },
                  industries: { type: 'array', items: { type: 'string' } }
                }
              },
              roleTitle: { type: 'string' },
              usagePatterns: { type: 'array', items: { type: 'string' } },
              characteristics: { type: 'array', items: { type: 'string' } },
              valueToCAB: { type: 'array', items: { type: 'string' } },
              perspectiveRepresented: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium'] },
              targetCount: { type: 'number' }
            }
          }
        },
        compositionMatrix: {
          type: 'object',
          properties: {
            totalSeats: { type: 'number' },
            distribution: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  archetype: { type: 'string' },
                  seats: { type: 'number' },
                  percentage: { type: 'number' }
                }
              }
            },
            balanceRationale: { type: 'string' }
          }
        },
        identificationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              archetype: { type: 'string' },
              strategy: { type: 'string' },
              sources: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'customer-advisory-board', 'member-profiles']
}));

// Task 4: Recruitment Process
export const recruitmentProcessTask = defineTask('recruitment-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design recruitment and nomination process',
  agent: {
    name: 'recruitment-coordinator',
    prompt: {
      role: 'customer program manager and recruitment specialist',
      task: 'Design end-to-end recruitment and nomination process',
      context: args,
      instructions: [
        'Design recruitment process with phases:',
        '  1. Candidate Identification',
        '     - Internal nominations (CSMs, sales, support)',
        '     - Customer referrals',
        '     - Data-driven selection (usage analytics)',
        '     - Direct outreach to target profiles',
        '  2. Initial Screening',
        '     - Criteria checklist evaluation',
        '     - Fit assessment',
        '     - Availability confirmation',
        '  3. Nomination Package',
        '     - Nominator completes form',
        '     - Customer profile summary',
        '     - Rationale for nomination',
        '     - Supporting evidence',
        '  4. Review and Selection',
        '     - Review committee composition',
        '     - Scoring process',
        '     - Deliberation framework',
        '     - Final approval',
        '  5. Invitation Process',
        '     - Personalized invitation (email template)',
        '     - Executive-level outreach',
        '     - Program overview presentation',
        '     - Q&A and information sessions',
        '  6. Acceptance and Onboarding',
        '     - Acceptance confirmation',
        '     - NDA execution (if required)',
        '     - Onboarding initiation',
        'Create templates and tools:',
        '  - Nomination form template',
        '  - Invitation email template',
        '  - Program overview deck',
        '  - FAQ document',
        '  - NDA template (if required)',
        'Define timeline for recruitment cycle',
        'Establish contingency plan for declined invitations',
        'Save recruitment process and templates to output directory'
      ],
      outputFormat: 'JSON with processPhases (array), templates (array), reviewCommittee (object), timeline (object), contingencyPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processPhases', 'templates', 'reviewCommittee', 'timeline', 'artifacts'],
      properties: {
        processPhases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              description: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              templateName: { type: 'string' },
              purpose: { type: 'string' },
              templatePath: { type: 'string' }
            }
          }
        },
        reviewCommittee: {
          type: 'object',
          properties: {
            roles: { type: 'array', items: { type: 'string' } },
            votingProcess: { type: 'string' },
            quorum: { type: 'string' }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  timing: { type: 'string' }
                }
              }
            }
          }
        },
        contingencyPlan: {
          type: 'object',
          properties: {
            acceptanceRate: { type: 'string' },
            backupPlan: { type: 'string' },
            rollingRecruitment: { type: 'boolean' }
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
  labels: ['agent', 'customer-advisory-board', 'recruitment']
}));

// Task 5: Program Structure
export const programStructureTask = defineTask('program-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design program structure and governance',
  agent: {
    name: 'program-architect',
    prompt: {
      role: 'program management expert and organizational designer',
      task: 'Design comprehensive program structure and governance model',
      context: args,
      instructions: [
        'Design program structure with components:',
        '  1. Governance Model',
        '     - Executive Sponsor (role and responsibilities)',
        '     - Program Manager (CAB lead)',
        '     - Program Coordinator (logistics)',
        '     - Subject Matter Experts (as needed)',
        '     - Decision-making authority',
        '  2. Meeting Structure',
        '     - Quarterly full board meetings (primary)',
        '     - Working group sessions (topic-specific)',
        '     - 1-on-1 touchpoints (individual member)',
        '     - Executive roundtables (leadership interaction)',
        '     - Virtual office hours (ad-hoc)',
        '  3. Communication Channels',
        '     - Primary communication platform (email, Slack, portal)',
        '     - Meeting platform (Zoom, Teams)',
        '     - Collaboration tools (shared documents)',
        '     - Private CAB portal or community',
        '  4. Working Groups (optional)',
        '     - Topic-based sub-groups',
        '     - Member-led initiatives',
        '     - Deep-dive sessions',
        '  5. Term Structure',
        '     - Initial term length (e.g., 12 months)',
        '     - Renewal process',
        '     - Rotation policy',
        '     - Emeritus status',
        '  6. Roles and Responsibilities',
        '     - Member expectations and commitments',
        '     - Company team responsibilities',
        '     - Mutual obligations',
        'Define escalation and issue resolution process',
        'Establish program review and evolution mechanism',
        'Save program structure to output directory'
      ],
      outputFormat: 'JSON with governance (object), meetingStructure (object), communicationChannels (array), workingGroups (object), termStructure (object), rolesResponsibilities (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['governance', 'meetingStructure', 'communicationChannels', 'termStructure', 'artifacts'],
      properties: {
        governance: {
          type: 'object',
          properties: {
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  responsibilities: { type: 'array', items: { type: 'string' } },
                  timeCommitment: { type: 'string' }
                }
              }
            },
            decisionMaking: { type: 'string' }
          }
        },
        meetingStructure: {
          type: 'object',
          properties: {
            meetingTypes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  frequency: { type: 'string' },
                  duration: { type: 'string' },
                  format: { type: 'string' },
                  participants: { type: 'string' },
                  purpose: { type: 'string' }
                }
              }
            }
          }
        },
        communicationChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              purpose: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        workingGroups: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            structure: { type: 'string' },
            examples: { type: 'array', items: { type: 'string' } }
          }
        },
        termStructure: {
          type: 'object',
          properties: {
            initialTerm: { type: 'string' },
            renewalProcess: { type: 'string' },
            rotationPolicy: { type: 'string' },
            emeritusStatus: { type: 'boolean' }
          }
        },
        rolesResponsibilities: {
          type: 'object',
          properties: {
            memberExpectations: { type: 'array', items: { type: 'string' } },
            companyCommitments: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'customer-advisory-board', 'program-structure']
}));

// Task 6: Meeting Cadence
export const meetingCadenceTask = defineTask('meeting-cadence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish meeting cadence and agenda framework',
  agent: {
    name: 'meeting-planner',
    prompt: {
      role: 'program coordinator and meeting facilitation expert',
      task: 'Design meeting cadence and create agenda framework templates',
      context: args,
      instructions: [
        'Plan annual meeting calendar based on frequency:',
        '  - Quarterly: 4 full board meetings per year',
        '  - Biannual: 2 full board meetings per year',
        '  - Monthly: 12 meetings per year',
        '  - Custom: based on program needs',
        'For each meeting type, create agenda template:',
        '  1. Quarterly Full Board Meeting (3-4 hours)',
        '     - Welcome and introductions (if new members)',
        '     - Program updates and achievements',
        '     - Product roadmap review and feedback',
        '     - Deep dive topic 1 (customer challenge)',
        '     - Deep dive topic 2 (innovation area)',
        '     - Open discussion and Q&A',
        '     - Action items and next steps',
        '     - Closing and appreciation',
        '  2. Working Group Session (1-2 hours)',
        '     - Focused topic exploration',
        '     - Collaborative problem-solving',
        '     - Recommendations development',
        '  3. Executive Roundtable (1 hour)',
        '     - Strategic discussion with leadership',
        '     - Vision and direction alignment',
        '     - High-level feedback',
        '  4. 1-on-1 Touchpoint (30 minutes)',
        '     - Individual relationship building',
        '     - Personal feedback and insights',
        '     - Issue resolution',
        'Define meeting preparation process:',
        '  - Pre-read materials (sent X days before)',
        '  - Preparation expectations',
        '  - Background briefings',
        'Establish meeting follow-up process:',
        '  - Meeting summary and notes',
        '  - Action items tracking',
        '  - Feedback incorporation',
        '  - "You said, we did" follow-through',
        'Create annual calendar with themes per meeting',
        'Define virtual vs. in-person meeting strategy',
        'Save meeting cadence and agenda templates to output directory'
      ],
      outputFormat: 'JSON with annualMeetings (number), annualCalendar (array), agendaTemplates (array), preparationProcess (object), followUpProcess (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['annualMeetings', 'annualCalendar', 'agendaTemplates', 'preparationProcess', 'followUpProcess', 'artifacts'],
      properties: {
        annualMeetings: { type: 'number' },
        annualCalendar: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meetingNumber: { type: 'number' },
              type: { type: 'string' },
              timing: { type: 'string' },
              theme: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        agendaTemplates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meetingType: { type: 'string' },
              duration: { type: 'string' },
              sections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    section: { type: 'string' },
                    duration: { type: 'string' },
                    purpose: { type: 'string' },
                    facilitator: { type: 'string' }
                  }
                }
              },
              templatePath: { type: 'string' }
            }
          }
        },
        preparationProcess: {
          type: 'object',
          properties: {
            preReadLeadTime: { type: 'string' },
            materialsProvided: { type: 'array', items: { type: 'string' } },
            memberPreparation: { type: 'array', items: { type: 'string' } }
          }
        },
        followUpProcess: {
          type: 'object',
          properties: {
            summaryDelivery: { type: 'string' },
            actionItemTracking: { type: 'string' },
            feedbackLoop: { type: 'string' },
            youSaidWeDidCadence: { type: 'string' }
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
  labels: ['agent', 'customer-advisory-board', 'meeting-cadence']
}));

// Task 7: Feedback Mechanisms
export const feedbackMechanismsTask = defineTask('feedback-mechanisms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feedback mechanisms and input channels',
  agent: {
    name: 'feedback-architect',
    prompt: {
      role: 'customer experience expert and feedback systems designer',
      task: 'Design comprehensive feedback mechanisms and input channels',
      context: args,
      instructions: [
        'Design multiple feedback mechanisms:',
        '  1. Structured Feedback',
        '     - Quarterly board meetings (primary channel)',
        '     - Topic-specific surveys (between meetings)',
        '     - Product roadmap reviews (voting/prioritization)',
        '     - Feature validation sessions',
        '     - Beta testing feedback',
        '  2. Ad-hoc Input Channels',
        '     - Online feedback portal (always available)',
        '     - Email to program manager',
        '     - Virtual office hours',
        '     - Slack/Teams channel (if enabled)',
        '  3. Collaborative Mechanisms',
        '     - Working group sessions',
        '     - Co-creation workshops',
        '     - Design reviews',
        '     - Prototype testing',
        '  4. Proactive Outreach',
        '     - 1-on-1 interviews',
        '     - Pulse surveys',
        '     - Targeted questions on specific topics',
        '     - Early access programs',
        'For each mechanism, define:',
        '  - Type and format',
        '  - Frequency or availability',
        '  - Purpose and use cases',
        '  - Response expectations',
        '  - How feedback is processed',
        'Create feedback intake process:',
        '  - Collection',
        '  - Categorization and tagging',
        '  - Prioritization',
        '  - Routing to appropriate teams',
        '  - Action tracking',
        'Establish feedback loop closure:',
        '  - Acknowledgment of feedback',
        '  - Status updates on actions taken',
        '  - "You said, we did" reporting',
        '  - Impact measurement',
        'Define feedback effectiveness metrics',
        'Save feedback mechanisms framework to output directory'
      ],
      outputFormat: 'JSON with mechanisms (array), intakeProcess (object), closureProcess (object), effectivenessMetrics (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'intakeProcess', 'closureProcess', 'effectivenessMetrics', 'artifacts'],
      properties: {
        mechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              format: { type: 'string' },
              frequency: { type: 'string' },
              purpose: { type: 'string' },
              responseTime: { type: 'string' },
              processingMethod: { type: 'string' }
            }
          }
        },
        intakeProcess: {
          type: 'object',
          properties: {
            collection: { type: 'array', items: { type: 'string' } },
            categorization: { type: 'array', items: { type: 'string' } },
            prioritization: { type: 'string' },
            routing: { type: 'string' },
            tracking: { type: 'string' }
          }
        },
        closureProcess: {
          type: 'object',
          properties: {
            acknowledgment: { type: 'string' },
            statusUpdates: { type: 'string' },
            youSaidWeDidFormat: { type: 'string' },
            cadence: { type: 'string' }
          }
        },
        effectivenessMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
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
  labels: ['agent', 'customer-advisory-board', 'feedback-mechanisms']
}));

// Task 8: Value Exchange
export const valueExchangeTask = defineTask('value-exchange', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define value exchange and member benefits',
  agent: {
    name: 'value-strategist',
    prompt: {
      role: 'customer success expert and partnership strategist',
      task: 'Design comprehensive value exchange and member benefits framework',
      context: args,
      instructions: [
        'Define value members receive from CAB participation:',
        '  1. Influence and Impact',
        '     - Shape product roadmap',
        '     - Influence strategic direction',
        '     - Voice heard by leadership',
        '     - Early input on features',
        '  2. Exclusive Access',
        '     - Early product previews and beta access',
        '     - Roadmap visibility (under NDA)',
        '     - Executive access and relationships',
        '     - Insider knowledge',
        '  3. Networking and Community',
        '     - Peer-to-peer connections',
        '     - Best practice sharing',
        '     - Industry networking',
        '     - Executive relationships',
        '  4. Professional Development',
        '     - Thought leadership opportunities',
        '     - Speaking opportunities (events, webinars)',
        '     - Industry recognition',
        '     - Advisory board credential',
        '  5. Tangible Benefits (based on compensation model)',
        '     - Monetary compensation (if applicable)',
        '     - Product credits or discounts',
        '     - Conference passes',
        '     - Swag and recognition gifts',
        '     - Travel and accommodation (if in-person)',
        '  6. Service Benefits',
        '     - Priority support',
        '     - Dedicated success manager',
        '     - Training and enablement',
        '     - Custom integrations consideration',
        'Define compensation model based on input:',
        '  - None: pure volunteer, intrinsic motivation',
        '  - Monetary: annual stipend or per-meeting fee',
        '  - Credits: product credits or subscription value',
        '  - Mixed: combination of above',
        'Calculate member time commitment:',
        '  - Annual hours required',
        '  - Meeting time',
        '  - Preparation time',
        '  - Ad-hoc input time',
        'Calculate company investment:',
        '  - Direct compensation costs',
        '  - Program management time',
        '  - Meeting and event costs',
        '  - Tools and technology',
        '  - Travel and hospitality',
        'Define recognition program:',
        '  - CAB member badge/certificate',
        '  - LinkedIn recommendation',
        '  - Public acknowledgment (if approved)',
        '  - Appreciation events',
        'Save value exchange framework to output directory'
      ],
      outputFormat: 'JSON with memberBenefits (array), compensationDetails (object), timeCommitment (object), companyInvestment (object), recognitionProgram (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['memberBenefits', 'compensationDetails', 'timeCommitment', 'companyInvestment', 'artifacts'],
      properties: {
        memberBenefits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              benefits: { type: 'array', items: { type: 'string' } },
              value: { type: 'string' }
            }
          }
        },
        compensationDetails: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            structure: { type: 'string' },
            annualValue: { type: 'string' },
            paymentSchedule: { type: 'string' }
          }
        },
        timeCommitment: {
          type: 'object',
          properties: {
            annualHours: { type: 'string' },
            breakdown: {
              type: 'object',
              properties: {
                meetings: { type: 'string' },
                preparation: { type: 'string' },
                adHoc: { type: 'string' }
              }
            }
          }
        },
        companyInvestment: {
          type: 'object',
          properties: {
            totalAnnual: { type: 'string' },
            breakdown: {
              type: 'object',
              properties: {
                compensation: { type: 'string' },
                programManagement: { type: 'string' },
                events: { type: 'string' },
                technology: { type: 'string' },
                other: { type: 'string' }
              }
            }
          }
        },
        recognitionProgram: {
          type: 'object',
          properties: {
            elements: { type: 'array', items: { type: 'string' } },
            publicRecognition: { type: 'boolean' },
            appreciationEvents: { type: 'string' }
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
  labels: ['agent', 'customer-advisory-board', 'value-exchange']
}));

// Task 9: Communication Plan
export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop communication and engagement plan',
  agent: {
    name: 'communications-manager',
    prompt: {
      role: 'customer communications strategist and engagement expert',
      task: 'Create comprehensive communication and engagement plan',
      context: args,
      instructions: [
        'Design communication plan with components:',
        '  1. Regular Communications',
        '     - Monthly newsletter (program updates, achievements)',
        '     - Quarterly meeting invitations and prep materials',
        '     - Ad-hoc announcements (product launches, changes)',
        '     - "You said, we did" updates (feedback impact)',
        '  2. Communication Channels',
        '     - Primary: Email',
        '     - Secondary: CAB portal, Slack/Teams (if applicable)',
        '     - Video messages from executives',
        '     - Webinars and presentations',
        '  3. Content Types',
        '     - Program updates and news',
        '     - Product roadmap previews',
        '     - Industry insights and trends',
        '     - Member spotlights',
        '     - Success stories and case studies',
        '  4. Engagement Tactics',
        '     - Personalized 1-on-1 touchpoints',
        '     - Birthday and anniversary recognition',
        '     - Milestone celebrations',
        '     - Member referral program',
        '     - Social media engagement (if public)',
        '  5. Feedback Solicitation',
        '     - Regular pulse surveys',
        '     - Open feedback invitations',
        '     - Topic-specific input requests',
        '  6. Two-Way Communication',
        '     - Member-to-company channels',
        '     - Member-to-member networking',
        '     - Response commitments and SLAs',
        'Define communication cadence and calendar',
        'Create communication templates and guidelines',
        'Establish tone and voice standards',
        'Define escalation process for urgent matters',
        'Save communication plan to output directory'
      ],
      outputFormat: 'JSON with regularCommunications (array), channels (array), contentTypes (array), engagementTactics (array), communicationCalendar (object), templates (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['regularCommunications', 'channels', 'contentTypes', 'engagementTactics', 'communicationCalendar', 'artifacts'],
      properties: {
        regularCommunications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              frequency: { type: 'string' },
              purpose: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              primary: { type: 'boolean' },
              useCases: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        contentTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              frequency: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        engagementTactics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tactic: { type: 'string' },
              purpose: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        communicationCalendar: {
          type: 'object',
          properties: {
            annualPlan: { type: 'array' },
            keyMilestones: { type: 'array' }
          }
        },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              template: { type: 'string' },
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
  labels: ['agent', 'customer-advisory-board', 'communications']
}));

// Task 10: Onboarding Program
export const onboardingProgramTask = defineTask('onboarding-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design onboarding and orientation program',
  agent: {
    name: 'onboarding-specialist',
    prompt: {
      role: 'customer success manager and onboarding expert',
      task: 'Create comprehensive onboarding and orientation program for new CAB members',
      context: args,
      instructions: [
        'Design onboarding program with phases:',
        '  1. Pre-Onboarding (before first meeting)',
        '     - Welcome email and materials',
        '     - NDA execution (if required)',
        '     - CAB member agreement/charter signature',
        '     - Portal/tool access setup',
        '     - Introduction to program manager',
        '  2. Orientation Session (1-2 hours)',
        '     - Program overview and goals',
        '     - Member roles and expectations',
        '     - Meeting structure and cadence',
        '     - Feedback mechanisms',
        '     - Value exchange and benefits',
        '     - Confidentiality and NDA review',
        '     - Q&A',
        '  3. Product Deep Dive (as needed)',
        '     - Product overview and roadmap',
        '     - Key features and capabilities',
        '     - Technical architecture (if relevant)',
        '     - Demo and hands-on',
        '  4. Introductions',
        '     - Meet the team (executives, PM, success)',
        '     - Fellow CAB member introductions',
        '     - Peer networking session',
        '  5. First Meeting Preparation',
        '     - Agenda preview',
        '     - Background materials',
        '     - Meeting logistics',
        '     - How to contribute effectively',
        'Create onboarding materials:',
        '  - Welcome packet (digital or physical)',
        '  - CAB member handbook',
        '  - Product overview deck',
        '  - Organizational chart',
        '  - Contact directory',
        '  - FAQ document',
        '  - Portal/tools guide',
        'Define onboarding timeline (e.g., 30 days)',
        'Establish onboarding success criteria',
        'Create post-onboarding check-in process',
        'Save onboarding program to output directory'
      ],
      outputFormat: 'JSON with phases (array), materials (array), timeline (object), orientationAgenda (object), successCriteria (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'materials', 'timeline', 'orientationAgenda', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              timing: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              material: { type: 'string' },
              format: { type: 'string' },
              deliveryTiming: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  timing: { type: 'string' }
                }
              }
            }
          }
        },
        orientationAgenda: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic: { type: 'string' },
                  duration: { type: 'string' },
                  presenter: { type: 'string' }
                }
              }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              measurement: { type: 'string' }
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
  labels: ['agent', 'customer-advisory-board', 'onboarding']
}));

// Task 11: Success Metrics
export const successMetricsTask = defineTask('success-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success metrics and measurement framework',
  agent: {
    name: 'metrics-analyst',
    prompt: {
      role: 'program analytics expert and success measurement specialist',
      task: 'Define comprehensive success metrics and measurement framework for CAB program',
      context: args,
      instructions: [
        'Define success metrics across dimensions:',
        '  1. Engagement Metrics',
        '     - Meeting attendance rate (target: >85%)',
        '     - Active participation rate',
        '     - Feedback submission rate',
        '     - Survey response rate',
        '     - Portal/community engagement',
        '  2. Input Quality Metrics',
        '     - Feedback actionability score',
        '     - Ideas generated',
        '     - Product improvement suggestions',
        '     - Strategic insights contributed',
        '  3. Program Impact Metrics',
        '     - Product decisions influenced by CAB',
        '     - Features validated/invalidated',
        '     - Roadmap adjustments based on input',
        '     - Business outcomes from CAB insights',
        '  4. Member Satisfaction Metrics',
        '     - Overall program satisfaction (NPS or rating)',
        '     - Value received perception',
        '     - Renewal intent',
        '     - Referral rate',
        '  5. Relationship Metrics',
        '     - Customer health score improvement',
        '     - Expansion revenue from CAB customers',
        '     - Churn rate of CAB vs. non-CAB',
        '     - Advocacy (references, case studies, testimonials)',
        '  6. Efficiency Metrics',
        '     - Cost per member',
        '     - ROI of program',
        '     - Time to insight',
        '     - Feedback implementation rate',
        'For each metric, define:',
        '  - Measurement method',
        '  - Baseline (if available)',
        '  - Target',
        '  - Frequency of measurement',
        '  - Owner',
        'Establish program review cadence:',
        '  - Monthly operational review',
        '  - Quarterly program health check',
        '  - Annual program retrospective',
        'Create metrics dashboard and reporting format',
        'Define continuous improvement process',
        'Save success metrics framework to output directory'
      ],
      outputFormat: 'JSON with metrics (array), targets (object), reviewCadence (object), dashboard (object), continuousImprovement (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'targets', 'reviewCadence', 'dashboard', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              metric: { type: 'string' },
              definition: { type: 'string' },
              measurementMethod: { type: 'string' },
              baseline: { type: 'string' },
              target: { type: 'string' },
              frequency: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        targets: {
          type: 'object',
          properties: {
            engagement: { type: 'object' },
            satisfaction: { type: 'object' },
            impact: { type: 'object' }
          }
        },
        reviewCadence: {
          type: 'object',
          properties: {
            monthly: { type: 'string' },
            quarterly: { type: 'string' },
            annual: { type: 'string' }
          }
        },
        dashboard: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            keyMetrics: { type: 'array', items: { type: 'string' } },
            distribution: { type: 'string' }
          }
        },
        continuousImprovement: {
          type: 'object',
          properties: {
            process: { type: 'array', items: { type: 'string' } },
            reviewFrequency: { type: 'string' }
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
  labels: ['agent', 'customer-advisory-board', 'metrics']
}));

// Task 12: Launch Plan
export const launchPlanTask = defineTask('launch-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create program launch plan',
  agent: {
    name: 'launch-coordinator',
    prompt: {
      role: 'program launch specialist and project manager',
      task: 'Create comprehensive CAB program launch plan',
      context: args,
      instructions: [
        'Create launch plan with phases:',
        '  1. Pre-Launch Preparation (8-12 weeks)',
        '     - Finalize program design and materials',
        '     - Secure executive sponsorship',
        '     - Identify and train program team',
        '     - Set up technology and tools',
        '     - Create all templates and resources',
        '  2. Recruitment and Selection (6-8 weeks)',
        '     - Launch nomination process',
        '     - Screen and evaluate candidates',
        '     - Make selections',
        '     - Extend invitations',
        '     - Confirm acceptances',
        '  3. Onboarding (4-6 weeks)',
        '     - Welcome new members',
        '     - Complete legal/NDA',
        '     - Conduct orientation sessions',
        '     - Set up access and accounts',
        '     - Pre-meeting preparation',
        '  4. First Meeting (Week 0)',
        '     - Kick-off meeting',
        '     - Team building',
        '     - Program alignment',
        '     - First content session',
        '  5. Post-Launch (ongoing)',
        '     - Meeting cadence begins',
        '     - Continuous engagement',
        '     - Feedback collection',
        '     - Program optimization',
        'Create detailed timeline with milestones',
        'Define launch success criteria',
        'Identify launch risks and mitigation',
        'Assign responsibilities and ownership',
        'Create launch checklist',
        'Plan internal communication and alignment',
        'Set first meeting date and agenda',
        'Save launch plan to output directory'
      ],
      outputFormat: 'JSON with phases (array), timeline (object), successCriteria (array), risks (array), responsibilities (array), checklist (array), firstMeetingDate (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'successCriteria', 'checklist', 'firstMeetingDate', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              keyActivities: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              gateChecks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  date: { type: 'string' },
                  owner: { type: 'string' }
                }
              }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        responsibilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' }
            }
          }
        },
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              phase: { type: 'string' },
              status: { type: 'string', enum: ['not-started', 'in-progress', 'completed'] }
            }
          }
        },
        firstMeetingDate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer-advisory-board', 'launch-plan']
}));

// Task 13: Program Playbook
export const programPlaybookTask = defineTask('program-playbook', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble comprehensive CAB program playbook',
  agent: {
    name: 'playbook-author',
    prompt: {
      role: 'program documentation expert and operational guide writer',
      task: 'Compile comprehensive CAB program playbook',
      context: args,
      instructions: [
        'Create comprehensive program playbook with sections:',
        '  1. Executive Summary',
        '     - Program overview',
        '     - Business case and objectives',
        '     - Key design decisions',
        '  2. Program Charter',
        '     - Purpose, vision, objectives',
        '     - Scope and principles',
        '     - Success criteria',
        '  3. Member Selection',
        '     - Selection criteria and rubric',
        '     - Ideal member profiles',
        '     - Recruitment process',
        '     - Nomination templates',
        '  4. Program Structure',
        '     - Governance model',
        '     - Meeting structure and cadence',
        '     - Working groups',
        '     - Term structure',
        '  5. Meeting Operations',
        '     - Annual calendar',
        '     - Agenda templates',
        '     - Preparation and follow-up process',
        '     - Facilitation guide',
        '  6. Feedback and Engagement',
        '     - Feedback mechanisms',
        '     - Input channels',
        '     - Processing and closure',
        '  7. Value Exchange',
        '     - Member benefits',
        '     - Compensation details',
        '     - Recognition program',
        '     - Time commitment',
        '  8. Communications',
        '     - Communication plan',
        '     - Channels and cadence',
        '     - Templates and guidelines',
        '  9. Onboarding',
        '     - Onboarding program',
        '     - Materials and resources',
        '     - Orientation agenda',
        '  10. Success Metrics',
        '      - Measurement framework',
        '      - Targets and KPIs',
        '      - Review process',
        '  11. Launch Plan',
        '      - Implementation timeline',
        '      - Responsibilities',
        '      - Launch checklist',
        '  12. Templates and Tools',
        '      - All templates',
        '      - Tool guides',
        '      - Resource library',
        '  13. Appendices',
        '      - Legal templates (NDA)',
        '      - FAQs',
        '      - Best practices',
        'Format as comprehensive markdown document',
        'Include table of contents',
        'Add visual diagrams where helpful',
        'Make it actionable and operational',
        'Save playbook to output directory'
      ],
      outputFormat: 'JSON with playbook (string - full document), playbookPath (string), tableOfContents (array), sectionSummary (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['playbook', 'playbookPath', 'tableOfContents', 'artifacts'],
      properties: {
        playbook: { type: 'string' },
        playbookPath: { type: 'string' },
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
        sectionSummary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              pageCount: { type: 'number' }
            }
          }
        },
        totalPages: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer-advisory-board', 'documentation', 'playbook']
}));

// Task 14: Program Validation
export const programValidationTask = defineTask('program-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate program design and readiness',
  agent: {
    name: 'program-validator',
    prompt: {
      role: 'customer advisory board expert and program quality auditor',
      task: 'Validate CAB program design quality, completeness, and launch readiness',
      context: args,
      instructions: [
        'Evaluate program design across dimensions (weight each 0-100):',
        '  1. Strategic Alignment (20%)',
        '     - Clear purpose and objectives',
        '     - Aligned with business strategy',
        '     - Executive sponsorship secured',
        '  2. Member Selection (15%)',
        '     - Robust selection criteria',
        '     - Diverse composition planned',
        '     - Clear recruitment process',
        '  3. Program Structure (15%)',
        '     - Clear governance model',
        '     - Appropriate meeting cadence',
        '     - Defined roles and responsibilities',
        '  4. Engagement Design (15%)',
        '     - Multiple feedback mechanisms',
        '     - Rich agenda templates',
        '     - Two-way communication',
        '  5. Value Exchange (15%)',
        '     - Compelling member benefits',
        '     - Fair compensation model',
        '     - Clear time expectations',
        '  6. Operational Readiness (10%)',
        '     - Templates and materials complete',
        '     - Technology and tools ready',
        '     - Team trained and ready',
        '  7. Success Metrics (10%)',
        '     - Comprehensive metrics defined',
        '     - Measurement process established',
        '     - Review cadence set',
        'Calculate weighted overall readiness score (0-100)',
        'Score >85: Ready to launch',
        'Score 70-85: Minor adjustments needed',
        'Score <70: Significant work required',
        'Identify strengths of the program',
        'Identify gaps and areas for improvement',
        'Provide recommendations for enhancement',
        'Assess launch readiness for each phase',
        'Create validation report'
      ],
      outputFormat: 'JSON with readinessScore (number 0-100), dimensionScores (object), strengths (array), gaps (array), recommendations (array), launchReadiness (object), reportPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'dimensionScores', 'strengths', 'gaps', 'recommendations', 'launchReadiness', 'artifacts'],
      properties: {
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        dimensionScores: {
          type: 'object',
          properties: {
            strategicAlignment: { type: 'number' },
            memberSelection: { type: 'number' },
            programStructure: { type: 'number' },
            engagementDesign: { type: 'number' },
            valueExchange: { type: 'number' },
            operationalReadiness: { type: 'number' },
            successMetrics: { type: 'number' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        launchReadiness: {
          type: 'object',
          properties: {
            ready: { type: 'boolean' },
            assessment: { type: 'string' },
            blockers: { type: 'array', items: { type: 'string' } },
            phaseReadiness: {
              type: 'object',
              properties: {
                preparation: { type: 'boolean' },
                recruitment: { type: 'boolean' },
                onboarding: { type: 'boolean' },
                firstMeeting: { type: 'boolean' }
              }
            }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer-advisory-board', 'validation', 'quality']
}));

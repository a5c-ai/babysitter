/**
 * @process product-management/stakeholder-alignment
 * @description Stakeholder Interview and Alignment process with stakeholder mapping, interview guide creation, expectation alignment, decision-making framework establishment, and communication plan development
 * @inputs { projectName: string, projectDescription: string, initialStakeholders: array, outputDir: string, alignmentGoals: array, decisionScope: string, timeline: object }
 * @outputs { success: boolean, stakeholderMap: object, interviewGuides: array, expectationsDocument: string, decisionFramework: object, communicationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = '',
    projectDescription = '',
    initialStakeholders = [],
    outputDir = 'stakeholder-alignment-output',
    alignmentGoals = [],
    decisionScope = '',
    timeline = {},
    organizationContext = {},
    existingFrameworks = [],
    communicationChannels = [],
    requireSignoff = true,
    includeRACIMatrix = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Stakeholder Interview and Alignment for: ${projectName}`);
  ctx.log('info', `Initial stakeholders identified: ${initialStakeholders.length}`);

  // ============================================================================
  // PHASE 1: STAKEHOLDER IDENTIFICATION AND MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying and mapping stakeholders');
  const stakeholderMapping = await ctx.task(stakeholderMappingTask, {
    projectName,
    projectDescription,
    initialStakeholders,
    organizationContext,
    decisionScope,
    outputDir
  });

  artifacts.push(...stakeholderMapping.artifacts);

  // Breakpoint: Review stakeholder map
  await ctx.breakpoint({
    question: `Identified ${stakeholderMapping.totalStakeholders} stakeholders across ${stakeholderMapping.categories.length} categories. Review stakeholder mapping?`,
    title: 'Stakeholder Mapping Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalStakeholders: stakeholderMapping.totalStakeholders,
        keyStakeholders: stakeholderMapping.keyStakeholders.length,
        influenceLevels: stakeholderMapping.influenceLevels,
        categories: stakeholderMapping.categories
      }
    }
  });

  // ============================================================================
  // PHASE 2: INTERVIEW GUIDE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating tailored interview guides for stakeholder groups');
  const interviewGuides = await ctx.task(interviewGuideCreationTask, {
    stakeholderMap: stakeholderMapping.stakeholderMap,
    projectDescription,
    alignmentGoals,
    decisionScope,
    outputDir
  });

  artifacts.push(...interviewGuides.artifacts);

  // ============================================================================
  // PHASE 3: STAKEHOLDER INTERVIEW SIMULATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting stakeholder interviews');
  const interviewResults = await ctx.task(stakeholderInterviewsTask, {
    stakeholderMap: stakeholderMapping.stakeholderMap,
    interviewGuides: interviewGuides.guides,
    projectName,
    projectDescription,
    outputDir
  });

  artifacts.push(...interviewResults.artifacts);

  // Breakpoint: Review interview insights
  await ctx.breakpoint({
    question: `Completed ${interviewResults.totalInterviews} stakeholder interviews. Identified ${interviewResults.insights.length} key insights and ${interviewResults.concerns.length} concerns. Review interview results?`,
    title: 'Interview Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalInterviews: interviewResults.totalInterviews,
        keyInsights: interviewResults.insights.length,
        concerns: interviewResults.concerns.length,
        alignmentGaps: interviewResults.alignmentGaps.length,
        commonThemes: interviewResults.commonThemes
      }
    }
  });

  // ============================================================================
  // PHASE 4: EXPECTATION ALIGNMENT DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating expectation alignment document');
  const expectationAlignment = await ctx.task(expectationAlignmentTask, {
    stakeholderMap: stakeholderMapping.stakeholderMap,
    interviewInsights: interviewResults.insights,
    concerns: interviewResults.concerns,
    alignmentGaps: interviewResults.alignmentGaps,
    alignmentGoals,
    projectDescription,
    outputDir
  });

  artifacts.push(...expectationAlignment.artifacts);

  // ============================================================================
  // PHASE 5: DECISION-MAKING FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 5: Establishing decision-making framework');
  const decisionFramework = await ctx.task(decisionFrameworkTask, {
    stakeholderMap: stakeholderMapping.stakeholderMap,
    decisionScope,
    organizationContext,
    existingFrameworks,
    includeRACIMatrix,
    outputDir
  });

  artifacts.push(...decisionFramework.artifacts);

  // Breakpoint: Review decision framework
  await ctx.breakpoint({
    question: `Decision-making framework established with ${decisionFramework.decisionTypes.length} decision types and ${decisionFramework.escalationLevels.length} escalation levels. ${includeRACIMatrix ? 'RACI matrix included.' : ''} Review framework?`,
    title: 'Decision Framework Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        decisionTypes: decisionFramework.decisionTypes,
        escalationLevels: decisionFramework.escalationLevels.length,
        approvers: decisionFramework.approvers.length,
        hasRACIMatrix: includeRACIMatrix && decisionFramework.raciMatrix !== undefined
      }
    }
  });

  // ============================================================================
  // PHASE 6: COMMUNICATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing communication plan');
  const communicationPlan = await ctx.task(communicationPlanTask, {
    stakeholderMap: stakeholderMapping.stakeholderMap,
    alignmentDocument: expectationAlignment.document,
    decisionFramework: decisionFramework.framework,
    timeline,
    communicationChannels,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // ============================================================================
  // PHASE 7: ALIGNMENT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating stakeholder alignment');
  const alignmentValidation = await ctx.task(alignmentValidationTask, {
    stakeholderMap: stakeholderMapping.stakeholderMap,
    expectationDocument: expectationAlignment.document,
    decisionFramework: decisionFramework.framework,
    communicationPlan: communicationPlan.plan,
    alignmentGoals,
    outputDir
  });

  artifacts.push(...alignmentValidation.artifacts);

  const alignmentScore = alignmentValidation.alignmentScore;
  const alignmentMet = alignmentScore >= 80;

  // Breakpoint: Alignment validation results
  await ctx.breakpoint({
    question: `Stakeholder alignment validation complete. Alignment score: ${alignmentScore}/100. ${alignmentMet ? 'Strong alignment achieved!' : 'Alignment gaps identified - may need additional work.'} Review validation results?`,
    title: 'Alignment Validation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        alignmentScore,
        alignmentMet,
        totalStakeholders: stakeholderMapping.totalStakeholders,
        alignedStakeholders: alignmentValidation.alignedStakeholders,
        remainingGaps: alignmentValidation.remainingGaps.length,
        riskLevel: alignmentValidation.riskLevel
      }
    }
  });

  // ============================================================================
  // PHASE 8: STAKEHOLDER SIGN-OFF (if required)
  // ============================================================================

  let signoffResult = null;

  if (requireSignoff) {
    ctx.log('info', 'Phase 8: Obtaining stakeholder sign-off');
    signoffResult = await ctx.task(stakeholderSignoffTask, {
      stakeholderMap: stakeholderMapping.stakeholderMap,
      expectationDocument: expectationAlignment.document,
      decisionFramework: decisionFramework.framework,
      communicationPlan: communicationPlan.plan,
      alignmentValidation: alignmentValidation,
      outputDir
    });

    artifacts.push(...signoffResult.artifacts);

    // Breakpoint: Sign-off gate
    await ctx.breakpoint({
      question: `Sign-off process complete. ${signoffResult.allApproved ? `All ${signoffResult.totalSignoffs} key stakeholders approved!` : `${signoffResult.approvedCount}/${signoffResult.totalSignoffs} approved. ${signoffResult.pendingCount} pending, ${signoffResult.rejectedCount} rejected.`} Proceed with finalization?`,
      title: 'Stakeholder Sign-off Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          allApproved: signoffResult.allApproved,
          approvedCount: signoffResult.approvedCount,
          pendingCount: signoffResult.pendingCount,
          rejectedCount: signoffResult.rejectedCount,
          conditionalApprovals: signoffResult.conditionalApprovals.length,
          blockers: signoffResult.blockers.length
        }
      }
    });
  }

  // ============================================================================
  // PHASE 9: FINALIZE ALIGNMENT PACKAGE
  // ============================================================================

  ctx.log('info', 'Phase 9: Finalizing stakeholder alignment package');
  const finalizationResult = await ctx.task(alignmentFinalizationTask, {
    projectName,
    stakeholderMap: stakeholderMapping.stakeholderMap,
    interviewResults: interviewResults,
    expectationDocument: expectationAlignment.document,
    decisionFramework: decisionFramework.framework,
    communicationPlan: communicationPlan.plan,
    alignmentValidation: alignmentValidation,
    signoffResult: signoffResult,
    outputDir
  });

  artifacts.push(...finalizationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    stakeholderMap: {
      totalStakeholders: stakeholderMapping.totalStakeholders,
      keyStakeholders: stakeholderMapping.keyStakeholders,
      categories: stakeholderMapping.categories,
      mapDocument: stakeholderMapping.mapDocument
    },
    interviewGuides: {
      total: interviewGuides.guides.length,
      guides: interviewGuides.guides
    },
    interviewResults: {
      totalInterviews: interviewResults.totalInterviews,
      insights: interviewResults.insights.length,
      concerns: interviewResults.concerns.length,
      alignmentGaps: interviewResults.alignmentGaps.length
    },
    expectationsDocument: expectationAlignment.document,
    decisionFramework: {
      framework: decisionFramework.framework,
      decisionTypes: decisionFramework.decisionTypes,
      hasRACIMatrix: includeRACIMatrix && decisionFramework.raciMatrix !== undefined
    },
    communicationPlan: {
      plan: communicationPlan.plan,
      cadence: communicationPlan.cadence,
      channels: communicationPlan.channels.length
    },
    alignmentValidation: {
      alignmentScore,
      alignmentMet,
      alignedStakeholders: alignmentValidation.alignedStakeholders,
      remainingGaps: alignmentValidation.remainingGaps.length,
      riskLevel: alignmentValidation.riskLevel
    },
    signoff: signoffResult ? {
      allApproved: signoffResult.allApproved,
      approvedCount: signoffResult.approvedCount,
      totalRequired: signoffResult.totalSignoffs
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/stakeholder-alignment',
      timestamp: startTime,
      outputDir,
      requireSignoff,
      includeRACIMatrix
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Stakeholder Mapping
export const stakeholderMappingTask = defineTask('stakeholder-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map and categorize all stakeholders',
  agent: {
    name: 'stakeholder-analyst',
    prompt: {
      role: 'senior product manager and stakeholder engagement specialist',
      task: 'Identify, map, and categorize all relevant stakeholders for the project',
      context: args,
      instructions: [
        'Start with initial stakeholder list and expand through analysis',
        'Identify stakeholders across categories:',
        '  - Executive sponsors and decision makers',
        '  - Business stakeholders (finance, legal, operations)',
        '  - Technical stakeholders (engineering, architecture, security)',
        '  - Product and design teams',
        '  - End users and customer representatives',
        '  - External partners and vendors',
        '  - Regulatory and compliance stakeholders',
        'For each stakeholder, document:',
        '  - Name and role/title',
        '  - Organization/department',
        '  - Level of influence (high/medium/low)',
        '  - Level of interest (high/medium/low)',
        '  - Primary concerns and motivations',
        '  - Decision-making authority',
        '  - Preferred communication style',
        'Create stakeholder influence-interest matrix (power-interest grid)',
        'Identify key stakeholders (high influence AND high interest)',
        'Map stakeholder relationships and dependencies',
        'Document potential conflicts of interest',
        'Assess stakeholder sentiment (supporter/neutral/skeptic/blocker)',
        'Save comprehensive stakeholder map to output directory'
      ],
      outputFormat: 'JSON with stakeholderMap (object), totalStakeholders (number), keyStakeholders (array), categories (array), influenceLevels (object), mapDocument (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderMap', 'totalStakeholders', 'keyStakeholders', 'artifacts'],
      properties: {
        stakeholderMap: {
          type: 'object',
          properties: {
            stakeholders: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                  organization: { type: 'string' },
                  category: { type: 'string' },
                  influence: { type: 'string', enum: ['high', 'medium', 'low'] },
                  interest: { type: 'string', enum: ['high', 'medium', 'low'] },
                  decisionAuthority: { type: 'string' },
                  primaryConcerns: { type: 'array', items: { type: 'string' } },
                  motivations: { type: 'array', items: { type: 'string' } },
                  communicationPreference: { type: 'string' },
                  sentiment: { type: 'string', enum: ['supporter', 'neutral', 'skeptic', 'blocker'] }
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
            influenceInterestMatrix: { type: 'object' }
          }
        },
        totalStakeholders: { type: 'number' },
        keyStakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              count: { type: 'number' }
            }
          }
        },
        influenceLevels: {
          type: 'object',
          properties: {
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        sentimentBreakdown: {
          type: 'object',
          properties: {
            supporters: { type: 'number' },
            neutral: { type: 'number' },
            skeptics: { type: 'number' },
            blockers: { type: 'number' }
          }
        },
        conflictsOfInterest: { type: 'array', items: { type: 'string' } },
        mapDocument: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stakeholder-alignment', 'stakeholder-mapping']
}));

// Task 2: Interview Guide Creation
export const interviewGuideCreationTask = defineTask('interview-guide-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create tailored interview guides for stakeholder groups',
  agent: {
    name: 'interview-designer',
    prompt: {
      role: 'product research specialist and interview facilitator',
      task: 'Create customized interview guides for different stakeholder groups',
      context: args,
      instructions: [
        'Create interview guides tailored to stakeholder categories',
        'Each guide should include:',
        '  - Introduction and interview objectives',
        '  - Rapport-building opening questions',
        '  - Core discovery questions about:',
        '    * Current challenges and pain points',
        '    * Goals and success criteria',
        '    * Expectations from the project',
        '    * Concerns and risks they foresee',
        '    * Decision-making preferences',
        '    * Resource availability and constraints',
        '  - Role-specific questions based on stakeholder category',
        '  - Follow-up question prompts',
        '  - Closing questions and next steps',
        'Use open-ended questions to elicit detailed responses',
        'Include questions to uncover hidden assumptions',
        'Add questions to identify alignment or misalignment with other stakeholders',
        'Include time estimates for each section',
        'Provide interviewer notes and best practices',
        'Create executive summary version for senior stakeholders (shorter format)',
        'Save interview guides to output directory'
      ],
      outputFormat: 'JSON with guides (array of guide objects), totalGuides (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guides', 'totalGuides', 'artifacts'],
      properties: {
        guides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderCategory: { type: 'string' },
              guideName: { type: 'string' },
              targetAudience: { type: 'array', items: { type: 'string' } },
              estimatedDuration: { type: 'string' },
              introduction: { type: 'string' },
              sections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    objective: { type: 'string' },
                    questions: { type: 'array', items: { type: 'string' } },
                    followUpPrompts: { type: 'array', items: { type: 'string' } },
                    timeEstimate: { type: 'string' }
                  }
                }
              },
              interviewerNotes: { type: 'array', items: { type: 'string' } },
              documentPath: { type: 'string' }
            }
          }
        },
        totalGuides: { type: 'number' },
        bestPractices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stakeholder-alignment', 'interview-guide']
}));

// Task 3: Stakeholder Interviews
export const stakeholderInterviewsTask = defineTask('stakeholder-interviews', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder interviews and synthesize insights',
  agent: {
    name: 'stakeholder-interviewer',
    prompt: {
      role: 'experienced product manager and stakeholder interviewer',
      task: 'Simulate stakeholder interviews and extract key insights, concerns, and alignment gaps',
      context: args,
      instructions: [
        'For each key stakeholder, simulate interview based on their profile:',
        '  - Consider their role, concerns, motivations, and sentiment',
        '  - Generate realistic responses to interview guide questions',
        '  - Reflect their level of influence and interest',
        '  - Surface potential conflicts or misalignments',
        'Document interview findings for each stakeholder:',
        '  - Key insights and takeaways',
        '  - Stated goals and success criteria',
        '  - Concerns and potential blockers',
        '  - Resource commitments or constraints',
        '  - Decision-making preferences',
        '  - Communication preferences',
        'Synthesize cross-stakeholder findings:',
        '  - Common themes and shared concerns',
        '  - Divergent expectations and conflicting goals',
        '  - Alignment gaps between stakeholder groups',
        '  - Hidden assumptions or unstated requirements',
        '  - Political dynamics and power structures',
        'Identify critical insights that impact project success',
        'Flag high-priority concerns requiring immediate attention',
        'Document areas of strong alignment (leverage points)',
        'Save interview transcripts and synthesis to output directory'
      ],
      outputFormat: 'JSON with interviewTranscripts (array), insights (array), concerns (array), alignmentGaps (array), commonThemes (array), totalInterviews (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interviewTranscripts', 'insights', 'concerns', 'alignmentGaps', 'totalInterviews', 'artifacts'],
      properties: {
        interviewTranscripts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderId: { type: 'string' },
              stakeholderName: { type: 'string' },
              date: { type: 'string' },
              duration: { type: 'string' },
              keyQuotes: { type: 'array', items: { type: 'string' } },
              goalsStated: { type: 'array', items: { type: 'string' } },
              concernsRaised: { type: 'array', items: { type: 'string' } },
              expectationsExpressed: { type: 'array', items: { type: 'string' } },
              commitments: { type: 'array', items: { type: 'string' } },
              sentimentObserved: { type: 'string' }
            }
          }
        },
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              source: { type: 'array', items: { type: 'string' } },
              category: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              actionable: { type: 'boolean' }
            }
          }
        },
        concerns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concern: { type: 'string' },
              raisedBy: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              mitigationNeeded: { type: 'boolean' }
            }
          }
        },
        alignmentGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              stakeholdersInvolved: { type: 'array', items: { type: 'string' } },
              gapType: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              resolutionApproach: { type: 'string' }
            }
          }
        },
        commonThemes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              frequency: { type: 'number' },
              stakeholders: { type: 'array', items: { type: 'string' } },
              sentiment: { type: 'string' }
            }
          }
        },
        areasOfAlignment: { type: 'array', items: { type: 'string' } },
        politicalDynamics: { type: 'array', items: { type: 'string' } },
        totalInterviews: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stakeholder-alignment', 'interviews']
}));

// Task 4: Expectation Alignment
export const expectationAlignmentTask = defineTask('expectation-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create expectation alignment document',
  agent: {
    name: 'alignment-facilitator',
    prompt: {
      role: 'senior product manager and alignment facilitator',
      task: 'Synthesize stakeholder expectations into unified alignment document',
      context: args,
      instructions: [
        'Create comprehensive expectation alignment document with sections:',
        '  1. Executive Summary',
        '     - Project vision and objectives',
        '     - Key stakeholder groups',
        '     - Primary alignment goals',
        '  2. Stakeholder Expectations',
        '     - Individual stakeholder expectations by category',
        '     - Success criteria from each perspective',
        '     - Resource commitments and constraints',
        '  3. Areas of Strong Alignment',
        '     - Shared goals and common ground',
        '     - Mutually agreed-upon priorities',
        '     - Universal success criteria',
        '  4. Alignment Gaps and Resolutions',
        '     - Identified misalignments',
        '     - Conflicting expectations',
        '     - Proposed resolution approach for each gap',
        '     - Trade-offs and compromises',
        '  5. Unified Project Charter',
        '     - Consolidated project goals',
        '     - Agreed-upon scope boundaries',
        '     - Success metrics (all stakeholders)',
        '     - Constraints and assumptions',
        '  6. Commitment Framework',
        '     - Stakeholder commitments (time, resources, decisions)',
        '     - Dependencies and handoffs',
        '     - Expected timelines and milestones',
        '  7. Risk Register',
        '     - Stakeholder concerns converted to risks',
        '     - Likelihood and impact assessment',
        '     - Mitigation strategies',
        'Use clear, jargon-free language',
        'Make expectations explicit and measurable where possible',
        'Document any unresolved conflicts requiring executive escalation',
        'Save expectation alignment document to output directory'
      ],
      outputFormat: 'JSON with document (string - markdown document path), unifiedGoals (array), resolvedGaps (array), unresolvedConflicts (array), commitments (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'unifiedGoals', 'resolvedGaps', 'artifacts'],
      properties: {
        document: { type: 'string' },
        unifiedGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } },
              owningStakeholders: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        resolvedGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              originalGap: { type: 'string' },
              resolution: { type: 'string' },
              tradeOffs: { type: 'array', items: { type: 'string' } },
              stakeholdersAgreed: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        unresolvedConflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conflict: { type: 'string' },
              stakeholdersInvolved: { type: 'array', items: { type: 'string' } },
              escalationRequired: { type: 'boolean' },
              recommendedApproach: { type: 'string' }
            }
          }
        },
        commitments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              commitmentType: { type: 'string' },
              description: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        riskRegister: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
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
  labels: ['agent', 'stakeholder-alignment', 'expectation-alignment']
}));

// Task 5: Decision-Making Framework
export const decisionFrameworkTask = defineTask('decision-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish decision-making framework',
  agent: {
    name: 'governance-architect',
    prompt: {
      role: 'product governance expert and organizational designer',
      task: 'Create comprehensive decision-making framework with clear roles and escalation paths',
      context: args,
      instructions: [
        'Define decision-making framework with components:',
        '  1. Decision Categories and Ownership',
        '     - Strategic decisions (vision, roadmap, major features)',
        '     - Tactical decisions (prioritization, scope adjustments)',
        '     - Operational decisions (implementation details, timeline)',
        '     - Financial decisions (budget, resource allocation)',
        '     - For each category: decision maker(s), consulted parties, informed parties',
        '  2. Decision-Making Models',
        '     - Consensus-based decisions (when to use)',
        '     - Consultative decisions (input gathered, one decides)',
        '     - Democratic decisions (voting)',
        '     - Delegated decisions (autonomous)',
        '  3. Escalation Framework',
        '     - Level 1: Team level decisions (examples)',
        '     - Level 2: Product leadership decisions (examples)',
        '     - Level 3: Executive/steering committee decisions (examples)',
        '     - Escalation criteria and process',
        '     - Timeframes for each escalation level',
        '  4. RACI Matrix (if includeRACIMatrix is true)',
        '     - List key decision types and activities',
        '     - Assign R (Responsible), A (Accountable), C (Consulted), I (Informed) for each stakeholder',
        '     - Ensure single Accountable party for each decision',
        '  5. Decision Documentation Process',
        '     - How decisions are recorded',
        '     - Where decisions are stored',
        '     - Communication of decisions',
        '  6. Conflict Resolution Process',
        '     - Steps for resolving disagreements',
        '     - Mediation approach',
        '     - Final arbitration authority',
        'Align framework with existing organizational processes if provided',
        'Ensure clarity on who makes final call for each decision type',
        'Define SLAs for decision-making (time to decide)',
        'Save decision-making framework to output directory'
      ],
      outputFormat: 'JSON with framework (object), decisionTypes (array), escalationLevels (array), approvers (array), raciMatrix (object - if applicable), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'decisionTypes', 'escalationLevels', 'approvers', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            documentPath: { type: 'string' },
            decisionCategories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  description: { type: 'string' },
                  decisionMaker: { type: 'string' },
                  consultedParties: { type: 'array', items: { type: 'string' } },
                  informedParties: { type: 'array', items: { type: 'string' } },
                  slaHours: { type: 'number' }
                }
              }
            },
            escalationPath: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  level: { type: 'number' },
                  name: { type: 'string' },
                  authority: { type: 'string' },
                  examples: { type: 'array', items: { type: 'string' } },
                  escalationCriteria: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            conflictResolution: {
              type: 'object',
              properties: {
                process: { type: 'array', items: { type: 'string' } },
                finalAuthority: { type: 'string' }
              }
            }
          }
        },
        decisionTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              owner: { type: 'string' },
              model: { type: 'string' }
            }
          }
        },
        escalationLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              name: { type: 'string' },
              authority: { type: 'string' }
            }
          }
        },
        approvers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              approvalAuthority: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        raciMatrix: {
          type: 'object',
          properties: {
            activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  activity: { type: 'string' },
                  responsible: { type: 'array', items: { type: 'string' } },
                  accountable: { type: 'string' },
                  consulted: { type: 'array', items: { type: 'string' } },
                  informed: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            matrixPath: { type: 'string' }
          }
        },
        decisionSLAs: {
          type: 'object',
          properties: {
            strategic: { type: 'string' },
            tactical: { type: 'string' },
            operational: { type: 'string' }
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
  labels: ['agent', 'stakeholder-alignment', 'decision-framework']
}));

// Task 6: Communication Plan
export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop stakeholder communication plan',
  agent: {
    name: 'communications-strategist',
    prompt: {
      role: 'product communications strategist and change management expert',
      task: 'Create comprehensive communication plan for ongoing stakeholder engagement',
      context: args,
      instructions: [
        'Develop communication plan with sections:',
        '  1. Communication Objectives',
        '     - Keep stakeholders informed and engaged',
        '     - Gather continuous feedback',
        '     - Maintain alignment throughout project',
        '     - Build trust and transparency',
        '  2. Stakeholder Communication Matrix',
        '     - For each stakeholder group:',
        '       * Information needs (what they need to know)',
        '       * Communication frequency (daily/weekly/monthly/milestone-based)',
        '       * Preferred channels (email, Slack, meetings, dashboards)',
        '       * Level of detail (executive summary vs. detailed updates)',
        '       * Format (written, verbal, visual)',
        '  3. Regular Communication Cadence',
        '     - Daily standups (who attends, format)',
        '     - Weekly status updates (audience, content)',
        '     - Monthly steering committee meetings (agenda template)',
        '     - Quarterly business reviews (format, attendees)',
        '     - Ad-hoc updates (triggers, distribution)',
        '  4. Communication Channels',
        '     - Primary channels and their purposes',
        '     - Channel-specific protocols',
        '     - Escalation communication channels',
        '  5. Milestone Communications',
        '     - Key project milestones requiring communication',
        '     - Success celebration communications',
        '     - Launch communications plan',
        '  6. Issue and Risk Communication',
        '     - When and how to communicate problems',
        '     - Risk escalation communication protocol',
        '     - Crisis communication plan',
        '  7. Feedback Mechanisms',
        '     - How stakeholders provide input',
        '     - Feedback collection frequency',
        '     - How feedback is triaged and addressed',
        '  8. Communication Metrics',
        '     - Stakeholder engagement metrics',
        '     - Communication effectiveness measures',
        'Tailor communication style to each stakeholder group',
        'Balance transparency with appropriate level of detail',
        'Define communication ownership and accountability',
        'Save communication plan to output directory'
      ],
      outputFormat: 'JSON with plan (object), cadence (object), channels (array), milestones (array), metrics (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'cadence', 'channels', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            documentPath: { type: 'string' },
            objectives: { type: 'array', items: { type: 'string' } },
            stakeholderCommunicationMatrix: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stakeholderGroup: { type: 'string' },
                  informationNeeds: { type: 'array', items: { type: 'string' } },
                  frequency: { type: 'string' },
                  channels: { type: 'array', items: { type: 'string' } },
                  detailLevel: { type: 'string', enum: ['executive', 'summary', 'detailed'] },
                  format: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        cadence: {
          type: 'object',
          properties: {
            daily: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  activity: { type: 'string' },
                  attendees: { type: 'array', items: { type: 'string' } },
                  duration: { type: 'string' },
                  format: { type: 'string' }
                }
              }
            },
            weekly: { type: 'array' },
            monthly: { type: 'array' },
            quarterly: { type: 'array' }
          }
        },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              purpose: { type: 'string' },
              audience: { type: 'array', items: { type: 'string' } },
              protocols: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              communicationRequired: { type: 'boolean' },
              audience: { type: 'array', items: { type: 'string' } },
              messageType: { type: 'string' }
            }
          }
        },
        feedbackMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              frequency: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurementMethod: { type: 'string' }
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
  labels: ['agent', 'stakeholder-alignment', 'communication-plan']
}));

// Task 7: Alignment Validation
export const alignmentValidationTask = defineTask('alignment-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate stakeholder alignment and identify gaps',
  agent: {
    name: 'alignment-validator',
    prompt: {
      role: 'senior product manager and stakeholder alignment auditor',
      task: 'Assess quality and completeness of stakeholder alignment',
      context: args,
      instructions: [
        'Evaluate alignment across dimensions (weight each 0-100):',
        '  1. Goal Alignment (25%)',
        '     - Are stakeholder goals unified and consistent?',
        '     - Are success criteria mutually agreed upon?',
        '     - Are priorities aligned?',
        '  2. Expectation Clarity (20%)',
        '     - Are expectations explicitly documented?',
        '     - Are they realistic and achievable?',
        '     - Do stakeholders understand commitments?',
        '  3. Decision Framework Clarity (20%)',
        '     - Is it clear who makes what decisions?',
        '     - Are escalation paths understood?',
        '     - Is conflict resolution process defined?',
        '  4. Communication Plan Effectiveness (15%)',
        '     - Does plan address all stakeholder needs?',
        '     - Are channels and cadence appropriate?',
        '     - Are feedback mechanisms in place?',
        '  5. Risk Mitigation (10%)',
        '     - Have stakeholder concerns been addressed?',
        '     - Are risks identified and mitigated?',
        '     - Are conflicts resolved or escalated?',
        '  6. Stakeholder Buy-in (10%)',
        '     - Are key stakeholders supportive?',
        '     - Have blockers been converted or mitigated?',
        '     - Is there executive sponsorship?',
        'Calculate weighted overall alignment score (0-100)',
        'Identify remaining alignment gaps',
        'Assess alignment risk level (low/medium/high)',
        'Determine if alignment is sufficient to proceed',
        'Provide recommendations for improving alignment',
        'Document which stakeholders are fully aligned vs. partially aligned',
        'Flag any critical gaps requiring immediate attention'
      ],
      outputFormat: 'JSON with alignmentScore (number 0-100), dimensionScores (object), alignedStakeholders (number), remainingGaps (array), riskLevel (string), recommendations (array), readyToProceed (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alignmentScore', 'dimensionScores', 'alignedStakeholders', 'remainingGaps', 'riskLevel', 'artifacts'],
      properties: {
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        dimensionScores: {
          type: 'object',
          properties: {
            goalAlignment: { type: 'number' },
            expectationClarity: { type: 'number' },
            decisionFrameworkClarity: { type: 'number' },
            communicationPlanEffectiveness: { type: 'number' },
            riskMitigation: { type: 'number' },
            stakeholderBuyIn: { type: 'number' }
          }
        },
        alignedStakeholders: { type: 'number' },
        partiallyAlignedStakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              alignmentLevel: { type: 'number' },
              outstandingIssues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        remainingGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impactedStakeholders: { type: 'array', items: { type: 'string' } },
              recommendedAction: { type: 'string' }
            }
          }
        },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        riskFactors: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
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
        readyToProceed: { type: 'boolean' },
        criticalBlockers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stakeholder-alignment', 'validation']
}));

// Task 8: Stakeholder Sign-off
export const stakeholderSignoffTask = defineTask('stakeholder-signoff', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Obtain stakeholder sign-off on alignment package',
  agent: {
    name: 'signoff-coordinator',
    prompt: {
      role: 'product manager and stakeholder sign-off coordinator',
      task: 'Facilitate sign-off process from key stakeholders',
      context: args,
      instructions: [
        'Simulate sign-off process for key stakeholders',
        'Present alignment package to each stakeholder for approval:',
        '  - Expectation alignment document',
        '  - Decision-making framework',
        '  - Communication plan',
        '  - Commitment summary',
        'For each stakeholder, determine sign-off status:',
        '  - Approved: fully agrees, no changes needed',
        '  - Approved with conditions: agrees but requests specific follow-ups',
        '  - Pending: needs more time or information',
        '  - Rejected: significant concerns, cannot approve',
        'Document sign-off details:',
        '  - Stakeholder name and role',
        '  - Sign-off status',
        '  - Date of decision',
        '  - Conditions or concerns raised',
        '  - Follow-up actions required',
        'Identify blockers preventing sign-off',
        'Recommend approach for obtaining pending/rejected sign-offs',
        'Determine if sufficient sign-off achieved to proceed:',
        '  - All key stakeholders must approve (or approve with conditions)',
        '  - No critical blockers',
        '  - Executive sponsor approval obtained',
        'Create sign-off register document',
        'Save sign-off results to output directory'
      ],
      outputFormat: 'JSON with allApproved (boolean), approvedCount (number), pendingCount (number), rejectedCount (number), totalSignoffs (number), signoffs (array), conditionalApprovals (array), blockers (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allApproved', 'approvedCount', 'totalSignoffs', 'signoffs', 'artifacts'],
      properties: {
        allApproved: { type: 'boolean' },
        approvedCount: { type: 'number' },
        pendingCount: { type: 'number' },
        rejectedCount: { type: 'number' },
        totalSignoffs: { type: 'number' },
        signoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              role: { type: 'string' },
              status: { type: 'string', enum: ['approved', 'approved-with-conditions', 'pending', 'rejected'] },
              date: { type: 'string' },
              comments: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } },
              followUpActions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        conditionalApprovals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } },
              dueDate: { type: 'string' }
            }
          }
        },
        blockers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              blocker: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium'] },
              resolutionApproach: { type: 'string' }
            }
          }
        },
        executiveSponsorApproval: { type: 'boolean' },
        signoffRegisterPath: { type: 'string' },
        readyToLaunch: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stakeholder-alignment', 'signoff']
}));

// Task 9: Alignment Finalization
export const alignmentFinalizationTask = defineTask('alignment-finalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Finalize stakeholder alignment package',
  agent: {
    name: 'alignment-packager',
    prompt: {
      role: 'product operations specialist and documentation expert',
      task: 'Compile and finalize complete stakeholder alignment package',
      context: args,
      instructions: [
        'Create comprehensive stakeholder alignment package including:',
        '  1. Executive Summary',
        '     - Project overview',
        '     - Stakeholder alignment status',
        '     - Key outcomes and commitments',
        '     - Next steps',
        '  2. Complete Stakeholder Map',
        '     - All stakeholders documented',
        '     - Influence-interest matrix',
        '     - Relationships and dependencies',
        '  3. Interview Synthesis Report',
        '     - Key insights from all interviews',
        '     - Common themes',
        '     - Areas of alignment and misalignment',
        '  4. Expectation Alignment Document',
        '     - Unified goals and success criteria',
        '     - Stakeholder commitments',
        '     - Resolved and unresolved conflicts',
        '  5. Decision-Making Framework',
        '     - Decision ownership matrix',
        '     - RACI matrix (if applicable)',
        '     - Escalation procedures',
        '  6. Communication Plan',
        '     - Communication matrix',
        '     - Regular cadence',
        '     - Feedback mechanisms',
        '  7. Sign-off Register (if applicable)',
        '     - All stakeholder approvals',
        '     - Conditional approvals and follow-ups',
        '     - Outstanding items',
        '  8. Alignment Metrics and Dashboard',
        '     - Alignment score and breakdown',
        '     - Risk assessment',
        '     - Health indicators',
        '  9. Appendices',
        '     - Interview transcripts',
        '     - Supporting analysis',
        '     - Templates and tools',
        'Create master README/index for alignment package',
        'Generate alignment scorecard summary',
        'Package all artifacts in organized structure',
        'Create handoff documentation for project team',
        'Document lessons learned from alignment process',
        'Save finalized package to output directory'
      ],
      outputFormat: 'JSON with packagePath (string), executiveSummaryPath (string), totalDocuments (number), alignmentScorecard (object), lessonsLearned (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'executiveSummaryPath', 'totalDocuments', 'alignmentScorecard', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
        totalDocuments: { type: 'number' },
        alignmentScorecard: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            stakeholderCount: { type: 'number' },
            alignedStakeholders: { type: 'number' },
            riskLevel: { type: 'string' },
            readyForExecution: { type: 'boolean' },
            keyStrengths: { type: 'array', items: { type: 'string' } },
            remainingRisks: { type: 'array', items: { type: 'string' } }
          }
        },
        packageStructure: {
          type: 'object',
          properties: {
            documents: { type: 'array', items: { type: 'string' } },
            directories: { type: 'array', items: { type: 'string' } }
          }
        },
        handoffItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        },
        lessonsLearned: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lesson: { type: 'string' },
              category: { type: 'string' },
              recommendation: { type: 'string' }
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
  labels: ['agent', 'stakeholder-alignment', 'finalization', 'documentation']
}));

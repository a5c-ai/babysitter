/**
 * @process specializations/software-architecture/tech-stack-evaluation
 * @description Technology Stack Evaluation - Structured process for evaluating and selecting technologies
 * (frameworks, libraries, platforms, databases) with proof of concepts, scoring matrices, and risk assessment
 * to make informed technology decisions.
 * @inputs { projectName: string, requirements?: object, constraints?: object, technologyCategory?: string, candidateList?: array }
 * @outputs { success: boolean, recommendation: object, evaluationReport: object, adr: object, onboardingPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/software-architecture/tech-stack-evaluation', {
 *   projectName: 'E-Commerce Platform',
 *   requirements: {
 *     functional: ['Real-time inventory', 'Payment processing', 'Search functionality'],
 *     nonFunctional: { performance: '< 200ms response', scalability: '10K concurrent users', security: 'PCI DSS' }
 *   },
 *   constraints: { budget: '$100K', timeline: '6 months', teamSkills: ['JavaScript', 'Python'] },
 *   technologyCategory: 'Backend Framework',
 *   candidateList: ['Node.js/Express', 'Python/Django', 'Java/Spring Boot']
 * });
 *
 * @references
 * - Technology Radar by ThoughtWorks: https://www.thoughtworks.com/radar
 * - Architecture Decision Records: https://adr.github.io/
 * - The Twelve-Factor App: https://12factor.net/
 * - Cloud Native Computing Foundation Landscape: https://landscape.cncf.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    requirements = {},
    constraints = {},
    technologyCategory = 'Technology Stack',
    candidateList = []
  } = inputs;

  // Phase 1: Define Requirements
  const requirementsDefinition = await ctx.task(defineRequirementsTask, {
    projectName,
    requirements,
    constraints,
    technologyCategory
  });

  // Quality Gate: Requirements must be well-defined
  if (!requirementsDefinition.requirementsScore || requirementsDefinition.requirementsScore < 70) {
    return {
      success: false,
      error: 'Requirements are insufficiently defined. Score: ' + requirementsDefinition.requirementsScore,
      phase: 'requirements-definition',
      recommendation: 'Refine requirements with more specific functional and non-functional criteria'
    };
  }

  // Breakpoint: Review requirements
  await ctx.breakpoint({
    question: `Review technology evaluation requirements for ${projectName}. Category: ${technologyCategory}. Requirements score: ${requirementsDefinition.requirementsScore}/100. Approve to proceed?`,
    title: 'Requirements Review',
    context: {
      runId: ctx.runId,
      projectName,
      technologyCategory,
      requirements: requirementsDefinition,
      files: [{
        path: 'artifacts/phase1-requirements.json',
        format: 'json',
        content: requirementsDefinition
      }, {
        path: 'artifacts/phase1-requirements.md',
        format: 'markdown',
        content: requirementsDefinition.requirementsDocument
      }]
    }
  });

  // Phase 2: Identify Candidates
  const candidateIdentification = await ctx.task(identifyCandidatesTask, {
    projectName,
    technologyCategory,
    requirements: requirementsDefinition,
    constraints,
    initialCandidates: candidateList
  });

  // Quality Gate: Must have at least 3 candidates for meaningful comparison
  if (candidateIdentification.shortlist.length < 3) {
    await ctx.breakpoint({
      question: `Only ${candidateIdentification.shortlist.length} candidates identified for ${technologyCategory}. Should we expand the search or proceed with limited options?`,
      title: 'Insufficient Candidates Warning',
      context: {
        runId: ctx.runId,
        projectName,
        candidates: candidateIdentification.shortlist,
        recommendation: 'Expand research to include at least 3-4 viable candidates'
      }
    });
  }

  // Phase 3: Define Evaluation Criteria
  const evaluationCriteria = await ctx.task(defineEvaluationCriteriaTask, {
    projectName,
    technologyCategory,
    requirements: requirementsDefinition,
    constraints,
    candidates: candidateIdentification.shortlist
  });

  // Breakpoint: Validate evaluation criteria
  await ctx.breakpoint({
    question: `Review evaluation criteria for ${technologyCategory}. ${evaluationCriteria.criteriaCount} criteria defined with weighted scoring. Approve criteria?`,
    title: 'Evaluation Criteria Review',
    context: {
      runId: ctx.runId,
      projectName,
      criteria: evaluationCriteria,
      files: [{
        path: 'artifacts/phase3-evaluation-criteria.json',
        format: 'json',
        content: evaluationCriteria
      }]
    }
  });

  // Phase 4: Research Each Candidate (Parallel)
  const candidateResearch = await ctx.parallel.all(
    candidateIdentification.shortlist.map((candidate, index) =>
      () => ctx.task(researchCandidateTask, {
        projectName,
        candidateIndex: index + 1,
        candidate,
        technologyCategory,
        evaluationCriteria,
        requirements: requirementsDefinition
      })
    )
  );

  // Phase 5: Build Proof of Concepts (Parallel)
  const pocResults = await ctx.parallel.all(
    candidateIdentification.shortlist.map((candidate, index) =>
      () => ctx.task(buildPoCTask, {
        projectName,
        candidateIndex: index + 1,
        candidate,
        technologyCategory,
        requirements: requirementsDefinition,
        pocScope: evaluationCriteria.pocScope
      })
    )
  );

  // Breakpoint: Review PoC results
  await ctx.breakpoint({
    question: `Proof of Concepts complete for all ${candidateIdentification.shortlist.length} candidates. Review implementations and performance results before scoring?`,
    title: 'PoC Review',
    context: {
      runId: ctx.runId,
      projectName,
      pocResults,
      files: pocResults.map((poc, idx) => ({
        path: `artifacts/phase5-poc-${idx + 1}-${poc.candidateName}.md`,
        format: 'markdown',
        content: poc.pocReport
      }))
    }
  });

  // Phase 6: Score and Compare
  const scoringComparison = await ctx.task(scoreAndCompareTask, {
    projectName,
    technologyCategory,
    candidates: candidateIdentification.shortlist,
    candidateResearch,
    pocResults,
    evaluationCriteria
  });

  // Phase 7: Assess Risks
  const riskAssessment = await ctx.task(assessRisksTask, {
    projectName,
    technologyCategory,
    candidates: candidateIdentification.shortlist,
    scoringComparison,
    requirements: requirementsDefinition,
    constraints
  });

  // Quality Gate: Critical risks must have mitigation plans
  const criticalRisksWithoutMitigation = riskAssessment.risks.filter(
    risk => risk.severity === 'critical' && !risk.mitigationPlan
  );

  if (criticalRisksWithoutMitigation.length > 0) {
    await ctx.breakpoint({
      question: `${criticalRisksWithoutMitigation.length} critical risks identified without mitigation plans. Should we develop mitigation strategies before proceeding?`,
      title: 'Critical Risk Warning',
      context: {
        runId: ctx.runId,
        projectName,
        criticalRisks: criticalRisksWithoutMitigation,
        recommendation: 'Develop mitigation strategies for all critical risks'
      }
    });
  }

  // Breakpoint: Review scoring and risks
  await ctx.breakpoint({
    question: `Technology evaluation complete. Top recommendation: ${scoringComparison.topRecommendation.name} (Score: ${scoringComparison.topRecommendation.totalScore}/100). Review comparison matrix and risks?`,
    title: 'Scoring and Risk Review',
    context: {
      runId: ctx.runId,
      projectName,
      comparison: scoringComparison,
      risks: riskAssessment,
      files: [{
        path: 'artifacts/phase6-comparison-matrix.json',
        format: 'json',
        content: scoringComparison
      }, {
        path: 'artifacts/phase6-comparison-report.md',
        format: 'markdown',
        content: scoringComparison.comparisonReport
      }, {
        path: 'artifacts/phase7-risk-assessment.json',
        format: 'json',
        content: riskAssessment
      }]
    }
  });

  // Phase 8: Make Recommendation
  const finalRecommendation = await ctx.task(makeRecommendationTask, {
    projectName,
    technologyCategory,
    scoringComparison,
    riskAssessment,
    requirements: requirementsDefinition,
    constraints
  });

  // Phase 9: Create Architecture Decision Record (ADR)
  const adr = await ctx.task(createADRTask, {
    projectName,
    technologyCategory,
    recommendation: finalRecommendation,
    candidates: candidateIdentification.shortlist,
    scoringComparison,
    riskAssessment,
    requirements: requirementsDefinition
  });

  // Phase 10: Create Onboarding Plan
  const onboardingPlan = await ctx.task(createOnboardingPlanTask, {
    projectName,
    technologyCategory,
    recommendation: finalRecommendation,
    constraints,
    team: constraints.teamSkills || []
  });

  // Final Breakpoint: Approval
  await ctx.breakpoint({
    question: `Technology Stack Evaluation complete for ${projectName}. Recommendation: ${finalRecommendation.selectedTechnology}. ADR created. Onboarding plan ready. Approve final recommendation?`,
    title: 'Final Recommendation Approval',
    context: {
      runId: ctx.runId,
      projectName,
      recommendation: finalRecommendation,
      estimatedOnboardingTime: onboardingPlan.estimatedDuration,
      estimatedCost: onboardingPlan.estimatedCost,
      files: [
        { path: 'artifacts/phase8-final-recommendation.json', format: 'json', content: finalRecommendation },
        { path: 'artifacts/phase8-final-recommendation.md', format: 'markdown', content: finalRecommendation.recommendationDocument },
        { path: 'artifacts/phase9-adr.md', format: 'markdown', content: adr.adrDocument },
        { path: 'artifacts/phase10-onboarding-plan.md', format: 'markdown', content: onboardingPlan.planDocument }
      ]
    }
  });

  return {
    success: true,
    projectName,
    technologyCategory,
    recommendation: {
      selectedTechnology: finalRecommendation.selectedTechnology,
      justification: finalRecommendation.justification,
      totalScore: finalRecommendation.totalScore,
      confidence: finalRecommendation.confidence,
      alternativesConsidered: finalRecommendation.alternativesConsidered
    },
    evaluationReport: {
      requirements: requirementsDefinition,
      candidatesEvaluated: candidateIdentification.shortlist.length,
      scoringMatrix: scoringComparison.comparisonMatrix,
      topThreeCandidates: scoringComparison.rankedCandidates.slice(0, 3),
      risksIdentified: riskAssessment.risks.length,
      criticalRisks: riskAssessment.risks.filter(r => r.severity === 'critical').length
    },
    adr: {
      adrNumber: adr.adrNumber,
      adrPath: adr.adrPath,
      status: adr.status
    },
    onboardingPlan: {
      estimatedDuration: onboardingPlan.estimatedDuration,
      estimatedCost: onboardingPlan.estimatedCost,
      phases: onboardingPlan.phases,
      trainingRequired: onboardingPlan.trainingRequired
    },
    artifacts: [
      'artifacts/phase1-requirements.json',
      'artifacts/phase1-requirements.md',
      'artifacts/phase2-candidates.json',
      'artifacts/phase3-evaluation-criteria.json',
      ...pocResults.map((_, idx) => `artifacts/phase5-poc-${idx + 1}.md`),
      'artifacts/phase6-comparison-matrix.json',
      'artifacts/phase6-comparison-report.md',
      'artifacts/phase7-risk-assessment.json',
      'artifacts/phase8-final-recommendation.json',
      'artifacts/phase8-final-recommendation.md',
      'artifacts/phase9-adr.md',
      'artifacts/phase10-onboarding-plan.md'
    ],
    metadata: {
      processId: 'specializations/software-architecture/tech-stack-evaluation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const defineRequirementsTask = defineTask('define-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Define Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Architect and Requirements Engineer with expertise in technology evaluation',
      task: 'Define comprehensive requirements for technology stack evaluation including functional, non-functional, and constraint analysis',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        constraints: args.constraints,
        technologyCategory: args.technologyCategory
      },
      instructions: [
        '1. Analyze and categorize functional requirements (features, capabilities needed)',
        '2. Detail non-functional requirements: performance (latency, throughput), scalability (concurrent users, data volume), security (compliance, authentication), reliability (uptime, fault tolerance)',
        '3. Document team constraints: existing skills, preferred languages/frameworks, learning capacity',
        '4. Document budget constraints: licensing costs, infrastructure costs, training costs',
        '5. Document timeline constraints: time to market, migration timeline, learning curve acceptable',
        '6. Document integration requirements: existing systems, third-party services, APIs',
        '7. Identify critical success factors and deal-breakers',
        '8. Define measurable acceptance criteria for technology selection',
        '9. Prioritize requirements using MoSCoW method (Must have, Should have, Could have, Won\'t have)',
        '10. Score requirements completeness and clarity (0-100)',
        '11. Generate comprehensive requirements document'
      ],
      outputFormat: 'JSON object with detailed requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalRequirements', 'nonFunctionalRequirements', 'constraints', 'requirementsScore'],
      properties: {
        functionalRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'could-have', 'wont-have'] },
              description: { type: 'string' }
            }
          }
        },
        nonFunctionalRequirements: {
          type: 'object',
          properties: {
            performance: {
              type: 'object',
              properties: {
                latency: { type: 'string' },
                throughput: { type: 'string' },
                responseTime: { type: 'string' }
              }
            },
            scalability: {
              type: 'object',
              properties: {
                concurrentUsers: { type: 'string' },
                dataVolume: { type: 'string' },
                growthProjection: { type: 'string' }
              }
            },
            security: {
              type: 'object',
              properties: {
                compliance: { type: 'array', items: { type: 'string' } },
                authentication: { type: 'string' },
                dataEncryption: { type: 'string' }
              }
            },
            reliability: {
              type: 'object',
              properties: {
                uptime: { type: 'string' },
                faultTolerance: { type: 'string' },
                disasterRecovery: { type: 'string' }
              }
            },
            maintainability: {
              type: 'object',
              properties: {
                codeQuality: { type: 'string' },
                testability: { type: 'string' },
                documentation: { type: 'string' }
              }
            }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            budget: { type: 'string' },
            timeline: { type: 'string' },
            teamSkills: { type: 'array', items: { type: 'string' } },
            learningCurveAcceptable: { type: 'string' },
            existingSystems: { type: 'array', items: { type: 'string' } }
          }
        },
        integrationRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              integrationType: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        criticalSuccessFactors: { type: 'array', items: { type: 'string' } },
        dealBreakers: { type: 'array', items: { type: 'string' } },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        requirementsScore: { type: 'number', minimum: 0, maximum: 100 },
        requirementsDocument: { type: 'string', description: 'Markdown formatted requirements document' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-architecture', 'tech-stack-evaluation', 'requirements']
}));

export const identifyCandidatesTask = defineTask('identify-candidates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Identify Candidates - ${args.technologyCategory}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technology Research Analyst with deep knowledge of software ecosystems',
      task: 'Research and identify candidate technologies for evaluation, creating a shortlist of viable options',
      context: {
        projectName: args.projectName,
        technologyCategory: args.technologyCategory,
        requirements: args.requirements,
        constraints: args.constraints,
        initialCandidates: args.initialCandidates
      },
      instructions: [
        '1. Research popular and emerging technologies in the category (consult ThoughtWorks Tech Radar, Stack Overflow surveys, GitHub trends)',
        '2. Consider initial candidate list if provided, validate and expand',
        '3. Create long list of 8-10 potential options',
        '4. Apply preliminary filtering: eliminate technologies that fail basic requirements (licensing incompatible, unsupported platform, missing critical features)',
        '5. Research maturity indicators: age, version number, release frequency, backwards compatibility',
        '6. Check community health: GitHub stars, contributors, issue response time, Stack Overflow questions',
        '7. Assess commercial viability: vendor stability, enterprise adoption, support options',
        '8. Shortlist top 3-4 candidates for detailed evaluation',
        '9. For each shortlisted candidate, document: name, version, website, GitHub repo, primary maintainer/vendor, key strengths, known limitations',
        '10. Provide justification for shortlist selection and technologies excluded'
      ],
      outputFormat: 'JSON object with candidate analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['longList', 'shortlist', 'filteringCriteria'],
      properties: {
        longList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              website: { type: 'string' },
              included: { type: 'boolean' },
              reason: { type: 'string' }
            }
          }
        },
        shortlist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              website: { type: 'string' },
              githubRepo: { type: 'string' },
              maintainer: { type: 'string' },
              maturityLevel: { type: 'string', enum: ['early-adoption', 'growing', 'mature', 'legacy'] },
              communitySize: { type: 'string', enum: ['small', 'medium', 'large', 'very-large'] },
              keyStrengths: { type: 'array', items: { type: 'string' } },
              knownLimitations: { type: 'array', items: { type: 'string' } },
              selectionRationale: { type: 'string' }
            }
          }
        },
        filteringCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              applied: { type: 'boolean' },
              eliminated: { type: 'number' }
            }
          }
        },
        excludedTechnologies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              exclusionReason: { type: 'string' }
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
  labels: ['software-architecture', 'tech-stack-evaluation', 'candidate-identification']
}));

export const defineEvaluationCriteriaTask = defineTask('define-evaluation-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Define Evaluation Criteria - ${args.technologyCategory}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technology Evaluation Specialist with expertise in multi-criteria decision analysis',
      task: 'Define comprehensive, weighted evaluation criteria for comparing technology candidates',
      context: {
        projectName: args.projectName,
        technologyCategory: args.technologyCategory,
        requirements: args.requirements,
        constraints: args.constraints,
        candidates: args.candidates
      },
      instructions: [
        '1. Define technical fit criteria: feature completeness, performance characteristics, scalability potential, security features, architecture compatibility',
        '2. Define maturity criteria: version stability, production readiness, backwards compatibility, deprecation policy',
        '3. Define ecosystem criteria: available libraries/plugins, integration options, tooling support, IDE support',
        '4. Define community criteria: community size, activity level, documentation quality, tutorial availability, Stack Overflow presence',
        '5. Define learning curve criteria: API complexity, learning resources, onboarding time, similarity to existing stack',
        '6. Define cost criteria: licensing (open source, commercial, freemium), infrastructure costs, training costs, support costs, total cost of ownership (TCO)',
        '7. Define vendor/support criteria: vendor reputation, enterprise support availability, SLA options, long-term roadmap visibility',
        '8. Define long-term viability criteria: adoption trend, competitor landscape, breaking change frequency, migration path if deprecated',
        '9. Assign weights to each criterion based on project priorities (total weights = 100%)',
        '10. Define scoring scale (0-10 or 0-100) and scoring guidelines',
        '11. Define PoC scope: small representative application to test key features',
        '12. Generate evaluation criteria document with scoring rubric'
      ],
      outputFormat: 'JSON object with weighted evaluation criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'totalWeight', 'scoringScale', 'pocScope'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              criterion: { type: 'string' },
              weight: { type: 'number' },
              scoringGuideline: { type: 'string' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        categorizedCriteria: {
          type: 'object',
          properties: {
            technicalFit: { type: 'array', items: { type: 'object' } },
            maturity: { type: 'array', items: { type: 'object' } },
            ecosystem: { type: 'array', items: { type: 'object' } },
            community: { type: 'array', items: { type: 'object' } },
            learningCurve: { type: 'array', items: { type: 'object' } },
            cost: { type: 'array', items: { type: 'object' } },
            vendorSupport: { type: 'array', items: { type: 'object' } },
            longTermViability: { type: 'array', items: { type: 'object' } }
          }
        },
        totalWeight: { type: 'number' },
        criteriaCount: { type: 'number' },
        scoringScale: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
            description: { type: 'string' }
          }
        },
        pocScope: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            keyFeaturesToTest: { type: 'array', items: { type: 'string' } },
            performanceMetrics: { type: 'array', items: { type: 'string' } },
            estimatedEffort: { type: 'string' }
          }
        },
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            criticalCriteria: { type: 'array', items: { type: 'string' } },
            tradeoffs: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-architecture', 'tech-stack-evaluation', 'evaluation-criteria']
}));

export const researchCandidateTask = defineTask('research-candidate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4.${args.candidateIndex}: Research Candidate - ${args.candidate.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technology Research Analyst specializing in in-depth technology evaluation',
      task: 'Conduct comprehensive research on candidate technology gathering data for evaluation criteria',
      context: {
        projectName: args.projectName,
        candidateIndex: args.candidateIndex,
        candidate: args.candidate,
        technologyCategory: args.technologyCategory,
        evaluationCriteria: args.evaluationCriteria,
        requirements: args.requirements
      },
      instructions: [
        '1. Read official documentation: architecture overview, getting started guide, API reference, best practices',
        '2. Review case studies and production usage: companies using it, scale achieved, lessons learned',
        '3. Analyze GitHub repository: stars, forks, contributors, issue response time, PR merge time, recent activity, open vs closed issues ratio',
        '4. Check community health: Stack Overflow questions, Reddit discussions, Discord/Slack community size, conference presence',
        '5. Assess documentation quality: completeness, clarity, examples, tutorials, API documentation',
        '6. Review security: known vulnerabilities (CVE database), security audit history, security response process, dependency vulnerabilities',
        '7. Analyze licensing: license type, commercial use restrictions, attribution requirements, patent clauses',
        '8. Research vendor/maintainer: company stability, funding, enterprise customers, support offerings',
        '9. Check roadmap and release history: release frequency, major version timeline, planned features, deprecation notices',
        '10. Gather performance benchmarks: published benchmarks, community benchmarks, comparative studies',
        '11. Document research findings organized by evaluation criteria',
        '12. Generate detailed research report with sources cited'
      ],
      outputFormat: 'JSON object with comprehensive research findings'
    },
    outputSchema: {
      type: 'object',
      required: ['candidateName', 'researchFindings', 'sources'],
      properties: {
        candidateName: { type: 'string' },
        version: { type: 'string' },
        researchFindings: {
          type: 'object',
          properties: {
            technicalCapabilities: {
              type: 'object',
              properties: {
                features: { type: 'array', items: { type: 'string' } },
                architecturePattern: { type: 'string' },
                performanceCharacteristics: { type: 'string' },
                scalabilityApproach: { type: 'string' }
              }
            },
            maturity: {
              type: 'object',
              properties: {
                firstRelease: { type: 'string' },
                currentVersion: { type: 'string' },
                releaseFrequency: { type: 'string' },
                breakingChangeHistory: { type: 'string' }
              }
            },
            community: {
              type: 'object',
              properties: {
                githubStars: { type: 'number' },
                contributors: { type: 'number' },
                stackOverflowQuestions: { type: 'number' },
                communitySize: { type: 'string' },
                activityLevel: { type: 'string', enum: ['low', 'moderate', 'high', 'very-high'] }
              }
            },
            documentation: {
              type: 'object',
              properties: {
                quality: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'] },
                completeness: { type: 'string', enum: ['minimal', 'partial', 'comprehensive'] },
                examplesAvailable: { type: 'boolean' },
                tutorialCount: { type: 'number' }
              }
            },
            licensing: {
              type: 'object',
              properties: {
                licenseType: { type: 'string' },
                commercialUseAllowed: { type: 'boolean' },
                restrictions: { type: 'array', items: { type: 'string' } }
              }
            },
            security: {
              type: 'object',
              properties: {
                knownVulnerabilities: { type: 'number' },
                securityAuditDate: { type: 'string' },
                securityResponseProcess: { type: 'string' }
              }
            },
            cost: {
              type: 'object',
              properties: {
                licensingCost: { type: 'string' },
                supportCost: { type: 'string' },
                estimatedInfrastructureCost: { type: 'string' },
                estimatedTCO: { type: 'string' }
              }
            },
            productionUsage: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  company: { type: 'string' },
                  useCase: { type: 'string' },
                  scale: { type: 'string' },
                  source: { type: 'string' }
                }
              }
            },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } }
          }
        },
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        researchNotes: { type: 'string' },
        researchReport: { type: 'string', description: 'Markdown formatted research report' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-architecture', 'tech-stack-evaluation', 'research', `candidate-${args.candidateIndex}`]
}));

export const buildPoCTask = defineTask('build-poc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5.${args.candidateIndex}: Build PoC - ${args.candidate.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Engineer with expertise in rapid prototyping and technology evaluation',
      task: 'Build proof of concept to validate candidate technology through hands-on implementation',
      context: {
        projectName: args.projectName,
        candidateIndex: args.candidateIndex,
        candidate: args.candidate,
        technologyCategory: args.technologyCategory,
        requirements: args.requirements,
        pocScope: args.pocScope
      },
      instructions: [
        '1. Set up development environment for candidate technology',
        '2. Implement PoC scope features (same for all candidates for fair comparison)',
        '3. Measure implementation time and developer experience',
        '4. Test key features from requirements: implement critical functionality, test integration points, validate non-functional requirements',
        '5. Measure performance metrics: response time, throughput, resource usage (CPU, memory), startup time',
        '6. Assess developer experience: API ease of use, error messages quality, debugging experience, IDE support',
        '7. Document challenges encountered: blockers, workarounds needed, unclear documentation, bugs found',
        '8. Document surprises (positive and negative): unexpected features, missing features, performance surprises',
        '9. Capture code snippets demonstrating key implementation patterns',
        '10. Rate overall PoC experience (0-10)',
        '11. Provide recommendation based on hands-on experience',
        '12. Generate PoC report with code samples and metrics'
      ],
      outputFormat: 'JSON object with PoC results and developer experience assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['candidateName', 'implementationTime', 'performanceMetrics', 'developerExperience'],
      properties: {
        candidateName: { type: 'string' },
        implementationTime: {
          type: 'object',
          properties: {
            setupTime: { type: 'string' },
            developmentTime: { type: 'string' },
            debuggingTime: { type: 'string' },
            totalTime: { type: 'string' }
          }
        },
        performanceMetrics: {
          type: 'object',
          properties: {
            averageResponseTime: { type: 'string' },
            throughput: { type: 'string' },
            cpuUsage: { type: 'string' },
            memoryUsage: { type: 'string' },
            startupTime: { type: 'string' }
          }
        },
        functionalValidation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              implemented: { type: 'boolean' },
              difficulty: { type: 'string', enum: ['easy', 'moderate', 'hard', 'very-hard'] },
              notes: { type: 'string' }
            }
          }
        },
        developerExperience: {
          type: 'object',
          properties: {
            apiEaseOfUse: { type: 'number', minimum: 0, maximum: 10 },
            documentationQuality: { type: 'number', minimum: 0, maximum: 10 },
            errorHandling: { type: 'number', minimum: 0, maximum: 10 },
            debuggingExperience: { type: 'number', minimum: 0, maximum: 10 },
            ideSupport: { type: 'number', minimum: 0, maximum: 10 },
            overallExperience: { type: 'number', minimum: 0, maximum: 10 }
          }
        },
        challengesEncountered: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              challenge: { type: 'string' },
              severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
              resolution: { type: 'string' }
            }
          }
        },
        surprises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              surprise: { type: 'string' },
              type: { type: 'string', enum: ['positive', 'negative'] }
            }
          }
        },
        codeSnippets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              code: { type: 'string' },
              language: { type: 'string' }
            }
          }
        },
        recommendation: { type: 'string' },
        pocReport: { type: 'string', description: 'Markdown formatted PoC report' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-architecture', 'tech-stack-evaluation', 'poc', `candidate-${args.candidateIndex}`]
}));

export const scoreAndCompareTask = defineTask('score-and-compare', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Score and Compare - ${args.technologyCategory}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technology Analyst specializing in multi-criteria decision analysis and scoring',
      task: 'Score each candidate against evaluation criteria, calculate weighted scores, and generate comparison matrix',
      context: {
        projectName: args.projectName,
        technologyCategory: args.technologyCategory,
        candidates: args.candidates,
        candidateResearch: args.candidateResearch,
        pocResults: args.pocResults,
        evaluationCriteria: args.evaluationCriteria
      },
      instructions: [
        '1. For each candidate and each criterion, assign score based on research and PoC results',
        '2. Use evaluation criteria scoring guidelines for consistency',
        '3. Calculate weighted score for each candidate: weighted score = Σ(criterion_score × criterion_weight)',
        '4. Rank candidates by total weighted score',
        '5. Create comparison matrix: rows = candidates, columns = criteria, cells = scores',
        '6. Identify strengths of each candidate (criteria with highest scores)',
        '7. Identify weaknesses of each candidate (criteria with lowest scores)',
        '8. Perform sensitivity analysis: test how ranking changes if weights change',
        '9. Identify close scores requiring careful consideration',
        '10. Determine top recommendation with confidence level',
        '11. Document rationale for scores and rankings',
        '12. Generate comparison report with visualizations (score chart, radar chart concepts)'
      ],
      outputFormat: 'JSON object with scoring results and comparison analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rankedCandidates', 'comparisonMatrix', 'topRecommendation'],
      properties: {
        rankedCandidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              name: { type: 'string' },
              totalScore: { type: 'number' },
              weightedScore: { type: 'number' },
              categoryScores: {
                type: 'object',
                properties: {
                  technicalFit: { type: 'number' },
                  maturity: { type: 'number' },
                  ecosystem: { type: 'number' },
                  community: { type: 'number' },
                  learningCurve: { type: 'number' },
                  cost: { type: 'number' },
                  vendorSupport: { type: 'number' },
                  longTermViability: { type: 'number' }
                }
              },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        comparisonMatrix: {
          type: 'object',
          description: 'Matrix with candidates as keys and scores per criterion as values'
        },
        topRecommendation: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            totalScore: { type: 'number' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            scoreGap: { type: 'number', description: 'Points ahead of second place' },
            justification: { type: 'string' }
          }
        },
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            stable: { type: 'boolean', description: 'Does ranking remain stable with weight changes?' },
            criticalCriteria: { type: 'array', items: { type: 'string' } },
            alternativeScenarios: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scenario: { type: 'string' },
                  topCandidate: { type: 'string' }
                }
              }
            }
          }
        },
        closeComparisons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              candidates: { type: 'array', items: { type: 'string' } },
              scoreDifference: { type: 'number' },
              tiebreaker: { type: 'string' }
            }
          }
        },
        comparisonReport: { type: 'string', description: 'Markdown formatted comparison report with score tables' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-architecture', 'tech-stack-evaluation', 'scoring', 'comparison']
}));

export const assessRisksTask = defineTask('assess-risks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Assess Risks - ${args.technologyCategory}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Specialist with expertise in technology adoption risks',
      task: 'Identify and assess risks associated with each technology candidate',
      context: {
        projectName: args.projectName,
        technologyCategory: args.technologyCategory,
        candidates: args.candidates,
        scoringComparison: args.scoringComparison,
        requirements: args.requirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify adoption risks for each candidate: learning curve steep, team lacks expertise, migration complexity, integration challenges',
        '2. Identify technical risks: performance limitations, scalability bottlenecks, missing critical features, architectural mismatch',
        '3. Identify vendor/community risks: single vendor dependency, small community, declining popularity, uncertain roadmap, maintainer burnout',
        '4. Identify security risks: known vulnerabilities, slow security response, dependency vulnerabilities, compliance issues',
        '5. Identify cost risks: licensing changes, unexpected infrastructure costs, training costs higher than expected, hidden operational costs',
        '6. Identify long-term risks: technology obsolescence, breaking changes in future versions, vendor acquisition, community fork',
        '7. Assess each risk: severity (critical/high/medium/low), probability (high/medium/low), impact (critical/high/medium/low)',
        '8. For critical and high-severity risks, develop mitigation plans',
        '9. Create risk register with all identified risks',
        '10. Calculate overall risk level per candidate',
        '11. Provide risk-based recommendation (may differ from score-based recommendation)',
        '12. Generate comprehensive risk assessment report'
      ],
      outputFormat: 'JSON object with risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'risksByCandidateexclamation', 'overallRiskAssessment'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              candidate: { type: 'string' },
              category: { type: 'string', enum: ['adoption', 'technical', 'vendor-community', 'security', 'cost', 'long-term'] },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string' },
              mitigationPlan: { type: 'string' },
              contingencyPlan: { type: 'string' }
            }
          }
        },
        risksByCandidate: {
          type: 'object',
          description: 'Risks grouped by candidate',
          additionalProperties: {
            type: 'object',
            properties: {
              totalRisks: { type: 'number' },
              criticalRisks: { type: 'number' },
              highRisks: { type: 'number' },
              overallRiskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              risks: { type: 'array' }
            }
          }
        },
        overallRiskAssessment: {
          type: 'object',
          properties: {
            lowestRiskCandidate: { type: 'string' },
            highestRiskCandidate: { type: 'string' },
            riskVsScoreAnalysis: { type: 'string' }
          }
        },
        criticalRisks: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of critical risks requiring immediate attention'
        },
        riskMitigationTimeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              mitigationAction: { type: 'string' },
              timeline: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        riskAssessmentReport: { type: 'string', description: 'Markdown formatted risk assessment report' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-architecture', 'tech-stack-evaluation', 'risk-assessment']
}));

export const makeRecommendationTask = defineTask('make-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Make Final Recommendation - ${args.technologyCategory}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Chief Technology Officer with expertise in strategic technology decisions',
      task: 'Make final technology recommendation synthesizing scores, risks, and strategic considerations',
      context: {
        projectName: args.projectName,
        technologyCategory: args.technologyCategory,
        scoringComparison: args.scoringComparison,
        riskAssessment: args.riskAssessment,
        requirements: args.requirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Review top-ranked candidate from scoring comparison',
        '2. Review lowest-risk candidate from risk assessment',
        '3. If different, analyze trade-offs: higher score but more risk vs lower score but safer',
        '4. Consider strategic factors: team preference, existing expertise, long-term vision, competitive advantage',
        '5. Apply decision framework: eliminate candidates with deal-breaker issues, prioritize must-have requirements, balance short-term vs long-term',
        '6. Make final recommendation with clear justification',
        '7. Document confidence level (high/medium/low) based on: score gap, risk level, team consensus, information quality',
        '8. List alternatives considered and why not selected',
        '9. Define conditions where recommendation might change',
        '10. Provide implementation guidance: recommended approach, critical success factors, monitoring metrics',
        '11. Identify key stakeholders who should approve decision',
        '12. Generate executive-ready recommendation document'
      ],
      outputFormat: 'JSON object with final recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTechnology', 'justification', 'confidence', 'alternativesConsidered'],
      properties: {
        selectedTechnology: { type: 'string' },
        version: { type: 'string' },
        totalScore: { type: 'number' },
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        justification: {
          type: 'object',
          properties: {
            primaryReasons: { type: 'array', items: { type: 'string' } },
            scoreRationale: { type: 'string' },
            riskRationale: { type: 'string' },
            strategicAlignment: { type: 'string' },
            differentiators: { type: 'array', items: { type: 'string' } }
          }
        },
        confidence: {
          type: 'string',
          enum: ['high', 'medium', 'low']
        },
        confidenceFactors: {
          type: 'object',
          properties: {
            scoreGap: { type: 'string' },
            riskLevel: { type: 'string' },
            teamConsensus: { type: 'string' },
            dataQuality: { type: 'string' }
          }
        },
        alternativesConsidered: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technology: { type: 'string' },
              reasonNotSelected: { type: 'string' },
              conditionsForReconsideration: { type: 'string' }
            }
          }
        },
        implementationGuidance: {
          type: 'object',
          properties: {
            recommendedApproach: { type: 'string' },
            criticalSuccessFactors: { type: 'array', items: { type: 'string' } },
            quickWins: { type: 'array', items: { type: 'string' } },
            potentialChallenges: { type: 'array', items: { type: 'string' } },
            monitoringMetrics: { type: 'array', items: { type: 'string' } }
          }
        },
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
        stakeholderApprovalRequired: { type: 'array', items: { type: 'string' } },
        recommendationDocument: { type: 'string', description: 'Executive-ready markdown recommendation document' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-architecture', 'tech-stack-evaluation', 'recommendation']
}));

export const createADRTask = defineTask('create-adr', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Create ADR - ${args.technologyCategory}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Architect specializing in architecture decision documentation',
      task: 'Create Architecture Decision Record (ADR) documenting technology selection decision',
      context: {
        projectName: args.projectName,
        technologyCategory: args.technologyCategory,
        recommendation: args.recommendation,
        candidates: args.candidates,
        scoringComparison: args.scoringComparison,
        riskAssessment: args.riskAssessment,
        requirements: args.requirements
      },
      instructions: [
        '1. Use ADR template (Nygard format or MADR format)',
        '2. Title: "ADR-XXX: Select [Technology] for [Category]"',
        '3. Status: Proposed (initially)',
        '4. Context section: describe the decision context, why decision needed, constraints and requirements, alternatives considered',
        '5. Decision section: state the decision clearly, specify exact technology and version, justify the choice',
        '6. Consequences section: positive consequences (benefits), negative consequences (trade-offs, limitations), risks and mitigation plans',
        '7. Include comparison matrix summary',
        '8. Reference key artifacts: requirements document, PoC reports, comparison matrix',
        '9. List stakeholders consulted',
        '10. Add metadata: date, author, reviewers',
        '11. Assign ADR number (sequential)',
        '12. Format as markdown following ADR conventions'
      ],
      outputFormat: 'JSON object with ADR document'
    },
    outputSchema: {
      type: 'object',
      required: ['adrNumber', 'adrDocument', 'status'],
      properties: {
        adrNumber: { type: 'number' },
        adrPath: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string', enum: ['proposed', 'accepted', 'deprecated', 'superseded'] },
        date: { type: 'string' },
        author: { type: 'string' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        adrDocument: {
          type: 'string',
          description: 'Full ADR in markdown format following Nygard or MADR template'
        },
        relatedADRs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              adrNumber: { type: 'number' },
              relationship: { type: 'string', enum: ['supersedes', 'superseded-by', 'related-to', 'amends'] }
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
  labels: ['software-architecture', 'tech-stack-evaluation', 'adr', 'documentation']
}));

export const createOnboardingPlanTask = defineTask('create-onboarding-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Create Onboarding Plan - ${args.recommendation.selectedTechnology}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Learning and Development Specialist with expertise in technical onboarding',
      task: 'Create comprehensive onboarding plan for team to adopt selected technology',
      context: {
        projectName: args.projectName,
        technologyCategory: args.technologyCategory,
        recommendation: args.recommendation,
        constraints: args.constraints,
        team: args.team
      },
      instructions: [
        '1. Assess team current skills and identify skill gaps',
        '2. Define learning objectives: beginner (basic concepts, hello world), intermediate (best practices, common patterns), advanced (performance tuning, troubleshooting)',
        '3. Curate learning resources: official documentation, tutorials, books, video courses, interactive labs, community resources',
        '4. Design learning path: phase 1 (fundamentals), phase 2 (hands-on practice), phase 3 (production readiness)',
        '5. Recommend training approach: self-paced learning, workshops, pair programming, mentorship, external training',
        '6. Estimate time investment per team member',
        '7. Plan proof of concept project: small production feature as learning exercise',
        '8. Define success criteria: knowledge checkpoints, project milestones, code review standards',
        '9. Estimate costs: training materials, courses, workshops, consulting if needed',
        '10. Create timeline: onboarding phases, milestones, production readiness date',
        '11. Identify champions/early adopters to lead adoption',
        '12. Generate comprehensive onboarding plan document'
      ],
      outputFormat: 'JSON object with onboarding plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'estimatedDuration', 'estimatedCost', 'learningResources'],
      properties: {
        skillGapAnalysis: {
          type: 'object',
          properties: {
            currentSkills: { type: 'array', items: { type: 'string' } },
            requiredSkills: { type: 'array', items: { type: 'string' } },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        },
        learningObjectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
              objective: { type: 'string' },
              assessmentCriteria: { type: 'string' }
            }
          }
        },
        learningResources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string', enum: ['documentation', 'tutorial', 'book', 'video-course', 'workshop', 'certification'] },
              url: { type: 'string' },
              cost: { type: 'string' },
              duration: { type: 'string' },
              level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] }
            }
          }
        },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              activities: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        trainingRequired: {
          type: 'boolean'
        },
        trainingApproach: {
          type: 'object',
          properties: {
            selfPaced: { type: 'boolean' },
            workshops: { type: 'number' },
            pairProgramming: { type: 'boolean' },
            mentorship: { type: 'boolean' },
            externalTraining: { type: 'boolean' }
          }
        },
        pilotProject: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            scope: { type: 'string' },
            duration: { type: 'string' },
            participants: { type: 'array', items: { type: 'string' } }
          }
        },
        champions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        estimatedCost: { type: 'string' },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            productionReadyDate: { type: 'string' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  targetDate: { type: 'string' }
                }
              }
            }
          }
        },
        planDocument: { type: 'string', description: 'Markdown formatted onboarding plan' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['software-architecture', 'tech-stack-evaluation', 'onboarding', 'training']
}));

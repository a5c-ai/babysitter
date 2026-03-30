/**
 * @process specializations/domains/business/public-relations/reputation-risk-identification
 * @description Proactively identify emerging reputational threats through media scanning, social listening, and stakeholder feedback analysis to enable early intervention
 * @specialization Public Relations and Communications
 * @category Reputation Management
 * @inputs { organization: object, monitoringData: object, industryContext: object, historicalIssues: object[] }
 * @outputs { success: boolean, riskAssessment: object, emergingThreats: object[], earlyWarnings: object[], quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    monitoringData = {},
    industryContext = {},
    historicalIssues = [],
    stakeholderIntelligence = {},
    targetQuality = 85
  } = inputs;

  // Phase 1: Environmental Scanning
  await ctx.breakpoint({
    question: 'Starting reputation risk identification. Conduct environmental scanning?',
    title: 'Phase 1: Environmental Scanning',
    context: {
      runId: ctx.runId,
      phase: 'environmental-scanning',
      organization: organization.name
    }
  });

  const [mediaScanning, socialScanning, industryScanning] = await Promise.all([
    ctx.task(conductMediaScanningTask, {
      organization,
      monitoringData,
      industryContext
    }),
    ctx.task(conductSocialScanningTask, {
      organization,
      monitoringData
    }),
    ctx.task(conductIndustryScanningTask, {
      industryContext,
      organization
    })
  ]);

  // Phase 2: Stakeholder Sentiment Analysis
  await ctx.breakpoint({
    question: 'Environmental scanning complete. Analyze stakeholder sentiment?',
    title: 'Phase 2: Stakeholder Sentiment',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-sentiment'
    }
  });

  const stakeholderAnalysis = await ctx.task(analyzeStakeholderSentimentTask, {
    stakeholderIntelligence,
    socialScanning,
    organization
  });

  // Phase 3: Issue Emergence Detection
  await ctx.breakpoint({
    question: 'Sentiment analyzed. Detect emerging issues?',
    title: 'Phase 3: Issue Detection',
    context: {
      runId: ctx.runId,
      phase: 'issue-detection'
    }
  });

  const emergingIssues = await ctx.task(detectEmergingIssuesTask, {
    mediaScanning,
    socialScanning,
    industryScanning,
    stakeholderAnalysis,
    historicalIssues
  });

  // Phase 4: Threat Assessment
  await ctx.breakpoint({
    question: 'Issues detected. Assess threat levels?',
    title: 'Phase 4: Threat Assessment',
    context: {
      runId: ctx.runId,
      phase: 'threat-assessment',
      issueCount: emergingIssues.issues.length
    }
  });

  const threatAssessment = await ctx.task(assessThreatsTask, {
    emergingIssues,
    organization,
    historicalIssues
  });

  // Phase 5: Vulnerability Mapping
  await ctx.breakpoint({
    question: 'Threats assessed. Map organizational vulnerabilities?',
    title: 'Phase 5: Vulnerability Mapping',
    context: {
      runId: ctx.runId,
      phase: 'vulnerability-mapping'
    }
  });

  const vulnerabilityMap = await ctx.task(mapVulnerabilitiesTask, {
    threatAssessment,
    organization,
    industryContext
  });

  // Phase 6: Early Warning Indicators
  await ctx.breakpoint({
    question: 'Vulnerabilities mapped. Define early warning indicators?',
    title: 'Phase 6: Early Warning Indicators',
    context: {
      runId: ctx.runId,
      phase: 'early-warning'
    }
  });

  const earlyWarnings = await ctx.task(defineEarlyWarningsTask, {
    threatAssessment,
    vulnerabilityMap,
    emergingIssues
  });

  // Phase 7: Risk Prioritization
  await ctx.breakpoint({
    question: 'Warnings defined. Prioritize risks for action?',
    title: 'Phase 7: Risk Prioritization',
    context: {
      runId: ctx.runId,
      phase: 'risk-prioritization'
    }
  });

  const riskPrioritization = await ctx.task(prioritizeRisksTask, {
    threatAssessment,
    vulnerabilityMap,
    earlyWarnings
  });

  // Phase 8: Intervention Recommendations
  await ctx.breakpoint({
    question: 'Risks prioritized. Develop intervention recommendations?',
    title: 'Phase 8: Intervention Recommendations',
    context: {
      runId: ctx.runId,
      phase: 'intervention-recommendations'
    }
  });

  const interventionRecommendations = await ctx.task(developInterventionsTask, {
    riskPrioritization,
    threatAssessment,
    organization
  });

  // Phase 9: Quality Validation
  await ctx.breakpoint({
    question: 'Validate risk identification quality?',
    title: 'Phase 9: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateRiskIdentificationTask, {
    mediaScanning,
    socialScanning,
    emergingIssues,
    threatAssessment,
    vulnerabilityMap,
    earlyWarnings,
    riskPrioritization,
    interventionRecommendations,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      riskAssessment: {
        threatAssessment,
        vulnerabilityMap,
        riskPrioritization
      },
      emergingThreats: emergingIssues.issues,
      earlyWarnings: earlyWarnings.indicators,
      interventions: interventionRecommendations.recommendations,
      quality,
      targetQuality,
      scanningInsights: {
        media: mediaScanning.insights,
        social: socialScanning.insights,
        industry: industryScanning.insights
      },
      metadata: {
        processId: 'specializations/domains/business/public-relations/reputation-risk-identification',
        timestamp: ctx.now(),
        organization: organization.name
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: qualityResult.gaps,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/reputation-risk-identification',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const conductMediaScanningTask = defineTask('conduct-media-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct Media Scanning',
  agent: {
    name: 'media-scanner',
    prompt: {
      role: 'Media intelligence analyst scanning for reputation threats',
      task: 'Scan media landscape for emerging reputation threats',
      context: args,
      instructions: [
        'Analyze recent media coverage trends',
        'Identify negative narrative patterns',
        'Detect journalist investigation signals',
        'Track regulatory and policy coverage',
        'Identify competitor-related threats',
        'Monitor industry issue coverage',
        'Detect tone and sentiment shifts',
        'Identify influential critical voices'
      ],
      outputFormat: 'JSON with coverageTrends, negativePatterns, investigationSignals, regulatoryCoverage, competitorThreats, industryIssues, sentimentShifts, criticalVoices, insights'
    },
    outputSchema: {
      type: 'object',
      required: ['coverageTrends', 'negativePatterns', 'insights'],
      properties: {
        coverageTrends: { type: 'array', items: { type: 'object' } },
        negativePatterns: { type: 'array', items: { type: 'object' } },
        investigationSignals: { type: 'array', items: { type: 'object' } },
        regulatoryCoverage: { type: 'array', items: { type: 'object' } },
        competitorThreats: { type: 'array', items: { type: 'object' } },
        industryIssues: { type: 'array', items: { type: 'object' } },
        sentimentShifts: { type: 'array', items: { type: 'object' } },
        criticalVoices: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'media-scanning']
}));

export const conductSocialScanningTask = defineTask('conduct-social-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct Social Scanning',
  agent: {
    name: 'social-scanner',
    prompt: {
      role: 'Social listening specialist detecting reputation threats',
      task: 'Scan social media for emerging reputation risks',
      context: args,
      instructions: [
        'Analyze social mention trends',
        'Detect viral negative content',
        'Track hashtag and campaign threats',
        'Monitor employee social activity',
        'Identify influencer criticism',
        'Detect customer complaint patterns',
        'Track activist and advocacy activity',
        'Identify emerging social issues'
      ],
      outputFormat: 'JSON with mentionTrends, viralThreats, hashtagThreats, employeeActivity, influencerCriticism, complaintPatterns, activistActivity, emergingIssues, insights'
    },
    outputSchema: {
      type: 'object',
      required: ['mentionTrends', 'viralThreats', 'insights'],
      properties: {
        mentionTrends: { type: 'array', items: { type: 'object' } },
        viralThreats: { type: 'array', items: { type: 'object' } },
        hashtagThreats: { type: 'array', items: { type: 'object' } },
        employeeActivity: { type: 'array', items: { type: 'object' } },
        influencerCriticism: { type: 'array', items: { type: 'object' } },
        complaintPatterns: { type: 'array', items: { type: 'object' } },
        activistActivity: { type: 'array', items: { type: 'object' } },
        emergingIssues: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'social-scanning']
}));

export const conductIndustryScanningTask = defineTask('conduct-industry-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct Industry Scanning',
  agent: {
    name: 'industry-scanner',
    prompt: {
      role: 'Industry analyst scanning for sector-wide reputation risks',
      task: 'Scan industry landscape for reputation risks',
      context: args,
      instructions: [
        'Track regulatory and legislative developments',
        'Monitor competitor crises and contagion risk',
        'Identify industry-wide issue trends',
        'Track NGO and advocacy campaigns',
        'Monitor supply chain and partner issues',
        'Identify technology and disruption risks',
        'Track ESG and sustainability pressures',
        'Monitor labor and workforce issues'
      ],
      outputFormat: 'JSON with regulatoryDevelopments, competitorCrises, industryTrends, advocacyCampaigns, supplyChainIssues, disruptionRisks, esgPressures, workforceIssues, insights'
    },
    outputSchema: {
      type: 'object',
      required: ['regulatoryDevelopments', 'industryTrends', 'insights'],
      properties: {
        regulatoryDevelopments: { type: 'array', items: { type: 'object' } },
        competitorCrises: { type: 'array', items: { type: 'object' } },
        industryTrends: { type: 'array', items: { type: 'object' } },
        advocacyCampaigns: { type: 'array', items: { type: 'object' } },
        supplyChainIssues: { type: 'array', items: { type: 'object' } },
        disruptionRisks: { type: 'array', items: { type: 'object' } },
        esgPressures: { type: 'array', items: { type: 'object' } },
        workforceIssues: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'industry-scanning']
}));

export const analyzeStakeholderSentimentTask = defineTask('analyze-stakeholder-sentiment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Stakeholder Sentiment',
  agent: {
    name: 'stakeholder-sentiment-analyst',
    prompt: {
      role: 'Stakeholder intelligence analyst assessing sentiment',
      task: 'Analyze stakeholder sentiment for risk indicators',
      context: args,
      instructions: [
        'Assess customer sentiment trends',
        'Analyze employee sentiment indicators',
        'Evaluate investor sentiment signals',
        'Track partner and supplier sentiment',
        'Monitor community sentiment',
        'Identify stakeholder complaint trends',
        'Assess trust and confidence levels',
        'Identify sentiment trigger events'
      ],
      outputFormat: 'JSON with customerSentiment, employeeSentiment, investorSentiment, partnerSentiment, communitySentiment, complaintTrends, trustLevels, triggerEvents'
    },
    outputSchema: {
      type: 'object',
      required: ['customerSentiment', 'employeeSentiment'],
      properties: {
        customerSentiment: { type: 'object' },
        employeeSentiment: { type: 'object' },
        investorSentiment: { type: 'object' },
        partnerSentiment: { type: 'object' },
        communitySentiment: { type: 'object' },
        complaintTrends: { type: 'array', items: { type: 'object' } },
        trustLevels: { type: 'object' },
        triggerEvents: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'stakeholder-sentiment']
}));

export const detectEmergingIssuesTask = defineTask('detect-emerging-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect Emerging Issues',
  agent: {
    name: 'emerging-issues-detector',
    prompt: {
      role: 'Issues management specialist detecting emerging threats',
      task: 'Detect and categorize emerging reputation issues',
      context: args,
      instructions: [
        'Synthesize findings from all scanning sources',
        'Identify issue patterns and connections',
        'Detect early-stage issues before escalation',
        'Categorize issues by type and source',
        'Assess issue velocity and momentum',
        'Compare to historical issue patterns',
        'Identify issue ownership (internal vs. external)',
        'Flag issues requiring immediate attention'
      ],
      outputFormat: 'JSON with issues array (issue, category, source, velocity, stage, urgency), patterns, connections, immediateAttention'
    },
    outputSchema: {
      type: 'object',
      required: ['issues', 'patterns'],
      properties: {
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              category: { type: 'string' },
              source: { type: 'string' },
              velocity: { type: 'string' },
              stage: { type: 'string' },
              urgency: { type: 'string' }
            }
          }
        },
        patterns: { type: 'array', items: { type: 'object' } },
        connections: { type: 'array', items: { type: 'object' } },
        immediateAttention: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'issue-detection']
}));

export const assessThreatsTask = defineTask('assess-threats', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Threat Levels',
  agent: {
    name: 'threat-assessor',
    prompt: {
      role: 'Risk assessment specialist evaluating reputation threats',
      task: 'Assess threat levels for identified issues',
      context: args,
      instructions: [
        'Score likelihood of each threat materializing',
        'Assess potential impact severity',
        'Evaluate speed of potential escalation',
        'Assess media amplification potential',
        'Evaluate stakeholder group exposure',
        'Consider historical precedent',
        'Assess organizational preparedness',
        'Calculate overall threat score'
      ],
      outputFormat: 'JSON with threats array (issue, likelihood, impact, escalationSpeed, mediaAmplification, stakeholderExposure, preparedness, threatScore), threatMatrix'
    },
    outputSchema: {
      type: 'object',
      required: ['threats', 'threatMatrix'],
      properties: {
        threats: { type: 'array', items: { type: 'object' } },
        threatMatrix: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'threat-assessment']
}));

export const mapVulnerabilitiesTask = defineTask('map-vulnerabilities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Organizational Vulnerabilities',
  agent: {
    name: 'vulnerability-mapper',
    prompt: {
      role: 'Organizational risk analyst mapping vulnerabilities',
      task: 'Map organizational vulnerabilities to threats',
      context: args,
      instructions: [
        'Identify operational vulnerabilities',
        'Map communication gaps and weaknesses',
        'Assess leadership exposure areas',
        'Identify supply chain vulnerabilities',
        'Map regulatory compliance gaps',
        'Assess cultural and workforce vulnerabilities',
        'Identify technology and data vulnerabilities',
        'Map stakeholder relationship vulnerabilities'
      ],
      outputFormat: 'JSON with vulnerabilities array (area, description, relatedThreats, severity), operationalVulns, commVulns, leadershipVulns, supplyChainVulns, complianceVulns, cultureVulns, techVulns, relationshipVulns'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities'],
      properties: {
        vulnerabilities: { type: 'array', items: { type: 'object' } },
        operationalVulns: { type: 'array', items: { type: 'object' } },
        commVulns: { type: 'array', items: { type: 'object' } },
        leadershipVulns: { type: 'array', items: { type: 'object' } },
        supplyChainVulns: { type: 'array', items: { type: 'object' } },
        complianceVulns: { type: 'array', items: { type: 'object' } },
        cultureVulns: { type: 'array', items: { type: 'object' } },
        techVulns: { type: 'array', items: { type: 'object' } },
        relationshipVulns: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'vulnerability-mapping']
}));

export const defineEarlyWarningsTask = defineTask('define-early-warnings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Early Warning Indicators',
  agent: {
    name: 'early-warning-designer',
    prompt: {
      role: 'Risk intelligence specialist defining early warning systems',
      task: 'Define early warning indicators for identified threats',
      context: args,
      instructions: [
        'Define leading indicators for each threat',
        'Set threshold levels for warnings',
        'Create monitoring protocols for each indicator',
        'Define alert triggers and escalation',
        'Establish indicator measurement cadence',
        'Define response triggers for each warning level',
        'Create indicator dashboard requirements',
        'Define indicator review and update process'
      ],
      outputFormat: 'JSON with indicators array (threat, indicator, threshold, monitoringProtocol, alertTrigger, responseTrigger), measurementCadence, dashboardRequirements, reviewProcess'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators'],
      properties: {
        indicators: { type: 'array', items: { type: 'object' } },
        measurementCadence: { type: 'object' },
        dashboardRequirements: { type: 'object' },
        reviewProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'early-warning']
}));

export const prioritizeRisksTask = defineTask('prioritize-risks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize Risks',
  agent: {
    name: 'risk-prioritizer',
    prompt: {
      role: 'Strategic risk manager prioritizing reputation risks',
      task: 'Prioritize identified risks for action',
      context: args,
      instructions: [
        'Apply risk scoring methodology',
        'Create risk priority matrix',
        'Categorize risks by time horizon',
        'Assess resource requirements for mitigation',
        'Define action urgency levels',
        'Consider interdependencies between risks',
        'Create watch list for lower-priority items',
        'Define risk ownership assignments'
      ],
      outputFormat: 'JSON with prioritizedRisks array (risk, priority, timeHorizon, resourceReq, urgency, owner), priorityMatrix, watchList, interdependencies'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedRisks', 'priorityMatrix'],
      properties: {
        prioritizedRisks: { type: 'array', items: { type: 'object' } },
        priorityMatrix: { type: 'object' },
        watchList: { type: 'array', items: { type: 'object' } },
        interdependencies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'risk-prioritization']
}));

export const developInterventionsTask = defineTask('develop-interventions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Intervention Recommendations',
  agent: {
    name: 'intervention-developer',
    prompt: {
      role: 'Issues management specialist developing interventions',
      task: 'Develop intervention recommendations for priority risks',
      context: args,
      instructions: [
        'Develop proactive mitigation strategies',
        'Create early intervention playbooks',
        'Define stakeholder engagement actions',
        'Recommend communications actions',
        'Identify operational changes needed',
        'Define monitoring intensification',
        'Create escalation triggers',
        'Define success metrics for interventions'
      ],
      outputFormat: 'JSON with recommendations array (risk, strategy, actions, stakeholderEngagement, commsActions, operationalChanges, monitoring, successMetrics)'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'interventions']
}));

export const validateRiskIdentificationTask = defineTask('validate-risk-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Risk Identification Quality',
  agent: {
    name: 'risk-identification-validator',
    prompt: {
      role: 'Risk management quality assessor',
      task: 'Validate reputation risk identification quality',
      context: args,
      instructions: [
        'Assess scanning coverage completeness',
        'Evaluate issue detection thoroughness',
        'Review threat assessment rigor',
        'Assess vulnerability mapping completeness',
        'Evaluate early warning indicator quality',
        'Review risk prioritization logic',
        'Assess intervention recommendation actionability',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, scanningScore, detectionScore, threatScore, vulnerabilityScore, warningScore, prioritizationScore, interventionScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        scanningScore: { type: 'number' },
        detectionScore: { type: 'number' },
        threatScore: { type: 'number' },
        vulnerabilityScore: { type: 'number' },
        warningScore: { type: 'number' },
        prioritizationScore: { type: 'number' },
        interventionScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-validation']
}));

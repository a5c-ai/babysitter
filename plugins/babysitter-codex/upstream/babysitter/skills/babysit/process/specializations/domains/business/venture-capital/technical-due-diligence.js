/**
 * @process venture-capital/technical-due-diligence
 * @description Evaluation of technology stack, product architecture, code quality, technical debt, intellectual property portfolio, and R&D capabilities with expert reviewers
 * @inputs { companyName: string, techStack: object, codebaseAccess: boolean, productInfo: object }
 * @outputs { success: boolean, techAssessment: object, codeQuality: object, ipPortfolio: object, rdCapabilities: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    techStack = {},
    codebaseAccess = false,
    productInfo = {},
    outputDir = 'tech-dd-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Technology Stack Assessment
  ctx.log('info', 'Assessing technology stack');
  const stackAssessment = await ctx.task(techStackAssessmentTask, {
    companyName,
    techStack,
    outputDir
  });

  if (!stackAssessment.success) {
    return {
      success: false,
      error: 'Technology stack assessment failed',
      details: stackAssessment,
      metadata: { processId: 'venture-capital/technical-due-diligence', timestamp: startTime }
    };
  }

  artifacts.push(...stackAssessment.artifacts);

  // Task 2: Architecture Review
  ctx.log('info', 'Reviewing product architecture');
  const architectureReview = await ctx.task(architectureReviewTask, {
    companyName,
    techStack,
    productInfo,
    outputDir
  });

  artifacts.push(...architectureReview.artifacts);

  // Task 3: Code Quality Assessment
  ctx.log('info', 'Assessing code quality');
  const codeQuality = await ctx.task(codeQualityTask, {
    companyName,
    codebaseAccess,
    techStack,
    outputDir
  });

  artifacts.push(...codeQuality.artifacts);

  // Task 4: Technical Debt Analysis
  ctx.log('info', 'Analyzing technical debt');
  const techDebtAnalysis = await ctx.task(technicalDebtTask, {
    companyName,
    codeQuality: codeQuality.assessment,
    architectureReview: architectureReview.assessment,
    outputDir
  });

  artifacts.push(...techDebtAnalysis.artifacts);

  // Task 5: IP Portfolio Review
  ctx.log('info', 'Reviewing intellectual property portfolio');
  const ipReview = await ctx.task(ipPortfolioTask, {
    companyName,
    productInfo,
    outputDir
  });

  artifacts.push(...ipReview.artifacts);

  // Task 6: R&D Capabilities Assessment
  ctx.log('info', 'Assessing R&D capabilities');
  const rdAssessment = await ctx.task(rdCapabilitiesTask, {
    companyName,
    techStack,
    productInfo,
    outputDir
  });

  artifacts.push(...rdAssessment.artifacts);

  // Task 7: Security and Compliance Review
  ctx.log('info', 'Reviewing security and compliance');
  const securityReview = await ctx.task(securityReviewTask, {
    companyName,
    techStack,
    architectureReview: architectureReview.assessment,
    outputDir
  });

  artifacts.push(...securityReview.artifacts);

  // Breakpoint: Review technical DD findings
  await ctx.breakpoint({
    question: `Technical DD complete for ${companyName}. Tech score: ${stackAssessment.score}/100. Technical debt: ${techDebtAnalysis.debtLevel}. Review findings?`,
    title: 'Technical Due Diligence Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        techStackScore: stackAssessment.score,
        architectureScore: architectureReview.score,
        codeQualityScore: codeQuality.score,
        technicalDebtLevel: techDebtAnalysis.debtLevel,
        ipStrength: ipReview.strength,
        rdCapabilityScore: rdAssessment.score,
        securityScore: securityReview.score
      }
    }
  });

  // Task 8: Generate Technical DD Report
  ctx.log('info', 'Generating technical due diligence report');
  const ddReport = await ctx.task(techDDReportTask, {
    companyName,
    stackAssessment,
    architectureReview,
    codeQuality,
    techDebtAnalysis,
    ipReview,
    rdAssessment,
    securityReview,
    outputDir
  });

  artifacts.push(...ddReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    techAssessment: {
      stackScore: stackAssessment.score,
      stackAnalysis: stackAssessment.analysis,
      architectureScore: architectureReview.score,
      architectureAnalysis: architectureReview.assessment,
      scalabilityAssessment: architectureReview.scalability
    },
    codeQuality: {
      score: codeQuality.score,
      metrics: codeQuality.metrics,
      testCoverage: codeQuality.testCoverage,
      maintainability: codeQuality.maintainability
    },
    technicalDebt: {
      level: techDebtAnalysis.debtLevel,
      estimatedCost: techDebtAnalysis.estimatedCost,
      priorityItems: techDebtAnalysis.priorityItems
    },
    ipPortfolio: {
      strength: ipReview.strength,
      patents: ipReview.patents,
      tradeSecrets: ipReview.tradeSecrets,
      risks: ipReview.risks
    },
    rdCapabilities: {
      score: rdAssessment.score,
      teamAssessment: rdAssessment.teamAssessment,
      processMaturity: rdAssessment.processMaturity,
      innovationCapacity: rdAssessment.innovationCapacity
    },
    security: {
      score: securityReview.score,
      findings: securityReview.findings,
      compliance: securityReview.compliance
    },
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/technical-due-diligence',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: Technology Stack Assessment
export const techStackAssessmentTask = defineTask('tech-stack-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess technology stack',
  agent: {
    name: 'tech-stack-analyst',
    prompt: {
      role: 'technology stack analyst',
      task: 'Evaluate company technology stack choices and maturity',
      context: args,
      instructions: [
        'Document complete technology stack inventory',
        'Assess language and framework choices',
        'Evaluate database and storage technologies',
        'Review infrastructure and cloud providers',
        'Assess DevOps and CI/CD tooling',
        'Evaluate monitoring and observability',
        'Compare to industry best practices',
        'Identify technology risks and dependencies'
      ],
      outputFormat: 'JSON with stack analysis, score, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        analysis: { type: 'object' },
        strengths: { type: 'array' },
        weaknesses: { type: 'array' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'tech-stack', 'assessment']
}));

// Task 2: Architecture Review
export const architectureReviewTask = defineTask('architecture-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review product architecture',
  agent: {
    name: 'architecture-reviewer',
    prompt: {
      role: 'solutions architect',
      task: 'Review product architecture and design',
      context: args,
      instructions: [
        'Document high-level system architecture',
        'Evaluate microservices vs monolith decisions',
        'Assess API design and integration patterns',
        'Review data architecture and flows',
        'Evaluate scalability characteristics',
        'Assess reliability and fault tolerance',
        'Review performance optimization',
        'Identify architectural risks and constraints'
      ],
      outputFormat: 'JSON with architecture assessment, score, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'assessment', 'scalability', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'object' },
        scalability: { type: 'object' },
        patterns: { type: 'array' },
        risks: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'architecture', 'review']
}));

// Task 3: Code Quality Assessment
export const codeQualityTask = defineTask('code-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess code quality',
  agent: {
    name: 'code-quality-analyst',
    prompt: {
      role: 'software quality engineer',
      task: 'Assess codebase quality and maintainability',
      context: args,
      instructions: [
        'Review code organization and structure',
        'Assess coding standards and consistency',
        'Evaluate test coverage and quality',
        'Review documentation completeness',
        'Assess code complexity metrics',
        'Evaluate dependency management',
        'Review error handling patterns',
        'Identify code quality risks'
      ],
      outputFormat: 'JSON with code quality metrics, score, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'metrics', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        metrics: { type: 'object' },
        testCoverage: { type: 'number' },
        maintainability: { type: 'object' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'code-quality', 'assessment']
}));

// Task 4: Technical Debt Analysis
export const technicalDebtTask = defineTask('technical-debt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze technical debt',
  agent: {
    name: 'tech-debt-analyst',
    prompt: {
      role: 'technical debt specialist',
      task: 'Analyze and quantify technical debt',
      context: args,
      instructions: [
        'Identify areas of technical debt',
        'Categorize debt by type and severity',
        'Estimate cost to remediate',
        'Assess impact on velocity',
        'Prioritize debt reduction items',
        'Evaluate debt accumulation rate',
        'Review documentation gaps',
        'Create technical debt roadmap'
      ],
      outputFormat: 'JSON with debt analysis, cost estimate, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['debtLevel', 'estimatedCost', 'priorityItems', 'artifacts'],
      properties: {
        debtLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        estimatedCost: { type: 'number' },
        priorityItems: { type: 'array' },
        debtCategories: { type: 'object' },
        roadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'technical-debt', 'analysis']
}));

// Task 5: IP Portfolio Review
export const ipPortfolioTask = defineTask('ip-portfolio', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review IP portfolio',
  agent: {
    name: 'ip-analyst',
    prompt: {
      role: 'intellectual property analyst',
      task: 'Review and assess intellectual property portfolio',
      context: args,
      instructions: [
        'Inventory all patents and applications',
        'Review patent claims and scope',
        'Assess trade secret protection',
        'Evaluate copyright and trademark portfolio',
        'Review IP assignment and ownership',
        'Assess freedom to operate',
        'Identify IP infringement risks',
        'Evaluate IP competitive advantage'
      ],
      outputFormat: 'JSON with IP assessment, strength rating, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strength', 'patents', 'artifacts'],
      properties: {
        strength: { type: 'string', enum: ['weak', 'moderate', 'strong', 'exceptional'] },
        patents: { type: 'array' },
        tradeSecrets: { type: 'array' },
        trademarks: { type: 'array' },
        risks: { type: 'array' },
        freedomToOperate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ip', 'portfolio']
}));

// Task 6: R&D Capabilities Assessment
export const rdCapabilitiesTask = defineTask('rd-capabilities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess R&D capabilities',
  agent: {
    name: 'rd-analyst',
    prompt: {
      role: 'R&D assessment specialist',
      task: 'Assess research and development capabilities',
      context: args,
      instructions: [
        'Evaluate engineering team composition',
        'Assess technical leadership quality',
        'Review development process maturity',
        'Evaluate innovation track record',
        'Assess ability to attract technical talent',
        'Review R&D budget and efficiency',
        'Evaluate technology roadmap',
        'Assess competitive R&D positioning'
      ],
      outputFormat: 'JSON with R&D assessment, score, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'teamAssessment', 'processMaturity', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        teamAssessment: { type: 'object' },
        processMaturity: { type: 'object' },
        innovationCapacity: { type: 'object' },
        roadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'rd', 'capabilities']
}));

// Task 7: Security Review
export const securityReviewTask = defineTask('security-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review security and compliance',
  agent: {
    name: 'security-analyst',
    prompt: {
      role: 'security and compliance analyst',
      task: 'Review security posture and compliance status',
      context: args,
      instructions: [
        'Review security architecture',
        'Assess authentication and authorization',
        'Evaluate data protection measures',
        'Review vulnerability management',
        'Assess compliance certifications (SOC2, ISO)',
        'Evaluate incident response capabilities',
        'Review third-party security risks',
        'Identify security gaps and risks'
      ],
      outputFormat: 'JSON with security assessment, score, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'findings', 'compliance', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        findings: { type: 'array' },
        compliance: { type: 'object' },
        risks: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'security', 'compliance']
}));

// Task 8: Technical DD Report Generation
export const techDDReportTask = defineTask('tech-dd-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate technical DD report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'VC technical analyst',
      task: 'Generate comprehensive technical due diligence report',
      context: args,
      instructions: [
        'Create executive summary of findings',
        'Present technology stack assessment',
        'Document architecture review',
        'Include code quality analysis',
        'Present technical debt findings',
        'Document IP portfolio review',
        'Include R&D capabilities assessment',
        'Present security review findings',
        'Format as investment committee ready document'
      ],
      outputFormat: 'JSON with report path, key findings, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'technical-dd', 'reporting']
}));

/**
 * @process specializations/domains/business/legal/contract-review-analysis
 * @description Contract Review and Analysis - Systematic contract review workflows with risk assessment,
 * term extraction, deviation tracking, and redline analysis for incoming and outgoing agreements.
 * @inputs { contractPath: string, contractType?: string, partyRole?: string, reviewType?: string, playbook?: string, outputDir?: string }
 * @outputs { success: boolean, riskAssessment: object, extractedTerms: array, deviations: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/contract-review-analysis', {
 *   contractPath: 'contracts/incoming/vendor-agreement-v3.docx',
 *   contractType: 'vendor-services-agreement',
 *   partyRole: 'customer',
 *   reviewType: 'incoming',
 *   playbook: 'standard-vendor-playbook',
 *   outputDir: 'contract-reviews'
 * });
 *
 * @references
 * - WorldCC Contract Management Standards: https://www.worldcc.com/Resources/Contract-Management-Standards
 * - ABA Contract Analysis: https://www.americanbar.org/
 * - Legal AI Contract Review: https://www.kira.com/
 * - Contract Analysis Best Practices: https://www.lawgeex.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contractPath,
    contractType = 'general',
    partyRole = 'party-a',
    reviewType = 'standard', // 'standard', 'expedited', 'detailed'
    playbook = null,
    comparisonTemplate = null,
    riskTolerance = 'medium', // 'low', 'medium', 'high'
    outputDir = 'contract-review-output',
    extractBusinessTerms = true,
    trackDeviations = true,
    generateRedline = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let riskAssessment = {};
  let extractedTerms = [];
  let deviations = [];

  ctx.log('info', `Starting Contract Review and Analysis`);
  ctx.log('info', `Contract: ${contractPath}, Type: ${contractType}, Role: ${partyRole}`);

  // ============================================================================
  // PHASE 1: CONTRACT PARSING AND EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Parsing contract and extracting content');

  const contractParsing = await ctx.task(contractParsingTask, {
    contractPath,
    contractType,
    outputDir
  });

  if (!contractParsing.success) {
    return {
      success: false,
      error: 'Failed to parse contract document',
      details: contractParsing.error,
      phase: 'contract-parsing',
      metadata: {
        processId: 'specializations/domains/business/legal/contract-review-analysis',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...contractParsing.artifacts);

  ctx.log('info', `Contract parsed. Sections: ${contractParsing.sectionCount}, Pages: ${contractParsing.pageCount}`);

  // ============================================================================
  // PHASE 2: TERM EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Extracting key terms and provisions');

  const termExtraction = await ctx.task(termExtractionTask, {
    parsedContract: contractParsing.parsedContent,
    contractType,
    extractBusinessTerms,
    outputDir
  });

  artifacts.push(...termExtraction.artifacts);
  extractedTerms = termExtraction.terms;

  ctx.log('info', `Extracted ${extractedTerms.length} key terms`);

  // ============================================================================
  // PHASE 3: CLAUSE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying and classifying clauses');

  const clauseIdentification = await ctx.task(clauseIdentificationTask, {
    parsedContract: contractParsing.parsedContent,
    contractType,
    outputDir
  });

  artifacts.push(...clauseIdentification.artifacts);

  ctx.log('info', `Identified ${clauseIdentification.clauseCount} clauses across ${clauseIdentification.categoryCount} categories`);

  // ============================================================================
  // PHASE 4: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Conducting risk assessment');

  const riskAnalysis = await ctx.task(riskAssessmentTask, {
    parsedContract: contractParsing.parsedContent,
    extractedTerms,
    clauses: clauseIdentification.clauses,
    contractType,
    partyRole,
    riskTolerance,
    outputDir
  });

  artifacts.push(...riskAnalysis.artifacts);
  riskAssessment = riskAnalysis.assessment;

  ctx.log('info', `Risk assessment complete. Overall risk: ${riskAssessment.overallRisk}, Score: ${riskAssessment.riskScore}/100`);

  // Quality Gate: High risk contract
  if (riskAssessment.riskScore > 70) {
    await ctx.breakpoint({
      question: `High risk contract detected (Score: ${riskAssessment.riskScore}/100). ${riskAssessment.criticalIssues.length} critical issues found. Review risk assessment before proceeding?`,
      title: 'High Risk Contract Alert',
      context: {
        runId: ctx.runId,
        riskScore: riskAssessment.riskScore,
        overallRisk: riskAssessment.overallRisk,
        criticalIssues: riskAssessment.criticalIssues,
        highRiskClauses: riskAssessment.highRiskClauses,
        files: riskAnalysis.artifacts.map(a => ({
          path: a.path,
          format: a.format || 'json',
          label: 'Risk Assessment'
        }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: PLAYBOOK COMPARISON (if playbook provided)
  // ============================================================================

  let playbookAnalysis = null;

  if (playbook || trackDeviations) {
    ctx.log('info', 'Phase 5: Comparing against playbook and tracking deviations');

    playbookAnalysis = await ctx.task(playbookComparisonTask, {
      parsedContract: contractParsing.parsedContent,
      clauses: clauseIdentification.clauses,
      extractedTerms,
      playbook,
      comparisonTemplate,
      contractType,
      partyRole,
      outputDir
    });

    artifacts.push(...playbookAnalysis.artifacts);
    deviations = playbookAnalysis.deviations;

    ctx.log('info', `Found ${deviations.length} deviations from standard positions`);
  }

  // ============================================================================
  // PHASE 6: LIABILITY AND INDEMNIFICATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing liability and indemnification provisions');

  const liabilityAnalysis = await ctx.task(liabilityAnalysisTask, {
    parsedContract: contractParsing.parsedContent,
    clauses: clauseIdentification.clauses,
    partyRole,
    contractType,
    outputDir
  });

  artifacts.push(...liabilityAnalysis.artifacts);

  ctx.log('info', `Liability analysis complete. Exposure level: ${liabilityAnalysis.exposureLevel}`);

  // ============================================================================
  // PHASE 7: IP AND CONFIDENTIALITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing IP and confidentiality provisions');

  const ipAnalysis = await ctx.task(ipConfidentialityAnalysisTask, {
    parsedContract: contractParsing.parsedContent,
    clauses: clauseIdentification.clauses,
    partyRole,
    contractType,
    outputDir
  });

  artifacts.push(...ipAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: REDLINE GENERATION (if comparison template provided)
  // ============================================================================

  let redlineResult = null;

  if (generateRedline && comparisonTemplate) {
    ctx.log('info', 'Phase 8: Generating redline comparison');

    redlineResult = await ctx.task(redlineGenerationTask, {
      contractPath,
      comparisonTemplate,
      outputDir
    });

    artifacts.push(...redlineResult.artifacts);

    ctx.log('info', 'Redline document generated');
  }

  // ============================================================================
  // PHASE 9: RECOMMENDATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating recommendations');

  const recommendations = await ctx.task(recommendationGenerationTask, {
    riskAssessment,
    deviations,
    liabilityAnalysis,
    ipAnalysis,
    extractedTerms,
    partyRole,
    contractType,
    riskTolerance,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  ctx.log('info', `Generated ${recommendations.recommendationsList.length} recommendations`);

  // ============================================================================
  // PHASE 10: REVIEW REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive review report');

  const reviewReport = await ctx.task(reviewReportTask, {
    contractPath,
    contractType,
    partyRole,
    contractParsing,
    termExtraction,
    clauseIdentification,
    riskAssessment,
    playbookAnalysis,
    liabilityAnalysis,
    ipAnalysis,
    recommendations,
    redlineResult,
    outputDir
  });

  artifacts.push(...reviewReport.artifacts);

  // Final Breakpoint: Review Approval
  await ctx.breakpoint({
    question: `Contract review complete. Risk Score: ${riskAssessment.riskScore}/100, ${deviations.length} deviations, ${recommendations.recommendationsList.length} recommendations. Approve review report?`,
    title: 'Contract Review Final Approval',
    context: {
      runId: ctx.runId,
      summary: {
        contractType,
        partyRole,
        riskScore: riskAssessment.riskScore,
        overallRisk: riskAssessment.overallRisk,
        termsExtracted: extractedTerms.length,
        deviationsFound: deviations.length,
        recommendationsCount: recommendations.recommendationsList.length,
        criticalIssues: riskAssessment.criticalIssues.length
      },
      files: [
        { path: reviewReport.reportPath, format: 'markdown', label: 'Review Report' },
        { path: reviewReport.summaryPath, format: 'json', label: 'Review Summary' },
        ...(redlineResult ? [{ path: redlineResult.redlinePath, format: 'docx', label: 'Redline Document' }] : [])
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    contractPath,
    contractType,
    partyRole,
    riskAssessment: {
      overallRisk: riskAssessment.overallRisk,
      riskScore: riskAssessment.riskScore,
      criticalIssues: riskAssessment.criticalIssues,
      highRiskClauses: riskAssessment.highRiskClauses,
      riskCategories: riskAssessment.riskCategories
    },
    extractedTerms: extractedTerms.map(t => ({
      name: t.name,
      value: t.value,
      category: t.category,
      section: t.section
    })),
    deviations: deviations.map(d => ({
      clause: d.clause,
      standardPosition: d.standardPosition,
      contractPosition: d.contractPosition,
      severity: d.severity,
      recommendation: d.recommendation
    })),
    liabilityAnalysis: {
      exposureLevel: liabilityAnalysis.exposureLevel,
      capAmount: liabilityAnalysis.capAmount,
      indemnificationScope: liabilityAnalysis.indemnificationScope
    },
    recommendations: recommendations.recommendationsList,
    reviewReport: {
      path: reviewReport.reportPath,
      summaryPath: reviewReport.summaryPath
    },
    redline: redlineResult ? {
      path: redlineResult.redlinePath,
      changesCount: redlineResult.changesCount
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/legal/contract-review-analysis',
      timestamp: startTime,
      reviewType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const contractParsingTask = defineTask('contract-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parse contract document',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Document Parser',
      task: 'Parse contract document and extract structured content',
      context: args,
      instructions: [
        'Load and parse contract document',
        'Extract document metadata (title, date, parties)',
        'Identify and extract all sections',
        'Parse definitions section',
        'Extract recitals and background',
        'Identify exhibits and schedules',
        'Preserve document structure and hierarchy',
        'Extract signature blocks',
        'Count pages, words, and sections'
      ],
      outputFormat: 'JSON with success, parsedContent, sectionCount, pageCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'parsedContent', 'sectionCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        parsedContent: { type: 'object' },
        sectionCount: { type: 'number' },
        pageCount: { type: 'number' },
        wordCount: { type: 'number' },
        hasExhibits: { type: 'boolean' },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-review', 'parsing']
}));

export const termExtractionTask = defineTask('term-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract key terms and provisions',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Term Extraction Specialist',
      task: 'Extract key business and legal terms from parsed contract',
      context: args,
      instructions: [
        'Extract defined terms and definitions',
        'Identify key business terms (price, term, renewal)',
        'Extract dates (effective, expiration, milestones)',
        'Identify payment terms and amounts',
        'Extract service levels and SLAs',
        'Identify termination provisions',
        'Extract geographic scope and limitations',
        'Identify party obligations',
        'Categorize all extracted terms'
      ],
      outputFormat: 'JSON with terms array, categories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['terms', 'artifacts'],
      properties: {
        terms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
              category: { type: 'string' },
              section: { type: 'string' },
              importance: { type: 'string' }
            }
          }
        },
        categories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-review', 'extraction']
}));

export const clauseIdentificationTask = defineTask('clause-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and classify clauses',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Clause Classifier',
      task: 'Identify and classify all clauses in the contract',
      context: args,
      instructions: [
        'Identify all distinct clauses in contract',
        'Classify clauses by category (liability, IP, confidentiality, etc.)',
        'Extract clause text and location',
        'Identify standard vs non-standard clauses',
        'Flag unusual or missing expected clauses',
        'Note clause dependencies and cross-references',
        'Identify boilerplate vs negotiated clauses',
        'Document clause relationships'
      ],
      outputFormat: 'JSON with clauses array, clauseCount, categoryCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clauses', 'clauseCount', 'categoryCount', 'artifacts'],
      properties: {
        clauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              category: { type: 'string' },
              text: { type: 'string' },
              section: { type: 'string' },
              isStandard: { type: 'boolean' }
            }
          }
        },
        clauseCount: { type: 'number' },
        categoryCount: { type: 'number' },
        missingExpectedClauses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-review', 'clauses']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct risk assessment',
  agent: {
    name: 'legal-risk-analyst',
    prompt: {
      role: 'Legal Risk Assessment Specialist',
      task: 'Assess legal and business risks in the contract',
      context: args,
      instructions: [
        'Evaluate overall contract risk level',
        'Assess liability exposure risks',
        'Evaluate indemnification risks',
        'Assess IP ownership and licensing risks',
        'Evaluate confidentiality and data risks',
        'Assess termination and exit risks',
        'Evaluate financial and payment risks',
        'Identify critical/high-risk clauses',
        'Calculate overall risk score (0-100)',
        'Prioritize issues by severity'
      ],
      outputFormat: 'JSON with assessment object containing overallRisk, riskScore, criticalIssues, highRiskClauses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            overallRisk: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            riskScore: { type: 'number', minimum: 0, maximum: 100 },
            criticalIssues: { type: 'array', items: { type: 'object' } },
            highRiskClauses: { type: 'array', items: { type: 'string' } },
            riskCategories: { type: 'object' }
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
  labels: ['agent', 'contract-review', 'risk']
}));

export const playbookComparisonTask = defineTask('playbook-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare against playbook and track deviations',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Contract Playbook Analyst',
      task: 'Compare contract terms against standard playbook positions and track deviations',
      context: args,
      instructions: [
        'Load applicable playbook for contract type',
        'Compare each clause against standard positions',
        'Identify deviations from preferred terms',
        'Classify deviation severity (minor, moderate, major)',
        'Determine if deviations are acceptable per playbook',
        'Identify terms requiring escalation',
        'Document fallback positions available',
        'Track negotiation leverage points',
        'Generate deviation summary'
      ],
      outputFormat: 'JSON with deviations array, deviationCount, escalationRequired, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deviations', 'artifacts'],
      properties: {
        deviations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              clause: { type: 'string' },
              standardPosition: { type: 'string' },
              contractPosition: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'moderate', 'major'] },
              acceptable: { type: 'boolean' },
              recommendation: { type: 'string' }
            }
          }
        },
        deviationCount: { type: 'number' },
        escalationRequired: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-review', 'playbook']
}));

export const liabilityAnalysisTask = defineTask('liability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze liability and indemnification',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Liability Analysis Specialist',
      task: 'Analyze liability caps, indemnification provisions, and exposure',
      context: args,
      instructions: [
        'Identify limitation of liability clause',
        'Analyze liability cap amount and calculation',
        'Identify carve-outs from liability cap',
        'Analyze indemnification provisions',
        'Identify indemnification triggers',
        'Evaluate defense and control provisions',
        'Assess insurance requirements',
        'Calculate potential exposure level',
        'Compare to industry standards'
      ],
      outputFormat: 'JSON with exposureLevel, capAmount, indemnificationScope, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['exposureLevel', 'artifacts'],
      properties: {
        exposureLevel: { type: 'string', enum: ['unlimited', 'high', 'moderate', 'limited', 'minimal'] },
        capAmount: { type: 'string' },
        capType: { type: 'string' },
        carveOuts: { type: 'array', items: { type: 'string' } },
        indemnificationScope: { type: 'string' },
        indemnificationTriggers: { type: 'array', items: { type: 'string' } },
        insuranceRequired: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-review', 'liability']
}));

export const ipConfidentialityAnalysisTask = defineTask('ip-confidentiality-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze IP and confidentiality provisions',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'IP and Confidentiality Specialist',
      task: 'Analyze intellectual property and confidentiality provisions',
      context: args,
      instructions: [
        'Identify IP ownership provisions',
        'Analyze work product ownership',
        'Evaluate license grants and scope',
        'Identify confidentiality obligations',
        'Analyze confidential information definition',
        'Evaluate exclusions from confidentiality',
        'Assess confidentiality term',
        'Identify return/destruction obligations',
        'Evaluate data protection provisions'
      ],
      outputFormat: 'JSON with ipOwnership, licenseGrants, confidentialityScope, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['artifacts'],
      properties: {
        ipOwnership: { type: 'string' },
        workProductOwnership: { type: 'string' },
        licenseGrants: { type: 'array', items: { type: 'object' } },
        confidentialityScope: { type: 'string' },
        confidentialityTerm: { type: 'string' },
        dataProtectionProvisions: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-review', 'ip']
}));

export const redlineGenerationTask = defineTask('redline-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate redline comparison',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Document Comparison Specialist',
      task: 'Generate redline comparison between contract and template',
      context: args,
      instructions: [
        'Load contract and comparison template',
        'Perform document comparison',
        'Generate redline markup showing changes',
        'Categorize changes (additions, deletions, modifications)',
        'Count total changes',
        'Identify significant changes',
        'Generate change summary',
        'Save redline document'
      ],
      outputFormat: 'JSON with redlinePath, changesCount, significantChanges, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['redlinePath', 'changesCount', 'artifacts'],
      properties: {
        redlinePath: { type: 'string' },
        changesCount: { type: 'number' },
        additions: { type: 'number' },
        deletions: { type: 'number' },
        modifications: { type: 'number' },
        significantChanges: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-review', 'redline']
}));

export const recommendationGenerationTask = defineTask('recommendation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate recommendations',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Advisory Specialist',
      task: 'Generate actionable recommendations based on contract review findings',
      context: args,
      instructions: [
        'Prioritize recommendations by risk and impact',
        'Generate recommendations for critical issues',
        'Recommend clause modifications',
        'Suggest negotiation positions',
        'Recommend risk mitigation measures',
        'Suggest protective provisions to add',
        'Recommend approval conditions',
        'Provide business justification for recommendations',
        'Categorize recommendations by urgency'
      ],
      outputFormat: 'JSON with recommendationsList array, prioritizedActions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendationsList', 'artifacts'],
      properties: {
        recommendationsList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        prioritizedActions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-review', 'recommendations']
}));

export const reviewReportTask = defineTask('review-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive review report',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Report Writer',
      task: 'Generate comprehensive contract review report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document contract overview',
        'Summarize key terms extracted',
        'Present risk assessment findings',
        'Document deviations from standard',
        'Summarize liability analysis',
        'Summarize IP and confidentiality analysis',
        'List all recommendations',
        'Include supporting appendices',
        'Format as professional legal memo'
      ],
      outputFormat: 'JSON with reportPath, summaryPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summaryPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summaryPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-review', 'report']
}));

/**
 * @process specializations/technical-documentation/docs-testing
 * @description Comprehensive documentation testing and validation process including accuracy verification, link checking, code example validation, accessibility testing, and quality scoring
 * @specialization Technical Documentation
 * @category Quality Assurance
 * @inputs { docsPath: string, docType: string, testCodeExamples: boolean, checkLinks: boolean, validateAccessibility: boolean, targetQuality: number }
 * @outputs { success: boolean, testResults: object, quality: number, issues: array, artifacts: string[] }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    docsPath,
    docType = 'markdown', // markdown, html, api-docs, user-guide
    testCodeExamples = true,
    checkLinks = true,
    validateAccessibility = true,
    checkGrammar = true,
    validateStructure = true,
    targetQuality = 85,
    outputDir = 'docs-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Documentation Testing and Validation for ${docsPath}`);

  // ============================================================================
  // PHASE 1: DOCUMENTATION DISCOVERY AND INVENTORY
  // ============================================================================

  await ctx.breakpoint({
    question: 'Starting documentation testing. Discover and inventory documentation files?',
    title: 'Phase 1: Documentation Discovery',
    context: {
      runId: ctx.runId,
      phase: 'discovery',
      docsPath,
      docType
    }
  });

  const docsInventory = await ctx.task(docsInventoryTask, {
    docsPath,
    docType,
    outputDir
  });

  artifacts.push(...docsInventory.artifacts);

  if (docsInventory.fileCount === 0) {
    return {
      success: false,
      error: 'No documentation files found',
      docsPath,
      metadata: { processId: 'specializations/technical-documentation/docs-testing', timestamp: startTime }
    };
  }

  // ============================================================================
  // PHASE 2: STRUCTURAL VALIDATION
  // ============================================================================

  let structureValidation = null;
  if (validateStructure) {
    await ctx.breakpoint({
      question: `Found ${docsInventory.fileCount} documentation files. Validate document structure and formatting?`,
      title: 'Phase 2: Structural Validation',
      context: {
        runId: ctx.runId,
        phase: 'structural-validation',
        fileCount: docsInventory.fileCount
      }
    });

    structureValidation = await ctx.task(structureValidationTask, {
      docsInventory,
      docType,
      outputDir
    });

    artifacts.push(...structureValidation.artifacts);
  }

  // ============================================================================
  // PHASE 3: CONTENT ACCURACY VERIFICATION
  // ============================================================================

  await ctx.breakpoint({
    question: 'Validate content accuracy and completeness?',
    title: 'Phase 3: Content Accuracy Verification',
    context: {
      runId: ctx.runId,
      phase: 'accuracy-verification',
      structureIssues: structureValidation?.issueCount || 0
    }
  });

  const accuracyVerification = await ctx.task(accuracyVerificationTask, {
    docsInventory,
    docType,
    outputDir
  });

  artifacts.push(...accuracyVerification.artifacts);

  // ============================================================================
  // PHASE 4: CODE EXAMPLE TESTING (Parallel if applicable)
  // ============================================================================

  let codeExampleTests = null;
  if (testCodeExamples && docsInventory.codeExampleCount > 0) {
    await ctx.breakpoint({
      question: `Found ${docsInventory.codeExampleCount} code examples. Test and validate code examples?`,
      title: 'Phase 4: Code Example Testing',
      context: {
        runId: ctx.runId,
        phase: 'code-testing',
        exampleCount: docsInventory.codeExampleCount
      }
    });

    codeExampleTests = await ctx.task(codeExampleTestingTask, {
      docsInventory,
      docType,
      outputDir
    });

    artifacts.push(...codeExampleTests.artifacts);
  }

  // ============================================================================
  // PHASE 5: LINK VALIDATION
  // ============================================================================

  let linkValidation = null;
  if (checkLinks) {
    await ctx.breakpoint({
      question: 'Check all internal and external links for validity?',
      title: 'Phase 5: Link Validation',
      context: {
        runId: ctx.runId,
        phase: 'link-validation',
        estimatedLinks: docsInventory.estimatedLinkCount || 'unknown'
      }
    });

    linkValidation = await ctx.task(linkValidationTask, {
      docsInventory,
      docType,
      outputDir
    });

    artifacts.push(...linkValidation.artifacts);
  }

  // ============================================================================
  // PHASE 6: GRAMMAR AND LANGUAGE QUALITY
  // ============================================================================

  let grammarCheck = null;
  if (checkGrammar) {
    await ctx.breakpoint({
      question: 'Check grammar, spelling, and language quality?',
      title: 'Phase 6: Grammar and Language Quality',
      context: {
        runId: ctx.runId,
        phase: 'grammar-check'
      }
    });

    grammarCheck = await ctx.task(grammarCheckTask, {
      docsInventory,
      docType,
      outputDir
    });

    artifacts.push(...grammarCheck.artifacts);
  }

  // ============================================================================
  // PHASE 7: ACCESSIBILITY VALIDATION
  // ============================================================================

  let accessibilityValidation = null;
  if (validateAccessibility && (docType === 'html' || docType === 'api-docs')) {
    await ctx.breakpoint({
      question: 'Validate documentation accessibility (WCAG compliance)?',
      title: 'Phase 7: Accessibility Validation',
      context: {
        runId: ctx.runId,
        phase: 'accessibility-validation'
      }
    });

    accessibilityValidation = await ctx.task(accessibilityValidationTask, {
      docsInventory,
      docType,
      outputDir
    });

    artifacts.push(...accessibilityValidation.artifacts);
  }

  // ============================================================================
  // PHASE 8: COMPREHENSIVE QUALITY SCORING
  // ============================================================================

  await ctx.breakpoint({
    question: 'Calculate comprehensive documentation quality score?',
    title: 'Phase 8: Quality Scoring',
    context: {
      runId: ctx.runId,
      phase: 'quality-scoring',
      targetQuality
    }
  });

  const qualityScore = await ctx.task(qualityScoringTask, {
    docsInventory,
    structureValidation,
    accuracyVerification,
    codeExampleTests,
    linkValidation,
    grammarCheck,
    accessibilityValidation,
    targetQuality,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallQuality = qualityScore.overallScore;
  const qualityMet = overallQuality >= targetQuality;

  // ============================================================================
  // PHASE 9: ISSUE REMEDIATION RECOMMENDATIONS
  // ============================================================================

  const criticalIssues = qualityScore.criticalIssues || [];
  const highPriorityIssues = qualityScore.highPriorityIssues || [];

  let remediationPlan = null;
  if (!qualityMet || criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `Quality score ${overallQuality}/${targetQuality}. ${criticalIssues.length} critical issues found. Generate remediation plan?`,
      title: 'Phase 9: Issue Remediation Planning',
      context: {
        runId: ctx.runId,
        phase: 'remediation-planning',
        criticalIssues: criticalIssues.length,
        highPriorityIssues: highPriorityIssues.length,
        overallQuality
      }
    });

    remediationPlan = await ctx.task(remediationPlanningTask, {
      qualityScore,
      structureValidation,
      accuracyVerification,
      codeExampleTests,
      linkValidation,
      grammarCheck,
      accessibilityValidation,
      outputDir
    });

    artifacts.push(...remediationPlan.artifacts);
  }

  // ============================================================================
  // PHASE 10: GENERATE COMPREHENSIVE TEST REPORT
  // ============================================================================

  await ctx.breakpoint({
    question: 'Generate comprehensive documentation testing report?',
    title: 'Phase 10: Test Report Generation',
    context: {
      runId: ctx.runId,
      phase: 'report-generation',
      qualityMet,
      overallQuality,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      }))
    }
  });

  const testReport = await ctx.task(testReportGenerationTask, {
    docsInventory,
    structureValidation,
    accuracyVerification,
    codeExampleTests,
    linkValidation,
    grammarCheck,
    accessibilityValidation,
    qualityScore,
    remediationPlan,
    qualityMet,
    targetQuality,
    outputDir
  });

  artifacts.push(...testReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  // Final result
  return {
    success: qualityMet,
    qualityMet,
    overallQuality,
    targetQuality,
    docsPath,
    docType,
    testReport: testReport.reportPath,
    testResults: {
      filesAnalyzed: docsInventory.fileCount,
      structureValidation: structureValidation ? {
        passed: structureValidation.passed,
        issueCount: structureValidation.issueCount,
        score: structureValidation.score
      } : null,
      accuracyVerification: {
        passed: accuracyVerification.passed,
        issueCount: accuracyVerification.issueCount,
        completenessScore: accuracyVerification.completenessScore
      },
      codeExampleTests: codeExampleTests ? {
        totalExamples: codeExampleTests.totalExamples,
        passed: codeExampleTests.passedCount,
        failed: codeExampleTests.failedCount,
        syntaxErrors: codeExampleTests.syntaxErrors,
        runtimeErrors: codeExampleTests.runtimeErrors
      } : null,
      linkValidation: linkValidation ? {
        totalLinks: linkValidation.totalLinks,
        validLinks: linkValidation.validLinks,
        brokenLinks: linkValidation.brokenLinks,
        warningLinks: linkValidation.warningLinks
      } : null,
      grammarCheck: grammarCheck ? {
        issues: grammarCheck.issueCount,
        score: grammarCheck.score
      } : null,
      accessibilityValidation: accessibilityValidation ? {
        passed: accessibilityValidation.passed,
        violations: accessibilityValidation.violationCount,
        wcagLevel: accessibilityValidation.wcagLevel
      } : null
    },
    issues: {
      critical: criticalIssues,
      highPriority: highPriorityIssues,
      total: qualityScore.totalIssues
    },
    remediationPlan: remediationPlan ? remediationPlan.plan : null,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/docs-testing',
      timestamp: startTime,
      docsPath,
      docType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Documentation Inventory
export const docsInventoryTask = defineTask('docs-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover and inventory documentation files',
  agent: {
    name: 'docs-inventory-agent',
    prompt: {
      role: 'documentation QA engineer',
      task: 'Discover, catalog, and analyze documentation files and structure',
      context: args,
      instructions: [
        'Scan the documentation directory recursively for all documentation files',
        'Identify documentation file types: Markdown (.md), HTML (.html), reStructuredText (.rst), AsciiDoc (.adoc)',
        'Count total files and categorize by type',
        'Extract code examples from documentation (fenced code blocks, inline code)',
        'Count code examples by language',
        'Identify all headings and create table of contents structure',
        'Estimate link count (internal references, external URLs)',
        'Identify images, diagrams, and other media assets',
        'Detect documentation generation tools (Sphinx, MkDocs, Docusaurus, JSDoc)',
        'Create comprehensive inventory report with file paths and metadata'
      ],
      outputFormat: 'JSON with fileCount, files (array with paths), codeExampleCount, estimatedLinkCount, imageCount, docStructure, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fileCount', 'files', 'codeExampleCount', 'artifacts'],
      properties: {
        fileCount: { type: 'number' },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              size: { type: 'number' },
              lastModified: { type: 'string' }
            }
          }
        },
        codeExampleCount: { type: 'number' },
        codeExamplesByLanguage: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        estimatedLinkCount: { type: 'number' },
        imageCount: { type: 'number' },
        docStructure: { type: 'object' },
        detectedTools: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs-testing', 'inventory']
}));

// Task 2: Structure Validation
export const structureValidationTask = defineTask('structure-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate document structure and formatting',
  agent: {
    name: 'structure-validator',
    prompt: {
      role: 'technical documentation standards expert',
      task: 'Validate documentation structure, formatting, and organization against best practices',
      context: args,
      instructions: [
        'Validate Markdown/HTML syntax correctness',
        'Check heading hierarchy (H1 -> H2 -> H3, no skipped levels)',
        'Verify table of contents presence and accuracy',
        'Check consistent formatting: lists, tables, code blocks',
        'Validate frontmatter/metadata if present (YAML, TOML)',
        'Check for consistent file naming conventions',
        'Verify navigation structure and logical organization',
        'Detect duplicate headings within same document',
        'Check line length compliance (recommended 80-120 chars)',
        'Validate special characters and encoding (UTF-8)',
        'Report structural issues with severity (critical, warning, info)'
      ],
      outputFormat: 'JSON with passed, issueCount, issues (array), score (0-100), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issueCount', 'score', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        issueCount: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              message: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        score: { type: 'number', minimum: 0, maximum: 100 },
        syntaxErrors: { type: 'number' },
        headingIssues: { type: 'number' },
        formattingIssues: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs-testing', 'structure-validation']
}));

// Task 3: Accuracy Verification
export const accuracyVerificationTask = defineTask('accuracy-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify content accuracy and completeness',
  agent: {
    name: 'accuracy-verifier',
    prompt: {
      role: 'technical documentation reviewer',
      task: 'Verify documentation content accuracy, completeness, and technical correctness',
      context: args,
      instructions: [
        'Review technical accuracy of documented concepts and instructions',
        'Verify API endpoint documentation matches actual API (if applicable)',
        'Check that all required sections are present (intro, prerequisites, examples, troubleshooting)',
        'Validate command syntax and options are correct',
        'Verify file paths and references are accurate',
        'Check version numbers and compatibility information',
        'Identify outdated or deprecated content',
        'Verify cross-references between documentation sections',
        'Check for completeness: missing steps, incomplete explanations',
        'Identify contradictions or inconsistent information',
        'Assess clarity and understandability for target audience',
        'Score content completeness (0-100)'
      ],
      outputFormat: 'JSON with passed, issueCount, issues (array), completenessScore (0-100), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issueCount', 'completenessScore', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        issueCount: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              section: { type: 'string' },
              severity: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        technicalErrors: { type: 'number' },
        outdatedContent: { type: 'number' },
        missingContent: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs-testing', 'accuracy-verification']
}));

// Task 4: Code Example Testing
export const codeExampleTestingTask = defineTask('code-example-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test and validate code examples',
  agent: {
    name: 'code-example-tester',
    prompt: {
      role: 'QA engineer specializing in documentation code examples',
      task: 'Extract, test, and validate all code examples from documentation',
      context: args,
      instructions: [
        'Extract all code examples from documentation (fenced code blocks)',
        'Identify programming language for each example',
        'Validate syntax correctness for each language',
        'Test executable examples (JavaScript, Python, Shell scripts)',
        'Check for common issues: missing imports, undefined variables, syntax errors',
        'Verify code examples follow language best practices',
        'Test that examples produce expected output (if documented)',
        'Check code style and formatting consistency',
        'Identify deprecated APIs or outdated patterns',
        'Validate that examples are self-contained and runnable',
        'Report failed examples with specific error messages',
        'Categorize failures: syntax errors, runtime errors, logic errors'
      ],
      outputFormat: 'JSON with totalExamples, passedCount, failedCount, syntaxErrors, runtimeErrors, failures (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalExamples', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        totalExamples: { type: 'number' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        syntaxErrors: { type: 'number' },
        runtimeErrors: { type: 'number' },
        styleIssues: { type: 'number' },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              language: { type: 'string' },
              errorType: { type: 'string' },
              error: { type: 'string' },
              codeSnippet: { type: 'string' }
            }
          }
        },
        examplesByLanguage: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              passed: { type: 'number' },
              failed: { type: 'number' }
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
  labels: ['agent', 'docs-testing', 'code-examples']
}));

// Task 5: Link Validation
export const linkValidationTask = defineTask('link-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate all internal and external links',
  agent: {
    name: 'link-validator',
    prompt: {
      role: 'documentation QA engineer specializing in link validation',
      task: 'Extract and validate all internal and external links in documentation',
      context: args,
      instructions: [
        'Extract all links from documentation: Markdown links, HTML anchors, reference links',
        'Categorize links: internal (same docs), external (external URLs), anchors (page sections)',
        'Validate internal file references exist',
        'Check internal anchor links point to existing headings',
        'Test external URLs return 200 OK status (HTTP HEAD request)',
        'Identify broken links (404, 500 errors)',
        'Detect redirected links (301, 302) - report as warnings',
        'Check for dead external domains',
        'Validate email links (mailto:)',
        'Check relative vs absolute paths consistency',
        'Report link validation results with response codes',
        'Categorize results: valid, broken, warnings, unreachable'
      ],
      outputFormat: 'JSON with totalLinks, validLinks, brokenLinks, warningLinks, linkResults (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalLinks', 'validLinks', 'brokenLinks', 'artifacts'],
      properties: {
        totalLinks: { type: 'number' },
        validLinks: { type: 'number' },
        brokenLinks: { type: 'number' },
        warningLinks: { type: 'number' },
        linkResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              link: { type: 'string' },
              type: { type: 'string', enum: ['internal', 'external', 'anchor', 'email'] },
              status: { type: 'string', enum: ['valid', 'broken', 'warning', 'unreachable'] },
              statusCode: { type: 'number' },
              message: { type: 'string' }
            }
          }
        },
        brokenLinkDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              link: { type: 'string' },
              occurrences: { type: 'number' },
              files: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'docs-testing', 'link-validation']
}));

// Task 6: Grammar Check
export const grammarCheckTask = defineTask('grammar-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check grammar, spelling, and language quality',
  agent: {
    name: 'grammar-checker',
    prompt: {
      role: 'technical editor and language quality specialist',
      task: 'Review documentation for grammar, spelling, style, and language quality issues',
      context: args,
      instructions: [
        'Check spelling errors (excluding technical terms, code, API names)',
        'Identify grammar issues: subject-verb agreement, tense consistency, fragments',
        'Check punctuation correctness',
        'Verify consistent terminology and naming conventions',
        'Check for passive voice (prefer active voice in technical docs)',
        'Identify wordiness and suggest concise alternatives',
        'Check capitalization consistency (headings, proper nouns)',
        'Verify consistent use of Oxford comma',
        'Check for common technical writing mistakes',
        'Assess readability score (Flesch-Kincaid or similar)',
        'Identify jargon that needs definition or simplification',
        'Score language quality (0-100)'
      ],
      outputFormat: 'JSON with issueCount, issues (array), readabilityScore, score (0-100), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['issueCount', 'score', 'artifacts'],
      properties: {
        issueCount: { type: 'number' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              type: { type: 'string', enum: ['spelling', 'grammar', 'style', 'punctuation'] },
              severity: { type: 'string', enum: ['error', 'warning', 'suggestion'] },
              message: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
        spellingErrors: { type: 'number' },
        grammarErrors: { type: 'number' },
        styleIssues: { type: 'number' },
        readabilityScore: { type: 'number' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs-testing', 'grammar-check']
}));

// Task 7: Accessibility Validation
export const accessibilityValidationTask = defineTask('accessibility-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate documentation accessibility (WCAG compliance)',
  agent: {
    name: 'accessibility-validator',
    prompt: {
      role: 'accessibility specialist and WCAG compliance expert',
      task: 'Validate HTML documentation against WCAG accessibility standards',
      context: args,
      instructions: [
        'Check HTML semantic structure (proper heading hierarchy, landmarks)',
        'Verify all images have alt text',
        'Check color contrast ratios (WCAG AA: 4.5:1 text, WCAG AAA: 7:1)',
        'Verify keyboard navigation support',
        'Check for ARIA labels and roles where needed',
        'Validate form labels and error messages',
        'Check link text is descriptive (avoid "click here")',
        'Verify focus indicators are visible',
        'Check for skip navigation links',
        'Validate table headers and captions',
        'Check video/audio has captions or transcripts',
        'Test with automated accessibility tools (axe, WAVE)',
        'Report WCAG compliance level (A, AA, AAA)',
        'Categorize violations by severity'
      ],
      outputFormat: 'JSON with passed, violationCount, violations (array), wcagLevel, score (0-100), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'violationCount', 'wcagLevel', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        violationCount: { type: 'number' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              rule: { type: 'string' },
              wcagCriterion: { type: 'string' },
              impact: { type: 'string', enum: ['critical', 'serious', 'moderate', 'minor'] },
              message: { type: 'string' },
              element: { type: 'string' }
            }
          }
        },
        wcagLevel: { type: 'string', enum: ['A', 'AA', 'AAA', 'fail'] },
        criticalViolations: { type: 'number' },
        seriousViolations: { type: 'number' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs-testing', 'accessibility']
}));

// Task 8: Quality Scoring
export const qualityScoringTask = defineTask('quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate comprehensive documentation quality score',
  agent: {
    name: 'quality-scorer',
    prompt: {
      role: 'documentation quality assurance lead',
      task: 'Calculate weighted overall quality score from all test results',
      context: args,
      instructions: [
        'Aggregate results from all testing phases',
        'Calculate weighted scores:',
        '  - Structure validation: 15%',
        '  - Content accuracy: 30%',
        '  - Code examples: 20%',
        '  - Link validation: 15%',
        '  - Grammar/language: 10%',
        '  - Accessibility: 10%',
        'Calculate overall quality score (0-100)',
        'Identify critical issues (severity: critical)',
        'Identify high-priority issues (severity: high/serious)',
        'Categorize issues by type and priority',
        'Determine if quality gate passed (score >= targetQuality)',
        'Count total issues across all categories',
        'Provide top recommendations for improvement',
        'Generate executive summary of quality assessment'
      ],
      outputFormat: 'JSON with overallScore (0-100), passed, componentScores (object), criticalIssues (array), highPriorityIssues (array), totalIssues, recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passed', 'componentScores', 'totalIssues', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        componentScores: {
          type: 'object',
          properties: {
            structure: { type: 'number' },
            accuracy: { type: 'number' },
            codeExamples: { type: 'number' },
            links: { type: 'number' },
            grammar: { type: 'number' },
            accessibility: { type: 'number' }
          }
        },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              issue: { type: 'string' },
              file: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        highPriorityIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              issue: { type: 'string' }
            }
          }
        },
        totalIssues: { type: 'number' },
        issueBreakdown: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs-testing', 'quality-scoring']
}));

// Task 9: Remediation Planning
export const remediationPlanningTask = defineTask('remediation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate issue remediation plan',
  agent: {
    name: 'remediation-planner',
    prompt: {
      role: 'documentation improvement strategist',
      task: 'Create prioritized remediation plan for documentation issues',
      context: args,
      instructions: [
        'Analyze all identified issues across test categories',
        'Prioritize issues: critical (blocks release), high (major impact), medium, low',
        'Group related issues for batch remediation',
        'Estimate effort for each issue (hours or story points)',
        'Create remediation tasks with clear acceptance criteria',
        'Define issue resolution steps and recommendations',
        'Identify quick wins for rapid quality improvement',
        'Suggest automation opportunities (linting, CI checks)',
        'Provide before/after examples for complex fixes',
        'Estimate total remediation effort and timeline',
        'Generate actionable remediation plan document'
      ],
      outputFormat: 'JSON with plan (object with phases), tasks (array), estimatedEffort, quickWins (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'tasks', 'estimatedEffort', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  priority: { type: 'string' },
                  tasks: { type: 'array', items: { type: 'string' } },
                  estimatedEffort: { type: 'string' }
                }
              }
            }
          }
        },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              priority: { type: 'string' },
              category: { type: 'string' },
              issue: { type: 'string' },
              resolution: { type: 'string' },
              effort: { type: 'string' },
              affectedFiles: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedEffort: { type: 'string' },
        quickWins: { type: 'array', items: { type: 'string' } },
        automationOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs-testing', 'remediation-planning']
}));

// Task 10: Test Report Generation
export const testReportGenerationTask = defineTask('test-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive documentation testing report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'technical documentation QA lead',
      task: 'Generate comprehensive, executive-ready documentation testing report',
      context: args,
      instructions: [
        'Create executive summary with key findings and quality score',
        'Include test scope: files analyzed, tests performed, coverage',
        'Present overall quality score with pass/fail status',
        'Summarize results from each testing phase:',
        '  - Structure validation results',
        '  - Content accuracy findings',
        '  - Code example test results',
        '  - Link validation summary',
        '  - Grammar check findings',
        '  - Accessibility compliance status',
        'List critical and high-priority issues',
        'Include remediation plan summary if available',
        'Add detailed appendices with full test results',
        'Provide trend data if previous reports exist',
        'Include recommendations and next steps',
        'Format as professional Markdown report with charts/tables',
        'Save comprehensive report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'docs-testing', 'report-generation']
}));

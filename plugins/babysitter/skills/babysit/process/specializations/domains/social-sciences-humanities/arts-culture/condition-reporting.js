/**
 * @process arts-culture/condition-reporting
 * @description Standardized methodology for documenting the physical state of artworks and cultural objects including terminology, photography, and digital documentation systems
 * @inputs { objectTitle: string, objectType: string, reportPurpose: string, reportingStandard: string }
 * @outputs { success: boolean, conditionReport: object, documentation: object, terminology: object, artifacts: array }
 * @recommendedSkills SK-AC-006 (conservation-assessment), SK-AC-003 (collection-documentation)
 * @recommendedAgents AG-AC-004 (conservator-agent), AG-AC-006 (registrar-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    objectTitle,
    objectType = 'painting',
    reportPurpose = 'loan',
    reportingStandard = 'AAM',
    previousReports = [],
    outputDir = 'condition-reporting-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Report Setup and Identification
  ctx.log('info', 'Setting up condition report and object identification');
  const reportSetup = await ctx.task(reportSetupTask, {
    objectTitle,
    objectType,
    reportPurpose,
    reportingStandard,
    outputDir
  });

  if (!reportSetup.success) {
    return {
      success: false,
      error: 'Report setup failed',
      details: reportSetup,
      metadata: { processId: 'arts-culture/condition-reporting', timestamp: startTime }
    };
  }

  artifacts.push(...reportSetup.artifacts);

  // Task 2: Photography Protocol
  ctx.log('info', 'Executing photography protocol');
  const photographyProtocol = await ctx.task(photographyProtocolTask, {
    objectTitle,
    objectType,
    reportPurpose,
    outputDir
  });

  artifacts.push(...photographyProtocol.artifacts);

  // Task 3: Visual Examination
  ctx.log('info', 'Conducting visual examination');
  const visualExamination = await ctx.task(visualExaminationTask, {
    objectTitle,
    objectType,
    reportingStandard,
    outputDir
  });

  artifacts.push(...visualExamination.artifacts);

  // Task 4: Condition Terminology
  ctx.log('info', 'Applying standardized condition terminology');
  const conditionTerminology = await ctx.task(conditionTerminologyTask, {
    objectType,
    visualExamination: visualExamination.findings,
    reportingStandard,
    outputDir
  });

  artifacts.push(...conditionTerminology.artifacts);

  // Task 5: Condition Mapping
  ctx.log('info', 'Creating condition mapping and diagrams');
  const conditionMapping = await ctx.task(conditionMappingTask, {
    objectTitle,
    objectType,
    visualExamination: visualExamination.findings,
    outputDir
  });

  artifacts.push(...conditionMapping.artifacts);

  // Task 6: Previous Report Comparison
  ctx.log('info', 'Comparing with previous condition reports');
  const reportComparison = await ctx.task(reportComparisonTask, {
    objectTitle,
    previousReports,
    currentFindings: visualExamination.findings,
    outputDir
  });

  artifacts.push(...reportComparison.artifacts);

  // Breakpoint: Review condition assessment
  await ctx.breakpoint({
    question: `Condition report for "${objectTitle}" complete. ${visualExamination.findings.issues.length} condition issues documented. Review and approve?`,
    title: 'Condition Report Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        objectTitle,
        objectType,
        reportPurpose,
        overallCondition: visualExamination.findings.overallCondition,
        issueCount: visualExamination.findings.issues.length
      }
    }
  });

  // Task 7: Digital Documentation
  ctx.log('info', 'Creating digital documentation package');
  const digitalDocumentation = await ctx.task(digitalDocumentationTask, {
    objectTitle,
    reportSetup,
    photographyProtocol,
    visualExamination,
    conditionMapping,
    outputDir
  });

  artifacts.push(...digitalDocumentation.artifacts);

  // Task 8: Report Compilation
  ctx.log('info', 'Compiling final condition report');
  const reportCompilation = await ctx.task(reportCompilationTask, {
    objectTitle,
    objectType,
    reportPurpose,
    reportSetup,
    photographyProtocol,
    visualExamination,
    conditionTerminology,
    conditionMapping,
    reportComparison,
    outputDir
  });

  artifacts.push(...reportCompilation.artifacts);

  // Task 9: Quality Assurance
  ctx.log('info', 'Conducting quality assurance review');
  const qualityAssurance = await ctx.task(qualityAssuranceTask, {
    objectTitle,
    reportCompilation: reportCompilation.report,
    reportingStandard,
    outputDir
  });

  artifacts.push(...qualityAssurance.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    conditionReport: {
      identification: reportSetup.identification,
      findings: visualExamination.findings,
      overallCondition: visualExamination.findings.overallCondition,
      issues: visualExamination.findings.issues,
      changes: reportComparison.changes
    },
    documentation: {
      photography: photographyProtocol.images,
      mapping: conditionMapping.maps,
      digital: digitalDocumentation.package
    },
    terminology: {
      standard: reportingStandard,
      terms: conditionTerminology.terms,
      glossary: conditionTerminology.glossary
    },
    qualityAssurance: qualityAssurance.review,
    finalReport: reportCompilation.report,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/condition-reporting',
      timestamp: startTime,
      objectTitle,
      reportPurpose
    }
  };
}

// Task 1: Report Setup
export const reportSetupTask = defineTask('report-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up condition report',
  agent: {
    name: 'registrar',
    prompt: {
      role: 'museum registrar',
      task: 'Set up condition report with object identification and metadata',
      context: args,
      instructions: [
        'Record object identification information',
        'Document accession/catalog numbers',
        'Record artist, title, date, medium, dimensions',
        'Document provenance and ownership',
        'Record report purpose and context',
        'Note examiner credentials and date',
        'Document examination conditions (lighting, etc.)',
        'Create report header and template'
      ],
      outputFormat: 'JSON with success, identification, metadata, template, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'identification', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        identification: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            artist: { type: 'string' },
            date: { type: 'string' },
            medium: { type: 'string' },
            dimensions: { type: 'object' },
            accessionNumber: { type: 'string' }
          }
        },
        metadata: { type: 'object' },
        template: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'condition-reporting', 'setup', 'identification']
}));

// Task 2: Photography Protocol
export const photographyProtocolTask = defineTask('photography-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute photography protocol',
  agent: {
    name: 'conservation-photographer',
    prompt: {
      role: 'conservation photographer',
      task: 'Execute comprehensive condition photography protocol',
      context: args,
      instructions: [
        'Set up standardized photography environment',
        'Capture overall front view with color chart',
        'Document overall back/reverse',
        'Capture raking light views',
        'Document condition issues with details',
        'Photograph frame and support elements',
        'Capture UV fluorescence if needed',
        'Create photography log with metadata'
      ],
      outputFormat: 'JSON with images, protocol, log, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['images', 'artifacts'],
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        protocol: { type: 'object' },
        log: { type: 'array' },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'condition-reporting', 'photography', 'documentation']
}));

// Task 3: Visual Examination
export const visualExaminationTask = defineTask('visual-examination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct visual examination',
  agent: {
    name: 'condition-examiner',
    prompt: {
      role: 'condition examiner',
      task: 'Conduct systematic visual examination of artwork',
      context: args,
      instructions: [
        'Examine support/substrate condition',
        'Assess ground/preparation layer',
        'Examine paint/media layer condition',
        'Document surface coatings and varnish',
        'Assess frame and mounting condition',
        'Document accretions and foreign material',
        'Note previous restorations',
        'Rate overall condition'
      ],
      outputFormat: 'JSON with findings, issues, overallCondition, notes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: {
          type: 'object',
          properties: {
            support: { type: 'object' },
            mediaLayer: { type: 'object' },
            surface: { type: 'object' },
            frame: { type: 'object' },
            overallCondition: { type: 'string' },
            issues: { type: 'array' }
          }
        },
        notes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'condition-reporting', 'examination', 'visual']
}));

// Task 4: Condition Terminology
export const conditionTerminologyTask = defineTask('condition-terminology', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply condition terminology',
  agent: {
    name: 'terminology-specialist',
    prompt: {
      role: 'conservation terminology specialist',
      task: 'Apply standardized condition terminology to findings',
      context: args,
      instructions: [
        'Apply AAM/ICOM condition terminology',
        'Use object-type specific vocabulary',
        'Describe damage types accurately',
        'Quantify condition issues where possible',
        'Use consistent severity descriptors',
        'Apply location terminology',
        'Create glossary of terms used',
        'Ensure terminology consistency'
      ],
      outputFormat: 'JSON with terms, descriptions, glossary, standards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['terms', 'glossary', 'artifacts'],
      properties: {
        terms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              definition: { type: 'string' },
              application: { type: 'string' }
            }
          }
        },
        descriptions: { type: 'array' },
        glossary: { type: 'object' },
        standards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'condition-reporting', 'terminology', 'standards']
}));

// Task 5: Condition Mapping
export const conditionMappingTask = defineTask('condition-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create condition mapping',
  agent: {
    name: 'mapping-specialist',
    prompt: {
      role: 'condition mapping specialist',
      task: 'Create condition maps and diagrams',
      context: args,
      instructions: [
        'Create object outline diagram',
        'Map condition issues by location',
        'Use standardized symbols and legends',
        'Indicate severity and extent',
        'Create layer-specific maps if needed',
        'Document mapping methodology',
        'Create digital and print versions',
        'Link maps to detailed descriptions'
      ],
      outputFormat: 'JSON with maps, legend, methodology, links, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maps', 'artifacts'],
      properties: {
        maps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        legend: { type: 'object' },
        methodology: { type: 'string' },
        links: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'condition-reporting', 'mapping', 'diagrams']
}));

// Task 6: Report Comparison
export const reportComparisonTask = defineTask('report-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare with previous reports',
  agent: {
    name: 'comparison-analyst',
    prompt: {
      role: 'condition comparison analyst',
      task: 'Compare current condition with previous reports',
      context: args,
      instructions: [
        'Review previous condition reports',
        'Identify changes since last examination',
        'Document new damage or deterioration',
        'Note improvements or treatments',
        'Assess stability over time',
        'Flag concerning trends',
        'Document comparison methodology',
        'Recommend follow-up if needed'
      ],
      outputFormat: 'JSON with changes, comparison, trends, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['changes', 'artifacts'],
      properties: {
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              previousState: { type: 'string' },
              currentState: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        comparison: { type: 'object' },
        trends: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'condition-reporting', 'comparison', 'analysis']
}));

// Task 7: Digital Documentation
export const digitalDocumentationTask = defineTask('digital-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create digital documentation',
  agent: {
    name: 'digital-documentation-specialist',
    prompt: {
      role: 'digital documentation specialist',
      task: 'Create comprehensive digital documentation package',
      context: args,
      instructions: [
        'Organize digital files systematically',
        'Apply metadata standards',
        'Create linked documentation package',
        'Generate database-compatible records',
        'Create web-accessible versions',
        'Plan long-term digital preservation',
        'Generate PDF documentation',
        'Create archive package'
      ],
      outputFormat: 'JSON with package, files, metadata, preservation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['package', 'artifacts'],
      properties: {
        package: {
          type: 'object',
          properties: {
            files: { type: 'array' },
            structure: { type: 'object' },
            formats: { type: 'array' }
          }
        },
        files: { type: 'array' },
        metadata: { type: 'object' },
        preservation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'condition-reporting', 'digital', 'documentation']
}));

// Task 8: Report Compilation
export const reportCompilationTask = defineTask('report-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile final report',
  agent: {
    name: 'report-compiler',
    prompt: {
      role: 'condition report compiler',
      task: 'Compile comprehensive final condition report',
      context: args,
      instructions: [
        'Compile all report sections',
        'Integrate photography',
        'Include condition maps',
        'Add terminology glossary',
        'Include comparison summary',
        'Add recommendations section',
        'Format according to standards',
        'Generate multiple output formats'
      ],
      outputFormat: 'JSON with report, sections, formats, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            sections: { type: 'array' },
            recommendations: { type: 'array' }
          }
        },
        sections: { type: 'array' },
        formats: { type: 'array' },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'condition-reporting', 'compilation', 'final']
}));

// Task 9: Quality Assurance
export const qualityAssuranceTask = defineTask('quality-assurance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct quality assurance',
  agent: {
    name: 'qa-specialist',
    prompt: {
      role: 'documentation quality specialist',
      task: 'Conduct quality assurance review of condition report',
      context: args,
      instructions: [
        'Review report completeness',
        'Verify terminology accuracy',
        'Check photography quality',
        'Validate condition maps',
        'Review consistency throughout',
        'Verify standard compliance',
        'Check digital file integrity',
        'Approve for release'
      ],
      outputFormat: 'JSON with review, checklist, issues, approval, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['review', 'artifacts'],
      properties: {
        review: {
          type: 'object',
          properties: {
            completeness: { type: 'boolean' },
            accuracy: { type: 'boolean' },
            compliance: { type: 'boolean' },
            approved: { type: 'boolean' }
          }
        },
        checklist: { type: 'array' },
        issues: { type: 'array' },
        approval: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'condition-reporting', 'quality', 'assurance']
}));

/**
 * @process marketing/brand-guidelines-creation
 * @description Develop comprehensive brand standards documentation including visual identity, voice and tone, messaging hierarchy, and usage rules across all touchpoints.
 * @inputs { brandName: string, brandStrategy: object, visualAssets: array, existingGuidelines: object, touchpoints: array, stakeholders: array }
 * @outputs { success: boolean, guidelinesDocument: string, visualIdentity: object, voiceAndTone: object, usageRules: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    brandName = 'Brand',
    brandStrategy = {},
    visualAssets = [],
    existingGuidelines = {},
    touchpoints = [],
    stakeholders = [],
    outputDir = 'brand-guidelines-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Brand Guidelines Creation for ${brandName}`);

  // ============================================================================
  // PHASE 1: BRAND FOUNDATION DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Documenting brand foundation elements');
  const brandFoundation = await ctx.task(brandFoundationDocumentationTask, {
    brandName,
    brandStrategy,
    existingGuidelines,
    outputDir
  });

  artifacts.push(...brandFoundation.artifacts);

  // ============================================================================
  // PHASE 2: VISUAL IDENTITY SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing visual identity system');
  const visualIdentity = await ctx.task(visualIdentitySystemTask, {
    brandName,
    brandStrategy,
    visualAssets,
    brandFoundation,
    outputDir
  });

  artifacts.push(...visualIdentity.artifacts);

  // ============================================================================
  // PHASE 3: VOICE AND TONE GUIDELINES
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating voice and tone guidelines');
  const voiceAndTone = await ctx.task(voiceAndToneGuidelinesTask, {
    brandName,
    brandStrategy,
    brandFoundation,
    touchpoints,
    outputDir
  });

  artifacts.push(...voiceAndTone.artifacts);

  // ============================================================================
  // PHASE 4: MESSAGING HIERARCHY
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing messaging hierarchy');
  const messagingHierarchy = await ctx.task(messagingHierarchyTask, {
    brandName,
    brandStrategy,
    brandFoundation,
    voiceAndTone,
    outputDir
  });

  artifacts.push(...messagingHierarchy.artifacts);

  // ============================================================================
  // PHASE 5: TOUCHPOINT APPLICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Defining touchpoint applications');
  const touchpointApplications = await ctx.task(touchpointApplicationsTask, {
    brandName,
    visualIdentity,
    voiceAndTone,
    messagingHierarchy,
    touchpoints,
    outputDir
  });

  artifacts.push(...touchpointApplications.artifacts);

  // ============================================================================
  // PHASE 6: USAGE RULES AND COMPLIANCE
  // ============================================================================

  ctx.log('info', 'Phase 6: Establishing usage rules');
  const usageRules = await ctx.task(usageRulesTask, {
    brandName,
    visualIdentity,
    voiceAndTone,
    touchpointApplications,
    stakeholders,
    outputDir
  });

  artifacts.push(...usageRules.artifacts);

  // ============================================================================
  // PHASE 7: COMPREHENSIVE GUIDELINES DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating comprehensive guidelines document');
  const guidelinesDocument = await ctx.task(guidelinesDocumentGenerationTask, {
    brandName,
    brandFoundation,
    visualIdentity,
    voiceAndTone,
    messagingHierarchy,
    touchpointApplications,
    usageRules,
    outputDir
  });

  artifacts.push(...guidelinesDocument.artifacts);

  // ============================================================================
  // PHASE 8: GUIDELINES QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing guidelines quality');
  const qualityAssessment = await ctx.task(guidelinesQualityAssessmentTask, {
    brandName,
    brandFoundation,
    visualIdentity,
    voiceAndTone,
    messagingHierarchy,
    touchpointApplications,
    usageRules,
    guidelinesDocument,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const guidelinesScore = qualityAssessment.overallScore;
  const qualityMet = guidelinesScore >= 80;

  // Breakpoint: Review brand guidelines
  await ctx.breakpoint({
    question: `Brand guidelines complete. Quality score: ${guidelinesScore}/100. ${qualityMet ? 'Guidelines meet quality standards!' : 'Guidelines may need refinement.'} Review and approve?`,
    title: 'Brand Guidelines Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        guidelinesScore,
        qualityMet,
        brandName,
        totalArtifacts: artifacts.length,
        touchpointsCovered: touchpointApplications.applications?.length || 0,
        colorPalette: visualIdentity.colorPalette?.primary || 'N/A',
        voiceAttributes: voiceAndTone.voiceAttributes?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    brandName,
    guidelinesScore,
    qualityMet,
    guidelinesDocument: guidelinesDocument.documentPath,
    visualIdentity: {
      logo: visualIdentity.logo,
      colorPalette: visualIdentity.colorPalette,
      typography: visualIdentity.typography,
      imagery: visualIdentity.imagery
    },
    voiceAndTone: {
      voiceAttributes: voiceAndTone.voiceAttributes,
      toneVariations: voiceAndTone.toneVariations,
      writingPrinciples: voiceAndTone.writingPrinciples
    },
    messagingHierarchy: {
      masterMessage: messagingHierarchy.masterMessage,
      supportingMessages: messagingHierarchy.supportingMessages,
      proofPoints: messagingHierarchy.proofPoints
    },
    usageRules: {
      doAndDont: usageRules.doAndDont,
      approvalProcess: usageRules.approvalProcess,
      compliance: usageRules.compliance
    },
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/brand-guidelines-creation',
      timestamp: startTime,
      brandName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Brand Foundation Documentation
export const brandFoundationDocumentationTask = defineTask('brand-foundation-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document brand foundation elements',
  agent: {
    name: 'brand-foundation-writer',
    prompt: {
      role: 'brand strategist and documentation specialist',
      task: 'Document the foundational brand elements that underpin all brand expressions',
      context: args,
      instructions: [
        'Document brand purpose, mission, and vision',
        'Articulate brand values and principles',
        'Define brand personality traits',
        'Document brand positioning statement',
        'Capture brand story and heritage',
        'Define brand promise to customers',
        'Document target audience profiles',
        'Articulate brand differentiation',
        'Create brand foundation summary document'
      ],
      outputFormat: 'JSON with purpose (string), mission (string), vision (string), values (array), personality (array), positioning (string), story (string), promise (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['purpose', 'mission', 'values', 'personality', 'artifacts'],
      properties: {
        purpose: { type: 'string' },
        mission: { type: 'string' },
        vision: { type: 'string' },
        values: { type: 'array', items: { type: 'string' } },
        personality: { type: 'array', items: { type: 'string' } },
        positioning: { type: 'string' },
        story: { type: 'string' },
        promise: { type: 'string' },
        targetAudience: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-guidelines', 'foundation']
}));

// Task 2: Visual Identity System
export const visualIdentitySystemTask = defineTask('visual-identity-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop visual identity system',
  agent: {
    name: 'visual-identity-designer',
    prompt: {
      role: 'brand identity designer and visual systems expert',
      task: 'Develop comprehensive visual identity system documentation',
      context: args,
      instructions: [
        'Document logo system including primary, secondary, and icon versions',
        'Define logo clear space, minimum sizes, and placement rules',
        'Create comprehensive color palette with primary, secondary, and accent colors',
        'Document color specifications (RGB, CMYK, HEX, Pantone)',
        'Define typography system with primary and secondary typefaces',
        'Document type hierarchy and usage rules',
        'Define imagery style and photography guidelines',
        'Document iconography and graphic elements',
        'Create layout and grid system guidelines',
        'Generate visual identity documentation'
      ],
      outputFormat: 'JSON with logo (object), colorPalette (object), typography (object), imagery (object), iconography (object), layoutSystem (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['logo', 'colorPalette', 'typography', 'artifacts'],
      properties: {
        logo: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            variations: { type: 'array', items: { type: 'string' } },
            clearSpace: { type: 'string' },
            minimumSize: { type: 'string' },
            placement: { type: 'object' }
          }
        },
        colorPalette: {
          type: 'object',
          properties: {
            primary: { type: 'array' },
            secondary: { type: 'array' },
            accent: { type: 'array' },
            neutral: { type: 'array' }
          }
        },
        typography: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            secondary: { type: 'string' },
            hierarchy: { type: 'array' }
          }
        },
        imagery: {
          type: 'object',
          properties: {
            style: { type: 'string' },
            guidelines: { type: 'array', items: { type: 'string' } }
          }
        },
        iconography: { type: 'object' },
        layoutSystem: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-guidelines', 'visual-identity']
}));

// Task 3: Voice and Tone Guidelines
export const voiceAndToneGuidelinesTask = defineTask('voice-and-tone-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create voice and tone guidelines',
  agent: {
    name: 'voice-tone-strategist',
    prompt: {
      role: 'brand communications strategist and copywriter',
      task: 'Develop comprehensive voice and tone guidelines for consistent brand communication',
      context: args,
      instructions: [
        'Define brand voice attributes (e.g., confident, approachable, expert)',
        'Create voice dimension spectrum (formal-casual, serious-playful)',
        'Document tone variations for different contexts and emotions',
        'Define writing principles and style preferences',
        'Create vocabulary guidelines (words to use vs avoid)',
        'Document grammar and punctuation preferences',
        'Provide before/after examples for different scenarios',
        'Create tone guidance for different touchpoints',
        'Document cultural and regional considerations',
        'Generate voice and tone guide'
      ],
      outputFormat: 'JSON with voiceAttributes (array), toneVariations (array), writingPrinciples (array), vocabulary (object), grammarPreferences (object), examples (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['voiceAttributes', 'toneVariations', 'writingPrinciples', 'artifacts'],
      properties: {
        voiceAttributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attribute: { type: 'string' },
              description: { type: 'string' },
              doExample: { type: 'string' },
              dontExample: { type: 'string' }
            }
          }
        },
        toneVariations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              context: { type: 'string' },
              tone: { type: 'string' },
              guidelines: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        writingPrinciples: { type: 'array', items: { type: 'string' } },
        vocabulary: {
          type: 'object',
          properties: {
            preferred: { type: 'array', items: { type: 'string' } },
            avoid: { type: 'array', items: { type: 'string' } }
          }
        },
        grammarPreferences: { type: 'object' },
        examples: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-guidelines', 'voice-tone']
}));

// Task 4: Messaging Hierarchy
export const messagingHierarchyTask = defineTask('messaging-hierarchy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop messaging hierarchy',
  agent: {
    name: 'messaging-strategist',
    prompt: {
      role: 'brand messaging strategist and copywriter',
      task: 'Develop structured messaging hierarchy for consistent brand communication',
      context: args,
      instructions: [
        'Create master brand message/tagline',
        'Develop supporting message pillars',
        'Create proof points for each message pillar',
        'Define audience-specific messaging variations',
        'Create product/service messaging framework',
        'Develop boilerplate copy at various lengths',
        'Create elevator pitch versions',
        'Define call-to-action guidelines',
        'Document messaging do\'s and don\'ts',
        'Generate messaging hierarchy document'
      ],
      outputFormat: 'JSON with masterMessage (string), supportingMessages (array), proofPoints (array), audienceMessaging (object), boilerplates (object), elevatorPitches (array), ctaGuidelines (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['masterMessage', 'supportingMessages', 'proofPoints', 'artifacts'],
      properties: {
        masterMessage: { type: 'string' },
        tagline: { type: 'string' },
        supportingMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pillar: { type: 'string' },
              message: { type: 'string' },
              proofPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        proofPoints: { type: 'array', items: { type: 'string' } },
        audienceMessaging: { type: 'object' },
        boilerplates: {
          type: 'object',
          properties: {
            short: { type: 'string' },
            medium: { type: 'string' },
            long: { type: 'string' }
          }
        },
        elevatorPitches: { type: 'array', items: { type: 'string' } },
        ctaGuidelines: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-guidelines', 'messaging']
}));

// Task 5: Touchpoint Applications
export const touchpointApplicationsTask = defineTask('touchpoint-applications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define touchpoint applications',
  agent: {
    name: 'touchpoint-specialist',
    prompt: {
      role: 'brand experience designer and touchpoint strategist',
      task: 'Define brand application guidelines for all customer touchpoints',
      context: args,
      instructions: [
        'Define digital touchpoint guidelines (website, app, email)',
        'Create print collateral specifications (business cards, letterhead, brochures)',
        'Document social media application guidelines',
        'Define advertising specifications across formats',
        'Create presentation and document templates',
        'Define environmental/signage applications',
        'Document packaging guidelines if applicable',
        'Create merchandise and promotional item guidelines',
        'Define partner co-branding rules',
        'Generate touchpoint application guide'
      ],
      outputFormat: 'JSON with applications (array), digitalGuidelines (object), printSpecs (object), socialMedia (object), advertising (object), templates (array), environmental (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applications', 'digitalGuidelines', 'printSpecs', 'artifacts'],
      properties: {
        applications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              touchpoint: { type: 'string' },
              category: { type: 'string' },
              guidelines: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        digitalGuidelines: {
          type: 'object',
          properties: {
            website: { type: 'object' },
            email: { type: 'object' },
            app: { type: 'object' }
          }
        },
        printSpecs: {
          type: 'object',
          properties: {
            businessCards: { type: 'object' },
            letterhead: { type: 'object' },
            brochures: { type: 'object' }
          }
        },
        socialMedia: { type: 'object' },
        advertising: { type: 'object' },
        templates: { type: 'array', items: { type: 'string' } },
        environmental: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-guidelines', 'touchpoints']
}));

// Task 6: Usage Rules
export const usageRulesTask = defineTask('usage-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish usage rules',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'brand compliance manager and guidelines specialist',
      task: 'Establish comprehensive brand usage rules and compliance guidelines',
      context: args,
      instructions: [
        'Create comprehensive do\'s and don\'ts for brand elements',
        'Document logo misuse examples to avoid',
        'Define color usage restrictions',
        'Create typography usage rules',
        'Document photography and imagery restrictions',
        'Define approval processes for brand usage',
        'Create brand compliance checklist',
        'Document trademark and legal usage requirements',
        'Define third-party and partner usage guidelines',
        'Generate usage rules documentation'
      ],
      outputFormat: 'JSON with doAndDont (object), logoMisuse (array), colorRestrictions (array), approvalProcess (object), compliance (object), legalRequirements (array), partnerGuidelines (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['doAndDont', 'approvalProcess', 'compliance', 'artifacts'],
      properties: {
        doAndDont: {
          type: 'object',
          properties: {
            logo: { type: 'object' },
            color: { type: 'object' },
            typography: { type: 'object' },
            imagery: { type: 'object' }
          }
        },
        logoMisuse: { type: 'array', items: { type: 'string' } },
        colorRestrictions: { type: 'array', items: { type: 'string' } },
        approvalProcess: {
          type: 'object',
          properties: {
            levels: { type: 'array' },
            workflow: { type: 'string' },
            contacts: { type: 'array' }
          }
        },
        compliance: {
          type: 'object',
          properties: {
            checklist: { type: 'array', items: { type: 'string' } },
            auditProcess: { type: 'string' },
            enforcement: { type: 'string' }
          }
        },
        legalRequirements: { type: 'array', items: { type: 'string' } },
        partnerGuidelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-guidelines', 'usage-rules']
}));

// Task 7: Guidelines Document Generation
export const guidelinesDocumentGenerationTask = defineTask('guidelines-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive guidelines document',
  agent: {
    name: 'guidelines-writer',
    prompt: {
      role: 'senior brand manager and documentation specialist',
      task: 'Generate comprehensive, user-friendly brand guidelines document',
      context: args,
      instructions: [
        'Create executive introduction and overview',
        'Organize content logically for different user needs',
        'Include clear navigation and table of contents',
        'Add visual examples throughout',
        'Create quick reference guides for common tasks',
        'Include downloadable asset references',
        'Add contact information for brand questions',
        'Create version history and update notes section',
        'Format as professional, accessible document',
        'Generate comprehensive brand guidelines document'
      ],
      outputFormat: 'JSON with documentPath (string), tableOfContents (array), sections (array), quickReferenceGuides (array), assetReferences (array), version (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'tableOfContents', 'sections', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              pages: { type: 'number' },
              subsections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quickReferenceGuides: { type: 'array', items: { type: 'string' } },
        assetReferences: { type: 'array', items: { type: 'string' } },
        version: { type: 'string' },
        lastUpdated: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-guidelines', 'documentation']
}));

// Task 8: Guidelines Quality Assessment
export const guidelinesQualityAssessmentTask = defineTask('guidelines-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess guidelines quality',
  agent: {
    name: 'guidelines-validator',
    prompt: {
      role: 'chief brand officer and guidelines expert',
      task: 'Assess overall brand guidelines quality, completeness, and usability',
      context: args,
      instructions: [
        'Evaluate brand foundation completeness (weight: 10%)',
        'Assess visual identity system comprehensiveness (weight: 25%)',
        'Review voice and tone guidelines clarity (weight: 15%)',
        'Evaluate messaging hierarchy usefulness (weight: 15%)',
        'Assess touchpoint coverage (weight: 15%)',
        'Review usage rules clarity (weight: 10%)',
        'Evaluate document usability and accessibility (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and areas for improvement',
        'Provide specific recommendations'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), gaps (array), recommendations (array), strengths (array), readinessLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            brandFoundation: { type: 'number' },
            visualIdentity: { type: 'number' },
            voiceAndTone: { type: 'number' },
            messagingHierarchy: { type: 'number' },
            touchpointCoverage: { type: 'number' },
            usageRules: { type: 'number' },
            documentUsability: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['ready', 'minor-revisions', 'major-revisions'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-guidelines', 'quality-assessment']
}));

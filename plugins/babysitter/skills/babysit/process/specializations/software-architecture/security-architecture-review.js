/**
 * @process specializations/software-architecture/security-architecture-review
 * @description Security-focused architecture review including threat modeling, security pattern validation, and vulnerability assessment
 * @specialization Software Architecture
 * @category Operational Architecture
 * @inputs { system: string, architecture: object, securityRequirements?: object, complianceStandards?: string[] }
 * @outputs { success: boolean, threatModel: object, securityRisks: object[], remediationPlan: object[], complianceStatus: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system,
    architecture,
    securityRequirements = {},
    complianceStandards = []
  } = inputs;

  const reviewResults = {
    system,
    startTime: ctx.now(),
    phases: []
  };

  // Phase 1: Create Threat Model
  ctx.log('Phase 1: Creating threat model using STRIDE methodology');
  const threatModel = await ctx.task(createThreatModelTask, {
    system,
    architecture,
    securityRequirements
  });
  reviewResults.phases.push({ phase: 'threat-modeling', completed: true, result: threatModel });

  // Breakpoint: Review threat model before proceeding
  await ctx.breakpoint({
    question: 'Review the threat model. Does it accurately represent the security landscape?',
    title: 'Threat Model Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/threat-model.json`, format: 'json' },
        { path: `artifacts/threat-model-diagram.md`, format: 'markdown' }
      ]
    }
  });

  // Phase 2: Identify Attack Surfaces (in parallel with Phase 3)
  ctx.log('Phase 2-3: Analyzing attack surfaces and reviewing security patterns in parallel');
  const [attackSurfaces, securityPatterns] = await ctx.parallel.all([
    ctx.task(identifyAttackSurfacesTask, { system, architecture, threatModel }),
    ctx.task(reviewSecurityPatternsTask, { system, architecture, threatModel })
  ]);
  reviewResults.phases.push({ phase: 'attack-surface-analysis', completed: true, result: attackSurfaces });
  reviewResults.phases.push({ phase: 'security-patterns-review', completed: true, result: securityPatterns });

  // Phase 4-5: Authentication/Authorization and Data Protection (parallel)
  ctx.log('Phase 4-5: Assessing authentication/authorization and data protection in parallel');
  const [authAssessment, dataProtection] = await ctx.parallel.all([
    ctx.task(assessAuthenticationAuthorizationTask, { system, architecture, threatModel }),
    ctx.task(reviewDataProtectionTask, { system, architecture, securityRequirements })
  ]);
  reviewResults.phases.push({ phase: 'auth-assessment', completed: true, result: authAssessment });
  reviewResults.phases.push({ phase: 'data-protection-review', completed: true, result: dataProtection });

  // Phase 6: Check Compliance Requirements
  ctx.log('Phase 6: Checking compliance requirements');
  const complianceCheck = await ctx.task(checkComplianceTask, {
    system,
    architecture,
    complianceStandards,
    threatModel,
    authAssessment,
    dataProtection
  });
  reviewResults.phases.push({ phase: 'compliance-check', completed: true, result: complianceCheck });

  // Breakpoint: Review findings before security testing
  await ctx.breakpoint({
    question: 'Review security findings. Proceed with security testing phase?',
    title: 'Security Findings Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/security-findings.json`, format: 'json' },
        { path: `artifacts/security-findings-report.md`, format: 'markdown' }
      ]
    }
  });

  // Phase 7: Perform Security Testing
  ctx.log('Phase 7: Performing security testing');
  const securityTests = await ctx.task(performSecurityTestingTask, {
    system,
    architecture,
    threatModel,
    attackSurfaces
  });
  reviewResults.phases.push({ phase: 'security-testing', completed: true, result: securityTests });

  // Phase 8: Generate Comprehensive Risk Register and Remediation Plan
  ctx.log('Phase 8: Generating risk register and remediation plan');
  const riskRegisterAndPlan = await ctx.task(generateRiskRegisterTask, {
    system,
    threatModel,
    attackSurfaces,
    securityPatterns,
    authAssessment,
    dataProtection,
    complianceCheck,
    securityTests
  });
  reviewResults.phases.push({ phase: 'risk-remediation-planning', completed: true, result: riskRegisterAndPlan });

  // Phase 9: Create Final Report
  ctx.log('Phase 9: Creating final security architecture review report');
  const finalReport = await ctx.task(createFinalReportTask, {
    system,
    reviewResults,
    riskRegisterAndPlan
  });

  // Final breakpoint for approval
  await ctx.breakpoint({
    question: 'Review the final security architecture report. Approve findings and remediation plan?',
    title: 'Final Security Review Approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: `artifacts/security-architecture-review-report.md`, format: 'markdown' },
        { path: `artifacts/risk-register.json`, format: 'json' },
        { path: `artifacts/remediation-plan.json`, format: 'json' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - reviewResults.startTime;

  return {
    success: true,
    processSlug: 'security-architecture-review',
    category: 'operational-architecture',
    system,
    threatModel: threatModel,
    securityRisks: riskRegisterAndPlan.riskRegister,
    remediationPlan: riskRegisterAndPlan.remediationPlan,
    complianceStatus: complianceCheck.status,
    attackSurfaces: attackSurfaces.surfaces,
    securityPatterns: securityPatterns.patterns,
    authAssessment: authAssessment,
    dataProtection: dataProtection,
    securityTests: securityTests.results,
    finalReport: finalReport,
    duration,
    metadata: {
      processId: 'specializations/software-architecture/security-architecture-review',
      specializationSlug: 'software-architecture',
      timestamp: endTime,
      phaseCount: reviewResults.phases.length
    }
  };
}

// Task Definitions

export const createThreatModelTask = defineTask('create-threat-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create threat model using STRIDE methodology',
  agent: {
    name: 'threat-modeler',
    prompt: {
      role: 'security architect specializing in threat modeling',
      task: 'Create a comprehensive threat model for the system using STRIDE methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)',
      context: args,
      instructions: [
        'Analyze the system architecture and identify all components, data flows, and trust boundaries',
        'Apply STRIDE methodology to identify threats for each component and data flow',
        'Categorize threats by STRIDE categories',
        'Assess threat likelihood (Low, Medium, High) and impact (Low, Medium, High, Critical)',
        'Identify trust boundaries and security zones',
        'Create a data flow diagram highlighting security-critical paths',
        'Document assumptions and out-of-scope items',
        'Provide mitigation recommendations for each threat'
      ],
      outputFormat: 'JSON with STRIDE threat catalog, risk ratings, trust boundaries, data flow diagram, and mitigation recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['threats', 'trustBoundaries', 'dataFlows'],
      properties: {
        threats: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'category', 'description', 'likelihood', 'impact', 'riskLevel'],
            properties: {
              id: { type: 'string' },
              category: { type: 'string', enum: ['Spoofing', 'Tampering', 'Repudiation', 'Information Disclosure', 'Denial of Service', 'Elevation of Privilege'] },
              description: { type: 'string' },
              affectedComponent: { type: 'string' },
              likelihood: { type: 'string', enum: ['Low', 'Medium', 'High'] },
              impact: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              riskLevel: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              mitigationRecommendation: { type: 'string' }
            }
          }
        },
        trustBoundaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dataFlows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              dataType: { type: 'string' },
              protocol: { type: 'string' },
              securityControls: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        diagram: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security', 'threat-modeling', 'stride']
}));

export const identifyAttackSurfacesTask = defineTask('identify-attack-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and analyze attack surfaces',
  agent: {
    name: 'attack-surface-analyzer',
    prompt: {
      role: 'penetration testing specialist',
      task: 'Identify all attack surfaces in the system architecture',
      context: args,
      instructions: [
        'Identify all external-facing components (APIs, web interfaces, mobile apps)',
        'Analyze network attack surfaces (open ports, protocols, endpoints)',
        'Identify human attack surfaces (user interfaces, social engineering vectors)',
        'Analyze software attack surfaces (third-party dependencies, libraries)',
        'Identify physical attack surfaces (if applicable)',
        'Map attack surface to threat model',
        'Assess exposure level for each surface (Public, Partner, Internal, Restricted)',
        'Recommend attack surface reduction strategies'
      ],
      outputFormat: 'JSON with categorized attack surfaces, exposure levels, and reduction recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['surfaces'],
      properties: {
        surfaces: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'type', 'component', 'exposureLevel', 'risks'],
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['Network', 'Human', 'Software', 'Physical'] },
              component: { type: 'string' },
              description: { type: 'string' },
              exposureLevel: { type: 'string', enum: ['Public', 'Partner', 'Internal', 'Restricted'] },
              risks: { type: 'array', items: { type: 'string' } },
              reductionStrategies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalSurfaces: { type: 'number' },
            byType: { type: 'object' },
            byExposure: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security', 'attack-surface']
}));

export const reviewSecurityPatternsTask = defineTask('review-security-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review security patterns and best practices',
  agent: {
    name: 'security-pattern-reviewer',
    prompt: {
      role: 'security architecture expert',
      task: 'Review the architecture for security patterns and best practices',
      context: args,
      instructions: [
        'Identify security patterns in use (Defense in Depth, Least Privilege, Fail Secure, etc.)',
        'Assess implementation of security patterns',
        'Identify missing security patterns',
        'Review input validation and sanitization strategies',
        'Check for secure coding practices',
        'Assess error handling and logging from security perspective',
        'Review security configuration management',
        'Identify opportunities to apply additional security patterns',
        'Provide specific recommendations for pattern improvements'
      ],
      outputFormat: 'JSON with patterns identified, gaps, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'gaps', 'recommendations'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'status', 'assessment'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string', enum: ['Implemented', 'Partially Implemented', 'Not Implemented', 'Not Applicable'] },
              assessment: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              severity: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              recommendation: { type: 'string' },
              benefit: { type: 'string' }
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
  labels: ['agent', 'security', 'patterns']
}));

export const assessAuthenticationAuthorizationTask = defineTask('assess-authentication-authorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess authentication and authorization mechanisms',
  agent: {
    name: 'auth-specialist',
    prompt: {
      role: 'identity and access management specialist',
      task: 'Comprehensively assess authentication and authorization architecture',
      context: args,
      instructions: [
        'Review authentication mechanisms (passwords, MFA, biometrics, SSO, OAuth/OIDC)',
        'Assess credential storage and password policies',
        'Evaluate session management (timeout, renewal, secure tokens)',
        'Review authorization model (RBAC, ABAC, claims-based)',
        'Assess privilege escalation risks',
        'Review API authentication (API keys, JWT, OAuth tokens)',
        'Check for proper authentication on all endpoints',
        'Evaluate identity federation and SSO implementation',
        'Assess least privilege principle adherence',
        'Review audit logging for authentication/authorization events',
        'Identify vulnerabilities (broken authentication, broken access control)',
        'Provide remediation recommendations prioritized by risk'
      ],
      outputFormat: 'JSON with authentication/authorization assessment, vulnerabilities, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['authentication', 'authorization', 'vulnerabilities', 'recommendations'],
      properties: {
        authentication: {
          type: 'object',
          required: ['mechanisms', 'strengths', 'weaknesses'],
          properties: {
            mechanisms: { type: 'array', items: { type: 'string' } },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            mfaStatus: { type: 'string' },
            sessionManagement: { type: 'object' }
          }
        },
        authorization: {
          type: 'object',
          required: ['model', 'strengths', 'weaknesses'],
          properties: {
            model: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            leastPrivilegeAdherence: { type: 'string' }
          }
        },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'type', 'severity', 'description'],
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['Broken Authentication', 'Broken Access Control', 'Privilege Escalation', 'Session Fixation', 'Other'] },
              severity: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              description: { type: 'string' },
              affectedComponents: { type: 'array', items: { type: 'string' } },
              exploitScenario: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              recommendation: { type: 'string' },
              rationale: { type: 'string' }
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
  labels: ['agent', 'security', 'authentication', 'authorization']
}));

export const reviewDataProtectionTask = defineTask('review-data-protection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review data protection and encryption',
  agent: {
    name: 'data-protection-specialist',
    prompt: {
      role: 'data security and privacy expert',
      task: 'Review data protection mechanisms across the system',
      context: args,
      instructions: [
        'Identify sensitive data types (PII, PHI, PCI, credentials, secrets)',
        'Review data classification scheme',
        'Assess encryption at rest (databases, file systems, backups)',
        'Assess encryption in transit (TLS versions, cipher suites, certificate management)',
        'Review key management practices (generation, storage, rotation)',
        'Assess data masking and tokenization for non-production environments',
        'Review data retention and disposal policies',
        'Check for hardcoded secrets or credentials',
        'Assess database security (access controls, encryption, auditing)',
        'Review API data exposure (sensitive data in responses)',
        'Check privacy controls (consent, data minimization, right to erasure)',
        'Identify data protection gaps and vulnerabilities',
        'Provide prioritized recommendations'
      ],
      outputFormat: 'JSON with data inventory, protection assessment, vulnerabilities, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['dataInventory', 'encryptionAtRest', 'encryptionInTransit', 'vulnerabilities', 'recommendations'],
      properties: {
        dataInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataType: { type: 'string' },
              classification: { type: 'string', enum: ['Public', 'Internal', 'Confidential', 'Restricted'] },
              storage: { type: 'string' },
              protectionMechanisms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        encryptionAtRest: {
          type: 'object',
          required: ['status', 'mechanisms'],
          properties: {
            status: { type: 'string', enum: ['Comprehensive', 'Partial', 'Minimal', 'None'] },
            mechanisms: { type: 'array', items: { type: 'string' } },
            keyManagement: { type: 'object' },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        },
        encryptionInTransit: {
          type: 'object',
          required: ['status', 'protocols'],
          properties: {
            status: { type: 'string', enum: ['Comprehensive', 'Partial', 'Minimal', 'None'] },
            protocols: { type: 'array', items: { type: 'string' } },
            tlsVersion: { type: 'string' },
            certificateManagement: { type: 'object' },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'type', 'severity', 'description'],
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['Sensitive Data Exposure', 'Insufficient Encryption', 'Poor Key Management', 'Hardcoded Secrets', 'Other'] },
              severity: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              description: { type: 'string' },
              dataAffected: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              recommendation: { type: 'string' },
              impact: { type: 'string' }
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
  labels: ['agent', 'security', 'data-protection', 'encryption']
}));

export const checkComplianceTask = defineTask('check-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check compliance with security standards',
  agent: {
    name: 'compliance-auditor',
    prompt: {
      role: 'security compliance auditor',
      task: 'Assess architecture compliance with specified security standards and regulations',
      context: args,
      instructions: [
        'Review applicable compliance standards (GDPR, HIPAA, PCI-DSS, SOC 2, ISO 27001, etc.)',
        'Map architecture controls to compliance requirements',
        'Identify compliance gaps',
        'Assess data residency and sovereignty requirements',
        'Review audit logging and monitoring for compliance',
        'Check incident response and breach notification capabilities',
        'Assess vendor and third-party risk management',
        'Review documentation completeness for compliance',
        'Identify required evidence and artifacts',
        'Provide compliance roadmap and remediation priorities'
      ],
      outputFormat: 'JSON with compliance assessment per standard, gaps, and remediation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'standards', 'gaps', 'roadmap'],
      properties: {
        status: {
          type: 'string',
          enum: ['Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Assessed']
        },
        standards: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'status', 'requirements'],
            properties: {
              name: { type: 'string' },
              status: { type: 'string', enum: ['Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Applicable'] },
              requirements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    requirement: { type: 'string' },
                    status: { type: 'string', enum: ['Met', 'Partially Met', 'Not Met', 'Not Applicable'] },
                    evidence: { type: 'string' },
                    gap: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirement: { type: 'string' },
              severity: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        roadmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              actions: { type: 'array', items: { type: 'string' } },
              estimatedEffort: { type: 'string' }
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
  labels: ['agent', 'security', 'compliance']
}));

export const performSecurityTestingTask = defineTask('perform-security-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define security testing strategy and test cases',
  agent: {
    name: 'security-tester',
    prompt: {
      role: 'security testing specialist',
      task: 'Define comprehensive security testing strategy based on threat model and attack surfaces',
      context: args,
      instructions: [
        'Design security test plan covering all attack surfaces',
        'Define SAST (Static Application Security Testing) requirements',
        'Define DAST (Dynamic Application Security Testing) scenarios',
        'Define penetration testing scope and scenarios',
        'Create security test cases for OWASP Top 10 vulnerabilities',
        'Define dependency scanning and SCA (Software Composition Analysis) approach',
        'Design API security testing (injection, broken authentication, excessive data exposure)',
        'Define infrastructure security testing (misconfigurations, hardening)',
        'Create test cases for identified threats from threat model',
        'Recommend security testing tools and automation',
        'Provide testing schedule and effort estimates'
      ],
      outputFormat: 'JSON with security test plan, test cases, tool recommendations, and findings'
    },
    outputSchema: {
      type: 'object',
      required: ['testPlan', 'testCases', 'toolRecommendations'],
      properties: {
        testPlan: {
          type: 'object',
          properties: {
            scope: { type: 'string' },
            approach: { type: 'array', items: { type: 'string' } },
            schedule: { type: 'string' },
            resources: { type: 'string' }
          }
        },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'category', 'description', 'priority'],
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              testType: { type: 'string', enum: ['SAST', 'DAST', 'Manual Penetration Test', 'SCA', 'Infrastructure Scan'] },
              expectedResult: { type: 'string' }
            }
          }
        },
        toolRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] }
            }
          }
        },
        results: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            criticalFindings: { type: 'number' },
            highFindings: { type: 'number' },
            mediumFindings: { type: 'number' },
            lowFindings: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security', 'testing']
}));

export const generateRiskRegisterTask = defineTask('generate-risk-register', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive risk register and remediation plan',
  agent: {
    name: 'risk-manager',
    prompt: {
      role: 'security risk management specialist',
      task: 'Consolidate all security findings into a comprehensive risk register and create a prioritized remediation plan',
      context: args,
      instructions: [
        'Consolidate all vulnerabilities and findings from all review phases',
        'Calculate risk scores using likelihood and impact (use CVSS or custom scoring)',
        'Deduplicate and categorize risks',
        'Prioritize risks by score, business impact, and exploitability',
        'Create risk register with all identified security risks',
        'For each risk, define mitigation strategies (Avoid, Reduce, Transfer, Accept)',
        'Create remediation plan with specific actions, owners, and timelines',
        'Group remediation actions into phases (Immediate, Short-term, Long-term)',
        'Estimate effort and resources for each remediation action',
        'Identify quick wins (high impact, low effort)',
        'Define success metrics and KPIs for tracking remediation',
        'Create risk acceptance criteria for residual risks'
      ],
      outputFormat: 'JSON with comprehensive risk register, remediation plan, and tracking metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['riskRegister', 'remediationPlan', 'metrics'],
      properties: {
        riskRegister: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'severity', 'riskScore', 'category'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              likelihood: { type: 'string', enum: ['Low', 'Medium', 'High'] },
              impact: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              riskScore: { type: 'number' },
              affectedComponents: { type: 'array', items: { type: 'string' } },
              currentControls: { type: 'array', items: { type: 'string' } },
              mitigationStrategy: { type: 'string', enum: ['Avoid', 'Reduce', 'Transfer', 'Accept'] },
              source: { type: 'string' }
            }
          }
        },
        remediationPlan: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'action', 'priority', 'phase'],
            properties: {
              id: { type: 'string' },
              riskIds: { type: 'array', items: { type: 'string' } },
              action: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              phase: { type: 'string', enum: ['Immediate', 'Short-term', 'Long-term'] },
              estimatedEffort: { type: 'string' },
              requiredResources: { type: 'string' },
              suggestedOwner: { type: 'string' },
              successCriteria: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        metrics: {
          type: 'object',
          properties: {
            totalRisks: { type: 'number' },
            criticalRisks: { type: 'number' },
            highRisks: { type: 'number' },
            mediumRisks: { type: 'number' },
            lowRisks: { type: 'number' },
            totalRemediationActions: { type: 'number' },
            immediateActions: { type: 'number' },
            quickWins: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security', 'risk-management', 'remediation']
}));

export const createFinalReportTask = defineTask('create-final-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive security architecture review report',
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'security documentation specialist',
      task: 'Create a comprehensive, executive-friendly security architecture review report',
      context: args,
      instructions: [
        'Write executive summary highlighting key findings and recommendations',
        'Summarize security posture and maturity level',
        'Present threat model and attack surface analysis',
        'Document security architecture strengths',
        'Highlight critical vulnerabilities and risks',
        'Present compliance status and gaps',
        'Include detailed findings from all review phases',
        'Present risk register with visual risk heat map',
        'Present remediation plan with timeline and priorities',
        'Include appendices with detailed technical findings',
        'Make report actionable with clear next steps',
        'Include metrics and KPIs for tracking progress'
      ],
      outputFormat: 'JSON with report structure, executive summary, detailed sections, and appendices'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'sections', 'nextSteps'],
      properties: {
        executiveSummary: {
          type: 'object',
          properties: {
            overallPosture: { type: 'string' },
            keyFindings: { type: 'array', items: { type: 'string' } },
            criticalRisks: { type: 'number' },
            topRecommendations: { type: 'array', items: { type: 'string' } },
            complianceStatus: { type: 'string' }
          }
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              findings: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              timeline: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        appendices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
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
  labels: ['agent', 'security', 'reporting']
}));

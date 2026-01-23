/**
 * @process specializations/security-compliance/stride-threat-modeling
 * @description STRIDE Threat Modeling Process - Systematic security threat analysis using Microsoft's STRIDE
 * methodology to identify and mitigate security threats across six categories: Spoofing, Tampering,
 * Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege. Includes architecture
 * analysis, threat identification, risk assessment, and mitigation strategy development.
 * @specialization Security & Compliance
 * @category Security Engineering
 * @inputs { system: string, architecture: object, securityRequirements?: object, complianceNeeds?: string[] }
 * @outputs { success: boolean, threatModel: object, threats: object[], mitigations: object[], riskScore: number }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/stride-threat-modeling', {
 *   system: 'E-commerce Platform',
 *   architecture: {
 *     components: ['web-app', 'api-gateway', 'payment-service', 'database'],
 *     dataFlows: [...],
 *     trustBoundaries: [...]
 *   },
 *   securityRequirements: {
 *     confidentiality: 'high',
 *     integrity: 'high',
 *     availability: 'medium'
 *   },
 *   complianceNeeds: ['PCI-DSS', 'GDPR'],
 *   threatModelingDepth: 'comprehensive' // 'basic', 'standard', 'comprehensive'
 * });
 *
 * @references
 * - Microsoft STRIDE Threat Modeling: https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool
 * - OWASP Threat Modeling: https://owasp.org/www-community/Threat_Modeling
 * - Threat Modeling Manifesto: https://www.threatmodelingmanifesto.org/
 * - Microsoft Security Development Lifecycle: https://www.microsoft.com/en-us/securityengineering/sdl/threatmodeling
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system,
    architecture,
    securityRequirements = {},
    complianceNeeds = [],
    threatModelingDepth = 'standard', // 'basic', 'standard', 'comprehensive'
    outputDir = 'stride-threat-model-output',
    includeAttackTrees = true,
    includeMitigationPrioritization = true,
    generateVisualizations = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let riskScore = 0;
  const phases = [];

  ctx.log('info', `Starting STRIDE Threat Modeling for ${system}`);
  ctx.log('info', `Depth: ${threatModelingDepth}, Compliance: ${complianceNeeds.join(', ')}`);

  // ============================================================================
  // PHASE 1: ARCHITECTURE DECOMPOSITION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Decomposing and analyzing system architecture');

  const decompositionResult = await ctx.task(decomposeArchitectureTask, {
    system,
    architecture,
    securityRequirements,
    threatModelingDepth,
    outputDir
  });

  artifacts.push(...decompositionResult.artifacts);
  phases.push({ phase: 'architecture-decomposition', result: decompositionResult });

  ctx.log('info', `Architecture decomposed - ${decompositionResult.components.length} components, ${decompositionResult.dataFlows.length} data flows, ${decompositionResult.trustBoundaries.length} trust boundaries`);

  // Quality Gate: Architecture review
  await ctx.breakpoint({
    question: `Architecture decomposed for ${system}. Identified ${decompositionResult.components.length} components, ${decompositionResult.dataFlows.length} data flows, ${decompositionResult.trustBoundaries.length} trust boundaries. Review architecture decomposition?`,
    title: 'Architecture Decomposition Review',
    context: {
      runId: ctx.runId,
      decomposition: {
        components: decompositionResult.components.length,
        dataFlows: decompositionResult.dataFlows.length,
        trustBoundaries: decompositionResult.trustBoundaries.length,
        externalEntities: decompositionResult.externalEntities.length,
        dataStores: decompositionResult.dataStores.length
      },
      files: decompositionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: CREATE DATA FLOW DIAGRAMS (DFD)
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating data flow diagrams');

  const dfdResult = await ctx.task(createDataFlowDiagramsTask, {
    system,
    decomposition: decompositionResult,
    generateVisualizations,
    outputDir
  });

  artifacts.push(...dfdResult.artifacts);
  phases.push({ phase: 'data-flow-diagrams', result: dfdResult });

  ctx.log('info', `Data flow diagrams created - ${dfdResult.diagrams.length} diagrams at ${dfdResult.levels.length} levels`);

  // ============================================================================
  // PHASE 3: IDENTIFY STRIDE THREATS - SPOOFING
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying Spoofing threats');

  const spoofingResult = await ctx.task(identifySpoofingThreatsTask, {
    system,
    decomposition: decompositionResult,
    dataFlows: dfdResult.dataFlows,
    threatModelingDepth,
    outputDir
  });

  artifacts.push(...spoofingResult.artifacts);
  phases.push({ phase: 'spoofing-threats', result: spoofingResult });

  ctx.log('info', `Spoofing threats identified - ${spoofingResult.threats.length} threats`);

  // ============================================================================
  // PHASE 4: IDENTIFY STRIDE THREATS - TAMPERING
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying Tampering threats');

  const tamperingResult = await ctx.task(identifyTamperingThreatsTask, {
    system,
    decomposition: decompositionResult,
    dataFlows: dfdResult.dataFlows,
    threatModelingDepth,
    outputDir
  });

  artifacts.push(...tamperingResult.artifacts);
  phases.push({ phase: 'tampering-threats', result: tamperingResult });

  ctx.log('info', `Tampering threats identified - ${tamperingResult.threats.length} threats`);

  // ============================================================================
  // PHASE 5: IDENTIFY STRIDE THREATS - REPUDIATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying Repudiation threats');

  const repudiationResult = await ctx.task(identifyRepudiationThreatsTask, {
    system,
    decomposition: decompositionResult,
    dataFlows: dfdResult.dataFlows,
    threatModelingDepth,
    outputDir
  });

  artifacts.push(...repudiationResult.artifacts);
  phases.push({ phase: 'repudiation-threats', result: repudiationResult });

  ctx.log('info', `Repudiation threats identified - ${repudiationResult.threats.length} threats`);

  // ============================================================================
  // PHASE 6: IDENTIFY STRIDE THREATS - INFORMATION DISCLOSURE
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying Information Disclosure threats');

  const infoDisclosureResult = await ctx.task(identifyInformationDisclosureThreatsTask, {
    system,
    decomposition: decompositionResult,
    dataFlows: dfdResult.dataFlows,
    threatModelingDepth,
    outputDir
  });

  artifacts.push(...infoDisclosureResult.artifacts);
  phases.push({ phase: 'information-disclosure-threats', result: infoDisclosureResult });

  ctx.log('info', `Information Disclosure threats identified - ${infoDisclosureResult.threats.length} threats`);

  // ============================================================================
  // PHASE 7: IDENTIFY STRIDE THREATS - DENIAL OF SERVICE
  // ============================================================================

  ctx.log('info', 'Phase 7: Identifying Denial of Service threats');

  const dosResult = await ctx.task(identifyDenialOfServiceThreatsTask, {
    system,
    decomposition: decompositionResult,
    dataFlows: dfdResult.dataFlows,
    threatModelingDepth,
    outputDir
  });

  artifacts.push(...dosResult.artifacts);
  phases.push({ phase: 'denial-of-service-threats', result: dosResult });

  ctx.log('info', `Denial of Service threats identified - ${dosResult.threats.length} threats`);

  // ============================================================================
  // PHASE 8: IDENTIFY STRIDE THREATS - ELEVATION OF PRIVILEGE
  // ============================================================================

  ctx.log('info', 'Phase 8: Identifying Elevation of Privilege threats');

  const elevationResult = await ctx.task(identifyElevationOfPrivilegeThreatsTask, {
    system,
    decomposition: decompositionResult,
    dataFlows: dfdResult.dataFlows,
    trustBoundaries: decompositionResult.trustBoundaries,
    threatModelingDepth,
    outputDir
  });

  artifacts.push(...elevationResult.artifacts);
  phases.push({ phase: 'elevation-of-privilege-threats', result: elevationResult });

  ctx.log('info', `Elevation of Privilege threats identified - ${elevationResult.threats.length} threats`);

  // Quality Gate: Review all identified threats
  const totalThreats = spoofingResult.threats.length + tamperingResult.threats.length +
                       repudiationResult.threats.length + infoDisclosureResult.threats.length +
                       dosResult.threats.length + elevationResult.threats.length;

  await ctx.breakpoint({
    question: `STRIDE threat identification complete. Total ${totalThreats} threats identified across all categories. Review threats before risk assessment?`,
    title: 'STRIDE Threats Review',
    context: {
      runId: ctx.runId,
      threats: {
        total: totalThreats,
        spoofing: spoofingResult.threats.length,
        tampering: tamperingResult.threats.length,
        repudiation: repudiationResult.threats.length,
        informationDisclosure: infoDisclosureResult.threats.length,
        denialOfService: dosResult.threats.length,
        elevationOfPrivilege: elevationResult.threats.length
      },
      files: artifacts.filter(a => a.label && a.label.includes('threats')).map(a => ({
        path: a.path,
        format: a.format || 'json',
        label: a.label
      }))
    }
  });

  // ============================================================================
  // PHASE 9: RISK ASSESSMENT AND SCORING
  // ============================================================================

  ctx.log('info', 'Phase 9: Conducting risk assessment and scoring');

  const riskAssessmentResult = await ctx.task(assessThreatRiskTask, {
    system,
    threats: {
      spoofing: spoofingResult.threats,
      tampering: tamperingResult.threats,
      repudiation: repudiationResult.threats,
      informationDisclosure: infoDisclosureResult.threats,
      denialOfService: dosResult.threats,
      elevationOfPrivilege: elevationResult.threats
    },
    securityRequirements,
    complianceNeeds,
    outputDir
  });

  artifacts.push(...riskAssessmentResult.artifacts);
  phases.push({ phase: 'risk-assessment', result: riskAssessmentResult });
  riskScore = riskAssessmentResult.overallRiskScore;

  ctx.log('info', `Risk assessment complete - Overall risk score: ${riskScore}/100`);
  ctx.log('info', `Critical: ${riskAssessmentResult.criticalThreats}, High: ${riskAssessmentResult.highThreats}, Medium: ${riskAssessmentResult.mediumThreats}, Low: ${riskAssessmentResult.lowThreats}`);

  // ============================================================================
  // PHASE 10: DEVELOP MITIGATION STRATEGIES
  // ============================================================================

  ctx.log('info', 'Phase 10: Developing mitigation strategies');

  const mitigationResult = await ctx.task(developMitigationStrategiesTask, {
    system,
    threatsWithRisk: riskAssessmentResult.threatsWithRisk,
    securityRequirements,
    complianceNeeds,
    includeMitigationPrioritization,
    outputDir
  });

  artifacts.push(...mitigationResult.artifacts);
  phases.push({ phase: 'mitigation-strategies', result: mitigationResult });

  ctx.log('info', `Mitigation strategies developed - ${mitigationResult.mitigations.length} mitigation controls`);

  // Quality Gate: Mitigation review
  await ctx.breakpoint({
    question: `Mitigation strategies developed for ${mitigationResult.mitigations.length} controls. Priority 1: ${mitigationResult.priority1.length}, Priority 2: ${mitigationResult.priority2.length}. Review mitigations?`,
    title: 'Mitigation Strategies Review',
    context: {
      runId: ctx.runId,
      mitigations: {
        total: mitigationResult.mitigations.length,
        priority1: mitigationResult.priority1.length,
        priority2: mitigationResult.priority2.length,
        priority3: mitigationResult.priority3.length,
        estimatedEffort: mitigationResult.estimatedEffort
      },
      files: mitigationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 11: CREATE ATTACK TREES (OPTIONAL)
  // ============================================================================

  let attackTreesResult = null;
  if (includeAttackTrees) {
    ctx.log('info', 'Phase 11: Creating attack trees for critical threats');

    attackTreesResult = await ctx.task(createAttackTreesTask, {
      system,
      criticalThreats: riskAssessmentResult.threatsWithRisk.filter(t => t.riskLevel === 'Critical'),
      highThreats: riskAssessmentResult.threatsWithRisk.filter(t => t.riskLevel === 'High'),
      generateVisualizations,
      outputDir
    });

    artifacts.push(...attackTreesResult.artifacts);
    phases.push({ phase: 'attack-trees', result: attackTreesResult });

    ctx.log('info', `Attack trees created - ${attackTreesResult.attackTrees.length} trees`);
  }

  // ============================================================================
  // PHASE 12: MAP TO COMPLIANCE REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 12: Mapping threats and mitigations to compliance requirements');

  const complianceMappingResult = await ctx.task(mapToComplianceTask, {
    system,
    threatsWithRisk: riskAssessmentResult.threatsWithRisk,
    mitigations: mitigationResult.mitigations,
    complianceNeeds,
    outputDir
  });

  artifacts.push(...complianceMappingResult.artifacts);
  phases.push({ phase: 'compliance-mapping', result: complianceMappingResult });

  ctx.log('info', `Compliance mapping complete - ${complianceNeeds.length} standards mapped`);

  // ============================================================================
  // PHASE 13: CREATE THREAT MODEL DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating comprehensive threat model documentation');

  const documentationResult = await ctx.task(createThreatModelDocumentationTask, {
    system,
    decomposition: decompositionResult,
    dataFlowDiagrams: dfdResult,
    threats: riskAssessmentResult.threatsWithRisk,
    mitigations: mitigationResult.mitigations,
    riskScore,
    complianceMapping: complianceMappingResult,
    attackTrees: attackTreesResult,
    securityRequirements,
    complianceNeeds,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);
  phases.push({ phase: 'threat-model-documentation', result: documentationResult });

  ctx.log('info', `Threat model documentation created - Report: ${documentationResult.reportPath}`);

  // ============================================================================
  // PHASE 14: GENERATE ACTIONABLE REMEDIATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating actionable remediation plan');

  const remediationPlanResult = await ctx.task(generateRemediationPlanTask, {
    system,
    threatsWithRisk: riskAssessmentResult.threatsWithRisk,
    mitigations: mitigationResult.mitigations,
    complianceNeeds,
    outputDir
  });

  artifacts.push(...remediationPlanResult.artifacts);
  phases.push({ phase: 'remediation-plan', result: remediationPlanResult });

  ctx.log('info', `Remediation plan generated - ${remediationPlanResult.actions.length} actions across ${remediationPlanResult.phases.length} phases`);

  // ============================================================================
  // PHASE 15: CALCULATE SECURITY POSTURE SCORE
  // ============================================================================

  ctx.log('info', 'Phase 15: Calculating security posture score and final assessment');

  const postureResult = await ctx.task(calculateSecurityPostureTask, {
    system,
    riskScore,
    threatCount: totalThreats,
    criticalThreats: riskAssessmentResult.criticalThreats,
    highThreats: riskAssessmentResult.highThreats,
    mitigationCoverage: mitigationResult.mitigationCoverage,
    complianceCoverage: complianceMappingResult.complianceCoverage,
    outputDir
  });

  artifacts.push(...postureResult.artifacts);
  phases.push({ phase: 'security-posture', result: postureResult });

  ctx.log('info', `Security posture score: ${postureResult.postureScore}/100`);

  // Final Breakpoint: Threat modeling complete
  await ctx.breakpoint({
    question: `STRIDE Threat Modeling Complete for ${system}. Risk Score: ${riskScore}/100, Security Posture: ${postureResult.postureScore}/100. Total ${totalThreats} threats identified, ${mitigationResult.mitigations.length} mitigations proposed. Approve threat model?`,
    title: 'Final Threat Model Review',
    context: {
      runId: ctx.runId,
      summary: {
        system,
        riskScore,
        postureScore: postureResult.postureScore,
        totalThreats,
        criticalThreats: riskAssessmentResult.criticalThreats,
        highThreats: riskAssessmentResult.highThreats,
        mitigations: mitigationResult.mitigations.length,
        remediationActions: remediationPlanResult.actions.length
      },
      strideBreakdown: {
        spoofing: spoofingResult.threats.length,
        tampering: tamperingResult.threats.length,
        repudiation: repudiationResult.threats.length,
        informationDisclosure: infoDisclosureResult.threats.length,
        denialOfService: dosResult.threats.length,
        elevationOfPrivilege: elevationResult.threats.length
      },
      verdict: postureResult.verdict,
      recommendation: postureResult.recommendation,
      files: [
        { path: documentationResult.reportPath, format: 'markdown', label: 'STRIDE Threat Model Report' },
        { path: remediationPlanResult.planPath, format: 'markdown', label: 'Remediation Plan' },
        { path: postureResult.summaryPath, format: 'json', label: 'Security Posture Summary' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    system,
    riskScore,
    postureScore: postureResult.postureScore,
    threatModel: {
      architecture: decompositionResult,
      dataFlowDiagrams: dfdResult.diagrams,
      threats: riskAssessmentResult.threatsWithRisk,
      mitigations: mitigationResult.mitigations
    },
    threats: riskAssessmentResult.threatsWithRisk,
    threatsBreakdown: {
      total: totalThreats,
      spoofing: spoofingResult.threats.length,
      tampering: tamperingResult.threats.length,
      repudiation: repudiationResult.threats.length,
      informationDisclosure: infoDisclosureResult.threats.length,
      denialOfService: dosResult.threats.length,
      elevationOfPrivilege: elevationResult.threats.length
    },
    riskBreakdown: {
      critical: riskAssessmentResult.criticalThreats,
      high: riskAssessmentResult.highThreats,
      medium: riskAssessmentResult.mediumThreats,
      low: riskAssessmentResult.lowThreats
    },
    mitigations: mitigationResult.mitigations,
    mitigationCoverage: mitigationResult.mitigationCoverage,
    remediationPlan: remediationPlanResult,
    complianceMapping: complianceMappingResult,
    attackTrees: attackTreesResult ? attackTreesResult.attackTrees : [],
    artifacts,
    documentation: {
      reportPath: documentationResult.reportPath,
      remediationPlanPath: remediationPlanResult.planPath,
      postureSummaryPath: postureResult.summaryPath
    },
    duration,
    metadata: {
      processId: 'specializations/security-compliance/stride-threat-modeling',
      processSlug: 'stride-threat-modeling',
      category: 'security-compliance',
      specializationSlug: 'security-compliance',
      timestamp: startTime,
      threatModelingDepth,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Decompose Architecture
export const decomposeArchitectureTask = defineTask('decompose-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Decompose Architecture - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Architect specializing in threat modeling',
      task: 'Decompose system architecture into threat modeling elements',
      context: {
        system: args.system,
        architecture: args.architecture,
        securityRequirements: args.securityRequirements,
        threatModelingDepth: args.threatModelingDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all system components (processes, services, applications)',
        '2. Identify external entities (users, external systems, third parties)',
        '3. Identify data stores (databases, file systems, caches)',
        '4. Document data flows between components',
        '5. Identify trust boundaries:',
        '   - Network boundaries (internet, DMZ, internal network)',
        '   - Process boundaries (different security contexts)',
        '   - Physical boundaries (on-premises, cloud, edge)',
        '   - Administrative boundaries (different security domains)',
        '6. Identify entry points (APIs, web interfaces, mobile apps)',
        '7. Identify exit points (external API calls, third-party integrations)',
        '8. Classify data sensitivity (public, internal, confidential, restricted)',
        '9. Document authentication and authorization mechanisms',
        '10. Identify assets requiring protection',
        '11. Create component interaction matrix',
        '12. Generate architecture decomposition document'
      ],
      outputFormat: 'JSON object with architecture decomposition'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'components', 'dataFlows', 'trustBoundaries', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['process', 'service', 'application', 'api', 'web-server', 'database-server'] },
              description: { type: 'string' },
              trustLevel: { type: 'string' },
              assets: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        externalEntities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['user', 'external-system', 'third-party', 'attacker'] },
              description: { type: 'string' }
            }
          }
        },
        dataStores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['database', 'file-system', 'cache', 'queue'] },
              dataSensitivity: { type: 'string', enum: ['public', 'internal', 'confidential', 'restricted'] },
              encryption: { type: 'boolean' }
            }
          }
        },
        dataFlows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              source: { type: 'string' },
              destination: { type: 'string' },
              dataType: { type: 'string' },
              protocol: { type: 'string' },
              encrypted: { type: 'boolean' },
              authenticated: { type: 'boolean' },
              crossesTrustBoundary: { type: 'boolean' }
            }
          }
        },
        trustBoundaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['network', 'process', 'physical', 'administrative'] },
              description: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        entryPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              component: { type: 'string' },
              type: { type: 'string' },
              requiresAuthentication: { type: 'boolean' }
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
  labels: ['agent', 'stride-threat-modeling', 'architecture']
}));

// Phase 2: Create Data Flow Diagrams
export const createDataFlowDiagramsTask = defineTask('create-data-flow-diagrams', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Create Data Flow Diagrams - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Analyst specializing in data flow modeling',
      task: 'Create data flow diagrams for threat modeling',
      context: {
        system: args.system,
        decomposition: args.decomposition,
        generateVisualizations: args.generateVisualizations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Context-Level DFD (Level 0):',
        '   - Show system as single process',
        '   - External entities interacting with system',
        '   - High-level data flows',
        '2. Create System-Level DFD (Level 1):',
        '   - Major subsystems/components',
        '   - Data flows between subsystems',
        '   - Trust boundaries marked',
        '3. Create Detailed DFDs (Level 2+) for critical subsystems:',
        '   - Individual processes/services',
        '   - Detailed data flows',
        '   - Data stores',
        '4. Use standard DFD notation:',
        '   - Circles/Processes: System components',
        '   - Squares/External Entities: Users, external systems',
        '   - Parallel lines/Data Stores: Databases, files',
        '   - Arrows/Data Flows: Data movement',
        '   - Dashed lines/Trust Boundaries: Security boundaries',
        '5. Annotate DFDs with:',
        '   - Protocols used',
        '   - Encryption status',
        '   - Authentication mechanisms',
        '   - Trust boundary crossings',
        '6. Generate DFD descriptions in Mermaid or PlantUML format',
        '7. Create DFD documentation explaining each diagram'
      ],
      outputFormat: 'JSON object with data flow diagrams'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'diagrams', 'dataFlows', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        diagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              mermaidCode: { type: 'string' },
              elements: { type: 'number' }
            }
          }
        },
        levels: { type: 'array', items: { type: 'number' } },
        dataFlows: {
          type: 'array',
          description: 'Consolidated data flows from all diagrams'
        },
        trustBoundaryCrossings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataFlow: { type: 'string' },
              boundary: { type: 'string' },
              riskLevel: { type: 'string' }
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
  labels: ['agent', 'stride-threat-modeling', 'dfd']
}));

// Phase 3: Identify Spoofing Threats
export const identifySpoofingThreatsTask = defineTask('identify-spoofing-threats', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Identify Spoofing Threats - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Threat Analyst specializing in STRIDE',
      task: 'Identify Spoofing threats - threats where attackers pretend to be something or someone else',
      context: {
        system: args.system,
        decomposition: args.decomposition,
        dataFlows: args.dataFlows,
        threatModelingDepth: args.threatModelingDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Understand Spoofing: Impersonation of users, processes, or systems',
        '2. Identify Spoofing threats for each component and data flow:',
        '   - User identity spoofing (fake login, stolen credentials)',
        '   - Service/process spoofing (rogue services)',
        '   - IP address spoofing',
        '   - Email spoofing (phishing)',
        '   - DNS spoofing',
        '   - Certificate spoofing',
        '   - Session hijacking',
        '   - Token forgery',
        '3. Focus on elements requiring authentication:',
        '   - External entities (users, systems)',
        '   - Data flows crossing trust boundaries',
        '   - Inter-process communications',
        '4. For each threat, document:',
        '   - Threat ID and title',
        '   - STRIDE category: Spoofing',
        '   - Description of the threat',
        '   - Affected component/data flow',
        '   - Attack vector',
        '   - Preconditions for attack',
        '   - Impact if exploited',
        '5. Consider authentication weaknesses:',
        '   - Weak passwords',
        '   - No multi-factor authentication',
        '   - Poor session management',
        '   - Missing certificate validation',
        '6. Document existing security controls',
        '7. Generate spoofing threats catalog'
      ],
      outputFormat: 'JSON object with Spoofing threats'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'threats', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        threats: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'category', 'description', 'affectedElement'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string', enum: ['Spoofing'] },
              description: { type: 'string' },
              affectedElement: { type: 'string' },
              attackVector: { type: 'string' },
              preconditions: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string' },
              existingControls: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'stride-threat-modeling', 'spoofing']
}));

// Phase 4: Identify Tampering Threats
export const identifyTamperingThreatsTask = defineTask('identify-tampering-threats', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Identify Tampering Threats - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Threat Analyst specializing in STRIDE',
      task: 'Identify Tampering threats - threats where attackers modify data or code',
      context: {
        system: args.system,
        decomposition: args.decomposition,
        dataFlows: args.dataFlows,
        threatModelingDepth: args.threatModelingDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Understand Tampering: Malicious modification of data or code',
        '2. Identify Tampering threats for each component and data flow:',
        '   - Data tampering in transit (man-in-the-middle)',
        '   - Data tampering at rest (database modification)',
        '   - Code injection (SQL injection, XSS, command injection)',
        '   - File/configuration tampering',
        '   - Memory tampering',
        '   - Cookie/token manipulation',
        '   - Request parameter tampering',
        '   - Log tampering/deletion',
        '3. Focus on:',
        '   - Data stores (databases, files)',
        '   - Data flows (especially unencrypted)',
        '   - Processes that process user input',
        '4. For each threat, document:',
        '   - Threat ID and title',
        '   - STRIDE category: Tampering',
        '   - Description of the threat',
        '   - Affected component/data flow',
        '   - Attack vector',
        '   - Preconditions for attack',
        '   - Impact if exploited (data integrity loss)',
        '5. Consider integrity weaknesses:',
        '   - No data validation',
        '   - No integrity checks (checksums, signatures)',
        '   - Unencrypted communications',
        '   - Insufficient access controls',
        '6. Document existing integrity controls',
        '7. Generate tampering threats catalog'
      ],
      outputFormat: 'JSON object with Tampering threats'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'threats', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        threats: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'category', 'description', 'affectedElement'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string', enum: ['Tampering'] },
              description: { type: 'string' },
              affectedElement: { type: 'string' },
              attackVector: { type: 'string' },
              preconditions: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string' },
              existingControls: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'stride-threat-modeling', 'tampering']
}));

// Phase 5: Identify Repudiation Threats
export const identifyRepudiationThreatsTask = defineTask('identify-repudiation-threats', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Identify Repudiation Threats - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Threat Analyst specializing in STRIDE',
      task: 'Identify Repudiation threats - threats where users deny performing actions',
      context: {
        system: args.system,
        decomposition: args.decomposition,
        dataFlows: args.dataFlows,
        threatModelingDepth: args.threatModelingDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Understand Repudiation: Users claim they did not perform an action',
        '2. Identify Repudiation threats:',
        '   - Denying transaction execution (financial transactions)',
        '   - Denying data access or modification',
        '   - Denying configuration changes',
        '   - Denying administrative actions',
        '   - Log deletion or tampering to hide actions',
        '   - Time manipulation to dispute actions',
        '3. Focus on:',
        '   - Processes handling critical transactions',
        '   - Data stores with sensitive data',
        '   - Administrative interfaces',
        '   - Audit logging mechanisms',
        '4. For each threat, document:',
        '   - Threat ID and title',
        '   - STRIDE category: Repudiation',
        '   - Description of the threat',
        '   - Affected component',
        '   - Attack vector',
        '   - Preconditions for attack',
        '   - Impact if exploited (accountability loss)',
        '5. Consider audit/logging weaknesses:',
        '   - No audit logs',
        '   - Insufficient logging',
        '   - No log integrity protection',
        '   - Logs can be deleted by users',
        '   - No timestamps',
        '   - No digital signatures',
        '6. Document existing audit controls',
        '7. Generate repudiation threats catalog'
      ],
      outputFormat: 'JSON object with Repudiation threats'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'threats', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        threats: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'category', 'description', 'affectedElement'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string', enum: ['Repudiation'] },
              description: { type: 'string' },
              affectedElement: { type: 'string' },
              attackVector: { type: 'string' },
              preconditions: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string' },
              existingControls: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'stride-threat-modeling', 'repudiation']
}));

// Phase 6: Identify Information Disclosure Threats
export const identifyInformationDisclosureThreatsTask = defineTask('identify-information-disclosure-threats', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Identify Information Disclosure Threats - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Threat Analyst specializing in STRIDE',
      task: 'Identify Information Disclosure threats - threats where attackers access confidential data',
      context: {
        system: args.system,
        decomposition: args.decomposition,
        dataFlows: args.dataFlows,
        threatModelingDepth: args.threatModelingDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Understand Information Disclosure: Unauthorized access to confidential information',
        '2. Identify Information Disclosure threats:',
        '   - Database breach/unauthorized query',
        '   - Unencrypted data in transit interception',
        '   - Unencrypted data at rest access',
        '   - Information leakage in error messages',
        '   - Directory listing/path traversal',
        '   - Memory dumps containing secrets',
        '   - Backup file access',
        '   - API data over-exposure',
        '   - Log files containing sensitive data',
        '   - Source code exposure',
        '   - Metadata leakage',
        '3. Focus on:',
        '   - Data stores with sensitive data',
        '   - Data flows transmitting confidential data',
        '   - APIs exposing data',
        '   - Error handling mechanisms',
        '4. For each threat, document:',
        '   - Threat ID and title',
        '   - STRIDE category: Information Disclosure',
        '   - Description of the threat',
        '   - Affected component/data store',
        '   - Attack vector',
        '   - Preconditions for attack',
        '   - Impact if exploited (confidentiality loss)',
        '   - Data sensitivity level',
        '5. Consider confidentiality weaknesses:',
        '   - No encryption at rest',
        '   - No encryption in transit',
        '   - Weak access controls',
        '   - Excessive privileges',
        '   - Information in logs/errors',
        '6. Document existing confidentiality controls',
        '7. Generate information disclosure threats catalog'
      ],
      outputFormat: 'JSON object with Information Disclosure threats'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'threats', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        threats: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'category', 'description', 'affectedElement'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string', enum: ['Information Disclosure'] },
              description: { type: 'string' },
              affectedElement: { type: 'string' },
              dataSensitivity: { type: 'string', enum: ['public', 'internal', 'confidential', 'restricted'] },
              attackVector: { type: 'string' },
              preconditions: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string' },
              existingControls: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'stride-threat-modeling', 'information-disclosure']
}));

// Phase 7: Identify Denial of Service Threats
export const identifyDenialOfServiceThreatsTask = defineTask('identify-denial-of-service-threats', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Identify Denial of Service Threats - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Threat Analyst specializing in STRIDE',
      task: 'Identify Denial of Service threats - threats where attackers make system unavailable',
      context: {
        system: args.system,
        decomposition: args.decomposition,
        dataFlows: args.dataFlows,
        threatModelingDepth: args.threatModelingDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Understand Denial of Service: Making system or resources unavailable',
        '2. Identify DoS threats:',
        '   - Network flooding (SYN flood, UDP flood)',
        '   - Application-layer DoS (slowloris, hash collision)',
        '   - Resource exhaustion (CPU, memory, disk, connections)',
        '   - Amplification attacks',
        '   - Distributed DoS (DDoS)',
        '   - Database query overload',
        '   - File upload DoS (fill disk space)',
        '   - Regular expression DoS (ReDoS)',
        '   - Fork bomb/process exhaustion',
        '   - Locking/deadlock attacks',
        '3. Focus on:',
        '   - External-facing components',
        '   - Resource-intensive operations',
        '   - Shared resources',
        '   - Critical services',
        '4. For each threat, document:',
        '   - Threat ID and title',
        '   - STRIDE category: Denial of Service',
        '   - Description of the threat',
        '   - Affected component',
        '   - Attack vector',
        '   - Preconditions for attack',
        '   - Impact if exploited (availability loss)',
        '5. Consider availability weaknesses:',
        '   - No rate limiting',
        '   - No resource quotas',
        '   - No input validation',
        '   - No timeout mechanisms',
        '   - Single points of failure',
        '   - No redundancy',
        '6. Document existing availability controls',
        '7. Generate denial of service threats catalog'
      ],
      outputFormat: 'JSON object with Denial of Service threats'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'threats', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        threats: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'category', 'description', 'affectedElement'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string', enum: ['Denial of Service'] },
              description: { type: 'string' },
              affectedElement: { type: 'string' },
              attackVector: { type: 'string' },
              preconditions: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string' },
              existingControls: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'stride-threat-modeling', 'denial-of-service']
}));

// Phase 8: Identify Elevation of Privilege Threats
export const identifyElevationOfPrivilegeThreatsTask = defineTask('identify-elevation-of-privilege-threats', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Identify Elevation of Privilege Threats - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Threat Analyst specializing in STRIDE',
      task: 'Identify Elevation of Privilege threats - threats where attackers gain unauthorized privileges',
      context: {
        system: args.system,
        decomposition: args.decomposition,
        dataFlows: args.dataFlows,
        trustBoundaries: args.trustBoundaries,
        threatModelingDepth: args.threatModelingDepth,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Understand Elevation of Privilege: Gaining higher privileges than authorized',
        '2. Identify Elevation of Privilege threats:',
        '   - Privilege escalation (vertical - user to admin)',
        '   - Horizontal privilege escalation (user to another user)',
        '   - SQL injection to gain database access',
        '   - Command injection to gain OS access',
        '   - Buffer overflow to execute arbitrary code',
        '   - Path traversal to access restricted files',
        '   - Insecure direct object references',
        '   - Missing authorization checks',
        '   - Token/session elevation',
        '   - Exploiting SUID/SGID binaries',
        '   - Container escape',
        '3. Focus on:',
        '   - Trust boundary crossings',
        '   - Processes running with elevated privileges',
        '   - Authorization mechanisms',
        '   - Admin interfaces',
        '4. For each threat, document:',
        '   - Threat ID and title',
        '   - STRIDE category: Elevation of Privilege',
        '   - Description of the threat',
        '   - Affected component',
        '   - Attack vector',
        '   - Preconditions for attack',
        '   - Impact if exploited (authorization loss)',
        '   - Trust boundary crossed',
        '5. Consider authorization weaknesses:',
        '   - Missing authorization checks',
        '   - Inconsistent authorization',
        '   - Default credentials',
        '   - Hardcoded credentials',
        '   - Over-privileged accounts',
        '   - Lack of least privilege',
        '6. Document existing authorization controls',
        '7. Generate elevation of privilege threats catalog'
      ],
      outputFormat: 'JSON object with Elevation of Privilege threats'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'threats', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        threats: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'category', 'description', 'affectedElement'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string', enum: ['Elevation of Privilege'] },
              description: { type: 'string' },
              affectedElement: { type: 'string' },
              attackVector: { type: 'string' },
              preconditions: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string' },
              trustBoundaryCrossed: { type: 'string' },
              existingControls: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'stride-threat-modeling', 'elevation-of-privilege']
}));

// Phase 9: Assess Threat Risk
export const assessThreatRiskTask = defineTask('assess-threat-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Assess Threat Risk - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Risk Analyst',
      task: 'Assess and score risk for all identified threats',
      context: {
        system: args.system,
        threats: args.threats,
        securityRequirements: args.securityRequirements,
        complianceNeeds: args.complianceNeeds,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each threat, assess:',
        '   - Likelihood (Low/Medium/High):',
        '     * Ease of exploitation',
        '     * Attacker motivation',
        '     * Required attacker skill level',
        '     * Opportunity',
        '   - Impact (Low/Medium/High/Critical):',
        '     * Confidentiality impact',
        '     * Integrity impact',
        '     * Availability impact',
        '     * Financial impact',
        '     * Reputation impact',
        '     * Compliance impact',
        '2. Calculate risk level using matrix:',
        '   - Critical: High likelihood + High/Critical impact',
        '   - High: High likelihood + Medium impact OR Medium likelihood + Critical impact',
        '   - Medium: Medium likelihood + Medium impact OR Low likelihood + Critical impact',
        '   - Low: Low likelihood + Low/Medium impact',
        '3. Assign DREAD score (optional, 1-10 each):',
        '   - Damage potential',
        '   - Reproducibility',
        '   - Exploitability',
        '   - Affected users',
        '   - Discoverability',
        '4. Consider existing security controls and residual risk',
        '5. Prioritize threats by risk level',
        '6. Calculate overall system risk score (0-100)',
        '7. Identify top 10 most critical threats',
        '8. Generate risk assessment report'
      ],
      outputFormat: 'JSON object with risk-assessed threats'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'threatsWithRisk', 'overallRiskScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        threatsWithRisk: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'title', 'category', 'likelihood', 'impact', 'riskLevel'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              affectedElement: { type: 'string' },
              likelihood: { type: 'string', enum: ['Low', 'Medium', 'High'] },
              impact: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              riskLevel: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              riskScore: { type: 'number' },
              dreadScore: {
                type: 'object',
                properties: {
                  damage: { type: 'number' },
                  reproducibility: { type: 'number' },
                  exploitability: { type: 'number' },
                  affectedUsers: { type: 'number' },
                  discoverability: { type: 'number' },
                  total: { type: 'number' }
                }
              },
              existingControls: { type: 'array', items: { type: 'string' } },
              residualRisk: { type: 'string' }
            }
          }
        },
        overallRiskScore: { type: 'number', description: 'Overall system risk score 0-100' },
        criticalThreats: { type: 'number' },
        highThreats: { type: 'number' },
        mediumThreats: { type: 'number' },
        lowThreats: { type: 'number' },
        topThreats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 10 threat IDs'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stride-threat-modeling', 'risk-assessment']
}));

// Phase 10: Develop Mitigation Strategies
export const developMitigationStrategiesTask = defineTask('develop-mitigation-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Develop Mitigation Strategies - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Solutions Architect',
      task: 'Develop mitigation strategies for identified threats',
      context: {
        system: args.system,
        threatsWithRisk: args.threatsWithRisk,
        securityRequirements: args.securityRequirements,
        complianceNeeds: args.complianceNeeds,
        includeMitigationPrioritization: args.includeMitigationPrioritization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each threat, define mitigation strategy:',
        '   - Accept: Accept the risk (document justification)',
        '   - Avoid: Eliminate the threat by removing feature/component',
        '   - Transfer: Transfer risk (insurance, third-party)',
        '   - Mitigate: Implement security controls to reduce risk',
        '2. For threats to be mitigated, define specific controls:',
        '   - Spoofing → Authentication, MFA, certificates',
        '   - Tampering → Integrity checks, signatures, encryption',
        '   - Repudiation → Audit logging, digital signatures',
        '   - Information Disclosure → Encryption, access controls, data masking',
        '   - Denial of Service → Rate limiting, quotas, auto-scaling',
        '   - Elevation of Privilege → Authorization, least privilege, input validation',
        '3. For each mitigation:',
        '   - Mitigation ID',
        '   - Related threat IDs',
        '   - Mitigation description',
        '   - Security control type (preventive/detective/corrective)',
        '   - Implementation approach',
        '   - Estimated effort (person-days)',
        '   - Priority (P1/P2/P3)',
        '   - Risk reduction expected',
        '4. Prioritize mitigations:',
        '   - P1: Critical/High risk threats, quick wins',
        '   - P2: High/Medium risk threats',
        '   - P3: Low risk threats',
        '5. Map to security frameworks (NIST, CIS Controls)',
        '6. Calculate mitigation coverage percentage',
        '7. Generate mitigation strategy document'
      ],
      outputFormat: 'JSON object with mitigation strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'mitigations', 'mitigationCoverage', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        mitigations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'threatIds', 'strategy', 'description', 'priority'],
            properties: {
              id: { type: 'string' },
              threatIds: { type: 'array', items: { type: 'string' } },
              strategy: { type: 'string', enum: ['Accept', 'Avoid', 'Transfer', 'Mitigate'] },
              description: { type: 'string' },
              controlType: { type: 'string', enum: ['Preventive', 'Detective', 'Corrective'] },
              implementation: { type: 'string' },
              estimatedEffort: { type: 'string' },
              priority: { type: 'string', enum: ['P1', 'P2', 'P3'] },
              riskReduction: { type: 'string' },
              frameworkMapping: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    framework: { type: 'string' },
                    control: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        priority1: { type: 'array', items: { type: 'string' }, description: 'P1 mitigation IDs' },
        priority2: { type: 'array', items: { type: 'string' }, description: 'P2 mitigation IDs' },
        priority3: { type: 'array', items: { type: 'string' }, description: 'P3 mitigation IDs' },
        mitigationCoverage: { type: 'number', description: 'Percentage of threats with mitigations' },
        estimatedEffort: { type: 'string', description: 'Total estimated effort' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stride-threat-modeling', 'mitigation']
}));

// Phase 11: Create Attack Trees
export const createAttackTreesTask = defineTask('create-attack-trees', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Create Attack Trees - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Attack Modeling Specialist',
      task: 'Create attack trees for critical and high-risk threats',
      context: {
        system: args.system,
        criticalThreats: args.criticalThreats,
        highThreats: args.highThreats,
        generateVisualizations: args.generateVisualizations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each critical and high-risk threat, create an attack tree',
        '2. Attack tree structure:',
        '   - Root node: Threat/attack goal',
        '   - Child nodes: Sub-goals and attack steps',
        '   - Leaf nodes: Atomic attack actions',
        '   - AND nodes: All children must succeed',
        '   - OR nodes: Any child can succeed',
        '3. For each node, document:',
        '   - Node description',
        '   - Attack difficulty',
        '   - Required resources/skills',
        '   - Detection difficulty',
        '4. Calculate attack path probabilities',
        '5. Identify most likely attack paths',
        '6. Identify attack preconditions and dependencies',
        '7. Generate attack tree diagrams in Mermaid format',
        '8. Create attack tree analysis document'
      ],
      outputFormat: 'JSON object with attack trees'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'attackTrees', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        attackTrees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threatId: { type: 'string' },
              rootGoal: { type: 'string' },
              tree: { type: 'object' },
              mermaidDiagram: { type: 'string' },
              likelyPaths: { type: 'array', items: { type: 'string' } },
              countermeasures: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'stride-threat-modeling', 'attack-trees']
}));

// Phase 12: Map to Compliance
export const mapToComplianceTask = defineTask('map-to-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Map to Compliance Requirements - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Compliance Analyst',
      task: 'Map threats and mitigations to compliance requirements',
      context: {
        system: args.system,
        threatsWithRisk: args.threatsWithRisk,
        mitigations: args.mitigations,
        complianceNeeds: args.complianceNeeds,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each compliance standard (GDPR, HIPAA, PCI-DSS, SOC 2, ISO 27001, etc.):',
        '   - Identify relevant security requirements',
        '   - Map threats to compliance risks',
        '   - Map mitigations to compliance controls',
        '2. Assess compliance coverage:',
        '   - Which requirements are addressed by mitigations',
        '   - Which requirements have gaps',
        '3. Identify compliance-critical threats',
        '4. Prioritize mitigations that address compliance',
        '5. Document compliance evidence:',
        '   - Controls implemented',
        '   - Residual risks',
        '   - Compensating controls',
        '6. Generate compliance mapping matrix',
        '7. Create compliance gap analysis',
        '8. Generate compliance readiness report'
      ],
      outputFormat: 'JSON object with compliance mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'complianceStandards', 'complianceCoverage', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        complianceStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    requirement: { type: 'string' },
                    relatedThreats: { type: 'array', items: { type: 'string' } },
                    relatedMitigations: { type: 'array', items: { type: 'string' } },
                    status: { type: 'string', enum: ['Addressed', 'Partially Addressed', 'Gap'] }
                  }
                }
              },
              coverage: { type: 'number', description: 'Percentage of requirements addressed' }
            }
          }
        },
        complianceCoverage: { type: 'number', description: 'Overall compliance coverage percentage' },
        complianceCriticalThreats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Threat IDs that impact compliance'
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirement: { type: 'string' },
              gap: { type: 'string' },
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
  labels: ['agent', 'stride-threat-modeling', 'compliance']
}));

// Phase 13: Create Threat Model Documentation
export const createThreatModelDocumentationTask = defineTask('create-threat-model-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Create Threat Model Documentation - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Documentation Specialist',
      task: 'Create comprehensive threat model documentation',
      context: {
        system: args.system,
        decomposition: args.decomposition,
        dataFlowDiagrams: args.dataFlowDiagrams,
        threats: args.threats,
        mitigations: args.mitigations,
        riskScore: args.riskScore,
        complianceMapping: args.complianceMapping,
        attackTrees: args.attackTrees,
        securityRequirements: args.securityRequirements,
        complianceNeeds: args.complianceNeeds,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary:',
        '   - System overview',
        '   - Threat modeling approach (STRIDE)',
        '   - Key findings',
        '   - Overall risk level',
        '   - Top recommendations',
        '2. Document system architecture:',
        '   - Components, data flows, trust boundaries',
        '   - Data flow diagrams',
        '   - Architecture decomposition',
        '3. Document STRIDE analysis:',
        '   - Threats by category (S, T, R, I, D, E)',
        '   - Threat details with risk levels',
        '4. Document risk assessment:',
        '   - Risk methodology',
        '   - Risk matrix',
        '   - Threat risk scores',
        '   - Top threats',
        '5. Document mitigation strategies:',
        '   - Mitigations by priority',
        '   - Implementation guidance',
        '   - Expected risk reduction',
        '6. Include attack trees (if available)',
        '7. Include compliance mapping',
        '8. Add appendices:',
        '   - Threat catalog',
        '   - Mitigation catalog',
        '   - References',
        '9. Format as professional Markdown document',
        '10. Generate executive presentation (summary)'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string', description: 'Main threat model report path' },
        executiveSummaryPath: { type: 'string', description: 'Executive summary path' },
        threatCatalogPath: { type: 'string', description: 'Detailed threat catalog path' },
        mitigationCatalogPath: { type: 'string', description: 'Detailed mitigation catalog path' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        topRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stride-threat-modeling', 'documentation']
}));

// Phase 14: Generate Remediation Plan
export const generateRemediationPlanTask = defineTask('generate-remediation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Generate Remediation Plan - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Program Manager',
      task: 'Generate actionable remediation plan',
      context: {
        system: args.system,
        threatsWithRisk: args.threatsWithRisk,
        mitigations: args.mitigations,
        complianceNeeds: args.complianceNeeds,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Group mitigations into implementation phases:',
        '   - Phase 1 (Immediate): Critical threats, quick wins',
        '   - Phase 2 (Short-term): High-risk threats, 1-3 months',
        '   - Phase 3 (Medium-term): Medium-risk threats, 3-6 months',
        '   - Phase 4 (Long-term): Low-risk threats, strategic improvements',
        '2. For each phase, create actionable tasks:',
        '   - Task ID and description',
        '   - Related mitigations and threats',
        '   - Owner/team responsible',
        '   - Estimated effort',
        '   - Dependencies',
        '   - Success criteria',
        '   - Verification method',
        '3. Prioritize based on:',
        '   - Risk level',
        '   - Compliance requirements',
        '   - Implementation difficulty',
        '   - Business impact',
        '4. Create implementation timeline',
        '5. Estimate budget and resources',
        '6. Define success metrics and KPIs',
        '7. Create risk tracking mechanism',
        '8. Generate Gantt chart or roadmap',
        '9. Create remediation plan document'
      ],
      outputFormat: 'JSON object with remediation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'phases', 'actions', 'planPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              timeline: { type: 'string' },
              priority: { type: 'string' },
              actions: { type: 'number' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              phase: { type: 'string' },
              description: { type: 'string' },
              relatedMitigations: { type: 'array', items: { type: 'string' } },
              relatedThreats: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' },
              estimatedEffort: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'string' },
              verificationMethod: { type: 'string' }
            }
          }
        },
        timeline: { type: 'string' },
        estimatedBudget: { type: 'string' },
        planPath: { type: 'string', description: 'Remediation plan document path' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stride-threat-modeling', 'remediation']
}));

// Phase 15: Calculate Security Posture
export const calculateSecurityPostureTask = defineTask('calculate-security-posture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Calculate Security Posture - ${args.system}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Posture Assessment Specialist',
      task: 'Calculate security posture score and provide final assessment',
      context: {
        system: args.system,
        riskScore: args.riskScore,
        threatCount: args.threatCount,
        criticalThreats: args.criticalThreats,
        highThreats: args.highThreats,
        mitigationCoverage: args.mitigationCoverage,
        complianceCoverage: args.complianceCoverage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate security posture score (0-100):',
        '   - Base score: 100',
        '   - Deduct for risk level: -riskScore',
        '   - Add for mitigation coverage: +mitigationCoverage * 0.3',
        '   - Add for compliance coverage: +complianceCoverage * 0.2',
        '2. Assess threat model completeness:',
        '   - Architecture decomposition quality',
        '   - Threat identification thoroughness',
        '   - Risk assessment accuracy',
        '   - Mitigation strategy effectiveness',
        '3. Evaluate security maturity level:',
        '   - Initial (ad-hoc security)',
        '   - Developing (some processes)',
        '   - Defined (documented processes)',
        '   - Managed (measured and controlled)',
        '   - Optimizing (continuous improvement)',
        '4. Identify strengths and weaknesses',
        '5. Provide overall security verdict:',
        '   - Strong (80-100): Well-secured, minor improvements',
        '   - Adequate (60-79): Acceptable, some concerns',
        '   - Weak (40-59): Significant risks, urgent action needed',
        '   - Critical (0-39): Severe vulnerabilities, immediate action required',
        '6. Generate recommendations for improvement',
        '7. Create security posture summary document'
      ],
      outputFormat: 'JSON object with security posture assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['postureScore', 'verdict', 'recommendation', 'summaryPath', 'artifacts'],
      properties: {
        postureScore: { type: 'number', minimum: 0, maximum: 100 },
        maturityLevel: {
          type: 'string',
          enum: ['Initial', 'Developing', 'Defined', 'Managed', 'Optimizing']
        },
        verdict: { type: 'string', enum: ['Strong', 'Adequate', 'Weak', 'Critical'] },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        summaryPath: { type: 'string', description: 'Security posture summary path' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stride-threat-modeling', 'posture']
}));

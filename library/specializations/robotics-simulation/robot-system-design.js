/**
 * @process specializations/robotics-simulation/robot-system-design
 * @description Robot System Design and Requirements - Define comprehensive requirements and design specifications
 * for a robotic system from mission objectives to hardware/software architecture, including performance metrics,
 * environmental constraints, sensor/actuator requirements, and safety certifications.
 * @inputs { projectName: string, missionProfile?: string, operationalEnvironment?: string, targetCapabilities?: array, safetyRequirements?: string, outputDir?: string }
 * @outputs { success: boolean, systemArchitecture: object, requirementsDoc: string, designSpecification: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/robot-system-design', {
 *   projectName: 'WarehouseAMR',
 *   missionProfile: 'autonomous-material-transport',
 *   operationalEnvironment: 'indoor-warehouse',
 *   targetCapabilities: ['navigation', 'obstacle-avoidance', 'payload-transport'],
 *   safetyRequirements: 'ISO-13482'
 * });
 *
 * @references
 * - ISO TC 299 Robotics: https://www.iso.org/committee/5915511.html
 * - ISO 10218 Robot Safety: https://www.iso.org/standard/51330.html
 * - Modern Robotics: http://modernrobotics.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    missionProfile = 'general-purpose',
    operationalEnvironment = 'indoor',
    targetCapabilities = ['navigation', 'perception', 'manipulation'],
    safetyRequirements = 'ISO-10218',
    performanceTargets = {},
    budgetConstraints = {},
    timelineConstraints = {},
    outputDir = 'robot-system-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const issues = [];

  ctx.log('info', `Starting Robot System Design for ${projectName}`);
  ctx.log('info', `Mission Profile: ${missionProfile}, Environment: ${operationalEnvironment}`);

  // ============================================================================
  // PHASE 1: MISSION PROFILE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Mission Profile and Operational Requirements Analysis');

  const missionAnalysis = await ctx.task(missionProfileAnalysisTask, {
    projectName,
    missionProfile,
    operationalEnvironment,
    targetCapabilities,
    outputDir
  });

  artifacts.push(...missionAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: PERFORMANCE METRICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Performance Metrics and Success Criteria Definition');

  const performanceMetrics = await ctx.task(performanceMetricsTask, {
    projectName,
    missionAnalysis,
    performanceTargets,
    targetCapabilities,
    outputDir
  });

  artifacts.push(...performanceMetrics.artifacts);

  // ============================================================================
  // PHASE 3: ENVIRONMENTAL CONSTRAINTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Environmental Constraints and Operating Conditions');

  const environmentalConstraints = await ctx.task(environmentalConstraintsTask, {
    projectName,
    operationalEnvironment,
    missionAnalysis,
    outputDir
  });

  artifacts.push(...environmentalConstraints.artifacts);

  // ============================================================================
  // PHASE 4: SENSOR AND ACTUATOR REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 4: Sensor and Actuator Requirements Specification');

  const sensorActuatorReqs = await ctx.task(sensorActuatorRequirementsTask, {
    projectName,
    targetCapabilities,
    missionAnalysis,
    environmentalConstraints,
    outputDir
  });

  artifacts.push(...sensorActuatorReqs.artifacts);

  // ============================================================================
  // PHASE 5: MECHANICAL ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Mechanical Architecture and Kinematics Design');

  const mechanicalArchitecture = await ctx.task(mechanicalArchitectureTask, {
    projectName,
    missionProfile,
    sensorActuatorReqs,
    environmentalConstraints,
    outputDir
  });

  artifacts.push(...mechanicalArchitecture.artifacts);

  await ctx.breakpoint({
    question: `Mechanical architecture designed for ${projectName}. Robot type: ${mechanicalArchitecture.robotType}. DoF: ${mechanicalArchitecture.degreesOfFreedom}. Approve and proceed with software architecture?`,
    title: 'Mechanical Architecture Review',
    context: {
      runId: ctx.runId,
      robotType: mechanicalArchitecture.robotType,
      kinematics: mechanicalArchitecture.kinematicsType,
      files: mechanicalArchitecture.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 6: SOFTWARE ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Software Architecture Design (Perception, Planning, Control)');

  const softwareArchitecture = await ctx.task(softwareArchitectureTask, {
    projectName,
    targetCapabilities,
    mechanicalArchitecture,
    sensorActuatorReqs,
    outputDir
  });

  artifacts.push(...softwareArchitecture.artifacts);

  // ============================================================================
  // PHASE 7: SAFETY REQUIREMENTS AND CERTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Safety Requirements and Certification Planning');

  const safetyAnalysis = await ctx.task(safetyRequirementsTask, {
    projectName,
    safetyRequirements,
    mechanicalArchitecture,
    softwareArchitecture,
    operationalEnvironment,
    outputDir
  });

  artifacts.push(...safetyAnalysis.artifacts);
  if (safetyAnalysis.issues) issues.push(...safetyAnalysis.issues);

  // ============================================================================
  // PHASE 8: SYSTEM INTEGRATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 8: System Integration Plan');

  const integrationPlan = await ctx.task(systemIntegrationPlanTask, {
    projectName,
    mechanicalArchitecture,
    softwareArchitecture,
    sensorActuatorReqs,
    safetyAnalysis,
    timelineConstraints,
    outputDir
  });

  artifacts.push(...integrationPlan.artifacts);

  // ============================================================================
  // PHASE 9: DESIGN DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Comprehensive Design Documentation');

  const designDocumentation = await ctx.task(designDocumentationTask, {
    projectName,
    missionAnalysis,
    performanceMetrics,
    environmentalConstraints,
    sensorActuatorReqs,
    mechanicalArchitecture,
    softwareArchitecture,
    safetyAnalysis,
    integrationPlan,
    outputDir
  });

  artifacts.push(...designDocumentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Robot System Design Complete for ${projectName}. ${issues.length} issues identified. Review comprehensive design documentation?`,
    title: 'Robot System Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        robotType: mechanicalArchitecture.robotType,
        capabilities: targetCapabilities,
        safetyStandard: safetyRequirements,
        issueCount: issues.length
      },
      files: [
        { path: designDocumentation.docPath, format: 'markdown', label: 'Design Document' },
        ...designDocumentation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: issues.length === 0,
    projectName,
    systemArchitecture: {
      mechanical: mechanicalArchitecture,
      software: softwareArchitecture,
      sensors: sensorActuatorReqs.sensors,
      actuators: sensorActuatorReqs.actuators
    },
    requirementsDoc: designDocumentation.docPath,
    designSpecification: {
      missionProfile: missionAnalysis,
      performanceMetrics: performanceMetrics,
      environmentalConstraints: environmentalConstraints,
      safetyRequirements: safetyAnalysis
    },
    integrationPlan: integrationPlan,
    issues,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/robotics-simulation/robot-system-design',
      timestamp: startTime,
      safetyStandard: safetyRequirements,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const missionProfileAnalysisTask = defineTask('mission-profile-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Mission Profile Analysis - ${args.projectName}`,
  agent: {
    name: 'robotics-architect',  // AG-001: Robotics System Architect Agent
    prompt: {
      role: 'Robotics Systems Engineer',
      task: 'Analyze mission profile and operational requirements',
      context: args,
      instructions: [
        '1. Define primary mission objectives and use cases',
        '2. Identify operational scenarios and workflows',
        '3. Determine autonomy level requirements (teleoperated, semi-autonomous, fully autonomous)',
        '4. Define operational duty cycles and uptime requirements',
        '5. Identify human interaction requirements',
        '6. Determine payload and manipulation requirements',
        '7. Define communication and connectivity requirements',
        '8. Identify terrain and mobility requirements',
        '9. Determine power and energy requirements',
        '10. Document mission-critical vs nice-to-have capabilities'
      ],
      outputFormat: 'JSON with mission profile analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['missionObjectives', 'operationalScenarios', 'autonomyLevel', 'artifacts'],
      properties: {
        missionObjectives: { type: 'array', items: { type: 'object' } },
        operationalScenarios: { type: 'array', items: { type: 'object' } },
        autonomyLevel: { type: 'string' },
        dutyCycle: { type: 'object' },
        payloadRequirements: { type: 'object' },
        mobilityRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'system-design', 'mission-analysis']
}));

export const performanceMetricsTask = defineTask('performance-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Performance Metrics - ${args.projectName}`,
  agent: {
    name: 'robotics-architect',  // AG-001: Robotics System Architect Agent
    prompt: {
      role: 'Robotics Systems Engineer',
      task: 'Define performance metrics and success criteria',
      context: args,
      instructions: [
        '1. Define speed and velocity requirements (max, nominal, precision)',
        '2. Specify positioning accuracy and repeatability',
        '3. Define payload capacity and manipulation precision',
        '4. Establish reliability metrics (MTBF, MTTR)',
        '5. Define battery life and operational endurance',
        '6. Specify perception range and accuracy requirements',
        '7. Define response time and latency requirements',
        '8. Establish safety response times',
        '9. Define computational performance requirements',
        '10. Create measurable acceptance criteria for each metric'
      ],
      outputFormat: 'JSON with performance metrics specification'
    },
    outputSchema: {
      type: 'object',
      required: ['speedMetrics', 'accuracyMetrics', 'reliabilityMetrics', 'artifacts'],
      properties: {
        speedMetrics: { type: 'object' },
        accuracyMetrics: { type: 'object' },
        reliabilityMetrics: { type: 'object' },
        enduranceMetrics: { type: 'object' },
        perceptionMetrics: { type: 'object' },
        acceptanceCriteria: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'system-design', 'performance-metrics']
}));

export const environmentalConstraintsTask = defineTask('environmental-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Environmental Constraints - ${args.projectName}`,
  agent: {
    name: 'robotics-architect',  // AG-001: Robotics System Architect Agent
    prompt: {
      role: 'Robotics Systems Engineer',
      task: 'Analyze environmental constraints and operating conditions',
      context: args,
      instructions: [
        '1. Define operating temperature range',
        '2. Specify humidity and moisture requirements (IP rating)',
        '3. Identify terrain types and surface conditions',
        '4. Define lighting conditions (indoor, outdoor, varying)',
        '5. Identify obstacle types and densities',
        '6. Specify EMI/EMC requirements',
        '7. Define vibration and shock requirements',
        '8. Identify dust and particulate exposure',
        '9. Define altitude and pressure requirements',
        '10. Document any hazardous environment considerations'
      ],
      outputFormat: 'JSON with environmental constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['temperatureRange', 'ipRating', 'terrainTypes', 'artifacts'],
      properties: {
        temperatureRange: { type: 'object' },
        ipRating: { type: 'string' },
        terrainTypes: { type: 'array', items: { type: 'string' } },
        lightingConditions: { type: 'array', items: { type: 'string' } },
        obstacleTypes: { type: 'array', items: { type: 'object' } },
        emcRequirements: { type: 'object' },
        hazardousConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'system-design', 'environmental-constraints']
}));

export const sensorActuatorRequirementsTask = defineTask('sensor-actuator-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Sensor/Actuator Requirements - ${args.projectName}`,
  agent: {
    name: 'robotics-architect',  // AG-001: Robotics System Architect Agent
    prompt: {
      role: 'Robotics Systems Engineer',
      task: 'Specify sensor and actuator requirements',
      context: args,
      instructions: [
        '1. Define perception sensor requirements (cameras, LiDAR, radar, ultrasonic)',
        '2. Specify proprioceptive sensor requirements (encoders, IMU, force/torque)',
        '3. Define localization sensor requirements (GPS, beacons, markers)',
        '4. Specify actuator types and capabilities (motors, servos, pneumatics)',
        '5. Define control interfaces and protocols',
        '6. Specify power requirements for each sensor/actuator',
        '7. Define sensor mounting and placement constraints',
        '8. Identify redundancy requirements for critical sensors',
        '9. Specify sensor calibration requirements',
        '10. Document sensor fusion requirements'
      ],
      outputFormat: 'JSON with sensor and actuator specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['sensors', 'actuators', 'interfaces', 'artifacts'],
      properties: {
        sensors: { type: 'array', items: { type: 'object' } },
        actuators: { type: 'array', items: { type: 'object' } },
        interfaces: { type: 'array', items: { type: 'object' } },
        powerBudget: { type: 'object' },
        redundancyRequirements: { type: 'array', items: { type: 'object' } },
        calibrationRequirements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'system-design', 'sensors-actuators']
}));

export const mechanicalArchitectureTask = defineTask('mechanical-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Mechanical Architecture - ${args.projectName}`,
  agent: {
    name: 'urdf-sdf-expert',  // AG-005: URDF/SDF Modeling Expert Agent
    prompt: {
      role: 'Mechanical Engineer',
      task: 'Design mechanical architecture and kinematics',
      context: args,
      instructions: [
        '1. Select robot type (mobile, manipulator, humanoid, hybrid)',
        '2. Design kinematic chain and joint hierarchy',
        '3. Define degrees of freedom and workspace',
        '4. Specify link dimensions and materials',
        '5. Design drive train and transmission systems',
        '6. Plan sensor and payload mounting locations',
        '7. Design chassis/frame structure',
        '8. Specify mass distribution and center of gravity',
        '9. Plan cable routing and management',
        '10. Design serviceability and maintenance access'
      ],
      outputFormat: 'JSON with mechanical architecture specification'
    },
    outputSchema: {
      type: 'object',
      required: ['robotType', 'kinematicsType', 'degreesOfFreedom', 'artifacts'],
      properties: {
        robotType: { type: 'string' },
        kinematicsType: { type: 'string' },
        degreesOfFreedom: { type: 'number' },
        workspace: { type: 'object' },
        linkSpecifications: { type: 'array', items: { type: 'object' } },
        driveTrainDesign: { type: 'object' },
        massProperties: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'system-design', 'mechanical-architecture']
}));

export const softwareArchitectureTask = defineTask('software-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Software Architecture - ${args.projectName}`,
  agent: {
    name: 'ros-expert',  // AG-015: ROS/ROS2 Expert Agent
    prompt: {
      role: 'Robotics Software Architect',
      task: 'Design software architecture for perception, planning, and control',
      context: args,
      instructions: [
        '1. Design perception pipeline architecture',
        '2. Design localization and mapping subsystem',
        '3. Design motion planning architecture',
        '4. Design control system architecture',
        '5. Define inter-process communication (ROS topics, services, actions)',
        '6. Plan state machine and behavior architecture',
        '7. Design safety monitoring and watchdog systems',
        '8. Plan logging and diagnostics infrastructure',
        '9. Design configuration management system',
        '10. Specify real-time and non-real-time partitioning'
      ],
      outputFormat: 'JSON with software architecture specification'
    },
    outputSchema: {
      type: 'object',
      required: ['perceptionArchitecture', 'planningArchitecture', 'controlArchitecture', 'artifacts'],
      properties: {
        perceptionArchitecture: { type: 'object' },
        planningArchitecture: { type: 'object' },
        controlArchitecture: { type: 'object' },
        communicationDesign: { type: 'object' },
        behaviorArchitecture: { type: 'object' },
        safetyArchitecture: { type: 'object' },
        realTimePartitioning: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'system-design', 'software-architecture']
}));

export const safetyRequirementsTask = defineTask('safety-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Safety Requirements - ${args.projectName}`,
  agent: {
    name: 'safety-engineer',  // AG-010: Safety Engineer Agent
    prompt: {
      role: 'Robot Safety Engineer',
      task: 'Define safety requirements and certification plan',
      context: args,
      instructions: [
        '1. Identify applicable safety standards (ISO 10218, ISO 13482, ISO 15066)',
        '2. Conduct preliminary hazard analysis',
        '3. Define safety-rated functions',
        '4. Specify emergency stop requirements',
        '5. Define speed and force limiting requirements',
        '6. Design safety monitoring systems',
        '7. Define safe state and recovery procedures',
        '8. Plan safety validation and testing',
        '9. Identify certification requirements and timeline',
        '10. Document risk assessment methodology'
      ],
      outputFormat: 'JSON with safety requirements specification'
    },
    outputSchema: {
      type: 'object',
      required: ['applicableStandards', 'hazardAnalysis', 'safetyFunctions', 'artifacts'],
      properties: {
        applicableStandards: { type: 'array', items: { type: 'string' } },
        hazardAnalysis: { type: 'array', items: { type: 'object' } },
        safetyFunctions: { type: 'array', items: { type: 'object' } },
        emergencyStopRequirements: { type: 'object' },
        speedForceLimits: { type: 'object' },
        certificationPlan: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'system-design', 'safety']
}));

export const systemIntegrationPlanTask = defineTask('system-integration-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: System Integration Plan - ${args.projectName}`,
  agent: {
    name: 'robotics-architect',  // AG-001: Robotics System Architect Agent
    prompt: {
      role: 'Systems Integration Engineer',
      task: 'Create system integration plan',
      context: args,
      instructions: [
        '1. Define integration sequence and milestones',
        '2. Identify interface specifications between subsystems',
        '3. Plan hardware-software integration testing',
        '4. Define simulation-based validation stages',
        '5. Plan incremental integration approach',
        '6. Identify integration risks and mitigations',
        '7. Define test fixtures and equipment requirements',
        '8. Plan regression testing strategy',
        '9. Create integration verification matrix',
        '10. Define go/no-go criteria for each integration stage'
      ],
      outputFormat: 'JSON with system integration plan'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationSequence', 'milestones', 'testPlan', 'artifacts'],
      properties: {
        integrationSequence: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        interfaceSpecifications: { type: 'array', items: { type: 'object' } },
        testPlan: { type: 'object' },
        riskMitigations: { type: 'array', items: { type: 'object' } },
        verificationMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'system-design', 'integration']
}));

export const designDocumentationTask = defineTask('design-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Design Documentation - ${args.projectName}`,
  agent: {
    name: 'robotics-documentation-specialist',  // AG-020: Robotics Documentation Specialist Agent
    prompt: {
      role: 'Technical Documentation Engineer',
      task: 'Create comprehensive design documentation',
      context: args,
      instructions: [
        '1. Create executive summary and project overview',
        '2. Document mission profile and requirements',
        '3. Detail mechanical architecture with diagrams',
        '4. Document software architecture with component diagrams',
        '5. Create sensor and actuator specification sheets',
        '6. Document performance requirements and metrics',
        '7. Include safety requirements and hazard analysis',
        '8. Document integration plan and milestones',
        '9. Create traceability matrix (requirements to design)',
        '10. Include appendices with reference materials'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'sections', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        traceabilityMatrix: { type: 'object' },
        diagramPaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'system-design', 'documentation']
}));

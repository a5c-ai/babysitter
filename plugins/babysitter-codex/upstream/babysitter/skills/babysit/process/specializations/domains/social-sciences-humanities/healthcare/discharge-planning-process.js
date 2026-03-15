/**
 * @process specializations/domains/social-sciences-humanities/healthcare/discharge-planning-process
 * @description Discharge Planning Process - Comprehensive approach to preparing patients for safe transition
 * from hospital to home or other care settings with medication reconciliation and post-acute coordination.
 * @inputs { patientProfile: object, admissionType?: string, anticipatedNeeds?: array, caregiverAvailable?: boolean }
 * @outputs { success: boolean, dischargePlan: object, educationPlan: object, followUpSchedule: array, artifacts: array }
 * @recommendedSkills SK-HC-008 (care-transition-coordination), SK-HC-001 (clinical-workflow-analysis)
 * @recommendedAgents AG-HC-006 (care-management-coordinator), AG-HC-007 (operations-excellence-director)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/discharge-planning-process', {
 *   patientProfile: { age: 75, diagnosis: 'CHF exacerbation', comorbidities: ['DM', 'CKD'] },
 *   admissionType: 'acute',
 *   anticipatedNeeds: ['home health', 'medication management', 'DME'],
 *   caregiverAvailable: true
 * });
 *
 * @references
 * - CMS Discharge Planning Requirements (CoP)
 * - Project RED (Re-Engineered Discharge)
 * - Coleman Care Transitions Intervention
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    patientProfile,
    admissionType = 'acute',
    anticipatedNeeds = [],
    caregiverAvailable = false,
    insuranceType = null,
    preferredDischargeDestination = 'home',
    outputDir = 'discharge-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Discharge Planning for patient with ${patientProfile.diagnosis}`);

  // Phase 1: Initial Assessment
  ctx.log('info', 'Phase 1: Initial Discharge Assessment');
  const initialAssessment = await ctx.task(initialAssessmentTask, {
    patientProfile,
    admissionType,
    anticipatedNeeds,
    caregiverAvailable,
    outputDir
  });

  artifacts.push(...initialAssessment.artifacts);

  await ctx.breakpoint({
    question: `Initial assessment complete. Risk level: ${initialAssessment.riskLevel}. Anticipated LOS: ${initialAssessment.anticipatedLOS} days. ${initialAssessment.anticipatedNeeds.length} post-discharge needs identified. Proceed?`,
    title: 'Initial Discharge Assessment Review',
    context: {
      runId: ctx.runId,
      riskLevel: initialAssessment.riskLevel,
      needs: initialAssessment.anticipatedNeeds,
      barriers: initialAssessment.barriers,
      files: initialAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Post-Acute Care Needs Assessment
  ctx.log('info', 'Phase 2: Post-Acute Care Needs Assessment');
  const postAcuteNeeds = await ctx.task(postAcuteNeedsTask, {
    initialAssessment,
    patientProfile,
    insuranceType,
    outputDir
  });

  artifacts.push(...postAcuteNeeds.artifacts);

  // Phase 3: Discharge Destination Planning
  ctx.log('info', 'Phase 3: Discharge Destination Planning');
  const destinationPlanning = await ctx.task(destinationPlanningTask, {
    initialAssessment,
    postAcuteNeeds,
    preferredDischargeDestination,
    caregiverAvailable,
    outputDir
  });

  artifacts.push(...destinationPlanning.artifacts);

  await ctx.breakpoint({
    question: `Recommended discharge destination: ${destinationPlanning.recommendedDestination}. Patient choice available: ${destinationPlanning.choicesProvided}. Proceed with medication reconciliation?`,
    title: 'Discharge Destination Review',
    context: {
      runId: ctx.runId,
      destination: destinationPlanning.recommendedDestination,
      alternatives: destinationPlanning.alternatives,
      files: destinationPlanning.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Medication Reconciliation
  ctx.log('info', 'Phase 4: Medication Reconciliation');
  const medicationReconciliation = await ctx.task(medicationReconciliationTask, {
    patientProfile,
    initialAssessment,
    outputDir
  });

  artifacts.push(...medicationReconciliation.artifacts);

  // Phase 5: Patient Education Planning
  ctx.log('info', 'Phase 5: Patient Education Planning');
  const educationPlan = await ctx.task(patientEducationTask, {
    patientProfile,
    medicationReconciliation,
    postAcuteNeeds,
    destinationPlanning,
    outputDir
  });

  artifacts.push(...educationPlan.artifacts);

  // Phase 6: Follow-up Appointment Scheduling
  ctx.log('info', 'Phase 6: Follow-up Scheduling');
  const followUpSchedule = await ctx.task(followUpSchedulingTask, {
    patientProfile,
    initialAssessment,
    medicationReconciliation,
    outputDir
  });

  artifacts.push(...followUpSchedule.artifacts);

  await ctx.breakpoint({
    question: `Education plan includes ${educationPlan.topics.length} topics. ${followUpSchedule.appointments.length} follow-up appointments scheduled. Proceed with care coordination?`,
    title: 'Education and Follow-up Review',
    context: {
      runId: ctx.runId,
      educationTopics: educationPlan.topics,
      appointments: followUpSchedule.appointments,
      files: [...educationPlan.artifacts, ...followUpSchedule.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Community Resource Coordination
  ctx.log('info', 'Phase 7: Community Resource Coordination');
  const communityResources = await ctx.task(communityResourceTask, {
    patientProfile,
    postAcuteNeeds,
    destinationPlanning,
    outputDir
  });

  artifacts.push(...communityResources.artifacts);

  // Phase 8: Discharge Summary Preparation
  ctx.log('info', 'Phase 8: Discharge Summary Preparation');
  const dischargeSummary = await ctx.task(dischargeSummaryTask, {
    patientProfile,
    initialAssessment,
    medicationReconciliation,
    postAcuteNeeds,
    educationPlan,
    followUpSchedule,
    outputDir
  });

  artifacts.push(...dischargeSummary.artifacts);

  // Phase 9: Teach-Back and Verification
  ctx.log('info', 'Phase 9: Teach-Back and Verification');
  const teachBack = await ctx.task(teachBackVerificationTask, {
    educationPlan,
    medicationReconciliation,
    dischargeSummary,
    outputDir
  });

  artifacts.push(...teachBack.artifacts);

  // Phase 10: Final Discharge Checklist
  ctx.log('info', 'Phase 10: Final Discharge Checklist');
  const finalChecklist = await ctx.task(dischargeChecklistTask, {
    initialAssessment,
    medicationReconciliation,
    educationPlan,
    followUpSchedule,
    communityResources,
    dischargeSummary,
    teachBack,
    outputDir
  });

  artifacts.push(...finalChecklist.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    patientProfile,
    dischargePlan: {
      destination: destinationPlanning.recommendedDestination,
      postAcuteServices: postAcuteNeeds.services,
      medications: medicationReconciliation.dischargeMedications,
      communityResources: communityResources.resources
    },
    educationPlan: {
      topics: educationPlan.topics,
      materials: educationPlan.materials,
      teachBackResults: teachBack.results
    },
    followUpSchedule: followUpSchedule.appointments,
    dischargeSummary: dischargeSummary.summary,
    checklistCompleted: finalChecklist.allItemsComplete,
    riskScore: initialAssessment.riskLevel,
    artifacts,
    summaryPath: dischargeSummary.summaryPath,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/discharge-planning-process',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Initial Assessment
export const initialAssessmentTask = defineTask('dp-initial-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discharge Planning Initial Assessment',
  agent: {
    name: 'discharge-planner',
    prompt: {
      role: 'Discharge Planning Specialist',
      task: 'Conduct initial discharge assessment',
      context: args,
      instructions: [
        '1. Review patient demographics and diagnosis',
        '2. Assess functional status (ADLs, IADLs)',
        '3. Evaluate cognitive status',
        '4. Assess social support system',
        '5. Review insurance and benefits',
        '6. Identify discharge barriers',
        '7. Calculate readmission risk score',
        '8. Estimate anticipated length of stay',
        '9. Identify preliminary post-discharge needs',
        '10. Begin discharge planning within 24 hours'
      ],
      outputFormat: 'JSON with initial assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['riskLevel', 'anticipatedLOS', 'anticipatedNeeds', 'barriers', 'artifacts'],
      properties: {
        riskLevel: { type: 'string' },
        readmissionRiskScore: { type: 'number' },
        anticipatedLOS: { type: 'number' },
        functionalStatus: { type: 'object' },
        cognitiveStatus: { type: 'object' },
        socialSupport: { type: 'object' },
        anticipatedNeeds: { type: 'array', items: { type: 'object' } },
        barriers: { type: 'array', items: { type: 'object' } },
        insuranceStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'discharge-planning', 'assessment', 'healthcare']
}));

// Task 2: Post-Acute Care Needs
export const postAcuteNeedsTask = defineTask('dp-post-acute', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Post-Acute Care Needs Assessment',
  agent: {
    name: 'post-acute-specialist',
    prompt: {
      role: 'Post-Acute Care Specialist',
      task: 'Assess post-acute care needs',
      context: args,
      instructions: [
        '1. Evaluate skilled nursing needs',
        '2. Assess home health requirements',
        '3. Determine DME/medical equipment needs',
        '4. Evaluate rehabilitation needs (PT/OT/ST)',
        '5. Assess wound care requirements',
        '6. Evaluate medication management needs',
        '7. Assess nutritional requirements',
        '8. Determine hospice/palliative eligibility if applicable',
        '9. Review insurance coverage for services',
        '10. Document all post-acute recommendations'
      ],
      outputFormat: 'JSON with post-acute needs'
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'equipment', 'therapy', 'artifacts'],
      properties: {
        services: { type: 'array', items: { type: 'object' } },
        skilledNursing: { type: 'object' },
        homeHealth: { type: 'object' },
        equipment: { type: 'array', items: { type: 'object' } },
        therapy: { type: 'object' },
        woundCare: { type: 'object' },
        nutritional: { type: 'object' },
        coverageDetails: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'discharge-planning', 'post-acute', 'healthcare']
}));

// Task 3: Destination Planning
export const destinationPlanningTask = defineTask('dp-destination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discharge Destination Planning',
  agent: {
    name: 'placement-coordinator',
    prompt: {
      role: 'Patient Placement Coordinator',
      task: 'Plan discharge destination',
      context: args,
      instructions: [
        '1. Evaluate home discharge feasibility',
        '2. Assess SNF placement criteria',
        '3. Evaluate acute rehab criteria (IRF)',
        '4. Consider LTACH if applicable',
        '5. Assess assisted living options',
        '6. Provide patient choice per CMS requirements',
        '7. Document facility options',
        '8. Coordinate family meetings',
        '9. Initiate referrals to selected facility',
        '10. Document decision and rationale'
      ],
      outputFormat: 'JSON with destination planning'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedDestination', 'alternatives', 'choicesProvided', 'artifacts'],
      properties: {
        recommendedDestination: { type: 'string' },
        alternatives: { type: 'array', items: { type: 'object' } },
        choicesProvided: { type: 'boolean' },
        facilityOptions: { type: 'array', items: { type: 'object' } },
        placementCriteria: { type: 'object' },
        familyInput: { type: 'string' },
        patientPreference: { type: 'string' },
        referralStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'discharge-planning', 'destination', 'placement']
}));

// Task 4: Medication Reconciliation
export const medicationReconciliationTask = defineTask('dp-med-rec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discharge Medication Reconciliation',
  agent: {
    name: 'clinical-pharmacist',
    prompt: {
      role: 'Clinical Pharmacist',
      task: 'Perform discharge medication reconciliation',
      context: args,
      instructions: [
        '1. Review pre-admission medication list',
        '2. Review inpatient medications',
        '3. Identify medication changes and rationale',
        '4. Screen for drug interactions',
        '5. Assess medication appropriateness',
        '6. Simplify regimen where possible',
        '7. Assess affordability/access',
        '8. Create discharge medication list',
        '9. Identify high-alert medications',
        '10. Document medication education needs'
      ],
      outputFormat: 'JSON with medication reconciliation'
    },
    outputSchema: {
      type: 'object',
      required: ['dischargeMedications', 'changes', 'educationNeeds', 'artifacts'],
      properties: {
        preAdmissionMedications: { type: 'array', items: { type: 'object' } },
        dischargeMedications: { type: 'array', items: { type: 'object' } },
        changes: { type: 'array', items: { type: 'object' } },
        interactions: { type: 'array', items: { type: 'object' } },
        highAlertMedications: { type: 'array', items: { type: 'string' } },
        educationNeeds: { type: 'array', items: { type: 'string' } },
        affordabilityConcerns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'discharge-planning', 'medication', 'reconciliation']
}));

// Task 5: Patient Education
export const patientEducationTask = defineTask('dp-education', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discharge Patient Education',
  agent: {
    name: 'patient-educator',
    prompt: {
      role: 'Patient Education Specialist',
      task: 'Develop discharge education plan',
      context: args,
      instructions: [
        '1. Assess health literacy level',
        '2. Identify learning barriers',
        '3. Define education topics',
        '4. Select appropriate materials',
        '5. Plan medication education',
        '6. Include red flag symptoms',
        '7. Educate on activity restrictions',
        '8. Provide dietary guidance',
        '9. Include wound care if applicable',
        '10. Plan follow-up care education'
      ],
      outputFormat: 'JSON with education plan'
    },
    outputSchema: {
      type: 'object',
      required: ['topics', 'materials', 'redFlags', 'artifacts'],
      properties: {
        healthLiteracy: { type: 'string' },
        learningBarriers: { type: 'array', items: { type: 'string' } },
        topics: { type: 'array', items: { type: 'object' } },
        materials: { type: 'array', items: { type: 'object' } },
        medicationEducation: { type: 'object' },
        redFlags: { type: 'array', items: { type: 'string' } },
        activityRestrictions: { type: 'array', items: { type: 'string' } },
        dietaryGuidance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'discharge-planning', 'education', 'healthcare']
}));

// Task 6: Follow-up Scheduling
export const followUpSchedulingTask = defineTask('dp-followup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discharge Follow-up Scheduling',
  agent: {
    name: 'care-coordinator',
    prompt: {
      role: 'Care Coordinator',
      task: 'Schedule post-discharge follow-up appointments',
      context: args,
      instructions: [
        '1. Schedule PCP follow-up within 7 days',
        '2. Schedule specialist appointments as needed',
        '3. Arrange lab/test appointments',
        '4. Coordinate with home health visits',
        '5. Schedule physical therapy if ordered',
        '6. Arrange medication management follow-up',
        '7. Confirm appointment transportation',
        '8. Provide appointment reminder system',
        '9. Document all appointments',
        '10. Communicate schedule to patient and providers'
      ],
      outputFormat: 'JSON with follow-up schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['appointments', 'pcpFollowUp', 'artifacts'],
      properties: {
        appointments: { type: 'array', items: { type: 'object' } },
        pcpFollowUp: { type: 'object' },
        specialistFollowUp: { type: 'array', items: { type: 'object' } },
        labTests: { type: 'array', items: { type: 'object' } },
        therapySchedule: { type: 'object' },
        transportationArranged: { type: 'boolean' },
        reminderSystem: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'discharge-planning', 'followup', 'scheduling']
}));

// Task 7: Community Resources
export const communityResourceTask = defineTask('dp-community', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Community Resource Coordination',
  agent: {
    name: 'social-worker',
    prompt: {
      role: 'Medical Social Worker',
      task: 'Coordinate community resources',
      context: args,
      instructions: [
        '1. Assess social determinants of health needs',
        '2. Identify food security resources',
        '3. Assess transportation needs',
        '4. Identify financial assistance programs',
        '5. Connect with meal delivery services',
        '6. Arrange medication assistance programs',
        '7. Identify caregiver support resources',
        '8. Connect with disease-specific support groups',
        '9. Provide resource contact information',
        '10. Document referrals made'
      ],
      outputFormat: 'JSON with community resources'
    },
    outputSchema: {
      type: 'object',
      required: ['resources', 'referrals', 'artifacts'],
      properties: {
        sdohNeeds: { type: 'array', items: { type: 'string' } },
        resources: { type: 'array', items: { type: 'object' } },
        referrals: { type: 'array', items: { type: 'object' } },
        foodResources: { type: 'array', items: { type: 'object' } },
        transportationResources: { type: 'array', items: { type: 'object' } },
        financialAssistance: { type: 'array', items: { type: 'object' } },
        supportGroups: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'discharge-planning', 'community', 'social-work']
}));

// Task 8: Discharge Summary
export const dischargeSummaryTask = defineTask('dp-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discharge Summary Preparation',
  agent: {
    name: 'physician-assistant',
    prompt: {
      role: 'Clinical Documentation Specialist',
      task: 'Prepare discharge summary',
      context: args,
      instructions: [
        '1. Document admission diagnosis and course',
        '2. Include procedures performed',
        '3. Document hospital course',
        '4. Include discharge diagnosis',
        '5. List discharge medications',
        '6. Document pending results',
        '7. Include follow-up appointments',
        '8. Document patient education provided',
        '9. Include care instructions',
        '10. Ensure timely completion'
      ],
      outputFormat: 'JSON with discharge summary'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'summaryPath', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        summaryPath: { type: 'string' },
        admissionDiagnosis: { type: 'string' },
        dischargeDiagnosis: { type: 'array', items: { type: 'string' } },
        procedures: { type: 'array', items: { type: 'string' } },
        hospitalCourse: { type: 'string' },
        pendingResults: { type: 'array', items: { type: 'object' } },
        careInstructions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'discharge-planning', 'summary', 'documentation']
}));

// Task 9: Teach-Back Verification
export const teachBackVerificationTask = defineTask('dp-teach-back', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Teach-Back Verification',
  agent: {
    name: 'nurse-educator',
    prompt: {
      role: 'Nurse Educator',
      task: 'Conduct teach-back verification',
      context: args,
      instructions: [
        '1. Use teach-back for medication understanding',
        '2. Verify understanding of red flag symptoms',
        '3. Confirm follow-up appointment knowledge',
        '4. Verify activity restriction understanding',
        '5. Confirm dietary understanding',
        '6. Verify wound care competency if applicable',
        '7. Document teach-back results',
        '8. Re-educate areas of concern',
        '9. Involve caregiver in teach-back',
        '10. Document readiness for discharge'
      ],
      outputFormat: 'JSON with teach-back results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'readinessConfirmed', 'artifacts'],
      properties: {
        results: { type: 'object' },
        medicationUnderstanding: { type: 'boolean' },
        redFlagUnderstanding: { type: 'boolean' },
        followUpUnderstanding: { type: 'boolean' },
        areasForReeducation: { type: 'array', items: { type: 'string' } },
        caregiverInvolved: { type: 'boolean' },
        readinessConfirmed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'discharge-planning', 'teach-back', 'verification']
}));

// Task 10: Discharge Checklist
export const dischargeChecklistTask = defineTask('dp-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final Discharge Checklist',
  agent: {
    name: 'discharge-coordinator',
    prompt: {
      role: 'Discharge Coordinator',
      task: 'Complete final discharge checklist',
      context: args,
      instructions: [
        '1. Verify medication reconciliation complete',
        '2. Confirm prescriptions provided',
        '3. Verify follow-up appointments scheduled',
        '4. Confirm education completed and documented',
        '5. Verify teach-back successful',
        '6. Confirm DME arranged and delivered',
        '7. Verify transportation arranged',
        '8. Confirm discharge summary complete',
        '9. Verify receiving facility notified if applicable',
        '10. Complete discharge documentation'
      ],
      outputFormat: 'JSON with checklist results'
    },
    outputSchema: {
      type: 'object',
      required: ['allItemsComplete', 'checklistItems', 'artifacts'],
      properties: {
        allItemsComplete: { type: 'boolean' },
        checklistItems: { type: 'array', items: { type: 'object' } },
        incompleteItems: { type: 'array', items: { type: 'string' } },
        mitigationActions: { type: 'array', items: { type: 'object' } },
        dischargeTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'discharge-planning', 'checklist', 'verification']
}));

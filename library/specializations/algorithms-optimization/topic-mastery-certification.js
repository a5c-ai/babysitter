/**
 * @process specializations/algorithms-optimization/topic-mastery-certification
 * @description Topic Mastery Verification and Certification - Process for verifying mastery of specific algorithm
 * topics through comprehensive assessment, problem-solving tests, and issuing certification.
 * @inputs { topic: string, candidateId?: string }
 * @outputs { success: boolean, certified: boolean, score: number, certificate: object, artifacts: array }
 *
 * @references
 * - Algorithm Mastery Frameworks
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { topic, candidateId = 'default', outputDir = 'certification-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Topic Mastery Certification - Topic: ${topic}`);

  const theoryAssessment = await ctx.task(theoryAssessmentTask, { topic, outputDir });
  artifacts.push(...theoryAssessment.artifacts);

  const practicalAssessment = await ctx.task(practicalAssessmentTask, { topic, outputDir });
  artifacts.push(...practicalAssessment.artifacts);

  const scoring = await ctx.task(scoringTask, { theoryAssessment, practicalAssessment, topic, outputDir });
  artifacts.push(...scoring.artifacts);

  let certificate = null;
  if (scoring.passed) {
    const cert = await ctx.task(certificateGenerationTask, { candidateId, topic, scoring, outputDir });
    artifacts.push(...cert.artifacts);
    certificate = cert.certificate;
  }

  await ctx.breakpoint({
    question: `Certification assessment complete for ${topic}. Score: ${scoring.totalScore}/100. Certified: ${scoring.passed}. Review?`,
    title: 'Topic Mastery Certification Complete',
    context: { runId: ctx.runId, topic, score: scoring.totalScore, certified: scoring.passed }
  });

  return {
    success: true,
    topic,
    certified: scoring.passed,
    score: scoring.totalScore,
    certificate,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const theoryAssessmentTask = defineTask('theory-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Theory Assessment - ${args.topic}`,
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Algorithm Examiner',
      task: 'Assess theoretical knowledge',
      context: args,
      instructions: ['1. Test concept understanding', '2. Test complexity analysis', '3. Test algorithm selection', '4. Test trade-off understanding', '5. Score theory portion'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'details', 'artifacts'],
      properties: { score: { type: 'number' }, details: { type: 'object' }, questions: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'certification', 'theory']
}));

export const practicalAssessmentTask = defineTask('practical-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Practical Assessment - ${args.topic}`,
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Algorithm Examiner',
      task: 'Assess practical problem-solving ability',
      context: args,
      instructions: ['1. Present coding problems', '2. Evaluate solutions', '3. Check correctness', '4. Evaluate code quality', '5. Score practical portion'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'problemResults', 'artifacts'],
      properties: { score: { type: 'number' }, problemResults: { type: 'array' }, codeQuality: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'certification', 'practical']
}));

export const scoringTask = defineTask('scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate Final Score',
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Certification Administrator',
      task: 'Calculate final certification score',
      context: args,
      instructions: ['1. Weight theory and practical scores', '2. Calculate total score', '3. Apply passing threshold', '4. Determine certification status', '5. Document scoring'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['totalScore', 'passed', 'artifacts'],
      properties: { totalScore: { type: 'number' }, passed: { type: 'boolean' }, breakdown: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'certification', 'scoring']
}));

export const certificateGenerationTask = defineTask('certificate-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Certificate',
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'Certification Administrator',
      task: 'Generate mastery certificate',
      context: args,
      instructions: ['1. Create certificate document', '2. Include score details', '3. Add date and validity', '4. Generate unique ID', '5. Save certificate'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['certificate', 'artifacts'],
      properties: { certificate: { type: 'object' }, certificatePath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'certification', 'certificate']
}));

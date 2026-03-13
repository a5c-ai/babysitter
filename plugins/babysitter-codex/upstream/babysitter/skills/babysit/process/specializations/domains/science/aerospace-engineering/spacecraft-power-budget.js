/**
 * @process specializations/domains/science/aerospace-engineering/spacecraft-power-budget
 * @description Systematic analysis of spacecraft power generation, storage, and consumption including
 * solar array sizing and battery management.
 * @inputs { projectName: string, missionProfile: object, loadList: array, orbitParameters?: object }
 * @outputs { success: boolean, powerBudget: object, solarArrayDesign: object, batteryDesign: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, missionProfile, loadList, orbitParameters = {} } = inputs;

  const requirements = await ctx.task(powerRequirementsTask, { projectName, missionProfile, loadList });
  const orbitPower = await ctx.task(orbitPowerTask, { projectName, orbitParameters, missionProfile });
  const solarArrayDesign = await ctx.task(solarArrayDesignTask, { projectName, requirements, orbitPower });

  await ctx.breakpoint({
    question: `Solar array sized at ${solarArrayDesign.area} m2 for ${projectName}. Proceed with battery sizing?`,
    title: 'Solar Array Review',
    context: { runId: ctx.runId, solarArrayDesign }
  });

  const batteryDesign = await ctx.task(batteryDesignTask, { projectName, requirements, orbitPower });
  const powerBudget = await ctx.task(powerBudgetTask, { projectName, requirements, solarArrayDesign, batteryDesign, loadList });

  if (powerBudget.margin < 0.15) {
    await ctx.breakpoint({
      question: `Power margin ${(powerBudget.margin*100).toFixed(1)}% below 15% target. Review loads or increase capacity?`,
      title: 'Power Margin Warning',
      context: { runId: ctx.runId, powerBudget }
    });
  }

  const eclipseAnalysis = await ctx.task(eclipseAnalysisTask, { projectName, batteryDesign, orbitPower, loadList });
  const report = await ctx.task(powerReportTask, { projectName, requirements, solarArrayDesign, batteryDesign, powerBudget, eclipseAnalysis });

  await ctx.breakpoint({
    question: `Power analysis complete for ${projectName}. Margin: ${(powerBudget.margin*100).toFixed(1)}%. Approve?`,
    title: 'Power Budget Approval',
    context: { runId: ctx.runId, summary: { margin: powerBudget.margin, solarPower: solarArrayDesign.power, batteryCapacity: batteryDesign.capacity } }
  });

  return { success: true, projectName, powerBudget, solarArrayDesign, batteryDesign, report, metadata: { processId: 'spacecraft-power-budget', timestamp: ctx.now() } };
}

export const powerRequirementsTask = defineTask('power-requirements', (args, taskCtx) => ({
  kind: 'agent', title: `Power Requirements - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Spacecraft Power Engineer', task: 'Define power requirements', context: args,
    instructions: ['1. Analyze load list', '2. Define operational modes', '3. Calculate average power', '4. Calculate peak power', '5. Define margin policy', '6. Identify critical loads', '7. Define eclipse requirements', '8. Document requirements'],
    outputFormat: 'JSON object with power requirements'
  }, outputSchema: { type: 'object', required: ['averagePower', 'peakPower'], properties: { averagePower: { type: 'number' }, peakPower: { type: 'number' }, modes: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['power', 'aerospace']
}));

export const orbitPowerTask = defineTask('orbit-power', (args, taskCtx) => ({
  kind: 'agent', title: `Orbit Power Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Orbit Power Analyst', task: 'Analyze orbit power conditions', context: args,
    instructions: ['1. Calculate eclipse duration', '2. Calculate sunlight duration', '3. Determine beta angles', '4. Calculate solar flux', '5. Analyze seasonal variations', '6. Calculate array illumination', '7. Determine DOD requirements', '8. Document orbit conditions'],
    outputFormat: 'JSON object with orbit power analysis'
  }, outputSchema: { type: 'object', required: ['eclipseDuration', 'sunlightDuration'], properties: { eclipseDuration: { type: 'number' }, sunlightDuration: { type: 'number' }, solarFlux: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['power', 'aerospace']
}));

export const solarArrayDesignTask = defineTask('solar-array-design', (args, taskCtx) => ({
  kind: 'agent', title: `Solar Array Design - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Solar Array Designer', task: 'Design solar arrays', context: args,
    instructions: ['1. Select cell technology', '2. Calculate BOL power', '3. Apply degradation factors', '4. Calculate EOL power', '5. Size array area', '6. Design array geometry', '7. Calculate mass', '8. Document design'],
    outputFormat: 'JSON object with solar array design'
  }, outputSchema: { type: 'object', required: ['area', 'power'], properties: { area: { type: 'number' }, power: { type: 'number' }, mass: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['power', 'aerospace']
}));

export const batteryDesignTask = defineTask('battery-design', (args, taskCtx) => ({
  kind: 'agent', title: `Battery Design - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Battery System Engineer', task: 'Design battery system', context: args,
    instructions: ['1. Select cell chemistry', '2. Calculate eclipse energy', '3. Apply DOD limit', '4. Size capacity', '5. Design configuration', '6. Calculate mass', '7. Define thermal requirements', '8. Document design'],
    outputFormat: 'JSON object with battery design'
  }, outputSchema: { type: 'object', required: ['capacity', 'mass'], properties: { capacity: { type: 'number' }, mass: { type: 'number' }, dod: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['power', 'aerospace']
}));

export const powerBudgetTask = defineTask('power-budget', (args, taskCtx) => ({
  kind: 'agent', title: `Power Budget - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Power Budget Analyst', task: 'Generate power budget', context: args,
    instructions: ['1. Compile load list', '2. Calculate by mode', '3. Calculate generation', '4. Calculate margin', '5. Verify all modes', '6. Identify critical cases', '7. Document budget', '8. Provide recommendations'],
    outputFormat: 'JSON object with power budget'
  }, outputSchema: { type: 'object', required: ['margin', 'budget'], properties: { margin: { type: 'number' }, budget: { type: 'object' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['power', 'aerospace']
}));

export const eclipseAnalysisTask = defineTask('eclipse-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Eclipse Analysis - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Eclipse Power Analyst', task: 'Analyze eclipse power', context: args,
    instructions: ['1. Calculate eclipse energy', '2. Verify battery capacity', '3. Analyze worst case', '4. Calculate discharge profile', '5. Verify DOD limits', '6. Check thermal limits', '7. Document analysis', '8. Verify margins'],
    outputFormat: 'JSON object with eclipse analysis'
  }, outputSchema: { type: 'object', required: ['verified', 'maxDOD'], properties: { verified: { type: 'boolean' }, maxDOD: { type: 'number' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['power', 'aerospace']
}));

export const powerReportTask = defineTask('power-report', (args, taskCtx) => ({
  kind: 'agent', title: `Power Report - ${args.projectName}`,
  agent: { name: 'general-purpose', prompt: { role: 'Power Report Engineer', task: 'Generate power report', context: args,
    instructions: ['1. Create summary', '2. Document requirements', '3. Present solar array', '4. Present battery', '5. Present budget', '6. Document analysis', '7. Provide conclusions', '8. Generate markdown'],
    outputFormat: 'JSON object with report'
  }, outputSchema: { type: 'object', required: ['report', 'markdown'], properties: { report: { type: 'object' }, markdown: { type: 'string' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['power', 'aerospace']
}));

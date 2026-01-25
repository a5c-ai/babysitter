/**
 * @process specializations/domains/science/electrical-engineering/switching-power-supply-design
 * @description Switching Power Supply Design - Guide the design of switching power supplies including DC-DC converters,
 * AC-DC converters, and power factor correction circuits. Covers topology selection, component sizing, and efficiency optimization.
 * @inputs { supplyName: string, specifications: object, topology?: string, constraints?: object }
 * @outputs { success: boolean, design: object, components: object, simulation: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/switching-power-supply-design', {
 *   supplyName: '24V/10A Industrial Supply',
 *   specifications: { inputVoltage: '85-265VAC', outputVoltage: '24V', outputCurrent: '10A', efficiency: '>90%' },
 *   topology: 'flyback',
 *   constraints: { isolation: true, formFactor: '3x5 inch', thermal: 'fanless' }
 * });
 *
 * @references
 * - IEC 62368 (Audio/Video, IT and Communication Technology Equipment Safety)
 * - EN 55032 (EMC Emissions for Multimedia Equipment)
 * - Energy Star Efficiency Guidelines
 * - Magnetics Design Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    supplyName,
    specifications,
    topology = 'auto',
    constraints = {}
  } = inputs;

  // Phase 1: Define Power Supply Specifications
  const specificationDefinition = await ctx.task(specificationDefinitionTask, {
    supplyName,
    specifications,
    constraints
  });

  // Phase 2: Select Converter Topology
  const topologySelection = await ctx.task(topologySelectionTask, {
    supplyName,
    specifications: specificationDefinition.specs,
    topology,
    constraints
  });

  // Breakpoint: Review topology selection
  await ctx.breakpoint({
    question: `Review topology selection for ${supplyName}. Selected: ${topologySelection.selectedTopology}. Proceed with magnetics design?`,
    title: 'Topology Review',
    context: {
      runId: ctx.runId,
      supplyName,
      topology: topologySelection,
      files: [{
        path: `artifacts/phase2-topology.json`,
        format: 'json',
        content: topologySelection
      }]
    }
  });

  // Phase 3: Design Magnetic Components
  const magneticsDesign = await ctx.task(magneticsDesignTask, {
    supplyName,
    topology: topologySelection.selectedTopology,
    specifications: specificationDefinition.specs
  });

  // Phase 4: Select Power Semiconductors
  const semiconductorSelection = await ctx.task(semiconductorSelectionTask, {
    supplyName,
    topology: topologySelection.selectedTopology,
    specifications: specificationDefinition.specs,
    magnetics: magneticsDesign
  });

  // Phase 5: Design Control Loop and Compensation
  const controlLoopDesign = await ctx.task(controlLoopDesignTask, {
    supplyName,
    topology: topologySelection.selectedTopology,
    magnetics: magneticsDesign,
    semiconductors: semiconductorSelection,
    specifications: specificationDefinition.specs
  });

  // Breakpoint: Review control loop design
  await ctx.breakpoint({
    question: `Review control loop design for ${supplyName}. Bandwidth: ${controlLoopDesign.bandwidth}. Phase margin: ${controlLoopDesign.phaseMargin}. Proceed with simulation?`,
    title: 'Control Loop Review',
    context: {
      runId: ctx.runId,
      controlLoop: controlLoopDesign,
      files: [{
        path: `artifacts/phase5-control.json`,
        format: 'json',
        content: controlLoopDesign
      }]
    }
  });

  // Phase 6: Simulate Steady-State and Transient Performance
  const performanceSimulation = await ctx.task(performanceSimulationTask, {
    supplyName,
    topology: topologySelection.selectedTopology,
    magnetics: magneticsDesign,
    semiconductors: semiconductorSelection,
    controlLoop: controlLoopDesign,
    specifications: specificationDefinition.specs
  });

  // Quality Gate: Performance must meet specifications
  if (!performanceSimulation.meetsSpecs) {
    await ctx.breakpoint({
      question: `Simulation shows ${performanceSimulation.failures.length} specifications not met. Review and iterate design?`,
      title: 'Performance Issues',
      context: {
        runId: ctx.runId,
        failures: performanceSimulation.failures,
        recommendations: performanceSimulation.recommendations
      }
    });
  }

  // Phase 7: Design PCB Layout for Thermal and EMI
  const pcbLayoutGuidelines = await ctx.task(pcbLayoutGuidelinesTask, {
    supplyName,
    topology: topologySelection.selectedTopology,
    magnetics: magneticsDesign,
    semiconductors: semiconductorSelection,
    constraints
  });

  // Phase 8: Test and Validate Performance
  const testValidation = await ctx.task(testValidationTask, {
    supplyName,
    specifications: specificationDefinition.specs,
    performanceSimulation,
    pcbLayout: pcbLayoutGuidelines
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `Switching power supply design complete for ${supplyName}. Efficiency: ${testValidation.efficiency}. Approve for production?`,
    title: 'Design Approval',
    context: {
      runId: ctx.runId,
      supplyName,
      performanceSummary: testValidation.summary,
      files: [
        { path: `artifacts/power-supply-design.json`, format: 'json', content: { magnetics: magneticsDesign, control: controlLoopDesign } },
        { path: `artifacts/power-supply-report.md`, format: 'markdown', content: testValidation.markdown }
      ]
    }
  });

  return {
    success: true,
    supplyName,
    design: {
      topology: topologySelection.selectedTopology,
      specifications: specificationDefinition.specs,
      controlLoop: controlLoopDesign
    },
    components: {
      magnetics: magneticsDesign,
      semiconductors: semiconductorSelection,
      bom: testValidation.bom
    },
    simulation: performanceSimulation.results,
    pcbGuidelines: pcbLayoutGuidelines,
    validation: testValidation.results,
    documentation: testValidation.documentation,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/switching-power-supply-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const specificationDefinitionTask = defineTask('specification-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Specification Definition - ${args.supplyName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Power Supply Design Engineer',
      task: 'Define power supply specifications',
      context: {
        supplyName: args.supplyName,
        specifications: args.specifications,
        constraints: args.constraints
      },
      instructions: [
        '1. Define input voltage range (AC or DC)',
        '2. Define output voltage and current ratings',
        '3. Specify output voltage regulation',
        '4. Define efficiency targets across load range',
        '5. Specify ripple and noise requirements',
        '6. Define transient response requirements',
        '7. Specify isolation requirements (if any)',
        '8. Define operating temperature range',
        '9. Specify protection features (OCP, OVP, OTP)',
        '10. Document all specifications'
      ],
      outputFormat: 'JSON object with complete specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specs'],
      properties: {
        specs: {
          type: 'object',
          properties: {
            input: { type: 'object' },
            output: { type: 'object' },
            efficiency: { type: 'object' },
            regulation: { type: 'object' },
            ripple: { type: 'string' },
            transient: { type: 'object' },
            protection: { type: 'object' },
            thermal: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-supply', 'specifications']
}));

export const topologySelectionTask = defineTask('topology-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Topology Selection - ${args.supplyName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Power Electronics Topology Specialist',
      task: 'Select optimal converter topology',
      context: {
        supplyName: args.supplyName,
        specifications: args.specifications,
        topology: args.topology,
        constraints: args.constraints
      },
      instructions: [
        '1. Evaluate buck, boost, buck-boost for DC-DC',
        '2. Evaluate flyback, forward, LLC for isolated AC-DC',
        '3. Consider full-bridge vs. half-bridge',
        '4. Evaluate PFC requirements',
        '5. Assess isolation requirements',
        '6. Calculate input/output voltage ratio',
        '7. Consider power level and efficiency trade-offs',
        '8. Evaluate component stress levels',
        '9. Select optimal topology with justification',
        '10. Document topology selection rationale'
      ],
      outputFormat: 'JSON object with topology selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTopology'],
      properties: {
        selectedTopology: { type: 'string' },
        candidateTopologies: { type: 'array', items: { type: 'object' } },
        selectionRationale: { type: 'string' },
        operatingMode: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-supply', 'topology']
}));

export const magneticsDesignTask = defineTask('magnetics-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Magnetics Design - ${args.supplyName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Magnetics Design Engineer',
      task: 'Design magnetic components (inductors, transformers)',
      context: {
        supplyName: args.supplyName,
        topology: args.topology,
        specifications: args.specifications
      },
      instructions: [
        '1. Calculate required inductance/turns ratio',
        '2. Select core material and size',
        '3. Calculate number of turns for each winding',
        '4. Verify core saturation margin',
        '5. Calculate winding resistance and losses',
        '6. Design for thermal performance',
        '7. Specify wire gauge and winding arrangement',
        '8. Calculate leakage inductance (for transformers)',
        '9. Specify air gap if required',
        '10. Document magnetics design'
      ],
      outputFormat: 'JSON object with magnetics design'
    },
    outputSchema: {
      type: 'object',
      required: ['inductor', 'transformer'],
      properties: {
        inductor: {
          type: 'object',
          properties: {
            inductance: { type: 'string' },
            core: { type: 'string' },
            turns: { type: 'number' },
            wire: { type: 'string' },
            dcr: { type: 'string' }
          }
        },
        transformer: {
          type: 'object',
          properties: {
            turnsRatio: { type: 'string' },
            core: { type: 'string' },
            primaryTurns: { type: 'number' },
            secondaryTurns: { type: 'number' },
            leakageInductance: { type: 'string' }
          }
        },
        losses: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-supply', 'magnetics']
}));

export const semiconductorSelectionTask = defineTask('semiconductor-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Semiconductor Selection - ${args.supplyName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Power Semiconductor Selection Engineer',
      task: 'Select power semiconductors (MOSFETs, diodes)',
      context: {
        supplyName: args.supplyName,
        topology: args.topology,
        specifications: args.specifications,
        magnetics: args.magnetics
      },
      instructions: [
        '1. Calculate MOSFET voltage and current stress',
        '2. Select MOSFET based on Rds(on) and Qg',
        '3. Calculate diode voltage and current stress',
        '4. Select rectifier diodes (Schottky, fast recovery, SiC)',
        '5. Evaluate switching losses',
        '6. Evaluate conduction losses',
        '7. Calculate junction temperatures',
        '8. Select gate driver IC',
        '9. Verify SOA (safe operating area)',
        '10. Document semiconductor selections'
      ],
      outputFormat: 'JSON object with semiconductor selections'
    },
    outputSchema: {
      type: 'object',
      required: ['mosfets', 'diodes'],
      properties: {
        mosfets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              partNumber: { type: 'string' },
              vds: { type: 'string' },
              ids: { type: 'string' },
              rdson: { type: 'string' }
            }
          }
        },
        diodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              partNumber: { type: 'string' },
              vrrm: { type: 'string' },
              if: { type: 'string' }
            }
          }
        },
        gateDriver: { type: 'object' },
        lossAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-supply', 'semiconductors']
}));

export const controlLoopDesignTask = defineTask('control-loop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Control Loop Design - ${args.supplyName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Power Supply Control Engineer',
      task: 'Design control loop and compensation',
      context: {
        supplyName: args.supplyName,
        topology: args.topology,
        magnetics: args.magnetics,
        semiconductors: args.semiconductors,
        specifications: args.specifications
      },
      instructions: [
        '1. Select control method (voltage mode, current mode)',
        '2. Model power stage transfer function',
        '3. Calculate plant poles and zeros',
        '4. Design Type II or Type III compensator',
        '5. Set crossover frequency and phase margin',
        '6. Calculate compensation component values',
        '7. Verify stability across input/load range',
        '8. Design soft start circuitry',
        '9. Implement current limiting',
        '10. Document control design'
      ],
      outputFormat: 'JSON object with control loop design'
    },
    outputSchema: {
      type: 'object',
      required: ['controlMethod', 'compensator', 'bandwidth', 'phaseMargin'],
      properties: {
        controlMethod: { type: 'string' },
        compensator: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            components: { type: 'object' }
          }
        },
        bandwidth: { type: 'string' },
        phaseMargin: { type: 'string' },
        gainMargin: { type: 'string' },
        softStart: { type: 'object' },
        currentLimit: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-supply', 'control-loop']
}));

export const performanceSimulationTask = defineTask('performance-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Performance Simulation - ${args.supplyName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Power Supply Simulation Engineer',
      task: 'Simulate steady-state and transient performance',
      context: {
        supplyName: args.supplyName,
        topology: args.topology,
        magnetics: args.magnetics,
        semiconductors: args.semiconductors,
        controlLoop: args.controlLoop,
        specifications: args.specifications
      },
      instructions: [
        '1. Build circuit simulation model',
        '2. Simulate steady-state operation',
        '3. Measure efficiency at various loads',
        '4. Measure output ripple',
        '5. Simulate load transient response',
        '6. Simulate input transient response',
        '7. Verify loop stability (Bode plot)',
        '8. Simulate startup sequence',
        '9. Verify protection circuit operation',
        '10. Compare results to specifications'
      ],
      outputFormat: 'JSON object with simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsSpecs', 'results'],
      properties: {
        meetsSpecs: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            efficiency: { type: 'object' },
            ripple: { type: 'string' },
            transientResponse: { type: 'object' },
            stability: { type: 'object' },
            startup: { type: 'object' }
          }
        },
        failures: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-supply', 'simulation']
}));

export const pcbLayoutGuidelinesTask = defineTask('pcb-layout-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: PCB Layout Guidelines - ${args.supplyName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Power Supply PCB Layout Engineer',
      task: 'Design PCB layout for thermal and EMI performance',
      context: {
        supplyName: args.supplyName,
        topology: args.topology,
        magnetics: args.magnetics,
        semiconductors: args.semiconductors,
        constraints: args.constraints
      },
      instructions: [
        '1. Design power stage layout for minimal loop area',
        '2. Plan thermal management (heatsinks, copper area)',
        '3. Design input filter placement',
        '4. Plan output filter placement',
        '5. Route gate drive signals',
        '6. Design control circuit layout',
        '7. Plan isolation barrier (if required)',
        '8. Design safety spacing per standards',
        '9. Plan thermal vias and spreading',
        '10. Document layout guidelines'
      ],
      outputFormat: 'JSON object with PCB layout guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines'],
      properties: {
        guidelines: {
          type: 'object',
          properties: {
            powerStage: { type: 'object' },
            thermalManagement: { type: 'object' },
            emiConsiderations: { type: 'object' },
            safetySpacing: { type: 'object' }
          }
        },
        criticalLoops: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-supply', 'pcb-layout']
}));

export const testValidationTask = defineTask('test-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Test and Validation - ${args.supplyName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Power Supply Test Engineer',
      task: 'Test and validate power supply performance',
      context: {
        supplyName: args.supplyName,
        specifications: args.specifications,
        performanceSimulation: args.performanceSimulation,
        pcbLayout: args.pcbLayout
      },
      instructions: [
        '1. Define test plan and procedures',
        '2. Measure efficiency at multiple loads',
        '3. Measure line and load regulation',
        '4. Measure output ripple and noise',
        '5. Test transient response',
        '6. Test protection circuits (OCP, OVP, OTP)',
        '7. Measure thermal performance',
        '8. Test EMC pre-compliance',
        '9. Compare results to specifications',
        '10. Generate test report'
      ],
      outputFormat: 'JSON object with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'efficiency', 'summary'],
      properties: {
        results: {
          type: 'object',
          properties: {
            efficiency: { type: 'object' },
            regulation: { type: 'object' },
            ripple: { type: 'object' },
            transient: { type: 'object' },
            protection: { type: 'object' },
            thermal: { type: 'object' }
          }
        },
        efficiency: { type: 'string' },
        summary: { type: 'string' },
        bom: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'object' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'power-supply', 'testing', 'validation']
}));

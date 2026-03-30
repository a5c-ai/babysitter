/**
 * @process specializations/domains/science/electrical-engineering/highspeed-pcb-design
 * @description High-Speed PCB Design - Guide the design of PCBs for high-speed digital applications. Covers stack-up
 * design, impedance control, signal integrity, and power integrity considerations.
 * @inputs { boardName: string, signalRequirements: object, powerRequirements: object, constraints?: object }
 * @outputs { success: boolean, stackup: object, routingGuidelines: object, siAnalysis: object, piAnalysis: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/highspeed-pcb-design', {
 *   boardName: 'DDR4 Memory Interface',
 *   signalRequirements: { dataRate: '3200MT/s', impedance: { single: '50ohm', diff: '100ohm' } },
 *   powerRequirements: { rails: ['1.2V', '3.3V'], ripple: '<50mV' },
 *   constraints: { layers: 8, boardSize: '100x80mm' }
 * });
 *
 * @references
 * - IPC-2221 (Generic Standard on Printed Board Design)
 * - IPC-2223 (Sectional Design Standard for Flexible Printed Boards)
 * - IEEE Signal Integrity Guidelines
 * - JEDEC Memory Interface Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    boardName,
    signalRequirements,
    powerRequirements,
    constraints = {}
  } = inputs;

  // Phase 1: Define Board Requirements and Constraints
  const requirementsDefinition = await ctx.task(requirementsDefinitionTask, {
    boardName,
    signalRequirements,
    powerRequirements,
    constraints
  });

  // Phase 2: Design PCB Stack-Up for Impedance Control
  const stackupDesign = await ctx.task(stackupDesignTask, {
    boardName,
    requirements: requirementsDefinition.requirements,
    constraints
  });

  // Breakpoint: Review stack-up design
  await ctx.breakpoint({
    question: `Review stack-up design for ${boardName}. ${stackupDesign.layerCount} layers. Controlled impedance: ${stackupDesign.impedanceControlled}. Proceed?`,
    title: 'Stack-Up Review',
    context: {
      runId: ctx.runId,
      boardName,
      stackup: stackupDesign,
      files: [{
        path: `artifacts/phase2-stackup.json`,
        format: 'json',
        content: stackupDesign
      }]
    }
  });

  // Phase 3: Plan Critical Signal Routing and Layer Assignment
  const routingPlanning = await ctx.task(routingPlanningTask, {
    boardName,
    stackup: stackupDesign,
    signalRequirements: requirementsDefinition.requirements.signals
  });

  // Phase 4: Implement Length Matching for Differential Pairs
  const lengthMatching = await ctx.task(lengthMatchingTask, {
    boardName,
    routingPlan: routingPlanning.plan,
    signalRequirements: requirementsDefinition.requirements.signals
  });

  // Phase 5: Design Power Distribution Network (PDN)
  const pdnDesign = await ctx.task(pdnDesignTask, {
    boardName,
    stackup: stackupDesign,
    powerRequirements: requirementsDefinition.requirements.power
  });

  // Breakpoint: Review PDN design
  await ctx.breakpoint({
    question: `Review PDN design for ${boardName}. Target impedance: ${pdnDesign.targetImpedance}. Decoupling strategy defined. Proceed with EMI analysis?`,
    title: 'PDN Review',
    context: {
      runId: ctx.runId,
      pdn: pdnDesign,
      files: [{
        path: `artifacts/phase5-pdn.json`,
        format: 'json',
        content: pdnDesign
      }]
    }
  });

  // Phase 6: Apply EMI Mitigation Techniques
  const emiMitigation = await ctx.task(emiMitigationTask, {
    boardName,
    stackup: stackupDesign,
    routingPlan: routingPlanning.plan,
    signalRequirements: requirementsDefinition.requirements.signals
  });

  // Phase 7: Run Signal Integrity Simulations
  const siSimulation = await ctx.task(siSimulationTask, {
    boardName,
    stackup: stackupDesign,
    routingPlan: routingPlanning.plan,
    lengthMatching: lengthMatching,
    signalRequirements: requirementsDefinition.requirements.signals
  });

  // Quality Gate: SI must meet requirements
  if (!siSimulation.allChannelsPass) {
    await ctx.breakpoint({
      question: `SI simulation shows ${siSimulation.failingChannels.length} channels not meeting eye mask. Review and optimize?`,
      title: 'SI Issues',
      context: {
        runId: ctx.runId,
        failingChannels: siSimulation.failingChannels,
        recommendations: siSimulation.recommendations
      }
    });
  }

  // Phase 8: Generate Manufacturing Outputs and Documentation
  const manufacturingOutputs = await ctx.task(manufacturingOutputsTask, {
    boardName,
    stackup: stackupDesign,
    routingPlanning,
    pdnDesign,
    siSimulation,
    requirements: requirementsDefinition.requirements
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `High-speed PCB design complete for ${boardName}. SI: ${siSimulation.allChannelsPass ? 'PASS' : 'NEEDS REVIEW'}. PI: ${pdnDesign.meetsRequirements ? 'PASS' : 'NEEDS REVIEW'}. Approve for fabrication?`,
    title: 'Design Approval',
    context: {
      runId: ctx.runId,
      boardName,
      designSummary: manufacturingOutputs.summary,
      files: [
        { path: `artifacts/design-rules.json`, format: 'json', content: manufacturingOutputs.designRules },
        { path: `artifacts/pcb-report.md`, format: 'markdown', content: manufacturingOutputs.markdown }
      ]
    }
  });

  return {
    success: true,
    boardName,
    stackup: stackupDesign,
    routingGuidelines: {
      plan: routingPlanning.plan,
      lengthMatching: lengthMatching,
      emiMitigation: emiMitigation.guidelines
    },
    siAnalysis: siSimulation.results,
    piAnalysis: pdnDesign.analysis,
    documentation: manufacturingOutputs.documentation,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/highspeed-pcb-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const requirementsDefinitionTask = defineTask('requirements-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Definition - ${args.boardName}`,
  agent: {
    name: 'signal-integrity-engineer',
    prompt: {
      role: 'High-Speed PCB Design Engineer',
      task: 'Define board requirements and constraints',
      context: {
        boardName: args.boardName,
        signalRequirements: args.signalRequirements,
        powerRequirements: args.powerRequirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Define signal types and data rates',
        '2. Specify impedance requirements (single-ended, differential)',
        '3. Define timing budgets and skew requirements',
        '4. Specify power rail requirements and sequencing',
        '5. Define thermal constraints',
        '6. Specify board size and layer count constraints',
        '7. Identify critical interfaces (DDR, PCIe, USB, etc.)',
        '8. Define component placement constraints',
        '9. Specify manufacturing capabilities',
        '10. Document all requirements and constraints'
      ],
      outputFormat: 'JSON object with PCB requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements'],
      properties: {
        requirements: {
          type: 'object',
          properties: {
            signals: { type: 'object' },
            power: { type: 'object' },
            thermal: { type: 'object' },
            mechanical: { type: 'object' },
            manufacturing: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'pcb', 'highspeed', 'requirements']
}));

export const stackupDesignTask = defineTask('stackup-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Stack-Up Design - ${args.boardName}`,
  agent: {
    name: 'signal-integrity-engineer',
    prompt: {
      role: 'PCB Stack-Up Design Specialist',
      task: 'Design PCB stack-up for impedance control',
      context: {
        boardName: args.boardName,
        requirements: args.requirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Determine required layer count',
        '2. Plan signal and plane layer arrangement',
        '3. Select dielectric materials (Dk, Df)',
        '4. Calculate trace widths for target impedance',
        '5. Define prepreg and core thicknesses',
        '6. Verify return path continuity',
        '7. Plan power/ground plane splits',
        '8. Calculate controlled impedance values',
        '9. Verify manufacturability with fab house',
        '10. Document stack-up details'
      ],
      outputFormat: 'JSON object with stack-up design'
    },
    outputSchema: {
      type: 'object',
      required: ['layerCount', 'impedanceControlled'],
      properties: {
        layerCount: { type: 'number' },
        impedanceControlled: { type: 'boolean' },
        layers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              thickness: { type: 'string' },
              material: { type: 'string' }
            }
          }
        },
        impedanceValues: { type: 'object' },
        traceWidths: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'pcb', 'stackup']
}));

export const routingPlanningTask = defineTask('routing-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Routing Planning - ${args.boardName}`,
  agent: {
    name: 'signal-integrity-engineer',
    prompt: {
      role: 'High-Speed Routing Engineer',
      task: 'Plan critical signal routing and layer assignment',
      context: {
        boardName: args.boardName,
        stackup: args.stackup,
        signalRequirements: args.signalRequirements
      },
      instructions: [
        '1. Assign signals to appropriate layers',
        '2. Plan high-speed signal escape routing',
        '3. Define routing channels and keepouts',
        '4. Plan differential pair routing',
        '5. Define via strategy (through, blind, buried)',
        '6. Plan reference plane transitions',
        '7. Define coupling and crosstalk rules',
        '8. Plan breakout for BGA components',
        '9. Define trace spacing requirements',
        '10. Document routing guidelines'
      ],
      outputFormat: 'JSON object with routing plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            layerAssignments: { type: 'object' },
            routingChannels: { type: 'array', items: { type: 'object' } },
            viaStrategy: { type: 'object' },
            spacingRules: { type: 'object' }
          }
        },
        guidelines: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'pcb', 'routing']
}));

export const lengthMatchingTask = defineTask('length-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Length Matching - ${args.boardName}`,
  agent: {
    name: 'signal-integrity-engineer',
    prompt: {
      role: 'Signal Integrity Engineer',
      task: 'Implement length matching for differential pairs and buses',
      context: {
        boardName: args.boardName,
        routingPlan: args.routingPlan,
        signalRequirements: args.signalRequirements
      },
      instructions: [
        '1. Calculate timing budgets for each interface',
        '2. Define intra-pair skew requirements (P-N)',
        '3. Define inter-pair/byte lane matching requirements',
        '4. Design serpentine tuning patterns',
        '5. Specify tuning segment lengths',
        '6. Consider delay adder placement',
        '7. Verify phase matching for clocks',
        '8. Document matching requirements',
        '9. Create matching tables for CAD',
        '10. Verify against interface specifications'
      ],
      outputFormat: 'JSON object with length matching requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['matchingRules'],
      properties: {
        matchingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signalGroup: { type: 'string' },
              intraPairSkew: { type: 'string' },
              interPairMatch: { type: 'string' },
              referenceSignal: { type: 'string' }
            }
          }
        },
        tuningStrategy: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'pcb', 'length-matching']
}));

export const pdnDesignTask = defineTask('pdn-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: PDN Design - ${args.boardName}`,
  agent: {
    name: 'signal-integrity-engineer',
    prompt: {
      role: 'Power Integrity Engineer',
      task: 'Design power distribution network',
      context: {
        boardName: args.boardName,
        stackup: args.stackup,
        powerRequirements: args.powerRequirements
      },
      instructions: [
        '1. Define target impedance for each rail',
        '2. Design power plane shapes and splits',
        '3. Select decoupling capacitor values',
        '4. Plan capacitor placement (bulk, mid-freq, high-freq)',
        '5. Design via stitching for planes',
        '6. Plan power entry and distribution',
        '7. Design ferrites/inductors for isolation',
        '8. Analyze plane resonances',
        '9. Verify DC voltage drop',
        '10. Document PDN design'
      ],
      outputFormat: 'JSON object with PDN design'
    },
    outputSchema: {
      type: 'object',
      required: ['targetImpedance', 'meetsRequirements', 'analysis'],
      properties: {
        targetImpedance: { type: 'string' },
        meetsRequirements: { type: 'boolean' },
        decouplingStrategy: {
          type: 'object',
          properties: {
            capacitors: { type: 'array', items: { type: 'object' } },
            placement: { type: 'object' }
          }
        },
        planeDesign: { type: 'object' },
        analysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'pcb', 'pdn', 'power-integrity']
}));

export const emiMitigationTask = defineTask('emi-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: EMI Mitigation - ${args.boardName}`,
  agent: {
    name: 'signal-integrity-engineer',
    prompt: {
      role: 'EMC Design Engineer',
      task: 'Apply EMI mitigation techniques',
      context: {
        boardName: args.boardName,
        stackup: args.stackup,
        routingPlan: args.routingPlan,
        signalRequirements: args.signalRequirements
      },
      instructions: [
        '1. Identify potential EMI sources',
        '2. Design proper signal return paths',
        '3. Apply edge rate control where needed',
        '4. Design filtering for I/O interfaces',
        '5. Plan shielding if required',
        '6. Design proper grounding scheme',
        '7. Control plane edge radiation',
        '8. Minimize loop areas',
        '9. Plan cable/connector filtering',
        '10. Document EMI mitigation strategies'
      ],
      outputFormat: 'JSON object with EMI mitigation guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines'],
      properties: {
        guidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              technique: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        filteringDesign: { type: 'object' },
        groundingScheme: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'pcb', 'emi']
}));

export const siSimulationTask = defineTask('si-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: SI Simulation - ${args.boardName}`,
  agent: {
    name: 'signal-integrity-engineer',
    prompt: {
      role: 'Signal Integrity Simulation Engineer',
      task: 'Run signal integrity simulations',
      context: {
        boardName: args.boardName,
        stackup: args.stackup,
        routingPlan: args.routingPlan,
        lengthMatching: args.lengthMatching,
        signalRequirements: args.signalRequirements
      },
      instructions: [
        '1. Build transmission line models',
        '2. Include IBIS/SPICE models for drivers/receivers',
        '3. Simulate eye diagrams for high-speed signals',
        '4. Analyze crosstalk (NEXT, FEXT)',
        '5. Verify impedance and reflections',
        '6. Check timing with flight time simulation',
        '7. Analyze ISI and channel loss',
        '8. Verify against compliance masks',
        '9. Identify failing channels',
        '10. Provide optimization recommendations'
      ],
      outputFormat: 'JSON object with SI simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['allChannelsPass', 'results'],
      properties: {
        allChannelsPass: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            eyeDiagrams: { type: 'array', items: { type: 'object' } },
            crosstalk: { type: 'object' },
            reflections: { type: 'object' },
            timing: { type: 'object' }
          }
        },
        failingChannels: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'pcb', 'signal-integrity', 'simulation']
}));

export const manufacturingOutputsTask = defineTask('manufacturing-outputs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Manufacturing Outputs - ${args.boardName}`,
  agent: {
    name: 'signal-integrity-engineer',
    prompt: {
      role: 'PCB Manufacturing Documentation Specialist',
      task: 'Generate manufacturing outputs and documentation',
      context: {
        boardName: args.boardName,
        stackup: args.stackup,
        routingPlanning: args.routingPlanning,
        pdnDesign: args.pdnDesign,
        siSimulation: args.siSimulation,
        requirements: args.requirements
      },
      instructions: [
        '1. Generate fabrication drawing',
        '2. Create stack-up specification',
        '3. Document impedance control requirements',
        '4. Create assembly drawing',
        '5. Generate Gerber/ODB++ outputs',
        '6. Create drill files',
        '7. Generate pick-and-place data',
        '8. Document test requirements',
        '9. Create design rule summary',
        '10. Generate comprehensive design report'
      ],
      outputFormat: 'JSON object with manufacturing documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['designRules', 'documentation', 'summary'],
      properties: {
        designRules: {
          type: 'object',
          properties: {
            traceWidth: { type: 'object' },
            spacing: { type: 'object' },
            vias: { type: 'object' },
            impedance: { type: 'object' }
          }
        },
        documentation: {
          type: 'object',
          properties: {
            fabDrawing: { type: 'string' },
            stackupSpec: { type: 'object' },
            assemblyNotes: { type: 'array', items: { type: 'string' } }
          }
        },
        summary: { type: 'string' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'pcb', 'manufacturing', 'documentation']
}));

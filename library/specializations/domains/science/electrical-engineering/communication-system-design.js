/**
 * @process specializations/domains/science/electrical-engineering/communication-system-design
 * @description Communication System Design - Guide the design of digital communication systems including modulation,
 * demodulation, synchronization, and channel coding. Covers system-level design through implementation.
 * @inputs { systemName: string, communicationType: string, requirements: object, channelModel?: string }
 * @outputs { success: boolean, systemDesign: object, transmitter: object, receiver: object, performanceAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/communication-system-design', {
 *   systemName: 'IoT LPWAN Modem',
 *   communicationType: 'OFDM',
 *   requirements: { dataRate: '1Mbps', ber: '1e-6', bandwidth: '20MHz', range: '1km' },
 *   channelModel: 'Rayleigh-fading'
 * });
 *
 * @references
 * - IEEE 802.x Standards
 * - 3GPP Standards
 * - DVB Standards
 * - Digital Communications (Proakis)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    communicationType,
    requirements,
    channelModel = 'AWGN'
  } = inputs;

  // Phase 1: Define Communication System Requirements
  const requirementsDefinition = await ctx.task(requirementsDefinitionTask, {
    systemName,
    communicationType,
    requirements,
    channelModel
  });

  // Phase 2: Select Modulation Scheme
  const modulationSelection = await ctx.task(modulationSelectionTask, {
    systemName,
    requirements: requirementsDefinition.specifications,
    channelModel,
    communicationType
  });

  // Breakpoint: Review modulation selection
  await ctx.breakpoint({
    question: `Review modulation selection for ${systemName}. Selected: ${modulationSelection.scheme}. Spectral efficiency: ${modulationSelection.spectralEfficiency}. Proceed?`,
    title: 'Modulation Selection Review',
    context: {
      runId: ctx.runId,
      systemName,
      modulation: modulationSelection,
      files: [{
        path: `artifacts/phase2-modulation.json`,
        format: 'json',
        content: modulationSelection
      }]
    }
  });

  // Phase 3: Design Transmitter Chain
  const transmitterDesign = await ctx.task(transmitterDesignTask, {
    systemName,
    modulation: modulationSelection,
    requirements: requirementsDefinition.specifications
  });

  // Phase 4: Design Receiver Chain
  const receiverDesign = await ctx.task(receiverDesignTask, {
    systemName,
    modulation: modulationSelection,
    transmitter: transmitterDesign,
    requirements: requirementsDefinition.specifications,
    channelModel
  });

  // Breakpoint: Review TX/RX design
  await ctx.breakpoint({
    question: `Review transmitter and receiver designs for ${systemName}. Proceed with system simulation?`,
    title: 'TX/RX Design Review',
    context: {
      runId: ctx.runId,
      transmitter: transmitterDesign.summary,
      receiver: receiverDesign.summary,
      files: [
        { path: `artifacts/phase3-transmitter.json`, format: 'json', content: transmitterDesign },
        { path: `artifacts/phase4-receiver.json`, format: 'json', content: receiverDesign }
      ]
    }
  });

  // Phase 5: Simulate System Performance Over Channel Models
  const systemSimulation = await ctx.task(systemSimulationTask, {
    systemName,
    transmitter: transmitterDesign,
    receiver: receiverDesign,
    channelModel,
    requirements: requirementsDefinition.specifications
  });

  // Phase 6: Analyze BER vs SNR Curves
  const performanceAnalysis = await ctx.task(performanceAnalysisTask, {
    systemName,
    simulationResults: systemSimulation.results,
    modulation: modulationSelection,
    requirements: requirementsDefinition.specifications
  });

  // Quality Gate: Performance must meet requirements
  if (!performanceAnalysis.meetsRequirements) {
    await ctx.breakpoint({
      question: `Performance analysis shows requirements not met. Required BER: ${requirements.ber}, Achieved: ${performanceAnalysis.achievedBer}. Iterate design?`,
      title: 'Performance Gap',
      context: {
        runId: ctx.runId,
        gaps: performanceAnalysis.gaps,
        recommendations: performanceAnalysis.recommendations
      }
    });
  }

  // Phase 7: Implement on Target Platform
  const platformImplementation = await ctx.task(platformImplementationTask, {
    systemName,
    transmitter: transmitterDesign,
    receiver: receiverDesign,
    requirements: requirementsDefinition.specifications
  });

  // Phase 8: Validate with Over-the-Air Testing
  const otaValidation = await ctx.task(otaValidationTask, {
    systemName,
    implementation: platformImplementation,
    requirements: requirementsDefinition.specifications,
    performanceBaseline: performanceAnalysis.results
  });

  // Final Breakpoint: System Approval
  await ctx.breakpoint({
    question: `Communication system design complete for ${systemName}. BER at target SNR: ${performanceAnalysis.berAtTargetSnr}. OTA validation: ${otaValidation.passed ? 'PASSED' : 'FAILED'}. Approve?`,
    title: 'System Approval',
    context: {
      runId: ctx.runId,
      systemName,
      performance: performanceAnalysis.summary,
      otaResults: otaValidation.summary,
      files: [
        { path: `artifacts/system-design.json`, format: 'json', content: { transmitter: transmitterDesign, receiver: receiverDesign } },
        { path: `artifacts/system-report.md`, format: 'markdown', content: otaValidation.markdown }
      ]
    }
  });

  return {
    success: true,
    systemName,
    systemDesign: {
      modulation: modulationSelection,
      coding: transmitterDesign.coding,
      bandwidth: requirementsDefinition.specifications.bandwidth
    },
    transmitter: transmitterDesign,
    receiver: receiverDesign,
    performanceAnalysis: {
      berCurves: performanceAnalysis.berCurves,
      meetsRequirements: performanceAnalysis.meetsRequirements,
      snrRequired: performanceAnalysis.snrRequired
    },
    implementation: platformImplementation,
    validation: otaValidation.results,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/communication-system-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const requirementsDefinitionTask = defineTask('requirements-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Definition - ${args.systemName}`,
  agent: {
    name: 'communications-engineer',
    prompt: {
      role: 'Communications Systems Engineer',
      task: 'Define communication system requirements',
      context: {
        systemName: args.systemName,
        communicationType: args.communicationType,
        requirements: args.requirements,
        channelModel: args.channelModel
      },
      instructions: [
        '1. Define data rate requirements',
        '2. Specify bit error rate (BER) targets',
        '3. Define bandwidth constraints',
        '4. Specify power constraints and link budget',
        '5. Define latency requirements',
        '6. Characterize channel model and impairments',
        '7. Specify frequency band and regulations',
        '8. Define duplex mode (TDD/FDD)',
        '9. Specify multiple access requirements',
        '10. Document interface and interoperability requirements'
      ],
      outputFormat: 'JSON object with system requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications'],
      properties: {
        specifications: {
          type: 'object',
          properties: {
            dataRate: { type: 'string' },
            ber: { type: 'string' },
            bandwidth: { type: 'string' },
            snrRequired: { type: 'string' },
            latency: { type: 'string' },
            power: { type: 'object' },
            frequencyBand: { type: 'string' }
          }
        },
        linkBudget: { type: 'object' },
        channelCharacteristics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'communications', 'requirements']
}));

export const modulationSelectionTask = defineTask('modulation-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Modulation Selection - ${args.systemName}`,
  agent: {
    name: 'communications-engineer',
    prompt: {
      role: 'Digital Communications Specialist',
      task: 'Select optimal modulation scheme',
      context: {
        systemName: args.systemName,
        requirements: args.requirements,
        channelModel: args.channelModel,
        communicationType: args.communicationType
      },
      instructions: [
        '1. Evaluate candidate modulation schemes (BPSK, QPSK, QAM, OFDM, etc.)',
        '2. Calculate spectral efficiency for each scheme',
        '3. Analyze BER performance over target channel',
        '4. Consider peak-to-average power ratio (PAPR)',
        '5. Evaluate implementation complexity',
        '6. Consider synchronization requirements',
        '7. Analyze sensitivity to channel impairments',
        '8. Select optimal modulation with justification',
        '9. Define constellation and symbol mapping',
        '10. Document modulation parameters'
      ],
      outputFormat: 'JSON object with modulation selection'
    },
    outputSchema: {
      type: 'object',
      required: ['scheme', 'spectralEfficiency'],
      properties: {
        scheme: { type: 'string' },
        spectralEfficiency: { type: 'string' },
        constellation: { type: 'object' },
        parameters: {
          type: 'object',
          properties: {
            symbolRate: { type: 'string' },
            bitsPerSymbol: { type: 'number' },
            papr: { type: 'string' }
          }
        },
        alternatives: { type: 'array', items: { type: 'object' } },
        justification: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'communications', 'modulation']
}));

export const transmitterDesignTask = defineTask('transmitter-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Transmitter Design - ${args.systemName}`,
  agent: {
    name: 'communications-engineer',
    prompt: {
      role: 'RF/Digital Communications Engineer',
      task: 'Design transmitter chain (encoding, modulation, filtering)',
      context: {
        systemName: args.systemName,
        modulation: args.modulation,
        requirements: args.requirements
      },
      instructions: [
        '1. Design source coding/compression if needed',
        '2. Design channel coding (FEC) scheme',
        '3. Design interleaving strategy',
        '4. Implement symbol mapping and modulation',
        '5. Design pulse shaping filter',
        '6. Design upsampling and interpolation',
        '7. Implement OFDM processing if applicable',
        '8. Design pilot/training sequence insertion',
        '9. Specify power amplifier requirements',
        '10. Document transmitter signal flow'
      ],
      outputFormat: 'JSON object with transmitter design'
    },
    outputSchema: {
      type: 'object',
      required: ['coding', 'modulator', 'summary'],
      properties: {
        coding: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            rate: { type: 'string' },
            constraint: { type: 'string' }
          }
        },
        interleaver: { type: 'object' },
        modulator: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            symbolMapping: { type: 'string' }
          }
        },
        pulseShaping: {
          type: 'object',
          properties: {
            filterType: { type: 'string' },
            rolloff: { type: 'number' }
          }
        },
        pilots: { type: 'object' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'communications', 'transmitter']
}));

export const receiverDesignTask = defineTask('receiver-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Receiver Design - ${args.systemName}`,
  agent: {
    name: 'communications-engineer',
    prompt: {
      role: 'Digital Communications Receiver Engineer',
      task: 'Design receiver chain (synchronization, equalization, decoding)',
      context: {
        systemName: args.systemName,
        modulation: args.modulation,
        transmitter: args.transmitter,
        requirements: args.requirements,
        channelModel: args.channelModel
      },
      instructions: [
        '1. Design AGC and signal detection',
        '2. Design timing synchronization',
        '3. Design carrier frequency/phase recovery',
        '4. Design matched filter',
        '5. Design channel equalizer (ZF, MMSE, adaptive)',
        '6. Implement OFDM demodulation if applicable',
        '7. Design soft/hard decision demodulator',
        '8. Design de-interleaver',
        '9. Design channel decoder (Viterbi, LDPC, Turbo)',
        '10. Document receiver signal flow and algorithms'
      ],
      outputFormat: 'JSON object with receiver design'
    },
    outputSchema: {
      type: 'object',
      required: ['synchronization', 'equalizer', 'decoder', 'summary'],
      properties: {
        synchronization: {
          type: 'object',
          properties: {
            timing: { type: 'object' },
            carrier: { type: 'object' },
            frame: { type: 'object' }
          }
        },
        matchedFilter: { type: 'object' },
        equalizer: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            taps: { type: 'number' },
            algorithm: { type: 'string' }
          }
        },
        demodulator: { type: 'object' },
        decoder: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            algorithm: { type: 'string' },
            iterations: { type: 'number' }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'communications', 'receiver']
}));

export const systemSimulationTask = defineTask('system-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: System Simulation - ${args.systemName}`,
  agent: {
    name: 'communications-engineer',
    prompt: {
      role: 'Communications System Simulation Engineer',
      task: 'Simulate system performance over channel models',
      context: {
        systemName: args.systemName,
        transmitter: args.transmitter,
        receiver: args.receiver,
        channelModel: args.channelModel,
        requirements: args.requirements
      },
      instructions: [
        '1. Build end-to-end system simulation model',
        '2. Configure channel model (AWGN, Rayleigh, Rician)',
        '3. Add channel impairments (frequency offset, timing error)',
        '4. Run Monte Carlo simulations for BER',
        '5. Simulate across range of SNR values',
        '6. Test synchronization acquisition performance',
        '7. Evaluate equalizer convergence',
        '8. Measure throughput and latency',
        '9. Test with realistic channel profiles',
        '10. Document simulation methodology and results'
      ],
      outputFormat: 'JSON object with simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'object',
          properties: {
            berVsSnr: { type: 'array', items: { type: 'object' } },
            syncPerformance: { type: 'object' },
            equalizerPerformance: { type: 'object' },
            throughput: { type: 'string' },
            latency: { type: 'string' }
          }
        },
        channelConditions: { type: 'array', items: { type: 'object' } },
        methodology: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'communications', 'simulation']
}));

export const performanceAnalysisTask = defineTask('performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Performance Analysis - ${args.systemName}`,
  agent: {
    name: 'communications-engineer',
    prompt: {
      role: 'Communications Performance Analyst',
      task: 'Analyze BER vs SNR curves and system performance',
      context: {
        systemName: args.systemName,
        simulationResults: args.simulationResults,
        modulation: args.modulation,
        requirements: args.requirements
      },
      instructions: [
        '1. Plot BER vs Eb/N0 curves',
        '2. Compare to theoretical performance',
        '3. Calculate implementation loss',
        '4. Determine SNR required for target BER',
        '5. Analyze coding gain',
        '6. Evaluate diversity gain if applicable',
        '7. Assess performance margin',
        '8. Compare to requirements',
        '9. Identify performance gaps',
        '10. Provide recommendations for improvement'
      ],
      outputFormat: 'JSON object with performance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsRequirements', 'berCurves', 'snrRequired'],
      properties: {
        meetsRequirements: { type: 'boolean' },
        berCurves: {
          type: 'object',
          properties: {
            simulated: { type: 'array', items: { type: 'object' } },
            theoretical: { type: 'array', items: { type: 'object' } }
          }
        },
        snrRequired: { type: 'string' },
        berAtTargetSnr: { type: 'string' },
        achievedBer: { type: 'string' },
        implementationLoss: { type: 'string' },
        codingGain: { type: 'string' },
        gaps: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        results: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'communications', 'performance']
}));

export const platformImplementationTask = defineTask('platform-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Platform Implementation - ${args.systemName}`,
  agent: {
    name: 'communications-engineer',
    prompt: {
      role: 'SDR/FPGA Communications Developer',
      task: 'Implement communication system on target platform',
      context: {
        systemName: args.systemName,
        transmitter: args.transmitter,
        receiver: args.receiver,
        requirements: args.requirements
      },
      instructions: [
        '1. Select implementation platform (SDR, FPGA, DSP)',
        '2. Partition processing between hardware and software',
        '3. Implement fixed-point algorithms',
        '4. Implement transmitter processing chain',
        '5. Implement receiver processing chain',
        '6. Interface with RF frontend',
        '7. Implement control and configuration',
        '8. Optimize for real-time performance',
        '9. Verify implementation against simulation',
        '10. Document implementation architecture'
      ],
      outputFormat: 'JSON object with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'architecture'],
      properties: {
        platform: { type: 'string' },
        architecture: {
          type: 'object',
          properties: {
            txChain: { type: 'array', items: { type: 'string' } },
            rxChain: { type: 'array', items: { type: 'string' } },
            resources: { type: 'object' }
          }
        },
        fixedPointAnalysis: { type: 'object' },
        performanceVerification: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'communications', 'implementation']
}));

export const otaValidationTask = defineTask('ota-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: OTA Validation - ${args.systemName}`,
  agent: {
    name: 'communications-engineer',
    prompt: {
      role: 'RF Test Engineer',
      task: 'Validate system with over-the-air testing',
      context: {
        systemName: args.systemName,
        implementation: args.implementation,
        requirements: args.requirements,
        performanceBaseline: args.performanceBaseline
      },
      instructions: [
        '1. Set up OTA test environment',
        '2. Configure test equipment (signal generators, analyzers)',
        '3. Measure transmitter output (power, spectrum, EVM)',
        '4. Test receiver sensitivity',
        '5. Measure BER at various signal levels',
        '6. Test with channel emulator if available',
        '7. Verify synchronization performance',
        '8. Test interference immunity',
        '9. Compare to simulation baseline',
        '10. Document OTA test results'
      ],
      outputFormat: 'JSON object with OTA validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'results', 'summary'],
      properties: {
        passed: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            txTests: { type: 'array', items: { type: 'object' } },
            rxTests: { type: 'array', items: { type: 'object' } },
            berMeasurements: { type: 'array', items: { type: 'object' } }
          }
        },
        summary: { type: 'string' },
        deviationsFromSimulation: { type: 'array', items: { type: 'object' } },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'communications', 'validation', 'testing']
}));

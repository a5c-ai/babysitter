/**
 * @process specializations/ai-agents-conversational/entity-extraction-slot-filling
 * @description Entity Extraction and Slot Filling Implementation - Process for implementing entity extraction systems
 * with custom entity types, slot filling for dialogue state, entity linking, normalization, and composite entity handling.
 * @inputs { projectName?: string, entityTypes?: array, slotSchema?: object, approach?: string, outputDir?: string }
 * @outputs { success: boolean, entityModels: object, slotFillingLogic: object, normalizationRules: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/entity-extraction-slot-filling', {
 *   projectName: 'travel-booking-ner',
 *   entityTypes: ['destination', 'date', 'num_travelers', 'travel_class'],
 *   slotSchema: { destination: 'required', date: 'required', travelers: 'optional' }
 * });
 *
 * @references
 * - spaCy NER: https://spacy.io/usage/linguistic-features#named-entities
 * - Hugging Face NER: https://huggingface.co/docs/transformers/tasks/token_classification
 * - Rasa Entity Extraction: https://rasa.com/docs/rasa/nlu-training-data/#entities
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'entity-extractor',
    entityTypes = [],
    slotSchema = {},
    approach = 'transformer',
    outputDir = 'entity-extraction-output',
    enableLinking = true,
    enableNormalization = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Entity Extraction System Development for ${projectName}`);

  // ============================================================================
  // PHASE 1: ENTITY TYPE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining entity types');

  const entityDefinition = await ctx.task(entityTypeDefinitionTask, {
    projectName,
    entityTypes,
    slotSchema,
    outputDir
  });

  artifacts.push(...entityDefinition.artifacts);

  // ============================================================================
  // PHASE 2: TRAINING DATA ANNOTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating annotated training data');

  const annotatedData = await ctx.task(trainingDataAnnotationTask, {
    projectName,
    entityTypes: entityDefinition.entities,
    outputDir
  });

  artifacts.push(...annotatedData.artifacts);

  // ============================================================================
  // PHASE 3: NER MODEL TRAINING
  // ============================================================================

  ctx.log('info', 'Phase 3: Training NER model');

  const nerModel = await ctx.task(nerModelTrainingTask, {
    projectName,
    entityTypes: entityDefinition.entities,
    trainingData: annotatedData.dataset,
    approach,
    outputDir
  });

  artifacts.push(...nerModel.artifacts);

  // ============================================================================
  // PHASE 4: SLOT FILLING LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing slot filling logic');

  const slotFilling = await ctx.task(slotFillingImplementationTask, {
    projectName,
    slotSchema,
    entityTypes: entityDefinition.entities,
    outputDir
  });

  artifacts.push(...slotFilling.artifacts);

  // ============================================================================
  // PHASE 5: ENTITY LINKING
  // ============================================================================

  let entityLinking = null;
  if (enableLinking) {
    ctx.log('info', 'Phase 5: Implementing entity linking');

    entityLinking = await ctx.task(entityLinkingTask, {
      projectName,
      entityTypes: entityDefinition.entities,
      outputDir
    });

    artifacts.push(...entityLinking.artifacts);
  }

  // ============================================================================
  // PHASE 6: NORMALIZATION RULES
  // ============================================================================

  let normalization = null;
  if (enableNormalization) {
    ctx.log('info', 'Phase 6: Creating normalization rules');

    normalization = await ctx.task(normalizationRulesTask, {
      projectName,
      entityTypes: entityDefinition.entities,
      outputDir
    });

    artifacts.push(...normalization.artifacts);
  }

  // ============================================================================
  // PHASE 7: COMPOSITE ENTITY HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing composite entity handling');

  const compositeHandling = await ctx.task(compositeEntityTask, {
    projectName,
    entityTypes: entityDefinition.entities,
    slotSchema,
    outputDir
  });

  artifacts.push(...compositeHandling.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Entity extraction system ${projectName} complete. ${entityDefinition.entities.length} entity types. Review implementation?`,
    title: 'Entity Extraction Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        entityCount: entityDefinition.entities.length,
        slotCount: Object.keys(slotSchema).length,
        approach,
        enableLinking,
        enableNormalization
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    entityModels: nerModel.model,
    slotFillingLogic: slotFilling.logic,
    entityLinking: entityLinking ? entityLinking.linker : null,
    normalizationRules: normalization ? normalization.rules : null,
    compositeHandling: compositeHandling.handler,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/entity-extraction-slot-filling',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const entityTypeDefinitionTask = defineTask('entity-type-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define Entity Types - ${args.projectName}`,
  agent: {
    name: 'nlu-specialist',  // AG-CI-003: Implements NLU pipelines with intent classification and slot filling
    prompt: {
      role: 'Entity Designer',
      task: 'Define entity types and their properties',
      context: args,
      instructions: [
        '1. Define each entity type with description',
        '2. Identify built-in vs custom entities',
        '3. Define entity value constraints',
        '4. Create entity synonyms and variations',
        '5. Define composite entity patterns',
        '6. Map entities to slot schema',
        '7. Document entity examples',
        '8. Save entity definitions'
      ],
      outputFormat: 'JSON with entity definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'artifacts'],
      properties: {
        entities: { type: 'array' },
        synonyms: { type: 'object' },
        composites: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'entity', 'definition']
}));

export const trainingDataAnnotationTask = defineTask('training-data-annotation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Annotate Training Data - ${args.projectName}`,
  agent: {
    name: 'data-annotator',
    prompt: {
      role: 'NER Data Annotator',
      task: 'Create annotated training data for entity extraction',
      context: args,
      instructions: [
        '1. Generate sentences with entity mentions',
        '2. Annotate entity spans (start, end, label)',
        '3. Include diverse entity contexts',
        '4. Add negative examples (no entities)',
        '5. Handle overlapping entities',
        '6. Create train/test splits',
        '7. Validate annotation quality',
        '8. Export in appropriate format (BIO, JSON)'
      ],
      outputFormat: 'JSON with annotated dataset'
    },
    outputSchema: {
      type: 'object',
      required: ['dataset', 'artifacts'],
      properties: {
        dataset: { type: 'object' },
        datasetSize: { type: 'number' },
        annotationFormat: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'entity', 'annotation']
}));

export const nerModelTrainingTask = defineTask('ner-model-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Train NER Model - ${args.projectName}`,
  agent: {
    name: 'ner-trainer',
    prompt: {
      role: 'NER Model Trainer',
      task: 'Train named entity recognition model',
      context: args,
      instructions: [
        '1. Select base model (BERT, spaCy, etc.)',
        '2. Configure token classification head',
        '3. Prepare data in model format',
        '4. Train model with entity labels',
        '5. Evaluate on test set (precision, recall, F1)',
        '6. Analyze per-entity performance',
        '7. Export trained model',
        '8. Save model and metrics'
      ],
      outputFormat: 'JSON with trained model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'artifacts'],
      properties: {
        model: { type: 'object' },
        modelPath: { type: 'string' },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'entity', 'training']
}));

export const slotFillingImplementationTask = defineTask('slot-filling-implementation', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Slot Filling - ${args.projectName}`,
  skill: {
    name: 'entity-extraction-templates',  // SK-CI-003: Entity extraction templates for common entity types
    prompt: {
      role: 'Slot Filling Developer',
      task: 'Implement slot filling logic for dialogue state',
      context: args,
      instructions: [
        '1. Create slot data structure',
        '2. Map entities to slots',
        '3. Implement slot validation',
        '4. Handle slot updates and overwrites',
        '5. Implement required vs optional slots',
        '6. Create slot prompting logic',
        '7. Handle slot confirmation',
        '8. Save slot filling implementation'
      ],
      outputFormat: 'JSON with slot filling logic'
    },
    outputSchema: {
      type: 'object',
      required: ['logic', 'artifacts'],
      properties: {
        logic: { type: 'object' },
        slotCodePath: { type: 'string' },
        validationRules: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'entity', 'slot-filling']
}));

export const entityLinkingTask = defineTask('entity-linking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Entity Linking - ${args.projectName}`,
  agent: {
    name: 'linking-developer',
    prompt: {
      role: 'Entity Linking Developer',
      task: 'Implement entity linking to knowledge base',
      context: args,
      instructions: [
        '1. Define knowledge base schema',
        '2. Implement entity candidate generation',
        '3. Create entity disambiguation logic',
        '4. Handle entity not found cases',
        '5. Implement coreference resolution',
        '6. Create linking confidence scores',
        '7. Test linking accuracy',
        '8. Save entity linker'
      ],
      outputFormat: 'JSON with entity linker'
    },
    outputSchema: {
      type: 'object',
      required: ['linker', 'artifacts'],
      properties: {
        linker: { type: 'object' },
        linkerCodePath: { type: 'string' },
        knowledgeBase: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'entity', 'linking']
}));

export const normalizationRulesTask = defineTask('normalization-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Normalization Rules - ${args.projectName}`,
  agent: {
    name: 'normalization-developer',
    prompt: {
      role: 'Entity Normalization Developer',
      task: 'Create entity normalization rules',
      context: args,
      instructions: [
        '1. Define canonical forms for each entity type',
        '2. Create date/time normalization',
        '3. Create number normalization',
        '4. Handle unit conversions',
        '5. Create synonym resolution',
        '6. Handle abbreviations and acronyms',
        '7. Validate normalized values',
        '8. Save normalization rules'
      ],
      outputFormat: 'JSON with normalization rules'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'artifacts'],
      properties: {
        rules: { type: 'object' },
        rulesCodePath: { type: 'string' },
        canonicalForms: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'entity', 'normalization']
}));

export const compositeEntityTask = defineTask('composite-entity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Handle Composite Entities - ${args.projectName}`,
  agent: {
    name: 'composite-developer',
    prompt: {
      role: 'Composite Entity Developer',
      task: 'Implement composite entity handling',
      context: args,
      instructions: [
        '1. Define composite entity patterns',
        '2. Implement entity grouping logic',
        '3. Handle nested entities',
        '4. Create composite validation',
        '5. Handle partial composites',
        '6. Implement composite normalization',
        '7. Test composite extraction',
        '8. Save composite handler'
      ],
      outputFormat: 'JSON with composite handler'
    },
    outputSchema: {
      type: 'object',
      required: ['handler', 'artifacts'],
      properties: {
        handler: { type: 'object' },
        handlerCodePath: { type: 'string' },
        patterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'entity', 'composite']
}));

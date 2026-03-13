/**
 * @process specializations/mobile-development/ios-core-data-implementation
 * @description iOS Core Data Implementation - Implement local data persistence using Core Data for iOS applications
 * with proper data modeling, migrations, background contexts, and optional CloudKit synchronization.
 * @inputs { projectName: string, dataModel?: object, relationships?: array, migrationStrategy?: string, cloudKitSync?: boolean }
 * @outputs { success: boolean, dataModel: object, repository: object, migrations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/ios-core-data-implementation', {
 *   projectName: 'MyiOSApp',
 *   dataModel: { entities: ['User', 'Post', 'Comment'] },
 *   relationships: [{ from: 'User', to: 'Post', type: 'one-to-many' }],
 *   migrationStrategy: 'lightweight',
 *   cloudKitSync: false
 * });
 *
 * @references
 * - Core Data Documentation: https://developer.apple.com/documentation/coredata/
 * - NSPersistentContainer: https://developer.apple.com/documentation/coredata/nspersistentcontainer
 * - CloudKit Integration: https://developer.apple.com/documentation/coredata/mirroring_a_core_data_store_with_cloudkit
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    dataModel = { entities: [] },
    relationships = [],
    migrationStrategy = 'lightweight',
    cloudKitSync = false,
    performanceRequirements = {},
    outputDir = 'core-data-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Core Data Implementation: ${projectName}`);
  ctx.log('info', `Entities: ${dataModel.entities?.length || 0}, CloudKit Sync: ${cloudKitSync}`);

  // ============================================================================
  // PHASE 1: DATA MODEL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Core Data model');

  const modelDesign = await ctx.task(modelDesignTask, {
    projectName,
    dataModel,
    relationships,
    outputDir
  });

  artifacts.push(...modelDesign.artifacts);

  // ============================================================================
  // PHASE 2: XCDATAMODEL CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating .xcdatamodel file');

  const xcdatamodelCreation = await ctx.task(xcdatamodelTask, {
    projectName,
    modelDesign,
    outputDir
  });

  artifacts.push(...xcdatamodelCreation.artifacts);

  // ============================================================================
  // PHASE 3: NSMANAGEDOBJECT SUBCLASSES
  // ============================================================================

  ctx.log('info', 'Phase 3: Generating NSManagedObject subclasses');

  const managedObjectClasses = await ctx.task(managedObjectTask, {
    projectName,
    modelDesign,
    outputDir
  });

  artifacts.push(...managedObjectClasses.artifacts);

  // ============================================================================
  // PHASE 4: CORE DATA STACK SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up Core Data stack');

  const stackSetup = await ctx.task(stackSetupTask, {
    projectName,
    cloudKitSync,
    outputDir
  });

  artifacts.push(...stackSetup.artifacts);

  // ============================================================================
  // PHASE 5: CRUD OPERATIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing CRUD operations');

  const crudOperations = await ctx.task(crudOperationsTask, {
    projectName,
    modelDesign,
    managedObjectClasses,
    outputDir
  });

  artifacts.push(...crudOperations.artifacts);

  // ============================================================================
  // PHASE 6: FETCH REQUESTS AND PREDICATES
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating fetch requests and predicates');

  const fetchRequests = await ctx.task(fetchRequestsTask, {
    projectName,
    modelDesign,
    outputDir
  });

  artifacts.push(...fetchRequests.artifacts);

  // ============================================================================
  // PHASE 7: SORTING AND FILTERING
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing sorting and filtering');

  const sortingFiltering = await ctx.task(sortingFilteringTask, {
    projectName,
    modelDesign,
    fetchRequests,
    outputDir
  });

  artifacts.push(...sortingFiltering.artifacts);

  // ============================================================================
  // PHASE 8: BATCH OPERATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up batch operations for performance');

  const batchOperations = await ctx.task(batchOperationsTask, {
    projectName,
    performanceRequirements,
    outputDir
  });

  artifacts.push(...batchOperations.artifacts);

  // ============================================================================
  // PHASE 9: BACKGROUND CONTEXTS
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuring background contexts');

  const backgroundContexts = await ctx.task(backgroundContextsTask, {
    projectName,
    stackSetup,
    outputDir
  });

  artifacts.push(...backgroundContexts.artifacts);

  // ============================================================================
  // PHASE 10: MIGRATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 10: Implementing Core Data migration strategy');

  const migrationSetup = await ctx.task(migrationSetupTask, {
    projectName,
    migrationStrategy,
    modelDesign,
    outputDir
  });

  artifacts.push(...migrationSetup.artifacts);

  // Quality Gate: Data Model Review
  await ctx.breakpoint({
    question: `Core Data model designed for ${projectName} with ${modelDesign.entities.length} entities. Review data model and relationships?`,
    title: 'Data Model Review',
    context: {
      runId: ctx.runId,
      projectName,
      entities: modelDesign.entities,
      relationships: modelDesign.relationships,
      migrationStrategy,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: 'swift' }))
    }
  });

  // ============================================================================
  // PHASE 11: CLOUDKIT SYNC (OPTIONAL)
  // ============================================================================

  let cloudKitSetup = null;
  if (cloudKitSync) {
    ctx.log('info', 'Phase 11: Adding iCloud sync with CloudKit');

    cloudKitSetup = await ctx.task(cloudKitSetupTask, {
      projectName,
      stackSetup,
      outputDir
    });

    artifacts.push(...cloudKitSetup.artifacts);
  }

  // ============================================================================
  // PHASE 12: ERROR HANDLING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Implementing error handling and validation');

  const errorHandling = await ctx.task(errorHandlingTask, {
    projectName,
    modelDesign,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 13: DATA ACCESS LAYER
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating data access layer/repository pattern');

  const dataAccessLayer = await ctx.task(dataAccessLayerTask, {
    projectName,
    modelDesign,
    crudOperations,
    fetchRequests,
    outputDir
  });

  artifacts.push(...dataAccessLayer.artifacts);

  // ============================================================================
  // PHASE 14: UNIT TESTS
  // ============================================================================

  ctx.log('info', 'Phase 14: Writing tests for data operations');

  const unitTests = await ctx.task(unitTestsTask, {
    projectName,
    modelDesign,
    dataAccessLayer,
    outputDir
  });

  artifacts.push(...unitTests.artifacts);

  // ============================================================================
  // PHASE 15: PERFORMANCE PROFILING
  // ============================================================================

  ctx.log('info', 'Phase 15: Profiling and optimizing queries');

  const performanceProfiling = await ctx.task(performanceProfilingTask, {
    projectName,
    performanceRequirements,
    outputDir
  });

  artifacts.push(...performanceProfiling.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    dataModel: {
      entities: modelDesign.entities,
      relationships: modelDesign.relationships,
      attributes: modelDesign.attributes
    },
    coreDataStack: {
      containerName: stackSetup.containerName,
      cloudKitEnabled: cloudKitSync,
      backgroundContexts: backgroundContexts.contextTypes
    },
    repository: {
      pattern: 'repository',
      repositories: dataAccessLayer.repositories
    },
    migrations: {
      strategy: migrationStrategy,
      versions: migrationSetup.versions
    },
    testing: {
      testCount: unitTests.testCount,
      coverage: unitTests.coverage
    },
    performance: performanceProfiling.benchmarks,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/ios-core-data-implementation',
      timestamp: startTime,
      migrationStrategy,
      cloudKitSync
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const modelDesignTask = defineTask('model-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Data Model Design - ${args.projectName}`,
  agent: {
    name: 'ios-data-architect',
    prompt: {
      role: 'iOS Data Architect',
      task: 'Design Core Data model with entities, attributes, and relationships',
      context: {
        projectName: args.projectName,
        dataModel: args.dataModel,
        relationships: args.relationships,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define all entity names and purposes',
        '2. Design attributes with proper types',
        '3. Specify optional vs required attributes',
        '4. Define relationships and their types',
        '5. Specify inverse relationships',
        '6. Configure delete rules',
        '7. Add derived and transient attributes',
        '8. Define unique constraints',
        '9. Plan indexing strategy',
        '10. Document data model design'
      ],
      outputFormat: 'JSON with data model design'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'relationships', 'attributes', 'artifacts'],
      properties: {
        entities: { type: 'array', items: { type: 'object' } },
        relationships: { type: 'array', items: { type: 'object' } },
        attributes: { type: 'object' },
        indexes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'data-modeling']
}));

export const xcdatamodelTask = defineTask('xcdatamodel', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: XCDataModel Creation - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Core Data Developer',
      task: 'Create .xcdatamodel file in Xcode',
      context: {
        projectName: args.projectName,
        modelDesign: args.modelDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create .xcdatamodeld bundle',
        '2. Add entities with attributes',
        '3. Configure attribute types and defaults',
        '4. Set up relationships with inverses',
        '5. Configure delete rules',
        '6. Add fetch request templates',
        '7. Configure entity inheritance if needed',
        '8. Set up unique constraints',
        '9. Configure derived attributes',
        '10. Validate data model'
      ],
      outputFormat: 'JSON with xcdatamodel details'
    },
    outputSchema: {
      type: 'object',
      required: ['modelPath', 'artifacts'],
      properties: {
        modelPath: { type: 'string' },
        modelVersion: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'xcode']
}));

export const managedObjectTask = defineTask('managed-object', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: NSManagedObject Subclasses - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Core Data Developer',
      task: 'Generate NSManagedObject subclasses',
      context: {
        projectName: args.projectName,
        modelDesign: args.modelDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate NSManagedObject subclasses',
        '2. Create Core Data Properties extensions',
        '3. Add computed properties for convenience',
        '4. Implement custom accessors if needed',
        '5. Add validation methods',
        '6. Implement awakeFromInsert for defaults',
        '7. Add convenience initializers',
        '8. Create type-safe relationship accessors',
        '9. Implement Codable extension if needed',
        '10. Document entity classes'
      ],
      outputFormat: 'JSON with managed object classes'
    },
    outputSchema: {
      type: 'object',
      required: ['classes', 'artifacts'],
      properties: {
        classes: { type: 'array', items: { type: 'string' } },
        extensions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'nsmanagedobject']
}));

export const stackSetupTask = defineTask('stack-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Core Data Stack Setup - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Core Data Developer',
      task: 'Set up Core Data stack with NSPersistentContainer',
      context: {
        projectName: args.projectName,
        cloudKitSync: args.cloudKitSync,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create NSPersistentContainer or NSPersistentCloudKitContainer',
        '2. Configure store description',
        '3. Set up view context',
        '4. Configure merge policies',
        '5. Set up automatic merging',
        '6. Configure persistent store options',
        '7. Add error handling for store loading',
        '8. Create singleton/dependency injection pattern',
        '9. Configure history tracking if needed',
        '10. Document Core Data stack setup'
      ],
      outputFormat: 'JSON with stack setup'
    },
    outputSchema: {
      type: 'object',
      required: ['containerName', 'artifacts'],
      properties: {
        containerName: { type: 'string' },
        storeType: { type: 'string' },
        mergePolicy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'stack']
}));

export const crudOperationsTask = defineTask('crud-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: CRUD Operations - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Core Data Developer',
      task: 'Implement CRUD operations for all entities',
      context: {
        projectName: args.projectName,
        modelDesign: args.modelDesign,
        managedObjectClasses: args.managedObjectClasses,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement create operations for entities',
        '2. Implement read operations with fetch requests',
        '3. Implement update operations',
        '4. Implement delete operations',
        '5. Add save context with error handling',
        '6. Implement bulk operations',
        '7. Add relationship management methods',
        '8. Create async versions with async/await',
        '9. Implement transactional operations',
        '10. Document CRUD patterns'
      ],
      outputFormat: 'JSON with CRUD operations'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'artifacts'],
      properties: {
        operations: { type: 'object' },
        entityOperations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'crud']
}));

export const fetchRequestsTask = defineTask('fetch-requests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Fetch Requests - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Core Data Developer',
      task: 'Create fetch requests and predicates',
      context: {
        projectName: args.projectName,
        modelDesign: args.modelDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create NSFetchRequest for each entity',
        '2. Implement common predicates',
        '3. Create compound predicates',
        '4. Implement fetched results controller',
        '5. Configure fetch batch size',
        '6. Set up relationship prefetching',
        '7. Create fetch request templates',
        '8. Implement fetch limit and offset',
        '9. Add distinct results configuration',
        '10. Document fetch patterns'
      ],
      outputFormat: 'JSON with fetch requests'
    },
    outputSchema: {
      type: 'object',
      required: ['fetchRequests', 'predicates', 'artifacts'],
      properties: {
        fetchRequests: { type: 'array', items: { type: 'object' } },
        predicates: { type: 'array', items: { type: 'string' } },
        templates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'fetch']
}));

export const sortingFilteringTask = defineTask('sorting-filtering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Sorting and Filtering - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Core Data Developer',
      task: 'Implement sorting and filtering',
      context: {
        projectName: args.projectName,
        modelDesign: args.modelDesign,
        fetchRequests: args.fetchRequests,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create NSSortDescriptor configurations',
        '2. Implement multiple sort keys',
        '3. Create dynamic sorting helpers',
        '4. Implement filtering predicates',
        '5. Create search predicate builders',
        '6. Implement date range filtering',
        '7. Add case-insensitive searching',
        '8. Create relationship-based filters',
        '9. Implement aggregate queries',
        '10. Document sorting and filtering'
      ],
      outputFormat: 'JSON with sorting and filtering'
    },
    outputSchema: {
      type: 'object',
      required: ['sortDescriptors', 'filterPredicates', 'artifacts'],
      properties: {
        sortDescriptors: { type: 'array', items: { type: 'object' } },
        filterPredicates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'sorting']
}));

export const batchOperationsTask = defineTask('batch-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Batch Operations - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Core Data Performance Specialist',
      task: 'Set up batch operations for performance',
      context: {
        projectName: args.projectName,
        performanceRequirements: args.performanceRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement NSBatchInsertRequest',
        '2. Implement NSBatchUpdateRequest',
        '3. Implement NSBatchDeleteRequest',
        '4. Configure result types',
        '5. Handle context refresh after batch',
        '6. Implement progress tracking',
        '7. Add cancellation support',
        '8. Create batch operation utilities',
        '9. Implement chunked operations',
        '10. Document batch patterns'
      ],
      outputFormat: 'JSON with batch operations'
    },
    outputSchema: {
      type: 'object',
      required: ['batchOperations', 'artifacts'],
      properties: {
        batchOperations: { type: 'array', items: { type: 'string' } },
        performanceGains: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'batch', 'performance']
}));

export const backgroundContextsTask = defineTask('background-contexts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Background Contexts - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Core Data Concurrency Specialist',
      task: 'Configure background contexts for heavy operations',
      context: {
        projectName: args.projectName,
        stackSetup: args.stackSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create newBackgroundContext()',
        '2. Implement performBackgroundTask',
        '3. Configure parent-child contexts if needed',
        '4. Set up merge from background changes',
        '5. Implement thread-safe operations',
        '6. Add concurrency debugging',
        '7. Create background import utility',
        '8. Implement background save patterns',
        '9. Handle main context updates',
        '10. Document concurrency patterns'
      ],
      outputFormat: 'JSON with background contexts'
    },
    outputSchema: {
      type: 'object',
      required: ['contextTypes', 'artifacts'],
      properties: {
        contextTypes: { type: 'array', items: { type: 'string' } },
        concurrencyPatterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'concurrency']
}));

export const migrationSetupTask = defineTask('migration-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Migration Setup - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Core Data Migration Specialist',
      task: 'Implement Core Data migration strategy',
      context: {
        projectName: args.projectName,
        migrationStrategy: args.migrationStrategy,
        modelDesign: args.modelDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure lightweight migration',
        '2. Set up model versioning',
        '3. Create mapping models if needed',
        '4. Implement custom migration policies',
        '5. Add migration validation',
        '6. Create migration testing utilities',
        '7. Handle migration failures gracefully',
        '8. Implement progressive migration',
        '9. Add migration logging',
        '10. Document migration strategy'
      ],
      outputFormat: 'JSON with migration setup'
    },
    outputSchema: {
      type: 'object',
      required: ['versions', 'migrationPath', 'artifacts'],
      properties: {
        versions: { type: 'array', items: { type: 'string' } },
        migrationPath: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'migration']
}));

export const cloudKitSetupTask = defineTask('cloudkit-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: CloudKit Setup - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS CloudKit Specialist',
      task: 'Add iCloud sync with CloudKit',
      context: {
        projectName: args.projectName,
        stackSetup: args.stackSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure NSPersistentCloudKitContainer',
        '2. Set up CloudKit schema',
        '3. Configure container options for sync',
        '4. Handle CloudKit errors',
        '5. Implement conflict resolution',
        '6. Add sync status monitoring',
        '7. Configure sharing if needed',
        '8. Handle account changes',
        '9. Test sync across devices',
        '10. Document CloudKit integration'
      ],
      outputFormat: 'JSON with CloudKit setup'
    },
    outputSchema: {
      type: 'object',
      required: ['containerIdentifier', 'artifacts'],
      properties: {
        containerIdentifier: { type: 'string' },
        syncConfiguration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'cloudkit', 'sync']
}));

export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Error Handling - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Error Handling Specialist',
      task: 'Implement error handling and validation',
      context: {
        projectName: args.projectName,
        modelDesign: args.modelDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create custom error types',
        '2. Implement validation rules',
        '3. Handle save errors gracefully',
        '4. Implement rollback on failure',
        '5. Add validation before save',
        '6. Create error recovery mechanisms',
        '7. Implement validation UI feedback',
        '8. Add logging for debugging',
        '9. Handle constraint violations',
        '10. Document error handling patterns'
      ],
      outputFormat: 'JSON with error handling'
    },
    outputSchema: {
      type: 'object',
      required: ['errorTypes', 'validationRules', 'artifacts'],
      properties: {
        errorTypes: { type: 'array', items: { type: 'string' } },
        validationRules: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'error-handling']
}));

export const dataAccessLayerTask = defineTask('data-access-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Data Access Layer - ${args.projectName}`,
  skill: { name: 'ios-persistence' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Data Layer Architect',
      task: 'Create data access layer/repository pattern',
      context: {
        projectName: args.projectName,
        modelDesign: args.modelDesign,
        crudOperations: args.crudOperations,
        fetchRequests: args.fetchRequests,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define repository protocol',
        '2. Create repository implementations',
        '3. Implement unit of work pattern',
        '4. Add dependency injection support',
        '5. Create mock repositories for testing',
        '6. Implement caching layer',
        '7. Add async/await support',
        '8. Create Combine publishers',
        '9. Implement repository factory',
        '10. Document data access patterns'
      ],
      outputFormat: 'JSON with data access layer'
    },
    outputSchema: {
      type: 'object',
      required: ['repositories', 'artifacts'],
      properties: {
        repositories: { type: 'array', items: { type: 'string' } },
        protocols: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'repository']
}));

export const unitTestsTask = defineTask('unit-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Unit Tests - ${args.projectName}`,
  skill: { name: 'mobile-testing' },
  agent: {
    name: 'mobile-qa-expert',
    prompt: {
      role: 'iOS Test Engineer',
      task: 'Write tests for data operations',
      context: {
        projectName: args.projectName,
        modelDesign: args.modelDesign,
        dataAccessLayer: args.dataAccessLayer,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create in-memory test store',
        '2. Write CRUD operation tests',
        '3. Test fetch request results',
        '4. Test relationship handling',
        '5. Test validation rules',
        '6. Test batch operations',
        '7. Test background context operations',
        '8. Test migration paths',
        '9. Create test utilities and fixtures',
        '10. Configure test coverage'
      ],
      outputFormat: 'JSON with unit tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'coverage', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        coverage: { type: 'number' },
        testFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'testing']
}));

export const performanceProfilingTask = defineTask('performance-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Performance Profiling - ${args.projectName}`,
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Performance Engineer',
      task: 'Profile and optimize queries',
      context: {
        projectName: args.projectName,
        performanceRequirements: args.performanceRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Profile fetch request performance',
        '2. Analyze faulting behavior',
        '3. Optimize relationship loading',
        '4. Check for N+1 query issues',
        '5. Optimize predicate performance',
        '6. Analyze memory usage',
        '7. Profile batch operations',
        '8. Create performance benchmarks',
        '9. Implement query optimization',
        '10. Document performance findings'
      ],
      outputFormat: 'JSON with performance profiling'
    },
    outputSchema: {
      type: 'object',
      required: ['benchmarks', 'artifacts'],
      properties: {
        benchmarks: { type: 'object' },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'core-data', 'performance']
}));

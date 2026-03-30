/**
 * @process specializations/mobile-development/android-room-database
 * @description Android Room Database Integration - Implement local database with Room persistence library
 * including entities, DAOs, migrations, and reactive data access with Flow.
 * @inputs { appName: string, entities?: array, relationships?: array, migrationStrategy?: string }
 * @outputs { success: boolean, database: object, entities: array, daos: array, migrations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/android-room-database', {
 *   appName: 'MyAndroidApp',
 *   entities: ['User', 'Post', 'Comment'],
 *   relationships: [{ from: 'User', to: 'Post', type: 'one-to-many' }],
 *   migrationStrategy: 'manual'
 * });
 *
 * @references
 * - Room Documentation: https://developer.android.com/training/data-storage/room
 * - Room with Flow: https://developer.android.com/training/data-storage/room/async-queries
 * - Database Migration: https://developer.android.com/training/data-storage/room/migrating-db-versions
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    entities = [],
    relationships = [],
    migrationStrategy = 'manual',
    useKsp = true,
    outputDir = 'room-database'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Room Database Integration: ${appName}`);
  ctx.log('info', `Entities: ${entities.length}, Migration Strategy: ${migrationStrategy}`);

  // ============================================================================
  // PHASE 1: DEPENDENCIES SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Adding Room dependencies');

  const dependenciesSetup = await ctx.task(dependenciesSetupTask, {
    appName,
    useKsp,
    outputDir
  });

  artifacts.push(...dependenciesSetup.artifacts);

  // ============================================================================
  // PHASE 2: ENTITY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining Room entities');

  const entityDefinition = await ctx.task(entityDefinitionTask, {
    appName,
    entities,
    relationships,
    outputDir
  });

  artifacts.push(...entityDefinition.artifacts);

  // ============================================================================
  // PHASE 3: DAO IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Data Access Objects');

  const daoImplementation = await ctx.task(daoImplementationTask, {
    appName,
    entityDefinition,
    outputDir
  });

  artifacts.push(...daoImplementation.artifacts);

  // ============================================================================
  // PHASE 4: DATABASE CLASS
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating RoomDatabase class');

  const databaseClass = await ctx.task(databaseClassTask, {
    appName,
    entityDefinition,
    daoImplementation,
    outputDir
  });

  artifacts.push(...databaseClass.artifacts);

  // ============================================================================
  // PHASE 5: TYPE CONVERTERS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing TypeConverters');

  const typeConverters = await ctx.task(typeConvertersTask, {
    appName,
    entityDefinition,
    outputDir
  });

  artifacts.push(...typeConverters.artifacts);

  // ============================================================================
  // PHASE 6: RELATIONSHIPS
  // ============================================================================

  ctx.log('info', 'Phase 6: Handling entity relationships');

  const relationshipsSetup = await ctx.task(relationshipsSetupTask, {
    appName,
    relationships,
    entityDefinition,
    outputDir
  });

  artifacts.push(...relationshipsSetup.artifacts);

  // ============================================================================
  // PHASE 7: FLOW INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Adding Flow for reactive queries');

  const flowIntegration = await ctx.task(flowIntegrationTask, {
    appName,
    daoImplementation,
    outputDir
  });

  artifacts.push(...flowIntegration.artifacts);

  // ============================================================================
  // PHASE 8: REPOSITORY PATTERN
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing Repository pattern');

  const repositoryPattern = await ctx.task(repositoryPatternTask, {
    appName,
    daoImplementation,
    flowIntegration,
    outputDir
  });

  artifacts.push(...repositoryPattern.artifacts);

  // ============================================================================
  // PHASE 9: MIGRATIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up database migrations');

  const migrationsSetup = await ctx.task(migrationsSetupTask, {
    appName,
    migrationStrategy,
    databaseClass,
    outputDir
  });

  artifacts.push(...migrationsSetup.artifacts);

  // Quality Gate: Database Design Review
  await ctx.breakpoint({
    question: `Room database designed for ${appName} with ${entityDefinition.entities.length} entities. Migration strategy: ${migrationStrategy}. Review design?`,
    title: 'Database Design Review',
    context: {
      runId: ctx.runId,
      appName,
      entities: entityDefinition.entities,
      relationships: relationshipsSetup.relationships,
      migrationStrategy,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: 'kotlin' }))
    }
  });

  // ============================================================================
  // PHASE 10: PRE-POPULATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Database pre-population and seeding');

  const prePopulation = await ctx.task(prePopulationTask, {
    appName,
    databaseClass,
    outputDir
  });

  artifacts.push(...prePopulation.artifacts);

  // ============================================================================
  // PHASE 11: DEPENDENCY INJECTION
  // ============================================================================

  ctx.log('info', 'Phase 11: Integrating with Hilt/Dagger');

  const diIntegration = await ctx.task(diIntegrationTask, {
    appName,
    databaseClass,
    repositoryPattern,
    outputDir
  });

  artifacts.push(...diIntegration.artifacts);

  // ============================================================================
  // PHASE 12: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 12: Writing database tests');

  const databaseTests = await ctx.task(databaseTestsTask, {
    appName,
    entityDefinition,
    daoImplementation,
    migrationsSetup,
    outputDir
  });

  artifacts.push(...databaseTests.artifacts);

  // ============================================================================
  // PHASE 13: BACKUP AND EXPORT
  // ============================================================================

  ctx.log('info', 'Phase 13: Implementing backup and export');

  const backupExport = await ctx.task(backupExportTask, {
    appName,
    databaseClass,
    outputDir
  });

  artifacts.push(...backupExport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    appName,
    database: {
      name: databaseClass.databaseName,
      version: databaseClass.version,
      class: databaseClass.className
    },
    entities: entityDefinition.entities,
    daos: daoImplementation.daos,
    repositories: repositoryPattern.repositories,
    migrations: migrationsSetup.migrations,
    typeConverters: typeConverters.converters,
    testing: {
      testCount: databaseTests.testCount,
      coverage: databaseTests.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/android-room-database',
      timestamp: startTime,
      migrationStrategy,
      useKsp
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dependenciesSetupTask = defineTask('dependencies-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Dependencies Setup - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Build Configuration Specialist',
      task: 'Add Room dependencies to project',
      context: {
        appName: args.appName,
        useKsp: args.useKsp,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add Room runtime dependency',
        '2. Add Room KTX for Kotlin extensions',
        '3. Configure KSP or KAPT for annotation processing',
        '4. Add Room compiler dependency',
        '5. Add Room testing dependency',
        '6. Configure schema export',
        '7. Set up Room version from BOM',
        '8. Add coroutines dependency for Flow',
        '9. Configure compiler arguments',
        '10. Document dependency setup'
      ],
      outputFormat: 'JSON with dependencies'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'artifacts'],
      properties: {
        dependencies: { type: 'object' },
        processorType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'dependencies']
}));

export const entityDefinitionTask = defineTask('entity-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Entity Definition - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Room Developer',
      task: 'Define Room entities with @Entity annotation',
      context: {
        appName: args.appName,
        entities: args.entities,
        relationships: args.relationships,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create @Entity data classes',
        '2. Define @PrimaryKey with auto-generation',
        '3. Add @ColumnInfo for custom column names',
        '4. Configure indices with @Index',
        '5. Add foreign keys for relationships',
        '6. Define embedded objects with @Embedded',
        '7. Add @Ignore for non-persisted fields',
        '8. Configure default values',
        '9. Add validation constraints',
        '10. Document entity structure'
      ],
      outputFormat: 'JSON with entity definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'artifacts'],
      properties: {
        entities: { type: 'array', items: { type: 'object' } },
        indices: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'entities']
}));

export const daoImplementationTask = defineTask('dao-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: DAO Implementation - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Room Developer',
      task: 'Implement Data Access Objects with @Dao',
      context: {
        appName: args.appName,
        entityDefinition: args.entityDefinition,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create @Dao interfaces for each entity',
        '2. Implement @Insert with conflict strategy',
        '3. Implement @Update operations',
        '4. Implement @Delete operations',
        '5. Create @Query methods for custom queries',
        '6. Add Flow return types for reactive queries',
        '7. Implement parameterized queries',
        '8. Add @Transaction for multi-operation queries',
        '9. Implement pagination with Paging 3',
        '10. Document DAO methods'
      ],
      outputFormat: 'JSON with DAO implementations'
    },
    outputSchema: {
      type: 'object',
      required: ['daos', 'artifacts'],
      properties: {
        daos: { type: 'array', items: { type: 'object' } },
        queries: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'dao']
}));

export const databaseClassTask = defineTask('database-class', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Database Class - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Room Developer',
      task: 'Create RoomDatabase abstract class',
      context: {
        appName: args.appName,
        entityDefinition: args.entityDefinition,
        daoImplementation: args.daoImplementation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create abstract class extending RoomDatabase',
        '2. Add @Database annotation with entities',
        '3. Set database version',
        '4. Declare abstract DAO methods',
        '5. Create companion object with singleton',
        '6. Configure database builder',
        '7. Add fallback strategies',
        '8. Configure schema export location',
        '9. Add database callbacks',
        '10. Document database configuration'
      ],
      outputFormat: 'JSON with database class'
    },
    outputSchema: {
      type: 'object',
      required: ['databaseName', 'className', 'version', 'artifacts'],
      properties: {
        databaseName: { type: 'string' },
        className: { type: 'string' },
        version: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'database']
}));

export const typeConvertersTask = defineTask('type-converters', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Type Converters - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Room Developer',
      task: 'Implement TypeConverters for complex types',
      context: {
        appName: args.appName,
        entityDefinition: args.entityDefinition,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create TypeConverters class',
        '2. Add Date to Long converter',
        '3. Add List to JSON string converter',
        '4. Add enum converters',
        '5. Add custom object converters',
        '6. Register converters with @TypeConverters',
        '7. Handle null values',
        '8. Add UUID converter',
        '9. Create converter tests',
        '10. Document converter usage'
      ],
      outputFormat: 'JSON with type converters'
    },
    outputSchema: {
      type: 'object',
      required: ['converters', 'artifacts'],
      properties: {
        converters: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'type-converters']
}));

export const relationshipsSetupTask = defineTask('relationships-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Relationships - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Room Relationship Specialist',
      task: 'Handle entity relationships',
      context: {
        appName: args.appName,
        relationships: args.relationships,
        entityDefinition: args.entityDefinition,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure one-to-one relationships',
        '2. Configure one-to-many relationships',
        '3. Configure many-to-many with junction table',
        '4. Create @Relation annotations',
        '5. Implement data classes for relations',
        '6. Add @Embedded objects',
        '7. Configure cascade delete',
        '8. Create relationship queries',
        '9. Handle circular references',
        '10. Document relationship patterns'
      ],
      outputFormat: 'JSON with relationships'
    },
    outputSchema: {
      type: 'object',
      required: ['relationships', 'artifacts'],
      properties: {
        relationships: { type: 'array', items: { type: 'object' } },
        junctionTables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'relationships']
}));

export const flowIntegrationTask = defineTask('flow-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Flow Integration - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Reactive Programming Specialist',
      task: 'Add Flow for reactive database queries',
      context: {
        appName: args.appName,
        daoImplementation: args.daoImplementation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Return Flow from DAO queries',
        '2. Configure Flow for observable queries',
        '3. Handle Flow in ViewModel',
        '4. Convert Flow to LiveData if needed',
        '5. Implement Flow operators',
        '6. Handle Flow errors',
        '7. Add distinctUntilChanged',
        '8. Implement Flow transformations',
        '9. Test Flow queries',
        '10. Document Flow patterns'
      ],
      outputFormat: 'JSON with Flow integration'
    },
    outputSchema: {
      type: 'object',
      required: ['flowQueries', 'artifacts'],
      properties: {
        flowQueries: { type: 'array', items: { type: 'string' } },
        operators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'flow', 'reactive']
}));

export const repositoryPatternTask = defineTask('repository-pattern', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Repository Pattern - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Architecture Specialist',
      task: 'Implement Repository pattern for data access',
      context: {
        appName: args.appName,
        daoImplementation: args.daoImplementation,
        flowIntegration: args.flowIntegration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Repository interfaces',
        '2. Implement Repository classes',
        '3. Inject DAO dependencies',
        '4. Expose Flow for reactive data',
        '5. Add business logic layer',
        '6. Implement caching strategies',
        '7. Handle offline-first data',
        '8. Create mapper functions',
        '9. Add error handling',
        '10. Document repository patterns'
      ],
      outputFormat: 'JSON with repository pattern'
    },
    outputSchema: {
      type: 'object',
      required: ['repositories', 'artifacts'],
      properties: {
        repositories: { type: 'array', items: { type: 'object' } },
        interfaces: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'repository']
}));

export const migrationsSetupTask = defineTask('migrations-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Migrations - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Database Migration Specialist',
      task: 'Set up database migrations',
      context: {
        appName: args.appName,
        migrationStrategy: args.migrationStrategy,
        databaseClass: args.databaseClass,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Migration objects',
        '2. Write SQL migration scripts',
        '3. Add migrations to database builder',
        '4. Configure auto-migration (Room 2.4+)',
        '5. Handle destructive migration fallback',
        '6. Test migration paths',
        '7. Export schema for validation',
        '8. Create migration testing utilities',
        '9. Handle complex migrations',
        '10. Document migration strategy'
      ],
      outputFormat: 'JSON with migrations'
    },
    outputSchema: {
      type: 'object',
      required: ['migrations', 'artifacts'],
      properties: {
        migrations: { type: 'array', items: { type: 'object' } },
        autoMigrations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'migrations']
}));

export const prePopulationTask = defineTask('pre-population', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Pre-population - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Room Developer',
      task: 'Database pre-population and seeding',
      context: {
        appName: args.appName,
        databaseClass: args.databaseClass,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create pre-packaged database',
        '2. Implement createFromAsset',
        '3. Add RoomDatabase.Callback',
        '4. Seed data in onCreate',
        '5. Handle first-launch population',
        '6. Create seed data files',
        '7. Implement conditional seeding',
        '8. Add progress tracking',
        '9. Handle seeding errors',
        '10. Document pre-population'
      ],
      outputFormat: 'JSON with pre-population'
    },
    outputSchema: {
      type: 'object',
      required: ['seedingStrategy', 'artifacts'],
      properties: {
        seedingStrategy: { type: 'string' },
        seedFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'seeding']
}));

export const diIntegrationTask = defineTask('di-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: DI Integration - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Dependency Injection Specialist',
      task: 'Integrate with Hilt/Dagger',
      context: {
        appName: args.appName,
        databaseClass: args.databaseClass,
        repositoryPattern: args.repositoryPattern,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Database module for Hilt',
        '2. Provide database singleton',
        '3. Provide DAO instances',
        '4. Provide Repository implementations',
        '5. Configure scopes',
        '6. Add qualifiers if needed',
        '7. Handle multi-database setup',
        '8. Provide test database',
        '9. Document DI setup',
        '10. Create DI tests'
      ],
      outputFormat: 'JSON with DI integration'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'artifacts'],
      properties: {
        modules: { type: 'array', items: { type: 'string' } },
        provides: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'hilt', 'di']
}));

export const databaseTestsTask = defineTask('database-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Database Tests - ${args.appName}`,
  skill: { name: 'mobile-testing' },
  agent: {
    name: 'mobile-qa-expert',
    prompt: {
      role: 'Android Test Engineer',
      task: 'Write database tests',
      context: {
        appName: args.appName,
        entityDefinition: args.entityDefinition,
        daoImplementation: args.daoImplementation,
        migrationsSetup: args.migrationsSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up in-memory database for tests',
        '2. Write DAO unit tests',
        '3. Test CRUD operations',
        '4. Test queries with conditions',
        '5. Test relationships',
        '6. Test migrations with MigrationTestHelper',
        '7. Test type converters',
        '8. Test Flow emissions',
        '9. Configure test coverage',
        '10. Document testing patterns'
      ],
      outputFormat: 'JSON with database tests'
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
  labels: ['mobile', 'android', 'room', 'testing']
}));

export const backupExportTask = defineTask('backup-export', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Backup and Export - ${args.appName}`,
  skill: { name: 'android-room' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Data Management Specialist',
      task: 'Implement backup and export functionality',
      context: {
        appName: args.appName,
        databaseClass: args.databaseClass,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement database backup',
        '2. Create restore functionality',
        '3. Export data to JSON/CSV',
        '4. Import data from files',
        '5. Handle backup encryption',
        '6. Configure auto-backup',
        '7. Implement cloud backup',
        '8. Add progress callbacks',
        '9. Handle backup errors',
        '10. Document backup/export'
      ],
      outputFormat: 'JSON with backup/export'
    },
    outputSchema: {
      type: 'object',
      required: ['backupMethods', 'exportFormats', 'artifacts'],
      properties: {
        backupMethods: { type: 'array', items: { type: 'string' } },
        exportFormats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'room', 'backup', 'export']
}));

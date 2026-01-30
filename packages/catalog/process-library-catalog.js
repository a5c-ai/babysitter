/**
 * @process packages/catalog/process-library-catalog
 * @description Full-stack Next.js catalog application for browsing the babysitter process library
 * Provides search, filter, sort, pagination, analytics dashboard, markdown rendering with code highlighting,
 * frontmatter parsing, and process file AST extraction.
 * @inputs { projectName: string, outputDir: string, targetQuality?: number }
 * @outputs { success: boolean, routes: array, components: array, apiEndpoints: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Process Library Catalog Process
 *
 * Builds a comprehensive catalog application for the babysitter process library with:
 * - GitHub Primer design system + Tailwind + shadcn/ui
 * - SQLite-based file system index for fast search
 * - Markdown rendering with syntax highlighting
 * - Frontmatter and JSDoc parsing
 * - Analytics dashboard
 * - Quality-gated iterative development
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the catalog project
 * @param {string} inputs.outputDir - Output directory for the catalog app
 * @param {number} inputs.targetQuality - Target quality score (0-100)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result
 */
export async function process(inputs, ctx) {
  const {
    projectName = 'process-library-catalog',
    outputDir = 'packages/catalog',
    targetQuality = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Process Library Catalog: ${projectName}`);

  // ============================================================================
  // PHASE 1: PROJECT SETUP & FOUNDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up Next.js project with design system');

  const projectSetup = await ctx.task(projectSetupTask, {
    projectName,
    outputDir,
    designSystem: 'github-primer',
    styling: 'tailwind-shadcn'
  });

  artifacts.push(...(projectSetup.artifacts || []));

  // ============================================================================
  // PHASE 2: DATA LAYER - INDEXING & PARSING
  // ============================================================================

  ctx.log('info', 'Phase 2: Building data layer with SQLite indexing');

  // 2a: Create the file parsers
  const parsersResult = await ctx.task(createParsersTask, {
    projectName,
    outputDir,
    fileTypes: ['AGENT.md', 'SKILL.md', '.js-process', 'domain', 'specialization']
  });

  artifacts.push(...(parsersResult.artifacts || []));

  // 2b: Create SQLite schema and indexer
  const indexerResult = await ctx.task(createIndexerTask, {
    projectName,
    outputDir,
    parsers: parsersResult,
    libraryPaths: [
      'plugins/babysitter/skills/babysit/process/specializations',
      'plugins/babysitter/skills/babysit/process/methodologies'
    ]
  });

  artifacts.push(...(indexerResult.artifacts || []));

  // Breakpoint: Review data layer design
  await ctx.breakpoint({
    question: `Data layer design complete: ${parsersResult.parsers?.length || 5} parsers, SQLite schema ready. Approve to proceed with API layer?`,
    title: 'Data Layer Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${outputDir}/lib/parsers/index.ts`, format: 'code', language: 'typescript', label: 'Parsers' },
        { path: `${outputDir}/lib/db/schema.ts`, format: 'code', language: 'typescript', label: 'DB Schema' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: API LAYER
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating API routes');

  const apiResult = await ctx.task(createApiRoutesTask, {
    projectName,
    outputDir,
    indexer: indexerResult,
    features: ['search', 'filter', 'sort', 'pagination', 'detail', 'analytics']
  });

  artifacts.push(...(apiResult.artifacts || []));

  // ============================================================================
  // PHASE 4: UI COMPONENTS
  // ============================================================================

  ctx.log('info', 'Phase 4: Building UI components');

  // 4a: Base components (design system integration)
  const baseComponentsResult = await ctx.task(createBaseComponentsTask, {
    projectName,
    outputDir,
    designSystem: 'github-primer'
  });

  artifacts.push(...(baseComponentsResult.artifacts || []));

  // 4b: Catalog components (search, list, detail views)
  const catalogComponentsResult = await ctx.task(createCatalogComponentsTask, {
    projectName,
    outputDir,
    entityTypes: ['process', 'domain', 'specialization', 'skill', 'agent']
  });

  artifacts.push(...(catalogComponentsResult.artifacts || []));

  // 4c: Markdown renderer with code highlighting
  const markdownResult = await ctx.task(createMarkdownRendererTask, {
    projectName,
    outputDir,
    features: ['frontmatter', 'codeHighlight', 'linkRewriting']
  });

  artifacts.push(...(markdownResult.artifacts || []));

  // ============================================================================
  // PHASE 5: PAGES & ROUTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating pages and routing');

  const pagesResult = await ctx.task(createPagesTask, {
    projectName,
    outputDir,
    pages: [
      { route: '/', name: 'Dashboard', description: 'Analytics dashboard with metrics' },
      { route: '/processes', name: 'Processes', description: 'Process files catalog' },
      { route: '/processes/[id]', name: 'Process Detail', description: 'Process detail view' },
      { route: '/domains', name: 'Domains', description: 'Domain hierarchy browser' },
      { route: '/domains/[slug]', name: 'Domain Detail', description: 'Domain detail view' },
      { route: '/specializations', name: 'Specializations', description: 'Specializations catalog' },
      { route: '/specializations/[slug]', name: 'Specialization Detail', description: 'Specialization detail' },
      { route: '/skills', name: 'Skills', description: 'Skills catalog with search' },
      { route: '/skills/[slug]', name: 'Skill Detail', description: 'Skill detail view' },
      { route: '/agents', name: 'Agents', description: 'Agents catalog with search' },
      { route: '/agents/[slug]', name: 'Agent Detail', description: 'Agent detail view' },
      { route: '/search', name: 'Search', description: 'Global search across all entities' }
    ]
  });

  artifacts.push(...(pagesResult.artifacts || []));

  // Breakpoint: Review UI and routes
  await ctx.breakpoint({
    question: `UI layer complete: ${pagesResult.pages?.length || 12} pages, ${catalogComponentsResult.components?.length || 10} components. Approve to proceed with dashboard?`,
    title: 'UI Layer Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${outputDir}/app/page.tsx`, format: 'code', language: 'typescript', label: 'Dashboard Page' },
        { path: `${outputDir}/components/catalog/SearchBar.tsx`, format: 'code', language: 'typescript', label: 'Search Bar' }
      ]
    }
  });

  // ============================================================================
  // PHASE 6: ANALYTICS DASHBOARD
  // ============================================================================

  ctx.log('info', 'Phase 6: Building analytics dashboard');

  const dashboardResult = await ctx.task(createDashboardTask, {
    projectName,
    outputDir,
    metrics: [
      'totalProcesses',
      'totalDomains',
      'totalSpecializations',
      'totalSkills',
      'totalAgents',
      'processesByMethodology',
      'skillsByCategory',
      'agentsByDomain',
      'recentlyModified'
    ]
  });

  artifacts.push(...(dashboardResult.artifacts || []));

  // ============================================================================
  // PHASE 7: INTEGRATION & TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Integration and testing');

  // 7a: End-to-end integration
  const integrationResult = await ctx.task(integrateComponentsTask, {
    projectName,
    outputDir,
    components: [projectSetup, parsersResult, indexerResult, apiResult, baseComponentsResult, catalogComponentsResult, pagesResult, dashboardResult]
  });

  artifacts.push(...(integrationResult.artifacts || []));

  // 7b: Verification loop
  let qualityScore = 0;
  let iteration = 0;
  const maxIterations = 3;

  while (qualityScore < targetQuality && iteration < maxIterations) {
    iteration++;

    // Run quality checks in parallel
    const [buildResult, lintResult, typeCheckResult] = await ctx.parallel.all([
      () => ctx.task(buildCheckTask, { outputDir }),
      () => ctx.task(lintCheckTask, { outputDir }),
      () => ctx.task(typeCheckTask, { outputDir })
    ]);

    // Score the implementation
    const scoringResult = await ctx.task(qualityScoringTask, {
      projectName,
      outputDir,
      buildResult,
      lintResult,
      typeCheckResult,
      iteration,
      targetQuality
    });

    qualityScore = scoringResult.overallScore;

    if (qualityScore < targetQuality && iteration < maxIterations) {
      // Fix issues
      await ctx.task(fixIssuesTask, {
        outputDir,
        issues: scoringResult.issues,
        iteration
      });
    }
  }

  // ============================================================================
  // PHASE 8: FINAL POLISH
  // ============================================================================

  ctx.log('info', 'Phase 8: Final polish and documentation');

  const polishResult = await ctx.task(finalPolishTask, {
    projectName,
    outputDir,
    qualityScore
  });

  artifacts.push(...(polishResult.artifacts || []));

  // Final breakpoint
  await ctx.breakpoint({
    question: `Catalog application complete. Quality: ${qualityScore}/${targetQuality}. Ready to finalize?`,
    title: 'Final Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${outputDir}/README.md`, format: 'markdown', label: 'README' },
        { path: `${outputDir}/package.json`, format: 'code', language: 'json', label: 'Package' }
      ]
    }
  });

  const endTime = ctx.now();

  return {
    success: qualityScore >= targetQuality * 0.9,
    projectName,
    outputDir,
    qualityScore,
    targetQuality,
    iterations: iteration,
    routes: pagesResult.pages?.map(p => p.route) || [],
    components: [
      ...(baseComponentsResult.components || []),
      ...(catalogComponentsResult.components || [])
    ],
    apiEndpoints: apiResult.endpoints || [],
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'packages/catalog/process-library-catalog',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectSetupTask = defineTask('catalog-project-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Next.js project: ${args.projectName}`,
  agent: {
    name: 'nextjs-developer',
    prompt: {
      role: 'Senior Next.js Developer',
      task: 'Initialize Next.js 14+ project with App Router, TypeScript, Tailwind CSS, and shadcn/ui',
      context: args,
      instructions: [
        '1. Create Next.js 14+ project with App Router in the specified output directory',
        '2. Configure TypeScript with strict settings',
        '3. Install and configure Tailwind CSS with GitHub Primer color palette',
        '4. Install and configure shadcn/ui components',
        '5. Set up ESLint and Prettier',
        '6. Configure path aliases (@/ for src)',
        '7. Create initial folder structure: app/, components/, lib/, types/',
        '8. Set up environment variables template',
        '9. Configure next.config.js for the catalog app',
        '10. Create base layout with GitHub Primer styling'
      ],
      outputFormat: 'JSON with projectPath, configuration, dependencies, artifacts (array of created files)'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'configuration', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        configuration: { type: 'object' },
        dependencies: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['setup', 'nextjs', 'foundation']
}));

export const createParsersTask = defineTask('create-parsers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create file parsers for catalog',
  agent: {
    name: 'parser-developer',
    prompt: {
      role: 'TypeScript Developer specializing in parsing and AST extraction',
      task: 'Create parsers for AGENT.md, SKILL.md, process .js files, and directory structure',
      context: args,
      instructions: [
        '1. Create YAML frontmatter parser for .md files (using gray-matter)',
        '2. Create markdown content parser with section extraction',
        '3. Create JSDoc parser for .js process files (@process, @description, @inputs, @outputs)',
        '4. Create AST parser for extracting defineTask calls and exports from process files',
        '5. Create directory structure parser for domains/specializations hierarchy',
        '6. Create unified parser interface that returns typed results',
        '7. Handle error cases gracefully with meaningful error messages',
        '8. Export TypeScript types for all parsed entities',
        '9. Create parser tests for edge cases',
        '10. Document parser usage and expected file formats'
      ],
      outputFormat: 'JSON with parsers (array), types (array), artifacts (array of created files)'
    },
    outputSchema: {
      type: 'object',
      required: ['parsers', 'artifacts'],
      properties: {
        parsers: { type: 'array', items: { type: 'string' } },
        types: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['parsers', 'data-layer']
}));

export const createIndexerTask = defineTask('create-indexer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create SQLite indexer for catalog',
  agent: {
    name: 'database-developer',
    prompt: {
      role: 'Database Developer specializing in SQLite and full-text search',
      task: 'Create SQLite schema and indexer for the process library catalog',
      context: args,
      instructions: [
        '1. Design SQLite schema for: processes, domains, specializations, skills, agents',
        '2. Add relationships: specialization->domain, skill->specialization, agent->specialization',
        '3. Create full-text search indexes (FTS5) for name, description, content fields',
        '4. Create indexer service that scans library paths and populates database',
        '5. Implement incremental update based on file modification times',
        '6. Create query builder with filter, sort, pagination support',
        '7. Use better-sqlite3 for sync operations or sql.js for browser compatibility',
        '8. Store parsed frontmatter as JSON columns',
        '9. Create database initialization and migration utilities',
        '10. Add index rebuild command for CLI usage'
      ],
      outputFormat: 'JSON with schema (object), tables (array), indexes (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'tables', 'artifacts'],
      properties: {
        schema: { type: 'object' },
        tables: { type: 'array', items: { type: 'string' } },
        indexes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['database', 'indexer', 'data-layer']
}));

export const createApiRoutesTask = defineTask('create-api-routes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create API routes for catalog',
  agent: {
    name: 'api-developer',
    prompt: {
      role: 'Next.js API Developer',
      task: 'Create API route handlers for catalog CRUD and search operations',
      context: args,
      instructions: [
        '1. Create /api/search route with full-text search across all entities',
        '2. Create /api/processes route with list, filter, sort, pagination',
        '3. Create /api/processes/[id] route for process detail',
        '4. Create /api/domains route for domain hierarchy',
        '5. Create /api/specializations route with filter by domain',
        '6. Create /api/skills route with filter by specialization, category',
        '7. Create /api/agents route with filter by specialization, expertise',
        '8. Create /api/analytics route for dashboard metrics',
        '9. Create /api/reindex route to trigger database rebuild',
        '10. Add proper error handling and response typing'
      ],
      outputFormat: 'JSON with endpoints (array of route definitions), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'artifacts'],
      properties: {
        endpoints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['api', 'routes']
}));

export const createBaseComponentsTask = defineTask('create-base-components', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create base UI components',
  agent: {
    name: 'frontend-developer',
    prompt: {
      role: 'React/Next.js Frontend Developer with design system expertise',
      task: 'Create base UI components with GitHub Primer styling',
      context: args,
      instructions: [
        '1. Configure Tailwind with GitHub Primer color tokens',
        '2. Create Header component with navigation and search',
        '3. Create Sidebar component for catalog navigation',
        '4. Create Footer component',
        '5. Create Card component for entity display',
        '6. Create Badge/Tag components for metadata display',
        '7. Create Pagination component',
        '8. Create Loading skeletons',
        '9. Create Empty state components',
        '10. Create Breadcrumb component for navigation context'
      ],
      outputFormat: 'JSON with components (array of names), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ui', 'components', 'design-system']
}));

export const createCatalogComponentsTask = defineTask('create-catalog-components', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create catalog-specific components',
  agent: {
    name: 'frontend-developer',
    prompt: {
      role: 'React/Next.js Frontend Developer',
      task: 'Create catalog-specific components for browsing and viewing entities',
      context: args,
      instructions: [
        '1. Create SearchBar with autocomplete and filters',
        '2. Create EntityList generic component for all entity types',
        '3. Create EntityCard for each type (process, skill, agent, etc.)',
        '4. Create FilterPanel with checkboxes, dropdowns for filtering',
        '5. Create SortDropdown for sorting options',
        '6. Create DetailView components for each entity type',
        '7. Create RelatedItems component for showing associations',
        '8. Create MetadataDisplay for frontmatter/metadata',
        '9. Create TreeView for domain/specialization hierarchy',
        '10. Create QuickActions for common operations'
      ],
      outputFormat: 'JSON with components (array of names), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ui', 'components', 'catalog']
}));

export const createMarkdownRendererTask = defineTask('create-markdown-renderer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create markdown renderer with code highlighting',
  agent: {
    name: 'frontend-developer',
    prompt: {
      role: 'React Developer specializing in content rendering',
      task: 'Create markdown renderer with frontmatter display and syntax highlighting',
      context: args,
      instructions: [
        '1. Install and configure react-markdown with remark/rehype plugins',
        '2. Add syntax highlighting using rehype-highlight or shiki',
        '3. Create FrontmatterDisplay component for YAML metadata',
        '4. Handle internal links and rewrite them for the catalog',
        '5. Style code blocks with GitHub-style theme',
        '6. Add copy-to-clipboard for code blocks',
        '7. Support tables, task lists, and other GFM features',
        '8. Create responsive images and media handling',
        '9. Add anchor links for headings',
        '10. Create table of contents generation'
      ],
      outputFormat: 'JSON with components (array), plugins (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'string' } },
        plugins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ui', 'markdown', 'rendering']
}));

export const createPagesTask = defineTask('create-pages', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create catalog pages',
  agent: {
    name: 'nextjs-developer',
    prompt: {
      role: 'Next.js App Router Developer',
      task: 'Create all catalog pages using Next.js App Router',
      context: args,
      instructions: [
        '1. Create dashboard page (/) with metrics and quick links',
        '2. Create processes list page with search and filters',
        '3. Create process detail page with parsed content display',
        '4. Create domains hierarchy page',
        '5. Create domain detail page with child specializations',
        '6. Create specializations list page',
        '7. Create specialization detail page with skills/agents',
        '8. Create skills catalog page with category filters',
        '9. Create skill detail page with markdown content',
        '10. Create agents catalog page with expertise filters',
        '11. Create agent detail page with full profile',
        '12. Create global search page with faceted results'
      ],
      outputFormat: 'JSON with pages (array of route objects), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['pages', 'artifacts'],
      properties: {
        pages: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pages', 'routing']
}));

export const createDashboardTask = defineTask('create-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create analytics dashboard',
  agent: {
    name: 'frontend-developer',
    prompt: {
      role: 'Dashboard/Visualization Developer',
      task: 'Create analytics dashboard with metrics and charts',
      context: args,
      instructions: [
        '1. Create MetricCard component for key stats',
        '2. Display total counts: processes, domains, specializations, skills, agents',
        '3. Create bar chart for processes by methodology',
        '4. Create pie chart for skills by category',
        '5. Create treemap for agents by domain',
        '6. Create recent activity feed (recently modified files)',
        '7. Create quick navigation links to each section',
        '8. Add responsive grid layout',
        '9. Use recharts or similar for visualizations',
        '10. Add loading states and error handling'
      ],
      outputFormat: 'JSON with components (array), metrics (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'metrics', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'string' } },
        metrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dashboard', 'analytics']
}));

export const integrateComponentsTask = defineTask('integrate-components', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate all components',
  agent: {
    name: 'fullstack-developer',
    prompt: {
      role: 'Full-Stack Developer',
      task: 'Integrate all components and ensure they work together',
      context: args,
      instructions: [
        '1. Wire up API routes to database queries',
        '2. Connect pages to API endpoints',
        '3. Set up React Query or SWR for data fetching',
        '4. Configure proper error boundaries',
        '5. Set up loading states across the app',
        '6. Configure navigation and routing',
        '7. Set up initial database population on first run',
        '8. Test all entity detail pages with real data',
        '9. Verify search functionality works end-to-end',
        '10. Ensure all links and associations work correctly'
      ],
      outputFormat: 'JSON with integrations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['integrations', 'artifacts'],
      properties: {
        integrations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['integration']
}));

export const buildCheckTask = defineTask('build-check', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run build check',
  shell: {
    command: `cd ${args.outputDir} && npm run build 2>&1 || true`,
    timeout: 120000
  },
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'build']
}));

export const lintCheckTask = defineTask('lint-check', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run lint check',
  shell: {
    command: `cd ${args.outputDir} && npm run lint 2>&1 || true`,
    timeout: 60000
  },
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'lint']
}));

export const typeCheckTask = defineTask('type-check', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run type check',
  shell: {
    command: `cd ${args.outputDir} && npx tsc --noEmit 2>&1 || true`,
    timeout: 60000
  },
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'types']
}));

export const qualityScoringTask = defineTask('quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality scoring (iteration ${args.iteration})`,
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Quality Assurance Engineer',
      task: 'Score the implementation quality and identify issues',
      context: args,
      instructions: [
        '1. Review build output for errors and warnings',
        '2. Review lint results for code quality issues',
        '3. Review type check results for TypeScript errors',
        '4. Calculate overall quality score (0-100)',
        '5. List specific issues that need fixing',
        '6. Prioritize issues by severity'
      ],
      outputFormat: 'JSON with overallScore (number), issues (array), recommendations (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'issues'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'scoring']
}));

export const fixIssuesTask = defineTask('fix-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix issues (iteration ${args.iteration})`,
  agent: {
    name: 'bug-fixer',
    prompt: {
      role: 'Developer',
      task: 'Fix the identified issues',
      context: args,
      instructions: [
        '1. Review each issue in priority order',
        '2. Fix TypeScript errors first',
        '3. Fix lint errors second',
        '4. Fix build errors third',
        '5. Verify fixes do not introduce new issues'
      ],
      outputFormat: 'JSON with fixed (array of issue IDs), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'artifacts'],
      properties: {
        fixed: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fixes']
}));

export const finalPolishTask = defineTask('final-polish', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final polish and documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer and Developer',
      task: 'Add final polish and documentation',
      context: args,
      instructions: [
        '1. Create comprehensive README.md',
        '2. Add inline code comments where helpful',
        '3. Create setup instructions',
        '4. Document API endpoints',
        '5. Add scripts to package.json for common operations',
        '6. Ensure consistent code formatting',
        '7. Add .env.example with required variables',
        '8. Create CONTRIBUTING.md if needed'
      ],
      outputFormat: 'JSON with documentation (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['documentation', 'polish']
}));

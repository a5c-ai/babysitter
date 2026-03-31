/**
 * @process cradle/project-install
 * @description Set up babysitter for a project - research repo, process mining, interview, build profile, install tools, configure CI/CD, update CLAUDE.md
 * @inputs { projectRoot?: string, isNewProject?: boolean, additionalContext?: string }
 * @outputs { success: boolean, profile: object, toolsInstalled: array, claudeMdUpdated: boolean, gitignoreConfigured: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Project Installation & Onboarding Process
 *
 * Cradle Methodology: Check existing state -> Research project -> Process mining ->
 *   Interview -> Build profile -> Select tools -> CI/CD integration -> CLAUDE.md ->
 *   New project handling -> Review -> Save
 *
 * Phases:
 * 1.  Check Existing Setup - Read existing project profile for idempotent updates
 * 2.  Project Research (parallel) - Analyze repo structure, code, docs, tools, services, workflows
 * 3.  Process Mining - Analyze git history for patterns, rules, evolution, bottlenecks
 * 4.  User Interview - Breakpoint to gather project goals, pain points, team, workflow, CI/CD needs
 * 5.  Profile Building - Merge existing profile + research + mining + interview into ProjectProfile
 * 6.  Tool Selection - Recommend best skills, agents, processes for the project
 * 7.  CI/CD Integration (conditional) - Optionally configure CI/CD integration
 * 8.  CLAUDE.md Updates - Add babysitter processes and instructions to CLAUDE.md
 * 9.  New Project Handling (conditional) - Scaffold new/empty projects with vision capture
 * 9d. Gitignore Configuration - Let user choose which .a5c paths to add to .gitignore
 * 10. Review Breakpoint - Show complete profile for approval
 * 11. Save - Write profile to .a5c/project-profile.json and .a5c/project-profile.md
 *
 * @param {Object} inputs - Process inputs
 * @param {string} [inputs.projectRoot] - Path to the project root (defaults to cwd)
 * @param {boolean} [inputs.isNewProject] - Force new-project handling (auto-detected if not set)
 * @param {string} [inputs.additionalContext] - Extra context about the project or needs
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with profile, tools installed, and CLAUDE.md status
 */
export async function process(inputs, ctx) {
  const {
    projectRoot = null,
    isNewProject = null,
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: CHECK EXISTING SETUP
  // ============================================================================

  const existingSetup = await ctx.task(checkExistingSetupTask, {
    projectRoot,
    additionalContext
  });

  const detectedNewProject = isNewProject !== null
    ? isNewProject
    : existingSetup.isNewProject;

  // ============================================================================
  // PHASE 2: PROJECT RESEARCH (PARALLEL)
  // ============================================================================

  const [repoStructure, toolsAndServices] = await ctx.parallel.all([
    () => ctx.task(analyzeRepoTask, {
      projectRoot,
      existingProfile: existingSetup.existingProfile
    }),
    () => ctx.task(analyzeToolsServicesTask, {
      projectRoot,
      existingProfile: existingSetup.existingProfile
    })
  ]);

  // ============================================================================
  // PHASE 3: PROCESS MINING
  // ============================================================================

  const miningResult = await ctx.task(processMiningTask, {
    projectRoot,
    existingProfile: existingSetup.existingProfile,
    repoStructure
  });

  // ============================================================================
  // PHASE 4: USER INTERVIEW
  // ============================================================================

  const interviewResult = await ctx.breakpoint({
    question: [
      'Welcome to babysitter project setup! Please tell us about this project so we can customize your experience.',
      '',
      existingSetup.existingProfile
        ? '(We found an existing project profile. Your answers will be merged with the current settings.)'
        : '(This is a fresh project setup. We will create the project profile from scratch.)',
      '',
      'We have already analyzed the repository and mined its git history. Now we need your input.',
      '',
      'Please provide the following information:',
      '',
      '1. **Project Goals**: What are the primary goals and objectives for this project?',
      '2. **Pain Points**: What are your biggest pain points in the current workflow? (e.g., slow CI, flaky tests, manual deploys)',
      '3. **Team Structure**: Who works on this project? What are the roles and responsibilities?',
      '4. **Workflow Preferences**:',
      '   - Branch strategy: gitflow / trunk-based / feature-branches / other',
      '   - Code review process: PRs required / optional / pair programming',
      '   - Release cadence: continuous / weekly / scheduled / manual',
      '5. **CI/CD Needs**: Do you want babysitter integrated into your CI/CD pipeline? If so, which events should trigger it? (e.g., PR opened, push to main, release)',
      '6. **External Integrations**: What external tools and services do you use? (e.g., Jira, Slack, Datadog, PagerDuty, Sentry)',
      '7. **Conventions**: Any specific coding conventions, naming rules, or standards you want enforced?',
      '8. **Babysitter Preferences**: How autonomous should babysitter be for this project? (supervised / semi-autonomous / autonomous)',
      '',
      'Answer as much or as little as you like. We will fill in sensible defaults for anything you skip.'
    ].join('\n'),
    title: 'Project Onboarding Interview',
    context: {
      runId: ctx.runId,
      existingProfile: existingSetup.existingProfile ? 'Found existing profile - will merge updates' : 'No existing profile found',
      isNewProject: detectedNewProject,
      researchSummary: {
        repoAnalyzed: true,
        toolsAnalyzed: true,
        gitHistoryMined: true
      }
    }
  });
  if (!interviewResult.approved) {
    return { success: false, reason: 'User cancelled during project onboarding interview', feedback: interviewResult.response || interviewResult.feedback, metadata: { processId: 'cradle/project-install', timestamp: ctx.now() } };
  }

  // ============================================================================
  // PHASE 5: PROFILE BUILDING
  // ============================================================================

  const profileResult = await ctx.task(buildProfileTask, {
    existingProfile: existingSetup.existingProfile,
    repoStructure,
    toolsAndServices,
    miningResult,
    additionalContext,
    projectRoot,
    isNewProject: detectedNewProject
  });

  // ============================================================================
  // PHASE 6: TOOL SELECTION
  // ============================================================================

  const toolSelection = await ctx.task(toolSelectionTask, {
    profile: profileResult.profile,
    repoStructure,
    toolsAndServices,
    miningResult
  });

  // ============================================================================
  // PHASE 7: CI/CD INTEGRATION (CONDITIONAL)
  // ============================================================================

  let cicdResult = null;

  const cicdApproval = await ctx.breakpoint({
    question: [
      'Would you like to set up CI/CD integration for babysitter?',
      '',
      'This will configure babysitter to run automatically in your CI/CD pipeline.',
      '',
      profileResult.profile.cicd?.provider
        ? `We detected you are using **${profileResult.profile.cicd.provider}**. We can add babysitter steps to your existing pipeline.`
        : 'We did not detect an existing CI/CD provider. We can help you set one up.',
      '',
      'Options:',
      '- **Yes**: Configure CI/CD integration (we will create/update pipeline config files)',
      '- **No**: Skip CI/CD setup for now (you can always run project-install again later)',
      '',
      'If yes, please also indicate which events should trigger babysitter:',
      '- PR opened / updated',
      '- Push to main / release branches',
      '- Scheduled (cron)',
      '- Manual trigger'
    ].join('\n'),
    title: 'CI/CD Integration',
    context: {
      runId: ctx.runId,
      detectedProvider: profileResult.profile.cicd?.provider || 'none',
      existingPipelines: profileResult.profile.cicd?.pipelines || []
    }
  });

  if (cicdApproval.approved) {
    cicdResult = await ctx.task(configureCicdTask, {
      profile: profileResult.profile,
      toolSelection,
      projectRoot
    });
  }

  // ============================================================================
  // PHASE 8: CLAUDE.MD UPDATES
  // ============================================================================

  const claudeMdResult = await ctx.task(updateClaudeMdTask, {
    profile: profileResult.profile,
    toolSelection,
    cicdResult,
    projectRoot
  });

  // ============================================================================
  // PHASE 9: NEW PROJECT HANDLING (CONDITIONAL)
  // ============================================================================

  let newProjectResult = null;
  if (detectedNewProject) {
    // Phase 9a: Scaffold the new project (vision, structure, research)
    newProjectResult = await ctx.task(scaffoldNewProjectTask, {
      profile: profileResult.profile,
      toolSelection,
      projectRoot
    });

    // Phase 9b: Breakpoint — review vision document and requirements before proceeding
    const scaffoldReview = await ctx.breakpoint({
      question: [
        '**New Project Scaffolding — Review Required**',
        '',
        'The following artifacts have been generated for your new project:',
        '',
        '1. **PROJECT.md** — Vision document with project goals and scope',
        '2. **ROADMAP.md** — Phased milestones and delivery plan',
        '3. **Requirements** — v1 requirements derived from your goals',
        '4. **Directory structure** — Initial project layout',
        '',
        'Please review these artifacts carefully:',
        '- Does the vision accurately capture your intent?',
        '- Are the requirements scoped correctly for v1 vs future work?',
        '- Does the roadmap have realistic milestones?',
        '',
        'Provide corrections or approve to continue.'
      ].join('\n'),
      title: 'Vision, Requirements & Roadmap Review',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/project-vision.md', format: 'markdown', label: 'Vision Document' },
          { path: 'artifacts/project-roadmap.md', format: 'markdown', label: 'Roadmap' },
          { path: 'artifacts/project-requirements-v1.md', format: 'markdown', label: 'Requirements v1' }
        ]
      }
    });
    if (!scaffoldReview.approved) {
      return { success: false, reason: 'User rejected new project scaffolding at review gate', feedback: scaffoldReview.response || scaffoldReview.feedback, metadata: { processId: 'cradle/project-install', timestamp: ctx.now() } };
    }
  }

  // ============================================================================
  // PHASE 9c: INITIALIZE .a5c/package.json + QUALITY GATES
  // ============================================================================

  await ctx.task(initializeA5cInfraTask, {
    projectRoot,
    profile: profileResult.profile,
    toolSelection,
    isNewProject: detectedNewProject
  });

  // ============================================================================
  // PHASE 9d: GITIGNORE CONFIGURATION
  // ============================================================================

  const gitignoreApproval = await ctx.breakpoint({
    question: [
      '**Configure .gitignore for babysitter files**',
      '',
      'Babysitter generates run metadata, logs, and process files in the `.a5c/` directory.',
      'Would you like to add these to `.gitignore` to keep your repository clean?',
      '',
      'Options (each level includes the previous):',
      '- **Nothing** — Do not modify .gitignore (only add credential exclusions for security)',
      '- **Logs only** (Recommended) — Ignore `.a5c/logs/`',
      '- **Logs + Runs** — Ignore `.a5c/logs/` and `.a5c/runs/`',
      '- **Entire .a5c** — Ignore the entire `.a5c/` directory',
      '',
      'Note: `.a5c/creds.env` and `.a5c/creds.env.tmp.*` are always added to `.gitignore` for security, regardless of your choice.'
    ].join('\n'),
    title: '.gitignore Configuration',
    context: {
      runId: ctx.runId,
      currentGitignore: 'Will be read during task execution'
    }
  });

  let gitignoreResult = null;
  if (gitignoreApproval.approved) {
    gitignoreResult = await ctx.task(configureGitignoreTask, {
      projectRoot
    });
  }

  // ============================================================================
  // PHASE 10: REVIEW BREAKPOINT
  // ============================================================================

  const profileReview = await ctx.breakpoint({
    question: [
      'Please review the complete project profile before we save it.',
      '',
      `**Project**: ${profileResult.profile.projectName || 'Unknown'}`,
      `**Description**: ${profileResult.profile.description || 'Not set'}`,
      `**Tech Stack**: ${formatTechStack(profileResult.profile.techStack)}`,
      `**Architecture**: ${profileResult.profile.architecture?.pattern || 'Not determined'}`,
      `**Team Members**: ${(profileResult.profile.team || []).map(m => m.name).join(', ') || 'None specified'}`,
      `**Goals**: ${(profileResult.profile.goals || []).map(g => g.description).join('; ') || 'None set'}`,
      '',
      `**Recommended Skills**: ${(toolSelection.recommendedSkills || []).join(', ') || 'Default set'}`,
      `**Recommended Processes**: ${(toolSelection.recommendedProcesses || []).join(', ') || 'Default set'}`,
      `**CI/CD Configured**: ${cicdResult ? (cicdResult.configured ? 'Yes' : 'Skipped') : 'Skipped'}`,
      `**CLAUDE.md Updated**: ${claudeMdResult?.updated ? 'Yes' : 'No'}`,
      `**Gitignore Configured**: ${gitignoreResult ? (gitignoreResult.configured ? gitignoreResult.level : 'Skipped') : 'Skipped'}`,
      detectedNewProject ? `**New Project Scaffolding**: ${newProjectResult ? 'Applied' : 'Pending'}` : '',
      '',
      `**Profile Path**: ${projectRoot || '.'}/.a5c/project-profile.json`,
      '',
      'Approve to save this profile, or provide corrections.'
    ].join('\n'),
    title: 'Project Profile Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/project-profile-preview.json', format: 'json', label: 'Full Profile JSON' },
        { path: 'artifacts/tool-recommendations.json', format: 'json', label: 'Tool Recommendations' },
        ...(claudeMdResult?.updated ? [{ path: 'artifacts/claude-md-additions.md', format: 'markdown', label: 'CLAUDE.md Additions' }] : []),
        ...(detectedNewProject ? [{ path: 'artifacts/new-project-scaffold.md', format: 'markdown', label: 'New Project Scaffold' }] : [])
      ]
    }
  });
  if (!profileReview.approved) {
    return { success: false, reason: 'User rejected project profile at review gate', feedback: profileReview.response || profileReview.feedback, metadata: { processId: 'cradle/project-install', timestamp: ctx.now() } };
  }

  // ============================================================================
  // PHASE 11: SAVE
  // ============================================================================

  const saveResult = await ctx.task(saveProfileTask, {
    profile: profileResult.profile,
    toolSelection,
    cicdResult,
    claudeMdResult,
    newProjectResult,
    projectRoot
  });

  return {
    success: true,
    profile: saveResult.savedProfile,
    toolsInstalled: toolSelection.recommendedSkills || [],
    claudeMdUpdated: claudeMdResult?.updated || false,
    gitignoreConfigured: gitignoreResult?.configured || false,
    cicdConfigured: cicdResult?.configured || false,
    isNewProject: detectedNewProject,
    isUpdate: !!existingSetup.existingProfile,
    artifacts: {
      profileJson: saveResult.profileJsonPath,
      profileMd: saveResult.profileMdPath,
      claudeMd: claudeMdResult?.claudeMdPath || null
    },
    metadata: {
      processId: 'cradle/project-install',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format tech stack for display in review breakpoint
 */
function formatTechStack(techStack) {
  if (!techStack) return 'Not analyzed';
  const parts = [];
  if (techStack.languages?.length) {
    parts.push(techStack.languages.map(l => l.name || l).join(', '));
  }
  if (techStack.frameworks?.length) {
    parts.push(techStack.frameworks.map(f => f.name || f).join(', '));
  }
  return parts.length > 0 ? parts.join(' | ') : 'Not analyzed';
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Check Existing Setup Task
 * Reads existing project profile and determines if this is a new project
 */
export const checkExistingSetupTask = defineTask('check-existing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check existing project setup',
  description: 'Read existing project profile and configuration to support idempotent re-runs. Detect if this is a new or existing project.',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'system administrator and configuration specialist',
      task: 'Check if a babysitter project profile already exists and determine if this is a new or existing project. Read any existing profile for merge-based updates.',
      context: {
        projectRoot: args.projectRoot,
        defaultProfilePath: '.a5c/project-profile.json',
        additionalContext: args.additionalContext
      },
      instructions: [
        'Run `babysitter profile:read --project --json` to check for an existing project profile (add `--dir <dir>` if a custom projectRoot is provided)',
        'If the command succeeds (exit 0), parse the JSON output as the existing profile',
        'If the command fails (exit 1), there is no existing profile',
        'Check if .a5c/ directory exists and list its contents',
        'Determine if this is a new project by checking:',
        '  - Is the git repo empty or has only 1-2 initial commits?',
        '  - Are there only scaffold/template files (e.g., just a README, .gitignore, package.json with no src/)?',
        '  - Is there no meaningful source code yet?',
        'Check for existing CLAUDE.md and note its contents',
        'Check for existing CI/CD configuration files (.github/workflows/, .gitlab-ci.yml, Jenkinsfile, etc.)',
        'Report whether this is a fresh install, an update, or a new project',
        'If an existing profile is found, include it in full in the output so it can be used as a merge base',
        'Do NOT modify any files - this is a read-only check',
        'IMPORTANT: Always use the babysitter CLI for profile operations — never import SDK profile functions directly'
      ],
      outputFormat: 'JSON with existingProfile (full profile object or null), isFirstRun (boolean), isNewProject (boolean), a5cDirExists (boolean), a5cFiles (array), claudeMdExists (boolean), cicdConfigFiles (array of paths found), gitCommitCount (number)'
    },
    outputSchema: {
      type: 'object',
      required: ['existingProfile', 'isFirstRun', 'isNewProject'],
      properties: {
        existingProfile: {
          oneOf: [
            { type: 'object' },
            { type: 'null' }
          ]
        },
        isFirstRun: { type: 'boolean' },
        isNewProject: { type: 'boolean' },
        a5cDirExists: { type: 'boolean' },
        a5cFiles: { type: 'array', items: { type: 'string' } },
        claudeMdExists: { type: 'boolean' },
        claudeMdContent: { type: 'string' },
        cicdConfigFiles: { type: 'array', items: { type: 'string' } },
        gitCommitCount: { type: 'number' },
        profileVersion: { type: 'number' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'setup', 'read-only']
}));

/**
 * Analyze Repo Structure Task
 * Deep analysis of repository structure, code, and documentation
 */
export const analyzeRepoTask = defineTask('analyze-repo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze repository structure and code',
  description: 'Deep analysis of the repo: directory structure, modules, architecture patterns, code organization, documentation, and entry points',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior software architect and codebase analyst',
      task: 'Perform a comprehensive analysis of the repository structure, code organization, documentation, and architecture to build the project profile',
      context: {
        projectRoot: args.projectRoot,
        existingProfile: args.existingProfile
      },
      instructions: [
        'Map the complete directory structure of the project',
        'Identify the architectural pattern (monorepo, monolith, microservices, etc.)',
        'Identify all major modules/packages and their responsibilities',
        'Detect programming languages and their roles (primary, scripting, build, etc.)',
        'Detect frameworks and libraries used (check package.json, requirements.txt, go.mod, Cargo.toml, etc.)',
        'Identify databases referenced in config or code',
        'Detect build tools and package managers in use',
        'Find and summarize key documentation files (README, CONTRIBUTING, ARCHITECTURE, etc.)',
        'Identify entry points for the application',
        'Map the data flow if discernible from code structure',
        'Detect coding conventions from existing code (naming patterns, file organization, import patterns)',
        'Identify test organization and testing patterns',
        'Find error handling patterns used',
        'Note any monorepo workspace configuration',
        'If existing profile is provided, focus on finding changes or additions since last analysis'
      ],
      outputFormat: 'JSON with architecture (object with pattern, modules, entryPoints, dataFlow), techStack (object with languages, frameworks, databases, buildTools, packageManagers, infrastructure), conventions (object with naming, codeStyle, importOrder, errorHandling, testingConventions), documentation (array of {path, type, summary}), directoryTree (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'techStack', 'conventions'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            modules: { type: 'array', items: { type: 'object' } },
            entryPoints: { type: 'array', items: { type: 'string' } },
            dataFlow: { type: 'string' }
          }
        },
        techStack: {
          type: 'object',
          properties: {
            languages: { type: 'array', items: { type: 'object' } },
            frameworks: { type: 'array', items: { type: 'object' } },
            databases: { type: 'array', items: { type: 'object' } },
            buildTools: { type: 'array', items: { type: 'string' } },
            packageManagers: { type: 'array', items: { type: 'string' } },
            infrastructure: { type: 'array', items: { type: 'object' } }
          }
        },
        conventions: {
          type: 'object',
          properties: {
            naming: { type: 'object' },
            git: { type: 'object' },
            codeStyle: { type: 'object' },
            importOrder: { type: 'array', items: { type: 'string' } },
            errorHandling: { type: 'string' },
            testingConventions: { type: 'string' },
            additionalRules: { type: 'array', items: { type: 'string' } }
          }
        },
        documentation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              summary: { type: 'string' }
            }
          }
        },
        directoryTree: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'analysis', 'repo']
}));

/**
 * Analyze Tools & Services Task
 * Analyze external tools, services, workflows, and integrations
 */
export const analyzeToolsServicesTask = defineTask('analyze-tools-services', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze tools, services, and workflows',
  description: 'Identify and analyze all external tools, services, CI/CD pipelines, workflows, and integrations used by the project',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps engineer and platform specialist',
      task: 'Analyze the project to identify all tools, services, CI/CD configuration, workflows, and external integrations in use',
      context: {
        projectRoot: args.projectRoot,
        existingProfile: args.existingProfile
      },
      instructions: [
        'Identify all development tools configured in the project:',
        '  - Linting tools (ESLint, Prettier, RuboCop, etc.) and their config files',
        '  - Testing tools (Jest, Vitest, Pytest, etc.) and their config files',
        '  - Formatting tools and their config files',
        '  - Build tools (webpack, esbuild, vite, etc.)',
        'Identify CI/CD configuration:',
        '  - Check for .github/workflows/, .gitlab-ci.yml, Jenkinsfile, .circleci/, etc.',
        '  - Parse pipeline stages and triggers',
        '  - Note the CI/CD provider and version',
        'Identify external services referenced in code or config:',
        '  - API endpoints, database connections, cloud services',
        '  - Monitoring/logging services (Datadog, Sentry, etc.)',
        '  - Communication integrations (Slack webhooks, etc.)',
        'Identify project workflows:',
        '  - Git workflow (branch naming, merge strategy from git config or docs)',
        '  - Release workflow (semantic versioning, changelogs, etc.)',
        '  - Code review requirements (CODEOWNERS, branch protection references)',
        'Check for Docker/containerization config',
        'Check for infrastructure-as-code (Terraform, CloudFormation, etc.)',
        'Identify any existing automation scripts',
        'Do NOT access or store any secrets, tokens, or credentials'
      ],
      outputFormat: 'JSON with tools (object with linting, testing, formatting arrays), cicd (object with provider, configPaths, pipelines), services (array of {name, type, url}), workflows (array of {name, description, steps, triggers}), externalIntegrations (array of {service, category, enabled}), containerization (object), infrastructure (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['tools', 'workflows'],
      properties: {
        tools: {
          type: 'object',
          properties: {
            linting: { type: 'array', items: { type: 'object' } },
            testing: { type: 'array', items: { type: 'object' } },
            formatting: { type: 'array', items: { type: 'object' } }
          }
        },
        cicd: {
          type: 'object',
          properties: {
            provider: { type: 'string' },
            configPaths: { type: 'array', items: { type: 'string' } },
            pipelines: { type: 'array', items: { type: 'object' } }
          }
        },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              url: { type: 'string' }
            }
          }
        },
        workflows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              triggers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        externalIntegrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              category: { type: 'string' },
              enabled: { type: 'boolean' }
            }
          }
        },
        containerization: { type: 'object' },
        infrastructure: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'analysis', 'tools']
}));

/**
 * Process Mining Task
 * Analyze git history for patterns, rules, evolution, and bottlenecks
 */
export const processMiningTask = defineTask('process-mining', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mine git history for process patterns',
  description: 'Analyze git history to extract commit patterns, PR patterns, release patterns, evolution, bottlenecks, and implicit rules',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'process mining specialist and software historian',
      task: 'Analyze the git history of this project to extract development patterns, implicit rules, evolution trajectory, and bottlenecks. This information will help babysitter understand how the project operates.',
      context: {
        projectRoot: args.projectRoot,
        existingProfile: args.existingProfile,
        repoStructure: args.repoStructure
      },
      instructions: [
        'Analyze git log for commit patterns:',
        '  - Commit message format and conventions (conventional commits, ticket references, etc.)',
        '  - Commit frequency and distribution over time',
        '  - Average commit size (files changed, lines added/removed)',
        '  - Most active contributors and their areas of focus',
        'Analyze branch patterns:',
        '  - Branch naming conventions',
        '  - Branch lifetime (how long branches live before merge)',
        '  - Merge strategy (merge commits, squash, rebase)',
        'Analyze PR/merge patterns if available:',
        '  - PR size distribution',
        '  - Review turnaround time indicators (time between commits)',
        '  - Common reviewers',
        'Analyze release patterns:',
        '  - Tag format and frequency',
        '  - Release branching strategy',
        '  - Versioning scheme (semver, calver, etc.)',
        'Identify evolution patterns:',
        '  - Major refactoring events (large commits touching many files)',
        '  - Technology migrations visible in history',
        '  - Growing or shrinking areas of the codebase',
        'Identify bottlenecks:',
        '  - Files with high churn (frequently changed)',
        '  - Files that are always changed together (hidden coupling)',
        '  - Long-lived branches that cause merge conflicts',
        'Extract implicit rules:',
        '  - Files that must be changed together',
        '  - Areas that rarely change (stable core)',
        '  - Patterns of test-code co-changes',
        'Limit git log analysis to a reasonable depth (last 500-1000 commits or 6 months)',
        'Do NOT access any sensitive information from git history'
      ],
      outputFormat: 'JSON with commitPatterns (object), branchPatterns (object), releasePatterns (object), evolution (object with majorEvents, technologyChanges, growthAreas), bottlenecks (array of {id, description, impact, location, frequency}), implicitRules (array of strings), painPoints (array of {id, description, severity, category, discoveredVia}), contributors (array of {name, areas, commitCount})'
    },
    outputSchema: {
      type: 'object',
      required: ['commitPatterns', 'bottlenecks'],
      properties: {
        commitPatterns: {
          type: 'object',
          properties: {
            messageFormat: { type: 'string' },
            averageFrequency: { type: 'string' },
            averageSize: { type: 'object' },
            conventions: { type: 'array', items: { type: 'string' } }
          }
        },
        branchPatterns: {
          type: 'object',
          properties: {
            namingConvention: { type: 'string' },
            averageLifetime: { type: 'string' },
            mergeStrategy: { type: 'string' }
          }
        },
        releasePatterns: {
          type: 'object',
          properties: {
            tagFormat: { type: 'string' },
            frequency: { type: 'string' },
            versioningScheme: { type: 'string' }
          }
        },
        evolution: {
          type: 'object',
          properties: {
            majorEvents: { type: 'array', items: { type: 'object' } },
            technologyChanges: { type: 'array', items: { type: 'string' } },
            growthAreas: { type: 'array', items: { type: 'string' } }
          }
        },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' },
              location: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        implicitRules: { type: 'array', items: { type: 'string' } },
        painPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' },
              category: { type: 'string' },
              discoveredVia: { type: 'string' }
            }
          }
        },
        contributors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              areas: { type: 'array', items: { type: 'string' } },
              commitCount: { type: 'number' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'mining', 'git-history']
}));

/**
 * Build Profile Task
 * Merge all research, mining, and interview data into a complete ProjectProfile
 */
export const buildProfileTask = defineTask('build-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build comprehensive project profile',
  description: 'Merge existing profile + repo research + tools analysis + process mining + user interview into a complete ProjectProfile',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'project profile architect and data integration engineer',
      task: 'Build a comprehensive ProjectProfile by merging all available information sources. The profile must conform to the babysitter SDK ProjectProfile schema. Use merge semantics: merge, do not overwrite. Always use the babysitter CLI for profile I/O — never import SDK profile functions directly.',
      context: {
        existingProfile: args.existingProfile,
        repoStructure: args.repoStructure,
        toolsAndServices: args.toolsAndServices,
        miningResult: args.miningResult,
        additionalContext: args.additionalContext,
        projectRoot: args.projectRoot,
        isNewProject: args.isNewProject,
        projectProfileSchema: {
          requiredFields: ['projectName', 'description', 'goals', 'techStack', 'architecture', 'workflows', 'conventions', 'createdAt', 'updatedAt', 'version'],
          goalSchema: '{ id: string, description: string, category: string, priority?: string, status?: string }',
          techStackSchema: '{ languages?: [{name, version?, role?}], frameworks?: [{name, version?, category?}], databases?: [{name, type?, version?}], infrastructure?: [{name, category?}], buildTools?: string[], packageManagers?: string[] }',
          architectureSchema: '{ pattern?: string, modules?: [{name, path, description?, dependencies?}], entryPoints?: string[], dataFlow?: string }',
          teamMemberSchema: '{ name: string, role: string, responsibilities?: string[] }',
          workflowSchema: '{ name: string, description?: string, steps?: string[], triggers?: string[] }',
          conventionsSchema: '{ naming?: Record<string, string>, git?: Record<string, string>, codeStyle?: Record<string, unknown>, importOrder?: string[], errorHandling?: string, testingConventions?: string, additionalRules?: string[] }',
          painPointSchema: '{ id: string, description: string, severity: string, category?: string, discoveredVia?: string, suggestedRemediation?: string }',
          bottleneckSchema: '{ id: string, description: string, impact: string, location?: string, frequency?: string }',
          cicdSchema: '{ provider?: string, configPaths?: string[], pipelines?: [{name, trigger?, stages?}], babysitterIntegration?: {enabled?, triggerOn?, processIds?} }'
        }
      },
      instructions: [
        'Read the breakpoint response from the user interview (Phase 4) to get user-provided information',
        'If an existing profile exists (loaded via `babysitter profile:read --project --json` in Phase 1), use it as the base and merge new information on top',
        'IMPORTANT: Do not import or call SDK profile functions directly — use the babysitter CLI for all profile I/O',
        'Incorporate repo structure analysis into architecture, techStack, and conventions',
        'Incorporate tools and services analysis into tools, services, cicd, externalIntegrations, and workflows',
        'Incorporate process mining results into bottlenecks, painPoints, conventions (git patterns), and workflows',
        'Incorporate user interview responses into goals, team, workflows, and preferences',
        'Build a complete ProjectProfile object conforming to the schema described in context',
        'For any fields not discovered or provided, use sensible defaults:',
        '  - conventions: extract from detected code patterns or leave minimal',
        '  - workflows: at minimum include a "development" workflow',
        'Set createdAt to the existing profile createdAt if updating, or current timestamp if new',
        'Set updatedAt to current timestamp',
        'Set version to existing version + 1 if updating, or 1 if new',
        'Generate unique IDs for goals (format: goal-<category>-<index>)',
        'Generate unique IDs for pain points (format: pp-<category>-<index>)',
        'Generate unique IDs for bottlenecks (format: bn-<location>-<index>)',
        'Merge arrays by deduplicating on id/name fields, not replacing entire arrays',
        'Write the preview profile to artifacts/project-profile-preview.json for the review breakpoint (this is a run artifact, NOT the actual profile — the actual profile is written later by the save task using `babysitter profile:write`)',
        'Do NOT write to .a5c/project-profile.json or any profile path directly — that is the save task\'s job via the CLI'
      ],
      outputFormat: 'JSON with profile (complete ProjectProfile object), changesSummary (string describing what was new/changed), sourcesUsed (array of strings indicating which data sources contributed)'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'changesSummary'],
      properties: {
        profile: {
          type: 'object',
          required: ['projectName', 'description', 'goals', 'techStack', 'architecture', 'workflows', 'conventions', 'createdAt', 'updatedAt', 'version'],
          properties: {
            projectName: { type: 'string' },
            description: { type: 'string' },
            goals: { type: 'array', items: { type: 'object' } },
            techStack: { type: 'object' },
            architecture: { type: 'object' },
            team: { type: 'array', items: { type: 'object' } },
            workflows: { type: 'array', items: { type: 'object' } },
            processes: { type: 'array', items: { type: 'object' } },
            tools: { type: 'object' },
            services: { type: 'array', items: { type: 'object' } },
            externalIntegrations: { type: 'array', items: { type: 'object' } },
            cicd: { type: 'object' },
            painPoints: { type: 'array', items: { type: 'object' } },
            bottlenecks: { type: 'array', items: { type: 'object' } },
            conventions: { type: 'object' },
            repositories: { type: 'array', items: { type: 'object' } },
            claudeMdInstructions: { type: 'array', items: { type: 'string' } },
            installedSkills: { type: 'array', items: { type: 'string' } },
            installedAgents: { type: 'array', items: { type: 'string' } },
            installedProcesses: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            version: { type: 'number' }
          }
        },
        changesSummary: { type: 'string' },
        sourcesUsed: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'profile', 'build']
}));

/**
 * Tool Selection Task
 * Recommend optimal babysitter skills, agents, and processes for the project
 */
export const toolSelectionTask = defineTask('tool-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select optimal tools and processes for project',
  description: 'Analyze the project profile to recommend the best babysitter skills, agents, processes, and methodologies',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'developer tools expert and productivity consultant',
      task: 'Analyze the project profile and recommend the optimal set of babysitter tools, agents, processes, and skills based on the project tech stack, architecture, workflows, pain points, and goals',
      context: {
        profile: args.profile,
        repoStructure: args.repoStructure,
        toolsAndServices: args.toolsAndServices,
        miningResult: args.miningResult,
        availableProcessCategories: [
          'gsd (Get Stuff Done - general project workflows: new-project, discuss, plan, execute, verify, audit, map-codebase, iterative-convergence)',
          'methodologies (TDD, agile, spec-driven, evolutionary, domain-driven, self-assessment, etc.)',
          'cradle (installation and onboarding: user-install, project-install)',
          'specializations/data-science-ml',
          'specializations/devops-sre-platform',
          'specializations/ux-ui-design',
          'specializations/product-management',
          'specializations/data-engineering-analytics',
          'specializations/technical-documentation',
          'specializations/domains/science',
          'specializations/domains/business',
          'specializations/domains/social-sciences-humanities'
        ]
      },
      instructions: [
        'Analyze the project tech stack, architecture, and goals',
        'Match project characteristics against available process categories and specializations',
        'Recommend specific processes that would be most useful for the project',
        'Recommend a default methodology based on project characteristics:',
        '  - New projects: consider gsd/new-project + agile or TDD methodology',
        '  - Projects with poor test coverage: recommend TDD methodology',
        '  - Large mature projects: recommend evolutionary or domain-driven methodology',
        '  - Projects with quality issues: recommend self-assessment methodology',
        'Recommend skills and agents based on project needs',
        'For each recommendation, provide a brief justification',
        'Prioritize recommendations: must-have vs nice-to-have',
        'Consider project pain points and bottlenecks when recommending remediation-focused processes',
        'Consider the project architecture when recommending organization-focused processes',
        'Match specialization domains to the project domain (e.g., ML project -> data-science-ml specialization)',
        'Write recommendations to artifacts/tool-recommendations.json'
      ],
      outputFormat: 'JSON with recommendedProcesses (array), recommendedSkills (array), recommendedAgents (array), recommendedMethodology (string), justifications (object mapping recommendation to reason), prioritized (object with mustHave and niceToHave arrays), remediations (array of {painPointId, recommendation, process})'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedProcesses', 'recommendedSkills', 'recommendedMethodology'],
      properties: {
        recommendedProcesses: { type: 'array', items: { type: 'string' } },
        recommendedSkills: { type: 'array', items: { type: 'string' } },
        recommendedAgents: { type: 'array', items: { type: 'string' } },
        recommendedMethodology: { type: 'string' },
        justifications: { type: 'object' },
        prioritized: {
          type: 'object',
          properties: {
            mustHave: { type: 'array', items: { type: 'string' } },
            niceToHave: { type: 'array', items: { type: 'string' } }
          }
        },
        remediations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPointId: { type: 'string' },
              recommendation: { type: 'string' },
              process: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'tools', 'selection']
}));

/**
 * Configure CI/CD Task
 * Set up babysitter CI/CD integration for the project
 */
export const configureCicdTask = defineTask('configure-cicd', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure CI/CD integration',
  description: 'Configure babysitter to run in the project CI/CD pipeline based on user preferences and detected CI/CD provider',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CI/CD engineer and DevOps automation specialist',
      task: 'Configure babysitter CI/CD integration for the project. Read the user response from the CI/CD breakpoint to determine if and how to configure it.',
      context: {
        profile: args.profile,
        toolSelection: args.toolSelection,
        projectRoot: args.projectRoot,
        existingCicd: args.profile.cicd || null
      },
      instructions: [
        'Read the breakpoint response from Phase 7 to determine if the user wants CI/CD integration',
        'If the user said NO or wants to skip, return configured: false with no changes',
        'If the user said YES:',
        '  - Determine the CI/CD provider from the profile or detected config',
        '  - If no provider is detected, recommend GitHub Actions as default',
        '  - Generate the appropriate CI/CD configuration file(s):',
        '    - For GitHub Actions: .github/workflows/babysitter.yml',
        '    - For GitLab CI: add babysitter stage to .gitlab-ci.yml',
        '    - For other providers: generate appropriate config',
        '  - Configure triggers based on user preferences (PR, push, schedule, manual)',
        '  - Add babysitter process IDs from tool selection to the pipeline',
        '  - Set up appropriate environment variables (do NOT hardcode secrets)',
        '  - Ensure the config is additive (do not remove existing pipeline stages)',
        'Write the generated config files to the project',
        'Update the profile cicd.babysitterIntegration section',
        'Write a summary of changes to artifacts/cicd-config.md'
      ],
      outputFormat: 'JSON with configured (boolean), provider (string or null), configFilesWritten (array of paths), triggerEvents (array), processIds (array), babysitterIntegration (object), skippedReason (string or null)'
    },
    outputSchema: {
      type: 'object',
      required: ['configured'],
      properties: {
        configured: { type: 'boolean' },
        provider: { type: 'string' },
        configFilesWritten: { type: 'array', items: { type: 'string' } },
        triggerEvents: { type: 'array', items: { type: 'string' } },
        processIds: { type: 'array', items: { type: 'string' } },
        babysitterIntegration: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            triggerOn: { type: 'array', items: { type: 'string' } },
            processIds: { type: 'array', items: { type: 'string' } }
          }
        },
        skippedReason: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'cicd', 'configuration']
}));

/**
 * Update CLAUDE.md Task
 * Add babysitter processes and instructions to the project CLAUDE.md
 */
export const updateClaudeMdTask = defineTask('update-claude-md', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update CLAUDE.md with babysitter instructions',
  description: 'Add babysitter processes, commands, and instructions to the project CLAUDE.md file',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'technical writer and Claude Code configuration specialist',
      task: 'Update the project CLAUDE.md to include babysitter process instructions, recommended commands, and project-specific babysitter configuration.',
      context: {
        profile: args.profile,
        toolSelection: args.toolSelection,
        cicdResult: args.cicdResult,
        projectRoot: args.projectRoot,
        existingClaudeMdInstructions: args.profile.claudeMdInstructions || []
      },
      instructions: [
        'Read the existing CLAUDE.md file if it exists',
        'Add a babysitter section (## Babysitter) if not already present',
        'Include the following in the babysitter section:',
        '  - Recommended babysitter commands for this project',
        '  - Installed processes and how to invoke them',
        '  - Project-specific babysitter configuration notes',
        '  - Recommended methodology and when to use it',
        '  - Links to relevant process documentation',
        'If recommended skills are available, document how to use them',
        'If CI/CD was configured, note the CI/CD integration',
        'Do NOT remove or modify existing CLAUDE.md content',
        'Add the new content in a clearly marked section',
        'Use markdown formatting consistent with the existing file',
        'Prepare the additions as a separate artifact so the user can review',
        'Write the additions to artifacts/claude-md-additions.md',
        'Extract key instructions to be stored in the profile claudeMdInstructions array',
        'Actually update the CLAUDE.md file with the additions'
      ],
      outputFormat: 'JSON with updated (boolean), claudeMdPath (string), addedSections (array of section names), claudeMdInstructions (array of instruction strings), additions (string of markdown added)'
    },
    outputSchema: {
      type: 'object',
      required: ['updated', 'claudeMdInstructions'],
      properties: {
        updated: { type: 'boolean' },
        claudeMdPath: { type: 'string' },
        addedSections: { type: 'array', items: { type: 'string' } },
        claudeMdInstructions: { type: 'array', items: { type: 'string' } },
        additions: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'claude-md', 'documentation']
}));

/**
 * Scaffold New Project Task
 * For empty/initial repos, scaffold with vision capture and stack research
 */
export const scaffoldNewProjectTask = defineTask('scaffold-new-project', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaffold new project structure',
  description: 'For empty or initial repositories, scaffold the project with vision capture, stack research, and recommended directory structure. References gsd/new-project.js patterns.',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior project architect and scaffolding specialist',
      task: 'This is a new or empty project. Set up initial scaffolding following the gsd/new-project.js patterns: vision capture, domain research, requirements scoping (v1 vs future), and roadmap creation with phased milestones.',
      context: {
        profile: args.profile,
        toolSelection: args.toolSelection,
        projectRoot: args.projectRoot,
        gsdNewProjectPattern: 'The gsd/new-project process uses: vision capture -> parallel domain research (stack, features, architecture, pitfalls) -> requirements scoping (v1/v2 separation) -> roadmap creation with milestones.'
      },
      instructions: [
        '**1. Vision Capture**: Create PROJECT.md with:',
        '  - Project vision statement derived from profile goals and description',
        '  - Problem statement and target audience',
        '  - Key differentiators and success criteria',
        '  - Write to artifacts/project-vision.md as well for the review breakpoint',
        '**2. Domain Research**: Research the chosen tech stack and domain:',
        '  - Evaluate stack choices (languages, frameworks, databases) for the project goals',
        '  - Identify common architecture pitfalls for the chosen pattern',
        '  - List key features and capabilities needed',
        '  - Note best practices and anti-patterns for the domain',
        '**3. Requirements Scoping**: Create requirements document:',
        '  - v1 requirements: essential features for initial release',
        '  - v2/future requirements: deferred features and nice-to-haves',
        '  - Non-functional requirements (performance, security, scalability)',
        '  - Write to artifacts/project-requirements-v1.md for the review breakpoint',
        '**4. Roadmap Creation**: Create ROADMAP.md with:',
        '  - Phased milestones derived from v1 requirements',
        '  - Dependencies between milestones',
        '  - Write to artifacts/project-roadmap.md for the review breakpoint',
        '**5. Directory Structure**: Set up recommended layout based on profile architecture',
        '  - Create .a5c/ and .a5c/processes/ directories',
        '  - If tech stack defined, initialize package manager config if not present',
        '  - Add recommended development dependencies from tool selection',
        'Do NOT overwrite any existing files',
        'Write a summary to artifacts/new-project-scaffold.md',
        'If recommended methodology is available, create a .a5c/methodology.json reference'
      ],
      outputFormat: 'JSON with scaffolded (boolean), filesCreated (array of paths), directoriesCreated (array of paths), visionDocument (string path or null), roadmapDocument (string path or null), skippedFiles (array of paths that already existed)'
    },
    outputSchema: {
      type: 'object',
      required: ['scaffolded', 'filesCreated'],
      properties: {
        scaffolded: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        directoriesCreated: { type: 'array', items: { type: 'string' } },
        visionDocument: { type: 'string' },
        roadmapDocument: { type: 'string' },
        skippedFiles: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'scaffold', 'new-project']
}));

/**
 * Initialize .a5c Infrastructure & Quality Gates Task
 * Ensures .a5c/package.json exists with babysitter-sdk dependency and configures quality gates
 */
export const initializeA5cInfraTask = defineTask('initialize-a5c-infra', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Initialize .a5c infrastructure and quality gates',
  description: 'Create .a5c/package.json with babysitter-sdk dependency, configure quality thresholds, and set up testing/linting enforcement gates',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps engineer specializing in project infrastructure, CI/CD quality gates, and testing standards',
      task: 'Ensure the .a5c/ directory has a package.json with @a5c-ai/babysitter-sdk as a dependency, and configure quality gates for the project. This task is idempotent — do not overwrite existing configuration, only add what is missing.',
      context: {
        projectRoot: args.projectRoot,
        profile: args.profile,
        toolSelection: args.toolSelection,
        isNewProject: args.isNewProject
      },
      instructions: [
        '**1. .a5c/package.json**: Ensure .a5c/package.json exists in the project root:',
        '  - If it does not exist, create it with name "<projectName>-a5c", version "1.0.0", type "module"',
        '  - Ensure @a5c-ai/babysitter-sdk is listed as a dependency (use "latest" if no version specified)',
        '  - Run `cd .a5c && npm install` to install dependencies if package.json was created or modified',
        '  - Do NOT overwrite an existing package.json — only add missing dependencies',
        '**2. Quality Gates Configuration**: Create or update .a5c/quality-gates.json:',
        '  - qualityThreshold: use BABYSITTER_QUALITY_THRESHOLD env var default (80)',
        '  - testCoverage: set minimum coverage target based on project maturity (new: 60%, existing: match current)',
        '  - linting: reference the project linting tools from the profile (eslint, prettier, etc.)',
        '  - formatting: reference formatting tools from the profile',
        '  - commitChecks: list pre-commit checks (lint, type-check, test) appropriate for the project',
        '  - deployGates: list deployment gates (tests pass, no lint errors, coverage met)',
        '  - If profile has CI/CD configured, note quality gate integration points',
        '**3. Verification**: Confirm .a5c/package.json is valid JSON and dependencies are installable',
        'IMPORTANT: Always use the babysitter CLI for profile operations — never import SDK profile functions directly'
      ],
      outputFormat: 'JSON with packageJsonCreated (boolean), packageJsonPath (string), qualityGatesPath (string), sdkInstalled (boolean), qualityGates (object with configured gates)'
    },
    outputSchema: {
      type: 'object',
      required: ['packageJsonCreated', 'sdkInstalled'],
      properties: {
        packageJsonCreated: { type: 'boolean' },
        packageJsonPath: { type: 'string' },
        qualityGatesPath: { type: 'string' },
        sdkInstalled: { type: 'boolean' },
        qualityGates: { type: 'object' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'infrastructure', 'quality-gates']
}));

/**
 * Configure Gitignore Task
 * Add babysitter-related entries to .gitignore based on user preference
 */
export const configureGitignoreTask = defineTask('configure-gitignore', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure .gitignore for babysitter files',
  description: 'Read the user gitignore preference from the Phase 9d breakpoint and update the project .gitignore accordingly. Always adds credential exclusions for security.',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps engineer configuring version control exclusions',
      task: 'Update the project .gitignore file based on the user selection from the .gitignore configuration breakpoint (Phase 9d). Add babysitter entries idempotently under a managed section.',
      context: {
        projectRoot: args.projectRoot,
        entriesMap: {
          nothing: ['.a5c/creds.env', '.a5c/creds.env.tmp.*'],
          logs: ['.a5c/creds.env', '.a5c/creds.env.tmp.*', '.a5c/logs/'],
          'logs-runs': ['.a5c/creds.env', '.a5c/creds.env.tmp.*', '.a5c/logs/', '.a5c/runs/'],
          'logs-runs-processes': ['.a5c/creds.env', '.a5c/creds.env.tmp.*', '.a5c/logs/', '.a5c/runs/', '.a5c/processes/'],
          entire: ['.a5c/']
        },
        sectionMarkerStart: '# --- babysitter managed ---',
        sectionMarkerEnd: '# --- end babysitter managed ---'
      },
      instructions: [
        'Read the breakpoint response from Phase 9d to determine the user\'s gitignore preference.',
        'Map the user response to a level:',
        '  - "Nothing" or similar → level "nothing"',
        '  - "Logs only" or similar → level "logs"',
        '  - "Logs + Runs" or "Recommended" or similar → level "logs-runs"',
        '  - "Logs + Runs + Processes" or similar → level "logs-runs-processes"',
        '  - "Entire .a5c" or similar → level "entire"',
        '  - If the response is unclear, default to "logs-runs" (the recommended option)',
        '',
        'Read the existing .gitignore file at the project root (or note its absence)',
        '',
        'Build the new managed section:',
        '  1. Start with the section marker: "# --- babysitter managed ---"',
        '  2. Add the entries for the selected level from the entriesMap',
        '  3. End with the section marker: "# --- end babysitter managed ---"',
        '',
        'Update the .gitignore file:',
        '  - If the file exists and already contains the managed section markers, REPLACE the entire section (from start marker to end marker, inclusive) with the new section',
        '  - If the file exists but has no managed section, APPEND the new section at the end (with a blank line separator)',
        '  - If the file does not exist, CREATE it with the new section',
        '  - PRESERVE all existing content outside the managed section',
        '  - Do NOT add duplicate entries that already exist outside the managed section',
        '',
        'After writing, read back the .gitignore to verify the section was written correctly',
        'Report the level selected and entries added'
      ],
      outputFormat: 'JSON with configured (boolean), level (string: nothing|logs|logs-runs|logs-runs-processes|entire), entriesAdded (array of strings), gitignorePath (string), existedBefore (boolean), sectionReplaced (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'level', 'entriesAdded'],
      properties: {
        configured: { type: 'boolean' },
        level: { type: 'string' },
        entriesAdded: { type: 'array', items: { type: 'string' } },
        gitignorePath: { type: 'string' },
        existedBefore: { type: 'boolean' },
        sectionReplaced: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'gitignore', 'configuration']
}));

/**
 * Save Profile Task
 * Save the final approved project profile using the babysitter CLI
 */
export const saveProfileTask = defineTask('save-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Save project profile via babysitter CLI',
  description: 'Save the final approved project profile using `babysitter profile:write` CLI command. Never write profile files directly.',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CLI automation specialist — you ONLY use the babysitter CLI to manage profiles, never direct file writes',
      task: 'Save the final project profile using the babysitter CLI. The profile has been approved by the user. You MUST use `babysitter profile:write` — do NOT write profile JSON or markdown files directly.',
      context: {
        profile: args.profile,
        toolSelection: args.toolSelection,
        cicdResult: args.cicdResult,
        claudeMdResult: args.claudeMdResult,
        newProjectResult: args.newProjectResult,
        projectRoot: args.projectRoot,
        defaultProfileDir: '.a5c/',
        cliCommand: 'babysitter profile:write --project --input <file> [--dir <dir>] --json'
      },
      instructions: [
        'CRITICAL: You MUST use the babysitter CLI for all profile operations. Do NOT use fs.writeFile, echo >, or any other method to write project-profile.json or project-profile.md directly.',
        'Step 1: Finalize the profile with any last updates from CI/CD and CLAUDE.md results:',
        '  - If CI/CD was configured, ensure profile.cicd.babysitterIntegration is updated',
        '  - If CLAUDE.md was updated, ensure profile.claudeMdInstructions is populated',
        '  - Update profile.installedSkills, installedAgents, installedProcesses from tool selection',
        '  - Ensure updatedAt is set to current timestamp',
        'Step 2: Write the finalized profile JSON object to a temporary file: echo \'<profile-json>\' > /tmp/project-profile-final.json',
        'Step 3: Run `babysitter profile:write --project --input /tmp/project-profile-final.json --json` (add `--dir <projectRoot>` if a custom projectRoot was provided)',
        'Step 4: The CLI automatically handles: atomic writes, directory creation (.a5c/), markdown generation (project-profile.md), and file permissions',
        'Step 5: Run `babysitter profile:read --project --json` to verify the profile was saved correctly (add `--dir <projectRoot>` if custom)',
        'Step 6: Clean up /tmp/project-profile-final.json',
        'Step 7: Report all file paths written',
        'REMINDER: The only way to write the project profile is via `babysitter profile:write`. If you find yourself writing to project-profile.json directly, STOP and use the CLI instead.'
      ],
      outputFormat: 'JSON with savedProfile (the profile object as written), profileJsonPath (string), profileMdPath (string), filesWritten (array of full paths), bytesWritten (number), verified (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['savedProfile', 'profileJsonPath', 'filesWritten', 'verified'],
      properties: {
        savedProfile: { type: 'object' },
        profileJsonPath: { type: 'string' },
        profileMdPath: { type: 'string' },
        filesWritten: { type: 'array', items: { type: 'string' } },
        bytesWritten: { type: 'number' },
        verified: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'save', 'atomic']
}));

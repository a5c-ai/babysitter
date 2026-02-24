/**
 * @process cradle/user-install
 * @description Set up babysitter for a user - install deps, interview, build profile, configure tools
 * @inputs { existingProfileDir?: string, socialProfileUrls?: string[], additionalContext?: string }
 * @outputs { success: boolean, profile: object, toolsInstalled: array, configPath: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * User Installation & Onboarding Process
 *
 * Cradle Methodology: Check existing state -> Verify environment -> Interview ->
 *   Social research -> Build profile -> Select tools -> Configure -> Review -> Save
 *
 * Phases:
 * 1. Check Existing Setup - Read existing user profile for idempotent updates
 * 2. Environment Check - Verify and install babysitter SDK and jq
 * 3. User Interview - Interactive breakpoint to gather user information
 * 4. Social Research - Optional enrichment from social profile URLs
 * 5. Profile Building - Merge interview + social + existing into UserProfile
 * 6. Tool Selection - Recommend tools, agents, processes, skills for the user
 * 7. Configuration - Set up user-level babysitter config
 * 8. Review Breakpoint - User approves final profile before saving
 * 9. Save - Write final profile to disk
 *
 * @param {Object} inputs - Process inputs
 * @param {string} [inputs.existingProfileDir] - Custom profile directory (defaults to ~/.a5c)
 * @param {string[]} [inputs.socialProfileUrls] - LinkedIn, GitHub, or other social profile URLs
 * @param {string} [inputs.additionalContext] - Extra context about the user or their needs
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with profile, tools installed, and config path
 */
export async function process(inputs, ctx) {
  const {
    existingProfileDir = null,
    socialProfileUrls = [],
    additionalContext = ''
  } = inputs;

  // ============================================================================
  // PHASE 1: CHECK EXISTING SETUP
  // ============================================================================

  const existingSetup = await ctx.task(checkExistingSetupTask, {
    profileDir: existingProfileDir,
    additionalContext
  });

  // ============================================================================
  // PHASE 2: ENVIRONMENT CHECK
  // ============================================================================

  const envCheck = await ctx.task(environmentCheckTask, {
    existingProfile: existingSetup.existingProfile
  });

  // ============================================================================
  // PHASE 3: USER INTERVIEW
  // ============================================================================

  await ctx.breakpoint({
    question: [
      'Welcome to babysitter setup! Please tell us about yourself so we can personalize your experience.',
      '',
      existingSetup.existingProfile
        ? '(We found an existing profile. Your answers will be merged with your current settings.)'
        : '(This is a fresh setup. We will create your profile from scratch.)',
      '',
      'Please provide the following information:',
      '',
      '1. **Name**: What should we call you?',
      '2. **Specialties**: What are your primary domains? (e.g., backend, frontend, ML, DevOps, data engineering)',
      '3. **Experience**: How many years of professional experience do you have? What is your current role and organization?',
      '4. **Expertise Levels**: Rate yourself (novice/beginner/intermediate/advanced/expert) on your key technologies and skills',
      '5. **Goals**: What are you trying to achieve? (e.g., learn a new framework, ship a product, improve code quality)',
      '6. **Preferences**:',
      '   - Verbosity: concise / normal / verbose',
      '   - Autonomy: supervised / semi-autonomous / autonomous',
      '   - Risk tolerance: conservative / moderate / aggressive',
      '   - Working hours and timezone',
      '7. **Tool Preferences**: Preferred editor, shell, terminal, languages, OS',
      '8. **Communication Style**: Professional/casual/technical tone? Brief or detailed explanations?',
      '9. **Breakpoint Tolerance**: How often should babysitter pause for your approval? (minimal/low/moderate/high/maximum)',
      '10. **Social Profiles** (optional): Share LinkedIn, GitHub, or other profile URLs for enriched setup',
      '',
      'Answer as much or as little as you like. We will fill in sensible defaults for anything you skip.'
    ].join('\n'),
    title: 'User Onboarding Interview',
    context: {
      runId: ctx.runId,
      existingProfile: existingSetup.existingProfile ? 'Found existing profile - will merge updates' : 'No existing profile found',
      socialProfileUrls: socialProfileUrls.length > 0 ? socialProfileUrls : 'None provided (can be added later)'
    }
  });

  // ============================================================================
  // PHASE 4: SOCIAL RESEARCH (OPTIONAL)
  // ============================================================================

  const allSocialUrls = [
    ...socialProfileUrls,
    ...(existingSetup.existingProfile?.socialProfiles?.map(sp => sp.url) || [])
  ];

  let socialResearch = null;
  if (allSocialUrls.length > 0) {
    socialResearch = await ctx.task(socialResearchTask, {
      socialProfileUrls: [...new Set(allSocialUrls)],
      existingProfile: existingSetup.existingProfile
    });
  }

  // ============================================================================
  // PHASE 5: PROFILE BUILDING
  // ============================================================================

  const profileResult = await ctx.task(buildProfileTask, {
    existingProfile: existingSetup.existingProfile,
    socialResearch,
    additionalContext,
    profileDir: existingProfileDir
  });

  // ============================================================================
  // PHASE 6: TOOL SELECTION
  // ============================================================================

  const toolSelection = await ctx.task(toolSelectionTask, {
    profile: profileResult.profile,
    availableSpecializations: profileResult.availableSpecializations || []
  });

  // ============================================================================
  // PHASE 7: CONFIGURATION
  // ============================================================================

  const configResult = await ctx.task(configureUserTask, {
    profile: profileResult.profile,
    toolSelection,
    profileDir: existingProfileDir
  });

  // ============================================================================
  // PHASE 8: REVIEW BREAKPOINT
  // ============================================================================

  await ctx.breakpoint({
    question: [
      'Please review your complete user profile before we save it.',
      '',
      `**Name**: ${profileResult.profile.name || 'Not set'}`,
      `**Specialties**: ${(profileResult.profile.specialties || []).map(s => s.domain).join(', ') || 'None'}`,
      `**Goals**: ${(profileResult.profile.goals || []).map(g => g.description).join('; ') || 'None set'}`,
      `**Breakpoint Tolerance**: ${profileResult.profile.breakpointTolerance?.global || 'moderate'}`,
      `**Autonomy Level**: ${profileResult.profile.preferences?.autonomyLevel || 'semi-autonomous'}`,
      '',
      `**Recommended Tools**: ${(toolSelection.recommendedSkills || []).join(', ') || 'Default set'}`,
      `**Recommended Processes**: ${(toolSelection.recommendedProcesses || []).join(', ') || 'Default set'}`,
      '',
      `**Config Path**: ${configResult.configPath || '~/.a5c/'}`,
      '',
      'Approve to save this profile, or provide corrections.'
    ].join('\n'),
    title: 'Profile Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/user-profile-preview.json', format: 'json', label: 'Full Profile JSON' },
        { path: 'artifacts/tool-recommendations.json', format: 'json', label: 'Tool Recommendations' }
      ]
    }
  });

  // ============================================================================
  // PHASE 9: SAVE
  // ============================================================================

  const saveResult = await ctx.task(saveProfileTask, {
    profile: profileResult.profile,
    toolSelection,
    configResult,
    profileDir: existingProfileDir
  });

  // ============================================================================
  // PHASE 10: COMMUNITY (optional, non-blocking)
  // ============================================================================

  await ctx.breakpoint({
    question: [
      '🎉 Your babysitter profile is all set up and ready to go!',
      '',
      'One small thing before we wrap up...',
      '',
      'If babysitter has been helpful (or at least entertainingly chaotic),',
      'would you consider giving the repo a ⭐ on GitHub?',
      '',
      '  👉  https://github.com/a5c-ai/babysitter',
      '',
      'Stars help other developers discover the project, and honestly,',
      'it makes the maintainers mass-produce dopamine every time the counter goes up.',
      'We are simple creatures.',
      '',
      'No pressure though — your profile is saved either way. 😄',
      '',
      '(Just hit approve to continue)'
    ].join('\n'),
    title: 'One Last Thing... ⭐',
    context: {
      runId: ctx.runId,
      repoUrl: 'https://github.com/a5c-ai/babysitter',
      note: 'This is purely optional and does not affect the setup.'
    }
  });

  return {
    success: true,
    profile: saveResult.savedProfile,
    toolsInstalled: envCheck.toolsInstalled || [],
    toolsRecommended: toolSelection,
    configPath: saveResult.configPath,
    isUpdate: !!existingSetup.existingProfile,
    artifacts: {
      profile: saveResult.configPath,
      markdown: saveResult.markdownPath
    },
    metadata: {
      processId: 'cradle/user-install',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Check Existing Setup Task
 * Reads existing user profile for idempotent updates
 */
export const checkExistingSetupTask = defineTask('check-existing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check existing babysitter setup',
  description: 'Read existing user profile and configuration to support idempotent re-runs',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'system administrator and configuration specialist',
      task: 'Check if a babysitter user profile already exists and read it if so. Also check for any existing babysitter configuration files.',
      context: {
        profileDir: args.profileDir,
        defaultProfilePath: '~/.a5c/user-profile.json',
        additionalContext: args.additionalContext
      },
      instructions: [
        'Run `babysitter profile:read --user --json` to check for an existing user profile (add `--dir <dir>` if a custom profileDir is provided)',
        'If the command succeeds (exit 0), parse the JSON output as the existing profile',
        'If the command fails (exit 1), there is no existing profile — this is a fresh install',
        'Check if ~/.a5c/ directory exists and list its contents',
        'Check if any .a5c/ directory exists in the current working directory',
        'Report whether this is a fresh install or an update to an existing setup',
        'If an existing profile is found, include it in full in the output so it can be used as a merge base',
        'Do NOT modify any files - this is a read-only check',
        'IMPORTANT: Always use the babysitter CLI for profile operations — never import SDK profile functions directly'
      ],
      outputFormat: 'JSON with existingProfile (full profile object or null), configDirExists (boolean), configFiles (array of filenames found), isFirstRun (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['existingProfile', 'isFirstRun'],
      properties: {
        existingProfile: {
          oneOf: [
            { type: 'object' },
            { type: 'null' }
          ]
        },
        configDirExists: { type: 'boolean' },
        configFiles: { type: 'array', items: { type: 'string' } },
        isFirstRun: { type: 'boolean' },
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
 * Environment Check Task
 * Verify and install babysitter SDK and jq dependencies
 */
export const environmentCheckTask = defineTask('environment-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify and install dependencies',
  description: 'Check that babysitter SDK and jq are installed, install if missing',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps engineer and system administrator',
      task: 'Verify that required dependencies are installed and install any missing ones',
      context: {
        requiredTools: ['babysitter-sdk (npm package @a5c-ai/babysitter-sdk)', 'jq (command-line JSON processor)'],
        existingProfile: args.existingProfile
      },
      instructions: [
        'Check if @a5c-ai/babysitter-sdk is installed globally or in the local project (npm list -g @a5c-ai/babysitter-sdk or check node_modules)',
        'Check if jq is installed (run: jq --version)',
        'Check if node/npm are available and their versions',
        'For any missing tools, install them:',
        '  - jq: use the appropriate package manager for the OS (brew install jq, apt-get install jq, choco install jq, etc.)',
        '  - babysitter-sdk: npm install -g @a5c-ai/babysitter-sdk (if not already present)',
        'Verify installations succeeded',
        'Report the versions of all installed tools',
        'Do NOT fail if jq cannot be installed - it is optional but recommended'
      ],
      outputFormat: 'JSON with toolsInstalled (array of {name, version, wasAlreadyInstalled}), toolsMissing (array of {name, reason}), nodeVersion (string), npmVersion (string), platform (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['toolsInstalled', 'platform'],
      properties: {
        toolsInstalled: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              wasAlreadyInstalled: { type: 'boolean' }
            }
          }
        },
        toolsMissing: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        nodeVersion: { type: 'string' },
        npmVersion: { type: 'string' },
        platform: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'environment', 'install']
}));

/**
 * Social Research Task
 * Research user from social profile URLs (LinkedIn, GitHub, etc.)
 */
export const socialResearchTask = defineTask('social-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research user social profiles',
  description: 'Gather information from social profile URLs to enrich the user profile',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'research analyst and profile enrichment specialist',
      task: 'Research the user from their social profile URLs and extract relevant professional information',
      context: {
        socialProfileUrls: args.socialProfileUrls,
        existingProfile: args.existingProfile
      },
      instructions: [
        'For each provided social profile URL, attempt to gather public information',
        'For GitHub profiles: check repos, languages used, contribution activity, bio, organizations',
        'For LinkedIn profiles: check job history, skills, education, certifications, headline',
        'For other profiles: extract whatever professional information is publicly available',
        'Respect privacy - only use publicly available information',
        'Synthesize findings into structured data that maps to the UserProfile schema',
        'Identify specialties, expertise levels, experience, and goals from the research',
        'If a URL is inaccessible or private, note it and continue with others',
        'Cross-reference findings across profiles for consistency',
        'Do NOT fabricate information - only report what you can actually verify'
      ],
      outputFormat: 'JSON with profiles (array of {platform, url, findings}), synthesizedSpecialties (array), synthesizedExpertise (object), synthesizedExperience (object), confidence (string: low/medium/high)'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'confidence'],
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              url: { type: 'string' },
              accessible: { type: 'boolean' },
              findings: { type: 'object' }
            }
          }
        },
        synthesizedSpecialties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              domain: { type: 'string' },
              subdomains: { type: 'array', items: { type: 'string' } },
              yearsActive: { type: 'number' }
            }
          }
        },
        synthesizedExpertise: { type: 'object' },
        synthesizedExperience: {
          type: 'object',
          properties: {
            currentRole: { type: 'string' },
            currentOrganization: { type: 'string' },
            industries: { type: 'array', items: { type: 'string' } },
            previousRoles: { type: 'array', items: { type: 'object' } },
            education: { type: 'array', items: { type: 'object' } },
            certifications: { type: 'array', items: { type: 'string' } }
          }
        },
        socialProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              url: { type: 'string' },
              username: { type: 'string' },
              isPublic: { type: 'boolean' }
            }
          }
        },
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'research', 'social']
}));

/**
 * Build Profile Task
 * Combine interview answers, social research, and existing profile into a complete UserProfile
 */
export const buildProfileTask = defineTask('build-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build comprehensive user profile',
  description: 'Merge interview responses, social research, and existing profile into a complete UserProfile',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'user experience personalization specialist and data integration engineer',
      task: 'Build a comprehensive UserProfile by merging all available information sources. The profile must conform to the babysitter SDK UserProfile schema.',
      context: {
        existingProfile: args.existingProfile,
        socialResearch: args.socialResearch,
        additionalContext: args.additionalContext,
        profileDir: args.profileDir,
        userProfileSchema: {
          requiredFields: ['name', 'specialties', 'expertiseLevels', 'goals', 'preferences', 'toolPreferences', 'breakpointTolerance', 'communicationStyle', 'experience', 'createdAt', 'updatedAt', 'version'],
          specialtySchema: '{ domain: string, subdomains?: string[], yearsActive?: number }',
          expertiseRatingSchema: '{ level: "novice"|"beginner"|"intermediate"|"advanced"|"expert", confidence?: number (0-1), lastAssessed?: ISO8601 }',
          goalSchema: '{ id: string, description: string, category: string, priority?: string, status?: string }',
          preferencesSchema: '{ verbosity?: string, autonomyLevel?: string, riskTolerance?: string, workingHours?: {timezone?, start?, end?}, learningStyle?: string }',
          toolPreferencesSchema: '{ editor?: string, shell?: string, terminal?: string, packageManagers?: string[], languages?: string[], operatingSystem?: string }',
          breakpointToleranceSchema: '{ global: "minimal"|"low"|"moderate"|"high"|"maximum", perCategory?: Record<string, tolerance>, skipBreakpointsForKnownPatterns?: boolean, alwaysBreakOn?: string[] }',
          communicationStyleSchema: '{ tone?: string, language?: string, useEmojis?: boolean, explanationDepth?: string, preferredResponseFormat?: string }',
          experienceSchema: '{ totalYearsProfessional?: number, currentRole?: string, currentOrganization?: string, industries?: string[], previousRoles?: array, education?: array, certifications?: string[] }'
        }
      },
      instructions: [
        'Read the breakpoint response from the user interview (Phase 3) to get the user-provided information',
        'If an existing profile exists (loaded via `babysitter profile:read --user --json` in Phase 1), use it as the base and merge new information on top',
        'If social research is available, incorporate verified findings (prefer user-stated info over inferred)',
        'Build a complete UserProfile object conforming to the schema described in context',
        'IMPORTANT: Do not import or call SDK profile functions directly — use the babysitter CLI for all profile I/O',
        'For any fields the user did not provide, use sensible defaults:',
        '  - preferences.verbosity: "normal"',
        '  - preferences.autonomyLevel: "semi-autonomous"',
        '  - preferences.riskTolerance: "moderate"',
        '  - breakpointTolerance.global: "moderate"',
        '  - communicationStyle.tone: "professional"',
        '  - communicationStyle.useEmojis: false',
        '  - communicationStyle.explanationDepth: "standard"',
        '  - communicationStyle.preferredResponseFormat: "markdown"',
        'Set createdAt to the existing profile createdAt if updating, or current timestamp if new',
        'Set updatedAt to current timestamp',
        'Set version to existing version + 1 if updating, or 1 if new',
        'Generate unique IDs for goals (use format: goal-<category>-<index>)',
        'Also generate a list of available specialization categories from the process library for tool selection',
        'Write the preview profile to artifacts/user-profile-preview.json for the review breakpoint'
      ],
      outputFormat: 'JSON with profile (complete UserProfile object), availableSpecializations (array of category names from the process library), changesSummary (string describing what was new/changed)'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'changesSummary'],
      properties: {
        profile: {
          type: 'object',
          required: ['name', 'specialties', 'expertiseLevels', 'goals', 'preferences', 'toolPreferences', 'breakpointTolerance', 'communicationStyle', 'experience', 'createdAt', 'updatedAt', 'version'],
          properties: {
            name: { type: 'string' },
            specialties: { type: 'array', items: { type: 'object' } },
            expertiseLevels: { type: 'object' },
            goals: { type: 'array', items: { type: 'object' } },
            preferences: { type: 'object' },
            toolPreferences: { type: 'object' },
            breakpointTolerance: { type: 'object' },
            communicationStyle: { type: 'object' },
            socialProfiles: { type: 'array', items: { type: 'object' } },
            experience: { type: 'object' },
            externalIntegrations: { type: 'array', items: { type: 'object' } },
            installedPlugins: { type: 'array', items: { type: 'string' } },
            installedSkills: { type: 'array', items: { type: 'string' } },
            installedAgents: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            version: { type: 'number' }
          }
        },
        availableSpecializations: { type: 'array', items: { type: 'string' } },
        changesSummary: { type: 'string' }
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
 * Analyze user profile and recommend best tools, agents, processes, and skills
 */
export const toolSelectionTask = defineTask('tool-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select optimal tools and processes for user',
  description: 'Analyze user profile to recommend the best tools, agents, processes, and skills from available specializations',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'developer tools expert and productivity consultant',
      task: 'Analyze the user profile and recommend the optimal set of babysitter tools, agents, processes, and skills based on their specialties, expertise, and goals',
      context: {
        profile: args.profile,
        availableSpecializations: args.availableSpecializations,
        availableProcessCategories: [
          'gsd (Get Stuff Done - general project workflows)',
          'methodologies (TDD, agile, spec-driven, evolutionary, domain-driven, etc.)',
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
        'Analyze the user specialties, expertise levels, and goals',
        'Match user profile against available process categories and specializations',
        'Recommend specific processes that would be most useful for the user',
        'Recommend skills and agents based on user needs',
        'For each recommendation, provide a brief justification',
        'Prioritize recommendations: must-have vs nice-to-have',
        'Consider the user breakpoint tolerance when recommending autonomous vs supervised processes',
        'Consider the user expertise level to determine which processes they would benefit from most',
        'Recommend a default methodology based on user preferences and experience level',
        'If user is a beginner, recommend more guided/structured processes',
        'If user is an expert, recommend more autonomous/flexible processes',
        'Write recommendations to artifacts/tool-recommendations.json'
      ],
      outputFormat: 'JSON with recommendedProcesses (array), recommendedSkills (array), recommendedAgents (array), recommendedMethodology (string), justifications (object mapping recommendation to reason), prioritized (object with mustHave and niceToHave arrays)'
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
 * Configure User Task
 * Set up user-level babysitter configuration based on profile
 */
export const configureUserTask = defineTask('configure-user', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure babysitter for user',
  description: 'Set up user-level babysitter configuration files based on the built profile and tool selections',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'system configuration specialist and developer experience engineer',
      task: 'Set up the user-level babysitter configuration based on their profile and selected tools',
      context: {
        profile: args.profile,
        toolSelection: args.toolSelection,
        profileDir: args.profileDir,
        defaultConfigDir: '~/.a5c/'
      },
      instructions: [
        'Determine the configuration directory (custom profileDir or default ~/.a5c/)',
        'Create the configuration directory structure if it does not exist',
        'Prepare the babysitter configuration based on user preferences:',
        '  - Set default verbosity from profile.preferences.verbosity',
        '  - Set autonomy level from profile.preferences.autonomyLevel',
        '  - Set breakpoint tolerance from profile.breakpointTolerance',
        '  - Configure default methodology from tool selection',
        '  - Set up any editor/terminal integrations from profile.toolPreferences',
        'Prepare a config.json with the user settings',
        'Do NOT write the actual profile yet (that happens in the Save phase)',
        'Do NOT overwrite any existing config values that the user has not explicitly changed',
        'Return the planned configuration for review'
      ],
      outputFormat: 'JSON with configPath (string), configDir (string), plannedConfig (object), configCreated (boolean), existingConfigPreserved (array of keys not overwritten)'
    },
    outputSchema: {
      type: 'object',
      required: ['configPath', 'configDir', 'plannedConfig'],
      properties: {
        configPath: { type: 'string' },
        configDir: { type: 'string' },
        plannedConfig: { type: 'object' },
        configCreated: { type: 'boolean' },
        existingConfigPreserved: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'cradle', 'configuration']
}));

/**
 * Save Profile Task
 * Write the final approved profile to disk
 */
export const saveProfileTask = defineTask('save-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Save user profile to disk',
  description: 'Write the final approved user profile and configuration to disk atomically',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'system administrator specializing in atomic file operations and configuration management',
      task: 'Write the final user profile and configuration to disk. This is the last step - the profile has been approved by the user.',
      context: {
        profile: args.profile,
        toolSelection: args.toolSelection,
        configResult: args.configResult,
        profileDir: args.profileDir,
        defaultProfileDir: '~/.a5c/'
      },
      instructions: [
        'Write the profile JSON to a temporary file (e.g., /tmp/user-profile-final.json)',
        'Run `babysitter profile:write --user --input /tmp/user-profile-final.json --json` to write the profile (add `--dir <dir>` if a custom profileDir is provided)',
        'The CLI handles atomic writes, directory creation, and markdown generation automatically',
        'Write the configuration to config.json in the profile directory (mkdir -p ~/.a5c/ or custom profileDir first)',
        'If a tool-recommendations.json was generated, ensure it is saved alongside the profile',
        'Run `babysitter profile:read --user --json` to verify the written profile can be read back successfully',
        'Clean up the temporary file',
        'Report the full paths of all files written',
        'IMPORTANT: Always use the babysitter CLI for profile operations — never import SDK profile functions directly'
      ],
      outputFormat: 'JSON with savedProfile (the profile object as written), configPath (string), markdownPath (string), filesWritten (array of full paths), bytesWritten (number), verified (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['savedProfile', 'configPath', 'filesWritten', 'verified'],
      properties: {
        savedProfile: { type: 'object' },
        configPath: { type: 'string' },
        markdownPath: { type: 'string' },
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

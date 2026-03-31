/**
 * @process domains/business/knowledge-management/chat-transcript-summarizer
 * @description Generate educational community summary from chat transcripts (WhatsApp, Discord, Slack, etc.)
 *
 * A generic, reusable process for summarizing community chat discussions into
 * educational content. Supports multiple platforms and languages.
 *
 * FEATURES:
 * - Multi-platform support (WhatsApp, Discord, Slack, Telegram, etc.)
 * - Multi-language support with optional RTL handling for Hebrew/Arabic
 * - Configurable content focus and structure
 * - Educational content extraction (tips, best practices, Q&A)
 * - Optional bilingual output (original + English translation)
 *
 * RTL HANDLING (for Hebrew/Arabic):
 * Some platforms (e.g., WhatsApp) strip Unicode direction characters on paste.
 * When rtlOptimize is enabled, the process restructures text so every line
 * starts with RTL characters for proper display.
 *
 * @inputs {
 *   transcriptPath: string,           // Path to chat transcript (file or directory)
 *   platform: string,                 // Platform: 'whatsapp' | 'discord' | 'slack' | 'telegram' | 'generic'
 *   community: {
 *     name: string,                   // Community name (e.g., "React Developers")
 *     topic?: string,                 // Main topic/product (e.g., "React", "AI Tools")
 *     description?: string,           // Brief community description for intro
 *   },
 *   dateRange: string,                // Date range for summary (e.g., "Feb 26 - Mar 2, 2026")
 *   outputDir: string,                // Where to write output files
 *   outputPrefix?: string,            // Filename prefix (default: community name slugified)
 *   primaryLanguage: string,          // Primary language code: 'en', 'he', 'ar', 'es', etc.
 *   secondaryLanguage?: string,       // Optional second language for bilingual output
 *   rtlOptimize?: boolean,            // Enable RTL restructuring for WhatsApp compatibility
 *   contentFocus?: string[],          // Focus areas: ['technical', 'tips', 'qa', 'resources', 'discussions']
 *   excludePatterns?: string[],       // Patterns to exclude (e.g., ['join', 'leave', 'added', 'removed'])
 *   includeIntro?: boolean,           // Include community intro section (default: true)
 *   customSections?: object[],        // Custom sections to include
 *   previousSummaryPath?: string,     // Path to previous summary for format reference
 * }
 * @outputs {
 *   success: boolean,
 *   primaryPath: string,
 *   secondaryPath?: string,
 *   themes: array,
 *   keyTakeaways: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_EXCLUDE_PATTERNS = [
  'joined using', 'added', 'removed', 'left', 'changed the group',
  'changed this group', 'created group', 'Messages and calls are end-to-end encrypted'
];

const DEFAULT_CONTENT_FOCUS = ['technical', 'tips', 'qa', 'resources', 'discussions'];

const RTL_LANGUAGES = ['he', 'ar', 'fa', 'ur'];

// ============================================================================
// Task Definitions
// ============================================================================

/**
 * STAGE 1: Analyze transcript and extract key discussions
 */
const analyzeTranscriptTask = defineTask('analyze-transcript', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze chat transcript for key discussions',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Community manager analyzing chat discussions',
      task: `Analyze the chat transcript and extract key educational discussions.

TRANSCRIPT LOCATION: ${args.transcriptPath}
PLATFORM: ${args.platform}
COMMUNITY: ${args.community.name}
TOPIC: ${args.community.topic || 'General'}
DATE RANGE: ${args.dateRange}
CONTENT FOCUS: ${args.contentFocus.join(', ')}
EXCLUDE PATTERNS: ${args.excludePatterns.join(', ')}

INSTRUCTIONS:
1. Read the transcript file(s) in the specified location
2. If directory, look for common transcript files (_chat.txt, messages.json, etc.)
3. Look at any images in the directory to understand visual context
4. Extract discussions that provide educational value based on content focus:
   - Technical tips and workflows
   - Tool recommendations and comparisons
   - Problem-solving approaches
   - Best practices shared
   - Code examples or configuration shared
   - Community Q&A that teaches something
5. Identify key contributors and their insights
6. Group discussions by theme/topic
7. Note any links or resources shared

IMPORTANT:
- Focus on content people can LEARN from
- Skip messages matching exclude patterns
- Skip purely social messages (greetings, thanks without context)
- Extract actionable insights
- Preserve contributor names/handles for attribution

Return a structured analysis with themes, contributors, and key takeaways.`,
      instructions: [
        'Read the full transcript',
        'View any images for context',
        'Extract educational content based on focus areas',
        'Group by themes',
        'Identify key contributors',
        'Note shared resources and links',
      ],
      outputFormat: 'JSON with { themes: [{ title, discussions: [{ contributor, insight, links, context }] }], keyTakeaways: [], resourcesShared: [], statistics: { messagesAnalyzed, contributorsFound, themesIdentified } }'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'keyTakeaways', 'statistics'],
      properties: {
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              discussions: { type: 'array' }
            }
          }
        },
        keyTakeaways: { type: 'array', items: { type: 'string' } },
        resourcesShared: { type: 'array' },
        statistics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community', 'analysis', 'transcript']
}));

/**
 * STAGE 2: Generate summary in primary language
 */
const generatePrimarySummaryTask = defineTask('generate-primary-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate community summary in ${args.primaryLanguage}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer creating community summaries',
      task: `Generate a community summary in ${args.languageName}.

COMMUNITY: ${args.community.name}
TOPIC: ${args.community.topic || 'General'}
DATE RANGE: ${args.dateRange}
LANGUAGE: ${args.primaryLanguage} (${args.languageName})
INCLUDE INTRO: ${args.includeIntro}

ANALYSIS:
${JSON.stringify(args.analysis, null, 2)}

${args.previousSummaryContent ? `REFERENCE FORMAT (from previous summary):\n${args.previousSummaryContent}` : ''}

${args.customSections ? `CUSTOM SECTIONS TO INCLUDE:\n${JSON.stringify(args.customSections, null, 2)}` : ''}

WRITE THE SUMMARY:
${args.includeIntro ? `1. Start with a brief intro about "${args.community.name}"${args.community.description ? `: ${args.community.description}` : ''}` : '1. Skip intro section'}
2. Create sections for each major theme with:
   - Clear heading with relevant emoji
   - Key discussions with contributor @mentions
   - Actual quotes when impactful (use > blockquotes)
   - Links to tools/resources shared
3. Include a "Community Tips" or "Key Takeaways" section with practical insights
4. Include a "Resources Shared" section if links were shared
5. End with a "Useful Links" section if applicable
6. Footer: indicate this is a community summary

STYLE GUIDELINES:
- Make it educational - readers should learn something
- Use > blockquotes for direct quotes
- Use code blocks for technical content
- Be concise but complete
- Use emojis sparingly for section headers only
- Keep contributor attributions (e.g., @username or Name (@handle))

Write the complete markdown file content.`,
      instructions: [
        'Follow any reference format if provided',
        'Make content educational and actionable',
        'Include contributor mentions for attribution',
        'Add relevant links and resources',
        'Keep it concise but comprehensive',
      ],
      outputFormat: 'JSON with { markdown: string }'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown'],
      properties: {
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community', 'summary', 'content-generation']
}));

/**
 * STAGE 3: Generate secondary language summary (optional)
 */
const generateSecondarySummaryTask = defineTask('generate-secondary-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Translate summary to ${args.secondaryLanguage}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical translator creating community summaries',
      task: `Translate the community summary to ${args.languageName}.

PRIMARY SUMMARY:
${args.primaryMarkdown}

TARGET LANGUAGE: ${args.secondaryLanguage} (${args.languageName})
RTL OPTIMIZE: ${args.rtlOptimize}
DATE RANGE: ${args.dateRange}

TRANSLATION GUIDELINES:
1. Translate the full content naturally
2. Adapt date formats for the target language/locale
3. Maintain the same structure and emojis
4. Keep technical terms that are commonly used in English if that's the norm

${args.rtlOptimize ? `
CRITICAL - RTL PLATFORM COMPATIBILITY:
Some platforms (like WhatsApp) strip Unicode direction control characters (RLM, RLE, RLI, etc.) when text is pasted.
The ONLY reliable solution is to ensure EVERY LINE STARTS WITH RTL TEXT (Hebrew/Arabic characters).

RESTRUCTURING RULES (MANDATORY):
1. **Names/Mentions**: Put translated/transliterated name FIRST, then @mention in parentheses
   - WRONG: @Username built support
   - CORRECT: [Translated Name] (@Username) built support

2. **Links**: Prefix with RTL word (e.g., Hebrew: "קישור:", Arabic: "رابط:")
   - WRONG: 🔗 github.com/example
   - CORRECT: [Link word]: github.com/example

3. **English Terms**: Place AFTER RTL context, never at line start
   - WRONG: GitHub Codespaces is used for testing
   - CORRECT: [RTL description] GitHub Codespaces [RTL continuation]

4. **Common technical terms**: Translate to RTL equivalents where natural
   - quality gates → [RTL equivalent]
   - breakpoints → [RTL equivalent]
   - pull request → [RTL equivalent]

5. **Brand names**: Can stay in English but should come AFTER RTL description

6. **Tables**: Start each cell content with RTL characters where possible

7. **Quotes**: Start the quoted text with RTL characters

8. **Code blocks**: Keep as-is (English code is fine inside code blocks)

9. **Emojis**: Can appear at start of headers (they're neutral), but body text should start with RTL
` : ''}

Write the complete translated markdown file.`,
      instructions: [
        'Translate naturally to target language',
        args.rtlOptimize ? 'EVERY line must START with RTL characters (except code blocks)' : '',
        args.rtlOptimize ? 'Put @mentions AFTER translated names in parentheses' : '',
        args.rtlOptimize ? 'Prefix links with RTL words' : '',
        'Maintain technical accuracy',
      ].filter(Boolean),
      outputFormat: 'JSON with { markdown: string }'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown'],
      properties: {
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community', 'translation', 'rtl']
}));

/**
 * STAGE 4: Write output files
 */
const writeFilesTask = defineTask('write-files', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write summary files',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'File system agent',
      task: `Write the community summary files to disk.

PRIMARY CONTENT (${args.primaryLanguage}):
${args.primaryMarkdown}

${args.secondaryMarkdown ? `SECONDARY CONTENT (${args.secondaryLanguage}):\n${args.secondaryMarkdown}` : ''}

OUTPUT DIRECTORY: ${args.outputDir}
OUTPUT PREFIX: ${args.outputPrefix}
DATE SUFFIX: ${args.dateSuffix}

FILES TO CREATE:
1. ${args.outputDir}/${args.outputPrefix}-${args.dateSuffix}-${args.primaryLanguage}.md
${args.secondaryMarkdown ? `2. ${args.outputDir}/${args.outputPrefix}-${args.dateSuffix}-${args.secondaryLanguage}.md` : ''}

Use the Write tool to create the file(s). Ensure the output directory exists.`,
      instructions: [
        'Create primary language file',
        args.secondaryMarkdown ? 'Create secondary language file' : '',
        'Verify files were created',
      ].filter(Boolean),
      outputFormat: 'JSON with { primaryPath: string, secondaryPath?: string, success: boolean }'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'primaryPath'],
      properties: {
        success: { type: 'boolean' },
        primaryPath: { type: 'string' },
        secondaryPath: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community', 'file-write']
}));

// ============================================================================
// Helper Functions
// ============================================================================

function getLanguageName(code) {
  const names = {
    en: 'English',
    he: 'Hebrew',
    ar: 'Arabic',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    it: 'Italian',
    nl: 'Dutch',
    pl: 'Polish',
    tr: 'Turkish',
    fa: 'Persian',
    ur: 'Urdu',
  };
  return names[code] || code;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
  // ============================================================================
// Main Process
// ============================================================================

export async function process(inputs, ctx) {
  const {
    transcriptPath,
    platform = 'generic',
    community,
    dateRange,
    outputDir,
    outputPrefix,
    primaryLanguage = 'en',
    secondaryLanguage,
    rtlOptimize,
    contentFocus = DEFAULT_CONTENT_FOCUS,
    excludePatterns = DEFAULT_EXCLUDE_PATTERNS,
    includeIntro = true,
    customSections,
    previousSummaryPath
  } = inputs;

  // Validate required inputs
  if (!transcriptPath) throw new Error('transcriptPath is required');
  if (!community?.name) throw new Error('community.name is required');
  if (!dateRange) throw new Error('dateRange is required');
  if (!outputDir) throw new Error('outputDir is required');

  // Determine RTL optimization need
  const shouldOptimizeRtl = rtlOptimize ?? (
    secondaryLanguage && RTL_LANGUAGES.includes(secondaryLanguage)
  );

  // Generate output prefix from community name if not provided
  const prefix = outputPrefix || slugify(community.name) + '-summary';

  // Stage 1: Analyze transcript
  ctx.log('Analyzing transcript...');
  const analysis = await ctx.task(analyzeTranscriptTask, {
    transcriptPath,
    platform,
    community,
    dateRange,
    contentFocus,
    excludePatterns,
  });

  // Read previous summary for format reference if provided
  let previousSummaryContent = '';
  if (previousSummaryPath) {
    previousSummaryContent = `Read format from: ${previousSummaryPath}`;
  }
  // Stage 2: Generate primary language summary
  ctx.log(`Generating ${primaryLanguage} summary...`);
  const primaryResult = await ctx.task(generatePrimarySummaryTask, {
    analysis,
    community,
    dateRange,
    primaryLanguage,
    languageName: getLanguageName(primaryLanguage),
    includeIntro,
    customSections,
    previousSummaryContent,
  });

  // Stage 3: Generate secondary language summary (optional)
  let secondaryResult = null;
  if (secondaryLanguage) {
    ctx.log(`Generating ${secondaryLanguage} summary...`);
    secondaryResult = await ctx.task(generateSecondarySummaryTask, {
      primaryMarkdown: primaryResult.markdown,
      secondaryLanguage,
      languageName: getLanguageName(secondaryLanguage),
      rtlOptimize: shouldOptimizeRtl,
      dateRange,
    });
  }
  // Compute date suffix for filenames
  const dateSuffix = dateRange.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/,/g, '')
    .replace(/\./g, '');

  // Stage 4: Write files
  ctx.log('Writing output files...');
  const writeResult = await ctx.task(writeFilesTask, {
    primaryMarkdown: primaryResult.markdown,
    secondaryMarkdown: secondaryResult?.markdown,
    primaryLanguage,
    secondaryLanguage,
    outputDir,
    outputPrefix: prefix,
    dateSuffix,
  });

  return {
    success: writeResult.success,
    primaryPath: writeResult.primaryPath,
    secondaryPath: writeResult.secondaryPath,
    themes: analysis.themes,
    keyTakeaways: analysis.keyTakeaways,
    statistics: analysis.statistics,
    languages: {
      primary: primaryLanguage,
      secondary: secondaryLanguage,
    },
    metadata: {
      processId: 'domains/business/knowledge-management/chat-transcript-summarizer',
      timestamp: ctx.now(),
      platform,
      community: community.name,
    }
  };
}

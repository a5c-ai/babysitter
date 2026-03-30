# Chat Transcript Summarizer

A generic, reusable Babysitter process for generating educational community summaries from chat transcripts.

## Overview

This process analyzes chat transcripts from various platforms (WhatsApp, Discord, Slack, Telegram, etc.) and generates structured, educational summaries highlighting:

- Key discussions and insights
- Technical tips and best practices
- Q&A that teaches something
- Resources and links shared
- Contributor attributions

## Features

- **Multi-platform support**: WhatsApp, Discord, Slack, Telegram, or generic text files
- **Multi-language support**: Generate summaries in any language
- **Bilingual output**: Optionally generate summaries in two languages
- **RTL optimization**: Special handling for Hebrew/Arabic to ensure proper display in platforms that strip Unicode direction characters (like WhatsApp)
- **Configurable focus**: Choose which types of content to highlight
- **Educational extraction**: Focuses on content people can learn from
- **Attribution preservation**: Keeps contributor mentions for credit

## Usage

### Basic Usage (English-only)

```javascript
{
  "transcriptPath": "./discord-export/",
  "platform": "discord",
  "community": {
    "name": "My Dev Community",
    "topic": "Web Development"
  },
  "dateRange": "Mar 1-7, 2026",
  "outputDir": "./summaries/",
  "primaryLanguage": "en"
}
```

### Bilingual with RTL (Hebrew + English)

```javascript
{
  "transcriptPath": "./whatsapp-export/",
  "platform": "whatsapp",
  "community": {
    "name": "Tech Israel",
    "topic": "Developer Tools"
  },
  "dateRange": "Mar 1-7, 2026",
  "outputDir": "./community/updates/",
  "primaryLanguage": "he",
  "secondaryLanguage": "en",
  "rtlOptimize": true
}
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transcriptPath` | string | Yes | Path to chat transcript file or directory |
| `platform` | string | No | Platform: 'whatsapp', 'discord', 'slack', 'telegram', 'generic' |
| `community.name` | string | Yes | Community name |
| `community.topic` | string | No | Main topic/product discussed |
| `community.description` | string | No | Brief description for intro section |
| `dateRange` | string | Yes | Date range covered (e.g., "Mar 1-7, 2026") |
| `outputDir` | string | Yes | Output directory for generated files |
| `outputPrefix` | string | No | Filename prefix (default: slugified community name) |
| `primaryLanguage` | string | No | Primary language code (default: 'en') |
| `secondaryLanguage` | string | No | Optional second language for bilingual output |
| `rtlOptimize` | boolean | No | Enable RTL restructuring for WhatsApp compatibility |
| `contentFocus` | string[] | No | Focus areas: 'technical', 'tips', 'qa', 'resources', 'discussions' |
| `excludePatterns` | string[] | No | Patterns to skip (join/leave messages, etc.) |
| `includeIntro` | boolean | No | Include community intro section (default: true) |
| `customSections` | object[] | No | Custom sections to include in output |
| `previousSummaryPath` | string | No | Path to previous summary for format reference |

## Output

Returns:
```javascript
{
  "success": true,
  "primaryPath": "./summaries/my-community-summary-mar-1-7-2026-en.md",
  "secondaryPath": "./summaries/my-community-summary-mar-1-7-2026-he.md",
  "themes": [...],
  "keyTakeaways": [...],
  "statistics": {
    "messagesAnalyzed": 150,
    "contributorsFound": 12,
    "themesIdentified": 5
  }
}
```

## RTL Handling

For platforms like WhatsApp that strip Unicode direction control characters, the process can restructure text so every line starts with RTL characters:

- Names: `[Hebrew name] (@Username)` instead of `@Username`
- Links: `קישור: github.com/...` instead of `🔗 github.com/...`
- English terms placed after Hebrew context, not at line start

This is automatically enabled when `secondaryLanguage` is Hebrew/Arabic, or can be explicitly set via `rtlOptimize: true`.

## Supported Platforms

| Platform | Transcript Format |
|----------|-------------------|
| WhatsApp | `_chat.txt` export (with optional media folder) |
| Discord | Server export or channel export |
| Slack | JSON export or channel history |
| Telegram | JSON or HTML export |
| Generic | Any text file with chat format |

## Contributing

This process was designed to be generic and reusable. Contributions welcome for:
- Additional platform parsers
- More language support
- Custom section templates
- Improved content extraction

## License

MIT - Feel free to use, modify, and contribute back!

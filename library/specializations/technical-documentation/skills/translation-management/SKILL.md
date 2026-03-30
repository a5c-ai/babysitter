---
name: translation-management
description: Integration with translation management systems and i18n workflows. Connect with Crowdin, Transifex, Weblate, manage translation memory, synchronize glossaries, and automate localization pipelines.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-010
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Translation Management Skill

Integration with translation management systems and i18n workflows.

## Capabilities

- Crowdin API integration (upload, download, status)
- Transifex API integration
- Weblate integration
- Translation memory management
- Glossary synchronization
- Pseudo-localization generation
- String extraction from documentation
- Locale file management (JSON, XLIFF, PO)

## Usage

Invoke this skill when you need to:
- Set up translation workflows
- Sync content with TMS platforms
- Manage translation memory
- Generate pseudo-localizations
- Extract translatable strings

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platform | string | Yes | crowdin, transifex, weblate |
| action | string | Yes | upload, download, status, sync-glossary |
| sourcePath | string | No | Path to source content |
| targetLocales | array | No | Target locales for translation |
| projectId | string | No | Project identifier on platform |
| apiKey | string | No | Platform API key (from env) |

### Input Example

```json
{
  "platform": "crowdin",
  "action": "upload",
  "sourcePath": "./docs/en",
  "targetLocales": ["es", "fr", "de", "ja"],
  "projectId": "my-docs"
}
```

## Crowdin Integration

### crowdin.yml Configuration

```yaml
project_id: 123456
api_token_env: CROWDIN_TOKEN
preserve_hierarchy: true
base_path: docs

files:
  - source: /en/**/*.md
    translation: /%locale%/**/%original_file_name%
    update_option: update_as_unapproved
    skip_untranslated_strings: true
    export_quotes: double

  - source: /en/**/*.json
    translation: /%locale%/**/%original_file_name%
    type: json

bundles:
  - name: Documentation
    patterns:
      - "**/*.md"
    labels:
      - docs

languages_mapping:
  locale:
    pt-BR: pt_BR
    zh-CN: zh_Hans
    zh-TW: zh_Hant
```

### Crowdin CLI Commands

```bash
# Install CLI
npm install -g @crowdin/cli

# Upload sources
crowdin upload sources

# Download translations
crowdin download

# Check translation status
crowdin status

# Pre-translate with TM
crowdin pre-translate --method tm

# Upload glossary
crowdin glossary upload ./glossary.csv
```

### Crowdin API Integration

```javascript
const crowdin = require('@crowdin/crowdin-api-client');

const { projectsGroupsApi, sourceFilesApi, translationsApi } = new crowdin.default({
  token: process.env.CROWDIN_TOKEN
});

// Upload source file
async function uploadSource(projectId, filePath, content) {
  const storage = await crowdin.uploadStorage(content, path.basename(filePath));

  await sourceFilesApi.createFile(projectId, {
    storageId: storage.data.id,
    name: path.basename(filePath),
    directoryId: await getDirectoryId(filePath)
  });
}

// Download translations
async function downloadTranslations(projectId, locale) {
  const build = await translationsApi.buildProject(projectId, {
    targetLanguageIds: [locale]
  });

  // Wait for build
  let status;
  do {
    await sleep(1000);
    status = await translationsApi.checkBuildStatus(projectId, build.data.id);
  } while (status.data.status === 'inProgress');

  const download = await translationsApi.downloadBuild(projectId, build.data.id);
  return download.data.url;
}

// Get translation progress
async function getProgress(projectId) {
  const progress = await translationsApi.getProjectProgress(projectId);
  return progress.data.map(lang => ({
    locale: lang.data.languageId,
    translated: lang.data.translationProgress,
    approved: lang.data.approvalProgress
  }));
}
```

## Transifex Integration

### .tx/config

```ini
[main]
host = https://www.transifex.com

[o:myorg:p:mydocs:r:documentation]
file_filter = docs/<lang>/**/*.md
source_file = docs/en/**/*.md
source_lang = en
type = GITHUBMARKDOWN

[o:myorg:p:mydocs:r:ui-strings]
file_filter = locales/<lang>.json
source_file = locales/en.json
source_lang = en
type = KEYVALUEJSON
```

### Transifex CLI

```bash
# Install CLI
pip install transifex-client

# Push source files
tx push -s

# Pull translations
tx pull -a

# Pull specific language
tx pull -l es

# Check status
tx status
```

## Weblate Integration

### weblate.yml

```yaml
project: my-docs
component: documentation
format: markdown
source_language: en

files:
  - filemask: docs/*/index.md
    file_format: md
    template: docs/en/index.md

translation_memory: true
machine_translation:
  - service: deepl
    key_env: DEEPL_KEY

quality_checks:
  - placeholders
  - urls
  - xml_tags
```

### Weblate API

```python
import wlc

client = wlc.Weblate(
    url='https://weblate.example.com/api/',
    key=os.environ['WEBLATE_KEY']
)

# Get translation status
project = client.get_project('my-docs')
for component in project.components():
    for translation in component.translations():
        print(f"{translation.language}: {translation.translated_percent}%")

# Trigger translation memory rebuild
component = client.get_component('my-docs/documentation')
component.rebuild_translation_memory()
```

## Translation Memory

### TM Management

```javascript
class TranslationMemory {
  constructor(storage) {
    this.storage = storage;
  }

  // Add translation to memory
  async add(source, target, locale, metadata = {}) {
    const entry = {
      source,
      target,
      locale,
      timestamp: Date.now(),
      ...metadata
    };

    const hash = this.hash(source);
    await this.storage.set(`tm:${locale}:${hash}`, entry);
  }

  // Find matches
  async findMatches(source, locale, minScore = 0.7) {
    const entries = await this.storage.getByPrefix(`tm:${locale}:`);
    const matches = [];

    for (const entry of entries) {
      const score = this.calculateSimilarity(source, entry.source);
      if (score >= minScore) {
        matches.push({
          ...entry,
          score,
          matchType: score === 1 ? 'exact' : 'fuzzy'
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  // Import from TMX
  async importTMX(tmxContent) {
    const parser = new TMXParser();
    const entries = await parser.parse(tmxContent);

    for (const entry of entries) {
      await this.add(entry.source, entry.target, entry.locale, {
        importedFrom: 'tmx'
      });
    }
  }

  // Export to TMX
  async exportTMX(locale) {
    const entries = await this.storage.getByPrefix(`tm:${locale}:`);
    return this.generateTMX(entries);
  }
}
```

## Glossary Management

### Glossary Format

```csv
term,definition,context,do_not_translate
API,Application Programming Interface,Technical term,false
SDK,Software Development Kit,Technical term,false
OAuth,Open Authorization,Authentication protocol,true
```

### Glossary Sync

```javascript
async function syncGlossary(platform, glossaryPath) {
  const glossary = await parseGlossary(glossaryPath);

  switch (platform) {
    case 'crowdin':
      await crowdin.glossary.upload(glossary);
      break;
    case 'transifex':
      await transifex.glossary.sync(glossary);
      break;
  }

  return {
    terms: glossary.length,
    synced: true
  };
}

function parseGlossary(path) {
  const content = fs.readFileSync(path, 'utf8');
  const rows = csvParse(content, { columns: true });

  return rows.map(row => ({
    term: row.term,
    definition: row.definition,
    context: row.context,
    doNotTranslate: row.do_not_translate === 'true'
  }));
}
```

## Pseudo-Localization

### Generate Pseudo-Locale

```javascript
function pseudoLocalize(text, options = {}) {
  const {
    expansion: expansionFactor = 1.3,
    accents: useAccents = true,
    brackets: useBrackets = true
  } = options;

  // Character mapping for accented characters
  const accentMap = {
    'a': 'ä', 'e': 'ë', 'i': 'ï', 'o': 'ö', 'u': 'ü',
    'A': 'Ä', 'E': 'Ë', 'I': 'Ï', 'O': 'Ö', 'U': 'Ü',
    'c': 'ç', 'n': 'ñ'
  };

  let result = text;

  // Apply accents
  if (useAccents) {
    result = result.split('').map(char =>
      accentMap[char] || char
    ).join('');
  }

  // Simulate text expansion
  const expansion = Math.ceil(text.length * (expansionFactor - 1));
  const padding = '~'.repeat(expansion);

  // Add brackets
  if (useBrackets) {
    result = `[${result}${padding}]`;
  }

  return result;
}

// Example: "Hello" -> "[Hëllö~~~]"
```

## Workflow

1. **Extract strings** - Find translatable content
2. **Upload to TMS** - Push source files
3. **Sync glossary** - Update terminology
4. **Monitor progress** - Track translation status
5. **Download translations** - Pull completed translations
6. **Validate** - Check translation quality
7. **Deploy** - Build localized documentation

## Dependencies

```json
{
  "devDependencies": {
    "@crowdin/crowdin-api-client": "^1.30.0",
    "transifex-api": "^0.2.0",
    "csv-parse": "^5.5.0",
    "xml2js": "^0.6.0"
  }
}
```

## CLI Commands

```bash
# Crowdin
crowdin upload sources && crowdin download

# Transifex
tx push -s && tx pull -a

# Generate pseudo-locale
node scripts/pseudo-localize.js --input en --output pseudo
```

## Best Practices Applied

- Keep source strings context-aware
- Maintain terminology glossaries
- Use translation memory for consistency
- Test with pseudo-localization first
- Automate sync in CI/CD
- Version translations with docs

## References

- Crowdin: https://crowdin.com/
- Transifex: https://www.transifex.com/
- Weblate: https://weblate.org/
- XLIFF: https://docs.oasis-open.org/xliff/xliff-core/v2.1/xliff-core-v2.1.html

## Target Processes

- docs-localization.js
- terminology-management.js
- content-strategy.js

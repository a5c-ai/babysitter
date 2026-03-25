---
name: confluence-docs
description: Atlassian Confluence integration for enterprise documentation. Create and update pages via API, manage spaces and permissions, handle content migration, and sync between Markdown and Confluence.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-013
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Confluence Integration Skill

Atlassian Confluence integration for enterprise documentation.

## Capabilities

- Page creation and updates via API
- Space management and permissions
- Macro and template management
- Content migration (Markdown to Confluence)
- Attachment handling
- Label and metadata management
- Confluence Cloud and Server support
- Confluence-to-Markdown export

## Usage

Invoke this skill when you need to:
- Sync documentation to Confluence
- Migrate content between formats
- Manage Confluence spaces programmatically
- Automate page updates from CI/CD
- Export Confluence to Markdown

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | create, update, migrate, export |
| baseUrl | string | Yes | Confluence instance URL |
| spaceKey | string | Yes | Target space key |
| sourcePath | string | No | Source Markdown files |
| pageId | string | No | Specific page ID for updates |
| parentPageId | string | No | Parent page for hierarchy |

### Input Example

```json
{
  "action": "migrate",
  "baseUrl": "https://company.atlassian.net/wiki",
  "spaceKey": "DOCS",
  "sourcePath": "./docs",
  "parentPageId": "123456"
}
```

## Configuration

### confluence.config.json

```json
{
  "baseUrl": "https://company.atlassian.net/wiki",
  "auth": {
    "type": "token",
    "email": "${CONFLUENCE_EMAIL}",
    "token": "${CONFLUENCE_TOKEN}"
  },
  "space": {
    "key": "DOCS",
    "name": "Documentation"
  },
  "migration": {
    "preserveStructure": true,
    "convertTables": true,
    "uploadImages": true,
    "macroMapping": {
      "note": "info",
      "warning": "warning",
      "code": "code"
    }
  },
  "sync": {
    "dryRun": false,
    "updateExisting": true,
    "createMissing": true,
    "archiveRemoved": false
  }
}
```

## API Integration

### Confluence REST API Client

```javascript
const ConfluenceClient = require('confluence-api');

class ConfluenceManager {
  constructor(config) {
    this.client = new ConfluenceClient({
      username: config.email,
      password: config.token,
      baseUrl: config.baseUrl
    });
  }

  // Create a new page
  async createPage(spaceKey, title, content, parentId = null) {
    const page = {
      type: 'page',
      title,
      space: { key: spaceKey },
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };

    if (parentId) {
      page.ancestors = [{ id: parentId }];
    }

    return await this.client.postContent(page);
  }

  // Update existing page
  async updatePage(pageId, title, content, version) {
    const page = {
      id: pageId,
      type: 'page',
      title,
      version: { number: version + 1 },
      body: {
        storage: {
          value: content,
          representation: 'storage'
        }
      }
    };

    return await this.client.putContent(page);
  }

  // Get page by title
  async getPageByTitle(spaceKey, title) {
    const result = await this.client.getContentBySpaceKey(spaceKey, {
      title,
      expand: 'version,body.storage'
    });
    return result.results[0] || null;
  }

  // Upload attachment
  async uploadAttachment(pageId, filePath, comment = '') {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('comment', comment);

    return await this.client.createAttachment(pageId, form);
  }

  // Add labels
  async addLabels(pageId, labels) {
    const labelPayload = labels.map(name => ({
      prefix: 'global',
      name
    }));

    return await this.client.postLabels(pageId, labelPayload);
  }
}
```

## Markdown to Confluence Conversion

### Converter

```javascript
const marked = require('marked');

class MarkdownToConfluence {
  constructor(options = {}) {
    this.options = options;
    this.attachments = [];
  }

  convert(markdown, metadata = {}) {
    // Parse front matter
    const { content, frontMatter } = this.parseFrontMatter(markdown);

    // Convert markdown to HTML
    let html = marked.parse(content);

    // Convert to Confluence storage format
    html = this.convertToStorageFormat(html);

    // Handle macros
    html = this.convertMacros(html);

    // Handle code blocks
    html = this.convertCodeBlocks(html);

    // Handle images
    html = this.convertImages(html);

    // Handle tables
    html = this.convertTables(html);

    return {
      title: frontMatter.title || metadata.title,
      content: html,
      labels: frontMatter.tags || [],
      attachments: this.attachments
    };
  }

  convertMacros(html) {
    // Convert admonitions to Confluence macros
    const macroMap = {
      'note': 'info',
      'warning': 'warning',
      'tip': 'tip',
      'danger': 'warning'
    };

    for (const [mdType, confType] of Object.entries(macroMap)) {
      const regex = new RegExp(`<div class="${mdType}">([\\s\\S]*?)</div>`, 'g');
      html = html.replace(regex, (match, content) => {
        return `<ac:structured-macro ac:name="${confType}">
          <ac:rich-text-body>${content}</ac:rich-text-body>
        </ac:structured-macro>`;
      });
    }

    return html;
  }

  convertCodeBlocks(html) {
    // Convert code blocks to Confluence code macro
    return html.replace(
      /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
      (match, language, code) => {
        const decodedCode = this.decodeHtml(code);
        return `<ac:structured-macro ac:name="code">
          <ac:parameter ac:name="language">${language}</ac:parameter>
          <ac:plain-text-body><![CDATA[${decodedCode}]]></ac:plain-text-body>
        </ac:structured-macro>`;
      }
    );
  }

  convertImages(html) {
    // Convert images to Confluence attachments
    return html.replace(
      /<img src="([^"]+)" alt="([^"]*)"[^>]*>/g,
      (match, src, alt) => {
        if (src.startsWith('http')) {
          // External image
          return `<ac:image><ri:url ri:value="${src}" /></ac:image>`;
        } else {
          // Local attachment
          const filename = path.basename(src);
          this.attachments.push({ src, filename });
          return `<ac:image><ri:attachment ri:filename="${filename}" /></ac:image>`;
        }
      }
    );
  }

  convertTables(html) {
    // Confluence uses standard HTML tables but needs specific attributes
    return html.replace(/<table>/g, '<table class="wrapped">');
  }
}
```

## Confluence to Markdown Export

### Exporter

```javascript
class ConfluenceToMarkdown {
  constructor(client) {
    this.client = client;
  }

  async exportSpace(spaceKey, outputDir) {
    const pages = await this.getAllPages(spaceKey);
    const structure = this.buildHierarchy(pages);

    for (const page of pages) {
      const markdown = await this.exportPage(page);
      const filePath = this.getFilePath(page, structure, outputDir);

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, markdown);
    }

    return { exported: pages.length };
  }

  async exportPage(page) {
    const content = page.body.storage.value;

    // Convert Confluence storage format to Markdown
    let markdown = this.convertToMarkdown(content);

    // Add front matter
    const frontMatter = {
      title: page.title,
      confluence_id: page.id,
      last_modified: page.version.when
    };

    return `---
${yaml.stringify(frontMatter)}---

${markdown}`;
  }

  convertToMarkdown(storage) {
    let md = storage;

    // Convert code macro
    md = md.replace(
      /<ac:structured-macro ac:name="code"[^>]*>[\s\S]*?<ac:parameter ac:name="language">(\w+)<\/ac:parameter>[\s\S]*?<ac:plain-text-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-body>[\s\S]*?<\/ac:structured-macro>/g,
      (match, lang, code) => `\`\`\`${lang}\n${code}\n\`\`\``
    );

    // Convert info macro
    md = md.replace(
      /<ac:structured-macro ac:name="(info|warning|tip)"[^>]*>[\s\S]*?<ac:rich-text-body>([\s\S]*?)<\/ac:rich-text-body>[\s\S]*?<\/ac:structured-macro>/g,
      (match, type, content) => `> **${type.toUpperCase()}:** ${this.stripHtml(content)}`
    );

    // Convert headings, lists, etc.
    md = this.convertHtmlToMarkdown(md);

    return md;
  }
}
```

## Sync Workflow

### Bidirectional Sync

```javascript
async function syncDocumentation(config) {
  const confluence = new ConfluenceManager(config);
  const converter = new MarkdownToConfluence(config.migration);

  // Get local files
  const localFiles = await glob('docs/**/*.md');

  // Get Confluence pages
  const pages = await confluence.getSpaceContent(config.space.key);

  const results = {
    created: [],
    updated: [],
    skipped: [],
    errors: []
  };

  for (const file of localFiles) {
    try {
      const markdown = await fs.readFile(file, 'utf8');
      const converted = converter.convert(markdown, { file });

      // Check if page exists
      const existing = await confluence.getPageByTitle(
        config.space.key,
        converted.title
      );

      if (existing) {
        if (config.sync.updateExisting) {
          await confluence.updatePage(
            existing.id,
            converted.title,
            converted.content,
            existing.version.number
          );
          results.updated.push(file);
        } else {
          results.skipped.push(file);
        }
      } else if (config.sync.createMissing) {
        await confluence.createPage(
          config.space.key,
          converted.title,
          converted.content,
          config.parentPageId
        );
        results.created.push(file);
      }

      // Upload attachments
      for (const attachment of converted.attachments) {
        await confluence.uploadAttachment(
          existing?.id || results.created[results.created.length - 1].id,
          attachment.src
        );
      }
    } catch (error) {
      results.errors.push({ file, error: error.message });
    }
  }

  return results;
}
```

## Space Management

### Create Space

```javascript
async function createDocumentationSpace(config) {
  const client = new ConfluenceManager(config);

  const space = await client.client.postSpace({
    key: config.space.key,
    name: config.space.name,
    description: {
      plain: { value: config.space.description, representation: 'plain' }
    },
    permissions: [
      {
        subjects: { group: { name: 'confluence-users' } },
        operation: { key: 'read', target: 'space' }
      }
    ]
  });

  // Create home page
  await client.createPage(
    config.space.key,
    'Home',
    '<h1>Welcome to Documentation</h1>',
    null
  );

  return space;
}
```

## Workflow

1. **Configure** - Set up Confluence credentials and space
2. **Convert** - Transform Markdown to Confluence format
3. **Sync** - Upload/update pages via API
4. **Attachments** - Upload images and files
5. **Labels** - Apply labels for organization
6. **Verify** - Check page rendering

## Dependencies

```json
{
  "devDependencies": {
    "confluence-api": "^1.4.0",
    "marked": "^12.0.0",
    "gray-matter": "^4.0.0",
    "form-data": "^4.0.0"
  }
}
```

## CLI Commands

```bash
# Sync Markdown to Confluence
node scripts/confluence-sync.js --config confluence.config.json

# Export Confluence to Markdown
node scripts/confluence-export.js --space DOCS --output ./exported

# Create new space
node scripts/confluence-space.js create --key NEWDOCS --name "New Documentation"
```

## Best Practices Applied

- Use page templates for consistency
- Organize with parent pages
- Apply labels for discoverability
- Keep source of truth in Git
- Sync on merge to main branch
- Handle attachments properly

## References

- Confluence REST API: https://developer.atlassian.com/cloud/confluence/rest/
- Storage Format: https://confluence.atlassian.com/doc/confluence-storage-format-790796544.html
- confluence-api npm: https://www.npmjs.com/package/confluence-api

## Target Processes

- knowledge-base-setup.js
- docs-pr-workflow.js
- content-strategy.js

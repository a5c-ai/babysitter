---
name: gitbook-notion
description: Integration with hosted documentation platforms GitBook and Notion. Manage spaces, synchronize content with Git, export/import between formats, configure webhooks, and retrieve analytics.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-011
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# GitBook/Notion Integration Skill

Integration with hosted documentation platforms.

## Capabilities

- GitBook space management
- Notion database integration for docs
- Content synchronization with Git
- Export/import between formats
- Embed and block management
- API documentation hosting
- Analytics retrieval
- Webhook configuration

## Usage

Invoke this skill when you need to:
- Sync documentation to GitBook or Notion
- Manage hosted documentation spaces
- Export content for migration
- Configure publishing workflows
- Retrieve documentation analytics

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platform | string | Yes | gitbook, notion |
| action | string | Yes | sync, export, import, analytics |
| spaceId | string | No | GitBook space or Notion database ID |
| sourcePath | string | No | Path to source content |
| outputPath | string | No | Path for exported content |

### Input Example

```json
{
  "platform": "gitbook",
  "action": "sync",
  "spaceId": "abc123",
  "sourcePath": "./docs"
}
```

## GitBook Integration

### GitBook Configuration

```yaml
# .gitbook.yaml
root: ./docs

structure:
  readme: README.md
  summary: SUMMARY.md

redirects:
  /old-page: /new-page
  /api/v1: /api/v2
```

### SUMMARY.md Structure

```markdown
# Summary

## Getting Started

* [Introduction](README.md)
* [Installation](getting-started/installation.md)
* [Quick Start](getting-started/quickstart.md)

## User Guide

* [Configuration](user-guide/configuration.md)
* [Features](user-guide/features.md)
  * [Authentication](user-guide/features/auth.md)
  * [Data Management](user-guide/features/data.md)

## API Reference

* [Overview](api/README.md)
* [Authentication](api/authentication.md)
* [Endpoints](api/endpoints/README.md)
  * [Users](api/endpoints/users.md)
  * [Projects](api/endpoints/projects.md)

## Resources

* [FAQ](resources/faq.md)
* [Changelog](CHANGELOG.md)
```

### GitBook API Integration

```javascript
const GitBook = require('gitbook-api');

class GitBookManager {
  constructor(token) {
    this.client = new GitBook({ token });
  }

  // List spaces
  async listSpaces(organizationId) {
    return await this.client.spaces.list({
      organizationId
    });
  }

  // Get space content
  async getContent(spaceId) {
    const pages = await this.client.spaces.listPages(spaceId);
    return pages;
  }

  // Update page
  async updatePage(spaceId, pageId, content) {
    return await this.client.pages.update(spaceId, pageId, {
      document: {
        markdown: content
      }
    });
  }

  // Create page
  async createPage(spaceId, title, content, parentId = null) {
    return await this.client.pages.create(spaceId, {
      title,
      parent: parentId,
      document: {
        markdown: content
      }
    });
  }

  // Sync from Git
  async syncFromGit(spaceId, repoUrl, branch = 'main') {
    return await this.client.spaces.sync(spaceId, {
      source: 'github',
      url: repoUrl,
      branch
    });
  }

  // Get analytics
  async getAnalytics(spaceId, period = '30d') {
    return await this.client.spaces.getAnalytics(spaceId, {
      period
    });
  }
}
```

### GitBook CI/CD Sync

```yaml
# .github/workflows/gitbook-sync.yml
name: Sync to GitBook

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Sync to GitBook
        uses: gitbook/github-action-sync@v1
        with:
          token: ${{ secrets.GITBOOK_TOKEN }}
          space: ${{ secrets.GITBOOK_SPACE_ID }}
```

## Notion Integration

### Notion Database Schema

```javascript
const notionSchema = {
  database_id: 'abc123',
  properties: {
    'Title': {
      type: 'title',
      title: {}
    },
    'Slug': {
      type: 'rich_text',
      rich_text: {}
    },
    'Category': {
      type: 'select',
      select: {
        options: [
          { name: 'Guide', color: 'blue' },
          { name: 'Reference', color: 'green' },
          { name: 'Tutorial', color: 'purple' }
        ]
      }
    },
    'Status': {
      type: 'status',
      status: {
        options: [
          { name: 'Draft', color: 'gray' },
          { name: 'Review', color: 'yellow' },
          { name: 'Published', color: 'green' }
        ]
      }
    },
    'Last Updated': {
      type: 'last_edited_time',
      last_edited_time: {}
    },
    'Author': {
      type: 'people',
      people: {}
    },
    'Tags': {
      type: 'multi_select',
      multi_select: {
        options: []
      }
    }
  }
};
```

### Notion API Integration

```javascript
const { Client } = require('@notionhq/client');

class NotionDocsManager {
  constructor(token) {
    this.notion = new Client({ auth: token });
  }

  // Query documentation pages
  async queryDocs(databaseId, filter = {}) {
    const response = await this.notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          { property: 'Status', status: { equals: 'Published' } },
          ...Object.entries(filter).map(([prop, value]) => ({
            property: prop,
            [typeof value === 'string' ? 'rich_text' : 'select']: {
              equals: value
            }
          }))
        ]
      },
      sorts: [
        { property: 'Last Updated', direction: 'descending' }
      ]
    });

    return response.results;
  }

  // Get page content
  async getPageContent(pageId) {
    const blocks = await this.notion.blocks.children.list({
      block_id: pageId
    });

    return this.blocksToMarkdown(blocks.results);
  }

  // Create documentation page
  async createDocPage(databaseId, title, content, properties = {}) {
    const blocks = this.markdownToBlocks(content);

    return await this.notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Title': {
          title: [{ text: { content: title } }]
        },
        'Slug': {
          rich_text: [{ text: { content: this.slugify(title) } }]
        },
        'Status': {
          status: { name: 'Draft' }
        },
        ...properties
      },
      children: blocks
    });
  }

  // Update page
  async updatePage(pageId, content) {
    // Clear existing blocks
    const existing = await this.notion.blocks.children.list({
      block_id: pageId
    });

    for (const block of existing.results) {
      await this.notion.blocks.delete({ block_id: block.id });
    }

    // Add new blocks
    const blocks = this.markdownToBlocks(content);
    await this.notion.blocks.children.append({
      block_id: pageId,
      children: blocks
    });
  }

  // Convert Notion blocks to Markdown
  blocksToMarkdown(blocks) {
    let markdown = '';

    for (const block of blocks) {
      switch (block.type) {
        case 'paragraph':
          markdown += this.richTextToMarkdown(block.paragraph.rich_text) + '\n\n';
          break;
        case 'heading_1':
          markdown += '# ' + this.richTextToMarkdown(block.heading_1.rich_text) + '\n\n';
          break;
        case 'heading_2':
          markdown += '## ' + this.richTextToMarkdown(block.heading_2.rich_text) + '\n\n';
          break;
        case 'heading_3':
          markdown += '### ' + this.richTextToMarkdown(block.heading_3.rich_text) + '\n\n';
          break;
        case 'bulleted_list_item':
          markdown += '- ' + this.richTextToMarkdown(block.bulleted_list_item.rich_text) + '\n';
          break;
        case 'numbered_list_item':
          markdown += '1. ' + this.richTextToMarkdown(block.numbered_list_item.rich_text) + '\n';
          break;
        case 'code':
          markdown += '```' + block.code.language + '\n';
          markdown += this.richTextToMarkdown(block.code.rich_text);
          markdown += '\n```\n\n';
          break;
        case 'quote':
          markdown += '> ' + this.richTextToMarkdown(block.quote.rich_text) + '\n\n';
          break;
        case 'callout':
          markdown += '> **' + block.callout.icon?.emoji + '** ';
          markdown += this.richTextToMarkdown(block.callout.rich_text) + '\n\n';
          break;
      }
    }

    return markdown;
  }

  // Convert Markdown to Notion blocks
  markdownToBlocks(markdown) {
    const blocks = [];
    const lines = markdown.split('\n');

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('# ')) {
        blocks.push({
          type: 'heading_1',
          heading_1: { rich_text: [{ text: { content: line.slice(2) } }] }
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: line.slice(3) } }] }
        });
      } else if (line.startsWith('### ')) {
        blocks.push({
          type: 'heading_3',
          heading_3: { rich_text: [{ text: { content: line.slice(4) } }] }
        });
      } else if (line.startsWith('```')) {
        const lang = line.slice(3);
        let code = '';
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          code += lines[i] + '\n';
          i++;
        }
        blocks.push({
          type: 'code',
          code: {
            language: lang || 'plain text',
            rich_text: [{ text: { content: code.trim() } }]
          }
        });
      } else if (line.startsWith('- ')) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: line.slice(2) } }]
          }
        });
      } else if (/^\d+\. /.test(line)) {
        blocks.push({
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ text: { content: line.replace(/^\d+\. /, '') } }]
          }
        });
      } else if (line.trim()) {
        blocks.push({
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: line } }] }
        });
      }

      i++;
    }

    return blocks;
  }
}
```

### Notion Export Script

```javascript
async function exportNotionToMarkdown(databaseId, outputDir) {
  const manager = new NotionDocsManager(process.env.NOTION_TOKEN);
  const pages = await manager.queryDocs(databaseId);

  for (const page of pages) {
    const title = page.properties.Title.title[0].plain_text;
    const slug = page.properties.Slug.rich_text[0]?.plain_text || slugify(title);
    const category = page.properties.Category.select?.name || 'uncategorized';

    const content = await manager.getPageContent(page.id);

    const frontMatter = `---
title: ${title}
notion_id: ${page.id}
last_updated: ${page.last_edited_time}
---

`;

    const filePath = path.join(outputDir, category, `${slug}.md`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, frontMatter + content);
  }
}
```

## Analytics

### GitBook Analytics

```javascript
async function getGitBookAnalytics(spaceId) {
  const analytics = await gitbook.getAnalytics(spaceId, '30d');

  return {
    pageViews: analytics.pageViews,
    uniqueVisitors: analytics.uniqueVisitors,
    topPages: analytics.topPages.map(p => ({
      path: p.path,
      views: p.views
    })),
    searchQueries: analytics.searches.map(s => ({
      query: s.query,
      count: s.count,
      noResults: s.noResults
    }))
  };
}
```

## Workflow

1. **Configure** - Set up API credentials
2. **Connect** - Link Git repository or Notion database
3. **Sync** - Push/pull content changes
4. **Publish** - Deploy to hosted platform
5. **Monitor** - Track analytics and usage

## Dependencies

```json
{
  "devDependencies": {
    "@notionhq/client": "^2.2.0",
    "gitbook-api": "^0.8.0",
    "gray-matter": "^4.0.0"
  }
}
```

## CLI Commands

```bash
# Export from Notion
node scripts/notion-export.js --database abc123 --output ./docs

# Sync to GitBook
gitbook sync ./docs --space abc123

# Import to Notion
node scripts/notion-import.js --input ./docs --database abc123
```

## Best Practices Applied

- Keep source of truth in Git
- Sync on merge to main
- Use consistent slug patterns
- Track page analytics
- Set up webhooks for automation
- Handle rate limits gracefully

## References

- GitBook API: https://developer.gitbook.com/
- Notion API: https://developers.notion.com/
- GitBook Sync: https://docs.gitbook.com/integrations/git-sync

## Target Processes

- knowledge-base-setup.js
- docs-versioning.js
- content-strategy.js

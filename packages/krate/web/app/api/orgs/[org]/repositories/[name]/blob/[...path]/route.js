import { createGiteaService } from '@a5c-ai/krate';

// Lazily created so the service is instantiated per-process rather than per-request
let _service;
function getGiteaService() {
  if (_service === undefined) {
    _service = createGiteaService(); // returns null when KRATE_GITEA_HTTP_URL is not set
  }
  return _service;
}

// Mock file contents used when Gitea is not available
function getMockContents(name, filePath, branch) {
  const mockContents = {
    'README.md': `# ${name}

This repository is managed by Krate.

## Getting Started

Clone this repository and start developing.

\`\`\`bash
git clone <repository-url>
cd ${name}
npm install
npm start
\`\`\`

## Development

- Source files are in \`src/\`
- Tests are in \`tests/\`
- Build artifacts go to \`dist/\`

## License

MIT
`,
    'src/index.js': `// Entry point for ${name}
import { createApp } from './utils.js';
import App from './components/App.jsx';

const app = createApp({
  name: '${name}',
  component: App,
});

app.start();

export default app;
`,
    'src/utils.js': `/**
 * Utility functions for ${name}
 */

export function createApp(config) {
  return {
    name: config.name,
    component: config.component,
    start() {
      console.log(\`Starting \${config.name}...\`);
    },
    stop() {
      console.log(\`Stopping \${config.name}...\`);
    },
  };
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date instanceof Date ? date : new Date(date));
}

export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
`,
    'src/components/App.jsx': `import React from 'react';
import Header from './Header.jsx';

export default function App() {
  return (
    <div className="app">
      <Header title="${name}" />
      <main>
        <p>Welcome to ${name}</p>
      </main>
    </div>
  );
}
`,
    'src/components/Header.jsx': `import React from 'react';

export default function Header({ title }) {
  return (
    <header>
      <h1>{title}</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/docs">Docs</a>
      </nav>
    </header>
  );
}
`,
    'tests/index.test.js': `import { describe, it, expect } from 'vitest';
import { createApp, slugify, formatDate } from '../src/utils.js';

describe('createApp', () => {
  it('creates an app with a name', () => {
    const app = createApp({ name: 'test' });
    expect(app.name).toBe('test');
  });
});

describe('slugify', () => {
  it('converts to lowercase with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });
});
`,
    'package.json': JSON.stringify(
      {
        name,
        version: '1.0.0',
        description: `${name} — managed by Krate`,
        main: 'src/index.js',
        scripts: {
          start: 'node src/index.js',
          test: 'vitest run',
          build: 'vite build',
          dev: 'vite dev',
        },
        dependencies: {},
        devDependencies: {
          vitest: '^1.0.0',
          vite: '^5.0.0',
        },
        license: 'MIT',
      },
      null,
      2
    ),
    '.gitignore': `node_modules/
.env
.env.local
dist/
.next/
*.log
npm-debug.log*
.DS_Store
coverage/
`,
    'LICENSE': `MIT License

Copyright (c) ${new Date().getFullYear()} Krate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
    'Dockerfile': `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]
`,
  };

  return (
    mockContents[filePath] ||
    `// File: ${filePath}
// Content not available in mock mode.
// TODO: Wire to real Gitea API to serve actual file content.
// Gitea endpoint: GET /api/v1/repos/{owner}/{repo}/raw/${filePath}?ref=${branch}
`
  );
}

export async function GET(request, { params }) {
  const { org, name, path: pathParts } = await params;
  const filePath = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts || '');
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch') || 'main';
  const raw = searchParams.get('raw') === '1';

  const service = getGiteaService();

  if (service) {
    try {
      // Use getBlob for raw text; getFileContent for metadata + decoded content
      if (raw) {
        const content = await service.getBlob(org, name, branch, filePath);
        if (content !== null) {
          return new Response(content, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
              'Content-Length': String(Buffer.byteLength(content, 'utf8')),
            },
          });
        }
      } else {
        const file = await service.getFileContent(org, name, branch, filePath);
        if (file !== null) {
          return Response.json({
            path: file.path,
            content: file.content,
            size: file.size,
            encoding: file.encoding,
            lastCommit: file.lastCommit || null,
            lastCommitMessage: null,
            lastCommitDate: null,
            repo: name,
            org,
            branch,
            source: 'gitea',
          });
        }
      }
      // null from service — file not found in Gitea, fall through to mock
    } catch (err) {
      // Gitea unreachable or errored — fall through to mock data
      console.warn('[krate] Gitea blob request failed, falling back to mock:', err?.message);
    }
  }

  // Fallback: mock data
  const content = getMockContents(name, filePath, branch);
  const size = Buffer.byteLength(content, 'utf8');

  if (raw) {
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
        'Content-Length': String(size),
      },
    });
  }

  return Response.json({
    path: filePath,
    content,
    size,
    encoding: 'utf-8',
    lastCommit: 'mock-abc1234',
    lastCommitMessage: 'Initial commit',
    lastCommitDate: new Date().toISOString(),
    repo: name,
    org,
    branch,
    source: 'mock',
  });
}

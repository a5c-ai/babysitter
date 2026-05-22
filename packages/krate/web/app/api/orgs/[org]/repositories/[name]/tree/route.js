import { createGiteaService } from '@a5c-ai/krate-sdk';

// Lazily created so the service is instantiated per-process rather than per-request
let _service;
function getGiteaService() {
  if (_service === undefined) {
    _service = createGiteaService(); // returns null when KRATE_GITEA_HTTP_URL is not set
  }
  return _service;
}

// Mock full tree used when Gitea is not available
const MOCK_TREE = [
  { path: 'README.md', type: 'blob', size: 1024 },
  { path: 'src', type: 'tree', size: 0 },
  { path: 'src/index.js', type: 'blob', size: 2048 },
  { path: 'src/utils.js', type: 'blob', size: 896 },
  { path: 'src/components', type: 'tree', size: 0 },
  { path: 'src/components/App.jsx', type: 'blob', size: 1536 },
  { path: 'src/components/Header.jsx', type: 'blob', size: 768 },
  { path: 'tests', type: 'tree', size: 0 },
  { path: 'tests/index.test.js', type: 'blob', size: 512 },
  { path: 'package.json', type: 'blob', size: 512 },
  { path: '.gitignore', type: 'blob', size: 128 },
  { path: 'LICENSE', type: 'blob', size: 1064 },
  { path: 'Dockerfile', type: 'blob', size: 384 },
];

function filterToCurrentPath(fullTree, currentPath) {
  return fullTree.filter((item) => {
    if (!currentPath) {
      return !item.path.includes('/');
    } else {
      if (!item.path.startsWith(currentPath + '/')) return false;
      const remainder = item.path.slice(currentPath.length + 1);
      return !remainder.includes('/');
    }
  });
}

export async function GET(request, { params }) {
  const { org, name } = await params;
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch') || 'main';
  const currentPath = searchParams.get('path') || '';

  const service = getGiteaService();

  if (service) {
    try {
      const entries = await service.listTree(org, name, branch, currentPath);
      if (entries !== null) {
        return Response.json({
          tree: entries,
          repo: name,
          org,
          branch,
          path: currentPath,
          totalItems: entries.length,
          source: 'gitea',
        });
      }
      // listTree returned null — repo/path not found in Gitea, fall through to mock
    } catch (err) {
      // Gitea unreachable or errored — fall through to mock data
      // Gitea tree request failed — falling back to mock data
    }
  }

  // Fallback: mock data
  const tree = filterToCurrentPath(MOCK_TREE, currentPath);

  return Response.json({
    tree,
    repo: name,
    org,
    branch,
    path: currentPath,
    totalItems: tree.length,
    source: 'mock',
  });
}

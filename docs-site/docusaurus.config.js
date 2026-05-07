const { themes } = require('prism-react-renderer');
const { publishedDocsExcludePatterns } = require('../scripts/docs-qa-config.cjs');

const strictLinkValidation = process.env.DOCS_STRICT_LINKS === '1';
const strictDocScope = process.env.DOCS_STRICT_SCOPE === '1';
const strictDocInclude = [
  'cli-examples.md',
  'github-actions-setup-babysitter.md',
  'github-actions-setup-claude-code.md',
  'github-actions-setup-codex.md',
  'github-actions-setup-gemini-cli.md',
  'release-pipeline.md',
  'testing/**',
  'reference/GETTING_STARTED.md',
  'reference/babysitter_cli_surface_spec.md',
  'v6-spec-and-roadmap/**'
];

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Babysitter Docs',
  tagline: 'Deterministic orchestration, quality gates, and docs-as-code for Babysitter.',
  favicon: 'img/logo.svg',
  url: 'https://a5c-ai.github.io',
  baseUrl: '/babysitter/',
  organizationName: 'a5c-ai',
  projectName: 'babysitter',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,
  onBrokenLinks: strictLinkValidation ? 'throw' : 'warn',
  markdown: {
    format: 'md',
    hooks: {
      onBrokenMarkdownLinks: strictLinkValidation ? 'throw' : 'warn'
    }
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          routeBasePath: 'docs',
          ...(strictDocScope ? { include: strictDocInclude } : {}),
          exclude: [
            ...publishedDocsExcludePatterns,
          ],
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/a5c-ai/babysitter/tree/staging/',
          showLastUpdateTime: true
        },
        blog: false,
        theme: {
          customCss: [require.resolve('@a5c-ai/compendium/css'), require.resolve('./src/css/custom.css')]
        }
      }
    ]
  ],
  customFields: {
    strictDocScope
  },
  themeConfig: {
    image: 'img/logo.svg',
    navbar: {
      title: 'Babysitter',
      logo: {
        alt: 'Babysitter logo',
        src: 'img/logo.svg'
      },
      items: strictDocScope
        ? [
            { to: '/', label: 'Home', position: 'left' },
            {
              type: 'docSidebar',
              sidebarId: 'docsSidebar',
              label: 'Docs',
              position: 'left'
            },
            { to: '/docs/github-actions-setup-babysitter', label: 'GitHub Actions', position: 'left' },
            {
              href: 'https://github.com/a5c-ai/babysitter',
              label: 'GitHub',
              position: 'right'
            }
          ]
        : [
            { to: '/', label: 'Home', position: 'left' },
            {
              type: 'docSidebar',
              sidebarId: 'docsSidebar',
              label: 'Docs',
              position: 'left'
            },
            { to: '/docs/user-guide/', label: 'User Guide', position: 'left' },
            { to: '/docs/assimilation/', label: 'Integrations', position: 'left' },
            { to: '/docs/plugins', label: 'Plugins', position: 'left' },
            { to: '/docs/agent-mux/', label: 'Agent Mux', position: 'left' },
            {
              href: 'https://github.com/a5c-ai/babysitter',
              label: 'GitHub',
              position: 'right'
            }
          ]
    },
    footer: {
      style: 'dark',
      links: strictDocScope
        ? [
            {
              title: 'Staged QA Scope',
              items: [
                { label: 'CLI Examples', to: '/docs/cli-examples' },
                { label: 'GitHub Actions Setup', to: '/docs/github-actions-setup-babysitter' }
              ]
            },
            {
              title: 'Reference',
              items: [
                { label: 'Getting Started', to: '/docs/reference/GETTING_STARTED' },
                { label: 'V6 Roadmap', to: '/docs/v6-spec-and-roadmap/v6-implementation-roadmap' }
              ]
            },
            {
              title: 'Community',
              items: [
                { label: 'Issues', href: 'https://github.com/a5c-ai/babysitter/issues' },
                { label: 'Discussions', href: 'https://github.com/a5c-ai/babysitter/discussions' }
              ]
            }
          ]
        : [
            {
              title: 'Start Here',
              items: [
                { label: 'User Guide', to: '/docs/user-guide/' },
                { label: 'Getting Started', to: '/docs/user-guide/getting-started/' },
                { label: 'Tutorials', to: '/docs/user-guide/tutorials/' },
                { label: 'Core Reference', to: '/docs/reference/' }
              ]
            },
            {
              title: 'Integrate & Extend',
              items: [
                { label: 'Harness Integration', to: '/docs/assimilation/harness/' },
                { label: 'GitHub Actions', to: '/docs/github-actions-setup-babysitter' },
                { label: 'Plugins', to: '/docs/plugins' },
                { label: 'Agent Mux', to: '/docs/agent-mux/' }
              ]
            },
            {
              title: 'Maintain & Plan',
              items: [
                { label: 'Release Pipeline', to: '/docs/release-pipeline' },
                { label: 'Workspace Validation', to: '/docs/workspace-validation' },
                { label: 'Contributor Reference', to: '/docs/agent-reference/' },
                { label: 'V6 Roadmap', to: '/docs/v6-spec-and-roadmap/' }
              ]
            },
            {
              title: 'Community',
              items: [
                { label: 'Issues', href: 'https://github.com/a5c-ai/babysitter/issues' },
                { label: 'Discussions', href: 'https://github.com/a5c-ai/babysitter/discussions' }
              ]
            }
          ],
      copyright: `Copyright ${new Date().getFullYear()} A5C AI`
    },
    prism: {
      theme: themes.github,
      darkTheme: themes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'typescript']
    }
  }
};

module.exports = config;

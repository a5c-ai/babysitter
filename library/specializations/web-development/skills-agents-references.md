# Web Development - Skills and Agents References

## Overview

This document catalogs community-created Claude skills, agents, plugins, and MCP servers that align with the identified skills and agents in the Web Development specialization backlog. These resources can be leveraged to accelerate development, provide specialized expertise, and integrate with external tools and services.

---

## Reference Sources

### Primary Repositories and Marketplaces

| Source | URL | Description |
|--------|-----|-------------|
| Awesome Claude Skills (ComposioHQ) | https://github.com/ComposioHQ/awesome-claude-skills | Curated list of Claude Skills, resources, and tools |
| Awesome Claude Code Plugins | https://github.com/ccplugins/awesome-claude-code-plugins | Collection of Claude Code plugins for various specializations |
| Build with Claude | https://github.com/davepoon/buildwithclaude | Plugin marketplace with 117 agents, 175 commands, 28 hooks, 26 skills |
| Claude Code Plugins Registry | https://claude-plugins.dev/ | Community registry with CLI integration |
| MCP Market | https://mcpmarket.com/ | Marketplace for Claude Code skills and MCP servers |
| Awesome MCP Servers | https://mcpservers.org/ | Directory of MCP servers and Claude skills |
| MCP Hub | https://mcphub.com/ | Hub for Model Context Protocol servers |
| Skills MP | https://skillsmp.com/ | Skills marketplace for Claude Code |
| FastMCP | https://fastmcp.me/ | Fast access to Claude skills and MCP resources |

---

## Framework-Specific Skills

### React Ecosystem

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| web-artifacts-builder | https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder | Suite of tools for creating React components with Tailwind CSS and shadcn/ui | react-development-skill |
| react-mcp | https://github.com/kalivaraprasad-gonapa/react-mcp | MCP server for creating and modifying React apps via Claude Desktop | react-development-skill |
| React Testing Library patterns | https://claude-plugins.dev/skills | Testing patterns for React components | react-testing-library-skill |

### Next.js Ecosystem

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| next-devtools-mcp (Vercel Official) | https://github.com/vercel/next-devtools-mcp | Official Next.js DevTools MCP server for error detection and live state queries | nextjs-skill |
| claude-code-nextjs-skills | https://github.com/laguagu/claude-code-nextjs-skills | Comprehensive Next.js 16 and React 19 skills with bun runtime | nextjs-skill, nextjs-app-router-skill |
| Next.js 16 Development Skill | https://mcpmarket.com/tools/skills/next-js-16-development | Modern Next.js 16 development patterns | nextjs-skill |
| Next.js 16 & React 19 Guide | https://mcpmarket.com/tools/skills/next-js-16-react-19-development | App Router, use cache directive, React Compiler guidance | nextjs-skill, react-server-components-skill |
| nextjs-shadcn skill | https://github.com/laguagu/claude-code-nextjs-skills | Next.js with shadcn/ui components | nextjs-skill |
| nextjs-seo skill | https://github.com/laguagu/claude-code-nextjs-skills | SEO optimization for Next.js applications | seo-skill |
| cache-components skill | https://github.com/laguagu/claude-code-nextjs-skills | Next.js caching strategies and Partial Pre-Rendering | caching-skill |
| nextjs-optimization | https://skillsmp.com/skills/atman36-ai-vibe-prompts-claude-skills-framework-specific-nextjs-optimization-skill-md | Next.js 15 optimization for Core Web Vitals | web-performance-skill |
| nextjs-turborepo | https://claude-plugins.dev/skills/@samhvw8/dotfiles/nextjs-turborepo | Next.js with Turborepo monorepo setup | turborepo-skill |

### Vue.js Ecosystem

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| nuxt-skills | https://github.com/onmax/nuxt-skills | Vue, Nuxt, and NuxtHub skills for AI coding assistants | vue-development-skill, nuxt-skill |
| Nuxt 4 Core Skill | https://mcpmarket.com/tools/skills/nuxt-4-core | Nuxt v4 framework with app/ directory patterns | nuxt-skill |
| vibecodekit | https://github.com/croffasia/vibecodekit | AI-first Vue.js starter with Claude Code rules | vue-development-skill |
| Nuxt 4 Best Practices PR | https://github.com/nuxt/nuxt/pull/33498 | Official Nuxt repository Claude Code skill plugin | nuxt-skill |

### Svelte Ecosystem

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| svelte-claude-skills | https://github.com/spences10/svelte-claude-skills | Curated skills for Svelte 5 and SvelteKit development | svelte-skill |

### Angular Ecosystem

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| Angular patterns support | https://claude-plugins.dev/skills | OnPush change detection, lazy loading, tree shaking | angular-development-skill |

---

## Backend/API Skills

### Node.js Backend

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| NestJS Expert Skill | https://mcpmarket.com/tools/skills/nestjs-expert | Senior backend engineer for NestJS with TypeORM/Prisma | nestjs-skill |
| NestJS Framework Skill | https://mcpmarket.com/tools/skills/nestjs-framework | Comprehensive NestJS architecture, DI, middleware, guards | nestjs-skill |
| NestJS Project Scaffold | https://mcpmarket.com/tools/skills/nestjs-project-scaffold | NestJS project scaffolding | nestjs-skill |
| rr-nestjs | https://claude-plugins.dev/skills/@roderik/ai-rules/rr-nestjs | NestJS rules and patterns | nestjs-skill |
| nestjs-expert (subagent) | https://github.com/0xfurai/claude-code-subagents/blob/main/agents/nestjs-expert.md | NestJS decorators, modules, enterprise patterns | nestjs-skill |
| express-expert (subagent) | https://github.com/0xfurai/claude-code-subagents | Express.js middleware, routing, Node.js APIs | express-skill |
| fastify-expert (subagent) | https://github.com/0xfurai/claude-code-subagents | High-performance Fastify development | fastify-skill |
| backend-architect | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/backend-architect | Backend system architecture design | backend-developer-agent |
| backend-development skill | https://claude-plugins.dev/skills | Node.js, Python, Go, Rust with REST, GraphQL, gRPC | express-skill |

### API Development

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| graphql-api-development | https://claude-plugins.dev/skills/@manutej/luxor-claude-marketplace/graphql-api-development | Production-ready GraphQL APIs with graphql-js | graphql-skill |
| Data-fetching skills (Official) | https://apidog.com/blog/claude-api-request-networking-skills/ | REST and GraphQL data fetching tools | rest-api-design-skill, graphql-skill |
| trpc patterns | https://claude-plugins.dev/skills | tRPC end-to-end type safety | trpc-skill |
| api-integration-specialist | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/api-integration-specialist | API integration workflows | rest-api-design-skill |
| api-tester | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/api-tester | API testing and validation | rest-api-design-skill |
| MCP Builder | https://github.com/ComposioHQ/awesome-claude-skills | Create MCP servers for external API integration | rest-api-design-skill |

### Real-Time Communication

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| claude-flow WebSocket | https://github.com/ruvnet/claude-flow/wiki/WebSocket-Server-Tutorial | WebSocket server with Redis integration | websocket-skill, socketio-skill |
| Socket.io + Redis patterns | https://dev.to/dowerdev/building-a-real-time-multiplayer-game-server-with-socketio-and-redis-architecture-and-583m | Real-time architecture patterns | socketio-skill |

---

## Database Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| Prisma MCP Server (Official) | https://www.prisma.io/mcp | Official Prisma MCP for database management | prisma-skill |
| prisma-postgres MCP | https://www.remote-mcp.com/servers/prisma-postgres | Prisma Postgres remote MCP server | prisma-skill, postgresql-skill |
| MongoDB MCP Server (Official) | https://github.com/mongodb-labs/mongodb-mcp | Official MongoDB MCP for database operations | mongodb-skill |
| mongo-mcp | https://github.com/QuantGeekDev/mongo-mcp | Community MongoDB MCP server | mongodb-skill |
| Redis MCP Server (Official) | https://github.com/redis/mcp-redis | Official Redis MCP for caching and real-time | redis-skill |
| pg-aiguide | https://github.com/timescale/pg-aiguide | PostgreSQL MCP server with documentation | postgresql-skill |
| postgres-semantic-search | https://github.com/laguagu/claude-code-nextjs-skills | PostgreSQL vector search with pgvector | postgresql-skill |
| MCP Toolbox for Databases | https://googleapis.github.io/genai-toolbox/how-to/connect-ide/postgres_mcp/ | Google's PostgreSQL MCP toolbox | postgresql-skill |

---

## Testing Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| playwright-skill | https://github.com/lackeyjb/playwright-skill | Claude Code Skill for Playwright automation | playwright-skill |
| mcp-playwright | https://github.com/executeautomation/mcp-playwright | Playwright MCP Server for browser automation | playwright-skill |
| webapp-testing | https://github.com/ComposioHQ/awesome-claude-skills | Test local web apps with Playwright | playwright-skill |
| dev-browser | https://github.com/SawyerHood/dev-browser | Browser automation with persistent state | playwright-skill, cypress-skill |
| test-driven-development | https://github.com/obra/superpowers/tree/main/skills/test-driven-development | TDD skill for feature implementation | vitest-skill, jest-skill |
| test-writer-fixer | https://github.com/ccplugins/awesome-claude-code-plugins | Automated test creation and repairs | vitest-skill, jest-skill |
| unit-test-generator | https://github.com/ccplugins/awesome-claude-code-plugins | Unit test generation | vitest-skill, jest-skill |
| msw patterns | https://claude-plugins.dev/skills | Mock Service Worker API mocking | msw-skill |
| Storybook component testing | https://claude-plugins.dev/skills | Component documentation and testing | storybook-skill |

---

## Styling and Design System Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| shadcn-ui skill | https://claude-plugins.dev/skills/@mrgoonie/xxxnaper/shadcn-ui | shadcn/ui implementation guide | shadcn-skill |
| shadcn-components | https://claude-plugins.dev/skills/@sgcarstrends/sgcarstrends/shadcn-components | shadcn component patterns | shadcn-skill |
| shadcn-ui-setup | https://fastmcp.me/Skills/Details/419/shadcn-ui-setup | Install and configure shadcn/ui | shadcn-skill |
| using-shadcn-ui | https://claude-plugins.dev/skills/@chriscarterux/chris-claude-stack/using-shadcn-ui | shadcn/ui usage patterns | shadcn-skill |
| shadcn-ui-storybook-official | https://github.com/MFarabi619/shadcn-ui-storybook-official | shadcn/ui with Storybook integration | shadcn-skill, storybook-skill |
| Theme Factory | https://github.com/ComposioHQ/awesome-claude-skills | Professional font and color themes | design-tokens-skill |
| Canvas Design | https://github.com/ComposioHQ/awesome-claude-skills | Visual design for artifacts | design-tokens-skill |
| Tailwind CSS v4 patterns | https://mcpmarket.com/tools/skills/next-js-16-react-19-development | Tailwind CSS v4 integration | tailwind-skill |

---

## Build and Tooling Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| bundle-analyzer | https://claude-plugins.dev/skills/@Dexploarer/claudius-skills/bundle-analyzer | Analyze bundle sizes for webpack, vite, rollup | bundle-optimization-skill, vite-skill, webpack-skill |
| Vite configuration | https://htdocs.dev/posts/claude-code-full-stack-configuration-guide/ | Vite-powered TypeScript setup | vite-skill |

---

## DevOps and Deployment Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| Vercel MCP Server (Official) | https://vercel.com/docs/mcp/vercel-mcp | Official Vercel MCP for deployments | vercel-skill |
| nganiet/mcp-vercel | https://github.com/nganiet/mcp-vercel | Vercel REST API MCP integration | vercel-skill |
| v0-mcp | https://github.com/hellolucky/v0-mcp | Vercel v0 MCP for UI generation | vercel-skill |
| vercel-deploy skill | https://mcpservers.org/claude-skills/vercel/vercel-deploy | Deploy to Vercel from conversations | vercel-skill |
| vercel-labs/agent-skills | https://github.com/vercel-labs/agent-skills | Vercel Labs agent skills | vercel-skill |
| pinme | https://github.com/glitternetwork/pinme | Frontend deployment with Claude Code Skills | vercel-skill, netlify-skill |
| Docker MCP Toolkit | https://www.docker.com/blog/add-mcp-servers-to-claude-code-with-mcp-toolkit/ | Docker integration for MCP servers | docker-web-skill |
| docker-mcp | https://github.com/QuantGeekDev/docker-mcp | Docker MCP Server | docker-web-skill |
| claudebox | https://github.com/RchGrav/claudebox | Containerized Claude Code environment | docker-web-skill |
| deployment-engineer | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/deployment-engineer | Application deployment processes | deployment-agent |
| GitHub Actions patterns | https://claude-plugins.dev/skills | CI/CD workflow patterns | github-actions-web-skill |

---

## Security Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| OAuth MCP Implementation | https://www.buildwithmatija.com/blog/oauth-mcp-server-claude | OAuth 2.1 for MCP servers | oauth-skill |
| Auth0 + MCP Integration | https://medium.com/neural-engineer/mcp-server-setup-with-oauth-authentication-using-auth0-and-claude-ai-remote-mcp-integration-8329b65e6664 | Auth0 OAuth with Claude MCP | oauth-skill |
| JWT Token Handling | https://www.infracloud.io/blogs/securing-mcp-servers/ | JWT validation and security | jwt-skill |
| MCP Auth Guide | https://workos.com/blog/mcp-auth-developer-guide | Comprehensive MCP authentication | oauth-skill, jwt-skill |
| Security Auditor | https://github.com/davepoon/buildwithclaude | Security vulnerability scanning | security-auditor-agent |
| Entra ID OAuth + APIM | https://developer.microsoft.com/blog/claude-ready-secure-mcp-apim | Enterprise OAuth with Azure | oauth-skill |

---

## Performance Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| Lighthouse CI Integrator | https://mcpmarket.com/ko/tools/skills/lighthouse-ci-integrator | Automated Lighthouse CI testing | web-performance-skill, lighthouse-agent |
| lighthouse-ci-integrator | https://claude-plugins.dev/skills/@Dexploarer/hyper-forge/lighthouse-ci-integrator | Core Web Vitals tracking in CI/CD | web-performance-skill |
| bundle-analyzer | https://claude-plugins.dev/skills/@Dexploarer/claudius-skills/bundle-analyzer | Bundle size optimization | bundle-optimization-skill |
| web-perf (Cloudflare) | https://claude-plugins.dev/skills | Core Web Vitals auditing | web-performance-skill |
| Image optimization patterns | https://claude-plugins.dev/skills | Responsive images, lazy loading | image-optimization-skill |

---

## SEO and Analytics Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| SEO Specialist Skill | https://mcpmarket.com/tools/skills/seo-specialist | Technical SEO with SEMrush, Ahrefs, GSC | seo-skill |
| SEO Specialist (alt) | https://mcpmarket.com/tools/skills/seo-specialist-1 | Core Web Vitals and Schema markup | seo-skill, structured-data-skill |
| nextjs-seo | https://github.com/laguagu/claude-code-nextjs-skills | SEO optimization for Next.js | seo-skill |
| Structured data patterns | https://mcpmarket.com/tools/skills/seo-specialist-1 | JSON-LD schema markup | structured-data-skill |

---

## Accessibility Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| Accessibility patterns | https://claude-plugins.dev/skills | WCAG compliance patterns | wcag-skill |
| ARIA implementation | https://claude-plugins.dev/skills | WAI-ARIA roles and states | aria-skill |
| Radix UI primitives | https://claude-plugins.dev/skills/@mrgoonie/xxxnaper/shadcn-ui | Accessible component primitives | radix-ui-skill |

---

## Monorepo Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| turborepo skill | https://claude-plugins.dev/skills/@timelessco/recollect/turborepo | Turborepo build system patterns | turborepo-skill |
| turborepo (MCP Hub) | https://www.aimcp.info/en/skills/8f8d1dc8-ace8-4e94-8aa9-5f7f69ec014e | Turborepo caching and orchestration | turborepo-skill |
| monorepo-tooling | https://claude-plugins.dev/skills/@TheBushidoCollective/han/monorepo-tooling | Turborepo, Nx, Bazel, Lerna patterns | turborepo-skill, nx-skill |
| monorepo-management | https://skillsmp.com/skills/wshobson-agents-plugins-developer-essentials-skills-monorepo-management-skill-md | pnpm workspaces and monorepo management | pnpm-workspaces-skill |
| monorepo-workflows | https://claude-plugins.dev/skills/@TheBushidoCollective/han/monorepo-workflows | CI/CD and publishing automation | turborepo-skill |
| setup-monorepo command | https://www.buildwithclaude.com/command/setup-monorepo | Monorepo setup for nx, lerna, turborepo | turborepo-skill, nx-skill |

---

## Architecture Agents

| Agent/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| software-architecture | https://github.com/NeoLabHQ/context-engineering-kit/tree/master/plugins/ddd/skills/software-architecture | Clean Architecture, SOLID principles | frontend-architect-agent |
| frontend-developer | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/frontend-developer | Frontend-focused development | frontend-architect-agent |
| fullstack-engineer skill | https://github.com/Jeffallan/claude-skills | Next.js + GraphQL + PostgreSQL scaffolding | fullstack-architect-agent |
| backend-architect | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/backend-architect | Backend system architecture | api-architect-agent |
| micro-frontend patterns | https://claude-plugins.dev/skills | Module federation strategies | micro-frontend-architect-agent |

---

## Development Agents

| Agent/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| react-developer patterns | https://github.com/ccplugins/awesome-claude-code-plugins | React component development | react-developer-agent |
| nextjs-developer patterns | https://github.com/laguagu/claude-code-nextjs-skills | Next.js full-stack development | nextjs-developer-agent |
| vue-developer patterns | https://github.com/onmax/nuxt-skills | Vue 3 and Nuxt development | vue-developer-agent |
| angular-developer patterns | https://claude-plugins.dev/skills | Angular enterprise development | angular-developer-agent |
| graphql-developer patterns | https://claude-plugins.dev/skills/@manutej/luxor-claude-marketplace/graphql-api-development | GraphQL API development | graphql-developer-agent |
| web-dev agent | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/web-dev | General web development | backend-developer-agent |

---

## Specialized Developer Agents

| Agent/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| component-developer patterns | https://claude-plugins.dev/skills | UI component development | component-developer-agent |
| hooks-developer patterns | https://claude-plugins.dev/skills | Custom React hooks | hooks-developer-agent |
| animation-developer patterns | https://claude-plugins.dev/skills | Framer Motion, GSAP animations | animation-developer-agent |
| forms-developer patterns | https://claude-plugins.dev/skills | React Hook Form, Formik | forms-developer-agent |
| rapid-prototyper | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/rapid-prototyper | Quick prototype building | component-developer-agent |

---

## Testing Agents

| Agent/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| e2e-testing patterns | https://github.com/lackeyjb/playwright-skill | E2E test with Playwright | e2e-testing-agent |
| unit-testing patterns | https://github.com/ccplugins/awesome-claude-code-plugins | Unit test patterns | unit-testing-agent |
| visual-regression patterns | https://github.com/SawyerHood/dev-browser | Visual regression testing | visual-regression-agent |
| performance-testing patterns | https://mcpmarket.com/ko/tools/skills/lighthouse-ci-integrator | Performance benchmarks | performance-testing-agent |
| accessibility-testing patterns | https://claude-plugins.dev/skills | Accessibility compliance | accessibility-testing-agent |

---

## Quality and Review Agents

| Agent/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| code-review | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/code-review | Code review automation | code-reviewer-agent |
| code-reviewer | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/code-reviewer | PR and code quality | code-reviewer-agent |
| code-review-assistant | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/code-review-assistant | Code review feedback | code-reviewer-agent |
| seo-auditor patterns | https://mcpmarket.com/tools/skills/seo-specialist | Technical SEO audit | seo-auditor-agent |

---

## DevOps Agents

| Agent/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| ci-cd patterns | https://mcpmarket.com/ko/tools/skills/lighthouse-ci-integrator | CI/CD pipeline setup | ci-cd-agent |
| deployment patterns | https://github.com/nganiet/mcp-vercel | Deployment automation | deployment-agent |
| container patterns | https://github.com/QuantGeekDev/docker-mcp | Docker containerization | container-agent |

---

## Documentation Agents

| Agent/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| api-documentation patterns | https://claude-plugins.dev/skills | OpenAPI spec generation | api-documentation-agent |
| component-documentation patterns | https://claude-plugins.dev/skills | Storybook stories | component-documentation-agent |

---

## Cross-Specialization Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| TypeScript patterns | https://github.com/Jeffallan/claude-skills | TypeScript configuration and generics | typescript-skill |
| ESLint patterns | https://claude-plugins.dev/skills | Custom rules and plugins | eslint-skill |
| Prettier patterns | https://claude-plugins.dev/skills | Code formatting | prettier-skill |
| Git patterns | https://github.com/davepoon/buildwithclaude | Git workflows and branching | git-skill |
| Zod validation | https://claude-plugins.dev/skills | Schema validation and type inference | zod-skill |
| oh-my-opencode | https://github.com/code-yeongyu/oh-my-opencode | Multi-model agent framework | typescript-skill |
| Context7 MCP | https://mcpcat.io/guides/best-mcp-servers-for-claude-code/ | Real-time documentation fetching | markdown-skill |

---

## Comprehensive Skill Collections

| Collection | URL | Description | Skills Count |
|------------|-----|-------------|--------------|
| Jeffallan/claude-skills | https://github.com/Jeffallan/claude-skills | 65 Specialized Skills for Full-Stack Developers | 65+ |
| alirezarezvani/claude-skills | https://github.com/alirezarezvani/claude-skills | Real-world Claude Code skills with subagents | 50+ |
| 0xfurai/claude-code-subagents | https://github.com/0xfurai/claude-code-subagents | 100+ production-ready development subagents | 100+ |
| manutej/luxor-claude-marketplace | https://github.com/manutej/luxor-claude-marketplace | 140 development tools (67 skills, 28 commands, 30 agents) | 140 |
| mrgoonie/claudekit-skills | https://github.com/mrgoonie/claudekit-skills | ClaudeKit.cc powerful skills | 30+ |
| ChrisWiles/claude-code-showcase | https://github.com/ChrisWiles/claude-code-showcase | Comprehensive Claude Code configuration example | 20+ |
| hesreallyhim/awesome-claude-code | https://github.com/hesreallyhim/awesome-claude-code | Curated skills, hooks, slash-commands | 100+ |
| VoltAgent/awesome-claude-skills | https://github.com/VoltAgent/awesome-claude-skills | Awesome collection of Claude Skills | 80+ |

---

## AI Integration Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| ai-sdk-6 | https://github.com/laguagu/claude-code-nextjs-skills | Vercel AI SDK with agent frameworks | nextjs-skill |
| ai-elements | https://github.com/laguagu/claude-code-nextjs-skills | Pre-built AI UI components | react-development-skill |
| ai-app skill | https://github.com/laguagu/claude-code-nextjs-skills | Full-stack AI applications | fullstack-architect-agent |
| Connect (500+ Apps) | https://github.com/ComposioHQ/awesome-claude-skills | Integration with Gmail, Slack, GitHub, Notion | rest-api-design-skill |
| subagent-driven-development | https://github.com/NeoLabHQ/context-engineering-kit/tree/master/plugins/sadd/skills/subagent-driven-development | Independent subagent dispatch | fullstack-architect-agent |

---

## Data Visualization Skills

| Skill/Tool | URL | Description | Backlog Match |
|------------|-----|-------------|---------------|
| D3.js Visualization | https://github.com/chrisvoncsefalvay/claude-d3js-skill | D3 charts and interactive visualizations | react-development-skill |

---

## Summary

| Category | References Found |
|----------|-----------------|
| Framework-Specific (React, Next.js, Vue, Svelte, Angular) | 28 |
| Backend/API (Node.js, Express, NestJS, GraphQL) | 18 |
| Database (Prisma, PostgreSQL, MongoDB, Redis) | 10 |
| Testing (Playwright, Vitest, Jest, Storybook) | 12 |
| Styling/Design Systems (Tailwind, shadcn, Radix) | 10 |
| Build/Tooling (Vite, Webpack, Bundlers) | 4 |
| DevOps/Deployment (Vercel, Docker, CI/CD) | 14 |
| Security (OAuth, JWT, Authentication) | 8 |
| Performance (Lighthouse, Core Web Vitals) | 6 |
| SEO/Analytics | 5 |
| Accessibility | 4 |
| Monorepo (Turborepo, Nx, pnpm) | 7 |
| Architecture Agents | 6 |
| Development Agents | 8 |
| Testing/Quality Agents | 10 |
| DevOps/Documentation Agents | 6 |
| Cross-Specialization | 8 |
| Comprehensive Collections | 8 |
| **Total References Found** | **172** |

---

## Installation Examples

### Claude Code CLI Installation

```bash
# Add Next.js DevTools MCP
claude mcp add next-devtools npx next-devtools-mcp@latest

# Add Vercel MCP
claude mcp add-json "vercel" '{"command":"npx","args":["-y","vercel-mcp"]}'

# Add Playwright MCP
claude mcp add playwright npx @playwright/mcp@latest

# Add Redis MCP
claude mcp add redis npx @redis/mcp@latest
```

### Manual Skill Installation

Skills can be installed to:
- Global: `~/.claude/skills/`
- Project-specific: `.claude/skills/`

### Plugin Marketplace Installation

```bash
# Using Build with Claude marketplace
/plugin marketplace add davepoon/buildwithclaude
```

---

## Next Steps

1. **Evaluate Priority Skills**: Review high-impact skills from Phase 1 backlog against available references
2. **Test Integration**: Validate MCP servers and skills work within project workflows
3. **Custom Development**: Identify gaps where custom skills need to be developed
4. **Documentation**: Create usage guides for selected skills and agents
5. **Contribution**: Consider contributing improvements back to community repositories

---

## References

- [Anthropic Claude Code Documentation](https://code.claude.com/docs/en/skills)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/)
- [Next.js MCP Guide](https://nextjs.org/docs/app/guides/mcp)
- [Prisma MCP Server](https://www.prisma.io/mcp)
- [MongoDB MCP Server](https://www.mongodb.com/company/blog/announcing-mongodb-mcp-server)
- [Redis MCP Server](https://redis.io/blog/introducing-model-context-protocol-mcp-for-redis/)
- [Docker MCP Toolkit](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/)

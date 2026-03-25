# UX/UI Design Specialization - Skills & Agents References

## Overview

This document catalogs community-created Claude skills, agents, plugins, and MCP (Model Context Protocol) servers that align with the identified skills and agents in the UX/UI Design specialization backlog. These references provide implementation foundations for the babysitter SDK.

---

## 1. Figma Integration Resources

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **Claude Talk to Figma MCP** | Bidirectional MCP that allows Claude Desktop and other AI tools to interact directly with Figma for real-time design manipulation | https://github.com/arinspunk/claude-talk-to-figma-mcp |
| **Figma MCP Server (karthiks3000)** | Claude MCP Server for working with Figma files | https://github.com/karthiks3000/figma-mcp-server |
| **Claude Figma MCP (tonycueva)** | Figma MCP server for AI agents with component and asset operations | https://playbooks.com/mcp/tonycueva-figma |
| **Community Figma MCP Server** | Three-tier architecture bypassing Figma plugin sandbox limitations with 23+ tools | https://dev.to/om_shree_0709/bridging-llms-and-design-systems-via-mcp-implementing-a-community-figma-mcp-server-for-generative-2ig2 |
| **html.to.design MCP** | Converts website HTML directly into editable Figma designs via MCP | https://html.to.design/docs/mcp-tab/ |

### Guides & Documentation

| Resource | Description | URL |
|----------|-------------|-----|
| **Claude Code + Figma MCP Guide** | Builder.io guide on setting up Figma MCP Server with Claude Code | https://www.builder.io/blog/claude-code-figma-mcp-server |
| **Figma MCP Integration Guide 2025** | Complete guide for integrating Figma MCP with Claude Code | https://vibecodinglearn.com/figma-mcp-claude-code-integration |
| **A Better Figma MCP** | Advanced Figma MCP implementation for design workflows | https://cianfrani.dev/posts/a-better-figma-mcp/ |
| **From Claude to Figma via MCP** | Tutorial on bringing AI-generated designs to Figma | https://html.to.design/blog/from-claude-to-figma-via-mcp/ |

**Related Backlog Agents**: `figma-integration-agent`

---

## 2. Accessibility Testing Resources

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **A11y MCP (ronantakizawa)** | Web accessibility testing using axe-core API and Puppeteer for WCAG compliance | https://github.com/priyankark/a11y-mcp |
| **Axe Accessibility MCP** | Official-style axe-core MCP integration for accessibility auditing | https://playbooks.com/mcp/ronantakizawa-axe-accessibility |
| **Deque axe MCP Server** | Enterprise axe MCP Server from Deque for contextualized accessibility guidance | https://www.deque.com/blog/a-closer-look-at-axe-mcp-server/ |
| **MCP Accessibility Scanner** | Playwright and Axe-core based WCAG checker with annotated snapshots | https://playbooks.com/mcp/justasmonkev/mcp-accessibility-scanner |
| **Playwright Accessibility Testing MCP** | Comprehensive WCAG 2.0/2.1 Level A/AA testing with natural language | https://glama.ai/mcp/servers/@PashaBoiko/playwright-axe-mcp |
| **Accessibility Testing MCP (joe-watkins)** | Configurable accessibility engine with WCAG level settings | https://glama.ai/mcp/servers/@joe-watkins/accessibility-testing-mcp |

### Color Contrast Tools

| Resource | Description | URL |
|----------|-------------|-----|
| **a11y-color-contrast-mcp** | NPM package for color contrast calculations via MCP | https://ryelle.codes/2025/09/reliable-color-contrast-calculations-for-ai-with-mcp/ |
| **XenPalette** | AI-powered color palette generator with WCAG checker and color blindness simulator | https://xenpalette.com/ |
| **Figma Color Contrast Checker** | Built-in Figma tool for WCAG AA/AAA compliance checking | https://www.figma.com/color-contrast-checker/ |
| **Accessible Palette** | Creates color systems with consistent lightness and WCAG contrast ratios | https://accessiblepalette.com/ |

**Related Backlog Agents**: `wcag-accessibility-auditor`, `screen-reader-compatibility-agent`, `color-contrast-analyzer`

---

## 3. Design System & Component Library Resources

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **Storybook MCP Addon** | Official Storybook addon for MCP integration with Claude Code | https://storybook.js.org/addons/@storybook/addon-mcp |
| **Storybook MCP Server (stefanoamorelli)** | Provides AI access to components, stories, properties, and screenshots | https://github.com/stefanoamorelli/storybook-mcp-server |
| **Superdesign MCP Server** | Design orchestrator for AI-powered UI design, wireframing, and component creation | https://glama.ai/mcp/servers/@jonthebeef/superdesign-mcp-claude-code |
| **Magic UI Generator MCP** | 21st.dev UI generator for Claude Code component building | https://www.pulsemcp.com/servers/21stdev-magic-ui-generator |

### Claude Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **UI Component Design & Implementation** | Comprehensive methodology for reusable UI components with React 19 patterns | https://mcpmarket.com/tools/skills/ui-component-design-implementation |
| **Magic UI Component Builder** | Accelerates frontend development with component generation commands | https://mcpmarket.com/tools/skills/magic-ui-component-builder |
| **MUI Documentation Assistant** | Claude Code skill for Material UI documentation | https://mcpmarket.com/tools/skills/mui-documentation-assistant |
| **Implement Design (Figma)** | Translates Figma designs to production code with pixel-perfect accuracy | https://mcpservers.org/claude-skills/figma/implement-design |

### NPM Packages & Documentation

| Resource | Description | URL |
|----------|-------------|-----|
| **@storybook/addon-mcp** | Official Storybook MCP addon package | https://www.npmjs.com/package/@storybook/addon-mcp |
| **Storybook MCP Guide** | Supercharge design systems with LLMs and Storybook MCP | https://tympanus.net/codrops/2025/12/09/supercharge-your-design-system-with-llms-and-storybook-mcp/ |

**Related Backlog Agents**: `design-token-manager`, `storybook-integration-agent`, `developer-handoff-agent`

---

## 4. Performance & Lighthouse Resources

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **Lighthouse MCP Server (danielsogl)** | 13+ tools for performance, accessibility, SEO, and security audits | https://github.com/danielsogl/lighthouse-mcp-server |
| **Lighthouse MCP (priyankark)** | Lighthouse integration for AI assistants with agentic optimization loops | https://github.com/priyankark/lighthouse-mcp |
| **@danielsogl/lighthouse-mcp** | NPM package for Lighthouse MCP server | https://www.npmjs.com/package/@danielsogl/lighthouse-mcp |

### Claude Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **Lighthouse CI Integrator** | Claude Code skill for performance integration | https://mcpmarket.com/ko/tools/skills/lighthouse-ci-integrator |

**Related Backlog Agents**: `performance-auditor-agent`

---

## 5. Browser Testing & Responsive Design Resources

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **BrowserStack MCP Server** | Cross-browser testing with 20,000+ real devices and AI-powered debugging | https://www.browserstack.com/docs/browserstack-mcp-server/overview |
| **Playwright MCP Server** | Official Microsoft MCP server for browser automation | https://github.com/executeautomation/mcp-playwright |
| **Browser MCP Chrome Extension** | Automate browser using VS Code, Cursor, Claude | https://chromewebstore.google.com/detail/browser-mcp-automate-your/bjfgambnhccakkhmkepdoekmckoijdlc |

### Claude Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **Frontend Responsive Design Standards** | Mobile-first layouts with fluid containers and media queries | https://claude-plugins.dev/skills/@maxritter/claude-codepro/frontend-responsive-design-standards |
| **Mobile Design Skill** | Responsive design systems adapting across devices | https://claude-plugins.dev/skills/@manutej/luxor-claude-marketplace/mobile-design |
| **Mobile Testing Skill** | Comprehensive iOS/Android testing including gestures and sensors | https://claude-plugins.dev/skills/@proffesor-for-testing/agentic-qe/mobile-testing |

### Guides

| Resource | Description | URL |
|----------|-------------|-----|
| **BrowserStack MCP Setup Guide** | Integration and testing automation guide | https://www.mcpstack.org/learn/browserstack-mcp-setup-guide |
| **Playwright MCP Comprehensive Guide** | AI-powered browser automation in 2025 | https://medium.com/@bluudit/playwright-mcp-comprehensive-guide-to-ai-powered-browser-automation-in-2025-712c9fd6cffa |
| **Playwright MCP 2026 Guide** | AI-powered test automation for 2026 | https://www.testleaf.com/blog/playwright-mcp-ai-test-automation-2026/ |

**Related Backlog Agents**: `responsive-design-validator`, `touch-target-optimizer`

---

## 6. Visual Regression Testing Resources

### MCP Servers & Tools

| Resource | Description | URL |
|----------|-------------|-----|
| **Percy via BrowserStack MCP** | Visual regression testing through BrowserStack MCP | https://www.browserstack.com/docs/browserstack-mcp-server/tools/percy |
| **Chromatic** | Visual testing and review tool from Storybook creators | https://www.chromatic.com/ |
| **Percy** | BrowserStack's visual testing platform | https://percy.io/ |

### Claude Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **Visual Regression Test Setup** | Skill for configuring visual regression testing | https://smithery.ai/skills/Dexploarer/visual-regression-test-setup |

**Related Backlog Skills**: `screenshot-comparison-skill`

---

## 7. Diagram & User Flow Resources

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **claude-mermaid** | MCP server for rendering Mermaid diagrams with live reload | https://github.com/veelenga/claude-mermaid |
| **Sailor MCP Server** | All Mermaid diagram types with themes and hand-drawn style | https://github.com/aj-geddes/sailor |
| **mcp-mermaid (hustcc)** | Generate Mermaid diagrams dynamically with AI | https://github.com/hustcc/mcp-mermaid |
| **Mermaid Diagram Support for Claude Code** | Automatic flowchart and sequence diagram generation | https://lobehub.com/mcp/zabolotiny-mermaid-diagram-claude-code |
| **Mermaid Chart Connector** | Official Mermaid Chart integration for Claude | https://claude.com/connectors/mermaid-chart |

### NPM Packages

| Resource | Description | URL |
|----------|-------------|-----|
| **claude-mermaid** | NPM package for Mermaid diagram rendering | https://www.npmjs.com/package/claude-mermaid |

**Related Backlog Skills**: `user-flow-diagram-skill`

---

## 8. Image Generation & Prototyping Resources

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **Image-Gen Plugin (shipdeckai)** | Multi-provider image generation with 10 AI providers | https://github.com/shipdeckai/claude-skills/tree/main/plugins/image-gen |
| **ai-image-gen-mcp** | Scalable MCP backend for image generation | https://github.com/krystian-ai/ai-image-gen-mcp |
| **FLUX.1-Krea-dev via Hugging Face** | Realistic image generation through Hugging Face MCP | https://huggingface.co/blog/claude-and-mcp |

### Prototyping Tools

| Resource | Description | URL |
|----------|-------------|-----|
| **prototypr.ai AI Wireframes** | AI wireframing with design system training and MCP export | https://www.prototypr.ai/products/ai-wireframes |
| **Claude Artifacts Prototyping** | Prototype AI-powered apps with Claude artifacts | https://support.claude.com/en/articles/11649438-prototype-ai-powered-apps-with-claude-artifacts |

**Related Backlog Agents**: `wireframe-generator`, `interaction-design-agent`

---

## 9. Icon & SVG Resources

### MCP Servers

| Resource | Description | URL |
|----------|-------------|-----|
| **Icons8 MCP Client** | Access to 368,865+ SVG icons in 116 styles | https://mcp.so/client/icons8-mcp-client |
| **Iconify SVG MCP Server (pickapicon-mcp)** | Access to 275,000+ icons via Iconify library | https://skywork.ai/skypage/en/iconify-svg-mcp-server-icon-management/1981598155953729536 |

### Icon Libraries

| Resource | Description | URL |
|----------|-------------|-----|
| **Tabler Icons** | 5,900+ icons on 24x24 grid, scalable SVG | https://tabler-icons.io/ |
| **Lucide** | Community-driven customizable SVG icons | https://lucide.dev/ |
| **Heroicons** | 450+ free SVG icons for Tailwind CSS integration | https://heroicons.com/ |

**Related Backlog Agents**: `iconography-system-agent`
**Related Backlog Skills**: `svg-optimizer-skill`

---

## 10. Typography & Design Tokens Resources

### Claude Skills & Documentation

| Resource | Description | URL |
|----------|-------------|-----|
| **Frontend Design Skill** | Typography, color, and aesthetic guidance for Claude | https://mcpservers.org/claude-skills/anthropic/frontend-design |
| **Prompting for Frontend Aesthetics** | Claude cookbook for typography and design | https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics |
| **Frontend Aesthetics Cookbook** | GitHub repository with frontend design guidance | https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb |

### Design Token Tools

| Resource | Description | URL |
|----------|-------------|-----|
| **Style Dictionary** | Design token transformation platform | https://amzn.github.io/style-dictionary/ |
| **Tailwind CSS Design Tokens Guide** | Best practices for design tokens in Tailwind | https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns |

**Related Backlog Agents**: `typography-system-agent`, `design-token-manager`
**Related Backlog Skills**: `typography-calculator-skill`, `design-token-transformer-skill`

---

## 11. User Research & Persona Resources

### Claude Skills & SubAgents

| Resource | Description | URL |
|----------|-------------|-----|
| **User Experience Researcher SubAgent** | Specializes in user needs, behaviors, and pain points | https://subagents.app/agents/user-researcher |
| **UX Researcher Plugin** | UX research capabilities plugin | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/ux-researcher |
| **Build Customer Personas Guide** | Claude guide for creating data-driven personas | https://claude.com/resources/use-cases/build-customer-personas |

### Related Plugins

| Resource | Description | URL |
|----------|-------------|-----|
| **Clarity Persona (AI Design Engineer)** | Human-first UX research within AI Design Engineer plugin | https://github.com/agenisea/ai-design-engineering-cc-plugins |

**Related Backlog Agents**: `user-research-synthesizer`, `persona-builder-agent`, `journey-map-visualizer`, `survey-design-agent`

---

## 12. General UX/UI Design Plugins

### Plugin Collections

| Resource | Description | URL |
|----------|-------------|-----|
| **Awesome Claude Skills (ComposioHQ)** | Curated list of Claude skills including design tools | https://github.com/ComposioHQ/awesome-claude-skills |
| **Awesome Claude Code Plugins** | Community plugin registry with Design UX category | https://github.com/ccplugins/awesome-claude-code-plugins |
| **Claude Plugins Registry** | Auto-indexed open-source registry with 34,000+ skills | https://claude-plugins.dev/ |
| **Claude Code Plugins Plus** | 243 plugins with 175 including Agent Skills | https://github.com/jeremylongshore/claude-code-plugins-plus-skills |

### Design-Specific Plugins

| Resource | Description | URL |
|----------|-------------|-----|
| **brand-guardian** | Brand consistency and design standards | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/brand-guardian |
| **mobile-ux-optimizer** | Mobile UX optimization | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/mobile-ux-optimizer |
| **ui-designer** | UI design assistance | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/ui-designer |
| **visual-storyteller** | Visual content and design narrative | https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/visual-storyteller |
| **Canvas Design** | Visual art creation with design philosophy | https://github.com/ComposioHQ/awesome-claude-skills/blob/master/canvas-design |
| **Theme Factory** | Professional font and color themes for artifacts | https://github.com/ComposioHQ/awesome-claude-skills/blob/master/theme-factory |
| **Brand Guidelines** | Applies brand colors and typography consistently | https://github.com/ComposioHQ/awesome-claude-skills/blob/master/brand-guidelines |
| **Artifacts Builder** | Multi-component HTML artifacts with React and Tailwind | https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder |

### AI Design Engineering

| Resource | Description | URL |
|----------|-------------|-----|
| **AI Design Engineer Plugin** | Human-first methodology with 7 specialized personas (Bliss, Clarity, Blueprompt) | https://github.com/agenisea/ai-design-engineering-cc-plugins |

---

## 13. Frontend Development & Visual Testing

### Claude Skills

| Resource | Description | URL |
|----------|-------------|-----|
| **Claude Code Frontend Dev** | Multimodal AI-powered visual testing plugin with browser automation | https://github.com/hemangjoshi37a/claude-code-frontend-dev |
| **Playwright Skill** | Browser automation skill for testing and validation | https://github.com/lackeyjb/playwright-skill |
| **Build Responsive Web Layouts** | Official Claude guide for responsive layouts | https://claude.com/blog/build-responsive-web-layouts |

### Testing Integration

| Resource | Description | URL |
|----------|-------------|-----|
| **Playwright MCP Claude Code Guide** | Testing with Playwright and Claude Code | https://nikiforovall.blog/ai/2025/09/06/playwright-claude-code-testing.html |
| **Claude MCP Integration Workflow** | Playwright, Supabase, Figma, Linear integration guide | https://vladimirsiedykh.com/blog/claude-code-mcp-workflow-playwright-supabase-figma-linear-integration-2025 |

---

## Summary Statistics

| Category | References Found |
|----------|------------------|
| Figma Integration | 9 |
| Accessibility Testing | 10 |
| Design System & Components | 8 |
| Performance & Lighthouse | 4 |
| Browser Testing & Responsive | 9 |
| Visual Regression Testing | 4 |
| Diagrams & User Flows | 6 |
| Image Generation & Prototyping | 5 |
| Icons & SVG | 6 |
| Typography & Design Tokens | 5 |
| User Research & Personas | 4 |
| General UX/UI Plugins | 13 |
| Frontend & Visual Testing | 5 |
| **Total References** | **88** |
| **Total Categories** | **13** |

---

## Agent-Reference Mapping

| Backlog Agent | Primary References |
|---------------|-------------------|
| figma-integration-agent | Claude Talk to Figma MCP, Figma MCP Server, html.to.design MCP |
| wcag-accessibility-auditor | A11y MCP, Deque axe MCP Server, Playwright Accessibility Testing MCP |
| screen-reader-compatibility-agent | A11y MCP, Accessibility Testing MCP |
| color-contrast-analyzer | a11y-color-contrast-mcp, XenPalette, Accessible Palette |
| design-token-manager | Style Dictionary, Superdesign MCP Server |
| user-research-synthesizer | User Experience Researcher SubAgent, Clarity Persona |
| persona-builder-agent | Build Customer Personas Guide, UX Researcher Plugin |
| journey-map-visualizer | Mermaid MCP servers, User Flow Diagram tools |
| wireframe-generator | Superdesign MCP Server, prototypr.ai AI Wireframes |
| responsive-design-validator | BrowserStack MCP Server, Playwright MCP, Mobile Design Skill |
| performance-auditor-agent | Lighthouse MCP Server, Lighthouse CI Integrator |
| touch-target-optimizer | Mobile UX Optimizer, Mobile Testing Skill |
| typography-system-agent | Frontend Design Skill, Prompting for Frontend Aesthetics |
| iconography-system-agent | Icons8 MCP Client, Iconify SVG MCP Server |
| interaction-design-agent | Image-Gen Plugin, Claude Artifacts Prototyping |
| storybook-integration-agent | Storybook MCP Addon, Storybook MCP Server |
| developer-handoff-agent | Implement Design Skill, Figma MCP Integration |

---

## Skill-Reference Mapping

| Backlog Skill | Primary References |
|---------------|-------------------|
| figma-api-skill | Claude Talk to Figma MCP, Figma MCP Server |
| axe-accessibility-skill | A11y MCP, Deque axe MCP Server |
| lighthouse-skill | Lighthouse MCP Server, Lighthouse CI Integrator |
| color-palette-generator-skill | a11y-color-contrast-mcp, XenPalette, Accessible Palette |
| typography-calculator-skill | Frontend Design Skill, Tailwind CSS Design Tokens Guide |
| screenshot-comparison-skill | Percy via BrowserStack MCP, Chromatic, Visual Regression Test Setup |
| design-token-transformer-skill | Style Dictionary, Superdesign MCP Server |
| svg-optimizer-skill | Icons8 MCP Client, Iconify SVG MCP Server |
| user-flow-diagram-skill | claude-mermaid, Sailor MCP, mcp-mermaid |
| browser-stack-skill | BrowserStack MCP Server |
| persona-template-skill | Build Customer Personas Guide |

---

## Next Steps

1. **Evaluate MCP Servers**: Test top-rated MCP servers for compatibility with babysitter SDK
2. **Fork & Customize**: Identify servers that can be forked and customized for specific workflows
3. **Create Wrappers**: Build SDK wrappers around community tools for seamless integration
4. **Contribution Opportunities**: Identify gaps where new MCP servers or skills could be contributed
5. **Version Monitoring**: Set up monitoring for updates to key dependencies

---

## Document Metadata

- **Created**: 2026-01-24
- **Specialization**: UX/UI Design
- **Phase**: 5 (Skills & Agents References)
- **Total References**: 88
- **Categories**: 13

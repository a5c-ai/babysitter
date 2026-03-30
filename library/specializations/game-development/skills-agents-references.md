# Game Development - Skills and Agents References (Phase 5)

## Overview

This document provides external references to community-created Claude skills, agents, plugins, and MCP (Model Context Protocol) servers that align with the skills and agents identified in the Phase 4 backlog. These resources can enhance Game Development workflows by providing pre-built integrations for game engines, 3D graphics, shader development, multiplayer networking, game AI, audio systems, and asset pipelines.

## Summary Statistics

- **Total References Found**: 68
- **Categories Covered**: 12 (Game Engines, 3D Graphics/Modeling, Shaders/Rendering, Asset Pipeline, Level Design, Version Control, UI/UX Design, Localization, QA/Testing, Procedural Generation, Audio, Platform/Publishing)
- **MCP Servers**: 42
- **Claude Skills Collections**: 5
- **Supporting Tools/Guides**: 21

---

## Game Engine References

### Unity Engine

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| unity-mcp (CoplayDev) | MCP Server | https://github.com/CoplayDev/unity-mcp | Unity MCP acts as a bridge allowing AI assistants (Claude, Cursor) to interact directly with Unity Editor. Manages assets, controls scenes, edits scripts, and automates tasks. Featured in ACM 2025 publication "MCP-Unity: Protocol-Driven Framework for Interactive 3D Authoring" |
| Unity-MCP (IvanMurzak) | MCP Server | https://github.com/IvanMurzak/Unity-MCP | AI-powered game development assistant for Editor & Runtime. Works inside compiled games for real-time AI debugging and player-AI interaction |
| mcp-unity (CoderGamester) | MCP Server | https://github.com/CoderGamester/mcp-unity | Model Context Protocol plugin connecting Unity Editor with Cursor, Claude Code, Codex, Windsurf and other IDEs |
| mcp-server-unity (zabaglione) | MCP Server | https://mcpservers.org/servers/zabaglione/mcp-server-unity | MCP server enabling AI assistants to interact with Unity projects programmatically, supporting Claude Desktop and HTTP API |
| Unity MCP (Playbooks) | MCP Server | https://playbooks.com/mcp/unity | Unity MCP server for AI agents with smart script creation, shader support for Built-in/URP/HDRP |
| UnityMCPIntegration (VR-Jobs) | MCP Server | https://github.com/VR-Jobs/UnityMCPbeta | Seamless communication between Unity and large language models through MCP protocol |

### Unreal Engine

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| UnrealMCP (kvick-games) | MCP Server | https://github.com/kvick-games/UnrealMCP | Unreal Engine plugin implementing MCP for external AI systems to interact with and manipulate the Unreal environment. TCP server with JSON-based command protocol |
| unreal-mcp (chongdashu) | MCP Server | https://github.com/chongdashu/unreal-mcp | Enable AI clients like Cursor, Windsurf, and Claude Desktop to control Unreal Engine through natural language using MCP |
| Unreal_mcp (ChiR24) | MCP Server | https://github.com/ChiR24/Unreal_mcp | Comprehensive MCP server enabling AI assistants to control Unreal Engine through native C++ Automation Bridge plugin. Built with TypeScript, C++, and Rust (WebAssembly) |
| UnrealMCPBridge (appleweed) | MCP Server | https://github.com/appleweed/UnrealMCPBridge | Facilitates access to the Unreal Engine Python API for MCP clients |
| py-ue5-mcp-server (edi3on) | MCP Server | https://github.com/edi3on/py-ue5-mcp-server | Natural language interaction with Unreal Engine 5, enabling conversational commands for 3D object and Blueprint creation |
| UnrealClaude (Natfii) | Plugin | https://github.com/Natfii/UnrealClaude | Claude Code CLI integration for Unreal Engine 5.7 with built-in UE5.7 documentation context |
| ClaudeAI Plugin for UE5 | Plugin | https://claudeaiplugin.com/ | Revolutionary AI assistant for Unreal Engine 5, generates Behavior Trees, EQS queries, and AI controllers |
| Unreal Engine Code Analyzer | MCP Server | https://glama.ai/mcp/servers/@ayeletstudioindia/unreal-analyzer-mcp | Deep source code analysis for Unreal Engine codebases, understanding C++ class structures and subsystems |

### Godot Engine

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Godot-MCP (ee0pdt) | MCP Server | https://github.com/ee0pdt/Godot-MCP | Comprehensive integration between Godot Engine and AI assistants via MCP. Full project access for scripts, scenes, nodes, and resources |
| godot-mcp (Coding-Solo) | MCP Server | https://github.com/Coding-Solo/godot-mcp | MCP server for launching Godot editor, running projects, capturing debug output, and controlling execution. Direct feedback loop for AI assistants |
| GDAI MCP Server | MCP Server | https://gdaimcp.com/ | All-in-one Godot MCP server. Claude can fix scripts, read errors, update code, run game, and verify output using screenshots |
| godot-mcp (satelliteoflove) | MCP Server | https://github.com/satelliteoflove/godot-mcp | MCP server giving Claude direct visibility into Godot editor and running game with viewport/camera info, selection management, screenshots |
| Godot-MCP (Dokujaa) | MCP Server | https://github.com/Dokujaa/Godot-MCP | MCP server enabling Claude Desktop to control and interact with Godot Engine editor |
| mcp_godot_rag (weekitmo) | MCP Server | https://github.com/weekitmo/mcp_godot_rag | Access to Godot documentation through MCP for RAG-enhanced assistance |

### Other Game Engines

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Ebitengine MCP | MCP Server | https://github.com/sedyh/ebitengine-mcp | Facilitates integration of Ebitengine games with MCP servers |
| Defold MCP | MCP Server | https://github.com/ChadAragorn/defold-mcp | Integrates Defold game engine with developer tools and AI workflows |
| Panda3D MCP | MCP Server | https://github.com/th3w1zard1/mcp-panda3d | Efficient search and retrieval of Panda3D documentation |

---

## 3D Graphics and Modeling References

### Blender Integration

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| blender-mcp (ahujasid) | MCP Server | https://github.com/ahujasid/blender-mcp | Official Blender MCP connecting Claude AI to Blender for prompt-assisted 3D modeling, scene creation, and manipulation. Supports Poly Haven and Hyper3D APIs |
| blender_mcp_new | MCP Server | https://github.com/2132660698/blender_mcp_new | Integrates MCP with Blender for AI-driven 3D modeling and rendering tasks |
| unreal-blender-mcp (tahooki) | MCP Server | https://github.com/tahooki/unreal-blender-mcp | Facilitates AI-driven control of both Blender and Unreal Engine through unified MCP server |
| Blender-MCP.com | Resource | https://blender-mcp.com/ | AI-Powered 3D Modeling with Claude, comprehensive documentation and use cases |

### Three.js and Web 3D

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| mcp-threejs | MCP Server | https://github.com/baryhuang/mcp-threejs | AI-driven searches for downloadable 3D models compatible with Three.js |
| PlayCanvas MCP | MCP Server | https://playbooks.com/mcp/playcanvas | Create interactive 3D web apps with PlayCanvas Editor through MCP |

### Game Asset Generation

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| game-asset-mcp (MubarakHAlketbi) | MCP Server | https://github.com/MubarakHAlketbi/game-asset-mcp | Generate 2D and 3D game assets from text prompts using Hugging Face AI models |
| Blockbench MCP Plugin | Plugin | https://github.com/jasonjgardner | Blockbench plugin connecting AI agents to JavaScript API for creating/editing 3D models and pixel art textures |

### 3D Printing (Prototyping)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| OctoEverywhere MCP | MCP Server | https://octoeverywhere.com/mcp | 3D Printing MCP server for querying live state, webcam snapshots, and printer control |

---

## Shader and Rendering References

### GLSL/Shader Development

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| GLSL Docs MCP Server | MCP Server | https://lobehub.com/mcp/yourusername-glsl-docs-mcp | Comprehensive MCP server for GLSL shader development with React Three Fiber. Covers GLSL fundamentals, Shadertoy conversion, particle systems, GPU particles and FBO techniques |
| Open-Shaders Repository | Reference | https://github.com/repalash/Open-Shaders | Collection of open source shaders (GLSL, HLSL, CG) from popular game engines for educational reference |

*Note: No dedicated HLSL-specific MCP servers were found. Unity and Unreal MCP servers provide shader support through their respective editors.*

---

## Version Control References

### Perforce Helix Core

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| p4mcp-server (Official Perforce) | MCP Server | https://github.com/perforce/p4mcp-server | Official Perforce P4 MCP Server with FastMCP and direct P4 Python bindings. Read/write tools for changelists, files, shelves, workspaces, jobs, reviews. Code review workflow support |
| mcp-perforce (Cocoon-AI) | MCP Server | https://github.com/Cocoon-AI/mcp-perforce | Streamlined interface for Perforce operations in Claude Desktop. File management, changelist handling, sync, diff analysis, workspace management |

### Git (Standard)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| GitHub MCP Server | MCP Server | https://github.com/modelcontextprotocol/servers | Official GitHub MCP server for repository operations, issues, PRs |
| Git Operations MCP | Reference | Multiple | Various Git MCP implementations available in awesome-mcp-servers lists |

*Note: Git LFS integration typically handled through standard Git MCP servers. No dedicated Git LFS MCP server found.*

---

## UI/UX Design References

### Figma Integration

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| claude-talk-to-figma-mcp | MCP Server | https://github.com/arinspunk/claude-talk-to-figma-mcp | MCP allowing Claude Desktop and AI tools to interact directly with Figma. Bidirectional design-to-code workflow |
| html.to.design MCP | MCP Server | https://html.to.design/docs/mcp-tab/ | MCP allowing Claude to create designs directly on Figma canvas |
| Figma MCP x Claude | Guide | https://proandroiddev.com/figma-mcp-x-claude-delivering-ui-in-mins-a8144e23dc16 | Tutorial on Figma MCP integration for rapid UI development |

---

## Localization References

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Lingo.dev MCP Server | MCP Server | https://playbooks.com/mcp/lingo-translation | Open-source AI-powered i18n toolkit for instant localization with LLMs |
| Crowdin MCP | MCP Server | https://crowdin.com/blog/2025/08/19/what-is-a-model-context-protocol | Crowdin MCP server connecting AI agents to localization workspace. For games, connects to repository for live context on strings |
| Xcode i18n MCP Server | MCP Server | https://lobehub.com/mcp/zhangyu1818-xcode-i18n-mcp | iOS/macOS app localization workflow management (relevant for mobile games) |
| internationalization-i18n Skill | Skill | https://www.aimcp.info/skills/500b5cdd-f569-455d-8e54-d87f43665f51 | Comprehensive i18n implementation guide covering message translation, pluralization, RTL languages |

---

## QA and Testing References

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Claude QA System MCP | MCP Server | https://lobehub.com/mcp/dylanredfield-claude-qa-system | Self-hosted automated testing system integrated with Claude Code via MCP. Automatic test generation, real-time monitoring |
| Playwright MCP | MCP Server | https://testomat.io/blog/playwright-mcp-claude-code/ | Browser automation for UI testing. Playwright ships with planner, generator, and healer agents |
| Playwright Agents Guide | Guide | https://alexop.dev/posts/building_ai_qa_engineer_claude_code_playwright/ | Building AI QA Engineer with Claude Code and Playwright MCP |

---

## Procedural Generation and Level Design References

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Unreal Gen-AI Support Plugin | Plugin | https://www.mcplane.com/mcp_servers/unreal-gen-ai-support | MCP plugin for Unreal Engine 5 supporting blueprint automation, scene control, UI generation for procedural workflows |
| Unity MCP Procedural | Reference | https://blogs.infosys.com/emerging-technology-solutions/artificial-intelligence/the-digital-alchemist-vibe-coding-with-unity-mcp-and-claude-ai-to-craft-3d-immersive-xr-experiences.html | Claude assists in defining procedural generation rules, patterns, and algorithms for vast open worlds |

---

## Game-Specific MCP Servers

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Minecraft MCP | MCP Server | https://github.com/Jeremy-Min-Yang/minecraft-mcp-server-pixel | AI-driven control of Minecraft bot using Mineflayer API |
| Minecraft Remote MCP | MCP Server | https://github.com/nacal/mcp-minecraft-remote | Remote control of Minecraft servers through AI-driven commands |
| VRChat MCP | MCP Server | https://github.com/Krekun/vrchat-mcp-osc | AI-driven avatar control and interactions in VRChat |
| Factorio MCP | MCP Server | https://github.com/jessiqa1118/factorio-mcp | Query server state, player lists, and in-game time data |
| Counter-Strike 2 MCP | MCP Server | https://github.com/v9rt3x/cs2-rcon-mcp | Remote server management via RCON commands |

---

## NVIDIA and Simulation References

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| isaac-sim-mcp (NVIDIA) | MCP Server | https://github.com/omni-mcp/isaac-sim-mcp | MCP Server enabling natural language control of NVIDIA Isaac Sim, Lab, OpenUSD |

---

## Comprehensive Skill Collections

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| hesreallyhim/awesome-claude-code | Skills Directory | https://github.com/hesreallyhim/awesome-claude-code | Curated list of skills, hooks, slash-commands, agent orchestrators for Claude Code |
| ccplugins/awesome-claude-code-plugins | Plugins Directory | https://github.com/ccplugins/awesome-claude-code-plugins | Slash commands, subagents, MCP servers, and hooks for Claude Code |
| game-developer subagent | Subagent | https://www.buildwithclaude.com/subagent/game-developer | Game developer subagent for Unity, Unreal Engine, or web technologies. Implements game mechanics, physics, AI, and optimization |
| claude-plugins-official | Plugin Directory | https://github.com/anthropics/claude-plugins-official | Official Anthropic-managed directory of high-quality Claude Code plugins |
| travisvn/awesome-claude-skills | Skills Directory | https://github.com/travisvn/awesome-claude-skills | Curated list of Claude Skills and resources |

---

## Awesome MCP Server Lists

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| punkpeye/awesome-mcp-servers | Curated List | https://github.com/punkpeye/awesome-mcp-servers | Production-ready and experimental MCP servers |
| TensorBlock/awesome-mcp-servers | Curated List | https://github.com/TensorBlock/awesome-mcp-servers | Comprehensive coverage of 7260+ MCP servers with gaming.md category |
| TensorBlock Gaming MCP List | Gaming Category | https://github.com/TensorBlock/awesome-mcp-servers/blob/main/docs/gaming.md | Dedicated list of gaming-related MCP servers |
| modelcontextprotocol/servers | Official | https://github.com/modelcontextprotocol/servers | Official Model Context Protocol servers repository |

---

## Skills/Agents to References Mapping

| Skill/Agent from Backlog | Recommended References |
|--------------------------|------------------------|
| unity-development-skill | unity-mcp (CoplayDev), Unity-MCP (IvanMurzak), mcp-unity (CoderGamester) |
| unity-shader-graph-skill | Unity MCP with URP/HDRP support, Blender-MCP for asset prep |
| unreal-development-skill | UnrealMCP (kvick-games), unreal-mcp (chongdashu), Unreal_mcp (ChiR24) |
| unreal-blueprint-skill | ClaudeAI Plugin for UE5, UnrealClaude |
| unreal-niagara-skill | UnrealMCP, Unreal Gen-AI Support Plugin |
| godot-development-skill | Godot-MCP (ee0pdt), godot-mcp (Coding-Solo), GDAI MCP Server |
| godot-gdscript-skill | GDAI MCP Server with script reading/updating |
| blender-integration-skill | blender-mcp (ahujasid), Blender-MCP.com |
| behavior-trees-skill | ClaudeAI Plugin for UE5 (generates Behavior Trees) |
| navmesh-skill | Unity MCP, Unreal MCP with scene manipulation |
| client-server-skill | Standard MCP networking tools |
| perforce-skill | p4mcp-server (Official), mcp-perforce (Cocoon-AI) |
| game-hud-skill | claude-talk-to-figma-mcp, html.to.design MCP |
| localization-skill | Lingo.dev MCP, Crowdin MCP |
| game-qa-agent | Claude QA System MCP, Playwright MCP |
| procedural-generation-skill | Unity MCP procedural support, Unreal Gen-AI Support |
| game-architect-agent | game-developer subagent |
| unity-developer-agent | Unity MCP servers, game-developer subagent |
| unreal-developer-agent | UnrealMCP servers, UnrealClaude plugin |
| godot-developer-agent | Godot MCP servers, GDAI MCP |
| graphics-programmer-agent | Blender MCP, GLSL Docs MCP |
| shader-developer-agent | GLSL Docs MCP, Unity/Unreal shader support |
| tech-artist-agent | Blender-MCP, game-asset-mcp |

---

## Gaps and Opportunities

The following skills/agents from the backlog do not have readily available MCP servers or Claude skills:

### High Priority Gaps (Consider Custom Development)
1. **FMOD/Wwise Audio Integration** - No dedicated MCP servers for game audio middleware
2. **PhysX/Physics Engine** - No standalone physics MCP; handled through engine MCPs
3. **Photon/Steam Networking** - No dedicated multiplayer networking MCPs
4. **Console SDK Integration** - PlayStation/Xbox/Switch SDKs lack MCP wrappers (NDA restrictions likely)
5. **Game Analytics** - No dedicated game analytics MCP servers

### Medium Priority Gaps
1. **Maya Integration** - No Maya MCP found; Blender MCP available as alternative
2. **Houdini Engine** - No dedicated Houdini MCP for procedural asset workflows
3. **Substance Painter/Designer** - No dedicated texture pipeline MCP
4. **Motion Capture Cleanup** - No specialized mocap MCP tools
5. **Anti-Cheat Systems** - No MCP integration for anti-cheat (likely security concerns)

### Low Priority Gaps (Niche Use Cases)
1. **VFX Graph Specific** - Covered by general engine MCPs
2. **Animation State Machines** - Covered by engine MCPs
3. **Platform Certification** - Manual process, unlikely to have MCP

### Covered Areas (Strong Ecosystem)
1. **Unity Engine** - 6+ MCP server options
2. **Unreal Engine** - 6+ MCP server options with Blueprint/AI support
3. **Godot Engine** - 5+ MCP server options with comprehensive coverage
4. **Blender 3D** - Multiple MCP servers with asset pipeline support
5. **Version Control (Perforce)** - Official and community MCP servers
6. **UI/UX (Figma)** - Multiple MCP integrations
7. **Localization** - Crowdin and Lingo.dev MCP servers
8. **QA Testing** - Playwright and Claude QA System MCP

---

## Implementation Recommendations

### Quick Wins (Existing MCP Servers)
1. Install **unity-mcp** or **mcp-unity** for Unity development workflows
2. Configure **UnrealMCP** or **unreal-mcp** for Unreal Engine projects
3. Add **Godot-MCP** for Godot development
4. Deploy **blender-mcp** for 3D asset pipeline
5. Use **p4mcp-server** for Perforce version control

### Custom Development Priorities
1. Create FMOD/Wwise MCP wrapper for audio integration
2. Build Steamworks SDK MCP server for Steam integration
3. Develop Photon/multiplayer networking MCP
4. Consider game analytics MCP integration

### Integration Strategy
1. Start with game engine MCP (Unity/Unreal/Godot based on project)
2. Add Blender MCP for asset pipeline
3. Integrate Perforce MCP for version control
4. Add Figma MCP for UI/UX workflows
5. Deploy localization MCP for multi-language support
6. Build custom integrations for audio and networking

---

## References

### Official Documentation
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Claude Code MCP Documentation](https://docs.anthropic.com/claude-code/mcp)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)

### Game Engine Resources
- [Unity MCP Guide](https://apidog.com/blog/unity-mcp-server/)
- [Unreal Engine MCP Guide](https://apidog.com/blog/unreal-engine-mcp-server/)
- [Godot MCP Deep Dive](https://skywork.ai/skypage/en/godot-ai-mcp-server/1978727584661884928)

### Community Resources
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [TensorBlock Gaming MCP List](https://github.com/TensorBlock/awesome-mcp-servers/blob/main/docs/gaming.md)
- [MCP Server Registry](https://mcp.so/)
- [Smithery MCP Marketplace](https://smithery.ai/)

---

*Last Updated: 2026-01-24*
*Phase: 5 - Skills and Agents References*
*Specialization: Game Development*
*Specialization Slug: `game-development`*

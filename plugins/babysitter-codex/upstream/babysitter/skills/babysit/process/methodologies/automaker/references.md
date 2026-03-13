# References

## Source Attribution

The AutoMaker babysitter process definitions are adapted from the AutoMaker open-source project.

- **Repository:** https://github.com/AutoMaker-Org/automaker
- **Organization:** AutoMaker-Org
- **License:** See source repository for license terms

## AutoMaker Components Referenced

### Core Architecture (from source repository)
- `apps/ui/` - React frontend + Electron desktop application
- `libs/` - Shared monorepo packages
- `tests/e2e/` - Playwright E2E tests
- `.claude/` - Claude CLI configuration for agent orchestration

### Workflow Concepts Adapted

#### Kanban Board Workflow
- Feature cards with text, image, and screenshot inputs
- Column-based progression: Backlog, Ready, In Progress, Review, Done
- WIP limits and priority-based ordering

#### Git Worktree Isolation
- Agents work in isolated git worktrees for safety
- Branch-per-feature pattern with `feature/<id>` naming
- Automatic worktree cleanup after merge or failure

#### Multi-Agent Execution
- Parallel agent dispatch with configurable concurrency
- Real-time streaming UI updates showing agent progress
- Convergence loops for test failure resolution

#### Test Automation Integration
- Vitest for unit testing
- Playwright for E2E testing
- Automated test execution after code generation
- Coverage threshold enforcement

#### Code Review Pipeline
- Automated code review with quality scoring
- Configurable review policies: auto, manual, hybrid
- Quality gates with threshold enforcement

#### Build & Deploy
- Production build pipeline (npm run build)
- Staging and production deployment targets
- Automated release notes generation

### Environment Variables (from source)
- `PORT` (3008) - Server port
- `DATA_DIR` (./data) - Data directory
- `ENABLE_REQUEST_LOGGING` - Request logging toggle
- `GH_TOKEN` - GitHub token for operations
- `AUTOMAKER_MOCK_AGENT` (true) - Mock agent mode for CI

### Commands (from source)
- `npm run dev` / `dev:electron` / `dev:web` - Development modes
- `npm run build` / `build:electron:mac/win/linux` - Production builds
- `npm run test` / `test:headed` / `test:server` / `test:all` - Test suites
- `docker-compose up -d` - Docker deployment
- `./start-automaker.sh` - TUI launcher

## Mapping from AutoMaker to Babysitter Processes

| AutoMaker Concept | Babysitter Process | Notes |
|-------------------|--------------------|-------|
| Kanban board | `automaker-orchestrator.js` Phase 1 | Feature intake and board initialization |
| Feature decomposition | `automaker-feature-pipeline.js` | Triage, decompose, dispatch |
| Agent execution | `automaker-agent-execution.js` | Worktree setup, code gen, tests |
| Code review | `automaker-review-ship.js` | Review, quality gates, merge |
| Deployment | `automaker-review-ship.js` Stage 4-5 | Build, deploy, release notes |
| Streaming UI | Progress Streamer agent | Real-time event emission |
| Worktree isolation | Worktree Manager agent | Git worktree lifecycle |
| Mock agent mode | Babysitter test harness | Deterministic test execution |

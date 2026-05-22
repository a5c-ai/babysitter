# larksuite/cli

- **Archetype**: domain-skill-pack
- **Stars**: 7,494
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: gh-search (keyword: "agent skill")
- **Skills found**: 20+

## Summary
Official Lark/Feishu CLI maintained by the Lark team. Covers core business domains: Messenger (IM), Docs, Base, Sheets, Calendar, Mail, Tasks, Meetings (VC), and more. Includes 200+ commands and 19 AI agent skills organized by domain (lark-im, lark-doc, lark-base, lark-sheets, lark-calendar, lark-mail, lark-task, lark-vc, lark-approval, lark-attendance, lark-contact, lark-minutes, lark-slides, lark-wiki, lark-drive, lark-event, lark-whiteboard, lark-shared, lark-skill-maker).

## Assessment
MEDIUM-HIGH VALUE. Similar architecture to googleworkspace/cli but for the Lark/Feishu ecosystem. The lark-skill-maker meta-skill (skill that creates skills) is particularly interesting. Domain-specific workflows for enterprise collaboration. Less directly extractable than GWS since Lark-specific, but the skill architecture patterns are valuable.

## Extraction Priority
MEDIUM -- The skill-maker meta-pattern is the most extractable element. Domain workflows are Lark-specific but the collaboration patterns are generic.

## Processes
1. **enterprise-meeting-workflow** -- Schedule (calendar) -> prepare (docs) -> conduct (VC) -> minutes -> follow-up tasks
2. **approval-workflow** -- Request creation -> routing -> approval/rejection -> notification
3. **skill-maker-meta-process** -- Meta-skill for generating new skills from CLI help and API docs

## Plugin Ideas
- **lark-bridge plugin**: Similar to GWS bridge but for Lark/Feishu ecosystem

## Implicit Procedural Knowledge
- Skill-maker pattern: meta-skill that generates domain skills from API documentation
- Shared skill pattern (lark-shared): common auth, flags, security rules factored out
- Whiteboard skills for visual collaboration in agent workflows

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Enterprise Meeting Workflow | NEW | Schedule → prepare → conduct → follow-up cycle | - | specializations/business/enterprise-meeting-workflow.js |
| Approval Workflow | NEW | Request creation, routing, approval, notification | - | specializations/business/approval-workflow.js |
| Skill Maker Meta-Process | NEW | Meta-skill for generating domain skills from API docs | - | specializations/shared/skill-maker-meta-process.js |
| Shared Skill Pattern | NEW | Common auth/security rules factored out across skills | - | specializations/shared/shared-skill-pattern.js |
| Visual Collaboration Integration | NEW | Whiteboard skills for visual agent workflows | - | specializations/business/visual-collaboration.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Lark Bridge | NEW | Lark/Feishu ecosystem integration | - | plugins/a5c/marketplace/plugins/lark-bridge/ |

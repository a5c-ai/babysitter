# dominikmartn/nothing-design-skill

- **Archetype**: domain-skill-pack
- **Stars**: 1,675
- **Last pushed**: 2026-04-01
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1

## Summary
Claude Code skill for generating UI in the Nothing design language -- a monochrome, typographic, industrial aesthetic inspired by Swiss typography, Braun, and Teenage Engineering. The SKILL.md is remarkably deep: it encodes a complete design system with philosophy, craft rules (three-layer visual hierarchy, font discipline with budgets), and both dark/light mode as first-class. Version 3.0.0 with allowed-tools restrictions.

## Assessment
MEDIUM VALUE. While the specific design language (Nothing) is niche, the skill demonstrates a gold-standard pattern for encoding design systems as agent instructions. Key transferable elements: the three-layer visual hierarchy rule (primary/secondary/tertiary with specific type scales), the font budget concept (max 2 families, 3 sizes, 2 weights per screen), and the decision table for when to use size vs. weight vs. color for distinction. The "subtract, don't add" philosophy with concrete enforcement rules is a template for any design-system-as-skill. The skill also shows how to require font loading declarations before any design work begins -- a dependency-checking pattern.

## Extraction Priority
- Medium
- Rationale: The design-system-as-skill meta-pattern is highly reusable. The three-layer hierarchy and font budget constraints are applicable to any UI design specialization. The skill's structure (philosophy -> craft rules -> decision tables -> implementation tokens) is a template for encoding any design system.

## Processes
- **Design System Application Process**: Declare font dependencies -> determine mode (dark/light) -> apply three-layer hierarchy -> enforce font budget -> validate visual hierarchy (squint test). A multi-step process with concrete validation gates.
- **Design-System-as-Skill Template**: Philosophy statement -> craft rules with decision tables -> token references -> mode-specific guidelines. Reusable template for encoding any design system.

## Plugin Ideas
- **Design System Encoder plugin**: A babysitter marketplace plugin that helps encode arbitrary design systems (Material, Fluent, Ant, custom) into agent-consumable skill format. Install.md would guide through extracting design tokens, hierarchy rules, and decision tables from existing design documentation.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Design System Application Process | NEW | Multi-step design process with hierarchy validation and font budget constraints | - | specializations/frontend/design-system-application.js |
| Design-System-as-Skill Template | NEW | Template for encoding design systems with philosophy, craft rules, and decision tables | - | specializations/shared/design-system-as-skill-template.js |
| Three-Layer Visual Hierarchy | NEW | Prescribed type scales and spacing system with squint test validation | - | specializations/frontend/three-layer-visual-hierarchy.js |
| Font Budget Constraint System | NEW | Enforceable constraints (max 2 families, 3 sizes, 2 weights) for visual coherence | - | specializations/frontend/font-budget-constraint-system.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Design System Encoder | NEW | Encode arbitrary design systems into agent-consumable skill format with tokens and rules | - | plugins/a5c/marketplace/blueprints/design-system-encoder/ |

## Patterns
- **Three-layer visual hierarchy**: Every screen has exactly three layers of importance (primary/secondary/tertiary) with prescribed type scales and spacing. A squint test validates the hierarchy. Reusable across any UI design skill.
- **Font budget constraint**: Maximum 2 families, 3 sizes, 2 weights per screen. "Every additional size/weight costs visual coherence." Concrete, enforceable constraint.
- **Decision tables for design choices**: When to use size vs. weight vs. color for visual distinction. Eliminates subjective design decisions with prescriptive rules.
- **Dependency declaration**: Require declaring Google Fonts before starting design work. Pattern for ensuring prerequisites are met before execution.
- **Dual-mode first-class**: Both dark and light mode designed independently, neither derived. Pattern for avoiding second-class treatment of alternate modes.

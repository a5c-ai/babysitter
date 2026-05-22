# phuryn/pm-skills

## Metadata
- **Full name:** phuryn/pm-skills
- **Description:** PM Skills Marketplace: 100+ agentic skills, commands, and plugins -- from discovery to strategy, execution, launch, and growth
- **Stars:** 9,831
- **Last pushed:** 2026-03-09
- **License:** MIT
- **Topics:** agent-skills, claude-code-marketplace, claude-code-plugins, product-management

## Archetype
**domain-skill-pack** - 65+ PM skills and 36 chained workflows across 8 plugins covering the full product management lifecycle. Encodes frameworks from Teresa Torres, Marty Cagan, Alberto Savoia.

## Structure
```
pm-product-discovery/    (13 skills, 5 commands)
pm-product-strategy/     (skills + commands)
pm-execution/            (skills + commands)
pm-go-to-market/         (skills + commands)
pm-market-research/      (skills + commands)
pm-marketing-growth/     (skills + commands)
pm-data-analytics/       (skills + commands)
pm-toolkit/              (shared skills)
```

## Extractable Value

### Processes (specializations/business/product-management/)

1. **product-discovery** - Teresa Torres Opportunity Solution Tree methodology: brainstorm-ideas -> identify-assumptions -> prioritize-assumptions -> brainstorm-experiments. Includes separate tracks for existing vs new products. Highly structured PM discovery process. **Placement: specializations/business/product-management/product-discovery**

2. **product-strategy** - Strategic framework including north-star metrics definition, competitive analysis, pricing strategy, roadmap prioritization. **Placement: specializations/business/product-management/product-strategy**

3. **go-to-market** - Launch planning methodology: market positioning, messaging, channel strategy, launch execution. **Placement: specializations/business/product-management/go-to-market**

4. **assumption-testing** - Alberto Savoia pretotyping methodology for new products. Structured experiment design with risk categorization across 8 dimensions (Value, Usability, Viability, Feasibility, Go-to-Market, Strategy, Team, plus more). **Placement: specializations/business/product-management/assumption-testing**

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Product Discovery (Teresa Torres OST) | NEW | Opportunity Solution Tree methodology with assumption testing | - | specializations/business/product-discovery.js |
| Product Strategy Framework | NEW | North-star metrics, competitive analysis, roadmap prioritization | - | specializations/business/product-strategy.js |
| Go-to-Market Methodology | NEW | Launch planning with positioning, messaging, channel strategy | - | specializations/business/go-to-market.js |
| Assumption Testing (Savoia Pretotyping) | NEW | Alberto Savoia pretotyping methodology for new products | - | specializations/business/assumption-testing.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | No valid plugin ideas - pure methodology content that maps to babysitter processes | - | N/A |

### SKIP

- Feature prioritization frameworks - too generic/checklist-like
- Data analytics skills - tool-specific (SQL, analytics platforms)
- Marketing growth skills - too tactical, not methodology

## Priority Assessment
**MEDIUM-HIGH** - Rich product management domain processes based on established frameworks (Torres OST, Savoia pretotyping, Cagan product-led). The product-discovery and assumption-testing processes are well-structured enough to port directly. This fills the business/product-management specialization gap.

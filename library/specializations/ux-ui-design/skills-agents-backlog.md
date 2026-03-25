# UX/UI Design Specialization - Skills & Agents Backlog

## Overview

This document identifies specialized agents (subagents) and skills that would enhance the UX/UI Design processes beyond general-purpose capabilities. These specialized components enable deeper domain expertise, tool integrations, and automated quality gates specific to UX/UI design workflows.

---

## Specialized Agents

### 1. Figma Integration Agent
- **ID**: `figma-integration-agent`
- **Purpose**: Bidirectional integration with Figma for design asset management
- **Capabilities**:
  - Export/import design components from Figma
  - Sync design tokens between code and Figma
  - Generate component documentation from Figma specs
  - Validate design-to-code consistency
  - Extract style properties and measurements
- **Used By Processes**:
  - component-library.js (designToolLibraryTask)
  - design-system.js
  - hifi-prototyping.js
  - wireframing.js

### 2. WCAG Accessibility Auditor Agent
- **ID**: `wcag-accessibility-auditor`
- **Purpose**: Comprehensive WCAG 2.1/2.2 compliance validation
- **Capabilities**:
  - Automated WCAG success criteria checking
  - Generate VPAT documentation
  - Level A, AA, AAA compliance scoring
  - Detailed remediation recommendations
  - Conformance report generation
- **Used By Processes**:
  - accessibility-audit.js (wcagComplianceReviewTask, vpatGenerationTask)
  - component-library.js (accessibilityAuditTask)
  - responsive-design.js (responsiveAccessibilityTask)

### 3. Screen Reader Compatibility Agent
- **ID**: `screen-reader-compatibility-agent`
- **Purpose**: Test and validate screen reader experiences
- **Capabilities**:
  - Simulate NVDA, JAWS, VoiceOver, TalkBack behavior
  - Validate ARIA implementation
  - Test focus management and reading order
  - Generate screen reader test scripts
  - Document assistive technology compatibility
- **Used By Processes**:
  - accessibility-audit.js (screenReaderCompatibilityTask, assistiveTechnologyUsabilityTask)

### 4. Color Contrast Analyzer Agent
- **ID**: `color-contrast-analyzer`
- **Purpose**: Analyze and optimize color contrast ratios
- **Capabilities**:
  - Calculate WCAG contrast ratios
  - Suggest accessible color alternatives
  - Test color blindness simulations (protanopia, deuteranopia, tritanopia)
  - Validate dark/light mode contrast
  - Generate color accessibility reports
- **Used By Processes**:
  - accessibility-audit.js (colorContrastVisualAnalysisTask)
  - component-library.js (colorSystemDesignTask)
  - design-system.js

### 5. Design Token Manager Agent
- **ID**: `design-token-manager`
- **Purpose**: Manage and transform design tokens across platforms
- **Capabilities**:
  - Parse and validate design token files
  - Transform tokens to CSS, SCSS, JS, iOS, Android formats
  - Manage token inheritance and aliases
  - Version control token changes
  - Generate token documentation
- **Used By Processes**:
  - component-library.js (designTokensDefinitionTask, colorSystemDesignTask, typographySystemDesignTask, spacingLayoutSystemTask)
  - design-system.js

### 6. User Research Synthesizer Agent
- **ID**: `user-research-synthesizer`
- **Purpose**: Analyze and synthesize qualitative/quantitative user research
- **Capabilities**:
  - Thematic analysis of interview transcripts
  - Affinity mapping automation
  - Statistical analysis of survey data
  - Insight extraction and pattern recognition
  - Research finding prioritization
- **Used By Processes**:
  - user-research.js (dataSynthesisTask, insightGenerationTask)
  - persona-development.js (researchSynthesisTask)
  - user-journey-mapping.js (researchSynthesisTask)

### 7. Persona Builder Agent
- **ID**: `persona-builder-agent`
- **Purpose**: Generate research-backed user personas
- **Capabilities**:
  - User segmentation analysis
  - Demographic and psychographic profiling
  - Goals and frustrations mapping
  - Behavioral pattern identification
  - Empathy map generation
- **Used By Processes**:
  - persona-development.js (personaDevelopmentTask, empathyMapGenerationTask)
  - user-research.js (personaCreationTask)

### 8. Journey Map Visualizer Agent
- **ID**: `journey-map-visualizer`
- **Purpose**: Create and visualize user journey maps
- **Capabilities**:
  - Multi-channel touchpoint mapping
  - Emotional curve visualization
  - Pain point and opportunity highlighting
  - Service blueprint generation
  - Current vs. future state comparison
- **Used By Processes**:
  - user-journey-mapping.js (currentStateMapCreationTask, futureStateMapCreationTask, serviceBlueprintCreationTask)
  - persona-development.js (journeyMappingTask)
  - user-research.js (journeyMappingTask)

### 9. Wireframe Generator Agent
- **ID**: `wireframe-generator`
- **Purpose**: Generate and iterate on wireframe designs
- **Capabilities**:
  - Low-fidelity wireframe creation
  - Medium-fidelity wireframe enhancement
  - Annotation and specification generation
  - Responsive wireframe variants
  - Wireframe-to-prototype conversion
- **Used By Processes**:
  - wireframing.js (lowFidelityWireframeTask, mediumFidelityWireframeTask, annotationGenerationTask)

### 10. Responsive Design Validator Agent
- **ID**: `responsive-design-validator`
- **Purpose**: Validate responsive design across devices and breakpoints
- **Capabilities**:
  - Cross-device layout testing
  - Breakpoint behavior validation
  - Viewport simulation
  - Responsive image optimization
  - Touch target measurement
- **Used By Processes**:
  - responsive-design.js (crossDeviceTestingTask, breakpointStrategyTask, responsiveLayoutDesignTask)
  - component-library.js (responsiveBehaviorTask)

### 11. Performance Auditor Agent
- **ID**: `performance-auditor-agent`
- **Purpose**: Analyze UI/UX performance metrics
- **Capabilities**:
  - Core Web Vitals measurement (LCP, FID, CLS)
  - Render performance analysis
  - Animation performance profiling
  - Asset optimization recommendations
  - Performance budget validation
- **Used By Processes**:
  - responsive-design.js (responsivePerformanceTestingTask)
  - component-library.js

### 12. Touch Target Optimizer Agent
- **ID**: `touch-target-optimizer`
- **Purpose**: Optimize touch interactions for mobile/tablet
- **Capabilities**:
  - Touch target size validation (44x44px minimum)
  - Spacing analysis between interactive elements
  - Gesture pattern recommendations
  - Thumb zone mapping
  - Mobile-first interaction optimization
- **Used By Processes**:
  - responsive-design.js (touchTargetOptimizationTask)
  - accessibility-audit.js

### 13. Typography System Agent
- **ID**: `typography-system-agent`
- **Purpose**: Design and validate typography systems
- **Capabilities**:
  - Type scale generation
  - Font pairing recommendations
  - Readability scoring
  - Line height and spacing optimization
  - Responsive typography calculations
- **Used By Processes**:
  - component-library.js (typographySystemDesignTask)
  - responsive-design.js (responsiveTypographySpacingTask)
  - design-system.js

### 14. Iconography System Agent
- **ID**: `iconography-system-agent`
- **Purpose**: Manage and validate icon systems
- **Capabilities**:
  - Icon consistency validation
  - Grid and sizing standards enforcement
  - SVG optimization
  - Icon accessibility (labels, contrast)
  - Icon library documentation
- **Used By Processes**:
  - component-library.js (iconSystemDesignTask)
  - design-system.js

### 15. Interaction Design Agent
- **ID**: `interaction-design-agent`
- **Purpose**: Define and validate interaction patterns
- **Capabilities**:
  - Micro-interaction design
  - Animation timing and easing
  - State transition mapping
  - Feedback pattern design
  - Motion design guidelines
- **Used By Processes**:
  - component-library.js (interactionAnimationTask)
  - hifi-prototyping.js

### 16. Usability Heuristics Evaluator Agent
- **ID**: `usability-heuristics-evaluator`
- **Purpose**: Conduct heuristic evaluations based on Nielsen's heuristics
- **Capabilities**:
  - 10 usability heuristics assessment
  - Severity rating assignment
  - Issue documentation with screenshots
  - Recommendation prioritization
  - Competitive heuristic analysis
- **Used By Processes**:
  - heuristic-evaluation.js
  - accessibility-audit.js

### 17. Information Architecture Agent
- **ID**: `information-architecture-agent`
- **Purpose**: Design and validate information architecture
- **Capabilities**:
  - Site map generation
  - Navigation structure optimization
  - Content hierarchy analysis
  - Labeling system validation
  - Findability scoring
- **Used By Processes**:
  - wireframing.js (informationArchitectureTask)
  - user-journey-mapping.js

### 18. Prototype Testing Agent
- **ID**: `prototype-testing-agent`
- **Purpose**: Facilitate and analyze prototype usability testing
- **Capabilities**:
  - Task completion rate tracking
  - Click path analysis
  - Time-on-task measurement
  - Error rate calculation
  - Usability metrics aggregation
- **Used By Processes**:
  - hifi-prototyping.js
  - wireframing.js (interactivePrototypeTask)
  - usability-testing.js

### 19. Survey Design Agent
- **ID**: `survey-design-agent`
- **Purpose**: Design and analyze user surveys
- **Capabilities**:
  - Question type optimization
  - Survey flow logic design
  - Response bias detection
  - Statistical analysis (SUS, NPS, CSAT)
  - Survey results visualization
- **Used By Processes**:
  - user-research.js (quantitativeDataCollectionTask)
  - survey-design.js

### 20. Card Sorting Analyst Agent
- **ID**: `card-sorting-analyst`
- **Purpose**: Conduct and analyze card sorting studies
- **Capabilities**:
  - Open/closed card sort facilitation
  - Similarity matrix generation
  - Dendrogram analysis
  - Category labeling suggestions
  - IA recommendations from results
- **Used By Processes**:
  - card-sorting.js
  - information-architecture.js

### 21. A/B Testing Agent
- **ID**: `ab-testing-agent`
- **Purpose**: Design and analyze A/B tests
- **Capabilities**:
  - Hypothesis formulation
  - Sample size calculation
  - Statistical significance testing
  - Conversion rate analysis
  - Test result interpretation
- **Used By Processes**:
  - ab-testing.js

### 22. Design Documentation Agent
- **ID**: `design-documentation-agent`
- **Purpose**: Generate comprehensive design documentation
- **Capabilities**:
  - Component specification writing
  - Usage guidelines creation
  - Code snippet generation
  - Accessibility notes documentation
  - Version history tracking
- **Used By Processes**:
  - component-library.js (componentDocumentationTask)
  - design-system.js
  - persona-development.js (personaDocumentationTask)

### 23. Storybook Integration Agent
- **ID**: `storybook-integration-agent`
- **Purpose**: Manage Storybook component documentation
- **Capabilities**:
  - Story generation from components
  - Props documentation extraction
  - Visual regression test setup
  - Addon configuration
  - Component playground creation
- **Used By Processes**:
  - component-library.js (storybookSetupTask)

### 24. Developer Handoff Agent
- **ID**: `developer-handoff-agent`
- **Purpose**: Facilitate design-to-development handoff
- **Capabilities**:
  - Specification extraction
  - Asset export preparation
  - Measurement annotation
  - Implementation guidelines
  - Code reference generation
- **Used By Processes**:
  - component-library.js (developerHandoffTask, codeImplementationPlanTask)
  - wireframing.js (wireframePackageGenerationTask)
  - responsive-design.js (implementationGuidelinesTask)

### 25. Emotional Design Analyst Agent
- **ID**: `emotional-design-analyst`
- **Purpose**: Analyze and design for emotional experiences
- **Capabilities**:
  - Emotional curve mapping
  - Sentiment analysis
  - Delight moment identification
  - Emotional touchpoint optimization
  - Experience emotion scoring
- **Used By Processes**:
  - user-journey-mapping.js (emotionalMappingTask)
  - persona-development.js (goalsAnalysisTask)

---

## Specialized Skills

### 1. Figma API Skill
- **ID**: `figma-api-skill`
- **Purpose**: Direct Figma API interactions
- **Capabilities**:
  - File/component fetching
  - Design token extraction
  - Image export
  - Comment management
  - Version history access
- **Integration Points**: Figma REST API, Figma Plugin API

### 2. Axe Accessibility Skill
- **ID**: `axe-accessibility-skill`
- **Purpose**: Automated accessibility testing with axe-core
- **Capabilities**:
  - Run axe-core scans
  - Generate WCAG violation reports
  - Suggest code fixes
  - Track accessibility debt
- **Integration Points**: axe-core, axe-playwright

### 3. Lighthouse Skill
- **ID**: `lighthouse-skill`
- **Purpose**: Performance and accessibility auditing
- **Capabilities**:
  - Run Lighthouse audits
  - Core Web Vitals measurement
  - Accessibility scoring
  - SEO and best practices checks
- **Integration Points**: Google Lighthouse, PageSpeed Insights API

### 4. Color Palette Generator Skill
- **ID**: `color-palette-generator-skill`
- **Purpose**: Generate accessible color palettes
- **Capabilities**:
  - Create color scales
  - Generate complementary colors
  - Ensure WCAG contrast compliance
  - Export to design tokens
- **Integration Points**: chroma.js, color-contrast-checker

### 5. Typography Calculator Skill
- **ID**: `typography-calculator-skill`
- **Purpose**: Calculate typography scales and metrics
- **Capabilities**:
  - Generate type scales (modular, golden ratio)
  - Calculate line heights
  - Responsive font sizing
  - Vertical rhythm calculation
- **Integration Points**: type-scale.com algorithms

### 6. Screenshot Comparison Skill
- **ID**: `screenshot-comparison-skill`
- **Purpose**: Visual regression testing
- **Capabilities**:
  - Capture component screenshots
  - Pixel-diff comparison
  - Responsive screenshot capture
  - Visual change reporting
- **Integration Points**: Playwright, Puppeteer, Percy

### 7. Design Token Transformer Skill
- **ID**: `design-token-transformer-skill`
- **Purpose**: Transform design tokens across formats
- **Capabilities**:
  - Parse W3C design token format
  - Transform to CSS, SCSS, JS, iOS, Android
  - Handle token aliases and references
  - Generate documentation
- **Integration Points**: Style Dictionary, Theo

### 8. SVG Optimizer Skill
- **ID**: `svg-optimizer-skill`
- **Purpose**: Optimize SVG assets
- **Capabilities**:
  - Remove unnecessary metadata
  - Optimize paths
  - Generate icon sprites
  - Convert to React components
- **Integration Points**: SVGO, svgr

### 9. Responsive Image Skill
- **ID**: `responsive-image-skill`
- **Purpose**: Generate responsive image sets
- **Capabilities**:
  - Generate srcset variants
  - Create WebP/AVIF versions
  - Calculate art direction crops
  - Generate picture element markup
- **Integration Points**: Sharp, ImageMagick

### 10. Heatmap Analysis Skill
- **ID**: `heatmap-analysis-skill`
- **Purpose**: Analyze user interaction heatmaps
- **Capabilities**:
  - Parse heatmap data
  - Identify attention patterns
  - Click concentration analysis
  - Scroll depth analysis
- **Integration Points**: Hotjar API, Crazy Egg API

### 11. Survey Platform Skill
- **ID**: `survey-platform-skill`
- **Purpose**: Integrate with survey platforms
- **Capabilities**:
  - Create/distribute surveys
  - Collect responses
  - Calculate SUS/NPS scores
  - Export results
- **Integration Points**: Typeform API, SurveyMonkey API, Google Forms API

### 12. User Flow Diagram Skill
- **ID**: `user-flow-diagram-skill`
- **Purpose**: Generate user flow diagrams
- **Capabilities**:
  - Create Mermaid diagrams
  - Generate flowcharts
  - Export to various formats
  - Validate flow completeness
- **Integration Points**: Mermaid.js, diagrams.net API

### 13. Prototype Interaction Skill
- **ID**: `prototype-interaction-skill`
- **Purpose**: Define prototype interactions
- **Capabilities**:
  - Map click/tap interactions
  - Define transitions
  - Set up hotspots
  - Generate interaction specifications
- **Integration Points**: Figma Prototype API, InVision API

### 14. Component Inventory Skill
- **ID**: `component-inventory-skill`
- **Purpose**: Audit and inventory existing components
- **Capabilities**:
  - Scan codebase for components
  - Identify component variations
  - Map component usage
  - Generate inventory reports
- **Integration Points**: React component analysis, AST parsing

### 15. Browser Stack Skill
- **ID**: `browser-stack-skill`
- **Purpose**: Cross-browser/device testing
- **Capabilities**:
  - Run tests on real devices
  - Capture device screenshots
  - Test on multiple browsers
  - Generate compatibility reports
- **Integration Points**: BrowserStack API, Sauce Labs API

### 16. Animation Spec Skill
- **ID**: `animation-spec-skill`
- **Purpose**: Generate animation specifications
- **Capabilities**:
  - Define easing curves
  - Calculate timing
  - Generate CSS animations
  - Create Lottie specifications
- **Integration Points**: Lottie, CSS animations

### 17. Accessibility Report Skill
- **ID**: `accessibility-report-skill`
- **Purpose**: Generate accessibility compliance reports
- **Capabilities**:
  - VPAT document generation
  - ACR (Accessibility Conformance Report) creation
  - WCAG checklist completion
  - Remediation roadmap generation
- **Integration Points**: VPAT template, ACR format

### 18. Design System Validator Skill
- **ID**: `design-system-validator-skill`
- **Purpose**: Validate design system compliance
- **Capabilities**:
  - Check token usage
  - Validate component props
  - Ensure consistency
  - Generate compliance reports
- **Integration Points**: ESLint plugins, Stylelint

### 19. Contrast Checker Skill
- **ID**: `contrast-checker-skill`
- **Purpose**: Check color contrast compliance
- **Capabilities**:
  - WCAG 2.1 contrast ratio calculation
  - Large text vs normal text checks
  - Suggest passing alternatives
  - Batch color pair checking
- **Integration Points**: color-contrast-checker, polished

### 20. Persona Template Skill
- **ID**: `persona-template-skill`
- **Purpose**: Generate persona documents from templates
- **Capabilities**:
  - Fill persona templates
  - Generate persona cards
  - Export to various formats (PDF, PNG, MD)
  - Create empathy map visualizations
- **Integration Points**: Template engines, PDF generation

---

## Shared Candidates (Cross-Specialization)

These agents/skills are candidates for promotion to shared infrastructure as they have applicability beyond UX/UI Design:

### Agents
1. **Performance Auditor Agent** - Applicable to Frontend, Full-Stack
2. **Documentation Agent** - Applicable to all specializations
3. **A/B Testing Agent** - Applicable to Product, Marketing
4. **Survey Design Agent** - Applicable to Product, Research
5. **Developer Handoff Agent** - Applicable to all development specializations

### Skills
1. **Lighthouse Skill** - Frontend, Full-Stack, Performance
2. **Screenshot Comparison Skill** - QA, Testing, Frontend
3. **Browser Stack Skill** - QA, Testing, Frontend
4. **SVG Optimizer Skill** - Frontend, Design
5. **Responsive Image Skill** - Frontend, Performance

---

## Agent-Process Mapping Matrix

| Process | Primary Agents | Secondary Agents | Skills |
|---------|---------------|------------------|--------|
| accessibility-audit | wcag-accessibility-auditor, screen-reader-compatibility-agent, color-contrast-analyzer | performance-auditor-agent, touch-target-optimizer | axe-accessibility-skill, lighthouse-skill, accessibility-report-skill, contrast-checker-skill |
| component-library | design-token-manager, figma-integration-agent, typography-system-agent, iconography-system-agent | developer-handoff-agent, storybook-integration-agent, interaction-design-agent | figma-api-skill, design-token-transformer-skill, svg-optimizer-skill, design-system-validator-skill |
| design-system | design-token-manager, figma-integration-agent, typography-system-agent, color-contrast-analyzer | iconography-system-agent, design-documentation-agent | design-token-transformer-skill, color-palette-generator-skill, typography-calculator-skill |
| hifi-prototyping | figma-integration-agent, interaction-design-agent, prototype-testing-agent | responsive-design-validator | figma-api-skill, prototype-interaction-skill, animation-spec-skill, screenshot-comparison-skill |
| information-architecture | information-architecture-agent, card-sorting-analyst | usability-heuristics-evaluator | user-flow-diagram-skill, heatmap-analysis-skill |
| persona-development | persona-builder-agent, user-research-synthesizer, emotional-design-analyst | journey-map-visualizer | persona-template-skill, survey-platform-skill |
| responsive-design | responsive-design-validator, touch-target-optimizer, performance-auditor-agent | typography-system-agent | lighthouse-skill, browser-stack-skill, responsive-image-skill, screenshot-comparison-skill |
| user-journey-mapping | journey-map-visualizer, emotional-design-analyst, user-research-synthesizer | persona-builder-agent | user-flow-diagram-skill, heatmap-analysis-skill |
| user-research | user-research-synthesizer, survey-design-agent, persona-builder-agent | card-sorting-analyst | survey-platform-skill, heatmap-analysis-skill |
| usability-testing | prototype-testing-agent, usability-heuristics-evaluator | user-research-synthesizer | heatmap-analysis-skill, screenshot-comparison-skill |
| wireframing | wireframe-generator, information-architecture-agent | figma-integration-agent, developer-handoff-agent | figma-api-skill, user-flow-diagram-skill |

---

## Implementation Priority

### Phase 1 - Core Agents (High Priority)
1. WCAG Accessibility Auditor Agent
2. Figma Integration Agent
3. Design Token Manager Agent
4. User Research Synthesizer Agent
5. Responsive Design Validator Agent

### Phase 2 - Enhancement Agents (Medium Priority)
1. Screen Reader Compatibility Agent
2. Color Contrast Analyzer Agent
3. Journey Map Visualizer Agent
4. Wireframe Generator Agent
5. Persona Builder Agent

### Phase 3 - Specialized Agents (Lower Priority)
1. Typography System Agent
2. Iconography System Agent
3. Interaction Design Agent
4. Storybook Integration Agent
5. A/B Testing Agent

### Phase 1 - Core Skills (High Priority)
1. Axe Accessibility Skill
2. Figma API Skill
3. Design Token Transformer Skill
4. Lighthouse Skill
5. Screenshot Comparison Skill

### Phase 2 - Enhancement Skills (Medium Priority)
1. Color Palette Generator Skill
2. Typography Calculator Skill
3. SVG Optimizer Skill
4. User Flow Diagram Skill
5. Survey Platform Skill

### Phase 3 - Specialized Skills (Lower Priority)
1. Responsive Image Skill
2. Browser Stack Skill
3. Animation Spec Skill
4. Persona Template Skill
5. Heatmap Analysis Skill

---

## Summary Statistics

- **Total Agents Identified**: 25
- **Total Skills Identified**: 20
- **Shared Candidates (Agents)**: 5
- **Shared Candidates (Skills)**: 5
- **Total Shared Candidates**: 10

---

## Next Steps

1. Review and prioritize agents/skills based on process usage frequency
2. Define detailed specifications for Phase 1 agents and skills
3. Identify existing implementations that can be adapted
4. Create integration plans with external tools (Figma, axe-core, Lighthouse)
5. Design shared infrastructure for cross-specialization candidates

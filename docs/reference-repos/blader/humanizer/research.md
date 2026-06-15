# blader/humanizer

- **Archetype**: utility-with-skill
- **Stars**: 13,495
- **Last pushed**: 2026-04-01
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: gh-search (keyword: "claude code skills")
- **Skills found**: 1

## Summary
A writing editor skill that identifies and removes signs of AI-generated text. Based on Wikipedia's "Signs of AI writing" guide. Detects patterns including: inflated symbolism, promotional language, superficial -ing analyses, vague attributions, em dash overuse, rule of three, AI vocabulary words, passive voice, negative parallelisms, filler phrases. Includes voice calibration from writing samples.

## Assessment
Strong domain-specific skill with a well-structured multi-step procedure: (1) identify AI patterns, (2) rewrite problematic sections, (3) preserve meaning, (4) maintain voice, (5) add soul, (6) final anti-AI pass. The voice calibration feature (analyzing a writing sample to match style) is a sophisticated technique. Extractable as a specializations/writing/humanize-text process.

## Extraction Priority
MEDIUM -- The pattern detection checklist and voice calibration procedure could be extracted as a writing quality process. Useful for any content-generation workflow.

## Processes
1. **humanize-text** -- Multi-pass AI writing detection and rewriting process with voice calibration
   - Phase 1: Scan for AI patterns (comprehensive checklist)
   - Phase 2: Voice calibration from sample text
   - Phase 3: Rewrite with personality injection
   - Phase 4: Anti-AI verification pass

## Plugin Ideas
- **writing-humanizer plugin**: Wrap the humanizer as a babysitter plugin with hooks into content generation workflows. Post-processing step after any text generation task.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Humanize Text Process | NEW | Multi-pass AI writing detection and rewriting with voice calibration | - | specializations/shared/humanize-text-process.js |
| Voice Calibration Methodology | NEW | Voice fingerprinting from writing samples (sentence length, word choice, transitions) | - | specializations/shared/voice-calibration-methodology.js |
| AI Writing Pattern Detection | NEW | Comprehensive taxonomy of AI writing tells with detection checklist | - | specializations/shared/ai-writing-pattern-detection.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Writing Humanizer | NEW | Post-processing hooks for content generation workflows with AI detection and rewriting | - | plugins/a5c/marketplace/blueprints/writing-humanizer/ |

## Implicit Procedural Knowledge
- The "two-pass anti-AI" technique: first ask "what makes this AI-generated?", then "fix those tells"
- Voice fingerprinting from writing samples (sentence length, word choice, punctuation habits, transitions)
- Comprehensive taxonomy of AI writing tells based on Wikipedia's AI Cleanup project

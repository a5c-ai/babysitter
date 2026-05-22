# gavrielc/Nano-PDF

- **Archetype**: utility-with-skill
- **Stars**: 1,237
- **Last pushed**: 2025-12-03
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: ClawHub skills (published as "steipete/nano-pdf")
- **Skills found**: 0 SKILL.md in repo (Python CLI tool; skill wrapper published to ClawHub separately)
- **Fork**: No

## Summary

CLI tool for editing PDF slides using natural language prompts, powered by Google's Gemini 3 Pro Image ("Nano Banana") model. Written in Python with pip/uvx distribution.

Key features:
- Natural language PDF page editing ("Change the tagline to X")
- Add new slides matching existing deck's visual style
- Non-destructive editing with OCR re-hydration (preserves searchable text layer)
- Multi-page concurrent processing
- Configurable resolution (1K/2K/4K)

The workflow: render PDF pages as images -> send to Gemini 3 Pro Image with edit instructions -> OCR to restore text layer -> stitch back into PDF.

## Assessment

LOW extractable value for babysitter. The tool is narrowly focused on PDF slide editing via AI image generation. The OCR re-hydration technique is interesting but niche. No multi-step workflow patterns that would translate well to babysitter processes.

**Extraction priority**: LOW

# Extractable Value: gavrielc/Nano-PDF

## Processes

### 1. AI-Assisted Presentation Editing
- **Source**: PDF page editing with natural language + style reference
- **Placement**: `specializations/shared/ai-presentation-editing.js`
- **Description**: Process for iteratively editing presentation slides via AI: select target pages -> provide edit instructions in natural language -> generate edits at draft resolution -> review with user (breakpoint) -> iterate on instructions -> finalize at high resolution -> stitch into output PDF. Multi-page parallel processing for throughput.

## Plugin Ideas

### 1. PDF Editing Plugin
- **Category**: Tools Integration
- **install.md**: Installs nano-pdf Python package (pip/uvx), configures GEMINI_API_KEY with billing-enabled Google Cloud project. Provides babysitter tasks for editing PDF pages with natural language and adding new slides. Requires Poppler and Tesseract system dependencies.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| AI-Assisted Presentation Editing | NEW | Iterative slide editing via AI with natural language instructions and style reference | - | specializations/shared/ai-presentation-editing.js |
| OCR Re-Hydration Pattern | NEW | Metadata preservation through image-based AI transformation workflows | - | specializations/shared/ocr-rehydration-pattern.js |
| Style Reference Injection | NEW | Context injection pattern for AI generation to match existing style | - | specializations/shared/style-reference-injection.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| PDF Editing Integration | NEW | Natural language PDF editing with Gemini 3 Pro Image and system dependencies | - | plugins/a5c/marketplace/plugins/pdf-editing-integration/ |

## Implicit Procedural Knowledge

- **OCR re-hydration pattern**: After AI image generation, running OCR to restore the searchable text layer. This preserve-metadata-through-transformation pattern is applicable to any pipeline that transforms documents through an image-based AI step.
- **Style reference injection**: Sending additional "style reference" pages alongside the edit target so the AI model understands the visual design language. This context-injection pattern is useful for any AI generation that needs to match existing style.

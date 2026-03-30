---
name: docs-accessibility
description: Documentation accessibility validation and remediation. Check WCAG 2.1 compliance, validate alt text, analyze heading hierarchy, verify color contrast, and generate accessibility reports.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-019
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Documentation Accessibility Skill

Documentation accessibility validation and remediation.

## Capabilities

- WCAG 2.1 compliance checking
- Image alt text validation
- Heading hierarchy analysis
- Color contrast verification
- Screen reader compatibility testing
- Keyboard navigation validation
- ARIA landmark checking
- Accessibility report generation

## Usage

Invoke this skill when you need to:
- Audit documentation for accessibility
- Validate image alt text
- Check heading structure
- Verify color contrast ratios
- Generate accessibility reports

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| inputPath | string | Yes | Path to documentation or built site |
| action | string | Yes | audit, validate-images, check-headings |
| standard | string | No | WCAG level (A, AA, AAA) |
| outputFormat | string | No | json, html, sarif |
| fix | boolean | No | Auto-fix issues where possible |

### Input Example

```json
{
  "inputPath": "./docs/_build/html",
  "action": "audit",
  "standard": "AA",
  "outputFormat": "json"
}
```

## Output Structure

### Accessibility Report

```json
{
  "summary": {
    "total": 156,
    "passed": 142,
    "failed": 14,
    "level": "AA",
    "score": 91
  },
  "byCategory": {
    "images": { "passed": 45, "failed": 3 },
    "headings": { "passed": 28, "failed": 2 },
    "contrast": { "passed": 52, "failed": 5 },
    "navigation": { "passed": 17, "failed": 4 }
  },
  "issues": [
    {
      "id": "img-alt-missing",
      "wcag": "1.1.1",
      "level": "A",
      "impact": "critical",
      "description": "Image missing alt text",
      "location": {
        "file": "docs/guide/setup.md",
        "line": 42,
        "element": "<img src=\"diagram.png\">"
      },
      "suggestion": "Add descriptive alt text: alt=\"System architecture diagram showing...\""
    },
    {
      "id": "heading-skip",
      "wcag": "1.3.1",
      "level": "A",
      "impact": "moderate",
      "description": "Heading levels should only increase by one",
      "location": {
        "file": "docs/api/users.md",
        "line": 15,
        "element": "<h4>User Properties</h4>"
      },
      "context": "H2 -> H4 (skipped H3)",
      "suggestion": "Change to <h3> or add missing <h3> above"
    },
    {
      "id": "color-contrast",
      "wcag": "1.4.3",
      "level": "AA",
      "impact": "serious",
      "description": "Text does not meet contrast ratio requirements",
      "location": {
        "file": "docs/_static/custom.css",
        "line": 28,
        "element": ".note { color: #999; }"
      },
      "details": {
        "foreground": "#999999",
        "background": "#ffffff",
        "ratio": "2.85:1",
        "required": "4.5:1"
      },
      "suggestion": "Change to #767676 or darker for 4.5:1 ratio"
    }
  ],
  "wcagCompliance": {
    "A": { "passed": 48, "failed": 6 },
    "AA": { "passed": 35, "failed": 8 },
    "AAA": { "passed": 12, "failed": 0 }
  }
}
```

## WCAG Guidelines Checked

### Perceivable (Principle 1)

```yaml
1.1.1 - Non-text Content:
  - Images have alt text
  - Decorative images have empty alt
  - Complex images have long descriptions
  - Icons have accessible names

1.3.1 - Info and Relationships:
  - Headings properly structured
  - Lists properly marked up
  - Tables have headers
  - Form labels associated

1.4.1 - Use of Color:
  - Color not sole indicator
  - Links distinguishable

1.4.3 - Contrast (Minimum):
  - Text: 4.5:1 ratio
  - Large text: 3:1 ratio
  - UI components: 3:1 ratio
```

### Operable (Principle 2)

```yaml
2.1.1 - Keyboard:
  - All functionality keyboard accessible
  - No keyboard traps
  - Skip links present

2.4.1 - Bypass Blocks:
  - Skip navigation link
  - Landmark regions

2.4.2 - Page Titled:
  - Descriptive page titles

2.4.6 - Headings and Labels:
  - Descriptive headings
  - Clear labels

2.4.7 - Focus Visible:
  - Visible focus indicators
```

### Understandable (Principle 3)

```yaml
3.1.1 - Language of Page:
  - lang attribute present

3.2.3 - Consistent Navigation:
  - Navigation consistent across pages

3.3.2 - Labels or Instructions:
  - Form inputs have labels
```

## Image Alt Text Validation

### Alt Text Rules

```javascript
const altTextRules = {
  // Must have alt attribute
  required: {
    test: (img) => img.hasAttribute('alt'),
    message: 'Image must have alt attribute'
  },

  // Alt text should be descriptive
  descriptive: {
    test: (img) => {
      const alt = img.getAttribute('alt');
      const badPatterns = [
        /^image$/i,
        /^photo$/i,
        /^picture$/i,
        /^graphic$/i,
        /\.(?:png|jpg|gif|svg)$/i,
        /^untitled/i
      ];
      return !badPatterns.some(p => p.test(alt));
    },
    message: 'Alt text should describe the image content'
  },

  // Not too long
  length: {
    test: (img) => {
      const alt = img.getAttribute('alt');
      return alt.length <= 125;
    },
    message: 'Alt text should be concise (under 125 characters)'
  },

  // Decorative images should have empty alt
  decorative: {
    test: (img) => {
      if (img.hasAttribute('role') && img.getAttribute('role') === 'presentation') {
        return img.getAttribute('alt') === '';
      }
      return true;
    },
    message: 'Decorative images should have empty alt=""'
  }
};
```

### Alt Text Suggestions

```javascript
function suggestAltText(imagePath, context) {
  const suggestions = [];

  // Based on filename
  const filename = path.basename(imagePath, path.extname(imagePath));
  if (filename.includes('diagram')) {
    suggestions.push(`Diagram showing ${extractContext(context)}`);
  }
  if (filename.includes('screenshot')) {
    suggestions.push(`Screenshot of ${extractContext(context)}`);
  }
  if (filename.includes('logo')) {
    suggestions.push(`${extractBrand(filename)} logo`);
  }

  // Based on surrounding text
  const heading = findNearestHeading(context);
  if (heading) {
    suggestions.push(`Illustration for ${heading}`);
  }

  return suggestions;
}
```

## Heading Structure Analysis

### Heading Hierarchy Check

```javascript
function analyzeHeadings(content) {
  const headings = extractHeadings(content);
  const issues = [];

  let lastLevel = 0;
  headings.forEach((heading, index) => {
    const level = heading.level;

    // Check for skipped levels
    if (level > lastLevel + 1 && lastLevel !== 0) {
      issues.push({
        type: 'heading-skip',
        heading: heading.text,
        line: heading.line,
        expected: lastLevel + 1,
        actual: level
      });
    }

    // Check for multiple H1s
    if (level === 1 && index > 0) {
      issues.push({
        type: 'multiple-h1',
        heading: heading.text,
        line: heading.line
      });
    }

    lastLevel = level;
  });

  return {
    structure: buildHeadingTree(headings),
    issues
  };
}
```

## Color Contrast Checking

### Contrast Ratio Calculation

```javascript
function getContrastRatio(foreground, background) {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function meetsContrastRequirement(ratio, isLargeText, level = 'AA') {
  const requirements = {
    'AA': { normal: 4.5, large: 3 },
    'AAA': { normal: 7, large: 4.5 }
  };

  const threshold = isLargeText
    ? requirements[level].large
    : requirements[level].normal;

  return ratio >= threshold;
}
```

### CSS Analysis

```javascript
async function analyzeStylesheet(cssPath) {
  const css = await fs.readFile(cssPath, 'utf8');
  const ast = postcss.parse(css);
  const issues = [];

  ast.walkDecls('color', (decl) => {
    const rule = decl.parent;
    const bgColor = findBackgroundColor(rule) || '#ffffff';
    const fgColor = decl.value;

    const ratio = getContrastRatio(fgColor, bgColor);

    if (!meetsContrastRequirement(ratio, false, 'AA')) {
      issues.push({
        selector: rule.selector,
        foreground: fgColor,
        background: bgColor,
        ratio: ratio.toFixed(2),
        line: decl.source.start.line,
        suggestion: suggestAccessibleColor(fgColor, bgColor)
      });
    }
  });

  return issues;
}
```

## Keyboard Navigation

### Focus Testing

```javascript
async function testKeyboardNavigation(page) {
  const issues = [];

  // Get all focusable elements
  const focusable = await page.$$('a, button, input, select, textarea, [tabindex]');

  for (const element of focusable) {
    await element.focus();

    // Check focus visibility
    const hasFocusStyle = await page.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const focusStyles = window.getComputedStyle(el, ':focus');
      return (
        styles.outline !== 'none' ||
        styles.boxShadow !== 'none' ||
        focusStyles.outline !== 'none'
      );
    }, element);

    if (!hasFocusStyle) {
      issues.push({
        type: 'focus-not-visible',
        element: await element.evaluate(el => el.outerHTML.substring(0, 100))
      });
    }
  }

  return issues;
}
```

## Workflow

1. **Parse content** - Load documentation files or built HTML
2. **Extract elements** - Find images, headings, links, etc.
3. **Check images** - Validate alt text
4. **Analyze headings** - Check hierarchy
5. **Test contrast** - Verify color ratios
6. **Check navigation** - Validate keyboard access
7. **Generate report** - Output findings

## Dependencies

```json
{
  "devDependencies": {
    "axe-core": "^4.8.0",
    "pa11y": "^6.2.0",
    "lighthouse": "^11.0.0",
    "puppeteer": "^21.0.0",
    "color-contrast-checker": "^2.1.0"
  }
}
```

## CLI Commands

```bash
# Run axe-core audit
npx axe ./docs/_build/html --rules wcag2aa

# Run pa11y
npx pa11y https://docs.example.com --standard WCAG2AA

# Lighthouse accessibility audit
npx lighthouse https://docs.example.com --only-categories=accessibility

# Check single page
npx axe https://docs.example.com/guide --save report.json
```

## Best Practices Applied

- Always provide alt text for informative images
- Use empty alt for decorative images
- Maintain logical heading hierarchy
- Ensure 4.5:1 contrast for normal text
- Provide visible focus indicators
- Include skip navigation links
- Use semantic HTML elements

## References

- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- axe-core: https://github.com/dequelabs/axe-core
- pa11y: https://pa11y.org/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

## Target Processes

- docs-testing.js
- docs-audit.js
- style-guide-enforcement.js

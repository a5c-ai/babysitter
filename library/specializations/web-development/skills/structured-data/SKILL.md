---
name: structured-data
description: JSON-LD schema markup and validation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:seo-sem, skill-area:content-strategy]
  roles: [role:frontend-engineer]
  topics: [topic:developer-experience]

---

# Structured Data Skill

Expert assistance for JSON-LD structured data.

## Capabilities

- Implement JSON-LD schemas
- Validate structured data
- Configure rich results
- Handle dynamic data
- Test with Google tools

## Schema Examples

```tsx
// Article
<script type="application/ld+json">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": title,
  "author": {
    "@type": "Person",
    "name": author.name
  },
  "datePublished": publishedAt,
  "image": imageUrl
})}
</script>

// Organization
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png"
}
```

## Target Processes

- structured-data-implementation
- rich-results
- seo-enhancement

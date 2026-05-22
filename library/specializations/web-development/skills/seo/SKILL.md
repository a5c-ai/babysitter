---
name: seo
description: Technical SEO, structured data, sitemaps, and meta tags.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:seo-sem, skill-area:content-strategy]
  roles: [role:frontend-engineer, role:ux-writer]
  topics: [topic:progressive-web-application]

---

# SEO Skill

Expert assistance for technical SEO implementation.

## Capabilities

- Implement meta tags
- Configure structured data
- Generate sitemaps
- Handle canonical URLs
- Optimize for search engines

## Meta Tags

```tsx
// Next.js
export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description for search results',
  openGraph: {
    title: 'OG Title',
    description: 'OG Description',
    images: [{ url: '/og-image.jpg' }],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://example.com/page',
  },
};
```

## Target Processes

- seo-optimization
- technical-seo
- search-visibility

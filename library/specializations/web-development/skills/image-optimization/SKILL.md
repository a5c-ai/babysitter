---
name: image-optimization
description: Image formats, responsive images, lazy loading, and CDN integration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:web-performance, skill-area:asset-pipeline]
  roles: [role:frontend-engineer]
  topics: [topic:asset-optimization]

---

# Image Optimization Skill

Expert assistance for image optimization.

## Capabilities

- Optimize image formats (WebP, AVIF)
- Implement responsive images
- Configure lazy loading
- Set up image CDN
- Handle blur placeholders

## Next.js Image

```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
  placeholder="blur"
  blurDataURL={blurData}
/>
```

## Responsive Images

```html
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="" loading="lazy" />
</picture>
```

## Target Processes

- image-optimization
- performance-improvement
- lcp-optimization

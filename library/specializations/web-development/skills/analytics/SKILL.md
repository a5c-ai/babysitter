---
name: analytics
description: Google Analytics 4, tag management, and event tracking.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Analytics Skill

Expert assistance for web analytics implementation.

## Capabilities

- Configure Google Analytics 4
- Implement event tracking
- Set up tag management
- Create custom events
- Handle privacy compliance

## GA4 Implementation

```typescript
// gtag.js
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export function trackEvent(action: string, category: string, label?: string) {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
  });
}

export function trackPageView(url: string) {
  window.gtag('config', GA_ID, {
    page_path: url,
  });
}
```

## Target Processes

- analytics-setup
- event-tracking
- conversion-tracking

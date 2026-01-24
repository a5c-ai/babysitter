# Lit Skill

Web Components development with Lit for building fast, lightweight, framework-agnostic components.

## Overview

This skill provides expertise in Lit, a simple library for building fast, lightweight web components that work anywhere.

## When to Use

- Building framework-agnostic components
- Creating design system primitives
- Micro-frontend architectures
- Cross-framework component libraries
- Performance-critical components

## Quick Start

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('my-element')
export class MyElement extends LitElement {
  @property() name = 'World';

  render() {
    return html`<h1>Hello, ${this.name}!</h1>`;
  }
}
```

## Key Features

| Feature | Description |
|---------|-------------|
| Web Standards | Built on Web Components |
| Reactive | Efficient updates on property changes |
| Fast | Small bundle, fast rendering |
| Interoperable | Works with any framework |

## Property Types

```typescript
@property({ type: String }) name = '';
@property({ type: Number }) count = 0;
@property({ type: Boolean }) active = false;
@property({ type: Object }) user = {};
@state() private _internal = '';
```

## Integration

Web Components work everywhere - React, Vue, Angular, or vanilla JS.

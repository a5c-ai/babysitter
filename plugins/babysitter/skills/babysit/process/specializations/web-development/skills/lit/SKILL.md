---
name: lit
description: Web Components development with Lit including custom elements, reactive properties, shadow DOM, and interoperability.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Lit Skill

Expert assistance for building Web Components with Lit.

## Capabilities

- Create Lit elements with reactive properties
- Implement shadow DOM styling
- Handle events and lifecycle callbacks
- Build composable component libraries
- Ensure framework interoperability
- Configure SSR with Lit

## Usage

Invoke this skill when you need to:
- Build framework-agnostic components
- Create design system primitives
- Implement custom elements
- Ensure cross-framework compatibility
- Build micro-frontends

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| elementName | string | Yes | Custom element name (must have hyphen) |
| properties | array | No | Reactive properties |
| shadowDom | boolean | No | Use shadow DOM (default: true) |
| typescript | boolean | No | Use TypeScript (default: true) |

## Component Patterns

### Basic Lit Element

```typescript
// src/components/user-card.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

@customElement('user-card')
export class UserCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    }

    .user-card {
      display: flex;
      gap: 1rem;
    }

    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      overflow: hidden;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .initials {
      font-weight: bold;
      font-size: 1.25rem;
    }

    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
    }

    button.primary {
      background: #3b82f6;
      color: white;
    }
  `;

  @property({ type: Object })
  user!: User;

  @property({ type: Boolean })
  editable = false;

  @state()
  private isEditing = false;

  @state()
  private editedName = '';

  private get initials() {
    return this.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  private startEditing() {
    this.editedName = this.user.name;
    this.isEditing = true;
  }

  private save() {
    this.dispatchEvent(new CustomEvent('user-updated', {
      detail: { ...this.user, name: this.editedName },
      bubbles: true,
      composed: true,
    }));
    this.isEditing = false;
  }

  private cancel() {
    this.isEditing = false;
  }

  render() {
    return html`
      <div class="user-card">
        <div class="avatar">
          ${this.user.avatar
            ? html`<img src=${this.user.avatar} alt=${this.user.name} />`
            : html`<span class="initials">${this.initials}</span>`}
        </div>

        <div class="info">
          ${this.isEditing
            ? html`
                <input
                  .value=${this.editedName}
                  @input=${(e: Event) => this.editedName = (e.target as HTMLInputElement).value}
                  @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.save()}
                />
                <button class="primary" @click=${this.save}>Save</button>
                <button @click=${this.cancel}>Cancel</button>
              `
            : html`
                <h2>${this.user.name}</h2>
                <p>${this.user.email}</p>
                ${this.editable
                  ? html`<button @click=${this.startEditing}>Edit</button>`
                  : null}
              `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'user-card': UserCard;
  }
}
```

### Reactive Controller

```typescript
// src/controllers/fetch-controller.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';

export class FetchController<T> implements ReactiveController {
  host: ReactiveControllerHost;

  data: T | null = null;
  loading = false;
  error: Error | null = null;

  private abortController: AbortController | null = null;

  constructor(host: ReactiveControllerHost, private url: string) {
    (this.host = host).addController(this);
  }

  hostConnected() {
    this.fetch();
  }

  hostDisconnected() {
    this.abortController?.abort();
  }

  async fetch() {
    this.abortController?.abort();
    this.abortController = new AbortController();

    this.loading = true;
    this.error = null;
    this.host.requestUpdate();

    try {
      const response = await fetch(this.url, {
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      this.data = await response.json();
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        this.error = e as Error;
      }
    } finally {
      this.loading = false;
      this.host.requestUpdate();
    }
  }
}

// Usage in component
@customElement('user-list')
export class UserList extends LitElement {
  private usersController = new FetchController<User[]>(this, '/api/users');

  render() {
    if (this.usersController.loading) {
      return html`<p>Loading...</p>`;
    }

    if (this.usersController.error) {
      return html`<p>Error: ${this.usersController.error.message}</p>`;
    }

    return html`
      <ul>
        ${this.usersController.data?.map(
          user => html`<li>${user.name}</li>`
        )}
      </ul>
    `;
  }
}
```

### Directive for Custom Rendering

```typescript
// src/directives/highlight.ts
import { Directive, directive, PartInfo } from 'lit/directive.js';

class HighlightDirective extends Directive {
  render(text: string, query: string) {
    if (!query) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map(part =>
      regex.test(part)
        ? document.createElement('mark').textContent = part
        : part
    );
  }
}

export const highlight = directive(HighlightDirective);

// Usage
html`<p>${highlight(text, searchQuery)}</p>`
```

### Slots and Composition

```typescript
@customElement('modal-dialog')
export class ModalDialog extends LitElement {
  static styles = css`
    :host {
      display: none;
    }

    :host([open]) {
      display: block;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dialog {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      max-width: 500px;
      width: 100%;
    }
  `;

  @property({ type: Boolean, reflect: true })
  open = false;

  private handleBackdropClick(e: Event) {
    if (e.target === e.currentTarget) {
      this.dispatchEvent(new CustomEvent('close'));
    }
  }

  render() {
    return html`
      <div class="backdrop" @click=${this.handleBackdropClick}>
        <div class="dialog" role="dialog" aria-modal="true">
          <header>
            <slot name="header"></slot>
          </header>
          <main>
            <slot></slot>
          </main>
          <footer>
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    `;
  }
}

// Usage
html`
  <modal-dialog ?open=${showModal} @close=${() => showModal = false}>
    <h2 slot="header">Confirm Action</h2>
    <p>Are you sure you want to proceed?</p>
    <div slot="footer">
      <button @click=${confirm}>Confirm</button>
      <button @click=${cancel}>Cancel</button>
    </div>
  </modal-dialog>
`
```

## Best Practices

- Use custom element naming convention (hyphenated)
- Leverage shadow DOM for encapsulation
- Use @state for internal state
- Dispatch composed events for parent communication
- Implement reactive controllers for reusable logic

## Target Processes

- web-component-library
- design-system-creation
- micro-frontend-architecture
- framework-agnostic-components

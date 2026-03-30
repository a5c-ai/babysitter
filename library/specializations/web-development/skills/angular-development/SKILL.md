---
name: angular-development
description: Angular development patterns including modules, components, services, dependency injection, signals, and enterprise architecture.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Angular Development Skill

Expert assistance for building enterprise Angular applications with modern patterns and best practices.

## Capabilities

- Create Angular components with standalone API
- Implement services with dependency injection
- Configure routing with lazy loading
- Build reactive forms and template-driven forms
- Use Angular signals for reactivity
- Set up enterprise architecture patterns

## Usage

Invoke this skill when you need to:
- Build Angular applications
- Create modular architecture
- Implement forms and validation
- Set up Angular routing
- Configure dependency injection

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| componentName | string | Yes | Component name |
| standalone | boolean | No | Use standalone components (default: true) |
| features | array | No | routing, forms, http, signals |
| style | string | No | css, scss, less |

### Configuration Example

```json
{
  "componentName": "UserProfile",
  "standalone": true,
  "features": ["signals", "forms"],
  "style": "scss"
}
```

## Component Patterns

### Standalone Component with Signals

```typescript
// components/user-profile.component.ts
import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-profile">
      <div class="avatar">
        {{ initials() }}
      </div>

      @if (isEditing()) {
        <input [(ngModel)]="editedName" />
        <button (click)="save()">Save</button>
        <button (click)="cancel()">Cancel</button>
      } @else {
        <h2>{{ user().name }}</h2>
        <p>{{ user().email }}</p>
        @if (editable()) {
          <button (click)="edit()">Edit</button>
        }
      }
    </div>
  `,
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent {
  // Input signals
  user = input.required<User>();
  editable = input(false);

  // Output
  updated = output<User>();

  // Internal signals
  isEditing = signal(false);
  editedName = signal('');

  // Computed
  initials = computed(() => {
    return this.user()
      .name.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  });

  edit() {
    this.editedName.set(this.user().name);
    this.isEditing.set(true);
  }

  save() {
    this.updated.emit({ ...this.user(), name: this.editedName() });
    this.isEditing.set(false);
  }

  cancel() {
    this.isEditing.set(false);
  }
}
```

### Service with Dependency Injection

```typescript
// services/user.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';

interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = '/api/users';

  // Signal-based state
  private _users = signal<User[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  users = this._users.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  async fetchUsers() {
    this._loading.set(true);
    this._error.set(null);

    this.http
      .get<User[]>(this.apiUrl)
      .pipe(
        catchError((err) => {
          this._error.set(err.message);
          return of([]);
        })
      )
      .subscribe((users) => {
        this._users.set(users);
        this._loading.set(false);
      });
  }

  async createUser(data: Omit<User, 'id'>) {
    return this.http.post<User>(this.apiUrl, data).pipe(
      map((user) => {
        this._users.update((users) => [...users, user]);
        return user;
      })
    );
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, data).pipe(
      map((updated) => {
        this._users.update((users) =>
          users.map((u) => (u.id === id ? updated : u))
        );
        return updated;
      })
    );
  }
}
```

### Reactive Forms

```typescript
// components/user-form.component.ts
import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label for="name">Name</label>
        <input id="name" formControlName="name" />
        @if (form.get('name')?.errors?.['required'] && form.get('name')?.touched) {
          <span class="error">Name is required</span>
        }
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" type="email" formControlName="email" />
        @if (form.get('email')?.errors?.['email'] && form.get('email')?.touched) {
          <span class="error">Invalid email format</span>
        }
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input id="password" type="password" formControlName="password" />
        @if (form.get('password')?.errors?.['minlength'] && form.get('password')?.touched) {
          <span class="error">Password must be at least 8 characters</span>
        }
      </div>

      <button type="submit" [disabled]="form.invalid">Submit</button>
    </form>
  `,
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  submitted = output<{ name: string; email: string; password: string }>();

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit() {
    if (this.form.valid) {
      this.submitted.emit(this.form.value);
    }
  }
}
```

### Routing Configuration

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];

// guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
```

## Best Practices

- Use standalone components by default
- Leverage signals for reactive state
- Implement lazy loading for routes
- Use reactive forms for complex forms
- Apply dependency injection patterns

## Target Processes

- angular-enterprise-development
- frontend-architecture-design
- form-validation-implementation
- state-management-setup

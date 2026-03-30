---
name: Mobile Offline Storage
description: Cross-platform offline-first data management
version: 1.0.0
category: Data Persistence
slug: offline-storage
status: active
---

# Mobile Offline Storage Skill

## Overview

This skill provides cross-platform offline-first data management capabilities. It enables configuration of WatermelonDB, Realm, MMKV, and other offline storage solutions with sync queue architectures.

## Allowed Tools

- `bash` - Execute package managers and build tools
- `read` - Analyze storage configurations and schemas
- `write` - Generate models and sync logic
- `edit` - Update storage implementations
- `glob` - Search for storage files
- `grep` - Search for patterns

## Capabilities

### WatermelonDB (React Native)

1. **Schema Definition**
   - Define table schemas
   - Configure column types
   - Set up relations
   - Handle migrations

2. **Sync Engine**
   - Implement sync adapters
   - Handle conflict resolution
   - Configure batch operations
   - Manage sync state

### Realm (Cross-Platform)

3. **Object Schemas**
   - Define Realm objects
   - Configure primary keys
   - Set up relationships
   - Handle embedded objects

4. **Realm Sync**
   - Configure Device Sync
   - Handle flexible sync
   - Manage subscriptions
   - Handle conflicts

### MMKV

5. **Key-Value Storage**
   - Configure MMKV instances
   - Handle encryption
   - Implement migrations
   - Manage namespaces

### Sync Architecture

6. **Offline-First Patterns**
   - Design sync queues
   - Handle network state
   - Implement retry logic
   - Manage pending operations

7. **Conflict Resolution**
   - Last-write-wins strategy
   - Merge strategies
   - User resolution UI
   - Audit logging

## Target Processes

- `offline-first-architecture.js` - Offline patterns
- `rest-api-integration.js` - API sync
- `graphql-apollo-integration.js` - GraphQL sync

## Dependencies

- WatermelonDB (React Native)
- Realm SDK
- MMKV
- SQLite

## Usage Examples

### WatermelonDB Schema

```typescript
// database/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'posts',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'is_published', type: 'boolean' },
        { name: 'author_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'comments',
      columns: [
        { name: 'body', type: 'string' },
        { name: 'post_id', type: 'string', isIndexed: true },
        { name: 'author_id', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
```

### WatermelonDB Model

```typescript
// database/models/Post.ts
import { Model, Q } from '@nozbe/watermelondb';
import { field, date, children, relation } from '@nozbe/watermelondb/decorators';

export class Post extends Model {
  static table = 'posts';

  static associations = {
    comments: { type: 'has_many', foreignKey: 'post_id' },
    author: { type: 'belongs_to', key: 'author_id' },
  };

  @field('title') title!: string;
  @field('body') body!: string;
  @field('is_published') isPublished!: boolean;
  @field('author_id') authorId!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('comments') comments!: Query<Comment>;
  @relation('users', 'author_id') author!: Relation<User>;
}
```

### Sync Queue Implementation

```typescript
// sync/SyncQueue.ts
interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

class SyncQueue {
  private queue: SyncOperation[] = [];
  private isProcessing = false;

  async enqueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>) {
    const op: SyncOperation = {
      ...operation,
      id: uuid(),
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.queue.push(op);
    await this.persistQueue();
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    const isOnline = await NetInfo.fetch().then(state => state.isConnected);
    if (!isOnline) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const operation = this.queue[0];
      try {
        await this.executeOperation(operation);
        this.queue.shift();
        await this.persistQueue();
      } catch (error) {
        operation.retryCount++;
        if (operation.retryCount >= 3) {
          this.queue.shift();
          await this.logFailedOperation(operation, error);
        }
        break;
      }
    }

    this.isProcessing = false;
  }

  private async executeOperation(operation: SyncOperation) {
    switch (operation.type) {
      case 'create':
        return api.post(`/${operation.entity}`, operation.payload);
      case 'update':
        return api.put(`/${operation.entity}/${operation.payload.id}`, operation.payload);
      case 'delete':
        return api.delete(`/${operation.entity}/${operation.payload.id}`);
    }
  }
}
```

## Quality Gates

- Data integrity verified on sync
- Conflict resolution tested
- Offline functionality verified
- Migration tests passing

## Related Skills

- `ios-persistence` - iOS Core Data
- `android-room` - Android Room
- `graphql-mobile` - GraphQL offline

## Version History

- 1.0.0 - Initial release

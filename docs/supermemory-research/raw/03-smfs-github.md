# SMFS GitHub Repository

Source: https://github.com/supermemoryai/smfs

## Core Concept

SMFS is a filesystem designed to expose Supermemory containers as accessible directories. "Your Supermemory container, exposed as a filesystem" with capabilities for reading, writing, and searching memory like a local directory.

## Dual Access Architectures

### Local Mount

Mounts as a real directory on systems with kernel filesystem support (macOS, Linux, devcontainers, Docker, microVMs). Editors and standard Unix tools work transparently.

### Virtual Bash Tool

For serverless and edge environments lacking local filesystems, a TypeScript package (`@supermemory/bash`) provides the same functionality as a pluggable agent tool without requiring actual filesystem mounting.

## Installation

```bash
curl -fsSL https://smfs.ai/install | bash
```

Supports macOS and Linux (both arm64 and x64). Requires a Supermemory API key.

## Core Commands

- `smfs mount <tag>` -- mounts a container as a directory
- `smfs grep "query"` -- semantic search without flags; literal grep with any flag
- `smfs login` -- one-time credential storage
- `smfs unmount <tag>` -- unmount and drain pending writes

## Memory Path Configuration

Only files under designated "memory paths" undergo Supermemory's processing pipeline for semantic indexing. The `--memory-paths` flag allows configuration:

```bash
smfs mount agent_memory --memory-paths "/notes/,/journal.md,/work/"
smfs mount agent_memory --memory-paths ""  # disables processing
```

Trailing slash = match any file inside that folder recursively. No trailing slash = exact file match.

## Backend Implementation

- **FUSE**: Linux containers and systems; requires `/dev/fuse` device and `SYS_ADMIN` capability
- **NFS**: Default on macOS hosts; doesn't apply within Linux containers

## Synchronization Behavior

Local changes upload asynchronously; remote changes sync every 30 seconds by default. `--sync-interval` adjusts pull timing; `--no-sync` disables pulling while preserving uploads.

## Virtual Bash Tool Usage

```typescript
import { createBash } from "@supermemory/bash";

const { bash } = await createBash({
  apiKey: process.env.SUPERMEMORY_API_KEY!,
  containerTag: "user_42",
});

await bash.exec("echo 'hello' > /a.md && cat /a.md");
await bash.exec("sgrep 'authentication tokens'");
```

## Docker Deployment

FUSE-enabled Docker runs require: `--device /dev/fuse --cap-add SYS_ADMIN`

## Technical Stack

Rust (40.9%), Python (40.4%), TypeScript (18.1%). Rust 1.80+ required for source builds.

## License

MIT

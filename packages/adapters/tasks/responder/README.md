# Responder Profile System

This directory contains packaged responder profile examples for `@a5c-ai/tasks-adapter`.

## Schema

Each profile is a JSON file that conforms to the `ResponderProfile` schema defined in the package runtime. The JSON Schema equivalent is provided in `schema.json`.

### Required Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier for the responder. |
| `name` | `string` | Display name shown in CLI and API responses. |
| `title` | `string` | Professional title or role. |
| `domains` | `string[]` | High-level domains used for routing. |
| `tags` | `string[]` | Keywords, tools, and specialties used for matching. |
| `availability` | `boolean` | Whether the responder is available for routing. |
| `responseTimeSla` | `number` | Expected maximum response time in milliseconds. |

### Optional Fields

| Field | Type | Description |
|---|---|---|
| `publicKeyFingerprint` | `string` | Fingerprint for provenance-aware responder flows. |

## How to Use

1. Copy one of the example JSON files into your repo's `.a5c/responder/` directory.
2. Rename the file to match your responder ID if needed.
3. Adjust the `domains`, `tags`, and availability fields to reflect the responder's actual coverage.
4. Validate the result with `bmux responders show <id>` or the exported profile-validator helpers.

## Matching Notes

The runtime matcher uses:

- `domains` for broad routing relevance
- `tags` for narrower keyword matches
- `availability` to exclude offline responders

The examples in this directory are covered by regression tests and should always remain valid as shipped.

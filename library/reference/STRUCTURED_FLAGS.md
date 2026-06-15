# Structured flags over string-prefix sniffs

**Status:** Guideline · **Audience:** process authors, skill authors, any agent that conditions UI on upstream state

## TL;DR

For UI conditionals that depend on upstream state — banners, mode toggles, feature flags, fallback branches — prefer a dedicated structured field on the record (a boolean, an enum, a nullable string) over matching a text prefix in a free-form field like `description`, `message`, or `error`. String-prefix sniffs rot the moment a different code path writes the same field with different wording. If the flag matters, name it.

## The failure mode

A motivating incident, from a real retrospect:

1. The URL import endpoint fails gracefully when the upstream site serves a cookie wall. The server writes a synthetic draft with `description = "We couldn't read the recipe at <url>..."` and redirects to the review editor.
2. The review editor needs to show a prominent "Couldn't auto-import" banner with a "Try paste instead" action.
3. The banner visibility check was: `description.startsWith("We couldn't read the recipe")`.
4. Two weeks later, a different code path — Claude's parse-failure catch-all — writes a draft with `description = "Recipe could not be fetched from <url>..."`. Functionally identical outcome; semantically different prefix. The banner doesn't fire. The user lands on the same broken UX the banner was supposed to warn them about.

The fix was to add `sourceMeta.fallbackReason: string | null` — a dedicated structured flag written by every code path that produces a fallback draft — and switch the banner check to `sourceMeta.fallbackReason != null`.

## The rule

When you are about to write `field.startsWith("magic string")` or `field.includes("magic string")` in a UI conditional or process decision, stop and add a structured flag instead.

Structured flags:
- are **explicit** — they're in the schema / type definition, visible to anyone reading the record
- are **testable** — you can assert `fallbackReason === "blocked-page"` without caring about display wording
- are **stable** — changing the user-facing copy doesn't break downstream logic
- **survive refactors** — when someone moves the code that sets the flag, a type error tells you what to update

String-prefix sniffs:
- are **invisible** to anyone who doesn't search the whole codebase for the prefix
- are **entangled with display logic** — changing the copy changes the behaviour
- **rot silently** when a new code path writes the same field with different wording

## Exceptions where a sniff is acceptable

- **Parsing a third-party message you don't control** — e.g. detecting `"rate limit exceeded"` in an upstream error string before you've had time to add your own flag. Treat this as a patch, not a target state.
- **One-shot migrations** — detecting legacy records to upgrade them to a new structured field. Delete the sniff after the migration.
- **Reading logs** — grep is the whole point.

## How to apply this in a process

When a process task sets a record that downstream UI will read:

```javascript
// ❌ Avoid — relies on downstream code sniffing the description
await saveDraft({ description: "We couldn't read the recipe at " + url });

// ✅ Prefer — explicit named flag + informative description
await saveDraft({
  description: "We couldn't read the recipe at " + url,
  sourceMeta: { fallbackReason: 'blocked-page' },
});
```

When a downstream UI reads the record:

```tsx
// ❌ Avoid
const showFallbackBanner = description?.startsWith("We couldn't read the recipe");

// ✅ Prefer
const showFallbackBanner = Boolean(sourceMeta?.fallbackReason);
```

## Applying this when you write or review a process

Review checklist:
- Does any task in this process set a description/message/error field that a later task or downstream UI will condition on?
- If yes, does that record also have a structured flag for the condition?
- If no structured flag exists, add one to the schema before shipping the conditional.

## See also

- `reference/ADVANCED_PATTERNS.md` — broader patterns for inter-task state
- `reference/ORCHESTRATION_GUIDE.md` — how tasks share state via result payloads

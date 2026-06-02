"use client";

import type { KeyboardEvent, ReactNode, TextareaHTMLAttributes } from "react";
import type { KanbanTaskTag } from "@a5c-ai/agent-mux-comm/kanban";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cx } from "@a5c-ai/compendium";

interface ActiveQuery {
  readonly start: number;
  readonly end: number;
  readonly query: string;
}

interface TaskTagAutocompleteTextareaProps {
  value: string;
  onValueChange: (value: string) => void;
  taskTags: readonly KanbanTaskTag[];
  disabled?: boolean;
  className?: string;
  emptyText?: string;
  renderTextarea?: (
    props: TextareaHTMLAttributes<HTMLTextAreaElement>,
  ) => ReactNode;
}

// Live Slice 4 authoring entry points:
// - board issue summary in backlog-overview
// - sub-issue summary in backlog-overview
// - new session prompt in app/sessions/new
// - follow-up prompt in app/sessions/[sessionId]

function findActiveQuery(value: string, selectionStart: number | null): ActiveQuery | null {
  if (selectionStart == null) {
    return null;
  }

  const prefix = value.slice(0, selectionStart);
  const triggerIndex = prefix.lastIndexOf("@");

  if (triggerIndex < 0) {
    return null;
  }

  const beforeTrigger = triggerIndex === 0 ? "" : prefix.slice(triggerIndex - 1, triggerIndex);
  if (beforeTrigger && /[A-Za-z0-9_]/.test(beforeTrigger)) {
    return null;
  }

  const query = prefix.slice(triggerIndex + 1);
  if (query.includes("@") || /\s/.test(query)) {
    return null;
  }

  return {
    start: triggerIndex,
    end: selectionStart,
    query,
  };
}

function filterTaskTags(taskTags: readonly KanbanTaskTag[], query: string): readonly KanbanTaskTag[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return taskTags;
  }

  return taskTags.filter((taskTag) => {
    const key = taskTag.key.toLowerCase();
    const label = taskTag.label.toLowerCase();
    return key.includes(normalizedQuery) || label.includes(normalizedQuery);
  });
}

export function TaskTagAutocompleteTextarea({
  value,
  onValueChange,
  taskTags,
  disabled = false,
  className,
  emptyText = "No matching Task Tags.",
  renderTextarea,
}: TaskTagAutocompleteTextareaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeQuery, setActiveQuery] = useState<ActiveQuery | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listboxId = useId();

  const matches = useMemo(
    () => (activeQuery ? filterTaskTags(taskTags, activeQuery.query) : []),
    [activeQuery, taskTags],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeQuery?.query]);

  function getTextarea(): HTMLTextAreaElement | null {
    return containerRef.current?.querySelector("textarea") ?? null;
  }

  function syncActiveQuery(selectionStart: number | null) {
    setActiveQuery(findActiveQuery(value, selectionStart));
  }

  function selectTaskTag(taskTag: KanbanTaskTag) {
    if (!activeQuery) {
      return;
    }

    const nextValue =
      value.slice(0, activeQuery.start) + taskTag.content + value.slice(activeQuery.end);

    onValueChange(nextValue);
    setActiveQuery(null);
    setSelectedIndex(0);

    queueMicrotask(() => {
      const textarea = getTextarea();
      if (!textarea) {
        return;
      }
      const nextCursor = activeQuery.start + taskTag.content.length;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!activeQuery) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setActiveQuery(null);
      return;
    }

    if (matches.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      setSelectedIndex((current) => (current + 1) % matches.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setSelectedIndex((current) => (current - 1 + matches.length) % matches.length);
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      selectTaskTag(matches[selectedIndex] ?? matches[0]!);
    }
  }

  const activeDescendant =
    activeQuery && matches.length > 0 ? `${listboxId}-option-${selectedIndex}` : undefined;

  const textareaProps: TextareaHTMLAttributes<HTMLTextAreaElement> = {
    value,
    disabled,
    onChange: (event) => {
      onValueChange(event.currentTarget.value);
      setActiveQuery(findActiveQuery(event.currentTarget.value, event.currentTarget.selectionStart));
    },
    onClick: (event) => {
      syncActiveQuery(event.currentTarget.selectionStart);
    },
    onBlur: () => {
      queueMicrotask(() => {
        if (!containerRef.current?.contains(document.activeElement)) {
          setActiveQuery(null);
        }
      });
    },
    onKeyDown: handleKeyDown,
    onKeyUp: (event) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === "Tab" ||
        event.key === "Escape"
      ) {
        return;
      }
      syncActiveQuery(event.currentTarget.selectionStart);
    },
    onSelect: (event) => {
      syncActiveQuery(event.currentTarget.selectionStart);
    },
    "aria-autocomplete": "list",
    "aria-controls": activeQuery ? listboxId : undefined,
    "aria-expanded": activeQuery ? true : undefined,
    "aria-activedescendant": activeDescendant,
  };

  return (
    <div className={cx("relative", className)} ref={containerRef}>
      {renderTextarea ? renderTextarea(textareaProps) : <textarea {...textareaProps} />}
      {activeQuery ? (
        <div
          className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        >
          {matches.length > 0 ? (
            <ul id={listboxId} role="listbox" className="max-h-64 overflow-y-auto py-2">
              {matches.map((taskTag, index) => (
                <li
                  key={taskTag.id}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={cx(
                    "cursor-pointer px-4 py-3 transition-colors",
                    index === selectedIndex ? "bg-primary/10" : "hover:bg-background/70",
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectTaskTag(taskTag);
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground">{taskTag.label}</span>
                    <span className="font-mono text-xs text-foreground-muted">@{taskTag.key}</span>
                  </div>
                  {taskTag.description ? (
                    <p className="mt-1 text-xs text-foreground-muted">{taskTag.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-foreground-muted">{emptyText}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

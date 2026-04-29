"use client";

import { useEffect, useState } from "react";
import type { KanbanTaskTag } from "@a5c-ai/agent-mux-core/kanban";

import { loadTaskTags } from "./use-backlog";

export function useTaskTags() {
  const [taskTags, setTaskTags] = useState<readonly KanbanTaskTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadTaskTags()
      .then((nextTaskTags) => {
        if (cancelled) {
          return;
        }
        setTaskTags(nextTaskTags);
        setError(null);
      })
      .catch((cause) => {
        if (cancelled) {
          return;
        }
        setTaskTags([]);
        setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    taskTags,
    loading,
    error,
  };
}

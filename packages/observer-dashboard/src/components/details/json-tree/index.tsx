"use client";

import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TaskDetail } from "@/types";

import { JsonTreeView } from "./json-node";
import { categorizeData } from "./categorize";
import { DataToggle } from "./tree-controls";
import {
  AtAGlanceHeader,
  BooleanFlagsGrid,
  FindingsSection,
  SummaryBlock,
  MetadataGrid,
  CollapsibleRawJson,
} from "./smart-summary";

/* ------------------------------------------------------------------ */
/*  JsonTree -- Smart Data View (main export)                           */
/* ------------------------------------------------------------------ */

export function JsonTree({ task }: { task: TaskDetail | null }) {
  const [showInput, setShowInput] = useState(true);

  const activeData = showInput ? task?.input : task?.result;

  const categorized = useMemo(
    () => categorizeData(activeData),
    [activeData]
  );

  if (!task) {
    return (
      <div className="p-4 text-sm text-foreground-muted">
        Select a task to view data
      </div>
    );
  }

  const hasData = task.input || task.result;
  if (!hasData) {
    return (
      <div className="p-4 text-sm text-foreground-muted">
        No I/O data for this task
      </div>
    );
  }

  const isPrimitive =
    activeData === null ||
    activeData === undefined ||
    typeof activeData !== "object" ||
    Array.isArray(activeData);

  return (
    <div className="p-4">
      {/* 1. Input/Output Toggle */}
      <DataToggle showInput={showInput} onToggle={setShowInput} />

      <ScrollArea>
        {isPrimitive ? (
          /* For non-object data, just show the raw tree */
          <div className="rounded-md bg-background-secondary p-3">
            <JsonTreeView data={activeData} />
          </div>
        ) : (
          <div className="space-y-3">
            {/* 2. At-a-Glance Header Bar */}
            <AtAGlanceHeader
              status={categorized.status}
              score={categorized.score}
              passesQuality={categorized.passesQuality}
              taskId={categorized.taskId}
            />

            {/* 3. Boolean Flags Grid */}
            <BooleanFlagsGrid booleans={categorized.booleans} />

            {/* 4. Findings / Issues Section */}
            <FindingsSection findings={categorized.findings} />

            {/* 5. Summary Block */}
            {categorized.summary && (
              <SummaryBlock summary={categorized.summary} />
            )}

            {/* 6. Metadata Section */}
            <MetadataGrid metadata={categorized.metadata} />

            {/* 7. Collapsible Raw JSON */}
            <CollapsibleRawJson data={activeData} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Re-exports for backward compatibility                               */
/* ------------------------------------------------------------------ */

export { JsonTreeView } from "./json-node";
export { CopyButton, JsonNode } from "./json-node";
export { categorizeData, FINDINGS_KEYS, formatLabel, isRecord } from "./categorize";
export type { CategorizedData } from "./categorize";
export {
  StatusPill,
  ScoreBar,
  QualityBadge,
  AtAGlanceHeader,
  BooleanFlagsGrid,
  FindingsSection,
  SummaryBlock,
  MetadataGrid,
  CollapsibleRawJson,
  SmartSectionHeader,
} from "./smart-summary";
export { DataToggle } from "./tree-controls";

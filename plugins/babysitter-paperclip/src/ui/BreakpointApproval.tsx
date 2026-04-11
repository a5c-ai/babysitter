/**
 * Breakpoint approval/rejection UI component.
 *
 * Renders the breakpoint details with approve/reject actions.
 * Critical: both approve and reject use --status ok with the babysitter CLI.
 * Rejection sends { approved: false, feedback: "..." }.
 */

import { useState } from "react";
import { usePluginAction } from "@paperclipai/plugin-sdk/ui";

interface BreakpointApprovalProps {
  runId: string;
  effectId: string;
  title: string;
  /** The breakpoint question from task.json metadata.payload.question */
  question?: string;
  description?: string;
  /** Explicit options from the process (e.g., ["Approve", "Request changes"]) */
  options?: string[];
  /** Domain expert routing from breakpoint routing fields */
  expert?: string | string[];
  /** Tags for categorization */
  tags?: string[];
  /** Previous rejection feedback (shown on retry) */
  previousFeedback?: string;
  /** Current retry attempt number */
  attempt?: number;
  companyId: string;
  onResolved?: () => void;
}

export function BreakpointApproval({
  runId,
  effectId,
  title,
  question,
  description,
  options,
  expert,
  tags,
  previousFeedback,
  attempt,
  companyId,
  onResolved,
}: BreakpointApprovalProps) {
  const approve = usePluginAction("approve-breakpoint");
  const reject = usePluginAction("reject-breakpoint");

  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  async function handleApprove(response?: string) {
    setSubmitting(true);
    setError(null);
    try {
      await approve({ runId, effectId, response, companyId });
      setResolved(true);
      onResolved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!feedback.trim()) {
      setError("Feedback is required when rejecting a breakpoint");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reject({ runId, effectId, feedback: feedback.trim(), companyId });
      setResolved(true);
      onResolved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (resolved) {
    return (
      <div style={{ padding: 12, background: "var(--muted)", borderRadius: 6 }}>
        Breakpoint resolved.
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <strong>{question ?? title}</strong>
        {description && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted-foreground)" }}>
            {description}
          </p>
        )}
        {/* Show retry context when this is a re-ask after rejection */}
        {previousFeedback && (
          <div
            style={{
              marginTop: 8,
              padding: "6px 10px",
              background: "var(--destructive)",
              color: "var(--destructive-foreground)",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            Previous feedback (attempt {attempt ?? "?"}): {previousFeedback}
          </div>
        )}
        {/* Show routing info */}
        {(expert || (tags && tags.length > 0)) && (
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--muted-foreground)" }}>
            {expert && (
              <span>
                Expert: {Array.isArray(expert) ? expert.join(", ") : expert}
              </span>
            )}
            {tags && tags.length > 0 && (
              <span style={{ marginLeft: expert ? 12 : 0 }}>
                Tags: {tags.join(", ")}
              </span>
            )}
          </div>
        )}
      </div>

      {options && options.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleApprove(opt)}
              disabled={submitting}
              style={{ fontSize: 13 }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: 8 }}>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback (required for rejection)..."
          rows={2}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid var(--border)",
            resize: "vertical",
            fontSize: 13,
          }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={handleReject}
            disabled={submitting}
            style={{
              background: "var(--destructive)",
              color: "var(--destructive-foreground)",
              padding: "6px 16px",
              borderRadius: 4,
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "..." : "Reject"}
          </button>
          <button
            onClick={() => handleApprove(feedback || undefined)}
            disabled={submitting}
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              padding: "6px 16px",
              borderRadius: 4,
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "..." : "Approve"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--destructive)", fontSize: 12 }}>{error}</div>
      )}
    </div>
  );
}

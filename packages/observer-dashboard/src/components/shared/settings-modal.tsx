"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Settings,
  FolderOpen,
  Timer,
  Palette,
  Plus,
  Trash2,
  Loader2,
  Check,
  CalendarDays,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { resilientFetch } from "@/lib/fetcher";
import { useTheme } from "@/components/shared/theme-provider";

interface WatchSource {
  path: string;
  depth: number;
  label?: string;
}

interface ConfigData {
  sources: WatchSource[];
  port: number;
  pollInterval: number;
  theme: "dark" | "light";
  retentionDays: number;
  hiddenProjects: string[];
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { theme: currentTheme, toggle: toggleTheme } = useTheme();

  // Server config (fetched on open)
  const [serverConfig, setServerConfig] = useState<ConfigData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Editable state
  const [sources, setSources] = useState<WatchSource[]>([]);
  const [pollInterval, setPollInterval] = useState(2000);
  const [selectedTheme, setSelectedTheme] = useState<"dark" | "light">("dark");
  const [retentionDays, setRetentionDays] = useState(30);
  const [hiddenProjects, setHiddenProjects] = useState<string[]>([]);

  // Discovered project names (fetched from API)
  const [allProjectNames, setAllProjectNames] = useState<string[]>([]);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Abort controllers for config fetch and save
  const fetchAbortRef = useRef<AbortController | null>(null);
  const saveAbortRef = useRef<AbortController | null>(null);

  // Fetch config on open
  useEffect(() => {
    if (!open) return;
    setFetchLoading(true);
    setFetchError(null);
    setSaveResult(null);
    setSaveError(null);

    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    const signal = fetchAbortRef.current.signal;

    // Fetch config and project names in parallel
    Promise.all([
      resilientFetch<ConfigData>("/api/config", { signal }),
      resilientFetch<{ projects: { projectName: string }[] }>("/api/runs?mode=projects", { signal }),
    ])
      .then(([configResult, projectsResult]) => {
        if (!configResult.ok) {
          if (configResult.error.isAborted) return;
          setFetchError(configResult.error.message);
          return;
        }
        const data = configResult.data;
        setServerConfig(data);
        setSources(data.sources.map((s) => ({ ...s })));
        setPollInterval(data.pollInterval);
        setSelectedTheme(data.theme);
        setRetentionDays(data.retentionDays);
        setHiddenProjects(data.hiddenProjects ?? []);

        // Build full project list: visible projects from API + currently hidden projects from config
        const visibleNames = projectsResult.ok
          ? projectsResult.data.projects.map((p) => p.projectName)
          : [];
        const hiddenNames = data.hiddenProjects ?? [];
        const combined = Array.from(new Set([...visibleNames, ...hiddenNames])).sort();
        setAllProjectNames(combined);
      })
      .finally(() => setFetchLoading(false));

    return () => {
      fetchAbortRef.current?.abort();
      saveAbortRef.current?.abort();
    };
  }, [open]);

  // Source row handlers
  const updateSource = useCallback(
    (index: number, field: keyof WatchSource, value: string | number) => {
      setSources((prev) =>
        prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const removeSource = useCallback((index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addSource = useCallback(() => {
    setSources((prev) => [...prev, { path: "", depth: 2 }]);
  }, []);

  // Cancel - revert to fetched config
  const handleCancel = useCallback(() => {
    if (serverConfig) {
      setSources(serverConfig.sources.map((s) => ({ ...s })));
      setPollInterval(serverConfig.pollInterval);
      setSelectedTheme(serverConfig.theme);
      setRetentionDays(serverConfig.retentionDays);
      setHiddenProjects(serverConfig.hiddenProjects ?? []);
    }
    setSaveResult(null);
    setSaveError(null);
  }, [serverConfig]);

  // Save
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveResult(null);
    setSaveError(null);

    saveAbortRef.current?.abort();
    saveAbortRef.current = new AbortController();

    const result = await resilientFetch<ConfigData>("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sources: sources.filter((s) => s.path.trim()),
        pollInterval,
        theme: selectedTheme,
        retentionDays,
        hiddenProjects,
      }),
      signal: saveAbortRef.current.signal,
    });

    if (!result.ok) {
      if (result.error.isAborted) return;
      setSaveResult("error");
      setSaveError(result.error.message);
      setSaving(false);
      return;
    }

    const saved = result.data;
    setServerConfig(saved);
    setSources(saved.sources.map((s) => ({ ...s })));
    setPollInterval(saved.pollInterval);
    setSelectedTheme(saved.theme);
    setRetentionDays(saved.retentionDays);
    setHiddenProjects(saved.hiddenProjects ?? []);
    setSaveResult("success");

    // Apply theme change locally if it changed
    if (saved.theme !== currentTheme) {
      toggleTheme();
    }

    // Auto-dismiss success after 2s
    setTimeout(() => setSaveResult(null), 2000);
    setSaving(false);
  }, [sources, pollInterval, selectedTheme, retentionDays, hiddenProjects, currentTheme, toggleTheme]);

  const hasChanges =
    serverConfig &&
    (JSON.stringify(sources) !==
      JSON.stringify(serverConfig.sources) ||
      pollInterval !== serverConfig.pollInterval ||
      selectedTheme !== serverConfig.theme ||
      retentionDays !== serverConfig.retentionDays ||
      JSON.stringify(hiddenProjects.slice().sort()) !==
        JSON.stringify((serverConfig.hiddenProjects ?? []).slice().sort()));

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          data-testid="settings-modal"
        >
          <div className="relative z-50 rounded-lg border border-border bg-card shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-foreground-muted" />
                <Dialog.Title className="text-sm font-medium text-foreground">Settings</Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Body */}
            <Dialog.Description asChild>
              <div className="flex-1 overflow-y-auto p-4">
                {fetchLoading ? (
                  <div className="flex items-center justify-center py-12 text-foreground-muted">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <p className="text-sm">Loading configuration...</p>
                  </div>
                ) : fetchError ? (
                  <div className="rounded-lg border border-error/20 bg-error-muted p-3 text-sm text-error">
                    Failed to load config: {fetchError}
                  </div>
                ) : serverConfig ? (
                  <div className="space-y-5">
                    {/* Watch Sources */}
                    <section>
                      <div className="flex items-center gap-2 mb-2">
                        <FolderOpen className="h-4 w-4 text-foreground-muted" />
                        <span className="text-xs font-medium text-foreground-secondary">
                          Watch Sources
                        </span>
                      </div>
                      <div className="space-y-2">
                        {sources.map((source, i) => (
                          <div
                            key={i}
                            className="rounded-md border border-border bg-background p-2.5 space-y-2"
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1">
                                <label className="text-xs uppercase tracking-wider text-foreground-muted mb-1 block">
                                  Path
                                </label>
                                <input
                                  type="text"
                                  value={source.path}
                                  onChange={(e) =>
                                    updateSource(i, "path", e.target.value)
                                  }
                                  placeholder="/path/to/projects"
                                  className="w-full rounded-md border border-border bg-background-secondary px-2.5 py-1.5 font-mono text-xs text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                                />
                              </div>
                              <button
                                onClick={() => removeSource(i)}
                                className="mt-4 rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground-muted hover:text-error hover:bg-error/10 transition-colors"
                                title="Remove source"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-20">
                                <label className="text-xs uppercase tracking-wider text-foreground-muted mb-1 block">
                                  Depth
                                </label>
                                <input
                                  type="number"
                                  value={source.depth}
                                  onChange={(e) =>
                                    updateSource(
                                      i,
                                      "depth",
                                      Math.max(0, Math.min(10, parseInt(e.target.value) || 0))
                                    )
                                  }
                                  min={0}
                                  max={10}
                                  className="w-full rounded-md border border-border bg-background-secondary px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={addSource}
                        className="mt-2 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 min-h-[44px] text-xs text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Source
                      </button>
                    </section>

                    {/* Poll Interval */}
                    <section>
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="h-4 w-4 text-foreground-muted" />
                        <span className="text-xs font-medium text-foreground-secondary">
                          Poll Interval
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={pollInterval}
                          onChange={(e) =>
                            setPollInterval(
                              Math.max(500, parseInt(e.target.value) || 500)
                            )
                          }
                          min={500}
                          step={500}
                          className="w-28 rounded-md border border-border bg-background-secondary px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <span className="text-xs text-foreground-muted">ms</span>
                      </div>
                    </section>

                    {/* Theme */}
                    <section>
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="h-4 w-4 text-foreground-muted" />
                        <span className="text-xs font-medium text-foreground-secondary">
                          Theme
                        </span>
                      </div>
                      <div className="flex rounded-md border border-border overflow-hidden">
                        {(["dark", "light"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTheme(t)}
                            className={cn(
                              "flex-1 px-4 py-1.5 min-h-[44px] text-xs font-medium transition-colors capitalize",
                              selectedTheme === t
                                ? "bg-primary/15 text-primary"
                                : "bg-background-secondary text-foreground-muted hover:text-foreground"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Retention Window */}
                    <section>
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="h-4 w-4 text-foreground-muted" />
                        <span className="text-xs font-medium text-foreground-secondary">
                          Run Retention
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground-muted">Show runs from the last</span>
                        <input
                          type="number"
                          value={retentionDays}
                          onChange={(e) =>
                            setRetentionDays(
                              Math.max(1, Math.min(365, parseInt(e.target.value) || 30))
                            )
                          }
                          min={1}
                          max={365}
                          className="w-20 rounded-md border border-border bg-background-secondary px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <span className="text-xs text-foreground-muted">days</span>
                      </div>
                      <p className="text-xs text-foreground-muted mt-1.5">
                        Older completed/failed runs are hidden from the dashboard. Active runs are always shown.
                      </p>
                    </section>

                    {/* Project Visibility */}
                    {allProjectNames.length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="h-4 w-4 text-foreground-muted" />
                          <span className="text-xs font-medium text-foreground-secondary">
                            Project Visibility
                          </span>
                        </div>
                        <p className="text-xs text-foreground-muted mb-2">
                          Hidden projects will not appear on the dashboard.
                        </p>
                        <div className="space-y-1">
                          {allProjectNames.map((name) => {
                            const isHidden = hiddenProjects.includes(name);
                            return (
                              <div
                                key={name}
                                className="flex items-center justify-between rounded-md border border-border bg-background px-2.5 py-1.5"
                              >
                                <span className={cn(
                                  "text-xs font-mono truncate",
                                  isHidden ? "text-foreground-muted line-through" : "text-foreground"
                                )}>
                                  {name}
                                </span>
                                <button
                                  onClick={() => {
                                    setHiddenProjects((prev) =>
                                      isHidden
                                        ? prev.filter((p) => p !== name)
                                        : [...prev, name]
                                    );
                                  }}
                                  className={cn(
                                    "rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors",
                                    isHidden
                                      ? "text-foreground-muted hover:text-foreground hover:bg-background-secondary"
                                      : "text-foreground-secondary hover:text-foreground-muted hover:bg-background-secondary"
                                  )}
                                  title={isHidden ? "Show project" : "Hide project"}
                                >
                                  {isHidden ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Save result feedback */}
                    {saveResult === "success" && (
                      <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success/5 px-3 py-2 text-xs text-success">
                        <Check className="h-3.5 w-3.5" />
                        Settings saved successfully
                      </div>
                    )}
                    {saveResult === "error" && (
                      <div className="rounded-md border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
                        {saveError || "Failed to save settings"}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </Dialog.Description>

            {/* Footer */}
            {serverConfig && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-foreground-muted">
                  Config file: <span className="font-mono">~/.a5c/observer.json</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-md px-3 py-1.5 min-h-[44px] text-xs text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className={cn(
                      "rounded-md px-3 py-1.5 min-h-[44px] text-xs font-medium transition-colors",
                      hasChanges
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-background-secondary text-foreground-muted cursor-not-allowed",
                      saving && "opacity-50"
                    )}
                  >
                    {saving ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

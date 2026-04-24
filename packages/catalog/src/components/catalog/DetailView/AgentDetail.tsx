"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tag } from "@/components/common/Tag";
import { QuickActions } from "../QuickActions";
import { RelatedItems } from "../RelatedItems";
import type { AgentDetail as AgentDetailType } from "@/lib/api/types";

export interface AgentDetailProps {
  agent: AgentDetailType;
  relatedAgents?: Array<{ id: string; name: string; description: string; versionRange?: string | null }>;
  className?: string;
}

export function AgentDetail({
  agent,
  relatedAgents = [],
  className,
}: AgentDetailProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-[var(--tkc-ink)]">{agent.name}</h1>
            <Badge variant="accent">{agent.versionRange}</Badge>
            <Badge variant="outline">{agent.runtimeFamily ?? "runtime"}</Badge>
            <Badge variant="secondary">{agent.releaseChannel}</Badge>
          </div>
          <p className="max-w-3xl text-[var(--tkc-ink-soft)]">{agent.description}</p>
          <div className="flex flex-wrap gap-2">
            {agent.providers.map((provider) => (
              <Tag key={provider.providerId} variant="domain">
                {provider.displayName}
              </Tag>
            ))}
            {agent.modalities.map((modality) => (
              <Tag key={modality.modalityId} variant="category">
                {modality.label}
              </Tag>
            ))}
          </div>
        </div>

        <QuickActions entityId={agent.slug} entityType="agent" filePath={agent.filePath} />
      </div>

      <Separator />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <SectionCard title="Ontology Matrix">
            <div className="grid gap-4 md:grid-cols-2">
              <FacetList
                title="Models"
                items={agent.models.map((model) => ({
                  key: model.modelId,
                  label: model.label,
                  meta: model.versionRange,
                }))}
              />
              <FacetList
                title="Transports"
                items={agent.transports.map((transport) => ({
                  key: transport.transportId,
                  label: transport.label,
                  meta: [
                    transport.persistentSession ? "persistent" : "ephemeral",
                    transport.stdinInjection ? "stdin" : null,
                    transport.blockingStopHook ? "blocking-stop" : null,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                }))}
              />
              <FacetList
                title="Hooks"
                items={agent.hooks.map((hook) => ({
                  key: hook.hookId,
                  label: hook.canonicalName,
                  meta: hook.requiresRuntimeHooks ? "runtime-hooks required" : "direct surface",
                }))}
              />
              <FacetList
                title="Plugin Targets"
                items={agent.pluginTargets.map((target) => ({
                  key: target.targetId,
                  label: target.displayName,
                  meta: `${target.manifestFormat} · ${target.commandFormat}`,
                }))}
              />
            </div>
          </SectionCard>

          <SectionCard title="Capability Matrix">
            <div className="space-y-3">
              {agent.capabilityMatrix.map((assertion) => (
                <div
                  key={assertion.supportId}
                  className="rounded-lg border border-[rgba(179,126,62,0.18)] bg-[rgba(255,255,255,0.55)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--tkc-ink)]">
                        {agent.capabilities.find((capability) => capability.capabilityId === assertion.capabilityId)?.label ??
                          assertion.capabilityId}
                      </p>
                      <p className="text-sm text-[var(--tkc-ink-soft)]">{assertion.notes ?? "No notes."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{assertion.supportLevel}</Badge>
                      <Badge
                        variant={
                          assertion.evidenceStrength === "corroborated"
                            ? "success"
                            : assertion.evidenceStrength === "partial"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {assertion.evidenceStrength}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{assertion.versionRange}</Badge>
                    <Badge variant="secondary">{assertion.evidenceIds.length} evidence refs</Badge>
                    <Badge variant="secondary">{assertion.supportingClaims.length} claims</Badge>
                  </div>
                  {assertion.unresolvedGaps.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {assertion.unresolvedGaps.map((gap) => (
                        <Tag key={gap} variant="outline" size="sm">
                          {gap}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Session Semantics">
            <div className="space-y-4">
              {agent.sessionSemantics.map((session) => (
                <SemanticCard
                  key={session.nuanceId}
                  title={session.versionRange}
                  description={session.resumeSemantics}
                  rows={[
                    ["Session dir", session.sessionDirStrategy],
                    ["PID marker policy", session.pidMarkerPolicy],
                    ["Signals", session.envSignals.join(", ") || "None"],
                    ["State files", session.stateFilePatterns.join(", ") || "None"],
                    [
                      "Metadata fields",
                      session.metadataFields
                        .map((field) => `${field.key}: ${field.envVars.join(", ")}`)
                        .join(" | ") || "None",
                    ],
                  ]}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Lifecycle Semantics">
            <div className="space-y-4">
              {agent.lifecycleSemantics.map((lifecycle) => (
                <SemanticCard
                  key={lifecycle.nuanceId}
                  title={lifecycle.versionRange}
                  rows={[
                    ["Runtime hooks", lifecycle.runtimeHookMode],
                    ["Stop hook", lifecycle.stopHookMode],
                    ["Background tasks", lifecycle.backgroundTaskMode],
                    ["Checkpointing", lifecycle.checkpointMode],
                    ["Plugin context", lifecycle.pluginContextMode],
                    ["Platform nuances", lifecycle.platformNuances.join(", ") || "None"],
                  ]}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Evidence And Provenance">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">
                  Claims
                </p>
                {agent.claims.map((claim) => (
                  <div
                    key={claim.claimId}
                    className="rounded-lg border border-[rgba(179,126,62,0.18)] bg-[rgba(255,255,255,0.55)] p-4"
                  >
                    <p className="text-sm font-medium text-[var(--tkc-ink)]">{claim.statement}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{claim.provenanceKind}</Badge>
                      <Badge variant="outline">{claim.evidenceStrength}</Badge>
                      <Badge variant="outline">{claim.confidence}</Badge>
                    </div>
                    {claim.unresolvedGaps.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {claim.unresolvedGaps.map((gap) => (
                          <Tag key={gap} variant="outline" size="sm">
                            {gap}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">
                  Evidence
                </p>
                {agent.evidence.map((evidence) => (
                  <div
                    key={evidence.evidenceId}
                    className="rounded-lg border border-[rgba(179,126,62,0.18)] bg-[rgba(255,255,255,0.55)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={evidence.kind === "web" ? "accent" : "secondary"}>
                        {evidence.kind}
                      </Badge>
                      <span className="text-xs text-[var(--tkc-ink-quiet)]">{evidence.evidenceId}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--tkc-ink)]">{evidence.claim}</p>
                    <p className="mt-1 text-xs text-[var(--tkc-ink-soft)]">{evidence.sourcePathOrUrl}</p>
                    <p className="text-xs text-[var(--tkc-ink-quiet)]">{evidence.excerptLocator}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Version Metadata">
            <MetadataRows
              rows={[
                ["Slug", agent.slug],
                ["Agent ID", agent.agentId],
                ["Aliases", agent.aliases.join(", ") || "None"],
                ["Source package", agent.sourcePackage],
                ["OS support", agent.osSupport.join(", ") || "Unknown"],
                ["Evidence summary", `${agent.evidenceSummary.evidenceCount} evidence / ${agent.evidenceSummary.claimCount} claims`],
                ["Graph generated", new Date(agent.generatedAt).toISOString()],
              ]}
            />
          </SectionCard>

          {(agent.supersedes.length > 0 || agent.supersededBy.length > 0) && (
            <SectionCard title="Version Lineage">
              <div className="space-y-4 text-sm text-[var(--tkc-ink-soft)]">
                {agent.supersedes.length > 0 && (
                  <div>
                    <p className="mb-2 font-medium text-[var(--tkc-ink)]">Supersedes</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.supersedes.map((entry) => (
                        <Tag key={entry.slug} href={`/agents/${encodeURIComponent(entry.slug)}`}>
                          {entry.name} {entry.versionRange}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
                {agent.supersededBy.length > 0 && (
                  <div>
                    <p className="mb-2 font-medium text-[var(--tkc-ink)]">Superseded By</p>
                    <div className="flex flex-wrap gap-2">
                      {agent.supersededBy.map((entry) => (
                        <Tag key={entry.slug} href={`/agents/${encodeURIComponent(entry.slug)}`}>
                          {entry.name} {entry.versionRange}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          <SectionCard title="Catalog Source">
            <MetadataRows
              rows={[
                ["Path", agent.filePath],
                ["Directory", agent.directory],
                ["Schema version", agent.schemaVersion],
              ]}
            />
          </SectionCard>

          {relatedAgents.length > 0 && (
            <RelatedItems
              title="Related Versions"
              items={relatedAgents.map((entry) => ({
                id: entry.id,
                name: entry.name,
                description: entry.description,
                subtitle: entry.versionRange || undefined,
                href: `/agents/${encodeURIComponent(entry.id)}`,
                type: "agent" as const,
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FacetList({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; meta?: string }>;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-[rgba(179,126,62,0.18)] bg-[rgba(255,255,255,0.55)] p-4">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--tkc-ink-soft)]">None</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.key}>
              <p className="text-sm font-medium text-[var(--tkc-ink)]">{item.label}</p>
              {item.meta && <p className="text-xs text-[var(--tkc-ink-soft)]">{item.meta}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SemanticCard({
  title,
  description,
  rows,
}: {
  title: string;
  description?: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-lg border border-[rgba(179,126,62,0.18)] bg-[rgba(255,255,255,0.55)] p-4">
      <p className="font-medium text-[var(--tkc-ink)]">{title}</p>
      {description && <p className="mt-1 text-sm text-[var(--tkc-ink-soft)]">{description}</p>}
      <MetadataRows rows={rows} className="mt-3" />
    </div>
  );
}

function MetadataRows({
  rows,
  className,
}: {
  rows: Array<[string, string]>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2 text-sm", className)}>
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 md:grid-cols-[140px_minmax(0,1fr)]">
          <span className="text-[var(--tkc-ink-quiet)]">{label}</span>
          <span className="break-words text-[var(--tkc-ink)]">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default AgentDetail;

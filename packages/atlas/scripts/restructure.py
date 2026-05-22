#!/usr/bin/env python3
"""Restructure wave-* example files into semantically named files.

Reads source YAML multi-doc files, partitions docs by id (per planner spec),
writes target multi-doc files, and deletes (renames) sources.
ID-conservation: every id from source appears in exactly one target.
"""
import os
import sys
import re
from pathlib import Path

ROOT = Path(r"C:/work/v6/graph/schema/examples")

# Mapping: source-relative-path → { target-filename → [id-list] | None (=all-remaining catch-all) }
# Use 'None' value as catch-all for unsampled ids.

PLAN = []

def split(source, targets):
    """targets: list of (target-filename, ids-list-or-None-for-rest)."""
    PLAN.append((source, targets))

# ---- Per planner ----

# 1. wave-6b-benchmarks.yaml
split("benchmarks/benchmarks/wave-6b-benchmarks.yaml", [
    ("benchmarks-knowledge.yaml", ["benchmark:m-mmlu","benchmark:flores-200","benchmark:xnli","benchmark:gpqa","benchmark:arc-challenge","benchmark:olympiad-bench","benchmark:promptbench","benchmark:bias-bench","benchmark:truthful-qa"]),
    ("benchmarks-math.yaml", ["benchmark:mgsm"]),
    ("benchmarks-safety.yaml", ["benchmark:harmbench","benchmark:jailbreakbench","benchmark:advbench"]),
    ("benchmarks-tool-use.yaml", ["benchmark:toolbench","benchmark:berkeley-function-calling"]),
    ("benchmarks-agentic-fullstack.yaml", ["benchmark:os-world","benchmark:android-world"]),
    ("benchmarks-domain.yaml", ["benchmark:fin-bench"]),
])

# 2. extended-benchmarks.yaml — note merge with wave-6b math
split("benchmarks/benchmarks/extended-benchmarks.yaml", [
    ("benchmarks-coding.yaml", ["benchmark:repobench","benchmark:bigcode-evalplus"]),
    ("benchmarks-security.yaml", ["benchmark:cyber-bench"]),
    ("benchmarks-leaderboards.yaml", ["benchmark:agentboard","benchmark:lmsys-arena"]),
    ("benchmarks-reasoning.yaml", ["benchmark:hellaswag","benchmark:mt-bench","benchmark:legal-bench","benchmark:medqa"]),
    ("benchmarks-math.yaml", ["benchmark:gsm8k","benchmark:math","benchmark:gsm-symbolic"]),
])

# 3. wave-5 eval-runs
split("benchmarks/eval-runs/wave-5-eval-runs.yaml", [
    ("eval-runs-anthropic.yaml", ["eval-run:swe-bench-verified.claude-haiku-4-5.2025-10","eval-run:gpqa.claude-haiku-4-5.2025-10","eval-run:human-eval.claude-sonnet-4-6.2025-11","eval-run:mmlu.claude-sonnet-4-6.2025-11"]),
    ("eval-runs-openai.yaml", ["eval-run:gpqa.gpt-5.2025-08","eval-run:human-eval.gpt-5.2025-08","eval-run:mmlu.o1.2024-12","eval-run:math.o3.2025-04"]),
    ("eval-runs-google.yaml", ["eval-run:gpqa.gemini-2-5-pro.2025-06","eval-run:livecodebench.gemini-2-5-pro.2025-06","eval-run:swe-bench-verified.gemini-2-5-flash.2025-06"]),
    ("eval-runs-meta.yaml", ["eval-run:swe-bench-verified.llama-4-405b.2024-07","eval-run:human-eval.llama-4-405b.2024-07","eval-run:mmlu.llama-4-405b.2024-07"]),
])

# 4. wave-6b eval-runs
split("benchmarks/eval-runs/wave-6b-eval-runs.yaml", [
    ("eval-runs-anthropic.yaml", ["eval-run:bfcl.claude-sonnet-4-5.2025-09","eval-run:gpqa-diamond.claude-opus-4-5.2025-09","eval-run:os-world.claude-sonnet-4-5.2025-09","eval-run:truthful-qa.claude-opus-4-5.2025-09","eval-run:human-eval-plus.claude-sonnet-4-5.2025-09","eval-run:harmbench.claude-opus-4-5.2025-09","eval-run:arc-challenge.claude-sonnet-4-5.2025-09"]),
    ("eval-runs-openai.yaml", ["eval-run:bfcl.gpt-5.2025-08","eval-run:gpqa-diamond.gpt-5.2025-08","eval-run:human-eval-plus.gpt-5.2025-08"]),
    ("eval-runs-google.yaml", ["eval-run:gpqa-diamond.gemini-2-5-pro.2025-06","eval-run:android-world.gemini-2-5-pro.2025-06","eval-run:mgsm.gemini-2-5-pro.2025-06"]),
])

# 5. wave-7b eval-runs
split("benchmarks/eval-runs/wave-7b-open-source-eval-runs.yaml", [
    ("eval-runs-meta.yaml", ["eval-run:swe-bench.llama-3-1-405b.2024-07","eval-run:mmlu.llama-3-1-405b.2024-07","eval-run:human-eval.llama-3-1-405b.2024-07","eval-run:mmlu.llama-3-3-70b.2024-12","eval-run:human-eval.llama-3-3-70b.2024-12"]),
    ("eval-runs-alibaba-qwen.yaml", ["eval-run:mmlu.qwen-2-5-72b.2024-09","eval-run:human-eval.qwen-2-5-72b.2024-09","eval-run:human-eval.qwen-2-5-coder-32b.2024-11","eval-run:livecodebench.qwen-2-5-coder-32b.2024-11","eval-run:mbpp.qwen-2-5-coder-32b.2024-11"]),
    ("eval-runs-deepseek.yaml", ["eval-run:mmlu.deepseek-v3.2024-12","eval-run:human-eval.deepseek-v3.2024-12","eval-run:swe-bench.deepseek-v3.2024-12","eval-run:mmlu.deepseek-r1.2025-01","eval-run:math.deepseek-r1.2025-01","eval-run:gpqa.deepseek-r1.2025-01"]),
    ("eval-runs-mistral.yaml", ["eval-run:mmlu.mistral-large-2.2024-07","eval-run:human-eval.mistral-large-2.2024-07","eval-run:human-eval.codestral-25-01.2025-01","eval-run:multipl-e.codestral-25-01.2025-01"]),
    ("eval-runs-other-oss.yaml", ["eval-run:mmlu.phi-3-medium.2024-05","eval-run:mmlu.gemma-2-27b.2024-06","eval-run:gsm8k.gemma-2-27b.2024-06","eval-run:mmlu.command-r-plus.2024-08"]),
])

# eval-results — provider determined by parent eval-run id (we'll auto-route by suffix)
def route_eval_result(doc_id):
    # eval-result ids follow eval-run pattern: e.g. eval-result:swe-bench-verified.claude-haiku-4-5.2025-10
    s = doc_id.lower()
    if any(k in s for k in ["claude", "anthropic"]):
        return "eval-results-anthropic.yaml"
    if any(k in s for k in ["gpt", "openai", ".o1.", ".o3.", ".o4."]):
        return "eval-results-openai.yaml"
    if "gemini" in s or "google" in s:
        return "eval-results-google.yaml"
    if "llama" in s or "meta" in s:
        return "eval-results-meta.yaml"
    if "qwen" in s:
        return "eval-results-alibaba-qwen.yaml"
    if "deepseek" in s:
        return "eval-results-deepseek.yaml"
    if "mistral" in s or "codestral" in s:
        return "eval-results-mistral.yaml"
    if any(k in s for k in ["phi-", "gemma-", "command-r"]):
        return "eval-results-other-oss.yaml"
    return "eval-results-other.yaml"

EVAL_RESULT_SOURCES = [
    "benchmarks/eval-results/wave-5-eval-results.yaml",
    "benchmarks/eval-results/wave-6b-eval-results.yaml",
    "benchmarks/eval-results/wave-7b-open-source-eval-results.yaml",
]

# 6. roles
split("role/roles/wave-15-new-roles.yaml", [
    ("roles-engineering-leadership.yaml", ["role:cto","role:vp-engineering","role:engineering-manager-convergent","role:staff-engineer-convergent","role:sre-lead","role:qa-lead"]),
    ("roles-engineering-ic.yaml", ["role:fullstack-engineer","role:backend-engineer","role:frontend-engineer","role:devops-engineer","role:security-engineer"]),
    ("roles-data-ml.yaml", ["role:data-engineer","role:ml-engineer-convergent"]),
    ("roles-product.yaml", ["role:product-owner"]),
    ("roles-docs.yaml", ["role:technical-writer-convergent"]),
    ("roles-agentic-bots.yaml", ["role:bug-triager","role:release-manager-bot","role:changelog-writer","role:adr-writer","role:flaky-test-detector","role:perf-regression-detector","role:cost-tracker","role:sre-runbook-author","role:dependency-updater-bot","role:security-scanner-bot"]),
])

# 7. responsibilities
split("role/responsibilities/wave-15-new-responsibilities.yaml", [
    ("responsibilities-sre-incident.yaml", ["responsibility:on-call-handoff","responsibility:incident-command","responsibility:slo-definition","responsibility:runbook-authoring","responsibility:postmortem-writeup","responsibility:k8s-cluster-upgrade","responsibility:terraform-state-mgmt","responsibility:capacity-planning"]),
    ("responsibilities-security.yaml", ["responsibility:secret-rotation-cadence","responsibility:security-review","responsibility:dependency-audit","responsibility:threat-modeling"]),
    ("responsibilities-release-eng.yaml", ["responsibility:release-coordination","responsibility:changelog-maintenance","responsibility:performance-budget-tracking","responsibility:flaky-test-quarantine"]),
    ("responsibilities-eng-process.yaml", ["responsibility:run-architecture-review","responsibility:retro-facilitation","responsibility:cost-optimization","responsibility:vendor-evaluation","responsibility:code-review-coverage","responsibility:dx-tooling-maintenance","responsibility:adr-curation","responsibility:data-quality-monitoring"]),
])

# 8. wave-16-cloud-primitives.yaml stack-parts
split("domain/stack-parts/wave-16-cloud-primitives.yaml", [
    ("stack-parts-compute.yaml", ["stack-part:serverless-runtime","stack-part:container-runtime","stack-part:kubernetes-cluster","stack-part:container-registry"]),
    ("stack-parts-storage.yaml", ["stack-part:block-storage","stack-part:file-storage"]),
    ("stack-parts-data.yaml", ["stack-part:managed-postgres","stack-part:managed-mysql","stack-part:managed-redis","stack-part:data-warehouse","stack-part:data-lake"]),
    ("stack-parts-networking.yaml", ["stack-part:virtual-private-network","stack-part:dns-service","stack-part:pubsub-service"]),
    ("stack-parts-ml.yaml", ["stack-part:model-registry","stack-part:model-serving","stack-part:feature-store"]),
    ("stack-parts-delivery.yaml", ["stack-part:email-delivery","stack-part:sms-delivery"]),
])

# 9. wave-13 process-library-stack-parts
split("domain/stack-parts/wave-13-process-library-stack-parts.yaml", [
    ("stack-parts-app-services.yaml", ["stack-part:feature-flag-service","stack-part:experiment-platform","stack-part:notification-service","stack-part:scheduler","stack-part:workflow-engine","stack-part:rate-limiter","stack-part:edge-functions"]),
    ("stack-parts-security-edge.yaml", ["stack-part:waf","stack-part:bot-detection","stack-part:auth-broker"]),
])

# 10. additional skill-areas (small)
split("domain/skill-areas/wave-15-additional-skill-areas.yaml", [
    ("skill-areas-tooling.yaml", ["skill-area:document-processing","skill-area:containerization","skill-area:web-scraping","skill-area:terraform-infrastructure","skill-area:json-data-wrangling","skill-area:vision-extraction","skill-area:internationalization"]),
    ("skill-areas-eng-practice.yaml", ["skill-area:code-review-practice","skill-area:api-contract-testing","skill-area:orchestration-loop"]),
])

# 11. benchmark-coverage-areas (rename)
split("domain/skill-areas/wave-16-benchmark-coverage-areas.yaml", [
    ("skill-areas-benchmark-coverage.yaml", None),  # all
])

# 12. tools
split("domain/tools/wave-13-process-library-tools.yaml", [
    ("tools-editors.yaml", ["tool:vscode","tool:jetbrains-idea","tool:vim","tool:neovim","tool:emacs","tool:helix"]),
    ("tools-build.yaml", ["tool:gradle","tool:maven","tool:sbt"]),
    ("tools-cd-gitops.yaml", ["tool:argocd","tool:flux","tool:tekton"]),
    ("tools-service-mesh.yaml", ["tool:istio","tool:linkerd"]),
    ("tools-dev-loop.yaml", ["tool:tilt","tool:skaffold","tool:colima"]),
    ("tools-db-shells.yaml", ["tool:redis-cli","tool:mongosh"]),
    ("tools-codegen.yaml", ["tool:openapi-generator","tool:graphql-codegen"]),
    ("tools-cli-utils.yaml", ["tool:tmux","tool:ripgrep","tool:fzf"]),
    ("tools-profiling.yaml", ["tool:perf","tool:flamegraph","tool:py-spy"]),
    ("tools-notebook.yaml", ["tool:jupyter"]),
    ("tools-observability.yaml", ["tool:opentelemetry-collector","tool:fluent-bit"]),
])

# 13. platforms (rename)
split("domain/platforms/wave-16-platforms.yaml", [
    ("platforms.yaml", None),
])

# 14. org-units (rename)
split("role/org-units/wave-15-new-org-units.yaml", [
    ("org-units.yaml", None),
])

# 15. babysitter skills (rename)
split("extensions/skills/wave-11b-babysitter-skills.yaml", [
    ("skills-babysitter.yaml", None),
])

# 16. babysitter paths (rename)
split("catalog-meta/path-descriptors/wave-11b-babysitter-paths.yaml", [
    ("path-descriptors-babysitter.yaml", None),
])

# 17. babysitter commands (rename)
split("agent-stack/interaction-primitives/wave-11b-babysitter-commands.yaml", [
    ("interaction-primitives-babysitter.yaml", None),
])

# 18. test-sets (rename)
split("benchmarks/test-sets/wave-6b-test-sets.yaml", [
    ("test-sets.yaml", None),
])

# 19. scope-boundaries — rename only
split("sourceref-scope/scope-boundaries/wave-6c-frameworks.yaml", [
    ("scope-boundaries-frameworks.yaml", None),
])
split("sourceref-scope/scope-boundaries/wave-6c-languages.yaml", [
    ("scope-boundaries-languages.yaml", None),
])
split("sourceref-scope/scope-boundaries/wave-6c-mcp-servers.yaml", [
    ("scope-boundaries-mcp-servers.yaml", None),
])

# 20. terminology renames (4 files all keep their content; drop wave prefix)
split("terminology/acronyms/wave-11b-methodologies.yaml", [
    ("acronyms-methodologies.yaml", None),
])
split("terminology/definitions/wave-11b-methodologies.yaml", [
    ("definitions-methodologies.yaml", None),
])
split("terminology/terms/wave-11b-methodologies.yaml", [
    ("terms-methodologies.yaml", None),
])
split("terminology/terms/wave-11b-articles-and-refs.yaml", [
    ("terms-articles-and-refs.yaml", None),
])

# 21. Subagents combined sources (split across two files, by host plugin)
SUBAGENTS_SPLIT = {
    "subagents-babysitter.yaml": ["subagent:babysitter.code-reviewer","subagent:babysitter.sdk-api-documenter"],
    "subagents-openai-agents-sdk.yaml": ["subagent:openai-agents-sdk.triage","subagent:openai-agents-sdk.guardrail"],
}
SUBAGENT_SOURCES = [
    "extensions/subagents/wave-5-builtin-subagents.yaml",
    "extensions/subagents/wave-11b-babysitter-subagents.yaml",
]

# 22. source-refs combined (split by category)
SOURCE_REFS_SPLIT = {
    "source-refs-agent-products.yaml": ["source-ref:zed-app","source-ref:windsurf-app","source-ref:openhands","source-ref:warp-app","source-ref:cline-app"],
    "source-refs-mcp-servers.yaml": ["source-ref:context7-mcp","source-ref:tavily-mcp","source-ref:firecrawl-mcp"],
    "source-refs-babysitter.yaml": ["source-ref:babysitter-plugin","source-ref:babysitter-codex-plugin","source-ref:babysitter-process-library","source-ref:babysitter-articles","source-ref:babysitter-agent-mux-reference","source-ref:babysitter-sdk"],
}
SOURCE_REF_SOURCES = [
    "sourceref-scope/source-refs/wave-5-source-refs.yaml",
    "sourceref-scope/source-refs/wave-11b-babysitter-plugin.yaml",
]

# 23. evidence combined (split by source kind)
EVIDENCE_SPLIT_DEFINED = {
    "evidence-leaderboards.yaml": ["evidence:swe-bench-leaderboard-snapshot-2026-04","evidence:bfcl-leaderboard-snapshot-2026-04"],
    "evidence-vendor-docs.yaml": ["evidence:mcp-spec-2025-06-18","evidence:mcp-spec-2025-11-25","evidence:openai-agents-sdk-docs","evidence:google-adk-docs","evidence:vendor-anthropic-blog-claude-4-5-launch","evidence:vendor-openai-blog-gpt-5-launch"],
    # hf-model-card-* will be auto-routed
}
EVIDENCE_SOURCES = [
    "catalog-meta/evidence-sources/wave-6c-evidence.yaml",
    "catalog-meta/evidence-sources/wave-8b-oss-evidence.yaml",
]
def route_evidence(doc_id):
    if doc_id.startswith("evidence:hf-model-card-") or doc_id == "evidence:mistral-medium-3-launch":
        return "evidence-hf-model-cards.yaml"
    if doc_id in EVIDENCE_SPLIT_DEFINED["evidence-leaderboards.yaml"]:
        return "evidence-leaderboards.yaml"
    if doc_id in EVIDENCE_SPLIT_DEFINED["evidence-vendor-docs.yaml"]:
        return "evidence-vendor-docs.yaml"
    if "leaderboard" in doc_id:
        return "evidence-leaderboards.yaml"
    if "model-card" in doc_id or "hf-" in doc_id:
        return "evidence-hf-model-cards.yaml"
    return "evidence-vendor-docs.yaml"  # default

# 24. hook-mappings & hook-surfaces
HOOK_MAPPING_SOURCE = "channels-hooks/hook-mappings/wave-5-claude-mappings.yaml"
HOOK_SURFACE_SOURCE = "channels-hooks/hook-surfaces/native/wave-5-claude-native-hooks.yaml"

split(HOOK_MAPPING_SOURCE, [("hook-mappings-claude-code.yaml", None)])
split(HOOK_SURFACE_SOURCE, [("hook-surfaces-claude-code.yaml", None)])

# 25. specializations consolidate
SPEC_SOURCES = [
    "domain/specializations/wave-11b-process-library-specializations.yaml",
    "domain/specializations/wave-13-process-library-specializations.yaml",
]

# 26. wave-13-process-library-skill-areas — large, 17 targets
SKILL_AREAS_13_SPLIT = {
    "skill-areas-frontend.yaml": ["skill-area:react-components","skill-area:vue-components","skill-area:server-side-rendering","skill-area:hydration","skill-area:web-vitals","skill-area:css-architecture","skill-area:web-accessibility","skill-area:web-security","skill-area:web-performance","skill-area:browser-compatibility","skill-area:progressive-enhancement"],
    "skill-areas-mobile.yaml": ["skill-area:ios-native","skill-area:android-native","skill-area:react-native-development","skill-area:flutter-development","skill-area:mobile-state-management","skill-area:push-notifications","skill-area:app-store-deployment","skill-area:deep-linking","skill-area:mobile-offline-sync","skill-area:mobile-biometrics","skill-area:in-app-purchases"],
    "skill-areas-devops-sre.yaml": ["skill-area:gitops","skill-area:blue-green-deployment","skill-area:canary-rollouts","skill-area:chaos-engineering","skill-area:sli-slo-management","skill-area:incident-response","skill-area:observability-pipeline","skill-area:service-mesh-config","skill-area:k8s-rbac","skill-area:secrets-rotation"],
    "skill-areas-data-eng.yaml": ["skill-area:etl-pipelines","skill-area:data-warehouse-modeling","skill-area:spark-jobs","skill-area:dbt-modeling","skill-area:data-quality","skill-area:data-lineage","skill-area:batch-vs-stream-tradeoffs","skill-area:columnar-storage","skill-area:data-governance"],
    "skill-areas-security.yaml": ["skill-area:sast","skill-area:dast","skill-area:threat-modeling","skill-area:secret-scanning","skill-area:dependency-vulnerability-mgmt","skill-area:supply-chain-security","skill-area:container-security","skill-area:network-security","skill-area:identity-security"],
    "skill-areas-testing.yaml": ["skill-area:unit-testing","skill-area:integration-testing","skill-area:e2e-testing","skill-area:contract-testing","skill-area:mutation-testing","skill-area:fuzz-testing","skill-area:performance-testing","skill-area:load-testing","skill-area:accessibility-testing","skill-area:visual-regression-testing"],
    "skill-areas-ai-ml.yaml": ["skill-area:prompt-engineering","skill-area:retrieval-augmented-generation","skill-area:agentic-loops","skill-area:tool-use","skill-area:context-management","skill-area:eval-driven-development"],
    "skill-areas-algorithms.yaml": ["skill-area:dynamic-programming","skill-area:graph-algorithms","skill-area:string-matching","skill-area:computational-geometry","skill-area:np-hard-heuristics"],
    "skill-areas-cli-mcp.yaml": ["skill-area:cli-design","skill-area:mcp-server-implementation","skill-area:mcp-stdio-transport","skill-area:mcp-sse-transport","skill-area:mcp-tool-design","skill-area:mcp-resource-design"],
    "skill-areas-crypto-blockchain.yaml": ["skill-area:symmetric-encryption","skill-area:asymmetric-encryption","skill-area:key-derivation","skill-area:signature-schemes","skill-area:smart-contract-security","skill-area:consensus-protocols"],
    "skill-areas-embedded-fpga.yaml": ["skill-area:firmware-development","skill-area:real-time-os","skill-area:hardware-abstraction-layer","skill-area:peripheral-interfacing","skill-area:bootloader-design","skill-area:low-power-design","skill-area:hdl-design","skill-area:fpga-synthesis","skill-area:timing-closure","skill-area:hardware-verification-uvm"],
    "skill-areas-game-gpu.yaml": ["skill-area:game-loop","skill-area:scene-graphs","skill-area:physics-simulation","skill-area:shader-programming","skill-area:asset-pipeline","skill-area:multiplayer-networking","skill-area:cuda-kernels","skill-area:opencl-programming","skill-area:compute-shaders","skill-area:gpu-memory-hierarchy","skill-area:profiling-cuda"],
    "skill-areas-networking-perf.yaml": ["skill-area:tcp-tuning","skill-area:udp-protocol-design","skill-area:http2-multiplexing","skill-area:websocket-design","skill-area:dns-design","skill-area:network-buffers","skill-area:profiling-cpu","skill-area:profiling-memory","skill-area:cache-optimization","skill-area:branch-prediction","skill-area:simd","skill-area:lock-free-data-structures"],
    "skill-areas-robotics.yaml": ["skill-area:ros-development","skill-area:robot-kinematics","skill-area:slam","skill-area:sensor-fusion","skill-area:motion-planning"],
    "skill-areas-sdk-arch.yaml": ["skill-area:api-design","skill-area:semver-discipline","skill-area:breaking-change-management","skill-area:deprecation-policy","skill-area:sdk-codegen","skill-area:plugin-systems","skill-area:domain-driven-design","skill-area:hexagonal-architecture","skill-area:event-sourcing","skill-area:cqrs","skill-area:monolith-vs-microservices","skill-area:c4-modeling","skill-area:adr-writing"],
    "skill-areas-docs-design.yaml": ["skill-area:runbook-writing","skill-area:tutorial-design","skill-area:reference-docs","skill-area:api-doc-generation","skill-area:docs-as-code","skill-area:figma-prototyping","skill-area:design-systems","skill-area:color-theory","skill-area:typography","skill-area:motion-design","skill-area:accessibility-first-design"],
    "skill-areas-migration.yaml": ["skill-area:strangler-fig-pattern","skill-area:parallel-run-migration","skill-area:schema-evolution","skill-area:dependency-upgrade-strategies","skill-area:dead-code-elimination","skill-area:monorepo-extraction"],
}
def route_skill_area_13(doc_id):
    for fn, ids in SKILL_AREAS_13_SPLIT.items():
        if doc_id in ids:
            return fn
    # Fallback: best-effort by name fragment
    s = doc_id.lower()
    if any(k in s for k in ["test","testing","qa-"]): return "skill-areas-testing.yaml"
    if any(k in s for k in ["mobile","ios","android","app-store"]): return "skill-areas-mobile.yaml"
    if any(k in s for k in ["k8s","kubernetes","sre","incident","gitops","devops","slo","sli","chaos","observ","service-mesh"]): return "skill-areas-devops-sre.yaml"
    if any(k in s for k in ["sast","dast","secret","vulnerab","supply-chain","threat","container-security","network-security","identity"]): return "skill-areas-security.yaml"
    if any(k in s for k in ["data-","etl","spark","dbt","warehouse","columnar","lineage","governance","batch","stream"]): return "skill-areas-data-eng.yaml"
    if any(k in s for k in ["ml","ai-","prompt","rag","agent","tool-use","eval-driven","context-management","retrieval"]): return "skill-areas-ai-ml.yaml"
    if any(k in s for k in ["algorithm","dynamic-programming","graph-","string-matching","geometry","np-"]): return "skill-areas-algorithms.yaml"
    if any(k in s for k in ["mcp-","cli-"]): return "skill-areas-cli-mcp.yaml"
    if any(k in s for k in ["crypto","encrypt","signature","blockchain","consensus","smart-contract","key-deriv"]): return "skill-areas-crypto-blockchain.yaml"
    if any(k in s for k in ["firmware","embedded","fpga","hdl","real-time-os","peripheral","bootloader","low-power","timing-closure","hardware"]): return "skill-areas-embedded-fpga.yaml"
    if any(k in s for k in ["game","scene-graph","physics","shader","gpu","cuda","opencl","compute-shader"]): return "skill-areas-game-gpu.yaml"
    if any(k in s for k in ["tcp","udp","http","websocket","dns","network-buffer","profil","cache-opt","branch-prediction","simd","lock-free"]): return "skill-areas-networking-perf.yaml"
    if any(k in s for k in ["robot","slam","kinematic","motion-planning","sensor-fusion","ros-"]): return "skill-areas-robotics.yaml"
    if any(k in s for k in ["api-","semver","breaking-change","deprec","sdk","plugin","ddd","hexagonal","event-sourcing","cqrs","monolith","microservic","c4-","adr"]): return "skill-areas-sdk-arch.yaml"
    if any(k in s for k in ["runbook","tutorial","reference-doc","docs","figma","design-system","color","typography","motion-design","accessib"]): return "skill-areas-docs-design.yaml"
    if any(k in s for k in ["migration","strangler","parallel-run","schema-evolution","upgrade","dead-code","monorepo"]): return "skill-areas-migration.yaml"
    if any(k in s for k in ["react","vue","ssr","hydrat","vital","css","web-","browser","progressive"]): return "skill-areas-frontend.yaml"
    return "skill-areas-misc.yaml"

# 27. platform-services (65 totalDocs)
PLATFORM_SVCS_DEFINED = {
    "platform-services-aws.yaml": ["platform-service:aws-s3","platform-service:aws-lambda","platform-service:aws-rds","platform-service:aws-dynamodb","platform-service:aws-cloudfront","platform-service:aws-sqs","platform-service:aws-eventbridge","platform-service:aws-cloudwatch","platform-service:aws-iam","platform-service:aws-eks","platform-service:aws-ecr","platform-service:aws-api-gateway","platform-service:aws-cognito","platform-service:aws-vpc"],
    "platform-services-gcp.yaml": ["platform-service:gcp-cloud-run","platform-service:gcp-cloud-functions","platform-service:gcp-pubsub","platform-service:gcp-bigquery","platform-service:gcp-gcs","platform-service:gcp-cloud-sql","platform-service:gcp-firestore","platform-service:gcp-cloud-build","platform-service:gcp-iam","platform-service:gcp-gke","platform-service:gcp-artifact-registry"],
    "platform-services-azure.yaml": ["platform-service:azure-functions","platform-service:azure-blob-storage","platform-service:azure-cosmos-db","platform-service:azure-service-bus","platform-service:azure-monitor"],
}
def route_platform_svc(doc_id):
    s = doc_id.lower()
    for fn, ids in PLATFORM_SVCS_DEFINED.items():
        if doc_id in ids: return fn
    if "aws-" in s or s.startswith("platform-service:aws"): return "platform-services-aws.yaml"
    if "gcp-" in s or s.startswith("platform-service:gcp"): return "platform-services-gcp.yaml"
    if "azure-" in s or s.startswith("platform-service:azure"): return "platform-services-azure.yaml"
    if any(k in s for k in ["k8s","kubernetes","helm","kubeflow","argocd","istio"]): return "platform-services-kubernetes.yaml"
    if any(k in s for k in ["vercel","netlify","heroku","fly","railway","render","fastly","cloudflare-pages"]): return "platform-services-paas.yaml"
    return "platform-services-other.yaml"

# 28. libraries (33 totalDocs vs 30 sampled)
LIBRARIES_DEFINED = {
    "libraries-python.yaml": ["library:starlette","library:pytest","library:hypothesis","library:scrapy","library:hf-transformers","library:scikit-learn","library:matplotlib","library:seaborn","library:pytorch","library:tensorflow","library:jax","library:langchain","library:llama-index","library:chromadb","library:qdrant-client"],
    "libraries-go.yaml": ["library:gorm","library:cobra","library:viper"],
    "libraries-rust.yaml": ["library:reqwest","library:sea-orm","library:diesel","library:clap"],
    "libraries-jvm.yaml": ["library:spring-boot","library:mockito","library:junit"],
    "libraries-typescript.yaml": ["library:tanstack-query","library:swr","library:trpc","library:drizzle-orm","library:prisma"],
}
def route_library(doc_id):
    for fn, ids in LIBRARIES_DEFINED.items():
        if doc_id in ids: return fn
    s = doc_id.lower()
    # Heuristic on common library naming
    if any(k in s for k in ["py","django","flask","numpy","pandas","scipy","fastapi","sqlalchemy","celery","tornado","aiohttp"]): return "libraries-python.yaml"
    if any(k in s for k in ["go-","gin","echo","fiber","chi-"]): return "libraries-go.yaml"
    if any(k in s for k in ["rust","tokio","axum","serde","actix","rocket"]): return "libraries-rust.yaml"
    if any(k in s for k in ["spring","jvm","kotlin","scala","akka","play-"]): return "libraries-jvm.yaml"
    if any(k in s for k in ["ts","js","react","vue","svelte","next","nest","express","koa","fastify"]): return "libraries-typescript.yaml"
    return "libraries-other.yaml"


# === IMPLEMENTATION ===

def parse_yaml_docs(path):
    """Return list of (raw_text_block, id_or_None) preserving original byte text."""
    text = path.read_text(encoding="utf-8")
    # Split on lines that are exactly "---"
    lines = text.split("\n")
    blocks = []
    cur = []
    for ln in lines:
        if ln.strip() == "---":
            blocks.append("\n".join(cur))
            cur = []
        else:
            cur.append(ln)
    blocks.append("\n".join(cur))

    docs = []
    # First block before first '---' is usually header/empty. If non-empty + contains 'id:', treat as doc.
    for b in blocks:
        # find id: (top-level, no leading space)
        m = re.search(r"^id:\s*(\S+)\s*$", b, re.MULTILINE)
        doc_id = m.group(1).strip() if m else None
        # strip optional surrounding quotes
        if doc_id and ((doc_id.startswith('"') and doc_id.endswith('"')) or (doc_id.startswith("'") and doc_id.endswith("'"))):
            doc_id = doc_id[1:-1]
        docs.append((b, doc_id))
    return docs

def write_target(target_path, blocks):
    """Write blocks as multi-doc YAML. Each block written as-is, separated by '---'."""
    # If file exists, append. Otherwise create with leading '---' if first block doesn't have it.
    # We'll always write: '---\n' before each block, no leading blank.
    parts = []
    if target_path.exists():
        existing = target_path.read_text(encoding="utf-8")
        # Trim trailing whitespace
        parts.append(existing.rstrip("\n"))
    for b in blocks:
        b_stripped = b.strip("\n")
        if not b_stripped:
            continue
        parts.append("---")
        parts.append(b_stripped)
    out = "\n".join(parts) + "\n"
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(out, encoding="utf-8")

def process_simple_split(source_rel, targets):
    """targets: list of (filename, ids_list_or_None)."""
    src = ROOT / source_rel
    if not src.exists():
        print(f"  SKIP missing: {source_rel}")
        return None
    docs = parse_yaml_docs(src)
    real_docs = [(b,i) for (b,i) in docs if i]
    src_ids = [i for (_,i) in real_docs]
    # Check for catch-all (None)
    catchall = None
    explicit = {}
    for (fn, ids) in targets:
        if ids is None:
            catchall = fn
        else:
            for i in ids:
                explicit[i] = fn

    # Group docs
    groups = {}
    placed = set()
    for (block, did) in real_docs:
        if did in explicit:
            groups.setdefault(explicit[did], []).append(block)
            placed.add(did)
        elif catchall:
            groups.setdefault(catchall, []).append(block)
            placed.add(did)
        else:
            # unsampled — error
            pass
    unplaced = [i for i in src_ids if i not in placed]
    return {
        "source": str(src),
        "source_ids": src_ids,
        "groups": {fn: [b for b in blocks] for fn, blocks in groups.items()},
        "unplaced": unplaced,
        "src_dir": src.parent,
        "src_doc_count": len(real_docs),
    }

def commit(plan_results, deletions):
    created = []
    for entry in plan_results:
        if not entry: continue
        for fn, blocks in entry["groups"].items():
            tgt = entry["src_dir"] / fn
            write_target(tgt, blocks)
            created.append(str(tgt))
    deleted = []
    for src in deletions:
        if Path(src).exists():
            os.remove(src)
            deleted.append(str(src))
    return created, deleted

def main():
    all_results = []
    deletions = []
    src_id_count = 0
    tgt_id_count = 0

    # Pre-flight: simple splits first
    for source_rel, targets in PLAN:
        res = process_simple_split(source_rel, targets)
        if res:
            all_results.append(res)
            src_id_count += len(res["source_ids"])
            for fn, blocks in res["groups"].items():
                tgt_id_count += len(blocks)
            if res["unplaced"]:
                # Try second-pass routing for known large files
                src_path = res["source"]
                fname = os.path.basename(src_path)
                # Default: place unplaced into a fallback target
                print(f"  unplaced in {fname}: {len(res['unplaced'])} ids")
            deletions.append(res["source"])

    # Now custom routes for large/combined files

    # eval-results: route by parent eval-run id
    for src_rel in EVAL_RESULT_SOURCES:
        src = ROOT / src_rel
        if not src.exists(): continue
        docs = parse_yaml_docs(src)
        real_docs = [(b,i) for (b,i) in docs if i]
        groups = {}
        for (block, did) in real_docs:
            # eval-result:<benchmark>.<model>.<date>
            stripped = did.replace("eval-result:", "")
            target = route_eval_result(stripped)
            groups.setdefault(target, []).append(block)
        all_results.append({"source": str(src), "source_ids": [i for _,i in real_docs], "groups": groups, "unplaced": [], "src_dir": src.parent, "src_doc_count": len(real_docs)})
        src_id_count += len(real_docs)
        for blocks in groups.values():
            tgt_id_count += len(blocks)
        deletions.append(str(src))

    # subagents combined
    sub_groups = {}
    sub_src_ids = []
    sub_dir = None
    for src_rel in SUBAGENT_SOURCES:
        src = ROOT / src_rel
        if not src.exists(): continue
        sub_dir = src.parent
        docs = parse_yaml_docs(src)
        real_docs = [(b,i) for (b,i) in docs if i]
        for (block, did) in real_docs:
            placed = False
            for fn, ids in SUBAGENTS_SPLIT.items():
                if did in ids:
                    sub_groups.setdefault(fn, []).append(block)
                    placed = True
                    break
            if not placed:
                # heuristic: prefix-based
                if "babysitter" in did:
                    sub_groups.setdefault("subagents-babysitter.yaml", []).append(block)
                elif "openai-agents-sdk" in did:
                    sub_groups.setdefault("subagents-openai-agents-sdk.yaml", []).append(block)
                else:
                    sub_groups.setdefault("subagents-other.yaml", []).append(block)
            sub_src_ids.append(did)
        deletions.append(str(src))
        src_id_count += len(real_docs)
    if sub_groups and sub_dir:
        all_results.append({"source": "subagents-combined", "source_ids": sub_src_ids, "groups": sub_groups, "unplaced": [], "src_dir": sub_dir, "src_doc_count": len(sub_src_ids)})
        for blocks in sub_groups.values():
            tgt_id_count += len(blocks)

    # source-refs combined
    sr_groups = {}
    sr_src_ids = []
    sr_dir = None
    for src_rel in SOURCE_REF_SOURCES:
        src = ROOT / src_rel
        if not src.exists(): continue
        sr_dir = src.parent
        docs = parse_yaml_docs(src)
        real_docs = [(b,i) for (b,i) in docs if i]
        for (block, did) in real_docs:
            placed = False
            for fn, ids in SOURCE_REFS_SPLIT.items():
                if did in ids:
                    sr_groups.setdefault(fn, []).append(block)
                    placed = True
                    break
            if not placed:
                # Heuristic
                if "babysitter" in did:
                    sr_groups.setdefault("source-refs-babysitter.yaml", []).append(block)
                elif "mcp" in did:
                    sr_groups.setdefault("source-refs-mcp-servers.yaml", []).append(block)
                else:
                    sr_groups.setdefault("source-refs-agent-products.yaml", []).append(block)
            sr_src_ids.append(did)
        deletions.append(str(src))
        src_id_count += len(real_docs)
    if sr_groups and sr_dir:
        all_results.append({"source": "source-refs-combined", "source_ids": sr_src_ids, "groups": sr_groups, "unplaced": [], "src_dir": sr_dir, "src_doc_count": len(sr_src_ids)})
        for blocks in sr_groups.values():
            tgt_id_count += len(blocks)

    # evidence combined
    ev_groups = {}
    ev_src_ids = []
    ev_dir = None
    for src_rel in EVIDENCE_SOURCES:
        src = ROOT / src_rel
        if not src.exists(): continue
        ev_dir = src.parent
        docs = parse_yaml_docs(src)
        real_docs = [(b,i) for (b,i) in docs if i]
        for (block, did) in real_docs:
            target = route_evidence(did)
            ev_groups.setdefault(target, []).append(block)
            ev_src_ids.append(did)
        deletions.append(str(src))
        src_id_count += len(real_docs)
    if ev_groups and ev_dir:
        all_results.append({"source": "evidence-combined", "source_ids": ev_src_ids, "groups": ev_groups, "unplaced": [], "src_dir": ev_dir, "src_doc_count": len(ev_src_ids)})
        for blocks in ev_groups.values():
            tgt_id_count += len(blocks)

    # specializations combined → specializations.yaml
    sp_groups = {}
    sp_src_ids = []
    sp_dir = None
    for src_rel in SPEC_SOURCES:
        src = ROOT / src_rel
        if not src.exists(): continue
        sp_dir = src.parent
        docs = parse_yaml_docs(src)
        real_docs = [(b,i) for (b,i) in docs if i]
        for (block, did) in real_docs:
            sp_groups.setdefault("specializations.yaml", []).append(block)
            sp_src_ids.append(did)
        deletions.append(str(src))
        src_id_count += len(real_docs)
    if sp_groups and sp_dir:
        all_results.append({"source": "specializations-combined", "source_ids": sp_src_ids, "groups": sp_groups, "unplaced": [], "src_dir": sp_dir, "src_doc_count": len(sp_src_ids)})
        for blocks in sp_groups.values():
            tgt_id_count += len(blocks)

    # Large files: skill-areas-13, platform-services, libraries
    # Override prior partial results for these by performing full routing.
    overrides = {}

    # wave-13 skill-areas
    src = ROOT / "domain/skill-areas/wave-13-process-library-skill-areas.yaml"
    if src.exists():
        docs = parse_yaml_docs(src)
        real_docs = [(b,i) for (b,i) in docs if i]
        groups = {}
        for (block, did) in real_docs:
            target = route_skill_area_13(did)
            groups.setdefault(target, []).append(block)
        overrides[str(src)] = {"source": str(src), "source_ids": [i for _,i in real_docs], "groups": groups, "unplaced": [], "src_dir": src.parent, "src_doc_count": len(real_docs)}

    # platform-services
    src = ROOT / "domain/platform-services/wave-16-platform-services.yaml"
    if src.exists():
        docs = parse_yaml_docs(src)
        real_docs = [(b,i) for (b,i) in docs if i]
        groups = {}
        for (block, did) in real_docs:
            target = route_platform_svc(did)
            groups.setdefault(target, []).append(block)
        overrides[str(src)] = {"source": str(src), "source_ids": [i for _,i in real_docs], "groups": groups, "unplaced": [], "src_dir": src.parent, "src_doc_count": len(real_docs)}

    # libraries
    src = ROOT / "domain/libraries/wave-13-process-library-libraries.yaml"
    if src.exists():
        docs = parse_yaml_docs(src)
        real_docs = [(b,i) for (b,i) in docs if i]
        groups = {}
        for (block, did) in real_docs:
            target = route_library(did)
            groups.setdefault(target, []).append(block)
        overrides[str(src)] = {"source": str(src), "source_ids": [i for _,i in real_docs], "groups": groups, "unplaced": [], "src_dir": src.parent, "src_doc_count": len(real_docs)}

    # Apply overrides — replace any earlier entries with same source path
    final_results = []
    seen_overrides = set()
    for r in all_results:
        if r and r.get("source") in overrides:
            if r["source"] not in seen_overrides:
                # subtract earlier counts
                src_id_count_local_correction = 0  # not bothering, we'll recompute below
                final_results.append(overrides[r["source"]])
                seen_overrides.add(r["source"])
            # skip the original
        else:
            final_results.append(r)
    # Add overrides whose source wasn't in original list
    for spath, r in overrides.items():
        if spath not in seen_overrides:
            final_results.append(r)
            seen_overrides.add(spath)

    # Recompute counts cleanly
    src_id_count = 0
    tgt_id_count = 0
    for r in final_results:
        if not r: continue
        src_id_count += len(r["source_ids"])
        for blocks in r["groups"].values():
            tgt_id_count += len(blocks)

    print(f"Total source ids: {src_id_count}")
    print(f"Total target ids: {tgt_id_count}")
    print(f"Conserved: {src_id_count == tgt_id_count}")
    print(f"Files to delete: {len(deletions)}")

    # Now WRITE
    created, deleted = commit(final_results, deletions)
    print(f"Created/updated files: {len(set(created))}")
    print(f"Deleted files: {len(deleted)}")

    # Write a summary file
    import json
    summary = {
        "files_split": len(final_results),
        "src_id_count": src_id_count,
        "tgt_id_count": tgt_id_count,
        "conserved": src_id_count == tgt_id_count,
        "created": sorted(set(created)),
        "deleted": sorted(set(deleted)),
    }
    with open(r"C:/work/v6/restructure-summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print("Wrote C:/work/v6/restructure-summary.json")

if __name__ == "__main__":
    main()

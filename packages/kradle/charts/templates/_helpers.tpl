{{- define "kradle.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "kradle.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "kradle.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Returns "true" when the given org namespace exists and is NOT terminating.
The deploy uninstalls then reinstalls the release; during a fresh install the
org namespace (kradle-org-<org>) may still be terminating from the uninstall, and
Kubernetes forbids creating new content (e.g. a ServiceAccount) in a terminating
namespace — which fails the whole install. Gate org-namespace resources on this
so the base platform installs cleanly regardless of org-namespace lifecycle.
During client-side `helm template` (no cluster) lookup is empty → returns "".
Call as: include "kradle.orgNamespaceActive" "kradle-org-foo"
*/}}
{{- define "kradle.orgNamespaceActive" -}}
{{- $ns := lookup "v1" "Namespace" "" . -}}
{{- if and $ns (ne (default "" ($ns.status).phase) "Terminating") -}}true{{- end -}}
{{- end -}}

{{- define "kradle.controllerImage" -}}
{{- if and .Values.image.controller .Values.image.controller.repository -}}
{{- printf "%s:%s" .Values.image.controller.repository (default .Values.image.tag .Values.image.controller.tag) -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository .Values.image.tag -}}
{{- end -}}
{{- end -}}

{{- define "kradle.webImage" -}}
{{- if and .Values.image.web .Values.image.web.repository -}}
{{- printf "%s:%s" .Values.image.web.repository (default .Values.image.tag .Values.image.web.tag) -}}
{{- else -}}
{{- printf "%s:%s" .Values.image.repository .Values.image.tag -}}
{{- end -}}
{{- end -}}

{{/*
Effective secret name holding the Gitea agent token (KRADLE_GITEA_TOKEN).
Prefers an explicitly-provided existingSecret; otherwise, when autoProvision is
enabled, the name of the secret the gitea-token hook Job creates. Empty string
means "no token secret" so callers can skip injecting KRADLE_GITEA_TOKEN.
*/}}
{{- define "kradle.giteaTokenSecretName" -}}
{{- $t := .Values.gitea.token | default dict -}}
{{- if $t.existingSecret -}}
{{- $t.existingSecret -}}
{{- else if $t.autoProvision -}}
{{- printf "%s-gitea-agent-token" (include "kradle.fullname" .) -}}
{{- end -}}
{{- end -}}

{{- define "kradle.labels" -}}
app.kubernetes.io/name: {{ include "kradle.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
kradle.a5c.ai/surface: mvp-package
{{- end -}}

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

{{- define "kradle.labels" -}}
app.kubernetes.io/name: {{ include "kradle.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
kradle.a5c.ai/surface: mvp-package
{{- end -}}

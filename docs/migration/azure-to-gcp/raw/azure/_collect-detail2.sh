#!/usr/bin/env bash
# Re-run of detail commands that failed in pass 1 (stdin was consumed by az inside while-read loops). Read-only. No secret values.
set -u
OUT="$(cd "$(dirname "$0")" && pwd)"
run() { local name="$1"; shift; echo "== $name"; "$@" > "$OUT/$name.json" 2> "$OUT/$name.err" < /dev/null || echo "FAILED: $name"; [ -s "$OUT/$name.err" ] || rm -f "$OUT/$name.err"; }
for s in $(jq -r '.[].name' "$OUT/storage-accounts.json"); do
  run "storage-shares-$s" az storage share-rm list --storage-account "$s" -o json
done
for kv in kv-personoi362519582270 kv-talai084044774586 kv-tmuskal2530339506822; do
  run "kv-show-$kv" az keyvault show -n "$kv" -o json
  run "kv-secret-names-$kv" az keyvault secret list --vault-name "$kv" --query "[].{name:name,enabled:attributes.enabled,updated:attributes.updated}" -o json
done
run kv-show-kv-hubdevelopmentwest3v2 az keyvault show -n kv-hubdevelopmentwest3v2 -o json
jq -r '.[] | "\(.resourceGroup) \(.name)"' "$OUT/cognitive-accounts.json" > "$OUT/_cog.txt"
while read rg n; do run "cog-deployments-$n" az cognitiveservices account deployment list -g "$rg" -n "$n" -o json; done < "$OUT/_cog.txt"
jq -r '.[] | "\(.resourceGroup) \(.name)"' "$OUT/staticwebapps.json" > "$OUT/_swa.txt"
while read rg n; do run "swa-show-$rg-$n" az staticwebapp show -g "$rg" -n "$n" -o json; run "swa-hostnames-$rg-$n" az staticwebapp hostname list -g "$rg" -n "$n" -o json; run "swa-envs-$rg-$n" az staticwebapp environment list -g "$rg" -n "$n" -o json; done < "$OUT/_swa.txt"
for n in geekonomy-web geekonomy-worker geekonomy-transcriber; do run "containerapp-show-$n" az containerapp show -g geekonomy-prod -n "$n" -o json; done
run diag-aks az monitor diagnostic-settings list --resource aks-hub-development-westus3-v2 --resource-group rg-hub-development-westus3 --resource-type Microsoft.ContainerService/managedClusters -o json
run aks-credentials-info az aks show -g rg-hub-development-westus3 -n aks-hub-development-westus3-v2 --query "{fqdn:fqdn,oidc:oidcIssuerProfile,identity:identity,ipr:apiServerAccessProfile,provisioningState:provisioningState}" -o json
run ml-workspaces-list az ml workspace list -o json
run lb-kubernetes az network lb show -g MC_rg-hub-development-westus3_aks-hub-development-westus3-v2_westus3 -n kubernetes -o json
run vmss az vmss list -o json
run activity-log-aks az monitor activity-log list --resource-group rg-hub-development-westus3 --offset 30d --query "[?contains(operationName.value, 'ContainerService')].{time:eventTimestamp,op:operationName.value,status:status.value,caller:caller}" -o json
run sub-tenant-history az account subscription show --id 794e33cd-48ba-4654-8cd9-b6cf2715e097 -o json
echo DONE

#!/usr/bin/env bash
# Second-pass detail collection (read-only). No key/secret values are fetched.
set -u
OUT="$(cd "$(dirname "$0")" && pwd)"
run() { local name="$1"; shift; echo "== $name"; "$@" > "$OUT/$name.json" 2> "$OUT/$name.err" || echo "FAILED: $name"; [ -s "$OUT/$name.err" ] || rm -f "$OUT/$name.err"; }
# ACR
run acr-show-hub az acr show -n acrhubdevelopmentwestus3 -o json
run acr-usage-hub az acr show-usage -n acrhubdevelopmentwestus3 -o json
run acr-repos-hub az acr repository list -n acrhubdevelopmentwestus3 -o json
run acr-tokens-hub az acr token list -r acrhubdevelopmentwestus3 -o json
run acr-scopemaps-hub az acr scope-map list -r acrhubdevelopmentwestus3 -o json
run acr-show-geekonomy az acr show -n geekonomyacrmkb5l5 -o json
run acr-usage-geekonomy az acr show-usage -n geekonomyacrmkb5l5 -o json
run acr-repos-geekonomy az acr repository list -n geekonomyacrmkb5l5 -o json
# Postgres
for s in "rg-hub-development-westus3 aeqpg0316203042" "rg-hub-development-westus3 psql-hub-development-westus3-v2" "rg-litellm-proxy litellm-pgdb" "rg-litellm-proxy litellm-pgdb2" "geekonomy-prod geekonomy-pg-mkb5l5"; do
  set -- $s; run "pg-show-$2" az postgres flexible-server show -g "$1" -n "$2" -o json
  run "pg-dbs-$2" az postgres flexible-server db list -g "$1" -s "$2" -o json
  run "pg-fw-$2" az postgres flexible-server firewall-rule list -g "$1" -n "$2" -o json
done
# Storage (containers/shares via login auth; will fail without data-plane RBAC and that's a finding)
for s in $(jq -r '.[].name' "$OUT/storage-accounts.json"); do
  run "storage-containers-$s" az storage container list --account-name "$s" --auth-mode login -o json
  run "storage-shares-$s" az storage share-rm list --storage-account "$s" -o json
done
# Key Vaults
for kv in $(jq -r '.[].name' "$OUT/keyvaults.json"); do
  run "kv-show-$kv" az keyvault show -n "$kv" -o json
  run "kv-secret-names-$kv" az keyvault secret list --vault-name "$kv" --query "[].{name:name,enabled:attributes.enabled,updated:attributes.updated}" -o json
done
# Cognitive deployments
jq -r '.[] | "\(.resourceGroup) \(.name)"' "$OUT/cognitive-accounts.json" | while read rg n; do run "cog-deployments-$n" az cognitiveservices account deployment list -g "$rg" -n "$n" -o json; done
# Static web apps / web app / container apps detail
jq -r '.[] | "\(.resourceGroup) \(.name)"' "$OUT/staticwebapps.json" | while read rg n; do run "swa-show-$n" az staticwebapp show -g "$rg" -n "$n" -o json; run "swa-hostnames-$n" az staticwebapp hostname list -g "$rg" -n "$n" -o json; done
run webapp-show-promoted-idle az webapp show -g rg-promoted-idle -n promoted-idle-a1cef5 -o json
run webapp-config-promoted-idle az webapp config show -g rg-promoted-idle -n promoted-idle-a1cef5 -o json
run webapp-container-promoted-idle az webapp config container show -g rg-promoted-idle -n promoted-idle-a1cef5 -o json
jq -r '.[] | "\(.resourceGroup) \(.name)"' "$OUT/containerapps.json" | while read rg n; do run "containerapp-show-$n" az containerapp show -g "$rg" -n "$n" -o json; done
run containerapp-job-geekonomy az containerapp job show -g geekonomy-prod -n geekonomy-db-migrate -o json
run redis-show-geekonomy az redis show -g geekonomy-prod -n geekonomy-redis-mkb5l5 -o json
# DNS
run dns-records-i-personoids az network dns record-set list -g PersonoidsClusterDnsResourceGroup -z i.personoids.com -o json
# VMs detail already in vms.json (-d). Extensions:
run vm-extensions az resource list --resource-type Microsoft.Compute/virtualMachines/extensions -o json
# Monitor
run diag-aks az monitor diagnostic-settings list --resource "/subscriptions/794e33cd-48ba-4654-8cd9-b6cf2715e097/resourceGroups/rg-hub-development-westus3/providers/Microsoft.ContainerService/managedClusters/aks-hub-development-westus3-v2" -o json
run budgets az consumption budget list -o json
run advisor az advisor recommendation list -o json
run aks-addons az aks addon list -g rg-hub-development-westus3 -n aks-hub-development-westus3-v2 -o json
run aks-credentials-info az aks show -g rg-hub-development-westus3 -n aks-hub-development-westus3-v2 --query "{fqdn:fqdn,oidc:oidcIssuerProfile,wi:securityProfile.workloadIdentity,identity:identity,ipr:apiServerAccessProfile}" -o json
run ml-workspaces-list az ml workspace list -o json
run lb-kubernetes az network lb show -g MC_rg-hub-development-westus3_aks-hub-development-westus3-v2_westus3 -n kubernetes -o json
run vmss az vmss list -o json
echo DONE

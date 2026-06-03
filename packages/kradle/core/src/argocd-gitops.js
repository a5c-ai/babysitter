export function createArgoCdApplication({
  name = 'kradle',
  namespace = 'argocd',
  project = 'default',
  repoURL,
  path = 'charts/kradle',
  targetRevision = 'HEAD',
  destinationNamespace = 'kradle-system',
  destinationServer = 'https://kubernetes.default.svc',
  automated = true
} = {}) {
  if (!repoURL) throw new Error('Argo CD Application requires repoURL');
  return {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Application',
    metadata: {
      name,
      namespace,
      labels: {
        'app.kubernetes.io/part-of': 'kradle',
        'kradle.a5c.ai/gitops-engine': 'argocd'
      }
    },
    spec: {
      project,
      source: { repoURL, targetRevision, path },
      destination: { server: destinationServer, namespace: destinationNamespace },
      syncPolicy: automated ? {
        automated: { prune: true, selfHeal: true },
        syncOptions: ['CreateNamespace=true']
      } : { syncOptions: ['CreateNamespace=true'] }
    }
  };
}

export function createKradleGitOpsPlan({ repoURL, namespace = 'kradle-system', applicationName = 'kradle' }) {
  return {
    engine: 'argocd',
    application: createArgoCdApplication({ name: applicationName, repoURL, destinationNamespace: namespace }),
    requiredClusterResources: ['Application.argoproj.io', 'Namespace', 'ServiceAccount', 'RBAC', 'APIService', 'Kradle CRDs'],
    syncGuarantees: ['automated prune', 'automated selfHeal', 'namespace creation']
  };
}

export function createArgoCdApplication({
  name = 'krate',
  namespace = 'argocd',
  project = 'default',
  repoURL,
  path = 'charts/krate',
  targetRevision = 'HEAD',
  destinationNamespace = 'krate-system',
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
        'app.kubernetes.io/part-of': 'krate',
        'krate.a5c.ai/gitops-engine': 'argocd'
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

export function createKrateGitOpsPlan({ repoURL, namespace = 'krate-system', applicationName = 'krate' }) {
  return {
    engine: 'argocd',
    application: createArgoCdApplication({ name: applicationName, repoURL, destinationNamespace: namespace }),
    requiredClusterResources: ['Application.argoproj.io', 'Namespace', 'ServiceAccount', 'RBAC', 'APIService', 'Krate CRDs'],
    syncGuarantees: ['automated prune', 'automated selfHeal', 'namespace creation']
  };
}

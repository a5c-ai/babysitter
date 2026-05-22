import { loadKrateUi, DegradedBanner } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { InferenceServiceManager } from '../components/inference-service-manager.jsx';

export async function InferenceServicesPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/inference" eyebrow="ML inference" title="Inference Services" text="Manage KServe inference services and serving runtimes." actions={[['/', 'Home']]} breadcrumbs={[['/', 'Krate'], ['/inference', 'Inference']]}>
    <DegradedBanner model={ui.model} />
    <InferenceServiceManager org={activeOrg} />
  </PageFrame>;
}

export async function InferenceServiceDetailPage({ org = null, name = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/inference" eyebrow="ML inference" title={name || 'Inference Service'} text="Inference service details, status, and test panel." actions={[['/inference', 'All Services']]} breadcrumbs={[['/', 'Krate'], ['/inference', 'Inference'], [name ? `/inference/${name}` : '/inference', name || 'Service']]}>
    <DegradedBanner model={ui.model} />
    <InferenceServiceManager org={activeOrg} initialServiceName={name} />
  </PageFrame>;
}

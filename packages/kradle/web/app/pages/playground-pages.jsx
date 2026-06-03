// Routes: /orgs/[org]/playground — side-by-side model comparison playground.
import { loadKrateUi, DegradedBanner } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { InferencePlayground } from '../components/inference/inference-playground.jsx';

export async function PlaygroundPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/playground"
      eyebrow="inference"
      title="Playground"
      text="Compare model responses side-by-side with shared prompts and parameter controls."
      actions={[['/', 'Home'], ['/inference', 'Inference']]}
      breadcrumbs={[['/', 'Krate'], ['/inference', 'Inference'], ['/playground', 'Playground']]}
    >
      <DegradedBanner model={ui.model} />
      <InferencePlayground org={activeOrg} />
    </PageFrame>
  );
}

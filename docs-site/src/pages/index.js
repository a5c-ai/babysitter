import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';
import { homepageStats } from '../generated/processLibraryStats';

const defaultPathways = [
  {
    title: 'Start Fast',
    href: '/docs/user-guide/getting-started/quickstart',
    description:
      'Install Babysitter, configure your harness, and run the first orchestration loop without digging through the whole repo first.'
  },
  {
    title: 'Run The System',
    href: '/docs/user-guide/reference/cli-reference',
    description:
      'Jump straight into the command surface: runs, tasks, sessions, plugins, harnesses, and process-library controls.'
  },
  {
    title: 'Know The Surfaces',
    href: '/docs/package-and-plugin-map',
    description:
      'See which packages and plugins are public, advanced/operator-facing, or internal-only, then jump to the canonical docs home for each one.'
  },
  {
    title: 'Design Better Processes',
    href: '/docs/user-guide/features/process-definitions',
    description:
      'Learn how Babysitter turns prompts into bounded, replayable workflows with explicit gates and deterministic evidence.'
  },
  {
    title: 'Ship With GitHub Actions',
    href: '/docs/github-actions-setup-babysitter',
    description:
      'Use the docs and CI setup guides to connect Babysitter orchestration to your repository workflows and review loops.'
  }
];

const stats = homepageStats;

const pillars = [
  {
    title: 'Source-first',
    description:
      'The site is built from the repository docs tree, so process guidance, setup material, and reference pages do not drift from the codebase.'
  },
  {
    title: 'Replay-aware',
    description:
      'The docs match how Babysitter works: iterations, evidence, approvals, and deterministic convergence instead of vibes-only automation.'
  },
  {
    title: 'Operator-friendly',
    description:
      'Quickstart paths, CLI reference, plugins, and deployment guides are grouped around the real questions users hit while running the system.'
  }
];

const strictScopePathways = [
  {
    title: 'Stage The Gate',
    href: '/docs/github-actions-setup-babysitter',
    description:
      'Start with the staged GitHub Actions and operational docs that are currently held to hard-fail link and sample validation.'
  },
  {
    title: 'Check CLI Reality',
    href: '/docs/cli-examples',
    description:
      'Validate the command surface against the docs-backed examples and smoke-oriented CLI walkthroughs.'
  },
  {
    title: 'Review Reference',
    href: '/docs/reference/GETTING_STARTED',
    description:
      'Use the staged reference entrypoint that is included in the strict docs QA scope today.'
  },
  {
    title: 'Audit V6 Claims',
    href: '/docs/v6-spec-and-roadmap/v6-implementation-roadmap',
    description:
      'Check the roadmap and validation claims that are now part of the staged docs quality gate.'
  }
];

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  const strictDocScope = siteConfig.customFields?.strictDocScope === true;
  const pathways = strictDocScope ? strictScopePathways : defaultPathways;

  return (
    <Layout
      title="Babysitter Docs"
      description="GitHub Pages documentation for Babysitter, sourced from the repository docs tree."
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Repository ledger · canonical docs surface</p>
            <h1>Babysitter, documented like the system actually runs.</h1>
            <p className={styles.lead}>
              Built straight from <code>./docs</code>. User guide, setup guides, process design,
              plugins, and research all live in one auditable source of truth instead of a second
              marketing-shaped copy of the repo.
            </p>
            <div className={styles.actions}>
              {strictDocScope ? (
                <>
                  <Link className="button button--primary button--lg" to="/docs/github-actions-setup-babysitter">
                    Open staged docs
                  </Link>
                  <Link className="button button--secondary button--lg" to="/docs/cli-examples">
                    Review CLI examples
                  </Link>
                </>
              ) : (
                <>
                  <Link className="button button--primary button--lg" to="/docs/user-guide/">
                    Open the user guide
                  </Link>
                  <Link className="button button--secondary button--lg" to="/docs/plugins">
                    Explore plugins
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className={styles.heroPanel}>
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelNum}>07</span>
                <span>Operator Ledger</span>
                <span className={styles.panelMeta}>Docs surface</span>
              </div>
              <div className={styles.panelBody}>
                <div className={styles.specRow}>
                  <span>Source tree</span>
                  <strong>./docs</strong>
                </div>
                <div className={styles.specRow}>
                  <span>Default loop</span>
                  <strong>Plan → Execute → Verify</strong>
                </div>
                <div className={styles.specRow}>
                  <span>Primary outputs</span>
                  <strong>Runs, tasks, sessions, gates</strong>
                </div>
                <pre className={styles.terminal}>
                  <code>{`/babysitter:call add tests and gates

Iteration 1  -> code + tests
Iteration 2  -> verify failures
Iteration 3  -> converge to target

Result: documented, replayable, reviewable`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Navigate by intent</p>
            <h2>Pick the shortest path to the answer you need.</h2>
          </div>
          <div className={styles.grid}>
            {pathways.map((pathway) => (
              <Link
                key={pathway.title}
                to={pathway.href}
                className={clsx(styles.card, styles.pathCard)}
              >
                <h3>{pathway.title}</h3>
                <p>{pathway.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Why this site shape</p>
            <h2>One docs tree, one build, one deployment path.</h2>
          </div>
          <div className={styles.grid}>
            {pillars.map((pillar) => (
              <div key={pillar.title} className={styles.card}>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}

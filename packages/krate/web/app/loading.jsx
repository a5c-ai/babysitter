'use client';

import { KrateLoadingView } from './components/krate-loading.jsx';

export default function Loading() {
  return <KrateLoadingView title="Loading Krate workspace" subtitle="Fetching the latest workspace state." />;
}

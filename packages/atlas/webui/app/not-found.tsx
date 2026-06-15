import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-12 max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-semibold mb-2" style={{ color: 'var(--fg)' }}>404</h1>
      <p className="mb-6" style={{ color: 'var(--fg-2)' }}>
        That record, NodeKind, or EdgeKind doesn&apos;t exist in the catalog index.
      </p>
      <div className="flex justify-center gap-3 text-sm">
        <Link href="/" className="px-3 py-1.5 rounded cpd-hover transition-colors" style={{ border: '1px solid var(--rule)', color: 'var(--fg)' }}>
          Home
        </Link>
        <Link href="/search" className="px-3 py-1.5 rounded cpd-hover transition-colors" style={{ border: '1px solid var(--rule)', color: 'var(--fg)' }}>
          Search
        </Link>
        <Link href="/edges" className="px-3 py-1.5 rounded cpd-hover transition-colors" style={{ border: '1px solid var(--rule)', color: 'var(--fg)' }}>
          EdgeKinds
        </Link>
      </div>
    </div>
  );
}

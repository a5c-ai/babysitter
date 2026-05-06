import Link from "next/link";
import { Network } from "lucide-react";
import { SearchBar } from "./SearchBar";

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur"
      style={{
        background: 'var(--ground-ink)',
        borderBottom: '1px solid var(--edge-fade)',
        color: 'var(--glyph-bone)',
      }}
    >
      <div className="flex h-14 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold" style={{ color: 'var(--brass-light)' }}>
          <Network className="h-5 w-5" />
          <span>Atlas Graph Explorer</span>
        </Link>
        <div className="flex-1 flex justify-center">
          <SearchBar />
        </div>
        <nav className="flex items-center gap-4 text-sm" style={{ color: 'var(--glyph-fade)' }}>
          <Link href="/wiki" className="transition-colors hover:brightness-125" style={{ color: 'var(--glyph-fade)' }}>Wiki</Link>
          <Link href="/graph" className="transition-colors hover:brightness-125" style={{ color: 'var(--glyph-fade)' }}>Graph</Link>
          <Link href="/edges" className="transition-colors hover:brightness-125" style={{ color: 'var(--glyph-fade)' }}>Edges</Link>
        </nav>
      </div>
    </header>
  );
}


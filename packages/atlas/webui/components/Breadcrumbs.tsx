import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-xs" style={{ color: 'var(--fg-3)' }} aria-label="Breadcrumb">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          {c.href ? (
            <Link href={c.href} className="hover:underline" style={{ color: 'var(--fg-3)' }}>
              {c.label}
            </Link>
          ) : (
            <span style={{ color: 'var(--fg)' }}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

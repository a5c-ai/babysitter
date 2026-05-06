"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (t && t.isContentEditable)) return;
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="relative w-full max-w-md"
    >
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--fg-3)' }} />
      <Input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search records  (press / )"
        className="pl-8"
        aria-label="Search records"
      />
    </form>
  );
}

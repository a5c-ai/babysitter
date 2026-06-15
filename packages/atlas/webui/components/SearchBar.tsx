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
      className="atlas-searchbar"
    >
      <Search className="atlas-searchbar__icon" />
      <Input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search atlas records, pages, and node kinds"
        className="atlas-searchbar__input"
        aria-label="Search records"
      />
      <span className="atlas-searchbar__shortcut">/</span>
    </form>
  );
}
